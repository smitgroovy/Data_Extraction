import 'dotenv/config';
import mysql from 'mysql2/promise';
import express from "express";
import multer from "multer";
import cors from "cors";
import path from "path";
import fs from "fs";
import { exec } from "child_process";
import { fileURLToPath } from "url";
import pool from "./db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..", "..");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

const dataDir = path.join(rootDir, "data");
const uploadDir = path.join(dataDir, "upload");
const activitiesDir = path.join(dataDir, "activities");
const billingDir = path.join(dataDir, "billing");
const studentsDir = path.join(dataDir, "students");
const providerRegistryPath = path.join(dataDir, "_provider_registry.json");

function ensureDir(dir: string) {
  fs.mkdirSync(dir, { recursive: true });
}
ensureDir(uploadDir);
ensureDir(activitiesDir);
ensureDir(billingDir);
ensureDir(studentsDir);

// Clean up leftover temp files
fs.readdirSync(dataDir)
  .filter((f) => f.startsWith("_run-"))
  .forEach((f) => fs.unlinkSync(path.join(dataDir, f)));
// Clean up upload files older than 1 hour
const ONE_HOUR = 60 * 60 * 1000;
const now = Date.now();
fs.readdirSync(uploadDir).forEach((f) => {
  const filePath = path.join(uploadDir, f);
  try {
    const stats = fs.statSync(filePath);
    if (now - stats.mtimeMs > ONE_HOUR) {
      fs.unlinkSync(filePath);
    }
  } catch {}
});

// --- Provider Registry (for extraction enrichment) ---
interface ProviderMapping {
  sourcePattern: string;
  providerName: string;
  providerId: string;
  timestamp: number;
}

function readProviderRegistry(): ProviderMapping[] {
  try {
    if (fs.existsSync(providerRegistryPath)) {
      return JSON.parse(fs.readFileSync(providerRegistryPath, 'utf-8'));
    }
  } catch {}
  return [];
}

function writeProviderRegistry(registry: ProviderMapping[]) {
  fs.writeFileSync(providerRegistryPath, JSON.stringify(registry, null, 2), 'utf-8');
}

function registerProviderMapping(filePath: string, providerName: string, providerId: string) {
  const registry = readProviderRegistry();
  const fileName = path.basename(filePath);
  const filtered = registry.filter(r => r.sourcePattern !== fileName);
  filtered.push({ sourcePattern: fileName, providerName, providerId, timestamp: Date.now() });
  writeProviderRegistry(filtered);
}

function injectProviderInfo(records: any[]): any[] {
  const registry = readProviderRegistry();
  return records.map(rec => {
    const source = rec.source || '';
    const mapping = registry.find(r => source.includes(r.sourcePattern));
    if (mapping) {
      return { ...rec, providerName: mapping.providerName, providerId: mapping.providerId };
    }
    return rec;
  });
}

// --- Database init (Normalized Schema) ---
async function initDatabase() {
  try {
    const tempConn = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
    });
    await tempConn.execute(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || 'onboarding'}\``);
    await tempConn.end();

    const conn = await pool.getConnection();

    await conn.execute(`
      CREATE TABLE IF NOT EXISTS providers (
        id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await conn.execute(`
      CREATE TABLE IF NOT EXISTS activities (
        id VARCHAR(255) PRIMARY KEY,
        provider_id VARCHAR(100) NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (provider_id) REFERENCES providers(id),
        INDEX idx_activities_provider (provider_id)
      )
    `);

    await conn.execute(`
      CREATE TABLE IF NOT EXISTS billing_plans (
        id VARCHAR(255) PRIMARY KEY,
        provider_id VARCHAR(100) NOT NULL,
        activity_name VARCHAR(255) NOT NULL,
        billing_plan VARCHAR(100) NOT NULL,
        billing_amount DECIMAL(10,2) DEFAULT 0,
        currency VARCHAR(10) DEFAULT 'INR',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (provider_id) REFERENCES providers(id),
        INDEX idx_billing_provider (provider_id)
      )
    `);

    await conn.execute(`
      CREATE TABLE IF NOT EXISTS students (
        id VARCHAR(255) PRIMARY KEY,
        provider_id VARCHAR(100) NOT NULL,
        name VARCHAR(255) NOT NULL,
        activity_name VARCHAR(255) NOT NULL,
        billing_plan VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (provider_id) REFERENCES providers(id),
        INDEX idx_students_provider (provider_id)
      )
    `);

    conn.release();
    console.log('  Normalized tables ready (providers, activities, billing_plans, students)');
  } catch (err: any) {
    console.error('  Database init skipped:', err.message);
  }
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ts = Date.now();
    cb(null, `${ts}_${file.originalname}`);
  },
});

const upload = multer({ storage });

function openTerminal(agentName: string, filePath: string, category: string): void {
  const prompt = `Extract ${category} from ${filePath} and save JSON output to data/${category}/`;
  const child = exec(
    `start "Extraction" cmd /c "cd /d \"${rootDir}\" && opencode --agent \"${agentName}\" --prompt \"${prompt}\" && del /f \"${filePath}\""`
  );
  child.on("error", () => {});
}

function extractHandler(agentName: string, category: string) {
  return async (req: any, res: any) => {
    try {
      if (!req.file) return res.status(400).json({ error: "No file uploaded" });
      const providerName = req.body?.providerName || "Unknown Provider";
      const providerId = providerName.toLowerCase().replace(/\s+/g, '-');
      registerProviderMapping(req.file.path, providerName, providerId);
      openTerminal(agentName, req.file.path, category);
      return res.json({
        success: true,
        message: `Extraction started for ${providerName}`,
        file: req.file.path,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };
}

function extractedHandler(categoryDir: string) {
  return (_req: any, res: any) => {
    try {
      const files = fs
        .readdirSync(categoryDir)
        .filter((f) => f.endsWith(".json"))
        .sort()
        .reverse();
      const allRecords: any[] = [];
      const allWarnings: string[] = [];
      const seenIds = new Set<string>();
      for (const file of files) {
        const raw = fs.readFileSync(path.join(categoryDir, file), "utf-8").replace(/^\uFEFF/, "");
        const content = JSON.parse(raw);
        const records = Array.isArray(content) ? content : (content && Array.isArray(content.records) ? content.records : []);
        for (const rec of records) {
          if (rec.id && seenIds.has(rec.id)) continue;
          if (rec.id) seenIds.add(rec.id);
          allRecords.push(rec);
        }
        if (content && Array.isArray(content.warnings)) {
          allWarnings.push(...content.warnings);
        }
      }
      const enriched = injectProviderInfo(allRecords);
      res.json({ files, records: enriched, warnings: allWarnings.length > 0 ? allWarnings : undefined });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };
}

// --- Existing endpoints (unchanged) ---
app.post("/api/extract/activities", upload.single("file"), extractHandler("extract-activities", "activities"));
app.post("/api/extract/billing", upload.single("file"), extractHandler("extract-billing", "billing"));
app.post("/api/extract/students", upload.single("file"), extractHandler("extract-students", "students"));

app.get("/api/extracted/activities", extractedHandler(activitiesDir));
app.get("/api/extracted/billing", extractedHandler(billingDir));
app.get("/api/extracted/students", extractedHandler(studentsDir));

app.delete("/api/uploads/:filename", (req, res) => {
  try {
    const filePath = path.join(uploadDir, req.params.filename);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: "File not found" });
    fs.unlinkSync(filePath);
    res.json({ success: true, deleted: req.params.filename });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- Normalized Save: accepts { providerName, records (joined preview rows) } ---
// Upserts provider, then stores activities, billing_plans, students separately
app.post("/api/preview/save", async (req, res) => {
  try {
    const { providerName, records } = req.body;
    if (!providerName || !providerName.trim()) {
      return res.status(400).json({ error: "Provider name is required" });
    }
    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ error: "No records provided" });
    }

    const providerId = providerName.trim().toLowerCase().replace(/\s+/g, '-');
    const conn = await pool.getConnection();

    // Upsert provider
    await conn.execute(
      'INSERT INTO providers (id, name) VALUES (?, ?) ON DUPLICATE KEY UPDATE name = VALUES(name)',
      [providerId, providerName.trim()]
    );

    // Normalize: extract unique activities
    const activityMap = new Map<string, { name: string; description: string; category: string }>();
    for (const rec of records) {
      const key = rec.activityName || '';
      if (key && !activityMap.has(key)) {
        activityMap.set(key, {
          name: key,
          description: rec.description || '',
          category: rec.category || '',
        });
      }
    }
    for (const [_, act] of activityMap) {
      const actId = `act-${providerId}-${act.name.toLowerCase().replace(/\s+/g, '-')}`;
      await conn.execute(
        `INSERT INTO activities (id, provider_id, name, description, category)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE description = VALUES(description), category = VALUES(category)`,
        [actId, providerId, act.name, act.description, act.category]
      );
    }

    // Normalize: extract unique billing plans
    const billMap = new Map<string, { activityName: string; billingPlan: string; billingAmount: number }>();
    for (const rec of records) {
      const key = `${rec.activityName || ''}||${rec.billingPlan || ''}`;
      if (key && !billMap.has(key)) {
        const amount = typeof rec.billingAmount === 'string'
          ? parseFloat(rec.billingAmount.replace(/[₹$]/g, '').trim()) || 0
          : (rec.billingAmount || 0);
        billMap.set(key, {
          activityName: rec.activityName || '',
          billingPlan: rec.billingPlan || '',
          billingAmount: amount,
        });
      }
    }
    for (const [_, bp] of billMap) {
      const bpId = `bill-${providerId}-${bp.activityName.toLowerCase().replace(/\s+/g, '-')}-${bp.billingPlan.toLowerCase().replace(/\s+/g, '-')}`;
      await conn.execute(
        `INSERT INTO billing_plans (id, provider_id, activity_name, billing_plan, billing_amount)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE billing_amount = VALUES(billing_amount)`,
        [bpId, providerId, bp.activityName, bp.billingPlan, bp.billingAmount]
      );
    }

    // Normalize: store all students
    const stuStmt = `INSERT INTO students (id, provider_id, name, activity_name, billing_plan)
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE activity_name = VALUES(activity_name), billing_plan = VALUES(billing_plan)`;

    let studentCount = 0;
    for (const rec of records) {
      const studentName = rec.student || '';
      if (!studentName) continue;
      const stuId = `stu-${providerId}-${studentName.toLowerCase().replace(/\s+/g, '-')}-${(rec.activityName || '').toLowerCase().replace(/\s+/g, '-')}`;
      await conn.execute(stuStmt, [
        stuId,
        providerId,
        studentName,
        rec.activityName || '',
        rec.billingPlan || '',
      ]);
      studentCount++;
    }

    conn.release();

    // Clean up extracted JSON files — data is now safely in MySQL
    let deletedCount = 0;
    for (const dir of [activitiesDir, billingDir, studentsDir]) {
      const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
      for (const f of files) {
        try {
          fs.unlinkSync(path.join(dir, f));
          deletedCount++;
        } catch {}
      }
    }
    if (deletedCount > 0) {
      console.log(`  Cleaned up ${deletedCount} JSON extraction file(s) after saving to DB`);
    }

    // Also clear the provider registry since it's no longer needed
    try {
      if (fs.existsSync(providerRegistryPath)) {
        fs.unlinkSync(providerRegistryPath);
      }
    } catch {}

    res.json({
      success: true,
      providerName: providerName.trim(),
      providerId,
      activitiesCount: activityMap.size,
      billingPlansCount: billMap.size,
      studentsCount: studentCount,
      cleanedFiles: deletedCount,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- Providers: list all with counts ---
app.get("/api/providers", async (_req, res) => {
  try {
    const conn = await pool.getConnection();
    const [rows] = await conn.execute(`
      SELECT
        p.id,
        p.name,
        p.created_at,
        (SELECT COUNT(*) FROM students s WHERE s.provider_id = p.id) as student_count,
        (SELECT COUNT(*) FROM activities a WHERE a.provider_id = p.id) as activity_count,
        (SELECT COUNT(*) FROM billing_plans b WHERE b.provider_id = p.id) as billing_plan_count
      FROM providers p
      ORDER BY p.created_at DESC
    `);
    conn.release();
    res.json({ providers: rows });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- Provider Preview: joined data for a specific provider ---
app.get("/api/providers/:id/preview", async (req, res) => {
  try {
    const { id } = req.params;
    const conn = await pool.getConnection();

    // Verify provider exists
    const [provRows] = await conn.execute('SELECT * FROM providers WHERE id = ?', [id]) as any[];
    if (provRows.length === 0) {
      conn.release();
      return res.status(404).json({ error: 'Provider not found' });
    }
    const provider = provRows[0];

    // Join students → activities → billing_plans to reconstruct the preview view
    const [rows] = await conn.execute(`
      SELECT
        CONCAT(s.id, '-preview') as id,
        s.name as student,
        s.activity_name as activityName,
        COALESCE(a.description, '') as description,
        COALESCE(a.category, '') as category,
        COALESCE(b.billing_plan, s.billing_plan, '') as billingPlan,
        b.billing_amount as billingAmount,
        p.name as providerName,
        p.id as providerId
      FROM students s
      JOIN providers p ON p.id = s.provider_id
      LEFT JOIN activities a ON a.provider_id = s.provider_id AND a.name = s.activity_name
      LEFT JOIN billing_plans b ON b.provider_id = s.provider_id AND b.activity_name = s.activity_name AND b.billing_plan = s.billing_plan
      WHERE s.provider_id = ?
      ORDER BY s.name ASC
    `, [id]);

    conn.release();

    // Format billing amount with ₹ symbol for display
    const formatted = (rows as any[]).map(r => ({
      ...r,
      billingAmount: r.billingAmount != null ? `₹${r.billingAmount}` : '-',
    }));

    res.json({ provider, records: formatted });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- Start server ---
app.listen(PORT, async () => {
  await initDatabase();
  console.log(`\n  Extraction API running on http://localhost:${PORT}`);
  console.log(`  Upload temp:    ${uploadDir}`);
  console.log(`  Activities out:  ${activitiesDir}`);
  console.log(`  Billing out:     ${billingDir}`);
  console.log(`  Students out:    ${studentsDir}\n`);
});
