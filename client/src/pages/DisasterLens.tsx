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

async function fileToBase64(f: File): Promise<string> {
  return new Promise((resolve,reject)=>{ 
    const r = new FileReader(); 
    r.onload=()=>resolve(String(r.result)); 
    r.onerror=reject; 
    r.readAsDataURL(f); 
  });
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

// --- Annotator Tab with Damage Hints & Professional Measurements ---
function AnnotatorTab({ scalePxPerInch }: { scalePxPerInch: number | null }) {
  const [brush, setBrush] = useState<'arrow'|'box'|'text'|'blur'|'measure'|'length'|'area'>("box");
  const [caption, setCaption] = useState("Cracked limb over structure — immediate removal recommended.");
  const [selectedImage, setSelectedImage] = useState("https://picsum.photos/seed/annotate/1200/675");
  const [hints, setHints] = useState<{x:number,y:number,w:number,h:number, score:number, label?:string, picked?:boolean}[]>([]);
  const [loadingHints, setLoadingHints] = useState(false);
  
  // Measurement states
  const [measureClicks, setMeasureClicks] = useState<{x:number,y:number}[]>([]);
  const [lengthClicks, setLengthClicks] = useState<{x:number,y:number}[]>([]);
  const [areaPoints, setAreaPoints] = useState<{x:number,y:number}[]>([]);
  
  // Track last computed measurements for clipboard
  const [lastMath, setLastMath] = useState<{ kind:'diameter'|'length'|'area', text:string }|null>(null);

  async function copyMath(){
    if (!lastMath) return alert('Nothing to copy yet');
    try { 
      await navigator.clipboard.writeText(lastMath.text); 
      alert('Math copied to clipboard'); 
    } catch { 
      alert(lastMath.text); 
    }
  }

  async function getDamageHints(){
    try {
      setLoadingHints(true);
      // If selectedImage is a data URL already, just send; otherwise fetch and convert
      let imageBase64 = selectedImage;
      if (!imageBase64.startsWith('data:')){
        const resp = await fetch(selectedImage); 
        const blob = await resp.blob();
        imageBase64 = await fileToBase64(new File([blob], 'img.jpg', { type: blob.type||'image/jpeg' }));
      }
      const res = await fetch('/api/hints/damage', { 
        method:'POST', 
        headers:{'Content-Type':'application/json'}, 
        body: JSON.stringify({ imageBase64 }) 
      });
      const data = await res.json();
      setHints((data?.hints||[]).map((h:any)=>({ ...h })));
    } finally { setLoadingHints(false); }
  }

  function suggestLabels(){
    // Heuristic label proposals
    setHints((prev)=> prev.map(h => {
      let label = 'Damage';
      if (h.w>h.h && h.score>20) label = 'Fallen limb impact';
      if (h.h>h.w && h.score>20) label = 'Uprooted root plate';
      if (h.score<10) label = 'Minor disturbance';
      return { ...h, label };
    }));
  }

  async function confirmHint(h: any){
    // Convert hint box → circle annotation via API
    const cx = h.x + h.w/2, cy = h.y + h.h/2; 
    const r = Math.round(Math.min(h.w,h.h)/2);
    const res = await fetch('/api/annotate/circle', { 
      method:'POST', 
      headers:{'Content-Type':'application/json'}, 
      body: JSON.stringify({ mediaId:'demo-media', x: Math.round(cx), y: Math.round(cy), r, label: h.label||'Damage' }) 
    });
    if (res.ok) setHints(prev => prev.map(it => it===h? { ...it, picked:true }: it));
  }

  // Utility to ensure base64 format
  async function ensureBase64(img: string): Promise<string> {
    if (img.startsWith('data:')) return img;
    const resp = await fetch(img);
    const blob = await resp.blob();
    return await fileToBase64(new File([blob], 'img.jpg', { type: blob.type||'image/jpeg' }));
  }

  // Client-side canvas drawing utility
  async function drawOverlayBase64(baseImage: string, draw: (ctx: CanvasRenderingContext2D, w:number, h:number)=>void): Promise<string> {
    const img = document.createElement('img');
    img.src = baseImage;
    await img.decode();
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0);
    draw(ctx, canvas.width, canvas.height);
    return canvas.toDataURL();
  }

  const handleImageClick = async (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Diameter measurement (server-powered)
    if (brush === 'measure') {
      if (!scalePxPerInch) {
        alert('No calibration set. Open the Calibrate tab to scan a QR and lock scale.');
        return;
      }
      
      const newClicks = [...measureClicks, {x, y}];
      setMeasureClicks(newClicks);
      
      if (newClicks.length === 2) {
        const [pt1, pt2] = newClicks;
        const px = Math.hypot(pt2.x-pt1.x, pt2.y-pt1.y);
        const inches = px / scalePxPerInch;
        
        try {
          const imageBase64 = await ensureBase64(selectedImage);
          const response = await fetch('/api/tape/overlay', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              imageBase64,
              x1: Math.round(pt1.x), y1: Math.round(pt1.y),
              x2: Math.round(pt2.x), y2: Math.round(pt2.y),
              scalePxPerInch,
              label: `${inches.toFixed(2)}"`
            })
          });
          
          const result = await response.json();
          
          if (result.ok) {
            // Auto-inject into Report Builder
            window.dispatchEvent(new CustomEvent('DL_ADD_OVERLAY_TO_REPORT', {
              detail: {
                imageBase64: result.overlayImageBase64,
                caption: `Diameter: ${inches.toFixed(2)}" (QR-calibrated)`
              }
            }));
            
            // Set math for clipboard
            setLastMath({
              kind: 'diameter',
              text: `Diameter = pixel_distance / (px/in)\n= ${px.toFixed(2)} px / ${scalePxPerInch.toFixed(2)} px/in\n= ${(inches).toFixed(2)} in`
            });
          }
        } catch (error) {
          console.error('Diameter measurement failed:', error);
        }
        
        setMeasureClicks([]);
      }
    }

    // Length measurement (client-side)
    else if (brush === 'length') {
      if (!scalePxPerInch) {
        alert('No calibration set. Open the Calibrate tab to scan a QR and lock scale.');
        return;
      }
      
      const newClicks = [...lengthClicks, {x, y}];
      setLengthClicks(newClicks);
      
      if (newClicks.length === 2) {
        const [pt1, pt2] = newClicks;
        const px = Math.hypot(pt2.x-pt1.x, pt2.y-pt1.y);
        const inches = px / scalePxPerInch;
        const feet = inches / 12;
        
        try {
          const base64 = await ensureBase64(selectedImage);
          const overlayUrl = await drawOverlayBase64(base64, (ctx) => {
            ctx.save();
            ctx.strokeStyle = 'yellow';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(pt1.x, pt1.y);
            ctx.lineTo(pt2.x, pt2.y);
            ctx.stroke();
            
            // Label
            const mx = (pt1.x + pt2.x) / 2;
            const my = (pt1.y + pt2.y) / 2;
            ctx.fillStyle = 'black';
            ctx.fillRect(mx-40, my-12, 80, 20);
            ctx.fillStyle = 'white';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`${inches.toFixed(1)}"`, mx, my+2);
            ctx.restore();
          });
          
          // Auto-inject into Report Builder
          window.dispatchEvent(new CustomEvent('DL_ADD_OVERLAY_TO_REPORT', {
            detail: {
              imageBase64: overlayUrl,
              caption: `Length: ${inches.toFixed(2)}" ≈ ${feet.toFixed(2)} ft (QR-calibrated)`
            }
          }));
          
          // Set math for clipboard
          setLastMath({
            kind: 'length',
            text: `Length = pixel_distance / (px/in)\n= ${px.toFixed(2)} px / ${scalePxPerInch.toFixed(2)} px/in\n= ${(inches).toFixed(2)} in ≈ ${(feet).toFixed(2)} ft`
          });
          
        } catch (error) {
          console.error('Length measurement failed:', error);
        }
        
        setLengthClicks([]);
      }
    }

    // Area measurement (multi-click polygon)
    else if (brush === 'area') {
      if (!scalePxPerInch) {
        alert('No calibration set. Open the Calibrate tab to scan a QR and lock scale.');
        return;
      }
      
      setAreaPoints(prev => [...prev, {x, y}]);
    }
  };

  // Complete area polygon measurement
  const completeAreaMeasurement = async () => {
    if (!scalePxPerInch) {
      alert('No calibration set. Open the Calibrate tab to scan a QR and lock scale.');
      return;
    }
    if (areaPoints.length < 3) {
      alert('Add at least 3 points');
      return;
    }

    try {
      const base64 = await ensureBase64(selectedImage);
      const response = await fetch('/api/area/overlay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64,
          points: areaPoints,
          scalePxPerInch,
          color: '#ffd700',
          label: undefined
        })
      });

      if (!response.ok) {
        alert('Area overlay failed');
        return;
      }

      const ft2 = Number(response.headers.get('X-Area-SqFt') || '0');
      const blob = await response.blob();
      const overlayUrl = URL.createObjectURL(blob);

      // Convert blob to base64 for report injection
      const arrBuf = await blob.arrayBuffer();
      const b64 = `data:image/png;base64,${btoa(String.fromCharCode(...new Uint8Array(arrBuf)))}`;

      // Auto-inject into Report Builder
      window.dispatchEvent(new CustomEvent('DL_ADD_OVERLAY_TO_REPORT', {
        detail: {
          imageBase64: b64,
          caption: `Area: ${ft2.toFixed(2)} sq ft (QR-calibrated)`
        }
      }));

      // Calculate detailed math for clipboard
      let sum = 0;
      for (let i = 0; i < areaPoints.length; i++) {
        const a = areaPoints[i], b = areaPoints[(i + 1) % areaPoints.length];
        sum += (a.x * b.y - b.x * a.y);
      }
      const areaPx2 = Math.abs(sum) / 2;
      const inchesPerPx = 1 / scalePxPerInch;
      const areaIn2 = areaPx2 * (inchesPerPx * inchesPerPx);
      const areaFt2 = areaIn2 / 144;

      // Set math for clipboard
      setLastMath({
        kind: 'area',
        text: `Area_px² = |∑(x_i*y_{i+1} − x_{i+1}*y_i)|/2 = ${areaPx2.toFixed(2)} px²\nArea_in² = Area_px² * (in/px)² = ${(areaIn2).toFixed(2)} in²\nArea_ft² = Area_in² / 144 = ${(areaFt2).toFixed(2)} ft²`
      });

      setAreaPoints([]);
    } catch (error) {
      console.error('Area measurement failed:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 border rounded shadow">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="mb-4 flex items-center gap-2 flex-wrap">
              {(["arrow","box","text","blur","measure","length","area"] as const).map((b)=> (
                <button key={b} onClick={()=>{
                  setBrush(b);
                  setMeasureClicks([]);
                  setLengthClicks([]);
                  setAreaPoints([]);
                }} 
                  className={`px-3 py-1.5 rounded border text-sm ${brush===b?"bg-black text-white":"hover:bg-gray-50"}`}
                  data-testid={`brush-${b}`}>
                  {b === 'measure' ? `Diameter ${scalePxPerInch ? '(cal)' : '(QR?)'}` : 
                   b === 'length' ? `Length ${scalePxPerInch ? '(cal)' : '(QR?)'}` :
                   b === 'area' ? `Area ${scalePxPerInch ? '(cal)' : '(QR?)'}` : b}
                </button>
              ))}
              {brush === 'area' && areaPoints.length >= 3 && (
                <button onClick={completeAreaMeasurement} 
                  className="px-3 py-1.5 rounded bg-green-600 text-white text-sm">
                  Complete Polygon ({areaPoints.length} pts)
                </button>
              )}
              <button onClick={copyMath} 
                className="px-3 py-1.5 rounded border text-sm hover:bg-gray-50"
                data-testid="button-copy-math">
                📋 Copy Math {lastMath ? `(${lastMath.kind})` : ''}
              </button>
              <label className="ml-auto text-sm flex items-center gap-2 cursor-pointer">
                <span className="hidden sm:inline">Change image</span>
                <input type="file" accept="image/*" className="hidden" onChange={async (e)=>{
                  const f = e.target.files?.[0]; if (!f) return; 
                  const b64 = await fileToBase64(f); 
                  setSelectedImage(b64); setHints([]);
                }} />
                <span className="px-3 py-1.5 rounded border">Upload</span>
              </label>
            </div>
            
            <div className="aspect-video w-full rounded border overflow-hidden relative bg-gray-100">
              <img src={selectedImage} className="w-full h-full object-cover" 
                onClick={handleImageClick}
                style={{ cursor: ['measure', 'length', 'area'].includes(brush) ? 'crosshair' : 'default' }}
                data-testid="image-annotator" />
              {/* Hints overlay */}
              <div className="absolute inset-0">
                {hints.map((h, i)=> (
                  <div key={i} className={`absolute border-2 ${h.picked? 'border-green-500' : 'border-yellow-400'} bg-yellow-300/10`}
                    style={{ left:h.x, top:h.y, width:h.w, height:h.h }}>
                    {h.label && (
                      <div className="absolute -top-5 left-0 text-[10px] bg-black/70 text-white px-1.5 py-0.5 rounded">{h.label}</div>
                    )}
                  </div>
                ))}
                
                {/* Diameter measurement clicks visualization */}
                {measureClicks.map((click, i) => (
                  <div key={`measure-${i}`} className="absolute w-3 h-3 bg-blue-500 rounded-full -translate-x-1.5 -translate-y-1.5 border-2 border-white"
                    style={{ left: click.x, top: click.y }} />
                ))}
                {measureClicks.length === 1 && (
                  <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                    Click endpoint to measure diameter
                  </div>
                )}

                {/* Length measurement clicks visualization */}
                {lengthClicks.map((click, i) => (
                  <div key={`length-${i}`} className="absolute w-3 h-3 bg-yellow-500 rounded-full -translate-x-1.5 -translate-y-1.5 border-2 border-white"
                    style={{ left: click.x, top: click.y }} />
                ))}
                {lengthClicks.length === 1 && (
                  <div className="absolute top-2 left-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded">
                    Click endpoint to measure length
                  </div>
                )}

                {/* Area polygon points visualization */}
                {areaPoints.map((point, i) => (
                  <div key={`area-${i}`} className="absolute w-3 h-3 bg-yellow-400 rounded-full -translate-x-1.5 -translate-y-1.5 border-2 border-white"
                    style={{ left: point.x, top: point.y }} />
                ))}
                {areaPoints.length >= 1 && areaPoints.length < 3 && (
                  <div className="absolute top-2 left-2 bg-yellow-600 text-white text-xs px-2 py-1 rounded">
                    {areaPoints.length === 1 ? 'Add more points for polygon area' : `${3 - areaPoints.length} more points needed`}
                  </div>
                )}
                {areaPoints.length >= 3 && (
                  <div className="absolute top-2 left-2 bg-green-600 text-white text-xs px-2 py-1 rounded">
                    {areaPoints.length} points • Click "Complete Polygon"
                  </div>
                )}
                
                {/* Draw polygon preview lines */}
                {areaPoints.length > 1 && (
                  <svg className="absolute inset-0 w-full h-full pointer-events-none">
                    <polygon 
                      points={areaPoints.map(p => `${p.x},${p.y}`).join(' ')}
                      fill="rgba(255, 215, 0, 0.1)"
                      stroke="gold"
                      strokeWidth="2"
                      strokeDasharray="5,5"
                    />
                  </svg>
                )}
              </div>
            </div>
            
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button onClick={getDamageHints} className="rounded border py-2" data-testid="button-get-hints">
                {loadingHints? 'Finding hints…':'Get Damage Hints'}
              </button>
              <button onClick={suggestLabels} className="rounded border py-2" data-testid="button-suggest-labels">
                Suggest Labels
              </button>
            </div>
            
            <div className="mt-4">
              <label className="block text-sm font-medium mb-2">Caption</label>
              <input value={caption} onChange={(e)=>setCaption(e.target.value)} 
                className="w-full rounded border p-2" data-testid="input-caption" />
            </div>
            
            <div className="mt-4 p-3 border rounded bg-gray-50">
              <div className="text-sm font-medium mb-2">Calibration Status</div>
              <div className="text-xs text-gray-600">
                {scalePxPerInch? `Scale locked: ${scalePxPerInch.toFixed(2)} px/in (QR-calibrated)` : 'No scale set. Use Calibrate tab for accurate measurements.'}
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="font-medium mb-3">Damage Hints ({hints.length})</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {hints.map((h, i) => (
                <div key={i} className={`p-2 border rounded text-sm ${h.picked?'bg-green-50':''}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium text-xs">{h.label || 'Unlabeled'}</div>
                      <div className="text-xs text-gray-600">Score: {h.score}</div>
                      <div className="text-xs text-gray-500">({h.x},{h.y}) {h.w}×{h.h}</div>
                    </div>
                    {!h.picked && (
                      <button onClick={() => confirmHint(h)} 
                        className="text-xs bg-blue-500 text-white px-2 py-1 rounded"
                        data-testid={`button-confirm-hint-${i}`}>
                        Add
                      </button>
                    )}
                  </div>
                </div>
              ))}
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
    { id: 2, title: "Photo Documentation", content: "Detailed photographic evidence...", media: [] as string[] },
    { id: 3, title: "Recommendations", content: "Suggested remediation actions..." }
  ]);

  // Listen for auto-injection events from diameter measurements
  useEffect(()=>{
    function onOverlay(e: any){
      const { imageBase64, caption } = e.detail || {};
      if (!imageBase64) return;
      setSections(prev => {
        const copy = [...prev];
        // Find Photo Documentation section or create one
        let photoSection = copy.find(s => s.title === "Photo Documentation");
        if (!photoSection) {
          photoSection = { id: Date.now(), title: "Photo Documentation", content: "Measurement overlays and damage documentation", media: [] };
          copy.push(photoSection);
        }
        // Add overlay image to media array
        if (!photoSection.media) photoSection.media = [];
        photoSection.media.push(imageBase64);
        return copy;
      });
    }
    window.addEventListener('DL_ADD_OVERLAY_TO_REPORT', onOverlay as any);
    return ()=> window.removeEventListener('DL_ADD_OVERLAY_TO_REPORT', onOverlay as any);
  },[]);

  const addSection = () => {
    const title = prompt("Section title:");
    if (title) {
      setSections(prev => [...prev, {
        id: Date.now(),
        title,
        content: "New section content...",
        media: []
      }]);
    }
  };

  const updateSection = (id: number, field: 'title' | 'content', value: string) => {
    setSections(prev => prev.map(section => 
      section.id === id ? { ...section, [field]: value } : section
    ));
  };

  const removeMedia = (sectionId: number, mediaIndex: number) => {
    setSections(prev => prev.map(section => {
      if (section.id === sectionId && section.media) {
        const newMedia = [...section.media];
        newMedia.splice(mediaIndex, 1);
        return { ...section, media: newMedia };
      }
      return section;
    }));
  };

  const deleteSection = (id: number) => {
    setSections(prev => prev.filter(section => section.id !== id));
  };

  const generateReport = async () => {
    try {
      const payload = {
        title: reportTitle,
        projectTitle: "Disaster Lens - Professional Assessment",
        items: sections.flatMap((s) => {
          const textItems = [{ caption: `${s.title}: ${s.content}` }];
          const mediaItems = (s.media || []).map((media, idx) => ({
            caption: `${s.title} - Evidence ${idx + 1}`,
            imageBase64: media
          }));
          return [...textItems, ...mediaItems];
        })
      };
      
      const response = await fetch('/api/reports/demo/render', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(payload)
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
              📄 Generate PDF
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
              {section.media && section.media.length > 0 && (
                <div className="mt-4">
                  <div className="text-sm font-medium mb-2">Media ({section.media.length})</div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {section.media.map((media, i) => (
                      <div key={i} className="relative group">
                        <img src={media} className="w-full aspect-video object-cover rounded border" />
                        <button 
                          onClick={() => removeMedia(section.id, i)}
                          className="absolute top-1 right-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition"
                          data-testid={`button-remove-media-${section.id}-${i}`}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// --- Calibrate Tab (QR/Marker) ---
function CalibrateTab({ scalePxPerInch, setScalePxPerInch }: { scalePxPerInch: number | null, setScalePxPerInch: (v:number)=>void }){
  const [preview, setPreview] = useState("");
  const [markerInches, setMarkerInches] = useState(2.0);
  const [busy, setBusy] = useState(false);
  const [payload, setPayload] = useState("");

  async function onScan(){
    if (!preview) return;
    setBusy(true);
    try {
      const res = await fetch('/api/calibrate/qr', { 
        method:'POST', 
        headers:{'Content-Type':'application/json'}, 
        body: JSON.stringify({ imageBase64: preview, knownSizeMm: markerInches * 25.4 }) // Convert inches to mm
      });
      const data = await res.json();
      if (data.ok && data.pixelsPerInch){
        setScalePxPerInch(Number(data.pixelsPerInch));
        setPayload(String(data.payload||''));
      } else {
        alert(data.error || 'QR scan failed');
      }
    } finally { setBusy(false); }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 border rounded shadow">
        <h2 className="text-xl font-bold mb-4">QR Calibration</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-gray-600 mb-4">
              Place a known-size square QR (e.g., 2 in) in frame for automatic scale detection.
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Marker Size</label>
              <div className="flex items-center gap-2">
                <input 
                  type="number" 
                  step="0.1" 
                  value={markerInches} 
                  onChange={(e)=>setMarkerInches(Number(e.target.value||2))} 
                  className="rounded border p-2 w-28"
                  data-testid="input-marker-size"
                />
                <span className="text-sm">inches</span>
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Upload QR Image</label>
              <label className="cursor-pointer inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={async (e)=>{
                    const f=e.target.files?.[0]; 
                    if(!f) return; 
                    const b64 = await fileToBase64(f); 
                    setPreview(b64);
                  }} 
                  data-testid="input-qr-upload"
                />
                Choose Image
              </label>
            </div>
            
            <button 
              onClick={onScan} 
              disabled={!preview || busy}
              className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
              data-testid="button-scan-qr"
            >
              {busy ? 'Scanning QR...' : 'Scan & Calibrate'}
            </button>
            
            {scalePxPerInch && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
                <div className="text-sm font-medium text-green-800">✅ Calibration Complete</div>
                <div className="text-xs text-green-600">
                  Scale: {scalePxPerInch.toFixed(2)} pixels per inch
                </div>
                {payload && (
                  <div className="text-xs text-green-600 mt-1">
                    QR Data: {payload.slice(0, 50)}{payload.length > 50 ? '...' : ''}
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div>
            <div className="aspect-video w-full border rounded bg-gray-100 overflow-hidden">
              {preview ? (
                <img src={preview} className="w-full h-full object-contain" alt="QR preview" data-testid="image-qr-preview" />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  Upload a photo with the QR marker visible
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded">
          <h3 className="font-medium text-blue-800 mb-2">Tips for Best Results</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Ensure QR code is clearly visible and well-lit</li>
            <li>• Keep camera parallel to QR surface for accuracy</li>
            <li>• Standard business card QR codes are typically 2 inches</li>
            <li>• Calibration enables precise diameter measurements</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const tabs = ["Capture", "Timeline", "Annotator", "Calibrate", "Report Builder"] as const;
  const [tab, setTab] = useState<typeof tabs[number]>("Capture");
  const [scalePxPerInch, setScalePxPerInchState] = useState<number | null>(null);

  useEffect(()=>{
    const saved = localStorage.getItem('DL_scalePxPerInch');
    if (saved) setScalePxPerInchState(Number(saved));
  },[]);

  const setScalePxPerInch = (v:number) => {
    setScalePxPerInchState(v);
    localStorage.setItem('DL_scalePxPerInch', String(v));
  };

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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <StatCard label="Project Status" value="Active" sub="Job #DL-000271" />
          <StatCard label="Media" value="128 items" sub="Today + Yesterday" />
          <StatCard label="Reports" value="3 drafts" sub="1 final, 2 daily" />
          <StatCard 
            label="Calibration" 
            value={scalePxPerInch? `${scalePxPerInch.toFixed(2)} px/in` : 'Not set'} 
            sub={scalePxPerInch? 'QR-based' : 'Scan a QR in Calibrate tab'} 
          />
        </div>

        {tab === "Capture" && <CaptureTab />}
        {tab === "Timeline" && <TimelineTab />}
        {tab === "Annotator" && <AnnotatorTab scalePxPerInch={scalePxPerInch} />}
        {tab === "Calibrate" && <CalibrateTab scalePxPerInch={scalePxPerInch} setScalePxPerInch={setScalePxPerInch} />}
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