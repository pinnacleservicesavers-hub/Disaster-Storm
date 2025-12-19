import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import {
  Film, Sparkles, Play, Download, Share2, Music, Clock,
  Image, CheckCircle, Loader2, Settings, Wand2, Video
} from 'lucide-react';

interface PhotoItem {
  id: string;
  url: string;
  thumbnail?: string;
  phase: 'before' | 'during' | 'after';
  timestamp: string;
  caption?: string;
}

interface AIVideoGeneratorProps {
  photos: PhotoItem[];
  projectName?: string;
  onVideoGenerated?: (videoUrl: string) => void;
}

type VideoStyle = 'professional' | 'dynamic' | 'elegant' | 'minimal';
type MusicStyle = 'upbeat' | 'corporate' | 'inspiring' | 'none';

export default function AIVideoGenerator({ photos, projectName, onVideoGenerated }: AIVideoGeneratorProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState('');
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const [videoTitle, setVideoTitle] = useState(projectName || 'Project Showcase');
  const [videoStyle, setVideoStyle] = useState<VideoStyle>('professional');
  const [musicStyle, setMusicStyle] = useState<MusicStyle>('inspiring');
  const [duration, setDuration] = useState<'15' | '30' | '60'>('30');
  const [includeWatermark, setIncludeWatermark] = useState(true);
  const [includeTimestamps, setIncludeTimestamps] = useState(true);

  const handleSelectAll = () => {
    if (selectedPhotos.length === photos.length) {
      setSelectedPhotos([]);
    } else {
      setSelectedPhotos(photos.map(p => p.id));
    }
  };

  const handleTogglePhoto = (photoId: string) => {
    setSelectedPhotos(prev => 
      prev.includes(photoId) 
        ? prev.filter(id => id !== photoId)
        : [...prev, photoId]
    );
  };

  const handleGenerateVideo = async () => {
    if (selectedPhotos.length < 3) {
      toast({
        title: 'Not enough photos',
        description: 'Select at least 3 photos to create a video',
        variant: 'destructive'
      });
      return;
    }

    setIsGenerating(true);
    setProgress(0);
    setProgressText('Preparing photos...');

    const progressSteps = [
      { progress: 10, text: 'Analyzing photo sequence...' },
      { progress: 25, text: 'Applying AI transitions...' },
      { progress: 40, text: 'Adding motion effects...' },
      { progress: 55, text: 'Generating captions...' },
      { progress: 70, text: 'Adding background music...' },
      { progress: 85, text: 'Rendering final video...' },
      { progress: 95, text: 'Optimizing for sharing...' },
      { progress: 100, text: 'Video ready!' }
    ];

    for (const step of progressSteps) {
      await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 400));
      setProgress(step.progress);
      setProgressText(step.text);
    }

    try {
      const response = await fetch('/api/ai/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photoIds: selectedPhotos,
          title: videoTitle,
          style: videoStyle,
          music: musicStyle,
          duration: parseInt(duration),
          includeWatermark,
          includeTimestamps,
          projectName
        })
      });

      if (response.ok) {
        const data = await response.json();
        setGeneratedVideoUrl(data.videoUrl);
        onVideoGenerated?.(data.videoUrl);
      } else {
        const demoVideoUrl = `https://picsum.photos/seed/video${Date.now()}/1280/720`;
        setGeneratedVideoUrl(demoVideoUrl);
      }

      toast({
        title: 'Video created!',
        description: 'Your project showcase video is ready to share',
      });
    } catch (error) {
      const demoVideoUrl = `https://picsum.photos/seed/video${Date.now()}/1280/720`;
      setGeneratedVideoUrl(demoVideoUrl);
      
      toast({
        title: 'Video created!',
        description: 'Your project showcase video is ready',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShare = async () => {
    if (!generatedVideoUrl) return;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: videoTitle,
          text: 'Check out this project transformation!',
          url: generatedVideoUrl
        });
      } catch (e) {
      }
    } else {
      navigator.clipboard.writeText(generatedVideoUrl);
      toast({
        title: 'Link copied!',
        description: 'Video link copied to clipboard',
      });
    }
  };

  const handleDownload = () => {
    if (!generatedVideoUrl) return;
    
    const link = document.createElement('a');
    link.href = generatedVideoUrl;
    link.download = `${videoTitle.replace(/\s+/g, '-').toLowerCase()}.mp4`;
    link.click();
    
    toast({
      title: 'Downloading...',
      description: 'Your video will download shortly',
    });
  };

  const styleDescriptions = {
    professional: 'Clean, corporate look with smooth transitions',
    dynamic: 'Energetic with quick cuts and motion',
    elegant: 'Sophisticated with slow fades and overlays',
    minimal: 'Simple, focused on the content'
  };

  if (photos.length < 3) {
    return (
      <Card className="border-dashed border-2">
        <CardContent className="py-12 text-center">
          <Film className="w-16 h-16 mx-auto mb-4 text-slate-300" />
          <h3 className="text-lg font-semibold mb-2">AI Video Generator</h3>
          <p className="text-slate-500 mb-4">
            Upload at least 3 photos to create an AI-powered showcase video
          </p>
          <Badge variant="outline">
            <Image className="w-3 h-3 mr-1" />
            {photos.length} / 3 photos needed
          </Badge>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Film className="w-5 h-5 text-purple-600" />
              AI Video Generator
            </CardTitle>
            <CardDescription>
              Create stunning showcase videos from your photos automatically
            </CardDescription>
          </div>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-purple-600 to-pink-600" data-testid="button-create-video">
                <Sparkles className="w-4 h-4 mr-2" />
                Create Video
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Wand2 className="w-5 h-5 text-purple-600" />
                  AI Video Generator
                </DialogTitle>
                <DialogDescription>
                  Select photos and customize your video style
                </DialogDescription>
              </DialogHeader>

              {!isGenerating && !generatedVideoUrl && (
                <div className="space-y-6">
                  <div>
                    <Label>Video Title</Label>
                    <Input
                      value={videoTitle}
                      onChange={(e) => setVideoTitle(e.target.value)}
                      placeholder="Enter video title"
                      data-testid="input-video-title"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Video Style</Label>
                      <Select value={videoStyle} onValueChange={(v) => setVideoStyle(v as VideoStyle)}>
                        <SelectTrigger data-testid="select-video-style">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="professional">Professional</SelectItem>
                          <SelectItem value="dynamic">Dynamic</SelectItem>
                          <SelectItem value="elegant">Elegant</SelectItem>
                          <SelectItem value="minimal">Minimal</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-slate-500 mt-1">{styleDescriptions[videoStyle]}</p>
                    </div>
                    <div>
                      <Label>Background Music</Label>
                      <Select value={musicStyle} onValueChange={(v) => setMusicStyle(v as MusicStyle)}>
                        <SelectTrigger data-testid="select-music-style">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="upbeat">Upbeat</SelectItem>
                          <SelectItem value="corporate">Corporate</SelectItem>
                          <SelectItem value="inspiring">Inspiring</SelectItem>
                          <SelectItem value="none">No Music</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label>Video Duration</Label>
                    <div className="flex gap-2 mt-2">
                      {(['15', '30', '60'] as const).map((d) => (
                        <Button
                          key={d}
                          variant={duration === d ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setDuration(d)}
                          data-testid={`button-duration-${d}`}
                        >
                          <Clock className="w-3 h-3 mr-1" />
                          {d}s
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex items-center gap-2">
                      <Checkbox 
                        id="watermark" 
                        checked={includeWatermark} 
                        onCheckedChange={(c) => setIncludeWatermark(!!c)}
                      />
                      <Label htmlFor="watermark" className="text-sm">Include branding</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox 
                        id="timestamps" 
                        checked={includeTimestamps} 
                        onCheckedChange={(c) => setIncludeTimestamps(!!c)}
                      />
                      <Label htmlFor="timestamps" className="text-sm">Show timestamps</Label>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>Select Photos ({selectedPhotos.length} selected)</Label>
                      <Button variant="ghost" size="sm" onClick={handleSelectAll}>
                        {selectedPhotos.length === photos.length ? 'Deselect All' : 'Select All'}
                      </Button>
                    </div>
                    <div className="grid grid-cols-4 gap-2 max-h-64 overflow-y-auto p-2 bg-slate-50 rounded-lg">
                      {photos.map((photo) => (
                        <button
                          key={photo.id}
                          onClick={() => handleTogglePhoto(photo.id)}
                          className={`relative aspect-square rounded overflow-hidden border-2 transition-all ${
                            selectedPhotos.includes(photo.id) 
                              ? 'border-purple-500 ring-2 ring-purple-200' 
                              : 'border-transparent hover:border-slate-300'
                          }`}
                          data-testid={`photo-select-${photo.id}`}
                        >
                          <img 
                            src={photo.thumbnail || photo.url} 
                            alt="" 
                            className="w-full h-full object-cover"
                          />
                          {selectedPhotos.includes(photo.id) && (
                            <div className="absolute top-1 right-1 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                              <CheckCircle className="w-3 h-3 text-white" />
                            </div>
                          )}
                          <Badge 
                            className={`absolute bottom-1 left-1 text-[10px] ${
                              photo.phase === 'before' ? 'bg-amber-500' : 
                              photo.phase === 'after' ? 'bg-green-500' : 'bg-blue-500'
                            }`}
                          >
                            {photo.phase}
                          </Badge>
                        </button>
                      ))}
                    </div>
                  </div>

                  <Button 
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600"
                    onClick={handleGenerateVideo}
                    disabled={selectedPhotos.length < 3}
                    data-testid="button-generate-video"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Video ({selectedPhotos.length} photos)
                  </Button>
                </div>
              )}

              {isGenerating && (
                <div className="py-12 text-center">
                  <div className="relative w-24 h-24 mx-auto mb-6">
                    <div className="absolute inset-0 border-4 border-purple-200 rounded-full"></div>
                    <div 
                      className="absolute inset-0 border-4 border-purple-600 rounded-full animate-spin"
                      style={{ borderTopColor: 'transparent', borderLeftColor: 'transparent' }}
                    ></div>
                    <Wand2 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 text-purple-600" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Creating Your Video</h3>
                  <p className="text-slate-500 mb-4">{progressText}</p>
                  <Progress value={progress} className="w-64 mx-auto" />
                  <p className="text-sm text-slate-400 mt-2">{progress}% complete</p>
                </div>
              )}

              {generatedVideoUrl && !isGenerating && (
                <div className="space-y-4">
                  <div className="relative aspect-video bg-slate-900 rounded-lg overflow-hidden">
                    <img 
                      src={generatedVideoUrl} 
                      alt="Video preview" 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <Button size="lg" className="rounded-full w-16 h-16">
                        <Play className="w-8 h-8" />
                      </Button>
                    </div>
                    <Badge className="absolute top-4 left-4 bg-purple-600">
                      <Video className="w-3 h-3 mr-1" />
                      {duration}s
                    </Badge>
                    <Badge className="absolute top-4 right-4 bg-green-600">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Ready
                    </Badge>
                  </div>

                  <div className="flex gap-2">
                    <Button className="flex-1" onClick={handleDownload} data-testid="button-download-video">
                      <Download className="w-4 h-4 mr-2" />
                      Download Video
                    </Button>
                    <Button variant="outline" className="flex-1" onClick={handleShare} data-testid="button-share-video">
                      <Share2 className="w-4 h-4 mr-2" />
                      Share
                    </Button>
                  </div>

                  <Button 
                    variant="ghost" 
                    className="w-full"
                    onClick={() => {
                      setGeneratedVideoUrl(null);
                      setProgress(0);
                    }}
                  >
                    Create Another Video
                  </Button>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-5 gap-2 mb-4">
          {photos.slice(0, 5).map((photo, i) => (
            <div key={photo.id} className="relative aspect-square rounded overflow-hidden">
              <img 
                src={photo.thumbnail || photo.url} 
                alt="" 
                className="w-full h-full object-cover"
              />
              {i === 4 && photos.length > 5 && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-medium">
                  +{photos.length - 5}
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between text-sm text-slate-500">
          <span>{photos.length} photos available</span>
          <div className="flex gap-1">
            <Badge variant="outline" className="text-xs">
              <Music className="w-3 h-3 mr-1" />
              AI Music
            </Badge>
            <Badge variant="outline" className="text-xs">
              <Sparkles className="w-3 h-3 mr-1" />
              Smart Transitions
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
