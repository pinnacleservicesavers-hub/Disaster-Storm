import express from "express";
import fetch from "node-fetch";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { requireRole } from "../middleware/bearerAuth.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CFG = path.join(__dirname, "..", "data", "alerts.json");
const LOC = path.join(__dirname, "..", "data", "locations.json");

async function readAlertsCfg() {
  try {
    return JSON.parse(await fs.readFile(CFG, "utf-8"));
  } catch {
    return { defaultThreshold: 70, webhookUrl: "" };
  }
}

async function writeAlertsCfg(cfg: any) {
  await fs.mkdir(path.dirname(CFG), { recursive: true });
  await fs.writeFile(CFG, JSON.stringify(cfg, null, 2));
}

async function readLocations() {
  try {
    return JSON.parse(await fs.readFile(LOC, "utf-8"));
  } catch {
    return [];
  }
}

async function getImpact(base: string, lat: number, lng: number) {
  const u = new URL("/api/impact", base);
  u.searchParams.set("lat", String(lat));
  u.searchParams.set("lng", String(lng));
  u.searchParams.set("pollen", "1");
  const r = await fetch(u.toString());
  return r.json();
}

async function postWebhook(url: string, body: any) {
  const isSlack = /slack\.com\/api|hooks\.slack\.com/.test(url);
  const payload = isSlack
    ? { text: body.summary, attachments: [{ color: body.color, fields: body.fields }] }
    : body;
  return fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function mountAlerts(app: express.Application) {
  const r = express.Router();

  r.get("/config", async (_, res) => res.json(await readAlertsCfg()));

  r.put("/config", requireRole("ADMIN"), express.json(), async (req, res) => {
    const { defaultThreshold, webhookUrl } = req.body || {};
    if (!webhookUrl) return res.status(400).json({ error: "webhookUrl required" });
    const cfg = await readAlertsCfg();
    if (Number.isFinite(defaultThreshold)) cfg.defaultThreshold = Number(defaultThreshold);
    cfg.webhookUrl = webhookUrl;
    await writeAlertsCfg(cfg);
    res.json({ ok: true });
  });

  r.put("/toggle/:id", requireRole("ADMIN"), express.json(), async (req, res) => {
    const id = req.params.id;
    const { alert, threshold } = req.body || {};
    const rows = await readLocations();
    const i = rows.findIndex((x: any) => x.id === id);
    if (i < 0) return res.status(404).json({ error: "location not found" });
    if (typeof alert === "boolean") rows[i].alert = alert;
    if (threshold === null) delete rows[i].threshold;
    if (Number.isFinite(threshold)) rows[i].threshold = Number(threshold);
    await fs.writeFile(LOC, JSON.stringify(rows, null, 2));
    res.json({ ok: true });
  });

  r.post("/check", requireRole("ADMIN"), async (req, res) => {
    const base = process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get("host")}`;
    const cfg = await readAlertsCfg();
    const rows = await readLocations();
    const active = rows.filter((r: any) => r.alert);
    const hits = [];
    for (const loc of active) {
      try {
        const j: any = await getImpact(base, loc.lat, loc.lng);
        const score = Math.round(j.impactScore || 0);
        hits.push({ id: loc.id, name: loc.name, score });
        const th = Number.isFinite(loc.threshold) ? loc.threshold : cfg.defaultThreshold ?? 70;
        if (cfg.webhookUrl && score >= th) {
          const color = score >= th + 10 ? "#d61f1f" : "#f59e0b";
          await postWebhook(cfg.webhookUrl, {
            summary: `⚠️ ${loc.name}: Impact ${score} (≥ ${th})`,
            color,
            fields: [
              { title: "Location", value: `${loc.lat.toFixed(3)}, ${loc.lng.toFixed(3)}`, short: true },
              { title: "Score", value: String(score), short: true },
            ],
            raw: { loc, score, threshold: th },
          });
        }
      } catch {}
    }
    res.json({ ok: true, checked: active.length, results: hits });
  });

  app.use("/api/alerts", r);

  const pollSec = Number(process.env.ALERT_POLL_SEC || 0);
  if (pollSec > 0) {
    const timer = setInterval(async () => {
      try {
        const base = process.env.PUBLIC_BASE_URL || "http://localhost:3001";
        const cfg = await readAlertsCfg();
        const rows = await readLocations();
        const active = rows.filter((r: any) => r.alert);
        for (const loc of active) {
          try {
            const j: any = await getImpact(base, loc.lat, loc.lng);
            const score = Math.round(j.impactScore || 0);
            const th = Number.isFinite(loc.threshold) ? loc.threshold : cfg.defaultThreshold ?? 70;
            if (cfg.webhookUrl && score >= th) {
              const color = score >= th + 10 ? "#d61f1f" : "#f59e0b";
              await postWebhook(cfg.webhookUrl, {
                summary: `⚠️ ${loc.name}: Impact ${score} (≥ ${th})`,
                color,
                fields: [
                  { title: "Location", value: `${loc.lat.toFixed(3)}, ${loc.lng.toFixed(3)}`, short: true },
                  { title: "Score", value: String(score), short: true },
                ],
              });
            }
          } catch {}
        }
      } catch (e) {
        console.error("alerts poller error:", e);
      }
    }, pollSec * 1000);
    if (timer.unref) timer.unref();
  }
}
