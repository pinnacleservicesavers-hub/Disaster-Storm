import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Users, Star, MapPin, ChevronRight, Volume2, VolumeX,
  Shield, Clock, CheckCircle, Award, Phone, MessageSquare,
  Calendar, Briefcase, ThumbsUp, Filter, Search, ArrowRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import TopNav from '@/components/TopNav';
import ModuleAIAssistant from '@/components/ModuleAIAssistant';

const MOCK_CONTRACTORS = [
  {
    id: 1,
    name: 'Oak City Tree Service',
    owner: 'Mike Johnson',
    avatar: null,
    rating: 4.9,
    reviews: 156,
    distance: 3.2,
    verified: true,
    licensed: true,
    insured: true,
    matchScore: 98,
    completedJobs: 342,
    responseTime: '< 1 hour',
    specialty: 'Tree Removal & Trimming',
    badges: ['Fair Pricing', 'Reliable', 'Top Rated']
  },
  {
    id: 2,
    name: 'Texas Pro Arborists',
    owner: 'Sarah Williams',
    avatar: null,
    rating: 4.8,
    reviews: 89,
    distance: 5.7,
    verified: true,
    licensed: true,
    insured: true,
    matchScore: 94,
    completedJobs: 198,
    responseTime: '< 2 hours',
    specialty: 'Certified Arborist Services',
    badges: ['Premium Quality', 'Fast Response']
  },
  {
    id: 3,
    name: 'Green Thumb Landscaping',
    owner: 'Carlos Martinez',
    avatar: null,
    rating: 4.7,
    reviews: 234,
    distance: 8.1,
    verified: true,
    licensed: true,
    insured: true,
    matchScore: 91,
    completedJobs: 567,
    responseTime: '< 3 hours',
    specialty: 'Full Service Landscaping',
    badges: ['Budget Friendly', 'Experienced']
  }
];

export default function ContractorMatch() {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContractor, setSelectedContractor] = useState<number | null>(null);

  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      if (availableVoices.length > 0) {
        setVoices(availableVoices);
      }
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => { window.speechSynthesis.cancel(); };
  }, []);

  useEffect(() => {
    if (voices.length > 0) {
      setTimeout(() => {
        speakGuidance("Welcome to ContractorMatch! I'm Evelyn. I've found 3 verified contractors near you that match your project needs. Each contractor is verified with licensing, insurance, and customer reviews. Let me know if you'd like more details about any of them.");
      }, 500);
    }
  }, [voices]);

  const getBestFemaleVoice = (voiceList: SpeechSynthesisVoice[]) => {
    const preferredVoices = ['Samantha', 'Zira', 'Jenny', 'Google US English Female', 'Microsoft Zira'];
    for (const preferred of preferredVoices) {
      const found = voiceList.find(v => v.name.includes(preferred));
      if (found) return found;
    }
    return voiceList.find(v => v.lang.startsWith('en')) || voiceList[0];
  };

  const speakGuidance = (text: string) => {
    if (voices.length === 0) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = getBestFemaleVoice(voices);
    utterance.pitch = 1.0;
    utterance.rate = 0.88;
    utterance.onstart = () => setIsVoiceActive(true);
    utterance.onend = () => setIsVoiceActive(false);
    window.speechSynthesis.speak(utterance);
  };

  const handleContractorSelect = (contractor: typeof MOCK_CONTRACTORS[0]) => {
    setSelectedContractor(contractor.id);
    speakGuidance(`${contractor.name} has a ${contractor.rating} star rating with ${contractor.reviews} reviews. They've completed ${contractor.completedJobs} jobs and typically respond within ${contractor.responseTime}. Their AI match score for your project is ${contractor.matchScore}%.`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-slate-950 dark:to-slate-900">
      <TopNav />

      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-2 text-blue-200 text-sm mb-2">
            <Link to="/workhub" className="hover:text-white">WorkHub</Link>
            <ChevronRight className="w-4 h-4" />
            <span>ContractorMatch</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">ContractorMatch</h1>
              <p className="text-blue-100 text-lg">Perfect Pairing - AI matches you with verified pros</p>
            </div>
            <Button
              variant="ghost"
              size="lg"
              onClick={() => isVoiceActive ? window.speechSynthesis.cancel() : speakGuidance("I'm Evelyn. ContractorMatch uses AI to find the perfect contractor for your project based on trade expertise, location, ratings, and availability.")}
              className="text-white hover:bg-white/10"
            >
              {isVoiceActive ? <Volume2 className="w-6 h-6 animate-pulse" /> : <VolumeX className="w-6 h-6" />}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Search and Filter Bar */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              placeholder="Search contractors by name or specialty..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search"
            />
          </div>
          <Button variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
        </div>

        {/* Match Results */}
        <div className="grid gap-4">
          {MOCK_CONTRACTORS.map((contractor, idx) => (
            <motion.div
              key={contractor.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card 
                className={`hover:shadow-lg transition-all cursor-pointer ${
                  selectedContractor === contractor.id ? 'ring-2 ring-blue-500' : ''
                } ${idx === 0 ? 'border-2 border-blue-300 bg-blue-50/50' : ''}`}
                onClick={() => handleContractorSelect(contractor)}
                data-testid={`contractor-${contractor.id}`}
              >
                {idx === 0 && (
                  <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-center py-2 text-sm font-medium">
                    ⭐ Best Match for Your Project
                  </div>
                )}
                <CardContent className="py-6">
                  <div className="flex items-start gap-6">
                    <Avatar className="w-20 h-20">
                      <AvatarFallback className="bg-blue-100 text-blue-700 text-xl">
                        {contractor.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-xl font-bold">{contractor.name}</h3>
                            {contractor.verified && (
                              <Badge className="bg-green-100 text-green-700">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Verified
                              </Badge>
                            )}
                          </div>
                          <p className="text-slate-500">{contractor.specialty}</p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-lg font-bold text-blue-600">
                            <span>{contractor.matchScore}%</span>
                            <span className="text-sm font-normal text-slate-500">match</span>
                          </div>
                          <Progress value={contractor.matchScore} className="w-24 h-2 mt-1" />
                        </div>
                      </div>

                      <div className="flex items-center gap-6 mt-4">
                        <div className="flex items-center gap-1">
                          <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                          <span className="font-bold">{contractor.rating}</span>
                          <span className="text-slate-500">({contractor.reviews})</span>
                        </div>
                        <div className="flex items-center gap-1 text-slate-600">
                          <MapPin className="w-4 h-4" />
                          {contractor.distance} mi away
                        </div>
                        <div className="flex items-center gap-1 text-slate-600">
                          <Clock className="w-4 h-4" />
                          Responds {contractor.responseTime}
                        </div>
                        <div className="flex items-center gap-1 text-slate-600">
                          <Briefcase className="w-4 h-4" />
                          {contractor.completedJobs} jobs
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mt-4">
                        {contractor.badges.map((badge) => (
                          <Badge key={badge} variant="secondary">{badge}</Badge>
                        ))}
                        {contractor.licensed && <Badge variant="outline" className="text-green-600"><Shield className="w-3 h-3 mr-1" />Licensed</Badge>}
                        {contractor.insured && <Badge variant="outline" className="text-blue-600"><Shield className="w-3 h-3 mr-1" />Insured</Badge>}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Button className="bg-blue-600 hover:bg-blue-700" data-testid={`button-contact-${contractor.id}`}>
                        <Phone className="w-4 h-4 mr-2" />
                        Contact
                      </Button>
                      <Button variant="outline" data-testid={`button-request-${contractor.id}`}>
                        <Calendar className="w-4 h-4 mr-2" />
                        Request Estimate
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <Card className="mt-8 bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200">
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center">
                  <Users className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Can't find the right match?</h3>
                  <p className="text-slate-600">Let AI search our extended network of verified contractors</p>
                </div>
              </div>
              <Button className="bg-blue-600 hover:bg-blue-700">
                Expand Search
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <ModuleAIAssistant 
        moduleName="ContractorMatch"
        moduleContext="ContractorMatch uses AI to find and match customers with verified contractors. It shows match scores, ratings, reviews, response times, and verification status. Help users understand contractor profiles and make informed decisions about who to hire."
      />
    </div>
  );
}
