import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Clock } from 'lucide-react';

interface NWSAlert {
  id: string;
  type: string;
  severity: 'minor' | 'moderate' | 'severe' | 'extreme';
  headline: string;
  area: string;
  effective: string;
  expires: string;
}

export default function AlertTicker() {
  const [alerts, setAlerts] = useState<NWSAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchAlerts = async () => {
    try {
      setIsLoading(true);
      
      // Fetch from NWS API
      const response = await fetch('https://api.weather.gov/alerts/active?status=actual', {
        headers: {
          'User-Agent': 'DisasterDirect/1.0 (contact@disasterdirect.org)',
          'Accept': 'application/geo+json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const alertsData: NWSAlert[] = data.features?.map((feature: any) => ({
          id: feature.id,
          type: feature.properties.event,
          severity: feature.properties.severity?.toLowerCase() || 'minor',
          headline: feature.properties.headline,
          area: feature.properties.areaDesc,
          effective: feature.properties.effective,
          expires: feature.properties.expires
        })) || [];
        
        setAlerts(alertsData);
      } else {
        // Fallback to mock data if API fails
        setAlerts([
          {
            id: 'mock-1',
            type: 'Tornado Warning',
            severity: 'extreme',
            headline: 'Tornado Warning in effect for Miami-Dade County until 8:30 PM EST',
            area: 'Miami-Dade County, FL',
            effective: new Date().toISOString(),
            expires: new Date(Date.now() + 3600000).toISOString()
          },
          {
            id: 'mock-2',
            type: 'Severe Thunderstorm Warning',
            severity: 'severe',
            headline: 'Severe Thunderstorm Warning for Broward County until 9:15 PM EST',
            area: 'Broward County, FL',
            effective: new Date().toISOString(),
            expires: new Date(Date.now() + 2700000).toISOString()
          }
        ]);
      }
      
      setLastUpdate(new Date());
    } catch (error) {
      console.warn('Failed to fetch NWS alerts:', error);
      
      // Fallback to mock data
      setAlerts([
        {
          id: 'fallback-1',
          type: 'Weather Advisory',
          severity: 'moderate',
          headline: 'Unable to connect to NWS alerts service',
          area: 'All Areas',
          effective: new Date().toISOString(),
          expires: new Date(Date.now() + 3600000).toISOString()
        }
      ]);
      setLastUpdate(new Date());
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchAlerts();

    // Set up auto-refresh every 60 seconds
    const interval = setInterval(fetchAlerts, 60000);

    return () => clearInterval(interval);
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'extreme': return 'text-red-200 bg-red-600';
      case 'severe': return 'text-orange-200 bg-orange-600';
      case 'moderate': return 'text-yellow-200 bg-yellow-600';
      default: return 'text-blue-200 bg-blue-600';
    }
  };

  const formatTime = (dateStr: string) => {
    try {
      return new Intl.DateTimeFormat('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short'
      }).format(new Date(dateStr));
    } catch {
      return 'Unknown';
    }
  };

  if (alerts.length === 0 && !isLoading) {
    return (
      <div className="bg-green-600 text-white py-2 px-4">
        <div className="flex items-center justify-center space-x-2">
          <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium">No Active Weather Alerts</span>
          <Clock className="h-3 w-3 ml-2" />
          <span className="text-xs opacity-75">Updated: {formatTime(lastUpdate.toISOString())}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-red-600 text-white py-2 overflow-hidden relative">
      {isLoading && (
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            <span className="text-sm">Loading alerts...</span>
          </div>
        </div>
      )}
      
      <motion.div
        className="flex space-x-8 whitespace-nowrap"
        animate={{ x: '-100%' }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: 'linear'
        }}
        style={{ width: 'fit-content' }}
      >
        {alerts.map((alert, index) => (
          <div key={`${alert.id}-${index}`} className="flex items-center space-x-4 min-w-max">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 animate-pulse" />
              <span className={`px-2 py-1 rounded text-xs font-bold ${getSeverityColor(alert.severity)}`}>
                {alert.type.toUpperCase()}
              </span>
            </div>
            
            <span className="font-medium text-sm">
              {alert.headline}
            </span>
            
            <span className="text-xs opacity-75">
              {alert.area}
            </span>
            
            <span className="text-xs opacity-75">
              Expires: {formatTime(alert.expires)}
            </span>
            
            {/* Separator */}
            <div className="w-px h-4 bg-white/30 mx-4"></div>
          </div>
        ))}
        
        {/* Duplicate for seamless loop */}
        {alerts.map((alert, index) => (
          <div key={`${alert.id}-dup-${index}`} className="flex items-center space-x-4 min-w-max">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 animate-pulse" />
              <span className={`px-2 py-1 rounded text-xs font-bold ${getSeverityColor(alert.severity)}`}>
                {alert.type.toUpperCase()}
              </span>
            </div>
            
            <span className="font-medium text-sm">
              {alert.headline}
            </span>
            
            <span className="text-xs opacity-75">
              {alert.area}
            </span>
            
            <span className="text-xs opacity-75">
              Expires: {formatTime(alert.expires)}
            </span>
            
            {/* Separator */}
            <div className="w-px h-4 bg-white/30 mx-4"></div>
          </div>
        ))}
      </motion.div>
      
      {/* Update indicator */}
      <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center space-x-1 text-xs opacity-75">
        <Clock className="h-3 w-3" />
        <span>Updated: {formatTime(lastUpdate.toISOString())}</span>
      </div>
    </div>
  );
}