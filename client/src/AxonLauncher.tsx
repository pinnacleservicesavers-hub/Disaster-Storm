// @ts-nocheck
import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

/**
 * Axon Deep-link + Storm Map Launcher (React)
 * ------------------------------------------
 * Unified, production-ready build with:
 *  - Storm Map (OSM + RainViewer radar + NOAA alerts) + auto-center on new items
 *  - Inbox with damage-tag filters (tree_on_roof, line_down, etc.), badges, search, sorting
 *  - Multi-View (2x2) with Pin buttons from each provider tab (VOTIX/FlytBase/DroneDeploy/DJI FH2)
 *  - Provider tabs (HLS + iframe), plus quick open links
 *  - DSP Directory (hire pilots)
 *  - Owner Lookup (calls /api/owner-lookup), one-click Call/Text/Email
 *  - Role Selector (Ops / Field / Admin) — ready to wire to access rules
 */

function openNew(url: string) { if (url) window.open(url, "_blank", "noopener,noreferrer"); }

// ===== Role selector =====
function RoleSelector(){
  const [role, setRole] = useState(localStorage.getItem('role')||'ops');
  useEffect(()=>{ localStorage.setItem('role', role); }, [role]);
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Role:</span>
      <select className="border rounded-md px-2 py-1" value={role} onChange={(e)=>setRole(e.target.value)}>
        <option value="ops">Ops</option>
        <option value="field">Field</option>
        <option value="admin">Admin</option>
      </select>
    </div>
  );
}

// ===== Map layers =====
function RadarLayer({ enabled }: { enabled: boolean }) {
  const map = useMap();
  const layerRef = useRef<any>(null);
  useEffect(() => {
    if (!enabled) { if (layerRef.current) { map.removeLayer(layerRef.current); layerRef.current = null; } return; }
    const L = (window as any).L; if (!L) return;
    const radar = L.tileLayer("https://tilecache.rainviewer.com/v2/radar/now/256/{z}/{x}/{y}/2/1_1.png", { opacity: 0.75, attribution: "<a href='https://www.rainviewer.com/'>RainViewer</a>" });
    radar.addTo(map); layerRef.current = radar;
    return () => { if (layerRef.current) { map.removeLayer(layerRef.current); layerRef.current = null; } };
  }, [enabled, map]);
  return null;
}
function NOAAAlertsLayer({ enabled }: { enabled: boolean }) {
  const map = useMap();
  const layerRef = useRef<any>(null);
  useEffect(() => {
    if (!enabled) { if (layerRef.current) { map.removeLayer(layerRef.current); layerRef.current = null; } return; }
    const L = (window as any).L; if (!L) return;
    const noaa = L.tileLayer.wms("https://idpgis.ncep.noaa.gov/arcgis/services/NWS_Watches_Warnings/MapServer/WMSServer", { layers: "1", format: "image/png", transparent: true, attribution: "NOAA/NWS" });
    noaa.addTo(map); layerRef.current = noaa;
    return () => { if (layerRef.current) { map.removeLayer(layerRef.current); layerRef.current = null; } };
  }, [enabled, map]);
  return null;
}

function QuickMap({ radarOn, alertsOn }: { radarOn: boolean; alertsOn: boolean }) {
  const [lat, setLat] = useState(() => Number(localStorage.getItem("mapLat")) || 32.51);
  const [lng, setLng] = useState(() => Number(localStorage.getItem("mapLng")) || -84.87);
  const [z, setZ] = useState(() => Number(localStorage.getItem("mapZoom")) || 7);
  const position = useMemo(() => [lat, lng] as [number, number], [lat, lng]);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const save = () => { localStorage.setItem("mapLat", String(lat)); localStorage.setItem("mapLng", String(lng)); localStorage.setItem("mapZoom", String(z)); };

  // Listen for geofence/route events from Inbox (auto-center + drop marker)
  useEffect(() => {
    function onFocus(e: any){
      const d = e.detail || {}; if (!mapRef.current || !d.lat || !d.lon) return;
      mapRef.current.setView([d.lat, d.lon], d.zoom || 18);
      const L = (window as any).L; if (!L) return;
      if (markerRef.current) { mapRef.current.removeLayer(markerRef.current); markerRef.current = null; }
      markerRef.current = L.marker([d.lat, d.lon]).addTo(mapRef.current);
    }
    window.addEventListener('focusLocation', onFocus);
    return () => window.removeEventListener('focusLocation', onFocus);
  }, []);

  return (
    <div className="w-full bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="p-4 space-y-3">
        <div className="grid grid-cols-3 gap-2">
          <input type="number" step="0.0001" value={lat} onChange={(e: any)=>setLat(Number(e.target.value))} placeholder="Latitude" className="border border-gray-300 rounded-md px-3 py-2" />
          <input type="number" step="0.0001" value={lng} onChange={(e: any)=>setLng(Number(e.target.value))} placeholder="Longitude" className="border border-gray-300 rounded-md px-3 py-2" />
          <input type="number" step="1" min={2} max={12} value={z} onChange={(e: any)=>setZ(Number(e.target.value))} placeholder="Zoom" className="border border-gray-300 rounded-md px-3 py-2" />
        </div>
        <div className="flex justify-end"><button onClick={save} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium transition-colors">Save View</button></div>
        <div className="h-[420px] rounded-2xl overflow-hidden">
          <MapContainer ref={mapRef} center={position} zoom={z} className="h-full w-full">
            <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <RadarLayer enabled={radarOn} />
            <NOAAAlertsLayer enabled={alertsOn} />
          </MapContainer>
        </div>
      </div>
    </div>
  );
}

// ===== Damage tags & filters =====
const TAGS = [
  'tree_on_roof','tree_on_building','tree_on_fence','tree_on_barn','tree_on_shed','tree_on_car','tree_in_pool','tree_on_playground','line_down','structure_damage'
];
const KEYWORD_MAP: [string, RegExp][] = [
  ['tree_on_roof', /tree on roof|through roof|roof damage/i],
  ['tree_on_building', /tree on (house|building|home|structure)/i],
  ['tree_on_fence', /tree on fence|fence down/i],
  ['tree_on_barn', /tree on barn/i],
  ['tree_on_shed', /tree on shed/i],
  ['tree_on_car', /tree on (car|vehicle|truck)/i],
  ['tree_in_pool', /tree in pool|pool damage/i],
  ['tree_on_playground', /tree on playground|playset|swing ?set/i],
  ['line_down', /(line down|power line|utility line|pole down)/i],
  ['structure_damage', /(collapse|compromised|structural|wall down|house split|building damage)/i]
];
function addTags(item: any){
  const text = ((item.notes||'') + ' ' + (item.address||'')).toLowerCase();
  const tags: string[] = [];
  for (const [tag, rx] of KEYWORD_MAP){ if ((rx as RegExp).test(text)) tags.push(tag); }
  return { ...item, tags };
}
function TagFilterBar({ tagFilters, setTagFilters }: { tagFilters: any; setTagFilters: any }){
  return (
    <div className="flex flex-wrap gap-2">
      {TAGS.map(t => (
        <label key={t} className="text-xs flex items-center gap-1 border rounded-full px-2 py-1">
          <input type="checkbox" checked={!!tagFilters[t]} onChange={(e)=>setTagFilters({ ...tagFilters, [t]: e.target.checked })} /> {t}
        </label>
      ))}
    </div>
  );
}

// ===== HLS player =====
function HlsPlayer({ src }: { src: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(function () {
    const video = videoRef.current; if (!video || !src) return;
    if (video.canPlayType('application/vnd.apple.mpegurl')) { video.src = src; video.play().catch(()=>{}); return; }
    let hls: any;
    (async function(){
      try {
        const mod = await import('hls.js'); const Hls = mod.default;
        if (Hls && Hls.isSupported()) {
          hls = new Hls(); hls.loadSource(src); hls.attachMedia(video);
          hls.on(Hls.Events.MANIFEST_PARSED, ()=> video.play().catch(()=>{}));
        } else { window.open(src, '_blank'); }
      } catch(e) { console.warn('HLS init failed', e); }
    })();
    return function(){ if (hls) hls.destroy(); };
  }, [src]);
  return (<video ref={videoRef} controls className="w-full h-full object-contain rounded-xl" />);
}
function FlexiblePlayer({ url }: { url: string }) {
  if (!url) return <div className="text-sm text-muted-foreground">No feed set</div>;
  const lower = url.toLowerCase();
  if (lower.includes('.m3u8')) return <HlsPlayer src={url} />;
  return <iframe title="Feed" src={url} className="w-full h-full rounded-xl" allow="autoplay; fullscreen" />;
}

// ===== Pin helpers + Multi-View =====
function pinTo(slot: string, url: string){ if (!url) return; localStorage.setItem(slot, url); window.dispatchEvent(new Event('mvUpdate')); }
function PinButtons({ currentUrl }: { currentUrl: string }){
  return (
    <div className="flex flex-wrap gap-2">
      <button onClick={()=>pinTo('mv1', currentUrl)} className="border border-gray-300 text-gray-700 px-3 py-1.5 rounded-md hover:bg-gray-50 font-medium transition-colors text-sm">Pin → Pane 1</button>
      <button onClick={()=>pinTo('mv2', currentUrl)} className="border border-gray-300 text-gray-700 px-3 py-1.5 rounded-md hover:bg-gray-50 font-medium transition-colors text-sm">Pin → Pane 2</button>
      <button onClick={()=>pinTo('mv3', currentUrl)} className="border border-gray-300 text-gray-700 px-3 py-1.5 rounded-md hover:bg-gray-50 font-medium transition-colors text-sm">Pin → Pane 3</button>
      <button onClick={()=>pinTo('mv4', currentUrl)} className="border border-gray-300 text-gray-700 px-3 py-1.5 rounded-md hover:bg-gray-50 font-medium transition-colors text-sm">Pin → Pane 4</button>
    </div>
  );
}
function MultiView() {
  const [mv1, setMv1] = useState(localStorage.getItem('mv1') || '');
  const [mv2, setMv2] = useState(localStorage.getItem('mv2') || '');
  const [mv3, setMv3] = useState(localStorage.getItem('mv3') || '');
  const [mv4, setMv4] = useState(localStorage.getItem('mv4') || '');
  useEffect(()=>{ localStorage.setItem('mv1', mv1); }, [mv1]);
  useEffect(()=>{ localStorage.setItem('mv2', mv2); }, [mv2]);
  useEffect(()=>{ localStorage.setItem('mv3', mv3); }, [mv3]);
  useEffect(()=>{ localStorage.setItem('mv4', mv4); }, [mv4]);
  useEffect(()=>{
    function onStorage(e: StorageEvent){ if(['mv1','mv2','mv3','mv4'].includes(e.key||'')){
      setMv1(localStorage.getItem('mv1')||''); setMv2(localStorage.getItem('mv2')||''); setMv3(localStorage.getItem('mv3')||''); setMv4(localStorage.getItem('mv4')||'');
    }}
    function onCustom(){ setMv1(localStorage.getItem('mv1')||''); setMv2(localStorage.getItem('mv2')||''); setMv3(localStorage.getItem('mv3')||''); setMv4(localStorage.getItem('mv4')||''); }
    window.addEventListener('storage', onStorage); window.addEventListener('mvUpdate', onCustom);
    return ()=>{ window.removeEventListener('storage', onStorage); window.removeEventListener('mvUpdate', onCustom); };
  }, []);
  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-4 gap-2">
        <input value={mv1} onChange={(e: any)=>setMv1(e.target.value)} placeholder="Pane 1 URL (.m3u8 or https://player)" className="border border-gray-300 rounded-md px-3 py-2" />
        <input value={mv2} onChange={(e: any)=>setMv2(e.target.value)} placeholder="Pane 2 URL" className="border border-gray-300 rounded-md px-3 py-2" />
        <input value={mv3} onChange={(e: any)=>setMv3(e.target.value)} placeholder="Pane 3 URL" className="border border-gray-300 rounded-md px-3 py-2" />
        <input value={mv4} onChange={(e: any)=>setMv4(e.target.value)} placeholder="Pane 4 URL" className="border border-gray-300 rounded-md px-3 py-2" />
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        <div className="h-[320px] bg-white border border-gray-200 rounded-lg shadow-sm"><div className="p-2 h-full"><FlexiblePlayer url={mv1} /></div></div>
        <div className="h-[320px] bg-white border border-gray-200 rounded-lg shadow-sm"><div className="p-2 h-full"><FlexiblePlayer url={mv2} /></div></div>
        <div className="h-[320px] bg-white border border-gray-200 rounded-lg shadow-sm"><div className="p-2 h-full"><FlexiblePlayer url={mv3} /></div></div>
        <div className="h-[320px] bg-white border border-gray-200 rounded-lg shadow-sm"><div className="p-2 h-full"><FlexiblePlayer url={mv4} /></div></div>
      </div>
    </div>
  );
}

// ===== Provider tabs =====
function ProviderTab({ name, hlsKey, iframeKey, portal }: { name: string; hlsKey: string; iframeKey: string; portal: string }){
  const [hls, setHls] = useState(localStorage.getItem(hlsKey)||'');
  const [ifr, setIfr] = useState(localStorage.getItem(iframeKey)||'');
  useEffect(()=>{ localStorage.setItem(hlsKey, hls); }, [hlsKey, hls]);
  useEffect(()=>{ localStorage.setItem(iframeKey, ifr); }, [iframeKey, ifr]);
  const chosen = hls || ifr || '';
  return (
    <div className="space-y-3">
      <div className="grid md:grid-cols-3 gap-3">
        <div className="space-y-1"><label className="text-sm text-gray-600">{name} HLS (.m3u8)</label><input value={hls} onChange={(e: any)=>setHls(e.target.value)} placeholder="https://.../index.m3u8" className="border border-gray-300 rounded-md px-3 py-2" /></div>
        <div className="space-y-1"><label className="text-sm text-gray-600">{name} Share/Embed URL</label><input value={ifr} onChange={(e: any)=>setIfr(e.target.value)} placeholder="https://..." className="border border-gray-300 rounded-md px-3 py-2" /></div>
        <div className="flex items-end gap-2"><button onClick={()=>openNew(portal)} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium transition-colors">Open {name}</button>{chosen && <PinButtons currentUrl={chosen} />}</div>
      </div>
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm"><div className="p-3">{hls ? <HlsPlayer src={hls} /> : (ifr ? <iframe title={`${name} Player`} src={ifr} className="w-full h-[420px] rounded-xl" allow="autoplay; fullscreen" /> : <div className="text-sm text-gray-600">Enter an HLS or share URL above.</div>)}</div></div>
      <div className="text-xs text-gray-600">If the embed is blocked by CSP, click Open {name} to launch their portal.</div>
    </div>
  );
}

// ===== DSP Directory =====
function CompanyCard({ name, site, phone, note }: { name: string; site: string; phone?: string; note?: string }){
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm"><div className="p-4 space-y-2">
      <div className="text-lg font-semibold">{name}</div>
      <div className="flex flex-wrap gap-2">
        <button onClick={()=>openNew(site)} className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-md hover:bg-gray-200 font-medium transition-colors text-sm">Website</button>
        {phone && <a href={`tel:${phone.replace(/[^0-9+]/g,'')}`}><button className="bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-700 font-medium transition-colors text-sm">Call {phone}</button></a>}
      </div>
      {note && <div className="text-sm text-gray-600">{note}</div>}
    </div></div>
  );
}
function DSPDirectory(){
  const companies = [
    { name: "Zeitview (DroneBase)", site: "https://www.zeitview.com/", phone: "310-895-9914", note: "Catastrophe response; use site contact for sales." },
    { name: "DroneUp", site: "https://www.droneup.com/contact", phone: "877-601-1860", note: "Nationwide operator network; disaster staffing." },
    { name: "Airborne Response", site: "https://airborneresponse.com/", phone: "305-771-1120", note: "Mission Critical Unmanned; disaster response." },
    { name: "SkySkopes", site: "https://www.skyskopes.com/contact/", phone: "701-838-2610", note: "Enterprise UAS; utilities & energy." }
  ];
  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-600">Ask for live HLS (.m3u8) during ops + post-storm imagery with GPS/addresses and a data feed (CSV/GeoJSON/API).</div>
      <div className="grid md:grid-cols-2 gap-4">{companies.map(c => <CompanyCard key={c.name} {...c} />)}</div>
    </div>
  );
}

// ===== Inbox (SSE + filters + map center + owner prefill) =====
function focusMap(lat: number, lon: number){ if (lat && lon) window.dispatchEvent(new CustomEvent('focusLocation', { detail: { lat, lon, zoom: 18 } })); }
function prefillOwner(it: any){ if (it.address) localStorage.setItem('owner_addr', it.address); if (it.lat) localStorage.setItem('owner_lat', it.lat); if (it.lon) localStorage.setItem('owner_lon', it.lon); }
function InboxStream() {
  const [items, setItems] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [tagFilters, setTagFilters] = useState<any>({});
  const [sortBy, setSortBy] = useState('newest');
  useEffect(()=>{
    let alive = true; let pollId: any;
    const ev = new EventSource('/api/stream');
    ev.onmessage = (m)=>{ try{ const obj = JSON.parse(m.data); if (alive) setItems(prev=>[addTags(obj), ...prev]); }catch(_){} };
    ev.onerror = ()=>{ ev.close(); startPoll(); };
    async function fetchAll(){ try{ const r = await fetch('/api/inbox', { cache: 'no-store' }); if (!r.ok) return; const j = await r.json(); if (alive) setItems(j.map(addTags)); }catch(e){} }
    function startPoll(){ fetchAll(); pollId = setInterval(fetchAll, 10000); }
    return ()=>{ alive=false; ev.close(); if (pollId) clearInterval(pollId); };
  }, []);
  const filtered = items.filter(it=>{
    const hay = ((it.notes||'') + ' ' + (it.address||'')).toLowerCase();
    if (query && !hay.includes(query.toLowerCase())) return false;
    const active = Object.keys(tagFilters).filter(k=>tagFilters[k]);
    if (active.length){ const hasAll = active.every(t => (it.tags||[]).includes(t)); if (!hasAll) return false; }
    return true;
  }).sort((a,b)=> sortBy==='newest' ? new Date(b.timestamp||0).getTime()-new Date(a.timestamp||0).getTime() : (a.address||'').localeCompare(b.address||''));
  return (
    <div className="space-y-3">
      <div className="grid md:grid-cols-3 gap-2 items-center">
        <Input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Search notes/address" />
        <TagFilterBar tagFilters={tagFilters} setTagFilters={setTagFilters} />
        <div className="flex justify-end gap-2">
          <select className="border rounded-md px-2 py-1" value={sortBy} onChange={(e)=>setSortBy(e.target.value)}>
            <option value="newest">Sort: Newest</option>
            <option value="address">Sort: Address</option>
          </select>
        </div>
      </div>
      {!filtered.length && <div className="text-sm text-gray-600">No matching items yet.</div>}
      <div className="grid md:grid-cols-2 gap-4">
        {filtered.map(it => (
          <div key={it.id || it.mediaUrl} className="bg-white border border-gray-200 rounded-lg shadow-sm"><div className="p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="font-medium">{(it.provider||'Unknown')} — {new Date(it.timestamp||Date.now()).toLocaleString()}</div>
              <div className="flex flex-wrap gap-1">{(it.tags||[]).map((t: string)=> <span key={t} className="text-[10px] px-2 py-[2px] rounded-full bg-slate-200">{t}</span>)}</div>
            </div>
            {it.thumbnailUrl && <img src={it.thumbnailUrl} alt="thumb" className="w-full rounded" />}
            <div className="text-sm">{it.address ? it.address : ((it.lat && it.lon) ? (it.lat+', '+it.lon) : '')}</div>
            <div className="flex gap-2 flex-wrap">
              {it.mediaUrl && <a href={it.mediaUrl} target="_blank" rel="noreferrer"><button className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-md hover:bg-gray-200 font-medium transition-colors text-sm">Open Media</button></a>}
              <button onClick={()=>focusMap(it.lat, it.lon)} className="border border-gray-300 text-gray-700 px-3 py-1.5 rounded-md hover:bg-gray-50 font-medium transition-colors text-sm">Center on Map</button>
              <button onClick={()=>prefillOwner(it)} className="border border-gray-300 text-gray-700 px-3 py-1.5 rounded-md hover:bg-gray-50 font-medium transition-colors text-sm">Owner Lookup</button>
            </div>
            {it.notes && <div className="text-sm text-gray-600">{it.notes}</div>}
          </div></div>
        ))}
      </div>
    </div>
  );
}

// ===== Owner Lookup (client UI; backend at /api/owner-lookup) =====
function OwnerLookup(){
  const [addr, setAddr] = useState(localStorage.getItem('owner_addr')||'');
  const [lat, setLat] = useState(localStorage.getItem('owner_lat')||'');
  const [lon, setLon] = useState(localStorage.getItem('owner_lon')||'');
  const [res, setRes] = useState<any>(null);
  useEffect(()=>{ localStorage.setItem('owner_addr', addr); localStorage.setItem('owner_lat', lat); localStorage.setItem('owner_lon', lon); }, [addr,lat,lon]);
  async function lookup(){
    try{ const r = await fetch('/api/owner-lookup', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ address: addr, lat, lon }) }); if (!r.ok){ setRes({ error: 'Lookup service not configured' }); return; } const j = await r.json(); setRes(j); }catch(e){ setRes({ error: 'Network error' }); }
  }
  function sms(number: string){ window.location.href = `sms:${number}`; }
  function call(number: string){ window.location.href = `tel:${number}`; }
  function email(address: string){ window.location.href = `mailto:${address}`; }
  return (
    <div className="space-y-3">
      <div className="grid md:grid-cols-3 gap-2">
        <input value={addr} onChange={(e: any)=>setAddr(e.target.value)} placeholder="Street, City, State (or blank if using GPS)" className="border border-gray-300 rounded-md px-3 py-2" />
        <input value={lat} onChange={(e: any)=>setLat(e.target.value)} placeholder="Latitude" className="border border-gray-300 rounded-md px-3 py-2" />
        <input value={lon} onChange={(e: any)=>setLon(e.target.value)} placeholder="Longitude" className="border border-gray-300 rounded-md px-3 py-2" />
      </div>
      <div className="flex gap-2"><button onClick={lookup} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium transition-colors">Lookup Owner</button><button onClick={()=>{ setAddr(''); setLat(''); setLon(''); setRes(null); }} className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-md hover:bg-gray-200 font-medium transition-colors text-sm">Clear</button></div>
      {res && (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm"><div className="p-4 space-y-2">
          {res.error ? (<div className="text-sm text-red-600">{res.error}</div>) : (
            <div className="space-y-2">
              <div className="text-lg font-semibold">{res.ownerName || 'Unknown Owner'}</div>
              <div className="text-sm">{res.mailingAddress || addr}</div>
              <div className="flex flex-wrap gap-2">
                {res.phone && <button onClick={()=>call(res.phone)} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium transition-colors">Call {res.phone}</button>}
                {res.phone && <button onClick={()=>sms(res.phone)} className="border border-gray-300 text-gray-700 px-3 py-1.5 rounded-md hover:bg-gray-50 font-medium transition-colors text-sm">Text {res.phone}</button>}
                {res.email && <button onClick={()=>email(res.email)} className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-md hover:bg-gray-200 font-medium transition-colors text-sm">Email</button>}
              </div>
              {res.sources && <div className="text-xs text-gray-600">Sources: {res.sources.join(', ')}</div>}
            </div>
          )}
          <div className="text-xs text-gray-600">Use public records and vendor data per contracts and law (TCPA/email/privacy). Log access for emergency response compliance.</div>
        </div></div>
      )}
    </div>
  );
}

// ===== Main App =====
export default function StormOpsHub() {
  const [radarOn, setRadarOn] = useState(localStorage.getItem('radarOn')==='1' || true);
  const [alertsOn, setAlertsOn] = useState(localStorage.getItem('alertsOn')==='1' || true);
  const [activeTab, setActiveTab] = useState('map');
  useEffect(()=>{ localStorage.setItem('radarOn', radarOn? '1':'0'); }, [radarOn]);
  useEffect(()=>{ localStorage.setItem('alertsOn', alertsOn? '1':'0'); }, [alertsOn]);

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-slate-50 to-slate-100 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Storm Operations Hub</h1>
            <p className="text-muted-foreground">Pick a platform, watch live, tag damage, route crews, and contact owners.</p>
          </div>
          <RoleSelector />
        </header>

        <div className="w-full">
          <div className="border-b border-gray-200 bg-white rounded-t-lg">
            <nav className="-mb-px flex space-x-8 px-4 overflow-x-auto">
              <button className="py-3 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap border-blue-500 text-blue-600" onClick={()=>setActiveTab('map')}>Storm Map</button>
              <button className="py-3 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300" onClick={()=>setActiveTab('inbox')}>Inbox</button>
              <button className="py-3 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300" onClick={()=>setActiveTab('multiview')}>Multi-View</button>
              <button className="py-3 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300" onClick={()=>setActiveTab('votix')}>VOTIX</button>
              <button className="py-3 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300" onClick={()=>setActiveTab('flyt')}>FlytBase</button>
              <button className="py-3 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300" onClick={()=>setActiveTab('deploy')}>DroneDeploy</button>
              <button className="py-3 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300" onClick={()=>setActiveTab('dji')}>DJI FH2</button>
              <button className="py-3 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300" onClick={()=>setActiveTab('dsps')}>Hire Pilots</button>
              <button className="py-3 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300" onClick={()=>setActiveTab('owner')}>Owner Lookup</button>
            </nav>
          </div>

          <div className="bg-white rounded-b-lg border-x border-b border-gray-200">
            {activeTab === 'map' && (
              <div className="p-4 space-y-4">
                <QuickMap radarOn={radarOn} alertsOn={alertsOn} />
                <div className="flex gap-2 justify-end">
                  <button onClick={()=>setRadarOn(v=>!v)} className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 font-medium transition-colors">{radarOn?"Disable Radar":"Enable Radar"}</button>
                  <button onClick={()=>setAlertsOn(v=>!v)} className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 font-medium transition-colors">{alertsOn?"Disable Alerts":"Enable Alerts"}</button>
                </div>
              </div>
            )}

            {activeTab === 'inbox' && <div className="p-4 space-y-4"><InboxStream /></div>}
            {activeTab === 'multiview' && <div className="p-4 space-y-4"><MultiView /></div>}

            {activeTab === 'votix' && <div className="p-4 space-y-4"><ProviderTab name="VOTIX" hlsKey="votixHls" iframeKey="votixIframe" portal="https://platform.votix.com/" /></div>}
            {activeTab === 'flyt' && <div className="p-4 space-y-4"><ProviderTab name="FlytBase" hlsKey="flytHls" iframeKey="flytIframe" portal="https://my.flytbase.com/" /></div>}
            {activeTab === 'deploy' && <div className="p-4 space-y-4"><ProviderTab name="DroneDeploy" hlsKey="ddHls" iframeKey="ddIframe" portal="https://www.dronedeploy.com/live/" /></div>}
            {activeTab === 'dji' && <div className="p-4 space-y-4"><ProviderTab name="DJI FlightHub 2" hlsKey="fh2Hls" iframeKey="fh2Iframe" portal="https://flighthub2.dji.com/" /></div>}

            {activeTab === 'dsps' && <div className="p-4 space-y-4"><DSPDirectory /></div>}
            {activeTab === 'owner' && <div className="p-4 space-y-4"><OwnerLookup /></div>}
          </div>
        </div>
      </div>
    </div>
  );
}