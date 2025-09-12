// HLS Video Stream Player Component
import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';

interface HlsPlayerProps {
  src: string;
  title?: string;
  poster?: string;
  autoPlay?: boolean;
  muted?: boolean;
  controls?: boolean;
  className?: string;
  onError?: (error: string) => void;
  onPlay?: () => void;
  onPause?: () => void;
}

declare global {
  interface Window {
    Hls: any;
  }
}

export function HlsPlayer({
  src,
  title,
  poster,
  autoPlay = false,
  muted = true,
  controls = true,
  className = '',
  onError,
  onPlay,
  onPause
}: HlsPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(muted);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hlsSupported, setHlsSupported] = useState(false);

  useEffect(() => {
    // Check for HLS.js support
    const checkHlsSupport = () => {
      if (window.Hls?.isSupported()) {
        setHlsSupported(true);
      } else if (videoRef.current?.canPlayType('application/vnd.apple.mpegurl')) {
        // Native HLS support (Safari)
        setHlsSupported(true);
      } else {
        setError('HLS streaming not supported in this browser');
        setIsLoading(false);
      }
    };

    // Load HLS.js if not already loaded
    if (!window.Hls) {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/hls.js@latest';
      script.onload = checkHlsSupport;
      script.onerror = () => {
        setError('Failed to load HLS.js library');
        setIsLoading(false);
      };
      document.head.appendChild(script);
    } else {
      checkHlsSupport();
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
    };
  }, []);

  useEffect(() => {
    if (!hlsSupported || !videoRef.current || !src) return;

    const video = videoRef.current;
    setIsLoading(true);
    setError(null);

    if (window.Hls?.isSupported()) {
      // Use HLS.js
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }

      const hls = new window.Hls({
        enableWorker: false,
        lowLatencyMode: true,
        backBufferLength: 90
      });

      hlsRef.current = hls;

      hls.loadSource(src);
      hls.attachMedia(video);

      hls.on(window.Hls.Events.MANIFEST_PARSED, () => {
        setIsLoading(false);
        if (autoPlay) {
          video.play().catch(console.warn);
        }
      });

      hls.on(window.Hls.Events.ERROR, (event: any, data: any) => {
        console.error('HLS Error:', data);
        const errorMsg = `HLS Error: ${data.type} - ${data.details}`;
        setError(errorMsg);
        setIsLoading(false);
        onError?.(errorMsg);
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS support
      video.src = src;
      video.addEventListener('loadedmetadata', () => {
        setIsLoading(false);
        if (autoPlay) {
          video.play().catch(console.warn);
        }
      });
      video.addEventListener('error', () => {
        const errorMsg = 'Native HLS playback error';
        setError(errorMsg);
        setIsLoading(false);
        onError?.(errorMsg);
      });
    }

    // Video event listeners
    const handlePlay = () => {
      setIsPlaying(true);
      onPlay?.();
    };

    const handlePause = () => {
      setIsPlaying(false);
      onPause?.();
    };

    const handleVolumeChange = () => {
      setIsMuted(video.muted);
    };

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('volumechange', handleVolumeChange);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('volumechange', handleVolumeChange);
    };
  }, [src, hlsSupported, autoPlay, onError, onPlay, onPause]);

  const togglePlay = () => {
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch(console.warn);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
  };

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-red-600">Stream Error</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center p-8">
            <p className="text-red-500 mb-4">{error}</p>
            <Button 
              onClick={() => window.location.reload()}
              data-testid="button-retry-stream"
            >
              Retry Stream
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      {title && (
        <CardHeader>
          <CardTitle data-testid="text-stream-title">{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent className="p-0">
        <div className="relative bg-black">
          <video
            ref={videoRef}
            className="w-full h-auto"
            poster={poster}
            muted={muted}
            playsInline
            controls={!controls}
            data-testid="video-hls-player"
          />
          
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
              <div className="text-white text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                <p>Loading stream...</p>
              </div>
            </div>
          )}

          {controls && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
              <div className="flex items-center justify-between">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={togglePlay}
                  disabled={isLoading}
                  data-testid="button-play-pause"
                >
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
                
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={toggleMute}
                  disabled={isLoading}
                  data-testid="button-mute-toggle"
                >
                  {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}