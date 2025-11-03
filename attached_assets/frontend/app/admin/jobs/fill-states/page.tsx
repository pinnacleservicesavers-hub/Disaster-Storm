
"use client";
import { useState } from "react";
import { api } from "@/lib/api";

export default function FillStatesAdmin(){
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [rows, setRows] = useState<any[]>([]);
  const [summary, setSummary] = useState<{updated?:number, scanned?:number}>({});

  const run = async () => {
    setRunning(true);
    setProgress(10);
    try{
      // single-shot call; progress bar is illustrative
      const j = await api('/admin/jobs/fill_states', { method: 'POST' });
      setProgress(80);
      setRows(j.details || []);
      setSummary({ updated: j.updated, scanned: j.scanned });
      setProgress(100);
    }catch(e:any){
      alert(e?.message || 'Failed');
      setRunning(false);
      setProgress(0);
    }finally{
      setRunning(false);
    }
  };

  return (
    <main className="p-8 space-y-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold">Bulk Fill Job States</h1>
      <p className="text-sm text-gray-600">Runs state inference for all jobs missing a state using your ZIP→State map.</p>
      <div className="flex items-center gap-3">
        <button className="px-4 py-2 border rounded" disabled={running} onClick={run}>Run now</button>
        <div className="flex-1 h-3 bg-gray-200 rounded overflow-hidden">
          <div className="h-3 bg-green-500 transition-all" style={{width: progress + '%'}}></div>
        </div>
        <div className="text-xs text-gray-600">{progress}%</div>
      </div>

      <div className="text-sm">Updated: <b>{summary.updated ?? 0}</b> / Scanned: <b>{summary.scanned ?? 0}</b></div>

      <section className="border rounded">
        <div className="px-3 py-2 font-semibold border-b">Results</div>
        <div className="max-h-[24rem] overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left bg-gray-50">
                <th className="p-2 border-b">Job ID</th>
                <th className="p-2 border-b">ZIP</th>
                <th className="p-2 border-b">New State</th>
              </tr>
            </thead>
            <tbody>
              {rows.length ? rows.map((r:any)=>(
                <tr key={r.job_id} className="odd:bg-white even:bg-gray-50">
                  <td className="p-2 border-b font-mono">{r.job_id}</td>
                  <td className="p-2 border-b">{r.zip || '—'}</td>
                  <td className="p-2 border-b font-semibold">{r.new_state}</td>
                </tr>
              )) : <tr><td className="p-3 text-gray-500" colSpan={3}>No changes</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
