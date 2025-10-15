import crypto from "crypto";
import express from "express";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOC = path.join(__dirname, "..", "data", "locations.json");

async function readLocations() {
  try {
    return JSON.parse(await fs.readFile(LOC, "utf-8"));
  } catch {
    return [];
  }
}

function verifySlack(req: any, rawBody: string): boolean {
  const secret = process.env.SLACK_SIGNING_SECRET || "";
  const ts = req.headers["x-slack-request-timestamp"];
  const sig = req.headers["x-slack-signature"];
  
  if (!secret || !ts || !sig) return false;
  
  // Reject old requests (>5 min)
  if (Math.abs(Date.now() / 1000 - Number(ts)) > 60 * 5) return false;
  
  const base = `v0:${ts}:${rawBody}`;
  const mySig = "v0=" + crypto.createHmac("sha256", secret).update(base).digest("hex");
  
  try {
    return crypto.timingSafeEqual(Buffer.from(mySig), Buffer.from(String(sig)));
  } catch {
    return false;
  }
}

async function getImpact(base: string, lat: number, lng: number) {
  const u = new URL("/api/impact", base);
  u.searchParams.set("lat", String(lat));
  u.searchParams.set("lng", String(lng));
  u.searchParams.set("pollen", "1");
  
  const response = await fetch(u.toString());
  if (!response.ok) throw new Error("Impact fetch failed");
  return response.json();
}

export function mountSlack(app: express.Application) {
  // We need the raw body to verify Slack signature
  const raw = express.raw({ type: "*/*" });
  
  app.post("/api/slack/command", raw, async (req, res) => {
    const body = req.body?.toString("utf8") || "";
    
    if (!verifySlack(req, body)) {
      return res.status(401).send("invalid signature");
    }

    // Slack sends application/x-www-form-urlencoded
    const params = new URLSearchParams(body);
    const text = (params.get("text") || "").trim();
    const base = process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get("host")}`;

    const reply = async (text: string) => 
      res.json({ response_type: "in_channel", text });

    // /dd list
    if (/^list/i.test(text)) {
      const rows = await readLocations();
      if (!rows.length) {
        return reply("No locations saved. Add some via the app.");
      }
      
      // Fetch impacts sequentially to keep usage low
      const lines: string[] = [];
      for (const r of rows.slice(0, 20)) {
        try {
          const j = await getImpact(base, r.lat, r.lng);
          const s = Math.round(j.impactScore || 0);
          const tag = s >= 70 ? "HIGH" : s >= 40 ? "ELEV" : "LOW";
          lines.push(`• ${r.name} (${r.id}) – ${s} (${tag})`);
        } catch {
          lines.push(`• ${r.name} (${r.id}) – n/a`);
        }
      }
      return reply(lines.join("\n"));
    }

    // /dd impact <id>  OR  /dd impact <lat,lng>
    const m = text.match(/^impact\s+(.+)$/i);
    if (m) {
      const arg = m[1].trim();
      const byCoord = arg.match(/^\s*(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)\s*$/);
      let lat: number, lng: number, label = "";
      
      if (byCoord) {
        lat = Number(byCoord[1]);
        lng = Number(byCoord[2]);
        label = `${lat.toFixed(3)},${lng.toFixed(3)}`;
      } else {
        const rows = await readLocations();
        const hit = rows.find((x: any) => x.id.toLowerCase() === arg.toLowerCase());
        if (!hit) {
          return reply(`Unknown location id "${arg}". Try /dd list`);
        }
        lat = hit.lat;
        lng = hit.lng;
        label = `${hit.name} (${hit.id})`;
      }
      
      try {
        const j = await getImpact(base, lat, lng);
        const s = Math.round(j.impactScore || 0);
        const tag = s >= 70 ? "HIGH" : s >= 40 ? "ELEV" : "LOW";
        return reply(`Impact at ${label}: *${s}* (${tag})`);
      } catch {
        return reply(`Could not fetch impact for ${label}`);
      }
    }

    // Help
    return reply([
      "*Disaster Direct* commands:",
      "• `/dd list` – list saved locations with Impact",
      "• `/dd impact <id>` – Impact for a saved location",
      "• `/dd impact <lat,lng>` – Impact for any coordinates",
    ].join("\n"));
  });
}
