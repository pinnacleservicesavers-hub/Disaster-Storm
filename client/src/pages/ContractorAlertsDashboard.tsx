import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { AlertTriangle, Send, CheckCircle2, XCircle, DollarSign, MapPin, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ContractorAlertsDashboard() {
  const { toast } = useToast();

  const { data: alerts, isLoading } = useQuery({
    queryKey: ['/api/tree-alerts/recent'],
    refetchInterval: 30000
  });

  const testAlertMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('/api/tree-alerts/test', {
        method: 'POST',
        body: JSON.stringify({
          location: 'Northern Georgia - Atlanta Metro',
          state: 'GA'
        })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tree-alerts/recent'] });
      toast({
        title: "Test Alert Sent",
        description: "SMS alerts sent to contractor phones",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Alert Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white flex items-center gap-3">
              <AlertTriangle className="text-orange-500" size={40} />
              Contractor Alert System
            </h1>
            <p className="text-slate-400 mt-2">Real-time fallen tree detection and SMS deployment alerts</p>
          </div>
          
          <Button
            onClick={() => testAlertMutation.mutate()}
            disabled={testAlertMutation.isPending}
            className="bg-orange-600 hover:bg-orange-700 text-white"
            data-testid="button-send-test-alert"
          >
            <Send className="mr-2 h-4 w-4" />
            {testAlertMutation.isPending ? 'Sending...' : 'Send Test Alert'}
          </Button>
        </div>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <CheckCircle2 className="text-green-500" />
              Active Contractors
            </CardTitle>
            <CardDescription className="text-slate-400">
              SMS alerts configured for fallen tree detection
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-700/50 rounded-lg border border-green-500/30">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-white">John Culpepper</div>
                    <div className="text-sm text-slate-400">+1 (706) 604-4820</div>
                  </div>
                  <Badge className="bg-green-600" data-testid="status-john">Active</Badge>
                </div>
              </div>
              
              <div className="p-4 bg-slate-700/50 rounded-lg border border-green-500/30">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-white">Shannon Wise</div>
                    <div className="text-sm text-slate-400">+1 (706) 840-8949</div>
                  </div>
                  <Badge className="bg-green-600" data-testid="status-shannon">Active</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Recent Alerts Sent</CardTitle>
            <CardDescription className="text-slate-400">
              {alerts?.count || 0} total alerts delivered
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-slate-400">Loading alerts...</div>
            ) : alerts?.alerts?.length > 0 ? (
              <div className="space-y-4">
                {alerts.alerts.map((alert: any) => (
                  <div key={alert.id} className="p-4 bg-slate-700/50 rounded-lg border border-slate-600">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="text-orange-500" size={20} />
                        <span className="font-semibold text-white">{alert.alertType.replace(/_/g, ' ').toUpperCase()}</span>
                      </div>
                      <Badge className={
                        alert.severity === 'critical' ? 'bg-red-600' :
                        alert.severity === 'severe' ? 'bg-orange-600' :
                        alert.severity === 'moderate' ? 'bg-yellow-600' : 'bg-blue-600'
                      }>
                        {alert.severity}
                      </Badge>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-4 mb-3">
                      <div className="flex items-center gap-2 text-sm text-slate-300">
                        <MapPin size={16} />
                        {alert.location}, {alert.state}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-300">
                        <Clock size={16} />
                        {new Date(alert.timestamp).toLocaleString()}
                      </div>
                    </div>
                    
                    <div className="text-sm text-slate-400 mb-3">
                      {alert.description}
                    </div>
                    
                    {alert.estimatedCost && (
                      <div className="flex items-center gap-2 text-green-400 font-semibold">
                        <DollarSign size={16} />
                        Estimated Job Value: ${alert.estimatedCost.min.toLocaleString()} - ${alert.estimatedCost.max.toLocaleString()}
                      </div>
                    )}
                    
                    <div className="mt-3 pt-3 border-t border-slate-600">
                      <div className="text-xs text-slate-500">
                        Alerts sent to: {alert.sentTo.join(', ')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400">
                <AlertTriangle className="mx-auto mb-2 text-slate-600" size={48} />
                <p>No alerts sent yet</p>
                <p className="text-sm mt-1">Click "Send Test Alert" to test the system</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
