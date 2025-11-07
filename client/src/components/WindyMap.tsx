import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Wind, Radar, Camera, Satellite, Eye } from 'lucide-react';

interface WindyMapProps {
  defaultLat?: number;
  defaultLon?: number;
  defaultZoom?: number;
  height?: string;
}

export default function WindyMap({ 
  defaultLat = 28.5, 
  defaultLon = -81.5, 
  defaultZoom = 6,
  height = "600px" 
}: WindyMapProps) {
  const [layer, setLayer] = useState('wind');
  const [product, setProduct] = useState('ecmwf');

  // Windy Embed URL with customizable layers
  const getWindyUrl = () => {
    const baseUrl = 'https://embed.windy.com/embed2.html';
    const params = new URLSearchParams({
      lat: defaultLat.toString(),
      lon: defaultLon.toString(),
      detailLat: defaultLat.toString(),
      detailLon: defaultLon.toString(),
      width: '100%',
      height: height,
      zoom: defaultZoom.toString(),
      level: 'surface',
      overlay: layer, // wind, rain, clouds, temp, etc.
      product: product, // ecmwf, gfs, icon
      menu: '',
      message: 'true',
      marker: '',
      calendar: 'now',
      pressure: '',
      type: 'map',
      location: 'coordinates',
      detail: '',
      metricWind: 'mph',
      metricTemp: 'default',
      radarRange: '-1'
    });
    
    return `${baseUrl}?${params.toString()}`;
  };

  return (
    <Card className="w-full" data-testid="card-windy-map">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-blue-600">
              <Wind className="w-6 h-6" />
              Windy - Live Weather Map
            </CardTitle>
            <CardDescription>
              Interactive weather visualization with animated wind patterns, rain, clouds, webcams, and Radar+
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Select value={layer} onValueChange={setLayer}>
              <SelectTrigger className="w-[180px]" data-testid="select-windy-layer">
                <SelectValue placeholder="Select layer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="wind">
                  <div className="flex items-center gap-2">
                    <Wind className="w-4 h-4" />
                    Wind Pattern
                  </div>
                </SelectItem>
                <SelectItem value="rain">
                  <div className="flex items-center gap-2">
                    <Radar className="w-4 h-4" />
                    Rain/Showers
                  </div>
                </SelectItem>
                <SelectItem value="clouds">
                  <div className="flex items-center gap-2">
                    <Satellite className="w-4 h-4" />
                    Clouds
                  </div>
                </SelectItem>
                <SelectItem value="temp">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    Temperature
                  </div>
                </SelectItem>
                <SelectItem value="radar">
                  <div className="flex items-center gap-2">
                    <Radar className="w-4 h-4" />
                    Radar+ (Live)
                  </div>
                </SelectItem>
                <SelectItem value="satellite">
                  <div className="flex items-center gap-2">
                    <Satellite className="w-4 h-4" />
                    Satellite
                  </div>
                </SelectItem>
                <SelectItem value="pressure">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    Pressure
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            <Select value={product} onValueChange={setProduct}>
              <SelectTrigger className="w-[140px]" data-testid="select-windy-model">
                <SelectValue placeholder="Model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ecmwf">ECMWF (EU)</SelectItem>
                <SelectItem value="gfs">GFS (USA)</SelectItem>
                <SelectItem value="icon">ICON (DWD)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
          <iframe 
            src={getWindyUrl()}
            style={{ 
              width: '100%', 
              height: height,
              border: 'none',
              borderRadius: '8px'
            }}
            title="Windy Weather Map"
            allow="geolocation"
            data-testid="iframe-windy-map"
          />
        </div>
        
        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-200 flex items-center gap-2">
            <Camera className="w-4 h-4" />
            <strong>Pro Tip:</strong> Click the layers icon in the top-right corner of the map to access Webcams (live camera feeds) and additional weather layers!
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
