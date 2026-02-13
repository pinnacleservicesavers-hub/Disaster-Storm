import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { ShieldAlert, Plus, Trash2, AlertTriangle, CheckCircle2, TrendingUp, Users, Building2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export interface SubcontractorProfile {
  id: string;
  companyName: string;
  contactName: string;
  phone: string;
  email: string;
  ein: string;
  insuranceExpiry: string;
  licensesOnFile: boolean;
  bondedAmount: number;
  pastAuditFindings: number;
  overbillingIncidents: number;
  rateInconsistencies: number;
  overtimeSpikes: number;
  missingDocuments: number;
  safetyViolations: number;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  notes: string;
}

function generateId() { return Math.random().toString(36).substring(2, 11); }

function calculateRisk(sub: Partial<SubcontractorProfile>): { score: number; level: 'low' | 'medium' | 'high' | 'critical' } {
  let score = 100;
  score -= (sub.pastAuditFindings || 0) * 15;
  score -= (sub.overbillingIncidents || 0) * 20;
  score -= (sub.rateInconsistencies || 0) * 10;
  score -= (sub.overtimeSpikes || 0) * 8;
  score -= (sub.missingDocuments || 0) * 5;
  score -= (sub.safetyViolations || 0) * 12;
  if (!sub.licensesOnFile) score -= 15;
  if (sub.insuranceExpiry && new Date(sub.insuranceExpiry) < new Date()) score -= 20;
  score = Math.max(0, Math.min(100, score));
  const level = score >= 80 ? 'low' : score >= 60 ? 'medium' : score >= 40 ? 'high' : 'critical';
  return { score, level };
}

export default function SubcontractorRisk({ subs, setSubs }: {
  subs: SubcontractorProfile[];
  setSubs: (s: SubcontractorProfile[]) => void;
}) {
  const { toast } = useToast();
  const [showAdd, setShowAdd] = useState(false);
  const [newSub, setNewSub] = useState<Partial<SubcontractorProfile>>({
    licensesOnFile: true, bondedAmount: 0, pastAuditFindings: 0, overbillingIncidents: 0,
    rateInconsistencies: 0, overtimeSpikes: 0, missingDocuments: 0, safetyViolations: 0,
  });

  const addSub = () => {
    if (!newSub.companyName) {
      toast({ title: "Missing fields", description: "Company name required", variant: "destructive" });
      return;
    }
    const risk = calculateRisk(newSub);
    const sub: SubcontractorProfile = {
      id: generateId(),
      companyName: newSub.companyName || '',
      contactName: newSub.contactName || '',
      phone: newSub.phone || '',
      email: newSub.email || '',
      ein: newSub.ein || '',
      insuranceExpiry: newSub.insuranceExpiry || '',
      licensesOnFile: newSub.licensesOnFile ?? true,
      bondedAmount: newSub.bondedAmount || 0,
      pastAuditFindings: newSub.pastAuditFindings || 0,
      overbillingIncidents: newSub.overbillingIncidents || 0,
      rateInconsistencies: newSub.rateInconsistencies || 0,
      overtimeSpikes: newSub.overtimeSpikes || 0,
      missingDocuments: newSub.missingDocuments || 0,
      safetyViolations: newSub.safetyViolations || 0,
      riskScore: risk.score,
      riskLevel: risk.level,
      notes: newSub.notes || '',
    };
    setSubs([...subs, sub]);
    setShowAdd(false);
    setNewSub({ licensesOnFile: true, bondedAmount: 0, pastAuditFindings: 0, overbillingIncidents: 0, rateInconsistencies: 0, overtimeSpikes: 0, missingDocuments: 0, safetyViolations: 0 });
    toast({ title: "Subcontractor added", description: `${sub.companyName} — Risk Score: ${sub.riskScore}` });
  };

  const highRisk = subs.filter(s => s.riskLevel === 'high' || s.riskLevel === 'critical').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-red-400" />
            Subcontractor Risk Scoring
          </h3>
          <p className="text-sm text-slate-400">AI risk assessment for subcontractors — 1-100 scoring based on audit history, billing patterns, and compliance</p>
        </div>
        <Button size="sm" onClick={() => setShowAdd(true)}>
          <Plus className="h-4 w-4 mr-1" /> Add Subcontractor
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Subs', value: subs.length, color: 'text-white' },
          { label: 'Low Risk', value: subs.filter(s => s.riskLevel === 'low').length, color: 'text-green-400' },
          { label: 'Medium Risk', value: subs.filter(s => s.riskLevel === 'medium').length, color: 'text-amber-400' },
          { label: 'High/Critical', value: highRisk, color: highRisk > 0 ? 'text-red-400' : 'text-green-400' },
        ].map(stat => (
          <Card key={stat.label} className="border-slate-700 bg-slate-800/50">
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-slate-400">{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {subs.length > 0 ? (
        <div className="space-y-3">
          {subs.map(sub => (
            <Card key={sub.id} className={`border ${
              sub.riskLevel === 'critical' ? 'border-red-500/40 bg-red-500/5' :
              sub.riskLevel === 'high' ? 'border-orange-500/40 bg-orange-500/5' :
              sub.riskLevel === 'medium' ? 'border-amber-500/40 bg-amber-500/5' :
              'border-green-500/30 bg-green-500/5'
            }`}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Building2 className="h-5 w-5 text-slate-400" />
                    <div>
                      <p className="text-base font-semibold text-white">{sub.companyName}</p>
                      <p className="text-xs text-slate-400">{sub.contactName} • {sub.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-xs text-slate-400">Risk Score</p>
                      <p className={`text-2xl font-bold ${
                        sub.riskScore >= 80 ? 'text-green-400' :
                        sub.riskScore >= 60 ? 'text-amber-400' :
                        sub.riskScore >= 40 ? 'text-orange-400' : 'text-red-400'
                      }`}>{sub.riskScore}</p>
                    </div>
                    <Badge className={`text-xs capitalize ${
                      sub.riskLevel === 'low' ? 'bg-green-600' :
                      sub.riskLevel === 'medium' ? 'bg-amber-600' :
                      sub.riskLevel === 'high' ? 'bg-orange-600' : 'bg-red-600'
                    }`}>{sub.riskLevel} risk</Badge>
                    <Button size="sm" variant="ghost" onClick={() => setSubs(subs.filter(s => s.id !== sub.id))}>
                      <Trash2 className="h-3.5 w-3.5 text-red-400" />
                    </Button>
                  </div>
                </div>
                <Progress value={sub.riskScore} className="h-2 mb-3" />
                <div className="grid grid-cols-3 md:grid-cols-6 gap-3 text-center">
                  {[
                    { label: 'Audit Findings', value: sub.pastAuditFindings, bad: sub.pastAuditFindings > 0 },
                    { label: 'Overbilling', value: sub.overbillingIncidents, bad: sub.overbillingIncidents > 0 },
                    { label: 'Rate Issues', value: sub.rateInconsistencies, bad: sub.rateInconsistencies > 0 },
                    { label: 'OT Spikes', value: sub.overtimeSpikes, bad: sub.overtimeSpikes > 0 },
                    { label: 'Missing Docs', value: sub.missingDocuments, bad: sub.missingDocuments > 0 },
                    { label: 'Safety', value: sub.safetyViolations, bad: sub.safetyViolations > 0 },
                  ].map(metric => (
                    <div key={metric.label} className={`p-2 rounded border ${metric.bad ? 'border-red-500/20 bg-red-500/5' : 'border-slate-600 bg-slate-700/30'}`}>
                      <p className="text-[10px] text-slate-400">{metric.label}</p>
                      <p className={`text-lg font-bold ${metric.bad ? 'text-red-400' : 'text-green-400'}`}>{metric.value}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-dashed border-slate-600">
          <CardContent className="py-16 text-center">
            <ShieldAlert className="h-14 w-14 mx-auto text-slate-500 mb-3" />
            <h3 className="text-lg font-semibold text-white mb-1">No Subcontractors Registered</h3>
            <p className="text-slate-400 mb-4">Add subcontractors for AI risk scoring based on audit history, billing patterns, and compliance</p>
            <Button onClick={() => setShowAdd(true)}>
              <Plus className="h-4 w-4 mr-1" /> Add First Subcontractor
            </Button>
          </CardContent>
        </Card>
      )}

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><ShieldAlert className="h-5 w-5" /> Add Subcontractor</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Company Name *</Label>
                <Input value={newSub.companyName || ''} onChange={(e) => setNewSub({ ...newSub, companyName: e.target.value })} className="h-8 text-sm" />
              </div>
              <div>
                <Label className="text-xs">Contact Name</Label>
                <Input value={newSub.contactName || ''} onChange={(e) => setNewSub({ ...newSub, contactName: e.target.value })} className="h-8 text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Phone</Label>
                <Input value={newSub.phone || ''} onChange={(e) => setNewSub({ ...newSub, phone: e.target.value })} className="h-8 text-sm" />
              </div>
              <div>
                <Label className="text-xs">EIN</Label>
                <Input value={newSub.ein || ''} onChange={(e) => setNewSub({ ...newSub, ein: e.target.value })} className="h-8 text-sm" />
              </div>
            </div>
            <div>
              <Label className="text-xs">Insurance Expiry</Label>
              <Input type="date" value={newSub.insuranceExpiry || ''} onChange={(e) => setNewSub({ ...newSub, insuranceExpiry: e.target.value })} className="h-8 text-sm" />
            </div>
            <div className="border border-slate-600 rounded-lg p-3 space-y-3">
              <p className="text-xs font-semibold text-red-400">Risk Factors (enter known issues)</p>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs">Audit Findings</Label>
                  <Input type="number" value={newSub.pastAuditFindings || ''} onChange={(e) => setNewSub({ ...newSub, pastAuditFindings: parseInt(e.target.value) || 0 })} className="h-8 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Overbilling</Label>
                  <Input type="number" value={newSub.overbillingIncidents || ''} onChange={(e) => setNewSub({ ...newSub, overbillingIncidents: parseInt(e.target.value) || 0 })} className="h-8 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Rate Issues</Label>
                  <Input type="number" value={newSub.rateInconsistencies || ''} onChange={(e) => setNewSub({ ...newSub, rateInconsistencies: parseInt(e.target.value) || 0 })} className="h-8 text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs">OT Spikes</Label>
                  <Input type="number" value={newSub.overtimeSpikes || ''} onChange={(e) => setNewSub({ ...newSub, overtimeSpikes: parseInt(e.target.value) || 0 })} className="h-8 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Missing Docs</Label>
                  <Input type="number" value={newSub.missingDocuments || ''} onChange={(e) => setNewSub({ ...newSub, missingDocuments: parseInt(e.target.value) || 0 })} className="h-8 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Safety Violations</Label>
                  <Input type="number" value={newSub.safetyViolations || ''} onChange={(e) => setNewSub({ ...newSub, safetyViolations: parseInt(e.target.value) || 0 })} className="h-8 text-sm" />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={addSub}>Add & Score</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
