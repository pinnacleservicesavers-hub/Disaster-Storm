# 🗺️ Disaster Direct MapLibre GL Demo

A ready-to-run React + Vite + MapLibre GL demo showcasing the **@disaster-direct/sdk v0.1.3** with **OSM basemap toggle**.

## 🎯 What It Does

✅ **MapLibre GL** - 100% open-source, no tokens required  
✅ **OSM Basemap Toggle** - Switch between OSM raster tiles and blank canvas  
✅ **Impact Raster Overlay** - Environmental data visualization  
✅ **Live Impact Scores** - Real-time API calls to `/api/impact`  
✅ **Auto BaseUrl Detection** - Uses `defaultBaseUrl` (localhost:3001 / Replit)  
✅ **Draggable Marker** - Interactive location selection  
✅ **Dynamic Legend** - Color-coded viridis scheme  
✅ **Pollen Toggle** - Switch pollen data on/off

## 🌟 Key Advantages

**MapLibre GL Benefits:**
- ✅ **100% Free & Open Source** - No API keys or tokens required
- ✅ **Fork of Mapbox GL** - Same API, no vendor lock-in
- ✅ **WebGL Rendering** - Hardware-accelerated maps
- ✅ **OSM Support** - Built-in OpenStreetMap integration
- ✅ **Active Community** - Regular updates and features

## 📦 Dependencies

```json
{
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "maplibre-gl": "^4.7.1",
    "@disaster-direct/sdk": "^0.1.3"
  }
}
```

## 🚀 How to Run (Local Development)

### Prerequisites

Make sure your **Disaster Direct backend** is running on `http://localhost:3001` with these endpoints:

**Required:**
- ✅ `GET /api/impact?lat={lat}&lng={lng}&pollen={0|1}` - Impact score
- ✅ `GET /api/impact/tiles/{z}/{x}/{y}.png` - Raster tiles
- ✅ `GET /api/legend.png?scheme=viridis&width=256&height=48` - Legend

### Setup & Run

```bash
# Navigate to demo directory
cd disaster-direct-maplibre-demo

# Install dependencies
npm install

# If SDK isn't published yet, install from local path:
# npm install ../disaster-direct-sdk

# Start dev server
npm run dev

# Open browser to http://localhost:5175
```

## 🌐 How to Run (Replit)

1. **Import Demo** - Upload `disaster-direct-maplibre-demo.zip` to a new Replit
2. **Ensure Backend** - Your Disaster Direct backend must be accessible
3. **Auto Detection** - `defaultBaseUrl` automatically detects `*.repl.co` origin
4. **Run Demo** - `npm install && npm run dev`

## 🔑 SDK Usage Examples

### Import SDK Functions

```typescript
import { 
  defaultBaseUrl, 
  getImpact, 
  makeUnsignedTileTemplate, 
  getLegendUrl 
} from '@disaster-direct/sdk'
```

### Create Tile Template

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

### Initialize MapLibre Map with Blank Style

```typescript
import maplibregl from 'maplibre-gl'

const styleBlank = {
  version: 8,
  sources: {},
  layers: []
}

const map = new maplibregl.Map({
  container: 'map',
  style: styleBlank,
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

### Initialize MapLibre Map with OSM Basemap

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

const map = new maplibregl.Map({
  container: 'map',
  style: styleOSM,
  center: [lng, lat],
  zoom: 9
})

// Add impact overlay (same as above)
map.on('load', () => {
  map.addSource('impact', { type: 'raster', tiles: [tileTemplate], tileSize: 256 })
  map.addLayer({ id: 'impact', type: 'raster', source: 'impact' })
})
```

### Toggle Basemap Dynamically

```typescript
const [basemap, setBasemap] = useState<'blank' | 'osm'>('osm')

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

### Add Draggable Marker

```typescript
// Custom red marker
const el = document.createElement('div')
el.style.cssText = 'width:16px;height:16px;background:#ef4444;border:2px solid white;border-radius:50%;'

const marker = new maplibregl.Marker({
  element: el,
  draggable: true
})
  .setLngLat([lng, lat])
  .addTo(map)

marker.on('dragend', () => {
  const { lng, lat } = marker.getLngLat()
  updateLocation(lng, lat)
  map.setCenter([lng, lat])
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

### Get Legend URL

```typescript
const legendUrl = await getLegendUrl(defaultBaseUrl, {
  scheme: 'viridis',
  width: 256,
  height: 48,
  bg: 'solid'
}, false) // false = unsigned

// Use in img element
<img src={legendUrl} alt="Legend" />
```

## 📋 Features Demonstrated

### 1. Blank MapLibre Style
```typescript
const styleBlank = {
  version: 8,
  sources: {},
  layers: []
}
```

### 2. OSM Raster Basemap
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

### 3. Basemap Toggle
```typescript
<select value={basemap} onChange={e => setBasemap(e.target.value)}>
  <option value="osm">OSM raster</option>
  <option value="blank">Blank</option>
</select>
```

### 4. Dynamic Style Switching
When the basemap changes, the demo:
1. Calls `map.setStyle()` with new style
2. Waits for `styledata` event
3. Re-adds impact layer overlay
4. Preserves marker position

## 🎨 UI Components

### Header Controls
- **BaseUrl Display** - Shows current API endpoint
- **Lat/Lng Inputs** - Manual coordinate entry
- **Pollen Checkbox** - Toggle pollen data
- **Basemap Dropdown** - Switch OSM/Blank
- **Impact Score** - Live 0-100 score display

### Map View
- **MapLibre GL Map** - WebGL rendering
- **OSM Basemap** - OpenStreetMap tiles (optional)
- **Impact Overlay** - Environmental data
- **Draggable Marker** - Custom red marker

### Legend
- **Position** - Bottom-left overlay
- **Format** - PNG legend (256x48px)
- **Scheme** - Viridis gradient

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
disaster-direct-maplibre-demo/
├── src/
│   ├── App.tsx          # Main demo component
│   └── main.tsx         # React entry point
├── index.html           # HTML template with MapLibre CSS
├── package.json         # Dependencies (maplibre-gl v4.7.1)
├── tsconfig.json        # TypeScript config
├── vite.config.ts       # Vite config (port 5175)
└── README.md           # This file
```

## 🔗 Comparison: MapLibre vs Mapbox GL

| Feature | MapLibre GL | Mapbox GL |
|---------|-------------|-----------|
| **License** | Open Source (BSD) | Proprietary |
| **Token Required** | ❌ No | ✅ Yes (for styles) |
| **Cost** | Free | $0.50/1000 loads |
| **API Compatibility** | Mapbox v1 compatible | Latest Mapbox API |
| **OSM Support** | ✅ Native | ⚠️ Via custom style |
| **Community** | Active | Mapbox team |
| **Version** | 4.7.1 | 3.7.0 |

## 🗺️ Three Map Library Comparison

| Demo | Library | Token | Basemap | Port | Best For |
|------|---------|-------|---------|------|----------|
| **Leaflet** | Leaflet 1.9 | ❌ | Via tiles | 5173 | Simple maps |
| **Mapbox GL** | Mapbox GL 3.7 | ✅* | Mapbox styles | 5174 | Advanced + HMAC |
| **MapLibre GL** | MapLibre 4.7 | ❌ | OSM raster | 5175 | Open source |

*Blank style requires no token

## 💡 Tips

- **No Tokens Needed** - MapLibre is 100% open source
- **OSM Attribution** - Always include `© OpenStreetMap contributors`
- **Style Switching** - Use `map.once('styledata')` to re-add layers
- **Performance** - OSM tiles cached by browser
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
4. ✅ Drag marker to see impact updates
5. ✅ Toggle pollen data
6. ✅ Add custom OSM tile providers (optional)

## ⚡ Advanced: Custom OSM Providers

You can use other OSM tile providers:

```typescript
// Carto Light
tiles: ['https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png']

// Carto Dark
tiles: ['https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png']

// Humanitarian OSM
tiles: ['https://a.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png']

// Stamen Terrain
tiles: ['https://stamen-tiles.a.ssl.fastly.net/terrain/{z}/{x}/{y}.png']
```

---

**Built with:** React 18, Vite 5, MapLibre GL 4.7, TypeScript 5  
**SDK Version:** @disaster-direct/sdk v0.1.3  
**Port:** 5175  
**License:** MIT & BSD (MapLibre)
