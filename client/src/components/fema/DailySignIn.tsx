import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, MapPin, Clock, CheckCircle2, XCircle, Plus, Trash2, Navigation } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export interface SignInRecord {
  id: string;
  date: string;
  workerName: string;
  classification: string;
  crew: string;
  signInTime: string;
  signInGPS: string;
  signOutTime: string;
  signOutGPS: string;
  signedIn: boolean;
  signedOut: boolean;
  hoursWorked: number;
  notes: string;
}

interface RosterMember {
  id: string;
  fullName: string;
  classification: string;
  crew: string;
}

function generateId() { return Math.random().toString(36).substring(2, 11); }

export default function DailySignIn({ records, setRecords, roster }: {
  records: SignInRecord[];
  setRecords: (r: SignInRecord[]) => void;
  roster: RosterMember[];
}) {
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedCrew, setSelectedCrew] = useState('all');

  const crews = [...new Set(roster.map(m => m.crew))].sort();
  const dateRecords = records.filter(r => r.date === selectedDate && (selectedCrew === 'all' || r.crew === selectedCrew));

  const signInAll = () => {
    const now = new Date().toTimeString().slice(0, 5);
    const crewMembers = selectedCrew === 'all' ? roster : roster.filter(m => m.crew === selectedCrew);
    const existing = records.filter(r => r.date === selectedDate);
    const existingNames = new Set(existing.map(r => r.workerName));
    const newRecords = crewMembers
      .filter(m => !existingNames.has(m.fullName))
      .map(m => ({
        id: generateId(),
        date: selectedDate,
        workerName: m.fullName,
        classification: m.classification,
        crew: m.crew,
        signInTime: now,
        signInGPS: '',
        signOutTime: '',
        signOutGPS: '',
        signedIn: true,
        signedOut: false,
        hoursWorked: 0,
        notes: '',
      }));
    setRecords([...records, ...newRecords]);
    toast({ title: "Crew signed in", description: `${newRecords.length} members signed in at ${now}` });
  };

  const signOut = (id: string) => {
    const now = new Date().toTimeString().slice(0, 5);
    setRecords(records.map(r => {
      if (r.id === id) {
        const inTime = r.signInTime.split(':').map(Number);
        const outTime = now.split(':').map(Number);
        const hours = (outTime[0] * 60 + outTime[1] - inTime[0] * 60 - inTime[1]) / 60;
        return { ...r, signOutTime: now, signedOut: true, hoursWorked: Math.max(0, parseFloat(hours.toFixed(1))) };
      }
      return r;
    }));
  };

  const signOutAll = () => {
    const now = new Date().toTimeString().slice(0, 5);
    setRecords(records.map(r => {
      if (r.date === selectedDate && r.signedIn && !r.signedOut && (selectedCrew === 'all' || r.crew === selectedCrew)) {
        const inTime = r.signInTime.split(':').map(Number);
        const outTime = now.split(':').map(Number);
        const hours = (outTime[0] * 60 + outTime[1] - inTime[0] * 60 - inTime[1]) / 60;
        return { ...r, signOutTime: now, signedOut: true, hoursWorked: Math.max(0, parseFloat(hours.toFixed(1))) };
      }
      return r;
    }));
    toast({ title: "All signed out", description: `Crew signed out at ${now}` });
  };

  const activeCount = dateRecords.filter(r => r.signedIn && !r.signedOut).length;
  const totalHours = dateRecords.reduce((sum, r) => sum + r.hoursWorked, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-green-400" />
            Daily Crew Sign-In / Sign-Out
          </h3>
          <p className="text-sm text-slate-400">GPS-verified crew attendance with timestamps — required for FEMA labor documentation</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={signInAll}>
            <CheckCircle2 className="h-4 w-4 mr-1" /> Sign In All
          </Button>
          <Button size="sm" variant="outline" onClick={signOutAll}>
            <XCircle className="h-4 w-4 mr-1" /> Sign Out All
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div>
          <Label className="text-xs text-slate-300">Date</Label>
          <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="h-8 w-44 text-sm" />
        </div>
        <div>
          <Label className="text-xs text-slate-300">Crew Filter</Label>
          <Select value={selectedCrew} onValueChange={setSelectedCrew}>
            <SelectTrigger className="h-8 w-36 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Crews</SelectItem>
              {crews.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-4 ml-auto">
          <div className="text-center">
            <p className="text-xs text-slate-400">Active</p>
            <p className="text-lg font-bold text-green-400">{activeCount}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-400">Signed In</p>
            <p className="text-lg font-bold text-white">{dateRecords.length}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-400">Total Hours</p>
            <p className="text-lg font-bold text-blue-400">{totalHours.toFixed(1)}</p>
          </div>
        </div>
      </div>

      {dateRecords.length > 0 ? (
        <div className="rounded-lg border border-slate-600 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-700/80 border-b border-slate-600">
                <TableHead className="text-white font-semibold">Name</TableHead>
                <TableHead className="text-white font-semibold">Classification</TableHead>
                <TableHead className="text-white font-semibold">Crew</TableHead>
                <TableHead className="text-white font-semibold text-center">Sign In</TableHead>
                <TableHead className="text-white font-semibold text-center">Sign In GPS</TableHead>
                <TableHead className="text-white font-semibold text-center">Sign Out</TableHead>
                <TableHead className="text-white font-semibold text-center">Sign Out GPS</TableHead>
                <TableHead className="text-white font-semibold text-right">Hours</TableHead>
                <TableHead className="text-white font-semibold text-center">Status</TableHead>
                <TableHead className="w-16"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dateRecords.map((rec) => (
                <TableRow key={rec.id} className="hover:bg-slate-700/40 border-b border-slate-700">
                  <TableCell className="font-medium text-white">{rec.workerName}</TableCell>
                  <TableCell><Badge variant="secondary" className="text-xs">{rec.classification}</Badge></TableCell>
                  <TableCell className="text-sm text-slate-200">{rec.crew}</TableCell>
                  <TableCell className="text-center font-mono text-sm text-green-300">{rec.signInTime || '-'}</TableCell>
                  <TableCell className="text-center text-xs text-slate-400">
                    {rec.signInGPS ? <span className="flex items-center gap-1 justify-center"><Navigation className="h-3 w-3 text-blue-400" />{rec.signInGPS}</span> : '-'}
                  </TableCell>
                  <TableCell className="text-center font-mono text-sm text-red-300">{rec.signOutTime || '-'}</TableCell>
                  <TableCell className="text-center text-xs text-slate-400">
                    {rec.signOutGPS ? <span className="flex items-center gap-1 justify-center"><Navigation className="h-3 w-3 text-green-400" />{rec.signOutGPS}</span> : '-'}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm text-blue-300">{rec.hoursWorked > 0 ? rec.hoursWorked.toFixed(1) : '-'}</TableCell>
                  <TableCell className="text-center">
                    {rec.signedIn && !rec.signedOut ? (
                      <Badge className="bg-green-600 text-xs">Active</Badge>
                    ) : rec.signedOut ? (
                      <Badge className="bg-slate-600 text-xs">Complete</Badge>
                    ) : (
                      <Badge className="bg-amber-600 text-xs">Pending</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {rec.signedIn && !rec.signedOut ? (
                      <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => signOut(rec.id)}>Sign Out</Button>
                    ) : (
                      <Button size="sm" variant="ghost" onClick={() => setRecords(records.filter(r => r.id !== rec.id))}>
                        <Trash2 className="h-3.5 w-3.5 text-red-400" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <Card className="border-dashed border-slate-600">
          <CardContent className="py-16 text-center">
            <UserPlus className="h-14 w-14 mx-auto text-slate-500 mb-3" />
            <h3 className="text-lg font-semibold text-white mb-1">No Sign-Ins for {selectedDate}</h3>
            <p className="text-slate-400 mb-4">Sign in crew members with GPS timestamps for FEMA labor documentation</p>
            <Button onClick={signInAll}>
              <CheckCircle2 className="h-4 w-4 mr-1" /> Sign In Crew
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
