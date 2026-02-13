import { lazy, Suspense, useEffect, useState } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import ModuleGallery from "./pages/ModuleGallery";
import TopNav from "./components/TopNav";
import LandingPage from "./pages/LandingPage";
import { getStoredUser, isHomeownerAllowedPath } from "./components/AuthGuard";

// Coming Soon page
const ComingSoon = lazy(() => import("./pages/ComingSoon"));

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
const AffiliateManagement = lazy(() => import("./pages/admin/AffiliateManagement"));
const ContractorLeadVault = lazy(() => import("./pages/ContractorLeadVault"));
const EnterpriseAuditLog = lazy(() => import("./pages/EnterpriseAuditLog"));
const BusinessAssessment = lazy(() => import("./pages/BusinessAssessment"));
const ImplementationPlaybooks = lazy(() => import("./pages/ImplementationPlaybooks"));
const MonitoringDashboard = lazy(() => import("./pages/MonitoringDashboard"));
const PaymentApprovals = lazy(() => import("./pages/PaymentApprovals"));
const ContractorAlertsDashboard = lazy(() => import("./pages/ContractorAlertsDashboard"));
const SMSTestPage = lazy(() => import("./pages/SMSTestPage"));
const Watchlist = lazy(() => import("./pages/Watchlist"));
const AIBidIntelPro = lazy(() => import("./pages/AIBidIntelPro"));
const TreeIncidentTracker = lazy(() => import("./pages/TreeIncidentTracker"));
const FemaAuditDashboard = lazy(() => import("./pages/FemaAuditDashboard"));

// Contractor Hub - Unified Dashboard
const ContractorHub = lazy(() => import("./pages/ContractorHub"));
const ContractorNotifications = lazy(() => import("./pages/ContractorNotifications"));

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
const WorkHubAutoRepairDiag = lazy(() => import("./pages/workhub/AutoRepairDiag"));
const WorkHubPricingTiers = lazy(() => import("./pages/workhub/PricingTiers"));
const WorkHubPitchDeck = lazy(() => import("./pages/workhub/PitchDeck"));
const WorkHubAIAgentScripts = lazy(() => import("./pages/workhub/AIAgentScripts"));
const WorkHubLegalTerms = lazy(() => import("./pages/workhub/LegalTerms"));
const WorkHubLeadPipeline = lazy(() => import("./pages/workhub/LeadPipeline"));
const WorkHubJobSnap = lazy(() => import("./pages/workhub/JobSnap"));
const WorkHubAdminSubmissions = lazy(() => import("./pages/workhub/AdminSubmissions"));
const WorkHubTermsOfService = lazy(() => import("./pages/WorkHubTermsOfService"));
const WorkHubContractorCRM = lazy(() => import("./pages/WorkHubContractorCRM"));
const WorkHubAdminPricing = lazy(() => import("./pages/WorkHubAdminPricing"));
const WorkHubContractorOnboarding = lazy(() => import("./pages/WorkHubContractorOnboarding"));

// Emergency Contractor Readiness Platform
const EmergencyContractorReadiness = lazy(() => import("./pages/EmergencyContractorReadiness"));

// CrewLink Exchange - National Workforce & Equipment Marketplace
const CrewLinkExchange = lazy(() => import("./pages/CrewLinkExchange"));

// Contractor Pricing Page
const ContractorPricing = lazy(() => import("./pages/ContractorPricing"));

// Legal & Trust Pages (Public)
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const Disclaimers = lazy(() => import("./pages/Disclaimers"));
const TrustedDataSources = lazy(() => import("./pages/TrustedDataSources"));
const SecurityTrust = lazy(() => import("./pages/SecurityTrust"));

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
  "bidintel-pro":       { launch: "/bidintel-pro" },
};

// Route guard component for protected routes
function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) {
  const user = getStoredUser();
  const location = useLocation();
  
  // If not logged in, redirect to login
  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }
  
  // If homeowner, only allow specific routes
  if (user.role === 'homeowner' && !isHomeownerAllowedPath(location.pathname)) {
    return <Navigate to="/homeowner" replace />;
  }
  
  // If specific roles required, check role
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === 'homeowner') {
      return <Navigate to="/homeowner" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
}

export default function App() {
  const user = getStoredUser();
  const location = useLocation();
  
  // Public routes that don't need auth
  const isPublicRoute = ['/', '/auth/login', '/auth/callback', '/pricing', '/workhub/customer', '/privacy', '/terms', '/disclaimers', '/data-sources', '/security'].includes(location.pathname);
  
  // Show TopNav only for authenticated users
  const showNav = user && !isPublicRoute;
  
  return (
    <>
      {/* Top Navigation - only show when logged in */}
      {showNav && <TopNav />}
      
      {/* All routes */}
      <Suspense fallback={<Loader />}>
        <Routes>
          {/* Public Landing Page with Customer Help */}
          <Route path="/" element={<LandingPage />} />
          
          {/* Auth Routes - Public */}
          <Route path="/auth/login" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/pricing" element={<ContractorPricing />} />
          
          {/* Legal & Trust Pages - Public (Required for App Store, Google Play, and Legal Compliance) */}
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/disclaimers" element={<Disclaimers />} />
          <Route path="/data-sources" element={<TrustedDataSources />} />
          <Route path="/security" element={<SecurityTrust />} />
          
          {/* Disaster Direct Dashboard - Protected */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <ModuleGallery 
                routes={galleryRoutes}
                onLaunch={(m) => console.log("🚀 Launch:", m.id, m.name)}
                onPreview={(m) => console.log("👁️ Preview:", m.id, m.name)}
                onDocs={(m) => console.log("📖 Docs:", m.id, m.name)}
              />
            </ProtectedRoute>
          } />

          {/* Protected Module Routes - Contractor/Admin only */}
          <Route path="/weather" element={<ProtectedRoute><WeatherCenter /></ProtectedRoute>} />
          <Route path="/prediction-dashboard" element={<ProtectedRoute><StormPredictions /></ProtectedRoute>} />
          <Route path="/storm-predictions" element={<ProtectedRoute><StormPredictions /></ProtectedRoute>} />
          <Route path="/deployment-map" element={<ProtectedRoute><DeploymentMap /></ProtectedRoute>} />
          <Route path="/deployment-intelligence" element={<ProtectedRoute><DeploymentIntelligence /></ProtectedRoute>} />
          <Route path="/traffic-cam-watcher" element={<ProtectedRoute><TrafficCamWatcherModule /></ProtectedRoute>} />
          <Route path="/eyes-in-the-sky" element={<ProtectedRoute><EyesInSky /></ProtectedRoute>} />
          <Route path="/drone-operation" element={<ProtectedRoute><DroneOperations /></ProtectedRoute>} />
          <Route path="/damage-detection" element={<ProtectedRoute><AIDamageDetection /></ProtectedRoute>} />
          <Route path="/ai-damage-detection" element={<ProtectedRoute><AIDamageDetection /></ProtectedRoute>} />
          <Route path="/leads" element={<ProtectedRoute><Leads /></ProtectedRoute>} />
          <Route path="/ai-leads" element={<ProtectedRoute><AILeadManagement /></ProtectedRoute>} />
          <Route path="/victim/dashboard" element={<ProtectedRoute><VictimDashboard /></ProtectedRoute>} />
          
          {/* StormShare - Accessible by ALL authenticated users including homeowners */}
          <Route path="/stormshare" element={<ProtectedRoute><StormShare /></ProtectedRoute>} />
          
          <Route path="/disaster-essentials-marketplace" element={<ProtectedRoute><DisasterEssentialsMarketplace /></ProtectedRoute>} />
          <Route path="/customers" element={<ProtectedRoute><Customers /></ProtectedRoute>} />
          <Route path="/claims" element={<ProtectedRoute><Claims /></ProtectedRoute>} />
          <Route path="/contractor-management" element={<ProtectedRoute><ContractorManagement /></ProtectedRoute>} />
          <Route path="/contractors" element={<ProtectedRoute><ContractorPortal /></ProtectedRoute>} />
          <Route path="/contractor-alerts" element={<ProtectedRoute><ContractorAlertsDashboard /></ProtectedRoute>} />
          <Route path="/sms-test" element={<ProtectedRoute><SMSTestPage /></ProtectedRoute>} />
          <Route path="/banking-settings" element={<ProtectedRoute><BankingSettings /></ProtectedRoute>} />
          <Route path="/legal" element={<ProtectedRoute><Legal /></ProtectedRoute>} />
          <Route path="/disaster-lens" element={<ProtectedRoute><DisasterLens /></ProtectedRoute>} />
          <Route path="/modules/xray-reality" element={<ProtectedRoute><XrayRealityModule /></ProtectedRoute>} />
          <Route path="/hazard-dashboard" element={<ProtectedRoute><HazardDashboard /></ProtectedRoute>} />
          <Route path="/watchlist" element={<ProtectedRoute><Watchlist /></ProtectedRoute>} />
          <Route path="/bidintel-pro" element={<ProtectedRoute><AIBidIntelPro /></ProtectedRoute>} />
          <Route path="/tree-tracker" element={<ProtectedRoute><TreeIncidentTracker /></ProtectedRoute>} />
          <Route path="/tree-tracker/:id" element={<ProtectedRoute><TreeIncidentTracker /></ProtectedRoute>} />
          <Route path="/fema-audit" element={<ProtectedRoute><FemaAuditDashboard /></ProtectedRoute>} />
          
          {/* Admin Routes - Admin only */}
          <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/ecrp" element={<ProtectedRoute allowedRoles={['admin']}><EmergencyContractorReadiness /></ProtectedRoute>} />
          <Route path="/admin/legal/zipmap" element={<ProtectedRoute allowedRoles={['admin']}><ZipStateAdmin /></ProtectedRoute>} />
          <Route path="/admin/legal/welcome" element={<ProtectedRoute allowedRoles={['admin']}><WelcomeTemplates /></ProtectedRoute>} />
          <Route path="/admin/jobs/fill-states" element={<ProtectedRoute allowedRoles={['admin']}><BulkFillStates /></ProtectedRoute>} />
          <Route path="/admin/smtp" element={<ProtectedRoute allowedRoles={['admin']}><SMTPSettings /></ProtectedRoute>} />
          <Route path="/admin/auth-stub" element={<ProtectedRoute allowedRoles={['admin']}><AuthStub /></ProtectedRoute>} />
          <Route path="/admin/oidc" element={<ProtectedRoute allowedRoles={['admin']}><OIDCSettings /></ProtectedRoute>} />
          <Route path="/admin/audit-log" element={<ProtectedRoute allowedRoles={['admin']}><EnterpriseAuditLog /></ProtectedRoute>} />
          <Route path="/admin/business-assessment" element={<ProtectedRoute allowedRoles={['admin']}><BusinessAssessment /></ProtectedRoute>} />
          <Route path="/admin/playbooks" element={<ProtectedRoute allowedRoles={['admin']}><ImplementationPlaybooks /></ProtectedRoute>} />
          <Route path="/admin/monitoring" element={<ProtectedRoute allowedRoles={['admin']}><MonitoringDashboard /></ProtectedRoute>} />
          <Route path="/admin/payment-approvals" element={<ProtectedRoute allowedRoles={['admin']}><PaymentApprovals /></ProtectedRoute>} />
          <Route path="/admin/affiliates" element={<ProtectedRoute allowedRoles={['admin']}><AffiliateManagement /></ProtectedRoute>} />
          
          {/* Contractor Portal */}
          <Route path="/contractor/jobs" element={<ProtectedRoute allowedRoles={['contractor', 'admin']}><ContractorJobs /></ProtectedRoute>} />
          <Route path="/contractor/profile" element={<ProtectedRoute allowedRoles={['contractor', 'admin']}><ContractorProfile /></ProtectedRoute>} />
          <Route path="/contractor/leadvault" element={<ProtectedRoute allowedRoles={['contractor', 'admin']}><ContractorLeadVault /></ProtectedRoute>} />
          
          {/* Homeowner Portal - Accessible by homeowners */}
          <Route path="/homeowner" element={<ProtectedRoute><HomeownerPortal /></ProtectedRoute>} />
          
          {/* Sign Out */}
          <Route path="/signout" element={<SignOut />} />
          
          {/* WorkHub Marketplace Routes */}
          {/* Contractor Hub - Unified Dashboard */}
          <Route path="/hub" element={<ProtectedRoute><ContractorHub /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><ContractorNotifications /></ProtectedRoute>} />
          
          {/* CrewLink Exchange - Public Marketplace */}
          <Route path="/crewlink" element={<CrewLinkExchange />} />
          
          <Route path="/workhub" element={<ProtectedRoute><WorkHubMarketplace /></ProtectedRoute>} />
          {/* Customer portal is public - no login required for customers to submit requests */}
          <Route path="/workhub/customer" element={<WorkHubCustomerPortal />} />
          <Route path="/workhub/contractor" element={<Navigate to="/workhub" replace />} />
          <Route path="/workhub/scopesnap" element={<ProtectedRoute><WorkHubScopeSnap /></ProtectedRoute>} />
          <Route path="/workhub/pricewhisperer" element={<ProtectedRoute><WorkHubPriceWhisperer /></ProtectedRoute>} />
          <Route path="/workhub/contractormatch" element={<ProtectedRoute><WorkHubContractorMatch /></ProtectedRoute>} />
          <Route path="/workhub/calendarsync" element={<ProtectedRoute><WorkHubCalendarSync /></ProtectedRoute>} />
          <Route path="/workhub/jobflow" element={<ProtectedRoute><WorkHubJobFlow /></ProtectedRoute>} />
          <Route path="/workhub/mediavault" element={<ProtectedRoute><WorkHubMediaVault /></ProtectedRoute>} />
          <Route path="/workhub/closebot" element={<ProtectedRoute><WorkHubCloseBot /></ProtectedRoute>} />
          <Route path="/workhub/paystream" element={<ProtectedRoute><WorkHubPayStream /></ProtectedRoute>} />
          <Route path="/workhub/reviewrocket" element={<ProtectedRoute><WorkHubReviewRocket /></ProtectedRoute>} />
          <Route path="/workhub/fairnessscore" element={<ProtectedRoute><WorkHubFairnessScore /></ProtectedRoute>} />
          <Route path="/workhub/quickfinance" element={<ProtectedRoute><WorkHubQuickFinance /></ProtectedRoute>} />
          <Route path="/workhub/contentforge" element={<ProtectedRoute><WorkHubContentForge /></ProtectedRoute>} />
          <Route path="/workhub/auto-repair" element={<WorkHubAutoRepairDiag />} />
          <Route path="/workhub/pricing" element={<ProtectedRoute><WorkHubPricingTiers /></ProtectedRoute>} />
          <Route path="/workhub/pitch" element={<ProtectedRoute><WorkHubPitchDeck /></ProtectedRoute>} />
          <Route path="/workhub/scripts" element={<ProtectedRoute><WorkHubAIAgentScripts /></ProtectedRoute>} />
          <Route path="/workhub/legal" element={<ProtectedRoute><WorkHubLegalTerms /></ProtectedRoute>} />
          <Route path="/workhub/leadpipeline" element={<ProtectedRoute><WorkHubLeadPipeline /></ProtectedRoute>} />
          <Route path="/workhub/jobsnap" element={<ProtectedRoute><WorkHubJobSnap /></ProtectedRoute>} />
          <Route path="/workhub/admin/submissions" element={<ProtectedRoute allowedRoles={['admin']}><WorkHubAdminSubmissions /></ProtectedRoute>} />
          <Route path="/workhub/terms" element={<ProtectedRoute><WorkHubTermsOfService /></ProtectedRoute>} />
          <Route path="/workhub/crm" element={<ProtectedRoute><WorkHubContractorCRM /></ProtectedRoute>} />
          <Route path="/workhub/admin/pricing" element={<ProtectedRoute allowedRoles={['admin']}><WorkHubAdminPricing /></ProtectedRoute>} />
          <Route path="/workhub/onboarding" element={<ProtectedRoute><WorkHubContractorOnboarding /></ProtectedRoute>} />
        </Routes>
      </Suspense>
    </>
  );
}
