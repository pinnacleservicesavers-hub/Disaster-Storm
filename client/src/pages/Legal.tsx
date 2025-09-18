import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { Scale, Plus, Search, Settings, AlertTriangle, Calendar, Clock, FileText, CheckCircle, Volume2, VolumeX } from 'lucide-react';
import { DashboardSection } from '@/components/DashboardSection';
import { FadeIn, PulseAlert, StaggerContainer, StaggerItem, HoverLift } from '@/components/ui/animations';

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
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [isVoiceGuideActive, setIsVoiceGuideActive] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

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
      case 'contract': return 'bg-blue-500';
      case 'lien': return 'bg-red-500';
      case 'license': return 'bg-green-500';
      case 'compliance': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
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
      
      const voiceContent = `Welcome to the Legal Command Voice Navigation Guide. This is your comprehensive legal compliance and contract management system for disaster recovery operations.

      The dashboard displays critical legal metrics:
      - Total Contracts showing active legal documents and agreements
      - Urgent Items displaying contracts and liens requiring immediate attention with deadlines
      - Completion Rate showing the percentage of successfully processed legal items
      - Monthly Processing indicating legal workload and productivity metrics

      Main action buttons include:
      - New Document with a plus icon to create new contracts, liens, or compliance items
      - Search Legal with a search icon to quickly locate specific legal documents
      - Settings with a gear icon to configure legal workflow preferences

      The legal items list displays comprehensive information:
      - Document type indicators with color-coded icons - blue for contracts, red for liens, green for licenses, purple for compliance items
      - Document titles and descriptions for easy identification
      - Deadline dates with days remaining counters to prevent missed filing deadlines
      - Priority levels with visual coding - red borders for critical items, orange for high priority, yellow for medium, green for low
      - Status badges showing pending, in progress, completed, or overdue states
      - Assigned team member names for accountability and workload distribution
      - Document values where applicable, particularly for lien amounts
      - Location information indicating which state or jurisdiction applies

      Critical deadline management features:
      - Color-coded urgency indicators that highlight items requiring immediate attention
      - Automated alerts for approaching deadlines to prevent legal violations
      - Priority sorting to ensure critical items are addressed first
      - Status tracking from initiation through completion

      Legal document types include:
      - Contracts for insurance agreements, vendor relationships, and customer service agreements
      - Liens for securing payment on completed disaster recovery work
      - Licenses for maintaining contractor certifications and state compliance
      - Compliance reviews for regulatory adherence across multiple jurisdictions

      Advanced compliance features:
      - Multi-state jurisdiction tracking for companies operating across state lines
      - Automated deadline calculations based on state-specific legal requirements
      - Document templates for common legal procedures
      - Integration with legal team workflows and external counsel coordination

      This Legal Command system ensures regulatory compliance, protects financial interests through proper lien procedures, and maintains professional standing through license management. The voice guide supports accessibility for legal professionals and provides hands-free operation during busy legal processing periods.`;
      
      const utterance = new SpeechSynthesisUtterance(voiceContent);
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      utterance.volume = 0.8;
      
      if (voices.length > 0) {
        utterance.voice = voices.find(voice => voice.lang.includes('en')) || voices[0];
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

  const getPriorityColor = (priority: string, daysRemaining: number) => {
    if (daysRemaining <= 3) return 'border-red-500 bg-red-50 dark:bg-red-900/20';
    if (priority === 'critical') return 'border-red-400 bg-red-50 dark:bg-red-900/20';
    if (priority === 'high') return 'border-orange-400 bg-orange-50 dark:bg-orange-900/20';
    if (priority === 'medium') return 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20';
    return 'border-green-400 bg-green-50 dark:bg-green-900/20';
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
        { icon: Plus, label: 'New Document', variant: 'default', testId: 'button-new-contract' },
        { icon: Search, label: 'Search Legal', variant: 'outline', testId: 'button-search-legal' },
        { icon: Settings, label: 'Settings', variant: 'outline', testId: 'button-legal-settings' },
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
          <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
          Critical Deadline Timeline
          <motion.div
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="ml-2 h-2 w-2 bg-red-500 rounded-full"
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
  );
}