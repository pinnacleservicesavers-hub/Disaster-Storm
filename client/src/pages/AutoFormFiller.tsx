import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import ModuleAIAssistant from "@/components/ModuleAIAssistant";
import {
  ArrowLeft, FileText, Shield, Upload, Save, CheckCircle2, AlertTriangle,
  Loader2, Search, Download, Trash2, Clock, Target, Zap, Building2,
  User, Phone, Mail, MapPin, CreditCard, ClipboardList, FolderOpen,
  FilePlus, Eye, RefreshCw, BarChart3, Hash, Lock, Star, Plus, X
} from "lucide-react";

const DOC_TYPES = [
  { value: "w9", label: "W-9 Tax Form" },
  { value: "insurance_cert", label: "Insurance Certificate" },
  { value: "articles", label: "Articles of Incorporation" },
  { value: "license", label: "Business License" },
  { value: "osha_log", label: "OSHA Log" },
  { value: "msa", label: "Master Service Agreement" },
  { value: "rate_sheet", label: "Rate Sheet" },
  { value: "banking", label: "Banking / ACH Info" },
  { value: "bond", label: "Bond Certificate" },
  { value: "drivers_license", label: "Driver's License" },
  { value: "equipment_list", label: "Equipment List" },
  { value: "safety_plan", label: "Safety Plan" },
  { value: "other", label: "Other Document" },
];

const FORM_TYPES = [
  { value: "fema", label: "FEMA Form" },
  { value: "sam_gov", label: "SAM.gov Registration" },
  { value: "vendor_onboard", label: "Vendor Onboarding" },
  { value: "ach", label: "ACH / Banking Form" },
  { value: "sba", label: "SBA Loan Packet" },
  { value: "bid_packet", label: "Bid Packet" },
  { value: "w9", label: "W-9 Tax Form" },
  { value: "insurance_req", label: "Insurance Request" },
  { value: "prime_compliance", label: "Prime Contractor Compliance" },
  { value: "state_license", label: "State Licensing" },
  { value: "custom", label: "Custom Form" },
];

const BUSINESS_TYPES = [
  { value: "llc", label: "LLC" },
  { value: "corporation", label: "Corporation" },
  { value: "s_corp", label: "S-Corporation" },
  { value: "sole_prop", label: "Sole Proprietorship" },
  { value: "partnership", label: "Partnership" },
  { value: "joint_venture", label: "Joint Venture" },
  { value: "nonprofit", label: "Non-Profit" },
];

const CERTIFICATIONS = [
  "SDVOSB", "WOSB", "HUBZone", "8(a)", "DBE", "MBE", "WBE", "SBE",
  "EDWOSB", "VOSB", "SDB", "LBE", "ACDBE"
];

export default function AutoFormFiller() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("profile");
  const [selectedCerts, setSelectedCerts] = useState<string[]>([]);
  const [newDocType, setNewDocType] = useState("");
  const [newDocName, setNewDocName] = useState("");
  const [newDocText, setNewDocText] = useState("");
  const [newDocExpiry, setNewDocExpiry] = useState("");
  const [newDocTags, setNewDocTags] = useState("");
  const [formFillText, setFormFillText] = useState("");
  const [formFillType, setFormFillType] = useState("");
  const [formFillName, setFormFillName] = useState("");
  const [fillResults, setFillResults] = useState<any>(null);
  const [showUploadDoc, setShowUploadDoc] = useState(false);
  const [docExtractResult, setDocExtractResult] = useState<any>(null);

  const [profileForm, setProfileForm] = useState({
    businessName: "", legalName: "", ownerName: "", ownerTitle: "", ownerEmail: "",
    ownerPhone: "", ein: "", uei: "", address: "", city: "", state: "", zip: "",
    naicsCodes: "", businessType: "", cageCode: "", insuranceProvider: "",
    insurancePolicyNumber: "", insuranceExpiry: "", bankName: "",
    bankRoutingNumber: "", bankAccountNumber: "",
  });

  const { data: profileData, isLoading: loadingProfile } = useQuery<any>({
    queryKey: ['/api/form-filler/profile'],
  });

  const profile = profileData?.profile;
  const profileId = profile?.id;

  const { data: documentsData, isLoading: loadingDocs } = useQuery<any>({
    queryKey: [`/api/form-filler/documents?profileId=${profileId}`],
    enabled: !!profileId,
  });

  const { data: historyData, isLoading: loadingHistory } = useQuery<any>({
    queryKey: [`/api/form-filler/history?profileId=${profileId}`],
    enabled: !!profileId,
  });

  const documents = documentsData?.documents || [];
  const history = historyData?.runs || historyData?.history || [];

  const saveProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      const method = profile ? 'PUT' : 'POST';
      const url = profile ? `/api/form-filler/profile/${profile.id}` : '/api/form-filler/profile';
      return apiRequest(url, method, { ...data, certifications: selectedCerts });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/form-filler/profile'] });
      toast({ title: "Profile Saved", description: "Your master profile has been saved securely." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save profile.", variant: "destructive" });
    },
  });

  const uploadDocMutation = useMutation({
    mutationFn: async (data: any) => apiRequest('/api/form-filler/documents', 'POST', data),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: [`/api/form-filler/documents?profileId=${profileId}`] });
      setDocExtractResult(data?.extractedData);
      setNewDocType(""); setNewDocName(""); setNewDocText(""); setNewDocExpiry(""); setNewDocTags("");
      setShowUploadDoc(false);
      toast({ title: "Document Saved", description: "Document added to your vault with AI extraction." });
    },
  });

  const deleteDocMutation = useMutation({
    mutationFn: async (id: string) => apiRequest(`/api/form-filler/documents/${id}`, 'DELETE'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/form-filler/documents?profileId=${profileId}`] });
      toast({ title: "Document Removed" });
    },
  });

  const fillFormMutation = useMutation({
    mutationFn: async (data: any) => apiRequest('/api/form-filler/fill', 'POST', data),
    onSuccess: (data: any) => {
      setFillResults(data);
      queryClient.invalidateQueries({ queryKey: [`/api/form-filler/history?profileId=${profileId}`] });
      toast({ title: "Form Auto-Filled!", description: `${data?.run?.fieldsFilled || data?.fieldsFilled || 0} of ${data?.run?.fieldsDetected || data?.fieldsDetected || 0} fields filled automatically.` });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to auto-fill form.", variant: "destructive" });
    },
  });

  const loadProfileIntoForm = () => {
    if (profile) {
      setProfileForm({
        businessName: profile.businessName || "",
        legalName: profile.legalName || "",
        ownerName: profile.ownerName || "",
        ownerTitle: profile.ownerTitle || "",
        ownerEmail: profile.ownerEmail || "",
        ownerPhone: profile.ownerPhone || "",
        ein: profile.ein || "",
        uei: profile.uei || "",
        address: profile.address || "",
        city: profile.city || "",
        state: profile.state || "",
        zip: profile.zip || "",
        naicsCodes: profile.naicsCodes || "",
        businessType: profile.businessType || "",
        cageCode: profile.cageCode || "",
        insuranceProvider: profile.insuranceProvider || "",
        insurancePolicyNumber: profile.insurancePolicyNumber || "",
        insuranceExpiry: profile.insuranceExpiry || "",
        bankName: profile.bankName || "",
        bankRoutingNumber: profile.bankRoutingNumber || "",
        bankAccountNumber: profile.bankAccountNumber || "",
      });
      setSelectedCerts(profile.certifications || []);
    }
  };

  useEffect(() => {
    if (profile) {
      loadProfileIntoForm();
    }
  }, [profile?.id]);

  const updateField = (field: string, value: string) => {
    setProfileForm(prev => ({ ...prev, [field]: value }));
  };

  const toggleCert = (cert: string) => {
    setSelectedCerts(prev => prev.includes(cert) ? prev.filter(c => c !== cert) : [...prev, cert]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950">
      <div className="sticky top-0 z-50 bg-gradient-to-r from-indigo-900/90 via-slate-900/95 to-purple-900/90 backdrop-blur-xl border-b border-indigo-500/30 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white" onClick={() => navigate(-1)}>
                <ArrowLeft className="w-4 h-4 mr-1" /> Back
              </Button>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white flex items-center gap-2">
                    Auto Form Filler AI
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-[10px]">LIVE</Badge>
                  </h1>
                  <p className="text-xs text-gray-400">Digital Compliance Vault + Smart Form Filling</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
                <Lock className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-xs text-indigo-300">256-bit Encrypted</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                <Shield className="w-3.5 h-3.5 text-purple-400" />
                <span className="text-xs text-purple-300">FEMA Audit Ready</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { icon: FolderOpen, label: "Vault Documents", value: documents.length, color: "indigo" },
            { icon: CheckCircle2, label: "Forms Auto-Filled", value: history.length, color: "green" },
            { icon: Target, label: "Avg Fill Rate", value: history.length > 0 ? `${Math.round(history.reduce((a: number, h: any) => a + parseFloat(h.fillPercentage || 0), 0) / history.length)}%` : "—", color: "amber" },
            { icon: Clock, label: "Hours Saved", value: `${(history.length * 1.5).toFixed(0)}+`, color: "purple" },
          ].map((stat, i) => (
            <Card key={i} className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 bg-${stat.color}-500/20 rounded-lg`}>
                    <stat.icon className={`w-5 h-5 text-${stat.color}-400`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                    <p className="text-xs text-gray-400">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-slate-800/80 border border-slate-700 w-full justify-start gap-1 p-1">
            <TabsTrigger value="profile" className="data-[state=active]:bg-indigo-500/20 data-[state=active]:text-indigo-400">
              <User className="w-4 h-4 mr-1.5" /> Master Profile
            </TabsTrigger>
            <TabsTrigger value="vault" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400">
              <FolderOpen className="w-4 h-4 mr-1.5" /> Document Vault
            </TabsTrigger>
            <TabsTrigger value="filler" className="data-[state=active]:bg-green-500/20 data-[state=active]:text-green-400">
              <Zap className="w-4 h-4 mr-1.5" /> Form Filler
            </TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400">
              <Clock className="w-4 h-4 mr-1.5" /> Smart Fill History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="mt-4">
            <div className="space-y-6">
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-indigo-400" />
                    Business Information
                  </CardTitle>
                  <CardDescription>Fill this once — AI uses it to auto-fill every government form, vendor packet, and bid submission.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-gray-300 text-xs">Business Name *</Label>
                      <Input value={profileForm.businessName} onChange={(e) => updateField('businessName', e.target.value)} placeholder="Your Company LLC" className="bg-slate-900/50 border-slate-600 text-white mt-1" />
                    </div>
                    <div>
                      <Label className="text-gray-300 text-xs">Legal Name</Label>
                      <Input value={profileForm.legalName} onChange={(e) => updateField('legalName', e.target.value)} placeholder="Legal entity name" className="bg-slate-900/50 border-slate-600 text-white mt-1" />
                    </div>
                    <div>
                      <Label className="text-gray-300 text-xs">Business Type</Label>
                      <Select value={profileForm.businessType} onValueChange={(v) => updateField('businessType', v)}>
                        <SelectTrigger className="bg-slate-900/50 border-slate-600 text-white mt-1"><SelectValue placeholder="Select type" /></SelectTrigger>
                        <SelectContent>
                          {BUSINESS_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <User className="w-5 h-5 text-blue-400" />
                    Owner / Authorized Representative
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <Label className="text-gray-300 text-xs">Full Name *</Label>
                      <Input value={profileForm.ownerName} onChange={(e) => updateField('ownerName', e.target.value)} placeholder="John Smith" className="bg-slate-900/50 border-slate-600 text-white mt-1" />
                    </div>
                    <div>
                      <Label className="text-gray-300 text-xs">Title</Label>
                      <Input value={profileForm.ownerTitle} onChange={(e) => updateField('ownerTitle', e.target.value)} placeholder="Owner / CEO" className="bg-slate-900/50 border-slate-600 text-white mt-1" />
                    </div>
                    <div>
                      <Label className="text-gray-300 text-xs">Email *</Label>
                      <Input value={profileForm.ownerEmail} onChange={(e) => updateField('ownerEmail', e.target.value)} placeholder="john@company.com" className="bg-slate-900/50 border-slate-600 text-white mt-1" />
                    </div>
                    <div>
                      <Label className="text-gray-300 text-xs">Phone *</Label>
                      <Input value={profileForm.ownerPhone} onChange={(e) => updateField('ownerPhone', e.target.value)} placeholder="(555) 123-4567" className="bg-slate-900/50 border-slate-600 text-white mt-1" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Hash className="w-5 h-5 text-amber-400" />
                    Tax & Government IDs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <Label className="text-gray-300 text-xs">EIN (Tax ID) *</Label>
                      <Input value={profileForm.ein} onChange={(e) => updateField('ein', e.target.value)} placeholder="XX-XXXXXXX" className="bg-slate-900/50 border-slate-600 text-white mt-1" />
                    </div>
                    <div>
                      <Label className="text-gray-300 text-xs">UEI (SAM.gov)</Label>
                      <Input value={profileForm.uei} onChange={(e) => updateField('uei', e.target.value)} placeholder="12-char UEI" className="bg-slate-900/50 border-slate-600 text-white mt-1" />
                    </div>
                    <div>
                      <Label className="text-gray-300 text-xs">CAGE Code</Label>
                      <Input value={profileForm.cageCode} onChange={(e) => updateField('cageCode', e.target.value)} placeholder="5-char code" className="bg-slate-900/50 border-slate-600 text-white mt-1" />
                    </div>
                    <div>
                      <Label className="text-gray-300 text-xs">NAICS Codes</Label>
                      <Input value={profileForm.naicsCodes} onChange={(e) => updateField('naicsCodes', e.target.value)} placeholder="561730, 562910" className="bg-slate-900/50 border-slate-600 text-white mt-1" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-green-400" />
                    Address
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-2">
                      <Label className="text-gray-300 text-xs">Street Address</Label>
                      <Input value={profileForm.address} onChange={(e) => updateField('address', e.target.value)} placeholder="123 Main St" className="bg-slate-900/50 border-slate-600 text-white mt-1" />
                    </div>
                    <div>
                      <Label className="text-gray-300 text-xs">City</Label>
                      <Input value={profileForm.city} onChange={(e) => updateField('city', e.target.value)} placeholder="Houston" className="bg-slate-900/50 border-slate-600 text-white mt-1" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-gray-300 text-xs">State</Label>
                        <Input value={profileForm.state} onChange={(e) => updateField('state', e.target.value)} placeholder="TX" className="bg-slate-900/50 border-slate-600 text-white mt-1" />
                      </div>
                      <div>
                        <Label className="text-gray-300 text-xs">ZIP</Label>
                        <Input value={profileForm.zip} onChange={(e) => updateField('zip', e.target.value)} placeholder="77001" className="bg-slate-900/50 border-slate-600 text-white mt-1" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Shield className="w-5 h-5 text-cyan-400" />
                    Insurance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <Label className="text-gray-300 text-xs">Insurance Provider</Label>
                      <Input value={profileForm.insuranceProvider} onChange={(e) => updateField('insuranceProvider', e.target.value)} placeholder="State Farm, Liberty Mutual..." className="bg-slate-900/50 border-slate-600 text-white mt-1" />
                    </div>
                    <div>
                      <Label className="text-gray-300 text-xs">Policy Number</Label>
                      <Input value={profileForm.insurancePolicyNumber} onChange={(e) => updateField('insurancePolicyNumber', e.target.value)} placeholder="POL-123456" className="bg-slate-900/50 border-slate-600 text-white mt-1" />
                    </div>
                    <div>
                      <Label className="text-gray-300 text-xs">Expiry Date</Label>
                      <Input value={profileForm.insuranceExpiry} onChange={(e) => updateField('insuranceExpiry', e.target.value)} placeholder="12/31/2026" className="bg-slate-900/50 border-slate-600 text-white mt-1" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-emerald-400" />
                    Banking / ACH
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-gray-300 text-xs">Bank Name</Label>
                      <Input value={profileForm.bankName} onChange={(e) => updateField('bankName', e.target.value)} placeholder="Chase, Wells Fargo..." className="bg-slate-900/50 border-slate-600 text-white mt-1" />
                    </div>
                    <div>
                      <Label className="text-gray-300 text-xs">Routing Number</Label>
                      <Input value={profileForm.bankRoutingNumber} onChange={(e) => updateField('bankRoutingNumber', e.target.value)} placeholder="9-digit routing" className="bg-slate-900/50 border-slate-600 text-white mt-1" />
                    </div>
                    <div>
                      <Label className="text-gray-300 text-xs">Account Number</Label>
                      <Input value={profileForm.bankAccountNumber} onChange={(e) => updateField('bankAccountNumber', e.target.value)} placeholder="Account number" className="bg-slate-900/50 border-slate-600 text-white mt-1" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-400" />
                    Certifications
                  </CardTitle>
                  <CardDescription>Select all small business certifications that apply</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {CERTIFICATIONS.map(cert => (
                      <Button
                        key={cert}
                        size="sm"
                        variant={selectedCerts.includes(cert) ? "default" : "outline"}
                        className={selectedCerts.includes(cert)
                          ? "bg-yellow-600 hover:bg-yellow-700 text-white border-yellow-500"
                          : "border-slate-600 text-gray-400 hover:text-white hover:border-yellow-500/50"
                        }
                        onClick={() => toggleCert(cert)}
                      >
                        {selectedCerts.includes(cert) && <CheckCircle2 className="w-3 h-3 mr-1" />}
                        {cert}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end gap-3">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8"
                  onClick={() => saveProfileMutation.mutate(profileForm)}
                  disabled={saveProfileMutation.isPending}
                >
                  {saveProfileMutation.isPending ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
                  ) : (
                    <><Save className="w-4 h-4 mr-2" /> Save Master Profile</>
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="vault" className="mt-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white">Digital Compliance Vault</h2>
                  <p className="text-sm text-gray-400">Secure, timestamped, version-controlled document storage. Instant retrieval for FEMA audits.</p>
                </div>
                <Button className="bg-purple-600 hover:bg-purple-700" onClick={() => setShowUploadDoc(true)}>
                  <Plus className="w-4 h-4 mr-2" /> Add Document
                </Button>
              </div>

              {showUploadDoc && (
                <Card className="bg-slate-800/60 border-purple-500/30">
                  <CardHeader>
                    <CardTitle className="text-white text-sm flex items-center gap-2">
                      <FilePlus className="w-4 h-4 text-purple-400" /> Add Document to Vault
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label className="text-gray-300 text-xs">Document Type *</Label>
                        <Select value={newDocType} onValueChange={setNewDocType}>
                          <SelectTrigger className="bg-slate-900/50 border-slate-600 text-white mt-1"><SelectValue placeholder="Select type" /></SelectTrigger>
                          <SelectContent>
                            {DOC_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-gray-300 text-xs">Document Name</Label>
                        <Input value={newDocName} onChange={(e) => setNewDocName(e.target.value)} placeholder="e.g., 2026 GL Insurance Cert" className="bg-slate-900/50 border-slate-600 text-white mt-1" />
                      </div>
                      <div>
                        <Label className="text-gray-300 text-xs">Expiry Date</Label>
                        <Input value={newDocExpiry} onChange={(e) => setNewDocExpiry(e.target.value)} placeholder="MM/DD/YYYY" className="bg-slate-900/50 border-slate-600 text-white mt-1" />
                      </div>
                    </div>
                    <div>
                      <Label className="text-gray-300 text-xs">Paste Document Text (AI will extract key data)</Label>
                      <Textarea value={newDocText} onChange={(e) => setNewDocText(e.target.value)} placeholder="Paste the contents of your document here. AI will automatically extract key information like EIN, insurance limits, contact info, dates, etc." className="bg-slate-900/50 border-slate-600 text-white mt-1 h-32" />
                    </div>
                    <div>
                      <Label className="text-gray-300 text-xs">Tags (comma-separated)</Label>
                      <Input value={newDocTags} onChange={(e) => setNewDocTags(e.target.value)} placeholder="fema, 2026, hurricane" className="bg-slate-900/50 border-slate-600 text-white mt-1" />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        className="bg-purple-600 hover:bg-purple-700"
                        onClick={() => uploadDocMutation.mutate({
                          profileId: profileId,
                          docType: newDocType,
                          docName: newDocName,
                          textContent: newDocText,
                          expiryDate: newDocExpiry,
                          tags: newDocTags,
                        })}
                        disabled={uploadDocMutation.isPending || !newDocType || !profileId}
                      >
                        {uploadDocMutation.isPending ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Processing...</> : <><Upload className="w-4 h-4 mr-1" /> Save & Extract</>}
                      </Button>
                      <Button variant="outline" className="border-slate-600 text-gray-400" onClick={() => setShowUploadDoc(false)}>Cancel</Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {docExtractResult && (
                <Card className="bg-green-900/20 border-green-500/30">
                  <CardHeader>
                    <CardTitle className="text-green-400 text-sm flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" /> AI Extracted Data
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {Object.entries(docExtractResult).map(([key, val]: [string, any]) => (
                        <div key={key} className="bg-slate-900/50 rounded-lg p-2">
                          <p className="text-[10px] text-gray-500 uppercase">{key.replace(/_/g, ' ')}</p>
                          <p className="text-xs text-white font-medium">{String(val)}</p>
                        </div>
                      ))}
                    </div>
                    <Button size="sm" variant="ghost" className="mt-2 text-gray-400 text-xs" onClick={() => setDocExtractResult(null)}>Dismiss</Button>
                  </CardContent>
                </Card>
              )}

              {loadingDocs ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
                </div>
              ) : documents.length === 0 ? (
                <Card className="bg-slate-800/30 border-slate-700 border-dashed">
                  <CardContent className="py-12 text-center">
                    <FolderOpen className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <h3 className="text-white font-semibold mb-1">Vault is Empty</h3>
                    <p className="text-sm text-gray-400">Add your first document — W-9, insurance certificate, license, or any compliance document.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {documents.filter((d: any) => d.status !== 'deleted').map((doc: any) => (
                    <Card key={doc.id} className="bg-slate-800/50 border-slate-700 hover:border-purple-500/50 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-purple-400" />
                            <span className="text-sm font-medium text-white">{doc.docName || doc.docType}</span>
                          </div>
                          <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-gray-500 hover:text-red-400" onClick={() => deleteDocMutation.mutate(doc.id)}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                        <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-[10px] mb-2">
                          {DOC_TYPES.find(t => t.value === doc.docType)?.label || doc.docType}
                        </Badge>
                        {doc.expiryDate && (
                          <p className="text-[10px] text-gray-500 flex items-center gap-1 mt-1">
                            <Clock className="w-2.5 h-2.5" /> Expires: {doc.expiryDate}
                          </p>
                        )}
                        {doc.extractedData && Object.keys(doc.extractedData).length > 0 && (
                          <div className="mt-2 pt-2 border-t border-slate-700">
                            <p className="text-[10px] text-green-400 mb-1">AI Extracted {Object.keys(doc.extractedData).length} fields</p>
                            <div className="flex flex-wrap gap-1">
                              {Object.keys(doc.extractedData).slice(0, 4).map(k => (
                                <span key={k} className="text-[9px] bg-slate-900/50 text-gray-400 px-1.5 py-0.5 rounded">{k}</span>
                              ))}
                              {Object.keys(doc.extractedData).length > 4 && (
                                <span className="text-[9px] text-gray-500">+{Object.keys(doc.extractedData).length - 4} more</span>
                              )}
                            </div>
                          </div>
                        )}
                        <p className="text-[10px] text-gray-600 mt-2">
                          Added {new Date(doc.createdAt).toLocaleDateString()} · v{doc.version}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="filler" className="mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Zap className="w-5 h-5 text-green-400" />
                      Auto-Fill a Form
                    </CardTitle>
                    <CardDescription>Paste any government form, vendor packet, or bid document. AI will detect every field and fill it from your master profile.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-gray-300 text-xs">Form Type</Label>
                        <Select value={formFillType} onValueChange={setFormFillType}>
                          <SelectTrigger className="bg-slate-900/50 border-slate-600 text-white mt-1"><SelectValue placeholder="Select form type" /></SelectTrigger>
                          <SelectContent>
                            {FORM_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-gray-300 text-xs">Form Name</Label>
                        <Input value={formFillName} onChange={(e) => setFormFillName(e.target.value)} placeholder="e.g., SF-1449, W-9, Vendor App" className="bg-slate-900/50 border-slate-600 text-white mt-1" />
                      </div>
                    </div>
                    <div>
                      <Label className="text-gray-300 text-xs">Paste Form Content *</Label>
                      <Textarea
                        value={formFillText}
                        onChange={(e) => setFormFillText(e.target.value)}
                        placeholder={`Paste the full text of your form here. For example:\n\nVendor Registration Form\n1. Legal Business Name: _______________\n2. Federal Tax ID (EIN): _______________\n3. Street Address: _______________\n4. City: ___ State: ___ ZIP: ___\n5. Primary Contact Name: _______________\n6. Phone: ___ Email: ___\n7. Insurance Provider: _______________\n8. Policy Number: _______________\n...`}
                        className="bg-slate-900/50 border-slate-600 text-white mt-1 h-64 font-mono text-xs"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-500">AI detects fields, maps to your profile, fills 80–95% automatically</p>
                      <Button
                        className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                        onClick={() => fillFormMutation.mutate({
                          profileId: profileId,
                          formText: formFillText,
                          formType: formFillType,
                          formName: formFillName,
                        })}
                        disabled={fillFormMutation.isPending || !formFillText.trim() || !profileId}
                      >
                        {fillFormMutation.isPending ? (
                          <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyzing...</>
                        ) : (
                          <><Zap className="w-4 h-4 mr-2" /> Auto-Fill Now</>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {!profile && (
                  <Card className="bg-amber-900/20 border-amber-500/30">
                    <CardContent className="py-4 flex items-center gap-3">
                      <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-amber-300 font-medium">No Master Profile Found</p>
                        <p className="text-xs text-amber-400/70">Go to the Master Profile tab and fill in your business info first. The more you fill, the more fields get auto-filled.</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              <div className="space-y-4">
                {fillResults ? (
                  <>
                    <Card className="bg-green-900/20 border-green-500/30">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-green-400 flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5" />
                            Auto-Fill Results
                          </CardTitle>
                          <Badge className="bg-green-500/20 text-green-300 border-green-500/30 text-lg px-3 py-1">
                            {fillResults.run?.fillPercentage || 0}% Filled
                          </Badge>
                        </div>
                        <CardDescription className="text-green-400/60">
                          {fillResults.run?.fieldsFilled || 0} of {fillResults.run?.fieldsDetected || 0} fields filled automatically
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="w-full bg-slate-800 rounded-full h-3 mb-4">
                          <div
                            className="bg-gradient-to-r from-green-500 to-emerald-400 h-3 rounded-full transition-all"
                            style={{ width: `${fillResults.run?.fillPercentage || 0}%` }}
                          />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-slate-800/50 border-slate-700">
                      <CardHeader>
                        <CardTitle className="text-white text-sm">Field Mappings</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 max-h-[400px] overflow-y-auto">
                          {(fillResults.run?.fieldMappings || []).map((m: any, i: number) => (
                            <div key={i} className={`flex items-center justify-between p-2 rounded-lg ${m.value ? 'bg-green-900/10 border border-green-500/20' : 'bg-red-900/10 border border-red-500/20'}`}>
                              <div className="flex-1">
                                <p className="text-xs text-gray-300">{m.formLabel}</p>
                                <p className="text-[10px] text-gray-500">→ {m.mappedTo || 'No match'}</p>
                              </div>
                              <div className="text-right">
                                {m.value ? (
                                  <>
                                    <p className="text-xs text-green-400 font-mono">{String(m.value).substring(0, 30)}{String(m.value).length > 30 ? '...' : ''}</p>
                                    <p className="text-[10px] text-green-500/60">{m.confidence}% confidence</p>
                                  </>
                                ) : (
                                  <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-[10px]">Missing</Badge>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {(fillResults.run?.missingFields || []).length > 0 && (
                      <Card className="bg-amber-900/20 border-amber-500/30">
                        <CardHeader>
                          <CardTitle className="text-amber-400 text-sm flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" />
                            Missing Fields ({fillResults.run.missingFields.length})
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex flex-wrap gap-2">
                            {fillResults.run.missingFields.map((f: string, i: number) => (
                              <Badge key={i} className="bg-amber-500/10 text-amber-300 border-amber-500/20 text-xs">{f}</Badge>
                            ))}
                          </div>
                          <p className="text-xs text-amber-400/60 mt-3">Add these to your Master Profile to increase fill rate.</p>
                        </CardContent>
                      </Card>
                    )}

                    <Button variant="outline" className="w-full border-slate-600 text-gray-400" onClick={() => setFillResults(null)}>
                      <RefreshCw className="w-4 h-4 mr-2" /> Fill Another Form
                    </Button>
                  </>
                ) : (
                  <Card className="bg-slate-800/30 border-slate-700 border-dashed">
                    <CardContent className="py-16 text-center">
                      <Zap className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                      <h3 className="text-white font-semibold mb-1">Paste a Form to Get Started</h3>
                      <p className="text-sm text-gray-400 max-w-sm mx-auto">
                        Paste any government form, vendor registration, FEMA packet, or bid document on the left. AI will instantly detect and fill every field.
                      </p>
                      <div className="mt-6 grid grid-cols-2 gap-2 max-w-xs mx-auto">
                        {["W-9", "SF-1449", "ACH Form", "SAM.gov", "FEMA Form", "Vendor App"].map(f => (
                          <Badge key={f} className="bg-slate-800 text-gray-400 border-slate-700 justify-center">{f}</Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-white">Smart Fill History</h2>
                <p className="text-sm text-gray-400">Every auto-fill run is logged with timestamps for audit compliance.</p>
              </div>

              {loadingHistory ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
                </div>
              ) : history.length === 0 ? (
                <Card className="bg-slate-800/30 border-slate-700 border-dashed">
                  <CardContent className="py-12 text-center">
                    <Clock className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <h3 className="text-white font-semibold mb-1">No Fill History Yet</h3>
                    <p className="text-sm text-gray-400">Go to Form Filler tab and auto-fill your first form to see history here.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {history.map((run: any) => (
                    <Card key={run.id} className="bg-slate-800/50 border-slate-700 hover:border-amber-500/30 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${parseFloat(run.fillPercentage) >= 80 ? 'bg-green-500/20' : parseFloat(run.fillPercentage) >= 50 ? 'bg-amber-500/20' : 'bg-red-500/20'}`}>
                              <FileText className={`w-5 h-5 ${parseFloat(run.fillPercentage) >= 80 ? 'text-green-400' : parseFloat(run.fillPercentage) >= 50 ? 'text-amber-400' : 'text-red-400'}`} />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-white">{run.formName || 'Unnamed Form'}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <Badge className="bg-slate-700 text-gray-300 border-slate-600 text-[10px]">
                                  {FORM_TYPES.find(t => t.value === run.formType)?.label || run.formType}
                                </Badge>
                                <span className="text-[10px] text-gray-500">{new Date(run.createdAt).toLocaleString()}</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`text-lg font-bold ${parseFloat(run.fillPercentage) >= 80 ? 'text-green-400' : parseFloat(run.fillPercentage) >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                              {run.fillPercentage}%
                            </p>
                            <p className="text-[10px] text-gray-500">{run.fieldsFilled}/{run.fieldsDetected} fields</p>
                          </div>
                        </div>
                        {run.missingFields && (run.missingFields as any[]).length > 0 && (
                          <div className="mt-3 pt-3 border-t border-slate-700">
                            <p className="text-[10px] text-gray-500 mb-1">Missing: </p>
                            <div className="flex flex-wrap gap-1">
                              {(run.missingFields as any[]).slice(0, 5).map((f: string, i: number) => (
                                <span key={i} className="text-[9px] bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded">{f}</span>
                              ))}
                              {(run.missingFields as any[]).length > 5 && (
                                <span className="text-[9px] text-gray-500">+{(run.missingFields as any[]).length - 5} more</span>
                              )}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <ModuleAIAssistant
        moduleName="Auto Form Filler AI"
        moduleContext="This is the Auto Form Filler AI module — a Digital Compliance Vault and smart form auto-filling system for contractors. Help users: fill out their master business profile (EIN, UEI, CAGE code, NAICS, insurance, banking, certifications), upload and organize compliance documents (W-9, insurance certs, licenses, OSHA logs, MSAs, rate sheets), and auto-fill government forms (FEMA, SAM.gov, vendor onboarding, ACH, SBA loans, bid packets). Explain what each field means, what documents they need, and guide them through the entire process. You know about government contracting, FEMA compliance, small business certifications (SDVOSB, WOSB, HUBZone, 8a, DBE), and procurement processes."
      />
    </div>
  );
}
