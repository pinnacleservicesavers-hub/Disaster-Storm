import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import ModuleGallery from "./pages/ModuleGallery";
import TopNav from "./components/TopNav";
import LandingPage from "./pages/LandingPage";

// Lazy-load all 17 module pages
const WeatherCenter = lazy(() => import("./modules/WeatherCenter"));
const StormPredictions = lazy(() => import("./modules/StormPredictions"));
const DeploymentMap = lazy(() => import("./pages/DeploymentMap"));
const TrafficCamWatcherModule = lazy(() => import("./modules/TrafficCamWatcherModule"));
const EyesInSky = lazy(() => import("./pages/EyesInSky"));
const DroneOperations = lazy(() => import("./modules/DroneOperations"));
const AIDamageDetection = lazy(() => import("./modules/AIDamageDetection"));
const Leads = lazy(() => import("./pages/Leads"));
const AILeadManagement = lazy(() => import("./pages/AILeadManagement"));
const VictimDashboard = lazy(() => import("./pages/VictimDashboard"));
const StormShare = lazy(() => import("./pages/StormShare"));
const DisasterEssentialsMarketplace = lazy(() => import("./pages/DisasterEssentialsMarketplace"));
const Customers = lazy(() => import("./pages/Customers"));
const Claims = lazy(() => import("./pages/Claims"));
const ContractorManagement = lazy(() => import("./pages/ContractorManagement"));
const ContractorPortal = lazy(() => import("./pages/ContractorPortal"));
const Legal = lazy(() => import("./pages/Legal"));
const BankingSettings = lazy(() => import("./pages/BankingSettings"));
const DisasterLens = lazy(() => import("./pages/DisasterLens"));
const XrayRealityModule = lazy(() => import("./modules/XrayRealityModule"));
const HazardDashboard = lazy(() => import("./pages/HazardDashboard"));
const DeploymentIntelligence = lazy(() => import("./pages/DeploymentIntelligence"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard").then(m => ({ default: m.AdminDashboard })));
const ZipStateAdmin = lazy(() => import("./pages/ZipStateAdmin").then(m => ({ default: m.ZipStateAdmin })));
const BulkFillStates = lazy(() => import("./pages/BulkFillStates").then(m => ({ default: m.BulkFillStates })));
const WelcomeTemplates = lazy(() => import("./pages/WelcomeTemplates").then(m => ({ default: m.WelcomeTemplates })));
const SMTPSettings = lazy(() => import("./pages/SMTPSettings").then(m => ({ default: m.SMTPSettings })));
const AuthStub = lazy(() => import("./pages/AuthStub"));
const ContractorJobs = lazy(() => import("./pages/ContractorJobs"));
const ContractorProfile = lazy(() => import("./pages/ContractorProfile"));
const HomeownerPortal = lazy(() => import("./pages/HomeownerPortal"));
const SignOut = lazy(() => import("./pages/SignOut"));
const Login = lazy(() => import("./pages/auth/Login"));
const AuthCallback = lazy(() => import("./pages/auth/Callback"));
const OIDCSettings = lazy(() => import("./pages/admin/OIDCSettings"));
const ContractorAlertsDashboard = lazy(() => import("./pages/ContractorAlertsDashboard"));
const SMSTestPage = lazy(() => import("./pages/SMSTestPage"));

// WorkHub Marketplace Pages
const WorkHubMarketplace = lazy(() => import("./pages/WorkHubMarketplace"));
const WorkHubCustomerPortal = lazy(() => import("./pages/WorkHubCustomerPortal"));
const WorkHubContractorDashboard = lazy(() => import("./pages/WorkHubContractorDashboard"));
const WorkHubScopeSnap = lazy(() => import("./pages/workhub/ScopeSnap"));
const WorkHubPriceWhisperer = lazy(() => import("./pages/workhub/PriceWhisperer"));
const WorkHubContractorMatch = lazy(() => import("./pages/workhub/ContractorMatch"));
const WorkHubCalendarSync = lazy(() => import("./pages/workhub/CalendarSync"));
const WorkHubJobFlow = lazy(() => import("./pages/workhub/JobFlow"));
const WorkHubMediaVault = lazy(() => import("./pages/workhub/MediaVault"));
const WorkHubCloseBot = lazy(() => import("./pages/workhub/CloseBot"));
const WorkHubPayStream = lazy(() => import("./pages/workhub/PayStream"));
const WorkHubReviewRocket = lazy(() => import("./pages/workhub/ReviewRocket"));
const WorkHubFairnessScore = lazy(() => import("./pages/workhub/FairnessScore"));
const WorkHubQuickFinance = lazy(() => import("./pages/workhub/QuickFinance"));
const WorkHubContentForge = lazy(() => import("./pages/workhub/ContentForge"));
const WorkHubPricingTiers = lazy(() => import("./pages/workhub/PricingTiers"));
const WorkHubPitchDeck = lazy(() => import("./pages/workhub/PitchDeck"));
const WorkHubAIAgentScripts = lazy(() => import("./pages/workhub/AIAgentScripts"));
const WorkHubLegalTerms = lazy(() => import("./pages/workhub/LegalTerms"));
const WorkHubLeadPipeline = lazy(() => import("./pages/workhub/LeadPipeline"));
const WorkHubJobSnap = lazy(() => import("./pages/workhub/JobSnap"));
const WorkHubAdminSubmissions = lazy(() => import("./pages/workhub/AdminSubmissions"));

// Loading indicator
function Loader() {
  return (
    <div className="w-full py-16 text-center text-white/70 bg-black min-h-screen flex items-center justify-center">
      <div className="animate-pulse inline-flex items-center gap-3 text-lg">
        <span className="w-3 h-3 rounded-full bg-[#00c2ff]"></span>
        Loading…
      </div>
    </div>
  );
}

// Route map used by the gallery buttons - All 17 modules
const galleryRoutes = {
  "weather":            { launch: "/weather" },
  "predictions":        { launch: "/prediction-dashboard" },
  "traffic-cam":        { launch: "/traffic-cam-watcher" },
  "eyes-sky":           { launch: "/eyes-in-the-sky" },
  "drone-ops":          { launch: "/drone-operation" },
  "ai-damage":          { launch: "/damage-detection" },
  "lead-mgmt":          { launch: "/leads" },
  "victim-portal":      { launch: "/victim/dashboard" },
  "stormshare":         { launch: "/stormshare" },
  "essentials":         { launch: "/disaster-essentials-marketplace" },
  "customer-hub":       { launch: "/customers" },
  "claims":             { launch: "/claims" },
  "contractor-cmd":     { launch: "/contractor-management" },
  "contractor-portal":  { launch: "/contractors" },
  "legal":              { launch: "/legal" },
  "disaster-lens":      { launch: "/disaster-lens" },
  "xray":               { launch: "/modules/xray-reality" },
};

export default function App() {
  return (
    <>
      {/* Top Navigation */}
      <TopNav />
      
      {/* All routes */}
      <Suspense fallback={<Loader />}>
        <Routes>
          {/* Landing Page - App Overview */}
          <Route path="/" element={<LandingPage />} />
          
          {/* Disaster Direct Dashboard - Module Gallery */}
          <Route path="/dashboard" element={
            <ModuleGallery 
              routes={galleryRoutes}
              onLaunch={(m) => console.log("🚀 Launch:", m.id, m.name)}
              onPreview={(m) => console.log("👁️ Preview:", m.id, m.name)}
              onDocs={(m) => console.log("📖 Docs:", m.id, m.name)}
            />
          } />

          {/* All 17 Module Routes */}
          <Route path="/weather" element={<WeatherCenter />} />
          <Route path="/prediction-dashboard" element={<StormPredictions />} />
          <Route path="/storm-predictions" element={<StormPredictions />} />
          <Route path="/deployment-map" element={<DeploymentMap />} />
          <Route path="/deployment-intelligence" element={<DeploymentIntelligence />} />
          <Route path="/traffic-cam-watcher" element={<TrafficCamWatcherModule />} />
          <Route path="/eyes-in-the-sky" element={<EyesInSky />} />
          <Route path="/drone-operation" element={<DroneOperations />} />
          <Route path="/damage-detection" element={<AIDamageDetection />} />
          <Route path="/ai-damage-detection" element={<AIDamageDetection />} />
          <Route path="/leads" element={<Leads />} />
          <Route path="/ai-leads" element={<AILeadManagement />} />
          <Route path="/victim/dashboard" element={<VictimDashboard />} />
          <Route path="/stormshare" element={<StormShare />} />
          <Route path="/disaster-essentials-marketplace" element={<DisasterEssentialsMarketplace />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/claims" element={<Claims />} />
          <Route path="/contractor-management" element={<ContractorManagement />} />
          <Route path="/contractors" element={<ContractorPortal />} />
          <Route path="/contractor-alerts" element={<ContractorAlertsDashboard />} />
          <Route path="/sms-test" element={<SMSTestPage />} />
          <Route path="/banking-settings" element={<BankingSettings />} />
          <Route path="/legal" element={<Legal />} />
          <Route path="/disaster-lens" element={<DisasterLens />} />
          <Route path="/modules/xray-reality" element={<XrayRealityModule />} />
          <Route path="/hazard-dashboard" element={<HazardDashboard />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/legal/zipmap" element={<ZipStateAdmin />} />
          <Route path="/admin/legal/welcome" element={<WelcomeTemplates />} />
          <Route path="/admin/jobs/fill-states" element={<BulkFillStates />} />
          <Route path="/admin/smtp" element={<SMTPSettings />} />
          <Route path="/admin/auth-stub" element={<AuthStub />} />
          
          {/* Contractor Portal */}
          <Route path="/contractor/jobs" element={<ContractorJobs />} />
          <Route path="/contractor/profile" element={<ContractorProfile />} />
          
          {/* Homeowner Portal */}
          <Route path="/homeowner" element={<HomeownerPortal />} />
          
          {/* Sign Out */}
          <Route path="/signout" element={<SignOut />} />
          
          {/* Auth Routes */}
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          
          {/* Admin Routes */}
          <Route path="/admin/oidc" element={<OIDCSettings />} />
          
          {/* WorkHub Marketplace Routes */}
          <Route path="/workhub" element={<WorkHubMarketplace />} />
          <Route path="/workhub/customer" element={<WorkHubCustomerPortal />} />
          <Route path="/workhub/contractor" element={<WorkHubContractorDashboard />} />
          <Route path="/workhub/scopesnap" element={<WorkHubScopeSnap />} />
          <Route path="/workhub/pricewhisperer" element={<WorkHubPriceWhisperer />} />
          <Route path="/workhub/contractormatch" element={<WorkHubContractorMatch />} />
          <Route path="/workhub/calendarsync" element={<WorkHubCalendarSync />} />
          <Route path="/workhub/jobflow" element={<WorkHubJobFlow />} />
          <Route path="/workhub/mediavault" element={<WorkHubMediaVault />} />
          <Route path="/workhub/closebot" element={<WorkHubCloseBot />} />
          <Route path="/workhub/paystream" element={<WorkHubPayStream />} />
          <Route path="/workhub/reviewrocket" element={<WorkHubReviewRocket />} />
          <Route path="/workhub/fairnessscore" element={<WorkHubFairnessScore />} />
          <Route path="/workhub/quickfinance" element={<WorkHubQuickFinance />} />
          <Route path="/workhub/contentforge" element={<WorkHubContentForge />} />
          <Route path="/workhub/pricing" element={<WorkHubPricingTiers />} />
          <Route path="/workhub/pitch" element={<WorkHubPitchDeck />} />
          <Route path="/workhub/scripts" element={<WorkHubAIAgentScripts />} />
          <Route path="/workhub/legal" element={<WorkHubLegalTerms />} />
          <Route path="/workhub/leadpipeline" element={<WorkHubLeadPipeline />} />
          <Route path="/workhub/jobsnap" element={<WorkHubJobSnap />} />
          <Route path="/workhub/admin/submissions" element={<WorkHubAdminSubmissions />} />
        </Routes>
      </Suspense>
    </>
  );
}
