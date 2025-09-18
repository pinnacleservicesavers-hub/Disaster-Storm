import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { MapPin, Camera, AlertTriangle, DollarSign, Bell, Heart, Eye, Activity, Monitor, Search, Filter, Grid, List, Play, Pause, Maximize2, Signal, Wifi, WifiOff, Zap, TrendingUp, Users, Clock, RefreshCw, Volume2, VolumeX } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { MapView } from '@/components/MapView';
import { CameraViewer } from '@/components/CameraViewer';
import { FadeIn, CountUp, StaggerContainer, StaggerItem, HoverLift, ScaleIn, SlideIn, PulseAlert } from '@/components/ui/animations';
import type { ContractorWatchlist, InsertContractorWatchlist } from '@shared/schema';

interface CameraDirectory {
  directory: Array<{
    state: string;
    name: string;
    cameraCount: number;
    incidentCount: number;
    contractorOpportunities: number;
    counties: string[];
    provider: string;
  }>;
  totalStates: number;
  totalCameras: number;
  totalIncidents: number;
  contractorOpportunities: number;
  timestamp: string;
}

interface ContractorOpportunity {
  id: string;
  type: string;
  description: string;
  lat: number;
  lng: number;
  severity: 'critical' | 'severe' | 'moderate' | 'minor';
  startTime: string;
  affectedRoutes: string[];
  jurisdiction: {
    state: string;
    jurisdiction: string;
    provider: string;
  };
  isContractorOpportunity: boolean;
  estimatedValue: number;
}

interface OpportunitiesResponse {
  opportunities: ContractorOpportunity[];
  count: number;
  totalEstimatedRevenue: number;
  breakdown: {
    bySeverity: Array<{ severity: string; count: number }>;
    byType: Array<{ type: string; count: number }>;
  };
  filters: Record<string, any>;
  timestamp: string;
}

export function TrafficCameras() {
  const [selectedState, setSelectedState] = useState<string>('');
  const [selectedCounty, setSelectedCounty] = useState<string>('');
  const [alertsOnly, setAlertsOnly] = useState(false);
  const [viewerCameraId, setViewerCameraId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showLiveOnly, setShowLiveOnly] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedOpportunity, setSelectedOpportunity] = useState<string | null>(null);
  const [isVoiceGuideActive, setIsVoiceGuideActive] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  
  // For now, using a hardcoded contractor ID since there's no authentication system
  const contractorId = 'contractor-demo-001';
  const queryClient = useQueryClient();

  // Initialize voice loading
  useEffect(() => {
    const loadVoices = () => {
      setVoices(window.speechSynthesis.getVoices());
    };
    
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const startVoiceGuide = () => {
    if (!isVoiceGuideActive) {
      setIsVoiceGuideActive(true);
      
      const voiceContent = `Welcome to Traffic Cam Watcher! This monitoring system provides access to live traffic camera feeds across multiple states to identify contractor opportunities from weather-related incidents. The main dashboard displays camera directory by state showing total cameras, active incidents, and potential contractor opportunities. You can filter by state and county to focus on specific regions. The incident detection system uses AI to automatically identify weather damage, road closures, and infrastructure issues that create contracting opportunities. Each opportunity shows estimated value, severity level, and location details. The watchlist feature lets you monitor specific states for new incidents. Camera feeds update in real-time, and you can switch between map view and list view for easier navigation.`;
      
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
      
      window.speechSynthesis.speak(utterance);
    } else {
      window.speechSynthesis.cancel();
      setIsVoiceGuideActive(false);
    }
  };

  // Fetch directory
  const { data: directory, isLoading: directoryLoading } = useQuery<CameraDirectory>({
    queryKey: ['/api/511/directory'],
  });

  // Fetch contractor opportunities
  const { data: opportunities, isLoading: opportunitiesLoading } = useQuery<OpportunitiesResponse>({
    queryKey: ['/api/511/contractor-opportunities'],
  });

  // Fetch contractor watchlist
  const { data: watchlistData, isLoading: watchlistLoading } = useQuery<{watchlist: ContractorWatchlist[], contractorId: string, count: number}>({
    queryKey: ['/api/contractor/watchlist', contractorId],
    enabled: !!contractorId,
  });
  
  const watchlist = watchlistData?.watchlist || [];

  const selectedStateData = directory?.directory.find(d => d.state === selectedState);

  // Add to watchlist mutation
  const addWatchlistMutation = useMutation({
    mutationFn: async (data: InsertContractorWatchlist) => {
      return apiRequest('/api/contractor/watchlist', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/contractor/watchlist', contractorId] });
      console.log('Successfully added to watchlist');
    },
    onError: (error) => {
      console.error('Error adding to watchlist:', error);
    },
  });

  // Remove from watchlist mutation
  const removeWatchlistMutation = useMutation({
    mutationFn: async ({ contractorId, itemType, itemId }: { contractorId: string, itemType: string, itemId: string }) => {
      return apiRequest(`/api/contractor/${contractorId}/watchlist/${itemType}/${itemId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/contractor/watchlist', contractorId] });
      console.log('Successfully removed from watchlist');
    },
    onError: (error) => {
      console.error('Error removing from watchlist:', error);
    },
  });

  const addToWatchlist = (state: string, stateName: string) => {
    const watchlistItem: InsertContractorWatchlist = {
      contractorId,
      itemType: 'state',
      itemId: state,
      displayName: `${stateName} Traffic Cameras`,
      state,
    };
    addWatchlistMutation.mutate(watchlistItem);
  };

  const removeFromWatchlist = (state: string) => {
    removeWatchlistMutation.mutate({
      contractorId,
      itemType: 'state',
      itemId: state,
    });
  };
  
  const isInWatchlist = (state: string) => {
    return watchlist.some(item => item.itemType === 'state' && item.itemId === state);
  };

  if (directoryLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900 p-6 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute top-10 right-10 w-32 h-32 bg-blue-400/10 rounded-full blur-3xl"
            animate={{
              x: [0, 30, 0],
              y: [0, -20, 0],
              scale: [1, 1.2, 1]
            }}
            transition={{ duration: 6, repeat: Infinity }}
          />
          <motion.div
            className="absolute bottom-20 left-20 w-40 h-40 bg-green-400/10 rounded-full blur-3xl"
            animate={{
              x: [0, -25, 0],
              y: [0, 15, 0],
              scale: [1, 0.8, 1]
            }}
            transition={{ duration: 8, repeat: Infinity, delay: 1 }}
          />
        </div>
        
        <FadeIn>
          <div className="max-w-7xl mx-auto relative z-10">
            <div className="text-center mb-8">
              <motion.div
                className="relative inline-block mb-6"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.8, type: "spring" }}
              >
                <div className="relative">
                  <motion.div
                    className="w-20 h-20 border-4 border-blue-200 border-t-blue-600 rounded-full mx-auto"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  />
                  <motion.div
                    className="absolute inset-2 w-16 h-16 border-4 border-transparent border-r-green-400 rounded-full"
                    animate={{ rotate: -360 }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                  />
                  <motion.div
                    className="absolute inset-4 w-12 h-12 border-2 border-transparent border-b-purple-300 rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                  {/* Center camera icon */}
                  <motion.div
                    className="absolute inset-0 flex items-center justify-center"
                    animate={{ 
                      scale: [0.8, 1.2, 0.8],
                      rotate: [0, 5, -5, 0]
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    <Camera className="w-8 h-8 text-blue-600" />
                  </motion.div>
                </div>
              </motion.div>
              
              <motion.div
                className="space-y-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <motion.h2
                  className="text-3xl font-bold mb-4"
                  style={{
                    background: 'linear-gradient(45deg, #3b82f6, #10b981, #6366f1, #06b6d4)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundSize: '300% 300%'
                  }}
                  animate={{ 
                    backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
                  }}
                  transition={{ duration: 4, repeat: Infinity }}
                >
                  📹 Connecting to Traffic Camera Network...
                </motion.h2>
                
                <div className="space-y-2">
                  <motion.p
                    className="text-gray-600 dark:text-gray-400 font-medium"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    Scanning live feeds across multiple states
                  </motion.p>
                  <motion.p
                    className="text-gray-500 dark:text-gray-500 text-sm"
                    animate={{ opacity: [0.3, 0.8, 0.3] }}
                    transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
                  >
                    Detecting contractor opportunities
                  </motion.p>
                  <motion.p
                    className="text-gray-400 dark:text-gray-600 text-xs"
                    animate={{ opacity: [0.2, 0.6, 0.2] }}
                    transition={{ duration: 3, repeat: Infinity, delay: 1 }}
                  >
                    Processing AI damage detection
                  </motion.p>
                </div>
                
                {/* Enhanced loading progress */}
                <motion.div
                  className="w-80 h-2 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto overflow-hidden"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1 }}
                >
                  <motion.div
                    className="h-full bg-gradient-to-r from-blue-500 via-green-500 to-purple-500 rounded-full"
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  />
                </motion.div>
              </motion.div>
            </div>
            
            {/* Enhanced loading skeleton */}
            <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                <StaggerItem key={i}>
                  <motion.div 
                    className="h-40 bg-gradient-to-br from-white/80 to-gray-100/80 dark:from-gray-800/80 dark:to-gray-900/80 rounded-xl shadow-lg backdrop-blur-sm border border-white/20 overflow-hidden"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <div className="p-4 space-y-3 h-full">
                      <motion.div 
                        className="h-4 bg-gradient-to-r from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-500 rounded w-3/4"
                        animate={{ opacity: [0.3, 0.7, 0.3] }}
                        transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
                      />
                      <motion.div 
                        className="h-20 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-lg flex items-center justify-center"
                        animate={{ opacity: [0.4, 0.8, 0.4] }}
                        transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.15 }}
                      >
                        <Camera className="w-8 h-8 text-gray-400" />
                      </motion.div>
                      <motion.div 
                        className="h-3 bg-gradient-to-r from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-500 rounded w-5/6"
                        animate={{ opacity: [0.2, 0.6, 0.2] }}
                        transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.25 }}
                      />
                    </div>
                    
                    {/* Scanning line effect */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                      initial={{ x: '-100%' }}
                      animate={{ x: '100%' }}
                      transition={{ 
                        duration: 2, 
                        repeat: Infinity, 
                        delay: i * 0.3,
                        ease: "easeInOut"
                      }}
                    />
                  </motion.div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </FadeIn>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900 p-6 relative overflow-hidden">
      {/* Dynamic background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-10 -right-10 w-40 h-40 bg-blue-400/10 rounded-full blur-3xl"
          animate={{
            x: [0, 50, 0],
            y: [0, -30, 0],
            scale: [1, 1.2, 1]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-1/4 -left-20 w-60 h-60 bg-green-400/10 rounded-full blur-3xl"
          animate={{
            x: [0, -40, 0],
            y: [0, 50, 0],
            scale: [1, 0.8, 1]
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-32 h-32 bg-purple-400/10 rounded-full blur-2xl"
          animate={{
            rotate: [0, 360],
            scale: [1, 1.5, 1]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        />
      </div>
      
      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        {/* Enhanced Header */}
        <FadeIn>
          <div className="text-center mb-8">
            <motion.div className="relative inline-block">
              <motion.h1
                className="text-5xl font-bold mb-4"
                initial={{ opacity: 0, y: -20, backgroundSize: '200% 200%' }}
                animate={{ 
                  opacity: 1, 
                  y: 0,
                  backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
                }}
                transition={{ duration: 0.6, backgroundPosition: { duration: 4, repeat: Infinity } }}
                style={{
                  background: 'linear-gradient(45deg, #3b82f6, #10b981, #6366f1, #06b6d4, #8b5cf6)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}
              >
                📹 Traffic Camera Network
              </motion.h1>
              
              {/* Live indicator */}
              <motion.div
                className="absolute -top-2 -right-16 flex items-center space-x-2 px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full text-xs font-bold shadow-lg"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8 }}
              >
                <motion.div
                  className="w-2 h-2 bg-red-500 rounded-full"
                  animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
                <span>LIVE</span>
              </motion.div>
            </motion.div>
            
            <motion.div
              className="space-y-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <p className="text-lg text-slate-600 dark:text-slate-300 font-medium">
                Real-time monitoring • Live incident detection • Contractor opportunities
              </p>
              
              {/* Enhanced subtitle with stats */}
              {directory && (
                <motion.div
                  className="flex items-center justify-center space-x-6 text-sm text-slate-500 dark:text-slate-400"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <div className="flex items-center space-x-1">
                    <Camera className="w-3 h-3" />
                    <span>{directory.totalCameras.toLocaleString()} cameras active</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <AlertTriangle className="w-3 h-3" />
                    <span>{directory.contractorOpportunities} opportunities</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Signal className="w-3 h-3" />
                    <span>{directory.totalStates} states covered</span>
                  </div>
                  {autoRefresh && (
                    <div className="flex items-center space-x-1 text-green-600">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      >
                        <RefreshCw className="w-3 h-3" />
                      </motion.div>
                      <span>Auto-refresh</span>
                    </div>
                  )}
                </motion.div>
              )}
              
              {/* Search and Controls */}
              <motion.div
                className="flex items-center justify-center space-x-4 max-w-2xl mx-auto mt-6"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    type="text"
                    placeholder="Search states, counties, or routes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 bg-white/80 backdrop-blur-sm border-gray-200 hover:border-blue-300 focus:border-blue-500 transition-colors"
                    data-testid="input-search-cameras"
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    data-testid="button-grid-view"
                    className="transition-all duration-200"
                  >
                    <Grid className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    data-testid="button-list-view"
                    className="transition-all duration-200"
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
                
                <Button
                  variant={showLiveOnly ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setShowLiveOnly(!showLiveOnly)}
                  data-testid="button-live-only"
                  className="transition-all duration-200"
                >
                  <motion.div
                    animate={showLiveOnly ? { scale: [1, 1.2, 1] } : {}}
                    transition={{ duration: 0.5, repeat: showLiveOnly ? Infinity : 0 }}
                  >
                    <Wifi className="w-4 h-4 mr-2" />
                  </motion.div>
                  Live Only
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={startVoiceGuide}
                  className="flex items-center gap-2 transition-all duration-200"
                  data-testid="button-voice-guide"
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
              </motion.div>
            </motion.div>
          </div>
        </FadeIn>

        {/* Enhanced Header Stats */}
        <FadeIn delay={0.4}>
          <StaggerContainer className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <StaggerItem>
              <HoverLift>
                <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800 hover:shadow-xl transition-all duration-300" data-testid="card-total-cameras">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <motion.div
                        className="p-3 bg-blue-500 rounded-xl text-white"
                        animate={{ 
                          scale: [1, 1.1, 1],
                          rotate: [0, 5, -5, 0]
                        }}
                        transition={{ duration: 3, repeat: Infinity }}
                      >
                        <Camera className="h-8 w-8" />
                      </motion.div>
                      <div>
                        <div className="text-3xl font-bold text-blue-800 dark:text-blue-200" data-testid="text-total-cameras">
                          <CountUp end={directory?.totalCameras || 0} />
                        </div>
                        <div className="text-sm font-medium text-blue-600 dark:text-blue-400">
                          📹 Live Cameras
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </HoverLift>
            </StaggerItem>
        
            <StaggerItem>
              <HoverLift>
                <Card className="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800 hover:shadow-xl transition-all duration-300" data-testid="card-states-covered">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <motion.div
                        className="p-3 bg-green-500 rounded-xl text-white"
                        animate={{ 
                          y: [0, -3, 0],
                          scale: [1, 1.05, 1]
                        }}
                        transition={{ duration: 2.5, repeat: Infinity }}
                      >
                        <MapPin className="h-8 w-8" />
                      </motion.div>
                      <div>
                        <div className="text-3xl font-bold text-green-800 dark:text-green-200" data-testid="text-total-states">
                          <CountUp end={directory?.totalStates || 0} />
                        </div>
                        <div className="text-sm font-medium text-green-600 dark:text-green-400">
                          🗺️ States Covered
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </HoverLift>
            </StaggerItem>
        
            <StaggerItem>
              <HoverLift>
                <Card className="bg-gradient-to-br from-orange-50 to-red-100 dark:from-orange-900/20 dark:to-red-900/20 border-orange-200 dark:border-orange-800 hover:shadow-xl transition-all duration-300" data-testid="card-active-opportunities">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <motion.div
                        className="p-3 bg-orange-500 rounded-xl text-white relative"
                        animate={{ 
                          scale: [1, 1.1, 1],
                          opacity: [1, 0.8, 1]
                        }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        <AlertTriangle className="h-8 w-8" />
                        {(directory?.contractorOpportunities || 0) > 0 && (
                          <motion.div
                            className="absolute -top-1 -right-1 w-3 h-3 bg-red-400 rounded-full"
                            animate={{ scale: [1, 1.3, 1] }}
                            transition={{ duration: 1, repeat: Infinity }}
                          />
                        )}
                      </motion.div>
                      <div>
                        <div className="text-3xl font-bold text-orange-800 dark:text-orange-200" data-testid="text-contractor-opportunities">
                          <CountUp end={directory?.contractorOpportunities || 0} />
                        </div>
                        <div className="text-sm font-medium text-orange-600 dark:text-orange-400">
                          ⚠️ Active Opportunities
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </HoverLift>
            </StaggerItem>
        
            <StaggerItem>
              <HoverLift>
                <Card className="bg-gradient-to-br from-purple-50 to-indigo-100 dark:from-purple-900/20 dark:to-indigo-900/20 border-purple-200 dark:border-purple-800 hover:shadow-xl transition-all duration-300" data-testid="card-estimated-revenue">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <motion.div
                        className="p-3 bg-purple-500 rounded-xl text-white"
                        animate={{ 
                          y: [0, -5, 0],
                          rotate: [0, 15, 0]
                        }}
                        transition={{ duration: 2.5, repeat: Infinity }}
                      >
                        <DollarSign className="h-8 w-8" />
                      </motion.div>
                      <div>
                        <div className="text-3xl font-bold text-purple-800 dark:text-purple-200" data-testid="text-estimated-revenue">
                          ${(opportunities?.totalEstimatedRevenue || 0).toLocaleString()}
                        </div>
                        <div className="text-sm font-medium text-purple-600 dark:text-purple-400">
                          💰 Revenue Potential
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </HoverLift>
            </StaggerItem>
          </StaggerContainer>
        </FadeIn>

      <FadeIn delay={1.0}>
        <Tabs defaultValue="browse" className="w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
          >
            <TabsList 
              className="grid w-full grid-cols-4 bg-white/80 backdrop-blur-sm border border-slate-200/50 p-1 rounded-xl shadow-lg" 
              data-testid="tabs-camera-dashboard"
            >
              <HoverLift>
                <TabsTrigger 
                  value="browse" 
                  data-testid="tab-browse"
                  className="rounded-lg transition-all duration-300 data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg flex items-center space-x-2"
                >
                  <Grid className="h-4 w-4" />
                  <span>📹 Browse Cameras</span>
                </TabsTrigger>
              </HoverLift>
              <HoverLift>
                <TabsTrigger 
                  value="map" 
                  data-testid="tab-map"
                  className="rounded-lg transition-all duration-300 data-[state=active]:bg-green-500 data-[state=active]:text-white data-[state=active]:shadow-lg flex items-center space-x-2"
                >
                  <MapPin className="h-4 w-4" />
                  <span>🗺️ Map View</span>
                </TabsTrigger>
              </HoverLift>
              <HoverLift>
                <TabsTrigger 
                  value="opportunities" 
                  data-testid="tab-opportunities"
                  className="rounded-lg transition-all duration-300 data-[state=active]:bg-orange-500 data-[state=active]:text-white data-[state=active]:shadow-lg flex items-center space-x-2"
                >
                  <DollarSign className="h-4 w-4" />
                  <span>💰 Opportunities</span>
                  {(directory?.contractorOpportunities || 0) > 0 && (
                    <motion.div
                      className="w-2 h-2 bg-red-400 rounded-full ml-1"
                      animate={{ scale: [1, 1.3, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    />
                  )}
                </TabsTrigger>
              </HoverLift>
              <HoverLift>
                <TabsTrigger 
                  value="watchlist" 
                  data-testid="tab-watchlist"
                  className="rounded-lg transition-all duration-300 data-[state=active]:bg-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg flex items-center space-x-2"
                >
                  <Heart className="h-4 w-4" />
                  <span>❤️ Watchlist</span>
                  {watchlist.length > 0 && (
                    <Badge variant="secondary" className="ml-1 text-xs">
                      {watchlist.length}
                    </Badge>
                  )}
                </TabsTrigger>
              </HoverLift>
            </TabsList>
          </motion.div>

        <TabsContent value="browse" className="space-y-6">
          {/* Enhanced Filters */}
          <motion.div
            className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/20 shadow-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex flex-wrap gap-4 items-center justify-between">
              <div className="flex flex-wrap gap-4 items-center">
                <div className="relative">
                  <Select value={selectedState} onValueChange={setSelectedState}>
                    <SelectTrigger className="w-56 bg-white/80 hover:bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100 transition-colors" data-testid="select-state">
                      <SelectValue placeholder="🗺️ Select State" />
                    </SelectTrigger>
                    <SelectContent className="z-50 bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 shadow-lg">
                      <SelectItem value="all" className="text-slate-900 dark:text-slate-100 data-[highlighted]:bg-slate-100 data-[highlighted]:text-slate-900 dark:data-[highlighted]:bg-slate-700 dark:data-[highlighted]:text-slate-100">🌎 All States</SelectItem>
                      {directory?.directory.map(state => (
                        <SelectItem key={state.state} value={state.state} className="text-slate-900 dark:text-slate-100 data-[highlighted]:bg-slate-100 data-[highlighted]:text-slate-900 dark:data-[highlighted]:bg-slate-700 dark:data-[highlighted]:text-slate-100">
                          {state.name} ({state.cameraCount} cameras)
                          {state.contractorOpportunities > 0 && (
                            <span className="ml-2 text-orange-600 dark:text-orange-300 font-semibold">
                              • {state.contractorOpportunities} ops
                            </span>
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <AnimatePresence>
                  {selectedStateData && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                    >
                      <Select value={selectedCounty} onValueChange={setSelectedCounty}>
                        <SelectTrigger className="w-48 bg-white/80 hover:bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100 transition-colors" data-testid="select-county">
                          <SelectValue placeholder="🏢 Select County" />
                        </SelectTrigger>
                        <SelectContent className="z-50 bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 shadow-lg">
                          <SelectItem value="all" className="text-slate-900 dark:text-slate-100 data-[highlighted]:bg-slate-100 data-[highlighted]:text-slate-900 dark:data-[highlighted]:bg-slate-700 dark:data-[highlighted]:text-slate-100">🏘️ All Counties</SelectItem>
                          {selectedStateData.counties.map(county => (
                            <SelectItem key={county} value={county} className="text-slate-900 dark:text-slate-100 data-[highlighted]:bg-slate-100 data-[highlighted]:text-slate-900 dark:data-[highlighted]:bg-slate-700 dark:data-[highlighted]:text-slate-100">
                              {county}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    variant={alertsOnly ? "default" : "outline"}
                    onClick={() => setAlertsOnly(!alertsOnly)}
                    data-testid="button-alerts-only"
                    className="transition-all duration-300 shadow-md hover:shadow-lg"
                  >
                    <motion.div
                      animate={alertsOnly ? { scale: [1, 1.2, 1] } : {}}
                      transition={{ duration: 0.5, repeat: alertsOnly ? Infinity : 0 }}
                    >
                      <Bell className="h-4 w-4 mr-2" />
                    </motion.div>
                    {alertsOnly ? '📋 Show All' : '🚨 Alerts Only'}
                  </Button>
                </motion.div>
              </div>
              
              {/* Quick stats */}
              <div className="flex items-center space-x-4 text-sm text-slate-600 dark:text-slate-400">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span>Live feeds active</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>Updated {new Date().toLocaleTimeString()}</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Enhanced State Directory Grid */}
          <motion.div 
            className={`gap-6 ${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'space-y-4'}`}
            layout
          >
            {directory?.directory
              .filter(state => !selectedState || selectedState === 'all' || state.state === selectedState)
              .filter(state => !alertsOnly || state.contractorOpportunities > 0)
              .map(state => (
                <Card key={state.state} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{state.name}</CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => 
                          isInWatchlist(state.state)
                            ? removeFromWatchlist(state.state)
                            : addToWatchlist(state.state, state.name)
                        }
                        disabled={addWatchlistMutation.isPending || removeWatchlistMutation.isPending}
                        data-testid={`button-watchlist-${state.state}`}
                      >
                        <Heart 
                          className={`h-4 w-4 ${
                            isInWatchlist(state.state) 
                              ? 'fill-red-500 text-red-500' 
                              : 'text-gray-400'
                          }`} 
                        />
                      </Button>
                    </div>
                    <div className="text-sm text-gray-600">{state.provider}</div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center">
                        <Camera className="h-4 w-4 mr-1" />
                        {state.cameraCount} cameras
                      </span>
                      <span className="flex items-center">
                        <AlertTriangle className="h-4 w-4 mr-1" />
                        {state.incidentCount} incidents
                      </span>
                    </div>
                    
                    {state.contractorOpportunities > 0 && (
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          <strong>{state.contractorOpportunities} contractor opportunities</strong> available
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className="flex flex-wrap gap-1">
                      {state.counties.slice(0, 6).map(county => (
                        <Badge key={county} variant="secondary" className="text-xs">
                          {county}
                        </Badge>
                      ))}
                      {state.counties.length > 6 && (
                        <Badge variant="outline" className="text-xs">
                          +{state.counties.length - 6} more
                        </Badge>
                      )}
                    </div>

                    <Button 
                      className="w-full" 
                      size="sm"
                      onClick={() => setSelectedState(state.state)}
                      data-testid={`button-view-cameras-${state.state}`}
                    >
                      View Cameras
                    </Button>
                  </CardContent>
                </Card>
              ))}
          </motion.div>
        </TabsContent>

        <TabsContent value="map" className="space-y-4">
          <div className="h-[600px] rounded-lg border">
            <MapView 
              selectedState={selectedState}
              selectedCounty={selectedCounty}
              showIncidentsOnly={alertsOnly}
              showCamerasOnly={false}
              className="h-full"
            />
          </div>
        </TabsContent>

        <TabsContent value="opportunities" className="space-y-4">
          {opportunitiesLoading ? (
            <div className="text-center py-8">Loading opportunities...</div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold">
                  {opportunities?.count} Active Opportunities
                </h3>
                <div className="text-lg font-bold text-green-600">
                  Total Value: ${opportunities?.totalEstimatedRevenue?.toLocaleString()}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {opportunities?.opportunities.map(opp => (
                  <Card key={opp.id} className="border-l-4 border-l-orange-500">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-base">{opp.type.replace('_', ' ').toUpperCase()}</CardTitle>
                        <Badge variant={
                          opp.severity === 'critical' ? 'destructive' :
                          opp.severity === 'severe' ? 'default' : 'secondary'
                        }>
                          {opp.severity}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm">{opp.description}</p>
                      <div className="text-sm text-gray-600">
                        <div>📍 {opp.lat.toFixed(4)}, {opp.lng.toFixed(4)}</div>
                        <div>🛣️ {opp.affectedRoutes.join(', ')}</div>
                        <div>🏛️ {opp.jurisdiction.provider}</div>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="text-lg font-bold text-green-600">
                          ${opp.estimatedValue.toLocaleString()}
                        </div>
                        <Button 
                          size="sm" 
                          data-testid={`button-view-opportunity-${opp.id}`}
                          onClick={() => {
                            alert(`Opportunity Details:\n\nType: ${opp.type.replace('_', ' ').toUpperCase()}\nLocation: ${opp.lat.toFixed(4)}, ${opp.lng.toFixed(4)}\nEstimated Value: $${opp.estimatedValue.toLocaleString()}\nSeverity: ${opp.severity}\n\nAffected Routes: ${opp.affectedRoutes.join(', ')}\nJurisdiction: ${opp.jurisdiction.provider}\n\nDescription: ${opp.description}`);
                          }}
                        >
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="watchlist" className="space-y-4">
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Your Watchlist</h3>
            {watchlist.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No regions in your watchlist. Add states by clicking the heart icon.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {watchlist.map(watchlistItem => {
                  const stateData = directory?.directory.find(d => d.state === watchlistItem.state);
                  return stateData ? (
                    <Card key={watchlistItem.id}>
                      <CardHeader>
                        <div className="flex justify-between items-center">
                          <CardTitle>{stateData.name}</CardTitle>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFromWatchlist(watchlistItem.state)}
                            data-testid={`button-remove-watchlist-${watchlistItem.state}`}
                          >
                            <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-sm space-y-1">
                          <div>{stateData.cameraCount} cameras active</div>
                          <div>{stateData.contractorOpportunities} opportunities available</div>
                        </div>
                      </CardContent>
                    </Card>
                  ) : null;
                })}
              </div>
            )}
          </div>
        </TabsContent>
        </Tabs>
        </FadeIn>

        {/* Camera Viewer Modal */}
        <CameraViewer 
          cameraId={viewerCameraId}
          onClose={() => setViewerCameraId(null)}
          enableDamageDetection={true}
          autoRefresh={true}
          refreshInterval={30000}
        />
      </div>
    </div>
  );
}

export default TrafficCameras;