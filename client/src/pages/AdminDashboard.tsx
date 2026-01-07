import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  RefreshCw, 
  Send, 
  AlertTriangle, 
  CheckCircle, 
  Users, 
  FileText, 
  MapPin,
  Settings,
  Play,
  Eye
} from 'lucide-react';
import ModuleAIAssistant from '@/components/ModuleAIAssistant';

export function AdminDashboard() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch MRMS stats
  const { data: mrmsStats, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['/api/mrms/stats'],
  });

  // Fetch hazard summary
  const { data: hazardSummary, isLoading: summaryLoading, refetch: refetchSummary } = useQuery({
    queryKey: ['/api/align/summary'],
  });

  // Fetch contractor preview
  const { data: contractorPreview, isLoading: previewLoading, refetch: refetchPreview } = useQuery({
    queryKey: ['/api/alerts/contractor/preview'],
  });

  // Type-safe access to data
  const stats = mrmsStats as any;
  const summary = hazardSummary as any;
  const preview = contractorPreview as any;

  // Trigger MRMS processing
  const processMRMS = useMutation({
    mutationFn: async () => {
      return apiRequest('/api/ingest/mrms-production', { method: 'POST' });
    },
    onSuccess: (data) => {
      toast({
        title: 'MRMS Processing Complete',
        description: `Processed ${data.totalContours} contours, skipped ${data.totalSkipped}`,
      });
      refetchStats();
      refetchSummary();
    },
    onError: (error: Error) => {
      toast({
        title: 'Processing Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Send contractor alerts (dry run)
  const sendAlertsDryRun = useMutation({
    mutationFn: async () => {
      return apiRequest('/api/alerts/contractor/send', {
        method: 'POST',
        body: JSON.stringify({ dryRun: true }),
      });
    },
    onSuccess: (data) => {
      toast({
        title: 'Dry Run Complete',
        description: `Would send ${data.sent} alerts for ${data.hazardCount} hazards`,
      });
    },
  });

  // Send contractor alerts (real)
  const sendAlertsReal = useMutation({
    mutationFn: async () => {
      return apiRequest('/api/alerts/contractor/send', {
        method: 'POST',
        body: JSON.stringify({ dryRun: false }),
      });
    },
    onSuccess: (data) => {
      toast({
        title: 'Alerts Sent Successfully',
        description: `Sent ${data.sent} alerts to contractors`,
      });
      refetchPreview();
    },
    onError: (error: Error) => {
      toast({
        title: 'Alert Sending Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const isLoading = statsLoading || summaryLoading || previewLoading;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
            Admin Dashboard
          </h1>
          <p className="text-slate-400">
            System control center for hazard processing and contractor alerts
          </p>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-slate-400">Active Hazards</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold text-red-400">
                  {summary?.activeHazards?.length || 0}
                </span>
                <AlertTriangle className="h-8 w-8 text-red-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-slate-400">Total Claims</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold text-blue-400">
                  {summary?.activeClaims?.length || 0}
                </span>
                <FileText className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-slate-400">Assets Monitored</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold text-green-400">
                  {summary?.allAssets?.length || 0}
                </span>
                <MapPin className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-slate-400">Contractors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold text-purple-400">
                  {preview?.totalRecipients || 0}
                </span>
                <Users className="h-8 w-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-slate-900 border border-slate-800">
            <TabsTrigger value="overview" data-testid="tab-overview">
              Overview
            </TabsTrigger>
            <TabsTrigger value="mrms" data-testid="tab-mrms">
              MRMS Processing
            </TabsTrigger>
            <TabsTrigger value="alerts" data-testid="tab-alerts">
              Contractor Alerts
            </TabsTrigger>
            <TabsTrigger value="ecrp" data-testid="tab-ecrp" onClick={() => window.location.href = '/admin/ecrp'}>
              Emergency Contractor Readiness
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  System Status
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Current system health and recent activity
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {summary && (
                  <>
                    <div className="flex items-center justify-between p-4 bg-slate-800 rounded-lg">
                      <span className="text-slate-300">Moratorium Risk Claims</span>
                      <Badge variant={summary.moratoriumClaims?.length > 0 ? 'destructive' : 'outline'}>
                        {summary.moratoriumClaims?.length || 0}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-slate-800 rounded-lg">
                      <span className="text-slate-300">Hazard Intersections</span>
                      <Badge variant="secondary">
                        {summary.intersections?.length || 0}
                      </Badge>
                    </div>
                  </>
                )}

                <Button
                  onClick={() => {
                    refetchStats();
                    refetchSummary();
                    refetchPreview();
                  }}
                  className="w-full"
                  variant="outline"
                  data-testid="button-refresh"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh All Data
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* MRMS Processing Tab */}
          <TabsContent value="mrms" className="space-y-4">
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle>MRMS Hazard Processing</CardTitle>
                <CardDescription className="text-slate-400">
                  Trigger multi-threshold hazard detection and processing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {stats && (
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="p-4 bg-slate-800 rounded-lg">
                      <div className="text-sm text-slate-400 mb-1">Last Hail Processing</div>
                      <div className="text-lg font-mono text-cyan-400">
                        {stats.lastProcessed?.hail || 'Never'}
                      </div>
                    </div>
                    <div className="p-4 bg-slate-800 rounded-lg">
                      <div className="text-sm text-slate-400 mb-1">Last Precipitation</div>
                      <div className="text-lg font-mono text-blue-400">
                        {stats.lastProcessed?.precipitation || 'Never'}
                      </div>
                    </div>
                    <div className="p-4 bg-slate-800 rounded-lg">
                      <div className="text-sm text-slate-400 mb-1">Last Wind Processing</div>
                      <div className="text-lg font-mono text-green-400">
                        {stats.lastProcessed?.wind || 'Never'}
                      </div>
                    </div>
                    <div className="p-4 bg-slate-800 rounded-lg">
                      <div className="text-sm text-slate-400 mb-1">Last Lightning</div>
                      <div className="text-lg font-mono text-yellow-400">
                        {stats.lastProcessed?.lightning || 'Never'}
                      </div>
                    </div>
                  </div>
                )}

                <Alert className="bg-blue-950 border-blue-800">
                  <AlertTriangle className="h-4 w-4 text-blue-400" />
                  <AlertDescription className="text-blue-200">
                    Processing all 16 MRMS thresholds across 4 service areas (Miami-Dade, Broward, Palm Beach, Houston)
                  </AlertDescription>
                </Alert>

                <Button
                  onClick={() => processMRMS.mutate()}
                  disabled={processMRMS.isPending}
                  className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                  size="lg"
                  data-testid="button-process-mrms"
                >
                  <Play className="h-5 w-5 mr-2" />
                  {processMRMS.isPending ? 'Processing...' : 'Process All MRMS Hazards'}
                </Button>

                {processMRMS.isSuccess && processMRMS.data && (
                  <div className="mt-4 p-4 bg-green-950 border border-green-800 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-5 w-5 text-green-400" />
                      <span className="font-semibold text-green-300">Processing Complete</span>
                    </div>
                    <div className="space-y-1 text-sm text-green-200">
                      <div>Created: {processMRMS.data.totalContours} contours</div>
                      <div>Skipped: {processMRMS.data.totalSkipped} duplicates</div>
                      {processMRMS.data.results?.map((result: any, idx: number) => (
                        <div key={idx} className="text-slate-300">
                          {result.peril}: {result.contoursCreated} created, {result.contoursSkipped} skipped ({result.processingTimeMs}ms)
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Contractor Alerts Tab */}
          <TabsContent value="alerts" className="space-y-4">
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle>Contractor Alert System</CardTitle>
                <CardDescription className="text-slate-400">
                  Send bulk SMS alerts to contractors about active hazards
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {preview && (
                  <div className="space-y-3">
                    <div className="p-4 bg-slate-800 rounded-lg">
                      <div className="text-sm text-slate-400 mb-2">Alert Recipients</div>
                      <div className="space-y-2">
                        {preview.contractors?.map((contractor: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between p-2 bg-slate-700 rounded">
                            <div>
                              <div className="font-semibold text-white">{contractor.name}</div>
                              <div className="text-sm text-slate-400">{contractor.phone}</div>
                            </div>
                            <Badge variant="outline">
                              {contractor.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Alert className="bg-purple-950 border-purple-800">
                      <AlertTriangle className="h-4 w-4 text-purple-400" />
                      <AlertDescription className="text-purple-200">
                        {preview.hazardCount} active hazards detected across {preview.affectedAreas?.length} service areas
                      </AlertDescription>
                    </Alert>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={() => sendAlertsDryRun.mutate()}
                    disabled={sendAlertsDryRun.isPending}
                    variant="outline"
                    data-testid="button-dry-run"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    {sendAlertsDryRun.isPending ? 'Testing...' : 'Dry Run (Preview)'}
                  </Button>

                  <Button
                    onClick={() => {
                      if (confirm('Send real SMS alerts to all contractors?')) {
                        sendAlertsReal.mutate();
                      }
                    }}
                    disabled={sendAlertsReal.isPending}
                    className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700"
                    data-testid="button-send-real"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {sendAlertsReal.isPending ? 'Sending...' : 'Send Real Alerts'}
                  </Button>
                </div>

                {sendAlertsDryRun.isSuccess && sendAlertsDryRun.data && (
                  <div className="mt-4 p-4 bg-blue-950 border border-blue-800 rounded-lg">
                    <div className="font-semibold text-blue-300 mb-2">Dry Run Results</div>
                    <div className="text-sm text-blue-200">
                      Would send {sendAlertsDryRun.data.sent} alerts for {sendAlertsDryRun.data.hazardCount} active hazards
                    </div>
                  </div>
                )}

                {sendAlertsReal.isSuccess && sendAlertsReal.data && (
                  <div className="mt-4 p-4 bg-green-950 border border-green-800 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-5 w-5 text-green-400" />
                      <span className="font-semibold text-green-300">Alerts Sent Successfully</span>
                    </div>
                    <div className="text-sm text-green-200">
                      Sent: {sendAlertsReal.data.sent} | Skipped: {sendAlertsReal.data.skipped} | Failed: {sendAlertsReal.data.failed}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        <ModuleAIAssistant 
          moduleName="Admin Dashboard"
          moduleContext="System administration for MRMS processing, hazard alignment, and contractor alerts. Evelyn can help with processing operations, monitoring system health, and managing automated alerts."
        />
      </div>
    </div>
  );
}
