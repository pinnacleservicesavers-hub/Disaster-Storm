import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { 
  Car, 
  Camera, 
  MapPin, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  ArrowLeft,
  Activity,
  Eye,
  Navigation,
  Route,
  Shield,
  Zap
} from 'lucide-react';
import { Link } from 'wouter';
import { FadeIn, SlideIn, StaggerContainer, StaggerItem } from '@/components/ui/animations';

// Back button component
function BackButton() {
  return (
    <Link href="/">
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
  );
}

interface TrafficCamera {
  id: string;
  name: string;
  location: string;
  status: 'online' | 'offline' | 'maintenance';
  coordinates: { lat: number; lng: number };
  lastUpdate: string;
  trafficFlow: 'light' | 'moderate' | 'heavy' | 'blocked';
  weatherConditions: string;
  emergencyRoute: boolean;
  alerts: string[];
}

interface EvacuationRoute {
  id: string;
  name: string;
  origin: string;
  destination: string;
  status: 'open' | 'congested' | 'blocked';
  estimatedTime: number;
  capacity: number;
  currentLoad: number;
  alternativeRoutes: number;
}

const mockCameras: TrafficCamera[] = [
  {
    id: '1',
    name: 'I-95 North at Mile Marker 15',
    location: 'Miami-Dade County',
    status: 'online',
    coordinates: { lat: 25.7617, lng: -80.1918 },
    lastUpdate: new Date().toISOString(),
    trafficFlow: 'heavy',
    weatherConditions: 'Heavy Rain',
    emergencyRoute: true,
    alerts: ['Flooding detected in right lane', 'Reduced visibility']
  },
  {
    id: '2',
    name: 'US-1 at Homestead',
    location: 'South Miami-Dade',
    status: 'online',
    coordinates: { lat: 25.4687, lng: -80.4776 },
    lastUpdate: new Date().toISOString(),
    trafficFlow: 'moderate',
    weatherConditions: 'Moderate Rain',
    emergencyRoute: true,
    alerts: []
  },
  {
    id: '3',
    name: 'Tamiami Trail Bridge',
    location: 'Collier County',
    status: 'offline',
    coordinates: { lat: 25.8429, lng: -81.3953 },
    lastUpdate: '2024-09-26T10:30:00Z',
    trafficFlow: 'blocked',
    weatherConditions: 'Severe Weather',
    emergencyRoute: true,
    alerts: ['Camera offline due to storm damage', 'Bridge closed to traffic']
  }
];

const mockEvacuationRoutes: EvacuationRoute[] = [
  {
    id: '1',
    name: 'Central Florida Evacuation Corridor',
    origin: 'Miami-Dade',
    destination: 'Orlando',
    status: 'congested',
    estimatedTime: 240,
    capacity: 10000,
    currentLoad: 7500,
    alternativeRoutes: 3
  },
  {
    id: '2',
    name: 'Northern Evacuation Route',
    origin: 'Broward County',
    destination: 'Georgia Border',
    status: 'open',
    estimatedTime: 360,
    capacity: 15000,
    currentLoad: 4200,
    alternativeRoutes: 2
  }
];

export default function TrafficCamWatcher() {
  const [selectedCamera, setSelectedCamera] = useState<TrafficCamera | null>(null);
  const [viewMode, setViewMode] = useState<'cameras' | 'routes'>('cameras');
  const [onlineCameras, setOnlineCameras] = useState(0);
  
  useEffect(() => {
    setOnlineCameras(mockCameras.filter(cam => cam.status === 'online').length);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': case 'open': return 'bg-green-500';
      case 'congested': case 'moderate': return 'bg-yellow-500';
      case 'offline': case 'blocked': case 'maintenance': return 'bg-red-500';
      case 'heavy': return 'bg-orange-500';
      case 'light': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getFlowIcon = (flow: string) => {
    switch (flow) {
      case 'light': return <CheckCircle className="w-4 h-4" />;
      case 'moderate': return <Clock className="w-4 h-4" />;
      case 'heavy': return <AlertTriangle className="w-4 h-4" />;
      case 'blocked': return <Shield className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-900 via-red-900 to-pink-900">
      <FadeIn>
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <BackButton />
              <div className="flex items-center space-x-4">
                <Badge className="bg-white/20 text-white border-white/30">
                  <Eye className="w-3 h-3 mr-1" />
                  Live Monitoring
                </Badge>
                <Badge className="bg-green-500/20 text-green-100 border-green-300/30">
                  <Camera className="w-3 h-3 mr-1" />
                  {onlineCameras} Cameras Online
                </Badge>
              </div>
            </div>
            <motion.h1 
              className="text-4xl font-bold mb-2"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              Traffic Cam Watcher
            </motion.h1>
            <motion.p 
              className="text-xl text-orange-100"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              Road conditions & evacuation routes
            </motion.p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* System Status Overview */}
          <StaggerContainer className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <StaggerItem index={0}>
              <Card className="bg-white/10 backdrop-blur-md border-white/20">
                <CardContent className="p-6 text-center">
                  <Camera className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-white">{mockCameras.length}</div>
                  <div className="text-sm text-orange-200">Total Cameras</div>
                </CardContent>
              </Card>
            </StaggerItem>
            <StaggerItem index={1}>
              <Card className="bg-white/10 backdrop-blur-md border-white/20">
                <CardContent className="p-6 text-center">
                  <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-white">{onlineCameras}</div>
                  <div className="text-sm text-orange-200">Online Now</div>
                </CardContent>
              </Card>
            </StaggerItem>
            <StaggerItem index={2}>
              <Card className="bg-white/10 backdrop-blur-md border-white/20">
                <CardContent className="p-6 text-center">
                  <Route className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-white">{mockEvacuationRoutes.length}</div>
                  <div className="text-sm text-orange-200">Evacuation Routes</div>
                </CardContent>
              </Card>
            </StaggerItem>
            <StaggerItem index={3}>
              <Card className="bg-white/10 backdrop-blur-md border-white/20">
                <CardContent className="p-6 text-center">
                  <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-white">
                    {mockCameras.reduce((acc, cam) => acc + cam.alerts.length, 0)}
                  </div>
                  <div className="text-sm text-orange-200">Active Alerts</div>
                </CardContent>
              </Card>
            </StaggerItem>
          </StaggerContainer>

          {/* View Mode Toggle */}
          <div className="flex justify-center mb-8">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-1">
              <Button
                variant={viewMode === 'cameras' ? 'default' : 'ghost'}
                className={`${viewMode === 'cameras' ? 'bg-orange-500 text-white' : 'text-white'}`}
                onClick={() => setViewMode('cameras')}
                data-testid="button-cameras-view"
              >
                <Camera className="w-4 h-4 mr-2" />
                Traffic Cameras
              </Button>
              <Button
                variant={viewMode === 'routes' ? 'default' : 'ghost'}
                className={`ml-2 ${viewMode === 'routes' ? 'bg-orange-500 text-white' : 'text-white'}`}
                onClick={() => setViewMode('routes')}
                data-testid="button-routes-view"
              >
                <Route className="w-4 h-4 mr-2" />
                Evacuation Routes
              </Button>
            </div>
          </div>

          {/* Traffic Cameras View */}
          {viewMode === 'cameras' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Camera List */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                  <Camera className="w-6 h-6 mr-2 text-orange-400" />
                  Live Traffic Cameras
                </h2>
                
                {mockCameras.map((camera, index) => (
                  <motion.div
                    key={camera.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card 
                      className={`cursor-pointer transition-all duration-300 bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/20 ${
                        selectedCamera?.id === camera.id ? 'ring-2 ring-orange-400' : ''
                      }`}
                      onClick={() => setSelectedCamera(camera)}
                      data-testid={`camera-card-${camera.id}`}
                    >
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-white">{camera.name}</CardTitle>
                            <CardDescription className="text-orange-200">
                              {camera.location}
                            </CardDescription>
                          </div>
                          <div className="flex flex-col items-end space-y-2">
                            <Badge className={`${getStatusColor(camera.status)} text-white`}>
                              {camera.status.toUpperCase()}
                            </Badge>
                            {camera.emergencyRoute && (
                              <Badge className="bg-yellow-500/20 text-yellow-200 border-yellow-400/30">
                                <Shield className="w-3 h-3 mr-1" />
                                Emergency Route
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                          <div className="flex items-center text-white">
                            {getFlowIcon(camera.trafficFlow)}
                            <span className="ml-2 capitalize">{camera.trafficFlow} Traffic</span>
                          </div>
                          <div className="text-orange-200">
                            {camera.weatherConditions}
                          </div>
                        </div>
                        {camera.alerts.length > 0 && (
                          <div className="space-y-1">
                            {camera.alerts.map((alert, alertIndex) => (
                              <div key={alertIndex} className="text-xs text-red-300 flex items-start">
                                <AlertTriangle className="w-3 h-3 mr-1 mt-0.5 flex-shrink-0" />
                                {alert}
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {/* Camera Detail View */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                  <Eye className="w-6 h-6 mr-2 text-orange-400" />
                  Camera Feed
                </h2>
                
                {selectedCamera ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    <Card className="bg-white/10 backdrop-blur-md border-white/20">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center">
                          <Camera className="w-5 h-5 mr-2 text-orange-400" />
                          {selectedCamera.name}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {/* Camera Feed Placeholder */}
                        <div className="aspect-video bg-gray-800 rounded-lg flex items-center justify-center mb-4">
                          <div className="text-center">
                            <Camera className="w-16 h-16 text-gray-600 mx-auto mb-2" />
                            <p className="text-gray-400">Live Camera Feed</p>
                            <p className="text-gray-500 text-sm">{selectedCamera.name}</p>
                          </div>
                        </div>

                        {/* Camera Details */}
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="text-orange-200 mb-1">Status</div>
                            <Badge className={`${getStatusColor(selectedCamera.status)} text-white`}>
                              {selectedCamera.status.toUpperCase()}
                            </Badge>
                          </div>
                          <div>
                            <div className="text-orange-200 mb-1">Traffic Flow</div>
                            <div className="text-white flex items-center">
                              {getFlowIcon(selectedCamera.trafficFlow)}
                              <span className="ml-2 capitalize">{selectedCamera.trafficFlow}</span>
                            </div>
                          </div>
                          <div className="col-span-2">
                            <div className="text-orange-200 mb-1">Weather Conditions</div>
                            <div className="text-white">{selectedCamera.weatherConditions}</div>
                          </div>
                          <div className="col-span-2">
                            <div className="text-orange-200 mb-1">Last Update</div>
                            <div className="text-white">
                              {new Date(selectedCamera.lastUpdate).toLocaleString()}
                            </div>
                          </div>
                        </div>

                        {selectedCamera.alerts.length > 0 && (
                          <div className="mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                            <h4 className="text-red-200 font-medium mb-2 flex items-center">
                              <AlertTriangle className="w-4 h-4 mr-2" />
                              Active Alerts
                            </h4>
                            <div className="space-y-1">
                              {selectedCamera.alerts.map((alert, index) => (
                                <div key={index} className="text-red-100 text-sm">
                                  • {alert}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ) : (
                  <Card className="bg-white/10 backdrop-blur-md border-white/20">
                    <CardContent className="p-12 text-center">
                      <Camera className="w-16 h-16 text-orange-400 mx-auto mb-4" />
                      <p className="text-orange-200">Select a camera to view live feed and details</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}

          {/* Evacuation Routes View */}
          {viewMode === 'routes' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                <Route className="w-6 h-6 mr-2 text-orange-400" />
                Emergency Evacuation Routes
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {mockEvacuationRoutes.map((route, index) => (
                  <motion.div
                    key={route.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.2 }}
                  >
                    <Card className="bg-white/10 backdrop-blur-md border-white/20">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-white">{route.name}</CardTitle>
                            <CardDescription className="text-orange-200">
                              {route.origin} → {route.destination}
                            </CardDescription>
                          </div>
                          <Badge className={`${getStatusColor(route.status)} text-white`}>
                            {route.status.toUpperCase()}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Route Metrics */}
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="text-orange-200 mb-1">Estimated Time</div>
                            <div className="text-white font-medium">{Math.floor(route.estimatedTime / 60)}h {route.estimatedTime % 60}m</div>
                          </div>
                          <div>
                            <div className="text-orange-200 mb-1">Alternatives</div>
                            <div className="text-white font-medium">{route.alternativeRoutes} routes</div>
                          </div>
                        </div>

                        {/* Capacity Usage */}
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-orange-200">Route Capacity</span>
                            <span className="text-white">{Math.round((route.currentLoad / route.capacity) * 100)}% used</span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            <motion.div
                              className={`h-2 rounded-full ${
                                route.currentLoad / route.capacity > 0.8 ? 'bg-red-500' :
                                route.currentLoad / route.capacity > 0.6 ? 'bg-yellow-500' :
                                'bg-green-500'
                              }`}
                              initial={{ width: 0 }}
                              animate={{ width: `${(route.currentLoad / route.capacity) * 100}%` }}
                              transition={{ duration: 1, delay: index * 0.2 }}
                            />
                          </div>
                          <div className="flex justify-between text-xs text-orange-300 mt-1">
                            <span>{route.currentLoad.toLocaleString()} vehicles</span>
                            <span>{route.capacity.toLocaleString()} capacity</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      </FadeIn>
    </div>
  );
}