import { useEffect, useMemo, useRef, useState } from 'react'
import maplibregl, { Map } from 'maplibre-gl'
import { defaultBaseUrl, getImpact, makeUnsignedTileTemplate, getLegendUrl } from '@disaster-direct/sdk'

type Basemap = 'blank' | 'osm';

export default function App() {
  const mapRef = useRef<Map | null>(null)
  const [lat, setLat] = useState(33.749)
  const [lng, setLng] = useState(-84.388)
  const [impact, setImpact] = useState<number | null>(null)
  const [legendUrl, setLegendUrl] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [pollen, setPollen] = useState(true)
  const [basemap, setBasemap] = useState<Basemap>('osm')
  const baseUrl = defaultBaseUrl

  const tileTemplate = useMemo(() => {
    return makeUnsignedTileTemplate('/api/impact/tiles/{z}/{x}/{y}.png', {
      pollen: pollen ? 1 : 0,
      grid: 3,
      scheme: 'viridis',
      ttl: 180
    })
  }, [pollen])

  const styleBlank = useMemo(() => ({
    version: 8, sources: {}, layers: []
  } as any), [])

  const styleOSM = useMemo(() => ({
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
  } as any), [])

  useEffect(() => {
    if (mapRef.current) return
    const map = new maplibregl.Map({
      container: 'map',
      style: basemap === 'osm' ? styleOSM : styleBlank,
      center: [lng, lat],
      zoom: 9
    })
    mapRef.current = map

    map.on('load', () => {
      map.addSource('impact', { type: 'raster', tiles: [ tileTemplate ], tileSize: 256 } as any)
      map.addLayer({ id: 'impact', type: 'raster', source: 'impact' })
    })

    // simple draggable marker
    const el = document.createElement('div')
    el.style.cssText = 'width:16px;height:16px;background:#ef4444;border:2px solid white;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,0.2);'
    const marker = new maplibregl.Marker({ element: el, draggable: true }).setLngLat([lng, lat]).addTo(map)
    marker.on('dragend', () => {
      const { lng, lat } = marker.getLngLat()
      setLng(lng); setLat(lat)
      map.setCenter([lng, lat])
    })

    return () => map.remove()
  }, [])

  useEffect(() => {
    const map = mapRef.current; if (!map) return
    map.setStyle(basemap === 'osm' ? styleOSM : styleBlank)
    map.once('styledata', () => {
      // re-add impact layer after style switch
      if (map.getSource('impact')) { try { map.removeLayer('impact'); map.removeSource('impact'); } catch {} }
      map.addSource('impact', { type: 'raster', tiles: [ tileTemplate ], tileSize: 256 } as any)
      map.addLayer({ id: 'impact', type: 'raster', source: 'impact' })
    })
  }, [basemap, styleBlank, styleOSM, tileTemplate])

  useEffect(() => {
    const map = mapRef.current; if (!map) return
    if (map.getSource('impact')) {
      map.removeLayer('impact'); map.removeSource('impact')
    }
    map.addSource('impact', { type: 'raster', tiles: [ tileTemplate ], tileSize: 256 } as any)
    map.addLayer({ id: 'impact', type: 'raster', source: 'impact' })
  }, [tileTemplate])

  useEffect(() => {
    setError(''); setImpact(null)
    getImpact(baseUrl, lat, lng, pollen).then(r => {
      if (r.ok) setImpact(Math.round(r.data.impactScore))
      else setError(r.userMessage)
    }).catch(e => setError(String(e)))

    getLegendUrl(baseUrl, { scheme: 'viridis', width: 256, height: 48, bg: 'solid' }, false)
      .then(setLegendUrl)
      .catch(() => setLegendUrl(''))
  }, [lat, lng, pollen, baseUrl])

  return (
    <div className="app">
      <header>
        <strong>Disaster Direct • MapLibre GL Demo</strong>
        <span className="pill">base: {baseUrl}</span>
        <label>Lat <input type="number" step="0.001" value={lat} onChange={e => setLat(parseFloat(e.target.value))} /></label>
        <label>Lng <input type="number" step="0.001" value={lng} onChange={e => setLng(parseFloat(e.target.value))} /></label>
        <label><input type="checkbox" checked={pollen} onChange={e => setPollen(e.target.checked)} /> Pollen</label>
        <select className="select" value={basemap} onChange={e => setBasemap(e.target.value as Basemap)}>
          <option value="osm">OSM raster</option>
          <option value="blank">Blank</option>
        </select>
        <span>{impact != null ? `Impact: ${impact}` : (error ? <span className="error">Error: {error}</span> : 'Loading impact…')}</span>
      </header>

      <div id="map" style={{position:'relative', height:'100%'}} />

      <div className="legend" style={{ display: legendUrl ? 'block' : 'none' }}>
        <div style={{ fontSize: 12, marginBottom: 6 }}>Legend (viridis)</div>
        {legendUrl && <img src={legendUrl} alt="Legend" />}
      </div>

      <footer>Token-free MapLibre with OSM raster basemap or a blank canvas + your raster overlay.</footer>
    </div>
  )
}
