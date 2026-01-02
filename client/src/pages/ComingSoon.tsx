import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  Zap, 
  Cloud, 
  Users,
  Mail,
  CheckCircle,
  AlertTriangle,
  DollarSign,
  Radio,
  MapPin,
  Clock,
  TrendingUp,
  Building2,
  FileCheck,
  Phone,
  ChevronRight,
  Activity,
  Eye,
  Target,
  Radar,
  Wind,
  CloudLightning,
  Sparkles,
  Home,
  Briefcase,
  Crown,
  Star
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Lightning bolt animation component
function LightningBolt({ delay = 0 }: { delay?: number }) {
  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{
        left: `${Math.random() * 80 + 10}%`,
        top: 0,
      }}
      initial={{ opacity: 0, scaleY: 0 }}
      animate={{ 
        opacity: [0, 1, 1, 0],
        scaleY: [0, 1, 1, 0],
      }}
      transition={{
        duration: 0.3,
        delay: delay,
        repeat: Infinity,
        repeatDelay: Math.random() * 8 + 4,
      }}
    >
      <svg width="40" height="200" viewBox="0 0 40 200" className="fill-blue-300/60">
        <path d="M20 0 L25 60 L35 65 L18 120 L25 125 L10 200 L15 130 L5 125 L22 70 L12 65 Z" />
      </svg>
    </motion.div>
  );
}

// Animated storm particles
function StormParticle({ index }: { index: number }) {
  const startX = Math.random() * 100;
  const duration = Math.random() * 3 + 2;
  
  return (
    <motion.div
      className="absolute w-1 h-1 bg-blue-400/30 rounded-full"
      style={{ left: `${startX}%` }}
      initial={{ y: -10, opacity: 0 }}
      animate={{ 
        y: '100vh',
        opacity: [0, 0.6, 0.6, 0],
        x: [0, Math.random() * 50 - 25],
      }}
      transition={{
        duration,
        delay: index * 0.1,
        repeat: Infinity,
        ease: 'linear',
      }}
    />
  );
}

// Live stats counter
function AnimatedCounter({ target, duration = 2, suffix = '' }: { target: number; duration?: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    let start = 0;
    const end = target;
    const incrementTime = (duration * 1000) / end;
    
    const timer = setInterval(() => {
      start += Math.ceil(end / 50);
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, incrementTime);
    
    return () => clearInterval(timer);
  }, [target, duration]);
  
  return <span>{count.toLocaleString()}{suffix}</span>;
}

export default function ComingSoon() {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [activeStormCount] = useState(Math.floor(Math.random() * 5) + 3);
  const { toast } = useToast();

  const handleNotifyMe = async () => {
    if (!email || !email.includes('@')) {
      toast({
        title: 'Invalid email',
        description: 'Please enter a valid email address',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitted(true);
    toast({
      title: 'Welcome to the Storm Response Revolution!',
      description: 'You\'re on the priority list. We\'ll contact you before launch.',
    });
  };

  return (
    <div className="min-h-screen bg-black overflow-hidden relative">
      {/* Cinematic storm background layers */}
      <div className="absolute inset-0">
        {/* Deep storm gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-blue-950/80 to-purple-950/60" />
        
        {/* Animated storm clouds */}
        <motion.div 
          className="absolute inset-0 opacity-30"
          animate={{ 
            backgroundPosition: ['0% 0%', '100% 100%'],
          }}
          transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
          style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")',
            backgroundSize: '400px 400px',
          }}
        />
        
        {/* Radial gradient spotlight */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] bg-gradient-radial from-blue-500/20 via-transparent to-transparent blur-3xl" />
        
        {/* Lightning bolts */}
        <LightningBolt delay={0} />
        <LightningBolt delay={2} />
        <LightningBolt delay={5} />
        
        {/* Storm rain particles */}
        <div className="absolute inset-0 overflow-hidden opacity-40">
          {[...Array(30)].map((_, i) => (
            <StormParticle key={i} index={i} />
          ))}
        </div>
        
        {/* Bottom fog */}
        <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-black via-black/80 to-transparent" />
      </div>

      {/* Live Status Bar */}
      <motion.div 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative z-20 bg-gradient-to-r from-red-600/90 via-orange-500/90 to-red-600/90 border-b border-red-400/30"
      >
        <div className="container mx-auto px-4 py-2 flex items-center justify-center gap-6 text-white text-sm overflow-hidden">
          <motion.div 
            animate={{ x: [0, -1000] }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            className="flex items-center gap-8 whitespace-nowrap"
          >
            <span className="flex items-center gap-2">
              <Radio className="w-4 h-4 animate-pulse" />
              <span className="font-bold">{activeStormCount} ACTIVE STORMS</span> tracked nationwide
            </span>
            <span className="text-red-200">•</span>
            <span className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              <span className="font-bold">REAL-TIME</span> weather intelligence
            </span>
            <span className="text-red-200">•</span>
            <span className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              <span className="font-bold">AI DAMAGE DETECTION</span> operational
            </span>
            <span className="text-red-200">•</span>
            <span className="flex items-center gap-2">
              <Radio className="w-4 h-4 animate-pulse" />
              <span className="font-bold">{activeStormCount} ACTIVE STORMS</span> tracked nationwide
            </span>
            <span className="text-red-200">•</span>
            <span className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              <span className="font-bold">CLAIMS AUTOMATION</span> ready
            </span>
          </motion.div>
        </div>
      </motion.div>

      {/* Main Hero Content */}
      <div className="relative z-10 container mx-auto px-4 pt-16 pb-8">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="text-center max-w-5xl mx-auto"
        >
          {/* Brand Badge */}
          <motion.div
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 mb-6"
          >
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">AI-Powered Storm Response Platform</span>
          </motion.div>

          {/* Main Headline */}
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-5xl md:text-7xl lg:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-100 to-cyan-200 mb-4 leading-tight tracking-tight"
          >
            STRATEGIC
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500">
              SERVICE SAVERS
            </span>
          </motion.h1>

          {/* Tagline */}
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-xl md:text-2xl text-blue-200/90 mb-4 font-light"
          >
            Command the Storm. Dominate the Response.
          </motion.p>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="text-lg text-slate-400 max-w-2xl mx-auto mb-6"
          >
            The first AI-powered platform that automates damage detection, 
            streamlines claims management, and maximizes insurance claim success.
          </motion.p>

          {/* Customer Value Proposition */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65 }}
            className="max-w-3xl mx-auto mb-8 p-6 rounded-2xl bg-gradient-to-r from-green-500/10 via-emerald-500/10 to-teal-500/10 border border-green-500/20"
          >
            <h3 className="text-2xl md:text-3xl font-bold text-white mb-3">
              No more guessing. No more wasted estimates.
            </h3>
            <p className="text-lg text-green-200/90">
              Describe your project, get an instant AI estimate, and only get matched with contractors that fit your budget.
            </p>
            <div className="mt-4 flex items-center justify-center gap-2">
              <Home className="w-5 h-5 text-green-400" />
              <span className="text-green-400 font-semibold">Always FREE for homeowners</span>
            </div>
          </motion.div>

          {/* Launch Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7 }}
            className="inline-flex items-center gap-3 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 rounded-2xl px-6 py-3 mb-10"
          >
            <Clock className="w-5 h-5 text-amber-400" />
            <span className="text-amber-200 font-semibold">Launching Q1 2025</span>
            <Badge className="bg-amber-500 text-black font-bold">EARLY ACCESS</Badge>
          </motion.div>
        </motion.div>

        {/* Dual CTA Section */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="flex flex-col md:flex-row gap-4 justify-center items-center mb-16"
        >
          <a 
            href="/pricing"
            className="group relative overflow-hidden px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-lg rounded-xl shadow-2xl shadow-purple-500/30 transition-all hover:scale-105 flex items-center gap-3"
            data-testid="link-contractor-pricing"
          >
            <Building2 className="w-5 h-5" />
            Contractor Pricing
            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
          </a>
          
          <a 
            href="/auth/login" 
            className="px-8 py-4 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-lg rounded-xl transition-all flex items-center gap-3"
            data-testid="link-admin-login"
          >
            <Shield className="w-5 h-5" />
            Staff / Contractor Login
          </a>
        </motion.div>

        {/* Stats Grid */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-16"
        >
          {[
            { icon: CloudLightning, value: 24, suffix: '/7', label: 'Storm Monitoring', color: 'from-blue-500 to-cyan-500' },
            { icon: Eye, value: 500, suffix: 'K+', label: 'Properties Analyzed', color: 'from-purple-500 to-pink-500' },
            { icon: FileCheck, value: 98, suffix: '%', label: 'Claim Success Rate', color: 'from-green-500 to-emerald-500' },
            { icon: TrendingUp, value: 3, suffix: 'X', label: 'Faster Response', color: 'from-orange-500 to-amber-500' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1 + i * 0.1 }}
            >
              <Card className="bg-white/5 border-white/10 backdrop-blur-xl hover:bg-white/10 transition-all group">
                <CardContent className="p-6 text-center">
                  <div className={`w-12 h-12 mx-auto rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-3xl font-black text-white mb-1">
                    <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                  </div>
                  <div className="text-sm text-slate-400">{stat.label}</div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Feature Cards */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.4 }}
          className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-16"
        >
          {[
            {
              icon: CloudLightning,
              title: 'Real-Time Storm Intel',
              description: 'Multi-hazard monitoring from NHC, NWS, USGS, NASA FIRMS. Know where to deploy before the storm hits.',
              gradient: 'from-blue-600 to-cyan-600',
            },
            {
              icon: Zap,
              title: 'AI Damage Detection',
              description: 'Upload photos, get instant Xactimate-ready scope. Our AI catches damage others miss.',
              gradient: 'from-purple-600 to-pink-600',
            },
            {
              icon: FileCheck,
              title: 'Claims Management',
              description: 'Streamline documentation, maximize claim success rates, and get paid faster with automated workflows.',
              gradient: 'from-orange-600 to-red-600',
            },
          ].map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.5 + i * 0.1 }}
              whileHover={{ y: -5, scale: 1.02 }}
            >
              <Card className="h-full bg-gradient-to-br from-white/10 to-white/5 border-white/10 backdrop-blur-xl overflow-hidden group">
                <CardContent className="p-6">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg`}>
                    <feature.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                  <p className="text-slate-400 leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Pricing Section */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.6 }}
          className="max-w-6xl mx-auto mb-16"
        >
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">Simple, Transparent Pricing</h2>
            <p className="text-slate-400 text-lg">Choose the plan that fits your needs</p>
          </div>

          <div className="grid md:grid-cols-4 gap-4">
            {/* Homeowners - FREE */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.7 }}
              whileHover={{ y: -5 }}
            >
              <Card className="h-full bg-gradient-to-br from-green-500/20 to-emerald-500/10 border-green-500/30 backdrop-blur-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-green-500 text-black text-xs font-bold px-3 py-1 rounded-bl-lg">
                  FREE
                </div>
                <CardContent className="p-6 pt-8">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mb-4">
                    <Home className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-1">Homeowners</h3>
                  <div className="text-3xl font-black text-green-400 mb-2">$0</div>
                  <p className="text-slate-400 text-sm mb-4">Always free for property owners</p>
                  <ul className="space-y-2 text-sm text-slate-300">
                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400" /> Storm alerts for your area</li>
                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400" /> Connect with contractors</li>
                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400" /> StormShare community</li>
                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400" /> Photo documentation</li>
                  </ul>
                </CardContent>
              </Card>
            </motion.div>

            {/* WorkBuddy - Everyday Contractors */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.8 }}
              whileHover={{ y: -5 }}
            >
              <Card className="h-full bg-gradient-to-br from-blue-500/20 to-cyan-500/10 border-blue-500/30 backdrop-blur-xl">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-4">
                    <Briefcase className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-1">WorkBuddy</h3>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-3xl font-black text-blue-400">$59</span>
                    <span className="text-slate-400">- $229/mo</span>
                  </div>
                  <p className="text-slate-400 text-sm mb-4">Everyday contractor tools</p>
                  <ul className="space-y-2 text-sm text-slate-300">
                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-blue-400" /> CRM & job tracking</li>
                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-blue-400" /> Smart scheduling</li>
                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-blue-400" /> Invoicing & payments</li>
                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-blue-400" /> AI estimates</li>
                  </ul>
                </CardContent>
              </Card>
            </motion.div>

            {/* Disaster Direct - Storm Contractors */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.9 }}
              whileHover={{ y: -5 }}
            >
              <Card className="h-full bg-gradient-to-br from-purple-500/20 to-indigo-500/10 border-purple-500/30 backdrop-blur-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-purple-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                  POPULAR
                </div>
                <CardContent className="p-6 pt-8">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center mb-4">
                    <CloudLightning className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-1">Disaster Direct</h3>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-3xl font-black text-purple-400">$97</span>
                    <span className="text-slate-400">- $397/mo</span>
                  </div>
                  <p className="text-slate-400 text-sm mb-4">Storm response specialists</p>
                  <ul className="space-y-2 text-sm text-slate-300">
                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-purple-400" /> Real-time storm intel</li>
                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-purple-400" /> AI damage detection</li>
                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-purple-400" /> Claims management</li>
                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-purple-400" /> Xactimate-ready scope</li>
                  </ul>
                </CardContent>
              </Card>
            </motion.div>

            {/* Ultimate - Everything */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2.0 }}
              whileHover={{ y: -5 }}
            >
              <Card className="h-full bg-gradient-to-br from-amber-500/20 to-orange-500/10 border-amber-500/30 backdrop-blur-xl">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center mb-4">
                    <Crown className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-1">Ultimate</h3>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-3xl font-black text-amber-400">$447</span>
                    <span className="text-slate-400">/mo</span>
                  </div>
                  <p className="text-slate-400 text-sm mb-4">Everything included</p>
                  <ul className="space-y-2 text-sm text-slate-300">
                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-amber-400" /> All WorkBuddy features</li>
                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-amber-400" /> All Disaster Direct</li>
                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-amber-400" /> 10 team members</li>
                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-amber-400" /> Dedicated support</li>
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.1 }}
            className="text-center mt-8"
          >
            <a 
              href="/pricing"
              className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 font-semibold transition-colors"
              data-testid="link-view-full-pricing"
            >
              View Full Pricing Details
              <ChevronRight className="w-4 h-4" />
            </a>
          </motion.div>
        </motion.div>

        {/* Email Signup */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.2 }}
          className="max-w-xl mx-auto text-center mb-16"
        >
          <h3 className="text-2xl font-bold text-white mb-2">Get Early Access</h3>
          <p className="text-slate-400 mb-6">Join the waitlist for exclusive launch pricing and priority onboarding.</p>
          
          {!isSubmitted ? (
            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-slate-500 h-14 text-lg"
                data-testid="input-email-notify"
              />
              <Button 
                onClick={handleNotifyMe}
                className="h-14 px-8 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold text-lg shadow-xl shadow-blue-500/30"
                data-testid="button-notify-me"
              >
                <Mail className="w-5 h-5 mr-2" />
                Notify Me
              </Button>
            </div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center justify-center gap-3 py-4 px-6 bg-green-500/20 border border-green-500/30 rounded-xl"
            >
              <CheckCircle className="w-6 h-6 text-green-400" />
              <span className="text-green-300 font-semibold text-lg">You're on the priority list!</span>
            </motion.div>
          )}
        </motion.div>

        {/* Trust Bar */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
          className="text-center border-t border-white/10 pt-8"
        >
          <p className="text-slate-500 text-sm mb-4">Trusted technology partners</p>
          <div className="flex flex-wrap justify-center items-center gap-8 text-slate-600">
            {['QuickBooks', 'Twilio', 'OpenAI', 'Anthropic', 'ElevenLabs'].map((partner) => (
              <span key={partner} className="text-lg font-semibold opacity-50 hover:opacity-80 transition-opacity">
                {partner}
              </span>
            ))}
          </div>
          
          <div className="mt-8 flex flex-col items-center gap-2">
            <p className="text-slate-500 text-sm">
              Questions? <a href="mailto:strategicservicesavers@gmail.com" className="text-blue-400 hover:text-blue-300">strategicservicesavers@gmail.com</a>
            </p>
            <p className="text-slate-600 text-xs">
              www.strategicservicesavers.org • Strategic Services Savers LLC
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
