import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Zap, Shield, User, Building, Home, Lock, Mail, Phone, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  
  // Register state
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('');
  const [registerName, setRegisterName] = useState('');
  const [registerPhone, setRegisterPhone] = useState('');
  const [registerRole, setRegisterRole] = useState<'contractor' | 'admin' | 'homeowner'>('contractor');
  const [registerLoading, setRegisterLoading] = useState(false);

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Shield className="w-4 h-4" />;
      case 'contractor': return <Building className="w-4 h-4" />;
      case 'homeowner': return <Home className="w-4 h-4" />;
      default: return <User className="w-4 h-4" />;
    }
  };

  const handleLogin = async () => {
    if (!loginEmail || !loginPassword) {
      toast({
        title: 'Missing information',
        description: 'Please enter your email and password',
        variant: 'destructive',
      });
      return;
    }

    setLoginLoading(true);
    try {
      const response = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });

      if (response.ok && response.user) {
        // Store user session
        localStorage.setItem('auth_user', JSON.stringify(response.user));
        localStorage.setItem('auth_token', response.token || 'session');
        
        toast({
          title: 'Welcome back!',
          description: `Logged in as ${response.user.role}`,
        });

        // Redirect based on role
        if (response.user.role === 'homeowner') {
          setLocation('/homeowner');
        } else if (response.user.role === 'admin') {
          setLocation('/dashboard');
        } else {
          setLocation('/dashboard');
        }
      } else {
        toast({
          title: 'Login failed',
          description: response.error || 'Invalid email or password',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Login failed',
        description: 'Unable to connect to server',
        variant: 'destructive',
      });
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!registerEmail || !registerPassword || !registerName) {
      toast({
        title: 'Missing information',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    if (registerPassword !== registerConfirmPassword) {
      toast({
        title: 'Password mismatch',
        description: 'Passwords do not match',
        variant: 'destructive',
      });
      return;
    }

    if (registerPassword.length < 6) {
      toast({
        title: 'Weak password',
        description: 'Password must be at least 6 characters',
        variant: 'destructive',
      });
      return;
    }

    setRegisterLoading(true);
    try {
      const response = await apiRequest('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: registerEmail,
          password: registerPassword,
          name: registerName,
          phone: registerPhone,
          role: registerRole,
        }),
      });

      if (response.ok && response.user) {
        // Store user session
        localStorage.setItem('auth_user', JSON.stringify(response.user));
        localStorage.setItem('auth_token', response.token || 'session');
        
        toast({
          title: 'Account created!',
          description: `Welcome to the platform, ${response.user.username}`,
        });

        // Redirect based on role
        if (response.user.role === 'homeowner') {
          setLocation('/homeowner');
        } else if (response.user.role === 'admin') {
          setLocation('/dashboard');
        } else {
          setLocation('/dashboard');
        }
      } else {
        toast({
          title: 'Registration failed',
          description: response.error || 'Unable to create account',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Registration failed',
        description: 'Unable to connect to server',
        variant: 'destructive',
      });
    } finally {
      setRegisterLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-6">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <button
          onClick={() => setLocation('/')}
          className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors"
          data-testid="button-back-home"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </button>

        <Card className="bg-white/10 backdrop-blur-lg border-white/20">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-2xl shadow-lg shadow-blue-500/30">
                <Zap className="w-8 h-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl text-white">Strategic Services Savers</CardTitle>
            <CardDescription className="text-slate-400">
              Disaster Direct Platform
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-white/10">
                <TabsTrigger value="login" className="data-[state=active]:bg-white/20 text-white" data-testid="tab-login">
                  Login
                </TabsTrigger>
                <TabsTrigger value="register" className="data-[state=active]:bg-white/20 text-white" data-testid="tab-register">
                  Register
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="space-y-4 mt-6">
                <div className="space-y-2">
                  <Label className="text-slate-300">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      type="email"
                      placeholder="your@email.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-slate-500"
                      data-testid="input-login-email"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-300">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      type="password"
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-slate-500"
                      data-testid="input-login-password"
                    />
                  </div>
                </div>

                <Button
                  onClick={handleLogin}
                  disabled={loginLoading}
                  className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold"
                  data-testid="button-login"
                >
                  {loginLoading ? 'Signing in...' : 'Sign In'}
                </Button>
              </TabsContent>

              <TabsContent value="register" className="space-y-4 mt-6">
                <div className="space-y-2">
                  <Label className="text-slate-300">I am a...</Label>
                  <Select value={registerRole} onValueChange={(v: any) => setRegisterRole(v)}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white" data-testid="select-register-role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="contractor" data-testid="option-contractor">
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4" />
                          <span>Contractor</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="admin" data-testid="option-admin">
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4" />
                          <span>Admin</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="homeowner" data-testid="option-homeowner">
                        <div className="flex items-center gap-2">
                          <Home className="w-4 h-4" />
                          <span>Homeowner</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-300">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      type="text"
                      placeholder="John Smith"
                      value={registerName}
                      onChange={(e) => setRegisterName(e.target.value)}
                      className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-slate-500"
                      data-testid="input-register-name"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-300">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      type="email"
                      placeholder="your@email.com"
                      value={registerEmail}
                      onChange={(e) => setRegisterEmail(e.target.value)}
                      className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-slate-500"
                      data-testid="input-register-email"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-300">Phone (optional)</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      type="tel"
                      placeholder="(555) 123-4567"
                      value={registerPhone}
                      onChange={(e) => setRegisterPhone(e.target.value)}
                      className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-slate-500"
                      data-testid="input-register-phone"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-300">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      type="password"
                      placeholder="At least 6 characters"
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                      className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-slate-500"
                      data-testid="input-register-password"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-300">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      type="password"
                      placeholder="Confirm your password"
                      value={registerConfirmPassword}
                      onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                      className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-slate-500"
                      data-testid="input-register-confirm"
                    />
                  </div>
                </div>

                <Button
                  onClick={handleRegister}
                  disabled={registerLoading}
                  className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold"
                  data-testid="button-register"
                >
                  {registerLoading ? 'Creating account...' : 'Create Account'}
                </Button>

                {registerRole === 'homeowner' && (
                  <p className="text-xs text-slate-400 text-center">
                    As a homeowner, you'll have access to your personal file and StormShare community.
                  </p>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <p className="text-center text-slate-500 text-sm mt-6">
          Questions? Contact{' '}
          <a href="mailto:strategicservicesavers@gmail.com" className="text-blue-400 hover:text-blue-300">
            strategicservicesavers@gmail.com
          </a>
        </p>
      </div>
    </main>
  );
}
