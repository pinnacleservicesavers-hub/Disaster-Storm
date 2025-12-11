import { useState, useRef, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import VoiceGuide from '@/components/VoiceGuide';
import { StateCitySelector, useStateCitySelector } from '@/components/StateCitySelector';
import ModuleAIAssistant from '@/components/ModuleAIAssistant';
import { 
  Upload, Camera, Image, Scan, AlertTriangle, CheckCircle2, 
  FileImage, Trash2, Eye, Download, Send, DollarSign, Shield,
  Zap, Clock, Users, MapPin, ChevronRight, Brain, Sparkles,
  RefreshCw, FileText, Share2, Phone, Mail, X, Play, Pause,
  Satellite, Globe, Layers, Calendar, TrendingDown, Flame, Droplets
} from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';

interface DamageDetection {
  alertType: string;
  confidence: number;
  severity: 'minor' | 'moderate' | 'severe' | 'critical';
  severityScore: number;
  profitabilityScore: number;
  description: string;
  urgencyLevel: string;
  contractorTypes: string[];
  estimatedCost?: { min: number; max: number; currency: string };
  workScope?: string[];
  safetyHazards?: string[];
  leadPriority: string;
}

interface TreeDamageDetail {
  count: number;
  description: string;
  locations: string[];
}

interface DamageInventory {
  treesDown: TreeDamageDetail;
  treesOnHomes: TreeDamageDetail;
  treesOnCars: TreeDamageDetail;
  treesOnBuildings: TreeDamageDetail;
  treesOnPowerlines: TreeDamageDetail;
  treesBlockingRoads: TreeDamageDetail;
  roofsDamaged: number;
  windowsBroken: number;
  vehiclesDamaged: number;
  structuresDamaged: number;
}

interface AnalysisResult {
  id: string;
  hasDetection: boolean;
  detections: DamageDetection[];
  analysisTimestamp: string;
  processingTimeMs: number;
  confidence: number;
  riskAssessment: {
    publicSafety: number;
    propertyDamage: number;
    businessDisruption: number;
  };
  recommendedActions?: string[];
  metadata?: {
    originalFilename: string;
    fileSize: number;
    location?: string;
    propertyAddress?: string;
  };
  damageInventory?: DamageInventory;
  aiNarrative?: string;
}

interface SatelliteImage {
  url: string;
  index: string;
  date: string;
  satellite: string;
}

interface SatelliteDamageAnalysis {
  beforeImage: SatelliteImage | null;
  afterImage: SatelliteImage | null;
  changeDetected: boolean;
  damageIndicators: {
    vegetationLoss: number;
    burnSeverity: number;
    floodExtent: number;
    structuralChange: number;
  };
  analysis: string;
  dataSource: 'EOS_SATELLITE' | 'SIMULATION';
  disclaimer: string;
}

export default function AIDamageDetection() {
  const { toast } = useToast();
  const { selectedState, setSelectedState, selectedCity, setSelectedCity, availableCities } = useStateCitySelector('Florida', 'Miami');
  
  const [activeTab, setActiveTab] = useState('upload');
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [propertyAddress, setPropertyAddress] = useState('');
  const [currentAnalysis, setCurrentAnalysis] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  
  // Satellite imagery state
  const [satelliteLat, setSatelliteLat] = useState('');
  const [satelliteLon, setSatelliteLon] = useState('');
  const [stormDate, setStormDate] = useState(new Date().toISOString().split('T')[0]);
  const [stormType, setStormType] = useState('hurricane');
  const [satelliteAnalysis, setSatelliteAnalysis] = useState<SatelliteDamageAnalysis | null>(null);
  const [isAnalyzingSatellite, setIsAnalyzingSatellite] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Fetch past analyses
  const { data: pastAnalyses, refetch: refetchAnalyses } = useQuery<any>({
    queryKey: ['/api/ai-damage/analyses'],
  });

  // Handle drag events
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  // Handle file drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files).filter(f => 
      f.type.startsWith('image/')
    );
    
    if (files.length > 0) {
      addFiles(files);
    }
  }, []);

  // Add files to selection
  const addFiles = (files: File[]) => {
    const newFiles = [...selectedFiles, ...files].slice(0, 10); // Max 10 files
    setSelectedFiles(newFiles);
    
    // Generate previews
    const newUrls = files.map(f => URL.createObjectURL(f));
    setPreviewUrls(prev => [...prev, ...newUrls].slice(0, 10));
    
    toast({
      title: "Images Added",
      description: `${files.length} image(s) ready for analysis`,
    });
  };

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFiles(Array.from(e.target.files));
    }
  };

  // Remove a file
  const removeFile = (index: number) => {
    URL.revokeObjectURL(previewUrls[index]);
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  // Clear all files
  const clearFiles = () => {
    previewUrls.forEach(url => URL.revokeObjectURL(url));
    setSelectedFiles([]);
    setPreviewUrls([]);
    setCurrentAnalysis(null);
  };

  // Start camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } } 
      });
      setCameraStream(stream);
      setShowCamera(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      toast({
        title: "Camera Error",
        description: "Could not access camera. Please check permissions.",
        variant: "destructive"
      });
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setShowCamera(false);
  };

  // Capture photo from camera
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
            addFiles([file]);
            stopCamera();
          }
        }, 'image/jpeg', 0.9);
      }
    }
  };

  // Analyze images
  const analyzeImages = async () => {
    if (selectedFiles.length === 0) {
      toast({
        title: "No Images",
        description: "Please upload or capture at least one image.",
        variant: "destructive"
      });
      return;
    }

    setIsAnalyzing(true);
    setAnalysisProgress(0);
    setCurrentAnalysis(null);

    try {
      // Analyze each image
      const results: AnalysisResult[] = [];
      
      for (let i = 0; i < selectedFiles.length; i++) {
        setAnalysisProgress(((i) / selectedFiles.length) * 100);
        
        const formData = new FormData();
        formData.append('image', selectedFiles[i]);
        formData.append('propertyAddress', propertyAddress);
        formData.append('location', `${selectedCity}, ${selectedState}`);
        formData.append('propertyType', 'residential');

        const response = await fetch('/api/ai-damage/analyze', {
          method: 'POST',
          body: formData
        });

        if (!response.ok) {
          const errorData = await response.json();
          if (errorData.code === 'AI_NOT_CONFIGURED') {
            throw new Error('AI service not available. Please configure ANTHROPIC_API_KEY.');
          }
          throw new Error(errorData.error || 'Analysis failed');
        }

        const data = await response.json();
        if (data.success && data.analysis) {
          results.push(data.analysis);
        }
        
        setAnalysisProgress(((i + 1) / selectedFiles.length) * 100);
      }

      if (results.length > 0) {
        // Combine all detections into one result for display
        const combinedResult: AnalysisResult = {
          ...results[0],
          detections: results.flatMap(r => r.detections),
        };
        setCurrentAnalysis(combinedResult);
        refetchAnalyses();
        
        toast({
          title: "Analysis Complete",
          description: `Found ${combinedResult.detections.length} damage detection(s) across ${selectedFiles.length} image(s).`,
        });
      }
    } catch (error: any) {
      console.error('Analysis error:', error);
      toast({
        title: "Analysis Failed",
        description: error.message || "Could not analyze images. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
      setAnalysisProgress(100);
    }
  };

  // Analyze satellite imagery for storm damage
  const analyzeSatelliteDamage = async () => {
    if (!satelliteLat || !satelliteLon) {
      toast({
        title: "Location Required",
        description: "Please enter latitude and longitude coordinates.",
        variant: "destructive"
      });
      return;
    }

    setIsAnalyzingSatellite(true);
    setSatelliteAnalysis(null);

    try {
      const response = await fetch('/api/satellite/analyze-damage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lat: parseFloat(satelliteLat),
          lon: parseFloat(satelliteLon),
          stormDate,
          stormType
        })
      });

      if (!response.ok) {
        throw new Error('Satellite analysis failed');
      }

      const data = await response.json();
      if (data.success && data.analysis) {
        setSatelliteAnalysis(data.analysis);
        toast({
          title: "Satellite Analysis Complete",
          description: data.analysis.changeDetected 
            ? "Storm damage detected in satellite imagery!" 
            : "No significant damage detected.",
        });
      }
    } catch (error: any) {
      console.error('Satellite analysis error:', error);
      toast({
        title: "Analysis Failed",
        description: "Could not analyze satellite imagery. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzingSatellite(false);
    }
  };

  // Get coordinates from current location
  const useCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setSatelliteLat(position.coords.latitude.toFixed(6));
          setSatelliteLon(position.coords.longitude.toFixed(6));
          toast({
            title: "Location Detected",
            description: "Coordinates set from your current location.",
          });
        },
        (error) => {
          toast({
            title: "Location Error",
            description: "Could not get your location. Please enter coordinates manually.",
            variant: "destructive"
          });
        }
      );
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-600 text-white';
      case 'severe': return 'bg-orange-600 text-white';
      case 'moderate': return 'bg-yellow-600 text-black';
      case 'minor': return 'bg-blue-600 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'emergency': return 'text-red-400 animate-pulse';
      case 'high': return 'text-orange-400';
      case 'normal': return 'text-yellow-400';
      case 'low': return 'text-blue-400';
      default: return 'text-gray-400';
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Ambient Neon Backdrop */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 opacity-30 blur-3xl"
          style={{
            background: 'radial-gradient(40% 40% at 20% 30%, rgba(255,0,255,0.15), transparent 60%), radial-gradient(50% 50% at 80% 70%, rgba(0,194,255,0.2), transparent 65%)'
          }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight"
              style={{
                background: 'linear-gradient(90deg, #ff00ff 0%, #00d9ff 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: '0 0 80px rgba(255, 0, 255, 0.5)'
              }}
            >
              AI Damage Detection
            </h1>
            <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-fuchsia-600/20 to-cyan-600/20 border border-fuchsia-500/30 rounded-full">
              <Brain className="w-5 h-5 text-fuchsia-400" />
              <span className="text-sm font-medium text-fuchsia-300">Claude Vision AI</span>
            </div>
          </div>
          
          <p className="text-xl text-cyan-300/70 mb-4">
            Upload photos of storm damage and get <span className="text-cyan-300 font-semibold">instant AI analysis</span> with cost estimates, severity ratings, and contractor recommendations
          </p>

          <div className="flex items-center gap-4 text-sm text-cyan-400/60">
            <span className="flex items-center gap-1">
              <Sparkles className="w-4 h-4" />
              Powered by Anthropic Claude
            </span>
            <span className="w-1 h-1 rounded-full bg-cyan-400/60" />
            <span>Real-time Analysis</span>
            <span className="w-1 h-1 rounded-full bg-cyan-400/60" />
            <span>Professional Reports</span>
          </div>
        </div>

        {/* Location Selector */}
        <div className="flex justify-center mb-8">
          <StateCitySelector
            selectedState={selectedState}
            selectedCity={selectedCity}
            availableCities={availableCities}
            onStateChange={setSelectedState}
            onCityChange={setSelectedCity}
            variant="dark"
            showAllStates={true}
          />
        </div>

        {/* Voice Guide */}
        <div className="flex justify-center mb-8">
          <VoiceGuide currentPortal="ai-damage" />
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="bg-slate-900/80 border border-fuchsia-500/40 p-1.5 shadow-lg">
            <TabsTrigger value="upload" className="px-6 py-3 data-[state=active]:bg-fuchsia-600 data-[state=active]:text-white font-semibold" data-testid="tab-upload">
              <Upload className="w-5 h-5 mr-2" />
              Upload & Analyze
            </TabsTrigger>
            <TabsTrigger value="history" className="px-6 py-3 data-[state=active]:bg-cyan-600 data-[state=active]:text-white font-semibold" data-testid="tab-history">
              <FileText className="w-5 h-5 mr-2" />
              Analysis History
            </TabsTrigger>
            <TabsTrigger value="satellite" className="px-6 py-3 data-[state=active]:bg-emerald-600 data-[state=active]:text-white font-semibold" data-testid="tab-satellite">
              <Satellite className="w-5 h-5 mr-2" />
              Satellite Imagery
            </TabsTrigger>
          </TabsList>

          {/* UPLOAD TAB */}
          <TabsContent value="upload" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column - Upload Zone */}
              <div className="space-y-6">
                {/* Property Address Input */}
                <div>
                  <label className="block text-sm font-medium text-fuchsia-300 mb-2">Property Address (optional)</label>
                  <Input
                    placeholder="123 Main St, Miami, FL 33101"
                    value={propertyAddress}
                    onChange={(e) => setPropertyAddress(e.target.value)}
                    className="bg-slate-900/60 border-fuchsia-500/30 text-white placeholder:text-fuchsia-300/40"
                    data-testid="input-property-address"
                  />
                </div>

                {/* Camera Modal */}
                {showCamera && (
                  <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-fuchsia-500/50 rounded-2xl p-6 max-w-2xl w-full">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold text-fuchsia-300">Capture Damage Photo</h3>
                        <button onClick={stopCamera} className="text-fuchsia-300/60 hover:text-fuchsia-300">
                          <X className="w-6 h-6" />
                        </button>
                      </div>
                      <video 
                        ref={videoRef} 
                        autoPlay 
                        playsInline 
                        className="w-full rounded-lg mb-4"
                      />
                      <canvas ref={canvasRef} className="hidden" />
                      <div className="flex justify-center gap-4">
                        <Button onClick={capturePhoto} className="bg-fuchsia-600 hover:bg-fuchsia-700" data-testid="button-capture">
                          <Camera className="w-5 h-5 mr-2" />
                          Capture Photo
                        </Button>
                        <Button onClick={stopCamera} variant="outline" className="border-fuchsia-500/50 text-fuchsia-300">
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Drag & Drop Upload Zone */}
                <div
                  className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer ${
                    dragActive 
                      ? 'border-fuchsia-400 bg-fuchsia-500/10 scale-102' 
                      : 'border-fuchsia-500/40 bg-slate-900/40 hover:border-fuchsia-400/60 hover:bg-slate-900/60'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  data-testid="dropzone-upload"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    data-testid="input-file-upload"
                  />
                  
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-20 h-20 rounded-full bg-fuchsia-500/20 flex items-center justify-center">
                      <Upload className="w-10 h-10 text-fuchsia-400" />
                    </div>
                    <div>
                      <p className="text-xl font-semibold text-fuchsia-300 mb-2">
                        Drag & Drop Damage Photos
                      </p>
                      <p className="text-sm text-fuchsia-300/60">
                        or click to browse • JPEG, PNG, WebP up to 25MB
                      </p>
                    </div>
                  </div>
                </div>

                {/* Camera Capture Button */}
                <Button 
                  onClick={startCamera}
                  className="w-full bg-cyan-600 hover:bg-cyan-700 py-6 text-lg"
                  data-testid="button-open-camera"
                >
                  <Camera className="w-6 h-6 mr-3" />
                  Open Camera to Capture Damage
                </Button>

                {/* Selected Files Preview */}
                {selectedFiles.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-fuchsia-300">
                        Selected Images ({selectedFiles.length})
                      </h3>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={clearFiles}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        data-testid="button-clear-all"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Clear All
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-3">
                      {previewUrls.map((url, idx) => (
                        <div key={idx} className="relative group">
                          <img 
                            src={url} 
                            alt={`Preview ${idx + 1}`}
                            className="w-full h-24 object-cover rounded-lg border border-fuchsia-500/30"
                          />
                          <button
                            onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                            className="absolute top-1 right-1 w-6 h-6 bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            data-testid={`button-remove-image-${idx}`}
                          >
                            <X className="w-4 h-4" />
                          </button>
                          <div className="absolute bottom-1 left-1 text-xs bg-black/70 px-1.5 py-0.5 rounded">
                            {(selectedFiles[idx].size / 1024 / 1024).toFixed(1)}MB
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Analyze Button */}
                    <Button 
                      onClick={analyzeImages}
                      disabled={isAnalyzing}
                      className="w-full bg-gradient-to-r from-fuchsia-600 to-cyan-600 hover:from-fuchsia-700 hover:to-cyan-700 py-6 text-lg font-bold"
                      data-testid="button-analyze"
                    >
                      {isAnalyzing ? (
                        <>
                          <RefreshCw className="w-6 h-6 mr-3 animate-spin" />
                          Analyzing with AI...
                        </>
                      ) : (
                        <>
                          <Scan className="w-6 h-6 mr-3" />
                          Analyze for Damage
                        </>
                      )}
                    </Button>

                    {/* Progress Bar */}
                    {isAnalyzing && (
                      <div className="space-y-2">
                        <Progress value={analysisProgress} className="h-3" />
                        <p className="text-sm text-center text-fuchsia-300/70">
                          AI is scanning images for storm damage patterns...
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Right Column - Analysis Results */}
              <div className="space-y-6">
                {currentAnalysis ? (
                  <>
                    {/* Analysis Summary Card */}
                    <Card className="bg-gradient-to-br from-fuchsia-900/40 to-cyan-900/40 border-fuchsia-500/50 p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-bold text-fuchsia-300 flex items-center gap-2">
                          <CheckCircle2 className="w-6 h-6 text-green-400" />
                          Analysis Complete
                        </h3>
                        <span className="text-sm text-cyan-300/60">
                          {currentAnalysis.processingTimeMs}ms
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-slate-900/60 rounded-lg p-4 text-center">
                          <div className="text-3xl font-bold text-fuchsia-300">{currentAnalysis.detections.length}</div>
                          <div className="text-sm text-fuchsia-300/60">Damage Items Found</div>
                        </div>
                        <div className="bg-slate-900/60 rounded-lg p-4 text-center">
                          <div className="text-3xl font-bold text-cyan-300">{Math.round(currentAnalysis.confidence * 100)}%</div>
                          <div className="text-sm text-cyan-300/60">AI Confidence</div>
                        </div>
                      </div>

                      {/* Cost Estimate */}
                      {currentAnalysis.detections.length > 0 && (
                        <div className="bg-green-900/30 border border-green-500/40 rounded-lg p-4 mb-4">
                          <div className="flex items-center gap-2 mb-2">
                            <DollarSign className="w-5 h-5 text-green-400" />
                            <span className="font-semibold text-green-300">Estimated Repair Cost</span>
                          </div>
                          <div className="text-2xl font-bold text-green-400">
                            {formatCurrency(currentAnalysis.detections.reduce((sum, d) => sum + (d.estimatedCost?.min || 0), 0))} - {formatCurrency(currentAnalysis.detections.reduce((sum, d) => sum + (d.estimatedCost?.max || 0), 0))}
                          </div>
                        </div>
                      )}

                      {/* Risk Assessment */}
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold text-cyan-300/80">Risk Assessment</h4>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="text-center">
                            <div className="text-lg font-bold text-red-400">{currentAnalysis.riskAssessment?.publicSafety || 0}/10</div>
                            <div className="text-xs text-red-300/60">Safety Risk</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-orange-400">{currentAnalysis.riskAssessment?.propertyDamage || 0}/10</div>
                            <div className="text-xs text-orange-300/60">Property</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-yellow-400">{currentAnalysis.riskAssessment?.businessDisruption || 0}/10</div>
                            <div className="text-xs text-yellow-300/60">Disruption</div>
                          </div>
                        </div>
                      </div>
                    </Card>

                    {/* AI Narrative - Voice-ready summary */}
                    {currentAnalysis.aiNarrative && (
                      <Card className="bg-gradient-to-br from-cyan-900/40 to-blue-900/40 border-cyan-500/50 p-4" data-testid="ai-narrative-card">
                        <div className="flex items-center gap-2 mb-3">
                          <Brain className="w-5 h-5 text-cyan-400" />
                          <h4 className="font-semibold text-cyan-300">AI Damage Summary</h4>
                        </div>
                        <p className="text-cyan-100/90 italic">"{currentAnalysis.aiNarrative}"</p>
                      </Card>
                    )}

                    {/* Damage Inventory - Precise Counts */}
                    {currentAnalysis.damageInventory && (
                      <Card className="bg-gradient-to-br from-amber-900/40 to-orange-900/40 border-amber-500/50 p-4" data-testid="damage-inventory-card">
                        <div className="flex items-center gap-2 mb-4">
                          <AlertTriangle className="w-5 h-5 text-amber-400" />
                          <h4 className="font-semibold text-amber-300">Damage Inventory - Precise Counts</h4>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                          {/* Tree Damage Summary */}
                          {currentAnalysis.damageInventory.treesDown.count > 0 && (
                            <div className="bg-slate-900/60 rounded-lg p-3">
                              <div className="text-2xl font-bold text-amber-300">{currentAnalysis.damageInventory.treesDown.count}</div>
                              <div className="text-sm text-amber-300/70">Trees Down</div>
                              {currentAnalysis.damageInventory.treesDown.description && (
                                <p className="text-xs text-amber-200/60 mt-1">{currentAnalysis.damageInventory.treesDown.description}</p>
                              )}
                            </div>
                          )}
                          
                          {currentAnalysis.damageInventory.treesOnHomes.count > 0 && (
                            <div className="bg-red-900/40 border border-red-500/50 rounded-lg p-3">
                              <div className="text-2xl font-bold text-red-400">{currentAnalysis.damageInventory.treesOnHomes.count}</div>
                              <div className="text-sm text-red-300/70 font-semibold">Trees on Homes (CRITICAL)</div>
                              {currentAnalysis.damageInventory.treesOnHomes.description && (
                                <p className="text-xs text-red-200/60 mt-1">{currentAnalysis.damageInventory.treesOnHomes.description}</p>
                              )}
                            </div>
                          )}
                          
                          {currentAnalysis.damageInventory.treesOnCars.count > 0 && (
                            <div className="bg-orange-900/40 border border-orange-500/50 rounded-lg p-3">
                              <div className="text-2xl font-bold text-orange-400">{currentAnalysis.damageInventory.treesOnCars.count}</div>
                              <div className="text-sm text-orange-300/70">Trees on Vehicles</div>
                            </div>
                          )}
                          
                          {currentAnalysis.damageInventory.treesOnBuildings.count > 0 && (
                            <div className="bg-red-900/40 border border-red-500/50 rounded-lg p-3">
                              <div className="text-2xl font-bold text-red-400">{currentAnalysis.damageInventory.treesOnBuildings.count}</div>
                              <div className="text-sm text-red-300/70">Trees on Buildings</div>
                            </div>
                          )}
                          
                          {currentAnalysis.damageInventory.treesOnPowerlines.count > 0 && (
                            <div className="bg-red-900/60 border-2 border-red-500 rounded-lg p-3 animate-pulse">
                              <div className="text-2xl font-bold text-red-400">{currentAnalysis.damageInventory.treesOnPowerlines.count}</div>
                              <div className="text-sm text-red-300 font-bold">EMERGENCY: On Power Lines</div>
                            </div>
                          )}
                          
                          {currentAnalysis.damageInventory.treesBlockingRoads.count > 0 && (
                            <div className="bg-yellow-900/40 border border-yellow-500/50 rounded-lg p-3">
                              <div className="text-2xl font-bold text-yellow-400">{currentAnalysis.damageInventory.treesBlockingRoads.count}</div>
                              <div className="text-sm text-yellow-300/70">Trees Blocking Roads</div>
                            </div>
                          )}
                          
                          {currentAnalysis.damageInventory.roofsDamaged > 0 && (
                            <div className="bg-purple-900/40 rounded-lg p-3">
                              <div className="text-2xl font-bold text-purple-400">{currentAnalysis.damageInventory.roofsDamaged}</div>
                              <div className="text-sm text-purple-300/70">Roofs Damaged</div>
                            </div>
                          )}
                          
                          {currentAnalysis.damageInventory.vehiclesDamaged > 0 && (
                            <div className="bg-blue-900/40 rounded-lg p-3">
                              <div className="text-2xl font-bold text-blue-400">{currentAnalysis.damageInventory.vehiclesDamaged}</div>
                              <div className="text-sm text-blue-300/70">Vehicles Damaged</div>
                            </div>
                          )}
                          
                          {currentAnalysis.damageInventory.windowsBroken > 0 && (
                            <div className="bg-slate-800/60 rounded-lg p-3">
                              <div className="text-2xl font-bold text-slate-300">{currentAnalysis.damageInventory.windowsBroken}</div>
                              <div className="text-sm text-slate-400/70">Windows Broken</div>
                            </div>
                          )}
                        </div>
                      </Card>
                    )}

                    {/* Individual Damage Detections */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-fuchsia-300">Damage Detections</h3>
                      {currentAnalysis.detections.map((detection, idx) => (
                        <Card key={idx} className="bg-slate-900/60 border-fuchsia-500/30 p-4 hover:border-fuchsia-400/50 transition-all" data-testid={`detection-${idx}`}>
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <span className={`px-2 py-1 rounded text-xs font-bold ${getSeverityColor(detection.severity)}`}>
                                {detection.severity.toUpperCase()}
                              </span>
                              <span className="font-semibold text-fuchsia-200">
                                {detection.alertType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-cyan-300">{detection.confidence}% confident</span>
                            </div>
                          </div>
                          
                          <p className="text-sm text-fuchsia-300/80 mb-3">{detection.description}</p>
                          
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-fuchsia-300/60">Urgency:</span>
                              <span className={`ml-2 font-medium ${getUrgencyColor(detection.urgencyLevel)}`}>
                                {detection.urgencyLevel.toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <span className="text-fuchsia-300/60">Lead Priority:</span>
                              <span className="ml-2 font-medium text-green-400">{detection.leadPriority}</span>
                            </div>
                          </div>
                          
                          {detection.estimatedCost && (
                            <div className="mt-3 pt-3 border-t border-fuchsia-500/20">
                              <span className="text-green-400 font-semibold">
                                Est. Cost: {formatCurrency(detection.estimatedCost.min)} - {formatCurrency(detection.estimatedCost.max)}
                              </span>
                            </div>
                          )}
                          
                          {detection.contractorTypes && detection.contractorTypes.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {detection.contractorTypes.map((type, i) => (
                                <span key={i} className="px-2 py-0.5 bg-cyan-500/20 text-cyan-300 rounded text-xs">
                                  {type}
                                </span>
                              ))}
                            </div>
                          )}
                          
                          {detection.safetyHazards && detection.safetyHazards.length > 0 && (
                            <div className="mt-2 flex items-start gap-2 text-red-300 text-xs">
                              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                              <span>{detection.safetyHazards.join(', ')}</span>
                            </div>
                          )}
                        </Card>
                      ))}
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-4">
                      <Button className="bg-green-600 hover:bg-green-700" data-testid="button-generate-report">
                        <FileText className="w-4 h-4 mr-2" />
                        Generate Report
                      </Button>
                      <Button className="bg-cyan-600 hover:bg-cyan-700" data-testid="button-share-analysis">
                        <Share2 className="w-4 h-4 mr-2" />
                        Share Analysis
                      </Button>
                      <Button variant="outline" className="border-fuchsia-500/50 text-fuchsia-300" data-testid="button-contact-homeowner">
                        <Phone className="w-4 h-4 mr-2" />
                        Contact Homeowner
                      </Button>
                      <Button variant="outline" className="border-cyan-500/50 text-cyan-300" data-testid="button-assign-crew">
                        <Users className="w-4 h-4 mr-2" />
                        Assign Crew
                      </Button>
                    </div>
                  </>
                ) : (
                  /* Empty State */
                  <Card className="bg-slate-900/40 border-fuchsia-500/20 p-12 text-center">
                    <div className="w-24 h-24 rounded-full bg-fuchsia-500/10 flex items-center justify-center mx-auto mb-6">
                      <Image className="w-12 h-12 text-fuchsia-400/50" />
                    </div>
                    <h3 className="text-xl font-semibold text-fuchsia-300/70 mb-2">No Analysis Yet</h3>
                    <p className="text-fuchsia-300/50 max-w-sm mx-auto">
                      Upload or capture damage photos to get instant AI-powered analysis with severity ratings, cost estimates, and contractor recommendations.
                    </p>
                    
                    {/* Feature Highlights */}
                    <div className="grid grid-cols-2 gap-4 mt-8 text-left">
                      <div className="flex items-start gap-3">
                        <Zap className="w-5 h-5 text-fuchsia-400" />
                        <div>
                          <div className="text-sm font-medium text-fuchsia-300">Instant Detection</div>
                          <div className="text-xs text-fuchsia-300/50">AI analyzes in seconds</div>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <DollarSign className="w-5 h-5 text-green-400" />
                        <div>
                          <div className="text-sm font-medium text-green-300">Cost Estimates</div>
                          <div className="text-xs text-green-300/50">Repair cost ranges</div>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Shield className="w-5 h-5 text-red-400" />
                        <div>
                          <div className="text-sm font-medium text-red-300">Safety Alerts</div>
                          <div className="text-xs text-red-300/50">Hazard identification</div>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Users className="w-5 h-5 text-cyan-400" />
                        <div>
                          <div className="text-sm font-medium text-cyan-300">Contractor Match</div>
                          <div className="text-xs text-cyan-300/50">Specialization needed</div>
                        </div>
                      </div>
                    </div>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* HISTORY TAB */}
          <TabsContent value="history" className="mt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-cyan-300">Recent Analyses</h3>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => refetchAnalyses()}
                  className="border-cyan-500/50 text-cyan-300"
                  data-testid="button-refresh-history"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
              
              {pastAnalyses?.analyses && pastAnalyses.analyses.length > 0 ? (
                <div className="grid gap-4">
                  {pastAnalyses.analyses.map((analysis: any) => (
                    <Card 
                      key={analysis.id} 
                      className="bg-slate-900/60 border-cyan-500/30 p-4 hover:border-cyan-400/50 transition-all cursor-pointer"
                      onClick={() => setCurrentAnalysis(analysis)}
                      data-testid={`history-item-${analysis.id}`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-cyan-200">
                            {analysis.metadata?.originalFilename || 'Analysis'}
                          </div>
                          <div className="text-sm text-cyan-300/60">
                            {new Date(analysis.analysisTimestamp).toLocaleString()} • {analysis.detections?.length || 0} detections
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-cyan-400" />
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="bg-slate-900/40 border-cyan-500/20 p-12 text-center">
                  <FileText className="w-12 h-12 text-cyan-400/30 mx-auto mb-4" />
                  <p className="text-cyan-300/50">No analysis history yet. Upload images to get started.</p>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* SATELLITE IMAGERY TAB */}
          <TabsContent value="satellite" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column - Controls */}
              <div className="space-y-6">
                <Card className="bg-gradient-to-br from-slate-900/80 to-emerald-950/30 border-emerald-500/40 p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                      <Satellite className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-emerald-300">EOS Satellite Analysis</h3>
                      <p className="text-sm text-emerald-300/60">Before/After Storm Damage Detection</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* Location Inputs */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-emerald-300 mb-2">Latitude</label>
                        <Input
                          placeholder="25.7617"
                          value={satelliteLat}
                          onChange={(e) => setSatelliteLat(e.target.value)}
                          className="bg-slate-900/60 border-emerald-500/30 text-white placeholder:text-emerald-300/40"
                          data-testid="input-satellite-lat"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-emerald-300 mb-2">Longitude</label>
                        <Input
                          placeholder="-80.1918"
                          value={satelliteLon}
                          onChange={(e) => setSatelliteLon(e.target.value)}
                          className="bg-slate-900/60 border-emerald-500/30 text-white placeholder:text-emerald-300/40"
                          data-testid="input-satellite-lon"
                        />
                      </div>
                    </div>

                    <Button 
                      variant="outline" 
                      className="w-full border-emerald-500/50 text-emerald-300 hover:bg-emerald-500/20"
                      onClick={useCurrentLocation}
                      data-testid="button-use-location"
                    >
                      <MapPin className="w-4 h-4 mr-2" />
                      Use Current Location
                    </Button>

                    {/* Storm Date */}
                    <div>
                      <label className="block text-sm font-medium text-emerald-300 mb-2">Storm Date</label>
                      <Input
                        type="date"
                        value={stormDate}
                        onChange={(e) => setStormDate(e.target.value)}
                        className="bg-slate-900/60 border-emerald-500/30 text-white"
                        data-testid="input-storm-date"
                      />
                    </div>

                    {/* Storm Type */}
                    <div>
                      <label className="block text-sm font-medium text-emerald-300 mb-2">Storm Type</label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: 'hurricane', label: 'Hurricane', icon: Globe },
                          { id: 'tornado', label: 'Tornado', icon: TrendingDown },
                          { id: 'wildfire', label: 'Wildfire', icon: Flame },
                          { id: 'flood', label: 'Flood', icon: Droplets },
                          { id: 'hail', label: 'Hail', icon: Layers },
                          { id: 'other', label: 'Other', icon: AlertTriangle }
                        ].map(type => (
                          <button
                            key={type.id}
                            onClick={() => setStormType(type.id)}
                            className={`p-3 rounded-lg border text-center transition-all ${
                              stormType === type.id 
                                ? 'bg-emerald-600 border-emerald-400 text-white' 
                                : 'bg-slate-900/40 border-emerald-500/30 text-emerald-300/70 hover:border-emerald-400/50'
                            }`}
                            data-testid={`button-storm-type-${type.id}`}
                          >
                            <type.icon className="w-5 h-5 mx-auto mb-1" />
                            <span className="text-xs">{type.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Analyze Button */}
                    <Button 
                      onClick={analyzeSatelliteDamage}
                      disabled={isAnalyzingSatellite || !satelliteLat || !satelliteLon}
                      className="w-full bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 py-6 text-lg font-bold"
                      data-testid="button-analyze-satellite"
                    >
                      {isAnalyzingSatellite ? (
                        <>
                          <RefreshCw className="w-6 h-6 mr-3 animate-spin" />
                          Analyzing Satellite Data...
                        </>
                      ) : (
                        <>
                          <Satellite className="w-6 h-6 mr-3" />
                          Analyze Storm Damage
                        </>
                      )}
                    </Button>
                  </div>
                </Card>

                {/* Satellite Indices Info */}
                <Card className="bg-slate-900/40 border-emerald-500/20 p-4">
                  <h4 className="text-sm font-semibold text-emerald-300 mb-3">Detection Indices Used:</h4>
                  <div className="space-y-2 text-xs text-emerald-300/70">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                      <span><strong>NDVI</strong> - Vegetation health & storm damage</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-orange-500" />
                      <span><strong>NBR</strong> - Burn severity for wildfires</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500" />
                      <span><strong>NDWI</strong> - Flood extent detection</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-purple-500" />
                      <span><strong>Change Detection</strong> - Structural damage</span>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Right Column - Results */}
              <div className="space-y-6">
                {satelliteAnalysis ? (
                  <>
                    {/* Before/After Images */}
                    <Card className="bg-slate-900/60 border-emerald-500/30 p-4">
                      <h4 className="text-lg font-semibold text-emerald-300 mb-4">Satellite Imagery Comparison</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-xs text-emerald-300/60 mb-2 text-center">BEFORE Storm</div>
                          {satelliteAnalysis.beforeImage ? (
                            <img 
                              src={satelliteAnalysis.beforeImage.url} 
                              alt="Before storm" 
                              className="w-full h-40 object-cover rounded-lg border border-emerald-500/30"
                              onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x200?text=Before+Image'; }}
                            />
                          ) : (
                            <div className="w-full h-40 bg-slate-800 rounded-lg flex items-center justify-center text-emerald-300/40">
                              No image available
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="text-xs text-emerald-300/60 mb-2 text-center">AFTER Storm</div>
                          {satelliteAnalysis.afterImage ? (
                            <img 
                              src={satelliteAnalysis.afterImage.url} 
                              alt="After storm" 
                              className="w-full h-40 object-cover rounded-lg border border-red-500/30"
                              onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x200?text=After+Image'; }}
                            />
                          ) : (
                            <div className="w-full h-40 bg-slate-800 rounded-lg flex items-center justify-center text-emerald-300/40">
                              No image available
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>

                    {/* Damage Indicators */}
                    <Card className="bg-slate-900/60 border-emerald-500/30 p-4">
                      <h4 className="text-lg font-semibold text-emerald-300 mb-4">Damage Indicators</h4>
                      <div className="space-y-4">
                        {[
                          { label: 'Vegetation Loss', value: satelliteAnalysis.damageIndicators.vegetationLoss, color: 'bg-green-500', icon: TrendingDown },
                          { label: 'Burn Severity', value: satelliteAnalysis.damageIndicators.burnSeverity, color: 'bg-orange-500', icon: Flame },
                          { label: 'Flood Extent', value: satelliteAnalysis.damageIndicators.floodExtent, color: 'bg-blue-500', icon: Droplets },
                          { label: 'Structural Change', value: satelliteAnalysis.damageIndicators.structuralChange, color: 'bg-purple-500', icon: Layers }
                        ].map(indicator => (
                          <div key={indicator.label}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm text-emerald-300/80 flex items-center gap-2">
                                <indicator.icon className="w-4 h-4" />
                                {indicator.label}
                              </span>
                              <span className={`text-sm font-bold ${indicator.value > 30 ? 'text-red-400' : indicator.value > 15 ? 'text-yellow-400' : 'text-green-400'}`}>
                                {indicator.value.toFixed(1)}%
                              </span>
                            </div>
                            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${indicator.color} transition-all`}
                                style={{ width: `${Math.min(indicator.value, 100)}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>

                    {/* Analysis Report */}
                    <Card className={`p-4 ${satelliteAnalysis.changeDetected ? 'bg-red-950/40 border-red-500/40' : 'bg-green-950/40 border-green-500/40'}`}>
                      <div className="flex items-center gap-3 mb-4">
                        {satelliteAnalysis.changeDetected ? (
                          <AlertTriangle className="w-8 h-8 text-red-400" />
                        ) : (
                          <CheckCircle2 className="w-8 h-8 text-green-400" />
                        )}
                        <div>
                          <h4 className={`text-lg font-bold ${satelliteAnalysis.changeDetected ? 'text-red-300' : 'text-green-300'}`}>
                            {satelliteAnalysis.changeDetected ? 'DAMAGE DETECTED' : 'No Significant Damage'}
                          </h4>
                          <p className={`text-sm ${satelliteAnalysis.changeDetected ? 'text-red-300/60' : 'text-green-300/60'}`}>
                            Based on satellite imagery analysis
                          </p>
                        </div>
                      </div>
                      <div className="bg-slate-900/60 rounded-lg p-4">
                        <pre className="text-xs text-emerald-300/80 whitespace-pre-wrap font-mono">
                          {satelliteAnalysis.analysis}
                        </pre>
                      </div>
                    </Card>

                    {/* Action Buttons */}
                    <div className="flex gap-4">
                      <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700" data-testid="button-export-satellite">
                        <Download className="w-4 h-4 mr-2" />
                        Export Report
                      </Button>
                      <Button variant="outline" className="flex-1 border-emerald-500/50 text-emerald-300" data-testid="button-dispatch-satellite">
                        <Send className="w-4 h-4 mr-2" />
                        Dispatch Crew
                      </Button>
                    </div>
                  </>
                ) : (
                  <Card className="bg-slate-900/40 border-emerald-500/20 p-12 text-center">
                    <Satellite className="w-16 h-16 text-emerald-400/30 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-emerald-300 mb-2">Satellite Storm Analysis</h3>
                    <p className="text-emerald-300/50 mb-6">
                      Enter coordinates and storm date to analyze satellite imagery for damage assessment.
                    </p>
                    <div className="grid grid-cols-2 gap-4 text-left max-w-md mx-auto">
                      <div className="flex items-start gap-3">
                        <Globe className="w-5 h-5 text-emerald-400 mt-0.5" />
                        <div>
                          <div className="text-sm font-medium text-emerald-300">Before/After</div>
                          <div className="text-xs text-emerald-300/50">Compare imagery pre & post storm</div>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <TrendingDown className="w-5 h-5 text-red-400 mt-0.5" />
                        <div>
                          <div className="text-sm font-medium text-red-300">Damage Detection</div>
                          <div className="text-xs text-red-300/50">AI-powered change analysis</div>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Layers className="w-5 h-5 text-blue-400 mt-0.5" />
                        <div>
                          <div className="text-sm font-medium text-blue-300">Multiple Indices</div>
                          <div className="text-xs text-blue-300/50">NDVI, NBR, NDWI analysis</div>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <DollarSign className="w-5 h-5 text-green-400 mt-0.5" />
                        <div>
                          <div className="text-sm font-medium text-green-300">Claim Support</div>
                          <div className="text-xs text-green-300/50">Evidence for insurance</div>
                        </div>
                      </div>
                    </div>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      <ModuleAIAssistant moduleName="AI Damage Detection" />
    </div>
  );
}
