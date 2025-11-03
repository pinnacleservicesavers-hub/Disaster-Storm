
"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/auth';

export default function SignOut(){
  const r = useRouter();
  useEffect(()=>{
    auth.clear();
    const t = setTimeout(()=> r.replace('/'), 500);
    return ()=> clearTimeout(t);
  }, [r]);
  return <main className="p-10 max-w-xl mx-auto">Signing out…</main>;
}
