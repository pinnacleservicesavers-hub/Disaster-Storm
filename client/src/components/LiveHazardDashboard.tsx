import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle, 
  Zap, 
  Flame, 
  Waves, 
  Wind,
  CloudRain,
  RefreshCw,
  MapPin,
  Clock,
  TrendingUp,
  Snowflake,
  Zap as TornadoIcon
} from 'lucide-react';

interface LiveAlert {
  id: string;
  title: string;
  description: string;
  severity: string;
  alertType: string;
  areas: string[];
  startTime: string;
  endTime: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

interface HazardSummary {
  hurricanes: number;
  earthquakes: number;
  wildfires: number;
  winterStorms: number;
  tornadoes: number;
  total: number;
}

const severityColors = {
  'Extreme': 'bg-red-600 text-white border-red-700',
  'Severe': 'bg-orange-500 text-white border-orange-600',
  'Moderate': 'bg-yellow-500 text-white border-yellow-600',
  'Minor': 'bg-blue-500 text-white border-blue-600',
  'Unknown': 'bg-gray-500 text-white border-gray-600'
};

const alertIcons = {
  'Tornado': AlertTriangle,
  'Severe Thunderstorm': Zap,
  'Flood': Waves,
  'Fire': Flame,
  'Hurricane': Wind,
  'Winter Storm': CloudRain,
  'default': AlertTriangle
};

export default function LiveHazardDashboard() {
  const [selectedHazardType, setSelectedHazardType] = useState<'all' | 'winter' | 'tornado'>('all');

  const { data: alertsData, isLoading: alertsLoading } = useQuery({
    queryKey: ['/api/weather/alerts'],
    refetchInterval: 30000,
  });

  const { data: hazardsData } = useQuery({
    queryKey: ['/api/hazards/summary'],
    refetchInterval: 60000,
  });

  const { data: winterAlertsData } = useQuery({
    queryKey: ['winter-alerts'],
    queryFn: async () => {
      const winterEvents = encodeURIComponent('Blizzard Warning,Blizzard Watch,Ice Storm Warning,Ice Storm Watch,Winter Storm Warning,Winter Storm Watch,Winter Weather Advisory');
      const response = await fetch(`https://api.weather.gov/alerts/active?event=${winterEvents}`, {
        headers: {
          'User-Agent': 'DisasterDirect/1.0',
          'Accept': 'application/geo+json'
        }
      });
      if (!response.ok) return [];
      const data: any = await response.json();
      return (data.features || []).map((feature: any) => ({
        id: feature.properties.id,
        title: feature.properties.event,
        description: feature.properties.headline,
        severity: feature.properties.severity,
        alertType: feature.properties.event,
        areas: [feature.properties.areaDesc],
        startTime: feature.properties.onset,
        endTime: feature.properties.ends,
      }));
    },
    refetchInterval: 30000,
  });

  const alerts = (alertsData as LiveAlert[]) || [];
  const hazards = (hazardsData as HazardSummary) || { hurricanes: 0, earthquakes: 0, wildfires: 0, winterStorms: 0, total: 0 };
  const winterAlerts = (winterAlertsData as LiveAlert[]) || [];

  const displayedAlerts = selectedHazardType === 'winter' ? winterAlerts : alerts;

  const getAlertIcon = (type: string) => {
    const IconComponent = alertIcons[type as keyof typeof alertIcons] || alertIcons.default;
    return <IconComponent className="w-5 h-5" />;
  };

  const getSeverityColor = (severity: string) => {
    return severityColors[severity as keyof typeof severityColors] || severityColors.Unknown;
  };

  const formatTime = (time: string) => {
    return new Date(time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  return (
    <div className="space-y-6" data-testid="live-hazard-dashboard">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="border-cyan-500/30 bg-gradient-to-br from-slate-900/60 to-slate-800/40 dark:from-slate-900/80 dark:to-slate-800/60">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-cyan-400">
                  <AlertTriangle className="w-6 h-6 animate-pulse" />
                  Live Hazard Monitoring
                  <Badge className="ml-2 animate-bounce bg-cyan-600 text-white border-cyan-500">
                    {alerts.length} Active
                  </Badge>
                </CardTitle>
                <CardDescription className="mt-2 text-cyan-300/70">
                  Real-time severe weather alerts, earthquakes, wildfires, and hazards from NWS, USGS, NASA FIRMS
                </CardDescription>
              </div>
              {alertsLoading && (
                <RefreshCw className="w-5 h-5 animate-spin text-cyan-400" />
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="bg-slate-800/40 dark:bg-slate-800/60 rounded-lg p-4 shadow-sm border border-red-500/30"
              >
                <div className="flex items-center gap-3">
                  <Wind className="w-8 h-8 text-red-500" />
                  <div>
                    <div className="text-2xl font-bold text-red-400">{hazards.hurricanes}</div>
                    <div className="text-xs text-cyan-300/70">Hurricanes</div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                className="bg-slate-800/40 dark:bg-slate-800/60 rounded-lg p-4 shadow-sm border border-orange-500/30"
              >
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-8 h-8 text-orange-400" />
                  <div>
                    <div className="text-2xl font-bold text-orange-400">{hazards.earthquakes}</div>
                    <div className="text-xs text-cyan-300/70">Earthquakes</div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                className="bg-slate-800/40 dark:bg-slate-800/60 rounded-lg p-4 shadow-sm border border-yellow-500/30"
              >
                <div className="flex items-center gap-3">
                  <Flame className="w-8 h-8 text-yellow-400" />
                  <div>
                    <div className="text-2xl font-bold text-yellow-400">{hazards.wildfires}</div>
                    <div className="text-xs text-cyan-300/70">Wildfires</div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                onClick={() => setSelectedHazardType(selectedHazardType === 'winter' ? 'all' : 'winter')}
                className={`rounded-lg p-4 shadow-sm border cursor-pointer transition-all ${
                  selectedHazardType === 'winter'
                    ? 'bg-cyan-600/20 dark:bg-cyan-600/30 border-cyan-500'
                    : 'bg-slate-800/40 dark:bg-slate-800/60 border-cyan-500/30'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Snowflake className={`w-8 h-8 ${selectedHazardType === 'winter' ? 'text-cyan-300' : 'text-cyan-400'}`} />
                  <div>
                    <div className={`text-2xl font-bold ${selectedHazardType === 'winter' ? 'text-cyan-300' : 'text-cyan-400'}`}>{hazards.winterStorms}</div>
                    <div className="text-xs text-cyan-300/70">Winter Storms</div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                onClick={() => setSelectedHazardType(selectedHazardType === 'tornado' ? 'all' : 'tornado')}
                className={`rounded-lg p-4 shadow-sm border cursor-pointer transition-all ${
                  selectedHazardType === 'tornado'
                    ? 'bg-red-600/20 dark:bg-red-600/30 border-red-500'
                    : 'bg-slate-800/40 dark:bg-slate-800/60 border-red-500/30'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Zap className={`w-8 h-8 ${selectedHazardType === 'tornado' ? 'text-red-300' : 'text-red-400'}`} />
                  <div>
                    <div className={`text-2xl font-bold ${selectedHazardType === 'tornado' ? 'text-red-300' : 'text-red-400'}`}>{hazards.tornadoes || 0}</div>
                    <div className="text-xs text-cyan-300/70">Tornadoes</div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                className="bg-slate-800/40 dark:bg-slate-800/60 rounded-lg p-4 shadow-sm border border-cyan-500/30"
              >
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-8 h-8 text-cyan-400" />
                  <div>
                    <div className="text-2xl font-bold text-cyan-400">{alerts.length}</div>
                    <div className="text-xs text-cyan-300/70">Alerts</div>
                  </div>
                </div>
              </motion.div>
            </div>

            {(selectedHazardType === 'winter' || selectedHazardType === 'tornado') && (
              <div className="mb-4 p-3 bg-slate-800/40 border border-cyan-500/30 rounded-lg">
                <p className="text-sm text-cyan-300">
                  Showing <strong>{selectedHazardType === 'winter' ? winterAlerts.length : 'upcoming'}</strong> {selectedHazardType === 'winter' ? 'Winter Weather Alerts' : 'Tornado Watches'} - Click again to view all hazards
                </p>
              </div>
            )}
            <ScrollArea className="h-[600px] rounded-md border border-cyan-500/30 bg-slate-800/30 dark:bg-slate-900/40 p-4">
              <AnimatePresence>
                {displayedAlerts.length === 0 ? (
                  <div className="text-center py-12 text-cyan-300/50">
                    <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-30 text-cyan-400" />
                    <p className="text-lg font-medium text-cyan-300">No Active Alerts</p>
                    <p className="text-sm mt-1 text-cyan-300/70">{selectedHazardType === 'winter' ? 'No winter weather alerts detected.' : selectedHazardType === 'tornado' ? 'No tornado watches active.' : 'All clear! No severe weather or hazards detected.'}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {displayedAlerts.map((alert, index) => (
                      <motion.div
                        key={alert.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: index * 0.05 }}
                        data-testid={`alert-${alert.id}`}
                      >
                        <Card className={`border-l-4 ${alert.severity === 'Extreme' ? 'border-l-red-500 bg-red-600/10 dark:bg-red-600/20' : alert.severity === 'Severe' ? 'border-l-orange-500 bg-orange-600/10 dark:bg-orange-600/20' : 'border-l-yellow-500 bg-yellow-600/10 dark:bg-yellow-600/20'}`}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex items-start gap-3 flex-1">
                                <div className={`p-2 rounded-lg ${alert.severity === 'Extreme' ? 'bg-red-600/80' : alert.severity === 'Severe' ? 'bg-orange-600/80' : 'bg-yellow-600/80'} text-white`}>
                                  {getAlertIcon(alert.alertType)}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-bold text-white">{alert.title}</h3>
                                    <Badge className={getSeverityColor(alert.severity)}>
                                      {alert.severity}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-cyan-300/80 mb-2">
                                    {alert.description}
                                  </p>
                                  <div className="flex flex-wrap items-center gap-3 text-xs text-cyan-300/60">
                                    <div className="flex items-center gap-1">
                                      <MapPin className="w-3 h-3" />
                                      <span className="font-medium">
                                        {alert.areas.slice(0, 3).join(', ')}
                                        {alert.areas.length > 3 && ` +${alert.areas.length - 3} more`}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      <span>
                                        {formatTime(alert.startTime)} - {formatTime(alert.endTime)}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                )}
              </AnimatePresence>
            </ScrollArea>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
