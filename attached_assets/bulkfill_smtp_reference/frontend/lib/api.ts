
export const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "";
function authHeaders(){
  if (typeof window === 'undefined') return {};
  const role = localStorage.getItem('role') || 'admin';
  const uid = localStorage.getItem('user_id') || 'demo-contractor';
  const scopes = localStorage.getItem('scopes') || '';
  return { 'X-User-Role': role, 'X-User-Id': uid, 'X-Scopes': scopes };
}
export async function api(path: string, opts: RequestInit = {}){
  const res = await fetch(`${API_BASE}${path}`, { headers: { 'Content-Type':'application/json', ...authHeaders(), ...(opts.headers||{}) }, ...opts });
  if(!res.ok){ let t=''; try{ t=await res.text(); }catch(e){}; throw new Error(t || `HTTP ${res.status}`); }
  try{ return await res.json(); }catch(e){ return {}; }
}
