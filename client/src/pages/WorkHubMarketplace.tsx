import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Camera, DollarSign, Users, Calendar, Briefcase, Shield,
  Bot, CreditCard, Star, TrendingUp, Wallet, Image,
  ArrowRight, Zap, Volume2, VolumeX, Award, Target,
  Search, Menu, X, ChevronRight, Activity, Upload,
  BarChart3, Clock, FileCheck
} from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import ModuleAIAssistant from '@/components/ModuleAIAssistant';
import { AutonomousAgentDashboard, AutonomousAgentBadge } from '@/components/AutonomousAgentBadge';

const MODULES = [
  { id: 'scopesnap', name: 'ScopeSnap', tagline: 'AI Vision Analysis', path: '/workhub/scopesnap', icon: Camera, group: 'get-started', color: 'from-violet-500 to-purple-600', description: 'Upload photos & videos. AI instantly identifies the job, issues, and required trades.', features: ['Photo/Video Analysis', 'Job Identification', 'Issue Detection', 'Trade Matching'] },
  { id: 'contractormatch', name: 'ContractorMatch', tagline: 'Find Verified Pros', path: '/workhub/contractormatch', icon: Users, group: 'get-started', color: 'from-blue-500 to-cyan-600', description: 'AI matches customers with verified contractors based on trade, location, ratings & availability.', features: ['Smart Matching', 'Verified Pros', 'Location-Based', 'Availability'] },
  { id: 'jobflow', name: 'JobFlow', tagline: 'Project Command Center', path: '/workhub/jobflow', icon: Briefcase, group: 'manage-work', color: 'from-indigo-500 to-blue-600', description: 'Track every job from estimate to completion. Real-time progress for contractors & customers.', features: ['Progress Tracking', 'Milestones', 'Customer Portal', 'Team Mgmt'] },
  { id: 'calendarsync', name: 'CalendarSync', tagline: 'AI Scheduling', path: '/workhub/calendarsync', icon: Calendar, group: 'manage-work', color: 'from-orange-500 to-amber-600', description: 'Automated appointment booking with AI coordination. Never miss a lead again.', features: ['Auto-Scheduling', 'Reminders', 'Conflict Prevention', 'Customer Choice'] },
  { id: 'leadpipeline', name: 'Lead Pipeline', tagline: 'Opportunity Tracker', path: '/workhub/leadpipeline', icon: Target, group: 'manage-work', color: 'from-emerald-500 to-teal-600', description: 'Manage leads from first contact to job completion. Never miss a follow-up.', features: ['Lead Tracking', 'Status Pipeline', 'Follow-up Alerts', 'Analytics'] },
  { id: 'pricewhisperer', name: 'PriceWhisperer', tagline: 'Smart Estimates', path: '/workhub/pricewhisperer', icon: DollarSign, group: 'money', color: 'from-emerald-500 to-green-600', description: 'AI-powered pricing with market comparisons. Get fair estimates customers trust.', features: ['Market Comparisons', 'Fair Pricing', 'Second Opinion', 'Instant Quotes'] },
  { id: 'paystream', name: 'PayStream', tagline: 'Payments', path: '/workhub/paystream', icon: CreditCard, group: 'money', color: 'from-teal-500 to-cyan-600', description: 'In-app invoicing and payments. Get paid faster with one-click customer checkout.', features: ['In-App Payments', 'Auto Invoicing', 'Payment Tracking', 'Financing'] },
  { id: 'quickfinance', name: 'QuickFinance', tagline: 'Instant Financing', path: '/workhub/quickfinance', icon: Wallet, group: 'money', color: 'from-purple-500 to-violet-600', description: 'Offer Pay-in-4, monthly payments & financing at estimate time. Close more deals.', features: ['Pay-in-4', 'Monthly Plans', 'Partner Lenders', 'Instant Approval'] },
  { id: 'closebot', name: 'CloseBot', tagline: 'AI Sales Agent', path: '/workhub/closebot', icon: Bot, group: 'grow', color: 'from-rose-500 to-pink-600', description: 'Human-sounding AI calls customers, answers objections, and closes deals.', features: ['AI Voice Calls', 'Objection Handling', 'Auto Close', 'Follow-ups'] },
  { id: 'reviewrocket', name: 'ReviewRocket', tagline: 'Reputation', path: '/workhub/reviewrocket', icon: Star, group: 'grow', color: 'from-yellow-500 to-orange-600', description: 'Auto-collect reviews and distribute to Google, Facebook & more. AI responds for you.', features: ['Auto Collection', 'Multi-Platform', 'AI Responses', 'Score'] },
  { id: 'contentforge', name: 'ContentForge', tagline: 'Marketing Engine', path: '/workhub/contentforge', icon: Image, group: 'grow', color: 'from-pink-500 to-rose-600', description: 'Auto-generate social posts, galleries & ads from your job photos.', features: ['Auto Social', 'Website Galleries', 'Ad Generation', 'Brand Builder'] },
  { id: 'mediavault', name: 'MediaVault', tagline: 'Creative Studio', path: '/workhub/mediavault', icon: Shield, group: 'grow', color: 'from-slate-600 to-gray-700', description: 'Before, during & after photos secured forever. AI video, flyers, brochures.', features: ['Photo Security', 'AI Video', 'Flyers & Ads', 'Brochures'] },
  { id: 'fairnessscore', name: 'FairnessScore', tagline: 'Trust Score', path: '/workhub/fairnessscore', icon: TrendingUp, group: 'trust', color: 'from-lime-500 to-green-600', description: 'AI-calculated contractor scores based on pricing accuracy, reliability & satisfaction.', features: ['Pricing Accuracy', 'On-Time Rating', 'Quality Score', 'Trust Badges'] },
  { id: 'jobsnap', name: 'JobSnap', tagline: 'Documentation', path: '/workhub/jobsnap', icon: Camera, group: 'trust', color: 'from-purple-500 to-indigo-600', description: 'Capture before, during & after photos. Timestamps, GPS, organized by project.', features: ['Before/During/After', 'GPS Tagging', 'Project Org', 'Reports'] },
  { id: 'femaaudit', name: 'FEMA Audit', tagline: 'Compliance & Export', path: '/fema-audit', icon: FileCheck, group: 'trust', color: 'from-red-600 to-orange-600', description: 'Enterprise-grade FEMA compliance system. AI field verification, fraud detection, load ticket chain of custody, and one-click audit export.', features: ['AI Verification', 'Fraud Detection', 'Audit Export', 'Rate Validation'] },
];

const RESOURCE_LINKS = [
  { id: 'pricing', name: 'Pricing Plans', path: '/workhub/pricing', icon: DollarSign },
  { id: 'scripts', name: 'AI Agent Scripts', path: '/workhub/scripts', icon: Bot },
  { id: 'pitch', name: 'Pitch Deck', path: '/workhub/pitch', icon: TrendingUp },
  { id: 'legal', name: 'Legal & Terms', path: '/workhub/legal', icon: Shield },
];

const SIDEBAR_GROUPS = [
  { id: 'get-started', label: 'Get Started', icon: Zap },
  { id: 'manage-work', label: 'Manage Work', icon: Briefcase },
  { id: 'money', label: 'Money', icon: DollarSign },
  { id: 'grow', label: 'Grow Business', icon: TrendingUp },
  { id: 'trust', label: 'Trust & Quality', icon: Award },
];

const MODULE_NAME_MAP: Record<string, string> = {
  scopesnap: 'ScopeSnap',
  contractormatch: 'ContractorMatch',
  jobflow: 'JobFlow',
  calendarsync: 'CalendarSync',
  leadpipeline: 'LeadPipeline',
  pricewhisperer: 'PriceWhisperer',
  paystream: 'PayStream',
  quickfinance: 'QuickFinance',
  closebot: 'CloseBot',
  reviewrocket: 'ReviewRocket',
  contentforge: 'ContentForge',
  mediavault: 'MediaVault',
  fairnessscore: 'FairnessScore',
  jobsnap: 'JobSnap',
  femaaudit: 'FEMAAudit',
};

const CONTRACTOR_STATS = [
  { label: 'New Leads', value: '12', icon: Users, color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400' },
  { label: 'Active Jobs', value: '5', icon: Briefcase, color: 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400' },
  { label: 'Revenue', value: '$24,850', icon: DollarSign, color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400' },
  { label: 'Rating', value: '4.9', icon: Star, color: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400' },
];

const CUSTOMER_STATS = [
  { label: 'My Projects', value: '3', icon: Briefcase, color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400' },
  { label: 'Quotes Received', value: '7', icon: DollarSign, color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400' },
  { label: 'Contractors Matched', value: '4', icon: Users, color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400' },
  { label: 'Saved', value: '$1,200', icon: TrendingUp, color: 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400' },
];

const CONTRACTOR_ACTIONS = [
  { label: 'View Leads', icon: Users, path: '/workhub/leadpipeline', color: 'from-emerald-500 to-teal-600' },
  { label: 'Send Estimate', icon: DollarSign, path: '/workhub/pricewhisperer', color: 'from-emerald-500 to-green-600' },
  { label: 'Track Jobs', icon: Briefcase, path: '/workhub/jobflow', color: 'from-indigo-500 to-blue-600' },
  { label: 'AI Sales Agent', icon: Bot, path: '/workhub/closebot', color: 'from-rose-500 to-pink-600' },
];

const CUSTOMER_ACTIONS = [
  { label: 'Upload Photos', icon: Upload, path: '/workhub/scopesnap', color: 'from-violet-500 to-purple-600' },
  { label: 'Find Contractor', icon: Users, path: '/workhub/contractormatch', color: 'from-blue-500 to-cyan-600' },
  { label: 'Get Estimate', icon: DollarSign, path: '/workhub/pricewhisperer', color: 'from-emerald-500 to-green-600' },
  { label: 'Track Project', icon: Briefcase, path: '/workhub/jobflow', color: 'from-indigo-500 to-blue-600' },
];

const CONTRACTOR_ACTIVITY = [
  { action: 'New lead received', detail: 'Tree removal in Austin, TX', time: '2 min ago', icon: Users },
  { action: 'Estimate approved', detail: 'Roofing project - $4,200', time: '15 min ago', icon: DollarSign },
  { action: 'Job completed', detail: 'Fence installation - 5★ review', time: '1 hr ago', icon: Star },
  { action: 'AI agent closed deal', detail: 'CloseBot secured $3,800 job', time: '2 hrs ago', icon: Bot },
  { action: 'Payment received', detail: '$2,100 via PayStream', time: '3 hrs ago', icon: CreditCard },
];

const CUSTOMER_ACTIVITY = [
  { action: 'Photo analysis complete', detail: 'ScopeSnap identified 3 issues', time: '5 min ago', icon: Camera },
  { action: 'New quote received', detail: 'Roofing estimate - $3,800', time: '20 min ago', icon: DollarSign },
  { action: 'Contractor matched', detail: 'Pro Roofers LLC - 4.9★ rated', time: '1 hr ago', icon: Users },
  { action: 'Appointment confirmed', detail: 'Wed Dec 18 at 10:00 AM', time: '2 hrs ago', icon: Calendar },
  { action: 'Project completed', detail: 'Painting job - rated 5★', time: '1 day ago', icon: Star },
];

const CUSTOMER_SIDEBAR_GROUPS = [
  { id: 'get-started', label: 'Get Started', icon: Zap },
  { id: 'manage-work', label: 'My Projects', icon: Briefcase },
  { id: 'money', label: 'Pricing & Payments', icon: DollarSign },
  { id: 'trust', label: 'Trust & Reviews', icon: Award },
];

const CUSTOMER_MODULES = ['scopesnap', 'contractormatch', 'jobflow', 'calendarsync', 'pricewhisperer', 'paystream', 'quickfinance', 'fairnessscore', 'reviewrocket', 'mediavault', 'jobsnap', 'femaaudit'];

const CUSTOMER_GROUP_MAP: Record<string, string> = {
  scopesnap: 'get-started',
  contractormatch: 'get-started',
  jobflow: 'manage-work',
  calendarsync: 'manage-work',
  pricewhisperer: 'money',
  paystream: 'money',
  quickfinance: 'money',
  fairnessscore: 'trust',
  reviewrocket: 'trust',
  mediavault: 'manage-work',
  jobsnap: 'manage-work',
  femaaudit: 'trust',
};

export default function WorkHubMarketplace() {
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeRole, setActiveRole] = useState<'customer' | 'contractor'>('contractor');
  const [searchQuery, setSearchQuery] = useState('');
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const hasPlayedWelcome = useRef(false);
  const voiceEnabledRef = useRef(true);

  const voiceMutation = useMutation({
    mutationFn: async (message: string) => {
      const res = await apiRequest("POST", "/api/closebot/chat", {
        message,
        history: [],
        context: { leadName: "contractor", companyName: "your company", trade: "marketplace" },
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
      voiceMutation.mutate("Welcome to the WorkHub dashboard. I'm Rachel, your AI assistant. You have 12 new leads and 5 active jobs. Let me know how I can help you today.");
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

  const currentModule = selectedModule ? MODULES.find(m => m.id === selectedModule) : null;

  const filteredModules = searchQuery
    ? MODULES.filter(m =>
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.tagline.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : MODULES;

  const filteredResources = searchQuery
    ? RESOURCE_LINKS.filter(r => r.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : RESOURCE_LINKS;

  const roleModules = activeRole === 'customer'
    ? filteredModules.filter(m => CUSTOMER_MODULES.includes(m.id)).map(m => ({ ...m, group: CUSTOMER_GROUP_MAP[m.id] || m.group }))
    : filteredModules;

  const sidebarGroups = activeRole === 'customer' ? CUSTOMER_SIDEBAR_GROUPS : SIDEBAR_GROUPS;
  const stats = activeRole === 'customer' ? CUSTOMER_STATS : CONTRACTOR_STATS;
  const quickActions = activeRole === 'customer' ? CUSTOMER_ACTIONS : CONTRACTOR_ACTIONS;
  const recentActivity = activeRole === 'customer' ? CUSTOMER_ACTIVITY : CONTRACTOR_ACTIVITY;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex">
      <audio ref={audioRef} className="hidden" />

      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      <aside className={`fixed top-0 left-0 z-50 h-full w-[280px] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-lg text-slate-900 dark:text-white">WorkHub</span>
            </div>
            <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setSidebarOpen(false)}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
            <button
              onClick={() => { setActiveRole('customer'); setSelectedModule(null); }}
              className={`flex-1 text-xs font-medium py-2 px-3 rounded-md transition-all ${activeRole === 'customer' ? 'bg-white dark:bg-slate-700 text-purple-700 dark:text-purple-300 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
              I Need Work Done
            </button>
            <button
              onClick={() => { setActiveRole('contractor'); setSelectedModule(null); }}
              className={`flex-1 text-xs font-medium py-2 px-3 rounded-md transition-all ${activeRole === 'contractor' ? 'bg-white dark:bg-slate-700 text-purple-700 dark:text-purple-300 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
              I'm a Contractor
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          <button
            onClick={() => { setSelectedModule(null); setSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${!selectedModule ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
          >
            <BarChart3 className="w-4 h-4" />
            Overview
          </button>

          {sidebarGroups.map(group => {
            const groupModules = roleModules.filter(m => m.group === group.id);
            if (groupModules.length === 0 && searchQuery) return null;
            return (
              <div key={group.id} className="pt-3">
                <div className="flex items-center gap-2 px-3 mb-1">
                  <group.icon className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">{group.label}</span>
                </div>
                {groupModules.map(mod => (
                  <button
                    key={mod.id}
                    onClick={() => { setSelectedModule(mod.id); setSidebarOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${selectedModule === mod.id ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 font-medium' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                  >
                    <div className={`w-6 h-6 rounded-md bg-gradient-to-br ${mod.color} flex items-center justify-center flex-shrink-0`}>
                      <mod.icon className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div className="text-left min-w-0">
                      <p className="truncate">{mod.name}</p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">{mod.tagline}</p>
                    </div>
                  </button>
                ))}
              </div>
            );
          })}

          {filteredResources.length > 0 && (
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 mt-3">
              <div className="flex items-center gap-2 px-3 mb-1">
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Resources</span>
              </div>
              {filteredResources.map(res => (
                <Link
                  key={res.id}
                  to={res.path}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                >
                  <res.icon className="w-4 h-4 text-slate-400" />
                  <span>{res.name}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </aside>

      <div className="flex-1 lg:ml-[280px] flex flex-col min-h-screen">
        <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between px-4 lg:px-6 h-16">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
                <Menu className="w-5 h-5" />
              </Button>
              <div className="relative hidden sm:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Search modules..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64 h-9 bg-slate-100 dark:bg-slate-800 border-0"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleVoice}
                className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                {isPlaying ? (
                  <Volume2 className="w-5 h-5 animate-pulse text-purple-600" />
                ) : isVoiceEnabled ? (
                  <Volume2 className="w-5 h-5" />
                ) : (
                  <VolumeX className="w-5 h-5" />
                )}
              </Button>
              <Badge variant="outline" className="hidden sm:flex items-center gap-1 text-xs">
                <Activity className="w-3 h-3 text-green-500" />
                AI Active
              </Badge>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
          <div className="max-w-6xl mx-auto">
            <AnimatePresence mode="wait">
              {currentModule ? (
                <motion.div
                  key={currentModule.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                    <button onClick={() => setSelectedModule(null)} className="hover:text-purple-600 dark:hover:text-purple-400">WorkHub</button>
                    <ChevronRight className="w-4 h-4" />
                    <span className="text-slate-900 dark:text-white font-medium">{currentModule.name}</span>
                  </div>

                  <Card className="overflow-hidden border-0 shadow-lg">
                    <div className={`bg-gradient-to-r ${currentModule.color} p-6 lg:p-8`}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                            <currentModule.icon className="w-8 h-8 text-white" />
                          </div>
                          <div>
                            <h1 className="text-2xl lg:text-3xl font-bold text-white">{currentModule.name}</h1>
                            <p className="text-white/80 text-lg">{currentModule.tagline}</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => playRachelVoice(currentModule.description)}
                          className="text-white/80 hover:text-white hover:bg-white/10"
                        >
                          <Volume2 className="w-5 h-5" />
                        </Button>
                      </div>
                    </div>
                    <CardContent className="p-6 lg:p-8 space-y-6">
                      <p className="text-slate-600 dark:text-slate-400 text-lg">{currentModule.description}</p>

                      <div>
                        <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Key Features</h3>
                        <div className="flex flex-wrap gap-2">
                          {currentModule.features.map(feature => (
                            <Badge key={feature} variant="secondary" className="px-3 py-1.5 text-sm">
                              {feature}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <AutonomousAgentBadge moduleName={MODULE_NAME_MAP[currentModule.id] || currentModule.name} />

                      <div className="flex flex-wrap gap-3">
                        <Link to={currentModule.path}>
                          <Button size="lg" className={`bg-gradient-to-r ${currentModule.color} text-white hover:opacity-90`}>
                            Open Full Module
                            <ArrowRight className="w-5 h-5 ml-2" />
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ) : (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <div>
                    <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white">
                      {activeRole === 'contractor' ? 'Welcome back, Contractor!' : 'Welcome to WorkHub!'}
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                      {activeRole === 'contractor'
                        ? "Here's your business at a glance. Manage leads, jobs, and grow your business."
                        : "Find verified contractors and get your projects done with AI-powered tools."}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {stats.map(stat => (
                      <Card key={stat.label} className="hover:shadow-md transition-shadow border-slate-200 dark:border-slate-800">
                        <CardContent className="pt-5 pb-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-sm text-slate-500 dark:text-slate-400">{stat.label}</p>
                              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{stat.value}</p>
                            </div>
                            <div className={`p-2.5 rounded-xl ${stat.color}`}>
                              <stat.icon className="w-5 h-5" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <div>
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Quick Actions</h2>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                      {quickActions.map(action => (
                        <Link key={action.label} to={action.path}>
                          <Card className="hover:shadow-md transition-all hover:scale-[1.02] cursor-pointer border-slate-200 dark:border-slate-800">
                            <CardContent className="pt-5 pb-4 text-center">
                              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center mx-auto mb-3`}>
                                <action.icon className="w-6 h-6 text-white" />
                              </div>
                              <p className="font-medium text-sm text-slate-900 dark:text-white">{action.label}</p>
                            </CardContent>
                          </Card>
                        </Link>
                      ))}
                    </div>
                  </div>

                  <div>
                    <AutonomousAgentDashboard />
                  </div>

                  <div>
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Recent Activity</h2>
                    <Card className="border-slate-200 dark:border-slate-800">
                      <CardContent className="p-0">
                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                          {recentActivity.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                              <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                                <item.icon className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-slate-900 dark:text-white">{item.action}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{item.detail}</p>
                              </div>
                              <div className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500 flex-shrink-0">
                                <Clock className="w-3 h-3" />
                                {item.time}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>

      <ModuleAIAssistant moduleName="WorkHub" moduleContext="WorkHub unified dashboard for contractors and customers" />
    </div>
  );
}
