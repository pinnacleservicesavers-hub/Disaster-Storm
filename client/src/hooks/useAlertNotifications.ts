import { useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import type { WeatherAlert } from '@shared/schema';

export function useAlertNotifications() {
  const { toast } = useToast();
  const shownAlerts = useRef(new Set<string>());
  const queryClient = useQueryClient();

  const { data: alerts } = useQuery<WeatherAlert[]>({
    queryKey: ['/api/weather/alerts'],
    refetchInterval: 30000,
  });

  useEffect(() => {
    if (!alerts || alerts.length === 0) return;

    const extremeAlerts = alerts.filter(
      (alert) => alert.severity === 'Extreme' && !shownAlerts.current.has(alert.id.toString())
    );

    extremeAlerts.forEach((alert) => {
      const alertId = alert.id.toString();
      shownAlerts.current.add(alertId);

      const variant = alert.alertType.toLowerCase().includes('tornado') ? 'destructive' : 'default';
      const icon = alert.alertType.toLowerCase().includes('tornado') ? '🌪️' : 
                   alert.alertType.toLowerCase().includes('earthquake') ? '🌎' :
                   alert.alertType.toLowerCase().includes('fire') ? '🔥' : '⚠️';

      toast({
        title: `${icon} ${alert.alertType} - EXTREME`,
        description: alert.description || `Active ${alert.alertType} detected`,
        variant,
      });

      console.log(`🚨 Proactive alert shown: ${alert.alertType}`);
    });

    const severeAlerts = alerts.filter(
      (alert) => alert.severity === 'Severe' && !shownAlerts.current.has(alert.id.toString())
    );

    if (severeAlerts.length > 0 && extremeAlerts.length === 0) {
      const firstSevere = severeAlerts[0];
      const alertId = firstSevere.id.toString();
      
      if (!shownAlerts.current.has(alertId)) {
        shownAlerts.current.add(alertId);
        
        toast({
          title: `⚠️ ${firstSevere.alertType} - SEVERE`,
          description: firstSevere.description || `Active ${firstSevere.alertType} detected`,
          variant: 'default',
        });
        
        console.log(`⚠️ Severe alert shown: ${firstSevere.alertType}`);
      }
    }

  }, [alerts, toast]);

  return {
    alertsEnabled: true,
    extremeAlertCount: alerts?.filter(a => a.severity === 'Extreme').length || 0,
    severeAlertCount: alerts?.filter(a => a.severity === 'Severe').length || 0
  };
}
