import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { 
  Phone, Mail, MapPin, Calendar, TrendingUp, Users, CheckCircle2, 
  Clock, AlertTriangle, Building2, Wrench, Home, Trees, Fence,
  Waves, Square, Hammer, Wind, Zap, Droplet, Plus, Eye, Filter
} from 'lucide-react';
import type { AiLead, AiLeadService, AiContractor } from '@shared/schema';
import ModuleAIAssistant from '@/components/ModuleAIAssistant';

const SERVICE_CATEGORIES = [
  { id: 'tree', label: 'Tree', icon: Trees, color: 'bg-emerald-600 dark:bg-emerald-500' },
  { id: 'roofing', label: 'Roofing', icon: Home, color: 'bg-[hsl(217,91%,35%)] dark:bg-[hsl(217,71%,53%)]' },
  { id: 'fence', label: 'Fence', icon: Fence, color: 'bg-amber-600 dark:bg-amber-500' },
  { id: 'pool', label: 'Pool', icon: Waves, color: 'bg-cyan-600 dark:bg-cyan-500' },
  { id: 'windows', label: 'Windows', icon: Square, color: 'bg-purple-600 dark:bg-purple-500' },
  { id: 'siding', label: 'Siding', icon: Building2, color: 'bg-slate-600 dark:bg-slate-500' },
  { id: 'gutters', label: 'Gutters', icon: Droplet, color: 'bg-indigo-600 dark:bg-indigo-500' },
  { id: 'hvac', label: 'HVAC', icon: Wind, color: 'bg-[hsl(25,95%,53%)]' },
  { id: 'electrical', label: 'Electrical', icon: Zap, color: 'bg-yellow-600 dark:bg-yellow-500' },
  { id: 'plumbing', label: 'Plumbing', icon: Hammer, color: 'bg-teal-600 dark:bg-teal-500' },
];

const PRIORITY_COLORS = {
  urgent: 'bg-[hsl(0,84%,60%)] dark:bg-[hsl(0,84%,60%)] text-white',
  high: 'bg-[hsl(25,95%,53%)] dark:bg-[hsl(25,95%,53%)] text-white',
  medium: 'bg-yellow-600 dark:bg-yellow-500 text-white',
  low: 'bg-[hsl(142,76%,36%)] dark:bg-[hsl(142,76%,46%)] text-white',
};

const STATUS_COLORS = {
  new: 'bg-[hsl(217,91%,60%)] dark:bg-[hsl(217,71%,53%)]',
  contacted: 'bg-purple-600 dark:bg-purple-500',
  qualified: 'bg-indigo-600 dark:bg-indigo-500',
  assigned: 'bg-[hsl(142,76%,36%)] dark:bg-[hsl(142,76%,46%)]',
  closed: 'bg-slate-600 dark:bg-slate-500',
};

export default function AILeadManagement() {
  const { toast } = useToast();
  const [selectedLead, setSelectedLead] = useState<AiLead | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    insuranceStatus: '',
  });

  const { data: leads = [], isLoading } = useQuery<AiLead[]>({
    queryKey: ['/api/ai-leads', filters],
  });

  const { data: leadDetail } = useQuery({
    queryKey: ['/api/ai-leads', selectedLead?.id],
    enabled: !!selectedLead,
  });

  const { data: stats } = useQuery({
    queryKey: ['/api/ai-leads/stats/dashboard'],
  });

  const createLeadMutation = useMutation({
    mutationFn: async (data: any) => apiRequest('/api/ai-leads', 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ai-leads'] });
      toast({
        title: 'Lead created successfully',
        description: 'AI analysis and contractor assignment in progress...',
      });
      setIsCreateOpen(false);
    },
  });

  const updateServiceMutation = useMutation({
    mutationFn: async ({ leadId, serviceId, updates }: any) =>
      apiRequest(`/api/ai-leads/${leadId}/services/${serviceId}`, 'PATCH', updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ai-leads'] });
      toast({ title: 'Service updated' });
    },
  });

  const assignContractorsMutation = useMutation({
    mutationFn: async ({ leadId, serviceId }: any) =>
      apiRequest(`/api/ai-leads/${leadId}/services/${serviceId}/assign`, 'POST', {}),
    onSuccess: () => {
      toast({
        title: 'Contractors assigned',
        description: 'Tier 1 and Tier 2 contractors have been notified',
      });
    },
  });

  const handleViewDetails = (lead: AiLead) => {
    setSelectedLead(lead);
    setIsDetailOpen(true);
  };

  const handleServiceToggle = (service: AiLeadService, needed: boolean) => {
    if (selectedLead) {
      updateServiceMutation.mutate({
        leadId: selectedLead.id,
        serviceId: service.id,
        updates: { needed },
      });
    }
  };

  const handleAssignContractors = (serviceId: string) => {
    if (selectedLead) {
      assignContractorsMutation.mutate({
        leadId: selectedLead.id,
        serviceId,
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(217,91%,15%)] via-[hsl(217,91%,25%)] to-[hsl(215,25%,25%)] dark:from-[hsl(217,91%,10%)] dark:via-[hsl(217,91%,20%)] dark:to-[hsl(215,25%,20%)] p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">AI Lead Management</h1>
            <p className="text-slate-300 dark:text-slate-400">Intelligent damage assessment and contractor routing</p>
          </div>
          <Button 
            onClick={() => setIsCreateOpen(true)}
            className="bg-gradient-to-r from-[hsl(217,91%,35%)] to-[hsl(217,71%,53%)] hover:from-[hsl(217,91%,25%)] hover:to-[hsl(217,71%,43%)] text-white font-semibold shadow-lg"
            data-testid="button-create-lead"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Lead
          </Button>
        </div>

        {/* Stats Dashboard */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-slate-800/50 dark:bg-slate-900/50 border-slate-700 dark:border-slate-600 backdrop-blur">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400 dark:text-slate-500">Total Leads</p>
                    <p className="text-3xl font-bold text-white" data-testid="text-total-leads">{stats.leads?.totalLeads || 0}</p>
                  </div>
                  <Users className="h-8 w-8 text-[hsl(217,71%,53%)]" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 dark:bg-slate-900/50 border-slate-700 dark:border-slate-600 backdrop-blur">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400 dark:text-slate-500">New Leads</p>
                    <p className="text-3xl font-bold text-white" data-testid="text-new-leads">{stats.leads?.newLeads || 0}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-[hsl(25,95%,53%)]" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 dark:bg-slate-900/50 border-slate-700 dark:border-slate-600 backdrop-blur">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400 dark:text-slate-500">Assigned</p>
                    <p className="text-3xl font-bold text-white" data-testid="text-assigned-leads">{stats.leads?.assignedLeads || 0}</p>
                  </div>
                  <CheckCircle2 className="h-8 w-8 text-[hsl(142,76%,36%)]" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 dark:bg-slate-900/50 border-slate-700 dark:border-slate-600 backdrop-blur">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400 dark:text-slate-500">Avg AI Confidence</p>
                    <p className="text-3xl font-bold text-white" data-testid="text-avg-confidence">
                      {Math.round(stats.leads?.avgConfidence || 0)}%
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-purple-500 dark:text-purple-400" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card className="bg-slate-800/50 dark:bg-slate-900/50 border-slate-700 dark:border-slate-600 backdrop-blur">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-[hsl(217,71%,53%)]" />
              <CardTitle className="text-white">Filters</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-slate-300 dark:text-slate-400">Status</Label>
                <Select value={filters.status} onValueChange={(v) => setFilters({ ...filters, status: v === 'all' ? '' : v })}>
                  <SelectTrigger className="bg-slate-900 dark:bg-slate-950 border-slate-700 dark:border-slate-600 text-white" data-testid="select-status-filter">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 dark:bg-slate-950 border-slate-700 dark:border-slate-600">
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="contacted">Contacted</SelectItem>
                    <SelectItem value="qualified">Qualified</SelectItem>
                    <SelectItem value="assigned">Assigned</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-slate-300 dark:text-slate-400">Priority</Label>
                <Select value={filters.priority} onValueChange={(v) => setFilters({ ...filters, priority: v === 'all' ? '' : v })}>
                  <SelectTrigger className="bg-slate-900 dark:bg-slate-950 border-slate-700 dark:border-slate-600 text-white" data-testid="select-priority-filter">
                    <SelectValue placeholder="All priorities" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 dark:bg-slate-950 border-slate-700 dark:border-slate-600">
                    <SelectItem value="all">All priorities</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-slate-300 dark:text-slate-400">Insurance Status</Label>
                <Select value={filters.insuranceStatus} onValueChange={(v) => setFilters({ ...filters, insuranceStatus: v === 'all' ? '' : v })}>
                  <SelectTrigger className="bg-slate-900 dark:bg-slate-950 border-slate-700 dark:border-slate-600 text-white" data-testid="select-insurance-filter">
                    <SelectValue placeholder="All insurance" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 dark:bg-slate-950 border-slate-700 dark:border-slate-600">
                    <SelectItem value="all">All insurance</SelectItem>
                    <SelectItem value="likely">Likely</SelectItem>
                    <SelectItem value="unlikely">Unlikely</SelectItem>
                    <SelectItem value="unknown">Unknown</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Leads List */}
        <Card className="bg-slate-800/50 dark:bg-slate-900/50 border-slate-700 dark:border-slate-600 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-white">Leads</CardTitle>
            <CardDescription className="text-slate-400 dark:text-slate-500">
              {isLoading ? 'Loading...' : `${leads.length} leads found`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {leads.map((lead) => (
                <Card 
                  key={lead.id} 
                  className="bg-slate-900/50 dark:bg-slate-950/50 border-slate-700 dark:border-slate-600 hover:bg-slate-900/70 dark:hover:bg-slate-950/70 hover:border-[hsl(217,71%,53%)] transition-all cursor-pointer"
                  onClick={() => handleViewDetails(lead)}
                  data-testid={`card-lead-${lead.id}`}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold text-white">{lead.name}</h3>
                          <Badge className={STATUS_COLORS[lead.status as keyof typeof STATUS_COLORS] + " text-white"}>
                            {lead.status}
                          </Badge>
                          <Badge className={PRIORITY_COLORS[lead.priority as keyof typeof PRIORITY_COLORS]}>
                            {lead.priority}
                          </Badge>
                          <Badge variant="outline" className="text-[hsl(217,71%,53%)] border-[hsl(217,71%,53%)]">
                            {lead.aiConfidence}% AI Confidence
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-slate-400">
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            {lead.phone}
                          </div>
                          {lead.email && (
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4" />
                              {lead.email}
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            {lead.address}
                          </div>
                        </div>

                        {lead.damageDescription && (
                          <p className="text-sm text-slate-300 line-clamp-2">{lead.damageDescription}</p>
                        )}

                        <div className="flex items-center gap-2">
                          {lead.damageType?.slice(0, 3).map((type) => (
                            <Badge key={type} variant="outline" className="text-[hsl(0,84%,60%)] border-[hsl(0,84%,60%)]">
                              {type}
                            </Badge>
                          ))}
                          {lead.damageType && lead.damageType.length > 3 && (
                            <Badge variant="outline" className="text-slate-400 dark:text-slate-500">
                              +{lead.damageType.length - 3} more
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-600">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(lead.createdAt).toLocaleDateString()}
                          </div>
                          {lead.lastContactedAt && (
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              Last contact: {new Date(lead.lastContactedAt).toLocaleDateString()}
                            </div>
                          )}
                          <div>
                            Contact attempts: {lead.contactAttempts}
                          </div>
                        </div>
                      </div>

                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-[hsl(217,71%,53%)] hover:text-[hsl(217,71%,63%)] hover:bg-[hsl(217,71%,53%)]/10"
                        data-testid={`button-view-${lead.id}`}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {!isLoading && leads.length === 0 && (
                <div className="text-center py-12 text-slate-400">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No leads found matching your filters</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Lead Detail Dialog */}
        <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <DialogContent className="max-w-4xl bg-slate-900 dark:bg-slate-950 border-slate-700 dark:border-slate-600 text-white max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white">{selectedLead?.name}</DialogTitle>
              <DialogDescription className="text-slate-400 dark:text-slate-500">
                Lead ID: {selectedLead?.id}
              </DialogDescription>
            </DialogHeader>

            {leadDetail && (
              <div className="space-y-6">
                {/* Services Grid */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-white">Required Services</h3>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {SERVICE_CATEGORIES.map((category) => {
                      const service = leadDetail.services?.find(
                        (s: AiLeadService) => s.category === category.id
                      );
                      const Icon = category.icon;

                      return (
                        <Card
                          key={category.id}
                          className={`cursor-pointer transition-all ${
                            service?.needed
                              ? 'bg-[hsl(217,91%,25%)]/50 dark:bg-[hsl(217,91%,20%)]/50 border-[hsl(217,71%,53%)] ring-2 ring-[hsl(217,71%,53%)]'
                              : 'bg-slate-800/30 dark:bg-slate-900/30 border-slate-700 dark:border-slate-600 hover:bg-slate-800/50 dark:hover:bg-slate-900/50'
                          }`}
                          onClick={() => service && handleServiceToggle(service, !service.needed)}
                          data-testid={`service-${category.id}`}
                        >
                          <CardContent className="pt-4 pb-3">
                            <div className="flex flex-col items-center gap-2 text-center">
                              <div className={`p-2 rounded-lg ${category.color}`}>
                                <Icon className="h-5 w-5 text-white" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-white">{category.label}</p>
                                {service?.needed && (
                                  <Badge variant="outline" className="mt-1 text-xs">
                                    Priority: {service.priority}
                                  </Badge>
                                )}
                              </div>
                              {service?.assignedContractorId && (
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>

                {/* AI Analysis */}
                {selectedLead?.aiAnalysis && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-white">AI Analysis</h3>
                    <Card className="bg-slate-800/50 dark:bg-slate-900/50 border-slate-700 dark:border-slate-600">
                      <CardContent className="pt-4">
                        <pre className="text-xs text-slate-300 dark:text-slate-400 whitespace-pre-wrap">
                          {JSON.stringify(selectedLead.aiAnalysis, null, 2)}
                        </pre>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Outreach History */}
                {leadDetail.outreach && leadDetail.outreach.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-white">Outreach History</h3>
                    <div className="space-y-2">
                      {leadDetail.outreach.map((out: any) => (
                        <Card key={out.id} className="bg-slate-800/50 dark:bg-slate-900/50 border-slate-700 dark:border-slate-600">
                          <CardContent className="pt-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Badge className="bg-[hsl(217,71%,53%)] text-white">{out.method}</Badge>
                                <span className="text-sm text-slate-300 dark:text-slate-400">{out.message || out.subject}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant={out.status === 'sent' ? 'default' : 'destructive'}>
                                  {out.status}
                                </Badge>
                                <span className="text-xs text-slate-500 dark:text-slate-600">
                                  {new Date(out.createdAt).toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Service Actions */}
                <div className="flex gap-3">
                  {leadDetail.services?.filter((s: AiLeadService) => s.needed && !s.assignedContractorId).map((service: AiLeadService) => (
                    <Button
                      key={service.id}
                      onClick={() => handleAssignContractors(service.id)}
                      variant="outline"
                      className="border-[hsl(217,71%,53%)] text-[hsl(217,71%,53%)] hover:bg-[hsl(217,71%,53%)]/10"
                      data-testid={`button-assign-${service.id}`}
                    >
                      <Wrench className="mr-2 h-4 w-4" />
                      Assign contractors for {service.category}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Create Lead Dialog */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent className="max-w-2xl bg-slate-900 dark:bg-slate-950 border-slate-700 dark:border-slate-600 text-white">
            <DialogHeader>
              <DialogTitle className="text-white">Create New Lead</DialogTitle>
              <DialogDescription className="text-slate-400 dark:text-slate-500">
                AI will automatically analyze the damage and recommend services
              </DialogDescription>
            </DialogHeader>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                createLeadMutation.mutate({
                  name: formData.get('name'),
                  phone: formData.get('phone'),
                  email: formData.get('email'),
                  address: formData.get('address'),
                  damageDescription: formData.get('damageDescription'),
                  source: 'manual',
                });
              }}
              className="space-y-4"
            >
              <div>
                <Label className="text-slate-300 dark:text-slate-400">Name</Label>
                <Input
                  name="name"
                  required
                  className="bg-slate-800 dark:bg-slate-900 border-slate-700 dark:border-slate-600 text-white"
                  data-testid="input-name"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-300 dark:text-slate-400">Phone</Label>
                  <Input
                    name="phone"
                    type="tel"
                    required
                    className="bg-slate-800 dark:bg-slate-900 border-slate-700 dark:border-slate-600 text-white"
                    data-testid="input-phone"
                  />
                </div>
                <div>
                  <Label className="text-slate-300 dark:text-slate-400">Email</Label>
                  <Input
                    name="email"
                    type="email"
                    className="bg-slate-800 dark:bg-slate-900 border-slate-700 dark:border-slate-600 text-white"
                    data-testid="input-email"
                  />
                </div>
              </div>

              <div>
                <Label className="text-slate-300 dark:text-slate-400">Property Address</Label>
                <Input
                  name="address"
                  required
                  className="bg-slate-800 dark:bg-slate-900 border-slate-700 dark:border-slate-600 text-white"
                  data-testid="input-address"
                />
              </div>

              <div>
                <Label className="text-slate-300 dark:text-slate-400">Damage Description</Label>
                <Textarea
                  name="damageDescription"
                  required
                  rows={4}
                  className="bg-slate-800 dark:bg-slate-900 border-slate-700 dark:border-slate-600 text-white"
                  placeholder="Describe the damage in detail..."
                  data-testid="textarea-damage-description"
                />
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateOpen(false)}
                  className="border-slate-700 dark:border-slate-600 text-slate-300 dark:text-slate-400"
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-gradient-to-r from-[hsl(217,91%,35%)] to-[hsl(217,71%,53%)] hover:from-[hsl(217,91%,25%)] hover:to-[hsl(217,71%,43%)] text-white font-semibold"
                  disabled={createLeadMutation.isPending}
                  data-testid="button-submit"
                >
                  {createLeadMutation.isPending ? 'Creating...' : 'Create Lead'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* AI Assistant with Evelyn voice */}
      <ModuleAIAssistant 
        moduleName="AI Lead Management" 
        moduleContext="AI-powered lead management system with multi-service tracking, contractor routing, and automated outreach for storm damage restoration"
      />
    </div>
  );
}
