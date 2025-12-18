import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Star, ChevronRight, Volume2, VolumeX, Send, MessageSquare,
  ThumbsUp, Share2, CheckCircle, TrendingUp
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import TopNav from '@/components/TopNav';
import ModuleAIAssistant from '@/components/ModuleAIAssistant';

export default function ReviewRocket() {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isVoiceActive, setIsVoiceActive] = useState(false);

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
        speakGuidance("Welcome to ReviewRocket! I'm Rachel. I automatically collect reviews after every job and distribute them to Google, Facebook, and other platforms. You have a 4.9 star rating with 156 reviews. I also respond to reviews automatically using AI.");
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
    utterance.pitch = 1.1;
    utterance.rate = 1.05;
    utterance.onstart = () => setIsVoiceActive(true);
    utterance.onend = () => setIsVoiceActive(false);
    window.speechSynthesis.speak(utterance);
  };

  const reviews = [
    { name: 'John M.', rating: 5, text: 'Excellent work! The team was professional and finished ahead of schedule.', date: '2 days ago', platform: 'Google' },
    { name: 'Sarah J.', rating: 5, text: 'Great communication and fair pricing. Highly recommend!', date: '5 days ago', platform: 'Facebook' },
    { name: 'Mike C.', rating: 4, text: 'Good job overall. Would use again.', date: '1 week ago', platform: 'Google' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-yellow-50 to-white dark:from-slate-950 dark:to-slate-900">
      <TopNav />

      <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-2 text-yellow-200 text-sm mb-2">
            <Link to="/workhub" className="hover:text-white">WorkHub</Link>
            <ChevronRight className="w-4 h-4" />
            <span>ReviewRocket</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">ReviewRocket</h1>
              <p className="text-yellow-100 text-lg">Reputation Automation - Build your 5-star reputation</p>
            </div>
            <Button
              variant="ghost"
              size="lg"
              onClick={() => isVoiceActive ? window.speechSynthesis.cancel() : speakGuidance("I'm Rachel. ReviewRocket automatically collects reviews, distributes them to multiple platforms, and responds using AI. Building your reputation has never been easier.")}
              className="text-white hover:bg-white/10"
            >
              {isVoiceActive ? <Volume2 className="w-6 h-6 animate-pulse" /> : <VolumeX className="w-6 h-6" />}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="pt-6 text-center">
              <div className="flex justify-center gap-1 mb-2">
                {[1,2,3,4,5].map(i => (
                  <Star key={i} className="w-6 h-6 text-yellow-500 fill-yellow-500" />
                ))}
              </div>
              <p className="text-3xl font-bold">4.9</p>
              <p className="text-slate-600">Average Rating</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <MessageSquare className="w-10 h-10 text-blue-500 mx-auto mb-2" />
              <p className="text-2xl font-bold">156</p>
              <p className="text-slate-600">Total Reviews</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Share2 className="w-10 h-10 text-purple-500 mx-auto mb-2" />
              <p className="text-2xl font-bold">3</p>
              <p className="text-slate-600">Platforms Connected</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <TrendingUp className="w-10 h-10 text-green-500 mx-auto mb-2" />
              <p className="text-2xl font-bold">+12</p>
              <p className="text-slate-600">This Month</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xl font-semibold">Recent Reviews</h2>
            {reviews.map((review, idx) => (
              <Card key={idx}>
                <CardContent className="py-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold">{review.name}</p>
                        <div className="flex gap-0.5">
                          {Array(review.rating).fill(0).map((_, i) => (
                            <Star key={i} className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                          ))}
                        </div>
                        <Badge variant="secondary">{review.platform}</Badge>
                      </div>
                      <p className="text-slate-600">{review.text}</p>
                      <p className="text-sm text-slate-400 mt-2">{review.date}</p>
                    </div>
                    <Button size="sm" variant="outline">
                      <MessageSquare className="w-4 h-4 mr-1" />
                      Reply
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="space-y-6">
            <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="w-5 h-5 text-yellow-600" />
                  Request Reviews
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 mb-4">
                  Automatically send thank-you messages and review requests after job completion.
                </p>
                <Button className="w-full bg-yellow-500 hover:bg-yellow-600" data-testid="button-request-reviews">
                  Send Review Requests
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Rating Distribution</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { stars: 5, count: 142, percent: 91 },
                  { stars: 4, count: 11, percent: 7 },
                  { stars: 3, count: 2, percent: 1 },
                  { stars: 2, count: 1, percent: 1 },
                  { stars: 1, count: 0, percent: 0 }
                ].map((row) => (
                  <div key={row.stars} className="flex items-center gap-2">
                    <span className="w-8">{row.stars}★</span>
                    <Progress value={row.percent} className="flex-1 h-2" />
                    <span className="text-sm text-slate-500 w-8">{row.count}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <ModuleAIAssistant 
        moduleName="ReviewRocket"
        moduleContext="ReviewRocket automates review collection and reputation management. It sends review requests after jobs, distributes reviews to Google and Facebook, and uses AI to respond to reviews. Help users build and maintain their 5-star reputation."
      />
    </div>
  );
}
