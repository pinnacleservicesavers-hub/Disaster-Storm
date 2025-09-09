// @ts-nocheck
import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

/**
 * Axon Deep-Link + Storm Map Launcher
 * -----------------------------------
 * What this gives you:
 *  - Role-based launcher with secure deep links to Axon/DroneSense (opens in new tab)
 *  - Simple mission code passthrough (stored locally for convenience)
 *  - Live storm context map (OSM base + optional RainViewer radar overlay)
 *  - Clean UI with Tailwind CSS
 */

function openNew(url: string) {
  window.open(url, "_blank", "noopener,noreferrer");
}

function PersistedField({ k, label, placeholder }: { k: string; label: string; placeholder: string }) {
  const [val, setVal] = useState(localStorage.getItem(k) || "");
  useEffect(() => {
    localStorage.setItem(k, val);
  }, [k, val]);
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

function RadarToggle() {
  const [on, setOn] = useState(localStorage.getItem("radarOn") === "1");
  useEffect(() => {
    localStorage.setItem("radarOn", on ? "1" : "0");
  }, [on]);
  return (
    <div className="flex items-center justify-between rounded-xl border border-gray-200 p-3 bg-white shadow-sm">
      <div className="space-y-1">
        <div className="font-medium">Radar Overlay</div>
        <div className="text-sm text-gray-600">RainViewer global radar tiles (no API key)</div>
      </div>
      <button 
        className={`px-4 py-2 rounded-md font-medium transition-colors ${
          on ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
        onClick={() => setOn(!on)}
      >
        {on ? "On" : "Off"}
      </button>
    </div>
  );
}

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

function QuickMap({ radarOn }: { radarOn: boolean }) {
  const [lat, setLat] = useState(() => Number(localStorage.getItem("mapLat")) || 32.5104);
  const [lng, setLng] = useState(() => Number(localStorage.getItem("mapLng")) || -84.8766);
  const [z, setZ] = useState(() => Number(localStorage.getItem("mapZoom")) || 7);

  const position = useMemo(() => [lat, lng] as [number, number], [lat, lng]);

  const handleSetView = () => {
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
            onClick={handleSetView}
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
          </MapContainer>
        </div>
      </div>
    </div>
  );
}

export default function AxonLauncher() {
  const [role, setRole] = useState(localStorage.getItem("role") || "ops");
  const [radarOn, setRadarOn] = useState(localStorage.getItem("radarOn") === "1");
  const [activeTab, setActiveTab] = useState("map");

  useEffect(() => {
    localStorage.setItem("role", role);
  }, [role]);

  const missionCode = localStorage.getItem("missionCode") || "";

  const links = {
    opsHub: "https://web.dronesense.com/ops",
    video: "https://web.dronesense.com/video",
    evidence: "https://www.evidence.com/",
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-slate-50 to-slate-100 p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Operations Hub & Respond Launcher</h1>
          <p className="text-gray-600">Deep-link into Axon/DroneSense with your org login, plus a live storm context map you can keep open in the same window.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="p-4 space-y-4">
              <div className="grid md:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-sm text-gray-600">Role</label>
                  <select 
                    className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={role} 
                    onChange={(e) => setRole(e.target.value)}
                  >
                    <option value="ops">Ops (Dispatcher)</option>
                    <option value="admin">Admin</option>
                    <option value="field">Field (Pilot/Observer)</option>
                  </select>
                </div>
                <PersistedField k="axonOrgId" label="Axon Organization ID (optional)" placeholder="e.g., your-agency-id" />
                <PersistedField k="missionCode" label="Mission Join Code (optional)" placeholder="Paste code from teammate" />
                <div className="flex items-end">
                  <button 
                    className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium transition-colors"
                    onClick={() => openNew(links.opsHub)}
                  >
                    Open Operations Hub
                  </button>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-3">
                <button 
                  className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 font-medium transition-colors"
                  onClick={() => openNew(links.video)}
                >
                  Open Video View
                </button>
                <button 
                  className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 font-medium transition-colors"
                  onClick={() => openNew(links.evidence)}
                >
                  Open Axon Respond
                </button>
                <button 
                  className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 font-medium transition-colors"
                  onClick={() => alert(`Share this mission code with authorized users: ${missionCode || "(none saved)"}`)}
                >
                  Show Mission Code
                </button>
              </div>

              <div className="rounded-xl border border-gray-200 p-3 bg-blue-50">
                <div className="text-sm text-gray-700">
                  <strong>Tip:</strong> These launchers open secure Axon pages in a new tab. Users will authenticate per your agency settings (SSO/MFA). Embedding is intentionally blocked by CSP for security.
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <RadarToggle />
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="p-4 space-y-2">
                <div className="font-medium text-gray-900">Quick Weather Links</div>
                <div className="grid grid-cols-1 gap-2">
                  <button 
                    className="text-left px-3 py-2 hover:bg-gray-50 rounded-md text-gray-700 transition-colors"
                    onClick={() => openNew("https://www.windy.com/?33.0,-85.0,6")}
                  >
                    🌪️ Open Windy (map)
                  </button>
                  <button 
                    className="text-left px-3 py-2 hover:bg-gray-50 rounded-md text-gray-700 transition-colors"
                    onClick={() => openNew("https://www.spc.noaa.gov/products/outlook/")}
                  >
                    🌩️ NOAA SPC Outlooks
                  </button>
                  <button 
                    className="text-left px-3 py-2 hover:bg-gray-50 rounded-md text-gray-700 transition-colors"
                    onClick={() => openNew("https://www.nhc.noaa.gov/")}
                  >
                    🌀 NHC (Tropical)
                  </button>
                  <button 
                    className="text-left px-3 py-2 hover:bg-gray-50 rounded-md text-gray-700 transition-colors"
                    onClick={() => openNew("https://weather.gov/")}
                  >
                    🌦️ NWS Local Forecast
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full">
          <div className="border-b border-gray-200 bg-white rounded-t-lg">
            <nav className="-mb-px flex space-x-8 px-4">
              <button
                className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === "map"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
                onClick={() => setActiveTab("map")}
              >
                🗺️ Storm Map
              </button>
              <button
                className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === "help"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
                onClick={() => setActiveTab("help")}
              >
                ❓ Setup Help
              </button>
            </nav>
          </div>
          
          <div className="bg-white rounded-b-lg border-x border-b border-gray-200">
            {activeTab === "map" && (
              <div className="p-4 space-y-4">
                <QuickMap radarOn={radarOn} />
                <div className="flex justify-end">
                  <button 
                    className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 font-medium transition-colors"
                    onClick={() => setRadarOn((v) => {
                      const nv = !v; 
                      localStorage.setItem("radarOn", nv ? "1" : "0"); 
                      return nv;
                    })}
                  >
                    {radarOn ? "🚫 Disable Radar" : "📡 Enable Radar"}
                  </button>
                </div>
              </div>
            )}
            
            {activeTab === "help" && (
              <div className="p-4">
                <div className="space-y-4 text-sm leading-relaxed">
                  <div className="font-semibold text-gray-900">📦 Install dependencies</div>
                  <pre className="bg-gray-900 text-gray-100 p-3 rounded-xl overflow-x-auto">{`# If you use Vite/React in Replit
npm i react-leaflet leaflet @radix-ui/react-slot class-variance-authority tailwind-merge
# shadcn/ui base components (already available in this environment per instructions)`}</pre>
                  
                  <div className="font-semibold text-gray-900">⚡ Add to your app</div>
                  <pre className="bg-gray-900 text-gray-100 p-3 rounded-xl overflow-x-auto">{`// App.jsx
import AxonLauncher from './AxonLauncher';

export default function App(){
  return <AxonLauncher />;
}`}</pre>
                  
                  <div className="font-semibold text-gray-900">🔒 Why link instead of embed?</div>
                  <p className="text-gray-700">
                    Axon/DroneSense video pages require authenticated access and enforce security headers (like X-Frame-Options / CSP), which block third-party iframes. Launching the official pages in a new tab keeps your workflow fast while respecting security.
                  </p>

                  <div className="font-semibold text-gray-900">🚁 Available API Endpoints</div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <ul className="space-y-1 text-gray-700">
                      <li><code className="bg-gray-200 px-2 py-1 rounded text-sm">/api/alerts</code> - Tornado warnings across 10 states</li>
                      <li><code className="bg-gray-200 px-2 py-1 rounded text-sm">/api/live</code> - YouTube live tornado streams</li>
                      <li><code className="bg-gray-200 px-2 py-1 rounded text-sm">/api/owner</code> - Property owner lookup by address</li>
                    </ul>
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