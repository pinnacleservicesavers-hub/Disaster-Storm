import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import {
  CloudLightning, Link2, Unlink, Shield, AlertTriangle, CheckCircle2,
  Activity, MapPin, Wind, Droplets, Clock, TrendingUp, Eye,
  RefreshCw, Zap, BarChart3, Navigation, Loader2
} from 'lucide-react';

interface StormLink {
  id: number;
  storm_id: string;
  storm_name: string;
  storm_type: string;
  severity: string;
  fema_disaster_number: string;
  state: string;
  county: string;
  impact_start: string;
  impact_end: string;
  wind_speed: string;
  rainfall: string;
  damage_estimate: string;
  compliance_score: string;
  verification_count: number;
  status: string;
  linked_at: string;
}

interface StormTrackingProps {
  contractInfo?: {
    femaDisasterNumber?: string;
    incidentNumber?: string;
    projectWorksheetNumber?: string;
    state?: string;
    county?: string;
  };
}

export default function StormTrackingComponent({ contractInfo }: StormTrackingProps) {
  const { toast } = useToast();
  const [linking, setLinking] = useState<string | null>(null);

  const { data: intelligenceData, isLoading: loadingStorms, refetch: refetchStorms } = useQuery<any>({
    queryKey: ['/api/hazards/predictions/intelligence'],
    refetchInterval: 120000,
  });

  const { data: linksData, isLoading: loadingLinks, refetch: refetchLinks } = useQuery<any>({
    queryKey: ['/api/fema-data/storm-links'],
  });

  const { data: complianceSummary, refetch: refetchCompliance } = useQuery<any>({
    queryKey: ['/api/fema-data/storm-compliance-summary'],
  });

  const activeStorms = intelligenceData?.activeStorms || [];
  const impactZones = intelligenceData?.impactZones || [];
  const linkedStorms: StormLink[] = (linksData?.links || []).filter((l: any) => l.status === 'active');
  const linkedStormIds = new Set(linkedStorms.map(l => l.storm_id));

  const allStormItems = [
    ...activeStorms.map((s: any) => ({
      id: s.id || s.stormId || `storm-${s.name || 'unknown'}-${Math.random().toString(36).slice(2,8)}`,
      name: s.name || s.stormName || 'Unknown Storm',
      type: s.type || s.hazardType || 'severe_weather',
      severity: s.severity || s.riskLevel || 'moderate',
      state: s.location?.state || s.state || '',
      county: s.location?.county || s.county || '',
      windSpeed: s.windSpeed || s.maxWind || null,
      rainfall: s.rainfall || s.precipAmount || null,
      description: s.description || s.headline || '',
      estimatedDamage: s.estimatedDamage || s.damageEstimate || 0,
      startTime: s.startTime || s.onset || null,
      endTime: s.endTime || s.expires || null,
      source: 'live'
    })),
    ...impactZones.map((z: any) => ({
      id: z.id || `zone-${z.location?.state || 'unknown'}-${Math.random().toString(36).slice(2,8)}`,
      name: z.name || z.hazardType || 'Impact Zone',
      type: z.hazardType || z.type || 'impact_zone',
      severity: z.riskLevel || z.severity || 'moderate',
      state: z.location?.state || '',
      county: z.location?.county || '',
      windSpeed: z.windSpeed || null,
      rainfall: z.rainfall || null,
      description: z.description || '',
      estimatedDamage: z.estimatedRevenue || z.estimatedDamage || 0,
      startTime: z.expectedArrival || null,
      endTime: z.peakTime || null,
      source: 'impact'
    }))
  ];

  const uniqueStorms = allStormItems.filter((s, i, arr) => arr.findIndex(x => x.id === s.id) === i);

  const linkStormToContract = useCallback(async (storm: any) => {
    setLinking(storm.id);
    try {
      await apiRequest('/api/fema-data/storm-links', 'POST', {
        stormId: storm.id,
        stormName: storm.name,
        stormType: storm.type,
        severity: storm.severity,
        femaDisasterNumber: contractInfo?.femaDisasterNumber || '',
        incidentNumber: contractInfo?.incidentNumber || '',
        contractPW: contractInfo?.projectWorksheetNumber || '',
        state: storm.state || contractInfo?.state || '',
        county: storm.county || contractInfo?.county || '',
        impactStart: storm.startTime,
        impactEnd: storm.endTime,
        windSpeed: storm.windSpeed,
        rainfall: storm.rainfall,
        damageEstimate: storm.estimatedDamage,
        actor: 'operator',
        metadata: { description: storm.description, source: storm.source }
      });
      toast({ title: 'Storm Linked', description: `${storm.name} linked to FEMA contract` });
      refetchLinks();
      refetchCompliance();
      queryClient.invalidateQueries({ queryKey: ['/api/fema-data/storm-links'] });
    } catch (err) {
      toast({ title: 'Link Failed', description: 'Could not link storm to contract', variant: 'destructive' });
    }
    setLinking(null);
  }, [contractInfo, toast, refetchLinks, refetchCompliance]);

  const unlinkStorm = useCallback(async (linkId: number, stormName: string) => {
    try {
      await apiRequest(`/api/fema-data/storm-links/${linkId}`, 'DELETE');
      toast({ title: 'Storm Unlinked', description: `${stormName} removed from contract` });
      refetchLinks();
      refetchCompliance();
      queryClient.invalidateQueries({ queryKey: ['/api/fema-data/storm-links'] });
    } catch (err) {
      toast({ title: 'Unlink Failed', variant: 'destructive' });
    }
  }, [toast, refetchLinks, refetchCompliance]);

  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'extreme': case 'critical': return 'bg-red-500/20 text-red-400 border-red-500/40';
      case 'high': case 'severe': return 'bg-orange-500/20 text-orange-400 border-orange-500/40';
      case 'moderate': case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40';
      default: return 'bg-blue-500/20 text-blue-400 border-blue-500/40';
    }
  };

  const getTypeIcon = (type: string) => {
    if (type?.includes('hurricane') || type?.includes('tropical')) return '🌀';
    if (type?.includes('tornado')) return '🌪️';
    if (type?.includes('winter') || type?.includes('ice')) return '❄️';
    if (type?.includes('fire') || type?.includes('wildfire')) return '🔥';
    if (type?.includes('flood')) return '🌊';
    if (type?.includes('earthquake')) return '🌍';
    return '⛈️';
  };

  const verification = complianceSummary?.verification || {};
  const auditChainEntries = complianceSummary?.auditChainEntries || 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <CloudLightning className="h-5 w-5 text-yellow-400" />
            Storm Tracking & Compliance Link
          </h2>
          <p className="text-sm text-slate-400">Link active storms to your FEMA contract for cross-verified audit compliance</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => { refetchStorms(); refetchLinks(); refetchCompliance(); }}>
          <RefreshCw className="h-4 w-4 mr-1" /> Refresh
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-yellow-400">{linkedStorms.length}</div>
            <div className="text-xs text-slate-400">Linked Storms</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-blue-400">{verification.totalEvents || 0}</div>
            <div className="text-xs text-slate-400">Verifications</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-green-400">{verification.avgConfidence || 0}%</div>
            <div className="text-xs text-slate-400">Avg Confidence</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-purple-400">{auditChainEntries}</div>
            <div className="text-xs text-slate-400">Audit Entries</div>
          </CardContent>
        </Card>
      </div>

      {linkedStorms.length > 0 && (
        <Card className="bg-green-900/20 border-green-700/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-green-400 flex items-center gap-2">
              <Link2 className="h-4 w-4" /> Linked Storm Events
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {linkedStorms.map(link => (
              <div key={link.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/60 border border-green-700/30">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{getTypeIcon(link.storm_type)}</span>
                  <div>
                    <p className="font-medium text-white">{link.storm_name || link.storm_id}</p>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <Badge variant="outline" className={getSeverityColor(link.severity)}>{link.severity}</Badge>
                      {link.state && <span className="flex items-center gap-0.5"><MapPin className="h-3 w-3" />{link.state}{link.county ? `, ${link.county}` : ''}</span>}
                      {link.fema_disaster_number && <span>DR-{link.fema_disaster_number}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {link.wind_speed && (
                    <span className="text-xs text-slate-400 flex items-center gap-1"><Wind className="h-3 w-3" />{link.wind_speed} mph</span>
                  )}
                  <Badge variant="outline" className="text-green-400 border-green-500/40">
                    <CheckCircle2 className="h-3 w-3 mr-1" /> Linked
                  </Badge>
                  <Button variant="ghost" size="sm" className="h-7 text-xs text-red-400 hover:text-red-300" onClick={() => unlinkStorm(link.id, link.storm_name)}>
                    <Unlink className="h-3 w-3 mr-1" /> Unlink
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-white flex items-center gap-2">
            <Activity className="h-4 w-4 text-yellow-400" />
            Active Storms & Hazards
            {loadingStorms && <Loader2 className="h-3 w-3 animate-spin text-slate-400" />}
          </CardTitle>
          <CardDescription className="text-slate-400">
            {uniqueStorms.length > 0 
              ? `${uniqueStorms.length} active storm${uniqueStorms.length > 1 ? 's' : ''} detected — link to your contract for audit compliance`
              : 'No active storms detected in monitored areas'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {uniqueStorms.length === 0 && !loadingStorms && (
            <div className="text-center py-8 text-slate-500">
              <CloudLightning className="h-10 w-10 mx-auto mb-2 opacity-40" />
              <p>No active storms currently detected</p>
              <p className="text-xs mt-1">The system monitors NWS, SPC, NHC, and other sources continuously</p>
            </div>
          )}
          {uniqueStorms.map(storm => {
            const isLinked = linkedStormIds.has(storm.id);
            return (
              <div key={storm.id} className={`p-3 rounded-lg border ${isLinked ? 'bg-green-900/10 border-green-700/30' : 'bg-slate-800/40 border-slate-700'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <span className="text-lg">{getTypeIcon(storm.type)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white truncate">{storm.name}</p>
                      <p className="text-xs text-slate-400 truncate">{storm.description || storm.type}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge variant="outline" className={getSeverityColor(storm.severity)}>{storm.severity}</Badge>
                        {storm.state && <span className="text-xs text-slate-400 flex items-center gap-0.5"><MapPin className="h-3 w-3" />{storm.state}</span>}
                        {storm.windSpeed && <span className="text-xs text-slate-400 flex items-center gap-0.5"><Wind className="h-3 w-3" />{storm.windSpeed} mph</span>}
                        {storm.rainfall && <span className="text-xs text-slate-400 flex items-center gap-0.5"><Droplets className="h-3 w-3" />{storm.rainfall}"</span>}
                        {storm.estimatedDamage > 0 && <span className="text-xs text-slate-400">${(storm.estimatedDamage / 1000).toFixed(0)}K est.</span>}
                      </div>
                    </div>
                  </div>
                  <div className="ml-2 shrink-0">
                    {isLinked ? (
                      <Badge className="bg-green-600 text-white"><CheckCircle2 className="h-3 w-3 mr-1" /> Linked</Badge>
                    ) : (
                      <Button size="sm" variant="outline" className="text-xs border-yellow-500/40 text-yellow-400 hover:bg-yellow-500/10"
                        disabled={linking === storm.id}
                        onClick={() => linkStormToContract(storm)}>
                        {linking === storm.id ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Link2 className="h-3 w-3 mr-1" />}
                        Link to Contract
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {(complianceSummary?.complianceScopes || []).length > 0 && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-white flex items-center gap-2">
              <Shield className="h-4 w-4 text-blue-400" /> Storm-Linked Compliance Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(complianceSummary?.complianceScopes || []).map((scope: any) => {
              const score = parseFloat(scope.overall_score) || 0;
              return (
                <div key={scope.id} className="flex items-center justify-between p-2 rounded bg-slate-800/60">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">{scope.scope}</Badge>
                    <span className="text-sm text-white">{scope.scope_name || scope.scope_id}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-24">
                      <Progress value={score} className="h-2" />
                    </div>
                    <span className={`text-sm font-mono ${score >= 80 ? 'text-green-400' : score >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                      {score.toFixed(0)}%
                    </span>
                    <Badge variant="outline" className={scope.status === 'compliant' ? 'text-green-400 border-green-500/40' : scope.status === 'warning' ? 'text-yellow-400 border-yellow-500/40' : 'text-red-400 border-red-500/40'}>
                      {scope.status}
                    </Badge>
                  </div>
                </div>
              );
            })}

            {verification.criticalRisk > 0 && (
              <div className="mt-2 p-2 rounded bg-red-900/20 border border-red-700/30 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
                <span className="text-xs text-red-400">{verification.criticalRisk} critical-risk verification event{verification.criticalRisk > 1 ? 's' : ''} detected — review in Location Intelligence tab</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}