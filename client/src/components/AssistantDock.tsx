import React, { useEffect, useRef, useState } from 'react';

interface AssistantDockProps {
  projectId?: string;
  mediaId?: string;
}

export default function AssistantDock({ projectId = 'DEMO', mediaId }: AssistantDockProps = {}) {
  const [open, setOpen] = useState(true);
  const [msgs, setMsgs] = useState<{role:'user'|'assistant'|'system', text:string}[]>([]);
  const wsRef = useRef<WebSocket|null>(null);
  const mediaRecorderRef = useRef<MediaRecorder|null>(null);

  useEffect(() => {
    const proto = location.protocol==='https:'?'wss':'ws';
    const ws = new WebSocket(`${proto}://${location.host}/ws/assistant`);
    wsRef.current = ws;
    ws.addEventListener('open', () => ws.send(JSON.stringify({ type:'start', projectId, mode:'ask' })));
    ws.addEventListener('message', (ev) => {
      try {
        const m = JSON.parse(ev.data);
        if (m.type === 'assistant_text') setMsgs((s)=>[...s,{role:'assistant',text:m.text}]);
        if (m.type === 'partial_transcript') setMsgs((s)=>[...s,{role:'system',text:`…${m.text}` }]);
        if (m.type === 'tool_call') setMsgs((s)=>[...s,{role:'system', text:`[Tool] ${m.name}` }]);
      } catch {}
    });
    return () => ws.close();
  }, [projectId]);

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
      mr.start(300);
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  };

  const stopPTT = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream?.getTracks().forEach(track => track.stop());
    }
  };

  return (
    <div className="fixed right-4 bottom-4 w-96">
      <div className="rounded-2xl shadow-xl border bg-white overflow-hidden">
        <div className="px-3 py-2 flex items-center justify-between">
          <div className="font-medium">AI Assistant</div>
          <button onClick={()=>setOpen(!open)} className="text-sm">{open? '—':'+'}</button>
        </div>
        {open && (
          <>
            <div className="h-56 overflow-auto space-y-2 px-3 py-2 bg-gray-50">
              {msgs.map((m,i)=> (
                <div key={i} className={`text-sm ${m.role==='user'?'text-right':''}`}>
                  <span className={`inline-block px-2 py-1 rounded-xl ${m.role==='user'?'bg-black text-white':'bg-white border'}`}>{m.text}</span>
                </div>
              ))}
            </div>
            <div className="p-2 border-t flex items-center gap-2">
              <button onMouseDown={startPTT} onMouseUp={stopPTT} className="px-3 py-1.5 rounded-xl border">🎙️ Hold</button>
              <input id="aiText" placeholder="Ask about this project…" className="flex-1 rounded-xl border px-2 py-1.5" onKeyDown={(e)=>{
                if(e.key==='Enter'){
                  const v=(e.target as HTMLInputElement).value.trim();
                  if(v){ sendText(v); (e.target as HTMLInputElement).value=''; }
                }
              }} />
              <button className="px-3 py-1.5 rounded-xl bg-black text-white" onClick={()=>{
                const el = document.getElementById('aiText') as HTMLInputElement; const v=el.value.trim(); if(v){ sendText(v); el.value=''; }
              }}>Send</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}