# @disaster-direct/sdk

Client utilities for Disaster Direct:
- Safe fetch wrapper with retries + `Retry-After`
- `getImpact(baseUrl, lat, lng, pollen?)`
- Tile/legend helpers for Mapbox/Leaflet
- Optional HMAC support via backend signing endpoints

## Install
```bash
npm i @disaster-direct/sdk
# or
pnpm add @disaster-direct/sdk
```

## Usage (React)
```ts
import { getImpact, makeUnsignedTileTemplate, makeMapboxTransformRequest, getLegendUrl } from "@disaster-direct/sdk";

const res = await getImpact("https://api.your-domain.com", 33.749, -84.388, true);
if (res.ok) console.log(res.data.impactScore);
```

**Tiles (unsigned):**
```ts
const template = makeUnsignedTileTemplate("/api/impact/tiles/{z}/{x}/{y}.png", { pollen: 1, grid: 3, scheme: "viridis", ttl: 180 });
```

**Tiles (HMAC signed via /api/sign/tile):**
```ts
const transformRequest = makeMapboxTransformRequest("", "/api/sign/tile");
```

**Legend:**
```ts
const url = await getLegendUrl("", { scheme: "traffic", width: 256, height: 48, bg: "solid" }, /*hmac*/ true);
```

## Types
Fully typed; ESM + CJS exports.

## License
MIT
