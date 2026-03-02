import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import {
  Film, Download, Loader2, Sparkles, Zap, RefreshCw,
  CheckCircle, AlertCircle, Clock, Video, MonitorPlay,
  Wand2, Crown, Star, ChevronDown, ChevronUp,
  Users, Clapperboard, Megaphone, Smartphone, Settings2, Lock,
  TreePine, Home, Wrench, Droplets, Paintbrush, Flame, Wind,
  Building2, Truck, Scissors, CloudLightning, Laugh, Shield,
  Gem, DollarSign, Volume2, Music, Image, Share2, Hash,
  Mic, Play, Square, Layers, Type, Palette, Copy,
  Send, MessageSquare, PenTool, History, Eye, RotateCcw, GitBranch
} from 'lucide-react';

interface VideoEngine {
  id: string;
  name: string;
  description: string;
  features: string[];
  bestFor: string;
  costPerSecond: string;
  maxDuration: number;
  configured: boolean;
  status: 'ready' | 'needs_key' | 'coming_soon';
}

interface VideoGenJob {
  id: string;
  engine: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  prompt: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  error?: string;
  createdAt: number;
  estimatedSeconds?: number;
}

interface Industry {
  id: string;
  name: string;
  icon: any;
  hooks: string[];
  offers: string[];
  memeIdeas: string[];
  visualStyle: string;
  keywords: string[];
}

interface StyleMode {
  id: string;
  name: string;
  icon: string;
  description: string;
  textStyle: string;
  voiceTone: string;
  musicStyle: string;
  lightingPreset: string;
  effectsIntensity: string;
  color: string;
}

interface ScriptResult {
  hook: string;
  offer: string;
  body: string;
  cta: string;
  hashtags: string[];
  captions: { platform: string; text: string }[];
  voiceSuggestion: string;
  musicSuggestion: string;
}

interface EditMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: number;
  appliedChanges?: any;
}

interface VideoVersion {
  id: string;
  version: number;
  prompt: string;
  settings: {
    engine: string;
    duration: string;
    aspectRatio: string;
    resolution: string;
    style: string;
    effects: string[];
    voice: string;
    industry: string;
    textOverlays?: { text: string; position: string; style: string }[];
  };
  job: VideoGenJob | null;
  editNotes: string;
  createdAt: number;
}

const industries: Industry[] = [
  {
    id: 'tree-service', name: 'Tree Service', icon: TreePine,
    hooks: ['This tree could cost you thousands', 'Storm season is here. Are you ready?', 'Don\'t wait until it falls on your house'],
    offers: ['Remove 2+ trees = FREE stump grinding', '$200 OFF emergency tree removal', 'FREE storm damage inspection'],
    memeIdeas: ['DIY Dave with a tiny saw vs. pro crane lift', 'Tree falling in slow motion with dramatic music', 'Before: scary leaning tree / After: clean yard'],
    visualStyle: 'Dramatic outdoor shots, crane operations, wood chips flying, neon safety gear',
    keywords: ['tree removal', 'stump grinding', 'emergency', 'storm damage', 'licensed insured']
  },
  {
    id: 'roofing', name: 'Roofing', icon: Home,
    hooks: ['Your roof is leaking money', 'One storm away from disaster', 'FREE roof inspection — limited spots'],
    offers: ['FREE storm damage inspection', '$500 OFF full roof replacement', 'Insurance claim assistance included'],
    memeIdeas: ['Bucket catching drips vs. new roof reveal', 'Homeowner checking roof with binoculars', 'Before/after storm damage transformation'],
    visualStyle: 'Aerial drone shots, crew on roof at golden hour, shingle close-ups, insurance paperwork',
    keywords: ['roof repair', 'storm damage', 'insurance claim', 'free inspection', 'licensed']
  },
  {
    id: 'house-cleaning', name: 'House Cleaning', icon: Sparkles,
    hooks: ['Your house deserves better', 'Life\'s too short to clean', 'We clean so you don\'t have to'],
    offers: ['First clean 20% OFF', 'Book weekly = one clean FREE', 'Deep clean special $149'],
    memeIdeas: ['Messy room time-lapse to sparkling clean', 'Kids destroying room vs. cleaner arriving like superhero', 'Satisfying before/after split screen'],
    visualStyle: 'Bright, clean spaces, satisfying transformations, white glove details',
    keywords: ['deep clean', 'move-in ready', 'weekly service', 'eco-friendly', 'bonded']
  },
  {
    id: 'pressure-washing', name: 'Pressure Washing', icon: Droplets,
    hooks: ['You won\'t believe this is the same driveway', 'Satisfying clean in 3... 2... 1...', 'Your neighbors will be jealous'],
    offers: ['Driveway special $99', 'House wash + driveway combo $199', 'FREE demo on your property'],
    memeIdeas: ['Slow-mo pressure wash reveal', 'Drawing pictures with pressure washer', 'Split screen dirty vs clean POV'],
    visualStyle: 'ASMR close-ups, dramatic reveals, POV angle, satisfying slow motion',
    keywords: ['pressure washing', 'power washing', 'driveway', 'deck', 'siding']
  },
  {
    id: 'plumbing', name: 'Plumbing', icon: Wrench,
    hooks: ['That drip is costing you $50/month', 'Emergency plumber — we answer 24/7', 'Don\'t let a small leak become a big problem'],
    offers: ['$49 diagnostic special', 'Same-day service guaranteed', 'Senior discount 15% OFF'],
    memeIdeas: ['DIY plumbing fail compilation', 'Water bill shock face', 'Plumber arriving like a superhero'],
    visualStyle: 'Before/after pipe work, water damage prevention, tool close-ups',
    keywords: ['emergency plumber', '24/7', 'drain cleaning', 'water heater', 'licensed']
  },
  {
    id: 'hvac', name: 'HVAC', icon: Wind,
    hooks: ['Your AC is about to die this summer', 'Save $200/month on energy bills', 'Don\'t sweat it — literally'],
    offers: ['$49 tune-up special', '$500 OFF new system install', 'FREE efficiency assessment'],
    memeIdeas: ['Person melting in heat vs. cool house', 'Thermostat war in office', 'AC breaking on hottest day meme'],
    visualStyle: 'Modern HVAC equipment, comfortable families, energy savings graphics',
    keywords: ['AC repair', 'heating', 'HVAC', 'energy efficient', 'same day']
  },
  {
    id: 'painting', name: 'Painting', icon: Paintbrush,
    hooks: ['Transform any room in one day', 'Color changes everything', 'Your walls are screaming for help'],
    offers: ['FREE color consultation', '2 rooms painted = 3rd room FREE', 'Cabinet refinishing 40% OFF'],
    memeIdeas: ['Time-lapse room transformation with trending audio', 'Paint color reveal reaction', 'Before dull walls / After stunning accent wall'],
    visualStyle: 'Time-lapse painting, color palette reveals, luxury interior shots, clean lines',
    keywords: ['interior painting', 'exterior', 'cabinet refinishing', 'color consultation', 'professional']
  },
  {
    id: 'landscaping', name: 'Landscaping', icon: TreePine,
    hooks: ['Curb appeal that sells houses', 'Your yard could look like this', 'Spring is here — is your yard ready?'],
    offers: ['Spring cleanup special $199', 'Monthly maintenance from $89', 'FREE landscape design consultation'],
    memeIdeas: ['Overgrown jungle yard to magazine cover', 'Neighbor peeking at perfect lawn', 'Satisfying edging compilation'],
    visualStyle: 'Drone yard reveals, lush green close-ups, seasonal transformations',
    keywords: ['landscaping', 'lawn care', 'hardscape', 'irrigation', 'design']
  },
  {
    id: 'junk-removal', name: 'Junk Removal', icon: Truck,
    hooks: ['We haul anything — seriously anything', 'Reclaim your garage this weekend', 'Gone in 30 minutes'],
    offers: ['$50 OFF loads over $300', 'FREE on-site estimate', 'Same-day pickup available'],
    memeIdeas: ['Hoarder house transformation', 'How much junk fits in one truck challenge', 'Garage before/after with dramatic music'],
    visualStyle: 'Dramatic before/after, truck loading time-lapse, clean empty spaces',
    keywords: ['junk removal', 'cleanout', 'same day', 'eco-friendly', 'donation']
  },
  {
    id: 'general-contractor', name: 'General Contractor', icon: Building2,
    hooks: ['Build it right the first time', 'Your dream renovation starts here', 'Licensed. Insured. Guaranteed.'],
    offers: ['FREE project estimate', '10% OFF kitchen remodels', 'Financing available 0% APR'],
    memeIdeas: ['Expectation vs. reality renovation', 'Contractor showing up on time shock', 'Before/after kitchen transformation'],
    visualStyle: 'Construction progress, premium finishes, happy homeowners, blueprint overlays',
    keywords: ['renovation', 'remodel', 'construction', 'licensed', 'insured']
  },
  {
    id: 'electrical', name: 'Electrical', icon: Zap,
    hooks: ['Flickering lights? That\'s a warning', 'Old wiring is a fire hazard', 'Smart home upgrade in one day'],
    offers: ['FREE electrical safety inspection', 'Panel upgrade $500 OFF', 'Smart home package from $299'],
    memeIdeas: ['DIY electrical fail reactions', 'Old vs. new panel comparison', 'Smart home demo wow moments'],
    visualStyle: 'Clean panel installations, smart home demos, safety messaging',
    keywords: ['electrician', 'panel upgrade', 'smart home', 'safety', 'licensed']
  },
  {
    id: 'auto-repair', name: 'Auto Repair', icon: Wrench,
    hooks: ['That noise? It\'s getting worse', 'Don\'t get stranded — get inspected', 'Honest mechanics do exist'],
    offers: ['Oil change $29.99', 'FREE brake inspection', 'A/C recharge special $89'],
    memeIdeas: ['Check engine light meme', 'Mechanic finding the problem instantly', 'Car sounds compilation'],
    visualStyle: 'Shop floor action, tool close-ups, diagnostic screens, happy customers',
    keywords: ['auto repair', 'mechanic', 'brakes', 'oil change', 'honest']
  },
];

const styleModes: StyleMode[] = [
  {
    id: 'aggressive', name: 'Aggressive', icon: '\uD83D\uDD25',
    description: 'Bold, in-your-face energy. Hard cuts, loud music, urgent CTA.',
    textStyle: 'Bold Impact, Neon Yellow #DFFF00, Black shadow, Shake animation',
    voiceTone: 'High energy male, fast-paced, commanding',
    musicStyle: 'Hard beat drop, construction industrial, epic trailer',
    lightingPreset: 'High contrast, dark shadows, dramatic',
    effectsIntensity: 'Lightning, glitch, fire overlays, camera shake',
    color: 'red'
  },
  {
    id: 'funny-meme', name: 'Funny Meme', icon: '\uD83D\uDE02',
    description: 'Viral comedy style. Meme cuts, funny sounds, relatable humor.',
    textStyle: 'Comic Sans or Bebas Neue, White with black outline, Bounce animation',
    voiceTone: 'Funny energetic, exaggerated reactions, comedic timing',
    musicStyle: 'Trending TikTok audio, comedy sound effects, cartoon sounds',
    lightingPreset: 'Bright, saturated, pop colors',
    effectsIntensity: 'Zoom cuts, vine boom, GIF overlays, emoji rain',
    color: 'yellow'
  },
  {
    id: 'family-safe', name: 'Family Safe', icon: '\uD83C\uDFE1',
    description: 'Warm, trustworthy, community-focused. Clean and professional.',
    textStyle: 'Clean sans-serif, Navy blue, Soft fade-in animation',
    voiceTone: 'Friendly female, warm, reassuring, neighborhood feel',
    musicStyle: 'Uplifting acoustic, gentle piano, feel-good instrumental',
    lightingPreset: 'Warm golden, soft shadows, inviting',
    effectsIntensity: 'Subtle transitions, soft glow, gentle zoom',
    color: 'green'
  },
  {
    id: 'luxury', name: 'Luxury', icon: '\uD83D\uDC8E',
    description: 'High-end premium feel. Slow motion, elegant typography.',
    textStyle: 'Thin elegant serif, Gold/White, Slow reveal animation',
    voiceTone: 'Calm authoritative, sophisticated, measured pace',
    musicStyle: 'Cinematic orchestra, luxury brand score, ambient elegance',
    lightingPreset: 'Golden hour, lens flare, shallow depth of field',
    effectsIntensity: 'Slow motion, film grain, subtle light leaks',
    color: 'purple'
  },
  {
    id: 'storm-emergency', name: 'Storm Emergency', icon: '\u26A1',
    description: 'Urgent weather response. Dark tones, emergency energy.',
    textStyle: 'Bold condensed, Red/White, Flash animation, WARNING header',
    voiceTone: 'Deep urgent male, news anchor authority, rapid delivery',
    musicStyle: 'Dramatic tension, thunder SFX, emergency sirens, news score',
    lightingPreset: 'Dark stormy, blue-gray tones, lightning flashes',
    effectsIntensity: 'Lightning flicker, rain overlay, wind effects, screen shake',
    color: 'blue'
  },
  {
    id: 'discount-push', name: 'Discount Push', icon: '\uD83D\uDCB0',
    description: 'Sale-focused urgency. Big numbers, countdown energy.',
    textStyle: 'Ultra bold, Red/Yellow price tags, Scale-up animation',
    voiceTone: 'Excited announcer, car dealership energy, limited time urgency',
    musicStyle: 'Upbeat electronic, cash register SFX, countdown ticks',
    lightingPreset: 'Bright retail, high energy, clean white',
    effectsIntensity: 'Price tag animations, confetti, sparkle bursts, timer overlay',
    color: 'orange'
  },
];

const effectOverlays = [
  { id: 'lightning', name: 'Lightning Strike', icon: '\u26A1', description: 'Dramatic lightning flash effect' },
  { id: 'fire', name: 'Fire Overlay', icon: '\uD83D\uDD25', description: 'Burning edges or fire burst' },
  { id: 'glitch', name: 'Glitch Effect', icon: '\uD83D\uDCBB', description: 'Digital distortion and glitch' },
  { id: 'smoke', name: 'Smoke/Dust', icon: '\uD83C\uDF2B\uFE0F', description: 'Atmospheric smoke or dust particles' },
  { id: 'sparks', name: 'Spark Burst', icon: '\u2728', description: 'Metallic sparks and welding effects' },
  { id: 'rain', name: 'Rain Overlay', icon: '\uD83C\uDF27\uFE0F', description: 'Rain drops on screen' },
  { id: 'confetti', name: 'Confetti', icon: '\uD83C\uDF89', description: 'Celebration confetti burst' },
  { id: 'lens-flare', name: 'Lens Flare', icon: '\u2600\uFE0F', description: 'Cinematic light flare' },
];

const voicePresets = [
  { id: 'deep-contractor', name: 'Deep Contractor', description: 'Authoritative male, confident and commanding', icon: '\uD83D\uDC77' },
  { id: 'friendly-female', name: 'Friendly Professional', description: 'Warm female voice, trustworthy and inviting', icon: '\uD83D\uDC69\u200D\uD83D\uDCBC' },
  { id: 'energetic-meme', name: 'Energetic Meme', description: 'High energy, fast-paced, viral TikTok style', icon: '\uD83D\uDE04' },
  { id: 'calm-luxury', name: 'Calm Authority', description: 'Sophisticated, measured pace, premium brand feel', icon: '\uD83C\uDFA9' },
  { id: 'urgent-news', name: 'Urgent News', description: 'Breaking news anchor, emergency urgency', icon: '\uD83D\uDCE2' },
  { id: 'rachel-guide', name: 'Rachel (Platform Voice)', description: 'Disaster Direct signature voice guide', icon: '\uD83C\uDF99\uFE0F' },
];

const engineIcons: Record<string, { icon: any; gradient: string; badge: string }> = {
  'cinematic-ai': { icon: Film, gradient: 'from-cyan-500 to-blue-600', badge: 'Ready Now' },
  'openai-sora': { icon: Crown, gradient: 'from-emerald-500 to-teal-600', badge: 'Most Realistic' },
  'runway-gen3': { icon: Star, gradient: 'from-violet-500 to-purple-600', badge: 'Best Overall' },
  'luma-dream-machine': { icon: Sparkles, gradient: 'from-amber-500 to-orange-600', badge: 'Beautiful Lighting' },
  'pika-labs': { icon: Zap, gradient: 'from-pink-500 to-rose-600', badge: 'Fastest Social' },
  'synthesia': { icon: Users, gradient: 'from-blue-500 to-indigo-600', badge: 'AI Presenters' },
  'runway-full-suite': { icon: Settings2, gradient: 'from-slate-500 to-gray-600', badge: 'Full Editing' },
};

const engineDescriptions: Record<string, string> = {
  'cinematic-ai': 'AI-generated multi-scene motion video with real people, Ken Burns camera movement, smooth transitions, and professional pacing. Ready to use now.',
  'openai-sora': 'Fully generative videos with real motion, consistent scenes, and natural human movement. Physics-aware — the most realistic AI video.',
  'runway-gen3': 'Director-level control with cinematic camera movement, depth of field, realistic lighting, and motion blur. Broadcast-quality.',
  'luma-dream-machine': 'Cinematic lighting specialist. Outdoor golden-hour scenes with dramatic sunlight rays. Luxury documentary feel.',
  'pika-labs': 'Quick turnaround for short social clips. Best for TikTok, Reels, and trend-based content. Stylized and punchy.',
  'synthesia': 'AI avatar presenter videos with realistic talking heads. Script-to-video in 140+ languages.',
  'runway-full-suite': 'Complete video editing suite with advanced compositing, inpainting, motion brush, green screen, and style transfer.',
};

export default function AIVideoGenerator() {
  const { toast } = useToast();
  const [mainTab, setMainTab] = useState('create');
  const [selectedIndustry, setSelectedIndustry] = useState<string>('tree-service');
  const [selectedStyle, setSelectedStyle] = useState<string>('aggressive');
  const [selectedEngine, setSelectedEngine] = useState<string>('cinematic-ai');
  const [prompt, setPrompt] = useState('');
  const [duration, setDuration] = useState('12');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [resolution, setResolution] = useState('1080p');
  const [selectedEffects, setSelectedEffects] = useState<string[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('deep-contractor');
  const [activeJob, setActiveJob] = useState<VideoGenJob | null>(null);
  const [generatedVideos, setGeneratedVideos] = useState<VideoGenJob[]>([]);
  const [showEngineDetails, setShowEngineDetails] = useState(false);
  const [scriptResult, setScriptResult] = useState<ScriptResult | null>(null);
  const [scriptInput, setScriptInput] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [searchMeme, setSearchMeme] = useState('');
  const [memeResults, setMemeResults] = useState<any[]>([]);
  const [selectedMemes, setSelectedMemes] = useState<any[]>([]);
  const [editMessages, setEditMessages] = useState<EditMessage[]>([]);
  const [editInput, setEditInput] = useState('');
  const [versions, setVersions] = useState<VideoVersion[]>([]);
  const [activeVersion, setActiveVersion] = useState<number>(0);
  const [isEditing, setIsEditing] = useState(false);
  const [brandPhoto, setBrandPhoto] = useState<File | null>(null);
  const [enableVoiceover, setEnableVoiceover] = useState(true);
  const [selectedElevenVoice, setSelectedElevenVoice] = useState('deep-male');
  const editChatRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const { data: enginesData } = useQuery<{ success: boolean; engines: VideoEngine[] }>({
    queryKey: ['/api/video-gen/engines'],
  });

  const engines = enginesData?.engines || [];

  const generateMutation = useMutation({
    mutationFn: async (params: { engine: string; prompt: string; options: any }) => {
      const res = await apiRequest('/api/video-gen/generate', 'POST', params);
      return res;
    },
    onSuccess: (data: any) => {
      if (data.success && data.job) {
        setActiveJob(data.job);
        toast({ title: 'Video Generation Started!', description: `${getEngineName(data.job.engine)} is creating your video...` });
        startPolling(data.job.engine, data.job.id);
      }
    },
    onError: (error: any) => {
      toast({ title: 'Generation Failed', description: error.message || 'Could not start video generation', variant: 'destructive' });
    }
  });

  const scriptMutation = useMutation({
    mutationFn: async (params: { industry: string; style: string; input: string }) => {
      const res = await apiRequest('/api/ai-ads/generate-script', 'POST', params);
      return res;
    },
    onSuccess: (data: any) => {
      if (data.script) {
        setScriptResult(data.script);
        toast({ title: 'Script Generated!', description: 'Your AI script is ready with hook, offer, CTA, and platform captions.' });
      }
    },
    onError: () => {
      const industry = industries.find(i => i.id === selectedIndustry);
      const style = styleModes.find(s => s.id === selectedStyle);
      if (industry) {
        setScriptResult({
          hook: industry.hooks[Math.floor(Math.random() * industry.hooks.length)],
          offer: industry.offers[Math.floor(Math.random() * industry.offers.length)],
          body: `Professional ${industry.name.toLowerCase()} services you can trust. Licensed, insured, and ready to serve your community.`,
          cta: `Call today for a FREE estimate! ${industry.name} experts standing by.`,
          hashtags: industry.keywords.map(k => `#${k.replace(/\s+/g, '')}`),
          captions: [
            { platform: 'TikTok', text: `${industry.hooks[0]} ${industry.offers[0]} Link in bio! ${industry.keywords.slice(0, 3).map(k => `#${k.replace(/\s+/g, '')}`).join(' ')}` },
            { platform: 'Facebook', text: `${industry.hooks[0]}\n\n${industry.offers[0]}\n\nLicensed & Insured. Call now!` },
            { platform: 'Instagram', text: `${industry.hooks[0]} \u2728\n\n${industry.offers[0]}\n\nDM us or call for a free estimate!\n\n${industry.keywords.map(k => `#${k.replace(/\s+/g, '')}`).join(' ')}` },
          ],
          voiceSuggestion: style?.voiceTone || 'Professional and confident',
          musicSuggestion: style?.musicStyle || 'Upbeat commercial instrumental',
        });
        toast({ title: 'Script Generated!', description: 'AI script created from industry templates.' });
      }
    }
  });

  const getEngineName = (id: string) => engines.find(e => e.id === id)?.name || id;

  const startPolling = (engine: string, jobId: string) => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/video-gen/job/${engine}/${jobId}`);
        const data = await res.json();
        if (data.success && data.job) {
          setActiveJob(data.job);
          if (data.job.status === 'completed') {
            clearInterval(pollRef.current!);
            pollRef.current = null;
            setGeneratedVideos(prev => [data.job, ...prev]);
            setVersions(prev => {
              const updated = prev.map(v => (!v.job || v.job.status === 'processing' || v.job.status === 'queued') && v.settings.engine === data.job.engine ? { ...v, job: data.job } : v);
              return updated;
            });
            toast({ title: 'Video Ready!', description: 'Your AI-generated video is ready to preview and download.' });
          } else if (data.job.status === 'failed') {
            clearInterval(pollRef.current!);
            pollRef.current = null;
            toast({ title: 'Generation Failed', description: data.job.error || 'Video generation failed', variant: 'destructive' });
          }
        }
      } catch { /* retry */ }
    }, 3000);
  };

  useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({ title: 'Describe Your Video', description: 'Tell the AI what video you want to create', variant: 'destructive' });
      return;
    }
    const industry = industries.find(i => i.id === selectedIndustry);
    const style = styleModes.find(s => s.id === selectedStyle);
    const voice = voicePresets.find(v => v.id === selectedVoice);
    const effectNames = selectedEffects.map(e => effectOverlays.find(o => o.id === e)?.name).filter(Boolean);

    const enhancedPrompt = [
      prompt.trim(),
      industry ? `Industry: ${industry.name}. Visual style: ${industry.visualStyle}.` : '',
      style ? `Mood: ${style.name}. Lighting: ${style.lightingPreset}. Effects: ${style.effectsIntensity}.` : '',
      voice ? `Voice direction: ${voice.description}.` : '',
      effectNames.length > 0 ? `Add effects: ${effectNames.join(', ')}.` : '',
      `Resolution: ${resolution}. Aspect ratio: ${aspectRatio}. Duration: ${duration} seconds.`,
    ].filter(Boolean).join(' ');

    // Use the Hollywood cinematic endpoint when Cinematic AI is selected
    if (selectedEngine === 'cinematic-ai') {
      const formData = new FormData();
      formData.append('prompt', enhancedPrompt);
      formData.append('industry', selectedIndustry);
      formData.append('voice', selectedElevenVoice);
      formData.append('enableVoiceover', enableVoiceover ? 'true' : 'false');
      formData.append('duration', duration);
      formData.append('style', selectedStyle);
      formData.append('multiFormat', 'true');
      if (brandPhoto) formData.append('photo', brandPhoto);

      try {
        const res = await fetch('/api/video-gen/generate-cinematic', { method: 'POST', body: formData });
        const data = await res.json();
        if (data.success && data.job) {
          setActiveJob(data.job);
          toast({ title: '🎬 Hollywood Engine Started!', description: `Generating scenes, voiceover, and 3 social formats...` });
          startPolling(data.job.engine, data.job.id);
        } else {
          toast({ title: 'Generation Failed', description: data.error || 'Could not start video generation', variant: 'destructive' });
        }
      } catch (err: any) {
        toast({ title: 'Generation Failed', description: err.message || 'Network error', variant: 'destructive' });
      }
      return;
    }

    generateMutation.mutate({
      engine: selectedEngine,
      prompt: enhancedPrompt,
      options: { duration: parseInt(duration), aspectRatio, resolution, style: selectedStyle }
    });
  };

  const handleGenerateScript = () => {
    const input = scriptInput.trim() || `Create a ${selectedStyle} ad for ${industries.find(i => i.id === selectedIndustry)?.name}`;
    scriptMutation.mutate({ industry: selectedIndustry, style: selectedStyle, input });
  };

  const searchMemes = async () => {
    if (!searchMeme.trim()) return;
    try {
      const res = await fetch(`/api/ai-ads/search-memes?q=${encodeURIComponent(searchMeme)}`);
      const data = await res.json();
      if (data.success && data.results) {
        setMemeResults(data.results);
      } else {
        setMemeResults([]);
      }
    } catch {
      toast({ title: 'Meme Search', description: 'Could not fetch memes. Try again later.', variant: 'destructive' });
    }
  };

  const editMutation = useMutation({
    mutationFn: async (params: { message: string; currentPrompt: string; currentSettings: any }) => {
      const res = await apiRequest('/api/video-gen/edit', 'POST', params);
      return res;
    },
    onSuccess: (data: any) => {
      if (data.success && data.edit) {
        const edit = data.edit;
        const aiMsg: EditMessage = {
          id: `ai-${Date.now()}`,
          role: 'ai',
          content: edit.summary || 'Changes applied to your video.',
          timestamp: Date.now(),
          appliedChanges: edit
        };
        setEditMessages(prev => [...prev, aiMsg]);

        if (edit.settingsChanges) {
          if (edit.settingsChanges.addEffects) {
            setSelectedEffects(prev => [...new Set([...prev, ...edit.settingsChanges.addEffects])]);
          }
          if (edit.settingsChanges.removeEffects) {
            setSelectedEffects(prev => prev.filter(e => !edit.settingsChanges.removeEffects.includes(e)));
          }
          if (edit.settingsChanges.style) setSelectedStyle(edit.settingsChanges.style);
          if (edit.settingsChanges.duration) setDuration(String(edit.settingsChanges.duration));
          if (edit.settingsChanges.aspectRatio) setAspectRatio(edit.settingsChanges.aspectRatio);
          if (edit.settingsChanges.resolution) setResolution(edit.settingsChanges.resolution);
          if (edit.settingsChanges.voice) setSelectedVoice(edit.settingsChanges.voice);
        }
        if (edit.updatedPrompt && typeof edit.updatedPrompt === 'string') {
          setPrompt(edit.updatedPrompt);
        }

        setTimeout(() => {
          editChatRef.current?.scrollTo({ top: editChatRef.current.scrollHeight, behavior: 'smooth' });
        }, 100);
      }
    },
    onError: () => {
      const aiMsg: EditMessage = {
        id: `ai-${Date.now()}`,
        role: 'ai',
        content: 'I applied your changes to the prompt directly. Click "Re-render" to generate the updated video.',
        timestamp: Date.now()
      };
      setEditMessages(prev => [...prev, aiMsg]);
    }
  });

  const handleSendEdit = () => {
    if (!editInput.trim()) return;
    const userMsg: EditMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: editInput.trim(),
      timestamp: Date.now()
    };
    setEditMessages(prev => [...prev, userMsg]);
    
    const currentVersion = versions[activeVersion];
    editMutation.mutate({
      message: editInput.trim(),
      currentPrompt: prompt,
      currentSettings: {
        engine: selectedEngine,
        duration: parseInt(duration),
        aspectRatio,
        resolution,
        style: selectedStyle,
        effects: selectedEffects,
        voice: selectedVoice,
        industry: selectedIndustry
      }
    });
    setEditInput('');
  };

  const handleOpenEditor = (job: VideoGenJob) => {
    const v: VideoVersion = {
      id: `v-${job.id}-${Date.now()}`,
      version: versions.length + 1,
      prompt: job.prompt || prompt,
      settings: {
        engine: job.engine || selectedEngine,
        duration,
        aspectRatio,
        resolution,
        style: selectedStyle,
        effects: [...selectedEffects],
        voice: selectedVoice,
        industry: selectedIndustry
      },
      job,
      editNotes: 'Original generation',
      createdAt: Date.now()
    };
    setPrompt(job.prompt || prompt);
    setVersions([v]);
    setActiveVersion(0);
    setEditMessages([{
      id: 'system-start',
      role: 'ai',
      content: `Video ready! Tell me what you want to change. Try things like:\n• "Add lightning effects"\n• "Make it darker and more dramatic"\n• "Change to vertical for TikTok"\n• "Add bold yellow text saying CALL NOW"\n• "Make it more aggressive"\n• "Speed it up"`,
      timestamp: Date.now()
    }]);
    setMainTab('edit');
    setIsEditing(true);
  };

  const handleRerender = () => {
    const currentVer = versions[activeVersion];
    const industry = industries.find(i => i.id === selectedIndustry);
    const style = styleModes.find(s => s.id === selectedStyle);
    const voice = voicePresets.find(v => v.id === selectedVoice);
    const effectNames = selectedEffects.map(e => effectOverlays.find(o => o.id === e)?.name).filter(Boolean);

    const enhancedPrompt = [
      prompt.trim(),
      industry ? `Industry: ${industry.name}. Visual style: ${industry.visualStyle}.` : '',
      style ? `Mood: ${style.name}. Lighting: ${style.lightingPreset}. Effects: ${style.effectsIntensity}.` : '',
      voice ? `Voice direction: ${voice.description}.` : '',
      effectNames.length > 0 ? `Add effects: ${effectNames.join(', ')}.` : '',
      `Resolution: ${resolution}. Aspect ratio: ${aspectRatio}. Duration: ${duration} seconds.`,
    ].filter(Boolean).join(' ');

    const newVersion: VideoVersion = {
      id: `v-${Date.now()}`,
      version: versions.length + 1,
      prompt: enhancedPrompt,
      settings: {
        engine: selectedEngine,
        duration,
        aspectRatio,
        resolution,
        style: selectedStyle,
        effects: [...selectedEffects],
        voice: selectedVoice,
        industry: selectedIndustry
      },
      job: null,
      editNotes: editMessages.filter(m => m.role === 'user').slice(-3).map(m => m.content).join('; ') || 'Re-rendered',
      createdAt: Date.now()
    };

    setVersions(prev => [...prev, newVersion]);
    setActiveVersion(versions.length);

    generateMutation.mutate({
      engine: selectedEngine,
      prompt: enhancedPrompt,
      options: { duration: parseInt(duration), aspectRatio, resolution, style: selectedStyle }
    });
    setEditMessages(prev => [...prev, {
      id: `ai-rerender-${Date.now()}`,
      role: 'ai',
      content: `Re-rendering video (v${newVersion.version}) with your changes. This may take 60-120 seconds...`,
      timestamp: Date.now()
    }]);
  };

  const copyText = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
    toast({ title: 'Copied!' });
  };

  const currentIndustry = industries.find(i => i.id === selectedIndustry);
  const currentStyle = styleModes.find(s => s.id === selectedStyle);

  const sceneTemplates = [
    { name: 'Hook (0-3s)', desc: currentIndustry?.hooks[0] || 'Dramatic opening that stops the scroll', icon: '\u26A1' },
    { name: 'Power Entry (3-7s)', desc: `${currentIndustry?.name} crew arriving — equipment, uniforms, authority`, icon: '\uD83D\uDD25' },
    { name: 'Money Shot (7-12s)', desc: currentIndustry?.offers[0] || 'The main offer drops — big text, sound effect', icon: '\uD83C\uDFAC' },
    { name: 'Authority (12-18s)', desc: `Equipment showcase, before/after, ${currentIndustry?.name} expertise`, icon: '\uD83D\uDCAA' },
    { name: 'CTA Close (18-25s)', desc: 'Clean result reveal, phone number, logo, call to action', icon: '\uD83D\uDCDE' },
  ];

  return (
    <div className="space-y-4">
      <Tabs value={mainTab} onValueChange={setMainTab}>
        <TabsList className="grid grid-cols-7 w-full max-w-4xl">
          <TabsTrigger value="create" className="flex items-center gap-1.5 text-xs">
            <Film className="w-3.5 h-3.5" /> Create
          </TabsTrigger>
          <TabsTrigger value="edit" className="flex items-center gap-1.5 text-xs relative">
            <PenTool className="w-3.5 h-3.5" /> Edit
            {versions.length > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-violet-600 text-white rounded-full text-[8px] flex items-center justify-center">{versions.length}</span>}
          </TabsTrigger>
          <TabsTrigger value="script" className="flex items-center gap-1.5 text-xs">
            <Type className="w-3.5 h-3.5" /> Script
          </TabsTrigger>
          <TabsTrigger value="voice" className="flex items-center gap-1.5 text-xs">
            <Mic className="w-3.5 h-3.5" /> Voice
          </TabsTrigger>
          <TabsTrigger value="effects" className="flex items-center gap-1.5 text-xs">
            <CloudLightning className="w-3.5 h-3.5" /> Effects
          </TabsTrigger>
          <TabsTrigger value="export" className="flex items-center gap-1.5 text-xs">
            <Share2 className="w-3.5 h-3.5" /> Export
          </TabsTrigger>
          <TabsTrigger value="engines" className="flex items-center gap-1.5 text-xs">
            <Settings2 className="w-3.5 h-3.5" /> Engines
          </TabsTrigger>
        </TabsList>

        <TabsContent value="create">
          <div className="grid lg:grid-cols-5 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <Card className="border-2 border-violet-200 dark:border-violet-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-violet-600" />
                    Industry
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {industries.map(ind => (
                        <SelectItem key={ind.id} value={ind.id}>
                          <div className="flex items-center gap-2">
                            <ind.icon className="w-4 h-4" />
                            <span>{ind.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {currentIndustry && (
                    <div className="mt-2 p-2 rounded-lg bg-violet-50 dark:bg-violet-950/20 border border-violet-100 dark:border-violet-900">
                      <p className="text-[10px] text-violet-600 dark:text-violet-400 font-medium mb-1">Pre-built for {currentIndustry.name}:</p>
                      <div className="flex flex-wrap gap-1">
                        {currentIndustry.keywords.map((k, i) => (
                          <Badge key={i} variant="outline" className="text-[8px] px-1 py-0">{k}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-2 border-amber-200 dark:border-amber-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Palette className="w-4 h-4 text-amber-600" />
                    Style Mode
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-2">
                    {styleModes.map(sm => (
                      <button
                        key={sm.id}
                        onClick={() => setSelectedStyle(sm.id)}
                        className={`relative flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 transition-all text-center ${
                          selectedStyle === sm.id
                            ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/30 shadow-md'
                            : 'border-slate-200 dark:border-slate-700 hover:border-amber-300'
                        }`}
                      >
                        {selectedStyle === sm.id && (
                          <div className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-amber-500 flex items-center justify-center">
                            <CheckCircle className="w-2 h-2 text-white" />
                          </div>
                        )}
                        <span className="text-xl">{sm.icon}</span>
                        <span className="font-semibold text-[10px]">{sm.name}</span>
                      </button>
                    ))}
                  </div>
                  {currentStyle && (
                    <div className="mt-2 p-2 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900 space-y-1">
                      <p className="text-[10px] text-amber-700 dark:text-amber-400 font-medium">{currentStyle.description}</p>
                      <div className="grid grid-cols-2 gap-1 text-[9px] text-amber-600 dark:text-amber-400">
                        <span><strong>Voice:</strong> {currentStyle.voiceTone.split(',')[0]}</span>
                        <span><strong>Music:</strong> {currentStyle.musicStyle.split(',')[0]}</span>
                        <span><strong>Lighting:</strong> {currentStyle.lightingPreset.split(',')[0]}</span>
                        <span><strong>Effects:</strong> {currentStyle.effectsIntensity.split(',')[0]}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Settings2 className="w-4 h-4 text-slate-600" />
                    AI Engine & Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Select value={selectedEngine} onValueChange={setSelectedEngine}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {engines.map(engine => {
                        const meta = engineIcons[engine.id];
                        return (
                          <SelectItem key={engine.id} value={engine.id} disabled={engine.status === 'coming_soon'}>
                            <div className="flex items-center gap-2">
                              {meta && <meta.icon className="w-4 h-4" />}
                              <span>{engine.name}</span>
                              {engine.status === 'ready' && <Badge className="text-[8px] px-1 py-0 bg-green-500">Ready</Badge>}
                              {engine.status === 'needs_key' && <Badge variant="outline" className="text-[8px] px-1 py-0 text-amber-600">Needs Key</Badge>}
                              {engine.status === 'coming_soon' && <Badge variant="outline" className="text-[8px] px-1 py-0">Soon</Badge>}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  {engineDescriptions[selectedEngine] && (
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      {engineDescriptions[selectedEngine]}
                    </p>
                  )}
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] font-medium text-slate-500 mb-0.5 block">Duration</label>
                      <Select value={duration} onValueChange={setDuration}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {['5','8','10','15','20','30'].map(d => <SelectItem key={d} value={d}>{d}s</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-[10px] font-medium text-slate-500 mb-0.5 block">Ratio</label>
                      <Select value={aspectRatio} onValueChange={setAspectRatio}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="16:9">16:9</SelectItem>
                          <SelectItem value="9:16">9:16</SelectItem>
                          <SelectItem value="1:1">1:1</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-[10px] font-medium text-slate-500 mb-0.5 block">Quality</label>
                      <Select value={resolution} onValueChange={setResolution}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="720p">720p</SelectItem>
                          <SelectItem value="1080p">1080p</SelectItem>
                          <SelectItem value="4k">4K</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Describe your video</label>
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={`Type what you want... e.g., "Make a funny aggressive ${currentIndustry?.name?.toLowerCase() || 'storm'} ad"`}
                  className="min-h-[80px] resize-none text-sm"
                />
              </div>

              {/* Hollywood Features Panel - only for Cinematic AI */}
              {selectedEngine === 'cinematic-ai' && (
                <Card className="border border-violet-200 dark:border-violet-800 bg-gradient-to-br from-violet-50/50 to-purple-50/50 dark:from-violet-950/20 dark:to-purple-950/20">
                  <CardContent className="pt-4 pb-3 space-y-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Crown className="w-4 h-4 text-violet-500" />
                      <span className="text-xs font-bold text-violet-700 dark:text-violet-300 uppercase tracking-wide">Hollywood Engine Options</span>
                    </div>

                    {/* ElevenLabs Voiceover */}
                    <div className="flex items-center justify-between gap-3 bg-white dark:bg-slate-900 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
                      <div className="flex items-center gap-2">
                        <Mic className="w-4 h-4 text-violet-500" />
                        <div>
                          <p className="text-xs font-semibold">AI Trailer Voiceover</p>
                          <p className="text-[10px] text-slate-500">ElevenLabs deep narrator</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Select value={selectedElevenVoice} onValueChange={setSelectedElevenVoice} disabled={!enableVoiceover}>
                          <SelectTrigger className="h-7 text-xs w-28">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="deep-male">Deep Male</SelectItem>
                            <SelectItem value="dramatic">Dramatic</SelectItem>
                            <SelectItem value="professional">Professional</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="energetic">Energetic</SelectItem>
                          </SelectContent>
                        </Select>
                        <button
                          onClick={() => setEnableVoiceover(!enableVoiceover)}
                          className={`relative w-10 h-5 rounded-full transition-colors ${enableVoiceover ? 'bg-violet-600' : 'bg-slate-300 dark:bg-slate-600'}`}
                        >
                          <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${enableVoiceover ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                      </div>
                    </div>

                    {/* Brand Photo Upload */}
                    <div className="bg-white dark:bg-slate-900 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Image className="w-4 h-4 text-violet-500" />
                          <div>
                            <p className="text-xs font-semibold">Brand Photo (Optional)</p>
                            <p className="text-[10px] text-slate-500">Your crew/logo added as scene 1</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {brandPhoto && (
                            <span className="text-[10px] text-green-600 font-medium max-w-[80px] truncate">{brandPhoto.name}</span>
                          )}
                          <Button size="sm" variant="outline" className="h-7 text-xs px-2" onClick={() => photoInputRef.current?.click()}>
                            {brandPhoto ? 'Change' : 'Upload'}
                          </Button>
                          {brandPhoto && (
                            <Button size="sm" variant="ghost" className="h-7 text-xs px-1 text-slate-400 hover:text-red-500" onClick={() => setBrandPhoto(null)}>✕</Button>
                          )}
                        </div>
                      </div>
                      <input
                        ref={photoInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) setBrandPhoto(f); }}
                      />
                    </div>

                    {/* Social Format Info */}
                    <div className="flex items-center gap-3 text-[10px] text-slate-500">
                      <span className="flex items-center gap-1"><span className="text-red-500">▶</span> YouTube 16:9</span>
                      <span className="flex items-center gap-1"><span className="text-pink-500">◆</span> Reels 9:16</span>
                      <span className="flex items-center gap-1"><span className="text-blue-500">f</span> Facebook 1:1</span>
                      <span className="ml-auto text-green-600 font-medium">3 formats auto-rendered</span>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div>
                <Button
                  className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-semibold py-5"
                  onClick={handleGenerate}
                  disabled={generateMutation.isPending || activeJob?.status === 'processing' || activeJob?.status === 'queued'}
                >
                  {generateMutation.isPending || activeJob?.status === 'processing' || activeJob?.status === 'queued' ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating Hollywood Video...</>
                  ) : (
                    <><Film className="w-4 h-4 mr-2" /> {selectedEngine === 'cinematic-ai' ? '🎬 Generate Hollywood Video' : 'Generate AI Video'}</>
                  )}
                </Button>
              </div>
            </div>

            <div className="lg:col-span-3 space-y-4">
              {(activeJob?.status === 'processing' || activeJob?.status === 'queued') && (
                <Card className="border-2 border-violet-300 dark:border-violet-700">
                  <CardContent className="py-12 text-center">
                    <div className="relative mx-auto w-20 h-20 mb-4">
                      <div className="absolute inset-0 rounded-full border-4 border-violet-200 dark:border-violet-800" />
                      <div className="absolute inset-0 rounded-full border-4 border-violet-600 border-t-transparent animate-spin" />
                      <Film className="w-8 h-8 text-violet-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                    </div>
                    <h3 className="text-lg font-bold mb-2">{getEngineName(activeJob.engine)} is creating your video...</h3>
                    <p className="text-sm text-slate-500 mb-3">Real cinematic video with motion and physics. Takes 60-120 seconds.</p>
                    <Progress value={activeJob.status === 'processing' ? 65 : 15} className="h-2 max-w-xs mx-auto mb-2" />
                    <div className="mt-3 p-2 rounded-lg bg-slate-50 dark:bg-slate-800 max-w-sm mx-auto">
                      <p className="text-[10px] text-slate-500 italic">"{activeJob.prompt.slice(0, 100)}..."</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {activeJob?.status === 'completed' && activeJob.videoUrl && (
                <Card className="border-2 border-green-200 dark:border-green-800">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <CheckCircle className="w-5 h-5 text-green-600" /> Hollywood Video Ready
                      </CardTitle>
                      <Badge className="bg-green-100 text-green-700 text-xs">{getEngineName(activeJob.engine)}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="rounded-xl overflow-hidden bg-black aspect-video">
                      <video src={activeJob.videoUrl} controls autoPlay className="w-full h-full object-contain" />
                    </div>

                    {/* Narration Script */}
                    {(activeJob as any).narrationScript && (
                      <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-2 mb-1">
                          <Mic className="w-3.5 h-3.5 text-violet-500" />
                          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">AI Narration Script</span>
                        </div>
                        <p className="text-sm text-slate-700 dark:text-slate-300 italic">"{(activeJob as any).narrationScript}"</p>
                      </div>
                    )}

                    {/* Social Format Downloads */}
                    {(activeJob as any).formats && (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                          <Smartphone className="w-3.5 h-3.5" /> Download for Social Media
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                          {(activeJob as any).formats.youtube && (
                            <Button size="sm" variant="outline" className="flex flex-col h-auto py-2 border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-950" onClick={() => { const a = document.createElement('a'); a.href = (activeJob as any).formats.youtube; a.download = `youtube-16x9-${Date.now()}.mp4`; a.click(); }}>
                              <span className="text-red-600 font-bold text-xs">▶ YouTube</span>
                              <span className="text-slate-400 text-[10px]">16:9 HD</span>
                            </Button>
                          )}
                          {(activeJob as any).formats.reels && (
                            <Button size="sm" variant="outline" className="flex flex-col h-auto py-2 border-pink-200 hover:bg-pink-50 dark:border-pink-800 dark:hover:bg-pink-950" onClick={() => { const a = document.createElement('a'); a.href = (activeJob as any).formats.reels; a.download = `reels-9x16-${Date.now()}.mp4`; a.click(); }}>
                              <span className="text-pink-600 font-bold text-xs">◆ Reels</span>
                              <span className="text-slate-400 text-[10px]">9:16 Vertical</span>
                            </Button>
                          )}
                          {(activeJob as any).formats.facebook && (
                            <Button size="sm" variant="outline" className="flex flex-col h-auto py-2 border-blue-200 hover:bg-blue-50 dark:border-blue-800 dark:hover:bg-blue-950" onClick={() => { const a = document.createElement('a'); a.href = (activeJob as any).formats.facebook; a.download = `facebook-square-${Date.now()}.mp4`; a.click(); }}>
                              <span className="text-blue-600 font-bold text-xs">f Facebook</span>
                              <span className="text-slate-400 text-[10px]">1:1 Square</span>
                            </Button>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button className="flex-1 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white" onClick={() => handleOpenEditor(activeJob)}>
                        <PenTool className="w-4 h-4 mr-1" /> Edit with AI
                      </Button>
                      <Button variant="outline" onClick={() => {
                        const a = document.createElement('a'); a.href = activeJob.videoUrl!; a.download = `cinematic-${Date.now()}.mp4`; a.click();
                      }}><Download className="w-4 h-4 mr-1" /> Download</Button>
                      <Button variant="outline" onClick={() => { setActiveJob(null); setPrompt(''); setBrandPhoto(null); }}>
                        <RefreshCw className="w-4 h-4 mr-1" /> New
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {activeJob?.status === 'failed' && (
                <Card className="border-2 border-red-200 dark:border-red-800">
                  <CardContent className="py-6 text-center">
                    <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
                    <h3 className="font-bold mb-1">Generation Failed</h3>
                    <p className="text-sm text-slate-500 mb-3">{activeJob.error || 'An error occurred.'}</p>
                    <Button onClick={() => setActiveJob(null)} variant="outline" size="sm"><RefreshCw className="w-3 h-3 mr-1" /> Try Again</Button>
                  </CardContent>
                </Card>
              )}

              {!activeJob && (
                <>
                  <Card className="bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/20 dark:to-purple-950/20 border-violet-200 dark:border-violet-800">
                    <CardContent className="py-8 text-center">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-r from-violet-500 to-purple-600 mx-auto mb-4 flex items-center justify-center">
                        <Film className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-xl font-bold mb-2">Contractor AI Video Engine</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto mb-1">
                        Type what you want. AI builds your video. Real cinematic motion — not slideshows.
                      </p>
                      <p className="text-xs text-slate-500 mb-4">
                        12 industries | 6 style modes | 6 AI engines | Effects, voice, music, memes
                      </p>
                      <div className="grid grid-cols-3 md:grid-cols-6 gap-2 max-w-2xl mx-auto">
                        {engines.map(engine => {
                          const meta = engineIcons[engine.id];
                          return (
                            <button key={engine.id} onClick={() => engine.status !== 'coming_soon' && setSelectedEngine(engine.id)}
                              className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all ${
                                selectedEngine === engine.id ? 'border-violet-500 bg-white dark:bg-slate-800 shadow-md' : 'border-slate-200 dark:border-slate-700'
                              } ${engine.status === 'coming_soon' ? 'opacity-50' : ''}`}>
                              {meta && <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${meta.gradient} flex items-center justify-center`}><meta.icon className="w-3.5 h-3.5 text-white" /></div>}
                              <span className="text-[8px] font-semibold text-center leading-tight">{engine.name.split(' ').slice(0, 2).join(' ')}</span>
                              {engine.status === 'ready' && <div className="w-1.5 h-1.5 rounded-full bg-green-500" />}
                              {engine.status === 'needs_key' && <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
                            </button>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>

                  <div>
                    <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                      <Clapperboard className="w-4 h-4 text-violet-500" />
                      Commercial Scene Builder — {currentIndustry?.name}
                    </h3>
                    <div className="grid grid-cols-5 gap-2">
                      {sceneTemplates.map((scene, i) => (
                        <button key={i} onClick={() => setPrompt(prev => prev ? `${prev}. ${scene.desc}` : scene.desc)}
                          className="p-2.5 rounded-xl border-2 border-slate-200 dark:border-slate-700 hover:border-violet-300 bg-white dark:bg-slate-800 text-left transition-all hover:shadow-md">
                          <div className="text-base mb-0.5">{scene.icon}</div>
                          <h4 className="text-[10px] font-bold mb-0.5">{scene.name}</h4>
                          <p className="text-[9px] text-slate-500 leading-tight">{scene.desc.slice(0, 60)}...</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {currentIndustry && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-violet-500" />
                          Quick Prompts — {currentIndustry.name}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid md:grid-cols-2 gap-2">
                          {[
                            `Make a ${currentStyle?.name.toLowerCase()} ad for ${currentIndustry.name}: ${currentIndustry.hooks[0]}. ${currentIndustry.offers[0]}`,
                            `Cinematic ${currentIndustry.name.toLowerCase()} commercial: ${currentIndustry.visualStyle}`,
                            `Viral TikTok for ${currentIndustry.name.toLowerCase()}: ${currentIndustry.memeIdeas[0]}`,
                          ].map((p, i) => (
                            <button key={i} onClick={() => setPrompt(p)}
                              className="text-left text-[11px] p-2 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-violet-50 dark:hover:bg-violet-900/20 text-slate-700 dark:text-slate-300 border border-transparent hover:border-violet-200 leading-relaxed">
                              <span className="text-violet-500 mr-1">{'\u25B6'}</span>{p}
                            </button>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {generatedVideos.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold mb-2 flex items-center gap-2"><Video className="w-4 h-4 text-violet-500" /> Generated ({generatedVideos.length})</h3>
                      <div className="grid md:grid-cols-2 gap-3">
                        {generatedVideos.map((video, i) => (
                          <Card key={i} className="overflow-hidden">
                            {video.videoUrl && <div className="aspect-video bg-black"><video src={video.videoUrl} controls className="w-full h-full object-contain" /></div>}
                            <CardContent className="pt-2 pb-2">
                              <div className="flex items-center justify-between mb-1">
                                <Badge variant="outline" className="text-[9px]">{getEngineName(video.engine)}</Badge>
                                <span className="text-[10px] text-slate-400">{new Date(video.createdAt).toLocaleTimeString()}</span>
                              </div>
                              <p className="text-[10px] text-slate-500 line-clamp-1">{video.prompt}</p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="edit">
          {versions.length === 0 ? (
            <Card className="bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-950/20 dark:to-violet-950/20 border-indigo-200 dark:border-indigo-800">
              <CardContent className="py-16 text-center">
                <PenTool className="w-16 h-16 text-indigo-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">AI Video Editor</h3>
                <p className="text-sm text-slate-500 max-w-md mx-auto mb-4">
                  Generate a video first, then open it here to edit with AI. Tell the AI what changes you want — add effects, change lighting, adjust text — then re-render.
                </p>
                <Button onClick={() => setMainTab('create')} className="bg-gradient-to-r from-violet-600 to-purple-600 text-white">
                  <Film className="w-4 h-4 mr-2" /> Go to Create Video
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid lg:grid-cols-12 gap-4">
              <div className="lg:col-span-3 space-y-3">
                <Card className="border-2 border-indigo-200 dark:border-indigo-800">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <History className="w-4 h-4 text-indigo-600" /> Versions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1.5">
                    {versions.map((v, i) => (
                      <button key={v.id} onClick={() => setActiveVersion(i)}
                        className={`w-full text-left p-2.5 rounded-lg border-2 transition-all ${
                          activeVersion === i ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30' : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300'
                        }`}>
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-xs font-bold flex items-center gap-1">
                            <GitBranch className="w-3 h-3" /> v{v.version}
                          </span>
                          {v.job?.status === 'completed' && <div className="w-2 h-2 rounded-full bg-green-500" />}
                          {v.job?.status === 'processing' && <Loader2 className="w-3 h-3 animate-spin text-violet-500" />}
                          {!v.job && <div className="w-2 h-2 rounded-full bg-slate-300" />}
                        </div>
                        <p className="text-[9px] text-slate-500 truncate">{v.editNotes}</p>
                        <p className="text-[8px] text-slate-400 mt-0.5">{new Date(v.createdAt).toLocaleTimeString()}</p>
                      </button>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Layers className="w-4 h-4 text-orange-500" /> Active Layers
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="space-y-1">
                      <p className="text-[9px] font-bold text-slate-400 uppercase">Style</p>
                      <Badge className="text-[10px]">{styleModes.find(s => s.id === selectedStyle)?.icon} {styleModes.find(s => s.id === selectedStyle)?.name}</Badge>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[9px] font-bold text-slate-400 uppercase">Effects ({selectedEffects.length})</p>
                      {selectedEffects.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {selectedEffects.map(e => {
                            const effect = effectOverlays.find(o => o.id === e);
                            return (
                              <button key={e} className="inline-flex" onClick={() => setSelectedEffects(prev => prev.filter(x => x !== e))}>
                                <Badge variant="outline" className="text-[9px] cursor-pointer hover:bg-red-50 hover:text-red-600">
                                  {effect?.icon} {effect?.name} x
                                </Badge>
                              </button>
                            );
                          })}
                        </div>
                      ) : <p className="text-[10px] text-slate-400 italic">None</p>}
                    </div>
                    <div className="space-y-1">
                      <p className="text-[9px] font-bold text-slate-400 uppercase">Voice</p>
                      <Badge variant="outline" className="text-[10px]">{voicePresets.find(v => v.id === selectedVoice)?.icon} {voicePresets.find(v => v.id === selectedVoice)?.name}</Badge>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[9px] font-bold text-slate-400 uppercase">Format</p>
                      <div className="flex gap-1">
                        <Badge variant="outline" className="text-[9px]">{aspectRatio}</Badge>
                        <Badge variant="outline" className="text-[9px]">{resolution}</Badge>
                        <Badge variant="outline" className="text-[9px]">{duration}s</Badge>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[9px] font-bold text-slate-400 uppercase">Engine</p>
                      <Badge variant="outline" className="text-[10px]">{engines.find(e => e.id === selectedEngine)?.name || selectedEngine}</Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="lg:col-span-5 space-y-3">
                {(() => {
                  const currentVer = versions[activeVersion];
                  const job = currentVer?.job || activeJob;
                  return (
                    <>
                      {job?.status === 'completed' && job.videoUrl ? (
                        <Card className="border-2 border-green-200 dark:border-green-800">
                          <CardContent className="p-3">
                            <div className="rounded-xl overflow-hidden bg-black aspect-video">
                              <video src={job.videoUrl} controls className="w-full h-full object-contain" />
                            </div>
                            <div className="flex items-center justify-between mt-2">
                              <Badge className="bg-green-100 text-green-700 text-[10px]">
                                <CheckCircle className="w-3 h-3 mr-0.5" /> v{currentVer?.version || 1} Ready
                              </Badge>
                              <div className="flex gap-1.5">
                                <Button variant="outline" size="sm" className="h-7 text-[10px]" onClick={() => {
                                  const a = document.createElement('a'); a.href = job.videoUrl!; a.download = `ai-video-v${currentVer?.version || 1}.mp4`; a.click();
                                }}><Download className="w-3 h-3 mr-1" /> Download</Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ) : job?.status === 'processing' || job?.status === 'queued' ? (
                        <Card className="border-2 border-violet-200 dark:border-violet-800">
                          <CardContent className="py-12 text-center">
                            <Loader2 className="w-12 h-12 text-violet-600 mx-auto mb-3 animate-spin" />
                            <h3 className="text-sm font-bold mb-1">Rendering v{currentVer?.version || ''}...</h3>
                            <p className="text-xs text-slate-500">AI is generating your updated video. 60-120 seconds.</p>
                            <Progress value={job.status === 'processing' ? 65 : 15} className="h-2 max-w-xs mx-auto mt-3" />
                          </CardContent>
                        </Card>
                      ) : (
                        <Card className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
                          <CardContent className="py-8 text-center">
                            <Eye className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                            <p className="text-xs text-slate-500">Chat with AI below to describe changes, then click Re-render.</p>
                          </CardContent>
                        </Card>
                      )}
                    </>
                  );
                })()}

                <Card>
                  <CardHeader className="pb-1">
                    <CardTitle className="text-xs flex items-center gap-2 text-slate-500">
                      <Type className="w-3.5 h-3.5" /> Current Prompt
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea value={prompt} onChange={(e) => setPrompt(e.target.value)}
                      className="text-xs min-h-[60px] resize-none" placeholder="Video generation prompt..." />
                  </CardContent>
                </Card>

                <Button className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-semibold py-5"
                  onClick={handleRerender}
                  disabled={generateMutation.isPending || activeJob?.status === 'processing' || activeJob?.status === 'queued'}>
                  {generateMutation.isPending || activeJob?.status === 'processing' ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Re-rendering...</>
                  ) : (
                    <><RotateCcw className="w-4 h-4 mr-2" /> Apply Changes & Re-render (v{versions.length + 1})</>
                  )}
                </Button>
              </div>

              <div className="lg:col-span-4">
                <Card className="border-2 border-violet-200 dark:border-violet-800 h-full flex flex-col">
                  <CardHeader className="pb-2 flex-shrink-0">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-violet-600" /> AI Edit Chat
                    </CardTitle>
                    <p className="text-[10px] text-slate-500">Tell the AI what to change. It updates your prompt and settings automatically.</p>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col min-h-0 p-3">
                    <div ref={editChatRef} className="flex-1 overflow-y-auto space-y-2 mb-3 max-h-[420px] min-h-[300px] pr-1">
                      {editMessages.map(msg => (
                        <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[90%] rounded-xl px-3 py-2 text-xs ${
                            msg.role === 'user'
                              ? 'bg-violet-600 text-white rounded-br-sm'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-bl-sm'
                          }`}>
                            <p className="whitespace-pre-line leading-relaxed">{msg.content}</p>
                            {msg.appliedChanges?.settingsChanges && Object.keys(msg.appliedChanges.settingsChanges).length > 0 && (
                              <div className="mt-1.5 pt-1.5 border-t border-slate-200 dark:border-slate-700">
                                <p className="text-[9px] font-bold mb-0.5 opacity-70">Changes applied:</p>
                                <div className="flex flex-wrap gap-1">
                                  {msg.appliedChanges.settingsChanges.addEffects?.map((e: string) => (
                                    <Badge key={e} className="text-[8px] bg-orange-100 text-orange-700 px-1">+{effectOverlays.find(o => o.id === e)?.name || e}</Badge>
                                  ))}
                                  {msg.appliedChanges.settingsChanges.style && (
                                    <Badge className="text-[8px] bg-amber-100 text-amber-700 px-1">Style: {msg.appliedChanges.settingsChanges.style}</Badge>
                                  )}
                                  {msg.appliedChanges.settingsChanges.duration && (
                                    <Badge className="text-[8px] bg-blue-100 text-blue-700 px-1">Duration: {msg.appliedChanges.settingsChanges.duration}s</Badge>
                                  )}
                                  {msg.appliedChanges.settingsChanges.aspectRatio && (
                                    <Badge className="text-[8px] bg-green-100 text-green-700 px-1">Ratio: {msg.appliedChanges.settingsChanges.aspectRatio}</Badge>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      {editMutation.isPending && (
                        <div className="flex justify-start">
                          <div className="bg-slate-100 dark:bg-slate-800 rounded-xl px-3 py-2 rounded-bl-sm">
                            <Loader2 className="w-4 h-4 animate-spin text-violet-500" />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex-shrink-0 space-y-2">
                      <div className="flex flex-wrap gap-1">
                        {['Add lightning', 'Make darker', 'More aggressive', 'Add fire', 'Vertical TikTok', 'Speed up'].map(q => (
                          <button key={q} onClick={() => { setEditInput(q); }}
                            className="text-[9px] px-2 py-0.5 rounded-full bg-violet-50 dark:bg-violet-950/30 text-violet-600 dark:text-violet-400 border border-violet-200 dark:border-violet-800 hover:bg-violet-100 transition-colors">
                            {q}
                          </button>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Input value={editInput} onChange={(e) => setEditInput(e.target.value)}
                          placeholder="Tell AI what to change..."
                          className="text-sm flex-1"
                          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendEdit()} />
                        <Button onClick={handleSendEdit} disabled={editMutation.isPending || !editInput.trim()}
                          className="bg-violet-600 hover:bg-violet-700 text-white px-3">
                          <Send className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="script">
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <Card className="border-2 border-blue-200 dark:border-blue-800">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Type className="w-4 h-4 text-blue-600" />
                    AI Script Generator
                  </CardTitle>
                  <p className="text-xs text-slate-500">Type what you want. Get hook, offer, CTA, hashtags, and platform-ready captions.</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-medium text-slate-500 mb-0.5 block">Industry</label>
                      <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {industries.map(ind => <SelectItem key={ind.id} value={ind.id}>{ind.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-[10px] font-medium text-slate-500 mb-0.5 block">Style</label>
                      <Select value={selectedStyle} onValueChange={setSelectedStyle}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {styleModes.map(sm => <SelectItem key={sm.id} value={sm.id}>{sm.icon} {sm.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Textarea
                    value={scriptInput}
                    onChange={(e) => setScriptInput(e.target.value)}
                    placeholder={`e.g., "Make a funny spring cleaning ad" or "Storm emergency tree removal commercial"`}
                    className="min-h-[80px] text-sm"
                  />
                  <div className="flex flex-wrap gap-1.5">
                    {currentIndustry?.hooks.map((h, i) => (
                      <Button key={i} variant="outline" size="sm" className="text-[10px] h-6 px-2" onClick={() => setScriptInput(h)}>{h.slice(0, 35)}...</Button>
                    ))}
                  </div>
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white" onClick={handleGenerateScript} disabled={scriptMutation.isPending}>
                    {scriptMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating Script...</> : <><Wand2 className="w-4 h-4 mr-2" /> Generate Script</>}
                  </Button>
                </CardContent>
              </Card>

              {currentIndustry && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Pre-Built {currentIndustry.name} Content</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <h4 className="text-[10px] font-bold text-blue-600 mb-1">HOOKS</h4>
                      {currentIndustry.hooks.map((h, i) => (
                        <div key={i} className="flex items-center justify-between p-1.5 rounded bg-slate-50 dark:bg-slate-800 mb-1">
                          <span className="text-xs">{h}</span>
                          <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={() => copyText(h, `hook-${i}`)}>
                            {copiedField === `hook-${i}` ? <CheckCircle className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                          </Button>
                        </div>
                      ))}
                    </div>
                    <div>
                      <h4 className="text-[10px] font-bold text-green-600 mb-1">OFFERS</h4>
                      {currentIndustry.offers.map((o, i) => (
                        <div key={i} className="flex items-center justify-between p-1.5 rounded bg-slate-50 dark:bg-slate-800 mb-1">
                          <span className="text-xs">{o}</span>
                          <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={() => copyText(o, `offer-${i}`)}>
                            {copiedField === `offer-${i}` ? <CheckCircle className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                          </Button>
                        </div>
                      ))}
                    </div>
                    <div>
                      <h4 className="text-[10px] font-bold text-purple-600 mb-1">MEME IDEAS</h4>
                      {currentIndustry.memeIdeas.map((m, i) => (
                        <div key={i} className="flex items-center justify-between p-1.5 rounded bg-slate-50 dark:bg-slate-800 mb-1">
                          <span className="text-xs">{m}</span>
                          <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={() => copyText(m, `meme-${i}`)}>
                            {copiedField === `meme-${i}` ? <CheckCircle className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="space-y-4">
              {scriptResult ? (
                <Card className="border-2 border-green-200 dark:border-green-800">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <CheckCircle className="w-4 h-4 text-green-600" /> Your AI Script
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {[
                      { label: 'HOOK', value: scriptResult.hook, field: 'hook', color: 'red' },
                      { label: 'OFFER', value: scriptResult.offer, field: 'offer', color: 'green' },
                      { label: 'BODY', value: scriptResult.body, field: 'body', color: 'blue' },
                      { label: 'CTA', value: scriptResult.cta, field: 'cta', color: 'purple' },
                    ].map(section => (
                      <div key={section.field} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
                        <div className="flex items-center justify-between mb-1">
                          <Badge className={`text-[9px] bg-${section.color}-100 text-${section.color}-700`}>{section.label}</Badge>
                          <Button variant="ghost" size="sm" className="h-5" onClick={() => copyText(section.value, section.field)}>
                            {copiedField === section.field ? <CheckCircle className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                          </Button>
                        </div>
                        <p className="text-sm">{section.value}</p>
                      </div>
                    ))}

                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
                      <h4 className="text-[10px] font-bold mb-1">HASHTAGS</h4>
                      <div className="flex flex-wrap gap-1">
                        {scriptResult.hashtags.map((h, i) => (
                          <button key={i} className="inline-flex" onClick={() => copyText(h, `hash-${i}`)}>
                            <Badge variant="outline" className="text-[10px] cursor-pointer hover:bg-violet-50">
                              {h}
                            </Badge>
                          </button>
                        ))}
                      </div>
                      <Button variant="ghost" size="sm" className="mt-1 text-[10px]" onClick={() => copyText(scriptResult.hashtags.join(' '), 'all-hash')}>
                        {copiedField === 'all-hash' ? 'Copied!' : 'Copy All Hashtags'}
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-[10px] font-bold">PLATFORM CAPTIONS</h4>
                      {scriptResult.captions.map((c, i) => (
                        <div key={i} className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
                          <div className="flex items-center justify-between mb-1">
                            <Badge variant="outline" className="text-[9px]">{c.platform}</Badge>
                            <Button variant="ghost" size="sm" className="h-5" onClick={() => copyText(c.text, `caption-${i}`)}>
                              {copiedField === `caption-${i}` ? <CheckCircle className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                            </Button>
                          </div>
                          <p className="text-[11px] text-slate-600 dark:text-slate-400 whitespace-pre-line">{c.text}</p>
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-2 p-2 rounded-lg bg-violet-50 dark:bg-violet-950/20">
                      <div><span className="text-[9px] font-bold text-violet-600">VOICE:</span><p className="text-[10px]">{scriptResult.voiceSuggestion}</p></div>
                      <div><span className="text-[9px] font-bold text-violet-600">MUSIC:</span><p className="text-[10px]">{scriptResult.musicSuggestion}</p></div>
                    </div>

                    <Button className="w-full" onClick={() => { setPrompt(`${scriptResult.hook}. ${scriptResult.offer}. ${scriptResult.body}. ${scriptResult.cta}`); setMainTab('create'); }}>
                      <Film className="w-4 h-4 mr-2" /> Use Script to Generate Video
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
                  <CardContent className="py-16 text-center">
                    <Type className="w-16 h-16 text-blue-300 mx-auto mb-4" />
                    <h3 className="text-lg font-bold mb-2">AI Script Generator</h3>
                    <p className="text-sm text-slate-500 max-w-md mx-auto mb-4">
                      Type what kind of ad you want. AI generates a complete script with hook, offer, CTA, hashtags, and platform-ready captions for TikTok, Facebook, and Instagram.
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {['Funny spring ad', 'Storm emergency', 'Luxury brand video', 'Viral TikTok', 'Discount push'].map(ex => (
                        <Button key={ex} variant="outline" size="sm" className="text-xs" onClick={() => { setScriptInput(ex); handleGenerateScript(); }}>{ex}</Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="voice">
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <Card className="border-2 border-emerald-200 dark:border-emerald-800">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Mic className="w-4 h-4 text-emerald-600" /> AI Voice System
                  </CardTitle>
                  <p className="text-xs text-slate-500">Select a voice preset. Your video generation prompt will include voice direction.</p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2">
                    {voicePresets.map(v => (
                      <button key={v.id} onClick={() => setSelectedVoice(v.id)}
                        className={`flex items-start gap-2 p-3 rounded-xl border-2 transition-all text-left ${
                          selectedVoice === v.id ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 shadow-md' : 'border-slate-200 dark:border-slate-700 hover:border-emerald-300'
                        }`}>
                        <span className="text-xl mt-0.5">{v.icon}</span>
                        <div>
                          <h4 className="text-xs font-bold">{v.name}</h4>
                          <p className="text-[10px] text-slate-500 leading-tight">{v.description}</p>
                        </div>
                        {selectedVoice === v.id && <CheckCircle className="w-4 h-4 text-emerald-500 ml-auto flex-shrink-0" />}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Volume2 className="w-4 h-4 text-emerald-500" /> Voice Integration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800">
                    <h4 className="text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-1">ElevenLabs Connected</h4>
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400">Professional AI voices with emotional range. Used for Rachel voice guide and custom voice cloning.</p>
                    <Badge className="mt-1 bg-green-100 text-green-700 text-[9px]"><CheckCircle className="w-2.5 h-2.5 mr-0.5" /> API Key Configured</Badge>
                  </div>
                  <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                    <h4 className="text-xs font-bold text-blue-700 dark:text-blue-400 mb-1">OpenAI TTS Available</h4>
                    <p className="text-[10px] text-blue-600 dark:text-blue-400">Natural text-to-speech with multiple voice options. Fast generation for scripts and ads.</p>
                    <Badge className="mt-1 bg-green-100 text-green-700 text-[9px]"><CheckCircle className="w-2.5 h-2.5 mr-0.5" /> Ready</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <Card className="border-2 border-pink-200 dark:border-pink-800">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Music className="w-4 h-4 text-pink-600" /> Music & Sound Design
                  </CardTitle>
                  <p className="text-xs text-slate-500">Style mode automatically selects music direction for your video.</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {styleModes.map(sm => (
                      <div key={sm.id} className={`p-2.5 rounded-lg border transition-all cursor-pointer ${selectedStyle === sm.id ? 'border-pink-400 bg-pink-50 dark:bg-pink-950/20' : 'border-slate-200 dark:border-slate-700'}`}
                        onClick={() => setSelectedStyle(sm.id)}>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span>{sm.icon}</span>
                          <span className="text-xs font-bold">{sm.name}</span>
                          {selectedStyle === sm.id && <CheckCircle className="w-3.5 h-3.5 text-pink-500 ml-auto" />}
                        </div>
                        <p className="text-[10px] text-slate-500"><strong>Music:</strong> {sm.musicStyle}</p>
                        <p className="text-[10px] text-slate-500"><strong>Voice:</strong> {sm.voiceTone}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="effects">
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <Card className="border-2 border-orange-200 dark:border-orange-800">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <CloudLightning className="w-4 h-4 text-orange-600" /> Effects & Overlays
                  </CardTitle>
                  <p className="text-xs text-slate-500">Select effects to layer on your video. These become part of your AI generation prompt.</p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2">
                    {effectOverlays.map(effect => {
                      const isSelected = selectedEffects.includes(effect.id);
                      return (
                        <button key={effect.id}
                          onClick={() => setSelectedEffects(prev => isSelected ? prev.filter(e => e !== effect.id) : [...prev, effect.id])}
                          className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all text-left ${
                            isSelected ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/30 shadow-md' : 'border-slate-200 dark:border-slate-700 hover:border-orange-300'
                          }`}>
                          <span className="text-xl">{effect.icon}</span>
                          <div className="flex-1">
                            <h4 className="text-xs font-bold">{effect.name}</h4>
                            <p className="text-[9px] text-slate-500">{effect.description}</p>
                          </div>
                          {isSelected && <CheckCircle className="w-4 h-4 text-orange-500 flex-shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                  {selectedEffects.length > 0 && (
                    <div className="mt-2 p-2 rounded-lg bg-orange-50 dark:bg-orange-950/20">
                      <p className="text-[10px] text-orange-600 font-medium">
                        Selected: {selectedEffects.map(e => effectOverlays.find(o => o.id === e)?.name).join(', ')}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <Card className="border-2 border-yellow-200 dark:border-yellow-800">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Laugh className="w-4 h-4 text-yellow-600" /> Meme & GIF Finder
                  </CardTitle>
                  <p className="text-xs text-slate-500">Search for trending memes and GIFs to reference in your video concepts.</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex gap-2">
                    <Input value={searchMeme} onChange={(e) => setSearchMeme(e.target.value)} placeholder="Search memes... e.g., 'contractor fail'" className="text-sm"
                      onKeyDown={(e) => e.key === 'Enter' && searchMemes()} />
                    <Button onClick={searchMemes} size="sm"><Wand2 className="w-3.5 h-3.5" /></Button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(currentIndustry?.memeIdeas || []).slice(0, 3).map((idea, i) => (
                      <Button key={i} variant="outline" size="sm" className="text-[10px] h-6 px-2" onClick={() => { setSearchMeme(idea.split(' ').slice(0, 3).join(' ')); }}>
                        {idea.slice(0, 30)}...
                      </Button>
                    ))}
                  </div>
                  {memeResults.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 max-h-80 overflow-y-auto">
                      {memeResults.map((meme: any, i: number) => (
                        <button key={i} onClick={() => {
                          setSelectedMemes(prev => [...prev, meme]);
                          toast({ title: 'Meme Added', description: 'This meme reference will be included in your video concept.' });
                        }} className="rounded-lg overflow-hidden border-2 border-transparent hover:border-yellow-400 transition-all">
                          <img src={meme.preview || meme.full} alt={meme.title || 'meme'}
                            className="w-full h-20 object-cover" loading="lazy" />
                        </button>
                      ))}
                    </div>
                  )}
                  {selectedMemes.length > 0 && (
                    <div>
                      <h4 className="text-[10px] font-bold mb-1">Selected Memes ({selectedMemes.length})</h4>
                      <div className="flex gap-1.5 flex-wrap">
                        {selectedMemes.map((m: any, i: number) => (
                          <div key={i} className="relative w-12 h-12 rounded overflow-hidden border border-yellow-400">
                            <img src={m.preview || m.full} alt="" className="w-full h-full object-cover" />
                            <button onClick={() => setSelectedMemes(prev => prev.filter((_, j) => j !== i))}
                              className="absolute top-0 right-0 w-3.5 h-3.5 bg-red-500 text-white rounded-full text-[8px] flex items-center justify-center">x</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {memeResults.length === 0 && (
                    <div className="text-center py-6">
                      <Laugh className="w-10 h-10 text-yellow-300 mx-auto mb-2" />
                      <p className="text-xs text-slate-500">Search for memes to add humor to your ads</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="export">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="border-2 border-indigo-200 dark:border-indigo-800">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Share2 className="w-4 h-4 text-indigo-600" /> Social Media Export
                </CardTitle>
                <p className="text-xs text-slate-500">Platform-specific formatting with auto captions and hashtags.</p>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { platform: 'TikTok', format: '9:16 vertical', duration: '15-60s', features: ['Auto captions', 'Trending audio', 'Hashtag optimization', 'Link in bio CTA'], color: 'bg-black text-white' },
                  { platform: 'Facebook', format: '16:9 or 1:1', duration: '15-30s', features: ['Headline + primary text', 'Call Now button', 'Target audience copy', 'Muted-first captions'], color: 'bg-blue-600 text-white' },
                  { platform: 'Instagram Reels', format: '9:16 vertical', duration: '15-90s', features: ['Cover frame selection', 'Hashtag strategy', 'Story cross-post', 'DM CTA'], color: 'bg-gradient-to-r from-purple-600 to-pink-500 text-white' },
                  { platform: 'YouTube Shorts', format: '9:16 vertical', duration: '15-60s', features: ['Title optimization', 'Description copy', 'Subscribe CTA', 'End screen'], color: 'bg-red-600 text-white' },
                ].map(p => (
                  <div key={p.platform} className="p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={`${p.color} text-xs`}>{p.platform}</Badge>
                      <span className="text-[10px] text-slate-500">{p.format} | {p.duration}</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {p.features.map((f, i) => (
                        <Badge key={i} variant="outline" className="text-[9px] px-1.5 py-0">{f}</Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Hash className="w-4 h-4 text-indigo-500" /> Auto-Generated Content
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {scriptResult ? (
                    <>
                      <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
                        <h4 className="text-[10px] font-bold mb-1">HASHTAGS</h4>
                        <p className="text-xs">{scriptResult.hashtags.join(' ')}</p>
                        <Button variant="ghost" size="sm" className="text-[10px] mt-1" onClick={() => copyText(scriptResult.hashtags.join(' '), 'export-hash')}>
                          {copiedField === 'export-hash' ? 'Copied!' : 'Copy All'}
                        </Button>
                      </div>
                      {scriptResult.captions.map((c, i) => (
                        <div key={i} className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
                          <div className="flex items-center justify-between mb-1">
                            <Badge variant="outline" className="text-[9px]">{c.platform}</Badge>
                            <Button variant="ghost" size="sm" className="h-5" onClick={() => copyText(c.text, `export-cap-${i}`)}>
                              {copiedField === `export-cap-${i}` ? <CheckCircle className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                            </Button>
                          </div>
                          <p className="text-[11px] whitespace-pre-line">{c.text}</p>
                        </div>
                      ))}
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <Hash className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs text-slate-500">Generate a script first to get platform-ready captions and hashtags</p>
                      <Button variant="outline" size="sm" className="mt-2 text-xs" onClick={() => setMainTab('script')}>
                        <Type className="w-3 h-3 mr-1" /> Go to AI Script
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-950/20 dark:to-violet-950/20">
                <CardContent className="py-6 text-center">
                  <h3 className="text-sm font-bold mb-1">Full Workflow</h3>
                  <div className="flex items-center justify-center gap-2 text-[10px] text-slate-500">
                    <Badge variant="outline" className="text-[9px]">1. Pick Industry</Badge>
                    <span>{'\u2192'}</span>
                    <Badge variant="outline" className="text-[9px]">2. Choose Style</Badge>
                    <span>{'\u2192'}</span>
                    <Badge variant="outline" className="text-[9px]">3. Generate Script</Badge>
                    <span>{'\u2192'}</span>
                    <Badge variant="outline" className="text-[9px]">4. Create Video</Badge>
                    <span>{'\u2192'}</span>
                    <Badge variant="outline" className="text-[9px]">5. Export</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="engines">
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {engines.map(engine => {
                const meta = engineIcons[engine.id];
                return (
                  <Card key={engine.id} className={`overflow-hidden cursor-pointer transition-all hover:shadow-lg ${
                    selectedEngine === engine.id ? 'ring-2 ring-violet-500' : ''
                  } ${engine.status === 'coming_soon' ? 'opacity-60' : ''}`}
                    onClick={() => engine.status !== 'coming_soon' && setSelectedEngine(engine.id)}>
                    <div className={`h-2 bg-gradient-to-r ${meta?.gradient || 'from-slate-400 to-slate-500'}`} />
                    <CardContent className="pt-4 pb-3">
                      <div className="flex items-center gap-3 mb-3">
                        {meta && <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${meta.gradient} flex items-center justify-center`}><meta.icon className="w-5 h-5 text-white" /></div>}
                        <div>
                          <h4 className="font-bold">{engine.name}</h4>
                          <Badge variant="outline" className="text-[9px]">{meta?.badge}</Badge>
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 mb-3">{engineDescriptions[engine.id]}</p>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 mb-3">{engine.description}</p>
                      <div className="flex flex-wrap gap-1 mb-3">
                        {engine.features.map((f, i) => <Badge key={i} variant="outline" className="text-[9px] px-1.5 py-0">{f}</Badge>)}
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                        <span>Cost: {engine.costPerSecond}/sec</span>
                        <span>Max: {engine.maxDuration}s</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {engine.status === 'ready' && <Badge className="bg-green-100 dark:bg-green-900/40 text-green-700 text-[10px]"><CheckCircle className="w-3 h-3 mr-0.5" /> Ready to Use</Badge>}
                        {engine.status === 'needs_key' && <Badge className="bg-amber-100 dark:bg-amber-900/40 text-amber-700 text-[10px]"><Lock className="w-3 h-3 mr-0.5" /> Needs API Key</Badge>}
                        {engine.status === 'coming_soon' && <Badge className="bg-slate-100 text-slate-500 text-[10px]"><Clock className="w-3 h-3 mr-0.5" /> Coming Soon</Badge>}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <Card className="bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/20 dark:to-purple-950/20">
              <CardContent className="py-6">
                <h3 className="font-bold mb-3">Best Picks by Use Case</h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    { title: 'Real Action Videos', desc: 'Best motion, best realism', engines: ['OpenAI Sora', 'Runway Gen-3'], icon: '\uD83C\uDFA5', color: 'red' },
                    { title: 'Promo & Corporate', desc: 'Polished, luxury feel', engines: ['Luma Dream Machine', 'Runway Full Suite'], icon: '\uD83D\uDCBC', color: 'blue' },
                    { title: 'Short Social Content', desc: 'Quick viral clips', engines: ['Pika Labs'], icon: '\uD83D\uDCF1', color: 'pink' },
                    { title: 'AI Presenters', desc: 'Talking head videos', engines: ['Synthesia'], icon: '\uD83D\uDDE3\uFE0F', color: 'purple' },
                  ].map(uc => (
                    <div key={uc.title} className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <span className="text-xl">{uc.icon}</span>
                      <h4 className="text-xs font-bold mt-1">{uc.title}</h4>
                      <p className="text-[10px] text-slate-500 mb-1.5">{uc.desc}</p>
                      {uc.engines.map(e => <Badge key={e} className="text-[8px] mr-1 bg-green-100 text-green-700">{e}</Badge>)}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
