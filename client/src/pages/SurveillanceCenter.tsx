import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Camera, 
  Plane, 
  Eye, 
  Video, 
  Search, 
  Filter, 
  Grid, 
  List, 
  MapPin, 
  Signal, 
  Activity, 
  AlertTriangle, 
  DollarSign, 
  Users, 
  Clock, 
  RefreshCw,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Maximize2,
  Settings,
  Target,
  Battery,
  Wind,
  Navigation,
  Shield,
  Radio,
  Home,
  Monitor,
  Zap,
  TrendingUp
} from 'lucide-react';
import { FadeIn, CountUp, StaggerContainer, StaggerItem, HoverLift, ScaleIn, SlideIn, PulseAlert } from '@/components/ui/animations';
import { apiRequest } from '@/lib/queryClient';
import { UnifiedAssistant } from '@/components/UnifiedAssistant';

interface SurveillanceData {
  cameras: CameraFeed[];
  drones: DroneData[];
  opportunities: ContractorOpportunity[];
  stats: SurveillanceStats;
}

interface CameraFeed {
  id: string;
  name: string;
  state: string;
  location: string;
  coordinates: { lat: number; lng: number };
  status: 'online' | 'offline' | 'maintenance';
  type: 'traffic' | 'weather' | 'security' | 'storm' | 'community';
  streamUrl?: string;
  lastUpdate: string;
  incidentCount: number;
  contractorOpportunities: number;
  provider: string;
}

interface DroneData {
  id: string;
  droneId: string;
  pilot: string;
  location: string;
  status: 'active' | 'returning' | 'emergency' | 'ready' | 'maintenance';
  battery: number;
  altitude: number;
  mission: string;
  speed: number;
  coordinates: { lat: number; lng: number };
  missionProgress: number;
  videoFeedActive: boolean;
  flightTime: number;
}

interface ContractorOpportunity {
  id: string;
  type: string;
  description: string;
  coordinates: { lat: number; lng: number };
  severity: 'critical' | 'severe' | 'moderate' | 'minor';
  estimatedValue: string;
  affectedArea: string;
  detectedAt: string;
  source: 'camera' | 'drone' | 'report';
}

interface SurveillanceStats {
  totalCameras: number;
  onlineCameras: number;
  activeDrones: number;
  totalOpportunities: number;
  estimatedValue: string;
  coverageArea: string;
}

/**
 * SurveillanceCenter - Unified portal consolidating Cameras, EyesInSky, Drones, and StormShareCam
 * Eliminates the confusion of multiple separate surveillance pages
 */
export default function SurveillanceCenter() {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedCamera, setSelectedCamera] = useState<string | null>(null);
  const [selectedDrone, setSelectedDrone] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isVoiceGuideActive, setIsVoiceGuideActive] = useState(false);

  // Fetch surveillance data
  const { data: surveillanceData, isLoading } = useQuery<SurveillanceData>({
    queryKey: ['/api/surveillance/overview'],
    refetchInterval: 30000, // Refresh every 30 seconds for live data
  });

  // Mock data while backend API is being set up
  const mockData: SurveillanceData = {
    cameras: [
      {
        id: 'cam_001',
        name: 'I-75 North Atlanta',
        state: 'GA',
        location: 'Atlanta, GA',
        coordinates: { lat: 33.7490, lng: -84.3880 },
        status: 'online',
        type: 'traffic',
        lastUpdate: '2 minutes ago',
        incidentCount: 3,
        contractorOpportunities: 2,
        provider: 'GeorgiaDOT'
      },
      {
        id: 'cam_002', 
        name: 'Storm Watch Point',
        state: 'FL',
        location: 'Miami, FL',
        coordinates: { lat: 25.7617, lng: -80.1918 },
        status: 'online',
        type: 'weather',
        lastUpdate: '1 minute ago',
        incidentCount: 7,
        contractorOpportunities: 5,
        provider: 'NWS'
      },
      {
        id: 'cam_003',
        name: 'Community Watch #47',
        state: 'TX',
        location: 'Houston, TX', 
        coordinates: { lat: 29.7604, lng: -95.3698 },
        status: 'online',
        type: 'community',
        lastUpdate: '5 minutes ago',
        incidentCount: 1,
        contractorOpportunities: 1,
        provider: 'StormShare'
      }
    ],
    drones: [
      {
        id: 'drone_001',
        droneId: 'STORM-01',
        pilot: 'Sarah Martinez',
        location: 'Tampa Bay, FL',
        status: 'active',
        battery: 78,
        altitude: 400,
        mission: 'Storm Damage Assessment',
        speed: 25,
        coordinates: { lat: 27.9506, lng: -82.4572 },
        missionProgress: 67,
        videoFeedActive: true,
        flightTime: 23
      },
      {
        id: 'drone_002',
        droneId: 'RECON-03',
        pilot: 'Mike Chen',
        location: 'Orlando, FL',
        status: 'returning',
        battery: 34,
        altitude: 150,
        mission: 'Post-Storm Survey',
        speed: 30,
        coordinates: { lat: 28.5383, lng: -81.3792 },
        missionProgress: 89,
        videoFeedActive: false,
        flightTime: 45
      }
    ],
    opportunities: [
      {
        id: 'opp_001',
        type: 'Roof Damage',
        description: 'Multiple shingle damages detected via aerial surveillance',
        coordinates: { lat: 27.9506, lng: -82.4572 },
        severity: 'severe',
        estimatedValue: '$12,500',
        affectedArea: 'Residential Complex',
        detectedAt: '15 minutes ago',
        source: 'drone'
      },
      {
        id: 'opp_002',
        type: 'Road Debris',
        description: 'Tree blocking major highway - urgent clearance needed',
        coordinates: { lat: 33.7490, lng: -84.3880 },
        severity: 'critical',
        estimatedValue: '$3,200',
        affectedArea: 'I-75 Corridor',
        detectedAt: '8 minutes ago',
        source: 'camera'
      }
    ],
    stats: {
      totalCameras: 247,
      onlineCameras: 231,
      activeDrones: 8,
      totalOpportunities: 47,
      estimatedValue: '$284,500',
      coverageArea: '15,000 sq mi'
    }
  };

  const currentData = surveillanceData || mockData;

  const startVoiceGuide = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      console.warn('Speech synthesis not supported in this browser');
      return;
    }

    setIsVoiceGuideActive(true);
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(`
      Welcome to the Surveillance Center. This unified portal consolidates all your monitoring capabilities. 
      You can view traffic cameras, manage drone operations, monitor storm share cameras, and track contractor opportunities 
      all from one central location. Use the tabs to switch between different surveillance modes.
    `);
    
    utterance.rate = 0.9;
    utterance.onend = () => setIsVoiceGuideActive(false);
    utterance.onerror = () => setIsVoiceGuideActive(false);
    
    window.speechSynthesis.speak(utterance);
  };

  const stopVoiceGuide = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsVoiceGuideActive(false);
  };

  const filteredCameras = currentData.cameras.filter(camera => {
    const matchesSearch = camera.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         camera.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || camera.type === filterType;
    return matchesSearch && matchesType;
  });

  const getStatusBadge = (status: string) => {
    const colors = {
      online: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      offline: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      maintenance: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      active: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      returning: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
      emergency: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      ready: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    };
    return colors[status as keyof typeof colors] || colors.offline;
  };

  const getSeverityBadge = (severity: string) => {
    const colors = {
      critical: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      severe: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
      moderate: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      minor: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
    };
    return colors[severity as keyof typeof colors] || colors.minor;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6" data-testid="surveillance-center">
      {/* Header */}
      <FadeIn>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100" data-testid="heading-main">
              🎯 Surveillance Center
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Unified monitoring portal - Cameras • Drones • Eyes in Sky • Storm Share
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button
              onClick={isVoiceGuideActive ? stopVoiceGuide : startVoiceGuide}
              variant={isVoiceGuideActive ? "destructive" : "outline"}
              className="flex items-center space-x-2"
              data-testid="button-voice-guide"
            >
              {isVoiceGuideActive ? (
                <>
                  <VolumeX className="w-4 h-4" />
                  <span>Stop Guide</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4" />
                  <span>Voice Guide</span>
                </>
              )}
            </Button>

            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              className="flex items-center space-x-2"
              data-testid="button-refresh"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </Button>
          </div>
        </div>
      </FadeIn>

      {/* Stats Overview */}
      <FadeIn delay={0.1}>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Cameras</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100" data-testid="stat-total-cameras">
                    <CountUp end={currentData.stats.totalCameras} />
                  </p>
                </div>
                <Camera className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Online</p>
                  <p className="text-2xl font-bold text-green-600" data-testid="stat-online-cameras">
                    <CountUp end={currentData.stats.onlineCameras} />
                  </p>
                </div>
                <Signal className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Active Drones</p>
                  <p className="text-2xl font-bold text-purple-600" data-testid="stat-active-drones">
                    <CountUp end={currentData.stats.activeDrones} />
                  </p>
                </div>
                <Plane className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Opportunities</p>
                  <p className="text-2xl font-bold text-orange-600" data-testid="stat-opportunities">
                    <CountUp end={currentData.stats.totalOpportunities} />
                  </p>
                </div>
                <Target className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Est. Value</p>
                  <p className="text-2xl font-bold text-green-600" data-testid="stat-estimated-value">
                    {currentData.stats.estimatedValue}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Coverage</p>
                  <p className="text-2xl font-bold text-blue-600" data-testid="stat-coverage">
                    {currentData.stats.coverageArea}
                  </p>
                </div>
                <Shield className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      </FadeIn>

      {/* AI Assistant */}
      <FadeIn delay={0.2}>
        <UnifiedAssistant 
          portalType="surveillance"
          currentData={currentData}
          mode="voice"
          className="mb-6"
        />
      </FadeIn>

      {/* Main Content Tabs */}
      <FadeIn delay={0.3}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
            <TabsTrigger value="cameras" data-testid="tab-cameras">Cameras</TabsTrigger>
            <TabsTrigger value="drones" data-testid="tab-drones">Drones</TabsTrigger>
            <TabsTrigger value="opportunities" data-testid="tab-opportunities">Opportunities</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Live Camera Feeds */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Video className="w-5 h-5 mr-2" />
                    Live Camera Feeds
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {currentData.cameras.slice(0, 3).map((camera) => (
                      <div key={camera.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          <div>
                            <p className="font-medium">{camera.name}</p>
                            <p className="text-sm text-gray-600">{camera.location}</p>
                          </div>
                        </div>
                        <Badge className={getStatusBadge(camera.status)}>
                          {camera.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Active Drone Missions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Plane className="w-5 h-5 mr-2" />
                    Active Drone Missions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {currentData.drones.map((drone) => (
                      <div key={drone.id} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <Badge className={getStatusBadge(drone.status)}>
                              {drone.status}
                            </Badge>
                            <span className="font-medium">{drone.droneId}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Battery className="w-4 h-4" />
                            <span className="text-sm">{drone.battery}%</span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{drone.mission}</p>
                        <Progress value={drone.missionProgress} className="h-2" />
                        <p className="text-xs text-gray-500 mt-1">{drone.missionProgress}% complete</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Cameras Tab */}
          <TabsContent value="cameras" className="mt-6">
            <div className="space-y-4">
              {/* Search and Filters */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search cameras by name or location..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full"
                    data-testid="input-camera-search"
                  />
                </div>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-full sm:w-[200px]" data-testid="select-camera-filter">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="traffic">Traffic</SelectItem>
                    <SelectItem value="weather">Weather</SelectItem>
                    <SelectItem value="security">Security</SelectItem>
                    <SelectItem value="storm">Storm</SelectItem>
                    <SelectItem value="community">Community</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex space-x-2">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    data-testid="button-grid-view"
                  >
                    <Grid className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    data-testid="button-list-view"
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Camera Grid/List */}
              <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}>
                {filteredCameras.map((camera) => (
                  <Card key={camera.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{camera.name}</CardTitle>
                        <Badge className={getStatusBadge(camera.status)}>
                          {camera.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{camera.location}</p>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span>Last Update:</span>
                          <span className="text-gray-600">{camera.lastUpdate}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span>Incidents:</span>
                          <Badge variant="secondary">{camera.incidentCount}</Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span>Opportunities:</span>
                          <Badge variant="secondary">{camera.contractorOpportunities}</Badge>
                        </div>
                        <div className="flex space-x-2 pt-2">
                          <Button size="sm" className="flex-1" data-testid={`button-view-${camera.id}`}>
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                          <Button size="sm" variant="outline" data-testid={`button-record-${camera.id}`}>
                            <Video className="w-4 h-4 mr-1" />
                            Record
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Drones Tab */}
          <TabsContent value="drones" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {currentData.drones.map((drone) => (
                <Card key={drone.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center">
                        <Plane className="w-5 h-5 mr-2" />
                        {drone.droneId}
                      </CardTitle>
                      <Badge className={getStatusBadge(drone.status)}>
                        {drone.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">Pilot: {drone.pilot}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center space-x-2">
                          <Battery className="w-4 h-4" />
                          <span>Battery: {drone.battery}%</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Navigation className="w-4 h-4" />
                          <span>Alt: {drone.altitude}ft</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Wind className="w-4 h-4" />
                          <span>Speed: {drone.speed} mph</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4" />
                          <span>Flight: {drone.flightTime}m</span>
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium mb-1">Mission: {drone.mission}</p>
                        <Progress value={drone.missionProgress} className="h-2" />
                        <p className="text-xs text-gray-500 mt-1">{drone.missionProgress}% complete</p>
                      </div>

                      <div className="flex space-x-2">
                        <Button size="sm" className="flex-1" data-testid={`button-control-${drone.id}`}>
                          <Radio className="w-4 h-4 mr-1" />
                          Control
                        </Button>
                        <Button size="sm" variant="outline" data-testid={`button-video-${drone.id}`}>
                          {drone.videoFeedActive ? (
                            <>
                              <Pause className="w-4 h-4 mr-1" />
                              Stop Feed
                            </>
                          ) : (
                            <>
                              <Play className="w-4 h-4 mr-1" />
                              Start Feed
                            </>
                          )}
                        </Button>
                        <Button size="sm" variant="outline" data-testid={`button-home-${drone.id}`}>
                          <Home className="w-4 h-4 mr-1" />
                          RTH
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Opportunities Tab */}
          <TabsContent value="opportunities" className="mt-6">
            <div className="space-y-4">
              {currentData.opportunities.map((opportunity) => (
                <Card key={opportunity.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold">{opportunity.type}</h3>
                          <Badge className={getSeverityBadge(opportunity.severity)}>
                            {opportunity.severity}
                          </Badge>
                          <Badge variant="outline">
                            {opportunity.source}
                          </Badge>
                        </div>
                        <p className="text-gray-600 mb-3">{opportunity.description}</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Location:</span>
                            <p className="text-gray-600">{opportunity.affectedArea}</p>
                          </div>
                          <div>
                            <span className="font-medium">Est. Value:</span>
                            <p className="text-green-600 font-medium">{opportunity.estimatedValue}</p>
                          </div>
                          <div>
                            <span className="font-medium">Detected:</span>
                            <p className="text-gray-600">{opportunity.detectedAt}</p>
                          </div>
                          <div>
                            <span className="font-medium">Coordinates:</span>
                            <p className="text-gray-600 text-xs">
                              {opportunity.coordinates.lat.toFixed(4)}, {opportunity.coordinates.lng.toFixed(4)}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col space-y-2 ml-4">
                        <Button size="sm" data-testid={`button-view-opp-${opportunity.id}`}>
                          <MapPin className="w-4 h-4 mr-1" />
                          View Location
                        </Button>
                        <Button size="sm" variant="outline" data-testid={`button-claim-opp-${opportunity.id}`}>
                          <Target className="w-4 h-4 mr-1" />
                          Claim
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </FadeIn>
    </div>
  );
}