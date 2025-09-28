import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import L, { LatLngBounds, LatLng } from 'leaflet';
import { Activity, RefreshCw, ZoomIn, ZoomOut, MapPin, Navigation, Globe, Map as MapIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Earth3DGlobe from '../components/Earth3DGlobe';
import 'leaflet/dist/leaflet.css';

// Interactive Weather Map Component
function WeatherMapControls() {
  const map = useMap();
  
  const zoomToHurricane = () => {
    // Focus on Gulf of Mexico / Atlantic where hurricanes typically form
    map.setView([25.7617, -80.1918], 6); // Miami area for hurricane tracking
  };

  const zoomToStreetLevel = () => {
    map.setZoom(15); // Street level zoom
  };

  useMapEvents({
    click: (e) => {
      console.log('Map clicked at:', e.latlng);
    },
    zoom: (e) => {
      console.log('Current zoom level:', map.getZoom());
    }
  });

  return null;
}

// Real-time Weather Overlay Component  
function LiveWeatherOverlay() {
  const map = useMap();
  const [weatherLayer, setWeatherLayer] = useState<L.TileLayer | null>(null);

  useEffect(() => {
    const addWeatherOverlay = () => {
      // Remove existing layer
      if (weatherLayer) {
        map.removeLayer(weatherLayer);
      }

      // Add live weather radar overlay from NOAA
      const newWeatherLayer = L.tileLayer(
        'https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/nexrad-n0q-900913/{z}/{x}/{y}.png',
        {
          attribution: 'Weather data © NOAA/NWS',
          opacity: 0.6,
          maxZoom: 18
        }
      );

      newWeatherLayer.addTo(map);
      setWeatherLayer(newWeatherLayer);
    };

    addWeatherOverlay();

    // Update weather overlay every 5 minutes
    const interval = setInterval(addWeatherOverlay, 300000);

    return () => {
      clearInterval(interval);
      if (weatherLayer) {
        map.removeLayer(weatherLayer);
      }
    };
  }, [map]);

  return null;
}

export default function LiveStormView() {
  const [currentLocation, setCurrentLocation] = useState<[number, number]>([25.7617, -80.1918]); // Miami area
  const [zoomLevel, setZoomLevel] = useState(6);
  const [isLiveMode, setIsLiveMode] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [weatherVisible, setWeatherVisible] = useState(true);
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d');

  // Auto-update live data
  useEffect(() => {
    const updateLiveData = () => {
      setLastUpdate(new Date());
    };

    // Update every 5 minutes for live weather data
    const interval = setInterval(updateLiveData, 300000);
    updateLiveData(); // Initial update

    return () => clearInterval(interval);
  }, []);

  // Get user's current location for live tracking
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentLocation([latitude, longitude]);
          setZoomLevel(12); // Zoom to street level
        },
        (error) => {
          console.warn('Could not get location:', error);
        }
      );
    }
  };

  const quickJumpLocations = [
    { name: "Miami Hurricane Center", coords: [25.7617, -80.1918] as [number, number], zoom: 8 },
    { name: "New Orleans Gulf Coast", coords: [29.9511, -90.0715] as [number, number], zoom: 8 },
    { name: "Houston Storm Zone", coords: [29.7604, -95.3698] as [number, number], zoom: 8 },
    { name: "Tampa Bay Area", coords: [27.9506, -82.4572] as [number, number], zoom: 8 },
    { name: "Atlantic Hurricane Alley", coords: [25.0000, -75.0000] as [number, number], zoom: 5 },
  ];

  const jumpToLocation = (coords: [number, number], zoom: number) => {
    setCurrentLocation(coords);
    setZoomLevel(zoom);
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short'
    }).format(date);
  };

  return (
    <div className="space-y-6">
      {/* Live Map Controls */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Activity className="h-5 w-5 text-red-500 animate-pulse" />
            <span className="font-semibold text-gray-900 dark:text-white">LIVE Interactive Storm Map</span>
          </div>
          
          <div className="flex space-x-2">
            <Badge variant="secondary" className="bg-red-100 text-red-800">
              LIVE TRACKING
            </Badge>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              {viewMode === '3d' ? '3D Globe View' : 'Street Level Ready'}
            </Badge>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            onClick={() => setViewMode(viewMode === '2d' ? '3d' : '2d')}
            variant={viewMode === '3d' ? "default" : "outline"}
            size="sm"
            className="gap-2"
          >
            {viewMode === '2d' ? <Globe className="h-4 w-4" /> : <MapIcon className="h-4 w-4" />}
            {viewMode === '2d' ? '3D Globe' : '2D Map'}
          </Button>
          
          <Button
            onClick={getCurrentLocation}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <Navigation className="h-4 w-4" />
            My Location
          </Button>
          
          {viewMode === '2d' && (
            <Button
              onClick={() => setWeatherVisible(!weatherVisible)}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <Activity className="h-4 w-4" />
              {weatherVisible ? 'Hide' : 'Show'} Weather
            </Button>
          )}
        </div>
      </div>

      {/* Quick Jump Locations */}
      <div className="flex flex-wrap gap-2">
        {quickJumpLocations.map((location, index) => (
          <Button
            key={index}
            onClick={() => jumpToLocation(location.coords, location.zoom)}
            variant="outline"
            size="sm"
            className="text-xs"
          >
            <MapPin className="h-3 w-3 mr-1" />
            {location.name}
          </Button>
        ))}
      </div>

      {/* Interactive Live Map - 2D/3D View */}
      {viewMode === '2d' ? (
        <Card className="border-red-200 shadow-lg">
          <CardContent className="p-0">
            <div className="w-full h-[600px] relative rounded-lg overflow-hidden">
              <MapContainer
                center={currentLocation}
                zoom={zoomLevel}
                style={{ height: '100%', width: '100%' }}
                className="z-0"
              >
                {/* Base Map Layers */}
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                
                {/* Satellite View Layer */}
                <TileLayer
                  url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                  attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
                  opacity={0.3}
                />

                {/* Live Weather Overlay */}
                {weatherVisible && <LiveWeatherOverlay />}
                
                {/* Map Controls and Events */}
                <WeatherMapControls />
              </MapContainer>
              
              {/* Live Data Overlay */}
              <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-sm rounded-lg p-3 text-white text-xs space-y-2 z-10">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="font-semibold">LIVE MODE ACTIVE</span>
                </div>
                <div className="text-gray-300">Last Update: {formatTime(lastUpdate)}</div>
                <div className="text-gray-300">Zoom: {zoomLevel} (Street Level: 15+)</div>
                <div className="text-gray-300">
                  {zoomLevel >= 15 ? "🛣️ Street Level View" : "🌍 Regional View"}
                </div>
              </div>

              {/* Map Legend */}
              <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 text-xs space-y-1 z-10">
                <div className="font-semibold mb-2">Weather Legend</div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                  <span>Light Rain</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                  <span>Moderate Rain</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-orange-500 rounded"></div>
                  <span>Heavy Rain</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded"></div>
                  <span>Severe/Storm</span>
                </div>
              </div>

              {/* Navigation Instructions */}
              <div className="absolute top-4 right-4 bg-blue-500/90 backdrop-blur-sm rounded-lg p-3 text-white text-xs z-10">
                <div className="font-semibold mb-1">Navigation</div>
                <div>• Scroll to zoom in/out</div>
                <div>• Drag to pan around</div>
                <div>• Click locations for details</div>
                <div>• Zoom 15+ for streets</div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Earth3DGlobe />
      )}

      {/* Real-time Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <Activity className="h-5 w-5" />
              Live Weather Radar
            </CardTitle>
            <CardDescription>Real-time precipitation tracking</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Update Frequency:</span>
                <span className="text-sm font-medium">5 minutes</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Coverage:</span>
                <span className="text-sm font-medium">CONUS + Caribbean</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Resolution:</span>
                <span className="text-sm font-medium">1km precision</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-600">
              {viewMode === '2d' ? <MapPin className="h-5 w-5" /> : <Globe className="h-5 w-5" />}
              Interactive Navigation
            </CardTitle>
            <CardDescription>
              {viewMode === '2d' ? 'Street-level storm tracking' : '3D global storm visualization'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">View Type:</span>
                <span className="text-sm font-medium">{viewMode === '2d' ? '2D Map' : '3D Globe'}</span>
              </div>
              {viewMode === '2d' ? (
                <>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Current Zoom:</span>
                    <span className="text-sm font-medium">{zoomLevel}x</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">View Mode:</span>
                    <span className="text-sm font-medium">
                      {zoomLevel >= 15 ? "Streets" : zoomLevel >= 10 ? "Neighborhoods" : "Regional"}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Globe View:</span>
                    <span className="text-sm font-medium">Real-time 3D</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Storm Tracking:</span>
                    <span className="text-sm font-medium">Global Scale</span>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <RefreshCw className="h-5 w-5" />
              Live Data Status
            </CardTitle>
            <CardDescription>Real-time monitoring active</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Status:</span>
                <span className="text-sm font-medium text-green-600">● LIVE</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Last Update:</span>
                <span className="text-sm font-medium">{formatTime(lastUpdate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Auto-Refresh:</span>
                <span className="text-sm font-medium">Enabled</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}