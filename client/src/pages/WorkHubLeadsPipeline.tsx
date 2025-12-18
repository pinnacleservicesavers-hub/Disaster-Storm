import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import {
  Users, DollarSign, TrendingUp, Target, Phone, Mail, MapPin, 
  Calendar, Clock, Plus, Search, Filter, MessageSquare, FileText, 
  XCircle, CheckCircle, ArrowRight, RefreshCw, User
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import type { WorkhubLead } from '@shared/schema';
import { insertWorkhubLeadSchema } from '@shared/schema';

interface PipelineStage {
  id: string;
  label: string;
  color: string;
}

interface PipelineData {
  stages: PipelineStage[];
  pipeline: Record<string, WorkhubLead[]>;
  metrics: {
    totalLeads: number;
    newLeads: number;
    activeLeads: number;
    wonLeads: number;
    lostLeads: number;
    totalPotentialValue: number;
    totalWonValue: number;
    conversionRate: string;
  };
}

const SERVICE_TYPES = [
  'Roofing', 'Tree Services', 'Fencing', 'Painting', 'Flooring',
  'Drywall', 'Plumbing', 'Electrical', 'HVAC', 'General Repair'
];

const LEAD_SOURCES = [
  'Website', 'Referral', 'Google Ads', 'Facebook', 'Home Advisor',
  'Thumbtack', 'Angi', 'Walk-in', 'Phone Call', 'Other'
];

const PRIORITIES = [
  { value: 'low', label: 'Low', color: 'bg-gray-100 text-gray-700' },
  { value: 'medium', label: 'Medium', color: 'bg-blue-100 text-blue-700' },
  { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-700' },
  { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-700' }
];

const addLeadFormSchema = insertWorkhubLeadSchema.extend({
  customerName: z.string().min(1, 'Customer name is required'),
  customerPhone: z.string().min(1, 'Phone is required'),
  serviceType: z.string().min(1, 'Service type is required'),
  propertyAddress: z.string().min(1, 'Address is required'),
});

type AddLeadFormValues = z.infer<typeof addLeadFormSchema>;

export default function WorkHubLeadsPipeline() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [serviceFilter, setServiceFilter] = useState<string>('all');
  const [selectedLead, setSelectedLead] = useState<WorkhubLead | null>(null);
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);

  const form = useForm<AddLeadFormValues>({
    resolver: zodResolver(addLeadFormSchema),
    defaultValues: {
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      propertyAddress: '',
      city: '',
      state: '',
      zip: '',
      serviceType: '',
      priority: 'medium',
      source: '',
      estimatedAmount: '',
      description: ''
    }
  });

  const { data: pipelineData, isLoading } = useQuery<PipelineData>({
    queryKey: ['/api/workhub/leads/pipeline', serviceFilter],
  });

  const createLeadMutation = useMutation({
    mutationFn: async (data: AddLeadFormValues) => {
      return apiRequest('/api/workhub/leads', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/workhub/leads/pipeline', serviceFilter] });
      setIsAddLeadOpen(false);
      form.reset();
      toast({ title: 'Lead created', description: 'New lead added to the pipeline.' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to create lead.', variant: 'destructive' });
    }
  });

  const updateStageMutation = useMutation({
    mutationFn: async ({ leadId, stage }: { leadId: string; stage: string }) => {
      return apiRequest(`/api/workhub/leads/${leadId}/stage`, {
        method: 'PATCH',
        body: JSON.stringify({ stage }),
        headers: { 'Content-Type': 'application/json' }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/workhub/leads/pipeline', serviceFilter] });
      toast({ title: 'Stage updated', description: 'Lead moved to new stage.' });
    }
  });

  const getPriorityBadge = (priority: string | null) => {
    const config = PRIORITIES.find(p => p.value === priority) || PRIORITIES[1];
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const formatCurrency = (amount: string | number | null) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : (amount || 0);
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(num);
  };

  const getStageIcon = (stageId: string) => {
    const icons: Record<string, JSX.Element> = {
      new_lead: <Users className="h-4 w-4" />,
      contacted: <Phone className="h-4 w-4" />,
      estimate_scheduled: <Calendar className="h-4 w-4" />,
      estimate_completed: <FileText className="h-4 w-4" />,
      closing: <Target className="h-4 w-4" />,
      job_scheduled: <Clock className="h-4 w-4" />,
      job_completed: <CheckCircle className="h-4 w-4" />,
      lost: <XCircle className="h-4 w-4" />
    };
    return icons[stageId] || <ArrowRight className="h-4 w-4" />;
  };

  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    e.dataTransfer.setData('leadId', leadId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData('leadId');
    if (leadId) {
      updateStageMutation.mutate({ leadId, stage: stageId });
    }
  };

  const onSubmit = (data: AddLeadFormValues) => {
    createLeadMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-3 text-lg text-slate-600">Loading pipeline...</span>
        </div>
      </div>
    );
  }

  const stages = pipelineData?.stages || [];
  const pipeline = pipelineData?.pipeline || {};
  const metrics = pipelineData?.metrics || {
    totalLeads: 0, newLeads: 0, activeLeads: 0, wonLeads: 0,
    lostLeads: 0, totalPotentialValue: 0, totalWonValue: 0, conversionRate: '0'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 data-testid="text-page-title" className="text-3xl font-bold text-slate-900 dark:text-white">Lead Pipeline</h1>
            <p className="text-slate-600 dark:text-slate-400">Manage your leads from first contact to job completion</p>
          </div>
          <Dialog open={isAddLeadOpen} onOpenChange={setIsAddLeadOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-lead" className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Lead
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Lead</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="customerName" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Customer Name *</FormLabel>
                        <FormControl>
                          <Input data-testid="input-customer-name" placeholder="John Smith" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="customerPhone" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone *</FormLabel>
                        <FormControl>
                          <Input data-testid="input-customer-phone" placeholder="(555) 123-4567" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="customerEmail" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input data-testid="input-customer-email" placeholder="john@email.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="serviceType" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Service Type *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ''}>
                          <FormControl>
                            <SelectTrigger data-testid="select-service-type">
                              <SelectValue placeholder="Select service" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {SERVICE_TYPES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <div className="col-span-2">
                      <FormField control={form.control} name="propertyAddress" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Property Address *</FormLabel>
                          <FormControl>
                            <Input data-testid="input-property-address" placeholder="123 Main Street" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                    <FormField control={form.control} name="city" render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input data-testid="input-property-city" placeholder="Austin" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <div className="grid grid-cols-2 gap-2">
                      <FormField control={form.control} name="state" render={({ field }) => (
                        <FormItem>
                          <FormLabel>State</FormLabel>
                          <FormControl>
                            <Input data-testid="input-property-state" placeholder="TX" maxLength={2} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="zip" render={({ field }) => (
                        <FormItem>
                          <FormLabel>ZIP</FormLabel>
                          <FormControl>
                            <Input data-testid="input-property-zip" placeholder="78701" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                    <FormField control={form.control} name="source" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Source</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ''}>
                          <FormControl>
                            <SelectTrigger data-testid="select-source">
                              <SelectValue placeholder="How did they find you?" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {LEAD_SOURCES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="estimatedAmount" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estimated Amount</FormLabel>
                        <FormControl>
                          <Input data-testid="input-estimated-amount" placeholder="5000" type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="priority" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Priority</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || 'medium'}>
                          <FormControl>
                            <SelectTrigger data-testid="select-priority">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {PRIORITIES.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <div className="col-span-2">
                      <FormField control={form.control} name="description" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea data-testid="input-description" placeholder="Job details..." rows={3} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsAddLeadOpen(false)} data-testid="button-cancel-add">
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createLeadMutation.isPending} data-testid="button-save-lead">
                      {createLeadMutation.isPending ? 'Creating...' : 'Create Lead'}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-white dark:bg-slate-800 border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Pipeline Value</p>
                  <p data-testid="text-pipeline-value" className="text-2xl font-bold text-slate-900 dark:text-white">
                    {formatCurrency(metrics.totalPotentialValue)}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white dark:bg-slate-800 border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Active Leads</p>
                  <p data-testid="text-active-leads" className="text-2xl font-bold text-slate-900 dark:text-white">
                    {metrics.activeLeads}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white dark:bg-slate-800 border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Won Value</p>
                  <p data-testid="text-won-value" className="text-2xl font-bold text-emerald-600">
                    {formatCurrency(metrics.totalWonValue)}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white dark:bg-slate-800 border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Conversion Rate</p>
                  <p data-testid="text-conversion-rate" className="text-2xl font-bold text-slate-900 dark:text-white">
                    {metrics.conversionRate}%
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <Target className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              data-testid="input-search-leads"
              className="pl-10"
              placeholder="Search leads by name, email, phone..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={serviceFilter} onValueChange={setServiceFilter}>
            <SelectTrigger data-testid="select-filter-service" className="w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="All Services" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Services</SelectItem>
              {SERVICE_TYPES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-max">
            {stages.map((stage) => (
              <div
                key={stage.id}
                data-testid={`dropzone-stage-${stage.id}`}
                className="w-80 flex-shrink-0"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, stage.id)}
              >
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
                  <div className="p-3 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg" style={{ backgroundColor: stage.color + '20' }}>
                          <span style={{ color: stage.color }}>{getStageIcon(stage.id)}</span>
                        </div>
                        <span className="font-medium text-slate-900 dark:text-white">{stage.label}</span>
                      </div>
                      <Badge data-testid={`badge-count-${stage.id}`} variant="secondary" className="bg-slate-100 dark:bg-slate-700">
                        {pipeline[stage.id]?.length || 0}
                      </Badge>
                    </div>
                  </div>
                  <ScrollArea className="h-[calc(100vh-400px)] min-h-[400px]">
                    <div className="p-2 space-y-2">
                      {(pipeline[stage.id] || [])
                        .filter(lead => {
                          if (!searchQuery) return true;
                          const q = searchQuery.toLowerCase();
                          return (
                            lead.customerName?.toLowerCase().includes(q) ||
                            lead.customerEmail?.toLowerCase().includes(q) ||
                            lead.customerPhone?.includes(q)
                          );
                        })
                        .map((lead) => (
                          <motion.div
                            key={lead.id}
                            layout
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            draggable
                            data-testid={`draggable-lead-${lead.id}`}
                            onDragStart={(e) => handleDragStart(e as unknown as React.DragEvent, lead.id)}
                            className="cursor-grab active:cursor-grabbing"
                          >
                            <Card
                              data-testid={`card-lead-${lead.id}`}
                              className="bg-white dark:bg-slate-750 border border-slate-200 dark:border-slate-600 hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
                              onClick={() => setSelectedLead(lead)}
                            >
                              <CardContent className="p-3 space-y-2">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <p data-testid={`text-customer-name-${lead.id}`} className="font-medium text-slate-900 dark:text-white truncate max-w-[180px]">
                                      {lead.customerName}
                                    </p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{lead.serviceType}</p>
                                  </div>
                                  {getPriorityBadge(lead.priority)}
                                </div>
                                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                  <MapPin className="h-3 w-3" />
                                  <span className="truncate">{lead.city}, {lead.state}</span>
                                </div>
                                {lead.estimatedAmount && (
                                  <div className="flex items-center justify-between">
                                    <span data-testid={`text-amount-${lead.id}`} className="text-sm font-semibold text-green-600">
                                      {formatCurrency(lead.estimatedAmount)}
                                    </span>
                                    <span className="text-xs text-slate-400">
                                      {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : ''}
                                    </span>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          </motion.div>
                        ))}
                      {(pipeline[stage.id]?.length || 0) === 0 && (
                        <div className="text-center py-8 text-slate-400 dark:text-slate-500">
                          <p className="text-sm">No leads in this stage</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Dialog open={!!selectedLead} onOpenChange={(open) => !open && setSelectedLead(null)}>
        <DialogContent className="max-w-lg">
          {selectedLead && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  <span data-testid="text-detail-customer-name">{selectedLead.customerName}</span>
                </DialogTitle>
              </DialogHeader>
              <div className="mt-4 space-y-6 max-h-[70vh] overflow-y-auto">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge data-testid="badge-detail-stage" variant="secondary" className="text-sm">
                      {stages.find(s => s.id === selectedLead.stage)?.label}
                    </Badge>
                    {getPriorityBadge(selectedLead.priority)}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-500">Service</p>
                      <p data-testid="text-detail-service" className="font-medium">{selectedLead.serviceType}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Estimated Value</p>
                      <p data-testid="text-detail-value" className="font-medium text-green-600">{formatCurrency(selectedLead.estimatedAmount || 0)}</p>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <h4 className="font-medium text-slate-900 dark:text-white">Contact Info</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-slate-400" />
                        <a href={`tel:${selectedLead.customerPhone}`} data-testid="link-phone" className="text-blue-600 hover:underline">
                          {selectedLead.customerPhone}
                        </a>
                      </div>
                      {selectedLead.customerEmail && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-slate-400" />
                          <a href={`mailto:${selectedLead.customerEmail}`} data-testid="link-email" className="text-blue-600 hover:underline">
                            {selectedLead.customerEmail}
                          </a>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-slate-400" />
                        <span data-testid="text-detail-address">{selectedLead.propertyAddress}, {selectedLead.city}, {selectedLead.state} {selectedLead.zip}</span>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <h4 className="font-medium text-slate-900 dark:text-white">Quick Actions</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" size="sm" className="w-full" data-testid="button-action-call">
                        <Phone className="h-4 w-4 mr-2" />
                        Call
                      </Button>
                      <Button variant="outline" size="sm" className="w-full" data-testid="button-action-text">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Text
                      </Button>
                      <Button variant="outline" size="sm" className="w-full" data-testid="button-action-email">
                        <Mail className="h-4 w-4 mr-2" />
                        Email
                      </Button>
                      <Button variant="outline" size="sm" className="w-full" data-testid="button-action-quote">
                        <FileText className="h-4 w-4 mr-2" />
                        Quote
                      </Button>
                    </div>
                  </div>

                  {selectedLead.description && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        <h4 className="font-medium text-slate-900 dark:text-white">Description</h4>
                        <p data-testid="text-detail-description" className="text-sm text-slate-600 dark:text-slate-400">{selectedLead.description}</p>
                      </div>
                    </>
                  )}

                  <Separator />

                  <div className="space-y-3">
                    <h4 className="font-medium text-slate-900 dark:text-white">Move to Stage</h4>
                    <div className="flex flex-wrap gap-2">
                      {stages.filter(s => s.id !== selectedLead.stage && s.id !== 'lost').map(stage => (
                        <Button
                          key={stage.id}
                          data-testid={`button-move-to-${stage.id}`}
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            updateStageMutation.mutate({ leadId: selectedLead.id, stage: stage.id });
                            setSelectedLead(null);
                          }}
                          style={{ borderColor: stage.color, color: stage.color }}
                        >
                          {stage.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {selectedLead.stage !== 'lost' && selectedLead.stage !== 'job_completed' && (
                    <Button
                      variant="destructive"
                      className="w-full"
                      data-testid="button-mark-lost"
                      onClick={() => {
                        updateStageMutation.mutate({ leadId: selectedLead.id, stage: 'lost' });
                        setSelectedLead(null);
                      }}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Mark as Lost
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
