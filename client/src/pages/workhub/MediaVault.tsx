import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield, ChevronRight, Volume2, VolumeX, Camera, Video,
  Image, Upload, Folder, Lock, Share2, Download, Eye, Heart
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import TopNav from '@/components/TopNav';
import ModuleAIAssistant from '@/components/ModuleAIAssistant';
import TeamInvite from '@/components/TeamInvite';
import BeforeAfterComparison from '@/components/BeforeAfterComparison';
import AIVideoGenerator from '@/components/AIVideoGenerator';
import { Users, Film, SplitSquareHorizontal } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

export default function MediaVault() {
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
        context: { leadName: "contractor", companyName: "your company", trade: "media_documentation" },
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
      voiceMutation.mutate("Give a brief, warm 1-sentence welcome to MediaVault. You're Rachel, helping them protect their job photos and videos forever, organized into Before, During, and After categories. Keep it super short and natural.");
    }
  }, []);

  const toggleVoice = () => {
    const newEnabled = !isVoiceEnabled;
    setIsVoiceEnabled(newEnabled);
    voiceEnabledRef.current = newEnabled;
    if (!newEnabled) {
      stopAudio();
    } else {
      voiceMutation.mutate("Say a quick, natural 1-sentence overview of MediaVault — secure storage for job photos that protects from disputes and creates marketing content. Keep it warm and conversational.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-white dark:from-slate-950 dark:to-slate-900">
      <TopNav />
      <audio ref={audioRef} className="hidden" />

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
              onClick={toggleVoice}
              className="text-white hover:bg-white/10"
            >
              {isPlaying ? <Volume2 className="w-6 h-6 animate-pulse" /> : isVoiceEnabled ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
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

        <div className="grid md:grid-cols-2 gap-6 mt-8">
          <BeforeAfterComparison 
            photos={[
              { id: 'demo-1', url: 'https://picsum.photos/seed/before1/800/600', phase: 'before', timestamp: new Date().toISOString() },
              { id: 'demo-2', url: 'https://picsum.photos/seed/after1/800/600', phase: 'after', timestamp: new Date().toISOString() }
            ]}
            projectName="Sample Project"
          />
          
          <AIVideoGenerator 
            photos={[
              { id: 'v1', url: 'https://picsum.photos/seed/vid1/800/600', phase: 'before', timestamp: new Date().toISOString() },
              { id: 'v2', url: 'https://picsum.photos/seed/vid2/800/600', phase: 'during', timestamp: new Date().toISOString() },
              { id: 'v3', url: 'https://picsum.photos/seed/vid3/800/600', phase: 'after', timestamp: new Date().toISOString() }
            ]}
            projectName="Sample Project"
          />
        </div>

        <div className="mt-8">
          <TeamInvite />
        </div>
      </div>

      <ModuleAIAssistant 
        moduleName="MediaVault"
        moduleContext="MediaVault is a protected documentation system for job photos and videos. It organizes media into Before, During, and After categories, provides dispute protection with timestamps, and enables easy social media sharing. Help users manage their job documentation."
      />
    </div>
  );
}