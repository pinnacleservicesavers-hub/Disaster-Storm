export type Role = 'admin' | 'contractor' | 'homeowner';
export type Session = { role: Role; userId: string; scopes?: string[]; token?: string };

const provider = (import.meta.env.VITE_AUTH_PROVIDER || 'local').toLowerCase();

function readLocal(): Session | null {
  if (typeof window === 'undefined') return null;
  const role = (localStorage.getItem('role') || 'contractor') as Role;
  const userId = localStorage.getItem('user_id') || 'user';
  const scopes = (localStorage.getItem('scopes') || '').split(',').map(s => s.trim()).filter(Boolean);
  const token = localStorage.getItem('token') || undefined;
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
      case 'clerk':
      case 'auth0':
      case 'supabase':
        // TODO: Implement provider-specific session read
        return readLocal();
    }
  },
  setSession(s: Session) {
    switch (provider) {
      case 'local':
      default:
        writeLocal(s);
        break;
      case 'clerk':
      case 'auth0':
      case 'supabase':
        // TODO: Implement provider-specific session write
        writeLocal(s);
        break;
    }
  },
  clear() {
    clearLocal();
  }
};
