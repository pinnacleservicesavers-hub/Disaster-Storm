import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield, ChevronRight, Volume2, VolumeX, Camera, Video,
  Image, Upload, Folder, Lock, Share2, Download, Eye
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import TopNav from '@/components/TopNav';
import ModuleAIAssistant from '@/components/ModuleAIAssistant';

export default function MediaVault() {
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
        speakGuidance("Welcome to MediaVault! I'm Rachel. This is where all your job photos and videos are protected forever. I organize them into Before, During, and After categories automatically. This protects you from disputes and creates amazing marketing content from your best work.");
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-white dark:from-slate-950 dark:to-slate-900">
      <TopNav />

      <div className="bg-gradient-to-r from-slate-700 to-gray-800 text-white py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-2 text-slate-300 text-sm mb-2">
            <Link to="/workhub" className="hover:text-white">WorkHub</Link>
            <ChevronRight className="w-4 h-4" />
            <span>MediaVault</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">MediaVault</h1>
              <p className="text-slate-300 text-lg">Protected Documentation - Your work, secured forever</p>
            </div>
            <Button
              variant="ghost"
              size="lg"
              onClick={() => isVoiceActive ? window.speechSynthesis.cancel() : speakGuidance("I'm Rachel. MediaVault securely stores all your before, during, and after photos. This protects you from disputes and turns your best work into marketing content.")}
              className="text-white hover:bg-white/10"
            >
              {isVoiceActive ? <Volume2 className="w-6 h-6 animate-pulse" /> : <VolumeX className="w-6 h-6" />}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Card className="bg-amber-50 border-amber-200">
            <CardContent className="pt-6">
              <Camera className="w-10 h-10 text-amber-600 mb-2" />
              <p className="text-2xl font-bold">156</p>
              <p className="text-slate-600">Before Photos</p>
            </CardContent>
          </Card>
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <Video className="w-10 h-10 text-blue-600 mb-2" />
              <p className="text-2xl font-bold">89</p>
              <p className="text-slate-600">During Work</p>
            </CardContent>
          </Card>
          <Card className="bg-green-50 border-green-200">
            <CardContent className="pt-6">
              <Image className="w-10 h-10 text-green-600 mb-2" />
              <p className="text-2xl font-bold">124</p>
              <p className="text-slate-600">After Photos</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="all" className="space-y-6">
          <TabsList>
            <TabsTrigger value="all">All Media</TabsTrigger>
            <TabsTrigger value="before">Before</TabsTrigger>
            <TabsTrigger value="during">During</TabsTrigger>
            <TabsTrigger value="after">After</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <Card className="border-dashed border-2 border-slate-300">
              <CardContent className="py-16">
                <div className="text-center">
                  <Upload className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Upload Media</h3>
                  <p className="text-slate-500 mb-4">Drag & drop photos or videos, or click to browse</p>
                  <Button data-testid="button-upload-media">
                    <Upload className="w-4 h-4 mr-2" />
                    Choose Files
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="grid md:grid-cols-2 gap-6 mt-8">
          <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Share2 className="w-5 h-5 text-purple-600" />
                Social Ready
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 mb-4">
                Turn your before/after photos into social media posts automatically.
              </p>
              <Button variant="outline" className="w-full">
                Create Social Post
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-green-600" />
                Dispute Protection
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 mb-4">
                All photos are timestamped and secured. Perfect evidence if disputes arise.
              </p>
              <Badge className="bg-green-100 text-green-700">
                <Lock className="w-3 h-3 mr-1" />
                All Media Protected
              </Badge>
            </CardContent>
          </Card>
        </div>
      </div>

      <ModuleAIAssistant 
        moduleName="MediaVault"
        moduleContext="MediaVault is a protected documentation system for job photos and videos. It organizes media into Before, During, and After categories, provides dispute protection with timestamps, and enables easy social media sharing. Help users manage their job documentation."
      />
    </div>
  );
}
