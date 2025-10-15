import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, Plus, Trash2, RefreshCw, Bell, BellOff, Settings, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  listLocations,
  createLocation,
  deleteLocation,
  setAlert,
  getAlertsConfig,
  setAlertsConfig,
  checkAlerts,
  type LocationRow,
} from "@/lib/locationsApi";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

type ImpactResp = { impactScore: number };

function badgeColor(score: number) {
  if (score >= 70) return { color: "bg-red-500", text: "High Risk", textColor: "text-white" };
  if (score >= 40) return { color: "bg-yellow-500", text: "Elevated", textColor: "text-white" };
  return { color: "bg-green-500", text: "Low Risk", textColor: "text-white" };
}

async function getImpact(lat: number, lng: number): Promise<ImpactResp> {
  const u = new URL("/api/impact", window.location.origin);
  u.searchParams.set("lat", String(lat));
  u.searchParams.set("lng", String(lng));
  u.searchParams.set("pollen", "1");
  const r = await fetch(u.toString());
  if (!r.ok) throw new Error("impact");
  return r.json();
}

export default function Watchlist() {
  const { toast } = useToast();
  const [rows, setRows] = useState<LocationRow[]>([]);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [configOpen, setConfigOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  
  const [webhookUrl, setWebhookUrl] = useState("");
  const [defaultThreshold, setDefaultThreshold] = useState(70);

  const [form, setForm] = useState<LocationRow>({
    id: "",
    name: "",
    lat: 33.749,
    lng: -84.388,
    alert: false,
    threshold: undefined,
  });

  const refreshRows = async () => {
    try {
      const data = await listLocations();
      setRows(data);
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to load locations", variant: "destructive" });
    }
  };

  const refreshConfig = async () => {
    try {
      const cfg = await getAlertsConfig();
      setWebhookUrl(cfg.webhookUrl || "");
      setDefaultThreshold(cfg.defaultThreshold || 70);
    } catch {}
  };

  useEffect(() => {
    refreshRows();
    refreshConfig();
  }, []);

  const refreshScores = async () => {
    setBusy(true);
    setErr("");
    try {
      const out: Record<string, number> = {};
      for (const r of rows) {
        try {
          const j = await getImpact(r.lat, r.lng);
          out[r.id] = Math.round(j.impactScore || 0);
        } catch {
          out[r.id] = -1;
        }
      }
      setScores(out);
      toast({ title: "Success", description: "Impact scores refreshed" });
    } catch (e: any) {
      setErr(e.message || "refresh failed");
      toast({ title: "Error", description: e.message || "Failed to refresh scores", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (rows.length) refreshScores();
  }, [rows.map((r) => r.id).join(",")]);

  const avg = useMemo(() => {
    const vals = Object.values(scores).filter((v) => v >= 0);
    return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
  }, [scores]);

  const add = async () => {
    if (!form.id || !form.name) {
      toast({ title: "Error", description: "ID and name are required", variant: "destructive" });
      return;
    }
    try {
      await createLocation(form);
      setForm({ id: "", name: "", lat: 33.749, lng: -84.388, alert: false });
      await refreshRows();
      setAddOpen(false);
      toast({ title: "Success", description: `Location ${form.name} added` });
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to add location", variant: "destructive" });
    }
  };

  const remove = async (id: string) => {
    try {
      await deleteLocation(id);
      await refreshRows();
      toast({ title: "Success", description: "Location removed" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to remove location", variant: "destructive" });
    }
  };

  const toggleAlert = async (id: string, currentAlert: boolean, threshold?: number) => {
    try {
      await setAlert(id, !currentAlert, threshold);
      await refreshRows();
      toast({ title: "Success", description: `Alerts ${!currentAlert ? "enabled" : "disabled"}` });
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to toggle alert", variant: "destructive" });
    }
  };

  const saveConfig = async () => {
    try {
      await setAlertsConfig({ webhookUrl, defaultThreshold });
      setConfigOpen(false);
      toast({ title: "Success", description: "Alert configuration saved" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to save config", variant: "destructive" });
    }
  };

  const runCheck = async () => {
    try {
      const result = await checkAlerts();
      toast({
        title: "Alert Check Complete",
        description: `Checked ${result.checked} locations. Found ${result.results.filter((r: any) => r.score >= defaultThreshold).length} high-risk sites.`,
      });
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to check alerts", variant: "destructive" });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-6" data-testid="watchlist-page">
      {/* Back Button */}
      <div>
        <Link href="/">
          <motion.button
            whileHover={{ scale: 1.05, x: -2 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm border border-gray-200 text-gray-700 rounded-lg hover:bg-white hover:shadow-md transition-all duration-200 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300"
            data-testid="button-back-to-hub"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back to Hub</span>
          </motion.button>
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100" data-testid="heading-watchlist">
            📍 Location Watchlist
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Monitor impact scores and receive alerts for your key locations
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Dialog open={configOpen} onOpenChange={setConfigOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" data-testid="button-config">
                <Settings className="w-4 h-4 mr-2" />
                Configure
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Alert Configuration</DialogTitle>
                <DialogDescription>
                  Set up webhook notifications and default alert threshold
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="webhook">Webhook URL (Slack, Discord, etc.)</Label>
                  <Input
                    id="webhook"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    placeholder="https://hooks.slack.com/services/..."
                    data-testid="input-webhook"
                  />
                </div>
                <div>
                  <Label htmlFor="threshold">Default Threshold</Label>
                  <Input
                    id="threshold"
                    type="number"
                    value={defaultThreshold}
                    onChange={(e) => setDefaultThreshold(Number(e.target.value))}
                    placeholder="70"
                    data-testid="input-threshold"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={saveConfig} data-testid="button-save-config">Save Configuration</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button onClick={runCheck} variant="outline" data-testid="button-check-alerts">
            <AlertCircle className="w-4 h-4 mr-2" />
            Check Now
          </Button>

          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-location">
                <Plus className="w-4 h-4 mr-2" />
                Add Location
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Location</DialogTitle>
                <DialogDescription>
                  Add a new location to monitor for weather impact
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="id">Location ID</Label>
                  <Input
                    id="id"
                    value={form.id}
                    onChange={(e) => setForm({ ...form, id: e.target.value })}
                    placeholder="atl-hq"
                    data-testid="input-location-id"
                  />
                </div>
                <div>
                  <Label htmlFor="name">Location Name</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Atlanta HQ"
                    data-testid="input-location-name"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="lat">Latitude</Label>
                    <Input
                      id="lat"
                      type="number"
                      step="0.0001"
                      value={form.lat}
                      onChange={(e) => setForm({ ...form, lat: parseFloat(e.target.value) })}
                      data-testid="input-location-lat"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lng">Longitude</Label>
                    <Input
                      id="lng"
                      type="number"
                      step="0.0001"
                      value={form.lng}
                      onChange={(e) => setForm({ ...form, lng: parseFloat(e.target.value) })}
                      data-testid="input-location-lng"
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="alert"
                    checked={form.alert}
                    onChange={(e) => setForm({ ...form, alert: e.target.checked })}
                    className="rounded"
                    data-testid="checkbox-alert"
                  />
                  <Label htmlFor="alert">Enable alerts for this location</Label>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={add} data-testid="button-submit-location">Add Location</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button onClick={refreshScores} disabled={busy} variant="outline" data-testid="button-refresh">
            <RefreshCw className={`w-4 h-4 mr-2 ${busy ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Locations</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100" data-testid="stat-total-locations">
                {rows.length}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Alerts Enabled</p>
              <p className="text-2xl font-bold text-blue-600" data-testid="stat-alerts-enabled">
                {rows.filter((r) => r.alert).length}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Average Impact</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100" data-testid="stat-avg-impact">
                {avg}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {err && (
        <Card className="border-red-500">
          <CardContent className="pt-6">
            <p className="text-red-600">⚠ {err}</p>
          </CardContent>
        </Card>
      )}

      {/* Locations Table */}
      <Card>
        <CardHeader>
          <CardTitle>Monitored Locations</CardTitle>
          <CardDescription>
            Click the bell icon to toggle alerts for each location
          </CardDescription>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No locations yet. Click "Add Location" to get started.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b dark:border-gray-700">
                    <th className="p-3 font-semibold">Location</th>
                    <th className="p-3 font-semibold">Coordinates</th>
                    <th className="p-3 font-semibold">Impact Score</th>
                    <th className="p-3 font-semibold">Status</th>
                    <th className="p-3 font-semibold">Alerts</th>
                    <th className="p-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => {
                    const s = scores[r.id] ?? -1;
                    const b = s >= 0 ? badgeColor(s) : { color: "bg-gray-500", text: "N/A", textColor: "text-white" };
                    return (
                      <tr key={r.id} className="border-b dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800" data-testid={`row-location-${r.id}`}>
                        <td className="p-3 font-medium">{r.name}</td>
                        <td className="p-3 font-mono text-sm text-gray-600 dark:text-gray-400">
                          {r.lat.toFixed(3)}, {r.lng.toFixed(3)}
                        </td>
                        <td className="p-3">
                          {s >= 0 ? (
                            <span className="text-2xl font-bold" data-testid={`score-${r.id}`}>{s}</span>
                          ) : (
                            <span className="text-gray-400">…</span>
                          )}
                        </td>
                        <td className="p-3">
                          <Badge className={`${b.color} ${b.textColor}`} data-testid={`status-${r.id}`}>
                            {b.text}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <Button
                            size="sm"
                            variant={r.alert ? "default" : "outline"}
                            onClick={() => toggleAlert(r.id, r.alert || false, r.threshold)}
                            data-testid={`button-toggle-alert-${r.id}`}
                          >
                            {r.alert ? (
                              <Bell className="w-4 h-4" />
                            ) : (
                              <BellOff className="w-4 h-4" />
                            )}
                          </Button>
                        </td>
                        <td className="p-3">
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => remove(r.id)}
                            data-testid={`button-delete-${r.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
