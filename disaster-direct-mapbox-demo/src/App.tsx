import { useEffect, useMemo, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import { defaultBaseUrl, getImpact, makeMapboxTransformRequest, makeUnsignedTileTemplate, getLegendUrl } from '@disaster-direct/sdk'

(mapboxgl as any).accessToken = import.meta.env.VITE_MAPBOX_TOKEN || 'no-token';

export default function App() {
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const [lat, setLat] = useState(33.749)
  const [lng, setLng] = useState(-84.388)
  const [impact, setImpact] = useState<number | null>(null)
  const [legendUrl, setLegendUrl] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [pollen, setPollen] = useState(true)
  const [hmac, setHmac] = useState(false)
  const baseUrl = defaultBaseUrl

  const tileTemplate = useMemo(() => {
    return makeUnsignedTileTemplate('/api/impact/tiles/{z}/{x}/{y}.png', {
      pollen: pollen ? 1 : 0, grid: 3, scheme: 'viridis', ttl: 180
    })
  }, [pollen])

  useEffect(() => {
    if (mapRef.current) return
    const transformRequest = hmac ? makeMapboxTransformRequest(baseUrl, '/api/sign/tile') : undefined

    const map = new mapboxgl.Map({
      container: 'map',
      style: { version: 8, sources: {}, layers: [] },
      center: [lng, lat],
      zoom: 9,
      transformRequest
    })
    mapRef.current = map

    map.on('load', () => {
      map.addSource('impact', { type: 'raster', tiles: [ tileTemplate ], tileSize: 256 } as any)
      map.addLayer({ id: 'impact', type: 'raster', source: 'impact' })
    })

    const el = document.createElement('div')
    el.style.cssText = 'width:16px;height:16px;background:#ef4444;border:2px solid white;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,0.2);'
    const marker = new mapboxgl.Marker({ element: el, draggable: true }).setLngLat([lng, lat]).addTo(map)
    marker.on('dragend', () => {
      const { lng, lat } = marker.getLngLat()
      setLng(lng); setLat(lat)
      map.setCenter([lng, lat])
    })

    return () => map.remove()
  }, [])

  useEffect(() => {
    const map = mapRef.current; if (!map) return
    const tr = hmac ? makeMapboxTransformRequest(baseUrl, '/api/sign/tile') : undefined
    // @ts-ignore: internal
    if (map._requestManager && tr) map._requestManager.setTransformRequest(tr)

    if (map.getSource('impact')) { map.removeLayer('impact'); map.removeSource('impact') }
    map.addSource('impact', { type: 'raster', tiles: [ tileTemplate ], tileSize: 256 } as any)
    map.addLayer({ id: 'impact', type: 'raster', source: 'impact' })
  }, [tileTemplate, hmac, baseUrl])

  useEffect(() => {
    setError(''); setImpact(null)
    getImpact(baseUrl, lat, lng, pollen).then(r => {
      if (r.ok) setImpact(Math.round(r.data.impactScore))
      else setError(r.userMessage)
    }).catch(e => setError(String(e)))

    getLegendUrl(baseUrl, { scheme: 'viridis', width: 256, height: 48, bg: 'solid' }, hmac)
      .then(setLegendUrl)
      .catch(() => setLegendUrl(''))
  }, [lat, lng, pollen, baseUrl, hmac])

  return (
    <div className="app">
      <header>
        <strong>Disaster Direct • Mapbox GL Demo</strong>
        <span className="pill">base: {baseUrl}</span>
        <label>Lat <input type="number" step="0.001" value={lat} onChange={e => setLat(parseFloat(e.target.value))} /></label>
        <label>Lng <input type="number" step="0.001" value={lng} onChange={e => setLng(parseFloat(e.target.value))} /></label>
        <label><input type="checkbox" checked={pollen} onChange={e => setPollen(e.target.checked)} /> Pollen</label>
        <label><input type="checkbox" checked={hmac} onChange={e => setHmac(e.target.checked)} /> HMAC signing</label>
        <span>{impact != null ? `Impact: ${impact}` : (error ? <span className="error">Error: {error}</span> : 'Loading impact…')}</span>
      </header>

      <div id="map" style={{position:'relative', height:'100%'}} />

      <div className="legend" style={{ position:'absolute', bottom:12, left:12, background:'rgba(255,255,255,0.9)', padding:8, borderRadius:8 }}>
        <div style={{ fontSize: 12, marginBottom: 6 }}>Legend (viridis){hmac ? ' • signed' : ''}</div>
        {legendUrl && <img src={legendUrl} alt="Legend" />}
      </div>

      <footer>Tip: set <code>VITE_MAPBOX_TOKEN</code> in <code>.env</code> if you later add Mapbox basemaps. This demo uses a blank style and your raster tiles.</footer>
    </div>
  )
}
