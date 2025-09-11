import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import AdmZip from "adm-zip";
import { DOMParser as XmldomDOMParser } from "xmldom";
import tj from "togeojson";
import path from "path";
import { fileURLToPath } from "url";
// ADD near the other imports
import { parseStringPromise } from "xml2js";

const app = express();
const PORT = process.env.PORT || 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.static(path.join(__dirname, "public"))); // serves /public

app.get("/", (_req, res) => {
  res.type("text").send("Storm Data backend is running.");
});

/** NDBC buoy realtime text -> parsed JSON */
app.get("/api/ndbc/:station", async (req, res) => {
  const { station } = req.params;
  const url = `https://www.ndbc.noaa.gov/data/realtime2/${station}.txt`;
  try {
    const r = await fetch(url, { headers: { "User-Agent": "SLM-StormApp/1.0" } });
    if (!r.ok) throw new Error(`NDBC fetch failed: ${r.status}`);
    const text = await r.text();
    const lines = text.split("\n").filter((ln) => ln.trim().length > 0);
    const headerIdx = lines.findIndex((ln) => ln.startsWith("#YY"));
    if (headerIdx === -1) return res.json({ station, raw: text, parsed: null });

    const colLine = lines[headerIdx].replace(/^#\s*/, "");
    const cols = colLine.split(/\s+/);
    const dataLine = lines[headerIdx + 1];
    const vals = dataLine.split(/\s+/);
    const record = {};
    cols.forEach((c, i) => (record[c] = vals[i]));

    const parsed = {
      station,
      timeUTC: `${record.YY}-${record.MM}-${record.DD} ${record.hh}:${record.mm}Z`,
      WDIR_deg: record.WDIR,
      WSPD_mps: record.WSPD,
      GST_mps: record.GST,
      WVHT_m: record.WVHT,
      DPD_sec: record.DPD,
      APD_sec: record.APD,
      MWD_deg: record.MWD,
      PRES_hPa: record.PRES,
      ATMP_C: record.ATMP,
      WTMP_C: record.WTMP,
      DEWP_C: record.DEPW ?? record.DEWP
    };
    res.json({ station, columns: cols, record: parsed, raw: text });
  } catch (err) {
    res.status(500).json({ error: String(err), station });
  }
});

/**
 * Active NDBC stations → JSON, optional bbox filter:
 * GET /api/ndbc/stations?bbox=west,south,east,north
 * Data source: https://www.ndbc.noaa.gov/activestations.xml
 */
app.get("/api/ndbc/stations", async (req, res) => {
  const bbox = (req.query.bbox || "").toString().split(",").map(Number);
  const hasBbox = bbox.length === 4 && bbox.every(n => Number.isFinite(n));
  const [west, south, east, north] = bbox;

  try {
    const r = await fetch("https://www.ndbc.noaa.gov/activestations.xml", {
      headers: { "User-Agent": "SLM-StormApp/1.0" }
    });
    if (!r.ok) throw new Error(`NDBC stations fetch failed: ${r.status}`);
    const xml = await r.text();
    const parsed = await parseStringPromise(xml, { explicitArray: false });

    const items = (parsed?.stations?.station || [])
      .map(s => ({
        id: s.$.id,
        name: s.$.name,
        lat: Number(s.$.lat),
        lon: Number(s.$.lng),
        owner: s.$.owner,
        pgm: s.$.pgm,   // program
        type: s.$.type  // "buoy", "fixed", etc.
      }))
      .filter(s => Number.isFinite(s.lat) && Number.isFinite(s.lon));

    const filtered = hasBbox
      ? items.filter(s =>
          s.lon >= west && s.lon <= east &&
          s.lat >= south && s.lat <= north)
      : items;

    // Light trim: we only need id / name / lat / lon client-side
    res.json(filtered);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

/** NHC active storms KMZ -> merged GeoJSON */
app.get("/api/nhc/activeGeoJSON", async (_req, res) => {
  const kmzUrl = "https://www.nhc.noaa.gov/gis/kml/nhc.kmz";
  try {
    const r = await fetch(kmzUrl, { headers: { "User-Agent": "SLM-StormApp/1.0" } });
    if (!r.ok) throw new Error(`NHC KMZ fetch failed: ${r.status}`);
    const buf = Buffer.from(await r.arrayBuffer());
    const zip = new AdmZip(buf);
    const entries = zip.getEntries();

    const allFeatures = [];
    for (const e of entries) {
      if (!e.entryName.toLowerCase().endsWith(".kml")) continue;
      const kmlText = e.getData().toString("utf8");
      const kmlDom = new XmldomDOMParser().parseFromString(kmlText, "text/xml");
      const gj = tj.kml(kmlDom, { styles: true });
      if (gj?.type === "FeatureCollection" && Array.isArray(gj.features)) {
        allFeatures.push(...gj.features);
      }
    }
    res.json({ type: "FeatureCollection", features: allFeatures });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

/** NWS Alerts proxy (e.g., tropical warnings) */
app.get("/api/nws/alerts", async (req, res) => {
  const qs = new URLSearchParams(req.query);
  const url = `https://api.weather.gov/alerts?${qs.toString()}`;
  try {
    const r = await fetch(url, { headers: { "User-Agent": "SLM-StormApp/1.0" } });
    if (!r.ok) throw new Error(`NWS alerts fetch failed: ${r.status}`);
    const data = await r.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

/** Vortex Data Message quick parser */
app.get("/api/nhc/vdm", async (req, res) => {
  const { url } = Object.fromEntries(new URLSearchParams(req.url.split("?")[1] || ""));
  if (!url) return res.status(400).json({ error: "Provide ?url=<VDM_text_url>" });
  try {
    const r = await fetch(url, { headers: { "User-Agent": "SLM-StormApp/1.0" } });
    if (!r.ok) throw new Error(`VDM fetch failed: ${r.status}`);
    const text = await r.text();

    const minPress = /MIN PRES(?:\s+)?(\d{3,4})\s*MB/i.exec(text)?.[1] || null;
    const maxSfcWindKt = /MAX SFC WIND(?:\s+)?(\d+)\s*KT/i.exec(text)?.[1] || null;
    const maxFlightLvlKt = /MAX FLT LVL WIND(?:[^0-9]+)?(\d+)\s*KT/i.exec(text)?.[1] || null;
    const eyeTempC = /EYE TEMP(?:[^0-9\-]+)?(-?\d+)\s*C/i.exec(text)?.[1] || null;

    res.json({
      source: url,
      minPressure_mb: minPress ? Number(minPress) : null,
      maxSurfaceWind_kt: maxSfcWindKt ? Number(maxSfcWindKt) : null,
      maxFlightLevelWind_kt: maxFlightLvlKt ? Number(maxFlightLvlKt) : null,
      eyeTemp_C: eyeTempC ? Number(eyeTempC) : null,
      raw: text
    });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on http://0.0.0.0:${PORT}`);
});