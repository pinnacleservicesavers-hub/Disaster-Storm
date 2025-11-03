import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Mail, Save, Send, Info, AlertCircle } from 'lucide-react';

interface SMTPConfig {
  host: string;
  port: number;
  user: string;
  use_tls: boolean;
}

export function SMTPSettings() {
  const { toast } = useToast();
  const [host, setHost] = useState('');
  const [port, setPort] = useState(587);
  const [user, setUser] = useState('');
  const [password, setPassword] = useState('');
  const [useTLS, setUseTLS] = useState(true);
  const [testEmail, setTestEmail] = useState('');

  // Fetch current SMTP settings
  const { data } = useQuery({
    queryKey: ['/api/admin/smtp'],
  });

  // Update form when data loads
  useEffect(() => {
    if (data && typeof data === 'object' && 'smtp' in data) {
      const smtp = (data as { smtp: SMTPConfig }).smtp;
      setHost(smtp.host || '');
      setPort(smtp.port || 587);
      setUser(smtp.user || '');
      setUseTLS(smtp.use_tls ?? true);
    }
  }, [data]);

  // Save SMTP settings
  const saveSettings = useMutation({
    mutationFn: async () => {
      return apiRequest('/api/admin/smtp', {
        method: 'POST',
        body: JSON.stringify({
          host,
          port,
          user,
          password,
          use_tls: useTLS
        }),
      });
    },
    onSuccess: () => {
      toast({
        title: 'Settings Saved',
        description: 'SMTP configuration has been updated successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/smtp'] });
      setPassword(''); // Clear password after save
    },
    onError: (error: Error) => {
      toast({
        title: 'Save Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Test SMTP connection
  const testSMTP = useMutation({
    mutationFn: async () => {
      if (!testEmail) {
        throw new Error('Please enter a test email address');
      }
      return apiRequest(`/api/admin/smtp/test?to=${encodeURIComponent(testEmail)}`, {
        method: 'POST',
      });
    },
    onSuccess: (data: any) => {
      if (data.ok) {
        toast({
          title: 'Test Successful',
          description: `Test email sent successfully to ${testEmail}`,
        });
      } else {
        toast({
          title: 'Test Failed',
          description: data.error || 'Failed to send test email',
          variant: 'destructive',
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Test Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
            SMTP Settings
          </h1>
          <p className="text-slate-400">
            Configure email server settings for sending automated letters and notifications
          </p>
        </div>

        {/* SMTP Configuration */}
        <Card className="mb-6 bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Mail className="w-5 h-5" />
              Email Server Configuration
            </CardTitle>
            <CardDescription className="text-slate-400">
              Enter your SMTP server details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm text-slate-300 font-medium mb-2 block">Host</label>
              <Input
                value={host}
                onChange={(e) => setHost(e.target.value)}
                placeholder="smtp.example.com"
                className="bg-slate-900 border-slate-600 text-slate-200"
                data-testid="input-smtp-host"
              />
            </div>

            <div>
              <label className="text-sm text-slate-300 font-medium mb-2 block">Port</label>
              <Input
                type="number"
                value={port}
                onChange={(e) => setPort(parseInt(e.target.value) || 587)}
                placeholder="587"
                className="bg-slate-900 border-slate-600 text-slate-200"
                data-testid="input-smtp-port"
              />
            </div>

            <div>
              <label className="text-sm text-slate-300 font-medium mb-2 block">Username</label>
              <Input
                value={user}
                onChange={(e) => setUser(e.target.value)}
                placeholder="user@example.com"
                className="bg-slate-900 border-slate-600 text-slate-200"
                data-testid="input-smtp-user"
              />
            </div>

            <div>
              <label className="text-sm text-slate-300 font-medium mb-2 block">Password</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password to update"
                className="bg-slate-900 border-slate-600 text-slate-200"
                data-testid="input-smtp-password"
              />
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                checked={useTLS}
                onCheckedChange={(checked) => setUseTLS(checked === true)}
                data-testid="checkbox-use-tls"
              />
              <label className="text-sm text-slate-300">Use TLS (recommended)</label>
            </div>

            <div className="pt-2">
              <Button
                onClick={() => saveSettings.mutate()}
                disabled={saveSettings.isPending}
                className="bg-blue-600 hover:bg-blue-700"
                data-testid="button-save-smtp"
              >
                <Save className="w-4 h-4 mr-2" />
                {saveSettings.isPending ? 'Saving...' : 'Save Settings'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Test Email */}
        <Card className="mb-6 bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Send className="w-5 h-5" />
              Test Email Connection
            </CardTitle>
            <CardDescription className="text-slate-400">
              Send a test email to verify your SMTP configuration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="test@example.com"
                className="flex-1 bg-slate-900 border-slate-600 text-slate-200"
                data-testid="input-test-email"
              />
              <Button
                onClick={() => testSMTP.mutate()}
                disabled={testSMTP.isPending || !testEmail}
                variant="outline"
                className="border-green-600 text-green-400 hover:bg-green-600/20"
                data-testid="button-test-smtp"
              >
                <Send className="w-4 h-4 mr-2" />
                {testSMTP.isPending ? 'Sending...' : 'Send Test'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Info Boxes */}
        <Alert className="mb-4 bg-yellow-500/10 border-yellow-500/50">
          <AlertCircle className="w-4 h-4" />
          <AlertDescription className="text-yellow-300">
            <strong>Security Note:</strong> Passwords are not displayed when loading settings.
            You must re-enter the password if you need to update it.
          </AlertDescription>
        </Alert>

        <Alert className="bg-blue-500/10 border-blue-500/50">
          <Info className="w-4 h-4" />
          <AlertDescription className="text-blue-300">
            <strong>Common SMTP Ports:</strong> Port 587 (TLS), Port 465 (SSL), Port 25 (Plain).
            For Gmail: smtp.gmail.com:587. For Outlook: smtp.office365.com:587.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
