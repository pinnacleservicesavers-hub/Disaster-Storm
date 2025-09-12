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

/**
 * Helper function to validate and sanitize XML content before parsing
 */
function isValidXmlContent(content) {
  if (!content || typeof content !== 'string') return false;
  
  // Check for basic XML structure indicators
  const xmlStartPattern = /^\s*<[?!]?[a-zA-Z]/;
  if (!xmlStartPattern.test(content)) return false;
  
  // Check for obvious binary content indicators
  const binaryIndicators = /[\x00-\x08\x0B\x0C\x0E-\x1F]/;
  if (binaryIndicators.test(content)) return false;
  
  // Check for basic XML tag structure
  const tagPattern = /<\/?[a-zA-Z][^>]*>/;
  if (!tagPattern.test(content)) return false;
  
  return true;
}

/**
 * Helper function to sanitize XML content by removing problematic characters
 */
function sanitizeXmlContent(content) {
  if (!content) return '';
  
  // Remove null bytes and other problematic control characters
  let sanitized = content.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');
  
  // Remove any potential BOM characters
  sanitized = sanitized.replace(/^\uFEFF/, '');
  
  // Trim whitespace
  sanitized = sanitized.trim();
  
  return sanitized;
}

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
    const processingStats = {
      totalKmlFiles: 0,
      successfullyParsed: 0,
      failedParsing: 0,
      emptyFiles: 0,
      invalidXml: 0
    };

    for (const entry of entries) {
      if (!entry.entryName.toLowerCase().endsWith(".kml")) continue;
      
      processingStats.totalKmlFiles++;
      console.log(`🔍 Processing KML file: ${entry.entryName}`);
      
      try {
        // Get raw content
        const rawContent = entry.getData().toString("utf8");
        
        // Check if file is empty
        if (!rawContent.trim()) {
          console.log(`⚠️  Empty KML file: ${entry.entryName}`);
          processingStats.emptyFiles++;
          continue;
        }
        
        // Validate XML content before processing
        if (!isValidXmlContent(rawContent)) {
          console.log(`❌ Invalid XML content in: ${entry.entryName}`);
          processingStats.invalidXml++;
          continue;
        }
        
        // Sanitize the content
        const sanitizedContent = sanitizeXmlContent(rawContent);
        
        if (!sanitizedContent) {
          console.log(`⚠️  No content after sanitization: ${entry.entryName}`);
          processingStats.emptyFiles++;
          continue;
        }
        
        // Create a custom error handler for xmldom
        const errorHandler = {
          warning: (msg) => {
            console.log(`⚠️  XML Warning in ${entry.entryName}: ${msg}`);
          },
          error: (msg) => {
            console.log(`❌ XML Error in ${entry.entryName}: ${msg}`);
            throw new Error(`XML parsing error: ${msg}`);
          },
          fatalError: (msg) => {
            console.log(`💥 XML Fatal Error in ${entry.entryName}: ${msg}`);
            throw new Error(`XML fatal error: ${msg}`);
          }
        };
        
        // Try to parse the XML with error handling
        const kmlDom = new XmldomDOMParser({ errorHandler }).parseFromString(sanitizedContent, "text/xml");
        
        // Check if parsing resulted in a valid document
        if (!kmlDom || !kmlDom.documentElement) {
          console.log(`❌ Failed to create valid DOM for: ${entry.entryName}`);
          processingStats.failedParsing++;
          continue;
        }
        
        // Convert to GeoJSON
        const geoJson = tj.kml(kmlDom, { styles: true });
        
        if (geoJson?.type === "FeatureCollection" && Array.isArray(geoJson.features)) {
          allFeatures.push(...geoJson.features);
          processingStats.successfullyParsed++;
          console.log(`✅ Successfully processed ${entry.entryName}: ${geoJson.features.length} features`);
        } else {
          console.log(`⚠️  No valid GeoJSON features in: ${entry.entryName}`);
          processingStats.successfullyParsed++; // Still counts as successful parsing
        }
        
      } catch (kmlError) {
        // Individual KML file processing failed, but continue with others
        console.log(`❌ Failed to process ${entry.entryName}: ${kmlError.message}`);
        processingStats.failedParsing++;
        continue;
      }
    }
    
    console.log(`📊 KML Processing Summary:
    - Total KML files: ${processingStats.totalKmlFiles}
    - Successfully parsed: ${processingStats.successfullyParsed}
    - Failed parsing: ${processingStats.failedParsing}
    - Empty files: ${processingStats.emptyFiles}
    - Invalid XML: ${processingStats.invalidXml}
    - Total features extracted: ${allFeatures.length}`);
    
    res.json({ 
      type: "FeatureCollection", 
      features: allFeatures,
      metadata: {
        processingStats,
        totalFeatures: allFeatures.length,
        source: kmzUrl,
        processedAt: new Date().toISOString()
      }
    });
    
  } catch (err) {
    console.error(`💥 Critical error in NHC KMZ processing: ${err.message}`);
    res.status(500).json({ 
      error: String(err),
      message: "Failed to process NHC KMZ data",
      fallback: {
        type: "FeatureCollection",
        features: [],
        metadata: {
          error: true,
          errorMessage: err.message
        }
      }
    });
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