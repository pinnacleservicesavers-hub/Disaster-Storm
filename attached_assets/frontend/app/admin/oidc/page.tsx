
"use client";
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function OIDCAdmin(){
  const [issuer, setIssuer] = useState('');
  const [audience, setAudience] = useState('');
  const [enforce, setEnforce] = useState(true);
  const [keys, setKeys] = useState<number>(0);

  const load = async()=>{
    try{
      const j = await api('/admin/oidc');
      const o = j.oidc || {};
      setIssuer(o.issuer || '');
      setAudience(o.audience || '');
      setEnforce(Boolean(o.enforce ?? true));
      setKeys(Number(o.jwks_keys || 0));
    }catch(e){}
  };
  useEffect(()=>{ load(); },[]);

  const save = async()=>{
    await api('/admin/oidc', { method:'POST', body: JSON.stringify({ issuer, audience, enforce }) });
    alert('Saved');
  };
  const refreshJWKS = async()=>{
    const j = await api('/admin/oidc/refresh_jwks', { method:'POST' });
    if(j.ok){ setKeys(j.keys || 0); alert(`Loaded ${j.keys} keys`); } else { alert(j.error || 'Failed'); }
  };

  return (
    <main className="p-8 space-y-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold">OIDC / JWT Settings</h1>
      <div className="grid gap-2">
        <label className="text-sm">Issuer (https://YOUR_DOMAIN/) <input className="border p-2 w-full" value={issuer} onChange={e=>setIssuer(e.target.value)} /></label>
        <label className="text-sm">Audience (API Identifier) <input className="border p-2 w-full" value={audience} onChange={e=>setAudience(e.target.value)} /></label>
        <label className="text-sm inline-flex items-center gap-2"><input type="checkbox" checked={enforce} onChange={e=>setEnforce(e.target.checked)} /> Enforce verification</label>
      </div>
      <div className="flex items-center gap-2">
        <button className="px-3 py-1 border rounded" onClick={save}>Save</button>
        <button className="px-3 py-1 border rounded" onClick={refreshJWKS}>Refresh JWKS</button>
        <span className="text-xs text-gray-600">Keys cached: <b>{keys}</b></span>
      </div>
      <p className="text-xs text-gray-500">When enforcement is ON, unverified or missing tokens will be rejected with 401.</p>
    </main>
  );
}
