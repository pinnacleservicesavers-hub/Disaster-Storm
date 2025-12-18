import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import {
  Users, DollarSign, TrendingUp, Target, Phone, Mail, MapPin, 
  Calendar, Clock, Plus, Search, Filter, MessageSquare, FileText, 
  XCircle, CheckCircle, ArrowRight, RefreshCw, User, History, 
  StickyNote, Send, Trash2, Edit, PhoneCall
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import type { WorkhubLead, WorkhubCommunicationLog, WorkhubLeadNote, WorkhubLeadStageHistory, WorkhubLeadQuote } from '@shared/schema';
import { insertWorkhubLeadSchema } from '@shared/schema';

interface LeadDetail extends WorkhubLead {
  communications: WorkhubCommunicationLog[];
  notes: WorkhubLeadNote[];
  stageHistory: WorkhubLeadStageHistory[];
  quotes: WorkhubLeadQuote[];
}

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
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [newNote, setNewNote] = useState('');
  const [commType, setCommType] = useState<'call' | 'text' | 'email'>('call');
  const [commNotes, setCommNotes] = useState('');

  const { data: leadDetail, isLoading: isLoadingDetail } = useQuery<LeadDetail>({
    queryKey: ['/api/workhub/leads', selectedLeadId],
    enabled: !!selectedLeadId
  });

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
      queryClient.invalidateQueries({ queryKey: ['/api/workhub/leads', selectedLeadId] });
      toast({ title: 'Stage updated', description: 'Lead moved to new stage.' });
    }
  });

  const addNoteMutation = useMutation({
    mutationFn: async ({ leadId, content }: { leadId: string; content: string }) => {
      return apiRequest(`/api/workhub/leads/${leadId}/notes`, {
        method: 'POST',
        body: JSON.stringify({ content, createdBy: 'user' }),
        headers: { 'Content-Type': 'application/json' }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/workhub/leads', selectedLeadId] });
      setNewNote('');
      toast({ title: 'Note added', description: 'Note has been saved.' });
    }
  });

  const deleteNoteMutation = useMutation({
    mutationFn: async ({ leadId, noteId }: { leadId: string; noteId: string }) => {
      return apiRequest(`/api/workhub/leads/${leadId}/notes/${noteId}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/workhub/leads', selectedLeadId] });
      toast({ title: 'Note deleted', description: 'Note has been removed.' });
    }
  });

  const addCommunicationMutation = useMutation({
    mutationFn: async ({ leadId, type, notes, outcome }: { leadId: string; type: string; notes: string; outcome?: string }) => {
      return apiRequest(`/api/workhub/leads/${leadId}/communications`, {
        method: 'POST',
        body: JSON.stringify({ 
          type, 
          notes,
          outcome: outcome || 'completed',
          direction: 'outbound',
          contactedAt: new Date().toISOString()
        }),
        headers: { 'Content-Type': 'application/json' }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/workhub/leads', selectedLeadId] });
      setCommNotes('');
      toast({ title: 'Communication logged', description: 'Activity has been recorded.' });
    }
  });

  const formatDate = (date: Date | string | null) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const getCommIcon = (type: string) => {
    switch (type) {
      case 'call': return <PhoneCall className="h-4 w-4" />;
      case 'text': return <MessageSquare className="h-4 w-4" />;
      case 'email': return <Mail className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

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
                              onClick={() => setSelectedLeadId(lead.id)}
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

      <Dialog open={!!selectedLeadId} onOpenChange={(open) => { if (!open) { setSelectedLeadId(null); setActiveTab('overview'); } }}>
        <DialogContent className="max-w-2xl max-h-[85vh]">
          {isLoadingDetail ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
              <span className="ml-2 text-slate-600">Loading lead details...</span>
            </div>
          ) : leadDetail ? (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  <span data-testid="text-detail-customer-name">{leadDetail.customerName}</span>
                </DialogTitle>
              </DialogHeader>

              <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
                  <TabsTrigger value="activity" data-testid="tab-activity">Activity</TabsTrigger>
                  <TabsTrigger value="notes" data-testid="tab-notes">Notes ({leadDetail.notes?.length || 0})</TabsTrigger>
                  <TabsTrigger value="communicate" data-testid="tab-communicate">Communicate</TabsTrigger>
                </TabsList>

                <ScrollArea className="h-[55vh] mt-4">
                  <TabsContent value="overview" className="space-y-4 mt-0">
                    <div className="flex items-center justify-between">
                      <Badge data-testid="badge-detail-stage" variant="secondary" className="text-sm">
                        {stages.find(s => s.id === leadDetail.stage)?.label}
                      </Badge>
                      {getPriorityBadge(leadDetail.priority)}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-slate-500">Service</p>
                        <p data-testid="text-detail-service" className="font-medium">{leadDetail.serviceType}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Estimated Value</p>
                        <p data-testid="text-detail-value" className="font-medium text-green-600">{formatCurrency(leadDetail.estimatedAmount || 0)}</p>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <h4 className="font-medium text-slate-900 dark:text-white">Contact Info</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-slate-400" />
                          <a href={`tel:${leadDetail.customerPhone}`} data-testid="link-phone" className="text-blue-600 hover:underline">
                            {leadDetail.customerPhone}
                          </a>
                        </div>
                        {leadDetail.customerEmail && (
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-slate-400" />
                            <a href={`mailto:${leadDetail.customerEmail}`} data-testid="link-email" className="text-blue-600 hover:underline">
                              {leadDetail.customerEmail}
                            </a>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-slate-400" />
                          <span data-testid="text-detail-address">{leadDetail.propertyAddress}, {leadDetail.city}, {leadDetail.state} {leadDetail.zip}</span>
                        </div>
                      </div>
                    </div>

                    {leadDetail.description && (
                      <>
                        <Separator />
                        <div className="space-y-2">
                          <h4 className="font-medium text-slate-900 dark:text-white">Description</h4>
                          <p data-testid="text-detail-description" className="text-sm text-slate-600 dark:text-slate-400">{leadDetail.description}</p>
                        </div>
                      </>
                    )}

                    <Separator />

                    <div className="space-y-3">
                      <h4 className="font-medium text-slate-900 dark:text-white">Move to Stage</h4>
                      <div className="flex flex-wrap gap-2">
                        {stages.filter(s => s.id !== leadDetail.stage && s.id !== 'lost').map(stage => (
                          <Button
                            key={stage.id}
                            data-testid={`button-move-to-${stage.id}`}
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              updateStageMutation.mutate({ leadId: leadDetail.id, stage: stage.id });
                            }}
                            style={{ borderColor: stage.color, color: stage.color }}
                          >
                            {stage.label}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {leadDetail.stage !== 'lost' && leadDetail.stage !== 'job_completed' && (
                      <Button
                        variant="destructive"
                        className="w-full"
                        data-testid="button-mark-lost"
                        onClick={() => {
                          updateStageMutation.mutate({ leadId: leadDetail.id, stage: 'lost' });
                          setSelectedLeadId(null);
                        }}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Mark as Lost
                      </Button>
                    )}
                  </TabsContent>

                  <TabsContent value="activity" className="space-y-4 mt-0">
                    <h4 className="font-medium text-slate-900 dark:text-white flex items-center gap-2">
                      <History className="h-4 w-4" />
                      Stage History & Activity Timeline
                    </h4>
                    
                    {(leadDetail.stageHistory?.length || 0) === 0 && (leadDetail.communications?.length || 0) === 0 ? (
                      <p className="text-sm text-slate-500 text-center py-8">No activity recorded yet</p>
                    ) : (
                      <div className="relative border-l-2 border-slate-200 dark:border-slate-700 ml-2 space-y-4">
                        {[...(leadDetail.stageHistory || []).map(h => ({ ...h, activityType: 'stage' as const })),
                          ...(leadDetail.communications || []).map(c => ({ ...c, activityType: 'comm' as const }))]
                          .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
                          .map((item, idx) => (
                            <div key={`${item.activityType}-${item.id}`} className="relative pl-6" data-testid={`activity-item-${idx}`}>
                              <div className="absolute -left-2 top-1 w-4 h-4 rounded-full bg-white dark:bg-slate-800 border-2 border-blue-500 flex items-center justify-center">
                                {item.activityType === 'stage' ? (
                                  <ArrowRight className="h-2 w-2 text-blue-500" />
                                ) : (
                                  <div className="text-blue-500 scale-50">{getCommIcon((item as any).type || 'call')}</div>
                                )}
                              </div>
                              <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
                                <div className="flex items-center justify-between">
                                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                                    {item.activityType === 'stage' 
                                      ? `Stage changed: ${(item as any).fromStage || 'New'} → ${(item as any).toStage}`
                                      : `${(item as any).type?.charAt(0).toUpperCase() + (item as any).type?.slice(1)} - ${(item as any).outcome || 'completed'}`
                                    }
                                  </p>
                                  <span className="text-xs text-slate-400">{formatDate(item.createdAt)}</span>
                                </div>
                                {((item as any).notes) && (
                                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{(item as any).notes}</p>
                                )}
                              </div>
                            </div>
                          ))
                        }
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="notes" className="space-y-4 mt-0">
                    <div className="space-y-3">
                      <h4 className="font-medium text-slate-900 dark:text-white flex items-center gap-2">
                        <StickyNote className="h-4 w-4" />
                        Notes
                      </h4>
                      
                      <div className="flex gap-2">
                        <Textarea
                          data-testid="input-new-note"
                          placeholder="Add a note..."
                          value={newNote}
                          onChange={(e) => setNewNote(e.target.value)}
                          className="min-h-[80px]"
                        />
                      </div>
                      <Button
                        data-testid="button-add-note"
                        size="sm"
                        onClick={() => {
                          if (newNote.trim() && selectedLeadId) {
                            addNoteMutation.mutate({ leadId: selectedLeadId, content: newNote });
                          }
                        }}
                        disabled={!newNote.trim() || addNoteMutation.isPending}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        {addNoteMutation.isPending ? 'Adding...' : 'Add Note'}
                      </Button>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      {(leadDetail.notes?.length || 0) === 0 ? (
                        <p className="text-sm text-slate-500 text-center py-4">No notes yet</p>
                      ) : (
                        leadDetail.notes?.map((note) => (
                          <div key={note.id} data-testid={`note-item-${note.id}`} className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                            <div className="flex items-start justify-between">
                              <p className="text-sm text-slate-700 dark:text-slate-300 flex-1">{note.content}</p>
                              <Button
                                variant="ghost"
                                size="sm"
                                data-testid={`button-delete-note-${note.id}`}
                                onClick={() => {
                                  if (selectedLeadId) {
                                    deleteNoteMutation.mutate({ leadId: selectedLeadId, noteId: note.id });
                                  }
                                }}
                                className="text-slate-400 hover:text-red-500 -mr-2 -mt-1"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                            <p className="text-xs text-slate-400 mt-2">{formatDate(note.createdAt)}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="communicate" className="space-y-4 mt-0">
                    <div className="space-y-3">
                      <h4 className="font-medium text-slate-900 dark:text-white">Log Communication</h4>
                      
                      <div className="grid grid-cols-3 gap-2">
                        <Button
                          variant={commType === 'call' ? 'default' : 'outline'}
                          data-testid="button-comm-type-call"
                          onClick={() => setCommType('call')}
                        >
                          <PhoneCall className="h-4 w-4 mr-2" />
                          Call
                        </Button>
                        <Button
                          variant={commType === 'text' ? 'default' : 'outline'}
                          data-testid="button-comm-type-text"
                          onClick={() => setCommType('text')}
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Text
                        </Button>
                        <Button
                          variant={commType === 'email' ? 'default' : 'outline'}
                          data-testid="button-comm-type-email"
                          onClick={() => setCommType('email')}
                        >
                          <Mail className="h-4 w-4 mr-2" />
                          Email
                        </Button>
                      </div>

                      <Textarea
                        data-testid="input-comm-notes"
                        placeholder={`Notes about this ${commType}...`}
                        value={commNotes}
                        onChange={(e) => setCommNotes(e.target.value)}
                        className="min-h-[100px]"
                      />

                      <Button
                        data-testid="button-log-communication"
                        className="w-full"
                        onClick={() => {
                          if (selectedLeadId && commNotes.trim()) {
                            addCommunicationMutation.mutate({ 
                              leadId: selectedLeadId, 
                              type: commType, 
                              notes: commNotes.trim()
                            });
                          }
                        }}
                        disabled={!commNotes.trim() || addCommunicationMutation.isPending}
                      >
                        <Send className="h-4 w-4 mr-2" />
                        {addCommunicationMutation.isPending ? 'Logging...' : `Log ${commType.charAt(0).toUpperCase() + commType.slice(1)}`}
                      </Button>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <h4 className="font-medium text-slate-900 dark:text-white">Quick Actions</h4>
                      <div className="grid grid-cols-2 gap-2">
                        <Button variant="outline" size="sm" className="w-full" data-testid="button-quick-call" asChild>
                          <a href={`tel:${leadDetail.customerPhone}`}>
                            <Phone className="h-4 w-4 mr-2" />
                            Call Now
                          </a>
                        </Button>
                        <Button variant="outline" size="sm" className="w-full" data-testid="button-quick-text" asChild>
                          <a href={`sms:${leadDetail.customerPhone}`}>
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Send Text
                          </a>
                        </Button>
                        {leadDetail.customerEmail && (
                          <Button variant="outline" size="sm" className="w-full col-span-2" data-testid="button-quick-email" asChild>
                            <a href={`mailto:${leadDetail.customerEmail}`}>
                              <Mail className="h-4 w-4 mr-2" />
                              Send Email
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <h4 className="font-medium text-slate-900 dark:text-white">Communication History</h4>
                      {(leadDetail.communications?.length || 0) === 0 ? (
                        <p className="text-sm text-slate-500 text-center py-4">No communications logged yet</p>
                      ) : (
                        <div className="space-y-2">
                          {leadDetail.communications?.slice(0, 5).map((comm) => (
                            <div key={comm.id} data-testid={`comm-item-${comm.id}`} className="flex items-start gap-3 p-2 bg-slate-50 dark:bg-slate-800 rounded">
                              <div className="p-1.5 rounded bg-blue-100 dark:bg-blue-900 text-blue-600">
                                {getCommIcon(comm.type || '')}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium">{comm.type?.charAt(0).toUpperCase()}{comm.type?.slice(1)} - {comm.outcome}</p>
                                {comm.notes && <p className="text-xs text-slate-500 truncate">{comm.notes}</p>}
                                <p className="text-xs text-slate-400">{formatDate(comm.createdAt)}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </ScrollArea>
              </Tabs>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
