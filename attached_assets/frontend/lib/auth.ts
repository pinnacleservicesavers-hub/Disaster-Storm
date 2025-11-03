
export type Role = 'admin' | 'contractor' | 'homeowner';
export type Session = { role: Role; userId: string; scopes?: string[] };
const provider = (process.env.NEXT_PUBLIC_AUTH_PROVIDER || 'local').toLowerCase();
function readLocal(): Session | null {
  if (typeof window === 'undefined') return null;
  const role = (localStorage.getItem('role') || 'contractor') as Role;
  const userId = localStorage.getItem('user_id') || 'user';
  const scopes = (localStorage.getItem('scopes') || '').split(',').map(s=>s.trim()).filter(Boolean);
  return { role, userId, scopes };
}
function writeLocal(s: Session){
  if (typeof window === 'undefined') return;
  localStorage.setItem('role', s.role);
  localStorage.setItem('user_id', s.userId);
  localStorage.setItem('scopes', (s.scopes||[]).join(','));
}
export const auth = {
  getSession(): Session | null {
    switch(provider){ case 'local': default: return readLocal(); }
  },
  setSession(s: Session){
    switch(provider){ case 'local': default: writeLocal(s); break; }
  }
};
