import { lazy, Suspense, useState, useEffect } from "react";
import { Routes, Route, Navigate, Link, useLocation } from "react-router-dom";
import { Zap, Home, Menu } from 'lucide-react';
import { motion } from 'framer-motion';
import ModuleGallery from "./pages/ModuleGallery";

// Lazy-load all 17 module pages
const WeatherCenter = lazy(() => import("./modules/WeatherCenter"));
const StormPredictions = lazy(() => import("./modules/StormPredictions"));
const DeploymentMap = lazy(() => import("./pages/DeploymentMap"));
const TrafficCamWatcherModule = lazy(() => import("./modules/TrafficCamWatcherModule"));
const EyesInSky = lazy(() => import("./pages/EyesInSky"));
const DroneOperations = lazy(() => import("./modules/DroneOperations"));
const AIDamageDetection = lazy(() => import("./modules/AIDamageDetection"));
const Leads = lazy(() => import("./pages/Leads"));
const VictimDashboard = lazy(() => import("./pages/VictimDashboard"));
const StormShare = lazy(() => import("./pages/StormShare"));
const DisasterEssentialsMarketplace = lazy(() => import("./pages/DisasterEssentialsMarketplace"));
const Customers = lazy(() => import("./pages/Customers"));
const Claims = lazy(() => import("./pages/Claims"));
const ContractorManagement = lazy(() => import("./pages/ContractorManagement"));
const ContractorPortal = lazy(() => import("./pages/ContractorPortal"));
const Legal = lazy(() => import("./pages/Legal"));
// const DisasterLens = lazy(() => import("./pages/DisasterLens")); // Temporarily disabled due to JSX errors
const XrayRealityModule = lazy(() => import("./modules/XrayRealityModule"));
const HazardDashboard = lazy(() => import("./pages/HazardDashboard"));

// Top Navigation Header
function TopNav() {
  const [role, setRole] = useState(localStorage.getItem('role') || 'ops');
  const location = useLocation();
  
  useEffect(() => {
    localStorage.setItem('role', role);
  }, [role]);

  return (
    <nav className="bg-gradient-to-r from-blue-900 via-purple-900 to-blue-900 text-white shadow-lg border-b border-white/20 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-4">
            <Link to="/" className="flex items-center space-x-2">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Zap className="w-6 h-6 text-yellow-300" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">
                  Disaster Direct
                </h1>
                <p className="text-xs text-white/80 hidden sm:block">
                  Storm Operations Platform
                </p>
              </div>
            </Link>
          </div>

          {/* Right Side - Role Selector */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-white/90">Active Role:</span>
              <select 
                className="border rounded-md px-3 py-1.5 text-sm bg-white text-gray-900 font-medium" 
                value={role} 
                onChange={(e) => setRole(e.target.value)}
                data-testid="role-selector"
              >
                <option value="ops">Operations</option>
                <option value="field">Field</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

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
          {/* Home - Module Gallery */}
          <Route path="/" element={
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
          <Route path="/traffic-cam-watcher" element={<TrafficCamWatcherModule />} />
          <Route path="/eyes-in-the-sky" element={<EyesInSky />} />
          <Route path="/drone-operation" element={<DroneOperations />} />
          <Route path="/damage-detection" element={<AIDamageDetection />} />
          <Route path="/leads" element={<Leads />} />
          <Route path="/victim/dashboard" element={<VictimDashboard />} />
          <Route path="/stormshare" element={<StormShare />} />
          <Route path="/disaster-essentials-marketplace" element={<DisasterEssentialsMarketplace />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/claims" element={<Claims />} />
          <Route path="/contractor-management" element={<ContractorManagement />} />
          <Route path="/contractors" element={<ContractorPortal />} />
          <Route path="/legal" element={<Legal />} />
          {/* <Route path="/disaster-lens" element={<DisasterLens />} /> */}
          <Route path="/modules/xray-reality" element={<XrayRealityModule />} />
          <Route path="/hazard-dashboard" element={<HazardDashboard />} />
        </Routes>
      </Suspense>
    </>
  );
}
