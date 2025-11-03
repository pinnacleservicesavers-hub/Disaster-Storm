import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AuthStub() {
  const [role, setRole] = useState('admin');
  const [userId, setUserId] = useState('demo-admin');
  const [scopes, setScopes] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const r = localStorage.getItem('role');
      if (r) setRole(r);
      const u = localStorage.getItem('user_id');
      if (u) setUserId(u);
      const s = localStorage.getItem('scopes');
      if (s) setScopes(s);
    } catch {}
  }, []);

  const save = () => {
    localStorage.setItem('role', role);
    localStorage.setItem('user_id', userId);
    localStorage.setItem('scopes', scopes);
    alert(`Saved! Role: ${role}, User: ${userId}`);
  };

  const navigateToPortal = () => {
    if (role === 'admin') {
      navigate('/admin/legal/zipmap');
    } else if (role === 'contractor') {
      navigate('/contractor/jobs');
    } else {
      navigate('/');
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 p-8">
      <Card className="max-w-2xl mx-auto p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Auth Stub (Demo Only)
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Set your role, user ID, and scopes for testing the role-based portals.
          </p>
        </div>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="role">Role</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger id="role" data-testid="select-role">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="contractor">Contractor</SelectItem>
                <SelectItem value="homeowner">Homeowner</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="user_id">User ID</Label>
            <Input
              id="user_id"
              data-testid="input-user-id"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="Enter user ID"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="scopes">Scopes (comma-separated)</Label>
            <Input
              id="scopes"
              data-testid="input-scopes"
              value={scopes}
              onChange={(e) => setScopes(e.target.value)}
              placeholder="e.g., read:jobs, write:claims"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <Button onClick={save} data-testid="button-save">
            Save to localStorage
          </Button>
          <Button onClick={navigateToPortal} variant="outline" data-testid="button-navigate">
            Go to {role === 'admin' ? 'Admin' : role === 'contractor' ? 'Contractor' : 'Home'} Portal
          </Button>
        </div>

        <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
          <p className="text-xs text-gray-500 dark:text-gray-500">
            <strong>Demo-only authentication.</strong> In production, replace this with a real auth provider like Clerk, Auth0, or Supabase.
          </p>
          <div className="mt-3 space-y-1 text-xs text-gray-600 dark:text-gray-400">
            <div>• <strong>Admin</strong> → Access to /admin/* pages</div>
            <div>• <strong>Contractor</strong> → Access to /contractor/* pages (+ admin can access too)</div>
            <div>• <strong>Homeowner</strong> → General access</div>
          </div>
        </div>
      </Card>
    </main>
  );
}
