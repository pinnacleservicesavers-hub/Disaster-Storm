import { useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Car, Upload, Video, Camera, Wrench, AlertTriangle, ChevronRight,
  Loader2, DollarSign, CheckCircle, Info, X, Shield, Gauge,
  FileVideo, Image as ImageIcon, Truck, Settings, Volume2, Eye,
  MapPin, Star, Phone, Clock, Hammer, ExternalLink, Activity
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import TopNav from '@/components/TopNav';
import ModuleVoiceGuide from '@/components/ModuleVoiceGuide';

interface DiagnosticResult {
  vehicleSummary: string;
  possibleCauses: Array<{
    label: string;
    description: string;
    likelihood: 'high' | 'medium' | 'low';
    severity: 'critical' | 'significant' | 'moderate' | 'minor';
    estimatedCostMin: number;
    estimatedCostMax: number;
    repairDetails: string;
    canDIY?: boolean;
    diyDifficulty?: string;
  }>;
  immediateActions: string[];
  warrantyNote: string;
  safetyWarning: string;
  overallAssessment: string;
  questionsToAsk: string[];
  audioFindings?: string;
  visualFindings?: string;
  maintenanceTips?: string[];
  urgencyLevel?: string;
  audioMetadata?: {
    duration: number;
    hasAudio: boolean;
    audioDescription: string;
    noiseCharacteristics: string[];
  };
  framesAnalyzed?: number;
  pricingEngineEstimate?: {
    partsNeeded: any[];
    grandTotalMin: number;
    grandTotalMax: number;
    diagnosticFee: number;
    recommendations: string[];
  };
}

interface NearbyShop {
  name: string;
  address: string;
  rating: number;
  totalRatings: number;
  isOpen?: boolean;
  distance?: string;
  specialties: string[];
  placeId: string;
}

const VEHICLE_TYPES = [
  { value: 'car', label: 'Car' },
  { value: 'truck', label: 'Truck' },
  { value: 'suv', label: 'SUV' },
  { value: 'van', label: 'Van' },
  { value: 'minivan', label: 'Minivan' },
];

const COMMON_MAKES = [
  'Ford', 'Chevrolet', 'Toyota', 'Honda', 'Ram', 'GMC', 'Jeep', 'Nissan',
  'Hyundai', 'Kia', 'Subaru', 'Dodge', 'BMW', 'Mercedes-Benz', 'Audi',
  'Lexus', 'Mazda', 'Volkswagen', 'Buick', 'Cadillac', 'Chrysler',
  'Acura', 'Infiniti', 'Lincoln', 'Volvo', 'Tesla', 'Other'
];

const REPAIR_TYPES = [
  { value: 'mechanical', label: 'Mechanical (engine, transmission, brakes)' },
  { value: 'body', label: 'Body Repair (dents, collision, rust)' },
  { value: 'paint', label: 'Paint (full paint, touch-up)' },
  { value: 'electrical', label: 'Electrical (lights, wiring, sensors)' },
  { value: 'tires_wheels', label: 'Tires & Wheels' },
  { value: 'diagnostic', label: 'Diagnostic Only (check engine light, noise)' },
  { value: 'maintenance', label: 'Maintenance (oil, brakes, tune-up)' },
  { value: 'other', label: 'Other' },
];

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 35 }, (_, i) => CURRENT_YEAR - i);

export default function AutoRepairDiag() {
  const [vehicleType, setVehicleType] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [mileage, setMileage] = useState('');
  const [vin, setVin] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [repairType, setRepairType] = useState('');
  const [location, setLocation] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState('');
  const [diagnosticResult, setDiagnosticResult] = useState<DiagnosticResult | null>(null);
  const [nearbyShops, setNearbyShops] = useState<{ shops: NearbyShop[]; searchLocation: string } | null>(null);
  const [vinLookupLoading, setVinLookupLoading] = useState(false);
  const [vinError, setVinError] = useState('');
  const [diagError, setDiagError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(f =>
      f.type.startsWith('video/') || f.type.startsWith('image/')
    );
    if (validFiles.length === 0) return;
    setUploadedFiles(prev => [...prev, ...validFiles]);
    const newUrls = validFiles.map(file => URL.createObjectURL(file));
    setPreviewUrls(prev => [...prev, ...newUrls]);
  };

  const removeFile = (index: number) => {
    URL.revokeObjectURL(previewUrls[index]);
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleVinLookup = async () => {
    if (!vin || vin.length !== 17) {
      setVinError('VIN must be exactly 17 characters');
      return;
    }
    setVinLookupLoading(true);
    setVinError('');
    try {
      const response = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/decodevinvalues/${vin}?format=json`);
      const data = await response.json();
      if (data.Results && data.Results[0]) {
        const result = data.Results[0];
        if (result.Make) setMake(result.Make);
        if (result.Model) setModel(result.Model);
        if (result.ModelYear) setYear(result.ModelYear);
      }
    } catch {
      setVinError('Could not decode VIN. Please enter vehicle info manually.');
    } finally {
      setVinLookupLoading(false);
    }
  };

  const handleDiagnose = async () => {
    if (!symptoms && uploadedFiles.length === 0) return;

    setIsAnalyzing(true);
    setDiagnosticResult(null);
    setNearbyShops(null);
    setDiagError('');

    try {
      const hasVideo = uploadedFiles.some(f => f.type.startsWith('video/'));

      if (hasVideo || uploadedFiles.length > 0) {
        setAnalysisStep('Uploading media to server...');
        const formData = new FormData();

        for (const file of uploadedFiles) {
          formData.append('media', file);
        }

        formData.append('vehicle', JSON.stringify({
          type: vehicleType,
          make,
          model,
          year: year ? parseInt(year) : undefined,
          mileage: mileage ? parseInt(mileage.replace(/,/g, '')) : undefined,
          vin: vin || undefined,
        }));
        formData.append('symptoms', symptoms);
        formData.append('repairType', repairType);
        if (location) formData.append('location', location);

        if (hasVideo) {
          setAnalysisStep('Extracting audio & video frames with FFmpeg...');
        } else {
          setAnalysisStep('Processing images...');
        }

        const response = await fetch('/api/workhub/auto-repair-diagnose-v2', {
          method: 'POST',
          body: formData,
        });

        setAnalysisStep('AI mechanic analyzing evidence...');

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || 'Diagnosis failed');
        }

        const data = await response.json();

        if (data.ok) {
          setDiagnosticResult(data.diagnostic);
          if (data.nearbyShops) setNearbyShops(data.nearbyShops);
        } else {
          throw new Error(data.error || 'Diagnosis failed');
        }
      } else {
        setAnalysisStep('AI mechanic analyzing symptoms...');
        const response = await fetch('/api/workhub/auto-repair-diagnose-v2-json', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            vehicle: {
              type: vehicleType, make, model,
              year: year ? parseInt(year) : undefined,
              mileage: mileage ? parseInt(mileage.replace(/,/g, '')) : undefined,
              vin: vin || undefined,
            },
            symptoms,
            repairType,
            location: location || undefined,
          }),
        });

        if (!response.ok) throw new Error('Diagnosis failed');
        const data = await response.json();
        if (data.ok) {
          setDiagnosticResult(data.diagnostic);
          if (data.nearbyShops) setNearbyShops(data.nearbyShops);
        } else {
          throw new Error(data.error || 'Diagnosis failed');
        }
      }
    } catch (error: any) {
      console.error('Diagnosis error:', error);
      setDiagError(error?.message || 'Something went wrong. Please try again.');
    } finally {
      setIsAnalyzing(false);
      setAnalysisStep('');
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'significant': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
      case 'moderate': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      default: return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
    }
  };

  const getLikelihoodColor = (likelihood: string) => {
    switch (likelihood) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      default: return 'bg-blue-500';
    }
  };

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case 'immediate': return <Badge className="bg-red-600 text-white">Immediate Attention</Badge>;
      case 'soon': return <Badge className="bg-orange-500 text-white">Address Soon</Badge>;
      case 'scheduled': return <Badge className="bg-blue-500 text-white">Schedule Repair</Badge>;
      case 'monitor': return <Badge className="bg-green-500 text-white">Monitor</Badge>;
      default: return null;
    }
  };

  const canSubmit = (make || vin) && (symptoms || uploadedFiles.length > 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      <TopNav />

      <div className="bg-gradient-to-r from-blue-700 to-indigo-700 text-white py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-2 text-blue-200 text-sm mb-2">
            <Link to="/workhub" className="hover:text-white">WorkHub</Link>
            <ChevronRight className="w-4 h-4" />
            <span>Auto Repair AI Diagnostic</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
                <Car className="w-10 h-10" />
                Auto Repair AI Diagnostic
              </h1>
              <p className="text-blue-100 text-lg max-w-2xl">
                Upload a video or photos of your vehicle issue. Our AI extracts audio patterns, analyzes visual evidence,
                diagnoses possible problems, estimates repair costs, and finds mechanics near you.
              </p>
            </div>
          </div>
          <div className="flex gap-3 mt-4 flex-wrap">
            <Badge className="bg-white/20 text-white border-white/30 text-xs">FFmpeg Audio Extraction</Badge>
            <Badge className="bg-white/20 text-white border-white/30 text-xs">GPT-4o Vision Analysis</Badge>
            <Badge className="bg-white/20 text-white border-white/30 text-xs">20+ Parts Cost Database</Badge>
            <Badge className="bg-white/20 text-white border-white/30 text-xs">Mechanic Locator</Badge>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <Card className="border-2 border-blue-200 dark:border-blue-800">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Truck className="w-5 h-5 text-blue-600" />
                  Vehicle Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>VIN Number (optional - auto-fills vehicle details)</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      placeholder="Enter 17-character VIN"
                      value={vin}
                      onChange={(e) => { setVin(e.target.value.toUpperCase()); setVinError(''); }}
                      maxLength={17}
                      className="font-mono uppercase"
                    />
                    <Button
                      variant="outline"
                      onClick={handleVinLookup}
                      disabled={vinLookupLoading || vin.length !== 17}
                      className="shrink-0"
                    >
                      {vinLookupLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Decode'}
                    </Button>
                  </div>
                  {vinError && <p className="text-sm text-red-500 mt-1">{vinError}</p>}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Vehicle Type</Label>
                    <Select value={vehicleType} onValueChange={setVehicleType}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {VEHICLE_TYPES.map(t => (
                          <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Year</Label>
                    <Select value={year} onValueChange={setYear}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select year" />
                      </SelectTrigger>
                      <SelectContent>
                        {YEARS.map(y => (
                          <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Make *</Label>
                    <Select value={make} onValueChange={setMake}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select make" />
                      </SelectTrigger>
                      <SelectContent>
                        {COMMON_MAKES.map(m => (
                          <SelectItem key={m} value={m}>{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Model</Label>
                    <Input
                      placeholder="e.g. Bronco, Camry, F-150"
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Mileage</Label>
                    <Input
                      placeholder="e.g. 45,000"
                      value={mileage}
                      onChange={(e) => setMileage(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Repair Type</Label>
                    <Select value={repairType} onValueChange={setRepairType}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {REPAIR_TYPES.map(r => (
                          <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Your Location (for nearby mechanic search)</Label>
                  <Input
                    placeholder="City, State or ZIP code"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">We'll find certified shops near you</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-orange-200 dark:border-orange-800">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                  What's Going On?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Describe what's happening with your vehicle. For example:&#10;&#10;- Ticking sound when I accelerate&#10;- Jerking when going downhill&#10;- Check engine light is on&#10;- Brakes feel spongy&#10;- Car pulls to the left&#10;- Strange smell from under the hood&#10;&#10;The more detail you give, the better the diagnosis!"
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  className="min-h-[180px]"
                />
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-2 border-purple-200 dark:border-purple-800">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Video className="w-5 h-5 text-purple-600" />
                  Upload Video or Photos
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Upload a video to get both visual + audio analysis. Our AI uses FFmpeg to extract audio patterns
                  (knocking, squealing, ticking) and video frames for visual inspection.
                </p>
              </CardHeader>
              <CardContent>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*,image/*"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  className="w-full h-32 border-dashed border-2 flex flex-col gap-2 hover:bg-purple-50 dark:hover:bg-purple-950/20"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-8 h-8 text-purple-500" />
                  <span className="font-semibold text-purple-700 dark:text-purple-300">
                    Click to upload video or photos
                  </span>
                  <span className="text-xs text-muted-foreground">
                    MP4, MOV, WebM, JPG, PNG - up to 50MB
                  </span>
                </Button>

                {uploadedFiles.length > 0 && (
                  <div className="mt-4 space-y-3">
                    {uploadedFiles.map((file, idx) => (
                      <div key={idx} className="relative rounded-lg overflow-hidden border bg-slate-50 dark:bg-slate-800">
                        <div className="flex items-center gap-3 p-3">
                          {file.type.startsWith('video/') ? (
                            <FileVideo className="w-8 h-8 text-purple-500 shrink-0" />
                          ) : (
                            <ImageIcon className="w-8 h-8 text-blue-500 shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{file.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {(file.size / 1024 / 1024).toFixed(1)} MB
                              {file.type.startsWith('video/') && (
                                <span className="ml-2 text-purple-600">
                                  <Volume2 className="w-3 h-3 inline" /> Audio will be analyzed
                                </span>
                              )}
                            </p>
                          </div>
                          {file.type.startsWith('video/') ? (
                            <video src={previewUrls[idx]} className="w-24 h-16 object-cover rounded" muted />
                          ) : (
                            <img src={previewUrls[idx]} className="w-24 h-16 object-cover rounded" alt="preview" />
                          )}
                          <Button variant="ghost" size="sm" onClick={() => removeFile(idx)} className="shrink-0">
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                    <div className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                      <p className="font-semibold">Tips for best results:</p>
                      <ul className="list-disc pl-4 space-y-0.5">
                        <li><strong>Video is best</strong> - we extract audio to analyze engine sounds, knocking, squealing</li>
                        <li>Record with the hood open if the issue is under the hood</li>
                        <li>Rev the engine if the noise changes with RPM</li>
                        <li>Show any warning lights on the dashboard</li>
                        <li>Film any visible leaks, damage, or wear</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button
              size="lg"
              className="w-full h-14 text-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              onClick={handleDiagnose}
              disabled={!canSubmit || isAnalyzing}
            >
              {isAnalyzing ? (
                <div className="flex items-center gap-3">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>{analysisStep || 'Analyzing...'}</span>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Wrench className="w-5 h-5" />
                  <span>Get AI Diagnosis</span>
                </div>
              )}
            </Button>
            {!canSubmit && (
              <p className="text-sm text-center text-muted-foreground">
                Please enter your vehicle make (or VIN) and describe the issue or upload a video/photo
              </p>
            )}
            {diagError && (
              <Card className="border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/20">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-sm">{diagError}</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {diagnosticResult && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Settings className="w-6 h-6 text-blue-600 animate-spin" style={{ animationDuration: '3s' }} />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">AI Diagnostic Report</h2>
              </div>
              <div className="flex items-center gap-2">
                {diagnosticResult.urgencyLevel && getUrgencyBadge(diagnosticResult.urgencyLevel)}
                {diagnosticResult.framesAnalyzed !== undefined && diagnosticResult.framesAnalyzed > 0 && (
                  <Badge variant="outline" className="text-xs">
                    <Eye className="w-3 h-3 mr-1" /> {diagnosticResult.framesAnalyzed} frames analyzed
                  </Badge>
                )}
                {diagnosticResult.audioMetadata?.hasAudio && (
                  <Badge variant="outline" className="text-xs text-purple-600">
                    <Volume2 className="w-3 h-3 mr-1" /> Audio analyzed
                  </Badge>
                )}
              </div>
            </div>

            {diagnosticResult.vehicleSummary && (
              <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <Car className="w-5 h-5 text-blue-600 mt-1 shrink-0" />
                    <p className="text-blue-900 dark:text-blue-100">{diagnosticResult.vehicleSummary}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gauge className="w-5 h-5 text-orange-500" />
                  Overall Assessment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 dark:text-gray-300">{diagnosticResult.overallAssessment}</p>
              </CardContent>
            </Card>

            {diagnosticResult.safetyWarning && (
              <Card className="border-red-300 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-red-600 mt-1 shrink-0" />
                    <div>
                      <p className="font-semibold text-red-800 dark:text-red-300">Safety Warning</p>
                      <p className="text-red-700 dark:text-red-400 mt-1">{diagnosticResult.safetyWarning}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Audio & Visual Findings */}
            {(diagnosticResult.audioFindings || diagnosticResult.visualFindings) && (
              <div className="grid md:grid-cols-2 gap-4">
                {diagnosticResult.audioFindings && (
                  <Card className="border-purple-200 dark:border-purple-800">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Volume2 className="w-5 h-5 text-purple-600" />
                        Audio Analysis
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{diagnosticResult.audioFindings}</p>
                      {diagnosticResult.audioMetadata?.noiseCharacteristics && diagnosticResult.audioMetadata.noiseCharacteristics.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {diagnosticResult.audioMetadata.noiseCharacteristics.map((c, i) => (
                            <Badge key={i} variant="outline" className="text-xs capitalize">
                              {c.replace(/_/g, ' ')}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
                {diagnosticResult.visualFindings && (
                  <Card className="border-blue-200 dark:border-blue-800">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Eye className="w-5 h-5 text-blue-600" />
                        Visual Inspection
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{diagnosticResult.visualFindings}</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Possible Causes & Repair Estimates</h3>

            <div className="space-y-4">
              {diagnosticResult.possibleCauses.map((cause, idx) => (
                <Card key={idx} className="border-gray-200 dark:border-gray-700">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${getLikelihoodColor(cause.likelihood)}`} />
                        <h4 className="font-bold text-lg">{cause.label}</h4>
                      </div>
                      <div className="flex gap-2 shrink-0 flex-wrap justify-end">
                        <Badge className={getSeverityColor(cause.severity)}>
                          {cause.severity}
                        </Badge>
                        <Badge variant="outline" className="capitalize">
                          {cause.likelihood} likelihood
                        </Badge>
                        {cause.canDIY && (
                          <Badge variant="outline" className="text-green-600 border-green-300 capitalize">
                            DIY: {cause.diyDifficulty?.replace('_', ' ') || 'possible'}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 mb-3">{cause.description}</p>
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="w-4 h-4 text-green-600" />
                      <span className="font-semibold text-green-700 dark:text-green-400">
                        ${cause.estimatedCostMin.toLocaleString()} - ${cause.estimatedCostMax.toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{cause.repairDetails}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Parts Pricing Engine Results */}
            {diagnosticResult.pricingEngineEstimate && diagnosticResult.pricingEngineEstimate.partsNeeded.length > 0 && (
              <Card className="border-green-200 dark:border-green-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    Parts & Labor Price Comparison
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {diagnosticResult.pricingEngineEstimate.partsNeeded.map((part: any, idx: number) => (
                    <div key={idx} className="border rounded-lg p-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">{part.partName}</span>
                        <span className="text-sm text-green-600 font-medium">
                          Best: ${(part.cheapestPrice / 100).toFixed(0)} at {part.cheapestRetailer}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {part.prices?.slice(0, 4).map((p: any, pi: number) => (
                          <a
                            key={pi}
                            href={p.affiliateUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs px-2 py-1 rounded border hover:bg-blue-50 dark:hover:bg-blue-950/30 flex items-center gap-1"
                          >
                            {p.retailer}: ${(p.price / 100).toFixed(0)}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Labor: ${(part.laborCost.min / 100).toFixed(0)}-${(part.laborCost.max / 100).toFixed(0)} ({part.laborHours}hr)
                      </p>
                    </div>
                  ))}
                  <div className="bg-green-50 dark:bg-green-950/20 p-3 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">Estimated Total Range</span>
                      <span className="font-bold text-green-700 dark:text-green-300 text-lg">
                        ${(diagnosticResult.pricingEngineEstimate.grandTotalMin / 100).toFixed(0)} - ${(diagnosticResult.pricingEngineEstimate.grandTotalMax / 100).toFixed(0)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Includes diagnostic fee: ${(diagnosticResult.pricingEngineEstimate.diagnosticFee / 100).toFixed(0)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {diagnosticResult.immediateActions && diagnosticResult.immediateActions.length > 0 && (
              <Card className="border-yellow-200 dark:border-yellow-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-yellow-600" />
                    What To Do Right Now
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {diagnosticResult.immediateActions.map((action, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                        <span>{action}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {diagnosticResult.questionsToAsk && diagnosticResult.questionsToAsk.length > 0 && (
              <Card className="border-indigo-200 dark:border-indigo-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Info className="w-5 h-5 text-indigo-600" />
                    Questions To Ask Your Mechanic
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {diagnosticResult.questionsToAsk.map((q, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="font-bold text-indigo-600 shrink-0">{idx + 1}.</span>
                        <span>{q}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {diagnosticResult.maintenanceTips && diagnosticResult.maintenanceTips.length > 0 && (
              <Card className="border-teal-200 dark:border-teal-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-teal-600" />
                    Preventive Maintenance Tips
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {diagnosticResult.maintenanceTips.map((tip, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Hammer className="w-4 h-4 text-teal-500 mt-0.5 shrink-0" />
                        <span className="text-sm">{tip}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {diagnosticResult.warrantyNote && (
              <Card className="border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-green-600 mt-1 shrink-0" />
                    <div>
                      <p className="font-semibold text-green-800 dark:text-green-300">Warranty Note</p>
                      <p className="text-green-700 dark:text-green-400 mt-1">{diagnosticResult.warrantyNote}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Nearby Mechanic Shops */}
            {nearbyShops && nearbyShops.shops.length > 0 && (
              <Card className="border-2 border-emerald-200 dark:border-emerald-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-emerald-600" />
                    Certified Shops Near You
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">{nearbyShops.searchLocation}</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {nearbyShops.shops.map((shop, idx) => (
                      <div key={idx} className="border rounded-lg p-4 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <h4 className="font-semibold text-base">{shop.name}</h4>
                            <p className="text-sm text-muted-foreground mt-0.5">{shop.address}</p>
                            <div className="flex items-center gap-3 mt-2 flex-wrap">
                              {shop.rating > 0 && (
                                <div className="flex items-center gap-1">
                                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                  <span className="text-sm font-medium">{shop.rating}</span>
                                  <span className="text-xs text-muted-foreground">({shop.totalRatings})</span>
                                </div>
                              )}
                              {shop.distance && (
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <MapPin className="w-3 h-3" /> {shop.distance}
                                </span>
                              )}
                              {shop.isOpen !== undefined && (
                                <Badge variant="outline" className={shop.isOpen ? 'text-green-600 border-green-300' : 'text-red-500 border-red-300'}>
                                  {shop.isOpen ? 'Open Now' : 'Closed'}
                                </Badge>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {shop.specialties.map((s, si) => (
                                <Badge key={si} variant="secondary" className="text-xs">{s}</Badge>
                              ))}
                            </div>
                          </div>
                          <a
                            href={`https://www.google.com/maps/place/?q=place_id:${shop.placeId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shrink-0"
                          >
                            <Button variant="outline" size="sm" className="text-xs">
                              <ExternalLink className="w-3 h-3 mr-1" /> Directions
                            </Button>
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
      <ModuleVoiceGuide moduleName="auto-repair-diag" />
    </div>
  );
}
