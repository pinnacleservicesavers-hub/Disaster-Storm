import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Plane, Plus, Search, Settings, MapPin, Zap, Activity, AlertTriangle, 
  PlayCircle, PauseCircle, Target, Battery, Signal, Wind, Thermometer,
  Clock, Users, Camera, Video, Shield, Navigation, Gauge, TrendingUp,
  Eye, Radio, Compass, Map, Layers, Filter, Grid, List, Maximize2,
  RefreshCw, Power, ChevronDown, ChevronUp, RotateCcw, Home, Volume2, VolumeX
} from 'lucide-react';
import { DashboardSection } from '@/components/DashboardSection';
import { FadeIn, PulseAlert, StaggerContainer, StaggerItem, HoverLift, CountUp, ScaleIn, SlideIn } from '@/components/ui/animations';
import { apiRequest } from '@/lib/queryClient';

interface LiveFlight {
  id: string;
  droneId: string;
  pilot: string;
  location: string;
  status: 'active' | 'returning' | 'emergency' | 'ready' | 'maintenance';
  battery: number;
  altitude: number;
  mission: string;
  speed: number;
  heading: number;
  temperature: number;
  windSpeed: number;
  signalStrength: number;
  flightTime: number;
  coordinates: { lat: number; lng: number };
  missionProgress: number;
  videoFeedActive: boolean;
  autoMode: boolean;
}

interface DroneStats {
  totalFlights: number;
  activeDrones: number;
  totalFlightHours: number;
  emergencyAlerts: number;
  maintenanceDue: number;
  averageMissionTime: number;
}

interface MissionPlan {
  id: string;
  name: string;
  type: 'inspection' | 'search_rescue' | 'survey' | 'patrol';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'planned' | 'active' | 'completed' | 'cancelled';
  assignedDrone?: string;
  estimatedDuration: number;
  createdAt: string;
  waypoints: Array<{ lat: number; lng: number; altitude: number; action: string }>;
  description: string;
}

export default function Drones() {
  const [activeTab, setActiveTab] = useState('operations');
  const [selectedDrone, setSelectedDrone] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [deploymentActive, setDeploymentActive] = useState(false);
  const [missionPlannerOpen, setMissionPlannerOpen] = useState(false);
  const [weatherOverlay, setWeatherOverlay] = useState(false);
  const [emergencyMode, setEmergencyMode] = useState(false);
  const [isVoiceGuideActive, setIsVoiceGuideActive] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  const queryClient = useQueryClient();

  // Initialize voice loading with enhanced cleanup
  useEffect(() => {
    const loadVoices = () => {
      if ('speechSynthesis' in window) {
        setVoices(window.speechSynthesis.getVoices());
      }
    };
    
    loadVoices();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
    
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  const startVoiceGuide = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      console.warn('Speech synthesis not supported in this browser');
      return;
    }

    if (!isVoiceGuideActive) {
      setIsVoiceGuideActive(true);
      window.speechSynthesis.cancel();
      
      const voiceContent = `Welcome to Drone Operations Command Center! This comprehensive flight management system controls your drone fleet for weather reconnaissance and damage assessment missions. The live flight dashboard shows all active drones with real-time telemetry including altitude, speed, battery level, and GPS coordinates. Flight status indicators show active, returning, emergency, ready, and maintenance states. Each drone displays mission progress, video feed status, and pilot assignments. The control interface includes flight time tracking, temperature monitoring, wind speed readings, and signal strength indicators. Mission planning features let you create inspection, search and rescue, survey, or patrol missions with waypoint mapping. Emergency alerts highlight any drones requiring immediate attention. Auto-mode indicators show which drones are operating autonomously versus manual control.`;
      
      const utterance = new SpeechSynthesisUtterance(voiceContent);
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      utterance.volume = 0.8;
      
      if (voices.length > 0) {
        utterance.voice = voices.find(voice => voice.lang.includes('en')) || voices[0];
      }
      
      utterance.onend = () => {
        setIsVoiceGuideActive(false);
      };
      
      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event);
        setIsVoiceGuideActive(false);
      };
      
      window.speechSynthesis.speak(utterance);
    } else {
      window.speechSynthesis.cancel();
      setIsVoiceGuideActive(false);
    }
  };

  // Real drone fleet data from API
  const { data: liveFlights = [] } = useQuery({
    queryKey: ['live-flights'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/drones');
        if (!response.ok) {
          throw new Error('Failed to fetch drones');
        }
        const data = await response.json();
        
        // Transform API data to match interface, fallback to mock if empty
        if (data.drones && data.drones.length > 0) {
          return data.drones.map((drone: any) => ({
            id: drone.id,
            droneId: drone.name || drone.droneId || `HAWK-${drone.id.slice(-2)}`,
            pilot: drone.operatorId || 'AI Pilot',
            location: `${drone.city || 'Unknown'}, ${drone.state || 'N/A'}`,
            status: drone.status || 'ready',
            battery: drone.batteryLevel || 100,
            altitude: 0,
            mission: drone.currentMission || 'Standby',
            speed: 0,
            heading: 0,
            temperature: 25,
            windSpeed: 0,
            signalStrength: 100,
            flightTime: 0,
            coordinates: { lat: 0, lng: 0 },
            missionProgress: 0,
            videoFeedActive: false,
            autoMode: false
          }));
        }
      } catch (error) {
        console.error('⚠️ Drone API failed, using fallback data:', error);
      }
      
      // Fallback mock data if API fails or returns empty
      return [
        { 
          id: '1', 
          droneId: 'STORM-HAWK-01', 
          pilot: 'Mike Chen', 
          location: 'Tampa Bay Sector 7', 
          status: 'active',
          battery: 87, 
          altitude: 120, 
          mission: 'Hurricane Damage Assessment',
          speed: 25.4,
          heading: 142,
          temperature: 28,
          windSpeed: 15,
          signalStrength: 95,
          flightTime: 127,
          coordinates: { lat: 27.9506, lng: -82.4572 },
          missionProgress: 65,
          videoFeedActive: true,
          autoMode: true
        },
        { 
          id: '2', 
          droneId: 'STORM-HAWK-02', 
          pilot: 'Sarah Johnson', 
          location: 'Orlando Metro Area', 
          status: 'returning',
          battery: 23, 
          altitude: 45, 
          mission: 'Property Insurance Survey',
          speed: 18.7,
          heading: 285,
          temperature: 31,
          windSpeed: 8,
          signalStrength: 82,
          flightTime: 189,
          coordinates: { lat: 28.5383, lng: -81.3792 },
          missionProgress: 90,
          videoFeedActive: false,
          autoMode: false
        },
        { 
          id: '3', 
          droneId: 'STORM-HAWK-03', 
          pilot: 'Alex Rivera', 
          location: 'Jacksonville Emergency Zone', 
          status: 'emergency',
          battery: 15, 
          altitude: 200, 
          mission: 'Emergency Search & Rescue',
          speed: 32.1,
          heading: 25,
          temperature: 29,
          windSpeed: 22,
          signalStrength: 67,
          flightTime: 245,
          coordinates: { lat: 30.3322, lng: -81.6557 },
          missionProgress: 45,
          videoFeedActive: true,
          autoMode: false
        },
        { 
          id: '4', 
          droneId: 'STORM-HAWK-04', 
          pilot: 'Emily Davis', 
          location: 'Miami Coastal Zone', 
          status: 'active',
          battery: 78, 
          altitude: 150, 
          mission: 'Storm Surge Documentation',
          speed: 21.3,
          heading: 95,
          temperature: 33,
          windSpeed: 18,
          signalStrength: 91,
          flightTime: 89,
          coordinates: { lat: 25.7617, lng: -80.1918 },
          missionProgress: 34,
          videoFeedActive: true,
          autoMode: true
        },
        { 
          id: '5', 
          droneId: 'STORM-HAWK-05', 
          pilot: 'James Wilson', 
          location: 'Fort Myers Base', 
          status: 'ready',
          battery: 100, 
          altitude: 0, 
          mission: 'Standby for Deployment',
          speed: 0,
          heading: 0,
          temperature: 26,
          windSpeed: 0,
          signalStrength: 100,
          flightTime: 0,
          coordinates: { lat: 26.6406, lng: -81.8723 },
          missionProgress: 0,
          videoFeedActive: false,
          autoMode: false
        },
      ];
    },
    refetchInterval: autoRefresh ? 2000 : false,
  });

  // Mock drone statistics
  const { data: droneStats } = useQuery<DroneStats>({
    queryKey: ['drone-stats'],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 200));
      return {
        totalFlights: 1847,
        activeDrones: liveFlights.filter(f => f.status === 'active').length,
        totalFlightHours: 12340,
        emergencyAlerts: liveFlights.filter(f => f.status === 'emergency').length,
        maintenanceDue: 3,
        averageMissionTime: 145
      };
    },
    refetchInterval: autoRefresh ? 5000 : false,
  });

  // Mock mission plans
  const { data: missionPlans = [] } = useQuery<MissionPlan[]>({
    queryKey: ['mission-plans'],
    queryFn: async () => {
      return [
        {
          id: '1',
          name: 'Hurricane Aftermath Survey',
          type: 'inspection',
          priority: 'critical',
          status: 'active',
          assignedDrone: 'STORM-HAWK-01',
          estimatedDuration: 180,
          createdAt: '2024-01-15T10:30:00Z',
          description: 'Comprehensive damage assessment of hurricane-affected areas',
          waypoints: [
            { lat: 27.9506, lng: -82.4572, altitude: 120, action: 'photograph' },
            { lat: 27.9601, lng: -82.4501, altitude: 110, action: 'video_survey' },
            { lat: 27.9450, lng: -82.4620, altitude: 100, action: 'thermal_scan' }
          ]
        },
        {
          id: '2',
          name: 'Coastal Erosion Monitoring',
          type: 'survey',
          priority: 'high',
          status: 'planned',
          estimatedDuration: 120,
          createdAt: '2024-01-15T09:15:00Z',
          description: 'Weekly coastal erosion documentation and measurement',
          waypoints: []
        },
        {
          id: '3',
          name: 'Emergency Response Route',
          type: 'search_rescue',
          priority: 'critical',
          status: 'active',
          assignedDrone: 'STORM-HAWK-03',
          estimatedDuration: 90,
          createdAt: '2024-01-15T11:45:00Z',
          description: 'Search and rescue mission for missing persons',
          waypoints: []
        }
      ];
    },
  });

  const handleDeployDrone = async () => {
    setDeploymentActive(true);
    // Simulate deployment process
    setTimeout(() => setDeploymentActive(false), 4000);
  };

  const handleEmergencyLand = async (droneId: string) => {
    console.log(`Emergency landing initiated for ${droneId}`);
    // In real app, would call emergency landing API
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 dark:text-green-400';
      case 'returning': return 'text-blue-600 dark:text-blue-400';
      case 'emergency': return 'text-red-600 dark:text-red-400';
      case 'ready': return 'text-gray-600 dark:text-gray-400';
      case 'maintenance': return 'text-amber-600 dark:text-amber-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return { text: 'ACTIVE', variant: 'default' as const };
      case 'returning': return { text: 'RETURNING', variant: 'secondary' as const };
      case 'emergency': return { text: 'EMERGENCY', variant: 'destructive' as const };
      case 'ready': return { text: 'READY', variant: 'outline' as const };
      case 'maintenance': return { text: 'MAINTENANCE', variant: 'secondary' as const };
      default: return { text: 'UNKNOWN', variant: 'outline' as const };
    }
  };

  const activeDronesCount = liveFlights.filter(f => f.status === 'active').length;
  const totalFlightTime = liveFlights.reduce((sum, flight) => sum + flight.flightTime, 0);
  const avgBatteryLevel = Math.round(liveFlights.reduce((sum, flight) => sum + flight.battery, 0) / liveFlights.length);

  return (
    <div className="space-y-6" data-testid="drones-page">
      {/* Enhanced Header Section */}
      <FadeIn>
        <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 dark:from-slate-800 dark:via-blue-800 dark:to-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          {/* Animated background elements */}
          <div className="absolute inset-0 opacity-10">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-white rounded-full"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ 
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0],
                  x: [0, Math.random() * 50 - 25],
                  y: [0, Math.random() * 50 - 25]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  delay: i * 0.2,
                  ease: "easeInOut"
                }}
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`
                }}
              />
            ))}
          </div>

          <div className="relative">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <ScaleIn>
                  <div className="relative">
                    <div className="p-3 bg-blue-500/20 rounded-xl">
                      <Plane className="h-8 w-8 text-blue-400" />
                    </div>
                    <motion.div
                      className="absolute -top-1 -right-1 h-4 w-4 bg-green-500 rounded-full"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  </div>
                </ScaleIn>
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2">
                    Drone Operations Center
                  </h1>
                  <p className="text-blue-200">
                    Advanced aerial intelligence and automated damage assessment
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Button
                  variant={autoRefresh ? "default" : "secondary"}
                  size="sm"
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  data-testid="button-auto-refresh"
                  className="bg-white/10 hover:bg-white/20 text-white border-white/20"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
                  Live Feed
                </Button>
                <Button
                  variant="default"
                  onClick={handleDeployDrone}
                  disabled={deploymentActive}
                  data-testid="button-deploy-drone"
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {deploymentActive ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="mr-2"
                      >
                        <Zap className="h-4 w-4" />
                      </motion.div>
                      Deploying...
                    </>
                  ) : (
                    <>
                      <Plane className="h-4 w-4 mr-2" />
                      Deploy Drone
                    </>
                  )}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setMissionPlannerOpen(true)}
                  data-testid="button-mission-planner"
                  className="bg-white/10 hover:bg-white/20 text-white border-white/20"
                >
                  <Target className="h-4 w-4 mr-2" />
                  Plan Mission
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={startVoiceGuide}
                  className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white border-white/20"
                  data-testid="button-voice-guide"
                  aria-label="Voice guide for Drone Operations"
                  aria-pressed={isVoiceGuideActive}
                >
                  {isVoiceGuideActive ? (
                    <>
                      <VolumeX className="h-4 w-4" />
                      Stop Guide
                    </>
                  ) : (
                    <>
                      <Volume2 className="h-4 w-4" />
                      Voice Guide
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* KPI Cards */}
            <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StaggerItem>
                <HoverLift>
                  <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                    <CardContent className="p-4 text-center">
                      <div className="flex items-center justify-center mb-2">
                        <Activity className="h-5 w-5 text-green-400 mr-2" />
                        <span className="text-sm font-medium text-white">Active Drones</span>
                      </div>
                      <div className="text-2xl font-bold text-white" data-testid="text-active-drones">
                        <CountUp end={activeDronesCount} duration={1} />
                      </div>
                      <div className="text-xs text-blue-200">of {liveFlights.length} total</div>
                    </CardContent>
                  </Card>
                </HoverLift>
              </StaggerItem>

              <StaggerItem>
                <HoverLift>
                  <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                    <CardContent className="p-4 text-center">
                      <div className="flex items-center justify-center mb-2">
                        <Clock className="h-5 w-5 text-blue-400 mr-2" />
                        <span className="text-sm font-medium text-white">Flight Hours</span>
                      </div>
                      <div className="text-2xl font-bold text-white" data-testid="text-flight-hours">
                        <CountUp end={droneStats?.totalFlightHours || 0} duration={1} />
                      </div>
                      <div className="text-xs text-blue-200">total operational</div>
                    </CardContent>
                  </Card>
                </HoverLift>
              </StaggerItem>

              <StaggerItem>
                <HoverLift>
                  <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                    <CardContent className="p-4 text-center">
                      <div className="flex items-center justify-center mb-2">
                        <Battery className="h-5 w-5 text-amber-400 mr-2" />
                        <span className="text-sm font-medium text-white">Avg Battery</span>
                      </div>
                      <div className="text-2xl font-bold text-white" data-testid="text-avg-battery">
                        <CountUp end={avgBatteryLevel} duration={1} suffix="%" />
                      </div>
                      <div className="text-xs text-blue-200">fleet average</div>
                    </CardContent>
                  </Card>
                </HoverLift>
              </StaggerItem>

              <StaggerItem>
                <HoverLift>
                  <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                    <CardContent className="p-4 text-center">
                      <div className="flex items-center justify-center mb-2">
                        <AlertTriangle className="h-5 w-5 text-red-400 mr-2" />
                        <span className="text-sm font-medium text-white">Alerts</span>
                      </div>
                      <div className="text-2xl font-bold text-white" data-testid="text-emergency-alerts">
                        <CountUp end={droneStats?.emergencyAlerts || 0} duration={1} />
                      </div>
                      <div className="text-xs text-blue-200">active alerts</div>
                    </CardContent>
                  </Card>
                </HoverLift>
              </StaggerItem>
            </StaggerContainer>
          </div>
        </div>
      </FadeIn>

      {/* Emergency Deployment Banner */}
      <AnimatePresence>
        {deploymentActive && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg p-4"
          >
            <div className="flex items-center space-x-3">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <Zap className="h-6 w-6 text-white" />
              </motion.div>
              <div className="flex-1">
                <h3 className="font-semibold text-white">Emergency Deployment in Progress</h3>
                <p className="text-green-100 text-sm">Coordinating with air traffic control and initializing flight systems...</p>
              </div>
              <div className="text-right">
                <div className="text-white font-medium">ETA: 2 min</div>
                <div className="text-green-100 text-xs">Auto-launch sequence</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList className="grid grid-cols-4 w-fit">
            <TabsTrigger value="operations" data-testid="tab-operations">Live Operations</TabsTrigger>
            <TabsTrigger value="missions" data-testid="tab-missions">Mission Control</TabsTrigger>
            <TabsTrigger value="analytics" data-testid="tab-analytics">Analytics</TabsTrigger>
            <TabsTrigger value="maintenance" data-testid="tab-maintenance">Fleet Status</TabsTrigger>
          </TabsList>

          <div className="flex items-center space-x-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
              data-testid="button-view-grid"
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
              data-testid="button-view-list"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Live Operations Tab */}
        <TabsContent value="operations" className="space-y-6">
          <FadeIn>
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* Live Flight Operations */}
              <div className="xl:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold flex items-center space-x-2">
                    <Radio className="h-5 w-5 text-green-500" />
                    <span>Live Flight Telemetry</span>
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="h-2 w-2 bg-green-500 rounded-full"
                    />
                  </h2>
                  <Badge variant="outline" className="text-xs">
                    Last update: {new Date().toLocaleTimeString()}
                  </Badge>
                </div>

                <StaggerContainer className="space-y-4">
                  {liveFlights.map((flight, index) => (
                    <StaggerItem key={flight.id}>
                      <HoverLift>
                        <Card className={`relative overflow-hidden ${flight.status === 'emergency' ? 'ring-2 ring-red-500' : ''}`}>
                          {flight.status === 'emergency' && (
                            <div className="absolute inset-0 bg-red-500/5 pointer-events-none" />
                          )}
                          
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className="relative">
                                  <motion.div
                                    animate={{ 
                                      rotate: flight.status === 'active' ? 360 : 0,
                                      scale: flight.status === 'emergency' ? [1, 1.1, 1] : 1
                                    }}
                                    transition={{ 
                                      rotate: { duration: 3, repeat: Infinity, ease: "linear" },
                                      scale: { duration: 1, repeat: Infinity }
                                    }}
                                  >
                                    <Plane className={`h-6 w-6 ${getStatusColor(flight.status)}`} />
                                  </motion.div>
                                  {flight.status === 'emergency' && (
                                    <PulseAlert intensity="strong">
                                      <AlertTriangle className="absolute -top-1 -right-1 h-3 w-3 text-red-500" />
                                    </PulseAlert>
                                  )}
                                </div>
                                <div>
                                  <CardTitle className="text-lg" data-testid={`flight-title-${flight.id}`}>
                                    {flight.droneId}
                                  </CardTitle>
                                  <div className="flex items-center space-x-2">
                                    <Badge variant={getStatusBadge(flight.status).variant}>
                                      {getStatusBadge(flight.status).text}
                                    </Badge>
                                    <span className="text-sm text-muted-foreground">{flight.pilot}</span>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                {flight.videoFeedActive && (
                                  <motion.div
                                    animate={{ opacity: [1, 0.5, 1] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                  >
                                    <Video className="h-4 w-4 text-red-500" />
                                  </motion.div>
                                )}
                                {flight.autoMode && (
                                  <Shield className="h-4 w-4 text-green-500" />
                                )}
                                <Button
                                  size="sm"
                                  variant={selectedDrone === flight.id ? "default" : "outline"}
                                  onClick={() => setSelectedDrone(selectedDrone === flight.id ? null : flight.id)}
                                  data-testid={`button-select-drone-${flight.id}`}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardHeader>
                          
                          <CardContent className="space-y-4">
                            <div className="text-sm text-muted-foreground mb-3">
                              {flight.location} • {flight.mission}
                            </div>
                            
                            {/* Telemetry Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div className="text-center">
                                <div className="flex items-center justify-center mb-1">
                                  <Battery className="h-4 w-4 text-muted-foreground mr-1" />
                                  <span className="text-xs text-muted-foreground">Battery</span>
                                </div>
                                <div className="flex items-center justify-center space-x-2">
                                  <Progress value={flight.battery} className="w-16 h-2" />
                                  <span className={`text-sm font-medium ${
                                    flight.battery < 20 ? 'text-red-600' : 
                                    flight.battery < 50 ? 'text-amber-600' : 
                                    'text-green-600'
                                  }`} data-testid={`battery-${flight.id}`}>
                                    {flight.battery}%
                                  </span>
                                </div>
                              </div>

                              <div className="text-center">
                                <div className="flex items-center justify-center mb-1">
                                  <Gauge className="h-4 w-4 text-muted-foreground mr-1" />
                                  <span className="text-xs text-muted-foreground">Altitude</span>
                                </div>
                                <div className="text-sm font-medium" data-testid={`altitude-${flight.id}`}>
                                  {flight.altitude}ft
                                </div>
                              </div>

                              <div className="text-center">
                                <div className="flex items-center justify-center mb-1">
                                  <Zap className="h-4 w-4 text-muted-foreground mr-1" />
                                  <span className="text-xs text-muted-foreground">Speed</span>
                                </div>
                                <div className="text-sm font-medium" data-testid={`speed-${flight.id}`}>
                                  {flight.speed} mph
                                </div>
                              </div>

                              <div className="text-center">
                                <div className="flex items-center justify-center mb-1">
                                  <Signal className="h-4 w-4 text-muted-foreground mr-1" />
                                  <span className="text-xs text-muted-foreground">Signal</span>
                                </div>
                                <div className="text-sm font-medium" data-testid={`signal-${flight.id}`}>
                                  {flight.signalStrength}%
                                </div>
                              </div>
                            </div>

                            {/* Mission Progress */}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span>Mission Progress</span>
                                <span>{flight.missionProgress}%</span>
                              </div>
                              <Progress value={flight.missionProgress} className="h-2" />
                            </div>

                            {/* Extended Telemetry for Selected Drone */}
                            <AnimatePresence>
                              {selectedDrone === flight.id && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="border-t pt-4 space-y-3"
                                >
                                  <div className="grid grid-cols-3 gap-4 text-sm">
                                    <div className="text-center">
                                      <div className="flex items-center justify-center mb-1">
                                        <Compass className="h-4 w-4 text-muted-foreground mr-1" />
                                        <span className="text-xs text-muted-foreground">Heading</span>
                                      </div>
                                      <div className="font-medium">{flight.heading}°</div>
                                    </div>
                                    <div className="text-center">
                                      <div className="flex items-center justify-center mb-1">
                                        <Wind className="h-4 w-4 text-muted-foreground mr-1" />
                                        <span className="text-xs text-muted-foreground">Wind</span>
                                      </div>
                                      <div className="font-medium">{flight.windSpeed} mph</div>
                                    </div>
                                    <div className="text-center">
                                      <div className="flex items-center justify-center mb-1">
                                        <Thermometer className="h-4 w-4 text-muted-foreground mr-1" />
                                        <span className="text-xs text-muted-foreground">Temp</span>
                                      </div>
                                      <div className="font-medium">{flight.temperature}°C</div>
                                    </div>
                                  </div>

                                  <div className="flex items-center justify-between text-sm">
                                    <span>Flight Time: {Math.floor(flight.flightTime / 60)}:{(flight.flightTime % 60).toString().padStart(2, '0')}</span>
                                    <span>Coords: {flight.coordinates.lat.toFixed(4)}, {flight.coordinates.lng.toFixed(4)}</span>
                                  </div>

                                  <div className="flex space-x-2">
                                    <Button size="sm" variant="outline" data-testid={`button-control-${flight.id}`}>
                                      {flight.status === 'active' ? <PauseCircle className="h-4 w-4 mr-2" /> : <PlayCircle className="h-4 w-4 mr-2" />}
                                      {flight.status === 'active' ? 'Pause' : 'Resume'}
                                    </Button>
                                    <Button size="sm" variant="outline" data-testid={`button-home-${flight.id}`}>
                                      <Home className="h-4 w-4 mr-2" />
                                      Return Home
                                    </Button>
                                    {flight.status === 'emergency' && (
                                      <Button 
                                        size="sm" 
                                        variant="destructive" 
                                        onClick={() => handleEmergencyLand(flight.id)}
                                        data-testid={`button-emergency-land-${flight.id}`}
                                      >
                                        <AlertTriangle className="h-4 w-4 mr-2" />
                                        Emergency Land
                                      </Button>
                                    )}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </CardContent>
                        </Card>
                      </HoverLift>
                    </StaggerItem>
                  ))}
                </StaggerContainer>
              </div>

              {/* Command Center Sidebar */}
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Map className="h-5 w-5 text-blue-500" />
                      <span>Mission Command</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button 
                      className="w-full" 
                      onClick={() => setMissionPlannerOpen(true)}
                      data-testid="button-open-mission-planner"
                    >
                      <Target className="h-4 w-4 mr-2" />
                      Plan New Mission
                    </Button>
                    
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Weather Overlay</h4>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant={weatherOverlay ? "default" : "outline"}
                          onClick={() => setWeatherOverlay(!weatherOverlay)}
                          data-testid="button-weather-overlay"
                        >
                          <Wind className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" data-testid="button-radar-overlay">
                          <Radio className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" data-testid="button-terrain-overlay">
                          <Layers className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Emergency Protocols</h4>
                      <Button 
                        size="sm" 
                        variant={emergencyMode ? "destructive" : "outline"} 
                        className="w-full"
                        onClick={() => setEmergencyMode(!emergencyMode)}
                        data-testid="button-emergency-mode"
                      >
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        {emergencyMode ? 'Exit Emergency Mode' : 'Enter Emergency Mode'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Active Missions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {missionPlans.filter(m => m.status === 'active').map(mission => (
                      <div key={mission.id} className="p-3 bg-muted rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-sm">{mission.name}</span>
                          <Badge variant={mission.priority === 'critical' ? 'destructive' : 'default'} className="text-xs">
                            {mission.priority}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Assigned: {mission.assignedDrone || 'Unassigned'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          ETA: {mission.estimatedDuration}min
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">System Status</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">GPS Satellites</span>
                      <span className="text-sm font-medium text-green-600">24/24</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Air Traffic Control</span>
                      <span className="text-sm font-medium text-green-600">Connected</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Weather Data</span>
                      <span className="text-sm font-medium text-green-600">Live</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Ground Station</span>
                      <span className="text-sm font-medium text-green-600">Online</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </FadeIn>
        </TabsContent>

        {/* Mission Control Tab */}
        <TabsContent value="missions" className="space-y-6">
          <FadeIn>
            <div className="text-center py-12">
              <Target className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Mission Planning & Control</h3>
              <p className="text-muted-foreground mb-6">Advanced mission planning system coming soon</p>
              <Button onClick={() => setMissionPlannerOpen(true)} data-testid="button-create-mission">
                <Plus className="h-4 w-4 mr-2" />
                Create Mission Plan
              </Button>
            </div>
          </FadeIn>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <FadeIn>
            <div className="text-center py-12">
              <TrendingUp className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Flight Analytics & Intelligence</h3>
              <p className="text-muted-foreground">Comprehensive flight data analysis and performance metrics</p>
            </div>
          </FadeIn>
        </TabsContent>

        {/* Maintenance Tab */}
        <TabsContent value="maintenance" className="space-y-6">
          <FadeIn>
            <div className="text-center py-12">
              <Settings className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Fleet Maintenance & Status</h3>
              <p className="text-muted-foreground">Monitor drone health, schedule maintenance, and track performance</p>
            </div>
          </FadeIn>
        </TabsContent>
      </Tabs>
    </div>
  );
}