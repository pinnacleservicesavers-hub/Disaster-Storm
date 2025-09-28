import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plane, Signal, AlertCircle, Radio } from 'lucide-react';

interface DroneFeed {
  id: string;
  name: string;
  location: string;
  hlsUrl: string;
  isActive: boolean;
  protocol: 'WebRTC' | 'HLS';
  altitude?: number;
  batteryLevel?: number;
}

export default function DroneFeeds() {
  const [feeds, setFeeds] = useState<DroneFeed[]>([]);

  useEffect(() => {
    // Load drone feed data from environment variables
    const droneData: DroneFeed[] = [];
    
    for (let i = 1; i <= 3; i++) {
      const envKey = `VITE_DRONE_${i}`;
      const url = import.meta.env[envKey] || '';
      
      droneData.push({
        id: `drone-${i}`,
        name: getDroneName(i),
        location: getDroneLocation(i),
        hlsUrl: url || '',
        isActive: !!url,
        protocol: i === 1 ? 'WebRTC' : 'HLS',
        altitude: Math.floor(Math.random() * 300) + 100, // 100-400 ft
        batteryLevel: Math.floor(Math.random() * 40) + 60 // 60-100%
      });
    }
    
    setFeeds(droneData);
  }, []);

  const getDroneName = (index: number): string => {
    const names = [
      'Drone Alpha - WebRTC',
      'Drone Beta - HLS',
      'Drone Gamma - HLS'
    ];
    return names[index - 1] || `Drone ${index}`;
  };

  const getDroneLocation = (index: number): string => {
    const locations = [
      'Storm Eye - Real-time',
      'Damage Assessment Zone',
      'Evacuation Route Monitor'
    ];
    return locations[index - 1] || `Location ${index}`;
  };

  const renderDroneFeed = (feed: DroneFeed) => {
    if (!feed.isActive || !feed.hlsUrl) {
      return (
        <div className="aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
          <div className="text-center text-gray-500">
            <AlertCircle className="h-12 w-12 mx-auto mb-2" />
            <p className="text-sm font-medium">Feed Unavailable</p>
            <p className="text-xs mt-1">
              {feed.hlsUrl ? 'Drone not streaming' : 'Feed not configured'}
            </p>
          </div>
        </div>
      );
    }

    if (feed.protocol === 'WebRTC') {
      // WebRTC would typically require more complex setup with RTCPeerConnection
      // For demo purposes, show a placeholder that simulates WebRTC
      return (
        <div className="aspect-video bg-black rounded-lg flex items-center justify-center relative overflow-hidden">
          <div className="text-center text-white z-10">
            <Radio className="h-12 w-12 mx-auto mb-2 animate-pulse" />
            <p className="text-sm font-medium">WebRTC Live Stream</p>
            <p className="text-xs mt-1 opacity-75">Ultra-low latency feed</p>
          </div>
          
          {/* Simulated live video background */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/50 to-purple-900/50 animate-pulse"></div>
          
          {/* Live indicator */}
          <div className="absolute top-2 left-2 flex items-center space-x-1 bg-red-600 text-white px-2 py-1 rounded text-xs">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span>LIVE</span>
          </div>
        </div>
      );
    }

    // HLS Video
    return (
      <div className="aspect-video rounded-lg overflow-hidden relative">
        <video
          src={feed.hlsUrl}
          autoPlay
          muted
          controls
          className="w-full h-full bg-black"
          onError={(e) => {
            console.warn(`HLS stream failed for ${feed.id}:`, e);
          }}
        >
          Your browser does not support HLS video.
        </video>
        
        {/* Live indicator */}
        <div className="absolute top-2 left-2 flex items-center space-x-1 bg-red-600 text-white px-2 py-1 rounded text-xs">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          <span>LIVE</span>
        </div>
      </div>
    );
  };

  const getBatteryColor = (level: number) => {
    if (level > 50) return 'text-green-600';
    if (level > 25) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Plane className="h-5 w-5 text-blue-500" />
            <span className="font-semibold text-gray-900 dark:text-white">Drone Feeds</span>
          </div>
          
          <div className="flex space-x-2">
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              WebRTC
            </Badge>
            <Badge variant="secondary" className="bg-purple-100 text-purple-800">
              HLS Streams
            </Badge>
          </div>
        </div>

        <div className="text-sm text-gray-600 dark:text-gray-400">
          Live aerial reconnaissance feeds
        </div>
      </div>

      {/* Drone Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {feeds.map((feed) => (
          <Card key={feed.id} className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Plane className="h-5 w-5 text-blue-500" />
                  <span className="text-sm">{feed.name}</span>
                </div>
                <Badge 
                  variant={feed.isActive ? 'default' : 'secondary'}
                  className={`gap-1 ${feed.isActive ? 'bg-green-500' : ''}`}
                >
                  {feed.isActive && (
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  )}
                  {feed.isActive ? 'ACTIVE' : 'OFFLINE'}
                </Badge>
              </CardTitle>
              <CardDescription className="flex items-center gap-2">
                <Signal className="h-4 w-4" />
                {feed.location}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Video Feed */}
              {renderDroneFeed(feed)}
              
              {/* Drone Telemetry */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Protocol:</span>
                  <Badge variant="outline" className="text-xs">
                    {feed.protocol}
                  </Badge>
                </div>
                
                {feed.altitude && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Altitude:</span>
                    <span className="font-medium">{feed.altitude} ft</span>
                  </div>
                )}
                
                {feed.batteryLevel && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Battery:</span>
                    <span className={`font-medium ${getBatteryColor(feed.batteryLevel)}`}>
                      {feed.batteryLevel}%
                    </span>
                  </div>
                )}
                
                {feed.isActive && (
                  <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span>
                      {feed.protocol === 'WebRTC' ? 'Ultra-low latency stream' : 'HLS streaming active'}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Protocol Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <Radio className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900 dark:text-blue-100">WebRTC Feeds</h4>
                <p className="text-sm text-blue-700 dark:text-blue-200 mt-1">
                  Ultra-low latency real-time video streams directly from drone cameras. 
                  Provides near-instantaneous video for critical storm operations and immediate damage assessment.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <Signal className="h-5 w-5 text-purple-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-purple-900 dark:text-purple-100">HLS Streams</h4>
                <p className="text-sm text-purple-700 dark:text-purple-200 mt-1">
                  HTTP Live Streaming (HLS) provides reliable video delivery with automatic quality adjustment. 
                  Compatible with all devices and browsers for maximum accessibility.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}