import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Rocket, Target, TrendingUp, Users, DollarSign, Shield, 
  Zap, Brain, Phone, Star, BarChart3, Globe, Volume2, VolumeX,
  CheckCircle, ArrowRight, Building2, Heart
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import ModuleVoiceGuide from '@/components/ModuleVoiceGuide';

const pitchSections = [
  {
    id: 'problem',
    title: 'The Problem',
    icon: Target,
    color: 'from-red-500 to-orange-500',
    content: {
      headline: "Contractors Lose 40% of Leads",
      points: [
        "No follow-up system - leads go cold within 24 hours",
        "Manual quoting takes too long - customers shop around",
        "Reputation scattered across platforms - no unified presence",
        "Payment collection is slow and awkward"
      ],
      stat: { value: "$12B", label: "Lost annually to poor follow-up" }
    }
  },
  {
    id: 'solution',
    title: 'The Solution',
    icon: Rocket,
    color: 'from-purple-500 to-indigo-500',
    content: {
      headline: "WorkHub: AI That Closes Deals While You Work",
      points: [
        "CloseBot AI makes follow-up calls that sound human",
        "PriceWhisperer generates instant, market-accurate quotes",
        "ContractorMatch brings pre-qualified leads to your door",
        "PayStream collects payment with one-click checkout"
      ],
      stat: { value: "3x", label: "Average close rate improvement" }
    }
  },
  {
    id: 'market',
    title: 'Market Opportunity',
    icon: TrendingUp,
    color: 'from-green-500 to-emerald-500',
    content: {
      headline: "$500B Home Services Market",
      points: [
        "1.2M+ contractors in the US alone",
        "83% have no CRM or automation tools",
        "Average job value: $3,500",
        "Repeat customer value: $12,000/year"
      ],
      stat: { value: "15%", label: "YoY market growth" }
    }
  },
  {
    id: 'product',
    title: 'Product Suite',
    icon: Brain,
    color: 'from-blue-500 to-cyan-500',
    content: {
      headline: "12 AI-Powered Modules",
      points: [
        "ScopeSnap: AI photo analysis for instant job assessment",
        "CloseBot: AI sales agent that books appointments",
        "ReviewRocket: Automated review collection & distribution",
        "ContentForge: Marketing content from job photos"
      ],
      stat: { value: "12", label: "Integrated AI tools" }
    }
  },
  {
    id: 'traction',
    title: 'Traction',
    icon: BarChart3,
    color: 'from-amber-500 to-yellow-500',
    content: {
      headline: "Early Momentum",
      points: [
        "Beta launch with 50 contractors",
        "92% would recommend to peers",
        "4.8/5 average satisfaction score",
        "$847 average revenue per contractor/month"
      ],
      stat: { value: "92%", label: "NPS score" }
    }
  },
  {
    id: 'business',
    title: 'Business Model',
    icon: DollarSign,
    color: 'from-pink-500 to-rose-500',
    content: {
      headline: "Recurring SaaS + Transaction Fees",
      points: [
        "Free tier drives viral adoption",
        "Pro tier at $149/mo = 85% gross margin",
        "2.9% payment processing fee",
        "Enterprise deals: $399/mo per location"
      ],
      stat: { value: "$2.4M", label: "Projected ARR Year 2" }
    }
  },
  {
    id: 'team',
    title: 'Why Us',
    icon: Users,
    color: 'from-violet-500 to-purple-500',
    content: {
      headline: "Built by Contractors, for Contractors",
      points: [
        "Founders with 20+ years in home services",
        "AI/ML expertise from top tech companies",
        "Deep understanding of contractor pain points",
        "Advisory board of successful franchise owners"
      ],
      stat: { value: "20+", label: "Years industry experience" }
    }
  },
  {
    id: 'ask',
    title: 'The Ask',
    icon: Building2,
    color: 'from-cyan-500 to-teal-500',
    content: {
      headline: "Seed Round: $2M",
      points: [
        "Scale engineering team (40%)",
        "Marketing & customer acquisition (35%)",
        "CloseBot AI voice training (15%)",
        "Operations & legal (10%)"
      ],
      stat: { value: "18mo", label: "Runway to Series A" }
    }
  }
];

const valueProps = [
  {
    icon: Phone,
    title: "CloseBot AI",
    description: "AI that sounds human, converts like a pro. 24/7 follow-up calls that book appointments.",
    metric: "3x close rate"
  },
  {
    icon: Star,
    title: "FairnessScore",
    description: "Transparent contractor ratings that build trust. Customers choose verified pros.",
    metric: "47% more bookings"
  },
  {
    icon: Zap,
    title: "Instant Everything",
    description: "Photo to quote in 60 seconds. Schedule, pay, review - all in one flow.",
    metric: "10x faster"
  },
  {
    icon: Shield,
    title: "Protected",
    description: "MediaVault stores before/during/after photos. Win every dispute.",
    metric: "100% coverage"
  }
];

export default function PitchDeck() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const hasPlayedWelcome = useRef(false);
  const voiceEnabledRef = useRef(true);

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
  };

  const voiceMutation = useMutation({
    mutationFn: async (message: string) => {
      const res = await apiRequest("/api/closebot/chat", "POST", {
        message,
        history: [],
        context: { leadName: "contractor", companyName: "your company", trade: "investor_pitch" },
        enableVoice: true,
      });
      return res;
    },
    onSuccess: (data) => {
      if (!voiceEnabledRef.current) return;
      if (data.audioUrl && audioRef.current) {
        setIsPlaying(true);
        audioRef.current.src = data.audioUrl;
        audioRef.current.onended = () => setIsPlaying(false);
        audioRef.current.play().catch(() => setIsPlaying(false));
      }
    },
  });

  useEffect(() => {
    if (!hasPlayedWelcome.current) {
      hasPlayedWelcome.current = true;
      voiceMutation.mutate("Give a brief, warm 1-sentence welcome to the WorkHub Pitch Deck. You're Rachel, introducing the investor presentation about how WorkHub helps contractors close more deals with AI. Keep it super short and natural.");
    }
  }, []);

  const toggleVoice = () => {
    const newEnabled = !isVoiceEnabled;
    setIsVoiceEnabled(newEnabled);
    voiceEnabledRef.current = newEnabled;
    if (!newEnabled) {
      stopAudio();
    } else {
      voiceMutation.mutate("Say a quick, natural 1-sentence overview of the WorkHub pitch — AI that closes deals for contractors while they work. Keep it warm and conversational.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900">
      <audio ref={audioRef} className="hidden" />
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex justify-between items-start mb-8">
          <Link to="/workhub" className="text-indigo-300 hover:text-white transition-colors">
            &larr; Back to WorkHub
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleVoice}
            className="text-white/70 hover:text-white"
            data-testid="button-toggle-voice"
          >
            {isPlaying ? <Volume2 className="w-5 h-5 animate-pulse" /> : isVoiceEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </Button>
        </div>

        <div className="text-center mb-16">
          <Badge className="mb-4 bg-indigo-500/20 text-indigo-200 border-indigo-400/30">
            Investor Presentation
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
            WorkHub
          </h1>
          <p className="text-2xl text-indigo-200 mb-2">
            AI That Closes Deals While You Work
          </p>
          <p className="text-lg text-indigo-300/70">
            The Smart Contractor Marketplace
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
          {valueProps.map((prop) => {
            const Icon = prop.icon;
            return (
              <Card key={prop.title} className="bg-white/5 border-white/10 text-center">
                <CardContent className="pt-6">
                  <Icon className="w-10 h-10 text-indigo-400 mx-auto mb-3" />
                  <h3 className="text-white font-semibold mb-1">{prop.title}</h3>
                  <p className="text-sm text-indigo-200/70 mb-2">{prop.description}</p>
                  <Badge className="bg-green-500/20 text-green-300 border-green-400/30">
                    {prop.metric}
                  </Badge>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="space-y-8">
          {pitchSections.map((section, index) => {
            const Icon = section.icon;
            return (
              <Card 
                key={section.id} 
                className="bg-white/5 border-white/10 overflow-hidden"
                data-testid={`card-pitch-${section.id}`}
              >
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${section.color} flex items-center justify-center`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <Badge variant="outline" className="text-indigo-300 border-indigo-400/30 mb-1">
                        {String(index + 1).padStart(2, '0')}
                      </Badge>
                      <CardTitle className="text-2xl text-white">{section.title}</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="md:col-span-2">
                      <h3 className="text-xl font-semibold text-white mb-4">
                        {section.content.headline}
                      </h3>
                      <ul className="space-y-3">
                        {section.content.points.map((point, idx) => (
                          <li key={idx} className="flex items-start gap-3">
                            <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                            <span className="text-indigo-100">{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="flex items-center justify-center">
                      <div className={`bg-gradient-to-r ${section.color} rounded-2xl p-6 text-center`}>
                        <div className="text-4xl font-bold text-white">
                          {section.content.stat.value}
                        </div>
                        <div className="text-white/80 text-sm">
                          {section.content.stat.label}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-16 text-center bg-gradient-to-r from-purple-500/20 to-indigo-500/20 rounded-2xl p-12 border border-purple-400/30">
          <Globe className="w-16 h-16 text-purple-400 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Transform Home Services?
          </h2>
          <p className="text-xl text-purple-200 mb-6 max-w-2xl mx-auto">
            Join us in building the future of contractor-customer connections.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600"
            >
              Schedule a Meeting
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-purple-400 text-purple-200 hover:bg-purple-500/20"
            >
              Download Full Deck
            </Button>
          </div>
        </div>
      </div>
      <ModuleVoiceGuide moduleName="pitch-deck" />
    </div>
  );
}