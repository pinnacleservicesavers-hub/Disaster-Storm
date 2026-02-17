import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FadeIn, ScaleIn, SlideIn } from '@/components/ui/animations';
import { Video, ExternalLink, AlertCircle, DollarSign, Play, Users, Signal, Zap, Heart, Filter, Search, Clock, Volume2, VolumeX, Globe, ArrowLeft, Satellite } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { StateCitySelector, useStateCitySelector } from '@/components/StateCitySelector';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import ModuleAIAssistant from '@/components/ModuleAIAssistant';
import ModuleVoiceGuide from '@/components/ModuleVoiceGuide';

const SatelliteIntelligence = lazy(() => import('@/components/satellite/SatelliteIntelligence'));

export default function EyesInSky() {
  const { selectedState, setSelectedState, selectedCity, setSelectedCity, availableCities } = useStateCitySelector('Florida', 'Miami');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [activeSection, setActiveSection] = useState<'streams' | 'satellite'>('streams');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [liveStatus, setLiveStatus] = useState<{[key: string]: 'live' | 'offline' | 'scheduled'}>({});
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const hasPlayedWelcome = useRef(false);
  const voiceEnabledRef = useRef(true);

  // Wrap entire component in neon black background
  const WrapperDiv = ({ children }: { children: React.ReactNode }) => (
    <div className="min-h-screen bg-black text-white">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 opacity-30 blur-3xl"
          style={{
            background: 'radial-gradient(40% 40% at 20% 30%, rgba(0,194,255,0.15), transparent 60%), radial-gradient(50% 50% at 80% 70%, rgba(0,217,255,0.2), transparent 65%)'
          }}
        />
      </div>
      <div className="relative max-w-7xl mx-auto px-8 py-16">
        <div className="flex items-center gap-4 mb-6">
          <Link to="/">
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
          <StateCitySelector
            selectedState={selectedState}
            selectedCity={selectedCity}
            availableCities={availableCities}
            onStateChange={setSelectedState}
            onCityChange={setSelectedCity}
            variant="dark"
            showAllStates={true}
          />
        </div>
        <h1 className="text-6xl font-extrabold tracking-tight mb-4"
          style={{
            background: 'linear-gradient(90deg, #00d9ff 0%, #00ffcc 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '0 0 80px rgba(0, 255, 204, 0.5)'
          }}
        >
          Eyes in the Sky
        </h1>
        <p className="text-xl text-cyan-300/70 mb-12">
          Storm operations with route planning, address search, elevation data, and Google Maps integration on 3D Earth globe
        </p>
        {children}
      </div>
    </div>
  );

  const voiceMutation = useMutation({
    mutationFn: async (message: string) => {
      const res = await apiRequest("POST", "/api/closebot/chat", {
        message,
        history: [],
        context: { leadName: "contractor", companyName: "your company", trade: "aerial_surveillance" },
        enableVoice: true
      });
      return res;
    },
    onSuccess: (data: any) => {
      if (data.audioUrl && audioRef.current) {
        audioRef.current.src = data.audioUrl;
        audioRef.current.play();
        setIsPlaying(true);
        audioRef.current.onended = () => setIsPlaying(false);
      }
    },
  });

  useEffect(() => {
    if (!hasPlayedWelcome.current && voiceEnabledRef.current) {
      hasPlayedWelcome.current = true;
      voiceMutation.mutate("Welcome to Eyes in the Sky! This aerial surveillance platform aggregates live storm chasing streams, weather reconnaissance feeds, and satellite imagery for comprehensive sky-level monitoring.");
    }
  }, []);

  const toggleVoice = () => {
    const newState = !isVoiceEnabled;
    setIsVoiceEnabled(newState);
    voiceEnabledRef.current = newState;
    if (!newState && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };

  const playRachelVoice = (prompt: string) => {
    if (voiceEnabledRef.current) {
      voiceMutation.mutate(prompt);
    }
  };

  // Simulate live status updates
  useEffect(() => {
    const updateLiveStatus = () => {
      const statuses = ['live', 'offline', 'scheduled'] as const;
      const newStatus: {[key: string]: 'live' | 'offline' | 'scheduled'} = {};
      streamingSources.forEach((source, index) => {
        newStatus[index] = statuses[Math.floor(Math.random() * 3)];
      });
      setLiveStatus(newStatus);
    };
    
    updateLiveStatus();
    const interval = setInterval(updateLiveStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  const streamingSources = [
    {
      name: "Severe Studios LiveChase",
      url: "https://www.severestudios.com/livechase/?utm_source=chatgpt.com",
      description: "Professional storm chasing live streams and severe weather coverage",
      category: "Live Chasing"
    },
    {
      name: "Live Storm Chasers",
      url: "https://livestormchasers.com/?utm_source=chatgpt.com",
      description: "Real-time storm chaser feeds and weather tracking",
      category: "Live Chasing"
    },
    {
      name: "Brandon Copic Weather",
      url: "https://www.youtube.com/@BrandonCopicWx",
      description: "Professional meteorologist storm analysis and forecasting",
      category: "YouTube Channel"
    },
    {
      name: "Tornado HQ",
      url: "https://www.tornadohq.com/?utm_source=chatgpt.com",
      description: "Tornado tracking and severe weather intelligence",
      category: "Weather Intelligence"
    },
    {
      name: "Tornado Path",
      url: "https://www.tornadopath.com/?utm_source=chatgpt.com",
      description: "Tornado path tracking and damage assessment",
      category: "Damage Tracking"
    },
    {
      name: "ArcGIS Emergency Dashboard",
      url: "https://www.arcgis.com/apps/dashboards/3ca8efb6f5684fc88e9761f6a26e2b5d",
      description: "Real-time emergency response and incident mapping",
      category: "Emergency Response"
    },
    {
      name: "Zoom.Earth",
      url: "https://zoom.earth/",
      description: "Live satellite imagery and weather visualization",
      category: "Satellite"
    },
    {
      name: "Severe Studios",
      url: "https://www.severestudios.com/?utm_source=chatgpt.com",
      description: "Professional storm photography and documentation",
      category: "Storm Documentation"
    }
  ];

  const categories = ['all', 'Live Chasing', 'YouTube Channel', 'Weather Intelligence', 'Damage Tracking', 'Emergency Response', 'Satellite', 'Storm Documentation'];

  const filteredSources = streamingSources.filter(source => {
    const matchesCategory = selectedCategory === 'all' || source.category === selectedCategory;
    const matchesSearch = source.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         source.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const featuredSources = streamingSources.filter((_, index) => liveStatus[index] === 'live').slice(0, 3);

  const openStream = (url: string, name: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const toggleFavorite = (index: number) => {
    setFavorites(prev => 
      prev.includes(index.toString()) 
        ? prev.filter(f => f !== index.toString())
        : [...prev, index.toString()]
    );
  };

  const getStatusColor = (status: 'live' | 'offline' | 'scheduled') => {
    switch (status) {
      case 'live': return 'bg-red-500';
      case 'offline': return 'bg-gray-400';
      case 'scheduled': return 'bg-yellow-500';
    }
  };

  const getStatusText = (status: 'live' | 'offline' | 'scheduled') => {
    switch (status) {
      case 'live': return 'LIVE';
      case 'offline': return 'Offline';
      case 'scheduled': return 'Scheduled';
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <audio ref={audioRef} className="hidden" />
      {/* Animated Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute inset-0 opacity-30"
          animate={{
            background: [
              'radial-gradient(circle at 20% 80%, rgba(59, 130, 246, 0.3) 0%, transparent 50%)',
              'radial-gradient(circle at 80% 20%, rgba(139, 92, 246, 0.3) 0%, transparent 50%)',
              'radial-gradient(circle at 40% 40%, rgba(59, 130, 246, 0.3) 0%, transparent 50%)'
            ]
          }}
          transition={{ duration: 8, repeat: Infinity, repeatType: 'reverse' }}
        />
        <motion.div
          className="absolute top-10 left-10 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20"
          animate={{
            x: [0, 100, 0],
            y: [0, -100, 0],
          }}
          transition={{ duration: 20, repeat: Infinity }}
        />
        <motion.div
          className="absolute top-40 right-10 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20"
          animate={{
            x: [0, -100, 0],
            y: [0, 100, 0],
          }}
          transition={{ duration: 25, repeat: Infinity }}
        />
      </div>

      <div className="relative z-10 container mx-auto p-6">
        <FadeIn>
          <div className="mb-8">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center mb-6"
            >
              <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent mb-4" data-testid="title-eyes-in-sky">
                👁️ Eyes in the Sky
              </h1>
              <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto mb-4">
                Real-time storm chasing coverage and professional weather monitoring from across the United States
              </p>
              <div className="flex justify-center gap-4 flex-wrap">
                <div className="flex bg-white/10 rounded-lg p-1 border border-white/20">
                  <Button
                    variant={activeSection === 'streams' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setActiveSection('streams')}
                    className={`flex items-center gap-2 ${activeSection === 'streams' ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white' : 'text-slate-400 hover:text-white hover:bg-white/10'}`}
                    data-testid="button-streams-tab"
                  >
                    <Video className="h-4 w-4" />
                    Live Streams
                  </Button>
                  <Button
                    variant={activeSection === 'satellite' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setActiveSection('satellite')}
                    className={`flex items-center gap-2 ${activeSection === 'satellite' ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-white/10'}`}
                    data-testid="button-satellite-tab"
                  >
                    <Satellite className="h-4 w-4" />
                    Satellite Intelligence
                  </Button>
                </div>
                <Link to="/eyes-globe">
                  <Button
                    variant="default"
                    size="sm"
                    className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 backdrop-blur-sm transition-all duration-300 shadow-lg hover:shadow-xl"
                    data-testid="button-3d-globe"
                  >
                    <Globe className="h-4 w-4" />
                    Launch 3D Globe
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleVoice}
                  className="flex items-center gap-2 bg-white/80 hover:bg-white border-blue-200 hover:border-blue-300 text-blue-700 hover:text-blue-800 backdrop-blur-sm transition-all duration-300 shadow-lg hover:shadow-xl"
                  data-testid="button-voice-guide"
                  aria-label="Voice guide for Eyes in the Sky"
                >
                  {isPlaying ? (
                    <>
                      <Volume2 className="h-4 w-4 animate-pulse" />
                      Playing
                    </>
                  ) : isVoiceEnabled ? (
                    <>
                      <Volume2 className="h-4 w-4" />
                      Voice Guide
                    </>
                  ) : (
                    <>
                      <VolumeX className="h-4 w-4" />
                      Voice Off
                    </>
                  )}
                </Button>
              </div>
            </motion.div>

            {/* Live Stats Bar */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md rounded-2xl p-6 mb-8 shadow-xl border border-white/20"
            >
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse mr-2" />
                    <span className="text-2xl font-bold text-slate-800 dark:text-white">
                      {Object.values(liveStatus).filter(s => s === 'live').length}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300">Live Streams</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Users className="w-4 h-4 mr-2 text-blue-500" />
                    <span className="text-2xl font-bold text-slate-800 dark:text-white">{streamingSources.length}</span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300">Total Sources</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Signal className="w-4 h-4 mr-2 text-green-500" />
                    <span className="text-2xl font-bold text-slate-800 dark:text-white">
                      {Math.round((Object.values(liveStatus).filter(s => s === 'live').length / streamingSources.length) * 100)}%
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300">Availability</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Clock className="w-4 h-4 mr-2 text-purple-500" />
                    <span className="text-2xl font-bold text-slate-800 dark:text-white">
                      {Object.values(liveStatus).filter(s => s === 'scheduled').length}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300">Scheduled</p>
                </div>
              </div>
            </motion.div>
          </div>
        </FadeIn>

        {activeSection === 'satellite' && (
          <Suspense fallback={<div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" /></div>}>
            <SatelliteIntelligence />
          </Suspense>
        )}

        {activeSection === 'streams' && <>
        {/* Featured Live Streams */}
        {featuredSources.length > 0 && (
          <SlideIn direction="up" delay={0.3}>
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-4 flex items-center">
                <Zap className="w-6 h-6 mr-2 text-red-500" />
                Featured Live Streams
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {featuredSources.map((source, originalIndex) => {
                  const sourceIndex = streamingSources.findIndex(s => s.name === source.name);
                  return (
                    <motion.div
                      key={sourceIndex}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="relative"
                    >
                      <Card className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border-red-200 dark:border-red-800 shadow-lg hover:shadow-xl transition-all duration-300">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse mr-2" />
                              <Badge className="bg-red-500 text-white text-xs font-semibold px-2 py-1">
                                LIVE
                              </Badge>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleFavorite(sourceIndex)}
                              data-testid={`button-favorite-${sourceIndex}`}
                            >
                              <Heart className={`w-4 h-4 ${
                                favorites.includes(sourceIndex.toString()) 
                                  ? 'fill-red-500 text-red-500' 
                                  : 'text-gray-400'
                              }`} />
                            </Button>
                          </div>
                          <CardTitle className="text-lg flex items-center">
                            <Video className="w-5 h-5 mr-2 text-red-600" />
                            {source.name}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                            {source.description}
                          </p>
                          <Button 
                            onClick={() => openStream(source.url, source.name)}
                            className="w-full bg-red-600 hover:bg-red-700 text-white"
                            data-testid={`button-featured-stream-${sourceIndex}`}
                          >
                            <Play className="w-4 h-4 mr-2" />
                            Watch Live
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </SlideIn>
        )}

        {/* Premium Access Alert */}
        <SlideIn direction="up" delay={0.4}>
          <Card className="mb-8 bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 border-orange-200 dark:border-orange-800 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center text-orange-800 dark:text-orange-300">
                <DollarSign className="w-5 h-5 mr-2" />
                Premium Access Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5" />
                <div>
                  <p className="text-orange-700 dark:text-orange-300 mb-4">
                    Some streaming services require premium memberships. Disaster Direct monitors 
                    subscription status and provides automated alerts for service renewals.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" className="text-orange-700 border-orange-300 hover:bg-orange-100">
                      Manage Subscriptions
                    </Button>
                    <Button variant="outline" size="sm" className="text-orange-700 border-orange-300 hover:bg-orange-100">
                      View Access Status
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </SlideIn>

      {/* Live Streams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {streamingSources.map((source, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center">
                  <Video className="w-5 h-5 mr-2 text-blue-600" />
                  {source.name}
                </CardTitle>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                  {source.category}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-sm mb-4">
                {source.description}
              </p>
              <Button 
                onClick={() => openStream(source.url, source.name)}
                className="w-full"
                data-testid={`button-stream-${index}`}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Watch Live Stream
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Emergency Access Notice */}
      <Card className="mt-8 border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-800">🚨 Emergency Access Protocol</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-700">
            During active storm events, priority access will be automatically granted to all contractors 
            for critical weather monitoring and damage assessment operations.
          </p>
        </CardContent>
      </Card>
      </>}
      <ModuleAIAssistant moduleName="Eyes In The Sky" />
      
      <ModuleVoiceGuide moduleName="eyes-in-sky" />
      </div>
    </div>
  );
}