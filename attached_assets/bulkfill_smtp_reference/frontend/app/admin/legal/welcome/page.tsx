
"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export default function WelcomeTemplates(){
  const [state, setState] = useState("FL");
  const [text, setText] = useState("");

  const load = async()=>{
    try{
      const j = await api(`/admin/legal/welcome/${state}`);
      setText(j.welcome_text || "");
    }catch(e){ setText(""); }
  };
  useEffect(()=>{ load(); }, [state]);

  const save = async()=>{
    try{
      await api('/admin/legal/welcome', { method:'POST', body: JSON.stringify({ state, welcome_text: text })});
      alert('Saved');
    }catch(e:any){ alert(e?.message||'Failed'); }
  };

  return (
    <main className="p-8 space-y-4 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold">Per-state Welcome / Rights Letter</h1>
      <div className="flex items-center gap-2">
        <label className="text-sm">State</label>
        <select className="border p-2" value={state} onChange={e=>setState(e.target.value)}>
          {["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <button className="px-3 py-1 border rounded" onClick={load}>Load</button>
        <button className="px-3 py-1 border rounded" onClick={save}>Save</button>
      </div>
      <textarea className="border p-2 w-full h-96 font-sans" placeholder="Enter welcome/rights letter HTML..." value={text} onChange={e=>setText(e.target.value)} />
      <p className="text-xs text-gray-500">This HTML will be used when a job's state is first set. If blank, we fall back to boilerplate or a generic welcome note.</p>
    </main>
  );
}
