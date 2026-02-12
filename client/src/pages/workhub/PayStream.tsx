import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CreditCard, ChevronRight, Volume2, VolumeX, DollarSign,
  Send, CheckCircle, Clock, ArrowUpRight, Download, Wallet
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import TopNav from '@/components/TopNav';
import ModuleAIAssistant from '@/components/ModuleAIAssistant';

export default function PayStream() {
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const hasPlayedWelcome = useRef(false);
  const voiceEnabledRef = useRef(true);

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
  };

  const voiceMutation = useMutation({
    mutationFn: async (message: string) => {
      const res = await apiRequest("POST", "/api/closebot/chat", {
        message,
        history: [],
        context: { leadName: "contractor", companyName: "your company", trade: "payments" },
        enableVoice: true,
      });
      return res.json();
    },
    onSuccess: (data) => {
      if (!voiceEnabledRef.current) return;
      if (data.audioUrl && audioRef.current) {
        setIsPlaying(true);
        audioRef.current.src = data.audioUrl;
        audioRef.current.onended = () => setIsPlaying(false);
        audioRef.current.play().catch(() => setIsPlaying(false));
      }
    },
  });

  useEffect(() => {
    if (!hasPlayedWelcome.current) {
      hasPlayedWelcome.current = true;
      voiceMutation.mutate("Give a brief, warm 1-sentence welcome to PayStream. You're Rachel, their payment command center assistant. Mention they've earned $24,850 this month with $5,200 pending. Keep it super short and natural.");
    }
  }, []);

  const toggleVoice = () => {
    const newEnabled = !isVoiceEnabled;
    setIsVoiceEnabled(newEnabled);
    voiceEnabledRef.current = newEnabled;
    if (!newEnabled) {
      stopAudio();
    } else {
      voiceMutation.mutate("Say a quick, natural 1-sentence overview of PayStream — handling invoicing, payment tracking, and getting paid faster with one-click customer checkout. Keep it warm and conversational.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 to-white dark:from-slate-950 dark:to-slate-900">
      <TopNav />
      <audio ref={audioRef} className="hidden" />

      <div className="bg-gradient-to-r from-teal-500 to-cyan-600 text-white py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-2 text-teal-200 text-sm mb-2">
            <Link to="/workhub" className="hover:text-white">WorkHub</Link>
            <ChevronRight className="w-4 h-4" />
            <span>PayStream</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">PayStream</h1>
              <p className="text-teal-100 text-lg">Seamless Payments - Get paid faster</p>
            </div>
            <Button
              variant="ghost"
              size="lg"
              onClick={toggleVoice}
              className="text-white hover:bg-white/10"
            >
              {isVoiceEnabled ? <Volume2 className={`w-6 h-6 ${isPlaying ? 'animate-pulse' : ''}`} /> : <VolumeX className="w-6 h-6" />}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <CardContent className="pt-6">
              <DollarSign className="w-12 h-12 text-green-600 mb-2" />
              <p className="text-3xl font-bold text-green-700">$24,850</p>
              <p className="text-green-600">Total Earned (This Month)</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200">
            <CardContent className="pt-6">
              <Clock className="w-12 h-12 text-amber-600 mb-2" />
              <p className="text-3xl font-bold text-amber-700">$5,200</p>
              <p className="text-amber-600">Pending Payments</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
            <CardContent className="pt-6">
              <Wallet className="w-12 h-12 text-blue-600 mb-2" />
              <p className="text-3xl font-bold text-blue-700">$19,650</p>
              <p className="text-blue-600">Available to Withdraw</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="w-5 h-5 text-teal-600" />
                Recent Invoices
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { customer: 'Robert Williams', amount: 2100, status: 'paid', date: 'Dec 15' },
                  { customer: 'Amanda Foster', amount: 5500, status: 'pending', date: 'Dec 12' },
                  { customer: 'David Park', amount: 450, status: 'paid', date: 'Dec 10' }
                ].map((inv, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{inv.customer}</p>
                      <p className="text-sm text-slate-500">{inv.date}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="font-bold">${inv.amount.toLocaleString()}</p>
                      <Badge className={inv.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}>
                        {inv.status === 'paid' ? <CheckCircle className="w-3 h-3 mr-1" /> : <Clock className="w-3 h-3 mr-1" />}
                        {inv.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
              <Button className="w-full mt-4" variant="outline" data-testid="button-view-all">
                View All Invoices
                <ArrowUpRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="bg-gradient-to-br from-teal-50 to-cyan-50 border-teal-200">
              <CardContent className="pt-6">
                <CreditCard className="w-12 h-12 text-teal-600 mb-4" />
                <h3 className="text-xl font-bold mb-2">Send New Invoice</h3>
                <p className="text-slate-600 mb-4">Create and send professional invoices with one-click payment links.</p>
                <Button className="w-full bg-teal-600 hover:bg-teal-700" data-testid="button-new-invoice">
                  <Send className="w-4 h-4 mr-2" />
                  Create Invoice
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <Download className="w-12 h-12 text-blue-600 mb-4" />
                <h3 className="text-xl font-bold mb-2">Withdraw Funds</h3>
                <p className="text-slate-600 mb-4">Transfer your available balance to your bank account.</p>
                <Button className="w-full" variant="outline" data-testid="button-withdraw">
                  Withdraw $19,650
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <ModuleAIAssistant 
        moduleName="PayStream"
        moduleContext="PayStream is the payment command center for contractors. It handles invoicing, payment tracking, and withdrawals. Help users send invoices, understand their payment status, and manage their earnings."
      />
    </div>
  );
}
