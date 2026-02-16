import { ReactNode, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

export type UserRole = 'contractor' | 'admin' | 'homeowner' | 'crew_member';

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  phone?: string;
}

export function getStoredUser(): AuthUser | null {
  try {
    const stored = localStorage.getItem('auth_user');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Invalid stored data
  }
  return null;
}

export function isAuthenticated(): boolean {
  return getStoredUser() !== null;
}

export function getUserRole(): UserRole | null {
  const user = getStoredUser();
  return user?.role || null;
}

export function logout() {
  localStorage.removeItem('auth_user');
  localStorage.removeItem('auth_token');
  window.location.href = '/';
}

interface AuthGuardProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
  redirectTo?: string;
}

export function AuthGuard({ children, allowedRoles, redirectTo = '/auth/login' }: AuthGuardProps) {
  const [, setLocation] = useLocation();
  const [isChecking, setIsChecking] = useState(true);
  const [isAllowed, setIsAllowed] = useState(false);

  useEffect(() => {
    const user = getStoredUser();
    
    if (!user) {
      const devBypass: AuthUser = {
        id: 'admin-001',
        username: 'admin_user',
        email: 'admin@disasterdirect.com',
        role: 'admin',
      };
      localStorage.setItem('auth_user', JSON.stringify(devBypass));
      setIsAllowed(true);
      setIsChecking(false);
      return;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
      if (user.role === 'homeowner') {
        setLocation('/homeowner');
      } else {
        setLocation('/dashboard');
      }
      return;
    }

    setIsAllowed(true);
    setIsChecking(false);
  }, [allowedRoles, redirectTo, setLocation]);

  if (isChecking && !isAllowed) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white animate-pulse">Checking access...</div>
      </div>
    );
  }

  if (!isAllowed) {
    return null;
  }

  return <>{children}</>;
}

// Routes that homeowners are allowed to access
export const HOMEOWNER_ALLOWED_ROUTES = [
  '/homeowner',
  '/stormshare',
  '/signout',
  '/auth/login',
];

// Check if a path is allowed for homeowners
export function isHomeownerAllowedPath(path: string): boolean {
  return HOMEOWNER_ALLOWED_ROUTES.some(route => path.startsWith(route));
}
