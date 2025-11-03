
"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export default function SMTPAdmin(){
  const [host, setHost] = useState("");
  const [port, setPort] = useState(587);
  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");
  const [useTLS, setUseTLS] = useState(true);
  const [testTo, setTestTo] = useState("");

  const load = async()=>{
    try{
      const j = await api('/admin/smtp');
      const s = j.smtp || {};
      setHost(s.host||""); setPort(Number(s.port||587)); setUser(s.user||""); setUseTLS(Boolean(s.use_tls ?? true));
    }catch(e){}
  };
  useEffect(()=>{ load(); },[]);

  const save = async()=>{
    try{
      await api('/admin/smtp', { method:'POST', body: JSON.stringify({ host, port, user, password, use_tls: useTLS }) });
      alert('Saved SMTP settings');
    }catch(e:any){ alert(e?.message||'Failed'); }
  };
  const test = async()=>{
    try{
      const j = await api(`/admin/smtp/test?to=${encodeURIComponent(testTo)}`, { method:'POST' });
      if(j.ok) alert('Test send OK'); else alert('Failed: '+(j.error||'unknown'));
    }catch(e:any){ alert(e?.message||'Failed'); }
  };

  return (
    <main className="p-8 space-y-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold">SMTP Settings</h1>
      <div className="grid grid-cols-1 gap-2">
        <label className="text-sm">Host<input className="border p-2 w-full" value={host} onChange={e=>setHost(e.target.value)} /></label>
        <label className="text-sm">Port<input type="number" className="border p-2 w-full" value={port} onChange={e=>setPort(parseInt(e.target.value||'587',10))} /></label>
        <label className="text-sm">User<input className="border p-2 w-full" value={user} onChange={e=>setUser(e.target.value)} /></label>
        <label className="text-sm">Password<input type="password" className="border p-2 w-full" value={password} onChange={e=>setPassword(e.target.value)} /></label>
        <label className="text-sm inline-flex items-center gap-2"><input type="checkbox" checked={useTLS} onChange={e=>setUseTLS(e.target.checked)} /> Use TLS</label>
      </div>
      <div className="flex items-center gap-2">
        <button className="px-3 py-1 border rounded" onClick={save}>Save</button>
        <input className="border p-2" placeholder="test@example.com" value={testTo} onChange={e=>setTestTo(e.target.value)} />
        <button className="px-3 py-1 border rounded" onClick={test}>Send test</button>
      </div>
      <p className="text-xs text-gray-500">We won't display stored passwords on load. Save again if you need to update it.</p>
    </main>
  );
}
