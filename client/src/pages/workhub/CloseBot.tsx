import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronRight, Volume2, VolumeX, Phone, MessageSquare,
  Play, Pause, CheckCircle, DollarSign, TrendingUp, Users,
  Send, Mic, MicOff, Sparkles, Heart, Star, ArrowRight,
  FileText, Headphones, PhoneCall, Settings, BarChart3,
  Clock, Target, Smile, ThumbsUp, AlertCircle, RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import TopNav from '@/components/TopNav';
import ModuleAIAssistant from '@/components/ModuleAIAssistant';
import { AutonomousAgentBadge } from '@/components/AutonomousAgentBadge';

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface Lead {
  id: number;
  name: string;
  phone: string;
  email: string;
  trade: string;
  estimateAmount: string;
  estimateDetails: string;
  sentDate: string;
  status: "pending" | "called" | "interested" | "closed" | "follow_up";
  lastContact?: string;
  notes?: string;
}

const DEMO_LEADS: Lead[] = [
  { id: 1, name: "Sarah Johnson", phone: "(555) 234-5678", email: "sarah.j@email.com", trade: "Tree Removal", estimateAmount: "$2,100", estimateDetails: "Large oak removal, stump grinding, complete debris cleanup", sentDate: "2 days ago", status: "pending" },
  { id: 2, name: "Michael Chen", phone: "(555) 345-6789", email: "m.chen@email.com", trade: "Roofing", estimateAmount: "$8,500", estimateDetails: "Full roof replacement, 30-year architectural shingles, underlayment, flashing", sentDate: "3 days ago", status: "follow_up", lastContact: "Called yesterday, wants to compare quotes" },
  { id: 3, name: "Jennifer Williams", phone: "(555) 456-7890", email: "jen.w@email.com", trade: "Storm Damage Repair", estimateAmount: "$5,200", estimateDetails: "Siding repair, gutter replacement, window trim, exterior painting", sentDate: "4 days ago", status: "interested", lastContact: "Very interested, checking with spouse" },
  { id: 4, name: "David Brown", phone: "(555) 567-8901", email: "dbrown@email.com", trade: "Flooring", estimateAmount: "$3,800", estimateDetails: "750 sq ft luxury vinyl plank, subfloor prep, transitions, baseboards", sentDate: "1 day ago", status: "pending" },
  { id: 5, name: "Lisa Martinez", phone: "(555) 678-9012", email: "lisa.m@email.com", trade: "Auto Hail Repair", estimateAmount: "$1,450", estimateDetails: "PDR for 23 dents, hood and roof panels, clear coat blend", sentDate: "5 days ago", status: "called", lastContact: "Left voicemail, will call back" },
];

const COMMON_OBJECTIONS = [
  "That seems really expensive",
  "I want to get a few more quotes first",
  "I need to think about it",
  "Can you do it cheaper?",
  "My neighbor got theirs done for less",
  "I'm not sure I need this done right now",
  "I want to wait until next month",
  "Can I pay in installments?",
];

const TRADES = [
  "Tree Removal", "Roofing", "Storm Damage Repair", "Flooring",
  "Auto Hail Repair", "Plumbing", "HVAC", "Electrical",
  "Painting", "Fencing", "Landscaping", "General Contracting"
];

export default function CloseBot() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [enableVoice, setEnableVoice] = useState(true);
  const [leads, setLeads] = useState<Lead[]>(DEMO_LEADS);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [demoPlaying, setDemoPlaying] = useState(false);
  const [demoScript, setDemoScript] = useState("");
  const [companyName, setCompanyName] = useState("Oak City Home Services");
  const [selectedTrade, setSelectedTrade] = useState("Tree Removal");
  const [scriptTone, setScriptTone] = useState<"warm" | "professional" | "urgent">("warm");
  const [generatedScript, setGeneratedScript] = useState("");
  const [selectedObjection, setSelectedObjection] = useState("");
  const [objectionResponse, setObjectionResponse] = useState("");
  const [callContext, setCallContext] = useState<any>(null);

  const audioRef = useRef<HTMLAudioElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  const playAudio = (audioUrl: string) => {
    if (audioRef.current) {
      audioRef.current.src = audioUrl;
      audioRef.current.play().catch(() => {});
    }
  };

  const chatMutation = useMutation({
    mutationFn: async (data: { message: string; history: any[]; context?: any; enableVoice: boolean }) => {
      const res = await apiRequest("POST", "/api/closebot/chat", data);
      return res.json();
    },
    onSuccess: (data) => {
      setChatHistory((prev) => [...prev, { role: "assistant", content: data.message }]);
      if (enableVoice && data.audioUrl) playAudio(data.audioUrl);
    },
    onError: () => {
      toast({ title: "Connection issue", description: "Rachel couldn't respond right now. Try again in a moment.", variant: "destructive" });
    },
  });

  const demoCallMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/closebot/demo-call", data);
      return res.json();
    },
    onSuccess: (data) => {
      setDemoScript(data.script);
      setDemoPlaying(true);
      if (data.audioUrl) {
        playAudio(data.audioUrl);
        if (audioRef.current) {
          audioRef.current.onended = () => setDemoPlaying(false);
        }
      } else {
        setTimeout(() => setDemoPlaying(false), 8000);
      }
    },
    onError: () => {
      toast({ title: "Demo unavailable", description: "Couldn't generate the demo call right now.", variant: "destructive" });
    },
  });

  const objectionMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/closebot/objection", data);
      return res.json();
    },
    onSuccess: (data) => {
      setObjectionResponse(data.response);
      if (enableVoice && data.audioUrl) playAudio(data.audioUrl);
    },
  });

  const scriptMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/closebot/generate-script", data);
      return res.json();
    },
    onSuccess: (data) => {
      setGeneratedScript(data.script);
    },
  });

  const sendChat = () => {
    if (!chatInput.trim()) return;
    const msg = chatInput.trim();
    setChatHistory((prev) => [...prev, { role: "user", content: msg }]);
    setChatInput("");
    chatMutation.mutate({
      message: msg,
      history: chatHistory.map((m) => ({ role: m.role, content: m.content })),
      context: callContext,
      enableVoice,
    });
  };

  const startLeadCall = (lead: Lead) => {
    setSelectedLead(lead);
    setCallContext({
      leadName: lead.name,
      companyName,
      trade: lead.trade,
      estimateAmount: lead.estimateAmount,
      estimateDetails: lead.estimateDetails,
      context: lead.notes || lead.lastContact || "",
    });
    setChatHistory([]);
    setActiveTab("conversation");
    const greeting = `I'm about to call ${lead.name} about their ${lead.trade} estimate for ${lead.estimateAmount}. What should I lead with?`;
    setChatHistory([{ role: "user", content: greeting }]);
    chatMutation.mutate({
      message: greeting,
      history: [],
      context: {
        leadName: lead.name,
        companyName,
        trade: lead.trade,
        estimateAmount: lead.estimateAmount,
        estimateDetails: lead.estimateDetails,
        context: lead.notes || lead.lastContact || "",
      },
      enableVoice,
    });
  };

  const handleDemoCall = () => {
    demoCallMutation.mutate({
      scenario: "Standard follow-up on estimate, customer hasn't responded in 2 days",
      companyName,
      customerName: "Sarah",
      trade: selectedTrade,
      estimateAmount: "$2,100",
      enableVoice,
    });
  };

  const getStatusColor = (status: Lead["status"]) => {
    switch (status) {
      case "pending": return "bg-amber-100 text-amber-800 border-amber-200";
      case "called": return "bg-blue-100 text-blue-800 border-blue-200";
      case "interested": return "bg-green-100 text-green-800 border-green-200";
      case "closed": return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "follow_up": return "bg-purple-100 text-purple-800 border-purple-200";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: Lead["status"]) => {
    switch (status) {
      case "pending": return "Ready to Call";
      case "called": return "Called";
      case "interested": return "Interested";
      case "closed": return "Won!";
      case "follow_up": return "Follow Up";
      default: return status;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 via-white to-pink-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <TopNav />
      <audio ref={audioRef} className="hidden" />

      <div className="bg-gradient-to-r from-rose-600 via-pink-600 to-rose-700 text-white py-10 px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 left-[10%] w-32 h-32 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-4 right-[15%] w-40 h-40 bg-pink-300 rounded-full blur-3xl" />
        </div>
        <div className="max-w-6xl mx-auto relative">
          <div className="flex items-center gap-2 text-rose-200 text-sm mb-3">
            <Link to="/workhub" className="hover:text-white transition-colors">WorkHub</Link>
            <ChevronRight className="w-4 h-4" />
            <span>CloseBot</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <Heart className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">Rachel</h1>
                  <p className="text-rose-200 text-sm">Your AI Sales Partner</p>
                </div>
              </div>
              <p className="text-rose-100 text-lg max-w-xl">
                A real voice that connects with your customers. She follows up on estimates, 
                handles concerns with genuine care, and helps close deals naturally.
              </p>
            </div>
            <div className="hidden md:flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEnableVoice(!enableVoice)}
                className="text-white hover:bg-white/10 gap-2"
              >
                {enableVoice ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                {enableVoice ? "Voice On" : "Voice Off"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <AutonomousAgentBadge moduleName="CloseBot" />
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-5 w-full max-w-2xl mb-6">
            <TabsTrigger value="dashboard" className="gap-1.5 text-xs">
              <BarChart3 className="w-3.5 h-3.5" />Dashboard
            </TabsTrigger>
            <TabsTrigger value="leads" className="gap-1.5 text-xs">
              <Users className="w-3.5 h-3.5" />Leads
            </TabsTrigger>
            <TabsTrigger value="conversation" className="gap-1.5 text-xs">
              <MessageSquare className="w-3.5 h-3.5" />Talk to Rachel
            </TabsTrigger>
            <TabsTrigger value="demo" className="gap-1.5 text-xs">
              <Headphones className="w-3.5 h-3.5" />Hear Rachel
            </TabsTrigger>
            <TabsTrigger value="scripts" className="gap-1.5 text-xs">
              <FileText className="w-3.5 h-3.5" />Scripts
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <div className="grid md:grid-cols-4 gap-4 mb-8">
              {[
                { icon: PhoneCall, label: "Calls Made", value: "47", color: "text-rose-500", bg: "bg-rose-50" },
                { icon: CheckCircle, label: "Deals Closed", value: "23", color: "text-green-500", bg: "bg-green-50" },
                { icon: DollarSign, label: "Revenue Closed", value: "$48,500", color: "text-emerald-500", bg: "bg-emerald-50" },
                { icon: TrendingUp, label: "Close Rate", value: "49%", color: "text-blue-500", bg: "bg-blue-50" },
              ].map((stat) => (
                <Card key={stat.label} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="pt-6 text-center">
                    <div className={`w-12 h-12 ${stat.bg} rounded-xl flex items-center justify-center mx-auto mb-3`}>
                      <stat.icon className={`w-6 h-6 ${stat.color}`} />
                    </div>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{stat.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Sparkles className="w-5 h-5 text-rose-500" />
                    What Makes Rachel Different
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { title: "She sounds real", desc: "Natural voice with genuine warmth — customers think they're talking to a person, not a machine" },
                    { title: "She cares", desc: "Empathetic responses, active listening cues, and she remembers what matters to each customer" },
                    { title: "She closes gently", desc: "No high-pressure tactics. Rachel builds trust and guides people to decisions they feel good about" },
                    { title: "She never gives up", desc: "Persistent but never annoying. She knows when to follow up and when to give space" },
                  ].map((item) => (
                    <div key={item.title} className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-rose-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                        <Heart className="w-3.5 h-3.5 text-rose-500" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">{item.title}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Target className="w-5 h-5 text-rose-500" />
                    How Rachel Works
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { step: "1", title: "You send an estimate", desc: "Just like you normally do — Rachel watches for new ones" },
                    { step: "2", title: "Rachel calls your customer", desc: "Within hours, in a natural voice that matches your brand" },
                    { step: "3", title: "She handles everything", desc: "Questions, concerns, comparisons — she turns doubts into confidence" },
                    { step: "4", title: "You get the job", desc: "Rachel schedules the work and you show up ready to go" },
                  ].map((item) => (
                    <div key={item.step} className="flex items-start gap-3">
                      <div className="w-7 h-7 bg-gradient-to-br from-rose-500 to-pink-600 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-white text-xs font-bold">{item.step}</span>
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">{item.title}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <Card className="mt-6 border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Clock className="w-5 h-5 text-rose-500" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { time: "2 hours ago", action: "Called Sarah Johnson", result: "Interested — scheduling for next week", icon: ThumbsUp, color: "text-green-500" },
                    { time: "4 hours ago", action: "Follow-up with Michael Chen", result: "Still comparing quotes, will call back Friday", icon: Clock, color: "text-amber-500" },
                    { time: "Yesterday", action: "Closed deal with Rebecca Torres", result: "Booked $3,200 roof repair for Thursday", icon: CheckCircle, color: "text-emerald-500" },
                    { time: "Yesterday", action: "Called David Brown", result: "Left friendly voicemail, will try again tomorrow", icon: Phone, color: "text-blue-500" },
                  ].map((activity, i) => (
                    <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                      <activity.icon className={`w-5 h-5 ${activity.color} shrink-0`} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-slate-900 dark:text-white">{activity.action}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{activity.result}</p>
                      </div>
                      <span className="text-xs text-slate-400 whitespace-nowrap">{activity.time}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="leads">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Customer Follow-ups</h2>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                  {leads.filter(l => l.status === "pending").length} ready to call
                </Badge>
              </div>
            </div>

            <div className="space-y-3">
              {leads.map((lead) => (
                <Card key={lead.id} className="border-0 shadow-sm hover:shadow-md transition-all">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-semibold text-slate-900 dark:text-white">{lead.name}</h3>
                          <Badge className={`text-[10px] border ${getStatusColor(lead.status)}`}>
                            {getStatusLabel(lead.status)}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {lead.trade} — {lead.estimateAmount} — Sent {lead.sentDate}
                        </p>
                        {lead.lastContact && (
                          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 italic">
                            "{lead.lastContact}"
                          </p>
                        )}
                        <p className="text-xs text-slate-500 mt-1">{lead.estimateDetails}</p>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5 text-rose-600 border-rose-200 hover:bg-rose-50"
                          onClick={() => startLeadCall(lead)}
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          Coach Me
                        </Button>
                        <Button
                          size="sm"
                          className="gap-1.5 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700"
                          onClick={() => {
                            setSelectedLead(lead);
                            demoCallMutation.mutate({
                              scenario: `Follow-up call. ${lead.lastContact || "Customer hasn't responded since receiving estimate."}`,
                              companyName,
                              customerName: lead.name.split(" ")[0],
                              trade: lead.trade,
                              estimateAmount: lead.estimateAmount,
                              enableVoice,
                            });
                            setActiveTab("demo");
                          }}
                        >
                          <Phone className="w-3.5 h-3.5" />
                          Hear Call
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="conversation">
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card className="border-0 shadow-sm h-[600px] flex flex-col">
                  <CardHeader className="border-b bg-gradient-to-r from-rose-50 to-pink-50 dark:from-slate-800 dark:to-slate-800">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-pink-600 rounded-full flex items-center justify-center">
                          <Heart className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-base">Chat with Rachel</CardTitle>
                          <p className="text-xs text-slate-500">
                            {selectedLead
                              ? `Coaching you on ${selectedLead.name}'s ${selectedLead.trade} call`
                              : "Ask about sales strategies, objection handling, or call coaching"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEnableVoice(!enableVoice)}
                          className="gap-1.5 text-xs"
                        >
                          {enableVoice ? <Volume2 className="w-4 h-4 text-rose-500" /> : <VolumeX className="w-4 h-4" />}
                          {enableVoice ? "Voice" : "Text"}
                        </Button>
                        {chatHistory.length > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => { setChatHistory([]); setSelectedLead(null); setCallContext(null); }}
                            className="gap-1.5 text-xs"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            New Chat
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                    {chatHistory.length === 0 && (
                      <div className="flex flex-col items-center justify-center h-full text-center px-8">
                        <div className="w-16 h-16 bg-gradient-to-br from-rose-100 to-pink-100 rounded-2xl flex items-center justify-center mb-4">
                          <Heart className="w-8 h-8 text-rose-500" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Hey there! I'm Rachel.</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mb-6">
                          Think of me as your sales coach and calling partner. I can help you 
                          prep for calls, handle tough objections, and practice your pitch until it feels 
                          completely natural. What are you working on?
                        </p>
                        <div className="grid grid-cols-2 gap-2 w-full max-w-md">
                          {[
                            "Help me prepare for a follow-up call",
                            "A customer said my price is too high",
                            "How do I close without being pushy?",
                            "Write me a call script for roofing",
                          ].map((suggestion) => (
                            <Button
                              key={suggestion}
                              variant="outline"
                              size="sm"
                              className="text-xs text-left h-auto py-2.5 px-3 whitespace-normal border-rose-200 hover:bg-rose-50 hover:text-rose-700"
                              onClick={() => {
                                setChatHistory([{ role: "user", content: suggestion }]);
                                chatMutation.mutate({
                                  message: suggestion,
                                  history: [],
                                  context: callContext,
                                  enableVoice,
                                });
                              }}
                            >
                              {suggestion}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                    {chatHistory.map((msg, i) => (
                      <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                          msg.role === "user"
                            ? "bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-br-md"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-md"
                        }`}>
                          {msg.role === "assistant" && (
                            <div className="flex items-center gap-1.5 mb-1.5">
                              <Heart className="w-3 h-3 text-rose-500" />
                              <span className="text-[10px] font-medium text-rose-500">Rachel</span>
                            </div>
                          )}
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                        </div>
                      </div>
                    ))}
                    {chatMutation.isPending && (
                      <div className="flex justify-start">
                        <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl rounded-bl-md px-4 py-3">
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <Heart className="w-3 h-3 text-rose-500" />
                            <span className="text-[10px] font-medium text-rose-500">Rachel</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex gap-1">
                              <div className="w-2 h-2 bg-rose-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                              <div className="w-2 h-2 bg-rose-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                              <div className="w-2 h-2 bg-rose-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                            </div>
                            <span className="text-xs text-slate-400">thinking...</span>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </CardContent>
                  <div className="p-3 border-t bg-white dark:bg-slate-900">
                    <form
                      onSubmit={(e) => { e.preventDefault(); sendChat(); }}
                      className="flex items-center gap-2"
                    >
                      <Input
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder="Ask Rachel anything about sales..."
                        className="flex-1 border-slate-200 focus:border-rose-300 focus:ring-rose-200"
                        disabled={chatMutation.isPending}
                      />
                      <Button
                        type="submit"
                        size="sm"
                        disabled={!chatInput.trim() || chatMutation.isPending}
                        className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 px-4"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </form>
                  </div>
                </Card>
              </div>

              <div className="space-y-4">
                <Card className="border-0 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-500" />
                      Quick Objection Handler
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-xs text-slate-500 mb-2">Customer said something tough? Pick it and hear how Rachel would handle it:</p>
                    <Select value={selectedObjection} onValueChange={(val) => {
                      setSelectedObjection(val);
                      setObjectionResponse("");
                    }}>
                      <SelectTrigger className="text-xs">
                        <SelectValue placeholder="Pick a common objection..." />
                      </SelectTrigger>
                      <SelectContent>
                        {COMMON_OBJECTIONS.map((obj) => (
                          <SelectItem key={obj} value={obj} className="text-xs">{obj}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedObjection && (
                      <Button
                        size="sm"
                        className="w-full gap-1.5 bg-amber-500 hover:bg-amber-600 text-xs"
                        onClick={() => objectionMutation.mutate({
                          objection: selectedObjection,
                          trade: selectedLead?.trade || selectedTrade,
                          estimateAmount: selectedLead?.estimateAmount || "$2,000",
                          enableVoice,
                        })}
                        disabled={objectionMutation.isPending}
                      >
                        {objectionMutation.isPending ? (
                          <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Rachel is thinking...</>
                        ) : (
                          <><Sparkles className="w-3.5 h-3.5" /> How would Rachel respond?</>
                        )}
                      </Button>
                    )}
                    {objectionResponse && (
                      <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-100 dark:border-amber-900">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <Heart className="w-3 h-3 text-rose-500" />
                          <span className="text-[10px] font-medium text-rose-500">Rachel says:</span>
                        </div>
                        <p className="text-xs text-slate-700 dark:text-slate-300 italic leading-relaxed">"{objectionResponse}"</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Settings className="w-4 h-4 text-slate-500" />
                      Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">Your Company Name</label>
                      <Input
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="text-sm"
                        placeholder="Your company name"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">Primary Trade</label>
                      <Select value={selectedTrade} onValueChange={setSelectedTrade}>
                        <SelectTrigger className="text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TRADES.map((t) => (
                            <SelectItem key={t} value={t}>{t}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="demo">
            <div className="max-w-2xl mx-auto">
              <Card className="border-0 shadow-lg bg-gradient-to-br from-rose-50 via-white to-pink-50 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800 overflow-hidden">
                <CardHeader className="text-center pb-2">
                  <div className="w-20 h-20 bg-gradient-to-br from-rose-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg shadow-rose-200">
                    {demoPlaying ? (
                      <Volume2 className="w-10 h-10 text-white animate-pulse" />
                    ) : (
                      <Headphones className="w-10 h-10 text-white" />
                    )}
                  </div>
                  <CardTitle className="text-2xl">Hear Rachel in Action</CardTitle>
                  <p className="text-slate-500 dark:text-slate-400">
                    Listen to how Rachel sounds on a real follow-up call. 
                    Natural, warm, professional — like your best employee.
                  </p>
                </CardHeader>
                <CardContent className="space-y-4 px-8 pb-8">
                  {demoScript && (
                    <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-rose-100 dark:border-slate-700 shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 bg-rose-100 rounded-full flex items-center justify-center">
                          <Heart className="w-3.5 h-3.5 text-rose-500" />
                        </div>
                        <span className="text-xs font-medium text-rose-600">Rachel speaking:</span>
                        {demoPlaying && <Badge className="bg-green-100 text-green-700 text-[10px] animate-pulse">LIVE</Badge>}
                      </div>
                      <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed italic">"{demoScript}"</p>
                    </div>
                  )}

                  <Button
                    className="w-full h-14 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-lg shadow-lg shadow-rose-200 dark:shadow-none"
                    onClick={handleDemoCall}
                    disabled={demoPlaying || demoCallMutation.isPending}
                    data-testid="button-demo-call"
                  >
                    {demoCallMutation.isPending ? (
                      <><RefreshCw className="w-5 h-5 mr-2 animate-spin" /> Rachel is getting ready...</>
                    ) : demoPlaying ? (
                      <><Volume2 className="w-5 h-5 mr-2 animate-pulse" /> Rachel is speaking...</>
                    ) : (
                      <><Play className="w-5 h-5 mr-2" /> Hear a Demo Call</>
                    )}
                  </Button>

                  <div className="grid grid-cols-3 gap-3 pt-2">
                    {[
                      { label: "Natural Voice", desc: "Sounds genuinely human", icon: Smile },
                      { label: "Smart Responses", desc: "Handles any question", icon: Sparkles },
                      { label: "Always On", desc: "Calls 24/7 for you", icon: Clock },
                    ].map((feature) => (
                      <div key={feature.label} className="text-center p-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                        <feature.icon className="w-5 h-5 text-rose-500 mx-auto mb-1.5" />
                        <p className="text-xs font-medium text-slate-900 dark:text-white">{feature.label}</p>
                        <p className="text-[10px] text-slate-500">{feature.desc}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="scripts">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <FileText className="w-5 h-5 text-rose-500" />
                    Generate a Call Script
                  </CardTitle>
                  <p className="text-sm text-slate-500">
                    Rachel will write you a natural, human-sounding call script 
                    tailored to your customer and trade.
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-slate-600 mb-1 block">Customer Name</label>
                      <Input placeholder="e.g. Sarah" className="text-sm" id="script-customer" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-600 mb-1 block">Estimate Amount</label>
                      <Input placeholder="e.g. $2,100" className="text-sm" id="script-amount" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">Trade / Service</label>
                    <Select value={selectedTrade} onValueChange={setSelectedTrade}>
                      <SelectTrigger className="text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TRADES.map((t) => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">Estimate Details</label>
                    <Textarea
                      placeholder="Brief description of what the estimate covers..."
                      className="text-sm min-h-[80px]"
                      id="script-details"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">Tone</label>
                    <div className="flex gap-2">
                      {([
                        { value: "warm", label: "Warm & Friendly", icon: Heart },
                        { value: "professional", label: "Professional", icon: Star },
                        { value: "urgent", label: "Time-Sensitive", icon: Clock },
                      ] as const).map((tone) => (
                        <Button
                          key={tone.value}
                          variant={scriptTone === tone.value ? "default" : "outline"}
                          size="sm"
                          className={`flex-1 gap-1.5 text-xs ${scriptTone === tone.value ? "bg-rose-500 hover:bg-rose-600" : ""}`}
                          onClick={() => setScriptTone(tone.value)}
                        >
                          <tone.icon className="w-3.5 h-3.5" />
                          {tone.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <Button
                    className="w-full gap-2 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700"
                    onClick={() => {
                      const customerEl = document.getElementById("script-customer") as HTMLInputElement;
                      const amountEl = document.getElementById("script-amount") as HTMLInputElement;
                      const detailsEl = document.getElementById("script-details") as HTMLTextAreaElement;
                      scriptMutation.mutate({
                        companyName,
                        trade: selectedTrade,
                        customerName: customerEl?.value || "Customer",
                        estimateAmount: amountEl?.value || "$2,000",
                        estimateDetails: detailsEl?.value || "Standard estimate",
                        tone: scriptTone,
                      });
                    }}
                    disabled={scriptMutation.isPending}
                  >
                    {scriptMutation.isPending ? (
                      <><RefreshCw className="w-4 h-4 animate-spin" /> Rachel is writing your script...</>
                    ) : (
                      <><Sparkles className="w-4 h-4" /> Generate Call Script</>
                    )}
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Sparkles className="w-5 h-5 text-rose-500" />
                    Your Script
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {generatedScript ? (
                    <div className="space-y-3">
                      <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border max-h-[450px] overflow-y-auto">
                        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{generatedScript}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 gap-1.5 text-xs"
                          onClick={() => {
                            navigator.clipboard.writeText(generatedScript);
                            toast({ title: "Copied!", description: "Script copied to clipboard" });
                          }}
                        >
                          <FileText className="w-3.5 h-3.5" />
                          Copy Script
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-[400px] text-center px-8">
                      <div className="w-14 h-14 bg-rose-50 rounded-xl flex items-center justify-center mb-3">
                        <FileText className="w-7 h-7 text-rose-300" />
                      </div>
                      <p className="text-sm text-slate-400">
                        Your personalized call script will appear here. 
                        Fill in the details and Rachel will craft something 
                        that sounds completely natural.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <ModuleAIAssistant
        moduleName="Rachel - AI Sales Partner"
        moduleContext={`Rachel is an AI sales partner (NOT a robot) who helps contractors close deals with a warm, genuine, human approach. She makes natural-sounding follow-up calls to customers, handles objections with empathy, and coaches contractors on effective sales techniques.

KEY PHILOSOPHY: Rachel sounds like a real person — sweet, professional, caring. She never sounds scripted or robotic. She uses natural language, contractions, and genuine warmth.

SALES APPROACH:
- Lead with empathy, never pressure
- Build trust through genuine care
- Use social proof naturally ("A lot of folks in your area...")
- Create gentle urgency without being pushy
- Handle objections by acknowledging first, then reframing value
- Always give an easy out (paradoxically increases close rates)

FEATURES:
- AI-powered follow-up calls with natural ElevenLabs voice
- Conversation coaching for sales calls
- Objection handling training
- Custom call script generation
- Lead management and tracking

Help users understand how to use Rachel effectively and teach them natural sales techniques.`}
      />
    </div>
  );
}
