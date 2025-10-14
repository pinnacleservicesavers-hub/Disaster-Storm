# 🗺️ Disaster Direct Mapbox GL Demo

A ready-to-run React + Vite + Mapbox GL demo showcasing the **@disaster-direct/sdk v0.1.3** with **optional HMAC signing**.

## 🎯 What It Does

✅ **Mapbox GL Integration** - Uses Mapbox GL JS v3 with blank style (no token required)  
✅ **Impact Raster Tiles** - Environmental data overlay on Mapbox map  
✅ **HMAC Signing Toggle** - Switch between unsigned and signed tile requests  
✅ **Live Impact Scores** - Real-time API calls to `/api/impact`  
✅ **Auto BaseUrl Detection** - Uses `defaultBaseUrl` (localhost:3001 / Replit)  
✅ **Draggable Marker** - Interactive location selection  
✅ **Dynamic Legend** - Signed/unsigned legend display  
✅ **Pollen Toggle** - Switch pollen data on/off

## 🔐 Key Feature: HMAC Signing

This demo showcases the SDK's **automatic tile signing** feature:

**Unsigned Mode (default):**
- Direct tile URLs: `/api/impact/tiles/{z}/{x}/{y}.png`
- No authentication required
- Fast CDN-friendly delivery

**HMAC Signed Mode (toggle on):**
- Uses `makeMapboxTransformRequest()` to auto-sign requests
- Calls `/api/sign/tile` endpoint for signed URLs
- Implements HMAC authentication for secure tile delivery
- Cached signed URLs for performance

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

# Optional: Create .env for Mapbox token (if adding basemaps)
# echo "VITE_MAPBOX_TOKEN=your_token_here" > .env

# Start dev server
npm run dev

# Open browser to http://localhost:5174
```

## 🌐 How to Run (Replit)

1. **Import Demo** - Upload `disaster-direct-mapbox-demo.zip` to a new Replit
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

### Create Unsigned Tile Template

```typescript
const tileTemplate = makeUnsignedTileTemplate(
  '/api/impact/tiles/{z}/{x}/{y}.png',
  {
    pollen: 1,
    grid: 3,
    scheme: 'viridis',
    ttl: 180
  }
)
// Returns: /api/impact/tiles/{z}/{x}/{y}.png?pollen=1&grid=3&scheme=viridis&ttl=180
```

### Initialize Mapbox Map (Unsigned)

```typescript
import mapboxgl from 'mapbox-gl'

// Blank style (no token required)
const map = new mapboxgl.Map({
  container: 'map',
  style: { version: 8, sources: {}, layers: [] },
  center: [lng, lat],
  zoom: 9
})

// Add impact tiles
map.on('load', () => {
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
```

### Initialize Mapbox Map (HMAC Signed)

```typescript
import { makeMapboxTransformRequest } from '@disaster-direct/sdk'

// Create transform request for auto-signing
const transformRequest = makeMapboxTransformRequest(
  defaultBaseUrl,
  '/api/sign/tile'
)

const map = new mapboxgl.Map({
  container: 'map',
  style: { version: 8, sources: {}, layers: [] },
  center: [lng, lat],
  zoom: 9,
  transformRequest // Auto-signs all tile requests
})

// Rest is the same - SDK handles signing automatically!
```

### Add Draggable Marker

```typescript
// Custom red marker
const el = document.createElement('div')
el.style.cssText = 'width:16px;height:16px;background:#ef4444;border:2px solid white;border-radius:50%;'

const marker = new mapboxgl.Marker({
  element: el,
  draggable: true
})
  .setLngLat([lng, lat])
  .addTo(map)

marker.on('dragend', () => {
  const { lng, lat } = marker.getLngLat()
  updateLocation(lng, lat)
})
```

### Fetch Impact Score

```typescript
const result = await getImpact(defaultBaseUrl, lat, lng, pollen)

if (result.ok) {
  const score = Math.round(result.data.impactScore)
  console.log(`Impact: ${score}/100`)
} else {
  console.error(result.userMessage) // User-friendly error
}
```

### Get Legend URL (with HMAC support)

```typescript
// Unsigned legend
const unsignedLegend = await getLegendUrl(defaultBaseUrl, {
  scheme: 'viridis',
  width: 256,
  height: 48,
  bg: 'solid'
}, false)

// HMAC signed legend
const signedLegend = await getLegendUrl(defaultBaseUrl, {
  scheme: 'viridis',
  width: 256,
  height: 48,
  bg: 'solid'
}, true) // true = use HMAC signing
```

## 📋 Features Demonstrated

### 1. Blank Mapbox Style (No Token Required)
```typescript
// Minimal style with no basemap
style: {
  version: 8,
  sources: {},
  layers: []
}
```

### 2. HMAC Signing Toggle
```typescript
const [hmac, setHmac] = useState(false)

// Create transform request when HMAC enabled
const transformRequest = hmac 
  ? makeMapboxTransformRequest(baseUrl, '/api/sign/tile')
  : undefined

// Apply to map
const map = new mapboxgl.Map({ transformRequest })
```

### 3. Dynamic Tile Updates
```typescript
useEffect(() => {
  const map = mapRef.current
  if (!map) return
  
  // Update transform request for signing
  const tr = hmac ? makeMapboxTransformRequest(baseUrl, '/api/sign/tile') : undefined
  if (map._requestManager && tr) {
    map._requestManager.setTransformRequest(tr)
  }
  
  // Refresh tiles
  if (map.getSource('impact')) {
    map.removeLayer('impact')
    map.removeSource('impact')
  }
  map.addSource('impact', { type: 'raster', tiles: [tileTemplate], tileSize: 256 })
  map.addLayer({ id: 'impact', type: 'raster', source: 'impact' })
}, [tileTemplate, hmac])
```

### 4. Auto BaseUrl Detection
```typescript
const baseUrl = defaultBaseUrl
// ✅ http://localhost:3001 in dev
// ✅ https://your-app.repl.co in Replit
```

## 🎨 UI Components

### Header Controls
- **BaseUrl Display** - Shows current API endpoint
- **Lat/Lng Inputs** - Manual coordinate entry
- **Pollen Checkbox** - Toggle pollen data
- **HMAC Checkbox** - Toggle signed tile requests
- **Impact Score** - Live 0-100 score display

### Map View
- **Mapbox GL Map** - Interactive pan/zoom
- **Impact Tiles** - Environmental data overlay
- **Draggable Marker** - Custom red marker

### Legend
- **Position** - Bottom-left overlay
- **Format** - PNG legend (256x48px)
- **Signing Status** - Shows "signed" when HMAC enabled

## 🔐 HMAC Implementation Details

### How It Works

**Unsigned Flow:**
```
Browser → /api/impact/tiles/10/288/395.png → Server
```

**HMAC Signed Flow:**
```
1. Browser requests tile
2. SDK intercepts via transformRequest
3. SDK calls /api/sign/tile?z=10&x=288&y=395
4. Server returns signed URL with HMAC
5. SDK uses signed URL for tile request
6. Signed URLs cached for performance
```

### SDK Implementation

The SDK's `makeMapboxTransformRequest()` automatically:
- ✅ Detects tile requests to `/api/impact/tiles/`
- ✅ Extracts z/x/y/format from URL
- ✅ Calls signing endpoint with parameters
- ✅ Caches signed URLs (500 tile memo)
- ✅ Respects query params (pollen, grid, scheme)

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
│   ├── App.tsx          # Main demo component
│   └── main.tsx         # React entry point
├── index.html           # HTML template with Mapbox CSS
├── package.json         # Dependencies (mapbox-gl, SDK)
├── tsconfig.json        # TypeScript config
├── vite.config.ts       # Vite config (port 5174)
└── README.md           # This file
```

## 🔗 Comparison: Leaflet vs Mapbox

| Feature | Leaflet Demo | Mapbox Demo |
|---------|-------------|-------------|
| Library | Leaflet 1.9 | Mapbox GL 3.7 |
| Token Required | No | No (blank style) |
| HMAC Signing | ❌ | ✅ |
| Tile Caching | Basic | Advanced (memo) |
| Performance | Good | Excellent |
| 3D Support | ❌ | ✅ (potential) |

## 💡 Tips

- **No Mapbox Token Needed** - Demo uses blank style, no basemap
- **Add Basemap Later** - Set `VITE_MAPBOX_TOKEN` in `.env` to add Mapbox streets
- **HMAC Toggle** - Test both unsigned and signed tile delivery
- **Performance** - Signed URLs cached for fast subsequent loads
- **CORS** - Ensure backend allows CORS for demo origin

## 📚 SDK Documentation

For complete SDK documentation, see:
- **Setup Guide:** `../disaster-direct-sdk/SETUP.md`
- **Quick Start:** `../disaster-direct-sdk/QUICK_START.md`
- **Usage Examples:** `../disaster-direct-sdk/EXAMPLES.md`

## 🎯 Next Steps

1. ✅ Run the demo: `npm install && npm run dev`
2. ✅ Test unsigned mode (default)
3. ✅ Toggle HMAC to test signed tiles
4. ✅ Implement `/api/sign/tile` endpoint on backend
5. ✅ Monitor signed URL caching performance
6. ✅ Add custom Mapbox basemap (optional)

## ⚡ Advanced: Custom Basemap

To add a Mapbox basemap:

```typescript
// 1. Get token from https://mapbox.com
// 2. Set in .env: VITE_MAPBOX_TOKEN=pk.xxx

// 3. Use real Mapbox style
const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/light-v11', // or dark-v11, streets-v12
  center: [lng, lat],
  zoom: 9,
  transformRequest: makeMapboxTransformRequest(baseUrl)
})
```

---

**Built with:** React 18, Vite 5, Mapbox GL 3.7, TypeScript 5  
**SDK Version:** @disaster-direct/sdk v0.1.3  
**Port:** 5174  
**License:** MIT
