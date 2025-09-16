import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Target, MapPin, Phone, Mail, Users, Wrench, Home, Car, Trees, Zap, 
  AlertTriangle, Brain, Sparkles, Clock, CheckCircle, UserCheck, 
  Calendar, ArrowRight, TrendingUp, BarChart3, Maximize2, 
  PlayCircle, PauseCircle, MoreHorizontal, Plus, Filter, Search,
  Star, DollarSign, Camera, FileText, MessageSquare, UserPlus,
  Building2, Shield, Activity, Eye, ChevronRight, RefreshCw,
  Briefcase, Award, Timer, Globe, Navigation
} from 'lucide-react';
import { FadeIn, PulseAlert, StaggerContainer, StaggerItem, HoverLift, CountUp, ScaleIn, SlideIn } from '@/components/ui/animations';
import { apiRequest } from '@/lib/queryClient';

interface Lead {
  id: string;
  type: string;
  address: string;
  ownerName: string;
  phone: string;
  email: string;
  damageDescription: string;
  coverageType: string;
  estimatedValue: number;
  priority: 'emergency' | 'urgent' | 'high' | 'medium' | 'low';
  contractorsNeeded: string[];
  aiConfidence: number;
  images: number;
  timestamp: string;
  status: 'new' | 'contacted' | 'qualified' | 'assigned' | 'in_progress' | 'completed';
  assignedTo?: string;
  lastContact?: string;
  notes: string;
  latitude: number;
  longitude: number;
  propertyValue: number;
  insuranceCompany: string;
  claimNumber?: string;
  weatherConditions: string;
  urgencyScore: number;
}

interface LeadStats {
  totalLeads: number;
  newToday: number;
  totalValue: number;
  averageResponse: number;
  conversionRate: number;
  activeAssignments: number;
}

interface ContractorAssignment {
  id: string;
  name: string;
  specialty: string;
  rating: number;
  availability: 'available' | 'busy' | 'unavailable';
  distance: number;
  cost: number;
}

export default function Leads() {
  const [activeTab, setActiveTab] = useState('board');
  const [selectedLead, setSelectedLead] = useState<string | null>(null);
  const [draggedLead, setDraggedLead] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'kanban' | 'list' | 'map'>('kanban');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [assignmentModal, setAssignmentModal] = useState(false);

  const queryClient = useQueryClient();

  // Enhanced mock lead data with more realistic properties
  const { data: leads = [], isLoading } = useQuery<Lead[]>({
    queryKey: ['leads', filterStatus, filterPriority, searchQuery],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 400));
      
      const allLeads: Lead[] = [
        {
          id: 'L001',
          type: 'hurricane_damage',
          address: '2847 Bayshore Drive, Tampa, FL 33602',
          ownerName: 'Sarah Johnson',
          phone: '(813) 555-0123',
          email: 'sarah.johnson@email.com',
          damageDescription: 'Extensive roof damage from Hurricane winds, missing shingles, water damage to attic',
          coverageType: 'Homeowners - Full Coverage',
          estimatedValue: 45000,
          priority: 'urgent',
          contractorsNeeded: ['Roofing', 'Water Damage', 'General Contractor'],
          aiConfidence: 94,
          images: 8,
          timestamp: '2024-01-15 14:30:00',
          status: 'new',
          notes: 'Property owner reports active leaks, needs immediate attention',
          latitude: 27.9506,
          longitude: -82.4572,
          propertyValue: 485000,
          insuranceCompany: 'State Farm',
          weatherConditions: 'Clear, winds 15mph',
          urgencyScore: 92
        },
        {
          id: 'L002',
          type: 'tree_damage',
          address: '1456 Pine Ridge Circle, Orlando, FL 32801',
          ownerName: 'Michael Chen',
          phone: '(407) 555-0456',
          email: 'mike.chen@email.com',
          damageDescription: 'Large oak tree fell across property, damaged roof and blocked driveway',
          coverageType: 'Homeowners - Standard',
          estimatedValue: 28500,
          priority: 'high',
          contractorsNeeded: ['Tree Services', 'Roofing', 'Cleanup Crew'],
          aiConfidence: 89,
          images: 5,
          timestamp: '2024-01-15 13:45:00',
          status: 'contacted',
          assignedTo: 'Rodriguez Tree Service',
          lastContact: '2024-01-15 15:20:00',
          notes: 'Tree removal scheduled for tomorrow morning',
          latitude: 28.5383,
          longitude: -81.3792,
          propertyValue: 320000,
          insuranceCompany: 'Allstate',
          claimNumber: 'AS-2024-001847',
          weatherConditions: 'Partly cloudy',
          urgencyScore: 78
        },
        {
          id: 'L003',
          type: 'flood_damage',
          address: '892 Coastal Highway, Jacksonville, FL 32205',
          ownerName: 'Emma Rodriguez',
          phone: '(904) 555-0789',
          email: 'emma.rodriguez@email.com',
          damageDescription: 'Storm surge flooding, 2 feet of water in first floor, damaged flooring and drywall',
          coverageType: 'Flood Insurance + Homeowners',
          estimatedValue: 67000,
          priority: 'emergency',
          contractorsNeeded: ['Water Damage', 'Flooring', 'Drywall', 'Mold Remediation'],
          aiConfidence: 97,
          images: 12,
          timestamp: '2024-01-15 15:15:00',
          status: 'qualified',
          assignedTo: 'FloodPro Restoration',
          lastContact: '2024-01-15 16:45:00',
          notes: 'Emergency extraction completed, dehumidifiers running',
          latitude: 30.3322,
          longitude: -81.6557,
          propertyValue: 275000,
          insuranceCompany: 'FEMA + USAA',
          claimNumber: 'FEMA-FL-2024-0892',
          weatherConditions: 'Heavy rain expected',
          urgencyScore: 95
        },
        {
          id: 'L004',
          type: 'wind_damage',
          address: '3421 Sunset Boulevard, Miami, FL 33139',
          ownerName: 'James Wilson',
          phone: '(305) 555-0321',
          email: 'james.wilson@email.com',
          damageDescription: 'High winds damaged siding, windows broken, fence destroyed',
          coverageType: 'Condo Association + Personal',
          estimatedValue: 32000,
          priority: 'medium',
          contractorsNeeded: ['Siding', 'Windows', 'Fencing'],
          aiConfidence: 85,
          images: 6,
          timestamp: '2024-01-15 12:20:00',
          status: 'assigned',
          assignedTo: 'Miami Storm Repairs',
          lastContact: '2024-01-15 14:15:00',
          notes: 'Contractor scheduled site visit for Monday',
          latitude: 25.7617,
          longitude: -80.1918,
          propertyValue: 425000,
          insuranceCompany: 'Progressive',
          claimNumber: 'PG-2024-003421',
          weatherConditions: 'Sunny, 78°F',
          urgencyScore: 65
        },
        {
          id: 'L005',
          type: 'hail_damage',
          address: '567 Country Club Drive, Fort Myers, FL 33919',
          ownerName: 'Lisa Thompson',
          phone: '(239) 555-0654',
          email: 'lisa.t@email.com',
          damageDescription: 'Golf ball sized hail damaged roof, gutters, and outdoor equipment',
          coverageType: 'Homeowners - Premium',
          estimatedValue: 22000,
          priority: 'medium',
          contractorsNeeded: ['Roofing', 'Gutters', 'HVAC'],
          aiConfidence: 91,
          images: 4,
          timestamp: '2024-01-15 11:30:00',
          status: 'in_progress',
          assignedTo: 'Gulf Coast Roofing',
          lastContact: '2024-01-15 16:00:00',
          notes: 'Insurance adjuster approved claim, work starting next week',
          latitude: 26.6406,
          longitude: -81.8723,
          propertyValue: 380000,
          insuranceCompany: 'Travelers',
          claimNumber: 'TR-2024-000567',
          weatherConditions: 'Clear skies',
          urgencyScore: 55
        },
        {
          id: 'L006',
          type: 'storm_surge',
          address: '1234 Ocean View Lane, Key Largo, FL 33037',
          ownerName: 'Roberto Martinez',
          phone: '(305) 555-0987',
          email: 'roberto.martinez@email.com',
          damageDescription: 'Storm surge damaged foundation, flooding in crawl space, salt water corrosion',
          coverageType: 'Flood Insurance',
          estimatedValue: 89000,
          priority: 'urgent',
          contractorsNeeded: ['Foundation', 'Waterproofing', 'Structural'],
          aiConfidence: 93,
          images: 10,
          timestamp: '2024-01-15 16:45:00',
          status: 'completed',
          assignedTo: 'Keys Foundation Experts',
          lastContact: '2024-01-15 17:30:00',
          notes: 'Project completed successfully, final inspection passed',
          latitude: 25.0865,
          longitude: -80.4473,
          propertyValue: 650000,
          insuranceCompany: 'FEMA',
          claimNumber: 'FEMA-FL-2024-1234',
          weatherConditions: 'Tropical storm warning',
          urgencyScore: 88
        }
      ];

      let filteredLeads = allLeads;

      if (searchQuery) {
        filteredLeads = filteredLeads.filter(lead => 
          lead.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          lead.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
          lead.damageDescription.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      if (filterStatus !== 'all') {
        filteredLeads = filteredLeads.filter(lead => lead.status === filterStatus);
      }

      if (filterPriority !== 'all') {
        filteredLeads = filteredLeads.filter(lead => lead.priority === filterPriority);
      }

      return filteredLeads;
    },
    refetchInterval: autoRefresh ? 15000 : false,
  });

  // Mock lead statistics
  const { data: leadStats } = useQuery<LeadStats>({
    queryKey: ['lead-stats'],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 200));
      return {
        totalLeads: leads.length,
        newToday: leads.filter(l => l.status === 'new').length,
        totalValue: leads.reduce((sum, lead) => sum + lead.estimatedValue, 0),
        averageResponse: 127, // minutes
        conversionRate: 78.5, // percentage
        activeAssignments: leads.filter(l => l.assignedTo).length
      };
    },
    refetchInterval: autoRefresh ? 30000 : false,
  });

  // Kanban columns configuration
  const kanbanColumns = [
    { 
      id: 'new', 
      title: 'New Leads', 
      icon: Plus, 
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      borderColor: 'border-blue-200 dark:border-blue-800'
    },
    { 
      id: 'contacted', 
      title: 'Contacted', 
      icon: Phone, 
      color: 'from-amber-500 to-amber-600',
      bgColor: 'bg-amber-50 dark:bg-amber-900/20',
      borderColor: 'border-amber-200 dark:border-amber-800'
    },
    { 
      id: 'qualified', 
      title: 'Qualified', 
      icon: CheckCircle, 
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      borderColor: 'border-purple-200 dark:border-purple-800'
    },
    { 
      id: 'assigned', 
      title: 'Assigned', 
      icon: UserCheck, 
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
      borderColor: 'border-orange-200 dark:border-orange-800'
    },
    { 
      id: 'in_progress', 
      title: 'In Progress', 
      icon: PlayCircle, 
      color: 'from-indigo-500 to-indigo-600',
      bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
      borderColor: 'border-indigo-200 dark:border-indigo-800'
    },
    { 
      id: 'completed', 
      title: 'Completed', 
      icon: Award, 
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      borderColor: 'border-green-200 dark:border-green-800'
    }
  ];

  const getPriorityColor = (priority: string) => {
    switch(priority) {
      case 'emergency': return 'bg-red-600 text-white border-red-600';
      case 'urgent': return 'bg-orange-500 text-white border-orange-500';
      case 'high': return 'bg-yellow-500 text-black border-yellow-500';
      case 'medium': return 'bg-blue-500 text-white border-blue-500';
      default: return 'bg-green-500 text-white border-green-500';
    }
  };

  const getDamageIcon = (type: string) => {
    switch(type) {
      case 'hurricane_damage': return <Zap className="w-4 h-4" />;
      case 'tree_damage': return <Trees className="w-4 h-4" />;
      case 'flood_damage': return <Activity className="w-4 h-4" />;
      case 'wind_damage': return <Navigation className="w-4 h-4" />;
      case 'hail_damage': return <Globe className="w-4 h-4" />;
      case 'storm_surge': return <Activity className="w-4 h-4" />;
      default: return <Home className="w-4 h-4" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'new': return <Plus className="w-4 h-4" />;
      case 'contacted': return <Phone className="w-4 h-4" />;
      case 'qualified': return <CheckCircle className="w-4 h-4" />;
      case 'assigned': return <UserCheck className="w-4 h-4" />;
      case 'in_progress': return <PlayCircle className="w-4 h-4" />;
      case 'completed': return <Award className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const handleDragStart = (leadId: string) => {
    setDraggedLead(leadId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    if (draggedLead) {
      console.log(`Moving lead ${draggedLead} to ${newStatus}`);
      // In real app, would update via API
      setDraggedLead(null);
    }
  };

  const handleAssignContractor = (leadId: string) => {
    console.log(`Assigning contractor to lead ${leadId}`);
    setAssignmentModal(true);
  };

  const totalValue = leads.reduce((sum, lead) => sum + lead.estimatedValue, 0);
  const urgentCount = leads.filter(l => ['emergency', 'urgent'].includes(l.priority)).length;
  const avgConfidence = Math.round(leads.reduce((sum, lead) => sum + lead.aiConfidence, 0) / leads.length) || 0;

  return (
    <div className="space-y-6" data-testid="leads-page">
      {/* Enhanced Header Section */}
      <FadeIn>
        <div className="relative overflow-hidden bg-gradient-to-r from-indigo-900 via-purple-900 to-blue-900 dark:from-indigo-800 dark:via-purple-800 dark:to-blue-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          {/* Animated background elements */}
          <div className="absolute inset-0 opacity-10">
            {[...Array(15)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-white rounded-full"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ 
                  opacity: [0, 1, 0],
                  scale: [0, 1.5, 0],
                  x: [0, Math.random() * 40 - 20],
                  y: [0, Math.random() * 40 - 20]
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  delay: i * 0.3,
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
                    <div className="p-3 bg-purple-500/20 rounded-xl">
                      <Target className="h-8 w-8 text-purple-400" />
                    </div>
                    <motion.div
                      className="absolute -top-1 -right-1 h-4 w-4 bg-green-500 rounded-full flex items-center justify-center"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Brain className="h-2 w-2 text-white" />
                    </motion.div>
                  </div>
                </ScaleIn>
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2">
                    AI Lead Intelligence Center
                  </h1>
                  <p className="text-purple-200">
                    Advanced damage detection and lead management with automated contractor matching
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
                  Live Feed
                </Button>
                <Button
                  variant="default"
                  onClick={() => setAssignmentModal(true)}
                  data-testid="button-bulk-assign"
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Bulk Assign
                </Button>
                <Button
                  variant="secondary"
                  data-testid="button-export-leads"
                  className="bg-white/10 hover:bg-white/20 text-white border-white/20"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Export
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
                        <Target className="h-5 w-5 text-purple-400 mr-2" />
                        <span className="text-sm font-medium text-white">Active Leads</span>
                      </div>
                      <div className="text-2xl font-bold text-white" data-testid="text-active-leads">
                        <CountUp end={leads.length} duration={1} />
                      </div>
                      <div className="text-xs text-purple-200">{leads.filter(l => l.status === 'new').length} new today</div>
                    </CardContent>
                  </Card>
                </HoverLift>
              </StaggerItem>

              <StaggerItem>
                <HoverLift>
                  <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                    <CardContent className="p-4 text-center">
                      <div className="flex items-center justify-center mb-2">
                        <DollarSign className="h-5 w-5 text-green-400 mr-2" />
                        <span className="text-sm font-medium text-white">Total Value</span>
                      </div>
                      <div className="text-2xl font-bold text-white" data-testid="text-total-value">
                        $<CountUp end={Math.floor(totalValue / 1000)} duration={1} />K
                      </div>
                      <div className="text-xs text-purple-200">potential revenue</div>
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
                        <span className="text-sm font-medium text-white">Urgent Cases</span>
                      </div>
                      <div className="text-2xl font-bold text-white" data-testid="text-urgent-cases">
                        <CountUp end={urgentCount} duration={1} />
                      </div>
                      <div className="text-xs text-purple-200">need attention</div>
                    </CardContent>
                  </Card>
                </HoverLift>
              </StaggerItem>

              <StaggerItem>
                <HoverLift>
                  <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                    <CardContent className="p-4 text-center">
                      <div className="flex items-center justify-center mb-2">
                        <Brain className="h-5 w-5 text-blue-400 mr-2" />
                        <span className="text-sm font-medium text-white">AI Accuracy</span>
                      </div>
                      <div className="text-2xl font-bold text-white" data-testid="text-ai-accuracy">
                        <CountUp end={avgConfidence} duration={1} suffix="%" />
                      </div>
                      <div className="text-xs text-purple-200">confidence level</div>
                    </CardContent>
                  </Card>
                </HoverLift>
              </StaggerItem>
            </StaggerContainer>
          </div>
        </div>
      </FadeIn>

      {/* AI Status Banner */}
      <FadeIn>
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className="h-8 w-8 bg-green-500 rounded-full flex items-center justify-center"
                >
                  <Brain className="h-4 w-4 text-white" />
                </motion.div>
                <div>
                  <h3 className="font-semibold text-green-900 dark:text-green-100">AI Detection System Active</h3>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Monitoring 2,847 data sources including traffic cameras, social media, and weather stations
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-center">
                  <div className="text-sm font-medium text-green-900 dark:text-green-100">Last Detection</div>
                  <div className="text-xs text-green-700 dark:text-green-300">2 minutes ago</div>
                </div>
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-3 h-3 bg-green-500 rounded-full"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </FadeIn>

      {/* Controls and Filters */}
      <div className="flex items-center justify-between">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-fit">
          <TabsList className="grid grid-cols-3 w-fit">
            <TabsTrigger value="board" data-testid="tab-board">Kanban Board</TabsTrigger>
            <TabsTrigger value="list" data-testid="tab-list">List View</TabsTrigger>
            <TabsTrigger value="analytics" data-testid="tab-analytics">Analytics</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search leads..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-64"
              data-testid="input-search-leads"
            />
          </div>
          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className="w-32" data-testid="select-filter-priority">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="emergency">Emergency</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-32" data-testid="select-filter-status">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="contacted">Contacted</SelectItem>
              <SelectItem value="qualified">Qualified</SelectItem>
              <SelectItem value="assigned">Assigned</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        {/* Kanban Board Tab */}
        <TabsContent value="board" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-6 gap-4 min-h-[600px]">
            {kanbanColumns.map((column) => {
              const columnLeads = leads.filter(lead => lead.status === column.id);
              
              return (
                <div
                  key={column.id}
                  className={`${column.bgColor} ${column.borderColor} border rounded-lg p-4 min-h-[500px]`}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, column.id)}
                  data-testid={`column-${column.id}`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <column.icon className="h-4 w-4" />
                      <h3 className="font-semibold text-sm">{column.title}</h3>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {columnLeads.length}
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    {columnLeads.map((lead, index) => (
                      <motion.div
                        key={lead.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        draggable
                        onDragStart={() => handleDragStart(lead.id)}
                        className="cursor-move"
                      >
                        <HoverLift>
                          <Card className="relative overflow-hidden transition-all duration-300 hover:shadow-lg">
                            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${
                              lead.priority === 'emergency' ? 'from-red-500 to-red-600' :
                              lead.priority === 'urgent' ? 'from-orange-500 to-orange-600' :
                              lead.priority === 'high' ? 'from-yellow-500 to-yellow-600' :
                              lead.priority === 'medium' ? 'from-blue-500 to-blue-600' :
                              'from-green-500 to-green-600'
                            }`} />
                            
                            <CardHeader className="pb-2">
                              <div className="flex items-start justify-between">
                                <div className="flex items-center space-x-2 flex-1 min-w-0">
                                  {getDamageIcon(lead.type)}
                                  <div className="truncate">
                                    <h4 className="font-medium text-sm truncate" data-testid={`lead-title-${lead.id}`}>
                                      {lead.ownerName}
                                    </h4>
                                    <p className="text-xs text-muted-foreground truncate">
                                      {lead.address.split(',')[0]}
                                    </p>
                                  </div>
                                </div>
                                <Badge className={`text-xs ${getPriorityColor(lead.priority)}`}>
                                  {lead.priority}
                                </Badge>
                              </div>
                            </CardHeader>
                            
                            <CardContent className="pt-0 space-y-3">
                              <div className="text-xs text-muted-foreground line-clamp-2">
                                {lead.damageDescription}
                              </div>
                              
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-medium text-green-600">
                                  ${(lead.estimatedValue / 1000).toFixed(0)}K
                                </span>
                                <div className="flex items-center space-x-1">
                                  <Brain className="h-3 w-3 text-blue-500" />
                                  <span className="text-blue-600">{lead.aiConfidence}%</span>
                                </div>
                              </div>
                              
                              {lead.assignedTo && (
                                <div className="text-xs text-muted-foreground">
                                  <UserCheck className="h-3 w-3 inline mr-1" />
                                  {lead.assignedTo}
                                </div>
                              )}
                              
                              <div className="flex items-center space-x-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-6 text-xs px-2"
                                  onClick={() => setSelectedLead(selectedLead === lead.id ? null : lead.id)}
                                  data-testid={`button-view-details-${lead.id}`}
                                >
                                  <Eye className="h-3 w-3 mr-1" />
                                  Details
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-6 text-xs px-2"
                                  onClick={() => handleAssignContractor(lead.id)}
                                  data-testid={`button-assign-${lead.id}`}
                                >
                                  <UserPlus className="h-3 w-3 mr-1" />
                                  Assign
                                </Button>
                              </div>

                              {/* Expanded Details */}
                              <AnimatePresence>
                                {selectedLead === lead.id && (
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="border-t pt-3 space-y-2 text-xs"
                                  >
                                    <div><strong>Phone:</strong> {lead.phone}</div>
                                    <div><strong>Insurance:</strong> {lead.insuranceCompany}</div>
                                    <div><strong>Property Value:</strong> ${(lead.propertyValue / 1000).toFixed(0)}K</div>
                                    <div><strong>Weather:</strong> {lead.weatherConditions}</div>
                                    <div><strong>Images:</strong> {lead.images} available</div>
                                    <div className="flex space-x-1">
                                      <Button size="sm" variant="outline" className="h-6 text-xs px-2">
                                        <Phone className="h-3 w-3 mr-1" />
                                        Call
                                      </Button>
                                      <Button size="sm" variant="outline" className="h-6 text-xs px-2">
                                        <Mail className="h-3 w-3 mr-1" />
                                        Email
                                      </Button>
                                      <Button size="sm" variant="outline" className="h-6 text-xs px-2">
                                        <MapPin className="h-3 w-3 mr-1" />
                                        Map
                                      </Button>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </CardContent>
                          </Card>
                        </HoverLift>
                      </motion.div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>

        {/* List View Tab */}
        <TabsContent value="list" className="space-y-6">
          <FadeIn>
            <div className="text-center py-12">
              <BarChart3 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Comprehensive List View</h3>
              <p className="text-muted-foreground">Detailed list view with advanced filtering and sorting capabilities</p>
            </div>
          </FadeIn>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <FadeIn>
            <div className="text-center py-12">
              <TrendingUp className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Lead Analytics & Performance</h3>
              <p className="text-muted-foreground">Advanced analytics, conversion tracking, and performance metrics</p>
            </div>
          </FadeIn>
        </TabsContent>
      </Tabs>
    </div>
  );
}