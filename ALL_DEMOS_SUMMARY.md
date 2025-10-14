# 🗺️ Complete Demo Collection Summary

## ✅ Three Production-Ready Demos

All demos use **@disaster-direct/sdk v0.1.3** with React 18, Vite 5, and TypeScript 5.

### 1. Leaflet Demo - Simple & Fast 🚀
**Location:** `/disaster-direct-leaflet-demo/`  
**Port:** 5173  
**Best For:** Learning, prototypes, simple maps

**Features:**
- ✅ Leaflet 1.9 (Canvas 2D rendering)
- ✅ Impact raster tiles
- ✅ Live impact scores
- ✅ Draggable marker
- ✅ Dynamic legend
- ✅ Pollen toggle
- ✅ Auto baseUrl detection

**Run:**
```bash
cd disaster-direct-leaflet-demo
npm install && npm run dev
```

---

### 2. Mapbox GL Demo - Full-Featured 🎯
**Location:** `/disaster-direct-mapbox-demo/`  
**Port:** 5176  
**Best For:** Production apps with security, maximum flexibility

**Features:**
- ✅ Mapbox GL v3.7 (WebGL rendering)
- ✅ **OSM Basemap Toggle** - Switch OSM ↔ Blank ⭐
- ✅ **HMAC Signing Toggle** - Unsigned ↔ Signed ⭐
- ✅ **Four Combinations** - OSM+unsigned, OSM+signed, blank+unsigned, blank+signed
- ✅ Auto-signed tiles (500 memo cache)
- ✅ Signed/unsigned legends
- ✅ Draggable marker
- ✅ Pollen toggle
- ✅ Auto baseUrl detection

**Run:**
```bash
cd disaster-direct-mapbox-demo
npm install && npm run dev
```

---

### 3. MapLibre GL Demo - Open Source 🌍
**Location:** `/disaster-direct-maplibre-demo/`  
**Port:** 5175  
**Best For:** Open source projects, zero cost

**Features:**
- ✅ MapLibre GL v4.7 (WebGL rendering, 100% OSS)
- ✅ **OSM Basemap Toggle** - Switch OSM ↔ Blank ⭐
- ✅ No tokens required (completely free)
- ✅ WebGL performance
- ✅ Impact raster overlay
- ✅ Draggable marker
- ✅ Dynamic legend
- ✅ Pollen toggle
- ✅ Auto baseUrl detection

**Run:**
```bash
cd disaster-direct-maplibre-demo
npm install && npm run dev
```

---

## 📊 Complete Comparison

| Feature | Leaflet | Mapbox GL | MapLibre GL |
|---------|---------|-----------|-------------|
| **Library Version** | 1.9 | 3.7 | 4.7 |
| **Rendering** | Canvas 2D | WebGL | WebGL |
| **License** | BSD | Proprietary | BSD (OSS) |
| **Token Required** | ❌ | ❌* | ❌ |
| **Cost** | Free | Free* | Free |
| **Port** | 5173 | 5176 | 5175 |
| **OSM Basemap Toggle** | ❌ | ✅ | ✅ |
| **HMAC Signing Toggle** | ❌ | ✅ | ❌ |
| **Dual Toggles** | ❌ | ✅ | ❌ |
| **3D Support** | ❌ | ✅ | ✅ |
| **Performance** | Good | Excellent | Excellent |
| **Complexity** | Low | High | Medium |
| **Best For** | Learning | Full-featured | Open source |

*Using OSM/blank styles (no token required)

---

## 🎯 Which Demo Should You Use?

### Choose Leaflet If:
- ✅ You're learning the SDK
- ✅ Building a simple prototype
- ✅ Don't need WebGL performance
- ✅ Want minimal complexity

### Choose Mapbox GL If:
- ✅ Building a production app
- ✅ Need HMAC security
- ✅ Want maximum flexibility
- ✅ Need all features (dual toggles)
- ✅ May add premium Mapbox basemaps later

### Choose MapLibre GL If:
- ✅ Building an open-source project
- ✅ Want 100% free forever
- ✅ Need WebGL performance
- ✅ Want OSM basemap toggle
- ✅ Prefer BSD-licensed libraries

---

## 🚀 Quick Start (All Demos)

### Prerequisites
Backend running on `http://localhost:3001` with:
- `GET /api/impact?lat={lat}&lng={lng}&pollen={0|1}`
- `GET /api/impact/tiles/{z}/{x}/{y}.png`
- `GET /api/legend.png`

**Optional (Mapbox HMAC only):**
- `GET /api/sign/tile?z={z}&x={x}&y={y}&fmt={fmt}`
- `GET /api/sign/legend?scheme={s}&width={w}&height={h}`

### Run All Demos
```bash
# Install SDK (if not published)
cd disaster-direct-sdk && npm install

# Terminal 1 - Leaflet Demo
cd disaster-direct-leaflet-demo
npm install && npm install ../disaster-direct-sdk
npm run dev  # http://localhost:5173

# Terminal 2 - Mapbox GL Demo
cd disaster-direct-mapbox-demo
npm install && npm install ../disaster-direct-sdk
npm run dev  # http://localhost:5176

# Terminal 3 - MapLibre GL Demo
cd disaster-direct-maplibre-demo
npm install && npm install ../disaster-direct-sdk
npm run dev  # http://localhost:5175
```

---

## 🔑 Key Features by Demo

### Leaflet Demo
- Simple Canvas 2D rendering
- Basic tile overlay
- Easy to understand code
- Perfect for learning

### Mapbox GL Demo (Dual Toggles) ⭐
**OSM Basemap Toggle:**
- Switch between OpenStreetMap and blank canvas
- Dynamic style switching
- Re-adds layers after style change

**HMAC Signing Toggle:**
- Unsigned mode (fast, CDN-friendly)
- HMAC signed mode (secure, authenticated)
- Auto-signed via `makeMapboxTransformRequest()`
- 500-tile memo cache

**Four Combinations:**
1. OSM + Unsigned (default)
2. OSM + HMAC Signed
3. Blank + Unsigned
4. Blank + HMAC Signed

### MapLibre GL Demo
- 100% open source (BSD license)
- OSM basemap toggle
- WebGL rendering
- No vendor lock-in
- Active community support

---

## 📚 Documentation

### SDK Documentation
- **SETUP.md** - Complete setup and publishing guide
- **QUICK_START.md** - Fast testing and deployment
- **EXAMPLES.md** - 10+ usage examples with all demos
- **CHANGELOG.md** - Version history

### Demo READMEs
- **Leaflet:** `disaster-direct-leaflet-demo/README.md`
- **Mapbox:** `disaster-direct-mapbox-demo/README.md` (dual toggles)
- **MapLibre:** `disaster-direct-maplibre-demo/README.md` (OSM basemap)

### Integration Summaries
- **LEAFLET_DEMO_INTEGRATION.md** - Leaflet integration details
- **MAPBOX_DEMO_INTEGRATION.md** - Original Mapbox (HMAC only)
- **MAPLIBRE_DEMO_INTEGRATION.md** - MapLibre integration
- **ALL_DEMOS_SUMMARY.md** - This complete overview

---

## 🎨 UI Consistency

All demos share:
- **Header Controls:** Lat/lng inputs, pollen toggle, impact score
- **Map View:** Interactive map with draggable marker
- **Legend:** Bottom-left overlay with viridis scheme
- **Footer:** Usage tips and instructions
- **Auto BaseUrl:** Detects localhost:3001 / Replit

**Mapbox GL Unique Controls:**
- OSM basemap dropdown
- HMAC signing checkbox

**MapLibre GL Unique Controls:**
- OSM basemap dropdown

---

## 🔐 Security Comparison

| Security Feature | Leaflet | Mapbox GL | MapLibre GL |
|-----------------|---------|-----------|-------------|
| Unsigned Tiles | ✅ | ✅ | ✅ |
| HMAC Signed Tiles | ❌ | ✅ | ❌ |
| Auto-Signing | ❌ | ✅ | ❌ |
| Tile Cache | Basic | 500 memo | Basic |
| Legend Signing | ❌ | ✅ | ❌ |

---

## 💰 Cost Comparison

| Demo | Map Library | Basemap | HMAC | Total Cost |
|------|------------|---------|------|------------|
| Leaflet | Free | Tiles only | N/A | $0 |
| Mapbox GL | Free* | OSM (free) | Free (SDK) | $0* |
| MapLibre GL | Free | OSM (free) | N/A | $0 |

*Mapbox GL is free when using OSM/blank styles (no token required)

---

## 🛠️ Development Workflow

### 1. Start with Leaflet
- Learn SDK basics
- Understand tile overlay
- Test impact scores
- Simple integration

### 2. Upgrade to MapLibre GL
- Add WebGL rendering
- Get OSM basemap toggle
- Maintain zero cost
- 100% open source

### 3. Consider Mapbox GL
- Need HMAC security?
- Want dual toggles?
- May add premium basemaps?
- Production-ready features

---

## 📦 SDK v0.1.3 Integration

All demos use the same SDK functions:

### Core Functions
```typescript
import {
  defaultBaseUrl,        // Auto-detect API endpoint
  getImpact,            // Fetch impact scores
  makeUnsignedTileTemplate,  // Create tile URLs
  getLegendUrl,         // Generate legend URLs
  makeMapboxTransformRequest  // Auto-sign tiles (Mapbox only)
} from '@disaster-direct/sdk'
```

### Shared Patterns
- Auto baseUrl detection
- Error handling with user-friendly messages
- Impact score calculation
- Tile template generation
- Legend URL construction

---

## 🎯 Production Recommendations

### For Learning Projects
→ **Leaflet Demo** (simplest, fastest to understand)

### For Open Source Projects
→ **MapLibre GL Demo** (free forever, OSM support)

### For Production Apps (No Security Required)
→ **MapLibre GL Demo** (WebGL performance, OSM basemap)

### For Production Apps (With Security)
→ **Mapbox GL Demo** (HMAC signing, dual toggles, maximum flexibility)

### For Maximum Flexibility
→ **Mapbox GL Demo** (all features, future-proof)

---

## ✅ All Demos Are Production-Ready

**Common Features:**
- ✅ TypeScript strict mode
- ✅ React 18 best practices
- ✅ Vite 5 fast refresh
- ✅ Clean, documented code
- ✅ Error handling
- ✅ Performance optimized

**Testing:**
- ✅ SDK has 8 passing tests
- ✅ All demos compile without errors
- ✅ Ready for local/Replit deployment

---

## 📋 Quick Reference

| Need | Demo | Port | Key Feature |
|------|------|------|-------------|
| Learn SDK | Leaflet | 5173 | Simple |
| HMAC Security | Mapbox | 5176 | Dual toggles |
| Open Source | MapLibre | 5175 | OSM toggle |
| Zero Cost | Leaflet or MapLibre | 5173/5175 | Free |
| WebGL Performance | Mapbox or MapLibre | 5176/5175 | WebGL |
| OSM Basemap | Mapbox or MapLibre | 5176/5175 | Toggle |
| Maximum Features | Mapbox | 5176 | All features |

---

## 🚀 Status

**SDK:** v0.1.3 (8 tests passing)  
**Demos:** 3 production-ready  
**Total Ports:** 5173, 5175, 5176  
**Documentation:** Complete  
**All Ready For:** Local testing, Replit deployment, production use

---

**Built with:** React 18, Vite 5, TypeScript 5  
**SDK:** @disaster-direct/sdk v0.1.3  
**Map Libraries:** Leaflet 1.9, Mapbox GL 3.7, MapLibre GL 4.7  
**License:** MIT
