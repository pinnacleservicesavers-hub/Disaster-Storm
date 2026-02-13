import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Truck, Plus, Trash2, CheckCircle2, AlertTriangle, Calendar } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export interface TruckCert {
  id: string;
  truckNumber: string;
  truckType: string;
  make: string;
  model: string;
  year: string;
  vin: string;
  licensePlate: string;
  capacityCY: number;
  ownerCompany: string;
  certificationDate: string;
  certifiedBy: string;
  certifierOrg: string;
  expirationDate: string;
  measurementMethod: string;
  lengthFt: number;
  widthFt: number;
  heightFt: number;
  calculatedCY: number;
  photosTaken: boolean;
  stickerApplied: boolean;
  status: 'certified' | 'expired' | 'pending' | 'failed';
  notes: string;
}

const MEASUREMENT_METHODS = ['Physical Measurement', 'Manufacturer Spec', 'Water Fill Test', 'Estimated'];
const TRUCK_TYPES = ['Grapple Truck', 'Knuckleboom', 'Self-Loader', 'Dump Truck', 'Trailer', 'Roll-Off', 'Flatbed'];

function generateId() { return Math.random().toString(36).substring(2, 11); }

export default function TruckCertification({ certs, setCerts }: {
  certs: TruckCert[];
  setCerts: (c: TruckCert[]) => void;
}) {
  const { toast } = useToast();
  const [showAdd, setShowAdd] = useState(false);
  const [newCert, setNewCert] = useState<Partial<TruckCert>>({
    certificationDate: new Date().toISOString().split('T')[0],
    status: 'pending',
    measurementMethod: 'Physical Measurement',
    lengthFt: 0, widthFt: 0, heightFt: 0, capacityCY: 0, calculatedCY: 0,
    photosTaken: false, stickerApplied: false,
  });

  const addCert = () => {
    if (!newCert.truckNumber || !newCert.truckType) {
      toast({ title: "Missing fields", description: "Truck # and type required", variant: "destructive" });
      return;
    }
    const cy = ((newCert.lengthFt || 0) * (newCert.widthFt || 0) * (newCert.heightFt || 0)) / 27;
    const cert: TruckCert = {
      id: generateId(),
      truckNumber: newCert.truckNumber || '',
      truckType: newCert.truckType || '',
      make: newCert.make || '',
      model: newCert.model || '',
      year: newCert.year || '',
      vin: newCert.vin || '',
      licensePlate: newCert.licensePlate || '',
      capacityCY: newCert.capacityCY || cy,
      ownerCompany: newCert.ownerCompany || '',
      certificationDate: newCert.certificationDate || '',
      certifiedBy: newCert.certifiedBy || '',
      certifierOrg: newCert.certifierOrg || '',
      expirationDate: newCert.expirationDate || '',
      measurementMethod: newCert.measurementMethod || '',
      lengthFt: newCert.lengthFt || 0,
      widthFt: newCert.widthFt || 0,
      heightFt: newCert.heightFt || 0,
      calculatedCY: parseFloat(cy.toFixed(1)),
      photosTaken: newCert.photosTaken || false,
      stickerApplied: newCert.stickerApplied || false,
      status: 'certified',
      notes: newCert.notes || '',
    };
    setCerts([...certs, cert]);
    setShowAdd(false);
    setNewCert({ certificationDate: new Date().toISOString().split('T')[0], status: 'pending', measurementMethod: 'Physical Measurement', lengthFt: 0, widthFt: 0, heightFt: 0, capacityCY: 0, calculatedCY: 0, photosTaken: false, stickerApplied: false });
    toast({ title: "Truck certified", description: `${cert.truckNumber} — ${cert.calculatedCY} CY` });
  };

  const certified = certs.filter(c => c.status === 'certified').length;
  const expired = certs.filter(c => c.status === 'expired').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Truck className="h-5 w-5 text-orange-400" />
            Truck Certification Records
          </h3>
          <p className="text-sm text-slate-400">FEMA-required truck bed measurement & certification for debris hauling capacity verification</p>
        </div>
        <Button size="sm" onClick={() => setShowAdd(true)}>
          <Plus className="h-4 w-4 mr-1" /> Certify Truck
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Trucks', value: certs.length, color: 'text-white' },
          { label: 'Certified', value: certified, color: 'text-green-400' },
          { label: 'Expired', value: expired, color: 'text-red-400' },
          { label: 'Avg Capacity', value: certs.length > 0 ? (certs.reduce((s, c) => s + c.calculatedCY, 0) / certs.length).toFixed(1) + ' CY' : '0', color: 'text-blue-400' },
        ].map(stat => (
          <Card key={stat.label} className="border-slate-700 bg-slate-800/50">
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-slate-400">{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {certs.length > 0 ? (
        <div className="rounded-lg border border-slate-600 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-700/80 border-b border-slate-600">
                <TableHead className="text-white font-semibold">Truck #</TableHead>
                <TableHead className="text-white font-semibold">Type</TableHead>
                <TableHead className="text-white font-semibold">Make/Model</TableHead>
                <TableHead className="text-white font-semibold">VIN</TableHead>
                <TableHead className="text-white font-semibold text-right">L×W×H (ft)</TableHead>
                <TableHead className="text-white font-semibold text-right">Capacity (CY)</TableHead>
                <TableHead className="text-white font-semibold">Certified By</TableHead>
                <TableHead className="text-white font-semibold">Date</TableHead>
                <TableHead className="text-white font-semibold text-center">Status</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {certs.map(cert => (
                <TableRow key={cert.id} className="hover:bg-slate-700/40 border-b border-slate-700">
                  <TableCell className="font-mono text-sm text-white font-medium">{cert.truckNumber}</TableCell>
                  <TableCell><Badge variant="outline" className="text-xs">{cert.truckType}</Badge></TableCell>
                  <TableCell className="text-sm text-slate-200">{cert.make} {cert.model} {cert.year}</TableCell>
                  <TableCell className="text-xs font-mono text-slate-300">{cert.vin || '-'}</TableCell>
                  <TableCell className="text-right text-sm text-slate-200">{cert.lengthFt}×{cert.widthFt}×{cert.heightFt}</TableCell>
                  <TableCell className="text-right font-mono text-sm font-semibold text-emerald-300">{cert.calculatedCY}</TableCell>
                  <TableCell className="text-sm text-slate-200">{cert.certifiedBy || '-'}</TableCell>
                  <TableCell className="text-sm text-slate-200">{cert.certificationDate}</TableCell>
                  <TableCell className="text-center">
                    <Badge className={`text-xs ${cert.status === 'certified' ? 'bg-green-600' : cert.status === 'expired' ? 'bg-red-600' : 'bg-amber-600'}`}>{cert.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <Button size="sm" variant="ghost" onClick={() => setCerts(certs.filter(c => c.id !== cert.id))}>
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
            <Truck className="h-14 w-14 mx-auto text-slate-500 mb-3" />
            <h3 className="text-lg font-semibold text-white mb-1">No Truck Certifications</h3>
            <p className="text-slate-400 mb-4">Certify truck bed capacity with measurements for FEMA debris hauling compliance</p>
            <Button onClick={() => setShowAdd(true)}>
              <Plus className="h-4 w-4 mr-1" /> Certify First Truck
            </Button>
          </CardContent>
        </Card>
      )}

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Truck className="h-5 w-5" /> Truck Certification</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">Truck # *</Label>
                <Input value={newCert.truckNumber || ''} onChange={(e) => setNewCert({ ...newCert, truckNumber: e.target.value })} className="h-8 text-sm" />
              </div>
              <div>
                <Label className="text-xs">Type *</Label>
                <Select value={newCert.truckType || ''} onValueChange={(v) => setNewCert({ ...newCert, truckType: v })}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{TRUCK_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">License Plate</Label>
                <Input value={newCert.licensePlate || ''} onChange={(e) => setNewCert({ ...newCert, licensePlate: e.target.value })} className="h-8 text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">Make</Label>
                <Input value={newCert.make || ''} onChange={(e) => setNewCert({ ...newCert, make: e.target.value })} className="h-8 text-sm" placeholder="e.g. Peterbilt" />
              </div>
              <div>
                <Label className="text-xs">Model</Label>
                <Input value={newCert.model || ''} onChange={(e) => setNewCert({ ...newCert, model: e.target.value })} className="h-8 text-sm" />
              </div>
              <div>
                <Label className="text-xs">Year</Label>
                <Input value={newCert.year || ''} onChange={(e) => setNewCert({ ...newCert, year: e.target.value })} className="h-8 text-sm" />
              </div>
            </div>
            <div>
              <Label className="text-xs">VIN</Label>
              <Input value={newCert.vin || ''} onChange={(e) => setNewCert({ ...newCert, vin: e.target.value })} className="h-8 text-sm" />
            </div>
            <div className="border border-slate-600 rounded-lg p-3 space-y-3">
              <p className="text-xs font-semibold text-blue-400">Bed Measurements (for CY calculation)</p>
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <Label className="text-xs">Length (ft)</Label>
                  <Input type="number" step="0.1" value={newCert.lengthFt || ''} onChange={(e) => setNewCert({ ...newCert, lengthFt: parseFloat(e.target.value) || 0 })} className="h-8 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Width (ft)</Label>
                  <Input type="number" step="0.1" value={newCert.widthFt || ''} onChange={(e) => setNewCert({ ...newCert, widthFt: parseFloat(e.target.value) || 0 })} className="h-8 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Height (ft)</Label>
                  <Input type="number" step="0.1" value={newCert.heightFt || ''} onChange={(e) => setNewCert({ ...newCert, heightFt: parseFloat(e.target.value) || 0 })} className="h-8 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">= CY</Label>
                  <p className="text-lg font-bold text-emerald-400 mt-1">
                    {(((newCert.lengthFt || 0) * (newCert.widthFt || 0) * (newCert.heightFt || 0)) / 27).toFixed(1)}
                  </p>
                </div>
              </div>
              <div>
                <Label className="text-xs">Measurement Method</Label>
                <Select value={newCert.measurementMethod || 'Physical Measurement'} onValueChange={(v) => setNewCert({ ...newCert, measurementMethod: v })}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>{MEASUREMENT_METHODS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Certified By</Label>
                <Input value={newCert.certifiedBy || ''} onChange={(e) => setNewCert({ ...newCert, certifiedBy: e.target.value })} className="h-8 text-sm" />
              </div>
              <div>
                <Label className="text-xs">Certifier Organization</Label>
                <Input value={newCert.certifierOrg || ''} onChange={(e) => setNewCert({ ...newCert, certifierOrg: e.target.value })} className="h-8 text-sm" placeholder="e.g. AshBritt QA" />
              </div>
            </div>
            <div>
              <Label className="text-xs">Owner Company</Label>
              <Input value={newCert.ownerCompany || ''} onChange={(e) => setNewCert({ ...newCert, ownerCompany: e.target.value })} className="h-8 text-sm" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={addCert}>Certify Truck</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
