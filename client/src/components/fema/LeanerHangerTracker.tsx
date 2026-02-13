import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { TreePine, Plus, Trash2, MapPin, Camera, Upload, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export interface LeanerHangerEntry {
  id: string;
  ticketNumber: string;
  date: string;
  time: string;
  removalContractor: string;
  contractorStaffName: string;
  location: string;
  gpsCoordinates: string;
  disposalSite: string;
  descriptionOfThreat: string;
  threatType: 'leaner' | 'hanger' | 'stump' | 'tree-on-structure' | 'split-tree' | 'uprooted';
  dbh: number;
  heightFt: number;
  species: string;
  structureAffected: string;
  priorityLevel: 'critical' | 'high' | 'medium' | 'low';
  photoBefore: string;
  photoAfter: string;
  photoCount: number;
  monitorName: string;
  monitorVerified: boolean;
  status: 'identified' | 'scheduled' | 'in-progress' | 'completed' | 'verified';
  notes: string;
  pwNumber: string;
}

const THREAT_TYPES = [
  { value: 'leaner', label: 'Leaner (leaning tree threatening structure/ROW)' },
  { value: 'hanger', label: 'Hanger (broken limb hung in canopy)' },
  { value: 'stump', label: 'Stump (requires grinding/removal)' },
  { value: 'tree-on-structure', label: 'Tree on Structure' },
  { value: 'split-tree', label: 'Split Tree (storm-damaged trunk split)' },
  { value: 'uprooted', label: 'Uprooted (root ball exposed)' },
];

const PRIORITY_LEVELS = [
  { value: 'critical', label: 'Critical - Immediate danger', color: 'bg-red-600' },
  { value: 'high', label: 'High - Action within 24hrs', color: 'bg-orange-600' },
  { value: 'medium', label: 'Medium - Schedule removal', color: 'bg-amber-600' },
  { value: 'low', label: 'Low - Monitor & plan', color: 'bg-blue-600' },
];

function generateId() { return Math.random().toString(36).substring(2, 11); }

export default function LeanerHangerTracker({ entries, setEntries, contractPW }: {
  entries: LeanerHangerEntry[];
  setEntries: (e: LeanerHangerEntry[]) => void;
  contractPW: string;
}) {
  const { toast } = useToast();
  const [showAdd, setShowAdd] = useState(false);
  const [newEntry, setNewEntry] = useState<Partial<LeanerHangerEntry>>({
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    threatType: 'leaner',
    priorityLevel: 'medium',
    dbh: 0,
    heightFt: 0,
    photoCount: 0,
    monitorVerified: false,
    status: 'identified',
  });

  const addEntry = () => {
    if (!newEntry.location || !newEntry.descriptionOfThreat) {
      toast({ title: "Missing fields", description: "Location and threat description required", variant: "destructive" });
      return;
    }
    const entry: LeanerHangerEntry = {
      id: generateId(),
      ticketNumber: `LHS-${String(entries.length + 1).padStart(4, '0')}`,
      date: newEntry.date || new Date().toISOString().split('T')[0],
      time: newEntry.time || '',
      removalContractor: newEntry.removalContractor || '',
      contractorStaffName: newEntry.contractorStaffName || '',
      location: newEntry.location || '',
      gpsCoordinates: newEntry.gpsCoordinates || '',
      disposalSite: newEntry.disposalSite || '',
      descriptionOfThreat: newEntry.descriptionOfThreat || '',
      threatType: (newEntry.threatType as any) || 'leaner',
      dbh: newEntry.dbh || 0,
      heightFt: newEntry.heightFt || 0,
      species: newEntry.species || '',
      structureAffected: newEntry.structureAffected || '',
      priorityLevel: (newEntry.priorityLevel as any) || 'medium',
      photoBefore: newEntry.photoBefore || '',
      photoAfter: newEntry.photoAfter || '',
      photoCount: newEntry.photoCount || 0,
      monitorName: newEntry.monitorName || '',
      monitorVerified: false,
      status: 'identified',
      notes: newEntry.notes || '',
      pwNumber: contractPW,
    };
    setEntries([...entries, entry]);
    setShowAdd(false);
    setNewEntry({ date: new Date().toISOString().split('T')[0], time: new Date().toTimeString().slice(0, 5), threatType: 'leaner', priorityLevel: 'medium', dbh: 0, heightFt: 0, photoCount: 0, monitorVerified: false, status: 'identified' });
    toast({ title: "Leaner/Hanger ticket created", description: `${entry.ticketNumber} — ${entry.threatType}` });
  };

  const criticalCount = entries.filter(e => e.priorityLevel === 'critical').length;
  const completedCount = entries.filter(e => e.status === 'completed' || e.status === 'verified').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <TreePine className="h-5 w-5 text-green-400" />
            Leaner / Hanger / Stump Tracker
          </h3>
          <p className="text-sm text-slate-400">VDEM LHS Form #2024-107 — Track hazard trees, leaners, hangers, and stumps with GPS & photos</p>
        </div>
        <Button size="sm" onClick={() => setShowAdd(true)}>
          <Plus className="h-4 w-4 mr-1" /> New Ticket
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Total Tickets', value: entries.length, color: 'text-white' },
          { label: 'Critical', value: criticalCount, color: criticalCount > 0 ? 'text-red-400' : 'text-green-400' },
          { label: 'Completed', value: completedCount, color: 'text-green-400' },
          { label: 'Pending', value: entries.length - completedCount, color: 'text-amber-400' },
          { label: 'Photos', value: entries.reduce((s, e) => s + e.photoCount, 0), color: 'text-blue-400' },
        ].map(stat => (
          <Card key={stat.label} className="border-slate-700 bg-slate-800/50">
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-slate-400">{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {entries.length > 0 ? (
        <div className="rounded-lg border border-slate-600 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-700/80 border-b border-slate-600">
                <TableHead className="text-white font-semibold">Ticket #</TableHead>
                <TableHead className="text-white font-semibold">Date</TableHead>
                <TableHead className="text-white font-semibold">Type</TableHead>
                <TableHead className="text-white font-semibold">Location</TableHead>
                <TableHead className="text-white font-semibold">GPS</TableHead>
                <TableHead className="text-white font-semibold">Threat Description</TableHead>
                <TableHead className="text-white font-semibold text-center">DBH"</TableHead>
                <TableHead className="text-white font-semibold text-center">Priority</TableHead>
                <TableHead className="text-white font-semibold text-center">Photos</TableHead>
                <TableHead className="text-white font-semibold text-center">Status</TableHead>
                <TableHead className="w-16"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map(entry => (
                <TableRow key={entry.id} className={`border-b border-slate-700 ${entry.priorityLevel === 'critical' ? 'bg-red-500/5' : 'hover:bg-slate-700/40'}`}>
                  <TableCell className="font-mono text-sm text-white">{entry.ticketNumber}</TableCell>
                  <TableCell className="text-sm text-slate-200">{entry.date}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs capitalize">{entry.threatType.replace('-', ' ')}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-slate-200 max-w-[150px] truncate">{entry.location}</TableCell>
                  <TableCell className="text-xs text-slate-300">
                    {entry.gpsCoordinates ? <span className="flex items-center gap-1"><MapPin className="h-3 w-3 text-blue-400" />{entry.gpsCoordinates.substring(0, 18)}</span> : '-'}
                  </TableCell>
                  <TableCell className="text-xs text-slate-200 max-w-[180px] truncate">{entry.descriptionOfThreat}</TableCell>
                  <TableCell className="text-center font-mono text-sm text-blue-300">{entry.dbh > 0 ? entry.dbh + '"' : '-'}</TableCell>
                  <TableCell className="text-center">
                    <Badge className={`text-xs ${PRIORITY_LEVELS.find(p => p.value === entry.priorityLevel)?.color || 'bg-slate-600'}`}>
                      {entry.priorityLevel}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    {entry.photoCount > 0 ? (
                      <span className="flex items-center gap-1 justify-center text-xs text-green-400"><Camera className="h-3 w-3" />{entry.photoCount}</span>
                    ) : <span className="text-xs text-slate-500">0</span>}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge className={`text-xs ${
                      entry.status === 'verified' ? 'bg-green-600' :
                      entry.status === 'completed' ? 'bg-blue-600' :
                      entry.status === 'in-progress' ? 'bg-amber-600' :
                      entry.status === 'scheduled' ? 'bg-purple-600' :
                      'bg-slate-600'
                    }`}>{entry.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {entry.status === 'identified' && (
                        <Button size="sm" variant="ghost" className="h-6 text-xs"
                          onClick={() => setEntries(entries.map(e => e.id === entry.id ? { ...e, status: 'completed' } : e))}>
                          <CheckCircle2 className="h-3 w-3 text-green-400" />
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => setEntries(entries.filter(e => e.id !== entry.id))}>
                        <Trash2 className="h-3.5 w-3.5 text-red-400" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <Card className="border-dashed border-slate-600">
          <CardContent className="py-16 text-center">
            <TreePine className="h-14 w-14 mx-auto text-slate-500 mb-3" />
            <h3 className="text-lg font-semibold text-white mb-1">No Leaner/Hanger/Stump Tickets</h3>
            <p className="text-slate-400 mb-4">Track hazard trees with GPS coordinates, threat assessment, and photo documentation per VDEM LHS Form</p>
            <Button onClick={() => setShowAdd(true)}>
              <Plus className="h-4 w-4 mr-1" /> Create First Ticket
            </Button>
          </CardContent>
        </Card>
      )}

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><TreePine className="h-5 w-5 text-green-400" /> Leaner / Hanger / Stump Ticket</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
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
                <Label className="text-xs">Threat Type *</Label>
                <Select value={newEntry.threatType || 'leaner'} onValueChange={(v: any) => setNewEntry({ ...newEntry, threatType: v })}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>{THREAT_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Removal Contractor</Label>
                <Input value={newEntry.removalContractor || ''} onChange={(e) => setNewEntry({ ...newEntry, removalContractor: e.target.value })} className="h-8 text-sm" />
              </div>
              <div>
                <Label className="text-xs">Contractor Staff Name</Label>
                <Input value={newEntry.contractorStaffName || ''} onChange={(e) => setNewEntry({ ...newEntry, contractorStaffName: e.target.value })} className="h-8 text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Location *</Label>
                <Input value={newEntry.location || ''} onChange={(e) => setNewEntry({ ...newEntry, location: e.target.value })} className="h-8 text-sm" placeholder="Street address or cross streets" />
              </div>
              <div>
                <Label className="text-xs">GPS (Decimal Degrees) *</Label>
                <Input value={newEntry.gpsCoordinates || ''} onChange={(e) => setNewEntry({ ...newEntry, gpsCoordinates: e.target.value })} className="h-8 text-sm" placeholder="33.4735, -82.0105" />
              </div>
            </div>
            <div>
              <Label className="text-xs">Description of Threat *</Label>
              <Textarea value={newEntry.descriptionOfThreat || ''} onChange={(e) => setNewEntry({ ...newEntry, descriptionOfThreat: e.target.value })} rows={2} className="text-sm"
                placeholder="e.g. 24&quot; DBH oak leaning 30° over residence, root ball partially exposed, immediate danger" />
            </div>
            <div className="grid grid-cols-4 gap-3">
              <div>
                <Label className="text-xs">DBH (inches)</Label>
                <Input type="number" value={newEntry.dbh || ''} onChange={(e) => setNewEntry({ ...newEntry, dbh: parseInt(e.target.value) || 0 })} className="h-8 text-sm" />
              </div>
              <div>
                <Label className="text-xs">Height (ft)</Label>
                <Input type="number" value={newEntry.heightFt || ''} onChange={(e) => setNewEntry({ ...newEntry, heightFt: parseInt(e.target.value) || 0 })} className="h-8 text-sm" />
              </div>
              <div>
                <Label className="text-xs">Species</Label>
                <Input value={newEntry.species || ''} onChange={(e) => setNewEntry({ ...newEntry, species: e.target.value })} className="h-8 text-sm" placeholder="e.g. Live Oak" />
              </div>
              <div>
                <Label className="text-xs">Priority</Label>
                <Select value={newEntry.priorityLevel || 'medium'} onValueChange={(v: any) => setNewEntry({ ...newEntry, priorityLevel: v })}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>{PRIORITY_LEVELS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Structure Affected</Label>
                <Input value={newEntry.structureAffected || ''} onChange={(e) => setNewEntry({ ...newEntry, structureAffected: e.target.value })} className="h-8 text-sm" placeholder="e.g. Residence, Power line, Fence" />
              </div>
              <div>
                <Label className="text-xs">Disposal Site</Label>
                <Input value={newEntry.disposalSite || ''} onChange={(e) => setNewEntry({ ...newEntry, disposalSite: e.target.value })} className="h-8 text-sm" placeholder="e.g. Augusta DMS" />
              </div>
            </div>

            <div className="border border-slate-600 rounded-lg p-3 space-y-3">
              <p className="text-xs font-semibold text-green-400 flex items-center gap-1"><Camera className="h-3 w-3" /> Photo Documentation</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Before Photo (filename/ref)</Label>
                  <Input value={newEntry.photoBefore || ''} onChange={(e) => setNewEntry({ ...newEntry, photoBefore: e.target.value })} className="h-8 text-sm" placeholder="e.g. IMG_2024_0001.jpg" />
                </div>
                <div>
                  <Label className="text-xs">After Photo (filename/ref)</Label>
                  <Input value={newEntry.photoAfter || ''} onChange={(e) => setNewEntry({ ...newEntry, photoAfter: e.target.value })} className="h-8 text-sm" placeholder="e.g. IMG_2024_0002.jpg" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div>
                  <Label className="text-xs">Total Photos</Label>
                  <Input type="number" value={newEntry.photoCount || ''} onChange={(e) => setNewEntry({ ...newEntry, photoCount: parseInt(e.target.value) || 0 })} className="h-8 w-24 text-sm" />
                </div>
                <Button type="button" variant="outline" size="sm" className="mt-5 h-8">
                  <Upload className="h-3.5 w-3.5 mr-1" /> Upload Photos
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Monitor Name</Label>
                <Input value={newEntry.monitorName || ''} onChange={(e) => setNewEntry({ ...newEntry, monitorName: e.target.value })} className="h-8 text-sm" />
              </div>
              <div>
                <Label className="text-xs">Notes</Label>
                <Input value={newEntry.notes || ''} onChange={(e) => setNewEntry({ ...newEntry, notes: e.target.value })} className="h-8 text-sm" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={addEntry}>Create Ticket</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
