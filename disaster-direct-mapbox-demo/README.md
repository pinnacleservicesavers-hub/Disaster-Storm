# 🗺️ Disaster Direct Mapbox GL Demo (Toggle Edition)

A ready-to-run React + Vite + Mapbox GL demo showcasing the **@disaster-direct/sdk v0.1.3** with **dual toggles** for maximum flexibility.

## 🎯 What It Does

✅ **Mapbox GL Integration** - Uses Mapbox GL JS v3 (works without token using blank/OSM styles)  
✅ **OSM Basemap Toggle** - Switch between OSM raster tiles and blank canvas ⭐  
✅ **HMAC Signing Toggle** - Switch between unsigned and signed tile requests ⭐  
✅ **Live Impact Scores** - Real-time API calls to `/api/impact`  
✅ **Auto BaseUrl Detection** - Uses `defaultBaseUrl` (localhost:3001 / Replit)  
✅ **Draggable Marker** - Interactive location selection  
✅ **Dynamic Legend** - Signed/unsigned legend display  
✅ **Pollen Toggle** - Switch pollen data on/off

## 🌟 Key Features: Dual Toggle System

This demo showcases **two independent toggles** working together:

### 1. Basemap Toggle (OSM ↔ Blank)
Switch between:
- **OSM Raster** - Full OpenStreetMap basemap for context
- **Blank Canvas** - Clean slate showing only impact data

### 2. HMAC Signing Toggle (Unsigned ↔ Signed)
Switch between:
- **Unsigned Mode** - Direct tile URLs (fast, CDN-friendly)
- **HMAC Signed Mode** - Auto-signed tiles for security

**Four Possible Combinations:**
1. OSM + Unsigned (default)
2. OSM + HMAC Signed
3. Blank + Unsigned
4. Blank + HMAC Signed

## 📦 Dependencies

```json
{
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "mapbox-gl": "^3.7.0",
    "@disaster-direct/sdk": "^0.1.3"
  }
}
```

## 🚀 How to Run (Local Development)

### Prerequisites

Make sure your **Disaster Direct backend** is running on `http://localhost:3001` with these endpoints:

**Required:**
- ✅ `GET /api/impact?lat={lat}&lng={lng}&pollen={0|1}` - Impact score
- ✅ `GET /api/impact/tiles/{z}/{x}/{y}.png` - Raster tiles (unsigned)
- ✅ `GET /api/legend.png?scheme=viridis&width=256&height=48` - Legend (unsigned)

**Optional (for HMAC mode):**
- ✅ `GET /api/sign/tile?z={z}&x={x}&y={y}&fmt={fmt}` - Tile signing endpoint
- ✅ `GET /api/sign/legend?scheme={scheme}&width={w}&height={h}` - Legend signing

### Setup & Run

```bash
# Navigate to demo directory
cd disaster-direct-mapbox-demo

# Install dependencies
npm install

# If SDK isn't published yet, install from local path:
# npm install ../disaster-direct-sdk

# Optional: Create .env for Mapbox token (if adding premium basemaps)
# echo "VITE_MAPBOX_TOKEN=your_token_here" > .env

# Start dev server
npm run dev

# Open browser to http://localhost:5176
```

## 🌐 How to Run (Replit)

1. **Import Demo** - Upload `disaster-direct-mapbox-demo-toggle.zip` to a new Replit
2. **Ensure Backend** - Your Disaster Direct backend must be accessible
3. **Auto Detection** - `defaultBaseUrl` automatically detects `*.repl.co` origin
4. **Run Demo** - `npm install && npm run dev`

## 🔑 SDK Usage Examples

### Import SDK Functions

```typescript
import { 
  defaultBaseUrl, 
  getImpact, 
  makeMapboxTransformRequest, 
  makeUnsignedTileTemplate, 
  getLegendUrl 
} from '@disaster-direct/sdk'
```

### Initialize Map with Dual Toggles

```typescript
import mapboxgl from 'mapbox-gl'

// Define basemap styles
const styleBlank = {
  version: 8,
  sources: {},
  layers: []
}

const styleOSM = {
  version: 8,
  sources: {
    'osm-raster': {
      type: 'raster',
      tiles: ['https://a.tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors'
    }
  },
  layers: [
    { id: 'osm-raster', type: 'raster', source: 'osm-raster' }
  ]
}

// State for toggles
const [basemap, setBasemap] = useState<'blank' | 'osm'>('osm')
const [hmac, setHmac] = useState(false)

// Create transform request when HMAC enabled
const transformRequest = hmac 
  ? makeMapboxTransformRequest(baseUrl, '/api/sign/tile')
  : undefined

// Initialize map
const map = new mapboxgl.Map({
  container: 'map',
  style: basemap === 'osm' ? styleOSM : styleBlank,
  center: [lng, lat],
  zoom: 9,
  transformRequest
})
```

### Handle Basemap Toggle

```typescript
useEffect(() => {
  const map = mapRef.current
  if (!map) return
  
  // Switch style
  map.setStyle(basemap === 'osm' ? styleOSM : styleBlank)
  
  // Re-add impact layer after style loads
  map.once('styledata', () => {
    if (map.getSource('impact')) {
      try {
        map.removeLayer('impact')
        map.removeSource('impact')
      } catch {}
    }
    map.addSource('impact', {
      type: 'raster',
      tiles: [tileTemplate],
      tileSize: 256
    })
    map.addLayer({
      id: 'impact',
      type: 'raster',
      source: 'impact'
    })
  })
}, [basemap, styleBlank, styleOSM, tileTemplate])
```

### Handle HMAC Signing Toggle

```typescript
useEffect(() => {
  const map = mapRef.current
  if (!map) return
  
  // Update transform request
  const tr = hmac 
    ? makeMapboxTransformRequest(baseUrl, '/api/sign/tile')
    : undefined
  
  // Apply to map (internal API)
  if (map._requestManager && tr) {
    map._requestManager.setTransformRequest(tr)
  }
  
  // Refresh tiles
  if (map.getSource('impact')) {
    map.removeLayer('impact')
    map.removeSource('impact')
  }
  map.addSource('impact', {
    type: 'raster',
    tiles: [tileTemplate],
    tileSize: 256
  })
  map.addLayer({
    id: 'impact',
    type: 'raster',
    source: 'impact'
  })
}, [tileTemplate, hmac, baseUrl])
```

### Get Signed/Unsigned Legend

```typescript
// Legend respects HMAC toggle
const legendUrl = await getLegendUrl(baseUrl, {
  scheme: 'viridis',
  width: 256,
  height: 48,
  bg: 'solid'
}, hmac) // Uses HMAC when toggle is on
```

## 📋 Features Demonstrated

### 1. Dual Toggle System
```typescript
<select value={basemap} onChange={e => setBasemap(e.target.value)}>
  <option value="osm">OSM raster</option>
  <option value="blank">Blank</option>
</select>

<label>
  <input type="checkbox" checked={hmac} onChange={e => setHmac(e.target.checked)} />
  HMAC signing
</label>
```

### 2. OSM Basemap Style
```typescript
const styleOSM = {
  version: 8,
  sources: {
    'osm-raster': {
      type: 'raster',
      tiles: ['https://a.tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors'
    }
  },
  layers: [
    { id: 'osm-raster', type: 'raster', source: 'osm-raster' }
  ]
}
```

### 3. HMAC Auto-Signing
```typescript
const transformRequest = hmac
  ? makeMapboxTransformRequest(baseUrl, '/api/sign/tile')
  : undefined

// SDK automatically:
// 1. Intercepts tile requests
// 2. Calls /api/sign/tile with params
// 3. Uses signed URL from server
// 4. Caches signed URLs (500 tile memo)
```

### 4. Dynamic Legend
```typescript
// Legend display shows signing status
<div>Legend (viridis){hmac ? ' • signed' : ''}</div>
```

## 🎨 UI Components

### Header Controls
- **BaseUrl Display** - Shows current API endpoint
- **Lat/Lng Inputs** - Manual coordinate entry
- **Pollen Checkbox** - Toggle pollen data
- **HMAC Checkbox** - Toggle signed tile requests
- **Basemap Dropdown** - Switch OSM/Blank
- **Impact Score** - Live 0-100 score display

### Map View
- **Mapbox GL Map** - WebGL rendering
- **OSM Basemap** - OpenStreetMap tiles (optional)
- **Impact Overlay** - Environmental data
- **Draggable Marker** - Custom red marker

### Legend
- **Position** - Bottom-left overlay
- **Format** - PNG legend (256x48px)
- **Signing Status** - Shows "signed" when HMAC enabled

## 🔐 HMAC Implementation

### Unsigned Flow (Default)
```
Browser → /api/impact/tiles/10/288/395.png → Server
```

### HMAC Signed Flow
```
1. Browser requests tile
2. SDK intercepts via transformRequest
3. SDK calls /api/sign/tile?z=10&x=288&y=395
4. Server returns signed URL with HMAC
5. SDK uses signed URL for tile request
6. Signed URLs cached for performance
```

### Backend Requirements for HMAC

**Tile Signing Endpoint:**
```typescript
GET /api/sign/tile?z={z}&x={x}&y={y}&fmt={fmt}&pollen={0|1}&grid={3}&scheme={viridis}&ttl={180}

Response:
{
  "url": "/api/impact/tiles/10/288/395.png?pollen=1&hmac=abc123&expires=1234567890"
}
```

**Legend Signing Endpoint:**
```typescript
GET /api/sign/legend?scheme={scheme}&width={w}&height={h}&bg={bg}

Response:
{
  "url": "/api/legend.png?scheme=viridis&hmac=abc123&expires=1234567890"
}
```

## 🛠️ Build & Deploy

```bash
# Development
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

## 📁 Project Structure

```
disaster-direct-mapbox-demo/
├── src/
│   ├── App.tsx          # Main demo with dual toggles
│   └── main.tsx         # React entry point
├── index.html           # HTML template with Mapbox CSS
├── package.json         # Dependencies (mapbox-gl v3.7, SDK v0.1.3)
├── tsconfig.json        # TypeScript config
├── vite.config.ts       # Vite config (port 5176)
└── README.md           # This file
```

## 🔗 Comparison: Mapbox vs MapLibre

| Feature | Mapbox GL (This Demo) | MapLibre GL |
|---------|----------------------|-------------|
| **Version** | 3.7 | 4.7 |
| **License** | Proprietary | BSD (OSS) |
| **Token Required** | ❌* | ❌ |
| **OSM Basemap** | ✅ Toggle | ✅ Toggle |
| **HMAC Signing** | ✅ Toggle | ❌ |
| **Performance** | Excellent | Excellent |
| **3D Support** | ✅ | ✅ |
| **Best For** | Production + Security | Open Source |

*Using OSM/blank styles requires no token

## 🗺️ Four Demo Comparison

| Demo | Library | Port | Basemap Toggle | HMAC Toggle | Best For |
|------|---------|------|----------------|-------------|----------|
| **Leaflet** | Leaflet 1.9 | 5173 | ❌ | ❌ | Simple maps |
| **Mapbox GL (Toggle)** | Mapbox GL 3.7 | 5176 | ✅ | ✅ | Full-featured |
| **Mapbox GL (Original)** | Mapbox GL 3.7 | 5174 | ❌ | ✅ | HMAC only |
| **MapLibre GL** | MapLibre 4.7 | 5175 | ✅ | ❌ | Open source |

## 💡 Tips

- **No Mapbox Token Needed** - Demo uses OSM/blank styles
- **Test All Combinations** - Try OSM+unsigned, OSM+signed, blank+unsigned, blank+signed
- **HMAC Performance** - Signed URLs cached for fast subsequent loads
- **OSM Attribution** - Always include `© OpenStreetMap contributors`
- **CORS** - Ensure backend allows CORS for demo origin

## 📚 SDK Documentation

For complete SDK documentation, see:
- **Setup Guide:** `../disaster-direct-sdk/SETUP.md`
- **Quick Start:** `../disaster-direct-sdk/QUICK_START.md`
- **Usage Examples:** `../disaster-direct-sdk/EXAMPLES.md`

## 🎯 Next Steps

1. ✅ Run the demo: `npm install && npm run dev`
2. ✅ Test OSM basemap mode
3. ✅ Test blank canvas mode
4. ✅ Toggle HMAC to test signed tiles
5. ✅ Try all four combinations
6. ✅ Implement `/api/sign/tile` endpoint on backend
7. ✅ Monitor signed URL caching performance

## ⚡ Advanced: Premium Mapbox Basemaps

To add premium Mapbox basemaps (requires token):

```typescript
// 1. Get token from https://mapbox.com
// 2. Set in .env: VITE_MAPBOX_TOKEN=pk.xxx

// 3. Add premium basemap option
const styleMapbox = 'mapbox://styles/mapbox/streets-v12'

// 4. Update dropdown
<select value={basemap} onChange={e => setBasemap(e.target.value)}>
  <option value="osm">OSM raster</option>
  <option value="blank">Blank</option>
  <option value="mapbox">Mapbox Streets</option>
</select>
```

---

**Built with:** React 18, Vite 5, Mapbox GL 3.7, TypeScript 5  
**SDK Version:** @disaster-direct/sdk v0.1.3  
**Port:** 5176  
**Version:** 0.0.2 (Toggle Edition)  
**License:** MIT
