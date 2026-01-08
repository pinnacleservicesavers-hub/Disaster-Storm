import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  MousePointer,
  Plus,
  Edit,
  Trash2,
  ExternalLink,
  Check,
  Clock,
  AlertCircle,
  ArrowLeft
} from 'lucide-react';
import { Link } from 'wouter';

interface AffiliatePartner {
  id: string;
  name: string;
  category: string;
  website_url: string | null;
  affiliate_id: string | null;
  affiliate_program: string | null;
  commission_type: string;
  commission_rate: string | null;
  status: string;
  notes: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  created_at: string;
}

interface AffiliateEarning {
  id: string;
  partner_id: string;
  partner_name: string;
  partner_category: string;
  order_reference: string;
  order_amount_cents: number;
  commission_cents: number;
  status: string;
  conversion_date: string;
  product_details: any;
}

interface EarningsSummary {
  partner_id: string;
  partner_name: string;
  category: string;
  commission_rate: string | null;
  status: string;
  total_conversions: string;
  total_order_value_cents: string;
  total_commission_cents: string;
  paid_commission_cents: string;
  pending_commission_cents: string;
  approved_commission_cents: string;
}

export function AffiliateManagement() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [isAddPartnerOpen, setIsAddPartnerOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<AffiliatePartner | null>(null);
  const [newPartner, setNewPartner] = useState({
    name: '',
    category: 'auto_parts',
    websiteUrl: '',
    affiliateId: '',
    affiliateProgram: 'direct',
    commissionType: 'percentage',
    commissionRate: '',
    status: 'active',
    notes: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
  });

  const { data: partners, isLoading: partnersLoading, refetch: refetchPartners } = useQuery<{ ok: boolean; partners: AffiliatePartner[] }>({
    queryKey: ['/api/admin/affiliates'],
  });

  const { data: earningsSummary, isLoading: summaryLoading, refetch: refetchSummary } = useQuery<{ ok: boolean; byPartner: EarningsSummary[]; totals: any }>({
    queryKey: ['/api/admin/affiliates/earnings/summary'],
  });

  const { data: recentEarnings, isLoading: earningsLoading } = useQuery<{ ok: boolean; earnings: AffiliateEarning[] }>({
    queryKey: ['/api/admin/affiliates/earnings/recent'],
  });

  const { data: clickStats } = useQuery<{ ok: boolean; stats: any[] }>({
    queryKey: ['/api/admin/affiliates/clicks/stats'],
  });

  const createPartnerMutation = useMutation({
    mutationFn: async (partner: typeof newPartner) => {
      return apiRequest('/api/admin/affiliates', {
        method: 'POST',
        body: JSON.stringify(partner),
      });
    },
    onSuccess: () => {
      toast({ title: 'Partner Added', description: 'New affiliate partner created successfully' });
      setIsAddPartnerOpen(false);
      resetNewPartner();
      refetchPartners();
      refetchSummary();
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const updatePartnerMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Partial<typeof newPartner>) => {
      return apiRequest(`/api/admin/affiliates/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({ title: 'Partner Updated', description: 'Affiliate partner updated successfully' });
      setEditingPartner(null);
      refetchPartners();
      refetchSummary();
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const deletePartnerMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/admin/affiliates/${id}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      toast({ title: 'Partner Deleted', description: 'Affiliate partner removed' });
      refetchPartners();
      refetchSummary();
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const resetNewPartner = () => {
    setNewPartner({
      name: '',
      category: 'auto_parts',
      websiteUrl: '',
      affiliateId: '',
      affiliateProgram: 'direct',
      commissionType: 'percentage',
      commissionRate: '',
      status: 'active',
      notes: '',
      contactName: '',
      contactEmail: '',
      contactPhone: '',
    });
  };

  const formatCurrency = (cents: number | string) => {
    const value = typeof cents === 'string' ? parseInt(cents) : cents;
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value / 100);
  };

  const formatPercent = (rate: string | null) => {
    if (!rate) return 'N/A';
    return `${(parseFloat(rate) * 100).toFixed(1)}%`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'paid': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'approved': return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
      case 'inactive': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'auto_parts': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'flooring': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'roofing': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'tools': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const totals = earningsSummary?.totals || {};

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-6">
          <Link href="/admin" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to Admin Dashboard
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-green-400 to-emerald-300 bg-clip-text text-transparent">
            Affiliate Partnership Management
          </h1>
          <p className="text-slate-400">
            Track affiliate partners, earnings, and commission payouts
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-green-500/20">
                  <DollarSign className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Total Earnings</p>
                  <p className="text-2xl font-bold text-white" data-testid="text-total-earnings">
                    {formatCurrency(totals.total_commission_cents || 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-blue-500/20">
                  <Check className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Paid Out</p>
                  <p className="text-2xl font-bold text-white" data-testid="text-paid-earnings">
                    {formatCurrency(totals.paid_commission_cents || 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-yellow-500/20">
                  <Clock className="w-6 h-6 text-yellow-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Pending</p>
                  <p className="text-2xl font-bold text-white" data-testid="text-pending-earnings">
                    {formatCurrency((parseInt(totals.pending_commission_cents || '0') + parseInt(totals.approved_commission_cents || '0')))}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-purple-500/20">
                  <Users className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Active Partners</p>
                  <p className="text-2xl font-bold text-white" data-testid="text-active-partners">
                    {partners?.partners?.filter(p => p.status === 'active').length || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-slate-800/50 border border-slate-700">
            <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
            <TabsTrigger value="partners" data-testid="tab-partners">Partners</TabsTrigger>
            <TabsTrigger value="earnings" data-testid="tab-earnings">Earnings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Earnings by Partner</CardTitle>
                <CardDescription>Commission breakdown by affiliate partner</CardDescription>
              </CardHeader>
              <CardContent>
                {summaryLoading ? (
                  <p className="text-slate-400">Loading...</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-700">
                        <TableHead className="text-slate-400">Partner</TableHead>
                        <TableHead className="text-slate-400">Category</TableHead>
                        <TableHead className="text-slate-400">Commission Rate</TableHead>
                        <TableHead className="text-slate-400">Conversions</TableHead>
                        <TableHead className="text-slate-400">Order Value</TableHead>
                        <TableHead className="text-slate-400">Total Commission</TableHead>
                        <TableHead className="text-slate-400">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {earningsSummary?.byPartner?.map((partner) => (
                        <TableRow key={partner.partner_id} className="border-slate-700" data-testid={`row-partner-${partner.partner_id}`}>
                          <TableCell className="text-white font-medium">{partner.partner_name}</TableCell>
                          <TableCell>
                            <Badge className={getCategoryColor(partner.category)}>
                              {partner.category.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-slate-300">{formatPercent(partner.commission_rate)}</TableCell>
                          <TableCell className="text-slate-300">{partner.total_conversions}</TableCell>
                          <TableCell className="text-slate-300">{formatCurrency(partner.total_order_value_cents)}</TableCell>
                          <TableCell className="text-green-400 font-semibold">{formatCurrency(partner.total_commission_cents)}</TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(partner.status)}>{partner.status}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="partners" className="space-y-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-white">Affiliate Partners</CardTitle>
                  <CardDescription>Manage your affiliate partner relationships</CardDescription>
                </div>
                <Dialog open={isAddPartnerOpen} onOpenChange={setIsAddPartnerOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-green-600 hover:bg-green-700" data-testid="button-add-partner">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Partner
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-slate-900 border-slate-700 max-w-2xl">
                    <DialogHeader>
                      <DialogTitle className="text-white">Add New Affiliate Partner</DialogTitle>
                      <DialogDescription>Enter the details for your new affiliate partner</DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-slate-300">Partner Name</Label>
                        <Input
                          value={newPartner.name}
                          onChange={(e) => setNewPartner({ ...newPartner, name: e.target.value })}
                          placeholder="e.g., AutoZone"
                          className="bg-slate-800 border-slate-600"
                          data-testid="input-partner-name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-slate-300">Category</Label>
                        <Select value={newPartner.category} onValueChange={(v) => setNewPartner({ ...newPartner, category: v })}>
                          <SelectTrigger className="bg-slate-800 border-slate-600" data-testid="select-category">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-800 border-slate-600">
                            <SelectItem value="auto_parts">Auto Parts</SelectItem>
                            <SelectItem value="flooring">Flooring</SelectItem>
                            <SelectItem value="roofing">Roofing</SelectItem>
                            <SelectItem value="tools">Tools</SelectItem>
                            <SelectItem value="general">General</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-slate-300">Website URL</Label>
                        <Input
                          value={newPartner.websiteUrl}
                          onChange={(e) => setNewPartner({ ...newPartner, websiteUrl: e.target.value })}
                          placeholder="https://..."
                          className="bg-slate-800 border-slate-600"
                          data-testid="input-website-url"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-slate-300">Affiliate ID</Label>
                        <Input
                          value={newPartner.affiliateId}
                          onChange={(e) => setNewPartner({ ...newPartner, affiliateId: e.target.value })}
                          placeholder="Your affiliate tag"
                          className="bg-slate-800 border-slate-600"
                          data-testid="input-affiliate-id"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-slate-300">Affiliate Program</Label>
                        <Select value={newPartner.affiliateProgram} onValueChange={(v) => setNewPartner({ ...newPartner, affiliateProgram: v })}>
                          <SelectTrigger className="bg-slate-800 border-slate-600" data-testid="select-program">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-800 border-slate-600">
                            <SelectItem value="direct">Direct</SelectItem>
                            <SelectItem value="cj">CJ Affiliate</SelectItem>
                            <SelectItem value="rakuten">Rakuten</SelectItem>
                            <SelectItem value="impact">Impact</SelectItem>
                            <SelectItem value="shareasale">ShareASale</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-slate-300">Commission Rate (%)</Label>
                        <Input
                          value={newPartner.commissionRate}
                          onChange={(e) => setNewPartner({ ...newPartner, commissionRate: e.target.value })}
                          placeholder="e.g., 0.05 for 5%"
                          type="number"
                          step="0.01"
                          className="bg-slate-800 border-slate-600"
                          data-testid="input-commission-rate"
                        />
                      </div>
                      <div className="space-y-2 col-span-2">
                        <Label className="text-slate-300">Notes</Label>
                        <Textarea
                          value={newPartner.notes}
                          onChange={(e) => setNewPartner({ ...newPartner, notes: e.target.value })}
                          placeholder="Additional notes about this partnership..."
                          className="bg-slate-800 border-slate-600"
                          data-testid="input-notes"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsAddPartnerOpen(false)}>Cancel</Button>
                      <Button 
                        onClick={() => createPartnerMutation.mutate(newPartner)}
                        disabled={createPartnerMutation.isPending}
                        className="bg-green-600 hover:bg-green-700"
                        data-testid="button-save-partner"
                      >
                        {createPartnerMutation.isPending ? 'Saving...' : 'Save Partner'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {partnersLoading ? (
                  <p className="text-slate-400">Loading partners...</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-700">
                        <TableHead className="text-slate-400">Partner</TableHead>
                        <TableHead className="text-slate-400">Category</TableHead>
                        <TableHead className="text-slate-400">Program</TableHead>
                        <TableHead className="text-slate-400">Commission</TableHead>
                        <TableHead className="text-slate-400">Status</TableHead>
                        <TableHead className="text-slate-400">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {partners?.partners?.map((partner) => (
                        <TableRow key={partner.id} className="border-slate-700" data-testid={`row-partner-detail-${partner.id}`}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="text-white font-medium">{partner.name}</span>
                              {partner.website_url && (
                                <a href={partner.website_url} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white">
                                  <ExternalLink className="w-4 h-4" />
                                </a>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getCategoryColor(partner.category)}>
                              {partner.category.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-slate-300">{partner.affiliate_program || 'N/A'}</TableCell>
                          <TableCell className="text-slate-300">{formatPercent(partner.commission_rate)}</TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(partner.status)}>{partner.status}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => setEditingPartner(partner)}
                                data-testid={`button-edit-${partner.id}`}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-red-400 hover:text-red-300"
                                onClick={() => {
                                  if (confirm('Are you sure you want to delete this partner?')) {
                                    deletePartnerMutation.mutate(partner.id);
                                  }
                                }}
                                data-testid={`button-delete-${partner.id}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="earnings" className="space-y-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Recent Earnings</CardTitle>
                <CardDescription>Recent commission transactions from affiliate partners</CardDescription>
              </CardHeader>
              <CardContent>
                {earningsLoading ? (
                  <p className="text-slate-400">Loading earnings...</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-700">
                        <TableHead className="text-slate-400">Date</TableHead>
                        <TableHead className="text-slate-400">Partner</TableHead>
                        <TableHead className="text-slate-400">Order Ref</TableHead>
                        <TableHead className="text-slate-400">Order Value</TableHead>
                        <TableHead className="text-slate-400">Commission</TableHead>
                        <TableHead className="text-slate-400">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentEarnings?.earnings?.map((earning) => (
                        <TableRow key={earning.id} className="border-slate-700" data-testid={`row-earning-${earning.id}`}>
                          <TableCell className="text-slate-300">
                            {new Date(earning.conversion_date).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-white font-medium">{earning.partner_name}</TableCell>
                          <TableCell className="text-slate-300 font-mono text-sm">{earning.order_reference}</TableCell>
                          <TableCell className="text-slate-300">{formatCurrency(earning.order_amount_cents)}</TableCell>
                          <TableCell className="text-green-400 font-semibold">{formatCurrency(earning.commission_cents)}</TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(earning.status)}>{earning.status}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default AffiliateManagement;
