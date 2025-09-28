import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Eye, 
  Camera, 
  Zap,
  MapPin,
  Plane,
  Activity,
  Clock,
  Globe,
  Target,
  Move,
  ArrowLeft,
  Volume2,
  VolumeX,
  RefreshCw,
  Play,
  Pause,
  Settings,
  Share2,
  Download,
  Ruler,
  AlertTriangle,
  Navigation,
  Waves,
  Thermometer,
  Video,
  Crosshair,
  RotateCcw,
  Save,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { 
  FadeIn, 
  SlideIn, 
  StaggerContainer, 
  StaggerItem, 
  HoverLift, 
  PulseAlert,
  CountUp
} from '@/components/ui/animations';

interface ARMarker {
  id: string;
  type: 'hazard' | 'cut_line' | 'safe_zone' | 'measurement';
  position: { x: number; y: number; z?: number };
  label: string;
  timestamp: Date;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

interface StormChaserFeed {
  id: string;
  name: string;
  location: string;
  youtubeId: string;
  isLive: boolean;
  viewers?: number;
}

interface TrafficCamera {
  id: string;
  name: string;
  location: string;
  state: 'FL' | 'GA' | 'AL';
  streamUrl: string;
  isActive: boolean;
}

interface XRayRealityData {
  radar: {
    lastUpdate: Date;
    layers: string[];
    refreshRate: number; // minutes
  };
  satellite: {
    lastUpdate: Date;
    goes16: string;
    goes17: string;
    refreshRate: number; // minutes
  };
  alerts: Array<{
    id: string;
    type: string;
    severity: 'minor' | 'moderate' | 'severe' | 'extreme';
    message: string;
    area: string;
    issued: Date;
    expires: Date;
  }>;
  ocean: {
    seaSurfaceTemp: number;
    waveHeight: number;
    lastUpdate: Date;
  };
  arMarkers: ARMarker[];
  activeDroneFeeds: number;
}

export default function XRayRealityPortal() {
  const [activeTab, setActiveTab] = useState('live-storm');
  const [selectedState, setSelectedState] = useState<'FL' | 'GA' | 'AL'>('FL');
  const [isARActive, setIsARActive] = useState(false);
  const [arMarkers, setArMarkers] = useState<ARMarker[]>([]);
  const [isVoiceGuideActive, setIsVoiceGuideActive] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Fetch X-Ray Reality data
  const { data: xrayData, isLoading, refetch } = useQuery({
    queryKey: ['xray-reality-data'],
    queryFn: async (): Promise<XRayRealityData> => {
      const response = await fetch('/api/xray-reality/data');
      if (!response.ok) {
        throw new Error('Failed to fetch X-Ray Reality data');
      }
      return response.json();
    },
    refetchInterval: autoRefresh ? 60000 : false, // 1 minute
    placeholderData: {
      radar: {
        lastUpdate: new Date(),
        layers: ['base', 'precipitation', 'velocity'],
        refreshRate: 2
      },
      satellite: {
        lastUpdate: new Date(),
        goes16: '/api/weather/goes16/latest',
        goes17: '/api/weather/goes17/latest',
        refreshRate: 5
      },
      alerts: [
        {
          id: 'alert-1',
          type: 'Tornado Warning',
          severity: 'extreme',
          message: 'Tornado Warning in effect for Miami-Dade County until 8:30 PM EST',
          area: 'Miami-Dade County, FL',
          issued: new Date(),
          expires: new Date(Date.now() + 3600000)
        }
      ],
      ocean: {
        seaSurfaceTemp: 28.5,
        waveHeight: 3.2,
        lastUpdate: new Date()
      },
      arMarkers: [
        {
          id: 'marker-1',
          type: 'hazard',
          position: { x: 100, y: 150 },
          label: 'Energized power line',
          timestamp: new Date(),
          priority: 'critical'
        }
      ],
      activeDroneFeeds: 2
    }
  });

  // Voice guide content based on specification
  const voiceGuideContent = {
    welcome: `Welcome to X-RAY REALITY, your advanced augmented reality storm operations module. This system provides live storm views with continuously refreshing radar and GOES satellite data on a 3D stage. You'll see traffic and DOT cameras, storm-chaser feeds, your drone feeds, and ocean views for coastal operations. The AR tools let you measure and mark hazards, draw cut lines, and create safe zones with voice guidance throughout.`,
    
    liveStorm: `The Live Storm View shows continuously refreshing radar with 1 to 5 minute updates and GOES satellite data with 5 to 10 minute refresh rates on a 3D stage for a live feel. Active NWS warnings scroll across the top. You can overlay ocean data including sea-surface temperature and wave heights for coastal operations.`,
    
    trafficCams: `Traffic Cams displays a 3 by 3 camera grid organized by state - Florida, Georgia, and Alabama - with one-click switching between states. These are live DOT camera feeds showing current road conditions and evacuation routes.`,
    
    stormChasers: `Storm Chasers shows embedded YouTube Live tiles from the best storm chasers currently broadcasting. These provide real-time ground truth of storm conditions from multiple locations.`,
    
    droneFeeds: `Drone Feeds displays your on-scene video through WebRTC and RTMP to HLS panels. These show live footage from your drone operations for immediate situational awareness.`,
    
    arMeasure: `AR Measure and Mark tools work on phones, computers, and headsets. Drop hazard markers for energized lines, split trunks, or blocked egress. Draw cut lines and safe zones. Measure diameters, spans, and distances visually in augmented reality. The system includes lead triage overlay that auto-labels critical jobs and reorders by urgency and proximity to your crew.`,
    
    replays: `Replays let you time scrub through the last 6 to 24 hours of radar and GOES data to show how storm cells moved across properties. This provides evidence capture and planning capabilities for your operations.`
  };

  const speakContent = (content: string) => {
    if (!isVoiceGuideActive || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(content);
    utterance.rate = 0.9;
    utterance.pitch = 1.1;
    utterance.volume = 0.8;
    
    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    }
  };

  const startVoiceGuide = () => {
    setIsVoiceGuideActive(true);
    speakContent(voiceGuideContent.welcome);
  };

  const addARMarker = (type: ARMarker['type'], label: string, priority: ARMarker['priority'] = 'medium') => {
    const newMarker: ARMarker = {
      id: `marker-${Date.now()}`,
      type,
      position: { x: Math.random() * 400, y: Math.random() * 300 },
      label,
      timestamp: new Date(),
      priority
    };
    setArMarkers(prev => [...prev, newMarker]);
  };

  const exportJobPacket = async () => {
    // Generate claim packet with photos, AR annotations, timestamps, GPS
    const jobData = {
      timestamp: new Date(),
      markers: arMarkers,
      alerts: xrayData?.alerts || [],
      location: 'Current GPS coordinates',
      summary: 'AR-enhanced damage assessment with measurements and hazard identification'
    };
    
    // In real implementation, this would generate PDF/ZIP
    console.log('Exporting job packet:', jobData);
  };

  const trafficCameras: TrafficCamera[] = [
    { id: 'fl-1', name: 'I-95 Miami', location: 'Miami, FL', state: 'FL', streamUrl: '/api/traffic/fl/cam1', isActive: true },
    { id: 'fl-2', name: 'I-75 Tampa', location: 'Tampa, FL', state: 'FL', streamUrl: '/api/traffic/fl/cam2', isActive: true },
    { id: 'fl-3', name: 'I-4 Orlando', location: 'Orlando, FL', state: 'FL', streamUrl: '/api/traffic/fl/cam3', isActive: true },
    { id: 'ga-1', name: 'I-75 Atlanta', location: 'Atlanta, GA', state: 'GA', streamUrl: '/api/traffic/ga/cam1', isActive: true },
    { id: 'ga-2', name: 'I-95 Savannah', location: 'Savannah, GA', state: 'GA', streamUrl: '/api/traffic/ga/cam2', isActive: true },
    { id: 'al-1', name: 'I-65 Birmingham', location: 'Birmingham, AL', state: 'AL', streamUrl: '/api/traffic/al/cam1', isActive: true }
  ];

  const stormChasers: StormChaserFeed[] = [
    { id: 'chaser-1', name: 'Storm Chaser Mike', location: 'Florida Panhandle', youtubeId: 'dQw4w9WgXcQ', isLive: true, viewers: 15420 },
    { id: 'chaser-2', name: 'Weather Hunter', location: 'Alabama', youtubeId: 'dQw4w9WgXcQ', isLive: true, viewers: 8930 },
    { id: 'chaser-3', name: 'Storm Central', location: 'Georgia', youtubeId: 'dQw4w9WgXcQ', isLive: true, viewers: 12750 }
  ];

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    }).format(date);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <FadeIn>
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Link href="/">
                  <Button variant="ghost" size="sm" className="gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Hub
                  </Button>
                </Link>
                <div className="flex items-center space-x-3">
                  <Eye className="h-8 w-8 text-purple-600" />
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">X-RAY REALITY</h1>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Augmented Reality Storm Operations</p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant={isVoiceGuideActive ? "default" : "outline"}
                  size="sm"
                  onClick={isVoiceGuideActive ? (isPlaying ? stopSpeaking : () => speakContent(voiceGuideContent[activeTab as keyof typeof voiceGuideContent] || voiceGuideContent.welcome)) : startVoiceGuide}
                  className="gap-2"
                >
                  {isPlaying ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  {isPlaying ? 'Stop Guide' : 'Voice Guide'}
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetch()}
                  disabled={isLoading}
                  className="gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Live AR</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </FadeIn>

      {/* Alerts Ticker */}
      <div className="bg-red-600 text-white py-2 overflow-hidden">
        <div className="animate-marquee whitespace-nowrap">
          {xrayData?.alerts.map((alert, index) => (
            <span key={alert.id} className="mx-8">
              🚨 {alert.type}: {alert.message} (Expires: {formatTime(alert.expires)})
            </span>
          )) || <span className="mx-8">🚨 No active alerts</span>}
        </div>
      </div>

      {/* Status Cards */}
      <div className="container mx-auto px-6 py-6">
        <StaggerContainer>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StaggerItem>
              <HoverLift>
                <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-blue-200 dark:border-blue-800">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Radar Update</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {formatTime(xrayData?.radar.lastUpdate || new Date())}
                        </p>
                        <p className="text-xs text-gray-500">{xrayData?.radar.refreshRate}min refresh</p>
                      </div>
                      <Activity className="h-8 w-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>
              </HoverLift>
            </StaggerItem>

            <StaggerItem>
              <HoverLift>
                <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-green-200 dark:border-green-800">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-green-600 dark:text-green-400">Active Alerts</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          <CountUp end={xrayData?.alerts.length || 0} />
                        </p>
                        <p className="text-xs text-gray-500">NWS warnings</p>
                      </div>
                      <AlertTriangle className="h-8 w-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>
              </HoverLift>
            </StaggerItem>

            <StaggerItem>
              <HoverLift>
                <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-purple-200 dark:border-purple-800">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-purple-600 dark:text-purple-400">AR Markers</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          <CountUp end={arMarkers.length} />
                        </p>
                        <p className="text-xs text-gray-500">Placed markers</p>
                      </div>
                      <Target className="h-8 w-8 text-purple-500" />
                    </div>
                  </CardContent>
                </Card>
              </HoverLift>
            </StaggerItem>

            <StaggerItem>
              <HoverLift>
                <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-orange-200 dark:border-orange-800">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-orange-600 dark:text-orange-400">Drone Feeds</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          <CountUp end={xrayData?.activeDroneFeeds || 0} />
                        </p>
                        <p className="text-xs text-gray-500">Live streams</p>
                      </div>
                      <Plane className="h-8 w-8 text-orange-500" />
                    </div>
                  </CardContent>
                </Card>
              </HoverLift>
            </StaggerItem>
          </div>
        </StaggerContainer>

        {/* Main Tabs */}
        <FadeIn delay={0.2}>
          <Tabs value={activeTab} onValueChange={(tab) => {
            setActiveTab(tab);
            if (isVoiceGuideActive) {
              speakContent(voiceGuideContent[tab as keyof typeof voiceGuideContent] || '');
            }
          }} className="space-y-6">
            <TabsList className="grid w-full grid-cols-7">
              <TabsTrigger value="live-storm" className="gap-2">
                <Zap className="h-4 w-4" />
                Live Storm
              </TabsTrigger>
              <TabsTrigger value="traffic-cams" className="gap-2">
                <Camera className="h-4 w-4" />
                Traffic Cams
              </TabsTrigger>
              <TabsTrigger value="storm-chasers" className="gap-2">
                <Video className="h-4 w-4" />
                Chasers
              </TabsTrigger>
              <TabsTrigger value="drone-feeds" className="gap-2">
                <Plane className="h-4 w-4" />
                Drones
              </TabsTrigger>
              <TabsTrigger value="ocean-view" className="gap-2">
                <Waves className="h-4 w-4" />
                Ocean
              </TabsTrigger>
              <TabsTrigger value="ar-measure" className="gap-2">
                <Ruler className="h-4 w-4" />
                AR Tools
              </TabsTrigger>
              <TabsTrigger value="replays" className="gap-2">
                <RotateCcw className="h-4 w-4" />
                Replays
              </TabsTrigger>
            </TabsList>

            {/* Live Storm View */}
            <TabsContent value="live-storm" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5 text-blue-500" />
                      Live Radar + GOES Satellite
                    </CardTitle>
                    <CardDescription>Continuously refreshing 3D storm view</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="aspect-video bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <Activity className="h-12 w-12 text-blue-400 mx-auto mb-2 animate-pulse" />
                        <p className="text-sm text-gray-500">Live 3D radar + satellite view</p>
                        <p className="text-xs text-gray-400 mt-1">Updates every {xrayData?.radar.refreshRate || 2} minutes</p>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex space-x-2">
                        <Badge variant="secondary">Radar</Badge>
                        <Badge variant="secondary">GOES-16</Badge>
                        <Badge variant="secondary">GOES-17</Badge>
                      </div>
                      <span className="text-xs text-gray-500">Last: {formatTime(xrayData?.radar.lastUpdate || new Date())}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-purple-500" />
                      Quick AR Actions
                    </CardTitle>
                    <CardDescription>Immediate hazard marking and measurement</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3">
                      <Button 
                        onClick={() => addARMarker('hazard', 'Energized line', 'critical')}
                        className="bg-red-500 hover:bg-red-600 text-white"
                      >
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        Mark Hazard
                      </Button>
                      <Button 
                        onClick={() => addARMarker('cut_line', 'Safe cut zone')}
                        className="bg-green-500 hover:bg-green-600 text-white"
                      >
                        <Ruler className="h-4 w-4 mr-2" />
                        Draw Cut Line
                      </Button>
                      <Button 
                        onClick={() => addARMarker('safe_zone', 'Safe area')}
                        className="bg-blue-500 hover:bg-blue-600 text-white"
                      >
                        <MapPin className="h-4 w-4 mr-2" />
                        Safe Zone
                      </Button>
                      <Button 
                        onClick={() => addARMarker('measurement', 'Distance measurement')}
                        className="bg-purple-500 hover:bg-purple-600 text-white"
                      >
                        <Move className="h-4 w-4 mr-2" />
                        Measure
                      </Button>
                    </div>
                    <div className="mt-4 space-y-2">
                      {arMarkers.slice(-3).map((marker) => (
                        <div key={marker.id} className="flex items-center justify-between text-sm p-2 bg-gray-50 dark:bg-gray-700 rounded">
                          <span>{marker.label}</span>
                          <Badge variant={marker.priority === 'critical' ? 'destructive' : 'secondary'}>
                            {marker.priority}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Traffic Cams */}
            <TabsContent value="traffic-cams" className="space-y-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex space-x-2">
                  {(['FL', 'GA', 'AL'] as const).map((state) => (
                    <Button
                      key={state}
                      variant={selectedState === state ? 'default' : 'outline'}
                      onClick={() => setSelectedState(state)}
                      className="gap-2"
                    >
                      <Camera className="h-4 w-4" />
                      {state}
                    </Button>
                  ))}
                </div>
                <Badge variant="secondary">3×3 Camera Grid</Badge>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                {trafficCameras
                  .filter(cam => cam.state === selectedState)
                  .slice(0, 9)
                  .map((camera) => (
                    <Card key={camera.id} className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">{camera.name}</CardTitle>
                        <CardDescription className="text-xs">{camera.location}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="aspect-video bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center">
                          {camera.isActive ? (
                            <div className="text-center">
                              <Camera className="h-8 w-8 text-green-400 mx-auto mb-1" />
                              <p className="text-xs text-gray-500">Live DOT Camera</p>
                            </div>
                          ) : (
                            <div className="text-center">
                              <Camera className="h-8 w-8 text-gray-400 mx-auto mb-1" />
                              <p className="text-xs text-gray-500">Camera Offline</p>
                            </div>
                          )}
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                          <Badge variant={camera.isActive ? 'default' : 'secondary'}>
                            {camera.isActive ? 'Live' : 'Offline'}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </TabsContent>

            {/* Storm Chasers */}
            <TabsContent value="storm-chasers" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {stormChasers.map((chaser) => (
                  <Card key={chaser.id} className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Video className="h-5 w-5 text-red-500" />
                        {chaser.name}
                      </CardTitle>
                      <CardDescription>{chaser.location}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="aspect-video bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                        <div className="text-center">
                          <Video className="h-12 w-12 text-red-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-500">YouTube Live Stream</p>
                          {chaser.isLive && (
                            <div className="flex items-center justify-center mt-2">
                              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-2"></div>
                              <span className="text-xs text-red-500">LIVE</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="mt-4 flex items-center justify-between">
                        <Badge variant={chaser.isLive ? 'destructive' : 'secondary'}>
                          {chaser.isLive ? 'Live' : 'Offline'}
                        </Badge>
                        {chaser.viewers && (
                          <span className="text-xs text-gray-500">{chaser.viewers.toLocaleString()} viewers</span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Drone Feeds */}
            <TabsContent value="drone-feeds" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Plane className="h-5 w-5 text-blue-500" />
                      Drone Feed 1 - WebRTC
                    </CardTitle>
                    <CardDescription>Live on-scene footage</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="aspect-video bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <Plane className="h-12 w-12 text-blue-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">Live drone stream</p>
                        <div className="flex items-center justify-center mt-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
                          <span className="text-xs text-green-500">STREAMING</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Plane className="h-5 w-5 text-purple-500" />
                      Drone Feed 2 - HLS
                    </CardTitle>
                    <CardDescription>Secondary aerial view</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="aspect-video bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <Plane className="h-12 w-12 text-purple-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">HLS drone stream</p>
                        <div className="flex items-center justify-center mt-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
                          <span className="text-xs text-green-500">STREAMING</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Ocean View */}
            <TabsContent value="ocean-view" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Thermometer className="h-5 w-5 text-orange-500" />
                      Sea Surface Temperature
                    </CardTitle>
                    <CardDescription>Current ocean temperature data</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <div className="text-4xl font-bold text-orange-600 mb-2">
                        {xrayData?.ocean.seaSurfaceTemp || 28.5}°C
                      </div>
                      <div className="text-lg text-gray-600">
                        {((xrayData?.ocean.seaSurfaceTemp || 28.5) * 9/5 + 32).toFixed(1)}°F
                      </div>
                      <p className="text-sm text-gray-500 mt-2">
                        Last updated: {formatTime(xrayData?.ocean.lastUpdate || new Date())}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Waves className="h-5 w-5 text-blue-500" />
                      Wave Height
                    </CardTitle>
                    <CardDescription>Current wave conditions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <div className="text-4xl font-bold text-blue-600 mb-2">
                        {xrayData?.ocean.waveHeight || 3.2}m
                      </div>
                      <div className="text-lg text-gray-600">
                        {((xrayData?.ocean.waveHeight || 3.2) * 3.28084).toFixed(1)}ft
                      </div>
                      <p className="text-sm text-gray-500 mt-2">
                        Significant wave height
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* AR Measure & Mark */}
            <TabsContent value="ar-measure" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Ruler className="h-5 w-5 text-purple-500" />
                      AR Tools & Markers
                    </CardTitle>
                    <CardDescription>Augmented reality measurement and marking tools</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <Button 
                        onClick={() => addARMarker('hazard', 'Split trunk hazard', 'high')}
                        className="w-full bg-red-500 hover:bg-red-600 text-white"
                      >
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        Drop Hazard Marker
                      </Button>
                      <Button 
                        onClick={() => addARMarker('cut_line', 'Recommended cut line')}
                        className="w-full bg-green-500 hover:bg-green-600 text-white"
                      >
                        <Ruler className="h-4 w-4 mr-2" />
                        Draw Cut Line
                      </Button>
                      <Button 
                        onClick={() => addARMarker('safe_zone', 'Crew safe zone')}
                        className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                      >
                        <MapPin className="h-4 w-4 mr-2" />
                        Mark Safe Zone
                      </Button>
                      <Button 
                        onClick={() => addARMarker('measurement', 'Trunk diameter')}
                        className="w-full bg-purple-500 hover:bg-purple-600 text-white"
                      >
                        <Move className="h-4 w-4 mr-2" />
                        AR Measure
                      </Button>
                    </div>
                    
                    <div className="mt-6">
                      <Button onClick={exportJobPacket} className="w-full gap-2">
                        <Download className="h-4 w-4" />
                        Export Job Packet
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle>Active AR Markers</CardTitle>
                    <CardDescription>Current markers and measurements</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 max-h-80 overflow-y-auto">
                      {arMarkers.map((marker) => (
                        <div key={marker.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <div className="flex items-center space-x-3">
                            {marker.type === 'hazard' && <AlertTriangle className="h-4 w-4 text-red-500" />}
                            {marker.type === 'cut_line' && <Ruler className="h-4 w-4 text-green-500" />}
                            {marker.type === 'safe_zone' && <MapPin className="h-4 w-4 text-blue-500" />}
                            {marker.type === 'measurement' && <Move className="h-4 w-4 text-purple-500" />}
                            <div>
                              <p className="text-sm font-medium">{marker.label}</p>
                              <p className="text-xs text-gray-500">{formatTime(marker.timestamp)}</p>
                            </div>
                          </div>
                          <Badge variant={marker.priority === 'critical' ? 'destructive' : 'secondary'}>
                            {marker.priority}
                          </Badge>
                        </div>
                      ))}
                      {arMarkers.length === 0 && (
                        <div className="text-center py-8">
                          <Target className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-500">No AR markers placed</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Replays */}
            <TabsContent value="replays" className="space-y-6">
              <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <RotateCcw className="h-5 w-5 text-blue-500" />
                    Time Scrub - Last 24 Hours
                  </CardTitle>
                  <CardDescription>Review how storm cells moved across properties</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="aspect-video bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <RotateCcw className="h-12 w-12 text-blue-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">Radar & GOES time scrub player</p>
                        <p className="text-xs text-gray-400 mt-1">6-24 hour storm history</p>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Timeline Control</span>
                        <span className="text-xs text-gray-500">24 hours ago → Now</span>
                      </div>
                      <Progress value={75} className="w-full" />
                      <div className="flex items-center justify-center space-x-4">
                        <Button variant="outline" size="sm">
                          <RotateCcw className="h-4 w-4 mr-2" />
                          Reset
                        </Button>
                        <Button variant="outline" size="sm">
                          <Play className="h-4 w-4 mr-2" />
                          Play
                        </Button>
                        <Button variant="outline" size="sm">
                          <Pause className="h-4 w-4 mr-2" />
                          Pause
                        </Button>
                        <Button variant="outline" size="sm">
                          <Save className="h-4 w-4 mr-2" />
                          Capture
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </FadeIn>
      </div>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
      `}</style>
    </div>
  );
}