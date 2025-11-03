"use client";
import { useEffect, useState } from "react";
export default function AuthStub(){
  const [role, setRole] = useState('admin');
  const [user, setUser] = useState('demo-admin');
  const [scopes, setScopes] = useState('');
  useEffect(()=>{
    try{ const r=localStorage.getItem('role'); if(r) setRole(r);
      const u=localStorage.getItem('user_id'); if(u) setUser(u);
      const s=localStorage.getItem('scopes'); if(s) setScopes(s); }catch{}
  },[]);
  const save=()=>{ localStorage.setItem('role', role); localStorage.setItem('user_id', user); localStorage.setItem('scopes', scopes); alert('Saved'); };
  return (<main className="p-8 space-y-4 max-w-xl mx-auto">
    <h1 className="text-2xl font-bold">Auth Stub</h1>
    <div className="grid gap-2">
      <label className="text-sm">Role<select className="border p-2 w-full" value={role} onChange={e=>setRole(e.target.value)}>
        <option value="admin">admin</option><option value="contractor">contractor</option><option value="homeowner">homeowner</option></select></label>
      <label className="text-sm">User ID<input className="border p-2 w-full" value={user} onChange={e=>setUser(e.target.value)} /></label>
      <label className="text-sm">Scopes<input className="border p-2 w-full" value={scopes} onChange={e=>setScopes(e.target.value)} /></label>
    </div>
    <button className="px-3 py-1 border rounded" onClick={save}>Save</button>
    <p className="text-xs text-gray-500">Demo-only auth. Replace with your real auth later.</p>
  </main>);
}
