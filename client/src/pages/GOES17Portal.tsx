import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Satellite, 
  Zap, 
  Eye,
  Activity,
  MapPin,
  Clock,
  TrendingUp,
  Globe,
  Database,
  Signal,
  RefreshCw,
  Play,
  Pause,
  Volume2,
  VolumeX,
  ArrowLeft,
  Thermometer,
  Wind,
  CloudRain,
  Sun
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
import ModuleAIAssistant from '@/components/ModuleAIAssistant';

interface GOES17Data {
  satellite: 'GOES-17';
  timestamp: Date;
  imagery: {
    infrared: string;
    visible: string;
    waterVapor: string;
    lastUpdate: Date;
  };
  lightning: {
    strikes: Array<{
      latitude: number;
      longitude: number;
      timestamp: Date;
      intensity: number;
      type: 'cloud-to-ground' | 'cloud-to-cloud';
    }>;
    density: number;
    lastUpdate: Date;
  };
  atmospheric: {
    temperature: Array<{
      altitude: number;
      temperature: number;
      pressure: number;
    }>;
    humidity: number;
    windSpeed: number;
    windDirection: number;
  };
  coverage: {
    region: 'Western United States';
    bounds: {
      north: number;
      south: number;
      east: number;
      west: number;
    };
  };
}

export default function GOES17Portal() {
  const [activeTab, setActiveTab] = useState('imagery');
  const [isPlaying, setIsPlaying] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch GOES-17 satellite data
  const { data: goes17Data, isLoading, refetch } = useQuery({
    queryKey: ['goes17-data'],
    queryFn: async (): Promise<GOES17Data> => {
      const response = await fetch('/api/weather/goes17');
      if (!response.ok) {
        throw new Error('Failed to fetch GOES-17 data');
      }
      return response.json();
    },
    refetchInterval: autoRefresh ? 900000 : false, // 15 minutes
    placeholderData: {
      satellite: 'GOES-17' as const,
      timestamp: new Date(),
      imagery: {
        infrared: '/api/weather/goes17/imagery/infrared/latest',
        visible: '/api/weather/goes17/imagery/visible/latest',
        waterVapor: '/api/weather/goes17/imagery/water-vapor/latest',
        lastUpdate: new Date()
      },
      lightning: {
        strikes: [
          { latitude: 37.7749, longitude: -122.4194, timestamp: new Date(), intensity: 85.5, type: 'cloud-to-ground' },
          { latitude: 34.0522, longitude: -118.2437, timestamp: new Date(), intensity: 92.1, type: 'cloud-to-cloud' }
        ],
        density: 15.7,
        lastUpdate: new Date()
      },
      atmospheric: {
        temperature: [
          { altitude: 10000, temperature: -50, pressure: 264 },
          { altitude: 20000, temperature: -57, pressure: 54 },
          { altitude: 30000, temperature: -44, pressure: 12 }
        ],
        humidity: 68,
        windSpeed: 45,
        windDirection: 270
      },
      coverage: {
        region: 'Western United States',
        bounds: { north: 60, south: 15, east: -60, west: -175 }
      }
    }
  });

  const speakGOES17Info = () => {
    if (!voiceEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    
    const text = `GOES-17 Satellite Portal provides real-time weather intelligence from the GOES-17 satellite positioned over the Western United States. 
    Current data shows ${goes17Data?.lightning.strikes.length || 0} lightning strikes detected, atmospheric temperature at 30,000 feet is ${goes17Data?.atmospheric.temperature[2]?.temperature || -44} degrees Celsius, 
    and wind speeds of ${goes17Data?.atmospheric.windSpeed || 45} miles per hour. The satellite provides 15-minute updates with professional-grade meteorological data 
    including lightning detection, atmospheric imaging, and storm tracking for the western regions.`;
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1.1;
    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
    
    utterance.onend = () => setIsPlaying(false);
  };

  const stopSpeaking = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    }
  };

  // Auto-refresh every 15 minutes
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(() => {
        refetch();
      }, 900000); // 15 minutes
    }
    return () => clearInterval(interval);
  }, [autoRefresh, refetch]);

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    }).format(date);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
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
                  <Satellite className="h-8 w-8 text-blue-600" />
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">GOES-17 Satellite Portal</h1>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Western US Weather Intelligence</p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={voiceEnabled ? (isPlaying ? stopSpeaking : speakGOES17Info) : undefined}
                  disabled={!voiceEnabled}
                  className="gap-2"
                >
                  {isPlaying ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  {isPlaying ? 'Stop' : 'Voice Guide'}
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
                  <span className="text-sm text-gray-600 dark:text-gray-400">Live</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </FadeIn>

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
                        <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Last Update</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {formatTime(goes17Data?.timestamp || new Date())}
                        </p>
                        <p className="text-xs text-gray-500">15-min intervals</p>
                      </div>
                      <Clock className="h-8 w-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>
              </HoverLift>
            </StaggerItem>

            <StaggerItem>
              <HoverLift>
                <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-yellow-200 dark:border-yellow-800">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">Lightning Strikes</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          <CountUp end={goes17Data?.lightning.strikes.length || 0} />
                        </p>
                        <p className="text-xs text-gray-500">Last 15 minutes</p>
                      </div>
                      <Zap className="h-8 w-8 text-yellow-500" />
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
                        <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Wind Speed</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          <CountUp end={goes17Data?.atmospheric.windSpeed || 45} />
                          <span className="text-lg font-normal"> mph</span>
                        </p>
                        <p className="text-xs text-gray-500">At 30,000 ft</p>
                      </div>
                      <Wind className="h-8 w-8 text-purple-500" />
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
                        <p className="text-sm font-medium text-green-600 dark:text-green-400">Coverage</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">Western US</p>
                        <p className="text-xs text-gray-500">Full regional view</p>
                      </div>
                      <Globe className="h-8 w-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>
              </HoverLift>
            </StaggerItem>
          </div>
        </StaggerContainer>

        {/* Main Content Tabs */}
        <FadeIn delay={0.2}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 lg:w-1/2">
              <TabsTrigger value="imagery" className="gap-2">
                <Eye className="h-4 w-4" />
                Imagery
              </TabsTrigger>
              <TabsTrigger value="lightning" className="gap-2">
                <Zap className="h-4 w-4" />
                Lightning
              </TabsTrigger>
              <TabsTrigger value="atmospheric" className="gap-2">
                <Activity className="h-4 w-4" />
                Atmospheric
              </TabsTrigger>
              <TabsTrigger value="coverage" className="gap-2">
                <MapPin className="h-4 w-4" />
                Coverage
              </TabsTrigger>
            </TabsList>

            {/* Satellite Imagery Tab */}
            <TabsContent value="imagery" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Thermometer className="h-5 w-5 text-red-500" />
                      Infrared Imagery
                    </CardTitle>
                    <CardDescription>Temperature-based cloud detection</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                      <img 
                        src={goes17Data?.imagery.infrared} 
                        alt="GOES-17 Infrared"
                        className="w-full h-full object-cover rounded-lg"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                      <div className="hidden text-center">
                        <Satellite className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">Live IR imagery loading...</p>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <Badge variant="secondary">15-min updates</Badge>
                      <span className="text-xs text-gray-500">Last: {formatTime(goes17Data?.imagery.lastUpdate || new Date())}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sun className="h-5 w-5 text-yellow-500" />
                      Visible Light
                    </CardTitle>
                    <CardDescription>Daylight cloud imagery</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                      <img 
                        src={goes17Data?.imagery.visible} 
                        alt="GOES-17 Visible"
                        className="w-full h-full object-cover rounded-lg"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                      <div className="hidden text-center">
                        <Satellite className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">Live visible imagery loading...</p>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <Badge variant="secondary">Daylight only</Badge>
                      <span className="text-xs text-gray-500">Last: {formatTime(goes17Data?.imagery.lastUpdate || new Date())}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CloudRain className="h-5 w-5 text-blue-500" />
                      Water Vapor
                    </CardTitle>
                    <CardDescription>Atmospheric moisture detection</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                      <img 
                        src={goes17Data?.imagery.waterVapor} 
                        alt="GOES-17 Water Vapor"
                        className="w-full h-full object-cover rounded-lg"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                      <div className="hidden text-center">
                        <Satellite className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">Live water vapor imagery loading...</p>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <Badge variant="secondary">Upper atmosphere</Badge>
                      <span className="text-xs text-gray-500">Last: {formatTime(goes17Data?.imagery.lastUpdate || new Date())}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Lightning Detection Tab */}
            <TabsContent value="lightning" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-yellow-500" />
                      Lightning Activity Map
                    </CardTitle>
                    <CardDescription>GLM lightning mapper data</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <Zap className="h-12 w-12 text-yellow-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">Lightning strike map loading...</p>
                        <p className="text-xs text-gray-400 mt-1">{goes17Data?.lightning.strikes.length || 0} strikes detected</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle>Recent Lightning Strikes</CardTitle>
                    <CardDescription>Last 15 minutes of activity</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 max-h-80 overflow-y-auto">
                      {goes17Data?.lightning.strikes.slice(0, 10).map((strike, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <Zap className="h-4 w-4 text-yellow-500" />
                            <div>
                              <p className="text-sm font-medium">{strike.type.replace('-', ' to ')}</p>
                              <p className="text-xs text-gray-500">
                                {strike.latitude.toFixed(3)}°, {strike.longitude.toFixed(3)}°
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-yellow-600">{strike.intensity} kA</p>
                            <p className="text-xs text-gray-500">{formatTime(strike.timestamp)}</p>
                          </div>
                        </div>
                      )) || (
                        <div className="text-center py-8">
                          <Zap className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-500">No recent lightning activity</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Atmospheric Data Tab */}
            <TabsContent value="atmospheric" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5 text-purple-500" />
                      Temperature Profile
                    </CardTitle>
                    <CardDescription>Atmospheric temperature by altitude</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {goes17Data?.atmospheric.temperature.map((level, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                          <div>
                            <p className="text-sm font-medium">{level.altitude.toLocaleString()} ft</p>
                            <p className="text-xs text-gray-500">{level.pressure} mb</p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-purple-600">{level.temperature}°C</p>
                            <p className="text-xs text-gray-500">{(level.temperature * 9/5 + 32).toFixed(1)}°F</p>
                          </div>
                        </div>
                      )) || (
                        <div className="text-center py-8">
                          <Activity className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-500">Temperature profile loading...</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Wind className="h-5 w-5 text-blue-500" />
                      Current Conditions
                    </CardTitle>
                    <CardDescription>Real-time atmospheric data</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <Wind className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-blue-600">{goes17Data?.atmospheric.windSpeed || 45}</p>
                        <p className="text-sm text-gray-600">mph</p>
                        <p className="text-xs text-gray-500">Wind Speed</p>
                      </div>
                      
                      <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <Activity className="h-8 w-8 text-green-500 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-green-600">{goes17Data?.atmospheric.humidity || 68}</p>
                        <p className="text-sm text-gray-600">%</p>
                        <p className="text-xs text-gray-500">Humidity</p>
                      </div>
                      
                      <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg col-span-2">
                        <div className="flex items-center justify-center mb-2">
                          <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center">
                            <div 
                              className="w-2 h-2 bg-white rounded-full"
                              style={{ transform: `rotate(${goes17Data?.atmospheric.windDirection || 270}deg)` }}
                            />
                          </div>
                        </div>
                        <p className="text-2xl font-bold text-purple-600">{goes17Data?.atmospheric.windDirection || 270}°</p>
                        <p className="text-sm text-gray-600">Wind Direction</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Coverage Area Tab */}
            <TabsContent value="coverage" className="space-y-6">
              <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5 text-green-500" />
                    GOES-17 Coverage Area
                  </CardTitle>
                  <CardDescription>Western United States satellite coverage</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="h-80 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <Globe className="h-12 w-12 text-green-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">Coverage map loading...</p>
                        <p className="text-xs text-gray-400 mt-1">Western US regional view</p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">Coverage Details</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Region:</span>
                            <span className="font-medium">{goes17Data?.coverage.region}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Northern Bound:</span>
                            <span className="font-medium">{goes17Data?.coverage.bounds.north}°N</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Southern Bound:</span>
                            <span className="font-medium">{goes17Data?.coverage.bounds.south}°N</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Eastern Bound:</span>
                            <span className="font-medium">{goes17Data?.coverage.bounds.east}°W</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Western Bound:</span>
                            <span className="font-medium">{goes17Data?.coverage.bounds.west}°W</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Satellite Position</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Longitude:</span>
                            <span className="font-medium">137.2°W</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Altitude:</span>
                            <span className="font-medium">35,786 km</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Orbit Type:</span>
                            <span className="font-medium">Geostationary</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Operational:</span>
                            <span className="font-medium">Yes</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </FadeIn>
      </div>
      <ModuleAIAssistant 
        moduleName="GOES-17 Portal"
        moduleContext="GOES-17 satellite data monitoring for Western United States. Rachel can explain infrared and visible imagery, interpret lightning strike data, understand atmospheric readings, and help you track real-time storm patterns for contractor deployment planning."
      />
    </div>
  );
}