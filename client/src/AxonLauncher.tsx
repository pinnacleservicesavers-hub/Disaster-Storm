// @ts-nocheck
import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

/**
 * Storm Ops Multi‑Feed Hub (React)
 * --------------------------------
 * One screen to:
 *  - Open Axon/DroneSense secure portals
 *  - View OSM + Radar + NOAA alerts
 *  - Watch HLS/iFrame shares from VOTIX, FlytBase, DroneDeploy, DJI FlightHub 2 (when given)
 *  - Pick which feed to watch via a clean "Live Feeds" tab
 *
 * Notes:
 *  - Many enterprise portals block iframes. Use their shareable player links or open in a new tab.
 *  - HLS (.m3u8) is supported with native playback or hls.js fallback (loaded dynamically).
 */

function openNew(url: string) { 
  if (url) window.open(url, "_blank", "noopener,noreferrer"); 
}

function PersistedField({ k, label, placeholder }: { k: string; label: string; placeholder: string }) {
  const [val, setVal] = useState(() => localStorage.getItem(k) || "");
  useEffect(() => { localStorage.setItem(k, val); }, [k, val]);
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm text-gray-600">{label}</label>
      <input 
        className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        value={val} 
        onChange={(e) => setVal(e.target.value)} 
        placeholder={placeholder} 
      />
    </div>
  );
}

// --- Map Layers ---
function RadarLayer({ enabled }: { enabled: boolean }) {
  const map = useMap();
  const layerRef = useRef<any>(null);
  useEffect(() => {
    if (!enabled) { 
      if (layerRef.current) { 
        map.removeLayer(layerRef.current); 
        layerRef.current = null; 
      } 
      return; 
    }
    const L = (window as any).L; 
    if (!L) return;
    const radar = L.tileLayer(
      "https://tilecache.rainviewer.com/v2/radar/now/256/{z}/{x}/{y}/2/1_1.png",
      { opacity: 0.75, attribution: "<a href='https://www.rainviewer.com/'>RainViewer</a>" }
    );
    radar.addTo(map); 
    layerRef.current = radar;
    return () => { 
      if (layerRef.current) { 
        map.removeLayer(layerRef.current); 
        layerRef.current = null; 
      } 
    };
  }, [enabled, map]);
  return null;
}

function NOAAAlertsLayer({ enabled }: { enabled: boolean }) {
  const map = useMap();
  const layerRef = useRef<any>(null);
  useEffect(() => {
    if (!enabled) { 
      if (layerRef.current) { 
        map.removeLayer(layerRef.current); 
        layerRef.current = null; 
      } 
      return; 
    }
    const L = (window as any).L; 
    if (!L) return;
    const noaa = L.tileLayer.wms("https://idpgis.ncep.noaa.gov/arcgis/services/NWS_Watches_Warnings/MapServer/WMSServer", {
      layers: "1", format: "image/png", transparent: true, attribution: "NOAA/NWS"
    });
    noaa.addTo(map); 
    layerRef.current = noaa;
    return () => { 
      if (layerRef.current) { 
        map.removeLayer(layerRef.current); 
        layerRef.current = null; 
      } 
    };
  }, [enabled, map]);
  return null;
}

function QuickMap({ radarOn, alertsOn }: { radarOn: boolean; alertsOn: boolean }) {
  const [lat, setLat] = useState(() => Number(localStorage.getItem("mapLat")) || 32.5104);
  const [lng, setLng] = useState(() => Number(localStorage.getItem("mapLng")) || -84.8766);
  const [z, setZ] = useState(() => Number(localStorage.getItem("mapZoom")) || 7);
  const position = useMemo(() => [lat, lng] as [number, number], [lat, lng]);
  const save = () => { 
    localStorage.setItem("mapLat", String(lat)); 
    localStorage.setItem("mapLng", String(lng)); 
    localStorage.setItem("mapZoom", String(z)); 
  };
  
  return (
    <div className="w-full bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="p-4 space-y-3">
        <div className="grid grid-cols-3 gap-2">
          <input 
            className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            type="number" 
            step="0.0001" 
            value={lat} 
            onChange={(e) => setLat(Number(e.target.value))} 
            placeholder="Latitude" 
          />
          <input 
            className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            type="number" 
            step="0.0001" 
            value={lng} 
            onChange={(e) => setLng(Number(e.target.value))} 
            placeholder="Longitude" 
          />
          <input 
            className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            type="number" 
            step="1" 
            min={2} 
            max={12} 
            value={z} 
            onChange={(e) => setZ(Number(e.target.value))} 
            placeholder="Zoom" 
          />
        </div>
        <div className="flex justify-end">
          <button 
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium transition-colors"
            onClick={save}
          >
            Save View
          </button>
        </div>
        <div className="h-[420px] rounded-2xl overflow-hidden border border-gray-200">
          <MapContainer center={position} zoom={z} className="h-full w-full">
            <TileLayer 
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' 
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
            />
            <RadarLayer enabled={radarOn} />
            <NOAAAlertsLayer enabled={alertsOn} />
          </MapContainer>
        </div>
      </div>
    </div>
  );
}

// --- HLS / iFrame playback ---
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
        if (Hls?.isSupported()) {
          hls = new Hls(); 
          hls.loadSource(src); 
          hls.attachMedia(video);
          hls.on(Hls.Events.MANIFEST_PARSED, () => video.play().catch(() => {}));
        } else { 
          window.open(src, '_blank'); 
        }
      } catch (e) { 
        console.warn('HLS init failed', e); 
      }
    })();
    
    return () => { if (hls) hls.destroy(); };
  }, [src]);
  
  return <video ref={videoRef} controls className="w-full rounded-xl bg-black" />;
}

function ProviderPlayer({ hlsKey, iframeKey, name }: { hlsKey: string; iframeKey: string; name: string }) {
  const hls = (typeof window !== 'undefined' && localStorage.getItem(hlsKey)) || '';
  const iframeUrl = (typeof window !== 'undefined' && localStorage.getItem(iframeKey)) || '';
  
  if (hls) return (
    <div className="space-y-2">
      <div className="text-sm text-gray-600">🔴 Playing HLS for {name}</div>
      <HlsPlayer src={hls} />
    </div>
  );
  
  if (iframeUrl) return (
    <div className="space-y-2">
      <div className="text-sm text-gray-600">📺 Embedding shared player for {name}</div>
      <iframe 
        title={`${name} Player`} 
        src={iframeUrl} 
        className="w-full h-[420px] rounded-xl border border-gray-200" 
        allow="autoplay; fullscreen" 
      />
    </div>
  );
  
  return (
    <div className="text-sm text-gray-600 p-8 text-center bg-gray-50 rounded-xl">
      📹 Enter an HLS (.m3u8) or a shareable player URL above to view {name}.
    </div>
  );
}

export default function StormOpsHub() {
  const [radarOn, setRadarOn] = useState(localStorage.getItem("radarOn") === "1");
  const [alertsOn, setAlertsOn] = useState(localStorage.getItem("alertsOn") === "1");
  const [activeTab, setActiveTab] = useState("map");

  const links = {
    opsHub: "https://web.dronesense.com/ops",
    video: "https://web.dronesense.com/video",
    evidence: "https://www.evidence.com/",
    windy: "https://embed.windy.com/embed2.html?lat=33&lon=-85&zoom=5&level=surface&overlay=radar"
  };

  const tabs = [
    { id: "map", label: "🗺️ Storm Map" },
    { id: "feeds", label: "📹 Live Feeds" },
    { id: "windy", label: "🌪️ Windy" },
    { id: "axon", label: "🚁 Axon Links" },
    { id: "help", label: "❓ Setup" }
  ];

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-slate-50 to-slate-100 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="space-y-1">
          <h1 className="text-3xl font-bold text-gray-900">Storm Ops Multi‑Feed Hub</h1>
          <p className="text-gray-600">Pick your storm view: radar/alerts, Windy, or live drone feeds (VOTIX, FlytBase, DroneDeploy, DJI FlightHub 2).</p>
        </header>

        {/* Custom Tabs */}
        <div className="w-full">
          <div className="border-b border-gray-200 bg-white rounded-t-lg">
            <nav className="-mb-px flex space-x-8 px-4">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
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
          
          <div className="bg-white rounded-b-lg border-x border-b border-gray-200">
            {/* Storm Map Tab */}
            {activeTab === "map" && (
              <div className="p-4 space-y-4">
                <QuickMap radarOn={radarOn} alertsOn={alertsOn} />
                <div className="flex gap-2 justify-end">
                  <button 
                    className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 font-medium transition-colors"
                    onClick={() => { 
                      const nv = !radarOn; 
                      setRadarOn(nv); 
                      localStorage.setItem("radarOn", nv ? "1" : "0"); 
                    }}
                  >
                    {radarOn ? "🚫 Disable Radar" : "📡 Enable Radar"}
                  </button>
                  <button 
                    className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 font-medium transition-colors"
                    onClick={() => { 
                      const nv = !alertsOn; 
                      setAlertsOn(nv); 
                      localStorage.setItem("alertsOn", nv ? "1" : "0"); 
                    }}
                  >
                    {alertsOn ? "🚫 Disable Alerts" : "⚠️ Enable Alerts"}
                  </button>
                </div>
              </div>
            )}

            {/* Live Feeds Tab */}
            {activeTab === "feeds" && (
              <div className="p-4 space-y-4">
                {/* VOTIX */}
                <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                  <div className="p-4 space-y-3">
                    <div className="text-lg font-semibold text-gray-900">🔴 VOTIX — HLS/RTMP Share</div>
                    <div className="grid md:grid-cols-3 gap-3">
                      <PersistedField k="votixHls" label="HLS URL (.m3u8)" placeholder="https://.../index.m3u8" />
                      <PersistedField k="votixIframe" label="Iframe/Share URL (optional)" placeholder="https://..." />
                      <div className="flex items-end">
                        <button 
                          className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium transition-colors"
                          onClick={() => openNew(localStorage.getItem('votixIframe') || '')}
                        >
                          Open VOTIX
                        </button>
                      </div>
                    </div>
                    <ProviderPlayer hlsKey="votixHls" iframeKey="votixIframe" name="VOTIX" />
                    <div className="text-xs text-gray-500">RTMP itself cannot play in-browser; VOTIX can restream to HLS which this player supports.</div>
                  </div>
                </div>

                {/* FlytBase */}
                <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                  <div className="p-4 space-y-3">
                    <div className="text-lg font-semibold text-gray-900">🚁 FlytBase — Shareable Player</div>
                    <div className="grid md:grid-cols-3 gap-3">
                      <PersistedField k="flytbaseHls" label="HLS URL (.m3u8)" placeholder="https://.../index.m3u8" />
                      <PersistedField k="flytbaseIframe" label="Iframe/Share URL" placeholder="https://..." />
                      <div className="flex items-end">
                        <button 
                          className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium transition-colors"
                          onClick={() => openNew(localStorage.getItem('flytbaseIframe') || '')}
                        >
                          Open FlytBase
                        </button>
                      </div>
                    </div>
                    <ProviderPlayer hlsKey="flytbaseHls" iframeKey="flytbaseIframe" name="FlytBase" />
                  </div>
                </div>

                {/* DroneDeploy */}
                <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                  <div className="p-4 space-y-3">
                    <div className="text-lg font-semibold text-gray-900">🚁 DroneDeploy — Live Stream</div>
                    <div className="grid md:grid-cols-3 gap-3">
                      <PersistedField k="droneDeployHls" label="HLS URL (.m3u8)" placeholder="https://.../index.m3u8" />
                      <PersistedField k="droneDeployIframe" label="Iframe/Share URL" placeholder="https://..." />
                      <div className="flex items-end">
                        <button 
                          className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium transition-colors"
                          onClick={() => openNew(localStorage.getItem('droneDeployIframe') || '')}
                        >
                          Open DroneDeploy
                        </button>
                      </div>
                    </div>
                    <ProviderPlayer hlsKey="droneDeployHls" iframeKey="droneDeployIframe" name="DroneDeploy" />
                  </div>
                </div>

                {/* DJI FlightHub 2 */}
                <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                  <div className="p-4 space-y-3">
                    <div className="text-lg font-semibold text-gray-900">🛸 DJI FlightHub 2 — Live Feeds</div>
                    <div className="grid md:grid-cols-3 gap-3">
                      <PersistedField k="djifh2Hls" label="HLS URL (.m3u8) if provided" placeholder="https://.../index.m3u8" />
                      <PersistedField k="djifh2Iframe" label="Portal/Share URL" placeholder="https://flighthub2.dji.com/..." />
                      <div className="flex items-end">
                        <button 
                          className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium transition-colors"
                          onClick={() => openNew(localStorage.getItem('djifh2Iframe') || '')}
                        >
                          Open FlightHub 2
                        </button>
                      </div>
                    </div>
                    <ProviderPlayer hlsKey="djifh2Hls" iframeKey="djifh2Iframe" name="FlightHub 2" />
                    <div className="text-xs text-gray-500">Some FlightHub 2 views may refuse iframe; use the Open button if the player doesn't render.</div>
                  </div>
                </div>
              </div>
            )}

            {/* Windy Tab */}
            {activeTab === "windy" && (
              <div className="p-0">
                <iframe 
                  title="Windy" 
                  className="w-full h-[70vh] rounded-b-lg" 
                  src={links.windy} 
                  frameBorder="0" 
                />
              </div>
            )}

            {/* Axon Links Tab */}
            {activeTab === "axon" && (
              <div className="p-4 space-y-3">
                <div className="grid md:grid-cols-3 gap-3">
                  <button 
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium transition-colors"
                    onClick={() => openNew(links.opsHub)}
                  >
                    🎯 Open Operations Hub
                  </button>
                  <button 
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium transition-colors"
                    onClick={() => openNew(links.video)}
                  >
                    📹 Open Video View
                  </button>
                  <button 
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium transition-colors"
                    onClick={() => openNew(links.evidence)}
                  >
                    📋 Open Axon Respond
                  </button>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="text-sm text-blue-800">
                    <strong>🔒 Security Note:</strong> These launchers open secure Axon pages in new tabs. Users authenticate per your agency settings (SSO/MFA). Embedding is blocked by CSP for security.
                  </div>
                </div>
              </div>
            )}

            {/* Setup/Help Tab */}
            {activeTab === "help" && (
              <div className="p-4 space-y-4">
                <div className="text-sm leading-relaxed space-y-4">
                  <div className="font-semibold text-gray-900">📦 Platform Integration Guide</div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="font-medium mb-2">🔴 VOTIX Integration</div>
                    <p className="text-gray-700 text-sm">Get HLS streaming URLs from your VOTIX dashboard. RTMP streams need to be converted to HLS for browser playback.</p>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="font-medium mb-2">🚁 FlytBase Integration</div>
                    <p className="text-gray-700 text-sm">Use shareable player URLs from FlytBase Live or Mission Control for real-time drone feeds.</p>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="font-medium mb-2">🛸 DJI FlightHub 2 Integration</div>
                    <p className="text-gray-700 text-sm">Access live feeds through FlightHub 2 portal. Some views may block iframes due to security policies.</p>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="font-medium mb-2">📡 Available API Endpoints</div>
                    <div className="space-y-1 text-gray-700 text-sm">
                      <div><code className="bg-gray-200 px-2 py-1 rounded text-xs">/api/alerts</code> - Tornado warnings across 10 states</div>
                      <div><code className="bg-gray-200 px-2 py-1 rounded text-xs">/api/live</code> - YouTube live tornado streams</div>
                      <div><code className="bg-gray-200 px-2 py-1 rounded text-xs">/api/owner</code> - Property owner lookup by address</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}