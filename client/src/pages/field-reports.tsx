import { useState } from "react";
import TopNavigation from "@/components/TopNavigation";
import Sidebar from "@/components/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from "@/contexts/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { fieldReportsApi } from "@/lib/api";
import { 
  Smartphone, 
  MapPin, 
  Clock, 
  Camera, 
  Video, 
  Mic, 
  AlertTriangle,
  Plus,
  Filter,
  Search,
  CheckCircle,
  User,
  Calendar,
  FileText,
  TrendingUp,
  Users
} from "lucide-react";

export default function FieldReports() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const { translate } = useLanguage();

  const { data: reports, isLoading } = useQuery({
    queryKey: ["/api/field-reports"],
    queryFn: () => fieldReportsApi.getReports(),
    refetchInterval: 30000,
  });

  const filteredReports = reports?.filter(report => {
    const matchesSearch = searchTerm === "" || 
      report.crewName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === "all" || report.status === filterStatus;
    const matchesPriority = filterPriority === "all" || report.priority === filterPriority;
    
    return matchesSearch && matchesStatus && matchesPriority;
  }) || [];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'normal':
        return 'bg-blue-100 text-blue-800';
      case 'low':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCrewInitials = (crewName: string) => {
    return crewName.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatTimeAgo = (date: Date) => {
    const minutes = Math.floor((new Date().getTime() - new Date(date).getTime()) / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  // Calculate statistics
  const totalReports = reports?.length || 0;
  const pendingReports = reports?.filter(r => r.status === 'pending').length || 0;
  const urgentReports = reports?.filter(r => r.priority === 'urgent').length || 0;
  const completedReports = reports?.filter(r => r.status === 'completed').length || 0;
  const uniqueCrews = new Set(reports?.map(r => r.crewId)).size || 0;

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
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center space-x-3">
                  <Smartphone className="w-8 h-8 text-primary" />
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900" data-testid="field-reports-title">
                      {translate('field_reports')}
                    </h1>
                    <p className="text-gray-600 mt-1">
                      Mobile field reporting and crew management
                    </p>
                  </div>
                </div>
                <div className="mt-4 lg:mt-0">
                  <Button className="bg-primary text-white hover:bg-primary-dark" data-testid="button-new-report">
                    <Plus className="w-4 h-4 mr-2" />
                    New Report
                  </Button>
                </div>
              </div>
            </div>

            {/* Field Reports Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
              <Card data-testid="card-total-reports">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Reports</p>
                      <p className="text-3xl font-bold text-gray-900" data-testid="total-reports-count">
                        {totalReports}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <FileText className="text-blue-600 w-6 h-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="card-pending-reports">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Pending</p>
                      <p className="text-3xl font-bold text-yellow-600" data-testid="pending-reports-count">
                        {pendingReports}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                      <Clock className="text-yellow-600 w-6 h-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="card-urgent-reports">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Urgent</p>
                      <p className="text-3xl font-bold text-red-600" data-testid="urgent-reports-count">
                        {urgentReports}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                      <AlertTriangle className="text-red-600 w-6 h-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="card-completed-reports">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Completed</p>
                      <p className="text-3xl font-bold text-green-600" data-testid="completed-reports-count">
                        {completedReports}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <CheckCircle className="text-green-600 w-6 h-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="card-active-crews">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Active Crews</p>
                      <p className="text-3xl font-bold text-gray-900" data-testid="active-crews-count">
                        {uniqueCrews}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Users className="text-purple-600 w-6 h-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <Input
                        placeholder="Search reports, crews, or locations..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                        data-testid="input-search-reports"
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Filter className="w-4 h-4 text-gray-400" />
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                      data-testid="select-filter-status"
                    >
                      <option value="all">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                    <select
                      value={filterPriority}
                      onChange={(e) => setFilterPriority(e.target.value)}
                      className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                      data-testid="select-filter-priority"
                    >
                      <option value="all">All Priority</option>
                      <option value="urgent">Urgent</option>
                      <option value="high">High</option>
                      <option value="normal">Normal</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Field Reports Tabs */}
            <Tabs defaultValue="list" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="list" data-testid="tab-list">
                  Reports List
                </TabsTrigger>
                <TabsTrigger value="map" data-testid="tab-map">
                  Map View
                </TabsTrigger>
                <TabsTrigger value="analytics" data-testid="tab-analytics">
                  Analytics
                </TabsTrigger>
              </TabsList>

              <TabsContent value="list" className="space-y-6">
                <Card data-testid="card-reports-list">
                  <CardHeader>
                    <CardTitle>Field Reports</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="border border-gray-200 rounded-lg p-4 animate-shimmer"></div>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {filteredReports.map((report, index) => (
                          <div 
                            key={report.id} 
                            className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
                            data-testid={`report-item-${index}`}
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center space-x-3">
                                <div className={`w-12 h-12 ${
                                  report.priority === 'urgent' ? 'bg-red-500' : 'bg-primary'
                                } rounded-full flex items-center justify-center`}>
                                  <span className="text-white font-medium text-sm">
                                    {getCrewInitials(report.crewName)}
                                  </span>
                                </div>
                                <div>
                                  <div className="font-medium text-lg" data-testid={`crew-name-${index}`}>
                                    {report.crewName}
                                  </div>
                                  <div className="flex items-center text-sm text-gray-500">
                                    <MapPin className="w-3 h-3 mr-1" />
                                    <span data-testid={`report-location-${index}`}>
                                      {report.location}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <Badge 
                                  className={getPriorityColor(report.priority)}
                                  data-testid={`priority-badge-${index}`}
                                >
                                  {report.priority}
                                </Badge>
                                <Badge 
                                  className={getStatusColor(report.status)}
                                  data-testid={`status-badge-${index}`}
                                >
                                  {report.status}
                                </Badge>
                                <span className="text-xs text-gray-500" data-testid={`report-time-${index}`}>
                                  {formatTimeAgo(report.createdAt)}
                                </span>
                              </div>
                            </div>
                            
                            <div className="mb-4">
                              <p className="text-gray-700" data-testid={`report-description-${index}`}>
                                {report.description}
                              </p>
                              {report.damageAssessment && (
                                <p className="text-sm text-gray-600 mt-2">
                                  <strong>Assessment:</strong> {report.damageAssessment}
                                </p>
                              )}
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-6 text-sm text-gray-600">
                                {report.photoCount > 0 && (
                                  <div className="flex items-center">
                                    <Camera className="w-4 h-4 mr-1" />
                                    <span data-testid={`photo-count-${index}`}>
                                      {report.photoCount} photos
                                    </span>
                                  </div>
                                )}
                                {report.videoCount > 0 && (
                                  <div className="flex items-center">
                                    <Video className="w-4 h-4 mr-1" />
                                    <span data-testid={`video-count-${index}`}>
                                      {report.videoCount} videos
                                    </span>
                                  </div>
                                )}
                                {report.audioCount > 0 && (
                                  <div className="flex items-center">
                                    <Mic className="w-4 h-4 mr-1" />
                                    <span data-testid={`audio-count-${index}`}>
                                      {report.audioCount} audio
                                    </span>
                                  </div>
                                )}
                                {report.estimatedHours && (
                                  <div className="flex items-center">
                                    <Clock className="w-4 h-4 mr-1" />
                                    <span data-testid={`estimated-hours-${index}`}>
                                      {report.estimatedHours}h estimated
                                    </span>
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  data-testid={`button-view-${index}`}
                                >
                                  View Details
                                </Button>
                                {report.status === 'pending' && (
                                  <Button 
                                    size="sm"
                                    data-testid={`button-approve-${index}`}
                                  >
                                    Approve
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="map" className="space-y-6">
                <Card data-testid="card-map-view">
                  <CardHeader>
                    <CardTitle>Reports Map View</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
                      <div className="text-center text-gray-500">
                        <MapPin className="w-16 h-16 mx-auto mb-4" />
                        <p className="text-lg font-medium">Interactive Map</p>
                        <p className="text-sm">Field reports plotted by location</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="analytics" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <Card data-testid="card-response-time">
                    <CardHeader>
                      <CardTitle>Response Time</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-primary mb-2">2.4 hrs</div>
                        <div className="text-sm text-gray-600">Average Response</div>
                        <div className="mt-4 flex items-center justify-center">
                          <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                          <span className="text-green-600 text-sm">12% faster</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card data-testid="card-completion-rate">
                    <CardHeader>
                      <CardTitle>Completion Rate</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-green-600 mb-2">94.2%</div>
                        <div className="text-sm text-gray-600">Reports Completed</div>
                        <div className="mt-4 flex items-center justify-center">
                          <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                          <span className="text-green-600 text-sm">+3.1%</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card data-testid="card-crew-productivity">
                    <CardHeader>
                      <CardTitle>Crew Productivity</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-purple-600 mb-2">8.3</div>
                        <div className="text-sm text-gray-600">Reports per Crew/Day</div>
                        <div className="mt-4 flex items-center justify-center">
                          <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                          <span className="text-green-600 text-sm">+15%</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card data-testid="card-crew-performance">
                  <CardHeader>
                    <CardTitle>Top Performing Crews</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {reports?.slice(0, 5).map((report, index) => {
                        const crewReports = reports.filter(r => r.crewId === report.crewId);
                        return (
                          <div key={`${report.crewId}-${index}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                                <span className="text-white font-semibold text-sm">
                                  {getCrewInitials(report.crewName)}
                                </span>
                              </div>
                              <div>
                                <div className="font-medium">{report.crewName}</div>
                                <div className="text-sm text-gray-500">{crewReports.length} reports</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold">98%</div>
                              <div className="text-sm text-gray-500">Completion</div>
                            </div>
                          </div>
                        );
                      })}
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
