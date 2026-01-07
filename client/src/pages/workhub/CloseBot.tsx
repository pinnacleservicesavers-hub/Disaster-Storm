import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Bot, ChevronRight, Volume2, VolumeX, Phone, MessageSquare,
  Play, Pause, CheckCircle, DollarSign, TrendingUp, Zap, Users
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import TopNav from '@/components/TopNav';
import ModuleAIAssistant from '@/components/ModuleAIAssistant';

export default function CloseBot() {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [isCallingDemo, setIsCallingDemo] = useState(false);

  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      if (availableVoices.length > 0) {
        setVoices(availableVoices);
      }
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => { window.speechSynthesis.cancel(); };
  }, []);

  useEffect(() => {
    if (voices.length > 0) {
      setTimeout(() => {
        speakGuidance("Welcome to CloseBot! I'm Evelyn, your AI sales agent. I can call customers for you using a natural, human-sounding voice. I explain estimates, answer objections, and help close deals - all automatically. Let me show you how I work.");
      }, 500);
    }
  }, [voices]);

  const getBestFemaleVoice = (voiceList: SpeechSynthesisVoice[]) => {
    const preferredVoices = ['Samantha', 'Zira', 'Jenny', 'Google US English Female', 'Microsoft Zira'];
    for (const preferred of preferredVoices) {
      const found = voiceList.find(v => v.name.includes(preferred));
      if (found) return found;
    }
    return voiceList.find(v => v.lang.startsWith('en')) || voiceList[0];
  };

  const speakGuidance = (text: string) => {
    if (voices.length === 0) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = getBestFemaleVoice(voices);
    utterance.pitch = 1.0;
    utterance.rate = 0.88;
    utterance.onstart = () => setIsVoiceActive(true);
    utterance.onend = () => setIsVoiceActive(false);
    window.speechSynthesis.speak(utterance);
  };

  const handleDemoCall = () => {
    setIsCallingDemo(true);
    speakGuidance("Hi, this is Evelyn calling from Oak City Tree Service. I'm following up on your estimate for tree removal. Our team reviewed the photos you submitted, and we've put together a competitive quote of $2,100. This includes removing the large oak, grinding the stump, and complete cleanup. Do you have any questions about the work?");
    setTimeout(() => setIsCallingDemo(false), 15000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 to-white dark:from-slate-950 dark:to-slate-900">
      <TopNav />

      <div className="bg-gradient-to-r from-rose-500 to-pink-600 text-white py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-2 text-rose-200 text-sm mb-2">
            <Link to="/workhub" className="hover:text-white">WorkHub</Link>
            <ChevronRight className="w-4 h-4" />
            <span>CloseBot</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">CloseBot</h1>
              <p className="text-rose-100 text-lg">AI Sales Agent - Close deals while you work</p>
            </div>
            <Button
              variant="ghost"
              size="lg"
              onClick={() => isVoiceActive ? window.speechSynthesis.cancel() : speakGuidance("I'm Evelyn, your AI sales agent. I make human-sounding calls to follow up with customers, explain estimates, handle objections, and close deals automatically.")}
              className="text-white hover:bg-white/10"
            >
              {isVoiceActive ? <Volume2 className="w-6 h-6 animate-pulse" /> : <VolumeX className="w-6 h-6" />}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6 text-center">
              <Phone className="w-10 h-10 text-rose-500 mx-auto mb-2" />
              <p className="text-2xl font-bold">47</p>
              <p className="text-slate-600">Calls Made</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-2" />
              <p className="text-2xl font-bold">23</p>
              <p className="text-slate-600">Deals Closed</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <DollarSign className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <p className="text-2xl font-bold">$48,500</p>
              <p className="text-slate-600">Revenue Closed</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <TrendingUp className="w-10 h-10 text-blue-500 mx-auto mb-2" />
              <p className="text-2xl font-bold">49%</p>
              <p className="text-slate-600">Close Rate</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <Card className="border-2 border-rose-200 bg-gradient-to-br from-rose-50 to-pink-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="w-6 h-6 text-rose-600" />
                AI Voice Demo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 mb-6">
                Hear how CloseBot sounds when calling your customers. Natural, professional, and effective.
              </p>
              <Button 
                className="w-full h-14 bg-rose-600 hover:bg-rose-700 text-lg"
                onClick={handleDemoCall}
                disabled={isCallingDemo}
                data-testid="button-demo-call"
              >
                {isCallingDemo ? (
                  <>
                    <Volume2 className="w-6 h-6 mr-2 animate-pulse" />
                    Listening to Demo...
                  </>
                ) : (
                  <>
                    <Play className="w-6 h-6 mr-2" />
                    Hear AI Sales Call Demo
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-rose-600" />
                What CloseBot Does
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { title: 'Follow-up Calls', desc: 'Automatically call customers who received estimates' },
                  { title: 'Objection Handling', desc: 'Answer common questions and concerns' },
                  { title: 'Estimate Explanation', desc: 'Walk through pricing and scope of work' },
                  { title: 'Scheduling', desc: 'Book the job on your calendar when they say yes' }
                ].map((item) => (
                  <div key={item.title} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">{item.title}</p>
                      <p className="text-sm text-slate-500">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-rose-600" />
              Pending Follow-ups
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { name: 'John Martinez', estimate: '$2,100', sent: '2 days ago' },
                { name: 'Sarah Johnson', estimate: '$8,500', sent: '3 days ago' },
                { name: 'Michael Chen', estimate: '$5,200', sent: '4 days ago' }
              ].map((lead) => (
                <div key={lead.name} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-medium">{lead.name}</p>
                    <p className="text-sm text-slate-500">Estimate: {lead.estimate} • Sent {lead.sent}</p>
                  </div>
                  <Button size="sm" className="bg-rose-600 hover:bg-rose-700">
                    <Phone className="w-4 h-4 mr-1" />
                    AI Call Now
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <ModuleAIAssistant 
        moduleName="CloseBot"
        moduleContext={`CloseBot is an AI sales agent that makes human-sounding phone calls to customers. It follows up on estimates, answers objections, explains pricing, and helps close deals automatically.

SALES PSYCHOLOGY TECHNIQUES TO USE:

**Cialdini's 6 Principles:**
1. RECIPROCITY - Give value first before asking for the sale. Share free tips or insights.
2. SOCIAL PROOF - Mention neighbors, recent customers, reviews. "We just finished similar work for someone on your street."
3. SCARCITY - Create urgency. "We only have two slots left this month."
4. AUTHORITY - Establish expertise. "With 15 years experience, we know exactly what works."
5. LIKING - Build rapport. Find common ground. Use customer's name.
6. COMMITMENT - Get small yeses. "You mentioned quality matters, right?"

**Closing Techniques:**
- ASSUMPTIVE CLOSE: "I'll put you down for Tuesday. Does 8 AM or 10 AM work better?"
- CHOICE CLOSE: Give options that all lead to yes. "Tuesday or Thursday?"
- SUMMARY CLOSE: Recap value before asking. "So you get X, Y, Z, plus our warranty..."
- FEEL-FELT-FOUND: "I understand how you feel. Others felt the same. What they found was..."

**Objection Handling (4-Step Framework):**
1. ACKNOWLEDGE: "I completely understand..."
2. PROBE: "Help me understand - is it the total cost or a specific part?"
3. ADDRESS: Use psychology techniques appropriately
4. CLOSE: Always end with a clear next step

**Additional Techniques:**
- LOSS AVERSION: "Every month you wait, the damage could spread..."
- ANCHORING: Start with higher reference price. "Some charge $15k, we're at $9k..."
- FOMO: "This pricing is only available until Friday..."

Help users understand AI calling AND teach them these proven sales psychology techniques.`}
      />
    </div>
  );
}
