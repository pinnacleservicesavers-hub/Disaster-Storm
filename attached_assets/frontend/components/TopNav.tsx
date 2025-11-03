
"use client";
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { auth, type Role } from '@/lib/auth';
import Breadcrumbs from '@/components/Breadcrumbs';

export default function TopNav(){
  const [role, setRole] = useState<Role>('contractor');
  const [user, setUser] = useState('user');
  const [hasToken, setHasToken] = useState(false);

  useEffect(()=>{
    const s = auth.getSession();
    if(s){ setRole(s.role); setUser(s.userId); setHasToken(Boolean(s.token)); }
  },[]);

  const updateRole = (r: Role)=>{
    setRole(r);
    auth.setSession({ role: r, userId: user, scopes: [] });
    location.reload();
  };
  const logout = ()=>{
    auth.clear();
    location.href = '/signout';
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="font-bold">Storm&nbsp;Disaster</Link>
            <nav className="hidden md:flex items-center gap-2 text-sm">
              <Link href="/contractor" className="px-2 py-1 rounded hover:bg-gray-100">Contractor</Link>
              <Link href="/admin" className="px-2 py-1 rounded hover:bg-gray-100">Admin</Link>
              <Link href="/homeowner" className="px-2 py-1 rounded hover:bg-gray-100">Homeowner</Link>
            </nav>
          </div>
          <div className="flex items-center gap-2 text-sm">
            {!hasToken ? (
              <button className="px-3 py-1 border rounded" onClick={()=>auth.login()}>Login</button>
            ) : (
              <>
                <span className="text-gray-500 hidden sm:inline">Role:</span>
                <select className="border p-1 rounded" value={role} onChange={e=>updateRole(e.target.value as Role)}>
                  <option value="admin">admin</option>
                  <option value="contractor">contractor</option>
                  <option value="homeowner">homeowner</option>
                </select>
                <span className="hidden md:inline text-gray-500">|</span>
                <span className="hidden md:inline text-gray-600">User:</span>
                <input
                  className="border p-1 rounded w-36 hidden md:inline"
                  defaultValue={user}
                  onBlur={(e)=>{ setUser(e.target.value); auth.setSession({ role, userId: e.target.value, scopes: [] }); }}
                />
                <button className="ml-2 px-2 py-1 border rounded hover:bg-gray-100" onClick={logout}>Logout</button>
              </>
            )}
          </div>
        </div>
      </header>
      <div className="max-w-6xl mx-auto px-4">
        <Breadcrumbs />
      </div>
    </>
  );
}
