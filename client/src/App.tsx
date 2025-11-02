import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ModuleGallery from "./pages/ModuleGallery";

// Lazy-load module pages
const WeatherCenter = lazy(() => import("./modules/WeatherCenter"));
const StormPredictions = lazy(() => import("./modules/StormPredictions"));
const TrafficCamWatcherModule = lazy(() => import("./modules/TrafficCamWatcherModule"));
const DroneOperations = lazy(() => import("./modules/DroneOperations"));
const AIDamageDetection = lazy(() => import("./modules/AIDamageDetection"));
const XrayRealityModule = lazy(() => import("./modules/XrayRealityModule"));

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
      {/* Neon cinematic gallery - Always visible at top */}
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
