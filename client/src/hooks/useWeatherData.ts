import { useQuery } from "@tanstack/react-query";
import { weatherApi } from "@/lib/api";

export function useWeatherAlerts(lat?: number, lon?: number) {
  return useQuery({
    queryKey: ["/api/weather/alerts", { lat, lon }],
    queryFn: () => weatherApi.getAlerts(lat, lon),
    refetchInterval: 60000, // Refresh every minute
    staleTime: 30000, // Consider data stale after 30 seconds
  });
}

export function useRadarData(lat: number, lon: number, zoom?: number) {
  return useQuery({
    queryKey: ["/api/weather/radar", { lat, lon, zoom }],
    queryFn: () => weatherApi.getRadarData(lat, lon, zoom),
    refetchInterval: 120000, // Refresh every 2 minutes
    enabled: !!(lat && lon),
  });
}

export function useForecast(lat: number, lon: number) {
  return useQuery({
    queryKey: ["/api/weather/forecast", { lat, lon }],
    queryFn: () => weatherApi.getForecast(lat, lon),
    refetchInterval: 300000, // Refresh every 5 minutes
    enabled: !!(lat && lon),
  });
}

export function useActiveWeatherAlerts() {
  const { data: alerts, ...query } = useWeatherAlerts();
  
  const activeAlerts = alerts?.filter(alert => {
    if (!alert.endTime) return true;
    return new Date(alert.endTime) > new Date();
  }) || [];

  return {
    ...query,
    data: activeAlerts,
    alertCount: activeAlerts.length,
    hasCriticalAlerts: activeAlerts.some(alert => 
      alert.severity === 'Extreme' || alert.alertType.includes('Tornado')
    )
  };
}
