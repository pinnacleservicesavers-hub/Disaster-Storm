import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Camera, DollarSign, Users, Calendar, Briefcase, Shield, 
  Bot, CreditCard, Star, TrendingUp, Wallet, Image,
  ArrowRight, Sparkles, Zap, CheckCircle, Play, Volume2,
  MapPin, Phone, Mail, Clock, Award, Hammer, TreePine,
  Home, Car, Paintbrush, Wrench, Plug, Droplets, Wind,
  Grid3X3, Building2, Truck, Settings, ChevronRight,
  Globe, Lock, Verified, MessageSquare, Search
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import ModuleAIAssistant from '@/components/ModuleAIAssistant';

// Creative Module Definitions with unique names
const WORKHUB_MODULES = [
  {
    id: 'scopesnap',
    name: 'ScopeSnap',
    tagline: 'AI Vision Analysis',
    description: 'Upload photos & videos. AI instantly identifies the job, issues, and required trades.',
    icon: Camera,
    color: 'from-violet-500 to-purple-600',
    bgPattern: 'bg-gradient-to-br from-violet-500/10 to-purple-600/10',
    features: ['Photo/Video Analysis', 'Job Identification', 'Issue Detection', 'Trade Matching'],
    path: '/workhub/scopesnap'
  },
  {
    id: 'pricewhisperer',
    name: 'PriceWhisperer',
    tagline: 'Smart Estimate Engine',
    description: 'AI-powered pricing with market comparisons. Get fair estimates customers trust.',
    icon: DollarSign,
    color: 'from-emerald-500 to-green-600',
    bgPattern: 'bg-gradient-to-br from-emerald-500/10 to-green-600/10',
    features: ['Market Comparisons', 'Fair Pricing', 'Second Opinion Mode', 'Instant Quotes'],
    path: '/workhub/pricewhisperer'
  },
  {
    id: 'contractormatch',
    name: 'ContractorMatch',
    tagline: 'Perfect Pairing',
    description: 'AI matches customers with verified contractors based on trade, location, ratings & availability.',
    icon: Users,
    color: 'from-blue-500 to-cyan-600',
    bgPattern: 'bg-gradient-to-br from-blue-500/10 to-cyan-600/10',
    features: ['Smart Matching', 'Verified Pros', 'Location-Based', 'Availability Sync'],
    path: '/workhub/contractormatch'
  },
  {
    id: 'calendarsync',
    name: 'CalendarSync',
    tagline: 'AI Scheduling',
    description: 'Automated appointment booking with AI coordination. Never miss a lead again.',
    icon: Calendar,
    color: 'from-orange-500 to-amber-600',
    bgPattern: 'bg-gradient-to-br from-orange-500/10 to-amber-600/10',
    features: ['Auto-Scheduling', 'Smart Reminders', 'Conflict Prevention', 'Customer Choice'],
    path: '/workhub/calendarsync'
  },
  {
    id: 'jobflow',
    name: 'JobFlow',
    tagline: 'Project Command Center',
    description: 'Track every job from estimate to completion. Real-time progress for contractors & customers.',
    icon: Briefcase,
    color: 'from-indigo-500 to-blue-600',
    bgPattern: 'bg-gradient-to-br from-indigo-500/10 to-blue-600/10',
    features: ['Progress Tracking', 'Milestone Updates', 'Customer Portal', 'Team Management'],
    path: '/workhub/jobflow'
  },
  {
    id: 'mediavault',
    name: 'MediaVault',
    tagline: 'Protected Documentation',
    description: 'Before, during & after photos secured forever. Eliminate disputes, create marketing gold.',
    icon: Shield,
    color: 'from-slate-600 to-gray-700',
    bgPattern: 'bg-gradient-to-br from-slate-600/10 to-gray-700/10',
    features: ['Photo Protection', 'Dispute Prevention', 'Auto-Galleries', 'Social Ready'],
    path: '/workhub/mediavault'
  },
  {
    id: 'closebot',
    name: 'CloseBot',
    tagline: 'AI Sales Agent',
    description: 'Human-sounding AI calls customers, answers objections, and closes deals for you.',
    icon: Bot,
    color: 'from-rose-500 to-pink-600',
    bgPattern: 'bg-gradient-to-br from-rose-500/10 to-pink-600/10',
    features: ['AI Voice Calls', 'Objection Handling', 'Estimate Explanation', 'Auto Close'],
    path: '/workhub/closebot'
  },
  {
    id: 'paystream',
    name: 'PayStream',
    tagline: 'Seamless Payments',
    description: 'In-app invoicing and payments. Get paid faster with one-click customer checkout.',
    icon: CreditCard,
    color: 'from-teal-500 to-cyan-600',
    bgPattern: 'bg-gradient-to-br from-teal-500/10 to-cyan-600/10',
    features: ['In-App Payments', 'Auto Invoicing', 'Payment Tracking', 'Financing Options'],
    path: '/workhub/paystream'
  },
  {
    id: 'reviewrocket',
    name: 'ReviewRocket',
    tagline: 'Reputation Automation',
    description: 'Auto-collect reviews and distribute to Google, Facebook & more. AI responds for you.',
    icon: Star,
    color: 'from-yellow-500 to-orange-600',
    bgPattern: 'bg-gradient-to-br from-yellow-500/10 to-orange-600/10',
    features: ['Auto Collection', 'Multi-Platform', 'AI Responses', 'Reputation Score'],
    path: '/workhub/reviewrocket'
  },
  {
    id: 'fairnessscore',
    name: 'FairnessScore',
    tagline: 'Trust Transparency',
    description: 'AI-calculated contractor scores based on pricing accuracy, reliability & satisfaction.',
    icon: TrendingUp,
    color: 'from-lime-500 to-green-600',
    bgPattern: 'bg-gradient-to-br from-lime-500/10 to-green-600/10',
    features: ['Pricing Accuracy', 'On-Time Rating', 'Quality Score', 'Trust Badges'],
    path: '/workhub/fairnessscore'
  },
  {
    id: 'quickfinance',
    name: 'QuickFinance',
    tagline: 'Instant Financing',
    description: 'Offer Pay-in-4, monthly payments & financing at estimate time. Close more deals.',
    icon: Wallet,
    color: 'from-purple-500 to-violet-600',
    bgPattern: 'bg-gradient-to-br from-purple-500/10 to-violet-600/10',
    features: ['Pay-in-4', 'Monthly Plans', 'Partner Lenders', 'Instant Approval'],
    path: '/workhub/quickfinance'
  },
  {
    id: 'contentforge',
    name: 'ContentForge',
    tagline: 'Marketing Engine',
    description: 'Auto-generate social posts, galleries & ads from your job photos. Marketing on autopilot.',
    icon: Image,
    color: 'from-pink-500 to-rose-600',
    bgPattern: 'bg-gradient-to-br from-pink-500/10 to-rose-600/10',
    features: ['Auto Social Posts', 'Website Galleries', 'Ad Generation', 'Brand Builder'],
    path: '/workhub/contentforge'
  },
  {
    id: 'leadpipeline',
    name: 'Lead Pipeline',
    tagline: 'Customer Opportunity Tracker',
    description: 'Manage leads from first contact to job completion. Never miss a follow-up or opportunity.',
    icon: Users,
    color: 'from-emerald-500 to-teal-600',
    bgPattern: 'bg-gradient-to-br from-emerald-500/10 to-teal-600/10',
    features: ['Lead Tracking', 'Status Pipeline', 'Follow-up Alerts', 'Conversion Analytics'],
    path: '/workhub/leadpipeline'
  },
  {
    id: 'jobsnap',
    name: 'JobSnap',
    tagline: 'Job Documentation Pro',
    description: 'Capture before, during & after photos. Timestamps, GPS, and organized by project.',
    icon: Camera,
    color: 'from-purple-500 to-indigo-600',
    bgPattern: 'bg-gradient-to-br from-purple-500/10 to-indigo-600/10',
    features: ['Before/During/After', 'GPS Tagging', 'Project Organization', 'Report Builder'],
    path: '/workhub/jobsnap'
  }
];

// Service categories
const SERVICE_CATEGORIES = [
  { name: 'Tree Services', icon: TreePine, count: 847 },
  { name: 'Roofing', icon: Home, count: 1203 },
  { name: 'Fencing', icon: Grid3X3, count: 623 },
  { name: 'HVAC', icon: Wind, count: 892 },
  { name: 'Plumbing', icon: Droplets, count: 1456 },
  { name: 'Electrical', icon: Plug, count: 1089 },
  { name: 'Painting', icon: Paintbrush, count: 934 },
  { name: 'Auto Repair', icon: Car, count: 567 },
  { name: 'Flooring', icon: Building2, count: 712 },
  { name: 'General Contractor', icon: Hammer, count: 1834 },
  { name: 'Towing', icon: Truck, count: 423 },
  { name: 'Renovations', icon: Settings, count: 978 }
];

export default function WorkHubMarketplace() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isVoiceActive, setIsVoiceActive] = useState(false);

  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      if (availableVoices.length > 0) {
        setVoices(availableVoices);
      }
    };
    
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const getBestFemaleVoice = (voiceList: SpeechSynthesisVoice[]) => {
    const preferredVoices = ['Samantha', 'Zira', 'Jenny', 'Google US English Female', 'Microsoft Zira'];
    for (const preferred of preferredVoices) {
      const found = voiceList.find(v => v.name.includes(preferred));
      if (found) return found;
    }
    return voiceList.find(v => v.lang.startsWith('en')) || voiceList[0];
  };

  const speakWelcome = () => {
    if (voices.length === 0) return;
    
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(
      "Hey there! ... Welcome to WorkHub! ... " +
      "I'm Evelyn, ... and I'm so excited to show you around. ... " +
      "So here's the deal, ... we connect customers with amazing, verified contractors, ... " +
      "for pretty much anything you need done around your home or business. ... " +
      "Roofing, ... tree removal, ... plumbing, ... you name it. ... " +
      "And the cool part? ... Just snap a photo, ... and our AI figures out what you need. ... " +
      "Go ahead and explore, ... I'm here if you need me!"
    );
    utterance.voice = getBestFemaleVoice(voices);
    utterance.pitch = 1.0;
    utterance.rate = 0.88;
    utterance.onstart = () => setIsVoiceActive(true);
    utterance.onend = () => setIsVoiceActive(false);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600">
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-0 left-0 w-96 h-96 bg-white/20 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-yellow-400/20 rounded-full blur-3xl animate-pulse delay-1000" />
          </div>
          {/* Grid Pattern */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0wIDBoNjB2NjBIMHoiLz48cGF0aCBkPSJNMzAgMzBoMXYxaC0xek0wIDBoMXYxSDB6TTYwIDBoMXYxaC0xek0wIDYwaDFWNjFIMHpNNjAgNjBoMXYxaC0xeiIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjEpIi8+PC9nPjwvc3ZnPg==')] opacity-40" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 mb-6"
            >
              <Globe className="w-4 h-4 text-white" />
              <span className="text-white text-sm font-medium">Available Nationwide • All 50 States</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-5xl md:text-7xl font-bold text-white mb-6"
            >
              The WorkHub
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-400">
                Marketplace
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl text-white/90 max-w-3xl mx-auto mb-8"
            >
              AI-powered contractor operating system. Upload once. Scope everything.
              Connect customers with verified pros for any trade, any city, any state.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-wrap justify-center gap-4 mb-12"
            >
              <Link to="/workhub/customer">
                <Button size="lg" className="bg-white text-purple-700 hover:bg-white/90 h-14 px-8 text-lg font-semibold shadow-xl" data-testid="button-customer-portal">
                  <Camera className="w-5 h-5 mr-2" />
                  I Need Work Done
                </Button>
              </Link>
              <Link to="/workhub/contractor">
                <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white/10 h-14 px-8 text-lg font-semibold" data-testid="button-contractor-portal">
                  <Hammer className="w-5 h-5 mr-2" />
                  I'm a Contractor
                </Button>
              </Link>
              <Button 
                size="lg" 
                variant="ghost" 
                className="text-white hover:bg-white/10 h-14 px-6"
                onClick={speakWelcome}
                data-testid="button-voice-intro"
              >
                {isVoiceActive ? <Volume2 className="w-5 h-5 animate-pulse" /> : <Play className="w-5 h-5" />}
                <span className="ml-2">Hear Evelyn Explain</span>
              </Button>
            </motion.div>

            {/* Quick Stats */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto"
            >
              {[
                { label: 'Verified Contractors', value: '12,847' },
                { label: 'Jobs Completed', value: '89,234' },
                { label: 'Cities Covered', value: '2,500+' },
                { label: 'Customer Rating', value: '4.9★' }
              ].map((stat, idx) => (
                <div key={idx} className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                  <p className="text-3xl font-bold text-white">{stat.value}</p>
                  <p className="text-white/70 text-sm">{stat.label}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Wave Divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="currentColor" className="text-slate-50 dark:text-slate-950"/>
          </svg>
        </div>
      </section>

      {/* Service Categories */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
            Find Contractors for Any Trade
          </h2>
          <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            From tree removal to complete renovations - we connect you with verified professionals
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {SERVICE_CATEGORIES.map((category, idx) => (
            <motion.button
              key={category.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => setSelectedCategory(category.name)}
              className={`p-4 rounded-xl border-2 transition-all hover:scale-105 ${
                selectedCategory === category.name 
                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' 
                  : 'border-slate-200 dark:border-slate-700 hover:border-purple-300'
              }`}
              data-testid={`category-${category.name.toLowerCase().replace(' ', '-')}`}
            >
              <category.icon className={`w-8 h-8 mx-auto mb-2 ${
                selectedCategory === category.name ? 'text-purple-600' : 'text-slate-600 dark:text-slate-400'
              }`} />
              <p className="font-medium text-sm text-slate-900 dark:text-white">{category.name}</p>
              <p className="text-xs text-slate-500">{category.count.toLocaleString()} pros</p>
            </motion.button>
          ))}
        </div>
      </section>

      {/* Search Bar */}
      <section className="py-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-slate-400" />
          <Input
            type="text"
            placeholder="Describe your project... e.g., 'Need 3 trees removed from backyard'"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-14 h-16 text-lg rounded-2xl border-2 border-slate-200 focus:border-purple-500"
            data-testid="input-project-search"
          />
          <Button 
            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-purple-600 hover:bg-purple-700 h-12 px-6"
            data-testid="button-search-contractors"
          >
            <Sparkles className="w-5 h-5 mr-2" />
            AI Match
          </Button>
        </div>
      </section>

      {/* WorkHub Modules Grid */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <Badge className="bg-purple-100 text-purple-700 mb-4">12 Powerful Modules</Badge>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
            The Complete Contractor Operating System
          </h2>
          <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Every tool you need to run your contracting business, powered by AI
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {WORKHUB_MODULES.map((module, idx) => (
            <motion.div
              key={module.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Link to={module.path}>
                <Card className={`h-full cursor-pointer transition-all hover:scale-[1.02] hover:shadow-xl ${module.bgPattern} border-0`} data-testid={`module-${module.id}`}>
                  <CardHeader className="pb-3">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${module.color} flex items-center justify-center mb-3`}>
                      <module.icon className="w-6 h-6 text-white" />
                    </div>
                    <CardTitle className="flex items-center justify-between">
                      <span>{module.name}</span>
                      <ChevronRight className="w-5 h-5 text-slate-400" />
                    </CardTitle>
                    <p className="text-sm font-medium text-slate-500">{module.tagline}</p>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                      {module.description}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {module.features.map((feature) => (
                        <Badge key={feature} variant="secondary" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-900 to-purple-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              How WorkHub Works
            </h2>
            <p className="text-slate-300 max-w-2xl mx-auto">
              From photo upload to payment - completely automated with AI
            </p>
          </div>

          <div className="grid md:grid-cols-5 gap-8">
            {[
              { step: 1, title: 'Upload', desc: 'Snap photos or videos of your project', icon: Camera, color: 'from-violet-500 to-purple-500' },
              { step: 2, title: 'AI Analyze', desc: 'AI identifies job scope and pricing', icon: Sparkles, color: 'from-blue-500 to-cyan-500' },
              { step: 3, title: 'Match', desc: 'Connect with verified contractors', icon: Users, color: 'from-green-500 to-emerald-500' },
              { step: 4, title: 'Book', desc: 'Schedule and track the work', icon: Calendar, color: 'from-orange-500 to-amber-500' },
              { step: 5, title: 'Pay', desc: 'Pay securely in-app', icon: CreditCard, color: 'from-pink-500 to-rose-500' }
            ].map((item, idx) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="text-center"
              >
                <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                  <item.icon className="w-10 h-10 text-white" />
                </div>
                <div className="text-purple-400 font-bold mb-2">Step {item.step}</div>
                <h3 className="text-xl font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-slate-400 text-sm">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-3 gap-8">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
            <CardContent className="pt-6">
              <Verified className="w-12 h-12 text-green-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Verified Contractors</h3>
              <p className="text-slate-600 dark:text-slate-400">
                Every contractor is verified with business license, W-9, and insurance before joining.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20">
            <CardContent className="pt-6">
              <Lock className="w-12 h-12 text-blue-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Payment Protection</h3>
              <p className="text-slate-600 dark:text-slate-400">
                Secure in-app payments with escrow protection. Pay only when satisfied.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20">
            <CardContent className="pt-6">
              <MessageSquare className="w-12 h-12 text-purple-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2">AI Support 24/7</h3>
              <p className="text-slate-600 dark:text-slate-400">
                Evelyn, your AI assistant, is always available for voice or text help.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Business Resources */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
            For Contractors
          </Badge>
          <h2 className="text-3xl font-bold mb-4">Business Resources</h2>
          <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Everything you need to grow your business on WorkHub
          </p>
        </div>
        <div className="grid md:grid-cols-4 gap-6">
          <Link to="/workhub/pricing">
            <Card className="group hover:shadow-xl transition-all cursor-pointer border-0 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 h-full" data-testid="card-pricing-plans">
              <CardContent className="pt-6">
                <DollarSign className="w-10 h-10 text-purple-600 mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-lg font-semibold mb-2">Pricing Plans</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Choose the right plan for your business size and goals
                </p>
              </CardContent>
            </Card>
          </Link>
          <Link to="/workhub/scripts">
            <Card className="group hover:shadow-xl transition-all cursor-pointer border-0 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 h-full" data-testid="card-ai-scripts">
              <CardContent className="pt-6">
                <Bot className="w-10 h-10 text-emerald-600 mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-lg font-semibold mb-2">AI Agent Scripts</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Customize CloseBot scripts and voice guidelines
                </p>
              </CardContent>
            </Card>
          </Link>
          <Link to="/workhub/pitch">
            <Card className="group hover:shadow-xl transition-all cursor-pointer border-0 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 h-full" data-testid="card-pitch-deck">
              <CardContent className="pt-6">
                <TrendingUp className="w-10 h-10 text-amber-600 mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-lg font-semibold mb-2">Pitch Deck</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Investor presentation and business overview
                </p>
              </CardContent>
            </Card>
          </Link>
          <Link to="/workhub/legal">
            <Card className="group hover:shadow-xl transition-all cursor-pointer border-0 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 h-full" data-testid="card-legal-terms">
              <CardContent className="pt-6">
                <Shield className="w-10 h-10 text-blue-600 mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-lg font-semibold mb-2">Legal & Terms</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Terms of service, privacy policy, and contractor agreement
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-purple-600 to-indigo-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Transform Your Business?
          </h2>
          <p className="text-xl text-purple-100 mb-8">
            Join thousands of contractors using WorkHub to grow their business
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/workhub/contractor/register">
              <Button size="lg" className="bg-white text-purple-700 hover:bg-white/90 h-14 px-8 text-lg" data-testid="button-join-contractor">
                Join as Contractor
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link to="/workhub/customer">
              <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white/10 h-14 px-8 text-lg" data-testid="button-start-project">
                Start a Project
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <ModuleAIAssistant 
        moduleName="WorkHub Marketplace"
        moduleContext="WorkHub is an AI-powered contractor marketplace that connects customers with verified contractors for everyday services like tree removal, roofing, plumbing, electrical, painting, and more. It features ScopeSnap for AI photo analysis, PriceWhisperer for smart estimates, ContractorMatch for finding pros, and many other powerful modules."
      />
    </div>
  );
}
