import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  RotateCcw, 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Calendar,
  Clock,
  Download,
  Save
} from 'lucide-react';

export default function Replays() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(75); // 75% through timeline
  const [selectedTimeRange, setSelectedTimeRange] = useState<'6h' | '12h' | '24h'>('24h');

  const timeRanges = [
    { value: '6h' as const, label: '6 Hours', description: 'Last 6 hours of data' },
    { value: '12h' as const, label: '12 Hours', description: 'Last 12 hours of data' },
    { value: '24h' as const, label: '24 Hours', description: 'Last 24 hours of data' }
  ];

  const handlePlay = () => {
    setIsPlaying(!isPlaying);
    
    if (!isPlaying) {
      // Simulate playback
      const interval = setInterval(() => {
        setCurrentTime(prev => {
          if (prev >= 100) {
            setIsPlaying(false);
            clearInterval(interval);
            return 100;
          }
          return prev + 1;
        });
      }, 100);
    }
  };

  const handleSeek = (value: number) => {
    setCurrentTime(value);
  };

  const getCurrentTimeLabel = () => {
    const totalHours = parseInt(selectedTimeRange);
    const currentHours = (currentTime / 100) * totalHours;
    const hoursAgo = totalHours - currentHours;
    
    if (hoursAgo < 1) {
      return `${Math.round(hoursAgo * 60)} minutes ago`;
    }
    return `${hoursAgo.toFixed(1)} hours ago`;
  };

  const exportTimeScrub = () => {
    const exportData = {
      timeRange: selectedTimeRange,
      currentPosition: `${currentTime}%`,
      timestamp: getCurrentTimeLabel(),
      layers: ['Radar', 'GOES-16', 'GOES-17'],
      format: 'MP4 Video Export'
    };
    
    console.log('Exporting time scrub:', exportData);
    alert(`Time scrub export initiated!\n\nRange: ${selectedTimeRange}\nPosition: ${getCurrentTimeLabel()}\nFormat: MP4 Video`);
  };

  const captureFrame = () => {
    const frameData = {
      timestamp: new Date().toISOString(),
      position: getCurrentTimeLabel(),
      layers: ['Radar', 'GOES Satellite'],
      coordinates: 'Current view bounds'
    };
    
    console.log('Capturing frame:', frameData);
    alert(`Frame captured!\n\nTime: ${getCurrentTimeLabel()}\nLayers: Radar + GOES\nFormat: High-res PNG`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <RotateCcw className="h-5 w-5 text-blue-500" />
            <span className="font-semibold text-gray-900 dark:text-white">Storm History Replays</span>
          </div>
          
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            Time Scrub Available
          </Badge>
        </div>

        <div className="flex space-x-2">
          <Button
            onClick={captureFrame}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            Capture Frame
          </Button>
          
          <Button
            onClick={exportTimeScrub}
            variant="default"
            size="sm"
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Export Video
          </Button>
        </div>
      </div>

      {/* Time Range Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-500" />
            Select Time Range
          </CardTitle>
          <CardDescription>Choose how far back to scrub through storm data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {timeRanges.map((range) => (
              <button
                key={range.value}
                onClick={() => setSelectedTimeRange(range.value)}
                className={`
                  p-4 rounded-lg border-2 transition-all text-left
                  ${selectedTimeRange === range.value
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                  }
                `}
              >
                <div className="font-medium text-gray-900 dark:text-white">
                  {range.label}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {range.description}
                </div>
                {selectedTimeRange === range.value && (
                  <div className="mt-2">
                    <Badge variant="default" className="text-xs">Selected</Badge>
                  </div>
                )}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Replay Viewer */}
      <Card className="bg-black border-gray-800">
        <CardContent className="p-0">
          <div className="w-full h-96 bg-gradient-to-br from-gray-900 to-black rounded-lg flex items-center justify-center relative overflow-hidden">
            {/* Simulated storm data visualization */}
            <div className="absolute inset-0 opacity-30">
              <div className="w-full h-full bg-gradient-to-r from-blue-500/20 via-green-500/20 to-red-500/20 animate-pulse"></div>
            </div>
            
            <div className="text-center text-white z-10">
              <RotateCcw className="h-16 w-16 mx-auto mb-4 text-blue-400" />
              <h3 className="text-xl font-semibold mb-2">Storm Radar & GOES Replay</h3>
              <p className="text-sm text-gray-300 mb-4">
                Scrub through the last {selectedTimeRange} of storm movement
              </p>
              <div className="text-xs text-blue-300">
                Currently viewing: {getCurrentTimeLabel()}
              </div>
            </div>
            
            {/* Time indicator overlay */}
            <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm rounded-lg p-3 text-white text-xs">
              <div className="flex items-center space-x-2 mb-2">
                <Clock className="h-3 w-3" />
                <span>Timeline Position</span>
              </div>
              <div className="space-y-1">
                <div>Range: {selectedTimeRange}</div>
                <div>Position: {getCurrentTimeLabel()}</div>
                <div className="text-blue-300">
                  {isPlaying ? 'Playing...' : 'Paused'}
                </div>
              </div>
            </div>

            {/* Layer info overlay */}
            <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm rounded-lg p-3 text-white text-xs">
              <div className="space-y-1">
                <div className="text-blue-300">📡 NEXRAD Radar</div>
                <div className="text-purple-300">🛰️ GOES-16 Satellite</div>
                <div className="text-green-300">🛰️ GOES-17 Satellite</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Playback Controls */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Timeline */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>{selectedTimeRange} ago</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {getCurrentTimeLabel()}
                </span>
                <span>Now</span>
              </div>
              
              <Progress 
                value={currentTime} 
                className="w-full h-2 cursor-pointer"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = e.clientX - rect.left;
                  const percentage = (x / rect.width) * 100;
                  handleSeek(Math.max(0, Math.min(100, percentage)));
                }}
              />
            </div>

            {/* Control Buttons */}
            <div className="flex items-center justify-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSeek(Math.max(0, currentTime - 10))}
              >
                <SkipBack className="h-4 w-4" />
              </Button>
              
              <Button
                onClick={handlePlay}
                size="lg"
                className="gap-2"
              >
                {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                {isPlaying ? 'Pause' : 'Play'}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSeek(Math.min(100, currentTime + 10))}
              >
                <SkipForward className="h-4 w-4" />
              </Button>
            </div>

            {/* Speed and Options */}
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-4">
                <span className="text-gray-600 dark:text-gray-400">Playback Speed:</span>
                <div className="flex space-x-1">
                  {['0.5x', '1x', '2x', '4x'].map((speed) => (
                    <button
                      key={speed}
                      className={`
                        px-2 py-1 rounded text-xs
                        ${speed === '1x' 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                        }
                      `}
                    >
                      {speed}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="text-gray-600 dark:text-gray-400">
                Resolution: {selectedTimeRange === '6h' ? '1min' : selectedTimeRange === '12h' ? '2min' : '5min'} intervals
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Evidence Capture Info */}
      <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <RotateCcw className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900 dark:text-blue-100">Evidence Capture & Planning</h4>
              <p className="text-sm text-blue-700 dark:text-blue-200 mt-1">
                Use time scrub replays to show exactly how storm cells moved across properties. 
                This provides crucial evidence for insurance claims and helps plan future operations 
                by understanding storm patterns and damage timing.
              </p>
              <div className="mt-2 text-xs text-blue-600 dark:text-blue-300 space-y-1">
                <p>• Capture specific frames showing storm impact on properties</p>
                <p>• Export video loops for insurance documentation</p>
                <p>• Analyze storm cell movement patterns for strategic positioning</p>
                <p>• Historical data available up to 7 days (contact support for longer archives)</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}