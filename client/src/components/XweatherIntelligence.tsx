import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  CloudLightning, 
  CloudHail, 
  AlertTriangle, 
  Wind, 
  Clock,
  MapPin,
  Activity,
  Zap,
  Target,
  Shield,
  TrendingUp,
  Gauge
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface XweatherIntelligenceProps {
  latitude: number;
  longitude: number;
  radiusKM?: number;
  className?: string;
}

interface LightningThreat {
  lat: number;
  lon: number;
  timestamp: string;
  pulseType: 'cg' | 'ic';
  peakAmperage?: number;
  ageSeconds: number;
  numSensors: number;
}

interface HailThreat {
  lat: number;
  lon: number;
  timestamp: string;
  period: {
    start: string;
    end: string;
  };
  hailSize: {
    inches: number;
    mm: number;
  };
  probability: number;
  movement?: {
    direction: string;
    speedMPH: number;
  };
}

interface StormReport {
  id: string;
  lat: number;
  lon: number;
  timestamp: string;
  category: 'hail' | 'tornado' | 'wind' | 'flood' | 'lightning' | 'snow' | 'ice';
  name: string;
  comments?: string;
  place?: {
    name: string;
    state: string;
    country: string;
  };
  measurements?: {
    hailInches?: number;
    windMPH?: number;
    rainInches?: number;
  };
}

interface ComprehensiveStormData {
  timestamp: string;
  threatLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'SEVERE' | 'EXTREME';
  threatScore: number;
  counts: {
    lightningStrikes: number;
    lightningThreats: number;
    hailThreats: number;
    stormReports: number;
  };
  maxValues: {
    hailSizeInches?: number;
    windSpeedMPH?: number;
  };
  advisories: {
    hasAdvisories: boolean;
    codes?: string[];
    hasTornadic: boolean;
    hasRotation: boolean;
  };
}

const getThreatLevelColor = (level: string) => {
  switch (level) {
    case 'EXTREME': return 'text-red-700 bg-red-100 border-red-300';
    case 'SEVERE': return 'text-orange-700 bg-orange-100 border-orange-300';
    case 'HIGH': return 'text-yellow-700 bg-yellow-100 border-yellow-300';
    case 'MODERATE': return 'text-blue-700 bg-blue-100 border-blue-300';
    case 'LOW': return 'text-green-700 bg-green-100 border-green-300';
    default: return 'text-gray-700 bg-gray-100 border-gray-300';
  }
};

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'lightning': return <Zap className="w-4 h-4" />;
    case 'hail': return <CloudHail className="w-4 h-4" />;
    case 'tornado': return <Wind className="w-4 h-4" />;
    case 'wind': return <Wind className="w-4 h-4" />;
    case 'flood': return <AlertTriangle className="w-4 h-4" />;
    default: return <Activity className="w-4 h-4" />;
  }
};

export function XweatherIntelligence({ 
  latitude, 
  longitude, 
  radiusKM = 50,
  className 
}: XweatherIntelligenceProps) {
  const { data: lightningData, isLoading: lightningLoading } = useQuery<{ success: boolean; data: LightningThreat[]; count: number }>({
    queryKey: ['/api/xweather/lightning/threats', latitude, longitude, radiusKM],
    refetchInterval: 60000,
    enabled: !!latitude && !!longitude
  });

  const { data: hailData, isLoading: hailLoading } = useQuery<{ success: boolean; data: HailThreat[]; count: number }>({
    queryKey: ['/api/xweather/hail/threats', latitude, longitude, radiusKM],
    refetchInterval: 180000,
    enabled: !!latitude && !!longitude
  });

  const { data: stormData, isLoading: stormLoading } = useQuery<{ success: boolean; data: ComprehensiveStormData }>({
    queryKey: ['/api/xweather/threats', latitude, longitude, radiusKM],
    refetchInterval: 120000,
    enabled: !!latitude && !!longitude
  });

  const { data: reportsData, isLoading: reportsLoading } = useQuery<{ success: boolean; data: StormReport[]; count: number }>({
    queryKey: ['/api/xweather/stormreports', latitude, longitude, radiusKM],
    refetchInterval: 300000,
    enabled: !!latitude && !!longitude
  });

  const isLoading = lightningLoading || hailLoading || stormLoading || reportsLoading;

  if (isLoading) {
    return (
      <Card className={cn("w-full", className)} data-testid="card-xweather-loading">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Zap className="w-5 h-5 mr-2 text-blue-600" />
            Xweather Storm Intelligence
          </CardTitle>
          <CardDescription>Loading real-time storm data...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-20 w-full bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
          <div className="h-32 w-full bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
          <div className="h-32 w-full bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
        </CardContent>
      </Card>
    );
  }

  const comprehensiveData = stormData?.data;
  const lightningThreats = lightningData?.data || [];
  const hailThreats = hailData?.data || [];
  const stormReports = reportsData?.data || [];

  return (
    <Card className={cn("w-full", className)} data-testid="card-xweather">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Zap className="w-5 h-5 mr-2 text-blue-600" />
            Xweather Storm Intelligence
          </div>
          {comprehensiveData && (
            <Badge 
              className={cn("text-sm", getThreatLevelColor(comprehensiveData.threatLevel))}
              data-testid={`badge-threat-${comprehensiveData.threatLevel.toLowerCase()}`}
            >
              {comprehensiveData.threatLevel}
            </Badge>
          )}
        </CardTitle>
        <CardDescription className="flex items-center text-sm">
          <MapPin className="w-3 h-3 mr-1" />
          {latitude.toFixed(4)}°N, {longitude.toFixed(4)}°W • {radiusKM}km radius
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Comprehensive Threat Overview */}
        {comprehensiveData && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-lg border-2"
            style={{ borderColor: comprehensiveData.threatLevel === 'EXTREME' ? '#ef4444' : comprehensiveData.threatLevel === 'SEVERE' ? '#f97316' : '#3b82f6' }}
            data-testid="section-threat-overview"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                Threat Assessment
              </h3>
              <div className="flex items-center text-sm text-gray-600">
                <Gauge className="w-4 h-4 mr-1" />
                Score: {comprehensiveData.threatScore}/100
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center" data-testid="stat-lightning">
                <div className="text-2xl font-bold text-yellow-600">{comprehensiveData.counts.lightningStrikes}</div>
                <div className="text-xs text-gray-600">Lightning Strikes</div>
              </div>
              <div className="text-center" data-testid="stat-lightning-threats">
                <div className="text-2xl font-bold text-orange-600">{comprehensiveData.counts.lightningThreats}</div>
                <div className="text-xs text-gray-600">Lightning Threats</div>
              </div>
              <div className="text-center" data-testid="stat-hail">
                <div className="text-2xl font-bold text-blue-600">{comprehensiveData.counts.hailThreats}</div>
                <div className="text-xs text-gray-600">Hail Threats</div>
              </div>
              <div className="text-center" data-testid="stat-reports">
                <div className="text-2xl font-bold text-red-600">{comprehensiveData.counts.stormReports}</div>
                <div className="text-xs text-gray-600">Storm Reports</div>
              </div>
            </div>

            {(comprehensiveData.maxValues.hailSizeInches || comprehensiveData.maxValues.windSpeedMPH) && (
              <div className="flex items-center gap-4 text-sm">
                {comprehensiveData.maxValues.hailSizeInches && (
                  <div className="flex items-center" data-testid="text-max-hail">
                    <CloudHail className="w-4 h-4 mr-1 text-blue-600" />
                    Max Hail: {comprehensiveData.maxValues.hailSizeInches}"
                  </div>
                )}
                {comprehensiveData.maxValues.windSpeedMPH && (
                  <div className="flex items-center" data-testid="text-max-wind">
                    <Wind className="w-4 h-4 mr-1 text-gray-600" />
                    Max Wind: {comprehensiveData.maxValues.windSpeedMPH} mph
                  </div>
                )}
              </div>
            )}

            {comprehensiveData.advisories.hasAdvisories && (
              <Alert className="mt-4 border-orange-300 bg-orange-50" data-testid="alert-advisories">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <AlertDescription>
                  <div className="font-semibold">Active Weather Advisories</div>
                  {comprehensiveData.advisories.hasTornadic && (
                    <div className="text-sm text-red-600 font-medium">⚠ Tornadic Activity Detected</div>
                  )}
                  {comprehensiveData.advisories.hasRotation && (
                    <div className="text-sm text-orange-600">⚠ Storm Rotation Detected</div>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </motion.div>
        )}

        <Separator />

        {/* Lightning Threats */}
        <div data-testid="section-lightning-threats">
          <h3 className="text-md font-semibold mb-3 flex items-center">
            <CloudLightning className="w-5 h-5 mr-2 text-yellow-600" />
            Lightning Activity ({lightningThreats.length})
          </h3>
          
          {lightningThreats.length === 0 ? (
            <p className="text-sm text-gray-500 italic" data-testid="text-no-lightning">No lightning threats detected in the area</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {lightningThreats.slice(0, 10).map((threat, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm"
                  data-testid={`lightning-threat-${idx}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center font-medium">
                      <Zap className="w-4 h-4 mr-1 text-yellow-600" />
                      {threat.pulseType === 'cg' ? 'Cloud-to-Ground' : 'In-Cloud'}
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {threat.ageSeconds}s ago
                    </Badge>
                  </div>
                  <div className="text-xs text-gray-600 space-y-1">
                    <div>📍 {threat.lat.toFixed(4)}°, {threat.lon.toFixed(4)}°</div>
                    {threat.peakAmperage && (
                      <div>⚡ {threat.peakAmperage.toLocaleString()} kA</div>
                    )}
                    <div>📡 {threat.numSensors} sensors</div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        <Separator />

        {/* Hail Threats */}
        <div data-testid="section-hail-threats">
          <h3 className="text-md font-semibold mb-3 flex items-center">
            <CloudHail className="w-5 h-5 mr-2 text-blue-600" />
            Hail Forecasts ({hailThreats.length})
          </h3>
          
          {hailThreats.length === 0 ? (
            <p className="text-sm text-gray-500 italic" data-testid="text-no-hail">No hail threats forecasted</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {hailThreats.slice(0, 10).map((threat, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm"
                  data-testid={`hail-threat-${idx}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center font-medium">
                      <CloudHail className="w-4 h-4 mr-1 text-blue-600" />
                      {threat.hailSize.inches}" Hail
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {threat.probability}% chance
                    </Badge>
                  </div>
                  <div className="text-xs text-gray-600 space-y-1">
                    <div>📍 {threat.lat.toFixed(4)}°, {threat.lon.toFixed(4)}°</div>
                    <div>⏰ {new Date(threat.period.start).toLocaleTimeString()} - {new Date(threat.period.end).toLocaleTimeString()}</div>
                    {threat.movement && (
                      <div>➡️ Moving {threat.movement.direction} at {threat.movement.speedMPH} mph</div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        <Separator />

        {/* Storm Reports */}
        <div data-testid="section-storm-reports">
          <h3 className="text-md font-semibold mb-3 flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 text-red-600" />
            Recent Storm Reports ({stormReports.length})
          </h3>
          
          {stormReports.length === 0 ? (
            <p className="text-sm text-gray-500 italic" data-testid="text-no-reports">No recent storm reports</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {stormReports.slice(0, 10).map((report, idx) => (
                <motion.div
                  key={report.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm"
                  data-testid={`storm-report-${idx}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center font-medium">
                      {getCategoryIcon(report.category)}
                      <span className="ml-1 capitalize">{report.category}</span>
                    </div>
                    <Clock className="w-3 h-3 text-gray-500" />
                  </div>
                  <div className="text-xs text-gray-600 space-y-1">
                    <div className="font-medium">{report.name}</div>
                    {report.place && (
                      <div>📍 {report.place.name}, {report.place.state}</div>
                    )}
                    {report.measurements?.hailInches && (
                      <div>❄️ Hail: {report.measurements.hailInches}"</div>
                    )}
                    {report.measurements?.windMPH && (
                      <div>💨 Wind: {report.measurements.windMPH} mph</div>
                    )}
                    {report.comments && (
                      <div className="italic text-gray-500">{report.comments}</div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-xs text-gray-500 text-center pt-4 border-t">
          <div className="flex items-center justify-center gap-2">
            <Activity className="w-3 h-3" />
            Powered by Xweather Global Lightning & Storm Network
          </div>
          <div className="mt-1">
            Real-time data • 60-minute forecasts • NWS validation
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
