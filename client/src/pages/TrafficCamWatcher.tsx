import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { 
  Car, 
  Camera, 
  MapPin, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  ArrowLeft,
  Activity,
  Eye,
  Navigation,
  Route,
  Shield,
  Zap,
  Loader2,
  Volume2,
  VolumeX
} from 'lucide-react';
import { Link } from 'wouter';
import { FadeIn, SlideIn, StaggerContainer, StaggerItem } from '@/components/ui/animations';

// Back button component
function BackButton() {
  return (
    <Link href="/">
      <motion.button
        whileHover={{ scale: 1.05, x: -2 }}
        whileTap={{ scale: 0.95 }}
        className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-lg hover:bg-white/20 transition-all duration-200"
        data-testid="button-back-to-hub"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm font-medium">Back to Hub</span>
      </motion.button>
    </Link>
  );
}

// API Response interface
interface ApiTrafficCamera {
  id: string;
  name: string;
  lat: number;
  lng: number;
  state: string;
  city: string;
  imageUrl: string;
  source: string;
  lastUpdated: string;
  isActive: boolean;
  description: string;
}

interface TrafficCamerasResponse {
  cameras: ApiTrafficCamera[];
  count: number;
  timestamp: string;
}

// UI Display interface
interface TrafficCamera {
  id: string;
  name: string;
  location: string;
  status: 'online' | 'offline' | 'maintenance';
  coordinates: { lat: number; lng: number };
  lastUpdate: string;
  trafficFlow: 'light' | 'moderate' | 'heavy' | 'blocked';
  weatherConditions: string;
  emergencyRoute: boolean;
  alerts: string[];
  imageUrl?: string;
  state: string;
  city: string;
}

interface EvacuationRoute {
  id: string;
  name: string;
  origin: string;
  destination: string;
  status: 'open' | 'congested' | 'blocked';
  estimatedTime: number;
  capacity: number;
  currentLoad: number;
  alternativeRoutes: number;
}

export default function TrafficCamWatcher() {
  const [selectedCamera, setSelectedCamera] = useState<TrafficCamera | null>(null);
  const [viewMode, setViewMode] = useState<'cameras' | 'routes'>('cameras');
  const [isVoiceGuideActive, setIsVoiceGuideActive] = useState(false);
  const [selectedState, setSelectedState] = useState<string>('all');
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [aiAnalysisLoading, setAiAnalysisLoading] = useState(false);
  const [aiInsights, setAiInsights] = useState<string>('');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const sessionTokenRef = useRef<number>(0);
  const aiAbortControllerRef = useRef<AbortController | null>(null);
  const aiSessionTokenRef = useRef<number>(0);

  // Fetch traffic cameras from API
  const { data: camerasResponse, isLoading: camerasLoading } = useQuery<TrafficCamerasResponse>({
    queryKey: ['/api/traffic-cameras'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Transform API response to UI format
  const allCameras: TrafficCamera[] = camerasResponse?.cameras.map(cam => ({
    id: cam.id,
    name: cam.name,
    location: `${cam.city}, ${cam.state}`,
    status: cam.isActive ? 'online' : 'offline',
    coordinates: { lat: cam.lat, lng: cam.lng },
    lastUpdate: cam.lastUpdated,
    trafficFlow: 'moderate', // Default value - real API would provide this
    weatherConditions: 'Clear', // Default value - real API would provide this
    emergencyRoute: false, // Default value - real API would provide this
    alerts: [], // Default value - real API would provide this
    imageUrl: cam.imageUrl,
    state: cam.state,
    city: cam.city
  })) || [];
  
  // Get unique states and cities
  const states = ['all', ...Array.from(new Set(camerasResponse?.cameras.map(c => c.state) || []))];
  const cities = selectedState === 'all' 
    ? ['all', ...Array.from(new Set(camerasResponse?.cameras.map(c => c.city) || []))]
    : ['all', ...Array.from(new Set(camerasResponse?.cameras.filter(c => c.state === selectedState).map(c => c.city) || []))];
  
  // Filter cameras based on state and city
  const cameras = allCameras.filter(cam => {
    const stateMatch = selectedState === 'all' || cam.state === selectedState;
    const cityMatch = selectedCity === 'all' || cam.city === selectedCity;
    return stateMatch && cityMatch;
  });
  
  const onlineCameras = cameras.filter(cam => cam.status === 'online').length;

  // Mock evacuation routes (no API endpoint yet)
  const mockEvacuationRoutes: EvacuationRoute[] = [
    {
      id: '1',
      name: 'Central Florida Evacuation Corridor',
      origin: 'Miami-Dade',
      destination: 'Orlando',
      status: 'congested',
      estimatedTime: 240,
      capacity: 10000,
      currentLoad: 7500,
      alternativeRoutes: 3
    },
    {
      id: '2',
      name: 'Northern Evacuation Route',
      origin: 'Broward County',
      destination: 'Georgia Border',
      status: 'open',
      estimatedTime: 360,
      capacity: 15000,
      currentLoad: 4200,
      alternativeRoutes: 2
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': case 'open': return 'bg-green-500';
      case 'congested': case 'moderate': return 'bg-yellow-500';
      case 'offline': case 'blocked': case 'maintenance': return 'bg-red-500';
      case 'heavy': return 'bg-orange-500';
      case 'light': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getFlowIcon = (flow: string) => {
    switch (flow) {
      case 'light': return <CheckCircle className="w-4 h-4" />;
      case 'moderate': return <Clock className="w-4 h-4" />;
      case 'heavy': return <AlertTriangle className="w-4 h-4" />;
      case 'blocked': return <Shield className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // AI Traffic Analysis
  const analyzeTrafficWithAI = async () => {
    // Abort any in-flight AI request
    if (aiAbortControllerRef.current) {
      aiAbortControllerRef.current.abort();
    }
    
    // Create new session with unique token
    aiSessionTokenRef.current += 1;
    const currentToken = aiSessionTokenRef.current;
    
    // Create new abort controller
    const abortController = new AbortController();
    aiAbortControllerRef.current = abortController;
    
    setAiAnalysisLoading(true);
    
    try {
      const trafficData = {
        totalCameras: cameras.length,
        onlineCameras,
        states: selectedState === 'all' ? 'all regions' : selectedState,
        cities: selectedCity === 'all' ? 'all cities' : selectedCity,
        trafficConditions: cameras.map(c => ({
          location: c.location,
          flow: c.trafficFlow,
          weather: c.weatherConditions,
          alerts: c.alerts
        }))
      };

      const prompt = `As a traffic intelligence AI, analyze the following real-time traffic camera data and provide actionable insights for contractors and emergency responders:

Traffic Overview:
- Total Cameras: ${trafficData.totalCameras}
- Online Cameras: ${trafficData.onlineCameras}
- Monitoring: ${trafficData.states} ${trafficData.cities !== 'all cities' ? '- ' + trafficData.cities : ''}

Current Conditions:
${trafficData.trafficConditions.slice(0, 10).map(c => `- ${c.location}: ${c.flow} traffic, ${c.weather}`).join('\n')}

Provide:
1. Overall traffic assessment (2-3 sentences)
2. Areas of concern or congestion
3. Recommended evacuation routes if needed
4. Weather impact analysis
5. Contractor deployment suggestions

Keep it concise and actionable.`;

      const response = await fetch('/api/grok/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: prompt,
          conversationHistory: []
        }),
        signal: abortController.signal
      });

      // Check if this session is still active
      if (currentToken !== aiSessionTokenRef.current) {
        return;
      }

      if (!response.ok) throw new Error('AI analysis failed');
      
      const data = await response.json();
      
      // Check again before updating state
      if (currentToken === aiSessionTokenRef.current) {
        setAiInsights(data.reply || 'Analysis complete. All systems operational.');
      }
    } catch (error: any) {
      // Only update state if this is still the active session
      if (currentToken === aiSessionTokenRef.current) {
        if (error.name !== 'AbortError') {
          console.error('AI analysis error:', error);
          setAiInsights('Unable to generate AI analysis at this time. Traffic monitoring continues normally.');
        }
      }
    } finally {
      // Only update loading state if this is still the active session
      if (currentToken === aiSessionTokenRef.current) {
        setAiAnalysisLoading(false);
        aiAbortControllerRef.current = null;
      }
    }
  };

  // Auto-analyze when filters change or cameras update
  useEffect(() => {
    if (cameras.length > 0) {
      analyzeTrafficWithAI();
    } else {
      // Clear insights when no cameras match filters
      setAiInsights('');
      setAiAnalysisLoading(false);
      // Abort any in-flight request
      if (aiAbortControllerRef.current) {
        aiAbortControllerRef.current.abort();
        aiAbortControllerRef.current = null;
      }
    }
  }, [selectedState, selectedCity, camerasResponse]);

  // Voice Guide - Rachel (ElevenLabs)
  const startVoiceGuide = async () => {
    if (!isVoiceGuideActive) {
      setIsVoiceGuideActive(true);
      
      // Stop any existing audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      
      // Abort any in-flight request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      // Create new session with unique token
      sessionTokenRef.current += 1;
      const currentToken = sessionTokenRef.current;
      
      // Create new abort controller for this request
      const abortController = new AbortController();
      abortControllerRef.current = abortController;
      
      const voiceContent = `Welcome to Traffic Cam Watcher! This real-time monitoring system provides live traffic camera feeds and evacuation route intelligence. You can view traffic cameras from multiple states and cities, monitor road conditions during storm events, and track emergency evacuation routes. The main dashboard displays online cameras with status indicators, traffic flow levels from light to blocked, and weather conditions at each location. Use the state and city filters to focus on specific regions. Switch between camera view and evacuation routes view using the tabs. Each camera shows live status, traffic flow, and any active alerts. For evacuation routes, you'll see real-time capacity usage, estimated travel times, and alternative route options. All data refreshes automatically to keep you informed during critical situations.`;
      
      try {
        // Call Rachel voice API (ElevenLabs)
        const response = await fetch('/api/voice-ai/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: voiceContent }),
          signal: abortController.signal,
        });

        if (!response.ok) {
          throw new Error('Voice generation failed');
        }

        const data = await response.json();
        
        // Check if this session is still active
        if (currentToken !== sessionTokenRef.current) {
          return;
        }
        
        if (data.audioBase64) {
          // Create and play audio
          const audio = new Audio(`data:audio/mpeg;base64,${data.audioBase64}`);
          audioRef.current = audio;
          
          audio.onended = () => {
            // Only update state if this is still the active session
            if (currentToken === sessionTokenRef.current) {
              setIsVoiceGuideActive(false);
              audioRef.current = null;
              abortControllerRef.current = null;
            }
          };
          
          audio.onerror = () => {
            // Only update state if this is still the active session
            if (currentToken === sessionTokenRef.current) {
              console.error('Audio playback error');
              setIsVoiceGuideActive(false);
              audioRef.current = null;
              abortControllerRef.current = null;
            }
          };
          
          await audio.play();
        } else {
          // Only update state if this is still the active session
          if (currentToken === sessionTokenRef.current) {
            setIsVoiceGuideActive(false);
            abortControllerRef.current = null;
          }
        }
      } catch (error: any) {
        // Only update state if this is still the active session
        if (currentToken === sessionTokenRef.current) {
          // Don't log error if request was aborted (expected behavior)
          if (error.name !== 'AbortError') {
            console.error('Rachel voice error:', error);
          }
          setIsVoiceGuideActive(false);
          abortControllerRef.current = null;
        }
      }
    } else {
      // Stop playing - invalidate current session
      sessionTokenRef.current += 1;
      
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setIsVoiceGuideActive(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-900 via-red-900 to-pink-900">
      <FadeIn>
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <BackButton />
              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={startVoiceGuide}
                  data-testid="button-voice-guide"
                  className={`${
                    isVoiceGuideActive 
                      ? 'bg-orange-100 hover:bg-orange-200 border-orange-300 text-orange-800' 
                      : 'bg-white/10 hover:bg-white/20 border-white/30 text-white'
                  } transition-all duration-300`}
                >
                  {isVoiceGuideActive ? (
                    <VolumeX className="w-4 h-4 mr-2" />
                  ) : (
                    <Volume2 className="w-4 h-4 mr-2" />
                  )}
                  {isVoiceGuideActive ? 'Stop Guide' : 'Voice Guide'}
                </Button>
                <Badge className="bg-white/20 text-white border-white/30">
                  <Eye className="w-3 h-3 mr-1" />
                  Live Monitoring
                </Badge>
                <Badge className="bg-green-500/20 text-green-100 border-green-300/30">
                  <Camera className="w-3 h-3 mr-1" />
                  {onlineCameras} Cameras Online
                </Badge>
              </div>
            </div>
            <motion.h1 
              className="text-4xl font-bold mb-2"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              Traffic Cam Watcher
            </motion.h1>
            <motion.p 
              className="text-xl text-orange-100"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              Road conditions & evacuation routes
            </motion.p>
            
            {/* State and City Filters */}
            <div className="flex items-center gap-4 mt-4">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-orange-200" />
                <select
                  value={selectedState}
                  onChange={(e) => {
                    setSelectedState(e.target.value);
                    setSelectedCity('all');
                  }}
                  className="bg-white/10 backdrop-blur-sm border border-white/30 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                  data-testid="select-state"
                >
                  <option value="all" className="bg-gray-800">All States</option>
                  {states.filter(s => s !== 'all').map(state => (
                    <option key={state} value={state} className="bg-gray-800">{state}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-center gap-2">
                <Navigation className="w-4 h-4 text-orange-200" />
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="bg-white/10 backdrop-blur-sm border border-white/30 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                  data-testid="select-city"
                  disabled={selectedState === 'all'}
                >
                  <option value="all" className="bg-gray-800">All Cities</option>
                  {cities.filter(c => c !== 'all').map(city => (
                    <option key={city} value={city} className="bg-gray-800">{city}</option>
                  ))}
                </select>
              </div>
              
              {(selectedState !== 'all' || selectedCity !== 'all') && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedState('all');
                    setSelectedCity('all');
                  }}
                  className="text-orange-200 hover:text-white hover:bg-white/10"
                  data-testid="button-clear-filters"
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* System Status Overview */}
          <StaggerContainer className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <StaggerItem>
              <Card className="bg-white/10 backdrop-blur-md border-white/20">
                <CardContent className="p-6 text-center">
                  <Camera className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-white">{cameras.length}</div>
                  <div className="text-sm text-orange-200">Total Cameras</div>
                </CardContent>
              </Card>
            </StaggerItem>
            <StaggerItem>
              <Card className="bg-white/10 backdrop-blur-md border-white/20">
                <CardContent className="p-6 text-center">
                  <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-white">{onlineCameras}</div>
                  <div className="text-sm text-orange-200">Online Now</div>
                </CardContent>
              </Card>
            </StaggerItem>
            <StaggerItem>
              <Card className="bg-white/10 backdrop-blur-md border-white/20">
                <CardContent className="p-6 text-center">
                  <Route className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-white">{mockEvacuationRoutes.length}</div>
                  <div className="text-sm text-orange-200">Evacuation Routes</div>
                </CardContent>
              </Card>
            </StaggerItem>
            <StaggerItem>
              <Card className="bg-white/10 backdrop-blur-md border-white/20">
                <CardContent className="p-6 text-center">
                  <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-white">
                    {cameras.reduce((acc, cam) => acc + cam.alerts.length, 0)}
                  </div>
                  <div className="text-sm text-orange-200">Active Alerts</div>
                </CardContent>
              </Card>
            </StaggerItem>
          </StaggerContainer>

          {/* AI Traffic Intelligence Panel */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-8"
          >
            <Card className="bg-gradient-to-br from-purple-900/40 to-blue-900/40 backdrop-blur-md border-purple-400/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Zap className="w-5 h-5 mr-2 text-purple-400" />
                  AI Traffic Intelligence
                </CardTitle>
                <CardDescription className="text-purple-200">
                  Real-time analysis powered by Grok AI
                </CardDescription>
              </CardHeader>
              <CardContent>
                {aiAnalysisLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-8 h-8 text-purple-400 animate-spin mr-3" />
                    <p className="text-purple-200">Analyzing traffic patterns...</p>
                  </div>
                ) : aiInsights ? (
                  <div className="text-white whitespace-pre-line leading-relaxed">
                    {aiInsights}
                  </div>
                ) : (
                  <p className="text-purple-200 text-center py-4">
                    Select filters to generate AI traffic analysis
                  </p>
                )}
                
                <div className="mt-4 flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={analyzeTrafficWithAI}
                    disabled={aiAnalysisLoading || cameras.length === 0}
                    className="bg-purple-500/20 hover:bg-purple-500/30 border-purple-400/30 text-purple-200"
                    data-testid="button-refresh-ai-analysis"
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    Refresh Analysis
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* View Mode Toggle */}
          <div className="flex justify-center mb-8">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-1">
              <Button
                variant={viewMode === 'cameras' ? 'default' : 'ghost'}
                className={`${viewMode === 'cameras' ? 'bg-orange-500 text-white' : 'text-white'}`}
                onClick={() => setViewMode('cameras')}
                data-testid="button-cameras-view"
              >
                <Camera className="w-4 h-4 mr-2" />
                Traffic Cameras
              </Button>
              <Button
                variant={viewMode === 'routes' ? 'default' : 'ghost'}
                className={`ml-2 ${viewMode === 'routes' ? 'bg-orange-500 text-white' : 'text-white'}`}
                onClick={() => setViewMode('routes')}
                data-testid="button-routes-view"
              >
                <Route className="w-4 h-4 mr-2" />
                Evacuation Routes
              </Button>
            </div>
          </div>

          {/* Traffic Cameras View */}
          {viewMode === 'cameras' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Camera List */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                  <Camera className="w-6 h-6 mr-2 text-orange-400" />
                  Live Traffic Cameras
                </h2>
                
                {camerasLoading ? (
                  <Card className="bg-white/10 backdrop-blur-md border-white/20">
                    <CardContent className="p-12 text-center">
                      <Loader2 className="w-12 h-12 text-orange-400 mx-auto mb-4 animate-spin" />
                      <p className="text-orange-200">Loading traffic cameras...</p>
                    </CardContent>
                  </Card>
                ) : cameras.length === 0 ? (
                  <Card className="bg-white/10 backdrop-blur-md border-white/20">
                    <CardContent className="p-12 text-center">
                      <Camera className="w-16 h-16 text-orange-400 mx-auto mb-4" />
                      <p className="text-orange-200">No traffic cameras available</p>
                    </CardContent>
                  </Card>
                ) : (
                  cameras.map((camera, index) => (
                  <motion.div
                    key={camera.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card 
                      className={`cursor-pointer transition-all duration-300 bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/20 ${
                        selectedCamera?.id === camera.id ? 'ring-2 ring-orange-400' : ''
                      }`}
                      onClick={() => setSelectedCamera(camera)}
                      data-testid={`camera-card-${camera.id}`}
                    >
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-white">{camera.name}</CardTitle>
                            <CardDescription className="text-orange-200">
                              {camera.location}
                            </CardDescription>
                          </div>
                          <div className="flex flex-col items-end space-y-2">
                            <Badge className={`${getStatusColor(camera.status)} text-white`}>
                              {camera.status.toUpperCase()}
                            </Badge>
                            {camera.emergencyRoute && (
                              <Badge className="bg-yellow-500/20 text-yellow-200 border-yellow-400/30">
                                <Shield className="w-3 h-3 mr-1" />
                                Emergency Route
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                          <div className="flex items-center text-white">
                            {getFlowIcon(camera.trafficFlow)}
                            <span className="ml-2 capitalize">{camera.trafficFlow} Traffic</span>
                          </div>
                          <div className="text-orange-200">
                            {camera.weatherConditions}
                          </div>
                        </div>
                        {camera.alerts.length > 0 && (
                          <div className="space-y-1">
                            {camera.alerts.map((alert, alertIndex) => (
                              <div key={alertIndex} className="text-xs text-red-300 flex items-start">
                                <AlertTriangle className="w-3 h-3 mr-1 mt-0.5 flex-shrink-0" />
                                {alert}
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                )))}
              </div>

              {/* Camera Detail View */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                  <Eye className="w-6 h-6 mr-2 text-orange-400" />
                  Camera Feed
                </h2>
                
                {selectedCamera ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    <Card className="bg-white/10 backdrop-blur-md border-white/20">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center">
                          <Camera className="w-5 h-5 mr-2 text-orange-400" />
                          {selectedCamera.name}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {/* Camera Feed Placeholder */}
                        <div className="aspect-video bg-gray-800 rounded-lg flex items-center justify-center mb-4">
                          <div className="text-center">
                            <Camera className="w-16 h-16 text-gray-600 mx-auto mb-2" />
                            <p className="text-gray-400">Live Camera Feed</p>
                            <p className="text-gray-500 text-sm">{selectedCamera.name}</p>
                          </div>
                        </div>

                        {/* Camera Details */}
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="text-orange-200 mb-1">Status</div>
                            <Badge className={`${getStatusColor(selectedCamera.status)} text-white`}>
                              {selectedCamera.status.toUpperCase()}
                            </Badge>
                          </div>
                          <div>
                            <div className="text-orange-200 mb-1">Traffic Flow</div>
                            <div className="text-white flex items-center">
                              {getFlowIcon(selectedCamera.trafficFlow)}
                              <span className="ml-2 capitalize">{selectedCamera.trafficFlow}</span>
                            </div>
                          </div>
                          <div className="col-span-2">
                            <div className="text-orange-200 mb-1">Weather Conditions</div>
                            <div className="text-white">{selectedCamera.weatherConditions}</div>
                          </div>
                          <div className="col-span-2">
                            <div className="text-orange-200 mb-1">Last Update</div>
                            <div className="text-white">
                              {new Date(selectedCamera.lastUpdate).toLocaleString()}
                            </div>
                          </div>
                        </div>

                        {selectedCamera.alerts.length > 0 && (
                          <div className="mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                            <h4 className="text-red-200 font-medium mb-2 flex items-center">
                              <AlertTriangle className="w-4 h-4 mr-2" />
                              Active Alerts
                            </h4>
                            <div className="space-y-1">
                              {selectedCamera.alerts.map((alert, index) => (
                                <div key={index} className="text-red-100 text-sm">
                                  • {alert}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ) : (
                  <Card className="bg-white/10 backdrop-blur-md border-white/20">
                    <CardContent className="p-12 text-center">
                      <Camera className="w-16 h-16 text-orange-400 mx-auto mb-4" />
                      <p className="text-orange-200">Select a camera to view live feed and details</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}

          {/* Evacuation Routes View */}
          {viewMode === 'routes' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                <Route className="w-6 h-6 mr-2 text-orange-400" />
                Emergency Evacuation Routes
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {mockEvacuationRoutes.map((route, index) => (
                  <motion.div
                    key={route.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.2 }}
                  >
                    <Card className="bg-white/10 backdrop-blur-md border-white/20">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-white">{route.name}</CardTitle>
                            <CardDescription className="text-orange-200">
                              {route.origin} → {route.destination}
                            </CardDescription>
                          </div>
                          <Badge className={`${getStatusColor(route.status)} text-white`}>
                            {route.status.toUpperCase()}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Route Metrics */}
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="text-orange-200 mb-1">Estimated Time</div>
                            <div className="text-white font-medium">{Math.floor(route.estimatedTime / 60)}h {route.estimatedTime % 60}m</div>
                          </div>
                          <div>
                            <div className="text-orange-200 mb-1">Alternatives</div>
                            <div className="text-white font-medium">{route.alternativeRoutes} routes</div>
                          </div>
                        </div>

                        {/* Capacity Usage */}
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-orange-200">Route Capacity</span>
                            <span className="text-white">{Math.round((route.currentLoad / route.capacity) * 100)}% used</span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            <motion.div
                              className={`h-2 rounded-full ${
                                route.currentLoad / route.capacity > 0.8 ? 'bg-red-500' :
                                route.currentLoad / route.capacity > 0.6 ? 'bg-yellow-500' :
                                'bg-green-500'
                              }`}
                              initial={{ width: 0 }}
                              animate={{ width: `${(route.currentLoad / route.capacity) * 100}%` }}
                              transition={{ duration: 1, delay: index * 0.2 }}
                            />
                          </div>
                          <div className="flex justify-between text-xs text-orange-300 mt-1">
                            <span>{route.currentLoad.toLocaleString()} vehicles</span>
                            <span>{route.capacity.toLocaleString()} capacity</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      </FadeIn>
    </div>
  );
}