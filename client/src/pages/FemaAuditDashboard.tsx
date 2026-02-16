import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { ModuleWrapper } from "@/components/ModuleWrapper";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Shield, FileCheck, MapPin, AlertTriangle, CheckCircle2, Clock,
  TrendingUp, BarChart3, Download, Eye, Truck, Users, Wrench,
  FileText, Camera, Satellite, Brain, Activity, DollarSign,
  XCircle, RefreshCw, Plus, ChevronRight, Target, Zap,
  Trash2, Edit, Save, Calculator, ClipboardList, Receipt,
  UserPlus, Settings, ChevronDown, ChevronUp, Printer,
  Building2, Navigation, Briefcase, FolderOpen, MessageSquare
} from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import ContractSetupComponent, { type ContractInfo } from "@/components/fema/ContractSetup";
import LoadTicketsComponent, { type LoadTicket } from "@/components/fema/LoadTickets";
import EquipmentLogComponent, { type EquipmentLogEntry } from "@/components/fema/EquipmentLog";
import DailySignInComponent, { type SignInRecord } from "@/components/fema/DailySignIn";
import MonitorLogComponent, { type MonitorLogEntry } from "@/components/fema/MonitorLog";
import DailyActivityComponent, { type DailyActivity } from "@/components/fema/DailyActivityReport";
import GPSTrackingComponent from "@/components/fema/GPSTracking";
import TruckCertComponent, { type TruckCert } from "@/components/fema/TruckCertification";
import ComplianceDashboardComponent from "@/components/fema/ComplianceDashboard";
import LeanerHangerTrackerComponent, { type LeanerHangerEntry } from "@/components/fema/LeanerHangerTracker";
import AIVerificationEngineComponent from "@/components/fema/AIVerificationEngine";
import SubcontractorRiskComponent, { type SubcontractorProfile } from "@/components/fema/SubcontractorRisk";
import PhotoUploadComponent, { type UploadedPhoto } from "@/components/fema/PhotoUpload";
import JobTrackerComponent, { type JobEntry } from "@/components/fema/JobTracker";
import ContractDocumentsComponent from "@/components/fema/ContractDocuments";
import ProjectCommunicationsComponent from "@/components/fema/ProjectCommunications";

interface LaborRate {
  id: string;
  classification: string;
  stRate: number;
  otRate: number;
  dtRate: number;
}

interface EquipmentRate {
  id: string;
  equipmentName: string;
  equipmentId: string;
  hourlyRate: number;
}

interface RosterMember {
  id: string;
  fullName: string;
  classification: string;
  phone: string;
  email: string;
  crew: string;
  stateId: string;
  crewNumber: string;
  mobilizedDate: string;
  startWorkDate: string;
  company: string;
  equipmentAssigned: string;
  lastDayOnJob: string;
}

interface TimesheetEntry {
  workerId: string;
  workerName: string;
  classification: string;
  isDuplicate: boolean;
  duplicateNote: string;
  duplicateSource: string;
  days: {
    [key: string]: { start: string; stop: string; stHrs: number; otHrs: number; dtHrs: number };
  };
}

interface TimesheetWeek {
  id: string;
  crewName: string;
  weekEnding: string;
  stormEvent: string;
  contractorCompany: string;
  foremanName: string;
  entries: TimesheetEntry[];
}

interface InvoiceItem {
  description: string;
  classification: string;
  hours: number;
  rate: number;
  amount: number;
  category: 'labor-st' | 'labor-ot' | 'labor-dt' | 'equipment';
}

const DEFAULT_LABOR_RATES: LaborRate[] = [
  { id: '1', classification: 'General Foreman', stRate: 79.80, otRate: 111.60, dtRate: 144.00 },
  { id: '2', classification: 'Foreman A', stRate: 73.80, otRate: 96.00, dtRate: 122.40 },
  { id: '3', classification: 'Foreman B', stRate: 64.80, otRate: 91.20, dtRate: 115.80 },
  { id: '4', classification: 'Trimmer A', stRate: 61.20, otRate: 84.00, dtRate: 107.40 },
  { id: '5', classification: 'Trimmer B', stRate: 60.00, otRate: 78.00, dtRate: 100.20 },
  { id: '6', classification: 'Trimmer C', stRate: 58.20, otRate: 75.60, dtRate: 97.20 },
  { id: '7', classification: 'Learner', stRate: 48.00, otRate: 72.00, dtRate: 93.00 },
  { id: '8', classification: 'Equipment Operator', stRate: 68.40, otRate: 89.40, dtRate: 114.00 },
];

const DEFAULT_EQUIPMENT_RATES: EquipmentRate[] = [
  { id: '1', equipmentName: 'Equipment Trailer', equipmentId: 'TRL', hourlyRate: 13.50 },
  { id: '2', equipmentName: '2x4 Aerial Lift 30-37\'', equipmentId: 'AL230', hourlyRate: 33.60 },
  { id: '3', equipmentName: '2x4 Aerial Lift 50-57\' w/winch', equipmentId: 'AL250W', hourlyRate: 38.40 },
  { id: '4', equipmentName: '2x4 Spray Truck', equipmentId: 'ST2', hourlyRate: 32.40 },
  { id: '5', equipmentName: '2x4 Aerial Lift 50-57\' w/o dump', equipmentId: 'AL250ND', hourlyRate: 41.40 },
  { id: '6', equipmentName: '2x4 Aerial Lift 70+\'', equipmentId: 'AL270', hourlyRate: 48.00 },
  { id: '7', equipmentName: '2x4 Aerial Lift 50-57\'', equipmentId: 'AL250', hourlyRate: 42.00 },
  { id: '8', equipmentName: '2x4 Aerial Lift 50-57\' Diesel', equipmentId: 'AL250D', hourlyRate: 43.20 },
  { id: '9', equipmentName: '2x4 Aerial Lift Rev Mnt w/float tires', equipmentId: 'AL2RM', hourlyRate: 54.00 },
  { id: '10', equipmentName: '2x4 Split Dump', equipmentId: 'SD2', hourlyRate: 33.60 },
  { id: '11', equipmentName: '2x4 Split Dump Diesel', equipmentId: 'SD2D', hourlyRate: 33.60 },
  { id: '12', equipmentName: '4x4 Aerial Lift 30-37\'', equipmentId: 'AL430', hourlyRate: 38.40 },
  { id: '13', equipmentName: '4x4 Aerial Lift 57\' Paddlefoot', equipmentId: 'AL457P', hourlyRate: 54.60 },
  { id: '14', equipmentName: '4x4 Aerial Lift 57\' w/o dump', equipmentId: 'AL457ND', hourlyRate: 43.20 },
  { id: '15', equipmentName: '2x4 Pickup Crew Cab', equipmentId: 'PU2CC', hourlyRate: 20.10 },
  { id: '16', equipmentName: '4x4 Pickup <1 Ton', equipmentId: 'PU4', hourlyRate: 21.60 },
  { id: '17', equipmentName: '2x4 Pickup <1 Ton', equipmentId: 'PU2', hourlyRate: 22.20 },
  { id: '18', equipmentName: '4x4 Pickup Crew Cab', equipmentId: 'PU4CC', hourlyRate: 25.20 },
  { id: '19', equipmentName: '4x4 Aerial Lift 70+\' w/winch', equipmentId: 'AL470W', hourlyRate: 61.20 },
  { id: '20', equipmentName: '4x4 Aerial Lift 50-57\'', equipmentId: 'AL450', hourlyRate: 43.80 },
  { id: '21', equipmentName: '4x4 Aerial Lift 50-57\' Diesel', equipmentId: 'AL450D', hourlyRate: 48.00 },
  { id: '22', equipmentName: '4x4 Scissor Lift Paddlefoot', equipmentId: 'SL4P', hourlyRate: 57.60 },
  { id: '23', equipmentName: '4x4 Skidder Bucket 50-55\'', equipmentId: 'SKB4', hourlyRate: 86.40 },
  { id: '24', equipmentName: '4x4 Split Dump', equipmentId: 'SD4', hourlyRate: 30.00 },
  { id: '25', equipmentName: '4x4 Split Dump Diesel', equipmentId: 'SD4D', hourlyRate: 31.80 },
  { id: '26', equipmentName: '4x4 Tractor 5-6\' hog w/winch', equipmentId: 'TRK4', hourlyRate: 50.40 },
  { id: '27', equipmentName: 'ATV', equipmentId: 'ATV', hourlyRate: 13.80 },
  { id: '28', equipmentName: 'Aerial Lift 42+\' Backyard', equipmentId: 'AL42BY', hourlyRate: 49.20 },
  { id: '29', equipmentName: 'Brown Monitor Mower/Sprayer', equipmentId: 'BM', hourlyRate: 48.00 },
  { id: '30', equipmentName: 'Brush Cutter - Flail Mower', equipmentId: 'BC', hourlyRate: 98.40 },
  { id: '31', equipmentName: 'Rubber Tired Feller Buncher', equipmentId: 'FB-RT', hourlyRate: 168.00 },
  { id: '32', equipmentName: 'Prentice Loader', equipmentId: 'PL', hourlyRate: 88.20 },
  { id: '33', equipmentName: 'Marsh Master', equipmentId: 'MM', hourlyRate: 110.40 },
  { id: '34', equipmentName: 'Skid Steer Loader', equipmentId: 'SSL', hourlyRate: 67.20 },
  { id: '35', equipmentName: 'Rollback w/20\' bed', equipmentId: 'RB', hourlyRate: 36.00 },
  { id: '36', equipmentName: 'UTV', equipmentId: 'UTV', hourlyRate: 20.16 },
  { id: '37', equipmentName: 'Rubber Tired Mech. Trimmer 70\'', equipmentId: 'MT-RT', hourlyRate: 103.20 },
  { id: '38', equipmentName: 'Skid Steer Mower', equipmentId: 'SSM', hourlyRate: 84.00 },
  { id: '39', equipmentName: 'Stump Grinder', equipmentId: 'SG', hourlyRate: 50.40 },
  { id: '40', equipmentName: 'Tracked Excavator - Feller Buncher', equipmentId: 'EX-FB', hourlyRate: 223.20 },
  { id: '41', equipmentName: '4x4 Spray Truck', equipmentId: 'ST4', hourlyRate: 45.60 },
  { id: '42', equipmentName: 'Tracked Mech Trimmer 70\'', equipmentId: 'MT-T', hourlyRate: 110.40 },
  { id: '43', equipmentName: 'Tractor & Lowboy', equipmentId: 'LB', hourlyRate: 134.40 },
  { id: '44', equipmentName: 'Tracked Excavator - Fecon', equipmentId: 'EX-FE', hourlyRate: 163.20 },
  { id: '45', equipmentName: 'Tracked Excavator - Slash Buster', equipmentId: 'EX-SB', hourlyRate: 144.00 },
  { id: '46', equipmentName: 'Argo', equipmentId: 'ARGO', hourlyRate: 24.00 },
];

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_ABBREV = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function generateId() {
  return Math.random().toString(36).substring(2, 11);
}

function getWeekDates(weekEnding: string): string[] {
  const end = new Date(weekEnding);
  const dates: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(end);
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
}

function formatCurrency(val: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
}

function RateSheetTab({ laborRates, setLaborRates, equipmentRates, setEquipmentRates }: {
  laborRates: LaborRate[];
  setLaborRates: (r: LaborRate[]) => void;
  equipmentRates: EquipmentRate[];
  setEquipmentRates: (r: EquipmentRate[]) => void;
}) {
  const { toast } = useToast();
  const [editingLabor, setEditingLabor] = useState<string | null>(null);
  const [editingEquip, setEditingEquip] = useState<string | null>(null);
  const [newLabor, setNewLabor] = useState({ classification: '', stRate: '', otRate: '', dtRate: '' });
  const [newEquip, setNewEquip] = useState({ equipmentName: '', equipmentId: '', hourlyRate: '' });
  const [showAddLabor, setShowAddLabor] = useState(false);
  const [showAddEquip, setShowAddEquip] = useState(false);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-white">
                <DollarSign className="h-5 w-5 text-green-500" />
                Labor Rates (2026)
              </CardTitle>
              <CardDescription className="text-slate-400">Job classification rates for Straight Time, Overtime, and Double Time</CardDescription>
            </div>
            <Button size="sm" onClick={() => setShowAddLabor(true)}>
              <Plus className="h-4 w-4 mr-1" /> Add Classification
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-slate-600 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-700/80 border-b border-slate-600">
                  <TableHead className="font-semibold text-white">Classification</TableHead>
                  <TableHead className="text-right font-semibold text-white">ST Rate</TableHead>
                  <TableHead className="text-right font-semibold text-white">OT Rate</TableHead>
                  <TableHead className="text-right font-semibold text-white">DT Rate</TableHead>
                  <TableHead className="w-24 text-center text-white">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {laborRates.map((rate) => (
                  <TableRow key={rate.id} className="hover:bg-slate-700/40 border-b border-slate-700">
                    {editingLabor === rate.id ? (
                      <>
                        <TableCell>
                          <Input defaultValue={rate.classification} className="h-8"
                            onChange={(e) => rate.classification = e.target.value} />
                        </TableCell>
                        <TableCell>
                          <Input type="number" step="0.01" defaultValue={rate.stRate} className="h-8 text-right w-24"
                            onChange={(e) => rate.stRate = parseFloat(e.target.value) || 0} />
                        </TableCell>
                        <TableCell>
                          <Input type="number" step="0.01" defaultValue={rate.otRate} className="h-8 text-right w-24"
                            onChange={(e) => rate.otRate = parseFloat(e.target.value) || 0} />
                        </TableCell>
                        <TableCell>
                          <Input type="number" step="0.01" defaultValue={rate.dtRate} className="h-8 text-right w-24"
                            onChange={(e) => rate.dtRate = parseFloat(e.target.value) || 0} />
                        </TableCell>
                        <TableCell className="text-center">
                          <Button size="sm" variant="ghost" onClick={() => {
                            setEditingLabor(null);
                            setLaborRates([...laborRates]);
                            toast({ title: "Rate Updated" });
                          }}>
                            <Save className="h-4 w-4 text-green-500" />
                          </Button>
                        </TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell className="font-medium text-white">{rate.classification}</TableCell>
                        <TableCell className="text-right font-mono text-emerald-300">{formatCurrency(rate.stRate)}</TableCell>
                        <TableCell className="text-right font-mono text-amber-300">{formatCurrency(rate.otRate)}</TableCell>
                        <TableCell className="text-right font-mono text-red-300">{formatCurrency(rate.dtRate)}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex gap-1 justify-center">
                            <Button size="sm" variant="ghost" onClick={() => setEditingLabor(rate.id)}>
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => {
                              setLaborRates(laborRates.filter(r => r.id !== rate.id));
                              toast({ title: "Classification Removed" });
                            }}>
                              <Trash2 className="h-3.5 w-3.5 text-red-400" />
                            </Button>
                          </div>
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {showAddLabor && (
            <div className="flex gap-2 mt-3 items-end">
              <div className="flex-1">
                <Label className="text-xs">Classification</Label>
                <Input placeholder="e.g. Crew Leader" value={newLabor.classification}
                  onChange={(e) => setNewLabor({ ...newLabor, classification: e.target.value })} className="h-8" />
              </div>
              <div className="w-24">
                <Label className="text-xs">ST Rate</Label>
                <Input type="number" step="0.01" placeholder="0.00" value={newLabor.stRate}
                  onChange={(e) => setNewLabor({ ...newLabor, stRate: e.target.value })} className="h-8" />
              </div>
              <div className="w-24">
                <Label className="text-xs">OT Rate</Label>
                <Input type="number" step="0.01" placeholder="0.00" value={newLabor.otRate}
                  onChange={(e) => setNewLabor({ ...newLabor, otRate: e.target.value })} className="h-8" />
              </div>
              <div className="w-24">
                <Label className="text-xs">DT Rate</Label>
                <Input type="number" step="0.01" placeholder="0.00" value={newLabor.dtRate}
                  onChange={(e) => setNewLabor({ ...newLabor, dtRate: e.target.value })} className="h-8" />
              </div>
              <Button size="sm" onClick={() => {
                if (!newLabor.classification) return;
                setLaborRates([...laborRates, {
                  id: generateId(),
                  classification: newLabor.classification,
                  stRate: parseFloat(newLabor.stRate) || 0,
                  otRate: parseFloat(newLabor.otRate) || 0,
                  dtRate: parseFloat(newLabor.dtRate) || 0
                }]);
                setNewLabor({ classification: '', stRate: '', otRate: '', dtRate: '' });
                setShowAddLabor(false);
                toast({ title: "Classification Added" });
              }}>
                <Save className="h-4 w-4 mr-1" /> Save
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowAddLabor(false)}>Cancel</Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-white">
                <Truck className="h-5 w-5 text-blue-500" />
                Equipment Rates (Hourly)
              </CardTitle>
              <CardDescription className="text-slate-400">Equipment billing rates per hour</CardDescription>
            </div>
            <Button size="sm" onClick={() => setShowAddEquip(true)}>
              <Plus className="h-4 w-4 mr-1" /> Add Equipment
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-slate-600 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-700/80 border-b border-slate-600">
                  <TableHead className="font-semibold text-white">Equipment ID</TableHead>
                  <TableHead className="font-semibold text-white">Equipment Name</TableHead>
                  <TableHead className="text-right font-semibold text-white">Rate (HR)</TableHead>
                  <TableHead className="w-24 text-center text-white">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {equipmentRates.map((equip) => (
                  <TableRow key={equip.id} className="hover:bg-slate-700/40 border-b border-slate-700">
                    {editingEquip === equip.id ? (
                      <>
                        <TableCell>
                          <Input defaultValue={equip.equipmentId} className="h-8 w-20"
                            onChange={(e) => equip.equipmentId = e.target.value} />
                        </TableCell>
                        <TableCell>
                          <Input defaultValue={equip.equipmentName} className="h-8"
                            onChange={(e) => equip.equipmentName = e.target.value} />
                        </TableCell>
                        <TableCell>
                          <Input type="number" step="0.01" defaultValue={equip.hourlyRate} className="h-8 text-right w-24"
                            onChange={(e) => equip.hourlyRate = parseFloat(e.target.value) || 0} />
                        </TableCell>
                        <TableCell className="text-center">
                          <Button size="sm" variant="ghost" onClick={() => {
                            setEditingEquip(null);
                            setEquipmentRates([...equipmentRates]);
                            toast({ title: "Equipment Rate Updated" });
                          }}>
                            <Save className="h-4 w-4 text-green-500" />
                          </Button>
                        </TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell>
                          <Badge variant="outline" className="font-mono text-xs">{equip.equipmentId}</Badge>
                        </TableCell>
                        <TableCell className="font-medium text-white">{equip.equipmentName}</TableCell>
                        <TableCell className="text-right font-mono text-emerald-300">{formatCurrency(equip.hourlyRate)}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex gap-1 justify-center">
                            <Button size="sm" variant="ghost" onClick={() => setEditingEquip(equip.id)}>
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => {
                              setEquipmentRates(equipmentRates.filter(e => e.id !== equip.id));
                              toast({ title: "Equipment Removed" });
                            }}>
                              <Trash2 className="h-3.5 w-3.5 text-red-400" />
                            </Button>
                          </div>
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {showAddEquip && (
            <div className="flex gap-2 mt-3 items-end">
              <div className="w-24">
                <Label className="text-xs">Equip ID</Label>
                <Input placeholder="AL270" value={newEquip.equipmentId}
                  onChange={(e) => setNewEquip({ ...newEquip, equipmentId: e.target.value })} className="h-8" />
              </div>
              <div className="flex-1">
                <Label className="text-xs">Equipment Name</Label>
                <Input placeholder="e.g. 4x4 Aerial Lift 70+" value={newEquip.equipmentName}
                  onChange={(e) => setNewEquip({ ...newEquip, equipmentName: e.target.value })} className="h-8" />
              </div>
              <div className="w-28">
                <Label className="text-xs">Rate (HR)</Label>
                <Input type="number" step="0.01" placeholder="0.00" value={newEquip.hourlyRate}
                  onChange={(e) => setNewEquip({ ...newEquip, hourlyRate: e.target.value })} className="h-8" />
              </div>
              <Button size="sm" onClick={() => {
                if (!newEquip.equipmentName) return;
                setEquipmentRates([...equipmentRates, {
                  id: generateId(), equipmentName: newEquip.equipmentName,
                  equipmentId: newEquip.equipmentId, hourlyRate: parseFloat(newEquip.hourlyRate) || 0
                }]);
                setNewEquip({ equipmentName: '', equipmentId: '', hourlyRate: '' });
                setShowAddEquip(false);
                toast({ title: "Equipment Added" });
              }}>
                <Save className="h-4 w-4 mr-1" /> Save
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowAddEquip(false)}>Cancel</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function RosterTab({ roster, setRoster, laborRates }: {
  roster: RosterMember[];
  setRoster: (r: RosterMember[]) => void;
  laborRates: LaborRate[];
}) {
  const { toast } = useToast();
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMember, setNewMember] = useState<Partial<RosterMember>>({
    fullName: '', classification: '', phone: '', email: '',
    crew: 'Crew 1', company: '', equipmentAssigned: '', stateId: '',
    mobilizedDate: '', startWorkDate: '', lastDayOnJob: ''
  });

  const crewGroups = useMemo(() => {
    const groups: Record<string, RosterMember[]> = {};
    roster.forEach(m => {
      const crew = m.crew || 'Unassigned';
      if (!groups[crew]) groups[crew] = [];
      groups[crew].push(m);
    });
    return groups;
  }, [roster]);

  const removeMember = (id: string) => {
    setRoster(roster.filter(m => m.id !== id));
    toast({ title: "Member Removed" });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-white">
                <Users className="h-5 w-5 text-purple-500" />
                Crew Roster
              </CardTitle>
              <CardDescription className="text-slate-400">All personnel assigned to this contract with classifications and crew assignments</CardDescription>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline" className="text-sm px-3 py-1">
                {roster.length} Personnel
              </Badge>
              <Button size="sm" onClick={() => setShowAddMember(true)}>
                <UserPlus className="h-4 w-4 mr-1" /> Add Member
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {Object.entries(crewGroups).sort().map(([crewName, members]) => (
            <div key={crewName} className="mb-6 last:mb-0">
              <div className="flex items-center gap-2 mb-3">
                <Badge className="bg-indigo-600 text-sm px-3">{crewName}</Badge>
                <span className="text-sm text-slate-400">{members.length} members</span>
              </div>
              <div className="rounded-lg border border-slate-600 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-700/80 border-b border-slate-600">
                      <TableHead className="font-semibold text-white">Full Legal Name</TableHead>
                      <TableHead className="font-semibold text-white">Position / Classification</TableHead>
                      <TableHead className="font-semibold text-white">Phone</TableHead>
                      <TableHead className="font-semibold text-white">Company</TableHead>
                      <TableHead className="font-semibold text-white">Equipment</TableHead>
                      <TableHead className="font-semibold text-white">Mobilized</TableHead>
                      <TableHead className="w-16 text-white">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members.map((member) => (
                      <TableRow key={member.id} className="hover:bg-slate-700/40 border-b border-slate-700">
                        <TableCell className="font-medium text-white">{member.fullName}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs">{member.classification}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-slate-200">{member.phone}</TableCell>
                        <TableCell className="text-sm text-slate-200">{member.company}</TableCell>
                        <TableCell className="text-sm text-slate-200">{member.equipmentAssigned || '-'}</TableCell>
                        <TableCell className="text-sm text-slate-200">{member.mobilizedDate || '-'}</TableCell>
                        <TableCell>
                          <Button size="sm" variant="ghost" onClick={() => removeMember(member.id)}>
                            <Trash2 className="h-3.5 w-3.5 text-red-400" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ))}
          {roster.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-lg font-medium mb-1">No Personnel Added</p>
              <p>Add crew members to start building your roster</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showAddMember} onOpenChange={setShowAddMember}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Crew Member</DialogTitle>
            <DialogDescription>Enter personnel details for the crew roster</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Full Legal Name</Label>
              <Input value={newMember.fullName} onChange={(e) => setNewMember({ ...newMember, fullName: e.target.value })} />
            </div>
            <div>
              <Label>Position / Classification</Label>
              <Select value={newMember.classification} onValueChange={(v) => setNewMember({ ...newMember, classification: v })}>
                <SelectTrigger><SelectValue placeholder="Select classification" /></SelectTrigger>
                <SelectContent>
                  {laborRates.map(r => (
                    <SelectItem key={r.id} value={r.classification}>{r.classification}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Phone Number</Label>
              <Input value={newMember.phone} onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })} />
            </div>
            <div>
              <Label>Email Address</Label>
              <Input type="email" value={newMember.email} onChange={(e) => setNewMember({ ...newMember, email: e.target.value })} />
            </div>
            <div>
              <Label>Crew Assignment</Label>
              <Select value={newMember.crew} onValueChange={(v) => setNewMember({ ...newMember, crew: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['Crew 1', 'Crew 2', 'Crew 3', 'Crew 4', 'Crew 5', 'Crew 6'].map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Company</Label>
              <Input value={newMember.company} onChange={(e) => setNewMember({ ...newMember, company: e.target.value })} />
            </div>
            <div>
              <Label>Equipment Assigned</Label>
              <Input value={newMember.equipmentAssigned} onChange={(e) => setNewMember({ ...newMember, equipmentAssigned: e.target.value })} />
            </div>
            <div>
              <Label>State Issued ID #</Label>
              <Input value={newMember.stateId} onChange={(e) => setNewMember({ ...newMember, stateId: e.target.value })} />
            </div>
            <div>
              <Label>Mobilized Date</Label>
              <Input type="date" value={newMember.mobilizedDate} onChange={(e) => setNewMember({ ...newMember, mobilizedDate: e.target.value })} />
            </div>
            <div>
              <Label>Start Working Date</Label>
              <Input type="date" value={newMember.startWorkDate} onChange={(e) => setNewMember({ ...newMember, startWorkDate: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowAddMember(false)}>Cancel</Button>
            <Button onClick={() => {
              if (!newMember.fullName || !newMember.classification) {
                return;
              }
              setRoster([...roster, { ...newMember, id: generateId(), crewNumber: '' } as RosterMember]);
              setNewMember({
                fullName: '', classification: '', phone: '', email: '',
                crew: 'Crew 1', company: '', equipmentAssigned: '', stateId: '',
                mobilizedDate: '', startWorkDate: '', lastDayOnJob: ''
              });
              setShowAddMember(false);
              toast({ title: "Member Added to Roster" });
            }}>
              <UserPlus className="h-4 w-4 mr-1" /> Add Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TimesheetTab({ timesheets, setTimesheets, roster, laborRates }: {
  timesheets: TimesheetWeek[];
  setTimesheets: (t: TimesheetWeek[]) => void;
  roster: RosterMember[];
  laborRates: LaborRate[];
}) {
  const { toast } = useToast();
  const [selectedTimesheetIdx, setSelectedTimesheetIdx] = useState<number>(0);
  const [showNewTimesheet, setShowNewTimesheet] = useState(false);
  const [newTs, setNewTs] = useState({
    crewName: 'Crew 1', weekEnding: '', stormEvent: '', contractorCompany: '', foremanName: ''
  });
  const [duplicateOverride, setDuplicateOverride] = useState<{
    show: boolean;
    entryIdx: number;
    workerId: string;
    workerName: string;
    conflictType: 'same-sheet' | 'cross-contract';
    conflictCrew: string;
    explanation: string;
  }>({ show: false, entryIdx: -1, workerId: '', workerName: '', conflictType: 'same-sheet', conflictCrew: '', explanation: '' });

  const getRateForClassification = useCallback((classification: string) => {
    return laborRates.find(r => r.classification === classification) || null;
  }, [laborRates]);

  const crewMembers = useMemo(() => {
    if (timesheets.length === 0) return [];
    const ts = timesheets[selectedTimesheetIdx];
    if (!ts) return [];
    return roster.filter(m => m.crew === ts.crewName);
  }, [roster, timesheets, selectedTimesheetIdx]);

  const calculateWorkerTotal = useCallback((entry: TimesheetEntry) => {
    const rate = getRateForClassification(entry.classification);
    if (!rate) return { totalST: 0, totalOT: 0, totalDT: 0, totalHrs: 0, totalCost: 0 };

    let totalST = 0, totalOT = 0, totalDT = 0;
    Object.values(entry.days).forEach(day => {
      totalST += day.stHrs || 0;
      totalOT += day.otHrs || 0;
      totalDT += day.dtHrs || 0;
    });
    const totalHrs = totalST + totalOT + totalDT;
    const totalCost = (totalST * rate.stRate) + (totalOT * rate.otRate) + (totalDT * rate.dtRate);
    return { totalST, totalOT, totalDT, totalHrs, totalCost };
  }, [getRateForClassification]);

  const currentTimesheet = timesheets[selectedTimesheetIdx];
  const weekDates = currentTimesheet ? getWeekDates(currentTimesheet.weekEnding) : [];

  const updateHours = (entryIdx: number, dayKey: string, field: 'stHrs' | 'otHrs' | 'dtHrs', value: number) => {
    const updated = [...timesheets];
    const ts = { ...updated[selectedTimesheetIdx] };
    const entries = [...ts.entries];
    const entry = { ...entries[entryIdx] };
    entry.days = { ...entry.days };
    entry.days[dayKey] = { ...entry.days[dayKey], [field]: value };
    entries[entryIdx] = entry;
    ts.entries = entries;
    updated[selectedTimesheetIdx] = ts;
    setTimesheets(updated);
  };

  const updateClassification = (entryIdx: number, classification: string) => {
    const updated = [...timesheets];
    const ts = { ...updated[selectedTimesheetIdx] };
    const entries = [...ts.entries];
    entries[entryIdx] = { ...entries[entryIdx], classification };
    ts.entries = entries;
    updated[selectedTimesheetIdx] = ts;
    setTimesheets(updated);
  };

  const applyWorkerAssignment = (entryIdx: number, workerId: string, isDuplicate: boolean, duplicateNote: string, duplicateSource: string) => {
    const member = roster.find(m => m.id === workerId);
    if (!member) return;
    const updated = [...timesheets];
    const ts = { ...updated[selectedTimesheetIdx] };
    const entries = [...ts.entries];
    entries[entryIdx] = {
      ...entries[entryIdx],
      workerId, workerName: member.fullName, classification: member.classification,
      isDuplicate, duplicateNote, duplicateSource
    };
    ts.entries = entries;
    updated[selectedTimesheetIdx] = ts;
    setTimesheets(updated);
  };

  const updateWorkerName = (entryIdx: number, workerId: string) => {
    const member = roster.find(m => m.id === workerId);
    if (!member) return;

    const currentTs = timesheets[selectedTimesheetIdx];

    const duplicateInSameSheet = currentTs.entries.find(
      (e, i) => i !== entryIdx && e.workerId === workerId
    );
    if (duplicateInSameSheet) {
      setDuplicateOverride({
        show: true, entryIdx, workerId, workerName: member.fullName,
        conflictType: 'same-sheet', conflictCrew: currentTs.crewName, explanation: ''
      });
      return;
    }

    const conflictSheet = timesheets.find(
      (ts, i) => i !== selectedTimesheetIdx &&
        ts.weekEnding === currentTs.weekEnding &&
        ts.entries.some(e => e.workerId === workerId)
    );
    if (conflictSheet) {
      setDuplicateOverride({
        show: true, entryIdx, workerId, workerName: member.fullName,
        conflictType: 'cross-contract', conflictCrew: conflictSheet.crewName, explanation: ''
      });
      return;
    }

    applyWorkerAssignment(entryIdx, workerId, false, '', '');
  };

  const addWorkerRow = () => {
    if (!currentTimesheet) return;
    const emptyDays: TimesheetEntry['days'] = {};
    weekDates.forEach(d => { emptyDays[d] = { start: '', stop: '', stHrs: 0, otHrs: 0, dtHrs: 0 }; });
    const updated = [...timesheets];
    const ts = { ...updated[selectedTimesheetIdx] };
    ts.entries = [...ts.entries, { workerId: '', workerName: '', classification: '', isDuplicate: false, duplicateNote: '', duplicateSource: '', days: emptyDays }];
    updated[selectedTimesheetIdx] = ts;
    setTimesheets(updated);
  };

  const removeWorkerRow = (idx: number) => {
    const updated = [...timesheets];
    const ts = { ...updated[selectedTimesheetIdx] };
    ts.entries = ts.entries.filter((_, i) => i !== idx);
    updated[selectedTimesheetIdx] = ts;
    setTimesheets(updated);
  };

  const getWorkerConflicts = useCallback((workerId: string): string | null => {
    if (!workerId || !currentTimesheet) return null;
    const conflict = timesheets.find(
      (ts, i) => i !== selectedTimesheetIdx &&
        ts.weekEnding === currentTimesheet.weekEnding &&
        ts.entries.some(e => e.workerId === workerId)
    );
    return conflict ? conflict.crewName : null;
  }, [timesheets, selectedTimesheetIdx, currentTimesheet]);

  const grandTotals = useMemo(() => {
    if (!currentTimesheet) return { totalST: 0, totalOT: 0, totalDT: 0, totalHrs: 0, totalCost: 0 };
    let totalST = 0, totalOT = 0, totalDT = 0, totalCost = 0;
    currentTimesheet.entries.forEach(entry => {
      const t = calculateWorkerTotal(entry);
      totalST += t.totalST;
      totalOT += t.totalOT;
      totalDT += t.totalDT;
      totalCost += t.totalCost;
    });
    return { totalST, totalOT, totalDT, totalHrs: totalST + totalOT + totalDT, totalCost };
  }, [currentTimesheet, calculateWorkerTotal]);

  const createTimesheet = () => {
    if (!newTs.weekEnding || !newTs.crewName) return;
    const dates = getWeekDates(newTs.weekEnding);
    const members = roster.filter(m => m.crew === newTs.crewName);
    const entries: TimesheetEntry[] = members.map(m => {
      const days: TimesheetEntry['days'] = {};
      dates.forEach(d => { days[d] = { start: '', stop: '', stHrs: 0, otHrs: 0, dtHrs: 0 }; });
      return { workerId: m.id, workerName: m.fullName, classification: m.classification, isDuplicate: false, duplicateNote: '', duplicateSource: '', days };
    });
    setTimesheets([...timesheets, {
      id: generateId(), crewName: newTs.crewName, weekEnding: newTs.weekEnding,
      stormEvent: newTs.stormEvent, contractorCompany: newTs.contractorCompany,
      foremanName: newTs.foremanName, entries
    }]);
    setSelectedTimesheetIdx(timesheets.length);
    setShowNewTimesheet(false);
    setNewTs({ crewName: 'Crew 1', weekEnding: '', stormEvent: '', contractorCompany: '', foremanName: '' });
    toast({ title: "Timesheet Created" });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {timesheets.length > 0 && (
            <Select value={String(selectedTimesheetIdx)} onValueChange={(v) => setSelectedTimesheetIdx(Number(v))}>
              <SelectTrigger className="w-[300px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {timesheets.map((ts, i) => (
                  <SelectItem key={ts.id} value={String(i)}>
                    {ts.crewName} - Week Ending {ts.weekEnding}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        <Button size="sm" onClick={() => setShowNewTimesheet(true)}>
          <Plus className="h-4 w-4 mr-1" /> New Timesheet
        </Button>
      </div>

      {showNewTimesheet && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-white">Create New Timesheet</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div>
                <Label className="text-xs">Crew</Label>
                <Select value={newTs.crewName} onValueChange={(v) => setNewTs({ ...newTs, crewName: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['Crew 1', 'Crew 2', 'Crew 3', 'Crew 4', 'Crew 5', 'Crew 6'].map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Week Ending (Saturday)</Label>
                <Input type="date" value={newTs.weekEnding} onChange={(e) => setNewTs({ ...newTs, weekEnding: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Storm Event</Label>
                <Input placeholder="e.g. Ice Storm" value={newTs.stormEvent} onChange={(e) => setNewTs({ ...newTs, stormEvent: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Contractor Company</Label>
                <Input value={newTs.contractorCompany} onChange={(e) => setNewTs({ ...newTs, contractorCompany: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Foreman Name</Label>
                <Input value={newTs.foremanName} onChange={(e) => setNewTs({ ...newTs, foremanName: e.target.value })} />
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <Button size="sm" onClick={createTimesheet}>Create Timesheet</Button>
              <Button size="sm" variant="ghost" onClick={() => setShowNewTimesheet(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {currentTimesheet && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-white">
                  <ClipboardList className="h-5 w-5 text-amber-500" />
                  {currentTimesheet.crewName} Timesheet
                </CardTitle>
                <CardDescription className="text-slate-400">
                  {currentTimesheet.stormEvent && `${currentTimesheet.stormEvent} | `}
                  {currentTimesheet.contractorCompany && `${currentTimesheet.contractorCompany} | `}
                  Week Ending: {currentTimesheet.weekEnding}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={addWorkerRow}>
                  <Plus className="h-4 w-4 mr-1" /> Add Row
                </Button>
              </div>
            </div>
            <div className="mt-2 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-md">
              <p className="text-xs text-amber-300">
                OT applies up to 16 hrs/day. DT applies after 16 hrs and on Saturday/Sunday/Holidays.
              </p>
            </div>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <div className="min-w-[1200px]">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-700/80 border-b border-slate-600">
                    <TableHead className="font-semibold min-w-[160px] sticky left-0 bg-slate-800 z-10 text-white">Name</TableHead>
                    <TableHead className="font-semibold min-w-[140px] text-white">Job Classification</TableHead>
                    {weekDates.map((date, i) => (
                      <TableHead key={date} className="text-center min-w-[100px] text-white" colSpan={1}>
                        <div className="text-xs">{DAY_ABBREV[i]}</div>
                        <div className="text-[10px] text-slate-400">{date.slice(5)}</div>
                      </TableHead>
                    ))}
                    <TableHead className="text-right font-semibold min-w-[60px] text-white">ST Hrs</TableHead>
                    <TableHead className="text-right font-semibold min-w-[60px] text-white">OT Hrs</TableHead>
                    <TableHead className="text-right font-semibold min-w-[60px] text-white">DT Hrs</TableHead>
                    <TableHead className="text-right font-semibold min-w-[100px] text-white">Total Cost</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentTimesheet.entries.map((entry, entryIdx) => {
                    const totals = calculateWorkerTotal(entry);
                    const rate = getRateForClassification(entry.classification);
                    const conflictCrew = getWorkerConflicts(entry.workerId);
                    const hasDuplicateFlag = entry.isDuplicate || !!conflictCrew;
                    return (
                      <TableRow key={entryIdx} className={`hover:bg-slate-800/30 ${hasDuplicateFlag ? 'bg-red-500/10 border-l-4 border-l-red-500' : ''}`}>
                        <TableCell className={`sticky left-0 z-10 ${hasDuplicateFlag ? 'bg-red-950/80' : 'bg-slate-900/95'}`}>
                          <div className="space-y-1">
                            <Select value={entry.workerId} onValueChange={(v) => updateWorkerName(entryIdx, v)}>
                              <SelectTrigger className={`h-8 text-xs ${hasDuplicateFlag ? 'border-red-500/50' : ''}`}>
                                <SelectValue placeholder="Select person">{entry.workerName || 'Select person'}</SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                {crewMembers.map(m => (
                                  <SelectItem key={m.id} value={m.id}>{m.fullName}</SelectItem>
                                ))}
                                {roster.filter(m => m.crew !== currentTimesheet.crewName).map(m => (
                                  <SelectItem key={m.id} value={m.id}>{m.fullName} ({m.crew})</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {hasDuplicateFlag && (
                              <div className="rounded bg-red-500/20 border border-red-500/30 px-2 py-1">
                                <div className="flex items-center gap-1 text-[10px] text-red-400 font-bold">
                                  <AlertTriangle className="h-3 w-3 flex-shrink-0" />
                                  DUPLICATE — {entry.isDuplicate ? entry.duplicateSource : `Also on ${conflictCrew}`}
                                </div>
                                {entry.duplicateNote && (
                                  <p className="text-[9px] text-red-300/80 mt-0.5 italic">
                                    Override: {entry.duplicateNote}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Select value={entry.classification} onValueChange={(v) => updateClassification(entryIdx, v)}>
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue placeholder="Classification" />
                            </SelectTrigger>
                            <SelectContent>
                              {laborRates.map(r => (
                                <SelectItem key={r.id} value={r.classification}>{r.classification}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        {weekDates.map((date, dayIdx) => {
                          const dayData = entry.days[date] || { stHrs: 0, otHrs: 0, dtHrs: 0 };
                          const isWeekend = dayIdx === 0 || dayIdx === 6;
                          return (
                            <TableCell key={date} className={`p-1 ${isWeekend ? 'bg-red-500/5' : ''}`}>
                              <div className="space-y-0.5">
                                {isWeekend ? (
                                  <Input
                                    type="number" step="0.5" min="0" max="24"
                                    value={dayData.dtHrs || ''}
                                    onChange={(e) => updateHours(entryIdx, date, 'dtHrs', parseFloat(e.target.value) || 0)}
                                    className="h-7 text-xs text-center w-full"
                                    placeholder="DT"
                                  />
                                ) : (
                                  <>
                                    <Input
                                      type="number" step="0.5" min="0" max="16"
                                      value={dayData.otHrs || ''}
                                      onChange={(e) => updateHours(entryIdx, date, 'otHrs', parseFloat(e.target.value) || 0)}
                                      className="h-6 text-[10px] text-center w-full"
                                      placeholder="OT"
                                    />
                                    <Input
                                      type="number" step="0.5" min="0" max="8"
                                      value={dayData.dtHrs || ''}
                                      onChange={(e) => updateHours(entryIdx, date, 'dtHrs', parseFloat(e.target.value) || 0)}
                                      className="h-6 text-[10px] text-center w-full"
                                      placeholder="DT"
                                    />
                                  </>
                                )}
                              </div>
                            </TableCell>
                          );
                        })}
                        <TableCell className="text-right font-mono text-sm text-white">{totals.totalST.toFixed(1)}</TableCell>
                        <TableCell className="text-right font-mono text-sm text-amber-300">{totals.totalOT.toFixed(1)}</TableCell>
                        <TableCell className="text-right font-mono text-sm text-red-300">{totals.totalDT.toFixed(1)}</TableCell>
                        <TableCell className="text-right font-mono text-sm font-semibold text-green-400">
                          {formatCurrency(totals.totalCost)}
                          {rate && (
                            <div className="text-[9px] text-slate-500">
                              {formatCurrency(rate.otRate)}/hr OT
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button size="sm" variant="ghost" onClick={() => removeWorkerRow(entryIdx)}>
                            <Trash2 className="h-3 w-3 text-red-400" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  <TableRow className="bg-slate-700/80 font-semibold border-t-2 border-slate-500">
                    <TableCell className="sticky left-0 bg-slate-700 z-10 text-white" colSpan={2}>
                      <span className="flex items-center gap-2">
                        <Calculator className="h-4 w-4" /> TOTALS
                      </span>
                    </TableCell>
                    {weekDates.map(date => {
                      const dayTotal = currentTimesheet.entries.reduce((sum, e) => {
                        const d = e.days[date] || { stHrs: 0, otHrs: 0, dtHrs: 0 };
                        return sum + d.stHrs + d.otHrs + d.dtHrs;
                      }, 0);
                      return (
                        <TableCell key={date} className="text-center text-xs font-mono text-white">
                          {dayTotal > 0 ? dayTotal.toFixed(1) : '-'}
                        </TableCell>
                      );
                    })}
                    <TableCell className="text-right font-mono text-white">{grandTotals.totalST.toFixed(1)}</TableCell>
                    <TableCell className="text-right font-mono text-amber-300">{grandTotals.totalOT.toFixed(1)}</TableCell>
                    <TableCell className="text-right font-mono text-red-300">{grandTotals.totalDT.toFixed(1)}</TableCell>
                    <TableCell className="text-right font-mono text-lg text-green-400">
                      {formatCurrency(grandTotals.totalCost)}
                    </TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {timesheets.length === 0 && !showNewTimesheet && (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <ClipboardList className="h-14 w-14 mx-auto text-slate-500 mb-3" />
            <h3 className="text-lg font-semibold mb-1">No Timesheets Yet</h3>
            <p className="text-slate-400 mb-4">Create a weekly timesheet to start tracking crew hours and costs</p>
            <Button onClick={() => setShowNewTimesheet(true)}>
              <Plus className="h-4 w-4 mr-1" /> Create First Timesheet
            </Button>
          </CardContent>
        </Card>
      )}

      <Dialog open={duplicateOverride.show} onOpenChange={(open) => {
        if (!open) setDuplicateOverride({ ...duplicateOverride, show: false });
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-400">
              <AlertTriangle className="h-5 w-5" />
              Duplicate Employee Detected
            </DialogTitle>
            <DialogDescription>
              {duplicateOverride.conflictType === 'same-sheet'
                ? `${duplicateOverride.workerName} is already listed on this timesheet.`
                : `${duplicateOverride.workerName} is already assigned to ${duplicateOverride.conflictCrew} for the same week.`
              }
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-4 space-y-2">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-semibold text-red-300">This flag will remain permanently visible</p>
                <p className="text-red-200/70 text-xs mt-1">
                  The duplicate indicator will always show in red on this timesheet entry for auditing purposes.
                  Time can still be entered and calculated normally, but this entry will be flagged for review.
                </p>
              </div>
            </div>
          </div>
          <div>
            <Label className="text-sm font-semibold">Override Explanation (Required)</Label>
            <p className="text-xs text-slate-400 mb-2">
              Explain why this person is being added to multiple timesheets. This note is part of the audit record.
            </p>
            <Textarea
              placeholder="e.g. Worker was reassigned mid-week from Crew 2 to Crew 1 due to staffing shortage. Split time approved by supervisor."
              value={duplicateOverride.explanation}
              onChange={(e) => setDuplicateOverride({ ...duplicateOverride, explanation: e.target.value })}
              rows={3}
              className="resize-none"
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setDuplicateOverride({ ...duplicateOverride, show: false })}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={!duplicateOverride.explanation.trim()}
              onClick={() => {
                const source = duplicateOverride.conflictType === 'same-sheet'
                  ? `Duplicate on ${duplicateOverride.conflictCrew}`
                  : `Also on ${duplicateOverride.conflictCrew}`;
                applyWorkerAssignment(
                  duplicateOverride.entryIdx,
                  duplicateOverride.workerId,
                  true,
                  duplicateOverride.explanation.trim(),
                  source
                );
                toast({
                  title: "Duplicate Override Applied",
                  description: `${duplicateOverride.workerName} added with permanent duplicate flag. This entry is flagged for audit review.`,
                  variant: "destructive",
                });
                setDuplicateOverride({ show: false, entryIdx: -1, workerId: '', workerName: '', conflictType: 'same-sheet', conflictCrew: '', explanation: '' });
              }}
            >
              <AlertTriangle className="h-4 w-4 mr-1" />
              Override & Flag as Duplicate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function InvoiceTab({ timesheets, laborRates, equipmentRates }: {
  timesheets: TimesheetWeek[];
  laborRates: LaborRate[];
  equipmentRates: EquipmentRate[];
}) {
  const [selectedTimesheetId, setSelectedTimesheetId] = useState<string>('');

  const selectedTs = timesheets.find(t => t.id === selectedTimesheetId);

  const invoiceItems = useMemo((): InvoiceItem[] => {
    if (!selectedTs) return [];
    const items: InvoiceItem[] = [];

    selectedTs.entries.forEach(entry => {
      const rate = laborRates.find(r => r.classification === entry.classification);
      if (!rate) return;

      let totalST = 0, totalOT = 0, totalDT = 0;
      Object.values(entry.days).forEach(d => {
        totalST += d.stHrs || 0;
        totalOT += d.otHrs || 0;
        totalDT += d.dtHrs || 0;
      });

      if (totalST > 0) {
        items.push({
          description: `${entry.workerName} - Straight Time`,
          classification: entry.classification,
          hours: totalST,
          rate: rate.stRate,
          amount: totalST * rate.stRate,
          category: 'labor-st'
        });
      }
      if (totalOT > 0) {
        items.push({
          description: `${entry.workerName} - Overtime`,
          classification: entry.classification,
          hours: totalOT,
          rate: rate.otRate,
          amount: totalOT * rate.otRate,
          category: 'labor-ot'
        });
      }
      if (totalDT > 0) {
        items.push({
          description: `${entry.workerName} - Double Time`,
          classification: entry.classification,
          hours: totalDT,
          rate: rate.dtRate,
          amount: totalDT * rate.dtRate,
          category: 'labor-dt'
        });
      }
    });

    return items;
  }, [selectedTs, laborRates]);

  const laborTotal = invoiceItems.reduce((sum, i) => sum + i.amount, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Select value={selectedTimesheetId} onValueChange={setSelectedTimesheetId}>
            <SelectTrigger className="w-[350px]">
              <SelectValue placeholder="Select a timesheet to generate invoice" />
            </SelectTrigger>
            <SelectContent>
              {timesheets.map(ts => (
                <SelectItem key={ts.id} value={ts.id}>
                  {ts.crewName} - Week Ending {ts.weekEnding}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {selectedTs && (
          <Button variant="outline" size="sm">
            <Printer className="h-4 w-4 mr-1" /> Print Invoice
          </Button>
        )}
      </div>

      {selectedTs ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Receipt className="h-5 w-5 text-emerald-500" />
                  Invoice - {selectedTs.crewName}
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Week Ending: {selectedTs.weekEnding} | {selectedTs.stormEvent} | {selectedTs.contractorCompany}
                </CardDescription>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-400">Invoice Total</p>
                <p className="text-3xl font-bold text-green-400">{formatCurrency(laborTotal)}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Users className="h-4 w-4" /> Labor Charges
                </h4>
                <div className="rounded-lg border border-slate-600 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-700/80 border-b border-slate-600">
                        <TableHead className="font-semibold text-white">Description</TableHead>
                        <TableHead className="font-semibold text-white">Classification</TableHead>
                        <TableHead className="text-right font-semibold text-white">Hours</TableHead>
                        <TableHead className="text-right font-semibold text-white">Rate</TableHead>
                        <TableHead className="text-right font-semibold text-white">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoiceItems.map((item, idx) => (
                        <TableRow key={idx} className="hover:bg-slate-700/40 border-b border-slate-700">
                          <TableCell className="font-medium text-white">{item.description}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="text-xs">{item.classification}</Badge>
                          </TableCell>
                          <TableCell className="text-right font-mono text-slate-200">{item.hours.toFixed(1)}</TableCell>
                          <TableCell className="text-right font-mono text-emerald-300">{formatCurrency(item.rate)}</TableCell>
                          <TableCell className="text-right font-mono font-semibold text-green-400">{formatCurrency(item.amount)}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-slate-700/80 font-semibold border-t-2 border-slate-500">
                        <TableCell colSpan={4} className="text-right text-white">Labor Subtotal:</TableCell>
                        <TableCell className="text-right font-mono text-green-400 text-lg">
                          {formatCurrency(laborTotal)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="rounded-lg border-2 border-green-500/30 bg-green-500/5 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-semibold">Invoice Grand Total</p>
                    <p className="text-sm text-slate-400">All labor charges for the period</p>
                  </div>
                  <p className="text-3xl font-bold text-green-400">{formatCurrency(laborTotal)}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <Receipt className="h-14 w-14 mx-auto text-slate-500 mb-3" />
            <h3 className="text-lg font-semibold mb-1">Generate Invoice</h3>
            <p className="text-slate-400">Select a timesheet above to automatically generate an invoice from the recorded hours and rates</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function OverviewTab() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Satellite className="h-5 w-5" />
            AI Monitor Features
          </CardTitle>
          <CardDescription className="text-slate-400">Digital field verification replacing manual monitors</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { title: 'Geofenced Work Zones', desc: 'GPS verification within assigned areas' },
            { title: 'Before/After Photo AI', desc: 'Automated photo validation & consistency' },
            { title: 'Equipment Telematics', desc: 'Engine hours match billing automatically' },
            { title: 'Span-Based Logging', desc: 'Work tied to specific locations, not hours' },
          ].map(item => (
            <div key={item.title} className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <p className="font-medium text-white">{item.title}</p>
                <p className="text-sm text-slate-400">{item.desc}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Brain className="h-5 w-5" />
            Fraud Detection
          </CardTitle>
          <CardDescription className="text-slate-400">AI-powered anomaly and conflict detection</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { title: 'Duplicate Detection', desc: 'Same location, photos, or tickets flagged' },
            { title: 'Impossible Travel', desc: 'GPS route timing validation' },
            { title: 'Cross-Contract Conflicts', desc: 'Worker/equipment on multiple jobs' },
            { title: 'Rate Violations', desc: 'Auto-check against contract rates' },
          ].map(item => (
            <div key={item.title} className="flex items-start gap-3">
              <Target className="h-5 w-5 text-blue-500 mt-0.5" />
              <div>
                <p className="font-medium text-white">{item.title}</p>
                <p className="text-sm text-slate-400">{item.desc}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <FileText className="h-5 w-5" />
            Compliance
          </CardTitle>
          <CardDescription className="text-slate-400">One-click audit defense documentation</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { title: 'PW-Ready Packets', desc: 'Project Worksheet aligned exports' },
            { title: 'Immutable Audit Trail', desc: 'Tamper-evident change logging' },
            { title: 'T&M Cap Monitoring', desc: '70-hour cap compliance alerts' },
            { title: 'Chain of Custody', desc: 'Full debris tracking with GPS' },
          ].map(item => (
            <div key={item.title} className="flex items-start gap-3">
              <Zap className="h-5 w-5 text-yellow-500 mt-0.5" />
              <div>
                <p className="font-medium text-white">{item.title}</p>
                <p className="text-sm text-slate-400">{item.desc}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

const DEFAULT_ROSTER: RosterMember[] = [
  { id: '1', fullName: 'Brian Wise', classification: 'General Foreman', phone: '706-351-2436', email: 'bwwise38@gmail.com', crew: 'Crew 1', stateId: '', crewNumber: '1', mobilizedDate: '2026-01-25', startWorkDate: '2026-01-26', company: 'Strategic Land Management', equipmentAssigned: 'Bucket Truck', lastDayOnJob: '' },
  { id: '2', fullName: 'Richard Hernandez', classification: 'Trimmer A', phone: '706-571-5895', email: '', crew: 'Crew 1', stateId: '', crewNumber: '1', mobilizedDate: '2026-01-25', startWorkDate: '2026-01-26', company: 'Strategic Land Management', equipmentAssigned: '', lastDayOnJob: '' },
  { id: '3', fullName: 'Johnny Person', classification: 'Equipment Operator', phone: '706-840-8579', email: '', crew: 'Crew 1', stateId: '', crewNumber: '1', mobilizedDate: '2026-01-25', startWorkDate: '2026-01-26', company: 'Strategic Land Management', equipmentAssigned: '', lastDayOnJob: '' },
  { id: '4', fullName: 'Keith J. Ferrell', classification: 'Foreman A', phone: '706-341-6460', email: 'keithferrell118@gmail.com', crew: 'Crew 2', stateId: '', crewNumber: '2', mobilizedDate: '2026-01-26', startWorkDate: '2026-01-26', company: 'Strategic Land Management', equipmentAssigned: 'Bucket Truck', lastDayOnJob: '' },
  { id: '5', fullName: 'Rayden Jerrigan', classification: 'Equipment Operator', phone: '734-739-0328', email: 'williehurst589@gmail.com', crew: 'Crew 2', stateId: '', crewNumber: '2', mobilizedDate: '2026-01-26', startWorkDate: '2026-01-26', company: 'Strategic Land Management', equipmentAssigned: '', lastDayOnJob: '' },
  { id: '6', fullName: 'Jose Dilenardo', classification: 'Trimmer A', phone: '762-241-7433', email: 'ethanlakeman@gmail.com', crew: 'Crew 2', stateId: '', crewNumber: '2', mobilizedDate: '2026-01-25', startWorkDate: '2026-01-26', company: 'Strategic Land Management', equipmentAssigned: '', lastDayOnJob: '' },
  { id: '7', fullName: 'Will Peebles', classification: 'Foreman A', phone: '762-241-8246', email: 'willpeebles247@gmail.com', crew: 'Crew 3', stateId: '', crewNumber: '3', mobilizedDate: '2026-01-26', startWorkDate: '2026-01-26', company: 'Strategic Land Management', equipmentAssigned: 'Bucket Truck', lastDayOnJob: '' },
  { id: '8', fullName: 'Damon Williamson', classification: 'Equipment Operator', phone: '706-392-6632', email: 'williamsondamon844@gmail.com', crew: 'Crew 3', stateId: '', crewNumber: '3', mobilizedDate: '2026-01-25', startWorkDate: '2026-01-26', company: 'Strategic Land Management', equipmentAssigned: '', lastDayOnJob: '' },
  { id: '9', fullName: 'Joel Perez', classification: 'Trimmer A', phone: '762-580-5558', email: '', crew: 'Crew 3', stateId: '', crewNumber: '3', mobilizedDate: '2026-01-26', startWorkDate: '2026-01-26', company: 'Strategic Land Management', equipmentAssigned: '', lastDayOnJob: '' },
  { id: '10', fullName: 'Tim G. Hurst', classification: 'Foreman A', phone: '706-571-5895', email: 'hurst0902@gmail.com', crew: 'Crew 4', stateId: '', crewNumber: '4', mobilizedDate: '2026-01-25', startWorkDate: '2026-01-26', company: 'Strategic Land Management', equipmentAssigned: 'Bucket Truck', lastDayOnJob: '' },
  { id: '11', fullName: 'Kenneth Robbins', classification: 'Equipment Operator', phone: '706-786-7995', email: '', crew: 'Crew 4', stateId: '', crewNumber: '4', mobilizedDate: '2026-01-25', startWorkDate: '2026-01-26', company: 'Strategic Land Management', equipmentAssigned: '', lastDayOnJob: '' },
  { id: '12', fullName: 'Johnny Williams', classification: 'Trimmer A', phone: '706-786-7992', email: '', crew: 'Crew 4', stateId: '', crewNumber: '4', mobilizedDate: '2026-01-25', startWorkDate: '2026-01-26', company: 'Strategic Land Management', equipmentAssigned: '', lastDayOnJob: '' },
];

const DEFAULT_CONTRACT_INFO: ContractInfo = {
  agencyType: '', grantProgram: '',
  primeContractor: '', subContractor: 'Strategic Land Management', contractNumber: '',
  taskOrder: '', femaDisasterNumber: '', femaRegion: '', projectWorksheetNumber: '',
  incidentNumber: '', incidentType: '', declarationDate: '', declarationTitle: '',
  stateOfEmergency: '', county: '', workLocation: '', scopeOfWork: '',
  contractStartDate: '', contractEndDate: '', mobilizationDate: '', demobilizationDate: '',
  projectManager: '', projectManagerPhone: '', femaMonitor: '', femaMonitorPhone: '',
  osrRepresentative: '', osrPhone: '', applicantName: '', applicantPOC: '', applicantPhone: '',
};

function mapDbContractInfo(row: any): ContractInfo {
  return {
    agencyType: row.agency_type || '', grantProgram: row.grant_program || '',
    primeContractor: row.prime_contractor || '', subContractor: row.sub_contractor || '',
    contractNumber: row.contract_number || '', taskOrder: row.task_order || '',
    femaDisasterNumber: row.fema_disaster_number || '', femaRegion: row.fema_region || '',
    projectWorksheetNumber: row.project_worksheet_number || '', incidentNumber: row.incident_number || '',
    incidentType: row.incident_type || '', declarationDate: row.declaration_date || '',
    declarationTitle: row.declaration_title || '', stateOfEmergency: row.state_of_emergency || '',
    county: row.county || '', workLocation: row.work_location || '', scopeOfWork: row.scope_of_work || '',
    contractStartDate: row.contract_start_date || '', contractEndDate: row.contract_end_date || '',
    mobilizationDate: row.mobilization_date || '', demobilizationDate: row.demobilization_date || '',
    projectManager: row.project_manager || '', projectManagerPhone: row.project_manager_phone || '',
    femaMonitor: row.fema_monitor || '', femaMonitorPhone: row.fema_monitor_phone || '',
    osrRepresentative: row.osr_representative || '', osrPhone: row.osr_phone || '',
    applicantName: row.applicant_name || '', applicantPOC: row.applicant_poc || '',
    applicantPhone: row.applicant_phone || '',
  };
}

function mapDbRoster(row: any): RosterMember {
  return {
    id: row.id, fullName: row.full_name, classification: row.classification,
    phone: row.phone || '', email: row.email || '', crew: row.crew || 'Crew 1',
    stateId: row.state_id || '', crewNumber: row.crew_number || '',
    mobilizedDate: row.mobilized_date || '', startWorkDate: row.start_work_date || '',
    company: row.company || '', equipmentAssigned: row.equipment_assigned || '',
    lastDayOnJob: row.last_day_on_job || '',
  };
}

function mapDbLaborRate(row: any): LaborRate {
  return { id: row.id, classification: row.classification, stRate: parseFloat(row.st_rate) || 0, otRate: parseFloat(row.ot_rate) || 0, dtRate: parseFloat(row.dt_rate) || 0 };
}

function mapDbEquipmentRate(row: any): EquipmentRate {
  return { id: row.id, equipmentName: row.equipment_name, equipmentId: row.equipment_id_code || '', hourlyRate: parseFloat(row.hourly_rate) || 0 };
}

function mapDbTimesheet(row: any): TimesheetWeek {
  const entries = typeof row.entries === 'string' ? JSON.parse(row.entries) : row.entries;
  return { id: row.id, crewName: row.crew_name, weekEnding: row.week_ending, stormEvent: row.storm_event || '', contractorCompany: row.contractor_company || '', foremanName: row.foreman_name || '', entries: entries || [] };
}

async function autoSave(endpoint: string, body: any) {
  try {
    await apiRequest(`/api/fema-data/${endpoint}`, 'POST', body);
  } catch (err) {
    console.error(`Auto-save failed for ${endpoint}:`, err);
  }
}

export default function FemaAuditDashboard() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("contract");
  const [dataLoaded, setDataLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [aiScanRunning, setAiScanRunning] = useState(false);
  const [aiScanResults, setAiScanResults] = useState<any>(null);
  const [showAiResults, setShowAiResults] = useState(false);
  const [exporting, setExporting] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [laborRates, setLaborRates] = useState<LaborRate[]>(DEFAULT_LABOR_RATES);
  const [equipmentRates, setEquipmentRates] = useState<EquipmentRate[]>(DEFAULT_EQUIPMENT_RATES);
  const [roster, setRoster] = useState<RosterMember[]>(DEFAULT_ROSTER);
  const [timesheets, setTimesheets] = useState<TimesheetWeek[]>([]);
  const [contractInfo, setContractInfo] = useState<ContractInfo>(DEFAULT_CONTRACT_INFO);
  const [loadTickets, setLoadTickets] = useState<LoadTicket[]>([]);
  const [equipmentLogEntries, setEquipmentLogEntries] = useState<EquipmentLogEntry[]>([]);
  const [signInRecords, setSignInRecords] = useState<SignInRecord[]>([]);
  const [monitorEntries, setMonitorEntries] = useState<MonitorLogEntry[]>([]);
  const [dailyActivities, setDailyActivities] = useState<DailyActivity[]>([]);
  const [truckCerts, setTruckCerts] = useState<TruckCert[]>([]);
  const [leanerHangerEntries, setLeanerHangerEntries] = useState<LeanerHangerEntry[]>([]);
  const [subcontractors, setSubcontractors] = useState<SubcontractorProfile[]>([]);
  const [workPhotos, setWorkPhotos] = useState<UploadedPhoto[]>([]);
  const [jobEntries, setJobEntries] = useState<JobEntry[]>([]);

  useEffect(() => {
    async function loadAllData() {
      try {
        const [ciRes, lrRes, erRes, rosterRes, tsRes, siRes, daRes, tcRes, lhRes, subRes, jeRes, ltRes, elRes, mnRes] = await Promise.all([
          fetch('/api/fema-data/contract-info').then(r => r.json()).catch(() => ({ success: false })),
          fetch('/api/fema-data/labor-rates').then(r => r.json()).catch(() => ({ success: false })),
          fetch('/api/fema-data/equipment-rates').then(r => r.json()).catch(() => ({ success: false })),
          fetch('/api/fema-data/roster').then(r => r.json()).catch(() => ({ success: false })),
          fetch('/api/fema-data/timesheets').then(r => r.json()).catch(() => ({ success: false })),
          fetch('/api/fema-data/sign-in-records').then(r => r.json()).catch(() => ({ success: false })),
          fetch('/api/fema-data/daily-activities').then(r => r.json()).catch(() => ({ success: false })),
          fetch('/api/fema-data/truck-certs').then(r => r.json()).catch(() => ({ success: false })),
          fetch('/api/fema-data/leaner-hanger').then(r => r.json()).catch(() => ({ success: false })),
          fetch('/api/fema-data/subcontractors').then(r => r.json()).catch(() => ({ success: false })),
          fetch('/api/fema-data/job-entries').then(r => r.json()).catch(() => ({ success: false })),
          fetch('/api/fema-data/load-tickets').then(r => r.json()).catch(() => ({ success: false })),
          fetch('/api/fema-data/equipment-log-entries').then(r => r.json()).catch(() => ({ success: false })),
          fetch('/api/fema-data/monitor-entries').then(r => r.json()).catch(() => ({ success: false })),
        ]);
        if (ciRes.success && ciRes.contractInfo) setContractInfo(mapDbContractInfo(ciRes.contractInfo));
        if (lrRes.success && lrRes.laborRates?.length > 0) setLaborRates(lrRes.laborRates.map(mapDbLaborRate));
        if (erRes.success && erRes.equipmentRates?.length > 0) setEquipmentRates(erRes.equipmentRates.map(mapDbEquipmentRate));
        if (rosterRes.success && rosterRes.roster?.length > 0) setRoster(rosterRes.roster.map(mapDbRoster));
        if (tsRes.success && tsRes.timesheets?.length > 0) setTimesheets(tsRes.timesheets.map(mapDbTimesheet));
        if (daRes.success && daRes.activities?.length > 0) setDailyActivities(daRes.activities);
        if (tcRes.success && tcRes.certs?.length > 0) setTruckCerts(tcRes.certs);
        if (lhRes.success && lhRes.entries?.length > 0) setLeanerHangerEntries(lhRes.entries);
        if (subRes.success && subRes.subcontractors?.length > 0) setSubcontractors(subRes.subcontractors);
        if (jeRes.success && jeRes.jobEntries?.length > 0) setJobEntries(jeRes.jobEntries);
        if (ltRes.success && ltRes.tickets?.length > 0) setLoadTickets(ltRes.tickets);
        if (elRes.success && elRes.entries?.length > 0) setEquipmentLogEntries(elRes.entries);
        if (mnRes.success && mnRes.entries?.length > 0) setMonitorEntries(mnRes.entries);
        setDataLoaded(true);
      } catch (err) {
        console.error('Failed to load FEMA data:', err);
        setDataLoaded(true);
      }
    }
    loadAllData();
  }, []);

  const debouncedSave = useCallback((endpoint: string, body: any) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      setSaving(true);
      await autoSave(endpoint, body);
      setSaving(false);
    }, 1500);
  }, []);

  const handleSetContractInfo = useCallback((info: ContractInfo) => {
    setContractInfo(info);
    debouncedSave('contract-info', info);
  }, [debouncedSave]);

  const handleSetLaborRates = useCallback((rates: LaborRate[]) => {
    setLaborRates(rates);
    debouncedSave('labor-rates', { rates });
  }, [debouncedSave]);

  const handleSetEquipmentRates = useCallback((rates: EquipmentRate[]) => {
    setEquipmentRates(rates);
    debouncedSave('equipment-rates', { rates });
  }, [debouncedSave]);

  const handleSetRoster = useCallback((members: RosterMember[]) => {
    setRoster(members);
    debouncedSave('roster', { members });
  }, [debouncedSave]);

  const handleSetTimesheets = useCallback((ts: TimesheetWeek[]) => {
    setTimesheets(ts);
    debouncedSave('timesheets', { timesheets: ts });
  }, [debouncedSave]);

  const handleSetSignInRecords = useCallback((records: SignInRecord[]) => {
    setSignInRecords(records);
    debouncedSave('sign-in-records', { records });
  }, [debouncedSave]);

  const handleSetDailyActivities = useCallback((activities: DailyActivity[]) => {
    setDailyActivities(activities);
    debouncedSave('daily-activities', { activities });
  }, [debouncedSave]);

  const handleSetTruckCerts = useCallback((certs: TruckCert[]) => {
    setTruckCerts(certs);
    debouncedSave('truck-certs', { certs });
  }, [debouncedSave]);

  const handleSetLeanerHanger = useCallback((entries: LeanerHangerEntry[]) => {
    setLeanerHangerEntries(entries);
    debouncedSave('leaner-hanger', { entries });
  }, [debouncedSave]);

  const handleSetSubcontractors = useCallback((subs: SubcontractorProfile[]) => {
    setSubcontractors(subs);
    debouncedSave('subcontractors', { subcontractors: subs });
  }, [debouncedSave]);

  const handleSetLoadTickets = useCallback((tickets: LoadTicket[]) => {
    setLoadTickets(tickets);
    debouncedSave('load-tickets', { tickets });
  }, [debouncedSave]);

  const handleSetEquipmentLog = useCallback((entries: EquipmentLogEntry[]) => {
    setEquipmentLogEntries(entries);
    debouncedSave('equipment-log-entries', { entries });
  }, [debouncedSave]);

  const handleSetMonitorEntries = useCallback((entries: MonitorLogEntry[]) => {
    setMonitorEntries(entries);
    debouncedSave('monitor-entries', { entries });
  }, [debouncedSave]);

  const handleSetJobEntries = useCallback((entries: JobEntry[]) => {
    setJobEntries(entries);
    debouncedSave('job-entries', { entries });
  }, [debouncedSave]);

  const runAiScan = useCallback(async () => {
    setAiScanRunning(true);
    try {
      const data = await apiRequest('/api/fema-data/ai-scan', 'POST', {});
      if (data.success) {
        setAiScanResults(data);
        setShowAiResults(true);
        toast({ title: `AI Scan Complete`, description: `Found ${data.totalFindings} findings. Risk score: ${data.riskScore}/100` });
      } else {
        toast({ title: "AI Scan Failed", description: data.error, variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "AI Scan Error", description: "Failed to run AI scan", variant: "destructive" });
    }
    setAiScanRunning(false);
  }, [toast]);

  const exportAuditPacket = useCallback(async () => {
    setExporting(true);
    try {
      const data = await apiRequest('/api/fema-data/export-audit-packet', 'POST', {});
      if (data.success) {
        const blob = new Blob([JSON.stringify(data.packet, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `FEMA_Audit_Packet_${data.packet.exportDate}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast({ title: "Audit Packet Exported", description: `Full compliance package generated with ${Object.keys(data.packet.sections).length} sections` });
      } else {
        toast({ title: "Export Failed", description: data.error, variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Export Error", description: "Failed to export audit packet", variant: "destructive" });
    }
    setExporting(false);
  }, [toast]);

  const NAV_SECTIONS = [
    { id: 'contract', label: 'Contract Setup', icon: Building2, group: 'Setup' },
    { id: 'rate-sheet', label: 'Rate Sheet', icon: DollarSign, group: 'Setup' },
    { id: 'job-tracker', label: 'Job Tracker', icon: Briefcase, group: 'Jobs' },
    { id: 'roster', label: 'Roster', icon: Users, group: 'Labor' },
    { id: 'signin', label: 'Sign-In/Out', icon: UserPlus, group: 'Labor' },
    { id: 'timesheet', label: 'Timesheet', icon: ClipboardList, group: 'Labor' },
    { id: 'activity', label: 'Daily Activity', icon: FileText, group: 'Field' },
    { id: 'equipment-log', label: 'Equipment Log', icon: Wrench, group: 'Field' },
    { id: 'photos', label: 'Photos', icon: Camera, group: 'Field' },
    { id: 'load-tickets', label: 'Load Tickets', icon: Truck, group: 'Debris' },
    { id: 'truck-cert', label: 'Truck Cert', icon: Truck, group: 'Debris' },
    { id: 'leaner-hanger', label: 'Leaner/Hanger', icon: Target, group: 'Debris' },
    { id: 'monitor', label: 'Monitor Log', icon: Eye, group: 'Oversight' },
    { id: 'sub-risk', label: 'Sub Risk', icon: AlertTriangle, group: 'Oversight' },
    { id: 'gps', label: 'GPS Tracking', icon: Navigation, group: 'GPS' },
    { id: 'ai-verify', label: 'AI Verify', icon: Brain, group: 'AI' },
    { id: 'invoice', label: 'Invoice', icon: Receipt, group: 'Billing' },
    { id: 'documents', label: 'Documents', icon: FolderOpen, group: 'Docs' },
    { id: 'comms', label: 'Communications', icon: MessageSquare, group: 'Docs' },
    { id: 'compliance', label: 'Compliance', icon: Shield, group: 'Audit' },
  ];

  const groups = [...new Set(NAV_SECTIONS.map(s => s.group))];

  return (
    <ModuleWrapper moduleId="fema-audit">
      <div className="container mx-auto px-4 py-6 space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2 text-white">
              <Shield className="h-7 w-7 text-blue-500" />
              AuditShield Grant & Contract Compliance AI
            </h1>
            <p className="text-slate-400">Multi-agency compliance for FEMA, USACE, HUD, DOT, State & private contracts — AI-powered fraud detection & audit export</p>
          </div>
          <div className="flex gap-2 items-center">
            {saving && <Badge variant="outline" className="text-yellow-400 border-yellow-400 animate-pulse text-xs">Saving...</Badge>}
            {dataLoaded && <Badge variant="outline" className="text-green-400 border-green-400 text-xs">DB Connected</Badge>}
            <Button variant="outline" size="sm" onClick={runAiScan} disabled={aiScanRunning}>
              <Brain className="h-4 w-4 mr-2" />
              {aiScanRunning ? 'Scanning...' : 'Run AI Scan'}
            </Button>
            <Button size="sm" onClick={exportAuditPacket} disabled={exporting}>
              <Download className="h-4 w-4 mr-2" />
              {exporting ? 'Exporting...' : 'Export Audit Packet'}
            </Button>
          </div>
        </div>

        <div className="flex gap-1.5 flex-wrap border-b border-slate-700 pb-3">
          {groups.map(group => (
            <div key={group} className="flex items-center gap-0.5">
              <span className="text-[10px] text-slate-500 uppercase tracking-wide mr-1 hidden md:inline">{group}</span>
              {NAV_SECTIONS.filter(s => s.group === group).map(section => (
                <Button
                  key={section.id}
                  size="sm"
                  variant={activeTab === section.id ? "default" : "ghost"}
                  className={`h-8 text-xs px-2.5 ${activeTab === section.id ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                  onClick={() => setActiveTab(section.id)}
                >
                  <section.icon className="h-3.5 w-3.5 mr-1" />
                  <span className="hidden lg:inline">{section.label}</span>
                </Button>
              ))}
              {group !== groups[groups.length - 1] && <div className="w-px h-6 bg-slate-700 mx-1 hidden md:block" />}
            </div>
          ))}
        </div>

        {showAiResults && aiScanResults && (
          <Dialog open={showAiResults} onOpenChange={setShowAiResults}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-blue-500" />
                  AI Compliance Scan Results
                </DialogTitle>
                <DialogDescription>
                  Scanned on {new Date(aiScanResults.scanDate).toLocaleString()}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-4 gap-3">
                  <div className="text-center p-3 rounded-lg bg-slate-800">
                    <div className="text-2xl font-bold text-white">{aiScanResults.riskScore}</div>
                    <div className="text-xs text-slate-400">Risk Score</div>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-red-900/30">
                    <div className="text-2xl font-bold text-red-400">{aiScanResults.criticalCount}</div>
                    <div className="text-xs text-slate-400">Critical</div>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-orange-900/30">
                    <div className="text-2xl font-bold text-orange-400">{aiScanResults.highCount}</div>
                    <div className="text-xs text-slate-400">High</div>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-yellow-900/30">
                    <div className="text-2xl font-bold text-yellow-400">{aiScanResults.mediumCount}</div>
                    <div className="text-xs text-slate-400">Medium</div>
                  </div>
                </div>
                <div className="space-y-2">
                  {aiScanResults.findings.map((f: any, i: number) => (
                    <div key={i} className="flex items-start gap-2 p-2 rounded bg-slate-800">
                      <Badge variant={f.severity === 'critical' ? 'destructive' : f.severity === 'high' ? 'default' : 'secondary'} className="text-xs shrink-0 mt-0.5">
                        {f.severity}
                      </Badge>
                      <div>
                        <p className="text-sm text-white">{f.description}</p>
                        <p className="text-xs text-slate-400">{f.category}</p>
                      </div>
                    </div>
                  ))}
                  {aiScanResults.findings.length === 0 && (
                    <div className="text-center py-6 text-green-400">
                      <CheckCircle2 className="h-8 w-8 mx-auto mb-2" />
                      <p>No compliance issues found</p>
                    </div>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        <div className="mt-4">
          {activeTab === 'contract' && (
            <ContractSetupComponent contractInfo={contractInfo} setContractInfo={handleSetContractInfo} />
          )}
          {activeTab === 'rate-sheet' && (
            <RateSheetTab
              laborRates={laborRates} setLaborRates={handleSetLaborRates}
              equipmentRates={equipmentRates} setEquipmentRates={handleSetEquipmentRates}
            />
          )}
          {activeTab === 'job-tracker' && (
            <JobTrackerComponent
              jobs={jobEntries} setJobs={handleSetJobEntries}
              laborRates={laborRates} equipmentRates={equipmentRates}
              setLaborRates={handleSetLaborRates} setEquipmentRates={handleSetEquipmentRates}
            />
          )}
          {activeTab === 'roster' && (
            <RosterTab roster={roster} setRoster={handleSetRoster} laborRates={laborRates} />
          )}
          {activeTab === 'signin' && (
            <DailySignInComponent records={signInRecords} setRecords={handleSetSignInRecords} roster={roster} />
          )}
          {activeTab === 'timesheet' && (
            <TimesheetTab
              timesheets={timesheets} setTimesheets={handleSetTimesheets}
              roster={roster} laborRates={laborRates}
            />
          )}
          {activeTab === 'activity' && (
            <DailyActivityComponent activities={dailyActivities} setActivities={handleSetDailyActivities}
              contractPW={contractInfo.projectWorksheetNumber} contractIncident={contractInfo.incidentNumber} />
          )}
          {activeTab === 'equipment-log' && (
            <EquipmentLogComponent entries={equipmentLogEntries} setEntries={handleSetEquipmentLog}
              equipmentRates={equipmentRates} contractPW={contractInfo.projectWorksheetNumber} contractIncident={contractInfo.incidentNumber} />
          )}
          {activeTab === 'load-tickets' && (
            <LoadTicketsComponent loadTickets={loadTickets} setLoadTickets={handleSetLoadTickets}
              contractPW={contractInfo.projectWorksheetNumber} contractIncident={contractInfo.incidentNumber} />
          )}
          {activeTab === 'truck-cert' && (
            <TruckCertComponent certs={truckCerts} setCerts={handleSetTruckCerts} />
          )}
          {activeTab === 'monitor' && (
            <MonitorLogComponent entries={monitorEntries} setEntries={handleSetMonitorEntries}
              contractPW={contractInfo.projectWorksheetNumber} />
          )}
          {activeTab === 'gps' && (
            <GPSTrackingComponent />
          )}
          {activeTab === 'invoice' && (
            <InvoiceTab timesheets={timesheets} laborRates={laborRates} equipmentRates={equipmentRates} />
          )}
          {activeTab === 'photos' && (
            <PhotoUploadComponent photos={workPhotos} setPhotos={setWorkPhotos} category="Work Documentation" maxPhotos={50} />
          )}
          {activeTab === 'leaner-hanger' && (
            <LeanerHangerTrackerComponent entries={leanerHangerEntries} setEntries={handleSetLeanerHanger}
              contractPW={contractInfo.projectWorksheetNumber} />
          )}
          {activeTab === 'sub-risk' && (
            <SubcontractorRiskComponent subs={subcontractors} setSubs={handleSetSubcontractors} />
          )}
          {activeTab === 'ai-verify' && (
            <AIVerificationEngineComponent
              laborHours={timesheets.reduce((sum, ts) => sum + ts.entries.reduce((s, e) => s + Object.values(e.days).reduce((d, day) => d + day.stHrs + day.otHrs + day.dtHrs, 0), 0), 0)}
              equipmentHours={equipmentLogEntries.reduce((s, e) => s + (e.hoursUsed || 0), 0)}
              loadTicketCount={loadTickets.length}
              totalCY={loadTickets.reduce((s, t) => s + t.cubicYards, 0)}
              truckCount={truckCerts.length}
              avgTruckCapacity={truckCerts.length > 0 ? truckCerts.reduce((s, t) => s + (t.capacityCY || 0), 0) / truckCerts.length : 30}
              rosterCount={roster.length}
              gpsActiveCount={6}
              signInCount={signInRecords.length}
              monitorVisitCount={monitorEntries.length}
              photoCount={workPhotos.length + dailyActivities.reduce((s, a) => s + (a.photosBeforeCount || 0) + (a.photosAfterCount || 0), 0)}
              impossibleTravelFlags={1}
              duplicateFlags={0}
            />
          )}
          {activeTab === 'documents' && (
            <ContractDocumentsComponent />
          )}
          {activeTab === 'comms' && (
            <ProjectCommunicationsComponent />
          )}
          {activeTab === 'compliance' && (
            <ComplianceDashboardComponent
              hasContract={!!(contractInfo.projectWorksheetNumber && contractInfo.femaDisasterNumber)}
              rosterCount={roster.length}
              timesheetCount={timesheets.length}
              loadTicketCount={loadTickets.length}
              equipmentLogCount={equipmentLogEntries.length}
              signInCount={signInRecords.length}
              monitorVisitCount={monitorEntries.length}
              activityReportCount={dailyActivities.length}
              truckCertCount={truckCerts.length}
              geofenceCount={4}
              gpsActiveCount={6}
              impossibleTravelFlags={1}
              duplicateFlags={0}
            />
          )}
        </div>
      </div>
    </ModuleWrapper>
  );
}