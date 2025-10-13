import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Activity, Flower2, Shield, ArrowRight, AlertTriangle } from 'lucide-react';
import { Link } from 'wouter';

interface EnvironmentalSummaryProps {
  lat?: number;
  lng?: number;
  place?: string;
}

export function EnvironmentalSummary({ lat = 25.7617, lng = -80.1918, place }: EnvironmentalSummaryProps) {
  // Build query URL with parameters
  const buildQueryUrl = () => {
    if (place) {
      return `/api/ambee/environmental-report?place=${encodeURIComponent(place)}`;
    } else if (lat && lng) {
      return `/api/ambee/environmental-report?lat=${lat}&lng=${lng}`;
    }
    return '/api/ambee/environmental-report?lat=25.7617&lng=-80.1918';
  };
  
  const { data, isLoading } = useQuery<any>({
    queryKey: [buildQueryUrl()],
    enabled: !!(lat && lng) || !!place,
  });

  const getAQIColor = (aqi: number) => {
    if (aqi <= 50) return 'bg-green-500';
    if (aqi <= 100) return 'bg-yellow-500';
    if (aqi <= 150) return 'bg-orange-500';
    if (aqi <= 200) return 'bg-red-500';
    if (aqi <= 300) return 'bg-purple-500';
    return 'bg-maroon-600';
  };

  const getPollenRiskColor = (risk: string) => {
    switch (risk?.toLowerCase()) {
      case 'low': return 'bg-green-500';
      case 'moderate': return 'bg-yellow-500';
      case 'high': return 'bg-orange-500';
      case 'very high': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Environmental Conditions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Activity className="h-8 w-8 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const { airQuality, healthImpact, pollen } = data;
  const hasHealthRisk = airQuality?.AQI > 100;

  return (
    <Card className={hasHealthRisk ? 'border-orange-500 border-2' : ''}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Environmental Conditions
          </div>
          <Link href="/environmental-intelligence">
            <Button variant="outline" size="sm" data-testid="button-view-full-environmental">
              View Full Report
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Air Quality */}
        <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
          <div className="flex items-center gap-3">
            <div className={`text-3xl font-bold ${getAQIColor(airQuality?.AQI || 0)} bg-clip-text text-transparent`} data-testid="text-aqi-summary">
              {airQuality?.AQI || 0}
            </div>
            <div>
              <div className="text-sm font-medium">Air Quality Index</div>
              <Badge className={getAQIColor(airQuality?.AQI || 0)} data-testid="badge-aqi-level-summary">
                {healthImpact?.level || 'Unknown'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Health Alert */}
        {hasHealthRisk && (
          <div className="flex items-start gap-2 p-3 bg-orange-50 dark:bg-orange-950 rounded-lg border border-orange-200 dark:border-orange-800">
            <AlertTriangle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-medium text-sm text-orange-900 dark:text-orange-100">Crew Safety Alert</div>
              <div className="text-xs text-orange-700 dark:text-orange-300 mt-1">
                {healthImpact?.recommendations[0] || 'Monitor air quality conditions'}
              </div>
            </div>
          </div>
        )}

        {/* Pollen Summary */}
        <div className="grid grid-cols-3 gap-2">
          <div className="p-2 bg-secondary rounded text-center">
            <Flower2 className="h-4 w-4 mx-auto mb-1 text-green-600" />
            <div className="text-xs text-muted-foreground">Tree</div>
            <Badge variant="outline" className={`mt-1 text-xs ${getPollenRiskColor(pollen?.tree_pollen?.risk || '')}`}>
              {pollen?.tree_pollen?.risk || 'N/A'}
            </Badge>
          </div>
          <div className="p-2 bg-secondary rounded text-center">
            <Flower2 className="h-4 w-4 mx-auto mb-1 text-green-500" />
            <div className="text-xs text-muted-foreground">Grass</div>
            <Badge variant="outline" className={`mt-1 text-xs ${getPollenRiskColor(pollen?.grass_pollen?.risk || '')}`}>
              {pollen?.grass_pollen?.risk || 'N/A'}
            </Badge>
          </div>
          <div className="p-2 bg-secondary rounded text-center">
            <Flower2 className="h-4 w-4 mx-auto mb-1 text-purple-600" />
            <div className="text-xs text-muted-foreground">Weed</div>
            <Badge variant="outline" className={`mt-1 text-xs ${getPollenRiskColor(pollen?.weed_pollen?.risk || '')}`}>
              {pollen?.weed_pollen?.risk || 'N/A'}
            </Badge>
          </div>
        </div>

        {/* Safety Recommendation */}
        {healthImpact?.recommendations?.length > 0 && (
          <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-2">
              <Shield className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-blue-900 dark:text-blue-100">
                <span className="font-medium">Safety Tip: </span>
                {healthImpact.recommendations[healthImpact.recommendations.length - 1]}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
