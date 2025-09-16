import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useQuery } from '@tanstack/react-query';
import { Users, Plus, Search, Settings, Shield, AlertTriangle, CheckCircle, TrendingUp, Star, MapPin, Calendar } from 'lucide-react';
import { DashboardSection } from '@/components/DashboardSection';
import { FadeIn, PulseAlert, StaggerContainer, StaggerItem, HoverLift } from '@/components/ui/animations';

interface ContractorStatus {
  id: string;
  name: string;
  specialty: string;
  status: 'available' | 'busy' | 'offline';
  location: string;
  rating: number;
  completedJobs: number;
  responseTime: string;
  lastActive: string;
}

export default function ContractorManagement() {
  const [selectedRegion, setSelectedRegion] = useState('all');

  // Mock contractor data with React Query
  const { data: contractors = [], isLoading } = useQuery({
    queryKey: ['contractors', selectedRegion],
    queryFn: async (): Promise<ContractorStatus[]> => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return [
        { id: '1', name: 'Mike\'s Tree Service', specialty: 'Tree Removal', status: 'available', location: 'Tampa, FL', rating: 4.8, completedJobs: 45, responseTime: '15 min', lastActive: '2 min ago' },
        { id: '2', name: 'Roof Masters Inc', specialty: 'Roofing', status: 'busy', location: 'Orlando, FL', rating: 4.9, completedJobs: 67, responseTime: '22 min', lastActive: '1 hour ago' },
        { id: '3', name: 'Emergency Cleanup Pro', specialty: 'Debris Removal', status: 'available', location: 'Jacksonville, FL', rating: 4.7, completedJobs: 38, responseTime: '18 min', lastActive: '5 min ago' },
        { id: '4', name: 'Storm Restoration LLC', specialty: 'Water Damage', status: 'offline', location: 'Miami, FL', rating: 4.6, completedJobs: 29, responseTime: '35 min', lastActive: '2 hours ago' },
        { id: '5', name: 'Lightning Fast Repairs', specialty: 'Electrical', status: 'available', location: 'Fort Myers, FL', rating: 4.9, completedJobs: 52, responseTime: '12 min', lastActive: '1 min ago' },
      ];
    },
    refetchInterval: 30000, // Refetch every 30 seconds for live status
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-500';
      case 'busy': return 'bg-yellow-500';
      case 'offline': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available': return { text: 'AVAILABLE', variant: 'default' as const };
      case 'busy': return { text: 'BUSY', variant: 'secondary' as const };
      case 'offline': return { text: 'OFFLINE', variant: 'outline' as const };
      default: return { text: 'UNKNOWN', variant: 'outline' as const };
    }
  };

  const availableCount = contractors.filter(c => c.status === 'available').length;
  const busyCount = contractors.filter(c => c.status === 'busy').length;
  const offlineCount = contractors.filter(c => c.status === 'offline').length;
  const avgRating = contractors.reduce((sum, c) => sum + c.rating, 0) / contractors.length || 0;

  return (
    <DashboardSection
      title="Contractor Management"
      description="Administrative oversight and management of your contractor network, qualifications, and assignments"
      icon={Users}
      badge={{ text: `${contractors.length} ACTIVE`, variant: 'default' }}
      kpis={[
        { label: 'Total Contractors', value: 247, change: '+12 this month', color: 'blue', testId: 'text-active-contractors' },
        { label: 'Available Now', value: availableCount, change: 'Ready for dispatch', color: 'green', testId: 'text-available-contractors' },
        { label: 'On Assignment', value: busyCount, change: 'Across 23 states', color: 'amber', testId: 'text-assigned-contractors' },
        { label: 'Avg Rating', value: avgRating, change: 'Customer satisfaction', color: 'default', suffix: '/5.0', testId: 'text-avg-rating' }
      ]}
      actions={[
        { icon: Plus, label: 'Add Contractor', variant: 'default', testId: 'button-add-contractor' },
        { icon: Search, label: 'Search Network', variant: 'outline', testId: 'button-search-contractors' },
        { icon: TrendingUp, label: 'Analytics', variant: 'outline', testId: 'button-contractor-analytics' }
      ]}
      testId="contractor-management"
    >
      {/* Availability Heatmap */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center">
            <MapPin className="h-5 w-5 text-blue-500 mr-2" />
            Regional Availability Heatmap
          </h3>
          <div className="flex space-x-2">
            {['all', 'FL', 'GA', 'AL'].map((region) => (
              <Button
                key={region}
                variant={selectedRegion === region ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedRegion(region)}
                data-testid={`button-region-${region}`}
              >
                {region.toUpperCase()}
              </Button>
            ))}
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { region: 'Tampa Bay', available: 12, total: 18, percentage: 67 },
            { region: 'Orlando', available: 8, total: 15, percentage: 53 },
            { region: 'Jacksonville', available: 15, total: 22, percentage: 68 },
            { region: 'Miami', available: 6, total: 19, percentage: 32 },
          ].map((area, index) => (
            <HoverLift key={area.region}>
              <Card className="relative overflow-hidden">
                <CardContent className="p-4">
                  <div className="text-center">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">{area.region}</h4>
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
                          animate={{ strokeDashoffset: 2 * Math.PI * 28 * (1 - area.percentage / 100) }}
                          transition={{ duration: 1.5, ease: "easeOut", delay: index * 0.2 }}
                          className={area.percentage > 60 ? 'text-green-500' : area.percentage > 40 ? 'text-yellow-500' : 'text-red-500'}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                          {area.percentage}%
                        </span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Badge variant={area.percentage > 60 ? 'default' : area.percentage > 40 ? 'secondary' : 'destructive'}>
                        {area.available}/{area.total} Available
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </HoverLift>
          ))}
        </div>
      </div>

      {/* Live Contractor Status */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4 flex items-center">
          <Shield className="h-5 w-5 text-green-500 mr-2" />
          Live Contractor Status
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="ml-2 h-2 w-2 bg-green-500 rounded-full"
          />
        </h3>
        
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (
          <StaggerContainer className="space-y-4">
            {contractors.map((contractor) => (
              <StaggerItem key={contractor.id}>
                <HoverLift>
                  <Card className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-50/30 to-indigo-50/30 dark:from-blue-900/10 dark:to-indigo-900/10" />
                    <CardContent className="relative p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="relative">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                              {contractor.name.charAt(0)}
                            </div>
                            <motion.div
                              animate={contractor.status === 'available' ? { scale: [1, 1.2, 1] } : {}}
                              transition={{ duration: 2, repeat: Infinity }}
                              className={`absolute -bottom-1 -right-1 w-4 h-4 ${getStatusColor(contractor.status)} rounded-full border-2 border-white dark:border-gray-800`}
                            />
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <h4 className="font-semibold text-gray-900 dark:text-gray-100" data-testid={`contractor-name-${contractor.id}`}>
                                {contractor.name}
                              </h4>
                              <Badge {...getStatusBadge(contractor.status)} />
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{contractor.specialty} • {contractor.location}</p>
                            <div className="flex items-center space-x-4 mt-1">
                              <div className="flex items-center space-x-1">
                                <Star className="h-3 w-3 text-yellow-500 fill-current" />
                                <span className="text-xs text-gray-600 dark:text-gray-400">{contractor.rating}</span>
                              </div>
                              <span className="text-xs text-gray-500 dark:text-gray-400">{contractor.completedJobs} jobs</span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">Responds in {contractor.responseTime}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                          <div className="text-center">
                            <div className="text-xs text-gray-500 dark:text-gray-400">Last Active</div>
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {contractor.lastActive}
                            </div>
                          </div>
                          
                          <div className="flex space-x-2">
                            <Button size="sm" variant="outline" data-testid={`button-contact-${contractor.id}`}>
                              Contact
                            </Button>
                            <Button size="sm" variant="outline" data-testid={`button-assign-${contractor.id}`}>
                              Assign
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

      {/* Compliance Status with Pulses */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="w-5 w-5 mr-2 text-green-600" />
              Compliance Dashboard
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { metric: 'Insurance Up-to-Date', value: 98, status: 'good', icon: CheckCircle },
              { metric: 'License Renewals', value: 87, status: 'warning', icon: AlertTriangle },
              { metric: 'Background Checks', value: 100, status: 'good', icon: CheckCircle },
            ].map((item, index) => (
              <div key={item.metric} className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{item.metric}</span>
                <div className="flex items-center space-x-2">
                  <Progress value={item.value} className="w-20 h-2" />
                  <motion.div
                    animate={item.status === 'warning' ? { scale: [1, 1.2, 1] } : {}}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <item.icon className={`w-4 h-4 ${item.status === 'good' ? 'text-green-600' : 'text-amber-600'}`} />
                  </motion.div>
                  <span className={`text-sm font-medium ${item.status === 'good' ? 'text-green-600' : 'text-amber-600'}`}>
                    {item.value}%
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
              Performance Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: 'Avg. Completion Time', value: '4.2 days', trend: 'down' },
              { label: 'Customer Satisfaction', value: '4.7/5.0', trend: 'up' },
              { label: 'On-time Completion', value: '94%', trend: 'up' },
            ].map((metric, index) => (
              <div key={metric.label} className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">{metric.label}</span>
                <div className="flex items-center space-x-1">
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{metric.value}</span>
                  <motion.div
                    animate={{ y: metric.trend === 'up' ? [-2, 0, -2] : [2, 0, 2] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <TrendingUp className={`w-3 h-3 ${metric.trend === 'up' ? 'text-green-500 rotate-0' : 'text-red-500 rotate-180'}`} />
                  </motion.div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-amber-600" />
              Alert Center
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { message: '3 licenses expire in 30 days', type: 'warning' },
              { message: '5 new contractor applications', type: 'info' },
              { message: '12 projects completed this week', type: 'success' },
            ].map((alert, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`p-3 rounded-lg border-l-4 ${
                  alert.type === 'warning' ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-400' :
                  alert.type === 'info' ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-400' :
                  'bg-green-50 dark:bg-green-900/20 border-green-400'
                }`}
              >
                <p className={`text-sm ${
                  alert.type === 'warning' ? 'text-amber-800 dark:text-amber-200' :
                  alert.type === 'info' ? 'text-blue-800 dark:text-blue-200' :
                  'text-green-800 dark:text-green-200'
                }`}>
                  {alert.message}
                </p>
              </motion.div>
            ))}
          </CardContent>
        </Card>
      </div>
    </DashboardSection>
  );
}