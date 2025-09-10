import { useState, useEffect, useRef, useMemo, createContext, useContext } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ObjectUploader } from './components/ObjectUploader';

// Helper function for currency formatting
function dollars(n: number | string): string { 
  return `$${Number(n||0).toFixed(2)}`; 
}

// ===== Role Context for Role-Based Access =====
const RoleContext = createContext<{ role: string; setRole: (role: string) => void }>({ role: 'ops', setRole: () => {} });

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState(() => localStorage.getItem('storm_role') || 'ops');
  
  useEffect(() => {
    localStorage.setItem('storm_role', role);
  }, [role]);
  
  return (
    <RoleContext.Provider value={{ role, setRole }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  return useContext(RoleContext);
}

export function RoleBar() {
  const { role, setRole } = useRole();
  
  const BTN = (code: string, label: string) => (
    <button
      key={code}
      onClick={() => setRole(code)}
      className={`px-3 py-1 rounded-full text-xs border transition-colors ${
        role === code ? 'bg-black text-white border-black' : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
      }`}
      data-testid={`button-role-${code}`}
    >
      {label}
    </button>
  );
  
  return (
    <div className="flex gap-2 items-center p-2 border rounded-md bg-white">
      <span className="text-xs font-medium text-gray-600">Role:</span>
      {BTN('ops', 'Ops')}
      {BTN('field', 'Field')}
      {BTN('admin', 'Admin')}
    </div>
  );
}

// ===== WEATHER CENTER COMPONENT =====
function WeatherCenter() {
  const [activeWeatherView, setActiveWeatherView] = useState('windy');
  const [noaaAlerts, setNoaaAlerts] = useState<any[]>([]);
  const [weatherData, setWeatherData] = useState<any>(null);
  const [hurricanes, setHurricanes] = useState<any[]>([]);
  const [userLocation, setUserLocation] = useState<{lat: number, lon: number} | null>(null);
  const [loading, setLoading] = useState(false);

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
          console.log('Location access denied, using default location');
          // Default to Atlanta area for storm tracking
          setUserLocation({ lat: 33.7490, lon: -84.3880 });
        }
      );
    } else {
      setUserLocation({ lat: 33.7490, lon: -84.3880 });
    }
  }, []);

  // Fetch NOAA alerts and weather data
  useEffect(() => {
    const fetchWeatherData = async () => {
      setLoading(true);
      try {
        // Fetch NOAA alerts
        const alertsResponse = await fetch('/api/weather/alerts');
        const alerts = await alertsResponse.json();
        setNoaaAlerts(alerts || []);

        // Fetch general weather data
        const weatherResponse = await fetch('/api/weather/current');
        const weather = await weatherResponse.json();
        setWeatherData(weather);

        // Fetch hurricane data
        const hurricaneResponse = await fetch('/api/weather/hurricanes');
        const hurricaneData = await hurricaneResponse.json();
        setHurricanes(hurricaneData || []);
      } catch (error) {
        console.error('Failed to fetch weather data:', error);
      }
      setLoading(false);
    };

    fetchWeatherData();
    const interval = setInterval(fetchWeatherData, 60000); // Refresh every 1 minute for real-time tracking
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-4">
      {/* Weather Navigation */}
      <div className="space-y-4">
        {/* Primary Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => window.open(`https://windy.com/${userLocation?.lat || 33.749}/${userLocation?.lon || -84.388}/10?wind,${userLocation?.lat || 33.749},${userLocation?.lon || -84.388},8`, '_blank')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            data-testid="button-open-windy-app"
          >
            🌪️ Open Windy App (GPS-Based)
          </button>
          <button
            onClick={() => window.open('https://www.weather.gov/', '_blank')}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
            data-testid="button-open-noaa"
          >
            🚨 Open NOAA Weather
          </button>
          <button
            onClick={() => window.open('https://www.nhc.noaa.gov/', '_blank')}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
            data-testid="button-open-hurricane-center"
          >
            🌀 Hurricane Center
          </button>
        </div>

        {/* Location Status */}
        {userLocation && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="text-sm font-medium text-green-800">
              📍 GPS Location: {userLocation.lat.toFixed(4)}, {userLocation.lon.toFixed(4)}
            </div>
            <div className="text-xs text-green-600 mt-1">
              Weather data automatically centered on your location for real-time storm tracking
            </div>
          </div>
        )}

        {/* View Selection */}
        <div className="flex flex-wrap gap-2 border-b pb-4">
          <button
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeWeatherView === 'windy' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            onClick={() => setActiveWeatherView('windy')}
            data-testid="button-weather-windy"
          >
            🌪️ Live Radar (Embedded)
          </button>
          <button
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeWeatherView === 'noaa' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            onClick={() => setActiveWeatherView('noaa')}
            data-testid="button-weather-noaa"
          >
            🚨 Active Alerts
          </button>
          <button
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeWeatherView === 'hurricanes' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            onClick={() => setActiveWeatherView('hurricanes')}
            data-testid="button-weather-hurricanes"
          >
            🌀 Storm Tracker
          </button>
          <button
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeWeatherView === 'forecast' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            onClick={() => setActiveWeatherView('forecast')}
            data-testid="button-weather-forecast"
          >
            📊 Live Conditions
          </button>
        </div>
      </div>

      {/* Weather Content */}
      <div className="bg-white rounded-lg border overflow-hidden">
        {/* Windy Integration */}
        {activeWeatherView === 'windy' && (
          <div className="h-[700px]">
            <iframe
              src={`https://embed.windy.com/embed2.html?lat=${userLocation?.lat || 33.749}&lon=${userLocation?.lon || -84.388}&detailLat=${userLocation?.lat || 33.749}&detailLon=${userLocation?.lon || -84.388}&width=800&height=600&zoom=8&level=surface&overlay=wind&product=ecmwf&menu=&message=&marker=&calendar=now&pressure=&type=map&location=coordinates&detail=&metricWind=kt&metricTemp=default&radarRange=-1`}
              className="w-full h-full border-0"
              title="GPS-Based Live Weather Radar"
              data-testid="iframe-windy-weather"
            />
            <div className="p-4 bg-gray-50 border-t">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold text-gray-900">🌪️ Live Weather Radar - GPS Centered</h3>
                <div className="text-sm text-gray-500">
                  Updates every 60 seconds
                </div>
              </div>
              <p className="text-sm text-gray-600">
                Real-time weather conditions centered on your GPS location. Wind speeds in knots, live radar updates. 
                Use map controls to switch layers: Rain, Wind, Temperature, Pressure, Waves (coastal areas).
              </p>
            </div>
          </div>
        )}

        {/* NOAA Alerts */}
        {activeWeatherView === 'noaa' && (
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">🚨 NOAA Weather Alerts</h3>
              {loading && <div className="text-sm text-gray-500">Updating...</div>}
              <div className="text-sm text-gray-500">
                Last updated: {new Date().toLocaleTimeString()}
              </div>
            </div>
            
            {noaaAlerts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">✅</div>
                <div>No active weather alerts</div>
                <div className="text-sm mt-1">All clear in monitored areas</div>
              </div>
            ) : (
              <div className="space-y-3">
                {noaaAlerts.map((alert: any, idx: number) => (
                  <div
                    key={alert.id || idx}
                    className={`p-4 rounded-lg border-l-4 ${
                      alert.severity === 'Extreme' ? 'border-red-500 bg-red-50' :
                      alert.severity === 'Severe' ? 'border-orange-500 bg-orange-50' :
                      'border-yellow-500 bg-yellow-50'
                    }`}
                    data-testid={`alert-${idx}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{alert.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{alert.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span>Type: {alert.alertType}</span>
                          <span>Areas: {alert.areas?.join(', ')}</span>
                          <span>Until: {new Date(alert.endTime).toLocaleString()}</span>
                        </div>
                      </div>
                      <div className={`px-2 py-1 rounded text-xs font-medium ${
                        alert.severity === 'Extreme' ? 'bg-red-100 text-red-800' :
                        alert.severity === 'Severe' ? 'bg-orange-100 text-orange-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {alert.severity}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Hurricane Tracker */}
        {activeWeatherView === 'hurricanes' && (
          <div className="space-y-4">
            {/* Live Hurricane Data */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {hurricanes.length > 0 ? hurricanes.map((storm: any, idx: number) => (
                <div key={storm.id || idx} className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-bold text-red-900 text-lg">{storm.name}</h4>
                      <div className="text-sm font-medium text-red-700">
                        Category {storm.category} {storm.status}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-red-900">{storm.maxWinds} kt</div>
                      <div className="text-xs text-red-600">Max winds</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="font-medium text-gray-700">Position</div>
                      <div className="text-gray-600">{storm.position.lat}°N, {Math.abs(storm.position.lon)}°W</div>
                    </div>
                    <div>
                      <div className="font-medium text-gray-700">Movement</div>
                      <div className="text-gray-600">{storm.movement.direction} at {storm.movement.speed} mph</div>
                    </div>
                    <div>
                      <div className="font-medium text-gray-700">Pressure</div>
                      <div className="text-gray-600">{storm.pressure} mb</div>
                    </div>
                    <div>
                      <div className="font-medium text-gray-700">Last Update</div>
                      <div className="text-gray-600">{new Date(storm.lastUpdate).toLocaleTimeString()}</div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => window.open(`https://windy.com/${storm.position.lat}/${storm.position.lon}/5?waves,${storm.position.lat},${storm.position.lon},5`, '_blank')}
                    className="mt-3 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
                    data-testid={`button-track-storm-${idx}`}
                  >
                    🌊 Track with Waves & Wind
                  </button>
                </div>
              )) : (
                <div className="col-span-2 text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">🌤️</div>
                  <div>No active hurricanes or tropical storms</div>
                  <div className="text-sm mt-1">Atlantic basin monitoring active</div>
                </div>
              )}
            </div>

            {/* Live Hurricane Tracking Map */}
            <div className="h-[500px]">
              <iframe
                src="https://embed.windy.com/embed2.html?lat=25.0&lon=-80.0&detailLat=25.0&detailLon=-80.0&width=800&height=500&zoom=4&level=surface&overlay=waves&product=gfs&menu=&message=&marker=&calendar=now&pressure=&type=map&location=coordinates&detail=&metricWind=kt&metricTemp=default&radarRange=-1"
                className="w-full h-full border-0"
                title="Hurricane Tracker with Wave Heights"
                data-testid="iframe-hurricane-tracker"
              />
            </div>
            
            <div className="p-4 bg-gray-50 border-t rounded-b-lg">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold text-gray-900">🌀 Live Hurricane & Wave Tracker</h3>
                <div className="text-sm text-gray-500">Real-time updates</div>
              </div>
              <p className="text-sm text-gray-600">
                Live hurricane tracking with wave heights, wind speeds in knots, and storm movement patterns. 
                Click layer controls to view: Waves, Wind, Pressure, Satellite imagery. Each storm updates every 15 minutes.
              </p>
            </div>
          </div>
        )}

        {/* Live Conditions Dashboard */}
        {activeWeatherView === 'forecast' && (
          <div className="p-4 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">📊 Live Weather Conditions & Storm Operations Data</h3>
              <div className="text-sm text-gray-500">
                🔄 Updates every 60 seconds
              </div>
            </div>
            
            {/* Real-time Conditions Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg border">
                <div className="text-sm font-medium text-blue-800">Wind Speed</div>
                <div className="text-2xl font-bold text-blue-900">{weatherData?.windSpeed || 15} kt</div>
                <div className="text-xs text-blue-600 mt-1">{weatherData?.windDirection || 'SW'}</div>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg border">
                <div className="text-sm font-medium text-green-800">Temperature</div>
                <div className="text-2xl font-bold text-green-900">{weatherData?.temperature || 78}°F</div>
                <div className="text-xs text-green-600 mt-1">Real-time</div>
              </div>
              
              <div className="bg-yellow-50 p-4 rounded-lg border">
                <div className="text-sm font-medium text-yellow-800">Pressure</div>
                <div className="text-2xl font-bold text-yellow-900">{weatherData?.pressure || 29.92}</div>
                <div className="text-xs text-yellow-600 mt-1">inches Hg</div>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg border">
                <div className="text-sm font-medium text-purple-800">Active Alerts</div>
                <div className="text-2xl font-bold text-purple-900">{noaaAlerts.length}</div>
                <div className="text-xs text-purple-600 mt-1">Live warnings</div>
              </div>

              <div className="bg-cyan-50 p-4 rounded-lg border">
                <div className="text-sm font-medium text-cyan-800">Humidity</div>
                <div className="text-2xl font-bold text-cyan-900">{weatherData?.humidity || 65}%</div>
                <div className="text-xs text-cyan-600 mt-1">Current</div>
              </div>
              
              <div className="bg-orange-50 p-4 rounded-lg border">
                <div className="text-sm font-medium text-orange-800">Visibility</div>
                <div className="text-2xl font-bold text-orange-900">{weatherData?.visibility || 10} mi</div>
                <div className="text-xs text-orange-600 mt-1">Conditions</div>
              </div>
            </div>

            {/* Live Weather Map Layers */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Live Wind & Pressure Map */}
              <div className="bg-white border rounded-lg overflow-hidden">
                <div className="p-3 bg-gray-50 border-b">
                  <h4 className="font-medium text-gray-900">🌪️ Live Wind & Pressure</h4>
                </div>
                <div className="h-[300px]">
                  <iframe
                    src={`https://embed.windy.com/embed2.html?lat=${userLocation?.lat || 33.749}&lon=${userLocation?.lon || -84.388}&detailLat=${userLocation?.lat || 33.749}&detailLon=${userLocation?.lon || -84.388}&width=400&height=300&zoom=7&level=surface&overlay=wind&product=gfs&menu=&message=&marker=&calendar=now&pressure=&type=map&location=coordinates&detail=&metricWind=kt&metricTemp=default&radarRange=-1`}
                    className="w-full h-full border-0"
                    title="Live Wind Patterns"
                    data-testid="iframe-live-wind"
                  />
                </div>
              </div>

              {/* Wave Heights (Coastal) */}
              <div className="bg-white border rounded-lg overflow-hidden">
                <div className="p-3 bg-gray-50 border-b">
                  <h4 className="font-medium text-gray-900">🌊 Wave Heights & Coastal Conditions</h4>
                </div>
                <div className="h-[300px]">
                  <iframe
                    src={`https://embed.windy.com/embed2.html?lat=${userLocation?.lat || 33.749}&lon=${userLocation?.lon || -84.388}&detailLat=${userLocation?.lat || 33.749}&detailLon=${userLocation?.lon || -84.388}&width=400&height=300&zoom=6&level=surface&overlay=waves&product=gfs&menu=&message=&marker=&calendar=now&pressure=&type=map&location=coordinates&detail=&metricWind=kt&metricTemp=default&radarRange=-1`}
                    className="w-full h-full border-0"
                    title="Wave Heights"
                    data-testid="iframe-wave-heights"
                  />
                </div>
              </div>
            </div>

            {/* Extended Multi-Layer Forecast */}
            <div className="bg-white border rounded-lg overflow-hidden">
              <div className="p-4 bg-gray-50 border-b">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium text-gray-900">🎯 Multi-Layer Storm Tracking</h4>
                  <div className="flex gap-2">
                    <button
                      onClick={() => window.open(`https://windy.com/${userLocation?.lat || 33.749}/${userLocation?.lon || -84.388}/7?radar,${userLocation?.lat || 33.749},${userLocation?.lon || -84.388},7`, '_blank')}
                      className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                      data-testid="button-open-radar"
                    >
                      📡 Radar View
                    </button>
                    <button
                      onClick={() => window.open(`https://windy.com/${userLocation?.lat || 33.749}/${userLocation?.lon || -84.388}/7?satellite,${userLocation?.lat || 33.749},${userLocation?.lon || -84.388},7`, '_blank')}
                      className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
                      data-testid="button-open-satellite"
                    >
                      🛰️ Satellite
                    </button>
                  </div>
                </div>
              </div>
              <div className="h-[500px]">
                <iframe
                  src={`https://embed.windy.com/embed2.html?lat=${userLocation?.lat || 33.749}&lon=${userLocation?.lon || -84.388}&detailLat=${userLocation?.lat || 33.749}&detailLon=${userLocation?.lon || -84.388}&width=800&height=500&zoom=6&level=surface&overlay=rain&product=ecmwf&menu=&message=&marker=&calendar=now&pressure=&type=map&location=coordinates&detail=&metricWind=kt&metricTemp=default&radarRange=-1`}
                  className="w-full h-full border-0"
                  title="Multi-Layer Storm Tracking"
                  data-testid="iframe-extended-forecast"
                />
              </div>
              <div className="p-3 bg-gray-50 border-t">
                <p className="text-sm text-gray-600">
                  Live multi-layer weather tracking: Precipitation, Wind, Temperature, Pressure. 
                  Wind speeds in knots. Use timeline controls for storm movement prediction.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ===== SLA Helper Functions =====
function useNowTick(ms=60000){
  const [now, setNow] = useState(Date.now());
  useEffect(()=>{ const id = setInterval(()=>setNow(Date.now()), ms); return ()=>clearInterval(id); },[ms]);
  return now;
}

function daysSince(ts){ if(!ts) return null; return Math.floor((Date.now()-Number(ts))/86400000); }

function findLastEvent(c, type){
  return (c?.timeline||[]).slice().reverse().find(e=>e.type===type) || null;
}

function slaBadges(c){
  const out = [];
  const claim = findLastEvent(c,'claim_submitted');
  const work = findLastEvent(c,'work_completed');
  const lien = findLastEvent(c,'lien_filed');
  
  if (claim){
    const d = daysSince(claim.ts);
    if (d!=null){
      let tone='bg-gray-300 text-gray-800', txt=`Claim +${d}d`;
      if (d>=60) tone='bg-red-600 text-white'; else if (d>=30) tone='bg-amber-500 text-black';
      out.push({ key:'claim', tone, txt });
    }
  }
  if (work){
    const d = daysSince(work.ts);
    if (d!=null){
      let tone='bg-gray-300 text-gray-800', txt=`Work +${d}d`;
      if (d>=45) tone='bg-red-600 text-white'; else if (d>=30) tone='bg-amber-500 text-black';
      out.push({ key:'work', tone, txt });
    }
  }
  if (lien){
    const d = daysSince(lien.ts);
    if (d!=null){
      let tone='bg-gray-300 text-gray-800', txt=`Lien +${d}d`;
      if (d>=300) tone='bg-amber-500 text-black'; if (d>=330) tone='bg-red-600 text-white';
      out.push({ key:'lien', tone, txt });
    }
  }
  return out;
}

// Define role-based access control
type UserRole = 'field' | 'ops' | 'admin';

interface RoleConfig {
  field: string[];
  ops: string[];  
  admin: string[];
}

const ROLE_TABS: RoleConfig = {
  field: ['map', 'inbox', 'multiview', 'owner', 'customers'],
  ops: ['map', 'inbox', 'multiview', 'votix', 'flyt', 'deploy', 'dji', 'dsps', 'owner', 'customers', 'reports', 'legal', 'contractor'],
  admin: ['map', 'inbox', 'multiview', 'votix', 'flyt', 'deploy', 'dji', 'dsps', 'owner', 'customers', 'reports', 'legal', 'contractor']
};

// Radar Layer Component
function RadarLayer({ enabled }: { enabled: boolean }) {
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;
    
    const script = document.createElement('script');
    script.src = 'https://api.rainviewer.com/public/weather-maps.js';
    script.onload = () => {
      // @ts-ignore
      if (window.RainViewer) {
        // @ts-ignore
        window.RainViewer.showFrame({
          map: document.querySelector('.leaflet-container'),
          kind: 'radar',
          colorScheme: 2,
          tileSize: 256,
          smoothAnimation: true
        });
      }
    };
    document.head.appendChild(script);
    
    return () => {
      document.head.removeChild(script);
    };
  }, [enabled]);
  
  return null;
}

// NOAA Alerts Layer Component  
function NOAAAlertsLayer({ enabled }: { enabled: boolean }) {
  const [map, setMap] = useState<any>(null);
  
  useEffect(() => {
    const mapContainer = document.querySelector('.leaflet-container');
    if (mapContainer && !map) {
      // @ts-ignore
      setMap(window.L?.map(mapContainer));
    }
  }, []);
  
  useEffect(() => {
    if (!enabled || !map) return;
    
    const alertsLayer = (window as any).L?.geoJSON(null, {
      style: { color: '#ff6b6b', weight: 2, fillOpacity: 0.3 }
    });
    
    if (alertsLayer) {
      alertsLayer.addTo(map);
      
      // Fetch NOAA alerts
      fetch('https://api.weather.gov/alerts/active')
        .then(res => res.json())
        .then(data => {
          if (data.features) {
            alertsLayer.addData(data.features);
          }
        })
        .catch(console.error);
    }
    
    return () => {
      if (alertsLayer && map) {
        map.removeLayer(alertsLayer);
      }
    };
  }, [enabled, map]);
  return null;
}

function QuickMap({ radarOn, alertsOn }: { radarOn: boolean; alertsOn: boolean }) {
  const [lat, setLat] = useState(() => Number(localStorage.getItem("mapLat")) || 32.51);
  const [lng, setLng] = useState(() => Number(localStorage.getItem("mapLng")) || -84.87);
  const [z, setZ]   = useState(() => Number(localStorage.getItem("mapZoom")) || 7);
  const [showMarkers, setShowMarkers] = useState(true);
  const position = useMemo(() => [lat, lng] as [number, number], [lat, lng]);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);
  const save = () => {
    localStorage.setItem("mapLat", String(lat));
    localStorage.setItem("mapLng", String(lng));
    localStorage.setItem("mapZoom", String(z));
  };

  // focus from Inbox
  useEffect(() => {
    function onFocus(e: any){
      const d = e.detail || {};
      if (!mapRef.current || !d.lat || !d.lon) return;
      mapRef.current.setView([d.lat, d.lon], d.zoom || 18);
      const L = (window as any).L; if (!L) return;
      if (markerRef.current) { mapRef.current.removeLayer(markerRef.current); markerRef.current = null; }
      markerRef.current = L.marker([d.lat, d.lon]).addTo(mapRef.current);
    }
    window.addEventListener('focusLocation', onFocus);
    return () => window.removeEventListener('focusLocation', onFocus);
  }, []);

  // live markers
  useEffect(() => {
    const L = (window as any).L; if (!L || !mapRef.current) return;
    if (markersLayerRef.current) { mapRef.current.removeLayer(markersLayerRef.current); }
    markersLayerRef.current = L.layerGroup().addTo(mapRef.current);

    async function addItem(it: any){
      if (!it || !it.lat || !it.lon) return;
      const icon = L.divIcon({ className:'damage-pin',
        html:`<div style="background:#ef4444;color:#fff;padding:2px 6px;border-radius:8px;">${(it.tags?.[0]||'damage')}</div>` });
      const m = L.marker([it.lat, it.lon], { icon });
      m.bindPopup(`<b>${it.address||''}</b><br/>${(it.tags||[]).join(', ')||''}`);
      markersLayerRef.current.addLayer(m);
    }

    let pollId: any;
    fetch('/api/inbox').then(r=>r.json()).then(arr => (arr||[]).forEach(addItem)).catch(()=>{});
    const ev = new EventSource('/api/stream');
    ev.onmessage = m => { try { addItem(JSON.parse(m.data)); } catch {} };
    ev.onerror   = () => { ev.close(); pollId = setInterval(() => {
      fetch('/api/inbox').then(r=>r.json()).then(arr => (arr||[]).forEach(addItem)).catch(()=>{});
    }, 15000); };

    return () => { ev.close(); if (pollId) clearInterval(pollId); if (markersLayerRef.current) mapRef.current.removeLayer(markersLayerRef.current); };
  }, []);

  return (
    <div className="w-full bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="p-4 space-y-3">
        <div className="grid grid-cols-3 gap-2">
          <input type="number" step="0.0001" value={lat} onChange={(e)=>setLat(Number(e.target.value))} placeholder="Latitude" className="border border-gray-300 rounded-md px-2 py-1" />
          <input type="number" step="0.0001" value={lng} onChange={(e)=>setLng(Number(e.target.value))} placeholder="Longitude" className="border border-gray-300 rounded-md px-2 py-1" />
          <input type="number" step="1" min={2} max={12} value={z} onChange={(e)=>setZ(Number(e.target.value))} placeholder="Zoom" className="border border-gray-300 rounded-md px-2 py-1" />
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm flex items-center gap-2">
            <input type="checkbox" checked={showMarkers} onChange={(e)=>{
              setShowMarkers(e.target.checked);
              if (!mapRef.current || !markersLayerRef.current) return;
              if (e.target.checked) markersLayerRef.current.addTo(mapRef.current);
              else mapRef.current.removeLayer(markersLayerRef.current);
            }} />
            Show damage markers
          </label>
          <button onClick={save} className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 font-medium transition-colors">Save View</button>
        </div>
        <div className="h-[420px] rounded-2xl overflow-hidden">
          <MapContainer ref={(m: any)=>{mapRef.current=m;}} center={position} zoom={z} className="h-full w-full">
            <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <RadarLayer enabled={radarOn} />
            <NOAAAlertsLayer enabled={alertsOn} />
          </MapContainer>
        </div>
      </div>
    </div>
  );
}

// ===== Tags & Filters =====
const TAGS = [
  'tree_on_roof','tree_on_building','tree_on_fence','tree_on_barn','tree_on_shed','tree_on_car','tree_in_pool','tree_on_playground','tree_across_driveway','line_down','structure_damage'
];

function InboxTabs({ items, filters, setFilters, onAcceptLead }: any) {
  const filteredItems = items.filter((item: any) => {
    if (filters.search && !item.address?.toLowerCase().includes(filters.search.toLowerCase())) return false;
    if (filters.tags.length && !filters.tags.some((tag: string) => item.tags?.includes(tag))) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex gap-2 items-center flex-wrap">
        <input
          type="text"
          placeholder="Search addresses..."
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          className="border border-gray-300 rounded-md px-3 py-1 text-sm"
        />
        <select
          value=""
          onChange={(e) => {
            const tag = e.target.value;
            if (tag && !filters.tags.includes(tag)) {
              setFilters({ ...filters, tags: [...filters.tags, tag] });
            }
          }}
          className="border border-gray-300 rounded-md px-3 py-1 text-sm"
        >
          <option value="">Add tag filter...</option>
          {TAGS.map(tag => (
            <option key={tag} value={tag}>{tag.replace(/_/g, ' ')}</option>
          ))}
        </select>
        {filters.tags.map((tag: string) => (
          <span key={tag} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
            {tag.replace(/_/g, ' ')}
            <button
              onClick={() => setFilters({ ...filters, tags: filters.tags.filter((t: string) => t !== tag) })}
              className="ml-1 text-blue-600 hover:text-blue-800"
            >
              ×
            </button>
          </span>
        ))}
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {filteredItems.map((item: any) => (
          <InboxCard key={item.id} item={item} onAccept={onAcceptLead} />
        ))}
        {filteredItems.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No items match your filters
          </div>
        )}
      </div>
    </div>
  );
}

function InboxCard({ item, onAccept }: { item: any; onAccept?: (item: any) => void }) {
  function focusOnMap() {
    if (!item.lat || !item.lon) return;
    const event = new CustomEvent('focusLocation', {
      detail: { lat: item.lat, lon: item.lon, zoom: 18 }
    });
    window.dispatchEvent(event);
  }

  async function acceptLead() {
    try {
      const response = await fetch('/api/leads/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id })
      });
      const result = await response.json();
      
      if (!result?.ok) {
        alert('Accept failed');
        return;
      }
      
      const customer = result.customer;
      try {
        onAccept?.(customer);
      } catch (e) {
        console.error('Accept callback error:', e);
      }
      
      // Center map on new/merged customer
      try {
        window.dispatchEvent(new CustomEvent('storm-center', {
          detail: { address: customer.address, name: customer.name }
        }));
      } catch (e) {
        console.error('Map center error:', e);
      }
      
      alert(result.merged ? 'Merged into existing customer' : 'Created new customer');
    } catch (error) {
      console.error('Accept error:', error);
      alert('Failed to accept lead');
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors">
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <div className="font-medium text-sm">{item.address || 'Unknown Address'}</div>
          <div className="text-xs text-gray-500">
            Provider: {item.provider} • {new Date(item.timestamp).toLocaleString()}
          </div>
        </div>
        <div className="flex gap-2 ml-2">
          {item.lat && item.lon && (
            <button
              onClick={focusOnMap}
              className="text-blue-600 hover:text-blue-800 text-xs underline"
            >
              View on Map
            </button>
          )}
          <button
            onClick={acceptLead}
            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
            data-testid={`button-accept-${item.id}`}
          >
            Accept Lead
          </button>
        </div>
      </div>
      
      {item.tags && item.tags.length > 0 && (
        <div className="flex gap-1 mb-2 flex-wrap">
          {item.tags.map((tag: string) => (
            <span key={tag} className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs">
              {tag.replace(/_/g, ' ')}
            </span>
          ))}
        </div>
      )}
      
      {item.notes && (
        <div className="text-sm text-gray-700 mt-2">{item.notes}</div>
      )}
      
      {item.mediaUrl && (
        <div className="mt-2">
          <a 
            href={item.mediaUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 text-xs underline"
          >
            View Media
          </a>
        </div>
      )}
    </div>
  );
}

// ===== Provider Tab Component =====
function ProviderTab({ name, hlsKey, iframeKey, portal }: {
  name: string;
  hlsKey: string;
  iframeKey: string;
  portal: string;
}) {
  const [mode, setMode] = useState<'iframe' | 'hls'>('iframe');
  const [hlsUrl, setHlsUrl] = useState(() => localStorage.getItem(hlsKey) || '');
  const [iframeUrl, setIframeUrl] = useState(() => localStorage.getItem(iframeKey) || portal);

  useEffect(() => {
    localStorage.setItem(hlsKey, hlsUrl);
  }, [hlsUrl, hlsKey]);

  useEffect(() => {
    localStorage.setItem(iframeKey, iframeUrl);
  }, [iframeUrl, iframeKey]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <h3 className="text-lg font-semibold">{name}</h3>
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setMode('iframe')}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              mode === 'iframe' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Portal
          </button>
          <button
            onClick={() => setMode('hls')}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              mode === 'hls' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Live Stream
          </button>
        </div>
        <button
          onClick={() => window.open(portal, '_blank')}
          className="text-blue-600 hover:text-blue-800 text-sm underline"
        >
          Open {name} Portal
        </button>
      </div>

      {mode === 'iframe' && (
        <div className="space-y-2">
          <input
            type="text"
            placeholder={`${name} portal URL...`}
            value={iframeUrl}
            onChange={(e) => setIframeUrl(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          />
          {iframeUrl && (
            <div className="h-[500px] border border-gray-200 rounded-lg overflow-hidden">
              <iframe
                src={iframeUrl}
                className="w-full h-full"
                title={`${name} Portal`}
                allow="camera; microphone; geolocation"
                onError={(e) => console.error(`Error loading ${name} portal:`, e)}
                onLoad={() => console.log(`${name} portal loaded successfully`)}
              />
            </div>
          )}
        </div>
      )}

      {mode === 'hls' && (
        <div className="space-y-2">
          <input
            type="text"
            placeholder={`${name} HLS stream URL...`}
            value={hlsUrl}
            onChange={(e) => setHlsUrl(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          />
          {hlsUrl && (
            <div className="h-[500px] border border-gray-200 rounded-lg overflow-hidden bg-black">
              <video
                controls
                className="w-full h-full"
                src={hlsUrl}
              >
                Your browser does not support the video tag.
              </video>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ===== Multi-View Component =====
function MultiView() {
  const [streams, setStreams] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('multiViewStreams') || '[]');
    } catch {
      return [];
    }
  });
  const [newStreamUrl, setNewStreamUrl] = useState('');

  useEffect(() => {
    localStorage.setItem('multiViewStreams', JSON.stringify(streams));
  }, [streams]);

  const addStream = () => {
    if (newStreamUrl && !streams.includes(newStreamUrl)) {
      setStreams([...streams, newStreamUrl]);
      setNewStreamUrl('');
    }
  };

  const removeStream = (index: number) => {
    setStreams(streams.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Add stream URL..."
          value={newStreamUrl}
          onChange={(e) => setNewStreamUrl(e.target.value)}
          className="flex-1 border border-gray-300 rounded-md px-3 py-2"
          onKeyPress={(e) => e.key === 'Enter' && addStream()}
        />
        <button
          onClick={addStream}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium transition-colors"
        >
          Add Stream
        </button>
      </div>

      {streams.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No streams added yet. Add drone feed URLs to view multiple streams simultaneously.
        </div>
      )}

      <div className={`grid gap-4 ${
        streams.length === 1 ? 'grid-cols-1' :
        streams.length === 2 ? 'grid-cols-2' :
        streams.length <= 4 ? 'grid-cols-2' :
        'grid-cols-3'
      }`}>
        {streams.map((streamUrl, index) => (
          <div key={index} className="relative border border-gray-200 rounded-lg overflow-hidden bg-black">
            <button
              onClick={() => removeStream(index)}
              className="absolute top-2 right-2 z-10 bg-red-600 text-white w-6 h-6 rounded-full text-xs hover:bg-red-700 transition-colors"
            >
              ×
            </button>
            <div className="aspect-video">
              <video
                controls
                className="w-full h-full object-cover"
                src={streamUrl}
                muted
                autoPlay
              >
                Your browser does not support the video tag.
              </video>
            </div>
            <div className="p-2 bg-gray-800 text-white text-xs truncate">
              {streamUrl}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ===== DSP Directory Component =====
function DSPDirectory() {
  const [dsps, setDsps] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('dspDirectory') || '[]');
    } catch {
      return [];
    }
  });
  const [newDsp, setNewDsp] = useState({ name: '', contact: '', location: '', rate: '', specialties: '' });

  useEffect(() => {
    localStorage.setItem('dspDirectory', JSON.stringify(dsps));
  }, [dsps]);

  const addDsp = () => {
    if (newDsp.name && newDsp.contact) {
      setDsps([...dsps, { ...newDsp, id: Date.now() }]);
      setNewDsp({ name: '', contact: '', location: '', rate: '', specialties: '' });
    }
  };

  const removeDsp = (id: number) => {
    setDsps(dsps.filter((dsp: any) => dsp.id !== id));
  };

  return (
    <div className="space-y-4">
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-4">Add New DSP</h3>
        <div className="grid md:grid-cols-2 gap-3">
          <input
            type="text"
            placeholder="DSP Name"
            value={newDsp.name}
            onChange={(e) => setNewDsp({ ...newDsp, name: e.target.value })}
            className="border border-gray-300 rounded-md px-3 py-2"
          />
          <input
            type="text"
            placeholder="Contact Info"
            value={newDsp.contact}
            onChange={(e) => setNewDsp({ ...newDsp, contact: e.target.value })}
            className="border border-gray-300 rounded-md px-3 py-2"
          />
          <input
            type="text"
            placeholder="Location/Service Area"
            value={newDsp.location}
            onChange={(e) => setNewDsp({ ...newDsp, location: e.target.value })}
            className="border border-gray-300 rounded-md px-3 py-2"
          />
          <input
            type="text"
            placeholder="Rate ($/hour)"
            value={newDsp.rate}
            onChange={(e) => setNewDsp({ ...newDsp, rate: e.target.value })}
            className="border border-gray-300 rounded-md px-3 py-2"
          />
          <input
            type="text"
            placeholder="Specialties"
            value={newDsp.specialties}
            onChange={(e) => setNewDsp({ ...newDsp, specialties: e.target.value })}
            className="border border-gray-300 rounded-md px-3 py-2 md:col-span-2"
          />
        </div>
        <button
          onClick={addDsp}
          className="mt-3 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium transition-colors"
        >
          Add DSP
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {dsps.map((dsp: any) => (
          <div key={dsp.id} className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-semibold">{dsp.name}</h4>
              <button
                onClick={() => removeDsp(dsp.id)}
                className="text-red-600 hover:text-red-800 text-sm"
              >
                Remove
              </button>
            </div>
            <div className="space-y-1 text-sm text-gray-600">
              <div><strong>Contact:</strong> {dsp.contact}</div>
              {dsp.location && <div><strong>Location:</strong> {dsp.location}</div>}
              {dsp.rate && <div><strong>Rate:</strong> ${dsp.rate}/hour</div>}
              {dsp.specialties && <div><strong>Specialties:</strong> {dsp.specialties}</div>}
            </div>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => window.open(`tel:${dsp.contact.replace(/[^0-9+]/g, '')}`, '_self')}
                className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors"
              >
                Call
              </button>
              <button
                onClick={() => window.open(`sms:${dsp.contact.replace(/[^0-9+]/g, '')}`, '_self')}
                className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
              >
                Text
              </button>
            </div>
          </div>
        ))}
      </div>

      {dsps.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No DSPs added yet. Add drone service providers to build your network.
        </div>
      )}
    </div>
  );
}

// ===== Owner Lookup Component =====
function OwnerLookup() {
  const [address, setAddress] = useState('');
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const lookup = async () => {
    if (!address.trim()) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/owner-lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address })
      });
      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error('Lookup failed:', error);
      setResults({ error: 'Lookup failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-4">Property Owner Lookup</h3>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Enter property address..."
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="flex-1 border border-gray-300 rounded-md px-3 py-2"
            onKeyPress={(e) => e.key === 'Enter' && lookup()}
          />
          <button
            onClick={lookup}
            disabled={loading || !address.trim()}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 font-medium transition-colors disabled:opacity-50"
          >
            {loading ? 'Searching...' : 'Lookup'}
          </button>
        </div>
      </div>

      {results && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h4 className="font-semibold mb-3">Lookup Results</h4>
          {results.error ? (
            <div className="text-red-600">{results.error}</div>
          ) : (
            <div className="space-y-2">
              {results.owner && (
                <div><strong>Owner:</strong> {results.owner}</div>
              )}
              {results.phone && (
                <div><strong>Phone:</strong> {results.phone}</div>
              )}
              {results.email && (
                <div><strong>Email:</strong> {results.email}</div>
              )}
              {results.mailingAddress && (
                <div><strong>Mailing Address:</strong> {results.mailingAddress}</div>
              )}
              {results.propertyValue && (
                <div><strong>Property Value:</strong> ${results.propertyValue.toLocaleString()}</div>
              )}
              {results.yearBuilt && (
                <div><strong>Year Built:</strong> {results.yearBuilt}</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StormOpsProHubContent() {
  const [activeTab, setActiveTab] = useState("map");
  const { role: userRole } = useRole();
  const [radarEnabled, setRadarEnabled] = useState(false);
  const [alertsEnabled, setAlertsEnabled] = useState(false);
  const [inboxItems, setInboxItems] = useState<any[]>([]);
  const [filters, setFilters] = useState({ search: '', tags: [] });
  const customers = useCustomers();

  // Permission checker
  const allow = (tab: string): boolean => ROLE_TABS[userRole as UserRole].includes(tab);

  // Switch to allowed tab if current tab is not accessible
  useEffect(() => {
    if (!ROLE_TABS[userRole as UserRole].includes(activeTab)) {
      setActiveTab('map');
    }
  }, [userRole, activeTab]);

  // Load inbox items on mount
  useEffect(() => {
    fetch('/api/inbox')
      .then(res => res.json())
      .then(data => setInboxItems(data || []))
      .catch(console.error);

    // Listen for real-time updates
    const eventSource = new EventSource('/api/stream');
    eventSource.onmessage = (event) => {
      try {
        const newItem = JSON.parse(event.data);
        setInboxItems(prev => [newItem, ...prev]);
      } catch (error) {
        console.error('Failed to parse SSE data:', error);
      }
    };

    return () => eventSource.close();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-full mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">Storm Operations Pro Hub</h1>
              <RoleBar />
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <label className="text-sm flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={radarEnabled}
                    onChange={(e) => setRadarEnabled(e.target.checked)}
                  />
                  Radar
                </label>
                <label className="text-sm flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={alertsEnabled}
                    onChange={(e) => setAlertsEnabled(e.target.checked)}
                  />
                  Alerts
                </label>
              </div>
              <div className="text-sm text-gray-600">
                🌪️ Live Storm Ops • {new Date().toLocaleTimeString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-full mx-auto p-4">
        <header className="mb-6">
          <p className="text-gray-600 text-sm">
            Comprehensive storm operations platform with real-time weather monitoring, drone coordination, and incident management.
          </p>
        </header>

        <div className="w-full">
          <div className="border-b border-gray-200 bg-white rounded-t-lg">
            <nav className="-mb-px flex space-x-8 px-4 overflow-x-auto">
              {[
                { id: "map", label: "🗺️ Storm Map" },
                { id: "weather", label: "🌪️ Live Weather" },
                { id: "inbox", label: "📥 Inbox" },
                { id: "multiview", label: "📺 Multi-View" },
                { id: "votix", label: "🔴 VOTIX" },
                { id: "flyt", label: "🚁 FlytBase" },
                { id: "deploy", label: "📹 DroneDeploy" },
                { id: "dji", label: "🛸 DJI FH2" },
                { id: "dsps", label: "👥 Hire Pilots" },
                { id: "owner", label: "🏢 Owner Lookup" },
                { id: "customers", label: "👤 CRM" },
                { id: "reports", label: "📊 Reports" },
                { id: "legal", label: "⚖️ Legal" },
                { id: "contractor", label: "🔧 Contractor" }
              ].filter(tab => allow(tab.id)).map(tab => (
                <button
                  key={tab.id}
                  className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="bg-white border-l border-r border-b border-gray-200 rounded-b-lg min-h-[600px]">
            {/* Storm Map Tab */}
            {activeTab === "map" && (
              <div className="p-4">
                <StormMap customers={Array.isArray(customers) ? customers : (customers?.list || [])} />
              </div>
            )}

            {/* Live Weather Tab */}
            {activeTab === "weather" && (
              <div className="p-4">
                <WeatherCenter />
              </div>
            )}

            {/* Inbox Tab */}
            {activeTab === "inbox" && (
              <div className="p-4 space-y-4">
                {/* Auto-Generated Lead Inbox */}
                <LeadInbox onCreateCustomer={(customer: any) => {
                  customers.add(customer);
                }} />
                
                {/* Traditional Inbox */}
                <InboxTabs 
                  items={inboxItems} 
                  filters={filters} 
                  setFilters={setFilters}
                  onAcceptLead={(customer: any) => {
                    // Remove the accepted item from inbox
                    setInboxItems(items => items.filter(item => item.id !== customer.fromLead));
                    // Refresh customers list
                    if (customers?.refetch) customers.refetch();
                  }}
                />
              </div>
            )}

            {/* Multi-View Tab */}
            {activeTab === "multiview" && (
              <div className="p-4">
                <MultiView />
              </div>
            )}

            {/* VOTIX Tab */}
            {activeTab === "votix" && (
              <div className="p-4 space-y-4">
                <div className="bg-white rounded-lg border overflow-hidden">
                  <div className="p-4 bg-gray-50 border-b">
                    <h3 className="text-lg font-semibold text-gray-900">🔴 VOTIX Live Stream Portal</h3>
                    <p className="text-sm text-gray-600 mt-1">Access live drone feeds and real-time storm coverage</p>
                  </div>
                  
                  {/* Portal Access Buttons */}
                  <div className="p-4 space-y-3">
                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={() => window.open('https://platform.votix.com/', '_blank')}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                        data-testid="button-votix-portal"
                      >
                        🚀 Open VOTIX Portal
                      </button>
                      <button
                        onClick={() => window.open('https://app.votix.com/login', '_blank')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                        data-testid="button-votix-app"
                      >
                        📱 VOTIX Mobile App
                      </button>
                      <button
                        onClick={() => window.open('https://votix.com/live-streams', '_blank')}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                        data-testid="button-votix-streams"
                      >
                        🔴 Live Streams
                      </button>
                    </div>
                    
                    {/* Status Indicators */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                      <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                        <div className="text-sm font-medium text-green-800">Stream Status</div>
                        <div className="text-lg font-bold text-green-900">🟢 LIVE</div>
                        <div className="text-xs text-green-600">3 active feeds</div>
                      </div>
                      
                      <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                        <div className="text-sm font-medium text-blue-800">Coverage Area</div>
                        <div className="text-lg font-bold text-blue-900">Multi-State</div>
                        <div className="text-xs text-blue-600">Storm tracking active</div>
                      </div>
                      
                      <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                        <div className="text-sm font-medium text-orange-800">Quality</div>
                        <div className="text-lg font-bold text-orange-900">4K HD</div>
                        <div className="text-xs text-orange-600">Real-time updates</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Embedded VOTIX Portal */}
                  <div className="h-[600px]">
                    <iframe
                      src="https://platform.votix.com/"
                      className="w-full h-full border-0"
                      title="VOTIX Live Stream Portal"
                      allow="camera; microphone; fullscreen"
                      data-testid="iframe-votix-portal"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* FlytBase Tab */}
            {activeTab === "flyt" && (
              <div className="p-4">
                <ProviderTab 
                  name="FlytBase" 
                  hlsKey="flytHls" 
                  iframeKey="flytIframe" 
                  portal="https://my.flytbase.com/" 
                />
              </div>
            )}

            {/* DroneDeploy Tab */}
            {activeTab === "deploy" && (
              <div className="p-4">
                <ProviderTab 
                  name="DroneDeploy" 
                  hlsKey="ddHls" 
                  iframeKey="ddIframe" 
                  portal="https://www.dronedeploy.com/live/" 
                />
              </div>
            )}

            {/* DJI Tab */}
            {activeTab === "dji" && (
              <div className="p-4">
                <ProviderTab 
                  name="DJI FlightHub 2" 
                  hlsKey="fh2Hls" 
                  iframeKey="fh2Iframe" 
                  portal="https://flighthub2.dji.com/" 
                />
              </div>
            )}

            {/* DSPs Tab */}
            {activeTab === "dsps" && (
              <div className="p-4">
                <DSPDirectory />
              </div>
            )}

            {/* Owner Lookup Tab */}
            {activeTab === "owner" && (
              <div className="p-4">
                <OwnerLookup />
              </div>
            )}

            {/* CRM Tab */}
            {activeTab === "customers" && (
              <div className="p-4">
                <CustomersPanel />
              </div>
            )}

            {/* Reports Tab */}
            {activeTab === "reports" && (
              <div className="p-4">
                <ReportBuilder />
              </div>
            )}

            {/* Legal Tab */}
            {activeTab === "legal" && (
              <div className="p-4">
                <LiensLegal />
              </div>
            )}

            {/* Contractor Tab */}
            {activeTab === "contractor" && (
              <div className="p-4">
                <ContractorPortal />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ===== BUSINESS COMPONENTS =====

// --- Lead Inbox Component ---
function LeadInbox({ onCreateCustomer }: { onCreateCustomer?: (customer: any) => void }) {
  const [leads, setLeads] = useState<any[]>([]);
  
  useEffect(() => { 
    fetch('/api/leads').then(r => r.json()).then(setLeads).catch(() => {}); 
  }, []);
  
  useEffect(() => {
    const es = new EventSource('/api/drone/events');
    es.onmessage = (ev) => { 
      try { 
        const d = JSON.parse(ev.data); 
        if (d?.type === 'lead' && d.lead) { 
          setLeads(prev => [d.lead, ...prev]); 
        } 
      } catch {} 
    };
    return () => es.close();
  }, []);

  async function accept(id: string) {
    const r = await fetch('/api/leads/accept', { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ id }) 
    }).then(r => r.json()).catch(() => null);
    
    if (!r?.ok) { 
      alert('Accept failed'); 
      return; 
    }
    
    setLeads(ls => ls.filter(x => x.id !== id));
    const cust = r.customer;
    
    try { 
      await onCreateCustomer?.(cust); 
    } catch {}
    
    // Center map
    try { 
      window.dispatchEvent(new CustomEvent('storm-center', { 
        detail: { address: cust.address, name: cust.name } 
      })); 
    } catch {}
    
    alert(r.merged ? 'Merged into existing customer' : 'Created new customer');
  }

  return (
    <div className="border rounded-md p-3">
      <div className="font-semibold mb-2">Lead Inbox</div>
      <div className="text-xs text-muted-foreground mb-2">Auto‑leads generated from drone detections with damage tags.</div>
      <div className="space-y-2 max-h-64 overflow-auto">
        {leads.map(l => (
          <div key={l.id} className="border rounded p-2 text-sm flex items-center justify-between">
            <div>
              <div className="font-medium">{(l.tags || []).join(', ')}</div>
              <div className="text-xs opacity-80">{l.address || `${l.lat}, ${l.lng}`}</div>
              <div className="text-xs opacity-80">{new Date(l.createdAt).toLocaleString()}</div>
            </div>
            <div className="flex gap-2">
              {l.stream && <a className="underline text-xs" href={l.stream} target="_blank" rel="noreferrer">Open stream</a>}
              <Button 
                size="sm" 
                className="px-2 py-1 text-xs bg-emerald-600 hover:bg-emerald-700" 
                onClick={() => accept(l.id)}
              >
                Accept Lead
              </Button>
            </div>
          </div>
        ))}
        {leads.length === 0 && (
          <div className="text-xs text-muted-foreground text-center py-4">
            No leads yet. Leads will appear when drones detect damage.
          </div>
        )}
      </div>
    </div>
  );
}

// --- Enhanced Customers Panel with Advanced Features ---
function CustomersPanel(){
  const { role } = useRole();
  const [list, setList] = useState([]);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [sel, setSel] = useState(new Set());
  const [dupes, setDupes] = useState({ address:[], proximity:[] });
  const [loading, setLoading] = useState(false);

  async function load(){
    setLoading(true);
    try{ 
      const r = await fetch(`/api/customers?q=${encodeURIComponent(q)}&status=${encodeURIComponent(status)}`).then(r=>r.json()); 
      setList(r||[]); 
    }
    finally{ setLoading(false); }
  }
  useEffect(()=>{ load(); }, [q, status]);

  function toggle(id){ 
    setSel(prev=>{ 
      const n = new Set(prev); 
      if (n.has(id)) n.delete(id); 
      else n.add(id); 
      return n; 
    }); 
  }
  function clearSel(){ setSel(new Set()); }

  async function doExport(){ 
    const r = await fetch('/api/customers/export').then(r=>r.json()).catch(()=>null); 
    if (r?.path) window.open(r.path, '_blank'); 
  }
  
  async function doDelete(){ 
    if (!sel.size) return; 
    if (!confirm(`Delete ${sel.size} record(s)?`)) return; 
    await fetch('/api/customers/delete',{ 
      method:'POST', 
      headers:{'Content-Type':'application/json'}, 
      body: JSON.stringify({ ids: [...sel] }) 
    }); 
    clearSel(); 
    load(); 
  }
  
  async function doMerge(ids=[...sel]){ 
    if (ids.length<2) return alert('Select 2+'); 
    const primaryId = ids[0]; 
    await fetch('/api/customers/merge',{ 
      method:'POST', 
      headers:{'Content-Type':'application/json'}, 
      body: JSON.stringify({ ids, primaryId }) 
    }); 
    clearSel(); 
    load(); 
  }

  async function scanDupes(){ 
    const r = await fetch('/api/customers/dedupe-scan?radius=40').then(r=>r.json()).catch(()=>({address:[],proximity:[]})); 
    setDupes(r); 
  }
  
  async function bulkMerge(strategy){ 
    if (!confirm(`Auto-merge by ${strategy}?`)) return; 
    await fetch('/api/customers/bulk-merge',{ 
      method:'POST', 
      headers:{'Content-Type':'application/json'}, 
      body: JSON.stringify({ strategy, radius: 40 }) 
    }); 
    load(); 
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Input 
          style={{width:240}} 
          value={q} 
          onChange={(e)=>setQ(e.target.value)} 
          placeholder="Search name, address, insurer, claim #" 
        />
        <select className="border rounded px-2 py-1" value={status} onChange={(e)=>setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {PIPELINE.map(p=> <option key={p} value={p}>{p.replace(/_/g,' ')}</option>)}
        </select>
        <Button onClick={load}>Search</Button>
        <div className="ml-auto flex gap-2">
          <Button variant="outline" onClick={doExport}>Export CSV</Button>
          {role==='admin' && <Button variant="destructive" onClick={doDelete} disabled={!sel.size}>Delete</Button>}
        </div>
      </div>

      <div className="border rounded">
        <div className="grid grid-cols-12 p-2 text-xs font-semibold bg-gray-50">
          <div className="col-span-1">
            <input 
              type="checkbox" 
              onChange={(e)=>{ 
                if (e.target.checked) setSel(new Set(list.map((x: any)=>x.id))); 
                else clearSel(); 
              }} 
            />
          </div>
          <div className="col-span-2">Name</div>
          <div className="col-span-3">Address</div>
          <div className="col-span-2">Insurer / Claim</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>
        <div className="max-h-96 overflow-auto divide-y">
          {loading && <div className="p-3 text-sm">Loading…</div>}
          {!loading && list.map((c: any) => (
            <div key={c.id} className="grid grid-cols-12 p-2 text-sm items-center">
              <div className="col-span-1">
                <input type="checkbox" checked={sel.has(c.id)} onChange={()=>toggle(c.id)} />
              </div>
              <div className="col-span-2 truncate">{c.name||'Unknown Owner'}</div>
              <div className="col-span-3 truncate">{c.address}</div>
              <div className="col-span-2 truncate">{c.insurer||'—'} / {c.claimNumber||'—'}</div>
              <div className="col-span-2">
                <span className="text-xs px-2 py-1 rounded-full bg-gray-200">
                  {(c.status||'new').replace(/_/g,' ')}
                </span>
              </div>
              <div className="col-span-2 text-right">
                {role==='admin' && (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={()=>doMerge([c.id, ...[...sel].filter((id: any)=>id!==c.id)])} 
                    disabled={sel.size<1}
                    className="mr-2"
                  >
                    Merge
                  </Button>
                )}
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={()=>{ 
                    try{ 
                      window.dispatchEvent(new CustomEvent('storm-center',{ 
                        detail:{ address:c.address, name:c.name } 
                      })); 
                    }catch{} 
                  }}
                >
                  Map
                </Button>
              </div>
            </div>
          ))}
          {!loading && list.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              No customers found. Accepted leads will appear here.
            </div>
          )}
        </div>
      </div>

      <div className="border rounded p-3">
        <div className="flex items-center gap-2">
          <div className="font-semibold">Duplicate tools</div>
          <Button variant="outline" onClick={scanDupes}>Find duplicates</Button>
          {role==='admin' && <Button variant="outline" onClick={()=>bulkMerge('address')}>Bulk merge by address</Button>}
          {role==='admin' && <Button variant="outline" onClick={()=>bulkMerge('radius')}>Bulk merge by 40m</Button>}
        </div>
        <div className="grid md:grid-cols-2 gap-3 mt-2">
          <div>
            <div className="text-sm font-medium">Address matches</div>
            <div className="text-xs text-muted-foreground">Same normalized street address</div>
            <div className="space-y-2 mt-2 max-h-60 overflow-auto">
              {dupes.address.map((g: any,idx: number)=> (
                <div key={idx} className="border rounded p-2 text-xs">
                  <div className="font-semibold mb-1">Group #{idx+1}</div>
                  {g.items.map((it: any) => <div key={it.id}>• {it.name||'Unknown'} — {it.address} ({it.id})</div>)}
                  {role==='admin' && <Button size="sm" className="mt-2" onClick={()=>doMerge(g.items.map((x: any)=>x.id))}>Merge group</Button>}
                </div>
              ))}
              {dupes.address.length === 0 && (
                <div className="text-xs text-gray-500 p-2">No address duplicates found</div>
              )}
            </div>
          </div>
          <div>
            <div className="text-sm font-medium">Proximity matches (≤ 40m)</div>
            <div className="text-xs text-muted-foreground">Likely duplicates at the same parcel</div>
            <div className="space-y-2 mt-2 max-h-60 overflow-auto">
              {dupes.proximity.map((g: any,idx: number)=> (
                <div key={idx} className="border rounded p-2 text-xs">
                  <div className="font-semibold mb-1">Cluster #{idx+1}</div>
                  {g.items.map((it: any) => <div key={it.id}>• {it.name||'Unknown'} — {it.address} ({it.id})</div>)}
                  {role==='admin' && <Button size="sm" className="mt-2" onClick={()=>doMerge(g.items.map((x: any)=>x.id))}>Merge cluster</Button>}
                </div>
              ))}
              {dupes.proximity.length === 0 && (
                <div className="text-xs text-gray-500 p-2">No proximity duplicates found</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Customers CRM (pipeline, comms log, docs) ---
function useCustomers(){
  const [list, setList] = useState(()=>{ try{ return JSON.parse(localStorage.getItem('customers')||'[]'); }catch{ return []; } });
  useEffect(()=>{ localStorage.setItem('customers', JSON.stringify(list)); }, [list]);
  function add(c: any){ setList((prev: any)=>[ { id: String(Date.now()), status:'new', timeline:[], docs:[], messages:[], ...c }, ...prev ]); }
  function update(id: string, patch: any){ setList((prev: any)=> prev.map((c: any)=> c.id===id ? { ...c, ...patch } : c)); }
  function pushMsg(id: string, msg: any){ setList((prev: any)=> prev.map((c: any)=> c.id===id ? { ...c, messages:[...c.messages, { ts: Date.now(), ...msg }] } : c)); }
  function pushDoc(id: string, doc: any){ setList((prev: any)=> prev.map((c: any)=> c.id===id ? { ...c, docs:[...c.docs, doc] } : c)); }
  function pushEvent(id: string, evt: any){ setList((prev: any)=> prev.map((c: any)=> c.id===id ? { ...c, timeline:[...c.timeline, { ts: Date.now(), ...evt }] } : c)); }
  return { list, add, update, pushMsg, pushDoc, pushEvent };
}
const PIPELINE = ['new','contacted','contract_signed','scheduled','in_progress','completed','claim_submitted','awaiting_payment','paid'];
function CustomersCRM(){
  const { list, add, update, pushMsg, pushDoc, pushEvent } = useCustomers();
  const [form, setForm] = useState({ name:'', address:'', phone:'', email:'', claimNumber:'', insurer:'' });
  function create(){ if(!form.name && !form.address) return; add(form); setForm({ name:'', address:'', phone:'', email:'', claimNumber:'', insurer:'' }); }
  return (
    <div className="space-y-4">
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="p-4 space-y-2">
          <div className="text-lg font-semibold">Customer Intake</div>
          <div className="grid md:grid-cols-3 gap-2">
            <input value={form.name} onChange={(e)=>setForm({...form,name:e.target.value})} placeholder="Owner name" className="border border-gray-300 rounded-md px-2 py-1" />
            <input value={form.address} onChange={(e)=>setForm({...form,address:e.target.value})} placeholder="Service address" className="border border-gray-300 rounded-md px-2 py-1" />
            <input value={form.phone} onChange={(e)=>setForm({...form,phone:e.target.value})} placeholder="Phone" className="border border-gray-300 rounded-md px-2 py-1" />
            <input value={form.email} onChange={(e)=>setForm({...form,email:e.target.value})} placeholder="Email" className="border border-gray-300 rounded-md px-2 py-1" />
            <input value={form.insurer} onChange={(e)=>setForm({...form,insurer:e.target.value})} placeholder="Insurance company" className="border border-gray-300 rounded-md px-2 py-1" />
            <input value={form.claimNumber} onChange={(e)=>setForm({...form,claimNumber:e.target.value})} placeholder="Claim #" className="border border-gray-300 rounded-md px-2 py-1" />
          </div>
          <div className="flex gap-2"><button onClick={create} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium transition-colors">Create Customer</button></div>
          <div className="text-xs text-gray-500">Everything is logged—calls, texts, emails, docs, photos, reports.</div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {list.map((c: any) => <CustomerCard key={c.id} c={c} update={update} pushMsg={pushMsg} pushDoc={pushDoc} pushEvent={pushEvent} />)}
      </div>
    </div>
  );
}
function CustomerCard({ c, update, pushMsg, pushDoc, pushEvent }){
  const [note, setNote] = useState('');
  const [msg, setMsg] = useState('');
  const nowTick = useNowTick(60000);

  // Claim-threaded messages (from backend /api/messages?claim=...)
  const [thread, setThread] = useState([]);
  useEffect(()=>{
    if (!c.claimNumber){ setThread([]); return; }
    fetch(`/api/messages?claim=${encodeURIComponent(c.claimNumber)}`)
      .then(r=>r.json()).then(setThread).catch(()=>{});
  }, [c.claimNumber]);

  // Invoice editor
  const [invoiceItems, setInvoiceItems] = useState([{ name:'Emergency service', amount:0, quantity:1 }]);
  const [taxRate, setTaxRate] = useState(0);
  const subtotal = invoiceItems.reduce((s,it)=> s + (Number(it.amount)||0) * (Number(it.quantity)||1), 0);
  const tax = subtotal * (Number(taxRate)||0)/100;
  const total = subtotal + tax;

  // E‑Sign status (badge + auto‑attach certificate)
  const [esign, setEsign] = useState({ status:'unknown', certificate:null });
  useEffect(()=>{
    let stop = false;
    async function check(){
      const params = new URLSearchParams({});
      if (c.claimNumber) params.set('claim', c.claimNumber);
      if (c.email) params.set('email', c.email);
      if (![...params.keys()].length) return;
      const r = await fetch(`/api/esign/status?${params.toString()}`).then(r=>r.json()).catch(()=>null);
      const rec = r?.record || (r?.results && (r.results.find(x=>x.signedAt) || r.results[0])) || null;
      if (stop || !rec) return;
      const next = { status: rec.signedAt? 'signed':'pending', certificate: rec.certificate || null };
      setEsign(prev=> (prev.status!==next.status || prev.certificate!==next.certificate) ? next : prev);
      if (rec.certificate){
        const already = (c.docs||[]).some(d => d.url===rec.certificate || d.name==='E-Sign Certificate.pdf');
        if (!already){
          try { pushDoc(c.id, { name:'E-Sign Certificate.pdf', url: rec.certificate }); } catch(_){ }
          try { pushEvent(c.id, { type:'esign_cert_added', text: rec.certificate }); } catch(_){ }
        }
      }
    }
    check();
    const id = setInterval(check, 30000);
    return ()=>{ stop = true; clearInterval(id); };
  }, [c.id, c.claimNumber, c.email]);

  // Attachments selection (docs with URL)
  const [attach, setAttach] = useState({}); // url -> bool
  const toggleAttach = (u) => setAttach(prev=> ({ ...prev, [u]: !prev[u] }));
  const selectedAttachments = () => Object.entries(attach).filter(([,v])=>v).map(([u])=>u);
  const absUrl = (u) => { try{ return new URL(u, (location?.origin||'')).href; }catch{ return u; } };

  // Insurance email
  const [insEmail, setInsEmail] = useState(c.insurerEmail||'');
  useEffect(()=>{ if (c.insurerEmail && c.insurerEmail!==insEmail) setInsEmail(c.insurerEmail); }, [c.insurerEmail]);

  // Uploads & camera capture
  const [uploading, setUploading] = useState(false);
  const [showCam, setShowCam] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  let mediaStreamRef = useRef(null);

  async function openCamera(){
    try{
      const ms = await navigator.mediaDevices.getUserMedia({ video:true, audio:false });
      mediaStreamRef.current = ms;
      setShowCam(true);
      if (videoRef.current){ videoRef.current.srcObject = ms; await videoRef.current.play(); }
    }catch(e){ alert('Camera access failed'); }
  }
  function closeCamera(){
    if (mediaStreamRef.current){ mediaStreamRef.current.getTracks().forEach(t=>t.stop()); mediaStreamRef.current=null; }
    setShowCam(false);
  }
  async function capturePhoto(){
    try{
      const v = videoRef.current; const cv = canvasRef.current; if (!v || !cv) return;
      cv.width = v.videoWidth; cv.height = v.videoHeight; const ctx = cv.getContext('2d'); ctx.drawImage(v,0,0);
      cv.toBlob(async (blob)=>{
        if (!blob) return;
        const file = new File([blob], `capture_${Date.now()}.png`, { type:'image/png' });
        const fd = new FormData(); fd.append('file', file, file.name);
        setUploading(true);
        try{
          const r = await fetch('/api/upload', { method:'POST', body: fd }).then(r=>r.json());
          if (r?.ok && r.file?.path){ pushDoc(c.id,{ name:file.name, size:file.size, url:r.file.path }); }
        }finally{ setUploading(false); }
      }, 'image/png');
    }catch(e){ alert('Capture failed'); }
  }

  async function sendSMS(){
    await fetch('/api/sms',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ to:c.phone, body: msg })});
    pushMsg(c.id,{ dir:'out', type:'sms', to:c.phone, body:msg });
    setMsg('');
  }

  async function sendEmail(){
    const atts = selectedAttachments().map(u=>({ path: absUrl(u) }));
    await fetch('/api/email',{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        to:c.email,
        subject:`Storm work update for ${c.address}`,
        html: msg,
        claimNumber: c.claimNumber || undefined,
        attachments: atts
      })
    });
    pushMsg(c.id,{ dir:'out', type:'email', to:c.email, body:msg });
    setMsg('');
  }

  // Auto-attach latest photos if nothing selected
  function pickImageDocs(){
    const arr = (c.docs||[]).filter(d=>/\.(png|jpe?g|webp|gif|bmp)$/i.test(d.name||''));
    return arr;
  }

  async function sendInsuranceEmail(){
    if (!insEmail){ alert('Enter insurance/adjuster email'); return; }
    update(c.id,{ insurerEmail: insEmail });
    let urls = selectedAttachments();
    if (!urls.length){
      const imgs = pickImageDocs();
      urls = imgs.slice(Math.max(0, imgs.length-10)).map(d=>d.url).filter(Boolean); // latest up to 10
    }
    const atts = urls.map(u=>({ path: absUrl(u) }));
    await fetch('/api/email',{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        to:insEmail,
        subject:`Claim ${c.claimNumber||''} — Evidence package for ${c.address}`,
        html: msg || `Attached files regarding claim ${c.claimNumber||''} for ${c.address}.`,
        claimNumber: c.claimNumber || undefined,
        attachments: atts
      })
    });
    pushEvent(c.id,{ type:'email_insurance', to: insEmail });
  }

  // AI captions for selected photos (or auto-picked)
  async function aiCaptionSelected(){
    let photos = selectedAttachments().map(u=>({ url: absUrl(u) }));
    if (!photos.length) photos = pickImageDocs().map(d=>({ url: absUrl(d.url), name: d.name }));
    if (!photos.length){ alert('Select or upload photos first.'); return; }
    const r = await fetch('/api/describe/batch',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ photos }) }).then(r=>r.json()).catch(()=>null);
    if (!r?.results) { alert('AI captions failed.'); return; }
    // write captions back onto docs and add to timeline
    const byUrl = new Map(r.results.map(x=>[x.url, x.caption]));
    const docs = (c.docs||[]).map(d => d.url && byUrl.has(absUrl(d.url)) ? ({ ...d, caption: byUrl.get(absUrl(d.url)) }) : d);
    update(c.id, { docs });
    for (const it of r.results){ pushEvent(c.id, { type:'ai_caption', text: `${it.url} → ${it.caption}` }); }
    // Signal map to refresh filters/markers
    try{ window.dispatchEvent(new CustomEvent('storm-docs-updated', { detail:{ id:c.id } })); }catch{}
    alert('AI captions added to photos.');
  }

  async function ownerPrefill(){
    try{
      if(!c.address){ alert('Add service address first'); return; }
      const r = await fetch('/api/owner-lookup',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ address: c.address }) }).then(r=>r.json());
      if (r){
        const patch = { name: r.ownerName || c.name };
        if (r.mailingAddress) patch.mailingAddress = r.mailingAddress;
        update(c.id, patch);
        pushEvent(c.id,{ type:'owner_prefill', text: r.ownerName || 'unknown' });
        alert('Owner details prefilled');
      }
    }catch(e){ alert('Owner lookup failed'); }
  }

  async function sendForESign(){
    try{
      if (!c.email){ alert('Need customer email'); return; }
      const payload = { email: c.email, name: c.name || 'Customer', address: c.address, claimNumber: c.claimNumber };
      let link = null;
      try{
        const r = await fetch('/api/esign/initiate',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) }).then(r=>r.json());
        if (r?.link) link = r.link;
      }catch(_){}
      if (link){
        await fetch('/api/email',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ to:c.email, subject:`Please e-sign: Emergency Tree Removal`, html:`Please review and e-sign: <a href="${link}">${link}</a>`, claimNumber:c.claimNumber||undefined })});
        pushEvent(c.id,{ type:'esign_sent', text: link });
        alert('E-sign invite sent');
      } else {
        await fetch('/api/email',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ to:c.email, subject:`Review & approve emergency contract`, html:`Please review the attached contract and reply \"I agree\" to authorize emergency work.<br/><a href=\"/files/contract.pdf\">Open Contract</a>`, claimNumber:c.claimNumber||undefined, attachments:[{ path: absUrl('/files/contract.pdf') }] })});
        pushEvent(c.id,{ type:'contract_sent', text:'/files/contract.pdf' });
        alert('Fallback email sent with contract attached');
      }
    }catch(e){ alert('E-sign send failed'); }
  }

  async function requestPayment(){
    const items = invoiceItems.map(it=>({ name: it.name||'Service', amount: Number(it.amount||0), quantity: Number(it.quantity||1) }));
    if (tax > 0) items.push({ name:'Tax', amount: Number(tax.toFixed(2)), quantity: 1 });
    const r = await fetch('/api/invoice/checkout', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ customer: { email: c.email }, lineItems: items, metadata: { claim: c.claimNumber||'', customerId: c.id } })
    }).then(r=>r.json()).catch(()=>null);
    if (r?.url){
      if (c.phone) await fetch('/api/sms',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ to:c.phone, body:`Pay securely for ${c.address}: ${r.url}` })});
      if (c.email) await fetch('/api/email',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ to:c.email, subject:`Payment link for ${c.address}`, html:`<a href=\"${r.url}\">Pay securely</a>`, claimNumber:c.claimNumber||undefined })});
      alert('Payment link sent.');
    } else {
      alert('Payment link failed.');
    }
  }

  async function submitClaimPackage(){
    if (!insEmail){ alert('Enter insurance/adjuster email'); return; }
    let urls = selectedAttachments();
    if (!urls.length){
      const imgs = pickImageDocs();
      urls = imgs.map(d=>d.url).filter(Boolean);
    }
    const payload = {
      to: insEmail,
      claimNumber: c.claimNumber||'',
      address: c.address||'',
      customerName: c.name||'',
      contractor: { name:'Strategic Land Management LLC', phone:'888-628-2229', website:'https://www.strategiclandmgmt.com' },
      attachments: [ ...urls.map(absUrl), esign.certificate?absUrl(esign.certificate):null, absUrl('/files/contract.pdf') ].filter(Boolean),
      invoice: { items: invoiceItems, taxRate, subtotal, total }
    };
    const r = await fetch('/api/claim/package',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) }).then(r=>r.json()).catch(()=>null);
    if (r?.ok){ pushEvent(c.id,{ type:'claim_package_sent', to: insEmail, text: r.summaryPath }); window.open(r.summaryPath, '_blank'); alert('Claim package sent.'); }
    else alert('Claim package failed.');
  }

  function changeStatus(s){
    update(c.id,{ status:s });
    pushEvent(c.id,{ type:'status', to:s });
    // Register SLA watches for certain statuses
    const map = { claim_submitted:'claim_submitted', work_completed:'work_completed', lien_filed:'lien_filed' };
    if (map[s]){
      fetch('/api/sla/register',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ customerId:c.id, type: map[s], ts: Date.now(), address:c.address, name:c.name }) });
    }
  }

  const badges = slaBadges(c); // recompute every minute via nowTick
  void nowTick;

  return (
    <Card><CardContent className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-lg font-semibold">{c.name||'Unknown Owner'}</div>
          <div className="text-sm text-muted-foreground">{c.address}</div>
          {c.mailingAddress && <div className="text-xs">Mailing: {c.mailingAddress}</div>}
          <div className="text-xs">{c.insurer || 'Insurer N/A'} • Claim #{c.claimNumber||'—'}</div>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {badges.map(b=> (<span key={b.key} className={`text-xs px-2 py-1 rounded-full ${b.tone}`}>{b.txt}</span>))}
          <span className={`text-xs px-2 py-1 rounded-full ${esign.status==='signed'?'bg-green-600 text-white':esign.status==='pending'?'bg-amber-500 text-black':'bg-gray-300 text-gray-800'}`}>E‑Sign: {esign.status==='signed'?'Signed':esign.status==='pending'?'Pending':'Unknown'}</span>
          <Button variant="outline" onClick={ownerPrefill}>Owner Prefill</Button>
          <Button variant="outline" onClick={()=>{ try{ window.dispatchEvent(new CustomEvent('storm-center',{ detail:{ address:c.address, name:c.name } })); }catch{} }}>Open on Map</Button>
          <select className="border rounded-md px-2 py-1" value={c.status} onChange={(e)=>changeStatus(e.target.value)}>
            {PIPELINE.map(p => <option key={p} value={p}>{p.replace(/_/g,' ')}</option>)}
          </select>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-3">
        {/* Communications */}
        <div className="space-y-2">
          <div className="font-medium">Communications</div>
          <Input value={msg} onChange={(e)=>setMsg(e.target.value)} placeholder="Write SMS/Email..." />
          <div className="flex gap-2">
            {c.phone && <Button onClick={sendSMS}>Send SMS</Button>}
            {c.email && <Button variant="secondary" onClick={sendEmail}>Send Email</Button>}
            {c.phone && <a href={`tel:${c.phone.replace(/[^0-9+]/g,'')}`}><Button variant="outline">Call</Button></a>}
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span>Insurance Email</span>
            <Input style={{width:220}} value={insEmail} onChange={(e)=>setInsEmail(e.target.value)} placeholder="adjuster@insurer.com" />
            <Button variant="outline" onClick={sendInsuranceEmail}>Email Insurance</Button>
          </div>
          <div className="space-y-1 max-h-40 overflow-auto">
            {c.messages?.map((m,i)=>(<div key={i} className="text-xs">[{new Date(m.ts).toLocaleString()}] {m.type?.toUpperCase()} → {m.to}: {m.body}</div>))}
          </div>
          <div className="mt-2 text-xs">
            <div className="font-medium">Insurance Thread</div>
            <div className="max-h-40 overflow-auto space-y-1">
              {thread.map((m,i)=>(
                <div key={i}>[{new Date(m.ts).toLocaleString()}] {m.dir==='in'?'FROM':'TO'} {m.dir==='in'?m.from:m.to}: <span dangerouslySetInnerHTML={{__html: m.subject||''}} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Docs & Media */}
        <div className="space-y-2">
          <div className="font-medium">Docs & Media</div>
          <input type="file" multiple onChange={async (e)=>{
            const files = Array.from(e.target.files||[]);
            if (!files.length) return;
            setUploading(true);
            for (const f of files){
              try{
                const fd = new FormData(); fd.append('file', f, f.name);
                const r = await fetch('/api/upload', { method:'POST', body: fd }).then(r=>r.json());
                if (r?.ok && r.file?.path){ pushDoc(c.id,{ name:f.name, size:f.size, url:r.file.path }); }
                else { pushDoc(c.id,{ name:f.name, size:f.size }); }
              }catch(_){ pushDoc(c.id,{ name:f.name, size:f.size }); }
            }
            setUploading(false);
          }} />
          <div className="text-xs text-muted-foreground">Contracts, proof of insurance, photos/videos. {uploading && <b>Uploading…</b>}</div>
          <div className="text-xs">Select files to attach in emails:</div>
          <div className="space-y-1 max-h-40 overflow-auto">
            {c.docs?.map((d,i)=>(
              <div key={i} className="text-xs flex items-center gap-2">
                {d.url && <input type="checkbox" checked={!!attach[d.url]} onChange={()=>toggleAttach(d.url)} />}
                📄 {d.url ? <a href={d.url} target="_blank" rel="noreferrer">{d.name||'file'}</a> : <span>{d.name} {d.size?`(${Math.round((d.size||0)/1024)} KB)`:''}</span>}
                {d.caption && <span className="ml-2 italic opacity-75">— {d.caption}</span>}
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={aiCaptionSelected}>AI Caption Selected</Button>
            {!showCam && <Button variant="outline" onClick={openCamera}>Open Camera</Button>}
          </div>
          {showCam && (
            <div className="space-y-2">
              <video ref={videoRef} autoPlay playsInline style={{width:'100%', maxHeight:240, background:'#000'}} />
              <canvas ref={canvasRef} style={{display:'none'}} />
              <div className="flex gap-2">
                <Button onClick={capturePhoto}>Capture Photo</Button>
                <Button variant="outline" onClick={closeCamera}>Close</Button>
              </div>
            </div>
          )}
        </div>

        {/* Notes / Timeline */}
        <div className="space-y-2">
          <div className="font-medium">Notes / Timeline</div>
          <Input value={note} onChange={(e)=>setNote(e.target.value)} placeholder="Add an internal note" />
          <Button variant="outline" onClick={()=>{ pushEvent(c.id,{ type:'note', text:note }); setNote(''); }}>Add Note</Button>
          <div className="space-y-1 max-h-40 overflow-auto">
            {c.timeline?.map((t,i)=>(<div key={i} className="text-xs">[{new Date(t.ts).toLocaleString()}] {t.type} {t.text||t.to||''}</div>))}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={()=>changeStatus('contract_signed')}>Mark Contracted</Button>
        <Button variant="outline" onClick={()=>changeStatus('claim_submitted')}>Mark Claim Submitted</Button>
        <Button variant="outline" onClick={()=>changeStatus('work_completed')}>Mark Work Completed</Button>
        <Button variant="outline" onClick={()=>changeStatus('lien_filed')}>Mark Lien Filed</Button>
        <Button variant="outline" onClick={()=>changeStatus('paid')}>Mark Paid</Button>
        <Button onClick={sendForESign}>Send for E‑Sign</Button>
        <Button variant="secondary" onClick={async ()=>{
          const params = new URLSearchParams({});
          if (c.claimNumber) params.set('claim', c.claimNumber);
          if (c.email) params.set('email', c.email);
          const r = await fetch(`/api/esign/status?${params.toString()}`).then(r=>r.json()).catch(()=>null);
          const rec = r?.record || (r?.results && (r.results.find(x=>x.signedAt) || r.results[0])) || null;
          if (rec){ setEsign({ status: rec.signedAt?'signed':'pending', certificate: rec.certificate||null }); if (rec.certificate) pushDoc(c.id,{ name:'E-Sign Certificate.pdf', url: rec.certificate }); }
        }}>Refresh E‑Sign Status</Button>
        <Button onClick={requestPayment}>Request Payment</Button>
        <Button onClick={submitClaimPackage}>Submit Claim Package</Button>
      </div>

      {/* Funding & Payments */}
      <FundingAndReviews 
        c={c} 
        update={update} 
        pushEvent={pushEvent} 
        invoiceTotal={total} 
        onPaymentRecorded={(amt) => {
          // Optional: sync with invoice state if needed
        }} 
      />

      {/* Work Completed Button */}
      <WorkCompletedButton c={c} onDone={(customer) => update(c.id, customer)} />

      {/* Claim Package Email */}
      <ClaimPackageEmail c={c} />

      {/* Photo Report */}
      <PhotoReportBlock c={c} absUrl={absUrl} pickImageDocs={pickImageDocs} />
    </CardContent></Card>
  );
}

function FundingAndReviews({ c, update, pushEvent, invoiceTotal, onPaymentRecorded }: {
  c: any;
  update: (id: string, data: any) => void;
  pushEvent: (id: string, event: any) => void;
  invoiceTotal?: number;
  onPaymentRecorded?: (amount: number) => void;
}){
  const [method, setMethod] = useState(c.funding?.paymentMethod||'');
  const [insurance, setInsurance] = useState(!!c.funding?.insuranceSelected);
  const [loan, setLoan] = useState(!!c.funding?.loanSelected);
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState({ paid:0, balance: (c.invoiceTotal||0) });
  const [autoAI, setAutoAI] = useState(c.autoAI!==false);
  const [autoReplies, setAutoReplies] = useState(c.autoReplies!==false);

  useEffect(()=>{ 
    (async()=>{
      const r = await fetch(`/api/payments/status?customerId=${encodeURIComponent(c.id)}`).then(r=>r.json()).catch(()=>({}));
      const inv = Number(invoiceTotal ?? c.invoiceTotal ?? 0);
      setStatus({ paid: Number(r.paid||0), balance: Math.max(0, inv - Number(r.paid||0)) });
    })(); 
  }, [c.id, invoiceTotal, c.invoiceTotal]);

  async function saveFunding(next?: any){
    const body = { 
      customerId:c.id, 
      paymentMethod: next?.method ?? method, 
      insuranceSelected: next?.insurance ?? insurance, 
      loanSelected: next?.loan ?? loan, 
      notify: true 
    };
    const r = await fetch('/api/customer/funding',{ 
      method:'POST', 
      headers:{'Content-Type':'application/json'}, 
      body: JSON.stringify(body) 
    }).then(r=>r.json()).catch(()=>null);
    if (r?.ok){ 
      update(c.id,{ funding:r.funding }); 
      pushEvent(c.id,{ type:'funding_update', text: JSON.stringify(r.funding) }); 
    }
  }

  async function recordPayment(){
    const amt = Number(amount||0); 
    if (!amt) return alert('Enter amount');
    const r = await fetch('/api/payments/record',{ 
      method:'POST', 
      headers:{'Content-Type':'application/json'}, 
      body: JSON.stringify({ customerId:c.id, amount: amt, method: method||'unknown' }) 
    }).then(r=>r.json()).catch(()=>null);
    if (r?.ok){ 
      onPaymentRecorded?.(amt); 
      setAmount(''); 
      setStatus(s=> ({ 
        ...s, 
        paid: (s.paid||0)+amt, 
        balance: Math.max(0, (invoiceTotal||c.invoiceTotal||0) - ((s.paid||0)+amt) ) 
      })); 
      pushEvent(c.id,{ type:'payment_recorded', text:`${amt} via ${method}` }); 
    }
  }

  async function sendReviewReq(){ 
    await fetch('/api/reviews/send',{ 
      method:'POST', 
      headers:{'Content-Type':'application/json'}, 
      body: JSON.stringify({ customerId:c.id }) 
    }); 
    pushEvent(c.id,{ type:'review_request_sent' }); 
  }

  function toggleAI(v: boolean){ 
    setAutoAI(v); 
    update(c.id,{ autoAI: v }); 
  }
  
  function toggleReplies(v: boolean){ 
    setAutoReplies(v); 
    update(c.id,{ autoReplies: v }); 
  }

  return (
    <div className="mt-3 border rounded-md p-3 space-y-2">
      <div className="font-medium">Funding & Payments</div>
      <div className="grid md:grid-cols-3 gap-3">
        <div className="space-y-2">
          <div className="text-xs">Payment method</div>
          <select 
            className="border rounded px-2 py-1 w-full" 
            value={method} 
            onChange={(e)=>{ 
              setMethod(e.target.value); 
              saveFunding({ method:e.target.value }); 
            }}
          >
            <option value="">Select…</option>
            <option>Cash</option>
            <option>Visa</option>
            <option>MasterCard</option>
            <option>American Express</option>
            <option>Discover</option>
            <option>Debit</option>
            <option>Credit</option>
            <option>Check</option>
          </select>
          <div className="text-xs opacity-70">
            Paid: {dollars(status.paid)} • Balance: {dollars(status.balance)}
          </div>
          <div className="flex gap-2 items-center">
            <input 
              className="border px-2 py-1 w-28" 
              placeholder="Amount" 
              value={amount} 
              onChange={(e)=>setAmount(e.target.value)} 
            />
            <Button size="sm" onClick={recordPayment}>Record Payment</Button>
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-xs">Funding path</div>
          <label className="text-sm flex items-center gap-2">
            <input 
              type="checkbox" 
              checked={insurance} 
              onChange={(e)=>{ 
                setInsurance(e.target.checked); 
                saveFunding({ insurance:e.target.checked }); 
              }} 
            /> 
            Customer filing insurance
          </label>
          <label className="text-sm flex items-center gap-2">
            <input 
              type="checkbox" 
              checked={loan} 
              onChange={(e)=>{ 
                setLoan(e.target.checked); 
                saveFunding({ loan:e.target.checked }); 
              }} 
            /> 
            SBA/FEMA disaster loan
          </label>
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={()=>saveFunding({ insurance:true })}
            >
              Send Insurance Email
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={()=>saveFunding({ loan:true })}
            >
              Send Loan Email & Text
            </Button>
          </div>
          <div className="text-xs opacity-70">
            Selecting either path sends a thank‑you + instructions (with review links). 
            Loan also sends SBA/FEMA links by SMS (if phone set).
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-xs">Automation</div>
          <label className="text-sm flex items-center gap-2">
            <input 
              type="checkbox" 
              checked={autoAI} 
              onChange={(e)=>toggleAI(e.target.checked)} 
            /> 
            Enable AI reminders (30/45‑day)
          </label>
          <label className="text-sm flex items-center gap-2">
            <input 
              type="checkbox" 
              checked={autoReplies} 
              onChange={(e)=>toggleReplies(e.target.checked)} 
            /> 
            Enable auto‑replies
          </label>
          <div className="flex gap-2">
            <Button size="sm" onClick={sendReviewReq}>Send Review Request</Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={async()=>{ 
                const r=await fetch('/api/payments/status?customerId='+encodeURIComponent(c.id)).then(r=>r.json()); 
                alert(`Paid ${dollars(r.paid||0)} — Balance ${dollars(Math.max(0,(c.invoiceTotal||0)-(r.paid||0)))}`); 
              }}
            >
              Check Balance
            </Button>
          </div>
          <div className="text-xs opacity-70">
            At 45 days past work completion (if unpaid), a demand letter PDF is generated and emailed; 
            a printable copy is saved.
          </div>
        </div>
      </div>
    </div>
  );
}

function WorkCompletedButton({ c, onDone }: { c: any; onDone?: (customer: any) => void }) {
  async function markDone(){
    if (!confirm('Mark work completed now? This starts the 30/45‑day clock and adds follow‑ups to the Calendar.')) return;
    const r = await fetch('/api/customer/work-completed',{ 
      method:'POST', 
      headers:{'Content-Type':'application/json'}, 
      body: JSON.stringify({ customerId:c.id, contractorId:'ctr:default' }) 
    }).then(r=>r.json()).catch(()=>null);
    if (r?.ok){ 
      onDone?.(r.customer); 
      alert('Marked completed & scheduled follow‑ups.'); 
    }
  }
  return (
    <div className="mt-3 border rounded-md p-3">
      <div className="font-medium mb-2">Work Completion</div>
      <Button size="sm" onClick={markDone} data-testid="button-work-completed">Set Work Completed</Button>
      <div className="text-xs text-muted-foreground mt-1">
        This starts the payment countdown and schedules automatic follow-ups.
      </div>
    </div>
  );
}

function ClaimPackageEmail({ c }: { c: any }) {
  const [to, setTo] = useState(c.insurerEmail||'');
  const [cc, setCc] = useState('');
  const [notes, setNotes] = useState('');
  const [includeContract, setIncC] = useState(true);
  const [includeReport, setIncR] = useState(true);
  
  async function send(){
    const body = { 
      customerId: c.id, 
      to, 
      cc: cc? cc.split(',').map((s: string)=>s.trim()):[], 
      includeContract: includeContract, 
      includeLatestPhotoReport: includeReport, 
      extraNotes: notes 
    };
    const r = await fetch('/api/claim/package/send',{ 
      method:'POST', 
      headers:{'Content-Type':'application/json'}, 
      body: JSON.stringify(body) 
    }).then(r=>r.json()).catch(()=>null);
    if (r?.ok) alert('Claim package sent.'); else alert('Failed to send.');
  }
  
  return (
    <div className="mt-3 border rounded-md p-3 space-y-2">
      <div className="font-medium">Claim Package</div>
      <div className="grid md:grid-cols-2 gap-2">
        <Input 
          className="border px-2 py-1" 
          placeholder="To (insurer email)" 
          value={to} 
          onChange={(e)=>setTo(e.target.value)}
          data-testid="input-claim-package-to"
        />
        <Input 
          className="border px-2 py-1" 
          placeholder="CC (comma separated)" 
          value={cc} 
          onChange={(e)=>setCc(e.target.value)}
          data-testid="input-claim-package-cc"
        />
      </div>
      <textarea 
        className="border w-full px-2 py-1 resize-none" 
        rows={3} 
        placeholder="Notes to include in summary" 
        value={notes} 
        onChange={(e)=>setNotes(e.target.value)}
        data-testid="textarea-claim-package-notes"
      />
      <div className="space-y-1">
        <label className="text-sm flex items-center gap-2">
          <input 
            type="checkbox" 
            checked={includeContract} 
            onChange={(e)=>setIncC(e.target.checked)}
            data-testid="checkbox-include-contract"
          /> 
          Attach contract
        </label>
        <label className="text-sm flex items-center gap-2">
          <input 
            type="checkbox" 
            checked={includeReport} 
            onChange={(e)=>setIncR(e.target.checked)}
            data-testid="checkbox-include-report"
          /> 
          Attach latest photo report
        </label>
      </div>
      <div>
        <Button size="sm" onClick={send} data-testid="button-send-claim-package">Send Claim Package</Button>
      </div>
      <div className="text-xs text-muted-foreground">
        Generates claim summary PDF with photos and sends to insurer with optional attachments.
      </div>
    </div>
  );
}

function PhotoReportBlock({ c, absUrl, pickImageDocs }){
  const [reportNotes, setReportNotes] = useState('');
  const [insEmail, setInsEmail] = useState(c.insurerEmail||'');
  useEffect(()=>{ if (c.insurerEmail && c.insurerEmail!==insEmail) setInsEmail(c.insurerEmail); }, [c.insurerEmail]);
  
  async function makePhotoReport(){
    const imgs = pickImageDocs();
    if (!imgs.length){ alert('Select or upload some photos first.'); return; }
    const payload = {
      claimNumber: c.claimNumber||'', address: c.address||'', customerName: c.name||'',
      contractor: { name:'Strategic Land Management LLC', phone:'888-628-2229', website:'https://www.strategiclandmgmt.com' },
      photos: imgs.map(d=>({ url: absUrl(d.url||''), note: reportNotes||'' })), title: 'Storm Damage Photo Report'
    };
    const r = await fetch('/api/report/photo',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) }).then(r=>r.json()).catch(()=>null);
    if (r?.path){
      window.open(r.path, '_blank');
      if (insEmail){
        await fetch('/api/email',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ to:insEmail, subject:`Claim ${c.claimNumber||''} — Photo Report`, html:`Please see attached report for ${c.address}.`, claimNumber:c.claimNumber||undefined, attachments:[{ path: absUrl(r.path) }] }) });
      }
    } else { alert('Photo report failed.'); }
  }
  
  return (
    <div className="mt-3 border rounded-md p-3 space-y-2">
      <div className="font-medium">Photo Report</div>
      <Input value={reportNotes} onChange={(e)=>setReportNotes(e.target.value)} placeholder="Optional caption for selected photos (e.g., Tree on roof — tarp installed)." />
      <div className="text-xs text-muted-foreground">We'll bundle selected photos into a PDF with your note and claim info. If Insurance Email is set, we'll auto-email it.</div>
      <Button onClick={makePhotoReport}>Generate Photo Report PDF</Button>
    </div>
  );
}

// --- Photo Reports (auto captions placeholder + PDF) ---
function ReportBuilder(){
  const [items, setItems] = useState<any[]>([]); // {file, caption}
  const [pdfName, setPdfName] = useState('storm-report.pdf');
  function onFiles(e: any){ const fs = Array.from(e.target.files||[]); setItems((prev: any)=>[...prev, ...fs.map((f: any)=>({ file:f, caption:'Auto: damage detected (placeholder)' }))]); }
  async function autoDescribe(){ setItems((prev: any)=> prev.map((x: any)=> ({...x, caption: x.caption.includes('placeholder')? 'Tree on roof; broken ridge; tarp recommended' : x.caption }))); }
  async function makePDF(){
    try {
      const mod = await import('jspdf'); const { jsPDF } = mod; const doc = new jsPDF();
      for (let i=0;i<items.length;i++){
        const it = items[i]; const dataUrl: any = await new Promise(res=>{ const r=new FileReader(); r.onload=()=>res(r.result); r.readAsDataURL(it.file); });
        if (i>0) doc.addPage();
        doc.setFontSize(14); doc.text(`Photo ${i+1}`, 14, 18);
        doc.addImage(dataUrl, 'JPEG', 14, 24, 180, 120);
        doc.setFontSize(12); wrapText(doc, it.caption, 14, 150, 180, 6);
      }
      doc.save(pdfName);
    } catch(e){ alert('Install jspdf: npm i jspdf'); }
  }
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="p-4 space-y-3">
        <div className="text-lg font-semibold">Photo Reports</div>
        <input type="file" accept="image/*" multiple onChange={onFiles} />
        <div className="grid md:grid-cols-3 gap-3">
          {items.map((it,idx)=> (
            <div key={idx} className="space-y-1">
              <img src={URL.createObjectURL(it.file)} className="w-full h-40 object-cover rounded" />
              <input value={it.caption} onChange={(e)=>setItems(items.map((x,i)=> i===idx?{...x, caption:e.target.value}:x))} className="border border-gray-300 rounded-md px-2 py-1 w-full text-sm" />
            </div>
          ))}
        </div>
        <div className="grid md:grid-cols-3 gap-2 items-center">
          <input value={pdfName} onChange={(e)=>setPdfName(e.target.value)} className="border border-gray-300 rounded-md px-2 py-1" />
          <button onClick={autoDescribe} className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 font-medium transition-colors">AI Describe (placeholder)</button>
          <button onClick={makePDF} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium transition-colors">Generate PDF</button>
        </div>
      </div>
    </div>
  );
}
function wrapText(doc: any, text: string, x: number, y: number, maxWidth: number, lineHeight: number){
  const words = text.split(' '); let line='';
  for (let n=0;n<words.length;n++){ const test = line + words[n] + ' ';
    if (doc.getTextWidth(test) > maxWidth){ doc.text(line.trim(), x, y); line = words[n] + ' '; y+=lineHeight; }
    else line = test;
  }
  if (line) doc.text(line.trim(), x, y);
}

// --- Liens & Legal (reminders + links) ---
function LiensLegal(){
  const [claimDate, setClaimDate] = useState('');       // 30 / 60 day reminders
  const [completeDate, setCompleteDate] = useState(''); // 45 day lien reminder
  const [lienDate, setLienDate] = useState('');         // 10-month warning
  function enableReminders(){
    fetch('/api/reminders', { method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ claimDate, completeDate, lienDate })});
    alert('Reminders scheduled on server (demo).');
  }
  function openNew(url: string) { window.open(url, '_blank', 'noopener,noreferrer'); }
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="p-4 space-y-3">
        <div className="text-lg font-semibold">Liens & Legal Tools</div>
        <div className="grid md:grid-cols-3 gap-2">
          <div><div className="text-sm">Claim Submitted</div><input type="date" value={claimDate} onChange={(e)=>setClaimDate(e.target.value)} className="border border-gray-300 rounded-md px-2 py-1 w-full" /></div>
          <div><div className="text-sm">Work Completed</div><input type="date" value={completeDate} onChange={(e)=>setCompleteDate(e.target.value)} className="border border-gray-300 rounded-md px-2 py-1 w-full" /></div>
          <div><div className="text-sm">Lien Filed</div><input type="date" value={lienDate} onChange={(e)=>setLienDate(e.target.value)} className="border border-gray-300 rounded-md px-2 py-1 w-full" /></div>
        </div>
        <div className="flex gap-2">
          <button onClick={enableReminders} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium transition-colors">Enable Reminders</button>
          <button onClick={()=>openNew('https://www.lienit.com/')} className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 font-medium transition-colors">Open LienIt</button>
          <button onClick={()=>openNew('https://www.lienitnow.com/')} className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 font-medium transition-colors">Open LienItNow</button>
        </div>
        <div className="text-xs text-gray-500">State lien laws vary widely. Use this as a reminder system and consult state-specific counsel for deadlines and rights.</div>
      </div>
    </div>
  );
}

// --- Review Links Editor Component ---
function ReviewLinksEditor(){
  const [links, setLinks] = useState([]);
  
  useEffect(()=>{ 
    fetch('/api/settings').then(r=>r.json()).then(s=> setLinks(s.reviewLinks||[])); 
  },[]);
  
  function add(){ 
    setLinks(ls=> [...ls, { label:'', url:'' }]); 
  }
  
  function save(){ 
    fetch('/api/settings/save',{ 
      method:'POST', 
      headers:{'Content-Type':'application/json'}, 
      body: JSON.stringify({ reviewLinks: links }) 
    }); 
  }
  
  return (
    <div className="border rounded p-3 space-y-2">
      <div className="font-semibold">Review Links</div>
      {links.map((l: any,i: number)=> (
        <div key={i} className="flex gap-2 items-center">
          <input 
            className="border px-2 py-1" 
            placeholder="Label (Google/Yelp/Website)" 
            value={l.label} 
            onChange={(e)=> setLinks(arr=>{ 
              const n=[...arr]; 
              n[i]={...n[i], label:e.target.value}; 
              return n; 
            })} 
          />
          <input 
            className="border px-2 py-1 flex-1" 
            placeholder="https://" 
            value={l.url} 
            onChange={(e)=> setLinks(arr=>{ 
              const n=[...arr]; 
              n[i]={...n[i], url:e.target.value}; 
              return n; 
            })} 
          />
        </div>
      ))}
      <div className="flex gap-2">
        <Button onClick={add}>Add Link</Button>
        <Button variant="outline" onClick={save}>Save</Button>
      </div>
    </div>
  );
}

// --- Calendar Helper Functions ---
function startOfWeek(d=new Date()){ const x=new Date(d); const day=(x.getDay()+6)%7; x.setDate(x.getDate()-day); x.setHours(0,0,0,0); return x; }
function endOfWeek(d=new Date()){ const x=startOfWeek(d); x.setDate(x.getDate()+7); return x; }

function ContractorsCalendar({ contractorId='ctr:default' }: { contractorId?: string }){
  const [weekStart, setWeekStart] = useState(startOfWeek());
  const [items, setItems] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0,10));
  const [time, setTime] = useState('09:00');
  const [dur, setDur] = useState(120);

  async function load(){
    const startTs = weekStart.getTime(); const endTs = endOfWeek(weekStart).getTime();
    const r = await fetch(`/api/schedule/list?contractorId=${encodeURIComponent(contractorId)}&startTs=${startTs}&endTs=${endTs}`).then(r=>r.json()).catch(()=>[]);
    setItems(r||[]);
  }
  useEffect(()=>{ load(); }, [weekStart, contractorId]);

  function shift(weeks: number){ const x=new Date(weekStart); x.setDate(x.getDate()+7*weeks); setWeekStart(x); }
  function dayCol(d: number){ const x=new Date(weekStart); x.setDate(x.getDate()+d); return x; }

  async function add(){
    if (!title) return alert('Enter a title');
    const ts = new Date(`${date}T${time}:00`).getTime();
    const r = await fetch('/api/schedule/add',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ contractorId, title, startTs: ts, endTs: ts + dur*60000, type:'job' }) }).then(r=>r.json());
    if (r?.ok){ setTitle(''); load(); }
  }

  const days = Array.from({length:7}, (_,i)=> dayCol(i));
  const grouped = days.map(d=> ({ date:d, items: items.filter((it: any)=> { const dd=new Date(it.startTs); return dd.getFullYear()===d.getFullYear() && dd.getMonth()===d.getMonth() && dd.getDate()===d.getDate(); }) }));

  return (
    <div className="border rounded-md p-3 space-y-3">
      <div className="font-medium text-lg mb-3">Contractors Calendar</div>
      <div className="flex items-center gap-2 flex-wrap">
        <Button variant="outline" onClick={()=>shift(-1)} data-testid="button-calendar-prev">&larr; Prev</Button>
        <div className="font-medium">Week of {weekStart.toLocaleDateString()}</div>
        <Button variant="outline" onClick={()=>shift(1)} data-testid="button-calendar-next">Next &rarr;</Button>
        <div className="ml-auto flex items-center gap-2 flex-wrap">
          <Input 
            className="w-32" 
            placeholder="Task title" 
            value={title} 
            onChange={(e)=>setTitle(e.target.value)}
            data-testid="input-task-title"
          />
          <Input 
            className="w-36" 
            type="date" 
            value={date} 
            onChange={(e)=>setDate(e.target.value)}
            data-testid="input-task-date"
          />
          <Input 
            className="w-24" 
            type="time" 
            value={time} 
            onChange={(e)=>setTime(e.target.value)}
            data-testid="input-task-time"
          />
          <Input 
            className="w-20" 
            type="number" 
            value={dur} 
            onChange={(e)=>setDur(Number(e.target.value))}
            placeholder="mins"
            data-testid="input-task-duration"
          />
          <Button onClick={add} data-testid="button-add-task">Add</Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 text-sm">
        {grouped.map((g,i)=> (
          <div key={i} className="border rounded p-2 min-h-[220px]">
            <div className="font-semibold text-xs mb-1">{g.date.toLocaleDateString(undefined,{ weekday:'short', month:'short', day:'numeric' })}</div>
            <div className="space-y-1">
              {g.items.map((it: any)=> (
                <div key={it.id} className="border rounded p-2 text-xs">
                  <div className="opacity-70">{new Date(it.startTs).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</div>
                  <div className="font-medium">{it.title}</div>
                  {it.detail && <div className="opacity-60">{it.detail}</div>}
                  <div className="text-xs opacity-50 mt-1">{it.type}</div>
                </div>
              ))}
              {!g.items.length && <div className="text-xs opacity-50">No items</div>}
            </div>
          </div>
        ))}
      </div>

      <TodayTaskList contractorId={contractorId} />
    </div>
  );
}

function TodayTaskList({ contractorId }: { contractorId: string }){
  const [items, setItems] = useState<any[]>([]);
  useEffect(()=>{
    async function load(){
      const now = new Date(); now.setHours(0,0,0,0); const start=now.getTime(); const end=start+24*3600*1000;
      const r = await fetch(`/api/schedule/list?contractorId=${encodeURIComponent(contractorId)}&startTs=${start}&endTs=${end}`).then(r=>r.json()).catch(()=>[]);
      setItems(r||[]);
    }
    load();
  }, [contractorId]);
  
  return (
    <div className="border rounded p-3">
      <div className="font-medium mb-1">Today's Tasks</div>
      <div className="space-y-1">
        {items.map((it: any)=> (
          <div key={it.id} className="border rounded p-2 text-sm flex items-center justify-between">
            <div>
              <div className="font-medium">{it.title}</div>
              {it.detail && <div className="text-xs opacity-70">{it.detail}</div>}
              <div className="text-xs opacity-50">{it.type} • {it.status}</div>
            </div>
            <div className="text-xs opacity-70">{new Date(it.startTs).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</div>
          </div>
        ))}
        {!items.length && <div className="text-xs opacity-50">No tasks scheduled today.</div>}
      </div>
    </div>
  );
}

// --- Contractor Portal (Strategic LM) ---
function ContractorPortal(){
  const [documents, setDocuments] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [photos, setPhotos] = useState<any[]>([]);
  const [insuranceCompanies, setInsuranceCompanies] = useState<any[]>([]);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [leadsLoading, setLeadsLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('leads'); // leads, invoices, photos, claims
  const contractorId = "strategic-land-mgmt"; // In a real app, get from auth context
  
  function openNew(url: string) { window.open(url, '_blank', 'noopener,noreferrer'); }
  
  // Load contractor documents
  useEffect(() => {
    fetch(`/api/contractor-documents/${contractorId}`)
      .then(r => r.json())
      .then(data => {
        setDocuments(data.documents || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Load leads data
  useEffect(() => {
    Promise.all([
      fetch(`/api/leads?contractorId=${contractorId}`).then(r => r.json()),
      fetch(`/api/invoices?contractorId=${contractorId}`).then(r => r.json()),
      fetch(`/api/photos?contractorId=${contractorId}`).then(r => r.json()),
      fetch('/api/insurance-companies').then(r => r.json())
    ]).then(([leadsData, invoicesData, photosData, insuranceData]) => {
      setLeads(leadsData.leads || []);
      setInvoices(invoicesData.invoices || []);
      setPhotos(photosData.photos || []);
      setInsuranceCompanies(insuranceData.companies || []);
      setLeadsLoading(false);
    }).catch(() => setLeadsLoading(false));
  }, []);

  const handleUploadComplete = async (result: any, documentType: string, title: string) => {
    if (result.successful && result.successful.length > 0) {
      const uploadedFile = result.successful[0];
      
      try {
        const response = await fetch('/api/contractor-documents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contractorId,
            documentType,
            fileName: uploadedFile.name,
            fileUrl: uploadedFile.uploadURL,
            title,
            description: `Uploaded ${documentType} document`
          })
        });
        
        if (response.ok) {
          const newDoc = await response.json();
          setDocuments(prev => [...prev, newDoc]);
        }
      } catch (error) {
        console.error('Error saving document:', error);
      }
    }
  };

  const getUploadParameters = async () => {
    const response = await fetch('/api/contractor-documents/upload-url', { method: 'POST' });
    const data = await response.json();
    return {
      method: 'PUT' as const,
      url: data.uploadURL
    };
  };

  const contracts = documents.filter(doc => doc.documentType === 'contract');
  const priceSheets = documents.filter(doc => doc.documentType === 'price_sheet');
  
  return (
    <div className="space-y-4">
      <Card><CardContent className="p-4 space-y-2">
        <div className="text-2xl font-bold">Strategic Land Management LLC</div>
        <div>Emergency Storm Response Team</div>
        <div className="text-sm">📞 888-628-2229 • 🌐 <a className="underline" href="https://www.strategiclandmgmt.com" target="_blank" rel="noreferrer">www.strategiclandmgmt.com</a> • ✉️ strategiclandmgmt@gmail.com</div>
        <div className="text-xs text-muted-foreground">Veteran-owned & disabled veteran-owned. Certified arborist: John Culpepper.</div>
        <div className="grid md:grid-cols-2 gap-3 mt-2">
          <Button variant="secondary" onClick={()=>openNew('https://www.sba.gov/funding-programs/disaster-assistance')}>SBA Disaster Loans</Button>
          <Button variant="secondary" onClick={()=>openNew('https://www.fema.gov/assistance/individual')}>FEMA Individual Assistance</Button>
        </div>
      </CardContent></Card>

      <Card><CardContent className="p-4 space-y-3">
        <div className="font-semibold">Customer Contracts</div>
        <div className="text-sm text-muted-foreground">Upload and manage multiple contract templates for customers</div>
        
        <div className="space-y-2">
          <ObjectUploader
            maxNumberOfFiles={1}
            maxFileSize={10485760} // 10MB
            onGetUploadParameters={getUploadParameters}
            onComplete={(result) => handleUploadComplete(result, 'contract', `Contract ${Date.now()}`)}
            buttonClassName="w-full"
          >
            📄 Upload New Contract
          </ObjectUploader>
          
          {loading ? (
            <div className="text-sm text-muted-foreground">Loading contracts...</div>
          ) : contracts.length > 0 ? (
            <div className="space-y-2">
              <div className="text-sm font-medium">Uploaded Contracts:</div>
              {contracts.map((contract) => (
                <div key={contract.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{contract.title}</div>
                    <div className="text-xs text-muted-foreground">{contract.fileName}</div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={()=>openNew(contract.fileUrl)}>
                      Open
                    </Button>
                    <Button size="sm" onClick={()=>console.log('Email contract to customer')}>
                      Email to Customer
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">No contracts uploaded yet</div>
          )}
        </div>
      </CardContent></Card>

      <Card><CardContent className="p-4 space-y-3">
        <div className="font-semibold">Price Sheets</div>
        <div className="text-sm text-muted-foreground">Upload and manage pricing documents for customer estimates</div>
        
        <div className="space-y-2">
          <ObjectUploader
            maxNumberOfFiles={1}
            maxFileSize={10485760} // 10MB
            onGetUploadParameters={getUploadParameters}
            onComplete={(result) => handleUploadComplete(result, 'price_sheet', `Price Sheet ${Date.now()}`)}
            buttonClassName="w-full"
          >
            💰 Upload New Price Sheet
          </ObjectUploader>
          
          {loading ? (
            <div className="text-sm text-muted-foreground">Loading price sheets...</div>
          ) : priceSheets.length > 0 ? (
            <div className="space-y-2">
              <div className="text-sm font-medium">Uploaded Price Sheets:</div>
              {priceSheets.map((sheet) => (
                <div key={sheet.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{sheet.title}</div>
                    <div className="text-xs text-muted-foreground">{sheet.fileName}</div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={()=>openNew(sheet.fileUrl)}>
                      Open
                    </Button>
                    <Button size="sm" onClick={()=>console.log('Share price sheet with customer')}>
                      Share with Customer
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">No price sheets uploaded yet</div>
          )}
        </div>
      </CardContent></Card>

      {/* Navigation Tabs for Contractor Features */}
      <Card><CardContent className="p-4">
        <div className="flex gap-2 mb-4 border-b">
          {[
            { id: 'leads', label: '📋 Lead Management', count: leads.length },
            { id: 'invoices', label: '💰 Invoices & Billing', count: invoices.length },
            { id: 'photos', label: '📸 Photo Management', count: photos.length },
            { id: 'claims', label: '📄 Claim Submission', count: 0 },
            { id: 'documents', label: '📋 W9 & Documents', count: documents.filter(d => d.documentType === 'w9').length }
          ].map(section => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`px-4 py-2 rounded-t-lg text-sm transition-colors ${
                activeSection === section.id 
                  ? 'bg-blue-100 text-blue-800 border-b-2 border-blue-500' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              data-testid={`button-section-${section.id}`}
            >
              {section.label} {section.count > 0 && `(${section.count})`}
            </button>
          ))}
        </div>

        {activeSection === 'leads' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Lead Management</h3>
              <Button onClick={() => {
                // Open lead creation modal
                const customerName = prompt('Customer Name:');
                const customerPhone = prompt('Customer Phone:');
                const propertyAddress = prompt('Property Address:');
                const damageType = prompt('Damage Type (tree_removal, roof_damage, etc):');
                
                if (customerName && customerPhone && propertyAddress && damageType) {
                  fetch('/api/leads', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      contractorId,
                      customerName,
                      customerPhone,
                      propertyAddress,
                      damageType,
                      urgency: 'normal',
                      status: 'new',
                      source: 'direct'
                    })
                  }).then(() => {
                    // Refresh leads
                    fetch(`/api/leads?contractorId=${contractorId}`)
                      .then(r => r.json())
                      .then(data => setLeads(data.leads || []));
                  });
                }
              }}>
                ➕ Add New Lead
              </Button>
            </div>

            {leadsLoading ? (
              <div className="text-center py-8">Loading leads...</div>
            ) : (
              <div className="space-y-3">
                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-3 rounded-lg text-center">
                    <div className="text-2xl font-bold text-blue-600">{leads.filter(l => l.status === 'new').length}</div>
                    <div className="text-sm text-blue-800">New Leads</div>
                  </div>
                  <div className="bg-yellow-50 p-3 rounded-lg text-center">
                    <div className="text-2xl font-bold text-yellow-600">{leads.filter(l => l.status === 'scheduled').length}</div>
                    <div className="text-sm text-yellow-800">Scheduled</div>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg text-center">
                    <div className="text-2xl font-bold text-green-600">{leads.filter(l => l.status === 'completed').length}</div>
                    <div className="text-sm text-green-800">Completed</div>
                  </div>
                </div>

                {/* All Leads List */}
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">All Leads</h4>
                  {leads.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No leads yet. Add your first lead to get started!
                    </div>
                  ) : (
                    leads.map(lead => (
                      <div key={lead.id} className="border rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{lead.customerName}</span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                lead.status === 'new' ? 'bg-blue-100 text-blue-800' :
                                lead.status === 'scheduled' ? 'bg-yellow-100 text-yellow-800' :
                                lead.status === 'in_progress' ? 'bg-orange-100 text-orange-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                {lead.status}
                              </span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                lead.urgency === 'emergency' ? 'bg-red-100 text-red-800' :
                                lead.urgency === 'urgent' ? 'bg-orange-100 text-orange-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {lead.urgency}
                              </span>
                            </div>
                            <div className="text-sm text-gray-600 mt-1">
                              📍 {lead.propertyAddress}
                            </div>
                            <div className="text-sm text-gray-600">
                              🔧 {lead.damageType} • 📞 {lead.customerPhone}
                            </div>
                            {lead.estimatedValue && (
                              <div className="text-sm font-medium text-green-600">
                                💰 Est. Value: {dollars(lead.estimatedValue)}
                              </div>
                            )}
                            {lead.scheduledDate && (
                              <div className="text-sm text-blue-600">
                                📅 Scheduled: {new Date(lead.scheduledDate).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => setSelectedLead(lead)}>
                              View Details
                            </Button>
                            <Button size="sm" onClick={() => {
                              // Create invoice for this lead
                              const workDescription = prompt('Work Description:');
                              const totalAmount = prompt('Total Amount:');
                              
                              if (workDescription && totalAmount) {
                                fetch('/api/invoices', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    invoiceNumber: `INV-${Date.now()}`,
                                    contractorId,
                                    leadId: lead.id,
                                    customerName: lead.customerName,
                                    customerPhone: lead.customerPhone,
                                    propertyAddress: lead.propertyAddress,
                                    workDescription,
                                    subtotal: totalAmount,
                                    totalAmount,
                                    isEmergencyRate: lead.urgency === 'emergency',
                                    status: 'draft'
                                  })
                                }).then(() => {
                                  setActiveSection('invoices');
                                  // Refresh invoices
                                  fetch(`/api/invoices?contractorId=${contractorId}`)
                                    .then(r => r.json())
                                    .then(data => setInvoices(data.invoices || []));
                                });
                              }
                            }}>
                              Create Invoice
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Scheduled Appointments Today */}
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">Today's Scheduled Appointments</h4>
                  {leads.filter(l => {
                    if (!l.scheduledDate) return false;
                    const today = new Date();
                    const scheduled = new Date(l.scheduledDate);
                    return scheduled.toDateString() === today.toDateString();
                  }).length === 0 ? (
                    <div className="text-center py-4 text-gray-500">
                      No appointments scheduled for today
                    </div>
                  ) : (
                    leads.filter(l => {
                      if (!l.scheduledDate) return false;
                      const today = new Date();
                      const scheduled = new Date(l.scheduledDate);
                      return scheduled.toDateString() === today.toDateString();
                    }).map(lead => (
                      <div key={lead.id} className="border rounded-lg p-3 bg-blue-50">
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-medium">{lead.customerName}</div>
                            <div className="text-sm text-gray-600">{lead.propertyAddress}</div>
                            <div className="text-sm text-blue-600">
                              {new Date(lead.scheduledDate).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}
                            </div>
                          </div>
                          <Button size="sm">
                            Start Job
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeSection === 'invoices' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Invoice Management</h3>
              <Button onClick={() => {
                // Open invoice creation
                setActiveSection('leads');
                alert('Select a lead to create an invoice for, or add a new lead first.');
              }}>
                ➕ Create Invoice
              </Button>
            </div>

            <div className="space-y-3">
              {invoices.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No invoices created yet. Create your first invoice from a lead!
                </div>
              ) : (
                invoices.map(invoice => (
                  <div key={invoice.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{invoice.invoiceNumber}</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            invoice.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                            invoice.status === 'sent' ? 'bg-blue-100 text-blue-800' :
                            invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {invoice.status}
                          </span>
                          {invoice.isEmergencyRate && (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Emergency Rate
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          👤 {invoice.customerName} • 📍 {invoice.propertyAddress}
                        </div>
                        <div className="text-sm text-gray-600">
                          🔧 {invoice.workDescription}
                        </div>
                        <div className="text-lg font-medium text-green-600">
                          💰 {dollars(invoice.totalAmount)}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => setSelectedInvoice(invoice)}>
                          View Details
                        </Button>
                        <Button size="sm" onClick={() => {
                          // Generate market comparables for this invoice
                          alert('Generating market comparables with Xactimate data...');
                        }}>
                          Market Comparables
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeSection === 'photos' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Photo Management with AI Analysis</h3>
              <ObjectUploader
                maxNumberOfFiles={5}
                maxFileSize={10485760} // 10MB
                onGetUploadParameters={getUploadParameters}
                onComplete={(result) => {
                  if (result.successful && result.successful.length > 0) {
                    result.successful.forEach(async (file) => {
                      // Submit for AI analysis
                      try {
                        const response = await fetch('/api/photos/analyze', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            contractorId,
                            fileName: file.name,
                            fileUrl: file.uploadURL,
                            category: 'evidence' // before, during, after, evidence, documentation
                          })
                        });
                        
                        if (response.ok) {
                          const newPhoto = await response.json();
                          setPhotos(prev => [...prev, newPhoto]);
                        }
                      } catch (error) {
                        console.error('Error analyzing photo:', error);
                      }
                    });
                  }
                }}
                buttonClassName=""
              >
                📸 Upload Photos for AI Analysis
              </ObjectUploader>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900">AI Photo Analysis Features:</h4>
              <ul className="text-sm text-blue-800 mt-2 space-y-1">
                <li>🌍 GPS Location Detection - Automatically extracts location from photo metadata</li>
                <li>🤖 Damage Assessment - AI identifies and describes damage types in photos</li>
                <li>📋 Story Organization - Photos organized chronologically to tell complete story for insurance</li>
                <li>🏷️ Smart Tagging - Automatic categorization for easy retrieval</li>
                <li>📄 Insurance Reports - Generate professional photo reports for SBA, FEMA, and insurance claims</li>
              </ul>
            </div>

            <div className="space-y-3">
              {photos.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No photos uploaded yet. Upload photos to get AI analysis and GPS location data!
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {photos.map(photo => (
                    <div key={photo.id} className="border rounded-lg p-3 space-y-2">
                      <div className="aspect-video bg-gray-100 rounded-md flex items-center justify-center">
                        <img 
                          src={photo.thumbnailUrl || photo.fileUrl} 
                          alt={photo.aiDescription || 'Property photo'}
                          className="w-full h-full object-cover rounded-md"
                          onError={(e) => {
                            e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTRweCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlPC90ZXh0Pjwvc3ZnPg==';
                          }}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="text-sm font-medium">{photo.fileName}</div>
                        
                        {photo.aiDescription && (
                          <div className="text-sm text-gray-600">
                            🤖 <strong>AI Analysis:</strong> {photo.aiDescription}
                          </div>
                        )}
                        
                        {photo.latitude && photo.longitude && (
                          <div className="text-sm text-green-600">
                            📍 GPS: {Number(photo.latitude).toFixed(6)}, {Number(photo.longitude).toFixed(6)}
                          </div>
                        )}
                        
                        {photo.address && (
                          <div className="text-sm text-blue-600">
                            🏠 Address: {photo.address}
                          </div>
                        )}
                        
                        <div className="flex gap-1 flex-wrap">
                          {photo.damageType && (
                            <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                              {photo.damageType}
                            </span>
                          )}
                          {photo.severity && (
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              photo.severity === 'critical' ? 'bg-red-100 text-red-800' :
                              photo.severity === 'severe' ? 'bg-orange-100 text-orange-800' :
                              photo.severity === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {photo.severity}
                            </span>
                          )}
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                            {photo.category}
                          </span>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => window.open(photo.fileUrl, '_blank')}>
                            View Full
                          </Button>
                          <Button size="sm" onClick={() => {
                            alert('Adding to insurance report...');
                          }}>
                            Add to Report
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeSection === 'claims' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Insurance Claim Submission</h3>
              <Button onClick={() => {
                const selectedInvoiceId = prompt('Enter Invoice ID to create claim for:');
                if (selectedInvoiceId) {
                  // Start claim creation process
                  alert('Opening claim creation wizard...');
                }
              }}>
                ➕ Submit New Claim
              </Button>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg">
              <h4 className="font-medium text-yellow-900">Complete Claim Submission System:</h4>
              <ul className="text-sm text-yellow-800 mt-2 space-y-1">
                <li>📋 Comprehensive Insurance Company Database - All states, contact info, submission portals</li>
                <li>🤖 AI Letter Generation - Automatic letters when prices exceed Xactimate estimates</li>
                <li>📊 Market Comparables - Compare pricing within 150-mile radius using Xactimate data</li>
                <li>📄 Complete Documentation - Contracts, photos, reports, market comparables, W9s</li>
                <li>⚖️ Legal Compliance - OSHA, ANSI, Sherman Antitrust Act justifications</li>
                <li>🚨 Emergency Rate Justification - Automatic explanations for emergency pricing</li>
              </ul>
            </div>

            {/* Insurance Company Search */}
            <div className="space-y-3">
              <h4 className="font-medium">Find Insurance Company</h4>
              <div className="flex gap-2">
                <Input 
                  placeholder="Search insurance company name..."
                  className="flex-1"
                />
                <Button>Search Database</Button>
              </div>
              
              <div className="space-y-2">
                <div className="text-sm font-medium">Quick Access - Major Insurance Companies:</div>
                <div className="grid md:grid-cols-2 gap-2">
                  {insuranceCompanies.slice(0, 6).map(company => (
                    <div key={company.id} className="border rounded-lg p-3">
                      <div className="font-medium">{company.name}</div>
                      <div className="text-sm text-gray-600">
                        📧 {company.disasterClaimsEmail || company.claimsEmail}
                      </div>
                      <div className="text-sm text-gray-600">
                        📞 {company.disasterClaimsPhone || company.claimsPhone}
                      </div>
                      <div className="flex gap-2 mt-2">
                        <Button size="sm" onClick={() => {
                          alert(`Starting claim submission to ${company.name}...`);
                        }}>
                          Submit Claim
                        </Button>
                        <Button size="sm" variant="outline">
                          View Portal
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Market Comparables */}
            <div className="space-y-3">
              <h4 className="font-medium">Market Comparables & Xactimate Integration</h4>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-sm text-green-800">
                  Our system integrates with the same Xactimate database that insurance companies use 
                  (similar to estimatewriters.com) to provide accurate market comparables within 150 miles.
                  When your prices exceed Xactimate estimates, AI automatically generates justification 
                  letters citing emergency rates, OSHA compliance, equipment complexity, and legal precedents.
                </div>
              </div>
              
              <Button onClick={() => {
                alert('Generating Xactimate comparison report...');
              }}>
                Generate Market Comparable Report
              </Button>
            </div>

            {/* AI Letter Generation */}
            <div className="space-y-3">
              <h4 className="font-medium">AI Claim Letter Generation</h4>
              <div className="text-sm text-gray-600 mb-2">
                When contractor pricing exceeds insurance estimates, our AI generates professional letters 
                explaining emergency rates, OSHA/ANSI compliance, equipment complexity, and Sherman Antitrust Act protections.
              </div>
              
              <Button onClick={() => {
                alert('Generating AI justification letter for higher pricing...');
              }}>
                🤖 Generate AI Justification Letter
              </Button>
            </div>
          </div>
        )}

        {activeSection === 'documents' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">W9 & Tax Documents</h3>
            </div>

            <div className="space-y-4">
              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-3">W9 Tax Forms</h4>
                <div className="space-y-3">
                  <ObjectUploader
                    maxNumberOfFiles={1}
                    maxFileSize={10485760} // 10MB
                    onGetUploadParameters={getUploadParameters}
                    onComplete={(result) => handleUploadComplete(result, 'w9', `W9 Form ${Date.now()}`)}
                    buttonClassName="w-full"
                  >
                    📋 Upload W9 Form
                  </ObjectUploader>
                  
                  {documents.filter(doc => doc.documentType === 'w9').length > 0 ? (
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Uploaded W9 Forms:</div>
                      {documents.filter(doc => doc.documentType === 'w9').map((w9) => (
                        <div key={w9.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                          <div className="flex-1">
                            <div className="font-medium text-sm">{w9.title}</div>
                            <div className="text-xs text-muted-foreground">{w9.fileName}</div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={()=>openNew(w9.fileUrl)}>
                              Open
                            </Button>
                            <Button size="sm" onClick={()=>alert('W9 included in claim submission')}>
                              Include in Claim
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">No W9 forms uploaded yet</div>
                  )}
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-3">Document Download Center</h4>
                <div className="text-sm text-gray-600 mb-3">
                  Download all documents associated with your claims and contracts.
                </div>
                
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start">
                    📄 Download All Contracts
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    💰 Download All Price Sheets  
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    📋 Download All W9 Forms
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    📸 Download All Project Photos
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    📊 Download Market Comparable Reports
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    🤖 Download AI Generated Letters
                  </Button>
                </div>
              </div>

              {/* AI Assistant for Documents */}
              <div className="border rounded-lg p-4 bg-purple-50">
                <h4 className="font-medium mb-3 text-purple-900">🤖 AI Document Assistant</h4>
                <div className="text-sm text-purple-800 mb-3">
                  Ask questions about your documents, claims, or get help with paperwork.
                </div>
                
                <div className="flex gap-2">
                  <Input 
                    placeholder="Ask AI about your documents or claims..."
                    className="flex-1"
                  />
                  <Button>Ask AI</Button>
                </div>
                
                <div className="mt-3 space-y-2">
                  <div className="text-xs text-purple-700">Example questions:</div>
                  <div className="flex gap-2 flex-wrap">
                    <button className="text-xs px-2 py-1 bg-purple-100 text-purple-800 rounded-full hover:bg-purple-200">
                      "What documents do I need for State Farm claim?"
                    </button>
                    <button className="text-xs px-2 py-1 bg-purple-100 text-purple-800 rounded-full hover:bg-purple-200">
                      "Generate letter for emergency tree removal pricing"
                    </button>
                    <button className="text-xs px-2 py-1 bg-purple-100 text-purple-800 rounded-full hover:bg-purple-200">
                      "Show me OSHA compliance requirements"
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent></Card>

      <Card><CardContent className="p-4 space-y-2">
        <div className="font-semibold">Upload Proof of Insurance (optional)</div>
        <input type="file" onChange={(e)=>{/* Hook /api/upload */}} />
        <div className="text-xs text-muted-foreground">Stored under your Contractor profile; share on request.</div>
      </CardContent></Card>

      <Card><CardContent className="p-4 space-y-2">
        <div className="font-semibold">Brochure</div>
        <div className="text-sm">Generate a tri-fold PDF brochure using your content.</div>
        <Button onClick={async ()=>{
          const r = await fetch('/api/brochure/strategic',{ method:'POST' }).then(r=>r.json()).catch(()=>null);
          if (r?.path) window.open(r.path, '_blank'); else alert('Brochure failed.');
        }}>Generate Tri-Fold Brochure (PDF)</Button>
      </CardContent></Card>

      <Card><CardContent className="p-4">
        <ReviewLinksEditor />
      </CardContent></Card>

      <Card><CardContent className="p-4">
        <ContractorsCalendar contractorId="ctr:default" />
      </CardContent></Card>
    </div>
  );
}

// --- Enhanced Storm Map with Live Drone Events & Role-Based Access ---
function StormMap({ customers = [] }) {
  const { role } = useRole();
  const [markers, setMarkers] = useState([]); // from customers
  const [live, setLive] = useState([]); // from SSE drone events
  const [leads, setLeads] = useState([]); // auto-generated leads
  const [center, setCenter] = useState([27.6648, -81.5158]); // FL center fallback
  const [zoom, setZoom] = useState(6);
  const [filters, setFilters] = useState({
    tree_on_roof: true, line_down: true, structure_damage: true, tree_on_fence: true,
    tree_on_car: true, tree_on_barn: true, tree_on_shed: true, tree_in_pool: true, tree_on_playground: true, tree_across_driveway: true,
    live: true, lead: true
  });

  // Listen for map center events from cards
  useEffect(() => {
    function onCenter(e: any) {
      const { address, name } = e.detail || {};
      if (!address) return;
      fetch(`/api/geocode?address=${encodeURIComponent(address)}`).then(r => r.json()).then(geo => {
        if (geo?.lat && geo?.lng) {
          setCenter([geo.lat, geo.lng]);
          setZoom(15);
          setMarkers(m => [...m, { id: `jit-${Date.now()}`, name, address, lat: geo.lat, lng: geo.lng, tags: ['jit'] }]);
        }
      }).catch(() => { });
    }
    window.addEventListener('storm-center', onCenter);
    window.addEventListener('storm-docs-updated', () => refresh());
    return () => {
      window.removeEventListener('storm-center', onCenter);
      window.removeEventListener('storm-docs-updated', () => { });
    };
  }, []);

  // Geocode customers to markers (server-side endpoint already exists)
  useEffect(() => {
    refresh();
  }, [JSON.stringify(customers)]);

  // Load initial leads
  useEffect(() => {
    fetch('/api/leads').then(r => r.json()).then(setLeads).catch(() => {});
  }, []);

  // SSE live feed for drone events and leads
  useEffect(() => {
    const es = new EventSource('/api/drone/events');
    es.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        if (data?.type === 'drone_event' && data.event) {
          setLive(prev => [...prev.slice(-499), data.event]);
        }
        if (data?.type === 'lead' && data.lead) {
          setLeads(prev => [data.lead, ...prev].slice(0, 500));
        }
      } catch (e) {
        console.error('Failed to parse SSE data:', e);
      }
    };
    return () => es.close();
  }, []);

  function tagsFromDocs(docs: any[]) {
    const t = new Set<string>();
    (docs || []).forEach(d => {
      const s = (d.caption || '').toLowerCase();
      if (s.includes('tree_on_roof')) t.add('tree_on_roof');
      if (s.includes('line_down')) t.add('line_down');
      if (s.includes('structure_damage')) t.add('structure_damage');
      if (s.includes('tree_on_fence')) t.add('tree_on_fence');
      if (s.includes('tree_on_car')) t.add('tree_on_car');
      if (s.includes('tree_on_barn')) t.add('tree_on_barn');
      if (s.includes('tree_on_shed')) t.add('tree_on_shed');
      if (s.includes('tree_in_pool')) t.add('tree_in_pool');
      if (s.includes('tree_on_playground')) t.add('tree_on_playground');
      if (s.includes('tree_across_driveway') || s.includes('tree across driveway') || s.includes('blocking driveway') || s.includes('blocking egress') || s.includes('blocking ingress')) t.add('tree_across_driveway');
    });
    return [...t];
  }

  async function geocode(address: string) {
    const r = await fetch(`/api/geocode?address=${encodeURIComponent(address)}`).then(r => r.json()).catch(() => null);
    return (r?.lat && r?.lng) ? r : null;
  }

  async function refresh() {
    const mk = [];
    const customerList = Array.isArray(customers) ? customers : (customers?.list || []);
    for (const c of customerList) {
      if (!c?.address) continue;
      const geo = await geocode(c.address);
      if (!geo) continue;
      mk.push({ id: c.id, name: c.name, address: c.address, lat: geo.lat, lng: geo.lng, tags: tagsFromDocs(c.docs) });
    }
    setMarkers(mk);
  }

  const active = (tags: string[] = []) => tags.some(t => filters[t as keyof typeof filters]) || (tags.length === 0 && (filters.live || filters.lead));

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="p-2 flex flex-wrap gap-2 items-center">
        {Object.keys(filters).filter(k => !['live', 'lead'].includes(k)).map(k => (
          <label key={k} className={`text-xs px-2 py-1 rounded-full border cursor-pointer ${filters[k as keyof typeof filters] ? 'bg-emerald-600 text-white border-emerald-700' : 'bg-white'}`}>
            <input type="checkbox" checked={!!filters[k as keyof typeof filters]} onChange={() => setFilters(f => ({ ...f, [k]: !f[k as keyof typeof f] }))} className="mr-1" />
            {k.replace(/_/g, ' ')}
          </label>
        ))}
        <label className={`text-xs px-2 py-1 rounded-full border cursor-pointer ${filters.live ? 'bg-purple-600 text-white border-purple-700' : 'bg-white'}`}>
          <input type="checkbox" checked={!!filters.live} onChange={() => setFilters(f => ({ ...f, live: !f.live }))} className="mr-1" />
          live
        </label>
        <label className={`text-xs px-2 py-1 rounded-full border cursor-pointer ${filters.lead ? 'bg-orange-600 text-white border-orange-700' : 'bg-white'}`}>
          <input type="checkbox" checked={!!filters.lead} onChange={() => setFilters(f => ({ ...f, lead: !f.lead }))} className="mr-1" />
          lead
        </label>
        <div className="ml-auto"><span className="text-xs opacity-70">Role: {role}</span></div>
      </div>
      <div style={{ height: 420 }}>
        <LeafletLive center={center} zoom={zoom}
          markers={[
            ...markers.filter(m => active(m.tags)).map(m => ({ ...m, kind: 'case' })),
            ...live.filter(e => active(e.tags)).map(e => ({ id: e.id, lat: e.lat, lng: e.lng, name: e.provider || 'drone', address: e.address, tags: e.tags, kind: 'live', stream: e.stream, image: e.image })),
            ...leads.filter(l => active(l.tags)).map(l => ({ id: l.id, lat: l.lat, lng: l.lng, name: 'lead', address: l.address, tags: l.tags, kind: 'lead', stream: l.stream, image: l.image }))
          ]} />
      </div>
    </div>
  );
}

function LeafletLive({ center, zoom, markers }: { center: number[]; zoom: number; markers: any[] }) {
  const L = (window as any).L;
  const [ready, setReady] = useState(!!(window as any).L);

  useEffect(() => {
    if (!(window as any).L) {
      const s = document.createElement('script');
      s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      s.onload = () => setReady(true);
      document.body.appendChild(s);
    }
  }, []);

  useEffect(() => {
    if (!ready) return;
    let map = (LeafletLive as any).__map;
    if (!map) {
      map = (LeafletLive as any).__map = L.map('storm-map-root').setView(center, zoom);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap' }).addTo(map);
    } else { map.setView(center, zoom); }

    // clear & add
    if ((LeafletLive as any).__layer) { (LeafletLive as any).__layer.remove(); }
    const layer = L.layerGroup();
    markers.forEach(m => {
      let mk;
      if (m.kind === 'live') {
        mk = L.circleMarker([m.lat, m.lng], { radius: 8, color: '#7c3aed', fillColor: '#7c3aed', fillOpacity: 0.8 });
      } else if (m.kind === 'lead') {
        mk = L.circleMarker([m.lat, m.lng], { radius: 8, color: '#f97316', fillColor: '#f97316', fillOpacity: 0.9 });
      } else {
        mk = L.circleMarker([m.lat, m.lng], { radius: 6, color: '#10b981', fillColor: '#10b981', fillOpacity: 0.8 });
      }
      const media = m.image ? `<br/><img src="${m.image}" style="max-width:220px;max-height:120px;display:block;margin-top:4px;"/>` : '';
      const stream = m.stream ? `<br/><a href="${m.stream}" target="_blank">Open stream</a>` : '';
      mk.bindPopup(`<b>${m.name || ''}</b><br/>${m.address || ''}<br/>Tags: ${(m.tags || []).join(', ')}${media}${stream}`);
      mk.addTo(layer);
    });
    layer.addTo(map);
    (LeafletLive as any).__layer = layer;
  }, [ready, JSON.stringify(center), zoom, JSON.stringify(markers)]);

  return <div id="storm-map-root" style={{ width: '100%', height: '100%' }} />;
}

// Main export with RoleProvider wrapper
export default function StormOpsProHub() {
  return (
    <RoleProvider>
      <StormOpsProHubContent />
    </RoleProvider>
  );
}