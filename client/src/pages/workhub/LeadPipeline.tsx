import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { 
  Phone, Mail, MapPin, Calendar, TrendingUp, Users, CheckCircle2, 
  Clock, AlertTriangle, Building2, Wrench, Home, Trees, Paintbrush,
  Droplet, Square, Hammer, Wind, Zap, Plus, Eye, Filter, Volume2,
  VolumeX, ArrowLeft, DollarSign, Star, Truck
} from 'lucide-react';
import TopNav from '@/components/TopNav';
import ModuleAIAssistant from '@/components/ModuleAIAssistant';
import { AutonomousAgentBadge } from '@/components/AutonomousAgentBadge';
import ModuleVoiceGuide from '@/components/ModuleVoiceGuide';

const SERVICE_CATEGORIES = [
  { id: 'tree', label: 'Tree Service', icon: Trees, color: 'bg-emerald-600' },
  { id: 'roofing', label: 'Roofing', icon: Home, color: 'bg-orange-600' },
  { id: 'painting', label: 'Painting', icon: Paintbrush, color: 'bg-purple-600' },
  { id: 'plumbing', label: 'Plumbing', icon: Droplet, color: 'bg-cyan-600' },
  { id: 'flooring', label: 'Flooring', icon: Square, color: 'bg-amber-600' },
  { id: 'remodeling', label: 'Remodeling', icon: Building2, color: 'bg-slate-600' },
  { id: 'hvac', label: 'HVAC', icon: Wind, color: 'bg-blue-600' },
  { id: 'electrical', label: 'Electrical', icon: Zap, color: 'bg-yellow-600' },
  { id: 'handyman', label: 'Handyman', icon: Hammer, color: 'bg-red-600' },
  { id: 'landscaping', label: 'Landscaping', icon: Trees, color: 'bg-green-600' },
];

const STATUS_CONFIG = {
  new: { label: 'New', color: 'bg-blue-500' },
  contacted: { label: 'Contacted', color: 'bg-purple-500' },
  quoted: { label: 'Quoted', color: 'bg-amber-500' },
  scheduled: { label: 'Scheduled', color: 'bg-cyan-500' },
  in_progress: { label: 'In Progress', color: 'bg-orange-500' },
  completed: { label: 'Completed', color: 'bg-emerald-500' },
  closed: { label: 'Closed', color: 'bg-slate-500' },
};

const PRIORITY_CONFIG = {
  urgent: { label: 'Urgent', color: 'bg-red-500' },
  high: { label: 'High', color: 'bg-orange-500' },
  medium: { label: 'Medium', color: 'bg-yellow-500' },
  low: { label: 'Low', color: 'bg-green-500' },
};

interface WorkHubLead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address: string;
  serviceType: string;
  projectDescription: string;
  status: string;
  priority: string;
  estimatedValue?: number;
  createdAt: string;
  lastContactedAt?: string;
  contactAttempts: number;
  notes?: string;
  source: string;
}

export default function LeadPipeline() {
  const { toast } = useToast();
  const [selectedLead, setSelectedLead] = useState<WorkHubLead | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    serviceType: '',
  });

  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const hasPlayedWelcome = useRef(false);
  const voiceEnabledRef = useRef(true);

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
  };

  const voiceMutation = useMutation({
    mutationFn: async (message: string) => {
      const res = await apiRequest("/api/closebot/chat", "POST", {
        message,
        history: [],
        context: { leadName: "contractor", companyName: "your company", trade: "lead management" },
        enableVoice: true,
      });
      return res;
    },
    onSuccess: (data) => {
      if (!voiceEnabledRef.current) return;
      if (data.audioUrl && audioRef.current) {
        setIsPlaying(true);
        audioRef.current.src = data.audioUrl;
        audioRef.current.onended = () => setIsPlaying(false);
        audioRef.current.play().catch(() => setIsPlaying(false));
      }
    },
  });

  useEffect(() => {
    if (!hasPlayedWelcome.current) {
      hasPlayedWelcome.current = true;
      voiceMutation.mutate("Give a brief, warm 1-sentence welcome to the Lead Pipeline. You're Rachel, helping them manage customer leads from first contact to job completion. Keep it super short and natural.");
    }
  }, []);

  const speakGuidance = (text: string) => {
    if (!voiceEnabledRef.current) return;
    stopAudio();
    voiceMutation.mutate(text);
  };

  const toggleVoice = () => {
    const newEnabled = !isVoiceEnabled;
    setIsVoiceEnabled(newEnabled);
    voiceEnabledRef.current = newEnabled;
    if (!newEnabled) {
      stopAudio();
    } else {
      voiceMutation.mutate("Say a quick, natural 1-sentence overview of what Lead Pipeline does — tracking leads, scheduling follow-ups, and converting them into paying jobs. Keep it warm and conversational.");
    }
  };

  const sampleLeads: WorkHubLead[] = [
    {
      id: 'lead-001',
      name: 'Sarah Johnson',
      phone: '(555) 123-4567',
      email: 'sarah.j@email.com',
      address: '123 Oak Street, Atlanta, GA 30301',
      serviceType: 'tree',
      projectDescription: 'Large oak tree needs trimming. Branches hanging over the house and driveway.',
      status: 'new',
      priority: 'high',
      estimatedValue: 1200,
      createdAt: new Date().toISOString(),
      contactAttempts: 0,
      source: 'website',
    },
    {
      id: 'lead-002',
      name: 'Mike Thompson',
      phone: '(555) 234-5678',
      email: 'mike.t@email.com',
      address: '456 Maple Ave, Atlanta, GA 30302',
      serviceType: 'painting',
      projectDescription: 'Interior painting for 3 bedrooms and living room. Looking for neutral colors.',
      status: 'contacted',
      priority: 'medium',
      estimatedValue: 2500,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      lastContactedAt: new Date().toISOString(),
      contactAttempts: 2,
      source: 'referral',
    },
    {
      id: 'lead-003',
      name: 'Lisa Chen',
      phone: '(555) 345-6789',
      address: '789 Pine Road, Atlanta, GA 30303',
      serviceType: 'plumbing',
      projectDescription: 'Bathroom remodel - need new fixtures and shower installation.',
      status: 'quoted',
      priority: 'medium',
      estimatedValue: 4800,
      createdAt: new Date(Date.now() - 172800000).toISOString(),
      lastContactedAt: new Date(Date.now() - 86400000).toISOString(),
      contactAttempts: 3,
      source: 'workhub',
    },
    {
      id: 'lead-004',
      name: 'David Brown',
      phone: '(555) 456-7890',
      email: 'david.b@email.com',
      address: '321 Cedar Lane, Atlanta, GA 30304',
      serviceType: 'roofing',
      projectDescription: 'Roof inspection and possible repairs. Some shingles missing after recent wind.',
      status: 'scheduled',
      priority: 'urgent',
      estimatedValue: 3500,
      createdAt: new Date(Date.now() - 259200000).toISOString(),
      lastContactedAt: new Date().toISOString(),
      contactAttempts: 4,
      source: 'google',
    },
  ];

  const stats = {
    totalLeads: sampleLeads.length,
    newLeads: sampleLeads.filter(l => l.status === 'new').length,
    quotedLeads: sampleLeads.filter(l => l.status === 'quoted').length,
    totalValue: sampleLeads.reduce((sum, l) => sum + (l.estimatedValue || 0), 0),
  };

  const filteredLeads = sampleLeads.filter(lead => {
    if (filters.status && lead.status !== filters.status) return false;
    if (filters.priority && lead.priority !== filters.priority) return false;
    if (filters.serviceType && lead.serviceType !== filters.serviceType) return false;
    return true;
  });

  const handleViewDetails = (lead: WorkHubLead) => {
    setSelectedLead(lead);
    setIsDetailOpen(true);
    const serviceName = SERVICE_CATEGORIES.find(s => s.id === lead.serviceType)?.label || lead.serviceType;
    speakGuidance(`Give a brief, natural 1-sentence comment about viewing ${lead.name}'s lead. They want ${serviceName}, estimated at $${lead.estimatedValue?.toLocaleString() || 'unknown'}. Sound warm and helpful, like a real person.`);
  };

  const getServiceIcon = (serviceType: string) => {
    const service = SERVICE_CATEGORIES.find(s => s.id === serviceType);
    return service ? service.icon : Wrench;
  };

  const getServiceColor = (serviceType: string) => {
    const service = SERVICE_CATEGORIES.find(s => s.id === serviceType);
    return service ? service.color : 'bg-gray-500';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900">
      <TopNav />
      <audio ref={audioRef} className="hidden" />
      
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <Link 
              to="/workhub" 
              className="inline-flex items-center text-emerald-300 hover:text-emerald-200 mb-4 transition-colors"
              data-testid="link-back-workhub"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to WorkHub
            </Link>
            <h1 className="text-4xl font-bold text-white mb-2">Lead Pipeline</h1>
            <p className="text-emerald-200">Manage your customer leads from first contact to job completion</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={toggleVoice}
              className={`${isVoiceEnabled ? 'bg-emerald-500 text-white' : 'border-emerald-500 text-emerald-400'} hover:bg-emerald-600`}
              data-testid="button-toggle-voice"
            >
              {isVoiceEnabled ? <Volume2 className={`h-5 w-5 ${isPlaying ? 'animate-pulse' : ''}`} /> : <VolumeX className="h-5 w-5" />}
            </Button>
            <Button 
              onClick={() => setIsCreateOpen(true)}
              className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold shadow-lg"
              data-testid="button-create-lead"
            >
              <Plus className="mr-2 h-4 w-4" />
              New Lead
            </Button>
          </div>
        </div>

        <AutonomousAgentBadge moduleName="LeadPipeline" />

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-white/10 backdrop-blur border-emerald-500/30">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-emerald-200">Total Leads</p>
                  <p className="text-3xl font-bold text-white" data-testid="text-total-leads">{stats.totalLeads}</p>
                </div>
                <Users className="h-8 w-8 text-emerald-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur border-emerald-500/30">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-emerald-200">New Leads</p>
                  <p className="text-3xl font-bold text-white" data-testid="text-new-leads">{stats.newLeads}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-orange-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur border-emerald-500/30">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-emerald-200">Quoted</p>
                  <p className="text-3xl font-bold text-white" data-testid="text-quoted-leads">{stats.quotedLeads}</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur border-emerald-500/30">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-emerald-200">Pipeline Value</p>
                  <p className="text-3xl font-bold text-white" data-testid="text-pipeline-value">
                    ${stats.totalValue.toLocaleString()}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-emerald-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-white/10 backdrop-blur border-emerald-500/30">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-emerald-400" />
              <CardTitle className="text-white">Filters</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-emerald-200">Status</Label>
                <Select value={filters.status} onValueChange={(v) => setFilters({ ...filters, status: v === 'all' ? '' : v })}>
                  <SelectTrigger className="bg-white/10 border-emerald-500/30 text-white" data-testid="select-status-filter">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-emerald-500/30">
                    <SelectItem value="all">All statuses</SelectItem>
                    {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                      <SelectItem key={key} value={key}>{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-emerald-200">Priority</Label>
                <Select value={filters.priority} onValueChange={(v) => setFilters({ ...filters, priority: v === 'all' ? '' : v })}>
                  <SelectTrigger className="bg-white/10 border-emerald-500/30 text-white" data-testid="select-priority-filter">
                    <SelectValue placeholder="All priorities" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-emerald-500/30">
                    <SelectItem value="all">All priorities</SelectItem>
                    {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
                      <SelectItem key={key} value={key}>{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-emerald-200">Service Type</Label>
                <Select value={filters.serviceType} onValueChange={(v) => setFilters({ ...filters, serviceType: v === 'all' ? '' : v })}>
                  <SelectTrigger className="bg-white/10 border-emerald-500/30 text-white" data-testid="select-service-filter">
                    <SelectValue placeholder="All services" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-emerald-500/30">
                    <SelectItem value="all">All services</SelectItem>
                    {SERVICE_CATEGORIES.map((service) => (
                      <SelectItem key={service.id} value={service.id}>{service.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur border-emerald-500/30">
          <CardHeader>
            <CardTitle className="text-white">Lead Pipeline</CardTitle>
            <CardDescription className="text-emerald-200">
              {filteredLeads.length} leads found
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredLeads.map((lead) => {
                const ServiceIcon = getServiceIcon(lead.serviceType);
                const statusConfig = STATUS_CONFIG[lead.status as keyof typeof STATUS_CONFIG];
                const priorityConfig = PRIORITY_CONFIG[lead.priority as keyof typeof PRIORITY_CONFIG];
                
                return (
                  <Card 
                    key={lead.id} 
                    className="bg-white/5 border-emerald-500/20 hover:bg-white/10 hover:border-emerald-400 transition-all cursor-pointer"
                    onClick={() => handleViewDetails(lead)}
                    data-testid={`card-lead-${lead.id}`}
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-3 flex-wrap">
                            <div className={`p-2 rounded-lg ${getServiceColor(lead.serviceType)}`}>
                              <ServiceIcon className="h-4 w-4 text-white" />
                            </div>
                            <h3 className="text-lg font-semibold text-white">{lead.name}</h3>
                            <Badge className={`${statusConfig.color} text-white`}>
                              {statusConfig.label}
                            </Badge>
                            <Badge className={`${priorityConfig.color} text-white`}>
                              {priorityConfig.label}
                            </Badge>
                            {lead.estimatedValue && (
                              <Badge variant="outline" className="text-emerald-400 border-emerald-400">
                                ${lead.estimatedValue.toLocaleString()}
                              </Badge>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-emerald-200">
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

                          <p className="text-sm text-slate-300 line-clamp-2">{lead.projectDescription}</p>

                          <div className="flex items-center gap-4 text-xs text-emerald-300">
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
                            <Badge variant="outline" className="text-xs text-slate-400 border-slate-500">
                              via {lead.source}
                            </Badge>
                          </div>
                        </div>

                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                          data-testid={`button-view-${lead.id}`}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              {filteredLeads.length === 0 && (
                <div className="text-center py-12 text-emerald-300">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No leads found matching your filters</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <DialogContent className="max-w-3xl bg-slate-900 border-emerald-500/30 text-white max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white flex items-center gap-3">
                {selectedLead && (
                  <>
                    <div className={`p-2 rounded-lg ${getServiceColor(selectedLead.serviceType)}`}>
                      {(() => { const Icon = getServiceIcon(selectedLead.serviceType); return <Icon className="h-5 w-5 text-white" />; })()}
                    </div>
                    {selectedLead.name}
                  </>
                )}
              </DialogTitle>
              <DialogDescription className="text-emerald-200">
                Lead Details
              </DialogDescription>
            </DialogHeader>

            {selectedLead && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-emerald-300">Phone</Label>
                    <p className="text-white font-medium">{selectedLead.phone}</p>
                  </div>
                  <div>
                    <Label className="text-emerald-300">Email</Label>
                    <p className="text-white font-medium">{selectedLead.email || 'Not provided'}</p>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-emerald-300">Address</Label>
                    <p className="text-white font-medium">{selectedLead.address}</p>
                  </div>
                </div>

                <div>
                  <Label className="text-emerald-300">Project Description</Label>
                  <p className="text-white mt-1">{selectedLead.projectDescription}</p>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-emerald-300">Service Type</Label>
                    <p className="text-white font-medium">
                      {SERVICE_CATEGORIES.find(s => s.id === selectedLead.serviceType)?.label}
                    </p>
                  </div>
                  <div>
                    <Label className="text-emerald-300">Estimated Value</Label>
                    <p className="text-white font-medium">${selectedLead.estimatedValue?.toLocaleString() || 'TBD'}</p>
                  </div>
                  <div>
                    <Label className="text-emerald-300">Source</Label>
                    <p className="text-white font-medium capitalize">{selectedLead.source}</p>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button className="bg-emerald-500 hover:bg-emerald-600 text-white" data-testid="button-call-lead">
                    <Phone className="h-4 w-4 mr-2" />
                    Call Customer
                  </Button>
                  <Button variant="outline" className="border-emerald-500 text-emerald-400 hover:bg-emerald-500/10" data-testid="button-send-quote">
                    <DollarSign className="h-4 w-4 mr-2" />
                    Send Quote
                  </Button>
                  <Button variant="outline" className="border-emerald-500 text-emerald-400 hover:bg-emerald-500/10" data-testid="button-schedule">
                    <Calendar className="h-4 w-4 mr-2" />
                    Schedule Job
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent className="max-w-2xl bg-slate-900 border-emerald-500/30 text-white">
            <DialogHeader>
              <DialogTitle className="text-white">Create New Lead</DialogTitle>
              <DialogDescription className="text-emerald-200">
                Add a new customer opportunity to your pipeline
              </DialogDescription>
            </DialogHeader>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                toast({
                  title: 'Lead created successfully',
                  description: 'The new lead has been added to your pipeline',
                });
                setIsCreateOpen(false);
              }}
              className="space-y-4"
            >
              <div>
                <Label className="text-emerald-200">Customer Name</Label>
                <Input
                  name="name"
                  required
                  className="bg-white/10 border-emerald-500/30 text-white"
                  placeholder="John Smith"
                  data-testid="input-name"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-emerald-200">Phone</Label>
                  <Input
                    name="phone"
                    type="tel"
                    required
                    className="bg-white/10 border-emerald-500/30 text-white"
                    placeholder="(555) 123-4567"
                    data-testid="input-phone"
                  />
                </div>
                <div>
                  <Label className="text-emerald-200">Email</Label>
                  <Input
                    name="email"
                    type="email"
                    className="bg-white/10 border-emerald-500/30 text-white"
                    placeholder="john@email.com"
                    data-testid="input-email"
                  />
                </div>
              </div>

              <div>
                <Label className="text-emerald-200">Property Address</Label>
                <Input
                  name="address"
                  required
                  className="bg-white/10 border-emerald-500/30 text-white"
                  placeholder="123 Main St, City, State 12345"
                  data-testid="input-address"
                />
              </div>

              <div>
                <Label className="text-emerald-200">Service Type</Label>
                <Select name="serviceType" required>
                  <SelectTrigger className="bg-white/10 border-emerald-500/30 text-white" data-testid="select-service-type">
                    <SelectValue placeholder="Select a service" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-emerald-500/30">
                    {SERVICE_CATEGORIES.map((service) => (
                      <SelectItem key={service.id} value={service.id}>{service.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-emerald-200">Project Description</Label>
                <Textarea
                  name="projectDescription"
                  required
                  rows={4}
                  className="bg-white/10 border-emerald-500/30 text-white"
                  placeholder="Describe the work needed..."
                  data-testid="textarea-description"
                />
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateOpen(false)}
                  className="border-slate-500 text-slate-300"
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold"
                  data-testid="button-submit"
                >
                  Create Lead
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <ModuleAIAssistant 
        moduleName="Lead Pipeline" 
        moduleContext={`WorkHub lead management system for tracking customer opportunities from first contact to job completion.

SALES PSYCHOLOGY FOR LEAD CONVERSION:

**Cialdini's 6 Principles:**
1. RECIPROCITY - Give value first (free tips, advice) before asking for business
2. SOCIAL PROOF - "8 out of 10 homeowners choose this option"
3. SCARCITY - "Only 2 scheduling slots left this week"
4. AUTHORITY - Emphasize certifications, experience, expertise
5. LIKING - Build rapport, use names, find common ground
6. COMMITMENT - Get small yeses: "Quality matters to you, right?"

**Lead Stage Psychology:**
- NEW: Use Reciprocity - offer free value to build goodwill
- CONTACTED: Use Liking - establish rapport and connection
- QUOTED: Use Anchoring - frame price against higher alternatives
- NEGOTIATING: Use Feel-Felt-Found for objections
- WON: Use Commitment - reinforce their good decision
- LOST: Use Reciprocity for re-engagement later

**Quick Closing Tips:**
- Assumptive: "I'll put you down for Tuesday..."
- Choice: "Tuesday or Thursday work better?"
- Summary: Recap all value before the ask
- Loss Aversion: "Every month you wait..."

Help users move leads through the pipeline with proven psychology.`}
      />
      <ModuleVoiceGuide moduleName="lead-pipeline" />
    </div>
  );
}
