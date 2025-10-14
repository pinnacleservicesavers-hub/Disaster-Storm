import { useEffect, useMemo, useRef, useState } from 'react'
import L from 'leaflet'
import { getImpact, defaultBaseUrl, makeUnsignedTileTemplate, getLegendUrl } from '@disaster-direct/sdk'

export default function App() {
  const mapRef = useRef<L.Map | null>(null)
  const [lat, setLat] = useState(33.749)   // Atlanta default
  const [lng, setLng] = useState(-84.388)
  const [impact, setImpact] = useState<number | null>(null)
  const [legendUrl, setLegendUrl] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [pollen, setPollen] = useState(true)
  const baseUrl = defaultBaseUrl

  // Build tile template (unsigned; works on localhost/Replit)
  const tileTemplate = useMemo(() => {
    return makeUnsignedTileTemplate(`${baseUrl}/api/impact/tiles/{z}/{x}/{y}.png`, {
      pollen: pollen ? 1 : 0,
      grid: 3,
      scheme: 'viridis',
      ttl: 180
    })
  }, [baseUrl, pollen])

  useEffect(() => {
    // Init map once
    if (mapRef.current) return
    const map = L.map('map', { center: [lat, lng], zoom: 10 })
    mapRef.current = map
    L.tileLayer(tileTemplate, { tileSize: 256, crossOrigin: false }).addTo(map)

    // Add a draggable marker for location
    const marker = L.marker([lat, lng], { draggable: true }).addTo(map)
    marker.on('dragend', () => {
      const pos = marker.getLatLng()
      setLat(pos.lat)
      setLng(pos.lng)
    })
  }, [])

  useEffect(() => {
    // Update tile layer when template changes
    const map = mapRef.current
    if (!map) return
    // remove previous raster layer (assume only one layer other than markers)
    map.eachLayer(l => {
      // @ts-ignore - detect our tile layer by presence of getTileUrl
      if (l.getTileUrl) map.removeLayer(l as any)
    })
    L.tileLayer(tileTemplate, { tileSize: 256, crossOrigin: false }).addTo(map)
  }, [tileTemplate])

  useEffect(() => {
    // Fetch impact for current coordinates
    setError('')
    setImpact(null)
    getImpact(baseUrl, lat, lng, pollen).then(res => {
      if (res.ok) setImpact(Math.round(res.data.impactScore))
      else setError(res.userMessage)
    }).catch(e => setError(String(e)))

    // Legend
    getLegendUrl(baseUrl, { scheme: 'viridis', width: 256, height: 48, bg: 'solid' }, false)
      .then(setLegendUrl)
      .catch(() => setLegendUrl(''))
  }, [lat, lng, pollen, baseUrl])

  return (
    <div className="app">
      <header>
        <div className="controls">
          <strong>Disaster Direct • Leaflet Demo</strong>
          <span className="pill">base: {baseUrl}</span>
          <label>Lat <input type="number" step="0.001" value={lat} onChange={e => setLat(parseFloat(e.target.value))} /></label>
          <label>Lng <input type="number" step="0.001" value={lng} onChange={e => setLng(parseFloat(e.target.value))} /></label>
          <label>
            <input type="checkbox" checked={pollen} onChange={e => setPollen(e.target.checked)} /> Pollen
          </label>
          <span>{impact != null ? `Impact: ${impact}` : (error ? <span className="error">Error: {error}</span> : 'Loading impact…')}</span>
        </div>
      </header>

      <div id="map" className="map" />

      <div className="legend" style={{ display: legendUrl ? 'block' : 'none' }}>
        <div style={{ fontSize: 12, marginBottom: 6 }}>Legend (viridis)</div>
        {legendUrl && <img src={legendUrl} alt="Legend" />}
      </div>

      <footer>
        Tip: drag the marker to move location. Ensure your backend proxy (Express/Next) is running and exposes <code>/api/impact</code> and <code>/api/impact/tiles</code> endpoints.
      </footer>
    </div>
  )
}
