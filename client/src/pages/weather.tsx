import { useState } from "react";
import TopNavigation from "@/components/TopNavigation";
import Sidebar from "@/components/Sidebar";
import WeatherRadar from "@/components/WeatherRadar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useWeatherAlerts, useForecast } from "@/hooks/useWeatherData";
import { AlertTriangle, Cloud, Eye, Wind } from "lucide-react";

export default function Weather() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { translate } = useLanguage();

  // Default coordinates for Atlanta, GA
  const lat = 33.7490;
  const lon = -84.3880;

  const { data: alerts } = useWeatherAlerts(lat, lon);
  const { data: forecast } = useForecast(lat, lon);

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'extreme':
        return 'bg-red-500';
      case 'severe':
        return 'bg-orange-500';
      case 'moderate':
        return 'bg-yellow-500';
      default:
        return 'bg-blue-500';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNavigation onSidebarToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      
      <div className="pt-16 flex">
        <Sidebar collapsed={sidebarCollapsed} />
        
        <main className={`flex-1 transition-all duration-300 ${
          sidebarCollapsed ? 'ml-16' : 'ml-280'
        }`}>
          <div className="p-6">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900" data-testid="weather-page-title">
                {translate('weather_radar')}
              </h1>
              <p className="text-gray-600 mt-1">
                Live weather monitoring and storm tracking
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
              <div className="lg:col-span-2">
                <WeatherRadar />
              </div>
              
              <div className="space-y-6">
                {/* Current Conditions */}
                <Card data-testid="card-current-conditions">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Cloud className="w-5 h-5 mr-2" />
                      Current Conditions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {forecast?.current ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-3xl font-bold">
                            {forecast.current.temperature}°F
                          </span>
                          <span className="text-gray-600">
                            {forecast.current.conditions}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center">
                            <Wind className="w-4 h-4 mr-1 text-gray-400" />
                            <span>{forecast.current.windSpeed} mph {forecast.current.windDirection}</span>
                          </div>
                          <div className="flex items-center">
                            <Eye className="w-4 h-4 mr-1 text-gray-400" />
                            <span>{forecast.current.visibility} mi</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="animate-shimmer h-20 rounded"></div>
                    )}
                  </CardContent>
                </Card>

                {/* Active Alerts */}
                <Card data-testid="card-active-alerts">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <AlertTriangle className="w-5 h-5 mr-2" />
                      Active Alerts
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {alerts && alerts.length > 0 ? (
                      <div className="space-y-3">
                        {alerts.map((alert, index) => (
                          <div 
                            key={alert.id} 
                            className="border border-gray-200 rounded-lg p-3"
                            data-testid={`alert-${index}`}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="font-medium text-sm">{alert.title}</h4>
                              <Badge className={`${getSeverityColor(alert.severity)} text-white`}>
                                {alert.severity}
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-600 mb-2">
                              {alert.description}
                            </p>
                            <div className="text-xs text-gray-500">
                              Areas: {alert.areas.join(', ')}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center text-gray-500 py-6">
                        <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                        <p>No active weather alerts</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Forecast */}
            <Card data-testid="card-forecast">
              <CardHeader>
                <CardTitle>7-Day Forecast</CardTitle>
              </CardHeader>
              <CardContent>
                {forecast?.daily ? (
                  <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                    {forecast.daily.map((day, index) => (
                      <div 
                        key={index} 
                        className="text-center p-4 border border-gray-200 rounded-lg"
                        data-testid={`forecast-day-${index}`}
                      >
                        <div className="font-medium text-sm mb-2">
                          {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                        </div>
                        <div className="text-xs text-gray-600 mb-2">
                          {day.conditions}
                        </div>
                        <div className="font-bold">
                          {day.high}°
                        </div>
                        <div className="text-gray-500 text-sm">
                          {day.low}°
                        </div>
                        <div className="text-xs text-blue-600 mt-1">
                          {day.precipitationChance}%
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="animate-shimmer h-32 rounded"></div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
