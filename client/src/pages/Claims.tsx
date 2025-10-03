import { useState, useEffect } from 'react';
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
import { FileText, Plus, Search, Settings, DollarSign, Clock, CheckCircle, AlertTriangle, TrendingUp, Eye, Volume2, VolumeX, ArrowLeft, UserPlus, FileSearch } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { DashboardSection } from '@/components/DashboardSection';
import { FadeIn, PulseAlert, StaggerContainer, StaggerItem, HoverLift, CountUp } from '@/components/ui/animations';
import { XactimateComparables } from '@/components/XactimateComparables';
import { LegalDisclaimer } from '@/components/LegalDisclaimer';

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
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [isVoiceGuideActive, setIsVoiceGuideActive] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  
  // Add New Claim Modal States
  const [isAddClaimModalOpen, setIsAddClaimModalOpen] = useState(false);
  const [claimMode, setClaimMode] = useState<'select' | 'manual' | 'search'>('select');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

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
      case 'urgent': return 'text-red-600';
      case 'high': return 'text-orange-600';
      case 'medium': return 'text-blue-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 90) return 'bg-green-500';
    if (progress >= 70) return 'bg-blue-500';
    if (progress >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // Voice Guide Function
  const startVoiceGuide = () => {
    // Feature detection
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      console.warn('Speech synthesis not supported in this browser');
      return;
    }

    if (!isVoiceGuideActive) {
      setIsVoiceGuideActive(true);
      
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      const voiceContent = `Welcome to the Claims Central Voice Navigation Guide. This is your comprehensive insurance claims processing and management system for disaster recovery operations.

      The dashboard displays critical claims metrics:
      - Open Claims showing 1,247 active claims with 87 new this week
      - Pending Review displaying claims awaiting adjuster assignment
      - Approval Rate showing 94% success rate over the last 30 days
      - Total Value indicating 12.4 million dollars in claims this quarter

      Main action buttons include:
      - New Claim with a plus icon to file new insurance claims
      - Search Claims with a search icon to quickly locate specific claim records
      - Analytics with a trending up icon to view processing performance insights

      The Claims Processing Pipeline shows the four critical stages:
      - Submitted stage with blue progress indicator showing newly filed claims
      - Under Review stage with yellow indicator for claims being assessed
      - Approved stage with green indicator for claims ready for payout
      - Paid Out stage with purple indicator showing completed claims

      Each claim in the main list displays:
      - Claim number for insurance company reference
      - Customer name and damage type such as Storm, Water, Wind, Hail, or Tree damage
      - Current status with color-coded badges - blue for Open, gray for Pending, green for Approved, outlined for Closed
      - Claim value showing the financial settlement amount
      - Assigned adjuster name for case management
      - Priority level with color coding - red for urgent, orange for high, blue for medium, green for low
      - Progress percentage with colored progress bars indicating processing completion

      The Xactimate Comparables section provides:
      - Industry-standard estimate comparisons for accurate claim valuation
      - Historical pricing data for similar damage types in the area
      - Adjustments for regional cost variations

      This Claims Central system ensures efficient processing of disaster-related insurance claims, tracks adjuster workloads, and maintains compliance with insurance regulations. The voice guide supports accessibility and hands-free operation during high-volume claim processing periods.`;
      
      const utterance = new SpeechSynthesisUtterance(voiceContent);
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      utterance.volume = 0.8;
      
      if (voices.length > 0) {
        // Prefer natural female voices for professional, empathetic delivery
        const femaleVoice = voices.find(voice => 
          voice.lang.includes('en') && 
          (voice.name.toLowerCase().includes('female') || 
           voice.name.toLowerCase().includes('zira') ||
           voice.name.toLowerCase().includes('samantha') ||
           voice.name.toLowerCase().includes('google uk') ||
           voice.name.toLowerCase().includes('fiona'))
        );
        utterance.voice = femaleVoice || voices.find(voice => voice.lang.includes('en')) || voices[0];
      }
      
      utterance.onend = () => {
        setIsVoiceGuideActive(false);
      };
      
      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event);
        setIsVoiceGuideActive(false);
      };
      
      window.speechSynthesis.speak(utterance);
    } else {
      window.speechSynthesis.cancel();
      setIsVoiceGuideActive(false);
    }
  };

  // Calculate metrics
  const openClaims = claims.filter(c => c.status === 'open').length;
  const pendingClaims = claims.filter(c => c.status === 'pending').length;
  const approvedClaims = claims.filter(c => c.status === 'approved').length;
  const totalValue = claims.reduce((sum, c) => sum + c.value, 0);
  const avgProcessingTime = 4.2; // Mock average

  return (
    <>
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
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={newClaim.notes}
                  onChange={(e) => setNewClaim({...newClaim, notes: e.target.value})}
                  placeholder="Additional notes about the claim..."
                  data-testid="textarea-notes"
                />
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
          <Clock className="h-5 w-5 text-blue-500 mr-2" />
          Claims Processing Pipeline
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="ml-2 h-2 w-2 bg-blue-500 rounded-full"
          />
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { stage: 'Submitted', count: 47, color: 'bg-blue-500', percentage: 100 },
            { stage: 'Under Review', count: 32, color: 'bg-yellow-500', percentage: 68 },
            { stage: 'Approved', count: 28, color: 'bg-green-500', percentage: 60 },
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
                              claim.priority === 'urgent' ? 'bg-red-500' :
                              claim.priority === 'high' ? 'bg-orange-500' :
                              claim.priority === 'medium' ? 'bg-blue-500' : 'bg-green-500'
                            }`}>
                              <FileText className="h-6 w-6" />
                            </div>
                            {claim.priority === 'urgent' && (
                              <PulseAlert intensity="strong">
                                <AlertTriangle className="absolute -top-1 -right-1 h-3 w-3 text-red-500" />
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
              <DollarSign className="w-5 h-5 mr-2 text-green-500" />
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
              <TrendingUp className="w-5 h-5 mr-2 text-blue-500" />
              Status Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { status: 'Open', count: openClaims, total: claims.length, color: 'bg-blue-500' },
                { status: 'Pending', count: pendingClaims, total: claims.length, color: 'bg-yellow-500' },
                { status: 'Approved', count: approvedClaims, total: claims.length, color: 'bg-green-500' },
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
    </>
  );
}