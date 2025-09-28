import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Camera, AlertCircle } from 'lucide-react';

interface TrafficCam {
  id: string;
  name: string;
  location: string;
  url: string;
  type: 'youtube' | 'hls' | 'img';
  isActive: boolean;
}

export default function TrafficCams() {
  const [selectedState, setSelectedState] = useState<'FL' | 'GA' | 'AL'>('FL');

  // Generate camera URLs from environment variables
  const getCamerasForState = (state: 'FL' | 'GA' | 'AL'): TrafficCam[] => {
    const cameras: TrafficCam[] = [];
    
    for (let i = 1; i <= 9; i++) {
      const envKey = `VITE_CAM_${state}_${i}`;
      const url = import.meta.env[envKey] || '';
      
      // Determine type based on URL
      let type: 'youtube' | 'hls' | 'img' = 'img';
      if (url.includes('youtube.com') || url.includes('youtu.be')) {
        type = 'youtube';
      } else if (url.includes('.m3u8')) {
        type = 'hls';
      }

      cameras.push({
        id: `${state.toLowerCase()}-cam-${i}`,
        name: `${state} Camera ${i}`,
        location: getLocationForCamera(state, i),
        url: url || `https://placeholder.example/${state.toLowerCase()}-cam-${i}.jpg`,
        type,
        isActive: !!url
      });
    }
    
    return cameras;
  };

  const getLocationForCamera = (state: string, index: number): string => {
    const locations = {
      FL: [
        'I-95 Miami', 'I-75 Tampa', 'I-4 Orlando', 'US-1 Key Largo',
        'I-95 Jacksonville', 'I-275 St. Petersburg', 'I-10 Tallahassee',
        'US-441 Gainesville', 'I-75 Fort Myers'
      ],
      GA: [
        'I-75 Atlanta', 'I-95 Savannah', 'I-20 Augusta', 'I-85 Columbus',
        'I-16 Macon', 'US-441 Athens', 'I-75 Valdosta',
        'I-95 Brunswick', 'I-85 Gainesville'
      ],
      AL: [
        'I-65 Birmingham', 'I-10 Mobile', 'I-85 Montgomery', 'I-20 Tuscaloosa',
        'US-231 Huntsville', 'I-59 Gadsden', 'US-280 Auburn',
        'I-65 Decatur', 'US-431 Dothan'
      ]
    };
    
    return locations[state as keyof typeof locations][index - 1] || `${state} Location ${index}`;
  };

  const renderCamera = (camera: TrafficCam) => {
    if (!camera.isActive || !camera.url || camera.url.includes('placeholder')) {
      return (
        <div className="aspect-video bg-gray-100 dark:bg-gray-800 rounded flex items-center justify-center">
          <div className="text-center text-gray-500">
            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
            <p className="text-sm">Camera Offline</p>
          </div>
        </div>
      );
    }

    switch (camera.type) {
      case 'youtube':
        // Extract video ID for YouTube embed
        const getYouTubeId = (url: string) => {
          const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
          const match = url.match(regExp);
          return match && match[2].length === 11 ? match[2] : null;
        };
        
        const videoId = getYouTubeId(camera.url);
        if (videoId) {
          return (
            <div className="aspect-video">
              <iframe
                src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=0`}
                className="w-full h-full rounded"
                allowFullScreen
                allow="autoplay; encrypted-media"
              />
            </div>
          );
        }
        break;

      case 'hls':
        return (
          <div className="aspect-video">
            <video
              src={camera.url}
              autoPlay
              muted
              controls
              className="w-full h-full rounded bg-black"
              onError={(e) => {
                console.warn(`HLS stream failed for ${camera.id}:`, e);
              }}
            >
              Your browser does not support HLS video.
            </video>
          </div>
        );

      case 'img':
      default:
        return (
          <div className="aspect-video">
            <img
              src={camera.url}
              alt={camera.name}
              className="w-full h-full object-cover rounded"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/api/placeholder/400/225';
              }}
            />
          </div>
        );
    }

    return (
      <div className="aspect-video bg-gray-100 dark:bg-gray-800 rounded flex items-center justify-center">
        <div className="text-center text-gray-500">
          <Camera className="h-8 w-8 mx-auto mb-2" />
          <p className="text-sm">Unsupported Format</p>
        </div>
      </div>
    );
  };

  const cameras = getCamerasForState(selectedState);

  return (
    <div className="space-y-6">
      {/* State Selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Camera className="h-5 w-5 text-green-500" />
            <span className="font-semibold text-gray-900 dark:text-white">DOT Traffic Cameras</span>
          </div>
          
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            3×3 Grid View
          </Badge>
        </div>

        <div className="flex space-x-2">
          {(['FL', 'GA', 'AL'] as const).map((state) => (
            <Button
              key={state}
              variant={selectedState === state ? 'default' : 'outline'}
              onClick={() => setSelectedState(state)}
              className="gap-2"
            >
              <Camera className="h-4 w-4" />
              {state}
            </Button>
          ))}
        </div>
      </div>

      {/* Camera Grid */}
      <div className="grid grid-cols-3 gap-4">
        {cameras.map((camera) => (
          <Card key={camera.id} className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center justify-between">
                {camera.name}
                <Badge 
                  variant={camera.isActive ? 'default' : 'secondary'}
                  className={camera.isActive ? 'bg-green-500' : ''}
                >
                  {camera.isActive ? 'Live' : 'Offline'}
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs">{camera.location}</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              {renderCamera(camera)}
              
              <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                <span>Type: {camera.type.toUpperCase()}</span>
                {camera.isActive && (
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span>Streaming</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Info */}
      <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <Camera className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900 dark:text-blue-100">Traffic Camera Information</h4>
              <p className="text-sm text-blue-700 dark:text-blue-200 mt-1">
                These cameras provide live views of road conditions and evacuation routes. 
                Cameras are sourced from state DOT systems and update every few seconds. 
                If a camera appears offline, it may be temporarily unavailable or under maintenance.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}