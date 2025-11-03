"use client";
import { useEffect, useState } from "react";
export default function AdminGuard({ children }: { children: React.ReactNode }){
  const [allowed, setAllowed] = useState<boolean | null>(null);
  useEffect(()=>{
    try{
      const role = (localStorage.getItem('role') || '').toLowerCase();
      setAllowed(role === 'admin');
    }catch{ setAllowed(false); }
  },[]);
  if(allowed === null) return <div className="p-8 text-sm text-gray-600">Checking access…</div>;
  if(!allowed) return (<main className="p-8 max-w-xl mx-auto space-y-3"><h1 className="text-xl font-semibold">Access restricted</h1><p className="text-sm text-gray-600">You must be an administrator to view this page.</p></main>);
  return <>{children}</>;
}
