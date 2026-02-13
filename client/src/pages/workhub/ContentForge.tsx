import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Image, ChevronRight, Volume2, VolumeX, Share2, Instagram,
  Facebook, Globe, Sparkles, Download, Eye, Palette, Zap, Heart,
  Send, Video, Film, Copy, RefreshCw, Wand2, Loader2, Check,
  MessageSquare, Target, Hash, Play, X, Maximize2, ChevronDown,
  Megaphone, PenTool, Camera, Layers, ArrowRight, Star
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import TopNav from '@/components/TopNav';
import ModuleAIAssistant from '@/components/ModuleAIAssistant';
import { AutonomousAgentBadge } from '@/components/AutonomousAgentBadge';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface AdResult {
  adCopy: string;
  headlines: string[];
  callToAction: string;
  imageUrl?: string;
  videoScript?: string;
  videoConcept?: {
    scenes: Array<{ description: string; duration: string; voiceover: string; visualNotes: string }>;
    music: string;
    totalDuration: string;
    style: string;
  };
  hashtags: string[];
  platforms: string[];
  targetAudience: string;
}

export default function ContentForge() {
  const { toast } = useToast();
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const hasPlayedWelcome = useRef(false);
  const voiceEnabledRef = useRef(true);

  const [activeTab, setActiveTab] = useState('studio');
  const [prompt, setPrompt] = useState('');
  const [adType, setAdType] = useState<string>('image');
  const [style, setStyle] = useState<string>('');
  const [platform, setPlatform] = useState<string>('');
  const [adResult, setAdResult] = useState<AdResult | null>(null);
  const [generatedAds, setGeneratedAds] = useState<AdResult[]>([]);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [imageFullscreen, setImageFullscreen] = useState(false);

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
      voiceMutation.mutate("Give a brief, warm 1-sentence welcome to the AI Ad Studio inside ContentForge. You're Rachel, and this tool lets them describe any ad they want and AI creates it instantly — images, copy, video concepts, everything. Keep it super short and exciting.");
    }
  }, []);

  const toggleVoice = () => {
    const newEnabled = !isVoiceEnabled;
    setIsVoiceEnabled(newEnabled);
    voiceEnabledRef.current = newEnabled;
    if (!newEnabled) {
      stopAudio();
    }
  };

  const playRachelVoice = (message: string) => {
    if (voiceEnabledRef.current) {
      voiceMutation.mutate(message);
    }
  };

  const createAdMutation = useMutation({
    mutationFn: async (params: { prompt: string; adType: string; style: string; platform: string }) => {
      const res = await apiRequest("POST", "/api/ai-ads/freeform-create", {
        prompt: params.prompt,
        adType: params.adType,
        style: params.style || undefined,
        platform: params.platform || undefined,
        includeImage: true
      });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.success && data.result) {
        setAdResult(data.result);
        setGeneratedAds(prev => [data.result, ...prev]);
        playRachelVoice("Your ad is ready! I created compelling copy, headlines, hashtags, and a custom image. Take a look and let me know if you want to tweak anything.");
        toast({ title: "Ad Created!", description: "Your AI-generated ad is ready to use." });
      }
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to create ad", variant: "destructive" });
    }
  });

  const generateImageMutation = useMutation({
    mutationFn: async (params: { prompt: string; style?: string }) => {
      const res = await apiRequest("POST", "/api/ai-ads/generate-image-only", {
        prompt: params.prompt,
        style: params.style
      });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.success && data.imageUrl && adResult) {
        setAdResult({ ...adResult, imageUrl: data.imageUrl });
        toast({ title: "New image generated!" });
      }
    }
  });

  const handleCreateAd = () => {
    if (!prompt.trim()) {
      toast({ title: "Describe your ad", description: "Tell me what kind of ad you want to create", variant: "destructive" });
      return;
    }
    createAdMutation.mutate({ prompt: prompt.trim(), adType, style, platform });
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
    toast({ title: "Copied!", description: `${field} copied to clipboard` });
  };

  const examplePrompts = [
    "Create a storm damage restoration ad showing urgency — before the next storm hits, get your roof fixed today",
    "Design a tree removal service ad for homeowners with dangerous trees leaning on their house",
    "Make a Facebook video ad for a roofing company that just completed 500 jobs this year",
    "Create a luxury home renovation ad campaign targeting wealthy homeowners in hurricane zones",
    "Design an Instagram-ready auto body repair ad showing a dramatic before and after paint correction",
    "Make a TikTok-style ad for a pressure washing company — satisfying transformation content"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white dark:from-slate-950 dark:to-slate-900">
      <TopNav />
      <audio ref={audioRef} className="hidden" />

      <div className="bg-gradient-to-r from-pink-600 via-rose-600 to-purple-700 text-white py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2 text-pink-200 text-sm mb-2">
            <Link to="/workhub" className="hover:text-white">WorkHub</Link>
            <ChevronRight className="w-4 h-4" />
            <span>ContentForge AI Ad Studio</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
                <Wand2 className="w-10 h-10" />
                ContentForge AI Ad Studio
              </h1>
              <p className="text-pink-100 text-lg">Describe any ad. AI creates it instantly — images, copy, videos, campaigns.</p>
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

      <div className="max-w-7xl mx-auto px-4 py-6">
        <AutonomousAgentBadge moduleName="ContentForge" />
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 w-full max-w-2xl mb-6">
            <TabsTrigger value="studio" className="flex items-center gap-2">
              <Wand2 className="w-4 h-4" />
              AI Studio
            </TabsTrigger>
            <TabsTrigger value="gallery" className="flex items-center gap-2">
              <Layers className="w-4 h-4" />
              My Ads
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <PenTool className="w-4 h-4" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="content" className="flex items-center gap-2">
              <Image className="w-4 h-4" />
              Content
            </TabsTrigger>
          </TabsList>

          <TabsContent value="studio">
            <div className="grid lg:grid-cols-5 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <Card className="border-2 border-pink-200 dark:border-pink-800 bg-gradient-to-br from-white to-pink-50/30 dark:from-slate-900 dark:to-pink-950/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Sparkles className="w-5 h-5 text-pink-600" />
                      Create Your Ad
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Describe your ad</label>
                      <Textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Tell me exactly what you want... e.g., 'Create a bold Facebook ad for my roofing company showing storm damage repair, make it urgent and professional with a before/after feel'"
                        className="min-h-[120px] resize-none text-base"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Ad Type</label>
                        <Select value={adType} onValueChange={setAdType}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="image">Image Ad</SelectItem>
                            <SelectItem value="video_concept">Video Concept</SelectItem>
                            <SelectItem value="full_campaign">Full Campaign</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Platform</label>
                        <Select value={platform} onValueChange={setPlatform}>
                          <SelectTrigger>
                            <SelectValue placeholder="Any" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="any">Any Platform</SelectItem>
                            <SelectItem value="facebook">Facebook</SelectItem>
                            <SelectItem value="instagram">Instagram</SelectItem>
                            <SelectItem value="tiktok">TikTok</SelectItem>
                            <SelectItem value="youtube">YouTube</SelectItem>
                            <SelectItem value="google">Google Ads</SelectItem>
                            <SelectItem value="linkedin">LinkedIn</SelectItem>
                            <SelectItem value="twitter">X / Twitter</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Style (optional)</label>
                      <Select value={style} onValueChange={setStyle}>
                        <SelectTrigger>
                          <SelectValue placeholder="Auto-detect best style" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="auto">Auto-detect</SelectItem>
                          <SelectItem value="bold">Bold & Attention-Grabbing</SelectItem>
                          <SelectItem value="professional">Professional & Corporate</SelectItem>
                          <SelectItem value="emotional">Emotional & Heartfelt</SelectItem>
                          <SelectItem value="urgent">Urgent & Time-Sensitive</SelectItem>
                          <SelectItem value="luxury">Luxury & Premium</SelectItem>
                          <SelectItem value="fun">Fun & Playful</SelectItem>
                          <SelectItem value="minimalist">Clean & Minimalist</SelectItem>
                          <SelectItem value="cinematic">Cinematic & Dramatic</SelectItem>
                          <SelectItem value="edgy">Edgy & Disruptive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button
                      className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white font-semibold py-6 text-base"
                      onClick={handleCreateAd}
                      disabled={createAdMutation.isPending}
                    >
                      {createAdMutation.isPending ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          AI is creating your ad...
                        </>
                      ) : (
                        <>
                          <Wand2 className="w-5 h-5 mr-2" />
                          Create My Ad
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                      Try these ideas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {examplePrompts.map((ex, i) => (
                        <button
                          key={i}
                          onClick={() => setPrompt(ex)}
                          className="w-full text-left text-sm p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-pink-50 dark:hover:bg-pink-900/20 text-slate-700 dark:text-slate-300 transition-colors border border-transparent hover:border-pink-200 dark:hover:border-pink-800"
                        >
                          <span className="text-pink-500 mr-1.5">→</span>
                          {ex}
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="lg:col-span-3 space-y-4">
                {createAdMutation.isPending && !adResult && (
                  <Card className="border-2 border-pink-200 dark:border-pink-800">
                    <CardContent className="py-16 text-center">
                      <div className="relative mx-auto w-20 h-20 mb-6">
                        <div className="absolute inset-0 rounded-full border-4 border-pink-200 dark:border-pink-800" />
                        <div className="absolute inset-0 rounded-full border-4 border-pink-600 border-t-transparent animate-spin" />
                        <Wand2 className="w-8 h-8 text-pink-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">AI is crafting your ad...</h3>
                      <p className="text-slate-500">Generating copy, headlines, image, and strategy. This takes about 15-30 seconds.</p>
                    </CardContent>
                  </Card>
                )}

                {adResult && (
                  <div className="space-y-4">
                    {adResult.imageUrl && (
                      <Card className="overflow-hidden">
                        <div className="relative group">
                          <img
                            src={adResult.imageUrl}
                            alt="AI Generated Ad"
                            className="w-full max-h-[500px] object-cover cursor-pointer"
                            onClick={() => setImageFullscreen(true)}
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <div className="flex gap-2">
                              <Button size="sm" variant="secondary" onClick={() => setImageFullscreen(true)}>
                                <Maximize2 className="w-4 h-4 mr-1" /> View Full
                              </Button>
                              <Button size="sm" variant="secondary" onClick={() => {
                                if (adResult.imageUrl) {
                                  const a = document.createElement('a');
                                  a.href = adResult.imageUrl;
                                  a.download = 'ai-ad-creative.png';
                                  a.target = '_blank';
                                  a.click();
                                }
                              }}>
                                <Download className="w-4 h-4 mr-1" /> Download
                              </Button>
                              <Button size="sm" variant="secondary" onClick={() => {
                                generateImageMutation.mutate({ prompt, style });
                              }} disabled={generateImageMutation.isPending}>
                                {generateImageMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-1" />}
                                New Image
                              </Button>
                            </div>
                          </div>
                        </div>
                      </Card>
                    )}

                    <Card>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="flex items-center gap-2">
                            <Megaphone className="w-5 h-5 text-pink-600" />
                            Ad Copy
                          </CardTitle>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyToClipboard(adResult.adCopy, 'Ad Copy')}
                          >
                            {copiedField === 'Ad Copy' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-base text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">{adResult.adCopy}</p>
                        {adResult.callToAction && (
                          <div className="mt-3">
                            <Badge className="bg-pink-600 text-white px-4 py-1.5 text-sm">{adResult.callToAction}</Badge>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-base">
                          <Star className="w-5 h-5 text-amber-500" />
                          Headline Variations
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {adResult.headlines?.map((headline, i) => (
                            <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800 group">
                              <span className="font-semibold text-slate-800 dark:text-slate-200">{headline}</span>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="opacity-0 group-hover:opacity-100"
                                onClick={() => copyToClipboard(headline, `Headline ${i + 1}`)}
                              >
                                {copiedField === `Headline ${i + 1}` ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                              </Button>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {adResult.hashtags && adResult.hashtags.length > 0 && (
                      <Card>
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2 text-base">
                              <Hash className="w-5 h-5 text-blue-500" />
                              Hashtags
                            </CardTitle>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyToClipboard(adResult.hashtags.join(' '), 'Hashtags')}
                            >
                              {copiedField === 'Hashtags' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="flex flex-wrap gap-2">
                            {adResult.hashtags.map((tag, i) => (
                              <Badge key={i} variant="outline" className="text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800">
                                {tag.startsWith('#') ? tag : `#${tag}`}
                              </Badge>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    <div className="grid md:grid-cols-2 gap-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="flex items-center gap-2 text-base">
                            <Target className="w-5 h-5 text-green-500" />
                            Target Audience
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-slate-600 dark:text-slate-400">{adResult.targetAudience}</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="flex items-center gap-2 text-base">
                            <Globe className="w-5 h-5 text-purple-500" />
                            Best Platforms
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex flex-wrap gap-2">
                            {adResult.platforms?.map((p, i) => (
                              <Badge key={i} className="bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300">{p}</Badge>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {adResult.videoConcept && (
                      <Card className="border-2 border-purple-200 dark:border-purple-800">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Film className="w-5 h-5 text-purple-600" />
                            Video Concept
                          </CardTitle>
                          <div className="flex gap-2 mt-1">
                            <Badge variant="outline">{adResult.videoConcept.totalDuration}</Badge>
                            <Badge variant="outline">{adResult.videoConcept.style}</Badge>
                            <Badge variant="outline">Music: {adResult.videoConcept.music}</Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {adResult.videoConcept.scenes?.map((scene, i) => (
                              <div key={i} className="relative pl-8 pb-4 border-l-2 border-purple-200 dark:border-purple-800 last:border-0 last:pb-0">
                                <div className="absolute left-0 -translate-x-1/2 w-6 h-6 rounded-full bg-purple-600 text-white text-xs flex items-center justify-center font-bold">
                                  {i + 1}
                                </div>
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between">
                                    <h4 className="font-semibold text-slate-800 dark:text-white">Scene {i + 1}</h4>
                                    <Badge variant="outline" className="text-xs">{scene.duration}</Badge>
                                  </div>
                                  <p className="text-sm text-slate-700 dark:text-slate-300"><strong>Visual:</strong> {scene.description}</p>
                                  <p className="text-sm text-slate-600 dark:text-slate-400"><strong>Voiceover:</strong> "{scene.voiceover}"</p>
                                  <p className="text-sm text-slate-500 dark:text-slate-500 italic">{scene.visualNotes}</p>
                                </div>
                              </div>
                            ))}
                          </div>

                          {adResult.videoScript && (
                            <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-semibold text-sm">Full Video Script</h4>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => copyToClipboard(adResult.videoScript || '', 'Video Script')}
                                >
                                  {copiedField === 'Video Script' ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                                </Button>
                              </div>
                              <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap">{adResult.videoScript}</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}

                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setAdResult(null);
                          setPrompt('');
                        }}
                        className="flex-1"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Create Another
                      </Button>
                      <Button
                        className="flex-1 bg-gradient-to-r from-pink-600 to-purple-600"
                        onClick={() => {
                          const all = `${adResult.headlines?.join('\n')}\n\n${adResult.adCopy}\n\n${adResult.callToAction}\n\n${adResult.hashtags?.join(' ')}`;
                          copyToClipboard(all, 'Everything');
                        }}
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Copy Everything
                      </Button>
                    </div>
                  </div>
                )}

                {!adResult && !createAdMutation.isPending && (
                  <div className="space-y-6">
                    <Card className="bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-950/20 dark:to-purple-950/20 border-pink-200 dark:border-pink-800">
                      <CardContent className="py-12 text-center">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 mx-auto mb-6 flex items-center justify-center">
                          <Wand2 className="w-10 h-10 text-white" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-3">Just describe it. AI builds it.</h3>
                        <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto mb-6">
                          Tell us what ad you want — any industry, any style, any platform. Our AI creates professional ad copy, stunning images, headlines, hashtags, and even video concepts in seconds.
                        </p>
                        <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto">
                          <div className="text-center">
                            <Camera className="w-8 h-8 text-pink-500 mx-auto mb-1" />
                            <p className="text-xs text-slate-600 dark:text-slate-400">AI Images</p>
                          </div>
                          <div className="text-center">
                            <PenTool className="w-8 h-8 text-purple-500 mx-auto mb-1" />
                            <p className="text-xs text-slate-600 dark:text-slate-400">Ad Copy</p>
                          </div>
                          <div className="text-center">
                            <Film className="w-8 h-8 text-blue-500 mx-auto mb-1" />
                            <p className="text-xs text-slate-600 dark:text-slate-400">Video Scripts</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <div className="grid md:grid-cols-2 gap-4">
                      <Card className="hover:border-pink-300 dark:hover:border-pink-700 transition-colors cursor-pointer" onClick={() => { setAdType('image'); setPrompt('Create a professional storm damage restoration ad with dramatic before and after imagery. Target homeowners who just experienced hail damage. Make it urgent but trustworthy.'); }}>
                        <CardContent className="pt-6">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-lg bg-pink-100 dark:bg-pink-900 flex items-center justify-center">
                              <Image className="w-5 h-5 text-pink-600" />
                            </div>
                            <div>
                              <h4 className="font-semibold">Image Ads</h4>
                              <p className="text-xs text-slate-500">AI-generated visuals + copy</p>
                            </div>
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-400">Get a complete ad with custom AI image, headline variations, ad copy, CTA, and hashtags.</p>
                        </CardContent>
                      </Card>
                      <Card className="hover:border-purple-300 dark:hover:border-purple-700 transition-colors cursor-pointer" onClick={() => { setAdType('video_concept'); setPrompt('Create a 30-second video ad for a full-service contractor company. Show the journey from storm damage to beautiful restoration. Make viewers feel hope and confidence.'); }}>
                        <CardContent className="pt-6">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                              <Video className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                              <h4 className="font-semibold">Video Concepts</h4>
                              <p className="text-xs text-slate-500">Scripts, scenes & storyboards</p>
                            </div>
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-400">Get scene-by-scene video scripts with voiceover text, visual directions, and music recommendations.</p>
                        </CardContent>
                      </Card>
                      <Card className="hover:border-blue-300 dark:hover:border-blue-700 transition-colors cursor-pointer" onClick={() => { setAdType('full_campaign'); setPrompt('Create a complete social media campaign for a tree removal and landscaping company. Include posts for Facebook, Instagram, and TikTok. Mix of educational and promotional content.'); }}>
                        <CardContent className="pt-6">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                              <Megaphone className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <h4 className="font-semibold">Full Campaigns</h4>
                              <p className="text-xs text-slate-500">Multi-platform strategy</p>
                            </div>
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-400">Complete ad campaigns with multi-platform strategy, audience targeting, video concepts, and copy variations.</p>
                        </CardContent>
                      </Card>
                      <Card className="hover:border-amber-300 dark:hover:border-amber-700 transition-colors cursor-pointer" onClick={() => { setAdType('image'); setStyle('edgy'); setPrompt(''); }}>
                        <CardContent className="pt-6">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900 flex items-center justify-center">
                              <Zap className="w-5 h-5 text-amber-600" />
                            </div>
                            <div>
                              <h4 className="font-semibold">Any Industry</h4>
                              <p className="text-xs text-slate-500">No limits on creativity</p>
                            </div>
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-400">Roofing, tree removal, auto repair, restaurants, fitness, real estate — describe any business and any ad.</p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="gallery">
            <div className="space-y-4">
              {generatedAds.length === 0 ? (
                <Card>
                  <CardContent className="py-16 text-center">
                    <Layers className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-slate-600 dark:text-slate-400 mb-2">No ads yet</h3>
                    <p className="text-slate-500 mb-4">Create your first ad in the AI Studio tab</p>
                    <Button onClick={() => setActiveTab('studio')} className="bg-pink-600 hover:bg-pink-700">
                      <Wand2 className="w-4 h-4 mr-2" /> Go to AI Studio
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {generatedAds.map((ad, index) => (
                    <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer" onClick={() => { setAdResult(ad); setActiveTab('studio'); }}>
                      {ad.imageUrl && (
                        <img src={ad.imageUrl} alt={`Ad ${index + 1}`} className="w-full h-48 object-cover" />
                      )}
                      <CardContent className="pt-4">
                        <h3 className="font-bold text-base mb-1 line-clamp-1">{ad.headlines?.[0] || 'AI Generated Ad'}</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-2">{ad.adCopy}</p>
                        <div className="flex flex-wrap gap-1">
                          {ad.platforms?.slice(0, 3).map((p, i) => (
                            <Badge key={i} variant="outline" className="text-xs">{p}</Badge>
                          ))}
                          {ad.videoConcept && <Badge className="bg-purple-100 text-purple-700 text-xs">Video</Badge>}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="templates">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { title: 'Storm Damage Response', desc: 'Urgent post-storm ads targeting affected homeowners', icon: Zap, color: 'red', prompt: 'Create an urgent storm damage response ad for a contractor. Show empathy and fast response. Target homeowners in recently affected areas.' },
                { title: 'Before & After Showcase', desc: 'Dramatic transformation posts for social proof', icon: Image, color: 'green', prompt: 'Create a dramatic before and after showcase ad for a home restoration company. Make the transformation stunning and share-worthy.' },
                { title: 'Seasonal Promotion', desc: 'Time-limited offers tied to seasons', icon: Calendar, color: 'blue', prompt: 'Create a seasonal promotion ad for a roofing company offering winter preparation inspections with a limited-time discount.' },
                { title: 'Customer Testimonial', desc: 'Social proof with customer stories', icon: MessageSquare, color: 'amber', prompt: 'Create a customer testimonial style ad for a tree removal company featuring a grateful homeowner whose dangerous tree was safely removed.' },
                { title: 'Emergency Services', desc: 'Board-up and emergency response ads', icon: Megaphone, color: 'pink', prompt: 'Create an emergency services ad for a 24/7 board-up and tarping company. Storms just hit. People need help NOW.' },
                { title: 'Brand Awareness', desc: 'Build reputation and trust', icon: Heart, color: 'purple', prompt: 'Create a brand awareness ad campaign for a full-service contractor company. Emphasize 20 years of experience, 5-star ratings, and community involvement.' }
              ].map((template, i) => (
                <Card key={i} className="hover:shadow-lg transition-shadow cursor-pointer group" onClick={() => { setPrompt(template.prompt); setAdType('image'); setActiveTab('studio'); }}>
                  <CardContent className="pt-6">
                    <div className={`w-12 h-12 rounded-xl bg-${template.color}-100 dark:bg-${template.color}-900 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      <template.icon className={`w-6 h-6 text-${template.color}-600`} />
                    </div>
                    <h3 className="font-bold text-lg mb-1">{template.title}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">{template.desc}</p>
                    <div className="flex items-center gap-1 text-pink-600 dark:text-pink-400 text-sm font-medium">
                      Use Template <ArrowRight className="w-4 h-4" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="content">
            <div className="grid md:grid-cols-4 gap-4 mb-8">
              <Card>
                <CardContent className="pt-6 text-center">
                  <Image className="w-10 h-10 text-pink-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold">{generatedAds.length}</p>
                  <p className="text-slate-600 dark:text-slate-400">Ads Created</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <Share2 className="w-10 h-10 text-blue-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold">{generatedAds.filter(a => a.videoConcept).length}</p>
                  <p className="text-slate-600 dark:text-slate-400">Video Concepts</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <Eye className="w-10 h-10 text-green-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold">{generatedAds.reduce((acc, a) => acc + (a.headlines?.length || 0), 0)}</p>
                  <p className="text-slate-600 dark:text-slate-400">Headlines Generated</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <Zap className="w-10 h-10 text-amber-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold">{generatedAds.reduce((acc, a) => acc + (a.hashtags?.length || 0), 0)}</p>
                  <p className="text-slate-600 dark:text-slate-400">Hashtags Created</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
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
                      { name: 'AI Image Ads', desc: 'Custom AI-generated ad visuals with copy', icon: Camera },
                      { name: 'Video Concepts', desc: 'Scene-by-scene scripts with voiceover', icon: Film },
                      { name: 'Full Campaigns', desc: 'Multi-platform strategy packages', icon: Megaphone },
                      { name: 'Social Stories', desc: 'Platform-optimized social content', icon: Instagram },
                      { name: 'Before/After Posts', desc: 'Transformation showcase content', icon: Image },
                      { name: 'Ad Creatives', desc: 'Ready-to-run paid ad images', icon: Zap }
                    ].map((type) => (
                      <div key={type.name} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
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

              <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 border-blue-200 dark:border-blue-800">
                <CardContent className="py-6">
                  <div className="flex items-center gap-4">
                    <div className="flex -space-x-2">
                      <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center border-2 border-white dark:border-slate-800">
                        <Facebook className="w-5 h-5 text-white" />
                      </div>
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center border-2 border-white dark:border-slate-800">
                        <Instagram className="w-5 h-5 text-white" />
                      </div>
                      <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border-2 border-white dark:border-slate-800">
                        <Globe className="w-5 h-5 text-white" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">Connect Your Accounts</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Post directly to social media with one click</p>
                    </div>
                    <Button variant="outline">Connect</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {imageFullscreen && adResult?.imageUrl && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setImageFullscreen(false)}>
          <Button
            size="sm"
            variant="ghost"
            className="absolute top-4 right-4 text-white hover:bg-white/20"
            onClick={() => setImageFullscreen(false)}
          >
            <X className="w-6 h-6" />
          </Button>
          <img src={adResult.imageUrl} alt="Full size ad" className="max-w-full max-h-full object-contain" />
        </div>
      )}

      <ModuleAIAssistant
        moduleName="ContentForge AI Ad Studio"
        moduleContext="ContentForge AI Ad Studio lets users describe any ad they want and AI creates it — images, copy, headlines, hashtags, video concepts, and full campaigns. Help users create amazing advertising content by describing what they want. They can create image ads, video concepts, or full multi-platform campaigns for any industry."
      />
    </div>
  );
}

const Calendar = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
    <line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" />
  </svg>
);
