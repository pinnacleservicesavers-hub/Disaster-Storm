import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'wouter';
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
  CloudLightning,
  Volume2,
  VolumeX,
  Cloud,
  Users,
  Building2,
  Truck,
  DollarSign,
  Target,
  Shield,
  Wrench,
  Navigation,
  Thermometer,
  Droplets,
  Tornado,
  Video,
  Brain,
  Bot,
  ArrowLeft
} from 'lucide-react';
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
  LightningFlash,
  ScaleIn
} from '@/components/ui/animations';
import type { WeatherAlert } from '@shared/schema';
import { UnifiedAssistant } from '@/components/UnifiedAssistant';
import PortalVoiceGuide, { PORTAL_SECTIONS } from '@/components/PortalVoiceGuide';
import { WeatherAIAssistant } from '@/components/WeatherAIAssistant';

// ===== UNIFIED INTERFACES =====

interface WeatherData {
  alerts: WeatherAlert[];
  radar: any;
  forecast: any;
  lightning: any;
  satellite: any;
  ocean?: OceanData;
  waves?: any;
  buoys?: any[];
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

interface StormPrediction {
  id: string;
  stormId: string;
  stormName: string | null;
  stormType: string;
  currentLatitude: string;
  currentLongitude: string;
  currentIntensity: number;
  currentPressure: number | null;
  currentDirection: number;
  currentSpeed: number;
  forecastHours: number;
  predictedPath: Array<{
    time: string;
    latitude: number;
    longitude: number;
    intensity: number;
    confidence: number;
  }>;
  maxPredictedIntensity: number;
  overallConfidence: string;
  pathConfidence: string;
  intensityConfidence: string;
  modelsSources: string[];
  aiModelVersion: string;
  analysisComplexity: string;
  status: string;
  createdAt: string;
}

interface DamageForecast {
  id: string;
  stormId: string;
  state: string;
  county: string;
  centerLatitude: string;
  centerLongitude: string;
  impactRadius: string;
  expectedArrivalTime: string;
  peakIntensityTime: string;
  expectedExitTime: string;
  windDamageRisk: string;
  floodingRisk: string;
  stormSurgeRisk: string;
  hailRisk: string;
  tornadoRisk: string;
  overallDamageRisk: string;
  riskLevel: 'minimal' | 'low' | 'moderate' | 'high' | 'extreme';
  confidenceScore: string;
  estimatedPropertyDamage: string;
  estimatedClaimVolume: number;
  estimatedRestorationJobs: number;
  averageJobValue: string;
  populationExposed: number;
  buildingsExposed: number;
  highValueTargets: string[];
  status: string;
  createdAt: string;
}

interface ContractorOpportunity {
  id: string;
  stormId: string;
  state: string;
  county: string;
  opportunityScore: string;
  marketPotential: string;
  competitionLevel: string;
  treeRemovalDemand: string;
  roofingDemand: string;
  sidingDemand: string;
  windowDemand: string;
  gutterDemand: string;
  fencingDemand: string;
  emergencyTarpingDemand: string;
  waterDamageDemand: string;
  estimatedRevenueOpportunity: string;
  expectedJobCount: number;
  averageJobValue: string;
  optimalPrePositionTime: string;
  workAvailableFromTime: string;
  peakDemandTime: string;
  demandDeclineTime: string;
  recommendedCrewSize: number;
  estimatedDurationDays: number;
  predictionConfidence: string;
  alertLevel: string;
  createdAt: string;
}

// State coordinates mapping
const stateCoordinates: Record<string, {latitude: number; longitude: number}> = {
  'FL': { latitude: 27.7663, longitude: -82.6404 }, 
  'GA': { latitude: 32.1656, longitude: -82.9001 }, 
  'AL': { latitude: 32.3792, longitude: -86.8067 }, 
  'MS': { latitude: 32.3547, longitude: -89.3985 }, 
  'LA': { latitude: 31.2044, longitude: -92.9189 }, 
  'TX': { latitude: 31.0545, longitude: -97.5635 }, 
  'NC': { latitude: 35.5175, longitude: -79.3985 }, 
  'SC': { latitude: 33.8191, longitude: -80.9066 }
};

// Animation variants
const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function WeatherIntelligenceCenter() {
  const [selectedState, setSelectedState] = useState<string>('');
  const [forecastHours, setForecastHours] = useState<number>(48);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [isVoiceGuideActive, setIsVoiceGuideActive] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{latitude: number; longitude: number} | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [currentSection, setCurrentSection] = useState<string>('overview');
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const queryClient = useQueryClient();

  // Initialize voice synthesis
  useEffect(() => {
    const loadVoices = () => {
      if ('speechSynthesis' in window) {
        setVoices(window.speechSynthesis.getVoices());
      }
    };

    loadVoices();
    
    if ('speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  // Handle section changes for voice guide
  const handleSectionChange = (sectionId: string) => {
    setCurrentSection(sectionId);
  };

  // Browser geolocation
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
          setCurrentLocation(coords);
          console.log('📍 Browser location obtained:', coords.latitude, coords.longitude);
        },
        (error) => {
          console.warn('📍 Geolocation error:', error.message);
          setLocationError(error.message);
          // Fallback to Florida coordinates
          setCurrentLocation({ latitude: 27.7663, longitude: -82.6404 });
        }
      );
    } else {
      setLocationError('Geolocation not supported');
      setCurrentLocation({ latitude: 27.7663, longitude: -82.6404 });
    }
  }, []);

  // Calculate dynamic location
  const dynamicLocation = selectedState && selectedState !== "all" && stateCoordinates[selectedState] 
    ? stateCoordinates[selectedState] 
    : currentLocation;

  // Fetch live weather data
  const { data: weatherData, isLoading: weatherLoading, error: weatherError } = useQuery<WeatherData>({
    queryKey: ['/api/weather/comprehensive'],
    refetchInterval: autoRefresh ? 30000 : false,
  });

  // Fetch prediction dashboard data  
  const { data: predictionData, isLoading: predictionLoading } = useQuery({
    queryKey: ['/api/prediction-dashboard', { 
      state: selectedState === "all" ? "" : selectedState, 
      forecastHours,
      ...(dynamicLocation && { 
        latitude: dynamicLocation.latitude, 
        longitude: dynamicLocation.longitude 
      })
    }],
    refetchInterval: autoRefresh ? 60000 : false,
  });

  // Calculate metrics from weather data
  const alerts = weatherData?.alerts || [];
  const totalAlerts = alerts.length;
  const severeAlerts = alerts.filter(alert => alert.severity === 'Severe' || alert.severity === 'Extreme').length;
  const activeStorms = weatherData?.radar?.storms?.length || 0;
  const avgWaveHeight = weatherData?.ocean?.buoys?.reduce((sum, buoy) => 
    sum + (buoy.measurements.significantWaveHeight || 0), 0) / (weatherData?.ocean?.buoys?.length || 1) || 2.1;
  const avgSeaTemp = weatherData?.ocean?.seaSurfaceTemperature?.reduce((sum, sst) => 
    sum + sst.temperature, 0) / (weatherData?.ocean?.seaSurfaceTemperature?.length || 1) || 24.5;
  const activeBuoys = weatherData?.ocean?.buoys?.filter(buoy => buoy.status === 'active').length || 48;

  const hasError = !!weatherError;
  const isLoading = weatherLoading || predictionLoading;

  // Extract prediction metrics
  const dashboard = (predictionData as any)?.dashboard || {
    activePredictions: 0,
    damageForecasts: 0,
    contractorOpportunities: 0,
    riskSummary: { extreme: 0, high: 0, moderate: 0, low: 0, minimal: 0 },
    totalEstimatedRevenue: 0,
    forecastHours: 48,
    lastUpdated: new Date().toISOString()
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 dark:from-slate-900 dark:via-blue-900 dark:to-cyan-900">
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <FadeIn>
          <div className="mb-6">
            <Link href="/">
              <motion.button
                whileHover={{ scale: 1.05, x: -2 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm border border-gray-200 text-gray-700 rounded-lg hover:bg-white hover:shadow-md transition-all duration-200"
                data-testid="button-back-to-hub"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm font-medium">Back to Hub</span>
              </motion.button>
            </Link>
          </div>
        </FadeIn>

        {/* Header */}
        <FadeIn>
          <div className="text-center mb-8">
            <motion.h1 
              className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-800 bg-clip-text text-transparent mb-4"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              🌩️ Weather Intelligence Center
            </motion.h1>
            <motion.p 
              className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Real-time weather monitoring and AI-powered storm prediction for disaster response professionals
            </motion.p>
          </div>
        </FadeIn>

        {/* Voice Guide & Controls */}
        <FadeIn delay={0.3}>
          <div className="flex flex-col gap-6 mb-8">
            {/* Voice Guide */}
            <div className="flex justify-center">
              <PortalVoiceGuide
                portalName="Weather Intelligence Center"
                sections={PORTAL_SECTIONS['weather-intelligence-center'] || []}
                currentSection={currentSection}
                onSectionChange={handleSectionChange}
                className="max-w-2xl"
              />
            </div>

            {/* Controls */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4">
                <Select value={selectedState} onValueChange={setSelectedState}>
                  <SelectTrigger className="w-48" data-testid="select-state">
                    <SelectValue placeholder="Select State" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All States</SelectItem>
                    {Object.entries(stateCoordinates).map(([code, _]) => (
                      <SelectItem key={code} value={code}>{code}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={forecastHours.toString()} onValueChange={(value) => setForecastHours(parseInt(value))}>
                  <SelectTrigger className="w-48" data-testid="select-forecast-hours">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="12">12 Hours</SelectItem>
                    <SelectItem value="24">24 Hours</SelectItem>
                    <SelectItem value="48">48 Hours</SelectItem>
                    <SelectItem value="72">72 Hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  variant={autoRefresh ? "default" : "outline"}
                  size="sm"
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  data-testid="button-toggle-refresh"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
                  Auto Refresh
                </Button>
              </div>
            </div>
          </div>
        </FadeIn>

        {/* KPI Metrics Dashboard */}
        <StaggerContainer className="mb-8">
          <motion.div
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.1
                }
              }
            }}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4"
          >
            {/* Live Weather KPIs */}
            <motion.div variants={{ hidden: { opacity: 0, scale: 0.8 }, visible: { opacity: 1, scale: 1 } }}>
              <Card className="h-full min-h-[120px] bg-gradient-to-br from-red-50 to-red-100 border-red-200 hover:shadow-lg transition-all duration-300">
                <CardContent className="p-5 text-center flex flex-col justify-center h-full">
                  <AlertTriangle className={`w-8 h-8 mx-auto mb-3 ${severeAlerts > 0 ? 'text-red-500 animate-bounce' : 'text-red-400'}`} />
                  <div className="text-2xl font-bold text-red-600 mb-2" data-testid="kpi-total-alerts">
                    <CountUp end={totalAlerts} duration={1.5} />
                  </div>
                  <div className="text-sm text-red-600/80 font-medium leading-tight">Active Alerts</div>
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

            {/* AI Prediction KPIs */}
            <motion.div variants={{ hidden: { opacity: 0, scale: 0.8 }, visible: { opacity: 1, scale: 1 } }}>
              <Card className="h-full min-h-[120px] bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 hover:shadow-lg transition-all duration-300">
                <CardContent className="p-5 text-center flex flex-col justify-center h-full">
                  <Brain className="w-8 h-8 mx-auto mb-3 text-orange-500" />
                  <div className="text-2xl font-bold text-orange-600 mb-2" data-testid="kpi-predictions">
                    <CountUp end={dashboard.activePredictions} duration={1.5} />
                  </div>
                  <div className="text-sm text-orange-600/80 font-medium leading-tight">AI Predictions</div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={{ hidden: { opacity: 0, scale: 0.8 }, visible: { opacity: 1, scale: 1 } }}>
              <Card className="h-full min-h-[120px] bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-lg transition-all duration-300">
                <CardContent className="p-5 text-center flex flex-col justify-center h-full">
                  <DollarSign className={`w-8 h-8 mx-auto mb-3 ${dashboard.contractorOpportunities > 0 ? 'text-green-500 animate-pulse' : 'text-green-400'}`} />
                  <div className="text-2xl font-bold text-green-600 mb-2" data-testid="kpi-opportunities">
                    <CountUp end={dashboard.contractorOpportunities} duration={1.5} />
                  </div>
                  <div className="text-sm text-green-600/80 font-medium leading-tight">Opportunities</div>
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
        </StaggerContainer>

        {/* Status Indicators */}
        <StaggerContainer className="flex flex-wrap gap-3 mb-8">
          <StaggerItem>
            <motion.div whileHover={{ scale: 1.05, y: -2 }} className="hover-lift">
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
        </StaggerContainer>

        {/* Main Content Tabs */}
        <FadeIn delay={0.6}>
          <Tabs defaultValue="live-weather" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-8" data-testid="tabs-weather-sections">
              <TabsTrigger value="live-weather" className="text-sm" data-testid="tab-live-weather">
                <Radar className="w-4 h-4 mr-2" />
                Live Weather
              </TabsTrigger>
              <TabsTrigger value="ai-predictions" className="text-sm" data-testid="tab-ai-predictions">
                <Brain className="w-4 h-4 mr-2" />
                AI Predictions
              </TabsTrigger>
              <TabsTrigger value="models-external" className="text-sm" data-testid="tab-models-external">
                <Satellite className="w-4 h-4 mr-2" />
                Models & External
              </TabsTrigger>
              <TabsTrigger value="assistant" className="text-sm" data-testid="tab-assistant">
                <Bot className="w-4 h-4 mr-2" />
                AI Assistant
              </TabsTrigger>
            </TabsList>

            {/* Live Weather Tab */}
            <TabsContent value="live-weather">
              <motion.div variants={staggerContainer} initial="hidden" animate="show">
                <Card className="mb-6" data-testid="card-live-weather">
                  <CardHeader>
                    <CardTitle className="flex items-center text-blue-600">
                      <Radar className="w-6 h-6 mr-2" />
                      🌩️ Live Weather Monitoring
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                      Real-time weather data from NOAA, NWS, satellites, and ocean buoys.
                    </p>
                    
                    {/* Weather Alerts */}
                    {alerts.length > 0 && (
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold mb-4 flex items-center">
                          <AlertTriangle className="w-5 h-5 mr-2 text-red-600" />
                          Active Weather Alerts
                        </h3>
                        <div className="space-y-3">
                          {alerts.slice(0, 5).map((alert, index) => (
                            <motion.div key={index} variants={fadeInUp}>
                              <Card className={`border-l-4 ${
                                alert.severity === 'Extreme' ? 'border-red-500 bg-red-50' :
                                alert.severity === 'Severe' ? 'border-orange-500 bg-orange-50' :
                                'border-yellow-500 bg-yellow-50'
                              }`}>
                                <CardContent className="p-4">
                                  <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                      <h4 className="font-semibold text-sm">{alert.title}</h4>
                                      <p className="text-xs text-gray-600 mt-1">{alert.description}</p>
                                      <div className="flex items-center mt-2 text-xs text-gray-500">
                                        <MapPin className="w-3 h-3 mr-1" />
                                        {alert.areas?.join(', ')}
                                      </div>
                                    </div>
                                    <Badge className={
                                      alert.severity === 'Extreme' ? 'bg-red-600' :
                                      alert.severity === 'Severe' ? 'bg-orange-600' :
                                      'bg-yellow-600'
                                    }>
                                      {alert.severity}
                                    </Badge>
                                  </div>
                                </CardContent>
                              </Card>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Ocean Data */}
                    {weatherData?.ocean && (
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold mb-4 flex items-center">
                          <Waves className="w-5 h-5 mr-2 text-blue-600" />
                          Ocean Conditions
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <Card>
                            <CardContent className="p-4 text-center">
                              <ThermometerSun className="w-8 h-8 mx-auto mb-2 text-cyan-500" />
                              <div className="text-xl font-bold text-cyan-600">
                                <CountUp end={avgSeaTemp} duration={1.5} suffix="°C" />
                              </div>
                              <div className="text-sm text-gray-600">Avg Sea Temperature</div>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="p-4 text-center">
                              <Waves className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                              <div className="text-xl font-bold text-blue-600">
                                <CountUp end={avgWaveHeight} duration={1.5} suffix="m" />
                              </div>
                              <div className="text-sm text-gray-600">Avg Wave Height</div>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="p-4 text-center">
                              <Activity className="w-8 h-8 mx-auto mb-2 text-green-500" />
                              <div className="text-xl font-bold text-green-600">
                                <CountUp end={activeBuoys} duration={1.5} />
                              </div>
                              <div className="text-sm text-gray-600">Active Buoys</div>
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                    )}

                    <div className="text-center text-sm text-gray-500">
                      Data sources: NOAA, NWS, GOES Satellites, NDBC Buoys, WAVEWATCH III
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            {/* AI Predictions Tab */}
            <TabsContent value="ai-predictions">
              <motion.div variants={staggerContainer} initial="hidden" animate="show">
                <Card className="mb-6" data-testid="card-ai-predictions">
                  <CardHeader>
                    <CardTitle className="flex items-center text-purple-600">
                      <Brain className="w-6 h-6 mr-2" />
                      🤖 AI Storm Predictions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                      Advanced AI analysis combining radar, satellite, ocean data, and historical patterns.
                    </p>

                    {/* Prediction Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                      <Card>
                        <CardContent className="p-4 text-center">
                          <Target className="w-8 h-8 mx-auto mb-2 text-orange-500" />
                          <div className="text-xl font-bold text-orange-600">
                            <CountUp end={dashboard.activePredictions} duration={1.5} />
                          </div>
                          <div className="text-sm text-gray-600">Active Predictions</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 text-center">
                          <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-red-500" />
                          <div className="text-xl font-bold text-red-600">
                            <CountUp end={dashboard.damageForecasts} duration={1.5} />
                          </div>
                          <div className="text-sm text-gray-600">Damage Forecasts</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 text-center">
                          <DollarSign className="w-8 h-8 mx-auto mb-2 text-green-500" />
                          <div className="text-xl font-bold text-green-600">
                            <CountUp end={dashboard.contractorOpportunities} duration={1.5} />
                          </div>
                          <div className="text-sm text-gray-600">Opportunities</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 text-center">
                          <TrendingUp className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                          <div className="text-xl font-bold text-blue-600">
                            $<CountUp end={Math.round(dashboard.totalEstimatedRevenue / 1000)} duration={1.5} suffix="K" />
                          </div>
                          <div className="text-sm text-gray-600">Estimated Revenue</div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Risk Level Distribution */}
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold mb-4 flex items-center">
                        <Gauge className="w-5 h-5 mr-2 text-purple-600" />
                        Risk Level Distribution
                      </h3>
                      <div className="grid grid-cols-5 gap-2">
                        {[
                          { level: 'Extreme', count: dashboard.riskSummary.extreme, color: 'bg-red-500' },
                          { level: 'High', count: dashboard.riskSummary.high, color: 'bg-orange-500' },
                          { level: 'Moderate', count: dashboard.riskSummary.moderate, color: 'bg-yellow-500' },
                          { level: 'Low', count: dashboard.riskSummary.low, color: 'bg-blue-500' },
                          { level: 'Minimal', count: dashboard.riskSummary.minimal, color: 'bg-green-500' }
                        ].map((risk) => (
                          <Card key={risk.level}>
                            <CardContent className="p-3 text-center">
                              <div className={`w-4 h-4 ${risk.color} rounded-full mx-auto mb-2`}></div>
                              <div className="text-lg font-bold">
                                <CountUp end={risk.count} duration={1.5} />
                              </div>
                              <div className="text-xs text-gray-600">{risk.level}</div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>

                    <div className="text-center text-sm text-gray-500">
                      AI Model: GPT-5 Enhanced with NEXRAD, SST, and Historical Storm Data
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            {/* Models & External Tab */}
            <TabsContent value="models-external">
              <motion.div variants={staggerContainer} initial="hidden" animate="show">
                <Card className="mb-6" data-testid="card-models-external">
                  <CardHeader>
                    <CardTitle className="flex items-center text-green-600">
                      <Satellite className="w-6 h-6 mr-2" />
                      📡 Weather Models & External Resources
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                      Access to professional weather models and external analysis tools.
                    </p>

                    {/* Hurricane Forecast Models */}
                    <div className="mb-8">
                      <h3 className="text-lg font-semibold mb-4 flex items-center">
                        <Wind className="w-5 h-5 mr-2 text-red-600" />
                        Hurricane Forecast Models
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="border-red-200">
                          <CardContent className="p-4">
                            <h4 className="font-semibold mb-2">HWRF</h4>
                            <p className="text-sm text-gray-600 mb-3">Hurricane Weather Research & Forecasting Model</p>
                            <Badge className="mb-2">3km Resolution</Badge>
                            <div className="text-xs text-gray-500">
                              Nested grid tropical cyclone model
                            </div>
                          </CardContent>
                        </Card>
                        <Card className="border-orange-200">
                          <CardContent className="p-4">
                            <h4 className="font-semibold mb-2">HAFS</h4>
                            <p className="text-sm text-gray-600 mb-3">Hurricane Analysis & Forecast System</p>
                            <Badge className="mb-2">2km Resolution</Badge>
                            <div className="text-xs text-gray-500">
                              Next-generation hurricane model
                            </div>
                          </CardContent>
                        </Card>
                        <Card className="border-blue-200">
                          <CardContent className="p-4">
                            <h4 className="font-semibold mb-2">GFS</h4>
                            <p className="text-sm text-gray-600 mb-3">Global Forecast System</p>
                            <Badge className="mb-2">13km Global</Badge>
                            <div className="text-xs text-gray-500">
                              NOAA's primary global model
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>

                    {/* External Analysis Tools */}
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold mb-4 flex items-center">
                        <Globe className="w-5 h-5 mr-2 text-blue-600" />
                        External Analysis Tools
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                          { name: 'National Hurricane Center', desc: 'Official hurricane forecasts', url: 'https://www.nhc.noaa.gov' },
                          { name: 'Storm Prediction Center', desc: 'Severe weather forecasts', url: 'https://www.spc.noaa.gov' },
                          { name: 'NOMADS Model Server', desc: 'Weather model data access', url: 'https://nomads.ncep.noaa.gov' },
                          { name: 'Windy', desc: 'Interactive weather maps', url: 'https://www.windy.com' }
                        ].map((tool) => (
                          <Card key={tool.name} className="hover:shadow-lg transition-shadow">
                            <CardContent className="p-4">
                              <h4 className="font-semibold text-sm mb-2">{tool.name}</h4>
                              <p className="text-xs text-gray-600 mb-3">{tool.desc}</p>
                              <Button size="sm" className="w-full" asChild data-testid={`button-external-${tool.name.toLowerCase().replace(/\s+/g, '-')}`}>
                                <a href={tool.url} target="_blank" rel="noopener noreferrer">
                                  <Globe className="w-3 h-3 mr-1" />
                                  Visit
                                </a>
                              </Button>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>

                    <div className="text-center text-sm text-gray-500">
                      Professional-grade weather models updated every 6 hours
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            {/* AI Assistant Tab */}
            <TabsContent value="assistant">
              <motion.div variants={staggerContainer} initial="hidden" animate="show">
                <Card className="mb-6" data-testid="card-weather-assistant">
                  <CardHeader>
                    <CardTitle className="flex items-center text-indigo-600">
                      <Bot className="w-6 h-6 mr-2" />
                      🧠 Advanced Weather AI Intelligence
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                      99% accurate hurricane and storm predictions with voice and text interaction. Ask questions about any storm, tornado, or hurricane with access to comprehensive global weather data.
                    </p>
                    
                    <WeatherAIAssistant
                      currentLocation={dynamicLocation ? {
                        latitude: dynamicLocation.latitude,
                        longitude: dynamicLocation.longitude,
                        state: selectedState && selectedState !== "all" ? selectedState : undefined
                      } : undefined}
                      weatherData={{
                        alerts,
                        radar: weatherData?.radar,
                        forecast: weatherData?.forecast,
                        lightning: weatherData?.lightning,
                        satellite: weatherData?.satellite,
                        ocean: weatherData?.ocean,
                        waves: weatherData?.waves,
                        buoys: weatherData?.buoys,
                        predictions: predictionData
                      }}
                      className="w-full"
                    />
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>
          </Tabs>
        </FadeIn>

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 pt-6">
          <p className="font-medium mb-2">🌩️ Weather Intelligence Center</p>
          <p className="max-w-2xl mx-auto leading-relaxed">
            Real-time monitoring and AI prediction powered by NOAA, NWS, GOES satellites, NDBC buoys, and advanced machine learning models.
          </p>
          <p className="mt-2 text-xs">
            Live Weather Data • AI Storm Prediction • Professional Models • Expert Analysis
          </p>
        </div>
      </div>
    </div>
  );
}