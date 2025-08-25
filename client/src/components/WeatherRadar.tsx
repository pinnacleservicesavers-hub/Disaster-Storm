import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { ExternalLink, RefreshCw } from "lucide-react";

export default function WeatherRadar() {
  const { translate } = useLanguage();
  
  // Default coordinates for Atlanta, GA
  const lat = 33.7490;
  const lon = -84.3880;
  
  const { data: radarData, isLoading, refetch } = useQuery({
    queryKey: ["/api/weather/radar", { lat, lon }],
    refetchInterval: 120000, // Refresh every 2 minutes
  });

  const { data: alerts } = useQuery({
    queryKey: ["/api/weather/alerts", { lat, lon }],
    refetchInterval: 60000, // Refresh every minute
  });

  const handleRefresh = () => {
    refetch();
  };

  return (
    <Card data-testid="card-weather-radar">
      <CardHeader className="border-b border-gray-200">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold text-gray-900">
            {translate('live_weather_radar')}
          </CardTitle>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-500">Live</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              data-testid="button-refresh-radar"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="relative h-80 bg-gradient-to-br from-blue-50 to-blue-100 overflow-hidden">
          {/* Radar visualization */}
          <div className="absolute inset-0" style={{
            background: `linear-gradient(45deg, rgba(59, 130, 246, 0.1) 25%, transparent 25%, transparent 75%, rgba(59, 130, 246, 0.1) 75%),
                        linear-gradient(45deg, rgba(59, 130, 246, 0.1) 25%, transparent 25%, transparent 75%, rgba(59, 130, 246, 0.1) 75%)`,
            backgroundSize: '20px 20px',
            backgroundPosition: '0 0, 10px 10px'
          }}>
            {/* Storm markers from API data */}
            {alerts?.map((alert: any, index: number) => (
              <div
                key={alert.id || index}
                className={`absolute w-6 h-6 rounded-full animate-pulse shadow-lg border-2 border-white ${
                  alert.severity === 'Extreme' ? 'bg-red-500' : 
                  alert.severity === 'Severe' ? 'bg-orange-500' : 'bg-yellow-500'
                }`}
                style={{
                  top: `${20 + index * 15}%`,
                  left: `${15 + index * 20}%`
                }}
                data-testid={`storm-marker-${index}`}
              >
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                  {alert.alertType || 'Storm Alert'}
                </div>
              </div>
            ))}
            
            {/* Coverage area indicators */}
            {radarData?.coverage?.map((area: any, index: number) => (
              <div
                key={`${area.state}-${index}`}
                className={`absolute w-4 h-4 rounded-full shadow-lg border-2 border-white ${
                  area.isActive ? 'bg-blue-600' : 'bg-gray-300'
                }`}
                style={{
                  bottom: `${10 + index * 8}%`,
                  right: `${10 + index * 12}%`
                }}
                data-testid={`coverage-area-${index}`}
              />
            ))}
            
            {/* Legend */}
            <div className="absolute bottom-4 right-4 bg-white bg-opacity-90 rounded-lg p-3">
              <div className="text-xs font-medium text-gray-700 mb-2">Coverage Areas</div>
              <div className="flex items-center space-x-4 text-xs">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  <span>Active</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                  <span>Covered</span>
                </div>
              </div>
            </div>
          </div>
          
          {isLoading && (
            <div className="absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center">
              <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
            </div>
          )}
        </div>
      </CardContent>
      
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4">
            <span className="text-gray-600">Last Updated:</span>
            <span className="font-medium" data-testid="text-last-updated">
              {radarData?.timestamp ? 
                new Date(radarData.timestamp).toLocaleTimeString() : 
                '2 minutes ago'
              }
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-blue-600 hover:text-blue-700"
            data-testid="button-view-full-radar"
          >
            View Full Radar <ExternalLink className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
