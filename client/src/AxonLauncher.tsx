// @ts-nocheck
import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

/**
 * Storm Operations Hub (Multi-Platform)
 * -----------------------------------
 * Combines:
 *  - Axon/DroneSense deep links
 *  - DJI FlightHub 2
 *  - VOTIX
 *  - FlytBase
 *  - DroneDeploy Live Stream
 *  - Windy embed
 *  - Leaflet map with radar + NOAA alerts
 *  - DSP Directory for hiring pilots
 *  - Footage inbox simulation
 */

function openNew(url: string) {
  window.open(url, "_blank", "noopener,noreferrer");
}

function RadarLayer({ enabled }: { enabled: boolean }) {
  const map = useMap();
  const layerRef = useRef<any>(null);
  useEffect(() => {
    if (!enabled) {
      if (layerRef.current) { map.removeLayer(layerRef.current); layerRef.current = null; }
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
    return () => { if (layerRef.current) { map.removeLayer(layerRef.current); layerRef.current = null; } };
  }, [enabled, map]);
  return null;
}

function NOAAAlertsLayer({ enabled }: { enabled: boolean }) {
  const map = useMap();
  const layerRef = useRef<any>(null);
  useEffect(() => {
    if (!enabled) {
      if (layerRef.current) { map.removeLayer(layerRef.current); layerRef.current = null; }
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
    return () => { if (layerRef.current) { map.removeLayer(layerRef.current); layerRef.current = null; } };
  }, [enabled, map]);
  return null;
}

function QuickMap({ radarOn, alertsOn }: { radarOn: boolean; alertsOn: boolean }) {
  const [lat, setLat] = useState(32.51);
  const [lng, setLng] = useState(-84.87);
  const [z] = useState(6);
  const position = useMemo(() => [lat, lng] as [number, number], [lat, lng]);

  return (
    <div className="w-full bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="p-2">
        <div className="h-[420px] rounded-2xl overflow-hidden border border-gray-200">
          <MapContainer center={position} zoom={z} className="h-full w-full">
            <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <RadarLayer enabled={radarOn} />
            <NOAAAlertsLayer enabled={alertsOn} />
          </MapContainer>
        </div>
      </div>
    </div>
  );
}

function CompanyCard({ name, site, phone, note }: { name: string; site: string; phone?: string; note?: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="p-4 space-y-2">
        <div className="text-lg font-semibold text-gray-900">{name}</div>
        <div className="flex flex-wrap gap-2">
          <button 
            className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-md hover:bg-gray-200 font-medium transition-colors text-sm"
            onClick={() => openNew(site)}
          >
            Website
          </button>
          {phone && (
            <a href={`tel:${phone.replace(/[^\d+]/g,'')}`}>
              <button className="bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-700 font-medium transition-colors text-sm">
                Call {phone}
              </button>
            </a>
          )}
        </div>
        {note && <div className="text-sm text-gray-600">{note}</div>}
      </div>
    </div>
  );
}

function FootageInboxSimple() {
  const [items, setItems] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [isLive, setIsLive] = useState(false);
  const [filter, setFilter] = useState("all");
  const [viewMode, setViewMode] = useState("grid"); // grid or multi-view

  // Damage detection keywords for auto-tagging
  const detectDamage = (notes: string) => {
    const tags = [];
    const notesLower = notes?.toLowerCase() || "";
    
    if (notesLower.includes("tree") && (notesLower.includes("home") || notesLower.includes("roof") || notesLower.includes("house"))) {
      tags.push("tree_on_roof");
    }
    if (notesLower.includes("power") && notesLower.includes("down")) {
      tags.push("power_line_down");
    }
    if (notesLower.includes("flood") || notesLower.includes("water")) {
      tags.push("flooded");
    }
    if (notesLower.includes("structure") && notesLower.includes("damage")) {
      tags.push("structure_compromised");
    }
    if (notesLower.includes("severe") || notesLower.includes("significant")) {
      tags.push("severe_damage");
    }
    
    return tags;
  };

  // Poll /api/inbox every 5 seconds when live mode is enabled
  useEffect(() => {
    let interval: number;
    
    if (isLive) {
      interval = window.setInterval(async () => {
        try {
          const response = await fetch('/api/inbox');
          if (response.ok) {
            const liveItems = await response.json();
            // Add damage tags to each item
            const taggedItems = liveItems.map((item: any) => ({
              ...item,
              damageTags: detectDamage(item.notes)
            }));
            setItems(taggedItems);
          }
        } catch (error) {
          console.error('Failed to fetch live footage:', error);
        }
      }, 5000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLive]);

  function addItem() {
    try {
      const obj = JSON.parse(text);
      obj.id = String(Date.now());
      obj.damageTags = detectDamage(obj.notes);
      setItems([obj, ...items]);
      setText("");
      alert("New footage received.");
    } catch (e) {
      alert("Invalid JSON");
    }
  }

  // Filter items based on damage tags
  const filteredItems = filter === "all" ? items : items.filter(item => 
    item.damageTags && item.damageTags.includes(filter)
  );

  const getDamageTagBadge = (tag: string) => {
    const tagStyles = {
      tree_on_roof: "bg-orange-100 text-orange-800",
      power_line_down: "bg-red-100 text-red-800", 
      flooded: "bg-blue-100 text-blue-800",
      structure_compromised: "bg-purple-100 text-purple-800",
      severe_damage: "bg-red-100 text-red-900"
    };
    
    const tagLabels = {
      tree_on_roof: "🌳 Tree on Roof",
      power_line_down: "⚡ Power Line Down",
      flooded: "🌊 Flooded",
      structure_compromised: "🏠 Structure Damage", 
      severe_damage: "⚠️ Severe Damage"
    };
    
    return (
      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${tagStyles[tag] || "bg-gray-100 text-gray-800"}`}>
        {tagLabels[tag] || tag}
      </span>
    );
  };

  if (viewMode === "multi-view" && filteredItems.length > 0) {
    return (
      <div className="space-y-4">
        <div className="flex gap-2 items-center">
          <button 
            className="bg-gray-600 text-white px-3 py-1 rounded-md text-sm"
            onClick={() => setViewMode("grid")}
          >
            ← Back to Grid
          </button>
          <span className="text-sm text-gray-600">Multi-View Live Feeds</span>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {filteredItems.slice(0, 4).map(item => (
            <div key={item.id} className="bg-black rounded-lg aspect-video relative">
              <div className="absolute top-2 left-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs">
                {item.provider}
              </div>
              {item.mediaUrl ? (
                <iframe 
                  src={item.mediaUrl} 
                  className="w-full h-full rounded-lg"
                  allow="autoplay"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-white">
                  No Live Feed
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Live Mode & Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <button 
          className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
            isLive ? "bg-green-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
          onClick={() => setIsLive(!isLive)}
        >
          {isLive ? "🔴 Live" : "▶️ Go Live"}
        </button>
        
        <select 
          className="border border-gray-300 rounded-md px-2 py-1 text-sm"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">All Damage</option>
          <option value="tree_on_roof">Trees on Roofs</option>
          <option value="power_line_down">Power Lines Down</option>
          <option value="flooded">Flooded Areas</option>
          <option value="structure_compromised">Structure Damage</option>
          <option value="severe_damage">Severe Damage</option>
        </select>

        {filteredItems.length > 0 && (
          <button 
            className="bg-blue-600 text-white px-3 py-1 rounded-md text-sm"
            onClick={() => setViewMode("multi-view")}
          >
            📺 Multi-View ({filteredItems.length})
          </button>
        )}
      </div>

      {/* Manual Test Input */}
      {!isLive && (
        <>
          <textarea 
            className="w-full h-28 border border-gray-300 rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
            value={text} 
            onChange={(e) => setText(e.target.value)} 
            placeholder='{"provider":"DroneUp","timestamp":"2025-09-08T23:00:00Z","mediaUrl":"https://.../index.m3u8","lat":32.51,"lon":-84.87,"notes":"Tree on home"}' 
          />
          <div className="flex gap-2">
            <button 
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium transition-colors"
              onClick={addItem}
            >
              Add
            </button>
          </div>
        </>
      )}

      {/* Live Status */}
      {isLive && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="text-sm text-green-800">
            🔴 Live polling /api/inbox every 5 seconds • {filteredItems.length} items
          </div>
        </div>
      )}

      {/* Footage Grid */}
      <div className="grid md:grid-cols-2 gap-3">
        {filteredItems.map(it => (
          <div key={it.id} className="bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="p-3 space-y-2">
              <div className="font-medium text-gray-900">{it.provider} — {it.timestamp}</div>
              <div className="text-sm text-gray-600">📍 GPS: {it.lat}, {it.lon}</div>
              {it.address && (
                <div className="text-sm text-gray-500">📍 {it.address}</div>
              )}
              
              {/* Damage Tags */}
              {it.damageTags && it.damageTags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {it.damageTags.map((tag: string, idx: number) => (
                    <span key={idx}>{getDamageTagBadge(tag)}</span>
                  ))}
                </div>
              )}
              
              {it.mediaUrl && (
                <a className="inline-block" href={it.mediaUrl} target="_blank" rel="noreferrer">
                  <button className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-md hover:bg-gray-200 font-medium transition-colors text-sm">
                    Open Media
                  </button>
                </a>
              )}
              {it.notes && <div className="text-sm text-gray-500">{it.notes}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
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
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="p-4 space-y-2">
          <div className="font-semibold text-gray-900">📥 Live Footage Inbox</div>
          <p className="text-sm text-gray-600">Real-time footage from DSP contractors with auto damage detection. Toggle "Go Live" to poll /api/inbox, or manually add test data.</p>
          <FootageInboxSimple />
        </div>
      </div>
    </div>
  );
}

export default function StormOpsHub() {
  const [radarOn, setRadarOn] = useState(true);
  const [alertsOn, setAlertsOn] = useState(true);
  const [activeTab, setActiveTab] = useState("map");

  const links = {
    axonOps: "https://web.dronesense.com/ops",
    axonVideo: "https://web.dronesense.com/video",
    axonRespond: "https://www.evidence.com/",
    dji: "https://flighthub2.dji.com/",
    votix: "https://platform.votix.com/",
    flytbase: "https://my.flytbase.com/",
    dronedeploy: "https://www.dronedeploy.com/live/"
  };

  const tabs = [
    { id: "map", label: "🗺️ Storm Map" },
    { id: "axon", label: "🚁 Axon/DroneSense" },
    { id: "dji", label: "🛸 DJI FlightHub 2" },
    { id: "votix", label: "🔴 VOTIX" },
    { id: "flyt", label: "🚁 FlytBase" },
    { id: "deploy", label: "📹 DroneDeploy" },
    { id: "windy", label: "🌪️ Windy" },
    { id: "dsps", label: "👥 Hire Pilots (DSPs)" }
  ];

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-slate-50 to-slate-100 p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">Storm Operations Hub</h1>
          <p className="text-gray-600">Pick any platform to view live drone feeds + storm layers.</p>
        </div>

        {/* Custom Tabs */}
        <div className="w-full">
          <div className="border-b border-gray-200 bg-white rounded-t-lg">
            <nav className="-mb-px flex space-x-8 px-4 overflow-x-auto">
              {tabs.map(tab => (
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
          
          <div className="bg-white rounded-b-lg border-x border-b border-gray-200">
            {/* Storm Map Tab */}
            {activeTab === "map" && (
              <div className="p-4">
                <QuickMap radarOn={radarOn} alertsOn={alertsOn} />
                <div className="flex gap-2 justify-end mt-2">
                  <button 
                    className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 font-medium transition-colors"
                    onClick={() => setRadarOn(!radarOn)}
                  >
                    {radarOn ? "🚫 Disable Radar" : "📡 Enable Radar"}
                  </button>
                  <button 
                    className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 font-medium transition-colors"
                    onClick={() => setAlertsOn(!alertsOn)}
                  >
                    {alertsOn ? "🚫 Disable Alerts" : "⚠️ Enable Alerts"}
                  </button>
                </div>
              </div>
            )}

            {/* Axon/DroneSense Tab */}
            {activeTab === "axon" && (
              <div className="p-4 space-y-2">
                <button 
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium transition-colors mr-2"
                  onClick={() => openNew(links.axonOps)}
                >
                  🎯 Open Operations Hub
                </button>
                <button 
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium transition-colors mr-2"
                  onClick={() => openNew(links.axonVideo)}
                >
                  📹 Open Video View
                </button>
                <button 
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium transition-colors"
                  onClick={() => openNew(links.axonRespond)}
                >
                  📋 Open Axon Respond
                </button>
              </div>
            )}

            {/* DJI FlightHub 2 Tab */}
            {activeTab === "dji" && (
              <div className="p-4">
                <button 
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium transition-colors"
                  onClick={() => openNew(links.dji)}
                >
                  🛸 Open DJI FlightHub 2
                </button>
              </div>
            )}

            {/* VOTIX Tab */}
            {activeTab === "votix" && (
              <div className="p-4">
                <button 
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium transition-colors"
                  onClick={() => openNew(links.votix)}
                >
                  🔴 Open VOTIX
                </button>
              </div>
            )}

            {/* FlytBase Tab */}
            {activeTab === "flyt" && (
              <div className="p-4">
                <button 
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium transition-colors"
                  onClick={() => openNew(links.flytbase)}
                >
                  🚁 Open FlytBase
                </button>
              </div>
            )}

            {/* DroneDeploy Tab */}
            {activeTab === "deploy" && (
              <div className="p-4">
                <button 
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium transition-colors"
                  onClick={() => openNew(links.dronedeploy)}
                >
                  📹 Open DroneDeploy Live Stream
                </button>
              </div>
            )}

            {/* Windy Tab */}
            {activeTab === "windy" && (
              <div className="p-0">
                <iframe 
                  title="Windy Embed" 
                  width="100%" 
                  height="500" 
                  src="https://embed.windy.com/embed2.html?lat=33&lon=-85&zoom=5&level=surface&overlay=wind" 
                  frameBorder="0"
                  className="rounded-b-lg"
                />
              </div>
            )}

            {/* DSP Directory Tab */}
            {activeTab === "dsps" && (
              <div className="p-4">
                <DSPDirectory />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}