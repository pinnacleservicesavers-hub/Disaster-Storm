import { useState, useContext, createContext, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Import all module components
import { TrafficCameras } from './pages/Cameras';
import { DamageDetectionDashboard } from './components/DamageDetectionDashboard';
import PredictionDashboard from './pages/PredictionDashboard';
import VictimDashboard from './pages/VictimDashboard';

// ===== Helper Functions =====
function dollars(n: number | string): string { 
  return `$${Number(n||0).toFixed(2)}`; 
}

// ===== Role Context =====
const RoleContext = createContext<{ role: string; setRole: (role: string) => void }>({ role: 'ops', setRole: () => {} });

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState(() => localStorage.getItem('storm_role') || 'ops');
  
  const updateRole = (newRole: string) => {
    setRole(newRole);
    localStorage.setItem('storm_role', newRole);
  };
  
  return (
    <RoleContext.Provider value={{ role, setRole: updateRole }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  return useContext(RoleContext);
}

export function RoleBar() {
  const { role, setRole } = useRole();
  
  return (
    <div className="flex items-center gap-2 p-2 bg-gray-100 rounded-lg text-sm">
      <span className="text-gray-600">Role:</span>
      {['ops', 'field', 'admin'].map(r => (
        <button
          key={r}
          onClick={() => setRole(r)}
          className={`px-3 py-1 rounded capitalize transition-colors ${
            role === r 
              ? 'bg-blue-600 text-white' 
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          {r}
        </button>
      ))}
    </div>
  );
}

// ===== Weather Center =====
function WeatherCenter() {
  const [activeWeatherView, setActiveWeatherView] = useState('comprehensive');
  const [userLocation, setUserLocation] = useState({ lat: 33.7490, lon: -84.3880 });
  const [weatherData, setWeatherData] = useState(null);
  const [noaaAlerts, setNoaaAlerts] = useState([]);
  const [hurricanes, setHuricanes] = useState([]);
  const [lightningData, setLightningData] = useState(null);
  const [satelliteData, setSatelliteData] = useState(null);
  const [mrmsData, setMrmsData] = useState(null);
  const [forecastModels, setForecastModels] = useState(null);
  const [spcData, setSpcData] = useState(null);
  const [nhcData, setNhcData] = useState(null);
  const [wpcData, setWpcData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(60);
  const [streamingActive, setStreamingActive] = useState(false);
  const [activeStreams, setActiveStreams] = useState([]);

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude
          });
        },
        () => {
          console.log('Geolocation failed, using default location');
        }
      );
    }
  }, []);

  // Auto-refresh weather data
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchAllWeatherData();
      }, refreshInterval * 1000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, userLocation]);

  // Initial data fetch
  useEffect(() => {
    fetchAllWeatherData();
  }, [userLocation]);

  const fetchAllWeatherData = async () => {
    if (!userLocation) return;
    
    setLoading(true);
    try {
      const promises = [
        fetch(`/api/weather/alerts?lat=${userLocation.lat}&lon=${userLocation.lon}`).then(r => r.json()),
        fetch(`/api/weather/comprehensive?lat=${userLocation.lat}&lon=${userLocation.lon}`).then(r => r.json()),
        fetch(`/api/weather/lightning?lat=${userLocation.lat}&lon=${userLocation.lon}`).then(r => r.json()),
        fetch(`/api/weather/satellite?lat=${userLocation.lat}&lon=${userLocation.lon}`).then(r => r.json()),
        fetch(`/api/weather/mrms?lat=${userLocation.lat}&lon=${userLocation.lon}`).then(r => r.json()),
        fetch(`/api/weather/models?lat=${userLocation.lat}&lon=${userLocation.lon}`).then(r => r.json()),
        fetch(`/api/weather/spc?lat=${userLocation.lat}&lon=${userLocation.lon}`).then(r => r.json()),
        fetch(`/api/weather/nhc?lat=${userLocation.lat}&lon=${userLocation.lon}`).then(r => r.json()),
        fetch(`/api/weather/wpc?lat=${userLocation.lat}&lon=${userLocation.lon}`).then(r => r.json())
      ];

      const [
        alertsData, 
        comprehensiveData, 
        lightningResp, 
        satelliteResp, 
        mrmsResp, 
        modelsResp, 
        spcResp, 
        nhcResp, 
        wpcResp
      ] = await Promise.all(promises);

      setNoaaAlerts(alertsData.alerts || []);
      setWeatherData(comprehensiveData.current || null);
      setHuricanes(comprehensiveData.hurricanes || []);
      setLightningData(lightningResp || null);
      setSatelliteData(satelliteResp || null);
      setMrmsData(mrmsResp || null);
      setForecastModels(modelsResp || null);
      setSpcData(spcResp || null);
      setNhcData(nhcResp || null);
      setWpcData(wpcResp || null);
    } catch (error) {
      console.error('Failed to fetch weather data:', error);
    } finally {
      setLoading(false);
    }
  };

  const startLiveStream = async (streamType) => {
    if (!userLocation) return;
    
    try {
      const { lat, lon } = userLocation;
      const response = await fetch(`/api/weather/stream/start?type=${streamType}&lat=${lat}&lon=${lon}&interval=${refreshInterval * 1000}`);
      const result = await response.json();
      
      if (result.ok) {
        setActiveStreams(prev => [...prev, result.streamId]);
        setStreamingActive(true);
      }
    } catch (error) {
      console.error('Failed to start live stream:', error);
    }
  };

  const stopLiveStream = async (streamId: string) => {
    try {
      await fetch(`/api/weather/stream/stop/${streamId}`);
      setActiveStreams(prev => prev.filter(id => id !== streamId));
      if (activeStreams.length <= 1) {
        setStreamingActive(false);
      }
    } catch (error) {
      console.error('Failed to stop live stream:', error);
    }
  };

  const toggleAllStreams = () => {
    if (streamingActive) {
      // Stop all streams
      activeStreams.forEach(streamId => stopLiveStream(streamId));
    } else {
      // Start key streams
      ['lightning', 'radar', 'alerts', 'satellite'].forEach(type => startLiveStream(type));
    }
  };

  return (
    <div className="space-y-4">
      {/* Enhanced Weather Control Panel */}
      <div className="bg-white border rounded-lg p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">🌪️ Professional Weather Command Center</h2>
          <div className="flex items-center gap-3">
            {userLocation && (
              <span className="text-xs text-gray-600" data-testid="text-user-location">
                📍 {userLocation.lat.toFixed(3)}, {userLocation.lon.toFixed(3)}
              </span>
            )}
            <button
              onClick={toggleAllStreams}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                streamingActive 
                  ? 'bg-red-100 text-red-800 border border-red-200' 
                  : 'bg-green-100 text-green-800 border border-green-200'
              }`}
              data-testid="button-toggle-streaming"
            >
              {streamingActive ? '🔴 LIVE STREAMING' : '▶️ START STREAMING'}
            </button>
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                autoRefresh 
                  ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                  : 'bg-gray-100 text-gray-600 border border-gray-200'
              }`}
              data-testid="button-toggle-autorefresh"
            >
              {autoRefresh ? '🔄 AUTO REFRESH' : '⏸️ PAUSED'}
            </button>
          </div>
        </div>
        
        {/* Streaming Controls */}
        <div className="flex items-center gap-4">
          <label className="text-sm text-gray-600">
            Refresh Rate:
            <select 
              value={refreshInterval} 
              onChange={(e) => setRefreshInterval(Number(e.target.value))}
              className="ml-2 text-xs border rounded px-2 py-1"
              data-testid="select-refresh-interval"
            >
              <option value={10}>10 seconds</option>
              <option value={30}>30 seconds</option>
              <option value={60}>1 minute</option>
              <option value={300}>5 minutes</option>
            </select>
          </label>
          
          {activeStreams.length > 0 && (
            <span className="text-xs text-green-600 font-medium" data-testid="text-active-streams">
              🟢 {activeStreams.length} streams active
            </span>
          )}
          
          {loading && (
            <span className="text-xs text-blue-600 font-medium animate-pulse" data-testid="text-loading">
              📡 Updating weather data...
            </span>
          )}
        </div>
      </div>

      {/* Weather Data Tabs */}
      <div className="bg-white border rounded-lg overflow-hidden">
        <div className="border-b">
          <nav className="flex overflow-x-auto">
            {[
              { id: 'comprehensive', label: '📊 All Data', icon: '📊' },
              { id: 'alerts', label: '🚨 Live Alerts', icon: '🚨' },
              { id: 'radar', label: '📡 Radar+Lightning', icon: '📡' },
              { id: 'satellite', label: '🛰️ Satellite+MRMS', icon: '🛰️' },
              { id: 'models', label: '🌐 Forecast Models', icon: '🌐' },
              { id: 'nhc', label: '🌀 Hurricanes+SPC', icon: '🌀' },
              { id: 'external', label: '🔗 External Tools', icon: '🔗' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveWeatherView(tab.id)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeWeatherView === tab.id
                    ? 'border-blue-600 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }`}
                data-testid={`tab-weather-${tab.id}`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </nav>
        </div>
        
        <div className="p-4">
          {/* Comprehensive Data View */}
          {activeWeatherView === 'comprehensive' && (
            <div className="space-y-6">
              <div className="text-lg font-semibold text-gray-900 mb-4">
                📊 Comprehensive Weather Overview (RadarOmega Style)
              </div>
              
              {/* Real-time Status Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="text-red-800 font-medium text-sm">🚨 Active Alerts</div>
                  <div className="text-2xl font-bold text-red-900" data-testid="text-alert-count">{noaaAlerts?.length || 0}</div>
                  <div className="text-xs text-red-600" data-testid="text-alert-status">
                    {noaaAlerts?.find(a => a.alertType === 'Tornado') ? '🌪️ Tornado Warning' : 'All Clear'}
                  </div>
                </div>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="text-yellow-800 font-medium text-sm">⚡ Lightning Strikes</div>
                  <div className="text-2xl font-bold text-yellow-900" data-testid="text-lightning-count">
                    {lightningData?.strikes?.length || 0}
                  </div>
                  <div className="text-xs text-yellow-600" data-testid="text-lightning-density">
                    Last {refreshInterval}s: {lightningData?.density || 0}/km²
                  </div>
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="text-blue-800 font-medium text-sm">🌀 Active Storms</div>
                  <div className="text-2xl font-bold text-blue-900" data-testid="text-storm-count">{hurricanes?.length || 0}</div>
                  <div className="text-xs text-blue-600" data-testid="text-storm-name">
                    {hurricanes?.[0]?.name || 'No active storms'}
                  </div>
                </div>
                
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="text-green-800 font-medium text-sm">📡 Data Sources</div>
                  <div className="text-2xl font-bold text-green-900" data-testid="text-data-sources">9</div>
                  <div className="text-xs text-green-600">
                    NWS • SPC • NHC • WPC • MRMS
                  </div>
                </div>
              </div>
              
              {/* Weather Details */}
              {weatherData && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">🌡️ Current Conditions</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div data-testid="text-current-temp">Temp: {weatherData?.temperature || '--'}°F</div>
                    <div data-testid="text-current-wind">Wind: {weatherData?.windSpeed || '--'} mph {weatherData?.windDirection || ''}</div>
                    <div data-testid="text-current-humidity">Humidity: {weatherData?.humidity || '--'}%</div>
                    <div data-testid="text-current-pressure">Pressure: {weatherData?.pressure || '--'} mb</div>
                  </div>
                </div>
              )}
              
              {/* MRMS Data */}
              {mrmsData && (
                <div className="space-y-4">
                  {mrmsData.hail && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                      <h4 className="font-medium text-orange-900 mb-2">🧊 MRMS Hail Detection</h4>
                      <div className="text-sm text-orange-800" data-testid="text-hail-data">
                        Max Size: {mrmsData.hail.maxSize}" • Probability: {mrmsData.hail.probability}%
                      </div>
                    </div>
                  )}
                  
                  {mrmsData.rotation && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <h4 className="font-medium text-red-900 mb-2">🌪️ Rotation Detection</h4>
                      <div className="text-sm text-red-800" data-testid="text-rotation-data">
                        Mesocyclones: {mrmsData.rotation.mesocyclones?.length || 0} • 
                        Shear: {mrmsData.rotation.shear || 0}° • 
                        Probability: {mrmsData.rotation.probability || 0}%
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          
          {/* Live Alerts View */}
          {activeWeatherView === 'alerts' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">🚨 Live Weather Alerts</h3>
                <button
                  onClick={() => startLiveStream('alerts')}
                  className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                  data-testid="button-stream-alerts"
                >
                  📡 Stream Alerts
                </button>
              </div>
              
              {noaaAlerts?.length > 0 ? (
                <div className="space-y-3">
                  {noaaAlerts.map((alert, index) => (
                    <div key={index} className={`border rounded-lg p-4 ${
                      alert.severity === 'Extreme' ? 'bg-red-50 border-red-200' :
                      alert.severity === 'Severe' ? 'bg-orange-50 border-orange-200' :
                      'bg-yellow-50 border-yellow-200'
                    }`} data-testid={`alert-item-${index}`}>
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900" data-testid={`alert-title-${index}`}>{alert.title}</h4>
                          <p className="text-sm text-gray-600 mt-1" data-testid={`alert-description-${index}`}>{alert.description}</p>
                          <div className="text-xs text-gray-500 mt-2" data-testid={`alert-details-${index}`}>
                            Areas: {alert.areas?.join(', ')} • 
                            Until: {new Date(alert.endTime).toLocaleTimeString()}
                          </div>
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded ${
                          alert.severity === 'Extreme' ? 'bg-red-100 text-red-800' :
                          alert.severity === 'Severe' ? 'bg-orange-100 text-orange-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`} data-testid={`alert-severity-${index}`}>
                          {alert.severity}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500" data-testid="text-no-alerts">
                  ✅ No active weather alerts in your area
                </div>
              )}
            </div>
          )}
          
          {/* Radar + Lightning View */}
          {activeWeatherView === 'radar' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">📡 Enhanced Radar + Lightning</h3>
                <button
                  onClick={() => startLiveStream('radar')}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                  data-testid="button-stream-radar"
                >
                  📡 Stream Radar
                </button>
              </div>
              
              {/* Radar Controls */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">🎛️ Radar Controls</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <button
                    onClick={() => startLiveStream('lightning')}
                    className="px-3 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 text-sm"
                    data-testid="button-lightning-overlay"
                  >
                    ⚡ Lightning Overlay
                  </button>
                  <button
                    onClick={() => window.open(`https://windy.com/${userLocation?.lat || 33.749}/${userLocation?.lon || -84.388}/10?radar`, '_blank')}
                    className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                    data-testid="button-windy-radar"
                  >
                    🌪️ Windy Radar
                  </button>
                  <button
                    onClick={() => window.open('https://www.radaromega.com/', '_blank')}
                    className="px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm"
                    data-testid="button-radaromega-pro"
                  >
                    📡 RadarOmega Pro
                  </button>
                  <button
                    onClick={() => window.open('https://weather.gov/radar', '_blank')}
                    className="px-3 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 text-sm"
                    data-testid="button-noaa-radar"
                  >
                    🚨 NOAA Radar
                  </button>
                </div>
              </div>
              
              {/* Lightning Data */}
              {lightningData && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-medium text-yellow-900 mb-2">⚡ Real-Time Lightning</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div data-testid="text-lightning-strikes">Strikes: {lightningData.strikes?.length || 0}</div>
                    <div data-testid="text-lightning-density">Density: {lightningData.density || 0}/km²</div>
                    <div data-testid="text-lightning-range">Range: {lightningData.range || 100}km</div>
                    <div data-testid="text-lightning-updated">Updated: {new Date().toLocaleTimeString()}</div>
                  </div>
                </div>
              )}
              
              {/* Interactive Weather Map */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">🗺️ Live Weather Map</h4>
                <div className="h-96 rounded-lg overflow-hidden border">
                  {userLocation && (
                    <MapContainer
                      center={[userLocation.lat, userLocation.lon]}
                      zoom={8}
                      style={{ height: '100%', width: '100%' }}
                      data-testid="weather-map"
                    >
                      <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      />
                      
                      {/* NWS Alerts Polygons */}
                      {noaaAlerts?.map((alert, index) => 
                        alert.geometry && (
                          <GeoJSON
                            key={`alert-${index}`}
                            data={alert.geometry}
                            style={{
                              color: alert.severity === 'Extreme' ? '#dc2626' : 
                                     alert.severity === 'Severe' ? '#ea580c' : '#ca8a04',
                              weight: 2,
                              opacity: 0.8,
                              fillOpacity: 0.3
                            }}
                            onEachFeature={(feature, layer) => {
                              layer.bindPopup(`
                                <div class="font-medium">${alert.title}</div>
                                <div class="text-sm mt-1">${alert.areas?.join(', ')}</div>
                                <div class="text-xs text-gray-600 mt-1">
                                  Severity: ${alert.severity} | Until: ${alert.endTime?.toLocaleTimeString()}
                                </div>
                              `);
                            }}
                          />
                        )
                      )}
                      
                      {/* SPC Convective Outlooks */}
                      {spcData?.map((outlook, index) => 
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
                                <div class="text-xs text-gray-600 mt-1">
                                  Valid: ${new Date(outlook.validTime).toLocaleDateString()}
                                </div>
                              `);
                            }}
                          />
                        )
                      )}
                      
                      {/* Lightning Strikes */}
                      {lightningData?.strikes?.map((strike, index) => (
                        <GeoJSON
                          key={`lightning-${index}`}
                          data={{
                            type: 'Point',
                            coordinates: [strike.longitude, strike.latitude]
                          }}
                          pointToLayer={(feature, latlng) => {
                            const L = (window as any).L;
                            return L.circleMarker(latlng, {
                              radius: 3,
                              fillColor: '#fbbf24',
                              color: '#f59e0b',
                              weight: 1,
                              opacity: 1,
                              fillOpacity: 0.8
                            });
                          }}
                          onEachFeature={(feature, layer) => {
                            layer.bindPopup(`
                              <div class="font-medium">⚡ Lightning Strike</div>
                              <div class="text-xs text-gray-600">
                                Time: ${new Date(strike.timestamp).toLocaleTimeString()}
                              </div>
                            `);
                          }}
                        />
                      ))}
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
                    <div className="w-4 h-3 bg-yellow-600 opacity-20 border border-yellow-600 border-dashed"></div>
                    <span>SPC Slight</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-3 bg-green-600 opacity-20 border border-green-600 border-dashed"></div>
                    <span>SPC Marginal</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                    <span>Lightning Strikes</span>
                  </div>
                </div>
              </div>
              
              {/* Radar Information */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">📡 Radar Information</h4>
                <div className="text-sm text-blue-800">
                  <p>• <strong>Base Reflectivity:</strong> Shows precipitation intensity and storm structure</p>
                  <p>• <strong>Velocity:</strong> Detects rotation and wind patterns within storms</p>
                  <p>• <strong>Lightning Integration:</strong> Real-time strike data overlaid on radar</p>
                  <p>• <strong>GPS Centered:</strong> Automatically focused on your location</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Satellite + MRMS View */}
          {activeWeatherView === 'satellite' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">🛰️ Satellite + MRMS Data</h3>
                <button
                  onClick={() => startLiveStream('satellite')}
                  className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                  data-testid="button-stream-satellite"
                >
                  🛰️ Stream Satellite
                </button>
              </div>
              
              {/* MRMS Data Display */}
              {mrmsData && (
                <div className="space-y-4">
                  {mrmsData.hail && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                      <h4 className="font-medium text-orange-900 mb-2">🧊 MRMS Hail Detection</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div data-testid="text-hail-max-size">Max Size: {mrmsData.hail.maxSize}"</div>
                        <div data-testid="text-hail-probability">Probability: {mrmsData.hail.probability}%</div>
                        <div data-testid="text-hail-mesh">MESH: {mrmsData.hail.mesh || 'N/A'}</div>
                        <div data-testid="text-hail-vcp">VCP: {mrmsData.hail.vcp || 'Unknown'}</div>
                      </div>
                    </div>
                  )}
                  
                  {mrmsData.rotation && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <h4 className="font-medium text-red-900 mb-2">🌪️ Rotation Detection</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div data-testid="text-rotation-mesocyclones">Mesocyclones: {mrmsData.rotation.mesocyclones?.length || 0}</div>
                        <div data-testid="text-rotation-shear">Shear: {mrmsData.rotation.shear || 0}°</div>
                        <div data-testid="text-rotation-probability">Probability: {mrmsData.rotation.probability || 0}%</div>
                        <div data-testid="text-rotation-vorticity">Vorticity: {mrmsData.rotation.vorticity || 'N/A'}</div>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Satellite Controls */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">🛰️ Satellite Tools</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <button
                    onClick={() => window.open('https://zoom.earth/', '_blank')}
                    className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                    data-testid="button-zoom-earth-satellite"
                  >
                    🌍 Zoom Earth Live
                  </button>
                  <button
                    onClick={() => window.open('https://www.goes.noaa.gov/', '_blank')}
                    className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                    data-testid="button-goes-satellite"
                  >
                    🛰️ GOES Satellite
                  </button>
                  <button
                    onClick={() => window.open('https://www.star.nesdis.noaa.gov/GOES/', '_blank')}
                    className="px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm"
                    data-testid="button-goes-archive"
                  >
                    📂 GOES Archive
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Forecast Models View */}
          {activeWeatherView === 'models' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">🌐 Forecast Models</h3>
                <button
                  onClick={() => startLiveStream('models')}
                  className="px-3 py-1 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700"
                  data-testid="button-stream-models"
                >
                  🌐 Stream Models
                </button>
              </div>
              
              {/* Model Data Display */}
              {forecastModels && (
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">🏛️ Available Models</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div data-testid="text-model-gfs">GFS: {forecastModels.gfs ? 'Available' : 'Unavailable'}</div>
                      <div data-testid="text-model-nam">NAM: {forecastModels.nam ? 'Available' : 'Unavailable'}</div>
                      <div data-testid="text-model-hrrr">HRRR: {forecastModels.hrrr ? 'Available' : 'Unavailable'}</div>
                      <div data-testid="text-model-ecmwf">ECMWF: {forecastModels.ecmwf ? 'Available' : 'Unavailable'}</div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Model Access Tools */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">🌐 Model Access</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <button
                    onClick={() => window.open(`https://windy.com/${userLocation?.lat || 33.749}/${userLocation?.lon || -84.388}/10?gfs`, '_blank')}
                    className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                    data-testid="button-windy-gfs"
                  >
                    🌐 Windy GFS
                  </button>
                  <button
                    onClick={() => window.open('https://www.tropicaltidbits.com/analysis/models/', '_blank')}
                    className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                    data-testid="button-tropical-tidbits"
                  >
                    🌴 Tropical Tidbits
                  </button>
                  <button
                    onClick={() => window.open('https://www.pivotalweather.com/model.php', '_blank')}
                    className="px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm"
                    data-testid="button-pivotal-weather"
                  >
                    📊 Pivotal Weather
                  </button>
                </div>
              </div>
              
              {/* Model Information */}
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                <h4 className="font-medium text-indigo-900 mb-2">📈 Model Information</h4>
                <div className="text-sm text-indigo-800 space-y-1">
                  <p>• <strong>GFS:</strong> Global Forecast System - 13km resolution, 16-day forecast</p>
                  <p>• <strong>NAM:</strong> North American Mesoscale - 12km resolution, 84-hour forecast</p>
                  <p>• <strong>HRRR:</strong> High-Resolution Rapid Refresh - 3km resolution, 48-hour forecast</p>
                  <p>• <strong>ECMWF:</strong> European Centre Medium-Range - 9km resolution, 10-day forecast</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Hurricanes + SPC View */}
          {activeWeatherView === 'nhc' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">🌀 Hurricanes + SPC Outlook</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => startLiveStream('nhc')}
                    className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                    data-testid="button-stream-nhc"
                  >
                    🌀 Stream NHC
                  </button>
                  <button
                    onClick={() => startLiveStream('spc')}
                    className="px-3 py-1 bg-orange-600 text-white rounded text-sm hover:bg-orange-700"
                    data-testid="button-stream-spc"
                  >
                    ⛈️ Stream SPC
                  </button>
                </div>
              </div>
              
              {/* Active Hurricanes */}
              {hurricanes && hurricanes.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">🌀 Active Tropical Systems</h4>
                  {hurricanes.map((storm, index) => (
                    <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-4" data-testid={`storm-item-${index}`}>
                      <div className="flex items-start justify-between">
                        <div>
                          <h5 className="font-medium text-red-900" data-testid={`storm-name-${index}`}>
                            {storm.name} ({storm.id})
                          </h5>
                          <div className="text-sm text-red-800 mt-1">
                            <div data-testid={`storm-category-${index}`}>Category: {storm.category || 'Tropical Storm'}</div>
                            <div data-testid={`storm-winds-${index}`}>Max Winds: {storm.maxWinds || 'Unknown'} mph</div>
                            <div data-testid={`storm-pressure-${index}`}>Pressure: {storm.pressure || 'Unknown'} mb</div>
                          </div>
                        </div>
                        <span className="px-2 py-1 text-xs font-medium rounded bg-red-100 text-red-800" data-testid={`storm-status-${index}`}>
                          {storm.status || 'Active'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* SPC Outlook Data */}
              {spcData && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <h4 className="font-medium text-orange-900 mb-2">⛈️ SPC Convective Outlook</h4>
                  <div className="text-sm text-orange-800">
                    <div data-testid="text-spc-day">Outlook Day: {spcData.day || 1}</div>
                    <div data-testid="text-spc-risk">Risk Level: {spcData.risk || 'Marginal'}</div>
                    <div data-testid="text-spc-valid">Valid: {spcData.validTime ? new Date(spcData.validTime).toLocaleString() : 'N/A'}</div>
                  </div>
                </div>
              )}
              
              {/* Hurricane/SPC Tools */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">🌀 Hurricane & Storm Tools</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <button
                    onClick={() => window.open('https://www.nhc.noaa.gov/', '_blank')}
                    className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                    data-testid="button-nhc-official"
                  >
                    🌀 NHC Official
                  </button>
                  <button
                    onClick={() => window.open('https://www.spc.noaa.gov/', '_blank')}
                    className="px-3 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 text-sm"
                    data-testid="button-spc-official"
                  >
                    ⛈️ SPC Official
                  </button>
                  <button
                    onClick={() => window.open('https://www.hurricanes.gov/', '_blank')}
                    className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                    data-testid="button-hurricanes-gov"
                  >
                    🌊 Hurricanes.gov
                  </button>
                </div>
              </div>
              
              {/* No Active Systems */}
              {(!hurricanes || hurricanes.length === 0) && (
                <div className="text-center py-8 text-gray-500" data-testid="text-no-storms">
                  ✅ No active tropical systems in the Atlantic or Pacific basins
                </div>
              )}
            </div>
          )}

          {/* External Tools View */}
          {activeWeatherView === 'external' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                🔗 External Professional Weather Tools
              </h3>
              
              {/* Primary Action Buttons */}
              <div className="space-y-3">
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
                  <button
                    onClick={() => window.open('https://www.radaromega.com/', '_blank')}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                    data-testid="button-open-radaromega"
                  >
                    📡 RadarOmega (Login Available)
                  </button>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => window.open('https://zoom.earth/', '_blank')}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                    data-testid="button-open-zoom-earth"
                  >
                    🌍 Zoom.Earth Live Satellite
                  </button>
                  <button
                    onClick={() => window.open('https://www.tornadohq.com/live/', '_blank')}
                    className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors font-medium"
                    data-testid="button-open-tornado-hq"
                  >
                    🌪️ TornadoHQ Live
                  </button>
                  <button
                    onClick={() => window.open('https://livestormchasing.com/', '_blank')}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                    data-testid="button-open-live-storm-chasing"
                  >
                    ⚡ Live Storm Chasing
                  </button>
                  <button
                    onClick={() => window.open('https://tornado.live/', '_blank')}
                    className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
                    data-testid="button-open-tornado-live"
                  >
                    🌪️ Tornado.Live
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
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
      if (d>=90) tone='bg-red-600 text-white'; else if (d>=60) tone='bg-amber-500 text-black';
      out.push({ key:'lien', tone, txt });
    }
  }
  return out;
}

// ===== Module Wrapper Components =====

function TrafficCamWatcherModule() {
  return (
    <div className="h-full">
      <TrafficCameras />
    </div>
  );
}

function DamageDetectionModule() {
  return (
    <div className="h-full">
      <DamageDetectionDashboard />
    </div>
  );
}

function StormPredictionsModule() {
  return (
    <div className="h-full">
      <PredictionDashboard />
    </div>
  );
}

function VictimPortalModule() {
  return (
    <div className="h-full">
      <VictimDashboard />
    </div>
  );
}

// ===== Main Component =====
export default function StormOpsProHub() {
  return (
    <div className="h-screen overflow-y-auto bg-gray-50">
      {/* Dashboard Modules - Scrollable Layout */}
      <div className="space-y-8">
        {/* Weather Center Module */}
        <section id="weather-center" className="min-h-screen p-6 bg-white border-b-4 border-blue-500">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <h2 className="text-3xl font-bold text-gray-900 mb-2" data-testid="heading-weather-center">
                ☁️ Weather Center
              </h2>
              <p className="text-gray-600">Live weather monitoring, alerts, and radar data for storm operations</p>
            </div>
            <WeatherCenter />
          </div>
        </section>

        {/* TrafficCamWatcher Module */}
        <section id="traffic-cam-watcher" className="min-h-screen p-6 bg-white border-b-4 border-green-500">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <h2 className="text-3xl font-bold text-gray-900 mb-2" data-testid="heading-traffic-cam-watcher">
                📹 TrafficCamWatcher
              </h2>
              <p className="text-gray-600">Live traffic camera monitoring with AI-powered damage detection across multiple states</p>
            </div>
            <TrafficCamWatcherModule />
          </div>
        </section>

        {/* AI Damage Detection Module */}
        <section id="ai-damage-detection" className="min-h-screen p-6 bg-white border-b-4 border-orange-500">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <h2 className="text-3xl font-bold text-gray-900 mb-2" data-testid="heading-ai-damage-detection">
                🤖 AI Damage Detection
              </h2>
              <p className="text-gray-600">Real-time AI analysis of camera feeds to identify storm damage and generate contractor leads</p>
            </div>
            <DamageDetectionModule />
          </div>
        </section>

        {/* Storm Predictions Module */}
        <section id="storm-predictions" className="min-h-screen p-6 bg-white border-b-4 border-purple-500">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <h2 className="text-3xl font-bold text-gray-900 mb-2" data-testid="heading-storm-predictions">
                ⚡ Storm Predictions
              </h2>
              <p className="text-gray-600">AI-powered predictive storm damage analysis with 24-48 hour forecasts and contractor deployment recommendations</p>
            </div>
            <StormPredictionsModule />
          </div>
        </section>

        {/* Victim Portal Module */}
        <section id="victim-portal" className="min-h-screen p-6 bg-white border-b-4 border-red-500">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <h2 className="text-3xl font-bold text-gray-900 mb-2" data-testid="heading-victim-portal">
                🏠 Victim Portal
              </h2>
              <p className="text-gray-600">Storm victim assistance portal for damage reporting and contractor connection</p>
            </div>
            <VictimPortalModule />
          </div>
        </section>
      </div>

      {/* Scroll Navigation Indicator */}
      <div className="fixed right-4 top-1/2 transform -translate-y-1/2 bg-white rounded-lg shadow-lg p-2 z-50">
        <div className="space-y-2">
          <a href="#weather-center" className="block w-3 h-3 bg-blue-500 rounded-full hover:bg-blue-600 transition-colors" title="Weather Center" data-testid="scroll-nav-weather"></a>
          <a href="#traffic-cam-watcher" className="block w-3 h-3 bg-green-500 rounded-full hover:bg-green-600 transition-colors" title="TrafficCamWatcher" data-testid="scroll-nav-traffic"></a>
          <a href="#ai-damage-detection" className="block w-3 h-3 bg-orange-500 rounded-full hover:bg-orange-600 transition-colors" title="AI Damage Detection" data-testid="scroll-nav-ai"></a>
          <a href="#storm-predictions" className="block w-3 h-3 bg-purple-500 rounded-full hover:bg-purple-600 transition-colors" title="Storm Predictions" data-testid="scroll-nav-predictions"></a>
          <a href="#victim-portal" className="block w-3 h-3 bg-red-500 rounded-full hover:bg-red-600 transition-colors" title="Victim Portal" data-testid="scroll-nav-victim"></a>
        </div>
      </div>
    </div>
  );
}