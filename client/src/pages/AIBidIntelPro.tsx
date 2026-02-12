import { useState, useRef, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TrueCostProfitSheet } from "@/components/TrueCostProfitSheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import ModuleAIAssistant from "@/components/ModuleAIAssistant";
import {
  Swords,
  ArrowLeft,
  Mic,
  MicOff,
  Send,
  Volume2,
  VolumeX,
  Lightbulb,
  FileText,
  Users,
  BarChart3,
  HelpCircle,
  MessageSquare,
  Zap,
  Target,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Mail,
  Phone,
  RefreshCw,
  Loader2,
  Play,
  Pause,
  BookOpen,
  Globe,
  Search,
  ExternalLink,
  MapPin,
  Landmark,
  Shield,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Copy,
  Download,
  Star,
  Flag,
  ArrowRight,
  CircleDot,
  ClipboardList,
  Wrench,
  DollarSign,
  ListChecks,
  Table2,
  PanelRightOpen,
  X,
  Navigation
} from "lucide-react";

interface ChatMessage {
  role: "user" | "assistant";
  message: string;
  audioUrl?: string;
  tips?: InsiderTip[];
}

interface InsiderTip {
  category: string;
  title: string;
  tip: string;
  example?: string;
}

interface DashboardStats {
  totalSubmissions: number;
  totalSubmitted: number;
  totalWon: number;
  totalLost: number;
  pending: number;
  winRate: string;
  totalBidAmount: number;
  wonAmount: number;
  activeOpportunities: number;
  recentSubmissions: any[];
}

const STATE_PROCUREMENT_PORTALS: Record<string, { name: string; url: string; abbr: string }> = {
  "Alabama": { name: "Alabama Purchasing Division", url: "https://purchasing.alabama.gov/", abbr: "AL" },
  "Alaska": { name: "Alaska State Procurement", url: "http://doa.alaska.gov/oppm/", abbr: "AK" },
  "Arizona": { name: "Arizona State Procurement Office", url: "https://spo.az.gov/", abbr: "AZ" },
  "Arkansas": { name: "Arkansas Procurement", url: "https://www.transform.ar.gov/procurement/", abbr: "AR" },
  "California": { name: "California eProcure", url: "https://www.dgs.ca.gov/PD/Programs/eprocure", abbr: "CA" },
  "Colorado": { name: "Colorado State Purchasing", url: "https://osc.colorado.gov/spco", abbr: "CO" },
  "Connecticut": { name: "Connecticut Procurement", url: "https://portal.ct.gov/DAS/Services/For-Agencies-and-Municipalities/Procurement", abbr: "CT" },
  "Delaware": { name: "Delaware Government Support Services", url: "https://gss.omb.delaware.gov/", abbr: "DE" },
  "Florida": { name: "Florida State Purchasing", url: "https://www.dms.myflorida.com/business_operations/state_purchasing", abbr: "FL" },
  "Georgia": { name: "Georgia State Purchasing", url: "https://doas.ga.gov/state-purchasing", abbr: "GA" },
  "Hawaii": { name: "Hawaii State Procurement", url: "https://spo.hawaii.gov/", abbr: "HI" },
  "Idaho": { name: "Idaho Division of Purchasing", url: "https://purchasing.idaho.gov/", abbr: "ID" },
  "Illinois": { name: "Illinois Procurement", url: "https://www2.illinois.gov/cms/business/procurement/Pages/default.aspx", abbr: "IL" },
  "Indiana": { name: "Indiana Procurement", url: "https://www.in.gov/idoa/procurement/", abbr: "IN" },
  "Iowa": { name: "Iowa Procurement", url: "https://das.iowa.gov/procurement", abbr: "IA" },
  "Kansas": { name: "Kansas Procurement & Contracts", url: "https://admin.ks.gov/offices/procurement-and-contracts", abbr: "KS" },
  "Kentucky": { name: "Kentucky Procurement Services", url: "https://finance.ky.gov/office-of-the-controller/office-of-procurement-services/Pages/default.aspx", abbr: "KY" },
  "Louisiana": { name: "Louisiana Office of State Procurement", url: "https://www.doa.la.gov/doa/osp/", abbr: "LA" },
  "Maine": { name: "Maine Procurement Services", url: "https://www.maine.gov/dafs/bbm/procurementservices/home", abbr: "ME" },
  "Maryland": { name: "Maryland Procurement", url: "https://procurement.maryland.gov/", abbr: "MD" },
  "Massachusetts": { name: "Massachusetts Operational Services", url: "https://www.mass.gov/orgs/operational-services-division", abbr: "MA" },
  "Michigan": { name: "Michigan Procurement", url: "https://www.michigan.gov/dtmb/0,5552,7-358-82545_85746---,00.html", abbr: "MI" },
  "Minnesota": { name: "Minnesota Materials Management", url: "http://www.mmd.admin.state.mn.us/", abbr: "MN" },
  "Mississippi": { name: "Mississippi Procurement", url: "https://www.dfa.ms.gov/procurement-contracts", abbr: "MS" },
  "Missouri": { name: "Missouri Purchasing", url: "https://oa.mo.gov/purchasing", abbr: "MO" },
  "Montana": { name: "Montana State Procurement Bureau", url: "https://spb.mt.gov/", abbr: "MT" },
  "Nebraska": { name: "Nebraska Purchasing", url: "https://das.nebraska.gov/materiel/purchasing.html", abbr: "NE" },
  "Nevada": { name: "Nevada Purchasing Division", url: "https://purchasing.nv.gov/", abbr: "NV" },
  "New Hampshire": { name: "New Hampshire Purchasing", url: "https://das.nh.gov/purchasing/", abbr: "NH" },
  "New Jersey": { name: "New Jersey Purchase Bureau", url: "https://www.nj.gov/treasury/purchase/", abbr: "NJ" },
  "New Mexico": { name: "New Mexico State Purchasing", url: "https://www.generalservices.state.nm.us/statepurchasing/", abbr: "NM" },
  "New York": { name: "New York Procurement", url: "https://ogs.ny.gov/procurement", abbr: "NY" },
  "North Carolina": { name: "North Carolina Procurement", url: "https://ncadmin.nc.gov/government-agencies/procurement", abbr: "NC" },
  "North Dakota": { name: "North Dakota Procurement", url: "https://www.omb.nd.gov/doing-business-state/procurement", abbr: "ND" },
  "Ohio": { name: "Ohio Procurement", url: "https://procure.ohio.gov/", abbr: "OH" },
  "Oklahoma": { name: "Oklahoma Purchasing", url: "https://oklahoma.gov/omes/services/purchasing.html", abbr: "OK" },
  "Oregon": { name: "Oregon Procurement", url: "https://www.oregon.gov/DAS/Procurement/Pages/Index.aspx", abbr: "OR" },
  "Pennsylvania": { name: "Pennsylvania Procurement", url: "https://www.dgs.pa.gov/Materials-Services-Procurement/Pages/default.aspx", abbr: "PA" },
  "Rhode Island": { name: "Rhode Island Purchasing", url: "https://www.ridop.ri.gov/", abbr: "RI" },
  "South Carolina": { name: "South Carolina Procurement", url: "https://procurement.sc.gov/", abbr: "SC" },
  "South Dakota": { name: "South Dakota Procurement", url: "https://www.sd.gov/bhra?id=cs_kb_article_view&sysparm_article=KB0044779", abbr: "SD" },
  "Tennessee": { name: "Tennessee Procurement", url: "https://www.tn.gov/generalservices/procurement.html", abbr: "TN" },
  "Texas": { name: "Texas Procurement", url: "https://comptroller.texas.gov/purchasing/", abbr: "TX" },
  "Utah": { name: "Utah State Purchasing", url: "https://purchasing.utah.gov/", abbr: "UT" },
  "Vermont": { name: "Vermont Purchasing", url: "https://bgs.vermont.gov/purchasing", abbr: "VT" },
  "Virginia": { name: "Virginia Procurement", url: "https://dgs.virginia.gov/procurement", abbr: "VA" },
  "Washington": { name: "Washington Enterprise Services", url: "https://des.wa.gov/", abbr: "WA" },
  "West Virginia": { name: "West Virginia Purchasing", url: "https://www.state.wv.us/admin/purchase/", abbr: "WV" },
  "Wisconsin": { name: "Wisconsin Procurement", url: "https://doa.wi.gov/Pages/StateEmployees/Procurement.aspx", abbr: "WI" },
  "Wyoming": { name: "Wyoming Purchasing", url: "https://ai.wyo.gov/divisions/general-services/purchasing", abbr: "WY" },
};

const FEDERAL_PORTALS = [
  { name: "SAM.gov - Federal Contracts", url: "https://sam.gov/opportunities", icon: "shield", desc: "Primary federal contract database. All agencies post here. Required registration for federal work." },
  { name: "USACE - Army Corps of Engineers", url: "https://www.usace.army.mil", icon: "building", desc: "Debris removal, emergency contracting, flood control, infrastructure." },
  { name: "FEMA", url: "https://www.fema.gov", icon: "alert", desc: "Emergency management contracts. Must be registered in SAM.gov." },
  { name: "GSA - General Services Admin", url: "https://www.gsa.gov", icon: "landmark", desc: "GSA Schedules (MAS contracts), federal supply schedules." },
  { name: "USDA Forest Service", url: "https://www.fs.usda.gov", icon: "tree", desc: "Vegetation & forestry contracts." },
  { name: "DOT - Dept of Transportation", url: "https://www.transportation.gov", icon: "road", desc: "Highway ROW clearing contracts." },
  { name: "SBA - Small Business Admin", url: "https://www.sba.gov", icon: "users", desc: "SDVOSB, HUBZone, 8(a), WOSB certifications and set-asides." },
  { name: "NIFC - Wildfire Contracting", url: "https://www.nifc.gov", icon: "fire", desc: "National Interagency Fire Center. Wildfire & forestry contracts." },
];

const AGGREGATOR_PORTALS = [
  { name: "DemandStar", url: "https://network.demandstar.com/", desc: "Connects government agencies with vendors for county & local bids. Thousands of agencies across the U.S." },
  { name: "BidNet Direct", url: "https://www.bidnetdirect.com/", desc: "State & local government bids including county-level RFPs. Many counties post through BidNet groups." },
  { name: "FindRFP", url: "https://www.findrfp.com/", desc: "Central database for state, county, city, municipal, utilities, schools, hospitals — all levels of government." },
  { name: "PublicPurchase", url: "https://www.publicpurchase.com/", desc: "Free bid notification system for local governments, counties, and municipal agencies." },
  { name: "BidPrime", url: "https://www.bidprime.com/", desc: "Searches over 110,000 government agencies including counties for bid opportunities." },
  { name: "Euna Supplier Network (Bonfire)", url: "https://supplier.eunasolutions.com/", desc: "Formerly Bonfire — widely used by counties for RFP posting and vendor responses." },
  { name: "PlanetBids", url: "https://www.planetbids.com/", desc: "E-procurement platform for local agencies." },
  { name: "GovWin", url: "https://www.deltek.com/en/products/govwin", desc: "Government contract intelligence platform." },
];

function renderMarkdown(text: string) {
  const lines = text.split('\n');
  const elements: JSX.Element[] = [];
  let key = 0;

  for (const line of lines) {
    if (line.startsWith('### ')) {
      elements.push(<h4 key={key++} className="font-bold text-amber-200 mt-3 mb-1 text-sm">{processInline(line.slice(4))}</h4>);
    } else if (line.startsWith('## ')) {
      elements.push(<h3 key={key++} className="font-bold text-amber-100 mt-3 mb-1">{processInline(line.slice(3))}</h3>);
    } else if (line.startsWith('# ')) {
      elements.push(<h2 key={key++} className="font-bold text-white mt-3 mb-1 text-base">{processInline(line.slice(2))}</h2>);
    } else if (line.startsWith('- ') || line.startsWith('• ')) {
      elements.push(
        <div key={key++} className="flex gap-1.5 ml-2 my-0.5">
          <span className="text-amber-400 shrink-0">•</span>
          <span>{processInline(line.slice(2))}</span>
        </div>
      );
    } else if (/^\d+\.\s/.test(line)) {
      const match = line.match(/^(\d+)\.\s(.*)$/);
      if (match) {
        elements.push(
          <div key={key++} className="flex gap-1.5 ml-2 my-0.5">
            <span className="text-amber-400 shrink-0">{match[1]}.</span>
            <span>{processInline(match[2])}</span>
          </div>
        );
      }
    } else if (line.trim() === '') {
      elements.push(<div key={key++} className="h-2" />);
    } else {
      elements.push(<p key={key++} className="my-0.5">{processInline(line)}</p>);
    }
  }
  return elements;
}

function processInline(text: string): (string | JSX.Element)[] {
  const parts: (string | JSX.Element)[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
    if (boldMatch && boldMatch.index !== undefined) {
      if (boldMatch.index > 0) parts.push(remaining.slice(0, boldMatch.index));
      parts.push(<strong key={`b${key++}`} className="font-semibold text-white">{boldMatch[1]}</strong>);
      remaining = remaining.slice(boldMatch.index + boldMatch[0].length);
    } else {
      parts.push(remaining);
      break;
    }
  }
  return parts;
}

export default function AIBidIntelPro() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("agent");
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [enableVoice, setEnableVoice] = useState(true);
  const [isIntroPlaying, setIsIntroPlaying] = useState(false);
  const [selectedState, setSelectedState] = useState("");
  const [countySearch, setCountySearch] = useState("");
  const [usaceFilter, setUsaceFilter] = useState<string>("all");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("");
  const [emailCompanyName, setEmailCompanyName] = useState("");
  const [emailOwnerName, setEmailOwnerName] = useState("");
  const [emailCerts, setEmailCerts] = useState("");
  const [emailCapabilities, setEmailCapabilities] = useState("");
  const [emailLocation, setEmailLocation] = useState("");
  const [emailPhone, setEmailPhone] = useState("");
  const [emailContactEmail, setEmailContactEmail] = useState("");
  const [generatedEmail, setGeneratedEmail] = useState<{ subject: string; body: string; tips: string[] } | null>(null);
  const [generatedCapStatement, setGeneratedCapStatement] = useState<{ sections: Record<string, string>; tips: string[] } | null>(null);
  const [capNaics, setCapNaics] = useState("");
  const [capYears, setCapYears] = useState("");
  const [capBonding, setCapBonding] = useState("");
  const [capPastPerf, setCapPastPerf] = useState("");
  const [utilityFilter, setUtilityFilter] = useState("all");
  const [utilitySubTab, setUtilitySubTab] = useState<"checklist" | "portals" | "email" | "tracking">("checklist");
  const [checkedItems, setCheckedItems] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('utilityReadinessChecked');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch { return new Set(); }
  });
  const [utilEmailCompany, setUtilEmailCompany] = useState("");
  const [utilEmailOwner, setUtilEmailOwner] = useState("");
  const [utilEmailUtility, setUtilEmailUtility] = useState("");
  const [utilEmailCerts, setUtilEmailCerts] = useState("");
  const [utilEmailCaps, setUtilEmailCaps] = useState("");
  const [utilEmailLocation, setUtilEmailLocation] = useState("");
  const [utilEmailPhone, setUtilEmailPhone] = useState("");
  const [utilEmailContact, setUtilEmailContact] = useState("");
  const [utilEmailYears, setUtilEmailYears] = useState("");
  const [utilEmailCrewSize, setUtilEmailCrewSize] = useState("");
  const [generatedUtilEmail, setGeneratedUtilEmail] = useState<{ subject: string; body: string; tips: string[] } | null>(null);
  const [expandedUtility, setExpandedUtility] = useState("");
  const [showRegSteps, setShowRegSteps] = useState<string>("");
  const [showPlatformSteps, setShowPlatformSteps] = useState<string>("");
  const [showGeorgiaEMCs, setShowGeorgiaEMCs] = useState(false);
  const [showAlabamaEMCs, setShowAlabamaEMCs] = useState(false);
  const [showAlaskaEMCs, setShowAlaskaEMCs] = useState(false);
  const [showArizonaEMCs, setShowArizonaEMCs] = useState(false);
  const [showArkansasEMCs, setShowArkansasEMCs] = useState(false);
  const [showCaliforniaEMCs, setShowCaliforniaEMCs] = useState(false);
  const [showColoradoEMCs, setShowColoradoEMCs] = useState(false);
  const [showConnecticutEMCs, setShowConnecticutEMCs] = useState(false);
  const [showDelawareEMCs, setShowDelawareEMCs] = useState(false);
  const [showFloridaEMCs, setShowFloridaEMCs] = useState(false);
  const [showHawaiiEMCs, setShowHawaiiEMCs] = useState(false);
  const [showIdahoEMCs, setShowIdahoEMCs] = useState(false);
  const [showIllinoisEMCs, setShowIllinoisEMCs] = useState(false);
  const [showIowaEMCs, setShowIowaEMCs] = useState(false);
  const [showKansasEMCs, setShowKansasEMCs] = useState(false);
  const [showKentuckyEMCs, setShowKentuckyEMCs] = useState(false);
  const [showLouisianaEMCs, setShowLouisianaEMCs] = useState(false);
  const [showMaineEMCs, setShowMaineEMCs] = useState(false);
  const [showMarylandEMCs, setShowMarylandEMCs] = useState(false);
  const [showMassachusettsEMCs, setShowMassachusettsEMCs] = useState(false);
  const [showMichiganEMCs, setShowMichiganEMCs] = useState(false);
  const [showMinnesotaEMCs, setShowMinnesotaEMCs] = useState(false);
  const [showMississippiEMCs, setShowMississippiEMCs] = useState(false);
  const [showMissouriEMCs, setShowMissouriEMCs] = useState(false);
  const [showMontanaEMCs, setShowMontanaEMCs] = useState(false);
  const [showNebraskaEMCs, setShowNebraskaEMCs] = useState(false);
  const [showNevadaEMCs, setShowNevadaEMCs] = useState(false);
  const [showNewHampshireEMCs, setShowNewHampshireEMCs] = useState(false);
  const [showNewJerseyEMCs, setShowNewJerseyEMCs] = useState(false);
  const [showNewMexicoEMCs, setShowNewMexicoEMCs] = useState(false);
  const [showNewYorkEMCs, setShowNewYorkEMCs] = useState(false);
  const [showNorthCarolinaEMCs, setShowNorthCarolinaEMCs] = useState(false);
  const [showNorthDakotaEMCs, setShowNorthDakotaEMCs] = useState(false);
  const [showTexasEMCs, setShowTexasEMCs] = useState(false);
  const [showDotPortals, setShowDotPortals] = useState(false);
  const [showForestryAgencies, setShowForestryAgencies] = useState(false);
  const [showStormPrimes, setShowStormPrimes] = useState(false);
  const [emcSearchTerm, setEmcSearchTerm] = useState("");
  const [alEmcSearchTerm, setAlEmcSearchTerm] = useState("");
  const [akEmcSearchTerm, setAkEmcSearchTerm] = useState("");
  const [azEmcSearchTerm, setAzEmcSearchTerm] = useState("");
  const [arEmcSearchTerm, setArEmcSearchTerm] = useState("");
  const [caEmcSearchTerm, setCaEmcSearchTerm] = useState("");
  const [coEmcSearchTerm, setCoEmcSearchTerm] = useState("");
  const [ctEmcSearchTerm, setCtEmcSearchTerm] = useState("");
  const [deEmcSearchTerm, setDeEmcSearchTerm] = useState("");
  const [flEmcSearchTerm, setFlEmcSearchTerm] = useState("");
  const [hiEmcSearchTerm, setHiEmcSearchTerm] = useState("");
  const [idEmcSearchTerm, setIdEmcSearchTerm] = useState("");
  const [ilEmcSearchTerm, setIlEmcSearchTerm] = useState("");
  const [iaEmcSearchTerm, setIaEmcSearchTerm] = useState("");
  const [ksEmcSearchTerm, setKsEmcSearchTerm] = useState("");
  const [kyEmcSearchTerm, setKyEmcSearchTerm] = useState("");
  const [laEmcSearchTerm, setLaEmcSearchTerm] = useState("");
  const [meEmcSearchTerm, setMeEmcSearchTerm] = useState("");
  const [mdEmcSearchTerm, setMdEmcSearchTerm] = useState("");
  const [maEmcSearchTerm, setMaEmcSearchTerm] = useState("");
  const [miEmcSearchTerm, setMiEmcSearchTerm] = useState("");
  const [mnEmcSearchTerm, setMnEmcSearchTerm] = useState("");
  const [msEmcSearchTerm, setMsEmcSearchTerm] = useState("");
  const [moEmcSearchTerm, setMoEmcSearchTerm] = useState("");
  const [mtEmcSearchTerm, setMtEmcSearchTerm] = useState("");
  const [neEmcSearchTerm, setNeEmcSearchTerm] = useState("");
  const [nvEmcSearchTerm, setNvEmcSearchTerm] = useState("");
  const [nhEmcSearchTerm, setNhEmcSearchTerm] = useState("");
  const [njEmcSearchTerm, setNjEmcSearchTerm] = useState("");
  const [nmEmcSearchTerm, setNmEmcSearchTerm] = useState("");
  const [nyEmcSearchTerm, setNyEmcSearchTerm] = useState("");
  const [ncEmcSearchTerm, setNcEmcSearchTerm] = useState("");
  const [ndEmcSearchTerm, setNdEmcSearchTerm] = useState("");
  const [txEmcSearchTerm, setTxEmcSearchTerm] = useState("");
  const [dotSearchTerm, setDotSearchTerm] = useState("");
  const [forestrySearchTerm, setForestrySearchTerm] = useState("");
  const [stormPrimeSearchTerm, setStormPrimeSearchTerm] = useState("");
  const [portalAssistantOpen, setPortalAssistantOpen] = useState(false);
  const [portalAssistantUrl, setPortalAssistantUrl] = useState("");
  const [portalAssistantName, setPortalAssistantName] = useState("");
  const [portalAssistantType, setPortalAssistantType] = useState("");
  const [portalAssistantDesc, setPortalAssistantDesc] = useState("");
  const [portalChatHistory, setPortalChatHistory] = useState<ChatMessage[]>([]);
  const [portalChatInput, setPortalChatInput] = useState("");
  const [iframeLoadFailed, setIframeLoadFailed] = useState(false);
  const [iframeLoading, setIframeLoading] = useState(true);
  const audioRef = useRef<HTMLAudioElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const portalChatEndRef = useRef<HTMLDivElement>(null);

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/bidintel/dashboard/stats"],
  });

  const { data: tips, isLoading: tipsLoading } = useQuery<InsiderTip[]>({
    queryKey: ["/api/bidintel/tips"],
  });

  const { data: opportunities } = useQuery<any[]>({
    queryKey: ["/api/bidintel/opportunities"],
  });

  const { data: submissions } = useQuery<any[]>({
    queryKey: ["/api/bidintel/submissions"],
  });

  const { data: usaceData, isLoading: usaceLoading } = useQuery<{ districts: any[]; divisions: any[]; majorPrimes: string[] }>({
    queryKey: ["/api/bidintel/usace/districts"],
  });

  const { data: readinessData, isLoading: readinessLoading } = useQuery<{ checklist: any[]; stormPriorityRegistrations: any[]; totalItems: number; requiredItems: number }>({
    queryKey: ["/api/bidintel/utility-readiness/checklist"],
  });

  const { data: utilityPortalsData, isLoading: portalsLoading } = useQuery<any>({
    queryKey: ["/api/bidintel/utility-readiness/portals"],
  });

  const { data: trackingData, isLoading: trackingLoading } = useQuery<{ utilities: any[]; platforms: any[]; checklist: any[] }>({
    queryKey: ["/api/bidintel/utility-readiness/tracking-sheet"],
  });

  const emailMutation = useMutation({
    mutationFn: async (data: { districtName: string; companyInfo: any }) => {
      const res = await apiRequest("/api/bidintel/usace/generate-email", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: (data) => {
      setGeneratedEmail(data);
      toast({ title: "Email Generated", description: "Your introduction email is ready to review and send." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to generate email. Please try again.", variant: "destructive" });
    },
  });

  const capStatementMutation = useMutation({
    mutationFn: async (data: { companyInfo: any }) => {
      const res = await apiRequest("/api/bidintel/usace/generate-capability-statement", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: (data) => {
      setGeneratedCapStatement(data);
      toast({ title: "Capability Statement Generated", description: "Your federal capability statement is ready." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to generate capability statement.", variant: "destructive" });
    },
  });

  const utilEmailMutation = useMutation({
    mutationFn: async (data: { companyInfo: any }) => {
      const res = await apiRequest("/api/bidintel/utility-readiness/generate-intro-email", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: (data) => {
      setGeneratedUtilEmail(data);
      toast({ title: "Email Generated", description: "Your utility introduction email is ready to review and send." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to generate email. Please try again.", variant: "destructive" });
    },
  });

  const chatMutation = useMutation({
    mutationFn: async (data: { message: string; generateAudio: boolean }) => {
      const res = await apiRequest("/api/bidintel/chat", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: (data) => {
      const newMessage: ChatMessage = {
        role: "assistant",
        message: data.message,
        audioUrl: data.audioUrl,
        tips: data.tips,
      };
      setChatHistory((prev) => [...prev, newMessage]);
      
      if (enableVoice && data.audioUrl) {
        playAudio(data.audioUrl);
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to get AI response. Please try again.",
        variant: "destructive",
      });
    },
  });

  const voiceIntroMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("/api/bidintel/voice-guide/intro", {
        method: "GET",
      });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.audioUrl) {
        setIsIntroPlaying(true);
        playAudio(data.audioUrl);
      }
      setChatHistory([{
        role: "assistant",
        message: data.script,
        audioUrl: data.audioUrl,
      }]);
    },
  });

  const portalChatMutation = useMutation({
    mutationFn: async (data: { message: string; portalContext: any; generateAudio: boolean }) => {
      const res = await apiRequest("/api/bidintel/portal-assist", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: (data) => {
      const newMessage: ChatMessage = {
        role: "assistant",
        message: data.message,
        audioUrl: data.audioUrl,
      };
      setPortalChatHistory((prev) => [...prev, newMessage]);
      if (enableVoice && data.audioUrl) {
        playAudio(data.audioUrl);
      }
    },
    onError: (error: any) => {
      const isAuthError = error?.message?.includes("401") || error?.message?.includes("Authentication");
      if (isAuthError) {
        setPortalChatHistory((prev) => [...prev, {
          role: "assistant",
          message: "You need to be logged in to use the Portal Assistant. Please sign in and try again.",
        }]);
      } else {
        toast({ title: "Error", description: "Failed to get portal assistant response. Please try again.", variant: "destructive" });
      }
    },
  });

  const openPortalAssistant = (url: string, name: string, type: string, description?: string) => {
    setPortalAssistantUrl(url);
    setPortalAssistantName(name);
    setPortalAssistantType(type);
    setPortalAssistantDesc(description || "");
    setPortalChatHistory([{
      role: "assistant",
      message: `I'm Rachel, your Portal Assistant. You're viewing **${name}**.\n\nI can help you with:\n- **Step-by-step registration guidance** — I'll walk you through every field\n- **Document preparation** — What to have ready before you start\n- **Form completion tips** — What to enter in each section\n- **Insider advice** — Common mistakes to avoid\n\nThe portal is loading on the left. Ask me anything about the registration process, and I'll guide you through it!`,
    }]);
    setPortalChatInput("");
    setIframeLoadFailed(false);
    setIframeLoading(true);
    setPortalAssistantOpen(true);
  };

  const handlePortalChatSend = () => {
    if (!portalChatInput.trim()) return;
    const userMessage: ChatMessage = { role: "user", message: portalChatInput };
    setPortalChatHistory((prev) => [...prev, userMessage]);
    portalChatMutation.mutate({
      message: portalChatInput,
      portalContext: {
        portalName: portalAssistantName,
        portalUrl: portalAssistantUrl,
        portalType: portalAssistantType,
        portalDescription: portalAssistantDesc,
      },
      generateAudio: enableVoice,
    });
    setPortalChatInput("");
  };

  const handlePortalChatKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handlePortalChatSend();
    }
  };

  useEffect(() => {
    portalChatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [portalChatHistory]);

  useEffect(() => {
    if (portalAssistantOpen && iframeLoading && !iframeLoadFailed) {
      const timeout = setTimeout(() => {
        if (iframeLoading) {
          setIframeLoadFailed(true);
          setIframeLoading(false);
        }
      }, 10000);
      return () => clearTimeout(timeout);
    }
  }, [portalAssistantOpen, iframeLoading, iframeLoadFailed]);

  const playAudio = (audioUrl: string) => {
    if (audioRef.current) {
      audioRef.current.src = audioUrl;
      audioRef.current.play().catch(console.error);
      setIsSpeaking(true);
    }
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsSpeaking(false);
      setIsIntroPlaying(false);
    }
  };

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    
    const userMessage: ChatMessage = {
      role: "user",
      message: chatInput,
    };
    setChatHistory((prev) => [...prev, userMessage]);
    
    chatMutation.mutate({
      message: chatInput,
      generateAudio: enableVoice,
    });
    
    setChatInput("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      pricing: "bg-green-500/20 text-green-400 border-green-500/30",
      strategy: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      compliance: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      pre_bid: "bg-purple-500/20 text-purple-400 border-purple-500/30",
      submission: "bg-orange-500/20 text-orange-400 border-orange-500/30",
      certifications: "bg-pink-500/20 text-pink-400 border-pink-500/30",
      references: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
      technical: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
      negotiation: "bg-red-500/20 text-red-400 border-red-500/30",
      protest: "bg-gray-500/20 text-gray-400 border-gray-500/30",
    };
    return colors[category] || "bg-gray-500/20 text-gray-400 border-gray-500/30";
  };

  const sortedStates = useMemo(() => Object.keys(STATE_PROCUREMENT_PORTALS).sort(), []);

  const selectedStatePortal = selectedState ? STATE_PROCUREMENT_PORTALS[selectedState] : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <audio 
        ref={audioRef} 
        onEnded={() => {
          setIsSpeaking(false);
          setIsIntroPlaying(false);
        }}
      />
      
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate("/dashboard")}
              className="text-white hover:bg-white/10"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Hub
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl">
                <Swords className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">AI BidIntel Pro&trade;</h1>
                <p className="text-sm text-gray-400">Advanced Procurement Intelligence for Serious Contractors</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Label htmlFor="voice-toggle" className="text-sm text-gray-400">Voice</Label>
              <Switch
                id="voice-toggle"
                checked={enableVoice}
                onCheckedChange={setEnableVoice}
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => voiceIntroMutation.mutate()}
              disabled={voiceIntroMutation.isPending || isIntroPlaying}
              className="border-amber-500/50 text-amber-400 hover:bg-amber-500/20"
            >
              {isIntroPlaying ? (
                <>
                  <Pause className="w-4 h-4 mr-2" />
                  Playing...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Meet Rachel
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Active Opportunities</p>
                  <p className="text-2xl font-bold text-white">{stats?.activeOpportunities || 0}</p>
                </div>
                <Target className="w-8 h-8 text-amber-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Bids Submitted</p>
                  <p className="text-2xl font-bold text-white">{stats?.totalSubmitted || 0}</p>
                </div>
                <FileText className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Win Rate</p>
                  <p className="text-2xl font-bold text-green-400">{stats?.winRate || "0%"}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Won Revenue</p>
                  <p className="text-2xl font-bold text-emerald-400">{formatCurrency(stats?.wonAmount || 0)}</p>
                </div>
                <BarChart3 className="w-8 h-8 text-emerald-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-slate-800/50 border border-slate-700 flex-wrap h-auto gap-1 p-1">
            <TabsTrigger value="agent" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400">
              <MessageSquare className="w-4 h-4 mr-2" />
              AI Agent
            </TabsTrigger>
            <TabsTrigger value="portals" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400">
              <Globe className="w-4 h-4 mr-2" />
              Procurement Portals
            </TabsTrigger>
            <TabsTrigger value="bidnet" className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400">
              <Landmark className="w-4 h-4 mr-2" />
              BidNet Direct
            </TabsTrigger>
            <TabsTrigger value="samgov" className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400">
              <Shield className="w-4 h-4 mr-2" />
              SAM.gov
            </TabsTrigger>
            <TabsTrigger value="utility" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400">
              <Wrench className="w-4 h-4 mr-2" />
              Utility Readiness
            </TabsTrigger>
            <TabsTrigger value="usace" className="data-[state=active]:bg-red-500/20 data-[state=active]:text-red-400">
              <Flag className="w-4 h-4 mr-2" />
              USACE Outreach
            </TabsTrigger>
            <TabsTrigger value="tips" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400">
              <Lightbulb className="w-4 h-4 mr-2" />
              Tips
            </TabsTrigger>
            <TabsTrigger value="opportunities" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400">
              <Target className="w-4 h-4 mr-2" />
              Opportunities
            </TabsTrigger>
            <TabsTrigger value="submissions" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400">
              <FileText className="w-4 h-4 mr-2" />
              My Bids
            </TabsTrigger>
            <TabsTrigger value="contacts" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400">
              <Users className="w-4 h-4 mr-2" />
              Contacts
            </TabsTrigger>
            <TabsTrigger value="truecost" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400">
              <BarChart3 className="w-4 h-4 mr-2" />
              TrueCost&trade;
            </TabsTrigger>
          </TabsList>

          {/* AI AGENT TAB */}
          <TabsContent value="agent" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2 bg-slate-800/50 border-slate-700">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                        <span className="text-lg font-bold text-white">R</span>
                      </div>
                      <div>
                        <CardTitle className="text-white">Rachel - AI Bid Intelligence Expert</CardTitle>
                        <CardDescription>Your procurement expert — ask about bidding, forms, strategy, compliance</CardDescription>
                      </div>
                    </div>
                    {isSpeaking && (
                      <Button variant="ghost" size="sm" onClick={stopAudio} className="text-amber-400">
                        <VolumeX className="w-4 h-4 mr-1" />
                        Stop
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px] pr-4 mb-4">
                    {chatHistory.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center text-gray-400">
                        <Zap className="w-12 h-12 mb-4 text-amber-500/50" />
                        <p className="text-lg font-medium">Ready to help you WIN more bids</p>
                        <p className="text-sm mt-2">Ask me about finding bids, pricing strategy, completing forms, SAM.gov registration, or anything procurement</p>
                        <div className="flex flex-wrap gap-2 mt-4 justify-center">
                          {[
                            "How do I register on SAM.gov?",
                            "How to find bids in my state?",
                            "What makes a winning proposal?",
                            "Which USACE districts should I target for storm debris?",
                            "Help me draft an intro email to a USACE district",
                            "What should my capability statement include?"
                          ].map((q) => (
                            <Button
                              key={q}
                              variant="outline"
                              size="sm"
                              onClick={() => setChatInput(q)}
                              className="text-xs border-slate-600 text-gray-300 hover:bg-slate-700"
                            >
                              {q}
                            </Button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {chatHistory.map((msg, idx) => (
                          <div
                            key={idx}
                            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`max-w-[85%] rounded-xl p-4 ${
                                msg.role === "user"
                                  ? "bg-amber-500/20 text-white"
                                  : "bg-slate-700/50 text-gray-200"
                              }`}
                            >
                              {msg.role === "assistant" ? (
                                <div className="text-sm leading-relaxed">{renderMarkdown(msg.message)}</div>
                              ) : (
                                <p className="whitespace-pre-wrap">{msg.message}</p>
                              )}
                              {msg.tips && msg.tips.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-slate-600">
                                  <p className="text-xs text-amber-400 font-medium mb-2">Related Tips:</p>
                                  {msg.tips.map((tip, i) => (
                                    <div key={i} className="text-xs bg-slate-800/50 rounded p-2 mt-1">
                                      <span className="font-medium text-amber-400">{tip.title}:</span>{" "}
                                      <span className="text-gray-300">{tip.tip.slice(0, 100)}...</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                              {msg.audioUrl && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => playAudio(msg.audioUrl!)}
                                  className="mt-2 text-amber-400 hover:text-amber-300"
                                >
                                  <Volume2 className="w-4 h-4 mr-1" />
                                  Play Audio
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                        {chatMutation.isPending && (
                          <div className="flex justify-start">
                            <div className="bg-slate-700/50 rounded-xl px-4 py-3 flex items-center gap-3">
                              <Search className="h-4 w-4 text-amber-400 animate-pulse" />
                              <span className="text-sm text-amber-300">Rachel is analyzing...</span>
                            </div>
                          </div>
                        )}
                        <div ref={chatEndRef} />
                      </div>
                    )}
                  </ScrollArea>
                  
                  <div className="flex gap-2">
                    <Textarea
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={handleKeyPress}
                      placeholder="Ask Rachel about bidding, forms, pricing, compliance, procurement portals..."
                      className="min-h-[60px] bg-slate-900/50 border-slate-600 text-white placeholder:text-gray-500"
                    />
                    <div className="flex flex-col gap-2">
                      <Button
                        onClick={handleSendMessage}
                        disabled={!chatInput.trim() || chatMutation.isPending}
                        className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                      >
                        {chatMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-amber-400" />
                    Quick Reference
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-amber-400">Ask Rachel About</h4>
                    {[
                      "How do I register as a utility contractor?",
                      "What is ISNetworld and do I need it?",
                      "Which utilities have the biggest storm budgets?",
                      "Which USACE districts are highest priority?",
                      "How do I get on storm activation lists?",
                      "What documents do I need for utility registration?",
                      "What should a capability statement include?",
                      "Walk me through the readiness checklist",
                      "How do I register on SAM.gov step by step?",
                      "How do I get on USACE vendor lists?",
                    ].map((q, i) => (
                      <Button
                        key={i}
                        variant="ghost"
                        className="w-full justify-start text-left text-sm text-gray-300 hover:text-white hover:bg-slate-700/50 h-auto py-2"
                        onClick={() => setChatInput(q)}
                      >
                        <HelpCircle className="w-3 h-3 mr-2 text-amber-400 flex-shrink-0" />
                        <span className="truncate">{q}</span>
                      </Button>
                    ))}
                  </div>
                  
                  <Separator className="bg-slate-700" />
                  
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-amber-400">Tip Categories</h4>
                    <div className="flex flex-wrap gap-1">
                      {["pricing", "strategy", "compliance", "pre_bid", "submission", "certifications"].map((cat) => (
                        <Badge key={cat} className={getCategoryColor(cat)}>
                          {cat.replace("_", " ")}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* PROCUREMENT PORTALS TAB */}
          <TabsContent value="portals" className="space-y-6">
            {/* State/County Finder */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-amber-400" />
                  State & County Procurement Portal Finder
                </CardTitle>
                <CardDescription>Select a state to find the official procurement portal. Search by county to find local bidding sites.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-gray-300">Select State</Label>
                    <Select value={selectedState} onValueChange={setSelectedState}>
                      <SelectTrigger className="bg-slate-900/50 border-slate-600 text-white">
                        <SelectValue placeholder="Choose a state..." />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-600 max-h-[300px]">
                        {sortedStates.map((state) => (
                          <SelectItem key={state} value={state} className="text-white hover:bg-slate-700">
                            {state} ({STATE_PROCUREMENT_PORTALS[state].abbr})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-300">Search County / City</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                      <Input
                        value={countySearch}
                        onChange={(e) => setCountySearch(e.target.value)}
                        placeholder="e.g., Ouachita Parish, Harris County..."
                        className="pl-10 bg-slate-900/50 border-slate-600 text-white placeholder:text-gray-500"
                      />
                    </div>
                    <p className="text-xs text-gray-500">County/city bids are typically on BidNet Direct, DemandStar, or the county website</p>
                  </div>
                </div>

                {selectedStatePortal && (
                  <div className="bg-gradient-to-r from-amber-900/30 to-orange-900/30 border border-amber-500/30 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-white">{selectedState}</h3>
                        <p className="text-sm text-amber-200">{selectedStatePortal.name}</p>
                        <p className="text-xs text-gray-400 mt-1">{selectedStatePortal.url}</p>
                      </div>
                      <Button
                        onClick={() => openPortalAssistant(selectedStatePortal.url, selectedStatePortal.name, "state_procurement")}
                        className="bg-amber-500 hover:bg-amber-600 text-black font-semibold"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Open Portal
                      </Button>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openPortalAssistant(`https://www.bidnetdirect.com/search?q=${encodeURIComponent(selectedState)}&type=bids`, `BidNet Direct - ${selectedState}`, "bid_aggregator", "State and local government bids")}
                        className="border-amber-500/30 text-amber-300 hover:bg-amber-500/10 text-xs"
                      >
                        <Globe className="w-3 h-3 mr-1" />
                        BidNet Direct - {selectedStatePortal.abbr}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openPortalAssistant(`https://sam.gov/search/?index=opp&q=${encodeURIComponent(selectedState)}&sort=-relevance&page=1`, `SAM.gov - ${selectedState}`, "federal", "Federal contract opportunities")}
                        className="border-blue-500/30 text-blue-300 hover:bg-blue-500/10 text-xs"
                      >
                        <Shield className="w-3 h-3 mr-1" />
                        SAM.gov - {selectedStatePortal.abbr}
                      </Button>
                    </div>
                  </div>
                )}

                {countySearch.trim() && (
                  <div className="bg-slate-900/50 border border-slate-600 rounded-xl p-4">
                    <h4 className="text-sm font-medium text-amber-400 mb-2">County/City Bid Resources for "{countySearch}"</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openPortalAssistant("https://network.demandstar.com/", "DemandStar - County Bids", "bid_aggregator", "Connects government agencies with vendors for county & local bids")}
                        className="justify-start border-slate-600 text-gray-300 hover:bg-slate-700 text-xs"
                      >
                        <ExternalLink className="w-3 h-3 mr-2" />
                        DemandStar - County Bids
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openPortalAssistant(`https://www.bidnetdirect.com/search?q=${encodeURIComponent(countySearch)}&type=bids`, "BidNet Direct", "bid_aggregator", "State & local government bids including county-level RFPs")}
                        className="justify-start border-slate-600 text-gray-300 hover:bg-slate-700 text-xs"
                      >
                        <ExternalLink className="w-3 h-3 mr-2" />
                        BidNet Direct
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openPortalAssistant("https://www.findrfp.com/", "FindRFP", "bid_aggregator", "Central database for state, county, city, municipal, utilities, schools, hospitals")}
                        className="justify-start border-slate-600 text-gray-300 hover:bg-slate-700 text-xs"
                      >
                        <ExternalLink className="w-3 h-3 mr-2" />
                        FindRFP
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openPortalAssistant("https://www.publicpurchase.com/", "PublicPurchase", "bid_aggregator", "Free bid notification system for local governments and counties")}
                        className="justify-start border-slate-600 text-gray-300 hover:bg-slate-700 text-xs"
                      >
                        <ExternalLink className="w-3 h-3 mr-2" />
                        PublicPurchase
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openPortalAssistant("https://www.bidprime.com/", "BidPrime", "bid_aggregator", "Searches over 110,000 government agencies for bid opportunities")}
                        className="justify-start border-slate-600 text-gray-300 hover:bg-slate-700 text-xs"
                      >
                        <ExternalLink className="w-3 h-3 mr-2" />
                        BidPrime (110K+ Agencies)
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openPortalAssistant("https://supplier.eunasolutions.com/", "Euna Supplier Network (Bonfire)", "bid_aggregator", "Widely used by counties for RFP posting and vendor responses")}
                        className="justify-start border-slate-600 text-gray-300 hover:bg-slate-700 text-xs"
                      >
                        <ExternalLink className="w-3 h-3 mr-2" />
                        Euna/Bonfire Supplier
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(countySearch + ' county procurement bids purchasing portal')}`, '_blank')}
                        className="justify-start border-slate-600 text-gray-300 hover:bg-slate-700 text-xs col-span-full md:col-span-1"
                      >
                        <Search className="w-3 h-3 mr-2" />
                        Google: {countySearch} procurement
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Federal Portals */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Shield className="w-5 h-5 text-blue-400" />
                  Federal Government Bidding Sites
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {FEDERAL_PORTALS.map((portal, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-900/50 border border-slate-700 rounded-lg p-3 hover:border-blue-500/50 transition-colors cursor-pointer"
                      onClick={() => openPortalAssistant(portal.url, portal.name, "federal", portal.desc)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-white text-sm">{portal.name}</h4>
                          <p className="text-xs text-gray-400 mt-1">{portal.desc}</p>
                        </div>
                        <ExternalLink className="w-4 h-4 text-blue-400 shrink-0 ml-2" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Aggregator Sites */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Globe className="w-5 h-5 text-green-400" />
                  Bid Aggregator Sites (County & City Level)
                </CardTitle>
                <CardDescription>These platforms aggregate bids from multiple counties and cities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {AGGREGATOR_PORTALS.map((portal, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-900/50 border border-slate-700 rounded-lg p-3 hover:border-green-500/50 transition-colors cursor-pointer"
                      onClick={() => openPortalAssistant(portal.url, portal.name, "bid_aggregator", portal.desc)}
                    >
                      <h4 className="font-medium text-white text-sm">{portal.name}</h4>
                      <p className="text-xs text-gray-400 mt-1">{portal.desc}</p>
                      <ExternalLink className="w-3 h-3 text-green-400 mt-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* All 50 States Grid */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-amber-400" />
                  All 50 State Procurement Portals
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                  {sortedStates.map((state) => {
                    const portal = STATE_PROCUREMENT_PORTALS[state];
                    return (
                      <Button
                        key={state}
                        variant="outline"
                        size="sm"
                        onClick={() => openPortalAssistant(portal.url, portal.name, "state_procurement")}
                        className="justify-start border-slate-700 text-gray-300 hover:bg-amber-500/10 hover:border-amber-500/30 hover:text-amber-300 text-xs h-auto py-2"
                      >
                        <span className="font-bold text-amber-400 mr-1.5">{portal.abbr}</span>
                        <span className="truncate">{state}</span>
                      </Button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* BIDNET DIRECT TAB */}
          <TabsContent value="bidnet" className="space-y-4">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Landmark className="w-5 h-5 text-blue-400" />
                      BidNet Direct
                    </CardTitle>
                    <CardDescription>Access county and city government bid opportunities. Log into your BidNet Direct account.</CardDescription>
                  </div>
                  <Button
                    onClick={() => window.open('https://www.bidnetdirect.com/', '_blank')}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open in New Tab
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="w-full rounded-lg overflow-hidden border border-slate-600" style={{ height: '700px' }}>
                  <iframe
                    src="https://www.bidnetdirect.com/"
                    className="w-full h-full"
                    title="BidNet Direct"
                    sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  If the page doesn't load in the embedded view, click "Open in New Tab" above. Some sites block embedding for security.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* SAM.GOV TAB */}
          <TabsContent value="samgov" className="space-y-4">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Shield className="w-5 h-5 text-blue-400" />
                      SAM.gov - System for Award Management
                    </CardTitle>
                    <CardDescription>Federal contract opportunities, entity registration, and vendor management. Required for all federal contracting.</CardDescription>
                  </div>
                  <Button
                    onClick={() => window.open('https://sam.gov/', '_blank')}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open in New Tab
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                  <Button
                    variant="outline"
                    onClick={() => openPortalAssistant("https://sam.gov/opportunities", "SAM.gov - Contract Opportunities", "federal", "Search active federal bids and RFPs")}
                    className="border-blue-500/30 text-blue-300 hover:bg-blue-500/10 h-auto py-3"
                  >
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <Search className="w-4 h-4" />
                        <span className="font-medium">Contract Opportunities</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">Search active federal bids and RFPs</p>
                    </div>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => openPortalAssistant("https://sam.gov/content/entity-registration", "SAM.gov - Entity Registration", "federal", "Register your business for federal work")}
                    className="border-green-500/30 text-green-300 hover:bg-green-500/10 h-auto py-3"
                  >
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        <span className="font-medium">Entity Registration</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">Register your business for federal work</p>
                    </div>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => openPortalAssistant("https://sam.gov/content/assistance-listings", "SAM.gov - Assistance Listings", "federal", "Federal grants and financial assistance")}
                    className="border-amber-500/30 text-amber-300 hover:bg-amber-500/10 h-auto py-3"
                  >
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        <span className="font-medium">Assistance Listings</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">Federal grants and financial assistance</p>
                    </div>
                  </Button>
                </div>
                <div className="w-full rounded-lg overflow-hidden border border-slate-600" style={{ height: '700px' }}>
                  <iframe
                    src="https://sam.gov/"
                    className="w-full h-full"
                    title="SAM.gov"
                    sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  If the page doesn't load in the embedded view, click "Open in New Tab" above. SAM.gov requires a direct connection for login.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* UTILITY CONTRACTOR READINESS TAB */}
          <TabsContent value="utility" className="space-y-6">
            <div className="bg-gradient-to-r from-emerald-900/30 to-teal-900/30 border border-emerald-500/30 rounded-xl p-5">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-emerald-500/20 rounded-xl">
                  <Wrench className="w-8 h-8 text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Utility Contractor Readiness Center</h2>
                  <p className="text-sm text-gray-300 mt-1">
                    Utilities hire prequalified contractors — not brands. Register as an approved vendor, get into their procurement systems,
                    and position yourself on their emergency activation lists BEFORE storms hit.
                  </p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">Storm Activation Lists</Badge>
                    <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30">Vendor Prequalification</Badge>
                    <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">ISNetworld / Avetta</Badge>
                    <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">PowerAdvocate / SAP Ariba</Badge>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2 flex-wrap">
              <Button
                variant={utilitySubTab === "checklist" ? "default" : "outline"}
                size="sm"
                onClick={() => setUtilitySubTab("checklist")}
                className={utilitySubTab === "checklist" ? "bg-emerald-600 hover:bg-emerald-700" : "border-slate-600 text-gray-300 hover:bg-slate-700"}
              >
                <ClipboardList className="w-4 h-4 mr-2" />
                Readiness Checklist
              </Button>
              <Button
                variant={utilitySubTab === "portals" ? "default" : "outline"}
                size="sm"
                onClick={() => setUtilitySubTab("portals")}
                className={utilitySubTab === "portals" ? "bg-emerald-600 hover:bg-emerald-700" : "border-slate-600 text-gray-300 hover:bg-slate-700"}
              >
                <Zap className="w-4 h-4 mr-2" />
                Utility Portals
              </Button>
              <Button
                variant={utilitySubTab === "email" ? "default" : "outline"}
                size="sm"
                onClick={() => setUtilitySubTab("email")}
                className={utilitySubTab === "email" ? "bg-emerald-600 hover:bg-emerald-700" : "border-slate-600 text-gray-300 hover:bg-slate-700"}
              >
                <Mail className="w-4 h-4 mr-2" />
                Introduction Email
              </Button>
              <Button
                variant={utilitySubTab === "tracking" ? "default" : "outline"}
                size="sm"
                onClick={() => setUtilitySubTab("tracking")}
                className={utilitySubTab === "tracking" ? "bg-emerald-600 hover:bg-emerald-700" : "border-slate-600 text-gray-300 hover:bg-slate-700"}
              >
                <Table2 className="w-4 h-4 mr-2" />
                Tracking Sheet
              </Button>
            </div>

            {utilitySubTab === "checklist" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <Card className="bg-slate-800/50 border-slate-700">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <ListChecks className="w-5 h-5 text-emerald-400" />
                        Master Readiness Checklist
                      </CardTitle>
                      <CardDescription>
                        Complete these items to become a prequalified, storm-ready utility contractor.
                        {readinessData && (
                          <span className="ml-2 text-emerald-400">
                            {checkedItems.size} / {readinessData.totalItems} complete
                          </span>
                        )}
                      </CardDescription>
                      {readinessData && (
                        <div className="w-full bg-slate-700 rounded-full h-2 mt-2">
                          <div
                            className="bg-emerald-500 h-2 rounded-full transition-all"
                            style={{ width: `${(checkedItems.size / readinessData.totalItems) * 100}%` }}
                          />
                        </div>
                      )}
                    </CardHeader>
                    <CardContent>
                      {readinessLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
                        </div>
                      ) : (
                        <div className="space-y-6">
                          {[...new Set(readinessData?.checklist?.map((i: any) => i.category) || [])].map((category: string) => (
                            <div key={category}>
                              <h3 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider mb-3">{category}</h3>
                              <div className="space-y-2">
                                {readinessData?.checklist
                                  ?.filter((i: any) => i.category === category)
                                  .map((item: any) => (
                                    <div
                                      key={item.id}
                                      className={`border rounded-lg p-3 transition-all cursor-pointer ${
                                        checkedItems.has(item.id)
                                          ? 'border-emerald-500/50 bg-emerald-900/20'
                                          : 'border-slate-700 bg-slate-900/50 hover:border-slate-500'
                                      }`}
                                      onClick={() => {
                                        const newChecked = new Set(checkedItems);
                                        if (newChecked.has(item.id)) {
                                          newChecked.delete(item.id);
                                        } else {
                                          newChecked.add(item.id);
                                        }
                                        setCheckedItems(newChecked);
                                        try { localStorage.setItem('utilityReadinessChecked', JSON.stringify([...newChecked])); } catch {}
                                      }}
                                    >
                                      <div className="flex items-start gap-3">
                                        <div className={`w-5 h-5 rounded border-2 mt-0.5 flex items-center justify-center flex-shrink-0 ${
                                          checkedItems.has(item.id)
                                            ? 'bg-emerald-500 border-emerald-500'
                                            : 'border-slate-500'
                                        }`}>
                                          {checkedItems.has(item.id) && <CheckCircle2 className="w-3 h-3 text-white" />}
                                        </div>
                                        <div className="flex-1">
                                          <div className="flex items-center gap-2 flex-wrap">
                                            <span className={`font-medium ${checkedItems.has(item.id) ? 'text-emerald-300 line-through' : 'text-white'}`}>
                                              {item.item}
                                            </span>
                                            <Badge className={
                                              item.priority === 'required' ? 'bg-red-500/20 text-red-400 border-red-500/30 text-xs' :
                                              item.priority === 'highly_recommended' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs' :
                                              'bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs'
                                            }>
                                              {item.priority === 'required' ? 'REQUIRED' : item.priority === 'highly_recommended' ? 'HIGHLY REC.' : 'RECOMMENDED'}
                                            </Badge>
                                            {item.forStormWork && (
                                              <Badge className="bg-orange-500/10 text-orange-300 border-orange-500/20 text-xs">Storm</Badge>
                                            )}
                                          </div>
                                          <p className="text-xs text-gray-400 mt-1">{item.description}</p>
                                          <p className="text-xs text-emerald-300/70 mt-1 italic">{item.tips}</p>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-6">
                  <Card className="bg-slate-800/50 border-slate-700">
                    <CardHeader>
                      <CardTitle className="text-white text-sm flex items-center gap-2">
                        <Star className="w-4 h-4 text-amber-400" />
                        Storm Market Priority Order
                      </CardTitle>
                      <CardDescription className="text-xs">Complete these registrations in this order for maximum storm market positioning</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {readinessData?.stormPriorityRegistrations?.map((reg: any) => (
                        <div key={reg.rank} className="flex items-start gap-3 border-b border-slate-700/50 pb-2 last:border-0">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                            reg.rank <= 3 ? 'bg-red-500/20 text-red-400' :
                            reg.rank <= 6 ? 'bg-amber-500/20 text-amber-400' :
                            'bg-blue-500/20 text-blue-400'
                          }`}>
                            {reg.rank}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">{reg.item}</p>
                            <p className="text-xs text-gray-400">{reg.reason}</p>
                            <p className="text-xs text-emerald-400 mt-0.5">{reg.timeToComplete}</p>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-emerald-900/20 to-teal-900/20 border-emerald-500/20">
                    <CardHeader>
                      <CardTitle className="text-sm text-white">Why Register as a Contractor?</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {[
                        "Utilities hire prequalified contractors — not brands",
                        "You enter their vendor database & sourcing system",
                        "You get on their emergency activation list",
                        "You receive RFP notifications & bid invitations",
                        "You are pre-positioned before disasters hit",
                        "Your insurance & safety docs reduce their risk",
                        "Primes can find you when they need local subs"
                      ].map((reason, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                          <p className="text-xs text-gray-300">{reason}</p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {utilitySubTab === "portals" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <Card className="bg-slate-800/50 border-slate-700">
                    <CardHeader>
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <CardTitle className="text-white flex items-center gap-2">
                          <Zap className="w-5 h-5 text-amber-400" />
                          Utility Companies — Storm Priority Ranked
                        </CardTitle>
                        <Select value={utilityFilter} onValueChange={setUtilityFilter}>
                          <SelectTrigger className="w-[200px] bg-slate-900/50 border-slate-600 text-white">
                            <SelectValue placeholder="Filter by region" />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-800 border-slate-600">
                            <SelectItem value="all" className="text-white hover:bg-slate-700">All Regions</SelectItem>
                            <SelectItem value="critical" className="text-white hover:bg-slate-700">Critical Priority Only</SelectItem>
                            {utilityPortalsData?.regions?.map((r: string) => (
                              <SelectItem key={r} value={r} className="text-white hover:bg-slate-700">{r}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <CardDescription>Register as an approved vendor with these utility companies to get on their storm activation lists</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {portalsLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {(utilityPortalsData?.utilities || [])
                            .filter((u: any) => {
                              if (utilityFilter === "all") return true;
                              if (utilityFilter === "critical") return u.stormPriority === "critical";
                              return u.region === utilityFilter;
                            })
                            .map((utility: any, idx: number) => (
                            <div
                              key={utility.name}
                              className={`border rounded-lg p-4 cursor-pointer transition-all ${
                                expandedUtility === utility.name
                                  ? 'border-emerald-400 bg-emerald-900/20'
                                  : 'border-slate-700 bg-slate-900/50 hover:border-slate-500'
                              }`}
                              onClick={() => setExpandedUtility(utility.name === expandedUtility ? "" : utility.name)}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <span className="text-lg font-bold text-gray-500 w-8">#{idx + 1}</span>
                                  <div>
                                    <h4 className="font-medium text-white">{utility.name}</h4>
                                    <p className="text-xs text-gray-400">{utility.region} • {utility.states.join(', ')}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <Badge className={
                                    utility.stormPriority === 'critical' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                                    utility.stormPriority === 'high' ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' :
                                    'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                                  }>
                                    {utility.stormPriority.toUpperCase()}
                                  </Badge>
                                  <div className="text-right">
                                    <div className="text-sm font-bold text-white">{utility.stormPriorityScore}</div>
                                    <div className="text-xs text-gray-500">score</div>
                                  </div>
                                </div>
                              </div>

                              {expandedUtility === utility.name && (
                                <div className="mt-4 pt-4 border-t border-slate-700 space-y-3">
                                  <p className="text-sm text-gray-300">{utility.registrationNotes}</p>
                                  <div className="grid grid-cols-2 gap-3 text-xs">
                                    <div>
                                      <span className="text-gray-500">Vendor Platform:</span>
                                      <p className="text-white font-medium">{utility.vendorPlatform}</p>
                                    </div>
                                    <div>
                                      <span className="text-gray-500">Annual Storm Spend:</span>
                                      <p className="text-emerald-400 font-bold">{utility.annualStormSpend}</p>
                                    </div>
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-500 mb-1">Contract Types:</p>
                                    <div className="flex flex-wrap gap-1">
                                      {utility.contractTypes.map((ct: string) => (
                                        <Badge key={ct} variant="outline" className="text-xs border-slate-600 text-gray-300">{ct}</Badge>
                                      ))}
                                    </div>
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    <Button
                                      size="sm"
                                      onClick={(e) => { e.stopPropagation(); openPortalAssistant(utility.registrationUrl, utility.name, "utility", utility.vendorPlatform); }}
                                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                    >
                                      <ExternalLink className="w-3 h-3 mr-1" />
                                      Register Now
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setUtilEmailUtility(utility.name);
                                        setUtilitySubTab("email");
                                      }}
                                      className="border-amber-500/30 text-amber-300 hover:bg-amber-500/10"
                                    >
                                      <Mail className="w-3 h-3 mr-1" />
                                      Draft Intro Email
                                    </Button>
                                    {utility.registrationSteps?.length > 0 && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setShowRegSteps(showRegSteps === utility.name ? "" : utility.name);
                                        }}
                                        className="border-blue-500/30 text-blue-300 hover:bg-blue-500/10"
                                      >
                                        <ListChecks className="w-3 h-3 mr-1" />
                                        {showRegSteps === utility.name ? "Hide Steps" : "Registration Steps"}
                                      </Button>
                                    )}
                                  </div>

                                  {showRegSteps === utility.name && utility.registrationSteps?.length > 0 && (
                                    <div className="mt-3 pt-3 border-t border-slate-600 space-y-2">
                                      <h5 className="text-sm font-semibold text-blue-400 flex items-center gap-1">
                                        <ClipboardList className="w-4 h-4" />
                                        Step-by-Step Registration Guide
                                      </h5>
                                      {utility.registrationSteps.map((step: any) => (
                                        <div key={step.step} className="flex gap-3 p-2 rounded bg-slate-800/70 border border-slate-700">
                                          <div className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold border border-blue-500/30">
                                            {step.step}
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <h6 className="text-sm font-medium text-white">{step.title}</h6>
                                            <p className="text-xs text-gray-400 mt-0.5">{step.description}</p>
                                            {step.estimatedTime && (
                                              <span className="inline-flex items-center gap-1 text-xs text-gray-500 mt-1">
                                                <Clock className="w-3 h-3" /> {step.estimatedTime}
                                              </span>
                                            )}
                                            {step.documentsNeeded?.length > 0 && (
                                              <div className="mt-1">
                                                <span className="text-xs text-gray-500">Documents needed: </span>
                                                <span className="text-xs text-amber-400">{step.documentsNeeded.join(", ")}</span>
                                              </div>
                                            )}
                                            {step.tips && (
                                              <div className="mt-1 text-xs text-emerald-400 flex items-start gap-1">
                                                <Lightbulb className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                                {step.tips}
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-6">
                  <Card className="bg-slate-800/50 border-slate-700">
                    <CardHeader>
                      <CardTitle className="text-sm text-white flex items-center gap-2">
                        <Shield className="w-4 h-4 text-blue-400" />
                        Vendor Management Platforms
                      </CardTitle>
                      <CardDescription className="text-xs">You MUST be registered on these platforms to work with utilities</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {utilityPortalsData?.platforms?.map((platform: any) => (
                        <div key={platform.name} className="border border-slate-700 rounded-lg p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-white text-sm">{platform.name}</h4>
                            <Badge className={
                              platform.priority === 'critical' ? 'bg-red-500/20 text-red-400 border-red-500/30 text-xs' :
                              platform.priority === 'high' ? 'bg-orange-500/20 text-orange-400 border-orange-500/30 text-xs' :
                              'bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs'
                            }>
                              {platform.priority.toUpperCase()}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-400">{platform.description}</p>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-500">Cost: <span className="text-amber-400">{platform.costToRegister}</span></span>
                            <div className="flex gap-1">
                              {platform.registrationSteps?.length > 0 && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 text-xs text-emerald-400 hover:text-emerald-300"
                                  onClick={() => setShowPlatformSteps(showPlatformSteps === platform.name ? "" : platform.name)}
                                >
                                  <ListChecks className="w-3 h-3 mr-1" />
                                  Steps
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 text-xs text-blue-400 hover:text-blue-300"
                                onClick={() => openPortalAssistant(platform.url, platform.name, "vendor_platform", platform.description)}
                              >
                                <ExternalLink className="w-3 h-3 mr-1" />
                                Visit
                              </Button>
                            </div>
                          </div>
                          {showPlatformSteps === platform.name && platform.registrationSteps?.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-slate-600 space-y-1.5">
                              <h5 className="text-xs font-semibold text-blue-400">Registration Steps:</h5>
                              {platform.registrationSteps.map((step: any) => (
                                <div key={step.step} className="flex gap-2 p-1.5 rounded bg-slate-800/70 border border-slate-700">
                                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-[10px] font-bold border border-blue-500/30">
                                    {step.step}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h6 className="text-xs font-medium text-white">{step.title}</h6>
                                    <p className="text-[10px] text-gray-400 mt-0.5">{step.description}</p>
                                    {step.estimatedTime && (
                                      <span className="text-[10px] text-gray-500"><Clock className="w-2.5 h-2.5 inline mr-0.5" />{step.estimatedTime}</span>
                                    )}
                                    {step.documentsNeeded?.length > 0 && (
                                      <div className="text-[10px] text-amber-400 mt-0.5">{step.documentsNeeded.join(" • ")}</div>
                                    )}
                                    {step.tips && (
                                      <div className="text-[10px] text-emerald-400 mt-0.5"><Lightbulb className="w-2.5 h-2.5 inline mr-0.5" />{step.tips}</div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}

                      {utilityPortalsData?.governmentPortals?.length > 0 && (
                        <>
                          <Separator className="my-3 bg-slate-600" />
                          <h4 className="text-sm font-semibold text-amber-400 flex items-center gap-1 mb-2">
                            <Landmark className="w-4 h-4" />
                            Government & Municipal Portals
                          </h4>
                          {utilityPortalsData.governmentPortals.map((portal: any) => (
                            <div key={portal.name} className="border border-slate-700 rounded-lg p-3 space-y-2">
                              <div className="flex items-center justify-between gap-1">
                                <h4 className="font-medium text-white text-sm leading-tight">{portal.name}</h4>
                                <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px] flex-shrink-0">
                                  {portal.type.toUpperCase()}
                                </Badge>
                              </div>
                              <p className="text-xs text-gray-400">{portal.description}</p>
                              <div className="flex items-center gap-1">
                                {portal.registrationSteps?.length > 0 && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 text-xs text-emerald-400 hover:text-emerald-300"
                                    onClick={() => setShowPlatformSteps(showPlatformSteps === portal.name ? "" : portal.name)}
                                  >
                                    <ListChecks className="w-3 h-3 mr-1" />
                                    Steps
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 text-xs text-blue-400 hover:text-blue-300"
                                  onClick={() => openPortalAssistant(portal.url, portal.name, "state_procurement", portal.description)}
                                >
                                  <ExternalLink className="w-3 h-3 mr-1" />
                                  Visit
                                </Button>
                              </div>
                              {showPlatformSteps === portal.name && portal.registrationSteps?.length > 0 && (
                                <div className="mt-2 pt-2 border-t border-slate-600 space-y-1.5">
                                  <h5 className="text-xs font-semibold text-blue-400">Registration Steps:</h5>
                                  {portal.registrationSteps.map((step: any) => (
                                    <div key={step.step} className="flex gap-2 p-1.5 rounded bg-slate-800/70 border border-slate-700">
                                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-[10px] font-bold border border-amber-500/30">
                                        {step.step}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <h6 className="text-xs font-medium text-white">{step.title}</h6>
                                        <p className="text-[10px] text-gray-400 mt-0.5">{step.description}</p>
                                        {step.estimatedTime && (
                                          <span className="text-[10px] text-gray-500"><Clock className="w-2.5 h-2.5 inline mr-0.5" />{step.estimatedTime}</span>
                                        )}
                                        {step.documentsNeeded?.length > 0 && (
                                          <div className="text-[10px] text-amber-400 mt-0.5">{step.documentsNeeded.join(" • ")}</div>
                                        )}
                                        {step.tips && (
                                          <div className="text-[10px] text-emerald-400 mt-0.5"><Lightbulb className="w-2.5 h-2.5 inline mr-0.5" />{step.tips}</div>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </>
                      )}

                      {utilityPortalsData?.georgiaEMCs?.length > 0 && (
                        <>
                          <Separator className="my-3 bg-slate-600" />
                          <div>
                            <Button
                              variant="ghost"
                              className="w-full justify-between text-sm font-semibold text-green-400 hover:text-green-300 p-0 h-auto"
                              onClick={() => setShowGeorgiaEMCs(!showGeorgiaEMCs)}
                            >
                              <span className="flex items-center gap-1">
                                <Zap className="w-4 h-4" />
                                Georgia EMCs ({utilityPortalsData.georgiaEMCs.filter((e: any) => e.type === "emc").length} Cooperatives)
                              </span>
                              {showGeorgiaEMCs ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </Button>
                            <p className="text-[10px] text-gray-500 mt-0.5">Electric Membership Corporations — register as vendor for vegetation, storm debris, ROW, equipment</p>
                          </div>
                          {showGeorgiaEMCs && (
                            <div className="space-y-2 mt-2">
                              <Input
                                placeholder="Search EMCs..."
                                value={emcSearchTerm}
                                onChange={(e) => setEmcSearchTerm(e.target.value)}
                                className="bg-slate-900/50 border-slate-600 text-white text-xs h-7"
                              />
                              <div className="max-h-[400px] overflow-y-auto space-y-1.5 pr-1">
                                {utilityPortalsData.georgiaEMCs
                                  .filter((emc: any) => emc.type === "emc")
                                  .filter((emc: any) => !emcSearchTerm || emc.name.toLowerCase().includes(emcSearchTerm.toLowerCase()) || emc.description.toLowerCase().includes(emcSearchTerm.toLowerCase()))
                                  .map((emc: any) => (
                                    <div key={emc.name} className="border border-slate-700 rounded p-2 hover:border-green-500/30 transition-colors">
                                      <div className="flex items-center justify-between gap-1">
                                        <h5 className="text-xs font-medium text-white leading-tight">{emc.name}</h5>
                                        {emc.website && (
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-5 text-[10px] text-blue-400 hover:text-blue-300 px-1"
                                            onClick={() => openPortalAssistant(emc.website, emc.name, "utility", emc.description)}
                                          >
                                            <ExternalLink className="w-2.5 h-2.5" />
                                          </Button>
                                        )}
                                      </div>
                                      <p className="text-[10px] text-gray-500 mt-0.5">{emc.description}</p>
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {emc.serviceTypes.slice(0, 3).map((s: string) => (
                                          <Badge key={s} className="bg-green-500/10 text-green-400 border-green-500/20 text-[8px] py-0 px-1">{s}</Badge>
                                        ))}
                                      </div>
                                    </div>
                                  ))}
                              </div>
                              <Separator className="my-2 bg-slate-700" />
                              <h5 className="text-xs font-semibold text-amber-400 flex items-center gap-1">
                                <Building2 className="w-3 h-3" />
                                EMC Support Organizations
                              </h5>
                              {utilityPortalsData.georgiaEMCs
                                .filter((emc: any) => emc.type === "support_org")
                                .map((org: any) => (
                                  <div key={org.name} className="border border-slate-700 rounded p-2">
                                    <div className="flex items-center justify-between gap-1">
                                      <h5 className="text-xs font-medium text-amber-300 leading-tight">{org.name}</h5>
                                      {org.website && (
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-5 text-[10px] text-blue-400 hover:text-blue-300 px-1"
                                          onClick={() => openPortalAssistant(org.website, org.name, "utility", org.description)}
                                        >
                                          <ExternalLink className="w-2.5 h-2.5" />
                                        </Button>
                                      )}
                                    </div>
                                    <p className="text-[10px] text-gray-500 mt-0.5">{org.description}</p>
                                  </div>
                                ))}
                            </div>
                          )}
                        </>
                      )}

                      {utilityPortalsData?.alabamaEMCs?.length > 0 && (
                        <>
                          <Separator className="my-3 bg-slate-600" />
                          <div>
                            <Button
                              variant="ghost"
                              className="w-full justify-between text-sm font-semibold text-orange-400 hover:text-orange-300 p-0 h-auto"
                              onClick={() => setShowAlabamaEMCs(!showAlabamaEMCs)}
                            >
                              <span className="flex items-center gap-1">
                                <Zap className="w-4 h-4" />
                                Alabama EMCs ({utilityPortalsData.alabamaEMCs.filter((e: any) => e.type === "emc").length} Cooperatives)
                              </span>
                              {showAlabamaEMCs ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </Button>
                            <p className="text-[10px] text-gray-500 mt-0.5">Alabama electric cooperatives — register for storm work, ROW clearing, vegetation management</p>
                          </div>
                          {showAlabamaEMCs && (
                            <div className="space-y-2 mt-2">
                              <Input
                                placeholder="Search Alabama EMCs..."
                                value={alEmcSearchTerm}
                                onChange={(e) => setAlEmcSearchTerm(e.target.value)}
                                className="bg-slate-900/50 border-slate-600 text-white text-xs h-7"
                              />
                              <div className="max-h-[400px] overflow-y-auto space-y-1.5 pr-1">
                                {utilityPortalsData.alabamaEMCs
                                  .filter((emc: any) => emc.type === "emc")
                                  .filter((emc: any) => !alEmcSearchTerm || emc.name.toLowerCase().includes(alEmcSearchTerm.toLowerCase()) || emc.description.toLowerCase().includes(alEmcSearchTerm.toLowerCase()))
                                  .map((emc: any) => (
                                    <div key={emc.name} className="border border-slate-700 rounded p-2 hover:border-orange-500/30 transition-colors">
                                      <div className="flex items-center justify-between gap-1">
                                        <h5 className="text-xs font-medium text-white leading-tight">{emc.name}</h5>
                                        {emc.website && (
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-5 text-[10px] text-blue-400 hover:text-blue-300 px-1"
                                            onClick={() => openPortalAssistant(emc.website, emc.name, "utility", emc.description)}
                                          >
                                            <ExternalLink className="w-2.5 h-2.5" />
                                          </Button>
                                        )}
                                      </div>
                                      <p className="text-[10px] text-gray-500 mt-0.5">{emc.description}</p>
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {emc.serviceTypes.slice(0, 3).map((s: string) => (
                                          <Badge key={s} className="bg-orange-500/10 text-orange-400 border-orange-500/20 text-[8px] py-0 px-1">{s}</Badge>
                                        ))}
                                      </div>
                                    </div>
                                  ))}
                              </div>
                              <Separator className="my-2 bg-slate-700" />
                              <h5 className="text-xs font-semibold text-amber-400 flex items-center gap-1">
                                <Building2 className="w-3 h-3" />
                                Alabama Utility & Cooperative Organizations
                              </h5>
                              {utilityPortalsData.alabamaEMCs
                                .filter((emc: any) => emc.type === "support_org")
                                .map((org: any) => (
                                  <div key={org.name} className="border border-slate-700 rounded p-2">
                                    <div className="flex items-center justify-between gap-1">
                                      <h5 className="text-xs font-medium text-amber-300 leading-tight">{org.name}</h5>
                                      {org.website && (
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-5 text-[10px] text-blue-400 hover:text-blue-300 px-1"
                                          onClick={() => openPortalAssistant(org.website, org.name, "utility", org.description)}
                                        >
                                          <ExternalLink className="w-2.5 h-2.5" />
                                        </Button>
                                      )}
                                    </div>
                                    <p className="text-[10px] text-gray-500 mt-0.5">{org.description}</p>
                                  </div>
                                ))}
                            </div>
                          )}
                        </>
                      )}

                      {utilityPortalsData?.alaskaEMCs?.length > 0 && (
                        <>
                          <Separator className="my-3 bg-slate-600" />
                          <div>
                            <Button
                              variant="ghost"
                              className="w-full justify-between text-sm font-semibold text-cyan-400 hover:text-cyan-300 p-0 h-auto"
                              onClick={() => setShowAlaskaEMCs(!showAlaskaEMCs)}
                            >
                              <span className="flex items-center gap-1">
                                <Zap className="w-4 h-4" />
                                Alaska Utilities ({utilityPortalsData.alaskaEMCs.filter((e: any) => e.type === "emc").length} Cooperatives & Municipals)
                              </span>
                              {showAlaskaEMCs ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </Button>
                            <p className="text-[10px] text-gray-500 mt-0.5">Alaska cooperatives & municipal utilities — storm, ROW, emergency restoration</p>
                          </div>
                          {showAlaskaEMCs && (
                            <div className="space-y-2 mt-2">
                              <Input
                                placeholder="Search Alaska utilities..."
                                value={akEmcSearchTerm}
                                onChange={(e) => setAkEmcSearchTerm(e.target.value)}
                                className="bg-slate-900/50 border-slate-600 text-white text-xs h-7"
                              />
                              <div className="max-h-[400px] overflow-y-auto space-y-1.5 pr-1">
                                {utilityPortalsData.alaskaEMCs
                                  .filter((emc: any) => emc.type === "emc")
                                  .filter((emc: any) => !akEmcSearchTerm || emc.name.toLowerCase().includes(akEmcSearchTerm.toLowerCase()) || emc.description.toLowerCase().includes(akEmcSearchTerm.toLowerCase()))
                                  .map((emc: any) => (
                                    <div key={emc.name} className="border border-slate-700 rounded p-2 hover:border-cyan-500/30 transition-colors">
                                      <div className="flex items-center justify-between gap-1">
                                        <h5 className="text-xs font-medium text-white leading-tight">{emc.name}</h5>
                                        {emc.website && (
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-5 text-[10px] text-blue-400 hover:text-blue-300 px-1"
                                            onClick={() => openPortalAssistant(emc.website, emc.name, "utility", emc.description)}
                                          >
                                            <ExternalLink className="w-2.5 h-2.5" />
                                          </Button>
                                        )}
                                      </div>
                                      <p className="text-[10px] text-gray-500 mt-0.5">{emc.description}</p>
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {emc.serviceTypes.slice(0, 3).map((s: string) => (
                                          <Badge key={s} className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20 text-[8px] py-0 px-1">{s}</Badge>
                                        ))}
                                      </div>
                                    </div>
                                  ))}
                              </div>
                              <Separator className="my-2 bg-slate-700" />
                              <h5 className="text-xs font-semibold text-amber-400 flex items-center gap-1">
                                <Building2 className="w-3 h-3" />
                                Alaska Investor-Owned Utilities
                              </h5>
                              {utilityPortalsData.alaskaEMCs
                                .filter((emc: any) => emc.type === "support_org")
                                .map((org: any) => (
                                  <div key={org.name} className="border border-slate-700 rounded p-2">
                                    <div className="flex items-center justify-between gap-1">
                                      <h5 className="text-xs font-medium text-amber-300 leading-tight">{org.name}</h5>
                                      {org.website && (
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-5 text-[10px] text-blue-400 hover:text-blue-300 px-1"
                                          onClick={() => openPortalAssistant(org.website, org.name, "utility", org.description)}
                                        >
                                          <ExternalLink className="w-2.5 h-2.5" />
                                        </Button>
                                      )}
                                    </div>
                                    <p className="text-[10px] text-gray-500 mt-0.5">{org.description}</p>
                                  </div>
                                ))}
                            </div>
                          )}
                        </>
                      )}

                      {utilityPortalsData?.arizonaEMCs?.length > 0 && (
                        <>
                          <Separator className="my-3 bg-slate-600" />
                          <div>
                            <Button
                              variant="ghost"
                              className="w-full justify-between text-sm font-semibold text-red-400 hover:text-red-300 p-0 h-auto"
                              onClick={() => setShowArizonaEMCs(!showArizonaEMCs)}
                            >
                              <span className="flex items-center gap-1">
                                <Zap className="w-4 h-4" />
                                Arizona Utilities ({utilityPortalsData.arizonaEMCs.filter((e: any) => e.type === "emc").length} Cooperatives & Municipals)
                              </span>
                              {showArizonaEMCs ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </Button>
                            <p className="text-[10px] text-gray-500 mt-0.5">Arizona cooperatives, IOUs & municipal utilities — storm, ROW, vegetation</p>
                          </div>
                          {showArizonaEMCs && (
                            <div className="space-y-2 mt-2">
                              <Input
                                placeholder="Search Arizona utilities..."
                                value={azEmcSearchTerm}
                                onChange={(e) => setAzEmcSearchTerm(e.target.value)}
                                className="bg-slate-900/50 border-slate-600 text-white text-xs h-7"
                              />
                              <div className="max-h-[400px] overflow-y-auto space-y-1.5 pr-1">
                                {utilityPortalsData.arizonaEMCs
                                  .filter((emc: any) => emc.type === "emc")
                                  .filter((emc: any) => !azEmcSearchTerm || emc.name.toLowerCase().includes(azEmcSearchTerm.toLowerCase()) || emc.description.toLowerCase().includes(azEmcSearchTerm.toLowerCase()))
                                  .map((emc: any) => (
                                    <div key={emc.name} className="border border-slate-700 rounded p-2 hover:border-red-500/30 transition-colors">
                                      <div className="flex items-center justify-between gap-1">
                                        <h5 className="text-xs font-medium text-white leading-tight">{emc.name}</h5>
                                        {emc.website && (
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-5 text-[10px] text-blue-400 hover:text-blue-300 px-1"
                                            onClick={() => openPortalAssistant(emc.website, emc.name, "utility", emc.description)}
                                          >
                                            <ExternalLink className="w-2.5 h-2.5" />
                                          </Button>
                                        )}
                                      </div>
                                      <p className="text-[10px] text-gray-500 mt-0.5">{emc.description}</p>
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {emc.serviceTypes.slice(0, 3).map((s: string) => (
                                          <Badge key={s} className="bg-red-500/10 text-red-400 border-red-500/20 text-[8px] py-0 px-1">{s}</Badge>
                                        ))}
                                      </div>
                                    </div>
                                  ))}
                              </div>
                              <Separator className="my-2 bg-slate-700" />
                              <h5 className="text-xs font-semibold text-amber-400 flex items-center gap-1">
                                <Building2 className="w-3 h-3" />
                                Arizona IOUs & Utility Organizations
                              </h5>
                              {utilityPortalsData.arizonaEMCs
                                .filter((emc: any) => emc.type === "support_org")
                                .map((org: any) => (
                                  <div key={org.name} className="border border-slate-700 rounded p-2">
                                    <div className="flex items-center justify-between gap-1">
                                      <h5 className="text-xs font-medium text-amber-300 leading-tight">{org.name}</h5>
                                      {org.website && (
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-5 text-[10px] text-blue-400 hover:text-blue-300 px-1"
                                          onClick={() => openPortalAssistant(org.website, org.name, "utility", org.description)}
                                        >
                                          <ExternalLink className="w-2.5 h-2.5" />
                                        </Button>
                                      )}
                                    </div>
                                    <p className="text-[10px] text-gray-500 mt-0.5">{org.description}</p>
                                  </div>
                                ))}
                            </div>
                          )}
                        </>
                      )}

                      {utilityPortalsData?.arkansasEMCs?.length > 0 && (
                        <>
                          <Separator className="my-3 bg-slate-600" />
                          <div>
                            <Button
                              variant="ghost"
                              className="w-full justify-between text-sm font-semibold text-purple-400 hover:text-purple-300 p-0 h-auto"
                              onClick={() => setShowArkansasEMCs(!showArkansasEMCs)}
                            >
                              <span className="flex items-center gap-1">
                                <Zap className="w-4 h-4" />
                                Arkansas Utilities ({utilityPortalsData.arkansasEMCs.filter((e: any) => e.type === "emc").length} Cooperatives & Municipals)
                              </span>
                              {showArkansasEMCs ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </Button>
                            <p className="text-[10px] text-gray-500 mt-0.5">Arkansas cooperatives, IOUs & municipal utilities — storm, vegetation, ROW</p>
                          </div>
                          {showArkansasEMCs && (
                            <div className="space-y-2 mt-2">
                              <Input
                                placeholder="Search Arkansas utilities..."
                                value={arEmcSearchTerm}
                                onChange={(e) => setArEmcSearchTerm(e.target.value)}
                                className="bg-slate-900/50 border-slate-600 text-white text-xs h-7"
                              />
                              <div className="max-h-[400px] overflow-y-auto space-y-1.5 pr-1">
                                {utilityPortalsData.arkansasEMCs
                                  .filter((emc: any) => emc.type === "emc")
                                  .filter((emc: any) => !arEmcSearchTerm || emc.name.toLowerCase().includes(arEmcSearchTerm.toLowerCase()) || emc.description.toLowerCase().includes(arEmcSearchTerm.toLowerCase()))
                                  .map((emc: any) => (
                                    <div key={emc.name} className="border border-slate-700 rounded p-2 hover:border-purple-500/30 transition-colors">
                                      <div className="flex items-center justify-between gap-1">
                                        <h5 className="text-xs font-medium text-white leading-tight">{emc.name}</h5>
                                        {emc.website && (
                                          <Button size="sm" variant="ghost" className="h-5 text-[10px] text-blue-400 hover:text-blue-300 px-1" onClick={() => openPortalAssistant(emc.website, emc.name, "utility", emc.description)}>
                                            <ExternalLink className="w-2.5 h-2.5" />
                                          </Button>
                                        )}
                                      </div>
                                      <p className="text-[10px] text-gray-500 mt-0.5">{emc.description}</p>
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {emc.serviceTypes.slice(0, 3).map((s: string) => (
                                          <Badge key={s} className="bg-purple-500/10 text-purple-400 border-purple-500/20 text-[8px] py-0 px-1">{s}</Badge>
                                        ))}
                                      </div>
                                    </div>
                                  ))}
                              </div>
                              <Separator className="my-2 bg-slate-700" />
                              <h5 className="text-xs font-semibold text-amber-400 flex items-center gap-1">
                                <Building2 className="w-3 h-3" />
                                Arkansas IOUs & Utility Organizations
                              </h5>
                              {utilityPortalsData.arkansasEMCs
                                .filter((emc: any) => emc.type === "support_org")
                                .map((org: any) => (
                                  <div key={org.name} className="border border-slate-700 rounded p-2">
                                    <div className="flex items-center justify-between gap-1">
                                      <h5 className="text-xs font-medium text-amber-300 leading-tight">{org.name}</h5>
                                      {org.website && (
                                        <Button size="sm" variant="ghost" className="h-5 text-[10px] text-blue-400 hover:text-blue-300 px-1" onClick={() => openPortalAssistant(org.website, org.name, "utility", org.description)}>
                                          <ExternalLink className="w-2.5 h-2.5" />
                                        </Button>
                                      )}
                                    </div>
                                    <p className="text-[10px] text-gray-500 mt-0.5">{org.description}</p>
                                  </div>
                                ))}
                            </div>
                          )}
                        </>
                      )}

                      {utilityPortalsData?.californiaEMCs?.length > 0 && (
                        <>
                          <Separator className="my-3 bg-slate-600" />
                          <div>
                            <Button
                              variant="ghost"
                              className="w-full justify-between text-sm font-semibold text-yellow-400 hover:text-yellow-300 p-0 h-auto"
                              onClick={() => setShowCaliforniaEMCs(!showCaliforniaEMCs)}
                            >
                              <span className="flex items-center gap-1">
                                <Zap className="w-4 h-4" />
                                California Utilities ({utilityPortalsData.californiaEMCs.filter((e: any) => e.type === "emc").length} Cooperatives & Municipals)
                              </span>
                              {showCaliforniaEMCs ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </Button>
                            <p className="text-[10px] text-gray-500 mt-0.5">California IOUs, municipal utilities & cooperatives — wildfire, vegetation, storm</p>
                          </div>
                          {showCaliforniaEMCs && (
                            <div className="space-y-2 mt-2">
                              <Input
                                placeholder="Search California utilities..."
                                value={caEmcSearchTerm}
                                onChange={(e) => setCaEmcSearchTerm(e.target.value)}
                                className="bg-slate-900/50 border-slate-600 text-white text-xs h-7"
                              />
                              <div className="max-h-[400px] overflow-y-auto space-y-1.5 pr-1">
                                {utilityPortalsData.californiaEMCs
                                  .filter((emc: any) => emc.type === "emc")
                                  .filter((emc: any) => !caEmcSearchTerm || emc.name.toLowerCase().includes(caEmcSearchTerm.toLowerCase()) || emc.description.toLowerCase().includes(caEmcSearchTerm.toLowerCase()))
                                  .map((emc: any) => (
                                    <div key={emc.name} className="border border-slate-700 rounded p-2 hover:border-yellow-500/30 transition-colors">
                                      <div className="flex items-center justify-between gap-1">
                                        <h5 className="text-xs font-medium text-white leading-tight">{emc.name}</h5>
                                        {emc.website && (
                                          <Button size="sm" variant="ghost" className="h-5 text-[10px] text-blue-400 hover:text-blue-300 px-1" onClick={() => openPortalAssistant(emc.website, emc.name, "utility", emc.description)}>
                                            <ExternalLink className="w-2.5 h-2.5" />
                                          </Button>
                                        )}
                                      </div>
                                      <p className="text-[10px] text-gray-500 mt-0.5">{emc.description}</p>
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {emc.serviceTypes.slice(0, 3).map((s: string) => (
                                          <Badge key={s} className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20 text-[8px] py-0 px-1">{s}</Badge>
                                        ))}
                                      </div>
                                    </div>
                                  ))}
                              </div>
                              <Separator className="my-2 bg-slate-700" />
                              <h5 className="text-xs font-semibold text-amber-400 flex items-center gap-1">
                                <Building2 className="w-3 h-3" />
                                California IOUs & Utility Organizations
                              </h5>
                              {utilityPortalsData.californiaEMCs
                                .filter((emc: any) => emc.type === "support_org")
                                .map((org: any) => (
                                  <div key={org.name} className="border border-slate-700 rounded p-2">
                                    <div className="flex items-center justify-between gap-1">
                                      <h5 className="text-xs font-medium text-amber-300 leading-tight">{org.name}</h5>
                                      {org.website && (
                                        <Button size="sm" variant="ghost" className="h-5 text-[10px] text-blue-400 hover:text-blue-300 px-1" onClick={() => openPortalAssistant(org.website, org.name, "utility", org.description)}>
                                          <ExternalLink className="w-2.5 h-2.5" />
                                        </Button>
                                      )}
                                    </div>
                                    <p className="text-[10px] text-gray-500 mt-0.5">{org.description}</p>
                                  </div>
                                ))}
                            </div>
                          )}
                        </>
                      )}

                      {utilityPortalsData?.coloradoEMCs?.length > 0 && (
                        <>
                          <Separator className="my-3 bg-slate-600" />
                          <div>
                            <Button
                              variant="ghost"
                              className="w-full justify-between text-sm font-semibold text-blue-400 hover:text-blue-300 p-0 h-auto"
                              onClick={() => setShowColoradoEMCs(!showColoradoEMCs)}
                            >
                              <span className="flex items-center gap-1">
                                <Zap className="w-4 h-4" />
                                Colorado Utilities ({utilityPortalsData.coloradoEMCs.filter((e: any) => e.type === "emc").length} Cooperatives & Municipals)
                              </span>
                              {showColoradoEMCs ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </Button>
                            <p className="text-[10px] text-gray-500 mt-0.5">Colorado cooperatives, IOUs & municipal utilities — wildfire, storm, vegetation</p>
                          </div>
                          {showColoradoEMCs && (
                            <div className="space-y-2 mt-2">
                              <Input
                                placeholder="Search Colorado utilities..."
                                value={coEmcSearchTerm}
                                onChange={(e) => setCoEmcSearchTerm(e.target.value)}
                                className="bg-slate-900/50 border-slate-600 text-white text-xs h-7"
                              />
                              <div className="max-h-[400px] overflow-y-auto space-y-1.5 pr-1">
                                {utilityPortalsData.coloradoEMCs
                                  .filter((emc: any) => emc.type === "emc")
                                  .filter((emc: any) => !coEmcSearchTerm || emc.name.toLowerCase().includes(coEmcSearchTerm.toLowerCase()) || emc.description.toLowerCase().includes(coEmcSearchTerm.toLowerCase()))
                                  .map((emc: any) => (
                                    <div key={emc.name} className="border border-slate-700 rounded p-2 hover:border-blue-500/30 transition-colors">
                                      <div className="flex items-center justify-between gap-1">
                                        <h5 className="text-xs font-medium text-white leading-tight">{emc.name}</h5>
                                        {emc.website && (
                                          <Button size="sm" variant="ghost" className="h-5 text-[10px] text-blue-400 hover:text-blue-300 px-1" onClick={() => openPortalAssistant(emc.website, emc.name, "utility", emc.description)}>
                                            <ExternalLink className="w-2.5 h-2.5" />
                                          </Button>
                                        )}
                                      </div>
                                      <p className="text-[10px] text-gray-500 mt-0.5">{emc.description}</p>
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {emc.serviceTypes.slice(0, 3).map((s: string) => (
                                          <Badge key={s} className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-[8px] py-0 px-1">{s}</Badge>
                                        ))}
                                      </div>
                                    </div>
                                  ))}
                              </div>
                              <Separator className="my-2 bg-slate-700" />
                              <h5 className="text-xs font-semibold text-amber-400 flex items-center gap-1">
                                <Building2 className="w-3 h-3" />
                                Colorado IOUs & Utility Organizations
                              </h5>
                              {utilityPortalsData.coloradoEMCs
                                .filter((emc: any) => emc.type === "support_org")
                                .map((org: any) => (
                                  <div key={org.name} className="border border-slate-700 rounded p-2">
                                    <div className="flex items-center justify-between gap-1">
                                      <h5 className="text-xs font-medium text-amber-300 leading-tight">{org.name}</h5>
                                      {org.website && (
                                        <Button size="sm" variant="ghost" className="h-5 text-[10px] text-blue-400 hover:text-blue-300 px-1" onClick={() => openPortalAssistant(org.website, org.name, "utility", org.description)}>
                                          <ExternalLink className="w-2.5 h-2.5" />
                                        </Button>
                                      )}
                                    </div>
                                    <p className="text-[10px] text-gray-500 mt-0.5">{org.description}</p>
                                  </div>
                                ))}
                            </div>
                          )}
                        </>
                      )}

                      {utilityPortalsData?.connecticutEMCs?.length > 0 && (
                        <>
                          <Separator className="my-3 bg-slate-600" />
                          <div>
                            <Button
                              variant="ghost"
                              className="w-full justify-between text-sm font-semibold text-indigo-400 hover:text-indigo-300 p-0 h-auto"
                              onClick={() => setShowConnecticutEMCs(!showConnecticutEMCs)}
                            >
                              <span className="flex items-center gap-1">
                                <Zap className="w-4 h-4" />
                                Connecticut Utilities ({utilityPortalsData.connecticutEMCs.filter((e: any) => e.type === "emc").length} Cooperatives & Municipals)
                              </span>
                              {showConnecticutEMCs ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </Button>
                            <p className="text-[10px] text-gray-500 mt-0.5">Connecticut IOUs & municipal utilities — storm, vegetation, distribution</p>
                          </div>
                          {showConnecticutEMCs && (
                            <div className="space-y-2 mt-2">
                              <Input
                                placeholder="Search Connecticut utilities..."
                                value={ctEmcSearchTerm}
                                onChange={(e) => setCtEmcSearchTerm(e.target.value)}
                                className="bg-slate-900/50 border-slate-600 text-white text-xs h-7"
                              />
                              <div className="max-h-[400px] overflow-y-auto space-y-1.5 pr-1">
                                {utilityPortalsData.connecticutEMCs
                                  .filter((emc: any) => emc.type === "emc")
                                  .filter((emc: any) => !ctEmcSearchTerm || emc.name.toLowerCase().includes(ctEmcSearchTerm.toLowerCase()) || emc.description.toLowerCase().includes(ctEmcSearchTerm.toLowerCase()))
                                  .map((emc: any) => (
                                    <div key={emc.name} className="border border-slate-700 rounded p-2 hover:border-indigo-500/30 transition-colors">
                                      <div className="flex items-center justify-between gap-1">
                                        <h5 className="text-xs font-medium text-white leading-tight">{emc.name}</h5>
                                        {emc.website && (
                                          <Button size="sm" variant="ghost" className="h-5 text-[10px] text-blue-400 hover:text-blue-300 px-1" onClick={() => openPortalAssistant(emc.website, emc.name, "utility", emc.description)}>
                                            <ExternalLink className="w-2.5 h-2.5" />
                                          </Button>
                                        )}
                                      </div>
                                      <p className="text-[10px] text-gray-500 mt-0.5">{emc.description}</p>
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {emc.serviceTypes.slice(0, 3).map((s: string) => (
                                          <Badge key={s} className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 text-[8px] py-0 px-1">{s}</Badge>
                                        ))}
                                      </div>
                                    </div>
                                  ))}
                              </div>
                              <Separator className="my-2 bg-slate-700" />
                              <h5 className="text-xs font-semibold text-amber-400 flex items-center gap-1">
                                <Building2 className="w-3 h-3" />
                                Connecticut IOUs & Utility Organizations
                              </h5>
                              {utilityPortalsData.connecticutEMCs
                                .filter((emc: any) => emc.type === "support_org")
                                .map((org: any) => (
                                  <div key={org.name} className="border border-slate-700 rounded p-2">
                                    <div className="flex items-center justify-between gap-1">
                                      <h5 className="text-xs font-medium text-amber-300 leading-tight">{org.name}</h5>
                                      {org.website && (
                                        <Button size="sm" variant="ghost" className="h-5 text-[10px] text-blue-400 hover:text-blue-300 px-1" onClick={() => openPortalAssistant(org.website, org.name, "utility", org.description)}>
                                          <ExternalLink className="w-2.5 h-2.5" />
                                        </Button>
                                      )}
                                    </div>
                                    <p className="text-[10px] text-gray-500 mt-0.5">{org.description}</p>
                                  </div>
                                ))}
                            </div>
                          )}
                        </>
                      )}

                      {utilityPortalsData?.delawareEMCs?.length > 0 && (
                        <>
                          <Separator className="my-3 bg-slate-600" />
                          <div>
                            <Button
                              variant="ghost"
                              className="w-full justify-between text-sm font-semibold text-teal-400 hover:text-teal-300 p-0 h-auto"
                              onClick={() => setShowDelawareEMCs(!showDelawareEMCs)}
                            >
                              <span className="flex items-center gap-1">
                                <Zap className="w-4 h-4" />
                                Delaware Utilities ({utilityPortalsData.delawareEMCs.filter((e: any) => e.type === "emc").length} Cooperatives & Municipals)
                              </span>
                              {showDelawareEMCs ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </Button>
                            <p className="text-[10px] text-gray-500 mt-0.5">Delaware cooperative, IOUs & municipal utilities — storm, vegetation</p>
                          </div>
                          {showDelawareEMCs && (
                            <div className="space-y-2 mt-2">
                              <Input
                                placeholder="Search Delaware utilities..."
                                value={deEmcSearchTerm}
                                onChange={(e) => setDeEmcSearchTerm(e.target.value)}
                                className="bg-slate-900/50 border-slate-600 text-white text-xs h-7"
                              />
                              <div className="max-h-[400px] overflow-y-auto space-y-1.5 pr-1">
                                {utilityPortalsData.delawareEMCs
                                  .filter((emc: any) => emc.type === "emc")
                                  .filter((emc: any) => !deEmcSearchTerm || emc.name.toLowerCase().includes(deEmcSearchTerm.toLowerCase()) || emc.description.toLowerCase().includes(deEmcSearchTerm.toLowerCase()))
                                  .map((emc: any) => (
                                    <div key={emc.name} className="border border-slate-700 rounded p-2 hover:border-teal-500/30 transition-colors">
                                      <div className="flex items-center justify-between gap-1">
                                        <h5 className="text-xs font-medium text-white leading-tight">{emc.name}</h5>
                                        {emc.website && (
                                          <Button size="sm" variant="ghost" className="h-5 text-[10px] text-blue-400 hover:text-blue-300 px-1" onClick={() => openPortalAssistant(emc.website, emc.name, "utility", emc.description)}>
                                            <ExternalLink className="w-2.5 h-2.5" />
                                          </Button>
                                        )}
                                      </div>
                                      <p className="text-[10px] text-gray-500 mt-0.5">{emc.description}</p>
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {emc.serviceTypes.slice(0, 3).map((s: string) => (
                                          <Badge key={s} className="bg-teal-500/10 text-teal-400 border-teal-500/20 text-[8px] py-0 px-1">{s}</Badge>
                                        ))}
                                      </div>
                                    </div>
                                  ))}
                              </div>
                              <Separator className="my-2 bg-slate-700" />
                              <h5 className="text-xs font-semibold text-amber-400 flex items-center gap-1">
                                <Building2 className="w-3 h-3" />
                                Delaware IOUs & Utility Organizations
                              </h5>
                              {utilityPortalsData.delawareEMCs
                                .filter((emc: any) => emc.type === "support_org")
                                .map((org: any) => (
                                  <div key={org.name} className="border border-slate-700 rounded p-2">
                                    <div className="flex items-center justify-between gap-1">
                                      <h5 className="text-xs font-medium text-amber-300 leading-tight">{org.name}</h5>
                                      {org.website && (
                                        <Button size="sm" variant="ghost" className="h-5 text-[10px] text-blue-400 hover:text-blue-300 px-1" onClick={() => openPortalAssistant(org.website, org.name, "utility", org.description)}>
                                          <ExternalLink className="w-2.5 h-2.5" />
                                        </Button>
                                      )}
                                    </div>
                                    <p className="text-[10px] text-gray-500 mt-0.5">{org.description}</p>
                                  </div>
                                ))}
                            </div>
                          )}
                        </>
                      )}

                      {utilityPortalsData?.floridaEMCs?.length > 0 && (
                        <>
                          <Separator className="my-3 bg-slate-600" />
                          <div>
                            <Button
                              variant="ghost"
                              className="w-full justify-between text-sm font-semibold text-orange-400 hover:text-orange-300 p-0 h-auto"
                              onClick={() => setShowFloridaEMCs(!showFloridaEMCs)}
                            >
                              <span className="flex items-center gap-1">
                                <Zap className="w-4 h-4" />
                                Florida Utilities ({utilityPortalsData.floridaEMCs.filter((e: any) => e.type === "emc").length} Cooperatives & Municipals)
                              </span>
                              {showFloridaEMCs ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </Button>
                            <p className="text-[10px] text-gray-500 mt-0.5">Florida IOUs, cooperatives & municipal utilities — hurricane, vegetation, storm</p>
                          </div>
                          {showFloridaEMCs && (
                            <div className="space-y-2 mt-2">
                              <Input
                                placeholder="Search Florida utilities..."
                                value={flEmcSearchTerm}
                                onChange={(e) => setFlEmcSearchTerm(e.target.value)}
                                className="bg-slate-900/50 border-slate-600 text-white text-xs h-7"
                              />
                              <div className="max-h-[400px] overflow-y-auto space-y-1.5 pr-1">
                                {utilityPortalsData.floridaEMCs
                                  .filter((emc: any) => emc.type === "emc")
                                  .filter((emc: any) => !flEmcSearchTerm || emc.name.toLowerCase().includes(flEmcSearchTerm.toLowerCase()) || emc.description.toLowerCase().includes(flEmcSearchTerm.toLowerCase()))
                                  .map((emc: any) => (
                                    <div key={emc.name} className="border border-slate-700 rounded p-2 hover:border-orange-500/30 transition-colors">
                                      <div className="flex items-center justify-between gap-1">
                                        <h5 className="text-xs font-medium text-white leading-tight">{emc.name}</h5>
                                        {emc.website && (
                                          <Button size="sm" variant="ghost" className="h-5 text-[10px] text-blue-400 hover:text-blue-300 px-1" onClick={() => openPortalAssistant(emc.website, emc.name, "utility", emc.description)}>
                                            <ExternalLink className="w-2.5 h-2.5" />
                                          </Button>
                                        )}
                                      </div>
                                      <p className="text-[10px] text-gray-500 mt-0.5">{emc.description}</p>
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {emc.serviceTypes.slice(0, 3).map((s: string) => (
                                          <Badge key={s} className="bg-orange-500/10 text-orange-400 border-orange-500/20 text-[8px] py-0 px-1">{s}</Badge>
                                        ))}
                                      </div>
                                    </div>
                                  ))}
                              </div>
                              <Separator className="my-2 bg-slate-700" />
                              <h5 className="text-xs font-semibold text-amber-400 flex items-center gap-1">
                                <Building2 className="w-3 h-3" />
                                Florida IOUs & Utility Organizations
                              </h5>
                              {utilityPortalsData.floridaEMCs
                                .filter((emc: any) => emc.type === "support_org")
                                .map((org: any) => (
                                  <div key={org.name} className="border border-slate-700 rounded p-2">
                                    <div className="flex items-center justify-between gap-1">
                                      <h5 className="text-xs font-medium text-amber-300 leading-tight">{org.name}</h5>
                                      {org.website && (
                                        <Button size="sm" variant="ghost" className="h-5 text-[10px] text-blue-400 hover:text-blue-300 px-1" onClick={() => openPortalAssistant(org.website, org.name, "utility", org.description)}>
                                          <ExternalLink className="w-2.5 h-2.5" />
                                        </Button>
                                      )}
                                    </div>
                                    <p className="text-[10px] text-gray-500 mt-0.5">{org.description}</p>
                                  </div>
                                ))}
                            </div>
                          )}
                        </>
                      )}

                      {utilityPortalsData?.hawaiiEMCs?.length > 0 && (
                        <>
                          <Separator className="my-3 bg-slate-600" />
                          <div>
                            <Button
                              variant="ghost"
                              className="w-full justify-between text-sm font-semibold text-sky-400 hover:text-sky-300 p-0 h-auto"
                              onClick={() => setShowHawaiiEMCs(!showHawaiiEMCs)}
                            >
                              <span className="flex items-center gap-1">
                                <Zap className="w-4 h-4" />
                                Hawaii Utilities ({utilityPortalsData.hawaiiEMCs.filter((e: any) => e.type === "emc").length} Cooperatives & Municipals)
                              </span>
                              {showHawaiiEMCs ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </Button>
                            <p className="text-[10px] text-gray-500 mt-0.5">Hawaii electric utilities — vegetation, storm, island infrastructure</p>
                          </div>
                          {showHawaiiEMCs && (
                            <div className="space-y-2 mt-2">
                              <Input
                                placeholder="Search Hawaii utilities..."
                                value={hiEmcSearchTerm}
                                onChange={(e) => setHiEmcSearchTerm(e.target.value)}
                                className="bg-slate-900/50 border-slate-600 text-white text-xs h-7"
                              />
                              <div className="max-h-[400px] overflow-y-auto space-y-1.5 pr-1">
                                {utilityPortalsData.hawaiiEMCs
                                  .filter((emc: any) => emc.type === "emc")
                                  .filter((emc: any) => !hiEmcSearchTerm || emc.name.toLowerCase().includes(hiEmcSearchTerm.toLowerCase()) || emc.description.toLowerCase().includes(hiEmcSearchTerm.toLowerCase()))
                                  .map((emc: any) => (
                                    <div key={emc.name} className="border border-slate-700 rounded p-2 hover:border-sky-500/30 transition-colors">
                                      <div className="flex items-center justify-between gap-1">
                                        <h5 className="text-xs font-medium text-white leading-tight">{emc.name}</h5>
                                        {emc.website && (
                                          <Button size="sm" variant="ghost" className="h-5 text-[10px] text-blue-400 hover:text-blue-300 px-1" onClick={() => openPortalAssistant(emc.website, emc.name, "utility", emc.description)}>
                                            <ExternalLink className="w-2.5 h-2.5" />
                                          </Button>
                                        )}
                                      </div>
                                      <p className="text-[10px] text-gray-500 mt-0.5">{emc.description}</p>
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {emc.serviceTypes.slice(0, 3).map((s: string) => (
                                          <Badge key={s} className="bg-sky-500/10 text-sky-400 border-sky-500/20 text-[8px] py-0 px-1">{s}</Badge>
                                        ))}
                                      </div>
                                    </div>
                                  ))}
                              </div>
                              <Separator className="my-2 bg-slate-700" />
                              <h5 className="text-xs font-semibold text-amber-400 flex items-center gap-1">
                                <Building2 className="w-3 h-3" />
                                Hawaii IOUs & Utility Organizations
                              </h5>
                              {utilityPortalsData.hawaiiEMCs
                                .filter((emc: any) => emc.type === "support_org")
                                .map((org: any) => (
                                  <div key={org.name} className="border border-slate-700 rounded p-2">
                                    <div className="flex items-center justify-between gap-1">
                                      <h5 className="text-xs font-medium text-amber-300 leading-tight">{org.name}</h5>
                                      {org.website && (
                                        <Button size="sm" variant="ghost" className="h-5 text-[10px] text-blue-400 hover:text-blue-300 px-1" onClick={() => openPortalAssistant(org.website, org.name, "utility", org.description)}>
                                          <ExternalLink className="w-2.5 h-2.5" />
                                        </Button>
                                      )}
                                    </div>
                                    <p className="text-[10px] text-gray-500 mt-0.5">{org.description}</p>
                                  </div>
                                ))}
                            </div>
                          )}
                        </>
                      )}

                      {utilityPortalsData?.idahoEMCs?.length > 0 && (
                        <>
                          <Separator className="my-3 bg-slate-600" />
                          <div>
                            <Button
                              variant="ghost"
                              className="w-full justify-between text-sm font-semibold text-lime-400 hover:text-lime-300 p-0 h-auto"
                              onClick={() => setShowIdahoEMCs(!showIdahoEMCs)}
                            >
                              <span className="flex items-center gap-1">
                                <Zap className="w-4 h-4" />
                                Idaho Utilities ({utilityPortalsData.idahoEMCs.filter((e: any) => e.type === "emc").length} Cooperatives & Municipals)
                              </span>
                              {showIdahoEMCs ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </Button>
                            <p className="text-[10px] text-gray-500 mt-0.5">Idaho cooperatives & IOUs — wildfire, vegetation, storm, ROW</p>
                          </div>
                          {showIdahoEMCs && (
                            <div className="space-y-2 mt-2">
                              <Input
                                placeholder="Search Idaho utilities..."
                                value={idEmcSearchTerm}
                                onChange={(e) => setIdEmcSearchTerm(e.target.value)}
                                className="bg-slate-900/50 border-slate-600 text-white text-xs h-7"
                              />
                              <div className="max-h-[400px] overflow-y-auto space-y-1.5 pr-1">
                                {utilityPortalsData.idahoEMCs
                                  .filter((emc: any) => emc.type === "emc")
                                  .filter((emc: any) => !idEmcSearchTerm || emc.name.toLowerCase().includes(idEmcSearchTerm.toLowerCase()) || emc.description.toLowerCase().includes(idEmcSearchTerm.toLowerCase()))
                                  .map((emc: any) => (
                                    <div key={emc.name} className="border border-slate-700 rounded p-2 hover:border-lime-500/30 transition-colors">
                                      <div className="flex items-center justify-between gap-1">
                                        <h5 className="text-xs font-medium text-white leading-tight">{emc.name}</h5>
                                        {emc.website && (
                                          <Button size="sm" variant="ghost" className="h-5 text-[10px] text-blue-400 hover:text-blue-300 px-1" onClick={() => openPortalAssistant(emc.website, emc.name, "utility", emc.description)}>
                                            <ExternalLink className="w-2.5 h-2.5" />
                                          </Button>
                                        )}
                                      </div>
                                      <p className="text-[10px] text-gray-500 mt-0.5">{emc.description}</p>
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {emc.serviceTypes.slice(0, 3).map((s: string) => (
                                          <Badge key={s} className="bg-lime-500/10 text-lime-400 border-lime-500/20 text-[8px] py-0 px-1">{s}</Badge>
                                        ))}
                                      </div>
                                    </div>
                                  ))}
                              </div>
                              <Separator className="my-2 bg-slate-700" />
                              <h5 className="text-xs font-semibold text-amber-400 flex items-center gap-1">
                                <Building2 className="w-3 h-3" />
                                Idaho IOUs & Utility Organizations
                              </h5>
                              {utilityPortalsData.idahoEMCs
                                .filter((emc: any) => emc.type === "support_org")
                                .map((org: any) => (
                                  <div key={org.name} className="border border-slate-700 rounded p-2">
                                    <div className="flex items-center justify-between gap-1">
                                      <h5 className="text-xs font-medium text-amber-300 leading-tight">{org.name}</h5>
                                      {org.website && (
                                        <Button size="sm" variant="ghost" className="h-5 text-[10px] text-blue-400 hover:text-blue-300 px-1" onClick={() => openPortalAssistant(org.website, org.name, "utility", org.description)}>
                                          <ExternalLink className="w-2.5 h-2.5" />
                                        </Button>
                                      )}
                                    </div>
                                    <p className="text-[10px] text-gray-500 mt-0.5">{org.description}</p>
                                  </div>
                                ))}
                            </div>
                          )}
                        </>
                      )}

                      {utilityPortalsData?.illinoisEMCs?.length > 0 && (
                        <>
                          <Separator className="my-3 bg-slate-600" />
                          <div>
                            <Button
                              variant="ghost"
                              className="w-full justify-between text-sm font-semibold text-rose-400 hover:text-rose-300 p-0 h-auto"
                              onClick={() => setShowIllinoisEMCs(!showIllinoisEMCs)}
                            >
                              <span className="flex items-center gap-1">
                                <Zap className="w-4 h-4" />
                                Illinois Utilities ({utilityPortalsData.illinoisEMCs.filter((e: any) => e.type === "emc").length} Cooperatives & Municipals)
                              </span>
                              {showIllinoisEMCs ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </Button>
                            <p className="text-[10px] text-gray-500 mt-0.5">Illinois IOUs, cooperatives & municipal utilities — storm, vegetation</p>
                          </div>
                          {showIllinoisEMCs && (
                            <div className="space-y-2 mt-2">
                              <Input
                                placeholder="Search Illinois utilities..."
                                value={ilEmcSearchTerm}
                                onChange={(e) => setIlEmcSearchTerm(e.target.value)}
                                className="bg-slate-900/50 border-slate-600 text-white text-xs h-7"
                              />
                              <div className="max-h-[400px] overflow-y-auto space-y-1.5 pr-1">
                                {utilityPortalsData.illinoisEMCs
                                  .filter((emc: any) => emc.type === "emc")
                                  .filter((emc: any) => !ilEmcSearchTerm || emc.name.toLowerCase().includes(ilEmcSearchTerm.toLowerCase()) || emc.description.toLowerCase().includes(ilEmcSearchTerm.toLowerCase()))
                                  .map((emc: any) => (
                                    <div key={emc.name} className="border border-slate-700 rounded p-2 hover:border-rose-500/30 transition-colors">
                                      <div className="flex items-center justify-between gap-1">
                                        <h5 className="text-xs font-medium text-white leading-tight">{emc.name}</h5>
                                        {emc.website && (
                                          <Button size="sm" variant="ghost" className="h-5 text-[10px] text-blue-400 hover:text-blue-300 px-1" onClick={() => openPortalAssistant(emc.website, emc.name, "utility", emc.description)}>
                                            <ExternalLink className="w-2.5 h-2.5" />
                                          </Button>
                                        )}
                                      </div>
                                      <p className="text-[10px] text-gray-500 mt-0.5">{emc.description}</p>
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {emc.serviceTypes.slice(0, 3).map((s: string) => (
                                          <Badge key={s} className="bg-rose-500/10 text-rose-400 border-rose-500/20 text-[8px] py-0 px-1">{s}</Badge>
                                        ))}
                                      </div>
                                    </div>
                                  ))}
                              </div>
                              <Separator className="my-2 bg-slate-700" />
                              <h5 className="text-xs font-semibold text-amber-400 flex items-center gap-1">
                                <Building2 className="w-3 h-3" />
                                Illinois IOUs & Utility Organizations
                              </h5>
                              {utilityPortalsData.illinoisEMCs
                                .filter((emc: any) => emc.type === "support_org")
                                .map((org: any) => (
                                  <div key={org.name} className="border border-slate-700 rounded p-2">
                                    <div className="flex items-center justify-between gap-1">
                                      <h5 className="text-xs font-medium text-amber-300 leading-tight">{org.name}</h5>
                                      {org.website && (
                                        <Button size="sm" variant="ghost" className="h-5 text-[10px] text-blue-400 hover:text-blue-300 px-1" onClick={() => openPortalAssistant(org.website, org.name, "utility", org.description)}>
                                          <ExternalLink className="w-2.5 h-2.5" />
                                        </Button>
                                      )}
                                    </div>
                                    <p className="text-[10px] text-gray-500 mt-0.5">{org.description}</p>
                                  </div>
                                ))}
                            </div>
                          )}
                        </>
                      )}

                      {utilityPortalsData?.iowaEMCs?.length > 0 && (
                        <>
                          <Separator className="my-3 bg-slate-600" />
                          <div>
                            <Button variant="ghost" className="w-full justify-between text-sm font-semibold text-violet-400 hover:text-violet-300 p-0 h-auto" onClick={() => setShowIowaEMCs(!showIowaEMCs)}>
                              <span className="flex items-center gap-1">
                                <Zap className="w-4 h-4" />
                                Iowa Utilities ({utilityPortalsData.iowaEMCs.filter((e: any) => e.type === "emc").length} Cooperatives & Municipals)
                              </span>
                              {showIowaEMCs ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </Button>
                            <p className="text-[10px] text-gray-500 mt-0.5">Iowa cooperatives, IOUs & municipal utilities — storm, derecho, vegetation, ROW</p>
                          </div>
                          {showIowaEMCs && (
                            <div className="space-y-2 mt-2">
                              <Input placeholder="Search Iowa utilities..." value={iaEmcSearchTerm} onChange={(e) => setIaEmcSearchTerm(e.target.value)} className="bg-slate-900/50 border-slate-600 text-white text-xs h-7" />
                              <div className="max-h-[400px] overflow-y-auto space-y-1.5 pr-1">
                                {utilityPortalsData.iowaEMCs
                                  .filter((emc: any) => emc.type === "emc")
                                  .filter((emc: any) => !iaEmcSearchTerm || emc.name.toLowerCase().includes(iaEmcSearchTerm.toLowerCase()) || emc.description.toLowerCase().includes(iaEmcSearchTerm.toLowerCase()))
                                  .map((emc: any) => (
                                    <div key={emc.name} className="border border-slate-700 rounded p-2 hover:border-violet-500/30 transition-colors">
                                      <div className="flex items-center justify-between gap-1">
                                        <h5 className="text-xs font-medium text-white leading-tight">{emc.name}</h5>
                                        {emc.website && (<Button size="sm" variant="ghost" className="h-5 text-[10px] text-blue-400 hover:text-blue-300 px-1" onClick={() => openPortalAssistant(emc.website, emc.name, "utility", emc.description)}><ExternalLink className="w-2.5 h-2.5" /></Button>)}
                                      </div>
                                      <p className="text-[10px] text-gray-500 mt-0.5">{emc.description}</p>
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {emc.serviceTypes.slice(0, 3).map((s: string) => (<Badge key={s} className="bg-violet-500/10 text-violet-400 border-violet-500/20 text-[8px] py-0 px-1">{s}</Badge>))}
                                      </div>
                                    </div>
                                  ))}
                              </div>
                              <Separator className="my-2 bg-slate-700" />
                              <h5 className="text-xs font-semibold text-amber-400 flex items-center gap-1"><Building2 className="w-3 h-3" />Iowa IOUs & Utility Organizations</h5>
                              {utilityPortalsData.iowaEMCs.filter((emc: any) => emc.type === "support_org").map((org: any) => (
                                <div key={org.name} className="border border-slate-700 rounded p-2">
                                  <div className="flex items-center justify-between gap-1">
                                    <h5 className="text-xs font-medium text-amber-300 leading-tight">{org.name}</h5>
                                    {org.website && (<Button size="sm" variant="ghost" className="h-5 text-[10px] text-blue-400 hover:text-blue-300 px-1" onClick={() => openPortalAssistant(org.website, org.name, "utility", org.description)}><ExternalLink className="w-2.5 h-2.5" /></Button>)}
                                  </div>
                                  <p className="text-[10px] text-gray-500 mt-0.5">{org.description}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      )}

                      {utilityPortalsData?.kansasEMCs?.length > 0 && (
                        <>
                          <Separator className="my-3 bg-slate-600" />
                          <div>
                            <Button variant="ghost" className="w-full justify-between text-sm font-semibold text-amber-400 hover:text-amber-300 p-0 h-auto" onClick={() => setShowKansasEMCs(!showKansasEMCs)}>
                              <span className="flex items-center gap-1">
                                <Zap className="w-4 h-4" />
                                Kansas Utilities ({utilityPortalsData.kansasEMCs.filter((e: any) => e.type === "emc").length} Cooperatives & Municipals)
                              </span>
                              {showKansasEMCs ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </Button>
                            <p className="text-[10px] text-gray-500 mt-0.5">Kansas cooperatives, IOUs & municipal utilities — tornado, storm, vegetation, ROW</p>
                          </div>
                          {showKansasEMCs && (
                            <div className="space-y-2 mt-2">
                              <Input placeholder="Search Kansas utilities..." value={ksEmcSearchTerm} onChange={(e) => setKsEmcSearchTerm(e.target.value)} className="bg-slate-900/50 border-slate-600 text-white text-xs h-7" />
                              <div className="max-h-[400px] overflow-y-auto space-y-1.5 pr-1">
                                {utilityPortalsData.kansasEMCs
                                  .filter((emc: any) => emc.type === "emc")
                                  .filter((emc: any) => !ksEmcSearchTerm || emc.name.toLowerCase().includes(ksEmcSearchTerm.toLowerCase()) || emc.description.toLowerCase().includes(ksEmcSearchTerm.toLowerCase()))
                                  .map((emc: any) => (
                                    <div key={emc.name} className="border border-slate-700 rounded p-2 hover:border-amber-500/30 transition-colors">
                                      <div className="flex items-center justify-between gap-1">
                                        <h5 className="text-xs font-medium text-white leading-tight">{emc.name}</h5>
                                        {emc.website && (<Button size="sm" variant="ghost" className="h-5 text-[10px] text-blue-400 hover:text-blue-300 px-1" onClick={() => openPortalAssistant(emc.website, emc.name, "utility", emc.description)}><ExternalLink className="w-2.5 h-2.5" /></Button>)}
                                      </div>
                                      <p className="text-[10px] text-gray-500 mt-0.5">{emc.description}</p>
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {emc.serviceTypes.slice(0, 3).map((s: string) => (<Badge key={s} className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-[8px] py-0 px-1">{s}</Badge>))}
                                      </div>
                                    </div>
                                  ))}
                              </div>
                              <Separator className="my-2 bg-slate-700" />
                              <h5 className="text-xs font-semibold text-amber-400 flex items-center gap-1"><Building2 className="w-3 h-3" />Kansas IOUs & Utility Organizations</h5>
                              {utilityPortalsData.kansasEMCs.filter((emc: any) => emc.type === "support_org").map((org: any) => (
                                <div key={org.name} className="border border-slate-700 rounded p-2">
                                  <div className="flex items-center justify-between gap-1">
                                    <h5 className="text-xs font-medium text-amber-300 leading-tight">{org.name}</h5>
                                    {org.website && (<Button size="sm" variant="ghost" className="h-5 text-[10px] text-blue-400 hover:text-blue-300 px-1" onClick={() => openPortalAssistant(org.website, org.name, "utility", org.description)}><ExternalLink className="w-2.5 h-2.5" /></Button>)}
                                  </div>
                                  <p className="text-[10px] text-gray-500 mt-0.5">{org.description}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      )}

                      {utilityPortalsData?.kentuckyEMCs?.length > 0 && (
                        <>
                          <Separator className="my-3 bg-slate-600" />
                          <div>
                            <Button variant="ghost" className="w-full justify-between text-sm font-semibold text-blue-400 hover:text-blue-300 p-0 h-auto" onClick={() => setShowKentuckyEMCs(!showKentuckyEMCs)}>
                              <span className="flex items-center gap-1">
                                <Zap className="w-4 h-4" />
                                Kentucky Utilities ({utilityPortalsData.kentuckyEMCs.filter((e: any) => e.type === "emc").length} Cooperatives & Municipals)
                              </span>
                              {showKentuckyEMCs ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </Button>
                            <p className="text-[10px] text-gray-500 mt-0.5">Kentucky cooperatives, IOUs & municipal utilities — storm, tornado, ice storm, Appalachian terrain</p>
                          </div>
                          {showKentuckyEMCs && (
                            <div className="space-y-2 mt-2">
                              <Input placeholder="Search Kentucky utilities..." value={kyEmcSearchTerm} onChange={(e) => setKyEmcSearchTerm(e.target.value)} className="bg-slate-900/50 border-slate-600 text-white text-xs h-7" />
                              <div className="max-h-[400px] overflow-y-auto space-y-1.5 pr-1">
                                {utilityPortalsData.kentuckyEMCs
                                  .filter((emc: any) => emc.type === "emc")
                                  .filter((emc: any) => !kyEmcSearchTerm || emc.name.toLowerCase().includes(kyEmcSearchTerm.toLowerCase()) || emc.description.toLowerCase().includes(kyEmcSearchTerm.toLowerCase()))
                                  .map((emc: any) => (
                                    <div key={emc.name} className="border border-slate-700 rounded p-2 hover:border-blue-500/30 transition-colors">
                                      <div className="flex items-center justify-between gap-1">
                                        <h5 className="text-xs font-medium text-white leading-tight">{emc.name}</h5>
                                        {emc.website && (<Button size="sm" variant="ghost" className="h-5 text-[10px] text-blue-400 hover:text-blue-300 px-1" onClick={() => openPortalAssistant(emc.website, emc.name, "utility", emc.description)}><ExternalLink className="w-2.5 h-2.5" /></Button>)}
                                      </div>
                                      <p className="text-[10px] text-gray-500 mt-0.5">{emc.description}</p>
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {emc.serviceTypes.slice(0, 3).map((s: string) => (<Badge key={s} className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-[8px] py-0 px-1">{s}</Badge>))}
                                      </div>
                                    </div>
                                  ))}
                              </div>
                              <Separator className="my-2 bg-slate-700" />
                              <h5 className="text-xs font-semibold text-amber-400 flex items-center gap-1"><Building2 className="w-3 h-3" />Kentucky IOUs & Utility Organizations</h5>
                              {utilityPortalsData.kentuckyEMCs.filter((emc: any) => emc.type === "support_org").map((org: any) => (
                                <div key={org.name} className="border border-slate-700 rounded p-2">
                                  <div className="flex items-center justify-between gap-1">
                                    <h5 className="text-xs font-medium text-amber-300 leading-tight">{org.name}</h5>
                                    {org.website && (<Button size="sm" variant="ghost" className="h-5 text-[10px] text-blue-400 hover:text-blue-300 px-1" onClick={() => openPortalAssistant(org.website, org.name, "utility", org.description)}><ExternalLink className="w-2.5 h-2.5" /></Button>)}
                                  </div>
                                  <p className="text-[10px] text-gray-500 mt-0.5">{org.description}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      )}

                      {utilityPortalsData?.louisianaEMCs?.length > 0 && (
                        <>
                          <Separator className="my-3 bg-slate-600" />
                          <div>
                            <Button variant="ghost" className="w-full justify-between text-sm font-semibold text-orange-400 hover:text-orange-300 p-0 h-auto" onClick={() => setShowLouisianaEMCs(!showLouisianaEMCs)}>
                              <span className="flex items-center gap-1">
                                <Zap className="w-4 h-4" />
                                Louisiana Utilities ({utilityPortalsData.louisianaEMCs.filter((e: any) => e.type === "emc").length} Cooperatives & Municipals)
                              </span>
                              {showLouisianaEMCs ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </Button>
                            <p className="text-[10px] text-gray-500 mt-0.5">Louisiana cooperatives, IOUs & municipals — hurricane corridor, severe storms, coastal vulnerabilities</p>
                          </div>
                          {showLouisianaEMCs && (
                            <div className="space-y-2 mt-2">
                              <Input placeholder="Search Louisiana utilities..." value={laEmcSearchTerm} onChange={(e) => setLaEmcSearchTerm(e.target.value)} className="bg-slate-900/50 border-slate-600 text-white text-xs h-7" />
                              <div className="max-h-[400px] overflow-y-auto space-y-1.5 pr-1">
                                {utilityPortalsData.louisianaEMCs
                                  .filter((emc: any) => emc.type === "emc")
                                  .filter((emc: any) => !laEmcSearchTerm || emc.name.toLowerCase().includes(laEmcSearchTerm.toLowerCase()) || emc.description.toLowerCase().includes(laEmcSearchTerm.toLowerCase()))
                                  .map((emc: any) => (
                                    <div key={emc.name} className="border border-slate-700 rounded p-2 hover:border-orange-500/30 transition-colors">
                                      <div className="flex items-center justify-between gap-1">
                                        <h5 className="text-xs font-medium text-white leading-tight">{emc.name}</h5>
                                        {emc.website && (<Button size="sm" variant="ghost" className="h-5 text-[10px] text-blue-400 hover:text-blue-300 px-1" onClick={() => openPortalAssistant(emc.website, emc.name, "utility", emc.description)}><ExternalLink className="w-2.5 h-2.5" /></Button>)}
                                      </div>
                                      <p className="text-[10px] text-gray-500 mt-0.5">{emc.description}</p>
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {emc.serviceTypes.slice(0, 3).map((s: string) => (<Badge key={s} className="bg-orange-500/10 text-orange-400 border-orange-500/20 text-[8px] py-0 px-1">{s}</Badge>))}
                                      </div>
                                    </div>
                                  ))}
                              </div>
                              <Separator className="my-2 bg-slate-700" />
                              <h5 className="text-xs font-semibold text-amber-400 flex items-center gap-1"><Building2 className="w-3 h-3" />Louisiana IOUs & Utility Organizations</h5>
                              {utilityPortalsData.louisianaEMCs.filter((emc: any) => emc.type === "support_org").map((org: any) => (
                                <div key={org.name} className="border border-slate-700 rounded p-2">
                                  <div className="flex items-center justify-between gap-1">
                                    <h5 className="text-xs font-medium text-amber-300 leading-tight">{org.name}</h5>
                                    {org.website && (<Button size="sm" variant="ghost" className="h-5 text-[10px] text-blue-400 hover:text-blue-300 px-1" onClick={() => openPortalAssistant(org.website, org.name, "utility", org.description)}><ExternalLink className="w-2.5 h-2.5" /></Button>)}
                                  </div>
                                  <p className="text-[10px] text-gray-500 mt-0.5">{org.description}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      )}

                      {utilityPortalsData?.maineEMCs?.length > 0 && (
                        <>
                          <Separator className="my-3 bg-slate-600" />
                          <div>
                            <Button variant="ghost" className="w-full justify-between text-sm font-semibold text-teal-400 hover:text-teal-300 p-0 h-auto" onClick={() => setShowMaineEMCs(!showMaineEMCs)}>
                              <span className="flex items-center gap-1">
                                <Zap className="w-4 h-4" />
                                Maine Utilities ({utilityPortalsData.maineEMCs.filter((e: any) => e.type === "emc").length} Cooperatives & Municipals)
                              </span>
                              {showMaineEMCs ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </Button>
                            <p className="text-[10px] text-gray-500 mt-0.5">Maine cooperatives & municipals — nor'easters, ice storms, coastal wind, rural/forested terrain</p>
                          </div>
                          {showMaineEMCs && (
                            <div className="space-y-2 mt-2">
                              <Input placeholder="Search Maine utilities..." value={meEmcSearchTerm} onChange={(e) => setMeEmcSearchTerm(e.target.value)} className="bg-slate-900/50 border-slate-600 text-white text-xs h-7" />
                              <div className="max-h-[400px] overflow-y-auto space-y-1.5 pr-1">
                                {utilityPortalsData.maineEMCs
                                  .filter((emc: any) => emc.type === "emc")
                                  .filter((emc: any) => !meEmcSearchTerm || emc.name.toLowerCase().includes(meEmcSearchTerm.toLowerCase()) || emc.description.toLowerCase().includes(meEmcSearchTerm.toLowerCase()))
                                  .map((emc: any) => (
                                    <div key={emc.name} className="border border-slate-700 rounded p-2 hover:border-teal-500/30 transition-colors">
                                      <div className="flex items-center justify-between gap-1">
                                        <h5 className="text-xs font-medium text-white leading-tight">{emc.name}</h5>
                                        {emc.website && (<Button size="sm" variant="ghost" className="h-5 text-[10px] text-blue-400 hover:text-blue-300 px-1" onClick={() => openPortalAssistant(emc.website, emc.name, "utility", emc.description)}><ExternalLink className="w-2.5 h-2.5" /></Button>)}
                                      </div>
                                      <p className="text-[10px] text-gray-500 mt-0.5">{emc.description}</p>
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {emc.serviceTypes.slice(0, 3).map((s: string) => (<Badge key={s} className="bg-teal-500/10 text-teal-400 border-teal-500/20 text-[8px] py-0 px-1">{s}</Badge>))}
                                      </div>
                                    </div>
                                  ))}
                              </div>
                              <Separator className="my-2 bg-slate-700" />
                              <h5 className="text-xs font-semibold text-amber-400 flex items-center gap-1"><Building2 className="w-3 h-3" />Maine IOUs & Utility Organizations</h5>
                              {utilityPortalsData.maineEMCs.filter((emc: any) => emc.type === "support_org").map((org: any) => (
                                <div key={org.name} className="border border-slate-700 rounded p-2">
                                  <div className="flex items-center justify-between gap-1">
                                    <h5 className="text-xs font-medium text-amber-300 leading-tight">{org.name}</h5>
                                    {org.website && (<Button size="sm" variant="ghost" className="h-5 text-[10px] text-blue-400 hover:text-blue-300 px-1" onClick={() => openPortalAssistant(org.website, org.name, "utility", org.description)}><ExternalLink className="w-2.5 h-2.5" /></Button>)}
                                  </div>
                                  <p className="text-[10px] text-gray-500 mt-0.5">{org.description}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      )}

                      {utilityPortalsData?.marylandEMCs?.length > 0 && (
                        <>
                          <Separator className="my-3 bg-slate-600" />
                          <div>
                            <Button variant="ghost" className="w-full justify-between text-sm font-semibold text-red-400 hover:text-red-300 p-0 h-auto" onClick={() => setShowMarylandEMCs(!showMarylandEMCs)}>
                              <span className="flex items-center gap-1">
                                <Zap className="w-4 h-4" />
                                Maryland Utilities ({utilityPortalsData.marylandEMCs.filter((e: any) => e.type === "emc").length} Cooperatives & Municipals)
                              </span>
                              {showMarylandEMCs ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </Button>
                            <p className="text-[10px] text-gray-500 mt-0.5">Maryland cooperatives, IOUs & municipals — hurricanes, nor'easters, ice storms, mid-Atlantic weather</p>
                          </div>
                          {showMarylandEMCs && (
                            <div className="space-y-2 mt-2">
                              <Input placeholder="Search Maryland utilities..." value={mdEmcSearchTerm} onChange={(e) => setMdEmcSearchTerm(e.target.value)} className="bg-slate-900/50 border-slate-600 text-white text-xs h-7" />
                              <div className="max-h-[400px] overflow-y-auto space-y-1.5 pr-1">
                                {utilityPortalsData.marylandEMCs
                                  .filter((emc: any) => emc.type === "emc")
                                  .filter((emc: any) => !mdEmcSearchTerm || emc.name.toLowerCase().includes(mdEmcSearchTerm.toLowerCase()) || emc.description.toLowerCase().includes(mdEmcSearchTerm.toLowerCase()))
                                  .map((emc: any) => (
                                    <div key={emc.name} className="border border-slate-700 rounded p-2 hover:border-red-500/30 transition-colors">
                                      <div className="flex items-center justify-between gap-1">
                                        <h5 className="text-xs font-medium text-white leading-tight">{emc.name}</h5>
                                        {emc.website && (<Button size="sm" variant="ghost" className="h-5 text-[10px] text-blue-400 hover:text-blue-300 px-1" onClick={() => openPortalAssistant(emc.website, emc.name, "utility", emc.description)}><ExternalLink className="w-2.5 h-2.5" /></Button>)}
                                      </div>
                                      <p className="text-[10px] text-gray-500 mt-0.5">{emc.description}</p>
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {emc.serviceTypes.slice(0, 3).map((s: string) => (<Badge key={s} className="bg-red-500/10 text-red-400 border-red-500/20 text-[8px] py-0 px-1">{s}</Badge>))}
                                      </div>
                                    </div>
                                  ))}
                              </div>
                              <Separator className="my-2 bg-slate-700" />
                              <h5 className="text-xs font-semibold text-amber-400 flex items-center gap-1"><Building2 className="w-3 h-3" />Maryland IOUs & Utility Organizations</h5>
                              {utilityPortalsData.marylandEMCs.filter((emc: any) => emc.type === "support_org").map((org: any) => (
                                <div key={org.name} className="border border-slate-700 rounded p-2">
                                  <div className="flex items-center justify-between gap-1">
                                    <h5 className="text-xs font-medium text-amber-300 leading-tight">{org.name}</h5>
                                    {org.website && (<Button size="sm" variant="ghost" className="h-5 text-[10px] text-blue-400 hover:text-blue-300 px-1" onClick={() => openPortalAssistant(org.website, org.name, "utility", org.description)}><ExternalLink className="w-2.5 h-2.5" /></Button>)}
                                  </div>
                                  <p className="text-[10px] text-gray-500 mt-0.5">{org.description}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      )}

                      {utilityPortalsData?.massachusettsEMCs?.length > 0 && (
                        <>
                          <Separator className="my-3 bg-slate-600" />
                          <div>
                            <Button variant="ghost" className="w-full justify-between text-sm font-semibold text-indigo-400 hover:text-indigo-300 p-0 h-auto" onClick={() => setShowMassachusettsEMCs(!showMassachusettsEMCs)}>
                              <span className="flex items-center gap-1">
                                <Zap className="w-4 h-4" />
                                Massachusetts Utilities ({utilityPortalsData.massachusettsEMCs.filter((e: any) => e.type === "emc").length} Cooperatives & Municipals)
                              </span>
                              {showMassachusettsEMCs ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </Button>
                            <p className="text-[10px] text-gray-500 mt-0.5">Massachusetts municipals & IOUs — nor'easters, coastal storms, ice storms, dense urban territory</p>
                          </div>
                          {showMassachusettsEMCs && (
                            <div className="space-y-2 mt-2">
                              <Input placeholder="Search Massachusetts utilities..." value={maEmcSearchTerm} onChange={(e) => setMaEmcSearchTerm(e.target.value)} className="bg-slate-900/50 border-slate-600 text-white text-xs h-7" />
                              <div className="max-h-[400px] overflow-y-auto space-y-1.5 pr-1">
                                {utilityPortalsData.massachusettsEMCs
                                  .filter((emc: any) => emc.type === "emc")
                                  .filter((emc: any) => !maEmcSearchTerm || emc.name.toLowerCase().includes(maEmcSearchTerm.toLowerCase()) || emc.description.toLowerCase().includes(maEmcSearchTerm.toLowerCase()))
                                  .map((emc: any) => (
                                    <div key={emc.name} className="border border-slate-700 rounded p-2 hover:border-indigo-500/30 transition-colors">
                                      <div className="flex items-center justify-between gap-1">
                                        <h5 className="text-xs font-medium text-white leading-tight">{emc.name}</h5>
                                        {emc.website && (<Button size="sm" variant="ghost" className="h-5 text-[10px] text-blue-400 hover:text-blue-300 px-1" onClick={() => openPortalAssistant(emc.website, emc.name, "utility", emc.description)}><ExternalLink className="w-2.5 h-2.5" /></Button>)}
                                      </div>
                                      <p className="text-[10px] text-gray-500 mt-0.5">{emc.description}</p>
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {emc.serviceTypes.slice(0, 3).map((s: string) => (<Badge key={s} className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 text-[8px] py-0 px-1">{s}</Badge>))}
                                      </div>
                                    </div>
                                  ))}
                              </div>
                              <Separator className="my-2 bg-slate-700" />
                              <h5 className="text-xs font-semibold text-amber-400 flex items-center gap-1"><Building2 className="w-3 h-3" />Massachusetts IOUs & Utility Organizations</h5>
                              {utilityPortalsData.massachusettsEMCs.filter((emc: any) => emc.type === "support_org").map((org: any) => (
                                <div key={org.name} className="border border-slate-700 rounded p-2">
                                  <div className="flex items-center justify-between gap-1">
                                    <h5 className="text-xs font-medium text-amber-300 leading-tight">{org.name}</h5>
                                    {org.website && (<Button size="sm" variant="ghost" className="h-5 text-[10px] text-blue-400 hover:text-blue-300 px-1" onClick={() => openPortalAssistant(org.website, org.name, "utility", org.description)}><ExternalLink className="w-2.5 h-2.5" /></Button>)}
                                  </div>
                                  <p className="text-[10px] text-gray-500 mt-0.5">{org.description}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      )}

                      {utilityPortalsData?.michiganEMCs?.length > 0 && (
                        <>
                          <Separator className="my-3 bg-slate-600" />
                          <div>
                            <Button variant="ghost" className="w-full justify-between text-sm font-semibold text-emerald-400 hover:text-emerald-300 p-0 h-auto" onClick={() => setShowMichiganEMCs(!showMichiganEMCs)}>
                              <span className="flex items-center gap-1">
                                <Zap className="w-4 h-4" />
                                Michigan Utilities ({utilityPortalsData.michiganEMCs.filter((e: any) => e.type === "emc").length} Cooperatives & Municipals)
                              </span>
                              {showMichiganEMCs ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </Button>
                            <p className="text-[10px] text-gray-500 mt-0.5">Michigan cooperatives, IOUs & municipals — Great Lakes storms, heavy ice/snow, severe thunderstorms</p>
                          </div>
                          {showMichiganEMCs && (
                            <div className="space-y-2 mt-2">
                              <Input placeholder="Search Michigan utilities..." value={miEmcSearchTerm} onChange={(e) => setMiEmcSearchTerm(e.target.value)} className="bg-slate-900/50 border-slate-600 text-white text-xs h-7" />
                              <div className="max-h-[400px] overflow-y-auto space-y-1.5 pr-1">
                                {utilityPortalsData.michiganEMCs
                                  .filter((emc: any) => emc.type === "emc")
                                  .filter((emc: any) => !miEmcSearchTerm || emc.name.toLowerCase().includes(miEmcSearchTerm.toLowerCase()) || emc.description.toLowerCase().includes(miEmcSearchTerm.toLowerCase()))
                                  .map((emc: any) => (
                                    <div key={emc.name} className="border border-slate-700 rounded p-2 hover:border-emerald-500/30 transition-colors">
                                      <div className="flex items-center justify-between gap-1">
                                        <h5 className="text-xs font-medium text-white leading-tight">{emc.name}</h5>
                                        {emc.website && (<Button size="sm" variant="ghost" className="h-5 text-[10px] text-blue-400 hover:text-blue-300 px-1" onClick={() => openPortalAssistant(emc.website, emc.name, "utility", emc.description)}><ExternalLink className="w-2.5 h-2.5" /></Button>)}
                                      </div>
                                      <p className="text-[10px] text-gray-500 mt-0.5">{emc.description}</p>
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {emc.serviceTypes.slice(0, 3).map((s: string) => (<Badge key={s} className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[8px] py-0 px-1">{s}</Badge>))}
                                      </div>
                                    </div>
                                  ))}
                              </div>
                              <Separator className="my-2 bg-slate-700" />
                              <h5 className="text-xs font-semibold text-amber-400 flex items-center gap-1"><Building2 className="w-3 h-3" />Michigan IOUs & Utility Organizations</h5>
                              {utilityPortalsData.michiganEMCs.filter((emc: any) => emc.type === "support_org").map((org: any) => (
                                <div key={org.name} className="border border-slate-700 rounded p-2">
                                  <div className="flex items-center justify-between gap-1">
                                    <h5 className="text-xs font-medium text-amber-300 leading-tight">{org.name}</h5>
                                    {org.website && (<Button size="sm" variant="ghost" className="h-5 text-[10px] text-blue-400 hover:text-blue-300 px-1" onClick={() => openPortalAssistant(org.website, org.name, "utility", org.description)}><ExternalLink className="w-2.5 h-2.5" /></Button>)}
                                  </div>
                                  <p className="text-[10px] text-gray-500 mt-0.5">{org.description}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      )}

                      {utilityPortalsData?.minnesotaEMCs?.length > 0 && (
                        <>
                          <Separator className="my-3 bg-slate-600" />
                          <div>
                            <Button variant="ghost" className="w-full justify-between text-sm font-semibold text-sky-400 hover:text-sky-300 p-0 h-auto" onClick={() => setShowMinnesotaEMCs(!showMinnesotaEMCs)}>
                              <span className="flex items-center gap-1">
                                <Zap className="w-4 h-4" />
                                Minnesota Utilities ({utilityPortalsData.minnesotaEMCs.filter((e: any) => e.type === "emc").length} Cooperatives & Municipals)
                              </span>
                              {showMinnesotaEMCs ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </Button>
                            <p className="text-[10px] text-gray-500 mt-0.5">Minnesota cooperatives, IOUs & municipals — blizzards, ice storms, severe thunderstorms/tornadoes</p>
                          </div>
                          {showMinnesotaEMCs && (
                            <div className="space-y-2 mt-2">
                              <Input placeholder="Search Minnesota utilities..." value={mnEmcSearchTerm} onChange={(e) => setMnEmcSearchTerm(e.target.value)} className="bg-slate-900/50 border-slate-600 text-white text-xs h-7" />
                              <div className="max-h-[400px] overflow-y-auto space-y-1.5 pr-1">
                                {utilityPortalsData.minnesotaEMCs
                                  .filter((emc: any) => emc.type === "emc")
                                  .filter((emc: any) => !mnEmcSearchTerm || emc.name.toLowerCase().includes(mnEmcSearchTerm.toLowerCase()) || emc.description.toLowerCase().includes(mnEmcSearchTerm.toLowerCase()))
                                  .map((emc: any) => (
                                    <div key={emc.name} className="border border-slate-700 rounded p-2 hover:border-sky-500/30 transition-colors">
                                      <div className="flex items-center justify-between gap-1">
                                        <h5 className="text-xs font-medium text-white leading-tight">{emc.name}</h5>
                                        {emc.website && (<Button size="sm" variant="ghost" className="h-5 text-[10px] text-blue-400 hover:text-blue-300 px-1" onClick={() => openPortalAssistant(emc.website, emc.name, "utility", emc.description)}><ExternalLink className="w-2.5 h-2.5" /></Button>)}
                                      </div>
                                      <p className="text-[10px] text-gray-500 mt-0.5">{emc.description}</p>
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {emc.serviceTypes.slice(0, 3).map((s: string) => (<Badge key={s} className="bg-sky-500/10 text-sky-400 border-sky-500/20 text-[8px] py-0 px-1">{s}</Badge>))}
                                      </div>
                                    </div>
                                  ))}
                              </div>
                              <Separator className="my-2 bg-slate-700" />
                              <h5 className="text-xs font-semibold text-amber-400 flex items-center gap-1"><Building2 className="w-3 h-3" />Minnesota IOUs & Utility Organizations</h5>
                              {utilityPortalsData.minnesotaEMCs.filter((emc: any) => emc.type === "support_org").map((org: any) => (
                                <div key={org.name} className="border border-slate-700 rounded p-2">
                                  <div className="flex items-center justify-between gap-1">
                                    <h5 className="text-xs font-medium text-amber-300 leading-tight">{org.name}</h5>
                                    {org.website && (<Button size="sm" variant="ghost" className="h-5 text-[10px] text-blue-400 hover:text-blue-300 px-1" onClick={() => openPortalAssistant(org.website, org.name, "utility", org.description)}><ExternalLink className="w-2.5 h-2.5" /></Button>)}
                                  </div>
                                  <p className="text-[10px] text-gray-500 mt-0.5">{org.description}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      )}

                      {utilityPortalsData?.mississippiEMCs?.length > 0 && (
                        <>
                          <Separator className="my-3 bg-slate-600" />
                          <div>
                            <Button variant="ghost" className="w-full justify-between text-sm font-semibold text-purple-400 hover:text-purple-300 p-0 h-auto" onClick={() => setShowMississippiEMCs(!showMississippiEMCs)}>
                              <span className="flex items-center gap-1">
                                <Zap className="w-4 h-4" />
                                Mississippi Utilities ({utilityPortalsData.mississippiEMCs.filter((e: any) => e.type === "emc").length} Cooperatives & Municipals)
                              </span>
                              {showMississippiEMCs ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </Button>
                            <p className="text-[10px] text-gray-500 mt-0.5">Mississippi cooperatives & IOUs — hurricanes, tornadoes, severe storms, Gulf Coast flooding</p>
                          </div>
                          {showMississippiEMCs && (
                            <div className="space-y-2 mt-2">
                              <Input placeholder="Search Mississippi utilities..." value={msEmcSearchTerm} onChange={(e) => setMsEmcSearchTerm(e.target.value)} className="bg-slate-900/50 border-slate-600 text-white text-xs h-7" />
                              <div className="max-h-[400px] overflow-y-auto space-y-1.5 pr-1">
                                {utilityPortalsData.mississippiEMCs
                                  .filter((emc: any) => emc.type === "emc")
                                  .filter((emc: any) => !msEmcSearchTerm || emc.name.toLowerCase().includes(msEmcSearchTerm.toLowerCase()) || emc.description.toLowerCase().includes(msEmcSearchTerm.toLowerCase()))
                                  .map((emc: any) => (
                                    <div key={emc.name} className="border border-slate-700 rounded p-2 hover:border-purple-500/30 transition-colors">
                                      <div className="flex items-center justify-between gap-1">
                                        <h5 className="text-xs font-medium text-white leading-tight">{emc.name}</h5>
                                        {emc.website && (<Button size="sm" variant="ghost" className="h-5 text-[10px] text-blue-400 hover:text-blue-300 px-1" onClick={() => openPortalAssistant(emc.website, emc.name, "utility", emc.description)}><ExternalLink className="w-2.5 h-2.5" /></Button>)}
                                      </div>
                                      <p className="text-[10px] text-gray-500 mt-0.5">{emc.description}</p>
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {emc.serviceTypes.slice(0, 3).map((s: string) => (<Badge key={s} className="bg-purple-500/10 text-purple-400 border-purple-500/20 text-[8px] py-0 px-1">{s}</Badge>))}
                                      </div>
                                    </div>
                                  ))}
                              </div>
                              <Separator className="my-2 bg-slate-700" />
                              <h5 className="text-xs font-semibold text-amber-400 flex items-center gap-1"><Building2 className="w-3 h-3" />Mississippi IOUs & Utility Organizations</h5>
                              {utilityPortalsData.mississippiEMCs.filter((emc: any) => emc.type === "support_org").map((org: any) => (
                                <div key={org.name} className="border border-slate-700 rounded p-2">
                                  <div className="flex items-center justify-between gap-1">
                                    <h5 className="text-xs font-medium text-amber-300 leading-tight">{org.name}</h5>
                                    {org.website && (<Button size="sm" variant="ghost" className="h-5 text-[10px] text-blue-400 hover:text-blue-300 px-1" onClick={() => openPortalAssistant(org.website, org.name, "utility", org.description)}><ExternalLink className="w-2.5 h-2.5" /></Button>)}
                                  </div>
                                  <p className="text-[10px] text-gray-500 mt-0.5">{org.description}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      )}

                      {utilityPortalsData?.missouriEMCs?.length > 0 && (
                        <>
                          <Separator className="my-3 bg-slate-600" />
                          <div>
                            <Button variant="ghost" className="w-full justify-between text-sm font-semibold text-yellow-400 hover:text-yellow-300 p-0 h-auto" onClick={() => setShowMissouriEMCs(!showMissouriEMCs)}>
                              <span className="flex items-center gap-1">
                                <Zap className="w-4 h-4" />
                                Missouri Utilities ({utilityPortalsData.missouriEMCs.filter((e: any) => e.type === "emc").length} Cooperatives & Municipals)
                              </span>
                              {showMissouriEMCs ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </Button>
                            <p className="text-[10px] text-gray-500 mt-0.5">Missouri cooperatives, IOUs & municipals — Tornado Alley, severe storms, ice storms, river flooding</p>
                          </div>
                          {showMissouriEMCs && (
                            <div className="space-y-2 mt-2">
                              <Input placeholder="Search Missouri utilities..." value={moEmcSearchTerm} onChange={(e) => setMoEmcSearchTerm(e.target.value)} className="bg-slate-900/50 border-slate-600 text-white text-xs h-7" />
                              <div className="max-h-[400px] overflow-y-auto space-y-1.5 pr-1">
                                {utilityPortalsData.missouriEMCs
                                  .filter((emc: any) => emc.type === "emc")
                                  .filter((emc: any) => !moEmcSearchTerm || emc.name.toLowerCase().includes(moEmcSearchTerm.toLowerCase()) || emc.description.toLowerCase().includes(moEmcSearchTerm.toLowerCase()))
                                  .map((emc: any) => (
                                    <div key={emc.name} className="border border-slate-700 rounded p-2 hover:border-yellow-500/30 transition-colors">
                                      <div className="flex items-center justify-between gap-1">
                                        <h5 className="text-xs font-medium text-white leading-tight">{emc.name}</h5>
                                        {emc.website && (<Button size="sm" variant="ghost" className="h-5 text-[10px] text-blue-400 hover:text-blue-300 px-1" onClick={() => openPortalAssistant(emc.website, emc.name, "utility", emc.description)}><ExternalLink className="w-2.5 h-2.5" /></Button>)}
                                      </div>
                                      <p className="text-[10px] text-gray-500 mt-0.5">{emc.description}</p>
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {emc.serviceTypes.slice(0, 3).map((s: string) => (<Badge key={s} className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20 text-[8px] py-0 px-1">{s}</Badge>))}
                                      </div>
                                    </div>
                                  ))}
                              </div>
                              <Separator className="my-2 bg-slate-700" />
                              <h5 className="text-xs font-semibold text-amber-400 flex items-center gap-1"><Building2 className="w-3 h-3" />Missouri IOUs & Utility Organizations</h5>
                              {utilityPortalsData.missouriEMCs.filter((emc: any) => emc.type === "support_org").map((org: any) => (
                                <div key={org.name} className="border border-slate-700 rounded p-2">
                                  <div className="flex items-center justify-between gap-1">
                                    <h5 className="text-xs font-medium text-amber-300 leading-tight">{org.name}</h5>
                                    {org.website && (<Button size="sm" variant="ghost" className="h-5 text-[10px] text-blue-400 hover:text-blue-300 px-1" onClick={() => openPortalAssistant(org.website, org.name, "utility", org.description)}><ExternalLink className="w-2.5 h-2.5" /></Button>)}
                                  </div>
                                  <p className="text-[10px] text-gray-500 mt-0.5">{org.description}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      )}

                      {utilityPortalsData?.montanaEMCs?.length > 0 && (
                        <>
                          <Separator className="my-3 bg-slate-600" />
                          <div>
                            <Button variant="ghost" className="w-full justify-between text-sm font-semibold text-lime-400 hover:text-lime-300 p-0 h-auto" onClick={() => setShowMontanaEMCs(!showMontanaEMCs)}>
                              <span className="flex items-center gap-1">
                                <Zap className="w-4 h-4" />
                                Montana Utilities ({utilityPortalsData.montanaEMCs.filter((e: any) => e.type === "emc").length} Cooperatives & Municipals)
                              </span>
                              {showMontanaEMCs ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </Button>
                            <p className="text-[10px] text-gray-500 mt-0.5">Montana cooperatives & IOUs — extreme winter storms, wildfires, mountain terrain, high winds</p>
                          </div>
                          {showMontanaEMCs && (
                            <div className="space-y-2 mt-2">
                              <Input placeholder="Search Montana utilities..." value={mtEmcSearchTerm} onChange={(e) => setMtEmcSearchTerm(e.target.value)} className="bg-slate-900/50 border-slate-600 text-white text-xs h-7" />
                              <div className="max-h-[400px] overflow-y-auto space-y-1.5 pr-1">
                                {utilityPortalsData.montanaEMCs
                                  .filter((emc: any) => emc.type === "emc")
                                  .filter((emc: any) => !mtEmcSearchTerm || emc.name.toLowerCase().includes(mtEmcSearchTerm.toLowerCase()) || emc.description.toLowerCase().includes(mtEmcSearchTerm.toLowerCase()))
                                  .map((emc: any) => (
                                    <div key={emc.name} className="border border-slate-700 rounded p-2 hover:border-lime-500/30 transition-colors">
                                      <div className="flex items-center justify-between gap-1">
                                        <h5 className="text-xs font-medium text-white leading-tight">{emc.name}</h5>
                                        {emc.website && (<Button size="sm" variant="ghost" className="h-5 text-[10px] text-blue-400 hover:text-blue-300 px-1" onClick={() => openPortalAssistant(emc.website, emc.name, "utility", emc.description)}><ExternalLink className="w-2.5 h-2.5" /></Button>)}
                                      </div>
                                      <p className="text-[10px] text-gray-500 mt-0.5">{emc.description}</p>
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {emc.serviceTypes.slice(0, 3).map((s: string) => (<Badge key={s} className="bg-lime-500/10 text-lime-400 border-lime-500/20 text-[8px] py-0 px-1">{s}</Badge>))}
                                      </div>
                                    </div>
                                  ))}
                              </div>
                              <Separator className="my-2 bg-slate-700" />
                              <h5 className="text-xs font-semibold text-amber-400 flex items-center gap-1"><Building2 className="w-3 h-3" />Montana IOUs & Utility Organizations</h5>
                              {utilityPortalsData.montanaEMCs.filter((emc: any) => emc.type === "support_org").map((org: any) => (
                                <div key={org.name} className="border border-slate-700 rounded p-2">
                                  <div className="flex items-center justify-between gap-1">
                                    <h5 className="text-xs font-medium text-amber-300 leading-tight">{org.name}</h5>
                                    {org.website && (<Button size="sm" variant="ghost" className="h-5 text-[10px] text-blue-400 hover:text-blue-300 px-1" onClick={() => openPortalAssistant(org.website, org.name, "utility", org.description)}><ExternalLink className="w-2.5 h-2.5" /></Button>)}
                                  </div>
                                  <p className="text-[10px] text-gray-500 mt-0.5">{org.description}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      )}

                      {utilityPortalsData?.nebraskaEMCs?.length > 0 && (
                        <>
                          <Separator className="my-3 bg-slate-600" />
                          <div>
                            <Button variant="ghost" className="w-full justify-between text-sm font-semibold text-cyan-400 hover:text-cyan-300 p-0 h-auto" onClick={() => setShowNebraskaEMCs(!showNebraskaEMCs)}>
                              <span className="flex items-center gap-1">
                                <Zap className="w-4 h-4" />
                                Nebraska Utilities ({utilityPortalsData.nebraskaEMCs.filter((e: any) => e.type === "emc").length} Cooperatives & Municipals)
                              </span>
                              {showNebraskaEMCs ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </Button>
                            <p className="text-[10px] text-gray-500 mt-0.5">Nebraska public power districts & cooperatives — 100% public power state, tornadoes, blizzards</p>
                          </div>
                          {showNebraskaEMCs && (
                            <div className="space-y-2 mt-2">
                              <Input placeholder="Search Nebraska utilities..." value={neEmcSearchTerm} onChange={(e) => setNeEmcSearchTerm(e.target.value)} className="bg-slate-900/50 border-slate-600 text-white text-xs h-7" />
                              <div className="max-h-[400px] overflow-y-auto space-y-1.5 pr-1">
                                {utilityPortalsData.nebraskaEMCs
                                  .filter((emc: any) => emc.type === "emc")
                                  .filter((emc: any) => !neEmcSearchTerm || emc.name.toLowerCase().includes(neEmcSearchTerm.toLowerCase()) || emc.description.toLowerCase().includes(neEmcSearchTerm.toLowerCase()))
                                  .map((emc: any) => (
                                    <div key={emc.name} className="border border-slate-700 rounded p-2 hover:border-cyan-500/30 transition-colors">
                                      <div className="flex items-center justify-between gap-1">
                                        <h5 className="text-xs font-medium text-white leading-tight">{emc.name}</h5>
                                        {emc.website && (<Button size="sm" variant="ghost" className="h-5 text-[10px] text-blue-400 hover:text-blue-300 px-1" onClick={() => openPortalAssistant(emc.website, emc.name, "utility", emc.description)}><ExternalLink className="w-2.5 h-2.5" /></Button>)}
                                      </div>
                                      <p className="text-[10px] text-gray-500 mt-0.5">{emc.description}</p>
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {emc.serviceTypes.slice(0, 3).map((s: string) => (<Badge key={s} className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20 text-[8px] py-0 px-1">{s}</Badge>))}
                                      </div>
                                    </div>
                                  ))}
                              </div>
                              <Separator className="my-2 bg-slate-700" />
                              <h5 className="text-xs font-semibold text-amber-400 flex items-center gap-1"><Building2 className="w-3 h-3" />Nebraska IOUs & Utility Organizations</h5>
                              {utilityPortalsData.nebraskaEMCs.filter((emc: any) => emc.type === "support_org").map((org: any) => (
                                <div key={org.name} className="border border-slate-700 rounded p-2">
                                  <div className="flex items-center justify-between gap-1">
                                    <h5 className="text-xs font-medium text-amber-300 leading-tight">{org.name}</h5>
                                    {org.website && (<Button size="sm" variant="ghost" className="h-5 text-[10px] text-blue-400 hover:text-blue-300 px-1" onClick={() => openPortalAssistant(org.website, org.name, "utility", org.description)}><ExternalLink className="w-2.5 h-2.5" /></Button>)}
                                  </div>
                                  <p className="text-[10px] text-gray-500 mt-0.5">{org.description}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      )}

                      {utilityPortalsData?.nevadaEMCs?.length > 0 && (
                        <>
                          <Separator className="my-3 bg-slate-600" />
                          <div>
                            <Button variant="ghost" className="w-full justify-between text-sm font-semibold text-rose-400 hover:text-rose-300 p-0 h-auto" onClick={() => setShowNevadaEMCs(!showNevadaEMCs)}>
                              <span className="flex items-center gap-1">
                                <Zap className="w-4 h-4" />
                                Nevada Utilities ({utilityPortalsData.nevadaEMCs.filter((e: any) => e.type === "emc").length} Cooperatives & Municipals)
                              </span>
                              {showNevadaEMCs ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </Button>
                            <p className="text-[10px] text-gray-500 mt-0.5">Nevada utilities & cooperatives — extreme heat, desert conditions, wind events, flash flooding</p>
                          </div>
                          {showNevadaEMCs && (
                            <div className="space-y-2 mt-2">
                              <Input placeholder="Search Nevada utilities..." value={nvEmcSearchTerm} onChange={(e) => setNvEmcSearchTerm(e.target.value)} className="bg-slate-900/50 border-slate-600 text-white text-xs h-7" />
                              <div className="max-h-[400px] overflow-y-auto space-y-1.5 pr-1">
                                {utilityPortalsData.nevadaEMCs
                                  .filter((emc: any) => emc.type === "emc")
                                  .filter((emc: any) => !nvEmcSearchTerm || emc.name.toLowerCase().includes(nvEmcSearchTerm.toLowerCase()) || emc.description.toLowerCase().includes(nvEmcSearchTerm.toLowerCase()))
                                  .map((emc: any) => (
                                    <div key={emc.name} className="border border-slate-700 rounded p-2 hover:border-rose-500/30 transition-colors">
                                      <div className="flex items-center justify-between gap-1">
                                        <h5 className="text-xs font-medium text-white leading-tight">{emc.name}</h5>
                                        {emc.website && (<Button size="sm" variant="ghost" className="h-5 text-[10px] text-blue-400 hover:text-blue-300 px-1" onClick={() => openPortalAssistant(emc.website, emc.name, "utility", emc.description)}><ExternalLink className="w-2.5 h-2.5" /></Button>)}
                                      </div>
                                      <p className="text-[10px] text-gray-500 mt-0.5">{emc.description}</p>
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {emc.serviceTypes.slice(0, 3).map((s: string) => (<Badge key={s} className="bg-rose-500/10 text-rose-400 border-rose-500/20 text-[8px] py-0 px-1">{s}</Badge>))}
                                      </div>
                                    </div>
                                  ))}
                              </div>
                              <Separator className="my-2 bg-slate-700" />
                              <h5 className="text-xs font-semibold text-amber-400 flex items-center gap-1"><Building2 className="w-3 h-3" />Nevada IOUs & Utility Organizations</h5>
                              {utilityPortalsData.nevadaEMCs.filter((emc: any) => emc.type === "support_org").map((org: any) => (
                                <div key={org.name} className="border border-slate-700 rounded p-2">
                                  <div className="flex items-center justify-between gap-1">
                                    <h5 className="text-xs font-medium text-amber-300 leading-tight">{org.name}</h5>
                                    {org.website && (<Button size="sm" variant="ghost" className="h-5 text-[10px] text-blue-400 hover:text-blue-300 px-1" onClick={() => openPortalAssistant(org.website, org.name, "utility", org.description)}><ExternalLink className="w-2.5 h-2.5" /></Button>)}
                                  </div>
                                  <p className="text-[10px] text-gray-500 mt-0.5">{org.description}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      )}

                      {utilityPortalsData?.newHampshireEMCs?.length > 0 && (
                        <>
                          <Separator className="my-3 bg-slate-600" />
                          <div>
                            <Button variant="ghost" className="w-full justify-between text-sm font-semibold text-teal-400 hover:text-teal-300 p-0 h-auto" onClick={() => setShowNewHampshireEMCs(!showNewHampshireEMCs)}>
                              <span className="flex items-center gap-1">
                                <Zap className="w-4 h-4" />
                                New Hampshire Utilities ({utilityPortalsData.newHampshireEMCs.filter((e: any) => e.type === "emc").length} Utilities & Cooperatives)
                              </span>
                              {showNewHampshireEMCs ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </Button>
                            <p className="text-[10px] text-gray-500 mt-0.5">New Hampshire utilities & cooperatives — nor'easters, ice storms, heavy snow, high winds, coastal flooding</p>
                          </div>
                          {showNewHampshireEMCs && (
                            <div className="space-y-2 mt-2">
                              <Input placeholder="Search New Hampshire utilities..." value={nhEmcSearchTerm} onChange={(e) => setNhEmcSearchTerm(e.target.value)} className="bg-slate-900/50 border-slate-600 text-white text-xs h-7" />
                              <div className="max-h-[400px] overflow-y-auto space-y-1.5 pr-1">
                                {utilityPortalsData.newHampshireEMCs
                                  .filter((emc: any) => emc.type === "emc")
                                  .filter((emc: any) => !nhEmcSearchTerm || emc.name.toLowerCase().includes(nhEmcSearchTerm.toLowerCase()) || emc.description.toLowerCase().includes(nhEmcSearchTerm.toLowerCase()))
                                  .map((emc: any) => (
                                    <div key={emc.name} className="border border-slate-700 rounded p-2 hover:border-teal-500/30 transition-colors">
                                      <div className="flex items-center justify-between gap-1">
                                        <h5 className="text-xs font-medium text-white leading-tight">{emc.name}</h5>
                                        {emc.website && (<Button size="sm" variant="ghost" className="h-5 text-[10px] text-blue-400 hover:text-blue-300 px-1" onClick={() => openPortalAssistant(emc.website, emc.name, "utility", emc.description)}><ExternalLink className="w-2.5 h-2.5" /></Button>)}
                                      </div>
                                      <p className="text-[10px] text-gray-500 mt-0.5">{emc.description}</p>
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {emc.serviceTypes.slice(0, 3).map((s: string) => (<Badge key={s} className="bg-teal-500/10 text-teal-400 border-teal-500/20 text-[8px] py-0 px-1">{s}</Badge>))}
                                      </div>
                                    </div>
                                  ))}
                              </div>
                              <Separator className="my-2 bg-slate-700" />
                              <h5 className="text-xs font-semibold text-amber-400 flex items-center gap-1"><Building2 className="w-3 h-3" />New Hampshire State Resources & Organizations</h5>
                              {utilityPortalsData.newHampshireEMCs.filter((emc: any) => emc.type === "support_org").map((org: any) => (
                                <div key={org.name} className="border border-slate-700 rounded p-2">
                                  <div className="flex items-center justify-between gap-1">
                                    <h5 className="text-xs font-medium text-amber-300 leading-tight">{org.name}</h5>
                                    {org.website && (<Button size="sm" variant="ghost" className="h-5 text-[10px] text-blue-400 hover:text-blue-300 px-1" onClick={() => openPortalAssistant(org.website, org.name, "utility", org.description)}><ExternalLink className="w-2.5 h-2.5" /></Button>)}
                                  </div>
                                  <p className="text-[10px] text-gray-500 mt-0.5">{org.description}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      )}

                      {utilityPortalsData?.newJerseyEMCs?.length > 0 && (
                        <>
                          <Separator className="my-3 bg-slate-600" />
                          <div>
                            <Button variant="ghost" className="w-full justify-between text-sm font-semibold text-blue-400 hover:text-blue-300 p-0 h-auto" onClick={() => setShowNewJerseyEMCs(!showNewJerseyEMCs)}>
                              <span className="flex items-center gap-1">
                                <Zap className="w-4 h-4" />
                                New Jersey Utilities ({utilityPortalsData.newJerseyEMCs.filter((e: any) => e.type === "emc").length} Utilities & IOUs)
                              </span>
                              {showNewJerseyEMCs ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </Button>
                            <p className="text-[10px] text-gray-500 mt-0.5">New Jersey utilities — nor'easters, hurricanes, coastal flooding, severe thunderstorms</p>
                          </div>
                          {showNewJerseyEMCs && (
                            <div className="space-y-2 mt-2">
                              <Input placeholder="Search New Jersey utilities..." value={njEmcSearchTerm} onChange={(e) => setNjEmcSearchTerm(e.target.value)} className="bg-slate-900/50 border-slate-600 text-white text-xs h-7" />
                              <div className="max-h-[400px] overflow-y-auto space-y-1.5 pr-1">
                                {utilityPortalsData.newJerseyEMCs
                                  .filter((emc: any) => emc.type === "emc")
                                  .filter((emc: any) => !njEmcSearchTerm || emc.name.toLowerCase().includes(njEmcSearchTerm.toLowerCase()) || emc.description.toLowerCase().includes(njEmcSearchTerm.toLowerCase()))
                                  .map((emc: any) => (
                                    <div key={emc.name} className="border border-slate-700 rounded p-2 hover:border-blue-500/30 transition-colors">
                                      <div className="flex items-center justify-between gap-1">
                                        <h5 className="text-xs font-medium text-white leading-tight">{emc.name}</h5>
                                        {emc.website && (<Button size="sm" variant="ghost" className="h-5 text-[10px] text-blue-400 hover:text-blue-300 px-1" onClick={() => openPortalAssistant(emc.website, emc.name, "utility", emc.description)}><ExternalLink className="w-2.5 h-2.5" /></Button>)}
                                      </div>
                                      <p className="text-[10px] text-gray-500 mt-0.5">{emc.description}</p>
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {emc.serviceTypes.slice(0, 3).map((s: string) => (<Badge key={s} className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-[8px] py-0 px-1">{s}</Badge>))}
                                      </div>
                                    </div>
                                  ))}
                              </div>
                              <Separator className="my-2 bg-slate-700" />
                              <h5 className="text-xs font-semibold text-amber-400 flex items-center gap-1"><Building2 className="w-3 h-3" />New Jersey Regulatory & Organizations</h5>
                              {utilityPortalsData.newJerseyEMCs.filter((emc: any) => emc.type === "support_org").map((org: any) => (
                                <div key={org.name} className="border border-slate-700 rounded p-2">
                                  <div className="flex items-center justify-between gap-1">
                                    <h5 className="text-xs font-medium text-amber-300 leading-tight">{org.name}</h5>
                                    {org.website && (<Button size="sm" variant="ghost" className="h-5 text-[10px] text-blue-400 hover:text-blue-300 px-1" onClick={() => openPortalAssistant(org.website, org.name, "utility", org.description)}><ExternalLink className="w-2.5 h-2.5" /></Button>)}
                                  </div>
                                  <p className="text-[10px] text-gray-500 mt-0.5">{org.description}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      )}

                      {utilityPortalsData?.newMexicoEMCs?.length > 0 && (
                        <>
                          <Separator className="my-3 bg-slate-600" />
                          <div>
                            <Button variant="ghost" className="w-full justify-between text-sm font-semibold text-orange-400 hover:text-orange-300 p-0 h-auto" onClick={() => setShowNewMexicoEMCs(!showNewMexicoEMCs)}>
                              <span className="flex items-center gap-1">
                                <Zap className="w-4 h-4" />
                                New Mexico Utilities ({utilityPortalsData.newMexicoEMCs.filter((e: any) => e.type === "emc").length} Utilities & IOUs)
                              </span>
                              {showNewMexicoEMCs ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </Button>
                            <p className="text-[10px] text-gray-500 mt-0.5">New Mexico utilities & cooperatives — desert heat, wildfires, monsoons, high winds, flash flooding</p>
                          </div>
                          {showNewMexicoEMCs && (
                            <div className="space-y-2 mt-2">
                              <Input placeholder="Search New Mexico utilities..." value={nmEmcSearchTerm} onChange={(e) => setNmEmcSearchTerm(e.target.value)} className="bg-slate-900/50 border-slate-600 text-white text-xs h-7" />
                              <div className="max-h-[400px] overflow-y-auto space-y-1.5 pr-1">
                                {utilityPortalsData.newMexicoEMCs
                                  .filter((emc: any) => emc.type === "emc")
                                  .filter((emc: any) => !nmEmcSearchTerm || emc.name.toLowerCase().includes(nmEmcSearchTerm.toLowerCase()) || emc.description.toLowerCase().includes(nmEmcSearchTerm.toLowerCase()))
                                  .map((emc: any) => (
                                    <div key={emc.name} className="border border-slate-700 rounded p-2 hover:border-orange-500/30 transition-colors">
                                      <div className="flex items-center justify-between gap-1">
                                        <h5 className="text-xs font-medium text-white leading-tight">{emc.name}</h5>
                                        {emc.website && (<Button size="sm" variant="ghost" className="h-5 text-[10px] text-blue-400 hover:text-blue-300 px-1" onClick={() => openPortalAssistant(emc.website, emc.name, "utility", emc.description)}><ExternalLink className="w-2.5 h-2.5" /></Button>)}
                                      </div>
                                      <p className="text-[10px] text-gray-500 mt-0.5">{emc.description}</p>
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {emc.serviceTypes.slice(0, 3).map((s: string) => (<Badge key={s} className="bg-orange-500/10 text-orange-400 border-orange-500/20 text-[8px] py-0 px-1">{s}</Badge>))}
                                      </div>
                                    </div>
                                  ))}
                              </div>
                              <Separator className="my-2 bg-slate-700" />
                              <h5 className="text-xs font-semibold text-amber-400 flex items-center gap-1"><Building2 className="w-3 h-3" />New Mexico Cooperative Networks</h5>
                              {utilityPortalsData.newMexicoEMCs.filter((emc: any) => emc.type === "support_org").map((org: any) => (
                                <div key={org.name} className="border border-slate-700 rounded p-2">
                                  <div className="flex items-center justify-between gap-1">
                                    <h5 className="text-xs font-medium text-amber-300 leading-tight">{org.name}</h5>
                                    {org.website && (<Button size="sm" variant="ghost" className="h-5 text-[10px] text-blue-400 hover:text-blue-300 px-1" onClick={() => openPortalAssistant(org.website, org.name, "utility", org.description)}><ExternalLink className="w-2.5 h-2.5" /></Button>)}
                                  </div>
                                  <p className="text-[10px] text-gray-500 mt-0.5">{org.description}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      )}

                      {utilityPortalsData?.newYorkEMCs?.length > 0 && (
                        <>
                          <Separator className="my-3 bg-slate-600" />
                          <div>
                            <Button variant="ghost" className="w-full justify-between text-sm font-semibold text-violet-400 hover:text-violet-300 p-0 h-auto" onClick={() => setShowNewYorkEMCs(!showNewYorkEMCs)}>
                              <span className="flex items-center gap-1">
                                <Zap className="w-4 h-4" />
                                New York Utilities ({utilityPortalsData.newYorkEMCs.filter((e: any) => e.type === "emc").length} Utilities & IOUs)
                              </span>
                              {showNewYorkEMCs ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </Button>
                            <p className="text-[10px] text-gray-500 mt-0.5">New York utilities — nor'easters, hurricanes, ice storms, lake effect storms, heat waves</p>
                          </div>
                          {showNewYorkEMCs && (
                            <div className="space-y-2 mt-2">
                              <Input placeholder="Search New York utilities..." value={nyEmcSearchTerm} onChange={(e) => setNyEmcSearchTerm(e.target.value)} className="bg-slate-900/50 border-slate-600 text-white text-xs h-7" />
                              <div className="max-h-[400px] overflow-y-auto space-y-1.5 pr-1">
                                {utilityPortalsData.newYorkEMCs
                                  .filter((emc: any) => emc.type === "emc")
                                  .filter((emc: any) => !nyEmcSearchTerm || emc.name.toLowerCase().includes(nyEmcSearchTerm.toLowerCase()) || emc.description.toLowerCase().includes(nyEmcSearchTerm.toLowerCase()))
                                  .map((emc: any) => (
                                    <div key={emc.name} className="border border-slate-700 rounded p-2 hover:border-violet-500/30 transition-colors">
                                      <div className="flex items-center justify-between gap-1">
                                        <h5 className="text-xs font-medium text-white leading-tight">{emc.name}</h5>
                                        {emc.website && (<Button size="sm" variant="ghost" className="h-5 text-[10px] text-blue-400 hover:text-blue-300 px-1" onClick={() => openPortalAssistant(emc.website, emc.name, "utility", emc.description)}><ExternalLink className="w-2.5 h-2.5" /></Button>)}
                                      </div>
                                      <p className="text-[10px] text-gray-500 mt-0.5">{emc.description}</p>
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {emc.serviceTypes.slice(0, 3).map((s: string) => (<Badge key={s} className="bg-violet-500/10 text-violet-400 border-violet-500/20 text-[8px] py-0 px-1">{s}</Badge>))}
                                      </div>
                                    </div>
                                  ))}
                              </div>
                              <Separator className="my-2 bg-slate-700" />
                              <h5 className="text-xs font-semibold text-amber-400 flex items-center gap-1"><Building2 className="w-3 h-3" />New York State Power Organizations</h5>
                              {utilityPortalsData.newYorkEMCs.filter((emc: any) => emc.type === "support_org").map((org: any) => (
                                <div key={org.name} className="border border-slate-700 rounded p-2">
                                  <div className="flex items-center justify-between gap-1">
                                    <h5 className="text-xs font-medium text-amber-300 leading-tight">{org.name}</h5>
                                    {org.website && (<Button size="sm" variant="ghost" className="h-5 text-[10px] text-blue-400 hover:text-blue-300 px-1" onClick={() => openPortalAssistant(org.website, org.name, "utility", org.description)}><ExternalLink className="w-2.5 h-2.5" /></Button>)}
                                  </div>
                                  <p className="text-[10px] text-gray-500 mt-0.5">{org.description}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      )}

                      {utilityPortalsData?.northCarolinaEMCs?.length > 0 && (
                        <>
                          <Separator className="my-3 bg-slate-600" />
                          <div>
                            <Button variant="ghost" className="w-full justify-between text-sm font-semibold text-sky-400 hover:text-sky-300 p-0 h-auto" onClick={() => setShowNorthCarolinaEMCs(!showNorthCarolinaEMCs)}>
                              <span className="flex items-center gap-1">
                                <Zap className="w-4 h-4" />
                                North Carolina Utilities ({utilityPortalsData.northCarolinaEMCs.filter((e: any) => e.type === "emc").length} Utilities & IOUs)
                              </span>
                              {showNorthCarolinaEMCs ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </Button>
                            <p className="text-[10px] text-gray-500 mt-0.5">North Carolina utilities & cooperatives — hurricanes, severe thunderstorms, ice storms, tornadoes</p>
                          </div>
                          {showNorthCarolinaEMCs && (
                            <div className="space-y-2 mt-2">
                              <Input placeholder="Search North Carolina utilities..." value={ncEmcSearchTerm} onChange={(e) => setNcEmcSearchTerm(e.target.value)} className="bg-slate-900/50 border-slate-600 text-white text-xs h-7" />
                              <div className="max-h-[400px] overflow-y-auto space-y-1.5 pr-1">
                                {utilityPortalsData.northCarolinaEMCs
                                  .filter((emc: any) => emc.type === "emc")
                                  .filter((emc: any) => !ncEmcSearchTerm || emc.name.toLowerCase().includes(ncEmcSearchTerm.toLowerCase()) || emc.description.toLowerCase().includes(ncEmcSearchTerm.toLowerCase()))
                                  .map((emc: any) => (
                                    <div key={emc.name} className="border border-slate-700 rounded p-2 hover:border-sky-500/30 transition-colors">
                                      <div className="flex items-center justify-between gap-1">
                                        <h5 className="text-xs font-medium text-white leading-tight">{emc.name}</h5>
                                        {emc.website && (<Button size="sm" variant="ghost" className="h-5 text-[10px] text-blue-400 hover:text-blue-300 px-1" onClick={() => openPortalAssistant(emc.website, emc.name, "utility", emc.description)}><ExternalLink className="w-2.5 h-2.5" /></Button>)}
                                      </div>
                                      <p className="text-[10px] text-gray-500 mt-0.5">{emc.description}</p>
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {emc.serviceTypes.slice(0, 3).map((s: string) => (<Badge key={s} className="bg-sky-500/10 text-sky-400 border-sky-500/20 text-[8px] py-0 px-1">{s}</Badge>))}
                                      </div>
                                    </div>
                                  ))}
                              </div>
                              <Separator className="my-2 bg-slate-700" />
                              <h5 className="text-xs font-semibold text-amber-400 flex items-center gap-1"><Building2 className="w-3 h-3" />North Carolina Cooperative Networks</h5>
                              {utilityPortalsData.northCarolinaEMCs.filter((emc: any) => emc.type === "support_org").map((org: any) => (
                                <div key={org.name} className="border border-slate-700 rounded p-2">
                                  <div className="flex items-center justify-between gap-1">
                                    <h5 className="text-xs font-medium text-amber-300 leading-tight">{org.name}</h5>
                                    {org.website && (<Button size="sm" variant="ghost" className="h-5 text-[10px] text-blue-400 hover:text-blue-300 px-1" onClick={() => openPortalAssistant(org.website, org.name, "utility", org.description)}><ExternalLink className="w-2.5 h-2.5" /></Button>)}
                                  </div>
                                  <p className="text-[10px] text-gray-500 mt-0.5">{org.description}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      )}

                      {utilityPortalsData?.northDakotaEMCs?.length > 0 && (
                        <>
                          <Separator className="my-3 bg-slate-600" />
                          <div>
                            <Button variant="ghost" className="w-full justify-between text-sm font-semibold text-amber-400 hover:text-amber-300 p-0 h-auto" onClick={() => setShowNorthDakotaEMCs(!showNorthDakotaEMCs)}>
                              <span className="flex items-center gap-1">
                                <Zap className="w-4 h-4" />
                                North Dakota Utilities ({utilityPortalsData.northDakotaEMCs.filter((e: any) => e.type === "emc").length} Utilities & IOUs)
                              </span>
                              {showNorthDakotaEMCs ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </Button>
                            <p className="text-[10px] text-gray-500 mt-0.5">North Dakota utilities & cooperatives — extreme winter, blizzards, high winds, Tornado Alley</p>
                          </div>
                          {showNorthDakotaEMCs && (
                            <div className="space-y-2 mt-2">
                              <Input placeholder="Search North Dakota utilities..." value={ndEmcSearchTerm} onChange={(e) => setNdEmcSearchTerm(e.target.value)} className="bg-slate-900/50 border-slate-600 text-white text-xs h-7" />
                              <div className="max-h-[400px] overflow-y-auto space-y-1.5 pr-1">
                                {utilityPortalsData.northDakotaEMCs
                                  .filter((emc: any) => emc.type === "emc")
                                  .filter((emc: any) => !ndEmcSearchTerm || emc.name.toLowerCase().includes(ndEmcSearchTerm.toLowerCase()) || emc.description.toLowerCase().includes(ndEmcSearchTerm.toLowerCase()))
                                  .map((emc: any) => (
                                    <div key={emc.name} className="border border-slate-700 rounded p-2 hover:border-amber-500/30 transition-colors">
                                      <div className="flex items-center justify-between gap-1">
                                        <h5 className="text-xs font-medium text-white leading-tight">{emc.name}</h5>
                                        {emc.website && (<Button size="sm" variant="ghost" className="h-5 text-[10px] text-blue-400 hover:text-blue-300 px-1" onClick={() => openPortalAssistant(emc.website, emc.name, "utility", emc.description)}><ExternalLink className="w-2.5 h-2.5" /></Button>)}
                                      </div>
                                      <p className="text-[10px] text-gray-500 mt-0.5">{emc.description}</p>
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {emc.serviceTypes.slice(0, 3).map((s: string) => (<Badge key={s} className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-[8px] py-0 px-1">{s}</Badge>))}
                                      </div>
                                    </div>
                                  ))}
                              </div>
                              <Separator className="my-2 bg-slate-700" />
                              <h5 className="text-xs font-semibold text-amber-400 flex items-center gap-1"><Building2 className="w-3 h-3" />North Dakota Cooperative Associations</h5>
                              {utilityPortalsData.northDakotaEMCs.filter((emc: any) => emc.type === "support_org").map((org: any) => (
                                <div key={org.name} className="border border-slate-700 rounded p-2">
                                  <div className="flex items-center justify-between gap-1">
                                    <h5 className="text-xs font-medium text-amber-300 leading-tight">{org.name}</h5>
                                    {org.website && (<Button size="sm" variant="ghost" className="h-5 text-[10px] text-blue-400 hover:text-blue-300 px-1" onClick={() => openPortalAssistant(org.website, org.name, "utility", org.description)}><ExternalLink className="w-2.5 h-2.5" /></Button>)}
                                  </div>
                                  <p className="text-[10px] text-gray-500 mt-0.5">{org.description}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      )}

                      {utilityPortalsData?.texasEMCs?.length > 0 && (
                        <>
                          <Separator className="my-3 bg-slate-600" />
                          <div>
                            <Button variant="ghost" className="w-full justify-between text-sm font-semibold text-red-400 hover:text-red-300 p-0 h-auto" onClick={() => setShowTexasEMCs(!showTexasEMCs)}>
                              <span className="flex items-center gap-1">
                                <Zap className="w-4 h-4" />
                                Texas Utilities ({utilityPortalsData.texasEMCs.filter((e: any) => e.type === "emc").length} Utilities & IOUs)
                              </span>
                              {showTexasEMCs ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </Button>
                            <p className="text-[10px] text-gray-500 mt-0.5">Texas utilities & cooperatives — hurricanes, severe thunderstorms, tornadoes, extreme heat, ice storms</p>
                          </div>
                          {showTexasEMCs && (
                            <div className="space-y-2 mt-2">
                              <Input placeholder="Search Texas utilities..." value={txEmcSearchTerm} onChange={(e) => setTxEmcSearchTerm(e.target.value)} className="bg-slate-900/50 border-slate-600 text-white text-xs h-7" />
                              <div className="max-h-[400px] overflow-y-auto space-y-1.5 pr-1">
                                {utilityPortalsData.texasEMCs
                                  .filter((emc: any) => emc.type === "emc")
                                  .filter((emc: any) => !txEmcSearchTerm || emc.name.toLowerCase().includes(txEmcSearchTerm.toLowerCase()) || emc.description.toLowerCase().includes(txEmcSearchTerm.toLowerCase()))
                                  .map((emc: any) => (
                                    <div key={emc.name} className="border border-slate-700 rounded p-2 hover:border-red-500/30 transition-colors">
                                      <div className="flex items-center justify-between gap-1">
                                        <h5 className="text-xs font-medium text-white leading-tight">{emc.name}</h5>
                                        {emc.website && (<Button size="sm" variant="ghost" className="h-5 text-[10px] text-blue-400 hover:text-blue-300 px-1" onClick={() => openPortalAssistant(emc.website, emc.name, "utility", emc.description)}><ExternalLink className="w-2.5 h-2.5" /></Button>)}
                                      </div>
                                      <p className="text-[10px] text-gray-500 mt-0.5">{emc.description}</p>
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {emc.serviceTypes.slice(0, 3).map((s: string) => (<Badge key={s} className="bg-red-500/10 text-red-400 border-red-500/20 text-[8px] py-0 px-1">{s}</Badge>))}
                                      </div>
                                    </div>
                                  ))}
                              </div>
                              <Separator className="my-2 bg-slate-700" />
                              <h5 className="text-xs font-semibold text-amber-400 flex items-center gap-1"><Building2 className="w-3 h-3" />Texas State Organizations</h5>
                              {utilityPortalsData.texasEMCs.filter((emc: any) => emc.type === "support_org").map((org: any) => (
                                <div key={org.name} className="border border-slate-700 rounded p-2">
                                  <div className="flex items-center justify-between gap-1">
                                    <h5 className="text-xs font-medium text-amber-300 leading-tight">{org.name}</h5>
                                    {org.website && (<Button size="sm" variant="ghost" className="h-5 text-[10px] text-blue-400 hover:text-blue-300 px-1" onClick={() => openPortalAssistant(org.website, org.name, "utility", org.description)}><ExternalLink className="w-2.5 h-2.5" /></Button>)}
                                  </div>
                                  <p className="text-[10px] text-gray-500 mt-0.5">{org.description}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      )}

                      {utilityPortalsData?.dotVendorPortals?.length > 0 && (
                        <>
                          <Separator className="my-3 bg-yellow-600/50" />
                          <div>
                            <Button variant="ghost" className="w-full justify-between text-sm font-semibold text-yellow-400 hover:text-yellow-300 p-0 h-auto" onClick={() => setShowDotPortals(!showDotPortals)}>
                              <span className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                🚧 DOT Vendor Registration — All 50 States ({utilityPortalsData.dotVendorPortals.length} Portals)
                              </span>
                              {showDotPortals ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </Button>
                            <p className="text-[10px] text-gray-500 mt-0.5">State Department of Transportation vendor portals — register for road construction, debris removal, hauling, ROW clearing, bridge work</p>
                          </div>
                          {showDotPortals && (
                            <div className="space-y-2 mt-2">
                              <Input placeholder="Search DOT portals by state name..." value={dotSearchTerm} onChange={(e) => setDotSearchTerm(e.target.value)} className="bg-slate-900/50 border-yellow-600/30 text-white text-xs h-7" />
                              <div className="max-h-[500px] overflow-y-auto space-y-1.5 pr-1">
                                {utilityPortalsData.dotVendorPortals
                                  .filter((dot: any) => dot.stateCode === "US")
                                  .filter((dot: any) => !dotSearchTerm || dot.state.toLowerCase().includes(dotSearchTerm.toLowerCase()) || dot.name.toLowerCase().includes(dotSearchTerm.toLowerCase()))
                                  .map((dot: any) => (
                                    <div key={dot.stateCode} className="border border-yellow-600/40 rounded p-2 bg-yellow-500/5">
                                      <div className="flex items-center justify-between gap-1">
                                        <h5 className="text-xs font-bold text-yellow-300 leading-tight">⭐ {dot.name}</h5>
                                        <Button size="sm" variant="ghost" className="h-5 text-[10px] text-blue-400 hover:text-blue-300 px-1" onClick={() => openPortalAssistant(dot.website, dot.name, "dot_vendor", dot.description)}><ExternalLink className="w-2.5 h-2.5" /></Button>
                                      </div>
                                      <p className="text-[10px] text-gray-400 mt-0.5">{dot.description}</p>
                                    </div>
                                  ))}
                                <Separator className="my-2 bg-slate-700" />
                                <h5 className="text-xs font-semibold text-yellow-400 flex items-center gap-1"><MapPin className="w-3 h-3" />State DOT Portals (A-Z)</h5>
                                {utilityPortalsData.dotVendorPortals
                                  .filter((dot: any) => dot.stateCode !== "US")
                                  .filter((dot: any) => !dotSearchTerm || dot.state.toLowerCase().includes(dotSearchTerm.toLowerCase()) || dot.name.toLowerCase().includes(dotSearchTerm.toLowerCase()))
                                  .map((dot: any) => (
                                    <div key={dot.stateCode} className="border border-slate-700 rounded p-2 hover:border-yellow-500/30 transition-colors">
                                      <div className="flex items-center justify-between gap-1">
                                        <h5 className="text-xs font-medium text-white leading-tight">
                                          <span className="text-yellow-400 font-bold mr-1">{dot.stateCode}</span>
                                          {dot.name}
                                        </h5>
                                        <Button size="sm" variant="ghost" className="h-5 text-[10px] text-blue-400 hover:text-blue-300 px-1" onClick={() => openPortalAssistant(dot.website, dot.name, "dot_vendor", dot.description)}><ExternalLink className="w-2.5 h-2.5" /></Button>
                                      </div>
                                      <p className="text-[10px] text-gray-500 mt-0.5">{dot.description}</p>
                                    </div>
                                  ))}
                              </div>
                            </div>
                          )}
                        </>
                      )}

                      {utilityPortalsData?.forestryAgencies?.length > 0 && (
                        <>
                          <Separator className="my-3 bg-slate-600" />
                          <div>
                            <Button variant="ghost" className="w-full justify-between text-sm font-semibold text-emerald-400 hover:text-emerald-300 p-0 h-auto" onClick={() => setShowForestryAgencies(!showForestryAgencies)}>
                              <span className="flex items-center gap-1">
                                <Zap className="w-4 h-4" />
                                Forestry Agencies & Vegetation Gatekeepers ({utilityPortalsData.forestryAgencies.length})
                              </span>
                              {showForestryAgencies ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </Button>
                            <p className="text-[10px] text-gray-500 mt-0.5">State forestry commissions, utility vegetation managers & consulting foresters — the gatekeepers to utility work</p>
                          </div>
                          {showForestryAgencies && (
                            <div className="space-y-2 mt-2">
                              <Input placeholder="Search forestry agencies..." value={forestrySearchTerm} onChange={(e) => setForestrySearchTerm(e.target.value)} className="bg-slate-900/50 border-slate-600 text-white text-xs h-7" />
                              <div className="max-h-[400px] overflow-y-auto space-y-1.5 pr-1">
                                {utilityPortalsData.forestryAgencies
                                  .filter((a: any) => !forestrySearchTerm || a.name.toLowerCase().includes(forestrySearchTerm.toLowerCase()) || a.state.toLowerCase().includes(forestrySearchTerm.toLowerCase()) || a.description.toLowerCase().includes(forestrySearchTerm.toLowerCase()))
                                  .map((agency: any) => (
                                    <div key={agency.name} className="border border-slate-700 rounded p-2 hover:border-emerald-500/30 transition-colors">
                                      <div className="flex items-center justify-between gap-1">
                                        <h5 className="text-xs font-medium text-white leading-tight">{agency.name}</h5>
                                        <div className="flex items-center gap-1">
                                          <Badge className={`text-[8px] py-0 px-1 ${agency.type === 'federal' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : agency.type === 'state' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : agency.type === 'utility_veg' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' : 'bg-purple-500/10 text-purple-400 border-purple-500/20'}`}>
                                            {agency.type === 'federal' ? 'Federal' : agency.type === 'state' ? 'State' : agency.type === 'utility_veg' ? 'Utility Veg' : 'Consulting'}
                                          </Badge>
                                          <Badge className="bg-slate-500/10 text-slate-400 border-slate-500/20 text-[8px] py-0 px-1">{agency.state}</Badge>
                                          {agency.website && (
                                            <Button size="sm" variant="ghost" className="h-5 text-[10px] text-blue-400 hover:text-blue-300 px-1" onClick={() => openPortalAssistant(agency.website, agency.name, "forestry", agency.description)}>
                                              <ExternalLink className="w-2.5 h-2.5" />
                                            </Button>
                                          )}
                                        </div>
                                      </div>
                                      {agency.contact && <p className="text-[10px] text-emerald-300 mt-0.5">{agency.contact}{agency.title ? ` — ${agency.title}` : ''}</p>}
                                      {agency.phone && <p className="text-[10px] text-gray-400 mt-0.5">Phone: {agency.phone}</p>}
                                      {agency.email && <p className="text-[10px] text-gray-400">Email: {agency.email}</p>}
                                      <p className="text-[10px] text-gray-500 mt-0.5">{agency.description}</p>
                                    </div>
                                  ))}
                              </div>
                            </div>
                          )}
                        </>
                      )}

                      {utilityPortalsData?.stormPrimes?.length > 0 && (
                        <>
                          <Separator className="my-3 bg-slate-600" />
                          <div>
                            <Button variant="ghost" className="w-full justify-between text-sm font-semibold text-amber-400 hover:text-amber-300 p-0 h-auto" onClick={() => setShowStormPrimes(!showStormPrimes)}>
                              <span className="flex items-center gap-1">
                                <Zap className="w-4 h-4" />
                                Storm Primes & National Contractors ({utilityPortalsData.stormPrimes.length})
                              </span>
                              {showStormPrimes ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </Button>
                            <p className="text-[10px] text-gray-500 mt-0.5">National storm primes, utility vegetation contractors, co-op/municipal associations & procurement portals</p>
                          </div>
                          {showStormPrimes && (
                            <div className="space-y-2 mt-2">
                              <Input placeholder="Search storm primes..." value={stormPrimeSearchTerm} onChange={(e) => setStormPrimeSearchTerm(e.target.value)} className="bg-slate-900/50 border-slate-600 text-white text-xs h-7" />
                              <div className="max-h-[400px] overflow-y-auto space-y-1.5 pr-1">
                                {utilityPortalsData.stormPrimes
                                  .filter((p: any) => !stormPrimeSearchTerm || p.name.toLowerCase().includes(stormPrimeSearchTerm.toLowerCase()) || p.description.toLowerCase().includes(stormPrimeSearchTerm.toLowerCase()))
                                  .map((prime: any) => (
                                    <div key={prime.name} className="border border-slate-700 rounded p-2 hover:border-amber-500/30 transition-colors">
                                      <div className="flex items-center justify-between gap-1">
                                        <h5 className="text-xs font-medium text-white leading-tight">{prime.name}</h5>
                                        <div className="flex items-center gap-1">
                                          <Badge className={`text-[8px] py-0 px-1 ${prime.type === 'national_prime' ? 'bg-red-500/10 text-red-400 border-red-500/20' : prime.type === 'utility_prime' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : prime.type === 'national_association' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-green-500/10 text-green-400 border-green-500/20'}`}>
                                            {prime.type === 'national_prime' ? 'Storm Prime' : prime.type === 'utility_prime' ? 'Utility Prime' : prime.type === 'national_association' ? 'Association' : 'Portal'}
                                          </Badge>
                                          {prime.website && (
                                            <Button size="sm" variant="ghost" className="h-5 text-[10px] text-blue-400 hover:text-blue-300 px-1" onClick={() => openPortalAssistant(prime.website, prime.name, "storm_prime", prime.description)}>
                                              <ExternalLink className="w-2.5 h-2.5" />
                                            </Button>
                                          )}
                                        </div>
                                      </div>
                                      <p className="text-[10px] text-gray-500 mt-0.5">{prime.description}</p>
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {prime.specialties.slice(0, 4).map((s: string) => (
                                          <Badge key={s} className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-[8px] py-0 px-1">{s}</Badge>
                                        ))}
                                      </div>
                                    </div>
                                  ))}
                              </div>
                            </div>
                          )}
                        </>
                      )}

                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {utilitySubTab === "email" && (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Mail className="w-5 h-5 text-amber-400" />
                    AI Contractor Introduction Email Generator
                  </CardTitle>
                  <CardDescription>Draft a professional introduction email to send to a utility's vendor management department after registering</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-gray-300">Target Utility *</Label>
                      <Select value={utilEmailUtility} onValueChange={setUtilEmailUtility}>
                        <SelectTrigger className="bg-slate-900/50 border-slate-600 text-white">
                          <SelectValue placeholder="Select a utility..." />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-600 max-h-[300px]">
                          {(utilityPortalsData?.utilities || []).map((u: any) => (
                            <SelectItem key={u.name} value={u.name} className="text-white hover:bg-slate-700">
                              {u.name} — {u.stormPriority.toUpperCase()}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-gray-300">Company Name *</Label>
                      <Input value={utilEmailCompany} onChange={(e) => setUtilEmailCompany(e.target.value)} placeholder="Your Company LLC" className="bg-slate-900/50 border-slate-600 text-white" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-gray-300">Owner / Contact Name *</Label>
                      <Input value={utilEmailOwner} onChange={(e) => setUtilEmailOwner(e.target.value)} placeholder="John Smith" className="bg-slate-900/50 border-slate-600 text-white" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-gray-300">Location</Label>
                      <Input value={utilEmailLocation} onChange={(e) => setUtilEmailLocation(e.target.value)} placeholder="Tampa, FL" className="bg-slate-900/50 border-slate-600 text-white" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-gray-300">Certifications</Label>
                      <Input value={utilEmailCerts} onChange={(e) => setUtilEmailCerts(e.target.value)} placeholder="ISNetworld, SDVOSB, SAM Active" className="bg-slate-900/50 border-slate-600 text-white" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-gray-300">Core Capabilities</Label>
                      <Input value={utilEmailCaps} onChange={(e) => setUtilEmailCaps(e.target.value)} placeholder="Vegetation mgmt, storm debris, ROW clearing" className="bg-slate-900/50 border-slate-600 text-white" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-gray-300">Years Experience</Label>
                      <Input value={utilEmailYears} onChange={(e) => setUtilEmailYears(e.target.value)} placeholder="15" className="bg-slate-900/50 border-slate-600 text-white" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-gray-300">Crew Size</Label>
                      <Input value={utilEmailCrewSize} onChange={(e) => setUtilEmailCrewSize(e.target.value)} placeholder="25 field workers" className="bg-slate-900/50 border-slate-600 text-white" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-gray-300">Phone</Label>
                      <Input value={utilEmailPhone} onChange={(e) => setUtilEmailPhone(e.target.value)} placeholder="(555) 123-4567" className="bg-slate-900/50 border-slate-600 text-white" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-gray-300">Email</Label>
                      <Input value={utilEmailContact} onChange={(e) => setUtilEmailContact(e.target.value)} placeholder="info@company.com" className="bg-slate-900/50 border-slate-600 text-white" />
                    </div>
                  </div>

                  <Button
                    onClick={() => {
                      if (!utilEmailUtility || !utilEmailCompany || !utilEmailOwner) {
                        toast({ title: "Missing Info", description: "Target utility, company name, and owner name are required.", variant: "destructive" });
                        return;
                      }
                      utilEmailMutation.mutate({
                        companyInfo: {
                          companyName: utilEmailCompany,
                          ownerName: utilEmailOwner,
                          utilityName: utilEmailUtility,
                          certifications: utilEmailCerts ? utilEmailCerts.split(',').map(s => s.trim()) : [],
                          capabilities: utilEmailCaps ? utilEmailCaps.split(',').map(s => s.trim()) : [],
                          location: utilEmailLocation,
                          phone: utilEmailPhone,
                          email: utilEmailContact,
                          yearsExperience: utilEmailYears,
                          crewSize: utilEmailCrewSize,
                        }
                      });
                    }}
                    disabled={utilEmailMutation.isPending}
                    className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white"
                  >
                    {utilEmailMutation.isPending ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</>
                    ) : (
                      <><Mail className="w-4 h-4 mr-2" /> Generate Introduction Email</>
                    )}
                  </Button>

                  {generatedUtilEmail && (
                    <div className="space-y-4 mt-4">
                      <div className="bg-white rounded-lg p-6 text-black">
                        <div className="border-b border-gray-200 pb-3 mb-4">
                          <p className="text-sm text-gray-500">Subject:</p>
                          <p className="font-semibold">{generatedUtilEmail.subject}</p>
                        </div>
                        <div className="whitespace-pre-wrap text-sm leading-relaxed">{generatedUtilEmail.body}</div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(`Subject: ${generatedUtilEmail.subject}\n\n${generatedUtilEmail.body}`);
                            toast({ title: "Copied!", description: "Email copied to clipboard." });
                          }}
                          className="bg-emerald-600 hover:bg-emerald-700"
                        >
                          <Copy className="w-3 h-3 mr-2" />
                          Copy Email
                        </Button>
                      </div>
                      {generatedUtilEmail.tips.length > 0 && (
                        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
                          <h4 className="text-sm font-medium text-amber-400 mb-2">Follow-Up Tips</h4>
                          <ul className="space-y-1">
                            {generatedUtilEmail.tips.map((tip, i) => (
                              <li key={i} className="text-xs text-gray-300 flex items-start gap-2">
                                <ChevronRight className="w-3 h-3 text-amber-400 flex-shrink-0 mt-0.5" />
                                {tip}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {utilitySubTab === "tracking" && (
              <div className="space-y-6">
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-white flex items-center gap-2">
                          <Table2 className="w-5 h-5 text-emerald-400" />
                          Registration Tracking Sheet
                        </CardTitle>
                        <CardDescription>Every portal and registration you should be tracking</CardDescription>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (!trackingData) return;
                          let csv = "Category,Item,Priority,Status,Date,Notes\n";
                          csv += "\nUTILITY COMPANIES\n";
                          csv += "Name,States,Platform,Storm Priority,Status,Date Registered,Follow-Up Date,Notes\n";
                          trackingData.utilities.forEach(u => {
                            csv += `"${u.name}","${u.states}","${u.platform}","${u.stormPriority}","${u.status}","${u.dateRegistered}","${u.dateFollowUp}","${u.notes}"\n`;
                          });
                          csv += "\nVENDOR PLATFORMS\n";
                          csv += "Name,Cost,Priority,Status,Date Registered,Notes\n";
                          trackingData.platforms.forEach(p => {
                            csv += `"${p.name}","${p.cost}","${p.priority}","${p.status}","${p.dateRegistered}","${p.notes}"\n`;
                          });
                          csv += "\nREADINESS CHECKLIST\n";
                          csv += "Item,Category,Priority,Status,Date Completed,Notes\n";
                          trackingData.checklist.forEach(c => {
                            csv += `"${c.item}","${c.category}","${c.priority}","${c.status}","${c.dateCompleted}","${c.notes}"\n`;
                          });
                          const blob = new Blob([csv], { type: 'text/csv' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = 'utility_contractor_tracking_sheet.csv';
                          a.click();
                          URL.revokeObjectURL(url);
                          toast({ title: "Downloaded!", description: "Tracking sheet exported as CSV." });
                        }}
                        className="border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/20"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Export CSV
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {trackingLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider mb-3">Utility Company Registrations ({trackingData?.utilities?.length || 0})</h3>
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="border-b border-slate-700">
                                  <th className="text-left py-2 px-2 text-gray-400">Utility</th>
                                  <th className="text-left py-2 px-2 text-gray-400">States</th>
                                  <th className="text-left py-2 px-2 text-gray-400">Platform</th>
                                  <th className="text-left py-2 px-2 text-gray-400">Priority</th>
                                  <th className="text-left py-2 px-2 text-gray-400">Action</th>
                                </tr>
                              </thead>
                              <tbody>
                                {trackingData?.utilities?.map((u: any) => (
                                  <tr key={u.name} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                                    <td className="py-2 px-2 text-white font-medium">{u.name}</td>
                                    <td className="py-2 px-2 text-gray-300">{u.states}</td>
                                    <td className="py-2 px-2 text-gray-300">{u.platform}</td>
                                    <td className="py-2 px-2">
                                      <Badge className={
                                        u.stormPriority === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border-red-500/30 text-xs' :
                                        u.stormPriority === 'HIGH' ? 'bg-orange-500/20 text-orange-400 border-orange-500/30 text-xs' :
                                        'bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs'
                                      }>
                                        {u.stormPriority}
                                      </Badge>
                                    </td>
                                    <td className="py-2 px-2">
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-6 text-xs text-blue-400 hover:text-blue-300"
                                        onClick={() => openPortalAssistant(u.registrationUrl, u.name, "utility")}
                                      >
                                        <ExternalLink className="w-3 h-3 mr-1" />
                                        Register
                                      </Button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        <div>
                          <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-wider mb-3">Vendor Platforms ({trackingData?.platforms?.length || 0})</h3>
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="border-b border-slate-700">
                                  <th className="text-left py-2 px-2 text-gray-400">Platform</th>
                                  <th className="text-left py-2 px-2 text-gray-400">Cost</th>
                                  <th className="text-left py-2 px-2 text-gray-400">Priority</th>
                                  <th className="text-left py-2 px-2 text-gray-400">Action</th>
                                </tr>
                              </thead>
                              <tbody>
                                {trackingData?.platforms?.map((p: any) => (
                                  <tr key={p.name} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                                    <td className="py-2 px-2 text-white font-medium">{p.name}</td>
                                    <td className="py-2 px-2 text-amber-400">{p.cost}</td>
                                    <td className="py-2 px-2">
                                      <Badge className={
                                        p.priority === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border-red-500/30 text-xs' :
                                        p.priority === 'HIGH' ? 'bg-orange-500/20 text-orange-400 border-orange-500/30 text-xs' :
                                        'bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs'
                                      }>
                                        {p.priority}
                                      </Badge>
                                    </td>
                                    <td className="py-2 px-2">
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-6 text-xs text-blue-400 hover:text-blue-300"
                                        onClick={() => openPortalAssistant(p.url, p.name, "vendor_platform")}
                                      >
                                        <ExternalLink className="w-3 h-3 mr-1" />
                                        Visit
                                      </Button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        <div>
                          <h3 className="text-sm font-semibold text-amber-400 uppercase tracking-wider mb-3">Readiness Checklist ({trackingData?.checklist?.length || 0})</h3>
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="border-b border-slate-700">
                                  <th className="text-left py-2 px-2 text-gray-400">Item</th>
                                  <th className="text-left py-2 px-2 text-gray-400">Category</th>
                                  <th className="text-left py-2 px-2 text-gray-400">Priority</th>
                                </tr>
                              </thead>
                              <tbody>
                                {trackingData?.checklist?.map((c: any) => (
                                  <tr key={c.item} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                                    <td className="py-2 px-2 text-white">{c.item}</td>
                                    <td className="py-2 px-2 text-gray-300">{c.category}</td>
                                    <td className="py-2 px-2">
                                      <Badge className={
                                        c.priority === 'REQUIRED' ? 'bg-red-500/20 text-red-400 border-red-500/30 text-xs' :
                                        c.priority === 'HIGHLY RECOMMENDED' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs' :
                                        'bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs'
                                      }>
                                        {c.priority}
                                      </Badge>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* USACE OUTREACH TAB */}
          <TabsContent value="usace" className="space-y-6">
            <div className="bg-gradient-to-r from-red-900/30 to-orange-900/30 border border-red-500/30 rounded-xl p-5">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-red-500/20 rounded-xl">
                  <Flag className="w-8 h-8 text-red-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">USACE District Outreach Center</h2>
                  <p className="text-sm text-gray-300 mt-1">
                    U.S. Army Corps of Engineers districts manage storm debris, emergency contracting, and infrastructure work.
                    Each district operates independently — if you don't market directly to them, you are invisible.
                  </p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <Badge className="bg-red-500/20 text-red-300 border-red-500/30">IDIQ / ACI / MATOC Contracts</Badge>
                    <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30">Storm Debris</Badge>
                    <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">Emergency Response</Badge>
                    <Badge className="bg-green-500/20 text-green-300 border-green-500/30">Small Business Set-Asides</Badge>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <CardTitle className="text-white flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-red-400" />
                        Priority District Map — Storm Debris
                      </CardTitle>
                      <Select value={usaceFilter} onValueChange={setUsaceFilter}>
                        <SelectTrigger className="w-[200px] bg-slate-900/50 border-slate-600 text-white">
                          <SelectValue placeholder="Filter by division" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-600">
                          <SelectItem value="all" className="text-white hover:bg-slate-700">All Divisions</SelectItem>
                          <SelectItem value="critical" className="text-white hover:bg-slate-700">Critical Priority Only</SelectItem>
                          {usaceData?.divisions?.map((div: any) => (
                            <SelectItem key={div.name} value={div.name} className="text-white hover:bg-slate-700">{div.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <CardDescription>Districts ranked by storm debris contract volume and emergency activation frequency</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {usaceLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-8 h-8 animate-spin text-red-400" />
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {(usaceData?.districts || [])
                          .filter((d: any) => {
                            if (usaceFilter === "all") return true;
                            if (usaceFilter === "critical") return d.priority === "critical";
                            return d.division === usaceFilter;
                          })
                          .map((district: any, idx: number) => (
                          <div
                            key={district.code}
                            className={`border rounded-lg p-4 cursor-pointer transition-all ${
                              selectedDistrict === district.name
                                ? 'border-red-400 bg-red-900/20'
                                : 'border-slate-700 bg-slate-900/50 hover:border-slate-500'
                            }`}
                            onClick={() => setSelectedDistrict(district.name === selectedDistrict ? "" : district.name)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2">
                                  <span className="text-lg font-bold text-gray-500 w-8">#{idx + 1}</span>
                                  <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: district.divisionColor }}
                                  />
                                </div>
                                <div>
                                  <h4 className="font-medium text-white">{district.name}</h4>
                                  <p className="text-xs text-gray-400">{district.division} • {district.states.join(', ')}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <Badge className={
                                  district.priority === 'critical' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                                  district.priority === 'high' ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' :
                                  district.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                                  'bg-gray-500/20 text-gray-400 border-gray-500/30'
                                }>
                                  {district.priority.toUpperCase()}
                                </Badge>
                                <div className="text-right">
                                  <div className="text-sm font-bold text-white">{district.priorityScore}</div>
                                  <div className="text-xs text-gray-500">score</div>
                                </div>
                              </div>
                            </div>

                            {selectedDistrict === district.name && (
                              <div className="mt-4 pt-4 border-t border-slate-700 space-y-3">
                                <p className="text-sm text-gray-300">{district.stormRelevance}</p>
                                <div>
                                  <p className="text-xs text-gray-500 mb-1">Key Work Types:</p>
                                  <div className="flex flex-wrap gap-1">
                                    {district.keyWorkTypes.map((wt: string) => (
                                      <Badge key={wt} variant="outline" className="text-xs border-slate-600 text-gray-300">{wt}</Badge>
                                    ))}
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    onClick={(e) => { e.stopPropagation(); openPortalAssistant(district.url, district.name, "federal", district.stormRelevance); }}
                                    className="bg-blue-600 hover:bg-blue-700 text-white"
                                  >
                                    <ExternalLink className="w-3 h-3 mr-1" />
                                    Visit District
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedDistrict(district.name);
                                      setActiveTab("usace");
                                      const el = document.getElementById('usace-email-gen');
                                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                                    }}
                                    className="border-amber-500/30 text-amber-300 hover:bg-amber-500/10"
                                  >
                                    <Mail className="w-3 h-3 mr-1" />
                                    Draft Intro Email
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card id="usace-email-gen" className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Mail className="w-5 h-5 text-amber-400" />
                      AI Introduction Email Generator
                    </CardTitle>
                    <CardDescription>Draft a powerful introduction email to send to any USACE district's Small Business Office</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-gray-300">Target District</Label>
                        <Select value={selectedDistrict} onValueChange={setSelectedDistrict}>
                          <SelectTrigger className="bg-slate-900/50 border-slate-600 text-white">
                            <SelectValue placeholder="Select a district..." />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-800 border-slate-600 max-h-[300px]">
                            {(usaceData?.districts || []).map((d: any) => (
                              <SelectItem key={d.code} value={d.name} className="text-white hover:bg-slate-700">
                                {d.name} ({d.code}) — {d.priority.toUpperCase()}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-gray-300">Company Name *</Label>
                        <Input value={emailCompanyName} onChange={(e) => setEmailCompanyName(e.target.value)} placeholder="Strategic Land Management LLC" className="bg-slate-900/50 border-slate-600 text-white" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-gray-300">Owner / Contact Name *</Label>
                        <Input value={emailOwnerName} onChange={(e) => setEmailOwnerName(e.target.value)} placeholder="John Smith" className="bg-slate-900/50 border-slate-600 text-white" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-gray-300">Location</Label>
                        <Input value={emailLocation} onChange={(e) => setEmailLocation(e.target.value)} placeholder="Dallas, TX" className="bg-slate-900/50 border-slate-600 text-white" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-gray-300">Certifications</Label>
                        <Input value={emailCerts} onChange={(e) => setEmailCerts(e.target.value)} placeholder="SDVOSB, SAM Active, ISA Certified Arborist" className="bg-slate-900/50 border-slate-600 text-white" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-gray-300">Core Capabilities</Label>
                        <Input value={emailCapabilities} onChange={(e) => setEmailCapabilities(e.target.value)} placeholder="Storm debris removal, vegetation mgmt, emergency response" className="bg-slate-900/50 border-slate-600 text-white" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-gray-300">Phone</Label>
                        <Input value={emailPhone} onChange={(e) => setEmailPhone(e.target.value)} placeholder="(555) 123-4567" className="bg-slate-900/50 border-slate-600 text-white" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-gray-300">Email</Label>
                        <Input value={emailContactEmail} onChange={(e) => setEmailContactEmail(e.target.value)} placeholder="info@company.com" className="bg-slate-900/50 border-slate-600 text-white" />
                      </div>
                    </div>

                    <Button
                      onClick={() => {
                        if (!selectedDistrict || !emailCompanyName || !emailOwnerName) {
                          toast({ title: "Missing Info", description: "Please select a district and enter your company name and contact name.", variant: "destructive" });
                          return;
                        }
                        emailMutation.mutate({
                          districtName: selectedDistrict,
                          companyInfo: {
                            companyName: emailCompanyName,
                            ownerName: emailOwnerName,
                            certifications: emailCerts ? emailCerts.split(',').map(s => s.trim()) : undefined,
                            capabilities: emailCapabilities ? emailCapabilities.split(',').map(s => s.trim()) : undefined,
                            location: emailLocation || undefined,
                            phone: emailPhone || undefined,
                            email: emailContactEmail || undefined,
                          }
                        });
                      }}
                      disabled={emailMutation.isPending}
                      className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black font-semibold py-3"
                    >
                      {emailMutation.isPending ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating Email...</>
                      ) : (
                        <><Zap className="w-4 h-4 mr-2" /> Generate Introduction Email</>
                      )}
                    </Button>

                    {generatedEmail && (
                      <div className="mt-4 space-y-4">
                        <div className="bg-slate-900/70 border border-amber-500/30 rounded-xl p-5">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium text-amber-400">Generated Email</h4>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                navigator.clipboard.writeText(`Subject: ${generatedEmail.subject}\n\n${generatedEmail.body}`);
                                toast({ title: "Copied", description: "Email copied to clipboard" });
                              }}
                              className="border-amber-500/30 text-amber-300 hover:bg-amber-500/10"
                            >
                              <Copy className="w-3 h-3 mr-1" /> Copy
                            </Button>
                          </div>
                          <div className="space-y-3">
                            <div>
                              <p className="text-xs text-gray-500">Subject:</p>
                              <p className="text-white font-medium">{generatedEmail.subject}</p>
                            </div>
                            <Separator className="bg-slate-700" />
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Body:</p>
                              <div className="text-sm text-gray-200 whitespace-pre-wrap leading-relaxed">{generatedEmail.body}</div>
                            </div>
                          </div>
                        </div>
                        {generatedEmail.tips && generatedEmail.tips.length > 0 && (
                          <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                            <h5 className="text-sm font-medium text-blue-400 mb-2 flex items-center gap-2"><Lightbulb className="w-4 h-4" /> Strategic Tips</h5>
                            <ul className="space-y-1">
                              {generatedEmail.tips.map((tip, i) => (
                                <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                                  <CircleDot className="w-3 h-3 mt-1 text-blue-400 shrink-0" />
                                  {tip}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <FileText className="w-5 h-5 text-emerald-400" />
                      Federal Capability Statement Generator
                    </CardTitle>
                    <CardDescription>Create a professional one-page capability statement to attach to every district introduction</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-gray-300">Company Name *</Label>
                        <Input value={emailCompanyName} onChange={(e) => setEmailCompanyName(e.target.value)} placeholder="Strategic Land Management LLC" className="bg-slate-900/50 border-slate-600 text-white" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-gray-300">Owner Name *</Label>
                        <Input value={emailOwnerName} onChange={(e) => setEmailOwnerName(e.target.value)} placeholder="John Smith" className="bg-slate-900/50 border-slate-600 text-white" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-gray-300">NAICS Codes</Label>
                        <Input value={capNaics} onChange={(e) => setCapNaics(e.target.value)} placeholder="562119, 561730, 562910" className="bg-slate-900/50 border-slate-600 text-white" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-gray-300">Years in Business</Label>
                        <Input value={capYears} onChange={(e) => setCapYears(e.target.value)} placeholder="15" className="bg-slate-900/50 border-slate-600 text-white" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-gray-300">Certifications</Label>
                        <Input value={emailCerts} onChange={(e) => setEmailCerts(e.target.value)} placeholder="SDVOSB, SAM Active, ISA Certified" className="bg-slate-900/50 border-slate-600 text-white" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-gray-300">Bonding Capacity</Label>
                        <Input value={capBonding} onChange={(e) => setCapBonding(e.target.value)} placeholder="$5M aggregate" className="bg-slate-900/50 border-slate-600 text-white" />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label className="text-gray-300">Core Capabilities</Label>
                        <Input value={emailCapabilities} onChange={(e) => setEmailCapabilities(e.target.value)} placeholder="Storm debris removal, vegetation management, emergency response, ROW clearing" className="bg-slate-900/50 border-slate-600 text-white" />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label className="text-gray-300">Past Performance (separate with semicolons)</Label>
                        <Input value={capPastPerf} onChange={(e) => setCapPastPerf(e.target.value)} placeholder="Hurricane Ida debris removal - USACE Mobile; Tornado cleanup - FEMA Region IV" className="bg-slate-900/50 border-slate-600 text-white" />
                      </div>
                    </div>

                    <Button
                      onClick={() => {
                        if (!emailCompanyName || !emailOwnerName) {
                          toast({ title: "Missing Info", description: "Please enter your company name and owner name.", variant: "destructive" });
                          return;
                        }
                        capStatementMutation.mutate({
                          companyInfo: {
                            companyName: emailCompanyName,
                            ownerName: emailOwnerName,
                            certifications: emailCerts ? emailCerts.split(',').map(s => s.trim()) : undefined,
                            capabilities: emailCapabilities ? emailCapabilities.split(',').map(s => s.trim()) : undefined,
                            naicsCodes: capNaics ? capNaics.split(',').map(s => s.trim()) : undefined,
                            yearsInBusiness: capYears ? parseInt(capYears) : undefined,
                            bondingCapacity: capBonding || undefined,
                            pastPerformance: capPastPerf ? capPastPerf.split(';').map(s => s.trim()) : undefined,
                            location: emailLocation || undefined,
                            phone: emailPhone || undefined,
                            email: emailContactEmail || undefined,
                          }
                        });
                      }}
                      disabled={capStatementMutation.isPending}
                      className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-black font-semibold py-3"
                    >
                      {capStatementMutation.isPending ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</>
                      ) : (
                        <><FileText className="w-4 h-4 mr-2" /> Generate Capability Statement</>
                      )}
                    </Button>

                    {generatedCapStatement && (
                      <div className="mt-4 space-y-4">
                        <div className="bg-white text-black rounded-xl p-6 border-2 border-slate-300">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-slate-900">CAPABILITY STATEMENT</h3>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const text = Object.entries(generatedCapStatement.sections)
                                  .map(([key, val]) => `${key.replace(/([A-Z])/g, ' $1').toUpperCase()}\n${val}`)
                                  .join('\n\n');
                                navigator.clipboard.writeText(text);
                                toast({ title: "Copied", description: "Capability statement copied to clipboard" });
                              }}
                              className="border-slate-400 text-slate-700"
                            >
                              <Copy className="w-3 h-3 mr-1" /> Copy All
                            </Button>
                          </div>

                          <div className="border-b-2 border-red-600 mb-4" />

                          <div className="space-y-4 text-sm">
                            {generatedCapStatement.sections.companyOverview && (
                              <div>
                                <h4 className="font-bold text-red-700 border-b border-gray-300 pb-1 mb-2">COMPANY OVERVIEW</h4>
                                <p className="text-gray-800">{generatedCapStatement.sections.companyOverview}</p>
                              </div>
                            )}

                            {generatedCapStatement.sections.coreCompetencies && (
                              <div>
                                <h4 className="font-bold text-red-700 border-b border-gray-300 pb-1 mb-2">CORE COMPETENCIES</h4>
                                <div className="text-gray-800 whitespace-pre-wrap">{generatedCapStatement.sections.coreCompetencies}</div>
                              </div>
                            )}

                            {generatedCapStatement.sections.differentiators && (
                              <div>
                                <h4 className="font-bold text-red-700 border-b border-gray-300 pb-1 mb-2">DIFFERENTIATORS</h4>
                                <div className="text-gray-800 whitespace-pre-wrap">{generatedCapStatement.sections.differentiators}</div>
                              </div>
                            )}

                            {generatedCapStatement.sections.pastPerformance && (
                              <div>
                                <h4 className="font-bold text-red-700 border-b border-gray-300 pb-1 mb-2">PAST PERFORMANCE</h4>
                                <div className="text-gray-800 whitespace-pre-wrap">{generatedCapStatement.sections.pastPerformance}</div>
                              </div>
                            )}

                            {generatedCapStatement.sections.certifications && (
                              <div>
                                <h4 className="font-bold text-red-700 border-b border-gray-300 pb-1 mb-2">CERTIFICATIONS & REGISTRATIONS</h4>
                                <div className="text-gray-800 whitespace-pre-wrap">{generatedCapStatement.sections.certifications}</div>
                              </div>
                            )}

                            {generatedCapStatement.sections.contactBlock && (
                              <div>
                                <h4 className="font-bold text-red-700 border-b border-gray-300 pb-1 mb-2">CONTACT</h4>
                                <div className="text-gray-800 whitespace-pre-wrap">{generatedCapStatement.sections.contactBlock}</div>
                              </div>
                            )}
                          </div>
                        </div>

                        {generatedCapStatement.tips && generatedCapStatement.tips.length > 0 && (
                          <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-lg p-4">
                            <h5 className="text-sm font-medium text-emerald-400 mb-2 flex items-center gap-2"><Lightbulb className="w-4 h-4" /> Usage Tips</h5>
                            <ul className="space-y-1">
                              {generatedCapStatement.tips.map((tip, i) => (
                                <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                                  <CircleDot className="w-3 h-3 mt-1 text-emerald-400 shrink-0" />
                                  {tip}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white text-sm flex items-center gap-2">
                      <Star className="w-4 h-4 text-amber-400" />
                      Why Register With Districts?
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm text-gray-300">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                      <span>Makes you <strong className="text-white">visible</strong> to contracting officers</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                      <span>Gets you on <strong className="text-white">vendor lists</strong> before storms hit</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                      <span>Opens <strong className="text-white">subcontracting doors</strong> with major primes</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                      <span>Positions you for <strong className="text-white">IDIQ/MATOC awards</strong> issued before disasters</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                      <span>Small Business Specialists <strong className="text-white">advocate</strong> for you</span>
                    </div>
                    <div className="bg-amber-900/20 border border-amber-500/20 rounded p-3 mt-3">
                      <p className="text-xs text-amber-200 italic">"When a hurricane hits, districts activate contractors already in their system. If you're not registered, you don't get called."</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white text-sm flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-blue-400" />
                      Major Primes to Target
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-gray-400 mb-3">These primes regularly seek small business subcontractors through USACE districts:</p>
                    <div className="space-y-2">
                      {(usaceData?.majorPrimes || []).map((prime: string) => (
                        <div key={prime} className="flex items-center gap-2 text-sm">
                          <ArrowRight className="w-3 h-3 text-blue-400 shrink-0" />
                          <span className="text-gray-200">{prime}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white text-sm flex items-center gap-2">
                      <Globe className="w-4 h-4 text-green-400" />
                      USACE Resources
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start border-slate-600 text-gray-300 hover:bg-slate-700 text-xs"
                      onClick={() => openPortalAssistant("https://www.usace.army.mil/Business-With-Us/", "USACE - Doing Business With Us", "federal", "U.S. Army Corps of Engineers business portal")}
                    >
                      <ExternalLink className="w-3 h-3 mr-2" />
                      USACE "Doing Business With Us"
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start border-slate-600 text-gray-300 hover:bg-slate-700 text-xs"
                      onClick={() => openPortalAssistant("https://www.usace.army.mil/Business-With-Us/Small-Business/", "USACE - Small Business Program", "federal", "Small Business Program Office for USACE contracting")}
                    >
                      <ExternalLink className="w-3 h-3 mr-2" />
                      Small Business Program Office
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start border-slate-600 text-gray-300 hover:bg-slate-700 text-xs"
                      onClick={() => openPortalAssistant("https://sam.gov/opportunities", "SAM.gov — USACE Solicitations", "federal", "Search USACE contract solicitations on SAM.gov")}
                    >
                      <ExternalLink className="w-3 h-3 mr-2" />
                      SAM.gov — USACE Solicitations
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* INSIDER TIPS TAB */}
          <TabsContent value="tips" className="space-y-4">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-amber-400" />
                  Insider Bidding Tips
                </CardTitle>
                <CardDescription>Strategies most contractors don't know</CardDescription>
              </CardHeader>
              <CardContent>
                {tipsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {tips?.map((tip, idx) => (
                      <Card key={idx} className="bg-slate-900/50 border-slate-700">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-medium text-white">{tip.title}</h4>
                            <Badge className={getCategoryColor(tip.category)}>
                              {tip.category.replace("_", " ")}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-300 mb-3">{tip.tip}</p>
                          {tip.example && (
                            <div className="text-xs bg-amber-500/10 border border-amber-500/20 rounded p-2 text-amber-200">
                              <span className="font-medium">Example:</span> {tip.example}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* OPPORTUNITIES TAB */}
          <TabsContent value="opportunities" className="space-y-4">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Target className="w-5 h-5 text-amber-400" />
                      Bid Opportunities
                    </CardTitle>
                    <CardDescription>Active procurement opportunities matching your profile</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" className="border-amber-500/50 text-amber-400">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {!opportunities || opportunities.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <Target className="w-12 h-12 mx-auto mb-4 text-slate-600" />
                    <p>No active opportunities yet</p>
                    <p className="text-sm mt-2">Use the Procurement Portals tab to find opportunities, or ask Rachel to help you search</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {opportunities.map((opp: any) => (
                      <Card key={opp.id} className="bg-slate-900/50 border-slate-700">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium text-white">{opp.title}</h4>
                              <p className="text-sm text-gray-400">{opp.agency}</p>
                            </div>
                            <Badge variant={opp.status === "qualified" ? "default" : "secondary"}>
                              {opp.status}
                            </Badge>
                          </div>
                          {opp.estimatedValue && (
                            <p className="text-lg font-bold text-green-400 mt-2">
                              {formatCurrency(Number(opp.estimatedValue))}
                            </p>
                          )}
                          {opp.dueDate && (
                            <div className="flex items-center gap-2 mt-2 text-sm text-gray-400">
                              <Clock className="w-4 h-4" />
                              Due: {new Date(opp.dueDate).toLocaleDateString()}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* MY BIDS TAB */}
          <TabsContent value="submissions" className="space-y-4">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-amber-400" />
                  My Bid Submissions
                </CardTitle>
                <CardDescription>Track your submitted bids and their status</CardDescription>
              </CardHeader>
              <CardContent>
                {!submissions || submissions.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <FileText className="w-12 h-12 mx-auto mb-4 text-slate-600" />
                    <p>No bids submitted yet</p>
                    <p className="text-sm mt-2">Start by reviewing opportunities and creating your first bid</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {submissions.map((sub: any) => (
                      <Card key={sub.id} className="bg-slate-900/50 border-slate-700">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-sm text-gray-400">Bid #{sub.confirmationNumber || sub.id}</p>
                              <p className="font-medium text-white">{sub.bidDescription || "Bid Submission"}</p>
                            </div>
                            <Badge className={
                              sub.status === "won" ? "bg-green-500/20 text-green-400" :
                              sub.status === "lost" ? "bg-red-500/20 text-red-400" :
                              sub.status === "submitted" ? "bg-blue-500/20 text-blue-400" :
                              "bg-gray-500/20 text-gray-400"
                            }>
                              {sub.status === "won" && <CheckCircle2 className="w-3 h-3 mr-1" />}
                              {sub.status === "lost" && <AlertTriangle className="w-3 h-3 mr-1" />}
                              {sub.status}
                            </Badge>
                          </div>
                          {sub.bidAmount && (
                            <p className="text-lg font-bold text-amber-400 mt-2">
                              {formatCurrency(Number(sub.bidAmount))}
                            </p>
                          )}
                          {sub.submittedAt && (
                            <p className="text-sm text-gray-400 mt-1">
                              Submitted: {new Date(sub.submittedAt).toLocaleDateString()}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* CONTACTS TAB */}
          <TabsContent value="contacts" className="space-y-4">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-amber-400" />
                  Agency Contacts
                </CardTitle>
                <CardDescription>Manage your procurement officer contacts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-400">
                  <Building2 className="w-12 h-12 mx-auto mb-4 text-slate-600" />
                  <p>No contacts saved yet</p>
                  <p className="text-sm mt-2">Contacts will be saved automatically as you engage with opportunities</p>
                  <Button variant="outline" className="mt-4 border-amber-500/50 text-amber-400">
                    <Users className="w-4 h-4 mr-2" />
                    Add Contact
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TRUECOST TAB */}
          <TabsContent value="truecost" className="space-y-4">
            <TrueCostProfitSheet />
          </TabsContent>
        </Tabs>

        <Card className="mt-6 bg-slate-800/30 border-slate-700/50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-gray-400">
                <p className="font-medium text-gray-300 mb-1">Procurement Risk Disclosure</p>
                <p>
                  AI BidIntel Pro provides automated assistance for convenience only. Contract awards are determined by third-party agencies 
                  and are never guaranteed. You remain solely responsible for reviewing and approving all bid submissions. 
                  The platform is a Software-as-a-Service provider and does not act as a procurement agent.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={portalAssistantOpen} onOpenChange={setPortalAssistantOpen}>
        <DialogContent className="max-w-[95vw] w-[95vw] h-[90vh] max-h-[90vh] bg-slate-900 border-slate-700 p-0 gap-0">
          <DialogHeader className="px-4 py-3 border-b border-slate-700 bg-gradient-to-r from-amber-900/30 to-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-amber-500/20 rounded-lg">
                  <Navigation className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <DialogTitle className="text-white text-sm font-bold">{portalAssistantName}</DialogTitle>
                  <p className="text-[11px] text-gray-400 mt-0.5">{portalAssistantUrl}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" className="h-7 text-xs border-blue-500/50 text-blue-400 hover:bg-blue-500/20" onClick={() => window.open(portalAssistantUrl, '_blank')}>
                  <ExternalLink className="w-3 h-3 mr-1" />
                  Open in New Tab
                </Button>
              </div>
            </div>
          </DialogHeader>
          
          <div className="flex flex-1 overflow-hidden" style={{ height: 'calc(90vh - 60px)' }}>
            <div className="flex-1 flex flex-col border-r border-slate-700 bg-slate-950">
              {iframeLoading && !iframeLoadFailed && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-950 z-10">
                  <div className="text-center">
                    <Loader2 className="w-8 h-8 text-amber-400 animate-spin mx-auto mb-3" />
                    <p className="text-sm text-gray-400">Loading portal...</p>
                  </div>
                </div>
              )}
              
              {iframeLoadFailed ? (
                <div className="flex-1 flex items-center justify-center p-8">
                  <div className="text-center max-w-md">
                    <div className="p-4 bg-amber-500/10 rounded-xl mb-4 inline-block">
                      <Globe className="w-12 h-12 text-amber-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">Open Portal in New Tab</h3>
                    <p className="text-sm text-gray-400 mb-4">
                      This portal has security restrictions that prevent in-app viewing.
                      Click below to open it in a new browser tab.
                    </p>
                    <p className="text-sm text-amber-400 mb-4">
                      Rachel AI is still right here to help! Open the portal in a new tab and ask Rachel 
                      questions about the registration process, what documents you need, or how to fill out specific fields.
                    </p>
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => window.open(portalAssistantUrl, '_blank')}>
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Open Portal in New Tab
                    </Button>
                  </div>
                </div>
              ) : (
                <iframe
                  src={portalAssistantUrl}
                  className="w-full h-full border-0"
                  title={portalAssistantName}
                  sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-top-navigation"
                  onLoad={() => setIframeLoading(false)}
                  onError={() => {
                    setIframeLoadFailed(true);
                    setIframeLoading(false);
                  }}
                />
              )}
            </div>
            
            <div className="w-[400px] flex flex-col bg-slate-900">
              <div className="px-3 py-2 border-b border-slate-700 bg-gradient-to-r from-amber-900/20 to-slate-900">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center">
                    <MessageSquare className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Rachel — Portal Assistant</h4>
                    <p className="text-[10px] text-amber-400">I'll help you complete this registration</p>
                  </div>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {portalChatHistory.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[90%] rounded-lg px-3 py-2 text-xs leading-relaxed ${
                      msg.role === "user"
                        ? "bg-amber-600/30 text-white border border-amber-500/30"
                        : "bg-slate-800 text-gray-200 border border-slate-700"
                    }`}>
                      {msg.role === "assistant" ? renderMarkdown(msg.message) : msg.message}
                    </div>
                  </div>
                ))}
                {portalChatMutation.isPending && (
                  <div className="flex justify-start">
                    <div className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-gray-400 flex items-center gap-2">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Rachel is thinking...
                    </div>
                  </div>
                )}
                <div ref={portalChatEndRef} />
              </div>
              
              <div className="px-3 py-2 border-t border-slate-700 bg-slate-900/50">
                <div className="flex flex-wrap gap-1 mb-2">
                  {[
                    "How do I register here?",
                    "What documents do I need?",
                    "Walk me through the form",
                    "What certifications are required?",
                  ].map((q) => (
                    <Button key={q} size="sm" variant="ghost" className="h-6 text-[10px] text-amber-400 hover:bg-amber-500/10 px-2 border border-amber-500/20"
                      onClick={() => {
                        setPortalChatInput(q);
                        const userMessage: ChatMessage = { role: "user", message: q };
                        setPortalChatHistory((prev) => [...prev, userMessage]);
                        portalChatMutation.mutate({
                          message: q,
                          portalContext: {
                            portalName: portalAssistantName,
                            portalUrl: portalAssistantUrl,
                            portalType: portalAssistantType,
                            portalDescription: portalAssistantDesc,
                          },
                          generateAudio: enableVoice,
                        });
                        setPortalChatInput("");
                      }}>
                      {q}
                    </Button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={portalChatInput}
                    onChange={(e) => setPortalChatInput(e.target.value)}
                    onKeyDown={handlePortalChatKeyPress}
                    placeholder="Ask Rachel about this portal..."
                    className="bg-slate-800 border-slate-600 text-white text-xs h-8"
                  />
                  <Button size="sm" className="h-8 bg-amber-600 hover:bg-amber-700 px-3" onClick={handlePortalChatSend} disabled={portalChatMutation.isPending || !portalChatInput.trim()}>
                    <Send className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ModuleAIAssistant 
        moduleName="AI BidIntel Pro" 
        moduleContext="This is the AI BidIntel Pro procurement intelligence module. The user is a contractor looking for government and commercial bids. Help them find opportunities, understand procurement processes, complete forms like SAM.gov registration, SF-1449, and W-9, pricing strategy, proposal writing, compliance requirements, NAICS codes, certifications (SDVOSB, WOSB, HUBZone, 8a, DBE), and winning bids. Guide them to use the Procurement Portals tab for state-specific sites, BidNet Direct for county bids, and SAM.gov for federal contracts."
      />
    </div>
  );
}
