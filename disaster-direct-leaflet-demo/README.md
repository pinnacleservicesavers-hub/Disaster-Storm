# 🗺️ Disaster Direct Leaflet Demo

A ready-to-run React + Vite + Leaflet demo showcasing the **@disaster-direct/sdk v0.1.3** integration.

## 🎯 What It Does

✅ **Impact Raster Tiles** - Displays environmental impact tiles on an interactive Leaflet map  
✅ **Live Impact Scores** - Calls `/api/impact` endpoint and shows real-time impact scores (0-100)  
✅ **Auto BaseUrl Detection** - Uses `defaultBaseUrl` (localhost:3001 dev / Replit production)  
✅ **Interactive Marker** - Draggable marker to change lat/lng coordinates  
✅ **Dynamic Legend** - Displays color-coded legend (viridis scheme)  
✅ **Pollen Toggle** - Switch pollen data on/off to see impact changes

## 📦 Dependencies

```json
{
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "leaflet": "^1.9.4",
    "@disaster-direct/sdk": "^0.1.3"
  }
}
```

## 🚀 How to Run (Local Development)

### Prerequisites

Make sure your **Disaster Direct backend** is running on `http://localhost:3001` with these endpoints:

- ✅ `GET /api/impact?lat={lat}&lng={lng}&pollen={0|1}` - Impact score
- ✅ `GET /api/impact/tiles/{z}/{x}/{y}.png` - Raster tiles
- ✅ `GET /api/legend.png?scheme=viridis&width=256&height=48` - Legend image

### Setup & Run

```bash
# Navigate to demo directory
cd disaster-direct-leaflet-demo

# Install dependencies
npm install

# If SDK isn't published yet, install from local path:
# npm install ../disaster-direct-sdk

# Start dev server
npm run dev

# Open browser to displayed URL (usually http://localhost:5173)
```

## 🌐 How to Run (Replit)

1. **Import Demo** - Upload `disaster-direct-leaflet-demo.zip` to a new Replit (Node.js + Vite)
2. **Ensure Backend** - Your Disaster Direct backend must be deployed on the same Replit or reachable network
3. **Auto Detection** - `defaultBaseUrl` automatically detects `*.repl.co` origin
4. **Run Demo** - `npm install && npm run dev`

## 🔑 Key SDK Usage Examples

### Import SDK Functions

```typescript
import { 
  getImpact, 
  defaultBaseUrl, 
  makeUnsignedTileTemplate, 
  getLegendUrl 
} from '@disaster-direct/sdk'
```

### Create Unsigned Tile Template

```typescript
const tileTemplate = makeUnsignedTileTemplate(
  `${baseUrl}/api/impact/tiles/{z}/{x}/{y}.png`,
  {
    pollen: 1,
    grid: 3,
    scheme: 'viridis',
    ttl: 180
  }
)
// Returns: /api/impact/tiles/{z}/{x}/{y}.png?pollen=1&grid=3&scheme=viridis&ttl=180
```

### Add Leaflet Tile Layer

```typescript
L.tileLayer(tileTemplate, { 
  tileSize: 256, 
  crossOrigin: false 
}).addTo(map)
```

### Fetch Impact Score

```typescript
const result = await getImpact(baseUrl, lat, lng, pollen)
if (result.ok) {
  const score = Math.round(result.data.impactScore) // 0-100
  console.log(`Impact Score: ${score}`)
} else {
  console.error(result.userMessage) // User-friendly error
}
```

### Get Legend URL

```typescript
const legendUrl = await getLegendUrl(baseUrl, {
  scheme: 'viridis',
  width: 256,
  height: 48,
  bg: 'solid'
}, false) // false = unsigned (no HMAC)

// Use in img tag
<img src={legendUrl} alt="Legend" />
```

## 📋 Features Demonstrated

### 1. Auto BaseUrl Detection
```typescript
const baseUrl = defaultBaseUrl
// ✅ http://localhost:3001 in dev
// ✅ https://your-app.repl.co in Replit production
```

### 2. Draggable Marker
```typescript
const marker = L.marker([lat, lng], { draggable: true }).addTo(map)
marker.on('dragend', () => {
  const pos = marker.getLatLng()
  setLat(pos.lat)
  setLng(pos.lng)
})
```

### 3. Dynamic Tile Updates
When pollen toggle changes, the tile template updates and Leaflet re-renders:
```typescript
useEffect(() => {
  map.eachLayer(l => {
    if (l.getTileUrl) map.removeLayer(l) // Remove old layer
  })
  L.tileLayer(tileTemplate, { tileSize: 256 }).addTo(map) // Add new
}, [tileTemplate])
```

### 4. Error Handling
The SDK provides user-friendly error messages:
```typescript
getImpact(baseUrl, lat, lng, pollen).then(res => {
  if (res.ok) {
    setImpact(Math.round(res.data.impactScore))
  } else {
    setError(res.userMessage) // "Please sign in" / "Rate limited" etc.
  }
})
```

## 🎨 UI Components

### Header Controls
- **BaseUrl Display** - Shows current API endpoint
- **Lat/Lng Inputs** - Manual coordinate entry
- **Pollen Checkbox** - Toggle pollen data inclusion
- **Impact Score** - Live 0-100 score display

### Map View
- **Leaflet Map** - Interactive pan/zoom
- **Impact Tiles** - Environmental data overlay (viridis color scheme)
- **Draggable Marker** - Change location by dragging

### Legend
- **Position** - Bottom-left overlay
- **Format** - PNG/SVG legend (256x48px)
- **Scheme** - Viridis gradient (0-100 scale)

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
disaster-direct-leaflet-demo/
├── src/
│   ├── App.tsx          # Main demo component
│   └── main.tsx         # React entry point
├── index.html           # HTML template with Leaflet CSS
├── package.json         # Dependencies
├── tsconfig.json        # TypeScript config
├── vite.config.ts       # Vite config
└── README.md           # This file
```

## 🔗 Backend Requirements

Your Disaster Direct backend must expose:

### GET `/api/impact`
**Query Params:** `lat`, `lng`, `pollen` (0 or 1)  
**Response:**
```json
{
  "ok": true,
  "data": {
    "impactScore": 67.5,
    "lat": 33.749,
    "lng": -84.388
  }
}
```

### GET `/api/impact/tiles/{z}/{x}/{y}.png`
**Query Params:** `pollen`, `grid`, `scheme`, `ttl`  
**Response:** PNG image (256x256px)

### GET `/api/legend.png`
**Query Params:** `scheme`, `width`, `height`, `bg`  
**Response:** PNG/SVG legend image

## 📚 SDK Documentation

For complete SDK documentation, see:
- **Setup Guide:** `../disaster-direct-sdk/SETUP.md`
- **Quick Start:** `../disaster-direct-sdk/QUICK_START.md`
- **API Docs:** `../disaster-direct-sdk/README.md`

## 🎯 Next Steps

1. ✅ Run the demo: `npm install && npm run dev`
2. ✅ Explore the code in `src/App.tsx`
3. ✅ Modify tile parameters (scheme, grid size)
4. ✅ Add custom markers or overlays
5. ✅ Integrate into your own React app

## 💡 Tips

- **Localhost Testing:** Ensure backend runs on port 3001
- **Replit Deployment:** `defaultBaseUrl` auto-detects Replit origin
- **CORS:** Make sure your backend allows CORS for the demo origin
- **Performance:** Tiles are cached by Leaflet (check Network tab)

---

**Built with:** React 18, Vite 5, Leaflet 1.9, TypeScript 5  
**SDK Version:** @disaster-direct/sdk v0.1.3  
**License:** MIT
