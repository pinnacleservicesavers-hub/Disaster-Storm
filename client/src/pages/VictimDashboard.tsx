import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { homeowners } from '@shared/schema';
import { 
  Home, Camera, FileText, Users, AlertTriangle, MapPin, Clock, 
  Phone, Mail, User, LogOut, Plus, CheckCircle, AlertCircle, 
  Wrench, Cloud, Zap, Shield, Heart, Activity, ScanLine,
  MessageSquare, Bell, Star, Building2, Timer, Navigation,
  Smartphone, Globe, Wind, Thermometer, Gauge, Eye,
  RefreshCw, Search, Filter, Calendar, TrendingUp,
  Clipboard, DollarSign, Award, Target, Radio, Siren,
  Briefcase, FileCheck, PersonStanding, Lightbulb, Volume2, VolumeX,
  Image as ImageIcon, X, Loader2, Sparkles, Upload
} from 'lucide-react';
import { FadeIn, PulseAlert, StaggerContainer, StaggerItem, HoverLift, CountUp, ScaleIn, SlideIn } from '@/components/ui/animations';
import { apiRequest } from '@/lib/queryClient';

type VictimUser = typeof homeowners.$inferSelect;

interface EmergencyStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  priority: 'critical' | 'high' | 'medium' | 'low';
  estimatedTime: string;
  icon: any;
  category: 'safety' | 'documentation' | 'insurance' | 'repairs';
  dueDate?: string;
}

interface EmergencyAlert {
  id: string;
  type: 'weather' | 'evacuation' | 'safety' | 'service';
  severity: 'critical' | 'high' | 'medium' | 'info';
  title: string;
  message: string;
  timestamp: string;
  actionRequired: boolean;
  location: string;
}

interface AssistanceRequest {
  id: string;
  type: 'emergency' | 'contractor' | 'insurance' | 'legal';
  title: string;
  status: 'submitted' | 'assigned' | 'in_progress' | 'completed';
  priority: 'urgent' | 'high' | 'medium' | 'low';
  submittedAt: string;
  assignedTo?: string;
  estimatedCompletion?: string;
  notes: string;
}

export default function VictimDashboard() {
  const [user, setUser] = useState<VictimUser | null>(null);
  const [activeAlert, setActiveAlert] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [emergencyMode, setEmergencyMode] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [isVoiceGuideActive, setIsVoiceGuideActive] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [isContractorModalOpen, setIsContractorModalOpen] = useState(false);
  const [isShelterModalOpen, setIsShelterModalOpen] = useState(false);
  const [isSBAModalOpen, setIsSBAModalOpen] = useState(false);
  const [isPhotoUploadModalOpen, setIsPhotoUploadModalOpen] = useState(false);
  const [uploadedPhotos, setUploadedPhotos] = useState<Array<{file: File, preview: string, analyzing: boolean, analysis?: any}>>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [claimForm, setClaimForm] = useState({
    insuranceCompany: '',
    policyNumber: '',
    claimNumber: '',
    dateOfLoss: '',
    damageType: '',
    estimatedDamage: '',
    adjusterName: '',
    adjusterPhone: '',
    adjusterEmail: '',
    notes: ''
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  const startVoiceGuide = async () => {
    if (!isVoiceGuideActive) {
      setIsVoiceGuideActive(true);
      
      const voiceContent = `Welcome to the Storm Victim Portal. We're here to help you through this difficult time. You are not alone. 

First, know that help is available. We have many qualified contractors ready to assist you, and you have the power to choose who works on your property. You can browse our contractor directory, review their qualifications, and select the professionals you trust most.

With your consent, our system can share your information with contractors so they can reach out to help you quickly. You remain in control - you decide who gets your information and when.

Our AI assistant is available 24/7 to answer any questions you have. Ask about contractors, what repairs you need, insurance claims, or anything else. The AI can respond by text or voice, providing helpful information exactly when you need it.

Important resources available to you: FEMA disaster assistance is available by calling 1-800-621-3362. FEMA can help homeowners, renters, and business owners with temporary housing, home repairs, and other disaster-related expenses. 

We also have information about emergency shelters, SBA disaster loans for businesses and homeowners, and contractors who work with little to no out-of-pocket costs - they bill your insurance company directly.

For emergency tree removal, Strategic Land Management LLC specializes in storm cleanup and works directly with insurance companies.

You can ask our AI assistant about any of these resources, and it will guide you to the help you need. Remember, help is out there, and we're here to connect you with it. Take a deep breath - we'll get through this together.`;
      
      try {
        // Call server API to generate natural-sounding voice using ElevenLabs Lily (natural female voice)
        const response = await fetch('/api/voice-ai/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text: voiceContent }),
        });

        if (!response.ok) {
          throw new Error('Voice generation failed');
        }

        const data = await response.json();
        
        if (data.audioBase64) {
          // Create and play audio
          const audio = new Audio(`data:audio/mpeg;base64,${data.audioBase64}`);
          
          audio.onended = () => {
            setIsVoiceGuideActive(false);
          };
          
          audio.onerror = () => {
            console.error('Audio playback error');
            setIsVoiceGuideActive(false);
          };
          
          await audio.play();
        } else {
          setIsVoiceGuideActive(false);
        }
      } catch (error) {
        console.error('Voice guide error:', error);
        setIsVoiceGuideActive(false);
      }
    } else {
      setIsVoiceGuideActive(false);
    }
  };

  // Enhanced mock emergency steps
  const { data: emergencySteps = [] } = useQuery<EmergencyStep[]>({
    queryKey: ['emergency-steps', user?.id],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 300));
      return [
        {
          id: '1',
          title: 'Ensure Personal Safety',
          description: 'Verify you and family members are safe and accounted for',
          status: 'completed',
          priority: 'critical',
          estimatedTime: '5 min',
          icon: Shield,
          category: 'safety',
          dueDate: 'Immediate'
        },
        {
          id: '2',
          title: 'Document Property Damage',
          description: 'Take comprehensive photos and videos of all property damage',
          status: 'completed',
          priority: 'critical',
          estimatedTime: '30 min',
          icon: Camera,
          category: 'documentation'
        },
        {
          id: '3',
          title: 'Contact Insurance Provider',
          description: 'File initial claim with your insurance company immediately',
          status: 'in_progress',
          priority: 'high',
          estimatedTime: '45 min',
          icon: Phone,
          category: 'insurance',
          dueDate: '24 hours'
        },
        {
          id: '4',
          title: 'Secure Property',
          description: 'Board up broken windows, tarp damaged roof areas',
          status: 'pending',
          priority: 'high',
          estimatedTime: '2-4 hours',
          icon: Home,
          category: 'safety',
          dueDate: '48 hours'
        },
        {
          id: '5',
          title: 'Find Emergency Contractors',
          description: 'Get quotes from verified emergency repair contractors',
          status: 'pending',
          priority: 'high',
          estimatedTime: '1-2 hours',
          icon: Users,
          category: 'repairs'
        },
        {
          id: '6',
          title: 'Submit FEMA Application',
          description: 'Apply for federal disaster assistance if applicable',
          status: 'pending',
          priority: 'medium',
          estimatedTime: '60 min',
          icon: FileText,
          category: 'insurance',
          dueDate: '30 days'
        }
      ];
    },
    refetchInterval: autoRefresh ? 30000 : false,
  });

  // Mock emergency alerts
  const { data: emergencyAlerts = [] } = useQuery<EmergencyAlert[]>({
    queryKey: ['emergency-alerts', user?.state],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 200));
      return [
        {
          id: '1',
          type: 'weather',
          severity: 'high',
          title: 'Severe Weather Warning',
          message: 'High winds and heavy rain expected in your area. Avoid travel if possible.',
          timestamp: '2024-01-15T16:30:00Z',
          actionRequired: false,
          location: 'Tampa Bay Area'
        },
        {
          id: '2',
          type: 'service',
          severity: 'medium',
          title: 'Power Restoration Update',
          message: 'Power crews working in your neighborhood. Estimated restoration: 6-8 hours.',
          timestamp: '2024-01-15T15:45:00Z',
          actionRequired: false,
          location: 'Your Area'
        },
        {
          id: '3',
          type: 'safety',
          severity: 'critical',
          title: 'Emergency Shelter Available',
          message: 'Emergency shelter open at Community Center. Transportation available.',
          timestamp: '2024-01-15T14:20:00Z',
          actionRequired: true,
          location: 'Tampa Community Center'
        }
      ];
    },
    refetchInterval: autoRefresh ? 10000 : false,
  });

  // Mock assistance requests
  const { data: assistanceRequests = [] } = useQuery<AssistanceRequest[]>({
    queryKey: ['assistance-requests', user?.id],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 250));
      return [
        {
          id: '1',
          type: 'contractor',
          title: 'Emergency Roof Repair',
          status: 'assigned',
          priority: 'urgent',
          submittedAt: '2024-01-15T10:30:00Z',
          assignedTo: 'Tampa Emergency Roofing',
          estimatedCompletion: '2024-01-16T17:00:00Z',
          notes: 'Tarp installation completed, permanent repairs scheduled'
        },
        {
          id: '2',
          type: 'insurance',
          title: 'Insurance Claim Processing',
          status: 'in_progress',
          priority: 'high',
          submittedAt: '2024-01-15T09:15:00Z',
          assignedTo: 'Claims Adjuster Sarah M.',
          estimatedCompletion: '2024-01-18T12:00:00Z',
          notes: 'Adjuster scheduled for site visit tomorrow'
        },
        {
          id: '3',
          type: 'emergency',
          title: 'Temporary Housing Assistance',
          status: 'completed',
          priority: 'urgent',
          submittedAt: '2024-01-14T20:45:00Z',
          assignedTo: 'Red Cross Emergency Services',
          notes: 'Hotel voucher provided for 3 nights'
        }
      ];
    },
    refetchInterval: autoRefresh ? 20000 : false,
  });

  useEffect(() => {
    // Get user data from localStorage or set mock data
    const userData = localStorage.getItem('victimUser');
    if (userData) {
      setUser(JSON.parse(userData));
    } else {
      // Set mock user data for demo
      const mockUser: any = {
        id: 'victim-user-001',
        firstName: 'Stacey',
        lastName: 'Ballard',
        email: 'stacey.ballard@email.com',
        phone: '(813) 555-0123',
        propertyAddress: '2847 Bayshore Drive',
        city: 'Tampa',
        state: 'FL',
        zipCode: '33602',
        propertyType: 'residential',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      setUser(mockUser);
      localStorage.setItem('victimUser', JSON.stringify(mockUser));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('victimUser');
    window.location.href = '/victim/login';
  };

  const handleEmergencyCall = () => {
    if (confirm('This will call emergency services (911). Continue?')) {
      window.open('tel:911', '_self');
    }
  };

  const handleClaimSubmit = async () => {
    try {
      // Validate required fields
      if (!claimForm.insuranceCompany || !claimForm.dateOfLoss) {
        toast({
          variant: "destructive",
          title: "Missing Information",
          description: "Please fill in required fields: Insurance Company and Date of Loss"
        });
        return;
      }

      // Submit claim to backend
      const response = await apiRequest('/api/victim/insurance-claim', {
        method: 'POST',
        body: JSON.stringify({
          homeownerId: user?.id,
          ...claimForm
        })
      });

      toast({
        title: "Claim Filed Successfully",
        description: "Your insurance claim information has been saved. A copy has been sent to your email."
      });

      // Reset form and close modal
      setClaimForm({
        insuranceCompany: '',
        policyNumber: '',
        claimNumber: '',
        dateOfLoss: '',
        damageType: '',
        estimatedDamage: '',
        adjusterName: '',
        adjusterPhone: '',
        adjusterEmail: '',
        notes: ''
      });
      setIsClaimModalOpen(false);
      
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error Filing Claim",
        description: error.message || "Failed to save claim information"
      });
    }
  };

  const handleCallInsurance = () => {
    if (claimForm.insuranceCompany) {
      const phone = '18006213362'; // Default to FEMA, or use user's insurance company number
      window.open(`tel:${phone}`, '_self');
    } else {
      toast({
        title: "Select Insurance Company",
        description: "Please select your insurance company first"
      });
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const newPhotos = Array.from(files).map(file => ({
      file,
      preview: URL.createObjectURL(file),
      analyzing: false
    }));

    setUploadedPhotos(prev => [...prev, ...newPhotos]);
    
    toast({
      title: "Photos Added",
      description: `${files.length} photo(s) added. Click "Analyze with AI" to get damage assessment.`
    });
  };

  const handlePhotoAnalysis = async () => {
    if (uploadedPhotos.length === 0) {
      toast({
        title: "No Photos",
        description: "Please upload photos first"
      });
      return;
    }

    setIsAnalyzing(true);
    
    try {
      // Mark all photos as analyzing
      setUploadedPhotos(prev => prev.map(p => ({ ...p, analyzing: true })));

      // Convert files to base64
      const photoPromises = uploadedPhotos.map(async (photo) => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(photo.file);
        });
      });

      const base64Images = await Promise.all(photoPromises);

      // Send to backend for AI analysis
      const response = await apiRequest('/api/victim/analyze-damage', {
        method: 'POST',
        body: JSON.stringify({
          images: base64Images,
          homeownerId: user?.id
        })
      });

      // Update photos with analysis results
      setUploadedPhotos(prev => prev.map((photo, index) => ({
        ...photo,
        analyzing: false,
        analysis: response.analyses[index]
      })));

      toast({
        title: "✨ AI Analysis Complete",
        description: `Analyzed ${uploadedPhotos.length} photo(s). Review the damage assessment below.`
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Analysis Failed",
        description: error.message || "Failed to analyze photos"
      });
      
      // Reset analyzing state
      setUploadedPhotos(prev => prev.map(p => ({ ...p, analyzing: false })));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCameraCapture = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const removePhoto = (index: number) => {
    setUploadedPhotos(prev => {
      const newPhotos = [...prev];
      URL.revokeObjectURL(newPhotos[index].preview);
      newPhotos.splice(index, 1);
      return newPhotos;
    });
  };

  const getStepStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return { text: 'COMPLETE', variant: 'default' as const, color: 'bg-green-500' };
      case 'in_progress': return { text: 'IN PROGRESS', variant: 'secondary' as const, color: 'bg-blue-500' };
      case 'blocked': return { text: 'BLOCKED', variant: 'destructive' as const, color: 'bg-red-500' };
      default: return { text: 'PENDING', variant: 'outline' as const, color: 'bg-gray-400' };
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'border-l-red-500 bg-red-50 dark:bg-red-900/20';
      case 'high': return 'border-l-orange-500 bg-orange-50 dark:bg-orange-900/20';
      case 'medium': return 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/20';
      default: return 'border-l-green-500 bg-green-50 dark:bg-green-900/20';
    }
  };

  const getAlertSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 border-red-200 dark:border-red-800';
      case 'high': return 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 border-orange-200 dark:border-orange-800';
      case 'medium': return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800';
      default: return 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800';
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-amber-50 flex items-center justify-center">
        <ScaleIn>
          <div className="text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="h-12 w-12 border-4 border-red-600 border-t-transparent rounded-full mx-auto mb-4"
            />
            <p className="text-gray-600">Loading emergency dashboard...</p>
          </div>
        </ScaleIn>
      </div>
    );
  }

  const userInitials = `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`
    .toUpperCase()
    .slice(0, 2) || 'U';

  const completedSteps = emergencySteps.filter(step => step.status === 'completed').length;
  const criticalAlerts = emergencyAlerts.filter(alert => alert.severity === 'critical').length;
  const activeRequests = assistanceRequests.filter(req => req.status !== 'completed').length;
  const completionRate = Math.round((completedSteps / emergencySteps.length) * 100);

  return (
    <div className="space-y-6" data-testid="victim-dashboard">
      {/* Enhanced Header Section */}
      <FadeIn>
        <div className="relative overflow-hidden bg-gradient-to-r from-red-900 via-orange-900 to-amber-900 dark:from-red-800 dark:via-orange-800 dark:to-amber-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          {/* Animated background elements */}
          <div className="absolute inset-0 opacity-10">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-white rounded-full"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ 
                  opacity: [0, 1, 0],
                  scale: [0, 2, 0],
                  x: [0, Math.random() * 60 - 30],
                  y: [0, Math.random() * 60 - 30]
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  delay: i * 0.4,
                  ease: "easeInOut"
                }}
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`
                }}
              />
            ))}
          </div>

          <div className="relative">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <ScaleIn>
                  <div className="relative">
                    <div className="w-16 h-16 bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-xl p-3">
                      <Shield className="h-10 w-10 text-orange-400" />
                    </div>
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute -top-1 -right-1 h-6 w-6 bg-green-500 rounded-full flex items-center justify-center"
                    >
                      <CheckCircle className="h-3 w-3 text-white" />
                    </motion.div>
                  </div>
                </ScaleIn>
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2">
                    Emergency Assistance Portal
                  </h1>
                  <p className="text-orange-200">
                    Welcome {user.firstName} - Your dedicated disaster recovery command center
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Button
                  variant={autoRefresh ? "default" : "secondary"}
                  size="sm"
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  data-testid="button-auto-refresh"
                  className="bg-white/10 hover:bg-white/20 text-white border-white/20"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
                  Live Updates
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleEmergencyCall}
                  data-testid="button-emergency-call"
                  className="bg-red-600 hover:bg-red-700 text-white font-bold"
                >
                  <Siren className="h-4 w-4 mr-2" />
                  Call 911
                </Button>
                <Button
                  variant="secondary"
                  onClick={handleLogout}
                  data-testid="button-logout"
                  className="bg-white/10 hover:bg-white/20 text-white border-white/20"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={startVoiceGuide}
                  className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white border-white/20"
                  data-testid="button-voice-guide"
                  aria-label="Voice guide for Victim Portal"
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
              </div>
            </div>

            {/* KPI Cards */}
            <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StaggerItem>
                <HoverLift>
                  <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                    <CardContent className="p-4 text-center">
                      <div className="flex items-center justify-center mb-2">
                        <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
                        <span className="text-sm font-medium text-white">Recovery Progress</span>
                      </div>
                      <div className="text-2xl font-bold text-white" data-testid="text-recovery-progress">
                        <CountUp end={completionRate} duration={1} suffix="%" />
                      </div>
                      <div className="text-xs text-orange-200">{completedSteps}/{emergencySteps.length} steps done</div>
                    </CardContent>
                  </Card>
                </HoverLift>
              </StaggerItem>

              <StaggerItem>
                <HoverLift>
                  <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                    <CardContent className="p-4 text-center">
                      <div className="flex items-center justify-center mb-2">
                        <AlertTriangle className="h-5 w-5 text-red-400 mr-2" />
                        <span className="text-sm font-medium text-white">Critical Alerts</span>
                      </div>
                      <div className="text-2xl font-bold text-white" data-testid="text-critical-alerts">
                        <CountUp end={criticalAlerts} duration={1} />
                      </div>
                      <div className="text-xs text-orange-200">require attention</div>
                    </CardContent>
                  </Card>
                </HoverLift>
              </StaggerItem>

              <StaggerItem>
                <HoverLift>
                  <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                    <CardContent className="p-4 text-center">
                      <div className="flex items-center justify-center mb-2">
                        <FileCheck className="h-5 w-5 text-blue-400 mr-2" />
                        <span className="text-sm font-medium text-white">Active Requests</span>
                      </div>
                      <div className="text-2xl font-bold text-white" data-testid="text-active-requests">
                        <CountUp end={activeRequests} duration={1} />
                      </div>
                      <div className="text-xs text-orange-200">in progress</div>
                    </CardContent>
                  </Card>
                </HoverLift>
              </StaggerItem>

              <StaggerItem>
                <HoverLift>
                  <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                    <CardContent className="p-4 text-center">
                      <div className="flex items-center justify-center mb-2">
                        <PersonStanding className="h-5 w-5 text-purple-400 mr-2" />
                        <span className="text-sm font-medium text-white">Status</span>
                      </div>
                      <div className="text-lg font-bold text-white" data-testid="text-status">
                        Safe & Secure
                      </div>
                      <div className="text-xs text-orange-200">last updated 5 min ago</div>
                    </CardContent>
                  </Card>
                </HoverLift>
              </StaggerItem>
            </StaggerContainer>

            {/* User Profile Section */}
            <div className="mt-6 flex items-center justify-between bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-red-500 text-white rounded-full flex items-center justify-center text-lg font-bold">
                    {userInitials}
                  </div>
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"
                  />
                </div>
                <div>
                  <h3 className="font-semibold text-white">{user.firstName} {user.lastName}</h3>
                  <p className="text-sm text-orange-200">{user.propertyAddress}, {user.city}, {user.state}</p>
                  <p className="text-xs text-orange-300">Emergency ID: {user.id}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-white font-medium">Account Status</div>
                <Badge className="bg-green-600 text-white">
                  <Shield className="w-3 h-3 mr-1" />
                  Verified
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </FadeIn>

      {/* Emergency Alert Banner */}
      {criticalAlerts > 0 && (
        <PulseAlert intensity="strong">
          <Alert className="bg-red-100 dark:bg-red-900/20 border-red-500">
            <Siren className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800 dark:text-red-200 font-medium">
              <strong>CRITICAL ALERT:</strong> You have {criticalAlerts} urgent notification(s) requiring immediate attention.
              <Button variant="link" className="text-red-800 dark:text-red-200 p-0 h-auto font-semibold ml-2">
                View All Alerts →
              </Button>
            </AlertDescription>
          </Alert>
        </PulseAlert>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid grid-cols-4 w-fit">
          <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
          <TabsTrigger value="steps" data-testid="tab-steps">Recovery Steps</TabsTrigger>
          <TabsTrigger value="alerts" data-testid="tab-alerts">Alerts & Updates</TabsTrigger>
          <TabsTrigger value="requests" data-testid="tab-requests">My Requests</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <FadeIn>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Quick Actions */}
              <div className="lg:col-span-2">
                <h3 className="text-xl font-semibold mb-4 flex items-center">
                  <Zap className="h-5 w-5 text-yellow-500 mr-2" />
                  Emergency Quick Actions
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <HoverLift>
                    <Card 
                      className="cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-300 group"
                      onClick={() => setIsPhotoUploadModalOpen(true)}
                      data-testid="card-report-damage"
                    >
                      <CardContent className="p-4 text-center">
                        <div className="w-12 h-12 mx-auto mb-3 bg-red-100 dark:bg-red-900/50 rounded-full flex items-center justify-center group-hover:bg-red-200 dark:group-hover:bg-red-800/50 transition-colors">
                          <Camera className="h-6 w-6 text-red-600" />
                        </div>
                        <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">Report Damage</h4>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Upload photos & details</p>
                      </CardContent>
                    </Card>
                  </HoverLift>
                  
                  <HoverLift>
                    <Card 
                      className="cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-300 group"
                      onClick={() => setIsContractorModalOpen(true)}
                      data-testid="card-get-help-contractors"
                    >
                      <CardContent className="p-4 text-center">
                        <div className="w-12 h-12 mx-auto mb-3 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center group-hover:bg-blue-200 dark:group-hover:bg-blue-800/50 transition-colors">
                          <Users className="h-6 w-6 text-blue-600" />
                        </div>
                        <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">Get Help</h4>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Find contractors</p>
                      </CardContent>
                    </Card>
                  </HoverLift>

                  <HoverLift>
                    <Card 
                      className="cursor-pointer hover:bg-green-50 dark:hover:bg-green-900/20 transition-all duration-300 group"
                      onClick={() => setIsClaimModalOpen(true)}
                      data-testid="card-file-insurance-claim"
                    >
                      <CardContent className="p-4 text-center">
                        <div className="w-12 h-12 mx-auto mb-3 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center group-hover:bg-green-200 dark:group-hover:bg-green-800/50 transition-colors">
                          <Phone className="h-6 w-6 text-green-600" />
                        </div>
                        <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">Insurance</h4>
                        <p className="text-xs text-gray-600 dark:text-gray-400">File claim</p>
                      </CardContent>
                    </Card>
                  </HoverLift>

                  <HoverLift>
                    <Card 
                      className="cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all duration-300 group"
                      onClick={() => setIsShelterModalOpen(true)}
                      data-testid="card-find-shelter"
                    >
                      <CardContent className="p-4 text-center">
                        <div className="w-12 h-12 mx-auto mb-3 bg-purple-100 dark:bg-purple-900/50 rounded-full flex items-center justify-center group-hover:bg-purple-200 dark:group-hover:bg-purple-800/50 transition-colors">
                          <Home className="h-6 w-6 text-purple-600" />
                        </div>
                        <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">Shelter</h4>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Find housing</p>
                      </CardContent>
                    </Card>
                  </HoverLift>
                </div>

                {/* Progress Overview */}
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <TrendingUp className="h-5 w-5 text-blue-500 mr-2" />
                      Recovery Progress
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Overall Completion</span>
                        <span className="text-sm text-muted-foreground">{completionRate}%</span>
                      </div>
                      <Progress value={completionRate} className="h-3" />
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                      <div>
                        <div className="text-lg font-bold text-green-600">{emergencySteps.filter(s => s.status === 'completed').length}</div>
                        <div className="text-xs text-muted-foreground">Completed</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-blue-600">{emergencySteps.filter(s => s.status === 'in_progress').length}</div>
                        <div className="text-xs text-muted-foreground">In Progress</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-gray-600">{emergencySteps.filter(s => s.status === 'pending').length}</div>
                        <div className="text-xs text-muted-foreground">Pending</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-red-600">{emergencySteps.filter(s => s.status === 'blocked').length}</div>
                        <div className="text-xs text-muted-foreground">Blocked</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Emergency Resources */}
              <div className="space-y-6">
                <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
                  <CardHeader>
                    <CardTitle className="text-red-800 dark:text-red-200 flex items-center">
                      <Siren className="h-5 w-5 mr-2" />
                      Emergency Contacts
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button
                      className="w-full bg-red-600 hover:bg-red-700 text-white font-bold"
                      onClick={handleEmergencyCall}
                      data-testid="button-call-911"
                    >
                      <Phone className="h-4 w-4 mr-2" />
                      Call 911 - Emergency
                    </Button>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="font-medium text-red-800 dark:text-red-200">Poison Control:</span>
                        <span className="text-red-600">1-800-222-1222</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-red-800 dark:text-red-200">Red Cross:</span>
                        <span className="text-red-600">1-800-733-2767</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-red-800 dark:text-red-200">FEMA:</span>
                        <span className="text-red-600">1-800-621-3362</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <MapPin className="h-5 w-5 text-blue-500 mr-2" />
                      Nearby Resources
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div className="font-medium text-blue-900 dark:text-blue-100">Community Shelter</div>
                        <div className="text-sm text-blue-700 dark:text-blue-300">Tampa Community Center - 0.5 mi</div>
                        <Badge className="mt-1 bg-green-500 text-white text-xs">Open</Badge>
                      </div>
                      <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <div className="font-medium text-green-900 dark:text-green-100">Medical Clinic</div>
                        <div className="text-sm text-green-700 dark:text-green-300">Bay Area Emergency - 1.2 mi</div>
                        <Badge className="mt-1 bg-yellow-500 text-white text-xs">Limited Hours</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </FadeIn>
        </TabsContent>

        {/* Recovery Steps Tab */}
        <TabsContent value="steps" className="space-y-6">
          <FadeIn>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Emergency Recovery Checklist</h2>
              <div className="flex items-center space-x-2">
                <Badge variant="outline">
                  {completedSteps} of {emergencySteps.length} completed
                </Badge>
              </div>
            </div>

            <StaggerContainer className="space-y-4">
              {emergencySteps.map((step, index) => {
                const statusBadge = getStepStatusBadge(step.status);
                const IconComponent = step.icon;
                
                return (
                  <StaggerItem key={step.id}>
                    <HoverLift>
                      <Card className={`border-l-4 ${getPriorityColor(step.priority)} transition-all duration-300`}>
                        <CardContent className="p-6">
                          <div className="flex items-start space-x-4">
                            <div className={`p-3 rounded-lg ${
                              step.status === 'completed' ? 'bg-green-100 dark:bg-green-900' :
                              step.status === 'in_progress' ? 'bg-blue-100 dark:bg-blue-900' :
                              step.status === 'blocked' ? 'bg-red-100 dark:bg-red-900' :
                              'bg-gray-100 dark:bg-gray-700'
                            }`}>
                              <IconComponent className={`h-6 w-6 ${
                                step.status === 'completed' ? 'text-green-600' :
                                step.status === 'in_progress' ? 'text-blue-600' :
                                step.status === 'blocked' ? 'text-red-600' :
                                'text-gray-600'
                              }`} />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-3">
                                <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                                  {step.title}
                                </h3>
                                <div className="flex items-center space-x-2">
                                  <Badge className={`${step.priority === 'critical' ? 'bg-red-500' : 
                                    step.priority === 'high' ? 'bg-orange-500' : 
                                    step.priority === 'medium' ? 'bg-blue-500' : 'bg-green-500'} text-white`}>
                                    {step.priority.toUpperCase()}
                                  </Badge>
                                  <motion.div
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: index * 0.1 }}
                                  >
                                    <Badge {...statusBadge} />
                                  </motion.div>
                                </div>
                              </div>
                              <p className="text-gray-600 dark:text-gray-400 mb-4">
                                {step.description}
                              </p>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                  <div className="flex items-center">
                                    <Timer className="h-4 w-4 mr-1" />
                                    {step.estimatedTime}
                                  </div>
                                  <div className="flex items-center">
                                    <Target className="h-4 w-4 mr-1" />
                                    {step.category}
                                  </div>
                                  {step.dueDate && (
                                    <div className="flex items-center text-orange-600">
                                      <Calendar className="h-4 w-4 mr-1" />
                                      Due: {step.dueDate}
                                    </div>
                                  )}
                                </div>
                                <div className="flex space-x-2">
                                  <Button size="sm" variant="outline" data-testid={`button-details-${step.id}`}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    Details
                                  </Button>
                                  {step.status === 'pending' && (
                                    <Button size="sm" data-testid={`button-start-${step.id}`}>
                                      Start Now
                                    </Button>
                                  )}
                                </div>
                              </div>
                              {step.status === 'completed' && (
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: '100%' }}
                                  transition={{ duration: 0.8, delay: index * 0.1 }}
                                  className="mt-4 h-2 bg-green-500 rounded-full"
                                />
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </HoverLift>
                  </StaggerItem>
                );
              })}
            </StaggerContainer>
          </FadeIn>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-6">
          <FadeIn>
            <div className="text-center py-12">
              <Bell className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Emergency Alerts & Updates</h3>
              <p className="text-muted-foreground">Real-time weather, safety, and service updates for your area</p>
            </div>
          </FadeIn>
        </TabsContent>

        {/* Requests Tab */}
        <TabsContent value="requests" className="space-y-6">
          <FadeIn>
            <div className="text-center py-12">
              <Clipboard className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">My Assistance Requests</h3>
              <p className="text-muted-foreground">Track your requests for help and monitor progress</p>
            </div>
          </FadeIn>
        </TabsContent>
      </Tabs>

      {/* Insurance Claim Filing Modal */}
      <AnimatePresence>
        {isClaimModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setIsClaimModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Phone className="h-5 w-5 text-green-600" />
                  File Insurance Claim
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  Report your claim to your insurance company and enter the claim details here. We'll keep track of everything for you.
                </p>
              </div>

          <div className="space-y-4 p-6">
            {/* Call Insurance Button */}
            <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
              <AlertDescription className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-medium text-blue-900 dark:text-blue-200 mb-1">Need to call your insurance company?</p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">Click to dial their claims hotline</p>
                </div>
                <Button 
                  onClick={handleCallInsurance}
                  className="bg-green-600 hover:bg-green-700"
                  data-testid="button-call-insurance"
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Call Now
                </Button>
              </AlertDescription>
            </Alert>

            {/* Claim Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="insuranceCompany">Insurance Company *</Label>
                <Input
                  id="insuranceCompany"
                  placeholder="e.g., State Farm, Allstate"
                  value={claimForm.insuranceCompany}
                  onChange={(e) => setClaimForm({ ...claimForm, insuranceCompany: e.target.value })}
                  data-testid="input-insurance-company"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="policyNumber">Policy Number</Label>
                <Input
                  id="policyNumber"
                  placeholder="Your policy number"
                  value={claimForm.policyNumber}
                  onChange={(e) => setClaimForm({ ...claimForm, policyNumber: e.target.value })}
                  data-testid="input-policy-number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="claimNumber">Claim Number</Label>
                <Input
                  id="claimNumber"
                  placeholder="Claim # (if assigned)"
                  value={claimForm.claimNumber}
                  onChange={(e) => setClaimForm({ ...claimForm, claimNumber: e.target.value })}
                  data-testid="input-claim-number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateOfLoss">Date of Loss *</Label>
                <Input
                  id="dateOfLoss"
                  type="date"
                  value={claimForm.dateOfLoss}
                  onChange={(e) => setClaimForm({ ...claimForm, dateOfLoss: e.target.value })}
                  data-testid="input-date-of-loss"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="damageType">Type of Damage</Label>
                <Select 
                  value={claimForm.damageType}
                  onValueChange={(value) => setClaimForm({ ...claimForm, damageType: value })}
                >
                  <SelectTrigger id="damageType" data-testid="select-damage-type">
                    <SelectValue placeholder="Select damage type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="wind">Wind Damage</SelectItem>
                    <SelectItem value="hail">Hail Damage</SelectItem>
                    <SelectItem value="tree">Tree Fall / Tree Damage</SelectItem>
                    <SelectItem value="flood">Flood / Water Damage</SelectItem>
                    <SelectItem value="roof">Roof Damage</SelectItem>
                    <SelectItem value="structural">Structural Damage</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="estimatedDamage">Estimated Damage Amount</Label>
                <Input
                  id="estimatedDamage"
                  type="text"
                  placeholder="e.g., $15,000"
                  value={claimForm.estimatedDamage}
                  onChange={(e) => setClaimForm({ ...claimForm, estimatedDamage: e.target.value })}
                  data-testid="input-estimated-damage"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="adjusterName">Adjuster Name</Label>
                <Input
                  id="adjusterName"
                  placeholder="Assigned adjuster"
                  value={claimForm.adjusterName}
                  onChange={(e) => setClaimForm({ ...claimForm, adjusterName: e.target.value })}
                  data-testid="input-adjuster-name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="adjusterPhone">Adjuster Phone</Label>
                <Input
                  id="adjusterPhone"
                  type="tel"
                  placeholder="(555) 123-4567"
                  value={claimForm.adjusterPhone}
                  onChange={(e) => setClaimForm({ ...claimForm, adjusterPhone: e.target.value })}
                  data-testid="input-adjuster-phone"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="adjusterEmail">Adjuster Email</Label>
                <Input
                  id="adjusterEmail"
                  type="email"
                  placeholder="adjuster@insurance.com"
                  value={claimForm.adjusterEmail}
                  onChange={(e) => setClaimForm({ ...claimForm, adjusterEmail: e.target.value })}
                  data-testid="input-adjuster-email"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Any additional information about the claim..."
                  rows={3}
                  value={claimForm.notes}
                  onChange={(e) => setClaimForm({ ...claimForm, notes: e.target.value })}
                  data-testid="textarea-claim-notes"
                />
              </div>
            </div>

            <Alert className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Tip:</strong> Make sure to take photos of all damage before repairs begin. Our AI can analyze damage photos to help you document everything properly.
              </AlertDescription>
            </Alert>

            <div className="flex justify-end gap-3 mt-6">
              <Button 
                variant="outline" 
                onClick={() => setIsClaimModalOpen(false)}
                data-testid="button-cancel-claim"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleClaimSubmit}
                className="bg-green-600 hover:bg-green-700"
                data-testid="button-submit-claim"
              >
                <FileCheck className="h-4 w-4 mr-2" />
                Save Claim Information
              </Button>
            </div>
          </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Contractor Help Modal */}
      <AnimatePresence>
        {isContractorModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setIsContractorModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  Find Help - Contractors in Your Area
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  We've found qualified contractors near you. You choose who to work with - you're in control!
                </p>
              </div>

              <div className="p-6 space-y-4">
                {/* Strategic Land Management LLC - Priority Listing */}
                <Card className="border-2 border-green-500 bg-green-50 dark:bg-green-900/20">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <Badge className="mb-2 bg-green-600">Recommended</Badge>
                        <CardTitle className="text-xl">Strategic Land Management LLC</CardTitle>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          Tree Removal & Storm Cleanup Specialists
                        </p>
                      </div>
                      <Star className="h-6 w-6 text-yellow-500 fill-yellow-500" />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm">
                      <strong>Specialties:</strong> Emergency tree removal, storm cleanup, debris removal
                    </p>
                    <p className="text-sm">
                      <strong>Service Area:</strong> Tampa Bay & surrounding areas
                    </p>
                    <p className="text-sm">
                      <strong>Insurance:</strong> Works directly with insurance companies - little to no out-of-pocket cost
                    </p>
                    <div className="flex gap-3 pt-3">
                      <Button className="bg-green-600 hover:bg-green-700" data-testid="button-contact-slm">
                        <Phone className="h-4 w-4 mr-2" />
                        Call Now
                      </Button>
                      <Button variant="outline" onClick={() => {
                        setIsContractorModalOpen(false);
                        toast({
                          title: "AI Agent Activated",
                          description: "Would you like the AI agent to contact Strategic Land Management LLC on your behalf?"
                        });
                      }}>
                        <Mail className="h-4 w-4 mr-2" />
                        Let AI Contact Them
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Other Contractors */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Tampa Bay Roofing & Restoration</CardTitle>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Roofing, Siding, Windows</p>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-sm"><strong>Rating:</strong> ⭐⭐⭐⭐⭐ (4.8/5)</p>
                    <p className="text-sm"><strong>Licensed & Insured:</strong> Yes</p>
                    <div className="flex gap-3 pt-2">
                      <Button size="sm">
                        <Phone className="h-4 w-4 mr-2" />
                        Contact
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">FloodMasters Recovery</CardTitle>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Water Damage & Flood Restoration</p>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-sm"><strong>Rating:</strong> ⭐⭐⭐⭐ (4.5/5)</p>
                    <p className="text-sm"><strong>Licensed & Insured:</strong> Yes</p>
                    <div className="flex gap-3 pt-2">
                      <Button size="sm">
                        <Phone className="h-4 w-4 mr-2" />
                        Contact
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Alert className="mt-4 bg-blue-50 dark:bg-blue-900/20">
                  <AlertDescription>
                    <strong>Your Choice Matters!</strong> Review contractor qualifications, ask for references, and always get multiple estimates. You decide who works on your property.
                  </AlertDescription>
                </Alert>

                <div className="flex justify-end gap-3 mt-6">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsContractorModalOpen(false)}
                    data-testid="button-close-contractors"
                  >
                    Close
                  </Button>
                  <Button 
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={() => setIsSBAModalOpen(true)}
                  >
                    <DollarSign className="h-4 w-4 mr-2" />
                    Learn About SBA Loans
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Shelter & Housing Modal */}
      <AnimatePresence>
        {isShelterModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setIsShelterModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Home className="h-5 w-5 text-purple-600" />
                  Emergency Shelters & Housing
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  Find emergency shelters, temporary housing, and resources near you
                </p>
              </div>

              <div className="p-6 space-y-4">
                <Alert className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
                  <AlertDescription className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-red-900 dark:text-red-200">American Red Cross Emergency Shelter</p>
                      <p className="text-sm text-red-700 dark:text-red-300 mt-1">24/7 Open - No ID Required</p>
                    </div>
                    <Button className="bg-red-600 hover:bg-red-700">
                      <MapPin className="h-4 w-4 mr-2" />
                      Get Directions
                    </Button>
                  </AlertDescription>
                </Alert>

                <div className="grid gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Tampa Convention Center - Emergency Shelter</CardTitle>
                      <p className="text-sm text-gray-600 dark:text-gray-400">333 S Franklin St, Tampa, FL</p>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p className="text-sm"><strong>Capacity:</strong> Open beds available</p>
                      <p className="text-sm"><strong>Services:</strong> Meals, cots, showers, medical assistance</p>
                      <p className="text-sm"><strong>Pet Friendly:</strong> Yes (separate area)</p>
                      <div className="flex gap-3 pt-2">
                        <Button size="sm">
                          <Phone className="h-4 w-4 mr-2" />
                          Call: (813) 555-HELP
                        </Button>
                        <Button size="sm" variant="outline">
                          <MapPin className="h-4 w-4 mr-2" />
                          Directions
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>FEMA Temporary Housing Assistance</CardTitle>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Financial help for temporary housing</p>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p className="text-sm">FEMA can help with hotel costs, temporary rental assistance, and repairs to make your home habitable.</p>
                      <p className="text-sm"><strong>Eligibility:</strong> Homeowners, renters, and business owners affected by disasters</p>
                      <div className="flex gap-3 pt-2">
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                          <Phone className="h-4 w-4 mr-2" />
                          Call FEMA: 1-800-621-3362
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Salvation Army - Family Services</CardTitle>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Emergency housing & family support</p>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p className="text-sm">Short-term housing for families, case management, and disaster relief services</p>
                      <div className="flex gap-3 pt-2">
                        <Button size="sm">
                          <Phone className="h-4 w-4 mr-2" />
                          Contact
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsShelterModalOpen(false)}
                    data-testid="button-close-shelters"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SBA Disaster Loan Information Modal */}
      <AnimatePresence>
        {isSBAModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setIsSBAModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  SBA Disaster Loans - Complete Guide
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  Low-interest disaster loans for homeowners, renters, and business owners
                </p>
              </div>

              <div className="p-6 space-y-6">
                <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                  <AlertDescription>
                    <p className="font-bold text-green-900 dark:text-green-200 mb-2">✅ You May Qualify For Financial Help!</p>
                    <p className="text-sm text-green-800 dark:text-green-300">SBA offers low-interest, long-term disaster loans to help you recover from disaster-related losses.</p>
                  </AlertDescription>
                </Alert>

                <div className="grid md:grid-cols-2 gap-4">
                  {/* Homeowners */}
                  <Card>
                    <CardHeader className="bg-blue-50 dark:bg-blue-900/20">
                      <CardTitle className="flex items-center gap-2">
                        <Home className="h-5 w-5 text-blue-600" />
                        Homeowners
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-3">
                      <div>
                        <p className="font-semibold">Home & Property Loans</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Up to $500,000 to repair/replace your primary residence</p>
                      </div>
                      <div>
                        <p className="font-semibold">Personal Property Loans</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Up to $100,000 for personal belongings (furniture, appliances, vehicles)</p>
                      </div>
                      <div>
                        <p className="font-semibold">Interest Rate</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">As low as 2.688% fixed rate</p>
                      </div>
                      <div>
                        <p className="font-semibold">Repayment Terms</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Up to 30 years</p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Renters */}
                  <Card>
                    <CardHeader className="bg-purple-50 dark:bg-purple-900/20">
                      <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5 text-purple-600" />
                        Renters
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-3">
                      <div>
                        <p className="font-semibold">Personal Property Loans</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Up to $100,000 to replace damaged belongings</p>
                      </div>
                      <div>
                        <p className="font-semibold">What's Covered</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Clothing, furniture, cars, appliances, tools, computers, and more</p>
                      </div>
                      <div>
                        <p className="font-semibold">Interest Rate</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">As low as 2.688% fixed rate</p>
                      </div>
                      <div>
                        <p className="font-semibold">Repayment Terms</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Up to 30 years</p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Business Owners */}
                  <Card className="md:col-span-2">
                    <CardHeader className="bg-orange-50 dark:bg-orange-900/20">
                      <CardTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-orange-600" />
                        Business Owners
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <p className="font-semibold">Business Physical Disaster Loans</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Up to $2 million to repair/replace business property</p>
                          <ul className="text-sm text-gray-600 dark:text-gray-400 list-disc list-inside space-y-1">
                            <li>Real estate</li>
                            <li>Machinery & equipment</li>
                            <li>Inventory</li>
                            <li>Fixtures & leasehold improvements</li>
                          </ul>
                        </div>
                        <div>
                          <p className="font-semibold">Economic Injury Disaster Loans (EIDL)</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Up to $2 million for working capital</p>
                          <ul className="text-sm text-gray-600 dark:text-gray-400 list-disc list-inside space-y-1">
                            <li>Pay fixed debts, payroll, accounts payable</li>
                            <li>Available even if no physical damage</li>
                            <li>Nonprofit organizations also eligible</li>
                            <li>Interest rate: 4% (businesses), 3.25% (nonprofits)</li>
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* How to Apply */}
                <Card className="border-2 border-green-500">
                  <CardHeader>
                    <CardTitle className="text-xl">How to Apply</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <div className="w-10 h-10 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center mb-2">
                          <span className="font-bold text-green-700 dark:text-green-300">1</span>
                        </div>
                        <p className="font-semibold">Apply Online</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Visit disasterloanassistance.sba.gov</p>
                      </div>
                      <div>
                        <div className="w-10 h-10 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center mb-2">
                          <span className="font-bold text-green-700 dark:text-green-300">2</span>
                        </div>
                        <p className="font-semibold">Submit Documents</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Tax returns, proof of ownership, insurance info</p>
                      </div>
                      <div>
                        <div className="w-10 h-10 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center mb-2">
                          <span className="font-bold text-green-700 dark:text-green-300">3</span>
                        </div>
                        <p className="font-semibold">Get Decision</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Usually within 2-3 weeks</p>
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <p className="font-semibold mb-2">Important Notes:</p>
                      <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 list-disc list-inside">
                        <li>No collateral required for loans up to $25,000</li>
                        <li>Credit history considered, but flexible for disaster victims</li>
                        <li>Apply even if you have insurance - SBA can cover uninsured losses</li>
                        <li>First payment may be deferred up to 12 months</li>
                        <li>No prepayment penalty</li>
                      </ul>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <Button className="bg-green-600 hover:bg-green-700">
                        <Globe className="h-4 w-4 mr-2" />
                        Apply Online Now
                      </Button>
                      <Button variant="outline">
                        <Phone className="h-4 w-4 mr-2" />
                        Call SBA: 1-800-659-2955
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Alert>
                  <AlertDescription>
                    <strong>Need Help Applying?</strong> Our AI assistant can guide you through the application process and answer any questions you have about SBA disaster loans.
                  </AlertDescription>
                </Alert>

                <div className="flex justify-end gap-3">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsSBAModalOpen(false)}
                    data-testid="button-close-sba"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Photo Upload & AI Analysis Modal */}
      <AnimatePresence>
        {isPhotoUploadModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setIsPhotoUploadModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Camera className="h-5 w-5 text-red-600" />
                  Document Damage - AI Photo Analysis
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  Upload photos of damage for instant AI analysis. Our AI will identify damage types, measure objects, and provide recommendations.
                </p>
              </div>

              <div className="p-6 space-y-6">
                {/* Hidden File Input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  capture="environment"
                  onChange={handleFileSelect}
                  className="hidden"
                  data-testid="input-file-upload"
                />

                {/* Upload Buttons */}
                <div className="grid md:grid-cols-2 gap-4">
                  <Card className="cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all" onClick={handleCameraCapture}>
                    <CardContent className="p-6 text-center">
                      <Camera className="h-12 w-12 text-blue-600 mx-auto mb-3" />
                      <h3 className="font-semibold mb-1">Take Photo</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Use your device camera</p>
                    </CardContent>
                  </Card>
                  <Card className="cursor-pointer hover:bg-green-50 dark:hover:bg-green-900/20 transition-all" onClick={handleCameraCapture}>
                    <CardContent className="p-6 text-center">
                      <Upload className="h-12 w-12 text-green-600 mx-auto mb-3" />
                      <h3 className="font-semibold mb-1">Upload Photos</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Select from gallery</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Photo Grid */}
                {uploadedPhotos.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center justify-between">
                      <span>Uploaded Photos ({uploadedPhotos.length})</span>
                      {!isAnalyzing && (
                        <Button 
                          onClick={handlePhotoAnalysis}
                          className="bg-purple-600 hover:bg-purple-700"
                          data-testid="button-analyze-photos"
                        >
                          <Sparkles className="h-4 w-4 mr-2" />
                          Analyze with AI
                        </Button>
                      )}
                    </h3>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {uploadedPhotos.map((photo, index) => (
                        <div key={index} className="relative group">
                          <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
                            <img 
                              src={photo.preview} 
                              alt={`Damage photo ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                            {photo.analyzing && (
                              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                <Loader2 className="h-8 w-8 text-white animate-spin" />
                              </div>
                            )}
                            <button
                              onClick={() => removePhoto(index)}
                              className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              data-testid={`button-remove-photo-${index}`}
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                          {photo.analysis && (
                            <div className="mt-2 text-xs">
                              <Badge className="bg-green-600 mb-1">✓ Analyzed</Badge>
                              <p className="text-gray-600 dark:text-gray-400 line-clamp-2">{photo.analysis.summary}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* AI Analysis Results */}
                {uploadedPhotos.some(p => p.analysis) && (
                  <Card className="border-2 border-purple-500 bg-purple-50 dark:bg-purple-900/20">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-purple-600" />
                        AI Damage Assessment
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {uploadedPhotos.filter(p => p.analysis).map((photo, index) => (
                        <div key={index} className="border-b pb-4 last:border-0">
                          <h4 className="font-semibold mb-2">Photo {index + 1} Analysis</h4>
                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm mb-2"><strong>Damage Type:</strong> {photo.analysis.damageType || 'Not detected'}</p>
                              <p className="text-sm mb-2"><strong>Severity:</strong> {photo.analysis.severity || 'N/A'}</p>
                              {photo.analysis.treeDiameter && (
                                <p className="text-sm mb-2"><strong>Tree Diameter:</strong> {photo.analysis.treeDiameter}</p>
                              )}
                              {photo.analysis.estimatedWeight && (
                                <p className="text-sm mb-2"><strong>Estimated Weight:</strong> {photo.analysis.estimatedWeight}</p>
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-semibold mb-1">AI Recommendations:</p>
                              <ul className="text-sm text-gray-600 dark:text-gray-400 list-disc list-inside space-y-1">
                                {photo.analysis.recommendations?.map((rec: string, i: number) => (
                                  <li key={i}>{rec}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* Contractor Recommendation */}
                      {uploadedPhotos.some(p => p.analysis?.recommendsContractor) && (
                        <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200">
                          <AlertDescription>
                            <p className="font-bold mb-2">🏗️ Professional Help Recommended</p>
                            <p className="text-sm mb-3">Based on the damage analysis, we recommend contacting a professional contractor.</p>
                            <Button 
                              size="sm"
                              onClick={() => {
                                setIsPhotoUploadModalOpen(false);
                                setIsContractorModalOpen(true);
                              }}
                            >
                              Find Contractors
                            </Button>
                          </AlertDescription>
                        </Alert>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Tips */}
                {uploadedPhotos.length === 0 && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Photography Tips:</strong>
                      <ul className="text-sm mt-2 space-y-1 list-disc list-inside">
                        <li>Take photos from multiple angles</li>
                        <li>Include a reference object (ruler, hand) for scale</li>
                        <li>Capture close-ups and wide shots</li>
                        <li>Document all visible damage</li>
                        <li>Take photos before any cleanup or repairs</li>
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setIsPhotoUploadModalOpen(false);
                      uploadedPhotos.forEach(photo => URL.revokeObjectURL(photo.preview));
                      setUploadedPhotos([]);
                    }}
                    data-testid="button-close-photo-upload"
                  >
                    Close
                  </Button>
                  {uploadedPhotos.length > 0 && uploadedPhotos.some(p => p.analysis) && (
                    <Button 
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => {
                        toast({
                          title: "Report Saved",
                          description: "Your damage documentation has been saved to your claim."
                        });
                        setIsPhotoUploadModalOpen(false);
                      }}
                      data-testid="button-save-damage-report"
                    >
                      <FileCheck className="h-4 w-4 mr-2" />
                      Save to Claim
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}