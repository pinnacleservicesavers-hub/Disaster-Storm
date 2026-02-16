import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Layers, Shield, CheckCircle2, AlertTriangle, XCircle, Radio, MapPin,
  Camera, Clock, Cloud, Users, Truck, Smartphone, Brain, Plus, Eye,
  Lock, Link2, Activity, Zap, Target, ChevronDown, ChevronUp, RefreshCw
} from "lucide-react";

interface VerificationEvent {
  id: number;
  event_type: string;
  job_id: string;
  crew_id: string;
  crew_member_name: string;
  confidence_score: string;
  risk_level: string;
  created_at: string;
  ai_reasoning: string;
  anomalies: string[];
  signal_breakdown: Array<{ type: string; status: string; weight: number; evidence: string }>;
}

interface ComplianceScope {
  id: number;
  scope: string;
  scope_id: string;
  scope_name: string;
  overall_score: string;
  status: string;
  total_events: number;
  passed_events: number;
  failed_events: number;
  alerts: string[];
}

interface AuditChainEntry {
  id: number;
  entity_type: string;
  entity_id: string;
  action: string;
  actor: string;
  actor_role: string;
  payload_hash: string;
  prev_hash: string;
  chain_hash: string;
  metadata: any;
  created_at: string;
}

const SIGNAL_ICONS: Record<string, any> = {
  gps: MapPin,
  exif: Camera,
  time: Clock,
  weather: Cloud,
  sign_in: Users,
  load_ticket: Truck,
  device: Smartphone,
  photo: Camera,
  anomaly: AlertTriangle,
};

const SIGNAL_LABELS: Record<string, string> = {
  gps: 'GPS Location',
  exif: 'Photo EXIF',
  time: 'Time Verification',
  weather: 'Weather Correlation',
  sign_in: 'Crew Sign-In',
  load_ticket: 'Load Ticket',
  device: 'Device Fingerprint',
  photo: 'Photo Documentation',
};

const EVENT_TYPE_LABELS: Record<string, string> = {
  crew_arrival: 'Crew Arrival',
  work_in_progress: 'Work In Progress',
  load_departure: 'Load Departure',
  site_inspection: 'Site Inspection',
  photo_capture: 'Photo Capture',
};

function getRiskColor(risk: string) {
  switch (risk) {
    case 'low': return 'text-green-400 border-green-500/30 bg-green-500/10';
    case 'medium': return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
    case 'high': return 'text-orange-400 border-orange-500/30 bg-orange-500/10';
    case 'critical': return 'text-red-400 border-red-500/30 bg-red-500/10';
    default: return 'text-slate-400 border-slate-500/30 bg-slate-500/10';
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case 'pass': return 'text-green-400 bg-green-500/10 border-green-500/20';
    case 'fail': return 'text-red-400 bg-red-500/10 border-red-500/20';
    case 'warning': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    default: return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'pass': return CheckCircle2;
    case 'fail': return XCircle;
    case 'warning': return AlertTriangle;
    default: return Radio;
  }
}

export default function LocationIntelligence() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<VerificationEvent[]>([]);
  const [complianceScopes, setComplianceScopes] = useState<ComplianceScope[]>([]);
  const [stats, setStats] = useState<any>({});
  const [signalBreakdown, setSignalBreakdown] = useState<any[]>([]);
  const [auditChain, setAuditChain] = useState<AuditChainEntry[]>([]);
  const [chainIntegrity, setChainIntegrity] = useState<any>(null);
  const [expandedEvent, setExpandedEvent] = useState<number | null>(null);
  const [showNewEvent, setShowNewEvent] = useState(false);
  const [showAuditChain, setShowAuditChain] = useState(false);
  const [simulating, setSimulating] = useState(false);

  const [newEvent, setNewEvent] = useState({
    eventType: '',
    crewId: '',
    crewMemberName: '',
    jobId: '',
    locationLat: '',
    locationLng: '',
    locationAccuracyMeters: '',
    sourceNotes: '',
    deviceFingerprint: '',
  });

  const loadData = useCallback(async () => {
    try {
      const [statusRes, chainRes] = await Promise.all([
        apiRequest('/api/fema-data/verification-status'),
        apiRequest('/api/fema-data/audit-chain'),
      ]);
      if (statusRes.success) {
        setEvents(statusRes.recentEvents || []);
        setComplianceScopes(statusRes.complianceScopes || []);
        setStats(statusRes.stats || {});
        setSignalBreakdown(statusRes.signalBreakdown || []);
      }
      if (chainRes.success) {
        setAuditChain(chainRes.entries || []);
        setChainIntegrity(chainRes.integrity || null);
      }
    } catch (err) {
      console.error('Failed to load verification data:', err);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const loadFullEvents = useCallback(async () => {
    try {
      const res = await apiRequest('/api/fema-data/verification-events');
      if (res.success) setEvents(res.events || []);
    } catch (err) {
      console.error('Failed to load full events:', err);
    }
  }, []);

  useEffect(() => { loadFullEvents(); }, [loadFullEvents]);

  const handleSimulate = async () => {
    setSimulating(true);
    try {
      const res = await apiRequest('/api/fema-data/verification-events/simulate', { method: 'POST' });
      if (res.success) {
        toast({ title: "Verification Events Simulated", description: `${res.simulated} multi-signal events created with AI scoring` });
        loadData();
        loadFullEvents();
      }
    } catch (err) {
      toast({ title: "Simulation Failed", variant: "destructive" });
    }
    setSimulating(false);
  };

  const handleCreateEvent = async () => {
    if (!newEvent.eventType || !newEvent.crewMemberName) {
      toast({ title: "Missing Fields", description: "Event type and crew member name are required", variant: "destructive" });
      return;
    }
    try {
      const res = await apiRequest('/api/fema-data/verification-events', {
        method: 'POST',
        body: JSON.stringify({
          ...newEvent,
          signals: [
            { signalType: 'photo', signalValue: { hasPhoto: false }, weight: 1.0 }
          ]
        }),
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.success) {
        toast({ title: "Verification Event Created", description: `Confidence: ${res.event.confidenceScore}% (${res.event.riskLevel} risk)` });
        setShowNewEvent(false);
        setNewEvent({ eventType: '', crewId: '', crewMemberName: '', jobId: '', locationLat: '', locationLng: '', locationAccuracyMeters: '', sourceNotes: '', deviceFingerprint: '' });
        loadData();
        loadFullEvents();
      }
    } catch (err) {
      toast({ title: "Failed to Create Event", variant: "destructive" });
    }
  };

  const totalEvents = parseInt(stats.total_events || '0');
  const avgConfidence = parseFloat(stats.avg_confidence || '0');
  const lowRisk = parseInt(stats.low_risk || '0');
  const highRisk = parseInt(stats.high_risk || '0') + parseInt(stats.critical_risk || '0');

  const signalSummary: Record<string, { pass: number; fail: number; warning: number; unknown: number }> = {};
  signalBreakdown.forEach((s: any) => {
    if (!signalSummary[s.signal_type]) signalSummary[s.signal_type] = { pass: 0, fail: 0, warning: 0, unknown: 0 };
    signalSummary[s.signal_type][s.status as 'pass' | 'fail' | 'warning' | 'unknown'] = parseInt(s.count);
  });

  if (loading) {
    return (
      <div className="space-y-4">
        <Card className="bg-slate-900 border-slate-700">
          <CardContent className="p-8 text-center text-slate-400">
            <Layers className="h-8 w-8 mx-auto mb-3 animate-pulse text-blue-400" />
            Loading Location Intelligence...
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 border-blue-500/20">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg text-white flex items-center gap-2">
                <Layers className="h-5 w-5 text-blue-400" />
                Layered Location Intelligence
              </CardTitle>
              <CardDescription className="text-slate-400">
                Multi-signal verification stack — GPS is one signal among many. AI scores every field event.
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleSimulate} disabled={simulating}>
                <Zap className="h-4 w-4 mr-1" />
                {simulating ? 'Simulating...' : 'Simulate Events'}
              </Button>
              <Button size="sm" onClick={() => setShowNewEvent(true)}>
                <Plus className="h-4 w-4 mr-1" /> New Verification
              </Button>
              <Button variant="outline" size="sm" onClick={() => { loadData(); loadFullEvents(); }}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="bg-slate-800/60 rounded-lg p-3 border border-slate-700">
              <p className="text-[10px] text-slate-500 uppercase">Total Events</p>
              <p className="text-2xl font-bold text-white">{totalEvents}</p>
            </div>
            <div className="bg-slate-800/60 rounded-lg p-3 border border-slate-700">
              <p className="text-[10px] text-slate-500 uppercase">Avg Confidence</p>
              <p className={`text-2xl font-bold ${avgConfidence >= 80 ? 'text-green-400' : avgConfidence >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                {avgConfidence ? `${avgConfidence}%` : '—'}
              </p>
            </div>
            <div className="bg-slate-800/60 rounded-lg p-3 border border-slate-700">
              <p className="text-[10px] text-slate-500 uppercase">Low Risk</p>
              <p className="text-2xl font-bold text-green-400">{lowRisk}</p>
            </div>
            <div className="bg-slate-800/60 rounded-lg p-3 border border-slate-700">
              <p className="text-[10px] text-slate-500 uppercase">High/Critical</p>
              <p className="text-2xl font-bold text-red-400">{highRisk}</p>
            </div>
            <div className="bg-slate-800/60 rounded-lg p-3 border border-slate-700">
              <p className="text-[10px] text-slate-500 uppercase">Chain Integrity</p>
              <p className={`text-2xl font-bold ${chainIntegrity?.valid ? 'text-green-400' : 'text-red-400'}`}>
                {chainIntegrity?.valid ? 'VALID' : 'BROKEN'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <Card className="bg-slate-900 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-white flex items-center gap-2">
                <Activity className="h-4 w-4 text-blue-400" />
                Signal Stack Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {Object.entries(SIGNAL_LABELS).map(([key, label]) => {
                  const SignalIcon = SIGNAL_ICONS[key] || Radio;
                  const data = signalSummary[key] || { pass: 0, fail: 0, warning: 0, unknown: 0 };
                  const total = data.pass + data.fail + data.warning + data.unknown;
                  const passRate = total > 0 ? Math.round((data.pass / total) * 100) : 0;
                  return (
                    <div key={key} className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
                      <div className="flex items-center gap-2 mb-2">
                        <SignalIcon className="h-4 w-4 text-blue-400" />
                        <span className="text-xs font-medium text-white">{label}</span>
                      </div>
                      <Progress value={passRate} className="h-1.5 mb-1" />
                      <div className="flex justify-between text-[10px]">
                        <span className="text-green-400">{data.pass} pass</span>
                        <span className="text-red-400">{data.fail} fail</span>
                        <span className="text-amber-400">{data.warning} warn</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-700">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base text-white flex items-center gap-2">
                  <Target className="h-4 w-4 text-blue-400" />
                  Verification Events
                </CardTitle>
                <Badge variant="outline" className="text-slate-400 border-slate-600">{events.length} events</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 max-h-[500px] overflow-y-auto">
              {events.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">No verification events yet. Click "Simulate Events" to generate sample data.</p>
              ) : (
                events.map((event: any) => {
                  const isExpanded = expandedEvent === event.id;
                  const score = parseFloat(event.confidence_score || event.score_confidence || '0');
                  const risk = event.risk_level || event.score_risk || 'unknown';
                  const breakdown = event.signal_breakdown || [];
                  const anomalies = event.anomalies || [];
                  return (
                    <div key={event.id} className={`border rounded-lg transition-all ${getRiskColor(risk)}`}>
                      <div className="flex items-center gap-3 p-3 cursor-pointer" onClick={() => setExpandedEvent(isExpanded ? null : event.id)}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${getRiskColor(risk)}`}>
                          <span className="text-sm font-bold">{score}%</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-white">{EVENT_TYPE_LABELS[event.event_type] || event.event_type}</p>
                            <Badge className={`text-[9px] ${getRiskColor(risk)}`}>{risk.toUpperCase()}</Badge>
                          </div>
                          <p className="text-xs text-slate-400 truncate">
                            {event.crew_member_name || 'Unknown'} — {event.job_id || 'No job'} — {new Date(event.created_at).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          {Array.isArray(breakdown) && breakdown.map((s: any, i: number) => {
                            const SIcon = getStatusIcon(s.status);
                            return <SIcon key={i} className={`h-3.5 w-3.5 ${s.status === 'pass' ? 'text-green-400' : s.status === 'fail' ? 'text-red-400' : s.status === 'warning' ? 'text-amber-400' : 'text-slate-500'}`} />;
                          })}
                        </div>
                        {isExpanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                      </div>
                      {isExpanded && (
                        <div className="px-3 pb-3 space-y-3 border-t border-slate-700/50">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3">
                            {Array.isArray(breakdown) && breakdown.map((signal: any, i: number) => {
                              const SIcon = SIGNAL_ICONS[signal.type] || Radio;
                              const StatusIcon = getStatusIcon(signal.status);
                              return (
                                <div key={i} className={`flex items-start gap-2 p-2 rounded border ${getStatusColor(signal.status)}`}>
                                  <SIcon className="h-4 w-4 mt-0.5 shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1">
                                      <span className="text-xs font-medium">{SIGNAL_LABELS[signal.type] || signal.type}</span>
                                      <StatusIcon className="h-3 w-3" />
                                      <span className="text-[9px] text-slate-500">w:{signal.weight}</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 mt-0.5">{signal.evidence}</p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          {anomalies.length > 0 && (
                            <div className="bg-red-500/5 border border-red-500/20 rounded p-2">
                              <p className="text-xs font-medium text-red-400 mb-1 flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3" /> Anomalies Detected ({anomalies.length})
                              </p>
                              {anomalies.map((a: string, i: number) => (
                                <p key={i} className="text-[10px] text-red-300/80">{a}</p>
                              ))}
                            </div>
                          )}
                          {event.ai_reasoning && (
                            <div className="bg-blue-500/5 border border-blue-500/20 rounded p-2">
                              <p className="text-xs font-medium text-blue-400 mb-1 flex items-center gap-1">
                                <Brain className="h-3 w-3" /> AI Analysis
                              </p>
                              <p className="text-[10px] text-slate-400">{event.ai_reasoning}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="bg-slate-900 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-white flex items-center gap-2">
                <Shield className="h-4 w-4 text-green-400" />
                Real-Time Compliance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {complianceScopes.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-3">No compliance scopes tracked yet</p>
              ) : (
                complianceScopes.map((scope: any) => {
                  const score = parseFloat(scope.overall_score || '0');
                  const statusColor = scope.status === 'compliant' ? 'text-green-400' : scope.status === 'warning' ? 'text-amber-400' : 'text-red-400';
                  return (
                    <div key={scope.id} className="border border-slate-700 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-white">{scope.scope_name || scope.scope_id}</span>
                        <Badge variant="outline" className={statusColor}>
                          {scope.status?.toUpperCase()}
                        </Badge>
                      </div>
                      <Progress value={score} className="h-1.5 mb-1" />
                      <div className="flex justify-between text-[10px] text-slate-400">
                        <span>{score}% compliant</span>
                        <span>{scope.total_events || 0} events</span>
                      </div>
                      <div className="flex gap-2 mt-1 text-[10px]">
                        <span className="text-green-400">{scope.passed_events || 0} passed</span>
                        <span className="text-red-400">{scope.failed_events || 0} failed</span>
                      </div>
                      {Array.isArray(scope.alerts) && scope.alerts.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {scope.alerts.slice(0, 3).map((alert: string, i: number) => (
                            <p key={i} className="text-[9px] text-amber-400 truncate">{alert}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-700">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base text-white flex items-center gap-2">
                  <Lock className="h-4 w-4 text-purple-400" />
                  Immutable Audit Chain
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setShowAuditChain(!showAuditChain)}>
                  <Eye className="h-3 w-3 mr-1" />
                  {showAuditChain ? 'Hide' : 'View'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className={`flex items-center gap-2 p-2 rounded border ${chainIntegrity?.valid ? 'border-green-500/20 bg-green-500/5' : 'border-red-500/20 bg-red-500/5'}`}>
                {chainIntegrity?.valid ? (
                  <CheckCircle2 className="h-5 w-5 text-green-400" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-400" />
                )}
                <div>
                  <p className={`text-xs font-medium ${chainIntegrity?.valid ? 'text-green-400' : 'text-red-400'}`}>
                    {chainIntegrity?.valid ? 'Chain Integrity Verified' : 'Chain Integrity Broken'}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    {chainIntegrity?.totalChecked || 0} entries verified — hash-chained, tamper-proof
                  </p>
                </div>
              </div>

              {showAuditChain && (
                <div className="mt-3 space-y-1 max-h-[300px] overflow-y-auto">
                  {auditChain.map((entry: any) => (
                    <div key={entry.id} className="flex items-start gap-2 p-2 bg-slate-800/50 rounded border border-slate-700/50">
                      <Link2 className="h-3 w-3 text-purple-400 mt-1 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] font-medium text-white">{entry.action}</span>
                          <span className="text-[9px] text-slate-500">#{entry.entity_id}</span>
                        </div>
                        <p className="text-[9px] text-slate-400">{entry.actor} ({entry.actor_role})</p>
                        <p className="text-[8px] text-purple-400/60 font-mono truncate" title={entry.chain_hash}>
                          {entry.chain_hash?.substring(0, 24)}...
                        </p>
                      </div>
                      <span className="text-[9px] text-slate-500 shrink-0">
                        {new Date(entry.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-white flex items-center gap-2">
                <Brain className="h-4 w-4 text-cyan-400" />
                Verification Philosophy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[
                  { icon: MapPin, label: 'GPS Location', desc: 'One signal — not the only signal' },
                  { icon: Camera, label: 'Photo EXIF', desc: 'Embedded GPS + timestamps from camera' },
                  { icon: Clock, label: 'Time Analysis', desc: 'Work hours, travel time, patterns' },
                  { icon: Cloud, label: 'Weather Correlation', desc: 'Conditions match reported work' },
                  { icon: Users, label: 'Crew Sign-In', desc: 'Cross-referenced with roster' },
                  { icon: Truck, label: 'Load Tickets', desc: 'Chain of custody validation' },
                  { icon: Smartphone, label: 'Device ID', desc: 'Known vs unknown device tracking' },
                  { icon: Brain, label: 'AI Scoring', desc: 'Weighted confidence per event' },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-2 p-1.5">
                    <item.icon className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                    <div>
                      <p className="text-[10px] font-medium text-white">{item.label}</p>
                      <p className="text-[9px] text-slate-500">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={showNewEvent} onOpenChange={setShowNewEvent}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Plus className="h-5 w-5 text-blue-400" />
              New Field Verification Event
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-slate-400 text-xs">Event Type</Label>
              <Select value={newEvent.eventType} onValueChange={v => setNewEvent(p => ({ ...p, eventType: v }))}>
                <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                  <SelectValue placeholder="Select event type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="crew_arrival">Crew Arrival</SelectItem>
                  <SelectItem value="work_in_progress">Work In Progress</SelectItem>
                  <SelectItem value="load_departure">Load Departure</SelectItem>
                  <SelectItem value="site_inspection">Site Inspection</SelectItem>
                  <SelectItem value="photo_capture">Photo Capture</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-slate-400 text-xs">Crew Member Name</Label>
                <Input className="bg-slate-800 border-slate-600 text-white" value={newEvent.crewMemberName}
                  onChange={e => setNewEvent(p => ({ ...p, crewMemberName: e.target.value }))} placeholder="e.g., John Smith" />
              </div>
              <div>
                <Label className="text-slate-400 text-xs">Crew ID</Label>
                <Input className="bg-slate-800 border-slate-600 text-white" value={newEvent.crewId}
                  onChange={e => setNewEvent(p => ({ ...p, crewId: e.target.value }))} placeholder="e.g., CREW-A" />
              </div>
            </div>
            <div>
              <Label className="text-slate-400 text-xs">Job ID</Label>
              <Input className="bg-slate-800 border-slate-600 text-white" value={newEvent.jobId}
                onChange={e => setNewEvent(p => ({ ...p, jobId: e.target.value }))} placeholder="e.g., JOB-2025-001" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-slate-400 text-xs">Latitude</Label>
                <Input className="bg-slate-800 border-slate-600 text-white" value={newEvent.locationLat}
                  onChange={e => setNewEvent(p => ({ ...p, locationLat: e.target.value }))} placeholder="30.2672" />
              </div>
              <div>
                <Label className="text-slate-400 text-xs">Longitude</Label>
                <Input className="bg-slate-800 border-slate-600 text-white" value={newEvent.locationLng}
                  onChange={e => setNewEvent(p => ({ ...p, locationLng: e.target.value }))} placeholder="-97.7431" />
              </div>
              <div>
                <Label className="text-slate-400 text-xs">Accuracy (m)</Label>
                <Input className="bg-slate-800 border-slate-600 text-white" value={newEvent.locationAccuracyMeters}
                  onChange={e => setNewEvent(p => ({ ...p, locationAccuracyMeters: e.target.value }))} placeholder="15" />
              </div>
            </div>
            <div>
              <Label className="text-slate-400 text-xs">Notes</Label>
              <Textarea className="bg-slate-800 border-slate-600 text-white" value={newEvent.sourceNotes}
                onChange={e => setNewEvent(p => ({ ...p, sourceNotes: e.target.value }))} placeholder="Field notes..." rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewEvent(false)}>Cancel</Button>
            <Button onClick={handleCreateEvent}>
              <Brain className="h-4 w-4 mr-1" /> Verify & Score
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
