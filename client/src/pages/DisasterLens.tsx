import React, { useEffect, useMemo, useRef, useState } from "react";
import { getAuthHeaders } from "@/lib/queryClient";
import AssistantDock from '../components/AssistantDock';

// Single-file demo UI for Disaster Lens
// Tabs: Capture, Timeline, Annotator, Report Builder
// Styling: TailwindCSS classes
// NOTE: This is a front-end scaffold. Buttons are now wired to your Express API.

// ------------------------------
// Inline SHA-256 Web Worker (chain-of-custody)
// ------------------------------
const hashingWorkerUrl = (() => {
  const src = `self.onmessage = async (e) => {
    try {
      const buf = e.data;
      const digest = await crypto.subtle.digest('SHA-256', buf);
      const bytes = new Uint8Array(digest);
      const hex = Array.from(bytes).map(b => b.toString(16).padStart(2,'0')).join('');
      self.postMessage({ ok: true, hex });
    } catch (err) {
      self.postMessage({ ok: false, error: String(err) });
    }
  }`;
  const blob = new Blob([src], { type: "text/javascript" });
  return URL.createObjectURL(blob);
})();

function useHashWorker() {
  const workerRef = useRef<Worker | null>(null);
  useEffect(() => {
    const w = new Worker(hashingWorkerUrl);
    workerRef.current = w;
    return () => w.terminate();
  }, []);

  return async function hashArrayBuffer(buf: ArrayBuffer): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!workerRef.current) {
        reject(new Error("Worker not ready"));
        return;
      }
      const w = workerRef.current;
      w.onmessage = (e) => {
        if (e.data.ok) resolve(e.data.hex);
        else reject(new Error(e.data.error));
      };
      // We transfer the buffer to the worker thread
      w.postMessage(buf, [buf as any]);
    });
  };
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      className={`px-4 py-2 rounded ${active ? 'bg-black text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} transition`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white p-4 border rounded shadow">
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm text-gray-600">{label}</div>
      {sub && <div className="text-xs text-gray-500 mt-1">{sub}</div>}
    </div>
  );
}

// --- Capture Tab ---
function CaptureTab() {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>("");
  const [isCapturing, setIsCapturing] = useState(false);
  const [location, setLocation] = useState<string>("Acquiring location...");
  const hashWorker = useHashWorker();
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // Get camera devices
    navigator.mediaDevices.enumerateDevices()
      .then(devices => {
        const cameras = devices.filter(d => d.kind === 'videoinput');
        setDevices(cameras);
        if (cameras.length > 0 && !selectedCamera) {
          setSelectedCamera(cameras[0].deviceId);
        }
      })
      .catch(console.error);
      
    // Get location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation(`${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`),
        () => setLocation("Location unavailable")
      );
    }
  }, [selectedCamera]);

  const startCapture = async () => {
    if (!videoRef.current) return;
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: selectedCamera }
      });
      videoRef.current.srcObject = stream;
      setIsCapturing(true);
    } catch (error) {
      console.error('Error starting capture:', error);
    }
  };

  const stopCapture = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsCapturing(false);
    }
  };

  const takePhoto = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    // Convert to blob and hash for chain-of-custody
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      
      const buffer = await blob.arrayBuffer();
      const hash = await hashWorker(buffer);
      
      // Upload to backend
      const formData = new FormData();
      formData.append('file', blob, `photo_${Date.now()}.jpg`);
      formData.append('metadata', JSON.stringify({
        timestamp: new Date().toISOString(),
        location,
        sha256: hash,
        type: 'photo'
      }));

      try {
        const response = await fetch('/api/media/upload', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: formData
        });
        const result = await response.json();
        console.log('Photo uploaded:', result);
      } catch (error) {
        console.error('Upload failed:', error);
      }
    }, 'image/jpeg', 0.9);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 border rounded shadow">
        <h2 className="text-xl font-bold mb-4">Camera Capture</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Camera Device</label>
              <select 
                className="w-full border rounded px-3 py-2"
                value={selectedCamera}
                onChange={(e) => setSelectedCamera(e.target.value)}
              >
                {devices.map(device => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label || `Camera ${device.deviceId.slice(0, 8)}`}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Location</label>
              <input 
                type="text" 
                value={location} 
                className="w-full border rounded px-3 py-2" 
                readOnly 
              />
            </div>
            
            <div className="space-y-2">
              {!isCapturing ? (
                <button 
                  onClick={startCapture}
                  className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                  data-testid="button-start-capture"
                >
                  Start Capture
                </button>
              ) : (
                <>
                  <button 
                    onClick={takePhoto}
                    className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    data-testid="button-take-photo"
                  >
                    📸 Take Photo
                  </button>
                  <button 
                    onClick={stopCapture}
                    className="w-full bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                    data-testid="button-stop-capture"
                  >
                    Stop Capture
                  </button>
                </>
              )}
            </div>
          </div>
          
          <div className="border rounded bg-gray-100 aspect-video">
            <video 
              ref={videoRef} 
              autoPlay 
              muted 
              className="w-full h-full object-cover rounded"
              data-testid="video-preview"
            />
            <canvas ref={canvasRef} className="hidden" />
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Timeline Tab ---
function TimelineItem({ img, title, meta }: { img: string; title: string; meta: string }) {
  return (
    <div className="flex items-center gap-3 p-3 border rounded hover:bg-gray-50">
      <img src={img} alt={title} className="w-16 h-16 object-cover rounded" />
      <div>
        <div className="font-medium">{title}</div>
        <div className="text-sm text-gray-600">{meta}</div>
      </div>
    </div>
  );
}

function TimelineTab() {
  const demo = new Array(6).fill(0).map((_, i) => ({
    img: `https://picsum.photos/100/100?random=${i}`,
    title: `Item ${i + 1}`,
    meta: `${i + 1} hour${i !== 0 ? 's' : ''} ago • GPS: 25.7617, -80.1918`
  }));

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 border rounded shadow">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Project Timeline</h2>
          <div className="flex gap-2">
            <button className="px-3 py-1 text-sm border rounded hover:bg-gray-50" data-testid="button-filter-all">
              All
            </button>
            <button className="px-3 py-1 text-sm border rounded hover:bg-gray-50" data-testid="button-filter-photos">
              Photos
            </button>
            <button className="px-3 py-1 text-sm border rounded hover:bg-gray-50" data-testid="button-filter-videos">
              Videos
            </button>
          </div>
        </div>
        
        <div className="space-y-3">
          {demo.map((item, i) => (
            <TimelineItem key={i} {...item} />
          ))}
        </div>
      </div>
    </div>
  );
}

// --- Annotator Tab (simple mock) ---
function AnnotatorTab() {
  const [selectedImage, setSelectedImage] = useState("https://picsum.photos/800/600?random=1");
  const [annotations, setAnnotations] = useState<Array<{x: number, y: number, label: string}>>([]);
  
  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const label = prompt("Add annotation label:");
    if (label) {
      setAnnotations(prev => [...prev, { x, y, label }]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 border rounded shadow">
        <h2 className="text-xl font-bold mb-4">Image Annotator</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <div className="relative border rounded bg-gray-100">
              <img 
                src={selectedImage} 
                alt="Annotation target"
                className="w-full cursor-crosshair"
                onClick={handleImageClick}
                data-testid="image-annotator"
              />
              {annotations.map((ann, i) => (
                <div 
                  key={i}
                  className="absolute bg-red-500 text-white text-xs px-1 py-0.5 rounded pointer-events-none"
                  style={{ left: ann.x, top: ann.y }}
                >
                  {ann.label}
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="font-medium mb-3">Annotations ({annotations.length})</h3>
            <div className="space-y-2">
              {annotations.map((ann, i) => (
                <div key={i} className="p-2 border rounded text-sm">
                  <div className="font-medium">{ann.label}</div>
                  <div className="text-gray-600">({ann.x.toFixed(0)}, {ann.y.toFixed(0)})</div>
                </div>
              ))}
            </div>
            
            <div className="mt-4">
              <button 
                onClick={() => setAnnotations([])}
                className="w-full px-3 py-2 border rounded text-sm hover:bg-gray-50"
                data-testid="button-clear-annotations"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Report Builder Tab ---
function ReportBuilderTab() {
  const [reportTitle, setReportTitle] = useState("Storm Damage Assessment");
  const [sections, setSections] = useState([
    { id: 1, title: "Executive Summary", content: "Overview of damage assessment findings..." },
    { id: 2, title: "Photo Documentation", content: "Detailed photographic evidence..." },
    { id: 3, title: "Recommendations", content: "Suggested remediation actions..." }
  ]);

  const addSection = () => {
    const title = prompt("Section title:");
    if (title) {
      setSections(prev => [...prev, {
        id: Date.now(),
        title,
        content: "New section content..."
      }]);
    }
  };

  const updateSection = (id: number, field: 'title' | 'content', value: string) => {
    setSections(prev => prev.map(section => 
      section.id === id ? { ...section, [field]: value } : section
    ));
  };

  const deleteSection = (id: number) => {
    setSections(prev => prev.filter(section => section.id !== id));
  };

  const generateReport = async () => {
    try {
      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          title: reportTitle,
          sections,
          projectId: 'demo-project-001'
        })
      });
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportTitle.replace(/\s+/g, '_')}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Report generation failed:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 border rounded shadow">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Report Builder</h2>
          <div className="flex gap-2">
            <button 
              onClick={addSection}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              data-testid="button-add-section"
            >
              Add Section
            </button>
            <button 
              onClick={generateReport}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              data-testid="button-generate-report"
            >
              Generate PDF
            </button>
          </div>
        </div>
        
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Report Title</label>
          <input 
            type="text"
            value={reportTitle}
            onChange={(e) => setReportTitle(e.target.value)}
            className="w-full border rounded px-3 py-2"
            data-testid="input-report-title"
          />
        </div>
        
        <div className="space-y-6">
          {sections.map(section => (
            <div key={section.id} className="border rounded p-4">
              <div className="flex items-center justify-between mb-3">
                <input 
                  type="text"
                  value={section.title}
                  onChange={(e) => updateSection(section.id, 'title', e.target.value)}
                  className="text-lg font-medium border-0 border-b bg-transparent flex-1 mr-4"
                  data-testid={`input-section-title-${section.id}`}
                />
                <button 
                  onClick={() => deleteSection(section.id)}
                  className="text-red-600 hover:text-red-800 text-sm"
                  data-testid={`button-delete-section-${section.id}`}
                >
                  Delete
                </button>
              </div>
              <textarea 
                value={section.content}
                onChange={(e) => updateSection(section.id, 'content', e.target.value)}
                rows={4}
                className="w-full border rounded px-3 py-2"
                data-testid={`textarea-section-content-${section.id}`}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const tabs = ["Capture", "Timeline", "Annotator", "Report Builder"] as const;
  const [tab, setTab] = useState<typeof tabs[number]>("Capture");

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Disaster Lens</h1>
              <p className="text-sm text-gray-600">Photo • Video • Reports</p>
            </div>
            <div className="flex gap-2">
              {tabs.map((t) => (
                <TabButton key={t} active={t===tab} onClick={()=>setTab(t)} data-testid={`tab-${t.toLowerCase().replace(' ', '-')}`}>
                  {t}
                </TabButton>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <StatCard label="Project Status" value="Active" sub="Job #DL-000271" />
          <StatCard label="Media" value="128 items" sub="Today + Yesterday" />
          <StatCard label="Reports" value="3 drafts" sub="1 final, 2 daily" />
        </div>

        {tab === "Capture" && <CaptureTab />}
        {tab === "Timeline" && <TimelineTab />}
        {tab === "Annotator" && <AnnotatorTab />}
        {tab === "Report Builder" && <ReportBuilderTab />}
      </main>

      <footer className="py-6 text-center text-xs text-gray-500">
        © {new Date().getFullYear()} Disaster Lens Module — UI Demo
      </footer>
      
      {/* AI Assistant Dock */}
      <AssistantDock />
    </div>
  );
}