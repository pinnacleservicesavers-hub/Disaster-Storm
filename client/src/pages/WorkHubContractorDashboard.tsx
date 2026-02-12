import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard, Users, Calendar, Briefcase, CreditCard,
  Star, TrendingUp, Image, Settings, Bell, Search,
  ChevronRight, ArrowUpRight, Clock, CheckCircle, XCircle,
  DollarSign, MapPin, Phone, Mail, Camera, MessageSquare,
  Volume2, VolumeX, Filter, MoreVertical, Eye, Send,
  ThumbsUp, AlertCircle, Zap, Award, Shield, Hammer, Lock, Heart
} from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import ModuleAIAssistant from '@/components/ModuleAIAssistant';

// Mock data for leads - Customer contact info is NEVER stored in frontend code
// Contact info is fetched from secure backend only after subscription verification
// See /api/workhub/leads/:id/contact endpoint for authorized access
const MOCK_LEADS = [
  {
    id: 'L001',
    customer: { name: 'John M.', initials: 'JM' },
    category: 'Tree Services',
    description: 'Large oak tree removal in backyard',
    location: { city: 'Austin', state: 'TX', distance: 5.2 },
    photos: 3,
    aiEstimate: { min: 1200, max: 2500 },
    urgency: 'normal',
    status: 'new',
    receivedAt: '2 hours ago',
    aiScore: 92
  },
  {
    id: 'L002',
    customer: { name: 'Sarah J.', initials: 'SJ' },
    category: 'Roofing',
    description: 'Roof inspection after storm damage',
    location: { city: 'Round Rock', state: 'TX', distance: 12.4 },
    photos: 8,
    aiEstimate: { min: 500, max: 15000 },
    urgency: 'urgent',
    status: 'new',
    receivedAt: '4 hours ago',
    aiScore: 88
  },
  {
    id: 'L003',
    customer: { name: 'Michael C.', initials: 'MC' },
    category: 'Fencing',
    description: '200ft privacy fence installation',
    location: { city: 'Cedar Park', state: 'TX', distance: 8.1 },
    photos: 5,
    aiEstimate: { min: 4500, max: 7000 },
    urgency: 'flexible',
    status: 'contacted',
    receivedAt: '1 day ago',
    aiScore: 95
  },
  {
    id: 'L004',
    customer: { name: 'Emily R.', initials: 'ER' },
    category: 'Painting',
    description: 'Interior painting - 4 bedroom house',
    location: { city: 'Georgetown', state: 'TX', distance: 15.3 },
    photos: 12,
    aiEstimate: { min: 2800, max: 4500 },
    urgency: 'normal',
    status: 'estimate_sent',
    receivedAt: '2 days ago',
    aiScore: 91
  }
];

const MOCK_JOBS = [
  {
    id: 'J001',
    customer: 'Robert Williams',
    category: 'Tree Services',
    status: 'in_progress',
    value: 2100,
    progress: 60,
    startDate: 'Dec 15, 2024',
    dueDate: 'Dec 18, 2024'
  },
  {
    id: 'J002',
    customer: 'Amanda Foster',
    category: 'Fencing',
    status: 'scheduled',
    value: 5500,
    progress: 0,
    startDate: 'Dec 20, 2024',
    dueDate: 'Dec 24, 2024'
  }
];

const STATS = [
  { label: 'New Leads', value: 12, change: '+3', trend: 'up', icon: Users, color: 'text-blue-600 bg-blue-100' },
  { label: 'Active Jobs', value: 5, change: '+1', trend: 'up', icon: Briefcase, color: 'text-green-600 bg-green-100' },
  { label: 'Revenue (MTD)', value: '$24,850', change: '+12%', trend: 'up', icon: DollarSign, color: 'text-emerald-600 bg-emerald-100' },
  { label: 'Rating', value: '4.9', change: '23 reviews', trend: 'neutral', icon: Star, color: 'text-yellow-600 bg-yellow-100' }
];

// Mock contractor subscription status - in production, this comes from backend
const MOCK_CONTRACTOR_STATUS = {
  isSubscribed: false, // Set to true when contractor has active subscription
  isVerifiedNonprofit: false, // Verified nonprofits get FREE access
  contractorType: 'commercial' as 'commercial' | 'nonprofit',
  subscriptionTier: 'free' // 'free', 'starter', 'pro', 'enterprise'
};

export default function WorkHubContractorDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const hasPlayedWelcome = useRef(false);
  const voiceEnabledRef = useRef(true);
  const [selectedLead, setSelectedLead] = useState<typeof MOCK_LEADS[0] | null>(null);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  
  // Check if contractor has access to contact info
  const hasContactAccess = MOCK_CONTRACTOR_STATUS.isSubscribed || MOCK_CONTRACTOR_STATUS.isVerifiedNonprofit;

  const voiceMutation = useMutation({
    mutationFn: async (message: string) => {
      const res = await apiRequest("POST", "/api/closebot/chat", {
        message,
        history: [],
        context: { leadName: "contractor", companyName: "your company", trade: "contractor_dashboard" },
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
      voiceMutation.mutate("Welcome to your WorkHub dashboard. You have 12 new leads waiting for your attention. Your top priority lead is a roofing inspection marked as urgent.");
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
    const statusConfig: Record<string, { label: string; className: string }> = {
      new: { label: 'New Lead', className: 'bg-blue-100 text-blue-700' },
      contacted: { label: 'Contacted', className: 'bg-purple-100 text-purple-700' },
      estimate_sent: { label: 'Estimate Sent', className: 'bg-amber-100 text-amber-700' },
      scheduled: { label: 'Scheduled', className: 'bg-cyan-100 text-cyan-700' },
      in_progress: { label: 'In Progress', className: 'bg-green-100 text-green-700' },
      completed: { label: 'Completed', className: 'bg-emerald-100 text-emerald-700' }
    };
    const config = statusConfig[status] || { label: status, className: 'bg-gray-100 text-gray-700' };
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const getUrgencyBadge = (urgency: string) => {
    const urgencyConfig: Record<string, { label: string; className: string }> = {
      emergency: { label: 'Emergency', className: 'bg-red-100 text-red-700 animate-pulse' },
      urgent: { label: 'Urgent', className: 'bg-orange-100 text-orange-700' },
      normal: { label: 'Normal', className: 'bg-blue-100 text-blue-700' },
      flexible: { label: 'Flexible', className: 'bg-gray-100 text-gray-700' }
    };
    const config = urgencyConfig[urgency] || { label: urgency, className: 'bg-gray-100 text-gray-700' };
    return <Badge variant="outline" className={config.className}>{config.label}</Badge>;
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <audio ref={audioRef} className="hidden" />
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
                <Link to="/workhub" className="hover:text-white">WorkHub</Link>
                <ChevronRight className="w-4 h-4" />
                <span>Contractor Dashboard</span>
              </div>
              <h1 className="text-2xl font-bold">Welcome back, Contractor!</h1>
              <p className="text-slate-400">Here's what's happening with your business today</p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleVoice}
                className="text-white hover:bg-white/10"
              >
                {isPlaying ? <Volume2 className="w-5 h-5 animate-pulse" /> : isVoiceEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </Button>
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/10 relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
              </Button>
              <Button variant="outline" className="border-white/30 text-white hover:bg-white/10" data-testid="button-settings">
                <Settings className="w-5 h-5 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {STATS.map((stat) => (
            <Card key={stat.label} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-slate-500 mb-1">{stat.label}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className={`text-xs mt-1 ${stat.trend === 'up' ? 'text-green-600' : 'text-slate-500'}`}>
                      {stat.change}
                    </p>
                  </div>
                  <div className={`p-3 rounded-xl ${stat.color}`}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content */}
        <Tabs defaultValue="leads" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
            <TabsTrigger value="leads" className="gap-2" data-testid="tab-leads">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Leads</span>
              <Badge className="ml-1 bg-blue-600">12</Badge>
            </TabsTrigger>
            <TabsTrigger value="jobs" className="gap-2" data-testid="tab-jobs">
              <Briefcase className="w-4 h-4" />
              <span className="hidden sm:inline">Jobs</span>
            </TabsTrigger>
            <TabsTrigger value="calendar" className="gap-2" data-testid="tab-calendar">
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">Calendar</span>
            </TabsTrigger>
            <TabsTrigger value="payments" className="gap-2" data-testid="tab-payments">
              <CreditCard className="w-4 h-4" />
              <span className="hidden sm:inline">Payments</span>
            </TabsTrigger>
            <TabsTrigger value="reviews" className="gap-2" data-testid="tab-reviews">
              <Star className="w-4 h-4" />
              <span className="hidden sm:inline">Reviews</span>
            </TabsTrigger>
          </TabsList>

          {/* Leads Tab */}
          <TabsContent value="leads" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Available Leads</h2>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Search leads..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-64"
                    data-testid="input-search-leads"
                  />
                </div>
                <Button variant="outline" size="sm">
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                </Button>
              </div>
            </div>

            <div className="grid gap-4">
              {MOCK_LEADS.map((lead) => (
                <motion.div
                  key={lead.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card 
                    className={`hover:shadow-lg transition-all cursor-pointer ${
                      lead.status === 'new' ? 'border-l-4 border-l-blue-500' : ''
                    }`}
                    onClick={() => setSelectedLead(lead)}
                    data-testid={`lead-${lead.id}`}
                  >
                    <CardContent className="py-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Avatar className="w-10 h-10">
                              <AvatarFallback className="bg-purple-100 text-purple-700">
                                {lead.customer.initials}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-semibold">{lead.customer.name}</p>
                              <div className="flex items-center gap-2 text-sm text-slate-500">
                                <MapPin className="w-3 h-3" />
                                {lead.location.city}, {lead.location.state} • {lead.location.distance} mi
                              </div>
                            </div>
                            <div className="flex gap-2 ml-4">
                              {getStatusBadge(lead.status)}
                              {getUrgencyBadge(lead.urgency)}
                            </div>
                          </div>

                          <div className="grid md:grid-cols-3 gap-4 mt-3">
                            <div>
                              <p className="text-sm text-slate-500">Service</p>
                              <p className="font-medium">{lead.category}</p>
                              <p className="text-sm text-slate-600">{lead.description}</p>
                            </div>
                            <div>
                              <p className="text-sm text-slate-500">AI Estimate</p>
                              <p className="font-semibold text-green-600">
                                ${lead.aiEstimate.min.toLocaleString()} - ${lead.aiEstimate.max.toLocaleString()}
                              </p>
                              <div className="flex items-center gap-1 text-sm">
                                <Camera className="w-3 h-3" />
                                {lead.photos} photos uploaded
                              </div>
                            </div>
                            <div>
                              <p className="text-sm text-slate-500">AI Match Score</p>
                              <div className="flex items-center gap-2">
                                <Progress value={lead.aiScore} className="h-2 w-24" />
                                <span className="font-semibold text-purple-600">{lead.aiScore}%</span>
                              </div>
                              <p className="text-xs text-slate-500 mt-1">{lead.receivedAt}</p>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2">
                          {hasContactAccess ? (
                            <Button size="sm" className="bg-purple-600 hover:bg-purple-700" data-testid={`button-contact-${lead.id}`}>
                              <Phone className="w-4 h-4 mr-1" />
                              Contact
                            </Button>
                          ) : (
                            <Button 
                              size="sm" 
                              className="bg-slate-400 hover:bg-slate-500" 
                              onClick={(e) => { e.stopPropagation(); setShowUpgradePrompt(true); }}
                              data-testid={`button-contact-locked-${lead.id}`}
                            >
                              <Lock className="w-4 h-4 mr-1" />
                              Unlock Contact
                            </Button>
                          )}
                          <Button size="sm" variant="outline" data-testid={`button-estimate-${lead.id}`}>
                            <Send className="w-4 h-4 mr-1" />
                            Send Estimate
                          </Button>
                          <Button size="sm" variant="ghost" data-testid={`button-view-${lead.id}`}>
                            <Eye className="w-4 h-4 mr-1" />
                            View Details
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-emerald-200">
                <CardContent className="py-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                        <Users className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Lead Pipeline</h3>
                        <p className="text-sm text-slate-600">Track every opportunity</p>
                      </div>
                    </div>
                    <Link to="/workhub/leadpipeline">
                      <Button className="bg-gradient-to-r from-emerald-600 to-teal-600" data-testid="button-leadpipeline">
                        Open
                        <ArrowUpRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border-purple-200">
                <CardContent className="py-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                        <Camera className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold">JobSnap</h3>
                        <p className="text-sm text-slate-600">Document your jobs</p>
                      </div>
                    </div>
                    <Link to="/workhub/jobsnap">
                      <Button className="bg-gradient-to-r from-purple-600 to-indigo-600" data-testid="button-jobsnap">
                        Open
                        <ArrowUpRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-900/20 dark:to-pink-900/20 border-rose-200">
              <CardContent className="py-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center">
                      <Zap className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold">CloseBot AI Sales Agent</h3>
                      <p className="text-sm text-slate-600">Let AI call customers and close deals for you</p>
                    </div>
                  </div>
                  <Link to="/workhub/closebot">
                    <Button className="bg-gradient-to-r from-rose-600 to-pink-600" data-testid="button-closebot">
                      Launch CloseBot
                      <ArrowUpRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Jobs Tab */}
          <TabsContent value="jobs" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Active Jobs</h2>
              <Button data-testid="button-new-job">
                <Briefcase className="w-4 h-4 mr-2" />
                New Job
              </Button>
            </div>

            <div className="grid gap-4">
              {MOCK_JOBS.map((job) => (
                <Card key={job.id} className="hover:shadow-md transition-shadow" data-testid={`job-${job.id}`}>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                          <Hammer className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold">{job.customer}</p>
                            {getStatusBadge(job.status)}
                          </div>
                          <p className="text-sm text-slate-500">{job.category}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-600">${job.value.toLocaleString()}</p>
                        <p className="text-xs text-slate-500">Due: {job.dueDate}</p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span>Progress</span>
                        <span>{job.progress}%</span>
                      </div>
                      <Progress value={job.progress} className="h-2" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Calendar Tab */}
          <TabsContent value="calendar" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-purple-600" />
                  CalendarSync
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">AI-powered scheduling coming soon. Set your availability and let AI coordinate with customers automatically.</p>
                <Link to="/workhub/calendarsync">
                  <Button className="mt-4" data-testid="button-calendarsync">
                    Open CalendarSync
                    <ArrowUpRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-purple-600" />
                  PayStream
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4 mb-6">
                  <div className="p-4 bg-green-50 rounded-xl">
                    <p className="text-sm text-green-600">Total Earned</p>
                    <p className="text-2xl font-bold text-green-700">$24,850</p>
                  </div>
                  <div className="p-4 bg-amber-50 rounded-xl">
                    <p className="text-sm text-amber-600">Pending</p>
                    <p className="text-2xl font-bold text-amber-700">$5,200</p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-xl">
                    <p className="text-sm text-blue-600">Available</p>
                    <p className="text-2xl font-bold text-blue-700">$19,650</p>
                  </div>
                </div>
                <Link to="/workhub/paystream">
                  <Button data-testid="button-paystream">
                    Manage Payments
                    <ArrowUpRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reviews Tab */}
          <TabsContent value="reviews" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-500" />
                  ReviewRocket
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6 mb-6">
                  <div className="text-center">
                    <p className="text-4xl font-bold text-yellow-500">4.9</p>
                    <div className="flex gap-1 justify-center my-1">
                      {[1,2,3,4,5].map(i => (
                        <Star key={i} className={`w-4 h-4 ${i <= 4.9 ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`} />
                      ))}
                    </div>
                    <p className="text-sm text-slate-500">23 reviews</p>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="bg-green-100 text-green-700">Fair Pricing</Badge>
                      <Badge className="bg-blue-100 text-blue-700">Reliable</Badge>
                      <Badge className="bg-purple-100 text-purple-700">Quality Work</Badge>
                    </div>
                    <p className="text-sm text-slate-600">
                      Your reviews are automatically distributed to Google, Facebook, and other platforms.
                    </p>
                  </div>
                </div>
                <Link to="/workhub/reviewrocket">
                  <Button data-testid="button-reviewrocket">
                    Manage Reviews
                    <ArrowUpRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <ModuleAIAssistant 
        moduleName="Contractor Dashboard"
        moduleContext="This is the contractor dashboard in WorkHub. Contractors can view leads, manage jobs, check payments, and see reviews. Help contractors respond to leads quickly, send estimates, and grow their business."
      />
      
      {/* Subscription Upgrade Dialog - Required to access customer contact info */}
      <Dialog open={showUpgradePrompt} onOpenChange={setShowUpgradePrompt}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-purple-600" />
              Unlock Customer Contact Info
            </DialogTitle>
            <DialogDescription>
              Subscribe to access customer phone numbers and email addresses for direct communication.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-lg p-4">
              <h4 className="font-semibold mb-2">Pro Contractor Plan</h4>
              <ul className="text-sm space-y-2 text-slate-600 dark:text-slate-400">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Unlimited lead access & contact info
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Priority matching for new leads
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Direct customer messaging
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  AI-powered estimate builder
                </li>
              </ul>
              <p className="mt-3 text-lg font-bold text-purple-700 dark:text-purple-400">
                $49/month
              </p>
            </div>
            
            <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-4 border border-emerald-200 dark:border-emerald-800">
              <div className="flex items-center gap-2 mb-2">
                <Heart className="w-5 h-5 text-emerald-600" />
                <h4 className="font-semibold text-emerald-700 dark:text-emerald-400">Non-Profit?</h4>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Verified 501(c)(3) organizations get <span className="font-bold text-emerald-600">FREE access</span> to all features!
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2 border-emerald-300 text-emerald-700 hover:bg-emerald-100"
                onClick={() => { setShowUpgradePrompt(false); /* Navigate to nonprofit signup */ }}
                data-testid="button-nonprofit-apply"
              >
                Apply as Non-Profit
              </Button>
            </div>
          </div>
          
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setShowUpgradePrompt(false)}>
              Maybe Later
            </Button>
            <Button className="bg-purple-600 hover:bg-purple-700" data-testid="button-subscribe">
              <CreditCard className="w-4 h-4 mr-2" />
              Subscribe Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
