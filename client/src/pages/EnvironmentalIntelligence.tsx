import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Wind, 
  Droplets, 
  Cloud, 
  Thermometer, 
  Eye, 
  Gauge, 
  AlertTriangle, 
  Flower2, 
  Trees, 
  Flame,
  MapPin,
  Search,
  Activity,
  Sprout,
  CloudRain,
  Shield
} from 'lucide-react';

interface AirQualityData {
  AQI: number;
  CO: number;
  NO2: number;
  O3: number;
  PM10: number;
  PM25: number;
  SO2: number;
  updatedAt: string;
  location?: string;
}

interface HealthImpact {
  level: string;
  color: string;
  message: string;
  recommendations: string[];
}

interface PollenData {
  tree_pollen: { count: number; risk: string };
  grass_pollen: { count: number; risk: string };
  weed_pollen: { count: number; risk: string };
  updatedAt: string;
}

interface WeatherData {
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  cloudCover: number;
  visibility: number;
  dewPoint: number;
  pressure: number;
  precipIntensity: number;
  updatedAt: string;
}

interface FireData {
  fires: Array<{
    latitude: number;
    longitude: number;
    brightness: number;
    confidence: string;
    detectedAt: string;
  }>;
  count: number;
}

interface SoilData {
  soilMoisture: number;
  soilTemperature: number;
  updatedAt: string;
}

interface WaterVaporData {
  waterVapor: number;
  updatedAt: string;
}

interface EnvironmentalReport {
  location: string;
  airQuality: AirQualityData;
  healthImpact: HealthImpact;
  pollen: PollenData;
  weather: WeatherData;
  fire: FireData;
  soil: SoilData;
  waterVapor: WaterVaporData;
  timestamp: string;
}

export default function EnvironmentalIntelligence() {
  const [searchType, setSearchType] = useState<'coordinates' | 'place'>('place');
  const [place, setPlace] = useState('Miami, FL');
  const [lat, setLat] = useState('25.7617');
  const [lng, setLng] = useState('-80.1918');
  const [searchParams, setSearchParams] = useState<{ place?: string; lat?: string; lng?: string }>({ place: 'Miami, FL' });

  // Build query URL with parameters
  const buildQueryUrl = () => {
    if ('place' in searchParams && searchParams.place) {
      return `/api/ambee/environmental-report?place=${encodeURIComponent(searchParams.place)}`;
    } else if ('lat' in searchParams && 'lng' in searchParams) {
      return `/api/ambee/environmental-report?lat=${searchParams.lat}&lng=${searchParams.lng}`;
    }
    return '/api/ambee/environmental-report?place=Miami, FL';
  };

  const { data: report, isLoading } = useQuery<EnvironmentalReport>({
    queryKey: [buildQueryUrl()],
  });

  const handleSearch = () => {
    if (searchType === 'place' && place) {
      setSearchParams({ place });
    } else if (searchType === 'coordinates' && lat && lng) {
      setSearchParams({ lat, lng });
    }
  };

  const getAQIColor = (aqi: number) => {
    if (aqi <= 50) return 'bg-green-500';
    if (aqi <= 100) return 'bg-yellow-500';
    if (aqi <= 150) return 'bg-orange-500';
    if (aqi <= 200) return 'bg-red-500';
    if (aqi <= 300) return 'bg-purple-500';
    return 'bg-maroon-600';
  };

  const getPollenRiskColor = (risk: string) => {
    switch (risk.toLowerCase()) {
      case 'low': return 'bg-green-500';
      case 'moderate': return 'bg-yellow-500';
      case 'high': return 'bg-orange-500';
      case 'very high': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
            Environmental Intelligence
          </h1>
          <p className="text-muted-foreground mt-2">
            Real-time air quality, pollen, weather, and environmental hazard monitoring
          </p>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Location Search
          </CardTitle>
          <CardDescription>Search by place name or coordinates</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs value={searchType} onValueChange={(v) => setSearchType(v as 'coordinates' | 'place')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="place" data-testid="tab-place-search">Place Name</TabsTrigger>
              <TabsTrigger value="coordinates" data-testid="tab-coordinates-search">Coordinates</TabsTrigger>
            </TabsList>
            <TabsContent value="place" className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter city, state (e.g., Miami, FL)"
                  value={place}
                  onChange={(e) => setPlace(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  data-testid="input-place"
                />
                <Button onClick={handleSearch} data-testid="button-search-place">
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </div>
            </TabsContent>
            <TabsContent value="coordinates" className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Latitude"
                  type="number"
                  step="any"
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                  data-testid="input-latitude"
                />
                <Input
                  placeholder="Longitude"
                  type="number"
                  step="any"
                  value={lng}
                  onChange={(e) => setLng(e.target.value)}
                  data-testid="input-longitude"
                />
                <Button onClick={handleSearch} data-testid="button-search-coordinates">
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {isLoading && (
        <div className="text-center py-12" data-testid="loading-environmental">
          <Activity className="h-12 w-12 animate-spin mx-auto text-primary" />
          <p className="mt-4 text-muted-foreground">Loading environmental data...</p>
        </div>
      )}

      {report && !isLoading && (
        <>
          {/* Location Badge */}
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            <span className="font-semibold" data-testid="text-current-location">{report.location}</span>
            <Badge variant="outline" data-testid="text-last-updated">
              Updated: {new Date(report.timestamp).toLocaleString()}
            </Badge>
          </div>

          {/* Air Quality & Health Impact */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Air Quality Index
                </CardTitle>
                <CardDescription>Current air quality and pollutant levels</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className={`text-6xl font-bold ${getAQIColor(report.airQuality.AQI)} bg-clip-text text-transparent`} data-testid="text-aqi">
                    {report.airQuality.AQI}
                  </div>
                  <div className="flex-1">
                    <Badge className={getAQIColor(report.airQuality.AQI)} data-testid="badge-aqi-level">
                      {report.healthImpact.level}
                    </Badge>
                    <p className="text-sm text-muted-foreground mt-2">
                      {report.healthImpact.message}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="p-2 bg-secondary rounded" data-testid="text-pm25">
                    <div className="text-muted-foreground">PM2.5</div>
                    <div className="font-semibold">{report.airQuality.PM25}</div>
                  </div>
                  <div className="p-2 bg-secondary rounded" data-testid="text-pm10">
                    <div className="text-muted-foreground">PM10</div>
                    <div className="font-semibold">{report.airQuality.PM10}</div>
                  </div>
                  <div className="p-2 bg-secondary rounded" data-testid="text-o3">
                    <div className="text-muted-foreground">O₃</div>
                    <div className="font-semibold">{report.airQuality.O3}</div>
                  </div>
                  <div className="p-2 bg-secondary rounded" data-testid="text-no2">
                    <div className="text-muted-foreground">NO₂</div>
                    <div className="font-semibold">{report.airQuality.NO2}</div>
                  </div>
                  <div className="p-2 bg-secondary rounded" data-testid="text-so2">
                    <div className="text-muted-foreground">SO₂</div>
                    <div className="font-semibold">{report.airQuality.SO2}</div>
                  </div>
                  <div className="p-2 bg-secondary rounded" data-testid="text-co">
                    <div className="text-muted-foreground">CO</div>
                    <div className="font-semibold">{report.airQuality.CO}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-orange-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-orange-500" />
                  Contractor Safety Alert
                </CardTitle>
                <CardDescription>Health recommendations for field crew</CardDescription>
              </CardHeader>
              <CardContent>
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Work Safety Recommendations</AlertTitle>
                  <AlertDescription>
                    <ul className="mt-2 space-y-1 list-disc list-inside">
                      {report.healthImpact.recommendations.map((rec, idx) => (
                        <li key={idx} className="text-sm" data-testid={`text-safety-recommendation-${idx}`}>
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>

          {/* Pollen Levels */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Flower2 className="h-5 w-5" />
                Pollen Levels
              </CardTitle>
              <CardDescription>Current pollen counts and allergy risk</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Trees className="h-5 w-5 text-green-600" />
                    <span className="font-semibold">Tree Pollen</span>
                  </div>
                  <div className="text-2xl font-bold" data-testid="text-tree-pollen-count">{report.pollen.tree_pollen.count}</div>
                  <Badge className={getPollenRiskColor(report.pollen.tree_pollen.risk)} data-testid="badge-tree-pollen-risk">
                    {report.pollen.tree_pollen.risk}
                  </Badge>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Sprout className="h-5 w-5 text-green-500" />
                    <span className="font-semibold">Grass Pollen</span>
                  </div>
                  <div className="text-2xl font-bold" data-testid="text-grass-pollen-count">{report.pollen.grass_pollen.count}</div>
                  <Badge className={getPollenRiskColor(report.pollen.grass_pollen.risk)} data-testid="badge-grass-pollen-risk">
                    {report.pollen.grass_pollen.risk}
                  </Badge>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Flower2 className="h-5 w-5 text-purple-600" />
                    <span className="font-semibold">Weed Pollen</span>
                  </div>
                  <div className="text-2xl font-bold" data-testid="text-weed-pollen-count">{report.pollen.weed_pollen.count}</div>
                  <Badge className={getPollenRiskColor(report.pollen.weed_pollen.risk)} data-testid="badge-weed-pollen-risk">
                    {report.pollen.weed_pollen.risk}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Weather Data */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cloud className="h-5 w-5" />
                Weather Conditions
              </CardTitle>
              <CardDescription>Real-time atmospheric data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="flex items-center gap-3 p-3 bg-secondary rounded-lg">
                  <Thermometer className="h-8 w-8 text-red-500" />
                  <div>
                    <div className="text-sm text-muted-foreground">Temperature</div>
                    <div className="text-xl font-bold" data-testid="text-temperature">{report.weather.temperature}°F</div>
                    <div className="text-xs text-muted-foreground">Feels: {report.weather.apparentTemperature}°F</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-secondary rounded-lg">
                  <Droplets className="h-8 w-8 text-blue-500" />
                  <div>
                    <div className="text-sm text-muted-foreground">Humidity</div>
                    <div className="text-xl font-bold" data-testid="text-humidity">{report.weather.humidity}%</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-secondary rounded-lg">
                  <Wind className="h-8 w-8 text-cyan-500" />
                  <div>
                    <div className="text-sm text-muted-foreground">Wind Speed</div>
                    <div className="text-xl font-bold" data-testid="text-wind-speed">{report.weather.windSpeed} mph</div>
                    <div className="text-xs text-muted-foreground">Dir: {report.weather.windDirection}°</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-secondary rounded-lg">
                  <Gauge className="h-8 w-8 text-purple-500" />
                  <div>
                    <div className="text-sm text-muted-foreground">Pressure</div>
                    <div className="text-xl font-bold" data-testid="text-pressure">{report.weather.pressure} mb</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-secondary rounded-lg">
                  <Eye className="h-8 w-8 text-gray-500" />
                  <div>
                    <div className="text-sm text-muted-foreground">Visibility</div>
                    <div className="text-xl font-bold" data-testid="text-visibility">{report.weather.visibility} mi</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-secondary rounded-lg">
                  <Cloud className="h-8 w-8 text-gray-400" />
                  <div>
                    <div className="text-sm text-muted-foreground">Cloud Cover</div>
                    <div className="text-xl font-bold" data-testid="text-cloud-cover">{report.weather.cloudCover}%</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-secondary rounded-lg">
                  <CloudRain className="h-8 w-8 text-blue-600" />
                  <div>
                    <div className="text-sm text-muted-foreground">Precipitation</div>
                    <div className="text-xl font-bold" data-testid="text-precipitation">{report.weather.precipIntensity} in/hr</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-secondary rounded-lg">
                  <Droplets className="h-8 w-8 text-teal-500" />
                  <div>
                    <div className="text-sm text-muted-foreground">Dew Point</div>
                    <div className="text-xl font-bold" data-testid="text-dew-point">{report.weather.dewPoint}°F</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Fire & Soil Data */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Flame className="h-5 w-5 text-orange-600" />
                  Fire Activity
                </CardTitle>
                <CardDescription>Active fire detection in area</CardDescription>
              </CardHeader>
              <CardContent>
                {report.fire.count > 0 ? (
                  <div>
                    <Alert className="border-orange-500">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Active Fires Detected</AlertTitle>
                      <AlertDescription>
                        {report.fire.count} active fire(s) detected in this area
                      </AlertDescription>
                    </Alert>
                    <div className="mt-4 space-y-2">
                      {report.fire.fires.slice(0, 3).map((fire, idx) => (
                        <div key={idx} className="p-2 border rounded text-sm" data-testid={`text-fire-${idx}`}>
                          <div className="flex justify-between">
                            <span>Lat: {fire.latitude.toFixed(4)}, Lng: {fire.longitude.toFixed(4)}</span>
                            <Badge variant="outline">{fire.confidence}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground" data-testid="text-no-fires">
                    <Flame className="h-12 w-12 mx-auto mb-2 opacity-30" />
                    No active fires detected
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sprout className="h-5 w-5 text-green-600" />
                  Soil Conditions
                </CardTitle>
                <CardDescription>Ground moisture and temperature</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-secondary rounded-lg">
                  <div className="text-sm text-muted-foreground">Soil Moisture</div>
                  <div className="text-2xl font-bold" data-testid="text-soil-moisture">{(report.soil.soilMoisture * 100).toFixed(1)}%</div>
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${report.soil.soilMoisture * 100}%` }}
                    />
                  </div>
                </div>
                <div className="p-4 bg-secondary rounded-lg">
                  <div className="text-sm text-muted-foreground">Soil Temperature</div>
                  <div className="text-2xl font-bold" data-testid="text-soil-temperature">{report.soil.soilTemperature}°F</div>
                </div>
                <div className="p-4 bg-secondary rounded-lg">
                  <div className="text-sm text-muted-foreground">Water Vapor</div>
                  <div className="text-2xl font-bold" data-testid="text-water-vapor">{report.waterVapor.waterVapor} g/m³</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
