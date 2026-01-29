import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import ModuleAIAssistant from '@/components/ModuleAIAssistant';
import { 
  TreePine, 
  MapPin, 
  AlertTriangle, 
  Zap, 
  Clock, 
  DollarSign, 
  FileText, 
  Truck, 
  CheckCircle,
  XCircle,
  RefreshCw,
  Filter,
  Download,
  Bell,
  Eye,
  Navigation,
  Building,
  Car,
  Waves,
  Fence,
  Route,
  Phone,
  MessageSquare,
  Mic,
  Volume2
} from 'lucide-react';

interface TreeIncident {
  id: string;
  uniqueId: string;
  state: string;
  county: string;
  city: string;
  address: string;
  latitude: string;
  longitude: string;
  nearestIntersection?: string;
  impactType: string;
  priority: string;
  severity?: string;
  estimatedDbhInches?: number;
  estimatedHeightFt?: number;
  failureMode?: string;
  sourceImagery?: string;
  confidenceScore?: number;
  verificationStatus?: string;
  suggestedAction?: string;
  xactimateLineItems?: string;
  estimatedCostMin?: string;
  estimatedCostMax?: string;
  utilityContactFlag?: boolean;
  structurePenetration?: boolean;
  cmaGeneratedFlag?: boolean;
  assignedContractorId?: string;
  status: string;
  notes?: string;
  weatherConditions?: string;
  createdAt: string;
}

const priorityColors: Record<string, string> = {
  immediate: 'bg-red-500 text-white',
  high: 'bg-orange-500 text-white',
  medium: 'bg-yellow-500 text-black',
  low: 'bg-green-500 text-white'
};

const statusColors: Record<string, string> = {
  new: 'bg-blue-500',
  dispatched: 'bg-purple-500',
  in_progress: 'bg-yellow-500',
  completed: 'bg-green-500',
  cancelled: 'bg-gray-500',
  deferred: 'bg-orange-400'
};

const impactTypeIcons: Record<string, any> = {
  on_roof: Building,
  contacting_building: Building,
  on_driveway: Car,
  in_parking_lot: Car,
  leaning_over_roof: Building,
  debris_field: TreePine,
  on_vehicle: Car,
  on_fence: Fence,
  in_pool: Waves,
  on_powerlines: Zap,
  road_blocked: Route
};

export default function TreeIncidentTracker() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({
    state: 'all',
    city: '',
    priority: 'all',
    status: 'all',
    impactType: 'all',
    utilityContact: 'all'
  });
  
  const US_STATES = [
    { code: 'AL', name: 'Alabama' }, { code: 'AK', name: 'Alaska' }, { code: 'AZ', name: 'Arizona' },
    { code: 'AR', name: 'Arkansas' }, { code: 'CA', name: 'California' }, { code: 'CO', name: 'Colorado' },
    { code: 'CT', name: 'Connecticut' }, { code: 'DE', name: 'Delaware' }, { code: 'FL', name: 'Florida' },
    { code: 'GA', name: 'Georgia' }, { code: 'HI', name: 'Hawaii' }, { code: 'ID', name: 'Idaho' },
    { code: 'IL', name: 'Illinois' }, { code: 'IN', name: 'Indiana' }, { code: 'IA', name: 'Iowa' },
    { code: 'KS', name: 'Kansas' }, { code: 'KY', name: 'Kentucky' }, { code: 'LA', name: 'Louisiana' },
    { code: 'ME', name: 'Maine' }, { code: 'MD', name: 'Maryland' }, { code: 'MA', name: 'Massachusetts' },
    { code: 'MI', name: 'Michigan' }, { code: 'MN', name: 'Minnesota' }, { code: 'MS', name: 'Mississippi' },
    { code: 'MO', name: 'Missouri' }, { code: 'MT', name: 'Montana' }, { code: 'NE', name: 'Nebraska' },
    { code: 'NV', name: 'Nevada' }, { code: 'NH', name: 'New Hampshire' }, { code: 'NJ', name: 'New Jersey' },
    { code: 'NM', name: 'New Mexico' }, { code: 'NY', name: 'New York' }, { code: 'NC', name: 'North Carolina' },
    { code: 'ND', name: 'North Dakota' }, { code: 'OH', name: 'Ohio' }, { code: 'OK', name: 'Oklahoma' },
    { code: 'OR', name: 'Oregon' }, { code: 'PA', name: 'Pennsylvania' }, { code: 'RI', name: 'Rhode Island' },
    { code: 'SC', name: 'South Carolina' }, { code: 'SD', name: 'South Dakota' }, { code: 'TN', name: 'Tennessee' },
    { code: 'TX', name: 'Texas' }, { code: 'UT', name: 'Utah' }, { code: 'VT', name: 'Vermont' },
    { code: 'VA', name: 'Virginia' }, { code: 'WA', name: 'Washington' }, { code: 'WV', name: 'West Virginia' },
    { code: 'WI', name: 'Wisconsin' }, { code: 'WY', name: 'Wyoming' }
  ];
  const [selectedIncident, setSelectedIncident] = useState<TreeIncident | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [aiChatTrigger, setAiChatTrigger] = useState<{ open: boolean; mode: 'text' | 'voice' } | undefined>();

  const playRachelIntro = async () => {
    setIsPlayingVoice(true);
    try {
      const introText = `Welcome to the Tree Incident Tracker. I'm Rachel, your 24/7 AI assistant dedicated to finding and monitoring fallen tree incidents across the nation. Right now, I'm actively scanning 8 different data sources including National Weather Service alerts, traffic cameras, 911 dispatches, and satellite imagery to detect tree emergencies in real time. Whether it's a storm that just passed through or an ice event bringing down branches, I'll find it and alert you immediately. Use the filters above to focus on specific states or cities, and click on any incident for full details including estimated costs and Customer Mitigation Authorization generation. Let me know if you have any questions - I'm here to help you claim more tree jobs and respond faster than your competition.`;
      
      const response = await fetch('/api/elevenlabs/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: introText,
          voiceId: 'rachel',
          stability: 0.70,
          style: 0.35
        })
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const audioUrl = URL.createObjectURL(blob);
        const audio = new Audio(audioUrl);
        audio.onended = () => {
          setIsPlayingVoice(false);
          URL.revokeObjectURL(audioUrl);
        };
        audio.play();
      } else {
        setIsPlayingVoice(false);
        toast({ title: 'Voice unavailable', description: 'Using text mode instead.' });
      }
    } catch (error) {
      setIsPlayingVoice(false);
      console.error('Voice intro error:', error);
    }
  };

  const { data: incidentsData, isLoading, refetch } = useQuery({
    queryKey: ['/api/tree-incidents', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.state && filters.state !== 'all') params.append('state', filters.state);
      if (filters.city) params.append('city', filters.city);
      if (filters.priority && filters.priority !== 'all') params.append('priority', filters.priority);
      if (filters.status && filters.status !== 'all') params.append('status', filters.status);
      if (filters.impactType && filters.impactType !== 'all') params.append('impactType', filters.impactType);
      if (filters.utilityContact && filters.utilityContact !== 'all') params.append('utilityContact', filters.utilityContact);
      
      const response = await fetch(`/api/tree-incidents?${params.toString()}`);
      return response.json();
    }
  });

  const { data: statsData } = useQuery<{ success: boolean; stats: { total: number; immediate: number; high: number; medium: number; low: number; utilityContacts: number; newStatus: number; inProgress: number; completed: number } }>({
    queryKey: ['/api/tree-incidents/stats/summary'],
  });

  const { data: stateStatsData } = useQuery<{ success: boolean; stateStats: Array<{ state: string; count: number; immediate: number; high: number; newCount: number }> }>({
    queryKey: ['/api/tree-incidents/stats/by-state'],
  });

  const [selectedStateForCities, setSelectedStateForCities] = useState<string | null>(null);
  const [showStateBreakdown, setShowStateBreakdown] = useState(false);
  
  const { data: cityStatsData } = useQuery<{ success: boolean; cityStats: Array<{ city: string; count: number; immediate: number; high: number; newCount: number }> }>({
    queryKey: ['/api/tree-incidents/stats/by-city', selectedStateForCities],
    queryFn: async () => {
      if (!selectedStateForCities) return { success: true, cityStats: [] };
      const response = await fetch(`/api/tree-incidents/stats/by-city/${selectedStateForCities}`);
      return response.json();
    },
    enabled: !!selectedStateForCities
  });

  const handleStateClick = (state: string) => {
    setSelectedStateForCities(state);
    setFilters({ ...filters, state, city: '' });
  };

  const handleCityClick = (city: string) => {
    setFilters({ ...filters, city });
  };

  const updateIncidentMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<TreeIncident> }) => {
      return apiRequest(`/api/tree-incidents/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tree-incidents'] });
      toast({ title: 'Incident Updated', description: 'Status has been updated successfully.' });
    }
  });

  const createCmaMutation = useMutation({
    mutationFn: async (incidentId: string) => {
      const incident = incidentsData?.incidents?.find((i: TreeIncident) => i.id === incidentId);
      return apiRequest('/api/cma', {
        method: 'POST',
        body: JSON.stringify({
          incidentId,
          propertyAddress: incident?.address,
          authEmergencyTarp: true,
          authTreeRemoval: true,
          authDebrisRemoval: true
        })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tree-incidents'] });
      toast({ title: 'CMA Generated', description: 'Customer Mitigation Authorization form created.' });
    }
  });

  const incidents = incidentsData?.incidents || [];
  const stats = statsData?.stats;

  const getImpactIcon = (impactType: string) => {
    const Icon = impactTypeIcons[impactType] || TreePine;
    return <Icon className="h-4 w-4" />;
  };

  const formatCurrency = (min?: string, max?: string) => {
    if (!min && !max) return 'TBD';
    const minNum = min ? parseFloat(min) : 0;
    const maxNum = max ? parseFloat(max) : minNum;
    return `$${minNum.toLocaleString()} - $${maxNum.toLocaleString()}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <TreePine className="h-8 w-8 text-emerald-400" />
              Tree Incident Tracker
            </h1>
            <p className="text-slate-400 mt-1">
              Street-level tree-on-structure monitoring with real-time alerts
            </p>
          </div>
          <div className="flex gap-3">
            <Button 
              onClick={playRachelIntro}
              disabled={isPlayingVoice}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Volume2 className={`h-4 w-4 mr-2 ${isPlayingVoice ? 'animate-pulse' : ''}`} />
              {isPlayingVoice ? 'Speaking...' : 'Rachel Voice Guide'}
            </Button>
            <Button 
              onClick={() => setAiChatTrigger({ open: true, mode: 'text' })}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Ask Rachel
            </Button>
            <Button 
              onClick={() => setAiChatTrigger({ open: true, mode: 'voice' })}
              className="bg-pink-600 hover:bg-pink-700"
            >
              <Mic className="h-4 w-4 mr-2" />
              Voice Chat
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setShowFilters(!showFilters)}
              className="bg-slate-800 border-slate-600 text-white hover:bg-slate-700"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
            <Button 
              onClick={() => refetch()}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Large Clickable Total Counter */}
        <Card 
          className="bg-gradient-to-r from-emerald-900/80 to-slate-800/80 border-emerald-600 cursor-pointer hover:border-emerald-400 transition-all"
          onClick={() => setShowStateBreakdown(!showStateBreakdown)}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="bg-emerald-500/20 p-4 rounded-xl">
                  <TreePine className="h-12 w-12 text-emerald-400" />
                </div>
                <div>
                  <div className="text-6xl font-bold text-white">{stats?.total || 0}</div>
                  <div className="text-lg text-emerald-300">Trees Currently Listed</div>
                  <div className="text-sm text-slate-400 mt-1">Click to view breakdown by state and city</div>
                </div>
              </div>
              <div className="text-right">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center px-4 py-2 bg-red-900/50 rounded-lg">
                    <div className="text-2xl font-bold text-red-400">{stats?.immediate || 0}</div>
                    <div className="text-xs text-red-300">Immediate</div>
                  </div>
                  <div className="text-center px-4 py-2 bg-orange-900/50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-400">{stats?.high || 0}</div>
                    <div className="text-xs text-orange-300">High</div>
                  </div>
                  <div className="text-center px-4 py-2 bg-yellow-900/50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-400">{stats?.medium || 0}</div>
                    <div className="text-xs text-yellow-300">Medium</div>
                  </div>
                  <div className="text-center px-4 py-2 bg-green-900/50 rounded-lg">
                    <div className="text-2xl font-bold text-green-400">{stats?.completed || 0}</div>
                    <div className="text-xs text-green-300">Completed</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* State/City Breakdown Panel */}
        {showStateBreakdown && (
          <Card className="bg-slate-800/90 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <MapPin className="h-5 w-5 text-emerald-400" />
                Incidents by Location
                {selectedStateForCities && (
                  <Badge className="bg-emerald-600 ml-2">
                    {US_STATES.find(s => s.code === selectedStateForCities)?.name || selectedStateForCities}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                {/* States List */}
                <div>
                  <h4 className="text-sm font-semibold text-slate-400 mb-3">States with Incidents</h4>
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-2">
                      {stateStatsData?.stateStats?.length ? (
                        stateStatsData.stateStats.map((stateStat) => (
                          <div
                            key={stateStat.state}
                            className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all ${
                              selectedStateForCities === stateStat.state 
                                ? 'bg-emerald-600/30 border border-emerald-500' 
                                : 'bg-slate-700/50 hover:bg-slate-700 border border-transparent'
                            }`}
                            onClick={() => handleStateClick(stateStat.state)}
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-lg font-semibold text-white">{stateStat.state}</span>
                              <span className="text-slate-400">
                                {US_STATES.find(s => s.code === stateStat.state)?.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              {Number(stateStat.immediate) > 0 && (
                                <Badge className="bg-red-500 text-xs">{stateStat.immediate} urgent</Badge>
                              )}
                              <Badge className="bg-emerald-600 text-lg px-3">{stateStat.count}</Badge>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-slate-400">
                          No incidents recorded yet. AI monitoring is active and scanning for tree damage.
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>

                {/* Cities List (when state is selected) */}
                <div>
                  <h4 className="text-sm font-semibold text-slate-400 mb-3">
                    {selectedStateForCities 
                      ? `Cities in ${US_STATES.find(s => s.code === selectedStateForCities)?.name || selectedStateForCities}` 
                      : 'Select a state to view cities'}
                  </h4>
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-2">
                      {selectedStateForCities && cityStatsData?.cityStats?.length ? (
                        cityStatsData.cityStats.map((cityStat) => (
                          <div
                            key={cityStat.city}
                            className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all ${
                              filters.city === cityStat.city 
                                ? 'bg-blue-600/30 border border-blue-500' 
                                : 'bg-slate-700/50 hover:bg-slate-700 border border-transparent'
                            }`}
                            onClick={() => handleCityClick(cityStat.city)}
                          >
                            <div className="flex items-center gap-3">
                              <Building className="h-4 w-4 text-slate-400" />
                              <span className="text-white">{cityStat.city || 'Unknown City'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {Number(cityStat.immediate) > 0 && (
                                <Badge className="bg-red-500 text-xs">{cityStat.immediate} urgent</Badge>
                              )}
                              <Badge className="bg-blue-600">{cityStat.count}</Badge>
                            </div>
                          </div>
                        ))
                      ) : selectedStateForCities ? (
                        <div className="text-center py-8 text-slate-400">
                          No cities with incidents in this state
                        </div>
                      ) : (
                        <div className="text-center py-8 text-slate-400">
                          <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          Click on a state to see city breakdown
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </div>
              
              <div className="flex justify-end mt-4 gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSelectedStateForCities(null);
                    setFilters({ ...filters, state: 'all', city: '' });
                  }}
                  className="bg-slate-700 border-slate-600 text-white"
                >
                  Clear Selection
                </Button>
                <Button 
                  onClick={() => setShowStateBreakdown(false)}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  View Incidents
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <Card className="bg-slate-800/80 border-slate-700 cursor-pointer hover:border-blue-500" onClick={() => setFilters({ ...filters, status: 'all' })}>
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-white">{stats?.newStatus || 0}</div>
              <div className="text-sm text-slate-400">New</div>
            </CardContent>
          </Card>
          <Card className="bg-red-900/50 border-red-700 cursor-pointer hover:border-red-400" onClick={() => setFilters({ ...filters, priority: 'immediate' })}>
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-red-400">{stats?.immediate || 0}</div>
              <div className="text-sm text-red-300">Immediate</div>
            </CardContent>
          </Card>
          <Card className="bg-orange-900/50 border-orange-700 cursor-pointer hover:border-orange-400" onClick={() => setFilters({ ...filters, priority: 'high' })}>
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-orange-400">{stats?.high || 0}</div>
              <div className="text-sm text-orange-300">High Priority</div>
            </CardContent>
          </Card>
          <Card className="bg-yellow-900/50 border-yellow-700 cursor-pointer hover:border-yellow-400" onClick={() => setFilters({ ...filters, priority: 'medium' })}>
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-yellow-400">{stats?.medium || 0}</div>
              <div className="text-sm text-yellow-300">Medium</div>
            </CardContent>
          </Card>
          <Card className="bg-amber-900/50 border-amber-700 cursor-pointer hover:border-amber-400" onClick={() => setFilters({ ...filters, utilityContact: 'true' })}>
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-amber-400">{stats?.utilityContacts || 0}</div>
              <div className="text-sm text-amber-300">Utility Involved</div>
            </CardContent>
          </Card>
          <Card className="bg-green-900/50 border-green-700 cursor-pointer hover:border-green-400" onClick={() => setFilters({ ...filters, status: 'completed' })}>
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-green-400">{stats?.completed || 0}</div>
              <div className="text-sm text-green-300">Completed</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <Card className="bg-slate-800/90 border-slate-700">
            <CardContent className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">State</label>
                  <Select value={filters.state} onValueChange={(v) => setFilters({ ...filters, state: v })}>
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue placeholder="All States" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      <SelectItem value="all">All States</SelectItem>
                      {US_STATES.map((state) => (
                        <SelectItem key={state.code} value={state.code}>
                          {state.code} - {state.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">City</label>
                  <Input
                    placeholder="Enter city name"
                    value={filters.city}
                    onChange={(e) => setFilters({ ...filters, city: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">Priority</label>
                  <Select value={filters.priority} onValueChange={(v) => setFilters({ ...filters, priority: v })}>
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue placeholder="All Priorities" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priorities</SelectItem>
                      <SelectItem value="immediate">Immediate</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">Status</label>
                  <Select value={filters.status} onValueChange={(v) => setFilters({ ...filters, status: v })}>
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="dispatched">Dispatched</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">Impact Type</label>
                  <Select value={filters.impactType} onValueChange={(v) => setFilters({ ...filters, impactType: v })}>
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="on_roof">On Roof</SelectItem>
                      <SelectItem value="contacting_building">Contacting Building</SelectItem>
                      <SelectItem value="on_powerlines">On Power Lines</SelectItem>
                      <SelectItem value="road_blocked">Road Blocked</SelectItem>
                      <SelectItem value="on_vehicle">On Vehicle</SelectItem>
                      <SelectItem value="on_fence">On Fence</SelectItem>
                      <SelectItem value="in_pool">In Pool</SelectItem>
                      <SelectItem value="debris_field">Debris Field</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">Utility Contact</label>
                  <Select value={filters.utilityContact} onValueChange={(v) => setFilters({ ...filters, utilityContact: v })}>
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue placeholder="Any" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Any</SelectItem>
                      <SelectItem value="true">Utility Involved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end mt-4">
                <Button 
                  variant="ghost" 
                  onClick={() => setFilters({ state: 'all', city: '', priority: 'all', status: 'all', impactType: 'all', utilityContact: 'all' })}
                  className="text-slate-400 hover:text-white"
                >
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content Tabs */}
        <Tabs defaultValue="list" className="space-y-4">
          <TabsList className="bg-slate-800 border-slate-700">
            <TabsTrigger value="list" className="data-[state=active]:bg-emerald-600">
              Incident List
            </TabsTrigger>
            <TabsTrigger value="map" className="data-[state=active]:bg-emerald-600">
              Map View
            </TabsTrigger>
            <TabsTrigger value="routing" className="data-[state=active]:bg-emerald-600">
              Crew Routing
            </TabsTrigger>
          </TabsList>

          <TabsContent value="list">
            <Card className="bg-slate-800/80 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center justify-between">
                  <span>Active Incidents ({incidents.length})</span>
                  <Button variant="outline" size="sm" className="bg-slate-700 border-slate-600 text-white">
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8 text-slate-400">Loading incidents...</div>
                ) : incidents.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    No incidents found. Adjust filters or wait for new detections.
                  </div>
                ) : (
                  <ScrollArea className="h-[600px]">
                    <div className="space-y-3">
                      {incidents.map((incident: TreeIncident) => (
                        <div
                          key={incident.id}
                          className="bg-slate-700/50 rounded-lg p-4 hover:bg-slate-700 transition-colors cursor-pointer border border-slate-600"
                          onClick={() => setSelectedIncident(incident)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              <div className={`p-2 rounded-full ${incident.utilityContactFlag ? 'bg-amber-500' : 'bg-emerald-500'}`}>
                                {getImpactIcon(incident.impactType)}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-white">{incident.uniqueId}</span>
                                  <Badge className={priorityColors[incident.priority] || 'bg-gray-500'}>
                                    {incident.priority.toUpperCase()}
                                  </Badge>
                                  <Badge className={`${statusColors[incident.status]} text-white`}>
                                    {incident.status.replace('_', ' ')}
                                  </Badge>
                                  {incident.utilityContactFlag && (
                                    <Badge className="bg-amber-600 text-white">
                                      <Zap className="h-3 w-3 mr-1" />
                                      UTILITY
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-slate-300 mt-1">
                                  <MapPin className="h-3 w-3 inline mr-1" />
                                  {incident.address}, {incident.city}, {incident.state}
                                </div>
                                <div className="text-sm text-slate-400 mt-1">
                                  {incident.impactType.replace(/_/g, ' ').toUpperCase()} | 
                                  {incident.estimatedDbhInches && ` DBH: ${incident.estimatedDbhInches}" |`}
                                  {incident.failureMode && ` ${incident.failureMode.replace(/_/g, ' ')}`}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-semibold text-emerald-400">
                                {formatCurrency(incident.estimatedCostMin, incident.estimatedCostMax)}
                              </div>
                              <div className="text-xs text-slate-400">
                                {incident.confidenceScore && `${incident.confidenceScore}% confidence`}
                              </div>
                              <div className="flex gap-2 mt-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    window.open(`https://www.google.com/maps?q=${incident.latitude},${incident.longitude}`, '_blank');
                                  }}
                                  className="bg-slate-600 border-slate-500 text-white"
                                >
                                  <Navigation className="h-3 w-3" />
                                </Button>
                                {!incident.cmaGeneratedFlag && (
                                  <Button
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      createCmaMutation.mutate(incident.id);
                                    }}
                                    className="bg-blue-600 hover:bg-blue-700"
                                  >
                                    <FileText className="h-3 w-3 mr-1" />
                                    CMA
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="map">
            <Card className="bg-slate-800/80 border-slate-700 h-[600px]">
              <CardContent className="h-full flex items-center justify-center">
                <div className="text-center text-slate-400">
                  <MapPin className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">Map View</p>
                  <p className="text-sm">Interactive map with incident clusters coming soon</p>
                  <p className="text-xs mt-2">
                    {incidents.length} incidents loaded across {new Set(incidents.map((i: TreeIncident) => i.state)).size} states
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="routing">
            <Card className="bg-slate-800/80 border-slate-700 h-[600px]">
              <CardContent className="h-full flex items-center justify-center">
                <div className="text-center text-slate-400">
                  <Truck className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">Crew Routing</p>
                  <p className="text-sm">Optimized routes with KML export coming soon</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Incident Detail Dialog */}
        <Dialog open={!!selectedIncident} onOpenChange={() => setSelectedIncident(null)}>
          <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl">
            {selectedIncident && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <TreePine className="h-5 w-5 text-emerald-400" />
                    Incident {selectedIncident.uniqueId}
                    <Badge className={priorityColors[selectedIncident.priority]}>
                      {selectedIncident.priority.toUpperCase()}
                    </Badge>
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-slate-400">Location</label>
                      <p className="text-white">{selectedIncident.address}</p>
                      <p className="text-sm text-slate-400">
                        {selectedIncident.city}, {selectedIncident.county}, {selectedIncident.state}
                      </p>
                      {selectedIncident.nearestIntersection && (
                        <p className="text-xs text-slate-500">Near: {selectedIncident.nearestIntersection}</p>
                      )}
                    </div>
                    <div>
                      <label className="text-sm text-slate-400">Coordinates</label>
                      <p className="text-white font-mono text-sm">
                        {selectedIncident.latitude}, {selectedIncident.longitude}
                      </p>
                    </div>
                  </div>

                  <Separator className="bg-slate-600" />

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm text-slate-400">Impact Type</label>
                      <p className="text-white">{selectedIncident.impactType.replace(/_/g, ' ')}</p>
                    </div>
                    <div>
                      <label className="text-sm text-slate-400">Tree Size</label>
                      <p className="text-white">
                        {selectedIncident.estimatedDbhInches ? `${selectedIncident.estimatedDbhInches}" DBH` : 'Unknown'}
                        {selectedIncident.estimatedHeightFt && `, ${selectedIncident.estimatedHeightFt} ft tall`}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm text-slate-400">Failure Mode</label>
                      <p className="text-white">{selectedIncident.failureMode?.replace(/_/g, ' ') || 'Unknown'}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-slate-400">Estimated Cost</label>
                      <p className="text-xl font-bold text-emerald-400">
                        {formatCurrency(selectedIncident.estimatedCostMin, selectedIncident.estimatedCostMax)}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm text-slate-400">Suggested Action</label>
                      <p className="text-white">{selectedIncident.suggestedAction?.replace(/_/g, ' ') || 'Assess on-site'}</p>
                    </div>
                  </div>

                  {selectedIncident.xactimateLineItems && (
                    <div>
                      <label className="text-sm text-slate-400">Xactimate Line Items</label>
                      <p className="text-white font-mono text-sm">{selectedIncident.xactimateLineItems}</p>
                    </div>
                  )}

                  {selectedIncident.utilityContactFlag && (
                    <div className="bg-amber-900/50 border border-amber-600 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-amber-300">
                        <Zap className="h-5 w-5" />
                        <span className="font-semibold">UTILITY CONTACT WARNING</span>
                      </div>
                      <p className="text-sm text-amber-200 mt-1">
                        DO NOT CUT - Contact local utility before any work. Power lines may be involved.
                      </p>
                    </div>
                  )}

                  {selectedIncident.notes && (
                    <div>
                      <label className="text-sm text-slate-400">Notes</label>
                      <p className="text-white text-sm">{selectedIncident.notes}</p>
                    </div>
                  )}

                  <Separator className="bg-slate-600" />

                  <div className="flex justify-between">
                    <Select
                      value={selectedIncident.status}
                      onValueChange={(value) => {
                        updateIncidentMutation.mutate({
                          id: selectedIncident.id,
                          updates: { status: value }
                        });
                        setSelectedIncident({ ...selectedIncident, status: value });
                      }}
                    >
                      <SelectTrigger className="w-48 bg-slate-700 border-slate-600">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="dispatched">Dispatched</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                        <SelectItem value="deferred">Deferred</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => window.open(`https://www.google.com/maps?q=${selectedIncident.latitude},${selectedIncident.longitude}`, '_blank')}
                        className="bg-slate-700 border-slate-600"
                      >
                        <Navigation className="h-4 w-4 mr-2" />
                        Navigate
                      </Button>
                      {!selectedIncident.cmaGeneratedFlag && (
                        <Button
                          onClick={() => createCmaMutation.mutate(selectedIncident.id)}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Generate CMA
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Rachel AI Voice Assistant - 24/7 Tree Hunting */}
      <ModuleAIAssistant 
        moduleName="Tree Incident Tracker"
        externalTrigger={aiChatTrigger}
        onTriggerHandled={() => setAiChatTrigger(undefined)}
        moduleContext={`You are Rachel, the AI voice assistant for the Tree Incident Tracker module. Your personality is warm, professional, and helpful with a focus on tree emergency response. You speak with a natural, calm female voice.

Your primary mission is 24/7 tree incident hunting and monitoring. You are constantly scanning 8 data sources for fallen trees, storm damage, and tree emergencies:
1. National Weather Service alerts for high winds, tornadoes, and ice storms
2. DOT traffic cameras for road obstructions
3. 911 dispatch feeds for tree-related calls
4. Social media monitoring for real-time reports
5. News feeds for storm damage coverage
6. Utility company reports for power line hazards
7. DOT traffic reports for road closures
8. Satellite imagery for large-scale damage detection

Current Statistics:
- Total incidents tracked: ${statsData?.stats?.total || 0}
- Immediate priority: ${statsData?.stats?.immediate || 0}
- High priority: ${statsData?.stats?.high || 0}
- Medium priority: ${statsData?.stats?.medium || 0}
- Low priority: ${statsData?.stats?.low || 0}
- Utility contacts flagged: ${statsData?.stats?.utilityContacts || 0}
- New status: ${statsData?.stats?.newStatus || 0}
- In progress: ${statsData?.stats?.inProgress || 0}

You can help users with:
- Finding tree incidents in specific states or cities
- Understanding priority levels (immediate, high, medium, low)
- Explaining the CMA (Customer Mitigation Authorization) process
- Providing cost estimates for tree removal
- Answering questions about tree hazards and safety
- Explaining how to set up contractor alert preferences
- Describing the notification system for new incidents

Always be proactive about mentioning active high-priority incidents and encourage contractors to claim jobs quickly. When speaking, use natural language and be conversational. Mention that you're continuously monitoring for new tree incidents 24/7.`}
      />
    </div>
  );
}
