import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Card } from '@/components/ui/card';
import { Clock, DollarSign, AlertTriangle, Navigation, MapPin } from 'lucide-react';
import ModuleAIAssistant from '@/components/ModuleAIAssistant';
import VoiceGuide from '@/components/VoiceGuide';

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

interface DamageForecast {
  id: number;
  state: string;
  county: string;
  riskLevel: string;
  expectedArrivalTime: Date;
  latitude?: string;
  longitude?: string;
}

interface StormPrediction {
  id: number;
  stormId: string;
  stormName: string | null;
  stormType: string;
  currentLatitude: string;
  currentLongitude: string;
  currentIntensity: number;
  maxPredictedIntensity: number;
}

// Get geocoding service for dynamic county coordinates
async function geocodeCounty(county: string, state: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const query = `${county} County, ${state}, USA`;
    const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`);
    const data = await response.json();
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon)
      };
    }
  } catch (error) {
    console.error(`Failed to geocode ${county}, ${state}:`, error);
  }
  return null;
}

export default function DeploymentMap() {
  const [forecastHours, setForecastHours] = useState(48);
  const [selectedOpportunity, setSelectedOpportunity] = useState<ContractorOpportunity | null>(null);
  const [countyCoords, setCountyCoords] = useState<Map<string, { lat: number; lng: number }>>(new Map());
  const geocodingCache = useRef<Map<string, { lat: number; lng: number }>>(new Map());
  
  const { data: dashboardData, isLoading } = useQuery<any>({
    queryKey: ['/api/prediction-dashboard', forecastHours],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('forecastHours', forecastHours.toString());
      const response = await fetch(`/api/prediction-dashboard?${params}`);
      if (!response.ok) throw new Error('Failed to fetch dashboard data');
      return response.json();
    },
    refetchInterval: 120000,
  });

  const forecasts = (dashboardData?.data?.forecasts as DamageForecast[]) || [];
  const opportunities = (dashboardData?.data?.opportunities as ContractorOpportunity[]) || [];
  const predictions = (dashboardData?.data?.predictions as StormPrediction[]) || [];

  // Geocode counties when data changes
  useEffect(() => {
    const geocodeAll = async () => {
      const newCoords = new Map(geocodingCache.current);
      const toGeocode: Array<{ county: string; state: string }> = [];

      // Collect unique counties from forecasts and opportunities
      [...forecasts, ...opportunities].forEach((item) => {
        const key = `${item.county}, ${item.state}`;
        if (!newCoords.has(key)) {
          toGeocode.push({ county: item.county, state: item.state });
        }
      });

      // Geocode in parallel
      const results = await Promise.all(
        toGeocode.map(async ({ county, state }) => {
          const coords = await geocodeCounty(county, state);
          return { key: `${county}, ${state}`, coords };
        })
      );

      results.forEach(({ key, coords }) => {
        if (coords) {
          newCoords.set(key, coords);
        }
      });

      geocodingCache.current = newCoords;
      setCountyCoords(newCoords);
    };

    if (forecasts.length > 0 || opportunities.length > 0) {
      geocodeAll();
    }
  }, [forecasts, opportunities]);

  const getRiskColor = (level: string): string => {
    switch (level.toLowerCase()) {
      case 'extreme': return '#ef4444';
      case 'high': return '#f97316';
      case 'moderate': return '#eab308';
      case 'low': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  const getAlertColor = (level: string): string => {
    switch (level.toLowerCase()) {
      case 'critical': return '#dc2626';
      case 'urgent': return '#ea580c';
      case 'high': return '#f59e0b';
      default: return '#10b981';
    }
  };

  const formatCurrency = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(num);
  };

  const formatHoursUntil = (date: Date) => {
    const hours = Math.round((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60));
    if (hours <= 0) return 'NOW';
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d ${hours % 24}h`;
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Ambient Neon Backdrop */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 opacity-30 blur-3xl"
          style={{
            background: 'radial-gradient(40% 40% at 20% 30%, rgba(0,194,255,0.15), transparent 60%), radial-gradient(50% 50% at 80% 70%, rgba(128,0,255,0.2), transparent 65%)'
          }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-6xl font-extrabold tracking-tight mb-4"
            style={{
              background: 'linear-gradient(90deg, #00d9ff 0%, #00ff88 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 0 80px rgba(0, 217, 255, 0.5)'
            }}
          >
            Contractor Deployment Map
          </h1>
          
          <p className="text-xl text-cyan-300/70 mb-4">
            Visual intelligence for pre-positioning crews BEFORE impact
          </p>
        </div>

        {/* Forecast Hours Selector */}
        <div className="flex gap-2 mb-6">
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
              {hours}h Window
            </button>
          ))}
        </div>

        {/* Voice Guide */}
        <div className="flex justify-center mb-6">
          <VoiceGuide currentPortal="deployment" />
        </div>

        {isLoading ? (
          <div className="text-center text-cyan-300 py-12">
            <div className="animate-spin w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            Loading deployment intelligence...
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Map */}
            <div className="lg:col-span-2">
              <Card className="bg-slate-900/60 border-cyan-500/30 p-4 h-[600px]">
                <div className="h-full rounded-lg overflow-hidden border border-cyan-500/20">
                  <MapContainer
                    center={[28.5, -81.5]}
                    zoom={6}
                    style={{ height: '100%', width: '100%', background: '#0a0a0a' }}
                    data-testid="deployment-map"
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      className="opacity-70"
                    />

                    {/* Storm Predictions - Purple */}
                    {predictions.map((pred) => (
                      <CircleMarker
                        key={`storm-${pred.id}`}
                        center={[parseFloat(pred.currentLatitude), parseFloat(pred.currentLongitude)]}
                        radius={15}
                        pathOptions={{
                          fillColor: '#8000ff',
                          fillOpacity: 0.7,
                          color: '#ffffff',
                          weight: 2
                        }}
                        data-testid={`map-storm-${pred.id}`}
                      >
                        <Popup>
                          <div className="text-black">
                            <h3 className="font-bold text-purple-600">{pred.stormName || pred.stormId}</h3>
                            <div className="text-sm">
                              <div>Type: {pred.stormType.replace('_', ' ')}</div>
                              <div>Current: {pred.currentIntensity} mph</div>
                              <div>Max Predicted: {pred.maxPredictedIntensity} mph</div>
                            </div>
                          </div>
                        </Popup>
                        <Tooltip permanent direction="top" offset={[0, -15]} className="text-xs font-bold bg-purple-900 border-purple-500">
                          {pred.stormName || pred.stormId}
                        </Tooltip>
                      </CircleMarker>
                    ))}

                    {/* Damage Forecasts - Risk Zones */}
                    {forecasts.map((forecast) => {
                      const coords = countyCoords.get(`${forecast.county}, ${forecast.state}`);
                      if (!coords) return null;
                      
                      return (
                        <Circle
                          key={`forecast-${forecast.id}`}
                          center={[coords.lat, coords.lng]}
                          radius={30000}
                          pathOptions={{
                            fillColor: getRiskColor(forecast.riskLevel),
                            fillOpacity: 0.25,
                            color: getRiskColor(forecast.riskLevel),
                            weight: 2,
                            dashArray: '5, 5'
                          }}
                          data-testid={`map-forecast-${forecast.id}`}
                        >
                          <Popup>
                            <div className="text-black">
                              <h3 className="font-bold" style={{ color: getRiskColor(forecast.riskLevel) }}>
                                {forecast.county}, {forecast.state}
                              </h3>
                              <div className="text-sm">
                                <div>Risk: <span className="capitalize font-bold">{forecast.riskLevel}</span></div>
                                <div>Impact: {formatHoursUntil(forecast.expectedArrivalTime)}</div>
                              </div>
                            </div>
                          </Popup>
                        </Circle>
                      );
                    })}

                    {/* Contractor Opportunities - Green Markers */}
                    {opportunities.slice(0, 10).map((opp) => {
                      const coords = countyCoords.get(`${opp.county}, ${opp.state}`);
                      if (!coords) return null;
                      
                      const hoursUntilPrePosition = Math.round((new Date(opp.optimalPrePositionTime).getTime() - Date.now()) / (1000 * 60 * 60));
                      const isUrgent = hoursUntilPrePosition <= 12;
                      
                      return (
                        <CircleMarker
                          key={`opp-${opp.id}`}
                          center={[coords.lat, coords.lng]}
                          radius={12}
                          pathOptions={{
                            fillColor: isUrgent ? '#eab308' : '#10b981',
                            fillOpacity: 0.9,
                            color: '#ffffff',
                            weight: 2
                          }}
                          eventHandlers={{
                            click: () => setSelectedOpportunity(opp)
                          }}
                          data-testid={`map-opportunity-${opp.id}`}
                        >
                          <Popup>
                            <div className="text-black max-w-xs">
                              <h3 className="font-bold text-green-600">{opp.county}, {opp.state}</h3>
                              <div className="text-sm space-y-1">
                                <div>💰 Revenue: <strong>{formatCurrency(opp.estimatedRevenueOpportunity)}</strong></div>
                                <div>📊 Score: <strong>{parseFloat(opp.opportunityScore).toFixed(1)}/100</strong></div>
                                <div>🚀 Deploy: <strong>{formatHoursUntil(opp.optimalPrePositionTime)}</strong></div>
                                <div>⏰ Work Starts: <strong>{formatHoursUntil(opp.workAvailableFromTime)}</strong></div>
                                {isUrgent && (
                                  <div className="bg-red-100 border border-red-300 rounded p-2 mt-2">
                                    <strong className="text-red-600">⚠️ URGENT: Deploy NOW!</strong>
                                  </div>
                                )}
                              </div>
                            </div>
                          </Popup>
                          <Tooltip permanent direction="top" offset={[0, -12]} className="text-xs font-bold bg-green-900 border-green-500">
                            {formatCurrency(opp.estimatedRevenueOpportunity)}
                          </Tooltip>
                        </CircleMarker>
                      );
                    })}
                  </MapContainer>
                </div>
              </Card>

              {/* Map Legend */}
              <div className="mt-4 bg-slate-900/60 border border-cyan-500/30 rounded-xl p-4">
                <h3 className="text-sm font-bold text-cyan-300 mb-3">Map Legend</h3>
                <div className="grid grid-cols-3 gap-4 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-purple-500 border-2 border-white"></div>
                    <span className="text-purple-300">Active Storms</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-green-500 border-2 border-white"></div>
                    <span className="text-green-300">Opportunities</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-yellow-500 border-2 border-white"></div>
                    <span className="text-yellow-300">URGENT (&lt;12h)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full border-2 border-red-500" style={{ background: 'rgba(239, 68, 68, 0.25)' }}></div>
                    <span className="text-red-300">Extreme Risk</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full border-2 border-orange-500" style={{ background: 'rgba(249, 115, 22, 0.25)' }}></div>
                    <span className="text-orange-300">High Risk</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full border-2 border-yellow-500" style={{ background: 'rgba(234, 179, 8, 0.25)' }}></div>
                    <span className="text-yellow-300">Moderate Risk</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Opportunities Sidebar */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-cyan-300">
                Top Deployment Zones
              </h2>
              
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {opportunities.slice(0, 10).map((opp, idx) => {
                  const hoursUntilPrePosition = Math.round((new Date(opp.optimalPrePositionTime).getTime() - Date.now()) / (1000 * 60 * 60));
                  const isUrgent = hoursUntilPrePosition <= 12;
                  const score = parseFloat(opp.opportunityScore);
                  
                  return (
                    <Card
                      key={opp.id}
                      className={`p-4 cursor-pointer transition-all ${
                        selectedOpportunity?.id === opp.id
                          ? 'bg-cyan-900/40 border-cyan-400'
                          : 'bg-slate-900/60 border-slate-700 hover:border-cyan-500/50'
                      }`}
                      onClick={() => setSelectedOpportunity(opp)}
                      data-testid={`sidebar-opportunity-${opp.id}`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="text-2xl font-bold text-cyan-300">#{idx + 1}</div>
                          <div>
                            <div className="font-bold text-white">{opp.county}</div>
                            <div className="text-xs text-gray-400">{opp.state}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-green-300">{formatCurrency(opp.estimatedRevenueOpportunity)}</div>
                          <div className="text-xs text-green-400">{opp.expectedJobCount} jobs</div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                        <div className="bg-black/30 rounded p-2">
                          <div className="text-gray-400">Score</div>
                          <div className="font-bold text-cyan-300">{score.toFixed(1)}/100</div>
                        </div>
                        <div className="bg-black/30 rounded p-2">
                          <div className="text-gray-400">Deploy</div>
                          <div className="font-bold text-yellow-300">{formatHoursUntil(opp.optimalPrePositionTime)}</div>
                        </div>
                      </div>

                      {isUrgent && (
                        <div className="bg-red-500/20 border border-red-500/50 rounded px-2 py-1 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-red-400" />
                          <span className="text-xs text-red-300 font-bold">URGENT - Deploy NOW</span>
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Status Badge */}
        <div className="mt-8 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" style={{ boxShadow: '0 0 10px rgba(0, 217, 255, 0.8)' }} />
          <span className="text-sm font-medium text-cyan-300">Live Deployment Intelligence Active</span>
        </div>
      </div>

      <ModuleAIAssistant moduleName="Deployment Map" />
    </div>
  );
}
