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
import { Truck, MapPin, Plus, Trash2, Eye, Camera, CheckCircle2, AlertTriangle, Navigation } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export interface LoadTicket {
  id: string;
  ticketNumber: string;
  date: string;
  truckNumber: string;
  truckType: string;
  driverName: string;
  debrisType: string;
  loadSize: string;
  cubicYards: number;
  pickupLocation: string;
  pickupGPS: string;
  pickupTime: string;
  dropoffLocation: string;
  dropoffGPS: string;
  dropoffTime: string;
  monitorName: string;
  monitorVerified: boolean;
  monitorSignature: boolean;
  driverSignature: boolean;
  hazmat: boolean;
  notes: string;
  status: 'pending' | 'verified' | 'flagged';
  pwNumber: string;
  incidentNumber: string;
  photos: number;
}

const DEBRIS_TYPES = [
  'Vegetative Debris', 'C&D (Construction & Demolition)', 'Mixed Debris',
  'Hazardous Waste', 'White Goods', 'E-Waste', 'Soil/Mud/Sand',
  'Stumps (24"-36")', 'Stumps (36"-48")', 'Stumps (48"+)',
  'Leaners/Hangers', 'Trees on Structure'
];

const LOAD_SIZES = ['Full Load', '3/4 Load', '1/2 Load', '1/4 Load'];

const TRUCK_TYPES = [
  'Grapple Truck', 'Knuckleboom', 'Self-Loader', 'Dump Truck (10CY)',
  'Dump Truck (15CY)', 'Dump Truck (20CY)', 'Dump Truck (30CY)',
  'Trailer (40CY)', 'Trailer (60CY)', 'Trailer (80CY+)',
  'Roll-Off (20CY)', 'Roll-Off (30CY)', 'Roll-Off (40CY)'
];

function generateId() {
  return Math.random().toString(36).substring(2, 11);
}

export default function LoadTickets({ loadTickets, setLoadTickets, contractPW, contractIncident }: {
  loadTickets: LoadTicket[];
  setLoadTickets: (tickets: LoadTicket[]) => void;
  contractPW: string;
  contractIncident: string;
}) {
  const { toast } = useToast();
  const [showAdd, setShowAdd] = useState(false);
  const [viewTicket, setViewTicket] = useState<LoadTicket | null>(null);
  const [newTicket, setNewTicket] = useState<Partial<LoadTicket>>({
    date: new Date().toISOString().split('T')[0],
    debrisType: '',
    loadSize: 'Full Load',
    cubicYards: 0,
    truckType: '',
    hazmat: false,
    monitorVerified: false,
    status: 'pending',
    pwNumber: contractPW,
    incidentNumber: contractIncident,
  });

  const addTicket = () => {
    if (!newTicket.truckNumber || !newTicket.driverName || !newTicket.debrisType) {
      toast({ title: "Missing fields", description: "Truck #, driver, and debris type are required", variant: "destructive" });
      return;
    }
    const ticket: LoadTicket = {
      id: generateId(),
      ticketNumber: `LT-${String(loadTickets.length + 1).padStart(4, '0')}`,
      date: newTicket.date || new Date().toISOString().split('T')[0],
      truckNumber: newTicket.truckNumber || '',
      truckType: newTicket.truckType || '',
      driverName: newTicket.driverName || '',
      debrisType: newTicket.debrisType || '',
      loadSize: newTicket.loadSize || 'Full Load',
      cubicYards: newTicket.cubicYards || 0,
      pickupLocation: newTicket.pickupLocation || '',
      pickupGPS: newTicket.pickupGPS || '',
      pickupTime: newTicket.pickupTime || '',
      dropoffLocation: newTicket.dropoffLocation || '',
      dropoffGPS: newTicket.dropoffGPS || '',
      dropoffTime: newTicket.dropoffTime || '',
      monitorName: newTicket.monitorName || '',
      monitorVerified: newTicket.monitorVerified || false,
      monitorSignature: false,
      driverSignature: false,
      hazmat: newTicket.hazmat || false,
      notes: newTicket.notes || '',
      status: 'pending',
      pwNumber: contractPW,
      incidentNumber: contractIncident,
      photos: 0,
    };
    setLoadTickets([...loadTickets, ticket]);
    setShowAdd(false);
    setNewTicket({ date: new Date().toISOString().split('T')[0], debrisType: '', loadSize: 'Full Load', cubicYards: 0, truckType: '', hazmat: false, monitorVerified: false, status: 'pending', pwNumber: contractPW, incidentNumber: contractIncident });
    toast({ title: "Load ticket created", description: `Ticket ${ticket.ticketNumber} added` });
  };

  const verifyTicket = (id: string) => {
    setLoadTickets(loadTickets.map(t => t.id === id ? { ...t, status: 'verified', monitorVerified: true } : t));
    toast({ title: "Ticket verified", description: "Monitor verification recorded" });
  };

  const totalCY = loadTickets.reduce((sum, t) => sum + t.cubicYards, 0);
  const verifiedCount = loadTickets.filter(t => t.status === 'verified').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Truck className="h-5 w-5 text-amber-400" />
            Load Tickets — Debris Hauling Chain of Custody
          </h3>
          <p className="text-sm text-slate-400">FEMA-compliant load ticket documentation with GPS tracking & monitor verification</p>
        </div>
        <Button size="sm" onClick={() => setShowAdd(true)}>
          <Plus className="h-4 w-4 mr-1" /> New Load Ticket
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-slate-700 bg-slate-800/50">
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-slate-400">Total Tickets</p>
            <p className="text-2xl font-bold text-white">{loadTickets.length}</p>
          </CardContent>
        </Card>
        <Card className="border-slate-700 bg-slate-800/50">
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-slate-400">Total Cubic Yards</p>
            <p className="text-2xl font-bold text-emerald-400">{totalCY.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="border-slate-700 bg-slate-800/50">
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-slate-400">Monitor Verified</p>
            <p className="text-2xl font-bold text-blue-400">{verifiedCount} / {loadTickets.length}</p>
          </CardContent>
        </Card>
        <Card className="border-slate-700 bg-slate-800/50">
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-slate-400">Avg Load Size</p>
            <p className="text-2xl font-bold text-purple-400">{loadTickets.length > 0 ? (totalCY / loadTickets.length).toFixed(1) : '0'} CY</p>
          </CardContent>
        </Card>
      </div>

      {loadTickets.length > 0 ? (
        <div className="rounded-lg border border-slate-600 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-700/80 border-b border-slate-600">
                <TableHead className="text-white font-semibold">Ticket #</TableHead>
                <TableHead className="text-white font-semibold">Date</TableHead>
                <TableHead className="text-white font-semibold">Truck</TableHead>
                <TableHead className="text-white font-semibold">Driver</TableHead>
                <TableHead className="text-white font-semibold">Debris Type</TableHead>
                <TableHead className="text-white font-semibold text-right">CY</TableHead>
                <TableHead className="text-white font-semibold">Pickup GPS</TableHead>
                <TableHead className="text-white font-semibold">Dropoff GPS</TableHead>
                <TableHead className="text-white font-semibold text-center">Monitor</TableHead>
                <TableHead className="text-white font-semibold text-center">Status</TableHead>
                <TableHead className="text-white w-20">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadTickets.map((ticket) => (
                <TableRow key={ticket.id} className="hover:bg-slate-700/40 border-b border-slate-700">
                  <TableCell className="font-mono text-sm text-white">{ticket.ticketNumber}</TableCell>
                  <TableCell className="text-sm text-slate-200">{ticket.date}</TableCell>
                  <TableCell className="text-sm text-slate-200">{ticket.truckNumber}</TableCell>
                  <TableCell className="text-sm text-white">{ticket.driverName}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">{ticket.debrisType}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono text-emerald-300">{ticket.cubicYards}</TableCell>
                  <TableCell className="text-xs text-slate-300">
                    {ticket.pickupGPS ? (
                      <span className="flex items-center gap-1"><Navigation className="h-3 w-3 text-blue-400" />{ticket.pickupGPS.substring(0, 20)}</span>
                    ) : <span className="text-slate-500">No GPS</span>}
                  </TableCell>
                  <TableCell className="text-xs text-slate-300">
                    {ticket.dropoffGPS ? (
                      <span className="flex items-center gap-1"><Navigation className="h-3 w-3 text-green-400" />{ticket.dropoffGPS.substring(0, 20)}</span>
                    ) : <span className="text-slate-500">No GPS</span>}
                  </TableCell>
                  <TableCell className="text-center">
                    {ticket.monitorVerified ? (
                      <CheckCircle2 className="h-4 w-4 text-green-400 mx-auto" />
                    ) : (
                      <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => verifyTicket(ticket.id)}>Verify</Button>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge className={`text-xs ${ticket.status === 'verified' ? 'bg-green-600' : ticket.status === 'flagged' ? 'bg-red-600' : 'bg-amber-600'}`}>
                      {ticket.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => setViewTicket(ticket)}>
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setLoadTickets(loadTickets.filter(t => t.id !== ticket.id))}>
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
            <Truck className="h-14 w-14 mx-auto text-slate-500 mb-3" />
            <h3 className="text-lg font-semibold text-white mb-1">No Load Tickets</h3>
            <p className="text-slate-400 mb-4">Create load tickets to document debris hauling with GPS chain of custody</p>
            <Button onClick={() => setShowAdd(true)}>
              <Plus className="h-4 w-4 mr-1" /> Create First Load Ticket
            </Button>
          </CardContent>
        </Card>
      )}

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-amber-400" />
              New Load Ticket
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">Date</Label>
                <Input type="date" value={newTicket.date} onChange={(e) => setNewTicket({ ...newTicket, date: e.target.value })} className="h-8 text-sm" />
              </div>
              <div>
                <Label className="text-xs">Truck # *</Label>
                <Input value={newTicket.truckNumber || ''} onChange={(e) => setNewTicket({ ...newTicket, truckNumber: e.target.value })} className="h-8 text-sm" placeholder="e.g. T-105" />
              </div>
              <div>
                <Label className="text-xs">Truck Type</Label>
                <Select value={newTicket.truckType || ''} onValueChange={(v) => setNewTicket({ ...newTicket, truckType: v })}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{TRUCK_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Driver Name *</Label>
                <Input value={newTicket.driverName || ''} onChange={(e) => setNewTicket({ ...newTicket, driverName: e.target.value })} className="h-8 text-sm" />
              </div>
              <div>
                <Label className="text-xs">Monitor Name</Label>
                <Input value={newTicket.monitorName || ''} onChange={(e) => setNewTicket({ ...newTicket, monitorName: e.target.value })} className="h-8 text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">Debris Type *</Label>
                <Select value={newTicket.debrisType || ''} onValueChange={(v) => setNewTicket({ ...newTicket, debrisType: v })}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{DEBRIS_TYPES.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Load Size</Label>
                <Select value={newTicket.loadSize || 'Full Load'} onValueChange={(v) => setNewTicket({ ...newTicket, loadSize: v })}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>{LOAD_SIZES.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Cubic Yards</Label>
                <Input type="number" value={newTicket.cubicYards || ''} onChange={(e) => setNewTicket({ ...newTicket, cubicYards: parseFloat(e.target.value) || 0 })} className="h-8 text-sm" />
              </div>
            </div>
            <div className="border border-slate-600 rounded-lg p-3 space-y-3">
              <p className="text-xs font-semibold text-blue-400 flex items-center gap-1"><MapPin className="h-3 w-3" /> GPS Chain of Custody</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Pickup Location</Label>
                  <Input value={newTicket.pickupLocation || ''} onChange={(e) => setNewTicket({ ...newTicket, pickupLocation: e.target.value })} className="h-8 text-sm" placeholder="Address or description" />
                </div>
                <div>
                  <Label className="text-xs">Pickup GPS Coordinates</Label>
                  <Input value={newTicket.pickupGPS || ''} onChange={(e) => setNewTicket({ ...newTicket, pickupGPS: e.target.value })} className="h-8 text-sm" placeholder="33.4735, -82.0105" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Pickup Time</Label>
                  <Input type="time" value={newTicket.pickupTime || ''} onChange={(e) => setNewTicket({ ...newTicket, pickupTime: e.target.value })} className="h-8 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Dropoff Time</Label>
                  <Input type="time" value={newTicket.dropoffTime || ''} onChange={(e) => setNewTicket({ ...newTicket, dropoffTime: e.target.value })} className="h-8 text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Dropoff Location (DMS / Landfill)</Label>
                  <Input value={newTicket.dropoffLocation || ''} onChange={(e) => setNewTicket({ ...newTicket, dropoffLocation: e.target.value })} className="h-8 text-sm" placeholder="e.g. Augusta Landfill" />
                </div>
                <div>
                  <Label className="text-xs">Dropoff GPS Coordinates</Label>
                  <Input value={newTicket.dropoffGPS || ''} onChange={(e) => setNewTicket({ ...newTicket, dropoffGPS: e.target.value })} className="h-8 text-sm" placeholder="33.4890, -82.0250" />
                </div>
              </div>
            </div>
            <div>
              <Label className="text-xs">Notes</Label>
              <Textarea value={newTicket.notes || ''} onChange={(e) => setNewTicket({ ...newTicket, notes: e.target.value })} rows={2} className="text-sm" placeholder="Special handling, hazmat, damage observed..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={addTicket}>Create Load Ticket</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {viewTicket && (
        <Dialog open={!!viewTicket} onOpenChange={() => setViewTicket(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Load Ticket {viewTicket.ticketNumber}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div><span className="text-slate-400">Date:</span> <span className="text-white ml-1">{viewTicket.date}</span></div>
                <div><span className="text-slate-400">Status:</span> <Badge className={`ml-1 text-xs ${viewTicket.status === 'verified' ? 'bg-green-600' : 'bg-amber-600'}`}>{viewTicket.status}</Badge></div>
                <div><span className="text-slate-400">Truck:</span> <span className="text-white ml-1">{viewTicket.truckNumber} ({viewTicket.truckType})</span></div>
                <div><span className="text-slate-400">Driver:</span> <span className="text-white ml-1">{viewTicket.driverName}</span></div>
                <div><span className="text-slate-400">Debris:</span> <span className="text-white ml-1">{viewTicket.debrisType}</span></div>
                <div><span className="text-slate-400">Load:</span> <span className="text-white ml-1">{viewTicket.cubicYards} CY ({viewTicket.loadSize})</span></div>
                <div><span className="text-slate-400">PW#:</span> <span className="text-white ml-1">{viewTicket.pwNumber || 'N/A'}</span></div>
                <div><span className="text-slate-400">Incident#:</span> <span className="text-white ml-1">{viewTicket.incidentNumber || 'N/A'}</span></div>
              </div>
              <div className="border-t border-slate-600 pt-2 space-y-1">
                <p className="font-semibold text-blue-400">GPS Chain of Custody</p>
                <div><span className="text-slate-400">Pickup:</span> <span className="text-white ml-1">{viewTicket.pickupLocation} — {viewTicket.pickupGPS || 'No GPS'}</span></div>
                <div><span className="text-slate-400">Time:</span> <span className="text-white ml-1">{viewTicket.pickupTime} → {viewTicket.dropoffTime}</span></div>
                <div><span className="text-slate-400">Dropoff:</span> <span className="text-white ml-1">{viewTicket.dropoffLocation} — {viewTicket.dropoffGPS || 'No GPS'}</span></div>
              </div>
              {viewTicket.notes && (
                <div className="border-t border-slate-600 pt-2">
                  <p className="text-slate-400">Notes:</p>
                  <p className="text-white">{viewTicket.notes}</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
