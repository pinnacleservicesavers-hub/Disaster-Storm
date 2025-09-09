// @ts-nocheck
import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

/**
 * Storm Ops Pro Hub (React)
 * - Role-based ops hub
 * - Storm Map (OSM + Radar + NOAA alerts) with auto-center on incoming items
 * - Inbox with damage-tag filters, badges, sorting, and map centering
 * - Multi-View wall (4 panes) with Pin buttons from provider tabs
 * - Provider tabs: VOTIX / FlytBase / DroneDeploy / DJI FH2 (HLS & iframe)
 * - DSPs tab (hire pilots)
 * - Owner Lookup tab (placeholder backend integration)
 */

function openNew(url: string) { 
  if (url) window.open(url, "_blank", "noopener,noreferrer"); 
}

// ===== Role selector =====
function RoleSelector(){
  const [role, setRole] = useState(localStorage.getItem('role') || 'ops');
  useEffect(() => { localStorage.setItem('role', role); }, [role]);
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-600">Role:</span>
      <select className="border rounded-md px-2 py-1" value={role} onChange={(e) => setRole(e.target.value)}>
        <option value="ops">Ops</option>
        <option value="field">Field</option>
        <option value="admin">Admin</option>
      </select>
    </div>
  );
}

// ===== Map Layers =====
function RadarLayer({ enabled }: { enabled: boolean }){
  const map = useMap();
  const layerRef = useRef<any>(null);
  useEffect(() => {
    if (!enabled){ 
      if (layerRef.current){ 
        map.removeLayer(layerRef.current); 
        layerRef.current = null; 
      } 
      return; 
    }
    const L = (window as any).L; 
    if (!L) return;
    const radar = L.tileLayer("https://tilecache.rainviewer.com/v2/radar/now/256/{z}/{x}/{y}/2/1_1.png", { 
      opacity: 0.75, 
      attribution: "<a href='https://www.rainviewer.com/'>RainViewer</a>" 
    });
    radar.addTo(map); 
    layerRef.current = radar;
    return () => { 
      if (layerRef.current){ 
        map.removeLayer(layerRef.current); 
        layerRef.current = null; 
      } 
    };
  }, [enabled, map]);
  return null;
}

function NOAAAlertsLayer({ enabled }: { enabled: boolean }){
  const map = useMap();
  const layerRef = useRef<any>(null);
  useEffect(() => {
    if (!enabled){ 
      if (layerRef.current){ 
        map.removeLayer(layerRef.current); 
        layerRef.current = null; 
      } 
      return; 
    }
    const L = (window as any).L; 
    if (!L) return;
    const noaa = L.tileLayer.wms("https://idpgis.ncep.noaa.gov/arcgis/services/NWS_Watches_Warnings/MapServer/WMSServer", { 
      layers: "1", 
      format: "image/png", 
      transparent: true, 
      attribution: "NOAA/NWS" 
    });
    noaa.addTo(map); 
    layerRef.current = noaa;
    return () => { 
      if (layerRef.current){ 
        map.removeLayer(layerRef.current); 
        layerRef.current = null; 
      } 
    };
  }, [enabled, map]);
  return null;
}

function QuickMap({ radarOn, alertsOn }: { radarOn: boolean; alertsOn: boolean }){
  const [lat, setLat] = useState(() => Number(localStorage.getItem("mapLat")) || 32.5104);
  const [lng, setLng] = useState(() => Number(localStorage.getItem("mapLng")) || -84.8766);
  const [z, setZ] = useState(() => Number(localStorage.getItem("mapZoom")) || 7);
  const position = useMemo(() => [lat, lng] as [number, number], [lat, lng]);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const save = () => { 
    localStorage.setItem("mapLat", String(lat)); 
    localStorage.setItem("mapLng", String(lng)); 
    localStorage.setItem("mapZoom", String(z)); 
  };

  useEffect(() => {
    function onFocus(e: any){
      const d = e.detail || {}; 
      if (!mapRef.current || !d.lat || !d.lon) return;
      mapRef.current.setView([d.lat, d.lon], d.zoom || 18);
      const L = (window as any).L; 
      if (!L) return;
      if (markerRef.current) { 
        mapRef.current.removeLayer(markerRef.current); 
        markerRef.current = null; 
      }
      markerRef.current = L.marker([d.lat, d.lon]).addTo(mapRef.current);
    }
    window.addEventListener('focusLocation', onFocus);
    return () => window.removeEventListener('focusLocation', onFocus);
  }, []);

  return (
    <Card className="w-full">
      <CardContent className="p-4 space-y-3">
        <div className="grid grid-cols-3 gap-2">
          <Input type="number" step="0.0001" value={lat} onChange={(e) => setLat(Number(e.target.value))} placeholder="Latitude" />
          <Input type="number" step="0.0001" value={lng} onChange={(e) => setLng(Number(e.target.value))} placeholder="Longitude" />
          <Input type="number" step="1" min={2} max={12} value={z} onChange={(e) => setZ(Number(e.target.value))} placeholder="Zoom" />
        </div>
        <div className="flex justify-end"><Button onClick={save}>Save View</Button></div>
        <div className="h-[420px] rounded-2xl overflow-hidden">
          <MapContainer ref={mapRef} center={position} zoom={z} className="h-full w-full">
            <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <RadarLayer enabled={radarOn} />
            <NOAAAlertsLayer enabled={alertsOn} />
          </MapContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// ===== Tags & Filters =====
const TAGS = [
  'tree_on_roof','tree_on_building','tree_on_fence','tree_on_barn','tree_on_shed','tree_on_car','tree_in_pool','tree_on_playground','line_down','structure_damage'
];

const KEYWORD_MAP = [
  ['tree_on_roof', /tree on roof|through roof|roof damage/i],
  ['tree_on_building', /tree on (house|building|home|structure)/i],
  ['tree_on_fence', /tree on fence|fence down/i],
  ['tree_on_barn', /tree on barn/i],
  ['tree_on_shed', /tree on shed/i],
  ['tree_on_car', /tree on car|on vehicle|on truck/i],
  ['tree_in_pool', /tree in pool|pool damage/i],
  ['tree_on_playground', /tree on playground|playset|swing set/i],
  ['line_down', /line down|power line|utility line|pole down/i],
  ['structure_damage', /collapse|compromised|structural|wall down|house split/i]
];

function addTags(item: any){
  const text = ((item.notes || '') + ' ' + (item.address || '')).toLowerCase();
  const tags = [];
  for (const [tag, rx] of KEYWORD_MAP){ 
    if (rx.test(text)) tags.push(tag); 
  }
  return { ...item, tags };
}

function TagFilterBar({ tagFilters, setTagFilters }: { tagFilters: any; setTagFilters: (filters: any) => void }){
  return (
    <div className="flex flex-wrap gap-2">
      {TAGS.map(t => (
        <label key={t} className="text-xs flex items-center gap-1 border rounded-full px-2 py-1">
          <input 
            type="checkbox" 
            checked={!!tagFilters[t]} 
            onChange={(e) => setTagFilters({ ...tagFilters, [t]: e.target.checked })} 
          /> 
          {t}
        </label>
      ))}
    </div>
  );
}

// ===== HLS / Player =====
function HlsPlayer({ src }: { src: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const video = videoRef.current; 
    if (!video || !src) return;
    if (video.canPlayType('application/vnd.apple.mpegurl')) { 
      video.src = src; 
      video.play().catch(() => {}); 
      return; 
    }
    let hls: any; 
    (async () => {
      try {
        const mod = await import('hls.js'); 
        const Hls = mod.default;
        if (Hls?.isSupported()){ 
          hls = new Hls(); 
          hls.loadSource(src); 
          hls.attachMedia(video); 
          hls.on(Hls.Events.MANIFEST_PARSED, () => video.play().catch(() => {})); 
        }
        else { 
          window.open(src,'_blank'); 
        }
      } catch(e){ 
        console.warn('HLS init failed', e); 
      }
    })();
    return () => { 
      if (hls) hls.destroy(); 
    };
  }, [src]);
  return <video ref={videoRef} controls className="w-full h-full object-contain rounded-xl" />;
}

function FlexiblePlayer({ url }: { url: string }){
  if (!url) return <div className="text-sm text-gray-600">No feed set</div>;
  const lower = url.toLowerCase();
  if (lower.endsWith('.m3u8')) return <HlsPlayer src={url} />;
  return <iframe title="Feed" src={url} className="w-full h-full rounded-xl" allow="autoplay; fullscreen" />;
}

// ===== Multi-View (4 panes) =====
function pinTo(slot: string, url: string){ 
  if (!url) return; 
  localStorage.setItem(slot, url); 
  window.dispatchEvent(new Event('mvUpdate')); 
}

function PinButtons({ currentUrl }: { currentUrl: string }){
  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" onClick={() => pinTo('mv1', currentUrl)}>Pin → Pane 1</Button>
      <Button variant="outline" onClick={() => pinTo('mv2', currentUrl)}>Pin → Pane 2</Button>
      <Button variant="outline" onClick={() => pinTo('mv3', currentUrl)}>Pin → Pane 3</Button>
      <Button variant="outline" onClick={() => pinTo('mv4', currentUrl)}>Pin → Pane 4</Button>
    </div>
  );
}

function MultiView(){
  const [mv1, setMv1] = useState(localStorage.getItem('mv1') || '');
  const [mv2, setMv2] = useState(localStorage.getItem('mv2') || '');
  const [mv3, setMv3] = useState(localStorage.getItem('mv3') || '');
  const [mv4, setMv4] = useState(localStorage.getItem('mv4') || '');
  
  useEffect(() => { localStorage.setItem('mv1', mv1); }, [mv1]);
  useEffect(() => { localStorage.setItem('mv2', mv2); }, [mv2]);
  useEffect(() => { localStorage.setItem('mv3', mv3); }, [mv3]);
  useEffect(() => { localStorage.setItem('mv4', mv4); }, [mv4]);
  
  useEffect(() => {
    function onStorage(e: StorageEvent){ 
      if(['mv1','mv2','mv3','mv4'].includes(e.key || '')){
        setMv1(localStorage.getItem('mv1') || ''); 
        setMv2(localStorage.getItem('mv2') || ''); 
        setMv3(localStorage.getItem('mv3') || ''); 
        setMv4(localStorage.getItem('mv4') || '');
      }
    }
    function onCustom(){ 
      setMv1(localStorage.getItem('mv1') || ''); 
      setMv2(localStorage.getItem('mv2') || ''); 
      setMv3(localStorage.getItem('mv3') || ''); 
      setMv4(localStorage.getItem('mv4') || ''); 
    }
    window.addEventListener('storage', onStorage); 
    window.addEventListener('mvUpdate', onCustom);
    return () => { 
      window.removeEventListener('storage', onStorage); 
      window.removeEventListener('mvUpdate', onCustom); 
    };
  }, []);
  
  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-4 gap-2">
        <Input value={mv1} onChange={(e) => setMv1(e.target.value)} placeholder="Pane 1 URL" />
        <Input value={mv2} onChange={(e) => setMv2(e.target.value)} placeholder="Pane 2 URL" />
        <Input value={mv3} onChange={(e) => setMv3(e.target.value)} placeholder="Pane 3 URL" />
        <Input value={mv4} onChange={(e) => setMv4(e.target.value)} placeholder="Pane 4 URL" />
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        <Card className="h-[320px]"><CardContent className="p-2 h-full"><FlexiblePlayer url={mv1} /></CardContent></Card>
        <Card className="h-[320px]"><CardContent className="p-2 h-full"><FlexiblePlayer url={mv2} /></CardContent></Card>
        <Card className="h-[320px]"><CardContent className="p-2 h-full"><FlexiblePlayer url={mv3} /></CardContent></Card>
        <Card className="h-[320px]"><CardContent className="p-2 h-full"><FlexiblePlayer url={mv4} /></CardContent></Card>
      </div>
    </div>
  );
}

// ===== Provider tabs =====
function ProviderTab({ name, hlsKey, iframeKey, portal }: { name: string; hlsKey: string; iframeKey: string; portal: string }){
  const [hls, setHls] = useState(localStorage.getItem(hlsKey) || '');
  const [ifr, setIfr] = useState(localStorage.getItem(iframeKey) || '');
  
  useEffect(() => { localStorage.setItem(hlsKey, hls); }, [hlsKey, hls]);
  useEffect(() => { localStorage.setItem(iframeKey, ifr); }, [iframeKey, ifr]);
  
  const chosen = hls || ifr || '';
  
  return (
    <div className="space-y-3">
      <div className="grid md:grid-cols-3 gap-3">
        <div className="space-y-1">
          <label className="text-sm text-gray-600">{name} HLS (.m3u8)</label>
          <Input value={hls} onChange={(e) => setHls(e.target.value)} placeholder="https://.../index.m3u8" />
        </div>
        <div className="space-y-1">
          <label className="text-sm text-gray-600">{name} Share/Embed URL</label>
          <Input value={ifr} onChange={(e) => setIfr(e.target.value)} placeholder="https://..." />
        </div>
        <div className="flex items-end gap-2">
          <Button onClick={() => openNew(portal)}>Open {name}</Button>
          {chosen && <PinButtons currentUrl={chosen} />}
        </div>
      </div>
      <Card>
        <CardContent className="p-3">
          {hls ? (
            <HlsPlayer src={hls} />
          ) : (
            ifr ? (
              <iframe 
                title={`${name} Player`} 
                src={ifr} 
                className="w-full h-[420px] rounded-xl" 
                allow="autoplay; fullscreen" 
              />
            ) : (
              <div className="text-sm text-gray-600">Enter an HLS or share URL above.</div>
            )
          )}
        </CardContent>
      </Card>
      <div className="text-xs text-gray-600">If the embed is blocked by CSP, click Open {name} to launch their portal.</div>
    </div>
  );
}

// ===== DSP Directory & Inbox =====
function CompanyCard({ name, site, phone, note }: { name: string; site: string; phone?: string; note?: string }){
  return (
    <Card>
      <CardContent className="p-4 space-y-2">
        <div className="text-lg font-semibold">{name}</div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => openNew(site)}>Website</Button>
          {phone && (
            <a href={`tel:${phone.replace(/[^\d+]/g,'')}`}>
              <Button>Call {phone}</Button>
            </a>
          )}
        </div>
        {note && <div className="text-sm text-gray-600">{note}</div>}
      </CardContent>
    </Card>
  );
}

function DSPDirectory() {
  const companies = [
    { name: "Zeitview (formerly DroneBase)", site: "https://www.zeitview.com/", phone: "310-895-9914", note: "Enterprise inspections & catastrophe response; use site contact for sales." },
    { name: "DroneUp", site: "https://www.droneup.com/contact", phone: "877-601-1860", note: "Nationwide operator network; disaster staffing." },
    { name: "Airborne Response", site: "https://airborneresponse.com/", phone: "305-771-1120", note: "Mission Critical Unmanned Solutions; insurance & disaster response." },
    { name: "SkySkopes", site: "https://www.skyskopes.com/contact/", phone: "701-838-2610", note: "Enterprise UAS ops; energy & utilities; regional teams." }
  ];

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-600">
        These providers can staff pilots before/after storms. Ask for live HLS (.m3u8) links during ops and post-storm imagery with GPS/addresses plus a data feed (CSV/GeoJSON/API).
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {companies.map((company, index) => (
          <CompanyCard key={index} {...company} />
        ))}
      </div>
    </div>
  );
}

// ===== Inbox with SSE =====
function InboxStream() {
  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [tagFilters, setTagFilters] = useState<any>({});
  const [sort, setSort] = useState('newest');
  const [useSSE, setUseSSE] = useState(true);

  // SSE connection
  useEffect(() => {
    if (!useSSE) return;
    
    const eventSource = new EventSource('/api/stream');
    
    eventSource.onmessage = (event) => {
      try {
        const newItem = JSON.parse(event.data);
        const taggedItem = addTags(newItem);
        setItems(prev => [taggedItem, ...prev.filter(item => item.id !== taggedItem.id)]);
        
        // Auto-focus on map
        if (taggedItem.lat && taggedItem.lon) {
          window.dispatchEvent(new CustomEvent('focusLocation', {
            detail: { lat: taggedItem.lat, lon: taggedItem.lon, zoom: 16 }
          }));
        }
      } catch (error) {
        console.error('SSE parse error:', error);
      }
    };

    eventSource.onerror = () => {
      console.log('SSE connection failed, falling back to polling');
      setUseSSE(false);
    };

    return () => eventSource.close();
  }, [useSSE]);

  // Polling fallback
  useEffect(() => {
    if (useSSE) return;
    
    const interval = setInterval(async () => {
      try {
        const response = await fetch('/api/inbox');
        if (response.ok) {
          const inboxItems = await response.json();
          const taggedItems = inboxItems.map(addTags);
          setItems(taggedItems);
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 10000);

    // Initial fetch
    fetch('/api/inbox')
      .then(r => r.json())
      .then(inboxItems => {
        const taggedItems = inboxItems.map(addTags);
        setItems(taggedItems);
      })
      .catch(console.error);

    return () => clearInterval(interval);
  }, [useSSE]);

  // Filter and sort items
  const filteredItems = items
    .filter(item => {
      const matchesSearch = !search || 
        item.notes?.toLowerCase().includes(search.toLowerCase()) ||
        item.address?.toLowerCase().includes(search.toLowerCase()) ||
        item.provider?.toLowerCase().includes(search.toLowerCase());
      
      const activeTags = Object.keys(tagFilters).filter(tag => tagFilters[tag]);
      const matchesTags = activeTags.length === 0 || 
        activeTags.some(tag => item.tags?.includes(tag));
      
      return matchesSearch && matchesTags;
    })
    .sort((a, b) => {
      if (sort === 'newest') return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      if (sort === 'address') return (a.address || '').localeCompare(b.address || '');
      return 0;
    });

  const centerOnMap = (item: any) => {
    if (item.lat && item.lon) {
      window.dispatchEvent(new CustomEvent('focusLocation', {
        detail: { lat: item.lat, lon: item.lon, zoom: 18 }
      }));
    }
  };

  const ownerLookup = (item: any) => {
    if (item.address) {
      // This would integrate with your owner lookup system
      window.open(`/owner-lookup?address=${encodeURIComponent(item.address)}`, '_blank');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <Input 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            placeholder="Search footage..." 
          />
        </div>
        <select 
          className="border rounded-md px-2 py-1" 
          value={sort} 
          onChange={(e) => setSort(e.target.value)}
        >
          <option value="newest">Newest</option>
          <option value="address">Address</option>
        </select>
        <div className="text-sm text-gray-600">
          {useSSE ? '🔴 Live (SSE)' : '🔄 Polling'} • {filteredItems.length} items
        </div>
      </div>

      <TagFilterBar tagFilters={tagFilters} setTagFilters={setTagFilters} />

      <div className="grid md:grid-cols-2 gap-3">
        {filteredItems.map(item => (
          <Card key={item.id}>
            <CardContent className="p-3 space-y-2">
              <div className="font-medium">{item.provider} — {new Date(item.timestamp).toLocaleString()}</div>
              <div className="text-sm text-gray-600">📍 {item.lat}, {item.lon}</div>
              {item.address && (
                <div className="text-sm text-gray-500">📍 {item.address}</div>
              )}
              
              {/* Damage Tags */}
              {item.tags && item.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {item.tags.map((tag: string, idx: number) => (
                    <span key={idx} className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                      {tag.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              )}
              
              <div className="flex gap-2">
                {item.mediaUrl && (
                  <a href={item.mediaUrl} target="_blank" rel="noreferrer">
                    <Button size="sm" variant="outline">Open Media</Button>
                  </a>
                )}
                <Button size="sm" variant="outline" onClick={() => centerOnMap(item)}>
                  Center on Map
                </Button>
                <Button size="sm" variant="outline" onClick={() => ownerLookup(item)}>
                  Owner Lookup
                </Button>
              </div>
              
              {item.notes && <div className="text-sm text-gray-500">{item.notes}</div>}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ===== Owner Lookup =====
function OwnerLookup() {
  const [address, setAddress] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const lookup = async () => {
    if (!address) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/owner?address=${encodeURIComponent(address)}`);
      if (response.ok) {
        const data = await response.json();
        setResult(data);
      }
    } catch (error) {
      console.error('Owner lookup error:', error);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4 space-y-3">
          <h3 className="font-semibold">Property Owner Lookup</h3>
          <div className="flex gap-2">
            <Input 
              value={address} 
              onChange={(e) => setAddress(e.target.value)} 
              placeholder="Enter property address..." 
              className="flex-1"
            />
            <Button onClick={lookup} disabled={loading}>
              {loading ? 'Looking up...' : 'Lookup'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <h4 className="font-medium">Owner Information</h4>
            {result.owner ? (
              <div className="space-y-2">
                <div><strong>Name:</strong> {result.owner.name}</div>
                {result.owner.phone && (
                  <div className="flex gap-2">
                    <strong>Phone:</strong> {result.owner.phone}
                    <a href={`tel:${result.owner.phone}`}>
                      <Button size="sm" variant="outline">Call</Button>
                    </a>
                    <a href={`sms:${result.owner.phone}`}>
                      <Button size="sm" variant="outline">Text</Button>
                    </a>
                  </div>
                )}
                {result.owner.email && (
                  <div className="flex gap-2">
                    <strong>Email:</strong> {result.owner.email}
                    <a href={`mailto:${result.owner.email}`}>
                      <Button size="sm" variant="outline">Email</Button>
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <div>No owner information found</div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ===== Main Component =====
export default function StormOpsProHub() {
  const [radarOn, setRadarOn] = useState(true);
  const [alertsOn, setAlertsOn] = useState(true);

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-slate-50 to-slate-100 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Storm Operations Pro Hub</h1>
            <p className="text-gray-600">Professional emergency response and drone coordination platform</p>
          </div>
          <RoleSelector />
        </div>

        <Tabs defaultValue="map" className="w-full">
          <TabsList className="grid w-full grid-cols-8">
            <TabsTrigger value="map">🗺️ Storm Map</TabsTrigger>
            <TabsTrigger value="inbox">📥 Inbox</TabsTrigger>
            <TabsTrigger value="multiview">📺 Multi-View</TabsTrigger>
            <TabsTrigger value="votix">🔴 VOTIX</TabsTrigger>
            <TabsTrigger value="flytbase">🚁 FlytBase</TabsTrigger>
            <TabsTrigger value="dronedeploy">📹 DroneDeploy</TabsTrigger>
            <TabsTrigger value="dji">🛸 DJI FH2</TabsTrigger>
            <TabsTrigger value="dsps">👥 Hire Pilots</TabsTrigger>
          </TabsList>

          <TabsContent value="map">
            <QuickMap radarOn={radarOn} alertsOn={alertsOn} />
            <div className="flex gap-2 justify-end mt-2">
              <Button variant="outline" onClick={() => setRadarOn(!radarOn)}>
                {radarOn ? "🚫 Disable Radar" : "📡 Enable Radar"}
              </Button>
              <Button variant="outline" onClick={() => setAlertsOn(!alertsOn)}>
                {alertsOn ? "🚫 Disable Alerts" : "⚠️ Enable Alerts"}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="inbox">
            <InboxStream />
          </TabsContent>

          <TabsContent value="multiview">
            <MultiView />
          </TabsContent>

          <TabsContent value="votix">
            <ProviderTab 
              name="VOTIX" 
              hlsKey="votixHls" 
              iframeKey="votixIframe" 
              portal="https://platform.votix.com/" 
            />
          </TabsContent>

          <TabsContent value="flytbase">
            <ProviderTab 
              name="FlytBase" 
              hlsKey="flytHls" 
              iframeKey="flytIframe" 
              portal="https://my.flytbase.com/" 
            />
          </TabsContent>

          <TabsContent value="dronedeploy">
            <ProviderTab 
              name="DroneDeploy" 
              hlsKey="ddHls" 
              iframeKey="ddIframe" 
              portal="https://www.dronedeploy.com/live/" 
            />
          </TabsContent>

          <TabsContent value="dji">
            <ProviderTab 
              name="DJI FlightHub 2" 
              hlsKey="fh2Hls" 
              iframeKey="fh2Iframe" 
              portal="https://flighthub2.dji.com/" 
            />
          </TabsContent>

          <TabsContent value="dsps">
            <DSPDirectory />
          </TabsContent>

          <TabsContent value="owner">
            <OwnerLookup />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}