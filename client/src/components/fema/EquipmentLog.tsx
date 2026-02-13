import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Wrench, Plus, Trash2, Calendar, DollarSign } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export interface EquipmentLogEntry {
  id: string;
  date: string;
  equipmentId: string;
  equipmentName: string;
  operatorName: string;
  operatorClassification: string;
  startMeter: number;
  endMeter: number;
  hoursUsed: number;
  hourlyRate: number;
  totalCost: number;
  location: string;
  gpsCoordinates: string;
  fuelUsed: number;
  condition: string;
  notes: string;
  pwNumber: string;
  incidentNumber: string;
}

interface EquipmentRate {
  id: string;
  equipmentName: string;
  equipmentId: string;
  hourlyRate: number;
}

function generateId() { return Math.random().toString(36).substring(2, 11); }
function formatCurrency(val: number) { return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val); }

export default function EquipmentLog({ entries, setEntries, equipmentRates, contractPW, contractIncident }: {
  entries: EquipmentLogEntry[];
  setEntries: (e: EquipmentLogEntry[]) => void;
  equipmentRates: EquipmentRate[];
  contractPW: string;
  contractIncident: string;
}) {
  const { toast } = useToast();
  const [showAdd, setShowAdd] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [newEntry, setNewEntry] = useState<Partial<EquipmentLogEntry>>({
    date: selectedDate,
    startMeter: 0, endMeter: 0, hoursUsed: 0, fuelUsed: 0,
  });

  const addEntry = () => {
    if (!newEntry.equipmentId || !newEntry.operatorName) {
      toast({ title: "Missing fields", description: "Equipment and operator are required", variant: "destructive" });
      return;
    }
    const eqRate = equipmentRates.find(r => r.equipmentId === newEntry.equipmentId);
    const hours = newEntry.hoursUsed || (newEntry.endMeter || 0) - (newEntry.startMeter || 0);
    const rate = eqRate?.hourlyRate || 0;
    const entry: EquipmentLogEntry = {
      id: generateId(),
      date: newEntry.date || selectedDate,
      equipmentId: newEntry.equipmentId || '',
      equipmentName: eqRate?.equipmentName || newEntry.equipmentId || '',
      operatorName: newEntry.operatorName || '',
      operatorClassification: newEntry.operatorClassification || 'Equipment Operator',
      startMeter: newEntry.startMeter || 0,
      endMeter: newEntry.endMeter || 0,
      hoursUsed: hours,
      hourlyRate: rate,
      totalCost: hours * rate,
      location: newEntry.location || '',
      gpsCoordinates: newEntry.gpsCoordinates || '',
      fuelUsed: newEntry.fuelUsed || 0,
      condition: newEntry.condition || 'Good',
      notes: newEntry.notes || '',
      pwNumber: contractPW,
      incidentNumber: contractIncident,
    };
    setEntries([...entries, entry]);
    setShowAdd(false);
    setNewEntry({ date: selectedDate, startMeter: 0, endMeter: 0, hoursUsed: 0, fuelUsed: 0 });
    toast({ title: "Equipment log added", description: `${entry.equipmentName} - ${hours}hrs` });
  };

  const dateEntries = entries.filter(e => e.date === selectedDate);
  const totalHours = entries.reduce((sum, e) => sum + e.hoursUsed, 0);
  const totalCost = entries.reduce((sum, e) => sum + e.totalCost, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Wrench className="h-5 w-5 text-blue-400" />
            Force Account Equipment Summary
          </h3>
          <p className="text-sm text-slate-400">FEMA Form FF-104-FY-21-141 — Daily equipment usage log with meter readings & GPS</p>
        </div>
        <Button size="sm" onClick={() => setShowAdd(true)}>
          <Plus className="h-4 w-4 mr-1" /> Log Equipment
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-slate-700 bg-slate-800/50">
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-slate-400">Total Equipment Entries</p>
            <p className="text-2xl font-bold text-white">{entries.length}</p>
          </CardContent>
        </Card>
        <Card className="border-slate-700 bg-slate-800/50">
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-slate-400">Total Hours</p>
            <p className="text-2xl font-bold text-blue-400">{totalHours.toFixed(1)}</p>
          </CardContent>
        </Card>
        <Card className="border-slate-700 bg-slate-800/50">
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-slate-400">Total Equipment Cost</p>
            <p className="text-2xl font-bold text-emerald-400">{formatCurrency(totalCost)}</p>
          </CardContent>
        </Card>
        <Card className="border-slate-700 bg-slate-800/50">
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-slate-400">Unique Equipment</p>
            <p className="text-2xl font-bold text-purple-400">{new Set(entries.map(e => e.equipmentId)).size}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-3">
        <Label className="text-sm text-white">Filter by Date:</Label>
        <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="h-8 w-48 text-sm" />
        <Badge variant="outline" className="text-slate-300">{dateEntries.length} entries on {selectedDate}</Badge>
      </div>

      {entries.length > 0 ? (
        <div className="rounded-lg border border-slate-600 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-700/80 border-b border-slate-600">
                <TableHead className="text-white font-semibold">Date</TableHead>
                <TableHead className="text-white font-semibold">Equipment ID</TableHead>
                <TableHead className="text-white font-semibold">Equipment</TableHead>
                <TableHead className="text-white font-semibold">Operator</TableHead>
                <TableHead className="text-white font-semibold text-right">Start Meter</TableHead>
                <TableHead className="text-white font-semibold text-right">End Meter</TableHead>
                <TableHead className="text-white font-semibold text-right">Hours</TableHead>
                <TableHead className="text-white font-semibold text-right">Rate/Hr</TableHead>
                <TableHead className="text-white font-semibold text-right">Total</TableHead>
                <TableHead className="text-white font-semibold">Location</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(dateEntries.length > 0 ? dateEntries : entries.slice(0, 20)).map((entry) => (
                <TableRow key={entry.id} className="hover:bg-slate-700/40 border-b border-slate-700">
                  <TableCell className="text-sm text-slate-200">{entry.date}</TableCell>
                  <TableCell><Badge variant="outline" className="font-mono text-xs">{entry.equipmentId}</Badge></TableCell>
                  <TableCell className="text-sm text-white">{entry.equipmentName}</TableCell>
                  <TableCell className="text-sm text-white">{entry.operatorName}</TableCell>
                  <TableCell className="text-right font-mono text-sm text-slate-300">{entry.startMeter}</TableCell>
                  <TableCell className="text-right font-mono text-sm text-slate-300">{entry.endMeter}</TableCell>
                  <TableCell className="text-right font-mono text-sm text-blue-300">{entry.hoursUsed.toFixed(1)}</TableCell>
                  <TableCell className="text-right font-mono text-sm text-amber-300">{formatCurrency(entry.hourlyRate)}</TableCell>
                  <TableCell className="text-right font-mono text-sm font-semibold text-green-400">{formatCurrency(entry.totalCost)}</TableCell>
                  <TableCell className="text-xs text-slate-300">{entry.location || '-'}</TableCell>
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
            <Wrench className="h-14 w-14 mx-auto text-slate-500 mb-3" />
            <h3 className="text-lg font-semibold text-white mb-1">No Equipment Logged</h3>
            <p className="text-slate-400 mb-4">Log daily equipment usage with meter readings, operator info, and GPS location</p>
            <Button onClick={() => setShowAdd(true)}>
              <Plus className="h-4 w-4 mr-1" /> Log First Equipment
            </Button>
          </CardContent>
        </Card>
      )}

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Wrench className="h-5 w-5" /> Log Equipment Usage</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Date</Label>
                <Input type="date" value={newEntry.date || selectedDate} onChange={(e) => setNewEntry({ ...newEntry, date: e.target.value })} className="h-8 text-sm" />
              </div>
              <div>
                <Label className="text-xs">Equipment *</Label>
                <Select value={newEntry.equipmentId || ''} onValueChange={(v) => setNewEntry({ ...newEntry, equipmentId: v })}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select equipment" /></SelectTrigger>
                  <SelectContent>
                    {equipmentRates.map(eq => <SelectItem key={eq.id} value={eq.equipmentId}>{eq.equipmentId} - {eq.equipmentName}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Operator Name *</Label>
                <Input value={newEntry.operatorName || ''} onChange={(e) => setNewEntry({ ...newEntry, operatorName: e.target.value })} className="h-8 text-sm" />
              </div>
              <div>
                <Label className="text-xs">Classification</Label>
                <Input value={newEntry.operatorClassification || 'Equipment Operator'} onChange={(e) => setNewEntry({ ...newEntry, operatorClassification: e.target.value })} className="h-8 text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">Start Meter</Label>
                <Input type="number" value={newEntry.startMeter || ''} onChange={(e) => setNewEntry({ ...newEntry, startMeter: parseFloat(e.target.value) || 0 })} className="h-8 text-sm" />
              </div>
              <div>
                <Label className="text-xs">End Meter</Label>
                <Input type="number" value={newEntry.endMeter || ''} onChange={(e) => setNewEntry({ ...newEntry, endMeter: parseFloat(e.target.value) || 0 })} className="h-8 text-sm" />
              </div>
              <div>
                <Label className="text-xs">Hours Used</Label>
                <Input type="number" step="0.5" value={newEntry.hoursUsed || ''} onChange={(e) => setNewEntry({ ...newEntry, hoursUsed: parseFloat(e.target.value) || 0 })} className="h-8 text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Work Location</Label>
                <Input value={newEntry.location || ''} onChange={(e) => setNewEntry({ ...newEntry, location: e.target.value })} className="h-8 text-sm" placeholder="Location" />
              </div>
              <div>
                <Label className="text-xs">GPS Coordinates</Label>
                <Input value={newEntry.gpsCoordinates || ''} onChange={(e) => setNewEntry({ ...newEntry, gpsCoordinates: e.target.value })} className="h-8 text-sm" placeholder="Lat, Lng" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Fuel Used (gallons)</Label>
                <Input type="number" step="0.1" value={newEntry.fuelUsed || ''} onChange={(e) => setNewEntry({ ...newEntry, fuelUsed: parseFloat(e.target.value) || 0 })} className="h-8 text-sm" />
              </div>
              <div>
                <Label className="text-xs">Condition</Label>
                <Select value={newEntry.condition || 'Good'} onValueChange={(v) => setNewEntry({ ...newEntry, condition: v })}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Good">Good</SelectItem>
                    <SelectItem value="Fair">Fair</SelectItem>
                    <SelectItem value="Needs Repair">Needs Repair</SelectItem>
                    <SelectItem value="Out of Service">Out of Service</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={addEntry}>Log Equipment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
