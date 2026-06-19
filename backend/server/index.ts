import 'dotenv/config';
import mysql from 'mysql2/promise';
import express from "express";
import multer from "multer";
import cors from "cors";
import path from "path";
import fs from "fs";
import { spawn } from "child_process";
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

function formatDbError(err: any): string {
  const code = err?.code || (Array.isArray(err?.errors) ? err.errors[0]?.code : undefined);
  if (code === "ECONNREFUSED") {
    return "Database connection refused at localhost:3306. Start MySQL and retry.";
  }
  if (code === "ER_ACCESS_DENIED_ERROR") {
    return "MySQL credentials are invalid. Check DB_USER/DB_PASSWORD and retry.";
  }
  if (code === "ER_BAD_DB_ERROR") {
    return "Database does not exist and could not be created.";
  }
  if (typeof err?.message === "string" && err.message.trim()) {
    return err.message;
  }
  if (Array.isArray(err?.errors) && err.errors.length > 0) {
    const nested = err.errors
      .map((e: any) => (typeof e?.message === "string" && e.message.trim() ? e.message : e?.code))
      .filter(Boolean)
      .join("; ");
    if (nested) return nested;
  }
  return "Unknown database error";
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
    console.error('  Database init skipped:', formatDbError(err));
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

function openTerminal(filePath: string, category: string): void {
  const escapeForCmd = (value: string) => value.replace(/"/g, '""');
  const safeRootDir = escapeForCmd(rootDir);
  const safeFilePath = escapeForCmd(filePath);
  const safeCategory = escapeForCmd(category);
  const fileExt = path.extname(filePath).toLowerCase();
  const isImageInput = [".png", ".jpg", ".jpeg", ".webp", ".bmp", ".gif", ".tif", ".tiff"].includes(fileExt);
  const extractMdPath = `agents/${category}/extract.md`;
  const rulesMdPath = `agents/${category}/rules.md`;
  const prompt = [
    `Read and follow ${extractMdPath} and ${rulesMdPath} strictly.`,
    `Extract ${category} data from file: ${filePath}.`,
    `Write output JSON to data/${category}/extracted-${Date.now()}.json.`,
    `Do not ask questions. Complete extraction now.`,
  ].join(" ");
  const safePrompt = escapeForCmd(prompt);
  const terminalTitle = `Codex Extraction - ${category}`;
  const codexImageArg = isImageInput ? ` -i "${safeFilePath}"` : "";
  // Launch Codex the same way users open it manually (interactive mode with initial prompt).
  const codexCommand = `codex -C "${safeRootDir}"${codexImageArg} "${safePrompt}"`;
  const runScriptPath = path.join(dataDir, `_run-${category}-${Date.now()}.cmd`);
  const script = [
    "@echo off",
    `title ${safeCategory} Extraction`,
    `cd /d "${safeRootDir}"`,
    "if errorlevel 1 (",
    "  echo ERROR: Unable to switch to project directory.",
    "  goto end",
    ")",
    "echo ================================================",
    `echo Starting ${safeCategory} extraction...`,
    "echo ================================================",
    "where codex >nul 2>nul",
    "if errorlevel 1 (",
    "  echo ERROR: codex CLI not found in PATH.",
    "  goto end",
    ")",
    codexCommand,
    "set \"EXIT_CODE=%ERRORLEVEL%\"",
    "if \"%EXIT_CODE%\"==\"0\" (",
    `  if exist "${safeFilePath}" del /f "${safeFilePath}" >nul 2>nul`,
    `  echo Extraction completed for ${safeCategory}.`,
    ") else (",
    `  echo Extraction failed for ${safeCategory} with exit code %EXIT_CODE%.`,
    ")",
    ":end",
    "echo.",
    "echo Press any key to close this window...",
    "pause >nul",
  ].join("\r\n");
  fs.writeFileSync(runScriptPath, script, "utf-8");

  // Launch a separate terminal window and keep it open until the script ends.
  const child = spawn("cmd.exe", ["/c", "start", terminalTitle, "cmd.exe", "/k", runScriptPath], {
    cwd: rootDir,
    detached: true,
    stdio: "ignore",
    windowsHide: false,
  });
  child.unref();
  child.on("error", (err) => {
    console.error("Failed to launch extraction terminal:", err.message);
  });
}

function extractHandler(category: string) {
  return async (req: any, res: any) => {
    try {
      if (!req.file) return res.status(400).json({ error: "No file uploaded" });
      openTerminal(req.file.path, category);
      return res.json({
        success: true,
        message: `Extraction started in a new terminal`,
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
      res.json({ files, records: allRecords, warnings: allWarnings.length > 0 ? allWarnings : undefined });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };
}

// --- Existing endpoints (unchanged) ---
app.post("/api/extract/activities", upload.single("file"), extractHandler("activities"));
app.post("/api/extract/billing", upload.single("file"), extractHandler("billing"));
app.post("/api/extract/students", upload.single("file"), extractHandler("students"));

app.get("/api/extracted/activities", extractedHandler(activitiesDir));
app.get("/api/extracted/billing", extractedHandler(billingDir));
app.get("/api/extracted/students", extractedHandler(studentsDir));

app.delete("/api/extracted/:category", (req, res) => {
  try {
    const { category } = req.params;
    const categoryDirMap: Record<string, string> = {
      activities: activitiesDir,
      billing: billingDir,
      students: studentsDir,
    };
    const categoryDir = categoryDirMap[category];
    if (!categoryDir) {
      return res.status(400).json({ error: "Invalid category" });
    }

    const files = fs.readdirSync(categoryDir).filter((f) => f.endsWith(".json"));
    let deleted = 0;

    for (const file of files) {
      try {
        fs.unlinkSync(path.join(categoryDir, file));
        deleted++;
      } catch {}
    }

    res.json({ success: true, deleted, files });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

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
  let conn: any;
  try {
    const { providerName, records } = req.body;
    if (!providerName || !providerName.trim()) {
      return res.status(400).json({ error: "Provider name is required" });
    }
    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ error: "No records provided" });
    }

    const providerId = providerName.trim().toLowerCase().replace(/\s+/g, '-');
    conn = await pool.getConnection();

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
    conn = null;

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
    const message = formatDbError(err);
    console.error("  Preview save failed:", message);
    res.status(500).json({ error: message });
  } finally {
    if (conn) conn.release();
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
        s.name as student,
        s.activity_name as activityName,
        COALESCE(a.description, '') as description,
        COALESCE(a.category, '') as category,
        COALESCE(b.billing_plan, s.billing_plan, '') as billingPlan,
        b.billing_amount as billingAmount
      FROM students s
      JOIN providers p ON p.id = s.provider_id
      LEFT JOIN activities a ON a.provider_id = s.provider_id AND a.name = s.activity_name
      LEFT JOIN billing_plans b ON b.provider_id = s.provider_id AND b.activity_name = s.activity_name AND b.billing_plan = s.billing_plan
      WHERE s.provider_id = ?
      ORDER BY s.name ASC
    `, [id]);

    conn.release();

    // Format billing amount with ₹ symbol for display
    const formatted = (rows as any[]).map((r, idx) => ({
      id: `row-${idx}`,
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
