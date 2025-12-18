import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Zap, LogOut, LogIn } from 'lucide-react';
import { auth, type Role } from '@/lib/auth';
import Breadcrumbs from '@/components/Breadcrumbs';

export default function TopNav() {
  const [role, setRole] = useState<Role>('contractor');
  const [user, setUser] = useState('user');
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    const s = auth.getSession();
    if (s) {
      setRole(s.role);
      setUser(s.userId);
      setHasToken(Boolean(s.token));
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

  const logout = () => {
    auth.clear();
    window.location.href = '/signout';
  };

  return (
    <>
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
                to="/workhub" 
                className="px-3 py-1.5 rounded-md bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 transition-colors font-medium"
                data-testid="nav-workhub"
              >
                WorkHub
              </Link>
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

            {/* Right Side - Auth Controls */}
            <div className="flex items-center gap-3">
              {!hasToken ? (
                <button
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-md bg-white/10 hover:bg-white/20 transition-colors text-sm font-medium"
                  onClick={() => auth.login()}
                  data-testid="button-login"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Login</span>
                </button>
              ) : (
                <>
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

                  <button
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white/10 hover:bg-white/20 transition-colors text-sm font-medium"
                    onClick={logout}
                    data-testid="button-logout"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:inline">Logout</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>
      
      {/* Breadcrumbs */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Breadcrumbs />
        </div>
      </div>
    </>
  );
}
