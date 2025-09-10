import { useState, useEffect } from 'react';
import { useQuery, useQueries } from '@tanstack/react-query';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  AlertTriangle
} from 'lucide-react';

interface WeatherAlert {
  id: string;
  title: string;
  description: string;
  severity: string;
  alertType: string;
  areas: string[];
  startTime: Date;
  endTime?: Date;
  geometry?: any;
  urgency?: string;
  certainty?: string;
  category?: string;
}

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

export default function WeatherCenter() {
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds

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
    ],
  });

  const [alertsQuery, spcQuery, nhcQuery] = weatherQueries;
  const alerts: WeatherAlert[] = alertsQuery.data || [];
  const spcData: SPCData[] = spcQuery.data || [];
  const nhcData: { storms: NHCStorm[] } = nhcQuery.data || { storms: [] };

  const isLoading = weatherQueries.some(q => q.isLoading);
  const hasError = weatherQueries.some(q => q.error);

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

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="weather-center-title">
            🌩️ Weather Operations Center
          </h1>
          <p className="text-muted-foreground">
            Live government weather data and emergency monitoring
          </p>
        </div>
        
        {/* Controls */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant={autoRefresh ? "default" : "outline"}
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
              data-testid="button-auto-refresh"
            >
              {autoRefresh ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {autoRefresh ? 'Pause' : 'Resume'} Auto-Refresh
            </Button>
            
            <select 
              value={refreshInterval} 
              onChange={(e) => setRefreshInterval(Number(e.target.value))}
              className="px-3 py-1 border rounded"
              data-testid="select-refresh-interval"
            >
              <option value={10000}>10s</option>
              <option value={30000}>30s</option>
              <option value={60000}>1m</option>
              <option value={300000}>5m</option>
            </select>
          </div>
          
          {userLocation && (
            <Badge variant="outline" data-testid="badge-location">
              <MapPin className="w-3 h-3 mr-1" />
              {userLocation.lat.toFixed(2)}, {userLocation.lon.toFixed(2)}
            </Badge>
          )}
        </div>
      </div>

      {/* Status indicators */}
      <div className="flex gap-4">
        <Badge variant={isLoading ? "secondary" : "default"} data-testid="badge-status">
          <RefreshCw className={`w-3 h-3 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
          {isLoading ? 'Loading...' : 'Live Data'}
        </Badge>
        
        {hasError && (
          <Badge variant="destructive" data-testid="badge-error">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Connection Issues
          </Badge>
        )}
        
        <Badge variant="outline" data-testid="badge-alerts-count">
          {alerts.length} Active Alerts
        </Badge>
        
        <Badge variant="outline" data-testid="badge-storms-count">
          {nhcData.storms.length} Active Storms
        </Badge>
      </div>

      {/* Main Weather Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6" data-testid="tabs-weather">
          <TabsTrigger value="overview" data-testid="tab-overview">
            <Eye className="w-4 h-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="alerts" data-testid="tab-alerts">
            <AlertTriangle className="w-4 h-4 mr-2" />
            Alerts
          </TabsTrigger>
          <TabsTrigger value="radar" data-testid="tab-radar">
            <Radar className="w-4 h-4 mr-2" />
            Radar+Lightning
          </TabsTrigger>
          <TabsTrigger value="satellite" data-testid="tab-satellite">
            <Satellite className="w-4 h-4 mr-2" />
            Satellite+MRMS
          </TabsTrigger>
          <TabsTrigger value="hurricanes" data-testid="tab-hurricanes">
            <Wind className="w-4 h-4 mr-2" />
            Hurricanes+SPC
          </TabsTrigger>
          <TabsTrigger value="models" data-testid="tab-models">
            <CloudRain className="w-4 h-4 mr-2" />
            Models+External
          </TabsTrigger>
        </TabsList>

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
                      {alerts.map((alert, index) => 
                        alert.geometry && (
                          <GeoJSON
                            key={`alert-${index}`}
                            data={alert.geometry}
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
                        )
                      )}
                      
                      {/* SPC Outlooks */}
                      {spcData.map((outlook, index) => 
                        outlook.geometry && (
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
                        )
                      )}
                      
                      {/* Hurricane Points */}
                      {nhcData.storms.map((storm, index) => 
                        storm.geometry && (
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
                        )
                      )}
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

        <TabsContent value="satellite">
          <Card>
            <CardHeader>
              <CardTitle>🛰️ Satellite & MRMS</CardTitle>
              <CardDescription>GOES satellite imagery and MRMS precipitation data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                🚧 Satellite and MRMS data coming soon
              </div>
            </CardContent>
          </Card>
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
    </div>
  );
}