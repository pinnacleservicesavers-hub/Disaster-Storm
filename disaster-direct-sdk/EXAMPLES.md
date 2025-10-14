# 📚 SDK Usage Examples

## Overview

The **@disaster-direct/sdk** provides ready-to-use utilities for integrating Disaster Direct's environmental intelligence APIs into your applications. Below are comprehensive examples showing real-world usage.

## 🗺️ Complete Demos

### 1. React + Vite + Leaflet Demo
**Location:** `/disaster-direct-leaflet-demo/`

A fully-functional demo application showcasing the SDK with:
- ✅ Impact raster tiles on Leaflet map
- ✅ Live impact score API calls
- ✅ Auto baseUrl detection (localhost/Replit)
- ✅ Interactive draggable marker
- ✅ Dynamic legend display
- ✅ Pollen data toggle

**See:** `../disaster-direct-leaflet-demo/README.md` for complete setup instructions.

### 2. React + Vite + Mapbox GL Demo (with HMAC Signing!)
**Location:** `/disaster-direct-mapbox-demo/`

Advanced demo showcasing SDK's HMAC signing capabilities:
- ✅ Mapbox GL JS v3 integration
- ✅ **HMAC signing toggle** - Test unsigned vs signed tiles
- ✅ Blank Mapbox style (no token required)
- ✅ Auto-signed tiles via `makeMapboxTransformRequest()`
- ✅ Signed legend support
- ✅ 500-tile memo cache for performance

**See:** `../disaster-direct-mapbox-demo/README.md` for HMAC implementation details.

---

## 📖 Quick Examples

### 1. Basic API Call with Error Handling

```typescript
import { apiFetch } from '@disaster-direct/sdk'

async function getClaims() {
  try {
    const result = await apiFetch('/api/claims')
    if (result.ok) {
      console.log('Claims:', result.data)
    } else {
      // User-friendly error message (401/403/429/500)
      console.error(result.userMessage)
    }
  } catch (error) {
    console.error('Network error:', error)
  }
}
```

### 2. Get Impact Score

```typescript
import { getImpact, defaultBaseUrl } from '@disaster-direct/sdk'

async function fetchImpact(lat: number, lng: number) {
  const result = await getImpact(defaultBaseUrl, lat, lng, true)
  
  if (result.ok) {
    const { impactScore, aqi, windSpeed } = result.data
    console.log(`Impact Score: ${Math.round(impactScore)}/100`)
    console.log(`AQI: ${aqi}, Wind: ${windSpeed} mph`)
  } else {
    alert(result.userMessage) // "Please sign in" / "Rate limited" etc.
  }
}

// Usage
fetchImpact(33.749, -84.388) // Atlanta
```

### 3. Leaflet Map with Impact Tiles

```typescript
import L from 'leaflet'
import { makeUnsignedTileTemplate, defaultBaseUrl } from '@disaster-direct/sdk'

// Create tile template
const tileUrl = makeUnsignedTileTemplate(
  `${defaultBaseUrl}/api/impact/tiles/{z}/{x}/{y}.png`,
  {
    pollen: 1,      // Include pollen data
    grid: 3,        // 3km grid resolution
    scheme: 'viridis', // Color scheme
    ttl: 180        // Cache TTL (seconds)
  }
)

// Add to Leaflet map
const map = L.map('map').setView([33.749, -84.388], 10)
L.tileLayer(tileUrl, { 
  tileSize: 256, 
  crossOrigin: false 
}).addTo(map)
```

### 4. Generate Legend URL

```typescript
import { getLegendUrl, defaultBaseUrl } from '@disaster-direct/sdk'

async function displayLegend() {
  const url = await getLegendUrl(defaultBaseUrl, {
    scheme: 'viridis',    // Color scheme
    width: 300,           // Legend width
    height: 60,           // Legend height
    bg: 'transparent',    // Background (solid/transparent)
    fmt: 'png'           // Format (png/svg)
  }, false) // false = unsigned (no HMAC)
  
  // Use in img element
  document.getElementById('legend').src = url
}
```

### 5. Mapbox GL with Auto-Signed Tiles (HMAC)

```typescript
import mapboxgl from 'mapbox-gl'
import { makeMapboxTransformRequest, defaultBaseUrl } from '@disaster-direct/sdk'

// Blank style (no Mapbox token required)
const map = new mapboxgl.Map({
  container: 'map',
  style: { version: 8, sources: {}, layers: [] },
  center: [-84.388, 33.749],
  zoom: 10,
  // Auto-signs all tile requests to /api/impact/tiles/
  transformRequest: makeMapboxTransformRequest(defaultBaseUrl, '/api/sign/tile')
})

map.on('load', () => {
  map.addSource('impact-tiles', {
    type: 'raster',
    tiles: [`/api/impact/tiles/{z}/{x}/{y}.png?pollen=1&scheme=viridis`],
    tileSize: 256
  })
  
  map.addLayer({
    id: 'impact-layer',
    type: 'raster',
    source: 'impact-tiles',
    paint: { 'raster-opacity': 1.0 }
  })
})

// SDK automatically:
// 1. Intercepts tile requests
// 2. Calls /api/sign/tile with params
// 3. Uses signed URL from server
// 4. Caches signed URLs (500 tile memo)
```

### 6. Auto BaseUrl Detection

```typescript
import { defaultBaseUrl } from '@disaster-direct/sdk'

// Automatically detects correct API endpoint:
// - http://localhost:3001 (in local dev)
// - https://your-app.repl.co (in Replit)
// - window.location.origin (fallback)

console.log('API Base URL:', defaultBaseUrl)

// Use in all SDK functions
const impact = await getImpact(defaultBaseUrl, lat, lng, true)
const tiles = makeUnsignedTileTemplate(`${defaultBaseUrl}/api/impact/tiles/{z}/{x}/{y}.png`)
```

### 7. Error Handling Best Practices

```typescript
import { apiFetch } from '@disaster-direct/sdk'

async function fetchData() {
  const result = await apiFetch('/api/claims')
  
  if (!result.ok) {
    // SDK provides user-friendly messages based on status codes
    switch (result.status) {
      case 401:
        // "Please sign in to access this resource."
        redirectToLogin()
        break
      case 403:
        // "You don't have permission to access this."
        showPermissionError()
        break
      case 429:
        // "Too many requests. Please try again in X seconds."
        showRateLimitError(result.userMessage)
        break
      case 500:
        // "Service temporarily unavailable. Please try again."
        showServerError()
        break
      default:
        console.error(result.userMessage)
    }
    return null
  }
  
  return result.data
}
```

### 8. React Hook Example

```typescript
import { useState, useEffect } from 'react'
import { getImpact, defaultBaseUrl } from '@disaster-direct/sdk'

function useImpactScore(lat: number, lng: number, pollen: boolean) {
  const [score, setScore] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  
  useEffect(() => {
    setLoading(true)
    setError('')
    
    getImpact(defaultBaseUrl, lat, lng, pollen)
      .then(result => {
        if (result.ok) {
          setScore(Math.round(result.data.impactScore))
        } else {
          setError(result.userMessage)
        }
      })
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false))
  }, [lat, lng, pollen])
  
  return { score, loading, error }
}

// Usage in component
function ImpactDisplay() {
  const { score, loading, error } = useImpactScore(33.749, -84.388, true)
  
  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>
  
  return <div>Impact Score: {score}/100</div>
}
```

### 9. Retry Logic

The SDK includes automatic retries with exponential backoff:

```typescript
import { apiFetch } from '@disaster-direct/sdk'

// Automatically retries failed requests (up to 3 attempts)
// Respects `Retry-After` headers from server
// Uses exponential backoff (1s, 2s, 4s)

const result = await apiFetch('/api/weather', {
  method: 'POST',
  body: { location: 'Atlanta' }
})

// SDK handles:
// ✅ Network failures (auto-retry)
// ✅ 429 Rate Limits (respects Retry-After)
// ✅ 500 Server Errors (retry with backoff)
// ✅ User-friendly error messages
```

### 10. TypeScript Types

```typescript
import type { ImpactResponse } from '@disaster-direct/sdk'

interface AppState {
  impact: ImpactResponse['data'] | null
  loading: boolean
  error: string
}

async function updateImpact(state: AppState, lat: number, lng: number) {
  const result = await getImpact(defaultBaseUrl, lat, lng, true)
  
  if (result.ok) {
    // TypeScript knows result.data has impactScore, aqi, windSpeed, etc.
    return {
      impact: result.data,
      loading: false,
      error: ''
    }
  }
  
  return {
    impact: null,
    loading: false,
    error: result.userMessage
  }
}
```

---

## 🎯 Common Patterns

### Pattern 1: Fetch + Display Impact

```typescript
async function showImpact(lat: number, lng: number) {
  const { ok, data, userMessage } = await getImpact(defaultBaseUrl, lat, lng, true)
  
  if (ok) {
    document.getElementById('score').textContent = `${Math.round(data.impactScore)}/100`
  } else {
    document.getElementById('error').textContent = userMessage
  }
}
```

### Pattern 2: Dynamic Tile Updates

```typescript
function updateTiles(pollen: boolean, scheme: string) {
  const newTileUrl = makeUnsignedTileTemplate(
    `${defaultBaseUrl}/api/impact/tiles/{z}/{x}/{y}.png`,
    { pollen: pollen ? 1 : 0, scheme, grid: 3 }
  )
  
  // Remove old layer
  map.eachLayer(layer => {
    if (layer instanceof L.TileLayer) map.removeLayer(layer)
  })
  
  // Add new layer
  L.tileLayer(newTileUrl, { tileSize: 256 }).addTo(map)
}
```

### Pattern 3: Error Recovery

```typescript
async function fetchWithRetry(url: string, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    const result = await apiFetch(url)
    
    if (result.ok) return result.data
    if (result.status === 429) {
      // Wait for rate limit to clear
      await new Promise(resolve => setTimeout(resolve, 2000 * (i + 1)))
      continue
    }
    
    throw new Error(result.userMessage)
  }
}
```

---

## 📦 Full Demo Applications

### Leaflet Demo (Unsigned Tiles)
**Location:** `/disaster-direct-leaflet-demo/`

Perfect for simple integrations:
- ✅ React 18 + TypeScript
- ✅ Vite 5 build setup
- ✅ Leaflet map integration
- ✅ Impact tiles + legend
- ✅ Interactive marker
- ✅ Error handling
- ✅ Auto baseUrl detection

**Run it:**
```bash
cd disaster-direct-leaflet-demo
npm install
npm run dev  # Port 5173
```

### Mapbox GL Demo (HMAC Signed Tiles)
**Location:** `/disaster-direct-mapbox-demo/`

Advanced integration with security:
- ✅ Mapbox GL JS v3
- ✅ **HMAC signing toggle**
- ✅ Blank style (no token)
- ✅ Auto-signed tiles
- ✅ Signed legends
- ✅ 500-tile cache

**Run it:**
```bash
cd disaster-direct-mapbox-demo
npm install
npm run dev  # Port 5174
```

---

## 🔗 Additional Resources

- **Setup Guide:** [SETUP.md](./SETUP.md)
- **Quick Start:** [QUICK_START.md](./QUICK_START.md)
- **API Reference:** [README.md](./README.md)
- **Changelog:** [CHANGELOG.md](./CHANGELOG.md)
- **Demo README:** [../disaster-direct-leaflet-demo/README.md](../disaster-direct-leaflet-demo/README.md)

---

**SDK Version:** 0.1.3  
**Last Updated:** 2025-10-14  
**License:** MIT
