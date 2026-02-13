import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Eye, Plus, Trash2, MapPin, Clock, AlertTriangle, CheckCircle2, FileText } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export interface MonitorLogEntry {
  id: string;
  date: string;
  time: string;
  monitorName: string;
  monitorOrg: string;
  siteLocation: string;
  gpsCoordinates: string;
  visitType: string;
  crewObserved: string;
  workersOnSite: number;
  equipmentOnSite: string;
  workPerformed: string;
  safetyObservations: string;
  issues: string;
  correctiveAction: string;
  photosRequired: boolean;
  photosTaken: number;
  monitorSignature: boolean;
  foremanSignature: boolean;
  rating: 'satisfactory' | 'needs-improvement' | 'unsatisfactory' | 'pending';
  notes: string;
  pwNumber: string;
}

const VISIT_TYPES = [
  'Scheduled Site Visit', 'Unannounced Inspection', 'Safety Audit',
  'Progress Review', 'Quality Control', 'Final Inspection',
  'Load Ticket Verification', 'Equipment Verification', 'Crew Count'
];

const MONITOR_ORGS = [
  'FEMA', 'State Emergency Management', 'OSR (Owners State Rep)',
  'Prime Contractor QA', 'Army Corps of Engineers', 'EPA',
  'County/City Inspector', 'Insurance Adjuster', 'Other'
];

function generateId() { return Math.random().toString(36).substring(2, 11); }

export default function MonitorLog({ entries, setEntries, contractPW }: {
  entries: MonitorLogEntry[];
  setEntries: (e: MonitorLogEntry[]) => void;
  contractPW: string;
}) {
  const { toast } = useToast();
  const [showAdd, setShowAdd] = useState(false);
  const [newEntry, setNewEntry] = useState<Partial<MonitorLogEntry>>({
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    visitType: '',
    monitorOrg: '',
    rating: 'pending',
    photosRequired: false,
    photosTaken: 0,
    workersOnSite: 0,
    monitorSignature: false,
    foremanSignature: false,
  });

  const addEntry = () => {
    if (!newEntry.monitorName || !newEntry.visitType) {
      toast({ title: "Missing fields", description: "Monitor name and visit type required", variant: "destructive" });
      return;
    }
    const entry: MonitorLogEntry = {
      id: generateId(),
      date: newEntry.date || new Date().toISOString().split('T')[0],
      time: newEntry.time || '',
      monitorName: newEntry.monitorName || '',
      monitorOrg: newEntry.monitorOrg || '',
      siteLocation: newEntry.siteLocation || '',
      gpsCoordinates: newEntry.gpsCoordinates || '',
      visitType: newEntry.visitType || '',
      crewObserved: newEntry.crewObserved || '',
      workersOnSite: newEntry.workersOnSite || 0,
      equipmentOnSite: newEntry.equipmentOnSite || '',
      workPerformed: newEntry.workPerformed || '',
      safetyObservations: newEntry.safetyObservations || '',
      issues: newEntry.issues || '',
      correctiveAction: newEntry.correctiveAction || '',
      photosRequired: newEntry.photosRequired || false,
      photosTaken: newEntry.photosTaken || 0,
      monitorSignature: false,
      foremanSignature: false,
      rating: (newEntry.rating as any) || 'pending',
      notes: newEntry.notes || '',
      pwNumber: contractPW,
    };
    setEntries([...entries, entry]);
    setShowAdd(false);
    setNewEntry({ date: new Date().toISOString().split('T')[0], time: new Date().toTimeString().slice(0, 5), visitType: '', monitorOrg: '', rating: 'pending', photosRequired: false, photosTaken: 0, workersOnSite: 0, monitorSignature: false, foremanSignature: false });
    toast({ title: "Monitor log recorded", description: `Visit by ${entry.monitorName} logged` });
  };

  const issueCount = entries.filter(e => e.issues).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Eye className="h-5 w-5 text-purple-400" />
            Monitor Visit Log
          </h3>
          <p className="text-sm text-slate-400">Track all FEMA/OSR/Prime monitor visits, observations, and corrective actions</p>
        </div>
        <Button size="sm" onClick={() => setShowAdd(true)}>
          <Plus className="h-4 w-4 mr-1" /> Log Visit
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-slate-700 bg-slate-800/50">
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-slate-400">Total Visits</p>
            <p className="text-2xl font-bold text-white">{entries.length}</p>
          </CardContent>
        </Card>
        <Card className="border-slate-700 bg-slate-800/50">
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-slate-400">Issues Found</p>
            <p className="text-2xl font-bold text-red-400">{issueCount}</p>
          </CardContent>
        </Card>
        <Card className="border-slate-700 bg-slate-800/50">
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-slate-400">Satisfactory</p>
            <p className="text-2xl font-bold text-green-400">{entries.filter(e => e.rating === 'satisfactory').length}</p>
          </CardContent>
        </Card>
        <Card className="border-slate-700 bg-slate-800/50">
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-slate-400">Pending Review</p>
            <p className="text-2xl font-bold text-amber-400">{entries.filter(e => e.rating === 'pending').length}</p>
          </CardContent>
        </Card>
      </div>

      {entries.length > 0 ? (
        <div className="rounded-lg border border-slate-600 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-700/80 border-b border-slate-600">
                <TableHead className="text-white font-semibold">Date/Time</TableHead>
                <TableHead className="text-white font-semibold">Monitor</TableHead>
                <TableHead className="text-white font-semibold">Organization</TableHead>
                <TableHead className="text-white font-semibold">Visit Type</TableHead>
                <TableHead className="text-white font-semibold">Crew</TableHead>
                <TableHead className="text-white font-semibold text-center">Workers</TableHead>
                <TableHead className="text-white font-semibold">Issues</TableHead>
                <TableHead className="text-white font-semibold text-center">Rating</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry) => (
                <TableRow key={entry.id} className={`hover:bg-slate-700/40 border-b border-slate-700 ${entry.issues ? 'bg-red-500/5' : ''}`}>
                  <TableCell className="text-sm text-white">{entry.date} <span className="text-slate-400">{entry.time}</span></TableCell>
                  <TableCell className="text-sm text-white font-medium">{entry.monitorName}</TableCell>
                  <TableCell><Badge variant="outline" className="text-xs">{entry.monitorOrg}</Badge></TableCell>
                  <TableCell className="text-sm text-slate-200">{entry.visitType}</TableCell>
                  <TableCell className="text-sm text-slate-200">{entry.crewObserved || '-'}</TableCell>
                  <TableCell className="text-center text-sm text-blue-300">{entry.workersOnSite}</TableCell>
                  <TableCell className="text-xs">
                    {entry.issues ? (
                      <span className="text-red-400 flex items-center gap-1"><AlertTriangle className="h-3 w-3" />{entry.issues.substring(0, 30)}...</span>
                    ) : (
                      <span className="text-green-400 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" />None</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge className={`text-xs ${
                      entry.rating === 'satisfactory' ? 'bg-green-600' :
                      entry.rating === 'needs-improvement' ? 'bg-amber-600' :
                      entry.rating === 'unsatisfactory' ? 'bg-red-600' : 'bg-slate-600'
                    }`}>{entry.rating}</Badge>
                  </TableCell>
                  <TableCell>
                    <Button size="sm" variant="ghost" onClick={() => setEntries(entries.filter(e => e.id !== entry.id))}>
                      <Trash2 className="h-3.5 w-3.5 text-red-400" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <Card className="border-dashed border-slate-600">
          <CardContent className="py-16 text-center">
            <Eye className="h-14 w-14 mx-auto text-slate-500 mb-3" />
            <h3 className="text-lg font-semibold text-white mb-1">No Monitor Visits Logged</h3>
            <p className="text-slate-400 mb-4">Record all FEMA, OSR, and prime contractor monitor site visits</p>
            <Button onClick={() => setShowAdd(true)}>
              <Plus className="h-4 w-4 mr-1" /> Log First Visit
            </Button>
          </CardContent>
        </Card>
      )}

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Eye className="h-5 w-5" /> Log Monitor Visit</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">Date</Label>
                <Input type="date" value={newEntry.date} onChange={(e) => setNewEntry({ ...newEntry, date: e.target.value })} className="h-8 text-sm" />
              </div>
              <div>
                <Label className="text-xs">Time</Label>
                <Input type="time" value={newEntry.time} onChange={(e) => setNewEntry({ ...newEntry, time: e.target.value })} className="h-8 text-sm" />
              </div>
              <div>
                <Label className="text-xs">Visit Type *</Label>
                <Select value={newEntry.visitType || ''} onValueChange={(v) => setNewEntry({ ...newEntry, visitType: v })}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{VISIT_TYPES.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Monitor Name *</Label>
                <Input value={newEntry.monitorName || ''} onChange={(e) => setNewEntry({ ...newEntry, monitorName: e.target.value })} className="h-8 text-sm" />
              </div>
              <div>
                <Label className="text-xs">Organization</Label>
                <Select value={newEntry.monitorOrg || ''} onValueChange={(v) => setNewEntry({ ...newEntry, monitorOrg: v })}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{MONITOR_ORGS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Site Location</Label>
                <Input value={newEntry.siteLocation || ''} onChange={(e) => setNewEntry({ ...newEntry, siteLocation: e.target.value })} className="h-8 text-sm" />
              </div>
              <div>
                <Label className="text-xs">GPS Coordinates</Label>
                <Input value={newEntry.gpsCoordinates || ''} onChange={(e) => setNewEntry({ ...newEntry, gpsCoordinates: e.target.value })} className="h-8 text-sm" placeholder="Lat, Lng" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Crew Observed</Label>
                <Input value={newEntry.crewObserved || ''} onChange={(e) => setNewEntry({ ...newEntry, crewObserved: e.target.value })} className="h-8 text-sm" placeholder="e.g. Crew 1, Crew 2" />
              </div>
              <div>
                <Label className="text-xs">Workers On Site</Label>
                <Input type="number" value={newEntry.workersOnSite || ''} onChange={(e) => setNewEntry({ ...newEntry, workersOnSite: parseInt(e.target.value) || 0 })} className="h-8 text-sm" />
              </div>
            </div>
            <div>
              <Label className="text-xs">Work Performed / Observations</Label>
              <Textarea value={newEntry.workPerformed || ''} onChange={(e) => setNewEntry({ ...newEntry, workPerformed: e.target.value })} rows={2} className="text-sm" />
            </div>
            <div>
              <Label className="text-xs">Safety Observations</Label>
              <Textarea value={newEntry.safetyObservations || ''} onChange={(e) => setNewEntry({ ...newEntry, safetyObservations: e.target.value })} rows={2} className="text-sm" placeholder="PPE compliance, hazards, safety issues..." />
            </div>
            <div>
              <Label className="text-xs text-red-400">Issues / Deficiencies Found</Label>
              <Textarea value={newEntry.issues || ''} onChange={(e) => setNewEntry({ ...newEntry, issues: e.target.value })} rows={2} className="text-sm" placeholder="Leave blank if no issues" />
            </div>
            {newEntry.issues && (
              <div>
                <Label className="text-xs text-amber-400">Corrective Action Required</Label>
                <Textarea value={newEntry.correctiveAction || ''} onChange={(e) => setNewEntry({ ...newEntry, correctiveAction: e.target.value })} rows={2} className="text-sm" />
              </div>
            )}
            <div>
              <Label className="text-xs">Rating</Label>
              <Select value={newEntry.rating || 'pending'} onValueChange={(v: any) => setNewEntry({ ...newEntry, rating: v })}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="satisfactory">Satisfactory</SelectItem>
                  <SelectItem value="needs-improvement">Needs Improvement</SelectItem>
                  <SelectItem value="unsatisfactory">Unsatisfactory</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={addEntry}>Log Visit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
