import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield, ChevronRight, Volume2, VolumeX, Camera, Video,
  Image, Upload, Folder, Lock, Share2, Download, Eye, Heart,
  Film, Wand2, Sparkles, Loader2, Copy, Check, FileText,
  Megaphone, PenTool, Palette, Send, RefreshCw, X, Maximize2,
  Play, Layers, BookOpen, LayoutTemplate, ImagePlus
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import TopNav from '@/components/TopNav';
import ModuleAIAssistant from '@/components/ModuleAIAssistant';
import { AutonomousAgentBadge } from '@/components/AutonomousAgentBadge';
import TeamInvite from '@/components/TeamInvite';
import BeforeAfterComparison from '@/components/BeforeAfterComparison';
import AIVideoGenerator from '@/components/AIVideoGenerator';
import { Users, SplitSquareHorizontal } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface CreativeResult {
  adCopy?: string;
  headlines?: string[];
  callToAction?: string;
  imageUrl?: string;
  videoScript?: string;
  videoConcept?: {
    scenes: Array<{ description: string; duration: string; voiceover: string; visualNotes: string }>;
    music: string;
    totalDuration: string;
    style: string;
  };
  hashtags?: string[];
  platforms?: string[];
  targetAudience?: string;
}

export default function MediaVault() {
  const { toast } = useToast();
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const hasPlayedWelcome = useRef(false);
  const voiceEnabledRef = useRef(true);

  const [activeTab, setActiveTab] = useState('vault');
  const [creativePrompt, setCreativePrompt] = useState('');
  const [creativeType, setCreativeType] = useState('video_concept');
  const [creativeStyle, setCreativeStyle] = useState('');
  const [creativePlatform, setCreativePlatform] = useState('');
  const [creativeResult, setCreativeResult] = useState<CreativeResult | null>(null);
  const [createdItems, setCreatedItems] = useState<CreativeResult[]>([]);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [imageFullscreen, setImageFullscreen] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

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
      voiceMutation.mutate("Give a brief, warm 1-sentence welcome to MediaVault Creative Studio. You're Rachel. This is where they store job photos AND create videos, flyers, ads, and brochures using AI — just describe what they want. Keep it super short and exciting.");
    }
  }, []);

  const toggleVoice = () => {
    const newEnabled = !isVoiceEnabled;
    setIsVoiceEnabled(newEnabled);
    voiceEnabledRef.current = newEnabled;
    if (!newEnabled) stopAudio();
  };

  const playRachelVoice = (message: string) => {
    if (voiceEnabledRef.current) voiceMutation.mutate(message);
  };

  const createMutation = useMutation({
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
        setCreativeResult(data.result);
        setCreatedItems(prev => [data.result, ...prev]);
        playRachelVoice("Your creative is ready! I generated everything — copy, visuals, and a complete concept. Check it out and let me know if you want changes.");
        toast({ title: "Creative Ready!", description: "Your AI-generated content is ready." });
      }
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to create content", variant: "destructive" });
    }
  });

  const generateImageMutation = useMutation({
    mutationFn: async (params: { prompt: string; style?: string }) => {
      const res = await apiRequest("POST", "/api/ai-ads/generate-image-only", { prompt: params.prompt, style: params.style });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.success && data.imageUrl && creativeResult) {
        setCreativeResult({ ...creativeResult, imageUrl: data.imageUrl });
        toast({ title: "New image generated!" });
      }
    }
  });

  const handleCreate = () => {
    if (!creativePrompt.trim()) {
      toast({ title: "Describe your content", description: "Tell Rachel what you want to create", variant: "destructive" });
      return;
    }
    createMutation.mutate({ prompt: creativePrompt.trim(), adType: creativeType, style: creativeStyle, platform: creativePlatform });
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
    toast({ title: "Copied!", description: `${field} copied to clipboard` });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setUploadedFiles(prev => [...prev, ...files]);
    const newUrls = files.map(file => URL.createObjectURL(file));
    setPreviewUrls(prev => [...prev, ...newUrls]);
    playRachelVoice(`${files.length} files uploaded to your vault. They're securely stored and ready to use for creating content.`);
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const downloadCreativeAsText = (item: CreativeResult, index: number) => {
    let content = '';
    if (item.headlines?.length) {
      content += 'HEADLINES\n' + '='.repeat(40) + '\n';
      item.headlines.forEach((h, i) => { content += `${i + 1}. ${h}\n`; });
      content += '\n';
    }
    if (item.adCopy) {
      content += 'AD COPY\n' + '='.repeat(40) + '\n' + item.adCopy + '\n\n';
    }
    if (item.callToAction) {
      content += 'CALL TO ACTION\n' + '='.repeat(40) + '\n' + item.callToAction + '\n\n';
    }
    if (item.videoConcept) {
      content += 'VIDEO STORYBOARD\n' + '='.repeat(40) + '\n';
      content += `Style: ${item.videoConcept.style}\nDuration: ${item.videoConcept.totalDuration}\nMusic: ${item.videoConcept.music}\n\n`;
      item.videoConcept.scenes?.forEach((scene, i) => {
        content += `Scene ${i + 1} (${scene.duration}):\n`;
        content += `  Visual: ${scene.description}\n`;
        content += `  Voiceover: "${scene.voiceover}"\n`;
        content += `  Notes: ${scene.visualNotes}\n\n`;
      });
    }
    if (item.videoScript) {
      content += 'FULL SCRIPT\n' + '='.repeat(40) + '\n' + item.videoScript + '\n\n';
    }
    if (item.hashtags?.length) {
      content += 'HASHTAGS\n' + '='.repeat(40) + '\n' + item.hashtags.join(' ') + '\n\n';
    }
    if (item.platforms?.length) {
      content += 'PLATFORMS\n' + '='.repeat(40) + '\n' + item.platforms.join(', ') + '\n\n';
    }
    if (item.targetAudience) {
      content += 'TARGET AUDIENCE\n' + '='.repeat(40) + '\n' + item.targetAudience + '\n';
    }

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `creative-${index + 1}-content.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Content downloaded!", description: "Your creative content has been saved." });
  };

  const downloadImageFromUrl = async (imageUrl: string, filename: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Downloaded!", description: `${filename} saved.` });
    } catch {
      const a = document.createElement('a');
      a.href = imageUrl;
      a.download = filename;
      a.target = '_blank';
      a.click();
      toast({ title: "Downloading...", description: "Opening download in new tab." });
    }
  };

  const shareToSocial = (platform: string, item: CreativeResult) => {
    const text = encodeURIComponent(`${item.headlines?.[0] || ''}\n\n${item.adCopy || ''}\n\n${item.callToAction || ''}\n\n${item.hashtags?.join(' ') || ''}`);
    const url = encodeURIComponent(item.imageUrl || window.location.href);
    let shareUrl = '';
    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?quote=${text}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${text}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
        break;
      case 'email':
        shareUrl = `mailto:?subject=${encodeURIComponent(item.headlines?.[0] || 'Check this out')}&body=${text}`;
        break;
    }
    if (shareUrl) window.open(shareUrl, '_blank', 'width=600,height=400');
    toast({ title: `Sharing to ${platform}...` });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-white dark:from-slate-950 dark:to-slate-900">
      <TopNav />
      <audio ref={audioRef} className="hidden" />

      <div className="bg-gradient-to-r from-slate-800 via-indigo-900 to-purple-900 text-white py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2 text-slate-300 text-sm mb-2">
            <Link to="/workhub" className="hover:text-white">WorkHub</Link>
            <ChevronRight className="w-4 h-4" />
            <span>MediaVault Creative Studio</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
                <Shield className="w-10 h-10" />
                MediaVault Creative Studio
              </h1>
              <p className="text-slate-300 text-lg">Store your work, then turn it into videos, ads, flyers & brochures with AI</p>
            </div>
            <Button variant="ghost" size="lg" onClick={toggleVoice} className="text-white hover:bg-white/10">
              {isPlaying ? <Volume2 className="w-6 h-6 animate-pulse" /> : isVoiceEnabled ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <AutonomousAgentBadge moduleName="MediaVault" />
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-5 w-full max-w-3xl mb-6">
            <TabsTrigger value="vault" className="flex items-center gap-1.5">
              <Folder className="w-4 h-4" />
              Media Vault
            </TabsTrigger>
            <TabsTrigger value="video" className="flex items-center gap-1.5">
              <Film className="w-4 h-4" />
              AI Video
            </TabsTrigger>
            <TabsTrigger value="flyers" className="flex items-center gap-1.5">
              <LayoutTemplate className="w-4 h-4" />
              Flyers & Ads
            </TabsTrigger>
            <TabsTrigger value="brochures" className="flex items-center gap-1.5">
              <BookOpen className="w-4 h-4" />
              Brochures
            </TabsTrigger>
            <TabsTrigger value="gallery" className="flex items-center gap-1.5">
              <Layers className="w-4 h-4" />
              Created
            </TabsTrigger>
          </TabsList>

          <TabsContent value="vault">
            <div className="grid md:grid-cols-3 gap-4 mb-8">
              <Card className="bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800">
                <CardContent className="pt-6">
                  <Camera className="w-10 h-10 text-amber-600 mb-2" />
                  <p className="text-2xl font-bold">{previewUrls.filter((_, i) => i % 3 === 0).length || 0}</p>
                  <p className="text-slate-600 dark:text-slate-400">Before Photos</p>
                </CardContent>
              </Card>
              <Card className="bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800">
                <CardContent className="pt-6">
                  <Video className="w-10 h-10 text-blue-600 mb-2" />
                  <p className="text-2xl font-bold">{previewUrls.filter((_, i) => i % 3 === 1).length || 0}</p>
                  <p className="text-slate-600 dark:text-slate-400">During Work</p>
                </CardContent>
              </Card>
              <Card className="bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800">
                <CardContent className="pt-6">
                  <Image className="w-10 h-10 text-green-600 mb-2" />
                  <p className="text-2xl font-bold">{previewUrls.filter((_, i) => i % 3 === 2).length || 0}</p>
                  <p className="text-slate-600 dark:text-slate-400">After Photos</p>
                </CardContent>
              </Card>
            </div>

            <Card className="border-dashed border-2 border-slate-300 dark:border-slate-600 mb-6">
              <CardContent className="py-12">
                <div className="text-center">
                  <Upload className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Upload Media</h3>
                  <p className="text-slate-500 mb-4">Drag & drop photos or videos, or click to browse</p>
                  <input type="file" id="vault-upload" multiple accept="image/*,video/*" onChange={handleFileUpload} className="hidden" />
                  <label htmlFor="vault-upload">
                    <Button asChild>
                      <span><Upload className="w-4 h-4 mr-2" />Choose Files</span>
                    </Button>
                  </label>
                </div>
              </CardContent>
            </Card>

            {previewUrls.length > 0 && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Image className="w-5 h-5 text-indigo-600" />
                    Your Media ({previewUrls.length} files)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                    {previewUrls.map((url, idx) => (
                      <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border group">
                        <img src={url} alt={`File ${idx + 1}`} className="w-full h-full object-cover" />
                        <button onClick={() => removeFile(idx)} className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs">
                          <X className="w-3 h-3" />
                        </button>
                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs py-0.5 text-center opacity-0 group-hover:opacity-100">
                          {idx % 3 === 0 ? 'Before' : idx % 3 === 1 ? 'During' : 'After'}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-200 dark:border-purple-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Share2 className="w-5 h-5 text-purple-600" />
                    Social Ready
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600 dark:text-slate-400 mb-4">Turn your before/after photos into social media posts automatically.</p>
                  <Button variant="outline" className="w-full" onClick={() => { setActiveTab('flyers'); setCreativePrompt('Create a stunning before and after social media post showcasing our work transformation'); }}>
                    Create Social Post
                  </Button>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="w-5 h-5 text-green-600" />
                    Dispute Protection
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600 dark:text-slate-400 mb-4">All photos are timestamped and secured. Perfect evidence if disputes arise.</p>
                  <Badge className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"><Lock className="w-3 h-3 mr-1" />All Media Protected</Badge>
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
          </TabsContent>

          <TabsContent value="video">
            <AICreativeStudio
              title="AI Video Creator"
              subtitle="Describe any video and Rachel creates a complete production-ready concept"
              icon={<Film className="w-6 h-6" />}
              defaultType="video_concept"
              prompt={creativePrompt}
              setPrompt={setCreativePrompt}
              style={creativeStyle}
              setStyle={setCreativeStyle}
              platform={creativePlatform}
              setPlatform={setCreativePlatform}
              creativeType={creativeType}
              setCreativeType={setCreativeType}
              result={creativeResult}
              setResult={setCreativeResult}
              isCreating={createMutation.isPending}
              onCreate={handleCreate}
              onRegenerateImage={(p, s) => generateImageMutation.mutate({ prompt: p, style: s })}
              isRegenerating={generateImageMutation.isPending}
              copiedField={copiedField}
              onCopy={copyToClipboard}
              onImageFullscreen={() => setImageFullscreen(true)}
              examples={[
                "Create a 30-second cinematic video ad for a storm damage restoration company showing the journey from destruction to beautiful restoration",
                "Make a TikTok-style satisfying transformation video for a pressure washing company — dramatic before and after reveal",
                "Design a YouTube pre-roll ad for an emergency tree removal service — dramatic fallen tree footage, fast response, happy customer testimonial",
                "Create a Facebook video ad showing a day in the life of a roofing crew — dawn to completion, teamwork, professional results",
                "Make a viral-worthy Instagram Reel for a painting company — time-lapse room transformation with trendy music"
              ]}
              color="purple"
            />
          </TabsContent>

          <TabsContent value="flyers">
            <AICreativeStudio
              title="AI Flyer & Ad Designer"
              subtitle="Create professional flyers, social media ads, and promotional materials instantly"
              icon={<Megaphone className="w-6 h-6" />}
              defaultType="image"
              prompt={creativePrompt}
              setPrompt={setCreativePrompt}
              style={creativeStyle}
              setStyle={setCreativeStyle}
              platform={creativePlatform}
              setPlatform={setCreativePlatform}
              creativeType={creativeType}
              setCreativeType={setCreativeType}
              result={creativeResult}
              setResult={setCreativeResult}
              isCreating={createMutation.isPending}
              onCreate={handleCreate}
              onRegenerateImage={(p, s) => generateImageMutation.mutate({ prompt: p, style: s })}
              isRegenerating={generateImageMutation.isPending}
              copiedField={copiedField}
              onCopy={copyToClipboard}
              onImageFullscreen={() => setImageFullscreen(true)}
              examples={[
                "Design a door hanger flyer for a roofing company offering free storm damage inspections — professional, urgent, trustworthy",
                "Create a Facebook ad for a tree removal company with a seasonal special — 20% off winter clearance with dramatic imagery",
                "Make an Instagram post for a painting contractor showcasing luxury interior work — clean, modern, aspirational",
                "Design a yard sign for emergency board-up services — bold, easy to read from the road, phone number prominent",
                "Create a direct mail postcard for a general contractor targeting homeowners in recently storm-hit neighborhoods"
              ]}
              color="pink"
            />
          </TabsContent>

          <TabsContent value="brochures">
            <AICreativeStudio
              title="AI Brochure Creator"
              subtitle="Professional brochures, service guides, and marketing materials in seconds"
              icon={<BookOpen className="w-6 h-6" />}
              defaultType="full_campaign"
              prompt={creativePrompt}
              setPrompt={setCreativePrompt}
              style={creativeStyle}
              setStyle={setCreativeStyle}
              platform={creativePlatform}
              setPlatform={setCreativePlatform}
              creativeType={creativeType}
              setCreativeType={setCreativeType}
              result={creativeResult}
              setResult={setCreativeResult}
              isCreating={createMutation.isPending}
              onCreate={handleCreate}
              onRegenerateImage={(p, s) => generateImageMutation.mutate({ prompt: p, style: s })}
              isRegenerating={generateImageMutation.isPending}
              copiedField={copiedField}
              onCopy={copyToClipboard}
              onImageFullscreen={() => setImageFullscreen(true)}
              examples={[
                "Create a tri-fold brochure for a full-service home restoration company — list all services, showcase work quality, include contact info and financing options",
                "Design a service menu brochure for a landscaping company — tree removal, trimming, stump grinding, lawn care, with pricing tiers",
                "Make a capabilities brochure for a general contractor targeting insurance adjusters — certifications, past projects, IICRC credentials",
                "Create a new homeowner welcome packet brochure — seasonal maintenance tips, emergency services contact, warranty information",
                "Design a commercial services brochure for a restoration company targeting property managers — 24/7 response, multi-location support"
              ]}
              color="indigo"
            />
          </TabsContent>

          <TabsContent value="gallery">
            {createdItems.length === 0 ? (
              <Card>
                <CardContent className="py-16 text-center">
                  <Layers className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-slate-600 dark:text-slate-400 mb-2">Nothing created yet</h3>
                  <p className="text-slate-500 mb-4">Use the Video, Flyers, or Brochures tabs to create content with AI</p>
                  <Button onClick={() => setActiveTab('video')} className="bg-purple-600 hover:bg-purple-700">
                    <Film className="w-4 h-4 mr-2" /> Create a Video
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-white">{createdItems.length} Created Item{createdItems.length !== 1 ? 's' : ''}</h3>
                  <Button variant="outline" size="sm" onClick={() => {
                    createdItems.forEach((item, idx) => {
                      if (item.imageUrl) {
                        const a = document.createElement('a');
                        a.href = item.imageUrl;
                        a.download = `creative-${idx + 1}.png`;
                        a.target = '_blank';
                        a.click();
                      }
                    });
                    toast({ title: "Downloading all images..." });
                  }}>
                    <Download className="w-4 h-4 mr-2" />Download All
                  </Button>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {createdItems.map((item, index) => (
                    <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow">
                      {item.imageUrl && (
                        <div className="relative group cursor-pointer" onClick={() => { setCreativeResult(item); setActiveTab(item.videoConcept ? 'video' : 'flyers'); }}>
                          <img src={item.imageUrl} alt={`Creative ${index + 1}`} className="w-full h-48 object-cover" />
                        </div>
                      )}
                      <CardContent className="pt-4">
                        <h3 className="font-bold text-base mb-1 line-clamp-1">{item.headlines?.[0] || 'AI Created Content'}</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-3">{item.adCopy}</p>
                        <div className="flex flex-wrap gap-1 mb-3">
                          {item.videoConcept && <Badge className="bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 text-xs">Video</Badge>}
                          {item.imageUrl && <Badge className="bg-pink-100 dark:bg-pink-900 text-pink-700 dark:text-pink-300 text-xs">Image</Badge>}
                          {item.platforms?.slice(0, 2).map((p, i) => (
                            <Badge key={i} variant="outline" className="text-xs">{p}</Badge>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          {item.imageUrl && (
                            <Button size="sm" variant="outline" className="flex-1" onClick={(e) => {
                              e.stopPropagation();
                              const a = document.createElement('a');
                              a.href = item.imageUrl!;
                              a.download = `creative-${index + 1}.png`;
                              a.target = '_blank';
                              a.click();
                              toast({ title: "Downloading image..." });
                            }}>
                              <Download className="w-3 h-3 mr-1" />Image
                            </Button>
                          )}
                          <Button size="sm" variant="outline" className="flex-1" onClick={(e) => {
                            e.stopPropagation();
                            downloadCreativeAsText(item, index);
                          }}>
                            <Download className="w-3 h-3 mr-1" />Content
                          </Button>
                          <Button size="sm" variant="outline" onClick={(e) => {
                            e.stopPropagation();
                            const all = `${item.headlines?.join('\n')}\n\n${item.adCopy}\n\n${item.callToAction}\n\n${item.hashtags?.join(' ')}`;
                            navigator.clipboard.writeText(all);
                            toast({ title: "Copied!", description: "All content copied to clipboard" });
                          }}>
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {imageFullscreen && creativeResult?.imageUrl && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setImageFullscreen(false)}>
          <Button size="sm" variant="ghost" className="absolute top-4 right-4 text-white hover:bg-white/20" onClick={() => setImageFullscreen(false)}>
            <X className="w-6 h-6" />
          </Button>
          <img src={creativeResult.imageUrl} alt="Full size" className="max-w-full max-h-full object-contain" />
        </div>
      )}

      <ModuleAIAssistant
        moduleName="MediaVault Creative Studio"
        moduleContext="MediaVault Creative Studio stores job photos and videos AND lets users create AI-powered content from them. Users can create videos, flyers, ads, brochures, and social media content by describing what they want. Help users create amazing marketing materials and manage their media."
      />
    </div>
  );
}

function AICreativeStudio({ title, subtitle, icon, defaultType, prompt, setPrompt, style, setStyle, platform, setPlatform, creativeType, setCreativeType, result, setResult, isCreating, onCreate, onRegenerateImage, isRegenerating, copiedField, onCopy, onImageFullscreen, examples, color }: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  defaultType: string;
  prompt: string;
  setPrompt: (v: string) => void;
  style: string;
  setStyle: (v: string) => void;
  platform: string;
  setPlatform: (v: string) => void;
  creativeType: string;
  setCreativeType: (v: string) => void;
  result: CreativeResult | null;
  setResult: (v: CreativeResult | null) => void;
  isCreating: boolean;
  onCreate: () => void;
  onRegenerateImage: (prompt: string, style: string) => void;
  isRegenerating: boolean;
  copiedField: string | null;
  onCopy: (text: string, field: string) => void;
  onImageFullscreen: () => void;
  examples: string[];
  color: string;
}) {
  useEffect(() => {
    setCreativeType(defaultType);
  }, [defaultType]);

  const colorClasses: Record<string, { gradient: string; bg: string; border: string; text: string }> = {
    purple: { gradient: 'from-purple-600 to-indigo-600', bg: 'bg-purple-50 dark:bg-purple-950/20', border: 'border-purple-200 dark:border-purple-800', text: 'text-purple-600' },
    pink: { gradient: 'from-pink-600 to-rose-600', bg: 'bg-pink-50 dark:bg-pink-950/20', border: 'border-pink-200 dark:border-pink-800', text: 'text-pink-600' },
    indigo: { gradient: 'from-indigo-600 to-blue-600', bg: 'bg-indigo-50 dark:bg-indigo-950/20', border: 'border-indigo-200 dark:border-indigo-800', text: 'text-indigo-600' },
  };
  const c = colorClasses[color] || colorClasses.purple;

  return (
    <div className="grid lg:grid-cols-5 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <Card className={`border-2 ${c.border} ${c.bg}`}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              {icon}
              <span className={c.text}>{title}</span>
            </CardTitle>
            <p className="text-sm text-slate-500">{subtitle}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe exactly what you want Rachel to create... Be as specific or as creative as you want — no limits."
              className="min-h-[120px] resize-none text-base"
            />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Type</label>
                <Select value={creativeType} onValueChange={setCreativeType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="image">Image / Flyer</SelectItem>
                    <SelectItem value="video_concept">Video Concept</SelectItem>
                    <SelectItem value="full_campaign">Full Campaign</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Platform</label>
                <Select value={platform} onValueChange={setPlatform}>
                  <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any Platform</SelectItem>
                    <SelectItem value="facebook">Facebook</SelectItem>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="tiktok">TikTok</SelectItem>
                    <SelectItem value="youtube">YouTube</SelectItem>
                    <SelectItem value="print">Print / Mail</SelectItem>
                    <SelectItem value="website">Website</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Style</label>
              <Select value={style} onValueChange={setStyle}>
                <SelectTrigger><SelectValue placeholder="Auto-detect" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto-detect</SelectItem>
                  <SelectItem value="bold">Bold & Eye-Catching</SelectItem>
                  <SelectItem value="professional">Professional & Corporate</SelectItem>
                  <SelectItem value="emotional">Emotional & Heartfelt</SelectItem>
                  <SelectItem value="urgent">Urgent & Time-Sensitive</SelectItem>
                  <SelectItem value="luxury">Luxury & Premium</SelectItem>
                  <SelectItem value="fun">Fun & Playful</SelectItem>
                  <SelectItem value="cinematic">Cinematic & Dramatic</SelectItem>
                  <SelectItem value="minimalist">Clean & Minimalist</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button className={`w-full bg-gradient-to-r ${c.gradient} text-white font-semibold py-6 text-base`} onClick={onCreate} disabled={isCreating}>
              {isCreating ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Rachel is creating...</> : <><Wand2 className="w-5 h-5 mr-2" />Create with AI</>}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Try these ideas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {examples.map((ex, i) => (
                <button key={i} onClick={() => setPrompt(ex)} className={`w-full text-left text-sm p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 hover:${c.bg} text-slate-700 dark:text-slate-300 transition-colors border border-transparent hover:${c.border}`}>
                  <span className={`${c.text} mr-1.5`}>→</span>{ex}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-3 space-y-4">
        {isCreating && !result && (
          <Card className={`border-2 ${c.border}`}>
            <CardContent className="py-16 text-center">
              <div className="relative mx-auto w-20 h-20 mb-6">
                <div className={`absolute inset-0 rounded-full border-4 ${c.border}`} />
                <div className={`absolute inset-0 rounded-full border-4 border-t-transparent animate-spin`} style={{ borderColor: `var(--${color}-600)` }} />
                <Wand2 className={`w-8 h-8 ${c.text} absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2`} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Rachel is creating your content...</h3>
              <p className="text-slate-500">Generating visuals, copy, and strategy. About 15-30 seconds.</p>
            </CardContent>
          </Card>
        )}

        {result && (
          <div className="space-y-4">
            {result.imageUrl && (
              <Card className="overflow-hidden">
                <div className="relative group">
                  <img src={result.imageUrl} alt="AI Generated" className="w-full max-h-[500px] object-cover cursor-pointer" onClick={onImageFullscreen} />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="flex gap-2">
                      <Button size="sm" variant="secondary" onClick={onImageFullscreen}><Maximize2 className="w-4 h-4 mr-1" />View</Button>
                      <Button size="sm" variant="secondary" onClick={() => { if (result.imageUrl) { const a = document.createElement('a'); a.href = result.imageUrl; a.download = 'creative.png'; a.target = '_blank'; a.click(); } }}><Download className="w-4 h-4 mr-1" />Download</Button>
                      <Button size="sm" variant="secondary" onClick={() => onRegenerateImage(prompt, style)} disabled={isRegenerating}>
                        {isRegenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <><RefreshCw className="w-4 h-4 mr-1" />New Image</>}
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {result.adCopy && (
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2"><Megaphone className={`w-5 h-5 ${c.text}`} />Copy</CardTitle>
                    <Button size="sm" variant="ghost" onClick={() => onCopy(result.adCopy!, 'Copy')}>
                      {copiedField === 'Copy' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-base text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">{result.adCopy}</p>
                  {result.callToAction && <div className="mt-3"><Badge className={`bg-gradient-to-r ${c.gradient} text-white px-4 py-1.5`}>{result.callToAction}</Badge></div>}
                </CardContent>
              </Card>
            )}

            {result.headlines && result.headlines.length > 0 && (
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base">Headlines</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {result.headlines.map((h, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800 group">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{h}</span>
                        <Button size="sm" variant="ghost" className="opacity-0 group-hover:opacity-100" onClick={() => onCopy(h, `H${i + 1}`)}>
                          {copiedField === `H${i + 1}` ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {result.hashtags && result.hashtags.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Hashtags</CardTitle>
                    <Button size="sm" variant="ghost" onClick={() => onCopy(result.hashtags!.join(' '), 'Tags')}>
                      {copiedField === 'Tags' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {result.hashtags.map((tag, i) => (
                      <Badge key={i} variant="outline" className="text-blue-600 dark:text-blue-400">{tag.startsWith('#') ? tag : `#${tag}`}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {result.videoConcept && (
              <Card className="border-2 border-purple-200 dark:border-purple-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Film className="w-5 h-5 text-purple-600" />Video Storyboard</CardTitle>
                  <div className="flex gap-2 mt-1">
                    <Badge variant="outline">{result.videoConcept.totalDuration}</Badge>
                    <Badge variant="outline">{result.videoConcept.style}</Badge>
                    <Badge variant="outline">Music: {result.videoConcept.music}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {result.videoConcept.scenes?.map((scene, i) => (
                      <div key={i} className="relative pl-8 pb-4 border-l-2 border-purple-200 dark:border-purple-800 last:border-0 last:pb-0">
                        <div className="absolute left-0 -translate-x-1/2 w-6 h-6 rounded-full bg-purple-600 text-white text-xs flex items-center justify-center font-bold">{i + 1}</div>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-slate-800 dark:text-white">Scene {i + 1}</h4>
                            <Badge variant="outline" className="text-xs">{scene.duration}</Badge>
                          </div>
                          <p className="text-sm text-slate-700 dark:text-slate-300"><strong>Visual:</strong> {scene.description}</p>
                          <p className="text-sm text-slate-600 dark:text-slate-400"><strong>Voiceover:</strong> "{scene.voiceover}"</p>
                          <p className="text-sm text-slate-500 italic">{scene.visualNotes}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  {result.videoScript && (
                    <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-sm">Full Script</h4>
                        <Button size="sm" variant="ghost" onClick={() => onCopy(result.videoScript!, 'Script')}>
                          {copiedField === 'Script' ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                        </Button>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap">{result.videoScript}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <Card className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border-slate-200 dark:border-slate-700">
              <CardContent className="pt-5 pb-4">
                <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Download & Share
                </h4>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {result.imageUrl && (
                    <Button size="sm" className="bg-purple-600 hover:bg-purple-700" onClick={() => {
                      const a = document.createElement('a');
                      a.href = result.imageUrl!;
                      a.download = `flyer-${Date.now()}.png`;
                      a.target = '_blank';
                      a.click();
                    }}>
                      <Download className="w-3.5 h-3.5 mr-1.5" />Download Flyer
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => {
                    let content = '';
                    if (result.headlines?.length) content += result.headlines.join('\n') + '\n\n';
                    if (result.adCopy) content += result.adCopy + '\n\n';
                    if (result.callToAction) content += 'CTA: ' + result.callToAction + '\n\n';
                    if (result.videoConcept) {
                      content += 'VIDEO STORYBOARD\n';
                      result.videoConcept.scenes?.forEach((s, i) => {
                        content += `Scene ${i+1} (${s.duration}): ${s.description}\nVO: "${s.voiceover}"\n\n`;
                      });
                    }
                    if (result.hashtags?.length) content += result.hashtags.join(' ') + '\n';
                    const blob = new Blob([content], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `creative-content-${Date.now()}.txt`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}>
                    <FileText className="w-3.5 h-3.5 mr-1.5" />Download Content
                  </Button>
                </div>
                <div className="flex gap-2 mb-3">
                  {['facebook', 'twitter', 'linkedin', 'email'].map(platform => (
                    <Button key={platform} size="sm" variant="outline" className="flex-1 text-xs capitalize" onClick={() => {
                      const text = encodeURIComponent(`${result.headlines?.[0] || ''}\n\n${result.adCopy || ''}\n\n${result.callToAction || ''}`);
                      const shareUrl = encodeURIComponent(window.location.href);
                      const urls: Record<string, string> = {
                        facebook: `https://www.facebook.com/sharer/sharer.php?quote=${text}`,
                        twitter: `https://twitter.com/intent/tweet?text=${text}`,
                        linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`,
                        email: `mailto:?subject=${encodeURIComponent(result.headlines?.[0] || 'Check this out')}&body=${text}`,
                      };
                      window.open(urls[platform], '_blank', 'width=600,height=400');
                    }}>
                      <Send className="w-3 h-3 mr-1" />{platform}
                    </Button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => { setResult(null); setPrompt(''); }} className="flex-1">
                    <RefreshCw className="w-3.5 h-3.5 mr-1.5" />Create Another
                  </Button>
                  <Button size="sm" className={`flex-1 bg-gradient-to-r ${c.gradient}`} onClick={() => {
                    const all = `${result.headlines?.join('\n')}\n\n${result.adCopy}\n\n${result.callToAction}\n\n${result.hashtags?.join(' ')}`;
                    onCopy(all, 'All');
                  }}>
                    <Copy className="w-3.5 h-3.5 mr-1.5" />Copy All
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {!result && !isCreating && (
          <Card className={`${c.bg} ${c.border} border-2`}>
            <CardContent className="py-16 text-center">
              <div className={`w-20 h-20 rounded-full bg-gradient-to-r ${c.gradient} mx-auto mb-6 flex items-center justify-center`}>
                <Wand2 className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-3">Tell Rachel what to create</h3>
              <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto mb-6">
                Describe any video, flyer, ad, or brochure. Be as creative as you want — Rachel has no limits and will create exactly what you envision.
              </p>
              <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto">
                <div className="text-center">
                  <Film className="w-8 h-8 text-purple-500 mx-auto mb-1" />
                  <p className="text-xs text-slate-600 dark:text-slate-400">Videos</p>
                </div>
                <div className="text-center">
                  <ImagePlus className="w-8 h-8 text-pink-500 mx-auto mb-1" />
                  <p className="text-xs text-slate-600 dark:text-slate-400">Images</p>
                </div>
                <div className="text-center">
                  <FileText className="w-8 h-8 text-indigo-500 mx-auto mb-1" />
                  <p className="text-xs text-slate-600 dark:text-slate-400">Documents</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
