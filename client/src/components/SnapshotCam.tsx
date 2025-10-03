// Static Camera Snapshot Component with AI Damage Detection
import { useState, useEffect, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, Camera, AlertTriangle, CheckCircle, Eye, Phone } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface SnapshotCamProps {
  cameraId: string;
  src: string;
  title?: string;
  location?: string;
  autoRefresh?: boolean;
  refreshInterval?: number; // milliseconds
  enableDamageDetection?: boolean;
  className?: string;
  onError?: (error: string) => void;
  onLoad?: () => void;
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

export function SnapshotCam({
  cameraId,
  src,
  title,
  location,
  autoRefresh = true,
  refreshInterval = 30000, // 30 seconds default
  enableDamageDetection = false,
  className = '',
  onError,
  onLoad,
  onDamageDetected
}: SnapshotCamProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [analysisResult, setAnalysisResult] = useState<DamageAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const intervalRef = useRef<NodeJS.Timeout>();
  const { toast } = useToast();

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
        console.log(`🚨 Damage detected at ${title}: ${result.detections.length} alerts`);
        onDamageDetected?.(result.detections);
      }
    },
    onError: (error) => {
      console.error('Damage analysis failed:', error);
      setIsAnalyzing(false);
    }
  });

  // Contact homeowner mutation
  const contactHomeownerMutation = useMutation({
    mutationFn: async (detection: DamageDetection) => {
      return apiRequest('/api/damage-detection/contact-homeowner', {
        method: 'POST',
        body: JSON.stringify({
          address: location || title,
          damageDescription: detection.description,
          estimatedCost: '$5,000-$15,000',
          contractorId: 'current-user'
        })
      });
    },
    onSuccess: (result) => {
      toast({
        title: 'Homeowner Contact Initiated',
        description: result.message || 'The property owner will be notified about the detected damage. They will receive your contact information.',
        variant: 'default'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Contact Failed',
        description: error.message || 'Unable to contact homeowner. Property owner information may not be available.',
        variant: 'destructive'
      });
    }
  });

  const refreshSnapshot = async () => {
    if (!imgRef.current) return;

    setIsLoading(true);
    setError(null);
    
    // Add timestamp to force refresh and avoid caching
    const timestamp = Date.now();
    const separator = src.includes('?') ? '&' : '?';
    const newSrc = `${src}${separator}t=${timestamp}`;
    
    imgRef.current.src = newSrc;
    setLastRefresh(new Date());

    // Trigger damage analysis if enabled
    if (enableDamageDetection && !isAnalyzing) {
      setTimeout(() => {
        analyzeDamage();
      }, 1000); // Wait for image to load
    }
  };

  const analyzeDamage = async () => {
    if (!imgRef.current || isAnalyzing) return;

    setIsAnalyzing(true);
    
    try {
      // Convert image to base64 for analysis
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      canvas.width = imgRef.current.naturalWidth;
      canvas.height = imgRef.current.naturalHeight;
      
      ctx?.drawImage(imgRef.current, 0, 0);
      const imageData = canvas.toDataURL('image/jpeg', 0.8);
      
      damageAnalysisMutation.mutate(imageData);
    } catch (error) {
      console.error('Error preparing image for analysis:', error);
      setIsAnalyzing(false);
    }
  };

  const handleImageLoad = () => {
    setIsLoading(false);
    setError(null);
    onLoad?.();
  };

  const handleImageError = () => {
    setIsLoading(false);
    const errorMsg = 'Failed to load camera snapshot';
    setError(errorMsg);
    onError?.(errorMsg);
  };

  useEffect(() => {
    // Initial load
    refreshSnapshot();
  }, [src]);

  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      intervalRef.current = setInterval(refreshSnapshot, refreshInterval);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoRefresh, refreshInterval, src]);

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
          <CardTitle className="text-red-600">Camera Error</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center p-8">
            <p className="text-red-500 mb-4">{error}</p>
            <Button 
              onClick={refreshSnapshot}
              data-testid="button-retry-snapshot"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center" data-testid="text-camera-title">
              <Camera className="h-5 w-5 mr-2" />
              {title}
            </CardTitle>
            {location && (
              <p className="text-sm text-gray-600 mt-1" data-testid="text-camera-location">
                {location}
              </p>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {enableDamageDetection && (
              <Button
                size="sm"
                variant="outline"
                onClick={analyzeDamage}
                disabled={isAnalyzing || isLoading}
                data-testid="button-analyze-damage"
              >
                <Eye className={`h-4 w-4 ${isAnalyzing ? 'animate-pulse' : ''}`} />
                {isAnalyzing ? 'Analyzing...' : 'Analyze'}
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={refreshSnapshot}
              disabled={isLoading}
              data-testid="button-refresh-snapshot"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="relative bg-gray-900">
          <img
            ref={imgRef}
            className="w-full h-auto"
            onLoad={handleImageLoad}
            onError={handleImageError}
            data-testid="img-camera-snapshot"
            alt={title || 'Camera Snapshot'}
          />
          
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
              <div className="text-white text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                <p>Loading snapshot...</p>
              </div>
            </div>
          )}

          {isAnalyzing && (
            <div className="absolute top-2 left-2 bg-blue-600 text-white px-2 py-1 rounded text-xs flex items-center">
              <Eye className="h-3 w-3 mr-1 animate-pulse" />
              AI Analyzing...
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

          {/* Timestamp */}
          <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs">
            {lastRefresh.toLocaleTimeString()}
          </div>

          {/* Auto-refresh indicator */}
          {autoRefresh && (
            <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs">
              Auto: {refreshInterval / 1000}s
            </div>
          )}
        </div>

        {/* Damage Detection Results */}
        {analysisResult && analysisResult.hasDetection && (
          <div className="p-4 space-y-2">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-red-600 flex items-center">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Damage Detected
              </h4>
              {analysisResult.detections.length > 0 && (
                <Button
                  size="sm"
                  variant="default"
                  className="bg-orange-600 hover:bg-orange-700"
                  onClick={() => contactHomeownerMutation.mutate(analysisResult.detections[0])}
                  disabled={contactHomeownerMutation.isPending}
                  data-testid="button-contact-homeowner"
                >
                  <Phone className="h-3 w-3 mr-1" />
                  {contactHomeownerMutation.isPending ? 'Contacting...' : 'Contact Homeowner'}
                </Button>
              )}
            </div>
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
              No damage detected (Confidence: {analysisResult.confidence}%)
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}