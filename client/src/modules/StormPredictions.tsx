import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import VoiceGuide from '@/components/VoiceGuide';
import { StateCitySelector, useStateCitySelector } from '@/components/StateCitySelector';
import ModuleAIAssistant from '@/components/ModuleAIAssistant';
import { Card } from '@/components/ui/card';
import { MapPin, TrendingUp, AlertTriangle, Clock, DollarSign, Navigation } from 'lucide-react';

interface PredictionDashboard {
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
}

interface StormPrediction {
  id: number;
  stormId: string;
  stormName: string | null;
  stormType: string;
  currentLatitude: string;
  currentLongitude: string;
  currentIntensity: number;
  forecastHours: number;
  maxPredictedIntensity: number;
  predictionStartTime: Date;
  predictionEndTime: Date;
}

interface DamageForecast {
  id: number;
  state: string;
  county: string;
  riskLevel: string;
  expectedArrivalTime: Date;
  peakIntensityTime: Date;
  overallDamageRisk: string;
  estimatedPropertyDamage: string;
  windDamageRisk: string;
  floodingRisk: string;
  tornadoRisk: string;
}

interface ContractorOpportunity {
  id: number;
  state: string;
  county: string;
  opportunityScore: string;
  estimatedRevenueOpportunity: string;
  expectedJobCount: number;
  optimalPrePositionTime: Date;
  workAvailableFromTime: Date;
  peakDemandTime: Date;
  alertLevel: string;
  marketPotential: string;
}

export default function StormPredictions() {
  const { selectedState, setSelectedState, selectedCity, setSelectedCity, availableCities } = useStateCitySelector('Florida', 'Miami');
  const [forecastHours, setForecastHours] = useState(48);
  
  // Fetch prediction dashboard data with state and forecast hours
  const { data: dashboardData, isLoading, refetch } = useQuery<any>({
    queryKey: ['/api/prediction-dashboard', selectedState, forecastHours],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('forecastHours', forecastHours.toString());
      if (selectedState !== 'All States') {
        params.append('state', selectedState);
      }
      const response = await fetch(`/api/prediction-dashboard?${params}`);
      if (!response.ok) throw new Error('Failed to fetch dashboard data');
      return response.json();
    },
    refetchInterval: 120000, // Refresh every 2 minutes
  });

  const dashboard = dashboardData?.dashboard as PredictionDashboard | undefined;
  const predictions = dashboardData?.data?.predictions as StormPrediction[] | undefined;
  const forecasts = dashboardData?.data?.forecasts as DamageForecast[] | undefined;
  const opportunities = dashboardData?.data?.opportunities as ContractorOpportunity[] | undefined;
  
  useEffect(() => {
    refetch();
  }, [selectedState, forecastHours, refetch]);
  
  const getRiskColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'extreme': return 'border-red-500 bg-red-950/40 text-red-300';
      case 'high': return 'border-orange-500 bg-orange-950/40 text-orange-300';
      case 'moderate': return 'border-yellow-500 bg-yellow-950/40 text-yellow-300';
      case 'low': return 'border-blue-500 bg-blue-950/40 text-blue-300';
      default: return 'border-gray-500 bg-gray-950/40 text-gray-300';
    }
  };

  const formatCurrency = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(num);
  };

  const formatDateTime = (date: Date) => {
    if (!date) return 'Unknown';
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    }).format(new Date(date));
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Ambient Neon Backdrop */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 opacity-30 blur-3xl"
          style={{
            background: 'radial-gradient(40% 40% at 20% 30%, rgba(128,0,255,0.15), transparent 60%), radial-gradient(50% 50% at 80% 70%, rgba(0,194,255,0.2), transparent 65%)'
          }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-8 py-16">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-6xl font-extrabold tracking-tight mb-4"
            style={{
              background: 'linear-gradient(90deg, #8000ff 0%, #00d9ff 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 0 80px rgba(128, 0, 255, 0.5)'
            }}
          >
            Storm Predictions
          </h1>
          
          <p className="text-xl text-cyan-300/70 mb-4">
            Deploy BEFORE the storm hits - Predictive intelligence for first-mover advantage
          </p>

          <div className="text-sm text-cyan-400/60">
            Last Updated: {dashboard ? new Date(dashboard.lastUpdated).toLocaleTimeString() : 'Loading...'}
          </div>
        </div>

        {/* Forecast Hours Selector */}
        <div className="flex gap-2 mb-8">
          {[12, 24, 48, 72].map((hours) => (
            <button
              key={hours}
              onClick={() => setForecastHours(hours)}
              className={`px-4 py-2 rounded-lg transition-all ${
                forecastHours === hours
                  ? 'bg-cyan-500 text-black font-bold'
                  : 'bg-slate-800 text-cyan-300 hover:bg-slate-700'
              }`}
              data-testid={`button-forecast-${hours}h`}
            >
              {hours}h Forecast
            </button>
          ))}
        </div>

        {/* State/City Selector */}
        <div className="flex justify-center mb-12">
          <StateCitySelector
            selectedState={selectedState}
            selectedCity={selectedCity}
            availableCities={availableCities}
            onStateChange={setSelectedState}
            onCityChange={setSelectedCity}
            variant="dark"
            showAllStates={true}
          />
        </div>

        {/* Voice Guide */}
        <div className="flex justify-center mb-12">
          <VoiceGuide currentPortal="predictions" />
        </div>

        {isLoading ? (
          <div className="text-center text-cyan-300 py-12">
            <div className="animate-spin w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            Loading predictive intelligence...
          </div>
        ) : !dashboard ? (
          <div className="text-center text-yellow-300 py-12">No dashboard data available</div>
        ) : (
          <>
            {/* Dashboard Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              <Card className="bg-slate-900/60 border-purple-500/30 p-6">
                <div className="flex items-center gap-3 mb-2">
                  <AlertTriangle className="w-5 h-5 text-purple-400" />
                  <div className="text-sm text-purple-300/70">Active Storms</div>
                </div>
                <div className="text-3xl font-bold text-purple-300">{dashboard.activePredictions}</div>
              </Card>

              <Card className="bg-slate-900/60 border-orange-500/30 p-6">
                <div className="flex items-center gap-3 mb-2">
                  <MapPin className="w-5 h-5 text-orange-400" />
                  <div className="text-sm text-orange-300/70">Impact Zones</div>
                </div>
                <div className="text-3xl font-bold text-orange-300">{dashboard.damageForecasts}</div>
              </Card>

              <Card className="bg-slate-900/60 border-cyan-500/30 p-6">
                <div className="flex items-center gap-3 mb-2">
                  <TrendingUp className="w-5 h-5 text-cyan-400" />
                  <div className="text-sm text-cyan-300/70">Opportunities</div>
                </div>
                <div className="text-3xl font-bold text-cyan-300">{dashboard.contractorOpportunities}</div>
              </Card>

              <Card className="bg-slate-900/60 border-green-500/30 p-6">
                <div className="flex items-center gap-3 mb-2">
                  <DollarSign className="w-5 h-5 text-green-400" />
                  <div className="text-sm text-green-300/70">Total Revenue</div>
                </div>
                <div className="text-2xl font-bold text-green-300">{formatCurrency(dashboard.totalEstimatedRevenue)}</div>
              </Card>
            </div>

            {/* Risk Summary */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-cyan-300 mb-4">Risk Distribution</h2>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-red-950/40 border border-red-500/30 rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-red-300">{dashboard.riskSummary.extreme}</div>
                  <div className="text-sm text-red-300/70">Extreme</div>
                </div>
                <div className="bg-orange-950/40 border border-orange-500/30 rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-orange-300">{dashboard.riskSummary.high}</div>
                  <div className="text-sm text-orange-300/70">High</div>
                </div>
                <div className="bg-yellow-950/40 border border-yellow-500/30 rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-yellow-300">{dashboard.riskSummary.moderate}</div>
                  <div className="text-sm text-yellow-300/70">Moderate</div>
                </div>
                <div className="bg-blue-950/40 border border-blue-500/30 rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-blue-300">{dashboard.riskSummary.low}</div>
                  <div className="text-sm text-blue-300/70">Low</div>
                </div>
                <div className="bg-gray-950/40 border border-gray-500/30 rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-gray-300">{dashboard.riskSummary.minimal}</div>
                  <div className="text-sm text-gray-300/70">Minimal</div>
                </div>
              </div>
            </div>

            {/* Active Storm Predictions */}
            {predictions && predictions.length > 0 && (
              <div className="mb-12">
                <h2 className="text-2xl font-bold text-purple-300 mb-6">Active Storm Predictions</h2>
                <div className="space-y-4">
                  {predictions.map((pred) => (
                    <div key={pred.id} className="bg-slate-900/60 border border-purple-500/30 rounded-xl p-6 hover:border-purple-400/50 transition-all" data-testid={`prediction-${pred.id}`}>
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-purple-300">{pred.stormName || pred.stormId}</h3>
                          <div className="text-sm text-purple-300/70 capitalize">{pred.stormType.replace('_', ' ')}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-purple-300">{pred.maxPredictedIntensity} mph</div>
                          <div className="text-sm text-purple-300/70">Max Intensity</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <div className="text-purple-300/70">Current Intensity</div>
                          <div className="text-purple-300 font-bold">{pred.currentIntensity} mph</div>
                        </div>
                        <div>
                          <div className="text-purple-300/70">Forecast</div>
                          <div className="text-purple-300 font-bold">{pred.forecastHours} hours</div>
                        </div>
                        <div>
                          <div className="text-purple-300/70">Predicted Until</div>
                          <div className="text-purple-300 font-bold">{formatDateTime(pred.predictionEndTime)}</div>
                        </div>
                        <div>
                          <div className="text-purple-300/70">Location</div>
                          <div className="text-purple-300 font-bold">{parseFloat(pred.currentLatitude).toFixed(2)}, {parseFloat(pred.currentLongitude).toFixed(2)}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Top Contractor Opportunities - DEPLOY BEFORE IMPACT */}
            {opportunities && opportunities.length > 0 && (
              <div className="mb-12">
                <h2 className="text-2xl font-bold text-cyan-300 mb-2">🎯 Deploy NOW - Beat the Competition</h2>
                <p className="text-cyan-300/70 mb-6">Top revenue opportunities with pre-positioning windows</p>
                <div className="space-y-4">
                  {opportunities.slice(0, 10).map((opp, idx) => {
                    const score = parseFloat(opp.opportunityScore);
                    const revenue = parseFloat(opp.estimatedRevenueOpportunity);
                    const hoursUntilPrePosition = Math.round((new Date(opp.optimalPrePositionTime).getTime() - Date.now()) / (1000 * 60 * 60));
                    const hoursUntilWork = Math.round((new Date(opp.workAvailableFromTime).getTime() - Date.now()) / (1000 * 60 * 60));
                    
                    return (
                      <div key={opp.id} className={`bg-slate-900/60 border ${getRiskColor(opp.alertLevel)} rounded-xl p-6 hover:shadow-lg hover:shadow-cyan-500/20 transition-all`} data-testid={`opportunity-${opp.id}`}>
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-4">
                            <div className="text-3xl font-bold text-cyan-300">#{idx + 1}</div>
                            <div>
                              <h3 className="text-xl font-bold text-cyan-300">{opp.county}, {opp.state}</h3>
                              <div className="text-sm text-cyan-300/70 capitalize">Market: {opp.marketPotential}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-green-300">{formatCurrency(revenue)}</div>
                            <div className="text-sm text-green-300/70">{opp.expectedJobCount} jobs</div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div className="bg-black/30 rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-1">
                              <Navigation className="w-4 h-4 text-yellow-400" />
                              <div className="text-xs text-yellow-300/70">PRE-POSITION NOW</div>
                            </div>
                            <div className="text-lg font-bold text-yellow-300">
                              {hoursUntilPrePosition > 0 ? `${hoursUntilPrePosition}h` : 'IMMEDIATE'}
                            </div>
                            <div className="text-xs text-yellow-300/60">{formatDateTime(opp.optimalPrePositionTime)}</div>
                          </div>
                          
                          <div className="bg-black/30 rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-1">
                              <Clock className="w-4 h-4 text-cyan-400" />
                              <div className="text-xs text-cyan-300/70">WORK STARTS</div>
                            </div>
                            <div className="text-lg font-bold text-cyan-300">
                              {hoursUntilWork > 0 ? `${hoursUntilWork}h` : 'NOW'}
                            </div>
                            <div className="text-xs text-cyan-300/60">{formatDateTime(opp.workAvailableFromTime)}</div>
                          </div>
                          
                          <div className="bg-black/30 rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-1">
                              <TrendingUp className="w-4 h-4 text-green-400" />
                              <div className="text-xs text-green-300/70">OPPORTUNITY SCORE</div>
                            </div>
                            <div className="text-lg font-bold text-green-300">{score.toFixed(1)}/100</div>
                            <div className="text-xs text-green-300/60 uppercase">{opp.alertLevel} priority</div>
                          </div>
                        </div>

                        {hoursUntilPrePosition <= 12 && (
                          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 flex items-center gap-3">
                            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
                            <div className="text-sm text-red-300">
                              <strong>URGENT:</strong> Pre-position window closing in {hoursUntilPrePosition}h - Deploy crews NOW to secure first-mover advantage
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Damage Forecasts */}
            {forecasts && forecasts.length > 0 && (
              <div className="mb-12">
                <h2 className="text-2xl font-bold text-orange-300 mb-6">Impact Timeline - Next {forecastHours} Hours</h2>
                <div className="space-y-3">
                  {forecasts.slice(0, 15).map((forecast) => {
                    const hoursUntilImpact = Math.round((new Date(forecast.expectedArrivalTime).getTime() - Date.now()) / (1000 * 60 * 60));
                    
                    return (
                      <div key={forecast.id} className={`bg-slate-900/60 border ${getRiskColor(forecast.riskLevel)} rounded-lg p-4 hover:border-opacity-100 transition-all`} data-testid={`forecast-${forecast.id}`}>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-full border-2 ${getRiskColor(forecast.riskLevel)} flex items-center justify-center`}>
                              <AlertTriangle className="w-6 h-6" />
                            </div>
                            <div>
                              <div className="font-bold text-lg">{forecast.county}, {forecast.state}</div>
                              <div className="text-sm opacity-70 capitalize">{forecast.riskLevel} risk</div>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className="text-sm opacity-70">Impact in</div>
                            <div className="text-2xl font-bold">
                              {hoursUntilImpact > 0 ? `${hoursUntilImpact}h` : 'NOW'}
                            </div>
                            <div className="text-xs opacity-60">{formatDateTime(forecast.expectedArrivalTime)}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* No Data States */}
            {(!predictions || predictions.length === 0) && (!forecasts || forecasts.length === 0) && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🌤️</div>
                <h3 className="text-2xl font-bold text-cyan-300 mb-2">All Clear</h3>
                <p className="text-cyan-300/70">No active storm predictions in the next {forecastHours} hours</p>
                <p className="text-cyan-300/50 text-sm mt-2">System is monitoring all disaster types: Hurricanes, Tornadoes, Wildfires, Earthquakes, Blizzards, Severe Storms</p>
              </div>
            )}
          </>
        )}

        {/* Status Badge */}
        <div className="mt-12 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-purple-500/10 border border-purple-500/30">
          <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" style={{ boxShadow: '0 0 10px rgba(128, 0, 255, 0.8)' }} />
          <span className="text-sm font-medium text-purple-300">Live Predictive Intelligence Active</span>
        </div>
      </div>
      
      <ModuleAIAssistant moduleName="Storm Predictions" />
    </div>
  );
}
