import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Thermometer, Wind, CloudRain, Gauge, Cloud, RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';
import { motion } from 'framer-motion';

interface WindyForecastPoint {
  ts: number;
  temp: number;
  wind_u: number;
  wind_v: number;
  precip: number;
  pressure: number;
  clouds: number;
  weather: string;
}

interface WindyPointForecastProps {
  lat?: number;
  lon?: number;
  locationName?: string;
}

export default function WindyPointForecast({ 
  lat = 28.5, 
  lon = -81.5, 
  locationName = 'Current Location' 
}: WindyPointForecastProps) {
  const [model, setModel] = useState('gfs');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['/api/windy/forecast/point', lat, lon, model],
    queryFn: async () => {
      const response = await fetch(`/api/windy/forecast/point?lat=${lat}&lon=${lon}&model=${model}`);
      if (!response.ok) throw new Error('Failed to fetch forecast');
      return response.json();
    },
    refetchInterval: 15 * 60 * 1000,
  });

  const forecast = (data?.forecast || []) as WindyForecastPoint[];
  const next24Hours = forecast.slice(0, 24);

  const calculateWindSpeed = (wind_u: number, wind_v: number): number => {
    return Math.sqrt(wind_u * wind_u + wind_v * wind_v);
  };

  const calculateWindDirection = (wind_u: number, wind_v: number): number => {
    return (Math.atan2(wind_u, wind_v) * 180 / Math.PI + 180) % 360;
  };

  const getWindDirection = (degrees: number): string => {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(degrees / 22.5) % 16;
    return directions[index];
  };

  const celsiusToFahrenheit = (celsius: number): number => {
    return (celsius * 9/5) + 32;
  };

  const metersPerSecondToMph = (mps: number): number => {
    return mps * 2.237;
  };

  return (
    <Card className="w-full" data-testid="card-windy-forecast">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-blue-600">
              <TrendingUp className="w-6 h-6" />
              Detailed Point Forecast
              <Badge variant="outline" className="ml-2">{locationName}</Badge>
            </CardTitle>
            <CardDescription>
              Hourly weather forecast powered by Windy Point Forecast API
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Select value={model} onValueChange={setModel}>
              <SelectTrigger className="w-[140px]" data-testid="select-forecast-model">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gfs">GFS (USA)</SelectItem>
                <SelectItem value="ecmwf">ECMWF (EU)</SelectItem>
                <SelectItem value="icon">ICON (DWD)</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              data-testid="button-refresh-forecast"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : forecast.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <Cloud className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p>No forecast data available</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg">
              <div className="text-center">
                <Thermometer className="w-6 h-6 mx-auto mb-1 text-red-500" />
                <div className="text-2xl font-bold">
                  {Math.round(celsiusToFahrenheit(next24Hours[0]?.temp || 0))}°F
                </div>
                <div className="text-xs text-gray-500">Current Temp</div>
              </div>
              <div className="text-center">
                <Wind className="w-6 h-6 mx-auto mb-1 text-blue-500" />
                <div className="text-2xl font-bold">
                  {Math.round(metersPerSecondToMph(calculateWindSpeed(next24Hours[0]?.wind_u || 0, next24Hours[0]?.wind_v || 0)))} mph
                </div>
                <div className="text-xs text-gray-500">Wind Speed</div>
              </div>
              <div className="text-center">
                <CloudRain className="w-6 h-6 mx-auto mb-1 text-indigo-500" />
                <div className="text-2xl font-bold">
                  {(next24Hours[0]?.precip || 0).toFixed(1)} mm
                </div>
                <div className="text-xs text-gray-500">Precipitation</div>
              </div>
              <div className="text-center">
                <Gauge className="w-6 h-6 mx-auto mb-1 text-purple-500" />
                <div className="text-2xl font-bold">
                  {Math.round(next24Hours[0]?.pressure || 0)} hPa
                </div>
                <div className="text-xs text-gray-500">Pressure</div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <div className="min-w-[800px]">
                <div className="grid grid-cols-8 gap-2 text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 px-2">
                  <div>Time</div>
                  <div>Conditions</div>
                  <div className="text-center">Temp</div>
                  <div className="text-center">Wind</div>
                  <div className="text-center">Direction</div>
                  <div className="text-center">Precip</div>
                  <div className="text-center">Clouds</div>
                  <div className="text-center">Pressure</div>
                </div>
                <div className="space-y-1">
                  {next24Hours.map((point, index) => {
                    const windSpeed = calculateWindSpeed(point.wind_u, point.wind_v);
                    const windDir = calculateWindDirection(point.wind_u, point.wind_v);
                    const tempF = celsiusToFahrenheit(point.temp);
                    const windMph = metersPerSecondToMph(windSpeed);

                    return (
                      <motion.div
                        key={point.ts}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.02 }}
                        className="grid grid-cols-8 gap-2 text-sm p-2 rounded bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                        data-testid={`forecast-hour-${index}`}
                      >
                        <div className="font-medium">
                          {new Date(point.ts).toLocaleTimeString('en-US', { hour: 'numeric', hour12: true })}
                        </div>
                        <div className="flex items-center gap-1">
                          <Badge variant="secondary" className="text-xs">
                            {point.weather}
                          </Badge>
                        </div>
                        <div className="text-center font-semibold">
                          {Math.round(tempF)}°F
                        </div>
                        <div className="text-center">
                          {Math.round(windMph)} mph
                        </div>
                        <div className="text-center">
                          {getWindDirection(windDir)}
                        </div>
                        <div className="text-center">
                          {point.precip.toFixed(1)} mm
                        </div>
                        <div className="text-center">
                          {Math.round(point.clouds)}%
                        </div>
                        <div className="text-center">
                          {Math.round(point.pressure)} hPa
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
