import { useState } from "react";
import TopNavigation from "@/components/TopNavigation";
import Sidebar from "@/components/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from "@/contexts/LanguageContext";
import { useLegalCompliance, useLienRules, useAttorneys } from "@/hooks/useLegalData";
import { 
  Scale, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  FileText, 
  Search,
  ExternalLink,
  Calendar,
  MapPin,
  Phone,
  Mail
} from "lucide-react";

export default function LegalCompliance() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedState, setSelectedState] = useState("GA");
  const [searchTerm, setSearchTerm] = useState("");
  const { translate } = useLanguage();

  const { complianceStatus, urgentCount, warningCount } = useLegalCompliance();
  const { data: lienRules } = useLienRules();
  const { data: attorneys } = useAttorneys(selectedState);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'compliant':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'warning':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'action_needed':
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant':
        return 'bg-green-100 text-green-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'action_needed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string, daysRemaining: number) => {
    if (status === 'action_needed') {
      return 'Action Required';
    }
    if (status === 'warning') {
      return `${Math.abs(daysRemaining)} days left`;
    }
    return 'Compliant';
  };

  const stateNames: Record<string, string> = {
    'GA': 'Georgia',
    'FL': 'Florida',
    'TX': 'Texas',
    'AL': 'Alabama',
    'SC': 'South Carolina',
    'NC': 'North Carolina',
    'TN': 'Tennessee',
    'LA': 'Louisiana',
    'MS': 'Mississippi',
    'AR': 'Arkansas',
    'OK': 'Oklahoma',
    'KY': 'Kentucky'
  };

  const filteredAttorneys = attorneys?.filter(attorney =>
    attorney.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    attorney.firm.toLowerCase().includes(searchTerm.toLowerCase()) ||
    attorney.specialty.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()))
  ) || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNavigation onSidebarToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      
      <div className="pt-16 flex">
        <Sidebar collapsed={sidebarCollapsed} />
        
        <main className={`flex-1 transition-all duration-300 ${
          sidebarCollapsed ? 'ml-16' : 'ml-280'
        }`}>
          <div className="p-6">
            <div className="mb-8">
              <div className="flex items-center space-x-3">
                <Scale className="w-8 h-8 text-primary" />
                <div>
                  <h1 className="text-3xl font-bold text-gray-900" data-testid="legal-compliance-title">
                    {translate('legal_compliance')}
                  </h1>
                  <p className="text-gray-600 mt-1">
                    Multi-state legal compliance and lien management
                  </p>
                </div>
              </div>
            </div>

            {/* Compliance Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card data-testid="card-compliant-states">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Compliant States</p>
                      <p className="text-3xl font-bold text-green-600" data-testid="compliant-count">
                        {complianceStatus.filter(s => s.status === 'compliant').length}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <CheckCircle className="text-green-600 w-6 h-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="card-warning-states">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Warning States</p>
                      <p className="text-3xl font-bold text-yellow-600" data-testid="warning-count">
                        {warningCount}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                      <Clock className="text-yellow-600 w-6 h-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="card-urgent-states">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Urgent Action</p>
                      <p className="text-3xl font-bold text-red-600" data-testid="urgent-count">
                        {urgentCount}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                      <AlertTriangle className="text-red-600 w-6 h-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Legal Compliance Tabs */}
            <Tabs defaultValue="deadlines" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="deadlines" data-testid="tab-deadlines">
                  Lien Deadlines
                </TabsTrigger>
                <TabsTrigger value="rules" data-testid="tab-rules">
                  State Rules
                </TabsTrigger>
                <TabsTrigger value="attorneys" data-testid="tab-attorneys">
                  Legal Directory
                </TabsTrigger>
              </TabsList>

              <TabsContent value="deadlines" className="space-y-6">
                <Card data-testid="card-compliance-status">
                  <CardHeader>
                    <CardTitle>State Compliance Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {complianceStatus.map((item, index) => (
                        <div 
                          key={item.state} 
                          className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow"
                          data-testid={`compliance-state-${index}`}
                        >
                          <div className="flex items-center space-x-4">
                            {getStatusIcon(item.status)}
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                                <span className="text-white font-semibold text-sm">
                                  {item.state}
                                </span>
                              </div>
                              <div>
                                <div className="font-medium" data-testid={`state-name-${index}`}>
                                  {stateNames[item.state] || item.state}
                                </div>
                                <div className="text-sm text-gray-500">
                                  Filing deadline: {item.rule.lienFilingDeadline}
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-4">
                            <div className="text-right">
                              <div className="font-medium" data-testid={`deadline-date-${index}`}>
                                {item.deadlineDate.toLocaleDateString()}
                              </div>
                              <div className="text-sm text-gray-500">
                                {item.daysRemaining > 0 ? `${item.daysRemaining} days left` : 'Overdue'}
                              </div>
                            </div>
                            <Badge 
                              className={getStatusColor(item.status)}
                              data-testid={`status-badge-${index}`}
                            >
                              {getStatusText(item.status, item.daysRemaining)}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="rules" className="space-y-6">
                <Card data-testid="card-lien-rules">
                  <CardHeader>
                    <CardTitle>State Lien Rules</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>State</th>
                            <th>Preliminary Notice</th>
                            <th>Filing Deadline</th>
                            <th>Enforcement Deadline</th>
                            <th>Special Notes</th>
                            <th>Source</th>
                          </tr>
                        </thead>
                        <tbody>
                          {lienRules?.map((rule, index) => (
                            <tr key={rule.id} data-testid={`rule-row-${index}`}>
                              <td>
                                <div className="flex items-center space-x-2">
                                  <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                                    <span className="text-white font-semibold text-xs">
                                      {rule.state}
                                    </span>
                                  </div>
                                  <span className="font-medium">
                                    {stateNames[rule.state] || rule.state}
                                  </span>
                                </div>
                              </td>
                              <td>
                                <div>
                                  <Badge 
                                    className={rule.prelimNoticeRequired ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}
                                  >
                                    {rule.prelimNoticeRequired ? 'Required' : 'Not Required'}
                                  </Badge>
                                  {rule.prelimNoticeDeadline && (
                                    <div className="text-xs text-gray-500 mt-1">
                                      {rule.prelimNoticeDeadline}
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="font-medium" data-testid={`filing-deadline-${index}`}>
                                {rule.lienFilingDeadline}
                              </td>
                              <td data-testid={`enforcement-deadline-${index}`}>
                                {rule.enforcementDeadline}
                              </td>
                              <td className="text-sm" data-testid={`notes-${index}`}>
                                {rule.homesteadNote && (
                                  <div className="mb-1">
                                    <strong>Residential:</strong> {rule.homesteadNote}
                                  </div>
                                )}
                                {rule.treeServiceNote && (
                                  <div>
                                    <strong>Tree Service:</strong> {rule.treeServiceNote}
                                  </div>
                                )}
                              </td>
                              <td>
                                {rule.sourceUrl && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => window.open(rule.sourceUrl, '_blank')}
                                    data-testid={`source-link-${index}`}
                                  >
                                    <ExternalLink className="w-4 h-4" />
                                  </Button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="attorneys" className="space-y-6">
                <Card data-testid="card-attorney-directory">
                  <CardHeader>
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                      <CardTitle>Legal Directory</CardTitle>
                      <div className="mt-4 lg:mt-0 flex items-center space-x-4">
                        <select
                          value={selectedState}
                          onChange={(e) => setSelectedState(e.target.value)}
                          className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                          data-testid="select-attorney-state"
                        >
                          {Object.entries(stateNames).map(([code, name]) => (
                            <option key={code} value={code}>{name}</option>
                          ))}
                        </select>
                        <div className="relative">
                          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                          <Input
                            placeholder="Search attorneys..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 w-64"
                            data-testid="input-search-attorneys"
                          />
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {filteredAttorneys.map((attorney, index) => (
                        <div 
                          key={`${attorney.name}-${index}`} 
                          className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
                          data-testid={`attorney-card-${index}`}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h4 className="font-medium text-lg" data-testid={`attorney-name-${index}`}>
                                {attorney.name}
                              </h4>
                              <p className="text-gray-600" data-testid={`attorney-firm-${index}`}>
                                {attorney.firm}
                              </p>
                            </div>
                            <div className="flex items-center">
                              <div className="text-yellow-400 mr-1">★</div>
                              <span className="font-medium" data-testid={`attorney-rating-${index}`}>
                                {attorney.rating}
                              </span>
                            </div>
                          </div>
                          
                          <div className="space-y-2 mb-4">
                            <div className="flex items-center text-sm text-gray-600">
                              <Phone className="w-4 h-4 mr-2" />
                              <span data-testid={`attorney-phone-${index}`}>
                                {attorney.phone}
                              </span>
                            </div>
                            <div className="flex items-center text-sm text-gray-600">
                              <Mail className="w-4 h-4 mr-2" />
                              <span data-testid={`attorney-email-${index}`}>
                                {attorney.email}
                              </span>
                            </div>
                            <div className="flex items-center text-sm text-gray-600">
                              <MapPin className="w-4 h-4 mr-2" />
                              <span>{attorney.state}</span>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="text-sm font-medium text-gray-700">Specialties:</div>
                            <div className="flex flex-wrap gap-2">
                              {attorney.specialty.map((spec, specIndex) => (
                                <Badge 
                                  key={specIndex} 
                                  variant="secondary"
                                  className="text-xs"
                                  data-testid={`attorney-specialty-${index}-${specIndex}`}
                                >
                                  {spec}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          
                          {attorney.barNumber && (
                            <div className="mt-3 text-xs text-gray-500">
                              Bar #: {attorney.barNumber}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}
