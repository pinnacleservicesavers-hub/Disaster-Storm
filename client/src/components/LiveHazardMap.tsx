import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Bell, AlertTriangle, Flame, Snowflake, Wind, Activity, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';

interface HazardDashboardData {
  success: boolean;
  timestamp: string;
  hazards: {
    hurricanes: { count: number; active: any[] };
    earthquakes: { count: number; recent: any[] };
    wildfires: { count: number; active: any[] };
    radar: { significantCells: number; maxPrecipRate: number };
    wind: { maxWindSpeed: number; extremeWindAreas: number };
    surge: { maxSurge: number; criticalStations: number };
    rivers: { floodingGauges: number; criticalGauges: number };
    smoke: { affectedAreas: number };
  };
}

interface SelectedHazard {
  type: string;
  title: string;
  severity: string;
  location: string;
  details: string;
  time: string;
  source: string;
  coordinates: [number, number];
}

// State center coordinates for fallback when NWS alerts don't have geometry
const STATE_CENTERS: Record<string, [number, number]> = {
  AL: [32.806671, -86.791130], AK: [61.370716, -152.404419], AZ: [33.729759, -111.431221],
  AR: [34.969704, -92.373123], CA: [36.116203, -119.681564], CO: [39.059811, -105.311104],
  CT: [41.597782, -72.755371], DE: [39.318523, -75.507141], FL: [27.766279, -81.686783],
  GA: [33.040619, -83.643074], HI: [21.094318, -157.498337], ID: [44.240459, -114.478828],
  IL: [40.349457, -88.986137], IN: [39.849426, -86.258278], IA: [42.011539, -93.210526],
  KS: [38.526600, -96.726486], KY: [37.668140, -84.670067], LA: [31.169546, -91.867805],
  ME: [44.693947, -69.381927], MD: [39.063946, -76.802101], MA: [42.230171, -71.530106],
  MI: [43.326618, -84.536095], MN: [45.694454, -93.900192], MS: [32.741646, -89.678696],
  MO: [38.456085, -92.288368], MT: [46.921925, -110.454353], NE: [41.125370, -98.268082],
  NV: [38.313515, -117.055374], NH: [43.452492, -71.563896], NJ: [40.298904, -74.521011],
  NM: [34.840515, -106.248482], NY: [42.165726, -74.948051], NC: [35.630066, -79.806419],
  ND: [47.528912, -99.784012], OH: [40.388783, -82.764915], OK: [35.565342, -96.928917],
  OR: [44.572021, -122.070938], PA: [40.590752, -77.209755], RI: [41.680893, -71.511780],
  SC: [33.856892, -80.945007], SD: [44.299782, -99.438828], TN: [35.747845, -86.692345],
  TX: [31.054487, -97.563461], UT: [40.150032, -111.862434], VT: [44.045876, -72.710686],
  VA: [37.769337, -78.169968], WA: [47.400902, -121.490494], WV: [38.491226, -80.954456],
  WI: [44.268543, -89.616508], WY: [42.755966, -107.302490], DC: [38.897438, -77.026817],
  PR: [18.220833, -66.590149], VI: [18.335765, -64.896335], GU: [13.444304, 144.793731],
  AS: [-14.270972, -170.132217], MP: [15.0979, 145.6739]
};

// Extract state code from area description
function extractStateFromArea(areas: string[]): string | null {
  const statePattern = /\b([A-Z]{2})\b/;
  for (const area of areas) {
    const match = area.match(statePattern);
    if (match && STATE_CENTERS[match[1]]) {
      return match[1];
    }
  }
  // Try common state names
  const areaText = areas.join(' ').toLowerCase();
  const stateNames: Record<string, string> = {
    'washington': 'WA', 'oregon': 'OR', 'california': 'CA', 'louisiana': 'LA',
    'florida': 'FL', 'texas': 'TX', 'oklahoma': 'OK', 'kansas': 'KS',
    'alaska': 'AK', 'hawaii': 'HI', 'maine': 'ME', 'new york': 'NY'
  };
  for (const [name, code] of Object.entries(stateNames)) {
    if (areaText.includes(name)) return code;
  }
  return null;
}

export default function LiveHazardMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const [selectedHazard, setSelectedHazard] = useState<SelectedHazard | null>(null);

  const { data: hazardData, isLoading } = useQuery<HazardDashboardData>({
    queryKey: ['/api/hazards/dashboard'],
    refetchInterval: 60000,
  });

  const { data: earthquakesData } = useQuery<{ earthquakes: any[] }>({
    queryKey: ['/api/hazards/earthquakes'],
    refetchInterval: 120000,
  });

  const { data: wildfiresData } = useQuery<{ wildfires: any[] }>({
    queryKey: ['/api/hazards/wildfires'],
    refetchInterval: 120000,
  });

  const { data: hurricanesData } = useQuery<{ storms: any[] }>({
    queryKey: ['/api/hazards/hurricanes'],
    refetchInterval: 120000,
  });

  const { data: nwsAlertsData } = useQuery<any[]>({
    queryKey: ['/api/weather/alerts'],
    refetchInterval: 60000,
  });

  const totalAlerts = (hazardData?.hazards?.hurricanes?.count || 0) + 
                      (hazardData?.hazards?.earthquakes?.count || 0) + 
                      (hazardData?.hazards?.wildfires?.count || 0) +
                      (nwsAlertsData?.length || 0);

  const mostSevereAlert = nwsAlertsData?.find(a => a.severity === 'Extreme') ||
                          nwsAlertsData?.find(a => a.severity === 'Severe') ||
                          (hazardData?.hazards?.hurricanes?.count ? { title: 'Hurricane Activity', severity: 'Severe' } : null) ||
                          (hazardData?.hazards?.wildfires?.count ? { title: 'Wildfire Activity', severity: 'Moderate' } : null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center: [39.8283, -98.5795],
      zoom: 4,
      zoomControl: true,
      attributionControl: false,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
    }).addTo(map);

    markersRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current || !markersRef.current) return;

    markersRef.current.clearLayers();

    const createIcon = (emoji: string, color: string, size: number = 24) => {
      return L.divIcon({
        className: 'hazard-marker',
        html: `<div style="
          font-size: ${size}px;
          filter: drop-shadow(0 0 6px ${color});
          animation: pulse 2s infinite;
        ">${emoji}</div>`,
        iconSize: [size, size],
        iconAnchor: [size/2, size/2],
      });
    };

    if (earthquakesData?.earthquakes) {
      earthquakesData.earthquakes.forEach((eq: any) => {
        // Handle both flat lat/lon and nested coordinates object
        const lat = eq.latitude ?? eq.coordinates?.latitude;
        const lon = eq.longitude ?? eq.coordinates?.longitude;
        
        if (lat && lon) {
          const magnitude = eq.magnitude || 3;
          const size = Math.min(32, Math.max(16, magnitude * 6));
          const color = magnitude >= 5 ? '#ef4444' : magnitude >= 4 ? '#f97316' : '#eab308';
          
          const marker = L.marker([lat, lon], {
            icon: createIcon('🌋', color, size),
          });
          
          marker.on('click', () => {
            setSelectedHazard({
              type: 'Earthquake',
              title: `M${magnitude.toFixed(1)} Earthquake`,
              severity: magnitude >= 5 ? 'Extreme' : magnitude >= 4 ? 'Severe' : 'Moderate',
              location: eq.location || 'Unknown location',
              details: `Depth: ${eq.depth || 'N/A'}km`,
              time: eq.time || new Date().toISOString(),
              source: 'USGS',
              coordinates: [lat, lon],
            });
          });
          
          markersRef.current?.addLayer(marker);
        }
      });
    }

    if (wildfiresData?.wildfires) {
      wildfiresData.wildfires.forEach((fire: any) => {
        if (fire.latitude && fire.longitude) {
          const confidence = fire.confidence || 50;
          const size = Math.min(28, Math.max(18, confidence / 4));
          
          const marker = L.marker([fire.latitude, fire.longitude], {
            icon: createIcon('🔥', '#f97316', size),
          });
          
          marker.on('click', () => {
            setSelectedHazard({
              type: 'Wildfire',
              title: 'Active Fire Detected',
              severity: confidence > 80 ? 'Extreme' : confidence > 50 ? 'Severe' : 'Moderate',
              location: `${fire.latitude.toFixed(3)}, ${fire.longitude.toFixed(3)}`,
              details: `Confidence: ${confidence}% | Brightness: ${fire.brightness || 'N/A'}K`,
              time: fire.acq_date || new Date().toISOString(),
              source: 'NASA FIRMS',
              coordinates: [fire.latitude, fire.longitude],
            });
          });
          
          markersRef.current?.addLayer(marker);
        }
      });
    }

    if (hurricanesData?.storms) {
      hurricanesData.storms.forEach((storm: any) => {
        if (storm.center?.latitude && storm.center?.longitude) {
          const marker = L.marker([storm.center.latitude, storm.center.longitude], {
            icon: createIcon('🌀', '#8b5cf6', 36),
          });
          
          marker.on('click', () => {
            setSelectedHazard({
              type: 'Hurricane',
              title: storm.name || 'Tropical System',
              severity: 'Extreme',
              location: `${storm.center.latitude.toFixed(1)}°N, ${Math.abs(storm.center.longitude).toFixed(1)}°W`,
              details: `Category: ${storm.category || 'TD'} | Wind: ${storm.maxWind || 'N/A'} mph`,
              time: storm.advisoryTime || new Date().toISOString(),
              source: 'NHC',
              coordinates: [storm.center.latitude, storm.center.longitude],
            });
          });
          
          markersRef.current?.addLayer(marker);
        }
      });
    }

    if (nwsAlertsData) {
      const winterAlerts = nwsAlertsData.filter((a: any) => 
        a.alertType?.toLowerCase().includes('winter') || 
        a.alertType?.toLowerCase().includes('snow') ||
        a.alertType?.toLowerCase().includes('ice') ||
        a.alertType?.toLowerCase().includes('blizzard')
      );

      const tornadoAlerts = nwsAlertsData.filter((a: any) => 
        a.alertType?.toLowerCase().includes('tornado')
      );

      winterAlerts.forEach((alert: any) => {
        let lat = alert.coordinates?.latitude;
        let lon = alert.coordinates?.longitude;
        
        // Fallback to state center if no coordinates
        if (!lat || !lon) {
          const stateCode = extractStateFromArea(alert.areas || []);
          if (stateCode && STATE_CENTERS[stateCode]) {
            [lat, lon] = STATE_CENTERS[stateCode];
          }
        }
        
        if (lat && lon) {
          const marker = L.marker([lat, lon], {
            icon: createIcon('❄️', '#06b6d4', 24),
          });
          
          marker.on('click', () => {
            setSelectedHazard({
              type: 'Winter Storm',
              title: alert.title || 'Winter Weather Alert',
              severity: alert.severity || 'Moderate',
              location: alert.areas?.join(', ') || 'Unknown area',
              details: alert.description || 'Winter weather conditions expected',
              time: alert.startTime || new Date().toISOString(),
              source: 'NWS',
              coordinates: [lat, lon],
            });
          });
          
          markersRef.current?.addLayer(marker);
        }
      });

      tornadoAlerts.forEach((alert: any) => {
        let lat = alert.coordinates?.latitude;
        let lon = alert.coordinates?.longitude;
        
        // Fallback to state center if no coordinates
        if (!lat || !lon) {
          const stateCode = extractStateFromArea(alert.areas || []);
          if (stateCode && STATE_CENTERS[stateCode]) {
            [lat, lon] = STATE_CENTERS[stateCode];
          }
        }
        
        if (lat && lon) {
          const marker = L.marker([lat, lon], {
            icon: createIcon('🌪️', '#ef4444', 28),
          });
          
          marker.on('click', () => {
            setSelectedHazard({
              type: 'Tornado',
              title: alert.title || 'Tornado Alert',
              severity: 'Extreme',
              location: alert.areas?.join(', ') || 'Unknown area',
              details: alert.description || 'Tornado activity detected',
              time: alert.startTime || new Date().toISOString(),
              source: 'NWS',
              coordinates: [lat, lon],
            });
          });
          
          markersRef.current?.addLayer(marker);
        }
      });

      // General NWS alerts (flood, storm, wind, etc.) - not winter or tornado
      const otherAlerts = nwsAlertsData.filter((a: any) => {
        const alertType = a.alertType?.toLowerCase() || '';
        const isWinter = alertType.includes('winter') || alertType.includes('snow') || 
                         alertType.includes('ice') || alertType.includes('blizzard');
        const isTornado = alertType.includes('tornado');
        return !isWinter && !isTornado;
      });

      otherAlerts.forEach((alert: any) => {
        let lat = alert.coordinates?.latitude;
        let lon = alert.coordinates?.longitude;
        
        // Fallback to state center if no coordinates
        if (!lat || !lon) {
          const stateCode = extractStateFromArea(alert.areas || []);
          if (stateCode && STATE_CENTERS[stateCode]) {
            [lat, lon] = STATE_CENTERS[stateCode];
          }
        }
        
        if (lat && lon) {
          const severity = alert.severity || 'Moderate';
          const color = severity === 'Extreme' ? '#ef4444' : severity === 'Severe' ? '#f97316' : '#eab308';
          
          const marker = L.marker([lat, lon], {
            icon: createIcon('⚠️', color, 22),
          });
          
          marker.on('click', () => {
            setSelectedHazard({
              type: 'Alert',
              title: alert.title || alert.alertType || 'Weather Alert',
              severity: severity,
              location: alert.areas?.join(', ') || 'Unknown area',
              details: alert.description || 'Weather alert in effect',
              time: alert.startTime || new Date().toISOString(),
              source: 'NWS',
              coordinates: [lat, lon],
            });
          });
          
          markersRef.current?.addLayer(marker);
        }
      });
    }

  }, [earthquakesData, wildfiresData, hurricanesData, nwsAlertsData]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Extreme': return 'bg-red-600 text-white';
      case 'Severe': return 'bg-orange-500 text-white';
      case 'Moderate': return 'bg-yellow-500 text-black';
      default: return 'bg-blue-500 text-white';
    }
  };

  return (
    <div className="relative w-full h-full min-h-[600px]" data-testid="live-hazard-map">
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.8; }
        }
        @keyframes flash {
          0%, 50%, 100% { opacity: 1; }
          25%, 75% { opacity: 0.5; }
        }
        .hazard-marker {
          background: transparent !important;
          border: none !important;
        }
      `}</style>

      <AnimatePresence>
        {totalAlerts > 0 && mostSevereAlert && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className={`absolute top-0 left-0 right-0 z-[1000] p-3 ${
              mostSevereAlert.severity === 'Extreme' ? 'bg-red-600/95' : 
              mostSevereAlert.severity === 'Severe' ? 'bg-orange-500/95' : 'bg-yellow-500/95'
            } backdrop-blur-sm border-b border-white/20`}
            data-testid="alert-banner"
          >
            <div className="flex items-center justify-center gap-3">
              <Bell className="w-6 h-6 text-white animate-pulse" style={{ animation: 'flash 1s infinite' }} />
              <span className="text-white font-bold text-lg">
                🚨 {totalAlerts} Active Alert{totalAlerts > 1 ? 's' : ''} — {mostSevereAlert.title}
              </span>
              <Badge className="bg-white/20 text-white border-white/30">
                {mostSevereAlert.severity}
              </Badge>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute top-16 left-4 z-[999] flex flex-col gap-2" data-testid="hazard-legend">
        <div className="bg-slate-900/90 backdrop-blur-sm rounded-lg p-3 border border-cyan-500/30">
          <h4 className="text-cyan-300 font-bold text-sm mb-2">Live Hazards</h4>
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <span>🌀</span>
              <span className="text-cyan-300/80">Hurricanes ({hazardData?.hazards?.hurricanes?.count || 0})</span>
            </div>
            <div className="flex items-center gap-2">
              <span>🌋</span>
              <span className="text-cyan-300/80">Earthquakes ({earthquakesData?.earthquakes?.length || 0})</span>
            </div>
            <div className="flex items-center gap-2">
              <span>🔥</span>
              <span className="text-cyan-300/80">Wildfires ({wildfiresData?.wildfires?.length || 0})</span>
            </div>
            <div className="flex items-center gap-2">
              <span>❄️</span>
              <span className="text-cyan-300/80">Winter Storms</span>
            </div>
            <div className="flex items-center gap-2">
              <span>🌪️</span>
              <span className="text-cyan-300/80">Tornadoes</span>
            </div>
            <div className="flex items-center gap-2">
              <span>⚠️</span>
              <span className="text-cyan-300/80">Alerts ({nwsAlertsData?.length || 0})</span>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {selectedHazard && (
          <motion.div
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            className="absolute top-16 right-4 z-[999] w-80"
            data-testid="hazard-details-panel"
          >
            <Card className="bg-slate-900/95 backdrop-blur-sm border-cyan-500/30">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg text-cyan-300 flex items-center gap-2">
                    {selectedHazard.type === 'Earthquake' && '🌋'}
                    {selectedHazard.type === 'Wildfire' && '🔥'}
                    {selectedHazard.type === 'Hurricane' && '🌀'}
                    {selectedHazard.type === 'Winter Storm' && '❄️'}
                    {selectedHazard.type === 'Tornado' && '🌪️'}
                    {selectedHazard.type === 'Alert' && '⚠️'}
                    {selectedHazard.title}
                  </CardTitle>
                  <button 
                    onClick={() => setSelectedHazard(null)}
                    className="text-cyan-300/50 hover:text-cyan-300"
                    data-testid="close-hazard-details"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <Badge className={getSeverityColor(selectedHazard.severity)}>
                  {selectedHazard.severity}
                </Badge>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-cyan-300/50">Location</span>
                    <span className="text-cyan-300">{selectedHazard.location}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-cyan-300/50">Details</span>
                    <span className="text-cyan-300 text-right">{selectedHazard.details}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-cyan-300/50">Time</span>
                    <span className="text-cyan-300">
                      {new Date(selectedHazard.time).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-cyan-300/50">Source</span>
                    <span className="text-cyan-300">{selectedHazard.source}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {isLoading && (
        <div className="absolute inset-0 z-[998] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
          <div className="text-cyan-400 animate-pulse text-lg">Loading hazard data...</div>
        </div>
      )}

      <div 
        ref={mapRef} 
        className="w-full h-full rounded-lg"
        style={{ minHeight: '600px', background: '#1e293b' }}
        data-testid="hazard-map-container"
      />
    </div>
  );
}
