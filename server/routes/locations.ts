import express from "express";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

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

export function mountLocations(app: express.Application) {
  const r = express.Router();

  r.get("/", async (_, res) => res.json(await readAll()));

  r.post("/", express.json(), async (req, res) => {
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

  r.put("/:id", express.json(), async (req, res) => {
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

  r.delete("/:id", async (req, res) => {
    const rows = await readAll();
    const next = rows.filter((x: any) => x.id !== req.params.id);
    await writeAll(next);
    res.json({ ok: true, removed: rows.length - next.length });
  });

  app.use("/api/locations", r);
}
