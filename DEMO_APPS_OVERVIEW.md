# Disaster Direct Map Demos Overview

We've built three front-end demo apps, all powered by the **@disaster-direct/sdk (v0.1.3)**. Each demo integrates our impact tiles, legend, and impact score API on an interactive map.

---

## 1. Leaflet Demo

**Tech:** React + Leaflet

### Pros:
- ✅ Very lightweight and simple
- ✅ No tokens or accounts needed
- ✅ Easy to customize popups, markers, overlays

### Cons:
- ⚠️ Raster-only (no vector maps)
- ⚠️ Limited advanced styling

### When to use:
- Simple dashboards
- Token-free deployments
- Quick PoCs

**Port:** 5173  
**Location:** `/disaster-direct-leaflet-demo/`

---

## 2. Mapbox GL Demo

**Tech:** React + Mapbox GL

### Features:
- 🎯 **Basemap toggle:** OSM raster or Blank
- 🔐 **HMAC signing toggle:** tests secured tile endpoints (`/api/sign/tile`, `/api/sign/legend`)

### Pros:
- ✅ High-performance rendering, vector support
- ✅ Full ecosystem (styles, layers, expressions)
- ✅ Production-ready for rich apps

### Cons:
- ⚠️ Requires a Mapbox token if using Mapbox-hosted basemaps (though our raster tiles don't)

### When to use:
- Richer client apps
- Need for advanced styling & interactivity
- Secure signed tiles (production)

**Port:** 5176  
**Location:** `/disaster-direct-mapbox-demo/`

---

## 3. MapLibre GL Demo

**Tech:** React + MapLibre GL (open-source fork of Mapbox GL)

### Features:
- 🌍 **Basemap toggle:** OSM raster or Blank
- 🆓 **Token-free**

### Pros:
- ✅ 100% open source
- ✅ No API keys needed for OSM raster
- ✅ Compatible with Mapbox styles

### Cons:
- ⚠️ Slightly smaller ecosystem than Mapbox

### When to use:
- Fully open-source stack
- Avoid external token dependencies
- Drop-in replacement for Mapbox GL without cost

**Port:** 5175  
**Location:** `/disaster-direct-maplibre-demo/`

---

## Decision Matrix

| Feature / Need | Leaflet | Mapbox GL | MapLibre GL |
|----------------|---------|-----------|-------------|
| **Ease of setup** | ✅ easiest | ⚪ medium | ⚪ medium |
| **Token-free** | ✅ | ⚪ (if OSM only) | ✅ |
| **Basemap toggle (OSM/Blank)** | ⚪ | ✅ | ✅ |
| **HMAC signing integration** | ⚪ | ✅ | ⚪ (can add) |
| **Raster overlay** | ✅ | ✅ | ✅ |
| **Vector layers & advanced styles** | ⚪ | ✅ | ✅ |
| **Open source / no vendor lock-in** | ⚪ | ⚪ | ✅ |

---

## Recommendation

| Use Case | Recommended Demo |
|----------|------------------|
| **Quick tests / dashboards** | 🚀 Leaflet |
| **Production apps (tokens OK)** | 🎯 Mapbox GL |
| **Open-source, token-free production** | 🌍 MapLibre GL |

---

## Quick Start

👉 Each demo zip is ready to `npm install && npm run dev`  
👉 All detect `defaultBaseUrl` automatically (localhost in dev, `*.repl.co` in Replit)

### Run All Demos

```bash
# Leaflet Demo
cd disaster-direct-leaflet-demo
npm install && npm run dev  # http://localhost:5173

# Mapbox GL Demo (Dual Toggles)
cd disaster-direct-mapbox-demo
npm install && npm run dev  # http://localhost:5176

# MapLibre GL Demo (Open Source)
cd disaster-direct-maplibre-demo
npm install && npm run dev  # http://localhost:5175
```

---

## Backend Requirements

All demos require your **Disaster Direct backend** running on `http://localhost:3001`:

**Required Endpoints:**
- `GET /api/impact?lat={lat}&lng={lng}&pollen={0|1}` - Impact score
- `GET /api/impact/tiles/{z}/{x}/{y}.png` - Raster tiles
- `GET /api/legend.png` - Legend image

**Optional (Mapbox HMAC only):**
- `GET /api/sign/tile?z={z}&x={x}&y={y}&fmt={fmt}` - Tile signing
- `GET /api/sign/legend?scheme={s}&width={w}&height={h}` - Legend signing

---

## Common Features Across All Demos

✅ Auto baseUrl detection (localhost / Replit)  
✅ Live impact scores (0-100)  
✅ Draggable marker for location selection  
✅ Dynamic legend display  
✅ Pollen data toggle  
✅ TypeScript + React 18 + Vite 5  
✅ Production-ready code

---

## Demo Comparison Summary

| Demo | Library | Rendering | Basemap Toggle | HMAC Toggle | Cost | Best For |
|------|---------|-----------|----------------|-------------|------|----------|
| **Leaflet** | Leaflet 1.9 | Canvas 2D | ❌ | ❌ | Free | Learning |
| **Mapbox GL** | Mapbox GL 3.7 | WebGL | ✅ | ✅ | Free* | Full-featured |
| **MapLibre GL** | MapLibre GL 4.7 | WebGL | ✅ | ❌ | Free | Open source |

*Using OSM/blank styles (no Mapbox token required)

---

## 📦 SDK Information

**Version:** @disaster-direct/sdk v0.1.3  
**Tests:** 8 passing (4 error handling + 4 legend helpers)  
**Location:** `/disaster-direct-sdk/`

**Key Functions:**
```typescript
import {
  defaultBaseUrl,              // Auto-detect API endpoint
  getImpact,                   // Fetch impact scores
  makeUnsignedTileTemplate,    // Create tile URLs
  getLegendUrl,                // Generate legend URLs
  makeMapboxTransformRequest   // Auto-sign tiles (Mapbox only)
} from '@disaster-direct/sdk'
```

---

## 📚 Documentation

**SDK Docs:**
- `disaster-direct-sdk/SETUP.md` - Setup and publishing guide
- `disaster-direct-sdk/QUICK_START.md` - Fast deployment
- `disaster-direct-sdk/EXAMPLES.md` - 10+ usage examples

**Demo READMEs:**
- `disaster-direct-leaflet-demo/README.md` - Leaflet integration
- `disaster-direct-mapbox-demo/README.md` - Dual toggle guide
- `disaster-direct-maplibre-demo/README.md` - OSM basemap guide

**Summaries:**
- `DEMO_APPS_OVERVIEW.md` - This one-pager
- `ALL_DEMOS_SUMMARY.md` - Complete technical comparison

---

**Built with:** React 18, Vite 5, TypeScript 5  
**Status:** Production-ready  
**License:** MIT
