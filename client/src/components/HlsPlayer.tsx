// HLS Video Stream Player Component
import { useEffect, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Play, Pause, Volume2, VolumeX, Eye, AlertTriangle, CheckCircle } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface HlsPlayerProps {
  src: string;
  cameraId?: string;
  title?: string;
  location?: string;
  poster?: string;
  autoPlay?: boolean;
  muted?: boolean;
  controls?: boolean;
  enableDamageDetection?: boolean;
  damageAnalysisInterval?: number; // milliseconds
  className?: string;
  onError?: (error: string) => void;
  onPlay?: () => void;
  onPause?: () => void;
  onDamageDetected?: (detections: any[]) => void;
}

interface DamageDetection {
  alertType: string;
  confidence: number;
  severity: 'minor' | 'moderate' | 'severe' | 'critical';
  description: string;
  urgencyLevel: 'low' | 'normal' | 'high' | 'emergency';
}

interface DamageAnalysisResult {
  hasDetection: boolean;
  detections: DamageDetection[];
  confidence: number;
  analysisTimestamp: string;
  processingTimeMs: number;
}

declare global {
  interface Window {
    Hls: any;
  }
}

export function HlsPlayer({
  src,
  cameraId,
  title,
  location,
  poster,
  autoPlay = false,
  muted = true,
  controls = true,
  enableDamageDetection = false,
  damageAnalysisInterval = 30000, // 30 seconds default
  className = '',
  onError,
  onPlay,
  onPause,
  onDamageDetected
}: HlsPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<any>(null);
  const analysisIntervalRef = useRef<NodeJS.Timeout>();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(muted);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hlsSupported, setHlsSupported] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<DamageAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Damage detection mutation
  const damageAnalysisMutation = useMutation({
    mutationFn: async (imageData: string) => {
      return apiRequest('/api/analyze-damage', {
        method: 'POST',
        body: JSON.stringify({
          cameraId,
          imageData,
          location: location || title
        })
      });
    },
    onSuccess: (result) => {
      setAnalysisResult(result);
      setIsAnalyzing(false);
      
      if (result.hasDetection && result.detections.length > 0) {
        console.log(`🚨 Damage detected in HLS stream ${title}: ${result.detections.length} alerts`);
        onDamageDetected?.(result.detections);
      }
    },
    onError: (error) => {
      console.error('HLS damage analysis failed:', error);
      setIsAnalyzing(false);
    }
  });

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

  // Frame capture and damage analysis function
  const captureFrameAndAnalyze = async () => {
    if (!videoRef.current || isAnalyzing || !enableDamageDetection) return;

    setIsAnalyzing(true);
    
    try {
      // Create canvas to capture current video frame
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Canvas context not available');
      }
      
      canvas.width = videoRef.current.videoWidth || videoRef.current.clientWidth;
      canvas.height = videoRef.current.videoHeight || videoRef.current.clientHeight;
      
      // Draw current video frame to canvas
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const imageData = canvas.toDataURL('image/jpeg', 0.8);
      
      // Trigger AI analysis
      damageAnalysisMutation.mutate(imageData);
    } catch (error) {
      console.error('Error capturing video frame for analysis:', error);
      setIsAnalyzing(false);
    }
  };

  // Auto-analysis effect
  useEffect(() => {
    if (enableDamageDetection && damageAnalysisInterval > 0 && isPlaying && !isAnalyzing) {
      analysisIntervalRef.current = setInterval(captureFrameAndAnalyze, damageAnalysisInterval);
    } else if (analysisIntervalRef.current) {
      clearInterval(analysisIntervalRef.current);
    }

    return () => {
      if (analysisIntervalRef.current) {
        clearInterval(analysisIntervalRef.current);
      }
    };
  }, [enableDamageDetection, damageAnalysisInterval, isPlaying, isAnalyzing]);

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

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-600';
      case 'severe': return 'bg-orange-500';
      case 'moderate': return 'bg-yellow-500';
      case 'minor': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case 'emergency': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'high': return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      default: return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
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
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle data-testid="text-stream-title">{title}</CardTitle>
              {location && (
                <p className="text-sm text-gray-600 mt-1" data-testid="text-stream-location">
                  {location}
                </p>
              )}
            </div>
            {enableDamageDetection && (
              <Button
                size="sm"
                variant="outline"
                onClick={captureFrameAndAnalyze}
                disabled={isAnalyzing || isLoading || !isPlaying}
                data-testid="button-analyze-hls-damage"
              >
                <Eye className={`h-4 w-4 ${isAnalyzing ? 'animate-pulse' : ''}`} />
                {isAnalyzing ? 'Analyzing...' : 'Analyze Frame'}
              </Button>
            )}
          </div>
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

          {isAnalyzing && (
            <div className="absolute top-2 left-2 bg-blue-600 text-white px-2 py-1 rounded text-xs flex items-center">
              <Eye className="h-3 w-3 mr-1 animate-pulse" />
              AI Analyzing Frame...
            </div>
          )}

          {/* Analysis Results Overlay */}
          {analysisResult && analysisResult.hasDetection && (
            <div className="absolute top-2 right-2">
              <Badge className="bg-red-600 text-white">
                {analysisResult.detections.length} Damage Alert{analysisResult.detections.length > 1 ? 's' : ''}
              </Badge>
            </div>
          )}

          {/* Auto-analysis indicator */}
          {enableDamageDetection && isPlaying && (
            <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs">
              Auto-analysis: {damageAnalysisInterval / 1000}s
            </div>
          )}

          {controls && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
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

                {enableDamageDetection && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={captureFrameAndAnalyze}
                    disabled={isAnalyzing || isLoading || !isPlaying}
                    className="bg-blue-600 text-white border-blue-600"
                    data-testid="button-quick-analyze"
                  >
                    <Eye className={`h-4 w-4 ${isAnalyzing ? 'animate-pulse' : ''}`} />
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Damage Detection Results */}
        {analysisResult && analysisResult.hasDetection && (
          <div className="p-4 space-y-2">
            <h4 className="font-semibold text-red-600 flex items-center">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Damage Detected in Video Stream
            </h4>
            {analysisResult.detections.map((detection, index) => (
              <Alert key={index} className="border-l-4 border-red-500">
                <AlertDescription>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        {getUrgencyIcon(detection.urgencyLevel)}
                        <Badge className={getSeverityColor(detection.severity)}>
                          {detection.severity.toUpperCase()}
                        </Badge>
                        <Badge variant="outline">
                          {detection.confidence}% confident
                        </Badge>
                      </div>
                      <p className="text-sm font-medium">
                        {detection.alertType.replace(/_/g, ' ').toUpperCase()}
                      </p>
                      <p className="text-sm text-gray-600">
                        {detection.description}
                      </p>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            ))}
            <p className="text-xs text-gray-500">
              Analysis completed in {analysisResult.processingTimeMs}ms • 
              Confidence: {analysisResult.confidence}%
            </p>
          </div>
        )}

        {/* No damage detected */}
        {analysisResult && !analysisResult.hasDetection && enableDamageDetection && (
          <div className="p-4">
            <div className="flex items-center text-green-600 text-sm">
              <CheckCircle className="h-4 w-4 mr-2" />
              No damage detected in video stream (Confidence: {analysisResult.confidence}%)
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}