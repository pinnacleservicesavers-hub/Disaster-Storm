import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield, ChevronRight, Volume2, VolumeX, Camera, Video,
  Image, Upload, Folder, Lock, Share2, Download, Eye, Heart,
  Film, Wand2, Sparkles, Loader2, Copy, Check, FileText,
  Megaphone, PenTool, Palette, Send, RefreshCw, X, Maximize2,
  Play, Layers, BookOpen, LayoutTemplate, ImagePlus,
  Mic, Radio, Music, Headphones, AudioWaveform, Aperture
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
  const [showCamera, setShowCamera] = useState(false);
  const [cameraMode, setCameraMode] = useState<'photo' | 'video'>('photo');
  const [isRecording, setIsRecording] = useState(false);
  const cameraVideoRef = useRef<HTMLVideoElement>(null);
  const cameraCanvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const recordChunksRef = useRef<Blob[]>([]);

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
        context: { leadName: "contractor", companyName: "your company", trade: "media_documentation" },
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
      voiceMutation.mutate("Give a brief, warm 1-sentence welcome to MediaVault Creative Studio. You're Rachel. This is where they create videos, flyers, ads, brochures, radio ads, voiceovers, and sound design using AI for ANY industry — just describe it. Keep it super short and exciting.");
    }
  }, []);

  useEffect(() => {
    return () => {
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
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
      const res = await apiRequest("/api/ai-ads/freeform-create", "POST", {
        prompt: params.prompt,
        adType: params.adType,
        style: params.style || undefined,
        platform: params.platform || undefined,
        includeImage: true
      });
      return res;
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
      const res = await apiRequest("/api/ai-ads/generate-image-only", "POST", { prompt: params.prompt, style: params.style });
      return res;
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

  const openCamera = async (mode: 'photo' | 'video') => {
    if (!navigator.mediaDevices?.getUserMedia) {
      toast({ title: "Camera not supported", description: "Your browser does not support camera access", variant: "destructive" });
      return;
    }
    if (mode === 'video' && typeof MediaRecorder === 'undefined') {
      toast({ title: "Video recording not supported", description: "Your browser does not support video recording", variant: "destructive" });
      return;
    }
    setCameraMode(mode);
    setShowCamera(true);
    try {
      const constraints = mode === 'video'
        ? { video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: true }
        : { video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } } };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      cameraStreamRef.current = stream;
      if (cameraVideoRef.current) {
        cameraVideoRef.current.srcObject = stream;
        cameraVideoRef.current.play();
      }
    } catch {
      toast({ title: "Camera access denied", description: "Please allow camera access in your browser settings", variant: "destructive" });
      setShowCamera(false);
    }
  };

  const takePhoto = () => {
    if (!cameraVideoRef.current || !cameraCanvasRef.current) return;
    const video = cameraVideoRef.current;
    const canvas = cameraCanvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
      setUploadedFiles(prev => [...prev, file]);
      setPreviewUrls(prev => [...prev, URL.createObjectURL(blob)]);
      toast({ title: "Photo captured!", description: "Saved to your Media Vault" });
    }, 'image/jpeg', 0.92);
  };

  const startVideoRecording = () => {
    if (!cameraStreamRef.current) return;
    recordChunksRef.current = [];
    const recorder = new MediaRecorder(cameraStreamRef.current, { mimeType: 'video/webm' });
    recorder.ondataavailable = (e) => { if (e.data.size > 0) recordChunksRef.current.push(e.data); };
    recorder.onstop = () => {
      const blob = new Blob(recordChunksRef.current, { type: 'video/webm' });
      const file = new File([blob], `video-${Date.now()}.webm`, { type: 'video/webm' });
      setUploadedFiles(prev => [...prev, file]);
      setPreviewUrls(prev => [...prev, URL.createObjectURL(blob)]);
      toast({ title: "Video recorded!", description: "Saved to your Media Vault" });
    };
    recorder.start();
    mediaRecorderRef.current = recorder;
    setIsRecording(true);
  };

  const stopVideoRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const closeCamera = () => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach(track => track.stop());
      cameraStreamRef.current = null;
    }
    if (isRecording) stopVideoRecording();
    setShowCamera(false);
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
              <p className="text-slate-300 text-lg">Store your work, then turn it into videos, ads, flyers, brochures & audio with AI — any industry, zero limits</p>
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
          <TabsList className="grid grid-cols-6 w-full max-w-4xl mb-6">
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
            <TabsTrigger value="sound" className="flex items-center gap-1.5">
              <Mic className="w-4 h-4" />
              Sound Studio
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
              <CardContent className="py-8">
                <div className="text-center">
                  <Upload className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                  <h3 className="text-xl font-semibold mb-2">Upload or Capture Media</h3>
                  <p className="text-slate-500 mb-4">Upload files, or take photos and videos right from your device</p>
                  <input type="file" id="vault-upload" multiple accept="image/*,video/*" onChange={handleFileUpload} className="hidden" />
                  <div className="flex gap-3 justify-center flex-wrap">
                    <label htmlFor="vault-upload">
                      <Button asChild>
                        <span><Upload className="w-4 h-4 mr-2" />Choose Files</span>
                      </Button>
                    </label>
                    <Button variant="outline" onClick={() => openCamera('photo')}>
                      <Camera className="w-4 h-4 mr-2" />Take Photo
                    </Button>
                    <Button variant="outline" onClick={() => openCamera('video')}>
                      <Video className="w-4 h-4 mr-2" />Record Video
                    </Button>
                  </div>
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

          <TabsContent value="sound">
            <SoundStudio playRachelVoice={playRachelVoice} />
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

      <canvas ref={cameraCanvasRef} className="hidden" />

      {showCamera && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
          <div className="flex items-center justify-between p-4 bg-black/80">
            <div className="flex gap-2">
              <Button size="sm" variant={cameraMode === 'photo' ? 'default' : 'ghost'} className={cameraMode === 'photo' ? 'bg-indigo-600' : 'text-white'} onClick={() => setCameraMode('photo')}>
                <Camera className="w-4 h-4 mr-1" />Photo
              </Button>
              <Button size="sm" variant={cameraMode === 'video' ? 'default' : 'ghost'} className={cameraMode === 'video' ? 'bg-red-600' : 'text-white'} onClick={() => setCameraMode('video')}>
                <Video className="w-4 h-4 mr-1" />Video
              </Button>
            </div>
            <Button size="sm" variant="ghost" className="text-white" onClick={closeCamera}>
              <X className="w-5 h-5" />
            </Button>
          </div>
          <div className="flex-1 flex items-center justify-center overflow-hidden">
            <video ref={cameraVideoRef} autoPlay playsInline muted className="max-w-full max-h-full object-contain" />
          </div>
          <div className="flex items-center justify-center gap-4 p-6 bg-black/80">
            {cameraMode === 'photo' ? (
              <button onClick={takePhoto} className="w-16 h-16 rounded-full border-4 border-white bg-white/20 hover:bg-white/40 transition-colors flex items-center justify-center">
                <Aperture className="w-8 h-8 text-white" />
              </button>
            ) : (
              <button onClick={isRecording ? stopVideoRecording : startVideoRecording} className={`w-16 h-16 rounded-full border-4 border-white flex items-center justify-center transition-colors ${isRecording ? 'bg-red-600 animate-pulse' : 'bg-red-500/40 hover:bg-red-500/60'}`}>
                {isRecording ? <div className="w-6 h-6 bg-white rounded-sm" /> : <div className="w-10 h-10 bg-red-500 rounded-full" />}
              </button>
            )}
          </div>
          {previewUrls.length > 0 && (
            <div className="flex gap-2 p-3 bg-black/80 overflow-x-auto">
              {previewUrls.slice(-5).map((url, i) => (
                <div key={i} className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 border border-white/30">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <ModuleAIAssistant
        moduleName="MediaVault Creative Studio"
        moduleContext="MediaVault Creative Studio stores job photos and videos AND lets users create AI-powered content for ANY industry — zero creative limits. Users can upload files or capture photos and videos directly with their camera. The Sound Studio tab lets users generate Hollywood-level audio experiences with a comprehensive music and sound library. Help users create amazing content for any business type."
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
                Describe any video, flyer, ad, or brochure for ANY industry. Rachel has zero creative limits — she'll create exactly what you envision.
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

function SoundStudio({ playRachelVoice }: { playRachelVoice: (msg: string) => void }) {
  const { toast } = useToast();
  const [soundPrompt, setSoundPrompt] = useState('');
  const [soundType, setSoundType] = useState('radio_ad');
  const [voiceStyle, setVoiceStyle] = useState('rachel');
  const [duration, setDuration] = useState('30 seconds');
  const [industry, setIndustry] = useState('');
  const [backgroundMusic, setBackgroundMusic] = useState('');
  const [soundResult, setSoundResult] = useState<any>(null);
  const [voiceAudio, setVoiceAudio] = useState<string | null>(null);
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const voiceAudioRef = useRef<HTMLAudioElement>(null);

  const soundMutation = useMutation({
    mutationFn: async (params: any) => {
      const res = await apiRequest("/api/ai-ads/sound-design", "POST", params);
      return res;
    },
    onSuccess: (data) => {
      if (data.success && data.result) {
        setSoundResult(data.result);
        playRachelVoice("Your sound design is ready! I created a complete audio concept with script, sound effects, music direction, and production notes. Check it out!");
        toast({ title: "Sound Design Ready!", description: "Your AI audio concept is complete." });
      }
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to create sound design", variant: "destructive" });
    }
  });

  const voiceoverMutation = useMutation({
    mutationFn: async (params: { text: string; voiceStyle: string }) => {
      const res = await apiRequest("/api/ai-ads/generate-voiceover", "POST", params);
      return res;
    },
    onSuccess: (data) => {
      if (data.success && data.audioBase64) {
        const audioSrc = `data:audio/mp3;base64,${data.audioBase64}`;
        setVoiceAudio(audioSrc);
        if (voiceAudioRef.current) {
          voiceAudioRef.current.src = audioSrc;
          voiceAudioRef.current.play().catch(() => {});
          setIsPlayingVoice(true);
          voiceAudioRef.current.onended = () => setIsPlayingVoice(false);
        }
        toast({ title: "Voiceover Generated!", description: `Voice: ${data.voice}` });
      }
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to generate voiceover", variant: "destructive" });
    }
  });

  const handleCreate = () => {
    if (!soundPrompt.trim()) {
      toast({ title: "Describe your audio", description: "Tell Rachel what sound experience to create", variant: "destructive" });
      return;
    }
    soundMutation.mutate({ prompt: soundPrompt.trim(), type: soundType, voiceStyle, duration, industry: industry || undefined, backgroundMusic: backgroundMusic || undefined });
  };

  const handleGenerateVoiceover = (text: string) => {
    voiceoverMutation.mutate({ text: text.slice(0, 4096), voiceStyle });
  };

  const downloadScript = () => {
    if (!soundResult) return;
    let content = `SOUND DESIGN: ${soundResult.title || 'Untitled'}\n${'='.repeat(50)}\n\n`;
    if (soundResult.script) content += `SCRIPT\n${'-'.repeat(40)}\n${soundResult.script}\n\n`;
    if (soundResult.voiceDirection) content += `VOICE DIRECTION\n${'-'.repeat(40)}\n${soundResult.voiceDirection}\n\n`;
    if (soundResult.soundEffects?.length) content += `SOUND EFFECTS\n${'-'.repeat(40)}\n${soundResult.soundEffects.map((s: string, i: number) => `${i + 1}. ${s}`).join('\n')}\n\n`;
    if (soundResult.musicDirection) content += `MUSIC DIRECTION\n${'-'.repeat(40)}\n${soundResult.musicDirection}\n\n`;
    if (soundResult.emotionalArc) content += `EMOTIONAL ARC\n${'-'.repeat(40)}\n${soundResult.emotionalArc}\n\n`;
    if (soundResult.productionNotes) content += `PRODUCTION NOTES\n${'-'.repeat(40)}\n${soundResult.productionNotes}\n\n`;
    if (soundResult.audioLayers?.length) {
      content += `AUDIO LAYERS\n${'-'.repeat(40)}\n`;
      soundResult.audioLayers.forEach((l: any) => { content += `[${l.layer}] ${l.description}\n`; });
    }
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sound-design-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Downloaded!", description: "Sound design script saved." });
  };

  const voiceStyles = [
    { value: 'rachel', label: 'Rachel (Natural)', desc: 'Warm, professional, natural' },
    { value: 'calm_authority', label: 'Calm Authority', desc: 'Insurance/corporate tone' },
    { value: 'urgent_dispatcher', label: 'Urgent Dispatcher', desc: 'Emergency energy' },
    { value: 'cinematic_trailer', label: 'Cinematic Trailer', desc: 'Movie trailer epic' },
    { value: 'friendly_neighbor', label: 'Friendly Neighbor', desc: 'Approachable, warm' },
    { value: 'corporate_executive', label: 'Corporate Executive', desc: 'Polished, authoritative' },
    { value: 'high_energy_sales', label: 'High Energy Sales', desc: 'Aggressive, exciting' },
    { value: 'luxury_brand', label: 'Luxury Brand', desc: 'Elegant, refined' },
  ];

  const soundTypes = [
    { value: 'radio_ad', label: 'Radio Ad', icon: <Radio className="w-4 h-4" />, desc: 'Complete radio-ready ad with script, SFX & music' },
    { value: 'voice_ad', label: 'Voice-Over Ad', icon: <Mic className="w-4 h-4" />, desc: 'Professional voiceover with sound direction' },
    { value: 'voice_script', label: 'Voice Script', icon: <FileText className="w-4 h-4" />, desc: 'Script with tone, pause & emphasis markers' },
    { value: 'sound_design', label: 'Sound Design', icon: <Headphones className="w-4 h-4" />, desc: 'Cinematic sound layering & emotional arc' },
    { value: 'brand_audio', label: 'Brand Audio', icon: <Music className="w-4 h-4" />, desc: 'Audio logo, jingles & brand sound identity' },
  ];

  const examples = [
    "Emergency tree removal ad. 30 seconds. Cinematic. Storm hits, tree crashes, silence, then hope. Urgent but reassuring.",
    "Luxury home remodeling radio spot. 60 seconds. Elegant and aspirational. Sound of transformation.",
    "Auto repair shop brand audio identity — tough, reliable, American muscle. Audio logo with engine rev morphing into brand name.",
    "Restaurant grand opening radio ad. Fun, energetic, mouth-watering. Sizzling sounds, crowd excitement, inviting host voice.",
    "Fitness gym high-energy 15-second social media ad. Pumping bass, workout sounds, motivational voice.",
    "Tech startup product launch voice script. Clean, futuristic, innovative. Building anticipation to reveal.",
    "Real estate agent personal brand audio — trustworthy, warm, successful. Audio logo and voicemail greeting.",
    "Roofing company storm response ad. Thunder, rain on damaged roof, then confident voice offering help."
  ];

  return (
    <div className="grid lg:grid-cols-5 gap-6">
      <audio ref={voiceAudioRef} className="hidden" />
      <div className="lg:col-span-2 space-y-4">
        <Card className="border-2 border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Mic className="w-6 h-6 text-amber-600" />
              <span className="text-amber-600">AI Sound Studio</span>
            </CardTitle>
            <p className="text-sm text-slate-500">Create professional voice-overs, radio ads, sound design & brand audio for ANY industry</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={soundPrompt}
              onChange={(e) => setSoundPrompt(e.target.value)}
              placeholder="Describe your audio — any industry, any style, no limits. Example: '30-second emergency plumbing radio ad with urgency and trust'..."
              className="min-h-[100px] resize-none text-base"
            />

            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">Type</label>
              <div className="grid grid-cols-1 gap-1.5">
                {soundTypes.map(st => (
                  <button key={st.value} onClick={() => setSoundType(st.value)}
                    className={`flex items-center gap-2 p-2 rounded-lg text-left text-sm transition-all ${soundType === st.value ? 'bg-amber-100 dark:bg-amber-900/30 border-amber-400 border-2 text-amber-800 dark:text-amber-200' : 'bg-slate-50 dark:bg-slate-800 border border-transparent hover:border-amber-200'}`}>
                    {st.icon}
                    <div>
                      <div className="font-medium">{st.label}</div>
                      <div className="text-xs text-slate-500">{st.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Voice Style</label>
                <Select value={voiceStyle} onValueChange={setVoiceStyle}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {voiceStyles.map(vs => (
                      <SelectItem key={vs.value} value={vs.value}>{vs.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Duration</label>
                <Select value={duration} onValueChange={setDuration}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15 seconds">15 seconds</SelectItem>
                    <SelectItem value="30 seconds">30 seconds</SelectItem>
                    <SelectItem value="60 seconds">60 seconds</SelectItem>
                    <SelectItem value="90 seconds">90 seconds</SelectItem>
                    <SelectItem value="2 minutes">2 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Background Music / Sound</label>
              <Select value={backgroundMusic} onValueChange={setBackgroundMusic}>
                <SelectTrigger><SelectValue placeholder="No background music" /></SelectTrigger>
                <SelectContent className="max-h-[400px]">
                  <SelectItem value="none" className="text-slate-400">No background music</SelectItem>

                  <SelectItem value="_header_classical" disabled className="font-bold text-xs uppercase tracking-wider text-slate-500 bg-slate-50 dark:bg-slate-900">Classical & Orchestral</SelectItem>
                  <SelectItem value="classical">Classical</SelectItem>
                  <SelectItem value="symphony">Symphony</SelectItem>
                  <SelectItem value="chamber">Chamber</SelectItem>
                  <SelectItem value="baroque">Baroque</SelectItem>
                  <SelectItem value="romantic">Romantic</SelectItem>
                  <SelectItem value="opera">Opera</SelectItem>
                  <SelectItem value="cinematic">Cinematic</SelectItem>
                  <SelectItem value="epic-orchestra">Epic Orchestra</SelectItem>
                  <SelectItem value="string-quartet">String Quartet</SelectItem>
                  <SelectItem value="piano-solo">Piano Solo</SelectItem>

                  <SelectItem value="_header_rock" disabled className="font-bold text-xs uppercase tracking-wider text-slate-500 bg-slate-50 dark:bg-slate-900">Rock</SelectItem>
                  <SelectItem value="classic-rock">Classic Rock</SelectItem>
                  <SelectItem value="alternative-rock">Alternative Rock</SelectItem>
                  <SelectItem value="indie-rock">Indie Rock</SelectItem>
                  <SelectItem value="hard-rock">Hard Rock</SelectItem>
                  <SelectItem value="soft-rock">Soft Rock</SelectItem>
                  <SelectItem value="punk-rock">Punk Rock</SelectItem>
                  <SelectItem value="grunge">Grunge</SelectItem>
                  <SelectItem value="progressive-rock">Progressive Rock</SelectItem>
                  <SelectItem value="metal">Metal</SelectItem>
                  <SelectItem value="heavy-metal">Heavy Metal</SelectItem>

                  <SelectItem value="_header_pop" disabled className="font-bold text-xs uppercase tracking-wider text-slate-500 bg-slate-50 dark:bg-slate-900">Pop</SelectItem>
                  <SelectItem value="mainstream-pop">Mainstream Pop</SelectItem>
                  <SelectItem value="dance-pop">Dance Pop</SelectItem>
                  <SelectItem value="synth-pop">Synth Pop</SelectItem>
                  <SelectItem value="electro-pop">Electro Pop</SelectItem>
                  <SelectItem value="acoustic-pop">Acoustic Pop</SelectItem>

                  <SelectItem value="_header_hiphop" disabled className="font-bold text-xs uppercase tracking-wider text-slate-500 bg-slate-50 dark:bg-slate-900">Hip-Hop & R&B</SelectItem>
                  <SelectItem value="hip-hop">Hip-Hop</SelectItem>
                  <SelectItem value="rap">Rap</SelectItem>
                  <SelectItem value="trap">Trap</SelectItem>
                  <SelectItem value="boom-bap">Boom Bap</SelectItem>
                  <SelectItem value="rnb">R&B</SelectItem>
                  <SelectItem value="neo-soul">Neo Soul</SelectItem>
                  <SelectItem value="lofi-hip-hop">Lo-Fi Hip-Hop</SelectItem>

                  <SelectItem value="_header_country" disabled className="font-bold text-xs uppercase tracking-wider text-slate-500 bg-slate-50 dark:bg-slate-900">Country</SelectItem>
                  <SelectItem value="traditional-country">Traditional Country</SelectItem>
                  <SelectItem value="country-pop">Country Pop</SelectItem>
                  <SelectItem value="bluegrass">Bluegrass</SelectItem>
                  <SelectItem value="americana">Americana</SelectItem>
                  <SelectItem value="folk-country">Folk Country</SelectItem>

                  <SelectItem value="_header_jazz" disabled className="font-bold text-xs uppercase tracking-wider text-slate-500 bg-slate-50 dark:bg-slate-900">Jazz & Blues</SelectItem>
                  <SelectItem value="jazz">Jazz</SelectItem>
                  <SelectItem value="smooth-jazz">Smooth Jazz</SelectItem>
                  <SelectItem value="swing">Swing</SelectItem>
                  <SelectItem value="bebop">Bebop</SelectItem>
                  <SelectItem value="blues">Blues</SelectItem>
                  <SelectItem value="soul">Soul</SelectItem>
                  <SelectItem value="funk">Funk</SelectItem>

                  <SelectItem value="_header_world" disabled className="font-bold text-xs uppercase tracking-wider text-slate-500 bg-slate-50 dark:bg-slate-900">World Music</SelectItem>
                  <SelectItem value="latin">Latin</SelectItem>
                  <SelectItem value="reggaeton">Reggaeton</SelectItem>
                  <SelectItem value="salsa">Salsa</SelectItem>
                  <SelectItem value="afrobeat">Afrobeat</SelectItem>
                  <SelectItem value="caribbean">Caribbean</SelectItem>
                  <SelectItem value="celtic">Celtic</SelectItem>
                  <SelectItem value="indian">Indian</SelectItem>
                  <SelectItem value="middle-eastern">Middle Eastern</SelectItem>
                  <SelectItem value="kpop">K-Pop</SelectItem>
                  <SelectItem value="jpop">J-Pop</SelectItem>

                  <SelectItem value="_header_electronic" disabled className="font-bold text-xs uppercase tracking-wider text-slate-500 bg-slate-50 dark:bg-slate-900">Electronic</SelectItem>
                  <SelectItem value="edm">EDM</SelectItem>
                  <SelectItem value="house">House</SelectItem>
                  <SelectItem value="deep-house">Deep House</SelectItem>
                  <SelectItem value="techno">Techno</SelectItem>
                  <SelectItem value="trance">Trance</SelectItem>
                  <SelectItem value="dubstep">Dubstep</SelectItem>
                  <SelectItem value="drum-and-bass">Drum and Bass</SelectItem>
                  <SelectItem value="ambient">Ambient</SelectItem>
                  <SelectItem value="chillout">Chillout</SelectItem>
                  <SelectItem value="synthwave">Synthwave</SelectItem>

                  <SelectItem value="_header_instrumental" disabled className="font-bold text-xs uppercase tracking-wider text-slate-500 bg-slate-50 dark:bg-slate-900">Instrumental</SelectItem>
                  <SelectItem value="acoustic-guitar">Acoustic Guitar</SelectItem>
                  <SelectItem value="piano">Piano</SelectItem>
                  <SelectItem value="instrumental-beats">Instrumental Beats</SelectItem>
                  <SelectItem value="background-instrumental">Background Instrumental</SelectItem>
                  <SelectItem value="meditation-instrumental">Meditation Instrumental</SelectItem>

                  <SelectItem value="_header_mood" disabled className="font-bold text-xs uppercase tracking-wider text-slate-500 bg-slate-50 dark:bg-slate-900">Mood-Based</SelectItem>
                  <SelectItem value="inspiring">Inspiring</SelectItem>
                  <SelectItem value="upbeat">Upbeat</SelectItem>
                  <SelectItem value="corporate">Corporate</SelectItem>
                  <SelectItem value="motivational">Motivational</SelectItem>
                  <SelectItem value="emotional">Emotional</SelectItem>
                  <SelectItem value="dramatic">Dramatic</SelectItem>
                  <SelectItem value="relaxing">Relaxing</SelectItem>
                  <SelectItem value="calm">Calm</SelectItem>
                  <SelectItem value="energetic">Energetic</SelectItem>
                  <SelectItem value="powerful">Powerful</SelectItem>
                  <SelectItem value="suspenseful">Suspenseful</SelectItem>
                  <SelectItem value="romantic-mood">Romantic</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="uplifting">Uplifting</SelectItem>
                  <SelectItem value="hopeful">Hopeful</SelectItem>
                  <SelectItem value="serious">Serious</SelectItem>
                  <SelectItem value="confident">Confident</SelectItem>
                  <SelectItem value="peaceful">Peaceful</SelectItem>
                  <SelectItem value="happy">Happy</SelectItem>
                  <SelectItem value="cinematic-mood">Cinematic Mood</SelectItem>

                  <SelectItem value="_header_nature" disabled className="font-bold text-xs uppercase tracking-wider text-slate-500 bg-slate-50 dark:bg-slate-900">Sound Effects — Nature</SelectItem>
                  <SelectItem value="rain">Rain</SelectItem>
                  <SelectItem value="thunder">Thunder</SelectItem>
                  <SelectItem value="ocean-waves">Ocean Waves</SelectItem>
                  <SelectItem value="wind">Wind</SelectItem>
                  <SelectItem value="forest">Forest</SelectItem>
                  <SelectItem value="birds">Birds</SelectItem>
                  <SelectItem value="fire-crackling">Fire Crackling</SelectItem>
                  <SelectItem value="waterfall">Waterfall</SelectItem>

                  <SelectItem value="_header_city" disabled className="font-bold text-xs uppercase tracking-wider text-slate-500 bg-slate-50 dark:bg-slate-900">Sound Effects — City</SelectItem>
                  <SelectItem value="traffic">Traffic</SelectItem>
                  <SelectItem value="office-ambience">Office Ambience</SelectItem>
                  <SelectItem value="crowd">Crowd</SelectItem>
                  <SelectItem value="construction">Construction</SelectItem>
                  <SelectItem value="airport">Airport</SelectItem>
                  <SelectItem value="cafe">Cafe</SelectItem>
                  <SelectItem value="street-noise">Street Noise</SelectItem>

                  <SelectItem value="_header_ui" disabled className="font-bold text-xs uppercase tracking-wider text-slate-500 bg-slate-50 dark:bg-slate-900">Sound Effects — UI/App</SelectItem>
                  <SelectItem value="click">Click</SelectItem>
                  <SelectItem value="notification">Notification</SelectItem>
                  <SelectItem value="alert">Alert</SelectItem>
                  <SelectItem value="success-sound">Success Sound</SelectItem>
                  <SelectItem value="error-sound">Error Sound</SelectItem>
                  <SelectItem value="whoosh">Whoosh</SelectItem>
                  <SelectItem value="transition">Transition</SelectItem>
                  <SelectItem value="swipe">Swipe</SelectItem>

                  <SelectItem value="_header_emergency" disabled className="font-bold text-xs uppercase tracking-wider text-slate-500 bg-slate-50 dark:bg-slate-900">Sound Effects — Emergency/Disaster</SelectItem>
                  <SelectItem value="sirens">Sirens</SelectItem>
                  <SelectItem value="storm-winds">Storm Winds</SelectItem>
                  <SelectItem value="tornado">Tornado</SelectItem>
                  <SelectItem value="fire-alarm">Fire Alarm</SelectItem>
                  <SelectItem value="earthquake-rumble">Earthquake Rumble</SelectItem>
                  <SelectItem value="flood-water">Flood Water</SelectItem>
                  <SelectItem value="chainsaw">Chainsaw</SelectItem>
                  <SelectItem value="heavy-equipment">Heavy Equipment</SelectItem>

                  <SelectItem value="_header_wellness" disabled className="font-bold text-xs uppercase tracking-wider text-slate-500 bg-slate-50 dark:bg-slate-900">Sound Effects — Wellness</SelectItem>
                  <SelectItem value="white-noise">White Noise</SelectItem>
                  <SelectItem value="brown-noise">Brown Noise</SelectItem>
                  <SelectItem value="pink-noise">Pink Noise</SelectItem>
                  <SelectItem value="binaural-beats">Binaural Beats</SelectItem>
                  <SelectItem value="meditation-bells">Meditation Bells</SelectItem>
                  <SelectItem value="tibetan-bowls">Tibetan Bowls</SelectItem>

                  <SelectItem value="_header_business" disabled className="font-bold text-xs uppercase tracking-wider text-slate-500 bg-slate-50 dark:bg-slate-900">Business/Presentation</SelectItem>
                  <SelectItem value="corporate-inspiring">Corporate Inspiring</SelectItem>
                  <SelectItem value="corporate-minimal">Corporate Minimal</SelectItem>
                  <SelectItem value="documentary">Documentary</SelectItem>
                  <SelectItem value="government-announcement">Government Announcement</SelectItem>
                  <SelectItem value="news-theme">News Theme</SelectItem>
                  <SelectItem value="military-patriotic">Military Patriotic</SelectItem>
                  <SelectItem value="training-video">Training Video</SelectItem>
                  <SelectItem value="presentation-background">Presentation Background</SelectItem>
                  <SelectItem value="tech-innovation">Tech Innovation</SelectItem>
                  <SelectItem value="modern-startup">Modern Startup</SelectItem>

                  <SelectItem value="_header_christmas" disabled className="font-bold text-xs uppercase tracking-wider text-slate-500 bg-slate-50 dark:bg-slate-900">Holiday — Christmas</SelectItem>
                  <SelectItem value="sleigh-bells">Sleigh Bells</SelectItem>
                  <SelectItem value="santa-ho-ho">Santa Ho Ho</SelectItem>
                  <SelectItem value="reindeer-bells">Reindeer Bells</SelectItem>
                  <SelectItem value="fireplace-crackling">Fireplace Crackling</SelectItem>
                  <SelectItem value="choir-singing">Choir Singing</SelectItem>
                  <SelectItem value="church-bells">Church Bells</SelectItem>
                  <SelectItem value="carolers">Carolers</SelectItem>
                  <SelectItem value="christmas-morning">Christmas Morning</SelectItem>
                  <SelectItem value="jingle-instrumentals">Jingle Instrumentals</SelectItem>
                  <SelectItem value="christmas-piano">Christmas Piano</SelectItem>
                  <SelectItem value="orchestral-holiday">Orchestral Holiday</SelectItem>
                  <SelectItem value="handbells">Handbells</SelectItem>

                  <SelectItem value="_header_halloween" disabled className="font-bold text-xs uppercase tracking-wider text-slate-500 bg-slate-50 dark:bg-slate-900">Holiday — Halloween</SelectItem>
                  <SelectItem value="ghost-moan">Ghost Moan</SelectItem>
                  <SelectItem value="witch-cackle">Witch Cackle</SelectItem>
                  <SelectItem value="creaking-door">Creaking Door</SelectItem>
                  <SelectItem value="spooky-footsteps">Spooky Footsteps</SelectItem>
                  <SelectItem value="evil-laugh">Evil Laugh</SelectItem>
                  <SelectItem value="chains-rattling">Chains Rattling</SelectItem>
                  <SelectItem value="monster-growl">Monster Growl</SelectItem>
                  <SelectItem value="kids-trick-or-treating">Kids Trick or Treating</SelectItem>
                  <SelectItem value="owl-hoot">Owl Hoot</SelectItem>

                  <SelectItem value="_header_thanksgiving" disabled className="font-bold text-xs uppercase tracking-wider text-slate-500 bg-slate-50 dark:bg-slate-900">Holiday — Thanksgiving</SelectItem>
                  <SelectItem value="turkey-gobble">Turkey Gobble</SelectItem>
                  <SelectItem value="family-dinner">Family Dinner</SelectItem>
                  <SelectItem value="clinking-silverware">Clinking Silverware</SelectItem>
                  <SelectItem value="fall-leaves">Fall Leaves</SelectItem>
                  <SelectItem value="parade-marching">Parade Marching</SelectItem>
                  <SelectItem value="football-crowd">Football Crowd</SelectItem>

                  <SelectItem value="_header_newyears" disabled className="font-bold text-xs uppercase tracking-wider text-slate-500 bg-slate-50 dark:bg-slate-900">Holiday — New Years</SelectItem>
                  <SelectItem value="countdown">Countdown</SelectItem>
                  <SelectItem value="fireworks">Fireworks</SelectItem>
                  <SelectItem value="champagne-pop">Champagne Pop</SelectItem>
                  <SelectItem value="party-crowd">Party Crowd</SelectItem>
                  <SelectItem value="party-horns">Party Horns</SelectItem>
                  <SelectItem value="confetti-cannon">Confetti Cannon</SelectItem>
                  <SelectItem value="midnight-clock">Midnight Clock</SelectItem>

                  <SelectItem value="_header_valentines" disabled className="font-bold text-xs uppercase tracking-wider text-slate-500 bg-slate-50 dark:bg-slate-900">Holiday — Valentines</SelectItem>
                  <SelectItem value="heartbeat">Heartbeat</SelectItem>
                  <SelectItem value="romantic-piano">Romantic Piano</SelectItem>
                  <SelectItem value="love-chime">Love Chime</SelectItem>
                  <SelectItem value="violin-romance">Violin Romance</SelectItem>

                  <SelectItem value="_header_easter" disabled className="font-bold text-xs uppercase tracking-wider text-slate-500 bg-slate-50 dark:bg-slate-900">Holiday — Easter</SelectItem>
                  <SelectItem value="easter-bells">Easter Bells</SelectItem>
                  <SelectItem value="choir-hymn">Choir Hymn</SelectItem>
                  <SelectItem value="birds-chirping">Birds Chirping</SelectItem>
                  <SelectItem value="spring-breeze-easter">Spring Breeze</SelectItem>
                  <SelectItem value="soft-harp">Soft Harp</SelectItem>

                  <SelectItem value="_header_patriotic" disabled className="font-bold text-xs uppercase tracking-wider text-slate-500 bg-slate-50 dark:bg-slate-900">Holiday — Patriotic</SelectItem>
                  <SelectItem value="patriotic-fireworks">Patriotic Fireworks</SelectItem>
                  <SelectItem value="military-drum">Military Drum</SelectItem>
                  <SelectItem value="trumpet-fanfare">Trumpet Fanfare</SelectItem>
                  <SelectItem value="national-anthem">National Anthem</SelectItem>
                  <SelectItem value="marching-band">Marching Band</SelectItem>
                  <SelectItem value="jet-flyover">Jet Flyover</SelectItem>

                  <SelectItem value="_header_birthday" disabled className="font-bold text-xs uppercase tracking-wider text-slate-500 bg-slate-50 dark:bg-slate-900">Holiday — Birthday</SelectItem>
                  <SelectItem value="happy-birthday-song">Happy Birthday Song</SelectItem>
                  <SelectItem value="party-horn">Party Horn</SelectItem>
                  <SelectItem value="balloon-pop">Balloon Pop</SelectItem>
                  <SelectItem value="applause">Applause</SelectItem>
                  <SelectItem value="kids-cheering">Kids Cheering</SelectItem>

                  <SelectItem value="_header_cultural" disabled className="font-bold text-xs uppercase tracking-wider text-slate-500 bg-slate-50 dark:bg-slate-900">Holiday — Cultural</SelectItem>
                  <SelectItem value="firecrackers">Firecrackers</SelectItem>
                  <SelectItem value="dragon-dance-drums">Dragon Dance Drums</SelectItem>
                  <SelectItem value="gong">Gong</SelectItem>
                  <SelectItem value="dreidel-spin">Dreidel Spin</SelectItem>
                  <SelectItem value="temple-bells">Temple Bells</SelectItem>
                  <SelectItem value="irish-fiddle">Irish Fiddle</SelectItem>
                  <SelectItem value="bagpipes">Bagpipes</SelectItem>

                  <SelectItem value="_header_winter" disabled className="font-bold text-xs uppercase tracking-wider text-slate-500 bg-slate-50 dark:bg-slate-900">Seasonal — Winter</SelectItem>
                  <SelectItem value="snow-crunching">Snow Crunching</SelectItem>
                  <SelectItem value="cold-wind">Cold Wind</SelectItem>
                  <SelectItem value="ice-crackle">Ice Crackle</SelectItem>

                  <SelectItem value="_header_spring" disabled className="font-bold text-xs uppercase tracking-wider text-slate-500 bg-slate-50 dark:bg-slate-900">Seasonal — Spring</SelectItem>
                  <SelectItem value="spring-birds">Spring Birds</SelectItem>
                  <SelectItem value="rain-shower">Rain Shower</SelectItem>
                  <SelectItem value="spring-breeze">Spring Breeze</SelectItem>

                  <SelectItem value="_header_summer" disabled className="font-bold text-xs uppercase tracking-wider text-slate-500 bg-slate-50 dark:bg-slate-900">Seasonal — Summer</SelectItem>
                  <SelectItem value="bbq-sizzle">BBQ Sizzle</SelectItem>
                  <SelectItem value="pool-splash">Pool Splash</SelectItem>
                  <SelectItem value="beach-waves">Beach Waves</SelectItem>

                  <SelectItem value="_header_fall" disabled className="font-bold text-xs uppercase tracking-wider text-slate-500 bg-slate-50 dark:bg-slate-900">Seasonal — Fall</SelectItem>
                  <SelectItem value="leaves-crunch">Leaves Crunch</SelectItem>
                  <SelectItem value="harvest-festival">Harvest Festival</SelectItem>
                  <SelectItem value="corn-maze">Corn Maze</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Industry (optional)</label>
              <Select value={industry} onValueChange={setIndustry}>
                <SelectTrigger><SelectValue placeholder="Any industry" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any Industry</SelectItem>
                  <SelectItem value="contractors">Contractors & Home Services</SelectItem>
                  <SelectItem value="restaurant">Restaurant & Food</SelectItem>
                  <SelectItem value="automotive">Automotive</SelectItem>
                  <SelectItem value="realestate">Real Estate</SelectItem>
                  <SelectItem value="fitness">Fitness & Wellness</SelectItem>
                  <SelectItem value="tech">Technology</SelectItem>
                  <SelectItem value="healthcare">Healthcare</SelectItem>
                  <SelectItem value="retail">Retail & E-commerce</SelectItem>
                  <SelectItem value="legal">Legal & Professional</SelectItem>
                  <SelectItem value="entertainment">Entertainment</SelectItem>
                  <SelectItem value="education">Education</SelectItem>
                  <SelectItem value="finance">Finance & Insurance</SelectItem>
                  <SelectItem value="beauty">Beauty & Fashion</SelectItem>
                  <SelectItem value="travel">Travel & Hospitality</SelectItem>
                  <SelectItem value="nonprofit">Non-profit</SelectItem>
                  <SelectItem value="manufacturing">Manufacturing</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button className="w-full bg-gradient-to-r from-amber-600 to-orange-600 text-white font-semibold py-6 text-base" onClick={handleCreate} disabled={soundMutation.isPending}>
              {soundMutation.isPending ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Rachel is composing...</> : <><Wand2 className="w-5 h-5 mr-2" />Create Sound Design</>}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Try these ideas — any industry</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {examples.map((ex, i) => (
                <button key={i} onClick={() => setSoundPrompt(ex)} className="w-full text-left text-sm p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-amber-950/20 text-slate-700 dark:text-slate-300 transition-colors border border-transparent hover:border-amber-200 dark:hover:border-amber-800">
                  <span className="text-amber-600 mr-1.5">→</span>{ex}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-200 dark:border-amber-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><Volume2 className="w-4 h-4 text-amber-600" />Voice Styles Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {voiceStyles.map(vs => (
                <div key={vs.value} className={`p-2 rounded-lg text-xs cursor-pointer transition-all ${voiceStyle === vs.value ? 'bg-amber-200 dark:bg-amber-800 ring-2 ring-amber-400' : 'bg-white dark:bg-slate-800 hover:bg-amber-100 dark:hover:bg-amber-900/20'}`} onClick={() => setVoiceStyle(vs.value)}>
                  <div className="font-semibold">{vs.label}</div>
                  <div className="text-slate-500">{vs.desc}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-3 space-y-4">
        {soundMutation.isPending && !soundResult && (
          <Card className="border-2 border-amber-200 dark:border-amber-800">
            <CardContent className="py-16 text-center">
              <div className="relative mx-auto w-20 h-20 mb-6">
                <div className="absolute inset-0 rounded-full border-4 border-amber-200 dark:border-amber-800" />
                <div className="absolute inset-0 rounded-full border-4 border-t-transparent border-amber-500 animate-spin" />
                <Mic className="w-8 h-8 text-amber-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Rachel is composing your audio...</h3>
              <p className="text-slate-500">Creating script, sound design, voice direction & production notes. About 15-30 seconds.</p>
            </CardContent>
          </Card>
        )}

        {soundResult && (
          <div className="space-y-4">
            <Card className="border-2 border-amber-200 dark:border-amber-800 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <AudioWaveform className="w-5 h-5 text-amber-600" />
                    {soundResult.title || 'Sound Design'}
                  </CardTitle>
                  <div className="flex gap-2">
                    {soundResult.duration && <Badge variant="outline">{soundResult.duration}</Badge>}
                    <Badge className="bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300">{soundTypes.find(s => s.value === soundType)?.label}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 mb-4">
                  <Button size="sm" className="bg-amber-600 hover:bg-amber-700" onClick={downloadScript}>
                    <Download className="w-4 h-4 mr-1.5" />Download Script
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => {
                    navigator.clipboard.writeText(soundResult.script || '');
                    toast({ title: "Script copied!" });
                  }}>
                    <Copy className="w-4 h-4 mr-1.5" />Copy Script
                  </Button>
                  {soundResult.script && (
                    <Button size="sm" variant="outline" onClick={() => handleGenerateVoiceover(soundResult.script)} disabled={voiceoverMutation.isPending}>
                      {voiceoverMutation.isPending ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Play className="w-4 h-4 mr-1.5" />}
                      {voiceoverMutation.isPending ? 'Generating...' : 'Generate Voiceover'}
                    </Button>
                  )}
                </div>

                {voiceAudio && (
                  <div className="p-3 rounded-lg bg-amber-100 dark:bg-amber-900/30 mb-4 flex items-center gap-3">
                    <Button size="sm" variant="ghost" onClick={() => {
                      if (voiceAudioRef.current) {
                        if (isPlayingVoice) { voiceAudioRef.current.pause(); setIsPlayingVoice(false); }
                        else { voiceAudioRef.current.play(); setIsPlayingVoice(true); voiceAudioRef.current.onended = () => setIsPlayingVoice(false); }
                      }
                    }}>
                      {isPlayingVoice ? <VolumeX className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                    </Button>
                    <div className="flex-1">
                      <p className="text-sm font-medium">AI Voiceover Ready</p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Voice: {voiceStyles.find(v => v.value === voiceStyle)?.label}</p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => {
                      const a = document.createElement('a');
                      a.href = voiceAudio;
                      a.download = `voiceover-${Date.now()}.mp3`;
                      a.click();
                      toast({ title: "Voiceover downloaded!" });
                    }}>
                      <Download className="w-4 h-4 mr-1" />Download MP3
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {soundResult.script && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base"><FileText className="w-5 h-5 text-amber-600" />Script</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 font-mono text-sm whitespace-pre-wrap leading-relaxed">
                    {soundResult.script}
                  </div>
                </CardContent>
              </Card>
            )}

            {soundResult.voiceDirection && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base"><Mic className="w-5 h-5 text-blue-600" />Voice Direction</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{soundResult.voiceDirection}</p>
                </CardContent>
              </Card>
            )}

            {soundResult.soundEffects?.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base"><Headphones className="w-5 h-5 text-purple-600" />Sound Effects</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {soundResult.soundEffects.map((sfx: string, i: number) => (
                      <div key={i} className="flex items-start gap-2 p-2 rounded bg-slate-50 dark:bg-slate-800">
                        <Badge variant="outline" className="text-xs mt-0.5">{i + 1}</Badge>
                        <span className="text-sm text-slate-700 dark:text-slate-300">{sfx}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {soundResult.musicDirection && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base"><Music className="w-5 h-5 text-green-600" />Music Direction</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{soundResult.musicDirection}</p>
                </CardContent>
              </Card>
            )}

            {soundResult.emotionalArc && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base"><Heart className="w-5 h-5 text-red-500" />Emotional Arc</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{soundResult.emotionalArc}</p>
                </CardContent>
              </Card>
            )}

            {soundResult.audioLayers?.length > 0 && (
              <Card className="border-2 border-amber-200 dark:border-amber-800">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base"><Layers className="w-5 h-5 text-amber-600" />Audio Layers</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {soundResult.audioLayers.map((layer: any, i: number) => (
                      <div key={i} className="p-3 rounded-lg bg-gradient-to-r from-slate-50 to-amber-50 dark:from-slate-800 dark:to-amber-950/20 border border-amber-100 dark:border-amber-900">
                        <div className="font-semibold text-amber-700 dark:text-amber-300 text-sm mb-1">{layer.layer}</div>
                        <p className="text-sm text-slate-600 dark:text-slate-400">{layer.description}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {soundResult.productionNotes && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base"><Wand2 className="w-5 h-5 text-indigo-600" />Production Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{soundResult.productionNotes}</p>
                </CardContent>
              </Card>
            )}

            <Card className="bg-gradient-to-r from-slate-50 to-amber-50 dark:from-slate-800 dark:to-amber-950/20">
              <CardContent className="pt-5 pb-4">
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => { setSoundResult(null); setSoundPrompt(''); setVoiceAudio(null); }}>
                    <RefreshCw className="w-4 h-4 mr-1.5" />Create Another
                  </Button>
                  <Button className="flex-1 bg-gradient-to-r from-amber-600 to-orange-600" onClick={() => {
                    const all = `${soundResult.title}\n\n${soundResult.script}\n\nVoice: ${soundResult.voiceDirection}\n\nMusic: ${soundResult.musicDirection}`;
                    navigator.clipboard.writeText(all);
                    toast({ title: "Copied!" });
                  }}>
                    <Copy className="w-4 h-4 mr-1.5" />Copy All
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {!soundResult && !soundMutation.isPending && (
          <Card className="bg-amber-50 dark:bg-amber-950/20 border-2 border-amber-200 dark:border-amber-800">
            <CardContent className="py-16 text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-r from-amber-600 to-orange-600 mx-auto mb-6 flex items-center justify-center">
                <Mic className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-3">AI Sound Studio</h3>
              <p className="text-slate-600 dark:text-slate-400 max-w-lg mx-auto mb-6">
                Create Hollywood-level audio experiences for ANY industry. Radio ads, voiceovers, sound design, brand audio identity — just describe it and Rachel builds the complete audio concept.
              </p>
              <div className="grid grid-cols-5 gap-3 max-w-md mx-auto">
                <div className="text-center">
                  <Radio className="w-7 h-7 text-amber-500 mx-auto mb-1" />
                  <p className="text-xs text-slate-600 dark:text-slate-400">Radio Ads</p>
                </div>
                <div className="text-center">
                  <Mic className="w-7 h-7 text-blue-500 mx-auto mb-1" />
                  <p className="text-xs text-slate-600 dark:text-slate-400">Voiceover</p>
                </div>
                <div className="text-center">
                  <Headphones className="w-7 h-7 text-purple-500 mx-auto mb-1" />
                  <p className="text-xs text-slate-600 dark:text-slate-400">Sound FX</p>
                </div>
                <div className="text-center">
                  <Music className="w-7 h-7 text-green-500 mx-auto mb-1" />
                  <p className="text-xs text-slate-600 dark:text-slate-400">Brand Audio</p>
                </div>
                <div className="text-center">
                  <FileText className="w-7 h-7 text-indigo-500 mx-auto mb-1" />
                  <p className="text-xs text-slate-600 dark:text-slate-400">Scripts</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
