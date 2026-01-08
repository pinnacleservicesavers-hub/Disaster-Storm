import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { 
  Search, 
  Flame, 
  Thermometer, 
  Snowflake, 
  Target,
  Phone,
  Mail,
  MessageSquare,
  Save,
  RefreshCw,
  TrendingUp,
  Users,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  Send,
  Sparkles,
  Shield,
  MapPin,
  Building2,
  Zap,
  CalendarDays,
  Play,
  Pause,
  Trash2,
  Plus,
  CloudLightning
} from 'lucide-react';

interface Lead {
  id?: number;
  business_name?: string;
  company_name?: string;
  contact_name?: string;
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  category?: string;
  score?: number;
  score_label?: string;
  signal_tags?: string[];
  competition_level?: string;
  status?: string;
}

interface DashboardStats {
  total_leads: number;
  hot_leads: number;
  warm_leads: number;
  cold_leads: number;
  new_leads: number;
  contacted: number;
  estimates_sent: number;
  won: number;
  lost: number;
}

export default function ContractorLeadVault() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchLocation, setSearchLocation] = useState('');
  const [searchCategory, setSearchCategory] = useState('');
  const [searchTradeType, setSearchTradeType] = useState('tree_service');
  const [searchResults, setSearchResults] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [outreachData, setOutreachData] = useState<any>(null);

  // Fetch dashboard stats
  const { data: dashboard, isLoading: dashboardLoading, refetch: refetchDashboard } = useQuery<{ stats: DashboardStats; recentLeads: Lead[] }>({
    queryKey: ['/api/leadvault/dashboard'],
  });

  // Fetch saved leads
  const { data: savedLeads, isLoading: leadsLoading, refetch: refetchLeads } = useQuery<{ leads: Lead[] }>({
    queryKey: ['/api/leadvault/leads'],
  });

  // Fetch pipeline
  const { data: pipeline, refetch: refetchPipeline } = useQuery<{ pipeline: any[] }>({
    queryKey: ['/api/leadvault/pipeline'],
  });

  // Search mutation
  const searchMutation = useMutation({
    mutationFn: async (params: { location: string; category: string; tradeType: string }) => {
      return apiRequest('/api/leadvault/search', {
        method: 'POST',
        body: JSON.stringify(params),
      });
    },
    onSuccess: (data: any) => {
      setSearchResults(data.leads || []);
      toast({ title: `Found ${data.leads?.length || 0} leads!` });
    },
    onError: (error: Error) => {
      toast({ title: 'Search failed', description: error.message, variant: 'destructive' });
    }
  });

  // Save lead mutation
  const saveLead = useMutation({
    mutationFn: async (lead: Lead) => {
      return apiRequest('/api/leadvault/leads', {
        method: 'POST',
        body: JSON.stringify({
          companyName: lead.business_name || lead.company_name,
          contactName: lead.contact_name,
          phone: lead.phone,
          email: lead.email,
          website: lead.website,
          address: lead.address,
          city: lead.city,
          state: lead.state,
          category: lead.category,
          tradeType: searchTradeType,
          score: lead.score,
          scoreLabel: lead.score_label,
          signalTags: lead.signal_tags,
          competitionLevel: lead.competition_level,
          source: 'leadvault_search'
        }),
      });
    },
    onSuccess: () => {
      toast({ title: 'Lead saved to your vault!' });
      refetchLeads();
      refetchDashboard();
    }
  });

  // Update lead status
  const updateLeadStatus = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      return apiRequest(`/api/leadvault/leads/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
    },
    onSuccess: () => {
      toast({ title: 'Lead updated!' });
      refetchLeads();
      refetchPipeline();
      refetchDashboard();
    }
  });

  // Generate outreach
  const generateOutreach = useMutation({
    mutationFn: async (leadId: number) => {
      return apiRequest(`/api/leadvault/leads/${leadId}/outreach`, {
        method: 'POST',
        body: JSON.stringify({ tradeType: searchTradeType }),
      });
    },
    onSuccess: (data: any) => {
      setOutreachData(data.outreach);
      toast({ title: 'Outreach pack generated!' });
    }
  });

  const handleSearch = () => {
    if (!searchLocation && !searchCategory) {
      toast({ title: 'Enter a location or category to search', variant: 'destructive' });
      return;
    }
    searchMutation.mutate({ 
      location: searchLocation, 
      category: searchCategory,
      tradeType: searchTradeType 
    });
  };

  const getScoreBadge = (label: string) => {
    switch (label) {
      case 'hot':
        return <Badge className="bg-red-500 text-white"><Flame className="h-3 w-3 mr-1" /> Hot</Badge>;
      case 'warm':
        return <Badge className="bg-orange-500 text-white"><Thermometer className="h-3 w-3 mr-1" /> Warm</Badge>;
      default:
        return <Badge className="bg-blue-500 text-white"><Snowflake className="h-3 w-3 mr-1" /> Cold</Badge>;
    }
  };

  const getCompetitionBadge = (level: string) => {
    switch (level) {
      case 'low':
        return <Badge variant="outline" className="border-green-500 text-green-500">Low Competition</Badge>;
      case 'high':
        return <Badge variant="outline" className="border-red-500 text-red-500">High Competition</Badge>;
      default:
        return <Badge variant="outline" className="border-yellow-500 text-yellow-500">Medium Competition</Badge>;
    }
  };

  const stats = dashboard?.stats;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-400 to-orange-300 bg-clip-text text-transparent">
                ContractorLeadVault™
              </h1>
              <p className="text-slate-400">Your exclusive contractor-only lead engine</p>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4">
            <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/50">
              <Zap className="h-3 w-3 mr-1" /> AI-Powered
            </Badge>
            <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
              <Shield className="h-3 w-3 mr-1" /> Contractor Exclusive
            </Badge>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-red-900/50 to-red-950/50 border-red-700/50">
            <CardContent className="p-4 text-center">
              <Flame className="h-6 w-6 text-red-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-red-400">{stats?.hot_leads || 0}</div>
              <div className="text-xs text-slate-400">Hot Leads</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-orange-900/50 to-orange-950/50 border-orange-700/50">
            <CardContent className="p-4 text-center">
              <Thermometer className="h-6 w-6 text-orange-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-orange-400">{stats?.warm_leads || 0}</div>
              <div className="text-xs text-slate-400">Warm Leads</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-900/50 to-green-950/50 border-green-700/50">
            <CardContent className="p-4 text-center">
              <CheckCircle className="h-6 w-6 text-green-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-400">{stats?.won || 0}</div>
              <div className="text-xs text-slate-400">Won</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-blue-900/50 to-blue-950/50 border-blue-700/50">
            <CardContent className="p-4 text-center">
              <Send className="h-6 w-6 text-blue-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-400">{stats?.estimates_sent || 0}</div>
              <div className="text-xs text-slate-400">Estimates Sent</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-900/50 to-purple-950/50 border-purple-700/50">
            <CardContent className="p-4 text-center">
              <Target className="h-6 w-6 text-purple-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-purple-400">{stats?.total_leads || 0}</div>
              <div className="text-xs text-slate-400">Total Leads</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-slate-900 border border-slate-700">
            <TabsTrigger value="dashboard" data-testid="tab-dashboard">Vault Feed</TabsTrigger>
            <TabsTrigger value="search" data-testid="tab-search">Lead Search</TabsTrigger>
            <TabsTrigger value="pipeline" data-testid="tab-pipeline">Pipeline</TabsTrigger>
            <TabsTrigger value="outreach" data-testid="tab-outreach">AI Outreach</TabsTrigger>
            <TabsTrigger value="campaigns" data-testid="tab-campaigns">
              <CalendarDays className="h-4 w-4 mr-1" /> Campaigns
            </TabsTrigger>
          </TabsList>

          {/* Dashboard / Vault Feed */}
          <TabsContent value="dashboard">
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-amber-400" />
                  Today's Money Moves
                </CardTitle>
                <CardDescription>Your recent leads and opportunities</CardDescription>
              </CardHeader>
              <CardContent>
                {dashboardLoading ? (
                  <div className="text-center py-8 text-slate-400">Loading your vault...</div>
                ) : (
                  <div className="space-y-4">
                    {dashboard?.recentLeads?.length === 0 ? (
                      <div className="text-center py-8">
                        <Target className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                        <p className="text-slate-400">No leads yet. Start searching to fill your vault!</p>
                        <Button 
                          className="mt-4 bg-amber-500 hover:bg-amber-600"
                          onClick={() => setActiveTab('search')}
                          data-testid="button-start-searching"
                        >
                          Start Searching
                        </Button>
                      </div>
                    ) : (
                      dashboard?.recentLeads?.map((lead, i) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                          <div className="flex items-center gap-4">
                            <div className="p-2 rounded-lg bg-amber-500/20">
                              <Building2 className="h-5 w-5 text-amber-400" />
                            </div>
                            <div>
                              <h4 className="font-medium text-white">{lead.company_name}</h4>
                              <p className="text-sm text-slate-400">{lead.city}, {lead.state}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {getScoreBadge(lead.score_label || 'cold')}
                            <Badge variant="outline">{lead.status}</Badge>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Lead Search */}
          <TabsContent value="search">
            <Card className="bg-slate-900 border-slate-800 mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5 text-amber-400" />
                  Lead Discovery
                </CardTitle>
                <CardDescription>Find new leads in your target markets</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="text-sm text-slate-400 mb-1 block">Location</label>
                    <Input
                      placeholder="City, State (e.g., Columbus, GA)"
                      value={searchLocation}
                      onChange={(e) => setSearchLocation(e.target.value)}
                      className="bg-slate-800 border-slate-700"
                      data-testid="input-search-location"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-slate-400 mb-1 block">Category</label>
                    <Input
                      placeholder="e.g., tree_service, roofing"
                      value={searchCategory}
                      onChange={(e) => setSearchCategory(e.target.value)}
                      className="bg-slate-800 border-slate-700"
                      data-testid="input-search-category"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-slate-400 mb-1 block">Your Trade</label>
                    <Select value={searchTradeType} onValueChange={setSearchTradeType}>
                      <SelectTrigger className="bg-slate-800 border-slate-700" data-testid="select-trade-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tree_service">Tree Service</SelectItem>
                        <SelectItem value="roofing">Roofing</SelectItem>
                        <SelectItem value="pressure_washing">Pressure Washing</SelectItem>
                        <SelectItem value="flooring">Flooring</SelectItem>
                        <SelectItem value="hvac">HVAC</SelectItem>
                        <SelectItem value="general">General Contractor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button 
                      className="w-full bg-amber-500 hover:bg-amber-600"
                      onClick={handleSearch}
                      disabled={searchMutation.isPending}
                      data-testid="button-search-leads"
                    >
                      {searchMutation.isPending ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Search className="h-4 w-4 mr-2" />
                      )}
                      Find Leads
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                  <CardTitle>Search Results ({searchResults.length} leads)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {searchResults.map((lead, i) => (
                      <div key={i} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-medium text-white">{lead.business_name}</h4>
                            {getScoreBadge(lead.score_label || 'cold')}
                            {getCompetitionBadge(lead.competition_level || 'medium')}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-slate-400">
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" /> {lead.city}, {lead.state}
                            </span>
                            {lead.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3" /> {lead.phone}
                              </span>
                            )}
                          </div>
                          {lead.signal_tags && lead.signal_tags.length > 0 && (
                            <div className="flex gap-1 mt-2">
                              {lead.signal_tags.map((tag, j) => (
                                <Badge key={j} variant="outline" className="text-xs">
                                  {tag.replace('_', ' ')}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right mr-4">
                            <div className="text-2xl font-bold text-amber-400">{lead.score}</div>
                            <div className="text-xs text-slate-400">Score</div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-amber-500 text-amber-400 hover:bg-amber-500/20"
                            onClick={() => saveLead.mutate(lead)}
                            disabled={saveLead.isPending}
                            data-testid={`button-save-lead-${i}`}
                          >
                            <Save className="h-4 w-4 mr-1" />
                            Save
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Pipeline */}
          <TabsContent value="pipeline">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {['new', 'contacted', 'estimate_sent', 'won', 'lost'].map((status) => {
                const pipelineData = pipeline?.pipeline?.find((p: any) => p.status === status);
                const leads = pipelineData?.leads || [];
                const statusLabels: Record<string, string> = {
                  new: 'New',
                  contacted: 'Contacted',
                  estimate_sent: 'Estimate Sent',
                  won: 'Won',
                  lost: 'Lost'
                };
                const statusColors: Record<string, string> = {
                  new: 'border-blue-500',
                  contacted: 'border-yellow-500',
                  estimate_sent: 'border-orange-500',
                  won: 'border-green-500',
                  lost: 'border-red-500'
                };
                
                return (
                  <Card key={status} className={`bg-slate-900 border-t-4 ${statusColors[status]}`}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center justify-between">
                        {statusLabels[status]}
                        <Badge variant="outline">{leads.length}</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {leads.length === 0 ? (
                        <p className="text-xs text-slate-500 text-center py-4">No leads</p>
                      ) : (
                        leads.slice(0, 5).map((lead: any, i: number) => (
                          <div key={i} className="p-2 bg-slate-800 rounded text-xs">
                            <p className="font-medium text-white truncate">{lead.company_name}</p>
                            <p className="text-slate-400">{lead.city}, {lead.state}</p>
                            <div className="flex gap-1 mt-1">
                              {status !== 'won' && status !== 'lost' && (
                                <>
                                  {status === 'new' && (
                                    <Button 
                                      size="sm" 
                                      variant="ghost" 
                                      className="h-6 text-xs px-2"
                                      onClick={() => updateLeadStatus.mutate({ id: lead.id, status: 'contacted' })}
                                    >
                                      Contact
                                    </Button>
                                  )}
                                  {status === 'contacted' && (
                                    <Button 
                                      size="sm" 
                                      variant="ghost" 
                                      className="h-6 text-xs px-2"
                                      onClick={() => updateLeadStatus.mutate({ id: lead.id, status: 'estimate_sent' })}
                                    >
                                      Send Est.
                                    </Button>
                                  )}
                                  {status === 'estimate_sent' && (
                                    <>
                                      <Button 
                                        size="sm" 
                                        variant="ghost" 
                                        className="h-6 text-xs px-2 text-green-400"
                                        onClick={() => updateLeadStatus.mutate({ id: lead.id, status: 'won' })}
                                      >
                                        Won
                                      </Button>
                                      <Button 
                                        size="sm" 
                                        variant="ghost" 
                                        className="h-6 text-xs px-2 text-red-400"
                                        onClick={() => updateLeadStatus.mutate({ id: lead.id, status: 'lost' })}
                                      >
                                        Lost
                                      </Button>
                                    </>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* AI Outreach */}
          <TabsContent value="outreach">
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-amber-400" />
                  AI Outreach Generator
                </CardTitle>
                <CardDescription>Generate personalized outreach scripts for your leads</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-4">Select a Lead</h4>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {savedLeads?.leads?.map((lead, i) => (
                        <div 
                          key={i}
                          className={`p-3 rounded-lg cursor-pointer transition-all ${
                            selectedLead?.id === lead.id 
                              ? 'bg-amber-500/20 border border-amber-500' 
                              : 'bg-slate-800 hover:bg-slate-700'
                          }`}
                          onClick={() => setSelectedLead(lead)}
                          data-testid={`lead-select-${i}`}
                        >
                          <p className="font-medium">{lead.company_name}</p>
                          <p className="text-sm text-slate-400">{lead.city}, {lead.state}</p>
                        </div>
                      ))}
                    </div>
                    {selectedLead && (
                      <Button 
                        className="w-full mt-4 bg-amber-500 hover:bg-amber-600"
                        onClick={() => generateOutreach.mutate(selectedLead.id!)}
                        disabled={generateOutreach.isPending}
                        data-testid="button-generate-outreach"
                      >
                        {generateOutreach.isPending ? (
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Sparkles className="h-4 w-4 mr-2" />
                        )}
                        Generate Outreach Pack
                      </Button>
                    )}
                  </div>
                  
                  <div className="max-h-[600px] overflow-y-auto">
                    {outreachData ? (
                      <div className="space-y-4">
                        {outreachData.personalization_notes && (
                          <div className="p-3 bg-amber-900/30 border border-amber-600/50 rounded-lg">
                            <h5 className="flex items-center gap-2 font-medium mb-1 text-amber-400">
                              <Sparkles className="h-4 w-4" /> AI Personalization Notes
                            </h5>
                            <p className="text-sm text-amber-200">{outreachData.personalization_notes}</p>
                          </div>
                        )}
                        
                        <div>
                          <h5 className="flex items-center gap-2 font-medium mb-2">
                            <MessageSquare className="h-4 w-4 text-green-400" /> SMS Pitch
                            <Badge variant="outline" className="text-xs">{(outreachData.sms_pitch || '').length}/280 chars</Badge>
                          </h5>
                          <div className="p-3 bg-slate-800 rounded-lg text-sm" data-testid="outreach-sms">
                            {outreachData.sms_pitch || outreachData.smsScript}
                          </div>
                        </div>
                        
                        <div>
                          <h5 className="flex items-center gap-2 font-medium mb-2">
                            <Mail className="h-4 w-4 text-blue-400" /> Email
                          </h5>
                          <div className="p-3 bg-slate-800 rounded-lg text-sm">
                            <p className="font-semibold text-blue-300 mb-2">Subject: {outreachData.email_subject || 'Professional Services'}</p>
                            <div className="whitespace-pre-wrap text-slate-300" data-testid="outreach-email">
                              {outreachData.email_body || outreachData.emailScript}
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <h5 className="flex items-center gap-2 font-medium mb-2">
                            <Phone className="h-4 w-4 text-purple-400" /> Phone Script
                          </h5>
                          <div className="p-3 bg-slate-800 rounded-lg text-sm" data-testid="outreach-phone">
                            {outreachData.phone_script || outreachData.phoneScript}
                          </div>
                        </div>
                        
                        <div>
                          <h5 className="flex items-center gap-2 font-medium mb-2">
                            <DollarSign className="h-4 w-4 text-amber-400" /> 3-Tier Offer Stack
                          </h5>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                            {(outreachData.offer_stack || outreachData.offerStack) && Object.entries(outreachData.offer_stack || outreachData.offerStack).map(([key, offer]: [string, any]) => (
                              <div key={key} className="p-3 bg-slate-800 rounded-lg text-xs">
                                <p className="font-medium text-amber-400 capitalize">{key.replace(/_/g, ' ')}</p>
                                <p className="text-slate-300 mt-1">{offer.name || offer}</p>
                                <p className="text-green-400 mt-1">{offer.discount}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        {outreachData.followups && outreachData.followups.length > 0 && (
                          <div>
                            <h5 className="flex items-center gap-2 font-medium mb-2">
                              <Clock className="h-4 w-4 text-cyan-400" /> Follow-up Sequence
                            </h5>
                            <div className="space-y-2">
                              {outreachData.followups.map((followup: any, i: number) => (
                                <div key={i} className="p-2 bg-slate-800 rounded-lg text-xs flex items-start gap-2">
                                  <Badge variant="outline" className="shrink-0">Day {followup.day}</Badge>
                                  <p className="text-slate-300">{followup.message}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {outreachData.objection_handlers && (
                          <div>
                            <h5 className="flex items-center gap-2 font-medium mb-2">
                              <Shield className="h-4 w-4 text-red-400" /> Objection Handlers
                            </h5>
                            <div className="space-y-2">
                              {Object.entries(outreachData.objection_handlers).map(([objection, response]: [string, any]) => (
                                <div key={objection} className="p-2 bg-slate-800 rounded-lg text-xs">
                                  <p className="font-medium text-red-400 capitalize mb-1">"{objection.replace(/_/g, ' ')}"</p>
                                  <p className="text-slate-300">{response}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {outreachData.call_to_action && (
                          <div className="p-3 bg-green-900/30 border border-green-600/50 rounded-lg text-center">
                            <p className="text-xs text-green-400 mb-1">Call To Action</p>
                            <p className="font-semibold text-green-300">{outreachData.call_to_action}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Sparkles className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                        <p className="text-slate-400">Select a lead and generate an outreach pack</p>
                        <p className="text-xs text-slate-500 mt-2">Powered by OpenAI GPT-4o-mini</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Campaigns */}
          <TabsContent value="campaigns">
            <CampaignsSection />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Campaigns Section Component
function CampaignsSection() {
  const { toast } = useToast();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newCampaignName, setNewCampaignName] = useState('');
  const [newCampaignLocation, setNewCampaignLocation] = useState('');
  const [newCampaignSchedule, setNewCampaignSchedule] = useState('weekly');
  const [newCampaignStormTrigger, setNewCampaignStormTrigger] = useState(false);

  // Fetch campaigns
  const { data: campaignsData, isLoading: campaignsLoading, refetch: refetchCampaigns } = useQuery<{ campaigns: any[] }>({
    queryKey: ['/api/leadvault/campaigns'],
  });

  // Fetch scheduler stats
  const { data: schedulerStats } = useQuery<{ stats: any }>({
    queryKey: ['/api/leadvault/scheduler/stats'],
  });

  // Create campaign mutation
  const createCampaign = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('/api/leadvault/campaigns', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({ title: 'Campaign created!' });
      setShowCreateDialog(false);
      setNewCampaignName('');
      setNewCampaignLocation('');
      refetchCampaigns();
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to create campaign', description: error.message, variant: 'destructive' });
    }
  });

  // Toggle campaign enabled
  const toggleCampaign = useMutation({
    mutationFn: async ({ id, enabled }: { id: number; enabled: boolean }) => {
      return apiRequest(`/api/leadvault/campaigns/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ enabled }),
      });
    },
    onSuccess: () => {
      toast({ title: 'Campaign updated!' });
      refetchCampaigns();
    }
  });

  // Run campaign now
  const runCampaign = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/leadvault/campaigns/${id}/run`, {
        method: 'POST',
      });
    },
    onSuccess: () => {
      toast({ title: 'Campaign started!' });
      refetchCampaigns();
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to run campaign', description: error.message, variant: 'destructive' });
    }
  });

  // Delete campaign
  const deleteCampaign = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/leadvault/campaigns/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      toast({ title: 'Campaign deleted' });
      refetchCampaigns();
    }
  });

  // Create default campaigns
  const createDefaults = useMutation({
    mutationFn: async (targetLocation: string) => {
      return apiRequest('/api/leadvault/campaigns/create-defaults', {
        method: 'POST',
        body: JSON.stringify({ targetLocation }),
      });
    },
    onSuccess: () => {
      toast({ title: 'Default campaigns created!' });
      refetchCampaigns();
    }
  });

  const campaigns = campaignsData?.campaigns || [];
  const stats = schedulerStats?.stats;

  return (
    <div className="space-y-6">
      {/* Scheduler Status */}
      <Card className="bg-gradient-to-br from-cyan-900/50 to-cyan-950/50 border-cyan-700/50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-cyan-500/20">
                <CalendarDays className="h-5 w-5 text-cyan-400" />
              </div>
              <div>
                <h3 className="font-semibold text-cyan-300">Campaign Scheduler</h3>
                <p className="text-xs text-slate-400">
                  Daily: 8:05 AM CST | Weekly: Monday 8:10 AM CST | Storm: Active
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {stats?.isRunning ? (
                <Badge className="bg-green-500/20 text-green-400">Running</Badge>
              ) : (
                <Badge className="bg-slate-500/20 text-slate-400">Stopped</Badge>
              )}
            </div>
          </div>
          {stats?.lastDailyRun && (
            <p className="text-xs text-slate-500 mt-2">
              Last daily run: {new Date(stats.lastDailyRun).toLocaleString()}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Campaign Actions */}
      <div className="flex gap-3 flex-wrap">
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-amber-500 hover:bg-amber-600" data-testid="button-create-campaign">
              <Plus className="h-4 w-4 mr-2" /> Create Campaign
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-900 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white">Create New Campaign</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <label className="text-sm text-slate-400">Campaign Name</label>
                <Input 
                  value={newCampaignName}
                  onChange={(e) => setNewCampaignName(e.target.value)}
                  placeholder="e.g., Property Manager Contracts"
                  className="bg-slate-800 border-slate-700 text-white"
                  data-testid="input-campaign-name"
                />
              </div>
              <div>
                <label className="text-sm text-slate-400">Target Location</label>
                <Input 
                  value={newCampaignLocation}
                  onChange={(e) => setNewCampaignLocation(e.target.value)}
                  placeholder="e.g., Columbus, GA"
                  className="bg-slate-800 border-slate-700 text-white"
                  data-testid="input-campaign-location"
                />
              </div>
              <div>
                <label className="text-sm text-slate-400">Schedule</label>
                <Select value={newCampaignSchedule} onValueChange={setNewCampaignSchedule}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="daily">Daily (8 AM)</SelectItem>
                    <SelectItem value="weekly">Weekly (Monday 8 AM)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  checked={newCampaignStormTrigger}
                  onChange={(e) => setNewCampaignStormTrigger(e.target.checked)}
                  className="rounded"
                  id="stormTrigger"
                />
                <label htmlFor="stormTrigger" className="text-sm text-slate-400 flex items-center gap-1">
                  <CloudLightning className="h-4 w-4 text-yellow-400" />
                  Enable Storm Triggers
                </label>
              </div>
              <Button 
                className="w-full bg-amber-500 hover:bg-amber-600"
                onClick={() => createCampaign.mutate({
                  name: newCampaignName,
                  targetLocation: newCampaignLocation,
                  scheduleType: newCampaignSchedule,
                  stormTriggerEnabled: newCampaignStormTrigger
                })}
                disabled={!newCampaignName || !newCampaignLocation || createCampaign.isPending}
                data-testid="button-submit-campaign"
              >
                {createCampaign.isPending ? 'Creating...' : 'Create Campaign'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {campaigns.length === 0 && (
          <Button 
            variant="outline" 
            className="border-amber-500/50 text-amber-400"
            onClick={() => {
              const location = prompt('Enter your target location (e.g., "Columbus, GA"):');
              if (location) createDefaults.mutate(location);
            }}
            data-testid="button-create-defaults"
          >
            <Zap className="h-4 w-4 mr-2" /> Create Default Campaigns
          </Button>
        )}
      </div>

      {/* Campaigns List */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-amber-400" />
            Your Campaigns
          </CardTitle>
          <CardDescription>Automated lead finding runs at 8 AM CST</CardDescription>
        </CardHeader>
        <CardContent>
          {campaignsLoading ? (
            <div className="text-center py-8 text-slate-400">Loading campaigns...</div>
          ) : campaigns.length === 0 ? (
            <div className="text-center py-12">
              <CalendarDays className="h-12 w-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">No campaigns yet</p>
              <p className="text-xs text-slate-500 mt-2">Create a campaign to automate your lead finding</p>
            </div>
          ) : (
            <div className="space-y-4">
              {campaigns.map((campaign: any) => (
                <div 
                  key={campaign.id} 
                  className={`p-4 rounded-lg border ${campaign.enabled ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-800/20 border-slate-800'}`}
                  data-testid={`campaign-${campaign.id}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-white">{campaign.name}</h4>
                        {campaign.enabled ? (
                          <Badge className="bg-green-500/20 text-green-400 text-xs">Active</Badge>
                        ) : (
                          <Badge className="bg-slate-500/20 text-slate-400 text-xs">Paused</Badge>
                        )}
                        {campaign.storm_trigger_enabled && (
                          <Badge className="bg-yellow-500/20 text-yellow-400 text-xs">
                            <CloudLightning className="h-3 w-3 mr-1" /> Storm
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-slate-400 mt-1">
                        <MapPin className="h-3 w-3 inline mr-1" />
                        {campaign.target_location} • {campaign.radius}mi radius
                      </p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {(campaign.lead_targets || []).slice(0, 3).map((target: string, i: number) => (
                          <Badge key={i} variant="outline" className="text-xs">{target}</Badge>
                        ))}
                        {(campaign.lead_targets || []).length > 3 && (
                          <Badge variant="outline" className="text-xs">+{campaign.lead_targets.length - 3} more</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                        <span>Schedule: {campaign.schedule_type} @ {campaign.schedule_hour}:00 AM</span>
                        <span>Runs: {campaign.total_runs || 0}</span>
                        <span>Leads Found: {campaign.total_leads_found || 0}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        onClick={() => runCampaign.mutate(campaign.id)}
                        disabled={runCampaign.isPending}
                        data-testid={`run-campaign-${campaign.id}`}
                      >
                        <Play className="h-4 w-4 text-green-400" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        onClick={() => toggleCampaign.mutate({ id: campaign.id, enabled: !campaign.enabled })}
                        data-testid={`toggle-campaign-${campaign.id}`}
                      >
                        {campaign.enabled ? (
                          <Pause className="h-4 w-4 text-yellow-400" />
                        ) : (
                          <Play className="h-4 w-4 text-green-400" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        onClick={() => {
                          if (confirm('Delete this campaign?')) {
                            deleteCampaign.mutate(campaign.id);
                          }
                        }}
                        data-testid={`delete-campaign-${campaign.id}`}
                      >
                        <Trash2 className="h-4 w-4 text-red-400" />
                      </Button>
                    </div>
                  </div>
                  {campaign.last_run_at && (
                    <p className="text-xs text-slate-500 mt-2">
                      Last run: {new Date(campaign.last_run_at).toLocaleString()}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Follow-ups Due Today */}
      <FollowUpWidget />
    </div>
  );
}

// Follow-up Widget Component
function FollowUpWidget() {
  const { toast } = useToast();
  
  const { data: followupsData, isLoading, refetch } = useQuery<{ tasks: any[] }>({
    queryKey: ['/api/leadvault/followups/today'],
  });

  const completeFollowup = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      return apiRequest(`/api/leadvault/followups/${id}/complete`, {
        method: 'POST',
        body: JSON.stringify({ status }),
      });
    },
    onSuccess: () => {
      toast({ title: 'Follow-up updated!' });
      refetch();
    }
  });

  const tasks = followupsData?.tasks || [];

  if (isLoading) {
    return (
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="p-4">
          <p className="text-slate-400">Loading follow-ups...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-cyan-400" />
          Follow-ups Due Today
        </CardTitle>
        <CardDescription>Your scheduled outreach tasks</CardDescription>
      </CardHeader>
      <CardContent>
        {tasks.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-green-500/50 mx-auto mb-4" />
            <p className="text-slate-400">No follow-ups due today</p>
            <p className="text-xs text-slate-500">Keep pushing hot leads!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map((task: any) => (
              <div key={task.id} className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-white">{task.task_title}</p>
                    <p className="text-sm text-slate-400">{task.company_name}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {task.channel?.toUpperCase()} • Due: {new Date(task.due_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs">{task.channel}</Badge>
                </div>
                <p className="text-sm text-slate-300 mt-2 bg-slate-700/50 p-2 rounded">{task.message_text}</p>
                <div className="flex gap-2 mt-3">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="text-xs"
                    onClick={() => navigator.clipboard.writeText(task.message_text)}
                  >
                    Copy Message
                  </Button>
                  <Button 
                    size="sm" 
                    className="text-xs bg-green-600 hover:bg-green-700"
                    onClick={() => completeFollowup.mutate({ id: task.id, status: 'completed' })}
                  >
                    Mark Complete
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="text-xs text-slate-400"
                    onClick={() => completeFollowup.mutate({ id: task.id, status: 'skipped' })}
                  >
                    Skip
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
