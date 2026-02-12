import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Image, ChevronRight, Volume2, VolumeX, Share2, Instagram,
  Facebook, Globe, Sparkles, Download, Eye, Palette, Zap, Heart
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import TopNav from '@/components/TopNav';
import ModuleAIAssistant from '@/components/ModuleAIAssistant';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

export default function ContentForge() {
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
        context: { leadName: "contractor", companyName: "your company", trade: "marketing_content" },
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
      voiceMutation.mutate("Give a brief, warm 1-sentence welcome to ContentForge. You're Rachel, helping them turn job photos into social media posts, galleries, and ads automatically. Keep it super short and natural.");
    }
  }, []);

  const toggleVoice = () => {
    const newEnabled = !isVoiceEnabled;
    setIsVoiceEnabled(newEnabled);
    voiceEnabledRef.current = newEnabled;
    if (!newEnabled) {
      stopAudio();
    } else {
      voiceMutation.mutate("Say a quick, natural 1-sentence overview of ContentForge — your marketing engine that creates social content from job photos automatically. Keep it warm and conversational.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white dark:from-slate-950 dark:to-slate-900">
      <TopNav />
      <audio ref={audioRef} className="hidden" />

      <div className="bg-gradient-to-r from-pink-500 to-rose-600 text-white py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-2 text-pink-200 text-sm mb-2">
            <Link to="/workhub" className="hover:text-white">WorkHub</Link>
            <ChevronRight className="w-4 h-4" />
            <span>ContentForge</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">ContentForge</h1>
              <p className="text-pink-100 text-lg">Marketing Engine - Your work becomes your brand</p>
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
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6 text-center">
              <Image className="w-10 h-10 text-pink-500 mx-auto mb-2" />
              <p className="text-2xl font-bold">156</p>
              <p className="text-slate-600">Photos Available</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Share2 className="w-10 h-10 text-blue-500 mx-auto mb-2" />
              <p className="text-2xl font-bold">23</p>
              <p className="text-slate-600">Posts Created</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Eye className="w-10 h-10 text-green-500 mx-auto mb-2" />
              <p className="text-2xl font-bold">4.2K</p>
              <p className="text-slate-600">Total Views</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Zap className="w-10 h-10 text-amber-500 mx-auto mb-2" />
              <p className="text-2xl font-bold">8</p>
              <p className="text-slate-600">Leads from Content</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <Card className="border-2 border-pink-200 bg-gradient-to-br from-pink-50 to-rose-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-pink-600" />
                  AI Content Generator
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 mb-6">
                  Select photos from your completed jobs and let AI create professional marketing content.
                </p>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {[1,2,3,4,5,6].map((i) => (
                    <div key={i} className="aspect-square rounded-lg bg-slate-200 flex items-center justify-center">
                      <Image className="w-8 h-8 text-slate-400" />
                    </div>
                  ))}
                </div>
                <Button className="w-full bg-pink-600 hover:bg-pink-700" data-testid="button-generate-content">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Content
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="w-5 h-5 text-pink-600" />
                  Content Types
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { name: 'Before/After Posts', desc: 'Side-by-side comparison images', icon: Image },
                    { name: 'Social Stories', desc: 'Vertical format for Instagram/Facebook', icon: Instagram },
                    { name: 'Website Gallery', desc: 'Professional portfolio pages', icon: Globe },
                    { name: 'Ad Creatives', desc: 'Ready-to-run paid ad images', icon: Zap }
                  ].map((type) => (
                    <div key={type.name} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                      <type.icon className="w-8 h-8 text-pink-500" />
                      <div>
                        <p className="font-medium">{type.name}</p>
                        <p className="text-sm text-slate-500">{type.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Content</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { title: 'Tree Removal Transformation', type: 'Before/After', date: '2 days ago' },
                    { title: 'New Fence Installation', type: 'Social Story', date: '5 days ago' },
                    { title: 'Roof Repair Complete', type: 'Before/After', date: '1 week ago' }
                  ].map((content, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-12 rounded bg-slate-200 flex items-center justify-center">
                          <Image className="w-6 h-6 text-slate-400" />
                        </div>
                        <div>
                          <p className="font-medium">{content.title}</p>
                          <p className="text-sm text-slate-500">{content.type} • {content.date}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost">
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost">
                          <Share2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
              <CardContent className="py-6">
                <div className="flex items-center gap-4">
                  <div className="flex -space-x-2">
                    <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center border-2 border-white">
                      <Facebook className="w-5 h-5 text-white" />
                    </div>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center border-2 border-white">
                      <Instagram className="w-5 h-5 text-white" />
                    </div>
                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border-2 border-white">
                      <Globe className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">Connect Your Accounts</h3>
                    <p className="text-sm text-slate-600">Post directly to social media with one click</p>
                  </div>
                  <Button variant="outline">Connect</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <ModuleAIAssistant 
        moduleName="ContentForge"
        moduleContext="ContentForge is a marketing engine that automatically creates social media content from job photos. It generates before/after posts, social stories, website galleries, and ad creatives. Help users create and share marketing content from their completed work."
      />
    </div>
  );
}