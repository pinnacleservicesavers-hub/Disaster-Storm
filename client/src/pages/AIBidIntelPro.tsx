import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrueCostProfitSheet } from "@/components/TrueCostProfitSheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Swords,
  ArrowLeft,
  Mic,
  MicOff,
  Send,
  Volume2,
  VolumeX,
  Lightbulb,
  FileText,
  Users,
  BarChart3,
  HelpCircle,
  MessageSquare,
  Zap,
  Target,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Mail,
  Phone,
  RefreshCw,
  Loader2,
  Play,
  Pause,
  BookOpen
} from "lucide-react";

interface ChatMessage {
  role: "user" | "assistant";
  message: string;
  audioUrl?: string;
  tips?: InsiderTip[];
}

interface InsiderTip {
  category: string;
  title: string;
  tip: string;
  example?: string;
}

interface DashboardStats {
  totalSubmissions: number;
  totalSubmitted: number;
  totalWon: number;
  totalLost: number;
  pending: number;
  winRate: string;
  totalBidAmount: number;
  wonAmount: number;
  activeOpportunities: number;
  recentSubmissions: any[];
}

export default function AIBidIntelPro() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("agent");
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [enableVoice, setEnableVoice] = useState(true);
  const [isIntroPlaying, setIsIntroPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/bidintel/dashboard/stats"],
  });

  const { data: tips, isLoading: tipsLoading } = useQuery<InsiderTip[]>({
    queryKey: ["/api/bidintel/tips"],
  });

  const { data: opportunities } = useQuery<any[]>({
    queryKey: ["/api/bidintel/opportunities"],
  });

  const { data: submissions } = useQuery<any[]>({
    queryKey: ["/api/bidintel/submissions"],
  });

  const chatMutation = useMutation({
    mutationFn: async (data: { message: string; generateAudio: boolean }) => {
      const res = await apiRequest("/api/bidintel/chat", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: (data) => {
      const newMessage: ChatMessage = {
        role: "assistant",
        message: data.message,
        audioUrl: data.audioUrl,
        tips: data.tips,
      };
      setChatHistory((prev) => [...prev, newMessage]);
      
      if (enableVoice && data.audioUrl) {
        playAudio(data.audioUrl);
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to get AI response. Please try again.",
        variant: "destructive",
      });
    },
  });

  const voiceIntroMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("/api/bidintel/voice-guide/intro", {
        method: "GET",
      });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.audioUrl) {
        setIsIntroPlaying(true);
        playAudio(data.audioUrl);
      }
      setChatHistory([{
        role: "assistant",
        message: data.script,
        audioUrl: data.audioUrl,
      }]);
    },
  });

  const playAudio = (audioUrl: string) => {
    if (audioRef.current) {
      audioRef.current.src = audioUrl;
      audioRef.current.play().catch(console.error);
      setIsSpeaking(true);
    }
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsSpeaking(false);
      setIsIntroPlaying(false);
    }
  };

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    
    const userMessage: ChatMessage = {
      role: "user",
      message: chatInput,
    };
    setChatHistory((prev) => [...prev, userMessage]);
    
    chatMutation.mutate({
      message: chatInput,
      generateAudio: enableVoice,
    });
    
    setChatInput("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      pricing: "bg-green-500/20 text-green-400 border-green-500/30",
      strategy: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      compliance: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      pre_bid: "bg-purple-500/20 text-purple-400 border-purple-500/30",
      submission: "bg-orange-500/20 text-orange-400 border-orange-500/30",
      certifications: "bg-pink-500/20 text-pink-400 border-pink-500/30",
      references: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
      technical: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
      negotiation: "bg-red-500/20 text-red-400 border-red-500/30",
      protest: "bg-gray-500/20 text-gray-400 border-gray-500/30",
    };
    return colors[category] || "bg-gray-500/20 text-gray-400 border-gray-500/30";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <audio 
        ref={audioRef} 
        onEnded={() => {
          setIsSpeaking(false);
          setIsIntroPlaying(false);
        }}
      />
      
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate("/dashboard")}
              className="text-white hover:bg-white/10"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Hub
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl">
                <Swords className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">AI BidIntel Pro™</h1>
                <p className="text-sm text-gray-400">Advanced Procurement Intelligence for Serious Contractors</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Label htmlFor="voice-toggle" className="text-sm text-gray-400">Voice</Label>
              <Switch
                id="voice-toggle"
                checked={enableVoice}
                onCheckedChange={setEnableVoice}
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => voiceIntroMutation.mutate()}
              disabled={voiceIntroMutation.isPending || isIntroPlaying}
              className="border-amber-500/50 text-amber-400 hover:bg-amber-500/20"
            >
              {isIntroPlaying ? (
                <>
                  <Pause className="w-4 h-4 mr-2" />
                  Playing...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Meet Rachel
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Active Opportunities</p>
                  <p className="text-2xl font-bold text-white">{stats?.activeOpportunities || 0}</p>
                </div>
                <Target className="w-8 h-8 text-amber-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Bids Submitted</p>
                  <p className="text-2xl font-bold text-white">{stats?.totalSubmitted || 0}</p>
                </div>
                <FileText className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Win Rate</p>
                  <p className="text-2xl font-bold text-green-400">{stats?.winRate || "0%"}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Won Revenue</p>
                  <p className="text-2xl font-bold text-emerald-400">{formatCurrency(stats?.wonAmount || 0)}</p>
                </div>
                <BarChart3 className="w-8 h-8 text-emerald-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-slate-800/50 border border-slate-700">
            <TabsTrigger value="agent" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400">
              <MessageSquare className="w-4 h-4 mr-2" />
              AI Agent
            </TabsTrigger>
            <TabsTrigger value="tips" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400">
              <Lightbulb className="w-4 h-4 mr-2" />
              Insider Tips
            </TabsTrigger>
            <TabsTrigger value="opportunities" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400">
              <Target className="w-4 h-4 mr-2" />
              Opportunities
            </TabsTrigger>
            <TabsTrigger value="submissions" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400">
              <FileText className="w-4 h-4 mr-2" />
              My Bids
            </TabsTrigger>
            <TabsTrigger value="contacts" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400">
              <Users className="w-4 h-4 mr-2" />
              Contacts
            </TabsTrigger>
            <TabsTrigger value="truecost" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400">
              <BarChart3 className="w-4 h-4 mr-2" />
              TrueCost™
            </TabsTrigger>
          </TabsList>

          <TabsContent value="agent" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2 bg-slate-800/50 border-slate-700">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                        <span className="text-lg font-bold text-white">R</span>
                      </div>
                      <div>
                        <CardTitle className="text-white">Rachel - AI Bid Intelligence</CardTitle>
                        <CardDescription>Ask me anything about winning bids</CardDescription>
                      </div>
                    </div>
                    {isSpeaking && (
                      <Button variant="ghost" size="sm" onClick={stopAudio} className="text-amber-400">
                        <VolumeX className="w-4 h-4 mr-1" />
                        Stop
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px] pr-4 mb-4">
                    {chatHistory.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center text-gray-400">
                        <Zap className="w-12 h-12 mb-4 text-amber-500/50" />
                        <p className="text-lg font-medium">Ready to help you win more bids</p>
                        <p className="text-sm mt-2">Ask me about pricing, strategy, compliance, or anything procurement-related</p>
                        <div className="flex flex-wrap gap-2 mt-4 justify-center">
                          {["How do I price competitively?", "What are common bid mistakes?", "How to write a winning proposal?"].map((q) => (
                            <Button
                              key={q}
                              variant="outline"
                              size="sm"
                              onClick={() => setChatInput(q)}
                              className="text-xs border-slate-600 text-gray-300 hover:bg-slate-700"
                            >
                              {q}
                            </Button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {chatHistory.map((msg, idx) => (
                          <div
                            key={idx}
                            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`max-w-[80%] rounded-xl p-4 ${
                                msg.role === "user"
                                  ? "bg-amber-500/20 text-white"
                                  : "bg-slate-700/50 text-gray-200"
                              }`}
                            >
                              <p className="whitespace-pre-wrap">{msg.message}</p>
                              {msg.tips && msg.tips.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-slate-600">
                                  <p className="text-xs text-amber-400 font-medium mb-2">Related Tips:</p>
                                  {msg.tips.map((tip, i) => (
                                    <div key={i} className="text-xs bg-slate-800/50 rounded p-2 mt-1">
                                      <span className="font-medium text-amber-400">{tip.title}:</span>{" "}
                                      <span className="text-gray-300">{tip.tip.slice(0, 100)}...</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                              {msg.audioUrl && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => playAudio(msg.audioUrl!)}
                                  className="mt-2 text-amber-400 hover:text-amber-300"
                                >
                                  <Volume2 className="w-4 h-4 mr-1" />
                                  Play Audio
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                        <div ref={chatEndRef} />
                      </div>
                    )}
                  </ScrollArea>
                  
                  <div className="flex gap-2">
                    <Textarea
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Ask Rachel about bidding strategies, pricing, compliance..."
                      className="min-h-[60px] bg-slate-900/50 border-slate-600 text-white placeholder:text-gray-500"
                    />
                    <div className="flex flex-col gap-2">
                      <Button
                        onClick={handleSendMessage}
                        disabled={!chatInput.trim() || chatMutation.isPending}
                        className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                      >
                        {chatMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-amber-400" />
                    Quick Reference
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-amber-400">Popular Questions</h4>
                    {[
                      "How do I find the government estimate?",
                      "What makes a bid non-responsive?",
                      "How to handle subcontracting requirements?",
                      "When should I protest a decision?",
                      "How to structure pricing for T&M contracts?",
                    ].map((q, i) => (
                      <Button
                        key={i}
                        variant="ghost"
                        className="w-full justify-start text-left text-sm text-gray-300 hover:text-white hover:bg-slate-700/50 h-auto py-2"
                        onClick={() => setChatInput(q)}
                      >
                        <HelpCircle className="w-3 h-3 mr-2 text-amber-400 flex-shrink-0" />
                        <span className="truncate">{q}</span>
                      </Button>
                    ))}
                  </div>
                  
                  <Separator className="bg-slate-700" />
                  
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-amber-400">Tip Categories</h4>
                    <div className="flex flex-wrap gap-1">
                      {["pricing", "strategy", "compliance", "pre_bid", "submission"].map((cat) => (
                        <Badge key={cat} className={getCategoryColor(cat)}>
                          {cat.replace("_", " ")}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="tips" className="space-y-4">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-amber-400" />
                  Insider Bidding Tips
                </CardTitle>
                <CardDescription>Strategies most contractors don't know</CardDescription>
              </CardHeader>
              <CardContent>
                {tipsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {tips?.map((tip, idx) => (
                      <Card key={idx} className="bg-slate-900/50 border-slate-700">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-medium text-white">{tip.title}</h4>
                            <Badge className={getCategoryColor(tip.category)}>
                              {tip.category.replace("_", " ")}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-300 mb-3">{tip.tip}</p>
                          {tip.example && (
                            <div className="text-xs bg-amber-500/10 border border-amber-500/20 rounded p-2 text-amber-200">
                              <span className="font-medium">Example:</span> {tip.example}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="opportunities" className="space-y-4">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Target className="w-5 h-5 text-amber-400" />
                      Bid Opportunities
                    </CardTitle>
                    <CardDescription>Active procurement opportunities matching your profile</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" className="border-amber-500/50 text-amber-400">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {!opportunities || opportunities.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <Target className="w-12 h-12 mx-auto mb-4 text-slate-600" />
                    <p>No active opportunities yet</p>
                    <p className="text-sm mt-2">Configure your procurement profile to start receiving matched opportunities</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {opportunities.map((opp: any) => (
                      <Card key={opp.id} className="bg-slate-900/50 border-slate-700">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium text-white">{opp.title}</h4>
                              <p className="text-sm text-gray-400">{opp.agency}</p>
                            </div>
                            <Badge variant={opp.status === "qualified" ? "default" : "secondary"}>
                              {opp.status}
                            </Badge>
                          </div>
                          {opp.estimatedValue && (
                            <p className="text-lg font-bold text-green-400 mt-2">
                              {formatCurrency(Number(opp.estimatedValue))}
                            </p>
                          )}
                          {opp.dueDate && (
                            <div className="flex items-center gap-2 mt-2 text-sm text-gray-400">
                              <Clock className="w-4 h-4" />
                              Due: {new Date(opp.dueDate).toLocaleDateString()}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="submissions" className="space-y-4">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-amber-400" />
                  My Bid Submissions
                </CardTitle>
                <CardDescription>Track your submitted bids and their status</CardDescription>
              </CardHeader>
              <CardContent>
                {!submissions || submissions.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <FileText className="w-12 h-12 mx-auto mb-4 text-slate-600" />
                    <p>No bids submitted yet</p>
                    <p className="text-sm mt-2">Start by reviewing opportunities and creating your first bid</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {submissions.map((sub: any) => (
                      <Card key={sub.id} className="bg-slate-900/50 border-slate-700">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-sm text-gray-400">Bid #{sub.confirmationNumber || sub.id}</p>
                              <p className="font-medium text-white">{sub.bidDescription || "Bid Submission"}</p>
                            </div>
                            <Badge className={
                              sub.status === "won" ? "bg-green-500/20 text-green-400" :
                              sub.status === "lost" ? "bg-red-500/20 text-red-400" :
                              sub.status === "submitted" ? "bg-blue-500/20 text-blue-400" :
                              "bg-gray-500/20 text-gray-400"
                            }>
                              {sub.status === "won" && <CheckCircle2 className="w-3 h-3 mr-1" />}
                              {sub.status === "lost" && <AlertTriangle className="w-3 h-3 mr-1" />}
                              {sub.status}
                            </Badge>
                          </div>
                          {sub.bidAmount && (
                            <p className="text-lg font-bold text-amber-400 mt-2">
                              {formatCurrency(Number(sub.bidAmount))}
                            </p>
                          )}
                          {sub.submittedAt && (
                            <p className="text-sm text-gray-400 mt-1">
                              Submitted: {new Date(sub.submittedAt).toLocaleDateString()}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contacts" className="space-y-4">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-amber-400" />
                  Agency Contacts
                </CardTitle>
                <CardDescription>Manage your procurement officer contacts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-400">
                  <Building2 className="w-12 h-12 mx-auto mb-4 text-slate-600" />
                  <p>No contacts saved yet</p>
                  <p className="text-sm mt-2">Contacts will be saved automatically as you engage with opportunities</p>
                  <Button variant="outline" className="mt-4 border-amber-500/50 text-amber-400">
                    <Users className="w-4 h-4 mr-2" />
                    Add Contact
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="truecost" className="space-y-4">
            <TrueCostProfitSheet />
          </TabsContent>
        </Tabs>

        <Card className="mt-6 bg-slate-800/30 border-slate-700/50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-gray-400">
                <p className="font-medium text-gray-300 mb-1">Procurement Risk Disclosure</p>
                <p>
                  AI BidIntel Pro provides automated assistance for convenience only. Contract awards are determined by third-party agencies 
                  and are never guaranteed. You remain solely responsible for reviewing and approving all bid submissions. 
                  The platform is a Software-as-a-Service provider and does not act as a procurement agent.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
