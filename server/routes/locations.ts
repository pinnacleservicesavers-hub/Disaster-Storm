import express from "express";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import { requireBearer } from "../middleware/bearerAuth.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.join(__dirname, "..", "data", "locations.json");
const upload = multer({ storage: multer.memoryStorage() });

async function ensureFile() {
  try { await fs.mkdir(path.dirname(DATA), { recursive: true }); } catch {}
  try { await fs.access(DATA); } catch { await fs.writeFile(DATA, JSON.stringify([], null, 2)); }
}

async function readAll() {
  await ensureFile();
  return JSON.parse(await fs.readFile(DATA, "utf-8"));
}

async function writeAll(rows: any[]) {
  await fs.writeFile(DATA, JSON.stringify(rows, null, 2));
}

// CSV helpers
function toCsv(rows: any[] = []) {
  const head = ["id", "name", "lat", "lng", "alert", "threshold"];
  const lines = [head.join(",")];
  for (const x of rows) {
    lines.push([
      x.id,
      x.name,
      x.lat,
      x.lng,
      x.alert ? "true" : "false",
      Number.isFinite(x.threshold) ? x.threshold : ""
    ].join(","));
  }
  return lines.join("\n");
}

function parseCsvWithValidation(text: string = ""): { data: any[], errors: string[] } {
  const errors: string[] = [];
  const data: any[] = [];
  const seenIds = new Set<string>();
  
  const [h, ...rows] = text.split(/\r?\n/).filter(Boolean);
  if (!h) {
    errors.push("Missing header row");
    return { data, errors };
  }
  
  const head = h.split(",").map(s => s.trim().toLowerCase());
  const idx = (k: string) => head.findIndex(x => x === k);
  const I = {
    id: idx("id"),
    name: idx("name"),
    lat: idx("lat"),
    lng: idx("lng"),
    alert: idx("alert"),
    threshold: idx("threshold")
  };
  
  if (I.id < 0 || I.name < 0 || I.lat < 0 || I.lng < 0) {
    errors.push("Missing required columns: id, name, lat, lng");
    return { data, errors };
  }
  
  rows.forEach((line, i) => {
    const rowNum = i + 2;
    const c = line.split(",").map(s => s.trim());
    const id = c[I.id];
    const name = c[I.name];
    const lat = Number(c[I.lat]);
    const lng = Number(c[I.lng]);
    
    if (!id) {
      errors.push(`Row ${rowNum}: Missing id`);
      return;
    }
    if (!name) {
      errors.push(`Row ${rowNum}: Missing name`);
      return;
    }
    if (!Number.isFinite(lat)) {
      errors.push(`Row ${rowNum}: Invalid latitude (must be a number)`);
      return;
    }
    if (lat < -90 || lat > 90) {
      errors.push(`Row ${rowNum}: Invalid latitude (must be -90 to 90)`);
      return;
    }
    if (!Number.isFinite(lng)) {
      errors.push(`Row ${rowNum}: Invalid longitude (must be a number)`);
      return;
    }
    if (lng < -180 || lng > 180) {
      errors.push(`Row ${rowNum}: Invalid longitude (must be -180 to 180)`);
      return;
    }
    if (seenIds.has(id)) {
      errors.push(`Row ${rowNum}: Duplicate location ID '${id}'`);
      return;
    }
    
    seenIds.add(id);
    const alert = I.alert >= 0 ? (c[I.alert] === "1" || /true/i.test(c[I.alert])) : false;
    const thr = I.threshold >= 0 ? Number(c[I.threshold]) : undefined;
    const row: any = { id, name, lat, lng, alert };
    if (Number.isFinite(thr)) row.threshold = thr;
    data.push(row);
  });
  
  return { data, errors };
}

export function mountLocations(app: express.Application) {
  const r = express.Router();

  // List all locations
  r.get("/", async (_, res) => res.json(await readAll()));

  // CSV export (public) - changed from /export.csv to /export
  r.get("/export", async (_req, res) => {
    const rows = await readAll();
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="locations.csv"');
    res.send(toCsv(rows));
  });

  // CSV import (protected) - changed from /import.csv to /import with multipart upload
  r.post("/import", requireBearer, upload.single("file"), async (req, res) => {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        imported: 0,
        errors: ["No file uploaded. Use multipart form data with 'file' field."]
      });
    }
    
    const csvText = req.file.buffer.toString('utf-8');
    const { data, errors } = parseCsvWithValidation(csvText);
    
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        imported: 0,
        errors
      });
    }
    
    if (data.length === 0) {
      return res.status(400).json({
        success: false,
        imported: 0,
        errors: ["No valid rows found in CSV"]
      });
    }
    
    const current = await readAll();
    const byId = new Map(current.map((x: any) => [x.id, x]));
    for (const row of data) {
      byId.set(row.id, row);
    }
    const merged = Array.from(byId.values());
    await writeAll(merged);
    
    res.json({
      success: true,
      imported: data.length,
      errors: []
    });
  });

  // Create location (protected)
  r.post("/", requireBearer, express.json(), async (req, res) => {
    const { id, name, lat, lng, alert = false, threshold } = req.body || {};
    if (!id || !name || !Number.isFinite(lat) || !Number.isFinite(lng)) {
      return res.status(400).json({ error: "id, name, lat, lng required" });
    }
    const rows = await readAll();
    if (rows.some((x: any) => x.id === id)) {
      return res.status(409).json({ error: "id exists" });
    }
    const row: any = { id, name, lat, lng, alert: !!alert };
    if (Number.isFinite(threshold)) row.threshold = Number(threshold);
    rows.push(row);
    await writeAll(rows);
    res.status(201).json({ ok: true });
  });

  // Update location (protected)
  r.put("/:id", requireBearer, express.json(), async (req, res) => {
    const rows = await readAll();
    const i = rows.findIndex((x: any) => x.id === req.params.id);
    if (i < 0) return res.status(404).json({ error: "not found" });
    const { name, lat, lng, alert, threshold } = req.body || {};
    if (name !== undefined) rows[i].name = name;
    if (Number.isFinite(lat)) rows[i].lat = lat;
    if (Number.isFinite(lng)) rows[i].lng = lng;
    if (typeof alert === "boolean") rows[i].alert = alert;
    if (threshold === null) delete rows[i].threshold;
    if (Number.isFinite(threshold)) rows[i].threshold = Number(threshold);
    await writeAll(rows);
    res.json({ ok: true });
  });

  // Delete location (protected)
  r.delete("/:id", requireBearer, async (req, res) => {
    const rows = await readAll();
    const next = rows.filter((x: any) => x.id !== req.params.id);
    await writeAll(next);
    res.json({ ok: true, removed: rows.length - next.length });
  });

  app.use("/api/locations", r);
}
