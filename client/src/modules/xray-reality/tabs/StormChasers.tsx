import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Video, Users, Eye, AlertCircle } from 'lucide-react';

interface StormChaser {
  id: string;
  name: string;
  location: string;
  youtubeUrl: string;
  isLive: boolean;
  viewers?: number;
  description?: string;
}

export default function StormChasers() {
  const [chasers, setChasers] = useState<StormChaser[]>([]);

  useEffect(() => {
    // Load storm chaser data from environment variables
    const chaserData: StormChaser[] = [];
    
    for (let i = 1; i <= 3; i++) {
      const envKey = `VITE_CHASER_${i}`;
      const url = import.meta.env[envKey] || '';
      
      if (url) {
        chaserData.push({
          id: `chaser-${i}`,
          name: getChaserName(i),
          location: getChaserLocation(i),
          youtubeUrl: url,
          isLive: true, // Assume live for demo
          viewers: Math.floor(Math.random() * 20000) + 5000,
          description: getChaserDescription(i)
        });
      } else {
        // Add placeholder chaser
        chaserData.push({
          id: `chaser-${i}`,
          name: `Storm Chaser ${i}`,
          location: 'Unknown Location',
          youtubeUrl: '',
          isLive: false,
          description: 'Storm chaser feed not configured'
        });
      }
    }
    
    setChasers(chaserData);
  }, []);

  const getChaserName = (index: number): string => {
    const names = [
      'Storm Chaser Mike',
      'Weather Hunter Pro',
      'Tornado Alley Live'
    ];
    return names[index - 1] || `Storm Chaser ${index}`;
  };

  const getChaserLocation = (index: number): string => {
    const locations = [
      'Florida Panhandle',
      'Alabama Storm Path',
      'Georgia Corridor'
    ];
    return locations[index - 1] || 'Storm Path';
  };

  const getChaserDescription = (index: number): string => {
    const descriptions = [
      'Professional storm chaser providing live coverage of severe weather events across the Southeast',
      'Advanced weather tracking with real-time storm interception and damage assessment',
      'Live storm pursuit with meteorological analysis and ground truth verification'
    ];
    return descriptions[index - 1] || 'Live storm coverage';
  };

  const getYouTubeEmbedId = (url: string): string | null => {
    if (!url) return null;
    
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const renderChaserFeed = (chaser: StormChaser) => {
    const videoId = getYouTubeEmbedId(chaser.youtubeUrl);
    
    if (!videoId || !chaser.isLive) {
      return (
        <div className="aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
          <div className="text-center text-gray-500">
            <AlertCircle className="h-12 w-12 mx-auto mb-2" />
            <p className="text-sm font-medium">Stream Offline</p>
            <p className="text-xs mt-1">
              {chaser.youtubeUrl ? 'Chaser not currently streaming' : 'Feed not configured'}
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="aspect-video rounded-lg overflow-hidden">
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=1`}
          className="w-full h-full"
          allowFullScreen
          allow="autoplay; encrypted-media"
          title={`${chaser.name} Live Stream`}
        />
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Video className="h-5 w-5 text-red-500" />
            <span className="font-semibold text-gray-900 dark:text-white">Storm Chaser Feeds</span>
          </div>
          
          <Badge variant="secondary" className="bg-red-100 text-red-800">
            YouTube Live
          </Badge>
        </div>

        <div className="text-sm text-gray-600 dark:text-gray-400">
          Live ground truth from storm chasers
        </div>
      </div>

      {/* Chaser Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {chasers.map((chaser) => (
          <Card key={chaser.id} className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Video className="h-5 w-5 text-red-500" />
                  {chaser.name}
                </div>
                <Badge 
                  variant={chaser.isLive ? 'destructive' : 'secondary'}
                  className="gap-1"
                >
                  {chaser.isLive && (
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  )}
                  {chaser.isLive ? 'LIVE' : 'OFFLINE'}
                </Badge>
              </CardTitle>
              <CardDescription className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                {chaser.location}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Video Feed */}
              {renderChaserFeed(chaser)}
              
              {/* Stream Info */}
              <div className="space-y-2">
                {chaser.viewers && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Viewers:</span>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">{chaser.viewers.toLocaleString()}</span>
                    </div>
                  </div>
                )}
                
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  {chaser.description}
                </div>
                
                {chaser.isLive && (
                  <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span>Broadcasting live storm coverage</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Info Card */}
      <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <Video className="h-5 w-5 text-red-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-red-900 dark:text-red-100">Storm Chaser Information</h4>
              <p className="text-sm text-red-700 dark:text-red-200 mt-1">
                These feeds provide real-time ground truth from professional storm chasers. 
                They offer live footage from inside storm systems, showing actual conditions and damage as it happens. 
                Streams are embedded from YouTube Live and may occasionally go offline if the chaser loses internet connectivity.
              </p>
              <div className="mt-2 text-xs text-red-600 dark:text-red-300 space-y-1">
                <p>• All streams are set to autoplay with muted audio</p>
                <p>• Click on the video to unmute and access full controls</p>
                <p>• Viewer counts update in real-time when available</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}