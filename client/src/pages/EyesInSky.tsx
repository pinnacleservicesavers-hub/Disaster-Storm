import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FadeIn, ScaleIn, SlideIn } from '@/components/ui/animations';
import { Video, ExternalLink, AlertCircle, DollarSign, Play, Users, Signal, Zap, Heart, Filter, Search, Clock, Volume2, VolumeX } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

export default function EyesInSky() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [liveStatus, setLiveStatus] = useState<{[key: string]: 'live' | 'offline' | 'scheduled'}>({});
  const [isVoiceGuideActive, setIsVoiceGuideActive] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

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
      
      const voiceContent = `Welcome to Eyes in the Sky! This aerial surveillance platform aggregates live storm chasing streams, weather reconnaissance feeds, and satellite imagery for comprehensive sky-level monitoring. The dashboard displays categorized streaming sources including professional storm chasers, meteorologist channels, and weather intelligence feeds. You can filter by category such as live chasing, YouTube channels, or weather intelligence. Each feed shows live status indicators - live, offline, or scheduled. The favorites system lets you bookmark frequently used streams. Search functionality helps you quickly find specific weather events or regions. All feeds are external links that open professional storm tracking and meteorological analysis streams. This gives you real-time aerial perspective on developing weather situations across the country.`;
      
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-blue-900 dark:to-indigo-900">
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
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={startVoiceGuide}
                  className="flex items-center gap-2 bg-white/80 hover:bg-white border-blue-200 hover:border-blue-300 text-blue-700 hover:text-blue-800 backdrop-blur-sm transition-all duration-300 shadow-lg hover:shadow-xl"
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
                    Some streaming services require premium memberships. DisasterDirect monitors 
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
      </div>
    </div>
  );
}