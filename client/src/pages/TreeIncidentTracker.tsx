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
import ModuleVoiceGuide from '@/components/ModuleVoiceGuide';
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
  Volume2,
  CloudLightning,
  Camera,
  Users,
  HardHat,
  Radio
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
  source?: string;
  sourceUrl?: string;
  probableCause?: string;
  windSpeed?: number;
  gustSpeed?: number;
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

const sourceConfig: Record<string, { label: string; icon: any; color: string; description: string }> = {
  nws_alerts: { label: 'NWS Alerts', icon: CloudLightning, color: 'bg-blue-600 text-white', description: 'National Weather Service storm alerts' },
  traffic_cameras: { label: 'Traffic Cam', icon: Camera, color: 'bg-violet-600 text-white', description: 'Live traffic camera detection' },
  social_media: { label: 'Social Media', icon: MessageSquare, color: 'bg-pink-600 text-white', description: 'Social media reports & posts' },
  news_feeds: { label: 'News Feed', icon: FileText, color: 'bg-cyan-600 text-white', description: 'Local news reports' },
  '911_scanners': { label: '911 Scanner', icon: Phone, color: 'bg-red-600 text-white', description: '911 dispatch & emergency calls' },
  dot_reports: { label: 'DOT Report', icon: Route, color: 'bg-orange-600 text-white', description: 'Dept of Transportation road reports' },
  utility_reports: { label: 'Utility Outage', icon: Zap, color: 'bg-yellow-600 text-black', description: 'Power company outage feeds' },
  satellite_imagery: { label: 'Satellite', icon: Navigation, color: 'bg-emerald-600 text-white', description: 'Satellite imagery analysis' },
  manual_entry: { label: 'Manual Entry', icon: Users, color: 'bg-slate-600 text-white', description: 'Crew report or customer call-in' },
  crew_report: { label: 'Crew Report', icon: HardHat, color: 'bg-amber-600 text-white', description: 'Field crew observation' },
  customer_call: { label: 'Customer Call', icon: Phone, color: 'bg-teal-600 text-white', description: 'Customer reported incident' },
  utility_dispatch: { label: 'Utility Dispatch', icon: Zap, color: 'bg-indigo-600 text-white', description: 'Utility company dispatch' },
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
  
  // Crew Routing State
  const [routeStops, setRouteStops] = useState<TreeIncident[]>([]);
  const [isOptimizing, setIsOptimizing] = useState(false);

  const [isRefreshing, setIsRefreshing] = useState(false);

  const playRachelIntro = async () => {
    setIsPlayingVoice(true);
    try {
      const introText = `Welcome to the Tree Incident Tracker. I'm Rachel, your 24/7 AI assistant dedicated to finding and monitoring fallen tree incidents across the nation. Right now, I'm actively scanning 8 different data sources including National Weather Service alerts, traffic cameras, 911 dispatches, and satellite imagery to detect tree emergencies in real time. Whether it's a storm that just passed through or an ice event bringing down branches, I'll find it and alert you immediately. Use the filters above to focus on specific states or cities, and click on any incident for full details including estimated costs and Customer Mitigation Authorization generation. Let me know if you have any questions - I'm here to help you claim more tree jobs and respond faster than your competition.`;
      
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: introText })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.audioBase64) {
          const byteCharacters = atob(data.audioBase64);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: 'audio/mpeg' });
          const audioUrl = URL.createObjectURL(blob);
          const audio = new Audio(audioUrl);
          audio.onended = () => {
            setIsPlayingVoice(false);
            URL.revokeObjectURL(audioUrl);
          };
          audio.onerror = () => {
            setIsPlayingVoice(false);
            URL.revokeObjectURL(audioUrl);
            toast({ title: 'Voice unavailable', description: 'Audio playback failed. Try text mode instead.' });
          };
          audio.play().catch(() => {
            setIsPlayingVoice(false);
            toast({ title: 'Voice unavailable', description: 'Could not play audio. Try text mode instead.' });
          });
        } else {
          setIsPlayingVoice(false);
          toast({ title: 'Voice unavailable', description: 'No audio data received. Using text mode instead.' });
        }
      } else {
        setIsPlayingVoice(false);
        toast({ title: 'Voice unavailable', description: 'Voice service not available right now. Try text mode instead.' });
      }
    } catch (error) {
      setIsPlayingVoice(false);
      console.error('Voice intro error:', error);
      toast({ title: 'Voice unavailable', description: 'Could not connect to voice service. Try text mode instead.' });
    }
  };

  // Crew Routing Functions
  const addToRoute = (incident: TreeIncident) => {
    if (!routeStops.find(s => s.id === incident.id)) {
      setRouteStops([...routeStops, incident]);
      toast({ title: 'Added to route', description: `${incident.address} added as stop #${routeStops.length + 1}` });
    } else {
      toast({ title: 'Already in route', description: 'This incident is already part of the route', variant: 'destructive' });
    }
  };

  const removeFromRoute = (incidentId: string) => {
    setRouteStops(routeStops.filter(s => s.id !== incidentId));
  };

  const moveStopUp = (index: number) => {
    if (index === 0) return;
    const newStops = [...routeStops];
    [newStops[index - 1], newStops[index]] = [newStops[index], newStops[index - 1]];
    setRouteStops(newStops);
  };

  const moveStopDown = (index: number) => {
    if (index === routeStops.length - 1) return;
    const newStops = [...routeStops];
    [newStops[index], newStops[index + 1]] = [newStops[index + 1], newStops[index]];
    setRouteStops(newStops);
  };

  const optimizeRoute = async () => {
    if (routeStops.length < 2) {
      toast({ title: 'Need more stops', description: 'Add at least 2 stops to optimize the route' });
      return;
    }
    
    setIsOptimizing(true);
    try {
      // Simple optimization: Sort by priority (immediate first), then by proximity
      const priorityOrder: Record<string, number> = { immediate: 0, high: 1, medium: 2, low: 3 };
      const optimized = [...routeStops].sort((a, b) => {
        // First by priority
        const priorityDiff = (priorityOrder[a.priority] || 3) - (priorityOrder[b.priority] || 3);
        if (priorityDiff !== 0) return priorityDiff;
        // Then by utility contact (flagged first)
        if (a.utilityContactFlag && !b.utilityContactFlag) return -1;
        if (!a.utilityContactFlag && b.utilityContactFlag) return 1;
        // Then by estimated cost (higher first)
        const costA = parseInt(a.estimatedCostMax || '0') || 0;
        const costB = parseInt(b.estimatedCostMax || '0') || 0;
        return costB - costA;
      });
      
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate optimization
      setRouteStops(optimized);
      toast({ title: 'Route optimized', description: 'Stops reordered by priority, utility flags, and value' });
    } catch (error) {
      toast({ title: 'Optimization failed', variant: 'destructive' });
    } finally {
      setIsOptimizing(false);
    }
  };

  const exportToKML = () => {
    if (routeStops.length === 0) {
      toast({ title: 'No stops to export', variant: 'destructive' });
      return;
    }

    const kmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>Tree Incident Route - ${new Date().toLocaleDateString()}</name>
    <description>Crew route with ${routeStops.length} stops</description>
    <Style id="immediate">
      <IconStyle><color>ff0000ff</color><scale>1.2</scale></IconStyle>
    </Style>
    <Style id="high">
      <IconStyle><color>ff00a5ff</color><scale>1.1</scale></IconStyle>
    </Style>
    <Style id="medium">
      <IconStyle><color>ff00ffff</color><scale>1.0</scale></IconStyle>
    </Style>
    <Style id="low">
      <IconStyle><color>ff00ff00</color><scale>0.9</scale></IconStyle>
    </Style>
    ${routeStops.map((stop, i) => `
    <Placemark>
      <name>Stop ${i + 1}: ${stop.address}</name>
      <description>
        Priority: ${stop.priority.toUpperCase()}
        Impact: ${stop.impactType.replace(/_/g, ' ')}
        Est. Cost: $${stop.estimatedCostMin || '?'} - $${stop.estimatedCostMax || '?'}
        ${stop.utilityContactFlag ? 'UTILITY CONTACT REQUIRED' : ''}
        ${stop.notes || ''}
      </description>
      <styleUrl>#${stop.priority}</styleUrl>
      <Point>
        <coordinates>${stop.longitude},${stop.latitude},0</coordinates>
      </Point>
    </Placemark>`).join('')}
    <Placemark>
      <name>Route Path</name>
      <LineString>
        <coordinates>
          ${routeStops.map(s => `${s.longitude},${s.latitude},0`).join(' ')}
        </coordinates>
      </LineString>
    </Placemark>
  </Document>
</kml>`;

    const blob = new Blob([kmlContent], { type: 'application/vnd.google-earth.kml+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tree-route-${new Date().toISOString().split('T')[0]}.kml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({ title: 'KML exported', description: 'Route file downloaded for Google Earth / GPS' });
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

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      toast({ title: 'Refreshed', description: 'Incident data updated successfully.' });
    } catch (error) {
      toast({ title: 'Refresh failed', description: 'Could not refresh data. Please try again.', variant: 'destructive' });
    } finally {
      setIsRefreshing(false);
    }
  };

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

  const filterStateForCities = filters.state !== 'all' ? filters.state : null;
  const { data: filterCityData } = useQuery<{ success: boolean; cityStats: Array<{ city: string; count: number; immediate: number; high: number; newCount: number }> }>({
    queryKey: ['/api/tree-incidents/stats/by-city', filterStateForCities, 'filter'],
    queryFn: async () => {
      if (!filterStateForCities) return { success: true, cityStats: [] };
      const response = await fetch(`/api/tree-incidents/stats/by-city/${filterStateForCities}`);
      return response.json();
    },
    enabled: !!filterStateForCities
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
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
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
                  <Select value={filters.state} onValueChange={(v) => setFilters({ ...filters, state: v, city: '' })}>
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
                  {filters.state !== 'all' && filterCityData?.cityStats?.length ? (
                    <Select 
                      value={filters.city || 'all_cities'} 
                      onValueChange={(v) => setFilters({ ...filters, city: v === 'all_cities' ? '' : v })}
                    >
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                        <SelectValue placeholder="All Cities" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        <SelectItem value="all_cities">All Cities</SelectItem>
                        {filterCityData.cityStats.map((cityStat) => (
                          <SelectItem key={cityStat.city || 'unknown'} value={cityStat.city || 'unknown'}>
                            {cityStat.city || 'Unknown'} ({cityStat.count})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      placeholder={filters.state === 'all' ? 'Select a state first' : 'No cities found'}
                      value={filters.city}
                      onChange={(e) => setFilters({ ...filters, city: e.target.value })}
                      className="bg-slate-700 border-slate-600 text-white"
                      disabled={filters.state === 'all'}
                    />
                  )}
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
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-semibold text-white">{incident.uniqueId}</span>
                                  <Badge className={priorityColors[incident.priority] || 'bg-gray-500'}>
                                    {incident.priority.toUpperCase()}
                                  </Badge>
                                  <Badge className={`${statusColors[incident.status]} text-white`}>
                                    {incident.status.replace('_', ' ')}
                                  </Badge>
                                  {incident.source && (() => {
                                    const src = sourceConfig[incident.source] || { label: incident.source.replace(/_/g, ' '), icon: Radio, color: 'bg-slate-500 text-white', description: 'Unknown source' };
                                    const SourceIcon = src.icon;
                                    return (
                                      <Badge className={`${src.color} flex items-center gap-1`}>
                                        <SourceIcon className="h-3 w-3" />
                                        {src.label}
                                      </Badge>
                                    );
                                  })()}
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
                                <Button
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    addToRoute(incident);
                                  }}
                                  className={routeStops.find(s => s.id === incident.id) 
                                    ? "bg-green-600 hover:bg-green-700" 
                                    : "bg-purple-600 hover:bg-purple-700"}
                                >
                                  <Truck className="h-3 w-3 mr-1" />
                                  {routeStops.find(s => s.id === incident.id) ? 'In Route' : 'Add Route'}
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
            <Card className="bg-slate-800/80 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Truck className="h-5 w-5 text-blue-400" />
                    Crew Routing - Optimized Stop Sequence
                  </div>
                  <div className="flex gap-2">
                    {routeStops.length > 0 && (
                      <>
                        <Button
                          size="sm"
                          onClick={optimizeRoute}
                          disabled={isOptimizing}
                          className="bg-purple-600 hover:bg-purple-700"
                        >
                          {isOptimizing ? 'Optimizing...' : 'Optimize Route'}
                        </Button>
                        <Button
                          size="sm"
                          onClick={exportToKML}
                          className="bg-emerald-600 hover:bg-emerald-700"
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Export KML
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setRouteStops([])}
                          className="bg-slate-700 border-slate-600 text-white"
                        >
                          Clear Route
                        </Button>
                      </>
                    )}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {routeStops.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    <Navigation className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">No stops added yet</p>
                    <p className="text-sm mt-2">Click "Add to Route" on incidents in the List tab to build your crew route</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Route Summary */}
                    <div className="grid grid-cols-4 gap-4 p-4 bg-slate-700/50 rounded-lg">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-white">{routeStops.length}</div>
                        <div className="text-sm text-slate-400">Total Stops</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-emerald-400">
                          ${routeStops.reduce((sum, stop) => sum + (parseInt(stop.estimatedCostMin || '0') || 0), 0).toLocaleString()}
                        </div>
                        <div className="text-sm text-slate-400">Est. Revenue (Min)</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-400">
                          {routeStops.filter(s => s.priority === 'immediate' || s.priority === 'high').length}
                        </div>
                        <div className="text-sm text-slate-400">High Priority</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-400">
                          {routeStops.filter(s => s.utilityContactFlag).length}
                        </div>
                        <div className="text-sm text-slate-400">Utility Contacts</div>
                      </div>
                    </div>

                    {/* Ordered Stop List */}
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-2">
                        {routeStops.map((stop, index) => (
                          <div 
                            key={stop.id}
                            className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg border border-slate-600"
                          >
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                              {index + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-white font-medium truncate">{stop.address}</span>
                                <Badge className={`${priorityColors[stop.priority]} text-xs`}>
                                  {stop.priority}
                                </Badge>
                                {stop.utilityContactFlag && (
                                  <Badge className="bg-yellow-600">
                                    <Zap className="h-3 w-3 mr-1" />
                                    Utility
                                  </Badge>
                                )}
                              </div>
                              <div className="text-sm text-slate-400">
                                {stop.city}, {stop.state} | {stop.impactType.replace(/_/g, ' ')} | Est: {formatCurrency(stop.estimatedCostMin, stop.estimatedCostMax)}
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => moveStopUp(index)}
                                disabled={index === 0}
                                className="text-slate-400 hover:text-white h-8 w-8 p-0"
                              >
                                ↑
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => moveStopDown(index)}
                                disabled={index === routeStops.length - 1}
                                className="text-slate-400 hover:text-white h-8 w-8 p-0"
                              >
                                ↓
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => removeFromRoute(stop.id)}
                                className="text-red-400 hover:text-red-300 h-8 w-8 p-0"
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}
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

                  {selectedIncident.source && (() => {
                    const src = sourceConfig[selectedIncident.source] || { label: selectedIncident.source.replace(/_/g, ' '), icon: Radio, color: 'bg-slate-500 text-white', description: 'Unknown source' };
                    const SourceIcon = src.icon;
                    return (
                      <div className="bg-slate-700/60 border border-slate-600 rounded-lg p-3">
                        <label className="text-xs text-slate-400 uppercase tracking-wider">Reported From</label>
                        <div className="flex items-center gap-3 mt-1">
                          <div className={`p-2 rounded-lg ${src.color}`}>
                            <SourceIcon className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-white font-semibold">{src.label}</p>
                            <p className="text-slate-400 text-sm">{src.description}</p>
                          </div>
                        </div>
                        {selectedIncident.sourceUrl && (
                          <a href={selectedIncident.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 text-xs hover:underline mt-1 inline-block">View original source</a>
                        )}
                      </div>
                    );
                  })()}

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
      <ModuleVoiceGuide moduleName="tree-incident-tracker" />
    </div>
  );
}
