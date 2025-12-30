import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { 
  Building2, 
  Users, 
  Phone, 
  Mail, 
  Globe, 
  MapPin,
  CheckCircle,
  Clock,
  AlertCircle,
  Send,
  MessageSquare,
  FileText,
  ExternalLink,
  ChevronRight,
  Search,
  Filter,
  RefreshCw,
  Zap,
  Shield,
  Star,
  Bell,
  Loader2,
  Copy,
  Check
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

interface Agency {
  id: number;
  name: string;
  category: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  vendorPortalUrl: string | null;
  registrationNotes: string | null;
  servicesNeeded: string[] | null;
  stormRegions: string[] | null;
  registration?: {
    status: string;
    submittedDate: string | null;
    approvedDate: string | null;
    vendorId: string | null;
    notes: string | null;
  };
}

interface TeamMember {
  id: number;
  name: string;
  role: string | null;
  phone: string | null;
  email: string | null;
  receiveStormAlerts: boolean;
  receiveJobAlerts: boolean;
  receiveClaimsUpdates: boolean;
  isEmergencyContact: boolean;
}

interface Contractor {
  id: number;
  companyName: string;
  phone: string | null;
  tollFree: string | null;
  email: string | null;
  website: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  capabilities: string[] | null;
  serviceStates: string[] | null;
  certifications: string[] | null;
  introEmailTemplate: string | null;
  isVeteranOwned: boolean;
  isDisabledVeteran: boolean;
}

interface OutreachLog {
  id: number;
  communicationType: string;
  recipientName: string | null;
  recipientEmail: string | null;
  recipientPhone: string | null;
  subject: string | null;
  content: string | null;
  status: string;
  sentAt: string;
  responseReceived: boolean;
}

const statusColors: Record<string, string> = {
  not_started: "bg-slate-200 text-slate-700",
  in_progress: "bg-blue-100 text-blue-700",
  submitted: "bg-yellow-100 text-yellow-700",
  pending_review: "bg-orange-100 text-orange-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  expired: "bg-gray-100 text-gray-600"
};

const statusLabels: Record<string, string> = {
  not_started: "Not Started",
  in_progress: "In Progress",
  submitted: "Submitted",
  pending_review: "Pending Review",
  approved: "Approved",
  rejected: "Rejected",
  expired: "Expired"
};

const categoryLabels: Record<string, string> = {
  government: "Government",
  prime_contractor: "Prime Contractor",
  utility: "Utility Company",
  cooperative: "Electric Cooperative",
  vegetation_mgmt: "Vegetation Management"
};

export default function EmergencyContractorReadiness() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [selectedAgency, setSelectedAgency] = useState<Agency | null>(null);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [smsDialogOpen, setSmsDialogOpen] = useState(false);
  const [emailContent, setEmailContent] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [smsContent, setSmsContent] = useState("");
  const [copied, setCopied] = useState(false);

  // Fetch dashboard data
  const { data: dashboardData, isLoading: dashboardLoading, refetch: refetchDashboard } = useQuery({
    queryKey: ['/api/ecrp/dashboard']
  });

  // Fetch contractor registrations (for Strategic Land Management - ID 1)
  const { data: registrationsData, isLoading: registrationsLoading, refetch: refetchRegistrations } = useQuery({
    queryKey: ['/api/ecrp/contractors/1/registrations']
  });

  // Fetch contractor details
  const { data: contractorData } = useQuery({
    queryKey: ['/api/ecrp/contractors/1']
  });

  // Fetch outreach history
  const { data: outreachData, refetch: refetchOutreach } = useQuery({
    queryKey: ['/api/ecrp/contractors/1/outreach']
  });

  // Load email template when contractor data loads
  useEffect(() => {
    if (contractorData?.contractor?.introEmailTemplate) {
      setEmailContent(contractorData.contractor.introEmailTemplate);
      setEmailSubject("Storm Response Ready Contractor - Strategic Land Management LLC");
    }
  }, [contractorData]);

  // Send email mutation
  const sendEmailMutation = useMutation({
    mutationFn: async (data: { agencyId: number; recipientEmail: string; recipientName: string }) => {
      return apiRequest('/api/ecrp/outreach/email', {
        method: 'POST',
        body: JSON.stringify({
          contractorId: 1,
          agencyId: data.agencyId,
          recipientEmail: data.recipientEmail,
          recipientName: data.recipientName,
          subject: emailSubject,
          content: emailContent
        })
      });
    },
    onSuccess: (result) => {
      toast({
        title: result.sent ? "Email Sent!" : "Email Logged",
        description: result.message
      });
      setEmailDialogOpen(false);
      refetchOutreach();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to send email", variant: "destructive" });
    }
  });

  // Send SMS mutation
  const sendSmsMutation = useMutation({
    mutationFn: async (data: { agencyId: number; recipientPhone: string; recipientName: string }) => {
      return apiRequest('/api/ecrp/outreach/sms', {
        method: 'POST',
        body: JSON.stringify({
          contractorId: 1,
          agencyId: data.agencyId,
          recipientPhone: data.recipientPhone,
          recipientName: data.recipientName,
          content: smsContent
        })
      });
    },
    onSuccess: (result) => {
      toast({
        title: result.sent ? "SMS Sent!" : "SMS Logged",
        description: result.message
      });
      setSmsDialogOpen(false);
      refetchOutreach();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to send SMS", variant: "destructive" });
    }
  });

  // Update registration status
  const updateRegistrationMutation = useMutation({
    mutationFn: async (data: { agencyId: number; status: string; notes?: string }) => {
      return apiRequest('/api/ecrp/registrations', {
        method: 'POST',
        body: JSON.stringify({
          contractorId: 1,
          ...data
        })
      });
    },
    onSuccess: () => {
      toast({ title: "Status Updated", description: "Registration status has been updated" });
      refetchRegistrations();
      refetchDashboard();
    }
  });

  const agencies: Agency[] = registrationsData?.agencyStatuses || [];
  const contractor: Contractor | null = contractorData?.contractor || null;
  const teamMembers: TeamMember[] = contractorData?.teamMembers || [];
  const outreach: OutreachLog[] = outreachData?.outreach || [];
  const stats = dashboardData?.stats;

  // Filter agencies
  const filteredAgencies = agencies.filter(agency => {
    const matchesSearch = agency.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (agency.registrationNotes?.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = categoryFilter === "all" || agency.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Copied!", description: "Text copied to clipboard" });
  };

  const openEmailDialog = (agency: Agency) => {
    setSelectedAgency(agency);
    setSmsContent(`Hi, this is John Culpepper from Strategic Land Management LLC. We're a storm-response-ready contractor looking to register as a vendor with ${agency.name}. Please call me at 706-604-4820 or email strategiclandmgmt@gmail.com. Thank you!`);
    setEmailDialogOpen(true);
  };

  const openSmsDialog = (agency: Agency) => {
    setSelectedAgency(agency);
    setSmsContent(`Hi, this is John Culpepper from Strategic Land Management LLC. We're a storm-response-ready contractor looking to register as a vendor with ${agency.name}. Please call me at 706-604-4820 or email strategiclandmgmt@gmail.com. Thank you!`);
    setSmsDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Emergency Contractor Readiness Platform</h1>
              <p className="text-slate-400">Prepare and verify contractors for rapid agency deployment</p>
            </div>
          </div>
        </motion.div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-slate-800/50 border border-slate-700">
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-red-600 data-[state=active]:text-white">
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="agencies" className="data-[state=active]:bg-red-600 data-[state=active]:text-white">
              Agency Directory
            </TabsTrigger>
            <TabsTrigger value="profile" className="data-[state=active]:bg-red-600 data-[state=active]:text-white">
              Contractor Profile
            </TabsTrigger>
            <TabsTrigger value="outreach" className="data-[state=active]:bg-red-600 data-[state=active]:text-white">
              Outreach Center
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            {dashboardLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-red-500" />
              </div>
            ) : (
              <>
                {/* Stats Cards */}
                <div className="grid md:grid-cols-4 gap-4">
                  <Card className="bg-slate-800/50 border-slate-700">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-blue-500/20 rounded-lg">
                          <Building2 className="w-6 h-6 text-blue-400" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-white">{stats?.totalAgencies || 0}</p>
                          <p className="text-sm text-slate-400">Total Agencies</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-slate-800/50 border-slate-700">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-green-500/20 rounded-lg">
                          <CheckCircle className="w-6 h-6 text-green-400" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-white">{stats?.registrations?.approved || 0}</p>
                          <p className="text-sm text-slate-400">Approved</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-slate-800/50 border-slate-700">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-yellow-500/20 rounded-lg">
                          <Clock className="w-6 h-6 text-yellow-400" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-white">{stats?.registrations?.pending || 0}</p>
                          <p className="text-sm text-slate-400">Pending</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-slate-800/50 border-slate-700">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-purple-500/20 rounded-lg">
                          <Send className="w-6 h-6 text-purple-400" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-white">{stats?.outreach?.totalSent || 0}</p>
                          <p className="text-sm text-slate-400">Outreach Sent</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Quick Actions */}
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Zap className="w-5 h-5 text-yellow-400" />
                      Quick Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid md:grid-cols-3 gap-4">
                    <Button 
                      className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                      onClick={() => setActiveTab("agencies")}
                    >
                      <Building2 className="w-4 h-4 mr-2" />
                      View All Agencies
                    </Button>
                    <Button 
                      className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                      onClick={() => {
                        setActiveTab("agencies");
                        setCategoryFilter("government");
                      }}
                    >
                      <Shield className="w-4 h-4 mr-2" />
                      SAM.gov Registration
                    </Button>
                    <Button 
                      className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
                      onClick={() => setActiveTab("outreach")}
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Send Outreach
                    </Button>
                  </CardContent>
                </Card>

                {/* Contractor Info */}
                {contractor && (
                  <Card className="bg-slate-800/50 border-slate-700">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <Star className="w-5 h-5 text-yellow-400" />
                        Active Contractor Profile
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-start gap-6">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-white mb-2">{contractor.companyName}</h3>
                          <div className="flex flex-wrap gap-2 mb-4">
                            {contractor.isVeteranOwned && (
                              <Badge className="bg-blue-600">Veteran Owned</Badge>
                            )}
                            {contractor.isDisabledVeteran && (
                              <Badge className="bg-purple-600">Disabled Veteran</Badge>
                            )}
                            {contractor.certifications?.map((cert, i) => (
                              <Badge key={i} variant="outline" className="border-slate-600 text-slate-300">{cert}</Badge>
                            ))}
                          </div>
                          <div className="grid md:grid-cols-2 gap-4 text-sm">
                            <div className="flex items-center gap-2 text-slate-300">
                              <Phone className="w-4 h-4 text-slate-500" />
                              {contractor.phone} {contractor.tollFree && `/ ${contractor.tollFree}`}
                            </div>
                            <div className="flex items-center gap-2 text-slate-300">
                              <Mail className="w-4 h-4 text-slate-500" />
                              {contractor.email}
                            </div>
                            <div className="flex items-center gap-2 text-slate-300">
                              <MapPin className="w-4 h-4 text-slate-500" />
                              {contractor.address}, {contractor.city}, {contractor.state} {contractor.zip}
                            </div>
                            <div className="flex items-center gap-2 text-slate-300">
                              <Globe className="w-4 h-4 text-slate-500" />
                              <a href={`https://${contractor.website}`} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                                {contractor.website}
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Team Members */}
                      <div className="mt-6 pt-6 border-t border-slate-700">
                        <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                          <Users className="w-5 h-5" />
                          Team Members ({teamMembers.length})
                        </h4>
                        <div className="grid md:grid-cols-2 gap-4">
                          {teamMembers.map(member => (
                            <div key={member.id} className="bg-slate-900/50 p-4 rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <h5 className="font-semibold text-white">{member.name}</h5>
                                <Badge variant="outline" className="border-slate-600 text-slate-400">{member.role}</Badge>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-slate-400">
                                <span className="flex items-center gap-1">
                                  <Phone className="w-3 h-3" />
                                  {member.phone}
                                </span>
                              </div>
                              <div className="flex gap-2 mt-2">
                                {member.receiveStormAlerts && <Badge className="bg-red-600/30 text-red-300 text-xs">Storm</Badge>}
                                {member.receiveJobAlerts && <Badge className="bg-green-600/30 text-green-300 text-xs">Jobs</Badge>}
                                {member.receiveClaimsUpdates && <Badge className="bg-blue-600/30 text-blue-300 text-xs">Claims</Badge>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>

          {/* Agency Directory Tab */}
          <TabsContent value="agencies" className="space-y-6">
            {/* Filters */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="pt-6">
                <div className="flex flex-wrap gap-4">
                  <div className="flex-1 min-w-[200px]">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <Input 
                        placeholder="Search agencies..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 bg-slate-900/50 border-slate-600 text-white"
                        data-testid="input-search-agencies"
                      />
                    </div>
                  </div>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-[200px] bg-slate-900/50 border-slate-600 text-white">
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Filter by category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="government">Government</SelectItem>
                      <SelectItem value="prime_contractor">Prime Contractors</SelectItem>
                      <SelectItem value="utility">Utilities</SelectItem>
                      <SelectItem value="cooperative">Electric Cooperatives</SelectItem>
                      <SelectItem value="vegetation_mgmt">Vegetation Management</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button 
                    variant="outline" 
                    className="border-slate-600 text-slate-300"
                    onClick={() => refetchRegistrations()}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Agency List */}
            {registrationsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-red-500" />
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAgencies.map(agency => (
                  <motion.div
                    key={agency.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Card className="bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-colors">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold text-white">{agency.name}</h3>
                              <Badge className={statusColors[agency.registration?.status || 'not_started']}>
                                {statusLabels[agency.registration?.status || 'not_started']}
                              </Badge>
                              {agency.category && (
                                <Badge variant="outline" className="border-slate-600 text-slate-400">
                                  {categoryLabels[agency.category] || agency.category}
                                </Badge>
                              )}
                            </div>
                            
                            {agency.registrationNotes && (
                              <p className="text-sm text-slate-400 mb-3">{agency.registrationNotes}</p>
                            )}
                            
                            <div className="flex flex-wrap gap-4 text-sm text-slate-400">
                              {agency.phone && (
                                <span className="flex items-center gap-1">
                                  <Phone className="w-3 h-3" />
                                  {agency.phone}
                                </span>
                              )}
                              {agency.email && (
                                <span className="flex items-center gap-1">
                                  <Mail className="w-3 h-3" />
                                  {agency.email}
                                </span>
                              )}
                              {agency.website && (
                                <a 
                                  href={agency.website.startsWith('http') ? agency.website : `https://${agency.website}`}
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-blue-400 hover:underline"
                                >
                                  <Globe className="w-3 h-3" />
                                  Website
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex flex-col gap-2">
                            {agency.vendorPortalUrl && (
                              <Button 
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => window.open(agency.vendorPortalUrl!, '_blank')}
                              >
                                <ExternalLink className="w-3 h-3 mr-1" />
                                Register
                              </Button>
                            )}
                            {agency.email && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="border-blue-600 text-blue-400 hover:bg-blue-600/20"
                                onClick={() => openEmailDialog(agency)}
                              >
                                <Mail className="w-3 h-3 mr-1" />
                                Email
                              </Button>
                            )}
                            {agency.phone && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="border-purple-600 text-purple-400 hover:bg-purple-600/20"
                                onClick={() => openSmsDialog(agency)}
                              >
                                <MessageSquare className="w-3 h-3 mr-1" />
                                SMS
                              </Button>
                            )}
                            <Select 
                              value={agency.registration?.status || 'not_started'}
                              onValueChange={(value) => updateRegistrationMutation.mutate({ agencyId: agency.id, status: value })}
                            >
                              <SelectTrigger className="h-8 text-xs bg-slate-900/50 border-slate-600">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="not_started">Not Started</SelectItem>
                                <SelectItem value="in_progress">In Progress</SelectItem>
                                <SelectItem value="submitted">Submitted</SelectItem>
                                <SelectItem value="pending_review">Pending Review</SelectItem>
                                <SelectItem value="approved">Approved</SelectItem>
                                <SelectItem value="rejected">Rejected</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            {contractor && (
              <>
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white">Company Profile</CardTitle>
                    <CardDescription className="text-slate-400">Your storm-ready contractor profile</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-sm font-medium text-slate-400 mb-2">Company Name</h4>
                        <p className="text-white">{contractor.companyName}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-slate-400 mb-2">Contact</h4>
                        <p className="text-white">{contractor.phone}</p>
                        <p className="text-slate-300 text-sm">Toll-free: {contractor.tollFree}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-slate-400 mb-2">Email</h4>
                        <p className="text-white">{contractor.email}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-slate-400 mb-2">Website</h4>
                        <a href={`https://${contractor.website}`} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                          {contractor.website}
                        </a>
                      </div>
                      <div className="md:col-span-2">
                        <h4 className="text-sm font-medium text-slate-400 mb-2">Address</h4>
                        <p className="text-white">{contractor.address}, {contractor.city}, {contractor.state} {contractor.zip}</p>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-slate-700">
                      <h4 className="text-sm font-medium text-slate-400 mb-3">Capabilities</h4>
                      <div className="flex flex-wrap gap-2">
                        {contractor.capabilities?.map((cap, i) => (
                          <Badge key={i} className="bg-green-600/20 text-green-300">
                            {cap.replace(/_/g, ' ')}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="pt-6 border-t border-slate-700">
                      <h4 className="text-sm font-medium text-slate-400 mb-3">Service States</h4>
                      <div className="flex flex-wrap gap-2">
                        {contractor.serviceStates?.map((state, i) => (
                          <Badge key={i} variant="outline" className="border-slate-600 text-slate-300">
                            {state}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Email Template */}
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Introduction Email Template
                    </CardTitle>
                    <CardDescription className="text-slate-400">Use this template when reaching out to agencies</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="relative">
                      <Textarea 
                        value={emailContent}
                        onChange={(e) => setEmailContent(e.target.value)}
                        className="min-h-[300px] bg-slate-900/50 border-slate-600 text-white font-mono text-sm"
                      />
                      <Button 
                        size="sm"
                        variant="outline"
                        className="absolute top-2 right-2 border-slate-600"
                        onClick={() => copyToClipboard(emailContent)}
                      >
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* Outreach Tab */}
          <TabsContent value="outreach" className="space-y-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Send className="w-5 h-5" />
                  Outreach History
                </CardTitle>
                <CardDescription className="text-slate-400">Track all your communications with agencies</CardDescription>
              </CardHeader>
              <CardContent>
                {outreach.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    <Send className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No outreach sent yet</p>
                    <p className="text-sm">Go to Agency Directory to start sending emails and SMS</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {outreach.map(log => (
                      <div key={log.id} className="bg-slate-900/50 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {log.communicationType === 'email' ? (
                              <Mail className="w-4 h-4 text-blue-400" />
                            ) : (
                              <MessageSquare className="w-4 h-4 text-purple-400" />
                            )}
                            <span className="font-medium text-white">{log.recipientName || log.recipientEmail || log.recipientPhone}</span>
                            <Badge className={log.status === 'sent' ? 'bg-green-600' : 'bg-red-600'}>
                              {log.status}
                            </Badge>
                          </div>
                          <span className="text-sm text-slate-500">
                            {new Date(log.sentAt).toLocaleString()}
                          </span>
                        </div>
                        {log.subject && (
                          <p className="text-sm text-slate-400 mb-1">Subject: {log.subject}</p>
                        )}
                        <p className="text-sm text-slate-300 line-clamp-2">{log.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Email Dialog */}
        <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
          <DialogContent className="max-w-2xl bg-slate-800 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white">Send Email to {selectedAgency?.name}</DialogTitle>
              <DialogDescription className="text-slate-400">
                Send an introduction email on behalf of Strategic Land Management LLC
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-slate-300">To</Label>
                <Input 
                  value={selectedAgency?.email || ''}
                  readOnly
                  className="bg-slate-900/50 border-slate-600 text-white"
                />
              </div>
              <div>
                <Label className="text-slate-300">Subject</Label>
                <Input 
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="bg-slate-900/50 border-slate-600 text-white"
                  data-testid="input-email-subject"
                />
              </div>
              <div>
                <Label className="text-slate-300">Message</Label>
                <Textarea 
                  value={emailContent}
                  onChange={(e) => setEmailContent(e.target.value)}
                  className="min-h-[200px] bg-slate-900/50 border-slate-600 text-white"
                  data-testid="textarea-email-content"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEmailDialogOpen(false)} className="border-slate-600">
                Cancel
              </Button>
              <Button 
                onClick={() => selectedAgency && sendEmailMutation.mutate({
                  agencyId: selectedAgency.id,
                  recipientEmail: selectedAgency.email!,
                  recipientName: selectedAgency.name
                })}
                disabled={sendEmailMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
                data-testid="button-send-email"
              >
                {sendEmailMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                Send Email
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* SMS Dialog */}
        <Dialog open={smsDialogOpen} onOpenChange={setSmsDialogOpen}>
          <DialogContent className="bg-slate-800 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white">Send SMS to {selectedAgency?.name}</DialogTitle>
              <DialogDescription className="text-slate-400">
                Send a text message on behalf of Strategic Land Management LLC
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-slate-300">To</Label>
                <Input 
                  value={selectedAgency?.phone || ''}
                  readOnly
                  className="bg-slate-900/50 border-slate-600 text-white"
                />
              </div>
              <div>
                <Label className="text-slate-300">Message</Label>
                <Textarea 
                  value={smsContent}
                  onChange={(e) => setSmsContent(e.target.value)}
                  className="min-h-[100px] bg-slate-900/50 border-slate-600 text-white"
                  data-testid="textarea-sms-content"
                />
                <p className="text-xs text-slate-500 mt-1">{smsContent.length}/160 characters</p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSmsDialogOpen(false)} className="border-slate-600">
                Cancel
              </Button>
              <Button 
                onClick={() => selectedAgency && sendSmsMutation.mutate({
                  agencyId: selectedAgency.id,
                  recipientPhone: selectedAgency.phone!,
                  recipientName: selectedAgency.name
                })}
                disabled={sendSmsMutation.isPending}
                className="bg-purple-600 hover:bg-purple-700"
                data-testid="button-send-sms"
              >
                {sendSmsMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <MessageSquare className="w-4 h-4 mr-2" />}
                Send SMS
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
