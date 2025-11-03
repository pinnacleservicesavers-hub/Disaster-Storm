
"use client";
import { api, API_BASE } from '@/lib/api';
import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';

export default function JobDetail(){
  const id = (useParams().id as string) || 'A1';
  const [letters, setLetters] = useState<any[]>([]);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editLetter, setEditLetter] = useState<any>(null);
  const [editSubject, setEditSubject] = useState('');
  const editorRef = useRef<HTMLDivElement>(null);

  const load = async()=>{ try{ const r = await api(`/letters/${id}`); setLetters(r.letters||[]); }catch(e){} };

  useEffect(()=>{ load(); fetchAccuracy(); },[]);

  const exec = (cmd:string, val?:string)=>{ try{ document.execCommand(cmd, false, val||''); }catch(e){} };

  return (
    <main className="p-8 space-y-6 max-w-4xl mx-auto">
      <section className="border rounded p-3 space-y-2">
        <div className="font-semibold">New Job</div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-sm">
          <input id="nj_id" className="border p-2" placeholder="Job ID" />
          <input id="nj_zip" className="border p-2" placeholder="ZIP" onChange={(e)=>{
            const z = (e.target.value||'').trim();
            let st = '';
            if(z.startsWith('32')||z.startsWith('33')||z.startsWith('34')) st='FL';
            else if(z.startsWith('90')||z.startsWith('91')||z.startsWith('92')||z.startsWith('93')||z.startsWith('94')||z.startsWith('95')) st='CA';
            else if(z.startsWith('75')||z.startsWith('76')||z.startsWith('77')||z.startsWith('78')||z.startsWith('79')) st='TX';
            else if(z.startsWith('73')||z.startsWith('08')||z.startsWith('07')||z.startsWith('70')) st='NJ';
            else if(z.startsWith('80')||z.startsWith('81')) st='CO';
            (document.getElementById('nj_state') as HTMLSelectElement).value = st || (document.getElementById('nj_state') as HTMLSelectElement).value;
          }} />
          <select id="nj_state" className="border p-2">
            <option value="">State</option>
            {["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"].map(s=> <option key={s} value={s}>{s}</option>)}
          </select>
          <input id="nj_contractor" className="border p-2" placeholder="Contractor ID (defaults to your user id)" />
        </div>
        <div>
          <button className="px-3 py-1 border rounded text-sm" onClick={async()=>{
            const jid = (document.getElementById('nj_id') as HTMLInputElement).value.trim();
            const zip = (document.getElementById('nj_zip') as HTMLInputElement).value.trim();
            const state = (document.getElementById('nj_state') as HTMLSelectElement).value;
            let contractor = (document.getElementById('nj_contractor') as HTMLInputElement).value.trim();
            if(!contractor) contractor = localStorage.getItem('user_id') || 'demo-contractor';
            if(!jid){ alert('Job ID required'); return; }
            try{ await api('/jobs', { method:'POST', body: JSON.stringify({ job_id: jid, contractor_id: contractor, zip, state }) }); alert('Job created'); }catch(e){ alert('Failed to create job'); }
          }}>Create</button>
        </div>
      </section>

      <section className="border rounded p-3 space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Letters</h2>
          <button className="px-3 py-1 border rounded text-sm" onClick={load}>Refresh</button>
        </div>
        {letters.length ? <div className="border rounded">
          {letters.map((L:any)=>(
            <div key={L.id} className="p-2 border-b grid grid-cols-1 md:grid-cols-3 gap-2 items-center">
              <div className="text-sm">
                <div className="font-medium">{L.kind} — {L.status}</div>
                <div className="text-xs text-gray-600">Due: {L.due_at}</div>
              </div>
              <div className="text-xs line-clamp-2">{L.subject}</div>
              <div className="flex items-center gap-2 justify-end">
                <a className="underline text-sm" target="_blank" href={`${API_BASE}/letters/${id}/${L.id}.pdf`}>Download PDF</a>
                <button className="px-2 py-1 border rounded text-sm" onClick={()=>{ setEditLetter(L); setEditSubject(L.subject||''); setEditorOpen(true); setTimeout(()=>{ if(editorRef.current) editorRef.current.innerHTML = (L.body||''); },0); }}>Edit & Send</button>
              </div>
            </div>
          ))}
        </div> : <div className="text-sm text-gray-500">No letters yet.</div>}
      </section>

      {editorOpen && <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded p-4 w-full max-w-2xl space-y-3">
          <div className="text-lg font-semibold">Edit letter</div>
          <input className="border p-2 w-full" value={editSubject} onChange={e=>setEditSubject(e.target.value)} placeholder="Subject" />
          <div className='border rounded'>
            <div className='flex gap-2 p-2 border-b text-sm'>
              <button className='px-2 py-1 border rounded' onClick={()=>exec('bold')}>B</button>
              <button className='px-2 py-1 border rounded' onClick={()=>exec('italic')}>I</button>
              <button className='px-2 py-1 border rounded' onClick={()=>exec('insertUnorderedList')}>• List</button>
              <button className='px-2 py-1 border rounded' onClick={()=>exec('insertOrderedList')}>1. List</button>
              <button className='px-2 py-1 border rounded' onClick={()=>exec('formatBlock','p')}>P</button>
            </div>
            <div ref={editorRef} contentEditable className='p-3 min-h-[12rem] outline-none' style={{whiteSpace:'pre-wrap'}}></div>
          </div>
          <div className="flex items-center justify-end gap-2">
            <button className="px-3 py-1 border rounded" onClick={()=>setEditorOpen(false)}>Cancel</button>
            <button className="px-3 py-1 border rounded" onClick={async()=>{ try{ const html = editorRef.current?.innerHTML || ''; await api(`/letters/${id}/${editLetter.id}`, { method:'PATCH', body: JSON.stringify({ subject: editSubject, body: html }) }); setEditorOpen(false); load(); }catch(e){ alert('Failed to save'); } }}>Save</button>
            <button className="px-3 py-1 border rounded" onClick={async()=>{ try{ const html = editorRef.current?.innerHTML || ''; await api(`/letters/${id}/${editLetter.id}`, { method:'PATCH', body: JSON.stringify({ subject: editSubject, body: html }) }); await api('/letters/send_now', { method:'POST', body: JSON.stringify({ job_id: id, letter_id: editLetter.id }) }); await api('/letters/run', { method:'POST' }); setEditorOpen(false); load(); }catch(e){ alert('Failed to send'); } }}>Send Now</button>
          </div>
        </div>
      </div>}
    
      <section className="border rounded p-3 space-y-2">
        <div className="font-semibold">Duplicate Job</div>
        <div className="flex items-center gap-2 text-sm">
          <input id="dup_newid" className="border p-2" placeholder="New Job ID" />
          <button className="px-3 py-1 border rounded" onClick={async()=>{
            const nid = (document.getElementById('dup_newid') as HTMLInputElement).value.trim();
            if(!nid){ alert('New Job ID required'); return; }
            try{ await api(`/jobs/${id}/duplicate?new_job_id=${encodeURIComponent(nid)}`, { method:'POST' }); alert('Duplicated'); }catch(e){ alert('Failed to duplicate'); }
          }}>Duplicate Job</button>
        </div>
        <div className="text-xs text-gray-500">Admin can upload a full ZIP→State map via <code>/admin/legal/zipmap</code> for perfect coverage.</div>
      </section>

    
      <section className="border rounded p-3 space-y-2">
        <div className="font-semibold">State detection</div>
        <div id="statePanel" className="text-sm">Use the New Job panel above to set ZIP/state.</div>
      </section>
    
      <section className="border rounded p-3 space-y-2">
        <div className="font-semibold">Accuracy meter</div>
        <div className="text-sm">ZIP: {acc?.zip || '—'} | Guessed: <b>{acc?.guessed || '—'}</b></div>
        <div className="text-xs text-gray-500">If the guessed state is correct, set it on the job to improve legal boilerplate and citations.</div>
        <div className="flex items-center gap-2">
          <input id="acc_state" className="border p-2 w-24" placeholder="FL" defaultValue={acc?.guessed||''} />
          <button className="px-3 py-1 border rounded text-sm" onClick={async()=>{
            const st = (document.getElementById('acc_state') as HTMLInputElement).value.trim().toUpperCase();
            if(!st) { alert('Enter a state'); return; }
            try{ await api(`/jobs/${id}/state?state=${encodeURIComponent(st)}`, { method:'POST' }); alert('State saved'); fetchAccuracy(); }catch(e){ alert('Failed'); }
          }}>Use this state</button>
        </div>
      </section>

    
      <section className="border rounded p-3 space-y-2">
        <div className="font-semibold">State & welcome letter</div>
        <div className="text-sm text-gray-600">When a job's state is set for the first time, the system automatically schedules a state-specific welcome/rights letter and attempts to send it immediately.</div>
      </section>

    </main>
  );
}
