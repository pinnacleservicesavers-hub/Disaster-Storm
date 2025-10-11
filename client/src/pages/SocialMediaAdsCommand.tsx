import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Target, MapPin, Zap, Radio, Wind, TrendingUp, Users, 
  DollarSign, Clock, Activity, Play, Pause, Edit, Trash2,
  Plus, Eye, BarChart3, Facebook, Youtube, Instagram, 
  Search, CheckCircle, XCircle, AlertTriangle, Settings,
  Map, Crosshair, Circle, Radar, Smartphone, MousePointer
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { FadeIn, ScaleIn, StaggerContainer, StaggerItem } from '@/components/ui/animations';
import { apiRequest } from '@/lib/queryClient';

interface GeoFence {
  id: string;
  name: string;
  description?: string;
  stormId?: string;
  centerLat: number;
  centerLng: number;
  radiusMiles: number;
  status: string;
  devicesCaptured: number;
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  createdAt: string;
  expiresAt?: string;
}

interface AdCampaign {
  id: string;
  name: string;
  description?: string;
  geoFenceId?: string;
  stormId?: string;
  platforms: string[];
  adCopy: string;
  callToAction: string;
  status: string;
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  dailyBudget?: number;
  totalBudget?: number;
  weatherTriggers?: any;
  autoActivate?: boolean;
  createdAt: string;
}

export default function SocialMediaAdsCommand() {
  const [activeTab, setActiveTab] = useState('overview');
  const [showCreateGeoFence, setShowCreateGeoFence] = useState(false);
  const [showCreateCampaign, setShowCreateCampaign] = useState(false);
  
  // New geo-fence form state
  const [newGeoFence, setNewGeoFence] = useState({
    name: '',
    centerLat: 28.5383,
    centerLng: -81.3792,
    radiusMiles: 25,
    stormId: ''
  });

  // New campaign form state
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    description: '',
    geoFenceId: '',
    platforms: [] as string[],
    adCopy: '🚨 Storm Damage? We\'re Local, Licensed, and Already Clearing Roads. Free Estimate – Call Shannon at 706-840-8949.',
    callToAction: 'Call Now',
    phoneNumber: '706-840-8949',
    dailyBudget: 50,
    totalBudget: 500,
    autoActivate: false,
    weatherTriggers: {
      windSpeedMph: 45,
      conditions: ['hurricane', 'tropical_storm', 'severe_thunderstorm']
    }
  });

  const queryClient = useQueryClient();

  // Fetch geo-fences
  const { data: geoFences = [] } = useQuery<GeoFence[]>({
    queryKey: ['ad-geo-fences'],
    queryFn: async () => {
      const response = await fetch('/api/ads/geo-fences');
      if (!response.ok) return [];
      const data = await response.json();
      return data.geoFences || [];
    },
    refetchInterval: 15000
  });

  // Fetch campaigns
  const { data: campaigns = [] } = useQuery<AdCampaign[]>({
    queryKey: ['ad-campaigns'],
    queryFn: async () => {
      const response = await fetch('/api/ads/campaigns');
      if (!response.ok) return [];
      const data = await response.json();
      return data.campaigns || [];
    },
    refetchInterval: 15000
  });

  // Fetch storm predictions for linking
  const { data: stormPredictions = [] } = useQuery({
    queryKey: ['storm-predictions'],
    queryFn: async () => {
      const response = await fetch('/api/storm-predictions');
      const data = await response.json();
      return data.predictions || [];
    }
  });

  // Create geo-fence mutation
  const createGeoFenceMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('/api/ads/geo-fences', {
        method: 'POST',
        body: JSON.stringify(newGeoFence)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ad-geo-fences'] });
      setShowCreateGeoFence(false);
      setNewGeoFence({ name: '', centerLat: 28.5383, centerLng: -81.3792, radiusMiles: 25, stormId: '' });
    }
  });

  // Create campaign mutation
  const createCampaignMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('/api/ads/campaigns', {
        method: 'POST',
        body: JSON.stringify(newCampaign)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ad-campaigns'] });
      setShowCreateCampaign(false);
    }
  });

  // Update campaign status mutation
  const updateCampaignStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return apiRequest(`/api/ads/campaigns/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ad-campaigns'] });
    }
  });

  const togglePlatform = (platform: string) => {
    setNewCampaign(prev => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter(p => p !== platform)
        : [...prev.platforms, platform]
    }));
  };

  const getPlatformIcon = (platform: string) => {
    switch(platform) {
      case 'meta': return <Facebook className="w-4 h-4" />;
      case 'google': return <Search className="w-4 h-4" />;
      case 'instagram': return <Instagram className="w-4 h-4" />;
      case 'youtube': return <Youtube className="w-4 h-4" />;
      default: return <Radio className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'active': return 'bg-green-500';
      case 'paused': return 'bg-yellow-500';
      case 'draft': return 'bg-gray-500';
      case 'completed': return 'bg-blue-500';
      case 'expired': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const activeGeoFences = geoFences.filter(g => g.status === 'active');
  const activeCampaigns = campaigns.filter(c => c.status === 'active');
  const totalSpend = campaigns.reduce((sum, c) => sum + Number(c.spend), 0);
  const totalImpressions = campaigns.reduce((sum, c) => sum + c.impressions, 0);
  const totalClicks = campaigns.reduce((sum, c) => sum + c.clicks, 0);
  const totalConversions = campaigns.reduce((sum, c) => sum + c.conversions, 0);

  return (
    <div className="space-y-6 p-6" data-testid="social-media-ads-command">
      {/* Hero Header */}
      <FadeIn>
        <div className="relative overflow-hidden bg-gradient-to-r from-pink-900 via-purple-900 to-indigo-900 dark:from-pink-800 dark:via-purple-800 dark:to-indigo-800 rounded-xl border border-slate-200 dark:border-slate-700 p-8">
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
                <div className="p-3 bg-pink-500/20 rounded-xl">
                  <Target className="h-10 w-10 text-pink-400" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">Social Media Ads Command Center</h1>
                  <p className="text-pink-200 mt-1">Multi-Platform Geo-Fencing & Weather-Triggered Campaigns</p>
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
            <div className="grid grid-cols-5 gap-4 mt-6">
              <Card className="bg-white/10 border-white/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-pink-200 text-sm">Active Geo-Fences</p>
                      <p className="text-3xl font-bold text-white">{activeGeoFences.length}</p>
                    </div>
                    <Crosshair className="w-8 h-8 text-pink-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/10 border-white/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-pink-200 text-sm">Active Campaigns</p>
                      <p className="text-3xl font-bold text-white">{activeCampaigns.length}</p>
                    </div>
                    <Radio className="w-8 h-8 text-purple-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/10 border-white/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-pink-200 text-sm">Total Impressions</p>
                      <p className="text-3xl font-bold text-white">{totalImpressions.toLocaleString()}</p>
                    </div>
                    <Eye className="w-8 h-8 text-blue-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/10 border-white/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-pink-200 text-sm">Total Clicks</p>
                      <p className="text-3xl font-bold text-white">{totalClicks.toLocaleString()}</p>
                    </div>
                    <MousePointer className="w-8 h-8 text-green-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/10 border-white/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-pink-200 text-sm">Total Spend</p>
                      <p className="text-3xl font-bold text-white">${totalSpend.toLocaleString()}</p>
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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" data-testid="tab-overview">
            <Eye className="w-4 h-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="geo-fences" data-testid="tab-geo-fences">
            <Crosshair className="w-4 h-4 mr-2" />
            Geo-Fences
          </TabsTrigger>
          <TabsTrigger value="campaigns" data-testid="tab-campaigns">
            <Radio className="w-4 h-4 mr-2" />
            Campaigns
          </TabsTrigger>
          <TabsTrigger value="analytics" data-testid="tab-analytics">
            <BarChart3 className="w-4 h-4 mr-2" />
            Analytics
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
                      <Map className="w-5 h-5 mr-2" />
                      Geo-Capture Strategy
                    </CardTitle>
                    <CardDescription>
                      Draw digital fences around storm-impacted areas to capture device IDs for targeted advertising
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <h4 className="font-medium mb-2">How Geo-Capture Works:</h4>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li>✓ Define target area around storm impact zone</li>
                        <li>✓ Tag every smartphone that enters the geo-fence</li>
                        <li>✓ Build custom audience for retargeting ads</li>
                        <li>✓ Follow up for 30 days with storm cleanup ads</li>
                        <li>✓ Auto-activate when wind gusts exceed threshold</li>
                      </ul>
                    </div>

                    <Button 
                      className="w-full mb-4" 
                      onClick={() => setShowCreateGeoFence(!showCreateGeoFence)}
                      data-testid="button-create-geofence"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      {showCreateGeoFence ? 'Cancel' : 'Create Geo-Fence'}
                    </Button>

                    {showCreateGeoFence && (
                      <Card className="border-2 border-purple-500">
                        <CardHeader>
                          <CardTitle>Create New Geo-Fence</CardTitle>
                          <CardDescription>
                            Define a geographic area to capture devices for targeted advertising
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <Label>Geo-Fence Name</Label>
                            <Input 
                              value={newGeoFence.name}
                              onChange={(e) => setNewGeoFence({ ...newGeoFence, name: e.target.value })}
                              placeholder="e.g., Hurricane Alexandra - Panama City"
                              data-testid="input-geofence-name"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>Center Latitude</Label>
                              <Input 
                                type="number"
                                step="0.0001"
                                value={newGeoFence.centerLat}
                                onChange={(e) => setNewGeoFence({ ...newGeoFence, centerLat: parseFloat(e.target.value) })}
                                data-testid="input-center-lat"
                              />
                            </div>
                            <div>
                              <Label>Center Longitude</Label>
                              <Input 
                                type="number"
                                step="0.0001"
                                value={newGeoFence.centerLng}
                                onChange={(e) => setNewGeoFence({ ...newGeoFence, centerLng: parseFloat(e.target.value) })}
                                data-testid="input-center-lng"
                              />
                            </div>
                          </div>

                          <div>
                            <Label>Radius (miles)</Label>
                            <Input 
                              type="number"
                              value={newGeoFence.radiusMiles}
                              onChange={(e) => setNewGeoFence({ ...newGeoFence, radiusMiles: parseInt(e.target.value) })}
                              data-testid="input-radius"
                            />
                          </div>

                          <div>
                            <Label>Link to Storm (Optional)</Label>
                            <select 
                              value={newGeoFence.stormId}
                              onChange={(e) => setNewGeoFence({ ...newGeoFence, stormId: e.target.value })}
                              className="w-full p-2 border rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800"
                              data-testid="select-storm"
                            >
                              <option value="">None</option>
                              {stormPredictions.map((storm: any) => (
                                <option key={storm.stormId} value={storm.stormId}>
                                  {storm.stormName || storm.stormId}
                                </option>
                              ))}
                            </select>
                          </div>

                          <Button 
                            onClick={() => createGeoFenceMutation.mutate()}
                            disabled={!newGeoFence.name || createGeoFenceMutation.isPending}
                            className="w-full"
                            data-testid="button-save-geofence"
                          >
                            {createGeoFenceMutation.isPending ? 'Creating...' : 'Create Geo-Fence'}
                          </Button>
                        </CardContent>
                      </Card>
                    )}
                  </CardContent>
                </Card>
              </StaggerItem>

              <StaggerItem>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Radio className="w-5 h-5 mr-2" />
                      Multi-Platform Campaigns
                    </CardTitle>
                    <CardDescription>
                      Run ads across Meta, Google, Instagram, and YouTube from one dashboard
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <div className="flex items-center mb-2">
                          <Facebook className="w-5 h-5 mr-2 text-blue-600" />
                          <span className="font-medium">Meta / Facebook</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Location radius as small as 1 mile</p>
                      </div>

                      <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <div className="flex items-center mb-2">
                          <Youtube className="w-5 h-5 mr-2 text-red-600" />
                          <span className="font-medium">YouTube</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Video ads in storm zones</p>
                      </div>

                      <div className="p-3 bg-pink-50 dark:bg-pink-900/20 border border-pink-200 dark:border-pink-800 rounded-lg">
                        <div className="flex items-center mb-2">
                          <Instagram className="w-5 h-5 mr-2 text-pink-600" />
                          <span className="font-medium">Instagram</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Stories & feed ads</p>
                      </div>

                      <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                        <div className="flex items-center mb-2">
                          <Search className="w-5 h-5 mr-2 text-green-600" />
                          <span className="font-medium">Google Ads</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Search & display targeting</p>
                      </div>
                    </div>

                    <Button 
                      className="w-full mb-4" 
                      variant="secondary"
                      onClick={() => setShowCreateCampaign(!showCreateCampaign)}
                      data-testid="button-create-campaign"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      {showCreateCampaign ? 'Cancel' : 'Create Campaign'}
                    </Button>

                    {showCreateCampaign && (
                      <Card className="border-2 border-blue-500 max-h-[600px] overflow-y-auto">
                        <CardHeader>
                          <CardTitle>Create New Ad Campaign</CardTitle>
                          <CardDescription>
                            Set up a multi-platform advertising campaign with geo-targeting and weather triggers
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <Label>Campaign Name</Label>
                            <Input 
                              value={newCampaign.name}
                              onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                              placeholder="e.g., Hurricane Alexandra Emergency Response"
                              data-testid="input-campaign-name"
                            />
                          </div>

                          <div>
                            <Label>Select Geo-Fence</Label>
                            <select 
                              value={newCampaign.geoFenceId}
                              onChange={(e) => setNewCampaign({ ...newCampaign, geoFenceId: e.target.value })}
                              className="w-full p-2 border rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800"
                              data-testid="select-geofence"
                            >
                              <option value="">Select a geo-fence...</option>
                              {geoFences.map((fence) => (
                                <option key={fence.id} value={fence.id}>
                                  {fence.name} ({fence.radiusMiles} miles)
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <Label>Select Platforms</Label>
                            <div className="grid grid-cols-4 gap-2 mt-2">
                              {['meta', 'google', 'instagram', 'youtube'].map(platform => (
                                <Button
                                  key={platform}
                                  type="button"
                                  variant={newCampaign.platforms.includes(platform) ? "default" : "outline"}
                                  onClick={() => togglePlatform(platform)}
                                  className="w-full"
                                  data-testid={`button-platform-${platform}`}
                                >
                                  {getPlatformIcon(platform)}
                                  <span className="ml-2 capitalize">{platform}</span>
                                </Button>
                              ))}
                            </div>
                          </div>

                          <div>
                            <Label>Ad Copy</Label>
                            <Textarea 
                              value={newCampaign.adCopy}
                              onChange={(e) => setNewCampaign({ ...newCampaign, adCopy: e.target.value })}
                              rows={3}
                              placeholder="Your ad text..."
                              data-testid="textarea-ad-copy"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>Daily Budget ($)</Label>
                              <Input 
                                type="number"
                                value={newCampaign.dailyBudget}
                                onChange={(e) => setNewCampaign({ ...newCampaign, dailyBudget: parseFloat(e.target.value) })}
                                data-testid="input-daily-budget"
                              />
                            </div>
                            <div>
                              <Label>Total Budget ($)</Label>
                              <Input 
                                type="number"
                                value={newCampaign.totalBudget}
                                onChange={(e) => setNewCampaign({ ...newCampaign, totalBudget: parseFloat(e.target.value) })}
                                data-testid="input-total-budget"
                              />
                            </div>
                          </div>

                          <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                            <div className="flex items-center mb-2">
                              <Wind className="w-5 h-5 mr-2 text-orange-600" />
                              <h4 className="font-medium">Weather Trigger</h4>
                            </div>
                            <div className="flex items-center space-x-4 mt-3">
                              <div className="flex-1">
                                <Label className="text-sm">Wind Speed Threshold (mph)</Label>
                                <Input 
                                  type="number"
                                  value={newCampaign.weatherTriggers?.windSpeedMph || 45}
                                  onChange={(e) => setNewCampaign({ 
                                    ...newCampaign, 
                                    weatherTriggers: { 
                                      ...newCampaign.weatherTriggers, 
                                      windSpeedMph: parseInt(e.target.value) 
                                    }
                                  })}
                                  className="mt-1"
                                  data-testid="input-wind-threshold"
                                />
                              </div>
                              <div className="flex items-center space-x-2 mt-6">
                                <input 
                                  type="checkbox"
                                  checked={newCampaign.autoActivate}
                                  onChange={(e) => setNewCampaign({ ...newCampaign, autoActivate: e.target.checked })}
                                  className="w-4 h-4"
                                  data-testid="checkbox-auto-activate"
                                />
                                <Label className="text-sm">Auto-Activate</Label>
                              </div>
                            </div>
                          </div>

                          <Button 
                            onClick={() => createCampaignMutation.mutate()}
                            disabled={!newCampaign.name || newCampaign.platforms.length === 0 || createCampaignMutation.isPending}
                            className="w-full"
                            data-testid="button-save-campaign"
                          >
                            {createCampaignMutation.isPending ? 'Creating...' : 'Create Campaign'}
                          </Button>
                        </CardContent>
                      </Card>
                    )}
                  </CardContent>
                </Card>
              </StaggerItem>
            </div>
          </StaggerContainer>
        </TabsContent>

        {/* Geo-Fences Tab */}
        <TabsContent value="geo-fences" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Crosshair className="w-5 h-5 mr-2" />
                  Active Geo-Fences
                </div>
                <Badge>{geoFences.length} Total</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {geoFences.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Map className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p>No geo-fences created yet. Create one to start capturing device audiences.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {geoFences.map((fence) => (
                    <motion.div
                      key={fence.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="p-4 border rounded-lg hover:border-pink-500 transition-colors"
                      data-testid={`geofence-${fence.id}`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <Badge className={getStatusColor(fence.status)}>
                            {fence.status}
                          </Badge>
                          <h3 className="font-medium">{fence.name}</h3>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {fence.radiusMiles} miles radius
                        </span>
                      </div>

                      <div className="grid grid-cols-5 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Location</p>
                          <p className="font-medium">{fence.centerLat.toFixed(4)}, {fence.centerLng.toFixed(4)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Devices</p>
                          <p className="font-medium">{fence.devicesCaptured.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Impressions</p>
                          <p className="font-medium">{fence.impressions.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Clicks</p>
                          <p className="font-medium">{fence.clicks.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Spend</p>
                          <p className="font-medium">${fence.spend.toLocaleString()}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Campaigns Tab */}
        <TabsContent value="campaigns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Radio className="w-5 h-5 mr-2" />
                  Ad Campaigns
                </div>
                <Badge>{campaigns.length} Total</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {campaigns.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Radio className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p>No campaigns created yet. Create a campaign to start advertising.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {campaigns.map((campaign) => (
                    <motion.div
                      key={campaign.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="p-4 border rounded-lg hover:border-purple-500 transition-colors"
                      data-testid={`campaign-${campaign.id}`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <Badge className={getStatusColor(campaign.status)}>
                            {campaign.status}
                          </Badge>
                          <h3 className="font-medium">{campaign.name}</h3>
                        </div>
                        <div className="flex items-center space-x-2">
                          {campaign.platforms.map(platform => (
                            <div key={platform} className="p-1 bg-gray-100 dark:bg-gray-800 rounded">
                              {getPlatformIcon(platform)}
                            </div>
                          ))}
                        </div>
                      </div>

                      <p className="text-sm text-muted-foreground mb-3">{campaign.adCopy}</p>

                      <div className="grid grid-cols-5 gap-4 text-sm mb-3">
                        <div>
                          <p className="text-muted-foreground">Budget</p>
                          <p className="font-medium">${campaign.dailyBudget}/day</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Impressions</p>
                          <p className="font-medium">{campaign.impressions.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Clicks</p>
                          <p className="font-medium">{campaign.clicks.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Conversions</p>
                          <p className="font-medium">{campaign.conversions}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Spend</p>
                          <p className="font-medium">${campaign.spend.toLocaleString()}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        {campaign.status === 'active' ? (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => updateCampaignStatusMutation.mutate({ id: campaign.id, status: 'paused' })}
                          >
                            <Pause className="w-4 h-4 mr-1" />
                            Pause
                          </Button>
                        ) : campaign.status === 'paused' ? (
                          <Button 
                            size="sm"
                            onClick={() => updateCampaignStatusMutation.mutate({ id: campaign.id, status: 'active' })}
                          >
                            <Play className="w-4 h-4 mr-1" />
                            Resume
                          </Button>
                        ) : null}
                        
                        {campaign.autoActivate && (
                          <Badge variant="outline" className="border-orange-500 text-orange-600">
                            <Wind className="w-3 h-3 mr-1" />
                            Auto-Activate @ {campaign.weatherTriggers?.windSpeedMph}mph
                          </Badge>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Performance Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <span className="text-sm font-medium">Click-Through Rate (CTR)</span>
                    <span className="text-2xl font-bold">
                      {totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : 0}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <span className="text-sm font-medium">Conversion Rate</span>
                    <span className="text-2xl font-bold">
                      {totalClicks > 0 ? ((totalConversions / totalClicks) * 100).toFixed(2) : 0}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <span className="text-sm font-medium">Cost Per Click (CPC)</span>
                    <span className="text-2xl font-bold">
                      ${totalClicks > 0 ? (totalSpend / totalClicks).toFixed(2) : 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                    <span className="text-sm font-medium">Cost Per Conversion</span>
                    <span className="text-2xl font-bold">
                      ${totalConversions > 0 ? (totalSpend / totalConversions).toFixed(2) : 0}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Platform Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center">
                      <Facebook className="w-5 h-5 mr-2 text-blue-600" />
                      <span className="font-medium">Meta / Facebook</span>
                    </div>
                    <Badge>Coming Soon</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center">
                      <Search className="w-5 h-5 mr-2 text-green-600" />
                      <span className="font-medium">Google Ads</span>
                    </div>
                    <Badge>Coming Soon</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center">
                      <Instagram className="w-5 h-5 mr-2 text-pink-600" />
                      <span className="font-medium">Instagram</span>
                    </div>
                    <Badge>Coming Soon</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center">
                      <Youtube className="w-5 h-5 mr-2 text-red-600" />
                      <span className="font-medium">YouTube</span>
                    </div>
                    <Badge>Coming Soon</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
