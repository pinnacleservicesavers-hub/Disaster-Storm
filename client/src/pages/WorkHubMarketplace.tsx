import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Camera, DollarSign, Users, Calendar, Briefcase, Shield,
  Bot, CreditCard, Star, TrendingUp, Wallet, Image,
  ArrowRight, Zap, Volume2, VolumeX, Award, Target,
  Search, ChevronRight, Activity, FileCheck, Mic,
  BarChart3, Layers, Gavel
} from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import TopNav from '@/components/TopNav';
import ModuleAIAssistant from '@/components/ModuleAIAssistant';
import { AutonomousAgentDashboard } from '@/components/AutonomousAgentBadge';

const MODULES = [
  { id: 'scopesnap', name: 'ScopeSnap', tagline: 'AI Vision Analysis', path: '/workhub/scopesnap', icon: Camera, group: 'get-started', color: 'from-violet-500 to-purple-600', description: 'Upload photos & videos. AI identifies jobs, issues & required trades instantly.', priority: 'high' },
  { id: 'contractormatch', name: 'ContractorMatch', tagline: 'Find Verified Pros', path: '/workhub/contractormatch', icon: Users, group: 'get-started', color: 'from-blue-500 to-cyan-600', description: 'AI matches customers with verified contractors by trade, location & ratings.', priority: 'high' },
  { id: 'pricewhisperer', name: 'PriceWhisperer', tagline: 'Smart Estimates', path: '/workhub/pricewhisperer', icon: DollarSign, group: 'money', color: 'from-emerald-500 to-green-600', description: 'AI-powered pricing with market comparisons. Fair estimates customers trust.', priority: 'high' },
  { id: 'closebot', name: 'CloseBot', tagline: 'AI Sales Agent', path: '/workhub/closebot', icon: Bot, group: 'grow', color: 'from-rose-500 to-pink-600', description: 'Human-sounding AI calls customers, handles objections & closes deals.', priority: 'high' },
  { id: 'mediavault', name: 'MediaVault', tagline: 'Creative Studio', path: '/workhub/mediavault', icon: Shield, group: 'grow', color: 'from-indigo-600 to-purple-700', description: 'AI video, flyers, ads, brochures, sound design for ANY industry. Zero limits.', priority: 'high' },
  { id: 'jobflow', name: 'JobFlow', tagline: 'Project Command Center', path: '/workhub/jobflow', icon: Briefcase, group: 'manage-work', color: 'from-indigo-500 to-blue-600', description: 'Track every job from estimate to completion with real-time progress.' },
  { id: 'calendarsync', name: 'CalendarSync', tagline: 'AI Scheduling', path: '/workhub/calendarsync', icon: Calendar, group: 'manage-work', color: 'from-orange-500 to-amber-600', description: 'Automated appointment booking with AI coordination. Never miss a lead.' },
  { id: 'leadpipeline', name: 'Lead Pipeline', tagline: 'Opportunity Tracker', path: '/workhub/leadpipeline', icon: Target, group: 'manage-work', color: 'from-emerald-500 to-teal-600', description: 'Manage leads from first contact to completion. Never miss a follow-up.' },
  { id: 'paystream', name: 'PayStream', tagline: 'Payments', path: '/workhub/paystream', icon: CreditCard, group: 'money', color: 'from-teal-500 to-cyan-600', description: 'In-app invoicing and payments. Get paid faster with one-click checkout.' },
  { id: 'quickfinance', name: 'QuickFinance', tagline: 'Instant Financing', path: '/workhub/quickfinance', icon: Wallet, group: 'money', color: 'from-purple-500 to-violet-600', description: 'Offer Pay-in-4, monthly payments & financing. Close more deals.' },
  { id: 'reviewrocket', name: 'ReviewRocket', tagline: 'Reputation', path: '/workhub/reviewrocket', icon: Star, group: 'grow', color: 'from-yellow-500 to-orange-600', description: 'Auto-collect reviews on Google, Facebook & more. AI responds for you.' },
  { id: 'contentforge', name: 'ContentForge', tagline: 'Marketing Engine', path: '/workhub/contentforge', icon: Image, group: 'grow', color: 'from-pink-500 to-rose-600', description: 'Auto-generate social posts, galleries & ads from your job photos.' },
  { id: 'fairnessscore', name: 'FairnessScore', tagline: 'Trust Score', path: '/workhub/fairnessscore', icon: TrendingUp, group: 'trust', color: 'from-lime-500 to-green-600', description: 'AI-calculated contractor scores based on pricing, reliability & satisfaction.' },
  { id: 'jobsnap', name: 'JobSnap', tagline: 'Documentation', path: '/workhub/jobsnap', icon: Camera, group: 'trust', color: 'from-purple-500 to-indigo-600', description: 'Capture before, during & after photos. Timestamps, GPS, organized by project.' },
  { id: 'femaaudit', name: 'AuditShield', tagline: 'Grant & Contract Compliance AI', path: '/fema-audit', icon: FileCheck, group: 'trust', color: 'from-red-600 to-orange-600', description: 'Multi-agency compliance (FEMA, USACE, HUD, DOT), AI fraud detection, photo documentation & one-click audit export.' },
];

const GROUP_INFO: Record<string, { label: string; icon: any }> = {
  'get-started': { label: 'Get Started', icon: Zap },
  'manage-work': { label: 'Manage Work', icon: Briefcase },
  'money': { label: 'Money', icon: DollarSign },
  'grow': { label: 'Grow Business', icon: TrendingUp },
  'trust': { label: 'Trust & Quality', icon: Award },
};

export default function WorkHubMarketplace() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const hasPlayedWelcome = useRef(false);
  const voiceEnabledRef = useRef(true);

  const voiceMutation = useMutation({
    mutationFn: async (message: string) => {
      const res = await apiRequest("/api/closebot/chat", "POST", {
        message,
        history: [],
        context: { leadName: "contractor", companyName: "your company", trade: "marketplace" },
        enableVoice: true
      });
      return res;
    },
    onSuccess: (data: any) => {
      if (!voiceEnabledRef.current) return;
      if (data.audioUrl && audioRef.current) {
        audioRef.current.src = data.audioUrl;
        audioRef.current.play().catch(() => {});
        setIsPlaying(true);
        audioRef.current.onended = () => setIsPlaying(false);
      }
    },
  });

  const fullGuidePrompt = `You're Rachel, the voice guide for WorkHub. Give a warm, energetic walkthrough of ALL 15 modules. Keep each module description to 1 sentence. Here's the order:

1. ScopeSnap - Upload photos and AI instantly identifies the job, issues, and what trades you need.
2. ContractorMatch - AI matches you with verified local contractors based on trade, ratings, and availability.
3. PriceWhisperer - Get AI-powered fair price estimates with real market comparisons so you never overpay.
4. CloseBot - Your AI sales agent that calls customers, handles objections, and closes deals for you.
5. MediaVault - Creative studio for AI video, flyers, ads, brochures, and sound design for any industry.
6. JobFlow - Your project command center to track every job from estimate to completion.
7. CalendarSync - AI scheduling that books appointments and prevents conflicts automatically.
8. Lead Pipeline - Track and manage every lead from first contact to closed deal.
9. PayStream - In-app invoicing and payments so you get paid faster with one-click checkout.
10. QuickFinance - Offer customers Pay-in-4 and monthly payment plans to close more deals.
11. ReviewRocket - Automatically collect reviews on Google and Facebook, with AI responses.
12. ContentForge - AI creates social media posts, ads, and marketing content from your job photos.
13. FairnessScore - AI trust scores based on pricing accuracy, reliability, and customer satisfaction.
14. JobSnap - Capture timestamped, GPS-tagged before, during, and after photos organized by project.
15. AuditShield - Multi-agency grant & contract compliance AI with fraud detection, photo documentation, and one-click audit export.

End with something encouraging like "Click any module to get started. I'm here if you need help!"`;

  useEffect(() => {
    if (!hasPlayedWelcome.current && voiceEnabledRef.current) {
      hasPlayedWelcome.current = true;
      voiceMutation.mutate(fullGuidePrompt);
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

  const filteredModules = MODULES.filter(m => {
    const matchesSearch = !searchQuery || 
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.tagline.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || m.group === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['get-started', 'manage-work', 'money', 'grow', 'trust'];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <TopNav />
      <audio ref={audioRef} className="hidden" />

      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-blue-900 text-white py-10 px-4 border-b border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl lg:text-5xl font-bold mb-2 flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                  <Zap className="w-7 h-7 text-white" />
                </div>
                WorkHub
              </h1>
              <p className="text-purple-200 text-lg">Your complete AI-powered business command center — every tool in one place</p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsVoiceEnabled(true);
                  voiceEnabledRef.current = true;
                  voiceMutation.mutate(fullGuidePrompt);
                }}
                disabled={voiceMutation.isPending}
                className="border-white/30 text-white hover:bg-white/10"
              >
                {voiceMutation.isPending ? (
                  <Volume2 className="w-4 h-4 mr-2 animate-pulse" />
                ) : (
                  <Mic className="w-4 h-4 mr-2" />
                )}
                {voiceMutation.isPending ? 'Loading Guide...' : 'Start Voice Guide'}
              </Button>
              <Button variant="ghost" size="lg" onClick={toggleVoice} className="text-white hover:bg-white/10">
                {isPlaying ? <Volume2 className="w-6 h-6 animate-pulse" /> : isVoiceEnabled ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
              </Button>
              <Badge className="bg-green-500/20 text-green-300 border-green-500/30 px-3 py-1.5">
                <Activity className="w-3.5 h-3.5 mr-1.5" />
                17 AI Agents Active
              </Badge>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-300" />
              <Input
                type="text"
                placeholder="Search modules..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-purple-300 h-10"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                size="sm"
                variant={!selectedCategory ? "secondary" : "ghost"}
                onClick={() => setSelectedCategory(null)}
                className={!selectedCategory ? "bg-white text-purple-900 hover:bg-white/90" : "text-purple-200 hover:bg-white/10 border border-white/20"}
              >
                All
              </Button>
              {categories.map(cat => {
                const info = GROUP_INFO[cat];
                return (
                  <Button
                    key={cat}
                    size="sm"
                    variant={selectedCategory === cat ? "secondary" : "ghost"}
                    onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                    className={selectedCategory === cat ? "bg-white text-purple-900 hover:bg-white/90" : "text-purple-200 hover:bg-white/10 border border-white/20"}
                  >
                    <info.icon className="w-3.5 h-3.5 mr-1.5" />
                    {info.label}
                  </Button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
          {filteredModules.map(mod => (
            <Link key={mod.id} to={mod.path} className="group">
              <Card className="relative overflow-hidden border-slate-700/50 bg-slate-800/50 hover:bg-slate-800/80 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/10 hover:border-purple-500/30 hover:-translate-y-1 h-full">
                <div className={`absolute inset-0 bg-gradient-to-br ${mod.color} opacity-[0.07] group-hover:opacity-[0.15] transition-opacity`} />
                <div className="absolute top-0 right-0">
                  {mod.priority === 'high' && (
                    <Badge className="bg-amber-500/90 text-white text-[10px] rounded-none rounded-bl-lg px-2">
                      Popular
                    </Badge>
                  )}
                </div>
                <CardContent className="relative pt-6 pb-5 px-5">
                  <div className="flex items-start gap-4 mb-4">
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${mod.color} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                      <mod.icon className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-white group-hover:text-purple-300 transition-colors">{mod.name}</h3>
                      <p className="text-sm text-slate-400">{mod.tagline}</p>
                    </div>
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed mb-4">{mod.description}</p>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs text-slate-400 border-slate-600">
                      {GROUP_INFO[mod.group]?.label}
                    </Badge>
                    <span className="text-sm text-purple-400 font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      Launch <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {filteredModules.length === 0 && (
          <div className="text-center py-16">
            <Search className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-400 mb-2">No modules found</h3>
            <p className="text-slate-500">Try a different search or clear filters</p>
            <Button variant="outline" className="mt-4 border-slate-600 text-slate-300" onClick={() => { setSearchQuery(''); setSelectedCategory(null); }}>
              Clear Filters
            </Button>
          </div>
        )}

        <AutonomousAgentDashboard />

        <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link to="/workhub/pricing">
            <Card className="bg-slate-800/50 border-slate-700/50 hover:border-purple-500/30 transition-all hover:-translate-y-0.5 cursor-pointer">
              <CardContent className="pt-5 pb-4 text-center">
                <DollarSign className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <p className="font-medium text-sm text-white">Pricing Plans</p>
              </CardContent>
            </Card>
          </Link>
          <Link to="/workhub/scripts">
            <Card className="bg-slate-800/50 border-slate-700/50 hover:border-purple-500/30 transition-all hover:-translate-y-0.5 cursor-pointer">
              <CardContent className="pt-5 pb-4 text-center">
                <Bot className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                <p className="font-medium text-sm text-white">AI Agent Scripts</p>
              </CardContent>
            </Card>
          </Link>
          <Link to="/workhub/pitch">
            <Card className="bg-slate-800/50 border-slate-700/50 hover:border-purple-500/30 transition-all hover:-translate-y-0.5 cursor-pointer">
              <CardContent className="pt-5 pb-4 text-center">
                <TrendingUp className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                <p className="font-medium text-sm text-white">Pitch Deck</p>
              </CardContent>
            </Card>
          </Link>
          <Link to="/workhub/legal">
            <Card className="bg-slate-800/50 border-slate-700/50 hover:border-purple-500/30 transition-all hover:-translate-y-0.5 cursor-pointer">
              <CardContent className="pt-5 pb-4 text-center">
                <Gavel className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                <p className="font-medium text-sm text-white">Legal & Terms</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>

      <ModuleAIAssistant moduleName="WorkHub" moduleContext="WorkHub unified dashboard for contractors and customers with 15 AI-powered modules" />
    </div>
  );
}
