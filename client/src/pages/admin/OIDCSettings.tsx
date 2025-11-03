import { useEffect, useState } from 'react';
import { Shield, RefreshCw, Save, Key, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface OIDCConfig {
  issuer?: string;
  audience?: string;
  enforce?: boolean;
  jwks_keys?: number;
}

export default function OIDCSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [issuer, setIssuer] = useState('');
  const [audience, setAudience] = useState('');
  const [enforce, setEnforce] = useState(false);
  const [keys, setKeys] = useState(0);

  // Fetch current OIDC settings
  const { data, isLoading } = useQuery<{ oidc: OIDCConfig }>({
    queryKey: ['/api/admin/oidc'],
    refetchOnMount: true
  });

  // Update local state when data loads
  useEffect(() => {
    if (data?.oidc) {
      setIssuer(data.oidc.issuer || '');
      setAudience(data.oidc.audience || '');
      setEnforce(Boolean(data.oidc.enforce));
      setKeys(data.oidc.jwks_keys || 0);
    }
  }, [data]);

  // Save OIDC configuration
  const saveMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('/api/admin/oidc', {
        method: 'POST',
        body: JSON.stringify({ issuer, audience, enforce })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/oidc'] });
      toast({
        title: 'Configuration saved',
        description: 'OIDC settings have been updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Save failed',
        description: error.message || 'Failed to save OIDC settings',
        variant: 'destructive'
      });
    }
  });

  // Refresh JWKS
  const refreshMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('/api/admin/oidc/refresh_jwks', {
        method: 'POST'
      });
    },
    onSuccess: (result: any) => {
      if (result.ok) {
        setKeys(result.keys || 0);
        queryClient.invalidateQueries({ queryKey: ['/api/admin/oidc'] });
        toast({
          title: 'JWKS refreshed',
          description: `Loaded ${result.keys} signing keys from identity provider`,
        });
      } else {
        toast({
          title: 'Refresh failed',
          description: result.error || 'Failed to fetch JWKS',
          variant: 'destructive'
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Refresh failed',
        description: error.message || 'Failed to refresh JWKS',
        variant: 'destructive'
      });
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse text-gray-500">Loading OIDC settings...</div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              OIDC / JWT Settings
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Configure JWT verification with your identity provider
            </p>
          </div>
        </div>
      </div>

      {/* Info Alert */}
      <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p className="font-medium mb-1">Production JWT Verification</p>
              <p>
                When <strong>Enforce</strong> is enabled, all requests must include a valid JWT token.
                Tokens are verified using JWKS from your identity provider (Auth0, Clerk, Supabase, etc).
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configuration Form */}
      <Card>
        <CardHeader>
          <CardTitle>Identity Provider Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="issuer">Issuer URL</Label>
            <Input
              id="issuer"
              type="url"
              placeholder="https://your-tenant.auth0.com/"
              value={issuer}
              onChange={(e) => setIssuer(e.target.value)}
              data-testid="input-issuer"
            />
            <p className="text-xs text-gray-500">
              The base URL of your identity provider (must end with /)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="audience">Audience</Label>
            <Input
              id="audience"
              type="text"
              placeholder="https://api.disaster-direct.com"
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              data-testid="input-audience"
            />
            <p className="text-xs text-gray-500">
              API identifier from your identity provider
            </p>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-0.5">
              <Label htmlFor="enforce" className="text-base font-medium">
                Enforce Verification
              </Label>
              <p className="text-sm text-gray-500">
                Require valid JWT tokens for all requests
              </p>
            </div>
            <Switch
              id="enforce"
              checked={enforce}
              onCheckedChange={setEnforce}
              data-testid="switch-enforce"
            />
          </div>

          {enforce && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-amber-800 dark:text-amber-200">
                <strong>Warning:</strong> When enforcement is ON, unverified or missing tokens will be rejected with 401 errors.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* JWKS Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            JSON Web Key Set (JWKS)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Cached Signing Keys</p>
              <p className="text-xs text-gray-500">
                Public keys used to verify JWT signatures
              </p>
            </div>
            <div className="flex items-center gap-2">
              {keys > 0 ? (
                <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-sm font-semibold">{keys} keys</span>
                </div>
              ) : (
                <span className="text-sm text-gray-500">No keys cached</span>
              )}
            </div>
          </div>

          <Button
            variant="outline"
            onClick={() => refreshMutation.mutate()}
            disabled={!issuer || refreshMutation.isPending}
            data-testid="button-refresh-jwks"
            className="w-full"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshMutation.isPending ? 'animate-spin' : ''}`} />
            {refreshMutation.isPending ? 'Refreshing...' : 'Refresh JWKS from Provider'}
          </Button>

          <p className="text-xs text-gray-500">
            Fetches the latest signing keys from <code>{issuer || 'your provider'}/.well-known/jwks.json</code>
          </p>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Button
          onClick={() => saveMutation.mutate()}
          disabled={!issuer || !audience || saveMutation.isPending}
          data-testid="button-save"
          className="flex-1"
        >
          <Save className="w-4 h-4 mr-2" />
          {saveMutation.isPending ? 'Saving...' : 'Save Configuration'}
        </Button>
      </div>

      {/* Development Mode Notice */}
      {!enforce && (
        <Card className="border-gray-200 dark:border-gray-800">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-gray-600 dark:text-gray-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-gray-700 dark:text-gray-300">
                <p className="font-medium mb-1">Development Mode Active</p>
                <p>
                  Enforcement is disabled. Tokens are decoded without verification, and fallback headers
                  (<code>X-User-Role</code>, <code>X-User-Id</code>) are accepted for local testing.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
