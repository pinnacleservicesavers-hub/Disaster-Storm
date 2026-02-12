import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation } from '@tanstack/react-query';
import { User, Plus, Search, Settings, Phone, Mail, MessageSquare, Clock, Star, TrendingUp, Activity, Volume2, VolumeX, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { DashboardSection } from '@/components/DashboardSection';
import { FadeIn, SlideIn, StaggerContainer, StaggerItem, HoverLift } from '@/components/ui/animations';
import { StateCitySelector, useStateCitySelector } from '@/components/StateCitySelector';
import { apiRequest } from '@/lib/queryClient';
import ModuleAIAssistant from '@/components/ModuleAIAssistant';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  status: 'active' | 'completed' | 'pending';
  projectValue: number;
  lastContact: string;
  satisfaction: number;
  projectType: string;
}

interface Communication {
  id: string;
  customerName: string;
  type: 'call' | 'email' | 'sms';
  subject: string;
  timestamp: string;
  status: 'sent' | 'delivered' | 'read';
}

export default function Customers() {
  const { selectedState, setSelectedState, selectedCity, setSelectedCity, availableCities } = useStateCitySelector('Florida', 'Miami');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const hasPlayedWelcome = useRef(false);
  const voiceEnabledRef = useRef(true);

  // Mock customer data with cohort metrics
  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['customers', selectedFilter],
    queryFn: async (): Promise<Customer[]> => {
      await new Promise(resolve => setTimeout(resolve, 400));
      
      const allCustomers = [
        { id: '1', name: 'Sarah Johnson', email: 'sarah.j@email.com', phone: '(813) 555-0123', location: 'Tampa, FL', status: 'active' as const, projectValue: 15000, lastContact: '2 hours ago', satisfaction: 4.8, projectType: 'Storm Damage' },
        { id: '2', name: 'Michael Chen', email: 'mike.chen@email.com', phone: '(407) 555-0456', location: 'Orlando, FL', status: 'completed' as const, projectValue: 8500, lastContact: '1 day ago', satisfaction: 4.9, projectType: 'Roof Repair' },
        { id: '3', name: 'Emily Rodriguez', email: 'emily.r@email.com', phone: '(305) 555-0789', location: 'Miami, FL', status: 'pending' as const, projectValue: 22000, lastContact: '3 hours ago', satisfaction: 4.7, projectType: 'Water Damage' },
        { id: '4', name: 'David Wilson', email: 'david.w@email.com', phone: '(904) 555-0321', location: 'Jacksonville, FL', status: 'active' as const, projectValue: 12500, lastContact: '30 min ago', satisfaction: 4.6, projectType: 'Tree Removal' },
        { id: '5', name: 'Lisa Thompson', email: 'lisa.t@email.com', phone: '(239) 555-0654', location: 'Fort Myers, FL', status: 'completed' as const, projectValue: 18000, lastContact: '2 days ago', satisfaction: 5.0, projectType: 'Debris Cleanup' },
      ];

      return selectedFilter === 'all' ? allCustomers : allCustomers.filter(customer => customer.status === selectedFilter);
    },
    refetchInterval: 60000, // Refetch every minute
  });

  // Mock recent communications
  const { data: recentComms = [] } = useQuery({
    queryKey: ['recent-communications'],
    queryFn: async (): Promise<Communication[]> => {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      return [
        { id: '1', customerName: 'Sarah Johnson', type: 'call', subject: 'Project status update', timestamp: '15 min ago', status: 'delivered' },
        { id: '2', customerName: 'Michael Chen', type: 'email', subject: 'Final invoice and completion', timestamp: '1 hour ago', status: 'read' },
        { id: '3', customerName: 'Emily Rodriguez', type: 'sms', subject: 'Appointment confirmation', timestamp: '2 hours ago', status: 'delivered' },
        { id: '4', customerName: 'David Wilson', type: 'call', subject: 'Initial consultation call', timestamp: '3 hours ago', status: 'sent' },
        { id: '5', customerName: 'Lisa Thompson', type: 'email', subject: 'Thank you and follow-up', timestamp: '1 day ago', status: 'read' },
      ];
    },
    refetchInterval: 30000,
  });

  const voiceMutation = useMutation({
    mutationFn: async (message: string) => {
      const res = await apiRequest("POST", "/api/closebot/chat", {
        message,
        history: [],
        context: { leadName: "contractor", companyName: "your company", trade: "customer_management" },
        enableVoice: true
      });
      return res;
    },
    onSuccess: (data: any) => {
      if (data.audioUrl && audioRef.current) {
        audioRef.current.src = data.audioUrl;
        audioRef.current.play();
        setIsPlaying(true);
        audioRef.current.onended = () => setIsPlaying(false);
      }
    },
  });

  useEffect(() => {
    if (!hasPlayedWelcome.current && voiceEnabledRef.current) {
      hasPlayedWelcome.current = true;
      voiceMutation.mutate("Welcome to the Customer Hub. This is your comprehensive customer relationship management dashboard for disaster recovery operations.");
    }
  }, []);

  const toggleVoice = () => {
    const newState = !isVoiceEnabled;
    setIsVoiceEnabled(newState);
    voiceEnabledRef.current = newState;
    if (!newState && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };

  const playRachelVoice = (prompt: string) => {
    if (voiceEnabledRef.current) {
      voiceMutation.mutate(prompt);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return { text: 'ACTIVE', variant: 'default' as const };
      case 'completed': return { text: 'COMPLETED', variant: 'secondary' as const };
      case 'pending': return { text: 'PENDING', variant: 'outline' as const };
      default: return { text: 'UNKNOWN', variant: 'outline' as const };
    }
  };

  const getCommIcon = (type: string) => {
    switch (type) {
      case 'call': return Phone;
      case 'email': return Mail;
      case 'sms': return MessageSquare;
      default: return MessageSquare;
    }
  };

  const getCommColor = (status: string) => {
    switch (status) {
      case 'read': return 'text-[hsl(142,76%,36%)]';
      case 'delivered': return 'text-[hsl(217,71%,53%)]';
      case 'sent': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  const startVoiceGuide = () => {
    toggleVoice();
  };

  // Calculate cohort metrics
  const totalCustomers = customers.length;
  const activeProjects = customers.filter(c => c.status === 'active').length;
  const completedProjects = customers.filter(c => c.status === 'completed').length;
  const avgSatisfaction = customers.reduce((sum, c) => sum + c.satisfaction, 0) / customers.length || 0;
  const totalRevenue = customers.reduce((sum, c) => sum + c.projectValue, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(217,91%,15%)] via-[hsl(217,91%,25%)] to-[hsl(215,25%,25%)] dark:from-[hsl(217,91%,10%)] dark:via-[hsl(217,91%,20%)] dark:to-[hsl(215,25%,20%)]">
      <audio ref={audioRef} className="hidden" />
      <div className="container mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/">
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
        title="Customer Management"
        description="Manage customer relationships, communications, and service history with advanced analytics"
        icon={User}
        badge={{ text: `${totalCustomers} ACTIVE`, variant: 'default' }}
        kpis={[
        { label: 'Total Customers', value: 15847, change: '+342 this month', color: 'blue', testId: 'text-total-customers' },
        { label: 'Active Projects', value: activeProjects, change: 'Currently in progress', color: 'green', testId: 'text-active-projects' },
        { label: 'Satisfaction Rate', value: avgSatisfaction, change: 'Average rating', color: 'amber', suffix: '/5.0', testId: 'text-satisfaction-rate' },
        { label: 'Monthly Revenue', value: Math.round(totalRevenue / 1000), change: 'From active customers', color: 'default', suffix: 'K', testId: 'text-monthly-revenue' }
      ]}
      actions={[
        { icon: Plus, label: 'Add Customer', variant: 'default', testId: 'button-add-customer' },
        { icon: Search, label: 'Search Customers', variant: 'outline', testId: 'button-search-customers' },
        { icon: TrendingUp, label: 'Analytics', variant: 'outline', testId: 'button-customer-analytics' },
        { 
          icon: isPlaying ? Volume2 : isVoiceEnabled ? Volume2 : VolumeX, 
          label: isPlaying ? 'Playing' : isVoiceEnabled ? 'Voice Guide' : 'Voice Off', 
          variant: 'outline', 
          testId: 'button-voice-guide',
          onClick: startVoiceGuide,
          'aria-label': 'Voice guide for Customer Hub',
          'aria-pressed': isPlaying
        }
      ]}
      testId="customers-section"
    >
      {/* Animated Cohort Metrics */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4 flex items-center">
          <TrendingUp className="h-5 w-5 text-[hsl(217,71%,53%)] mr-2" />
          Customer Cohort Analytics
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { 
              title: 'Customer Lifecycle', 
              metrics: [
                { label: 'New This Month', value: 47, color: 'bg-[hsl(142,76%,36%)]', percentage: 25 },
                { label: 'Returning', value: 123, color: 'bg-[hsl(217,71%,53%)]', percentage: 65 },
                { label: 'At Risk', value: 19, color: 'bg-[hsl(0,84%,60%)]', percentage: 10 },
              ]
            },
            {
              title: 'Project Types',
              metrics: [
                { label: 'Storm Damage', value: 89, color: 'bg-purple-500', percentage: 45 },
                { label: 'Roof Repair', value: 67, color: 'bg-indigo-500', percentage: 35 },
                { label: 'Water Damage', value: 41, color: 'bg-cyan-500', percentage: 20 },
              ]
            },
            {
              title: 'Geographic Distribution',
              metrics: [
                { label: 'Tampa Bay', value: 78, color: 'bg-orange-500', percentage: 40 },
                { label: 'Orlando', value: 56, color: 'bg-yellow-500', percentage: 30 },
                { label: 'Miami', value: 43, color: 'bg-pink-500', percentage: 25 },
              ]
            }
          ].map((category, categoryIndex) => (
            <HoverLift key={category.title}>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{category.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {category.metrics.map((metric, index) => (
                    <div key={metric.label} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{metric.label}</span>
                        <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{metric.value}</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                        <motion.div
                          className={`h-2 rounded-full ${metric.color}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${metric.percentage}%` }}
                          transition={{ 
                            duration: 1.5, 
                            ease: "easeOut",
                            delay: categoryIndex * 0.2 + index * 0.1
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </HoverLift>
          ))}
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="flex space-x-4 mb-6">
        {[
          { key: 'all', label: 'All Customers' },
          { key: 'active', label: 'Active' },
          { key: 'completed', label: 'Completed' },
          { key: 'pending', label: 'Pending' }
        ].map((filter) => (
          <Button
            key={filter.key}
            variant={selectedFilter === filter.key ? 'default' : 'outline'}
            onClick={() => setSelectedFilter(filter.key)}
            data-testid={`button-filter-${filter.key}`}
          >
            {filter.label}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Customer List */}
        <div className="lg:col-span-2">
          <h3 className="text-xl font-semibold mb-4">Customer Directory</h3>
          
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : (
            <StaggerContainer className="space-y-4">
              {customers.map((customer, index) => (
                <StaggerItem key={customer.id}>
                  <HoverLift>
                    <Card className="relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-50/20 to-indigo-50/20 dark:from-blue-900/10 dark:to-indigo-900/10" />
                      <CardContent className="relative p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                              {customer.name.charAt(0)}
                            </div>
                            <div>
                              <div className="flex items-center space-x-2">
                                <h4 className="font-semibold text-gray-900 dark:text-gray-100" data-testid={`customer-name-${customer.id}`}>
                                  {customer.name}
                                </h4>
                                <Badge {...getStatusBadge(customer.status)} />
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400">{customer.email}</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">{customer.location} • {customer.projectType}</p>
                              <div className="flex items-center space-x-4 mt-1">
                                <div className="flex items-center space-x-1">
                                  <Star className="h-3 w-3 text-yellow-500 fill-current" />
                                  <span className="text-xs text-gray-600 dark:text-gray-400">{customer.satisfaction}</span>
                                </div>
                                <span className="text-xs text-gray-500 dark:text-gray-400">Last contact: {customer.lastContact}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-4">
                            <div className="text-right">
                              <div className="text-lg font-bold text-green-600 dark:text-green-400">
                                ${customer.projectValue.toLocaleString()}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">Project Value</div>
                            </div>
                            
                            <div className="flex space-x-2">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => {
                                  const cleanPhone = customer.phone.replace(/[^0-9+]/g, '');
                                  window.location.href = `tel:${cleanPhone}`;
                                }}
                                data-testid={`button-contact-${customer.id}`}
                                title={`Call ${customer.phone}`}
                              >
                                <Phone className="h-4 w-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => {
                                  window.location.href = `mailto:${customer.email}`;
                                }}
                                data-testid={`button-email-${customer.id}`}
                                title={`Email ${customer.email}`}
                              >
                                <Mail className="h-4 w-4" />
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

        {/* Recent Communications with Slide-in */}
        <div>
          <h3 className="text-xl font-semibold mb-4 flex items-center">
            <Activity className="h-5 w-5 text-[hsl(142,76%,36%)] mr-2" />
            Recent Communications
          </h3>
          
          <Card>
            <CardContent className="p-0">
              <div className="max-h-96 overflow-y-auto">
                <StaggerContainer className="space-y-0">
                  {recentComms.map((comm, index) => {
                    const IconComponent = getCommIcon(comm.type);
                    
                    return (
                      <StaggerItem key={comm.id}>
                        <SlideIn direction="right" delay={index * 0.1}>
                          <div className="p-4 border-b border-gray-100 dark:border-gray-700 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                            <div className="flex items-start space-x-3">
                              <div className={`p-2 rounded-lg ${ 
                                comm.type === 'call' ? 'bg-[hsl(142,76%,36%)]/10 dark:bg-[hsl(142,76%,36%)]/20' :
                                comm.type === 'email' ? 'bg-[hsl(217,71%,53%)]/10 dark:bg-[hsl(217,71%,53%)]/20' :
                                'bg-[hsl(282,71%,53%)]/10 dark:bg-[hsl(282,71%,53%)]/20'
                              }`}>
                                <IconComponent className={`h-4 w-4 ${
                                  comm.type === 'call' ? 'text-[hsl(142,76%,36%)] dark:text-[hsl(142,76%,56%)]' :
                                  comm.type === 'email' ? 'text-[hsl(217,71%,53%)] dark:text-[hsl(217,71%,63%)]' :
                                  'text-[hsl(282,71%,53%)] dark:text-[hsl(282,71%,63%)]'
                                }`} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                    {comm.customerName}
                                  </p>
                                  <Badge variant="outline" className={getCommColor(comm.status)}>
                                    {comm.status}
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                                  {comm.subject}
                                </p>
                                <div className="flex items-center space-x-2 mt-1">
                                  <Clock className="h-3 w-3 text-gray-400" />
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {comm.timestamp}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </SlideIn>
                      </StaggerItem>
                    );
                  })}
                </StaggerContainer>
              </div>
            </CardContent>
          </Card>
        </div>
        </div>
      </DashboardSection>
        <ModuleAIAssistant moduleName="Customer Hub" />
      </div>
    </div>
  );
}