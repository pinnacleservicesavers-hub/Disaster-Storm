import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useQuery } from '@tanstack/react-query';
import { Scale, Plus, Search, Settings, AlertTriangle, Calendar, Clock, FileText, CheckCircle, Volume2, VolumeX, ArrowLeft, Upload, X, ExternalLink, Building, Gavel } from 'lucide-react';
import { Link } from 'wouter';
import { DashboardSection } from '@/components/DashboardSection';
import { FadeIn, PulseAlert, StaggerContainer, StaggerItem, HoverLift } from '@/components/ui/animations';
import { StateCitySelector, useStateCitySelector } from '@/components/StateCitySelector';
import ModuleAIAssistant from '@/components/ModuleAIAssistant';
import LienFilingAssistant from '@/components/LienFilingAssistant';
import { useToast } from '@/hooks/use-toast';

interface LegalItem {
  id: string;
  type: 'contract' | 'lien' | 'license' | 'compliance';
  title: string;
  deadline: string;
  daysRemaining: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  assignee: string;
  value?: number;
  location: string;
}

export default function Legal() {
  const { selectedState, setSelectedState, selectedCity, setSelectedCity, availableCities } = useStateCitySelector('Florida', 'Miami');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [isVoiceGuideActive, setIsVoiceGuideActive] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [showNewDocModal, setShowNewDocModal] = useState(false);
  const [docType, setDocType] = useState<'contract' | 'lien' | 'license' | 'compliance'>('lien');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [newDocForm, setNewDocForm] = useState({ title: '', deadline: '', value: '', location: '' });
  const [showLienAssistant, setShowLienAssistant] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Mock legal items with React Query
  const { data: legalItems = [], isLoading } = useQuery({
    queryKey: ['legal-items', selectedFilter],
    queryFn: async (): Promise<LegalItem[]> => {
      await new Promise(resolve => setTimeout(resolve, 400));
      
      const allItems = [
        { id: '1', type: 'lien' as const, title: 'Johnson Project Lien Filing', deadline: '2024-01-18', daysRemaining: 3, priority: 'critical' as const, status: 'pending' as const, assignee: 'Legal Team', value: 45000, location: 'Florida' },
        { id: '2', type: 'contract' as const, title: 'ABC Insurance Master Agreement', deadline: '2024-01-22', daysRemaining: 7, priority: 'high' as const, status: 'in_progress' as const, assignee: 'Mike Chen', location: 'Multi-State' },
        { id: '3', type: 'license' as const, title: 'Texas Contractor License Renewal', deadline: '2024-01-29', daysRemaining: 14, priority: 'medium' as const, status: 'pending' as const, assignee: 'Compliance Officer', location: 'Texas' },
        { id: '4', type: 'compliance' as const, title: 'Georgia State Compliance Review', deadline: '2024-02-01', daysRemaining: 17, priority: 'medium' as const, status: 'in_progress' as const, assignee: 'Sarah Wilson', location: 'Georgia' },
        { id: '5', type: 'lien' as const, title: 'Smith Property Lien Notice', deadline: '2024-01-25', daysRemaining: 10, priority: 'high' as const, status: 'completed' as const, assignee: 'Legal Team', value: 28000, location: 'Alabama' },
      ];

      return selectedFilter === 'all' ? allItems : allItems.filter(item => 
        selectedFilter === 'urgent' ? item.daysRemaining <= 7 :
        selectedFilter === 'overdue' ? item.status === 'overdue' :
        item.type === selectedFilter
      );
    },
    refetchInterval: 60000,
  });

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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'contract': return FileText;
      case 'lien': return AlertTriangle;
      case 'license': return CheckCircle;
      case 'compliance': return Scale;
      default: return FileText;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'contract': return 'bg-[hsl(217,71%,53%)]';
      case 'lien': return 'bg-[hsl(0,84%,60%)]';
      case 'license': return 'bg-[hsl(142,76%,36%)]';
      case 'compliance': return 'bg-[hsl(282,71%,53%)]';
      default: return 'bg-gray-500';
    }
  };

  // Get best natural female voice
  const getBestFemaleVoice = (): SpeechSynthesisVoice | null => {
    if (!voices || voices.length === 0) return null;
    
    const preferredVoices = [
      'Samantha', 'Karen', 'Moira', 'Fiona', 'Victoria',
      'Microsoft Zira', 'Microsoft Aria', 'Microsoft Jenny',
      'Google US English Female', 'Google UK English Female',
      'Joanna', 'Salli', 'Kimberly'
    ];
    
    for (const preferred of preferredVoices) {
      const voice = voices.find(v => v.name.toLowerCase().includes(preferred.toLowerCase()));
      if (voice) return voice;
    }
    
    const femaleVoice = voices.find(v => 
      v.lang.startsWith('en') && 
      (v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('zira'))
    );
    if (femaleVoice) return femaleVoice;
    
    return voices.find(v => v.lang.startsWith('en')) || voices[0] || null;
  };

  // Voice Guide Function with natural female voice
  const startVoiceGuide = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      toast({ variant: 'destructive', title: 'Voice not supported' });
      return;
    }

    if (!isVoiceGuideActive) {
      if (voices.length === 0) {
        const loadedVoices = window.speechSynthesis.getVoices();
        if (loadedVoices.length === 0) {
          toast({ title: 'Loading voice...', description: 'Please try again in a moment.' });
          return;
        }
        setVoices(loadedVoices);
      }
      
      setIsVoiceGuideActive(true);
      window.speechSynthesis.cancel();
      
      const voiceContent = `Welcome to Legal Compliance! I'm Evelyn, and I'll help you manage your contracts, liens, and legal requirements.

      This dashboard shows your legal metrics at a glance: active contracts, pending liens, compliance rate, and critical alerts that need attention.

      To add a new document, click the New Document button. You can create contracts, file liens, manage licenses, or track compliance items. You can also upload supporting files directly.

      For lien filing, I can help you connect with LienItNow.com, a professional service that handles mechanics liens across all 50 states. Just click the File Lien with LienItNow button when you're ready.

      Each legal item shows its deadline, days remaining, and priority level. Critical items with red borders need immediate attention to avoid missing deadlines.

      I'm here to help you stay compliant and protect your business interests!`;
      
      const utterance = new SpeechSynthesisUtterance(voiceContent);
      const femaleVoice = getBestFemaleVoice();
      if (femaleVoice) utterance.voice = femaleVoice;
      
      utterance.rate = 1.05;
      utterance.pitch = 1.1;
      utterance.volume = 0.9;
      
      utterance.onend = () => setIsVoiceGuideActive(false);
      utterance.onerror = () => setIsVoiceGuideActive(false);
      
      window.speechSynthesis.speak(utterance);
    } else {
      window.speechSynthesis.cancel();
      setIsVoiceGuideActive(false);
    }
  };

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      toast({ title: 'File uploaded', description: `${file.name} ready for submission` });
    }
  };

  // Handle new document creation
  const handleCreateDocument = () => {
    if (!newDocForm.title || !newDocForm.deadline) {
      toast({ variant: 'destructive', title: 'Please fill in required fields' });
      return;
    }
    
    toast({ 
      title: 'Document Created', 
      description: `${docType.charAt(0).toUpperCase() + docType.slice(1)} "${newDocForm.title}" has been added to your legal items.` 
    });
    
    setShowNewDocModal(false);
    setNewDocForm({ title: '', deadline: '', value: '', location: '' });
    setUploadedFile(null);
  };

  // Open LienItNow
  const openLienItNow = () => {
    window.open('https://www.lienitnow.com/', '_blank');
    toast({ title: 'Opening LienItNow', description: 'Redirecting to professional lien filing service...' });
  };

  const getPriorityColor = (priority: string, daysRemaining: number) => {
    if (daysRemaining <= 3) return 'border-[hsl(0,84%,60%)] bg-[hsl(0,84%,60%)]/10 dark:bg-[hsl(0,84%,60%)]/20';
    if (priority === 'critical') return 'border-[hsl(0,84%,60%)] bg-[hsl(0,84%,60%)]/10 dark:bg-[hsl(0,84%,60%)]/20';
    if (priority === 'high') return 'border-[hsl(25,95%,53%)] bg-[hsl(25,95%,53%)]/10 dark:bg-[hsl(25,95%,53%)]/20';
    if (priority === 'medium') return 'border-[hsl(45,95%,53%)] bg-[hsl(45,95%,53%)]/10 dark:bg-[hsl(45,95%,53%)]/20';
    return 'border-[hsl(142,76%,36%)] bg-[hsl(142,76%,36%)]/10 dark:bg-[hsl(142,76%,36%)]/20';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return { text: 'PENDING', variant: 'secondary' as const };
      case 'in_progress': return { text: 'IN PROGRESS', variant: 'default' as const };
      case 'completed': return { text: 'COMPLETED', variant: 'default' as const };
      case 'overdue': return { text: 'OVERDUE', variant: 'destructive' as const };
      default: return { text: 'UNKNOWN', variant: 'outline' as const };
    }
  };

  // Calculate metrics
  const activeContracts = legalItems.filter(item => item.type === 'contract' && item.status !== 'completed').length;
  const pendingLiens = legalItems.filter(item => item.type === 'lien' && item.status === 'pending').length;
  const criticalAlerts = legalItems.filter(item => item.priority === 'critical' || item.daysRemaining <= 3).length;
  const complianceRate = 98.7; // Mock compliance rate

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
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
      <DashboardSection
        title="Legal Compliance"
        description="Manage legal compliance, contracts, liens, and regulatory requirements with automated deadline tracking"
        icon={Scale}
        badge={{ text: `${criticalAlerts} URGENT`, variant: 'destructive' }}
        kpis={[
        { label: 'Active Contracts', value: 1847, change: 'Currently binding', color: 'blue', testId: 'text-active-contracts' },
        { label: 'Pending Liens', value: pendingLiens, change: 'Requiring action', color: 'red', testId: 'text-pending-liens' },
        { label: 'Compliance Rate', value: complianceRate, change: 'All jurisdictions', color: 'green', suffix: '%', testId: 'text-compliance-rate' },
        { label: 'Critical Alerts', value: criticalAlerts, change: 'Need attention', color: 'amber', testId: 'text-legal-alerts' }
      ]}
      actions={[
        { icon: Plus, label: 'New Document', variant: 'default', testId: 'button-new-contract', onClick: () => setShowNewDocModal(true) },
        { icon: Gavel, label: 'AI Lien Filing', variant: 'default', testId: 'button-ai-lien', onClick: () => setShowLienAssistant(true) },
        { icon: ExternalLink, label: 'LienItNow Direct', variant: 'outline', testId: 'button-lienitnow', onClick: openLienItNow },
        { icon: Search, label: 'Search Legal', variant: 'outline', testId: 'button-search-legal' },
        { 
          icon: isVoiceGuideActive ? VolumeX : Volume2, 
          label: isVoiceGuideActive ? 'Stop Guide' : 'Voice Guide', 
          variant: 'outline', 
          testId: 'button-voice-guide',
          onClick: startVoiceGuide,
          'aria-label': 'Voice guide for Legal Command',
          'aria-pressed': isVoiceGuideActive
        }
      ]}
      testId="legal-section"
    >
      {/* Critical Deadline Timeline */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4 flex items-center">
          <AlertTriangle className="h-5 w-5 text-[hsl(0,84%,60%)] mr-2" />
          Critical Deadline Timeline
          <motion.div
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="ml-2 h-2 w-2 bg-[hsl(0,84%,60%)] rounded-full"
          />
        </h3>
        
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />
          
          <StaggerContainer className="space-y-6">
            {legalItems
              .filter(item => item.daysRemaining <= 30)
              .sort((a, b) => a.daysRemaining - b.daysRemaining)
              .slice(0, 5)
              .map((item, index) => {
                const IconComponent = getTypeIcon(item.type);
                const shouldPulse = item.daysRemaining <= 7;
                
                return (
                  <StaggerItem key={item.id}>
                    <div className="relative flex items-start space-x-4">
                      {/* Timeline dot */}
                      <motion.div
                        className={`relative z-10 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${getTypeColor(item.type)} text-white`}
                        animate={shouldPulse ? {
                          scale: [1, 1.2, 1],
                          boxShadow: [
                            '0 0 0 0 rgba(239, 68, 68, 0.7)',
                            '0 0 0 10px rgba(239, 68, 68, 0)',
                            '0 0 0 0 rgba(239, 68, 68, 0)'
                          ]
                        } : {}}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <IconComponent className="h-4 w-4" />
                      </motion.div>
                      
                      {/* Timeline content */}
                      <HoverLift className="flex-1">
                        <Card className={`border-l-4 ${getPriorityColor(item.priority, item.daysRemaining)}`}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <h4 className="font-semibold text-gray-900 dark:text-gray-100" data-testid={`legal-item-${item.id}`}>
                                  {item.title}
                                </h4>
                                <Badge {...getStatusBadge(item.status)} />
                              </div>
                              <div className="flex items-center space-x-2">
                                {item.daysRemaining <= 3 && (
                                  <PulseAlert intensity="strong">
                                    <Badge className="bg-red-600 text-white">
                                      {item.daysRemaining} DAYS
                                    </Badge>
                                  </PulseAlert>
                                )}
                                {item.daysRemaining > 3 && (
                                  <Badge variant={item.daysRemaining <= 7 ? 'destructive' : 'secondary'}>
                                    {item.daysRemaining} days
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                              <div className="flex items-center space-x-4">
                                <span>Due: {item.deadline}</span>
                                <span>Assignee: {item.assignee}</span>
                                <span>Location: {item.location}</span>
                              </div>
                              {item.value && (
                                <span className="font-semibold text-green-600 dark:text-green-400">
                                  ${item.value.toLocaleString()}
                                </span>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </HoverLift>
                    </div>
                  </StaggerItem>
                );
              })}
          </StaggerContainer>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="flex space-x-4 mb-6">
        {[
          { key: 'all', label: 'All Items' },
          { key: 'urgent', label: 'Urgent (7 days)' },
          { key: 'lien', label: 'Liens' },
          { key: 'contract', label: 'Contracts' },
          { key: 'compliance', label: 'Compliance' }
        ].map((filter) => (
          <Button
            key={filter.key}
            variant={selectedFilter === filter.key ? 'default' : 'outline'}
            onClick={() => setSelectedFilter(filter.key)}
            data-testid={`button-filter-${filter.key}`}
          >
            {filter.label}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Legal Items List */}
        <div className="lg:col-span-2">
          <h3 className="text-xl font-semibold mb-4">Legal Items</h3>
          
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : (
            <StaggerContainer className="space-y-4">
              {legalItems.map((item, index) => {
                const IconComponent = getTypeIcon(item.type);
                
                return (
                  <StaggerItem key={item.id}>
                    <HoverLift>
                      <Card className="relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-50/20 to-indigo-50/20 dark:from-blue-900/10 dark:to-indigo-900/10" />
                        <CardContent className="relative p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${getTypeColor(item.type)}`}>
                                <IconComponent className="h-5 w-5" />
                              </div>
                              <div>
                                <div className="flex items-center space-x-2">
                                  <h4 className="font-semibold text-gray-900 dark:text-gray-100">{item.title}</h4>
                                  <Badge {...getStatusBadge(item.status)} />
                                </div>
                                <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                                  <span>Due: {item.deadline}</span>
                                  <span>Assignee: {item.assignee}</span>
                                  <span>Location: {item.location}</span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-4">
                              {item.value && (
                                <div className="text-center">
                                  <div className="text-lg font-bold text-green-600 dark:text-green-400">
                                    ${item.value.toLocaleString()}
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">Value</div>
                                </div>
                              )}
                              
                              <div className="text-center">
                                <div className={`text-lg font-bold ${
                                  item.daysRemaining <= 3 ? 'text-red-600' :
                                  item.daysRemaining <= 7 ? 'text-orange-600' :
                                  'text-blue-600'
                                }`}>
                                  {item.daysRemaining}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">days left</div>
                              </div>
                              
                              <Button size="sm" variant="outline" data-testid={`button-view-${item.id}`}>
                                View
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </HoverLift>
                  </StaggerItem>
                );
              })}
            </StaggerContainer>
          )}
        </div>

        {/* Compliance Dashboard */}
        <div>
          <h3 className="text-xl font-semibold mb-4 flex items-center">
            <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
            Compliance Status
          </h3>
          
          <div className="space-y-6">
            {/* Compliance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Multi-State Compliance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { state: 'Florida', compliance: 100, issues: 0 },
                  { state: 'Georgia', compliance: 98, issues: 1 },
                  { state: 'Alabama', compliance: 95, issues: 2 },
                  { state: 'Texas', compliance: 97, issues: 1 },
                ].map((state, index) => (
                  <div key={state.state} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{state.state}</span>
                      <div className="flex items-center space-x-2">
                        <span className={`text-sm font-bold ${
                          state.compliance >= 99 ? 'text-green-600' :
                          state.compliance >= 95 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {state.compliance}%
                        </span>
                        {state.issues > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            {state.issues} issues
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                      <motion.div
                        className={`h-2 rounded-full ${
                          state.compliance >= 99 ? 'bg-green-500' :
                          state.compliance >= 95 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        initial={{ width: 0 }}
                        animate={{ width: `${state.compliance}%` }}
                        transition={{ 
                          duration: 1.5, 
                          ease: "easeOut",
                          delay: index * 0.2
                        }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start" 
                  onClick={() => {
                    alert('Generating compliance report... This will download a comprehensive report of all legal items and compliance status.');
                  }}
                  data-testid="button-generate-report"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Generate Compliance Report
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start" 
                  onClick={() => {
                    alert('Opening calendar to schedule legal review... Please select a date and time for your legal consultation.');
                  }}
                  data-testid="button-schedule-review"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Schedule Legal Review
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start" 
                  onClick={() => {
                    alert('Setting up deadline reminder... You will receive notifications 7, 3, and 1 day before critical legal deadlines.');
                  }}
                  data-testid="button-set-reminder"
                >
                  <Clock className="w-4 h-4 mr-2" />
                  Set Deadline Reminder
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start" 
                  onClick={() => {
                    alert('Opening compliance training module... Access interactive training materials and state-specific legal requirements.');
                  }}
                  data-testid="button-compliance-training"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Compliance Training
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
        </div>
      </DashboardSection>
        
        {/* New Document Modal */}
        {showNewDocModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-semibold">Add New Legal Document</h3>
                <button 
                  onClick={() => setShowNewDocModal(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                  data-testid="button-close-doc-modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 space-y-4">
                {/* Document Type */}
                <div>
                  <label className="block text-sm font-medium mb-2">Document Type</label>
                  <div className="grid grid-cols-4 gap-2">
                    {(['lien', 'contract', 'license', 'compliance'] as const).map((type) => (
                      <button
                        key={type}
                        onClick={() => setDocType(type)}
                        className={`p-3 rounded-lg border-2 text-center transition-all ${
                          docType === type 
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30' 
                            : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                        }`}
                        data-testid={`button-doctype-${type}`}
                      >
                        <span className="text-sm font-medium capitalize">{type}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-medium mb-2">Title *</label>
                  <Input
                    placeholder="e.g., Johnson Property Lien Filing"
                    value={newDocForm.title}
                    onChange={(e) => setNewDocForm({ ...newDocForm, title: e.target.value })}
                    data-testid="input-doc-title"
                  />
                </div>

                {/* Deadline */}
                <div>
                  <label className="block text-sm font-medium mb-2">Deadline *</label>
                  <Input
                    type="date"
                    value={newDocForm.deadline}
                    onChange={(e) => setNewDocForm({ ...newDocForm, deadline: e.target.value })}
                    data-testid="input-doc-deadline"
                  />
                </div>

                {/* Value (for liens) */}
                {docType === 'lien' && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Lien Amount ($)</label>
                    <Input
                      type="number"
                      placeholder="45000"
                      value={newDocForm.value}
                      onChange={(e) => setNewDocForm({ ...newDocForm, value: e.target.value })}
                      data-testid="input-doc-value"
                    />
                  </div>
                )}

                {/* Location */}
                <div>
                  <label className="block text-sm font-medium mb-2">State/Location</label>
                  <Input
                    placeholder="e.g., Florida"
                    value={newDocForm.location}
                    onChange={(e) => setNewDocForm({ ...newDocForm, location: e.target.value })}
                    data-testid="input-doc-location"
                  />
                </div>

                {/* File Upload */}
                <div>
                  <label className="block text-sm font-medium mb-2">Upload Document</label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.jpg,.png"
                    data-testid="input-file-upload"
                  />
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 transition-colors"
                  >
                    {uploadedFile ? (
                      <div className="flex items-center justify-center gap-2">
                        <FileText className="w-5 h-5 text-blue-500" />
                        <span className="text-sm font-medium">{uploadedFile.name}</span>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setUploadedFile(null); }}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                        <p className="text-sm text-gray-500">Click to upload PDF, DOC, or images</p>
                      </>
                    )}
                  </div>
                </div>

                {/* LienItNow Integration */}
                {docType === 'lien' && (
                  <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Building className="w-6 h-6 text-blue-600 mt-1" />
                        <div className="flex-1">
                          <h4 className="font-semibold text-blue-800 dark:text-blue-200">Need Help Filing?</h4>
                          <p className="text-sm text-blue-600 dark:text-blue-300 mb-2">
                            LienItNow.com provides professional lien filing services across all 50 states.
                          </p>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={openLienItNow}
                            className="border-blue-400 text-blue-700 hover:bg-blue-100"
                            data-testid="button-modal-lienitnow"
                          >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            File with LienItNow
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Modal Actions */}
              <div className="flex gap-3 p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <Button 
                  variant="outline" 
                  onClick={() => setShowNewDocModal(false)}
                  className="flex-1"
                  data-testid="button-cancel-doc"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateDocument}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  data-testid="button-create-doc"
                >
                  Create Document
                </Button>
              </div>
            </motion.div>
          </div>
        )}
        
        {/* AI Lien Filing Assistant */}
        <LienFilingAssistant 
          isOpen={showLienAssistant}
          onClose={() => setShowLienAssistant(false)}
          prefillData={{
            propertyState: selectedState === 'Florida' ? 'FL' : selectedState === 'Texas' ? 'TX' : 'FL'
          }}
        />

        <ModuleAIAssistant moduleName="Legal Compliance" />
      </div>
    </div>
  );
}