// FHWA Traffic Camera Sources Scraper
// Pulls the official list of traffic/camera sources from FHWA (Federal Highway Administration)
// Run: node server/scripts/fhwa_scrape.mjs
// Output: server/data/fhwa_sources.json, server/data/fhwa_sources.csv

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DATA_DIR = join(__dirname, "..", "data");

const ROOT = "https://highways.dot.gov/traffic-info";

function uniq(arr) {
  return [...new Set(arr)];
}

function extractLinks(html, baseUrl) {
  const out = [];
  const re = /href="([^"]+)"/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    let u = (m[1] || "").trim();
    if (!u) continue;
    if (u.startsWith("/")) u = new URL(u, baseUrl).toString();
    if (u.startsWith("http")) out.push(u);
  }
  return uniq(out);
}

function looksUseful(url) {
  return /511|traffic|camera|cctv|traveler|incident|closure|crash|accident|road|highway|dot|smartway|gis|arcgis/i.test(url);
}

function tagUrl(url) {
  if (/arcgis|gis/i.test(url)) return "gis";
  if (/camera|cctv/i.test(url)) return "camera";
  if (/incident|crash|accident|closure/i.test(url)) return "incident_or_closure";
  if (/511|traveler|traffic|smartway/i.test(url)) return "traveler_or_traffic";
  return "other";
}

function stateNameFromFhwaUrl(statePageUrl) {
  try {
    const last = new URL(statePageUrl).pathname.split("/").filter(Boolean).pop() || "";
    const cleaned = last
      .replace(/-traffic-information$/i, "")
      .replace(/[-_]/g, " ")
      .trim()
      .replace(/\b\w/g, (c) => c.toUpperCase());
    return cleaned || "Unknown";
  } catch {
    return "Unknown";
  }
}

function csvEscape(val) {
  const s = String(val ?? "");
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

async function fetchHtml(url) {
  const res = await fetch(url, { 
    redirect: "follow",
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.5",
      "Cache-Control": "no-cache"
    }
  });
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return await res.text();
}

async function main() {
  console.log("Starting FHWA traffic sources scrape...");
  console.log(`Root: ${ROOT}`);
  
  mkdirSync(DATA_DIR, { recursive: true });

  const rootHtml = await fetchHtml(ROOT);
  const rootLinks = extractLinks(rootHtml, ROOT);

  const fhwaStatePages = rootLinks.filter((u) =>
    /highways\.dot\.gov\/ops\/traffic-info\//i.test(u)
  );

  console.log(`Found ${fhwaStatePages.length} FHWA state/territory pages`);

  const results = [];
  const csvRows = [];
  csvRows.push(["state_name", "state_abbrev", "fhwa_state_page", "tag", "url", "scraped_utc"].join(","));

  for (const statePage of fhwaStatePages) {
    console.log(`Scraping: ${statePage}`);
    
    try {
      const html = await fetchHtml(statePage);
      const scrapedUtc = new Date().toISOString();
      const stateName = stateNameFromFhwaUrl(statePage);
      const stateAbbrev = getStateAbbreviation(stateName);

      const links = extractLinks(html, statePage)
        .filter(looksUseful)
        .map((url) => ({ url, tag: tagUrl(url) }));

      results.push({
        state_name: stateName,
        state_abbrev: stateAbbrev,
        fhwa_state_page: statePage,
        sources: links,
        last_scraped_utc: scrapedUtc,
      });

      for (const src of links) {
        csvRows.push([
          csvEscape(stateName),
          csvEscape(stateAbbrev),
          csvEscape(statePage),
          csvEscape(src.tag),
          csvEscape(src.url),
          csvEscape(scrapedUtc),
        ].join(","));
      }
    } catch (error) {
      console.error(`Error scraping ${statePage}:`, error.message);
    }
    
    await new Promise(r => setTimeout(r, 500));
  }

  const jsonPath = join(DATA_DIR, "fhwa_sources.json");
  const csvPath = join(DATA_DIR, "fhwa_sources.csv");

  writeFileSync(jsonPath, JSON.stringify(results, null, 2));
  writeFileSync(csvPath, csvRows.join("\n"));

  console.log(`\nDone!`);
  console.log(`- ${jsonPath} (${results.length} FHWA state/territory pages)`);
  console.log(`- ${csvPath} (${csvRows.length - 1} source rows)`);

  const summary = {
    total_states: results.length,
    total_sources: results.reduce((sum, r) => sum + r.sources.length, 0),
    by_tag: {},
    by_state: {}
  };

  for (const r of results) {
    summary.by_state[r.state_name] = r.sources.length;
    for (const s of r.sources) {
      summary.by_tag[s.tag] = (summary.by_tag[s.tag] || 0) + 1;
    }
  }

  console.log("\nSummary:");
  console.log(`  Total states/territories: ${summary.total_states}`);
  console.log(`  Total sources: ${summary.total_sources}`);
  console.log("  By tag:", summary.by_tag);
}

function getStateAbbreviation(stateName) {
  const map = {
    "Alabama": "AL", "Alaska": "AK", "Arizona": "AZ", "Arkansas": "AR",
    "California": "CA", "Colorado": "CO", "Connecticut": "CT", "Delaware": "DE",
    "District Of Columbia": "DC", "Florida": "FL", "Georgia": "GA", "Hawaii": "HI",
    "Idaho": "ID", "Illinois": "IL", "Indiana": "IN", "Iowa": "IA",
    "Kansas": "KS", "Kentucky": "KY", "Louisiana": "LA", "Maine": "ME",
    "Maryland": "MD", "Massachusetts": "MA", "Michigan": "MI", "Minnesota": "MN",
    "Mississippi": "MS", "Missouri": "MO", "Montana": "MT", "Nebraska": "NE",
    "Nevada": "NV", "New Hampshire": "NH", "New Jersey": "NJ", "New Mexico": "NM",
    "New York": "NY", "North Carolina": "NC", "North Dakota": "ND", "Ohio": "OH",
    "Oklahoma": "OK", "Oregon": "OR", "Pennsylvania": "PA", "Puerto Rico": "PR",
    "Rhode Island": "RI", "South Carolina": "SC", "South Dakota": "SD",
    "Tennessee": "TN", "Texas": "TX", "Utah": "UT", "Vermont": "VT",
    "Virginia": "VA", "Washington": "WA", "West Virginia": "WV", "Wisconsin": "WI",
    "Wyoming": "WY"
  };
  return map[stateName] || "";
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
