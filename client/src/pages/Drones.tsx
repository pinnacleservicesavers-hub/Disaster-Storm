import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useQuery } from '@tanstack/react-query';
import { Plane, Plus, Search, Settings, MapPin, Zap, Activity, AlertTriangle, PlayCircle, PauseCircle } from 'lucide-react';
import { DashboardSection } from '@/components/DashboardSection';
import { FadeIn, PulseAlert, StaggerContainer, StaggerItem, HoverLift } from '@/components/ui/animations';

interface LiveFlight {
  id: string;
  droneId: string;
  pilot: string;
  location: string;
  status: 'active' | 'returning' | 'emergency';
  battery: number;
  altitude: number;
  mission: string;
}

export default function Drones() {
  const [deploymentActive, setDeploymentActive] = useState(false);
  
  // Mock data - in real app, this would come from API
  const { data: liveFlights = [] } = useQuery({
    queryKey: ['live-flights'],
    queryFn: async (): Promise<LiveFlight[]> => {
      // Mock live flights data
      return [
        { id: '1', droneId: 'DJI-001', pilot: 'Mike Chen', location: 'Tampa Bay', status: 'active', battery: 87, altitude: 120, mission: 'Storm Damage Assessment' },
        { id: '2', droneId: 'DJI-002', pilot: 'Sarah Johnson', location: 'Orlando', status: 'returning', battery: 23, altitude: 45, mission: 'Insurance Inspection' },
        { id: '3', droneId: 'DJI-003', pilot: 'Alex Rivera', location: 'Jacksonville', status: 'emergency', battery: 15, altitude: 200, mission: 'Emergency Response' },
        { id: '4', droneId: 'DJI-004', pilot: 'Emily Davis', location: 'Miami', status: 'active', battery: 78, altitude: 150, mission: 'Property Survey' },
      ];
    },
    refetchInterval: 5000, // Refetch every 5 seconds for live data
  });

  const handleDeployDrone = () => {
    setDeploymentActive(true);
    // Simulate deployment process
    setTimeout(() => setDeploymentActive(false), 3000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 dark:text-green-400';
      case 'returning': return 'text-blue-600 dark:text-blue-400';
      case 'emergency': return 'text-red-600 dark:text-red-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return { text: 'ACTIVE', variant: 'default' as const };
      case 'returning': return { text: 'RETURNING', variant: 'secondary' as const };
      case 'emergency': return { text: 'EMERGENCY', variant: 'destructive' as const };
      default: return { text: 'UNKNOWN', variant: 'outline' as const };
    }
  };

  return (
    <DashboardSection
      title="Drone Operations"
      description="Manage drone fleet, aerial inspections, and automated damage assessment with real-time monitoring"
      icon={Plane}
      badge={{ text: `${liveFlights.filter(f => f.status === 'active').length} Active`, variant: 'default' }}
      kpis={[
        { label: 'Active Drones', value: 24, change: 'Currently deployed', color: 'blue', testId: 'text-active-drones' },
        { label: 'Flights Today', value: 47, change: '+12 from yesterday', color: 'green', testId: 'text-flights-today' },
        { label: 'Inspections Complete', value: 312, change: 'This week', color: 'default', testId: 'text-inspections-complete' },
        { label: 'Coverage Area', value: 2847, change: 'sq miles monitored', color: 'amber', suffix: ' mi²', testId: 'text-coverage-area' }
      ]}
      actions={[
        { icon: Zap, label: deploymentActive ? 'Deploying...' : 'Deploy Drone', onClick: handleDeployDrone, variant: 'default', testId: 'button-deploy-drone' },
        { icon: Plus, label: 'Add Mission', variant: 'outline', testId: 'button-add-mission' },
        { icon: Settings, label: 'Fleet Settings', variant: 'outline', testId: 'button-fleet-settings' }
      ]}
      testId="drones-section"
    >
      {/* Live Flight Ticker */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center space-x-2">
            <Activity className="h-5 w-5 text-blue-500" />
            <span>Live Flight Operations</span>
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="h-2 w-2 bg-green-500 rounded-full"
            />
          </h2>
          <Badge variant="outline" className="text-xs">
            Updated {new Date().toLocaleTimeString()}
          </Badge>
        </div>
        
        <StaggerContainer className="space-y-3">
          {liveFlights.map((flight) => (
            <StaggerItem key={flight.id}>
              <HoverLift>
                <Card className="relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-50/30 to-indigo-50/30 dark:from-blue-900/20 dark:to-indigo-900/20" />
                  <CardContent className="relative p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="relative">
                          <motion.div
                            animate={{ 
                              rotate: flight.status === 'active' ? 360 : 0,
                              scale: flight.status === 'emergency' ? [1, 1.1, 1] : 1
                            }}
                            transition={{ 
                              rotate: { duration: 2, repeat: Infinity, ease: "linear" },
                              scale: { duration: 1, repeat: Infinity }
                            }}
                          >
                            <Plane className={`h-6 w-6 ${getStatusColor(flight.status)}`} />
                          </motion.div>
                          {flight.status === 'emergency' && (
                            <PulseAlert intensity="strong">
                              <AlertTriangle className="absolute -top-1 -right-1 h-3 w-3 text-red-500" />
                            </PulseAlert>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-gray-900 dark:text-gray-100" data-testid={`flight-drone-id-${flight.id}`}>
                              {flight.droneId}
                            </span>
                            <Badge {...getStatusBadge(flight.status)} />
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            <span>{flight.pilot} • {flight.location}</span>
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-500">
                            {flight.mission}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-6">
                        <div className="text-center">
                          <div className="text-xs text-gray-500 dark:text-gray-400">Battery</div>
                          <div className="flex items-center space-x-2">
                            <Progress value={flight.battery} className="w-16 h-2" />
                            <span className={`text-sm font-medium ${
                              flight.battery < 20 ? 'text-red-600' : 
                              flight.battery < 50 ? 'text-amber-600' : 
                              'text-green-600'
                            }`} data-testid={`flight-battery-${flight.id}`}>
                              {flight.battery}%
                            </span>
                          </div>
                        </div>
                        
                        <div className="text-center">
                          <div className="text-xs text-gray-500 dark:text-gray-400">Altitude</div>
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100" data-testid={`flight-altitude-${flight.id}`}>
                            {flight.altitude}ft
                          </div>
                        </div>
                        
                        <div className="flex space-x-2">
                          <Button size="sm" variant="ghost" data-testid={`button-control-${flight.id}`}>
                            {flight.status === 'active' ? <PauseCircle className="h-4 w-4" /> : <PlayCircle className="h-4 w-4" />}
                          </Button>
                          <Button size="sm" variant="ghost" data-testid={`button-locate-${flight.id}`}>
                            <MapPin className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </HoverLift>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>

      {/* Deployment CTA */}
      {deploymentActive && (
        <FadeIn>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg"
          >
            <div className="flex items-center space-x-3">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <Activity className="h-5 w-5 text-blue-600" />
              </motion.div>
              <div>
                <h3 className="font-semibold text-blue-900 dark:text-blue-100">Drone Deployment in Progress</h3>
                <p className="text-sm text-blue-700 dark:text-blue-300">Initializing flight systems and coordinating with air traffic control...</p>
              </div>
            </div>
          </motion.div>
        </FadeIn>
      )}

      {/* Fleet Overview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MapPin className="h-5 w-5 text-blue-500" />
              <span>Coverage Map</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative h-64 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900 to-indigo-800 rounded-lg overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="mx-auto mb-4 h-16 w-16 bg-blue-500 rounded-full flex items-center justify-center"
                  >
                    <MapPin className="h-8 w-8 text-white" />
                  </motion.div>
                  <p className="text-gray-600 dark:text-gray-400">Interactive coverage map coming soon</p>
                </div>
              </div>
              
              {/* Pulse markers for active drones */}
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute h-4 w-4 bg-green-500 rounded-full"
                  style={{
                    top: `${20 + i * 25}%`,
                    left: `${30 + i * 20}%`
                  }}
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [1, 0.5, 1]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.5
                  }}
                />
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Recent Missions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { mission: 'Property Damage Survey', location: 'Tampa Bay', status: 'Completed', duration: '45 min', pilot: 'Mike Chen' },
                { mission: 'Insurance Documentation', location: 'Orlando', status: 'In Progress', duration: '23 min', pilot: 'Sarah Johnson' },
                { mission: 'Emergency Response', location: 'Jacksonville', status: 'Urgent', duration: '12 min', pilot: 'Alex Rivera' },
              ].map((mission, index) => (
                <HoverLift key={index}>
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">{mission.mission}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{mission.location} • {mission.pilot}</p>
                    </div>
                    <div className="text-right">
                      <Badge 
                        variant={mission.status === 'Completed' ? 'default' : mission.status === 'Urgent' ? 'destructive' : 'secondary'}
                        className="mb-1"
                      >
                        {mission.status}
                      </Badge>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{mission.duration}</div>
                    </div>
                  </div>
                </HoverLift>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardSection>
  );
}