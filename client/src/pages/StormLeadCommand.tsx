import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Target, MapPin, Zap, Radio, Wind, TrendingUp, Users, 
  DollarSign, Clock, Activity, AlertTriangle, CheckCircle,
  Twitter, Facebook, Instagram, Globe, Radar, Cloud,
  PlayCircle, PauseCircle, RefreshCw, Settings, Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { FadeIn, ScaleIn, StaggerContainer, StaggerItem } from '@/components/ui/animations';
import { apiRequest } from '@/lib/queryClient';

interface GeoCaptureZone {
  id: string;
  centerLat: number;
  centerLng: number;
  radiusMiles: number;
  stormId: string;
  createdAt: string;
  expiresAt: string;
  devicesCaptured: number;
  leadsGenerated: number;
  status: 'active' | 'expired';
}

interface SocialMediaPost {
  platform: 'twitter' | 'facebook' | 'instagram';
  postId: string;
  username: string;
  content: string;
  location?: { lat: number; lng: number; address: string };
  timestamp: string;
  keywords: string[];
  damageType?: string;
  urgency: 'low' | 'medium' | 'high' | 'emergency';
}

interface LeadSource {
  type: 'prediction' | 'social_media' | 'geo_capture' | 'weather_trigger';
  confidence: number;
  data: any;
}

export default function StormLeadCommand() {
  const [activeTab, setActiveTab] = useState('overview');
  const [monitoringActive, setMonitoringActive] = useState(false);
  const [selectedStormId, setSelectedStormId] = useState('');
  const [socialKeywords, setSocialKeywords] = useState('tree on home, storm damage, roof damage');
  const [weatherThreshold, setWeatherThreshold] = useState(45);
  
  const queryClient = useQueryClient();

  // Fetch geo-capture zones
  const { data: geoCaptureZones = [] } = useQuery<GeoCaptureZone[]>({
    queryKey: ['geo-capture-zones'],
    queryFn: async () => {
      const response = await fetch('/api/storm-leads/geo-capture-zones');
      const data = await response.json();
      return data.zones || [];
    },
    refetchInterval: 10000 // Refresh every 10 seconds
  });

  // Fetch storm predictions
  const { data: stormPredictions = [] } = useQuery({
    queryKey: ['storm-predictions'],
    queryFn: async () => {
      const response = await fetch('/api/predictions/all');
      const data = await response.json();
      return data || [];
    }
  });

  // Generate leads from storm prediction mutation
  const generateLeadsMutation = useMutation({
    mutationFn: async (stormId: string) => {
      return apiRequest(`/api/storm-leads/generate/${stormId}`, {
        method: 'POST'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['geo-capture-zones'] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    }
  });

  // Monitor social media mutation
  const monitorSocialMutation = useMutation({
    mutationFn: async () => {
      const keywords = socialKeywords.split(',').map(k => k.trim());
      return apiRequest('/api/storm-leads/monitor-social', {
        method: 'POST',
        body: JSON.stringify({
          keywords,
          location: { lat: 28.5383, lng: -81.3792 }, // Orlando, FL
          radiusMiles: 50
        })
      });
    },
    onSuccess: (data: any) => {
      console.log(`Found ${data.postsFound} posts, created ${data.leadsCreated} leads`);
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    }
  });

  // Setup weather trigger mutation
  const setupWeatherTriggerMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('/api/storm-leads/setup-trigger', {
        method: 'POST',
        body: JSON.stringify({
          windSpeedMph: weatherThreshold,
          county: 'Orange',
          state: 'Florida'
        })
      });
    }
  });

  const handleGenerateLeads = () => {
    if (selectedStormId) {
      generateLeadsMutation.mutate(selectedStormId);
    }
  };

  const handleToggleSocialMonitoring = () => {
    if (!monitoringActive) {
      monitorSocialMutation.mutate();
      setMonitoringActive(true);
    } else {
      setMonitoringActive(false);
    }
  };

  const handleSetupWeatherTrigger = () => {
    setupWeatherTriggerMutation.mutate();
  };

  const getPlatformIcon = (platform: string) => {
    switch(platform) {
      case 'twitter': return <Twitter className="w-4 h-4" />;
      case 'facebook': return <Facebook className="w-4 h-4" />;
      case 'instagram': return <Instagram className="w-4 h-4" />;
      default: return <Globe className="w-4 h-4" />;
    }
  };

  const activeZonesCount = geoCaptureZones.filter(z => z.status === 'active').length;
  const totalDevicesCaptured = geoCaptureZones.reduce((sum, z) => sum + z.devicesCaptured, 0);
  const totalLeadsFromZones = geoCaptureZones.reduce((sum, z) => sum + z.leadsGenerated, 0);

  return (
    <div className="space-y-6 p-6" data-testid="storm-lead-command">
      {/* Hero Header */}
      <FadeIn>
        <div className="relative overflow-hidden bg-gradient-to-r from-purple-900 via-indigo-900 to-blue-900 dark:from-purple-800 dark:via-indigo-800 dark:to-blue-800 rounded-xl border border-slate-200 dark:border-slate-700 p-8">
          <div className="absolute inset-0 opacity-20">
            <motion.div
              className="absolute inset-0"
              animate={{
                backgroundPosition: ['0% 0%', '100% 100%'],
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: "linear"
              }}
              style={{
                backgroundImage: 'radial-gradient(circle at center, white 1px, transparent 1px)',
                backgroundSize: '50px 50px'
              }}
            />
          </div>
          
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-purple-500/20 rounded-xl">
                  <Target className="h-10 w-10 text-purple-400" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">Storm Lead Intelligence</h1>
                  <p className="text-purple-200 mt-1">Automated Lead Capture & Geo-Marketing Command Center</p>
                </div>
              </div>
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Badge className="bg-green-500 text-white text-lg px-4 py-2">
                  <Activity className="w-4 h-4 mr-2" />
                  LIVE
                </Badge>
              </motion.div>
            </div>

            {/* Real-time Stats */}
            <div className="grid grid-cols-4 gap-4 mt-6">
              <Card className="bg-white/10 border-white/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-200 text-sm">Active Zones</p>
                      <p className="text-3xl font-bold text-white">{activeZonesCount}</p>
                    </div>
                    <Radar className="w-8 h-8 text-purple-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/10 border-white/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-200 text-sm">Devices Captured</p>
                      <p className="text-3xl font-bold text-white">{totalDevicesCaptured.toLocaleString()}</p>
                    </div>
                    <Users className="w-8 h-8 text-blue-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/10 border-white/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-200 text-sm">Leads Generated</p>
                      <p className="text-3xl font-bold text-white">{totalLeadsFromZones}</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-green-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/10 border-white/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-200 text-sm">Est. Value</p>
                      <p className="text-3xl font-bold text-white">${(totalLeadsFromZones * 8500).toLocaleString()}</p>
                    </div>
                    <DollarSign className="w-8 h-8 text-yellow-400" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </FadeIn>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" data-testid="tab-overview">
            <Eye className="w-4 h-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="geo-capture" data-testid="tab-geo-capture">
            <Radar className="w-4 h-4 mr-2" />
            Geo-Capture
          </TabsTrigger>
          <TabsTrigger value="social-media" data-testid="tab-social-media">
            <Twitter className="w-4 h-4 mr-2" />
            Social Media
          </TabsTrigger>
          <TabsTrigger value="weather-triggers" data-testid="tab-weather-triggers">
            <Cloud className="w-4 h-4 mr-2" />
            Weather Triggers
          </TabsTrigger>
          <TabsTrigger value="automation" data-testid="tab-automation">
            <Zap className="w-4 h-4 mr-2" />
            Automation
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <StaggerContainer>
            <div className="grid grid-cols-2 gap-4">
              <StaggerItem>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Target className="w-5 h-5 mr-2" />
                      Storm-Based Lead Generation
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Automatically generate contractor leads from AI storm predictions and damage forecasts
                    </p>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Select Storm:</label>
                      <select 
                        value={selectedStormId}
                        onChange={(e) => setSelectedStormId(e.target.value)}
                        className="w-full p-2 border rounded-md"
                        data-testid="select-storm"
                      >
                        <option value="">Choose a storm...</option>
                        {stormPredictions.map((storm: any) => (
                          <option key={storm.id} value={storm.stormId}>
                            {storm.stormName || storm.stormId} - {storm.stormType}
                          </option>
                        ))}
                      </select>
                    </div>

                    <Button 
                      onClick={handleGenerateLeads}
                      disabled={!selectedStormId || generateLeadsMutation.isPending}
                      className="w-full"
                      data-testid="button-generate-leads"
                    >
                      {generateLeadsMutation.isPending ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4 mr-2" />
                          Generate Leads from Storm
                        </>
                      )}
                    </Button>

                    {generateLeadsMutation.isSuccess && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md"
                      >
                        <div className="flex items-center text-green-800 dark:text-green-200">
                          <CheckCircle className="w-5 h-5 mr-2" />
                          <span className="text-sm">
                            Generated {(generateLeadsMutation.data as any)?.result?.leadsCreated || 0} leads successfully!
                          </span>
                        </div>
                      </motion.div>
                    )}
                  </CardContent>
                </Card>
              </StaggerItem>

              <StaggerItem>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Activity className="w-5 h-5 mr-2" />
                      Lead Sources Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                        <div className="flex items-center">
                          <Radar className="w-4 h-4 mr-2 text-purple-600" />
                          <span className="text-sm font-medium">AI Storm Predictions</span>
                        </div>
                        <Badge>{stormPredictions.length} Active</Badge>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div className="flex items-center">
                          <Twitter className="w-4 h-4 mr-2 text-blue-600" />
                          <span className="text-sm font-medium">Social Media Monitoring</span>
                        </div>
                        <Badge variant={monitoringActive ? "default" : "outline"}>
                          {monitoringActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-2 text-green-600" />
                          <span className="text-sm font-medium">Geo-Capture Zones</span>
                        </div>
                        <Badge>{activeZonesCount} Zones</Badge>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                        <div className="flex items-center">
                          <Wind className="w-4 h-4 mr-2 text-orange-600" />
                          <span className="text-sm font-medium">Weather Triggers</span>
                        </div>
                        <Badge variant="outline">Setup Required</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </StaggerItem>
            </div>
          </StaggerContainer>
        </TabsContent>

        {/* Geo-Capture Tab */}
        <TabsContent value="geo-capture" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Radar className="w-5 h-5 mr-2" />
                Active Geo-Capture Zones
              </CardTitle>
            </CardHeader>
            <CardContent>
              {geoCaptureZones.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MapPin className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p>No active geo-capture zones. Generate leads from a storm to create zones.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {geoCaptureZones.map((zone) => (
                    <motion.div
                      key={zone.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="p-4 border rounded-lg hover:border-purple-500 transition-colors"
                      data-testid={`zone-${zone.id}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Badge className={zone.status === 'active' ? 'bg-green-500' : 'bg-gray-500'}>
                            {zone.status}
                          </Badge>
                          <span className="font-medium">Storm {zone.stormId}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {zone.radiusMiles} miles radius
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-4 mt-3 text-sm">
                        <div>
                          <p className="text-muted-foreground">Location</p>
                          <p className="font-medium">{zone.centerLat.toFixed(4)}, {zone.centerLng.toFixed(4)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Devices Captured</p>
                          <p className="font-medium">{zone.devicesCaptured.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Leads Generated</p>
                          <p className="font-medium">{zone.leadsGenerated}</p>
                        </div>
                      </div>

                      <div className="mt-3 text-xs text-muted-foreground">
                        Expires: {new Date(zone.expiresAt).toLocaleString()}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Social Media Tab */}
        <TabsContent value="social-media" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Twitter className="w-5 h-5 mr-2" />
                Social Media Lead Capture
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Monitor Twitter, Facebook, and Instagram for storm damage posts and automatically convert them to contractor leads
              </p>

              <div className="space-y-2">
                <label className="text-sm font-medium">Keywords to Monitor:</label>
                <Input
                  value={socialKeywords}
                  onChange={(e) => setSocialKeywords(e.target.value)}
                  placeholder="tree on home, storm damage, roof damage"
                  data-testid="input-keywords"
                />
                <p className="text-xs text-muted-foreground">Comma-separated keywords</p>
              </div>

              <Button 
                onClick={handleToggleSocialMonitoring}
                className="w-full"
                variant={monitoringActive ? "destructive" : "default"}
                data-testid="button-toggle-monitoring"
              >
                {monitoringActive ? (
                  <>
                    <PauseCircle className="w-4 h-4 mr-2" />
                    Stop Monitoring
                  </>
                ) : (
                  <>
                    <PlayCircle className="w-4 h-4 mr-2" />
                    Start Monitoring
                  </>
                )}
              </Button>

              {monitorSocialMutation.isSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md"
                >
                  <div className="space-y-2">
                    <div className="flex items-center text-blue-800 dark:text-blue-200">
                      <CheckCircle className="w-5 h-5 mr-2" />
                      <span className="font-medium">Social Media Scan Complete</span>
                    </div>
                    <div className="text-sm text-blue-700 dark:text-blue-300">
                      Found {(monitorSocialMutation.data as any)?.postsFound || 0} posts, 
                      created {(monitorSocialMutation.data as any)?.leadsCreated || 0} leads
                    </div>
                  </div>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Weather Triggers Tab */}
        <TabsContent value="weather-triggers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Cloud className="w-5 h-5 mr-2" />
                Automated Weather Triggers
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Automatically generate leads when weather conditions meet your thresholds
              </p>

              <div className="space-y-2">
                <label className="text-sm font-medium">Wind Speed Threshold (mph):</label>
                <div className="flex items-center space-x-4">
                  <Input
                    type="number"
                    value={weatherThreshold}
                    onChange={(e) => setWeatherThreshold(Number(e.target.value))}
                    className="w-32"
                    data-testid="input-wind-threshold"
                  />
                  <span className="text-sm text-muted-foreground">
                    Current: {weatherThreshold} mph
                  </span>
                </div>
              </div>

              <Button 
                onClick={handleSetupWeatherTrigger}
                disabled={setupWeatherTriggerMutation.isPending}
                className="w-full"
                data-testid="button-setup-trigger"
              >
                {setupWeatherTriggerMutation.isPending ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Setting up...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Setup Weather Trigger
                  </>
                )}
              </Button>

              {setupWeatherTriggerMutation.isSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md"
                >
                  <div className="flex items-center text-green-800 dark:text-green-200">
                    <CheckCircle className="w-5 h-5 mr-2" />
                    <span className="text-sm">Weather trigger activated successfully!</span>
                  </div>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Automation Tab */}
        <TabsContent value="automation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Zap className="w-5 h-5 mr-2" />
                Marketing Automation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border border-dashed rounded-lg text-center">
                  <Settings className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Facebook Ads & Google Ads automation coming soon
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Automatically launch targeted ads in storm zones with geo-captured audiences
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
