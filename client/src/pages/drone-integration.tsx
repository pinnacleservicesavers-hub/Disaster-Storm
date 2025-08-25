import { useState } from "react";
import TopNavigation from "@/components/TopNavigation";
import Sidebar from "@/components/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from "@/contexts/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { droneApi } from "@/lib/api";
import { 
  Plane, 
  Play, 
  Pause, 
  Maximize, 
  MapPin, 
  Clock, 
  Video, 
  Radio,
  Settings,
  Users,
  AlertTriangle,
  Download,
  Share
} from "lucide-react";

export default function DroneIntegration() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedFeed, setSelectedFeed] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { translate } = useLanguage();

  const { data: allFootage } = useQuery({
    queryKey: ["/api/drone-footage"],
    queryFn: () => droneApi.getFootage(),
    refetchInterval: 30000,
  });

  const { data: liveFootage } = useQuery({
    queryKey: ["/api/drone-footage", { live: true }],
    queryFn: () => droneApi.getFootage(true),
    refetchInterval: 10000,
  });

  const filteredFootage = allFootage?.filter(footage =>
    footage.operatorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    footage.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (footage.stormEvent && footage.stormEvent.toLowerCase().includes(searchTerm.toLowerCase()))
  ) || [];

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getOperatorStatus = (footage: any) => {
    if (footage.isLive) return 'Live';
    return 'Offline';
  };

  const getOperatorStatusColor = (footage: any) => {
    if (footage.isLive) return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };

  // Mock operator data
  const operators = [
    { id: 'op1', name: 'StormChaser_TX', status: 'active', location: 'Houston, TX', feeds: 2 },
    { id: 'op2', name: 'AerialView_GA', status: 'active', location: 'Atlanta, GA', feeds: 1 },
    { id: 'op3', name: 'SkyWatch_FL', status: 'inactive', location: 'Miami, FL', feeds: 0 },
    { id: 'op4', name: 'DroneTeam_AL', status: 'active', location: 'Birmingham, AL', feeds: 3 }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNavigation onSidebarToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      
      <div className="pt-16 flex">
        <Sidebar collapsed={sidebarCollapsed} />
        
        <main className={`flex-1 transition-all duration-300 ${
          sidebarCollapsed ? 'ml-16' : 'ml-280'
        }`}>
          <div className="p-6">
            <div className="mb-8">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center space-x-3">
                  <Plane className="w-8 h-8 text-primary" />
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900" data-testid="drone-integration-title">
                      {translate('drone_integration')}
                    </h1>
                    <p className="text-gray-600 mt-1">
                      Live storm damage footage and drone operator network
                    </p>
                  </div>
                </div>
                <div className="mt-4 lg:mt-0 flex space-x-3">
                  <Button variant="outline" data-testid="button-add-operator">
                    <Users className="w-4 h-4 mr-2" />
                    Add Operator
                  </Button>
                  <Button data-testid="button-drone-settings">
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </Button>
                </div>
              </div>
            </div>

            {/* Live Feed Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card data-testid="card-active-feeds">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Active Feeds</p>
                      <p className="text-3xl font-bold text-red-600" data-testid="active-feeds-count">
                        {liveFootage?.length || 0}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                      <Radio className="text-red-600 w-6 h-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="card-total-operators">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Operators</p>
                      <p className="text-3xl font-bold text-gray-900" data-testid="total-operators-count">
                        {operators.length}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Users className="text-blue-600 w-6 h-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="card-recorded-footage">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Recorded Footage</p>
                      <p className="text-3xl font-bold text-gray-900" data-testid="recorded-footage-count">
                        {allFootage?.filter(f => !f.isLive).length || 0}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <Video className="text-green-600 w-6 h-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="card-storage-used">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Storage Used</p>
                      <p className="text-3xl font-bold text-gray-900" data-testid="storage-used">
                        2.4 TB
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Download className="text-purple-600 w-6 h-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Drone Integration Tabs */}
            <Tabs defaultValue="live-feeds" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="live-feeds" data-testid="tab-live-feeds">
                  Live Feeds
                </TabsTrigger>
                <TabsTrigger value="recorded" data-testid="tab-recorded">
                  Recorded Footage
                </TabsTrigger>
                <TabsTrigger value="operators" data-testid="tab-operators">
                  Operators
                </TabsTrigger>
                <TabsTrigger value="analytics" data-testid="tab-analytics">
                  Analytics
                </TabsTrigger>
              </TabsList>

              <TabsContent value="live-feeds" className="space-y-6">
                {liveFootage && liveFootage.length > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {liveFootage.map((footage, index) => (
                      <Card key={footage.id} data-testid={`live-feed-${index}`}>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">{footage.title}</CardTitle>
                            <Badge className="bg-red-100 text-red-800 animate-pulse">
                              LIVE
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="relative h-48 bg-gray-900 rounded-lg mb-4 overflow-hidden">
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="text-center text-white">
                                <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-3">
                                  <Play className="w-8 h-8" />
                                </div>
                                <p className="font-medium">Live Stream</p>
                                <p className="text-sm opacity-75">{footage.operatorName}</p>
                              </div>
                            </div>
                            
                            {/* Video controls overlay */}
                            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                              <div className="bg-black bg-opacity-50 text-white px-3 py-1 rounded text-sm flex items-center">
                                <MapPin className="w-3 h-3 mr-1" />
                                {footage.location}
                              </div>
                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  className="bg-black bg-opacity-50 text-white hover:bg-opacity-70"
                                >
                                  <Maximize className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  data-testid={`button-save-${index}`}
                                >
                                  Save
                                </Button>
                              </div>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">Operator:</span>
                              <span className="font-medium">{footage.operatorName}</span>
                            </div>
                            {footage.stormEvent && (
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">Event:</span>
                                <span className="font-medium">{footage.stormEvent}</span>
                              </div>
                            )}
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">Visibility:</span>
                              <Badge variant={footage.visibility === 'public' ? 'default' : 'secondary'}>
                                {footage.visibility}
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card data-testid="card-no-live-feeds">
                    <CardContent className="text-center py-12">
                      <Radio className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Live Feeds</h3>
                      <p className="text-gray-600">
                        No drone operators are currently streaming live footage.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="recorded" className="space-y-6">
                <Card data-testid="card-recorded-footage">
                  <CardHeader>
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                      <CardTitle>Recorded Footage Archive</CardTitle>
                      <div className="mt-4 lg:mt-0">
                        <Input
                          placeholder="Search footage..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-64"
                          data-testid="input-search-footage"
                        />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredFootage.filter(f => !f.isLive).map((footage, index) => (
                        <div 
                          key={footage.id} 
                          className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-sm transition-shadow"
                          data-testid={`recorded-footage-${index}`}
                        >
                          <div className="relative h-32 bg-gray-200">
                            {footage.thumbnailUrl ? (
                              <img 
                                src={footage.thumbnailUrl} 
                                alt={footage.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <Video className="w-8 h-8 text-gray-400" />
                              </div>
                            )}
                            <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                              {footage.duration ? formatDuration(footage.duration) : '0:00'}
                            </div>
                          </div>
                          
                          <div className="p-4">
                            <h4 className="font-medium mb-2" data-testid={`footage-title-${index}`}>
                              {footage.title}
                            </h4>
                            <div className="space-y-1 text-sm text-gray-600">
                              <div className="flex items-center">
                                <Users className="w-3 h-3 mr-1" />
                                <span>{footage.operatorName}</span>
                              </div>
                              <div className="flex items-center">
                                <MapPin className="w-3 h-3 mr-1" />
                                <span>{footage.location}</span>
                              </div>
                              {footage.stormEvent && (
                                <div className="flex items-center">
                                  <AlertTriangle className="w-3 h-3 mr-1" />
                                  <span>{footage.stormEvent}</span>
                                </div>
                              )}
                            </div>
                            
                            <div className="mt-3 flex items-center justify-between">
                              <Badge 
                                className={getOperatorStatusColor(footage)}
                                data-testid={`footage-status-${index}`}
                              >
                                {getOperatorStatus(footage)}
                              </Badge>
                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  data-testid={`button-play-${index}`}
                                >
                                  <Play className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  data-testid={`button-share-${index}`}
                                >
                                  <Share className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="operators" className="space-y-6">
                <Card data-testid="card-operator-network">
                  <CardHeader>
                    <CardTitle>Operator Network</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {operators.map((operator, index) => (
                        <div 
                          key={operator.id} 
                          className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
                          data-testid={`operator-card-${index}`}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium text-lg" data-testid={`operator-name-${index}`}>
                              {operator.name}
                            </h4>
                            <Badge 
                              className={operator.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
                              data-testid={`operator-status-${index}`}
                            >
                              {operator.status}
                            </Badge>
                          </div>
                          
                          <div className="space-y-2 text-sm text-gray-600">
                            <div className="flex items-center">
                              <MapPin className="w-4 h-4 mr-2" />
                              <span data-testid={`operator-location-${index}`}>
                                {operator.location}
                              </span>
                            </div>
                            <div className="flex items-center">
                              <Video className="w-4 h-4 mr-2" />
                              <span data-testid={`operator-feeds-${index}`}>
                                {operator.feeds} active feeds
                              </span>
                            </div>
                          </div>
                          
                          <div className="mt-4 flex items-center space-x-2">
                            <Button variant="outline" size="sm" data-testid={`button-contact-${index}`}>
                              Contact
                            </Button>
                            <Button variant="outline" size="sm" data-testid={`button-view-feeds-${index}`}>
                              View Feeds
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="analytics" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <Card data-testid="card-coverage-analytics">
                    <CardHeader>
                      <CardTitle>Coverage Analytics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-primary mb-2">85%</div>
                          <div className="text-sm text-gray-600">Area Coverage</div>
                        </div>
                        <div className="text-center">
                          <div className="text-3xl font-bold text-green-600 mb-2">12.4 hrs</div>
                          <div className="text-sm text-gray-600">Avg Response Time</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card data-testid="card-quality-metrics">
                    <CardHeader>
                      <CardTitle>Quality Metrics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-blue-600 mb-2">4K</div>
                          <div className="text-sm text-gray-600">Video Resolution</div>
                        </div>
                        <div className="text-center">
                          <div className="text-3xl font-bold text-purple-600 mb-2">98.5%</div>
                          <div className="text-sm text-gray-600">Uptime</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card data-testid="card-usage-stats">
                    <CardHeader>
                      <CardTitle>Usage Statistics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-orange-600 mb-2">156</div>
                          <div className="text-sm text-gray-600">Hours Recorded</div>
                        </div>
                        <div className="text-center">
                          <div className="text-3xl font-bold text-red-600 mb-2">24/7</div>
                          <div className="text-sm text-gray-600">Monitoring</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}
