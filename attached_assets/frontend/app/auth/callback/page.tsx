
"use client";
import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { auth } from '@/lib/auth';

export default function Callback(){
  const r = useRouter();
  const sp = useSearchParams();
  useEffect(()=>{
    // Accept ?token=... or #id_token=...
    const token = sp.get('token') || (typeof window !== 'undefined' ? new URLSearchParams(window.location.hash.replace(/^#/,'')).get('id_token') : null);
    if (token){
      auth.setSession({ role: 'contractor', userId: 'user', token });
      r.replace('/');
    } else {
      r.replace('/auth/login');
    }
  }, [r, sp]);
  return <main className="p-10 max-w-xl mx-auto">Completing sign-in…</main>;
}
