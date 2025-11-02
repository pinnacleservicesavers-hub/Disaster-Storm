import { lazy, Suspense, useState, useEffect } from "react";
import { Routes, Route, Navigate, Link, useLocation } from "react-router-dom";
import { Zap, Home, Menu } from 'lucide-react';
import { motion } from 'framer-motion';
import ModuleGallery from "./pages/ModuleGallery";

// Lazy-load module pages
const WeatherCenter = lazy(() => import("./modules/WeatherCenter"));
const StormPredictions = lazy(() => import("./modules/StormPredictions"));
const TrafficCamWatcherModule = lazy(() => import("./modules/TrafficCamWatcherModule"));
const DroneOperations = lazy(() => import("./modules/DroneOperations"));
const AIDamageDetection = lazy(() => import("./modules/AIDamageDetection"));
const XrayRealityModule = lazy(() => import("./modules/XrayRealityModule"));

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
          <motion.div 
            className="flex items-center space-x-4"
            whileHover={{ scale: 1.02 }}
          >
            <Link to="/" className="flex items-center space-x-2">
              <motion.div
                animate={{ 
                  rotate: [0, 5, -5, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{ 
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="p-2 bg-white/20 rounded-lg backdrop-blur-sm"
              >
                <Zap className="w-6 h-6 text-yellow-300" />
              </motion.div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">
                  Disaster Direct
                </h1>
                <p className="text-xs text-white/80 hidden sm:block">
                  Storm Operations Platform
                </p>
              </div>
            </Link>
          </motion.div>

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

// Route map used by the gallery buttons
const galleryRoutes = {
  "weather":        { launch: "/ops/weather",  preview: "/ops/weather/preview",  docs: "/docs/weather" },
  "predictions":     { launch: "/ops/predict",  preview: "/ops/predict/preview",  docs: "/docs/predict" },
  "traffic-cam":   { launch: "/ops/traffic",  preview: "/ops/traffic/preview",  docs: "/docs/traffic" },
  "drone-ops":      { launch: "/ops/drones",   preview: "/ops/drones/preview",   docs: "/docs/drones" },
  "ai-damage":   { launch: "/ops/ai",       preview: "/ops/ai/preview",       docs: "/docs/ai" },
  "xray":          { launch: "/ops/xray",     preview: "/ops/xray/preview",     docs: "/docs/xray" },
};

export default function App() {
  return (
    <>
      {/* Top Navigation - RESTORED */}
      <TopNav />
      
      {/* Neon cinematic gallery */}
      <ModuleGallery 
        routes={galleryRoutes}
        onLaunch={(m) => console.log("🚀 Launch:", m.id, m.name)}
        onPreview={(m) => console.log("👁️ Preview:", m.id, m.name)}
        onDocs={(m) => console.log("📖 Docs:", m.id, m.name)}
      />

      {/* Lazy-loaded routes */}
      <Suspense fallback={<Loader />}>
        <Routes>
          {/* Default landing */}
          <Route path="/" element={<Navigate to="/ops/weather" replace />} />

          {/* Operations routes */}
          <Route path="/ops/weather" element={<WeatherCenter />} />
          <Route path="/ops/predict" element={<StormPredictions />} />
          <Route path="/ops/traffic" element={<TrafficCamWatcherModule />} />
          <Route path="/ops/drones" element={<DroneOperations />} />
          <Route path="/ops/ai" element={<AIDamageDetection />} />
          <Route path="/ops/xray" element={<XrayRealityModule />} />

          {/* Preview placeholders - reuse main components for now */}
          <Route path="/ops/weather/preview" element={<WeatherCenter />} />
          <Route path="/ops/predict/preview" element={<StormPredictions />} />
          <Route path="/ops/traffic/preview" element={<TrafficCamWatcherModule />} />
          <Route path="/ops/drones/preview" element={<DroneOperations />} />
          <Route path="/ops/ai/preview" element={<AIDamageDetection />} />
          <Route path="/ops/xray/preview" element={<XrayRealityModule />} />

          {/* Docs placeholders */}
          <Route path="/docs/weather" element={<WeatherCenter />} />
          <Route path="/docs/predict" element={<StormPredictions />} />
          <Route path="/docs/traffic" element={<TrafficCamWatcherModule />} />
          <Route path="/docs/drones" element={<DroneOperations />} />
          <Route path="/docs/ai" element={<AIDamageDetection />} />
          <Route path="/docs/xray" element={<XrayRealityModule />} />

          {/* 404 - redirect to default */}
          <Route path="*" element={<Navigate to="/ops/weather" replace />} />
        </Routes>
      </Suspense>
    </>
  );
}
