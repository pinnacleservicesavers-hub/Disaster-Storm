import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  AlertTriangle, 
  DollarSign, 
  TrendingUp, 
  Camera, 
  Users, 
  Clock,
  MapPin,
  Eye,
  RefreshCw,
  Settings,
  BarChart3,
  Activity,
  Zap,
  Volume2,
  VolumeX
} from 'lucide-react';

interface DamageAlert {
  id: string;
  alertType: string;
  severity: 'minor' | 'moderate' | 'severe' | 'critical';
  severityScore: number; // 1-10
  profitabilityScore: number; // 1-10
  description: string;
  detectedAt: Date;
  resolvedAddress?: string;
  estimatedCost: {
    min: number;
    max: number;
    currency: string;
  };
  status: string;
  leadGenerated: boolean;
  emergencyResponse: boolean;
  confidence: number;
  contractorTypes: string[];
  accessibilityScore: number;
  insuranceLikelihood: number;
}

interface LeadGenerationStats {
  timeframe: string;
  alertsGenerated: number;
  leadsGenerated: number;
  contractorsNotified: number;
  totalPotentialValue: number;
  conversionRate: number;
  averageSeverityScore: number;
  averageProfitabilityScore: number;
  topAlertTypes: Array<{
    alertType: string;
    count: number;
    averageValue: number;
  }>;
  topStates: Array<{
    state: string;
    count: number;
    totalValue: number;
  }>;
  emergencyAlerts: number;
  highValueLeads: number;
  systemHealth: {
    apiKeyConfigured: boolean;
    damageDetectionActive: boolean;
    leadGenerationActive: boolean;
  };
}

export function DamageDetectionDashboard() {
  const [selectedSeverityThreshold, setSelectedSeverityThreshold] = useState(5);
  const [selectedProfitabilityThreshold, setSelectedProfitabilityThreshold] = useState(4);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [isVoiceGuideActive, setIsVoiceGuideActive] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Fetch damage alerts
  const { data: alertsData, isLoading: alertsLoading, refetch: refetchAlerts } = useQuery<{
    alerts: DamageAlert[];
    totalCount: number;
    filters: any;
  }>({
    queryKey: ['/api/damage-alerts', { 
      minSeverityScore: selectedSeverityThreshold,
      minProfitabilityScore: selectedProfitabilityThreshold,
      limit: 20 
    }],
    refetchInterval: autoRefresh ? 30000 : false, // Refresh every 30 seconds
  });

  // Fetch lead generation statistics
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery<LeadGenerationStats>({
    queryKey: ['/api/lead-generation-stats', { timeframe: '24h' }],
    refetchInterval: autoRefresh ? 60000 : false, // Refresh every minute
  });

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const startVoiceGuide = async () => {
    if (!isVoiceGuideActive) {
      setIsVoiceGuideActive(true);
      
      const voiceContent = `Welcome to AI Damage Detection Dashboard! This intelligent system analyzes images and data streams to automatically identify weather damage and generate contractor leads. The main dashboard displays real-time damage alerts with severity scores from minor to critical, confidence levels, and profitability assessments. Each alert includes estimated repair costs, property addresses, required contractor types, and insurance likelihood scores. The lead generation statistics show conversion rates, average response times, and revenue potential. You can filter alerts by severity thresholds, location, and damage types. The system integrates with contractor notification systems to automatically dispatch qualified professionals to high-value opportunities. Emergency response alerts get priority routing for immediate safety concerns.`;
      
      try {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current = null;
        }
        
        const response = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: voiceContent.trim() })
        });
        
        const data = await response.json();
        
        if (data.audioBase64) {
          const format = data.format || 'mp3';
          const audioBlob = new Blob(
            [Uint8Array.from(atob(data.audioBase64), c => c.charCodeAt(0))],
            { type: `audio/${format}` }
          );
          const audioUrl = URL.createObjectURL(audioBlob);
          audioRef.current = new Audio(audioUrl);
          audioRef.current.onended = () => {
            setIsVoiceGuideActive(false);
            URL.revokeObjectURL(audioUrl);
          };
          audioRef.current.onerror = () => {
            setIsVoiceGuideActive(false);
            URL.revokeObjectURL(audioUrl);
          };
          await audioRef.current.play();
        } else {
          setIsVoiceGuideActive(false);
        }
      } catch (error) {
        console.error('Voice guide error:', error);
        setIsVoiceGuideActive(false);
      }
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setIsVoiceGuideActive(false);
    }
  };

  const getSeverityColor = (score: number): string => {
    if (score >= 9) return 'bg-red-600';
    if (score >= 7) return 'bg-orange-500';
    if (score >= 5) return 'bg-yellow-500';
    if (score >= 3) return 'bg-blue-500';
    return 'bg-gray-500';
  };

  const getSeverityTextColor = (score: number): string => {
    if (score >= 9) return 'text-red-600';
    if (score >= 7) return 'text-orange-500';
    if (score >= 5) return 'text-yellow-600';
    if (score >= 3) return 'text-blue-600';
    return 'text-gray-600';
  };

  const getProfitabilityColor = (score: number): string => {
    if (score >= 8) return 'text-green-700 bg-green-100';
    if (score >= 6) return 'text-green-600 bg-green-50';
    if (score >= 4) return 'text-yellow-600 bg-yellow-50';
    return 'text-gray-600 bg-gray-50';
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatAlertType = (alertType: string): string => {
    return alertType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const refreshAll = () => {
    refetchAlerts();
    refetchStats();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
                <Eye className="h-8 w-8 mr-3 text-blue-600" />
                AI Damage Detection Center
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Real-time storm damage detection and contractor lead generation
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                onClick={refreshAll}
                variant="outline"
                size="sm"
                data-testid="button-refresh-all"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button
                onClick={() => setAutoRefresh(!autoRefresh)}
                variant={autoRefresh ? "default" : "outline"}
                size="sm"
                data-testid="button-toggle-auto-refresh"
              >
                <Activity className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-pulse' : ''}`} />
                Auto Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={startVoiceGuide}
                className="flex items-center gap-2"
                data-testid="button-voice-guide"
                aria-label="Voice guide for AI Damage Detection"
                aria-pressed={isVoiceGuideActive}
              >
                {isVoiceGuideActive ? (
                  <>
                    <VolumeX className="h-4 w-4" />
                    Stop Guide
                  </>
                ) : (
                  <>
                    <Volume2 className="h-4 w-4" />
                    Voice Guide
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* System Health Status */}
        {stats?.systemHealth && (
          <div className="mb-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Settings className="h-5 w-5 mr-2" />
                  System Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-6">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-2 ${stats.systemHealth.apiKeyConfigured ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className="text-sm">
                      Anthropic API: {stats.systemHealth.apiKeyConfigured ? 'Connected' : 'Not Configured'}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-2 ${stats.systemHealth.damageDetectionActive ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                    <span className="text-sm">
                      Damage Detection: {stats.systemHealth.damageDetectionActive ? 'Active' : 'Standby'}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-2 ${stats.systemHealth.leadGenerationActive ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                    <span className="text-sm">
                      Lead Generation: {stats.systemHealth.leadGenerationActive ? 'Active' : 'Standby'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Active Alerts</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {alertsData?.totalCount || 0}
                  </p>
                  <p className="text-sm text-green-600">
                    {stats?.emergencyAlerts || 0} emergency
                  </p>
                </div>
                <AlertTriangle className="h-12 w-12 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Leads Generated</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {stats?.leadsGenerated || 0}
                  </p>
                  <p className="text-sm text-blue-600">
                    {stats?.conversionRate || 0}% conversion
                  </p>
                </div>
                <TrendingUp className="h-12 w-12 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Potential Value</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {stats ? formatCurrency(stats.totalPotentialValue) : '$0'}
                  </p>
                  <p className="text-sm text-green-600">
                    {stats?.highValueLeads || 0} high value
                  </p>
                </div>
                <DollarSign className="h-12 w-12 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Contractors Notified</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {stats?.contractorsNotified || 0}
                  </p>
                  <p className="text-sm text-purple-600">
                    Avg Score: {stats?.averageProfitabilityScore?.toFixed(1) || 0}/10
                  </p>
                </div>
                <Users className="h-12 w-12 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Alert Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium">Min Severity Score:</label>
                  <select
                    value={selectedSeverityThreshold}
                    onChange={(e) => setSelectedSeverityThreshold(Number(e.target.value))}
                    className="border rounded px-2 py-1 text-sm"
                    data-testid="select-severity-threshold"
                  >
                    {[1,2,3,4,5,6,7,8,9,10].map(score => (
                      <option key={score} value={score}>{score}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium">Min Profitability Score:</label>
                  <select
                    value={selectedProfitabilityThreshold}
                    onChange={(e) => setSelectedProfitabilityThreshold(Number(e.target.value))}
                    className="border rounded px-2 py-1 text-sm"
                    data-testid="select-profitability-threshold"
                  >
                    {[1,2,3,4,5,6,7,8,9,10].map(score => (
                      <option key={score} value={score}>{score}</option>
                    ))}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="alerts" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="alerts" data-testid="tab-active-alerts">Active Alerts</TabsTrigger>
            <TabsTrigger value="analytics" data-testid="tab-analytics">Analytics</TabsTrigger>
            <TabsTrigger value="insights" data-testid="tab-insights">Insights</TabsTrigger>
          </TabsList>

          {/* Active Alerts Tab */}
          <TabsContent value="alerts" className="space-y-4">
            {alertsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p>Loading damage alerts...</p>
              </div>
            ) : !alertsData?.alerts || alertsData.alerts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Eye className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold mb-2">No Active Alerts</h3>
                <p>No damage detected above the current thresholds.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {(alertsData?.alerts || []).map((alert) => (
                  <Card key={alert.id} className="border-l-4 border-l-orange-500">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-3">
                            <Badge className={getSeverityColor(alert.severityScore)}>
                              {alert.severity.toUpperCase()}
                            </Badge>
                            <Badge variant="outline" className={getProfitabilityColor(alert.profitabilityScore)}>
                              ${((alert.estimatedCost.min + alert.estimatedCost.max) / 2).toLocaleString()}
                            </Badge>
                            <Badge variant="outline">
                              {alert.confidence}% confident
                            </Badge>
                            {alert.emergencyResponse && (
                              <Badge variant="destructive">
                                <Zap className="h-3 w-3 mr-1" />
                                EMERGENCY
                              </Badge>
                            )}
                          </div>
                          
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                            {formatAlertType(alert.alertType)}
                          </h3>
                          <p className="text-gray-600 dark:text-gray-300 mb-3">
                            {alert.description}
                          </p>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="font-medium">Severity Score:</span>
                              <span className={`ml-2 font-bold ${getSeverityTextColor(alert.severityScore)}`}>
                                {alert.severityScore}/10
                              </span>
                            </div>
                            <div>
                              <span className="font-medium">Profit Score:</span>
                              <span className="ml-2 font-bold text-green-600">
                                {alert.profitabilityScore}/10
                              </span>
                            </div>
                            <div>
                              <span className="font-medium">Access Score:</span>
                              <span className="ml-2 font-bold text-blue-600">
                                {alert.accessibilityScore}/10
                              </span>
                            </div>
                            <div>
                              <span className="font-medium">Insurance:</span>
                              <span className="ml-2 font-bold text-purple-600">
                                {alert.insuranceLikelihood}/10
                              </span>
                            </div>
                          </div>

                          {alert.resolvedAddress && (
                            <div className="flex items-center mt-3 text-sm text-gray-600">
                              <MapPin className="h-4 w-4 mr-2" />
                              {alert.resolvedAddress}
                            </div>
                          )}

                          <div className="flex items-center mt-3 text-sm text-gray-500">
                            <Clock className="h-4 w-4 mr-2" />
                            Detected: {new Date(alert.detectedAt).toLocaleString()}
                          </div>
                        </div>

                        <div className="flex flex-col items-end space-y-2">
                          <Badge variant={alert.leadGenerated ? "default" : "secondary"}>
                            {alert.leadGenerated ? 'Lead Generated' : 'No Lead'}
                          </Badge>
                          <div className="text-sm text-gray-500">
                            {alert.contractorTypes.join(', ')}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            {statsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p>Loading analytics...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Alert Types */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <BarChart3 className="h-5 w-5 mr-2" />
                      Top Alert Types
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {(stats?.topAlertTypes || []).map((type, index) => (
                        <div key={type.alertType} className="flex items-center justify-between">
                          <div className="flex items-center">
                            <span className="w-6 h-6 bg-blue-500 text-white rounded-full text-xs flex items-center justify-center mr-3">
                              {index + 1}
                            </span>
                            <span className="font-medium">{formatAlertType(type.alertType)}</span>
                          </div>
                          <div className="text-right">
                            <div className="font-bold">{type.count}</div>
                            <div className="text-sm text-gray-500">
                              Avg: {formatCurrency(type.averageValue)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Top States */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <MapPin className="h-5 w-5 mr-2" />
                      Top States
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {(stats?.topStates || []).map((state, index) => (
                        <div key={state.state} className="flex items-center justify-between">
                          <div className="flex items-center">
                            <span className="w-6 h-6 bg-green-500 text-white rounded-full text-xs flex items-center justify-center mr-3">
                              {index + 1}
                            </span>
                            <span className="font-medium">{state.state}</span>
                          </div>
                          <div className="text-right">
                            <div className="font-bold">{state.count} alerts</div>
                            <div className="text-sm text-gray-500">
                              {formatCurrency(state.totalValue)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Insights Tab */}
          <TabsContent value="insights" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>System Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Average Severity Score</span>
                      <Badge variant="outline">
                        {stats?.averageSeverityScore?.toFixed(1) || 0}/10
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Average Profitability Score</span>
                      <Badge variant="outline">
                        {stats?.averageProfitabilityScore?.toFixed(1) || 0}/10
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Lead Conversion Rate</span>
                      <Badge variant="outline">
                        {stats?.conversionRate || 0}%
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Business Impact</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-600">Total Potential Value</p>
                      <p className="text-2xl font-bold text-green-600">
                        {stats ? formatCurrency(stats.totalPotentialValue) : '$0'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">High-Value Opportunities</p>
                      <p className="text-xl font-semibold">
                        {stats?.highValueLeads || 0} leads over $10k
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Emergency Response</p>
                      <p className="text-xl font-semibold text-red-600">
                        {stats?.emergencyAlerts || 0} critical alerts
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}