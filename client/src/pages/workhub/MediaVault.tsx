import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield, ChevronRight, Volume2, VolumeX, Camera, Video,
  Image, Upload, Folder, Lock, Share2, Download, Eye, Heart,
  Film, Wand2, Sparkles, Loader2, Copy, Check, FileText,
  Megaphone, PenTool, Palette, Send, RefreshCw, X, Maximize2,
  Play, Layers, BookOpen, LayoutTemplate, ImagePlus,
  Mic, Radio, Music, Headphones, AudioWaveform, Aperture, Pencil, MessageSquare
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
import ModuleVoiceGuide from '@/components/ModuleVoiceGuide';
import VideoAdPlayer from '@/components/VideoAdPlayer';

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

  const [isLoadingVoice, setIsLoadingVoice] = useState(false);

  const mediaVaultGuideScript = "Welcome to MediaVault Creative Studio, your all-in-one media powerhouse. This is where you store, organize, and protect all your job site photos and videos in one secure place. The Upload Center lets you drag and drop files, or capture photos and video directly from your camera. In the AI Video tab, just describe any video concept and AI creates a full storyboard with scenes, voiceover scripts, music suggestions, and visual direction. Flyers and Ads generates professional promotional materials instantly — describe what you want and AI creates the design with images and copy. The Brochures tab creates full multi-page campaigns with cover panels, service listings, testimonials, and contact info. Sound Studio handles radio ads, voiceovers, and audio content. And the Campaigns tab ties everything together for coordinated marketing across all your platforms. This is your creative team in a box — just describe what you need and I'll build it for you! I'm Rachel, and I'm here to help.";

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
  };

  const speakWithTTS = async (text: string) => {
    if (!voiceEnabledRef.current) return;
    stopAudio();
    setIsLoadingVoice(true);
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      if (!res.ok) throw new Error('TTS failed');
      const data = await res.json();
      if (data.audioBase64 && audioRef.current) {
        const audioSrc = `data:audio/${data.format || 'mp3'};base64,${data.audioBase64}`;
        audioRef.current.src = audioSrc;
        audioRef.current.onended = () => setIsPlaying(false);
        setIsPlaying(true);
        setIsLoadingVoice(false);
        await audioRef.current.play().catch(() => setIsPlaying(false));
      } else {
        setIsLoadingVoice(false);
      }
    } catch (err) {
      console.error('Voice guide error:', err);
      setIsLoadingVoice(false);
      setIsPlaying(false);
    }
  };

  useEffect(() => {
    if (!hasPlayedWelcome.current && voiceEnabledRef.current) {
      hasPlayedWelcome.current = true;
      setTimeout(() => speakWithTTS(mediaVaultGuideScript), 800);
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
    if (voiceEnabledRef.current) speakWithTTS(message);
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

  const handleRevise = (revisedPrompt: string) => {
    setCreativePrompt(revisedPrompt);
    createMutation.mutate({ prompt: revisedPrompt.trim(), adType: creativeType, style: creativeStyle, platform: creativePlatform });
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
              <p className="text-slate-300 text-lg">Store your work, then turn it into videos, ads, flyers, brochures & audio with AI</p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsVoiceEnabled(true);
                  voiceEnabledRef.current = true;
                  speakWithTTS(mediaVaultGuideScript);
                }}
                disabled={isLoadingVoice}
                className="border-white/30 text-white hover:bg-white/10"
              >
                {isLoadingVoice ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : isPlaying ? (
                  <Volume2 className="w-4 h-4 mr-2 animate-pulse" />
                ) : (
                  <Headphones className="w-4 h-4 mr-2" />
                )}
                {isLoadingVoice ? 'Loading...' : isPlaying ? 'Playing...' : 'Voice Guide'}
              </Button>
              <Button variant="ghost" size="lg" onClick={toggleVoice} className="text-white hover:bg-white/10">
                {isPlaying ? <Volume2 className="w-6 h-6 animate-pulse" /> : isVoiceEnabled ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <AutonomousAgentBadge moduleName="MediaVault" />
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex flex-wrap gap-1 w-full max-w-6xl mb-6">
            <TabsTrigger value="vault" className="flex items-center gap-1.5">
              <Folder className="w-4 h-4" />
              Media Vault
            </TabsTrigger>
            <TabsTrigger value="uploads" className="flex items-center gap-1.5">
              <Upload className="w-4 h-4" />
              Upload Center
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-1.5">
              <Palette className="w-4 h-4" />
              Templates
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
            <TabsTrigger value="campaigns" className="flex items-center gap-1.5">
              <Megaphone className="w-4 h-4" />
              Campaigns
            </TabsTrigger>
            <TabsTrigger value="sound" className="flex items-center gap-1.5">
              <Mic className="w-4 h-4" />
              Sound Studio
            </TabsTrigger>
            <TabsTrigger value="tools" className="flex items-center gap-1.5">
              <Wand2 className="w-4 h-4" />
              Tools & Export
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

          <TabsContent value="uploads">
            <UploadCenter uploadedFiles={uploadedFiles} previewUrls={previewUrls} onUpload={handleFileUpload} onRemove={removeFile} onOpenCamera={openCamera} />
          </TabsContent>

          <TabsContent value="templates">
            <TemplatesLibrary onSelectTemplate={(prompt: string) => { setCreativePrompt(prompt); setActiveTab('flyers'); }} />
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
              onRevise={handleRevise}
              onRegenerateImage={(p, s) => generateImageMutation.mutate({ prompt: p, style: s })}
              isRegenerating={generateImageMutation.isPending}
              copiedField={copiedField}
              onCopy={copyToClipboard}
              onImageFullscreen={() => setImageFullscreen(true)}
              examples={[
                "Create a 30-second cinematic video ad for a storm damage restoration company — opening aerial drone shot of devastated neighborhood, cut to crew arriving at dawn, time-lapse restoration montage, emotional homeowner reveal, fade to logo with soaring music",
                "Make a TikTok-style satisfying transformation video for a pressure washing company — POV angle, dramatic split-screen dirty vs clean, ASMR water sounds, trendy audio, text overlays with pricing, 'Link in bio' ending",
                "Design a YouTube pre-roll ad for emergency tree removal — 5-second hook with crashing tree sound, fast-cut emergency response footage, customer testimonial soundbite, '$200 OFF' flash, phone number and website",
                "Create a Facebook video ad for a roofing company — drone footage of crew working on roof at golden hour, owner-to-camera testimonial, insurance claim success story, before/after split screen, free inspection CTA",
                "Make a viral Instagram Reel for a painting company — time-lapse room transformation set to trending audio, color palette reveal, designer commentary voiceover, 'Save this for your next project' hook",
                "Design a 60-second brand story video for a family-owned construction company — founder narrates over vintage photos, modern crew footage, community projects, emotional music, 'Three generations of trust' tagline",
                "Create a product demo video for a smart home installer — POV walkthrough of automated home, voice control demos, app interface closeups, pricing packages, 'Schedule your smart home consultation' CTA"
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
              onRevise={handleRevise}
              onRegenerateImage={(p, s) => generateImageMutation.mutate({ prompt: p, style: s })}
              isRegenerating={generateImageMutation.isPending}
              copiedField={copiedField}
              onCopy={copyToClipboard}
              onImageFullscreen={() => setImageFullscreen(true)}
              examples={[
                "Design a premium door hanger flyer for a roofing company — free storm damage inspections, before/after photos, insurance claim help, BBB accredited badge, phone number in 3 places, QR code to reviews, limited time offer urgency",
                "Create a scroll-stopping Facebook ad for a tree removal company — dramatic fallen tree image, '$200 OFF emergency removal this week only', 5-star review quote, licensed & insured badge, 'Get Free Estimate' CTA button",
                "Make a luxury Instagram carousel post for a painting contractor — 5 slides: dramatic room reveal, color palette showcase, process shots, client testimonial, booking CTA with spring discount code",
                "Design a professional yard sign for emergency board-up services — bold red/white/black, readable from 100 feet, '24/7 EMERGENCY' header, phone number massive, QR code, 'Licensed Bonded Insured' footer",
                "Create a direct mail postcard for a general contractor — storm damage alert header, satellite image of neighborhood, free inspection offer, 3 service photos, financing available badge, response deadline",
                "Design a Google Display ad set for an HVAC company — $49 tune-up special, 'Before Your AC Dies This Summer' hook, energy savings calculator teaser, same-day service badge",
                "Create a TikTok-style vertical ad for a pressure washing company — dramatic split-screen dirty vs clean, satisfying transformation, '$99 driveway special' overlay, 'Book Now' swipe-up CTA"
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
              onRevise={handleRevise}
              onRegenerateImage={(p, s) => generateImageMutation.mutate({ prompt: p, style: s })}
              isRegenerating={generateImageMutation.isPending}
              copiedField={copiedField}
              onCopy={copyToClipboard}
              onImageFullscreen={() => setImageFullscreen(true)}
              examples={[
                "Create a luxury tri-fold brochure for a full-service home restoration company — cover panel with stunning hero image, inside panels listing all services with icons, testimonials section with 5-star reviews, financing options, before/after gallery, QR code to portfolio, contact info with map",
                "Design a premium service menu brochure for a landscaping empire — tree removal, trimming, stump grinding, lawn care, hardscaping, irrigation, seasonal maintenance packages with Bronze/Silver/Gold/Platinum pricing tiers, team photo, certifications",
                "Create a corporate capabilities brochure for a general contractor targeting insurance adjusters and property managers — IICRC certifications, response time guarantees, past project case studies with dollar values, fleet photos, service area map, 24/7 dispatch number",
                "Design a stunning real estate listing brochure — full-page property photos, floor plan layout, neighborhood highlights, school ratings, comparable sales data, agent bio with headshot, virtual tour QR code, open house schedule",
                "Create a medical practice welcome brochure — warm provider photos and bios, services offered, insurance accepted list, patient testimonials, facility tour photos, new patient checklist, portal signup instructions, emergency protocol",
                "Design a restaurant grand opening brochure — mouth-watering food photography descriptions, chef bio, menu highlights with pricing, happy hour specials, private event booking, loyalty program, location map, social media handles",
                "Create a political campaign brochure — candidate photo and bio, key platform positions, endorsements, community involvement history, voting record highlights, volunteer signup, donation tiers, event calendar"
              ]}
              color="indigo"
            />
          </TabsContent>

          <TabsContent value="campaigns">
            <CampaignBuilder />
          </TabsContent>

          <TabsContent value="sound">
            <SoundStudio playRachelVoice={playRachelVoice} />
          </TabsContent>

          <TabsContent value="tools">
            <ToolsAndExport createdItems={createdItems} />
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

function AICreativeStudio({ title, subtitle, icon, defaultType, prompt, setPrompt, style, setStyle, platform, setPlatform, creativeType, setCreativeType, result, setResult, isCreating, onCreate, onRevise, onRegenerateImage, isRegenerating, copiedField, onCopy, onImageFullscreen, examples, color }: {
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
  onRevise: (revisedPrompt: string) => void;
  onRegenerateImage: (prompt: string, style: string) => void;
  isRegenerating: boolean;
  copiedField: string | null;
  onCopy: (text: string, field: string) => void;
  onImageFullscreen: () => void;
  examples: string[];
  color: string;
}) {
  const { toast } = useToast();
  const [revisionMode, setRevisionMode] = useState(false);
  const [revisionText, setRevisionText] = useState('');
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
                    <Button size="sm" variant="secondary" onClick={onImageFullscreen}><Maximize2 className="w-4 h-4 mr-1" />View Full Size</Button>
                  </div>
                </div>
                <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/30 dark:to-indigo-900/30 border-t space-y-3">
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Download for Printing</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white font-semibold" onClick={async () => {
                      try {
                        const { jsPDF } = await import('jspdf');
                        const response = await fetch(result.imageUrl!);
                        const blob = await response.blob();
                        const imgUrl = URL.createObjectURL(blob);
                        const img = new window.Image();
                        img.crossOrigin = 'anonymous';
                        img.onload = () => {
                          const pdf = new jsPDF({ orientation: 'landscape', unit: 'in', format: 'letter' });
                          const pageW = 11;
                          const pageH = 8.5;
                          const margin = 0.25;
                          const printW = pageW - margin * 2;
                          const printH = pageH - margin * 2;
                          const imgRatio = img.width / img.height;
                          const printRatio = printW / printH;
                          let drawW: number, drawH: number, drawX: number, drawY: number;
                          if (imgRatio > printRatio) {
                            drawW = printW;
                            drawH = printW / imgRatio;
                            drawX = margin;
                            drawY = margin + (printH - drawH) / 2;
                          } else {
                            drawH = printH;
                            drawW = printH * imgRatio;
                            drawX = margin + (printW - drawW) / 2;
                            drawY = margin;
                          }
                          pdf.addImage(imgUrl, 'PNG', drawX, drawY, drawW, drawH);
                          pdf.save(`brochure-print-ready-${Date.now()}.pdf`);
                          URL.revokeObjectURL(imgUrl);
                          toast({ title: "PDF Ready!", description: "Print-ready PDF saved. Open it and select 'Actual Size' in your printer settings for best results." });
                        };
                        img.src = imgUrl;
                      } catch {
                        toast({ title: "Error", description: "Could not create PDF. Try the image download instead.", variant: "destructive" });
                      }
                    }}>
                      <FileText className="w-4 h-4 mr-2" />Download Print-Ready PDF (Letter)
                    </Button>
                    <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white" onClick={async () => {
                      try {
                        const { jsPDF } = await import('jspdf');
                        const response = await fetch(result.imageUrl!);
                        const blob = await response.blob();
                        const imgUrl = URL.createObjectURL(blob);
                        const img = new window.Image();
                        img.crossOrigin = 'anonymous';
                        img.onload = () => {
                          const pdf = new jsPDF({ orientation: 'landscape', unit: 'in', format: [14, 8.5] });
                          const pageW = 14;
                          const pageH = 8.5;
                          const margin = 0.25;
                          const printW = pageW - margin * 2;
                          const printH = pageH - margin * 2;
                          const imgRatio = img.width / img.height;
                          const printRatio = printW / printH;
                          let drawW: number, drawH: number, drawX: number, drawY: number;
                          if (imgRatio > printRatio) {
                            drawW = printW;
                            drawH = printW / imgRatio;
                            drawX = margin;
                            drawY = margin + (printH - drawH) / 2;
                          } else {
                            drawH = printH;
                            drawW = printH * imgRatio;
                            drawX = margin + (printW - drawW) / 2;
                            drawY = margin;
                          }
                          pdf.addImage(imgUrl, 'PNG', drawX, drawY, drawW, drawH);
                          pdf.save(`brochure-trifold-${Date.now()}.pdf`);
                          URL.revokeObjectURL(imgUrl);
                          toast({ title: "Tri-Fold PDF Ready!", description: "PDF sized for 8.5x14 Legal paper tri-fold brochures. Print on both sides for professional results." });
                        };
                        img.src = imgUrl;
                      } catch {
                        toast({ title: "Error", description: "Could not create PDF. Try the image download instead.", variant: "destructive" });
                      }
                    }}>
                      <FileText className="w-4 h-4 mr-2" />Download Tri-Fold PDF (Legal)
                    </Button>
                    <Button size="sm" variant="outline" onClick={async () => {
                      try {
                        const response = await fetch(result.imageUrl!);
                        const blob = await response.blob();
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `brochure-image-${Date.now()}.png`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                        toast({ title: "Image Downloaded!", description: "PNG image saved to your downloads." });
                      } catch {
                        const a = document.createElement('a');
                        a.href = result.imageUrl!;
                        a.download = `brochure-image-${Date.now()}.png`;
                        a.click();
                      }
                    }}>
                      <Download className="w-4 h-4 mr-1" />PNG Image
                    </Button>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => onRegenerateImage(prompt, style)} disabled={isRegenerating}>
                      {isRegenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <><RefreshCw className="w-4 h-4 mr-1" />Generate New Image</>}
                    </Button>
                    <Button size="sm" variant="outline" onClick={onImageFullscreen}>
                      <Maximize2 className="w-4 h-4 mr-1" />Full Size
                    </Button>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Tip: For best print quality, use "Actual Size" or "Fit to Page" in your printer settings. Use glossy paper for professional results.</p>
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

            {result.videoConcept && result.imageUrl && (
              <VideoAdPlayer
                imageUrl={result.imageUrl}
                videoConcept={result.videoConcept}
                videoScript={result.videoScript}
                headline={result.headlines?.[0]}
                callToAction={result.callToAction}
              />
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

            <Card className={`border-2 ${revisionMode ? c.border : 'border-amber-200 dark:border-amber-800'}`}>
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    <Pencil className="w-4 h-4 text-amber-600" />
                    Edit & Revise
                  </h4>
                  {!revisionMode && (
                    <Button size="sm" variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-400 dark:hover:bg-amber-950/30" onClick={() => setRevisionMode(true)}>
                      <MessageSquare className="w-3.5 h-3.5 mr-1.5" />Request Changes
                    </Button>
                  )}
                </div>
                {!revisionMode ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400">Not quite right? Click "Request Changes" to tell Rachel what to adjust — copy, headlines, style, image, or anything else.</p>
                ) : (
                  <div className="space-y-3">
                    <Textarea
                      value={revisionText}
                      onChange={(e) => setRevisionText(e.target.value)}
                      placeholder="Tell Rachel what to change... Examples:&#10;• Make the headline more urgent&#10;• Change the color scheme to blue and white&#10;• Add a financing offer section&#10;• Make it more professional and less casual&#10;• Regenerate the image with a different angle"
                      className="min-h-[100px] resize-none text-sm border-amber-200 dark:border-amber-800 focus:border-amber-400"
                    />
                    <div className="flex gap-2">
                      <Button
                        className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-semibold"
                        disabled={!revisionText.trim() || isCreating}
                        onClick={() => {
                          const revisedPrompt = `REVISION REQUEST: Take the previous result and apply these changes: ${revisionText.trim()}\n\nOriginal prompt: ${prompt}`;
                          setRevisionMode(false);
                          setRevisionText('');
                          onRevise(revisedPrompt);
                        }}
                      >
                        {isCreating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Revising...</> : <><Wand2 className="w-4 h-4 mr-2" />Apply Changes</>}
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => { setRevisionMode(false); setRevisionText(''); }}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border-slate-200 dark:border-slate-700">
              <CardContent className="pt-5 pb-4">
                <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Download & Share
                </h4>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {result.imageUrl && (
                    <Button size="sm" className="bg-purple-600 hover:bg-purple-700" onClick={async () => {
                      try {
                        const response = await fetch(result.imageUrl!);
                        const blob = await response.blob();
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `flyer-${Date.now()}.png`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                        toast({ title: "Downloaded!", description: "Image saved to your downloads folder." });
                      } catch {
                        const a = document.createElement('a');
                        a.href = result.imageUrl!;
                        a.download = `flyer-${Date.now()}.png`;
                        a.click();
                      }
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

                  <SelectItem value="_header_sports" disabled className="font-bold text-xs uppercase tracking-wider text-slate-500 bg-slate-50 dark:bg-slate-900">Sports</SelectItem>
                  <SelectItem value="stadium-crowd">Stadium Crowd</SelectItem>
                  <SelectItem value="buzzer-beater">Buzzer Beater</SelectItem>
                  <SelectItem value="referee-whistle">Referee Whistle</SelectItem>
                  <SelectItem value="basketball-dribble">Basketball Dribble</SelectItem>
                  <SelectItem value="baseball-bat-crack">Baseball Bat Crack</SelectItem>
                  <SelectItem value="football-tackle">Football Tackle</SelectItem>
                  <SelectItem value="soccer-goal">Soccer Goal Celebration</SelectItem>
                  <SelectItem value="boxing-bell">Boxing Bell</SelectItem>
                  <SelectItem value="race-countdown">Race Countdown</SelectItem>
                  <SelectItem value="victory-horn">Victory Horn</SelectItem>
                  <SelectItem value="sports-anthem">Sports Anthem</SelectItem>
                  <SelectItem value="gym-workout">Gym Workout Beats</SelectItem>

                  <SelectItem value="_header_motor" disabled className="font-bold text-xs uppercase tracking-wider text-slate-500 bg-slate-50 dark:bg-slate-900">Motor & Motorcycle</SelectItem>
                  <SelectItem value="engine-rev">Engine Rev</SelectItem>
                  <SelectItem value="motorcycle-rumble">Motorcycle Rumble</SelectItem>
                  <SelectItem value="harley-idle">Harley Davidson Idle</SelectItem>
                  <SelectItem value="sportbike-flyby">Sportbike Flyby</SelectItem>
                  <SelectItem value="muscle-car-rev">Muscle Car Rev</SelectItem>
                  <SelectItem value="drag-race-launch">Drag Race Launch</SelectItem>
                  <SelectItem value="burnout-tires">Burnout Tires</SelectItem>
                  <SelectItem value="nascar-pass">NASCAR Pass</SelectItem>
                  <SelectItem value="diesel-truck">Diesel Truck</SelectItem>
                  <SelectItem value="turbo-spool">Turbo Spool</SelectItem>
                  <SelectItem value="exhaust-pop">Exhaust Pop</SelectItem>

                  <SelectItem value="_header_meme" disabled className="font-bold text-xs uppercase tracking-wider text-slate-500 bg-slate-50 dark:bg-slate-900">Funny & Meme Sounds</SelectItem>
                  <SelectItem value="bruh-moment">Bruh Moment</SelectItem>
                  <SelectItem value="sad-trombone">Sad Trombone</SelectItem>
                  <SelectItem value="rimshot">Rimshot (Ba Dum Tss)</SelectItem>
                  <SelectItem value="record-scratch">Record Scratch</SelectItem>
                  <SelectItem value="vine-boom">Vine Boom</SelectItem>
                  <SelectItem value="air-horn">Air Horn</SelectItem>
                  <SelectItem value="crickets">Crickets</SelectItem>
                  <SelectItem value="dramatic-chipmunk">Dramatic Reveal</SelectItem>
                  <SelectItem value="wrong-answer">Wrong Answer Buzzer</SelectItem>
                  <SelectItem value="cash-register">Cash Register Cha-Ching</SelectItem>
                  <SelectItem value="sitcom-laugh">Sitcom Laugh Track</SelectItem>
                  <SelectItem value="fart-sound">Fart Sound</SelectItem>
                  <SelectItem value="clown-horn">Clown Horn</SelectItem>
                  <SelectItem value="cartoon-boing">Cartoon Boing</SelectItem>
                  <SelectItem value="wilhelm-scream">Wilhelm Scream</SelectItem>
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

function UploadCenter({ uploadedFiles, previewUrls, onUpload, onRemove, onOpenCamera }: {
  uploadedFiles: File[];
  previewUrls: string[];
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: (idx: number) => void;
  onOpenCamera: (mode: 'photo' | 'video') => void;
}) {
  const [activeCategory, setActiveCategory] = useState('all');
  const categories = [
    { id: 'all', label: 'All Files', icon: Folder, count: previewUrls.length },
    { id: 'photos', label: 'Photos', icon: Camera, count: uploadedFiles.filter(f => f.type.startsWith('image/')).length },
    { id: 'videos', label: 'Videos', icon: Video, count: uploadedFiles.filter(f => f.type.startsWith('video/')).length },
    { id: 'logos', label: 'Logos', icon: Shield, count: 0 },
    { id: 'products', label: 'Products', icon: Image, count: 0 },
    { id: 'brand', label: 'Brand Kit', icon: Palette, count: 0 },
    { id: 'voice', label: 'Voice', icon: Mic, count: 0 },
    { id: 'documents', label: 'Docs', icon: FileText, count: 0 },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Upload Center</h2>
        <p className="text-slate-500">Upload photos, logos, brand kits, video clips, product images, voice recordings, and past brochures</p>
      </div>
      <div className="flex flex-wrap gap-2 mb-6">
        {categories.map(cat => (
          <Button key={cat.id} variant={activeCategory === cat.id ? 'default' : 'outline'} size="sm" onClick={() => setActiveCategory(cat.id)} className={activeCategory === cat.id ? 'bg-indigo-600' : ''}>
            <cat.icon className="w-4 h-4 mr-1.5" />{cat.label}
            {cat.count > 0 && <Badge className="ml-1.5 bg-white/20 text-xs">{cat.count}</Badge>}
          </Button>
        ))}
      </div>
      <Card className="border-dashed border-2 border-indigo-300 dark:border-indigo-700 bg-indigo-50/50 dark:bg-indigo-950/20">
        <CardContent className="py-12">
          <div className="text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 mx-auto mb-4 flex items-center justify-center">
              <Upload className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-xl font-bold mb-2">Drag and Drop Files Here</h3>
            <p className="text-slate-500 mb-6">Or use the buttons below to upload or capture media</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl mx-auto">
              <div>
                <input type="file" id="uc-photos" multiple accept="image/*" onChange={onUpload} className="hidden" />
                <label htmlFor="uc-photos"><Button asChild className="w-full bg-blue-600 hover:bg-blue-700"><span><Camera className="w-4 h-4 mr-1.5" />Upload Photos</span></Button></label>
              </div>
              <div>
                <input type="file" id="uc-videos" multiple accept="video/*" onChange={onUpload} className="hidden" />
                <label htmlFor="uc-videos"><Button asChild className="w-full bg-purple-600 hover:bg-purple-700"><span><Video className="w-4 h-4 mr-1.5" />Upload Videos</span></Button></label>
              </div>
              <div>
                <input type="file" id="uc-logos" multiple accept="image/*,.svg" onChange={onUpload} className="hidden" />
                <label htmlFor="uc-logos"><Button asChild className="w-full bg-emerald-600 hover:bg-emerald-700"><span><Shield className="w-4 h-4 mr-1.5" />Upload Logo</span></Button></label>
              </div>
              <div>
                <input type="file" id="uc-docs" multiple accept=".pdf,.doc,.docx,image/*" onChange={onUpload} className="hidden" />
                <label htmlFor="uc-docs"><Button asChild className="w-full bg-amber-600 hover:bg-amber-700"><span><FileText className="w-4 h-4 mr-1.5" />Upload Docs</span></Button></label>
              </div>
            </div>
            <div className="flex gap-3 justify-center mt-4 flex-wrap">
              <Button variant="outline" onClick={() => onOpenCamera('photo')}><Aperture className="w-4 h-4 mr-2" />Take Photo</Button>
              <Button variant="outline" onClick={() => onOpenCamera('video')}><Video className="w-4 h-4 mr-2" />Record Video</Button>
              <div>
                <input type="file" id="uc-voice" multiple accept="audio/*" onChange={onUpload} className="hidden" />
                <label htmlFor="uc-voice"><Button asChild variant="outline"><span><Mic className="w-4 h-4 mr-2" />Upload Voice</span></Button></label>
              </div>
              <div>
                <input type="file" id="uc-products" multiple accept="image/*" onChange={onUpload} className="hidden" />
                <label htmlFor="uc-products"><Button asChild variant="outline"><span><Image className="w-4 h-4 mr-2" />Product Images</span></Button></label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      {previewUrls.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2"><Folder className="w-5 h-5 text-indigo-600" />Your Media Library ({previewUrls.length} files)</span>
              <Badge className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"><Lock className="w-3 h-3 mr-1" />AI Auto-Tagged</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-8 gap-3">
              {previewUrls.map((url, idx) => (
                <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border-2 border-slate-200 dark:border-slate-700 group hover:border-indigo-400 transition-colors">
                  <img src={url} alt={`File ${idx + 1}`} className="w-full h-full object-cover" />
                  <button onClick={() => onRemove(idx)} className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><X className="w-3 h-3" /></button>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent text-white text-xs py-1.5 px-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {uploadedFiles[idx]?.name?.slice(0, 15) || `File ${idx + 1}`}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-6 text-center">
            <Sparkles className="w-10 h-10 text-blue-600 mx-auto mb-2" />
            <h3 className="font-bold mb-1">AI Auto-Tagging</h3>
            <p className="text-sm text-slate-500">Every upload is automatically analyzed and tagged by AI for instant search</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800">
          <CardContent className="pt-6 text-center">
            <Lock className="w-10 h-10 text-green-600 mx-auto mb-2" />
            <h3 className="font-bold mb-1">Secure Storage</h3>
            <p className="text-sm text-slate-500">All files are encrypted and timestamped for legal protection and dispute evidence</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-200 dark:border-purple-800">
          <CardContent className="pt-6 text-center">
            <Folder className="w-10 h-10 text-purple-600 mx-auto mb-2" />
            <h3 className="font-bold mb-1">Smart Folders</h3>
            <p className="text-sm text-slate-500">Auto-organized by project, date, and media type with bulk upload support</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function TemplatesLibrary({ onSelectTemplate }: { onSelectTemplate: (prompt: string) => void }) {
  const [selectedIndustry, setSelectedIndustry] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const { toast } = useToast();

  const industries = [
    { id: 'all', label: 'All Industries' }, { id: 'tree-service', label: 'Tree Service' }, { id: 'roofing', label: 'Roofing' },
    { id: 'storm-cleanup', label: 'Storm Cleanup' }, { id: 'real-estate', label: 'Real Estate' }, { id: 'restaurant', label: 'Restaurants' },
    { id: 'construction', label: 'Construction' }, { id: 'hvac', label: 'HVAC' }, { id: 'landscaping', label: 'Landscaping' },
    { id: 'auto-repair', label: 'Auto Repair' }, { id: 'medical', label: 'Medical' }, { id: 'political', label: 'Political Campaign' },
    { id: 'event', label: 'Event Promotion' }, { id: 'nonprofit', label: 'Nonprofit' }, { id: 'church', label: 'Church' },
    { id: 'ecommerce', label: 'E-commerce' }, { id: 'plumbing', label: 'Plumbing' }, { id: 'electrical', label: 'Electrical' },
    { id: 'painting', label: 'Painting' }, { id: 'fitness', label: 'Fitness & Gym' },
  ];

  const templateTypes = [
    { id: 'all', label: 'All Types' }, { id: 'tri-fold', label: 'Tri-Fold Brochure' }, { id: 'bi-fold', label: 'Bi-Fold Brochure' },
    { id: 'postcard', label: 'Postcard' }, { id: 'door-hanger', label: 'Door Hanger' }, { id: 'yard-sign', label: 'Yard Sign' },
    { id: 'social-carousel', label: 'Social Carousel' }, { id: 'facebook-ad', label: 'Facebook Ad' },
    { id: 'instagram-reel', label: 'Instagram Reel' }, { id: 'youtube-ad', label: 'YouTube Ad' }, { id: 'billboard', label: 'Billboard' },
    { id: 'email-campaign', label: 'Email Campaign' }, { id: 'proposal-pdf', label: 'Proposal PDF' }, { id: 'flyer', label: 'Flyer' },
    { id: 'business-card', label: 'Business Card' }, { id: 'banner', label: 'Web Banner' }, { id: 'direct-mail', label: 'Direct Mail' },
  ];

  const colorMap: Record<string, string> = {
    'tree-service': 'bg-emerald-100 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800',
    'roofing': 'bg-blue-100 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
    'storm-cleanup': 'bg-red-100 dark:bg-red-900/20 border-red-200 dark:border-red-800',
    'real-estate': 'bg-amber-100 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',
    'restaurant': 'bg-orange-100 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800',
    'construction': 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700',
    'hvac': 'bg-cyan-100 dark:bg-cyan-900/20 border-cyan-200 dark:border-cyan-800',
    'landscaping': 'bg-green-100 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    'auto-repair': 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700',
    'medical': 'bg-teal-100 dark:bg-teal-900/20 border-teal-200 dark:border-teal-800',
    'political': 'bg-red-100 dark:bg-red-900/20 border-red-200 dark:border-red-800',
    'event': 'bg-violet-100 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800',
    'nonprofit': 'bg-rose-100 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800',
    'church': 'bg-indigo-100 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800',
    'ecommerce': 'bg-pink-100 dark:bg-pink-900/20 border-pink-200 dark:border-pink-800',
    'plumbing': 'bg-blue-100 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
    'fitness': 'bg-orange-100 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800',
    'painting': 'bg-purple-100 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800',
    'electrical': 'bg-yellow-100 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
  };
  const c = (ind: string) => colorMap[ind] || 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700';

  const templates = [
    { industry: 'tree-service', type: 'door-hanger', title: 'Emergency Tree Removal Door Hanger', desc: 'Bold design with 24/7 emergency messaging', prompt: 'Create a professional door hanger for an emergency tree removal company — bold red and black colors, 24/7 availability, before/after photos, phone number prominent, urgent tone' },
    { industry: 'tree-service', type: 'facebook-ad', title: 'Storm Damage Tree Service Ad', desc: 'Facebook ad targeting storm-affected homeowners', prompt: 'Design a Facebook ad for tree removal service targeting homeowners after a storm — show fallen trees, fast response promise, licensed & insured badge, get a free estimate CTA' },
    { industry: 'tree-service', type: 'tri-fold', title: 'Tree Service Tri-Fold Brochure', desc: 'Complete services overview brochure', prompt: 'Create a professional tri-fold brochure for a tree service company — tree removal, trimming, stump grinding, emergency storm response, arborist consultation, before/after photos, free estimate coupon' },
    { industry: 'tree-service', type: 'flyer', title: 'Tree Trimming Spring Special Flyer', desc: 'Seasonal tree care promotion', prompt: 'Design a spring tree trimming flyer — seasonal pruning packages, hazard tree assessment, certified arborist on staff, storm preparation tips, 15% spring discount' },
    { industry: 'tree-service', type: 'yard-sign', title: 'Tree Service Job Site Sign', desc: 'Professional job site branding', prompt: 'Design a bold yard sign for a professional tree service — large company name, phone number, tree silhouette icon, licensed insured bonded, easy to read from street' },
    { industry: 'tree-service', type: 'postcard', title: 'Storm Season Tree Safety Postcard', desc: 'Pre-storm season mailing', prompt: 'Create a direct mail postcard for tree service storm preparation — hazard tree identification tips, pre-storm trimming packages, emergency contact info, insurance documentation' },
    { industry: 'tree-service', type: 'email-campaign', title: 'Tree Service Follow-Up Email', desc: 'Post-service review request', prompt: 'Design a professional follow-up email for tree service — thank you message, request Google review, refer-a-friend discount, seasonal maintenance reminder, next service scheduling' },
    { industry: 'tree-service', type: 'instagram-reel', title: 'Dramatic Tree Removal Reel', desc: 'Viral-worthy tree takedown video', prompt: 'Create an Instagram Reel concept for dramatic tree removal — crane lifts, precision cuts, before/after transformation, crew teamwork shots, satisfying stump grinding, time-lapse cleanup' },
    { industry: 'roofing', type: 'postcard', title: 'Free Roof Inspection Postcard', desc: 'Direct mail postcard with inspection offer', prompt: 'Create a professional direct mail postcard for a roofing company offering free storm damage inspections — before/after roof photos, insurance claim assistance, BBB accredited, call now' },
    { industry: 'roofing', type: 'yard-sign', title: 'Roofing Company Yard Sign', desc: 'Job site yard sign for brand visibility', prompt: 'Design a bold yard sign for a professional roofing company — easy to read from 50 feet, company name, phone number, website, licensed bonded insured badge' },
    { industry: 'roofing', type: 'tri-fold', title: 'Roofing Services Tri-Fold', desc: 'Complete roofing services brochure', prompt: 'Create a tri-fold brochure for a roofing company — shingle, metal, tile roofing, storm damage repair, insurance claims assistance, lifetime warranty, financing available, customer testimonials' },
    { industry: 'roofing', type: 'facebook-ad', title: 'Roof Storm Damage Ad', desc: 'Post-storm Facebook campaign', prompt: 'Design a Facebook ad for roofing company after a hailstorm — free inspection offer, insurance claim help, before/after photos, 5-star reviews, limited time financing' },
    { industry: 'roofing', type: 'flyer', title: 'Roofing Emergency Response Flyer', desc: 'Storm response flyer for neighborhoods', prompt: 'Create an emergency roofing response flyer — storm damage? We can help, free inspection, insurance documentation, tarping services, 24/7 emergency line, GAF certified' },
    { industry: 'roofing', type: 'email-campaign', title: 'Roof Maintenance Reminder Email', desc: 'Annual maintenance campaign', prompt: 'Design a roof maintenance reminder email — annual inspection importance, gutter cleaning, flashing check, warranty protection, schedule online, early bird discount' },
    { industry: 'storm-cleanup', type: 'flyer', title: 'Storm Cleanup Emergency Flyer', desc: 'Rapid deploy flyer for storm-hit areas', prompt: 'Create an emergency storm cleanup flyer — FEMA-compliant services, debris removal, board-up services, tarping, tree removal, 24/7 hotline, insurance documentation assistance' },
    { industry: 'storm-cleanup', type: 'tri-fold', title: 'Storm Response Services Brochure', desc: 'Full disaster response capabilities', prompt: 'Create a tri-fold brochure for storm cleanup company — emergency response, debris removal, water extraction, board-up, tarping, FEMA documentation, insurance liaison, 24/7 dispatch' },
    { industry: 'storm-cleanup', type: 'door-hanger', title: 'Storm Damage Assessment Door Hanger', desc: 'Post-storm neighborhood canvassing', prompt: 'Design a door hanger for storm damage assessment — Was your property affected? Free damage inspection, insurance claim help, debris removal, emergency tarping, call now' },
    { industry: 'storm-cleanup', type: 'facebook-ad', title: 'Emergency Storm Response Ad', desc: 'Urgent post-storm Facebook campaign', prompt: 'Create an urgent Facebook ad for storm cleanup services — immediate response, debris removal crews ready, insurance documentation, FEMA-certified, serving your area now' },
    { industry: 'real-estate', type: 'social-carousel', title: 'Property Listing Carousel', desc: 'Multi-slide property showcase', prompt: 'Create a stunning Instagram carousel for a luxury property listing — 5 slides showing exterior, kitchen, living room, master suite, and backyard. Modern, aspirational, include price and agent contact' },
    { industry: 'real-estate', type: 'tri-fold', title: 'Real Estate Agent Brochure', desc: 'Personal branding brochure', prompt: 'Create a tri-fold brochure for a real estate agent — professional headshot, sold listings, market expertise, buyer/seller services, testimonials, neighborhood guides, contact info' },
    { industry: 'real-estate', type: 'postcard', title: 'Just Sold Postcard', desc: 'Neighborhood farming postcard', prompt: 'Design a Just Sold postcard for real estate farming — property photo, sale price, days on market, agent photo, thinking of selling tagline, free home valuation offer' },
    { industry: 'restaurant', type: 'instagram-reel', title: 'Grand Opening Restaurant Reel', desc: 'Viral-worthy restaurant opening ad', prompt: 'Create a TikTok/Instagram Reel concept for a restaurant grand opening — food close-ups, chef action shots, ambient dining shots, special opening week deals, mouth-watering descriptions' },
    { industry: 'restaurant', type: 'flyer', title: 'Catering Services Flyer', desc: 'Professional catering menu flyer', prompt: 'Design an elegant catering services flyer — menu highlights, pricing tiers (Silver/Gold/Platinum), event photos, testimonials, minimum headcount, booking CTA' },
    { industry: 'restaurant', type: 'tri-fold', title: 'Restaurant Menu Tri-Fold', desc: 'Takeout and delivery menu', prompt: 'Create a tri-fold menu for a restaurant — appetizers, entrees, desserts, drinks, chef specials, photos of signature dishes, delivery info, catering available, hours and location' },
    { industry: 'construction', type: 'proposal-pdf', title: 'Construction Proposal Template', desc: 'Professional project proposal', prompt: 'Create a professional construction proposal template — cover page, project overview, scope of work, timeline, pricing breakdown, terms & conditions, about us, portfolio photos' },
    { industry: 'construction', type: 'tri-fold', title: 'General Contractor Brochure', desc: 'Full service construction overview', prompt: 'Create a tri-fold brochure for a general contractor — residential, commercial, renovations, new builds, project gallery, insurance and bonding info, free consultation CTA' },
    { industry: 'construction', type: 'yard-sign', title: 'Construction Site Sign', desc: 'Professional job site branding', prompt: 'Design a professional construction site sign — company name and logo, project type, contact info, safety first message, licensed and insured, coming soon date' },
    { industry: 'hvac', type: 'postcard', title: 'HVAC Seasonal Tune-Up Postcard', desc: 'Seasonal maintenance promotion', prompt: 'Create a direct mail postcard for HVAC seasonal tune-up special — $49 tune-up offer, prevent breakdowns messaging, comfort guarantee, 5-star reviews, before winter urgency' },
    { industry: 'hvac', type: 'tri-fold', title: 'HVAC Services Tri-Fold', desc: 'Complete heating and cooling brochure', prompt: 'Create a tri-fold brochure for HVAC company — installation, repair, maintenance plans, indoor air quality, smart thermostat, financing options, energy efficiency tips, 24/7 service' },
    { industry: 'hvac', type: 'door-hanger', title: 'HVAC Summer Ready Door Hanger', desc: 'Pre-summer AC check promotion', prompt: 'Design a door hanger for HVAC summer prep — AC tune-up special, prevent breakdowns, energy savings, new system financing, schedule now QR code, limited spots available' },
    { industry: 'landscaping', type: 'door-hanger', title: 'Landscaping Services Door Hanger', desc: 'Neighborhood canvassing door hanger', prompt: 'Design a vibrant landscaping services door hanger — beautiful lawn transformation photos, weekly/monthly packages, free estimate, spring special discount, eco-friendly badge' },
    { industry: 'landscaping', type: 'tri-fold', title: 'Landscaping Company Brochure', desc: 'Full services overview', prompt: 'Create a tri-fold brochure for landscaping — lawn care, hardscaping, irrigation, seasonal cleanup, design consultation, maintenance plans, before/after portfolio, free estimate' },
    { industry: 'landscaping', type: 'facebook-ad', title: 'Spring Cleanup Facebook Ad', desc: 'Seasonal promotion campaign', prompt: 'Design a Facebook ad for spring lawn cleanup — before/after photos, cleanup packages, mulching, edging, fertilization, book now limited availability, early bird pricing' },
    { industry: 'auto-repair', type: 'flyer', title: 'Auto Repair Shop Flyer', desc: 'Full service auto repair promotion', prompt: 'Create a professional auto repair shop flyer — oil change special, brake service, engine diagnostics, tire rotation, ASE certified mechanics, family-owned trust messaging' },
    { industry: 'auto-repair', type: 'tri-fold', title: 'Auto Shop Services Brochure', desc: 'Complete automotive services', prompt: 'Create a tri-fold brochure for auto repair — engine, transmission, brakes, tires, AC, electrical, diagnostics, fleet services, ASE certified, warranty on repairs, shuttle service' },
    { industry: 'auto-repair', type: 'postcard', title: 'Auto Service Reminder Postcard', desc: 'Maintenance reminder mailer', prompt: 'Design a service reminder postcard for auto repair — oil change due, tire rotation, brake inspection, multi-point check, $10 off coupon, convenient scheduling, trusted since 1995' },
    { industry: 'medical', type: 'email-campaign', title: 'Medical Practice Welcome Email', desc: 'New patient welcome email sequence', prompt: 'Design a warm welcome email for a medical practice — new patient information, what to expect, insurance accepted, office hours, provider bios, patient portal setup' },
    { industry: 'medical', type: 'tri-fold', title: 'Medical Practice Brochure', desc: 'Patient information brochure', prompt: 'Create a tri-fold brochure for a medical practice — services offered, provider bios, insurance accepted, patient testimonials, telehealth available, accepting new patients' },
    { industry: 'political', type: 'billboard', title: 'Political Campaign Billboard', desc: 'High-impact campaign billboard', prompt: 'Create a bold political campaign billboard — candidate photo, campaign slogan, key issue highlights (Jobs, Safety, Education), patriotic colors, vote date, paid for by disclaimer' },
    { industry: 'political', type: 'flyer', title: 'Campaign Rally Flyer', desc: 'Rally and event promotion', prompt: 'Design a political campaign rally flyer — candidate name, rally date and location, key platform issues, special guest speakers, patriotic design, volunteer signup QR code' },
    { industry: 'political', type: 'door-hanger', title: 'Campaign Door Hanger', desc: 'Door-to-door canvassing material', prompt: 'Create a campaign door hanger — candidate photo, key positions on local issues, endorsements, vote date reminder, website and social media, paid for disclaimer' },
    { industry: 'event', type: 'flyer', title: 'Community Event Flyer', desc: 'Local event promotion flyer', prompt: 'Design a vibrant community event flyer — date, time, location, activities list, food vendors, live music, kids zone, sponsors section, free admission badge' },
    { industry: 'event', type: 'social-carousel', title: 'Event Highlights Carousel', desc: 'Post-event social media recap', prompt: 'Create an Instagram carousel for event highlights — 6 slides with crowd shots, performers, food vendors, activities, sponsors thank you, save the date for next year' },
    { industry: 'nonprofit', type: 'email-campaign', title: 'Nonprofit Fundraiser Email', desc: 'Donation campaign email', prompt: 'Create a compelling nonprofit fundraiser email — emotional story, impact statistics, donation tiers ($25/$50/$100/$250), matching gift mention, donate button' },
    { industry: 'nonprofit', type: 'tri-fold', title: 'Nonprofit Mission Brochure', desc: 'Organization overview brochure', prompt: 'Create a tri-fold brochure for a nonprofit — mission statement, programs, impact numbers, volunteer opportunities, donor levels, success stories, how to get involved' },
    { industry: 'church', type: 'flyer', title: 'Church Event Invitation', desc: 'Welcoming church event flyer', prompt: 'Design a warm inviting church event flyer — Sunday service times, special guest speaker, worship music, childcare available, community potluck, all are welcome' },
    { industry: 'church', type: 'tri-fold', title: 'Church Welcome Brochure', desc: 'New visitor welcome packet', prompt: 'Create a tri-fold welcome brochure for a church — service times, ministry programs, youth group, community outreach, pastor message, visitor welcome, campus map' },
    { industry: 'church', type: 'postcard', title: 'Easter Service Invitation', desc: 'Holiday service mailer', prompt: 'Design a beautiful Easter service invitation postcard — service times, egg hunt for kids, special music, family welcome, casual dress, free coffee and donuts' },
    { industry: 'ecommerce', type: 'facebook-ad', title: 'Flash Sale Facebook Ad', desc: 'Limited time sale promotion', prompt: 'Create an urgent flash sale Facebook ad — 48 HOURS ONLY, up to 70% off, product showcase grid, countdown timer visual, shop now button, free shipping over $50' },
    { industry: 'ecommerce', type: 'email-campaign', title: 'Product Launch Email', desc: 'New product announcement', prompt: 'Design a product launch email — hero product image, key features, introductory pricing, early access for subscribers, shop now CTA, social sharing buttons' },
    { industry: 'ecommerce', type: 'instagram-reel', title: 'Unboxing Experience Reel', desc: 'Product unboxing video concept', prompt: 'Create an Instagram Reel concept for product unboxing — satisfying packaging reveal, close-up product details, lifestyle usage shots, customer reaction, discount code overlay' },
    { industry: 'plumbing', type: 'yard-sign', title: 'Plumbing Emergency Yard Sign', desc: '24/7 emergency plumber sign', prompt: 'Design a clear bold yard sign for 24/7 emergency plumbing — large phone number, No Extra Charge Weekends badge, licensed & insured, water heater and drain icons' },
    { industry: 'plumbing', type: 'tri-fold', title: 'Plumbing Services Brochure', desc: 'Full plumbing services overview', prompt: 'Create a tri-fold brochure for plumbing — drain cleaning, water heaters, sewer repair, fixture installation, emergency service, camera inspection, financing, satisfaction guarantee' },
    { industry: 'plumbing', type: 'door-hanger', title: 'Plumbing Special Offer Door Hanger', desc: 'Neighborhood service promotion', prompt: 'Design a plumbing door hanger — drain cleaning special $79, water heater flush $99, free estimates, we are working in your neighborhood today, QR code to schedule' },
    { industry: 'fitness', type: 'instagram-reel', title: 'Gym Membership Promo Reel', desc: 'New year fitness campaign', prompt: 'Create an energetic Instagram Reel concept for a gym membership promotion — transformation montage, equipment showcase, group classes, personal training, first month free offer' },
    { industry: 'fitness', type: 'tri-fold', title: 'Gym Membership Brochure', desc: 'Membership tiers and amenities', prompt: 'Create a tri-fold brochure for a gym — membership plans (Basic/Premium/VIP), equipment photos, group classes schedule, personal training, pool and spa, childcare, free trial week' },
    { industry: 'fitness', type: 'flyer', title: 'Boot Camp Challenge Flyer', desc: '30-day fitness challenge promotion', prompt: 'Design an energetic boot camp challenge flyer — 30 day transformation challenge, before/after results, group training, nutrition coaching, early bird discount, starts Monday' },
    { industry: 'painting', type: 'tri-fold', title: 'Painting Company Tri-Fold', desc: 'Comprehensive services brochure', prompt: 'Create a professional tri-fold brochure for a painting company — interior/exterior services, color consultation, before/after gallery, customer testimonials, free estimate coupon, 10-year warranty' },
    { industry: 'painting', type: 'door-hanger', title: 'Painting Services Door Hanger', desc: 'Neighborhood painting promotion', prompt: 'Design a painting company door hanger — interior and exterior painting, deck staining, cabinet refinishing, free color consultation, spring special 15% off, licensed and insured' },
    { industry: 'painting', type: 'facebook-ad', title: 'Home Painting Before/After Ad', desc: 'Transformation showcase ad', prompt: 'Create a Facebook ad for painting company — stunning before/after transformation, interior and exterior, free estimate, 5-star reviews, book this week for 10% off' },
    { industry: 'electrical', type: 'flyer', title: 'Electrical Services Flyer', desc: 'Licensed electrician services', prompt: 'Design a professional electrical services flyer — panel upgrades, outlet installation, lighting design, generator installation, EV charger installation, licensed master electrician' },
    { industry: 'electrical', type: 'tri-fold', title: 'Electrical Company Brochure', desc: 'Complete electrical services', prompt: 'Create a tri-fold brochure for electrical company — residential, commercial, industrial, panel upgrades, whole-home generators, smart home wiring, EV charging, 24/7 emergency, licensed master electrician' },
    { industry: 'electrical', type: 'door-hanger', title: 'Electrical Safety Check Door Hanger', desc: 'Safety inspection promotion', prompt: 'Design an electrical safety door hanger — free safety inspection, outlet and panel check, smoke detector testing, surge protection, prevent electrical fires, schedule now QR code' },
  ].map(t => ({ ...t, color: c(t.industry) }));

  const filtered = templates.filter(t => (selectedIndustry === 'all' || t.industry === selectedIndustry) && (selectedType === 'all' || t.type === selectedType));

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Templates Library</h2>
        <p className="text-slate-500">Browse industry-specific templates. Click any template to customize it with AI.</p>
      </div>
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex-1 min-w-[200px]">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Industry</label>
          <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent className="max-h-[300px]">{industries.map(ind => (<SelectItem key={ind.id} value={ind.id}>{ind.label}</SelectItem>))}</SelectContent>
          </Select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Template Type</label>
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent className="max-h-[300px]">{templateTypes.map(tt => (<SelectItem key={tt.id} value={tt.id}>{tt.label}</SelectItem>))}</SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <p className="text-sm text-slate-500">{filtered.length} template{filtered.length !== 1 ? 's' : ''} found</p>
          {(selectedIndustry !== 'all' || selectedType !== 'all') && (
            <button onClick={() => { setSelectedIndustry('all'); setSelectedType('all'); }} className="text-xs text-indigo-600 hover:text-indigo-800 underline">Reset Filters</button>
          )}
        </div>
        <Badge variant="outline" className="text-indigo-600">{industries.length - 1} Industries &middot; {templateTypes.length - 1} Types</Badge>
      </div>
      {filtered.length === 0 && (
        <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-600">
          <Wand2 className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <h3 className="font-semibold text-slate-700 dark:text-slate-300 mb-2">No exact match for this combination</h3>
          <p className="text-sm text-slate-500 mb-4">Try selecting a different industry or template type, or reset filters to browse all templates.</p>
          <button onClick={() => { setSelectedIndustry('all'); setSelectedType('all'); }} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition-colors">Show All Templates</button>
        </div>
      )}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((template, idx) => (
          <Card key={idx} className={`cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] ${template.color}`} onClick={() => { onSelectTemplate(template.prompt); toast({ title: "Template loaded!", description: `${template.title} - customize it in the Flyers & Ads editor` }); }}>
            <CardContent className="pt-5">
              <div className="flex items-start justify-between mb-3">
                <Badge variant="outline" className="text-xs capitalize">{template.type.replace(/-/g, ' ')}</Badge>
                <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs capitalize">{template.industry.replace(/-/g, ' ')}</Badge>
              </div>
              <h3 className="font-bold text-base mb-1">{template.title}</h3>
              <p className="text-sm text-slate-500 mb-3">{template.desc}</p>
              <div className="flex items-center gap-2">
                <Wand2 className="w-4 h-4 text-indigo-500" />
                <span className="text-xs text-indigo-600 font-medium">Click to customize with AI</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function CampaignBuilder() {
  const { toast } = useToast();
  const [campaignPrompt, setCampaignPrompt] = useState('');
  const [city, setCity] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [avgJobValue, setAvgJobValue] = useState('');
  const [competitors, setCompetitors] = useState('');
  const [budget, setBudget] = useState('');
  const [goal, setGoal] = useState('leads');
  const [campaignResult, setCampaignResult] = useState<any>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [mode, setMode] = useState<'contractor' | 'marketer'>('contractor');

  const campaignMutation = useMutation({
    mutationFn: async (params: any) => {
      const res = await apiRequest("/api/ai-ads/freeform-create", "POST", params);
      return res;
    },
    onSuccess: (data) => {
      if (data.success && data.result) {
        setCampaignResult(data.result);
        toast({ title: "Full Campaign Generated!", description: "Your multi-piece marketing campaign is ready!" });
      }
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to generate campaign", variant: "destructive" });
    }
  });

  const handleLaunchCampaign = () => {
    if (!campaignPrompt.trim()) { toast({ title: "Describe your campaign", variant: "destructive" }); return; }
    const bizIntel = [city && `City/Market: ${city}`, targetAudience && `Target Audience: ${targetAudience}`, avgJobValue && `Average Job Value: $${avgJobValue}`, competitors && `Competitors: ${competitors}`, budget && `Budget: $${budget}`, `Goal: ${goal}`, `Mode: ${mode === 'contractor' ? 'Quick Deploy Contractor Mode' : 'Full Marketing Pro Mode'}`].filter(Boolean).join('\n');
    const fullPrompt = `FULL MULTI-PIECE MARKETING CAMPAIGN REQUEST:\n\n"${campaignPrompt.trim()}"\n\nBUSINESS INTELLIGENCE:\n${bizIntel}\n\nGenerate a COMPLETE marketing campaign package with ALL of these pieces:\n\n1. FLYER: Print-ready promotional flyer with headline, body copy, and CTA\n2. FACEBOOK AD: Scroll-stopping Facebook/Instagram ad with copy, headline, and CTA\n3. 30-SECOND VIDEO AD SCRIPT: Complete video script with scenes, voiceover, and music\n4. WEBSITE HERO COPY: Hero section headline, subheadline, and CTA button text\n5. EMAIL SEQUENCE: 3-email drip sequence (subject lines and body copy)\n6. SMS FOLLOW-UP: 3 SMS messages for lead follow-up (under 160 chars each)\n7. DOOR HANGER COPY: Front and back copy for a door hanger\n8. YARD SIGN: Bold yard sign copy (company name, tagline, phone, website)\n9. GOOGLE AD COPY: 3 Google search ad variations (headline 1, headline 2, description)\n10. SOCIAL MEDIA POSTS: 5 social media post ideas with hashtags\n\nCRITICAL: Perfect spelling and grammar throughout. Zero typos. Professional quality.`;
    campaignMutation.mutate({ prompt: fullPrompt, adType: 'full_campaign', style: 'professional', platform: 'multi-platform', includeImage: true });
  };

  const copyText = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
    toast({ title: "Copied!" });
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">AI Campaign Builder</h2>
        <p className="text-slate-500">One prompt creates flyer, Facebook ad, video script, emails, SMS, door hanger, yard sign, Google ads, and social posts</p>
      </div>
      <div className="flex gap-2 justify-center mb-6">
        <Button variant={mode === 'contractor' ? 'default' : 'outline'} onClick={() => setMode('contractor')} className={mode === 'contractor' ? 'bg-amber-600' : ''}>
          <Shield className="w-4 h-4 mr-1.5" />Contractor Mode
        </Button>
        <Button variant={mode === 'marketer' ? 'default' : 'outline'} onClick={() => setMode('marketer')} className={mode === 'marketer' ? 'bg-indigo-600' : ''}>
          <Sparkles className="w-4 h-4 mr-1.5" />Marketing Pro Mode
        </Button>
      </div>
      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card className="border-2 border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/20">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg"><Megaphone className="w-5 h-5 text-indigo-600" /><span className="text-indigo-600">Campaign Brief</span></CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea value={campaignPrompt} onChange={(e) => setCampaignPrompt(e.target.value)} placeholder={mode === 'contractor' ? 'Example: "Full marketing campaign for my tree removal company in Columbus GA targeting homeowners with storm damage"' : 'Example: "Comprehensive marketing campaign for a luxury real estate agency targeting high-net-worth buyers in Miami"'} className="min-h-[100px] resize-none" />
              <div className="grid grid-cols-2 gap-2">
                <div><label className="text-xs font-medium text-slate-600 dark:text-slate-400">City / Market</label><input type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Columbus, GA" className="w-full px-3 py-1.5 text-sm rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800" /></div>
                <div><label className="text-xs font-medium text-slate-600 dark:text-slate-400">Target Audience</label><input type="text" value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)} placeholder="Homeowners 35-65" className="w-full px-3 py-1.5 text-sm rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800" /></div>
                <div><label className="text-xs font-medium text-slate-600 dark:text-slate-400">Avg Job Value</label><input type="text" value={avgJobValue} onChange={(e) => setAvgJobValue(e.target.value)} placeholder="2500" className="w-full px-3 py-1.5 text-sm rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800" /></div>
                <div><label className="text-xs font-medium text-slate-600 dark:text-slate-400">Budget</label><input type="text" value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="500" className="w-full px-3 py-1.5 text-sm rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800" /></div>
              </div>
              <div><label className="text-xs font-medium text-slate-600 dark:text-slate-400">Competitors (optional)</label><input type="text" value={competitors} onChange={(e) => setCompetitors(e.target.value)} placeholder="ABC Tree Service, XYZ Roofing" className="w-full px-3 py-1.5 text-sm rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800" /></div>
              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Campaign Goal</label>
                <Select value={goal} onValueChange={setGoal}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="leads">Generate Leads</SelectItem>
                    <SelectItem value="branding">Brand Awareness</SelectItem>
                    <SelectItem value="sales">Direct Sales</SelectItem>
                    <SelectItem value="recruitment">Recruit Workers</SelectItem>
                    <SelectItem value="retention">Customer Retention</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold py-5 text-base" onClick={handleLaunchCampaign} disabled={campaignMutation.isPending}>
                {campaignMutation.isPending ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Building your campaign...</> : <><Wand2 className="w-5 h-5 mr-2" />Launch Full Campaign</>}
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-600 dark:text-slate-400">What you get in one click</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-1.5 text-sm">
                {['Flyer', 'Facebook Ad', '30-sec Video Script', 'Website Hero Copy', '3-Email Sequence', 'SMS Follow-Ups', 'Door Hanger', 'Yard Sign', 'Google Ad Copy', 'Social Media Posts'].map((item, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400"><Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />{item}</div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20">
            <CardContent className="pt-5">
              <h4 className="font-bold text-sm mb-2">Quick Campaign Ideas</h4>
              <div className="space-y-2">
                {[mode === 'contractor' ? 'Full storm cleanup marketing campaign for my area' : 'Luxury brand launch campaign for upscale market', mode === 'contractor' ? 'Emergency tree removal marketing blitz after tornado' : 'Restaurant grand opening campaign with social media focus', mode === 'contractor' ? 'Roofing company lead generation campaign for spring' : 'E-commerce flash sale campaign for Black Friday'].map((idea, i) => (
                  <button key={i} onClick={() => setCampaignPrompt(idea)} className="w-full text-left text-sm p-2 rounded-lg bg-white/70 dark:bg-slate-800/70 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 text-slate-700 dark:text-slate-300 border border-transparent hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors">
                    <span className="text-indigo-500 mr-1.5">&rarr;</span>{idea}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-3 space-y-4">
          {campaignMutation.isPending && !campaignResult && (
            <Card className="border-2 border-indigo-200 dark:border-indigo-800">
              <CardContent className="py-16 text-center">
                <div className="relative mx-auto w-20 h-20 mb-6">
                  <div className="absolute inset-0 rounded-full border-4 border-indigo-200" />
                  <div className="absolute inset-0 rounded-full border-4 border-t-indigo-600 animate-spin" />
                  <Megaphone className="w-8 h-8 text-indigo-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                <h3 className="text-xl font-bold mb-2">Building your full campaign...</h3>
                <p className="text-slate-500">Creating flyer, Facebook ad, video script, emails, SMS, door hanger, yard sign, Google ads, and social posts. About 30-60 seconds.</p>
              </CardContent>
            </Card>
          )}
          {campaignResult && (
            <div className="space-y-4">
              {campaignResult.imageUrl && (<Card className="overflow-hidden"><img src={campaignResult.imageUrl} alt="Campaign Visual" className="w-full max-h-[400px] object-cover" /></Card>)}
              {campaignResult.adCopy && (
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2"><Megaphone className="w-5 h-5 text-indigo-600" />Full Campaign Package</CardTitle>
                      <Button size="sm" variant="ghost" onClick={() => copyText(campaignResult.adCopy, 'campaign')}>{copiedField === 'campaign' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}</Button>
                    </div>
                  </CardHeader>
                  <CardContent><div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">{campaignResult.adCopy}</div></CardContent>
                </Card>
              )}
              {campaignResult.headlines && campaignResult.headlines.length > 0 && (
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-base">Campaign Headlines</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {campaignResult.headlines.map((h: string, i: number) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800 group">
                          <span className="font-semibold">{h}</span>
                          <Button size="sm" variant="ghost" className="opacity-0 group-hover:opacity-100" onClick={() => copyText(h, `ch${i}`)}>{copiedField === `ch${i}` ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}</Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
              {campaignResult.videoConcept && (
                <Card className="border-2 border-purple-200 dark:border-purple-800">
                  <CardHeader><CardTitle className="flex items-center gap-2"><Film className="w-5 h-5 text-purple-600" />Video Ad Script</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {campaignResult.videoConcept.scenes?.map((scene: any, i: number) => (
                        <div key={i} className="pl-6 pb-3 border-l-2 border-purple-200 dark:border-purple-800">
                          <div className="flex items-center gap-2 mb-1"><Badge className="bg-purple-600 text-white text-xs">{i + 1}</Badge><Badge variant="outline" className="text-xs">{scene.duration}</Badge></div>
                          <p className="text-sm"><strong>Visual:</strong> {scene.description}</p>
                          <p className="text-sm text-slate-600 dark:text-slate-400"><strong>VO:</strong> "{scene.voiceover}"</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
              <Card className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900">
                <CardContent className="pt-5 pb-4">
                  <h4 className="font-semibold text-sm mb-3 flex items-center gap-2"><Download className="w-4 h-4" />Export Campaign</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <Button size="sm" variant="outline" onClick={() => {
                      let c = `FULL MARKETING CAMPAIGN\n${'='.repeat(50)}\n\n`;
                      if (campaignResult.headlines?.length) c += 'HEADLINES\n' + campaignResult.headlines.join('\n') + '\n\n';
                      if (campaignResult.adCopy) c += 'CAMPAIGN CONTENT\n' + campaignResult.adCopy + '\n\n';
                      if (campaignResult.hashtags?.length) c += 'HASHTAGS\n' + campaignResult.hashtags.join(' ');
                      const blob = new Blob([c], { type: 'text/plain' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `campaign-${Date.now()}.txt`; a.click(); URL.revokeObjectURL(url);
                    }}><FileText className="w-3.5 h-3.5 mr-1" />TXT</Button>
                    <Button size="sm" variant="outline" onClick={() => { const all = `${campaignResult.headlines?.join('\n')}\n\n${campaignResult.adCopy}\n\n${campaignResult.hashtags?.join(' ')}`; navigator.clipboard.writeText(all); toast({ title: "Entire campaign copied!" }); }}><Copy className="w-3.5 h-3.5 mr-1" />Copy All</Button>
                    {campaignResult.imageUrl && (<Button size="sm" className="bg-purple-600 hover:bg-purple-700" onClick={() => { const a = document.createElement('a'); a.href = campaignResult.imageUrl; a.download = `campaign-image.png`; a.target = '_blank'; a.click(); }}><Download className="w-3.5 h-3.5 mr-1" />Image</Button>)}
                    <Button size="sm" variant="outline" onClick={() => { setCampaignResult(null); setCampaignPrompt(''); }}><RefreshCw className="w-3.5 h-3.5 mr-1" />New Campaign</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          {!campaignResult && !campaignMutation.isPending && (
            <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 border-2 border-indigo-200 dark:border-indigo-800">
              <CardContent className="py-16 text-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 mx-auto mb-6 flex items-center justify-center"><Megaphone className="w-10 h-10 text-white" /></div>
                <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-3">AI Marketing Agency in a Box</h3>
                <p className="text-slate-600 dark:text-slate-400 max-w-lg mx-auto mb-6">Describe your business once and Rachel creates 10+ marketing pieces instantly — flyer, Facebook ad, video script, emails, SMS, door hanger, yard sign, Google ads, and social posts.</p>
                <div className="grid grid-cols-5 gap-3 max-w-md mx-auto">
                  {[{ icon: LayoutTemplate, label: 'Flyer' }, { icon: Megaphone, label: 'Ads' }, { icon: Film, label: 'Video' }, { icon: Send, label: 'Email' }, { icon: FileText, label: 'Print' }].map((item, i) => (
                    <div key={i} className="text-center"><item.icon className="w-7 h-7 text-indigo-500 mx-auto mb-1" /><p className="text-xs text-slate-500">{item.label}</p></div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function ToolsAndExport({ createdItems }: { createdItems: CreativeResult[] }) {
  const { toast } = useToast();
  const [qrText, setQrText] = useState('');
  const [qrGenerated, setQrGenerated] = useState(false);
  const [headlineToScore, setHeadlineToScore] = useState('');
  const [headlineScore, setHeadlineScore] = useState<any>(null);
  const [abTestPrompt, setAbTestPrompt] = useState('');
  const [abResult, setAbResult] = useState<any>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const headlineScoreMutation = useMutation({
    mutationFn: async (headline: string) => {
      const res = await apiRequest("/api/ai-ads/freeform-create", "POST", {
        prompt: `Score this headline for advertising effectiveness on a scale of 1-100 and provide specific feedback:\n\n"${headline}"\n\nProvide: Overall Score (X/100), Emotional Impact (X/10), Clarity (X/10), Urgency (X/10), Curiosity (X/10), Action Words (X/10), Strengths, Weaknesses, and 3 Improved Versions.\n\nIMPORTANT: Perfect spelling and grammar in your response. Zero typos.`,
        adType: 'image', style: 'professional'
      });
      return res;
    },
    onSuccess: (data) => { if (data.success && data.result) { setHeadlineScore(data.result); toast({ title: "Headline Scored!" }); } }
  });

  const abTestMutation = useMutation({
    mutationFn: async (prompt: string) => {
      const res = await apiRequest("/api/ai-ads/freeform-create", "POST", {
        prompt: `Create an A/B test for this ad concept:\n\n"${prompt}"\n\nGenerate TWO completely different versions:\n\nVERSION A (Emotional Approach): Headline, Ad Copy (50 words), CTA, Tone, Target Audience\nVERSION B (Logical Approach): Headline, Ad Copy (50 words), CTA, Tone, Target Audience\n\nAI PREDICTION: Predicted Winner, Reason, Expected CTR Difference (%), Recommended Test Duration, Sample Size Needed\n\nIMPORTANT: Perfect spelling and grammar. Zero typos.`,
        adType: 'image', style: 'professional'
      });
      return res;
    },
    onSuccess: (data) => { if (data.success && data.result) { setAbResult(data.result); toast({ title: "A/B Test Generated!" }); } }
  });

  const copyText = (text: string, field: string) => {
    navigator.clipboard.writeText(text); setCopiedField(field); setTimeout(() => setCopiedField(null), 2000); toast({ title: "Copied!" });
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Tools & Export Center</h2>
        <p className="text-slate-500">Advanced marketing tools, AI scoring, A/B testing, QR codes, and export options</p>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="border-2 border-amber-200 dark:border-amber-800">
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Sparkles className="w-5 h-5 text-amber-600" />Headline Scorer</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Textarea value={headlineToScore} onChange={(e) => setHeadlineToScore(e.target.value)} placeholder="Paste your headline here to get an AI score and improvement suggestions..." className="min-h-[60px] resize-none text-sm" />
            <Button className="w-full bg-amber-600 hover:bg-amber-700" size="sm" onClick={() => headlineToScore.trim() && headlineScoreMutation.mutate(headlineToScore.trim())} disabled={headlineScoreMutation.isPending}>
              {headlineScoreMutation.isPending ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Sparkles className="w-4 h-4 mr-1.5" />}Score Headline
            </Button>
            {headlineScore && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg text-sm">
                <pre className="whitespace-pre-wrap text-xs">{headlineScore.adCopy}</pre>
                <Button size="sm" variant="ghost" className="mt-2" onClick={() => copyText(headlineScore.adCopy, 'score')}>{copiedField === 'score' ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}<span className="ml-1">Copy Report</span></Button>
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="border-2 border-blue-200 dark:border-blue-800">
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><SplitSquareHorizontal className="w-5 h-5 text-blue-600" />A/B Test Generator</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Textarea value={abTestPrompt} onChange={(e) => setAbTestPrompt(e.target.value)} placeholder="Describe your ad concept and AI will create two test versions with a predicted winner..." className="min-h-[60px] resize-none text-sm" />
            <Button className="w-full bg-blue-600 hover:bg-blue-700" size="sm" onClick={() => abTestPrompt.trim() && abTestMutation.mutate(abTestPrompt.trim())} disabled={abTestMutation.isPending}>
              {abTestMutation.isPending ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <SplitSquareHorizontal className="w-4 h-4 mr-1.5" />}Generate A/B Test
            </Button>
            {abResult && (
              <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg text-sm">
                <pre className="whitespace-pre-wrap text-xs">{abResult.adCopy}</pre>
                <Button size="sm" variant="ghost" className="mt-2" onClick={() => copyText(abResult.adCopy, 'ab')}>{copiedField === 'ab' ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}<span className="ml-1">Copy Test</span></Button>
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="border-2 border-emerald-200 dark:border-emerald-800">
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Share2 className="w-5 h-5 text-emerald-600" />QR Code Generator</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <input type="text" value={qrText} onChange={(e) => setQrText(e.target.value)} placeholder="Enter URL or text for QR code..." className="w-full px-3 py-2 text-sm rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800" />
            <Button className="w-full bg-emerald-600 hover:bg-emerald-700" size="sm" onClick={() => { if (qrText.trim()) { setQrGenerated(true); toast({ title: "QR Code Generated!" }); } }}>
              <Share2 className="w-4 h-4 mr-1.5" />Generate QR Code
            </Button>
            {qrGenerated && qrText && (
              <div className="text-center p-4 bg-white dark:bg-slate-800 rounded-lg border">
                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrText)}`} alt="QR Code" className="mx-auto mb-2" />
                <p className="text-xs text-slate-500 break-all">{qrText}</p>
                <Button size="sm" variant="outline" className="mt-2" onClick={() => { const a = document.createElement('a'); a.href = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(qrText)}`; a.download = 'qr-code.png'; a.click(); }}><Download className="w-3 h-3 mr-1" />Download QR</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <Card className="border-2 border-purple-200 dark:border-purple-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Download className="w-5 h-5 text-purple-600" />Export Center</CardTitle>
          <p className="text-sm text-slate-500">Download all your created content in various formats</p>
        </CardHeader>
        <CardContent>
          {createdItems.length === 0 ? (
            <div className="text-center py-8 text-slate-400"><Layers className="w-12 h-12 mx-auto mb-2 opacity-50" /><p>No content created yet. Use the Video, Flyers, Brochures, or Campaign tabs first.</p></div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="font-medium">{createdItems.length} item{createdItems.length !== 1 ? 's' : ''} ready for export</p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => {
                    let allContent = ''; createdItems.forEach((item, idx) => { allContent += `\n${'='.repeat(50)}\nITEM ${idx + 1}\n${'='.repeat(50)}\n`; if (item.headlines?.length) allContent += '\nHEADLINES:\n' + item.headlines.join('\n'); if (item.adCopy) allContent += '\n\nCOPY:\n' + item.adCopy; if (item.callToAction) allContent += '\n\nCTA: ' + item.callToAction; if (item.hashtags?.length) allContent += '\n\nHASHTAGS: ' + item.hashtags.join(' '); if (item.videoScript) allContent += '\n\nSCRIPT:\n' + item.videoScript; });
                    const blob = new Blob([allContent], { type: 'text/plain' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `all-content-${Date.now()}.txt`; a.click(); URL.revokeObjectURL(url); toast({ title: "All content exported!" });
                  }}><FileText className="w-4 h-4 mr-1.5" />Export All as TXT</Button>
                  <Button size="sm" className="bg-purple-600 hover:bg-purple-700" onClick={() => { createdItems.forEach((item, idx) => { if (item.imageUrl) { const a = document.createElement('a'); a.href = item.imageUrl; a.download = `image-${idx + 1}.png`; a.target = '_blank'; a.click(); } }); toast({ title: "Downloading all images..." }); }}><Download className="w-4 h-4 mr-1.5" />Download All Images</Button>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {createdItems.map((item, idx) => (
                  <Card key={idx} className="overflow-hidden hover:shadow-md transition-shadow">
                    {item.imageUrl && <img src={item.imageUrl} alt="" className="w-full h-24 object-cover" />}
                    <CardContent className="p-3">
                      <p className="text-xs font-medium line-clamp-1 mb-2">{item.headlines?.[0] || `Item ${idx + 1}`}</p>
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" className="flex-1 text-xs h-7" onClick={() => { const all = `${item.headlines?.join('\n')}\n\n${item.adCopy}\n\n${item.callToAction}\n\n${item.hashtags?.join(' ')}`; navigator.clipboard.writeText(all); toast({ title: "Copied!" }); }}><Copy className="w-3 h-3" /></Button>
                        {item.imageUrl && (<Button size="sm" variant="outline" className="flex-1 text-xs h-7" onClick={() => { const a = document.createElement('a'); a.href = item.imageUrl!; a.download = `creative-${idx + 1}.png`; a.target = '_blank'; a.click(); }}><Download className="w-3 h-3" /></Button>)}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-950/20 dark:to-pink-950/20 border-rose-200 dark:border-rose-800">
          <CardContent className="pt-5 text-center"><Heart className="w-8 h-8 text-rose-500 mx-auto mb-2" /><h4 className="font-bold text-sm">Tone Analyzer</h4><p className="text-xs text-slate-500 mt-1">AI analyzes emotional impact of your ads</p></CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-cyan-50 to-teal-50 dark:from-cyan-950/20 dark:to-teal-950/20 border-cyan-200 dark:border-cyan-800">
          <CardContent className="pt-5 text-center"><Eye className="w-8 h-8 text-cyan-500 mx-auto mb-2" /><h4 className="font-bold text-sm">Heat Map Prediction</h4><p className="text-xs text-slate-500 mt-1">AI predicts where eyes focus on your ad</p></CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/20 dark:to-purple-950/20 border-violet-200 dark:border-violet-800">
          <CardContent className="pt-5 text-center"><Sparkles className="w-8 h-8 text-violet-500 mx-auto mb-2" /><h4 className="font-bold text-sm">Conversion Predictor</h4><p className="text-xs text-slate-500 mt-1">AI estimates conversion probability</p></CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20 border-emerald-200 dark:border-emerald-800">
          <CardContent className="pt-5 text-center"><Share2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" /><h4 className="font-bold text-sm">ROI Calculator</h4><p className="text-xs text-slate-500 mt-1">Estimate return on ad spend</p></CardContent>
        </Card>
      </div>
      <ModuleVoiceGuide moduleName="media-vault" />
    </div>
  );
}
