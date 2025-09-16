import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { Target, MapPin, Phone, Mail, Users, Wrench, Home, Car, Trees, Zap, AlertTriangle, Brain, Sparkles } from 'lucide-react';
import { DashboardSection } from '@/components/DashboardSection';
import { FadeIn, PulseAlert, StaggerContainer, StaggerItem, HoverLift, CountUp } from '@/components/ui/animations';

interface Lead {
  id: string;
  type: string;
  address: string;
  ownerName: string;
  phone: string;
  email: string;
  damageDescription: string;
  coverageType: string;
  estimatedValue: string;
  priority: 'emergency' | 'urgent' | 'high' | 'medium';
  contractorsNeeded: string[];
  aiConfidence: number;
  images: number;
  timestamp: string;
  status: string;
}

export default function Leads() {
  const [filter, setFilter] = useState('all');

  // Mock data with React Query
  const { data: leads = [], isLoading } = useQuery({
    queryKey: ['leads', filter],
    queryFn: async (): Promise<Lead[]> => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const sampleLeads = [
        {
          id: 'L001',
          type: 'tree_on_house',
          address: '123 Oak Street, Tampa, FL 33602',
          ownerName: 'Sarah Johnson',
          phone: '(813) 555-0123',
          email: 'sarah.johnson@email.com',
          damageDescription: 'Large oak tree fallen on main roof section',
          coverageType: 'Coverage A - Dwelling',
          estimatedValue: '$15,000',
          priority: 'urgent' as const,
          contractorsNeeded: ['Tree Services', 'Roofing', 'General Contractor'],
          aiConfidence: 94,
          images: 3,
          timestamp: '2024-01-15 14:30:00',
          status: 'active'
        },
        {
          id: 'L002',
          type: 'tree_on_car',
          address: '456 Pine Drive, Orlando, FL 32801',
          ownerName: 'Michael Chen',
          phone: '(407) 555-0456',
          email: 'mike.chen@email.com',
          damageDescription: 'Tree branch damaged vehicle in driveway',
          coverageType: 'Coverage B - Personal Property',
          estimatedValue: '$8,500',
          priority: 'high' as const,
          contractorsNeeded: ['Tree Services', 'Auto Body'],
          aiConfidence: 89,
          images: 2,
          timestamp: '2024-01-15 13:45:00',
          status: 'active'
        },
        {
          id: 'L003',
          type: 'tree_blocking_road',
          address: 'Maple Avenue & 5th Street, Jacksonville, FL 32205',
          ownerName: 'City of Jacksonville',
          phone: '(904) 555-0789',
          email: 'emergency@coj.net',
          damageDescription: 'Large tree blocking major intersection',
          coverageType: 'Municipal - Emergency Access',
          estimatedValue: '$12,000',
          priority: 'emergency' as const,
          contractorsNeeded: ['Tree Services', 'Traffic Management', 'Cleanup Crew'],
          aiConfidence: 97,
          images: 4,
          timestamp: '2024-01-15 15:15:00',
          status: 'active'
        }
      ];

      return filter === 'all' ? sampleLeads : sampleLeads.filter(lead => 
        filter === 'urgent' ? ['emergency', 'urgent'].includes(lead.priority) :
        filter === 'tree' ? lead.type.includes('tree') :
        filter === 'unassigned' ? Math.random() > 0.5 : true
      );
    },
    refetchInterval: 10000, // Refetch every 10 seconds for new AI leads
  });

  const getPriorityColor = (priority: string) => {
    switch(priority) {
      case 'emergency': return 'bg-red-600 text-white border-red-600';
      case 'urgent': return 'bg-orange-500 text-white border-orange-500';
      case 'high': return 'bg-yellow-500 text-black border-yellow-500';
      default: return 'bg-green-500 text-white border-green-500';
    }
  };

  const getDamageIcon = (type: string) => {
    switch(type) {
      case 'tree_on_house': return <Home className="w-4 h-4" />;
      case 'tree_on_car': return <Car className="w-4 h-4" />;
      case 'tree_blocking_road': return <AlertTriangle className="w-4 h-4" />;
      default: return <Trees className="w-4 h-4" />;
    }
  };

  const getConfidenceRingColor = (confidence: number) => {
    if (confidence >= 90) return 'stroke-green-500';
    if (confidence >= 80) return 'stroke-blue-500';
    if (confidence >= 70) return 'stroke-yellow-500';
    return 'stroke-red-500';
  };

  return (
    <DashboardSection
      title="AI Damage Leads"
      description="AI-powered damage detection from live footage with property owner information and contractor assignments"
      icon={Target}
      badge={{ text: 'AI ACTIVE', variant: 'default' }}
      kpis={[
        { label: 'Active Leads', value: 23, change: '+5 in last hour', color: 'blue', testId: 'stat-active-leads' },
        { label: 'High Priority', value: 8, change: 'Requires immediate attention', color: 'red', testId: 'stat-urgent-leads' },
        { label: 'AI Confidence', value: 92, change: 'Average accuracy', color: 'green', suffix: '%', testId: 'stat-ai-confidence' },
        { label: 'Potential Revenue', value: 425000, change: 'Total estimated value', color: 'amber', suffix: '', testId: 'stat-potential-revenue' }
      ]}
      actions={[
        { icon: Brain, label: 'AI Dashboard', variant: 'default', testId: 'button-ai-dashboard' },
        { icon: Target, label: 'Assign Contractors', variant: 'outline', testId: 'button-assign-contractors' },
        { icon: Sparkles, label: 'ML Training', variant: 'outline', testId: 'button-ml-training' }
      ]}
      testId="leads-section"
    >
      {/* AI Status Indicator */}
      <div className="mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="h-8 w-8 bg-green-500 rounded-full flex items-center justify-center"
              >
                <Brain className="h-4 w-4 text-white" />
              </motion.div>
              <div>
                <h3 className="font-semibold text-green-900 dark:text-green-100">AI Detection System Active</h3>
                <p className="text-sm text-green-700 dark:text-green-300">Monitoring live footage from traffic cameras, drone feeds, and social media uploads</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-3 h-3 bg-green-500 rounded-full"
              />
              <span className="text-sm text-green-600 font-medium">LIVE</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Filter Buttons */}
      <div className="flex space-x-4 mb-6">
        {[
          { key: 'all', label: 'All Leads' },
          { key: 'urgent', label: 'Urgent' },
          { key: 'tree', label: 'Tree Damage' },
          { key: 'unassigned', label: 'Unassigned' }
        ].map((filterOption) => (
          <Button
            key={filterOption.key}
            variant={filter === filterOption.key ? 'default' : 'outline'}
            onClick={() => setFilter(filterOption.key)}
            data-testid={`button-filter-${filterOption.key}`}
          >
            {filterOption.label}
          </Button>
        ))}
      </div>

      {/* Leads List */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : (
        <StaggerContainer className="space-y-6">
          {leads.map((lead) => (
            <StaggerItem key={lead.id}>
              <HoverLift>
                <Card className="relative overflow-hidden transition-all duration-300 hover:shadow-xl">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-50/30 to-indigo-50/30 dark:from-blue-900/10 dark:to-indigo-900/10" />
                  <CardHeader className="relative">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          {getDamageIcon(lead.type)}
                          <CardTitle className="text-lg" data-testid={`lead-title-${lead.id}`}>
                            Lead #{lead.id} - {lead.damageDescription}
                          </CardTitle>
                        </div>
                        
                        {/* Animated Priority Badge */}
                        <motion.div
                          animate={lead.priority === 'emergency' ? { 
                            scale: [1, 1.05, 1],
                            boxShadow: ['0 0 0 0 rgba(239, 68, 68, 0.7)', '0 0 0 10px rgba(239, 68, 68, 0)', '0 0 0 0 rgba(239, 68, 68, 0)']
                          } : {}}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <Badge className={getPriorityColor(lead.priority)}>
                            {lead.priority.toUpperCase()}
                          </Badge>
                        </motion.div>

                        {/* AI Confidence Ring */}
                        <div className="relative flex items-center justify-center">
                          <svg className="w-12 h-12 transform -rotate-90">
                            <circle
                              cx="24"
                              cy="24"
                              r="20"
                              stroke="currentColor"
                              strokeWidth="3"
                              fill="transparent"
                              className="text-gray-200 dark:text-gray-700"
                            />
                            <motion.circle
                              cx="24"
                              cy="24"
                              r="20"
                              stroke="currentColor"
                              strokeWidth="3"
                              fill="transparent"
                              strokeLinecap="round"
                              strokeDasharray={`${2 * Math.PI * 20}`}
                              initial={{ strokeDashoffset: 2 * Math.PI * 20 }}
                              animate={{ strokeDashoffset: 2 * Math.PI * 20 * (1 - lead.aiConfidence / 100) }}
                              transition={{ duration: 1.5, ease: "easeOut" }}
                              className={getConfidenceRingColor(lead.aiConfidence)}
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                              {lead.aiConfidence}%
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {lead.timestamp}
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="relative">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Property Info */}
                      <div className="space-y-3">
                        <h4 className="font-semibold text-gray-700 dark:text-gray-300 flex items-center">
                          <MapPin className="w-4 h-4 mr-2" />
                          Property Information
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div><strong>Address:</strong> {lead.address}</div>
                          <div><strong>Owner:</strong> {lead.ownerName}</div>
                          <div><strong>Phone:</strong> {lead.phone}</div>
                          <div><strong>Email:</strong> {lead.email}</div>
                          <div><strong>Coverage:</strong> {lead.coverageType}</div>
                          <div><strong>Est. Value:</strong> {lead.estimatedValue}</div>
                        </div>
                      </div>

                      {/* Contractor Needs */}
                      <div className="space-y-3">
                        <h4 className="font-semibold text-gray-700 dark:text-gray-300 flex items-center">
                          <Users className="w-4 h-4 mr-2" />
                          Contractors Needed
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {lead.contractorsNeeded.map((contractor, index) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: index * 0.1 }}
                            >
                              <Badge variant="outline" className="flex items-center hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                                <Wrench className="w-3 h-3 mr-1" />
                                {contractor}
                              </Badge>
                            </motion.div>
                          ))}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          <strong>Images:</strong> {lead.images} available
                        </div>
                      </div>

                      {/* Quick Actions */}
                      <div className="space-y-3">
                        <h4 className="font-semibold text-gray-700 dark:text-gray-300">Quick Actions</h4>
                        <div className="space-y-2">
                          <Button className="w-full" size="sm" data-testid={`button-call-${lead.id}`}>
                            <Phone className="w-4 h-4 mr-2" />
                            Call Owner
                          </Button>
                          <Button variant="outline" className="w-full" size="sm" data-testid={`button-email-${lead.id}`}>
                            <Mail className="w-4 h-4 mr-2" />
                            Send Email
                          </Button>
                          <Button variant="outline" className="w-full" size="sm" data-testid={`button-assign-${lead.id}`}>
                            <Target className="w-4 h-4 mr-2" />
                            Assign Contractors
                          </Button>
                          <Button variant="outline" className="w-full" size="sm" data-testid={`button-details-${lead.id}`}>
                            <Zap className="w-4 h-4 mr-2" />
                            View Details
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
    </DashboardSection>
  );
}