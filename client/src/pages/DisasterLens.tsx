import React, { useEffect, useMemo, useRef, useState } from "react";

// Single-file demo UI for Disaster Lens
// Tabs: Capture, Timeline, Annotator, Report Builder
// Styling: TailwindCSS classes
// NOTE: This is a front-end scaffold. Buttons are now wired to your Express API.

// ------------------------------
// AI Assistant Dock Component
// ------------------------------
function AssistantDock() {
  const [open, setOpen] = useState(true);
  const [msgs, setMsgs] = useState<{role:'user'|'assistant'|'system', text:string}[]>([]);
  const wsRef = useRef<WebSocket|null>(null);
  const mediaRecorderRef = useRef<MediaRecorder|null>(null);

  useEffect(() => {
    const ws = new WebSocket(`${location.protocol==='https:'?'wss':'ws'}://${location.host}/ws/assistant`);
    wsRef.current = ws;
    ws.addEventListener('open', () => ws.send(JSON.stringify({ type:'start', projectId:'DEMO', mode:'ask' })));
    ws.addEventListener('message', (ev) => {
      const m = JSON.parse(ev.data);
      if (m.type === 'assistant_text') setMsgs((s)=>[...s,{role:'assistant',text:m.text}]);
      if (m.type === 'partial_transcript') setMsgs((s)=>[...s,{role:'system',text:`…${m.text}` }]);
      if (m.type === 'tool_call') {
        // Optimistically show intent
        setMsgs((s)=>[...s,{role:'system', text:`[Tool] ${m.name}` }]);
        // Optionally call REST endpoint to perform
      }
    });
    return () => ws.close();
  }, []);

  const sendText = (text:string) => {
    wsRef.current?.send(JSON.stringify({ type:'user_text', text }));
    setMsgs((s)=>[...s,{role:'user',text}]);
  };

  const startPTT = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio:true });
      const mr = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
      mediaRecorderRef.current = mr;
      mr.ondataavailable = (e) => e.data.arrayBuffer().then(buf => wsRef.current?.send(JSON.stringify({ type:'user_audio', pcm: Array.from(new Uint8Array(buf)) })));
      mr.start(250);
    } catch (err) {
      console.error('Microphone access denied:', err);
    }
  };
  const stopPTT = () => mediaRecorderRef.current?.stop();

  return (
    <div className={`fixed right-4 bottom-4 w-96 ${open?'':'translate-y-[calc(100%+16px)]'} transition z-50`}>
      <div className="rounded-2xl shadow-xl border bg-white overflow-hidden">
        <div className="px-3 py-2 flex items-center justify-between bg-black text-white">
          <div className="font-medium">🤖 AI Assistant</div>
          <button onClick={()=>setOpen(false)} className="text-sm hover:text-gray-300">×</button>
        </div>
        <div className="h-64 overflow-auto space-y-2 px-3 py-2 bg-gray-50">
          {msgs.length === 0 && (
            <div className="text-sm text-gray-500 text-center py-8">
              <div className="mb-2">🎙️ Assistant ready</div>
              <div>Try: "Circle the damage area" or "Measure the tree diameter"</div>
            </div>
          )}
          {msgs.map((m,i)=> (
            <div key={i} className={`text-sm ${m.role==='user'?'text-right':''}`}>
              <span className={`inline-block px-2 py-1 rounded-xl max-w-[280px] ${
                m.role==='user'?'bg-black text-white':
                m.role==='system'?'bg-blue-100 text-blue-800':
                'bg-white border'
              }`}>{m.text}</span>
            </div>
          ))}
        </div>
        <div className="p-2 border-t flex items-center gap-2">
          <button 
            onMouseDown={startPTT} 
            onMouseUp={stopPTT} 
            className="px-3 py-1.5 rounded-xl border hover:bg-gray-50"
            data-testid="button-voice-ptt"
          >
            🎙️ Hold to talk
          </button>
          <input 
            id="aiText" 
            placeholder="Ask about this project…" 
            className="flex-1 rounded-xl border px-2 py-1.5" 
            onKeyDown={(e)=>{
              if(e.key==='Enter'){
                const v=(e.target as HTMLInputElement).value.trim();
                if(v){ sendText(v); (e.target as HTMLInputElement).value=''; }
              }
            }} 
            data-testid="input-ai-text"
          />
          <button 
            className="px-3 py-1.5 rounded-xl bg-black text-white hover:bg-gray-800" 
            onClick={()=>{
              const el = document.getElementById('aiText') as HTMLInputElement; 
              const v=el.value.trim(); 
              if(v){ sendText(v); el.value=''; }
            }}
            data-testid="button-ai-send"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

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
      const w = workerRef.current;
      if (!w) return reject(new Error("worker not ready"));
      const onMessage = (ev: MessageEvent) => {
        const { ok, hex, error } = ev.data || {};
        w.removeEventListener('message', onMessage);
        if (ok) resolve(hex); else reject(new Error(error || 'hash failed'));
      };
      w.addEventListener('message', onMessage);
      w.postMessage(buf, [buf as any]);
    });
  };
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-2xl text-sm font-medium shadow-sm transition hover:shadow ${active ? "bg-black text-white" : "bg-white text-gray-800 border"}`}
    >
      {children}
    </button>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl border p-4 shadow-sm bg-white">
      <div className="text-xs uppercase tracking-wider text-gray-500">{label}</div>
      <div className="text-2xl font-semibold mt-1 break-all">{value}</div>
      {sub && <div className="text-xs text-gray-500 mt-1">{sub}</div>}
    </div>
  );
}

// --- Capture Tab ---
function CaptureTab() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [streamOn, setStreamOn] = useState(false);
  const [shots, setShots] = useState<{ url: string; hash: string }[]>([]);
  const [useRear, setUseRear] = useState(true);
  const [note, setNote] = useState("");
  const hashWorker = useHashWorker();

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: useRear ? { ideal: "environment" } : "user" },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await (videoRef.current as HTMLVideoElement).play();
        setStreamOn(true);
      }
    } catch (e) {
      alert("Camera not available in preview. You can still use the UI.");
    }
  }
  
  function stopCamera() {
    const vid = videoRef.current as HTMLVideoElement | null;
    const stream = vid && (vid.srcObject as MediaStream);
    stream?.getTracks().forEach((t) => t.stop());
    setStreamOn(false);
  }
  
  async function takeShot() {
    const video = videoRef.current as HTMLVideoElement | null;
    const canvas = canvasRef.current as HTMLCanvasElement | null;
    if (!video || !canvas) return;
    const w = video.videoWidth || 640;
    const h = video.videoHeight || 360;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, w, h);
    // Watermark sample
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(0, h - 26, w, 26);
    ctx.fillStyle = "#fff";
    ctx.font = "14px sans-serif";
    const ts = new Date().toISOString();
    ctx.fillText(`Disaster Lens • ${ts}`, 8, h - 8);

    // Convert to Blob → ArrayBuffer for hashing
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const ab = await blob.arrayBuffer();
      const hex = await hashWorker(ab);
      const url = URL.createObjectURL(blob);
      setShots((s) => [{ url, hash: hex }, ...s]);
    }, 'image/png');
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 rounded-2xl border p-4 bg-white shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="text-lg font-semibold">Capture</div>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1.5 rounded-xl border" onClick={() => setUseRear((v) => !v)}>
              {useRear ? "Rear" : "Front"}
            </button>
            {!streamOn ? (
              <button className="px-3 py-1.5 rounded-xl bg-black text-white" onClick={startCamera}>Start</button>
            ) : (
              <button className="px-3 py-1.5 rounded-xl bg-red-600 text-white" onClick={stopCamera}>Stop</button>
            )}
            <button className="px-3 py-1.5 rounded-xl border" onClick={takeShot} data-testid="button-take-shot">Snap</button>
          </div>
        </div>
        <div className="aspect-video w-full bg-black/5 rounded-xl overflow-hidden flex items-center justify-center">
          <video ref={videoRef} className="w-full" playsInline muted />
        </div>
        <canvas ref={canvasRef} className="hidden" />
        <div className="mt-4">
          <label className="text-sm text-gray-700">Quick note (auto-caption)</label>
          <textarea 
            value={note} 
            onChange={(e)=>setNote(e.target.value)} 
            placeholder="e.g., Split trunk over fence; live line nearby"
            className="mt-1 w-full rounded-xl border p-2" 
            rows={3}
            data-testid="input-note"
          />
        </div>
      </div>
      <div className="space-y-3">
        <StatCard label="Project" value="Michael Thomas — Pecan Removal" sub="5385 Westwood Dr, Columbus, GA" />
        <StatCard label="Chain-of-Custody" value="SHA-256 on save" sub="Hash printed in reports" />
        <div className="rounded-2xl border p-3 bg-white">
          <div className="font-semibold mb-2">Recent Shots</div>
          <div className="grid grid-cols-3 gap-2">
            {shots.map((s, i) => (
              <div key={i} className="relative group" data-testid={`shot-${i}`}>
                <img src={s.url} className="rounded-xl border" alt={`Shot ${i}`} />
                <div className="absolute inset-x-0 bottom-0 text-[10px] p-1 bg-black/60 text-white rounded-b-xl opacity-0 group-hover:opacity-100 transition">
                  {s.hash.slice(0,16)}…
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Timeline Tab ---
function TimelineItem({ img, title, meta }: { img: string; title: string; meta: string }) {
  return (
    <div className="flex gap-3 p-3 rounded-xl border bg-white">
      <img src={img} className="w-28 h-20 object-cover rounded-lg border" alt={title} />
      <div>
        <div className="font-medium">{title}</div>
        <div className="text-xs text-gray-500">{meta}</div>
      </div>
    </div>
  );
}

function TimelineTab() {
  const demo = new Array(6).fill(0).map((_, i) => ({
    img: `https://picsum.photos/seed/${i + 2}/320/180`,
    title: i === 0 ? "Before — Split trunk over fence" : i < 4 ? "During — sectional lowering" : "After — cleanup complete",
    meta: `By Brian • ${new Date(Date.now() - i * 3.6e6).toLocaleString()}`,
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-3">
        {demo.map((d, i) => (
          <TimelineItem key={i} {...d} />
        ))}
      </div>
      <div className="space-y-3">
        <div className="rounded-2xl border p-4 bg-white">
          <div className="font-semibold mb-2">Filters</div>
          <div className="flex flex-wrap gap-2">
            {["hazard", "estimate", "work", "complete"].map((t) => (
              <button key={t} className="px-3 py-1.5 rounded-full border text-sm" data-testid={`filter-${t}`}>#{t}</button>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button className="rounded-xl border p-2" data-testid="filter-photos">Photos</button>
            <button className="rounded-xl border p-2" data-testid="filter-videos">Videos</button>
            <button className="rounded-xl border p-2" data-testid="filter-mine">Mine</button>
            <button className="rounded-xl border p-2" data-testid="filter-crew">Crew</button>
          </div>
        </div>
        <div className="rounded-2xl border p-4 bg-white">
          <div className="font-semibold mb-2">Pinned Notes</div>
          <ul className="text-sm list-disc pl-5 space-y-1">
            <li>Use crane access only — soft yard</li>
            <li>Call homeowner before arrival</li>
            <li>Document fence damage thoroughly</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// --- Annotator Tab (simple mock) ---
function AnnotatorTab() {
  const [brush, setBrush] = useState<'arrow'|'box'|'text'|'blur'|'measure'>("box");
  const [caption, setCaption] = useState("Cracked limb over structure — immediate removal recommended.");

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="rounded-2xl border p-4 bg-white lg:col-span-2">
        <div className="mb-2 flex items-center gap-2">
          {(["arrow","box","text","blur","measure"] as const).map((b)=> (
            <button 
              key={b} 
              onClick={()=>setBrush(b)} 
              className={`px-3 py-1.5 rounded-xl border text-sm ${brush===b?"bg-black text-white":""}`}
              data-testid={`brush-${b}`}
            >
              {b}
            </button>
          ))}
        </div>
        <div className="aspect-video w-full rounded-xl overflow-hidden border relative">
          <img src="https://picsum.photos/seed/annotate/1200/675" className="w-full h-full object-cover" alt="Annotation target" />
          {/* Mock overlay */}
          <div className="absolute inset-0 pointer-events-none">
            {brush === "box" && (
              <div className="absolute left-12 top-10 w-40 h-20 border-4 border-red-500 rounded" />
            )}
            {brush === "arrow" && (
              <div className="absolute left-56 top-16 w-28 h-1 bg-red-500 rotate-12 origin-left" />
            )}
            {brush === "blur" && (
              <div className="absolute right-10 bottom-12 w-24 h-10 backdrop-blur" />
            )}
          </div>
        </div>
        <div className="mt-3">
          <label className="text-sm text-gray-700">Caption</label>
          <input 
            value={caption} 
            onChange={(e)=>setCaption(e.target.value)} 
            className="mt-1 w-full rounded-xl border p-2"
            data-testid="input-caption"
          />
        </div>
      </div>
      <div className="space-y-3">
        <div className="rounded-2xl border p-4 bg-white">
          <div className="font-semibold mb-2">Annotation Notes</div>
          <p className="text-sm text-gray-700">Use <b>blur</b> on house numbers/license plates for public shares. Measurements are estimates.</p>
        </div>
        <div className="rounded-2xl border p-4 bg-white">
          <div className="font-semibold mb-2">Annotation Tools</div>
          <div className="space-y-2 text-sm">
            <div><b>Arrow:</b> Point to specific damage</div>
            <div><b>Box:</b> Highlight affected areas</div>
            <div><b>Text:</b> Add labels and notes</div>
            <div><b>Blur:</b> Redact sensitive info</div>
            <div><b>Measure:</b> Approximate distances</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Report Builder Tab ---
function ReportBuilderTab() {
  const [title, setTitle] = useState("Storm Tree Removal — Final Report");
  const [kind, setKind] = useState("final");
  const [sections, setSections] = useState([
    { title: "Before", media: ["https://picsum.photos/seed/b1/600/340", "https://picsum.photos/seed/b2/600/340"] },
    { title: "During", media: ["https://picsum.photos/seed/d1/600/340"] },
    { title: "After", media: ["https://picsum.photos/seed/a1/600/340", "https://picsum.photos/seed/a2/600/340"] },
  ]);

  function addSection() {
    setSections((s) => [...s, { title: `Section ${s.length + 1}`, media: [] }]);
  }

  // ---- Wired Buttons ----
  async function onRenderPdf() {
    const payload = {
      title,
      projectTitle: "Michael Thomas — Pecan Removal",
      items: sections.flatMap((s) => s.media.map((_, idx) => ({ caption: `${s.title} — item ${idx+1}` })))
    };
    try {
      const res = await fetch(`/api/reports/demo/render`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (error) {
      alert('Error rendering PDF: ' + error);
    }
  }

  async function onCreateShare() {
    try {
      const res = await fetch(`/api/shares`, { method: 'POST' });
      const data = await res.json();
      await navigator.clipboard.writeText(data.url);
      alert(`Share link copied to clipboard!\n${data.url}`);
    } catch {
      alert('Error creating share link');
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="rounded-2xl border p-4 bg-white lg:col-span-2">
        <div className="flex items-center gap-3 mb-3">
          <input 
            value={title} 
            onChange={(e)=>setTitle(e.target.value)} 
            className="flex-1 rounded-xl border p-2"
            data-testid="input-title"
          />
          <select 
            value={kind} 
            onChange={(e)=>setKind(e.target.value)} 
            className="rounded-xl border p-2"
            data-testid="select-kind"
          >
            <option value="photo">Photo</option>
            <option value="daily">Daily</option>
            <option value="final">Final</option>
            <option value="insurance_packet">Insurance Packet</option>
          </select>
          <button onClick={addSection} className="px-3 py-1.5 rounded-xl border" data-testid="button-add-section">Add Section</button>
        </div>

        <div className="space-y-4">
          {sections.map((s, i) => (
            <div key={i} className="rounded-xl border p-3" data-testid={`section-${i}`}>
              <div className="flex items-center justify-between mb-2">
                <input 
                  defaultValue={s.title} 
                  className="text-lg font-semibold bg-transparent" 
                  onBlur={(e)=>{
                    const v = e.target.value; 
                    setSections((prev)=> prev.map((it,idx)=> idx===i? {...it, title:v}: it));
                  }} 
                  data-testid={`section-title-${i}`}
                />
                <button 
                  className="text-sm text-red-600" 
                  onClick={()=> setSections((prev)=> prev.filter((_,idx)=> idx!==i))}
                  data-testid={`remove-section-${i}`}
                >
                  Remove
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {s.media.map((m, j) => (
                  <div key={j} className="relative" data-testid={`media-${i}-${j}`}>
                    <img src={m} className="w-full h-32 object-cover rounded-lg border" alt={`Media ${j}`} />
                    <button 
                      className="absolute -top-2 -right-2 bg-white border rounded-full w-6 h-6 text-xs" 
                      onClick={()=>{
                        setSections((prev)=> prev.map((it,idx)=> idx!==i? it: { ...it, media: it.media.filter((_,k)=>k!==j) }));
                      }}
                      data-testid={`remove-media-${i}-${j}`}
                    >
                      ×
                    </button>
                  </div>
                ))}
                <label className="h-32 border-2 border-dashed rounded-lg flex items-center justify-center text-sm text-gray-500 cursor-pointer" data-testid={`add-media-${i}`}>
                  + Add
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={(e)=>{
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = () => {
                        setSections((prev)=> prev.map((it,idx)=> idx!==i? it: { ...it, media: [...it.media, String(reader.result)] }));
                      };
                      reader.readAsDataURL(file);
                    }} 
                  />
                </label>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-3">
        <div className="rounded-2xl border p-4 bg-white">
          <div className="font-semibold mb-2">Branding</div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-black" />
            <div>
              <div className="text-sm font-medium">Strategic Land Management LLC</div>
              <div className="text-xs text-gray-500">Logo + primary color</div>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border p-4 bg-white">
          <div className="font-semibold mb-2">Export</div>
          <button 
            onClick={onRenderPdf} 
            className="w-full rounded-xl bg-black text-white py-2"
            data-testid="button-render-pdf"
          >
            Render PDF
          </button>
          <button 
            onClick={onCreateShare} 
            className="w-full rounded-xl border py-2 mt-2"
            data-testid="button-create-share"
          >
            Create Share Link
          </button>
          <p className="text-xs text-gray-500 mt-2">PDF footer includes chain-of-custody hash and GPS/time.</p>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const tabs = ["Capture", "Timeline", "Annotator", "Report Builder"] as const;
  const [tab, setTab] = useState<typeof tabs[number]>("Capture");

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
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