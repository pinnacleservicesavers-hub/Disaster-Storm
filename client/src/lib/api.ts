export const API_BASE = import.meta.env.VITE_API_BASE || '';

function authHeaders() {
  if (typeof window === 'undefined') return {};
  
  const role = localStorage.getItem('role') || 'contractor';
  const uid = localStorage.getItem('user_id') || 'demo-contractor';
  const scopes = localStorage.getItem('scopes') || '';
  const token = localStorage.getItem('token') || '';
  
  const h: Record<string, string> = {
    'X-User-Role': role,
    'X-User-Id': uid,
    'X-Scopes': scopes
  };
  
  if (token) h['Authorization'] = `Bearer ${token}`;
  
  return h;
}

export async function api(path: string, opts: RequestInit = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
      ...(opts.headers || {})
    },
    ...opts
  });
  
  if (!res.ok) {
    let errorText = '';
    try {
      errorText = await res.text();
    } catch (e) {
      // Ignore error parsing error
    }
    throw new Error(errorText || `HTTP ${res.status}`);
  }
  
  try {
    return await res.json();
  } catch (e) {
    return {};
  }
}
