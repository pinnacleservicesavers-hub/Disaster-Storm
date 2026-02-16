import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  MessageSquare, Send, Clock, User, Plus, ArrowLeft,
  Shield, AlertTriangle, Hash, Mail, FileText, Eye
} from "lucide-react";

interface Message {
  id: number;
  contract_id: string | null;
  project_id: string | null;
  thread_id: string;
  parent_message_id: number | null;
  sender_name: string;
  sender_role: string;
  sender_email: string | null;
  recipient_role: string | null;
  subject: string | null;
  message_body: string;
  message_type: string;
  priority: string;
  is_read: boolean;
  attachments: any[];
  created_at: string;
}

interface Thread {
  thread_id: string;
  subject: string;
  last_message_at: string;
  message_count: number;
  participants: string[];
}

const ROLE_OPTIONS = [
  { value: 'prime', label: 'Prime Contractor' },
  { value: 'contractor', label: 'Contractor / Sub' },
  { value: 'fema_monitor', label: 'FEMA Monitor' },
  { value: 'project_manager', label: 'Project Manager' },
  { value: 'admin', label: 'Administrator' },
];

const PRIORITY_OPTIONS = [
  { value: 'normal', label: 'Normal', color: 'text-slate-400' },
  { value: 'high', label: 'High', color: 'text-orange-400' },
  { value: 'urgent', label: 'Urgent', color: 'text-red-400' },
];

export default function ProjectCommunicationsComponent() {
  const { toast } = useToast();
  const [view, setView] = useState<'threads' | 'thread' | 'compose' | 'audit'>('threads');
  const [threads, setThreads] = useState<Thread[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [allMessages, setAllMessages] = useState<Message[]>([]);
  const [activeThread, setActiveThread] = useState<string | null>(null);
  const [activeSubject, setActiveSubject] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [newMessage, setNewMessage] = useState({
    senderName: '',
    senderRole: 'contractor',
    senderEmail: '',
    recipientRole: '',
    subject: '',
    messageBody: '',
    priority: 'normal',
  });

  const [replyText, setReplyText] = useState('');
  const [replySenderName, setReplySenderName] = useState('');
  const [replySenderRole, setReplySenderRole] = useState('contractor');

  const loadThreads = useCallback(async () => {
    try {
      const data = await apiRequest('/api/fema-data/project-messages/threads');
      if (data.success) setThreads(data.threads || []);
    } catch (err) {
      console.error('Failed to load threads:', err);
    }
    setLoading(false);
  }, []);

  const loadAllMessages = useCallback(async () => {
    try {
      const data = await apiRequest('/api/fema-data/audit-trail');
      if (data.success) setAllMessages(data.events || []);
    } catch (err) {
      console.error('Failed to load audit trail:', err);
    }
  }, []);

  const loadThread = useCallback(async (threadId: string) => {
    try {
      const data = await apiRequest(`/api/fema-data/project-messages?threadId=${threadId}`);
      if (data.success) setMessages(data.messages || []);
    } catch (err) {
      console.error('Failed to load thread:', err);
    }
  }, []);

  useEffect(() => { loadThreads(); loadAllMessages(); }, [loadThreads, loadAllMessages]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const openThread = (threadId: string, subject: string) => {
    setActiveThread(threadId);
    setActiveSubject(subject);
    setView('thread');
    loadThread(threadId);
  };

  const sendNewMessage = async () => {
    if (!newMessage.senderName || !newMessage.messageBody || !newMessage.subject) {
      toast({ title: "Missing Fields", description: "Subject, sender name, and message are required", variant: "destructive" });
      return;
    }
    try {
      const data = await apiRequest('/api/fema-data/project-messages', 'POST', {
        senderName: newMessage.senderName,
        senderRole: newMessage.senderRole,
        senderEmail: newMessage.senderEmail,
        recipientRole: newMessage.recipientRole,
        subject: newMessage.subject,
        messageBody: newMessage.messageBody,
        priority: newMessage.priority,
        messageType: 'message',
      });
      if (data.success) {
        toast({ title: "Message Sent", description: `Sent and timestamped at ${new Date().toLocaleString()}` });
        setNewMessage({ senderName: '', senderRole: 'contractor', senderEmail: '', recipientRole: '', subject: '', messageBody: '', priority: 'normal' });
        setView('threads');
        loadThreads();
        loadAllMessages();
      }
    } catch (err) {
      toast({ title: "Send Failed", description: "Could not send message", variant: "destructive" });
    }
  };

  const sendReply = async () => {
    if (!replySenderName || !replyText || !activeThread) {
      toast({ title: "Missing Fields", description: "Name and message are required", variant: "destructive" });
      return;
    }
    try {
      const data = await apiRequest('/api/fema-data/project-messages', 'POST', {
        threadId: activeThread,
        senderName: replySenderName,
        senderRole: replySenderRole,
        subject: activeSubject,
        messageBody: replyText,
        messageType: 'reply',
      });
      if (data.success) {
        setReplyText('');
        toast({ title: "Reply Sent", description: "Timestamped and added to thread" });
        loadThread(activeThread);
        loadThreads();
        loadAllMessages();
      }
    } catch (err) {
      toast({ title: "Reply Failed", description: "Could not send reply", variant: "destructive" });
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'prime': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'contractor': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'fema_monitor': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'project_manager': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'system': return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const getPriorityBadge = (p: string) => {
    if (p === 'urgent') return <Badge variant="destructive" className="text-[10px]">URGENT</Badge>;
    if (p === 'high') return <Badge className="text-[10px] bg-orange-500/20 text-orange-400 border-orange-500/30">HIGH</Badge>;
    return null;
  };

  return (
    <div className="space-y-4">
      <Card className="bg-slate-900 border-slate-700">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {view !== 'threads' && (
                <Button variant="ghost" size="sm" onClick={() => { setView('threads'); setActiveThread(null); }}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              )}
              <div>
                <CardTitle className="text-lg text-white flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-blue-400" />
                  {view === 'threads' && 'Project Communications'}
                  {view === 'thread' && activeSubject}
                  {view === 'compose' && 'New Message'}
                  {view === 'audit' && 'Communication Audit Trail'}
                </CardTitle>
                <p className="text-sm text-slate-400 mt-1">
                  Secure, timestamped messaging — every message permanently logged for legal defensibility
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              {view === 'threads' && (
                <>
                  <Button variant="outline" size="sm" onClick={() => setView('audit')}>
                    <Eye className="h-4 w-4 mr-1" /> Audit Trail
                  </Button>
                  <Button size="sm" onClick={() => setView('compose')}>
                    <Plus className="h-4 w-4 mr-1" /> New Thread
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {view === 'threads' && (
            <div className="space-y-2">
              {loading ? (
                <div className="text-center py-8 text-slate-400">Loading threads...</div>
              ) : threads.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p className="text-lg font-medium">No messages yet</p>
                  <p className="text-sm mt-1">Start a new thread to begin documented communication</p>
                  <Button className="mt-4" onClick={() => setView('compose')}>
                    <Plus className="h-4 w-4 mr-1" /> Start First Thread
                  </Button>
                </div>
              ) : (
                threads.map((thread) => (
                  <div key={thread.thread_id}
                    onClick={() => openThread(thread.thread_id, thread.subject || 'Untitled Thread')}
                    className="p-3 rounded-lg bg-slate-800 hover:bg-slate-750 cursor-pointer border border-slate-700 hover:border-blue-500/50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Hash className="h-4 w-4 text-blue-400" />
                          <span className="text-sm font-medium text-white">{thread.subject || 'Untitled Thread'}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" /> {thread.message_count} messages
                          </span>
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {new Date(thread.last_message_at).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        {(thread.participants || []).filter(p => p !== 'system').map((p: string) => (
                          <Badge key={p} variant="outline" className={`text-[10px] ${getRoleColor(p)}`}>{p}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {view === 'thread' && activeThread && (
            <div className="space-y-4">
              <div className="max-h-[400px] overflow-y-auto space-y-3 pr-2">
                {messages.map((msg) => (
                  <div key={msg.id} className={`p-3 rounded-lg border ${msg.message_type === 'system_event' ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-800 border-slate-700'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <User className="h-3 w-3 text-slate-400" />
                      <span className="text-sm font-medium text-white">{msg.sender_name}</span>
                      <Badge variant="outline" className={`text-[10px] ${getRoleColor(msg.sender_role)}`}>{msg.sender_role}</Badge>
                      {getPriorityBadge(msg.priority)}
                      <span className="text-[10px] text-slate-500 ml-auto flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(msg.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-slate-300 whitespace-pre-wrap ml-5">{msg.message_body}</p>
                    {msg.message_type === 'system_event' && (
                      <div className="flex items-center gap-1 ml-5 mt-1">
                        <Shield className="h-3 w-3 text-slate-500" />
                        <span className="text-[10px] text-slate-500">System event — automatically logged</span>
                      </div>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <div className="border-t border-slate-700 pt-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-slate-400 text-xs">Your Name *</Label>
                    <Input value={replySenderName} onChange={(e) => setReplySenderName(e.target.value)}
                      placeholder="Your name" className="bg-slate-800 border-slate-600 text-white h-8 text-sm mt-1" />
                  </div>
                  <div>
                    <Label className="text-slate-400 text-xs">Your Role</Label>
                    <Select value={replySenderRole} onValueChange={setReplySenderRole}>
                      <SelectTrigger className="bg-slate-800 border-slate-600 text-white h-8 text-sm mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLE_OPTIONS.map(r => (
                          <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Textarea value={replyText} onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type your reply..."
                    className="bg-slate-800 border-slate-600 text-white flex-1" rows={2} />
                  <Button className="self-end" onClick={sendReply} disabled={!replyText || !replySenderName}>
                    <Send className="h-4 w-4 mr-1" /> Reply
                  </Button>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-slate-500">
                  <Shield className="h-3 w-3" />
                  All replies are permanently timestamped, user-stamped, and immutable
                </div>
              </div>
            </div>
          )}

          {view === 'compose' && (
            <div className="space-y-4 max-w-2xl">
              <div>
                <Label className="text-slate-300">Subject *</Label>
                <Input value={newMessage.subject} onChange={(e) => setNewMessage(p => ({ ...p, subject: e.target.value }))}
                  placeholder="e.g., Rate Sheet Revision Request - Change Order #003"
                  className="bg-slate-800 border-slate-600 text-white mt-1" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-slate-300">Your Name *</Label>
                  <Input value={newMessage.senderName} onChange={(e) => setNewMessage(p => ({ ...p, senderName: e.target.value }))}
                    placeholder="Your full name" className="bg-slate-800 border-slate-600 text-white mt-1" />
                </div>
                <div>
                  <Label className="text-slate-300">Your Role</Label>
                  <Select value={newMessage.senderRole} onValueChange={(v) => setNewMessage(p => ({ ...p, senderRole: v }))}>
                    <SelectTrigger className="bg-slate-800 border-slate-600 text-white mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLE_OPTIONS.map(r => (
                        <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-slate-300">Priority</Label>
                  <Select value={newMessage.priority} onValueChange={(v) => setNewMessage(p => ({ ...p, priority: v }))}>
                    <SelectTrigger className="bg-slate-800 border-slate-600 text-white mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORITY_OPTIONS.map(p => (
                        <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-slate-300">Your Email</Label>
                  <Input value={newMessage.senderEmail} onChange={(e) => setNewMessage(p => ({ ...p, senderEmail: e.target.value }))}
                    placeholder="email@company.com" type="email" className="bg-slate-800 border-slate-600 text-white mt-1" />
                </div>
                <div>
                  <Label className="text-slate-300">To (Role)</Label>
                  <Select value={newMessage.recipientRole} onValueChange={(v) => setNewMessage(p => ({ ...p, recipientRole: v }))}>
                    <SelectTrigger className="bg-slate-800 border-slate-600 text-white mt-1">
                      <SelectValue placeholder="Select recipient role" />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLE_OPTIONS.map(r => (
                        <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-slate-300">Message *</Label>
                <Textarea value={newMessage.messageBody} onChange={(e) => setNewMessage(p => ({ ...p, messageBody: e.target.value }))}
                  placeholder="Type your message..."
                  className="bg-slate-800 border-slate-600 text-white mt-1" rows={5} />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-[10px] text-slate-500">
                  <Shield className="h-3 w-3" />
                  This message will be permanently timestamped and stored for audit compliance
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setView('threads')}>Cancel</Button>
                  <Button onClick={sendNewMessage} disabled={!newMessage.subject || !newMessage.senderName || !newMessage.messageBody}>
                    <Send className="h-4 w-4 mr-1" /> Send & Record
                  </Button>
                </div>
              </div>
            </div>
          )}

          {view === 'audit' && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="h-5 w-5 text-blue-400" />
                <span className="text-sm font-medium text-white">Complete Communication & Document Audit Trail</span>
                <Badge variant="outline" className="text-slate-400 border-slate-600">{allMessages.length} Events</Badge>
              </div>
              <div className="max-h-[500px] overflow-y-auto space-y-1">
                {allMessages.map((event: any) => (
                  <div key={`${event.event_type}-${event.id}`} className="flex items-start gap-3 p-2 rounded bg-slate-800/50 border border-slate-700/50">
                    <div className="shrink-0 mt-0.5">
                      {event.event_type === 'document_upload' ? (
                        <FileText className="h-3.5 w-3.5 text-green-400" />
                      ) : event.message_type === 'system_event' ? (
                        <Shield className="h-3.5 w-3.5 text-slate-500" />
                      ) : (
                        <MessageSquare className="h-3.5 w-3.5 text-blue-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-medium text-white">
                          {event.event_type === 'document_upload' ? event.uploaded_by : event.sender_name}
                        </span>
                        <Badge variant="outline" className={`text-[9px] ${getRoleColor(event.event_type === 'document_upload' ? (event.uploaded_by_role || 'contractor') : event.sender_role)}`}>
                          {event.event_type === 'document_upload' ? (event.uploaded_by_role || 'contractor') : event.sender_role}
                        </Badge>
                        {event.event_type === 'document_upload' ? (
                          <Badge variant="outline" className="text-[9px] bg-green-500/10 text-green-400 border-green-500/30">DOC UPLOAD</Badge>
                        ) : null}
                        {event.subject && <span className="text-[10px] text-slate-400">— {event.subject}</span>}
                      </div>
                      <p className="text-xs text-slate-400 truncate">
                        {event.event_type === 'document_upload'
                          ? `Uploaded "${event.document_name}" [${event.document_type}]`
                          : event.message_body}
                      </p>
                    </div>
                    <span className="text-[10px] text-slate-500 shrink-0 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(event.created_at).toLocaleString()}
                    </span>
                  </div>
                ))}
                {allMessages.length === 0 && (
                  <div className="text-center py-8 text-slate-500">
                    <Shield className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p>No audit events recorded yet</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
