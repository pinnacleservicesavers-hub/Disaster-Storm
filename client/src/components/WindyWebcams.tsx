import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Camera, MapPin, ExternalLink, RefreshCw, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [selectedWebcam, setSelectedWebcam] = useState<WindyWebcam | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: region ? ['/api/windy/webcams/region', region] : ['/api/windy/webcams/nearby', lat, lon, radius],
    queryFn: async () => {
      const url = region 
        ? `/api/windy/webcams/region/${region}?limit=20`
        : `/api/windy/webcams/nearby?lat=${lat}&lon=${lon}&radius=${radius}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch webcams');
      return response.json();
    },
    refetchInterval: 5 * 60 * 1000,
  });

  const webcams = data?.webcams || [];

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
            onClick={() => refetch()}
            data-testid="button-refresh-webcams"
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="bg-slate-900/40 p-6">
        {isLoading ? (
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
                  onClick={() => setSelectedWebcam(webcam)}
                  data-testid={`webcam-${webcam.id}`}
                >
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="relative aspect-video bg-gray-100 dark:bg-gray-800">
                      <img
                        src={webcam.image.current.preview}
                        alt={webcam.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Play className="w-12 h-12 text-white" />
                      </div>
                      <Badge className="absolute top-2 right-2 bg-green-600">
                        Live
                      </Badge>
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

            <AnimatePresence>
              {selectedWebcam && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
                  onClick={() => setSelectedWebcam(null)}
                >
                  <motion.div
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0.9 }}
                    className="bg-white dark:bg-gray-900 rounded-lg max-w-4xl w-full overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                      <div>
                        <h2 className="font-bold text-lg">{selectedWebcam.title}</h2>
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mt-1">
                          <MapPin className="w-4 h-4 mr-1" />
                          {selectedWebcam.location.city}, {selectedWebcam.location.region}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedWebcam(null)}
                      >
                        Close
                      </Button>
                    </div>
                    <div className="aspect-video bg-black">
                      <iframe
                        src={selectedWebcam.player.day.embed}
                        className="w-full h-full"
                        frameBorder="0"
                        allow="autoplay; fullscreen"
                        title={selectedWebcam.title}
                      />
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 flex justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(selectedWebcam.player.day.embed, '_blank')}
                        className="flex items-center gap-2"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Open in New Tab
                      </Button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </CardContent>
    </Card>
  );
}
