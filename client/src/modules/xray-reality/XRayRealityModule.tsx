import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Volume2, VolumeX, Eye } from 'lucide-react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';

// Import tab components
import AlertTicker from './parts/AlertTicker';
import LiveStormView from './tabs/LiveStormView';
import TrafficCams from './tabs/TrafficCams';
import StormChasers from './tabs/StormChasers';
import DroneFeeds from './tabs/DroneFeeds';
import OceanView from './tabs/OceanView';
import MeasureAndMark from './tabs/MeasureAndMark';
import Replays from './tabs/Replays';

export default function XRayRealityModule() {
  const [activeTab, setActiveTab] = useState('live-storm');
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  // Voice guide content
  const voiceGuideContent = {
    welcome: `Welcome to X-RAY REALITY, your advanced augmented reality storm operations module. This system provides live storm views with continuously refreshing radar and GOES satellite data on a 3D stage. You'll see traffic and DOT cameras, storm-chaser feeds, your drone feeds, and ocean views for coastal operations. The AR tools let you measure and mark hazards, draw cut lines, and create safe zones with voice guidance throughout.`,
    
    'live-storm': `The Live Storm View shows continuously refreshing radar with 1 to 5 minute updates and GOES satellite data with 5 to 10 minute refresh rates on a 3D stage for a live feel. Active NWS warnings scroll across the top. You can overlay ocean data including sea-surface temperature and wave heights for coastal operations.`,
    
    'traffic-cams': `Traffic Cams displays a 3 by 3 camera grid organized by state - Florida, Georgia, and Alabama - with one-click switching between states. These are live DOT camera feeds showing current road conditions and evacuation routes.`,
    
    'storm-chasers': `Storm Chasers shows embedded YouTube Live tiles from the best storm chasers currently broadcasting. These provide real-time ground truth of storm conditions from multiple locations.`,
    
    'drone-feeds': `Drone Feeds displays your on-scene video through WebRTC and RTMP to HLS panels. These show live footage from your drone operations for immediate situational awareness.`,
    
    'ocean-view': `Ocean View shows real-time sea surface temperature and wave height data critical for coastal storm operations. This helps assess storm intensity and coastal flooding risks.`,
    
    'measure-mark': `AR Measure and Mark tools work on phones, computers, and headsets. Drop hazard markers for energized lines, split trunks, or blocked egress. Draw cut lines and safe zones. Measure diameters, spans, and distances visually in augmented reality. The system includes lead triage overlay that auto-labels critical jobs and reorders by urgency and proximity to your crew.`,
    
    'replays': `Replays let you time scrub through the last 6 to 24 hours of radar and GOES data to show how storm cells moved across properties. This provides evidence capture and planning capabilities for your operations.`
  };

  const speakContent = (content: string) => {
    if (!isVoiceActive || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    
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
    setIsVoiceActive(true);
    speakContent(voiceGuideContent.welcome);
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (isVoiceActive) {
      const content = voiceGuideContent[tab as keyof typeof voiceGuideContent];
      if (content) {
        speakContent(content);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50"
      >
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
                  <p className="text-sm text-gray-600 dark:text-gray-400">Watch the storm in real time</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Voice Guide Toggle */}
              <Button
                variant={isVoiceActive ? "default" : "outline"}
                size="sm"
                onClick={isVoiceActive ? (isPlaying ? stopSpeaking : () => speakContent(voiceGuideContent[activeTab as keyof typeof voiceGuideContent] || voiceGuideContent.welcome)) : startVoiceGuide}
                className="gap-2"
              >
                {isPlaying ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                {isPlaying ? 'Stop Guide' : isVoiceActive ? 'Voice Guide' : 'Start Guide'}
              </Button>

              {/* Status Badges */}
              <div className="hidden sm:flex items-center space-x-2 text-xs">
                <div className="flex items-center space-x-1 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 px-2 py-1 rounded">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>Radar</span>
                </div>
                <div className="flex items-center space-x-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span>Satellite</span>
                </div>
                <div className="flex items-center space-x-1 bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-200 px-2 py-1 rounded">
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                  <span>AR</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Alert Ticker */}
      <AlertTicker />

      {/* Main Content */}
      <div className="container mx-auto px-6 py-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
            <TabsList className="grid w-full grid-cols-7 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
              <TabsTrigger value="live-storm" className="gap-2 text-xs">
                Live Storm
              </TabsTrigger>
              <TabsTrigger value="traffic-cams" className="gap-2 text-xs">
                Traffic Cams
              </TabsTrigger>
              <TabsTrigger value="storm-chasers" className="gap-2 text-xs">
                Chasers
              </TabsTrigger>
              <TabsTrigger value="drone-feeds" className="gap-2 text-xs">
                Drones
              </TabsTrigger>
              <TabsTrigger value="ocean-view" className="gap-2 text-xs">
                Ocean
              </TabsTrigger>
              <TabsTrigger value="measure-mark" className="gap-2 text-xs">
                AR Tools
              </TabsTrigger>
              <TabsTrigger value="replays" className="gap-2 text-xs">
                Replays
              </TabsTrigger>
            </TabsList>

            <TabsContent value="live-storm" className="space-y-0">
              <LiveStormView />
            </TabsContent>

            <TabsContent value="traffic-cams" className="space-y-0">
              <TrafficCams />
            </TabsContent>

            <TabsContent value="storm-chasers" className="space-y-0">
              <StormChasers />
            </TabsContent>

            <TabsContent value="drone-feeds" className="space-y-0">
              <DroneFeeds />
            </TabsContent>

            <TabsContent value="ocean-view" className="space-y-0">
              <OceanView />
            </TabsContent>

            <TabsContent value="measure-mark" className="space-y-0">
              <MeasureAndMark />
            </TabsContent>

            <TabsContent value="replays" className="space-y-0">
              <Replays />
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}