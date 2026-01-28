import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import VoiceGuide from '@/components/VoiceGuide';
import ModuleAIAssistant from '@/components/ModuleAIAssistant';
import { 
  Camera, AlertTriangle, DollarSign, MapPin, Clock, RefreshCw, 
  Truck, Car, TreePine, Zap, Phone, Navigation, Eye, 
  ChevronRight, TrendingUp, Shield, Users, Play, Activity,
  CircleDot, XCircle, Construction, CloudRain, Wind
} from 'lucide-react';

interface TrafficCamera {
  id: string;
  name: string;
  city: string;
  state: string;
  highway?: string;
  imageUrl?: string;
  latitude?: number;
  longitude?: number;
  lastUpdated?: string;
}

interface Incident {
  id: string;
  type: string;
  description: string;
  severity: string;
  location: string;
  coordinates?: { lat: number; lng: number };
  startTime?: string;
  estimatedEndTime?: string;
  isContractorOpportunity: boolean;
  contractorTypes?: string[];
  estimatedValue?: number;
  roadClosed?: boolean;
  lanesAffected?: number;
}

interface ContractorOpportunity {
  id: string;
  type: string;
  description: string;
  location: string;
  state: string;
  estimatedValue: number;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  contractorTypes: string[];
  coordinates?: { lat: number; lng: number };
  expiresAt?: string;
  claimedBy?: string;
}

const STATES = ['FL', 'GA', 'TX', 'CA', 'NC', 'SC', 'AL', 'LA', 'MS'];

// State abbreviation to full name mapping
const STATE_NAMES: Record<string, string> = {
  'FL': 'Florida',
  'GA': 'Georgia',
  'TX': 'Texas',
  'CA': 'California',
  'NC': 'North Carolina',
  'SC': 'South Carolina',
  'AL': 'Alabama',
  'LA': 'Louisiana',
  'MS': 'Mississippi'
};

// Cities by state for the city selector
const STATE_CITIES: Record<string, string[]> = {
  'FL': ['All Cities', 'Miami', 'Orlando', 'Tampa', 'Jacksonville', 'Fort Lauderdale', 'Key West', 'Naples', 'Pensacola', 'Fort Myers', 'Sarasota'],
  'GA': ['All Cities', 'Atlanta', 'Savannah', 'Augusta', 'Macon', 'Columbus', 'Athens', 'Brunswick'],
  'TX': ['All Cities', 'Houston', 'Dallas', 'San Antonio', 'Austin', 'Fort Worth', 'El Paso', 'Arlington', 'Corpus Christi'],
  'CA': ['All Cities', 'Los Angeles', 'San Francisco', 'San Diego', 'Sacramento', 'San Jose', 'Fresno', 'Oakland'],
  'NC': ['All Cities', 'Charlotte', 'Raleigh', 'Greensboro', 'Durham', 'Winston-Salem', 'Wilmington', 'Fayetteville'],
  'SC': ['All Cities', 'Charleston', 'Columbia', 'Myrtle Beach', 'Greenville', 'Hilton Head', 'Rock Hill'],
  'AL': ['All Cities', 'Birmingham', 'Montgomery', 'Mobile', 'Huntsville', 'Tuscaloosa'],
  'LA': ['All Cities', 'New Orleans', 'Baton Rouge', 'Shreveport', 'Lafayette', 'Lake Charles'],
  'MS': ['All Cities', 'Jackson', 'Gulfport', 'Biloxi', 'Southaven', 'Hattiesburg']
};

export default function TrafficCamWatcherModule() {
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState('cameras');
  const [stateFilter, setStateFilter] = useState('FL');
  const [cityFilter, setCityFilter] = useState('All Cities');
  const [selectedCamera, setSelectedCamera] = useState<TrafficCamera | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Reset city filter when state changes
  const handleStateChange = (newState: string) => {
    setStateFilter(newState);
    setCityFilter('All Cities');
  };

  // Fetch traffic cameras
  const { data: camerasData, isLoading: camerasLoading, refetch: refetchCameras } = useQuery<any>({
    queryKey: ['/api/traffic-cameras', stateFilter],
    refetchInterval: autoRefresh ? 60000 : false, // Refresh every minute if enabled
  });

  // Fetch incidents
  const { data: incidentsData, isLoading: incidentsLoading, refetch: refetchIncidents } = useQuery<any>({
    queryKey: ['/api/511/incidents', stateFilter],
    refetchInterval: autoRefresh ? 30000 : false, // Refresh every 30 seconds
  });

  // Fetch contractor opportunities
  const { data: opportunitiesData, isLoading: opportunitiesLoading, refetch: refetchOpportunities } = useQuery<any>({
    queryKey: ['/api/511/contractor-opportunities', stateFilter],
    refetchInterval: autoRefresh ? 30000 : false,
  });

  const allCameras = camerasData?.cameras || [];
  const incidents = incidentsData?.incidents || [];
  const opportunities = opportunitiesData?.opportunities || [];

  // Filter cameras by city (case-insensitive partial match)
  const cameras = cityFilter === 'All Cities' 
    ? allCameras 
    : allCameras.filter((cam: TrafficCamera) => {
        const camCity = (cam.city || '').toLowerCase();
        const filterCity = cityFilter.toLowerCase();
        return camCity.includes(filterCity) || filterCity.includes(camCity);
      });

  // Calculate stats
  const totalCameras = cameras.length;
  const activeIncidents = incidents.length;
  const contractorOpps = incidents.filter((i: Incident) => i.isContractorOpportunity).length;
  const estimatedRevenue = opportunities.reduce((sum: number, o: ContractorOpportunity) => sum + (o.estimatedValue || 0), 0);

  const getIncidentIcon = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes('tree') || t.includes('debris')) return <TreePine className="w-5 h-5 text-green-400" />;
    if (t.includes('accident') || t.includes('crash') || t.includes('wreck')) return <Car className="w-5 h-5 text-red-400" />;
    if (t.includes('tow') || t.includes('disabled')) return <Truck className="w-5 h-5 text-orange-400" />;
    if (t.includes('power') || t.includes('electric')) return <Zap className="w-5 h-5 text-yellow-400" />;
    if (t.includes('construction') || t.includes('road work')) return <Construction className="w-5 h-5 text-amber-400" />;
    if (t.includes('flood') || t.includes('water')) return <CloudRain className="w-5 h-5 text-blue-400" />;
    if (t.includes('wind')) return <Wind className="w-5 h-5 text-cyan-400" />;
    return <AlertTriangle className="w-5 h-5 text-orange-400" />;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'critical': return 'bg-red-600 text-white';
      case 'major': case 'severe': return 'bg-orange-600 text-white';
      case 'moderate': case 'medium': return 'bg-yellow-600 text-black';
      case 'minor': case 'low': return 'bg-blue-600 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'border-red-500 bg-red-500/10';
      case 'high': return 'border-orange-500 bg-orange-500/10';
      case 'medium': return 'border-yellow-500 bg-yellow-500/10';
      case 'low': return 'border-blue-500 bg-blue-500/10';
      default: return 'border-gray-500 bg-gray-500/10';
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
  };

  const refreshAll = () => {
    refetchCameras();
    refetchIncidents();
    refetchOpportunities();
    toast({ title: "Refreshed", description: "All data updated" });
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Ambient Neon Backdrop */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 opacity-30 blur-3xl"
          style={{
            background: 'radial-gradient(40% 40% at 20% 30%, rgba(0,255,136,0.15), transparent 60%), radial-gradient(50% 50% at 80% 70%, rgba(0,194,255,0.2), transparent 65%)'
          }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-5xl font-extrabold tracking-tight"
                style={{
                  background: 'linear-gradient(90deg, #00ff88 0%, #00d9ff 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textShadow: '0 0 80px rgba(0, 255, 136, 0.5)'
                }}
              >
                TrafficCam Watcher
              </h1>
              <p className="text-lg text-cyan-300/70 mt-2">
                Live traffic monitoring with <span className="text-emerald-400 font-semibold">real-time contractor opportunities</span>
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-emerald-300/60">Auto-refresh:</span>
                <button 
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className={`w-12 h-6 rounded-full transition-colors ${autoRefresh ? 'bg-emerald-600' : 'bg-gray-600'}`}
                  data-testid="toggle-auto-refresh"
                >
                  <div className={`w-5 h-5 rounded-full bg-white transition-transform ${autoRefresh ? 'translate-x-6' : 'translate-x-0.5'}`} />
                </button>
              </div>
              <Button onClick={refreshAll} variant="outline" className="border-emerald-500/50 text-emerald-300" data-testid="button-refresh">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>

          {/* Voice Guide */}
          <div className="flex justify-center mb-6">
            <VoiceGuide currentPortal="traffic-cam" />
          </div>

          {/* State and City Filter */}
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex items-center gap-4">
              <span className="text-emerald-300/70">Filter by State:</span>
              <div className="flex gap-2 flex-wrap">
                {STATES.map(state => (
                  <button
                    key={state}
                    onClick={() => handleStateChange(state)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      stateFilter === state 
                        ? 'bg-emerald-600 text-white' 
                        : 'bg-slate-800/60 text-emerald-300/70 hover:bg-slate-700/60'
                    }`}
                    data-testid={`state-filter-${state}`}
                  >
                    {state}
                  </button>
                ))}
              </div>
            </div>
            
            {/* City Filter Dropdown */}
            <div className="flex items-center gap-4">
              <span className="text-emerald-300/70">Filter by City:</span>
              <Select value={cityFilter} onValueChange={setCityFilter}>
                <SelectTrigger className="w-48 bg-slate-800/60 border-emerald-500/30 text-emerald-300" data-testid="city-filter-select">
                  <SelectValue placeholder="Select city" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-emerald-500/30">
                  {(STATE_CITIES[stateFilter] || ['All Cities']).map(city => (
                    <SelectItem key={city} value={city} className="text-emerald-300 hover:bg-emerald-600/20">
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {cityFilter !== 'All Cities' && (
                <button 
                  onClick={() => setCityFilter('All Cities')}
                  className="px-3 py-1 text-sm text-emerald-300/70 hover:text-emerald-300 hover:bg-emerald-500/20 rounded-lg transition-colors"
                  data-testid="clear-city-filter"
                >
                  Clear City Filter
                </button>
              )}
            </div>
            
            {/* Location Indicator */}
            {(stateFilter || cityFilter !== 'All Cities') && (
              <div className="flex items-center gap-2 text-sm text-emerald-300/70">
                <MapPin className="w-4 h-4" />
                <span>Monitoring: </span>
                <Badge className="bg-emerald-600/30 text-emerald-300 border-emerald-500/30">
                  {STATE_NAMES[stateFilter] || stateFilter}
                  {cityFilter !== 'All Cities' && ` • ${cityFilter}`}
                </Badge>
              </div>
            )}
          </div>
        </div>

        {/* Stats Dashboard */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-emerald-900/40 to-cyan-900/40 border-emerald-500/30 p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <Camera className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-emerald-300">{totalCameras}</div>
                <div className="text-sm text-emerald-300/60">Live Cameras</div>
              </div>
            </div>
          </Card>
          
          <Card className="bg-gradient-to-br from-red-900/40 to-orange-900/40 border-red-500/30 p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-red-300">{activeIncidents}</div>
                <div className="text-sm text-red-300/60">Active Incidents</div>
              </div>
            </div>
          </Card>
          
          <Card className="bg-gradient-to-br from-yellow-900/40 to-amber-900/40 border-yellow-500/30 p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                <Truck className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-300">{contractorOpps}</div>
                <div className="text-sm text-yellow-300/60">Job Opportunities</div>
              </div>
            </div>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-900/40 to-emerald-900/40 border-green-500/30 p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-green-300">{formatCurrency(estimatedRevenue)}</div>
                <div className="text-sm text-green-300/60">Est. Revenue</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-slate-900/80 border border-emerald-500/40 p-1.5 mb-6">
            <TabsTrigger value="cameras" className="px-6 py-3 data-[state=active]:bg-emerald-600 data-[state=active]:text-white font-semibold" data-testid="tab-cameras">
              <Camera className="w-5 h-5 mr-2" />
              Live Cameras ({totalCameras})
            </TabsTrigger>
            <TabsTrigger value="incidents" className="px-6 py-3 data-[state=active]:bg-red-600 data-[state=active]:text-white font-semibold" data-testid="tab-incidents">
              <AlertTriangle className="w-5 h-5 mr-2" />
              Incidents ({activeIncidents})
            </TabsTrigger>
            <TabsTrigger value="opportunities" className="px-6 py-3 data-[state=active]:bg-yellow-600 data-[state=active]:text-white font-semibold" data-testid="tab-opportunities">
              <DollarSign className="w-5 h-5 mr-2" />
              Opportunities ({opportunities.length})
            </TabsTrigger>
          </TabsList>

          {/* CAMERAS TAB */}
          <TabsContent value="cameras">
            {camerasLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => (
                  <Skeleton key={i} className="h-48 rounded-xl bg-slate-800/50" />
                ))}
              </div>
            ) : cameras.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {cameras.slice(0, 24).map((camera: TrafficCamera) => (
                  <Card 
                    key={camera.id} 
                    className="bg-slate-900/60 border-emerald-500/30 overflow-hidden hover:border-emerald-400/50 transition-all cursor-pointer group"
                    onClick={() => setSelectedCamera(camera)}
                    data-testid={`camera-${camera.id}`}
                  >
                    <div className="relative h-32 bg-slate-800">
                      {camera.imageUrl ? (
                        <img 
                          src={camera.imageUrl} 
                          alt={camera.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '';
                            (e.target as HTMLImageElement).className = 'hidden';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
                          <Camera className="w-10 h-10 text-emerald-400/30" />
                        </div>
                      )}
                      <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 bg-black/70 rounded text-xs">
                        <CircleDot className="w-3 h-3 text-red-500 animate-pulse" />
                        <span className="text-emerald-300">LIVE</span>
                      </div>
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <Eye className="w-8 h-8 text-white" />
                      </div>
                    </div>
                    <div className="p-3">
                      <h4 className="font-medium text-emerald-200 text-sm truncate">{camera.name}</h4>
                      <div className="flex items-center gap-1 text-xs text-emerald-300/60 mt-1">
                        <MapPin className="w-3 h-3" />
                        <span>{camera.city}, {camera.state}</span>
                        {camera.highway && <span className="ml-1">• {camera.highway}</span>}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="bg-slate-900/40 border-emerald-500/20 p-12 text-center">
                <Camera className="w-16 h-16 text-emerald-400/30 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-emerald-300/70 mb-2">No Cameras Available</h3>
                <p className="text-emerald-300/50">Traffic camera data for {stateFilter} is currently unavailable. Try another state.</p>
              </Card>
            )}

            {/* Camera Detail Modal */}
            {selectedCamera && (
              <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setSelectedCamera(null)}>
                <Card className="max-w-3xl w-full bg-slate-900 border-emerald-500/50 p-6" onClick={e => e.stopPropagation()}>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-2xl font-bold text-emerald-300">{selectedCamera.name}</h3>
                      <div className="flex items-center gap-2 text-emerald-300/70 mt-1">
                        <MapPin className="w-4 h-4" />
                        <span>{selectedCamera.city}, {selectedCamera.state}</span>
                        {selectedCamera.highway && <Badge variant="secondary">{selectedCamera.highway}</Badge>}
                      </div>
                    </div>
                    <button onClick={() => setSelectedCamera(null)} className="text-emerald-300/60 hover:text-emerald-300">
                      <XCircle className="w-6 h-6" />
                    </button>
                  </div>
                  
                  <div className="aspect-video bg-slate-800 rounded-lg overflow-hidden mb-4">
                    {selectedCamera.imageUrl ? (
                      <img 
                        src={selectedCamera.imageUrl} 
                        alt={selectedCamera.name}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Camera className="w-20 h-20 text-emerald-400/30" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-3">
                    <Button className="bg-emerald-600 hover:bg-emerald-700" data-testid="button-analyze-camera">
                      <Eye className="w-4 h-4 mr-2" />
                      AI Analyze
                    </Button>
                    <Button variant="outline" className="border-emerald-500/50 text-emerald-300" data-testid="button-subscribe-camera">
                      <Activity className="w-4 h-4 mr-2" />
                      Subscribe to Alerts
                    </Button>
                    {selectedCamera.latitude && selectedCamera.longitude && (
                      <Button 
                        variant="outline" 
                        className="border-cyan-500/50 text-cyan-300"
                        onClick={() => window.open(`https://www.google.com/maps?q=${selectedCamera.latitude},${selectedCamera.longitude}`, '_blank')}
                      >
                        <Navigation className="w-4 h-4 mr-2" />
                        Directions
                      </Button>
                    )}
                  </div>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* INCIDENTS TAB */}
          <TabsContent value="incidents">
            {incidentsLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-24 rounded-xl bg-slate-800/50" />
                ))}
              </div>
            ) : incidents.length > 0 ? (
              <div className="space-y-4">
                {incidents.map((incident: Incident) => (
                  <Card 
                    key={incident.id} 
                    className={`bg-slate-900/60 border p-4 hover:scale-[1.01] transition-all ${
                      incident.isContractorOpportunity ? 'border-yellow-500/50' : 'border-red-500/30'
                    }`}
                    data-testid={`incident-${incident.id}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center">
                          {getIncidentIcon(incident.type)}
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <h4 className="font-semibold text-white">{incident.type}</h4>
                            <Badge className={getSeverityColor(incident.severity)}>
                              {incident.severity?.toUpperCase()}
                            </Badge>
                            {incident.isContractorOpportunity && (
                              <Badge className="bg-yellow-600 text-black">
                                <DollarSign className="w-3 h-3 mr-1" />
                                OPPORTUNITY
                              </Badge>
                            )}
                            {incident.roadClosed && (
                              <Badge className="bg-red-700 text-white">ROAD CLOSED</Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-300 mb-2">{incident.description}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-400">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {incident.location}
                            </span>
                            {incident.startTime && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Started: {new Date(incident.startTime).toLocaleTimeString()}
                              </span>
                            )}
                            {incident.lanesAffected && (
                              <span>{incident.lanesAffected} lane(s) affected</span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        {incident.estimatedValue && (
                          <div className="text-lg font-bold text-green-400 mb-2">
                            {formatCurrency(incident.estimatedValue)}
                          </div>
                        )}
                        {incident.contractorTypes && incident.contractorTypes.length > 0 && (
                          <div className="flex flex-wrap gap-1 justify-end">
                            {incident.contractorTypes.map((type, i) => (
                              <span key={i} className="px-2 py-0.5 bg-cyan-500/20 text-cyan-300 rounded text-xs">
                                {type}
                              </span>
                            ))}
                          </div>
                        )}
                        <Button size="sm" className="mt-3 bg-emerald-600 hover:bg-emerald-700" data-testid={`claim-incident-${incident.id}`}>
                          Claim Job
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="bg-slate-900/40 border-red-500/20 p-12 text-center">
                <AlertTriangle className="w-16 h-16 text-red-400/30 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-red-300/70 mb-2">No Active Incidents</h3>
                <p className="text-red-300/50">No traffic incidents reported in {stateFilter}. This is good news for drivers!</p>
              </Card>
            )}
          </TabsContent>

          {/* OPPORTUNITIES TAB */}
          <TabsContent value="opportunities">
            {opportunitiesLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-28 rounded-xl bg-slate-800/50" />
                ))}
              </div>
            ) : opportunities.length > 0 ? (
              <div className="space-y-4">
                {opportunities.map((opp: ContractorOpportunity) => (
                  <Card 
                    key={opp.id} 
                    className={`border-2 p-5 transition-all hover:scale-[1.01] ${getUrgencyColor(opp.urgency)}`}
                    data-testid={`opportunity-${opp.id}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="w-14 h-14 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                          <DollarSign className="w-7 h-7 text-yellow-400" />
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="text-lg font-bold text-white">{opp.type}</h4>
                            <Badge className={
                              opp.urgency === 'critical' ? 'bg-red-600 animate-pulse' :
                              opp.urgency === 'high' ? 'bg-orange-600' :
                              opp.urgency === 'medium' ? 'bg-yellow-600 text-black' :
                              'bg-blue-600'
                            }>
                              {opp.urgency.toUpperCase()} URGENCY
                            </Badge>
                          </div>
                          <p className="text-gray-300 mb-2">{opp.description}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-400">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {opp.location}, {opp.state}
                            </span>
                            {opp.expiresAt && (
                              <span className="flex items-center gap-1 text-orange-400">
                                <Clock className="w-4 h-4" />
                                Expires: {new Date(opp.expiresAt).toLocaleString()}
                              </span>
                            )}
                          </div>
                          <div className="flex gap-2 mt-2">
                            {opp.contractorTypes.map((type, i) => (
                              <span key={i} className="px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-xs font-medium">
                                {type}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-3xl font-bold text-green-400 mb-3">
                          {formatCurrency(opp.estimatedValue)}
                        </div>
                        <div className="space-y-2">
                          <Button className="w-full bg-green-600 hover:bg-green-700" data-testid={`claim-opportunity-${opp.id}`}>
                            <Truck className="w-4 h-4 mr-2" />
                            Claim This Job
                          </Button>
                          {opp.coordinates && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="w-full border-cyan-500/50 text-cyan-300"
                              onClick={() => window.open(`https://www.google.com/maps?q=${opp.coordinates?.lat},${opp.coordinates?.lng}`, '_blank')}
                            >
                              <Navigation className="w-4 h-4 mr-2" />
                              Navigate
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="bg-slate-900/40 border-yellow-500/20 p-12 text-center">
                <Truck className="w-16 h-16 text-yellow-400/30 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-yellow-300/70 mb-2">No Current Opportunities</h3>
                <p className="text-yellow-300/50">No contractor opportunities in {stateFilter} right now. Check back soon or try another state!</p>
                <div className="mt-6 flex justify-center gap-4">
                  <Button variant="outline" className="border-yellow-500/50 text-yellow-300" onClick={() => setStateFilter('TX')}>
                    Check Texas
                  </Button>
                  <Button variant="outline" className="border-yellow-500/50 text-yellow-300" onClick={() => setStateFilter('GA')}>
                    Check Georgia
                  </Button>
                </div>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Quick Action Footer */}
        <div className="mt-8 p-4 bg-gradient-to-r from-emerald-900/30 to-cyan-900/30 rounded-2xl border border-emerald-500/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Activity className="w-6 h-6 text-emerald-400 animate-pulse" />
              <span className="text-emerald-300">
                Monitoring {totalCameras} cameras in {stateFilter} • {activeIncidents} active incidents • {contractorOpps} opportunities
              </span>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="border-emerald-500/50 text-emerald-300" data-testid="button-sms-alerts">
                <Phone className="w-4 h-4 mr-2" />
                SMS Alerts
              </Button>
              <Button className="bg-emerald-600 hover:bg-emerald-700" data-testid="button-claim-all">
                <TrendingUp className="w-4 h-4 mr-2" />
                View All Opportunities
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      <ModuleAIAssistant moduleName="TrafficCamWatcher" />
    </div>
  );
}
