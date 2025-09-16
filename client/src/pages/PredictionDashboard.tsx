import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { FadeIn, CountUp, StaggerContainer, StaggerItem, HoverLift, ScaleIn, SlideIn, PulseAlert, RainEffect, LightningFlash } from '@/components/ui/animations';
import { 
  Cloud, 
  Zap, 
  AlertTriangle,
  TrendingUp,
  MapPin,
  Clock,
  DollarSign,
  Users,
  Building2,
  Truck,
  Wind,
  Waves,
  Eye,
  RefreshCw,
  Activity,
  Target,
  Shield,
  Wrench,
  Gauge,
  Navigation,
  Thermometer,
  Droplets,
  CloudRain,
  Tornado,
  Sun
} from 'lucide-react';

// ===== INTERFACES =====

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

interface DashboardData {
  dashboard: {
    activePredictions: number;
    damageForecasts: number;
    contractorOpportunities: number;
    riskSummary: {
      extreme: number;
      high: number;
      moderate: number;
      low: number;
      minimal: number;
    };
    totalEstimatedRevenue: number;
    forecastHours: number;
    lastUpdated: string;
  };
  data: {
    predictions: StormPrediction[];
    forecasts: DamageForecast[];
    opportunities: ContractorOpportunity[];
  };
}

// ===== MAIN COMPONENT =====

export default function PredictionDashboard() {
  const [selectedState, setSelectedState] = useState<string>('');
  const [forecastHours, setForecastHours] = useState<number>(48);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const queryClient = useQueryClient();

  // Fetch dashboard data
  const { data: dashboardData, isLoading: dashboardLoading } = useQuery<DashboardData>({
    queryKey: ['/api/prediction-dashboard', selectedState, forecastHours],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedState) params.append('state', selectedState);
      params.append('forecastHours', forecastHours.toString());
      
      const response = await fetch(`/api/prediction-dashboard?${params}`);
      if (!response.ok) throw new Error('Failed to fetch dashboard data');
      return response.json();
    },
    refetchInterval: autoRefresh ? 60000 : false, // Refresh every minute
  });

  // Fetch storm predictions separately for detailed view
  const { data: predictions } = useQuery<{predictions: StormPrediction[], count: number}>({
    queryKey: ['/api/storm-predictions'],
  });

  // Fetch damage forecasts with filtering
  const { data: damageForecasts } = useQuery<{forecasts: DamageForecast[], count: number, total: number}>({
    queryKey: ['/api/damage-forecasts', selectedState, 'high'],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedState) params.append('state', selectedState);
      params.append('riskLevel', 'high');
      params.append('limit', '20');
      
      const response = await fetch(`/api/damage-forecasts?${params}`);
      if (!response.ok) throw new Error('Failed to fetch damage forecasts');
      return response.json();
    },
  });

  // Fetch contractor opportunities
  const { data: opportunities } = useQuery<{opportunities: ContractorOpportunity[], count: number, total: number}>({
    queryKey: ['/api/contractor-opportunities', selectedState],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedState) params.append('state', selectedState);
      params.append('minScore', '60');
      params.append('limit', '15');
      
      const response = await fetch(`/api/contractor-opportunities?${params}`);
      if (!response.ok) throw new Error('Failed to fetch contractor opportunities');
      return response.json();
    },
  });

  const refreshData = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/prediction-dashboard'] });
    queryClient.invalidateQueries({ queryKey: ['/api/storm-predictions'] });
    queryClient.invalidateQueries({ queryKey: ['/api/damage-forecasts'] });
    queryClient.invalidateQueries({ queryKey: ['/api/contractor-opportunities'] });
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'extreme': return 'bg-red-500 text-white';
      case 'high': return 'bg-red-400 text-white';
      case 'moderate': return 'bg-yellow-400 text-black';
      case 'low': return 'bg-green-400 text-white';
      default: return 'bg-gray-400 text-white';
    }
  };

  const getAlertColor = (alertLevel: string) => {
    switch (alertLevel) {
      case 'emergency': return 'bg-red-600 text-white';
      case 'warning': return 'bg-orange-500 text-white';
      case 'advisory': return 'bg-yellow-500 text-black';
      default: return 'bg-blue-500 text-white';
    }
  };

  const formatCurrency = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (num >= 1000000) {
      return `$${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `$${(num / 1000).toFixed(0)}K`;
    } else {
      return `$${num.toFixed(0)}`;
    }
  };

  const formatTimeUntil = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 0) return 'Passed';
    if (diffHours < 24) return `${diffHours}h`;
    return `${Math.floor(diffHours / 24)}d ${diffHours % 24}h`;
  };

  // Weather effects state
  const [showWeatherEffects, setShowWeatherEffects] = useState(false);
  const [isStormActive, setIsStormActive] = useState(false);

  // Check for active severe weather to show effects
  useEffect(() => {
    if (dashboardData) {
      const hasExtremeRisk = dashboardData.dashboard.riskSummary.extreme > 0;
      const hasHighRisk = dashboardData.dashboard.riskSummary.high > 2;
      setIsStormActive(hasExtremeRisk || hasHighRisk);
      setShowWeatherEffects(hasExtremeRisk);
    }
  }, [dashboardData]);

  if (dashboardLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900 flex items-center justify-center relative overflow-hidden">
        {/* Weather effects during loading */}
        {Math.random() > 0.7 && <RainEffect intensity="light" />}
        
        <FadeIn>
          <div className="text-center relative z-10">
            <motion.div
              className="relative mb-6"
              animate={{ 
                scale: [1, 1.1, 1],
                filter: ['hue-rotate(0deg)', 'hue-rotate(180deg)', 'hue-rotate(360deg)']
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className="w-20 h-20 mx-auto relative">
                <motion.div
                  className="absolute inset-0 w-20 h-20 border-4 border-blue-200 border-t-blue-600 rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                />
                <motion.div
                  className="absolute inset-2 w-16 h-16 border-4 border-transparent border-r-purple-400 rounded-full"
                  animate={{ rotate: -360 }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                />
                <motion.div
                  className="absolute inset-4 w-12 h-12 border-2 border-transparent border-b-indigo-300 rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
                {/* Center storm icon */}
                <motion.div
                  className="absolute inset-0 flex items-center justify-center"
                  animate={{ 
                    scale: [0.8, 1.2, 0.8],
                    rotate: [0, 10, -10, 0]
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <Tornado className="w-6 h-6 text-blue-600" />
                </motion.div>
              </div>
            </motion.div>
            
            <motion.div
              className="space-y-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <motion.h2
                className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent"
                animate={{ 
                  backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
                }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                🌪️ Analyzing Storm Patterns...
              </motion.h2>
              
              <div className="space-y-2">
                <motion.p
                  className="text-gray-600 dark:text-gray-400 font-medium"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  Processing NOAA radar data
                </motion.p>
                <motion.p
                  className="text-gray-500 dark:text-gray-500 text-sm"
                  animate={{ opacity: [0.3, 0.8, 0.3] }}
                  transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
                >
                  Correlating historical FEMA damage patterns
                </motion.p>
                <motion.p
                  className="text-gray-400 dark:text-gray-600 text-xs"
                  animate={{ opacity: [0.2, 0.6, 0.2] }}
                  transition={{ duration: 3, repeat: Infinity, delay: 1 }}
                >
                  Calculating contractor opportunity scores
                </motion.p>
              </div>
              
              {/* Loading progress indicator */}
              <motion.div
                className="w-64 h-1 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto overflow-hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
              >
                <motion.div
                  className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 rounded-full"
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                />
              </motion.div>
            </motion.div>
          </div>
        </FadeIn>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900 p-6 relative overflow-hidden">
      {/* Dynamic Weather Effects */}
      <AnimatePresence>
        {showWeatherEffects && <RainEffect intensity="normal" />}
        {isStormActive && Math.random() > 0.8 && <LightningFlash />}
      </AnimatePresence>
      
      {/* Background animated elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-10 -right-10 w-40 h-40 bg-blue-400/10 rounded-full blur-3xl"
          animate={{
            x: [0, 50, 0],
            y: [0, -30, 0],
            scale: [1, 1.2, 1]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-1/4 -left-20 w-60 h-60 bg-purple-400/10 rounded-full blur-3xl"
          animate={{
            x: [0, -40, 0],
            y: [0, 50, 0],
            scale: [1, 0.8, 1]
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-32 h-32 bg-indigo-400/10 rounded-full blur-2xl"
          animate={{
            rotate: [0, 360],
            scale: [1, 1.5, 1]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        />
      </div>
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Enhanced Header */}
        <FadeIn>
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className="relative">
                  <motion.h1 
                    className="text-5xl font-bold mb-3" 
                    data-testid="title-prediction-dashboard"
                    initial={{ backgroundSize: '200% 200%' }}
                    animate={{ 
                      backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
                    }}
                    transition={{ duration: 4, repeat: Infinity }}
                    style={{
                      background: 'linear-gradient(45deg, #3b82f6, #8b5cf6, #6366f1, #06b6d4, #3b82f6)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text'
                    }}
                  >
                    {isStormActive ? '⚡' : '🌪️'} Predictive Storm Intelligence
                  </motion.h1>
                  
                  {/* Dynamic status indicators */}
                  <div className="absolute -top-3 -left-3 flex space-x-1">
                    <motion.div
                      className="w-3 h-3 bg-blue-400 rounded-full"
                      animate={{ 
                        scale: [1, 1.5, 1],
                        opacity: [0.5, 1, 0.5]
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    {isStormActive && (
                      <motion.div
                        className="w-3 h-3 bg-red-400 rounded-full"
                        animate={{ 
                          scale: [1, 2, 1],
                          opacity: [0.3, 1, 0.3]
                        }}
                        transition={{ duration: 1, repeat: Infinity }}
                      />
                    )}
                    <motion.div
                      className="w-3 h-3 bg-green-400 rounded-full"
                      animate={{ 
                        scale: [1, 1.3, 1],
                        opacity: [0.4, 0.9, 0.4]
                      }}
                      transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
                    />
                  </div>
                  
                  {/* Live update indicator */}
                  {autoRefresh && (
                    <motion.div
                      className="absolute -top-1 -right-16 flex items-center space-x-2 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-xs font-medium"
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0 }}
                    >
                      <motion.div
                        className="w-2 h-2 bg-green-500 rounded-full"
                        animate={{ scale: [1, 1.5, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                      />
                      <span>Live</span>
                    </motion.div>
                  )}
                </div>
                <motion.div
                  className="space-y-2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <p className="text-lg text-slate-600 dark:text-slate-300 font-medium" data-testid="text-dashboard-description">
                    AI-powered <motion.span 
                      className="px-3 py-1 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 text-blue-700 dark:text-blue-300 rounded-lg font-semibold shadow-sm"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {forecastHours}h
                    </motion.span> damage predictions with deployment intelligence
                  </p>
                  
                  {/* Dynamic subtitle based on conditions */}
                  <AnimatePresence>
                    {isStormActive && (
                      <motion.p
                        className="text-sm text-red-600 dark:text-red-400 font-medium flex items-center space-x-2"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                      >
                        <PulseAlert intensity="strong">
                          <AlertTriangle className="w-4 h-4" />
                        </PulseAlert>
                        <span>ACTIVE SEVERE WEATHER - Monitor for rapid deployment</span>
                      </motion.p>
                    )}
                  </AnimatePresence>
                  
                  {dashboardData && (
                    <motion.div
                      className="flex items-center space-x-4 text-sm text-slate-500 dark:text-slate-400"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                    >
                      <div className="flex items-center space-x-1">
                        <Activity className="w-3 h-3" />
                        <span>{dashboardData.dashboard.activePredictions} active systems</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <DollarSign className="w-3 h-3" />
                        <span>{formatCurrency(dashboardData.dashboard.totalEstimatedRevenue)} potential</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>Updated {new Date(dashboardData.dashboard.lastUpdated).toLocaleTimeString()}</span>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              </motion.div>
              <motion.div
                className="flex items-center space-x-4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <HoverLift>
                  <Button
                    onClick={refreshData}
                    variant="outline"
                    size="sm"
                    data-testid="button-refresh-data"
                    className="bg-white/80 hover:bg-white border-blue-200 hover:border-blue-300 text-blue-700 hover:text-blue-800 backdrop-blur-sm transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    <motion.div
                      animate={{ rotate: autoRefresh ? 360 : 0 }}
                      transition={{ duration: 1, repeat: autoRefresh ? Infinity : 0, ease: "linear" }}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                    </motion.div>
                    Refresh
                  </Button>
                </HoverLift>
                <div className="flex items-center space-x-3 bg-white/70 backdrop-blur-sm rounded-lg px-4 py-2 border border-blue-200/50">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300" data-testid="label-auto-refresh">Auto Refresh</label>
                  <motion.input
                    type="checkbox"
                    checked={autoRefresh}
                    onChange={(e) => setAutoRefresh(e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 transition-all duration-200"
                    data-testid="checkbox-auto-refresh"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  />
                  {autoRefresh && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="w-2 h-2 bg-green-400 rounded-full animate-pulse"
                    />
                  )}
                </div>
              </motion.div>
          </div>
          
          {/* Filters */}
          <div className="mt-4 flex items-center space-x-4">
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              data-testid="select-state-filter"
            >
              <option value="">All States</option>
              {/* Hurricane States (Atlantic/Gulf Coast) */}
              <optgroup label="🌀 Hurricane States">
                <option value="FL">Florida</option>
                <option value="TX">Texas</option>
                <option value="LA">Louisiana</option>
                <option value="NC">North Carolina</option>
                <option value="SC">South Carolina</option>
                <option value="GA">Georgia</option>
                <option value="AL">Alabama</option>
                <option value="MS">Mississippi</option>
                <option value="VA">Virginia</option>
                <option value="MD">Maryland</option>
                <option value="DE">Delaware</option>
                <option value="PA">Pennsylvania</option>
                <option value="NJ">New Jersey</option>
                <option value="NY">New York</option>
                <option value="CT">Connecticut</option>
                <option value="RI">Rhode Island</option>
                <option value="MA">Massachusetts</option>
                <option value="NH">New Hampshire</option>
                <option value="ME">Maine</option>
              </optgroup>
              {/* Tornado States (Tornado Alley & Dixie Alley) */}
              <optgroup label="🌪️ Tornado States">
                <option value="KS">Kansas</option>
                <option value="OK">Oklahoma</option>
                <option value="NE">Nebraska</option>
                <option value="SD">South Dakota</option>
                <option value="IA">Iowa</option>
                <option value="MO">Missouri</option>
                <option value="AR">Arkansas</option>
                <option value="TN">Tennessee</option>
                <option value="KY">Kentucky</option>
                <option value="IL">Illinois</option>
                <option value="IN">Indiana</option>
                <option value="OH">Ohio</option>
                <option value="MI">Michigan</option>
                <option value="WI">Wisconsin</option>
                <option value="MN">Minnesota</option>
                <option value="CO">Colorado</option>
                <option value="WY">Wyoming</option>
              </optgroup>
            </select>
            
            <select
              value={forecastHours}
              onChange={(e) => setForecastHours(parseInt(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              data-testid="select-forecast-hours"
            >
              <option value={12}>12 Hours</option>
              <option value={24}>24 Hours</option>
              <option value={48}>48 Hours</option>
              <option value={72}>72 Hours</option>
            </select>
          </div>
        </div>

        {/* Enhanced Key Metrics */}
        {dashboardData && (
          <FadeIn delay={0.6}>
            <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StaggerItem>
                <HoverLift>
                  <Card data-testid="card-active-predictions" className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800 hover:shadow-xl transition-all duration-300">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">Active Predictions</CardTitle>
                      <motion.div
                        animate={{ 
                          scale: [1, 1.2, 1],
                          rotate: [0, 10, -10, 0]
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <Activity className="h-5 w-5 text-blue-600" />
                      </motion.div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-blue-800 dark:text-blue-200" data-testid="stat-active-predictions">
                        <CountUp end={dashboardData.dashboard.activePredictions} />
                      </div>
                      <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                        🌀 Storm systems tracked
                      </p>
                    </CardContent>
                  </Card>
                </HoverLift>
              </StaggerItem>

              <StaggerItem>
                <HoverLift>
                  <Card data-testid="card-damage-forecasts" className="bg-gradient-to-br from-orange-50 to-red-100 dark:from-orange-900/20 dark:to-red-900/20 border-orange-200 dark:border-orange-800 hover:shadow-xl transition-all duration-300">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-300">Damage Forecasts</CardTitle>
                      <motion.div
                        animate={{ 
                          scale: [1, 1.1, 1],
                          opacity: [0.7, 1, 0.7]
                        }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        <AlertTriangle className="h-5 w-5 text-orange-600" />
                      </motion.div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-orange-800 dark:text-orange-200" data-testid="stat-damage-forecasts">
                        <CountUp end={dashboardData.dashboard.damageForecasts} />
                      </div>
                      <p className="text-sm text-orange-600 dark:text-orange-400 font-medium">
                        ⚠️ Geographic areas at risk
                      </p>
                    </CardContent>
                  </Card>
                </HoverLift>
              </StaggerItem>

              <StaggerItem>
                <HoverLift>
                  <Card data-testid="card-contractor-opportunities" className="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800 hover:shadow-xl transition-all duration-300">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">Opportunities</CardTitle>
                      <motion.div
                        animate={{ 
                          y: [0, -3, 0],
                          scale: [1, 1.1, 1]
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <DollarSign className="h-5 w-5 text-green-600" />
                      </motion.div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-green-800 dark:text-green-200" data-testid="stat-contractor-opportunities">
                        <CountUp end={dashboardData.dashboard.contractorOpportunities} />
                      </div>
                      <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                        💼 Contractor opportunities
                      </p>
                    </CardContent>
                  </Card>
                </HoverLift>
              </StaggerItem>

              <StaggerItem>
                <HoverLift>
                  <Card data-testid="card-total-revenue" className="bg-gradient-to-br from-purple-50 to-indigo-100 dark:from-purple-900/20 dark:to-indigo-900/20 border-purple-200 dark:border-purple-800 hover:shadow-xl transition-all duration-300">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300">Revenue Potential</CardTitle>
                      <motion.div
                        animate={{ 
                          y: [0, -5, 0],
                          rotate: [0, 15, 0]
                        }}
                        transition={{ duration: 2.5, repeat: Infinity }}
                      >
                        <TrendingUp className="h-5 w-5 text-purple-600" />
                      </motion.div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-purple-800 dark:text-purple-200" data-testid="stat-total-revenue">
                        {formatCurrency(dashboardData.dashboard.totalEstimatedRevenue)}
                      </div>
                      <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">
                        📈 Estimated opportunities
                      </p>
                    </CardContent>
                  </Card>
                </HoverLift>
              </StaggerItem>
            </StaggerContainer>
          </FadeIn>
        )}

        {/* Enhanced Risk Level Summary */}
        {dashboardData && (
          <FadeIn delay={0.8}>
            <Card className="mb-8 bg-gradient-to-r from-white via-slate-50 to-white dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 border-slate-200 dark:border-slate-700 shadow-xl" data-testid="card-risk-summary">
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <motion.div
                    animate={{ 
                      rotate: [0, 10, -10, 0],
                      scale: [1, 1.1, 1]
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    <Shield className="h-6 w-6 mr-3 text-blue-600" />
                  </motion.div>
                  <span className="bg-gradient-to-r from-slate-700 to-blue-600 bg-clip-text text-transparent font-bold">
                    Risk Level Distribution
                  </span>
                </CardTitle>
                <CardDescription className="text-base">
                  🎯 Geographic areas by damage risk level • <span className="font-semibold text-blue-600">{forecastHours}h</span> forecast window
                </CardDescription>
              </CardHeader>
              <CardContent>
                <StaggerContainer className="grid grid-cols-5 gap-4">
                  {Object.entries(dashboardData.dashboard.riskSummary).map(([level, count], index) => (
                    <StaggerItem key={level}>
                      <HoverLift>
                        <motion.div 
                          className="text-center" 
                          data-testid={`risk-summary-${level}`}
                          whileHover={{ y: -5 }}
                          transition={{ type: "spring", stiffness: 300 }}
                        >
                          <div className={`rounded-xl p-6 ${getRiskColor(level)} shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105`}>
                            <motion.div 
                              className="text-3xl font-bold mb-2"
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ delay: 0.1 * index, type: "spring" }}
                            >
                              <CountUp end={count} />
                            </motion.div>
                            <div className="text-sm capitalize font-semibold tracking-wide">
                              {level === 'extreme' && '🔴'}
                              {level === 'high' && '🟠'}
                              {level === 'moderate' && '🟡'}
                              {level === 'low' && '🟢'}
                              {level === 'minimal' && '⚪'}
                              {' '}{level}
                            </div>
                            {level === 'extreme' && count > 0 && (
                              <motion.div
                                className="mt-2 text-xs font-medium opacity-90"
                                animate={{ opacity: [0.5, 1, 0.5] }}
                                transition={{ duration: 2, repeat: Infinity }}
                              >
                                ⚠️ CRITICAL
                              </motion.div>
                            )}
                          </div>
                        </motion.div>
                      </HoverLift>
                    </StaggerItem>
                  ))}
                </StaggerContainer>
              </CardContent>
            </Card>
          </FadeIn>
        )}

        {/* Enhanced Main Content Tabs */}
        <FadeIn delay={1.0}>
          <Tabs defaultValue="predictions" className="w-full">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 }}
            >
              <TabsList 
                className="grid w-full grid-cols-4 bg-white/80 backdrop-blur-sm border border-slate-200/50 p-1 rounded-xl shadow-lg" 
                data-testid="tabs-prediction-dashboard"
              >
                <HoverLift>
                  <TabsTrigger 
                    value="predictions" 
                    data-testid="tab-storm-predictions"
                    className="rounded-lg transition-all duration-300 data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg"
                  >
                    <Cloud className="h-4 w-4 mr-2" />
                    🌀 Storm Predictions
                  </TabsTrigger>
                </HoverLift>
                <HoverLift>
                  <TabsTrigger 
                    value="damage" 
                    data-testid="tab-damage-forecasts"
                    className="rounded-lg transition-all duration-300 data-[state=active]:bg-orange-500 data-[state=active]:text-white data-[state=active]:shadow-lg"
                  >
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    ⚠️ Damage Forecasts
                  </TabsTrigger>
                </HoverLift>
                <HoverLift>
                  <TabsTrigger 
                    value="opportunities" 
                    data-testid="tab-contractor-opportunities"
                    className="rounded-lg transition-all duration-300 data-[state=active]:bg-green-500 data-[state=active]:text-white data-[state=active]:shadow-lg"
                  >
                    <Wrench className="h-4 w-4 mr-2" />
                    💼 Opportunities
                  </TabsTrigger>
                </HoverLift>
                <HoverLift>
                  <TabsTrigger 
                    value="deployment" 
                    data-testid="tab-deployment-recommendations"
                    className="rounded-lg transition-all duration-300 data-[state=active]:bg-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg"
                  >
                    <Target className="h-4 w-4 mr-2" />
                    🎯 Deployment
                  </TabsTrigger>
                </HoverLift>
              </TabsList>
            </motion.div>

          {/* Storm Predictions Tab */}
          <TabsContent value="predictions" data-testid="content-storm-predictions">
            <div className="space-y-6">
              {dashboardData?.data.predictions.map((prediction) => (
                <Card key={prediction.id} data-testid={`prediction-card-${prediction.stormId}`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center">
                        <Zap className="h-5 w-5 mr-2 text-yellow-500" />
                        {prediction.stormName || prediction.stormId}
                      </CardTitle>
                      <Badge className={`${
                        prediction.analysisComplexity === 'complex' ? 'bg-red-100 text-red-800' :
                        prediction.analysisComplexity === 'standard' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`} data-testid={`badge-complexity-${prediction.stormId}`}>
                        {prediction.analysisComplexity}
                      </Badge>
                    </div>
                    <CardDescription>
                      {prediction.stormType.charAt(0).toUpperCase() + prediction.stormType.slice(1)} • 
                      {prediction.forecastHours}h forecast • 
                      AI Model {prediction.aiModelVersion}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Current Status */}
                      <div className="space-y-3">
                        <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300">Current Status</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Intensity:</span>
                            <span className="font-medium" data-testid={`current-intensity-${prediction.stormId}`}>
                              {prediction.currentIntensity} mph
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Direction:</span>
                            <span className="font-medium">{prediction.currentDirection}°</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Speed:</span>
                            <span className="font-medium">{prediction.currentSpeed} mph</span>
                          </div>
                          {prediction.currentPressure && (
                            <div className="flex justify-between">
                              <span>Pressure:</span>
                              <span className="font-medium">{prediction.currentPressure} mb</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Predictions */}
                      <div className="space-y-3">
                        <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300">Predictions</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Max Intensity:</span>
                            <span className="font-medium text-red-600" data-testid={`max-intensity-${prediction.stormId}`}>
                              {prediction.maxPredictedIntensity} mph
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Path Points:</span>
                            <span className="font-medium">{prediction.predictedPath.length}</span>
                          </div>
                          <div className="space-y-1">
                            <span>Confidence Levels:</span>
                            <div className="pl-2 space-y-1">
                              <div className="flex justify-between text-xs">
                                <span>Overall:</span>
                                <span className="font-medium">{(parseFloat(prediction.overallConfidence) * 100).toFixed(0)}%</span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span>Path:</span>
                                <span className="font-medium">{(parseFloat(prediction.pathConfidence) * 100).toFixed(0)}%</span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span>Intensity:</span>
                                <span className="font-medium">{(parseFloat(prediction.intensityConfidence) * 100).toFixed(0)}%</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Models Used */}
                      <div className="space-y-3">
                        <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300">Data Sources</h4>
                        <div className="space-y-2">
                          <div>
                            <span className="text-xs text-gray-500">Models:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {prediction.modelsSources.map((model) => (
                                <Badge key={model} variant="secondary" className="text-xs">
                                  {model}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Damage Forecasts Tab */}
          <TabsContent value="damage" data-testid="content-damage-forecasts">
            <div className="space-y-6">
              {damageForecasts?.forecasts.map((forecast) => (
                <Card key={forecast.id} data-testid={`damage-forecast-${forecast.county}-${forecast.state}`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center">
                        <MapPin className="h-5 w-5 mr-2 text-blue-500" />
                        {forecast.county}, {forecast.state}
                      </CardTitle>
                      <div className="flex items-center space-x-2">
                        <Badge className={getRiskColor(forecast.riskLevel)} data-testid={`badge-risk-${forecast.county}`}>
                          {forecast.riskLevel.toUpperCase()}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {(parseFloat(forecast.confidenceScore) * 100).toFixed(0)}% confidence
                        </span>
                      </div>
                    </div>
                    <CardDescription>
                      Impact radius: {forecast.impactRadius} miles • 
                      Arrives in {formatTimeUntil(forecast.expectedArrivalTime)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Risk Factors */}
                      <div className="space-y-3">
                        <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300">Risk Factors (0-10)</h4>
                        <div className="space-y-2">
                          {[
                            { label: 'Wind Damage', value: forecast.windDamageRisk, icon: Wind },
                            { label: 'Flooding', value: forecast.floodingRisk, icon: Waves },
                            { label: 'Storm Surge', value: forecast.stormSurgeRisk, icon: Waves },
                            { label: 'Hail', value: forecast.hailRisk, icon: Cloud },
                            { label: 'Tornado', value: forecast.tornadoRisk, icon: Zap }
                          ].map(({ label, value, icon: Icon }) => {
                            const score = parseFloat(value);
                            return (
                              <div key={label} className="flex items-center justify-between">
                                <div className="flex items-center">
                                  <Icon className="h-3 w-3 mr-2 text-gray-500" />
                                  <span className="text-sm">{label}:</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Progress value={score * 10} className="w-16 h-2" />
                                  <span className="text-sm font-medium w-8">{score.toFixed(1)}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Economic Impact */}
                      <div className="space-y-3">
                        <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300">Economic Impact</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Property Damage:</span>
                            <span className="font-medium text-red-600" data-testid={`property-damage-${forecast.county}`}>
                              {formatCurrency(forecast.estimatedPropertyDamage)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Insurance Claims:</span>
                            <span className="font-medium">{forecast.estimatedClaimVolume.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Restoration Jobs:</span>
                            <span className="font-medium text-green-600" data-testid={`restoration-jobs-${forecast.county}`}>
                              {forecast.estimatedRestorationJobs.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Avg Job Value:</span>
                            <span className="font-medium">{formatCurrency(forecast.averageJobValue)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Population & Infrastructure */}
                      <div className="space-y-3">
                        <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300">Exposure</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <Users className="h-3 w-3 mr-2 text-gray-500" />
                              <span>Population:</span>
                            </div>
                            <span className="font-medium">{forecast.populationExposed.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <Building2 className="h-3 w-3 mr-2 text-gray-500" />
                              <span>Buildings:</span>
                            </div>
                            <span className="font-medium">{forecast.buildingsExposed.toLocaleString()}</span>
                          </div>
                          {forecast.highValueTargets.length > 0 && (
                            <div className="mt-2">
                              <span className="text-xs text-gray-500">Critical Infrastructure:</span>
                              <div className="mt-1 space-y-1">
                                {forecast.highValueTargets.map((target, index) => (
                                  <Badge key={index} variant="outline" className="text-xs mr-1 mb-1">
                                    {target}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Timing */}
                    <Separator className="my-4" />
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="text-center">
                        <div className="flex items-center justify-center mb-1">
                          <Clock className="h-4 w-4 mr-1 text-gray-500" />
                          <span className="font-medium">Arrival</span>
                        </div>
                        <div className="text-xs text-gray-600" data-testid={`arrival-time-${forecast.county}`}>
                          {formatTimeUntil(forecast.expectedArrivalTime)}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center mb-1">
                          <Eye className="h-4 w-4 mr-1 text-orange-500" />
                          <span className="font-medium">Peak Impact</span>
                        </div>
                        <div className="text-xs text-gray-600">
                          {formatTimeUntil(forecast.peakIntensityTime)}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center mb-1">
                          <Clock className="h-4 w-4 mr-1 text-green-500" />
                          <span className="font-medium">Exit</span>
                        </div>
                        <div className="text-xs text-gray-600">
                          {formatTimeUntil(forecast.expectedExitTime)}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Contractor Opportunities Tab */}
          <TabsContent value="opportunities" data-testid="content-contractor-opportunities">
            <div className="space-y-6">
              {opportunities?.opportunities.map((opportunity) => (
                <Card key={opportunity.id} data-testid={`opportunity-${opportunity.county}-${opportunity.state}`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center">
                        <DollarSign className="h-5 w-5 mr-2 text-green-500" />
                        {opportunity.county}, {opportunity.state}
                      </CardTitle>
                      <div className="flex items-center space-x-2">
                        <Badge className={getAlertColor(opportunity.alertLevel)} data-testid={`badge-alert-${opportunity.county}`}>
                          {opportunity.alertLevel.toUpperCase()}
                        </Badge>
                        <span className="text-lg font-bold text-green-600" data-testid={`opportunity-score-${opportunity.county}`}>
                          {parseFloat(opportunity.opportunityScore).toFixed(0)}
                        </span>
                      </div>
                    </div>
                    <CardDescription>
                      Market: {opportunity.marketPotential} • 
                      Competition: {opportunity.competitionLevel} • 
                      {(parseFloat(opportunity.predictionConfidence) * 100).toFixed(0)}% confidence
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Job Demand */}
                      <div className="space-y-3">
                        <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300">Job Type Demand (0-100)</h4>
                        <div className="space-y-2">
                          {[
                            { label: 'Tree Removal', value: opportunity.treeRemovalDemand },
                            { label: 'Roofing', value: opportunity.roofingDemand },
                            { label: 'Emergency Tarping', value: opportunity.emergencyTarpingDemand },
                            { label: 'Siding', value: opportunity.sidingDemand },
                            { label: 'Water Damage', value: opportunity.waterDamageDemand },
                          ].map(({ label, value }) => {
                            const score = parseFloat(value);
                            return (
                              <div key={label} className="flex items-center justify-between">
                                <span className="text-sm">{label}:</span>
                                <div className="flex items-center space-x-2">
                                  <Progress value={score} className="w-16 h-2" />
                                  <span className="text-sm font-medium w-8">{score.toFixed(0)}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Financial Opportunity */}
                      <div className="space-y-3">
                        <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300">Financial Opportunity</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Revenue Potential:</span>
                            <span className="font-medium text-green-600" data-testid={`revenue-potential-${opportunity.county}`}>
                              {formatCurrency(opportunity.estimatedRevenueOpportunity)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Expected Jobs:</span>
                            <span className="font-medium">{opportunity.expectedJobCount.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Avg Job Value:</span>
                            <span className="font-medium">{formatCurrency(opportunity.averageJobValue)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Crew Size:</span>
                            <span className="font-medium">{opportunity.recommendedCrewSize} people</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Duration:</span>
                            <span className="font-medium">{opportunity.estimatedDurationDays} days</span>
                          </div>
                        </div>
                      </div>

                      {/* Timing Strategy */}
                      <div className="space-y-3">
                        <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300">Deployment Timeline</h4>
                        <div className="space-y-3">
                          <div className="border-l-2 border-blue-500 pl-3">
                            <div className="text-xs font-medium text-blue-600">Pre-Position</div>
                            <div className="text-xs text-gray-600" data-testid={`pre-position-${opportunity.county}`}>
                              {formatTimeUntil(opportunity.optimalPrePositionTime)}
                            </div>
                          </div>
                          <div className="border-l-2 border-green-500 pl-3">
                            <div className="text-xs font-medium text-green-600">Work Available</div>
                            <div className="text-xs text-gray-600">
                              {formatTimeUntil(opportunity.workAvailableFromTime)}
                            </div>
                          </div>
                          <div className="border-l-2 border-orange-500 pl-3">
                            <div className="text-xs font-medium text-orange-600">Peak Demand</div>
                            <div className="text-xs text-gray-600" data-testid={`peak-demand-${opportunity.county}`}>
                              {formatTimeUntil(opportunity.peakDemandTime)}
                            </div>
                          </div>
                          <div className="border-l-2 border-red-500 pl-3">
                            <div className="text-xs font-medium text-red-600">Demand Decline</div>
                            <div className="text-xs text-gray-600">
                              {formatTimeUntil(opportunity.demandDeclineTime)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Deployment Recommendations Tab */}
          <TabsContent value="deployment" data-testid="content-deployment-recommendations">
            <div className="space-y-6">
              <Card data-testid="card-deployment-summary">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Target className="h-5 w-5 mr-2 text-purple-500" />
                    Strategic Deployment Recommendations
                  </CardTitle>
                  <CardDescription>
                    AI-optimized contractor positioning based on predictive damage analysis
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Priority Deployments */}
                    <div>
                      <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-3">
                        🎯 Priority Deployment Zones (Next 24 Hours)
                      </h4>
                      <div className="space-y-3">
                        {opportunities?.opportunities
                          .filter(opp => parseFloat(opp.opportunityScore) >= 70)
                          .slice(0, 3)
                          .map((opportunity) => (
                            <div key={opportunity.id} className="border rounded-lg p-4 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20">
                              <div className="flex items-center justify-between mb-2">
                                <div className="font-medium">{opportunity.county}, {opportunity.state}</div>
                                <Badge className="bg-green-600 text-white">
                                  Priority
                                </Badge>
                              </div>
                              <div className="grid grid-cols-3 gap-4 text-sm">
                                <div>
                                  <span className="text-gray-600">Pre-position by:</span>
                                  <div className="font-medium">{formatTimeUntil(opportunity.optimalPrePositionTime)}</div>
                                </div>
                                <div>
                                  <span className="text-gray-600">Revenue potential:</span>
                                  <div className="font-medium text-green-600">{formatCurrency(opportunity.estimatedRevenueOpportunity)}</div>
                                </div>
                                <div>
                                  <span className="text-gray-600">Recommended crew:</span>
                                  <div className="font-medium">{opportunity.recommendedCrewSize} people</div>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>

                    {/* Regional Strategy */}
                    <Separator />
                    <div>
                      <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-3">
                        📍 Regional Deployment Strategy
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="border rounded-lg p-4">
                          <h5 className="font-medium mb-2 text-blue-600">📊 Market Analysis</h5>
                          <ul className="text-sm space-y-1 text-gray-600">
                            <li>• High demand markets: Florida, Georgia</li>
                            <li>• Competition level: Moderate to Low</li>
                            <li>• Premium pricing window: First 48 hours</li>
                            <li>• Peak work availability: Days 2-7 post-storm</li>
                          </ul>
                        </div>
                        <div className="border rounded-lg p-4">
                          <h5 className="font-medium mb-2 text-orange-600">🚛 Logistics Recommendations</h5>
                          <ul className="text-sm space-y-1 text-gray-600">
                            <li>• Equipment: Tarps, chainsaws, generators</li>
                            <li>• Staging areas: Hotels within 30 miles</li>
                            <li>• Supply chain: Pre-position materials</li>
                            <li>• Communication: Satellite backup plans</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* Action Items */}
                    <Separator />
                    <div>
                      <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-3">
                        ✅ Immediate Action Items
                      </h4>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                          <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                          <span className="text-sm">Monitor storm intensification - current prediction confidence 70%</span>
                        </div>
                        <div className="flex items-center space-x-3 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                          <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                          <span className="text-sm">Pre-position crews in Miami-Dade, Broward counties within 12 hours</span>
                        </div>
                        <div className="flex items-center space-x-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-sm">Secure accommodations and equipment suppliers in target markets</span>
                        </div>
                        <div className="flex items-center space-x-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span className="text-sm">Set up emergency communication systems and customer management</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
        </FadeIn>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400" data-testid="text-dashboard-footer">
          Last updated: {dashboardData ? new Date(dashboardData.dashboard.lastUpdated).toLocaleString() : 'Loading...'}
          <br />
          Predictive Storm Damage AI System v1.0 • Powered by NOAA, NEXRAD, and Historical FEMA Data
        </div>
        </FadeIn>
      </div>
    </div>
  );
}