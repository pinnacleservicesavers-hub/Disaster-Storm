import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Satellite, Clock, Eye, Camera, Send, Globe, ArrowUpDown, Cloud,
  AlertTriangle, CheckCircle, Loader2, MapPin, Zap, Image, ShoppingCart,
  Radio, BarChart3, Target, Crosshair, ArrowRight
} from 'lucide-react';

interface OverflightData {
  id: string;
  satelliteName: string;
  satelliteId: string;
  provider: string;
  constellation: string;
  overflightTime: string;
  duration: number;
  maxElevation: number;
  azimuth: number;
  direction: string;
  imagingCapable: boolean;
  resolution: string;
  swathWidth: number;
  predictedCloudCover: number;
  status: string;
}

interface ArchiveImageData {
  id: string;
  acquisitionDate: string;
  satellite: string;
  provider: string;
  resolution: string;
  cloudCover: number;
  thumbnailUrl: string;
  price: number;
  currency: string;
  area: number;
  quality: string;
  bands: string[];
  stormCorrelated: boolean;
  stormName?: string;
}

interface ConstellationSat {
  name: string;
  id: string;
  constellation: string;
  resolution: string;
  provider: string;
  status: string;
  lastAcquisition: string;
  orbitalAltitude: string;
}

export default function SatelliteIntelligence() {
  const [activeTab, setActiveTab] = useState('overflights');
  const [lat, setLat] = useState('29.7604');
  const [lon, setLon] = useState('-95.3698');
  const [taskingPriority, setTaskingPriority] = useState('routine');
  const [taskingResolution, setTaskingResolution] = useState('0.31m');
  const [taskingNotes, setTaskingNotes] = useState('');
  const [taskingCloudMax, setTaskingCloudMax] = useState('20');

  const { data: overflightsData, isLoading: loadingOverflights } = useQuery<any>({
    queryKey: [`/api/maxar/overflights?lat=${lat}&lon=${lon}`],
    enabled: activeTab === 'overflights',
    refetchInterval: 60000,
  });

  const { data: archiveData, isLoading: loadingArchive } = useQuery<any>({
    queryKey: [`/api/maxar/archive?lat=${lat}&lon=${lon}`],
    enabled: activeTab === 'archive',
  });

  const { data: constellationData, isLoading: loadingConstellation } = useQuery<any>({
    queryKey: ['/api/maxar/constellation'],
    enabled: activeTab === 'constellation',
  });

  const { data: searchData, isLoading: loadingSearch } = useQuery<any>({
    queryKey: [`/api/maxar/search?lat=${lat}&lon=${lon}`],
    enabled: activeTab === 'imagery',
  });

  const { data: taskingListData } = useQuery<any>({
    queryKey: ['/api/maxar/tasking'],
    enabled: activeTab === 'tasking',
  });

  const taskingMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest('POST', '/api/maxar/tasking', data);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/maxar/tasking'] });
      setTaskingNotes('');
    },
  });

  const beforeAfterMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest('POST', '/api/maxar/before-after', data);
      return res;
    },
  });

  const overflights: OverflightData[] = overflightsData?.overflights || [];
  const archiveImages: ArchiveImageData[] = archiveData?.images || [];
  const constellation: ConstellationSat[] = constellationData?.satellites || [];
  const searchResults = searchData?.results || [];
  const taskingRequests = taskingListData?.requests || [];
  const baAnalysis = beforeAfterMutation.data?.analysis;

  const getProviderColor = (provider: string) => {
    switch (provider) {
      case 'Maxar': return 'bg-blue-600 text-white';
      case 'Planet': return 'bg-green-600 text-white';
      case 'Airbus': return 'bg-purple-600 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'upcoming': return <Badge className="bg-blue-100 text-blue-800"><Clock className="w-3 h-3 mr-1" />Upcoming</Badge>;
      case 'in_progress': return <Badge className="bg-green-100 text-green-800 animate-pulse"><Radio className="w-3 h-3 mr-1" />Passing Now</Badge>;
      case 'completed': return <Badge className="bg-gray-100 text-gray-800"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'urgent': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'priority': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  const formatTime = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getTimeUntil = (isoString: string) => {
    const ms = new Date(isoString).getTime() - Date.now();
    if (ms < 0) return 'Now';
    const hours = Math.floor(ms / 3600000);
    const mins = Math.floor((ms % 3600000) / 60000);
    if (hours > 24) return `${Math.floor(hours / 24)}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-3 text-white">
            <Satellite className="w-8 h-8 text-cyan-400" />
            Satellite Intelligence Center
          </h2>
          <p className="text-slate-400 mt-1">
            Maxar Technologies + SpyMeSat — High-resolution imagery, overflight tracking, and satellite tasking
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-white/10 rounded-lg px-3 py-2 border border-white/20">
            <MapPin className="w-4 h-4 text-cyan-400" />
            <Input
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              className="w-24 h-7 bg-transparent border-0 text-white text-sm p-0 focus-visible:ring-0"
              placeholder="Lat"
            />
            <span className="text-white/40">,</span>
            <Input
              value={lon}
              onChange={(e) => setLon(e.target.value)}
              className="w-24 h-7 bg-transparent border-0 text-white text-sm p-0 focus-visible:ring-0"
              placeholder="Lon"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <Card className="bg-gradient-to-br from-blue-900/60 to-blue-800/40 border-blue-700/50">
          <CardContent className="p-4 text-center">
            <Satellite className="w-6 h-6 text-blue-400 mx-auto mb-1" />
            <div className="text-2xl font-bold text-white">{constellation.filter(s => s.status === 'operational').length || 10}</div>
            <div className="text-xs text-blue-300">Active Satellites</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-900/60 to-green-800/40 border-green-700/50">
          <CardContent className="p-4 text-center">
            <Eye className="w-6 h-6 text-green-400 mx-auto mb-1" />
            <div className="text-2xl font-bold text-white">{overflights.filter(o => o.status === 'upcoming').length}</div>
            <div className="text-xs text-green-300">Upcoming Passes</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-900/60 to-purple-800/40 border-purple-700/50">
          <CardContent className="p-4 text-center">
            <Image className="w-6 h-6 text-purple-400 mx-auto mb-1" />
            <div className="text-2xl font-bold text-white">{archiveImages.length || searchResults.length}</div>
            <div className="text-xs text-purple-300">Archive Images</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-orange-900/60 to-orange-800/40 border-orange-700/50">
          <CardContent className="p-4 text-center">
            <Send className="w-6 h-6 text-orange-400 mx-auto mb-1" />
            <div className="text-2xl font-bold text-white">{taskingRequests.length}</div>
            <div className="text-xs text-orange-300">Tasking Orders</div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-white/10 border border-white/20 p-1 w-full justify-start flex-wrap h-auto gap-1">
          <TabsTrigger value="overflights" className="data-[state=active]:bg-cyan-600 text-white text-xs">
            <Radio className="w-3 h-3 mr-1" />Overflight Tracker
          </TabsTrigger>
          <TabsTrigger value="imagery" className="data-[state=active]:bg-cyan-600 text-white text-xs">
            <Camera className="w-3 h-3 mr-1" />Imagery Search
          </TabsTrigger>
          <TabsTrigger value="archive" className="data-[state=active]:bg-cyan-600 text-white text-xs">
            <ShoppingCart className="w-3 h-3 mr-1" />Archive Marketplace
          </TabsTrigger>
          <TabsTrigger value="beforeafter" className="data-[state=active]:bg-cyan-600 text-white text-xs">
            <ArrowUpDown className="w-3 h-3 mr-1" />Before/After
          </TabsTrigger>
          <TabsTrigger value="tasking" className="data-[state=active]:bg-cyan-600 text-white text-xs">
            <Target className="w-3 h-3 mr-1" />Satellite Tasking
          </TabsTrigger>
          <TabsTrigger value="constellation" className="data-[state=active]:bg-cyan-600 text-white text-xs">
            <Globe className="w-3 h-3 mr-1" />Constellation Status
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overflights" className="mt-4">
          <Card className="bg-white/5 border-white/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-white flex items-center gap-2 text-lg">
                <Radio className="w-5 h-5 text-cyan-400" />
                SpyMeSat Overflight Tracker
                <Badge className="bg-cyan-600 text-white text-xs ml-2">72-Hour Window</Badge>
              </CardTitle>
              <p className="text-slate-400 text-sm">
                Real-time tracking of imaging satellites passing over your location — know when satellites can capture new imagery
              </p>
            </CardHeader>
            <CardContent>
              {loadingOverflights ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
                  <span className="ml-2 text-slate-400">Calculating satellite orbits...</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {overflights.map((ovf) => (
                    <div key={ovf.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10 hover:border-cyan-500/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                          <Satellite className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-white font-medium">{ovf.satelliteName}</span>
                            <Badge className={`text-xs ${getProviderColor(ovf.provider)}`}>{ovf.provider}</Badge>
                            {ovf.imagingCapable && <Badge className="bg-green-600/20 text-green-400 text-xs border border-green-500/30"><Camera className="w-3 h-3 mr-1" />Imaging</Badge>}
                          </div>
                          <div className="text-sm text-slate-400">
                            {ovf.constellation} · {ovf.resolution} · {ovf.direction} · Elev {ovf.maxElevation}°
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex items-center gap-4">
                        <div>
                          <div className="text-white text-sm font-medium">{formatTime(ovf.overflightTime)}</div>
                          <div className="text-xs text-cyan-400 font-mono">T-{getTimeUntil(ovf.overflightTime)}</div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          {getStatusBadge(ovf.status)}
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <Cloud className="w-3 h-3" />{ovf.predictedCloudCover}%
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {overflightsData?.disclaimer && (
                    <div className="text-xs text-amber-400/80 bg-amber-900/20 rounded-lg p-3 border border-amber-700/30 flex items-start gap-2 mt-4">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      {overflightsData.disclaimer}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="imagery" className="mt-4">
          <Card className="bg-white/5 border-white/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-white flex items-center gap-2 text-lg">
                <Camera className="w-5 h-5 text-cyan-400" />
                Maxar High-Resolution Imagery Search
              </CardTitle>
              <p className="text-slate-400 text-sm">
                Search available satellite captures — WorldView-3 (0.31m), GeoEye-1 (0.41m), Legion constellation (0.29m)
              </p>
            </CardHeader>
            <CardContent>
              {loadingSearch ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
                  <span className="ml-2 text-slate-400">Searching satellite archives...</span>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {searchResults.slice(0, 9).map((img: any) => (
                      <div key={img.id} className="bg-white/5 rounded-lg border border-white/10 overflow-hidden hover:border-cyan-500/30 transition-colors">
                        <div className="h-32 bg-gradient-to-br from-slate-800 to-slate-700 relative">
                          <img src={img.thumbnailUrl} alt={img.satellite} className="w-full h-full object-cover opacity-80" />
                          <Badge className={`absolute top-2 right-2 text-xs ${getProviderColor(img.provider)}`}>{img.satellite}</Badge>
                          <Badge className="absolute top-2 left-2 text-xs bg-black/60 text-white">{img.resolution}</Badge>
                        </div>
                        <div className="p-3">
                          <div className="text-white text-sm font-medium">{new Date(img.acquisitionDate).toLocaleDateString()}</div>
                          <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                            <span className="flex items-center gap-1"><Cloud className="w-3 h-3" />{img.cloudCover}%</span>
                            <span>·</span>
                            <span>{img.area} km²</span>
                            <span>·</span>
                            <span>{img.quality}</span>
                          </div>
                          <div className="flex gap-1 mt-2">
                            {(img.colorBands || []).slice(0, 4).map((b: string) => (
                              <Badge key={b} variant="outline" className="text-xs text-slate-300 border-slate-600">{b}</Badge>
                            ))}
                            {(img.colorBands || []).length > 4 && <Badge variant="outline" className="text-xs text-slate-300 border-slate-600">+{img.colorBands.length - 4}</Badge>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {searchData?.disclaimer && (
                    <div className="text-xs text-amber-400/80 bg-amber-900/20 rounded-lg p-3 border border-amber-700/30 flex items-start gap-2 mt-4">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      {searchData.disclaimer}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="archive" className="mt-4">
          <Card className="bg-white/5 border-white/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-white flex items-center gap-2 text-lg">
                <ShoppingCart className="w-5 h-5 text-cyan-400" />
                Archive Imagery Marketplace
              </CardTitle>
              <p className="text-slate-400 text-sm">
                Browse and purchase existing satellite images — from premium 30cm Maxar to survey-grade Planet coverage
              </p>
            </CardHeader>
            <CardContent>
              {loadingArchive ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
                  <span className="ml-2 text-slate-400">Loading archive catalog...</span>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {archiveImages.slice(0, 10).map((img) => (
                      <div key={img.id} className="flex gap-3 p-3 bg-white/5 rounded-lg border border-white/10 hover:border-cyan-500/30 transition-colors">
                        <div className="w-20 h-20 rounded-lg overflow-hidden bg-slate-800 shrink-0">
                          <img src={img.thumbnailUrl} alt={img.satellite} className="w-full h-full object-cover opacity-80" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-white font-medium text-sm">{img.satellite}</span>
                            <Badge className={`text-xs ${getProviderColor(img.provider)}`}>{img.provider}</Badge>
                            {img.stormCorrelated && (
                              <Badge className="bg-red-600/20 text-red-400 text-xs border border-red-500/30">
                                <Zap className="w-3 h-3 mr-1" />Storm
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-slate-400 mt-1">
                            {new Date(img.acquisitionDate).toLocaleDateString()} · {img.quality} · <Cloud className="w-3 h-3 inline" /> {img.cloudCover}% · {img.area} km²
                          </div>
                          <div className="flex gap-1 mt-1">
                            {img.bands.slice(0, 3).map((b) => (
                              <Badge key={b} variant="outline" className="text-xs text-slate-400 border-slate-700">{b}</Badge>
                            ))}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-lg font-bold text-cyan-400">${img.price}</div>
                          <div className="text-xs text-slate-500">per km²</div>
                          <Button size="sm" className="mt-1 h-7 text-xs bg-cyan-600 hover:bg-cyan-700">
                            <ShoppingCart className="w-3 h-3 mr-1" />Order
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  {archiveData?.disclaimer && (
                    <div className="text-xs text-amber-400/80 bg-amber-900/20 rounded-lg p-3 border border-amber-700/30 flex items-start gap-2 mt-4">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      {archiveData.disclaimer}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="beforeafter" className="mt-4">
          <Card className="bg-white/5 border-white/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-white flex items-center gap-2 text-lg">
                <ArrowUpDown className="w-5 h-5 text-cyan-400" />
                Maxar Before/After Storm Damage Analysis
              </CardTitle>
              <p className="text-slate-400 text-sm">
                AI-powered change detection using WorldView-3 multispectral imagery — roof damage, vegetation loss, debris fields, flooding
              </p>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3 mb-4">
                <Select defaultValue="hurricane" onValueChange={() => {}}>
                  <SelectTrigger className="w-40 bg-white/10 border-white/20 text-white">
                    <SelectValue placeholder="Storm type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hurricane">Hurricane</SelectItem>
                    <SelectItem value="tornado">Tornado</SelectItem>
                    <SelectItem value="flood">Flood</SelectItem>
                    <SelectItem value="hail">Hail</SelectItem>
                    <SelectItem value="wildfire">Wildfire</SelectItem>
                    <SelectItem value="derecho">Derecho</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  onClick={() => beforeAfterMutation.mutate({
                    lat: parseFloat(lat), lon: parseFloat(lon),
                    stormDate: new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0],
                    stormType: 'hurricane',
                  })}
                  className="bg-cyan-600 hover:bg-cyan-700"
                  disabled={beforeAfterMutation.isPending}
                >
                  {beforeAfterMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Crosshair className="w-4 h-4 mr-2" />}
                  Run Analysis
                </Button>
              </div>

              {baAnalysis && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 rounded-lg border border-white/10 p-4">
                      <div className="text-sm text-slate-400 mb-2 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500" />
                        Pre-Storm — {baAnalysis.beforeImage?.satellite}
                      </div>
                      <div className="h-40 bg-slate-800 rounded-lg overflow-hidden">
                        <img src={baAnalysis.beforeImage?.thumbnailUrl} alt="Before" className="w-full h-full object-cover" />
                      </div>
                      <div className="text-xs text-slate-400 mt-2">{baAnalysis.beforeImage?.acquisitionDate} · {baAnalysis.beforeImage?.resolution}</div>
                    </div>
                    <div className="bg-white/5 rounded-lg border border-red-500/30 p-4">
                      <div className="text-sm text-slate-400 mb-2 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-500" />
                        Post-Storm — {baAnalysis.afterImage?.satellite}
                      </div>
                      <div className="h-40 bg-slate-800 rounded-lg overflow-hidden">
                        <img src={baAnalysis.afterImage?.thumbnailUrl} alt="After" className="w-full h-full object-cover" />
                      </div>
                      <div className="text-xs text-slate-400 mt-2">{baAnalysis.afterImage?.acquisitionDate} · {baAnalysis.afterImage?.resolution}</div>
                    </div>
                  </div>

                  <div className="bg-white/5 rounded-lg border border-white/10 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-white font-medium flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-cyan-400" />
                        Change Detection Results
                      </h4>
                      <Badge className={`text-sm ${
                        baAnalysis.damageClassification === 'catastrophic' ? 'bg-red-600' :
                        baAnalysis.damageClassification === 'severe' ? 'bg-orange-600' :
                        baAnalysis.damageClassification === 'moderate' ? 'bg-yellow-600' : 'bg-green-600'
                      } text-white`}>
                        {baAnalysis.damageClassification?.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {Object.entries(baAnalysis.changeDetection || {}).map(([key, value]) => (
                        <div key={key} className="text-center">
                          <div className="text-lg font-bold text-white">{value as number}%</div>
                          <div className="text-xs text-slate-400 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</div>
                          <div className="w-full h-1.5 bg-white/10 rounded-full mt-1">
                            <div
                              className={`h-full rounded-full ${(value as number) > 40 ? 'bg-red-500' : (value as number) > 20 ? 'bg-orange-500' : 'bg-green-500'}`}
                              style={{ width: `${Math.min(100, value as number)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-3 text-center">
                      <div>
                        <div className="text-sm font-medium text-white">{baAnalysis.affectedArea} km²</div>
                        <div className="text-xs text-slate-400">Affected Area</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white">{baAnalysis.estimatedStructures}</div>
                        <div className="text-xs text-slate-400">Est. Structures</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white">{Math.round((baAnalysis.confidenceScore || 0) * 100)}%</div>
                        <div className="text-xs text-slate-400">AI Confidence</div>
                      </div>
                    </div>
                  </div>

                  <pre className="text-xs text-slate-300 bg-black/40 rounded-lg p-4 border border-white/10 whitespace-pre-wrap font-mono">
                    {baAnalysis.analysis}
                  </pre>

                  {baAnalysis.disclaimer && (
                    <div className="text-xs text-amber-400/80 bg-amber-900/20 rounded-lg p-3 border border-amber-700/30 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      {baAnalysis.disclaimer}
                    </div>
                  )}
                </div>
              )}

              {!baAnalysis && !beforeAfterMutation.isPending && (
                <div className="text-center py-12 text-slate-500">
                  <ArrowUpDown className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>Click "Run Analysis" to generate before/after change detection</p>
                  <p className="text-xs mt-1">Uses Maxar WorldView-3 multispectral imagery with AI damage classification</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasking" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="bg-white/5 border-white/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-white flex items-center gap-2 text-lg">
                  <Target className="w-5 h-5 text-cyan-400" />
                  New Tasking Request
                </CardTitle>
                <p className="text-slate-400 text-sm">
                  Request a satellite to take new imagery of a specific location — critical priority delivers in 24 hours
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Priority</label>
                    <Select value={taskingPriority} onValueChange={setTaskingPriority}>
                      <SelectTrigger className="bg-white/10 border-white/20 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="routine">Routine (14 days) — $850</SelectItem>
                        <SelectItem value="priority">Priority (7 days) — $1,500</SelectItem>
                        <SelectItem value="urgent">Urgent (3 days) — $3,200</SelectItem>
                        <SelectItem value="critical">Critical (24 hrs) — $6,500</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Resolution</label>
                    <Select value={taskingResolution} onValueChange={setTaskingResolution}>
                      <SelectTrigger className="bg-white/10 border-white/20 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0.29m">0.29m (Legion)</SelectItem>
                        <SelectItem value="0.31m">0.31m (WorldView-3)</SelectItem>
                        <SelectItem value="0.50m">0.50m (WorldView-1)</SelectItem>
                        <SelectItem value="1.5m">1.5m (SPOT 7)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Max Cloud Cover (%)</label>
                  <Input
                    value={taskingCloudMax}
                    onChange={(e) => setTaskingCloudMax(e.target.value)}
                    className="bg-white/10 border-white/20 text-white"
                    type="number"
                    min="0"
                    max="100"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Notes / Storm Context</label>
                  <Textarea
                    value={taskingNotes}
                    onChange={(e) => setTaskingNotes(e.target.value)}
                    className="bg-white/10 border-white/20 text-white"
                    placeholder="e.g., Post-hurricane damage assessment for FEMA contract #4900..."
                    rows={3}
                  />
                </div>
                <Button
                  className="w-full bg-cyan-600 hover:bg-cyan-700"
                  onClick={() => taskingMutation.mutate({
                    lat, lon,
                    radius: 5,
                    priority: taskingPriority,
                    resolution: taskingResolution,
                    cloudCoverMax: parseInt(taskingCloudMax),
                    notes: taskingNotes,
                  })}
                  disabled={taskingMutation.isPending}
                >
                  {taskingMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                  Submit Tasking Request
                </Button>

                {taskingMutation.data?.disclaimer && (
                  <div className="text-xs text-amber-400/80 bg-amber-900/20 rounded-lg p-3 border border-amber-700/30 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    {taskingMutation.data.disclaimer}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-white flex items-center gap-2 text-lg">
                  <Clock className="w-5 h-5 text-cyan-400" />
                  Active Tasking Orders
                </CardTitle>
              </CardHeader>
              <CardContent>
                {taskingRequests.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <Target className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No tasking requests yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {taskingRequests.map((req: any) => (
                      <div key={req.id} className={`p-3 rounded-lg border ${getPriorityColor(req.priority)}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge className="bg-white/20 text-inherit text-xs font-mono">{req.id}</Badge>
                            <Badge variant="outline" className="text-xs capitalize">{req.priority}</Badge>
                            <Badge variant="outline" className="text-xs">{req.status}</Badge>
                          </div>
                          <span className="text-sm font-bold">${req.cost?.toLocaleString()}</span>
                        </div>
                        <div className="mt-2 text-xs space-y-1">
                          <div className="flex items-center gap-1">
                            <Satellite className="w-3 h-3" />
                            {req.assignedSatellite} · {req.requestedResolution}
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {req.targetLat?.toFixed(4)}°, {req.targetLon?.toFixed(4)}°
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Est. delivery: {new Date(req.estimatedDelivery).toLocaleDateString()}
                          </div>
                          {req.notes && <div className="text-slate-500 italic">{req.notes}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="constellation" className="mt-4">
          <Card className="bg-white/5 border-white/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-white flex items-center gap-2 text-lg">
                <Globe className="w-5 h-5 text-cyan-400" />
                Satellite Constellation Status
              </CardTitle>
              <p className="text-slate-400 text-sm">
                Live status of Maxar, Planet, and Airbus imaging constellation — {constellationData?.totalCapacity || '3.5M sq km/day'} total capacity
              </p>
            </CardHeader>
            <CardContent>
              {loadingConstellation ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
                  <span className="ml-2 text-slate-400">Checking constellation health...</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {constellation.map((sat) => (
                    <div key={sat.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10">
                      <div className={`w-3 h-3 rounded-full ${sat.status === 'operational' ? 'bg-green-500' : 'bg-yellow-500'} shrink-0`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-medium text-sm">{sat.name}</span>
                          <Badge className={`text-xs ${getProviderColor(sat.provider)}`}>{sat.provider}</Badge>
                        </div>
                        <div className="text-xs text-slate-400">
                          {sat.constellation} · {sat.resolution} · {sat.orbitalAltitude}
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={`text-xs ${sat.status === 'operational' ? 'bg-green-600/20 text-green-400' : 'bg-yellow-600/20 text-yellow-400'}`}>
                          {sat.status === 'operational' ? <CheckCircle className="w-3 h-3 mr-1" /> : <Clock className="w-3 h-3 mr-1" />}
                          {sat.status}
                        </Badge>
                        <div className="text-xs text-slate-500 mt-1">
                          Last: {formatTime(sat.lastAcquisition)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
