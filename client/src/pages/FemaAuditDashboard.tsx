import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { ModuleWrapper } from "@/components/ModuleWrapper";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Shield,
  FileCheck,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingUp,
  BarChart3,
  Download,
  Eye,
  Truck,
  Users,
  Wrench,
  FileText,
  Camera,
  Satellite,
  Brain,
  Activity,
  DollarSign,
  XCircle,
  RefreshCw,
  Plus,
  ChevronRight,
  Target,
  Zap
} from "lucide-react";

interface DashboardStats {
  workLogs: {
    total_logs: number;
    total_cubic_yards: number;
    total_minutes: number;
    verified_count: number;
    ai_validated_count: number;
  };
  loadTickets: {
    total_tickets: number;
    total_estimated_yards: number;
    total_actual_yards: number;
    verified_count: number;
  };
  openFindings: Array<{ severity: string; count: number }>;
  riskScore: {
    overall_risk_score: number;
    risk_level: string;
    documentation_score: number;
    gps_compliance_score: number;
    photo_score: number;
    fraud_indicator_score: number;
    critical_issues: number;
    high_issues: number;
    medium_issues: number;
    low_issues: number;
  } | null;
}

export default function FemaAuditDashboard() {
  const { toast } = useToast();
  const [selectedContractId, setSelectedContractId] = useState<string>("");
  const [showNewContractDialog, setShowNewContractDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const { data: contracts, isLoading: contractsLoading } = useQuery({
    queryKey: ["/api/fema-audit/contracts"],
  });

  const { data: disasters } = useQuery({
    queryKey: ["/api/fema-audit/disasters"],
  });

  const { data: dashboard, refetch: refetchDashboard } = useQuery<{ success: boolean; dashboard: DashboardStats }>({
    queryKey: ["/api/fema-audit/dashboard", selectedContractId],
    enabled: !!selectedContractId,
  });

  const { data: workLogs } = useQuery({
    queryKey: ["/api/fema-audit/work-logs", { contractId: selectedContractId }],
    enabled: !!selectedContractId,
  });

  const { data: loadTickets } = useQuery({
    queryKey: ["/api/fema-audit/load-tickets", { contractId: selectedContractId }],
    enabled: !!selectedContractId,
  });

  const { data: aiFindings } = useQuery({
    queryKey: ["/api/fema-audit/ai-findings", { contractId: selectedContractId }],
    enabled: !!selectedContractId,
  });

  const calculateRiskMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("/api/fema-audit/risk-scores/calculate", {
        method: "POST",
        body: JSON.stringify({ contractId: selectedContractId }),
      });
    },
    onSuccess: () => {
      toast({ title: "Risk Score Calculated", description: "Audit risk score has been updated" });
      refetchDashboard();
      queryClient.invalidateQueries({ queryKey: ["/api/fema-audit/risk-scores"] });
    },
  });

  const runAiScanMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("/api/fema-audit/ai-scan", {
        method: "POST",
        body: JSON.stringify({ contractId: selectedContractId }),
      });
    },
    onSuccess: (data: any) => {
      toast({ 
        title: "AI Scan Complete", 
        description: `Found ${data.findingsCount} potential issues` 
      });
      queryClient.invalidateQueries({ queryKey: ["/api/fema-audit/ai-findings"] });
      refetchDashboard();
    },
  });

  const createExportMutation = useMutation({
    mutationFn: async (exportType: string) => {
      return apiRequest("/api/fema-audit/exports", {
        method: "POST",
        body: JSON.stringify({ 
          contractId: selectedContractId,
          exportType,
          exportFormat: "pdf",
          requestedBy: "user"
        }),
      });
    },
    onSuccess: () => {
      toast({ title: "Export Started", description: "Your FEMA audit packet is being generated" });
      queryClient.invalidateQueries({ queryKey: ["/api/fema-audit/exports"] });
    },
  });

  const getRiskColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'low': return 'bg-green-500';
      case 'moderate': return 'bg-yellow-500';
      case 'high': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  const stats = dashboard?.dashboard;

  return (
    <ModuleWrapper moduleId="fema-audit">
      <div className="container mx-auto px-4 py-8 space-y-6">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex-1 max-w-md">
            <Label htmlFor="contract-select">Active Contract</Label>
            <Select value={selectedContractId} onValueChange={setSelectedContractId}>
              <SelectTrigger id="contract-select">
                <SelectValue placeholder="Select a contract to view" />
              </SelectTrigger>
              <SelectContent>
                {(contracts as any)?.contracts?.map((contract: any) => (
                  <SelectItem key={contract.id} value={contract.id}>
                    {contract.contract_number} - {contract.prime_contractor_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Dialog open={showNewContractDialog} onOpenChange={setShowNewContractDialog}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  New Contract
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add Prime Contract</DialogTitle>
                  <DialogDescription>
                    Enter contract details including rate sheets for automatic compliance validation
                  </DialogDescription>
                </DialogHeader>
                <NewContractForm onSuccess={() => {
                  setShowNewContractDialog(false);
                  queryClient.invalidateQueries({ queryKey: ["/api/fema-audit/contracts"] });
                }} />
              </DialogContent>
            </Dialog>
            
            {selectedContractId && (
              <>
                <Button 
                  variant="outline" 
                  onClick={() => runAiScanMutation.mutate()}
                  disabled={runAiScanMutation.isPending}
                >
                  <Brain className="h-4 w-4 mr-2" />
                  Run AI Scan
                </Button>
                <Button 
                  onClick={() => createExportMutation.mutate("full_audit_packet")}
                  disabled={createExportMutation.isPending}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Audit Packet
                </Button>
              </>
            )}
          </div>
        </div>

        {!selectedContractId ? (
          <Card className="border-dashed">
            <CardContent className="py-16 text-center">
              <Shield className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">Select a Contract</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Choose an active contract to view compliance dashboard, work logs, load tickets, 
                and AI fraud detection findings
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {stats?.riskScore && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="col-span-1 md:col-span-2">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Audit Risk Score</CardTitle>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => calculateRiskMutation.mutate()}
                        disabled={calculateRiskMutation.isPending}
                      >
                        <RefreshCw className={`h-4 w-4 ${calculateRiskMutation.isPending ? 'animate-spin' : ''}`} />
                      </Button>
                    </div>
                    <CardDescription>Overall compliance and fraud risk assessment</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-6">
                      <div className="relative w-32 h-32">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle cx="64" cy="64" r="56" fill="none" stroke="#e5e7eb" strokeWidth="12" />
                          <circle 
                            cx="64" cy="64" r="56" fill="none" 
                            stroke={stats.riskScore.risk_level === 'low' ? '#22c55e' : stats.riskScore.risk_level === 'moderate' ? '#eab308' : '#ef4444'}
                            strokeWidth="12"
                            strokeLinecap="round"
                            strokeDasharray={`${(stats.riskScore.overall_risk_score / 100) * 352} 352`}
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-3xl font-bold">{stats.riskScore.overall_risk_score}</span>
                          <span className="text-xs text-muted-foreground uppercase">{stats.riskScore.risk_level}</span>
                        </div>
                      </div>
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span>Documentation</span>
                          <div className="flex items-center gap-2">
                            <Progress value={stats.riskScore.documentation_score} className="w-20 h-2" />
                            <span className="w-8 text-right">{stats.riskScore.documentation_score}%</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span>GPS Compliance</span>
                          <div className="flex items-center gap-2">
                            <Progress value={stats.riskScore.gps_compliance_score} className="w-20 h-2" />
                            <span className="w-8 text-right">{stats.riskScore.gps_compliance_score}%</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span>Photo Score</span>
                          <div className="flex items-center gap-2">
                            <Progress value={stats.riskScore.photo_score} className="w-20 h-2" />
                            <span className="w-8 text-right">{stats.riskScore.photo_score}%</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span>Fraud Indicators</span>
                          <div className="flex items-center gap-2">
                            <Progress value={stats.riskScore.fraud_indicator_score} className="w-20 h-2" />
                            <span className="w-8 text-right">{stats.riskScore.fraud_indicator_score}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-yellow-500" />
                      Open Issues
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Badge variant="destructive">Critical</Badge>
                        <span className="text-2xl font-bold">{stats.riskScore.critical_issues}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <Badge variant="destructive">High</Badge>
                        <span className="text-2xl font-bold">{stats.riskScore.high_issues}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <Badge variant="default">Medium</Badge>
                        <span className="text-2xl font-bold">{stats.riskScore.medium_issues}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <Badge variant="secondary">Low</Badge>
                        <span className="text-2xl font-bold">{stats.riskScore.low_issues}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Activity className="h-5 w-5 text-blue-500" />
                      Quick Stats
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Work Logs</span>
                        <span className="font-semibold">{stats.workLogs?.total_logs || 0}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Load Tickets</span>
                        <span className="font-semibold">{stats.loadTickets?.total_tickets || 0}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">AI Validated</span>
                        <span className="font-semibold">{stats.workLogs?.ai_validated_count || 0}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Cubic Yards</span>
                        <span className="font-semibold">{Number(stats.loadTickets?.total_actual_yards || 0).toLocaleString()}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-6 w-full max-w-4xl">
                <TabsTrigger value="overview" className="flex items-center gap-1">
                  <BarChart3 className="h-4 w-4" />
                  <span className="hidden sm:inline">Overview</span>
                </TabsTrigger>
                <TabsTrigger value="work-logs" className="flex items-center gap-1">
                  <FileCheck className="h-4 w-4" />
                  <span className="hidden sm:inline">Work Logs</span>
                </TabsTrigger>
                <TabsTrigger value="load-tickets" className="flex items-center gap-1">
                  <Truck className="h-4 w-4" />
                  <span className="hidden sm:inline">Load Tickets</span>
                </TabsTrigger>
                <TabsTrigger value="ai-findings" className="flex items-center gap-1">
                  <Brain className="h-4 w-4" />
                  <span className="hidden sm:inline">AI Findings</span>
                </TabsTrigger>
                <TabsTrigger value="geo-zones" className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span className="hidden sm:inline">Geo Zones</span>
                </TabsTrigger>
                <TabsTrigger value="exports" className="flex items-center gap-1">
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline">Exports</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Satellite className="h-5 w-5" />
                        AI Monitor Features
                      </CardTitle>
                      <CardDescription>Digital field verification replacing manual monitors</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                        <div>
                          <p className="font-medium">Geofenced Work Zones</p>
                          <p className="text-sm text-muted-foreground">GPS verification within assigned areas</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                        <div>
                          <p className="font-medium">Before/After Photo AI</p>
                          <p className="text-sm text-muted-foreground">Automated photo validation & consistency</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                        <div>
                          <p className="font-medium">Equipment Telematics</p>
                          <p className="text-sm text-muted-foreground">Engine hours match billing automatically</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                        <div>
                          <p className="font-medium">Span-Based Logging</p>
                          <p className="text-sm text-muted-foreground">Work tied to specific locations, not hours</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Brain className="h-5 w-5" />
                        Fraud Detection
                      </CardTitle>
                      <CardDescription>AI-powered anomaly and conflict detection</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-start gap-3">
                        <Target className="h-5 w-5 text-blue-500 mt-0.5" />
                        <div>
                          <p className="font-medium">Duplicate Detection</p>
                          <p className="text-sm text-muted-foreground">Same location, photos, or tickets flagged</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Target className="h-5 w-5 text-blue-500 mt-0.5" />
                        <div>
                          <p className="font-medium">Impossible Travel</p>
                          <p className="text-sm text-muted-foreground">GPS route timing validation</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Target className="h-5 w-5 text-blue-500 mt-0.5" />
                        <div>
                          <p className="font-medium">Cross-Contract Conflicts</p>
                          <p className="text-sm text-muted-foreground">Worker/equipment on multiple jobs</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Target className="h-5 w-5 text-blue-500 mt-0.5" />
                        <div>
                          <p className="font-medium">Rate Violations</p>
                          <p className="text-sm text-muted-foreground">Auto-check against contract rates</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        FEMA Compliance
                      </CardTitle>
                      <CardDescription>One-click audit defense documentation</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-start gap-3">
                        <Zap className="h-5 w-5 text-yellow-500 mt-0.5" />
                        <div>
                          <p className="font-medium">PW-Ready Packets</p>
                          <p className="text-sm text-muted-foreground">Project Worksheet aligned exports</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Zap className="h-5 w-5 text-yellow-500 mt-0.5" />
                        <div>
                          <p className="font-medium">Immutable Audit Trail</p>
                          <p className="text-sm text-muted-foreground">Tamper-evident change logging</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Zap className="h-5 w-5 text-yellow-500 mt-0.5" />
                        <div>
                          <p className="font-medium">T&M Cap Monitoring</p>
                          <p className="text-sm text-muted-foreground">70-hour cap compliance alerts</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Zap className="h-5 w-5 text-yellow-500 mt-0.5" />
                        <div>
                          <p className="font-medium">Chain of Custody</p>
                          <p className="text-sm text-muted-foreground">Full debris tracking with GPS</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="work-logs" className="mt-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Work Logs</CardTitle>
                        <CardDescription>Span-based work documentation with AI validation</CardDescription>
                      </div>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Log Work
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {(workLogs as any)?.workLogs?.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          No work logs recorded yet. Start logging span-based work to build your audit trail.
                        </div>
                      ) : (
                        (workLogs as any)?.workLogs?.slice(0, 10).map((log: any) => (
                          <div key={log.id} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center gap-4">
                              <div className={`w-3 h-3 rounded-full ${log.inside_geofence ? 'bg-green-500' : 'bg-red-500'}`} />
                              <div>
                                <p className="font-medium">{log.work_type} - {log.span_id || 'No Span'}</p>
                                <p className="text-sm text-muted-foreground">
                                  {log.hazard_class} | {log.cubic_yards} CY | {log.total_minutes}min
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {log.ai_validated ? (
                                <Badge variant="outline" className="text-green-600">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  AI Validated {log.ai_validation_score}%
                                </Badge>
                              ) : (
                                <Badge variant="secondary">Pending</Badge>
                              )}
                              {log.before_photo_url && log.after_photo_url ? (
                                <Badge variant="outline">
                                  <Camera className="h-3 w-3 mr-1" />
                                  Photos
                                </Badge>
                              ) : (
                                <Badge variant="destructive">
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Missing Photos
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="load-tickets" className="mt-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Load Tickets</CardTitle>
                        <CardDescription>Chain of custody tracking from pickup to disposal</CardDescription>
                      </div>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        New Ticket
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {(loadTickets as any)?.loadTickets?.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          No load tickets recorded. Create tickets to track debris from pickup to disposal.
                        </div>
                      ) : (
                        (loadTickets as any)?.loadTickets?.slice(0, 10).map((ticket: any) => (
                          <div key={ticket.id} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center gap-4">
                              <Truck className="h-8 w-8 text-muted-foreground" />
                              <div>
                                <p className="font-medium">Ticket #{ticket.ticket_number}</p>
                                <p className="text-sm text-muted-foreground">
                                  {ticket.debris_type} | {ticket.estimated_cubic_yards} CY est. | {ticket.actual_cubic_yards || '?'} CY actual
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={ticket.status === 'verified' ? 'default' : 'secondary'}>
                                {ticket.status}
                              </Badge>
                              {ticket.disposal_verified && (
                                <Badge variant="outline" className="text-green-600">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Disposal Verified
                                </Badge>
                              )}
                              {ticket.chain_of_custody_hash && (
                                <Badge variant="outline">
                                  <Shield className="h-3 w-3 mr-1" />
                                  CoC Hash
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="ai-findings" className="mt-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>AI Findings</CardTitle>
                        <CardDescription>Automated fraud detection and compliance issues</CardDescription>
                      </div>
                      <Button 
                        variant="outline"
                        onClick={() => runAiScanMutation.mutate()}
                        disabled={runAiScanMutation.isPending}
                      >
                        <Brain className="h-4 w-4 mr-2" />
                        Run Full Scan
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {(aiFindings as any)?.findings?.length === 0 ? (
                        <div className="text-center py-8">
                          <CheckCircle2 className="h-16 w-16 mx-auto text-green-500 mb-4" />
                          <p className="text-lg font-medium">No Issues Found</p>
                          <p className="text-muted-foreground">All records passed AI validation checks</p>
                        </div>
                      ) : (
                        (aiFindings as any)?.findings?.map((finding: any) => (
                          <div key={finding.id} className="flex items-start justify-between p-4 border rounded-lg">
                            <div className="flex items-start gap-4">
                              <AlertTriangle className={`h-6 w-6 mt-0.5 ${
                                finding.severity === 'critical' ? 'text-red-600' :
                                finding.severity === 'high' ? 'text-red-500' :
                                finding.severity === 'medium' ? 'text-yellow-500' : 'text-blue-500'
                              }`} />
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-medium">{finding.finding_type.replace(/_/g, ' ').toUpperCase()}</p>
                                  <Badge variant={getSeverityColor(finding.severity) as any}>
                                    {finding.severity}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">{finding.summary}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Confidence: {finding.confidence_score}%
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={finding.status === 'resolved' ? 'outline' : 'secondary'}>
                                {finding.status}
                              </Badge>
                              {finding.status !== 'resolved' && (
                                <Button variant="ghost" size="sm">
                                  Resolve
                                </Button>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="geo-zones" className="mt-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Geofenced Work Zones</CardTitle>
                        <CardDescription>Define work areas for GPS compliance verification</CardDescription>
                      </div>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Zone
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                      <MapPin className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <p>Define geofenced zones to enable AI monitor verification</p>
                      <p className="text-sm">Crews can only log work inside approved zones</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="exports" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>FEMA Audit Exports</CardTitle>
                    <CardDescription>Generate compliance documentation packages</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Button 
                        variant="outline" 
                        className="h-auto p-4 justify-start"
                        onClick={() => createExportMutation.mutate("full_audit_packet")}
                      >
                        <div className="flex items-start gap-3">
                          <FileText className="h-8 w-8" />
                          <div className="text-left">
                            <p className="font-medium">Full Audit Packet</p>
                            <p className="text-sm text-muted-foreground">Complete FEMA-ready documentation</p>
                          </div>
                        </div>
                      </Button>
                      <Button 
                        variant="outline" 
                        className="h-auto p-4 justify-start"
                        onClick={() => createExportMutation.mutate("labor_summary")}
                      >
                        <div className="flex items-start gap-3">
                          <Users className="h-8 w-8" />
                          <div className="text-left">
                            <p className="font-medium">Labor Summary</p>
                            <p className="text-sm text-muted-foreground">Hours, rates, and T&M compliance</p>
                          </div>
                        </div>
                      </Button>
                      <Button 
                        variant="outline" 
                        className="h-auto p-4 justify-start"
                        onClick={() => createExportMutation.mutate("equipment_summary")}
                      >
                        <div className="flex items-start gap-3">
                          <Wrench className="h-8 w-8" />
                          <div className="text-left">
                            <p className="font-medium">Equipment Summary</p>
                            <p className="text-sm text-muted-foreground">Usage, telematics, and billing</p>
                          </div>
                        </div>
                      </Button>
                      <Button 
                        variant="outline" 
                        className="h-auto p-4 justify-start"
                        onClick={() => createExportMutation.mutate("debris_summary")}
                      >
                        <div className="flex items-start gap-3">
                          <Truck className="h-8 w-8" />
                          <div className="text-left">
                            <p className="font-medium">Debris Summary</p>
                            <p className="text-sm text-muted-foreground">Load tickets and chain of custody</p>
                          </div>
                        </div>
                      </Button>
                      <Button 
                        variant="outline" 
                        className="h-auto p-4 justify-start"
                        onClick={() => createExportMutation.mutate("risk_report")}
                      >
                        <div className="flex items-start gap-3">
                          <Shield className="h-8 w-8" />
                          <div className="text-left">
                            <p className="font-medium">Risk Report</p>
                            <p className="text-sm text-muted-foreground">Audit risk score and findings</p>
                          </div>
                        </div>
                      </Button>
                      <Button 
                        variant="outline" 
                        className="h-auto p-4 justify-start"
                        onClick={() => createExportMutation.mutate("photo_index")}
                      >
                        <div className="flex items-start gap-3">
                          <Camera className="h-8 w-8" />
                          <div className="text-left">
                            <p className="font-medium">Photo Index</p>
                            <p className="text-sm text-muted-foreground">All photos with GPS metadata</p>
                          </div>
                        </div>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </ModuleWrapper>
  );
}

function NewContractForm({ onSuccess }: { onSuccess: () => void }) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    contractNumber: "",
    contractTitle: "",
    primeContractorName: "",
    contractValue: "",
    contractType: "time_materials",
    tmCap: "70",
    startDate: "",
    endDate: ""
  });

  const createContractMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("/api/fema-audit/contracts", {
        method: "POST",
        body: JSON.stringify({
          ...formData,
          contractValue: parseFloat(formData.contractValue) || 0,
          tmCap: parseInt(formData.tmCap) || 70
        }),
      });
    },
    onSuccess: () => {
      toast({ title: "Contract Created", description: "Prime contract has been added" });
      onSuccess();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create contract", variant: "destructive" });
    }
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Contract Number</Label>
          <Input 
            placeholder="e.g., DR-4784-FL-001"
            value={formData.contractNumber}
            onChange={(e) => setFormData({...formData, contractNumber: e.target.value})}
          />
        </div>
        <div>
          <Label>Prime Contractor Name</Label>
          <Input 
            placeholder="e.g., AshBritt Environmental"
            value={formData.primeContractorName}
            onChange={(e) => setFormData({...formData, primeContractorName: e.target.value})}
          />
        </div>
      </div>
      <div>
        <Label>Contract Title</Label>
        <Input 
          placeholder="e.g., Hurricane Ian Debris Removal"
          value={formData.contractTitle}
          onChange={(e) => setFormData({...formData, contractTitle: e.target.value})}
        />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label>Contract Value ($)</Label>
          <Input 
            type="number"
            placeholder="1000000"
            value={formData.contractValue}
            onChange={(e) => setFormData({...formData, contractValue: e.target.value})}
          />
        </div>
        <div>
          <Label>Contract Type</Label>
          <Select value={formData.contractType} onValueChange={(v) => setFormData({...formData, contractType: v})}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="time_materials">Time & Materials</SelectItem>
              <SelectItem value="unit_price">Unit Price</SelectItem>
              <SelectItem value="lump_sum">Lump Sum</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>T&M Cap (Hours)</Label>
          <Input 
            type="number"
            value={formData.tmCap}
            onChange={(e) => setFormData({...formData, tmCap: e.target.value})}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Start Date</Label>
          <Input 
            type="date"
            value={formData.startDate}
            onChange={(e) => setFormData({...formData, startDate: e.target.value})}
          />
        </div>
        <div>
          <Label>End Date</Label>
          <Input 
            type="date"
            value={formData.endDate}
            onChange={(e) => setFormData({...formData, endDate: e.target.value})}
          />
        </div>
      </div>
      <Button 
        className="w-full" 
        onClick={() => createContractMutation.mutate()}
        disabled={createContractMutation.isPending || !formData.contractNumber || !formData.primeContractorName}
      >
        {createContractMutation.isPending ? "Creating..." : "Create Contract"}
      </Button>
    </div>
  );
}
