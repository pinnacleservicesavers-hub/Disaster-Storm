import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Shield, CheckCircle2, AlertTriangle, XCircle, FileText, Users, Truck, Clock,
  Target, Brain, Satellite, Zap, Download, Eye, MapPin, Camera, DollarSign, Activity
} from "lucide-react";

interface ComplianceProps {
  hasContract: boolean;
  rosterCount: number;
  timesheetCount: number;
  loadTicketCount: number;
  equipmentLogCount: number;
  signInCount: number;
  monitorVisitCount: number;
  activityReportCount: number;
  truckCertCount: number;
  geofenceCount: number;
  gpsActiveCount: number;
  impossibleTravelFlags: number;
  duplicateFlags: number;
}

interface CheckItem {
  label: string;
  category: string;
  status: 'pass' | 'warn' | 'fail';
  detail: string;
  icon: any;
}

export default function ComplianceDashboard(props: ComplianceProps) {
  const checks: CheckItem[] = [
    {
      label: 'Contract/PW Setup',
      category: 'Documentation',
      status: props.hasContract ? 'pass' : 'fail',
      detail: props.hasContract ? 'FEMA disaster #, PW #, and contract info configured' : 'Missing required FEMA project identifiers — required for all documentation',
      icon: FileText,
    },
    {
      label: 'Crew Roster Complete',
      category: 'Labor',
      status: props.rosterCount >= 3 ? 'pass' : props.rosterCount > 0 ? 'warn' : 'fail',
      detail: `${props.rosterCount} personnel on roster${props.rosterCount < 3 ? ' — minimum 3 recommended per crew' : ''}`,
      icon: Users,
    },
    {
      label: 'Timesheets Filed',
      category: 'Labor',
      status: props.timesheetCount > 0 ? 'pass' : 'fail',
      detail: `${props.timesheetCount} weekly timesheets created${props.timesheetCount === 0 ? ' — FEMA requires weekly Force Account Labor summaries' : ''}`,
      icon: Clock,
    },
    {
      label: 'Daily Sign-In/Out',
      category: 'Labor',
      status: props.signInCount > 0 ? 'pass' : 'warn',
      detail: `${props.signInCount} sign-in records${props.signInCount === 0 ? ' — GPS-verified attendance recommended' : ''}`,
      icon: Users,
    },
    {
      label: 'Load Tickets (Chain of Custody)',
      category: 'Debris',
      status: props.loadTicketCount > 0 ? 'pass' : 'warn',
      detail: `${props.loadTicketCount} load tickets${props.loadTicketCount === 0 ? ' — required for all debris hauling documentation' : ' with GPS chain of custody'}`,
      icon: Truck,
    },
    {
      label: 'Truck Certifications',
      category: 'Debris',
      status: props.truckCertCount > 0 ? 'pass' : 'warn',
      detail: `${props.truckCertCount} trucks certified${props.truckCertCount === 0 ? ' — all hauling trucks must have certified bed measurements' : ''}`,
      icon: Truck,
    },
    {
      label: 'Equipment Log (Force Account)',
      category: 'Equipment',
      status: props.equipmentLogCount > 0 ? 'pass' : 'warn',
      detail: `${props.equipmentLogCount} equipment entries${props.equipmentLogCount === 0 ? ' — FEMA Form FF-104-FY-21-141 required' : ''}`,
      icon: Target,
    },
    {
      label: 'Daily Activity Reports',
      category: 'Documentation',
      status: props.activityReportCount > 0 ? 'pass' : 'warn',
      detail: `${props.activityReportCount} daily reports${props.activityReportCount === 0 ? ' — daily production documentation required' : ''}`,
      icon: FileText,
    },
    {
      label: 'Monitor Visit Log',
      category: 'Oversight',
      status: props.monitorVisitCount > 0 ? 'pass' : 'warn',
      detail: `${props.monitorVisitCount} monitor visits logged${props.monitorVisitCount === 0 ? ' — track all FEMA/OSR site visits' : ''}`,
      icon: Eye,
    },
    {
      label: 'GPS Geofence Zones',
      category: 'GPS',
      status: props.geofenceCount > 0 ? 'pass' : 'warn',
      detail: `${props.geofenceCount} geofence zones configured${props.geofenceCount === 0 ? ' — set up authorized work areas' : ''}`,
      icon: MapPin,
    },
    {
      label: 'GPS Tracking Active',
      category: 'GPS',
      status: props.gpsActiveCount > 0 ? 'pass' : 'warn',
      detail: `${props.gpsActiveCount} entities actively tracked`,
      icon: Satellite,
    },
    {
      label: 'Impossible Travel Detection',
      category: 'Fraud',
      status: props.impossibleTravelFlags === 0 ? 'pass' : 'fail',
      detail: props.impossibleTravelFlags === 0 ? 'No impossible travel anomalies detected' : `${props.impossibleTravelFlags} GPS anomalies flagged — review required`,
      icon: AlertTriangle,
    },
    {
      label: 'Duplicate Worker Detection',
      category: 'Fraud',
      status: props.duplicateFlags === 0 ? 'pass' : 'warn',
      detail: props.duplicateFlags === 0 ? 'No duplicate worker conflicts' : `${props.duplicateFlags} duplicate entries with override explanations`,
      icon: Users,
    },
  ];

  const passCount = checks.filter(c => c.status === 'pass').length;
  const warnCount = checks.filter(c => c.status === 'warn').length;
  const failCount = checks.filter(c => c.status === 'fail').length;
  const score = Math.round((passCount / checks.length) * 100);
  const categories = [...new Set(checks.map(c => c.category))];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-400" />
            FEMA Compliance Dashboard
          </h3>
          <p className="text-sm text-slate-400">Audit readiness scoring, document completeness, and fraud detection status</p>
        </div>
        <Button size="sm">
          <Download className="h-4 w-4 mr-1" /> Export Audit Packet
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className={`border-2 ${score >= 80 ? 'border-green-500/30 bg-green-500/5' : score >= 50 ? 'border-amber-500/30 bg-amber-500/5' : 'border-red-500/30 bg-red-500/5'}`}>
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-xs text-slate-400 mb-1">Audit Readiness Score</p>
            <p className={`text-4xl font-bold ${score >= 80 ? 'text-green-400' : score >= 50 ? 'text-amber-400' : 'text-red-400'}`}>{score}%</p>
            <Progress value={score} className="mt-2 h-2" />
          </CardContent>
        </Card>
        <Card className="border-slate-700 bg-slate-800/50">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="h-4 w-4 text-green-400" />
              <p className="text-xs text-slate-400">Passing</p>
            </div>
            <p className="text-2xl font-bold text-green-400">{passCount} / {checks.length}</p>
          </CardContent>
        </Card>
        <Card className="border-slate-700 bg-slate-800/50">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              <p className="text-xs text-slate-400">Warnings</p>
            </div>
            <p className="text-2xl font-bold text-amber-400">{warnCount}</p>
          </CardContent>
        </Card>
        <Card className="border-slate-700 bg-slate-800/50">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 mb-1">
              <XCircle className="h-4 w-4 text-red-400" />
              <p className="text-xs text-slate-400">Failures</p>
            </div>
            <p className="text-2xl font-bold text-red-400">{failCount}</p>
          </CardContent>
        </Card>
      </div>

      {categories.map(cat => (
        <Card key={cat} className="border-slate-700 bg-slate-800/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-sm">{cat} Compliance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {checks.filter(c => c.category === cat).map(check => (
                <div key={check.label} className={`flex items-center justify-between p-3 rounded-lg border ${
                  check.status === 'pass' ? 'border-green-500/20 bg-green-500/5' :
                  check.status === 'warn' ? 'border-amber-500/20 bg-amber-500/5' :
                  'border-red-500/20 bg-red-500/5'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-full ${
                      check.status === 'pass' ? 'bg-green-500/20' :
                      check.status === 'warn' ? 'bg-amber-500/20' :
                      'bg-red-500/20'
                    }`}>
                      {check.status === 'pass' ? <CheckCircle2 className="h-4 w-4 text-green-400" /> :
                       check.status === 'warn' ? <AlertTriangle className="h-4 w-4 text-amber-400" /> :
                       <XCircle className="h-4 w-4 text-red-400" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{check.label}</p>
                      <p className="text-xs text-slate-400">{check.detail}</p>
                    </div>
                  </div>
                  <Badge className={`text-xs ${
                    check.status === 'pass' ? 'bg-green-600' :
                    check.status === 'warn' ? 'bg-amber-600' :
                    'bg-red-600'
                  }`}>{check.status.toUpperCase()}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      <Card className="border-slate-700 bg-slate-800/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-base flex items-center gap-2">
            <Brain className="h-4 w-4 text-purple-400" />
            FEMA Forms Reference
          </CardTitle>
          <CardDescription className="text-slate-400">Standard forms required by Prime Contractors (AshBritt, Ceres, DRC, CrowderGulf)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { form: 'Force Account Labor Summary', ref: 'FEMA FF-104-FY-21-137', status: props.timesheetCount > 0 },
              { form: 'Force Account Equipment Summary', ref: 'FEMA FF-104-FY-21-141', status: props.equipmentLogCount > 0 },
              { form: 'Load Ticket (Debris Chain of Custody)', ref: 'Prime Contractor Standard', status: props.loadTicketCount > 0 },
              { form: 'Daily Activity Report', ref: 'FEMA PA Documentation', status: props.activityReportCount > 0 },
              { form: 'Daily Crew Sign-In/Out', ref: 'Labor Documentation', status: props.signInCount > 0 },
              { form: 'Monitor Visit Log', ref: 'FEMA Site Monitoring', status: props.monitorVisitCount > 0 },
              { form: 'Truck Certification', ref: 'Debris Hauling Requirement', status: props.truckCertCount > 0 },
              { form: 'Equipment Rate Sheet', ref: 'Contract Rate Schedule', status: true },
              { form: 'Crew Roster', ref: 'Force Account Personnel', status: props.rosterCount > 0 },
              { form: 'GPS Geofence Verification', ref: 'Work Zone Compliance', status: props.geofenceCount > 0 },
              { form: 'Fringe Benefit Calculator', ref: 'Labor Overhead', status: true },
              { form: 'Invoice / Payment Application', ref: 'Contract Billing', status: props.timesheetCount > 0 },
            ].map(item => (
              <div key={item.form} className="flex items-center justify-between p-2 rounded border border-slate-600 bg-slate-700/30">
                <div className="flex items-center gap-2">
                  {item.status ? <CheckCircle2 className="h-4 w-4 text-green-400" /> : <XCircle className="h-4 w-4 text-red-400" />}
                  <div>
                    <p className="text-sm text-white">{item.form}</p>
                    <p className="text-[10px] text-slate-500">{item.ref}</p>
                  </div>
                </div>
                <Badge variant="outline" className={`text-xs ${item.status ? 'text-green-400 border-green-600' : 'text-red-400 border-red-600'}`}>
                  {item.status ? 'Active' : 'Missing'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
