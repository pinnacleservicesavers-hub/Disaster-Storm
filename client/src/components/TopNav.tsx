import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Zap } from 'lucide-react';
import { auth, type Role } from '@/lib/auth';

export default function TopNav() {
  const [role, setRole] = useState<Role>('contractor');
  const [user, setUser] = useState('user');

  useEffect(() => {
    const s = auth.getSession();
    if (s) {
      setRole(s.role);
      setUser(s.userId);
    }
  }, []);

  const updateRole = (r: Role) => {
    setRole(r);
    auth.setSession({ role: r, userId: user, scopes: [] });
    window.location.reload();
  };

  const updateUser = (newUser: string) => {
    setUser(newUser);
    auth.setSession({ role, userId: newUser, scopes: [] });
  };

  return (
    <header className="sticky top-0 z-50 bg-gradient-to-r from-blue-900 via-purple-900 to-blue-900 text-white shadow-lg border-b border-white/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-4">
            <Link to="/" className="flex items-center space-x-2">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Zap className="w-6 h-6 text-yellow-300" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">
                  Disaster Direct
                </h1>
                <p className="text-xs text-white/80 hidden sm:block">
                  Storm Operations Platform
                </p>
              </div>
            </Link>
          </div>

          {/* Quick Links */}
          <nav className="hidden md:flex items-center gap-2 text-sm" data-testid="quick-nav">
            <Link 
              to="/contractor/jobs" 
              className="px-3 py-1.5 rounded-md hover:bg-white/10 transition-colors"
              data-testid="nav-contractor"
            >
              Contractor
            </Link>
            <Link 
              to="/admin/legal/zipmap" 
              className="px-3 py-1.5 rounded-md hover:bg-white/10 transition-colors"
              data-testid="nav-admin"
            >
              Admin
            </Link>
            <Link 
              to="/homeowner" 
              className="px-3 py-1.5 rounded-md hover:bg-white/10 transition-colors"
              data-testid="nav-homeowner"
            >
              Homeowner
            </Link>
          </nav>

          {/* Right Side - Role Selector & User */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-white/90 hidden sm:inline">Role:</span>
              <select 
                className="border rounded-md px-2 py-1 text-sm bg-white text-gray-900 font-medium" 
                value={role} 
                onChange={(e) => updateRole(e.target.value as Role)}
                data-testid="role-selector"
              >
                <option value="admin">admin</option>
                <option value="contractor">contractor</option>
                <option value="homeowner">homeowner</option>
              </select>
            </div>

            <div className="hidden md:flex items-center gap-2">
              <span className="text-sm text-white/90">User:</span>
              <input 
                className="border rounded-md px-2 py-1 text-sm bg-white text-gray-900 w-32" 
                defaultValue={user} 
                onBlur={(e) => updateUser(e.target.value)}
                data-testid="user-input"
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
