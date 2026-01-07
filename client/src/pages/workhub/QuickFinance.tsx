import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Wallet, ChevronRight, Volume2, VolumeX, CreditCard, DollarSign,
  CheckCircle, Calculator, Percent, Clock, ArrowRight, Shield
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import TopNav from '@/components/TopNav';
import ModuleAIAssistant from '@/components/ModuleAIAssistant';

export default function QuickFinance() {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [amount, setAmount] = useState('2500');

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
        speakGuidance("Welcome to QuickFinance! I'm Evelyn. This module helps you close more deals by offering customers flexible payment options. You can offer Pay-in-4, monthly financing, and connect with third-party lenders - all at the estimate stage.");
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

  const numAmount = parseFloat(amount) || 0;
  const payIn4 = (numAmount / 4).toFixed(2);
  const monthly6 = (numAmount / 6).toFixed(2);
  const monthly12 = (numAmount / 12).toFixed(2);

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white dark:from-slate-950 dark:to-slate-900">
      <TopNav />

      <div className="bg-gradient-to-r from-purple-600 to-violet-600 text-white py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-2 text-purple-200 text-sm mb-2">
            <Link to="/workhub" className="hover:text-white">WorkHub</Link>
            <ChevronRight className="w-4 h-4" />
            <span>QuickFinance</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">QuickFinance</h1>
              <p className="text-purple-100 text-lg">Instant Financing - Close more deals with flexible payments</p>
            </div>
            <Button
              variant="ghost"
              size="lg"
              onClick={() => isVoiceActive ? window.speechSynthesis.cancel() : speakGuidance("I'm Evelyn. QuickFinance lets you offer payment plans right at the estimate stage. Pay-in-4, monthly financing, and partner lenders help you close more deals.")}
              className="text-white hover:bg-white/10"
            >
              {isVoiceActive ? <Volume2 className="w-6 h-6 animate-pulse" /> : <VolumeX className="w-6 h-6" />}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-purple-600" />
                Payment Calculator
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Job Amount</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="pl-10 text-2xl font-bold h-14"
                    data-testid="input-amount"
                  />
                </div>
              </div>
              <p className="text-sm text-slate-500">
                See payment options your customers can choose from
              </p>
            </CardContent>
          </Card>

          <div className="lg:col-span-2 grid md:grid-cols-3 gap-4">
            <Card className="border-2 border-purple-200 bg-purple-50">
              <CardContent className="pt-6">
                <Badge className="bg-purple-600 mb-3">Most Popular</Badge>
                <h3 className="text-xl font-bold mb-1">Pay-in-4</h3>
                <p className="text-3xl font-bold text-purple-700">${payIn4}</p>
                <p className="text-slate-600 mb-4">per payment</p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" />No interest</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" />4 equal payments</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" />Bi-weekly schedule</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <Badge variant="secondary" className="mb-3">Low Monthly</Badge>
                <h3 className="text-xl font-bold mb-1">6 Months</h3>
                <p className="text-3xl font-bold">${monthly6}</p>
                <p className="text-slate-600 mb-4">per month</p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" />0% APR available</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" />6 equal payments</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" />Monthly billing</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <Badge variant="secondary" className="mb-3">Extended</Badge>
                <h3 className="text-xl font-bold mb-1">12 Months</h3>
                <p className="text-3xl font-bold">${monthly12}</p>
                <p className="text-slate-600 mb-4">per month</p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" />Low monthly</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" />12 equal payments</li>
                  <li className="flex items-center gap-2"><Clock className="w-4 h-4 text-blue-500" />Interest may apply</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        <Card className="mt-8 bg-gradient-to-r from-purple-50 to-violet-50 border-purple-200">
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-purple-600 flex items-center justify-center">
                  <Percent className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Why Offer Financing?</h3>
                  <p className="text-slate-600">Contractors who offer financing close 40% more deals</p>
                </div>
              </div>
              <Button className="bg-purple-600 hover:bg-purple-700" data-testid="button-enable-financing">
                Enable Financing
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-3 gap-6 mt-8">
          <Card>
            <CardContent className="pt-6 text-center">
              <Shield className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">You Get Paid Upfront</h3>
              <p className="text-sm text-slate-600">Financing partner pays you immediately. No waiting for customer payments.</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Clock className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Instant Approval</h3>
              <p className="text-sm text-slate-600">Customers get approved in seconds. No long applications.</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <DollarSign className="w-12 h-12 text-purple-600 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Higher Close Rates</h3>
              <p className="text-sm text-slate-600">Flexible payments remove price objections and close more deals.</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <ModuleAIAssistant 
        moduleName="QuickFinance"
        moduleContext="QuickFinance helps contractors offer payment plans to customers. It includes Pay-in-4, monthly financing options, and partner lenders. Contractors get paid upfront while customers pay over time. Help users understand financing options and how to close more deals."
      />
    </div>
  );
}
