import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp, ChevronRight, Volume2, VolumeX, Award, CheckCircle,
  Clock, DollarSign, ThumbsUp, Shield, Star, BarChart3, Heart
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import TopNav from '@/components/TopNav';
import ModuleAIAssistant from '@/components/ModuleAIAssistant';
import { AutonomousAgentBadge } from '@/components/AutonomousAgentBadge';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import ModuleVoiceGuide from '@/components/ModuleVoiceGuide';

export default function FairnessScore() {
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
      const res = await apiRequest("/api/closebot/chat", "POST", {
        message,
        history: [],
        context: { leadName: "contractor", companyName: "your company", trade: "trust_transparency" },
        enableVoice: true,
      });
      return res;
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
      voiceMutation.mutate("Give a brief, warm 1-sentence welcome to FairnessScore. You're Rachel, helping them understand their trust transparency dashboard with an overall score of 94. Keep it super short and natural.");
    }
  }, []);

  const toggleVoice = () => {
    const newEnabled = !isVoiceEnabled;
    setIsVoiceEnabled(newEnabled);
    voiceEnabledRef.current = newEnabled;
    if (!newEnabled) {
      stopAudio();
    } else {
      voiceMutation.mutate("Say a quick, natural 1-sentence overview of FairnessScore — showing customers how trustworthy you are based on pricing accuracy, reliability, and satisfaction. Keep it warm and conversational.");
    }
  };

  const scores = [
    { name: 'Pricing Accuracy', score: 96, desc: 'How close final prices are to estimates', icon: DollarSign },
    { name: 'On-Time Arrival', score: 92, desc: 'Arriving when scheduled', icon: Clock },
    { name: 'Completion Speed', score: 88, desc: 'Finishing within estimated timeframe', icon: TrendingUp },
    { name: 'Customer Satisfaction', score: 98, desc: 'Based on reviews and feedback', icon: ThumbsUp }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-lime-50 to-white dark:from-slate-950 dark:to-slate-900">
      <TopNav />
      <audio ref={audioRef} className="hidden" />

      <div className="bg-gradient-to-r from-lime-500 to-green-600 text-white py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-2 text-lime-200 text-sm mb-2">
            <Link to="/workhub" className="hover:text-white">WorkHub</Link>
            <ChevronRight className="w-4 h-4" />
            <span>FairnessScore</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">FairnessScore</h1>
              <p className="text-lime-100 text-lg">Trust Transparency - Build customer confidence</p>
            </div>
            <Button
              variant="ghost"
              size="lg"
              onClick={toggleVoice}
              className="text-white hover:bg-white/10"
            >
              {isPlaying ? <Volume2 className="w-6 h-6 animate-pulse" /> : isVoiceEnabled ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <AutonomousAgentBadge moduleName="FairnessScore" />
        <div className="grid lg:grid-cols-3 gap-8">
          <Card className="lg:row-span-2 bg-gradient-to-br from-lime-50 to-green-50 border-lime-200">
            <CardContent className="pt-8">
              <div className="text-center">
                <div className="relative w-40 h-40 mx-auto mb-6">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="12" fill="none" className="text-lime-200" />
                    <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="12" fill="none" className="text-lime-600" strokeDasharray={440} strokeDashoffset={440 * (1 - 0.94)} strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-5xl font-bold text-lime-700">94</p>
                      <p className="text-sm text-lime-600">FairnessScore</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-wrap justify-center gap-2 mb-6">
                  <Badge className="bg-green-100 text-green-700 text-sm py-1 px-3">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Fair Pricing
                  </Badge>
                  <Badge className="bg-blue-100 text-blue-700 text-sm py-1 px-3">
                    <Clock className="w-4 h-4 mr-1" />
                    Reliable
                  </Badge>
                  <Badge className="bg-purple-100 text-purple-700 text-sm py-1 px-3">
                    <Star className="w-4 h-4 mr-1" />
                    Top Rated
                  </Badge>
                </div>

                <p className="text-slate-600 text-sm">
                  Your FairnessScore is displayed to customers, building trust before they even contact you.
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="lg:col-span-2 space-y-4">
            {scores.map((item) => (
              <Card key={item.name}>
                <CardContent className="py-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      item.score >= 95 ? 'bg-green-100 text-green-600' :
                      item.score >= 90 ? 'bg-blue-100 text-blue-600' :
                      'bg-amber-100 text-amber-600'
                    }`}>
                      <item.icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-semibold">{item.name}</p>
                        <p className={`font-bold ${
                          item.score >= 95 ? 'text-green-600' :
                          item.score >= 90 ? 'text-blue-600' :
                          'text-amber-600'
                        }`}>{item.score}</p>
                      </div>
                      <Progress value={item.score} className="h-2 mb-1" />
                      <p className="text-sm text-slate-500">{item.desc}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-lime-600" />
                  How to Improve Your Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {[
                    { title: 'Be Accurate', desc: 'Keep final prices close to your estimates' },
                    { title: 'Be On Time', desc: 'Arrive when scheduled or communicate delays' },
                    { title: 'Finish Fast', desc: 'Complete work within your quoted timeframe' },
                    { title: 'Delight Customers', desc: 'Go above and beyond to earn 5-star reviews' }
                  ].map((tip) => (
                    <div key={tip.title} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-lime-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">{tip.title}</p>
                        <p className="text-sm text-slate-500">{tip.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <ModuleAIAssistant 
        moduleName="FairnessScore"
        moduleContext="FairnessScore is a trust transparency system that calculates contractor reliability scores based on pricing accuracy, on-time arrival, completion speed, and customer satisfaction. Help users understand their scores and how to improve them."
      />
      <ModuleVoiceGuide moduleName="fairness-score" />
    </div>
  );
}