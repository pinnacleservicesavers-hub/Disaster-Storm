import express from "express";
import fetch from "node-fetch";

async function tileXY(lng: number, lat: number, z: number) {
  const n = 2 ** z;
  const xtile = Math.floor(((lng + 180) / 360) * n);
  const ytile = Math.floor(
    ((1 - Math.log(Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)) / Math.PI) / 2) * n
  );
  return { x: xtile, y: ytile };
}

export function mountWarm(app: express.Application) {
  app.use("/api/warm", async (req, res) => {
    try {
      const base = process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get("host")}`;
      const rows = JSON.parse((req.query.rows as string) || "[]");
      const zooms = ((req.query.zooms as string) || "8,9,10")
        .split(",")
        .map((z) => Number(z.trim()))
        .filter((z) => Number.isFinite(z));
      const radius = Number(req.query.radius || 1);
      const pollen = req.query.pollen === "0" ? "0" : "1";
      const grid = (req.query.grid as string) || "6";
      const ttl = (req.query.ttl as string) || "300";

      const hits = [];
      for (const { lat, lng } of rows) {
        const impactURL = `${base}/api/impact?lat=${lat}&lng=${lng}&pollen=${pollen}`;
        try {
          await fetch(impactURL).then((r) => r.text());
          hits.push({ type: "impact", lat, lng, ok: true });
        } catch {
          hits.push({ type: "impact", lat, lng, ok: false });
        }

        for (const z of zooms) {
          const { x, y } = await tileXY(lng, lat, z);
          for (let dx = -radius; dx <= radius; dx++) {
            for (let dy = -radius; dy <= radius; dy++) {
              const url = `${base}/api/impact/tiles/${z}/${x + dx}/${y + dy}.png?pollen=${pollen}&grid=${grid}&ttl=${ttl}`;
              try {
                await fetch(url).then((r) => r.arrayBuffer());
                hits.push({ type: "tile", z, x: x + dx, y: y + dy, ok: true });
              } catch {
                hits.push({ type: "tile", z, x: x + dx, y: y + dy, ok: false });
              }
            }
          }
        }
      }
      res.json({ ok: true, hits });
    } catch (e) {
      res.status(500).json({ ok: false, error: String(e) });
    }
  });
}
