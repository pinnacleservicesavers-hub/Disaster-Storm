
"use client";
import { useState } from 'react';
import { auth } from '@/lib/auth';

function makeFakeJwt(payload: any){
  // This is ONLY for local testing: header.payload.signature (no real signing)
  const enc = (obj:any)=> btoa(JSON.stringify(obj)).replace(/=+$/,'').replace(/\+/g,'-').replace(/\//g,'_');
  return `${enc({alg:'none',typ:'JWT'})}.${enc(payload)}.`;
}

export default function Login(){
  const [role, setRole] = useState<'admin'|'contractor'|'homeowner'>('contractor');
  const [userId, setUserId] = useState('user-123');

  const localLogin = ()=>{
    const token = makeFakeJwt({ sub: userId, role });
    auth.setSession({ role, userId, token, scopes: [] });
    window.location.href = '/';
  };

  return (
    <main className="p-10 max-w-md mx-auto space-y-4">
      <h1 className="text-2xl font-bold">Sign in</h1>
      <p className="text-sm text-gray-600">For now, this creates a local session and a demo JWT.</p>
      <div className="grid gap-2">
        <label className="text-sm">Role
          <select className="border p-2 w-full" value={role} onChange={e=>setRole(e.target.value as any)}>
            <option value="admin">admin</option>
            <option value="contractor">contractor</option>
            <option value="homeowner">homeowner</option>
          </select>
        </label>
        <label className="text-sm">User ID
          <input className="border p-2 w-full" value={userId} onChange={e=>setUserId(e.target.value)} />
        </label>
      </div>
      <div className="flex items-center gap-2">
        <button className="px-3 py-1 border rounded" onClick={localLogin}>Continue</button>
      </div>
      <p className="text-xs text-gray-500">Swap to a real provider by setting <code>NEXT_PUBLIC_AUTH_PROVIDER</code> and implementing provider redirects.</p>
    </main>
  );
}
