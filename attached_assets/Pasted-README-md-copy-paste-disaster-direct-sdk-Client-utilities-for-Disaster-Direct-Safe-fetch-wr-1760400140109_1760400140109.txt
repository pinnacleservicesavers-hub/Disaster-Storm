README.md (copy-paste)
# @disaster-direct/sdk

Client utilities for Disaster Direct:
- Safe fetch wrapper with retries + `Retry-After`
- `getImpact(baseUrl, lat, lng, pollen?)`
- Map tile helpers (unsigned template) and HMAC-friendly signing flow for Mapbox/Leaflet
- Works with your Disaster Direct proxy (Ambee key stays server-side)

## Install

```bash
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

// Impact example
const res = await getImpact("https://api.your-domain.com", 33.749, -84.388, true);
if (res.ok) {
  console.log("Impact:", res.data.impactScore);
} else {
  console.warn(res.userMessage);
}

// Unsigned tiles (CDN-friendly)
const template = makeUnsignedTileTemplate(
  "/api/impact/tiles/{z}/{x}/{y}.png",
  { pollen: 1, grid: 3, scheme: "viridis", ttl: 180 }
);

// HMAC mode (optional): backend provides /api/sign/tile and /api/sign/legend
const transformRequest = makeMapboxTransformRequest("", "/api/sign/tile");
const legendUrl = await getLegendUrl("", { scheme: "traffic" }, /*hmac*/ true);

Mapbox GL (snippet)
const map = new mapboxgl.Map({ container: "map", style: "empty" });
map.on("load", async () => {
  map.addSource("impact", { type: "raster", tiles: [template], tileSize: 256 });
  map.addLayer({ id: "impact", type: "raster", source: "impact" });

  // If HMAC is ON, add: transformRequest: makeMapboxTransformRequest()
});

Leaflet (snippet)
const template = makeUnsignedTileTemplate("/api/impact/tiles/{z}/{x}/{y}.png", {
  pollen: 1, grid: 3, scheme: "traffic", ttl: 180
});
L.tileLayer(template, { tileSize: 256 }).addTo(map);

API

apiFetch(url, options) → typed result with ok, userMessage, retryAfterSec support

getImpact(baseUrl, lat, lng, pollen?)

makeUnsignedTileTemplate(path, query) → tile URL template

makeMapboxTransformRequest(baseUrl?, signEndpoint?) → Mapbox GL signer hook

getLegendUrl(baseUrl?, opts?, hmac=false)

Errors

All errors follow a consistent shape:

{ "error": "…", "details": "…", "code": 401, "requestId": "…" }


Client maps common statuses (401/403/429/5xx) to friendly messages and respects Retry-After.

License

MIT


---

# 2-Minute npm Publish Checklist

1) **Pick the package name**
   - If the npm scope `@disaster-direct` is yours → keep `"name": "@disaster-direct/sdk"`.
   - Otherwise change to `"name": "disaster-direct-sdk"` in `package.json`.

2) **Login & build**
   ```bash
   cd disaster-direct-sdk
   npm login
   npm install
   npm run build


Publish (public)

npm version 0.1.0
npm publish --access public


Install anywhere:

npm i @disaster-direct/sdk


Tag & push (optional but recommended)

git init
git add .
git commit -m "init: @disaster-direct/sdk 0.1.0"
git tag v0.1.0
# git remote add origin https://github.com/your-org/disaster-direct-sdk.git
# git push -u origin main --tags


Next releases

Bugfix: npm version patch && npm publish

Feature: npm version minor && npm publish

Breaking: npm version major && npm publish

Common gotchas (fast fixes)

“You do not have permission to publish under this scope”
→ Change "name" to an unscoped name (disaster-direct-sdk) or use a scope you own.

“Package name already taken”
→ Try a variant: @disaster-direct/client or disaster-direct-client.

Private by accident
→ Ensure --access public on first publish of a scoped package.

Types not found
→ Confirm "types": "./dist/index.d.ts" and that dist/index.d.ts exists after build.