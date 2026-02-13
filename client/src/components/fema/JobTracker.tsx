import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Briefcase, Plus, Trash2, ChevronDown, ChevronUp, DollarSign,
  Users, Truck, Calculator, Upload, FileSpreadsheet, Clock,
  MapPin, Calendar, User, Building2, Save, Copy, Eye, EyeOff
} from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";

export interface LaborRate {
  id: string;
  classification: string;
  stRate: number;
  otRate: number;
  dtRate: number;
}

export interface EquipmentRate {
  id: string;
  equipmentName: string;
  equipmentId: string;
  hourlyRate: number;
}

export interface JobLaborLine {
  id: string;
  classification: string;
  workerName: string;
  stHours: number;
  otHours: number;
  dtHours: number;
  stRate: number;
  otRate: number;
  dtRate: number;
  notes: string;
}

export interface JobEquipmentLine {
  id: string;
  equipmentName: string;
  equipmentId: string;
  hours: number;
  rate: number;
  notes: string;
}

export interface JobEntry {
  id: string;
  jobName: string;
  clientName: string;
  agencyType: string;
  foresterName: string;
  contractNumber: string;
  workLocation: string;
  startDate: string;
  endDate: string;
  jobDate: string;
  notes: string;
  laborLines: JobLaborLine[];
  equipmentLines: JobEquipmentLine[];
  isExpanded: boolean;
}

function generateId() {
  return Math.random().toString(36).substring(2, 11);
}

function formatCurrency(val: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
}

const AGENCY_TYPES = [
  'FEMA Public Assistance',
  'USACE (Army Corps)',
  'HUD CDBG-DR',
  'DOT / FHWA',
  'State Emergency Management',
  'County / Municipal',
  'Private Insurance',
  'Private Contract',
  'Utility Company',
  'Other Government',
];

export default function JobTracker({
  jobs, setJobs, laborRates, equipmentRates, setLaborRates, setEquipmentRates
}: {
  jobs: JobEntry[];
  setJobs: (j: JobEntry[]) => void;
  laborRates: LaborRate[];
  equipmentRates: EquipmentRate[];
  setLaborRates: (r: LaborRate[]) => void;
  setEquipmentRates: (r: EquipmentRate[]) => void;
}) {
  const { toast } = useToast();
  const [showNewJob, setShowNewJob] = useState(false);
  const [showUploadRates, setShowUploadRates] = useState(false);
  const [uploadType, setUploadType] = useState<'labor' | 'equipment'>('labor');
  const [newJob, setNewJob] = useState<Partial<JobEntry>>({
    jobName: '',
    clientName: '',
    agencyType: '',
    foresterName: '',
    contractNumber: '',
    workLocation: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    jobDate: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const createJob = () => {
    if (!newJob.jobName || !newJob.clientName) {
      toast({ title: "Missing fields", description: "Job name and client name are required", variant: "destructive" });
      return;
    }
    const job: JobEntry = {
      id: generateId(),
      jobName: newJob.jobName || '',
      clientName: newJob.clientName || '',
      agencyType: newJob.agencyType || '',
      foresterName: newJob.foresterName || '',
      contractNumber: newJob.contractNumber || '',
      workLocation: newJob.workLocation || '',
      startDate: newJob.startDate || '',
      endDate: newJob.endDate || '',
      jobDate: newJob.jobDate || new Date().toISOString().split('T')[0],
      notes: newJob.notes || '',
      laborLines: [],
      equipmentLines: [],
      isExpanded: true,
    };
    setJobs([job, ...jobs]);
    setShowNewJob(false);
    setNewJob({
      jobName: '', clientName: '', agencyType: '', foresterName: '',
      contractNumber: '', workLocation: '',
      startDate: new Date().toISOString().split('T')[0], endDate: '',
      jobDate: new Date().toISOString().split('T')[0], notes: '',
    });
    toast({ title: "Job created", description: `${job.jobName} for ${job.clientName}` });
  };

  const toggleExpand = (jobId: string) => {
    setJobs(jobs.map(j => j.id === jobId ? { ...j, isExpanded: !j.isExpanded } : j));
  };

  const deleteJob = (jobId: string) => {
    setJobs(jobs.filter(j => j.id !== jobId));
    toast({ title: "Job removed" });
  };

  const addLaborLine = (jobId: string) => {
    setJobs(jobs.map(j => {
      if (j.id !== jobId) return j;
      return {
        ...j,
        laborLines: [...j.laborLines, {
          id: generateId(),
          classification: '',
          workerName: '',
          stHours: 0,
          otHours: 0,
          dtHours: 0,
          stRate: 0,
          otRate: 0,
          dtRate: 0,
          notes: '',
        }],
      };
    }));
  };

  const addEquipmentLine = (jobId: string) => {
    setJobs(jobs.map(j => {
      if (j.id !== jobId) return j;
      return {
        ...j,
        equipmentLines: [...j.equipmentLines, {
          id: generateId(),
          equipmentName: '',
          equipmentId: '',
          hours: 0,
          rate: 0,
          notes: '',
        }],
      };
    }));
  };

  const updateLaborLine = (jobId: string, lineId: string, updates: Partial<JobLaborLine>) => {
    setJobs(jobs.map(j => {
      if (j.id !== jobId) return j;
      return {
        ...j,
        laborLines: j.laborLines.map(l => l.id === lineId ? { ...l, ...updates } : l),
      };
    }));
  };

  const updateEquipmentLine = (jobId: string, lineId: string, updates: Partial<JobEquipmentLine>) => {
    setJobs(jobs.map(j => {
      if (j.id !== jobId) return j;
      return {
        ...j,
        equipmentLines: j.equipmentLines.map(l => l.id === lineId ? { ...l, ...updates } : l),
      };
    }));
  };

  const removeLaborLine = (jobId: string, lineId: string) => {
    setJobs(jobs.map(j => {
      if (j.id !== jobId) return j;
      return { ...j, laborLines: j.laborLines.filter(l => l.id !== lineId) };
    }));
  };

  const removeEquipmentLine = (jobId: string, lineId: string) => {
    setJobs(jobs.map(j => {
      if (j.id !== jobId) return j;
      return { ...j, equipmentLines: j.equipmentLines.filter(l => l.id !== lineId) };
    }));
  };

  const selectClassification = (jobId: string, lineId: string, classification: string) => {
    const rate = laborRates.find(r => r.classification === classification);
    if (rate) {
      updateLaborLine(jobId, lineId, {
        classification,
        stRate: rate.stRate,
        otRate: rate.otRate,
        dtRate: rate.dtRate,
      });
    }
  };

  const selectEquipment = (jobId: string, lineId: string, equipmentId: string) => {
    const equip = equipmentRates.find(e => e.equipmentId === equipmentId);
    if (equip) {
      updateEquipmentLine(jobId, lineId, {
        equipmentName: equip.equipmentName,
        equipmentId: equip.equipmentId,
        rate: equip.hourlyRate,
      });
    }
  };

  const calcLaborLineTotal = (line: JobLaborLine) => {
    return (line.stHours * line.stRate) + (line.otHours * line.otRate) + (line.dtHours * line.dtRate);
  };

  const calcEquipLineTotal = (line: JobEquipmentLine) => {
    return line.hours * line.rate;
  };

  const calcJobTotals = (job: JobEntry) => {
    const laborTotal = job.laborLines.reduce((sum, l) => sum + calcLaborLineTotal(l), 0);
    const equipTotal = job.equipmentLines.reduce((sum, l) => sum + calcEquipLineTotal(l), 0);
    const laborHours = job.laborLines.reduce((sum, l) => sum + l.stHours + l.otHours + l.dtHours, 0);
    const equipHours = job.equipmentLines.reduce((sum, l) => sum + l.hours, 0);
    return { laborTotal, equipTotal, grandTotal: laborTotal + equipTotal, laborHours, equipHours };
  };

  const grandTotals = useMemo(() => {
    let labor = 0, equip = 0, laborHrs = 0, equipHrs = 0;
    jobs.forEach(j => {
      const t = calcJobTotals(j);
      labor += t.laborTotal;
      equip += t.equipTotal;
      laborHrs += t.laborHours;
      equipHrs += t.equipHours;
    });
    return { labor, equip, grand: labor + equip, laborHrs, equipHrs };
  }, [jobs, laborRates, equipmentRates]);

  const handleRateSheetUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      try {
        const lines = text.split('\n').filter(l => l.trim());
        if (lines.length < 2) {
          toast({ title: "Invalid file", description: "File must have a header row and at least one data row", variant: "destructive" });
          return;
        }

        if (uploadType === 'labor') {
          const newRates: LaborRate[] = [];
          for (let i = 1; i < lines.length; i++) {
            const cols = lines[i].split(',').map(c => c.trim().replace(/['"$]/g, ''));
            if (cols.length >= 4) {
              newRates.push({
                id: generateId(),
                classification: cols[0],
                stRate: parseFloat(cols[1]) || 0,
                otRate: parseFloat(cols[2]) || 0,
                dtRate: parseFloat(cols[3]) || 0,
              });
            }
          }
          if (newRates.length > 0) {
            setLaborRates(newRates);
            const updatedJobs = jobs.map(job => ({
              ...job,
              laborLines: job.laborLines.map(line => {
                const matchingRate = newRates.find(r => r.classification === line.classification);
                if (matchingRate) {
                  return { ...line, stRate: matchingRate.stRate, otRate: matchingRate.otRate, dtRate: matchingRate.dtRate };
                }
                return line;
              }),
            }));
            setJobs(updatedJobs);
            toast({ title: "Labor rates updated", description: `${newRates.length} classifications loaded from file` });
          }
        } else {
          const newEquip: EquipmentRate[] = [];
          for (let i = 1; i < lines.length; i++) {
            const cols = lines[i].split(',').map(c => c.trim().replace(/['"$]/g, ''));
            if (cols.length >= 3) {
              newEquip.push({
                id: generateId(),
                equipmentId: cols[0],
                equipmentName: cols[1],
                hourlyRate: parseFloat(cols[2]) || 0,
              });
            }
          }
          if (newEquip.length > 0) {
            setEquipmentRates(newEquip);
            const updatedJobs = jobs.map(job => ({
              ...job,
              equipmentLines: job.equipmentLines.map(line => {
                const matchingEquip = newEquip.find(e => e.equipmentId === line.equipmentId);
                if (matchingEquip) {
                  return { ...line, rate: matchingEquip.hourlyRate, equipmentName: matchingEquip.equipmentName };
                }
                return line;
              }),
            }));
            setJobs(updatedJobs);
            toast({ title: "Equipment rates updated", description: `${newEquip.length} equipment items loaded from file` });
          }
        }
        setShowUploadRates(false);
      } catch (err) {
        toast({ title: "Error reading file", description: "Make sure the file is a valid CSV", variant: "destructive" });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-blue-400" />
            Job Tracker
          </h3>
          <p className="text-sm text-slate-400">Track jobs with labor & equipment — prices auto-populate from your rate sheet</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setShowUploadRates(true)}>
            <Upload className="h-4 w-4 mr-1" /> Upload Rate Sheet
          </Button>
          <Button size="sm" onClick={() => setShowNewJob(true)}>
            <Plus className="h-4 w-4 mr-1" /> New Job
          </Button>
        </div>
      </div>

      {jobs.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Card className="border-slate-700 bg-slate-800/50">
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-slate-400">Total Jobs</p>
              <p className="text-2xl font-bold text-white">{jobs.length}</p>
            </CardContent>
          </Card>
          <Card className="border-slate-700 bg-slate-800/50">
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-slate-400">Labor Hours</p>
              <p className="text-2xl font-bold text-blue-400">{grandTotals.laborHrs.toFixed(1)}</p>
            </CardContent>
          </Card>
          <Card className="border-slate-700 bg-slate-800/50">
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-slate-400">Labor Total</p>
              <p className="text-2xl font-bold text-emerald-400">{formatCurrency(grandTotals.labor)}</p>
            </CardContent>
          </Card>
          <Card className="border-slate-700 bg-slate-800/50">
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-slate-400">Equipment Total</p>
              <p className="text-2xl font-bold text-amber-400">{formatCurrency(grandTotals.equip)}</p>
            </CardContent>
          </Card>
          <Card className="border-slate-700 bg-slate-800/50">
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-slate-400">Grand Total</p>
              <p className="text-2xl font-bold text-green-400">{formatCurrency(grandTotals.grand)}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {jobs.map(job => {
        const totals = calcJobTotals(job);
        return (
          <Card key={job.id} className="border-slate-600 bg-slate-900/50">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1 cursor-pointer" onClick={() => toggleExpand(job.id)}>
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-lg text-white flex items-center gap-2">
                      <Briefcase className="h-5 w-5 text-blue-400" />
                      {job.jobName}
                    </CardTitle>
                    {job.agencyType && (
                      <Badge className="bg-indigo-600 text-xs">{job.agencyType}</Badge>
                    )}
                  </div>
                  <CardDescription className="text-slate-400 mt-1">
                    <span className="inline-flex items-center gap-1 mr-4">
                      <Building2 className="h-3 w-3" /> {job.clientName}
                    </span>
                    {job.foresterName && (
                      <span className="inline-flex items-center gap-1 mr-4">
                        <User className="h-3 w-3" /> Forester: {job.foresterName}
                      </span>
                    )}
                    {job.workLocation && (
                      <span className="inline-flex items-center gap-1 mr-4">
                        <MapPin className="h-3 w-3" /> {job.workLocation}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> {job.jobDate}
                      {job.startDate && job.endDate && ` (${job.startDate} to ${job.endDate})`}
                    </span>
                  </CardDescription>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right mr-2">
                    <p className="text-xs text-slate-400">Job Total</p>
                    <p className="text-xl font-bold text-green-400">{formatCurrency(totals.grandTotal)}</p>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => toggleExpand(job.id)}>
                    {job.isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => deleteJob(job.id)}>
                    <Trash2 className="h-4 w-4 text-red-400" />
                  </Button>
                </div>
              </div>

              {!job.isExpanded && (
                <div className="flex gap-4 mt-2 text-xs text-slate-400">
                  <span>Labor: {job.laborLines.length} lines — {formatCurrency(totals.laborTotal)}</span>
                  <span>Equipment: {job.equipmentLines.length} lines — {formatCurrency(totals.equipTotal)}</span>
                </div>
              )}
            </CardHeader>

            {job.isExpanded && (
              <CardContent className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-white flex items-center gap-2">
                      <Users className="h-4 w-4 text-blue-400" /> Labor
                      <Badge variant="outline" className="text-xs ml-1">{job.laborLines.length} lines</Badge>
                      <span className="text-emerald-400 font-mono text-sm ml-2">{formatCurrency(totals.laborTotal)}</span>
                    </h4>
                    <Button size="sm" variant="outline" onClick={() => addLaborLine(job.id)}>
                      <Plus className="h-3.5 w-3.5 mr-1" /> Add Labor
                    </Button>
                  </div>

                  {job.laborLines.length > 0 ? (
                    <div className="rounded-lg border border-slate-600 overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-slate-700/80 border-b border-slate-600">
                            <TableHead className="font-semibold text-white min-w-[180px]">Job Classification</TableHead>
                            <TableHead className="font-semibold text-white min-w-[140px]">Worker Name</TableHead>
                            <TableHead className="text-right font-semibold text-white w-[80px]">ST Hrs</TableHead>
                            <TableHead className="text-right font-semibold text-white w-[80px]">ST Rate</TableHead>
                            <TableHead className="text-right font-semibold text-white w-[80px]">OT Hrs</TableHead>
                            <TableHead className="text-right font-semibold text-white w-[80px]">OT Rate</TableHead>
                            <TableHead className="text-right font-semibold text-white w-[80px]">DT Hrs</TableHead>
                            <TableHead className="text-right font-semibold text-white w-[80px]">DT Rate</TableHead>
                            <TableHead className="text-right font-semibold text-white w-[100px]">Line Total</TableHead>
                            <TableHead className="w-10"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {job.laborLines.map(line => {
                            const lineTotal = calcLaborLineTotal(line);
                            return (
                              <TableRow key={line.id} className="hover:bg-slate-700/40 border-b border-slate-700">
                                <TableCell>
                                  <Select value={line.classification} onValueChange={(v) => selectClassification(job.id, line.id, v)}>
                                    <SelectTrigger className="h-8 text-xs">
                                      <SelectValue placeholder="Select classification" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {laborRates.map(r => (
                                        <SelectItem key={r.id} value={r.classification}>
                                          {r.classification} — {formatCurrency(r.stRate)}/hr
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </TableCell>
                                <TableCell>
                                  <Input
                                    className="h-8 text-xs"
                                    placeholder="Worker name"
                                    value={line.workerName}
                                    onChange={(e) => updateLaborLine(job.id, line.id, { workerName: e.target.value })}
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    type="number" step="0.5" min="0"
                                    className="h-8 text-xs text-right w-full"
                                    value={line.stHours || ''}
                                    onChange={(e) => updateLaborLine(job.id, line.id, { stHours: parseFloat(e.target.value) || 0 })}
                                    placeholder="0"
                                  />
                                </TableCell>
                                <TableCell className="text-right font-mono text-xs text-emerald-300">
                                  {line.stRate > 0 ? formatCurrency(line.stRate) : '-'}
                                </TableCell>
                                <TableCell>
                                  <Input
                                    type="number" step="0.5" min="0"
                                    className="h-8 text-xs text-right w-full"
                                    value={line.otHours || ''}
                                    onChange={(e) => updateLaborLine(job.id, line.id, { otHours: parseFloat(e.target.value) || 0 })}
                                    placeholder="0"
                                  />
                                </TableCell>
                                <TableCell className="text-right font-mono text-xs text-amber-300">
                                  {line.otRate > 0 ? formatCurrency(line.otRate) : '-'}
                                </TableCell>
                                <TableCell>
                                  <Input
                                    type="number" step="0.5" min="0"
                                    className="h-8 text-xs text-right w-full"
                                    value={line.dtHours || ''}
                                    onChange={(e) => updateLaborLine(job.id, line.id, { dtHours: parseFloat(e.target.value) || 0 })}
                                    placeholder="0"
                                  />
                                </TableCell>
                                <TableCell className="text-right font-mono text-xs text-red-300">
                                  {line.dtRate > 0 ? formatCurrency(line.dtRate) : '-'}
                                </TableCell>
                                <TableCell className="text-right font-mono text-sm font-semibold text-green-400">
                                  {lineTotal > 0 ? formatCurrency(lineTotal) : '-'}
                                </TableCell>
                                <TableCell>
                                  <Button size="sm" variant="ghost" onClick={() => removeLaborLine(job.id, line.id)}>
                                    <Trash2 className="h-3.5 w-3.5 text-red-400" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                          <TableRow className="bg-slate-700/50 font-semibold border-t-2 border-slate-500">
                            <TableCell colSpan={2} className="text-white">
                              <span className="flex items-center gap-2">
                                <Calculator className="h-4 w-4" /> Labor Subtotal
                              </span>
                            </TableCell>
                            <TableCell className="text-right font-mono text-white">
                              {job.laborLines.reduce((s, l) => s + l.stHours, 0).toFixed(1)}
                            </TableCell>
                            <TableCell></TableCell>
                            <TableCell className="text-right font-mono text-amber-300">
                              {job.laborLines.reduce((s, l) => s + l.otHours, 0).toFixed(1)}
                            </TableCell>
                            <TableCell></TableCell>
                            <TableCell className="text-right font-mono text-red-300">
                              {job.laborLines.reduce((s, l) => s + l.dtHours, 0).toFixed(1)}
                            </TableCell>
                            <TableCell></TableCell>
                            <TableCell className="text-right font-mono text-lg text-green-400">
                              {formatCurrency(totals.laborTotal)}
                            </TableCell>
                            <TableCell></TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="border border-dashed border-slate-600 rounded-lg p-6 text-center">
                      <Users className="h-8 w-8 mx-auto text-slate-500 mb-2" />
                      <p className="text-sm text-slate-400 mb-2">No labor lines yet</p>
                      <Button size="sm" variant="outline" onClick={() => addLaborLine(job.id)}>
                        <Plus className="h-3.5 w-3.5 mr-1" /> Add First Labor Line
                      </Button>
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-white flex items-center gap-2">
                      <Truck className="h-4 w-4 text-amber-400" /> Equipment
                      <Badge variant="outline" className="text-xs ml-1">{job.equipmentLines.length} lines</Badge>
                      <span className="text-amber-400 font-mono text-sm ml-2">{formatCurrency(totals.equipTotal)}</span>
                    </h4>
                    <Button size="sm" variant="outline" onClick={() => addEquipmentLine(job.id)}>
                      <Plus className="h-3.5 w-3.5 mr-1" /> Add Equipment
                    </Button>
                  </div>

                  {job.equipmentLines.length > 0 ? (
                    <div className="rounded-lg border border-slate-600 overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-slate-700/80 border-b border-slate-600">
                            <TableHead className="font-semibold text-white min-w-[250px]">Equipment</TableHead>
                            <TableHead className="font-semibold text-white w-[80px]">Equip ID</TableHead>
                            <TableHead className="text-right font-semibold text-white w-[80px]">Hours</TableHead>
                            <TableHead className="text-right font-semibold text-white w-[100px]">Rate/Hr</TableHead>
                            <TableHead className="text-right font-semibold text-white w-[100px]">Line Total</TableHead>
                            <TableHead className="w-10"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {job.equipmentLines.map(line => {
                            const lineTotal = calcEquipLineTotal(line);
                            return (
                              <TableRow key={line.id} className="hover:bg-slate-700/40 border-b border-slate-700">
                                <TableCell>
                                  <Select value={line.equipmentId} onValueChange={(v) => selectEquipment(job.id, line.id, v)}>
                                    <SelectTrigger className="h-8 text-xs">
                                      <SelectValue placeholder="Select equipment" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {equipmentRates.map(e => (
                                        <SelectItem key={e.id} value={e.equipmentId}>
                                          {e.equipmentName} — {formatCurrency(e.hourlyRate)}/hr
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="font-mono text-xs">{line.equipmentId || '—'}</Badge>
                                </TableCell>
                                <TableCell>
                                  <Input
                                    type="number" step="0.5" min="0"
                                    className="h-8 text-xs text-right w-full"
                                    value={line.hours || ''}
                                    onChange={(e) => updateEquipmentLine(job.id, line.id, { hours: parseFloat(e.target.value) || 0 })}
                                    placeholder="0"
                                  />
                                </TableCell>
                                <TableCell className="text-right font-mono text-xs text-emerald-300">
                                  {line.rate > 0 ? formatCurrency(line.rate) : '-'}
                                </TableCell>
                                <TableCell className="text-right font-mono text-sm font-semibold text-green-400">
                                  {lineTotal > 0 ? formatCurrency(lineTotal) : '-'}
                                </TableCell>
                                <TableCell>
                                  <Button size="sm" variant="ghost" onClick={() => removeEquipmentLine(job.id, line.id)}>
                                    <Trash2 className="h-3.5 w-3.5 text-red-400" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                          <TableRow className="bg-slate-700/50 font-semibold border-t-2 border-slate-500">
                            <TableCell colSpan={2} className="text-white">
                              <span className="flex items-center gap-2">
                                <Calculator className="h-4 w-4" /> Equipment Subtotal
                              </span>
                            </TableCell>
                            <TableCell className="text-right font-mono text-white">
                              {job.equipmentLines.reduce((s, l) => s + l.hours, 0).toFixed(1)}
                            </TableCell>
                            <TableCell></TableCell>
                            <TableCell className="text-right font-mono text-lg text-amber-400">
                              {formatCurrency(totals.equipTotal)}
                            </TableCell>
                            <TableCell></TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="border border-dashed border-slate-600 rounded-lg p-6 text-center">
                      <Truck className="h-8 w-8 mx-auto text-slate-500 mb-2" />
                      <p className="text-sm text-slate-400 mb-2">No equipment lines yet</p>
                      <Button size="sm" variant="outline" onClick={() => addEquipmentLine(job.id)}>
                        <Plus className="h-3.5 w-3.5 mr-1" /> Add First Equipment Line
                      </Button>
                    </div>
                  )}
                </div>

                <div className="rounded-lg border-2 border-green-500/30 bg-green-500/5 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-lg font-semibold text-white">Job Total</p>
                      <p className="text-sm text-slate-400">
                        Labor: {formatCurrency(totals.laborTotal)} + Equipment: {formatCurrency(totals.equipTotal)}
                      </p>
                    </div>
                    <p className="text-3xl font-bold text-green-400">{formatCurrency(totals.grandTotal)}</p>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        );
      })}

      {jobs.length === 0 && (
        <Card className="border-dashed border-slate-600">
          <CardContent className="py-16 text-center">
            <Briefcase className="h-14 w-14 mx-auto text-slate-500 mb-3" />
            <h3 className="text-lg font-semibold text-white mb-1">No Jobs Yet</h3>
            <p className="text-slate-400 mb-2">Create a job with all the details — who you're working for, dates, forester name, and more.</p>
            <p className="text-slate-400 mb-4 text-sm">Then add labor classifications and equipment from your rate sheet. Prices fill in automatically.</p>
            <Button onClick={() => setShowNewJob(true)}>
              <Plus className="h-4 w-4 mr-1" /> Create First Job
            </Button>
          </CardContent>
        </Card>
      )}

      <Dialog open={showNewJob} onOpenChange={setShowNewJob}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Briefcase className="h-5 w-5" /> New Job</DialogTitle>
            <DialogDescription>Enter the job details — client, dates, forester, and location</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label className="text-xs font-semibold">Job Name / Description *</Label>
                <Input value={newJob.jobName || ''} onChange={(e) => setNewJob({ ...newJob, jobName: e.target.value })}
                  placeholder="e.g. Storm Debris Removal - Main St" className="h-9" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold">Client / Who We're Working For *</Label>
                <Input value={newJob.clientName || ''} onChange={(e) => setNewJob({ ...newJob, clientName: e.target.value })}
                  placeholder="e.g. City of Richmond" className="h-9" />
              </div>
              <div>
                <Label className="text-xs">Agency / Job Type</Label>
                <Select value={newJob.agencyType || ''} onValueChange={(v) => setNewJob({ ...newJob, agencyType: v })}>
                  <SelectTrigger className="h-9"><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    {AGENCY_TYPES.map(a => (
                      <SelectItem key={a} value={a}>{a}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Forester / Supervisor Name</Label>
                <Input value={newJob.foresterName || ''} onChange={(e) => setNewJob({ ...newJob, foresterName: e.target.value })}
                  placeholder="e.g. John Smith" className="h-9" />
              </div>
              <div>
                <Label className="text-xs">Contract / PO Number</Label>
                <Input value={newJob.contractNumber || ''} onChange={(e) => setNewJob({ ...newJob, contractNumber: e.target.value })}
                  placeholder="e.g. CT-2026-0045" className="h-9" />
              </div>
            </div>
            <div>
              <Label className="text-xs">Work Location</Label>
              <Input value={newJob.workLocation || ''} onChange={(e) => setNewJob({ ...newJob, workLocation: e.target.value })}
                placeholder="e.g. 123 Main St, Richmond, VA 23220" className="h-9" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">Job Date</Label>
                <Input type="date" value={newJob.jobDate || ''} onChange={(e) => setNewJob({ ...newJob, jobDate: e.target.value })} className="h-9" />
              </div>
              <div>
                <Label className="text-xs">Start Date</Label>
                <Input type="date" value={newJob.startDate || ''} onChange={(e) => setNewJob({ ...newJob, startDate: e.target.value })} className="h-9" />
              </div>
              <div>
                <Label className="text-xs">End Date</Label>
                <Input type="date" value={newJob.endDate || ''} onChange={(e) => setNewJob({ ...newJob, endDate: e.target.value })} className="h-9" />
              </div>
            </div>
            <div>
              <Label className="text-xs">Notes</Label>
              <Textarea value={newJob.notes || ''} onChange={(e) => setNewJob({ ...newJob, notes: e.target.value })}
                rows={2} placeholder="Any additional notes about this job..." className="text-sm" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowNewJob(false)}>Cancel</Button>
            <Button onClick={createJob}>
              <Save className="h-4 w-4 mr-1" /> Create Job
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showUploadRates} onOpenChange={setShowUploadRates}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" /> Upload Rate Sheet
            </DialogTitle>
            <DialogDescription>
              Upload a CSV file to update your rates. When prices change, upload the new rate sheet and all existing jobs will be updated automatically.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-semibold mb-2 block">What are you uploading?</Label>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={uploadType === 'labor' ? 'default' : 'outline'}
                  onClick={() => setUploadType('labor')}
                >
                  <Users className="h-4 w-4 mr-1" /> Labor Rates
                </Button>
                <Button
                  size="sm"
                  variant={uploadType === 'equipment' ? 'default' : 'outline'}
                  onClick={() => setUploadType('equipment')}
                >
                  <Truck className="h-4 w-4 mr-1" /> Equipment Rates
                </Button>
              </div>
            </div>

            <div className="rounded-lg bg-slate-800 border border-slate-600 p-4">
              <p className="text-xs font-semibold text-slate-300 mb-2">
                <FileSpreadsheet className="h-3.5 w-3.5 inline mr-1" />
                CSV Format Required:
              </p>
              {uploadType === 'labor' ? (
                <div className="font-mono text-xs text-slate-400 space-y-0.5">
                  <p>Classification, ST Rate, OT Rate, DT Rate</p>
                  <p className="text-slate-500">General Foreman, 79.80, 111.60, 144.00</p>
                  <p className="text-slate-500">Foreman A, 73.80, 96.00, 122.40</p>
                  <p className="text-slate-500">Trimmer A, 61.20, 84.00, 107.40</p>
                </div>
              ) : (
                <div className="font-mono text-xs text-slate-400 space-y-0.5">
                  <p>Equipment ID, Equipment Name, Hourly Rate</p>
                  <p className="text-slate-500">AL270, 4x4 Aerial Lift 70+, 48.00</p>
                  <p className="text-slate-500">SSL, Skid Steer Loader, 67.20</p>
                  <p className="text-slate-500">SG, Stump Grinder, 50.40</p>
                </div>
              )}
            </div>

            <div>
              <Label className="text-sm mb-2 block">Choose CSV File</Label>
              <Input
                type="file"
                accept=".csv,.txt"
                onChange={handleRateSheetUpload}
                className="h-10"
              />
            </div>

            <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3">
              <p className="text-xs text-amber-300">
                <strong>Note:</strong> Uploading a new rate sheet will replace all current {uploadType} rates and automatically update prices on all existing job lines that match.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowUploadRates(false)}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
