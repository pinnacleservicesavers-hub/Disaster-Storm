import { useState, useEffect, useRef, useMemo, createContext, useContext } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

// ===== Role Context for Role-Based Access =====
const RoleContext = createContext<{ role: string; setRole: (role: string) => void }>({ role: 'ops', setRole: () => {} });

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState(() => localStorage.getItem('storm_role') || 'ops');
  
  useEffect(() => {
    localStorage.setItem('storm_role', role);
  }, [role]);
  
  return (
    <RoleContext.Provider value={{ role, setRole }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  return useContext(RoleContext);
}

export function RoleBar() {
  const { role, setRole } = useRole();
  
  const BTN = (code: string, label: string) => (
    <button
      key={code}
      onClick={() => setRole(code)}
      className={`px-3 py-1 rounded-full text-xs border transition-colors ${
        role === code ? 'bg-black text-white border-black' : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
      }`}
      data-testid={`button-role-${code}`}
    >
      {label}
    </button>
  );
  
  return (
    <div className="flex gap-2 items-center p-2 border rounded-md bg-white">
      <span className="text-xs font-medium text-gray-600">Role:</span>
      {BTN('ops', 'Ops')}
      {BTN('field', 'Field')}
      {BTN('admin', 'Admin')}
    </div>
  );
}

// ===== SLA Helper Functions =====
function useNowTick(ms=60000){
  const [now, setNow] = useState(Date.now());
  useEffect(()=>{ const id = setInterval(()=>setNow(Date.now()), ms); return ()=>clearInterval(id); },[ms]);
  return now;
}

function daysSince(ts){ if(!ts) return null; return Math.floor((Date.now()-Number(ts))/86400000); }

function findLastEvent(c, type){
  return (c?.timeline||[]).slice().reverse().find(e=>e.type===type) || null;
}

function slaBadges(c){
  const out = [];
  const claim = findLastEvent(c,'claim_submitted');
  const work = findLastEvent(c,'work_completed');
  const lien = findLastEvent(c,'lien_filed');
  
  if (claim){
    const d = daysSince(claim.ts);
    if (d!=null){
      let tone='bg-gray-300 text-gray-800', txt=`Claim +${d}d`;
      if (d>=60) tone='bg-red-600 text-white'; else if (d>=30) tone='bg-amber-500 text-black';
      out.push({ key:'claim', tone, txt });
    }
  }
  if (work){
    const d = daysSince(work.ts);
    if (d!=null){
      let tone='bg-gray-300 text-gray-800', txt=`Work +${d}d`;
      if (d>=45) tone='bg-red-600 text-white'; else if (d>=30) tone='bg-amber-500 text-black';
      out.push({ key:'work', tone, txt });
    }
  }
  if (lien){
    const d = daysSince(lien.ts);
    if (d!=null){
      let tone='bg-gray-300 text-gray-800', txt=`Lien +${d}d`;
      if (d>=300) tone='bg-amber-500 text-black'; if (d>=330) tone='bg-red-600 text-white';
      out.push({ key:'lien', tone, txt });
    }
  }
  return out;
}

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

function InboxTabs({ items, filters, setFilters, onAcceptLead }: any) {
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
          <InboxCard key={item.id} item={item} onAccept={onAcceptLead} />
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

function InboxCard({ item, onAccept }: { item: any; onAccept?: (item: any) => void }) {
  function focusOnMap() {
    if (!item.lat || !item.lon) return;
    const event = new CustomEvent('focusLocation', {
      detail: { lat: item.lat, lon: item.lon, zoom: 18 }
    });
    window.dispatchEvent(event);
  }

  async function acceptLead() {
    try {
      const response = await fetch('/api/leads/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id })
      });
      const result = await response.json();
      
      if (!result?.ok) {
        alert('Accept failed');
        return;
      }
      
      const customer = result.customer;
      try {
        onAccept?.(customer);
      } catch (e) {
        console.error('Accept callback error:', e);
      }
      
      // Center map on new/merged customer
      try {
        window.dispatchEvent(new CustomEvent('storm-center', {
          detail: { address: customer.address, name: customer.name }
        }));
      } catch (e) {
        console.error('Map center error:', e);
      }
      
      alert(result.merged ? 'Merged into existing customer' : 'Created new customer');
    } catch (error) {
      console.error('Accept error:', error);
      alert('Failed to accept lead');
    }
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
        <div className="flex gap-2 ml-2">
          {item.lat && item.lon && (
            <button
              onClick={focusOnMap}
              className="text-blue-600 hover:text-blue-800 text-xs underline"
            >
              View on Map
            </button>
          )}
          <button
            onClick={acceptLead}
            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
            data-testid={`button-accept-${item.id}`}
          >
            Accept Lead
          </button>
        </div>
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

function StormOpsProHubContent() {
  const [activeTab, setActiveTab] = useState("map");
  const { role: userRole } = useRole();
  const [radarEnabled, setRadarEnabled] = useState(false);
  const [alertsEnabled, setAlertsEnabled] = useState(false);
  const [inboxItems, setInboxItems] = useState<any[]>([]);
  const [filters, setFilters] = useState({ search: '', tags: [] });
  const customers = useCustomers();

  // Permission checker
  const allow = (tab: string): boolean => ROLE_TABS[userRole as UserRole].includes(tab);

  // Switch to allowed tab if current tab is not accessible
  useEffect(() => {
    if (!ROLE_TABS[userRole as UserRole].includes(activeTab)) {
      setActiveTab('map');
    }
  }, [userRole, activeTab]);

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
              <RoleBar />
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
                <StormMap customers={customers} />
              </div>
            )}

            {/* Inbox Tab */}
            {activeTab === "inbox" && (
              <div className="p-4 space-y-4">
                {/* Auto-Generated Lead Inbox */}
                <LeadInbox onCreateCustomer={(customer: any) => {
                  customers.add(customer);
                }} />
                
                {/* Traditional Inbox */}
                <InboxTabs 
                  items={inboxItems} 
                  filters={filters} 
                  setFilters={setFilters}
                  onAcceptLead={(customer: any) => {
                    // Remove the accepted item from inbox
                    setInboxItems(items => items.filter(item => item.id !== customer.fromLead));
                    // Refresh customers list
                    customers.refetch?.();
                  }}
                />
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
                <CustomersPanel />
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

// --- Lead Inbox Component ---
function LeadInbox({ onCreateCustomer }: { onCreateCustomer?: (customer: any) => void }) {
  const [leads, setLeads] = useState<any[]>([]);
  
  useEffect(() => { 
    fetch('/api/leads').then(r => r.json()).then(setLeads).catch(() => {}); 
  }, []);
  
  useEffect(() => {
    const es = new EventSource('/api/drone/events');
    es.onmessage = (ev) => { 
      try { 
        const d = JSON.parse(ev.data); 
        if (d?.type === 'lead' && d.lead) { 
          setLeads(prev => [d.lead, ...prev]); 
        } 
      } catch {} 
    };
    return () => es.close();
  }, []);

  async function accept(id: string) {
    const r = await fetch('/api/leads/accept', { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ id }) 
    }).then(r => r.json()).catch(() => null);
    
    if (!r?.ok) { 
      alert('Accept failed'); 
      return; 
    }
    
    setLeads(ls => ls.filter(x => x.id !== id));
    const cust = r.customer;
    
    try { 
      await onCreateCustomer?.(cust); 
    } catch {}
    
    // Center map
    try { 
      window.dispatchEvent(new CustomEvent('storm-center', { 
        detail: { address: cust.address, name: cust.name } 
      })); 
    } catch {}
    
    alert(r.merged ? 'Merged into existing customer' : 'Created new customer');
  }

  return (
    <div className="border rounded-md p-3">
      <div className="font-semibold mb-2">Lead Inbox</div>
      <div className="text-xs text-muted-foreground mb-2">Auto‑leads generated from drone detections with damage tags.</div>
      <div className="space-y-2 max-h-64 overflow-auto">
        {leads.map(l => (
          <div key={l.id} className="border rounded p-2 text-sm flex items-center justify-between">
            <div>
              <div className="font-medium">{(l.tags || []).join(', ')}</div>
              <div className="text-xs opacity-80">{l.address || `${l.lat}, ${l.lng}`}</div>
              <div className="text-xs opacity-80">{new Date(l.createdAt).toLocaleString()}</div>
            </div>
            <div className="flex gap-2">
              {l.stream && <a className="underline text-xs" href={l.stream} target="_blank" rel="noreferrer">Open stream</a>}
              <Button 
                size="sm" 
                className="px-2 py-1 text-xs bg-emerald-600 hover:bg-emerald-700" 
                onClick={() => accept(l.id)}
              >
                Accept Lead
              </Button>
            </div>
          </div>
        ))}
        {leads.length === 0 && (
          <div className="text-xs text-muted-foreground text-center py-4">
            No leads yet. Leads will appear when drones detect damage.
          </div>
        )}
      </div>
    </div>
  );
}

// --- Enhanced Customers Panel with Advanced Features ---
function CustomersPanel(){
  const { role } = useRole();
  const [list, setList] = useState([]);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [sel, setSel] = useState(new Set());
  const [dupes, setDupes] = useState({ address:[], proximity:[] });
  const [loading, setLoading] = useState(false);

  async function load(){
    setLoading(true);
    try{ 
      const r = await fetch(`/api/customers?q=${encodeURIComponent(q)}&status=${encodeURIComponent(status)}`).then(r=>r.json()); 
      setList(r||[]); 
    }
    finally{ setLoading(false); }
  }
  useEffect(()=>{ load(); }, [q, status]);

  function toggle(id){ 
    setSel(prev=>{ 
      const n = new Set(prev); 
      if (n.has(id)) n.delete(id); 
      else n.add(id); 
      return n; 
    }); 
  }
  function clearSel(){ setSel(new Set()); }

  async function doExport(){ 
    const r = await fetch('/api/customers/export').then(r=>r.json()).catch(()=>null); 
    if (r?.path) window.open(r.path, '_blank'); 
  }
  
  async function doDelete(){ 
    if (!sel.size) return; 
    if (!confirm(`Delete ${sel.size} record(s)?`)) return; 
    await fetch('/api/customers/delete',{ 
      method:'POST', 
      headers:{'Content-Type':'application/json'}, 
      body: JSON.stringify({ ids: [...sel] }) 
    }); 
    clearSel(); 
    load(); 
  }
  
  async function doMerge(ids=[...sel]){ 
    if (ids.length<2) return alert('Select 2+'); 
    const primaryId = ids[0]; 
    await fetch('/api/customers/merge',{ 
      method:'POST', 
      headers:{'Content-Type':'application/json'}, 
      body: JSON.stringify({ ids, primaryId }) 
    }); 
    clearSel(); 
    load(); 
  }

  async function scanDupes(){ 
    const r = await fetch('/api/customers/dedupe-scan?radius=40').then(r=>r.json()).catch(()=>({address:[],proximity:[]})); 
    setDupes(r); 
  }
  
  async function bulkMerge(strategy){ 
    if (!confirm(`Auto-merge by ${strategy}?`)) return; 
    await fetch('/api/customers/bulk-merge',{ 
      method:'POST', 
      headers:{'Content-Type':'application/json'}, 
      body: JSON.stringify({ strategy, radius: 40 }) 
    }); 
    load(); 
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Input 
          style={{width:240}} 
          value={q} 
          onChange={(e)=>setQ(e.target.value)} 
          placeholder="Search name, address, insurer, claim #" 
        />
        <select className="border rounded px-2 py-1" value={status} onChange={(e)=>setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {PIPELINE.map(p=> <option key={p} value={p}>{p.replaceAll('_',' ')}</option>)}
        </select>
        <Button onClick={load}>Search</Button>
        <div className="ml-auto flex gap-2">
          <Button variant="outline" onClick={doExport}>Export CSV</Button>
          {role==='admin' && <Button variant="destructive" onClick={doDelete} disabled={!sel.size}>Delete</Button>}
        </div>
      </div>

      <div className="border rounded">
        <div className="grid grid-cols-12 p-2 text-xs font-semibold bg-gray-50">
          <div className="col-span-1">
            <input 
              type="checkbox" 
              onChange={(e)=>{ 
                if (e.target.checked) setSel(new Set(list.map((x: any)=>x.id))); 
                else clearSel(); 
              }} 
            />
          </div>
          <div className="col-span-2">Name</div>
          <div className="col-span-3">Address</div>
          <div className="col-span-2">Insurer / Claim</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>
        <div className="max-h-96 overflow-auto divide-y">
          {loading && <div className="p-3 text-sm">Loading…</div>}
          {!loading && list.map((c: any) => (
            <div key={c.id} className="grid grid-cols-12 p-2 text-sm items-center">
              <div className="col-span-1">
                <input type="checkbox" checked={sel.has(c.id)} onChange={()=>toggle(c.id)} />
              </div>
              <div className="col-span-2 truncate">{c.name||'Unknown Owner'}</div>
              <div className="col-span-3 truncate">{c.address}</div>
              <div className="col-span-2 truncate">{c.insurer||'—'} / {c.claimNumber||'—'}</div>
              <div className="col-span-2">
                <span className="text-xs px-2 py-1 rounded-full bg-gray-200">
                  {(c.status||'new').replaceAll('_',' ')}
                </span>
              </div>
              <div className="col-span-2 text-right">
                {role==='admin' && (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={()=>doMerge([c.id, ...[...sel].filter((id: any)=>id!==c.id)])} 
                    disabled={sel.size<1}
                    className="mr-2"
                  >
                    Merge
                  </Button>
                )}
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={()=>{ 
                    try{ 
                      window.dispatchEvent(new CustomEvent('storm-center',{ 
                        detail:{ address:c.address, name:c.name } 
                      })); 
                    }catch{} 
                  }}
                >
                  Map
                </Button>
              </div>
            </div>
          ))}
          {!loading && list.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              No customers found. Accepted leads will appear here.
            </div>
          )}
        </div>
      </div>

      <div className="border rounded p-3">
        <div className="flex items-center gap-2">
          <div className="font-semibold">Duplicate tools</div>
          <Button variant="outline" onClick={scanDupes}>Find duplicates</Button>
          {role==='admin' && <Button variant="outline" onClick={()=>bulkMerge('address')}>Bulk merge by address</Button>}
          {role==='admin' && <Button variant="outline" onClick={()=>bulkMerge('radius')}>Bulk merge by 40m</Button>}
        </div>
        <div className="grid md:grid-cols-2 gap-3 mt-2">
          <div>
            <div className="text-sm font-medium">Address matches</div>
            <div className="text-xs text-muted-foreground">Same normalized street address</div>
            <div className="space-y-2 mt-2 max-h-60 overflow-auto">
              {dupes.address.map((g: any,idx: number)=> (
                <div key={idx} className="border rounded p-2 text-xs">
                  <div className="font-semibold mb-1">Group #{idx+1}</div>
                  {g.items.map((it: any) => <div key={it.id}>• {it.name||'Unknown'} — {it.address} ({it.id})</div>)}
                  {role==='admin' && <Button size="sm" className="mt-2" onClick={()=>doMerge(g.items.map((x: any)=>x.id))}>Merge group</Button>}
                </div>
              ))}
              {dupes.address.length === 0 && (
                <div className="text-xs text-gray-500 p-2">No address duplicates found</div>
              )}
            </div>
          </div>
          <div>
            <div className="text-sm font-medium">Proximity matches (≤ 40m)</div>
            <div className="text-xs text-muted-foreground">Likely duplicates at the same parcel</div>
            <div className="space-y-2 mt-2 max-h-60 overflow-auto">
              {dupes.proximity.map((g: any,idx: number)=> (
                <div key={idx} className="border rounded p-2 text-xs">
                  <div className="font-semibold mb-1">Cluster #{idx+1}</div>
                  {g.items.map((it: any) => <div key={it.id}>• {it.name||'Unknown'} — {it.address} ({it.id})</div>)}
                  {role==='admin' && <Button size="sm" className="mt-2" onClick={()=>doMerge(g.items.map((x: any)=>x.id))}>Merge cluster</Button>}
                </div>
              ))}
              {dupes.proximity.length === 0 && (
                <div className="text-xs text-gray-500 p-2">No proximity duplicates found</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

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
function CustomerCard({ c, update, pushMsg, pushDoc, pushEvent }){
  const [note, setNote] = useState('');
  const [msg, setMsg] = useState('');
  const nowTick = useNowTick(60000);

  // Claim-threaded messages (from backend /api/messages?claim=...)
  const [thread, setThread] = useState([]);
  useEffect(()=>{
    if (!c.claimNumber){ setThread([]); return; }
    fetch(`/api/messages?claim=${encodeURIComponent(c.claimNumber)}`)
      .then(r=>r.json()).then(setThread).catch(()=>{});
  }, [c.claimNumber]);

  // Invoice editor
  const [invoiceItems, setInvoiceItems] = useState([{ name:'Emergency service', amount:0, quantity:1 }]);
  const [taxRate, setTaxRate] = useState(0);
  const subtotal = invoiceItems.reduce((s,it)=> s + (Number(it.amount)||0) * (Number(it.quantity)||1), 0);
  const tax = subtotal * (Number(taxRate)||0)/100;
  const total = subtotal + tax;

  // E‑Sign status (badge + auto‑attach certificate)
  const [esign, setEsign] = useState({ status:'unknown', certificate:null });
  useEffect(()=>{
    let stop = false;
    async function check(){
      const params = new URLSearchParams({});
      if (c.claimNumber) params.set('claim', c.claimNumber);
      if (c.email) params.set('email', c.email);
      if (![...params.keys()].length) return;
      const r = await fetch(`/api/esign/status?${params.toString()}`).then(r=>r.json()).catch(()=>null);
      const rec = r?.record || (r?.results && (r.results.find(x=>x.signedAt) || r.results[0])) || null;
      if (stop || !rec) return;
      const next = { status: rec.signedAt? 'signed':'pending', certificate: rec.certificate || null };
      setEsign(prev=> (prev.status!==next.status || prev.certificate!==next.certificate) ? next : prev);
      if (rec.certificate){
        const already = (c.docs||[]).some(d => d.url===rec.certificate || d.name==='E-Sign Certificate.pdf');
        if (!already){
          try { pushDoc(c.id, { name:'E-Sign Certificate.pdf', url: rec.certificate }); } catch(_){ }
          try { pushEvent(c.id, { type:'esign_cert_added', text: rec.certificate }); } catch(_){ }
        }
      }
    }
    check();
    const id = setInterval(check, 30000);
    return ()=>{ stop = true; clearInterval(id); };
  }, [c.id, c.claimNumber, c.email]);

  // Attachments selection (docs with URL)
  const [attach, setAttach] = useState({}); // url -> bool
  const toggleAttach = (u) => setAttach(prev=> ({ ...prev, [u]: !prev[u] }));
  const selectedAttachments = () => Object.entries(attach).filter(([,v])=>v).map(([u])=>u);
  const absUrl = (u) => { try{ return new URL(u, (location?.origin||'')).href; }catch{ return u; } };

  // Insurance email
  const [insEmail, setInsEmail] = useState(c.insurerEmail||'');
  useEffect(()=>{ if (c.insurerEmail && c.insurerEmail!==insEmail) setInsEmail(c.insurerEmail); }, [c.insurerEmail]);

  // Uploads & camera capture
  const [uploading, setUploading] = useState(false);
  const [showCam, setShowCam] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  let mediaStreamRef = useRef(null);

  async function openCamera(){
    try{
      const ms = await navigator.mediaDevices.getUserMedia({ video:true, audio:false });
      mediaStreamRef.current = ms;
      setShowCam(true);
      if (videoRef.current){ videoRef.current.srcObject = ms; await videoRef.current.play(); }
    }catch(e){ alert('Camera access failed'); }
  }
  function closeCamera(){
    if (mediaStreamRef.current){ mediaStreamRef.current.getTracks().forEach(t=>t.stop()); mediaStreamRef.current=null; }
    setShowCam(false);
  }
  async function capturePhoto(){
    try{
      const v = videoRef.current; const cv = canvasRef.current; if (!v || !cv) return;
      cv.width = v.videoWidth; cv.height = v.videoHeight; const ctx = cv.getContext('2d'); ctx.drawImage(v,0,0);
      cv.toBlob(async (blob)=>{
        if (!blob) return;
        const file = new File([blob], `capture_${Date.now()}.png`, { type:'image/png' });
        const fd = new FormData(); fd.append('file', file, file.name);
        setUploading(true);
        try{
          const r = await fetch('/api/upload', { method:'POST', body: fd }).then(r=>r.json());
          if (r?.ok && r.file?.path){ pushDoc(c.id,{ name:file.name, size:file.size, url:r.file.path }); }
        }finally{ setUploading(false); }
      }, 'image/png');
    }catch(e){ alert('Capture failed'); }
  }

  async function sendSMS(){
    await fetch('/api/sms',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ to:c.phone, body: msg })});
    pushMsg(c.id,{ dir:'out', type:'sms', to:c.phone, body:msg });
    setMsg('');
  }

  async function sendEmail(){
    const atts = selectedAttachments().map(u=>({ path: absUrl(u) }));
    await fetch('/api/email',{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        to:c.email,
        subject:`Storm work update for ${c.address}`,
        html: msg,
        claimNumber: c.claimNumber || undefined,
        attachments: atts
      })
    });
    pushMsg(c.id,{ dir:'out', type:'email', to:c.email, body:msg });
    setMsg('');
  }

  // Auto-attach latest photos if nothing selected
  function pickImageDocs(){
    const arr = (c.docs||[]).filter(d=>/\.(png|jpe?g|webp|gif|bmp)$/i.test(d.name||''));
    return arr;
  }

  async function sendInsuranceEmail(){
    if (!insEmail){ alert('Enter insurance/adjuster email'); return; }
    update(c.id,{ insurerEmail: insEmail });
    let urls = selectedAttachments();
    if (!urls.length){
      const imgs = pickImageDocs();
      urls = imgs.slice(Math.max(0, imgs.length-10)).map(d=>d.url).filter(Boolean); // latest up to 10
    }
    const atts = urls.map(u=>({ path: absUrl(u) }));
    await fetch('/api/email',{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        to:insEmail,
        subject:`Claim ${c.claimNumber||''} — Evidence package for ${c.address}`,
        html: msg || `Attached files regarding claim ${c.claimNumber||''} for ${c.address}.`,
        claimNumber: c.claimNumber || undefined,
        attachments: atts
      })
    });
    pushEvent(c.id,{ type:'email_insurance', to: insEmail });
  }

  // AI captions for selected photos (or auto-picked)
  async function aiCaptionSelected(){
    let photos = selectedAttachments().map(u=>({ url: absUrl(u) }));
    if (!photos.length) photos = pickImageDocs().map(d=>({ url: absUrl(d.url), name: d.name }));
    if (!photos.length){ alert('Select or upload photos first.'); return; }
    const r = await fetch('/api/describe/batch',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ photos }) }).then(r=>r.json()).catch(()=>null);
    if (!r?.results) { alert('AI captions failed.'); return; }
    // write captions back onto docs and add to timeline
    const byUrl = new Map(r.results.map(x=>[x.url, x.caption]));
    const docs = (c.docs||[]).map(d => d.url && byUrl.has(absUrl(d.url)) ? ({ ...d, caption: byUrl.get(absUrl(d.url)) }) : d);
    update(c.id, { docs });
    for (const it of r.results){ pushEvent(c.id, { type:'ai_caption', text: `${it.url} → ${it.caption}` }); }
    // Signal map to refresh filters/markers
    try{ window.dispatchEvent(new CustomEvent('storm-docs-updated', { detail:{ id:c.id } })); }catch{}
    alert('AI captions added to photos.');
  }

  async function ownerPrefill(){
    try{
      if(!c.address){ alert('Add service address first'); return; }
      const r = await fetch('/api/owner-lookup',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ address: c.address }) }).then(r=>r.json());
      if (r){
        const patch = { name: r.ownerName || c.name };
        if (r.mailingAddress) patch.mailingAddress = r.mailingAddress;
        update(c.id, patch);
        pushEvent(c.id,{ type:'owner_prefill', text: r.ownerName || 'unknown' });
        alert('Owner details prefilled');
      }
    }catch(e){ alert('Owner lookup failed'); }
  }

  async function sendForESign(){
    try{
      if (!c.email){ alert('Need customer email'); return; }
      const payload = { email: c.email, name: c.name || 'Customer', address: c.address, claimNumber: c.claimNumber };
      let link = null;
      try{
        const r = await fetch('/api/esign/initiate',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) }).then(r=>r.json());
        if (r?.link) link = r.link;
      }catch(_){}
      if (link){
        await fetch('/api/email',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ to:c.email, subject:`Please e-sign: Emergency Tree Removal`, html:`Please review and e-sign: <a href="${link}">${link}</a>`, claimNumber:c.claimNumber||undefined })});
        pushEvent(c.id,{ type:'esign_sent', text: link });
        alert('E-sign invite sent');
      } else {
        await fetch('/api/email',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ to:c.email, subject:`Review & approve emergency contract`, html:`Please review the attached contract and reply \"I agree\" to authorize emergency work.<br/><a href=\"/files/contract.pdf\">Open Contract</a>`, claimNumber:c.claimNumber||undefined, attachments:[{ path: absUrl('/files/contract.pdf') }] })});
        pushEvent(c.id,{ type:'contract_sent', text:'/files/contract.pdf' });
        alert('Fallback email sent with contract attached');
      }
    }catch(e){ alert('E-sign send failed'); }
  }

  async function requestPayment(){
    const items = invoiceItems.map(it=>({ name: it.name||'Service', amount: Number(it.amount||0), quantity: Number(it.quantity||1) }));
    if (tax > 0) items.push({ name:'Tax', amount: Number(tax.toFixed(2)), quantity: 1 });
    const r = await fetch('/api/invoice/checkout', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ customer: { email: c.email }, lineItems: items, metadata: { claim: c.claimNumber||'', customerId: c.id } })
    }).then(r=>r.json()).catch(()=>null);
    if (r?.url){
      if (c.phone) await fetch('/api/sms',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ to:c.phone, body:`Pay securely for ${c.address}: ${r.url}` })});
      if (c.email) await fetch('/api/email',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ to:c.email, subject:`Payment link for ${c.address}`, html:`<a href=\"${r.url}\">Pay securely</a>`, claimNumber:c.claimNumber||undefined })});
      alert('Payment link sent.');
    } else {
      alert('Payment link failed.');
    }
  }

  async function submitClaimPackage(){
    if (!insEmail){ alert('Enter insurance/adjuster email'); return; }
    let urls = selectedAttachments();
    if (!urls.length){
      const imgs = pickImageDocs();
      urls = imgs.map(d=>d.url).filter(Boolean);
    }
    const payload = {
      to: insEmail,
      claimNumber: c.claimNumber||'',
      address: c.address||'',
      customerName: c.name||'',
      contractor: { name:'Strategic Land Management LLC', phone:'888-628-2229', website:'https://www.strategiclandmgmt.com' },
      attachments: [ ...urls.map(absUrl), esign.certificate?absUrl(esign.certificate):null, absUrl('/files/contract.pdf') ].filter(Boolean),
      invoice: { items: invoiceItems, taxRate, subtotal, total }
    };
    const r = await fetch('/api/claim/package',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) }).then(r=>r.json()).catch(()=>null);
    if (r?.ok){ pushEvent(c.id,{ type:'claim_package_sent', to: insEmail, text: r.summaryPath }); window.open(r.summaryPath, '_blank'); alert('Claim package sent.'); }
    else alert('Claim package failed.');
  }

  function changeStatus(s){
    update(c.id,{ status:s });
    pushEvent(c.id,{ type:'status', to:s });
    // Register SLA watches for certain statuses
    const map = { claim_submitted:'claim_submitted', work_completed:'work_completed', lien_filed:'lien_filed' };
    if (map[s]){
      fetch('/api/sla/register',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ customerId:c.id, type: map[s], ts: Date.now(), address:c.address, name:c.name }) });
    }
  }

  const badges = slaBadges(c); // recompute every minute via nowTick
  void nowTick;

  return (
    <Card><CardContent className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-lg font-semibold">{c.name||'Unknown Owner'}</div>
          <div className="text-sm text-muted-foreground">{c.address}</div>
          {c.mailingAddress && <div className="text-xs">Mailing: {c.mailingAddress}</div>}
          <div className="text-xs">{c.insurer || 'Insurer N/A'} • Claim #{c.claimNumber||'—'}</div>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {badges.map(b=> (<span key={b.key} className={`text-xs px-2 py-1 rounded-full ${b.tone}`}>{b.txt}</span>))}
          <span className={`text-xs px-2 py-1 rounded-full ${esign.status==='signed'?'bg-green-600 text-white':esign.status==='pending'?'bg-amber-500 text-black':'bg-gray-300 text-gray-800'}`}>E‑Sign: {esign.status==='signed'?'Signed':esign.status==='pending'?'Pending':'Unknown'}</span>
          <Button variant="outline" onClick={ownerPrefill}>Owner Prefill</Button>
          <Button variant="outline" onClick={()=>{ try{ window.dispatchEvent(new CustomEvent('storm-center',{ detail:{ address:c.address, name:c.name } })); }catch{} }}>Open on Map</Button>
          <select className="border rounded-md px-2 py-1" value={c.status} onChange={(e)=>changeStatus(e.target.value)}>
            {PIPELINE.map(p => <option key={p} value={p}>{p.replaceAll('_',' ')}</option>)}
          </select>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-3">
        {/* Communications */}
        <div className="space-y-2">
          <div className="font-medium">Communications</div>
          <Input value={msg} onChange={(e)=>setMsg(e.target.value)} placeholder="Write SMS/Email..." />
          <div className="flex gap-2">
            {c.phone && <Button onClick={sendSMS}>Send SMS</Button>}
            {c.email && <Button variant="secondary" onClick={sendEmail}>Send Email</Button>}
            {c.phone && <a href={`tel:${c.phone.replace(/[^0-9+]/g,'')}`}><Button variant="outline">Call</Button></a>}
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span>Insurance Email</span>
            <Input style={{width:220}} value={insEmail} onChange={(e)=>setInsEmail(e.target.value)} placeholder="adjuster@insurer.com" />
            <Button variant="outline" onClick={sendInsuranceEmail}>Email Insurance</Button>
          </div>
          <div className="space-y-1 max-h-40 overflow-auto">
            {c.messages?.map((m,i)=>(<div key={i} className="text-xs">[{new Date(m.ts).toLocaleString()}] {m.type?.toUpperCase()} → {m.to}: {m.body}</div>))}
          </div>
          <div className="mt-2 text-xs">
            <div className="font-medium">Insurance Thread</div>
            <div className="max-h-40 overflow-auto space-y-1">
              {thread.map((m,i)=>(
                <div key={i}>[{new Date(m.ts).toLocaleString()}] {m.dir==='in'?'FROM':'TO'} {m.dir==='in'?m.from:m.to}: <span dangerouslySetInnerHTML={{__html: m.subject||''}} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Docs & Media */}
        <div className="space-y-2">
          <div className="font-medium">Docs & Media</div>
          <input type="file" multiple onChange={async (e)=>{
            const files = Array.from(e.target.files||[]);
            if (!files.length) return;
            setUploading(true);
            for (const f of files){
              try{
                const fd = new FormData(); fd.append('file', f, f.name);
                const r = await fetch('/api/upload', { method:'POST', body: fd }).then(r=>r.json());
                if (r?.ok && r.file?.path){ pushDoc(c.id,{ name:f.name, size:f.size, url:r.file.path }); }
                else { pushDoc(c.id,{ name:f.name, size:f.size }); }
              }catch(_){ pushDoc(c.id,{ name:f.name, size:f.size }); }
            }
            setUploading(false);
          }} />
          <div className="text-xs text-muted-foreground">Contracts, proof of insurance, photos/videos. {uploading && <b>Uploading…</b>}</div>
          <div className="text-xs">Select files to attach in emails:</div>
          <div className="space-y-1 max-h-40 overflow-auto">
            {c.docs?.map((d,i)=>(
              <div key={i} className="text-xs flex items-center gap-2">
                {d.url && <input type="checkbox" checked={!!attach[d.url]} onChange={()=>toggleAttach(d.url)} />}
                📄 {d.url ? <a href={d.url} target="_blank" rel="noreferrer">{d.name||'file'}</a> : <span>{d.name} {d.size?`(${Math.round((d.size||0)/1024)} KB)`:''}</span>}
                {d.caption && <span className="ml-2 italic opacity-75">— {d.caption}</span>}
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={aiCaptionSelected}>AI Caption Selected</Button>
            {!showCam && <Button variant="outline" onClick={openCamera}>Open Camera</Button>}
          </div>
          {showCam && (
            <div className="space-y-2">
              <video ref={videoRef} autoPlay playsInline style={{width:'100%', maxHeight:240, background:'#000'}} />
              <canvas ref={canvasRef} style={{display:'none'}} />
              <div className="flex gap-2">
                <Button onClick={capturePhoto}>Capture Photo</Button>
                <Button variant="outline" onClick={closeCamera}>Close</Button>
              </div>
            </div>
          )}
        </div>

        {/* Notes / Timeline */}
        <div className="space-y-2">
          <div className="font-medium">Notes / Timeline</div>
          <Input value={note} onChange={(e)=>setNote(e.target.value)} placeholder="Add an internal note" />
          <Button variant="outline" onClick={()=>{ pushEvent(c.id,{ type:'note', text:note }); setNote(''); }}>Add Note</Button>
          <div className="space-y-1 max-h-40 overflow-auto">
            {c.timeline?.map((t,i)=>(<div key={i} className="text-xs">[{new Date(t.ts).toLocaleString()}] {t.type} {t.text||t.to||''}</div>))}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={()=>changeStatus('contract_signed')}>Mark Contracted</Button>
        <Button variant="outline" onClick={()=>changeStatus('claim_submitted')}>Mark Claim Submitted</Button>
        <Button variant="outline" onClick={()=>changeStatus('work_completed')}>Mark Work Completed</Button>
        <Button variant="outline" onClick={()=>changeStatus('lien_filed')}>Mark Lien Filed</Button>
        <Button variant="outline" onClick={()=>changeStatus('paid')}>Mark Paid</Button>
        <Button onClick={sendForESign}>Send for E‑Sign</Button>
        <Button variant="secondary" onClick={async ()=>{
          const params = new URLSearchParams({});
          if (c.claimNumber) params.set('claim', c.claimNumber);
          if (c.email) params.set('email', c.email);
          const r = await fetch(`/api/esign/status?${params.toString()}`).then(r=>r.json()).catch(()=>null);
          const rec = r?.record || (r?.results && (r.results.find(x=>x.signedAt) || r.results[0])) || null;
          if (rec){ setEsign({ status: rec.signedAt?'signed':'pending', certificate: rec.certificate||null }); if (rec.certificate) pushDoc(c.id,{ name:'E-Sign Certificate.pdf', url: rec.certificate }); }
        }}>Refresh E‑Sign Status</Button>
        <Button onClick={requestPayment}>Request Payment</Button>
        <Button onClick={submitClaimPackage}>Submit Claim Package</Button>
      </div>

      {/* Photo Report */}
      <PhotoReportBlock c={c} absUrl={absUrl} pickImageDocs={pickImageDocs} />
    </CardContent></Card>
  );
}

function PhotoReportBlock({ c, absUrl, pickImageDocs }){
  const [reportNotes, setReportNotes] = useState('');
  const [insEmail, setInsEmail] = useState(c.insurerEmail||'');
  useEffect(()=>{ if (c.insurerEmail && c.insurerEmail!==insEmail) setInsEmail(c.insurerEmail); }, [c.insurerEmail]);
  
  async function makePhotoReport(){
    const imgs = pickImageDocs();
    if (!imgs.length){ alert('Select or upload some photos first.'); return; }
    const payload = {
      claimNumber: c.claimNumber||'', address: c.address||'', customerName: c.name||'',
      contractor: { name:'Strategic Land Management LLC', phone:'888-628-2229', website:'https://www.strategiclandmgmt.com' },
      photos: imgs.map(d=>({ url: absUrl(d.url||''), note: reportNotes||'' })), title: 'Storm Damage Photo Report'
    };
    const r = await fetch('/api/report/photo',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) }).then(r=>r.json()).catch(()=>null);
    if (r?.path){
      window.open(r.path, '_blank');
      if (insEmail){
        await fetch('/api/email',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ to:insEmail, subject:`Claim ${c.claimNumber||''} — Photo Report`, html:`Please see attached report for ${c.address}.`, claimNumber:c.claimNumber||undefined, attachments:[{ path: absUrl(r.path) }] }) });
      }
    } else { alert('Photo report failed.'); }
  }
  
  return (
    <div className="mt-3 border rounded-md p-3 space-y-2">
      <div className="font-medium">Photo Report</div>
      <Input value={reportNotes} onChange={(e)=>setReportNotes(e.target.value)} placeholder="Optional caption for selected photos (e.g., Tree on roof — tarp installed)." />
      <div className="text-xs text-muted-foreground">We'll bundle selected photos into a PDF with your note and claim info. If Insurance Email is set, we'll auto-email it.</div>
      <Button onClick={makePhotoReport}>Generate Photo Report PDF</Button>
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
      <Card><CardContent className="p-4 space-y-2">
        <div className="text-2xl font-bold">Strategic Land Management LLC</div>
        <div>Emergency Storm Response Team</div>
        <div className="text-sm">📞 888-628-2229 • 🌐 <a className="underline" href="https://www.strategiclandmgmt.com" target="_blank" rel="noreferrer">www.strategiclandmgmt.com</a> • ✉️ strategiclandmgmt@gmail.com</div>
        <div className="text-xs text-muted-foreground">Veteran-owned & disabled veteran-owned. Certified arborist: John Culpepper.</div>
        <div className="grid md:grid-cols-2 gap-3 mt-2">
          <Button variant="secondary" onClick={()=>openNew('https://disasterloanassistance.sba.gov/')}>SBA Disaster Loans</Button>
          <Button variant="secondary" onClick={()=>openNew('https://www.fema.gov/assistance/individual')}>FEMA Individual Assistance</Button>
        </div>
      </CardContent></Card>

      <Card><CardContent className="p-4 space-y-2">
        <div className="font-semibold">Emergency Tree Removal Contract</div>
        <div className="text-sm text-muted-foreground">Your uploaded contract is available to attach and send from the app.</div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={()=>openNew('/files/contract.pdf')}>Open Contract</Button>
          <Button onClick={()=>fetch('/api/email',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ to:'strategiclandmgmt@gmail.com', subject:'Contract (for signature)', html:'Attached contract', attachments:[{ path:'/files/contract.pdf' }] })})}>Email Contract to Customer</Button>
        </div>
      </CardContent></Card>

      <Card><CardContent className="p-4 space-y-2">
        <div className="font-semibold">Upload Proof of Insurance (optional)</div>
        <input type="file" onChange={(e)=>{/* Hook /api/upload */}} />
        <div className="text-xs text-muted-foreground">Stored under your Contractor profile; share on request.</div>
      </CardContent></Card>

      <Card><CardContent className="p-4 space-y-2">
        <div className="font-semibold">Brochure</div>
        <div className="text-sm">Generate a tri-fold PDF brochure using your content.</div>
        <Button onClick={async ()=>{
          const r = await fetch('/api/brochure/strategic',{ method:'POST' }).then(r=>r.json()).catch(()=>null);
          if (r?.path) window.open(r.path, '_blank'); else alert('Brochure failed.');
        }}>Generate Tri-Fold Brochure (PDF)</Button>
      </CardContent></Card>
    </div>
  );
}

// --- Enhanced Storm Map with Live Drone Events & Role-Based Access ---
function StormMap({ customers = [] }) {
  const { role } = useRole();
  const [markers, setMarkers] = useState([]); // from customers
  const [live, setLive] = useState([]); // from SSE drone events
  const [leads, setLeads] = useState([]); // auto-generated leads
  const [center, setCenter] = useState([27.6648, -81.5158]); // FL center fallback
  const [zoom, setZoom] = useState(6);
  const [filters, setFilters] = useState({
    tree_on_roof: true, line_down: true, structure_damage: true, tree_on_fence: true,
    tree_on_car: true, tree_on_barn: true, tree_on_shed: true, tree_in_pool: true, tree_on_playground: true,
    live: true, lead: true
  });

  // Listen for map center events from cards
  useEffect(() => {
    function onCenter(e: any) {
      const { address, name } = e.detail || {};
      if (!address) return;
      fetch(`/api/geocode?address=${encodeURIComponent(address)}`).then(r => r.json()).then(geo => {
        if (geo?.lat && geo?.lng) {
          setCenter([geo.lat, geo.lng]);
          setZoom(15);
          setMarkers(m => [...m, { id: `jit-${Date.now()}`, name, address, lat: geo.lat, lng: geo.lng, tags: ['jit'] }]);
        }
      }).catch(() => { });
    }
    window.addEventListener('storm-center', onCenter);
    window.addEventListener('storm-docs-updated', () => refresh());
    return () => {
      window.removeEventListener('storm-center', onCenter);
      window.removeEventListener('storm-docs-updated', () => { });
    };
  }, []);

  // Geocode customers to markers (server-side endpoint already exists)
  useEffect(() => {
    refresh();
  }, [JSON.stringify(customers)]);

  // Load initial leads
  useEffect(() => {
    fetch('/api/leads').then(r => r.json()).then(setLeads).catch(() => {});
  }, []);

  // SSE live feed for drone events and leads
  useEffect(() => {
    const es = new EventSource('/api/drone/events');
    es.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        if (data?.type === 'drone_event' && data.event) {
          setLive(prev => [...prev.slice(-499), data.event]);
        }
        if (data?.type === 'lead' && data.lead) {
          setLeads(prev => [data.lead, ...prev].slice(0, 500));
        }
      } catch (e) {
        console.error('Failed to parse SSE data:', e);
      }
    };
    return () => es.close();
  }, []);

  function tagsFromDocs(docs: any[]) {
    const t = new Set<string>();
    (docs || []).forEach(d => {
      const s = (d.caption || '').toLowerCase();
      if (s.includes('tree_on_roof')) t.add('tree_on_roof');
      if (s.includes('line_down')) t.add('line_down');
      if (s.includes('structure_damage')) t.add('structure_damage');
      if (s.includes('tree_on_fence')) t.add('tree_on_fence');
      if (s.includes('tree_on_car')) t.add('tree_on_car');
      if (s.includes('tree_on_barn')) t.add('tree_on_barn');
      if (s.includes('tree_on_shed')) t.add('tree_on_shed');
      if (s.includes('tree_in_pool')) t.add('tree_in_pool');
      if (s.includes('tree_on_playground')) t.add('tree_on_playground');
    });
    return [...t];
  }

  async function geocode(address: string) {
    const r = await fetch(`/api/geocode?address=${encodeURIComponent(address)}`).then(r => r.json()).catch(() => null);
    return (r?.lat && r?.lng) ? r : null;
  }

  async function refresh() {
    const mk = [];
    for (const c of (customers || [])) {
      if (!c.address) continue;
      const geo = await geocode(c.address);
      if (!geo) continue;
      mk.push({ id: c.id, name: c.name, address: c.address, lat: geo.lat, lng: geo.lng, tags: tagsFromDocs(c.docs) });
    }
    setMarkers(mk);
  }

  const active = (tags: string[] = []) => tags.some(t => filters[t as keyof typeof filters]) || (tags.length === 0 && (filters.live || filters.lead));

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="p-2 flex flex-wrap gap-2 items-center">
        {Object.keys(filters).filter(k => !['live', 'lead'].includes(k)).map(k => (
          <label key={k} className={`text-xs px-2 py-1 rounded-full border cursor-pointer ${filters[k as keyof typeof filters] ? 'bg-emerald-600 text-white border-emerald-700' : 'bg-white'}`}>
            <input type="checkbox" checked={!!filters[k as keyof typeof filters]} onChange={() => setFilters(f => ({ ...f, [k]: !f[k as keyof typeof f] }))} className="mr-1" />
            {k.replaceAll('_', ' ')}
          </label>
        ))}
        <label className={`text-xs px-2 py-1 rounded-full border cursor-pointer ${filters.live ? 'bg-purple-600 text-white border-purple-700' : 'bg-white'}`}>
          <input type="checkbox" checked={!!filters.live} onChange={() => setFilters(f => ({ ...f, live: !f.live }))} className="mr-1" />
          live
        </label>
        <label className={`text-xs px-2 py-1 rounded-full border cursor-pointer ${filters.lead ? 'bg-orange-600 text-white border-orange-700' : 'bg-white'}`}>
          <input type="checkbox" checked={!!filters.lead} onChange={() => setFilters(f => ({ ...f, lead: !f.lead }))} className="mr-1" />
          lead
        </label>
        <div className="ml-auto"><span className="text-xs opacity-70">Role: {role}</span></div>
      </div>
      <div style={{ height: 420 }}>
        <LeafletLive center={center} zoom={zoom}
          markers={[
            ...markers.filter(m => active(m.tags)).map(m => ({ ...m, kind: 'case' })),
            ...live.filter(e => active(e.tags)).map(e => ({ id: e.id, lat: e.lat, lng: e.lng, name: e.provider || 'drone', address: e.address, tags: e.tags, kind: 'live', stream: e.stream, image: e.image })),
            ...leads.filter(l => active(l.tags)).map(l => ({ id: l.id, lat: l.lat, lng: l.lng, name: 'lead', address: l.address, tags: l.tags, kind: 'lead', stream: l.stream, image: l.image }))
          ]} />
      </div>
    </div>
  );
}

function LeafletLive({ center, zoom, markers }: { center: number[]; zoom: number; markers: any[] }) {
  const L = (window as any).L;
  const [ready, setReady] = useState(!!(window as any).L);

  useEffect(() => {
    if (!(window as any).L) {
      const s = document.createElement('script');
      s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      s.onload = () => setReady(true);
      document.body.appendChild(s);
    }
  }, []);

  useEffect(() => {
    if (!ready) return;
    let map = (LeafletLive as any).__map;
    if (!map) {
      map = (LeafletLive as any).__map = L.map('storm-map-root').setView(center, zoom);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap' }).addTo(map);
    } else { map.setView(center, zoom); }

    // clear & add
    if ((LeafletLive as any).__layer) { (LeafletLive as any).__layer.remove(); }
    const layer = L.layerGroup();
    markers.forEach(m => {
      let mk;
      if (m.kind === 'live') {
        mk = L.circleMarker([m.lat, m.lng], { radius: 8, color: '#7c3aed', fillColor: '#7c3aed', fillOpacity: 0.8 });
      } else if (m.kind === 'lead') {
        mk = L.circleMarker([m.lat, m.lng], { radius: 8, color: '#f97316', fillColor: '#f97316', fillOpacity: 0.9 });
      } else {
        mk = L.circleMarker([m.lat, m.lng], { radius: 6, color: '#10b981', fillColor: '#10b981', fillOpacity: 0.8 });
      }
      const media = m.image ? `<br/><img src="${m.image}" style="max-width:220px;max-height:120px;display:block;margin-top:4px;"/>` : '';
      const stream = m.stream ? `<br/><a href="${m.stream}" target="_blank">Open stream</a>` : '';
      mk.bindPopup(`<b>${m.name || ''}</b><br/>${m.address || ''}<br/>Tags: ${(m.tags || []).join(', ')}${media}${stream}`);
      mk.addTo(layer);
    });
    layer.addTo(map);
    (LeafletLive as any).__layer = layer;
  }, [ready, JSON.stringify(center), zoom, JSON.stringify(markers)]);

  return <div id="storm-map-root" style={{ width: '100%', height: '100%' }} />;
}

// Main export with RoleProvider wrapper
export default function StormOpsProHub() {
  return (
    <RoleProvider>
      <StormOpsProHubContent />
    </RoleProvider>
  );
}