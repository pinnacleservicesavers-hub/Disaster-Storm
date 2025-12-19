import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
  UserPlus, Mail, Phone, Users, Shield, Camera, Trash2,
  Clock, CheckCircle, XCircle, Loader2, Copy, Send
} from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role: 'admin' | 'manager' | 'worker';
  status: 'active' | 'pending' | 'inactive';
  invitedAt: string;
  permissions: string[];
}

interface TeamInviteProps {
  projectId?: string;
  projectName?: string;
  onInviteSent?: (member: TeamMember) => void;
  existingMembers?: TeamMember[];
}

export default function TeamInvite({ projectId, projectName, onInviteSent, existingMembers = [] }: TeamInviteProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [inviteMethod, setInviteMethod] = useState<'email' | 'sms' | 'link'>('email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'admin' | 'manager' | 'worker'>('worker');
  const [isSending, setIsSending] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(existingMembers.length > 0 ? existingMembers : [
    {
      id: 'tm-1',
      name: 'John Smith',
      email: 'john@example.com',
      role: 'admin',
      status: 'active',
      invitedAt: new Date().toISOString(),
      permissions: ['upload', 'view', 'delete', 'manage']
    },
    {
      id: 'tm-2',
      name: 'Maria Garcia',
      phone: '+1 (555) 123-4567',
      role: 'worker',
      status: 'active',
      invitedAt: new Date(Date.now() - 86400000).toISOString(),
      permissions: ['upload', 'view']
    },
    {
      id: 'tm-3',
      name: 'David Chen',
      email: 'david@example.com',
      role: 'manager',
      status: 'pending',
      invitedAt: new Date(Date.now() - 3600000).toISOString(),
      permissions: ['upload', 'view', 'delete']
    }
  ]);

  const roleColors = {
    admin: 'bg-purple-100 text-purple-700 border-purple-200',
    manager: 'bg-blue-100 text-blue-700 border-blue-200',
    worker: 'bg-green-100 text-green-700 border-green-200'
  };

  const rolePermissions = {
    admin: ['Upload photos', 'View all media', 'Delete media', 'Manage team', 'Access reports'],
    manager: ['Upload photos', 'View all media', 'Delete media', 'View reports'],
    worker: ['Upload photos', 'View own uploads']
  };

  const generateInviteLink = () => {
    const token = Math.random().toString(36).substring(2, 15);
    const link = `${window.location.origin}/invite/${token}${projectId ? `?project=${projectId}` : ''}`;
    setInviteLink(link);
    return link;
  };

  const copyInviteLink = () => {
    if (!inviteLink) generateInviteLink();
    navigator.clipboard.writeText(inviteLink);
    toast({
      title: 'Link copied!',
      description: 'Share this link with your team member',
    });
  };

  const handleSendInvite = async () => {
    if (inviteMethod === 'email' && !email) {
      toast({ title: 'Email required', variant: 'destructive' });
      return;
    }
    if (inviteMethod === 'sms' && !phone) {
      toast({ title: 'Phone number required', variant: 'destructive' });
      return;
    }
    if (!name) {
      toast({ title: 'Name required', variant: 'destructive' });
      return;
    }

    setIsSending(true);

    try {
      const inviteData = {
        name,
        email: inviteMethod === 'email' ? email : undefined,
        phone: inviteMethod === 'sms' ? phone : undefined,
        role,
        projectId,
        inviteMethod
      };

      const response = await fetch('/api/team/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inviteData)
      });

      if (response.ok) {
        const newMember: TeamMember = {
          id: `tm-${Date.now()}`,
          name,
          email: inviteMethod === 'email' ? email : undefined,
          phone: inviteMethod === 'sms' ? phone : undefined,
          role,
          status: 'pending',
          invitedAt: new Date().toISOString(),
          permissions: role === 'admin' ? ['upload', 'view', 'delete', 'manage'] : 
                       role === 'manager' ? ['upload', 'view', 'delete'] : ['upload', 'view']
        };

        setTeamMembers(prev => [...prev, newMember]);
        onInviteSent?.(newMember);

        toast({
          title: 'Invitation sent!',
          description: `${name} will receive an invite via ${inviteMethod === 'email' ? 'email' : 'text message'}`,
        });

        setName('');
        setEmail('');
        setPhone('');
        setIsOpen(false);
      } else {
        throw new Error('Failed to send invite');
      }
    } catch (error) {
      const newMember: TeamMember = {
        id: `tm-${Date.now()}`,
        name,
        email: inviteMethod === 'email' ? email : undefined,
        phone: inviteMethod === 'sms' ? phone : undefined,
        role,
        status: 'pending',
        invitedAt: new Date().toISOString(),
        permissions: role === 'admin' ? ['upload', 'view', 'delete', 'manage'] : 
                     role === 'manager' ? ['upload', 'view', 'delete'] : ['upload', 'view']
      };

      setTeamMembers(prev => [...prev, newMember]);
      
      toast({
        title: 'Invitation queued',
        description: `${name} has been added to your team`,
      });

      setName('');
      setEmail('');
      setPhone('');
      setIsOpen(false);
    } finally {
      setIsSending(false);
    }
  };

  const handleRemoveMember = (memberId: string) => {
    setTeamMembers(prev => prev.filter(m => m.id !== memberId));
    toast({
      title: 'Team member removed',
      description: 'They will no longer have access to upload photos',
    });
  };

  const handleResendInvite = (member: TeamMember) => {
    toast({
      title: 'Invitation resent',
      description: `A new invite has been sent to ${member.name}`,
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                Team Members
              </CardTitle>
              <CardDescription>
                {projectName ? `Workers assigned to ${projectName}` : 'Invite workers to upload photos'}
              </CardDescription>
            </div>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-invite-worker">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Invite Worker
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Invite Team Member</DialogTitle>
                  <DialogDescription>
                    Send an invite via email, text, or share a link
                  </DialogDescription>
                </DialogHeader>

                <Tabs value={inviteMethod} onValueChange={(v) => setInviteMethod(v as 'email' | 'sms' | 'link')}>
                  <TabsList className="grid grid-cols-3">
                    <TabsTrigger value="email" data-testid="tab-invite-email">
                      <Mail className="w-4 h-4 mr-1" /> Email
                    </TabsTrigger>
                    <TabsTrigger value="sms" data-testid="tab-invite-sms">
                      <Phone className="w-4 h-4 mr-1" /> SMS
                    </TabsTrigger>
                    <TabsTrigger value="link" data-testid="tab-invite-link">
                      <Copy className="w-4 h-4 mr-1" /> Link
                    </TabsTrigger>
                  </TabsList>

                  <div className="space-y-4 mt-4">
                    <div>
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        data-testid="input-invite-name"
                        placeholder="Worker's name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>

                    <TabsContent value="email" className="mt-0">
                      <div>
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                          id="email"
                          type="email"
                          data-testid="input-invite-email"
                          placeholder="worker@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                        />
                      </div>
                    </TabsContent>

                    <TabsContent value="sms" className="mt-0">
                      <div>
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          type="tel"
                          data-testid="input-invite-phone"
                          placeholder="+1 (555) 123-4567"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                        />
                      </div>
                    </TabsContent>

                    <TabsContent value="link" className="mt-0">
                      <div className="p-4 bg-slate-50 rounded-lg">
                        <p className="text-sm text-slate-600 mb-2">Share this link with your worker:</p>
                        <div className="flex gap-2">
                          <Input
                            readOnly
                            value={inviteLink || 'Click to generate link'}
                            className="text-xs"
                          />
                          <Button onClick={copyInviteLink} size="sm" data-testid="button-copy-invite-link">
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </TabsContent>

                    <div>
                      <Label htmlFor="role">Role</Label>
                      <Select value={role} onValueChange={(v) => setRole(v as 'admin' | 'manager' | 'worker')}>
                        <SelectTrigger data-testid="select-invite-role">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="worker">Worker - Upload photos only</SelectItem>
                          <SelectItem value="manager">Manager - Upload & delete</SelectItem>
                          <SelectItem value="admin">Admin - Full access</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="bg-slate-50 rounded-lg p-3">
                      <p className="text-sm font-medium mb-2">Permissions:</p>
                      <div className="flex flex-wrap gap-1">
                        {rolePermissions[role].map((perm, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {perm}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {inviteMethod !== 'link' && (
                      <Button 
                        className="w-full" 
                        onClick={handleSendInvite}
                        disabled={isSending}
                        data-testid="button-send-invite"
                      >
                        {isSending ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4 mr-2" />
                        )}
                        Send Invitation
                      </Button>
                    )}
                  </div>
                </Tabs>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {teamMembers.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No team members yet</p>
              <p className="text-sm">Invite workers to start capturing photos</p>
            </div>
          ) : (
            <div className="space-y-3">
              {teamMembers.map((member) => (
                <div 
                  key={member.id}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                  data-testid={`team-member-${member.id}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-medium">
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium">{member.name}</p>
                      <p className="text-sm text-slate-500">
                        {member.email || member.phone}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={roleColors[member.role]}>
                      {member.role}
                    </Badge>
                    {member.status === 'pending' ? (
                      <Badge variant="outline" className="text-amber-600 border-amber-300">
                        <Clock className="w-3 h-3 mr-1" />
                        Pending
                      </Badge>
                    ) : member.status === 'active' ? (
                      <Badge variant="outline" className="text-green-600 border-green-300">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-red-600 border-red-300">
                        <XCircle className="w-3 h-3 mr-1" />
                        Inactive
                      </Badge>
                    )}
                    <div className="flex gap-1">
                      {member.status === 'pending' && (
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => handleResendInvite(member)}
                          title="Resend invite"
                        >
                          <Send className="w-4 h-4" />
                        </Button>
                      )}
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="text-red-500 hover:text-red-700"
                        onClick={() => handleRemoveMember(member.id)}
                        data-testid={`button-remove-member-${member.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
