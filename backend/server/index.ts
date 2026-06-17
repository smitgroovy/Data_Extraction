import express from "express";
import multer from "multer";
import cors from "cors";
import path from "path";
import fs from "fs";
import { exec } from "child_process";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..", "..");

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const dataDir = path.join(rootDir, "data");
const uploadDir = path.join(dataDir, "upload");
const activitiesDir = path.join(dataDir, "activities");
const billingDir = path.join(dataDir, "billing");
const studentsDir = path.join(dataDir, "students");

fs.mkdirSync(uploadDir, { recursive: true });
fs.mkdirSync(activitiesDir, { recursive: true });
fs.mkdirSync(billingDir, { recursive: true });
fs.mkdirSync(studentsDir, { recursive: true });
// Clean up any leftover temp _run-* files from previous sessions
fs.readdirSync(dataDir)
  .filter((f) => f.startsWith("_run-"))
  .forEach((f) => fs.unlinkSync(path.join(dataDir, f)));

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
    `start "Extraction" cmd /c "cd /d \"${rootDir}\" && opencode --agent \"${agentName}\" --prompt \"${prompt}\" & del /f \"${filePath}\""`
  );
  child.on("error", () => {
    // terminal failed to open — non-critical, extraction can still be done manually
  });
}

app.post("/api/extract/activities", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    openTerminal("extract-activities", req.file.path, "activities");
    return res.json({
      success: true,
      message: `Extraction started in new terminal — opencode agent "extract-activities" is processing ${req.file.originalname}`,
      file: req.file.path,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/extracted/activities", (_req, res) => {
  try {
    const files = fs
      .readdirSync(activitiesDir)
      .filter((f) => f.endsWith(".json"))
      .sort()
      .reverse();

    const allRecords: any[] = [];
    const seenIds = new Set<string>();
    for (const file of files) {
      const raw = fs.readFileSync(path.join(activitiesDir, file), "utf-8").replace(/^\uFEFF/, "");
      const content = JSON.parse(raw);
      const records = Array.isArray(content) ? content : (content && Array.isArray(content.records) ? content.records : []);
      for (const rec of records) {
        if (rec.id && seenIds.has(rec.id)) continue;
        if (rec.id) seenIds.add(rec.id);
        allRecords.push(rec);
      }
    }

    res.json({
      files,
      records: allRecords,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

function extractHandler(agentName: string, category: string) {
  return async (req: any, res: any) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }
      openTerminal(agentName, req.file.path, category);
      return res.json({
        success: true,
        message: `Extraction started in new terminal — opencode agent "${agentName}" is processing ${req.file.originalname}`,
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

app.post("/api/extract/billing", upload.single("file"), extractHandler("extract-billing", "billing"));
app.post("/api/extract/students", upload.single("file"), extractHandler("extract-students", "students"));
app.get("/api/extracted/billing", extractedHandler(billingDir));
app.get("/api/extracted/students", extractedHandler(studentsDir));

app.listen(PORT, () => {
  console.log(`\n  Extraction API running on http://localhost:${PORT}`);
  console.log(`  Upload temp:    ${uploadDir}`);
  console.log(`  Activities out: ${activitiesDir}`);
  console.log(`  Billing out:    ${billingDir}`);
  console.log(`  Students out:   ${studentsDir}\n`);
});
