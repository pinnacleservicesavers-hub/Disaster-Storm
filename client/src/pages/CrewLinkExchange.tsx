import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  Users, Wrench, Truck, MapPin, Star, Shield, Clock, DollarSign,
  Search, Filter, ChevronRight, Phone, Mail, Calendar, Award,
  Building2, HardHat, Briefcase, CheckCircle2, AlertCircle,
  TrendingUp, Globe, Zap, Volume2, MessageSquare, Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import ModuleAIAssistant from "@/components/ModuleAIAssistant";

const CATEGORIES = [
  { id: "all", name: "All Categories", icon: Globe },
  { id: "construction", name: "Construction", icon: Building2 },
  { id: "tree", name: "Tree & Vegetation", icon: Wrench },
  { id: "roofing", name: "Roofing", icon: HardHat },
  { id: "electrical", name: "Electrical", icon: Zap },
  { id: "plumbing", name: "Plumbing", icon: Wrench },
  { id: "hvac", name: "HVAC", icon: Wrench },
  { id: "cdl", name: "CDL / Transportation", icon: Truck },
  { id: "housekeeping", name: "Housekeeping", icon: Building2 },
  { id: "admin", name: "Administrative", icon: Briefcase },
  { id: "it", name: "IT / Tech", icon: Globe },
  { id: "landscaping", name: "Landscaping", icon: Wrench },
  { id: "healthcare", name: "Healthcare", icon: Users },
  { id: "hospitality", name: "Hospitality", icon: Building2 },
  { id: "other", name: "Other Services", icon: Briefcase },
];

const SAMPLE_WORKERS = [
  {
    id: "w1",
    firstName: "Marcus",
    lastName: "Johnson",
    category: "Tree & Vegetation",
    subcategory: "Certified Tree Climber",
    dailyRate: 650,
    yearsExperience: 12,
    city: "Atlanta",
    state: "Georgia",
    certifications: ["ISA Certified Arborist", "OSHA 30", "First Aid/CPR"],
    skills: ["Tree Climbing", "Rigging", "Chain Saw Operation", "Crane Work"],
    aiScore: 94,
    verificationLevel: "elite",
    stormReady: true,
    availableImmediately: true,
    completedJobs: 156,
    rating: 4.9,
  },
  {
    id: "w2",
    firstName: "Sarah",
    lastName: "Chen",
    category: "IT / Tech",
    subcategory: "Full Stack Developer",
    hourlyRate: 85,
    yearsExperience: 8,
    city: "Austin",
    state: "Texas",
    certifications: ["AWS Certified", "Google Cloud", "Scrum Master"],
    skills: ["React", "Node.js", "Python", "Database Design"],
    aiScore: 91,
    verificationLevel: "verified",
    stormReady: false,
    availableImmediately: true,
    completedJobs: 43,
    rating: 4.8,
  },
  {
    id: "w3",
    firstName: "Roberto",
    lastName: "Martinez",
    category: "Roofing",
    subcategory: "Master Roofer",
    dailyRate: 450,
    yearsExperience: 15,
    city: "Miami",
    state: "Florida",
    certifications: ["GAF Certified", "OSHA 10", "Lead Safe"],
    skills: ["Shingle Installation", "Metal Roofing", "Tile Roofing", "Storm Repair"],
    aiScore: 88,
    verificationLevel: "verified",
    stormReady: true,
    availableImmediately: false,
    completedJobs: 89,
    rating: 4.7,
  },
  {
    id: "w4",
    firstName: "Emily",
    lastName: "Davis",
    category: "Administrative",
    subcategory: "Bookkeeper",
    hourlyRate: 45,
    yearsExperience: 10,
    city: "Denver",
    state: "Colorado",
    certifications: ["QuickBooks ProAdvisor", "CPA"],
    skills: ["QuickBooks", "Payroll", "Tax Prep", "Financial Reporting"],
    aiScore: 92,
    verificationLevel: "elite",
    stormReady: false,
    availableImmediately: true,
    completedJobs: 67,
    rating: 5.0,
  },
];

const SAMPLE_CREWS = [
  {
    id: "c1",
    crewName: "Storm Strike Tree Crew",
    companyName: "Pinnacle Tree Services",
    category: "Tree & Vegetation",
    crewSize: 5,
    dailyCrewRate: 4800,
    mobilizationFee: 500,
    city: "Savannah",
    state: "Georgia",
    equipmentIncluded: ["55ft Bucket Truck", "14\" Chipper", "Skid Steer"],
    certificationsWithinCrew: ["ISA Certified (3)", "OSHA 30 (All)", "CDL Class B (2)"],
    aiScore: 96,
    verificationLevel: "elite",
    stormReady: true,
    completedJobs: 234,
    rating: 4.9,
  },
  {
    id: "c2",
    crewName: "Rapid Response Roofing",
    companyName: "Elite Roof Solutions",
    category: "Roofing",
    crewSize: 8,
    dailyCrewRate: 5200,
    mobilizationFee: 750,
    city: "Houston",
    state: "Texas",
    equipmentIncluded: ["3 Work Trucks", "Lift Equipment", "Safety Gear"],
    certificationsWithinCrew: ["GAF Master Elite", "OSHA 30 (All)", "Lead Safe Certified"],
    aiScore: 93,
    verificationLevel: "verified",
    stormReady: true,
    completedJobs: 178,
    rating: 4.8,
  },
];

const SAMPLE_EQUIPMENT = [
  {
    id: "e1",
    equipmentType: "Bucket Truck",
    make: "Altec",
    model: "AT37G",
    year: 2021,
    dailyRate: 850,
    weeklyRate: 4500,
    city: "Atlanta",
    state: "Georgia",
    operatorIncluded: false,
    operatorDailyRate: 400,
    deliveryAvailable: true,
    deliveryFee: 250,
    specifications: "55ft working height, 4WD, forestry package",
    aiScore: 95,
    verificationLevel: "verified",
    totalRentals: 89,
    rating: 4.9,
  },
  {
    id: "e2",
    equipmentType: "Skid Steer",
    make: "Bobcat",
    model: "S650",
    year: 2022,
    dailyRate: 350,
    weeklyRate: 1800,
    city: "Jacksonville",
    state: "Florida",
    operatorIncluded: true,
    operatorDailyRate: 300,
    deliveryAvailable: true,
    deliveryFee: 150,
    specifications: "74HP, Grapple bucket included, Tracks available",
    aiScore: 91,
    verificationLevel: "elite",
    totalRentals: 145,
    rating: 4.8,
  },
  {
    id: "e3",
    equipmentType: "Grapple Truck",
    make: "Peterbilt",
    model: "567",
    year: 2020,
    dailyRate: 1200,
    weeklyRate: 6500,
    city: "Tampa",
    state: "Florida",
    operatorIncluded: true,
    operatorDailyRate: 450,
    deliveryAvailable: false,
    specifications: "25-ton capacity, self-loading, CDL required",
    aiScore: 88,
    verificationLevel: "verified",
    totalRentals: 67,
    rating: 4.7,
  },
];

function VerificationBadge({ level }: { level: string }) {
  const config = {
    elite: { color: "bg-green-500", text: "Elite Verified", icon: Shield },
    verified: { color: "bg-blue-500", text: "Verified", icon: CheckCircle2 },
    basic: { color: "bg-yellow-500", text: "Basic", icon: AlertCircle },
    unverified: { color: "bg-gray-500", text: "Unverified", icon: AlertCircle },
  };
  const { color, text, icon: Icon } = config[level as keyof typeof config] || config.unverified;
  
  return (
    <Badge className={`${color} text-white gap-1`}>
      <Icon className="h-3 w-3" />
      {text}
    </Badge>
  );
}

function AIScoreBadge({ score }: { score: number }) {
  const color = score >= 90 ? "text-green-600" : score >= 75 ? "text-blue-600" : "text-yellow-600";
  return (
    <div className={`flex items-center gap-1 ${color} font-semibold`}>
      <TrendingUp className="h-4 w-4" />
      AI Score: {score}
    </div>
  );
}

function WorkerCard({ worker }: { worker: typeof SAMPLE_WORKERS[0] }) {
  return (
    <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-blue-500">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{worker.firstName} {worker.lastName}</CardTitle>
            <CardDescription className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {worker.city}, {worker.state}
            </CardDescription>
          </div>
          <VerificationBadge level={worker.verificationLevel} />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="text-sm">{worker.category}</Badge>
          <span className="text-sm text-muted-foreground">{worker.subcategory}</span>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-green-600" />
            <span className="font-bold text-lg text-green-600">
              ${worker.dailyRate || worker.hourlyRate}/{worker.dailyRate ? "day" : "hr"}
            </span>
          </div>
          <div className="flex items-center gap-1 text-yellow-500">
            <Star className="h-4 w-4 fill-current" />
            <span className="font-semibold">{worker.rating}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-1">
          {worker.certifications.slice(0, 2).map((cert, i) => (
            <Badge key={i} variant="secondary" className="text-xs">{cert}</Badge>
          ))}
          {worker.certifications.length > 2 && (
            <Badge variant="secondary" className="text-xs">+{worker.certifications.length - 2} more</Badge>
          )}
        </div>

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {worker.yearsExperience} years exp
          </span>
          <span className="flex items-center gap-1">
            <Briefcase className="h-3 w-3" />
            {worker.completedJobs} jobs
          </span>
        </div>

        <div className="flex gap-2">
          {worker.stormReady && (
            <Badge className="bg-red-500 text-white text-xs">Storm Ready</Badge>
          )}
          {worker.availableImmediately && (
            <Badge className="bg-green-600 text-white text-xs">Available Now</Badge>
          )}
        </div>

        <AIScoreBadge score={worker.aiScore} />
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button className="flex-1" size="sm">
          <Phone className="h-4 w-4 mr-1" />
          Contact
        </Button>
        <Button variant="outline" size="sm">
          <Calendar className="h-4 w-4 mr-1" />
          Book
        </Button>
      </CardFooter>
    </Card>
  );
}

function CrewCard({ crew }: { crew: typeof SAMPLE_CREWS[0] }) {
  return (
    <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-purple-500">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{crew.crewName}</CardTitle>
            <CardDescription className="flex items-center gap-1">
              <Building2 className="h-3 w-3" />
              {crew.companyName}
            </CardDescription>
          </div>
          <VerificationBadge level={crew.verificationLevel} />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="text-sm">{crew.category}</Badge>
          <span className="flex items-center gap-1 text-sm">
            <Users className="h-4 w-4" />
            {crew.crewSize} Members
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-green-600" />
            <span className="font-bold text-lg text-green-600">
              ${crew.dailyCrewRate.toLocaleString()}/day
            </span>
          </div>
          <div className="flex items-center gap-1 text-yellow-500">
            <Star className="h-4 w-4 fill-current" />
            <span className="font-semibold">{crew.rating}</span>
          </div>
        </div>

        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="h-3 w-3" />
          {crew.city}, {crew.state}
          {crew.mobilizationFee && (
            <span className="ml-2">| Mobilization: ${crew.mobilizationFee}</span>
          )}
        </div>

        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">Equipment Included:</p>
          <div className="flex flex-wrap gap-1">
            {crew.equipmentIncluded.map((eq, i) => (
              <Badge key={i} variant="secondary" className="text-xs">{eq}</Badge>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          {crew.stormReady && (
            <Badge className="bg-red-500 text-white text-xs">Storm Ready</Badge>
          )}
        </div>

        <AIScoreBadge score={crew.aiScore} />
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button className="flex-1" size="sm">
          <Phone className="h-4 w-4 mr-1" />
          Contact Crew
        </Button>
        <Button variant="outline" size="sm">
          <Calendar className="h-4 w-4 mr-1" />
          Request
        </Button>
      </CardFooter>
    </Card>
  );
}

function EquipmentCard({ equipment }: { equipment: typeof SAMPLE_EQUIPMENT[0] }) {
  return (
    <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-orange-500">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{equipment.equipmentType}</CardTitle>
            <CardDescription>
              {equipment.year} {equipment.make} {equipment.model}
            </CardDescription>
          </div>
          <VerificationBadge level={equipment.verificationLevel} />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">{equipment.specifications}</p>
        
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-green-600" />
            <span className="font-bold text-green-600">${equipment.dailyRate}/day</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-blue-600" />
            <span className="text-blue-600">${equipment.weeklyRate}/week</span>
          </div>
        </div>

        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="h-3 w-3" />
          {equipment.city}, {equipment.state}
        </div>

        <div className="flex flex-wrap gap-2">
          {equipment.operatorIncluded && (
            <Badge className="bg-blue-500 text-white text-xs">Operator Available</Badge>
          )}
          {equipment.deliveryAvailable && (
            <Badge variant="outline" className="text-xs">Delivery: ${equipment.deliveryFee}</Badge>
          )}
        </div>

        <div className="flex items-center justify-between">
          <AIScoreBadge score={equipment.aiScore} />
          <div className="flex items-center gap-1 text-yellow-500">
            <Star className="h-4 w-4 fill-current" />
            <span className="font-semibold">{equipment.rating}</span>
            <span className="text-muted-foreground text-xs">({equipment.totalRentals} rentals)</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button className="flex-1" size="sm">
          <Phone className="h-4 w-4 mr-1" />
          Inquire
        </Button>
        <Button variant="outline" size="sm">
          <Calendar className="h-4 w-4 mr-1" />
          Reserve
        </Button>
      </CardFooter>
    </Card>
  );
}

function VoiceGuideButton() {
  const [isPlaying, setIsPlaying] = useState(false);
  
  const playVoiceGuide = async () => {
    setIsPlaying(true);
    try {
      const response = await fetch("/api/tts/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: "Welcome to CrewLink Exchange, the national marketplace connecting skilled workers, professional crews, and equipment owners with opportunities nationwide. Browse for free, list your skills or equipment, and let our AI match you with the perfect opportunities. Whether you're a contractor looking for a storm-ready crew, a skilled worker seeking daily-rate jobs, or an equipment owner wanting to monetize idle assets, CrewLink Exchange removes the friction between talent and opportunity.",
          voice: "Rachel",
          stability: 0.70,
          style: 0.35
        })
      });
      if (response.ok) {
        const audioBlob = await response.blob();
        const audio = new Audio(URL.createObjectURL(audioBlob));
        audio.onended = () => setIsPlaying(false);
        audio.play();
      }
    } catch (err) {
      console.error("Voice guide error:", err);
    } finally {
      setTimeout(() => setIsPlaying(false), 2000);
    }
  };
  
  return (
    <Button 
      onClick={playVoiceGuide} 
      variant="outline" 
      size="sm" 
      className="gap-2 bg-white/10 border-white/20 text-white hover:bg-white/20"
      disabled={isPlaying}
    >
      <Volume2 className={`h-4 w-4 ${isPlaying ? "animate-pulse" : ""}`} />
      {isPlaying ? "Playing..." : "Voice Guide"}
    </Button>
  );
}

export default function CrewLinkExchange() {
  const [activeTab, setActiveTab] = useState("workers");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedState, setSelectedState] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showListingDialog, setShowListingDialog] = useState(false);

  const filteredWorkers = SAMPLE_WORKERS.filter(w => {
    if (selectedState && w.state !== selectedState) return false;
    if (selectedCity && w.city !== selectedCity) return false;
    if (selectedCategory !== "all" && !w.category.toLowerCase().includes(selectedCategory.replace(/-/g, " "))) return false;
    if (searchQuery && !`${w.firstName} ${w.lastName} ${w.category} ${w.skills.join(" ")}`.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const filteredCrews = SAMPLE_CREWS.filter(c => {
    if (selectedState && c.state !== selectedState) return false;
    if (selectedCity && c.city !== selectedCity) return false;
    if (selectedCategory !== "all" && !c.category.toLowerCase().includes(selectedCategory.replace(/-/g, " "))) return false;
    return true;
  });

  const filteredEquipment = SAMPLE_EQUIPMENT.filter(e => {
    if (selectedState && e.state !== selectedState) return false;
    if (selectedCity && e.city !== selectedCity) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 text-white">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
        <div className="relative max-w-7xl mx-auto px-4 py-16 md:py-24">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <Badge className="bg-blue-500/30 text-blue-200 border-blue-400/30 mb-4">
                National Workforce Marketplace
              </Badge>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                CrewLink Exchange™
              </h1>
              <p className="text-xl md:text-2xl text-blue-200 mb-2">
                Where Skills Meet Opportunity — and Equipment Never Holds You Back
              </p>
              <p className="text-blue-300 max-w-2xl">
                Connect with skilled workers, professional crews, and equipment rentals across all industries. 
                Browse for free. List your skills or equipment. Let AI match you with opportunities.
              </p>
            </div>
            <VoiceGuideButton />
          </div>
          <div className="flex flex-wrap gap-4 mt-8">
            <div className="flex items-center gap-2 bg-white/10 rounded-lg px-4 py-2">
              <Users className="h-5 w-5 text-blue-300" />
              <span>Skilled Workers</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 rounded-lg px-4 py-2">
              <HardHat className="h-5 w-5 text-purple-300" />
              <span>Full Crews</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 rounded-lg px-4 py-2">
              <Truck className="h-5 w-5 text-orange-300" />
              <span>Equipment Rentals</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 rounded-lg px-4 py-2">
              <Zap className="h-5 w-5 text-yellow-300" />
              <span>AI Matching</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 mb-8 text-white">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold mb-2">Ready to List Your Skills or Equipment?</h2>
              <p className="text-blue-100">Join thousands of professionals earning more on their terms.</p>
            </div>
            <Dialog open={showListingDialog} onOpenChange={setShowListingDialog}>
              <DialogTrigger asChild>
                <Button size="lg" variant="secondary" className="gap-2">
                  <Plus className="h-5 w-5" />
                  Create Free Listing
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Create Your Listing</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <p className="text-muted-foreground">Choose what you'd like to list:</p>
                  <div className="grid gap-3">
                    <Button variant="outline" className="h-auto py-4 justify-start gap-3" onClick={() => setShowListingDialog(false)}>
                      <Users className="h-6 w-6 text-blue-600" />
                      <div className="text-left">
                        <div className="font-semibold">Individual Skills</div>
                        <div className="text-xs text-muted-foreground">List yourself for daily/hourly work</div>
                      </div>
                    </Button>
                    <Button variant="outline" className="h-auto py-4 justify-start gap-3" onClick={() => setShowListingDialog(false)}>
                      <HardHat className="h-6 w-6 text-purple-600" />
                      <div className="text-left">
                        <div className="font-semibold">Full Crew</div>
                        <div className="text-xs text-muted-foreground">List your team for contract work</div>
                      </div>
                    </Button>
                    <Button variant="outline" className="h-auto py-4 justify-start gap-3" onClick={() => setShowListingDialog(false)}>
                      <Truck className="h-6 w-6 text-orange-600" />
                      <div className="text-left">
                        <div className="font-semibold">Equipment Rental</div>
                        <div className="text-xs text-muted-foreground">Monetize your idle equipment</div>
                      </div>
                    </Button>
                  </div>
                  <p className="text-xs text-center text-muted-foreground">
                    Basic listings are FREE. Premium features start at $19/month.
                  </p>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid md:grid-cols-4 gap-4 mb-8 bg-card rounded-lg p-4 border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search skills, trades, equipment..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map(cat => (
                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedState} onValueChange={(v) => { setSelectedState(v); setSelectedCity(""); }}>
            <SelectTrigger>
              <SelectValue placeholder="Select State" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All States</SelectItem>
              <SelectItem value="Georgia">Georgia</SelectItem>
              <SelectItem value="Florida">Florida</SelectItem>
              <SelectItem value="Texas">Texas</SelectItem>
              <SelectItem value="Colorado">Colorado</SelectItem>
              <SelectItem value="California">California</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedCity} onValueChange={setSelectedCity}>
            <SelectTrigger>
              <SelectValue placeholder="Select City" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Cities</SelectItem>
              {selectedState === "Georgia" && (
                <>
                  <SelectItem value="Atlanta">Atlanta</SelectItem>
                  <SelectItem value="Savannah">Savannah</SelectItem>
                  <SelectItem value="Augusta">Augusta</SelectItem>
                </>
              )}
              {selectedState === "Florida" && (
                <>
                  <SelectItem value="Miami">Miami</SelectItem>
                  <SelectItem value="Tampa">Tampa</SelectItem>
                  <SelectItem value="Jacksonville">Jacksonville</SelectItem>
                </>
              )}
              {selectedState === "Texas" && (
                <>
                  <SelectItem value="Houston">Houston</SelectItem>
                  <SelectItem value="Austin">Austin</SelectItem>
                  <SelectItem value="Dallas">Dallas</SelectItem>
                </>
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200">
            <CardContent className="p-4 text-center">
              <Users className="h-8 w-8 mx-auto mb-2 text-blue-600" />
              <div className="text-2xl font-bold text-blue-700">2,847</div>
              <div className="text-sm text-blue-600">Active Workers</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200">
            <CardContent className="p-4 text-center">
              <HardHat className="h-8 w-8 mx-auto mb-2 text-purple-600" />
              <div className="text-2xl font-bold text-purple-700">428</div>
              <div className="text-sm text-purple-600">Crews Available</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200">
            <CardContent className="p-4 text-center">
              <Truck className="h-8 w-8 mx-auto mb-2 text-orange-600" />
              <div className="text-2xl font-bold text-orange-700">1,256</div>
              <div className="text-sm text-orange-600">Equipment Listed</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200">
            <CardContent className="p-4 text-center">
              <DollarSign className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <div className="text-2xl font-bold text-green-700">$4.2M</div>
              <div className="text-sm text-green-600">Jobs Completed</div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 h-auto">
            <TabsTrigger value="workers" className="py-3 gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Skilled Workers</span>
              <span className="sm:hidden">Workers</span>
              <Badge variant="secondary" className="ml-1">{filteredWorkers.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="crews" className="py-3 gap-2">
              <HardHat className="h-4 w-4" />
              <span className="hidden sm:inline">Full Crews</span>
              <span className="sm:hidden">Crews</span>
              <Badge variant="secondary" className="ml-1">{filteredCrews.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="equipment" className="py-3 gap-2">
              <Truck className="h-4 w-4" />
              <span className="hidden sm:inline">Equipment Rentals</span>
              <span className="sm:hidden">Equipment</span>
              <Badge variant="secondary" className="ml-1">{filteredEquipment.length}</Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="workers">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredWorkers.map(worker => (
                <WorkerCard key={worker.id} worker={worker} />
              ))}
            </div>
            {filteredWorkers.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No workers found matching your criteria.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="crews">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCrews.map(crew => (
                <CrewCard key={crew.id} crew={crew} />
              ))}
            </div>
            {filteredCrews.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <HardHat className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No crews found matching your criteria.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="equipment">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEquipment.map(eq => (
                <EquipmentCard key={eq.id} equipment={eq} />
              ))}
            </div>
            {filteredEquipment.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Truck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No equipment found matching your criteria.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="mt-12 bg-gradient-to-r from-slate-900 to-slate-800 rounded-xl p-8 text-white">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-500/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">AI-Verified Listings</h3>
              <p className="text-slate-300 text-sm">Our AI scores every listing based on experience, certifications, and performance history.</p>
            </div>
            <div className="text-center">
              <div className="bg-green-500/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="h-8 w-8 text-green-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Instant Matching</h3>
              <p className="text-slate-300 text-sm">AI matches talent with demand. Get notified of opportunities that match your skills.</p>
            </div>
            <div className="text-center">
              <div className="bg-purple-500/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="h-8 w-8 text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Automated Outreach</h3>
              <p className="text-slate-300 text-sm">Our AI agent sends texts, emails, and calls to connect you with opportunities.</p>
            </div>
          </div>
        </div>

        <div className="mt-8 grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-yellow-500" />
                Pricing Plans
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b">
                  <span>Individual Worker Listing</span>
                  <span className="font-semibold">$19-29/mo</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span>Crew Listing</span>
                  <span className="font-semibold">$49-99/mo</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span>Equipment Listing</span>
                  <span className="font-semibold">$29-79/mo</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span>Transaction Fee</span>
                  <span className="font-semibold">3-7%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-500" />
                Platform Protection
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                  <span>Marketplace connects parties only - not an employer</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                  <span>All contractors are independent entities</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                  <span>Users verify licensing and insurance independently</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                  <span>Optional escrow protection for payments</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      <ModuleAIAssistant moduleContext="CrewLink Exchange workforce and equipment marketplace" />
    </div>
  );
}
