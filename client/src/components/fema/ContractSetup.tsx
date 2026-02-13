import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Shield, Building2, FileText, MapPin, Calendar, Save, CheckCircle2, AlertTriangle } from "lucide-react";

export interface ContractInfo {
  primeContractor: string;
  subContractor: string;
  contractNumber: string;
  taskOrder: string;
  femaDisasterNumber: string;
  femaRegion: string;
  projectWorksheetNumber: string;
  incidentNumber: string;
  incidentType: string;
  declarationDate: string;
  declarationTitle: string;
  stateOfEmergency: string;
  county: string;
  workLocation: string;
  scopeOfWork: string;
  contractStartDate: string;
  contractEndDate: string;
  mobilizationDate: string;
  demobilizationDate: string;
  projectManager: string;
  projectManagerPhone: string;
  femaMonitor: string;
  femaMonitorPhone: string;
  osrRepresentative: string;
  osrPhone: string;
  applicantName: string;
  applicantPOC: string;
  applicantPhone: string;
}

const PRIME_CONTRACTORS = [
  'AshBritt Environmental',
  'Ceres Environmental Services',
  'DRC Emergency Services',
  'CrowderGulf',
  'TFR Enterprises',
  'Phillips & Jordan',
  'D&J Enterprises',
  'Grubbs Emergency Services',
  'Custom Tree Care',
  'MBI (Tetra Tech)',
  'Other'
];

const FEMA_REGIONS = [
  'Region I - Boston',
  'Region II - New York',
  'Region III - Philadelphia',
  'Region IV - Atlanta',
  'Region V - Chicago',
  'Region VI - Denton',
  'Region VII - Kansas City',
  'Region VIII - Denver',
  'Region IX - Oakland',
  'Region X - Bothell'
];

const INCIDENT_TYPES = [
  'Hurricane',
  'Ice Storm',
  'Tornado',
  'Severe Storms',
  'Flooding',
  'Wildfire',
  'Winter Storm',
  'Earthquake',
  'Straight-Line Winds',
  'Tropical Storm',
  'Derecho',
  'Other'
];

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS',
  'KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY',
  'NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'
];

export default function ContractSetup({ contractInfo, setContractInfo }: {
  contractInfo: ContractInfo;
  setContractInfo: (info: ContractInfo) => void;
}) {
  const { toast } = useToast();
  const update = (field: keyof ContractInfo, value: string) => {
    setContractInfo({ ...contractInfo, [field]: value });
  };

  const completeness = (() => {
    const required: (keyof ContractInfo)[] = [
      'primeContractor', 'contractNumber', 'femaDisasterNumber', 'projectWorksheetNumber',
      'incidentNumber', 'incidentType', 'stateOfEmergency', 'workLocation', 'scopeOfWork'
    ];
    const filled = required.filter(k => contractInfo[k]?.trim()).length;
    return Math.round((filled / required.length) * 100);
  })();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-400" />
            Contract & Project Setup
          </h3>
          <p className="text-sm text-slate-400">FEMA Public Assistance project identification required for all documentation</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs text-slate-400">Setup Completeness</p>
            <p className={`text-lg font-bold ${completeness === 100 ? 'text-green-400' : completeness > 60 ? 'text-amber-400' : 'text-red-400'}`}>{completeness}%</p>
          </div>
          <Button size="sm" onClick={() => toast({ title: "Contract saved", description: "All contract information has been saved" })}>
            <Save className="h-4 w-4 mr-1" /> Save
          </Button>
        </div>
      </div>

      {completeness < 100 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 flex items-start gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-300">Incomplete Contract Setup</p>
            <p className="text-xs text-amber-400/80">All FEMA documentation requires a valid PW#, Incident#, and Disaster Declaration. Complete the required fields to ensure audit compliance.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-slate-700 bg-slate-800/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-base flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-400" />
              FEMA Project Information
            </CardTitle>
            <CardDescription className="text-slate-400">Official FEMA disaster & project identifiers</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-slate-300">FEMA Disaster # *</Label>
                <Input value={contractInfo.femaDisasterNumber} onChange={(e) => update('femaDisasterNumber', e.target.value)}
                  placeholder="e.g. DR-4799-GA" className="h-8 text-sm" />
              </div>
              <div>
                <Label className="text-xs text-slate-300">FEMA Region</Label>
                <Select value={contractInfo.femaRegion} onValueChange={(v) => update('femaRegion', v)}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select region" /></SelectTrigger>
                  <SelectContent>
                    {FEMA_REGIONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-slate-300">Project Worksheet (PW) # *</Label>
                <Input value={contractInfo.projectWorksheetNumber} onChange={(e) => update('projectWorksheetNumber', e.target.value)}
                  placeholder="e.g. PW-12345" className="h-8 text-sm" />
              </div>
              <div>
                <Label className="text-xs text-slate-300">Incident # *</Label>
                <Input value={contractInfo.incidentNumber} onChange={(e) => update('incidentNumber', e.target.value)}
                  placeholder="e.g. EM-3604" className="h-8 text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-slate-300">Incident Type *</Label>
                <Select value={contractInfo.incidentType} onValueChange={(v) => update('incidentType', v)}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    {INCIDENT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-slate-300">Declaration Date</Label>
                <Input type="date" value={contractInfo.declarationDate} onChange={(e) => update('declarationDate', e.target.value)}
                  className="h-8 text-sm" />
              </div>
            </div>
            <div>
              <Label className="text-xs text-slate-300">Declaration Title</Label>
              <Input value={contractInfo.declarationTitle} onChange={(e) => update('declarationTitle', e.target.value)}
                placeholder="e.g. Severe Ice Storms January 2026" className="h-8 text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-slate-300">State *</Label>
                <Select value={contractInfo.stateOfEmergency} onValueChange={(v) => update('stateOfEmergency', v)}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select state" /></SelectTrigger>
                  <SelectContent>
                    {US_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-slate-300">County</Label>
                <Input value={contractInfo.county} onChange={(e) => update('county', e.target.value)}
                  placeholder="e.g. Richmond County" className="h-8 text-sm" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-700 bg-slate-800/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-base flex items-center gap-2">
              <Building2 className="h-4 w-4 text-green-400" />
              Contract Details
            </CardTitle>
            <CardDescription className="text-slate-400">Prime contractor & subcontractor information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-xs text-slate-300">Prime Contractor *</Label>
              <Select value={contractInfo.primeContractor} onValueChange={(v) => update('primeContractor', v)}>
                <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select prime" /></SelectTrigger>
                <SelectContent>
                  {PRIME_CONTRACTORS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-slate-300">Subcontractor Company</Label>
              <Input value={contractInfo.subContractor} onChange={(e) => update('subContractor', e.target.value)}
                placeholder="e.g. Strategic Land Management" className="h-8 text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-slate-300">Contract # *</Label>
                <Input value={contractInfo.contractNumber} onChange={(e) => update('contractNumber', e.target.value)}
                  placeholder="e.g. AB-2026-0142" className="h-8 text-sm" />
              </div>
              <div>
                <Label className="text-xs text-slate-300">Task Order #</Label>
                <Input value={contractInfo.taskOrder} onChange={(e) => update('taskOrder', e.target.value)}
                  placeholder="e.g. TO-003" className="h-8 text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-slate-300">Contract Start</Label>
                <Input type="date" value={contractInfo.contractStartDate} onChange={(e) => update('contractStartDate', e.target.value)}
                  className="h-8 text-sm" />
              </div>
              <div>
                <Label className="text-xs text-slate-300">Contract End</Label>
                <Input type="date" value={contractInfo.contractEndDate} onChange={(e) => update('contractEndDate', e.target.value)}
                  className="h-8 text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-slate-300">Mobilization Date</Label>
                <Input type="date" value={contractInfo.mobilizationDate} onChange={(e) => update('mobilizationDate', e.target.value)}
                  className="h-8 text-sm" />
              </div>
              <div>
                <Label className="text-xs text-slate-300">Demobilization Date</Label>
                <Input type="date" value={contractInfo.demobilizationDate} onChange={(e) => update('demobilizationDate', e.target.value)}
                  className="h-8 text-sm" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-700 bg-slate-800/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-base flex items-center gap-2">
              <MapPin className="h-4 w-4 text-red-400" />
              Work Location & Scope
            </CardTitle>
            <CardDescription className="text-slate-400">Physical location and authorized scope of work</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-xs text-slate-300">Work Location / Address *</Label>
              <Input value={contractInfo.workLocation} onChange={(e) => update('workLocation', e.target.value)}
                placeholder="e.g. Augusta, GA - Richmond County ROW" className="h-8 text-sm" />
            </div>
            <div>
              <Label className="text-xs text-slate-300">Scope of Work *</Label>
              <Textarea value={contractInfo.scopeOfWork} onChange={(e) => update('scopeOfWork', e.target.value)}
                placeholder="e.g. Emergency vegetation management, hazard tree removal, ROW clearing per FEMA Category A/B guidelines"
                rows={3} className="text-sm" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-700 bg-slate-800/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-base flex items-center gap-2">
              <Shield className="h-4 w-4 text-purple-400" />
              Key Contacts
            </CardTitle>
            <CardDescription className="text-slate-400">Project management & FEMA oversight contacts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-slate-300">Project Manager</Label>
                <Input value={contractInfo.projectManager} onChange={(e) => update('projectManager', e.target.value)}
                  placeholder="Name" className="h-8 text-sm" />
              </div>
              <div>
                <Label className="text-xs text-slate-300">PM Phone</Label>
                <Input value={contractInfo.projectManagerPhone} onChange={(e) => update('projectManagerPhone', e.target.value)}
                  placeholder="Phone" className="h-8 text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-slate-300">FEMA Monitor</Label>
                <Input value={contractInfo.femaMonitor} onChange={(e) => update('femaMonitor', e.target.value)}
                  placeholder="Name" className="h-8 text-sm" />
              </div>
              <div>
                <Label className="text-xs text-slate-300">Monitor Phone</Label>
                <Input value={contractInfo.femaMonitorPhone} onChange={(e) => update('femaMonitorPhone', e.target.value)}
                  placeholder="Phone" className="h-8 text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-slate-300">OSR Representative</Label>
                <Input value={contractInfo.osrRepresentative} onChange={(e) => update('osrRepresentative', e.target.value)}
                  placeholder="Name" className="h-8 text-sm" />
              </div>
              <div>
                <Label className="text-xs text-slate-300">OSR Phone</Label>
                <Input value={contractInfo.osrPhone} onChange={(e) => update('osrPhone', e.target.value)}
                  placeholder="Phone" className="h-8 text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-slate-300">Applicant Name</Label>
                <Input value={contractInfo.applicantName} onChange={(e) => update('applicantName', e.target.value)}
                  placeholder="e.g. Georgia Power" className="h-8 text-sm" />
              </div>
              <div>
                <Label className="text-xs text-slate-300">Applicant POC</Label>
                <Input value={contractInfo.applicantPOC} onChange={(e) => update('applicantPOC', e.target.value)}
                  placeholder="Point of Contact" className="h-8 text-sm" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
