import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { Check, X, Zap, Crown, Building2, Rocket, ArrowRight, Volume2, VolumeX } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const pricingTiers = [
  {
    id: 'free',
    name: 'Free',
    tagline: 'Get started risk-free',
    monthlyPrice: 0,
    annualPrice: 0,
    icon: Zap,
    color: 'from-gray-500 to-gray-600',
    features: [
      { name: 'Up to 5 leads/month', included: true },
      { name: 'Basic ScopeSnap analysis', included: true },
      { name: 'Profile listing', included: true },
      { name: 'Manual invoice creation', included: true },
      { name: 'Email support', included: true },
      { name: 'CloseBot AI calls', included: false },
      { name: 'PriceWhisperer estimates', included: false },
      { name: 'CalendarSync booking', included: false },
      { name: 'ReviewRocket automation', included: false },
      { name: 'ContentForge marketing', included: false },
    ],
    limits: {
      monthlyLeads: 5,
      closeBotCalls: 0,
      mediaStorage: '100 MB',
      teamMembers: 1
    }
  },
  {
    id: 'starter',
    name: 'Starter',
    tagline: 'For growing contractors',
    monthlyPrice: 49,
    annualPrice: 470,
    icon: Rocket,
    color: 'from-blue-500 to-blue-600',
    features: [
      { name: 'Up to 25 leads/month', included: true },
      { name: 'Full ScopeSnap AI analysis', included: true },
      { name: 'Featured profile listing', included: true },
      { name: 'Invoice + payment processing', included: true },
      { name: 'Priority email support', included: true },
      { name: '10 CloseBot calls/month', included: true },
      { name: 'PriceWhisperer estimates', included: true },
      { name: 'CalendarSync booking', included: true },
      { name: 'ReviewRocket (manual)', included: true },
      { name: 'ContentForge marketing', included: false },
    ],
    limits: {
      monthlyLeads: 25,
      closeBotCalls: 10,
      mediaStorage: '1 GB',
      teamMembers: 2
    }
  },
  {
    id: 'pro',
    name: 'Pro',
    tagline: 'Most popular for professionals',
    monthlyPrice: 149,
    annualPrice: 1430,
    icon: Crown,
    color: 'from-purple-500 to-indigo-600',
    popular: true,
    features: [
      { name: 'Unlimited leads', included: true },
      { name: 'Advanced ScopeSnap + photos', included: true },
      { name: 'Top-ranked profile', included: true },
      { name: 'Invoice + QuickFinance', included: true },
      { name: 'Phone + chat support', included: true },
      { name: '50 CloseBot calls/month', included: true },
      { name: 'PriceWhisperer + comparables', included: true },
      { name: 'CalendarSync + reminders', included: true },
      { name: 'ReviewRocket automation', included: true },
      { name: 'ContentForge (5 posts/mo)', included: true },
    ],
    limits: {
      monthlyLeads: -1,
      closeBotCalls: 50,
      mediaStorage: '10 GB',
      teamMembers: 5
    }
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    tagline: 'For multi-location teams',
    monthlyPrice: 399,
    annualPrice: 3830,
    icon: Building2,
    color: 'from-amber-500 to-orange-600',
    features: [
      { name: 'Unlimited everything', included: true },
      { name: 'White-label branding', included: true },
      { name: 'Multi-location support', included: true },
      { name: 'Custom integrations', included: true },
      { name: 'Dedicated account manager', included: true },
      { name: 'Unlimited CloseBot calls', included: true },
      { name: 'Custom AI training', included: true },
      { name: 'Team management', included: true },
      { name: 'API access', included: true },
      { name: 'ContentForge unlimited', included: true },
    ],
    limits: {
      monthlyLeads: -1,
      closeBotCalls: -1,
      mediaStorage: '100 GB',
      teamMembers: -1
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

export default function PricingTiers() {
  const [isAnnual, setIsAnnual] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [hasSpoken, setHasSpoken] = useState(false);

  useEffect(() => {
    if (!voiceEnabled || hasSpoken) return;
    
    const speak = () => {
      const voices = speechSynthesis.getVoices();
      if (voices.length === 0) return;
      
      speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(
        "Hey there! ... Welcome to WorkHub Pricing. ... " +
        "I'm Rachel, and I'm here to help you find the right plan for your business. ... " +
        "So, we've got four options, ... starting completely free, ... " +
        "and going up to Enterprise for larger teams. ... " +
        "Most contractors love our Pro plan ... because it gives you unlimited leads, ... " +
        "and that AI sales assistant that actually books jobs for you. ... " +
        "Take your time browsing, ... and feel free to ask me anything!"
      );
      
      const voice = getBestFemaleVoice(voices);
      if (voice) utterance.voice = voice;
      utterance.pitch = 1.0;
      utterance.rate = 0.9;
      
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
    setHasSpoken(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="flex justify-between items-start mb-8">
          <Link to="/workhub" className="text-purple-300 hover:text-white transition-colors">
            &larr; Back to WorkHub
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleVoice}
            className="text-white/70 hover:text-white"
            data-testid="button-toggle-voice"
          >
            {voiceEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </Button>
        </div>

        <div className="text-center mb-12">
          <Badge className="mb-4 bg-purple-500/20 text-purple-200 border-purple-400/30">
            Simple, Transparent Pricing
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Choose Your Growth Plan
          </h1>
          <p className="text-xl text-purple-200 max-w-2xl mx-auto mb-8">
            Start free, upgrade when ready. No hidden fees, cancel anytime.
          </p>

          <div className="flex items-center justify-center gap-4">
            <span className={`text-lg ${!isAnnual ? 'text-white font-semibold' : 'text-white/60'}`}>
              Monthly
            </span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className={`relative w-16 h-8 rounded-full transition-colors ${isAnnual ? 'bg-green-500' : 'bg-gray-600'}`}
              data-testid="button-toggle-billing"
            >
              <span className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-transform ${isAnnual ? 'left-9' : 'left-1'}`} />
            </button>
            <span className={`text-lg ${isAnnual ? 'text-white font-semibold' : 'text-white/60'}`}>
              Annual <Badge className="ml-1 bg-green-500/20 text-green-300 border-green-400/30">Save 20%</Badge>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {pricingTiers.map((tier) => {
            const Icon = tier.icon;
            const price = isAnnual ? tier.annualPrice : tier.monthlyPrice;
            const monthlyEquivalent = isAnnual ? Math.round(tier.annualPrice / 12) : tier.monthlyPrice;
            
            return (
              <Card 
                key={tier.id}
                className={`relative overflow-hidden bg-white/10 backdrop-blur-sm border-white/20 ${
                  tier.popular ? 'ring-2 ring-purple-400 scale-105' : ''
                }`}
                data-testid={`card-pricing-${tier.id}`}
              >
                {tier.popular && (
                  <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-center py-1 text-sm font-medium">
                    Most Popular
                  </div>
                )}
                
                <CardHeader className={tier.popular ? 'pt-10' : ''}>
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${tier.color} flex items-center justify-center mb-4`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-2xl text-white">{tier.name}</CardTitle>
                  <CardDescription className="text-purple-200">{tier.tagline}</CardDescription>
                </CardHeader>

                <CardContent>
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-white">${monthlyEquivalent}</span>
                    <span className="text-purple-200">/month</span>
                    {isAnnual && tier.monthlyPrice > 0 && (
                      <p className="text-sm text-green-400 mt-1">
                        Billed ${tier.annualPrice}/year
                      </p>
                    )}
                  </div>

                  <ul className="space-y-3">
                    {tier.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2">
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
                </CardContent>

                <CardFooter>
                  <Button
                    className={`w-full ${
                      tier.popular 
                        ? 'bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600' 
                        : 'bg-white/20 hover:bg-white/30'
                    }`}
                    data-testid={`button-select-${tier.id}`}
                  >
                    {tier.id === 'free' ? 'Get Started Free' : `Choose ${tier.name}`}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>

        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">All Plans Include</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {[
              'Secure payments',
              'Mobile-friendly',
              'Real-time updates',
              '24/7 availability'
            ].map((item) => (
              <div key={item} className="flex items-center gap-2 text-purple-200">
                <Check className="w-4 h-4 text-green-400" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 bg-white/5 rounded-2xl p-8 text-center">
          <h3 className="text-xl font-semibold text-white mb-2">Questions about pricing?</h3>
          <p className="text-purple-200 mb-4">
            Book a free demo and we'll help you find the perfect plan for your business.
          </p>
          <Button variant="outline" className="border-purple-400 text-purple-200 hover:bg-purple-500/20">
            Schedule a Demo
          </Button>
        </div>
      </div>
    </div>
  );
}
