import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Eye } from 'lucide-react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import VoiceGuide from '@/components/VoiceGuide';

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
              {/* Voice Guide */}
              <VoiceGuide currentPortal="xray" />

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
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
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