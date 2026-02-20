import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import {
  Film, Download, Loader2, Sparkles, Zap, RefreshCw,
  CheckCircle, AlertCircle, Clock, Video,  MonitorPlay,
  Wand2, Crown, Star, ChevronDown, ChevronUp,
  Users, Clapperboard, Megaphone, Smartphone, Settings2, Lock
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

interface UseCase {
  id: string;
  title: string;
  icon: any;
  description: string;
  color: string;
  engines: string[];
  prompts: string[];
}

const useCases: UseCase[] = [
  {
    id: 'action',
    title: 'Real Action Videos',
    icon: Clapperboard,
    description: 'Cinematic motion with real people, machinery, and natural movement',
    color: 'red',
    engines: ['openai-sora', 'runway-gen3'],
    prompts: [
      'Cinematic 8-second video of professional tree removal crew in neon yellow safety shirts operating a crane in a forest, wood chips flying, chainsaw actively cutting, natural sunlight rays through trees, realistic motion, 4K, documentary style',
      'Dramatic slow-motion footage of a roofing crew replacing damaged shingles after a storm, tools in hand, debris being cleared, golden hour lighting, cinematic quality',
      'Construction crew with heavy equipment clearing storm debris from a suburban street, bucket truck lifting fallen tree, natural movement, broadcast quality'
    ]
  },
  {
    id: 'promo',
    title: 'Promo & Corporate',
    icon: Megaphone,
    description: 'Polished brand videos with luxury feel and professional lighting',
    color: 'blue',
    engines: ['luma-dream-machine', 'runway-full-suite'],
    prompts: [
      'Luxury real estate walkthrough of a newly restored home, smooth camera pan through rooms, dramatic lighting, polished floors reflecting light, cinematic quality',
      'Corporate brand video showing a professional contractor team meeting, high-end office, confident poses, warm natural lighting, documentary style',
      'Beautiful before and after transformation of a storm-damaged property, split screen effect, dramatic reveal, uplifting music feel'
    ]
  },
  {
    id: 'social',
    title: 'Short Social Content',
    icon: Smartphone,
    description: 'Quick viral clips for TikTok, Instagram Reels, and YouTube Shorts',
    color: 'pink',
    engines: ['pika-labs'],
    prompts: [
      'Satisfying time-lapse of a messy yard being completely cleaned and transformed, fast-paced, vibrant colors, social media ready',
      'Quick dramatic reveal of a perfectly trimmed tree versus an overgrown dangerous one, punchy transitions, bold energy',
      'Fast-cut montage of power tools in action - chainsaw, stump grinder, pressure washer - satisfying close-ups, ASMR quality'
    ]
  },
  {
    id: 'presenter',
    title: 'AI Presenter Videos',
    icon: Users,
    description: 'Professional AI spokesperson with multilingual voice and script',
    color: 'purple',
    engines: ['synthesia'],
    prompts: [
      'Professional AI presenter in business attire explaining storm damage restoration services, confident delivery, clean studio background',
      'Friendly AI spokesperson delivering a 30-second pitch for emergency tree removal services, warm tone, trustworthy appearance',
      'Corporate training video presenter explaining FEMA compliance documentation procedures, clear and professional delivery'
    ]
  }
];

const engineIcons: Record<string, { icon: any; gradient: string; badge: string }> = {
  'openai-sora': { icon: Crown, gradient: 'from-emerald-500 to-teal-600', badge: 'Most Realistic' },
  'runway-gen3': { icon: Star, gradient: 'from-violet-500 to-purple-600', badge: 'Best Overall' },
  'luma-dream-machine': { icon: Sparkles, gradient: 'from-amber-500 to-orange-600', badge: 'Beautiful Lighting' },
  'pika-labs': { icon: Zap, gradient: 'from-pink-500 to-rose-600', badge: 'Fastest Social' },
  'synthesia': { icon: Users, gradient: 'from-blue-500 to-indigo-600', badge: 'AI Presenters' },
  'runway-full-suite': { icon: Settings2, gradient: 'from-slate-500 to-gray-600', badge: 'Full Editing' },
};

const engineDescriptions: Record<string, string> = {
  'openai-sora': 'Creates fully generative videos with real motion, consistent scenes, and natural human movement. Physics-aware -- the most realistic AI video available.',
  'runway-gen3': 'Director-level control with cinematic camera movement, depth of field, realistic lighting, and motion blur. What agencies use for broadcast-quality content.',
  'luma-dream-machine': 'Cinematic lighting and smooth motion specialist. Creates outdoor golden-hour scenes with dramatic sunlight rays. Luxury documentary feel.',
  'pika-labs': 'Quick turnaround for short social clips. Best for TikTok, Reels, and trend-based content. Stylized and punchy output.',
  'synthesia': 'AI avatar presenter videos with realistic talking heads. Script-to-video in 140+ languages. Best for training, presentations, and corporate communications.',
  'runway-full-suite': 'Complete video editing and generation suite with advanced compositing, inpainting, motion brush, green screen, and style transfer capabilities.',
};

export default function AIVideoGenerator() {
  const { toast } = useToast();
  const [selectedEngine, setSelectedEngine] = useState<string>('runway-gen3');
  const [selectedUseCase, setSelectedUseCase] = useState<string>('action');
  const [prompt, setPrompt] = useState('');
  const [duration, setDuration] = useState('5');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [resolution, setResolution] = useState('1080p');
  const [style, setStyle] = useState('cinematic');
  const [activeJob, setActiveJob] = useState<VideoGenJob | null>(null);
  const [generatedVideos, setGeneratedVideos] = useState<VideoGenJob[]>([]);
  const [showEngineDetails, setShowEngineDetails] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
            toast({ title: 'Video Ready!', description: 'Your AI-generated video is ready to preview and download.' });
          } else if (data.job.status === 'failed') {
            clearInterval(pollRef.current!);
            pollRef.current = null;
            toast({ title: 'Generation Failed', description: data.job.error || 'Video generation failed', variant: 'destructive' });
          }
        }
      } catch {
        // poll retry
      }
    }, 3000);
  };

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const handleGenerate = () => {
    if (!prompt.trim()) {
      toast({ title: 'Describe Your Video', description: 'Tell the AI what video you want to create', variant: 'destructive' });
      return;
    }
    generateMutation.mutate({
      engine: selectedEngine,
      prompt: prompt.trim(),
      options: {
        duration: parseInt(duration),
        aspectRatio,
        resolution,
        style,
      }
    });
  };

  const selectedEngineData = engines.find(e => e.id === selectedEngine);
  const currentUseCase = useCases.find(u => u.id === selectedUseCase);

  const sceneTemplates = [
    { name: 'Hook (0-3s)', desc: 'Dramatic opening -- storm clouds, leaning tree, worried homeowner', icon: '\u26A1' },
    { name: 'Power Entry (3-7s)', desc: 'Crew arriving -- bucket truck, crane, workers in neon shirts', icon: '\uD83D\uDD25' },
    { name: 'Money Shot (7-12s)', desc: 'Main action -- cutting, hauling, grinding, dramatic before/after', icon: '\uD83C\uDFAC' },
    { name: 'Authority Build (12-18s)', desc: 'Equipment showcase -- stump grinder, skid steer, mulcher', icon: '\uD83D\uDCAA' },
    { name: 'CTA Close (18-25s)', desc: 'Clean property reveal, satisfied homeowner, logo + phone number', icon: '\uD83D\uDCDE' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card className="border-2 border-violet-200 dark:border-violet-800 bg-gradient-to-br from-white to-violet-50/30 dark:from-slate-900 dark:to-violet-950/20">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Film className="w-5 h-5 text-violet-600" />
                AI Video Generator
              </CardTitle>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Real AI-generated video with cinematic motion — not slideshows
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">What kind of video?</label>
                <div className="grid grid-cols-2 gap-2">
                  {useCases.map(uc => {
                    const isSelected = selectedUseCase === uc.id;
                    return (
                      <button
                        key={uc.id}
                        type="button"
                        onClick={() => {
                          setSelectedUseCase(uc.id);
                          if (uc.engines.length > 0) {
                            const bestEngine = uc.engines.find(e => engines.find(eng => eng.id === e)?.status === 'ready') || uc.engines[0];
                            setSelectedEngine(bestEngine);
                          }
                        }}
                        className={`relative flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-center ${
                          isSelected
                            ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/30 shadow-md'
                            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-violet-500 flex items-center justify-center">
                            <CheckCircle className="w-2.5 h-2.5 text-white" />
                          </div>
                        )}
                        <uc.icon className="w-6 h-6 text-violet-600" />
                        <span className="font-semibold text-xs">{uc.title}</span>
                        <span className="text-[9px] text-slate-500 dark:text-slate-400 leading-tight">{uc.description.split(' ').slice(0, 5).join(' ')}...</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">Choose AI Engine</label>
                <Select value={selectedEngine} onValueChange={setSelectedEngine}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select engine" />
                  </SelectTrigger>
                  <SelectContent>
                    {engines.map(engine => {
                      const meta = engineIcons[engine.id];
                      return (
                        <SelectItem key={engine.id} value={engine.id} disabled={engine.status === 'coming_soon'}>
                          <div className="flex items-center gap-2">
                            {meta && <meta.icon className="w-4 h-4" />}
                            <span>{engine.name}</span>
                            {engine.status === 'coming_soon' && <Badge variant="outline" className="text-[9px] px-1 py-0">Coming Soon</Badge>}
                            {engine.status === 'needs_key' && <Badge variant="outline" className="text-[9px] px-1 py-0 text-amber-600">Needs Key</Badge>}
                            {engine.status === 'ready' && <Badge className="text-[9px] px-1 py-0 bg-green-500">Ready</Badge>}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                {selectedEngineData && (
                  <div className="mt-2 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{selectedEngineData.name}</span>
                      {engineIcons[selectedEngine] && (
                        <Badge variant="outline" className="text-[9px]">{engineIcons[selectedEngine].badge}</Badge>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      {engineDescriptions[selectedEngine]}
                    </p>
                    <div className="flex gap-1 mt-1.5 flex-wrap">
                      {selectedEngineData.features.slice(0, 3).map((f, i) => (
                        <Badge key={i} variant="outline" className="text-[8px] px-1 py-0">{f}</Badge>
                      ))}
                      <Badge variant="outline" className="text-[8px] px-1 py-0">Max {selectedEngineData.maxDuration}s</Badge>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Describe your video</label>
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe the cinematic video you want... e.g., 'Professional tree removal crew in neon safety shirts operating a crane, wood chips flying, golden sunlight, documentary style'"
                  className="min-h-[100px] resize-none text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">Duration</label>
                  <Select value={duration} onValueChange={setDuration}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 seconds</SelectItem>
                      <SelectItem value="8">8 seconds</SelectItem>
                      <SelectItem value="10">10 seconds</SelectItem>
                      <SelectItem value="15">15 seconds</SelectItem>
                      <SelectItem value="20">20 seconds</SelectItem>
                      <SelectItem value="30">30 seconds</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">Aspect Ratio</label>
                  <Select value={aspectRatio} onValueChange={setAspectRatio}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="16:9">16:9 Landscape</SelectItem>
                      <SelectItem value="9:16">9:16 Vertical</SelectItem>
                      <SelectItem value="1:1">1:1 Square</SelectItem>
                      <SelectItem value="4:3">4:3 Standard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">Resolution</label>
                  <Select value={resolution} onValueChange={setResolution}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="720p">720p HD</SelectItem>
                      <SelectItem value="1080p">1080p Full HD</SelectItem>
                      <SelectItem value="4k">4K Ultra HD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">Style</label>
                  <Select value={style} onValueChange={setStyle}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cinematic">Cinematic</SelectItem>
                      <SelectItem value="documentary">Documentary</SelectItem>
                      <SelectItem value="commercial">Commercial</SelectItem>
                      <SelectItem value="dramatic">Dramatic</SelectItem>
                      <SelectItem value="luxury">Luxury</SelectItem>
                      <SelectItem value="energetic">Energetic</SelectItem>
                      <SelectItem value="corporate">Corporate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-semibold py-6 text-base"
                onClick={handleGenerate}
                disabled={generateMutation.isPending || (activeJob?.status === 'processing') || (activeJob?.status === 'queued')}
              >
                {generateMutation.isPending || activeJob?.status === 'processing' || activeJob?.status === 'queued' ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    {activeJob?.status === 'processing' ? 'Generating Video...' : 'Starting Generation...'}
                  </>
                ) : (
                  <>
                    <Film className="w-5 h-5 mr-2" />
                    Generate Real AI Video
                  </>
                )}
              </Button>

              {selectedEngineData?.status === 'needs_key' && (
                <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                  <div className="flex items-center gap-2 mb-1">
                    <Lock className="w-4 h-4 text-amber-600" />
                    <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">API Key Required</span>
                  </div>
                  <p className="text-[11px] text-amber-600 dark:text-amber-400">
                    This engine needs an API key to generate videos. The generation will show a demo preview until the key is configured.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-violet-500" />
                Cinematic Prompts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {currentUseCase?.prompts.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => setPrompt(p)}
                    className="w-full text-left text-xs p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-violet-50 dark:hover:bg-violet-900/20 text-slate-700 dark:text-slate-300 transition-colors border border-transparent hover:border-violet-200 dark:hover:border-violet-800 leading-relaxed"
                  >
                    <span className="text-violet-500 mr-1.5">{'\u25B6'}</span>
                    {p}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3 space-y-4">
          {(activeJob?.status === 'processing' || activeJob?.status === 'queued') && (
            <Card className="border-2 border-violet-200 dark:border-violet-800 overflow-hidden">
              <div className="bg-gradient-to-r from-violet-600 to-purple-600 p-1">
                <div className="bg-white dark:bg-slate-900 rounded-t-sm">
                  <CardContent className="py-12 text-center">
                    <div className="relative mx-auto w-24 h-24 mb-6">
                      <div className="absolute inset-0 rounded-full border-4 border-violet-200 dark:border-violet-800" />
                      <div className="absolute inset-0 rounded-full border-4 border-violet-600 border-t-transparent animate-spin" />
                      <Film className="w-10 h-10 text-violet-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
                      {getEngineName(activeJob.engine)} is creating your video...
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 mb-4 text-sm max-w-md mx-auto">
                      Generating real cinematic video with motion, lighting, and physics. This typically takes 60-120 seconds.
                    </p>
                    <div className="max-w-xs mx-auto">
                      <Progress value={activeJob.status === 'processing' ? 65 : 15} className="h-2 mb-2" />
                      <p className="text-xs text-slate-400 flex items-center justify-center gap-1">
                        <Clock className="w-3 h-3" />
                        {activeJob.status === 'queued' ? 'Queued...' : 'Processing...'}
                      </p>
                    </div>
                    <div className="mt-4 p-3 rounded-lg bg-slate-50 dark:bg-slate-800 max-w-sm mx-auto">
                      <p className="text-[11px] text-slate-500 italic">"{activeJob.prompt.slice(0, 120)}..."</p>
                    </div>
                  </CardContent>
                </div>
              </div>
            </Card>
          )}

          {activeJob?.status === 'completed' && activeJob.videoUrl && (
            <Card className="border-2 border-green-200 dark:border-green-800 overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    Video Ready
                  </CardTitle>
                  <Badge className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300">
                    {getEngineName(activeJob.engine)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
                  <video
                    src={activeJob.videoUrl}
                    controls
                    autoPlay
                    className="w-full h-full object-contain"
                    poster={activeJob.thumbnailUrl}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    className="flex-1"
                    onClick={() => {
                      const a = document.createElement('a');
                      a.href = activeJob.videoUrl!;
                      a.download = `ai-video-${Date.now()}.mp4`;
                      a.click();
                    }}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Video
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setActiveJob(null);
                      setPrompt('');
                    }}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    New Video
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {activeJob?.status === 'failed' && (
            <Card className="border-2 border-red-200 dark:border-red-800">
              <CardContent className="py-8 text-center">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Generation Failed</h3>
                <p className="text-sm text-slate-500 mb-4">{activeJob.error || 'An error occurred during video generation.'}</p>
                <Button onClick={() => { setActiveJob(null); }} variant="outline">
                  <RefreshCw className="w-4 h-4 mr-2" /> Try Again
                </Button>
              </CardContent>
            </Card>
          )}

          {!activeJob && (
            <div className="space-y-4">
              <Card className="bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/20 dark:to-purple-950/20 border-violet-200 dark:border-violet-800">
                <CardContent className="py-10 text-center">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-r from-violet-500 to-purple-600 mx-auto mb-6 flex items-center justify-center">
                    <Film className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-3">
                    Real AI Video Generation
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 max-w-lg mx-auto mb-2">
                    Not a slideshow. Not Ken Burns zoom. Real cinematic motion with moving people, flying debris, working machinery, and natural physics.
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6">
                    Powered by 6 world-class AI video engines -- choose the best one for your content.
                  </p>
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-3 max-w-2xl mx-auto">
                    {engines.map(engine => {
                      const meta = engineIcons[engine.id];
                      return (
                        <button
                          key={engine.id}
                          onClick={() => engine.status !== 'coming_soon' && setSelectedEngine(engine.id)}
                          className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${
                            selectedEngine === engine.id
                              ? 'border-violet-500 bg-white dark:bg-slate-800 shadow-lg scale-105'
                              : 'border-slate-200 dark:border-slate-700 hover:border-violet-300 dark:hover:border-violet-700 bg-white/50 dark:bg-slate-800/50'
                          } ${engine.status === 'coming_soon' ? 'opacity-50' : ''}`}
                          disabled={engine.status === 'coming_soon'}
                        >
                          {meta && (
                            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${meta.gradient} flex items-center justify-center`}>
                              <meta.icon className="w-4 h-4 text-white" />
                            </div>
                          )}
                          <span className="text-[9px] font-semibold text-slate-700 dark:text-slate-300 leading-tight text-center">
                            {engine.name.split(' ').slice(0, 2).join(' ')}
                          </span>
                          {engine.status === 'coming_soon' && (
                            <Badge variant="outline" className="text-[7px] px-1 py-0">Soon</Badge>
                          )}
                          {engine.status === 'ready' && (
                            <div className="w-2 h-2 rounded-full bg-green-500" />
                          )}
                          {engine.status === 'needs_key' && (
                            <div className="w-2 h-2 rounded-full bg-amber-500" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <div>
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                  <Clapperboard className="w-4 h-4 text-violet-500" />
                  Commercial Scene Builder
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                  {sceneTemplates.map((scene, i) => (
                    <button
                      key={i}
                      onClick={() => setPrompt(prev => prev ? `${prev}. ${scene.desc}` : scene.desc)}
                      className="p-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 hover:border-violet-300 dark:hover:border-violet-700 bg-white dark:bg-slate-800 text-left transition-all hover:shadow-md"
                    >
                      <div className="text-lg mb-1">{scene.icon}</div>
                      <h4 className="text-xs font-bold text-slate-800 dark:text-white mb-0.5">{scene.name}</h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">{scene.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setShowEngineDetails(!showEngineDetails)}
                className="w-full flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <MonitorPlay className="w-4 h-4 text-violet-500" />
                  Compare All 6 AI Video Engines
                </span>
                {showEngineDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showEngineDetails && (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {engines.map(engine => {
                    const meta = engineIcons[engine.id];
                    return (
                      <Card
                        key={engine.id}
                        className={`overflow-hidden cursor-pointer transition-all hover:shadow-lg ${
                          selectedEngine === engine.id ? 'ring-2 ring-violet-500' : ''
                        } ${engine.status === 'coming_soon' ? 'opacity-60' : ''}`}
                        onClick={() => engine.status !== 'coming_soon' && setSelectedEngine(engine.id)}
                      >
                        <div className={`h-1.5 bg-gradient-to-r ${meta?.gradient || 'from-slate-400 to-slate-500'}`} />
                        <CardContent className="pt-4 pb-3">
                          <div className="flex items-center gap-2 mb-2">
                            {meta && (
                              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${meta.gradient} flex items-center justify-center`}>
                                <meta.icon className="w-4 h-4 text-white" />
                              </div>
                            )}
                            <div>
                              <h4 className="text-sm font-bold">{engine.name}</h4>
                              <Badge variant="outline" className="text-[8px] px-1 py-0">{meta?.badge}</Badge>
                            </div>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2 leading-relaxed">{engine.description}</p>
                          <div className="flex flex-wrap gap-1 mb-2">
                            {engine.features.slice(0, 4).map((f, i) => (
                              <Badge key={i} variant="outline" className="text-[8px] px-1 py-0">{f}</Badge>
                            ))}
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-slate-500">
                            <span>Cost: {engine.costPerSecond}/sec</span>
                            <span>Max: {engine.maxDuration}s</span>
                          </div>
                          <div className="mt-2 flex items-center gap-1">
                            {engine.status === 'ready' && (
                              <Badge className="bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 text-[9px]">
                                <CheckCircle className="w-2.5 h-2.5 mr-0.5" /> Ready
                              </Badge>
                            )}
                            {engine.status === 'needs_key' && (
                              <Badge className="bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 text-[9px]">
                                <Lock className="w-2.5 h-2.5 mr-0.5" /> Needs API Key
                              </Badge>
                            )}
                            {engine.status === 'coming_soon' && (
                              <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-500 text-[9px]">
                                <Clock className="w-2.5 h-2.5 mr-0.5" /> Coming Soon
                              </Badge>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}

              {generatedVideos.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                    <Video className="w-4 h-4 text-violet-500" />
                    Generated Videos ({generatedVideos.length})
                  </h3>
                  <div className="grid md:grid-cols-2 gap-3">
                    {generatedVideos.map((video, i) => (
                      <Card key={i} className="overflow-hidden">
                        {video.videoUrl && (
                          <div className="aspect-video bg-black">
                            <video src={video.videoUrl} controls className="w-full h-full object-contain" poster={video.thumbnailUrl} />
                          </div>
                        )}
                        <CardContent className="pt-3 pb-3">
                          <div className="flex items-center justify-between mb-1">
                            <Badge variant="outline" className="text-[9px]">{getEngineName(video.engine)}</Badge>
                            <span className="text-[10px] text-slate-400">{new Date(video.createdAt).toLocaleTimeString()}</span>
                          </div>
                          <p className="text-[11px] text-slate-500 line-clamp-2">{video.prompt}</p>
                          {video.videoUrl && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="mt-2 w-full text-xs"
                              onClick={() => {
                                const a = document.createElement('a');
                                a.href = video.videoUrl!;
                                a.download = `ai-video-${Date.now()}.mp4`;
                                a.click();
                              }}
                            >
                              <Download className="w-3 h-3 mr-1" /> Download
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
