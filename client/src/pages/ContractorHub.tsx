import { useState } from "react";
import { Link } from "wouter";
import { 
  Lock, Unlock, Star, Zap, Camera, Calculator, Users, Calendar, FileText, 
  CreditCard, MessageSquare, TrendingUp, Shield, CloudLightning, MapPin,
  Truck, HardHat, AlertTriangle, Radio, Trees, Building, DollarSign,
  CheckCircle2, ArrowRight, Crown, Sparkles, Volume2, X, Play, VolumeX
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

interface ModuleInfo {
  id: string;
  name: string;
  tagline: string;
  description: string;
  icon: any;
  category: "workhub" | "disaster" | "marketplace";
  features: string[];
  benefits: string[];
  pricing: {
    monthly: number;
    yearly: number;
  };
  route: string;
  color: string;
  isPopular?: boolean;
  isNew?: boolean;
  comingSoon?: boolean;
  isPremium?: boolean;
}

const MODULES: ModuleInfo[] = [
  // WorkHub Marketplace Modules
  {
    id: "scopesnap",
    name: "ScopeSnap",
    tagline: "AI Vision Analysis",
    description: "Upload photos and get instant AI-powered damage assessments, measurements, and scope recommendations.",
    icon: Camera,
    category: "workhub",
    features: [
      "AI photo analysis for damage detection",
      "Automatic measurement extraction",
      "Roof, siding, and structural assessments",
      "PDF report generation",
      "Before/after comparison tools"
    ],
    benefits: [
      "Save 2+ hours per inspection",
      "Reduce missed damage by 40%",
      "Professional reports in seconds"
    ],
    pricing: { monthly: 49, yearly: 470 },
    route: "/workhub/scopesnap",
    color: "from-blue-500 to-cyan-500",
    isPopular: true
  },
  {
    id: "pricewhisperer",
    name: "PriceWhisperer",
    tagline: "Smart Estimate Engine",
    description: "Generate accurate, industry-standard pricing estimates for any trade with AI assistance.",
    icon: Calculator,
    category: "workhub",
    features: [
      "Multi-trade pricing engines",
      "Tree removal, roofing, flooring, auto repair",
      "Material cost comparisons",
      "Labor hour estimates",
      "Profit margin calculator"
    ],
    benefits: [
      "Win more bids with competitive pricing",
      "Never undercharge again",
      "Industry benchmark accuracy"
    ],
    pricing: { monthly: 39, yearly: 374 },
    route: "/workhub/pricewhisperer",
    color: "from-green-500 to-emerald-500"
  },
  {
    id: "contractormatch",
    name: "ContractorMatch",
    tagline: "AI Lead Matching",
    description: "Get matched with qualified leads based on your skills, location, and availability.",
    icon: Users,
    category: "workhub",
    features: [
      "AI-powered lead matching",
      "Skill and location targeting",
      "Lead quality scoring",
      "Automated follow-up",
      "CRM integration"
    ],
    benefits: [
      "3x more qualified leads",
      "Reduce lead chase time",
      "Higher close rates"
    ],
    pricing: { monthly: 79, yearly: 758 },
    route: "/workhub/contractormatch",
    color: "from-purple-500 to-pink-500",
    isNew: true
  },
  {
    id: "calendarsync",
    name: "CalendarSync",
    tagline: "AI Scheduling",
    description: "Smart scheduling that optimizes your routes and maximizes daily appointments.",
    icon: Calendar,
    category: "workhub",
    features: [
      "Route optimization",
      "Customer self-booking",
      "Crew assignment",
      "Weather-aware scheduling",
      "Automatic reminders"
    ],
    benefits: [
      "Fit 2 more jobs per day",
      "Reduce no-shows by 60%",
      "Less windshield time"
    ],
    pricing: { monthly: 29, yearly: 278 },
    route: "/workhub/calendarsync",
    color: "from-orange-500 to-amber-500"
  },
  {
    id: "jobflow",
    name: "JobFlow",
    tagline: "Project Command Center",
    description: "Track every job from lead to payment with visual Kanban boards and team collaboration.",
    icon: TrendingUp,
    category: "workhub",
    features: [
      "Kanban pipeline boards",
      "Team task assignment",
      "Material tracking",
      "Customer communication log",
      "Profitability tracking"
    ],
    benefits: [
      "Never lose a job again",
      "Real-time team visibility",
      "Track every dollar"
    ],
    pricing: { monthly: 59, yearly: 566 },
    route: "/workhub/jobflow",
    color: "from-indigo-500 to-violet-500"
  },
  {
    id: "mediavault",
    name: "MediaVault",
    tagline: "Protected Documentation",
    description: "Store and organize all job photos, videos, and documents with GPS and timestamp verification.",
    icon: FileText,
    category: "workhub",
    features: [
      "Unlimited cloud storage",
      "GPS & timestamp metadata",
      "Before/after organization",
      "Client-ready galleries",
      "Legal-grade timestamps"
    ],
    benefits: [
      "Win disputes with proof",
      "Impress clients with professionalism",
      "Never lose documentation"
    ],
    pricing: { monthly: 19, yearly: 182 },
    route: "/workhub/mediavault",
    color: "from-teal-500 to-cyan-500"
  },
  {
    id: "closebot",
    name: "CloseBot",
    tagline: "AI Sales Agent",
    description: "AI-powered sales assistant that follows up with leads and books appointments 24/7.",
    icon: MessageSquare,
    category: "workhub",
    features: [
      "24/7 lead response",
      "SMS and email follow-up",
      "Appointment booking",
      "Objection handling",
      "Sales script optimization"
    ],
    benefits: [
      "Never miss a lead again",
      "5x faster response time",
      "Close more deals on autopilot"
    ],
    pricing: { monthly: 99, yearly: 950 },
    route: "/workhub/closebot",
    color: "from-rose-500 to-red-500",
    isPopular: true
  },
  {
    id: "paystream",
    name: "PayStream",
    tagline: "Seamless Payments",
    description: "Accept payments, send invoices, and manage billing with integrated payment processing.",
    icon: CreditCard,
    category: "workhub",
    features: [
      "Credit card & ACH payments",
      "Professional invoices",
      "Progress billing",
      "Automatic receipts",
      "QuickBooks sync"
    ],
    benefits: [
      "Get paid 3x faster",
      "Reduce payment friction",
      "Professional appearance"
    ],
    pricing: { monthly: 29, yearly: 278 },
    route: "/workhub/paystream",
    color: "from-emerald-500 to-green-500"
  },
  {
    id: "reviewrocket",
    name: "ReviewRocket",
    tagline: "Reputation Automation",
    description: "Automatically request, manage, and respond to customer reviews across all platforms.",
    icon: Star,
    category: "workhub",
    features: [
      "Automatic review requests",
      "Multi-platform management",
      "AI response suggestions",
      "Review monitoring",
      "Reputation analytics"
    ],
    benefits: [
      "2x more 5-star reviews",
      "Protect your reputation",
      "Outrank competitors"
    ],
    pricing: { monthly: 39, yearly: 374 },
    route: "/workhub/reviewrocket",
    color: "from-yellow-500 to-orange-500"
  },
  // Disaster Direct Modules
  {
    id: "stormwatch",
    name: "Storm Intelligence",
    tagline: "Real-Time Weather Monitoring",
    description: "Live multi-hazard monitoring with NWS alerts, radar, lightning, and storm predictions.",
    icon: CloudLightning,
    category: "disaster",
    features: [
      "NWS CAP alerts integration",
      "Live lightning tracking",
      "Hurricane & tornado paths",
      "Storm prediction AI",
      "Contractor deployment alerts"
    ],
    benefits: [
      "Be first on scene",
      "Deploy crews strategically",
      "Maximize storm revenue"
    ],
    pricing: { monthly: 99, yearly: 950 },
    route: "/dashboard",
    color: "from-blue-600 to-indigo-700",
    isPopular: true
  },
  {
    id: "treetracker",
    name: "Tree Incident Tracker",
    tagline: "Street-Level Damage Mapping",
    description: "Track tree-on-structure incidents with priority routing and crew assignment.",
    icon: Trees,
    category: "disaster",
    features: [
      "Incident mapping",
      "Priority-based sorting",
      "CMA generation",
      "Crew routing",
      "Bulk CSV/KML import"
    ],
    benefits: [
      "Respond to emergencies faster",
      "Prioritize high-value jobs",
      "Never miss an incident"
    ],
    pricing: { monthly: 49, yearly: 470 },
    route: "/tree-tracker",
    color: "from-green-600 to-emerald-700"
  },
  {
    id: "trafficcams",
    name: "Traffic Cameras",
    tagline: "Live Road Monitoring",
    description: "Monitor road conditions with live traffic camera feeds filtered by location.",
    icon: Radio,
    category: "disaster",
    features: [
      "Live camera feeds",
      "State/city filtering",
      "Road condition monitoring",
      "Storm damage viewing",
      "Route planning"
    ],
    benefits: [
      "Plan routes efficiently",
      "Verify conditions before dispatch",
      "Document road hazards"
    ],
    pricing: { monthly: 29, yearly: 278 },
    route: "/traffic-cameras",
    color: "from-slate-600 to-gray-700"
  },
  {
    id: "stormacademy",
    name: "Storm Science Academy",
    tagline: "Ice Storm Education & Safety",
    description: "Comprehensive education modules on storm types, safety protocols, and damage assessment.",
    icon: Building,
    category: "disaster",
    features: [
      "Ice storm education",
      "Safety protocols",
      "Damage assessment training",
      "Certification prep",
      "Video lessons"
    ],
    benefits: [
      "Safer crew operations",
      "Better damage estimates",
      "Professional certification"
    ],
    pricing: { monthly: 19, yearly: 182 },
    route: "/storm-academy",
    color: "from-cyan-600 to-blue-700"
  },
  {
    id: "leadvault",
    name: "ContractorLeadVault",
    tagline: "B2B Lead Finder",
    description: "Find and connect with property managers, HOAs, and commercial clients in disaster zones.",
    icon: Building,
    category: "disaster",
    features: [
      "B2B lead database",
      "Disaster zone targeting",
      "Property manager contacts",
      "HOA directories",
      "Automated outreach"
    ],
    benefits: [
      "Land commercial contracts",
      "Build recurring relationships",
      "Scale your business"
    ],
    pricing: { monthly: 149, yearly: 1430 },
    route: "/lead-vault",
    color: "from-purple-600 to-violet-700",
    isNew: true
  },
  {
    id: "fema-audit",
    name: "AuditShield",
    tagline: "Grant & Contract Compliance AI",
    description: "Multi-agency compliance (FEMA, USACE, HUD, DOT, State), AI fraud detection, photo documentation, and one-click audit defense packets.",
    icon: Shield,
    category: "disaster",
    features: [
      "AI digital monitors",
      "Geofenced work zones",
      "Load ticket chain of custody",
      "Rate validation engine",
      "Fraud detection AI",
      "One-click FEMA exports"
    ],
    benefits: [
      "Reduce monitor overhead 50%+",
      "Prevent FEMA clawbacks",
      "Audit-ready documentation"
    ],
    pricing: { monthly: 299, yearly: 2870 },
    route: "/fema-audit",
    color: "from-amber-600 to-orange-700",
    isNew: true,
    isPremium: true
  },
  // Marketplace
  {
    id: "crewlink",
    name: "CrewLink Exchange",
    tagline: "Workforce Marketplace",
    description: "Find and hire skilled workers, full crews, and rent equipment nationwide.",
    icon: HardHat,
    category: "marketplace",
    features: [
      "Worker/crew browsing (FREE)",
      "Equipment rentals",
      "AI scoring & matching",
      "Storm-ready crews",
      "36+ trade categories"
    ],
    benefits: [
      "Scale up instantly",
      "Access nationwide talent",
      "Equipment on demand"
    ],
    pricing: { monthly: 0, yearly: 0 },
    route: "/crewlink",
    color: "from-orange-500 to-amber-600"
  }
];

const SUBSCRIPTION_STATUS: Record<string, boolean> = {
  "crewlink": true,
};

function ModuleCard({ module, isSubscribed, onViewDetails }: { 
  module: ModuleInfo; 
  isSubscribed: boolean;
  onViewDetails: () => void;
}) {
  const Icon = module.icon;
  
  return (
    <Card className={`relative overflow-hidden hover:shadow-xl transition-all duration-300 ${
      isSubscribed ? 'border-green-400 dark:border-green-600' : 'border-gray-200 dark:border-gray-700'
    }`}>
      {module.isPopular && (
        <Badge className="absolute top-2 right-2 bg-yellow-500 text-white gap-1 z-10">
          <Star className="h-3 w-3" /> Popular
        </Badge>
      )}
      {module.isNew && (
        <Badge className="absolute top-2 right-2 bg-purple-500 text-white gap-1 z-10">
          <Sparkles className="h-3 w-3" /> New
        </Badge>
      )}
      {module.comingSoon && (
        <Badge className="absolute top-2 right-2 bg-gray-500 text-white z-10">
          Coming Soon
        </Badge>
      )}
      
      <div className={`h-2 bg-gradient-to-r ${module.color}`} />
      
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className={`p-3 rounded-xl bg-gradient-to-br ${module.color} text-white shadow-lg`}>
            <Icon className="h-6 w-6" />
          </div>
          {isSubscribed ? (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300 gap-1">
              <Unlock className="h-3 w-3" /> Active
            </Badge>
          ) : module.pricing.monthly === 0 ? (
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300 gap-1">
              FREE
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-300 gap-1">
              <Lock className="h-3 w-3" /> Locked
            </Badge>
          )}
        </div>
        <CardTitle className="text-lg mt-3">{module.name}</CardTitle>
        <CardDescription className="text-sm font-medium text-primary">
          {module.tagline}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pb-3">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {module.description}
        </p>
        
        {module.pricing.monthly > 0 && (
          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-2xl font-bold">${module.pricing.monthly}</span>
            <span className="text-muted-foreground">/month</span>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="pt-0 gap-2">
        <Button 
          variant="outline" 
          className="flex-1"
          onClick={onViewDetails}
        >
          View Features
        </Button>
        {isSubscribed || module.pricing.monthly === 0 ? (
          <Link href={module.route}>
            <Button className={`flex-1 bg-gradient-to-r ${module.color} hover:opacity-90`}>
              Open <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        ) : (
          <Button 
            className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
            onClick={onViewDetails}
          >
            <Crown className="h-4 w-4 mr-1" /> Subscribe
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

function ModuleDetailsDialog({ 
  module, 
  isSubscribed, 
  open, 
  onClose 
}: { 
  module: ModuleInfo | null;
  isSubscribed: boolean;
  open: boolean;
  onClose: () => void;
}) {
  if (!module) return null;
  
  const Icon = module.icon;
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-4">
            <div className={`p-4 rounded-xl bg-gradient-to-br ${module.color} text-white shadow-lg`}>
              <Icon className="h-8 w-8" />
            </div>
            <div>
              <DialogTitle className="text-2xl">{module.name}</DialogTitle>
              <DialogDescription className="text-base font-medium text-primary">
                {module.tagline}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <p className="text-muted-foreground">{module.description}</p>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Zap className="h-4 w-4 text-yellow-500" />
                Features Included
              </h4>
              <ul className="space-y-2">
                {module.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-500" />
                Key Benefits
              </h4>
              <ul className="space-y-2">
                {module.benefits.map((benefit, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <Star className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          {module.pricing.monthly > 0 && (
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-xl p-6">
              <h4 className="font-semibold mb-4 flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-500" />
                Pricing Options
              </h4>
              <div className="grid md:grid-cols-2 gap-4">
                <Card className="border-2 border-gray-200">
                  <CardContent className="p-4 text-center">
                    <p className="text-sm text-muted-foreground mb-1">Monthly</p>
                    <p className="text-3xl font-bold">${module.pricing.monthly}</p>
                    <p className="text-sm text-muted-foreground">/month</p>
                  </CardContent>
                </Card>
                <Card className="border-2 border-green-400 bg-green-50 dark:bg-green-950/30">
                  <CardContent className="p-4 text-center relative">
                    <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-green-500">
                      Save 20%
                    </Badge>
                    <p className="text-sm text-muted-foreground mb-1">Yearly</p>
                    <p className="text-3xl font-bold">${module.pricing.yearly}</p>
                    <p className="text-sm text-muted-foreground">/year</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {isSubscribed || module.pricing.monthly === 0 ? (
            <Link href={module.route}>
              <Button className={`bg-gradient-to-r ${module.color} hover:opacity-90`}>
                <Play className="h-4 w-4 mr-2" />
                Open Module
              </Button>
            </Link>
          ) : (
            <Button className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600">
              <Crown className="h-4 w-4 mr-2" />
              Subscribe Now
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function ContractorHub() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("all");
  const [selectedModule, setSelectedModule] = useState<ModuleInfo | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);

  const stopVoice = () => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      setCurrentAudio(null);
    }
    setIsPlayingVoice(false);
  };

  const playVoiceGuide = async () => {
    if (isPlayingVoice) {
      stopVoice();
      return;
    }

    setIsPlayingVoice(true);
    const voiceScript = `Welcome to your Contractor Hub — your complete command center for running and growing your contracting business. I'm Rachel, your AI guide, and I'll walk you through everything available to you here.

This hub is organized into three categories: WorkHub tools for everyday business, Disaster Response modules for storm operations, and the CrewLink Marketplace for workforce and equipment.

Let me start with your WorkHub tools. ScopeSnap is your AI Vision Analysis tool at $49 per month — just upload photos and get instant AI-powered damage assessments, measurements, and scope recommendations. It saves you 2 or more hours per inspection.

PriceWhisperer, at $39 per month, is your Smart Estimate Engine — it generates accurate, industry-standard pricing estimates for tree removal, roofing, flooring, and auto repair. Never undercharge again.

ContractorMatch at $79 per month uses AI to match you with qualified leads based on your skills, location, and availability — expect 3 times more qualified leads.

CalendarSync at just $29 per month handles AI scheduling, route optimization, customer self-booking, and weather-aware scheduling — fit 2 more jobs per day.

JobFlow at $59 per month is your Project Command Center — track every job from lead to payment with visual boards and team collaboration.

MediaVault at $19 per month gives you unlimited cloud storage for photos, videos, and documents with GPS and timestamp verification for legal-grade proof.

CloseBot at $99 per month is your AI Sales Agent — it follows up with leads and books appointments 24/7. Never miss a lead again.

PayStream at $29 per month handles payments, invoices, and billing — get paid 3 times faster with credit card and ACH processing.

ReviewRocket at $39 per month automates your reputation — request and manage customer reviews across all platforms to get 2 times more 5-star reviews.

Now for Disaster Response modules. Storm Intelligence at $99 per month gives you real-time multi-hazard monitoring with NWS alerts, radar, lightning tracking, and storm prediction AI — be first on scene.

Tree Incident Tracker at $49 per month maps street-level tree incidents with priority routing and crew assignment.

Traffic Cameras at $29 per month lets you monitor live road conditions filtered by location for efficient route planning.

Storm Science Academy at $19 per month provides education on storm types, safety protocols, and damage assessment training.

ContractorLeadVault at $149 per month is your B2B lead finder — connect with property managers, HOAs, and commercial clients in disaster zones.

And our premium module — AuditShield at $299 per month — gives you multi-agency compliance (FEMA, USACE, HUD, DOT), AI fraud detection, photo documentation, geofenced work zones, and one-click audit-ready packets. Essential for any contractor working government or private contracts.

In the Marketplace, CrewLink Exchange is completely FREE to browse — find skilled workers, full crews, and rent equipment nationwide across 36 or more trade categories.

For the best value, our Pro Bundle gives you access to ALL modules for just $299 per month — that's over $400 in savings. Click Get Pro Bundle to unlock everything.

Let me know if you'd like details on any specific module — just click View Features on any card to learn more.`;

    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: voiceScript })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.audioBase64) {
          const byteCharacters = atob(data.audioBase64);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: 'audio/mpeg' });
          const audioUrl = URL.createObjectURL(blob);
          const audio = new Audio(audioUrl);
          setCurrentAudio(audio);
          audio.onended = () => {
            setIsPlayingVoice(false);
            setCurrentAudio(null);
            URL.revokeObjectURL(audioUrl);
          };
          audio.onerror = () => {
            setIsPlayingVoice(false);
            setCurrentAudio(null);
            URL.revokeObjectURL(audioUrl);
            toast({ title: 'Voice unavailable', description: 'Audio playback failed.' });
          };
          audio.play().catch(() => {
            setIsPlayingVoice(false);
            setCurrentAudio(null);
            toast({ title: 'Voice unavailable', description: 'Could not play audio.' });
          });
        } else {
          setIsPlayingVoice(false);
          toast({ title: 'Voice unavailable', description: 'No audio data received.' });
        }
      } else {
        setIsPlayingVoice(false);
        toast({ title: 'Voice unavailable', description: 'Voice service not available right now.' });
      }
    } catch (error) {
      setIsPlayingVoice(false);
      console.error('Voice guide error:', error);
      toast({ title: 'Voice unavailable', description: 'Could not connect to voice service.' });
    }
  };

  const filteredModules = activeTab === "all" 
    ? MODULES 
    : MODULES.filter(m => m.category === activeTab);
  
  const workhubCount = MODULES.filter(m => m.category === "workhub").length;
  const disasterCount = MODULES.filter(m => m.category === "disaster").length;
  const marketplaceCount = MODULES.filter(m => m.category === "marketplace").length;
  
  const handleViewDetails = (module: ModuleInfo) => {
    setSelectedModule(module);
    setDialogOpen(true);
  };
  
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 text-white">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySC0yNHYtMmgxMnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-50" />
        <div className="relative max-w-7xl mx-auto px-4 py-12 md:py-16">
          <div className="text-center">
            <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-400/30 mb-4">
              <Crown className="h-3 w-3 mr-1" />
              Contractor Command Center
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Your Complete Contractor Hub
            </h1>
            <p className="text-xl text-blue-200 max-w-2xl mx-auto mb-6">
              All your WorkHub tools, Disaster Response modules, and marketplace features in one place. 
              Subscribe to unlock powerful capabilities for your business.
            </p>
            <div className="flex flex-wrap justify-center gap-4 mb-6">
              <div className="flex items-center gap-2 bg-white/10 rounded-lg px-4 py-2">
                <Zap className="h-5 w-5 text-yellow-300" />
                <span>{MODULES.length} Modules Available</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 rounded-lg px-4 py-2">
                <Shield className="h-5 w-5 text-green-300" />
                <span>Enterprise-Grade Security</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 rounded-lg px-4 py-2">
                <MessageSquare className="h-5 w-5 text-purple-300" />
                <span>24/7 AI Assistant</span>
              </div>
            </div>
            <Button
              onClick={playVoiceGuide}
              size="lg"
              className={`${isPlayingVoice 
                ? 'bg-red-600 hover:bg-red-700 animate-pulse' 
                : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600'
              } text-white shadow-lg px-8 py-3 text-lg`}
            >
              {isPlayingVoice ? (
                <>
                  <VolumeX className="h-5 w-5 mr-2" />
                  Stop Rachel
                </>
              ) : (
                <>
                  <Volume2 className="h-5 w-5 mr-2" />
                  Rachel Voice Guide — Hear What's Included
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
      
      {/* Module Grid */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <TabsList className="bg-muted">
              <TabsTrigger value="all" className="gap-2">
                All Modules
                <Badge variant="secondary">{MODULES.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="workhub" className="gap-2">
                <Briefcase className="h-4 w-4" />
                WorkHub
                <Badge variant="secondary">{workhubCount}</Badge>
              </TabsTrigger>
              <TabsTrigger value="disaster" className="gap-2">
                <CloudLightning className="h-4 w-4" />
                Disaster
                <Badge variant="secondary">{disasterCount}</Badge>
              </TabsTrigger>
              <TabsTrigger value="marketplace" className="gap-2">
                <HardHat className="h-4 w-4" />
                Marketplace
                <Badge variant="secondary">{marketplaceCount}</Badge>
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value={activeTab} className="mt-0">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredModules.map(module => (
                <ModuleCard 
                  key={module.id}
                  module={module}
                  isSubscribed={SUBSCRIPTION_STATUS[module.id] || false}
                  onViewDetails={() => handleViewDetails(module)}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>
        
        {/* Bundle Pricing CTA */}
        <div className="mt-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-8 text-white">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-2xl font-bold mb-2">Unlock Everything with Pro Bundle</h3>
              <p className="text-purple-200">
                Get access to all WorkHub and Disaster Direct modules at a massive discount.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-white/20 rounded-xl px-6 py-4 mb-3">
                <p className="text-sm text-purple-200">All Modules</p>
                <p className="text-4xl font-bold">$299<span className="text-lg">/mo</span></p>
                <p className="text-xs text-purple-300">Save $400+/month</p>
              </div>
              <Button size="lg" className="bg-white text-purple-700 hover:bg-purple-50 font-semibold">
                <Crown className="h-5 w-5 mr-2" />
                Get Pro Bundle
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      <ModuleDetailsDialog 
        module={selectedModule}
        isSubscribed={selectedModule ? (SUBSCRIPTION_STATUS[selectedModule.id] || false) : false}
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
      />
    </div>
  );
}

function Briefcase(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect width="20" height="14" x="2" y="7" rx="2" ry="2"/>
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
    </svg>
  );
}
