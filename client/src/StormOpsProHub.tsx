import { useState, useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';

// Define role-based access control
type UserRole = 'field' | 'ops' | 'admin';

interface RoleConfig {
  field: string[];
  ops: string[];  
  admin: string[];
}

const ROLE_TABS: RoleConfig = {
  field: ['map', 'inbox', 'multiview', 'owner', 'customers'],
  ops: ['map', 'inbox', 'multiview', 'votix', 'flyt', 'deploy', 'dji', 'dsps', 'owner', 'customers', 'reports', 'legal', 'contractor'],
  admin: ['map', 'inbox', 'multiview', 'votix', 'flyt', 'deploy', 'dji', 'dsps', 'owner', 'customers', 'reports', 'legal', 'contractor']
};

// Radar Layer Component
function RadarLayer({ enabled }: { enabled: boolean }) {
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;
    
    const script = document.createElement('script');
    script.src = 'https://api.rainviewer.com/public/weather-maps.js';
    script.onload = () => {
      // @ts-ignore
      if (window.RainViewer) {
        // @ts-ignore
        window.RainViewer.showFrame({
          map: document.querySelector('.leaflet-container'),
          kind: 'radar',
          colorScheme: 2,
          tileSize: 256,
          smoothAnimation: true
        });
      }
    };
    document.head.appendChild(script);
    
    return () => {
      document.head.removeChild(script);
    };
  }, [enabled]);
  
  return null;
}

// NOAA Alerts Layer Component  
function NOAAAlertsLayer({ enabled }: { enabled: boolean }) {
  const [map, setMap] = useState<any>(null);
  
  useEffect(() => {
    const mapContainer = document.querySelector('.leaflet-container');
    if (mapContainer && !map) {
      // @ts-ignore
      setMap(window.L?.map(mapContainer));
    }
  }, []);
  
  useEffect(() => {
    if (!enabled || !map) return;
    
    const alertsLayer = (window as any).L?.geoJSON(null, {
      style: { color: '#ff6b6b', weight: 2, fillOpacity: 0.3 }
    });
    
    if (alertsLayer) {
      alertsLayer.addTo(map);
      
      // Fetch NOAA alerts
      fetch('https://api.weather.gov/alerts/active')
        .then(res => res.json())
        .then(data => {
          if (data.features) {
            alertsLayer.addData(data.features);
          }
        })
        .catch(console.error);
    }
    
    return () => {
      if (alertsLayer && map) {
        map.removeLayer(alertsLayer);
      }
    };
  }, [enabled, map]);
  return null;
}

function QuickMap({ radarOn, alertsOn }: { radarOn: boolean; alertsOn: boolean }) {
  const [lat, setLat] = useState(() => Number(localStorage.getItem("mapLat")) || 32.51);
  const [lng, setLng] = useState(() => Number(localStorage.getItem("mapLng")) || -84.87);
  const [z, setZ]   = useState(() => Number(localStorage.getItem("mapZoom")) || 7);
  const [showMarkers, setShowMarkers] = useState(true);
  const position = useMemo(() => [lat, lng] as [number, number], [lat, lng]);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);
  const save = () => {
    localStorage.setItem("mapLat", String(lat));
    localStorage.setItem("mapLng", String(lng));
    localStorage.setItem("mapZoom", String(z));
  };

  // focus from Inbox
  useEffect(() => {
    function onFocus(e: any){
      const d = e.detail || {};
      if (!mapRef.current || !d.lat || !d.lon) return;
      mapRef.current.setView([d.lat, d.lon], d.zoom || 18);
      const L = (window as any).L; if (!L) return;
      if (markerRef.current) { mapRef.current.removeLayer(markerRef.current); markerRef.current = null; }
      markerRef.current = L.marker([d.lat, d.lon]).addTo(mapRef.current);
    }
    window.addEventListener('focusLocation', onFocus);
    return () => window.removeEventListener('focusLocation', onFocus);
  }, []);

  // live markers
  useEffect(() => {
    const L = (window as any).L; if (!L || !mapRef.current) return;
    if (markersLayerRef.current) { mapRef.current.removeLayer(markersLayerRef.current); }
    markersLayerRef.current = L.layerGroup().addTo(mapRef.current);

    async function addItem(it: any){
      if (!it || !it.lat || !it.lon) return;
      const icon = L.divIcon({ className:'damage-pin',
        html:`<div style="background:#ef4444;color:#fff;padding:2px 6px;border-radius:8px;">${(it.tags?.[0]||'damage')}</div>` });
      const m = L.marker([it.lat, it.lon], { icon });
      m.bindPopup(`<b>${it.address||''}</b><br/>${(it.tags||[]).join(', ')||''}`);
      markersLayerRef.current.addLayer(m);
    }

    let pollId: any;
    fetch('/api/inbox').then(r=>r.json()).then(arr => (arr||[]).forEach(addItem)).catch(()=>{});
    const ev = new EventSource('/api/stream');
    ev.onmessage = m => { try { addItem(JSON.parse(m.data)); } catch {} };
    ev.onerror   = () => { ev.close(); pollId = setInterval(() => {
      fetch('/api/inbox').then(r=>r.json()).then(arr => (arr||[]).forEach(addItem)).catch(()=>{});
    }, 15000); };

    return () => { ev.close(); if (pollId) clearInterval(pollId); if (markersLayerRef.current) mapRef.current.removeLayer(markersLayerRef.current); };
  }, []);

  return (
    <div className="w-full bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="p-4 space-y-3">
        <div className="grid grid-cols-3 gap-2">
          <input type="number" step="0.0001" value={lat} onChange={(e)=>setLat(Number(e.target.value))} placeholder="Latitude" className="border border-gray-300 rounded-md px-2 py-1" />
          <input type="number" step="0.0001" value={lng} onChange={(e)=>setLng(Number(e.target.value))} placeholder="Longitude" className="border border-gray-300 rounded-md px-2 py-1" />
          <input type="number" step="1" min={2} max={12} value={z} onChange={(e)=>setZ(Number(e.target.value))} placeholder="Zoom" className="border border-gray-300 rounded-md px-2 py-1" />
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm flex items-center gap-2">
            <input type="checkbox" checked={showMarkers} onChange={(e)=>{
              setShowMarkers(e.target.checked);
              if (!mapRef.current || !markersLayerRef.current) return;
              if (e.target.checked) markersLayerRef.current.addTo(mapRef.current);
              else mapRef.current.removeLayer(markersLayerRef.current);
            }} />
            Show damage markers
          </label>
          <button onClick={save} className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 font-medium transition-colors">Save View</button>
        </div>
        <div className="h-[420px] rounded-2xl overflow-hidden">
          <MapContainer ref={(m: any)=>{mapRef.current=m;}} center={position} zoom={z} className="h-full w-full">
            <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <RadarLayer enabled={radarOn} />
            <NOAAAlertsLayer enabled={alertsOn} />
          </MapContainer>
        </div>
      </div>
    </div>
  );
}

// ===== Tags & Filters =====
const TAGS = [
  'tree_on_roof','tree_on_building','tree_on_fence','tree_on_barn','tree_on_shed','tree_on_car','tree_in_pool','tree_on_playground','line_down','structure_damage'
];

function InboxTabs({ items, filters, setFilters }: any) {
  const filteredItems = items.filter((item: any) => {
    if (filters.search && !item.address?.toLowerCase().includes(filters.search.toLowerCase())) return false;
    if (filters.tags.length && !filters.tags.some((tag: string) => item.tags?.includes(tag))) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex gap-2 items-center flex-wrap">
        <input
          type="text"
          placeholder="Search addresses..."
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          className="border border-gray-300 rounded-md px-3 py-1 text-sm"
        />
        <select
          value=""
          onChange={(e) => {
            const tag = e.target.value;
            if (tag && !filters.tags.includes(tag)) {
              setFilters({ ...filters, tags: [...filters.tags, tag] });
            }
          }}
          className="border border-gray-300 rounded-md px-3 py-1 text-sm"
        >
          <option value="">Add tag filter...</option>
          {TAGS.map(tag => (
            <option key={tag} value={tag}>{tag.replace(/_/g, ' ')}</option>
          ))}
        </select>
        {filters.tags.map((tag: string) => (
          <span key={tag} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
            {tag.replace(/_/g, ' ')}
            <button
              onClick={() => setFilters({ ...filters, tags: filters.tags.filter((t: string) => t !== tag) })}
              className="ml-1 text-blue-600 hover:text-blue-800"
            >
              ×
            </button>
          </span>
        ))}
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {filteredItems.map((item: any) => (
          <InboxCard key={item.id} item={item} />
        ))}
        {filteredItems.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No items match your filters
          </div>
        )}
      </div>
    </div>
  );
}

function InboxCard({ item }: { item: any }) {
  function focusOnMap() {
    if (!item.lat || !item.lon) return;
    const event = new CustomEvent('focusLocation', {
      detail: { lat: item.lat, lon: item.lon, zoom: 18 }
    });
    window.dispatchEvent(event);
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors">
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <div className="font-medium text-sm">{item.address || 'Unknown Address'}</div>
          <div className="text-xs text-gray-500">
            Provider: {item.provider} • {new Date(item.timestamp).toLocaleString()}
          </div>
        </div>
        {item.lat && item.lon && (
          <button
            onClick={focusOnMap}
            className="text-blue-600 hover:text-blue-800 text-xs underline ml-2"
          >
            View on Map
          </button>
        )}
      </div>
      
      {item.tags && item.tags.length > 0 && (
        <div className="flex gap-1 mb-2 flex-wrap">
          {item.tags.map((tag: string) => (
            <span key={tag} className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs">
              {tag.replace(/_/g, ' ')}
            </span>
          ))}
        </div>
      )}
      
      {item.notes && (
        <div className="text-sm text-gray-700 mt-2">{item.notes}</div>
      )}
      
      {item.mediaUrl && (
        <div className="mt-2">
          <a 
            href={item.mediaUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 text-xs underline"
          >
            View Media
          </a>
        </div>
      )}
    </div>
  );
}

// ===== Provider Tab Component =====
function ProviderTab({ name, hlsKey, iframeKey, portal }: {
  name: string;
  hlsKey: string;
  iframeKey: string;
  portal: string;
}) {
  const [mode, setMode] = useState<'iframe' | 'hls'>('iframe');
  const [hlsUrl, setHlsUrl] = useState(() => localStorage.getItem(hlsKey) || '');
  const [iframeUrl, setIframeUrl] = useState(() => localStorage.getItem(iframeKey) || '');

  useEffect(() => {
    localStorage.setItem(hlsKey, hlsUrl);
  }, [hlsUrl, hlsKey]);

  useEffect(() => {
    localStorage.setItem(iframeKey, iframeUrl);
  }, [iframeUrl, iframeKey]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <h3 className="text-lg font-semibold">{name}</h3>
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setMode('iframe')}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              mode === 'iframe' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Portal
          </button>
          <button
            onClick={() => setMode('hls')}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              mode === 'hls' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Live Stream
          </button>
        </div>
        <button
          onClick={() => window.open(portal, '_blank')}
          className="text-blue-600 hover:text-blue-800 text-sm underline"
        >
          Open {name} Portal
        </button>
      </div>

      {mode === 'iframe' && (
        <div className="space-y-2">
          <input
            type="text"
            placeholder={`${name} portal URL...`}
            value={iframeUrl}
            onChange={(e) => setIframeUrl(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          />
          {iframeUrl && (
            <div className="h-[500px] border border-gray-200 rounded-lg overflow-hidden">
              <iframe
                src={iframeUrl}
                className="w-full h-full"
                title={`${name} Portal`}
              />
            </div>
          )}
        </div>
      )}

      {mode === 'hls' && (
        <div className="space-y-2">
          <input
            type="text"
            placeholder={`${name} HLS stream URL...`}
            value={hlsUrl}
            onChange={(e) => setHlsUrl(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          />
          {hlsUrl && (
            <div className="h-[500px] border border-gray-200 rounded-lg overflow-hidden bg-black">
              <video
                controls
                className="w-full h-full"
                src={hlsUrl}
              >
                Your browser does not support the video tag.
              </video>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ===== Multi-View Component =====
function MultiView() {
  const [streams, setStreams] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('multiViewStreams') || '[]');
    } catch {
      return [];
    }
  });
  const [newStreamUrl, setNewStreamUrl] = useState('');

  useEffect(() => {
    localStorage.setItem('multiViewStreams', JSON.stringify(streams));
  }, [streams]);

  const addStream = () => {
    if (newStreamUrl && !streams.includes(newStreamUrl)) {
      setStreams([...streams, newStreamUrl]);
      setNewStreamUrl('');
    }
  };

  const removeStream = (index: number) => {
    setStreams(streams.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Add stream URL..."
          value={newStreamUrl}
          onChange={(e) => setNewStreamUrl(e.target.value)}
          className="flex-1 border border-gray-300 rounded-md px-3 py-2"
          onKeyPress={(e) => e.key === 'Enter' && addStream()}
        />
        <button
          onClick={addStream}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium transition-colors"
        >
          Add Stream
        </button>
      </div>

      {streams.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No streams added yet. Add drone feed URLs to view multiple streams simultaneously.
        </div>
      )}

      <div className={`grid gap-4 ${
        streams.length === 1 ? 'grid-cols-1' :
        streams.length === 2 ? 'grid-cols-2' :
        streams.length <= 4 ? 'grid-cols-2' :
        'grid-cols-3'
      }`}>
        {streams.map((streamUrl, index) => (
          <div key={index} className="relative border border-gray-200 rounded-lg overflow-hidden bg-black">
            <button
              onClick={() => removeStream(index)}
              className="absolute top-2 right-2 z-10 bg-red-600 text-white w-6 h-6 rounded-full text-xs hover:bg-red-700 transition-colors"
            >
              ×
            </button>
            <div className="aspect-video">
              <video
                controls
                className="w-full h-full object-cover"
                src={streamUrl}
                muted
                autoPlay
              >
                Your browser does not support the video tag.
              </video>
            </div>
            <div className="p-2 bg-gray-800 text-white text-xs truncate">
              {streamUrl}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ===== DSP Directory Component =====
function DSPDirectory() {
  const [dsps, setDsps] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('dspDirectory') || '[]');
    } catch {
      return [];
    }
  });
  const [newDsp, setNewDsp] = useState({ name: '', contact: '', location: '', rate: '', specialties: '' });

  useEffect(() => {
    localStorage.setItem('dspDirectory', JSON.stringify(dsps));
  }, [dsps]);

  const addDsp = () => {
    if (newDsp.name && newDsp.contact) {
      setDsps([...dsps, { ...newDsp, id: Date.now() }]);
      setNewDsp({ name: '', contact: '', location: '', rate: '', specialties: '' });
    }
  };

  const removeDsp = (id: number) => {
    setDsps(dsps.filter((dsp: any) => dsp.id !== id));
  };

  return (
    <div className="space-y-4">
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-4">Add New DSP</h3>
        <div className="grid md:grid-cols-2 gap-3">
          <input
            type="text"
            placeholder="DSP Name"
            value={newDsp.name}
            onChange={(e) => setNewDsp({ ...newDsp, name: e.target.value })}
            className="border border-gray-300 rounded-md px-3 py-2"
          />
          <input
            type="text"
            placeholder="Contact Info"
            value={newDsp.contact}
            onChange={(e) => setNewDsp({ ...newDsp, contact: e.target.value })}
            className="border border-gray-300 rounded-md px-3 py-2"
          />
          <input
            type="text"
            placeholder="Location/Service Area"
            value={newDsp.location}
            onChange={(e) => setNewDsp({ ...newDsp, location: e.target.value })}
            className="border border-gray-300 rounded-md px-3 py-2"
          />
          <input
            type="text"
            placeholder="Rate ($/hour)"
            value={newDsp.rate}
            onChange={(e) => setNewDsp({ ...newDsp, rate: e.target.value })}
            className="border border-gray-300 rounded-md px-3 py-2"
          />
          <input
            type="text"
            placeholder="Specialties"
            value={newDsp.specialties}
            onChange={(e) => setNewDsp({ ...newDsp, specialties: e.target.value })}
            className="border border-gray-300 rounded-md px-3 py-2 md:col-span-2"
          />
        </div>
        <button
          onClick={addDsp}
          className="mt-3 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium transition-colors"
        >
          Add DSP
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {dsps.map((dsp: any) => (
          <div key={dsp.id} className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-semibold">{dsp.name}</h4>
              <button
                onClick={() => removeDsp(dsp.id)}
                className="text-red-600 hover:text-red-800 text-sm"
              >
                Remove
              </button>
            </div>
            <div className="space-y-1 text-sm text-gray-600">
              <div><strong>Contact:</strong> {dsp.contact}</div>
              {dsp.location && <div><strong>Location:</strong> {dsp.location}</div>}
              {dsp.rate && <div><strong>Rate:</strong> ${dsp.rate}/hour</div>}
              {dsp.specialties && <div><strong>Specialties:</strong> {dsp.specialties}</div>}
            </div>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => window.open(`tel:${dsp.contact.replace(/[^0-9+]/g, '')}`, '_self')}
                className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors"
              >
                Call
              </button>
              <button
                onClick={() => window.open(`sms:${dsp.contact.replace(/[^0-9+]/g, '')}`, '_self')}
                className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
              >
                Text
              </button>
            </div>
          </div>
        ))}
      </div>

      {dsps.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No DSPs added yet. Add drone service providers to build your network.
        </div>
      )}
    </div>
  );
}

// ===== Owner Lookup Component =====
function OwnerLookup() {
  const [address, setAddress] = useState('');
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const lookup = async () => {
    if (!address.trim()) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/owner-lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address })
      });
      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error('Lookup failed:', error);
      setResults({ error: 'Lookup failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-4">Property Owner Lookup</h3>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Enter property address..."
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="flex-1 border border-gray-300 rounded-md px-3 py-2"
            onKeyPress={(e) => e.key === 'Enter' && lookup()}
          />
          <button
            onClick={lookup}
            disabled={loading || !address.trim()}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 font-medium transition-colors disabled:opacity-50"
          >
            {loading ? 'Searching...' : 'Lookup'}
          </button>
        </div>
      </div>

      {results && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h4 className="font-semibold mb-3">Lookup Results</h4>
          {results.error ? (
            <div className="text-red-600">{results.error}</div>
          ) : (
            <div className="space-y-2">
              {results.owner && (
                <div><strong>Owner:</strong> {results.owner}</div>
              )}
              {results.phone && (
                <div><strong>Phone:</strong> {results.phone}</div>
              )}
              {results.email && (
                <div><strong>Email:</strong> {results.email}</div>
              )}
              {results.mailingAddress && (
                <div><strong>Mailing Address:</strong> {results.mailingAddress}</div>
              )}
              {results.propertyValue && (
                <div><strong>Property Value:</strong> ${results.propertyValue.toLocaleString()}</div>
              )}
              {results.yearBuilt && (
                <div><strong>Year Built:</strong> {results.yearBuilt}</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function StormOpsProHub() {
  const [activeTab, setActiveTab] = useState("map");
  const [userRole, setUserRole] = useState<UserRole>(() => 
    (localStorage.getItem('userRole') as UserRole) || 'field'
  );
  const [radarEnabled, setRadarEnabled] = useState(false);
  const [alertsEnabled, setAlertsEnabled] = useState(false);
  const [inboxItems, setInboxItems] = useState<any[]>([]);
  const [filters, setFilters] = useState({ search: '', tags: [] });

  // Permission checker
  const allow = (tab: string): boolean => ROLE_TABS[userRole].includes(tab);

  // Role change handler  
  const changeRole = (newRole: UserRole) => {
    setUserRole(newRole);
    localStorage.setItem('userRole', newRole);
    // Switch to allowed tab if current tab is not accessible
    if (!ROLE_TABS[newRole].includes(activeTab)) {
      setActiveTab('map');
    }
  };

  // Load inbox items on mount
  useEffect(() => {
    fetch('/api/inbox')
      .then(res => res.json())
      .then(data => setInboxItems(data || []))
      .catch(console.error);

    // Listen for real-time updates
    const eventSource = new EventSource('/api/stream');
    eventSource.onmessage = (event) => {
      try {
        const newItem = JSON.parse(event.data);
        setInboxItems(prev => [newItem, ...prev]);
      } catch (error) {
        console.error('Failed to parse SSE data:', error);
      }
    };

    return () => eventSource.close();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-full mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">Storm Operations Pro Hub</h1>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Role:</span>
                <select 
                  value={userRole} 
                  onChange={(e) => changeRole(e.target.value as UserRole)}
                  className="border border-gray-300 rounded-md px-2 py-1 text-sm"
                >
                  <option value="field">Field</option>
                  <option value="ops">Ops</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <label className="text-sm flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={radarEnabled}
                    onChange={(e) => setRadarEnabled(e.target.checked)}
                  />
                  Radar
                </label>
                <label className="text-sm flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={alertsEnabled}
                    onChange={(e) => setAlertsEnabled(e.target.checked)}
                  />
                  Alerts
                </label>
              </div>
              <div className="text-sm text-gray-600">
                🌪️ Live Storm Ops • {new Date().toLocaleTimeString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-full mx-auto p-4">
        <header className="mb-6">
          <p className="text-gray-600 text-sm">
            Comprehensive storm operations platform with real-time weather monitoring, drone coordination, and incident management.
          </p>
        </header>

        <div className="w-full">
          <div className="border-b border-gray-200 bg-white rounded-t-lg">
            <nav className="-mb-px flex space-x-8 px-4 overflow-x-auto">
              {[
                { id: "map", label: "🗺️ Storm Map" },
                { id: "inbox", label: "📥 Inbox" },
                { id: "multiview", label: "📺 Multi-View" },
                { id: "votix", label: "🔴 VOTIX" },
                { id: "flyt", label: "🚁 FlytBase" },
                { id: "deploy", label: "📹 DroneDeploy" },
                { id: "dji", label: "🛸 DJI FH2" },
                { id: "dsps", label: "👥 Hire Pilots" },
                { id: "owner", label: "🏢 Owner Lookup" },
                { id: "customers", label: "👤 CRM" },
                { id: "reports", label: "📊 Reports" },
                { id: "legal", label: "⚖️ Legal" },
                { id: "contractor", label: "🔧 Contractor" }
              ].filter(tab => allow(tab.id)).map(tab => (
                <button
                  key={tab.id}
                  className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="bg-white border-l border-r border-b border-gray-200 rounded-b-lg min-h-[600px]">
            {/* Storm Map Tab */}
            {activeTab === "map" && (
              <div className="p-4">
                <QuickMap radarOn={radarEnabled} alertsOn={alertsEnabled} />
              </div>
            )}

            {/* Inbox Tab */}
            {activeTab === "inbox" && (
              <div className="p-4">
                <InboxTabs items={inboxItems} filters={filters} setFilters={setFilters} />
              </div>
            )}

            {/* Multi-View Tab */}
            {activeTab === "multiview" && (
              <div className="p-4">
                <MultiView />
              </div>
            )}

            {/* VOTIX Tab */}
            {activeTab === "votix" && (
              <div className="p-4">
                <ProviderTab 
                  name="VOTIX" 
                  hlsKey="votixHls" 
                  iframeKey="votixIframe" 
                  portal="https://platform.votix.com/" 
                />
              </div>
            )}

            {/* FlytBase Tab */}
            {activeTab === "flyt" && (
              <div className="p-4">
                <ProviderTab 
                  name="FlytBase" 
                  hlsKey="flytHls" 
                  iframeKey="flytIframe" 
                  portal="https://my.flytbase.com/" 
                />
              </div>
            )}

            {/* DroneDeploy Tab */}
            {activeTab === "deploy" && (
              <div className="p-4">
                <ProviderTab 
                  name="DroneDeploy" 
                  hlsKey="ddHls" 
                  iframeKey="ddIframe" 
                  portal="https://www.dronedeploy.com/live/" 
                />
              </div>
            )}

            {/* DJI Tab */}
            {activeTab === "dji" && (
              <div className="p-4">
                <ProviderTab 
                  name="DJI FlightHub 2" 
                  hlsKey="fh2Hls" 
                  iframeKey="fh2Iframe" 
                  portal="https://flighthub2.dji.com/" 
                />
              </div>
            )}

            {/* DSPs Tab */}
            {activeTab === "dsps" && (
              <div className="p-4">
                <DSPDirectory />
              </div>
            )}

            {/* Owner Lookup Tab */}
            {activeTab === "owner" && (
              <div className="p-4">
                <OwnerLookup />
              </div>
            )}

            {/* CRM Tab */}
            {activeTab === "customers" && (
              <div className="p-4">
                <CustomersCRM />
              </div>
            )}

            {/* Reports Tab */}
            {activeTab === "reports" && (
              <div className="p-4">
                <ReportBuilder />
              </div>
            )}

            {/* Legal Tab */}
            {activeTab === "legal" && (
              <div className="p-4">
                <LiensLegal />
              </div>
            )}

            {/* Contractor Tab */}
            {activeTab === "contractor" && (
              <div className="p-4">
                <ContractorPortal />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ===== BUSINESS COMPONENTS =====

// --- Customers CRM (pipeline, comms log, docs) ---
function useCustomers(){
  const [list, setList] = useState(()=>{ try{ return JSON.parse(localStorage.getItem('customers')||'[]'); }catch{ return []; } });
  useEffect(()=>{ localStorage.setItem('customers', JSON.stringify(list)); }, [list]);
  function add(c: any){ setList((prev: any)=>[ { id: String(Date.now()), status:'new', timeline:[], docs:[], messages:[], ...c }, ...prev ]); }
  function update(id: string, patch: any){ setList((prev: any)=> prev.map((c: any)=> c.id===id ? { ...c, ...patch } : c)); }
  function pushMsg(id: string, msg: any){ setList((prev: any)=> prev.map((c: any)=> c.id===id ? { ...c, messages:[...c.messages, { ts: Date.now(), ...msg }] } : c)); }
  function pushDoc(id: string, doc: any){ setList((prev: any)=> prev.map((c: any)=> c.id===id ? { ...c, docs:[...c.docs, doc] } : c)); }
  function pushEvent(id: string, evt: any){ setList((prev: any)=> prev.map((c: any)=> c.id===id ? { ...c, timeline:[...c.timeline, { ts: Date.now(), ...evt }] } : c)); }
  return { list, add, update, pushMsg, pushDoc, pushEvent };
}
const PIPELINE = ['new','contacted','contract_signed','scheduled','in_progress','completed','claim_submitted','awaiting_payment','paid'];
function CustomersCRM(){
  const { list, add, update, pushMsg, pushDoc, pushEvent } = useCustomers();
  const [form, setForm] = useState({ name:'', address:'', phone:'', email:'', claimNumber:'', insurer:'' });
  function create(){ if(!form.name && !form.address) return; add(form); setForm({ name:'', address:'', phone:'', email:'', claimNumber:'', insurer:'' }); }
  return (
    <div className="space-y-4">
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="p-4 space-y-2">
          <div className="text-lg font-semibold">Customer Intake</div>
          <div className="grid md:grid-cols-3 gap-2">
            <input value={form.name} onChange={(e)=>setForm({...form,name:e.target.value})} placeholder="Owner name" className="border border-gray-300 rounded-md px-2 py-1" />
            <input value={form.address} onChange={(e)=>setForm({...form,address:e.target.value})} placeholder="Service address" className="border border-gray-300 rounded-md px-2 py-1" />
            <input value={form.phone} onChange={(e)=>setForm({...form,phone:e.target.value})} placeholder="Phone" className="border border-gray-300 rounded-md px-2 py-1" />
            <input value={form.email} onChange={(e)=>setForm({...form,email:e.target.value})} placeholder="Email" className="border border-gray-300 rounded-md px-2 py-1" />
            <input value={form.insurer} onChange={(e)=>setForm({...form,insurer:e.target.value})} placeholder="Insurance company" className="border border-gray-300 rounded-md px-2 py-1" />
            <input value={form.claimNumber} onChange={(e)=>setForm({...form,claimNumber:e.target.value})} placeholder="Claim #" className="border border-gray-300 rounded-md px-2 py-1" />
          </div>
          <div className="flex gap-2"><button onClick={create} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium transition-colors">Create Customer</button></div>
          <div className="text-xs text-gray-500">Everything is logged—calls, texts, emails, docs, photos, reports.</div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {list.map((c: any) => <CustomerCard key={c.id} c={c} update={update} pushMsg={pushMsg} pushDoc={pushDoc} pushEvent={pushEvent} />)}
      </div>
    </div>
  );
}
function CustomerCard({ c, update, pushMsg, pushDoc, pushEvent }: any){
  const [note, setNote] = useState(''); const [msg, setMsg] = useState('');
  
  // Claim-threaded email messages
  const [thread, setThread] = useState([]);
  useEffect(()=>{
    if (!c.claimNumber) return;
    fetch(`/api/messages?claim=${encodeURIComponent(c.claimNumber)}`)
      .then(r=>r.json()).then(setThread).catch(()=>{});
  }, [c.claimNumber]);
  async function sendSMS(){ await fetch('/api/sms',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ to:c.phone, body: msg })}); pushMsg(c.id,{ dir:'out', type:'sms', to:c.phone, body:msg }); setMsg(''); }
  async function sendEmail(){ await fetch('/api/email',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ to:c.email, subject:`Storm work update for ${c.address}`, html: msg, claimNumber: c.claimNumber })}); pushMsg(c.id,{ dir:'out', type:'email', to:c.email, body:msg }); setMsg(''); }
  function changeStatus(s: string){ update(c.id,{ status:s }); pushEvent(c.id,{ type:'status', to:s }); }
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-lg font-semibold">{c.name||'Unknown Owner'}</div>
            <div className="text-sm text-gray-500">{c.address}</div>
            <div className="text-xs">{c.insurer || 'Insurer N/A'} • Claim #{c.claimNumber||'—'}</div>
          </div>
          <select className="border rounded-md px-2 py-1" value={c.status} onChange={(e)=>changeStatus(e.target.value)}>
            {PIPELINE.map(p => <option key={p} value={p}>{p.replaceAll('_',' ')}</option>)}
          </select>
        </div>

        <div className="grid md:grid-cols-3 gap-3">
          <div className="space-y-2">
            <div className="font-medium">Communications</div>
            <input value={msg} onChange={(e)=>setMsg(e.target.value)} placeholder="Write SMS/Email..." className="border border-gray-300 rounded-md px-2 py-1 w-full" />
            <div className="flex gap-2">
              {c.phone && <button onClick={sendSMS} className="bg-blue-600 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-700">Send SMS</button>}
              {c.email && <button onClick={sendEmail} className="border border-gray-300 text-gray-700 px-3 py-1 rounded-md text-sm hover:bg-gray-50">Send Email</button>}
              {c.phone && <a href={`tel:${c.phone.replace(/[^0-9+]/g,'')}`}><button className="border border-gray-300 text-gray-700 px-3 py-1 rounded-md text-sm hover:bg-gray-50">Call</button></a>}
            </div>
            <div className="space-y-1 max-h-40 overflow-auto text-xs">
              {/* Local messages */}
              {c.messages?.map((m: any,i: number)=>(<div key={i}>[{new Date(m.ts).toLocaleString()}] {m.type?.toUpperCase()} → {m.to}: {m.body}</div>))}
              
              {/* Claim-threaded email messages */}
              {thread.map((t: any,i: number)=>(<div key={`thread-${i}`} className="border-l-2 border-blue-200 pl-2 bg-blue-50">
                [{new Date(t.ts).toLocaleString()}] EMAIL {t.dir?.toUpperCase()} {t.dir==='out'?'→':'←'} {t.to||t.from}: {t.subject}
              </div>))}
            </div>
            <div className="mt-2 text-xs">
              <div className="font-medium">Insurance Thread</div>
              <div className="max-h-40 overflow-auto space-y-1">
                {thread.map((m,i)=>(
                  <div key={i}>
                    [{new Date(m.ts).toLocaleString()}] {m.dir==='in'?'FROM':'TO'} {m.dir==='in'?m.from:m.to}: <span dangerouslySetInnerHTML={{__html: m.subject||''}} />
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="font-medium">Docs & Media</div>
            <input type="file" multiple onChange={(e)=>{
              const files = Array.from(e.target.files||[]);
              files.forEach((f: any)=> pushDoc(c.id,{ name:f.name, size:f.size }));
            }} className="text-sm" />
            <div className="text-xs text-gray-500">Contracts, proof of insurance, photos/videos. (Hook to /api/upload for persistence.)</div>
            <div className="space-y-1 max-h-40 overflow-auto text-xs">
              {c.docs?.map((d: any,i: number)=>(<div key={i}>📄 {d.name} ({Math.round((d.size||0)/1024)} KB)</div>))}
            </div>
          </div>
          <div className="space-y-2">
            <div className="font-medium">Notes / Timeline</div>
            <input value={note} onChange={(e)=>setNote(e.target.value)} placeholder="Add an internal note" className="border border-gray-300 rounded-md px-2 py-1 w-full" />
            <button onClick={()=>{ pushEvent(c.id,{ type:'note', text:note }); setNote(''); }} className="border border-gray-300 text-gray-700 px-3 py-1 rounded-md text-sm hover:bg-gray-50">Add Note</button>
            <div className="space-y-1 max-h-40 overflow-auto text-xs">
              {c.timeline?.map((t: any,i: number)=>(<div key={i}>[{new Date(t.ts).toLocaleString()}] {t.type} {t.text||t.to||''}</div>))}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button onClick={()=>changeStatus('contract_signed')} className="border border-gray-300 text-gray-700 px-3 py-1 rounded-md text-sm hover:bg-gray-50">Mark Contracted</button>
          <button onClick={()=>changeStatus('claim_submitted')} className="border border-gray-300 text-gray-700 px-3 py-1 rounded-md text-sm hover:bg-gray-50">Mark Claim Submitted</button>
          <button onClick={()=>changeStatus('paid')} className="border border-gray-300 text-gray-700 px-3 py-1 rounded-md text-sm hover:bg-gray-50">Mark Paid</button>
        </div>
      </div>
    </div>
  );
}

// --- Photo Reports (auto captions placeholder + PDF) ---
function ReportBuilder(){
  const [items, setItems] = useState<any[]>([]); // {file, caption}
  const [pdfName, setPdfName] = useState('storm-report.pdf');
  function onFiles(e: any){ const fs = Array.from(e.target.files||[]); setItems((prev: any)=>[...prev, ...fs.map((f: any)=>({ file:f, caption:'Auto: damage detected (placeholder)' }))]); }
  async function autoDescribe(){ setItems((prev: any)=> prev.map((x: any)=> ({...x, caption: x.caption.includes('placeholder')? 'Tree on roof; broken ridge; tarp recommended' : x.caption }))); }
  async function makePDF(){
    try {
      const mod = await import('jspdf'); const { jsPDF } = mod; const doc = new jsPDF();
      for (let i=0;i<items.length;i++){
        const it = items[i]; const dataUrl: any = await new Promise(res=>{ const r=new FileReader(); r.onload=()=>res(r.result); r.readAsDataURL(it.file); });
        if (i>0) doc.addPage();
        doc.setFontSize(14); doc.text(`Photo ${i+1}`, 14, 18);
        doc.addImage(dataUrl, 'JPEG', 14, 24, 180, 120);
        doc.setFontSize(12); wrapText(doc, it.caption, 14, 150, 180, 6);
      }
      doc.save(pdfName);
    } catch(e){ alert('Install jspdf: npm i jspdf'); }
  }
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="p-4 space-y-3">
        <div className="text-lg font-semibold">Photo Reports</div>
        <input type="file" accept="image/*" multiple onChange={onFiles} />
        <div className="grid md:grid-cols-3 gap-3">
          {items.map((it,idx)=> (
            <div key={idx} className="space-y-1">
              <img src={URL.createObjectURL(it.file)} className="w-full h-40 object-cover rounded" />
              <input value={it.caption} onChange={(e)=>setItems(items.map((x,i)=> i===idx?{...x, caption:e.target.value}:x))} className="border border-gray-300 rounded-md px-2 py-1 w-full text-sm" />
            </div>
          ))}
        </div>
        <div className="grid md:grid-cols-3 gap-2 items-center">
          <input value={pdfName} onChange={(e)=>setPdfName(e.target.value)} className="border border-gray-300 rounded-md px-2 py-1" />
          <button onClick={autoDescribe} className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 font-medium transition-colors">AI Describe (placeholder)</button>
          <button onClick={makePDF} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium transition-colors">Generate PDF</button>
        </div>
      </div>
    </div>
  );
}
function wrapText(doc: any, text: string, x: number, y: number, maxWidth: number, lineHeight: number){
  const words = text.split(' '); let line='';
  for (let n=0;n<words.length;n++){ const test = line + words[n] + ' ';
    if (doc.getTextWidth(test) > maxWidth){ doc.text(line.trim(), x, y); line = words[n] + ' '; y+=lineHeight; }
    else line = test;
  }
  if (line) doc.text(line.trim(), x, y);
}

// --- Liens & Legal (reminders + links) ---
function LiensLegal(){
  const [claimDate, setClaimDate] = useState('');       // 30 / 60 day reminders
  const [completeDate, setCompleteDate] = useState(''); // 45 day lien reminder
  const [lienDate, setLienDate] = useState('');         // 10-month warning
  function enableReminders(){
    fetch('/api/reminders', { method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ claimDate, completeDate, lienDate })});
    alert('Reminders scheduled on server (demo).');
  }
  function openNew(url: string) { window.open(url, '_blank', 'noopener,noreferrer'); }
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="p-4 space-y-3">
        <div className="text-lg font-semibold">Liens & Legal Tools</div>
        <div className="grid md:grid-cols-3 gap-2">
          <div><div className="text-sm">Claim Submitted</div><input type="date" value={claimDate} onChange={(e)=>setClaimDate(e.target.value)} className="border border-gray-300 rounded-md px-2 py-1 w-full" /></div>
          <div><div className="text-sm">Work Completed</div><input type="date" value={completeDate} onChange={(e)=>setCompleteDate(e.target.value)} className="border border-gray-300 rounded-md px-2 py-1 w-full" /></div>
          <div><div className="text-sm">Lien Filed</div><input type="date" value={lienDate} onChange={(e)=>setLienDate(e.target.value)} className="border border-gray-300 rounded-md px-2 py-1 w-full" /></div>
        </div>
        <div className="flex gap-2">
          <button onClick={enableReminders} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium transition-colors">Enable Reminders</button>
          <button onClick={()=>openNew('https://www.lienit.com/')} className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 font-medium transition-colors">Open LienIt</button>
          <button onClick={()=>openNew('https://www.lienitnow.com/')} className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 font-medium transition-colors">Open LienItNow</button>
        </div>
        <div className="text-xs text-gray-500">State lien laws vary widely. Use this as a reminder system and consult state-specific counsel for deadlines and rights.</div>
      </div>
    </div>
  );
}

// --- Contractor Portal (Strategic LM) ---
function ContractorPortal(){
  function openNew(url: string) { window.open(url, '_blank', 'noopener,noreferrer'); }
  return (
    <div className="space-y-4">
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="p-4 space-y-2">
          <div className="text-2xl font-bold">Strategic Land Management LLC</div>
          <div>Emergency Storm Response Team</div>
          <div className="text-sm">📞 888-628-2229 • 🌐 <a className="underline" href="https://www.strategiclandmgmt.com" target="_blank" rel="noreferrer">www.strategiclandmgmt.com</a> • ✉️ strategiclandmgmt@gmail.com</div>
          <div className="text-xs text-gray-500">Veteran-owned (disabled veteran). Certified arborist: John Culpepper.</div>
          <div className="grid md:grid-cols-2 gap-3 mt-2">
            <button onClick={()=>openNew('https://disasterloanassistance.sba.gov/')} className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 font-medium transition-colors">SBA Disaster Loans</button>
            <button onClick={()=>openNew('https://www.fema.gov/assistance/individual')} className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 font-medium transition-colors">FEMA Individual Assistance</button>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="p-4 space-y-2">
          <div className="font-semibold">Emergency Tree Removal Contract</div>
          <div className="text-sm text-gray-500">Your uploaded contract is ready to send.</div>
          <div className="flex gap-2">
            <button onClick={()=>openNew('/files/contract.pdf')} className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 font-medium transition-colors">Open Contract</button>
            <button onClick={()=>fetch('/api/email',{
              method:'POST', headers:{'Content-Type':'application/json'},
              body: JSON.stringify({ to:'strategiclandmgmt@gmail.com', subject:'Contract (for signature)', html:'Attached contract', attachments:[{ path:'/files/contract.pdf' }] })
            })} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium transition-colors">Email Contract to Customer</button>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="p-4 space-y-2">
          <div className="font-semibold">Upload Proof of Insurance (optional)</div>
          <input type="file" onChange={(e)=>{/* POST to /api/upload with contractor profile */}} />
          <div className="text-xs text-gray-500">Stored in your Contractor profile; share with customers on request.</div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="p-4 space-y-2">
          <div className="font-semibold">Brochure</div>
          <div className="text-sm">Say "generate brochure" and I'll produce a tri-fold PDF with your content.</div>
        </div>
      </div>
    </div>
  );
}