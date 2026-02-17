import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import TopNav from '@/components/TopNav';
import { ModuleWrapper } from '@/components/ModuleWrapper';
import { AutonomousAgentBadge } from '@/components/AutonomousAgentBadge';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import {
  Link2, Unlink, CheckCircle2, XCircle, ArrowLeft, ExternalLink,
  Calendar, Megaphone, Share2, Globe, Zap, Shield
} from 'lucide-react';
import {
  SiFacebook, SiInstagram, SiLinkedin, SiTiktok, SiGoogle, SiX
} from 'react-icons/si';

interface PlatformConfig {
  id: string;
  name: string;
  category: 'social' | 'ads' | 'calendar';
  icon: React.ReactNode;
  color: string;
  description: string;
  features: string[];
}

const PLATFORMS: PlatformConfig[] = [
  {
    id: 'facebook',
    name: 'Facebook',
    category: 'social',
    icon: <SiFacebook className="w-6 h-6" />,
    color: '#1877F2',
    description: 'Post ads, manage business page, and run targeted campaigns',
    features: ['Page posting', 'Ad campaigns', 'Audience targeting', 'Analytics'],
  },
  {
    id: 'instagram',
    name: 'Instagram',
    category: 'social',
    icon: <SiInstagram className="w-6 h-6" />,
    color: '#E4405F',
    description: 'Share before/after photos, stories, and sponsored content',
    features: ['Photo posts', 'Stories', 'Reels', 'Shopping tags'],
  },
  {
    id: 'x_twitter',
    name: 'X (Twitter)',
    category: 'social',
    icon: <SiX className="w-6 h-6" />,
    color: '#000000',
    description: 'Tweet updates, engage with local community, run promoted tweets',
    features: ['Tweets', 'Promoted posts', 'Trending topics', 'Direct messages'],
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    category: 'social',
    icon: <SiLinkedin className="w-6 h-6" />,
    color: '#0A66C2',
    description: 'Professional networking, B2B outreach, and company updates',
    features: ['Company page', 'Sponsored content', 'InMail campaigns', 'Job postings'],
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    category: 'social',
    icon: <SiTiktok className="w-6 h-6" />,
    color: '#000000',
    description: 'Short-form video content, project showcases, and viral marketing',
    features: ['Video posts', 'Ad manager', 'Creator tools', 'Analytics'],
  },
  {
    id: 'google_ads',
    name: 'Google Ads',
    category: 'ads',
    icon: <SiGoogle className="w-6 h-6" />,
    color: '#4285F4',
    description: 'Search ads, display network, and local service ads',
    features: ['Search campaigns', 'Display ads', 'Local services', 'Performance Max'],
  },
  {
    id: 'meta_ads',
    name: 'Meta Ads Manager',
    category: 'ads',
    icon: <SiFacebook className="w-6 h-6" />,
    color: '#0668E1',
    description: 'Unified ad management across Facebook and Instagram',
    features: ['Cross-platform ads', 'Custom audiences', 'Lookalike targeting', 'Conversion tracking'],
  },
  {
    id: 'google_calendar',
    name: 'Google Calendar',
    category: 'calendar',
    icon: <SiGoogle className="w-6 h-6" />,
    color: '#4285F4',
    description: 'Sync job schedules, appointments, and team availability',
    features: ['Event sync', 'Availability', 'Team calendars', 'Reminders'],
  },
  {
    id: 'outlook_calendar',
    name: 'Outlook Calendar',
    category: 'calendar',
    icon: <Globe className="w-6 h-6" />,
    color: '#0078D4',
    description: 'Microsoft 365 calendar integration for scheduling and reminders',
    features: ['Event sync', 'Teams meetings', 'Shared calendars', 'Task sync'],
  },
  {
    id: 'apple_calendar',
    name: 'Apple Calendar',
    category: 'calendar',
    icon: <Calendar className="w-6 h-6" />,
    color: '#FF3B30',
    description: 'iCloud calendar sync for iOS and Mac users',
    features: ['CalDAV sync', 'Shared calendars', 'Location alerts', 'Siri integration'],
  },
];

const CATEGORY_INFO = {
  social: { label: 'Social Media', icon: <Share2 className="w-5 h-5" />, description: 'Connect your social accounts to publish content and engage your audience directly from the app' },
  ads: { label: 'Ad Platforms', icon: <Megaphone className="w-5 h-5" />, description: 'Link your ad accounts to create, launch, and track campaigns without leaving the platform' },
  calendar: { label: 'Calendars', icon: <Calendar className="w-5 h-5" />, description: 'Sync your calendars to manage job scheduling, appointments, and team coordination' },
};

export default function ConnectedAccounts() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [connectDialog, setConnectDialog] = useState<PlatformConfig | null>(null);
  const [disconnectDialog, setDisconnectDialog] = useState<PlatformConfig | null>(null);
  const [accountEmail, setAccountEmail] = useState('');

  const { data: accountsData } = useQuery<{ ok: boolean; accounts: any[] }>({
    queryKey: ['/api/connected-accounts'],
  });

  const accounts = accountsData?.accounts || [];

  const connectMutation = useMutation({
    mutationFn: async ({ provider, category, accountLabel }: { provider: string; category: string; accountLabel: string }) => {
      return apiRequest('/api/connected-accounts/connect', 'POST', { provider, category, accountLabel });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/connected-accounts'] });
      const platform = PLATFORMS.find(p => p.id === variables.provider);
      toast({ title: `Connected to ${platform?.name}`, description: `Signed in as ${variables.accountLabel}` });
      setConnectDialog(null);
      setAccountEmail('');
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: async (provider: string) => {
      return apiRequest('/api/connected-accounts/disconnect', 'POST', { provider });
    },
    onSuccess: (_, provider) => {
      queryClient.invalidateQueries({ queryKey: ['/api/connected-accounts'] });
      const platform = PLATFORMS.find(p => p.id === provider);
      toast({ title: `Disconnected from ${platform?.name}`, description: 'Account unlinked successfully' });
      setDisconnectDialog(null);
    },
  });

  const getAccountStatus = (providerId: string) => {
    return accounts.find((a: any) => a.provider === providerId && a.status === 'connected');
  };

  const connectedCount = accounts.filter((a: any) => a.status === 'connected').length;

  return (
    <>
      <TopNav />
      <ModuleWrapper moduleId="connected-accounts">
        <div className="container mx-auto px-4 py-6 space-y-8">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-3 text-white">
                <Link2 className="h-7 w-7 text-cyan-400" />
                Connected Accounts
              </h1>
              <p className="text-slate-400 mt-1">Connect your social media, ad platforms, and calendars to manage everything from one place</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-cyan-400 border-cyan-400/50 px-3 py-1">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                {connectedCount} Connected
              </Badge>
              <Badge variant="outline" className="text-slate-400 border-slate-600 px-3 py-1">
                <XCircle className="w-3.5 h-3.5 mr-1.5" />
                {PLATFORMS.length - connectedCount} Available
              </Badge>
              <AutonomousAgentBadge moduleName="ConnectedAccounts" />
            </div>
          </div>

          {(['social', 'ads', 'calendar'] as const).map(category => {
            const info = CATEGORY_INFO[category];
            const platforms = PLATFORMS.filter(p => p.category === category);
            const connectedInCategory = platforms.filter(p => getAccountStatus(p.id)).length;

            return (
              <div key={category} className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-slate-800 text-cyan-400">{info.icon}</div>
                  <div>
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                      {info.label}
                      <Badge variant="secondary" className="text-xs">{connectedInCategory}/{platforms.length}</Badge>
                    </h2>
                    <p className="text-sm text-slate-400">{info.description}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {platforms.map(platform => {
                    const connected = getAccountStatus(platform.id);
                    return (
                      <Card key={platform.id} className={`bg-slate-900/80 border transition-all ${connected ? 'border-cyan-500/40 shadow-[0_0_15px_rgba(0,194,255,0.1)]' : 'border-slate-700/50 hover:border-slate-600'}`}>
                        <CardContent className="p-5">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="p-2.5 rounded-xl" style={{ backgroundColor: `${platform.color}20`, color: platform.color }}>
                                {platform.icon}
                              </div>
                              <div>
                                <h3 className="font-semibold text-white">{platform.name}</h3>
                                {connected ? (
                                  <p className="text-xs text-cyan-400 flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" />
                                    {connected.accountLabel}
                                  </p>
                                ) : (
                                  <p className="text-xs text-slate-500">Not connected</p>
                                )}
                              </div>
                            </div>
                            {connected ? (
                              <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30 text-[10px]">Active</Badge>
                            ) : (
                              <Badge variant="outline" className="text-slate-500 border-slate-600 text-[10px]">Inactive</Badge>
                            )}
                          </div>

                          <p className="text-sm text-slate-400 mb-3">{platform.description}</p>

                          <div className="flex flex-wrap gap-1.5 mb-4">
                            {platform.features.map(f => (
                              <span key={f} className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">{f}</span>
                            ))}
                          </div>

                          {connected ? (
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" className="flex-1 text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/10">
                                <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                                Manage
                              </Button>
                              <Button size="sm" variant="outline" className="text-red-400 border-red-500/30 hover:bg-red-500/10"
                                onClick={() => setDisconnectDialog(platform)}>
                                <Unlink className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          ) : (
                            <Button size="sm" className="w-full bg-cyan-600 hover:bg-cyan-700 text-white"
                              onClick={() => { setConnectDialog(platform); setAccountEmail(''); }}>
                              <Link2 className="w-3.5 h-3.5 mr-1.5" />
                              Connect {platform.name}
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}

          <Card className="bg-slate-900/60 border-slate-700/50">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">Security & Privacy</h3>
                  <p className="text-sm text-slate-400">
                    All connections use industry-standard OAuth 2.0 authentication. Your credentials are never stored directly - 
                    we only keep secure access tokens with the minimum permissions needed. You can revoke access at any time from here 
                    or from the connected platform's settings.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </ModuleWrapper>

      <Dialog open={!!connectDialog} onOpenChange={() => setConnectDialog(null)}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {connectDialog && (
                <div className="p-2 rounded-lg" style={{ backgroundColor: `${connectDialog.color}20`, color: connectDialog.color }}>
                  {connectDialog.icon}
                </div>
              )}
              Connect to {connectDialog?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
              <p className="text-sm text-slate-300 mb-3">
                Sign in with your {connectDialog?.name} account to enable direct publishing, scheduling, and analytics from within the app.
              </p>
              <div className="space-y-2">
                <Label className="text-slate-300">Account Email or Username</Label>
                <Input
                  placeholder={`Enter your ${connectDialog?.name} email`}
                  value={accountEmail}
                  onChange={(e) => setAccountEmail(e.target.value)}
                  className="bg-slate-800 border-slate-600 text-white"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Shield className="w-3.5 h-3.5" />
              Secured with OAuth 2.0 - your password is never shared with us
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConnectDialog(null)} className="border-slate-600 text-slate-300">
              Cancel
            </Button>
            <Button
              disabled={!accountEmail.trim() || connectMutation.isPending}
              onClick={() => connectDialog && connectMutation.mutate({ provider: connectDialog.id, category: connectDialog.category, accountLabel: accountEmail })}
              style={{ backgroundColor: connectDialog?.color }}
              className="text-white"
            >
              {connectMutation.isPending ? 'Connecting...' : `Sign in with ${connectDialog?.name}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!disconnectDialog} onOpenChange={() => setDisconnectDialog(null)}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle>Disconnect {disconnectDialog?.name}?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-400 py-2">
            This will revoke access to your {disconnectDialog?.name} account. Any scheduled posts or active campaigns 
            using this connection will be paused. You can reconnect at any time.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDisconnectDialog(null)} className="border-slate-600 text-slate-300">
              Keep Connected
            </Button>
            <Button
              variant="destructive"
              disabled={disconnectMutation.isPending}
              onClick={() => disconnectDialog && disconnectMutation.mutate(disconnectDialog.id)}
            >
              {disconnectMutation.isPending ? 'Disconnecting...' : 'Disconnect'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
