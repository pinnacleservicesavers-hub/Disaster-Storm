import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Flower2, AlertTriangle, Activity } from 'lucide-react';

interface PollenData {
  tree_pollen?: { count: number; risk: string };
  grass_pollen?: { count: number; risk: string };
  weed_pollen?: { count: number; risk: string };
  updatedAt?: string;
}

interface PollenCardProps {
  lat: number;
  lng: number;
}

export default function PollenCard({ lat, lng }: PollenCardProps) {
  const [data, setData] = useState<PollenData | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setError('');
    
    fetch(`/api/ambee/pollen/latest/by-lat-lng?lat=${lat}&lng=${lng}`)
      .then(r => {
        if (!r.ok) throw new Error(`Pollen fetch failed: ${r.status}`);
        return r.json();
      })
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [lat, lng]);

  const getRiskColor = (risk: string) => {
    switch (risk?.toLowerCase()) {
      case 'very high':
      case 'high':
        return 'destructive';
      case 'moderate':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  if (loading) {
    return (
      <Card data-testid="card-pollen-loading">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flower2 className="h-5 w-5" />
            Pollen Levels
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
      <Card data-testid="card-pollen-error">
        <CardHeader>
          <CardTitle>Pollen Levels</CardTitle>
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

  const { tree_pollen, grass_pollen, weed_pollen, updatedAt } = data;
  const overallRisk = tree_pollen?.risk || grass_pollen?.risk || weed_pollen?.risk || 'Unknown';

  return (
    <Card data-testid="card-pollen">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flower2 className="h-5 w-5" />
            Pollen Levels
          </div>
          <Badge variant={getRiskColor(overallRisk)} data-testid="badge-pollen-risk">
            {overallRisk}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-3">
          <div className="flex items-center justify-between" data-testid="pollen-tree">
            <span className="text-sm text-muted-foreground">Tree Pollen</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{tree_pollen?.count ?? 'n/a'}</span>
              {tree_pollen?.risk && (
                <Badge variant="outline" className="text-xs">
                  {tree_pollen.risk}
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between" data-testid="pollen-grass">
            <span className="text-sm text-muted-foreground">Grass Pollen</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{grass_pollen?.count ?? 'n/a'}</span>
              {grass_pollen?.risk && (
                <Badge variant="outline" className="text-xs">
                  {grass_pollen.risk}
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between" data-testid="pollen-weed">
            <span className="text-sm text-muted-foreground">Weed Pollen</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{weed_pollen?.count ?? 'n/a'}</span>
              {weed_pollen?.risk && (
                <Badge variant="outline" className="text-xs">
                  {weed_pollen.risk}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {updatedAt && (
          <div className="pt-2 text-xs text-muted-foreground border-t">
            Updated: {new Date(updatedAt).toLocaleString()}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
