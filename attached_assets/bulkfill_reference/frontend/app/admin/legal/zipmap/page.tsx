
"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export default function ZipMapAdmin(){
  const [count, setCount] = useState<number>(0);
  const [sample, setSample] = useState<any>({});
  const [text, setText] = useState<string>("");
  const [busy, setBusy] = useState<boolean>(false);
  const load = async()=>{
    try{
      const j = await api('/admin/legal/zipmap');
      setCount(j.count||0);
      setSample(j.sample||{});
    }catch(e){}
  };
  useEffect(()=>{ load(); },[]);
  const save = async()=>{
    setBusy(true);
    try{
      const mapping = JSON.parse(text||"{}");
      const j = await api('/admin/legal/zipmap', { method:'POST', body: JSON.stringify({ mapping })});
      alert(`Saved ${j.count} prefixes`);
      setText("");
      load();
    }catch(e: any){
      alert(`Failed: ${e?.message||e}`);
    }finally{
      setBusy(false);
    }
  };
  const loadDefault = async()=>{
    setBusy(true);
    try{
      const j = await api('/admin/legal/zipmap/load_default', { method:'POST' });
      alert(`Loaded default (${j.count} prefixes)`);
      load();
    }catch(e: any){
      alert(`Failed: ${e?.message||e}`);
    }finally{
      setBusy(false);
    }
  };
  return (
    <main className="p-8 space-y-4 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold">ZIP → State Map</h1>
      <div className="text-sm text-gray-600">Current entries: <b>{count}</b></div>
      <div className="text-xs text-gray-500">Sample:</div>
      <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-48">{JSON.stringify(sample, null, 2)}</pre>

      <section className="border rounded p-3 space-y-2">
        <div className="font-semibold">Upload / Paste JSON mapping</div>
        <textarea className="border p-2 w-full h-64 font-mono text-xs" placeholder='{"005":"NY","370":"TN","9":"CA"}' value={text} onChange={e=>setText(e.target.value)} />
        <div className="flex items-center gap-2">
          <button className="px-3 py-1 border rounded" disabled={busy} onClick={save}>Save</button>
          <button className="px-3 py-1 border rounded" disabled={busy} onClick={loadDefault}>Load default</button>
          <button className="px-3 py-1 border rounded" onClick={load}>Refresh</button>
        </div>
        <div className="text-xs text-gray-500">
          Longest prefix wins (e.g., "336" overrides "33"). You can paste 1–3 digit prefixes for performance.
        </div>
      </section>
    
      <section className="border rounded p-3 space-y-2">
        <div className="font-semibold">Upload CSV file (prefix,state)</div>
        <input id="csvFile" type="file" accept=".csv,text/csv" className="border p-2" onChange={async (e)=>{
          const file = e.target.files?.[0];
          if(!file) return;
          const text = await file.text();
          const mapping: Record<string,string> = {};
          for(const rawLine of text.split(/\r?\n/)){
            const line = rawLine.trim();
            if(!line) continue;
            const parts = line.split(/,\s*/);
            if(parts.length>=2){
              const pref = String(parts[0]).replace(/\D+/g,''); // digits only
              const st = String(parts[1]).trim().toUpperCase();
              if(pref) mapping[pref] = st;
            }
          }
          try{
            const j = await api('/admin/legal/zipmap', { method:'POST', body: JSON.stringify({ mapping }) });
            alert(`Saved ${j.count} prefixes from CSV`);
          }catch(e:any){ alert(e?.message||'Failed'); }
        }} />
        <div className="text-xs text-gray-500">Format: one row per mapping, e.g. <code>336,FL</code></div>
      </section>

    </main>
  );
}
