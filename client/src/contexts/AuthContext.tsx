import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, Shield, Building, Heart, Settings } from 'lucide-react';
import { setAuthHeaders } from '@/lib/queryClient';

// User types based on the schema
export type UserRole = 'victim' | 'contractor' | 'business' | 'admin' | 'crew_member';

export interface AuthUser {
  id: string;
  username: string;
  role: UserRole;
  email?: string;
  displayName?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (user: AuthUser) => void;
  logout: () => void;
  switchUser: (userId: string) => void;
  availableUsers: AuthUser[];
}

// Create context with safe default to prevent initialization issues
const defaultContextValue: AuthContextType = {
  user: null,
  isAuthenticated: false,
  login: () => {},
  logout: () => {},
  switchUser: () => {},
  availableUsers: []
};

const AuthContext = createContext<AuthContextType>(defaultContextValue);

// Development users for testing and demo
const DEVELOPMENT_USERS: AuthUser[] = [
  {
    id: 'victim-001',
    username: 'sarah_victim',
    role: 'victim',
    email: 'sarah@example.com',
    displayName: 'Sarah Johnson (Storm Victim)'
  },
  {
    id: 'contractor-001', 
    username: 'mike_contractor',
    role: 'contractor',
    email: 'mike@example.com',
    displayName: 'Mike Thompson (Contractor)'
  },
  {
    id: 'business-001',
    username: 'acme_business', 
    role: 'business',
    email: 'marketing@acme.com',
    displayName: 'ACME Restoration (Business)'
  },
  {
    id: 'admin-001',
    username: 'admin_user',
    role: 'admin', 
    email: 'admin@stormshare.com',
    displayName: 'StormShare Admin'
  }
];

interface AuthProviderProps {
  children: ReactNode;
  showUserSwitcher?: boolean;
}

export function AuthProvider({ children, showUserSwitcher = true }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    // Initialize immediately with default user to prevent context issues
    const savedUserId = localStorage.getItem('stormshare_current_user');
    if (savedUserId) {
      const savedUser = DEVELOPMENT_USERS.find(u => u.id === savedUserId);
      if (savedUser) return savedUser;
    }
    // Default to contractor for immediate testing
    return DEVELOPMENT_USERS[1]; // contractor-001
  });
  const [isInitialized, setIsInitialized] = useState(true); // Start as initialized

  // Set up auth headers on mount
  useEffect(() => {
    if (user) {
      setAuthHeaders({
        'x-user-id': user.id,
        'x-user-role': user.role,
        'x-username': user.username,
      });
    }
  }, [user]);

  const login = (newUser: AuthUser) => {
    setUser(newUser);
    localStorage.setItem('stormshare_current_user', newUser.id);
    
    // Set authentication headers for API requests
    setAuthHeaders({
      'x-user-id': newUser.id,
      'x-user-role': newUser.role,
      'x-username': newUser.username,
    });
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('stormshare_current_user');
    
    // Clear authentication headers
    setAuthHeaders({});
  };

  const switchUser = (userId: string) => {
    const newUser = DEVELOPMENT_USERS.find(u => u.id === userId);
    if (newUser) {
      login(newUser);
    }
  };

  const contextValue: AuthContextType = {
    user,
    isAuthenticated: !!user,
    login,
    logout,
    switchUser,
    availableUsers: DEVELOPMENT_USERS
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
      {showUserSwitcher && isInitialized && <UserSwitcherWrapper />}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  return context;
}

// Wrapper component to ensure context is available
function UserSwitcherWrapper() {
  return <UserSwitcher />;
}

// User switcher component for development and demo
function UserSwitcher() {
  const { user, switchUser, availableUsers } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  if (!user) return null;

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'victim': return <Heart className="w-4 h-4" />;
      case 'contractor': return <User className="w-4 h-4" />;
      case 'business': return <Building className="w-4 h-4" />;
      case 'admin': return <Shield className="w-4 h-4" />;
      case 'crew_member': return <Settings className="w-4 h-4" />;
      default: return <User className="w-4 h-4" />;
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'victim': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'contractor': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'business': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'admin': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'crew_member': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 bg-white dark:bg-gray-800 shadow-lg"
        data-testid="button-user-switcher"
      >
        {getRoleIcon(user.role)}
        <span data-testid="text-current-user">{user.displayName}</span>
        <Badge className={getRoleColor(user.role)}>
          {user.role.toUpperCase()}
        </Badge>
      </Button>

      {isOpen && (
        <Card className="absolute top-12 right-0 w-80 shadow-xl bg-white dark:bg-gray-800 border">
          <CardHeader>
            <CardTitle className="text-lg">Switch User (Dev Mode)</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={user.id} onValueChange={switchUser}>
              <SelectTrigger data-testid="select-user-switcher">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableUsers.map((u) => (
                  <SelectItem key={u.id} value={u.id} data-testid={`option-user-${u.role}`}>
                    <div className="flex items-center space-x-2">
                      {getRoleIcon(u.role)}
                      <span>{u.displayName}</span>
                      <Badge className={getRoleColor(u.role)} variant="secondary">
                        {u.role.toUpperCase()}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
              <p><strong>Current:</strong> {user.username}</p>
              <p><strong>Role:</strong> {user.role}</p>
              <p><strong>Email:</strong> {user.email}</p>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="mt-4 w-full"
              data-testid="button-close-switcher"
            >
              Close
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}