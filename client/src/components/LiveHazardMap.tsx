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
        if (eq.coordinates?.latitude && eq.coordinates?.longitude) {
          const magnitude = eq.magnitude || 3;
          const size = Math.min(32, Math.max(16, magnitude * 6));
          const color = magnitude >= 5 ? '#ef4444' : magnitude >= 4 ? '#f97316' : '#eab308';
          
          const marker = L.marker([eq.coordinates.latitude, eq.coordinates.longitude], {
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
              coordinates: [eq.coordinates.latitude, eq.coordinates.longitude],
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
        if (alert.coordinates?.latitude && alert.coordinates?.longitude) {
          const marker = L.marker([alert.coordinates.latitude, alert.coordinates.longitude], {
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
              coordinates: [alert.coordinates.latitude, alert.coordinates.longitude],
            });
          });
          
          markersRef.current?.addLayer(marker);
        }
      });

      tornadoAlerts.forEach((alert: any) => {
        if (alert.coordinates?.latitude && alert.coordinates?.longitude) {
          const marker = L.marker([alert.coordinates.latitude, alert.coordinates.longitude], {
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
              coordinates: [alert.coordinates.latitude, alert.coordinates.longitude],
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
