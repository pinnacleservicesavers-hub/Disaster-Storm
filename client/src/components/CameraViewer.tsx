// Camera Viewer Modal Component that integrates HlsPlayer, MjpegView, and SnapshotCam
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  X, 
  Camera, 
  MapPin, 
  Clock, 
  Settings, 
  Eye,
  AlertTriangle,
  ExternalLink,
  Cloud,
  Zap,
  Waves
} from 'lucide-react';
import { HlsPlayer } from './HlsPlayer';
import { MjpegView } from './MjpegView';
import { SnapshotCam } from './SnapshotCam';

interface TrafficCamera {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: string;
  snapshotUrl?: string;
  streamUrl?: string;
  isActive: boolean;
  jurisdiction: {
    state: string;
    county?: string;
    provider: string;
    jurisdiction: string;
  };
  lastUpdated: string;
  metadata?: Record<string, any>;
}

interface CameraViewerProps {
  cameraId: string | null;
  onClose: () => void;
  enableDamageDetection?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function CameraViewer({ 
  cameraId, 
  onClose, 
  enableDamageDetection = true,
  autoRefresh = true,
  refreshInterval = 30000 
}: CameraViewerProps) {
  const [activeTab, setActiveTab] = useState('live');
  const [damageAlerts, setDamageAlerts] = useState<any[]>([]);

  // Fetch camera details
  const { data: camera, isLoading, error } = useQuery<TrafficCamera>({
    queryKey: ['/api/traffic-cameras', cameraId],
    enabled: !!cameraId,
    refetchInterval: autoRefresh ? 60000 : false, // Refresh camera details every minute
  });

  // Fetch weather context for camera location
  const { data: weatherContext } = useQuery({
    queryKey: ['/api/weather/camera-overlay', cameraId, { weatherTypes: 'alerts,radar,lightning,satellite' }],
    enabled: !!cameraId && !!camera,
    refetchInterval: 300000, // Refetch every 5 minutes
  });

  const handleDamageDetected = (detections: any[]) => {
    console.log(`🚨 Damage detected on camera ${camera?.name}:`, detections);
    setDamageAlerts(prev => [...detections, ...prev.slice(0, 9)]); // Keep last 10 alerts
  };

  const handleError = (error: string) => {
    console.error(`Camera error for ${camera?.name}:`, error);
  };

  const getStreamType = (): 'hls' | 'mjpeg' | 'snapshot' => {
    if (!camera) return 'snapshot';
    
    // Determine stream type based on URL patterns
    if (camera.streamUrl) {
      if (camera.streamUrl.includes('.m3u8') || camera.streamUrl.includes('hls')) {
        return 'hls';
      }
      if (camera.streamUrl.includes('mjpeg') || camera.streamUrl.includes('video/mjpeg')) {
        return 'mjpeg';
      }
    }
    
    // Default to snapshot if no stream URL or unclear type
    return 'snapshot';
  };

  const renderCameraStream = () => {
    if (!camera) return null;

    const streamType = getStreamType();
    const location = `${camera.jurisdiction.jurisdiction}, ${camera.jurisdiction.state}`;

    switch (streamType) {
      case 'hls':
        return (
          <HlsPlayer
            src={camera.streamUrl!}
            cameraId={camera.id}
            title={camera.name}
            location={location}
            autoPlay={false}
            muted={true}
            controls={true}
            enableDamageDetection={enableDamageDetection}
            damageAnalysisInterval={refreshInterval}
            onError={handleError}
            onDamageDetected={handleDamageDetected}
            className="w-full"
          />
        );
      
      case 'mjpeg':
        return (
          <MjpegView
            src={camera.streamUrl!}
            cameraId={camera.id}
            title={camera.name}
            location={location}
            refreshInterval={refreshInterval}
            autoRefresh={autoRefresh}
            enableDamageDetection={enableDamageDetection}
            onError={handleError}
            onDamageDetected={handleDamageDetected}
            className="w-full"
          />
        );
      
      case 'snapshot':
      default:
        return (
          <SnapshotCam
            cameraId={camera.id}
            src={camera.snapshotUrl || `/api/traffic-cameras/${camera.id}/image`}
            title={camera.name}
            location={location}
            autoRefresh={autoRefresh}
            refreshInterval={refreshInterval}
            enableDamageDetection={enableDamageDetection}
            onError={handleError}
            onDamageDetected={handleDamageDetected}
            className="w-full"
          />
        );
    }
  };

  if (!cameraId) return null;

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <Card className="w-full max-w-md mx-4">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-red-600">Camera Error</CardTitle>
              <Button variant="ghost" size="sm" onClick={onClose} data-testid="button-close-viewer">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-red-500 mb-4">Failed to load camera details</p>
            <Button onClick={onClose} className="w-full">Close</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <Card className="w-full max-w-4xl mx-4">
          <CardContent className="p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p>Loading camera details...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-6xl max-h-[90vh] flex flex-col">
        <CardHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Camera className="h-6 w-6 text-blue-600" />
              <div>
                <CardTitle className="text-xl" data-testid="text-camera-viewer-title">
                  {camera?.name}
                </CardTitle>
                <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                  <span className="flex items-center">
                    <MapPin className="h-3 w-3 mr-1" />
                    {camera?.jurisdiction.jurisdiction}, {camera?.jurisdiction.state}
                  </span>
                  <span className="flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    {new Date(camera?.lastUpdated || '').toLocaleString()}
                  </span>
                  <Badge variant={camera?.isActive ? 'default' : 'secondary'}>
                    {camera?.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {camera?.streamUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(camera.streamUrl, '_blank')}
                  data-testid="button-external-stream"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  External
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={onClose} data-testid="button-close-viewer">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-3 flex-shrink-0">
              <TabsTrigger value="live" data-testid="tab-live-feed">Live Feed</TabsTrigger>
              <TabsTrigger value="alerts" data-testid="tab-damage-alerts">
                Damage Alerts 
                {damageAlerts.length > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {damageAlerts.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="info" data-testid="tab-camera-info">Camera Info</TabsTrigger>
            </TabsList>

            <TabsContent value="live" className="flex-1 mt-4">
              <div className="h-full flex items-center justify-center">
                {renderCameraStream()}
              </div>
            </TabsContent>

            <TabsContent value="alerts" className="flex-1 mt-4 overflow-y-auto">
              <div className="space-y-4">
                {damageAlerts.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Eye className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-semibold mb-2">No Damage Detected</h3>
                    <p>AI monitoring is active. Alerts will appear here when damage is detected.</p>
                  </div>
                ) : (
                  damageAlerts.map((alert, index) => (
                    <Card key={index} className="border-l-4 border-l-red-500">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <AlertTriangle className="h-4 w-4 text-red-600" />
                              <Badge variant="destructive">
                                {alert.severity?.toUpperCase()}
                              </Badge>
                              <Badge variant="outline">
                                {alert.confidence}% confident
                              </Badge>
                            </div>
                            <h4 className="font-semibold text-red-600 mb-1">
                              {alert.alertType?.replace(/_/g, ' ').toUpperCase()}
                            </h4>
                            <p className="text-sm text-gray-600 mb-2">
                              {alert.description}
                            </p>
                            <p className="text-xs text-gray-500">
                              {alert.urgencyLevel} urgency • Detected at {new Date().toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="info" className="flex-1 mt-4 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Location Details</h4>
                    <div className="space-y-2 text-sm">
                      <div><strong>Provider:</strong> {camera?.jurisdiction.provider}</div>
                      <div><strong>Jurisdiction:</strong> {camera?.jurisdiction.jurisdiction}</div>
                      <div><strong>State:</strong> {camera?.jurisdiction.state}</div>
                      {camera?.jurisdiction.county && (
                        <div><strong>County:</strong> {camera?.jurisdiction.county}</div>
                      )}
                      <div><strong>Coordinates:</strong> {camera?.lat.toFixed(4)}, {camera?.lng.toFixed(4)}</div>
                    </div>
                  </div>
                  
                  {/* Weather Context */}
                  {weatherContext && (
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center">
                        <Cloud className="w-4 h-4 mr-2" />
                        Weather Context
                      </h4>
                      <div className="space-y-2">
                        {/* Weather Alerts */}
                        {weatherContext.alerts && weatherContext.alerts.length > 0 && (
                          <div className="bg-orange-50 border border-orange-200 rounded p-3">
                            <div className="flex items-center space-x-2 mb-2">
                              <AlertTriangle className="w-4 h-4 text-orange-500" />
                              <Badge variant={weatherContext.alerts[0].severity === 'Extreme' ? 'destructive' : 'secondary'}>
                                {weatherContext.alerts[0].alertType}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600">{weatherContext.alerts[0].description?.slice(0, 150)}...</p>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-3 text-sm">
                          {/* Radar Intensity */}
                          {weatherContext.radar && (
                            <div className="bg-gray-50 rounded p-2">
                              <div className="flex items-center justify-between">
                                <span className="text-gray-600">Radar:</span>
                                <span className="font-medium">
                                  {weatherContext.radar.layers?.[0]?.data?.length > 50 ? 'High' :
                                   weatherContext.radar.layers?.[0]?.data?.length > 20 ? 'Moderate' :
                                   weatherContext.radar.layers?.[0]?.data?.length > 0 ? 'Light' : 'None'}
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Lightning Activity */}
                          {weatherContext.lightning && (
                            <div className="bg-gray-50 rounded p-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                  <Zap className="w-3 h-3 text-yellow-500 mr-1" />
                                  <span className="text-gray-600">Lightning:</span>
                                </div>
                                <span className="font-medium">
                                  {(weatherContext.lightning.density || 0) > 10 ? 'High' :
                                   (weatherContext.lightning.density || 0) > 5 ? 'Moderate' :
                                   (weatherContext.lightning.density || 0) > 0 ? 'Light' : 'None'}
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Marine Conditions */}
                          {weatherContext.marine && (
                            <div className="bg-gray-50 rounded p-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                  <Waves className="w-3 h-3 text-blue-500 mr-1" />
                                  <span className="text-gray-600">Waves:</span>
                                </div>
                                <span className="font-medium">
                                  {(weatherContext.marine.waves?.significantHeight || 0).toFixed(1)}m
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Satellite Info */}
                          {weatherContext.satellite && (
                            <div className="bg-gray-50 rounded p-2">
                              <div className="flex items-center justify-between">
                                <span className="text-gray-600">Satellite:</span>
                                <span className="font-medium text-green-600">Active</span>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="text-xs text-gray-500 flex items-center mt-2">
                          <Clock className="w-3 h-3 mr-1" />
                          Updated: {new Date(weatherContext.timestamp || Date.now()).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <h4 className="font-semibold mb-2">Technical Details</h4>
                    <div className="space-y-2 text-sm">
                      <div><strong>Camera ID:</strong> {camera?.id}</div>
                      <div><strong>Type:</strong> {camera?.type}</div>
                      <div><strong>Stream Type:</strong> {getStreamType().toUpperCase()}</div>
                      <div><strong>Status:</strong> 
                        <Badge variant={camera?.isActive ? 'default' : 'secondary'} className="ml-2">
                          {camera?.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <div><strong>Last Updated:</strong> {new Date(camera?.lastUpdated || '').toLocaleString()}</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Stream URLs</h4>
                    <div className="space-y-2 text-sm">
                      {camera?.streamUrl && (
                        <div>
                          <strong>Stream URL:</strong>
                          <div className="mt-1 p-2 bg-gray-100 rounded text-xs font-mono break-all">
                            {camera.streamUrl}
                          </div>
                        </div>
                      )}
                      {camera?.snapshotUrl && (
                        <div>
                          <strong>Snapshot URL:</strong>
                          <div className="mt-1 p-2 bg-gray-100 rounded text-xs font-mono break-all">
                            {camera.snapshotUrl}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Monitoring Settings</h4>
                    <div className="space-y-2 text-sm">
                      <div><strong>Auto Refresh:</strong> {autoRefresh ? 'Enabled' : 'Disabled'}</div>
                      <div><strong>Refresh Interval:</strong> {refreshInterval / 1000}s</div>
                      <div><strong>Damage Detection:</strong> {enableDamageDetection ? 'Enabled' : 'Disabled'}</div>
                    </div>
                  </div>

                  {camera?.metadata && Object.keys(camera.metadata).length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Additional Metadata</h4>
                      <div className="text-xs font-mono bg-gray-100 p-3 rounded max-h-32 overflow-y-auto">
                        <pre>{JSON.stringify(camera.metadata, null, 2)}</pre>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}