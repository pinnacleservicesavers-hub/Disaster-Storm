import { useState, useEffect, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import {
  Building2, User, Mail, Phone, MapPin, Briefcase, Shield, 
  FileCheck, Upload, CheckCircle, ArrowRight, ArrowLeft,
  CreditCard, Heart, Award, Zap, Star, Lock, Globe, Camera,
  Hammer, Paintbrush, Home, TreePine, Wrench, Droplets,
  CircleDollarSign, BadgeCheck, ShieldCheck, Clock,
  Volume2, VolumeX, AlertCircle, Loader2, Plus, X
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

const TRADES = [
  { id: 'roofing', name: 'Roofing', icon: Home, color: 'bg-red-100 text-red-600' },
  { id: 'tree-services', name: 'Tree Services', icon: TreePine, color: 'bg-green-100 text-green-600' },
  { id: 'painting', name: 'Painting', icon: Paintbrush, color: 'bg-purple-100 text-purple-600' },
  { id: 'fencing', name: 'Fencing', icon: Wrench, color: 'bg-amber-100 text-amber-600' },
  { id: 'plumbing', name: 'Plumbing', icon: Droplets, color: 'bg-blue-100 text-blue-600' },
  { id: 'general-contractor', name: 'General Contractor', icon: Hammer, color: 'bg-gray-100 text-gray-600' },
  { id: 'electrical', name: 'Electrical', icon: Zap, color: 'bg-yellow-100 text-yellow-600' },
  { id: 'hvac', name: 'HVAC', icon: Home, color: 'bg-cyan-100 text-cyan-600' },
];

const SUBSCRIPTION_TIERS = [
  {
    id: 'starter',
    name: 'Starter',
    price: 79,
    description: 'Perfect for solo contractors',
    features: [
      'Up to 25 leads/month',
      'Basic AI matching',
      'Email support',
      'Standard response time'
    ],
    popular: false,
    color: 'border-gray-300'
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 129,
    description: 'For growing businesses',
    features: [
      'Up to 100 leads/month',
      'Advanced AI matching',
      'Priority support',
      'CloseBot AI calling',
      'ReviewRocket automation'
    ],
    popular: true,
    color: 'border-blue-500'
  },
  {
    id: 'elite',
    name: 'Elite',
    price: 199,
    description: 'Enterprise-grade features',
    features: [
      'Unlimited leads',
      'Premium AI features',
      'Dedicated support',
      'All 12 modules included',
      'White-label options',
      'API access'
    ],
    popular: false,
    color: 'border-purple-500'
  }
];

const US_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut',
  'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa',
  'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan',
  'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire',
  'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio',
  'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
  'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia',
  'Wisconsin', 'Wyoming'
];

const STEPS = [
  { id: 1, name: 'Business Info', icon: Building2 },
  { id: 2, name: 'Trade Selection', icon: Briefcase },
  { id: 3, name: 'Credentials', icon: Shield },
  { id: 4, name: 'Service Area', icon: MapPin },
  { id: 5, name: 'Plan Selection', icon: CreditCard },
  { id: 6, name: 'Review', icon: CheckCircle }
];

interface FormData {
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  website: string;
  trades: string[];
  yearsInBusiness: string;
  employeeCount: string;
  licenseNumber: string;
  licenseState: string;
  insuranceProvider: string;
  insurancePolicy: string;
  insuranceExpiry: string;
  licenseDocument: File | null;
  insuranceDocument: File | null;
  businessDocument: File | null;
  serviceZipCodes: string[];
  serviceRadius: string;
  subscriptionTier: string;
  isNonprofit: boolean;
  nonprofitEIN: string;
  nonprofitDocument: File | null;
  agreeToTerms: boolean;
  agreeToPrivacy: boolean;
}

export default function WorkHubContractorOnboarding() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [newZipCode, setNewZipCode] = useState('');
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const hasPlayedWelcome = useRef(false);
  const voiceEnabledRef = useRef(true);
  
  const [formData, setFormData] = useState<FormData>({
    businessName: '',
    ownerName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    website: '',
    trades: [],
    yearsInBusiness: '',
    employeeCount: '',
    licenseNumber: '',
    licenseState: '',
    insuranceProvider: '',
    insurancePolicy: '',
    insuranceExpiry: '',
    licenseDocument: null,
    insuranceDocument: null,
    businessDocument: null,
    serviceZipCodes: [],
    serviceRadius: '25',
    subscriptionTier: 'pro',
    isNonprofit: false,
    nonprofitEIN: '',
    nonprofitDocument: null,
    agreeToTerms: false,
    agreeToPrivacy: false
  });

  const updateFormData = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleTrade = (tradeId: string) => {
    setFormData(prev => ({
      ...prev,
      trades: prev.trades.includes(tradeId)
        ? prev.trades.filter(t => t !== tradeId)
        : [...prev.trades, tradeId]
    }));
  };

  const addZipCode = () => {
    if (newZipCode && /^\d{5}$/.test(newZipCode) && !formData.serviceZipCodes.includes(newZipCode)) {
      setFormData(prev => ({
        ...prev,
        serviceZipCodes: [...prev.serviceZipCodes, newZipCode]
      }));
      setNewZipCode('');
    }
  };

  const removeZipCode = (zip: string) => {
    setFormData(prev => ({
      ...prev,
      serviceZipCodes: prev.serviceZipCodes.filter(z => z !== zip)
    }));
  };

  const handleFileUpload = (field: 'licenseDocument' | 'insuranceDocument' | 'businessDocument' | 'nonprofitDocument', file: File | null) => {
    updateFormData(field, file);
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(formData.businessName && formData.ownerName && formData.email && formData.phone && formData.city && formData.state && formData.zipCode);
      case 2:
        return formData.trades.length > 0 && !!formData.yearsInBusiness;
      case 3:
        return !!(formData.licenseNumber || formData.insuranceProvider);
      case 4:
        return formData.serviceZipCodes.length > 0 || !!formData.serviceRadius;
      case 5:
        return !!(formData.subscriptionTier || formData.isNonprofit);
      case 6:
        return formData.agreeToTerms && formData.agreeToPrivacy;
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 6));
    } else {
      toast({
        title: "Please complete all required fields",
        description: "Fill in the required information before proceeding.",
        variant: "destructive"
      });
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(6)) {
      toast({
        title: "Please agree to terms",
        description: "You must agree to the Terms of Service and Privacy Policy.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const submitData = new FormData();
      
      submitData.append('businessName', formData.businessName);
      submitData.append('ownerName', formData.ownerName);
      submitData.append('email', formData.email);
      submitData.append('phone', formData.phone);
      submitData.append('address', formData.address);
      submitData.append('city', formData.city);
      submitData.append('state', formData.state);
      submitData.append('zipCode', formData.zipCode);
      submitData.append('website', formData.website);
      submitData.append('trades', JSON.stringify(formData.trades));
      submitData.append('yearsInBusiness', formData.yearsInBusiness);
      submitData.append('employeeCount', formData.employeeCount);
      submitData.append('licenseNumber', formData.licenseNumber);
      submitData.append('licenseState', formData.licenseState);
      submitData.append('insuranceProvider', formData.insuranceProvider);
      submitData.append('insurancePolicy', formData.insurancePolicy);
      submitData.append('insuranceExpiry', formData.insuranceExpiry);
      submitData.append('serviceZipCodes', JSON.stringify(formData.serviceZipCodes));
      submitData.append('serviceRadius', formData.serviceRadius);
      submitData.append('subscriptionTier', formData.isNonprofit ? 'nonprofit' : formData.subscriptionTier);
      submitData.append('isNonprofit', String(formData.isNonprofit));
      submitData.append('nonprofitEIN', formData.nonprofitEIN);
      submitData.append('status', 'pending_verification');
      
      if (formData.licenseDocument) {
        submitData.append('licenseDocument', formData.licenseDocument);
      }
      if (formData.insuranceDocument) {
        submitData.append('insuranceDocument', formData.insuranceDocument);
      }
      if (formData.businessDocument) {
        submitData.append('businessDocument', formData.businessDocument);
      }
      if (formData.nonprofitDocument) {
        submitData.append('nonprofitDocument', formData.nonprofitDocument);
      }

      const response = await fetch('/api/workhub/contractors/register', {
        method: 'POST',
        body: submitData
      });

      if (!response.ok) throw new Error('Failed to create account');

      setShowSuccessDialog(true);
    } catch (error) {
      toast({
        title: "Registration Failed",
        description: "There was an error creating your account. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const voiceMutation = useMutation({
    mutationFn: async (message: string) => {
      const res = await apiRequest("POST", "/api/closebot/chat", {
        message,
        history: [],
        context: { leadName: "contractor", companyName: "your company", trade: "contractor_onboarding" },
        enableVoice: true
      });
      return res;
    },
    onSuccess: (data: any) => {
      if (data.audioUrl && audioRef.current) {
        audioRef.current.src = data.audioUrl;
        audioRef.current.play();
        setIsPlaying(true);
        audioRef.current.onended = () => setIsPlaying(false);
      }
    },
  });

  useEffect(() => {
    if (!hasPlayedWelcome.current && voiceEnabledRef.current) {
      hasPlayedWelcome.current = true;
      voiceMutation.mutate("Welcome to Strategic Service Savers contractor onboarding. I'm Rachel, and I'll guide you through your registration.");
    }
  }, []);

  const toggleVoice = () => {
    const newState = !isVoiceEnabled;
    setIsVoiceEnabled(newState);
    voiceEnabledRef.current = newState;
    if (!newState && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };

  const playRachelVoice = (prompt: string) => {
    if (voiceEnabledRef.current) {
      voiceMutation.mutate(prompt);
    }
  };

  const speakText = (text: string) => {
    playRachelVoice(text);
  };

  const progress = (currentStep / 6) * 100;

  const selectedTierPrice = formData.isNonprofit ? 0 : 
    SUBSCRIPTION_TIERS.find(t => t.id === formData.subscriptionTier)?.price || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <audio ref={audioRef} className="hidden" />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8" data-testid="onboarding-header">
          <Link to="/workhub" data-testid="link-back-workhub" className="inline-flex items-center gap-2 text-white/70 hover:text-white mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to WorkHub
          </Link>
          <h1 data-testid="text-page-title" className="text-3xl font-bold text-white mb-2">Join Strategic Service Savers</h1>
          <p data-testid="text-page-subtitle" className="text-white/70">Complete your contractor profile in just a few minutes</p>
        </div>

        <div className="flex justify-between items-center mb-8 bg-white/5 rounded-xl p-4 backdrop-blur-sm">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            
            return (
              <div key={step.id} className="flex items-center">
                <div className={`flex flex-col items-center ${index < STEPS.length - 1 ? 'flex-1' : ''}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    isCompleted ? 'bg-green-500 text-white' :
                    isActive ? 'bg-blue-500 text-white ring-4 ring-blue-500/30' :
                    'bg-white/10 text-white/50'
                  }`}>
                    {isCompleted ? <CheckCircle className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                  </div>
                  <span className={`text-xs mt-1 hidden sm:block ${isActive ? 'text-white' : 'text-white/50'}`}>
                    {step.name}
                  </span>
                </div>
                {index < STEPS.length - 1 && (
                  <div className={`h-0.5 w-8 sm:w-12 mx-2 ${
                    isCompleted ? 'bg-green-500' : 'bg-white/10'
                  }`} />
                )}
              </div>
            );
          })}
        </div>

        <Progress value={progress} className="mb-8 h-2" />

        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardContent className="p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {currentStep === 1 && (
                  <div className="space-y-6">
                    <div className="text-center mb-6" data-testid="step-1-header">
                      <Building2 className="w-12 h-12 text-blue-400 mx-auto mb-3" />
                      <h2 data-testid="text-step-1-title" className="text-xl font-semibold text-white">Business Information</h2>
                      <p data-testid="text-step-1-subtitle" className="text-white/60">Tell us about your company</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-white">Business Name *</Label>
                        <Input
                          data-testid="input-business-name"
                          value={formData.businessName}
                          onChange={(e) => updateFormData('businessName', e.target.value)}
                          placeholder="Your Company LLC"
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-white">Owner/Contact Name *</Label>
                        <Input
                          data-testid="input-owner-name"
                          value={formData.ownerName}
                          onChange={(e) => updateFormData('ownerName', e.target.value)}
                          placeholder="John Smith"
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-white">Email Address *</Label>
                        <Input
                          data-testid="input-email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => updateFormData('email', e.target.value)}
                          placeholder="contact@company.com"
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-white">Phone Number *</Label>
                        <Input
                          data-testid="input-phone"
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => updateFormData('phone', e.target.value)}
                          placeholder="(555) 123-4567"
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-white">Street Address</Label>
                      <Input
                        data-testid="input-address"
                        value={formData.address}
                        onChange={(e) => updateFormData('address', e.target.value)}
                        placeholder="123 Main Street"
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                      />
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label className="text-white">City *</Label>
                        <Input
                          data-testid="input-city"
                          value={formData.city}
                          onChange={(e) => updateFormData('city', e.target.value)}
                          placeholder="Austin"
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-white">State *</Label>
                        <Select value={formData.state} onValueChange={(v) => updateFormData('state', v)}>
                          <SelectTrigger data-testid="select-state" className="bg-white/10 border-white/20 text-white">
                            <SelectValue placeholder="Select state" />
                          </SelectTrigger>
                          <SelectContent>
                            {US_STATES.map(state => (
                              <SelectItem key={state} value={state}>{state}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-white">ZIP Code *</Label>
                        <Input
                          data-testid="input-zip"
                          value={formData.zipCode}
                          onChange={(e) => updateFormData('zipCode', e.target.value)}
                          placeholder="78701"
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-white">Website (Optional)</Label>
                      <Input
                        data-testid="input-website"
                        value={formData.website}
                        onChange={(e) => updateFormData('website', e.target.value)}
                        placeholder="https://www.yourcompany.com"
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                      />
                    </div>
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="space-y-6">
                    <div className="text-center mb-6">
                      <Briefcase className="w-12 h-12 text-green-400 mx-auto mb-3" />
                      <h2 className="text-xl font-semibold text-white">Select Your Trades</h2>
                      <p className="text-white/60">Choose all services you offer</p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {TRADES.map(trade => {
                        const Icon = trade.icon;
                        const isSelected = formData.trades.includes(trade.id);
                        
                        return (
                          <button
                            key={trade.id}
                            data-testid={`trade-${trade.id}`}
                            onClick={() => toggleTrade(trade.id)}
                            className={`p-4 rounded-xl border-2 transition-all ${
                              isSelected 
                                ? 'border-blue-500 bg-blue-500/20' 
                                : 'border-white/20 bg-white/5 hover:border-white/40'
                            }`}
                          >
                            <div className={`w-10 h-10 rounded-lg ${trade.color} flex items-center justify-center mx-auto mb-2`}>
                              <Icon className="w-5 h-5" />
                            </div>
                            <span className="text-white text-sm font-medium">{trade.name}</span>
                            {isSelected && (
                              <CheckCircle className="w-5 h-5 text-blue-400 mx-auto mt-2" />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                      <div className="space-y-2">
                        <Label className="text-white">Years in Business *</Label>
                        <Select value={formData.yearsInBusiness} onValueChange={(v) => updateFormData('yearsInBusiness', v)}>
                          <SelectTrigger data-testid="select-years" className="bg-white/10 border-white/20 text-white">
                            <SelectValue placeholder="Select years" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">Less than 1 year</SelectItem>
                            <SelectItem value="2">1-2 years</SelectItem>
                            <SelectItem value="5">3-5 years</SelectItem>
                            <SelectItem value="10">6-10 years</SelectItem>
                            <SelectItem value="15">11-15 years</SelectItem>
                            <SelectItem value="20">16+ years</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-white">Number of Employees</Label>
                        <Select value={formData.employeeCount} onValueChange={(v) => updateFormData('employeeCount', v)}>
                          <SelectTrigger data-testid="select-employees" className="bg-white/10 border-white/20 text-white">
                            <SelectValue placeholder="Select size" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">Just me (solo)</SelectItem>
                            <SelectItem value="2-5">2-5 employees</SelectItem>
                            <SelectItem value="6-10">6-10 employees</SelectItem>
                            <SelectItem value="11-25">11-25 employees</SelectItem>
                            <SelectItem value="26-50">26-50 employees</SelectItem>
                            <SelectItem value="50+">50+ employees</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 3 && (
                  <div className="space-y-6">
                    <div className="text-center mb-6">
                      <Shield className="w-12 h-12 text-purple-400 mx-auto mb-3" />
                      <h2 className="text-xl font-semibold text-white">Credentials & Verification</h2>
                      <p className="text-white/60">Upload your license and insurance documents</p>
                    </div>

                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-6">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5" />
                        <div>
                          <p className="text-yellow-200 font-medium">Verified contractors get 3x more leads!</p>
                          <p className="text-yellow-200/70 text-sm">Upload your credentials to display a verification badge on your profile.</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-white">License Number</Label>
                        <Input
                          data-testid="input-license"
                          value={formData.licenseNumber}
                          onChange={(e) => updateFormData('licenseNumber', e.target.value)}
                          placeholder="Enter license number"
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-white">License State</Label>
                        <Select value={formData.licenseState} onValueChange={(v) => updateFormData('licenseState', v)}>
                          <SelectTrigger data-testid="select-license-state" className="bg-white/10 border-white/20 text-white">
                            <SelectValue placeholder="Select state" />
                          </SelectTrigger>
                          <SelectContent>
                            {US_STATES.map(state => (
                              <SelectItem key={state} value={state}>{state}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="p-4 border border-dashed border-white/30 rounded-xl bg-white/5">
                        <div className="flex items-center justify-between mb-2">
                          <Label className="text-white flex items-center gap-2">
                            <FileCheck className="w-4 h-4" />
                            License Document
                          </Label>
                          {formData.licenseDocument && (
                            <Badge className="bg-green-500/20 text-green-300">Uploaded</Badge>
                          )}
                        </div>
                        <Input
                          data-testid="input-license-doc"
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => handleFileUpload('licenseDocument', e.target.files?.[0] || null)}
                          className="bg-white/10 border-white/20 text-white file:bg-blue-500 file:text-white file:border-0 file:rounded-md"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-white">Insurance Provider</Label>
                        <Input
                          data-testid="input-insurance-provider"
                          value={formData.insuranceProvider}
                          onChange={(e) => updateFormData('insuranceProvider', e.target.value)}
                          placeholder="State Farm, Allstate, etc."
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-white">Policy Number</Label>
                        <Input
                          data-testid="input-insurance-policy"
                          value={formData.insurancePolicy}
                          onChange={(e) => updateFormData('insurancePolicy', e.target.value)}
                          placeholder="Policy number"
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-white">Insurance Expiration Date</Label>
                      <Input
                        data-testid="input-insurance-expiry"
                        type="date"
                        value={formData.insuranceExpiry}
                        onChange={(e) => updateFormData('insuranceExpiry', e.target.value)}
                        className="bg-white/10 border-white/20 text-white"
                      />
                    </div>

                    <div className="p-4 border border-dashed border-white/30 rounded-xl bg-white/5">
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-white flex items-center gap-2">
                          <Shield className="w-4 h-4" />
                          Certificate of Insurance
                        </Label>
                        {formData.insuranceDocument && (
                          <Badge className="bg-green-500/20 text-green-300">Uploaded</Badge>
                        )}
                      </div>
                      <Input
                        data-testid="input-insurance-doc"
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleFileUpload('insuranceDocument', e.target.files?.[0] || null)}
                        className="bg-white/10 border-white/20 text-white file:bg-blue-500 file:text-white file:border-0 file:rounded-md"
                      />
                    </div>
                  </div>
                )}

                {currentStep === 4 && (
                  <div className="space-y-6">
                    <div className="text-center mb-6">
                      <MapPin className="w-12 h-12 text-orange-400 mx-auto mb-3" />
                      <h2 className="text-xl font-semibold text-white">Service Area</h2>
                      <p className="text-white/60">Define where you provide services</p>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-white">Service Radius (miles)</Label>
                        <Select value={formData.serviceRadius} onValueChange={(v) => updateFormData('serviceRadius', v)}>
                          <SelectTrigger data-testid="select-radius" className="bg-white/10 border-white/20 text-white">
                            <SelectValue placeholder="Select radius" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="10">10 miles</SelectItem>
                            <SelectItem value="25">25 miles</SelectItem>
                            <SelectItem value="50">50 miles</SelectItem>
                            <SelectItem value="75">75 miles</SelectItem>
                            <SelectItem value="100">100 miles</SelectItem>
                            <SelectItem value="150">150+ miles</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-white">Specific ZIP Codes (Optional)</Label>
                        <div className="flex gap-2">
                          <Input
                            data-testid="input-add-zip"
                            value={newZipCode}
                            onChange={(e) => setNewZipCode(e.target.value)}
                            placeholder="Enter ZIP code"
                            maxLength={5}
                            className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                          />
                          <Button 
                            data-testid="button-add-zip"
                            onClick={addZipCode} 
                            variant="outline" 
                            className="border-white/20 text-white hover:bg-white/10"
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {formData.serviceZipCodes.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {formData.serviceZipCodes.map(zip => (
                            <Badge 
                              key={zip} 
                              className="bg-blue-500/20 text-blue-300 pl-3 pr-1 py-1.5 flex items-center gap-2"
                            >
                              {zip}
                              <button
                                onClick={() => removeZipCode(zip)}
                                className="hover:bg-white/10 rounded p-0.5"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <Globe className="w-5 h-5 text-blue-400 mt-0.5" />
                        <div>
                          <p className="text-blue-200 font-medium">Your service area helps match leads</p>
                          <p className="text-blue-200/70 text-sm">We'll only send you leads from customers within your defined area.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 5 && (
                  <div className="space-y-6">
                    <div className="text-center mb-6">
                      <CreditCard className="w-12 h-12 text-cyan-400 mx-auto mb-3" />
                      <h2 className="text-xl font-semibold text-white">Choose Your Plan</h2>
                      <p className="text-white/60">Select the subscription that fits your needs</p>
                    </div>

                    <div className="mb-6">
                      <label className="flex items-center gap-3 p-4 bg-pink-500/10 border border-pink-500/30 rounded-xl cursor-pointer hover:bg-pink-500/20 transition-all">
                        <Checkbox
                          data-testid="checkbox-nonprofit"
                          checked={formData.isNonprofit}
                          onCheckedChange={(checked) => updateFormData('isNonprofit', checked === true)}
                          className="border-pink-400 data-[state=checked]:bg-pink-500"
                        />
                        <div className="flex items-center gap-2">
                          <Heart className="w-5 h-5 text-pink-400" />
                          <div>
                            <span className="text-white font-medium">I'm a 501(c)(3) Non-Profit Organization</span>
                            <p className="text-pink-200/70 text-sm">Verified non-profits get FREE access to all features!</p>
                          </div>
                        </div>
                      </label>
                    </div>

                    {formData.isNonprofit ? (
                      <div className="space-y-4">
                        <div className="text-center p-6 bg-green-500/10 border border-green-500/30 rounded-xl">
                          <BadgeCheck className="w-12 h-12 text-green-400 mx-auto mb-3" />
                          <h3 className="text-xl font-semibold text-white mb-2">Free Non-Profit Access</h3>
                          <p className="text-green-200/70">Provide your EIN for verification</p>
                        </div>
                        
                        <div className="space-y-2">
                          <Label className="text-white">501(c)(3) EIN Number *</Label>
                          <Input
                            data-testid="input-ein"
                            value={formData.nonprofitEIN}
                            onChange={(e) => updateFormData('nonprofitEIN', e.target.value)}
                            placeholder="XX-XXXXXXX"
                            className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                          />
                        </div>

                        <div className="p-4 border border-dashed border-white/30 rounded-xl bg-white/5">
                          <div className="flex items-center justify-between mb-2">
                            <Label className="text-white flex items-center gap-2">
                              <FileCheck className="w-4 h-4" />
                              501(c)(3) Determination Letter
                            </Label>
                            {formData.nonprofitDocument && (
                              <Badge className="bg-green-500/20 text-green-300">Uploaded</Badge>
                            )}
                          </div>
                          <Input
                            data-testid="input-nonprofit-doc"
                            type="file"
                            accept=".pdf"
                            onChange={(e) => handleFileUpload('nonprofitDocument', e.target.files?.[0] || null)}
                            className="bg-white/10 border-white/20 text-white file:bg-pink-500 file:text-white file:border-0 file:rounded-md"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {SUBSCRIPTION_TIERS.map(tier => (
                          <button
                            key={tier.id}
                            data-testid={`tier-${tier.id}`}
                            onClick={() => updateFormData('subscriptionTier', tier.id)}
                            className={`relative p-5 rounded-xl border-2 text-left transition-all ${
                              formData.subscriptionTier === tier.id
                                ? `${tier.color} bg-white/10`
                                : 'border-white/20 bg-white/5 hover:border-white/40'
                            }`}
                          >
                            {tier.popular && (
                              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500 text-white">
                                Most Popular
                              </Badge>
                            )}
                            <h3 className="text-lg font-bold text-white mb-1">{tier.name}</h3>
                            <div className="text-2xl font-bold text-white mb-2">
                              ${tier.price}<span className="text-sm font-normal text-white/60">/mo</span>
                            </div>
                            <p className="text-white/60 text-sm mb-4">{tier.description}</p>
                            <ul className="space-y-2">
                              {tier.features.map((feature, i) => (
                                <li key={i} className="flex items-center gap-2 text-sm text-white/80">
                                  <CheckCircle className="w-4 h-4 text-green-400" />
                                  {feature}
                                </li>
                              ))}
                            </ul>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {currentStep === 6 && (
                  <div className="space-y-6">
                    <div className="text-center mb-6">
                      <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                      <h2 className="text-xl font-semibold text-white">Review & Confirm</h2>
                      <p className="text-white/60">Review your information before submitting</p>
                    </div>

                    <div className="space-y-4">
                      <Card className="bg-white/5 border-white/10">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-white text-sm">Business Details</CardTitle>
                        </CardHeader>
                        <CardContent className="text-white/70 text-sm space-y-1">
                          <p><strong className="text-white">Company:</strong> {formData.businessName}</p>
                          <p><strong className="text-white">Owner:</strong> {formData.ownerName}</p>
                          <p><strong className="text-white">Contact:</strong> {formData.email} | {formData.phone}</p>
                          <p><strong className="text-white">Location:</strong> {formData.city}, {formData.state} {formData.zipCode}</p>
                        </CardContent>
                      </Card>

                      <Card className="bg-white/5 border-white/10">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-white text-sm">Selected Trades</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex flex-wrap gap-2">
                            {formData.trades.map(tradeId => {
                              const trade = TRADES.find(t => t.id === tradeId);
                              return trade ? (
                                <Badge key={tradeId} className={trade.color}>{trade.name}</Badge>
                              ) : null;
                            })}
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-white/5 border-white/10">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-white text-sm">Subscription Plan</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center justify-between">
                            <span className="text-white font-medium">
                              {formData.isNonprofit ? 'Non-Profit (FREE)' : 
                                SUBSCRIPTION_TIERS.find(t => t.id === formData.subscriptionTier)?.name}
                            </span>
                            <span className="text-2xl font-bold text-white">
                              ${selectedTierPrice}/mo
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="space-y-3 pt-4">
                      <label className="flex items-start gap-3 p-3 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10 transition-all">
                        <Checkbox
                          data-testid="checkbox-terms"
                          checked={formData.agreeToTerms}
                          onCheckedChange={(checked) => updateFormData('agreeToTerms', checked === true)}
                          className="mt-1"
                        />
                        <span className="text-white/80 text-sm">
                          I agree to the <Link to="/workhub/terms" className="text-blue-400 hover:underline">Terms of Service</Link> and 
                          understand that Strategic Service Savers acts as a neutral marketplace connector.
                        </span>
                      </label>

                      <label className="flex items-start gap-3 p-3 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10 transition-all">
                        <Checkbox
                          data-testid="checkbox-privacy"
                          checked={formData.agreeToPrivacy}
                          onCheckedChange={(checked) => updateFormData('agreeToPrivacy', checked === true)}
                          className="mt-1"
                        />
                        <span className="text-white/80 text-sm">
                          I agree to the <Link to="/workhub/legal" className="text-blue-400 hover:underline">Privacy Policy</Link> and 
                          consent to receive communications about leads and platform updates.
                        </span>
                      </label>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            <div className="flex justify-between mt-8 pt-6 border-t border-white/10">
              <Button
                data-testid="button-back"
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
                className="border-white/20 text-white hover:bg-white/10"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>

              {currentStep < 6 ? (
                <Button
                  data-testid="button-next"
                  onClick={nextStep}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  data-testid="button-submit"
                  onClick={handleSubmit}
                  disabled={isSubmitting || !formData.agreeToTerms || !formData.agreeToPrivacy}
                  className="bg-green-600 hover:bg-green-700 text-white min-w-[140px]"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Complete Registration
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="fixed bottom-6 right-6">
          <Button
            data-testid="button-voice-toggle"
            variant="outline"
            size="icon"
            onClick={toggleVoice}
            className="w-12 h-12 rounded-full bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            {isPlaying ? <Volume2 className="w-5 h-5 animate-pulse" /> : isVoiceEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="bg-slate-900 border-white/20">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-green-400" />
              Registration Submitted!
            </DialogTitle>
            <DialogDescription className="text-white/70">
              Your contractor profile has been submitted for verification. 
              You'll receive an email confirmation within 24-48 hours once your credentials are verified.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mt-4">
            <Button
              data-testid="button-goto-dashboard"
              onClick={() => navigate('/workhub/contractor')}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              Go to Dashboard
            </Button>
            <Button
              data-testid="button-goto-home"
              variant="outline"
              onClick={() => navigate('/workhub')}
              className="flex-1 border-white/20 text-white hover:bg-white/10"
            >
              Back to Home
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
