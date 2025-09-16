import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { homeowners } from '@shared/schema';
import { 
  Home, Camera, FileText, Users, AlertTriangle, MapPin, Clock, 
  Phone, Mail, User, LogOut, Plus, CheckCircle, AlertCircle, 
  Wrench, Cloud, Zap, Shield, Heart, Activity, ScanLine,
  MessageSquare, Bell, Star, Building2, Timer, Navigation,
  Smartphone, Globe, Wind, Thermometer, Gauge, Eye,
  RefreshCw, Search, Filter, Calendar, TrendingUp,
  Clipboard, DollarSign, Award, Target, Radio, Siren,
  Briefcase, FileCheck, PersonStanding, Lightbulb
} from 'lucide-react';
import { FadeIn, PulseAlert, StaggerContainer, StaggerItem, HoverLift, CountUp, ScaleIn, SlideIn } from '@/components/ui/animations';
import { apiRequest } from '@/lib/queryClient';

type VictimUser = typeof homeowners.$inferSelect;

interface EmergencyStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  priority: 'critical' | 'high' | 'medium' | 'low';
  estimatedTime: string;
  icon: any;
  category: 'safety' | 'documentation' | 'insurance' | 'repairs';
  dueDate?: string;
}

interface EmergencyAlert {
  id: string;
  type: 'weather' | 'evacuation' | 'safety' | 'service';
  severity: 'critical' | 'high' | 'medium' | 'info';
  title: string;
  message: string;
  timestamp: string;
  actionRequired: boolean;
  location: string;
}

interface AssistanceRequest {
  id: string;
  type: 'emergency' | 'contractor' | 'insurance' | 'legal';
  title: string;
  status: 'submitted' | 'assigned' | 'in_progress' | 'completed';
  priority: 'urgent' | 'high' | 'medium' | 'low';
  submittedAt: string;
  assignedTo?: string;
  estimatedCompletion?: string;
  notes: string;
}

export default function VictimDashboard() {
  const [user, setUser] = useState<VictimUser | null>(null);
  const [activeAlert, setActiveAlert] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [emergencyMode, setEmergencyMode] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const queryClient = useQueryClient();

  // Enhanced mock emergency steps
  const { data: emergencySteps = [] } = useQuery<EmergencyStep[]>({
    queryKey: ['emergency-steps', user?.id],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 300));
      return [
        {
          id: '1',
          title: 'Ensure Personal Safety',
          description: 'Verify you and family members are safe and accounted for',
          status: 'completed',
          priority: 'critical',
          estimatedTime: '5 min',
          icon: Shield,
          category: 'safety',
          dueDate: 'Immediate'
        },
        {
          id: '2',
          title: 'Document Property Damage',
          description: 'Take comprehensive photos and videos of all property damage',
          status: 'completed',
          priority: 'critical',
          estimatedTime: '30 min',
          icon: Camera,
          category: 'documentation'
        },
        {
          id: '3',
          title: 'Contact Insurance Provider',
          description: 'File initial claim with your insurance company immediately',
          status: 'in_progress',
          priority: 'high',
          estimatedTime: '45 min',
          icon: Phone,
          category: 'insurance',
          dueDate: '24 hours'
        },
        {
          id: '4',
          title: 'Secure Property',
          description: 'Board up broken windows, tarp damaged roof areas',
          status: 'pending',
          priority: 'high',
          estimatedTime: '2-4 hours',
          icon: Home,
          category: 'safety',
          dueDate: '48 hours'
        },
        {
          id: '5',
          title: 'Find Emergency Contractors',
          description: 'Get quotes from verified emergency repair contractors',
          status: 'pending',
          priority: 'high',
          estimatedTime: '1-2 hours',
          icon: Users,
          category: 'repairs'
        },
        {
          id: '6',
          title: 'Submit FEMA Application',
          description: 'Apply for federal disaster assistance if applicable',
          status: 'pending',
          priority: 'medium',
          estimatedTime: '60 min',
          icon: FileText,
          category: 'insurance',
          dueDate: '30 days'
        }
      ];
    },
    refetchInterval: autoRefresh ? 30000 : false,
  });

  // Mock emergency alerts
  const { data: emergencyAlerts = [] } = useQuery<EmergencyAlert[]>({
    queryKey: ['emergency-alerts', user?.state],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 200));
      return [
        {
          id: '1',
          type: 'weather',
          severity: 'high',
          title: 'Severe Weather Warning',
          message: 'High winds and heavy rain expected in your area. Avoid travel if possible.',
          timestamp: '2024-01-15T16:30:00Z',
          actionRequired: false,
          location: 'Tampa Bay Area'
        },
        {
          id: '2',
          type: 'service',
          severity: 'medium',
          title: 'Power Restoration Update',
          message: 'Power crews working in your neighborhood. Estimated restoration: 6-8 hours.',
          timestamp: '2024-01-15T15:45:00Z',
          actionRequired: false,
          location: 'Your Area'
        },
        {
          id: '3',
          type: 'safety',
          severity: 'critical',
          title: 'Emergency Shelter Available',
          message: 'Emergency shelter open at Community Center. Transportation available.',
          timestamp: '2024-01-15T14:20:00Z',
          actionRequired: true,
          location: 'Tampa Community Center'
        }
      ];
    },
    refetchInterval: autoRefresh ? 10000 : false,
  });

  // Mock assistance requests
  const { data: assistanceRequests = [] } = useQuery<AssistanceRequest[]>({
    queryKey: ['assistance-requests', user?.id],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 250));
      return [
        {
          id: '1',
          type: 'contractor',
          title: 'Emergency Roof Repair',
          status: 'assigned',
          priority: 'urgent',
          submittedAt: '2024-01-15T10:30:00Z',
          assignedTo: 'Tampa Emergency Roofing',
          estimatedCompletion: '2024-01-16T17:00:00Z',
          notes: 'Tarp installation completed, permanent repairs scheduled'
        },
        {
          id: '2',
          type: 'insurance',
          title: 'Insurance Claim Processing',
          status: 'in_progress',
          priority: 'high',
          submittedAt: '2024-01-15T09:15:00Z',
          assignedTo: 'Claims Adjuster Sarah M.',
          estimatedCompletion: '2024-01-18T12:00:00Z',
          notes: 'Adjuster scheduled for site visit tomorrow'
        },
        {
          id: '3',
          type: 'emergency',
          title: 'Temporary Housing Assistance',
          status: 'completed',
          priority: 'urgent',
          submittedAt: '2024-01-14T20:45:00Z',
          assignedTo: 'Red Cross Emergency Services',
          notes: 'Hotel voucher provided for 3 nights'
        }
      ];
    },
    refetchInterval: autoRefresh ? 20000 : false,
  });

  useEffect(() => {
    // Get user data from localStorage or set mock data
    const userData = localStorage.getItem('victimUser');
    if (userData) {
      setUser(JSON.parse(userData));
    } else {
      // Set mock user data for demo
      const mockUser: VictimUser = {
        id: 'victim-user-001',
        firstName: 'Sarah',
        lastName: 'Johnson',
        email: 'sarah.johnson@email.com',
        phone: '(813) 555-0123',
        propertyAddress: '2847 Bayshore Drive',
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

  const handleEmergencyCall = () => {
    if (confirm('This will call emergency services (911). Continue?')) {
      window.open('tel:911', '_self');
    }
  };

  const getStepStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return { text: 'COMPLETE', variant: 'default' as const, color: 'bg-green-500' };
      case 'in_progress': return { text: 'IN PROGRESS', variant: 'secondary' as const, color: 'bg-blue-500' };
      case 'blocked': return { text: 'BLOCKED', variant: 'destructive' as const, color: 'bg-red-500' };
      default: return { text: 'PENDING', variant: 'outline' as const, color: 'bg-gray-400' };
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'border-l-red-500 bg-red-50 dark:bg-red-900/20';
      case 'high': return 'border-l-orange-500 bg-orange-50 dark:bg-orange-900/20';
      case 'medium': return 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/20';
      default: return 'border-l-green-500 bg-green-50 dark:bg-green-900/20';
    }
  };

  const getAlertSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 border-red-200 dark:border-red-800';
      case 'high': return 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 border-orange-200 dark:border-orange-800';
      case 'medium': return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800';
      default: return 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800';
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-amber-50 flex items-center justify-center">
        <ScaleIn>
          <div className="text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="h-12 w-12 border-4 border-red-600 border-t-transparent rounded-full mx-auto mb-4"
            />
            <p className="text-gray-600">Loading emergency dashboard...</p>
          </div>
        </ScaleIn>
      </div>
    );
  }

  const userInitials = `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`
    .toUpperCase()
    .slice(0, 2) || 'U';

  const completedSteps = emergencySteps.filter(step => step.status === 'completed').length;
  const criticalAlerts = emergencyAlerts.filter(alert => alert.severity === 'critical').length;
  const activeRequests = assistanceRequests.filter(req => req.status !== 'completed').length;
  const completionRate = Math.round((completedSteps / emergencySteps.length) * 100);

  return (
    <div className="space-y-6" data-testid="victim-dashboard">
      {/* Enhanced Header Section */}
      <FadeIn>
        <div className="relative overflow-hidden bg-gradient-to-r from-red-900 via-orange-900 to-amber-900 dark:from-red-800 dark:via-orange-800 dark:to-amber-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          {/* Animated background elements */}
          <div className="absolute inset-0 opacity-10">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-white rounded-full"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ 
                  opacity: [0, 1, 0],
                  scale: [0, 2, 0],
                  x: [0, Math.random() * 60 - 30],
                  y: [0, Math.random() * 60 - 30]
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  delay: i * 0.4,
                  ease: "easeInOut"
                }}
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`
                }}
              />
            ))}
          </div>

          <div className="relative">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <ScaleIn>
                  <div className="relative">
                    <div className="w-16 h-16 bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-xl p-3">
                      <Shield className="h-10 w-10 text-orange-400" />
                    </div>
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute -top-1 -right-1 h-6 w-6 bg-green-500 rounded-full flex items-center justify-center"
                    >
                      <CheckCircle className="h-3 w-3 text-white" />
                    </motion.div>
                  </div>
                </ScaleIn>
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2">
                    Emergency Assistance Portal
                  </h1>
                  <p className="text-orange-200">
                    Welcome {user.firstName} - Your dedicated disaster recovery command center
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Button
                  variant={autoRefresh ? "default" : "secondary"}
                  size="sm"
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  data-testid="button-auto-refresh"
                  className="bg-white/10 hover:bg-white/20 text-white border-white/20"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
                  Live Updates
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleEmergencyCall}
                  data-testid="button-emergency-call"
                  className="bg-red-600 hover:bg-red-700 text-white font-bold"
                >
                  <Siren className="h-4 w-4 mr-2" />
                  Call 911
                </Button>
                <Button
                  variant="secondary"
                  onClick={handleLogout}
                  data-testid="button-logout"
                  className="bg-white/10 hover:bg-white/20 text-white border-white/20"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>

            {/* KPI Cards */}
            <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StaggerItem>
                <HoverLift>
                  <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                    <CardContent className="p-4 text-center">
                      <div className="flex items-center justify-center mb-2">
                        <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
                        <span className="text-sm font-medium text-white">Recovery Progress</span>
                      </div>
                      <div className="text-2xl font-bold text-white" data-testid="text-recovery-progress">
                        <CountUp end={completionRate} duration={1} suffix="%" />
                      </div>
                      <div className="text-xs text-orange-200">{completedSteps}/{emergencySteps.length} steps done</div>
                    </CardContent>
                  </Card>
                </HoverLift>
              </StaggerItem>

              <StaggerItem>
                <HoverLift>
                  <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                    <CardContent className="p-4 text-center">
                      <div className="flex items-center justify-center mb-2">
                        <AlertTriangle className="h-5 w-5 text-red-400 mr-2" />
                        <span className="text-sm font-medium text-white">Critical Alerts</span>
                      </div>
                      <div className="text-2xl font-bold text-white" data-testid="text-critical-alerts">
                        <CountUp end={criticalAlerts} duration={1} />
                      </div>
                      <div className="text-xs text-orange-200">require attention</div>
                    </CardContent>
                  </Card>
                </HoverLift>
              </StaggerItem>

              <StaggerItem>
                <HoverLift>
                  <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                    <CardContent className="p-4 text-center">
                      <div className="flex items-center justify-center mb-2">
                        <FileCheck className="h-5 w-5 text-blue-400 mr-2" />
                        <span className="text-sm font-medium text-white">Active Requests</span>
                      </div>
                      <div className="text-2xl font-bold text-white" data-testid="text-active-requests">
                        <CountUp end={activeRequests} duration={1} />
                      </div>
                      <div className="text-xs text-orange-200">in progress</div>
                    </CardContent>
                  </Card>
                </HoverLift>
              </StaggerItem>

              <StaggerItem>
                <HoverLift>
                  <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                    <CardContent className="p-4 text-center">
                      <div className="flex items-center justify-center mb-2">
                        <PersonStanding className="h-5 w-5 text-purple-400 mr-2" />
                        <span className="text-sm font-medium text-white">Status</span>
                      </div>
                      <div className="text-lg font-bold text-white" data-testid="text-status">
                        Safe & Secure
                      </div>
                      <div className="text-xs text-orange-200">last updated 5 min ago</div>
                    </CardContent>
                  </Card>
                </HoverLift>
              </StaggerItem>
            </StaggerContainer>

            {/* User Profile Section */}
            <div className="mt-6 flex items-center justify-between bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-red-500 text-white rounded-full flex items-center justify-center text-lg font-bold">
                    {userInitials}
                  </div>
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"
                  />
                </div>
                <div>
                  <h3 className="font-semibold text-white">{user.firstName} {user.lastName}</h3>
                  <p className="text-sm text-orange-200">{user.propertyAddress}, {user.city}, {user.state}</p>
                  <p className="text-xs text-orange-300">Emergency ID: {user.id}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-white font-medium">Account Status</div>
                <Badge className="bg-green-600 text-white">
                  <Shield className="w-3 h-3 mr-1" />
                  Verified
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </FadeIn>

      {/* Emergency Alert Banner */}
      {criticalAlerts > 0 && (
        <PulseAlert intensity="strong">
          <Alert className="bg-red-100 dark:bg-red-900/20 border-red-500">
            <Siren className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800 dark:text-red-200 font-medium">
              <strong>CRITICAL ALERT:</strong> You have {criticalAlerts} urgent notification(s) requiring immediate attention.
              <Button variant="link" className="text-red-800 dark:text-red-200 p-0 h-auto font-semibold ml-2">
                View All Alerts →
              </Button>
            </AlertDescription>
          </Alert>
        </PulseAlert>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid grid-cols-4 w-fit">
          <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
          <TabsTrigger value="steps" data-testid="tab-steps">Recovery Steps</TabsTrigger>
          <TabsTrigger value="alerts" data-testid="tab-alerts">Alerts & Updates</TabsTrigger>
          <TabsTrigger value="requests" data-testid="tab-requests">My Requests</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <FadeIn>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Quick Actions */}
              <div className="lg:col-span-2">
                <h3 className="text-xl font-semibold mb-4 flex items-center">
                  <Zap className="h-5 w-5 text-yellow-500 mr-2" />
                  Emergency Quick Actions
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <HoverLift>
                    <Card className="cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-300 group">
                      <CardContent className="p-4 text-center">
                        <div className="w-12 h-12 mx-auto mb-3 bg-red-100 dark:bg-red-900/50 rounded-full flex items-center justify-center group-hover:bg-red-200 dark:group-hover:bg-red-800/50 transition-colors">
                          <Camera className="h-6 w-6 text-red-600" />
                        </div>
                        <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">Report Damage</h4>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Upload photos & details</p>
                      </CardContent>
                    </Card>
                  </HoverLift>
                  
                  <HoverLift>
                    <Card className="cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-300 group">
                      <CardContent className="p-4 text-center">
                        <div className="w-12 h-12 mx-auto mb-3 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center group-hover:bg-blue-200 dark:group-hover:bg-blue-800/50 transition-colors">
                          <Users className="h-6 w-6 text-blue-600" />
                        </div>
                        <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">Get Help</h4>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Find contractors</p>
                      </CardContent>
                    </Card>
                  </HoverLift>

                  <HoverLift>
                    <Card className="cursor-pointer hover:bg-green-50 dark:hover:bg-green-900/20 transition-all duration-300 group">
                      <CardContent className="p-4 text-center">
                        <div className="w-12 h-12 mx-auto mb-3 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center group-hover:bg-green-200 dark:group-hover:bg-green-800/50 transition-colors">
                          <Phone className="h-6 w-6 text-green-600" />
                        </div>
                        <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">Insurance</h4>
                        <p className="text-xs text-gray-600 dark:text-gray-400">File claim</p>
                      </CardContent>
                    </Card>
                  </HoverLift>

                  <HoverLift>
                    <Card className="cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all duration-300 group">
                      <CardContent className="p-4 text-center">
                        <div className="w-12 h-12 mx-auto mb-3 bg-purple-100 dark:bg-purple-900/50 rounded-full flex items-center justify-center group-hover:bg-purple-200 dark:group-hover:bg-purple-800/50 transition-colors">
                          <Home className="h-6 w-6 text-purple-600" />
                        </div>
                        <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">Shelter</h4>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Find housing</p>
                      </CardContent>
                    </Card>
                  </HoverLift>
                </div>

                {/* Progress Overview */}
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <TrendingUp className="h-5 w-5 text-blue-500 mr-2" />
                      Recovery Progress
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Overall Completion</span>
                        <span className="text-sm text-muted-foreground">{completionRate}%</span>
                      </div>
                      <Progress value={completionRate} className="h-3" />
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                      <div>
                        <div className="text-lg font-bold text-green-600">{emergencySteps.filter(s => s.status === 'completed').length}</div>
                        <div className="text-xs text-muted-foreground">Completed</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-blue-600">{emergencySteps.filter(s => s.status === 'in_progress').length}</div>
                        <div className="text-xs text-muted-foreground">In Progress</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-gray-600">{emergencySteps.filter(s => s.status === 'pending').length}</div>
                        <div className="text-xs text-muted-foreground">Pending</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-red-600">{emergencySteps.filter(s => s.status === 'blocked').length}</div>
                        <div className="text-xs text-muted-foreground">Blocked</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Emergency Resources */}
              <div className="space-y-6">
                <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
                  <CardHeader>
                    <CardTitle className="text-red-800 dark:text-red-200 flex items-center">
                      <Siren className="h-5 w-5 mr-2" />
                      Emergency Contacts
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button
                      className="w-full bg-red-600 hover:bg-red-700 text-white font-bold"
                      onClick={handleEmergencyCall}
                      data-testid="button-call-911"
                    >
                      <Phone className="h-4 w-4 mr-2" />
                      Call 911 - Emergency
                    </Button>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="font-medium text-red-800 dark:text-red-200">Poison Control:</span>
                        <span className="text-red-600">1-800-222-1222</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-red-800 dark:text-red-200">Red Cross:</span>
                        <span className="text-red-600">1-800-733-2767</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-red-800 dark:text-red-200">FEMA:</span>
                        <span className="text-red-600">1-800-621-3362</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <MapPin className="h-5 w-5 text-blue-500 mr-2" />
                      Nearby Resources
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div className="font-medium text-blue-900 dark:text-blue-100">Community Shelter</div>
                        <div className="text-sm text-blue-700 dark:text-blue-300">Tampa Community Center - 0.5 mi</div>
                        <Badge className="mt-1 bg-green-500 text-white text-xs">Open</Badge>
                      </div>
                      <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <div className="font-medium text-green-900 dark:text-green-100">Medical Clinic</div>
                        <div className="text-sm text-green-700 dark:text-green-300">Bay Area Emergency - 1.2 mi</div>
                        <Badge className="mt-1 bg-yellow-500 text-white text-xs">Limited Hours</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </FadeIn>
        </TabsContent>

        {/* Recovery Steps Tab */}
        <TabsContent value="steps" className="space-y-6">
          <FadeIn>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Emergency Recovery Checklist</h2>
              <div className="flex items-center space-x-2">
                <Badge variant="outline">
                  {completedSteps} of {emergencySteps.length} completed
                </Badge>
              </div>
            </div>

            <StaggerContainer className="space-y-4">
              {emergencySteps.map((step, index) => {
                const statusBadge = getStepStatusBadge(step.status);
                const IconComponent = step.icon;
                
                return (
                  <StaggerItem key={step.id}>
                    <HoverLift>
                      <Card className={`border-l-4 ${getPriorityColor(step.priority)} transition-all duration-300`}>
                        <CardContent className="p-6">
                          <div className="flex items-start space-x-4">
                            <div className={`p-3 rounded-lg ${
                              step.status === 'completed' ? 'bg-green-100 dark:bg-green-900' :
                              step.status === 'in_progress' ? 'bg-blue-100 dark:bg-blue-900' :
                              step.status === 'blocked' ? 'bg-red-100 dark:bg-red-900' :
                              'bg-gray-100 dark:bg-gray-700'
                            }`}>
                              <IconComponent className={`h-6 w-6 ${
                                step.status === 'completed' ? 'text-green-600' :
                                step.status === 'in_progress' ? 'text-blue-600' :
                                step.status === 'blocked' ? 'text-red-600' :
                                'text-gray-600'
                              }`} />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-3">
                                <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                                  {step.title}
                                </h3>
                                <div className="flex items-center space-x-2">
                                  <Badge className={`${step.priority === 'critical' ? 'bg-red-500' : 
                                    step.priority === 'high' ? 'bg-orange-500' : 
                                    step.priority === 'medium' ? 'bg-blue-500' : 'bg-green-500'} text-white`}>
                                    {step.priority.toUpperCase()}
                                  </Badge>
                                  <motion.div
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: index * 0.1 }}
                                  >
                                    <Badge {...statusBadge} />
                                  </motion.div>
                                </div>
                              </div>
                              <p className="text-gray-600 dark:text-gray-400 mb-4">
                                {step.description}
                              </p>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                  <div className="flex items-center">
                                    <Timer className="h-4 w-4 mr-1" />
                                    {step.estimatedTime}
                                  </div>
                                  <div className="flex items-center">
                                    <Target className="h-4 w-4 mr-1" />
                                    {step.category}
                                  </div>
                                  {step.dueDate && (
                                    <div className="flex items-center text-orange-600">
                                      <Calendar className="h-4 w-4 mr-1" />
                                      Due: {step.dueDate}
                                    </div>
                                  )}
                                </div>
                                <div className="flex space-x-2">
                                  <Button size="sm" variant="outline" data-testid={`button-details-${step.id}`}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    Details
                                  </Button>
                                  {step.status === 'pending' && (
                                    <Button size="sm" data-testid={`button-start-${step.id}`}>
                                      Start Now
                                    </Button>
                                  )}
                                </div>
                              </div>
                              {step.status === 'completed' && (
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: '100%' }}
                                  transition={{ duration: 0.8, delay: index * 0.1 }}
                                  className="mt-4 h-2 bg-green-500 rounded-full"
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
          </FadeIn>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-6">
          <FadeIn>
            <div className="text-center py-12">
              <Bell className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Emergency Alerts & Updates</h3>
              <p className="text-muted-foreground">Real-time weather, safety, and service updates for your area</p>
            </div>
          </FadeIn>
        </TabsContent>

        {/* Requests Tab */}
        <TabsContent value="requests" className="space-y-6">
          <FadeIn>
            <div className="text-center py-12">
              <Clipboard className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">My Assistance Requests</h3>
              <p className="text-muted-foreground">Track your requests for help and monitor progress</p>
            </div>
          </FadeIn>
        </TabsContent>
      </Tabs>
    </div>
  );
}