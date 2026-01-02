import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Check, X, Zap, Crown, Building2, Rocket, Star, Shield, Clock, Award, ArrowLeft, Volume2, VolumeX } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

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
        "Welcome to Disaster Direct Contractor Pricing! ... " +
        "I'm Rachel, your AI assistant. ... " +
        "We've got three powerful plans designed specifically for storm contractors. ... " +
        "Most of our successful contractors go with Storm Pro ... " +
        "because it includes unlimited AI damage detection, ... " +
        "plus our exclusive ECRP system to get you registered with over 40 storm agencies. ... " +
        "Choose annual billing and you'll save up to two months free! ... " +
        "Take your time and pick the plan that fits your business."
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
            Join thousands of storm contractors using Disaster Direct to dominate their market. 
            Get AI-powered damage detection, automated claims processing, and exclusive agency access.
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
              Save up to $794/yr
            </Badge>
          </Label>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
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
