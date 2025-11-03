import { useState } from 'react';
import { auth } from '@/lib/auth';
import { Zap, Shield } from 'lucide-react';

function makeFakeJwt(payload: any) {
  // This is ONLY for local testing: header.payload.signature (no real signing)
  const enc = (obj: any) =>
    btoa(JSON.stringify(obj))
      .replace(/=+$/, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
  return `${enc({ alg: 'none', typ: 'JWT' })}.${enc(payload)}.`;
}

export default function Login() {
  const [role, setRole] = useState<'admin' | 'contractor' | 'homeowner'>('contractor');
  const [userId, setUserId] = useState('user-123');

  const localLogin = () => {
    const token = makeFakeJwt({ sub: userId, role });
    auth.setSession({ role, userId, token, scopes: [] });
    window.location.href = '/';
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 space-y-6">
          {/* Header */}
          <div className="text-center space-y-3">
            <div className="flex justify-center">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl">
                <Zap className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Sign in to Disaster Direct
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Demo login - Creates a local JWT for testing
            </p>
          </div>

          {/* Demo Notice */}
          <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <Shield className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-amber-800 dark:text-amber-200">
              <strong>Development Mode:</strong> This creates an unsigned JWT for local testing only.
              In production, use Auth0, Clerk, or Supabase.
            </div>
          </div>

          {/* Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Role
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                data-testid="select-role"
              >
                <option value="admin">Admin</option>
                <option value="contractor">Contractor</option>
                <option value="homeowner">Homeowner</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                User ID
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="user-123"
                data-testid="input-userid"
              />
            </div>
          </div>

          {/* Submit */}
          <button
            className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
            onClick={localLogin}
            data-testid="button-continue"
          >
            Continue to Platform
          </button>

          {/* Footer */}
          <p className="text-xs text-center text-gray-500 dark:text-gray-400">
            Set <code className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">VITE_AUTH_PROVIDER</code> to
            enable real OAuth providers
          </p>
        </div>
      </div>
    </main>
  );
}
