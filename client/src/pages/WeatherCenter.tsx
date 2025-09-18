import { useState, useEffect } from 'react';
import { useQuery, useQueries } from '@tanstack/react-query';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  CloudRain, 
  Zap, 
  Satellite, 
  Radar, 
  Wind, 
  Eye,
  Play,
  Pause,
  RefreshCw,
  MapPin,
  AlertTriangle,
  Share,
  ThermometerSun,
  Waves,
  Gauge,
  Activity,
  TrendingUp,
  Clock,
  Globe,
  Database,
  Signal,
  CloudSnow,
  Sun,
  CloudLightning
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FadeIn, 
  SlideIn, 
  StaggerContainer, 
  StaggerItem, 
  HoverLift, 
  PulseAlert,
  LoadingSpinner,
  AnimatedProgress,
  CountUp,
  RainEffect,
  LightningFlash
} from '@/components/ui/animations';
import type { WeatherAlert } from '@shared/schema';
import AIAssistant from '@/components/AIAssistant';

// API response interfaces that extend shared schema types
interface SPCData {
  day: number;
  risk: string;
  validTime: string;
  geometry?: any;
}

interface NHCStorm {
  id: string;
  name: string;
  status: string;
  latitude: number;
  longitude: number;
  maxWinds: number;
  minPressure: number;
  movement: string;
  geometry?: any;
}

interface OceanData {
  seaSurfaceTemperature: Array<{
    latitude: number;
    longitude: number;
    temperature: number;
    source: 'satellite' | 'buoy' | 'ship';
    timestamp: Date;
    stationId: string;
  }>;
  buoys: Array<{
    stationId: string;
    name: string;
    latitude: number;
    longitude: number;
    waterDepth: number;
    measurements: {
      waterTemperature?: number;
      airTemperature?: number;
      windSpeed?: number;
      windDirection?: number;
      significantWaveHeight?: number;
      peakWavePeriod?: number;
      meanWaveDirection?: number;
      atmosphericPressure?: number;
    };
    timestamp: Date;
    status: 'active' | 'inactive' | 'maintenance';
  }>;
  lastUpdated: Date;
}

interface WaveData {
  significantHeight: number;
  peakPeriod: number;
  direction: number;
  timestamp: Date;
  location: {
    latitude: number;
    longitude: number;
  };
  source: 'buoy' | 'satellite' | 'model';
  stationId: string;
  stationName: string;
}

export default function WeatherCenter() {
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds
  const [selectedTab, setSelectedTab] = useState('overview');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Get user's GPS location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude
          });
        },
        (error) => {
          console.warn('Location access denied, using default location');
          setUserLocation({ lat: 33.7490, lon: -84.3880 }); // Atlanta default
        }
      );
    }
  }, []);

  // Weather data queries using React Query
  const weatherQueries = useQueries({
    queries: [
      {
        queryKey: ['/api/weather/alerts', userLocation?.lat, userLocation?.lon],
        queryFn: async () => {
          if (!userLocation) return [];
          const response = await fetch(`/api/weather/alerts?lat=${userLocation.lat}&lon=${userLocation.lon}`);
          if (!response.ok) throw new Error('Failed to fetch alerts');
          return response.json();
        },
        enabled: !!userLocation,
        refetchInterval: autoRefresh ? refreshInterval : false,
      },
      {
        queryKey: ['/api/weather/spc'],
        queryFn: async () => {
          const response = await fetch('/api/weather/spc');
          if (!response.ok) throw new Error('Failed to fetch SPC data');
          return response.json();
        },
        refetchInterval: autoRefresh ? refreshInterval : false,
      },
      {
        queryKey: ['/api/weather/nhc'],
        queryFn: async () => {
          const response = await fetch('/api/weather/nhc');
          if (!response.ok) throw new Error('Failed to fetch NHC data');
          return response.json();
        },
        refetchInterval: autoRefresh ? refreshInterval : false,
      },
      {
        queryKey: ['/api/weather/buoys'],
        queryFn: async () => {
          const response = await fetch('/api/weather/buoys');
          if (!response.ok) throw new Error('Failed to fetch buoy data');
          return response.json();
        },
        refetchInterval: autoRefresh ? refreshInterval : false,
      },
      {
        queryKey: ['/api/weather/waves'],
        queryFn: async () => {
          const response = await fetch('/api/weather/waves');
          if (!response.ok) throw new Error('Failed to fetch wave data');
          return response.json();
        },
        refetchInterval: autoRefresh ? refreshInterval : false,
      },
      {
        queryKey: ['/api/weather/ocean'],
        queryFn: async () => {
          const response = await fetch('/api/weather/ocean');
          if (!response.ok) throw new Error('Failed to fetch ocean data');
          return response.json();
        },
        refetchInterval: autoRefresh ? refreshInterval : false,
      },
    ],
  });

  const [alertsQuery, spcQuery, nhcQuery, buoysQuery, wavesQuery, oceanQuery] = weatherQueries;
  const alerts: WeatherAlert[] = alertsQuery.data || [];
  const spcData: SPCData[] = spcQuery.data || [];
  const nhcData: { storms: NHCStorm[] } = nhcQuery.data || { storms: [] };
  const buoyData: OceanData['buoys'] = buoysQuery.data || [];
  const waveData: WaveData[] = wavesQuery.data || [];
  const oceanData: OceanData = oceanQuery.data || { seaSurfaceTemperature: [], buoys: [], lastUpdated: new Date() };

  const isLoading = weatherQueries.some(q => q.isLoading);
  const hasError = weatherQueries.some(q => q.error);

  // Share link functionality
  const handleShareLink = async () => {
    const url = makeShareUrl();
    try {
      await navigator.clipboard.writeText(url);
      alert("Share link copied!");
    } catch {
      // Fallback if clipboard API blocked
      prompt("Copy this link:", url);
    }
  };

  const makeShareUrl = () => {
    const url = new URL(window.location.href.split("?")[0]);
    
    // Add user location if available
    if (userLocation) {
      url.searchParams.set("lat", userLocation.lat.toFixed(4));
      url.searchParams.set("lon", userLocation.lon.toFixed(4));
    }
    
    // Add refresh settings
    url.searchParams.set("autoRefresh", autoRefresh.toString());
    url.searchParams.set("refreshInterval", refreshInterval.toString());
    
    return url.toString();
  };

  const applyStateFromUrl = () => {
    const params = new URLSearchParams(window.location.search);
    
    // Restore location
    const lat = parseFloat(params.get("lat") || "");
    const lon = parseFloat(params.get("lon") || "");
    if (Number.isFinite(lat) && Number.isFinite(lon)) {
      setUserLocation({ lat, lon });
    }
    
    // Restore refresh settings
    const autoRefreshParam = params.get("autoRefresh");
    if (autoRefreshParam !== null) {
      setAutoRefresh(autoRefreshParam === "true");
    }
    
    const refreshIntervalParam = params.get("refreshInterval");
    if (refreshIntervalParam) {
      const interval = parseInt(refreshIntervalParam, 10);
      if (Number.isFinite(interval)) {
        setRefreshInterval(interval);
      }
    }
  };

  // Apply URL state on component mount
  useEffect(() => {
    applyStateFromUrl();
  }, []);

  // GPS location component for map
  function LocationMarker() {
    const map = useMap();
    
    useEffect(() => {
      if (userLocation) {
        map.setView([userLocation.lat, userLocation.lon], 8);
      }
    }, [map, userLocation]);

    return null;
  }

  // Weather effects based on current conditions
  const hasActiveStorms = nhcData.storms.length > 0;
  const hasAlerts = alerts.length > 0;
  const hasSevereAlerts = alerts.some(alert => alert.severity === 'severe' || alert.severity === 'extreme');

  // Enhanced metrics for KPI display
  const totalAlerts = alerts.length;
  const severeAlerts = alerts.filter(a => a.severity === 'severe' || a.severity === 'extreme').length;
  const activeStorms = nhcData.storms.length;
  const activeBuoys = buoyData.filter(b => b.status === 'active').length;
  const avgWaveHeight = waveData.length > 0 ? waveData.reduce((sum, w) => sum + w.significantHeight, 0) / waveData.length : 0;
  const avgSeaTemp = oceanData.seaSurfaceTemperature.length > 0 
    ? oceanData.seaSurfaceTemperature.reduce((sum, sst) => sum + sst.temperature, 0) / oceanData.seaSurfaceTemperature.length 
    : 0;

  return (
    <div className={`min-h-screen transition-all duration-500 ${
      isFullscreen 
        ? 'fixed inset-0 z-50 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900' 
        : 'bg-gradient-to-br from-blue-50 via-white to-blue-100'
    } relative overflow-hidden`}>
      {/* Enhanced Weather Effects */}
      {hasActiveStorms && <RainEffect intensity={hasSevereAlerts ? "heavy" : "normal"} />}
      {hasSevereAlerts && <LightningFlash />}
      
      {/* Atmospheric Particles */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-blue-300/30 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [-20, 20],
              opacity: [0.3, 0.7, 0.3],
              scale: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>
      
      <div className="container mx-auto p-6 space-y-8 relative z-10">
        {/* Enhanced Header */}
        <FadeIn>
          <div className="storm-card rounded-xl p-6 backdrop-blur-sm border border-blue-200/50">
            <div className="flex items-center justify-between">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className="flex items-center space-x-4">
                  <motion.div
                    animate={{ 
                      rotate: hasActiveStorms ? [0, 360] : 0,
                      scale: hasAlerts ? [1, 1.1, 1] : 1
                    }}
                    transition={{ 
                      rotate: { duration: 4, repeat: hasActiveStorms ? Infinity : 0 },
                      scale: { duration: 2, repeat: Infinity }
                    }}
                    className="relative"
                  >
                    <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg">
                      <CloudLightning className="w-8 h-8 text-white" />
                    </div>
                    {hasAlerts && (
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                        className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white"
                      />
                    )}
                  </motion.div>
                  
                  <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent" data-testid="weather-center-title">
                      Weather Operations Center
                    </h1>
                    <motion.p 
                      className="text-blue-600/80 text-lg font-medium flex items-center mt-1"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      <Signal className="w-4 h-4 mr-2 animate-pulse" />
                      Live government weather data and emergency monitoring
                    </motion.p>
                  </div>
                </div>
              </motion.div>
              
              {/* Enhanced Controls */}
              <SlideIn direction="right" delay={0.2}>
                <div className="flex items-center gap-4">
                  {/* Fullscreen Toggle */}
                  <HoverLift>
                    <motion.button
                      onClick={() => setIsFullscreen(!isFullscreen)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="p-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
                      data-testid="button-fullscreen-toggle"
                    >
                      <Globe className="w-5 h-5" />
                    </motion.button>
                  </HoverLift>
                  
                  <div className="flex items-center gap-2 bg-white/50 backdrop-blur-sm rounded-lg p-2 border border-white/30">
                    <HoverLift>
                      <Button
                        variant={autoRefresh ? "default" : "outline"}
                        size="sm"
                        onClick={() => setAutoRefresh(!autoRefresh)}
                        data-testid="button-auto-refresh"
                        className={`transition-all duration-300 ${
                          autoRefresh 
                            ? 'bg-green-500 hover:bg-green-600 text-white shadow-lg' 
                            : 'hover:bg-white/80'
                        }`}
                      >
                        <motion.div
                          animate={{ rotate: autoRefresh ? 360 : 0 }}
                          transition={{ duration: 2, repeat: autoRefresh ? Infinity : 0 }}
                        >
                          {autoRefresh ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        </motion.div>
                        <span className="ml-2">{autoRefresh ? 'Live' : 'Paused'}</span>
                      </Button>
                    </HoverLift>
                    
                    <HoverLift>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleShareLink}
                        data-testid="button-share-link"
                        className="hover:bg-blue-50 border-blue-200"
                      >
                        <Share className="w-4 h-4 mr-2" />
                        Share
                      </Button>
                    </HoverLift>
                    
                    <select 
                      value={refreshInterval} 
                      onChange={(e) => setRefreshInterval(Number(e.target.value))}
                      className="px-3 py-1.5 border border-blue-200 rounded-lg bg-white/80 backdrop-blur-sm hover:bg-white transition-colors text-sm font-medium"
                      data-testid="select-refresh-interval"
                    >
                      <option value={10000}>10s</option>
                      <option value={30000}>30s</option>
                      <option value={60000}>1m</option>
                      <option value={300000}>5m</option>
                    </select>
                  </div>
                  
                  {userLocation && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.4, type: "spring" }}
                    >
                      <Badge 
                        variant="outline" 
                        data-testid="badge-location"
                        className="bg-white/60 backdrop-blur-sm border-blue-200 text-blue-700 px-3 py-1"
                      >
                        <MapPin className="w-3 h-3 mr-1 animate-pulse" />
                        {userLocation.lat.toFixed(2)}, {userLocation.lon.toFixed(2)}
                      </Badge>
                    </motion.div>
                  )}
                </div>
              </SlideIn>
            </div>
          </div>
        </FadeIn>

        {/* AI Assistant - Weather Center Context */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex justify-center mb-8"
        >
          <AIAssistant
            portalContext="weather-center"
            userLocation={userLocation ? { lat: userLocation.lat, lng: userLocation.lon } : { lat: 33.7490, lng: -84.3880 }}
            className="max-w-lg w-full"
          />
        </motion.div>

        {/* Enhanced KPI Dashboard */}
        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, staggerChildren: 0.1 }}
        >
          <motion.div 
            variants={{ hidden: { opacity: 0, scale: 0.8 }, visible: { opacity: 1, scale: 1 } }}
            className="relative overflow-hidden"
          >
            <Card className="h-full min-h-[120px] bg-gradient-to-br from-red-50 to-red-100 border-red-200 hover:shadow-lg transition-all duration-300">
              <CardContent className="p-5 text-center flex flex-col justify-center h-full">
                <AlertTriangle className={`w-8 h-8 mx-auto mb-3 ${severeAlerts > 0 ? 'text-red-500 animate-bounce' : 'text-red-400'}`} />
                <div className="text-2xl font-bold text-red-600 mb-2" data-testid="kpi-total-alerts">
                  <CountUp end={totalAlerts} duration={1.5} />
                </div>
                <div className="text-sm text-red-600/80 font-medium leading-tight">Active Alerts</div>
                {severeAlerts > 0 && (
                  <motion.div 
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"
                  />
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={{ hidden: { opacity: 0, scale: 0.8 }, visible: { opacity: 1, scale: 1 } }}>
            <Card className="h-full min-h-[120px] bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-lg transition-all duration-300">
              <CardContent className="p-5 text-center flex flex-col justify-center h-full">
                <Eye className={`w-8 h-8 mx-auto mb-3 ${activeStorms > 0 ? 'text-purple-500 animate-spin' : 'text-purple-400'}`} style={{ animationDuration: '3s' }} />
                <div className="text-2xl font-bold text-purple-600 mb-2" data-testid="kpi-active-storms">
                  <CountUp end={activeStorms} duration={1.5} />
                </div>
                <div className="text-sm text-purple-600/80 font-medium leading-tight">Storm Systems</div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={{ hidden: { opacity: 0, scale: 0.8 }, visible: { opacity: 1, scale: 1 } }}>
            <Card className="h-full min-h-[120px] bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-all duration-300">
              <CardContent className="p-5 text-center flex flex-col justify-center h-full">
                <Waves className="w-8 h-8 mx-auto mb-3 text-blue-500" />
                <div className="text-2xl font-bold text-blue-600 mb-2" data-testid="kpi-avg-wave-height">
                  <CountUp end={avgWaveHeight} duration={1.5} suffix="m" />
                </div>
                <div className="text-sm text-blue-600/80 font-medium leading-tight">Wave Height</div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={{ hidden: { opacity: 0, scale: 0.8 }, visible: { opacity: 1, scale: 1 } }}>
            <Card className="h-full min-h-[120px] bg-gradient-to-br from-cyan-50 to-cyan-100 border-cyan-200 hover:shadow-lg transition-all duration-300">
              <CardContent className="p-5 text-center flex flex-col justify-center h-full">
                <ThermometerSun className="w-8 h-8 mx-auto mb-3 text-cyan-500" />
                <div className="text-2xl font-bold text-cyan-600 mb-2" data-testid="kpi-avg-sea-temp">
                  <CountUp end={avgSeaTemp} duration={1.5} suffix="°C" />
                </div>
                <div className="text-sm text-cyan-600/80 font-medium leading-tight">Sea Temp</div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={{ hidden: { opacity: 0, scale: 0.8 }, visible: { opacity: 1, scale: 1 } }}>
            <Card className="h-full min-h-[120px] bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-lg transition-all duration-300">
              <CardContent className="p-5 text-center flex flex-col justify-center h-full">
                <Activity className={`w-8 h-8 mx-auto mb-3 ${activeBuoys > 0 ? 'text-green-500 animate-pulse' : 'text-green-400'}`} />
                <div className="text-2xl font-bold text-green-600 mb-2" data-testid="kpi-active-buoys">
                  <CountUp end={activeBuoys} duration={1.5} />
                </div>
                <div className="text-sm text-green-600/80 font-medium leading-tight">Active Buoys</div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={{ hidden: { opacity: 0, scale: 0.8 }, visible: { opacity: 1, scale: 1 } }}>
            <Card className="h-full min-h-[120px] bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200 hover:shadow-lg transition-all duration-300">
              <CardContent className="p-5 text-center flex flex-col justify-center h-full">
                <Signal className="w-8 h-8 mx-auto mb-3 text-yellow-500 animate-ping" style={{ animationDuration: '2s' }} />
                <div className="text-2xl font-bold text-yellow-600 mb-2" data-testid="kpi-data-quality">
                  <CountUp end={97} duration={1.5} suffix="%" />
                </div>
                <div className="text-sm text-yellow-600/80 font-medium leading-tight">Data Quality</div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Enhanced Status indicators */}
        <StaggerContainer className="flex flex-wrap gap-3">
          <StaggerItem>
            <motion.div
              whileHover={{ scale: 1.05, y: -2 }}
              className="hover-lift"
            >
              <Badge 
                variant={isLoading ? "secondary" : "default"} 
                data-testid="badge-status"
                className={`px-4 py-2 text-sm font-medium ${
                  isLoading 
                    ? 'bg-yellow-100 text-yellow-800 border-yellow-200' 
                    : 'bg-green-100 text-green-800 border-green-200 animate-pulse'
                }`}
              >
                <motion.div
                  animate={{ rotate: isLoading ? 360 : 0 }}
                  transition={{ duration: 1, repeat: isLoading ? Infinity : 0 }}
                  className="mr-2"
                >
                  <RefreshCw className="w-3 h-3" />
                </motion.div>
                {isLoading ? 'Syncing Data...' : 'Live Data'}
              </Badge>
            </motion.div>
          </StaggerItem>
          
          {hasError && (
            <StaggerItem>
              <PulseAlert intensity="strong">
                <Badge 
                  variant="destructive" 
                  data-testid="badge-error"
                  className="px-4 py-2 text-sm font-medium bg-red-100 text-red-800 border-red-200"
                >
                  <AlertTriangle className="w-3 h-3 mr-2" />
                  Connection Issues
                </Badge>
              </PulseAlert>
            </StaggerItem>
          )}
          
          <StaggerItem>
            <HoverLift>
              <Badge 
                variant="outline" 
                data-testid="badge-alerts-count"
                className={`px-4 py-2 text-sm font-medium ${
                  alerts.length > 0 
                    ? 'bg-orange-50 text-orange-700 border-orange-200' 
                    : 'bg-gray-50 text-gray-600 border-gray-200'
                }`}
              >
                <AlertTriangle className={`w-3 h-3 mr-2 ${alerts.length > 0 ? 'animate-pulse' : ''}`} />
                <CountUp end={alerts.length} /> Active Alerts
              </Badge>
            </HoverLift>
          </StaggerItem>
          
          <StaggerItem>
            <HoverLift>
              <Badge 
                variant="outline" 
                data-testid="badge-storms-count"
                className={`px-4 py-2 text-sm font-medium ${
                  nhcData.storms.length > 0 
                    ? 'bg-red-50 text-red-700 border-red-200 animate-pulse' 
                    : 'bg-gray-50 text-gray-600 border-gray-200'
                }`}
              >
                <Wind className={`w-3 h-3 mr-2 ${nhcData.storms.length > 0 ? 'animate-spin' : ''}`} />
                <CountUp end={nhcData.storms.length} /> Active Storms
              </Badge>
            </HoverLift>
          </StaggerItem>
          
          <StaggerItem>
            <HoverLift>
              <Badge 
                variant="outline" 
                data-testid="badge-buoys-count"
                className="px-4 py-2 text-sm font-medium bg-blue-50 text-blue-700 border-blue-200"
              >
                <Waves className="w-3 h-3 mr-2" />
                <CountUp end={buoyData.length} /> Live Buoys
              </Badge>
            </HoverLift>
          </StaggerItem>
          
          <StaggerItem>
            <HoverLift>
              <Badge 
                variant="outline" 
                data-testid="badge-waves-count"
                className="px-4 py-2 text-sm font-medium bg-cyan-50 text-cyan-700 border-cyan-200"
              >
                <Activity className="w-3 h-3 mr-2" />
                <CountUp end={waveData.length} /> Wave Stations
              </Badge>
            </HoverLift>
          </StaggerItem>

          {/* System status indicator */}
          <StaggerItem>
            <HoverLift>
              <Badge 
                variant="outline" 
                data-testid="badge-system-status"
                className="px-4 py-2 text-sm font-medium bg-green-50 text-green-700 border-green-200"
              >
                <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse" />
                All Systems Operational
              </Badge>
            </HoverLift>
          </StaggerItem>
        </StaggerContainer>

        {/* Enhanced Main Weather Tabs */}
        <FadeIn delay={0.4}>
          <Tabs defaultValue="overview" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <TabsList 
                className="grid w-full grid-cols-8 bg-white/70 backdrop-blur-sm border border-blue-200/50 p-1 rounded-xl" 
                data-testid="tabs-weather"
              >
                <HoverLift>
                  <TabsTrigger value="overview" data-testid="tab-overview" className="rounded-lg transition-all duration-300">
                    <Eye className="w-4 h-4 mr-2" />
                    Overview
                  </TabsTrigger>
                </HoverLift>
                <HoverLift>
                  <TabsTrigger value="alerts" data-testid="tab-alerts" className="rounded-lg transition-all duration-300">
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Alerts
                  </TabsTrigger>
                </HoverLift>
                <HoverLift>
                  <TabsTrigger value="radar" data-testid="tab-radar" className="rounded-lg transition-all duration-300">
                    <Radar className="w-4 h-4 mr-2" />
                    Radar+Lightning
                  </TabsTrigger>
                </HoverLift>
                <HoverLift>
                  <TabsTrigger value="satellite" data-testid="tab-satellite" className="rounded-lg transition-all duration-300">
                    <Satellite className="w-4 h-4 mr-2" />
                    Satellite+MRMS
                  </TabsTrigger>
                </HoverLift>
                <HoverLift>
                  <TabsTrigger value="hurricanes" data-testid="tab-hurricanes" className="rounded-lg transition-all duration-300">
                    <Wind className="w-4 h-4 mr-2" />
                    Hurricanes+SPC
                  </TabsTrigger>
                </HoverLift>
                <HoverLift>
                  <TabsTrigger value="models" data-testid="tab-models" className="rounded-lg transition-all duration-300">
                    <CloudRain className="w-4 h-4 mr-2" />
                    Models+External
                  </TabsTrigger>
                </HoverLift>
                <HoverLift>
                  <button
                    onClick={() => window.open('https://www.radaromega.com/', '_blank')}
                    className="inline-flex items-center justify-center whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-300 hover:bg-blue-100 hover:text-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    data-testid="tab-omega-radar"
                  >
                    <Radar className="w-4 h-4 mr-2" />
                    Omega Radar
                  </button>
                </HoverLift>
                <HoverLift>
                  <button
                    onClick={() => window.open('https://www.windy.com/?32.607,-84.937,5', '_blank')}
                    className="inline-flex items-center justify-center whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-300 hover:bg-blue-100 hover:text-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    data-testid="tab-windy"
                  >
                    <Wind className="w-4 h-4 mr-2" />
                    Windy
                  </button>
                </HoverLift>
              </TabsList>
            </motion.div>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Live Weather Map */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle data-testid="card-title-live-map">🗺️ Live Weather Map</CardTitle>
                <CardDescription>
                  Real-time weather alerts, storm outlooks, and hurricane tracking
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-96 rounded-lg overflow-hidden border" data-testid="map-container-overview">
                  {userLocation && (
                    <MapContainer
                      center={[userLocation.lat, userLocation.lon]}
                      zoom={8}
                      style={{ height: '100%', width: '100%' }}
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      <LocationMarker />
                      
                      {/* NWS Alerts */}
                      {alerts.map((alert, index) => (
                        (alert as any).geometry ? (
                          <GeoJSON
                            key={`alert-${index}`}
                            data={(alert as any).geometry}
                            style={{
                              color: alert.severity === 'extreme' ? '#dc2626' :
                                     alert.severity === 'severe' ? '#ea580c' : '#ca8a04',
                              weight: 2,
                              opacity: 0.8,
                              fillOpacity: 0.3
                            }}
                            onEachFeature={(feature, layer) => {
                              layer.bindPopup(`
                                <div class="font-medium">${alert.title}</div>
                                <div class="text-sm text-gray-600">${alert.alertType}</div>
                                <div class="text-xs mt-1">Severity: ${alert.severity}</div>
                              `);
                            }}
                          />
                        ) : null
                      ))}
                      
                      {/* SPC Outlooks */}
                      {spcData.map((outlook, index) => (
                        outlook.geometry ? (
                          <GeoJSON
                            key={`spc-${index}`}
                            data={outlook.geometry}
                            style={{
                              color: outlook.risk === 'high' ? '#dc2626' :
                                     outlook.risk === 'enhanced' ? '#ea580c' :
                                     outlook.risk === 'slight' ? '#ca8a04' :
                                     outlook.risk === 'marginal' ? '#16a34a' : '#6b7280',
                              weight: 2,
                              opacity: 0.7,
                              fillOpacity: 0.2,
                              dashArray: '5, 5'
                            }}
                            onEachFeature={(feature, layer) => {
                              layer.bindPopup(`
                                <div class="font-medium">🌪️ SPC Day ${outlook.day} Outlook</div>
                                <div class="text-sm mt-1">Risk: ${outlook.risk || 'Marginal'}</div>
                              `);
                            }}
                          />
                        ) : null
                      ))}
                      
                      {/* Hurricane Points */}
                      {nhcData.storms.map((storm, index) => (
                        storm.geometry ? (
                          <GeoJSON
                            key={`storm-${index}`}
                            data={storm.geometry}
                            pointToLayer={(feature, latlng) => {
                              const L = (window as any).L;
                              return L.circleMarker(latlng, {
                                radius: 8,
                                fillColor: '#dc2626',
                                color: '#7f1d1d',
                                weight: 2,
                                opacity: 1,
                                fillOpacity: 0.8
                              });
                            }}
                            onEachFeature={(feature, layer) => {
                              layer.bindPopup(`
                                <div class="font-medium">🌀 ${storm.name}</div>
                                <div class="text-sm">Status: ${storm.status}</div>
                                <div class="text-sm">Max Winds: ${storm.maxWinds} mph</div>
                                <div class="text-sm">Movement: ${storm.movement}</div>
                              `);
                            }}
                          />
                        ) : null
                      ))}
                      
                      {/* NDBC Buoy Stations */}
                      {buoyData.map((buoy, index) => (
                        <GeoJSON
                          key={`buoy-${index}`}
                          data={{
                            type: 'Feature',
                            geometry: {
                              type: 'Point',
                              coordinates: [buoy.longitude, buoy.latitude]
                            },
                            properties: {}
                          } as any}
                          pointToLayer={(feature, latlng) => {
                            const L = (window as any).L;
                            return L.circleMarker(latlng, {
                              radius: 5,
                              fillColor: '#0ea5e9',
                              color: '#0369a1',
                              weight: 1,
                              opacity: 1,
                              fillOpacity: 0.7
                            });
                          }}
                          onEachFeature={(feature, layer) => {
                            const { measurements } = buoy;
                            layer.bindPopup(`
                              <div class="font-medium">🌊 ${buoy.stationId}</div>
                              <div class="text-xs text-gray-600">${buoy.name}</div>
                              ${measurements.waterTemperature ? `<div class="text-sm">Water: ${measurements.waterTemperature}°C</div>` : ''}
                              ${measurements.significantWaveHeight ? `<div class="text-sm">Wave Height: ${measurements.significantWaveHeight}m</div>` : ''}
                              ${measurements.windSpeed ? `<div class="text-sm">Wind: ${measurements.windSpeed} kt</div>` : ''}
                            `);
                          }}
                        />
                      ))}
                    </MapContainer>
                  )}
                </div>
                
                {/* Map Legend */}
                <div className="mt-3 flex flex-wrap gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-3 bg-red-600 opacity-30 border border-red-600"></div>
                    <span>Extreme Alerts</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-3 bg-orange-600 opacity-30 border border-orange-600"></div>
                    <span>Severe Alerts</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-3 bg-yellow-600 opacity-30 border border-yellow-600"></div>
                    <span>Other Alerts</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-3 bg-red-600 opacity-20 border border-red-600 border-dashed"></div>
                    <span>SPC High Risk</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-3 bg-orange-600 opacity-20 border border-orange-600 border-dashed"></div>
                    <span>SPC Enhanced</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-600 rounded-full"></div>
                    <span>Active Storms</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span>Ocean Buoys</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle data-testid="card-title-alerts">⚠️ National Weather Service Alerts</CardTitle>
              <CardDescription>
                Live government weather alerts for your area
              </CardDescription>
            </CardHeader>
            <CardContent>
              {alerts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground" data-testid="text-no-alerts">
                  ✅ No active weather alerts in your area
                </div>
              ) : (
                <div className="space-y-4">
                  {alerts.map((alert) => (
                    <div 
                      key={alert.id}
                      className="border rounded-lg p-4"
                      data-testid={`alert-card-${alert.id}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg" data-testid={`alert-title-${alert.id}`}>
                            {alert.title}
                          </h3>
                          <p className="text-sm text-muted-foreground" data-testid={`alert-type-${alert.id}`}>
                            {alert.alertType} • {alert.areas.join(', ')}
                          </p>
                          <p className="mt-2" data-testid={`alert-description-${alert.id}`}>
                            {alert.description}
                          </p>
                        </div>
                        <Badge 
                          variant={alert.severity === 'extreme' ? 'destructive' : 
                                  alert.severity === 'severe' ? 'secondary' : 'outline'}
                          data-testid={`alert-severity-${alert.id}`}
                        >
                          {alert.severity}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Placeholder tabs for future implementation */}
        <TabsContent value="radar">
          <Card>
            <CardHeader>
              <CardTitle>📡 Radar & Lightning</CardTitle>
              <CardDescription>NEXRAD radar and live lightning detection</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                🚧 Radar and lightning data coming soon
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="satellite" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Ocean Temperature Data */}
            <Card>
              <CardHeader>
                <CardTitle data-testid="card-title-ocean">🌊 Sea Surface Temperature</CardTitle>
                <CardDescription>
                  Live ocean temperature data from NDBC buoys
                </CardDescription>
              </CardHeader>
              <CardContent>
                {oceanData.seaSurfaceTemperature.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground" data-testid="text-no-ocean-data">
                    📡 No sea surface temperature data available
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="text-sm text-muted-foreground">
                      Last Updated: {new Date(oceanData.lastUpdated).toLocaleString()}
                    </div>
                    {oceanData.seaSurfaceTemperature.slice(0, 5).map((sst, index) => (
                      <div 
                        key={`sst-${index}`}
                        className="border rounded-lg p-3"
                        data-testid={`sst-reading-${index}`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium" data-testid={`sst-station-${index}`}>
                              Station {sst.stationId}
                            </h4>
                            <p className="text-sm text-muted-foreground" data-testid={`sst-location-${index}`}>
                              {sst.latitude.toFixed(3)}°N, {sst.longitude.toFixed(3)}°W
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-semibold" data-testid={`sst-temp-${index}`}>
                              {sst.temperature.toFixed(1)}°C
                            </div>
                            <div className="text-xs text-muted-foreground">
                              ({(sst.temperature * 9/5 + 32).toFixed(1)}°F)
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Wave Data */}
            <Card>
              <CardHeader>
                <CardTitle data-testid="card-title-waves">🌊 Wave Conditions</CardTitle>
                <CardDescription>
                  Live wave height and period measurements
                </CardDescription>
              </CardHeader>
              <CardContent>
                {waveData.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground" data-testid="text-no-wave-data">
                    📡 No wave data available
                  </div>
                ) : (
                  <div className="space-y-4">
                    {waveData.slice(0, 5).map((wave, index) => (
                      <div 
                        key={`wave-${index}`}
                        className="border rounded-lg p-3"
                        data-testid={`wave-reading-${index}`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium" data-testid={`wave-station-${index}`}>
                              {wave.stationName || wave.stationId}
                            </h4>
                            <p className="text-sm text-muted-foreground" data-testid={`wave-location-${index}`}>
                              {wave.location.latitude.toFixed(3)}°N, {wave.location.longitude.toFixed(3)}°W
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-semibold" data-testid={`wave-height-${index}`}>
                              {wave.significantHeight.toFixed(1)}m
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Period: {wave.peakPeriod.toFixed(1)}s
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Direction: {wave.direction}°
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* NDBC Buoy Stations */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle data-testid="card-title-buoys">🎯 NDBC Buoy Network</CardTitle>
                <CardDescription>
                  National Data Buoy Center real-time observations
                </CardDescription>
              </CardHeader>
              <CardContent>
                {buoyData.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground" data-testid="text-no-buoy-data">
                    📡 No buoy data available
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {buoyData.slice(0, 6).map((buoy, index) => (
                      <div 
                        key={buoy.stationId}
                        className="border rounded-lg p-4"
                        data-testid={`buoy-card-${buoy.stationId}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium" data-testid={`buoy-name-${buoy.stationId}`}>
                              🌊 {buoy.stationId}
                            </h4>
                            <p className="text-sm text-muted-foreground" data-testid={`buoy-location-${buoy.stationId}`}>
                              {buoy.latitude.toFixed(2)}°N, {buoy.longitude.toFixed(2)}°W
                            </p>
                            <div className="mt-2 space-y-1 text-sm">
                              {buoy.measurements.waterTemperature && (
                                <div data-testid={`buoy-water-temp-${buoy.stationId}`}>
                                  <strong>Water:</strong> {buoy.measurements.waterTemperature}°C
                                </div>
                              )}
                              {buoy.measurements.significantWaveHeight && (
                                <div data-testid={`buoy-wave-height-${buoy.stationId}`}>
                                  <strong>Wave Height:</strong> {buoy.measurements.significantWaveHeight}m
                                </div>
                              )}
                              {buoy.measurements.windSpeed && (
                                <div data-testid={`buoy-wind-speed-${buoy.stationId}`}>
                                  <strong>Wind:</strong> {buoy.measurements.windSpeed} kt
                                </div>
                              )}
                            </div>
                          </div>
                          <Badge 
                            variant={buoy.status === 'active' ? 'default' : 'secondary'}
                            data-testid={`buoy-status-${buoy.stationId}`}
                          >
                            {buoy.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="hurricanes" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle data-testid="card-title-hurricanes">🌀 Hurricane Tracking & SPC Outlooks</CardTitle>
              <CardDescription>
                Live tropical storm tracking and severe weather outlooks
              </CardDescription>
            </CardHeader>
            <CardContent>
              {nhcData.storms.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground" data-testid="text-no-storms">
                  ✅ No active tropical storms
                </div>
              ) : (
                <div className="space-y-4">
                  {nhcData.storms.map((storm) => (
                    <div 
                      key={storm.id}
                      className="border rounded-lg p-4"
                      data-testid={`storm-card-${storm.id}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg" data-testid={`storm-name-${storm.id}`}>
                            🌀 {storm.name}
                          </h3>
                          <p className="text-sm text-muted-foreground" data-testid={`storm-status-${storm.id}`}>
                            {storm.status} • {storm.latitude.toFixed(2)}°N, {storm.longitude.toFixed(2)}°W
                          </p>
                          <div className="mt-2 space-y-1">
                            <p data-testid={`storm-winds-${storm.id}`}>
                              <strong>Max Winds:</strong> {storm.maxWinds} mph
                            </p>
                            <p data-testid={`storm-pressure-${storm.id}`}>
                              <strong>Min Pressure:</strong> {storm.minPressure} mb
                            </p>
                            <p data-testid={`storm-movement-${storm.id}`}>
                              <strong>Movement:</strong> {storm.movement}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="models">
          <Card>
            <CardHeader>
              <CardTitle>🌡️ Weather Models & External Tools</CardTitle>
              <CardDescription>Forecast models and additional weather resources</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                🚧 Weather models and external tools coming soon
              </div>
            </CardContent>
          </Card>
        </TabsContent>
          </Tabs>
        </FadeIn>
      </div>
    </div>
  );
}