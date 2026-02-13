import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  MapPin, Navigation, Plus, Trash2, AlertTriangle, CheckCircle2,
  Radio, Clock, Truck, Users, Shield, Target, Activity, Wifi
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";

export interface GPSPing {
  id: string;
  timestamp: string;
  entityType: 'crew' | 'equipment' | 'vehicle';
  entityName: string;
  entityId: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  speed: number;
  heading: number;
  altitude: number;
  inGeofence: boolean;
  geofenceName: string;
  batteryLevel: number;
  signalStrength: string;
}

export interface Geofence {
  id: string;
  name: string;
  centerLat: number;
  centerLng: number;
  radiusMeters: number;
  type: 'work-zone' | 'staging' | 'disposal' | 'exclusion';
  active: boolean;
}

export interface TravelLog {
  id: string;
  date: string;
  entityName: string;
  startLocation: string;
  startTime: string;
  startGPS: string;
  endLocation: string;
  endTime: string;
  endGPS: string;
  distanceMiles: number;
  durationMinutes: number;
  impossibleTravel: boolean;
  flagReason: string;
}

function generateId() { return Math.random().toString(36).substring(2, 11); }

const DEMO_GEOFENCES: Geofence[] = [
  { id: '1', name: 'Primary Work Zone - Augusta ROW', centerLat: 33.4735, centerLng: -82.0105, radiusMeters: 5000, type: 'work-zone', active: true },
  { id: '2', name: 'Staging Area - Fury\'s Ferry Rd', centerLat: 33.5201, centerLng: -82.0734, radiusMeters: 500, type: 'staging', active: true },
  { id: '3', name: 'Augusta Landfill - Disposal', centerLat: 33.4890, centerLng: -82.0250, radiusMeters: 1000, type: 'disposal', active: true },
  { id: '4', name: 'Restricted Area - Water Treatment', centerLat: 33.4510, centerLng: -81.9800, radiusMeters: 300, type: 'exclusion', active: true },
];

const DEMO_PINGS: GPSPing[] = [
  { id: '1', timestamp: '2026-02-13T07:15:00', entityType: 'crew', entityName: 'Crew 1 - Brian Wise', entityId: 'C1', latitude: 33.4735, longitude: -82.0105, accuracy: 5, speed: 0, heading: 0, altitude: 145, inGeofence: true, geofenceName: 'Primary Work Zone', batteryLevel: 95, signalStrength: 'strong' },
  { id: '2', timestamp: '2026-02-13T07:18:00', entityType: 'crew', entityName: 'Crew 2 - Keith Ferrell', entityId: 'C2', latitude: 33.4780, longitude: -82.0150, accuracy: 8, speed: 0, heading: 0, altitude: 142, inGeofence: true, geofenceName: 'Primary Work Zone', batteryLevel: 88, signalStrength: 'strong' },
  { id: '3', timestamp: '2026-02-13T07:20:00', entityType: 'equipment', entityName: 'Bucket Truck #BT-101', entityId: 'BT101', latitude: 33.5201, longitude: -82.0734, accuracy: 3, speed: 0, heading: 180, altitude: 150, inGeofence: true, geofenceName: 'Staging Area', batteryLevel: 100, signalStrength: 'strong' },
  { id: '4', timestamp: '2026-02-13T07:25:00', entityType: 'crew', entityName: 'Crew 3 - Will Peebles', entityId: 'C3', latitude: 33.4810, longitude: -82.0200, accuracy: 6, speed: 15, heading: 90, altitude: 148, inGeofence: true, geofenceName: 'Primary Work Zone', batteryLevel: 72, signalStrength: 'medium' },
  { id: '5', timestamp: '2026-02-13T07:30:00', entityType: 'vehicle', entityName: 'Grapple Truck #GT-205', entityId: 'GT205', latitude: 33.4890, longitude: -82.0250, accuracy: 4, speed: 25, heading: 270, altitude: 140, inGeofence: true, geofenceName: 'Augusta Landfill', batteryLevel: 100, signalStrength: 'strong' },
  { id: '6', timestamp: '2026-02-13T07:32:00', entityType: 'crew', entityName: 'Crew 4 - Tim Hurst', entityId: 'C4', latitude: 33.4650, longitude: -82.0050, accuracy: 12, speed: 0, heading: 0, altitude: 138, inGeofence: true, geofenceName: 'Primary Work Zone', batteryLevel: 65, signalStrength: 'weak' },
];

const DEMO_TRAVEL: TravelLog[] = [
  { id: '1', date: '2026-02-12', entityName: 'Crew 1 - Brian Wise', startLocation: 'Staging Area', startTime: '07:00', startGPS: '33.5201, -82.0734', endLocation: 'Work Zone A', endTime: '07:22', endGPS: '33.4735, -82.0105', distanceMiles: 4.2, durationMinutes: 22, impossibleTravel: false, flagReason: '' },
  { id: '2', date: '2026-02-12', entityName: 'Crew 2 - Keith Ferrell', startLocation: 'Work Zone B', startTime: '11:30', startGPS: '33.4780, -82.0150', endLocation: 'Augusta Landfill', endTime: '11:45', endGPS: '33.4890, -82.0250', distanceMiles: 1.8, durationMinutes: 15, impossibleTravel: false, flagReason: '' },
  { id: '3', date: '2026-02-12', entityName: 'Grapple Truck #GT-205', startLocation: 'Work Zone A', startTime: '14:00', startGPS: '33.4735, -82.0105', endLocation: 'Work Zone C', endTime: '14:05', endGPS: '33.5500, -82.1000', distanceMiles: 12.3, durationMinutes: 5, impossibleTravel: true, flagReason: 'Travel distance 12.3mi in 5min requires 148mph — GPS anomaly or equipment error' },
];

export default function GPSTracking() {
  const [geofences, setGeofences] = useState<Geofence[]>(DEMO_GEOFENCES);
  const [pings] = useState<GPSPing[]>(DEMO_PINGS);
  const [travelLogs] = useState<TravelLog[]>(DEMO_TRAVEL);
  const [showAddGeofence, setShowAddGeofence] = useState(false);
  const [newGeo, setNewGeo] = useState<Partial<Geofence>>({ type: 'work-zone', active: true, radiusMeters: 1000 });
  const { toast } = useToast();

  const activeInGeofence = pings.filter(p => p.inGeofence).length;
  const outsideGeofence = pings.filter(p => !p.inGeofence).length;
  const impossibleTravels = travelLogs.filter(t => t.impossibleTravel).length;

  const addGeofence = () => {
    if (!newGeo.name || !newGeo.centerLat || !newGeo.centerLng) {
      toast({ title: "Missing fields", description: "Name and coordinates required", variant: "destructive" });
      return;
    }
    setGeofences([...geofences, { id: generateId(), name: newGeo.name || '', centerLat: newGeo.centerLat || 0, centerLng: newGeo.centerLng || 0, radiusMeters: newGeo.radiusMeters || 1000, type: (newGeo.type as any) || 'work-zone', active: true }]);
    setShowAddGeofence(false);
    toast({ title: "Geofence created", description: newGeo.name });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Navigation className="h-5 w-5 text-blue-400" />
            GPS Tracking & Geofence Compliance
          </h3>
          <p className="text-sm text-slate-400">Real-time crew & equipment positioning, geofenced work zones, impossible travel detection</p>
        </div>
        <div className="flex gap-2">
          <Badge className="bg-green-600/20 text-green-400 border-green-600/30">
            <Radio className="h-3 w-3 mr-1 animate-pulse" /> Live Tracking
          </Badge>
          <Button size="sm" onClick={() => setShowAddGeofence(true)}>
            <Plus className="h-4 w-4 mr-1" /> Add Geofence
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Active Tracking', value: pings.length, icon: Radio, color: 'text-green-400', bg: 'bg-green-500/10' },
          { label: 'In Geofence', value: activeInGeofence, icon: CheckCircle2, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { label: 'Outside Geofence', value: outsideGeofence, icon: AlertTriangle, color: outsideGeofence > 0 ? 'text-red-400' : 'text-green-400', bg: outsideGeofence > 0 ? 'bg-red-500/10' : 'bg-green-500/10' },
          { label: 'Geofence Zones', value: geofences.length, icon: Target, color: 'text-purple-400', bg: 'bg-purple-500/10' },
          { label: 'Travel Flags', value: impossibleTravels, icon: AlertTriangle, color: impossibleTravels > 0 ? 'text-red-400' : 'text-green-400', bg: impossibleTravels > 0 ? 'bg-red-500/10' : 'bg-green-500/10' },
        ].map(stat => (
          <Card key={stat.label} className="border-slate-700 bg-slate-800/50">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 mb-1">
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
                <p className="text-xs text-slate-400">{stat.label}</p>
              </div>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-slate-700 bg-slate-800/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-base flex items-center gap-2">
              <Radio className="h-4 w-4 text-green-400" />
              Live Positions
            </CardTitle>
            <CardDescription className="text-slate-400">Current crew & equipment GPS positions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pings.map(ping => (
                <div key={ping.id} className={`flex items-center justify-between p-2 rounded-lg border ${ping.inGeofence ? 'border-slate-600 bg-slate-700/30' : 'border-red-500/30 bg-red-500/10'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-full ${ping.entityType === 'crew' ? 'bg-blue-500/20' : ping.entityType === 'equipment' ? 'bg-amber-500/20' : 'bg-green-500/20'}`}>
                      {ping.entityType === 'crew' ? <Users className="h-3.5 w-3.5 text-blue-400" /> : ping.entityType === 'equipment' ? <Truck className="h-3.5 w-3.5 text-amber-400" /> : <Truck className="h-3.5 w-3.5 text-green-400" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{ping.entityName}</p>
                      <p className="text-xs text-slate-400">{ping.latitude.toFixed(4)}, {ping.longitude.toFixed(4)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-right">
                    <div>
                      <p className="text-xs text-slate-400">{ping.geofenceName}</p>
                      <div className="flex items-center gap-1">
                        <Wifi className={`h-3 w-3 ${ping.signalStrength === 'strong' ? 'text-green-400' : ping.signalStrength === 'medium' ? 'text-amber-400' : 'text-red-400'}`} />
                        <span className="text-[10px] text-slate-500">{ping.batteryLevel}%</span>
                      </div>
                    </div>
                    {ping.inGeofence ? (
                      <CheckCircle2 className="h-4 w-4 text-green-400" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-red-400" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-700 bg-slate-800/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-base flex items-center gap-2">
              <Target className="h-4 w-4 text-purple-400" />
              Geofence Zones
            </CardTitle>
            <CardDescription className="text-slate-400">Authorized work areas with GPS boundaries</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {geofences.map(geo => (
                <div key={geo.id} className="flex items-center justify-between p-2 rounded-lg border border-slate-600 bg-slate-700/30">
                  <div className="flex items-center gap-3">
                    <Badge className={`text-xs ${geo.type === 'work-zone' ? 'bg-blue-600' : geo.type === 'staging' ? 'bg-amber-600' : geo.type === 'disposal' ? 'bg-green-600' : 'bg-red-600'}`}>
                      {geo.type}
                    </Badge>
                    <div>
                      <p className="text-sm font-medium text-white">{geo.name}</p>
                      <p className="text-xs text-slate-400">{geo.centerLat.toFixed(4)}, {geo.centerLng.toFixed(4)} — {geo.radiusMeters}m radius</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={`text-xs ${geo.active ? 'text-green-400 border-green-600' : 'text-slate-500 border-slate-600'}`}>
                      {geo.active ? 'Active' : 'Inactive'}
                    </Badge>
                    <Button size="sm" variant="ghost" onClick={() => setGeofences(geofences.filter(g => g.id !== geo.id))}>
                      <Trash2 className="h-3.5 w-3.5 text-red-400" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-700 bg-slate-800/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-base flex items-center gap-2">
            <Activity className="h-4 w-4 text-red-400" />
            Travel Validation & Impossible Travel Detection
          </CardTitle>
          <CardDescription className="text-slate-400">AI-powered GPS route analysis flagging impossible movements and anomalies</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-slate-600 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-700/80 border-b border-slate-600">
                  <TableHead className="text-white font-semibold">Date</TableHead>
                  <TableHead className="text-white font-semibold">Entity</TableHead>
                  <TableHead className="text-white font-semibold">From</TableHead>
                  <TableHead className="text-white font-semibold">To</TableHead>
                  <TableHead className="text-white font-semibold text-right">Distance</TableHead>
                  <TableHead className="text-white font-semibold text-right">Duration</TableHead>
                  <TableHead className="text-white font-semibold text-center">Status</TableHead>
                  <TableHead className="text-white font-semibold">Flag Reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {travelLogs.map(log => (
                  <TableRow key={log.id} className={`border-b border-slate-700 ${log.impossibleTravel ? 'bg-red-500/10' : 'hover:bg-slate-700/40'}`}>
                    <TableCell className="text-sm text-white">{log.date}</TableCell>
                    <TableCell className="text-sm text-white font-medium">{log.entityName}</TableCell>
                    <TableCell className="text-xs text-slate-300">{log.startLocation} <span className="text-slate-500">{log.startTime}</span></TableCell>
                    <TableCell className="text-xs text-slate-300">{log.endLocation} <span className="text-slate-500">{log.endTime}</span></TableCell>
                    <TableCell className="text-right font-mono text-sm text-blue-300">{log.distanceMiles}mi</TableCell>
                    <TableCell className="text-right font-mono text-sm text-slate-200">{log.durationMinutes}min</TableCell>
                    <TableCell className="text-center">
                      {log.impossibleTravel ? (
                        <Badge className="bg-red-600 text-xs"><AlertTriangle className="h-3 w-3 mr-1" />FLAGGED</Badge>
                      ) : (
                        <Badge className="bg-green-600 text-xs"><CheckCircle2 className="h-3 w-3 mr-1" />Valid</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-red-400 max-w-[200px]">{log.flagReason || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showAddGeofence} onOpenChange={setShowAddGeofence}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Target className="h-5 w-5" /> Add Geofence Zone</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Zone Name</Label>
              <Input value={newGeo.name || ''} onChange={(e) => setNewGeo({ ...newGeo, name: e.target.value })} className="h-8 text-sm" placeholder="e.g. Work Zone Alpha" />
            </div>
            <div>
              <Label className="text-xs">Zone Type</Label>
              <Select value={newGeo.type || 'work-zone'} onValueChange={(v: any) => setNewGeo({ ...newGeo, type: v })}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="work-zone">Work Zone</SelectItem>
                  <SelectItem value="staging">Staging Area</SelectItem>
                  <SelectItem value="disposal">Disposal Site</SelectItem>
                  <SelectItem value="exclusion">Exclusion Zone</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Center Latitude</Label>
                <Input type="number" step="0.0001" value={newGeo.centerLat || ''} onChange={(e) => setNewGeo({ ...newGeo, centerLat: parseFloat(e.target.value) || 0 })} className="h-8 text-sm" />
              </div>
              <div>
                <Label className="text-xs">Center Longitude</Label>
                <Input type="number" step="0.0001" value={newGeo.centerLng || ''} onChange={(e) => setNewGeo({ ...newGeo, centerLng: parseFloat(e.target.value) || 0 })} className="h-8 text-sm" />
              </div>
            </div>
            <div>
              <Label className="text-xs">Radius (meters)</Label>
              <Input type="number" value={newGeo.radiusMeters || 1000} onChange={(e) => setNewGeo({ ...newGeo, radiusMeters: parseInt(e.target.value) || 1000 })} className="h-8 text-sm" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowAddGeofence(false)}>Cancel</Button>
            <Button onClick={addGeofence}>Create Geofence</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
