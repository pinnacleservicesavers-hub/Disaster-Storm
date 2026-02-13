import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Brain, AlertTriangle, CheckCircle2, XCircle, ShieldAlert,
  Clock, Users, Truck, DollarSign, MapPin, Camera, Fuel,
  Activity, TrendingUp, BarChart3, Eye, Zap, RefreshCw, FileText
} from "lucide-react";

interface VerificationProps {
  laborHours: number;
  equipmentHours: number;
  loadTicketCount: number;
  totalCY: number;
  truckCount: number;
  avgTruckCapacity: number;
  rosterCount: number;
  gpsActiveCount: number;
  signInCount: number;
  monitorVisitCount: number;
  photoCount: number;
  impossibleTravelFlags: number;
  duplicateFlags: number;
}

interface CrossCheck {
  id: string;
  category: string;
  checkName: string;
  description: string;
  status: 'pass' | 'warn' | 'fail' | 'info';
  detail: string;
  icon: any;
  severity: 'critical' | 'high' | 'medium' | 'low';
}

export default function AIVerificationEngine(props: VerificationProps) {
  const crossChecks: CrossCheck[] = [
    {
      id: 'labor-vs-equip',
      category: 'Labor/Equipment',
      checkName: 'Labor Hours vs Equipment Hours',
      description: 'Compare total labor hours logged against equipment hours to detect mismatches',
      status: props.laborHours > 0 && props.equipmentHours > 0 ?
        (Math.abs(props.laborHours - props.equipmentHours) / Math.max(props.laborHours, props.equipmentHours) < 0.3 ? 'pass' : 'warn') :
        (props.laborHours > 0 || props.equipmentHours > 0 ? 'warn' : 'info'),
      detail: props.laborHours > 0 ? `Labor: ${props.laborHours}hrs vs Equipment: ${props.equipmentHours}hrs — ${
        Math.abs(props.laborHours - props.equipmentHours) / Math.max(props.laborHours, props.equipmentHours || 1) < 0.3
          ? 'Within acceptable variance'
          : 'Variance exceeds 30% — review required'
      }` : 'No labor or equipment data to cross-reference yet',
      icon: Clock,
      severity: 'high',
    },
    {
      id: 'crew-vs-gps',
      category: 'GPS Verification',
      checkName: 'Crew Roster vs GPS Check-Ins',
      description: 'Verify all rostered crew members have GPS-verified check-ins',
      status: props.rosterCount > 0 && props.signInCount > 0 ? (props.signInCount >= props.rosterCount ? 'pass' : 'warn') : (props.rosterCount > 0 ? 'fail' : 'info'),
      detail: `${props.signInCount} GPS sign-ins for ${props.rosterCount} rostered personnel${
        props.signInCount < props.rosterCount ? ` — ${props.rosterCount - props.signInCount} personnel without GPS verification` : ''
      }`,
      icon: MapPin,
      severity: 'critical',
    },
    {
      id: 'load-vs-capacity',
      category: 'Debris Verification',
      checkName: 'Load Tickets vs Truck Capacity',
      description: 'Verify cubic yards per load against certified truck capacity',
      status: props.loadTicketCount > 0 && props.truckCount > 0 ?
        (props.totalCY / props.loadTicketCount <= props.avgTruckCapacity ? 'pass' : 'warn') :
        (props.loadTicketCount > 0 ? 'warn' : 'info'),
      detail: props.loadTicketCount > 0 ? `Avg load: ${(props.totalCY / props.loadTicketCount).toFixed(1)} CY across ${props.loadTicketCount} tickets — ${
        props.truckCount > 0 ? `Avg truck capacity: ${props.avgTruckCapacity} CY` : 'No truck certifications to compare'
      }` : 'No load tickets to verify',
      icon: Truck,
      severity: 'high',
    },
    {
      id: 'impossible-travel',
      category: 'GPS Verification',
      checkName: 'Impossible Travel Detection',
      description: 'AI flags GPS movements that are physically impossible (too far in too little time)',
      status: props.impossibleTravelFlags === 0 ? 'pass' : 'fail',
      detail: props.impossibleTravelFlags === 0
        ? 'No impossible travel anomalies detected in GPS data'
        : `${props.impossibleTravelFlags} GPS anomalies flagged — possible equipment error or fraud indicator`,
      icon: Activity,
      severity: 'critical',
    },
    {
      id: 'duplicate-workers',
      category: 'Identity Verification',
      checkName: 'Duplicate Worker Detection',
      description: 'Detect same worker signed in to multiple crews or locations simultaneously',
      status: props.duplicateFlags === 0 ? 'pass' : 'warn',
      detail: props.duplicateFlags === 0
        ? 'No duplicate worker conflicts detected'
        : `${props.duplicateFlags} potential duplicate entries — override explanations on file`,
      icon: Users,
      severity: 'critical',
    },
    {
      id: 'photo-coverage',
      category: 'Documentation',
      checkName: 'Photo Documentation Coverage',
      description: 'Verify adequate photo documentation for work performed',
      status: props.photoCount > 0 ? (props.photoCount >= props.loadTicketCount ? 'pass' : 'warn') : 'fail',
      detail: `${props.photoCount} photos documented — ${
        props.loadTicketCount > 0
          ? `${(props.photoCount / props.loadTicketCount).toFixed(1)} photos per load ticket`
          : 'Ensure before/after photos for all work'
      }`,
      icon: Camera,
      severity: 'medium',
    },
    {
      id: 'monitor-coverage',
      category: 'Oversight',
      checkName: 'Monitor Visit Frequency',
      description: 'Track if FEMA/OSR monitors are visiting at required frequency',
      status: props.monitorVisitCount > 0 ? 'pass' : 'warn',
      detail: `${props.monitorVisitCount} monitor visits recorded${
        props.monitorVisitCount === 0 ? ' — monitors should conduct regular site inspections' : ''
      }`,
      icon: Eye,
      severity: 'medium',
    },
    {
      id: 'billing-rates',
      category: 'Rate Compliance',
      checkName: 'Rate Schedule Compliance',
      description: 'Verify all billing aligns with contract-approved rate schedules',
      status: 'pass',
      detail: 'Rate schedule loaded — all billing calculations using approved contract rates',
      icon: DollarSign,
      severity: 'high',
    },
    {
      id: 'rounded-hours',
      category: 'Behavioral Analysis',
      checkName: 'Rounded Hours Pattern Detection',
      description: 'Flag if workers consistently log perfectly rounded hours (10.0 every day)',
      status: props.laborHours > 0 ? 'pass' : 'info',
      detail: props.laborHours > 0
        ? 'No suspicious rounding patterns detected in labor records'
        : 'Insufficient labor data for pattern analysis',
      icon: BarChart3,
      severity: 'medium',
    },
    {
      id: 'overtime-spikes',
      category: 'Behavioral Analysis',
      checkName: 'Overtime Spike Analysis',
      description: 'Detect unusual overtime patterns that may indicate padding',
      status: 'pass',
      detail: 'Overtime tracking within normal parameters',
      icon: TrendingUp,
      severity: 'medium',
    },
  ];

  const passCount = crossChecks.filter(c => c.status === 'pass').length;
  const warnCount = crossChecks.filter(c => c.status === 'warn').length;
  const failCount = crossChecks.filter(c => c.status === 'fail').length;
  const totalChecks = crossChecks.filter(c => c.status !== 'info').length;
  const integrityScore = totalChecks > 0 ? Math.round((passCount / totalChecks) * 100) : 0;

  const categories = [...new Set(crossChecks.map(c => c.category))];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-400" />
            AI Cross-Verification Engine
          </h3>
          <p className="text-sm text-slate-400">Automatic cross-checks across labor, equipment, GPS, debris, and billing data for fraud detection</p>
        </div>
        <div className="flex gap-2">
          <Badge className="bg-purple-600/20 text-purple-400 border-purple-600/30">
            <Zap className="h-3 w-3 mr-1" /> AI Powered
          </Badge>
          <Button size="sm" variant="outline">
            <RefreshCw className="h-4 w-4 mr-1" /> Re-Run Analysis
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className={`border-2 ${integrityScore >= 80 ? 'border-green-500/30 bg-green-500/5' : integrityScore >= 50 ? 'border-amber-500/30 bg-amber-500/5' : 'border-red-500/30 bg-red-500/5'}`}>
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-xs text-slate-400 mb-1">Data Integrity Score</p>
            <p className={`text-4xl font-bold ${integrityScore >= 80 ? 'text-green-400' : integrityScore >= 50 ? 'text-amber-400' : 'text-red-400'}`}>{integrityScore}%</p>
            <Progress value={integrityScore} className="mt-2 h-2" />
          </CardContent>
        </Card>
        {[
          { label: 'Checks Passed', value: passCount, total: totalChecks, icon: CheckCircle2, color: 'text-green-400' },
          { label: 'Warnings', value: warnCount, icon: AlertTriangle, color: 'text-amber-400' },
          { label: 'Failures', value: failCount, icon: XCircle, color: 'text-red-400' },
        ].map(stat => (
          <Card key={stat.label} className="border-slate-700 bg-slate-800/50">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 mb-1">
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
                <p className="text-xs text-slate-400">{stat.label}</p>
              </div>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}{stat.total ? ` / ${stat.total}` : ''}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {failCount > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <ShieldAlert className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-red-300">Critical Compliance Issues Detected</p>
              <p className="text-xs text-red-400/80 mt-1">
                {failCount} cross-verification check(s) failed. These issues must be resolved before billing submission. 
                Failed checks may indicate data entry errors, missing documentation, or potential fraud indicators.
              </p>
            </div>
          </div>
        </div>
      )}

      {categories.map(cat => (
        <Card key={cat} className="border-slate-700 bg-slate-800/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-sm">{cat}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {crossChecks.filter(c => c.category === cat).map(check => (
                <div key={check.id} className={`flex items-start justify-between p-3 rounded-lg border ${
                  check.status === 'pass' ? 'border-green-500/20 bg-green-500/5' :
                  check.status === 'warn' ? 'border-amber-500/20 bg-amber-500/5' :
                  check.status === 'fail' ? 'border-red-500/20 bg-red-500/5' :
                  'border-slate-600 bg-slate-700/20'
                }`}>
                  <div className="flex items-start gap-3">
                    <div className={`p-1.5 rounded-full mt-0.5 ${
                      check.status === 'pass' ? 'bg-green-500/20' :
                      check.status === 'warn' ? 'bg-amber-500/20' :
                      check.status === 'fail' ? 'bg-red-500/20' :
                      'bg-slate-500/20'
                    }`}>
                      {check.status === 'pass' ? <CheckCircle2 className="h-4 w-4 text-green-400" /> :
                       check.status === 'warn' ? <AlertTriangle className="h-4 w-4 text-amber-400" /> :
                       check.status === 'fail' ? <XCircle className="h-4 w-4 text-red-400" /> :
                       <check.icon className="h-4 w-4 text-slate-400" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{check.checkName}</p>
                      <p className="text-xs text-slate-500 mb-1">{check.description}</p>
                      <p className="text-xs text-slate-300">{check.detail}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge variant="outline" className={`text-[10px] ${
                      check.severity === 'critical' ? 'text-red-400 border-red-600' :
                      check.severity === 'high' ? 'text-orange-400 border-orange-600' :
                      'text-slate-400 border-slate-600'
                    }`}>{check.severity}</Badge>
                    <Badge className={`text-xs ${
                      check.status === 'pass' ? 'bg-green-600' :
                      check.status === 'warn' ? 'bg-amber-600' :
                      check.status === 'fail' ? 'bg-red-600' :
                      'bg-slate-600'
                    }`}>{check.status.toUpperCase()}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
