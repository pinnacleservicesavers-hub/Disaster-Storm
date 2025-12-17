import { useState, useRef, useCallback, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Camera, TreePine, Home, Trash2, Upload, Ruler, AlertTriangle, CheckCircle, FileText, Loader2, PaintBucket, Square } from 'lucide-react';

interface MeasurementResult {
  measurements: Record<string, any>;
  confidenceLevel: 'low' | 'medium' | 'high';
  confidenceScore: number;
  aiModel: string;
  measurementMethodology?: string;
  limitationsNoted: string[];
  limitations?: string[];
  reviewRequired: boolean;
  estimatedWeight?: { value: number; unit: string };
  species?: { detected: string; confidence: number };
  referenceObject?: any;
  captureContext?: any;
}

interface ScopeItem {
  industryStandardCategory: string;
  description: string;
  quantity: number;
  unit: string;
  notes?: string;
  sourceSessionId?: string;
  confidenceScore?: number;
  confidenceLevel: 'low' | 'medium' | 'high';
  aiModelUsed: string;
  measurementMethodology: string;
  accessComplexity?: string;
  hazardFlags?: string[];
  captureContext?: any;
}

interface MeasurementSession {
  id: string;
  projectId: string;
  tradeType: string;
  status: string;
  createdAt: string;
  estimates: MeasurementResult[];
  overallConfidence?: number;
  hasLowConfidence?: boolean;
  requiresReview?: boolean;
}

type TradeType = 'tree' | 'roofing' | 'debris' | 'drywall' | 'flooring';

interface VoiceGuide {
  tradeId: string;
  tradeName: string;
  intro: string;
  captureSteps: Array<{
    step: number;
    prompt: string;
    voiceScript: string;
    required: boolean;
    mediaType: string;
    tips: string[];
  }>;
  scopeQuestions: Array<{
    key: string;
    prompt: string;
    options?: string[];
    required: boolean;
  }>;
  lineItemTemplates: string[];
  safetyReminders: string[];
}

export default function MeasurementCapture({ projectId }: { projectId?: string }) {
  const [selectedTrade, setSelectedTrade] = useState<TradeType>('tree');
  const [voiceGuide, setVoiceGuide] = useState<VoiceGuide | null>(null);
  const [currentCaptureStep, setCurrentCaptureStep] = useState(1);
  const [captureMode, setCaptureMode] = useState<'single_photo' | 'video_walkthrough'>('single_photo');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [referenceObject, setReferenceObject] = useState<string>('credit_card');
  const [customRefHeight, setCustomRefHeight] = useState<string>('');
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [address, setAddress] = useState<string>('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: sessionsData, isLoading: sessionsLoading } = useQuery({
    queryKey: ['/api/measurements/sessions', projectId],
    enabled: !!projectId
  });

  const { data: speciesData } = useQuery({
    queryKey: ['/api/measurements/tree-species']
  });

  const { data: voiceGuideData } = useQuery({
    queryKey: [`/api/voice-guide/trade/${selectedTrade}`],
    enabled: !!selectedTrade
  });

  useEffect(() => {
    if (voiceGuideData?.guide) {
      setVoiceGuide(voiceGuideData.guide);
    }
  }, [voiceGuideData]);

  const treeMutation = useMutation({
    mutationFn: async (imageBase64: string) => {
      return apiRequest('/api/measurements/analyze-tree', {
        method: 'POST',
        body: JSON.stringify({
          imageBase64,
          projectId,
          captureMode,
          reference: referenceObject === 'custom' ? { type: 'custom', heightInches: parseFloat(customRefHeight) } : { type: referenceObject },
          latitude: location?.lat,
          longitude: location?.lng,
          address
        })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/measurements/sessions', projectId] });
      toast({ title: 'Tree Analysis Complete', description: 'Measurements have been calculated with AI confidence scoring.' });
      resetForm();
    },
    onError: (err: any) => {
      toast({ title: 'Analysis Failed', description: err.message, variant: 'destructive' });
    }
  });

  const roofMutation = useMutation({
    mutationFn: async (imageBase64: string) => {
      return apiRequest('/api/measurements/analyze-roof', {
        method: 'POST',
        body: JSON.stringify({
          imageBase64,
          projectId,
          captureMode,
          reference: referenceObject === 'custom' ? { type: 'custom', heightInches: parseFloat(customRefHeight) } : { type: referenceObject },
          latitude: location?.lat,
          longitude: location?.lng,
          address
        })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/measurements/sessions', projectId] });
      toast({ title: 'Roof Analysis Complete', description: 'Roof measurements and scope items generated.' });
      resetForm();
    },
    onError: (err: any) => {
      toast({ title: 'Analysis Failed', description: err.message, variant: 'destructive' });
    }
  });

  const debrisMutation = useMutation({
    mutationFn: async (imageBase64: string) => {
      return apiRequest('/api/measurements/analyze-debris', {
        method: 'POST',
        body: JSON.stringify({
          imageBase64,
          projectId,
          captureMode,
          reference: referenceObject === 'custom' ? { type: 'custom', heightInches: parseFloat(customRefHeight) } : { type: referenceObject },
          latitude: location?.lat,
          longitude: location?.lng,
          address
        })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/measurements/sessions', projectId] });
      toast({ title: 'Debris Analysis Complete', description: 'Volume and disposal scope calculated.' });
      resetForm();
    },
    onError: (err: any) => {
      toast({ title: 'Analysis Failed', description: err.message, variant: 'destructive' });
    }
  });

  const resetForm = useCallback(() => {
    setSelectedImage(null);
    setImagePreview('');
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setSelectedImage(file);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImagePreview(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (!selectedImage) return;
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = (e.target?.result as string).split(',')[1];
      
      switch (selectedTrade) {
        case 'tree':
          treeMutation.mutate(base64);
          break;
        case 'roofing':
          roofMutation.mutate(base64);
          break;
        case 'debris':
          debrisMutation.mutate(base64);
          break;
        case 'drywall':
        case 'flooring':
          toast({ 
            title: 'Coming Soon', 
            description: `${selectedTrade.charAt(0).toUpperCase() + selectedTrade.slice(1)} measurement is in development. Use tree, roofing, or debris for now.` 
          });
          break;
      }
    };
    reader.readAsDataURL(selectedImage);
  }, [selectedImage, selectedTrade, treeMutation, roofMutation, debrisMutation]);

  const requestLocation = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          toast({ title: 'Location Acquired', description: `${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}` });
        },
        (err) => {
          toast({ title: 'Location Error', description: err.message, variant: 'destructive' });
        }
      );
    }
  }, [toast]);

  const isAnalyzing = treeMutation.isPending || roofMutation.isPending || debrisMutation.isPending;
  const sessions = (sessionsData as any)?.sessions || [];

  const getConfidenceColor = (conf: number) => {
    if (conf >= 0.85) return 'text-green-600 bg-green-100';
    if (conf >= 0.7) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getTradeIcon = (trade: TradeType) => {
    switch (trade) {
      case 'tree': return <TreePine className="w-5 h-5" />;
      case 'roofing': return <Home className="w-5 h-5" />;
      case 'debris': return <Trash2 className="w-5 h-5" />;
      case 'drywall': return <PaintBucket className="w-5 h-5" />;
      case 'flooring': return <Square className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-6" data-testid="measurement-capture">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ruler className="w-5 h-5 text-blue-600" />
            AI Measurement Intelligence
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedTrade} onValueChange={(v) => setSelectedTrade(v as TradeType)}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="tree" data-testid="tab-tree">
                <TreePine className="w-4 h-4 mr-1" /> Tree
              </TabsTrigger>
              <TabsTrigger value="roofing" data-testid="tab-roofing">
                <Home className="w-4 h-4 mr-1" /> Roofing
              </TabsTrigger>
              <TabsTrigger value="drywall" data-testid="tab-drywall">
                <PaintBucket className="w-4 h-4 mr-1" /> Drywall
              </TabsTrigger>
              <TabsTrigger value="flooring" data-testid="tab-flooring">
                <Square className="w-4 h-4 mr-1" /> Flooring
              </TabsTrigger>
              <TabsTrigger value="debris" data-testid="tab-debris">
                <Trash2 className="w-4 h-4 mr-1" /> Debris
              </TabsTrigger>
            </TabsList>

            <TabsContent value="tree" className="space-y-4 mt-4">
              <div className="text-sm text-gray-600">
                {voiceGuide?.tradeId === 'tree' ? voiceGuide.intro : 
                  'Capture trees with a reference object for precise height, trunk diameter, and weight estimation using forestry allometric equations.'}
              </div>
              {voiceGuide?.safetyReminders && voiceGuide.tradeId === 'tree' && (
                <div className="bg-amber-50 border border-amber-200 rounded p-3 text-sm">
                  <strong className="text-amber-800">Safety:</strong> {voiceGuide.safetyReminders[0]}
                </div>
              )}
            </TabsContent>

            <TabsContent value="roofing" className="space-y-4 mt-4">
              <div className="text-sm text-gray-600">
                {voiceGuide?.tradeId === 'roofing' ? voiceGuide.intro :
                  'Analyze roof damage with area calculations, pitch detection, and trade-specific scope items for insurance claims.'}
              </div>
              {voiceGuide?.safetyReminders && voiceGuide.tradeId === 'roofing' && (
                <div className="bg-amber-50 border border-amber-200 rounded p-3 text-sm">
                  <strong className="text-amber-800">Safety:</strong> {voiceGuide.safetyReminders[0]}
                </div>
              )}
            </TabsContent>

            <TabsContent value="drywall" className="space-y-4 mt-4">
              <div className="text-sm text-gray-600">
                {voiceGuide?.tradeId === 'drywall' ? voiceGuide.intro :
                  'Document interior damage for drywall and paint repairs. Use LiDAR or video for accurate wall and ceiling measurements.'}
              </div>
              {voiceGuide?.safetyReminders && voiceGuide.tradeId === 'drywall' && (
                <div className="bg-amber-50 border border-amber-200 rounded p-3 text-sm">
                  <strong className="text-amber-800">Safety:</strong> {voiceGuide.safetyReminders[0]}
                </div>
              )}
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Coming Soon</Badge>
            </TabsContent>

            <TabsContent value="flooring" className="space-y-4 mt-4">
              <div className="text-sm text-gray-600">
                {voiceGuide?.tradeId === 'flooring' ? voiceGuide.intro :
                  'Measure flooring damage and calculate square footage for replacement. AI identifies transitions and stair counts.'}
              </div>
              {voiceGuide?.safetyReminders && voiceGuide.tradeId === 'flooring' && (
                <div className="bg-amber-50 border border-amber-200 rounded p-3 text-sm">
                  <strong className="text-amber-800">Safety:</strong> {voiceGuide.safetyReminders[0]}
                </div>
              )}
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Coming Soon</Badge>
            </TabsContent>

            <TabsContent value="debris" className="space-y-4 mt-4">
              <div className="text-sm text-gray-600">
                Estimate debris volume in cubic yards for hauling and disposal scope documentation.
              </div>
            </TabsContent>
          </Tabs>

          <div className="grid md:grid-cols-2 gap-6 mt-6">
            <div className="space-y-4">
              <div>
                <Label>Reference Object</Label>
                <Select value={referenceObject} onValueChange={setReferenceObject}>
                  <SelectTrigger data-testid="select-reference">
                    <SelectValue placeholder="Select reference" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="credit_card">Credit Card (3.375" × 2.125")</SelectItem>
                    <SelectItem value="dollar_bill">Dollar Bill (6.14" × 2.61")</SelectItem>
                    <SelectItem value="smartphone">Standard Smartphone (~6")</SelectItem>
                    <SelectItem value="5_gallon_bucket">5-Gallon Bucket (14.5" tall)</SelectItem>
                    <SelectItem value="standard_door">Standard Door (80" × 36")</SelectItem>
                    <SelectItem value="custom">Custom Height...</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {referenceObject === 'custom' && (
                <div>
                  <Label>Reference Height (inches)</Label>
                  <Input 
                    type="number" 
                    value={customRefHeight}
                    onChange={(e) => setCustomRefHeight(e.target.value)}
                    placeholder="Enter height in inches"
                    data-testid="input-custom-height"
                  />
                </div>
              )}

              <div>
                <Label>Property Address</Label>
                <Input 
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Enter property address"
                  data-testid="input-address"
                />
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={requestLocation} data-testid="button-location">
                  📍 Get GPS Location
                </Button>
                {location && (
                  <span className="text-xs text-green-600">
                    {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center min-h-[200px] flex flex-col items-center justify-center">
                {imagePreview ? (
                  <div className="relative w-full">
                    <img src={imagePreview} alt="Preview" className="max-h-48 mx-auto rounded" />
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      className="absolute top-2 right-2"
                      onClick={resetForm}
                      data-testid="button-clear-image"
                    >
                      ×
                    </Button>
                  </div>
                ) : (
                  <>
                    <Camera className="w-12 h-12 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500 mb-2">
                      Capture or upload a photo with your reference object visible
                    </p>
                    <Button 
                      variant="outline" 
                      onClick={() => fileInputRef.current?.click()}
                      data-testid="button-upload"
                    >
                      <Upload className="w-4 h-4 mr-2" /> Select Image
                    </Button>
                    <input 
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileSelect}
                      data-testid="input-file"
                    />
                  </>
                )}
              </div>

              <Button 
                className="w-full"
                disabled={!selectedImage || isAnalyzing}
                onClick={handleAnalyze}
                data-testid="button-analyze"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing with AI...
                  </>
                ) : (
                  <>
                    <Ruler className="w-4 h-4 mr-2" />
                    Analyze & Generate Scope
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {sessions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Measurement History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sessions.map((session: MeasurementSession) => (
                <div key={session.id} className="border rounded-lg p-4" data-testid={`session-${session.id}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getTradeIcon(session.tradeType as TradeType)}
                      <span className="font-medium capitalize">{session.tradeType} Measurement</span>
                      <Badge variant="outline">{session.status}</Badge>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(session.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  
                  {session.estimates?.map((est: any, idx: number) => {
                    const confidence = est.confidenceScore || est.confidence || 0;
                    const limitations = est.limitations || est.limitationsNoted || [];
                    const reviewRequired = est.reviewRequired || confidence < 0.7;
                    
                    return (
                      <div key={idx} className="mt-3 bg-gray-50 rounded p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getConfidenceColor(confidence)}`}>
                            {(confidence * 100).toFixed(0)}% Confidence
                          </span>
                          {reviewRequired && (
                            <Badge variant="destructive" className="text-xs">
                              <AlertTriangle className="w-3 h-3 mr-1" /> Review Required
                            </Badge>
                          )}
                          {!reviewRequired && confidence >= 0.85 && (
                            <Badge variant="outline" className="text-xs text-green-600 border-green-300">
                              <CheckCircle className="w-3 h-3 mr-1" /> High Confidence
                            </Badge>
                          )}
                          {est.aiModel && (
                            <span className="text-xs text-gray-400" title={est.aiModel}>
                              AI: {est.aiModel.split('+')[0].trim().slice(-15)}
                            </span>
                          )}
                        </div>
                        
                        {est.measurements && (
                          <div className="grid grid-cols-3 gap-2 text-sm">
                            {Object.entries(est.measurements).map(([key, val]: [string, any]) => (
                              <div key={key} className="bg-white p-2 rounded border">
                                <div className="text-xs text-gray-500 capitalize">{key.replace(/_/g, ' ')}</div>
                                <div className="font-medium">
                                  {typeof val === 'object' ? `${val.value} ${val.unit}` : val}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {limitations.length > 0 && (
                          <div className="mt-2 text-xs text-orange-600">
                            <strong>Limitations:</strong> {limitations.join('; ')}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-amber-50 border-amber-200">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
              <strong>AI Measurement Disclaimer:</strong> All measurements are AI-generated estimates using computer vision analysis. 
              These outputs require verification by a qualified estimator before use in insurance claims. 
              Confidence scores indicate AI certainty based on image quality and reference object visibility. 
              Measurements below 70% confidence should be manually verified or recaptured with better reference visibility.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
