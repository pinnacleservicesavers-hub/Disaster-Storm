import express from "express";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { requireBearer } from "../middleware/bearerAuth.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.join(__dirname, "..", "data", "locations.json");

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
      x.alert ? 1 : 0,
      Number.isFinite(x.threshold) ? x.threshold : ""
    ].join(","));
  }
  return lines.join("\n");
}

function parseCsv(text: string = "") {
  const [h, ...rows] = text.split(/\r?\n/).filter(Boolean);
  if (!h) return [];
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
  const out: any[] = [];
  rows.forEach((line, i) => {
    const c = line.split(",").map(s => s.trim());
    const id = I.id >= 0 ? c[I.id] : `row-${i + 1}`;
    const name = c[I.name];
    const lat = Number(c[I.lat]);
    const lng = Number(c[I.lng]);
    if (!id || !name || !Number.isFinite(lat) || !Number.isFinite(lng)) return;
    const alert = I.alert >= 0 ? (c[I.alert] === "1" || /true/i.test(c[I.alert])) : false;
    const thr = I.threshold >= 0 ? Number(c[I.threshold]) : undefined;
    const row: any = { id, name, lat, lng, alert };
    if (Number.isFinite(thr)) row.threshold = thr;
    out.push(row);
  });
  return out;
}

export function mountLocations(app: express.Application) {
  const r = express.Router();

  // List all locations
  r.get("/", async (_, res) => res.json(await readAll()));

  // CSV export (public)
  r.get("/export.csv", async (_req, res) => {
    const rows = await readAll();
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="locations.csv"');
    res.send(toCsv(rows));
  });

  // CSV import (protected - upserts)
  r.post("/import.csv", requireBearer, express.text({ type: "text/*" }), async (req, res) => {
    const incoming = parseCsv(req.body || "");
    if (!incoming.length) {
      return res.status(400).json({
        error: "No valid rows. Expect header: id,name,lat,lng[,alert,threshold]"
      });
    }
    const current = await readAll();
    const byId = new Map(current.map((x: any) => [x.id, x]));
    for (const row of incoming) {
      byId.set(row.id, row); // upsert
    }
    const merged = Array.from(byId.values());
    await writeAll(merged);
    res.json({ ok: true, count: merged.length });
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
