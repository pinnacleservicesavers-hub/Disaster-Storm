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
import { FileText, Plus, Trash2, MapPin, Camera, Clock, CheckCircle2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export interface DailyActivity {
  id: string;
  date: string;
  crew: string;
  foremanName: string;
  location: string;
  gpsCoordinates: string;
  weatherConditions: string;
  startTime: string;
  endTime: string;
  hoursWorked: number;
  workDescription: string;
  treesRemoved: number;
  stumpsGround: number;
  debrisCY: number;
  milesCleared: number;
  hazardsIdentified: string;
  safetyIncidents: string;
  equipmentUsed: string;
  delayReasons: string;
  photosBeforeCount: number;
  photosAfterCount: number;
  percentComplete: number;
  supervisorName: string;
  supervisorSignature: boolean;
  monitorPresent: boolean;
  monitorName: string;
  pwNumber: string;
  incidentNumber: string;
  notes: string;
}

const WEATHER_CONDITIONS = [
  'Clear/Sunny', 'Partly Cloudy', 'Overcast', 'Light Rain',
  'Heavy Rain', 'Thunderstorms', 'Snow/Ice', 'Fog', 'High Winds', 'Extreme Heat'
];

function generateId() { return Math.random().toString(36).substring(2, 11); }

export default function DailyActivityReport({ activities, setActivities, contractPW, contractIncident }: {
  activities: DailyActivity[];
  setActivities: (a: DailyActivity[]) => void;
  contractPW: string;
  contractIncident: string;
}) {
  const { toast } = useToast();
  const [showAdd, setShowAdd] = useState(false);
  const [newAct, setNewAct] = useState<Partial<DailyActivity>>({
    date: new Date().toISOString().split('T')[0],
    startTime: '07:00',
    endTime: '17:00',
    hoursWorked: 10,
    treesRemoved: 0,
    stumpsGround: 0,
    debrisCY: 0,
    milesCleared: 0,
    photosBeforeCount: 0,
    photosAfterCount: 0,
    percentComplete: 0,
    monitorPresent: false,
    supervisorSignature: false,
    pwNumber: contractPW,
    incidentNumber: contractIncident,
  });

  const addActivity = () => {
    if (!newAct.crew || !newAct.workDescription) {
      toast({ title: "Missing fields", description: "Crew and work description required", variant: "destructive" });
      return;
    }
    const act: DailyActivity = {
      id: generateId(),
      date: newAct.date || new Date().toISOString().split('T')[0],
      crew: newAct.crew || '',
      foremanName: newAct.foremanName || '',
      location: newAct.location || '',
      gpsCoordinates: newAct.gpsCoordinates || '',
      weatherConditions: newAct.weatherConditions || '',
      startTime: newAct.startTime || '07:00',
      endTime: newAct.endTime || '17:00',
      hoursWorked: newAct.hoursWorked || 0,
      workDescription: newAct.workDescription || '',
      treesRemoved: newAct.treesRemoved || 0,
      stumpsGround: newAct.stumpsGround || 0,
      debrisCY: newAct.debrisCY || 0,
      milesCleared: newAct.milesCleared || 0,
      hazardsIdentified: newAct.hazardsIdentified || '',
      safetyIncidents: newAct.safetyIncidents || '',
      equipmentUsed: newAct.equipmentUsed || '',
      delayReasons: newAct.delayReasons || '',
      photosBeforeCount: newAct.photosBeforeCount || 0,
      photosAfterCount: newAct.photosAfterCount || 0,
      percentComplete: newAct.percentComplete || 0,
      supervisorName: newAct.supervisorName || '',
      supervisorSignature: false,
      monitorPresent: newAct.monitorPresent || false,
      monitorName: newAct.monitorName || '',
      pwNumber: contractPW,
      incidentNumber: contractIncident,
      notes: newAct.notes || '',
    };
    setActivities([...activities, act]);
    setShowAdd(false);
    toast({ title: "Activity report saved", description: `${act.crew} — ${act.date}` });
  };

  const totalTrees = activities.reduce((s, a) => s + a.treesRemoved, 0);
  const totalCY = activities.reduce((s, a) => s + a.debrisCY, 0);
  const totalMiles = activities.reduce((s, a) => s + a.milesCleared, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <FileText className="h-5 w-5 text-cyan-400" />
            Daily Activity Report (DAR)
          </h3>
          <p className="text-sm text-slate-400">FEMA-required daily work documentation — tracks production, photos, and progress</p>
        </div>
        <Button size="sm" onClick={() => setShowAdd(true)}>
          <Plus className="h-4 w-4 mr-1" /> New Report
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Total Reports', value: activities.length, color: 'text-white' },
          { label: 'Trees Removed', value: totalTrees, color: 'text-green-400' },
          { label: 'Debris (CY)', value: totalCY.toLocaleString(), color: 'text-amber-400' },
          { label: 'Miles Cleared', value: totalMiles.toFixed(1), color: 'text-blue-400' },
          { label: 'Photos Logged', value: activities.reduce((s, a) => s + a.photosBeforeCount + a.photosAfterCount, 0), color: 'text-purple-400' },
        ].map(stat => (
          <Card key={stat.label} className="border-slate-700 bg-slate-800/50">
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-slate-400">{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {activities.length > 0 ? (
        <div className="rounded-lg border border-slate-600 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-700/80 border-b border-slate-600">
                <TableHead className="text-white font-semibold">Date</TableHead>
                <TableHead className="text-white font-semibold">Crew</TableHead>
                <TableHead className="text-white font-semibold">Location</TableHead>
                <TableHead className="text-white font-semibold">Weather</TableHead>
                <TableHead className="text-white font-semibold text-right">Hours</TableHead>
                <TableHead className="text-white font-semibold text-right">Trees</TableHead>
                <TableHead className="text-white font-semibold text-right">CY</TableHead>
                <TableHead className="text-white font-semibold text-right">Miles</TableHead>
                <TableHead className="text-white font-semibold text-center">Photos</TableHead>
                <TableHead className="text-white font-semibold text-center">Monitor</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activities.map((act) => (
                <TableRow key={act.id} className="hover:bg-slate-700/40 border-b border-slate-700">
                  <TableCell className="text-sm text-white">{act.date}</TableCell>
                  <TableCell><Badge className="bg-indigo-600 text-xs">{act.crew}</Badge></TableCell>
                  <TableCell className="text-sm text-slate-200">{act.location || '-'}</TableCell>
                  <TableCell className="text-xs text-slate-300">{act.weatherConditions || '-'}</TableCell>
                  <TableCell className="text-right font-mono text-sm text-blue-300">{act.hoursWorked}</TableCell>
                  <TableCell className="text-right font-mono text-sm text-green-300">{act.treesRemoved}</TableCell>
                  <TableCell className="text-right font-mono text-sm text-amber-300">{act.debrisCY}</TableCell>
                  <TableCell className="text-right font-mono text-sm text-cyan-300">{act.milesCleared}</TableCell>
                  <TableCell className="text-center">
                    <span className="text-xs text-slate-300">{act.photosBeforeCount + act.photosAfterCount}</span>
                  </TableCell>
                  <TableCell className="text-center">
                    {act.monitorPresent ? <CheckCircle2 className="h-4 w-4 text-green-400 mx-auto" /> : <span className="text-xs text-slate-500">No</span>}
                  </TableCell>
                  <TableCell>
                    <Button size="sm" variant="ghost" onClick={() => setActivities(activities.filter(a => a.id !== act.id))}>
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
            <FileText className="h-14 w-14 mx-auto text-slate-500 mb-3" />
            <h3 className="text-lg font-semibold text-white mb-1">No Activity Reports</h3>
            <p className="text-slate-400 mb-4">Create daily activity reports documenting work performed, production metrics, and photos</p>
            <Button onClick={() => setShowAdd(true)}>
              <Plus className="h-4 w-4 mr-1" /> Create First Report
            </Button>
          </CardContent>
        </Card>
      )}

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> Daily Activity Report</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">Date</Label>
                <Input type="date" value={newAct.date} onChange={(e) => setNewAct({ ...newAct, date: e.target.value })} className="h-8 text-sm" />
              </div>
              <div>
                <Label className="text-xs">Crew *</Label>
                <Input value={newAct.crew || ''} onChange={(e) => setNewAct({ ...newAct, crew: e.target.value })} className="h-8 text-sm" placeholder="e.g. Crew 1" />
              </div>
              <div>
                <Label className="text-xs">Foreman</Label>
                <Input value={newAct.foremanName || ''} onChange={(e) => setNewAct({ ...newAct, foremanName: e.target.value })} className="h-8 text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Work Location</Label>
                <Input value={newAct.location || ''} onChange={(e) => setNewAct({ ...newAct, location: e.target.value })} className="h-8 text-sm" />
              </div>
              <div>
                <Label className="text-xs">Weather</Label>
                <Select value={newAct.weatherConditions || ''} onValueChange={(v) => setNewAct({ ...newAct, weatherConditions: v })}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{WEATHER_CONDITIONS.map(w => <SelectItem key={w} value={w}>{w}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">Start Time</Label>
                <Input type="time" value={newAct.startTime} onChange={(e) => setNewAct({ ...newAct, startTime: e.target.value })} className="h-8 text-sm" />
              </div>
              <div>
                <Label className="text-xs">End Time</Label>
                <Input type="time" value={newAct.endTime} onChange={(e) => setNewAct({ ...newAct, endTime: e.target.value })} className="h-8 text-sm" />
              </div>
              <div>
                <Label className="text-xs">Hours Worked</Label>
                <Input type="number" step="0.5" value={newAct.hoursWorked || ''} onChange={(e) => setNewAct({ ...newAct, hoursWorked: parseFloat(e.target.value) || 0 })} className="h-8 text-sm" />
              </div>
            </div>
            <div>
              <Label className="text-xs">Work Description / Activities Performed *</Label>
              <Textarea value={newAct.workDescription || ''} onChange={(e) => setNewAct({ ...newAct, workDescription: e.target.value })} rows={3} className="text-sm" placeholder="Describe all work performed today..." />
            </div>
            <div className="border border-slate-600 rounded-lg p-3 space-y-3">
              <p className="text-xs font-semibold text-green-400">Production Metrics</p>
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <Label className="text-xs">Trees Removed</Label>
                  <Input type="number" value={newAct.treesRemoved || ''} onChange={(e) => setNewAct({ ...newAct, treesRemoved: parseInt(e.target.value) || 0 })} className="h-8 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Stumps Ground</Label>
                  <Input type="number" value={newAct.stumpsGround || ''} onChange={(e) => setNewAct({ ...newAct, stumpsGround: parseInt(e.target.value) || 0 })} className="h-8 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Debris (CY)</Label>
                  <Input type="number" value={newAct.debrisCY || ''} onChange={(e) => setNewAct({ ...newAct, debrisCY: parseInt(e.target.value) || 0 })} className="h-8 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Miles Cleared</Label>
                  <Input type="number" step="0.1" value={newAct.milesCleared || ''} onChange={(e) => setNewAct({ ...newAct, milesCleared: parseFloat(e.target.value) || 0 })} className="h-8 text-sm" />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Before Photos Count</Label>
                <Input type="number" value={newAct.photosBeforeCount || ''} onChange={(e) => setNewAct({ ...newAct, photosBeforeCount: parseInt(e.target.value) || 0 })} className="h-8 text-sm" />
              </div>
              <div>
                <Label className="text-xs">After Photos Count</Label>
                <Input type="number" value={newAct.photosAfterCount || ''} onChange={(e) => setNewAct({ ...newAct, photosAfterCount: parseInt(e.target.value) || 0 })} className="h-8 text-sm" />
              </div>
            </div>
            <div>
              <Label className="text-xs">Equipment Used</Label>
              <Input value={newAct.equipmentUsed || ''} onChange={(e) => setNewAct({ ...newAct, equipmentUsed: e.target.value })} className="h-8 text-sm" placeholder="e.g. Bucket Truck x2, Chipper x1" />
            </div>
            <div>
              <Label className="text-xs text-amber-400">Delays / Standby Reasons</Label>
              <Textarea value={newAct.delayReasons || ''} onChange={(e) => setNewAct({ ...newAct, delayReasons: e.target.value })} rows={2} className="text-sm" placeholder="Leave blank if no delays" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={addActivity}>Save Report</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
