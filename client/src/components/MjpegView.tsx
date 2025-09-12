// MJPEG Stream Viewer Component
import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Pause, Play } from 'lucide-react';

interface MjpegViewProps {
  src: string;
  title?: string;
  refreshInterval?: number; // milliseconds
  autoRefresh?: boolean;
  className?: string;
  onError?: (error: string) => void;
  onLoad?: () => void;
}

export function MjpegView({
  src,
  title,
  refreshInterval = 5000, // 5 seconds default
  autoRefresh = true,
  className = '',
  onError,
  onLoad
}: MjpegViewProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const imgRef = useRef<HTMLImageElement>(null);
  const intervalRef = useRef<NodeJS.Timeout>();

  const refreshStream = () => {
    if (!imgRef.current || isPaused) return;

    setIsLoading(true);
    setError(null);
    
    // Add timestamp to force refresh and avoid caching
    const timestamp = Date.now();
    const separator = src.includes('?') ? '&' : '?';
    imgRef.current.src = `${src}${separator}t=${timestamp}`;
    setLastRefresh(new Date());
  };

  const handleImageLoad = () => {
    setIsLoading(false);
    setError(null);
    onLoad?.();
  };

  const handleImageError = () => {
    setIsLoading(false);
    const errorMsg = 'Failed to load MJPEG stream';
    setError(errorMsg);
    onError?.(errorMsg);
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  useEffect(() => {
    // Initial load
    refreshStream();
  }, [src]);

  useEffect(() => {
    if (autoRefresh && !isPaused && refreshInterval > 0) {
      intervalRef.current = setInterval(refreshStream, refreshInterval);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoRefresh, isPaused, refreshInterval, src]);

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
              onClick={refreshStream}
              data-testid="button-retry-mjpeg"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
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
            <CardTitle data-testid="text-mjpeg-title">{title}</CardTitle>
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={togglePause}
                data-testid="button-pause-mjpeg"
              >
                {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                {isPaused ? 'Resume' : 'Pause'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={refreshStream}
                disabled={isLoading || isPaused}
                data-testid="button-refresh-mjpeg"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
      )}
      <CardContent className="p-0">
        <div className="relative bg-gray-900">
          <img
            ref={imgRef}
            className="w-full h-auto"
            onLoad={handleImageLoad}
            onError={handleImageError}
            data-testid="img-mjpeg-stream"
            alt={title || 'MJPEG Stream'}
          />
          
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
              <div className="text-white text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                <p>Loading stream...</p>
              </div>
            </div>
          )}

          {isPaused && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70">
              <div className="text-white text-center">
                <Pause className="h-12 w-12 mx-auto mb-2" />
                <p>Stream Paused</p>
              </div>
            </div>
          )}

          {/* Stream info overlay */}
          <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs">
            {autoRefresh && !isPaused && (
              <span>Auto-refresh: {refreshInterval / 1000}s</span>
            )}
            {isPaused && <span>Paused</span>}
          </div>

          {/* Last refresh time */}
          <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs">
            Last: {lastRefresh.toLocaleTimeString()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}