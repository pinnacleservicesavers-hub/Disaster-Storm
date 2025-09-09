// server.js
import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

async function reverseGeocode(lat, lon) {
  const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`, {
    headers: { "User-Agent": "StormOpsHub/1.0" }
  });
  const j = await r.json().catch(() => null);
  return j?.display_name || "";
}

// simple in-memory store; swap for a DB later
const inbox = [];

app.post("/api/dsp-ingest", async (req, res) => {
  const item = req.body || {};
  if (!item.mediaUrl) return res.status(400).json({ error: "mediaUrl required" });

  if (!item.address && item.lat && item.lon) {
    item.address = await reverseGeocode(item.lat, item.lon);
  }
  item.id = Date.now().toString();
  inbox.unshift(item);

  // TODO: broadcast to clients via SSE or WebSocket; for now just 200 OK
  return res.json({ ok: true, item });
});

app.get("/api/inbox", (req, res) => res.json(inbox));

app.listen(process.env.PORT || 3000, () => console.log("Server up"));