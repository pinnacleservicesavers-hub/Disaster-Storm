import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
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
  CreditCard
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

export default function ContractorPortal() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [notifications, setNotifications] = useState([
    { id: 1, type: 'lien', message: 'Lien deadline in 15 days for Project #CH-2024-089', urgent: true },
    { id: 2, type: 'payment', message: 'Payment received: $4,250 for Storm Cleanup - Miami', urgent: false },
    { id: 3, type: 'lead', message: '3 new storm damage leads in your area', urgent: false }
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-blue-900" data-testid="text-portal-title">
                Contractor Portal
              </h1>
              <Badge className="bg-green-100 text-green-800">Pro Subscription Active</Badge>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm" data-testid="button-ai-assistant">
                <Bot className="w-4 h-4 mr-2" />
                AI Assistant
              </Button>
              <div className="relative">
                <Button variant="outline" size="sm" data-testid="button-notifications">
                  <Bell className="w-4 h-4" />
                  {notifications.filter(n => n.urgent).length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full text-xs w-5 h-5 flex items-center justify-center">
                      {notifications.filter(n => n.urgent).length}
                    </span>
                  )}
                </Button>
              </div>
              <Button variant="outline" size="sm" data-testid="button-profile-settings">
                <User className="w-4 h-4 mr-2" />
                Profile
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6">
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
                  <div className="text-2xl font-bold" data-testid="text-active-projects">12</div>
                  <p className="text-xs text-gray-500">+3 this week</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">Revenue (Month)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600" data-testid="text-monthly-revenue">$48,250</div>
                  <p className="text-xs text-gray-500">+18% from last month</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">New Leads</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600" data-testid="text-new-leads">7</div>
                  <p className="text-xs text-gray-500">In your coverage area</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">Customer Rating</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <div className="text-2xl font-bold mr-2" data-testid="text-customer-rating">4.8</div>
                    <Star className="w-5 h-5 text-yellow-500 fill-current" />
                  </div>
                  <p className="text-xs text-gray-500">Based on 24 reviews</p>
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
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-sm font-medium">Invoice #INV-2024-089 paid</p>
                      <p className="text-xs text-gray-500">2 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Camera className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium">Photos uploaded for Storm Cleanup Miami</p>
                      <p className="text-xs text-gray-500">4 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Target className="w-5 h-5 text-purple-600" />
                    <div>
                      <p className="text-sm font-medium">New lead claimed: Tree Removal - Coral Gables</p>
                      <p className="text-xs text-gray-500">1 day ago</p>
                    </div>
                  </div>
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
                  {notifications.map((notification) => (
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
                  ))}
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
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Available Leads</h2>
              <Button data-testid="button-filter-leads">
                <MapPin className="w-4 h-4 mr-2" />
                Filter by Location
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((lead) => (
                <Card key={lead}>
                  <CardHeader>
                    <CardTitle className="text-lg">Storm Damage - Tree on House</CardTitle>
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="w-4 h-4 mr-1" />
                      Miami, FL • 2.3 miles away
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Estimated Value:</span>
                      <span className="font-semibold text-green-600">$8,500</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Urgency:</span>
                      <Badge className="bg-red-100 text-red-800">High</Badge>
                    </div>
                    <p className="text-sm text-gray-600">
                      Large oak tree fell on roof during Hurricane Ian. Need immediate removal and roof assessment.
                    </p>
                    <div className="flex space-x-2">
                      <Button className="flex-1" data-testid={`button-claim-lead-${lead}`}>
                        <Target className="w-4 h-4 mr-2" />
                        Claim Lead
                      </Button>
                      <Button variant="outline" data-testid={`button-view-details-${lead}`}>
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
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
                  <Button data-testid="button-upload-photos-main">
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
                    <h4 className="font-semibold text-purple-900 mb-2">Xactimate-Style Analysis</h4>
                    <p className="text-sm text-purple-700">
                      AI analyzes market rates within 150-mile radius and provides detailed cost breakdowns
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
                  <Button variant="outline" className="w-full" data-testid="button-generate-estimate">
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
                    <p>• Tax Assessor API → Homeowner name/address</p>
                    <p>• TruthFinder API → Phone number/email contact</p>
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

                <Button variant="outline" className="w-full" data-testid="button-victim-portal-access">
                  <Heart className="w-4 h-4 mr-2" />
                  Access Victim Portal
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Tools Tab */}
          <TabsContent value="ai" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bot className="w-5 h-5 mr-2" />
                  AI Support & Assistance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-3">Your AI Assistant is Ready</h4>
                  <p className="text-sm text-gray-700 mb-4">
                    Get help with compliance, contracts, pricing, claims processes, and more. Your AI assistant has access to industry best practices and your project history.
                  </p>
                  <Button data-testid="button-start-ai-chat">
                    <Bot className="w-4 h-4 mr-2" />
                    Start AI Chat
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-green-900 mb-2">AI Capabilities</h4>
                    <ul className="text-sm text-green-700 space-y-1">
                      <li>• Compliance guidance</li>
                      <li>• Contract review assistance</li>
                      <li>• Pricing recommendations</li>
                      <li>• Claims process help</li>
                      <li>• Legal deadline reminders</li>
                    </ul>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2">Quick AI Actions</h4>
                    <div className="space-y-2">
                      <Button size="sm" variant="outline" className="w-full justify-start" data-testid="button-ai-estimate">
                        Generate Cost Estimate
                      </Button>
                      <Button size="sm" variant="outline" className="w-full justify-start" data-testid="button-ai-contract">
                        Review Contract
                      </Button>
                      <Button size="sm" variant="outline" className="w-full justify-start" data-testid="button-ai-compliance">
                        Check Compliance
                      </Button>
                    </div>
                  </div>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Recent AI Interactions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-start space-x-3">
                        <Bot className="w-5 h-5 text-blue-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">Cost estimate for tree removal</p>
                          <p className="text-xs text-gray-500">Generated pricing for 60ft oak tree removal in Miami area</p>
                          <p className="text-xs text-gray-400">2 hours ago</p>
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
                          <p className="text-xs text-gray-500">Reviewed claim documentation and suggested improvements</p>
                          <p className="text-xs text-gray-400">3 days ago</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}