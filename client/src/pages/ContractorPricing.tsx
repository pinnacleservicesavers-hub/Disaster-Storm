import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Check, X, Zap, Crown, Building2, Rocket, Star, Shield, Clock, Award, ArrowLeft, Volume2, VolumeX, Briefcase, TrendingUp, Layers } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

// WorkBuddy Tiers - Everyday Contractors
const workhubTiers = [
  {
    id: 'workhub_essentials',
    name: 'WorkBuddy Essentials',
    tagline: 'Get organized and start growing',
    monthlyPrice: 59,
    annualPrice: 590,
    savings: 118,
    icon: Briefcase,
    color: 'from-blue-500 to-cyan-600',
    priceId: 'workhub_essentials',
    features: [
      { name: 'CRM & customer management', included: true },
      { name: 'Job tracking & scheduling', included: true },
      { name: 'Basic invoicing & quotes', included: true },
      { name: 'Mobile app access', included: true },
      { name: 'Email support', included: true },
      { name: 'Photo documentation', included: true },
      { name: 'AI-powered estimates', included: false },
      { name: 'Automated follow-ups', included: false },
      { name: 'Review management', included: false },
    ],
    limits: {
      monthlyJobs: 25,
      teamMembers: 1,
      storageGB: 5
    }
  },
  {
    id: 'workhub_growth',
    name: 'WorkBuddy Growth',
    tagline: 'Scale your business efficiently',
    monthlyPrice: 129,
    annualPrice: 1290,
    savings: 258,
    icon: TrendingUp,
    color: 'from-indigo-500 to-purple-600',
    popular: true,
    priceId: 'workhub_growth',
    features: [
      { name: 'Everything in Essentials', included: true },
      { name: 'AI-powered estimates & scope', included: true },
      { name: 'Automated follow-ups & reminders', included: true },
      { name: 'Review collection & management', included: true },
      { name: 'QuickBooks integration', included: true },
      { name: 'Priority phone support', included: true },
      { name: 'Custom branding', included: true },
      { name: 'Multi-location support', included: false },
      { name: 'API access', included: false },
    ],
    limits: {
      monthlyJobs: 100,
      teamMembers: 5,
      storageGB: 25
    }
  },
  {
    id: 'workhub_scale',
    name: 'WorkBuddy Scale',
    tagline: 'Enterprise tools for growing teams',
    monthlyPrice: 229,
    annualPrice: 2290,
    savings: 458,
    icon: Layers,
    color: 'from-violet-500 to-fuchsia-600',
    priceId: 'workhub_scale',
    features: [
      { name: 'Everything in Growth', included: true },
      { name: 'Unlimited team members', included: true },
      { name: 'Multi-location management', included: true },
      { name: 'API access & integrations', included: true },
      { name: 'White-label proposals', included: true },
      { name: 'Dedicated account manager', included: true },
      { name: 'Custom training', included: true },
      { name: 'Advanced analytics', included: true },
      { name: 'Revenue optimization AI', included: true },
    ],
    limits: {
      monthlyJobs: -1,
      teamMembers: -1,
      storageGB: 100
    }
  }
];

// Ultimate Bundle - Both Programs Together
const ultimateTier = {
  id: 'ultimate',
  name: 'Ultimate Contractor Command',
  tagline: 'Everything you need - everyday work AND storm response',
  monthlyPrice: 499,
  annualPrice: 4990,
  savings: 998,
  icon: Crown,
  color: 'from-amber-500 to-orange-600',
  priceId: 'ultimate',
  features: [
    { name: 'All WorkBuddy Scale features', included: true },
    { name: 'All Disaster Direct Elite features', included: true },
    { name: 'Unlimited everything', included: true },
    { name: '10 team members included', included: true },
    { name: 'Priority storm deployment', included: true },
    { name: 'White-label everything', included: true },
    { name: 'Custom AI training', included: true },
    { name: 'Dedicated success manager', included: true },
    { name: 'Revenue share program', included: true },
    { name: 'VIP 24/7 support', included: true },
  ],
  limits: {
    monthlyPhotos: -1,
    monthlyJobs: -1,
    activeJobs: -1,
    teamMembers: 10,
    storageGB: 500
  },
  comparison: {
    separatePrice: 626, // $397 (Elite) + $229 (Scale)
    savings: 179 // per month savings vs buying separately
  }
};

// Disaster Direct Tiers - Storm Contractors
const contractorTiers = [
  {
    id: 'storm_starter',
    name: 'Storm Starter',
    tagline: 'Perfect for new contractors entering storm work',
    monthlyPrice: 97,
    annualPrice: 970,
    savings: 194,
    icon: Zap,
    color: 'from-emerald-500 to-teal-600',
    priceId: 'storm_starter',
    features: [
      { name: 'Real-time storm tracking & alerts', included: true },
      { name: 'AI damage detection (50 photos/month)', included: true },
      { name: 'Basic claims documentation', included: true },
      { name: 'StormShare community access', included: true },
      { name: 'Email & chat support', included: true },
      { name: 'Mobile app access', included: true },
      { name: 'ECRP storm agency registration', included: false },
      { name: 'AI-powered estimates', included: false },
      { name: 'Contract & AOB management', included: false },
      { name: 'Lead pipeline automation', included: false },
    ],
    limits: {
      monthlyPhotos: 50,
      activeJobs: 10,
      teamMembers: 1,
      storageGB: 5
    }
  },
  {
    id: 'storm_pro',
    name: 'Storm Pro',
    tagline: 'The go-to choice for serious storm chasers',
    monthlyPrice: 197,
    annualPrice: 1970,
    savings: 394,
    icon: Crown,
    color: 'from-purple-500 to-indigo-600',
    popular: true,
    priceId: 'storm_pro',
    features: [
      { name: 'Everything in Storm Starter', included: true },
      { name: 'Unlimited AI damage detection', included: true },
      { name: 'ECRP storm agency registration (40+ agencies)', included: true },
      { name: 'AI-powered Xactimate-ready estimates', included: true },
      { name: 'Contract & AOB document management', included: true },
      { name: 'Lead pipeline with automation', included: true },
      { name: 'SMS & email outreach campaigns', included: true },
      { name: 'Priority phone support', included: true },
      { name: 'White-label proposals', included: false },
      { name: 'API access & integrations', included: false },
    ],
    limits: {
      monthlyPhotos: -1,
      activeJobs: 100,
      teamMembers: 5,
      storageGB: 50
    }
  },
  {
    id: 'storm_elite',
    name: 'Storm Elite',
    tagline: 'For established contractors who dominate the market',
    monthlyPrice: 397,
    annualPrice: 3970,
    savings: 794,
    icon: Building2,
    color: 'from-amber-500 to-orange-600',
    priceId: 'storm_elite',
    features: [
      { name: 'Everything in Storm Pro', included: true },
      { name: 'Unlimited team members', included: true },
      { name: 'White-label proposals & reports', included: true },
      { name: 'Multi-location management', included: true },
      { name: 'API access & custom integrations', included: true },
      { name: 'Custom AI training on your data', included: true },
      { name: 'Dedicated account manager', included: true },
      { name: '24/7 priority support', included: true },
      { name: 'Custom onboarding & training', included: true },
      { name: 'Revenue share program access', included: true },
    ],
    limits: {
      monthlyPhotos: -1,
      activeJobs: -1,
      teamMembers: -1,
      storageGB: 500
    }
  }
];

function getBestFemaleVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  const preferredVoices = ['Samantha', 'Zira', 'Jenny', 'Google US English Female', 'Microsoft Zira', 'Karen', 'Moira', 'Tessa', 'Fiona'];
  for (const name of preferredVoices) {
    const voice = voices.find(v => v.name.includes(name));
    if (voice) return voice;
  }
  const femaleVoice = voices.find(v => 
    v.name.toLowerCase().includes('female') || 
    v.lang.startsWith('en') && !v.name.toLowerCase().includes('male')
  );
  return femaleVoice || voices.find(v => v.lang.startsWith('en')) || voices[0];
}

export default function ContractorPricing() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isAnnual, setIsAnnual] = useState(true);
  const [loading, setLoading] = useState<string | null>(null);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [hasSpoken, setHasSpoken] = useState(false);

  useEffect(() => {
    if (!voiceEnabled || hasSpoken) return;
    
    const speak = () => {
      const voices = speechSynthesis.getVoices();
      if (voices.length === 0) return;
      
      speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(
        "Welcome to Strategic Services Savers Contractor Pricing! ... " +
        "I'm Rachel, your AI assistant. ... " +
        "We have two powerful tracks for contractors. ... " +
        "WorkBuddy is for everyday jobs, like roofing, painting, HVAC, and general contracting. ... " +
        "Disaster Direct is for storm response specialists who need real-time weather intel and damage detection. ... " +
        "Or save big with our Ultimate bundle that includes everything! ... " +
        "Choose annual billing and save up to two months free. ... " +
        "Use the tabs below to compare plans."
      );
      
      const voice = getBestFemaleVoice(voices);
      if (voice) utterance.voice = voice;
      utterance.pitch = 1.1;
      utterance.rate = 1.05;
      
      speechSynthesis.speak(utterance);
      setHasSpoken(true);
    };

    if (speechSynthesis.getVoices().length > 0) {
      speak();
    } else {
      speechSynthesis.onvoiceschanged = speak;
    }

    return () => speechSynthesis.cancel();
  }, [voiceEnabled, hasSpoken]);

  const toggleVoice = () => {
    if (voiceEnabled) {
      speechSynthesis.cancel();
    }
    setVoiceEnabled(!voiceEnabled);
  };

  const handleSubscribe = async (tier: typeof contractorTiers[0]) => {
    setLoading(tier.id);
    try {
      // Only send tierId and isAnnual - pricing is validated server-side
      const response = await apiRequest('/api/subscriptions/checkout', {
        method: 'POST',
        body: JSON.stringify({
          tierId: tier.id,
          isAnnual,
        }),
      });

      // QuickBooks ACH - show success and redirect to dashboard
      toast({
        title: 'Subscription Request Received!',
        description: `${tier.name} selected - QuickBooks ACH bank transfer setup coming soon. 1% fee capped at $10!`,
      });
      setLocation('/dashboard');
    } catch (error) {
      console.error('Subscription error:', error);
      toast({
        title: 'Subscription Error',
        description: 'There was an issue processing your subscription. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
      
      <div className="relative z-10 container mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="ghost"
            onClick={() => setLocation('/')}
            className="text-white hover:bg-white/10"
            data-testid="button-back"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleVoice}
            className="text-white hover:bg-white/10"
            data-testid="button-toggle-voice"
          >
            {voiceEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </Button>
        </div>

        <div className="text-center mb-12">
          <Badge className="mb-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0">
            <Star className="w-3 h-3 mr-1" />
            LIMITED TIME: 2 Months FREE with Annual Plans
          </Badge>
          
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Contractor Subscription Plans
          </h1>
          <p className="text-xl text-purple-200 max-w-3xl mx-auto">
            Choose your track: WorkBuddy for everyday contractor work, Disaster Direct for storm response, 
            or get the Ultimate bundle with everything included.
          </p>
        </div>

        <div className="flex justify-center items-center gap-4 mb-12">
          <Label htmlFor="billing-toggle" className={`text-lg ${!isAnnual ? 'text-white font-semibold' : 'text-purple-300'}`}>
            Monthly
          </Label>
          <Switch
            id="billing-toggle"
            checked={isAnnual}
            onCheckedChange={setIsAnnual}
            className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-green-500 data-[state=checked]:to-emerald-500"
            data-testid="switch-billing-toggle"
          />
          <Label htmlFor="billing-toggle" className={`text-lg ${isAnnual ? 'text-white font-semibold' : 'text-purple-300'}`}>
            Annual
            <Badge className="ml-2 bg-green-500/20 text-green-400 border-green-500/30">
              Save up to $894/yr
            </Badge>
          </Label>
        </div>

        {/* Ultimate Bundle - Featured at Top */}
        <div className="max-w-4xl mx-auto mb-16">
          <div className="text-center mb-6">
            <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 text-lg px-4 py-1">
              <Crown className="w-4 h-4 mr-2 inline" />
              BEST VALUE - SAVE $179/mo
            </Badge>
          </div>
          <Card className="relative overflow-hidden border-2 border-amber-500 shadow-2xl shadow-amber-500/20 bg-gradient-to-br from-amber-500/10 to-orange-500/10 backdrop-blur-lg">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 mx-auto rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mb-4">
                <Crown className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-3xl text-white">{ultimateTier.name}</CardTitle>
              <CardDescription className="text-amber-200 text-lg">{ultimateTier.tagline}</CardDescription>
              
              <div className="mt-4">
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-5xl font-bold text-white">
                    ${isAnnual ? ultimateTier.annualPrice : ultimateTier.monthlyPrice}
                  </span>
                  <span className="text-amber-200 text-xl">
                    /{isAnnual ? 'year' : 'month'}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-center gap-3">
                  <span className="text-gray-400 line-through text-lg">${isAnnual ? 7512 : 626}/{ isAnnual ? 'year' : 'month'}</span>
                  <Badge className="bg-green-500 text-white">
                    Save ${isAnnual ? ultimateTier.savings : 179}/{isAnnual ? 'year' : 'month'}
                  </Badge>
                </div>
                {isAnnual && (
                  <p className="text-amber-200 text-sm mt-2">(${Math.round(ultimateTier.annualPrice / 12)}/mo billed annually)</p>
                )}
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                {ultimateTier.features.map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <span className="text-white">{feature.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
            
            <CardFooter className="justify-center pb-8">
              <Button
                onClick={() => handleSubscribe(ultimateTier as any)}
                disabled={loading === ultimateTier.id}
                className="h-14 px-12 text-xl font-bold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                data-testid="button-subscribe-ultimate"
              >
                {loading === ultimateTier.id ? (
                  <span className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing...
                  </span>
                ) : (
                  <>Get Ultimate - Everything Included</>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Tabs for WorkBuddy and Disaster Direct */}
        <Tabs defaultValue="disaster" className="max-w-6xl mx-auto">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8 bg-white/10">
            <TabsTrigger value="workhub" className="data-[state=active]:bg-blue-500 text-white" data-testid="tab-workhub">
              <Briefcase className="w-4 h-4 mr-2" />
              WorkBuddy
            </TabsTrigger>
            <TabsTrigger value="disaster" className="data-[state=active]:bg-purple-500 text-white" data-testid="tab-disaster">
              <Zap className="w-4 h-4 mr-2" />
              Disaster Direct
            </TabsTrigger>
          </TabsList>
          
          {/* WorkBuddy Tiers */}
          <TabsContent value="workhub">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">WorkBuddy - Everyday Contractor Tools</h2>
              <p className="text-blue-200">CRM, scheduling, invoicing, and AI estimates for daily operations</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {workhubTiers.map((tier) => (
                <Card 
                  key={tier.id}
                  className={`relative overflow-hidden border-2 transition-all duration-300 hover:scale-105 ${
                    tier.popular 
                      ? 'border-blue-500 shadow-2xl shadow-blue-500/20' 
                      : 'border-white/10 hover:border-white/30'
                  } bg-white/5 backdrop-blur-lg`}
                  data-testid={`card-tier-${tier.id}`}
                >
                  {tier.popular && (
                    <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-center py-2 text-sm font-semibold">
                      <Star className="w-4 h-4 inline mr-1" />
                      MOST POPULAR
                    </div>
                  )}
                  
                  <CardHeader className={tier.popular ? 'pt-12' : ''}>
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${tier.color} flex items-center justify-center mb-4`}>
                      <tier.icon className="w-7 h-7 text-white" />
                    </div>
                    
                    <CardTitle className="text-2xl text-white">{tier.name}</CardTitle>
                    <CardDescription className="text-blue-200">{tier.tagline}</CardDescription>
                    
                    <div className="mt-4">
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-bold text-white">
                          ${isAnnual ? tier.annualPrice : tier.monthlyPrice}
                        </span>
                        <span className="text-blue-300">
                          /{isAnnual ? 'year' : 'month'}
                        </span>
                      </div>
                      
                      {isAnnual && (
                        <div className="mt-2 flex items-center gap-2">
                          <Badge variant="outline" className="border-green-500/50 text-green-400 text-xs">
                            Save ${tier.savings}
                          </Badge>
                          <span className="text-blue-300 text-sm">
                            (${Math.round(tier.annualPrice / 12)}/mo)
                          </span>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <ul className="space-y-3">
                      {tier.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          {feature.included ? (
                            <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                          ) : (
                            <X className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" />
                          )}
                          <span className={feature.included ? 'text-white' : 'text-gray-500'}>
                            {feature.name}
                          </span>
                        </li>
                      ))}
                    </ul>
                    
                    <div className="mt-6 pt-6 border-t border-white/10">
                      <h4 className="text-sm font-semibold text-blue-300 mb-3 flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        Plan Limits
                      </h4>
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div className="flex flex-col items-center text-white">
                          <span className="font-bold">{tier.limits.monthlyJobs === -1 ? '∞' : tier.limits.monthlyJobs}</span>
                          <span className="text-xs text-blue-300">jobs/mo</span>
                        </div>
                        <div className="flex flex-col items-center text-white">
                          <span className="font-bold">{tier.limits.teamMembers === -1 ? '∞' : tier.limits.teamMembers}</span>
                          <span className="text-xs text-blue-300">team</span>
                        </div>
                        <div className="flex flex-col items-center text-white">
                          <span className="font-bold">{tier.limits.storageGB}</span>
                          <span className="text-xs text-blue-300">GB</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  
                  <CardFooter>
                    <Button
                      onClick={() => handleSubscribe(tier as any)}
                      disabled={loading === tier.id}
                      className={`w-full h-12 text-lg font-semibold ${
                        tier.popular
                          ? 'bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600'
                          : `bg-gradient-to-r ${tier.color} hover:opacity-90`
                      }`}
                      data-testid={`button-subscribe-${tier.id}`}
                    >
                      {loading === tier.id ? (
                        <span className="flex items-center gap-2">
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Processing...
                        </span>
                      ) : (
                        `Get ${tier.name}`
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          {/* Disaster Direct Tiers */}
          <TabsContent value="disaster">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">Disaster Direct - Storm Response Platform</h2>
              <p className="text-purple-200">Real-time weather intel, AI damage detection, claims management, and ECRP access</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {contractorTiers.map((tier) => (
            <Card 
              key={tier.id}
              className={`relative overflow-hidden border-2 transition-all duration-300 hover:scale-105 ${
                tier.popular 
                  ? 'border-purple-500 shadow-2xl shadow-purple-500/20' 
                  : 'border-white/10 hover:border-white/30'
              } bg-white/5 backdrop-blur-lg`}
              data-testid={`card-tier-${tier.id}`}
            >
              {tier.popular && (
                <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-center py-2 text-sm font-semibold">
                  <Crown className="w-4 h-4 inline mr-1" />
                  MOST POPULAR
                </div>
              )}
              
              <CardHeader className={tier.popular ? 'pt-12' : ''}>
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${tier.color} flex items-center justify-center mb-4`}>
                  <tier.icon className="w-7 h-7 text-white" />
                </div>
                
                <CardTitle className="text-2xl text-white">{tier.name}</CardTitle>
                <CardDescription className="text-purple-200">{tier.tagline}</CardDescription>
                
                <div className="mt-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-white">
                      ${isAnnual ? tier.annualPrice : tier.monthlyPrice}
                    </span>
                    <span className="text-purple-300">
                      /{isAnnual ? 'year' : 'month'}
                    </span>
                  </div>
                  
                  {isAnnual && (
                    <div className="mt-2 flex items-center gap-2">
                      <Badge variant="outline" className="border-green-500/50 text-green-400 text-xs">
                        Save ${tier.savings}
                      </Badge>
                      <span className="text-purple-300 text-sm">
                        (${Math.round(tier.annualPrice / 12)}/mo)
                      </span>
                    </div>
                  )}
                </div>
              </CardHeader>
              
              <CardContent>
                <ul className="space-y-3">
                  {tier.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      {feature.included ? (
                        <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                      ) : (
                        <X className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" />
                      )}
                      <span className={feature.included ? 'text-white' : 'text-gray-500'}>
                        {feature.name}
                      </span>
                    </li>
                  ))}
                </ul>
                
                <div className="mt-6 pt-6 border-t border-white/10">
                  <h4 className="text-sm font-semibold text-purple-300 mb-3 flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Plan Limits
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2 text-white">
                      <Clock className="w-4 h-4 text-purple-400" />
                      <span>
                        {tier.limits.monthlyPhotos === -1 ? 'Unlimited' : tier.limits.monthlyPhotos} photos
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-white">
                      <Award className="w-4 h-4 text-purple-400" />
                      <span>
                        {tier.limits.activeJobs === -1 ? 'Unlimited' : tier.limits.activeJobs} jobs
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-white">
                      <Building2 className="w-4 h-4 text-purple-400" />
                      <span>
                        {tier.limits.teamMembers === -1 ? 'Unlimited' : tier.limits.teamMembers} team
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-white">
                      <Zap className="w-4 h-4 text-purple-400" />
                      <span>{tier.limits.storageGB} GB storage</span>
                    </div>
                  </div>
                </div>
              </CardContent>
              
              <CardFooter>
                <Button
                  onClick={() => handleSubscribe(tier)}
                  disabled={loading === tier.id}
                  className={`w-full h-12 text-lg font-semibold ${
                    tier.popular
                      ? 'bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600'
                      : `bg-gradient-to-r ${tier.color} hover:opacity-90`
                  }`}
                  data-testid={`button-subscribe-${tier.id}`}
                >
                  {loading === tier.id ? (
                    <span className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Processing...
                    </span>
                  ) : (
                    `Get ${tier.name}`
                  )}
                </Button>
              </CardFooter>
            </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-8 bg-white/5 backdrop-blur-lg rounded-2xl px-8 py-6 border border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                <Shield className="w-6 h-6 text-green-400" />
              </div>
              <div className="text-left">
                <div className="text-white font-semibold">30-Day Money Back</div>
                <div className="text-purple-300 text-sm">No questions asked</div>
              </div>
            </div>
            
            <div className="w-px h-12 bg-white/20" />
            
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                <Clock className="w-6 h-6 text-blue-400" />
              </div>
              <div className="text-left">
                <div className="text-white font-semibold">Cancel Anytime</div>
                <div className="text-purple-300 text-sm">No long-term contracts</div>
              </div>
            </div>
            
            <div className="w-px h-12 bg-white/20" />
            
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                <Award className="w-6 h-6 text-purple-400" />
              </div>
              <div className="text-left">
                <div className="text-white font-semibold">Free Onboarding</div>
                <div className="text-purple-300 text-sm">Personal setup assistance</div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center text-purple-300">
          <p className="mb-2">Questions about pricing?</p>
          <p className="text-white font-semibold">
            Call us: <a href="tel:+17066044820" className="text-purple-400 hover:underline">706-604-4820</a>
            {' '}or email:{' '}
            <a href="mailto:strategicservicesavers@gmail.com" className="text-purple-400 hover:underline">
              strategicservicesavers@gmail.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
