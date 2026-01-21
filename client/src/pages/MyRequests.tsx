import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  FileText, 
  Camera, 
  Wrench, 
  Clock, 
  MapPin,
  AlertCircle,
  CheckCircle,
  Phone,
  User,
  Plus
} from 'lucide-react';
import ModuleAIAssistant from '@/components/ModuleAIAssistant';

interface VictimUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  propertyAddress: string;
  city: string;
  state: string;
  zipCode: string;
  propertyType: string;
}

interface DamageReport {
  id: string;
  title: string;
  description: string;
  damageType: string;
  severity: string;
  status: string;
  photoCount: number;
  videoCount: number;
  createdAt: string;
  updatedAt: string;
}

interface ServiceRequest {
  id: string;
  serviceType: string;
  urgency: string;
  description: string;
  estimatedScope: string;
  budgetRange: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export default function MyRequests() {
  const [user, setUser] = useState<VictimUser | null>(null);

  useEffect(() => {
    const userData = localStorage.getItem('victimUser');
    if (userData) {
      setUser(JSON.parse(userData));
    } else {
      window.location.href = '/victim/login';
    }
  }, []);

  const { data: damageReports, isLoading: damageReportsLoading } = useQuery({
    queryKey: ['damage-reports', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const response = await fetch(`/api/victim/damage-reports/${user.id}`);
      if (!response.ok) throw new Error('Failed to fetch damage reports');
      const data = await response.json();
      return data.damageReports || [];
    },
    enabled: !!user?.id
  });

  const { data: serviceRequests, isLoading: serviceRequestsLoading } = useQuery({
    queryKey: ['service-requests', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const response = await fetch(`/api/victim/service-requests/${user.id}`);
      if (!response.ok) throw new Error('Failed to fetch service requests');
      const data = await response.json();
      return data.serviceRequests || [];
    },
    enabled: !!user?.id
  });

  const getStatusBadge = (status: string, type: 'damage' | 'service') => {
    const statusConfig = {
      damage: {
        submitted: { color: 'bg-blue-100 text-blue-800', label: 'Submitted' },
        reviewed: { color: 'bg-yellow-100 text-yellow-800', label: 'Under Review' },
        contractor_assigned: { color: 'bg-purple-100 text-purple-800', label: 'Contractor Assigned' },
        in_progress: { color: 'bg-orange-100 text-orange-800', label: 'In Progress' },
        completed: { color: 'bg-green-100 text-green-800', label: 'Completed' }
      },
      service: {
        open: { color: 'bg-blue-100 text-blue-800', label: 'Open' },
        contractor_assigned: { color: 'bg-purple-100 text-purple-800', label: 'Contractor Assigned' },
        estimate_received: { color: 'bg-yellow-100 text-yellow-800', label: 'Estimate Received' },
        work_scheduled: { color: 'bg-orange-100 text-orange-800', label: 'Work Scheduled' },
        in_progress: { color: 'bg-orange-100 text-orange-800', label: 'In Progress' },
        completed: { color: 'bg-green-100 text-green-800', label: 'Completed' },
        cancelled: { color: 'bg-gray-100 text-gray-800', label: 'Cancelled' }
      }
    };

    const config = statusConfig[type][status] || { color: 'bg-gray-100 text-gray-800', label: status };
    return (
      <Badge className={`${config.color} border-0`}>
        {config.label}
      </Badge>
    );
  };

  const getSeverityBadge = (severity: string) => {
    const severityConfig = {
      emergency: { color: 'bg-red-100 text-red-800', icon: AlertCircle },
      urgent: { color: 'bg-orange-100 text-orange-800', icon: AlertCircle },
      moderate: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      minor: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle }
    };

    const config = severityConfig[severity] || severityConfig.moderate;
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} border-0 flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {severity.charAt(0).toUpperCase() + severity.slice(1)}
      </Badge>
    );
  };

  const formatServiceType = (type: string) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const formatDamageType = (type: string) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <title>My Requests - Storm Victim Portal</title>
      <meta name="description" content="Track your damage reports and service requests, view status updates and contractor assignments" />
      
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Link href="/victim/dashboard">
                <Button variant="ghost" size="sm" data-testid="button-back">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900">My Requests</h1>
                <p className="text-sm text-gray-600">Track your damage reports and service requests</p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Link href="/victim/report-damage">
                <Button size="sm" data-testid="button-new-damage-report">
                  <Camera className="w-4 h-4 mr-2" />
                  Report Damage
                </Button>
              </Link>
              <Link href="/victim/request-help">
                <Button variant="outline" size="sm" data-testid="button-new-service-request">
                  <Wrench className="w-4 h-4 mr-2" />
                  Request Help
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="damage-reports" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="damage-reports" className="flex items-center gap-2" data-testid="tab-damage-reports">
              <Camera className="w-4 h-4" />
              Damage Reports ({damageReports?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="service-requests" className="flex items-center gap-2" data-testid="tab-service-requests">
              <Wrench className="w-4 h-4" />
              Service Requests ({serviceRequests?.length || 0})
            </TabsTrigger>
          </TabsList>

          {/* Damage Reports Tab */}
          <TabsContent value="damage-reports" className="space-y-4">
            {damageReportsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading damage reports...</p>
              </div>
            ) : damageReports && damageReports.length > 0 ? (
              <div className="grid gap-4">
                {damageReports.map((report: DamageReport) => (
                  <Card key={report.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2" data-testid={`text-damage-title-${report.id}`}>
                            {report.title}
                          </h3>
                          <div className="flex flex-wrap gap-2 mb-3">
                            {getStatusBadge(report.status, 'damage')}
                            {getSeverityBadge(report.severity)}
                            <Badge variant="outline">
                              {formatDamageType(report.damageType)}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right text-sm text-gray-500">
                          <p>Submitted</p>
                          <p>{new Date(report.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      
                      <p className="text-gray-600 mb-4 line-clamp-2">{report.description}</p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          {report.photoCount > 0 && (
                            <span className="flex items-center gap-1">
                              <Camera className="w-4 h-4" />
                              {report.photoCount} photos
                            </span>
                          )}
                          {report.videoCount > 0 && (
                            <span className="flex items-center gap-1">
                              <FileText className="w-4 h-4" />
                              {report.videoCount} videos
                            </span>
                          )}
                        </div>
                        
                        <Button variant="outline" size="sm" data-testid={`button-view-damage-${report.id}`}>
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Camera className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Damage Reports Yet</h3>
                  <p className="text-gray-600 mb-6">
                    Start by reporting any storm damage to your property
                  </p>
                  <Link href="/victim/report-damage">
                    <Button data-testid="button-create-first-damage-report">
                      <Camera className="w-4 h-4 mr-2" />
                      Report Damage
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Service Requests Tab */}
          <TabsContent value="service-requests" className="space-y-4">
            {serviceRequestsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading service requests...</p>
              </div>
            ) : serviceRequests && serviceRequests.length > 0 ? (
              <div className="grid gap-4">
                {serviceRequests.map((request: ServiceRequest) => (
                  <Card key={request.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2" data-testid={`text-service-title-${request.id}`}>
                            {formatServiceType(request.serviceType)}
                          </h3>
                          <div className="flex flex-wrap gap-2 mb-3">
                            {getStatusBadge(request.status, 'service')}
                            <Badge variant="outline" className={
                              request.urgency === 'immediate' ? 'bg-red-50 text-red-700 border-red-200' :
                              request.urgency === 'urgent' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                              'bg-blue-50 text-blue-700 border-blue-200'
                            }>
                              {request.urgency.charAt(0).toUpperCase() + request.urgency.slice(1)}
                            </Badge>
                            {request.estimatedScope && (
                              <Badge variant="outline">
                                {request.estimatedScope.charAt(0).toUpperCase() + request.estimatedScope.slice(1)} Scope
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-right text-sm text-gray-500">
                          <p>Requested</p>
                          <p>{new Date(request.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      
                      <p className="text-gray-600 mb-4 line-clamp-2">{request.description}</p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          {request.budgetRange && (
                            <span>Budget: {request.budgetRange.replace('_', ' ').toUpperCase()}</span>
                          )}
                        </div>
                        
                        <Button variant="outline" size="sm" data-testid={`button-view-service-${request.id}`}>
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Wrench className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Service Requests Yet</h3>
                  <p className="text-gray-600 mb-6">
                    Request help from qualified contractors for repairs and restoration
                  </p>
                  <Link href="/victim/request-help">
                    <Button data-testid="button-create-first-service-request">
                      <Wrench className="w-4 h-4 mr-2" />
                      Request Help
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>
      <ModuleAIAssistant 
        moduleName="My Requests"
        moduleContext="View your damage reports and service requests. Rachel can help you track your submissions, understand request statuses, explain next steps in the assessment process, and guide you through requesting additional help."
      />
    </div>
  );
}