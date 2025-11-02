import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Plus, Search, Settings, Shield, AlertTriangle, CheckCircle, TrendingUp, Star, MapPin, Calendar, Clock, Zap, Award, Target, ChevronRight, Briefcase, UserPlus, Phone, Mail, MessageSquare, Filter, Volume2, VolumeX, X, ArrowLeft } from 'lucide-react';
import { Link } from 'wouter';
import { DashboardSection } from '@/components/DashboardSection';
import { FadeIn, PulseAlert, StaggerContainer, StaggerItem, HoverLift, CountUp, ScaleIn, SlideIn } from '@/components/ui/animations';
import { getAuthHeaders } from '@/lib/queryClient';
import { StateCitySelector, useStateCitySelector } from '@/components/StateCitySelector';
import ModuleAIAssistant from '@/components/ModuleAIAssistant';

interface ContractorStatus {
  id: string;
  name: string;
  specialty: string;
  status: 'available' | 'busy' | 'offline';
  location: string;
  rating: number;
  completedJobs: number;
  responseTime: string;
  lastActive: string;
  skills: string[];
  certifications: string[];
  availability: 'full-time' | 'part-time' | 'weekends';
  hourlyRate: number;
  profileImage?: string;
  phoneNumber: string;
  email: string;
  joinDate: string;
}

interface Job {
  id: string;
  title: string;
  customer: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimatedDuration: string;
  value: number;
  skills: string[];
  location: string;
  status: 'pending' | 'assigned' | 'in_progress';
  dueDate: string;
}

export default function ContractorManagement() {
  const { selectedState, setSelectedState, selectedCity, setSelectedCity, availableCities } = useStateCitySelector('Florida', 'Miami');
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [selectedView, setSelectedView] = useState('overview');
  const [draggedJob, setDraggedJob] = useState<Job | null>(null);
  const [showScheduler, setShowScheduler] = useState(false);
  const [isVoiceGuideActive, setIsVoiceGuideActive] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newContractor, setNewContractor] = useState({
    name: '',
    email: '',
    phone: '',
    specialty: '',
    location: ''
  });
  
  const queryClient = useQueryClient();

  // Add contractor mutation
  const addContractorMutation = useMutation({
    mutationFn: async (contractor: typeof newContractor) => {
      const response = await fetch('/api/contractors/save', {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(contractor)
      });

      if (!response.ok) {
        throw new Error('Failed to add contractor');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contractors'] });
      setShowAddModal(false);
      setNewContractor({ name: '', email: '', phone: '', specialty: '', location: '' });
      alert('Contractor added successfully!');
    },
    onError: (error) => {
      console.error('Error adding contractor:', error);
      alert('Failed to add contractor. Please try again.');
    }
  });

  // Real contractor data from API
  const { data: contractors = [], isLoading } = useQuery({
    queryKey: ['contractors', selectedRegion],
    queryFn: async (): Promise<ContractorStatus[]> => {
      try {
        const response = await fetch('/api/contractors', {
          headers: getAuthHeaders()
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch contractors');
        }
        
        const data = await response.json();
        
        // Map API data to our interface (add defaults for missing fields)
        return data.map((contractor: any) => ({
          id: contractor.id,
          name: contractor.name || 'Unnamed Contractor',
          specialty: contractor.specialty || 'General Services',
          status: contractor.status || 'available',
          location: contractor.location || 'Location TBD',
          rating: contractor.rating || 4.5,
          completedJobs: contractor.completedJobs || 0,
          responseTime: contractor.responseTime || '30 min',
          lastActive: contractor.lastActive || 'Just now',
          skills: contractor.skills || ['General Services'],
          certifications: contractor.certifications || [],
          availability: contractor.availability || 'full-time',
          hourlyRate: contractor.hourlyRate || 75,
          phoneNumber: contractor.phone || 'No phone provided',
          email: contractor.email || 'No email provided',
          joinDate: contractor.joinDate || new Date().toISOString().split('T')[0]
        }));
      } catch (error) {
        console.error('Error fetching contractors:', error);
        return []; // Return empty array on error
      }
    },
    refetchInterval: 30000, // Refetch every 30 seconds for live status
  });

  // Mock pending jobs data
  const { data: pendingJobs = [] } = useQuery({
    queryKey: ['pending-jobs'],
    queryFn: async (): Promise<Job[]> => {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      return [
        { id: 'job-1', title: 'Emergency Tree Removal', customer: 'Sarah Johnson', priority: 'urgent', estimatedDuration: '3 hours', value: 1200, skills: ['Tree Removal', 'Emergency Response'], location: 'Tampa, FL', status: 'pending', dueDate: '2024-01-16' },
        { id: 'job-2', title: 'Roof Inspection & Repair', customer: 'Mike Chen', priority: 'high', estimatedDuration: '5 hours', value: 2800, skills: ['Roofing', 'Insurance Claims'], location: 'Orlando, FL', status: 'pending', dueDate: '2024-01-17' },
        { id: 'job-3', title: 'Water Damage Cleanup', customer: 'Emily Rodriguez', priority: 'medium', estimatedDuration: '8 hours', value: 4500, skills: ['Water Damage', 'Mold Remediation'], location: 'Miami, FL', status: 'pending', dueDate: '2024-01-18' },
        { id: 'job-4', title: 'Debris Removal Service', customer: 'David Wilson', priority: 'low', estimatedDuration: '4 hours', value: 800, skills: ['Debris Removal', 'Heavy Equipment'], location: 'Jacksonville, FL', status: 'pending', dueDate: '2024-01-19' },
      ];
    },
    refetchInterval: 60000,
  });

  // Initialize voice loading
  useEffect(() => {
    const loadVoices = () => {
      setVoices(window.speechSynthesis.getVoices());
    };
    
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-500';
      case 'busy': return 'bg-yellow-500';
      case 'offline': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available': return { text: 'AVAILABLE', variant: 'default' as const };
      case 'busy': return { text: 'BUSY', variant: 'secondary' as const };
      case 'offline': return { text: 'OFFLINE', variant: 'outline' as const };
      default: return { text: 'UNKNOWN', variant: 'outline' as const };
    }
  };

  // Voice Guide Function
  const startVoiceGuide = () => {
    // Feature detection
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      console.warn('Speech synthesis not supported in this browser');
      return;
    }

    if (!isVoiceGuideActive) {
      setIsVoiceGuideActive(true);
      
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      const voiceContent = `Welcome to the Contractor Command Voice Navigation Guide. This is your comprehensive contractor management system for coordinating disaster recovery operations.

      The dashboard shows key contractor metrics:
      - Available Contractors displaying ready teams with green status indicators
      - Busy Contractors showing teams currently on active jobs with yellow status
      - Offline Contractors indicating unavailable teams with gray status
      - Average Rating showing overall contractor performance scores

      Main action buttons include:
      - Add Contractor with a plus icon to onboard new disaster recovery specialists
      - Search Contractors with a search icon to quickly locate specific contractor profiles
      - Analytics with a trending up icon to view performance and utilization insights

      The contractor grid displays detailed information:
      - Contractor company names and specialties like Tree Removal, Roofing, Water Damage, Debris Removal, or Electrical work
      - Real-time status indicators with colored dots - green for available, yellow for busy, gray for offline
      - Star ratings showing customer satisfaction scores out of 5 stars
      - Completed jobs count indicating experience level
      - Response time averages showing how quickly contractors respond to assignments
      - Last active timestamps to track contractor engagement
      - Hourly rates for budget planning and cost estimation
      - Skill tags showing specific capabilities like Emergency Response, Storm Cleanup, or Insurance Claims
      - Certification badges such as ISA Certified, OSHA 30, GAF Master Elite, or HAAG Certified

      The job assignment section includes:
      - Pending jobs list with drag-and-drop functionality for easy assignment
      - Priority levels with color coding - red for urgent, orange for high, blue for medium, green for low
      - Estimated duration and job values for resource planning
      - Required skills matching for optimal contractor selection
      - Customer information and project locations

      Advanced features include:
      - Drag and drop job assignment where you can drag jobs from the pending list to available contractors
      - Real-time availability tracking that updates contractor status every 30 seconds
      - Smart matching that suggests contractors based on skills, location, and availability
      - Performance tracking with completion rates and customer feedback scores

      This Contractor Command system ensures efficient coordination of disaster recovery teams, optimizes job assignments based on skills and availability, and maintains quality control through performance monitoring. The voice guide supports accessibility and hands-free operation during emergency coordination situations.`;
      
      const utterance = new SpeechSynthesisUtterance(voiceContent);
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      utterance.volume = 0.8;
      
      if (voices.length > 0) {
        utterance.voice = voices.find(voice => voice.lang.includes('en')) || voices[0];
      }
      
      utterance.onend = () => {
        setIsVoiceGuideActive(false);
      };
      
      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event);
        setIsVoiceGuideActive(false);
      };
      
      window.speechSynthesis.speak(utterance);
    } else {
      window.speechSynthesis.cancel();
      setIsVoiceGuideActive(false);
    }
  };

  const availableCount = contractors.filter(c => c.status === 'available').length;
  const busyCount = contractors.filter(c => c.status === 'busy').length;
  const offlineCount = contractors.filter(c => c.status === 'offline').length;
  const avgRating = contractors.reduce((sum, c) => sum + c.rating, 0) / contractors.length || 0;

  const handleDragStart = (job: Job) => {
    setDraggedJob(job);
  };

  const handleDragEnd = () => {
    setDraggedJob(null);
  };

  const handleDrop = (contractorId: string) => {
    if (draggedJob) {
      console.log(`Assigning job ${draggedJob.id} to contractor ${contractorId}`);
      setDraggedJob(null);
    }
  };

  const getJobPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'border-red-500 bg-red-50 dark:bg-red-900/20';
      case 'high': return 'border-orange-500 bg-orange-50 dark:bg-orange-900/20';
      case 'medium': return 'border-blue-500 bg-blue-50 dark:bg-blue-900/20';
      case 'low': return 'border-green-500 bg-green-50 dark:bg-green-900/20';
      default: return 'border-gray-500 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  const getJobPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent': return { text: 'URGENT', variant: 'destructive' as const };
      case 'high': return { text: 'HIGH', variant: 'secondary' as const };
      case 'medium': return { text: 'MEDIUM', variant: 'default' as const };
      case 'low': return { text: 'LOW', variant: 'outline' as const };
      default: return { text: 'UNKNOWN', variant: 'outline' as const };
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/">
          <motion.button
            whileHover={{ scale: 1.05, x: -2 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
            data-testid="button-back-to-hub"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back to Hub</span>
          </motion.button>
        </Link>
        <StateCitySelector
          selectedState={selectedState}
          selectedCity={selectedCity}
          availableCities={availableCities}
          onStateChange={setSelectedState}
          onCityChange={setSelectedCity}
          variant="default"
          showAllStates={true}
        />
      </div>
      <DashboardSection
        title="Contractor Management"
        description="Administrative oversight and management of your contractor network, qualifications, and assignments"
        icon={Users}
        badge={{ text: `${contractors.length} ACTIVE`, variant: 'default' }}
        kpis={[
        { label: 'Total Contractors', value: 247, change: '+12 this month', color: 'blue', testId: 'text-active-contractors' },
        { label: 'Available Now', value: availableCount, change: 'Ready for dispatch', color: 'green', testId: 'text-available-contractors' },
        { label: 'On Assignment', value: busyCount, change: 'Across 23 states', color: 'amber', testId: 'text-assigned-contractors' },
        { label: 'Avg Rating', value: avgRating, change: 'Customer satisfaction', color: 'default', suffix: '/5.0', testId: 'text-avg-rating' }
      ]}
      actions={[
        { icon: Plus, label: 'Add Contractor', variant: 'default', testId: 'button-add-contractor', onClick: () => setShowAddModal(true) },
        { icon: Calendar, label: 'Schedule', variant: 'outline', testId: 'button-schedule-contractors', onClick: () => setShowScheduler(!showScheduler) },
        { icon: Briefcase, label: 'Jobs', variant: 'outline', testId: 'button-view-jobs', onClick: () => setSelectedView('assignment') },
        { icon: TrendingUp, label: 'Analytics', variant: 'outline', testId: 'button-contractor-analytics', onClick: () => setSelectedView('analytics') },
        { 
          icon: isVoiceGuideActive ? VolumeX : Volume2, 
          label: isVoiceGuideActive ? 'Stop Guide' : 'Voice Guide', 
          variant: 'outline', 
          testId: 'button-voice-guide',
          onClick: startVoiceGuide,
          'aria-label': 'Voice guide for Contractor Command',
          'aria-pressed': isVoiceGuideActive
        }
      ]}
      testId="contractor-management"
    >
      {/* View Toggle */}
      <div className="flex space-x-4 mb-6">
        {[
          { key: 'overview', label: 'Overview', icon: TrendingUp },
          { key: 'assignment', label: 'Job Assignment', icon: Briefcase },
          { key: 'performance', label: 'Performance', icon: Award },
          { key: 'onboarding', label: 'Onboarding', icon: UserPlus }
        ].map((view) => (
          <Button
            key={view.key}
            variant={selectedView === view.key ? 'default' : 'outline'}
            onClick={() => setSelectedView(view.key)}
            data-testid={`button-view-${view.key}`}
          >
            <view.icon className="w-4 h-4 mr-2" />
            {view.label}
          </Button>
        ))}
      </div>

      {selectedView === 'overview' && (
        <>
          {/* Availability Heatmap */}
          <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center">
            <MapPin className="h-5 w-5 text-blue-500 mr-2" />
            Regional Availability Heatmap
          </h3>
          <div className="flex space-x-2">
            {['all', 'FL', 'GA', 'AL'].map((region) => (
              <Button
                key={region}
                variant={selectedRegion === region ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedRegion(region)}
                data-testid={`button-region-${region}`}
              >
                {region.toUpperCase()}
              </Button>
            ))}
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { region: 'Tampa Bay', available: 12, total: 18, percentage: 67 },
            { region: 'Orlando', available: 8, total: 15, percentage: 53 },
            { region: 'Jacksonville', available: 15, total: 22, percentage: 68 },
            { region: 'Miami', available: 6, total: 19, percentage: 32 },
          ].map((area, index) => (
            <HoverLift key={area.region}>
              <Card className="relative overflow-hidden">
                <CardContent className="p-4">
                  <div className="text-center">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">{area.region}</h4>
                    <div className="relative w-16 h-16 mx-auto mb-3">
                      <svg className="w-16 h-16 transform -rotate-90">
                        <circle
                          cx="32"
                          cy="32"
                          r="28"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="transparent"
                          className="text-gray-200 dark:text-gray-700"
                        />
                        <motion.circle
                          cx="32"
                          cy="32"
                          r="28"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="transparent"
                          strokeLinecap="round"
                          strokeDasharray={`${2 * Math.PI * 28}`}
                          initial={{ strokeDashoffset: 2 * Math.PI * 28 }}
                          animate={{ strokeDashoffset: 2 * Math.PI * 28 * (1 - area.percentage / 100) }}
                          transition={{ duration: 1.5, ease: "easeOut", delay: index * 0.2 }}
                          className={area.percentage > 60 ? 'text-green-500' : area.percentage > 40 ? 'text-yellow-500' : 'text-red-500'}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                          {area.percentage}%
                        </span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Badge variant={area.percentage > 60 ? 'default' : area.percentage > 40 ? 'secondary' : 'destructive'}>
                        {area.available}/{area.total} Available
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </HoverLift>
          ))}
        </div>
      </div>

      {/* Live Contractor Status */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4 flex items-center">
          <Shield className="h-5 w-5 text-green-500 mr-2" />
          Live Contractor Status
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="ml-2 h-2 w-2 bg-green-500 rounded-full"
          />
        </h3>
        
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (
          <StaggerContainer className="space-y-4">
            {contractors.map((contractor) => (
              <StaggerItem key={contractor.id}>
                <HoverLift>
                  <Card className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-50/30 to-indigo-50/30 dark:from-blue-900/10 dark:to-indigo-900/10" />
                    <CardContent className="relative p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="relative">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                              {contractor.name.charAt(0)}
                            </div>
                            <motion.div
                              animate={contractor.status === 'available' ? { scale: [1, 1.2, 1] } : {}}
                              transition={{ duration: 2, repeat: Infinity }}
                              className={`absolute -bottom-1 -right-1 w-4 h-4 ${getStatusColor(contractor.status)} rounded-full border-2 border-white dark:border-gray-800`}
                            />
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <h4 className="font-semibold text-gray-900 dark:text-gray-100" data-testid={`contractor-name-${contractor.id}`}>
                                {contractor.name}
                              </h4>
                              <Badge variant={getStatusBadge(contractor.status).variant}>
                                {getStatusBadge(contractor.status).text}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{contractor.specialty} • {contractor.location}</p>
                            <div className="flex items-center space-x-4 mt-1">
                              <div className="flex items-center space-x-1">
                                <Star className="h-3 w-3 text-yellow-500 fill-current" />
                                <span className="text-xs text-gray-600 dark:text-gray-400">{contractor.rating}</span>
                              </div>
                              <span className="text-xs text-gray-500 dark:text-gray-400">{contractor.completedJobs} jobs</span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">Responds in {contractor.responseTime}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                          <div className="text-center">
                            <div className="text-xs text-gray-500 dark:text-gray-400">Last Active</div>
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {contractor.lastActive}
                            </div>
                          </div>
                          
                          <div className="flex space-x-2">
                            <Button size="sm" variant="outline" data-testid={`button-contact-${contractor.id}`}>
                              Contact
                            </Button>
                            <Button size="sm" variant="outline" data-testid={`button-assign-${contractor.id}`}>
                              Assign
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
        )}
      </div>

      {/* Compliance Status with Pulses */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="w-5 w-5 mr-2 text-green-600" />
              Compliance Dashboard
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { metric: 'Insurance Up-to-Date', value: 98, status: 'good', icon: CheckCircle },
              { metric: 'License Renewals', value: 87, status: 'warning', icon: AlertTriangle },
              { metric: 'Background Checks', value: 100, status: 'good', icon: CheckCircle },
            ].map((item, index) => (
              <div key={item.metric} className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{item.metric}</span>
                <div className="flex items-center space-x-2">
                  <Progress value={item.value} className="w-20 h-2" />
                  <motion.div
                    animate={item.status === 'warning' ? { scale: [1, 1.2, 1] } : {}}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <item.icon className={`w-4 h-4 ${item.status === 'good' ? 'text-green-600' : 'text-amber-600'}`} />
                  </motion.div>
                  <span className={`text-sm font-medium ${item.status === 'good' ? 'text-green-600' : 'text-amber-600'}`}>
                    {item.value}%
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
              Performance Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: 'Avg. Completion Time', value: '4.2 days', trend: 'down' },
              { label: 'Customer Satisfaction', value: '4.7/5.0', trend: 'up' },
              { label: 'On-time Completion', value: '94%', trend: 'up' },
            ].map((metric, index) => (
              <div key={metric.label} className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">{metric.label}</span>
                <div className="flex items-center space-x-1">
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{metric.value}</span>
                  <motion.div
                    animate={{ y: metric.trend === 'up' ? [-2, 0, -2] : [2, 0, 2] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <TrendingUp className={`w-3 h-3 ${metric.trend === 'up' ? 'text-green-500 rotate-0' : 'text-red-500 rotate-180'}`} />
                  </motion.div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-amber-600" />
              Alert Center
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { message: '3 licenses expire in 30 days', type: 'warning' },
              { message: '5 new contractor applications', type: 'info' },
              { message: '12 projects completed this week', type: 'success' },
            ].map((alert, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`p-3 rounded-lg border-l-4 ${
                  alert.type === 'warning' ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-400' :
                  alert.type === 'info' ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-400' :
                  'bg-green-50 dark:bg-green-900/20 border-green-400'
                }`}
              >
                <p className={`text-sm ${
                  alert.type === 'warning' ? 'text-amber-800 dark:text-amber-200' :
                  alert.type === 'info' ? 'text-blue-800 dark:text-blue-200' :
                  'text-green-800 dark:text-green-200'
                }`}>
                  {alert.message}
                </p>
              </motion.div>
            ))}
          </CardContent>
        </Card>
      </div>
        </>
      )}

      {selectedView === 'assignment' && (
        <>
          {/* Job Assignment Dashboard */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
            {/* Pending Jobs Queue */}
            <div className="xl:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Briefcase className="w-5 h-5 mr-2 text-blue-600" />
                    Pending Jobs Queue
                    <Badge variant="secondary" className="ml-2">
                      {pendingJobs.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 max-h-96 overflow-y-auto">
                  {pendingJobs.map((job, index) => (
                    <motion.div
                      key={job.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      draggable
                      onDragStart={() => handleDragStart(job)}
                      onDragEnd={handleDragEnd}
                      className={`p-4 border-2 border-dashed rounded-lg cursor-move transition-all hover:shadow-lg ${getJobPriorityColor(job.priority)}`}
                      data-testid={`job-${job.id}`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                          {job.title}
                        </h4>
                        <Badge variant={getJobPriorityBadge(job.priority).variant} className="text-xs">
                          {getJobPriorityBadge(job.priority).text}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
                        <div className="flex items-center space-x-1">
                          <Users className="h-3 w-3" />
                          <span>{job.customer}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-3 w-3" />
                          <span>{job.location}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>{job.estimatedDuration}</span>
                          </div>
                          <span className="font-semibold text-green-600">
                            ${job.value.toLocaleString()}
                          </span>
                        </div>
                      </div>
                      
                      <div className="mt-2 flex flex-wrap gap-1">
                        {job.skills.slice(0, 2).map((skill) => (
                          <Badge key={skill} variant="outline" className="text-xs px-1 py-0">
                            {skill}
                          </Badge>
                        ))}
                        {job.skills.length > 2 && (
                          <Badge variant="outline" className="text-xs px-1 py-0">
                            +{job.skills.length - 2}
                          </Badge>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Available Contractors - Drop Zones */}
            <div className="xl:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="w-5 h-5 mr-2 text-green-600" />
                    Available Contractors
                    <Badge variant="default" className="ml-2">
                      {availableCount} Ready
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                    {contractors
                      .filter(c => c.status === 'available')
                      .map((contractor, index) => (
                        <motion.div
                          key={contractor.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.1 }}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={() => handleDrop(contractor.id)}
                          className={`p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg transition-all hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 ${
                            draggedJob ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20' : ''
                          }`}
                          data-testid={`contractor-dropzone-${contractor.id}`}
                        >
                          <div className="flex items-start space-x-3">
                            <div className="relative">
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                {contractor.name.charAt(0)}
                              </div>
                              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800" />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">
                                {contractor.name}
                              </h4>
                              <p className="text-xs text-gray-600 dark:text-gray-400">
                                {contractor.specialty}
                              </p>
                              <div className="flex items-center justify-between mt-2">
                                <div className="flex items-center space-x-1">
                                  <Star className="h-3 w-3 text-yellow-500 fill-current" />
                                  <span className="text-xs text-gray-600 dark:text-gray-400">
                                    {contractor.rating}
                                  </span>
                                </div>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  ${contractor.hourlyRate}/hr
                                </span>
                              </div>
                              
                              <div className="mt-2 flex flex-wrap gap-1">
                                {contractor.skills.slice(0, 2).map((skill) => (
                                  <Badge key={skill} variant="secondary" className="text-xs px-1 py-0">
                                    {skill}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Assignment Analytics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { label: 'Pending Jobs', value: pendingJobs.length, icon: Briefcase, color: 'blue' },
              { label: 'Available Contractors', value: availableCount, icon: Users, color: 'green' },
              { label: 'Avg Response Time', value: '18 min', icon: Clock, color: 'amber' },
              { label: 'Match Success Rate', value: '87%', icon: Target, color: 'purple' }
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg bg-${stat.color}-100 dark:bg-${stat.color}-900/20`}>
                        <stat.icon className={`h-4 w-4 text-${stat.color}-600 dark:text-${stat.color}-400`} />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                          {stat.value}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {stat.label}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </>
      )}

      {selectedView === 'performance' && (
        <>
          {/* Performance Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { title: 'Top Performer', value: 'Mike\'s Tree Service', subtitle: '4.9★ rating', color: 'gold', icon: Award },
              { title: 'Fastest Response', value: 'Lightning Fast Repairs', subtitle: '12 min avg', color: 'blue', icon: Zap },
              { title: 'Most Jobs', value: 'Roof Masters Inc', subtitle: '67 completed', color: 'green', icon: Target },
              { title: 'Newest Star', value: 'Emergency Cleanup Pro', subtitle: 'Rising talent', color: 'purple', icon: TrendingUp }
            ].map((card, index) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                <HoverLift>
                  <Card className="relative overflow-hidden">
                    <div className={`absolute inset-0 bg-gradient-to-br from-${card.color}-50/50 to-${card.color}-100/50 dark:from-${card.color}-900/20 dark:to-${card.color}-800/20`} />
                    <CardContent className="relative p-4">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg bg-${card.color}-500/20`}>
                          <card.icon className={`h-5 w-5 text-${card.color}-600`} />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{card.title}</p>
                          <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                            {card.value}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{card.subtitle}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </HoverLift>
              </motion.div>
            ))}
          </div>

          {/* Contractor Performance Ranking */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Award className="w-5 h-5 mr-2 text-gold-600" />
                  Performance Leaderboard
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {contractors
                    .sort((a, b) => b.rating - a.rating)
                    .slice(0, 5)
                    .map((contractor, index) => (
                      <motion.div
                        key={contractor.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center space-x-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50"
                        data-testid={`performance-rank-${index + 1}`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                          index === 0 ? 'bg-yellow-500 text-white' :
                          index === 1 ? 'bg-gray-400 text-white' :
                          index === 2 ? 'bg-amber-600 text-white' :
                          'bg-blue-500 text-white'
                        }`}>
                          {index + 1}
                        </div>
                        
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                            {contractor.name}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {contractor.specialty} • {contractor.completedJobs} jobs
                          </p>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center space-x-1">
                            <Star className="h-4 w-4 text-yellow-500 fill-current" />
                            <span className="font-semibold text-gray-900 dark:text-gray-100">
                              {contractor.rating}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
                  Performance Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {[
                    { metric: 'Customer Satisfaction', current: 4.7, previous: 4.5, trend: 'up' },
                    { metric: 'Average Response Time', current: 18, previous: 22, unit: 'min', trend: 'down' },
                    { metric: 'Job Completion Rate', current: 94, previous: 91, unit: '%', trend: 'up' },
                    { metric: 'On-Time Delivery', current: 88, previous: 85, unit: '%', trend: 'up' },
                  ].map((trend, index) => (
                    <motion.div
                      key={trend.metric}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between"
                    >
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {trend.metric}
                      </span>
                      <div className="flex items-center space-x-3">
                        <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                          {trend.current}{trend.unit || ''}
                        </span>
                        <div className="flex items-center space-x-1">
                          <motion.div
                            animate={{ y: trend.trend === 'up' ? [-2, 0, -2] : [2, 0, 2] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          >
                            <TrendingUp className={`w-4 h-4 ${
                              trend.trend === 'up' 
                                ? 'text-green-500 rotate-0' 
                                : 'text-red-500 rotate-180'
                            }`} />
                          </motion.div>
                          <span className={`text-xs ${
                            trend.trend === 'up' 
                              ? 'text-green-600 dark:text-green-400' 
                              : 'text-red-600 dark:text-red-400'
                          }`}>
                            {Math.abs(trend.current - trend.previous)}{trend.unit || ''}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Performance Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="w-5 h-5 mr-2 text-amber-600" />
                  Response Time Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {contractors.map((contractor, index) => (
                    <div key={contractor.id} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400 truncate flex-1">
                        {contractor.name}
                      </span>
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${100 - parseInt(contractor.responseTime)}%` }}
                            transition={{ duration: 1, delay: index * 0.1 }}
                            className="bg-amber-500 h-2 rounded-full"
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100 w-12">
                          {contractor.responseTime}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Briefcase className="w-5 h-5 mr-2 text-green-600" />
                  Job Completion Stats
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {contractors.map((contractor, index) => (
                    <div key={contractor.id} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400 truncate flex-1">
                        {contractor.name}
                      </span>
                      <div className="flex items-center space-x-2">
                        <Progress 
                          value={(contractor.completedJobs / 70) * 100} 
                          className="w-16 h-2" 
                        />
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100 w-8">
                          {contractor.completedJobs}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Star className="w-5 h-5 mr-2 text-yellow-600" />
                  Rating Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {contractors.map((contractor, index) => (
                    <div key={contractor.id} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400 truncate flex-1">
                        {contractor.name}
                      </span>
                      <div className="flex items-center space-x-2">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3 h-3 ${
                                i < Math.floor(contractor.rating)
                                  ? 'text-yellow-500 fill-current'
                                  : 'text-gray-300 dark:text-gray-600'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100 w-8">
                          {contractor.rating}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {selectedView === 'onboarding' && (
        <>
          {/* Onboarding Pipeline Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {[
              { stage: 'Applications', count: 12, color: 'blue', icon: UserPlus },
              { stage: 'Under Review', count: 8, color: 'amber', icon: Search },
              { stage: 'Background Check', count: 5, color: 'purple', icon: Shield },
              { stage: 'Training', count: 3, color: 'green', icon: Award }
            ].map((stage, index) => (
              <motion.div
                key={stage.stage}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <HoverLift>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg bg-${stage.color}-100 dark:bg-${stage.color}-900/20`}>
                          <stage.icon className={`h-4 w-4 text-${stage.color}-600 dark:text-${stage.color}-400`} />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                            {stage.count}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {stage.stage}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </HoverLift>
              </motion.div>
            ))}
          </div>

          {/* Recent Applications */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <UserPlus className="w-5 h-5 mr-2 text-blue-600" />
                  Recent Applications
                  <Badge variant="secondary" className="ml-2">5 New</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { name: 'Alex Rodriguez', specialty: 'Electrical', date: '2 hours ago', status: 'pending', priority: 'high' },
                    { name: 'Sarah Mitchell', specialty: 'Plumbing', date: '5 hours ago', status: 'review', priority: 'medium' },
                    { name: 'David Kim', specialty: 'HVAC', date: '1 day ago', status: 'background', priority: 'low' },
                    { name: 'Maria Santos', specialty: 'Roofing', date: '2 days ago', status: 'training', priority: 'high' },
                    { name: 'John Parker', specialty: 'General Repair', date: '3 days ago', status: 'pending', priority: 'medium' }
                  ].map((applicant, index) => (
                    <motion.div
                      key={applicant.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      data-testid={`applicant-${index}`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {applicant.name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                            {applicant.name}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {applicant.specialty} • {applicant.date}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge
                          variant={
                            applicant.status === 'pending' ? 'secondary' :
                            applicant.status === 'review' ? 'default' :
                            applicant.status === 'background' ? 'outline' :
                            'default'
                          }
                        >
                          {applicant.status.toUpperCase()}
                        </Badge>
                        <Button size="sm" variant="outline" data-testid={`button-review-${index}`}>
                          Review
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="w-5 h-5 mr-2 text-purple-600" />
                  Onboarding Checklist
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { task: 'Application Review', completed: 95, total: 100 },
                    { task: 'Document Verification', completed: 87, total: 100 },
                    { task: 'Background Checks', completed: 78, total: 100 },
                    { task: 'Insurance Verification', completed: 92, total: 100 },
                    { task: 'Training Modules', completed: 65, total: 100 },
                    { task: 'Field Assessment', completed: 45, total: 100 }
                  ].map((task, index) => (
                    <motion.div
                      key={task.task}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {task.task}
                        </span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {task.completed}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${task.completed}%` }}
                          transition={{ duration: 1, delay: index * 0.2 }}
                          className={`h-2 rounded-full ${
                            task.completed >= 90 ? 'bg-green-500' :
                            task.completed >= 70 ? 'bg-yellow-500' :
                            'bg-red-500'
                          }`}
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Training Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Award className="w-5 h-5 mr-2 text-green-600" />
                Training & Certification Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { name: 'Maria Santos', course: 'Storm Response Safety', progress: 85, status: 'In Progress' },
                  { name: 'David Kim', course: 'HVAC Fundamentals', progress: 100, status: 'Completed' },
                  { name: 'Alex Rodriguez', course: 'Electrical Code Updates', progress: 45, status: 'In Progress' },
                  { name: 'Sarah Mitchell', course: 'Plumbing Basics', progress: 70, status: 'In Progress' },
                  { name: 'John Parker', course: 'Customer Service', progress: 100, status: 'Completed' },
                  { name: 'Lisa Wang', course: 'Safety Protocols', progress: 30, status: 'Started' }
                ].map((trainee, index) => (
                  <motion.div
                    key={trainee.name}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="h-full">
                      <CardContent className="p-4">
                        <div className="flex items-start space-x-3 mb-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                            {trainee.name.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                              {trainee.name}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                              {trainee.course}
                            </p>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              Progress
                            </span>
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {trainee.progress}%
                            </span>
                          </div>
                          <Progress value={trainee.progress} className="h-2" />
                          <Badge 
                            variant={
                              trainee.status === 'Completed' ? 'default' :
                              trainee.status === 'In Progress' ? 'secondary' :
                              'outline'
                            }
                            className="text-xs"
                          >
                            {trainee.status}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Add Contractor Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Add New Contractor</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                data-testid="button-close-add-modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              if (newContractor.name && newContractor.email) {
                addContractorMutation.mutate(newContractor);
              } else {
                alert('Please fill in name and email fields');
              }
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    value={newContractor.name}
                    onChange={(e) => setNewContractor({ ...newContractor, name: e.target.value })}
                    className="w-full border rounded px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600"
                    placeholder="e.g., Emergency Cleanup Services"
                    data-testid="input-contractor-name"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={newContractor.email}
                    onChange={(e) => setNewContractor({ ...newContractor, email: e.target.value })}
                    className="w-full border rounded px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600"
                    placeholder="contact@contractor.com"
                    data-testid="input-contractor-email"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={newContractor.phone}
                    onChange={(e) => setNewContractor({ ...newContractor, phone: e.target.value })}
                    className="w-full border rounded px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600"
                    placeholder="(555) 123-4567"
                    data-testid="input-contractor-phone"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Specialty
                  </label>
                  <input
                    type="text"
                    value={newContractor.specialty}
                    onChange={(e) => setNewContractor({ ...newContractor, specialty: e.target.value })}
                    className="w-full border rounded px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600"
                    placeholder="e.g., Tree Removal, Roofing, Water Damage"
                    data-testid="input-contractor-specialty"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    value={newContractor.location}
                    onChange={(e) => setNewContractor({ ...newContractor, location: e.target.value })}
                    className="w-full border rounded px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600"
                    placeholder="City, State"
                    data-testid="input-contractor-location"
                  />
                </div>
              </div>
              
              <div className="flex gap-2 mt-6">
                <button
                  type="submit"
                  disabled={addContractorMutation.isPending}
                  className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                  data-testid="button-submit-contractor"
                >
                  {addContractorMutation.isPending ? 'Adding...' : 'Add Contractor'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border rounded hover:bg-gray-50 dark:hover:bg-gray-700"
                  data-testid="button-cancel-add-contractor"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardSection>
      <ModuleAIAssistant moduleName="Contractor Management" />
    </div>
  );
}