import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
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
  Wrench
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

  if (dashboardLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading prediction dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2" data-testid="title-prediction-dashboard">
                🌪️ Predictive Storm Damage AI Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400" data-testid="text-dashboard-description">
                AI-powered {forecastHours}-hour damage predictions with contractor deployment recommendations
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                onClick={refreshData}
                variant="outline"
                size="sm"
                data-testid="button-refresh-data"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium" data-testid="label-auto-refresh">Auto Refresh</label>
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="rounded"
                  data-testid="checkbox-auto-refresh"
                />
              </div>
            </div>
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
              <option value="FL">Florida</option>
              <option value="GA">Georgia</option>
              <option value="SC">South Carolina</option>
              <option value="NC">North Carolina</option>
              <option value="AL">Alabama</option>
              <option value="TX">Texas</option>
              <option value="LA">Louisiana</option>
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

        {/* Key Metrics */}
        {dashboardData && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card data-testid="card-active-predictions">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Predictions</CardTitle>
                <Activity className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="stat-active-predictions">
                  {dashboardData.dashboard.activePredictions}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Storm systems tracked
                </p>
              </CardContent>
            </Card>

            <Card data-testid="card-damage-forecasts">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Damage Forecasts</CardTitle>
                <AlertTriangle className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="stat-damage-forecasts">
                  {dashboardData.dashboard.damageForecasts}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Geographic areas at risk
                </p>
              </CardContent>
            </Card>

            <Card data-testid="card-contractor-opportunities">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Opportunities</CardTitle>
                <DollarSign className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="stat-contractor-opportunities">
                  {dashboardData.dashboard.contractorOpportunities}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Contractor opportunities
                </p>
              </CardContent>
            </Card>

            <Card data-testid="card-total-revenue">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Revenue Potential</CardTitle>
                <TrendingUp className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="stat-total-revenue">
                  {formatCurrency(dashboardData.dashboard.totalEstimatedRevenue)}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Estimated opportunities
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Risk Level Summary */}
        {dashboardData && (
          <Card className="mb-8" data-testid="card-risk-summary">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Risk Level Distribution
              </CardTitle>
              <CardDescription>
                Geographic areas by damage risk level ({forecastHours}-hour forecast)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 gap-4">
                {Object.entries(dashboardData.dashboard.riskSummary).map(([level, count]) => (
                  <div key={level} className="text-center" data-testid={`risk-summary-${level}`}>
                    <div className={`rounded-lg p-4 ${getRiskColor(level)}`}>
                      <div className="text-2xl font-bold">{count}</div>
                      <div className="text-sm capitalize">{level}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content Tabs */}
        <Tabs defaultValue="predictions" className="w-full">
          <TabsList className="grid w-full grid-cols-4" data-testid="tabs-prediction-dashboard">
            <TabsTrigger value="predictions" data-testid="tab-storm-predictions">
              <Cloud className="h-4 w-4 mr-2" />
              Storm Predictions
            </TabsTrigger>
            <TabsTrigger value="damage" data-testid="tab-damage-forecasts">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Damage Forecasts
            </TabsTrigger>
            <TabsTrigger value="opportunities" data-testid="tab-contractor-opportunities">
              <Wrench className="h-4 w-4 mr-2" />
              Opportunities
            </TabsTrigger>
            <TabsTrigger value="deployment" data-testid="tab-deployment-recommendations">
              <Target className="h-4 w-4 mr-2" />
              Deployment
            </TabsTrigger>
          </TabsList>

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

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400" data-testid="text-dashboard-footer">
          Last updated: {dashboardData ? new Date(dashboardData.dashboard.lastUpdated).toLocaleString() : 'Loading...'}
          <br />
          Predictive Storm Damage AI System v1.0 • Powered by NOAA, NEXRAD, and Historical FEMA Data
        </div>
      </div>
    </div>
  );
}