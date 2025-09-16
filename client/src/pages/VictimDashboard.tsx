import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { homeowners } from '@shared/schema';
import { 
  Home, 
  Camera, 
  FileText, 
  Users, 
  AlertTriangle, 
  MapPin, 
  Clock, 
  Phone,
  Mail,
  User,
  LogOut,
  Plus,
  CheckCircle,
  AlertCircle,
  Wrench,
  Cloud,
  Zap,
  Shield,
  Heart,
  Activity
} from 'lucide-react';
import { DashboardSection } from '@/components/DashboardSection';
import { FadeIn, PulseAlert, StaggerContainer, StaggerItem, HoverLift } from '@/components/ui/animations';

type VictimUser = typeof homeowners.$inferSelect;

interface NextStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'high' | 'medium' | 'low';
  icon: any;
}

export default function VictimDashboard() {
  const [user, setUser] = useState<VictimUser | null>(null);

  // Mock next steps checklist
  const [nextSteps] = useState<NextStep[]>([
    {
      id: '1',
      title: 'Document Property Damage',
      description: 'Take photos of all visible damage to your property',
      status: 'completed',
      priority: 'high',
      icon: Camera
    },
    {
      id: '2', 
      title: 'Contact Insurance Company',
      description: 'File initial claim with your insurance provider',
      status: 'in_progress',
      priority: 'high',
      icon: Phone
    },
    {
      id: '3',
      title: 'Find Contractors',
      description: 'Get estimates from verified contractors in your area',
      status: 'pending',
      priority: 'medium',
      icon: Users
    },
    {
      id: '4',
      title: 'Review Settlement',
      description: 'Review and approve insurance settlement offer',
      status: 'pending',
      priority: 'medium',
      icon: FileText
    }
  ]);

  // Fetch weather alerts for user's area
  const { data: weatherAlerts = [] } = useQuery({
    queryKey: ['weather-alerts', user?.state],
    queryFn: async () => {
      if (!user?.state) return [];
      const response = await fetch(`/api/weather/alerts?state=${user.state}`);
      if (!response.ok) return [];
      const data = await response.json();
      return data.alerts || [];
    },
    enabled: !!user?.state
  });

  // Fetch storm hot zones for user's area
  const { data: hotZones = [] } = useQuery({
    queryKey: ['hot-zones', user?.state],
    queryFn: async () => {
      if (!user?.state) return [];
      const response = await fetch(`/api/storm-hot-zones?state=${user.state}`);
      if (!response.ok) return [];
      const data = await response.json();
      return data.hotZones || [];
    },
    enabled: !!user?.state
  });

  // Fetch FEMA incidents for user's area
  const { data: femaIncidents = [] } = useQuery({
    queryKey: ['fema-incidents', user?.state],
    queryFn: async () => {
      if (!user?.state) return [];
      const response = await fetch(`/api/fema/incidents?state=${user.state}`);
      if (!response.ok) return [];
      const data = await response.json();
      return data.incidents || [];
    },
    enabled: !!user?.state
  });

  useEffect(() => {
    // Get user data from localStorage or set mock data
    const userData = localStorage.getItem('victimUser');
    if (userData) {
      setUser(JSON.parse(userData));
    } else {
      // Set mock user data for demo
      const mockUser: VictimUser = {
        id: 'demo-user-1',
        firstName: 'Sarah',
        lastName: 'Johnson',
        email: 'sarah.johnson@email.com',
        phone: '(813) 555-0123',
        propertyAddress: '123 Oak Street',
        city: 'Tampa',
        state: 'FL',
        zipCode: '33602',
        propertyType: 'single-family',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      setUser(mockUser);
      localStorage.setItem('victimUser', JSON.stringify(mockUser));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('victimUser');
    window.location.href = '/victim/login';
  };

  const getStepStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return { text: 'DONE', variant: 'default' as const, color: 'text-green-600' };
      case 'in_progress': return { text: 'IN PROGRESS', variant: 'secondary' as const, color: 'text-blue-600' };
      default: return { text: 'TODO', variant: 'outline' as const, color: 'text-gray-600' };
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"
          />
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const userInitials = `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`
    .toUpperCase()
    .slice(0, 2) || 'U';

  const completedSteps = nextSteps.filter(step => step.status === 'completed').length;
  const inProgressSteps = nextSteps.filter(step => step.status === 'in_progress').length;
  
  return (
    <DashboardSection
      title="Storm Victim Portal"
      description="Emergency assistance, damage reporting, and contractor connections for storm victims"
      icon={Heart}
      badge={{ text: 'EMERGENCY SUPPORT', variant: 'destructive' }}
      kpis={[
        { label: 'Steps Completed', value: completedSteps, change: `${Math.round((completedSteps / nextSteps.length) * 100)}% progress`, color: 'green', suffix: `/${nextSteps.length}`, testId: 'text-steps-completed' },
        { label: 'Active Requests', value: inProgressSteps, change: 'Currently processing', color: 'blue', testId: 'text-active-requests' },
        { label: 'Weather Alerts', value: weatherAlerts.length, change: 'For your area', color: weatherAlerts.length > 0 ? 'red' : 'green', testId: 'text-weather-alerts' },
        { label: 'Available Contractors', value: 47, change: 'In your area', color: 'amber', testId: 'text-available-contractors' }
      ]}
      actions={[
        { icon: Camera, label: 'Report Damage', variant: 'default', testId: 'button-report-damage' },
        { icon: Users, label: 'Find Help', variant: 'outline', testId: 'button-find-help' },
        { icon: LogOut, label: 'Logout', onClick: handleLogout, variant: 'outline', testId: 'button-logout' }
      ]}
      testId="victim-dashboard"
    >
      {/* Header with User Info */}
      <div className="mb-8 p-4 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-lg border border-white/20 dark:border-gray-700/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-full flex items-center justify-center text-xl font-bold shadow-lg">
                {userInitials}
              </div>
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"
              />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100" data-testid="text-username">
                Welcome, {user.firstName} {user.lastName}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">{user.email}</p>
              <div className="flex items-center space-x-2 mt-1">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600 dark:text-gray-400" data-testid="text-property-address">
                  {user.propertyAddress}, {user.city}, {user.state} {user.zipCode}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Emergency Alert */}
      <Alert className="mb-6 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
        <AlertTriangle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800 dark:text-red-200">
          <strong>Emergency Notice:</strong> If you're in immediate danger or have urgent safety concerns, 
          call 911 immediately. This portal is for property damage reporting and contractor assistance.
        </AlertDescription>
      </Alert>

      {/* Weather Alert Cards */}
      {weatherAlerts.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
            Active Weather Alerts
          </h3>
          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {weatherAlerts.slice(0, 4).map((alert: any, index: number) => (
              <StaggerItem key={index}>
                <motion.div
                  className="relative"
                  animate={{
                    boxShadow: [
                      '0 0 0 0 rgba(239, 68, 68, 0.4)',
                      '0 0 0 10px rgba(239, 68, 68, 0)',
                      '0 0 0 0 rgba(239, 68, 68, 0)'
                    ]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <Badge className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 border-0">
                          {alert.severity || 'Alert'}
                        </Badge>
                        <span className="text-xs text-red-600 dark:text-red-400">
                          {alert.areas ? alert.areas.slice(0, 2).join(', ') : user?.state}
                        </span>
                      </div>
                      <h4 className="font-semibold text-red-900 dark:text-red-100 mb-2">
                        {alert.title || alert.event}
                      </h4>
                      {alert.description && (
                        <p className="text-sm text-red-700 dark:text-red-300 line-clamp-2">
                          {alert.description}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Next Steps Checklist */}
        <div>
          <h3 className="text-xl font-semibold mb-4 flex items-center">
            <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
            Recovery Checklist
          </h3>
          <StaggerContainer className="space-y-3">
            {nextSteps.map((step, index) => {
              const statusBadge = getStepStatusBadge(step.status);
              const IconComponent = step.icon;
              
              return (
                <StaggerItem key={step.id}>
                  <HoverLift>
                    <Card className={`relative overflow-hidden transition-all duration-300 ${
                      step.status === 'completed' ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' :
                      step.status === 'in_progress' ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' :
                      'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                    }`}>
                      <CardContent className="p-4">
                        <div className="flex items-start space-x-4">
                          <div className={`p-2 rounded-lg ${
                            step.status === 'completed' ? 'bg-green-100 dark:bg-green-900' :
                            step.status === 'in_progress' ? 'bg-blue-100 dark:bg-blue-900' :
                            'bg-gray-100 dark:bg-gray-700'
                          }`}>
                            <IconComponent className={`h-5 w-5 ${statusBadge.color}`} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                                {step.title}
                              </h4>
                              <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.1 }}
                              >
                                <Badge {...statusBadge} />
                              </motion.div>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {step.description}
                            </p>
                            {step.status === 'completed' && (
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: '100%' }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                className="mt-2 h-1 bg-green-500 rounded-full"
                              />
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </HoverLift>
                </StaggerItem>
              );
            })}
          </StaggerContainer>
        </div>

        {/* Quick Actions & Status */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Zap className="h-5 w-5 mr-2 text-yellow-500" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <Link href="/victim/report-damage">
                <HoverLift className="w-full">
                  <Card className="cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                    <CardContent className="p-4 text-center">
                      <Camera className="h-8 w-8 text-red-500 mx-auto mb-2" />
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">Report Damage</h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Upload photos & documentation</p>
                    </CardContent>
                  </Card>
                </HoverLift>
              </Link>
              
              <Link href="/victim/request-help">
                <HoverLift className="w-full">
                  <Card className="cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                    <CardContent className="p-4 text-center">
                      <Wrench className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">Get Help</h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Find contractors</p>
                    </CardContent>
                  </Card>
                </HoverLift>
              </Link>
              
              <Link href="/victim/my-requests">
                <HoverLift className="w-full">
                  <Card className="cursor-pointer hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors">
                    <CardContent className="p-4 text-center">
                      <FileText className="h-8 w-8 text-green-500 mx-auto mb-2" />
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">Track Status</h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Monitor requests</p>
                    </CardContent>
                  </Card>
                </HoverLift>
              </Link>
              
              <Link href="/victim/contractors">
                <HoverLift className="w-full">
                  <Card className="cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors">
                    <CardContent className="p-4 text-center">
                      <Users className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">Contractors</h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Browse verified pros</p>
                    </CardContent>
                  </Card>
                </HoverLift>
              </Link>
            </CardContent>
          </Card>

          {/* Contact Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-3">
                <Phone className="w-4 h-4 text-gray-400" />
                <span className="text-sm" data-testid="text-phone">{user.phone}</span>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="text-sm" data-testid="text-email">{user.email}</span>
              </div>
            </CardContent>
          </Card>

          {/* Emergency Contacts */}
          <Card className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
            <CardHeader>
              <CardTitle className="text-lg flex items-center text-yellow-800 dark:text-yellow-200">
                <Shield className="w-5 h-5 mr-2" />
                Emergency Contacts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm">
                <p className="font-medium text-yellow-900 dark:text-yellow-100">Emergency Services</p>
                <p className="text-red-600 font-bold text-lg">911</p>
              </div>
              <div className="text-sm">
                <p className="font-medium text-yellow-900 dark:text-yellow-100">Poison Control</p>
                <p className="text-blue-600 dark:text-blue-400">1-800-222-1222</p>
              </div>
              <div className="text-sm">
                <p className="font-medium text-yellow-900 dark:text-yellow-100">Red Cross</p>
                <p className="text-blue-600 dark:text-blue-400">1-800-733-2767</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardSection>
  );
}