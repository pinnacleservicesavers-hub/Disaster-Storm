# 🗺️ Disaster Direct SDK & Demo Apps - Complete Index

## 📦 SDK Package: @disaster-direct/sdk v0.1.3

**Location:** `/disaster-direct-sdk/`  
**Status:** Production-ready with 8 passing tests  
**NPM Ready:** GitHub Actions workflows configured for CI/CD

### Key Features
- ✅ API client with automatic retries and backoff
- ✅ Impact score helper (`getImpact()`)
- ✅ Tile template generation (unsigned + HMAC)
- ✅ Legend URL helpers (unsigned + HMAC)
- ✅ Mapbox transform request for auto-signing
- ✅ Auto baseUrl detection (localhost / Replit)
- ✅ User-friendly error messages

### Test Coverage
- 4 error handling tests (401, 403, 429, 500)
- 4 legend helper tests (unsigned URLs with various params)

### Documentation
- 📖 `SETUP.md` - Complete setup and publishing guide
- 🚀 `QUICK_START.md` - Fast testing and deployment
- 💡 `EXAMPLES.md` - 10+ usage examples with React hooks
- 📋 `CHANGELOG.md` - Version history (v0.1.3)

---

## 🗺️ Three Production-Ready Demos

All demos showcase SDK v0.1.3 with React 18, Vite 5, TypeScript 5

### 1. Leaflet Demo - Simple & Fast
**Port:** 5173 | **Tech:** Leaflet 1.9 (Canvas 2D)

**Best For:** Learning, prototypes, simple maps  
**Unique Features:** Easiest setup, token-free, lightweight

📖 `disaster-direct-leaflet-demo/README.md`

---

### 2. Mapbox GL Demo - Full-Featured ⭐
**Port:** 5176 | **Tech:** Mapbox GL 3.7 (WebGL)

**Best For:** Production apps with security, maximum flexibility  
**Unique Features:** 
- OSM basemap toggle (OSM ↔ Blank)
- HMAC signing toggle (unsigned ↔ signed)
- Four combinations
- 500-tile memo cache

📖 `disaster-direct-mapbox-demo/README.md`

---

### 3. MapLibre GL Demo - Open Source
**Port:** 5175 | **Tech:** MapLibre GL 4.7 (WebGL, BSD license)

**Best For:** Open source projects, zero cost  
**Unique Features:** 
- 100% open source (BSD)
- OSM basemap toggle
- No tokens required ever
- No vendor lock-in

📖 `disaster-direct-maplibre-demo/README.md`

---

## 📚 Documentation Index

### SDK Documentation
| File | Purpose | Audience |
|------|---------|----------|
| `disaster-direct-sdk/SETUP.md` | Complete setup & publishing | Developers |
| `disaster-direct-sdk/QUICK_START.md` | Fast testing guide | QA, Developers |
| `disaster-direct-sdk/EXAMPLES.md` | Code examples & patterns | Developers |
| `disaster-direct-sdk/CHANGELOG.md` | Version history | Everyone |

### Demo Documentation
| File | Purpose | Audience |
|------|---------|----------|
| `disaster-direct-leaflet-demo/README.md` | Leaflet integration guide | Developers |
| `disaster-direct-mapbox-demo/README.md` | Mapbox dual toggle guide | Developers |
| `disaster-direct-maplibre-demo/README.md` | MapLibre OSM guide | Developers |

### Project Summaries
| File | Purpose | Audience |
|------|---------|----------|
| `DEMO_APPS_OVERVIEW.md` | **One-pager team guide** | Everyone ⭐ |
| `ALL_DEMOS_SUMMARY.md` | Technical comparison | Developers, PMs |
| `SDK_AND_DEMOS_INDEX.md` | This index | Everyone |
| `replit.md` | Project memory | Developers, AI |

---

## 🎯 Quick Decision Guide

### "Which demo should I use?"

**I'm learning the SDK:**
→ Start with **Leaflet Demo** (port 5173)

**I need security (HMAC signing):**
→ Use **Mapbox GL Demo** (port 5176)

**I want open source / zero cost:**
→ Use **MapLibre GL Demo** (port 5175)

**I want maximum flexibility:**
→ Use **Mapbox GL Demo** (port 5176)

**I need WebGL performance:**
→ Use **Mapbox GL** or **MapLibre GL** (5176 or 5175)

---

## 🚀 Quick Start (All Components)

### 1. SDK Development
```bash
cd disaster-direct-sdk
npm install
npm test           # Run all 8 tests
npm run test:ci    # CI mode with coverage
npm run build      # Build ESM + CJS
```

### 2. Leaflet Demo
```bash
cd disaster-direct-leaflet-demo
npm install
npm install ../disaster-direct-sdk  # Local SDK
npm run dev        # http://localhost:5173
```

### 3. Mapbox GL Demo (Dual Toggles)
```bash
cd disaster-direct-mapbox-demo
npm install
npm install ../disaster-direct-sdk
npm run dev        # http://localhost:5176
```

### 4. MapLibre GL Demo
```bash
cd disaster-direct-maplibre-demo
npm install
npm install ../disaster-direct-sdk
npm run dev        # http://localhost:5175
```

---

## 🔧 Backend Requirements

All demos require a Disaster Direct backend on `http://localhost:3001`:

### Required Endpoints
```
GET /api/impact?lat={lat}&lng={lng}&pollen={0|1}
GET /api/impact/tiles/{z}/{x}/{y}.png
GET /api/legend.png?scheme={s}&width={w}&height={h}
```

### Optional (Mapbox HMAC Only)
```
GET /api/sign/tile?z={z}&x={x}&y={y}&fmt={fmt}&...
GET /api/sign/legend?scheme={s}&width={w}&height={h}&...
```

---

## 📊 Complete Feature Matrix

| Feature | Leaflet | Mapbox GL | MapLibre GL |
|---------|---------|-----------|-------------|
| **Rendering** | Canvas 2D | WebGL | WebGL |
| **Performance** | Good | Excellent | Excellent |
| **Basemap Toggle** | ❌ | ✅ | ✅ |
| **HMAC Signing** | ❌ | ✅ | ❌ |
| **Dual Toggles** | ❌ | ✅ | ❌ |
| **Token Required** | ❌ | ❌* | ❌ |
| **3D Support** | ❌ | ✅ | ✅ |
| **Vector Layers** | ❌ | ✅ | ✅ |
| **Open Source** | ✅ | ❌ | ✅ |
| **License** | BSD | Proprietary | BSD |
| **Setup Complexity** | Low | Medium | Medium |
| **Cost** | Free | Free* | Free |

*Using OSM/blank styles

---

## 🏗️ Project Structure

```
.
├── disaster-direct-sdk/              # SDK package (v0.1.3)
│   ├── src/
│   │   ├── index.ts                  # Main exports
│   │   ├── ddClient.ts               # API client
│   │   ├── ddTiles.ts                # Tile helpers
│   │   └── ddMaps.ts                 # Map utilities
│   ├── tests/
│   │   ├── ddClient.test.ts          # 4 error tests
│   │   └── ddTiles.test.ts           # 4 legend tests
│   ├── package.json                  # SDK manifest
│   ├── SETUP.md                      # Setup guide
│   ├── QUICK_START.md                # Quick guide
│   ├── EXAMPLES.md                   # Code examples
│   └── CHANGELOG.md                  # Version history
│
├── disaster-direct-leaflet-demo/     # Leaflet demo (port 5173)
│   ├── src/
│   │   ├── App.tsx                   # Demo app
│   │   └── main.tsx
│   ├── package.json
│   └── README.md                     # Leaflet guide
│
├── disaster-direct-mapbox-demo/      # Mapbox demo (port 5176)
│   ├── src/
│   │   ├── App.tsx                   # Dual toggles
│   │   └── main.tsx
│   ├── package.json
│   └── README.md                     # Dual toggle guide
│
├── disaster-direct-maplibre-demo/    # MapLibre demo (port 5175)
│   ├── src/
│   │   ├── App.tsx                   # OSM basemap
│   │   └── main.tsx
│   ├── package.json
│   └── README.md                     # MapLibre guide
│
├── DEMO_APPS_OVERVIEW.md             # One-pager team guide ⭐
├── ALL_DEMOS_SUMMARY.md              # Technical comparison
├── SDK_AND_DEMOS_INDEX.md            # This index
└── replit.md                         # Project memory
```

---

## 🎓 Learning Path

### Beginner Path
1. Read `DEMO_APPS_OVERVIEW.md` (one-pager)
2. Run Leaflet demo (simplest)
3. Read `disaster-direct-sdk/EXAMPLES.md`
4. Explore SDK source code

### Intermediate Path
1. Run MapLibre GL demo (OSM basemap)
2. Study `disaster-direct-maplibre-demo/README.md`
3. Implement custom features
4. Read SDK implementation

### Advanced Path
1. Run Mapbox GL demo (dual toggles)
2. Study HMAC implementation
3. Read `disaster-direct-mapbox-demo/README.md`
4. Implement `/api/sign/tile` backend
5. Test all four combinations

---

## 🔐 Security Features

### Unsigned Mode (All Demos)
- Direct tile URLs
- Fast CDN delivery
- Public access
- Simple implementation

### HMAC Signed Mode (Mapbox Only)
- Authenticated tile requests
- Time-limited URLs
- Server-side validation
- 500-tile memo cache
- Auto-signing via SDK

---

## 🚀 CI/CD & Publishing

### SDK Publishing
```bash
cd disaster-direct-sdk

# Update version
npm version patch

# Commit and tag
git push --follow-tags

# GitHub Actions auto-publishes to npm
```

### Demo Deployment
All demos work on:
- ✅ Local development (localhost:3001 backend)
- ✅ Replit deployments (auto baseUrl detection)
- ✅ Custom domains (configure baseUrl)

---

## 🧪 Testing

### SDK Tests
```bash
cd disaster-direct-sdk
npm test              # Watch mode
npm run test:ci       # CI with coverage
```

**Coverage:**
- 4 error message tests (401, 403, 429, 500)
- 4 legend URL tests (various parameters)
- Total: 8 tests passing

### Demo Testing
All demos include:
- TypeScript strict mode
- Real-time error handling
- User-friendly error messages
- Production-ready code

---

## 💡 Key Concepts

### defaultBaseUrl
Automatically detects API endpoint:
- `http://localhost:3001` in development
- `https://*.repl.co` on Replit
- Custom domains supported

### Impact Score
0-100 weighted risk score combining:
- Air quality (50%)
- Wind speed (30%)
- Fire proximity (20%)

### Tile Template
Parameterized tile URL with query params:
- `pollen`: 0 or 1
- `grid`: Resolution (3 = 3x3 grid)
- `scheme`: Color scheme (viridis)
- `ttl`: Cache time in seconds

### HMAC Signing
Security flow:
1. Browser requests tile
2. SDK intercepts via transformRequest
3. SDK calls `/api/sign/tile`
4. Server returns signed URL
5. SDK uses signed URL
6. Results cached (500 tiles)

---

## 📋 Status Summary

**SDK v0.1.3:**
- ✅ 8 tests passing
- ✅ TypeScript strict mode
- ✅ ESM + CJS builds
- ✅ GitHub workflows ready
- ✅ Production-ready

**Three Demos:**
- ✅ Leaflet (port 5173)
- ✅ Mapbox GL (port 5176)
- ✅ MapLibre GL (port 5175)
- ✅ All production-ready
- ✅ Complete documentation

**Documentation:**
- ✅ SDK guides (4 files)
- ✅ Demo READMEs (3 files)
- ✅ Project summaries (4 files)
- ✅ Total: 11 documentation files

---

## 🔗 Related Projects

**Main Application:**
- Disaster Direct platform (main repo)
- Backend API (localhost:3001)
- PostgreSQL database

**External Services:**
- GetAmbee API (environmental data)
- ElevenLabs (voice synthesis)
- xAI Grok (AI intelligence)

---

## 📞 Quick Reference

**Need help with:**
- SDK usage → `disaster-direct-sdk/EXAMPLES.md`
- Demo comparison → `DEMO_APPS_OVERVIEW.md`
- Technical details → `ALL_DEMOS_SUMMARY.md`
- Setup guide → `disaster-direct-sdk/SETUP.md`
- Quick start → `disaster-direct-sdk/QUICK_START.md`

**Demo ports:**
- Leaflet: 5173
- MapLibre: 5175
- Mapbox: 5176

**Backend:** localhost:3001

---

**Last Updated:** SDK v0.1.3 with three production-ready demos  
**Status:** Complete and ready for team use  
**License:** MIT
