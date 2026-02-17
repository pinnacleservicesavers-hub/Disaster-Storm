import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { 
  Plane, 
  Camera, 
  MapPin, 
  Battery, 
  Signal, 
  Eye, 
  ArrowLeft,
  Activity,
  Clock,
  AlertTriangle,
  CheckCircle,
  Navigation,
  Zap,
  Target,
  Wind
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { FadeIn, SlideIn, StaggerContainer, StaggerItem } from '@/components/ui/animations';
import { StateCitySelector, useStateCitySelector } from '@/components/StateCitySelector';
import ModuleAIAssistant from '@/components/ModuleAIAssistant';
import ModuleVoiceGuide from '@/components/ModuleVoiceGuide';

// Back button component
function BackButton() {
  return (
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
  );
}

interface Drone {
  id: string;
  name: string;
  model: string;
  status: 'active' | 'standby' | 'maintenance' | 'offline';
  location: { lat: number; lng: number; alt: number };
  battery: number;
  signal: number;
  mission: string;
  operator: string;
  flightTime: number;
  maxFlightTime: number;
  capabilities: string[];
  lastUpdate: string;
  activeOverlays: string[];
}

interface Mission {
  id: string;
  name: string;
  type: 'damage_assessment' | 'search_rescue' | 'surveillance' | 'mapping';
  status: 'pending' | 'active' | 'completed' | 'aborted';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignedDrone: string | null;
  estimatedDuration: number;
  progress: number;
  objectives: string[];
  startTime?: string;
  completionTime?: string;
}

const mockDrones: Drone[] = [
  {
    id: '1',
    name: 'Storm Eagle Alpha',
    model: 'DJI Matrice 300 RTK',
    status: 'active',
    location: { lat: 25.7617, lng: -80.1918, alt: 120 },
    battery: 85,
    signal: 92,
    mission: 'Damage Assessment - Coconut Grove',
    operator: 'Marcus Rodriguez',
    flightTime: 15,
    maxFlightTime: 45,
    capabilities: ['4K Camera', 'Thermal Imaging', 'LiDAR', 'AI Damage Detection'],
    lastUpdate: new Date().toISOString(),
    activeOverlays: ['Damage Heat Map', 'Flood Level Detection']
  },
  {
    id: '2',
    name: 'Hurricane Hunter Beta',
    model: 'Autel EVO II Pro',
    status: 'standby',
    location: { lat: 25.8429, lng: -80.3953, alt: 0 },
    battery: 100,
    signal: 88,
    mission: 'Ready for Deployment',
    operator: 'Sarah Chen',
    flightTime: 0,
    maxFlightTime: 35,
    capabilities: ['6K Camera', 'Obstacle Avoidance', 'Long Range', 'Weather Resistant'],
    lastUpdate: new Date().toISOString(),
    activeOverlays: []
  },
  {
    id: '3',
    name: 'Rescue Guardian Gamma',
    model: 'Skydio X2',
    status: 'maintenance',
    location: { lat: 25.6917, lng: -80.2818, alt: 0 },
    battery: 0,
    signal: 0,
    mission: 'Scheduled Maintenance',
    operator: 'Tech Team',
    flightTime: 0,
    maxFlightTime: 30,
    capabilities: ['Autonomous Flight', 'Person Detection', 'Night Vision', 'Emergency Response'],
    lastUpdate: '2024-09-26T08:00:00Z',
    activeOverlays: []
  }
];

const mockMissions: Mission[] = [
  {
    id: '1',
    name: 'Hurricane Alexandra Damage Survey',
    type: 'damage_assessment',
    status: 'active',
    priority: 'critical',
    assignedDrone: '1',
    estimatedDuration: 120,
    progress: 65,
    objectives: [
      'Survey residential damage in Coconut Grove',
      'Identify structural hazards',
      'Document flooding extent',
      'Generate damage heat map'
    ],
    startTime: new Date(Date.now() - 15 * 60 * 1000).toISOString()
  },
  {
    id: '2',
    name: 'Emergency Route Clearance Check',
    type: 'surveillance',
    status: 'pending',
    priority: 'high',
    assignedDrone: null,
    estimatedDuration: 90,
    progress: 0,
    objectives: [
      'Check I-95 corridor clearance',
      'Identify road blockages',
      'Monitor traffic flow',
      'Update evacuation routes'
    ]
  }
];

export default function DroneOperation() {
  const { selectedState, setSelectedState, selectedCity, setSelectedCity, availableCities } = useStateCitySelector('Florida', 'Miami');
  const [selectedDrone, setSelectedDrone] = useState<Drone | null>(null);
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [viewMode, setViewMode] = useState<'fleet' | 'missions'>('fleet');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'standby': return 'bg-blue-500';
      case 'pending': return 'bg-yellow-500';
      case 'completed': return 'bg-emerald-500';
      case 'maintenance': case 'aborted': return 'bg-orange-500';
      case 'offline': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-gray-500';
      case 'medium': return 'bg-blue-500';
      case 'high': return 'bg-orange-500';
      case 'critical': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const activeDrones = mockDrones.filter(drone => drone.status === 'active').length;
  const activeMissions = mockMissions.filter(mission => mission.status === 'active').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-cyan-900">
      <FadeIn>
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-600 to-blue-600 text-white p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <BackButton />
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
              <div className="flex items-center space-x-4">
                <Badge className="bg-white/20 text-white border-white/30">
                  <Activity className="w-3 h-3 mr-1" />
                  Real-time Operations
                </Badge>
                <Badge className="bg-green-500/20 text-green-100 border-green-300/30">
                  <Plane className="w-3 h-3 mr-1" />
                  {activeDrones} Drones Active
                </Badge>
              </div>
            </div>
            <motion.h1 
              className="text-4xl font-bold mb-2"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              Drone Operation
            </motion.h1>
            <motion.p 
              className="text-xl text-slate-100"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              Real-time drone deployments with AI overlays
            </motion.p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* System Status Overview */}
          <StaggerContainer className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <StaggerItem>
              <Card className="bg-white/10 backdrop-blur-md border-white/20">
                <CardContent className="p-6 text-center">
                  <Plane className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-white">{mockDrones.length}</div>
                  <div className="text-sm text-slate-200">Fleet Size</div>
                </CardContent>
              </Card>
            </StaggerItem>
            <StaggerItem>
              <Card className="bg-white/10 backdrop-blur-md border-white/20">
                <CardContent className="p-6 text-center">
                  <Activity className="w-8 h-8 text-green-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-white">{activeDrones}</div>
                  <div className="text-sm text-slate-200">Active Flights</div>
                </CardContent>
              </Card>
            </StaggerItem>
            <StaggerItem>
              <Card className="bg-white/10 backdrop-blur-md border-white/20">
                <CardContent className="p-6 text-center">
                  <Target className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-white">{activeMissions}</div>
                  <div className="text-sm text-slate-200">Active Missions</div>
                </CardContent>
              </Card>
            </StaggerItem>
            <StaggerItem>
              <Card className="bg-white/10 backdrop-blur-md border-white/20">
                <CardContent className="p-6 text-center">
                  <Eye className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-white">
                    {mockDrones.reduce((acc, drone) => acc + drone.activeOverlays.length, 0)}
                  </div>
                  <div className="text-sm text-slate-200">AI Overlays Active</div>
                </CardContent>
              </Card>
            </StaggerItem>
          </StaggerContainer>

          {/* View Mode Toggle */}
          <div className="flex justify-center mb-8">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-1">
              <Button
                variant={viewMode === 'fleet' ? 'default' : 'ghost'}
                className={`${viewMode === 'fleet' ? 'bg-blue-500 text-white' : 'text-white'}`}
                onClick={() => setViewMode('fleet')}
                data-testid="button-fleet-view"
              >
                <Plane className="w-4 h-4 mr-2" />
                Drone Fleet
              </Button>
              <Button
                variant={viewMode === 'missions' ? 'default' : 'ghost'}
                className={`ml-2 ${viewMode === 'missions' ? 'bg-blue-500 text-white' : 'text-white'}`}
                onClick={() => setViewMode('missions')}
                data-testid="button-missions-view"
              >
                <Target className="w-4 h-4 mr-2" />
                Mission Control
              </Button>
            </div>
          </div>

          {/* Drone Fleet View */}
          {viewMode === 'fleet' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Drone List */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                  <Plane className="w-6 h-6 mr-2 text-blue-400" />
                  Active Drone Fleet
                </h2>
                
                {mockDrones.map((drone, index) => (
                  <motion.div
                    key={drone.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card 
                      className={`cursor-pointer transition-all duration-300 bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/20 ${
                        selectedDrone?.id === drone.id ? 'ring-2 ring-blue-400' : ''
                      }`}
                      onClick={() => setSelectedDrone(drone)}
                      data-testid={`drone-card-${drone.id}`}
                    >
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-white">{drone.name}</CardTitle>
                            <CardDescription className="text-slate-200">
                              {drone.model} • {drone.operator}
                            </CardDescription>
                          </div>
                          <div className="flex flex-col items-end space-y-2">
                            <Badge className={`${getStatusColor(drone.status)} text-white`}>
                              {drone.status.toUpperCase()}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                          <div className="text-center">
                            <Battery className="w-4 h-4 text-green-400 mx-auto mb-1" />
                            <div className="text-white font-medium">{drone.battery}%</div>
                            <div className="text-slate-200">Battery</div>
                          </div>
                          <div className="text-center">
                            <Signal className="w-4 h-4 text-blue-400 mx-auto mb-1" />
                            <div className="text-white font-medium">{drone.signal}%</div>
                            <div className="text-slate-200">Signal</div>
                          </div>
                          <div className="text-center">
                            <Clock className="w-4 h-4 text-yellow-400 mx-auto mb-1" />
                            <div className="text-white font-medium">{drone.flightTime}m</div>
                            <div className="text-slate-200">Flight Time</div>
                          </div>
                        </div>
                        
                        <div className="text-sm text-slate-200 mb-2">
                          Current Mission: <span className="text-white">{drone.mission}</span>
                        </div>
                        
                        {drone.activeOverlays.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {drone.activeOverlays.map((overlay, overlayIndex) => (
                              <Badge key={overlayIndex} className="bg-purple-500/20 text-purple-200 border-purple-400/30 text-xs">
                                <Eye className="w-2 h-2 mr-1" />
                                {overlay}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {/* Drone Detail View */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                  <Eye className="w-6 h-6 mr-2 text-blue-400" />
                  Live Telemetry
                </h2>
                
                {selectedDrone ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    <Card className="bg-white/10 backdrop-blur-md border-white/20">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center">
                          <Plane className="w-5 h-5 mr-2 text-blue-400" />
                          {selectedDrone.name} - Live Feed
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {/* Drone Feed Placeholder */}
                        <div className="aspect-video bg-gray-800 rounded-lg flex items-center justify-center mb-4">
                          <div className="text-center">
                            <Camera className="w-16 h-16 text-gray-600 mx-auto mb-2" />
                            <p className="text-gray-400">Live Drone Feed</p>
                            <p className="text-gray-500 text-sm">{selectedDrone.name}</p>
                            <div className="mt-2 flex justify-center space-x-2">
                              {selectedDrone.activeOverlays.map((overlay, index) => (
                                <Badge key={index} className="bg-purple-500/20 text-purple-200 border-purple-400/30 text-xs">
                                  {overlay}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Telemetry Data */}
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <div className="text-slate-200 mb-1">Location</div>
                              <div className="text-white">
                                {selectedDrone.location.lat.toFixed(4)}, {selectedDrone.location.lng.toFixed(4)}
                              </div>
                              <div className="text-slate-300 text-xs">Alt: {selectedDrone.location.alt}ft</div>
                            </div>
                            <div>
                              <div className="text-slate-200 mb-1">Status</div>
                              <Badge className={`${getStatusColor(selectedDrone.status)} text-white`}>
                                {selectedDrone.status.toUpperCase()}
                              </Badge>
                            </div>
                          </div>

                          {/* Battery and Signal Bars */}
                          <div className="space-y-3">
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span className="text-slate-200">Battery Level</span>
                                <span className="text-white">{selectedDrone.battery}%</span>
                              </div>
                              <div className="w-full bg-gray-700 rounded-full h-2">
                                <motion.div
                                  className={`h-2 rounded-full ${
                                    selectedDrone.battery > 50 ? 'bg-green-500' :
                                    selectedDrone.battery > 20 ? 'bg-yellow-500' :
                                    'bg-red-500'
                                  }`}
                                  initial={{ width: 0 }}
                                  animate={{ width: `${selectedDrone.battery}%` }}
                                  transition={{ duration: 1 }}
                                />
                              </div>
                            </div>

                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span className="text-slate-200">Signal Strength</span>
                                <span className="text-white">{selectedDrone.signal}%</span>
                              </div>
                              <div className="w-full bg-gray-700 rounded-full h-2">
                                <motion.div
                                  className={`h-2 rounded-full ${
                                    selectedDrone.signal > 70 ? 'bg-blue-500' :
                                    selectedDrone.signal > 30 ? 'bg-yellow-500' :
                                    'bg-red-500'
                                  }`}
                                  initial={{ width: 0 }}
                                  animate={{ width: `${selectedDrone.signal}%` }}
                                  transition={{ duration: 1, delay: 0.2 }}
                                />
                              </div>
                            </div>

                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span className="text-slate-200">Flight Time</span>
                                <span className="text-white">{selectedDrone.flightTime}m / {selectedDrone.maxFlightTime}m</span>
                              </div>
                              <div className="w-full bg-gray-700 rounded-full h-2">
                                <motion.div
                                  className="h-2 rounded-full bg-cyan-500"
                                  initial={{ width: 0 }}
                                  animate={{ width: `${(selectedDrone.flightTime / selectedDrone.maxFlightTime) * 100}%` }}
                                  transition={{ duration: 1, delay: 0.4 }}
                                />
                              </div>
                            </div>
                          </div>

                          {/* Capabilities */}
                          <div>
                            <div className="text-slate-200 text-sm mb-2">Capabilities</div>
                            <div className="flex flex-wrap gap-2">
                              {selectedDrone.capabilities.map((capability, index) => (
                                <Badge key={index} className="bg-blue-500/20 text-blue-200 border-blue-400/30 text-xs">
                                  {capability}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ) : (
                  <Card className="bg-white/10 backdrop-blur-md border-white/20">
                    <CardContent className="p-12 text-center">
                      <Plane className="w-16 h-16 text-blue-400 mx-auto mb-4" />
                      <p className="text-slate-200">Select a drone to view live telemetry and feed</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}

          {/* Mission Control View */}
          {viewMode === 'missions' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                <Target className="w-6 h-6 mr-2 text-blue-400" />
                Mission Control Center
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {mockMissions.map((mission, index) => (
                  <motion.div
                    key={mission.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.2 }}
                  >
                    <Card className="bg-white/10 backdrop-blur-md border-white/20">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-white">{mission.name}</CardTitle>
                            <CardDescription className="text-slate-200 capitalize">
                              {mission.type.replace('_', ' ')} Mission
                            </CardDescription>
                          </div>
                          <div className="flex flex-col items-end space-y-2">
                            <Badge className={`${getStatusColor(mission.status)} text-white`}>
                              {mission.status.toUpperCase()}
                            </Badge>
                            <Badge className={`${getPriorityColor(mission.priority)} text-white`}>
                              {mission.priority.toUpperCase()}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Mission Progress */}
                        {mission.status === 'active' && (
                          <div>
                            <div className="flex justify-between text-sm mb-2">
                              <span className="text-slate-200">Progress</span>
                              <span className="text-white">{mission.progress}%</span>
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-2">
                              <motion.div
                                className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500"
                                initial={{ width: 0 }}
                                animate={{ width: `${mission.progress}%` }}
                                transition={{ duration: 1, delay: index * 0.2 }}
                              />
                            </div>
                          </div>
                        )}

                        {/* Mission Details */}
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="text-slate-200 mb-1">Duration</div>
                            <div className="text-white">{mission.estimatedDuration}min</div>
                          </div>
                          <div>
                            <div className="text-slate-200 mb-1">Assigned Drone</div>
                            <div className="text-white">
                              {mission.assignedDrone ? 
                                mockDrones.find(d => d.id === mission.assignedDrone)?.name || 'Unknown' : 
                                'Not Assigned'
                              }
                            </div>
                          </div>
                        </div>

                        {/* Mission Objectives */}
                        <div>
                          <div className="text-slate-200 text-sm mb-2">Objectives</div>
                          <div className="space-y-1">
                            {mission.objectives.map((objective, objIndex) => (
                              <div key={objIndex} className="text-xs text-slate-300 flex items-start">
                                <CheckCircle className="w-3 h-3 mr-2 mt-0.5 flex-shrink-0 text-green-400" />
                                {objective}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Mission Timing */}
                        {mission.startTime && (
                          <div className="text-xs text-slate-400">
                            Started: {new Date(mission.startTime).toLocaleString()}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      </FadeIn>
      <ModuleAIAssistant moduleName="Drone Operations" />
      <ModuleVoiceGuide moduleName="drone-operation" />
    </div>
  );
}