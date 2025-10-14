Perfect 👍 — here’s a README.md adjusted so everything points to localhost or your Replit URL for now. Later, you can replace those with your real domain once you set one up.

@disaster-direct/sdk

Client utilities for Disaster Direct:

Safe fetch wrapper with retries + Retry-After

getImpact(baseUrl, lat, lng, pollen?)

Map tile helpers (unsigned template) and HMAC-friendly signing flow for Mapbox/Leaflet

Works with your Disaster Direct proxy (Ambee key stays server-side)

Install
npm i @disaster-direct/sdk
# or
pnpm add @disaster-direct/sdk

Quick start
import {
  getImpact,
  makeUnsignedTileTemplate,
  makeMapboxTransformRequest,
  getLegendUrl
} from "@disaster-direct/sdk";

// When running locally:
const baseUrl = "http://localhost:3001";

// Or if hosted on Replit:
/// e.g. "https://disaster-direct.username.repl.co"
// const baseUrl = "https://your-replit-app.repl.co";

// Impact API call
const res = await getImpact(baseUrl, 33.749, -84.388, true);
if (res.ok) {
  console.log("Impact:", res.data.impactScore);
} else {
  console.warn(res.userMessage);
}

// Unsigned tile template (good for local testing)
const template = makeUnsignedTileTemplate(
  `${baseUrl}/api/impact/tiles/{z}/{x}/{y}.png`,
  { pollen: 1, grid: 3, scheme: "viridis", ttl: 180 }
);

// Legend image (unsigned mode here)
const legendUrl = await getLegendUrl(baseUrl, { scheme: "traffic" }, false);

Mapbox GL (example)
const map = new mapboxgl.Map({ container: "map", style: "empty" });

map.on("load", async () => {
  map.addSource("impact", {
    type: "raster",
    tiles: [template],
    tileSize: 256
  });
  map.addLayer({ id: "impact", type: "raster", source: "impact" });

  // If HMAC is ON, add: transformRequest: makeMapboxTransformRequest(baseUrl, "/api/sign/tile")
});

Leaflet (example)
const template = makeUnsignedTileTemplate(`${baseUrl}/api/impact/tiles/{z}/{x}/{y}.png`, {
  pollen: 1, grid: 3, scheme: "traffic", ttl: 180
});
L.tileLayer(template, { tileSize: 256 }).addTo(map);

Errors

Errors follow a consistent shape:

{ "error": "…", "details": "…", "code": 401, "requestId": "…" }


The SDK maps common statuses (401/403/429/5xx) to friendly messages and respects Retry-After.

License

MIT

👉 With this README, you can run locally or on Replit without worrying about a domain yet. When you buy one later, just replace baseUrl with https://api.yourdomain.com.