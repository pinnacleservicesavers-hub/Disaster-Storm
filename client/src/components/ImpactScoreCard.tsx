import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, AlertTriangle, Wind, Flame, Flower2 } from 'lucide-react';

interface ImpactData {
  impactScore: number;
  coords: { lat: number; lng: number };
  components: {
    aqi: { AQI: number; norm: number };
    wind: { gust: number; norm: number };
    fire: { minDistanceKm: number | null; norm: number };
    pollen: {
      riskLabel: string | null;
      norm: number;
      tree: number | null;
      grass: number | null;
      weed: number | null;
    };
  };
}

interface ImpactScoreCardProps {
  lat: number;
  lng: number;
}

export default function ImpactScoreCard({ lat, lng }: ImpactScoreCardProps) {
  const [data, setData] = useState<ImpactData | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setError('');
    
    fetch(`/api/impact?lat=${lat}&lng=${lng}`)
      .then(r => {
        if (!r.ok) throw new Error(`Impact fetch failed: ${r.status}`);
        return r.json();
      })
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [lat, lng]);

  if (loading) {
    return (
      <Card data-testid="card-impact-loading">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Impact Score
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

  if (error) {
    return (
      <Card data-testid="card-impact-error">
        <CardHeader>
          <CardTitle>Impact Score</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const { impactScore, components } = data;
  const level = impactScore >= 70 ? 'High' : impactScore >= 40 ? 'Moderate' : 'Low';
  const levelColor = impactScore >= 70 ? 'destructive' : impactScore >= 40 ? 'default' : 'secondary';

  return (
    <Card data-testid="card-impact-score">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Incident Impact Score
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center space-y-2">
          <div className="text-5xl font-bold" data-testid="text-impact-score">
            {impactScore}
          </div>
          <Badge variant={levelColor} data-testid="badge-impact-level">
            {level} Risk
          </Badge>
        </div>

        <div className="pt-4 border-t space-y-3">
          <div className="flex items-center justify-between" data-testid="metric-aqi">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">AQI</span>
            </div>
            <div className="text-sm font-medium">
              {components.aqi.AQI} <span className="text-muted-foreground">(norm {components.aqi.norm.toFixed(2)})</span>
            </div>
          </div>

          <div className="flex items-center justify-between" data-testid="metric-wind">
            <div className="flex items-center gap-2">
              <Wind className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Wind Gust</span>
            </div>
            <div className="text-sm font-medium">
              {components.wind.gust} m/s <span className="text-muted-foreground">(norm {components.wind.norm.toFixed(2)})</span>
            </div>
          </div>

          <div className="flex items-center justify-between" data-testid="metric-wildfire">
            <div className="flex items-center gap-2">
              <Flame className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Nearest Wildfire</span>
            </div>
            <div className="text-sm font-medium">
              {components.fire.minDistanceKm ?? 'n/a'} km{' '}
              <span className="text-muted-foreground">(norm {components.fire.norm.toFixed(2)})</span>
            </div>
          </div>

          <div className="flex items-center justify-between" data-testid="metric-pollen">
            <div className="flex items-center gap-2">
              <Flower2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Pollen Risk</span>
            </div>
            <div className="text-sm font-medium">
              {components.pollen.riskLabel ?? 'n/a'}{' '}
              <span className="text-muted-foreground">(norm {components.pollen.norm.toFixed(2)})</span>
            </div>
          </div>
        </div>

        <div className="pt-2 text-xs text-muted-foreground">
          <p>Formula: AQI 45% + Wind 25% + Fire 15% + Pollen 15%</p>
        </div>
      </CardContent>
    </Card>
  );
}
