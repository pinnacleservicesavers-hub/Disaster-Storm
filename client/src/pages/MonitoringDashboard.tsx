import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ModuleVoiceGuide from '@/components/ModuleVoiceGuide';
import { 
  Activity, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle, 
  CheckCircle2, 
  Loader2,
  DollarSign,
  Users,
  FileText,
  Clock,
  Target,
  ArrowUp,
  ArrowDown,
  Bell,
  Brain,
  BarChart3,
  PieChart,
  RefreshCw,
  Eye
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface KPI {
  id: string;
  name: string;
  value: number | string;
  target: number | string;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  changePercent: number;
  status: 'good' | 'warning' | 'critical';
  category: string;
}

interface Alert {
  id: string;
  type: 'predictive' | 'threshold' | 'anomaly';
  severity: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  metric: string;
  predictedImpact: string;
  recommendedAction: string;
  createdAt: string;
  acknowledged: boolean;
}

interface AIRecommendation {
  id: string;
  category: string;
  title: string;
  description: string;
  expectedImpact: string;
  effort: 'low' | 'medium' | 'high';
  priority: number;
  confidence: number;
}

interface DashboardData {
  kpis: KPI[];
  alerts: Alert[];
  recommendations: AIRecommendation[];
  lastUpdated: string;
}

export default function MonitoringDashboard() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: dashboardData, isLoading, refetch } = useQuery<DashboardData>({
    queryKey: ['/api/monitoring/dashboard'],
    refetchInterval: 60000,
  });

  const acknowledgeAlertMutation = useMutation({
    mutationFn: async (alertId: string) => {
      const response = await apiRequest('POST', `/api/monitoring/alerts/${alertId}/acknowledge`);
      return response.json();
    },
    onSuccess: () => {
      refetch();
      toast({
        title: "Alert Acknowledged",
        description: "The alert has been marked as acknowledged."
      });
    }
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
    toast({
      title: "Dashboard Refreshed",
      description: "All metrics have been updated."
    });
  };

  const kpis: KPI[] = dashboardData?.kpis || [
    { id: 'kpi-1', name: 'Monthly Revenue', value: 125000, target: 150000, unit: '$', trend: 'up', changePercent: 12.5, status: 'warning', category: 'Financial' },
    { id: 'kpi-2', name: 'Active Leads', value: 47, target: 50, unit: '', trend: 'up', changePercent: 8.2, status: 'good', category: 'Sales' },
    { id: 'kpi-3', name: 'Conversion Rate', value: 23.5, target: 25, unit: '%', trend: 'down', changePercent: -2.1, status: 'warning', category: 'Sales' },
    { id: 'kpi-4', name: 'Avg Response Time', value: 2.3, target: 2, unit: 'hrs', trend: 'up', changePercent: 15, status: 'critical', category: 'Operations' },
    { id: 'kpi-5', name: 'Customer Satisfaction', value: 4.6, target: 4.5, unit: '/5', trend: 'stable', changePercent: 0, status: 'good', category: 'Customer' },
    { id: 'kpi-6', name: 'Jobs Completed', value: 32, target: 40, unit: '', trend: 'up', changePercent: 6.7, status: 'warning', category: 'Operations' },
    { id: 'kpi-7', name: 'Contractor Utilization', value: 78, target: 85, unit: '%', trend: 'down', changePercent: -3.5, status: 'warning', category: 'Operations' },
    { id: 'kpi-8', name: 'Cash Flow', value: 45000, target: 50000, unit: '$', trend: 'up', changePercent: 22, status: 'good', category: 'Financial' }
  ];

  const alerts: Alert[] = dashboardData?.alerts || [
    { id: 'alert-1', type: 'predictive', severity: 'high', title: 'Revenue Shortfall Predicted', description: 'Based on current trends, Q1 revenue may fall 15% below target', metric: 'Monthly Revenue', predictedImpact: '$22,500 shortfall', recommendedAction: 'Increase lead generation activities and follow up on pending quotes', createdAt: new Date().toISOString(), acknowledged: false },
    { id: 'alert-2', type: 'threshold', severity: 'medium', title: 'Response Time Above SLA', description: 'Average lead response time exceeded 2-hour SLA threshold', metric: 'Avg Response Time', predictedImpact: 'Potential loss of 3-5 leads per week', recommendedAction: 'Assign dedicated staff for initial lead contact during peak hours', createdAt: new Date(Date.now() - 3600000).toISOString(), acknowledged: false },
    { id: 'alert-3', type: 'anomaly', severity: 'low', title: 'Unusual Quote Volume', description: 'Quote requests are 40% higher than typical for this time period', metric: 'Quote Requests', predictedImpact: 'May strain estimating capacity', recommendedAction: 'Consider temporary support or prioritization matrix', createdAt: new Date(Date.now() - 7200000).toISOString(), acknowledged: true }
  ];

  const recommendations: AIRecommendation[] = dashboardData?.recommendations || [
    { id: 'rec-1', category: 'Revenue', title: 'Implement Automated Quote Follow-Up', description: 'Send automated follow-up emails 48 hours after quote delivery to increase conversion rate', expectedImpact: '+5% conversion rate, ~$12,000 additional monthly revenue', effort: 'low', priority: 1, confidence: 87 },
    { id: 'rec-2', category: 'Operations', title: 'Optimize Scheduling Algorithm', description: 'Reduce travel time between jobs by implementing route optimization for contractor assignments', expectedImpact: 'Save 45 minutes per contractor per day, complete 2 more jobs weekly', effort: 'medium', priority: 2, confidence: 82 },
    { id: 'rec-3', category: 'Customer', title: 'Launch Post-Job Review Campaign', description: 'Systematically request reviews from satisfied customers to boost online reputation', expectedImpact: '+15 reviews per month, improved search visibility', effort: 'low', priority: 3, confidence: 91 },
    { id: 'rec-4', category: 'Financial', title: 'Switch to Automated Invoicing', description: 'Reduce payment delays by sending invoices immediately upon job completion with payment links', expectedImpact: 'Reduce DSO by 12 days, improve cash flow by $18,000/month', effort: 'low', priority: 4, confidence: 95 }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-green-400';
      case 'warning': return 'text-yellow-400';
      case 'critical': return 'text-red-400';
      default: return 'text-slate-400';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'good': return 'bg-green-500/20 border-green-500/30';
      case 'warning': return 'bg-yellow-500/20 border-yellow-500/30';
      case 'critical': return 'bg-red-500/20 border-red-500/30';
      default: return 'bg-slate-500/20';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'low': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getEffortColor = (effort: string) => {
    switch (effort) {
      case 'low': return 'bg-green-500/20 text-green-400';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400';
      case 'high': return 'bg-red-500/20 text-red-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const formatValue = (value: number | string, unit: string) => {
    if (typeof value === 'number') {
      if (unit === '$') return `$${value.toLocaleString()}`;
      return `${value}${unit}`;
    }
    return value;
  };

  const categoryIcons: Record<string, any> = {
    'Financial': DollarSign,
    'Sales': Target,
    'Operations': Activity,
    'Customer': Users
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl">
              <Activity className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Monitoring Dashboard</h1>
              <p className="text-slate-400">Real-time KPIs, predictive alerts, and AI recommendations</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            className="border-slate-600"
            onClick={handleRefresh}
            disabled={isRefreshing}
            data-testid="button-refresh"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 border-green-500/30">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Healthy Metrics</p>
                  <p className="text-3xl font-bold text-green-400">
                    {kpis.filter(k => k.status === 'good').length}
                  </p>
                </div>
                <CheckCircle2 className="h-10 w-10 text-green-500/50" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-yellow-900/30 to-orange-900/30 border-yellow-500/30">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Needs Attention</p>
                  <p className="text-3xl font-bold text-yellow-400">
                    {kpis.filter(k => k.status === 'warning').length}
                  </p>
                </div>
                <AlertTriangle className="h-10 w-10 text-yellow-500/50" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-red-900/30 to-rose-900/30 border-red-500/30">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Critical Issues</p>
                  <p className="text-3xl font-bold text-red-400">
                    {kpis.filter(k => k.status === 'critical').length}
                  </p>
                </div>
                <Bell className="h-10 w-10 text-red-500/50" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-blue-900/30 to-indigo-900/30 border-blue-500/30">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">AI Recommendations</p>
                  <p className="text-3xl font-bold text-blue-400">{recommendations.length}</p>
                </div>
                <Brain className="h-10 w-10 text-blue-500/50" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-slate-800/50 border border-slate-700">
            <TabsTrigger value="overview" className="data-[state=active]:bg-cyan-600">
              <BarChart3 className="h-4 w-4 mr-2" />
              KPI Overview
            </TabsTrigger>
            <TabsTrigger value="alerts" className="data-[state=active]:bg-cyan-600">
              <Bell className="h-4 w-4 mr-2" />
              Alerts ({alerts.filter(a => !a.acknowledged).length})
            </TabsTrigger>
            <TabsTrigger value="recommendations" className="data-[state=active]:bg-cyan-600">
              <Brain className="h-4 w-4 mr-2" />
              AI Insights
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {kpis.map((kpi) => {
                const Icon = categoryIcons[kpi.category] || Activity;
                return (
                  <Card key={kpi.id} className={`bg-slate-800/50 border ${getStatusBg(kpi.status)}`}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-3">
                        <div className="p-2 bg-slate-700/50 rounded-lg">
                          <Icon className="h-4 w-4 text-slate-400" />
                        </div>
                        <div className={`flex items-center gap-1 text-xs ${
                          kpi.trend === 'up' ? 'text-green-400' : 
                          kpi.trend === 'down' ? 'text-red-400' : 'text-slate-400'
                        }`}>
                          {kpi.trend === 'up' ? <ArrowUp className="h-3 w-3" /> : 
                           kpi.trend === 'down' ? <ArrowDown className="h-3 w-3" /> : null}
                          {kpi.changePercent !== 0 && `${Math.abs(kpi.changePercent)}%`}
                        </div>
                      </div>
                      <p className="text-sm text-slate-400 mb-1">{kpi.name}</p>
                      <p className={`text-2xl font-bold ${getStatusColor(kpi.status)}`}>
                        {formatValue(kpi.value, kpi.unit)}
                      </p>
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                          <span>Target: {formatValue(kpi.target, kpi.unit)}</span>
                          <span>{Math.round((Number(kpi.value) / Number(kpi.target)) * 100)}%</span>
                        </div>
                        <Progress 
                          value={Math.min((Number(kpi.value) / Number(kpi.target)) * 100, 100)} 
                          className="h-1" 
                        />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="alerts" className="mt-6">
            <div className="space-y-4">
              {alerts.map((alert) => (
                <Card 
                  key={alert.id} 
                  className={`bg-slate-800/50 border-slate-700 ${alert.acknowledged ? 'opacity-60' : ''}`}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg ${getSeverityColor(alert.severity)}`}>
                        {alert.type === 'predictive' ? <TrendingUp className="h-5 w-5" /> :
                         alert.type === 'threshold' ? <AlertTriangle className="h-5 w-5" /> :
                         <Eye className="h-5 w-5" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-white">{alert.title}</span>
                          <Badge className={getSeverityColor(alert.severity)}>
                            {alert.severity}
                          </Badge>
                          <Badge variant="outline" className="text-slate-400 border-slate-600">
                            {alert.type}
                          </Badge>
                          {alert.acknowledged && (
                            <Badge className="bg-slate-700 text-slate-300">
                              Acknowledged
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-slate-400 mb-3">{alert.description}</p>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-slate-500">Predicted Impact</p>
                            <p className="text-red-400">{alert.predictedImpact}</p>
                          </div>
                          <div>
                            <p className="text-slate-500">Recommended Action</p>
                            <p className="text-green-400">{alert.recommendedAction}</p>
                          </div>
                        </div>
                      </div>
                      {!alert.acknowledged && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="border-slate-600"
                          onClick={() => acknowledgeAlertMutation.mutate(alert.id)}
                          data-testid={`button-acknowledge-${alert.id}`}
                        >
                          Acknowledge
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="recommendations" className="mt-6">
            <div className="space-y-4">
              {recommendations.map((rec) => (
                <Card key={rec.id} className="bg-slate-800/50 border-slate-700">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
                        {rec.priority}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-white">{rec.title}</span>
                          <Badge variant="outline" className="text-blue-400 border-blue-500/30">
                            {rec.category}
                          </Badge>
                          <Badge className={getEffortColor(rec.effort)}>
                            {rec.effort} effort
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-400 mb-3">{rec.description}</p>
                        <div className="flex items-center justify-between">
                          <div className="text-sm">
                            <span className="text-slate-500">Expected Impact: </span>
                            <span className="text-green-400">{rec.expectedImpact}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-500">AI Confidence:</span>
                            <Progress value={rec.confidence} className="w-20 h-2" />
                            <span className="text-xs text-blue-400">{rec.confidence}%</span>
                          </div>
                        </div>
                      </div>
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                        Implement
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
      <ModuleVoiceGuide moduleName="monitoring-dashboard" />
    </div>
  );
}
