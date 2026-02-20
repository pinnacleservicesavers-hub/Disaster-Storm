import { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import {
  Play, Pause, RotateCcw, Download, Volume2, VolumeX,
  Film, Loader2, Maximize2, SkipForward
} from 'lucide-react';

interface VideoScene {
  description: string;
  duration: string;
  voiceover: string;
  visualNotes?: string;
}

interface VideoConcept {
  scenes: VideoScene[];
  music?: string;
  totalDuration?: string;
  style?: string;
}

interface VideoAdPlayerProps {
  imageUrl: string;
  videoConcept: VideoConcept;
  videoScript?: string;
  headline?: string;
  callToAction?: string;
}

function parseDuration(dur: string): number {
  const match = dur.match(/(\d+)/);
  return match ? parseInt(match[1]) : 5;
}

export default function VideoAdPlayer({ imageUrl, videoConcept, videoScript, headline, callToAction }: VideoAdPlayerProps) {
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false);
  const [isPrepared, setIsPrepared] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [progress, setProgress] = useState(0);
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const [loadedImage, setLoadedImage] = useState<HTMLImageElement | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [downloadAfterPrepare, setDownloadAfterPrepare] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef<number>(0);
  const pausedAtRef = useRef<number>(0);

  const scenes = (videoConcept.scenes && videoConcept.scenes.length > 0)
    ? videoConcept.scenes
    : [{ description: 'Video showcase', duration: '10 sec', voiceover: videoScript || 'Your video ad', visualNotes: '' }];
  const sceneDurations = scenes.map(s => parseDuration(s.duration));
  const totalDuration = Math.max(sceneDurations.reduce((a, b) => a + b, 0), 5);

  useEffect(() => {
    let cancelled = false;
    let blobUrl: string | null = null;
    setLoadedImage(null);

    const getProxyUrl = (url: string) => {
      try {
        const parsed = new URL(url);
        if (parsed.hostname.includes('openai') || parsed.hostname.includes('dalle') || parsed.hostname.includes('blob.core.windows.net')) {
          return `/api/ai-ads/proxy-image?url=${encodeURIComponent(url)}`;
        }
      } catch {}
      return url;
    };

    const loadImage = async () => {
      const proxyUrl = getProxyUrl(imageUrl);
      try {
        const resp = await fetch(proxyUrl);
        if (!resp.ok) throw new Error('fetch failed');
        const blob = await resp.blob();
        blobUrl = URL.createObjectURL(blob);
        const img = new window.Image();
        img.onload = () => { if (!cancelled) setLoadedImage(img); };
        img.onerror = () => {
          if (!cancelled) {
            console.warn('Blob URL load failed, retrying fetch');
            fetch(proxyUrl).then(r => r.blob()).then(b => {
              const retryUrl = URL.createObjectURL(b);
              const retry = new window.Image();
              retry.onload = () => { if (!cancelled) setLoadedImage(retry); };
              retry.src = retryUrl;
            }).catch(() => {});
          }
        };
        img.src = blobUrl;
      } catch {
        const img = new window.Image();
        img.onload = () => { if (!cancelled) setLoadedImage(img); };
        img.src = imageUrl;
      }
    };
    loadImage();
    return () => {
      cancelled = true;
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [imageUrl]);

  const prepareVideo = useCallback(async () => {
    setIsPreparing(true);
    try {
      const fullScript = scenes.map(s => s.voiceover).join(' ... ');
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: fullScript })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.audioBase64) {
          const audioUrl = `data:audio/${data.format || 'mp3'};base64,${data.audioBase64}`;
          setAudioSrc(audioUrl);
          const audio = new Audio(audioUrl);
          audio.preload = 'auto';
          audioRef.current = audio;
        }
      }
      setIsPrepared(true);
      toast({ title: "Video Ready!", description: "Click play to watch your video ad with voiceover." });
    } catch (err) {
      console.error('Failed to prepare voiceover:', err);
      setIsPrepared(true);
      toast({ title: "Video Ready", description: "Voiceover unavailable, playing with captions only." });
    }
    setIsPreparing(false);
  }, [scenes, toast]);

  const getSceneAtTime = (time: number) => {
    let elapsed = 0;
    for (let i = 0; i < scenes.length; i++) {
      const sceneDur = sceneDurations[i];
      if (time < elapsed + sceneDur) {
        return { index: i, sceneProgress: (time - elapsed) / sceneDur };
      }
      elapsed += sceneDur;
    }
    return { index: scenes.length - 1, sceneProgress: 1 };
  };

  const drawFrame = useCallback((timestamp: number) => {
    const canvas = canvasRef.current;
    if (!canvas || !loadedImage) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const elapsed = (timestamp - startTimeRef.current) / 1000;
    const time = pausedAtRef.current + elapsed;

    if (time >= totalDuration) {
      setIsPlaying(false);
      setCurrentTime(totalDuration);
      setCurrentSceneIndex(scenes.length - 1);
      if (audioRef.current) {
        audioRef.current.pause();
      }
      return;
    }

    setCurrentTime(time);
    const { index, sceneProgress } = getSceneAtTime(time);
    setCurrentSceneIndex(index);

    const w = canvas.width;
    const h = canvas.height;

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, w, h);

    const kenBurnsEffects = [
      { startScale: 1.0, endScale: 1.05, startX: 0, endX: 0, startY: 0, endY: -0.01 },
      { startScale: 1.05, endScale: 1.0, startX: 0, endX: 0, startY: -0.01, endY: 0 },
      { startScale: 1.0, endScale: 1.04, startX: 0, endX: -0.015, startY: 0, endY: 0 },
      { startScale: 1.04, endScale: 1.0, startX: -0.015, endX: 0, startY: 0, endY: 0 },
      { startScale: 1.0, endScale: 1.06, startX: 0, endX: 0, startY: 0, endY: 0 },
    ];

    const effect = kenBurnsEffects[index % kenBurnsEffects.length];
    const eased = 0.5 - Math.cos(sceneProgress * Math.PI) / 2;

    const scale = effect.startScale + (effect.endScale - effect.startScale) * eased;
    const panX = (effect.startX + (effect.endX - effect.startX) * eased) * w;
    const panY = (effect.startY + (effect.endY - effect.startY) * eased) * h;

    const imgRatio = loadedImage.width / loadedImage.height;
    const canvasRatio = w / h;
    let drawW: number, drawH: number;
    if (imgRatio > canvasRatio) {
      drawH = h * scale;
      drawW = drawH * imgRatio;
    } else {
      drawW = w * scale;
      drawH = drawW / imgRatio;
    }
    const drawX = (w - drawW) / 2 + panX;
    const drawY = (h - drawH) / 2 + panY;

    ctx.drawImage(loadedImage, drawX, drawY, drawW, drawH);

    const scene = scenes[index];

    const fadeIn = Math.min(sceneProgress * 4, 1);
    const fadeOut = Math.min((1 - sceneProgress) * 4, 1);
    const opacity = Math.min(fadeIn, fadeOut);

    ctx.save();
    const gradient = ctx.createLinearGradient(0, h * 0.6, 0, h);
    gradient.addColorStop(0, `rgba(0,0,0,0)`);
    gradient.addColorStop(0.3, `rgba(0,0,0,${0.5 * opacity})`);
    gradient.addColorStop(1, `rgba(0,0,0,${0.85 * opacity})`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, h * 0.6, w, h * 0.4);

    if (scene) {
      ctx.textAlign = 'center';
      ctx.globalAlpha = opacity;

      ctx.font = `bold ${Math.round(w * 0.028)}px "Inter", "Segoe UI", system-ui, sans-serif`;
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 6;

      const voText = `"${scene.voiceover}"`;
      const maxWidth = w * 0.85;
      const words = voText.split(' ');
      const lines: string[] = [];
      let currentLine = '';
      for (const word of words) {
        const test = currentLine ? `${currentLine} ${word}` : word;
        if (ctx.measureText(test).width > maxWidth) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = test;
        }
      }
      if (currentLine) lines.push(currentLine);

      const lineHeight = Math.round(w * 0.035);
      const startY = h - 20 - (lines.length * lineHeight);
      lines.forEach((line, li) => {
        ctx.fillText(line, w / 2, startY + li * lineHeight);
      });

      ctx.font = `${Math.round(w * 0.018)}px "Inter", "Segoe UI", system-ui, sans-serif`;
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.shadowBlur = 4;
      ctx.fillText(`Scene ${index + 1}/${scenes.length}`, w / 2, h - 8);
    }

    if (index === 0 && sceneProgress < 0.3 && headline) {
      const headFade = Math.min(sceneProgress * 6, 1) * (sceneProgress < 0.25 ? 1 : Math.max(0, (0.3 - sceneProgress) * 20));
      ctx.globalAlpha = headFade;
      ctx.font = `bold ${Math.round(w * 0.045)}px "Inter", "Segoe UI", system-ui, sans-serif`;
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = 'rgba(0,0,0,0.9)';
      ctx.shadowBlur = 10;
      ctx.fillText(headline, w / 2, h * 0.15);
    }

    if (index === scenes.length - 1 && sceneProgress > 0.7 && callToAction) {
      const ctaFade = Math.min((sceneProgress - 0.7) * 5, 1);
      ctx.globalAlpha = ctaFade;

      const ctaW = Math.min(w * 0.5, ctx.measureText(callToAction).width + 60);
      const ctaH = Math.round(w * 0.055);
      const ctaX = (w - ctaW) / 2;
      const ctaY = h * 0.42;

      ctx.shadowBlur = 0;
      ctx.fillStyle = '#f97316';
      const radius = ctaH / 2;
      ctx.beginPath();
      ctx.moveTo(ctaX + radius, ctaY);
      ctx.lineTo(ctaX + ctaW - radius, ctaY);
      ctx.quadraticCurveTo(ctaX + ctaW, ctaY, ctaX + ctaW, ctaY + radius);
      ctx.quadraticCurveTo(ctaX + ctaW, ctaY + ctaH, ctaX + ctaW - radius, ctaY + ctaH);
      ctx.lineTo(ctaX + radius, ctaY + ctaH);
      ctx.quadraticCurveTo(ctaX, ctaY + ctaH, ctaX, ctaY + radius);
      ctx.quadraticCurveTo(ctaX, ctaY, ctaX + radius, ctaY);
      ctx.fill();

      ctx.font = `bold ${Math.round(w * 0.025)}px "Inter", "Segoe UI", system-ui, sans-serif`;
      ctx.fillStyle = '#ffffff';
      ctx.fillText(callToAction, w / 2, ctaY + ctaH / 2 + Math.round(w * 0.008));
    }

    ctx.restore();

    const barY = 0;
    const barH = 3;
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.fillRect(0, barY, w, barH);
    ctx.fillStyle = '#f97316';
    ctx.fillRect(0, barY, (time / totalDuration) * w, barH);

    setProgress((time / totalDuration) * 100);

    animFrameRef.current = requestAnimationFrame(drawFrame);
  }, [loadedImage, scenes, sceneDurations, totalDuration, headline, callToAction]);

  const play = useCallback(() => {
    if (!loadedImage) return;
    startTimeRef.current = performance.now();
    setIsPlaying(true);

    if (audioRef.current) {
      audioRef.current.currentTime = pausedAtRef.current;
      audioRef.current.muted = isMuted;
      audioRef.current.onended = () => {
        cancelAnimationFrame(animFrameRef.current);
        setIsPlaying(false);
        setCurrentTime(totalDuration);
        setProgress(100);
        pausedAtRef.current = 0;
      };
      audioRef.current.play().catch(() => {});
    }

    animFrameRef.current = requestAnimationFrame(drawFrame);
  }, [loadedImage, drawFrame, isMuted, totalDuration]);

  const pause = useCallback(() => {
    setIsPlaying(false);
    pausedAtRef.current += (performance.now() - startTimeRef.current) / 1000;
    cancelAnimationFrame(animFrameRef.current);

    if (audioRef.current) {
      audioRef.current.pause();
    }
  }, []);

  const restart = useCallback(() => {
    cancelAnimationFrame(animFrameRef.current);
    pausedAtRef.current = 0;
    setCurrentTime(0);
    setCurrentSceneIndex(0);
    setProgress(0);

    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.pause();
    }

    startTimeRef.current = performance.now();
    setIsPlaying(true);

    if (audioRef.current) {
      audioRef.current.muted = isMuted;
      audioRef.current.play().catch(() => {});
    }

    animFrameRef.current = requestAnimationFrame(drawFrame);
  }, [drawFrame, isMuted]);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      const newMuted = !prev;
      if (audioRef.current) {
        audioRef.current.muted = newMuted;
      }
      return newMuted;
    });
  }, []);

  const downloadVideo = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas || !loadedImage) return;

    setIsRecording(true);
    toast({ title: "Recording Video", description: "Capturing your video ad... This takes a moment." });

    try {
      const stream = canvas.captureStream(30);

      if (audioRef.current && audioSrc) {
        try {
          const audioCtx = new AudioContext();
          const resp = await fetch(audioSrc);
          const arrBuf = await resp.arrayBuffer();
          const audioBuffer = await audioCtx.decodeAudioData(arrBuf);
          const source = audioCtx.createBufferSource();
          source.buffer = audioBuffer;
          const dest = audioCtx.createMediaStreamDestination();
          source.connect(dest);
          dest.stream.getAudioTracks().forEach(t => stream.addTrack(t));
          source.start(0);
        } catch (audioErr) {
          console.error('Could not add audio to recording:', audioErr);
        }
      }

      const mimeTypes = [
        'video/webm;codecs=vp9',
        'video/webm;codecs=vp8',
        'video/webm',
        'video/mp4'
      ];
      const supportedMime = mimeTypes.find(m => MediaRecorder.isTypeSupported(m)) || '';
      const recorder = new MediaRecorder(stream, {
        ...(supportedMime ? { mimeType: supportedMime } : {}),
        videoBitsPerSecond: 5000000
      });

      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const ext = supportedMime.includes('mp4') ? 'mp4' : 'webm';
        const blob = new Blob(chunks, { type: supportedMime || 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `video-ad-${Date.now()}.${ext}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setIsRecording(false);
        toast({ title: "Video Downloaded!", description: "Your video ad has been saved." });
      };

      recorder.onerror = () => {
        setIsRecording(false);
        toast({ title: "Recording Failed", description: "Could not capture video.", variant: "destructive" });
      };

      recorder.start();

      pausedAtRef.current = 0;
      startTimeRef.current = performance.now();
      setIsPlaying(true);
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.muted = false;
        audioRef.current.play().catch(() => {});
      }

      animFrameRef.current = requestAnimationFrame(drawFrame);

      setTimeout(() => {
        recorder.stop();
        cancelAnimationFrame(animFrameRef.current);
        setIsPlaying(false);
        stream.getTracks().forEach(t => t.stop());
      }, totalDuration * 1000 + 500);

    } catch (err) {
      console.error('Recording failed:', err);
      setIsRecording(false);
      toast({ title: "Recording Failed", description: "Could not capture video. Try using a different browser.", variant: "destructive" });
    }
  }, [loadedImage, audioSrc, drawFrame, totalDuration, toast]);

  useEffect(() => {
    if (downloadAfterPrepare && isPrepared && !isPreparing && !isRecording) {
      setDownloadAfterPrepare(false);
      setTimeout(() => downloadVideo(), 300);
    }
  }, [downloadAfterPrepare, isPrepared, isPreparing, isRecording, downloadVideo]);

  useEffect(() => {
    return () => {
      cancelAnimationFrame(animFrameRef.current);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (loadedImage && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        const w = canvasRef.current.width;
        const h = canvasRef.current.height;
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, w, h);
        const imgRatio = loadedImage.width / loadedImage.height;
        const canvasRatio = w / h;
        let drawW: number, drawH: number;
        if (imgRatio > canvasRatio) {
          drawH = h;
          drawW = drawH * imgRatio;
        } else {
          drawW = w;
          drawH = drawW / imgRatio;
        }
        ctx.drawImage(loadedImage, (w - drawW) / 2, (h - drawH) / 2, drawW, drawH);

        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.fillRect(0, 0, w, h);
        ctx.textAlign = 'center';
        ctx.font = `bold ${Math.round(w * 0.04)}px "Inter", system-ui, sans-serif`;
        ctx.fillStyle = '#ffffff';
        ctx.fillText('▶  Click Play to Watch Your Video Ad', w / 2, h / 2);
        ctx.font = `${Math.round(w * 0.022)}px "Inter", system-ui, sans-serif`;
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.fillText(`${scenes.length} scenes · ${totalDuration}s · AI voiceover`, w / 2, h / 2 + Math.round(w * 0.045));
      }
    }
  }, [loadedImage, scenes.length, totalDuration]);

  const currentScene = scenes[currentSceneIndex];

  return (
    <Card className="overflow-hidden border-2 border-purple-200 dark:border-purple-800 bg-gradient-to-b from-purple-50/50 to-white dark:from-purple-950/20 dark:to-slate-900">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Film className="w-5 h-5 text-purple-600" />
          Video Ad Preview
          <Badge variant="outline" className="ml-auto text-xs">
            {totalDuration}s · {scenes.length} scenes
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div ref={containerRef} className="relative rounded-lg overflow-hidden bg-black" style={{ aspectRatio: '16/9' }}>
          <canvas
            ref={canvasRef}
            width={1280}
            height={720}
            className="w-full h-full cursor-pointer"
            onClick={() => {
              if (!isPrepared && !isPreparing) {
                prepareVideo();
              } else if (isPlaying) {
                pause();
              } else {
                play();
              }
            }}
          />

          {!loadedImage && !isPreparing && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80">
              <div className="text-center text-white">
                <Loader2 className="w-10 h-10 animate-spin mx-auto mb-3 text-purple-400" />
                <p className="text-sm text-white/70">Loading video preview...</p>
              </div>
            </div>
          )}

          {isPreparing && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60">
              <div className="text-center text-white">
                <Loader2 className="w-12 h-12 animate-spin mx-auto mb-3" />
                <p className="text-lg font-semibold">Generating Voiceover...</p>
                <p className="text-sm text-white/70">Rachel is recording your narration</p>
              </div>
            </div>
          )}

          {!isPlaying && isPrepared && currentTime === 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer" onClick={play}>
              <div className="w-20 h-20 rounded-full bg-white/90 flex items-center justify-center shadow-2xl hover:scale-110 transition-transform">
                <Play className="w-10 h-10 text-purple-600 ml-1" />
              </div>
            </div>
          )}

          {!isPlaying && currentTime >= totalDuration && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 cursor-pointer" onClick={restart}>
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-2xl mx-auto mb-3 hover:scale-110 transition-transform">
                  <RotateCcw className="w-8 h-8 text-purple-600" />
                </div>
                <p className="text-white font-semibold text-lg">Replay</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 px-1">
          {!isPrepared ? (
            <Button size="sm" className="bg-purple-600 hover:bg-purple-700" onClick={prepareVideo} disabled={isPreparing || !loadedImage}>
              {isPreparing ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" />Preparing...</> : <><Play className="w-4 h-4 mr-1" />Prepare Video</>}
            </Button>
          ) : (
            <>
              <Button size="icon" variant="outline" className="h-8 w-8" onClick={isPlaying ? pause : play} disabled={!loadedImage}>
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </Button>
              <Button size="icon" variant="outline" className="h-8 w-8" onClick={restart}>
                <RotateCcw className="w-4 h-4" />
              </Button>
              <Button size="icon" variant="outline" className="h-8 w-8" onClick={toggleMute}>
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </Button>
            </>
          )}

          <div className="flex-1 mx-2">
            <Progress value={progress} className="h-1.5" />
          </div>

          <span className="text-xs text-slate-500 font-mono min-w-[60px] text-right">
            {Math.floor(currentTime)}s / {totalDuration}s
          </span>

          {isPrepared ? (
            <Button size="sm" variant="outline" onClick={downloadVideo} disabled={isRecording || !loadedImage}>
              {isRecording ? <><Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />Recording...</> : <><Download className="w-3.5 h-3.5 mr-1" />Download Video</>}
            </Button>
          ) : (
            <Button size="sm" variant="outline" onClick={() => {
              setDownloadAfterPrepare(true);
              prepareVideo();
            }} disabled={isPreparing || !loadedImage}>
              {isPreparing ? <><Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />Preparing...</> : <><Download className="w-3.5 h-3.5 mr-1" />Download Video</>}
            </Button>
          )}
        </div>

        {!isPrepared && !isPreparing && (
          <div className="p-2.5 bg-purple-50 dark:bg-purple-950/30 rounded-lg border border-purple-200 dark:border-purple-800">
            <p className="text-xs text-slate-600 dark:text-slate-400 text-center">Click <strong>Download Video</strong> to generate voiceover and record your video ad for download</p>
          </div>
        )}

        {currentScene && isPlaying && (
          <div className="p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg border border-purple-200 dark:border-purple-800">
            <div className="flex items-center gap-2 mb-1">
              <Badge className="bg-purple-600 text-white text-xs">Scene {currentSceneIndex + 1}</Badge>
              <span className="text-xs text-slate-500">{currentScene.duration}</span>
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-300 italic">"{currentScene.voiceover}"</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
