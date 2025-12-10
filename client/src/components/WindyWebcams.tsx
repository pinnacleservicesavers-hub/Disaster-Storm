import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Camera, MapPin, RefreshCw, Play, AlertTriangle, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';

interface WindyWebcam {
  id: string;
  title: string;
  status: string;
  location: {
    latitude: number;
    longitude: number;
    city: string;
    region: string;
    country: string;
  };
  image: {
    current: {
      preview: string;
      icon: string;
      thumbnail: string;
    };
  };
  player: {
    day: {
      embed: string;
    };
  };
}

interface WindyWebcamsProps {
  lat?: number;
  lon?: number;
  radius?: number;
  region?: string;
}

export default function WindyWebcams({ lat = 28.5, lon = -81.5, radius = 50, region }: WindyWebcamsProps) {

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: region ? ['/api/windy/webcams/region', region] : ['/api/windy/webcams/nearby', lat, lon, radius],
    queryFn: async () => {
      const url = region 
        ? `/api/windy/webcams/region/${region}?limit=20`
        : `/api/windy/webcams/nearby?lat=${lat}&lon=${lon}&radius=${radius}`;
      console.log('[WindyWebcams] Fetching from:', url);
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch webcams');
      const result = await response.json();
      console.log('[WindyWebcams] Received:', result);
      return result;
    },
    refetchInterval: 5 * 60 * 1000,
    retry: 2,
  });

  const webcams = data?.webcams || [];
  
  if (isError) {
    console.error('[WindyWebcams] Error:', error);
  }

  return (
    <Card className="w-full bg-slate-900/60 border-cyan-500/30 dark:text-white" data-testid="card-windy-webcams">
      <CardHeader className="bg-slate-800/40 border-b border-cyan-500/20">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-cyan-400">
              <Camera className="w-6 h-6" />
              Live Weather Webcams
              <Badge variant="outline" className="ml-2 bg-cyan-500/20 text-cyan-300 border-cyan-500/30">
                {webcams.length} Available
              </Badge>
            </CardTitle>
            <CardDescription className="text-cyan-300/70">
              Real-time webcam feeds from weather stations across the region
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              console.log('[WindyWebcams] Refresh button clicked');
              refetch();
            }}
            disabled={isFetching}
            data-testid="button-refresh-webcams"
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
            {isFetching ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="bg-slate-900/40 p-6">
        {isError ? (
          <div className="text-center text-red-400 py-8">
            <AlertTriangle className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="font-semibold">Error loading webcams</p>
            <p className="text-xs mt-2 text-red-300">{error?.message || 'Unknown error'}</p>
            <Button
              onClick={() => refetch()}
              size="sm"
              className="mt-3 bg-red-600/20 hover:bg-red-600/40 text-red-300"
            >
              Try Again
            </Button>
          </div>
        ) : isLoading ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <RefreshCw className="w-8 h-8 animate-spin text-cyan-400" />
            <p className="text-cyan-300/70">Loading webcams...</p>
          </div>
        ) : webcams.length === 0 ? (
          <div className="text-center text-cyan-300/50 py-8">
            <Camera className="w-12 h-12 mx-auto mb-2 opacity-30 text-cyan-400" />
            <p>No webcams found in this area</p>
            <p className="text-xs mt-2">Try a different region or zoom level</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {webcams.map((webcam: WindyWebcam) => (
                <motion.div
                  key={webcam.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="group cursor-pointer"
                  data-testid={`webcam-${webcam.id}`}
                >
                  <Card 
                    className="overflow-hidden hover:shadow-lg hover:shadow-cyan-500/20 transition-all cursor-pointer border-slate-700 hover:border-cyan-500/50"
                    onClick={() => {
                      console.log('[WindyWebcams] Opening webcam:', webcam.title, webcam.player.day.embed);
                      window.open(webcam.player.day.embed, '_blank', 'noopener,noreferrer');
                    }}
                  >
                    <div 
                      className="relative aspect-video bg-slate-800 cursor-pointer"
                    >
                      <img
                        src={webcam.image.current.preview}
                        alt={webcam.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = webcam.image.current.icon || webcam.image.current.thumbnail || '';
                          target.onerror = null;
                        }}
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Play className="w-12 h-12 text-white" />
                      </div>
                      <Badge className="absolute top-2 right-2 bg-green-600/90 text-white">
                        <span className="animate-pulse mr-1">●</span> Live
                      </Badge>
                      <div className="absolute bottom-2 right-2 bg-black/60 px-2 py-1 rounded text-xs text-white flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ExternalLink className="w-3 h-3" />
                        Open on Windy.com
                      </div>
                    </div>
                    <CardContent className="p-3">
                      <h3 className="font-semibold text-sm mb-1 truncate" title={webcam.title}>
                        {webcam.title}
                      </h3>
                      <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                        <MapPin className="w-3 h-3 mr-1" />
                        <span className="truncate">
                          {webcam.location.city}, {webcam.location.region}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

          </>
        )}
      </CardContent>
    </Card>
  );
}
