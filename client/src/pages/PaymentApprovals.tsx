import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  DollarSign, 
  CheckCircle2, 
  XCircle,
  Clock,
  Users,
  Shield,
  AlertTriangle,
  Loader2,
  Eye,
  FileText,
  Settings,
  ArrowRight,
  UserCheck,
  History
} from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface PaymentRequest {
  id: string;
  type: 'invoice' | 'refund' | 'disbursement' | 'contractor_payment';
  amount: number;
  description: string;
  recipient: string;
  requestedBy: string;
  requestedAt: string;
  status: 'pending_first_approval' | 'pending_second_approval' | 'approved' | 'rejected';
  firstApprover?: { name: string; approvedAt: string };
  secondApprover?: { name: string; approvedAt: string };
  rejectedBy?: { name: string; rejectedAt: string; reason: string };
  threshold: 'standard' | 'high' | 'critical';
  attachments: string[];
  notes: string;
}

interface ApprovalThreshold {
  id: string;
  name: string;
  minAmount: number;
  maxAmount: number | null;
  requiresDualApproval: boolean;
  requiredRole: string;
  description: string;
}

interface ApprovalHistory {
  id: string;
  paymentId: string;
  action: 'approved' | 'rejected' | 'requested';
  performedBy: string;
  performedAt: string;
  notes: string;
}

interface PaymentApprovalsData {
  pendingPayments: PaymentRequest[];
  recentApprovals: PaymentRequest[];
  thresholds: ApprovalThreshold[];
  history: ApprovalHistory[];
}

export default function PaymentApprovals() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedPayment, setSelectedPayment] = useState<PaymentRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  const { data: approvalsData, isLoading, refetch } = useQuery<PaymentApprovalsData>({
    queryKey: ['/api/payments/approvals'],
    refetchInterval: 30000,
  });

  const approveMutation = useMutation({
    mutationFn: async (paymentId: string) => {
      const response = await apiRequest('POST', `/api/payments/${paymentId}/approve`);
      return response.json();
    },
    onSuccess: () => {
      refetch();
      toast({
        title: "Payment Approved",
        description: "Your approval has been recorded."
      });
      setSelectedPayment(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Approval Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ paymentId, reason }: { paymentId: string; reason: string }) => {
      const response = await apiRequest('POST', `/api/payments/${paymentId}/reject`, { reason });
      return response.json();
    },
    onSuccess: () => {
      refetch();
      toast({
        title: "Payment Rejected",
        description: "The payment has been rejected."
      });
      setSelectedPayment(null);
      setShowRejectDialog(false);
      setRejectionReason('');
    },
    onError: (error: Error) => {
      toast({
        title: "Rejection Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const pendingPayments: PaymentRequest[] = approvalsData?.pendingPayments || [
    { id: 'pay-1', type: 'contractor_payment', amount: 8500, description: 'Roofing job completion - 123 Oak St', recipient: 'ABC Roofing LLC', requestedBy: 'John Manager', requestedAt: new Date().toISOString(), status: 'pending_first_approval', threshold: 'high', attachments: ['invoice.pdf', 'completion_photos.zip'], notes: 'Job completed ahead of schedule. All inspections passed.' },
    { id: 'pay-2', type: 'invoice', amount: 2500, description: 'Emergency HVAC repair', recipient: 'Cool Air Services', requestedBy: 'Sarah Ops', requestedAt: new Date(Date.now() - 3600000).toISOString(), status: 'pending_second_approval', firstApprover: { name: 'Mike Director', approvedAt: new Date(Date.now() - 1800000).toISOString() }, threshold: 'standard', attachments: ['invoice.pdf'], notes: 'Emergency after-hours call out.' },
    { id: 'pay-3', type: 'disbursement', amount: 15000, description: 'Insurance claim settlement - Smith residence', recipient: 'Smith Family Trust', requestedBy: 'Claims Dept', requestedAt: new Date(Date.now() - 7200000).toISOString(), status: 'pending_first_approval', threshold: 'critical', attachments: ['claim_docs.pdf', 'adjuster_report.pdf'], notes: 'Final settlement pending dual approval.' }
  ];

  const recentApprovals: PaymentRequest[] = approvalsData?.recentApprovals || [
    { id: 'pay-4', type: 'contractor_payment', amount: 3200, description: 'Tree removal - 456 Maple Ave', recipient: 'TreePro Services', requestedBy: 'Tom Field', requestedAt: new Date(Date.now() - 86400000).toISOString(), status: 'approved', firstApprover: { name: 'Mike Director', approvedAt: new Date(Date.now() - 82800000).toISOString() }, secondApprover: { name: 'Lisa CFO', approvedAt: new Date(Date.now() - 79200000).toISOString() }, threshold: 'standard', attachments: [], notes: '' },
    { id: 'pay-5', type: 'refund', amount: 500, description: 'Customer refund - cancelled service', recipient: 'Jane Customer', requestedBy: 'Support Team', requestedAt: new Date(Date.now() - 172800000).toISOString(), status: 'rejected', rejectedBy: { name: 'Mike Director', rejectedAt: new Date(Date.now() - 169200000).toISOString(), reason: 'Refund request outside policy window' }, threshold: 'standard', attachments: [], notes: '' }
  ];

  const thresholds: ApprovalThreshold[] = approvalsData?.thresholds || [
    { id: 'thresh-1', name: 'Standard', minAmount: 0, maxAmount: 5000, requiresDualApproval: false, requiredRole: 'manager', description: 'Single approval by manager' },
    { id: 'thresh-2', name: 'High', minAmount: 5000, maxAmount: 25000, requiresDualApproval: true, requiredRole: 'director', description: 'Dual approval required - Manager + Director' },
    { id: 'thresh-3', name: 'Critical', minAmount: 25000, maxAmount: null, requiresDualApproval: true, requiredRole: 'executive', description: 'Dual approval required - Director + Executive' }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'rejected': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'pending_first_approval': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'pending_second_approval': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'approved': return 'Approved';
      case 'rejected': return 'Rejected';
      case 'pending_first_approval': return 'Awaiting 1st Approval';
      case 'pending_second_approval': return 'Awaiting 2nd Approval';
      default: return status;
    }
  };

  const getThresholdColor = (threshold: string) => {
    switch (threshold) {
      case 'standard': return 'bg-slate-500/20 text-slate-400';
      case 'high': return 'bg-orange-500/20 text-orange-400';
      case 'critical': return 'bg-red-500/20 text-red-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'contractor_payment': return Users;
      case 'invoice': return FileText;
      case 'refund': return ArrowRight;
      case 'disbursement': return DollarSign;
      default: return DollarSign;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Payment Approvals</h1>
            <p className="text-slate-400">Dual-control payment authorization with configurable thresholds</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-yellow-900/30 to-orange-900/30 border-yellow-500/30">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Pending Approval</p>
                  <p className="text-3xl font-bold text-yellow-400">{pendingPayments.length}</p>
                </div>
                <Clock className="h-10 w-10 text-yellow-500/50" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-blue-900/30 to-indigo-900/30 border-blue-500/30">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Pending Amount</p>
                  <p className="text-2xl font-bold text-blue-400">
                    {formatCurrency(pendingPayments.reduce((sum, p) => sum + p.amount, 0))}
                  </p>
                </div>
                <DollarSign className="h-10 w-10 text-blue-500/50" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 border-green-500/30">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Approved Today</p>
                  <p className="text-3xl font-bold text-green-400">
                    {recentApprovals.filter(p => p.status === 'approved').length}
                  </p>
                </div>
                <CheckCircle2 className="h-10 w-10 text-green-500/50" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-red-900/30 to-rose-900/30 border-red-500/30">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Critical Pending</p>
                  <p className="text-3xl font-bold text-red-400">
                    {pendingPayments.filter(p => p.threshold === 'critical').length}
                  </p>
                </div>
                <AlertTriangle className="h-10 w-10 text-red-500/50" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-slate-800/50 border border-slate-700">
            <TabsTrigger value="pending" className="data-[state=active]:bg-green-600">
              <Clock className="h-4 w-4 mr-2" />
              Pending ({pendingPayments.length})
            </TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-green-600">
              <History className="h-4 w-4 mr-2" />
              Recent
            </TabsTrigger>
            <TabsTrigger value="thresholds" className="data-[state=active]:bg-green-600">
              <Settings className="h-4 w-4 mr-2" />
              Thresholds
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-6">
            <div className="space-y-4">
              {pendingPayments.map((payment) => {
                const TypeIcon = getTypeIcon(payment.type);
                return (
                  <Card key={payment.id} className="bg-slate-800/50 border-slate-700">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-lg ${getThresholdColor(payment.threshold)}`}>
                          <TypeIcon className="h-6 w-6" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-white">{payment.description}</span>
                            <Badge className={getStatusColor(payment.status)}>
                              {getStatusLabel(payment.status)}
                            </Badge>
                            <Badge className={getThresholdColor(payment.threshold)}>
                              {payment.threshold}
                            </Badge>
                          </div>
                          <p className="text-2xl font-bold text-green-400 mb-2">{formatCurrency(payment.amount)}</p>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-slate-500">Recipient</p>
                              <p className="text-white">{payment.recipient}</p>
                            </div>
                            <div>
                              <p className="text-slate-500">Requested By</p>
                              <p className="text-white">{payment.requestedBy}</p>
                            </div>
                            <div>
                              <p className="text-slate-500">Requested At</p>
                              <p className="text-white">{formatDate(payment.requestedAt)}</p>
                            </div>
                            <div>
                              <p className="text-slate-500">Type</p>
                              <p className="text-white capitalize">{payment.type.replace('_', ' ')}</p>
                            </div>
                          </div>
                          {payment.firstApprover && (
                            <div className="mt-3 p-2 bg-green-900/20 rounded-lg border border-green-500/30">
                              <div className="flex items-center gap-2 text-sm text-green-400">
                                <UserCheck className="h-4 w-4" />
                                <span>1st Approval: {payment.firstApprover.name} at {formatDate(payment.firstApprover.approvedAt)}</span>
                              </div>
                            </div>
                          )}
                          {payment.notes && (
                            <p className="mt-2 text-sm text-slate-400 italic">{payment.notes}</p>
                          )}
                          {payment.attachments.length > 0 && (
                            <div className="mt-2 flex items-center gap-2">
                              <FileText className="h-4 w-4 text-slate-500" />
                              <span className="text-xs text-slate-500">{payment.attachments.join(', ')}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col gap-2">
                          <Button 
                            size="sm" 
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => approveMutation.mutate(payment.id)}
                            disabled={approveMutation.isPending}
                            data-testid={`button-approve-${payment.id}`}
                          >
                            {approveMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <CheckCircle2 className="h-4 w-4 mr-1" />
                                Approve
                              </>
                            )}
                          </Button>
                          <Dialog open={showRejectDialog && selectedPayment?.id === payment.id} onOpenChange={(open) => {
                            setShowRejectDialog(open);
                            if (open) setSelectedPayment(payment);
                          }}>
                            <DialogTrigger asChild>
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="border-red-500/50 text-red-400 hover:bg-red-900/20"
                                data-testid={`button-reject-${payment.id}`}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-slate-800 border-slate-700">
                              <DialogHeader>
                                <DialogTitle>Reject Payment</DialogTitle>
                                <DialogDescription>
                                  Please provide a reason for rejecting this payment of {formatCurrency(payment.amount)}.
                                </DialogDescription>
                              </DialogHeader>
                              <Input
                                placeholder="Rejection reason..."
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                className="bg-slate-700/50 border-slate-600"
                              />
                              <DialogFooter>
                                <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
                                  Cancel
                                </Button>
                                <Button 
                                  variant="destructive"
                                  onClick={() => rejectMutation.mutate({ paymentId: payment.id, reason: rejectionReason })}
                                  disabled={!rejectionReason || rejectMutation.isPending}
                                >
                                  {rejectMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Reject Payment'}
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            className="text-slate-400"
                            onClick={() => setSelectedPayment(payment)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Details
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              {pendingPayments.length === 0 && (
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardContent className="py-12 text-center">
                    <CheckCircle2 className="h-12 w-12 text-green-500/50 mx-auto mb-4" />
                    <p className="text-slate-400">No pending payments requiring approval</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            <div className="space-y-4">
              {recentApprovals.map((payment) => {
                const TypeIcon = getTypeIcon(payment.type);
                return (
                  <Card key={payment.id} className="bg-slate-800/50 border-slate-700 opacity-80">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-lg ${payment.status === 'approved' ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                          {payment.status === 'approved' ? (
                            <CheckCircle2 className="h-6 w-6 text-green-400" />
                          ) : (
                            <XCircle className="h-6 w-6 text-red-400" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-white">{payment.description}</span>
                            <Badge className={getStatusColor(payment.status)}>
                              {getStatusLabel(payment.status)}
                            </Badge>
                          </div>
                          <p className="text-xl font-bold text-slate-400 mb-2">{formatCurrency(payment.amount)}</p>
                          <div className="text-sm text-slate-400">
                            <p>Recipient: {payment.recipient}</p>
                            {payment.status === 'approved' && payment.secondApprover && (
                              <div className="mt-2 flex items-center gap-4">
                                <span className="text-green-400">1st: {payment.firstApprover?.name}</span>
                                <ArrowRight className="h-4 w-4" />
                                <span className="text-green-400">2nd: {payment.secondApprover.name}</span>
                              </div>
                            )}
                            {payment.status === 'rejected' && payment.rejectedBy && (
                              <div className="mt-2 p-2 bg-red-900/20 rounded border border-red-500/30">
                                <p className="text-red-400">Rejected by {payment.rejectedBy.name}</p>
                                <p className="text-red-300 text-xs mt-1">Reason: {payment.rejectedBy.reason}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="thresholds" className="mt-6">
            <Card className="bg-slate-800/50 border-slate-700 mb-6">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="h-5 w-5 text-green-400" />
                  Approval Thresholds
                </CardTitle>
                <CardDescription>Configure payment approval requirements based on amount</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {thresholds.map((threshold, i) => (
                    <div key={threshold.id} className="flex items-center gap-4 p-4 bg-slate-700/30 rounded-lg">
                      <div className={`w-3 h-3 rounded-full ${
                        threshold.name === 'Standard' ? 'bg-slate-400' :
                        threshold.name === 'High' ? 'bg-orange-400' : 'bg-red-400'
                      }`} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white">{threshold.name}</span>
                          {threshold.requiresDualApproval && (
                            <Badge className="bg-blue-500/20 text-blue-400">
                              <Users className="h-3 w-3 mr-1" />
                              Dual Approval
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-slate-400">{threshold.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-medium">
                          {formatCurrency(threshold.minAmount)} - {threshold.maxAmount ? formatCurrency(threshold.maxAmount) : 'Unlimited'}
                        </p>
                        <p className="text-xs text-slate-500">Required: {threshold.requiredRole}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <div className="text-center text-sm text-slate-500">
              <p>Threshold configuration changes require admin approval</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
