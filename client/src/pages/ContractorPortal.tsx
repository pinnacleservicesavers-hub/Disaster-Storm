import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Shield, 
  Bot, 
  Target, 
  Camera, 
  FileText, 
  Building, 
  AlertTriangle, 
  Users, 
  Plane,
  Heart,
  DollarSign,
  Upload,
  Download,
  Phone,
  Mail,
  MessageSquare,
  CheckCircle,
  Clock,
  MapPin,
  Zap,
  Star,
  Calendar,
  Bell,
  Settings,
  Plus,
  Eye,
  CreditCard,
  Loader2,
  TrendingUp,
  Activity,
  Globe,
  BarChart3,
  Maximize2,
  ArrowUpRight,
  Timer,
  Award,
  Briefcase,
  Volume2,
  VolumeX,
  ArrowLeft,
  Search
} from 'lucide-react';
import { Link } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { UniversalAIAssistant } from '@/components/UniversalAIAssistant';
import { UltimateAIIntelligenceSystem } from '@/components/UltimateAIIntelligenceSystem';
import { RealTimeDamageAlert } from '@/components/RealTimeDamageAlert';
import { StormPathWarningSystem } from '@/components/StormPathWarningSystem';
import { ComprehensiveIntelligenceSystem } from '@/components/ComprehensiveIntelligenceSystem';
import {
  FadeIn,
  SlideIn,
  StaggerContainer,
  StaggerItem,
  HoverLift,
  CountUp,
  PulseAlert
} from '@/components/ui/animations';
import { StateCitySelector, useStateCitySelector } from '@/components/StateCitySelector';
import ModuleAIAssistant from '@/components/ModuleAIAssistant';

// Property Lookup Tool Component
function PropertyLookupTool() {
  const [searchAddress, setSearchAddress] = useState('');
  const [propertyData, setPropertyData] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);
  const { toast } = useToast();

  const propertySearchMutation = useMutation({
    mutationFn: async (address: string) => {
      const response = await fetch(`/api/property?address=${encodeURIComponent(address)}`);
      if (!response.ok) {
        throw new Error('Property lookup failed');
      }
      return response.json();
    },
    onSuccess: (data) => {
      setPropertyData(data);
      toast({
        title: "Property Found",
        description: `Retrieved property details for ${data.data?.address || searchAddress}`
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Search Failed",
        description: error.message || "Failed to find property information"
      });
    }
  });

  const enrichmentMutation = useMutation({
    mutationFn: async ({ name, address }: { name: string; address: string }) => {
      const response = await fetch('/api/enrich', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, address })
      });
      if (!response.ok) {
        throw new Error('Contact enrichment failed');
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Contact Enhanced",
        description: "Additional contact information retrieved"
      });
      // Update property data with enrichment
      setPropertyData((prev: any) => ({
        ...prev,
        enrichment: data.data
      }));
    }
  });

  const handleSearch = () => {
    if (!searchAddress.trim()) {
      toast({
        variant: "destructive",
        title: "Invalid Input",
        description: "Please enter a property address"
      });
      return;
    }
    setIsSearching(true);
    propertySearchMutation.mutate(searchAddress.trim());
  };

  const handleEnrichContact = () => {
    if (propertyData?.data?.ownerName && propertyData?.data?.address) {
      enrichmentMutation.mutate({
        name: propertyData.data.ownerName,
        address: propertyData.data.address
      });
    }
  };

  const handleExampleSearch = (address: string) => {
    setSearchAddress(address);
    setIsSearching(true);
    propertySearchMutation.mutate(address);
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Search className="w-5 h-5 mr-2" />
          Property Owner Lookup
        </CardTitle>
        <CardDescription>
          Find property owner information, contact details, and property data for lead conversion
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Input */}
        <div className="flex space-x-2">
          <Input
            placeholder="Enter property address (e.g., 123 Main St, Atlanta, GA)"
            value={searchAddress}
            onChange={(e) => setSearchAddress(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            data-testid="input-property-search"
            className="flex-1"
          />
          <Button 
            onClick={handleSearch}
            disabled={propertySearchMutation.isPending}
            data-testid="button-search-property"
          >
            {propertySearchMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* Example Searches */}
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-gray-600">Try examples:</span>
          {[
            "5385 Westwood Drive, Columbus, GA",
            "123 Main Street, Atlanta, GA",
            "456 Oak Avenue, Miami, FL"
          ].map((address, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              onClick={() => handleExampleSearch(address)}
              disabled={propertySearchMutation.isPending}
              data-testid={`button-example-${index}`}
            >
              {address.split(',')[0]}
            </Button>
          ))}
        </div>

        {/* Results */}
        {propertyData && (
          <div className="border rounded-lg p-4 bg-gray-50">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold">Property Details</h3>
              <Badge variant={propertyData.success ? "default" : "destructive"}>
                {propertyData.provider || 'Unknown'} API
              </Badge>
            </div>

            {propertyData.success && propertyData.data ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Owner Information */}
                <div className="space-y-2">
                  <h4 className="font-medium text-green-700">Owner Information</h4>
                  <div className="space-y-1 text-sm">
                    <div><strong>Name:</strong> {propertyData.data.ownerName || 'Not available'}</div>
                    <div><strong>Mailing Address:</strong> {propertyData.data.ownerMailing || 'Not available'}</div>
                    {propertyData.enrichment && (
                      <>
                        <div><strong>Phone:</strong> {propertyData.enrichment.phone || 'Not available'}</div>
                        <div><strong>Email:</strong> {propertyData.enrichment.email || 'Not available'}</div>
                      </>
                    )}
                  </div>
                  
                  {!propertyData.enrichment && propertyData.data.ownerName && (
                    <Button
                      size="sm"
                      onClick={handleEnrichContact}
                      disabled={enrichmentMutation.isPending}
                      data-testid="button-enrich-contact"
                    >
                      {enrichmentMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <Phone className="w-4 h-4 mr-2" />
                      )}
                      Find Contact Info
                    </Button>
                  )}
                </div>

                {/* Property Details */}
                <div className="space-y-2">
                  <h4 className="font-medium text-blue-700">Property Details</h4>
                  <div className="space-y-1 text-sm">
                    <div><strong>Type:</strong> {propertyData.data.propertyType || 'Unknown'}</div>
                    <div><strong>Year Built:</strong> {propertyData.data.yearBuilt || 'Unknown'}</div>
                    <div><strong>Square Footage:</strong> {propertyData.data.squareFootage ? `${propertyData.data.squareFootage.toLocaleString()} sq ft` : 'Unknown'}</div>
                    <div><strong>Estimated Value:</strong> {propertyData.data.estimatedValue ? `$${propertyData.data.estimatedValue.toLocaleString()}` : 'Unknown'}</div>
                    <div><strong>Last Sale:</strong> {propertyData.data.lastSaleDate ? new Date(propertyData.data.lastSaleDate).toLocaleDateString() : 'Unknown'}</div>
                    {propertyData.data.parcelId && (
                      <div><strong>Parcel ID:</strong> {propertyData.data.parcelId}</div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-600">{propertyData.message || 'No property data found'}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function ContractorPortal() {
  const { selectedState, setSelectedState, selectedCity, setSelectedCity, availableCities } = useStateCitySelector('Florida', 'Miami');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [isVoiceGuideActive, setIsVoiceGuideActive] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [currentLocation, setCurrentLocation] = useState<GeolocationPosition | null>(null);
  const { toast } = useToast();
  
  // Authentication state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [contractorInfo, setContractorInfo] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    licenseNumber: ''
  });
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ 
    name: '', 
    email: '', 
    password: '', 
    company: '', 
    phone: '', 
    licenseNumber: '' 
  });

  // Check for existing session or admin access
  useEffect(() => {
    const savedSession = localStorage.getItem('contractor_session');
    const adminAccess = localStorage.getItem('admin_contractor_access');
    if (savedSession) {
      const session = JSON.parse(savedSession);
      setIsLoggedIn(true);
      setContractorInfo(session);
    }
    if (adminAccess === 'true') {
      setIsAdmin(true);
      setIsLoggedIn(true);
    }
  }, []);

  const handleLogin = () => {
    if (!loginForm.email || !loginForm.password) {
      toast({ variant: 'destructive', title: 'Please fill in all fields' });
      return;
    }
    // Demo login - in production would validate against backend
    const demoContractor = {
      name: 'Demo Contractor',
      email: loginForm.email,
      company: 'Storm Repair Pros',
      phone: '(555) 123-4567',
      licenseNumber: 'GC-12345'
    };
    localStorage.setItem('contractor_session', JSON.stringify(demoContractor));
    setContractorInfo(demoContractor);
    setIsLoggedIn(true);
    toast({ title: 'Welcome back!', description: 'Successfully logged in to your contractor portal.' });
  };

  const handleRegister = () => {
    if (!registerForm.name || !registerForm.email || !registerForm.password || !registerForm.company) {
      toast({ variant: 'destructive', title: 'Please fill in all required fields' });
      return;
    }
    const newContractor = {
      name: registerForm.name,
      email: registerForm.email,
      company: registerForm.company,
      phone: registerForm.phone,
      licenseNumber: registerForm.licenseNumber
    };
    localStorage.setItem('contractor_session', JSON.stringify(newContractor));
    setContractorInfo(newContractor);
    setIsLoggedIn(true);
    toast({ title: 'Registration successful!', description: 'Welcome to Disaster Direct Contractor Portal.' });
  };

  const handleLogout = () => {
    localStorage.removeItem('contractor_session');
    localStorage.removeItem('admin_contractor_access');
    setIsLoggedIn(false);
    setIsAdmin(false);
    setContractorInfo({ name: '', email: '', company: '', phone: '', licenseNumber: '' });
    toast({ title: 'Logged out', description: 'You have been logged out successfully.' });
  };
  
  // Quick actions for dashboard
  const handleClaimLead = () => {
    setActiveTab('leads');
  };
  
  const handleUploadPhotos = () => {
    setActiveTab('photos');
  };
  
  const handleCreateInvoice = () => {
    setActiveTab('invoices');
  };
  
  const handleContactCustomer = () => {
    setActiveTab('customers');
  };
  
  // Initialize voice loading with enhanced cleanup
  useEffect(() => {
    const loadVoices = () => {
      if ('speechSynthesis' in window) {
        setVoices(window.speechSynthesis.getVoices());
      }
    };
    
    loadVoices();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
    
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  // Initialize location tracking
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation(position);
        },
        (error) => {
          console.log('Location access denied or failed:', error);
          // Continue without location - components will handle gracefully
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 60000
        }
      );
    }
  }, []);

  // Contractor ID - In a real app, this would come from auth context
  const contractorId = 'contractor-1';

  // Main data queries with robust error handling
  const { data: leadsData = [], isLoading: leadsLoading } = useQuery({
    queryKey: ['leads'],
    queryFn: () => fetch('/api/leads').then(r => r.json()).catch(() => []),
  });

  const { data: invoicesData = [], isLoading: invoicesLoading } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => fetch('/api/invoices').then(r => r.json()).catch(() => []),
  });

  const { data: photosData = [], isLoading: photosLoading } = useQuery({
    queryKey: ['photos'],
    queryFn: () => fetch('/api/photos').then(r => r.json()).catch(() => []),
  });

  const { data: customersData = [], isLoading: customersLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: () => fetch('/api/customers').then(r => r.json()).catch(() => []),
  });

  const { data: slaData = [], isLoading: slaLoading } = useQuery({
    queryKey: ['sla'],
    queryFn: () => fetch('/api/sla/list').then(r => r.json()).catch(() => []),
  });

  // Ensure data is always arrays with defensive programming
  const leads = Array.isArray(leadsData) ? leadsData : [];
  const invoices = Array.isArray(invoicesData) ? invoicesData : [];
  const photos = Array.isArray(photosData) ? photosData : [];
  const customers = Array.isArray(customersData) ? customersData : [];
  const slaItems = Array.isArray(slaData) ? slaData : [];

  // Calculate dashboard stats from real data
  const activeProjects = invoices.filter(inv => inv && (inv.status === 'sent' || inv.status === 'draft')).length;
  const monthlyRevenue = invoices
    .filter(inv => {
      if (!inv || !inv.createdAt) return false;
      const invDate = new Date(inv.createdAt);
      const now = new Date();
      return invDate.getMonth() === now.getMonth() && invDate.getFullYear() === now.getFullYear();
    })
    .reduce((sum, inv) => sum + parseFloat(inv.totalAmount || '0'), 0);
  const newLeads = leads.filter(lead => lead && lead.status === 'new').length;
  
  // Generate notifications from real data
  const notifications = [
    ...slaItems
      .filter(item => {
        const daysSince = Math.floor((Date.now() - item.ts) / (1000 * 60 * 60 * 24));
        return (item.type === 'work_completed' && daysSince >= 40) || 
               (item.type === 'lien_filed' && daysSince >= 290);
      })
      .slice(0, 3)
      .map(item => ({
        id: item.id,
        type: 'lien',
        message: `Lien deadline approaching for ${item.address}`,
        urgent: true
      })),
    ...(newLeads > 0 ? [{
      id: 'leads-available',
      type: 'lead',
      message: `${newLeads} new storm damage leads in your area`,
      urgent: false
    }] : [])
  ];

  // Get best natural female voice using the loaded voices state
  const getBestFemaleVoice = (availableVoices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null => {
    if (!availableVoices || availableVoices.length === 0) {
      return null;
    }
    
    // Priority order for natural female voices
    const preferredVoices = [
      'Samantha', // Mac/iOS - very natural
      'Karen', // Mac/iOS Australian
      'Moira', // Mac/iOS Irish
      'Fiona', // Mac/iOS Scottish
      'Victoria', // Mac/iOS
      'Microsoft Zira', // Windows
      'Microsoft Aria', // Windows 11
      'Microsoft Jenny', // Windows 11 Neural
      'Google US English Female', // Chrome
      'Google UK English Female', // Chrome UK
      'Joanna', // Amazon Polly
      'Salli', // Amazon Polly
      'Kimberly', // Amazon Polly
    ];
    
    // Try to find preferred voices first
    for (const preferred of preferredVoices) {
      const voice = availableVoices.find(v => 
        v.name.toLowerCase().includes(preferred.toLowerCase())
      );
      if (voice) return voice;
    }
    
    // Fallback: find any female English voice
    const femaleVoice = availableVoices.find(v => 
      v.lang.startsWith('en') && 
      (v.name.toLowerCase().includes('female') || 
       v.name.toLowerCase().includes('woman') ||
       v.name.toLowerCase().includes('zira') ||
       v.name.toLowerCase().includes('hazel') ||
       v.name.toLowerCase().includes('susan'))
    );
    if (femaleVoice) return femaleVoice;
    
    // Last fallback: any English voice
    return availableVoices.find(v => v.lang.startsWith('en')) || availableVoices[0] || null;
  };

  // Speak with natural female voice
  const speakWithFemaleVoice = (text: string) => {
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Use the voices state that's already loaded
    const femaleVoice = getBestFemaleVoice(voices);
    if (femaleVoice) {
      utterance.voice = femaleVoice;
      console.log('Using voice:', femaleVoice.name);
    } else {
      console.warn('No female voice found, using default');
    }
    
    // Natural, friendly speaking style - upbeat female tone
    utterance.rate = 1.05;
    utterance.pitch = 1.1;
    utterance.volume = 0.9;
    
    utterance.onend = () => {
      setIsVoiceGuideActive(false);
    };
    
    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      setIsVoiceGuideActive(false);
    };
    
    window.speechSynthesis.speak(utterance);
  };

  // Voice Guide Function with natural female voice
  const startVoiceGuide = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      toast({ variant: 'destructive', title: 'Voice not supported', description: 'Your browser does not support speech synthesis.' });
      return;
    }

    if (!isVoiceGuideActive) {
      // Check if voices are loaded
      if (voices.length === 0) {
        // Try to load voices and retry
        const loadedVoices = window.speechSynthesis.getVoices();
        if (loadedVoices.length === 0) {
          toast({ title: 'Loading voice...', description: 'Please wait a moment and try again.' });
          return;
        }
        setVoices(loadedVoices);
      }
      
      setIsVoiceGuideActive(true);
      
      const voiceContent = `Welcome to your Contractor Portal! I'm Evelyn, your AI assistant, and I'll guide you through managing your storm damage business.

      Let me walk you through the main sections. The Dashboard shows your active projects, monthly revenue, new leads, and critical alerts at a glance. You can see everything you need to run your business efficiently.

      In the Leads section, you'll find new storm damage opportunities in your area. Each lead shows the damage type, location, and estimated value so you can prioritize your time.

      The Photos tab helps you document your work. Upload before, during, and after photos to build strong documentation for insurance claims and customer records.

      For billing, the Invoices section lets you create professional invoices, track payment status, and manage your revenue. Everything integrates with your project photos automatically.

      The Customers tab keeps all your client relationships organized with contact info, project history, and communication logs.

      I'm here to help you succeed. Just ask if you need assistance with estimates, scheduling, or any part of your business!`;
      
      speakWithFemaleVoice(voiceContent);
    } else {
      window.speechSynthesis.cancel();
      setIsVoiceGuideActive(false);
    }
  };

  // Login/Register Screen
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Link href="/">
              <Button variant="outline" className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Hub
              </Button>
            </Link>
          </div>

          {/* Login/Register Card */}
          <div className="max-w-md mx-auto">
            <Card className="shadow-xl border-0">
              <CardHeader className="text-center pb-2">
                <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mb-4">
                  <Briefcase className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-2xl font-bold">Contractor Portal</CardTitle>
                <CardDescription>
                  {authMode === 'login' 
                    ? 'Sign in to access your contractor dashboard' 
                    : 'Create your contractor account'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {authMode === 'login' ? (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Email</label>
                      <Input
                        type="email"
                        placeholder="contractor@example.com"
                        value={loginForm.email}
                        onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                        data-testid="input-login-email"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Password</label>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        value={loginForm.password}
                        onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                        data-testid="input-login-password"
                      />
                    </div>
                    <Button 
                      className="w-full bg-blue-600 hover:bg-blue-700" 
                      onClick={handleLogin}
                      data-testid="button-login"
                    >
                      Sign In
                    </Button>
                    <div className="text-center text-sm text-gray-600">
                      Don't have an account?{' '}
                      <button 
                        className="text-blue-600 hover:underline font-medium"
                        onClick={() => setAuthMode('register')}
                        data-testid="button-switch-to-register"
                      >
                        Register here
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Full Name *</label>
                        <Input
                          placeholder="John Smith"
                          value={registerForm.name}
                          onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                          data-testid="input-register-name"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Company *</label>
                        <Input
                          placeholder="Storm Repair Co"
                          value={registerForm.company}
                          onChange={(e) => setRegisterForm({ ...registerForm, company: e.target.value })}
                          data-testid="input-register-company"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Email *</label>
                      <Input
                        type="email"
                        placeholder="contractor@example.com"
                        value={registerForm.email}
                        onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                        data-testid="input-register-email"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Password *</label>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        value={registerForm.password}
                        onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                        data-testid="input-register-password"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Phone</label>
                        <Input
                          placeholder="(555) 123-4567"
                          value={registerForm.phone}
                          onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })}
                          data-testid="input-register-phone"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">License #</label>
                        <Input
                          placeholder="GC-12345"
                          value={registerForm.licenseNumber}
                          onChange={(e) => setRegisterForm({ ...registerForm, licenseNumber: e.target.value })}
                          data-testid="input-register-license"
                        />
                      </div>
                    </div>
                    <Button 
                      className="w-full bg-blue-600 hover:bg-blue-700" 
                      onClick={handleRegister}
                      data-testid="button-register"
                    >
                      Create Account
                    </Button>
                    <div className="text-center text-sm text-gray-600">
                      Already have an account?{' '}
                      <button 
                        className="text-blue-600 hover:underline font-medium"
                        onClick={() => setAuthMode('login')}
                        data-testid="button-switch-to-login"
                      >
                        Sign in
                      </button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Admin Quick Access (for demo) */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500 mb-2">Administrator Access</p>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  localStorage.setItem('admin_contractor_access', 'true');
                  setIsAdmin(true);
                  setIsLoggedIn(true);
                  setContractorInfo({ name: 'Admin User', email: 'admin@disasterdirect.com', company: 'Disaster Direct', phone: '', licenseNumber: '' });
                  toast({ title: 'Admin Access Granted', description: 'You can now view and manage all contractor portals.' });
                }}
                data-testid="button-admin-access"
              >
                <Shield className="w-4 h-4 mr-2" />
                Enter as Administrator
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-all duration-500 ${
      isFullscreen 
        ? 'fixed inset-0 z-50 bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100' 
        : 'bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100'
    } relative overflow-hidden`}>
      {/* Enhanced Header */}
      <motion.div 
        className="bg-white/80 backdrop-blur-sm border-b border-blue-200/50 shadow-lg relative z-20"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/">
              <motion.button
                whileHover={{ scale: 1.05, x: -2 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 px-4 py-2 bg-[hsl(217,71%,53%)] hover:bg-[hsl(217,71%,43%)] text-white rounded-lg transition-all duration-200"
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
              variant="dark"
              showAllStates={true}
            />
          </div>
          <div className="flex items-center justify-between">
            <motion.div 
              className="flex items-center space-x-4"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="flex items-center space-x-3">
                <motion.div
                  className="p-3 bg-gradient-to-br from-[hsl(217,71%,53%)] to-[hsl(217,91%,35%)] rounded-xl shadow-lg"
                  animate={{ 
                    scale: [1, 1.05, 1],
                    boxShadow: [
                      '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                      '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    ]
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <Briefcase className="w-6 h-6 text-white" />
                </motion.div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-800 bg-clip-text text-transparent" data-testid="text-portal-title">
                    Contractor Portal
                  </h1>
                  <motion.p 
                    className="text-blue-600/80 text-sm font-medium flex items-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    <Activity className="w-3 h-3 mr-1 animate-pulse" />
                    Professional storm damage services
                  </motion.p>
                </div>
              </div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Badge className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-200 px-3 py-1 shadow-sm">
                  <Award className="w-3 h-3 mr-1" />
                  Pro Subscription Active
                </Badge>
              </motion.div>
            </motion.div>
            <motion.div 
              className="flex items-center space-x-4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              {/* Voice Guide Button */}
              <HoverLift>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={startVoiceGuide}
                  className="flex items-center gap-2"
                  data-testid="button-voice-guide"
                  aria-label="Voice guide for Contractor Portal"
                  aria-pressed={isVoiceGuideActive}
                >
                  {isVoiceGuideActive ? (
                    <>
                      <VolumeX className="h-4 w-4" />
                      Stop Guide
                    </>
                  ) : (
                    <>
                      <Volume2 className="h-4 w-4" />
                      Voice Guide
                    </>
                  )}
                </Button>
              </HoverLift>

              {/* Fullscreen Toggle */}
              <HoverLift>
                <motion.button
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
                  data-testid="button-fullscreen-toggle"
                >
                  <Maximize2 className="w-4 h-4" />
                </motion.button>
              </HoverLift>
              
              <HoverLift>
                <Button 
                  variant="outline" 
                  size="sm" 
                  data-testid="button-ai-assistant"
                  onClick={() => {
                    toast({
                      title: "AI Assistant Activated",
                      description: "AI assistant is ready to help with estimates, scheduling, and project management."
                    });
                  }}
                >
                  <Bot className="w-4 h-4 mr-2" />
                  AI Assistant
                </Button>
              </HoverLift>
              
              <div className="relative">
                <HoverLift>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    data-testid="button-notifications"
                    onClick={() => {
                      const urgentCount = notifications.filter(n => n.urgent).length;
                      toast({
                        title: `Notifications (${notifications.length})`,
                        description: urgentCount > 0 ? `You have ${urgentCount} urgent notifications` : "All caught up! No urgent notifications."
                      });
                    }}
                  >
                    <Bell className="w-4 h-4" />
                    {notifications.filter(n => n.urgent).length > 0 && (
                      <motion.span 
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full text-xs w-5 h-5 flex items-center justify-center"
                      >
                        {notifications.filter(n => n.urgent).length}
                      </motion.span>
                    )}
                  </Button>
                </HoverLift>
              </div>
              
              <HoverLift>
                <Button 
                  variant="outline" 
                  size="sm" 
                  data-testid="button-profile-settings"
                  onClick={() => setActiveTab('profile')}
                >
                  <User className="w-4 h-4 mr-2" />
                  {contractorInfo.name || 'Profile'}
                </Button>
              </HoverLift>
              
              {/* Admin Badge */}
              {isAdmin && (
                <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                  <Shield className="w-3 h-3 mr-1" />
                  Admin Access
                </Badge>
              )}
              
              {/* Logout Button */}
              <HoverLift>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleLogout}
                  data-testid="button-logout"
                  className="text-red-600 hover:bg-red-50 border-red-200"
                >
                  Sign Out
                </Button>
              </HoverLift>
            </motion.div>
          </div>
        </div>
      </motion.div>

      <div className="container mx-auto px-6 py-6 relative z-10">
        {/* Enhanced KPI Dashboard */}
        <motion.div 
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, staggerChildren: 0.1 }}
        >
          <motion.div 
            variants={{ hidden: { opacity: 0, scale: 0.8 }, visible: { opacity: 1, scale: 1 } }}
            className="relative overflow-hidden"
          >
            <Card className="h-full bg-gradient-to-br from-[hsl(217,71%,53%)]/10 to-[hsl(217,71%,53%)]/20 border-[hsl(217,71%,53%)]/30 hover:shadow-lg transition-all duration-300">
              <CardContent className="p-4 text-center">
                <Briefcase className="w-8 h-8 mx-auto mb-2 text-[hsl(217,71%,53%)]" />
                <div className="text-2xl font-bold text-[hsl(217,71%,53%)]" data-testid="kpi-active-projects">
                  <CountUp end={activeProjects} duration={1.5} />
                </div>
                <div className="text-xs text-[hsl(217,71%,53%)]/80 font-medium">Active Projects</div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={{ hidden: { opacity: 0, scale: 0.8 }, visible: { opacity: 1, scale: 1 } }}>
            <Card className="h-full bg-gradient-to-br from-[hsl(142,76%,36%)]/10 to-[hsl(142,76%,36%)]/20 border-[hsl(142,76%,36%)]/30 hover:shadow-lg transition-all duration-300">
              <CardContent className="p-4 text-center">
                <DollarSign className="w-8 h-8 mx-auto mb-2 text-[hsl(142,76%,36%)]" />
                <div className="text-2xl font-bold text-[hsl(142,76%,36%)]" data-testid="kpi-monthly-revenue">
                  <CountUp end={monthlyRevenue} duration={2} prefix="$" />
                </div>
                <div className="text-xs text-[hsl(142,76%,36%)]/80 font-medium">Monthly Revenue</div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={{ hidden: { opacity: 0, scale: 0.8 }, visible: { opacity: 1, scale: 1 } }}>
            <Card className="h-full bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-lg transition-all duration-300">
              <CardContent className="p-4 text-center">
                <Target className={`w-8 h-8 mx-auto mb-2 ${newLeads > 0 ? 'text-purple-500 animate-pulse' : 'text-purple-400'}`} />
                <div className="text-2xl font-bold text-purple-600" data-testid="kpi-new-leads">
                  <CountUp end={newLeads} duration={1.5} />
                </div>
                <div className="text-xs text-purple-600/80 font-medium">New Leads</div>
                {newLeads > 0 && (
                  <motion.div 
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute -top-1 -right-1 w-3 h-3 bg-purple-500 rounded-full"
                  />
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={{ hidden: { opacity: 0, scale: 0.8 }, visible: { opacity: 1, scale: 1 } }}>
            <Card className="h-full bg-gradient-to-br from-[hsl(25,95%,53%)]/10 to-[hsl(25,95%,53%)]/20 border-[hsl(25,95%,53%)]/30 hover:shadow-lg transition-all duration-300">
              <CardContent className="p-4 text-center">
                <Camera className="w-8 h-8 mx-auto mb-2 text-[hsl(25,95%,53%)]" />
                <div className="text-2xl font-bold text-orange-600" data-testid="kpi-photos-uploaded">
                  <CountUp end={photos.length} duration={1.5} />
                </div>
                <div className="text-xs text-orange-600/80 font-medium">Photos Uploaded</div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={{ hidden: { opacity: 0, scale: 0.8 }, visible: { opacity: 1, scale: 1 } }}>
            <Card className="h-full bg-gradient-to-br from-red-50 to-red-100 border-red-200 hover:shadow-lg transition-all duration-300">
              <CardContent className="p-4 text-center">
                <AlertTriangle className={`w-8 h-8 mx-auto mb-2 ${notifications.filter(n => n.urgent).length > 0 ? 'text-red-500 animate-bounce' : 'text-red-400'}`} />
                <div className="text-2xl font-bold text-red-600" data-testid="kpi-critical-alerts">
                  <CountUp end={notifications.filter(n => n.urgent).length} duration={1.5} />
                </div>
                <div className="text-xs text-red-600/80 font-medium">Critical Alerts</div>
                {notifications.filter(n => n.urgent).length > 0 && (
                  <motion.div 
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"
                  />
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={{ hidden: { opacity: 0, scale: 0.8 }, visible: { opacity: 1, scale: 1 } }}>
            <Card className="h-full bg-gradient-to-br from-cyan-50 to-cyan-100 border-cyan-200 hover:shadow-lg transition-all duration-300">
              <CardContent className="p-4 text-center">
                <TrendingUp className="w-8 h-8 mx-auto mb-2 text-cyan-500 animate-pulse" />
                <div className="text-2xl font-bold text-cyan-600" data-testid="kpi-success-rate">
                  <CountUp end={94} duration={1.5} suffix="%" />
                </div>
                <div className="text-xs text-cyan-600/80 font-medium">Success Rate</div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Navigation Tabs */}
          <TabsList className="grid w-full grid-cols-6 lg:grid-cols-11">
            <TabsTrigger value="dashboard" data-testid="tab-dashboard">
              <User className="w-4 h-4 mr-2" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="profile" data-testid="tab-profile">
              <Shield className="w-4 h-4 mr-2" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="leads" data-testid="tab-leads">
              <Target className="w-4 h-4 mr-2" />
              Leads
            </TabsTrigger>
            <TabsTrigger value="photos" data-testid="tab-photos">
              <Camera className="w-4 h-4 mr-2" />
              Photos
            </TabsTrigger>
            <TabsTrigger value="invoices" data-testid="tab-invoices">
              <FileText className="w-4 h-4 mr-2" />
              Invoices
            </TabsTrigger>
            <TabsTrigger value="insurance" data-testid="tab-insurance">
              <Building className="w-4 h-4 mr-2" />
              Insurance
            </TabsTrigger>
            <TabsTrigger value="legal" data-testid="tab-legal">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Legal
            </TabsTrigger>
            <TabsTrigger value="customers" data-testid="tab-customers">
              <Users className="w-4 h-4 mr-2" />
              Customers
            </TabsTrigger>
            <TabsTrigger value="drones" data-testid="tab-drones">
              <Plane className="w-4 h-4 mr-2" />
              Drones
            </TabsTrigger>
            <TabsTrigger value="victims" data-testid="tab-victims">
              <Heart className="w-4 h-4 mr-2" />
              Victims
            </TabsTrigger>
            <TabsTrigger value="ai" data-testid="tab-ai">
              <Bot className="w-4 h-4 mr-2" />
              AI Tools
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">Active Projects</CardTitle>
                </CardHeader>
                <CardContent>
                  {invoicesLoading ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <>
                      <div className="text-2xl font-bold" data-testid="text-active-projects">{activeProjects}</div>
                      <p className="text-xs text-gray-500">In progress</p>
                    </>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">Revenue (Month)</CardTitle>
                </CardHeader>
                <CardContent>
                  {invoicesLoading ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <>
                      <div className="text-2xl font-bold text-green-600" data-testid="text-monthly-revenue">
                        ${monthlyRevenue.toLocaleString()}
                      </div>
                      <p className="text-xs text-gray-500">Current month</p>
                    </>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">New Leads</CardTitle>
                </CardHeader>
                <CardContent>
                  {leadsLoading ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <>
                      <div className="text-2xl font-bold text-blue-600" data-testid="text-new-leads">{newLeads}</div>
                      <p className="text-xs text-gray-500">Available to claim</p>
                    </>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">Photos Uploaded</CardTitle>
                </CardHeader>
                <CardContent>
                  {photosLoading ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <>
                      <div className="text-2xl font-bold text-purple-600" data-testid="text-photos-count">{photos.length}</div>
                      <p className="text-xs text-gray-500">This month</p>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button className="h-20 flex-col" data-testid="button-claim-lead">
                    <Target className="w-6 h-6 mb-2" />
                    Claim Lead
                  </Button>
                  <Button className="h-20 flex-col" variant="outline" data-testid="button-upload-photos">
                    <Camera className="w-6 h-6 mb-2" />
                    Upload Photos
                  </Button>
                  <Button className="h-20 flex-col" variant="outline" data-testid="button-create-invoice">
                    <FileText className="w-6 h-6 mb-2" />
                    Create Invoice
                  </Button>
                  <Button className="h-20 flex-col" variant="outline" data-testid="button-contact-customer">
                    <Phone className="w-6 h-6 mb-2" />
                    Contact Customer
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {invoicesLoading || photosLoading || leadsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin" />
                    </div>
                  ) : (
                    <>
                      {/* Recent Paid Invoices */}
                      {invoices
                        .filter(inv => inv.status === 'paid')
                        .slice(0, 2)
                        .map(invoice => (
                          <div key={invoice.id} className="flex items-center space-x-3">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            <div>
                              <p className="text-sm font-medium">Invoice #{invoice.invoiceNumber} paid</p>
                              <p className="text-xs text-gray-500">
                                {new Date(invoice.paidDate || invoice.updatedAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      
                      {/* Recent Photos */}
                      {photos.slice(0, 1).map(photo => (
                        <div key={photo.id} className="flex items-center space-x-3">
                          <Camera className="w-5 h-5 text-blue-600" />
                          <div>
                            <p className="text-sm font-medium">Photo uploaded: {photo.fileName}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(photo.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                      
                      {/* Recent Leads */}
                      {leads
                        .filter(lead => lead.status === 'contacted' || lead.status === 'in_progress')
                        .slice(0, 1)
                        .map(lead => (
                          <div key={lead.id} className="flex items-center space-x-3">
                            <Target className="w-5 h-5 text-purple-600" />
                            <div>
                              <p className="text-sm font-medium">
                                Lead claimed: {lead.damageType} - {lead.propertyAddress}
                              </p>
                              <p className="text-xs text-gray-500">
                                {new Date(lead.updatedAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      
                      {invoices.length === 0 && photos.length === 0 && leads.length === 0 && (
                        <p className="text-sm text-gray-500 text-center py-4">
                          No recent activity
                        </p>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Bell className="w-5 h-5 mr-2" />
                    Critical Alerts
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {slaLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin" />
                    </div>
                  ) : notifications.length > 0 ? (
                    notifications.map((notification) => (
                      <div 
                        key={notification.id}
                        className={`p-3 rounded-lg border-l-4 ${
                          notification.urgent 
                            ? 'bg-red-50 border-red-400' 
                            : 'bg-blue-50 border-blue-400'
                        }`}
                      >
                        <p className={`text-sm ${notification.urgent ? 'text-red-800' : 'text-blue-800'}`}>
                          {notification.message}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">
                      No critical alerts
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Profile & Compliance Tab */}
          <TabsContent value="profile" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <User className="w-5 h-5 mr-2" />
                    Company Profile
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Company Name</label>
                    <p className="text-lg">Storm Solutions LLC</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Services Offered</label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      <Badge>Storm Cleanup</Badge>
                      <Badge>Tree Removal</Badge>
                      <Badge>Roof Repair</Badge>
                      <Badge>Water Damage</Badge>
                    </div>
                  </div>
                  <Button variant="outline" data-testid="button-edit-profile">
                    <Settings className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Shield className="w-5 h-5 mr-2" />
                    Compliance Documents
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Business License</span>
                    <div className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-600 mr-1" />
                      <span className="text-sm text-green-600">Valid</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">General Liability Insurance</span>
                    <div className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-600 mr-1" />
                      <span className="text-sm text-green-600">Valid</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Workers' Compensation</span>
                    <div className="flex items-center">
                      <AlertTriangle className="w-4 h-4 text-amber-600 mr-1" />
                      <span className="text-sm text-amber-600">Expires 30 days</span>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full" data-testid="button-upload-documents">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Documents
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Leads & Contracts Tab */}
          <TabsContent value="leads" className="space-y-6">
            {/* Property Owner Lookup Tool */}
            <PropertyLookupTool />
            
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Available Leads</h2>
              <Button data-testid="button-filter-leads">
                <MapPin className="w-4 h-4 mr-2" />
                Filter by Location
              </Button>
            </div>

            {leadsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            ) : leads.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Target className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Leads Available</h3>
                  <p className="text-gray-500">Check back later for new storm damage leads in your area.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {leads
                  .filter(lead => lead.status === 'new')
                  .map((lead) => (
                    <LeadCard key={lead.id} lead={lead} />
                  ))}
              </div>
            )}
          </TabsContent>

          {/* Photo & Evidence Management Tab */}
          <TabsContent value="photos" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Camera className="w-5 h-5 mr-2" />
                  AI-Powered Photo Management
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <Camera className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-lg font-medium mb-2">Upload Job Photos</p>
                  <p className="text-sm text-gray-600 mb-4">
                    AI will automatically analyze damage, measure dimensions, and generate insurance-ready reports
                  </p>
                  <Button 
                    data-testid="button-upload-photos-main"
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.multiple = true;
                      input.accept = 'image/*';
                      input.onchange = (e) => {
                        const files = (e.target as HTMLInputElement).files;
                        if (files) {
                          toast({
                            title: "Photos Selected",
                            description: `${files.length} photo(s) ready for AI analysis and upload`
                          });
                        }
                      };
                      input.click();
                    }}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Select Photos
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2">AI Features</h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• Automatic damage assessment</li>
                      <li>• Tree height & weight estimation</li>
                      <li>• Insurance-ready descriptions</li>
                      <li>• Measurement overlays</li>
                    </ul>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-green-900 mb-2">Benefits</h4>
                    <ul className="text-sm text-green-700 space-y-1">
                      <li>• Reduce claim denials</li>
                      <li>• Professional documentation</li>
                      <li>• Faster claim processing</li>
                      <li>• Higher approval rates</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Photo Reports</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[1, 2, 3].map((report) => (
                    <div key={report} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Camera className="w-5 h-5 text-blue-600" />
                        <div>
                          <p className="font-medium">Storm Cleanup Miami - Photo Report #{report}</p>
                          <p className="text-sm text-gray-600">Generated 2 hours ago • 12 photos analyzed</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" data-testid={`button-download-report-${report}`}>
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Invoicing & Job Costing Tab */}
          <TabsContent value="invoices" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Invoicing & Job Costing</h2>
              <Button data-testid="button-create-new-invoice">
                <Plus className="w-4 h-4 mr-2" />
                Create Invoice
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="w-5 h-5 mr-2" />
                    AI Job Costing
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-purple-900 mb-2">Industry Benchmark Analysis</h4>
                    <p className="text-sm text-purple-700">
                      AI analyzes regional market averages within 150-mile radius and provides detailed cost breakdowns
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Labor (Storm Cleanup):</span>
                      <span className="font-medium">$2,400</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Equipment & Materials:</span>
                      <span className="font-medium">$1,850</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Disposal Fees:</span>
                      <span className="font-medium">$650</span>
                    </div>
                    <div className="border-t pt-2 flex justify-between font-semibold">
                      <span>Total Estimate:</span>
                      <span className="text-green-600">$4,900</span>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    data-testid="button-generate-estimate"
                    onClick={() => {
                      toast({
                        title: "AI Estimate Generator",
                        description: "Analyzing property damage and generating cost estimate... This may take a few moments."
                      });
                      // Simulate AI processing
                      setTimeout(() => {
                        toast({
                          title: "Estimate Ready!",
                          description: "AI has generated a comprehensive damage estimate. Check your invoices tab."
                        });
                      }, 3000);
                    }}
                  >
                    <Bot className="w-4 h-4 mr-2" />
                    Generate AI Estimate
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Invoices</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[1, 2, 3].map((invoice) => (
                      <div key={invoice} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">INV-2024-{String(invoice).padStart(3, '0')}</p>
                          <p className="text-sm text-gray-600">Storm Cleanup Miami</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-green-600">$4,250</p>
                          <Badge className="bg-green-100 text-green-800">Paid</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Insurance & Claims Tab */}
          <TabsContent value="insurance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building className="w-5 h-5 mr-2" />
                  Insurance & Claim Integration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2">Automated Weather Data</h4>
                    <p className="text-sm text-blue-700">
                      Wind speed, hurricane category, and weather conditions automatically integrated with claims
                    </p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-green-900 mb-2">AI Claim Preparation</h4>
                    <p className="text-sm text-green-700">
                      Complete claim documentation prepared and sent to insurance companies automatically
                    </p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <Button className="w-full justify-start" data-testid="button-submit-claim">
                    <FileText className="w-4 h-4 mr-2" />
                    Submit Insurance Claim
                  </Button>
                  <Button variant="outline" className="w-full justify-start" data-testid="button-sba-fema-links">
                    <Building className="w-4 h-4 mr-2" />
                    SBA & FEMA Disaster Relief Links
                  </Button>
                  <Button variant="outline" className="w-full justify-start" data-testid="button-claim-tracking">
                    <Eye className="w-4 h-4 mr-2" />
                    Track Claim Status
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Legal & Lien Protection Tab */}
          <TabsContent value="legal" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="w-5 h-5 mr-2" />
                  Lien Protection & Legal Alerts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-red-50 p-4 rounded-lg border-l-4 border-red-400">
                  <h4 className="font-semibold text-red-900 mb-2">Urgent: Lien Deadline Alert</h4>
                  <p className="text-sm text-red-700 mb-2">
                    Project #CH-2024-089 - Lien deadline in 15 days (Florida)
                  </p>
                  <Button size="sm" data-testid="button-file-lien">
                    File Lien Now
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2">State-Specific Tracking</h4>
                    <p className="text-sm text-blue-700">
                      Automated tracking of lien laws for all 50 states with deadline alerts
                    </p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-purple-900 mb-2">LienItNow Integration</h4>
                    <p className="text-sm text-purple-700">
                      Step-by-step AI guidance for filing liens through LienItNow.com
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold">Upcoming Deadlines</h4>
                  {[
                    { project: 'CH-2024-089', state: 'FL', days: 15, urgent: true },
                    { project: 'CH-2024-078', state: 'GA', days: 45, urgent: false },
                    { project: 'CH-2024-092', state: 'TX', days: 60, urgent: false }
                  ].map((deadline, index) => (
                    <div key={index} className={`flex items-center justify-between p-2 rounded ${deadline.urgent ? 'bg-red-50' : 'bg-gray-50'}`}>
                      <div>
                        <span className="font-medium">Project {deadline.project}</span>
                        <span className="text-sm text-gray-600 ml-2">({deadline.state})</span>
                      </div>
                      <div className="text-right">
                        <span className={`font-medium ${deadline.urgent ? 'text-red-600' : 'text-gray-600'}`}>
                          {deadline.days} days
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Customer Portal Tab */}
          <TabsContent value="customers" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  Customer Portal Management
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg text-center">
                    <h4 className="font-semibold text-blue-900 mb-2">Active Customers</h4>
                    <div className="text-2xl font-bold text-blue-600">23</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg text-center">
                    <h4 className="font-semibold text-green-900 mb-2">Portal Logins</h4>
                    <div className="text-2xl font-bold text-green-600">156</div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg text-center">
                    <h4 className="font-semibold text-purple-900 mb-2">Payments Made</h4>
                    <div className="text-2xl font-bold text-purple-600">$89K</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold">Communication Tools</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Button variant="outline" className="h-16 flex-col" data-testid="button-send-text">
                      <MessageSquare className="w-5 h-5 mb-1" />
                      Send Text
                    </Button>
                    <Button variant="outline" className="h-16 flex-col" data-testid="button-send-email">
                      <Mail className="w-5 h-5 mb-1" />
                      Send Email
                    </Button>
                    <Button variant="outline" className="h-16 flex-col" data-testid="button-make-call">
                      <Phone className="w-5 h-5 mb-1" />
                      Make Call
                    </Button>
                  </div>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-green-900 mb-2">Customer Features</h4>
                  <ul className="text-sm text-green-700 space-y-1">
                    <li>• Unique customer ID tracking</li>
                    <li>• View claims, contracts, and invoices</li>
                    <li>• Secure payment portal</li>
                    <li>• Real-time project updates</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Drone Services Tab */}
          <TabsContent value="drones" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Plane className="w-5 h-5 mr-2" />
                  Drone Services & Storm Mapping
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2">Live Storm Footage</h4>
                    <p className="text-sm text-blue-700">
                      Access real-time and archived drone footage of storm damage areas
                    </p>
                    <Button size="sm" className="mt-2" data-testid="button-view-footage">
                      View Footage
                    </Button>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-green-900 mb-2">AI Damage Tagging</h4>
                    <p className="text-sm text-green-700">
                      Automatic identification of damage types: trees on houses, vehicles, buildings
                    </p>
                    <Button size="sm" className="mt-2" variant="outline" data-testid="button-damage-analysis">
                      Analyze Damage
                    </Button>
                  </div>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-purple-900 mb-2">Homeowner Data Integration</h4>
                  <div className="text-sm text-purple-700 space-y-1">
                    <p>• ATTOM/Estated APIs → Property owner data</p>
                    <p>• Whitepages Pro API → Licensed contact enrichment</p>
                    <p>• Location-based damage filing with owner details</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold">Available Drone Leads</h4>
                  {[1, 2, 3].map((lead) => (
                    <div key={lead} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium">Tree on House - Coral Gables</h5>
                        <Badge className="bg-red-100 text-red-800">High Priority</Badge>
                      </div>
                      <div className="text-sm text-gray-600 mb-3">
                        <p>Owner: John & Mary Smith • 305-555-0123</p>
                        <p>1234 Coral Way, Coral Gables, FL 33134</p>
                      </div>
                      <div className="flex space-x-2">
                        <Button size="sm" data-testid={`button-claim-drone-lead-${lead}`}>
                          <Target className="w-4 h-4 mr-2" />
                          Claim Lead
                        </Button>
                        <Button size="sm" variant="outline" data-testid={`button-contact-owner-${lead}`}>
                          <Phone className="w-4 h-4 mr-2" />
                          Contact Owner
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Victim Access Tab */}
          <TabsContent value="victims" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Heart className="w-5 h-5 mr-2" />
                  Storm Victim Emergency Response
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-red-50 p-4 rounded-lg border-l-4 border-red-400">
                  <h4 className="font-semibold text-red-900 mb-2">Emergency Response</h4>
                  <p className="text-sm text-red-700">
                    Direct access for storm victims to share location and emergency needs for faster response
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2">Victim Portal Features</h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• Emergency location sharing</li>
                      <li>• Direct communication channel</li>
                      <li>• Priority response for trapped individuals</li>
                      <li>• Real-time status updates</li>
                    </ul>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-green-900 mb-2">Response Benefits</h4>
                    <ul className="text-sm text-green-700 space-y-1">
                      <li>• Faster emergency response times</li>
                      <li>• Accurate location data</li>
                      <li>• Priority contractor dispatch</li>
                      <li>• Coordinated rescue efforts</li>
                    </ul>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold">Active Emergency Requests</h4>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-medium text-red-900">URGENT: Trapped in House</h5>
                      <Badge className="bg-red-600 text-white">Emergency</Badge>
                    </div>
                    <p className="text-sm text-red-700 mb-2">
                      Family of 4 trapped by fallen tree blocking all exits
                    </p>
                    <p className="text-sm text-red-600">
                      📍 123 Storm Street, Miami, FL • Reported 15 minutes ago
                    </p>
                    <Button size="sm" className="mt-2" data-testid="button-respond-emergency">
                      <Zap className="w-4 h-4 mr-2" />
                      Respond to Emergency
                    </Button>
                  </div>
                </div>

                <Link href="/victim/login">
                  <Button variant="outline" className="w-full" data-testid="button-victim-portal-access">
                    <Heart className="w-4 h-4 mr-2" />
                    Access Victim Portal
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Tools Tab */}
          <TabsContent value="ai" className="space-y-6">
            {/* 🌍 COMPREHENSIVE INTELLIGENCE SYSTEM - Ask About Anything Anywhere */}
            <ComprehensiveIntelligenceSystem
              className="w-full"
              onIncidentAlert={(incident) => {
                console.log('Critical incident detected:', incident);
                // Handle critical incident alerts
                if (incident.severity === 'emergency' || incident.severity === 'critical') {
                  // Could trigger push notifications, SMS alerts, database updates, etc.
                }
              }}
            />

            {/* 🚨 REAL-TIME DAMAGE DETECTION & ALERTS - Live Incident Intelligence */}
            <RealTimeDamageAlert
              className="w-full"
              onIncident={(incident) => {
                console.log('New damage incident detected:', incident);
                // Handle new incident - could trigger notifications, update database, etc.
              }}
              onContractorAlert={(alert) => {
                console.log('Contractor alert:', alert);
                // Handle contractor positioning alert
              }}
            />

            {/* 🌪️ STORM PATH WARNING SYSTEM - Contractor Safety & Positioning */}
            <StormPathWarningSystem
              className="w-full"
              contractorLocation={currentLocation ? {
                lat: currentLocation.coords.latitude,
                lng: currentLocation.coords.longitude
              } : undefined}
            />

            {/* 🚀 ULTIMATE AI INTELLIGENCE SYSTEM - Most Advanced Ever Created */}
            <UltimateAIIntelligenceSystem
              module="contractor"
              currentLocation={currentLocation ? {
                latitude: currentLocation.coords.latitude,
                longitude: currentLocation.coords.longitude
              } : undefined}
              currentData={{
                // Real-time contractor intelligence data
                opportunities: [], // Live storm opportunities with precise timing
                leads: [], // Active customer leads with revenue projections
                customers: [], // Customer database with history
                invoices: [], // Invoice tracking and optimization
                compliance: [], // Real-time compliance monitoring
                projects: [], // Active project portfolio
                
                // Advanced market intelligence
                marketData: {
                  demandSurge: 0,
                  priceVolatility: 0,
                  competitorMovement: [],
                  materialShortages: [],
                  laborDemand: 0
                },
                
                // Live weather intelligence feeds
                weatherData: {
                  currentConditions: {},
                  stormTracking: [],
                  windPatterns: {},
                  temperatureGradients: {},
                  precipitationForecast: {}
                },
                
                // Satellite data streams (GOES-16/17, Himawari-8, Meteosat)
                satelliteFeeds: {
                  goesEast: {},
                  goesWest: {},
                  himawari: {},
                  meteosat: {},
                  noaaViirs: {}
                },
                
                // Advanced competitor analysis
                competitorAnalysis: {
                  locations: [],
                  movement: [],
                  pricing: [],
                  capacity: [],
                  responseTime: []
                },
                
                // Dynamic pricing intelligence
                pricingIntelligence: {
                  realTimeRates: {},
                  demandMultipliers: {},
                  competitivePositioning: {},
                  optimalPricing: []
                },
                
                // Comprehensive risk assessment
                riskAssessment: {
                  weatherRisks: {},
                  marketRisks: {},
                  operationalRisks: {},
                  financialRisks: {},
                  mitigationStrategies: []
                }
              }}
              className="w-full mb-6"
            />

            {/* Quick AI Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Zap className="w-5 h-5 mr-2" />
                  Quick AI Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-green-900 mb-2">AI Capabilities</h4>
                    <ul className="text-sm text-green-700 space-y-1">
                      <li>• Real-time storm opportunity predictions</li>
                      <li>• Live satellite damage assessment</li>
                      <li>• Contract review assistance</li>
                      <li>• Pricing recommendations with market data</li>
                      <li>• Legal deadline reminders</li>
                      <li>• Weather impact forecasting</li>
                    </ul>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2">Instant AI Tools</h4>
                    <div className="space-y-2">
                      <Button size="sm" variant="outline" className="w-full justify-start" data-testid="button-ai-estimate">
                        <DollarSign className="w-4 h-4 mr-2" />
                        Generate Cost Estimate
                      </Button>
                      <Button size="sm" variant="outline" className="w-full justify-start" data-testid="button-ai-contract">
                        <FileText className="w-4 h-4 mr-2" />
                        Review Contract
                      </Button>
                      <Button size="sm" variant="outline" className="w-full justify-start" data-testid="button-ai-compliance">
                        <Shield className="w-4 h-4 mr-2" />
                        Check Compliance
                      </Button>
                      <Button size="sm" variant="outline" className="w-full justify-start" data-testid="button-ai-opportunities">
                        <Target className="w-4 h-4 mr-2" />
                        Find Storm Opportunities
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* AI Insights & Recent Interactions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent AI Intelligence</CardTitle>
                <CardDescription>Your AI assistant's latest analysis and recommendations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <Bot className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Storm damage opportunity detected</p>
                      <p className="text-xs text-gray-500">High-probability tree damage predicted for Miami area - 87% confidence with 24-hour timing window</p>
                      <p className="text-xs text-gray-400">15 minutes ago</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Bot className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Real-time satellite analysis complete</p>
                      <p className="text-xs text-gray-500">Live wind patterns show convergence zones - optimal timing for storm preparation calls</p>
                      <p className="text-xs text-gray-400">32 minutes ago</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Bot className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Market intelligence update</p>
                      <p className="text-xs text-gray-500">Pricing analysis shows 23% rate increase potential for emergency roof repairs in target areas</p>
                      <p className="text-xs text-gray-400">1 hour ago</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Bot className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Florida lien law guidance</p>
                      <p className="text-xs text-gray-500">Provided step-by-step filing instructions for Project #CH-2024-089</p>
                      <p className="text-xs text-gray-400">1 day ago</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Bot className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Insurance claim optimization</p>
                      <p className="text-xs text-gray-500">Reviewed claim documentation and suggested improvements for maximum payout</p>
                      <p className="text-xs text-gray-400">2 days ago</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* AI Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2" />
                  AI Performance & Superiority
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-green-900">Prediction Accuracy</h4>
                      <Badge className="bg-green-600">95.7%</Badge>
                    </div>
                    <p className="text-xs text-green-700">Superior to weather apps by 23%</p>
                  </div>
                  <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-blue-900">Real-time Updates</h4>
                      <Badge className="bg-blue-600">15 min</Badge>
                    </div>
                    <p className="text-xs text-blue-700">News reports update hourly</p>
                  </div>
                  <div className="bg-gradient-to-r from-purple-50 to-violet-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-purple-900">Revenue Impact</h4>
                      <Badge className="bg-purple-600">+31%</Badge>
                    </div>
                    <p className="text-xs text-purple-700">Average contractor increase</p>
                  </div>
                </div>
                
                <div className="mt-4 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg">
                  <h4 className="font-semibold text-orange-900 mb-2">Why Our AI is Superior</h4>
                  <ul className="text-sm text-orange-800 space-y-1">
                    <li>• Live satellite imagery from GOES-16/17 vs delayed weather app data</li>
                    <li>• Real-time wind convergence analysis vs general forecasts</li>
                    <li>• Temperature gradient storm indicators vs basic temperature readings</li>
                    <li>• 15-minute precision timing vs hourly news updates</li>
                    <li>• Professional contractor-focused intelligence vs consumer weather info</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      <ModuleAIAssistant moduleName="Contractor Portal" />
    </div>
  );
}

// LeadCard Component
function LeadCard({ lead }: { lead: any }) {
  const { toast } = useToast();
  
  const acceptLeadMutation = useMutation({
    mutationFn: async (leadId: string) => {
      const response = await apiRequest(`/api/leads/accept`, {
        method: 'POST',
        body: JSON.stringify({ leadId })
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast({
        title: "Lead Accepted",
        description: "Lead has been successfully converted to a customer.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to accept lead. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleAcceptLead = () => {
    acceptLeadMutation.mutate(lead.id);
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'emergency': return 'bg-red-100 text-red-800';
      case 'urgent': return 'bg-orange-100 text-orange-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{lead.damageType}</CardTitle>
        <div className="flex items-center text-sm text-gray-600">
          <MapPin className="w-4 h-4 mr-1" />
          {lead.propertyAddress}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm">Estimated Value:</span>
          <span className="font-semibold text-green-600">
            ${parseFloat(lead.estimatedValue || '0').toLocaleString()}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm">Urgency:</span>
          <Badge className={getUrgencyColor(lead.urgency)}>
            {lead.urgency}
          </Badge>
        </div>
        {lead.notes && (
          <p className="text-sm text-gray-600">
            {lead.notes}
          </p>
        )}
        <div className="flex space-x-2">
          <Button 
            className="flex-1" 
            onClick={handleAcceptLead}
            disabled={acceptLeadMutation.isPending}
            data-testid={`button-claim-lead-${lead.id}`}
          >
            {acceptLeadMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Target className="w-4 h-4 mr-2" />
            )}
            Claim Lead
          </Button>
          <Button variant="outline" data-testid={`button-view-details-${lead.id}`}>
            <Eye className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// PhotoCard Component
function PhotoCard({ photo }: { photo: any }) {
  return (
    <Card className="overflow-hidden">
      <div className="aspect-square relative">
        <img 
          src={photo.thumbnailUrl || photo.fileUrl} 
          alt={photo.fileName}
          className="w-full h-full object-cover"
        />
        {photo.aiDescription && (
          <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2">
            <p className="text-xs truncate">{photo.aiDescription}</p>
          </div>
        )}
      </div>
      <CardContent className="p-3">
        <p className="text-sm font-medium truncate">{photo.fileName}</p>
        <p className="text-xs text-gray-500">
          {new Date(photo.createdAt).toLocaleDateString()}
        </p>
      </CardContent>
    </Card>
  );
}

// PhotoUploadSection Component
function PhotoUploadSection() {
  const { toast } = useToast();
  
  const uploadPhotoMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      
      if (!uploadResponse.ok) {
        throw new Error('Upload failed');
      }
      
      const uploadResult = await uploadResponse.json();
      
      // Analyze photo with AI
      const analysisResponse = await apiRequest('/api/describe', {
        method: 'POST',
        body: JSON.stringify({
          name: file.name,
          url: uploadResult.file.path,
          note: ''
        })
      });
      
      return { uploadResult, analysisResponse };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['photos'] });
      toast({
        title: "Photo Uploaded",
        description: "Photo uploaded and analyzed successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Upload Failed",
        description: error?.message || "Failed to upload photo. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadPhotoMutation.mutate(file);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Camera className="w-5 h-5 mr-2" />
          AI-Powered Photo Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <Camera className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-lg font-medium mb-2">Upload Job Photos</p>
          <p className="text-sm text-gray-600 mb-4">
            AI will automatically analyze damage, measure dimensions, and generate insurance-ready reports
          </p>
          <div className="relative">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              data-testid="photo-upload-input"
            />
            <Button disabled={uploadPhotoMutation.isPending} data-testid="button-upload-photos-main">
              {uploadPhotoMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Upload className="w-4 h-4 mr-2" />
              )}
              Select Photos
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">AI Features</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Automatic damage assessment</li>
              <li>• Tree height & weight estimation</li>
              <li>• Insurance-ready descriptions</li>
              <li>• Measurement overlays</li>
            </ul>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-semibold text-green-900 mb-2">Benefits</h4>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• Reduce claim denials</li>
              <li>• Professional documentation</li>
              <li>• Faster claim processing</li>
              <li>• Higher approval rates</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// JobCostingSection Component
function JobCostingSection() {
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  
  const { data: jobCosts = [], isLoading: jobCostsLoading } = useQuery({
    queryKey: ['job-costs', selectedInvoiceId],
    queryFn: () => selectedInvoiceId ? fetch(`/api/job-costs/${selectedInvoiceId}`).then(r => r.json()) : [],
    enabled: !!selectedInvoiceId
  });
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <FileText className="w-5 h-5 mr-2" />
          AI Job Costing
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-purple-50 p-4 rounded-lg">
          <h4 className="font-semibold text-purple-900 mb-2">Industry Benchmark Analysis</h4>
          <p className="text-sm text-purple-700">
            AI analyzes regional market averages within 150-mile radius and provides detailed cost breakdowns
          </p>
        </div>
        
        {selectedInvoiceId && (
          <div className="space-y-2">
            {jobCostsLoading ? (
              <Loader2 className="w-6 h-6 animate-spin mx-auto" />
            ) : jobCosts.length > 0 ? (
              jobCosts.map((cost: any) => (
                <div key={cost.id} className="flex justify-between">
                  <span className="text-sm">{cost.itemDescription}:</span>
                  <span className="font-medium">${parseFloat(cost.totalCost || '0').toFixed(2)}</span>
                </div>
              ))
            ) : (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Labor (Storm Cleanup):</span>
                  <span className="font-medium">$2,400</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Equipment & Materials:</span>
                  <span className="font-medium">$1,850</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Disposal Fees:</span>
                  <span className="font-medium">$650</span>
                </div>
              </div>
            )}
            <div className="border-t pt-2 flex justify-between font-semibold">
              <span>Total Estimate:</span>
              <span className="text-green-600">
                ${jobCosts.length > 0 
                  ? jobCosts.reduce((sum: number, cost: any) => sum + parseFloat(cost.totalCost || '0'), 0).toFixed(2)
                  : '4,900'
                }
              </span>
            </div>
          </div>
        )}
        
        <Button variant="outline" className="w-full" data-testid="button-generate-estimate">
          <Bot className="w-4 h-4 mr-2" />
          Generate AI Estimate
        </Button>
      </CardContent>
    </Card>
  );
}