import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
// Using custom modal implementation instead of Dialog component
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useQuery, useMutation } from '@tanstack/react-query';
import { FileText, Plus, Search, Settings, DollarSign, Clock, CheckCircle, AlertTriangle, TrendingUp, Eye, Volume2, VolumeX, ArrowLeft, UserPlus, FileSearch, Mic, Sparkles, Wand2, Bot } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { DashboardSection } from '@/components/DashboardSection';
import { FadeIn, PulseAlert, StaggerContainer, StaggerItem, HoverLift, CountUp } from '@/components/ui/animations';
import { XactimateComparables } from '@/components/XactimateComparables';
import { LegalDisclaimer } from '@/components/LegalDisclaimer';
import { StateCitySelector, useStateCitySelector } from '@/components/StateCitySelector';
import ModuleAIAssistant from '@/components/ModuleAIAssistant';

interface Claim {
  id: string;
  claimNumber: string;
  customerName: string;
  damageType: string;
  status: 'open' | 'pending' | 'approved' | 'closed';
  value: number;
  adjuster: string;
  dateSubmitted: string;
  lastUpdate: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  progress: number;
}

export default function Claims() {
  const { selectedState, setSelectedState, selectedCity, setSelectedCity, availableCities } = useStateCitySelector('Florida', 'Miami');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [isVoiceGuideActive, setIsVoiceGuideActive] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  
  // Add New Claim Modal States
  const [isAddClaimModalOpen, setIsAddClaimModalOpen] = useState(false);
  const [claimMode, setClaimMode] = useState<'select' | 'manual' | 'search'>('select');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  // AI Writing Assistant States
  const [isListening, setIsListening] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [recognitionInstance, setRecognitionInstance] = useState<any>(null);

  // New Claim Form Data
  const [newClaim, setNewClaim] = useState({
    claimNumber: '',
    insuranceCompany: '',
    policyNumber: '',
    claimantName: '',
    propertyAddress: '',
    damageType: '',
    incidentDate: '',
    estimatedAmount: '',
    state: '',
    notes: ''
  });

  // Mock claims data with React Query
  const { data: claims = [], isLoading } = useQuery({
    queryKey: ['claims', selectedStatus],
    queryFn: async (): Promise<Claim[]> => {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const allClaims = [
        { id: '1', claimNumber: 'CLM-2024-001', customerName: 'Sarah Johnson', damageType: 'Storm Damage', status: 'open' as const, value: 25000, adjuster: 'Mike Chen', dateSubmitted: '2024-01-15', lastUpdate: '2 hours ago', priority: 'high' as const, progress: 75 },
        { id: '2', claimNumber: 'CLM-2024-002', customerName: 'Robert Smith', damageType: 'Water Damage', status: 'pending' as const, value: 18500, adjuster: 'Lisa Wang', dateSubmitted: '2024-01-14', lastUpdate: '1 day ago', priority: 'medium' as const, progress: 45 },
        { id: '3', claimNumber: 'CLM-2024-003', customerName: 'Maria Garcia', damageType: 'Wind Damage', status: 'approved' as const, value: 32000, adjuster: 'John Davis', dateSubmitted: '2024-01-13', lastUpdate: '3 hours ago', priority: 'urgent' as const, progress: 100 },
        { id: '4', claimNumber: 'CLM-2024-004', customerName: 'David Wilson', damageType: 'Hail Damage', status: 'closed' as const, value: 12000, adjuster: 'Emma Lee', dateSubmitted: '2024-01-12', lastUpdate: '5 days ago', priority: 'low' as const, progress: 100 },
        { id: '5', claimNumber: 'CLM-2024-005', customerName: 'Jennifer Brown', damageType: 'Tree Damage', status: 'open' as const, value: 45000, adjuster: 'Alex Rivera', dateSubmitted: '2024-01-11', lastUpdate: '1 hour ago', priority: 'urgent' as const, progress: 30 },
      ];

      return selectedStatus === 'all' ? allClaims : allClaims.filter(claim => claim.status === selectedStatus);
    },
    refetchInterval: 30000,
  });

  // Create Claim Mutation
  const createClaimMutation = useMutation({
    mutationFn: async (claimData: any) => {
      return apiRequest('/api/claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(claimData)
      });
    },
    onSuccess: () => {
      toast({
        title: "Claim Created Successfully",
        description: "New claim has been added to the system."
      });
      setIsAddClaimModalOpen(false);
      resetClaimForm();
      // Refetch claims data
      // queryClient.invalidateQueries({ queryKey: ['claims'] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Create Claim",
        description: error?.message || "Please try again.",
        variant: "destructive"
      });
    }
  });

  // Form Handlers
  const handleClaimSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await createClaimMutation.mutateAsync(newClaim);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCustomerSearch = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Search Required",
        description: "Please enter customer name, phone, or claim number to search.",
        variant: "destructive"
      });
      return;
    }
    
    // Mock customer search - in real app, this would call an API
    toast({
      title: "Customer Search",
      description: `Searching for: ${searchQuery}`,
    });
    
    // Simulate finding customer and pre-filling form
    setNewClaim({
      ...newClaim,
      claimantName: searchQuery,
      insuranceCompany: 'State Farm',
      policyNumber: 'POL-' + Math.random().toString(36).substr(2, 9)
    });
    setClaimMode('manual');
  };

  const resetClaimForm = () => {
    // Stop voice recognition if active
    if (recognitionInstance) {
      recognitionInstance.stop();
      setRecognitionInstance(null);
    }
    
    setNewClaim({
      claimNumber: '',
      insuranceCompany: '',
      policyNumber: '',
      claimantName: '',
      propertyAddress: '',
      damageType: '',
      incidentDate: '',
      estimatedAmount: '',
      state: '',
      notes: ''
    });
    setClaimMode('select');
    setSearchQuery('');
    setAiSuggestion('');
    setShowAiPanel(false);
    setIsListening(false);
    setIsEnhancing(false);
    setIsSuggesting(false);
  };

  // Voice Input (Speech-to-Text)
  const startVoiceInput = () => {
    // Stop existing recognition if running
    if (recognitionInstance) {
      recognitionInstance.stop();
      setRecognitionInstance(null);
      setIsListening(false);
      return;
    }

    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast({
        title: "Voice Input Not Supported",
        description: "Your browser doesn't support voice input. Please use Chrome or Edge.",
        variant: "destructive"
      });
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      toast({
        title: "Listening...",
        description: "Speak now to add to your notes"
      });
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setNewClaim(prev => ({...prev, notes: prev.notes + (prev.notes ? ' ' : '') + transcript}));
      toast({
        title: "Voice Input Captured",
        description: `Added: "${transcript}"`
      });
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      toast({
        title: "Voice Input Error",
        description: "Could not capture voice input. Please try again.",
        variant: "destructive"
      });
      setIsListening(false);
      setRecognitionInstance(null);
    };

    recognition.onend = () => {
      setIsListening(false);
      setRecognitionInstance(null);
    };

    setRecognitionInstance(recognition);
    recognition.start();
  };

  // AI Text Enhancement
  const enhanceWithAI = async () => {
    if (!newClaim.notes.trim()) {
      toast({
        title: "No Text to Enhance",
        description: "Please add some notes first.",
        variant: "destructive"
      });
      return;
    }

    setIsEnhancing(true);
    try {
      const response = await apiRequest('/api/grok', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `You are a professional insurance claims specialist. Improve and professionalize the following claim notes while keeping all key information. Make it clear, concise, and properly formatted:\n\n"${newClaim.notes}"\n\nReturn only the improved version, no explanations.`
        })
      });

      if (response.answer) {
        setNewClaim(prev => ({...prev, notes: response.answer}));
        toast({
          title: "Notes Enhanced!",
          description: "Your claim notes have been professionally improved by AI."
        });
      }
    } catch (error) {
      console.error('AI enhancement error:', error);
      toast({
        title: "Enhancement Failed",
        description: "Could not enhance notes. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsEnhancing(false);
    }
  };

  // AI Writing Suggestions
  const getAiSuggestion = async () => {
    setIsSuggesting(true);
    setShowAiPanel(true);
    try {
      const claimContext = `
Claim Number: ${newClaim.claimNumber || 'N/A'}
Insurance Company: ${newClaim.insuranceCompany || 'N/A'}
Claimant: ${newClaim.claimantName || 'N/A'}
Property Address: ${newClaim.propertyAddress || 'N/A'}
Damage Type: ${newClaim.damageType || 'N/A'}
Current Notes: ${newClaim.notes || 'None yet'}
      `.trim();

      const response = await apiRequest('/api/grok', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `You are an insurance claims specialist. Based on this claim information, suggest professional notes to add:\n\n${claimContext}\n\nProvide 2-3 concise, professional suggestions for claim notes. Be specific and helpful.`
        })
      });

      if (response.answer) {
        setAiSuggestion(response.answer);
      }
    } catch (error) {
      console.error('AI suggestion error:', error);
      toast({
        title: "Suggestion Failed",
        description: "Could not generate AI suggestions. Please try again.",
        variant: "destructive"
      });
      setShowAiPanel(false);
    } finally {
      setIsSuggesting(false);
    }
  };

  // Initialize voice loading
  useEffect(() => {
    const loadVoices = () => {
      setVoices(window.speechSynthesis.getVoices());
    };
    
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open': return { text: 'OPEN', variant: 'default' as const };
      case 'pending': return { text: 'PENDING', variant: 'secondary' as const };
      case 'approved': return { text: 'APPROVED', variant: 'default' as const };
      case 'closed': return { text: 'CLOSED', variant: 'outline' as const };
      default: return { text: 'UNKNOWN', variant: 'outline' as const };
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-[hsl(0,84%,60%)]';
      case 'high': return 'text-[hsl(25,95%,53%)]';
      case 'medium': return 'text-[hsl(217,71%,53%)]';
      case 'low': return 'text-[hsl(142,76%,36%)]';
      default: return 'text-gray-600';
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 90) return 'bg-[hsl(142,76%,36%)]';
    if (progress >= 70) return 'bg-[hsl(217,71%,53%)]';
    if (progress >= 50) return 'bg-[hsl(25,95%,53%)]';
    return 'bg-[hsl(0,84%,60%)]';
  };

  // Calculate metrics (must be before voice function that uses them)
  const openClaims = claims.filter(c => c.status === 'open').length;
  const pendingClaims = claims.filter(c => c.status === 'pending').length;
  const approvedClaims = claims.filter(c => c.status === 'approved').length;
  const totalValue = claims.reduce((sum, c) => sum + c.value, 0);
  const avgProcessingTime = 4.2;

  // Audio reference for ElevenLabs playback
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Voice Guide Function - Uses ElevenLabs Rachel voice
  const startVoiceGuide = async () => {
    if (isVoiceGuideActive) {
      // Stop current playback
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setIsVoiceGuideActive(false);
      return;
    }

    setIsVoiceGuideActive(true);
    
    const voiceContent = `Welcome to Claims Central. I'm Rachel, your claims management assistant.

You're viewing ${claims.length} insurance claims with ${openClaims} currently open and ${pendingClaims} pending review.

The total claim value this quarter is ${(totalValue / 1000000).toFixed(1)} million dollars with a 94% approval rate.

Your claims pipeline shows four stages: Submitted, Under Review, Approved, and Paid Out. Each claim displays the claim number, customer name, damage type, current status, and assigned adjuster.

Priority levels are color-coded: red for urgent, orange for high priority, blue for medium, and green for low priority.

Need help with a specific claim? Just ask me anything about claim processing, adjuster assignments, or payment status.`;

    try {
      // Call ElevenLabs Rachel voice API - energetic female voice
      const response = await fetch('/api/voice-ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: voiceContent,
          provider: 'elevenlabs',
          voiceId: '21m00Tcm4TlvDq8ikWAM' // Rachel - energetic female voice
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.audioUrl) {
          // Play ElevenLabs audio
          audioRef.current = new Audio(data.audioUrl);
          audioRef.current.onended = () => {
            setIsVoiceGuideActive(false);
            audioRef.current = null;
          };
          audioRef.current.onerror = () => {
            console.warn('Audio playback failed, falling back to browser speech');
            fallbackToSpeechSynthesis(voiceContent);
          };
          await audioRef.current.play();
        } else if (data.text) {
          // Fallback to browser speech if no audio URL
          fallbackToSpeechSynthesis(voiceContent);
        }
      } else {
        // API failed, use browser speech
        fallbackToSpeechSynthesis(voiceContent);
      }
    } catch (error) {
      console.warn('ElevenLabs API error, using fallback:', error);
      fallbackToSpeechSynthesis(voiceContent);
    }
  };

  // Fallback function for browser speech synthesis
  const fallbackToSpeechSynthesis = (text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setIsVoiceGuideActive(false);
      return;
    }

    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    utterance.volume = 0.8;
    
    if (voices.length > 0) {
      const femaleVoice = voices.find(voice => 
        voice.lang.includes('en') && 
        (voice.name.toLowerCase().includes('female') || 
         voice.name.toLowerCase().includes('samantha') ||
         voice.name.toLowerCase().includes('google uk'))
      );
      utterance.voice = femaleVoice || voices.find(voice => voice.lang.includes('en')) || voices[0];
    }
    
    utterance.onend = () => setIsVoiceGuideActive(false);
    utterance.onerror = () => setIsVoiceGuideActive(false);
    
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(217,91%,15%)] via-[hsl(217,91%,25%)] to-[hsl(215,25%,25%)] dark:from-[hsl(217,91%,10%)] dark:via-[hsl(217,91%,20%)] dark:to-[hsl(215,25%,20%)]">
      <div className="container mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/">
            <motion.button
              whileHover={{ scale: 1.05, x: -2 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
              data-testid="button-back-to-hub"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Back to Hub</span>
            </motion.button>
          </Link>
        <StateCitySelector
          selectedState={selectedState}
          selectedCity={selectedCity}
          availableCities={availableCities}
          onStateChange={setSelectedState}
          onCityChange={setSelectedCity}
          variant="default"
          showAllStates={true}
        />
      </div>
      
      {/* Add New Claim Modal */}
      {isAddClaimModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" 
            onClick={() => {
              setIsAddClaimModalOpen(false);
              resetClaimForm();
            }}
          />
          
          {/* Modal Content */}
          <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100" data-testid="modal-title-add-claim">
                Add New Claim
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Choose how you'd like to add a new claim to the system.
              </p>
            </div>

          {claimMode === 'select' && (
            <div className="grid grid-cols-1 gap-4 py-4">
              <Button
                onClick={() => setClaimMode('manual')}
                className="h-20 flex-col space-y-2"
                variant="outline"
                data-testid="button-manual-claim"
              >
                <UserPlus className="h-8 w-8" />
                <div className="text-center">
                  <div className="font-semibold">Manual Entry</div>
                  <div className="text-sm text-muted-foreground">Enter claim details manually</div>
                </div>
              </Button>
              
              <Button
                onClick={() => setClaimMode('search')}
                className="h-20 flex-col space-y-2"
                variant="outline"
                data-testid="button-search-customer"
              >
                <FileSearch className="h-8 w-8" />
                <div className="text-center">
                  <div className="font-semibold">Search Customer</div>
                  <div className="text-sm text-muted-foreground">Find existing customer to add claim</div>
                </div>
              </Button>
            </div>
          )}

          {claimMode === 'search' && (
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="search-customer">Search for Customer</Label>
                <div className="flex space-x-2 mt-2">
                  <Input
                    id="search-customer"
                    placeholder="Enter customer name, phone, or existing claim number..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    data-testid="input-customer-search"
                  />
                  <Button onClick={handleCustomerSearch} data-testid="button-search-execute">
                    Search
                  </Button>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => setClaimMode('select')}
                  data-testid="button-back-to-select"
                >
                  Back
                </Button>
              </div>
            </div>
          )}

          {claimMode === 'manual' && (
            <form onSubmit={handleClaimSubmit} className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="claim-number">Claim Number</Label>
                  <Input
                    id="claim-number"
                    value={newClaim.claimNumber}
                    onChange={(e) => setNewClaim({...newClaim, claimNumber: e.target.value})}
                    placeholder="CLM-2024-###"
                    required
                    data-testid="input-claim-number"
                  />
                </div>
                <div>
                  <Label htmlFor="insurance-company">Insurance Company</Label>
                  <Select
                    value={newClaim.insuranceCompany}
                    onValueChange={(value) => setNewClaim({...newClaim, insuranceCompany: value})}
                  >
                    <SelectTrigger data-testid="select-insurance-company">
                      <SelectValue placeholder="Select insurance company" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="State Farm">State Farm</SelectItem>
                      <SelectItem value="Allstate">Allstate</SelectItem>
                      <SelectItem value="GEICO">GEICO</SelectItem>
                      <SelectItem value="Progressive">Progressive</SelectItem>
                      <SelectItem value="USAA">USAA</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="policy-number">Policy Number</Label>
                  <Input
                    id="policy-number"
                    value={newClaim.policyNumber}
                    onChange={(e) => setNewClaim({...newClaim, policyNumber: e.target.value})}
                    placeholder="Policy number"
                    data-testid="input-policy-number"
                  />
                </div>
                <div>
                  <Label htmlFor="claimant-name">Claimant Name</Label>
                  <Input
                    id="claimant-name"
                    value={newClaim.claimantName}
                    onChange={(e) => setNewClaim({...newClaim, claimantName: e.target.value})}
                    placeholder="Customer name"
                    required
                    data-testid="input-claimant-name"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="property-address">Property Address</Label>
                <Input
                  id="property-address"
                  value={newClaim.propertyAddress}
                  onChange={(e) => setNewClaim({...newClaim, propertyAddress: e.target.value})}
                  placeholder="Full property address"
                  required
                  data-testid="input-property-address"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="damage-type">Damage Type</Label>
                  <Select
                    value={newClaim.damageType}
                    onValueChange={(value) => setNewClaim({...newClaim, damageType: value})}
                  >
                    <SelectTrigger data-testid="select-damage-type">
                      <SelectValue placeholder="Select damage type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="storm">Storm Damage</SelectItem>
                      <SelectItem value="water">Water Damage</SelectItem>
                      <SelectItem value="wind">Wind Damage</SelectItem>
                      <SelectItem value="hail">Hail Damage</SelectItem>
                      <SelectItem value="tree">Tree Damage</SelectItem>
                      <SelectItem value="fire">Fire Damage</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="incident-date">Incident Date</Label>
                  <Input
                    id="incident-date"
                    type="date"
                    value={newClaim.incidentDate}
                    onChange={(e) => setNewClaim({...newClaim, incidentDate: e.target.value})}
                    required
                    data-testid="input-incident-date"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="estimated-amount">Estimated Amount</Label>
                  <Input
                    id="estimated-amount"
                    type="number"
                    step="0.01"
                    value={newClaim.estimatedAmount}
                    onChange={(e) => setNewClaim({...newClaim, estimatedAmount: e.target.value})}
                    placeholder="0.00"
                    data-testid="input-estimated-amount"
                  />
                </div>
                <div>
                  <Label htmlFor="state">State</Label>
                  <Select
                    value={newClaim.state}
                    onValueChange={(value) => setNewClaim({...newClaim, state: value})}
                  >
                    <SelectTrigger data-testid="select-state">
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FL">Florida</SelectItem>
                      <SelectItem value="TX">Texas</SelectItem>
                      <SelectItem value="GA">Georgia</SelectItem>
                      <SelectItem value="AL">Alabama</SelectItem>
                      <SelectItem value="NC">North Carolina</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="notes">Notes</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={isListening ? "destructive" : "outline"}
                      onClick={startVoiceInput}
                      className="flex items-center gap-1"
                      data-testid="button-voice-input"
                      title={isListening ? "Stop Listening" : "Voice Input"}
                    >
                      <Mic className={`h-4 w-4 ${isListening ? 'animate-pulse' : ''}`} />
                      {isListening ? 'Stop' : 'Voice'}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={enhanceWithAI}
                      disabled={isEnhancing || !newClaim.notes.trim()}
                      className="flex items-center gap-1"
                      data-testid="button-enhance-ai"
                      title="AI Auto-Correct & Enhance"
                    >
                      <Wand2 className="h-4 w-4" />
                      {isEnhancing ? 'Processing...' : 'Enhance'}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={getAiSuggestion}
                      disabled={isSuggesting}
                      className="flex items-center gap-1"
                      data-testid="button-ai-suggest"
                      title="AI Writing Suggestions"
                    >
                      <Bot className="h-4 w-4" />
                      {isSuggesting ? 'Loading...' : 'AI Suggest'}
                    </Button>
                  </div>
                </div>
                <Textarea
                  id="notes"
                  value={newClaim.notes}
                  onChange={(e) => setNewClaim({...newClaim, notes: e.target.value})}
                  placeholder="Additional notes about the claim... (Use Voice, Enhance, or AI Suggest buttons for assistance)"
                  rows={6}
                  data-testid="textarea-notes"
                />
                {showAiPanel && aiSuggestion && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        <span className="text-sm font-semibold text-blue-900 dark:text-blue-100">AI Suggestions</span>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => setShowAiPanel(false)}
                        className="h-6 w-6 p-0"
                      >
                        ×
                      </Button>
                    </div>
                    <p className="text-sm text-blue-800 dark:text-blue-200 whitespace-pre-wrap">{aiSuggestion}</p>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setNewClaim({...newClaim, notes: newClaim.notes + (newClaim.notes ? '\n\n' : '') + aiSuggestion});
                        setShowAiPanel(false);
                        toast({ title: "Added AI Suggestions", description: "Suggestions have been added to your notes." });
                      }}
                      className="mt-2"
                      data-testid="button-apply-suggestion"
                    >
                      Apply to Notes
                    </Button>
                  </motion.div>
                )}
              </div>

              <div className="flex justify-end space-x-2 mt-6">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setClaimMode('select')}
                  data-testid="button-back-to-select-from-form"
                >
                  Back
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting || createClaimMutation.isPending}
                  data-testid="button-submit-claim"
                >
                  {isSubmitting ? 'Creating...' : 'Create Claim'}
                </Button>
              </div>
            </form>
          )}

          {claimMode === 'select' && (
              <div className="flex justify-end mt-6">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsAddClaimModalOpen(false);
                    resetClaimForm();
                  }}
                  data-testid="button-cancel-add-claim"
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

    <DashboardSection
      title="Claims Management"
      description="Process insurance claims, track settlements, and manage documentation with real-time status updates"
      icon={FileText}
      badge={{ text: `${claims.length} ACTIVE`, variant: 'default' }}
      kpis={[
        { label: 'Open Claims', value: 1247, change: '+87 this week', color: 'blue', testId: 'text-open-claims' },
        { label: 'Pending Review', value: pendingClaims, change: 'Awaiting adjuster', color: 'amber', testId: 'text-pending-claims' },
        { label: 'Approval Rate', value: 94, change: 'Last 30 days', color: 'green', suffix: '%', testId: 'text-approval-rate' },
        { label: 'Total Value', value: 12.4, change: 'This quarter', color: 'default', suffix: 'M', testId: 'text-claims-value' }
      ]}
      actions={[
        { 
          icon: Plus, 
          label: 'New Claim', 
          variant: 'default', 
          testId: 'button-new-claim',
          onClick: () => setIsAddClaimModalOpen(true)
        },
        { icon: Search, label: 'Search Claims', variant: 'outline', testId: 'button-search-claims' },
        { icon: TrendingUp, label: 'Analytics', variant: 'outline', testId: 'button-claims-analytics' },
        { 
          icon: isVoiceGuideActive ? VolumeX : Volume2, 
          label: isVoiceGuideActive ? 'Stop Guide' : 'Voice Guide', 
          variant: 'outline', 
          testId: 'button-voice-guide',
          onClick: startVoiceGuide,
          'aria-label': 'Voice guide for Claims Central',
          'aria-pressed': isVoiceGuideActive
        }
      ]}
      testId="claims-section"
    >
      {/* Legal Disclaimers */}
      <div className="mb-6 space-y-3">
        <LegalDisclaimer type="attorney" compact />
        <LegalDisclaimer type="insurance" compact />
        <LegalDisclaimer type="ai" compact />
      </div>

      {/* Real-time Processing Pipeline */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4 flex items-center">
          <Clock className="h-5 w-5 text-[hsl(217,71%,53%)] mr-2" />
          Claims Processing Pipeline
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="ml-2 h-2 w-2 bg-[hsl(217,71%,53%)] rounded-full"
          />
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { stage: 'Submitted', count: 47, color: 'bg-[hsl(217,71%,53%)]', percentage: 100 },
            { stage: 'Under Review', count: 32, color: 'bg-[hsl(25,95%,53%)]', percentage: 68 },
            { stage: 'Approved', count: 28, color: 'bg-[hsl(142,76%,36%)]', percentage: 60 },
            { stage: 'Paid Out', count: 23, color: 'bg-purple-500', percentage: 49 },
          ].map((stage, index) => (
            <HoverLift key={stage.stage}>
              <Card className="relative overflow-hidden">
                <CardContent className="p-4">
                  <div className="text-center">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">{stage.stage}</h4>
                    <div className="relative w-16 h-16 mx-auto mb-3">
                      <svg className="w-16 h-16 transform -rotate-90">
                        <circle
                          cx="32"
                          cy="32"
                          r="28"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="transparent"
                          className="text-gray-200 dark:text-gray-700"
                        />
                        <motion.circle
                          cx="32"
                          cy="32"
                          r="28"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="transparent"
                          strokeLinecap="round"
                          strokeDasharray={`${2 * Math.PI * 28}`}
                          initial={{ strokeDashoffset: 2 * Math.PI * 28 }}
                          animate={{ strokeDashoffset: 2 * Math.PI * 28 * (1 - stage.percentage / 100) }}
                          transition={{ duration: 1.5, ease: "easeOut", delay: index * 0.3 }}
                          className={stage.color.replace('bg-', 'text-')}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <CountUp end={stage.count} className="text-lg font-bold text-gray-700 dark:text-gray-300" />
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {stage.percentage}% conversion
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </HoverLift>
          ))}
        </div>
      </div>

      {/* Status Filter */}
      <div className="flex space-x-4 mb-6">
        {[
          { key: 'all', label: 'All Claims' },
          { key: 'open', label: 'Open' },
          { key: 'pending', label: 'Pending' },
          { key: 'approved', label: 'Approved' },
          { key: 'closed', label: 'Closed' }
        ].map((filter) => (
          <Button
            key={filter.key}
            variant={selectedStatus === filter.key ? 'default' : 'outline'}
            onClick={() => setSelectedStatus(filter.key)}
            data-testid={`button-filter-${filter.key}`}
          >
            {filter.label}
          </Button>
        ))}
      </div>

      {/* Claims Timeline */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4">Active Claims Timeline</h3>
        
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (
          <StaggerContainer className="space-y-4">
            {claims.slice(0, 5).map((claim, index) => (
              <StaggerItem key={claim.id}>
                <HoverLift>
                  <Card className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-50/30 to-indigo-50/30 dark:from-blue-900/10 dark:to-indigo-900/10" />
                    <CardContent className="relative p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="relative">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${
                              claim.priority === 'urgent' ? 'bg-[hsl(0,84%,60%)]' :
                              claim.priority === 'high' ? 'bg-[hsl(25,95%,53%)]' :
                              claim.priority === 'medium' ? 'bg-[hsl(217,71%,53%)]' : 'bg-[hsl(142,76%,36%)]'
                            }`}>
                              <FileText className="h-6 w-6" />
                            </div>
                            {claim.priority === 'urgent' && (
                              <PulseAlert intensity="strong">
                                <AlertTriangle className="absolute -top-1 -right-1 h-3 w-3 text-[hsl(0,84%,60%)]" />
                              </PulseAlert>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <h4 className="font-semibold text-gray-900 dark:text-gray-100" data-testid={`claim-number-${claim.id}`}>
                                {claim.claimNumber}
                              </h4>
                              <Badge {...getStatusBadge(claim.status)} />
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{claim.customerName} • {claim.damageType}</p>
                            <div className="flex items-center space-x-4 mt-1">
                              <span className="text-xs text-gray-500 dark:text-gray-400">Adjuster: {claim.adjuster}</span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">Updated: {claim.lastUpdate}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-6">
                          <div className="text-center">
                            <div className="text-lg font-bold text-green-600 dark:text-green-400">
                              ${claim.value.toLocaleString()}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">Claim Value</div>
                          </div>
                          
                          <div className="text-center w-24">
                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Progress</div>
                            <div className="relative">
                              <Progress value={claim.progress} className="h-3" />
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${claim.progress}%` }}
                                transition={{ duration: 1.5, ease: "easeOut", delay: index * 0.2 }}
                                className={`absolute top-0 left-0 h-3 rounded-full ${getProgressColor(claim.progress)}`}
                              />
                            </div>
                            <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mt-1">
                              {claim.progress}%
                            </div>
                          </div>
                          
                          <div className="flex space-x-2">
                            <Button size="sm" variant="outline" data-testid={`button-view-${claim.id}`}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline" data-testid={`button-update-${claim.id}`}>
                              Update
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </HoverLift>
              </StaggerItem>
            ))}
          </StaggerContainer>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Financial Overview with Animated Counters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <DollarSign className="w-5 h-5 mr-2 text-[hsl(142,76%,36%)]" />
              Financial Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: 'Pending Settlements', value: 8200000, format: 'currency' },
              { label: 'Supplements Requested', value: 1800000, format: 'currency' },
              { label: 'Average Claim Value', value: 9950, format: 'currency' },
              { label: 'Processing Time', value: avgProcessingTime, format: 'days' },
            ].map((metric, index) => (
              <div key={metric.label} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{metric.label}</span>
                <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {metric.format === 'currency' ? (
                    <>$<CountUp end={metric.value} duration={2000} delay={index * 200} /></>
                  ) : (
                    <>
                      <CountUp end={metric.value} duration={2000} delay={index * 200} decimals={1} />
                      {metric.format === 'days' ? ' days' : ''}
                    </>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-[hsl(217,71%,53%)]" />
              Status Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { status: 'Open', count: openClaims, total: claims.length, color: 'bg-[hsl(217,71%,53%)]' },
                { status: 'Pending', count: pendingClaims, total: claims.length, color: 'bg-[hsl(25,95%,53%)]' },
                { status: 'Approved', count: approvedClaims, total: claims.length, color: 'bg-[hsl(142,76%,36%)]' },
                { status: 'Closed', count: claims.filter(c => c.status === 'closed').length, total: claims.length, color: 'bg-gray-500' },
              ].map((item, index) => {
                const percentage = claims.length > 0 ? (item.count / item.total) * 100 : 0;
                
                return (
                  <div key={item.status} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{item.status}</span>
                      <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{item.count}</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                      <motion.div
                        className={`h-2 rounded-full ${item.color}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ 
                          duration: 1.5, 
                          ease: "easeOut",
                          delay: index * 0.2
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

        {/* Xactimate Comparables Section */}
        <XactimateComparables />
      </DashboardSection>
        <ModuleAIAssistant moduleName="Claims" />
      </div>
    </div>
  );
}