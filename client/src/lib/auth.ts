export type Role = 'admin' | 'contractor' | 'homeowner';
export type Session = { role: Role; userId: string; scopes?: string[]; token?: string };

const provider = (import.meta.env.VITE_AUTH_PROVIDER || 'local').toLowerCase();

function decodeJwtNoVerify(token: string): any {
  try {
    const p = token.split('.')[1];
    if (!p) return {};
    const pad = '='.repeat((4 - (p.length % 4)) % 4);
    const json = atob(p.replace(/-/g, '+').replace(/_/g, '/') + pad);
    return JSON.parse(json);
  } catch {
    return {};
  }
}

function readLocal(): Session | null {
  if (typeof window === 'undefined') return null;
  const token = localStorage.getItem('token') || undefined;
  let role = (localStorage.getItem('role') || 'contractor') as Role;
  let userId = localStorage.getItem('user_id') || 'user';
  const scopes = (localStorage.getItem('scopes') || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
  
  if (token) {
    const claims = decodeJwtNoVerify(token) || {};
    if (claims.sub) userId = claims.sub;
    if (claims.role || claims.app_role) role = (claims.role || claims.app_role) as Role;
  }
  
  return { role, userId, scopes, token };
}

function writeLocal(s: Session) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('role', s.role);
  localStorage.setItem('user_id', s.userId);
  localStorage.setItem('scopes', (s.scopes || []).join(','));
  if (s.token) localStorage.setItem('token', s.token);
  else localStorage.removeItem('token');
}

function clearLocal() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('role');
  localStorage.removeItem('user_id');
  localStorage.removeItem('scopes');
  localStorage.removeItem('token');
}

export const auth = {
  getSession(): Session | null {
    switch (provider) {
      case 'local':
      default:
        return readLocal();
    }
  },
  setSession(s: Session) {
    writeLocal(s);
  },
  clear() {
    clearLocal();
  },
  login() {
    // In real providers, redirect to hosted login. For now, go to /auth/login
    if (typeof window !== 'undefined') window.location.href = '/auth/login';
  }
};
