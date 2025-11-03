"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
export default function ContractorIndex(){ const r=useRouter(); useEffect(()=>{ r.replace("/contractor/jobs/A1"); }, [r]); return null; }
