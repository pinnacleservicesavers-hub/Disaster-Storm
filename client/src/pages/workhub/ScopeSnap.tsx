import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Camera, Video, Upload, Sparkles, CheckCircle, AlertCircle,
  ChevronRight, Volume2, VolumeX, Loader2, Zap, Eye, Layers,
  Image, FileImage, X, Plus, ArrowRight, Heart, Shield, Wrench,
  DollarSign, Clock, AlertTriangle, Download, TreePine, Home,
  Droplets, Plug, Paintbrush, Car, Hammer, Fence
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import ModuleAIAssistant from '@/components/ModuleAIAssistant';
import { AutonomousAgentBadge } from '@/components/AutonomousAgentBadge';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

const TRADES = [
  { id: 'auto-detect', label: 'Auto-Detect (AI Decides)', icon: Sparkles, color: 'text-violet-600' },
  { id: 'tree', label: 'Tree Services', icon: TreePine, color: 'text-green-600' },
  { id: 'roofing', label: 'Roofing', icon: Home, color: 'text-blue-600' },
  { id: 'hvac', label: 'HVAC', icon: Wrench, color: 'text-orange-600' },
  { id: 'plumbing', label: 'Plumbing', icon: Droplets, color: 'text-cyan-600' },
  { id: 'electrical', label: 'Electrical', icon: Plug, color: 'text-yellow-600' },
  { id: 'painting', label: 'Painting', icon: Paintbrush, color: 'text-pink-600' },
  { id: 'auto', label: 'Auto Repair', icon: Car, color: 'text-red-600' },
  { id: 'flooring', label: 'Flooring', icon: Layers, color: 'text-amber-600' },
  { id: 'fence', label: 'Fencing', icon: Fence, color: 'text-emerald-600' },
  { id: 'general', label: 'General Contractor', icon: Hammer, color: 'text-slate-600' },
  { id: 'concrete', label: 'Concrete', icon: Hammer, color: 'text-gray-600' },
];

interface AnalysisResult {
  summary: string;
  detailedFindings: string;
  identifiedIssues: string[];
  estimatedPriceRange: { min: number; max: number };
  urgencyLevel: string;
  complexity: string;
  estimatedTimeframe: string;
  diyFeasible: boolean;
  diyDifficulty: string;
  materialsNeeded: string[];
  safetyWarning: string;
  recommendedTrades: string[];
  aiConfidence: number;
}

export default function ScopeSnap() {
  const { toast } = useToast();
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const hasPlayedWelcome = useRef(false);
  const voiceEnabledRef = useRef(true);

  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [selectedTrade, setSelectedTrade] = useState('auto-detect');
  const [description, setDescription] = useState('');
  const [analysisProgress, setAnalysisProgress] = useState(0);

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
  };

  const voiceMutation = useMutation({
    mutationFn: async (message: string) => {
      const res = await apiRequest("POST", "/api/closebot/chat", {
        message,
        history: [],
        context: { leadName: "contractor", companyName: "your company", trade: "photo_analysis" },
        enableVoice: true,
      });
      return res.json();
    },
    onSuccess: (data) => {
      if (!voiceEnabledRef.current) return;
      if (data.audioUrl && audioRef.current) {
        setIsPlaying(true);
        audioRef.current.src = data.audioUrl;
        audioRef.current.onended = () => setIsPlaying(false);
        audioRef.current.play().catch(() => setIsPlaying(false));
      }
    },
  });

  const playRachelVoice = (prompt: string) => {
    if (!voiceEnabledRef.current) return;
    stopAudio();
    voiceMutation.mutate(prompt);
  };

  useEffect(() => {
    if (!hasPlayedWelcome.current) {
      hasPlayedWelcome.current = true;
      voiceMutation.mutate("Give a brief, warm 1-sentence welcome to ScopeSnap. You're Rachel, helping them analyze project photos with AI vision across 12 trades — tree, roofing, HVAC, plumbing, electrical, painting, auto repair, flooring, fencing, and more. Mention they can upload images and get instant trade-specific analysis. Keep it super short and natural.");
    }
  }, []);

  const toggleVoice = () => {
    const newEnabled = !isVoiceEnabled;
    setIsVoiceEnabled(newEnabled);
    voiceEnabledRef.current = newEnabled;
    if (!newEnabled) stopAudio();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setUploadedFiles(prev => [...prev, ...files]);
    const newUrls = files.map(file => URL.createObjectURL(file));
    setPreviewUrls(prev => [...prev, ...newUrls]);
    playRachelVoice(`Say a quick 1-sentence note that ${files.length} files were uploaded and they can click Analyze when ready. Keep it natural.`);
  };

  const handleAnalyze = async () => {
    if (uploadedFiles.length === 0) {
      toast({ title: "No files uploaded", description: "Please upload at least one photo or video first.", variant: "destructive" });
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);
    setAnalysisResults(null);
    setAnalysisProgress(10);

    playRachelVoice("Say a quick 1-sentence note that you're running deep AI analysis now — detecting issues, estimating costs, and identifying required trades. Keep it encouraging.");

    try {
      const formData = new FormData();
      for (const file of uploadedFiles.slice(0, 6)) {
        formData.append('media', file);
      }
      const tradeCategory = selectedTrade === 'auto-detect' ? '' : selectedTrade;
      if (tradeCategory) formData.append('category', tradeCategory);
      if (description.trim()) formData.append('description', description.trim());

      setAnalysisProgress(30);

      const response = await fetch('/api/workhub/analyze-v2', {
        method: 'POST',
        body: formData,
      });

      setAnalysisProgress(70);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Server error (${response.status})`);
      }

      setAnalysisProgress(90);

      if (data.ok && data.analysis) {
        const a = data.analysis;
        const results: AnalysisResult = {
          summary: a.summary || 'Analysis complete',
          detailedFindings: a.detailedFindings || '',
          identifiedIssues: a.identifiedIssues || [],
          estimatedPriceRange: a.estimatedPriceRange || { min: 500, max: 5000 },
          urgencyLevel: a.urgencyLevel || 'moderate',
          complexity: a.complexity || 'moderate',
          estimatedTimeframe: a.estimatedTimeframe || '1-3 days',
          diyFeasible: a.diyFeasible ?? false,
          diyDifficulty: a.diyDifficulty || 'professional_only',
          materialsNeeded: a.materialsNeeded || [],
          safetyWarning: a.safetyWarning || '',
          recommendedTrades: a.recommendedTrades || [],
          aiConfidence: a.aiConfidence || 75,
        };

        setAnalysisResults(results);
        setAnalysisProgress(100);

        playRachelVoice(`Analysis complete. ${results.summary}. Estimated cost range: $${results.estimatedPriceRange.min.toLocaleString()} to $${results.estimatedPriceRange.max.toLocaleString()}. Urgency is ${results.urgencyLevel}. ${results.recommendedTrades.length} trades recommended. Keep this summary very brief.`);
      } else {
        throw new Error(data.error || 'Analysis returned no results.');
      }
    } catch (error: any) {
      console.error('Analysis error:', error);
      setAnalysisError(error.message || 'Unable to analyze. Please try again.');
      playRachelVoice("Say a quick 1-sentence apology that there was an error and to try again. Keep it warm.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const urgencyColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'moderate': return 'bg-yellow-500 text-black';
      default: return 'bg-green-500 text-white';
    }
  };

  const complexityLabel = (c: string) => {
    switch (c) {
      case 'expert': return { text: 'Expert Required', color: 'text-red-600 bg-red-50' };
      case 'complex': return { text: 'Complex', color: 'text-orange-600 bg-orange-50' };
      case 'moderate': return { text: 'Moderate', color: 'text-yellow-600 bg-yellow-50' };
      default: return { text: 'Simple', color: 'text-green-600 bg-green-50' };
    }
  };

  const downloadReport = () => {
    if (!analysisResults) return;
    const r = analysisResults;
    const reportText = `SCOPESNAP AI ANALYSIS REPORT
${'='.repeat(50)}
Generated: ${new Date().toLocaleString()}

SUMMARY
${r.summary}

DETAILED FINDINGS
${r.detailedFindings}

IDENTIFIED ISSUES (${r.identifiedIssues.length})
${r.identifiedIssues.map((issue, i) => `${i + 1}. ${issue}`).join('\n')}

ESTIMATED PRICE RANGE
$${r.estimatedPriceRange.min.toLocaleString()} - $${r.estimatedPriceRange.max.toLocaleString()}

URGENCY: ${r.urgencyLevel.toUpperCase()}
COMPLEXITY: ${r.complexity.toUpperCase()}
ESTIMATED TIMEFRAME: ${r.estimatedTimeframe}

RECOMMENDED TRADES
${r.recommendedTrades.map(t => `• ${t}`).join('\n')}

MATERIALS NEEDED
${r.materialsNeeded.map(m => `• ${m}`).join('\n')}

DIY FEASIBLE: ${r.diyFeasible ? 'Yes' : 'No'} (Difficulty: ${r.diyDifficulty})

SAFETY WARNING
${r.safetyWarning || 'No specific safety warnings.'}

AI CONFIDENCE: ${r.aiConfidence}%

DISCLAIMER: This is an AI-generated estimate based on visual analysis and local market data. A licensed professional must assess in person to confirm scope and pricing.`;

    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ScopeSnap-Report-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Report Downloaded", description: "Your analysis report has been saved." });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50 to-white dark:from-slate-950 dark:to-slate-900">
      <audio ref={audioRef} className="hidden" />
      <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-700 text-white py-10 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2 text-violet-200 text-sm mb-2">
            <Link to="/workhub" className="hover:text-white">WorkHub</Link>
            <ChevronRight className="w-4 h-4" />
            <span>ScopeSnap</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
                <Camera className="w-10 h-10" />
                ScopeSnap
              </h1>
              <p className="text-violet-100 text-lg">Multi-Trade AI Vision Analysis — Upload once. Scope everything.</p>
              <div className="flex flex-wrap gap-2 mt-3">
                {['Tree', 'Roof', 'HVAC', 'Plumbing', 'Electrical', 'Painting', 'Auto', 'Flooring', 'Fence', 'General'].map(t => (
                  <Badge key={t} variant="outline" className="border-violet-300 text-violet-200 text-xs">{t}</Badge>
                ))}
              </div>
            </div>
            <Button variant="ghost" size="lg" onClick={toggleVoice} className="text-white hover:bg-white/10">
              {isPlaying ? <Volume2 className="w-6 h-6 animate-pulse" /> : isVoiceEnabled ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <AutonomousAgentBadge moduleName="ScopeSnap" />

        <div className="grid lg:grid-cols-5 gap-6 mt-4">
          <div className="lg:col-span-2 space-y-4">
            <Card className="border-2 border-violet-200 dark:border-violet-800">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Sparkles className="w-5 h-5 text-violet-600" />
                  AI Analysis Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Trade Category</label>
                  <Select value={selectedTrade} onValueChange={setSelectedTrade}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TRADES.map(t => (
                        <SelectItem key={t.id} value={t.id}>
                          <span className="flex items-center gap-2">
                            <t.icon className={`w-4 h-4 ${t.color}`} />
                            {t.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Description (optional)</label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe what you see or need done..."
                    className="min-h-[80px] resize-none"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-dashed border-violet-300 bg-violet-50/50 dark:bg-violet-900/10">
              <CardContent className="py-8">
                <div className="text-center">
                  <div className="flex justify-center gap-3 mb-4">
                    <div className="w-16 h-16 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                      <Camera className="w-8 h-8 text-violet-600" />
                    </div>
                    <div className="w-16 h-16 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                      <Video className="w-8 h-8 text-violet-600" />
                    </div>
                  </div>
                  <input type="file" id="file-upload" multiple accept="image/*,video/*" onChange={handleFileUpload} className="hidden" />
                  <label htmlFor="file-upload">
                    <Button asChild size="lg" className="bg-violet-600 hover:bg-violet-700 mb-3">
                      <span><Upload className="w-5 h-5 mr-2" />Upload Photos or Videos</span>
                    </Button>
                  </label>
                  <p className="text-sm text-slate-500">Drag & drop or click • Photos & videos • Up to 6 files</p>
                </div>
              </CardContent>
            </Card>

            {previewUrls.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-base">
                      <FileImage className="w-5 h-5 text-violet-600" />
                      {previewUrls.length} File{previewUrls.length > 1 ? 's' : ''} Ready
                    </span>
                    <Button onClick={handleAnalyze} disabled={isAnalyzing} className="bg-gradient-to-r from-violet-600 to-purple-600" size="sm">
                      {isAnalyzing ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" />Analyzing...</> : <><Sparkles className="w-4 h-4 mr-1" />Analyze with AI</>}
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-2">
                    {previewUrls.map((url, idx) => (
                      <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border group">
                        {uploadedFiles[idx]?.type?.startsWith('video/') ? (
                          <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                            <Video className="w-8 h-8 text-white" />
                          </div>
                        ) : (
                          <img src={url} alt={`Upload ${idx + 1}`} className="w-full h-full object-cover" />
                        )}
                        <button onClick={() => removeFile(idx)} className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    {previewUrls.length < 6 && (
                      <label htmlFor="file-upload" className="aspect-square rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center cursor-pointer hover:border-violet-400 transition-colors">
                        <Plus className="w-6 h-6 text-slate-400" />
                      </label>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="bg-slate-50 dark:bg-slate-800/50">
              <CardContent className="pt-5 pb-4">
                <h4 className="font-semibold text-sm mb-3 text-slate-700 dark:text-slate-300">AI Capabilities by Trade</h4>
                <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
                  <div className="flex gap-2"><TreePine className="w-3.5 h-3.5 text-green-600 flex-shrink-0 mt-0.5" /><span><strong>Tree:</strong> Species ID, diameter measurement, lean angle, failure risk, debris tonnage, crew size</span></div>
                  <div className="flex gap-2"><Home className="w-3.5 h-3.5 text-blue-600 flex-shrink-0 mt-0.5" /><span><strong>Roofing:</strong> Hail hits, missing shingles, flashing failure, pitch calculation, square footage</span></div>
                  <div className="flex gap-2"><Car className="w-3.5 h-3.5 text-red-600 flex-shrink-0 mt-0.5" /><span><strong>Auto:</strong> Fluid leaks, belt wear, body damage, collision impact, parts pricing</span></div>
                  <div className="flex gap-2"><Layers className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" /><span><strong>Flooring:</strong> Moisture damage, subfloor swelling, tile cracks, room dimensions</span></div>
                  <div className="flex gap-2"><Plug className="w-3.5 h-3.5 text-yellow-600 flex-shrink-0 mt-0.5" /><span><strong>Electrical:</strong> Broken poles, transformer damage, insulator burns, hazard detection</span></div>
                  <div className="flex gap-2"><Fence className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" /><span><strong>Fencing:</strong> Broken panels, leaning posts, linear feet, rot/termite detection</span></div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-3 space-y-4">
            {isAnalyzing && (
              <Card className="border-violet-200 bg-violet-50/50 dark:bg-violet-900/10">
                <CardContent className="py-12">
                  <div className="text-center">
                    <div className="relative w-20 h-20 mx-auto mb-4">
                      <div className="absolute inset-0 rounded-full border-4 border-violet-200" />
                      <div className="absolute inset-0 rounded-full border-4 border-t-violet-600 animate-spin" />
                      <Eye className="w-8 h-8 text-violet-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">AI Deep Analysis Running...</h3>
                    <p className="text-slate-600 dark:text-slate-400 mb-4">Object detection • Damage assessment • Cost estimation • Trade matching</p>
                    <Progress value={analysisProgress} className="h-2 max-w-xs mx-auto" />
                    <p className="text-sm text-slate-500 mt-2">{analysisProgress}% complete</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {analysisError && !isAnalyzing && (
              <Card className="border-2 border-red-300 bg-red-50 dark:bg-red-900/10">
                <CardContent className="py-8 text-center">
                  <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-red-700 mb-2">Analysis Error</h3>
                  <p className="text-red-600 mb-4">{analysisError}</p>
                  <Button onClick={() => { setAnalysisError(null); handleAnalyze(); }} className="bg-red-600 hover:bg-red-700">Try Again</Button>
                </CardContent>
              </Card>
            )}

            {analysisResults && !isAnalyzing && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                <Card className="border-2 border-green-300 bg-green-50 dark:bg-green-900/10">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
                      <CheckCircle className="w-6 h-6" />
                      Analysis Complete
                      <Badge className={`ml-auto ${analysisResults.aiConfidence >= 80 ? 'bg-green-600' : analysisResults.aiConfidence >= 60 ? 'bg-yellow-600' : 'bg-orange-600'}`}>
                        {analysisResults.aiConfidence}% Confident
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-700 dark:text-slate-300 text-base leading-relaxed">{analysisResults.summary}</p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <Badge className={urgencyColor(analysisResults.urgencyLevel)}>
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        {analysisResults.urgencyLevel.charAt(0).toUpperCase() + analysisResults.urgencyLevel.slice(1)} Urgency
                      </Badge>
                      <Badge className={complexityLabel(analysisResults.complexity).color}>
                        {complexityLabel(analysisResults.complexity).text}
                      </Badge>
                      {analysisResults.diyFeasible && (
                        <Badge variant="outline" className="border-green-500 text-green-600">
                          <Wrench className="w-3 h-3 mr-1" />DIY Possible ({analysisResults.diyDifficulty})
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-2 gap-4">
                  <Card className="bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/20 dark:to-purple-950/20 border-violet-200 dark:border-violet-800">
                    <CardContent className="pt-5 pb-4">
                      <DollarSign className="w-8 h-8 text-violet-600 mb-2" />
                      <p className="text-sm text-violet-600 font-medium">Estimated Range</p>
                      <p className="text-2xl font-bold text-violet-700 dark:text-violet-400">
                        ${analysisResults.estimatedPriceRange.min.toLocaleString()} - ${analysisResults.estimatedPriceRange.max.toLocaleString()}
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 border-blue-200 dark:border-blue-800">
                    <CardContent className="pt-5 pb-4">
                      <Clock className="w-8 h-8 text-blue-600 mb-2" />
                      <p className="text-sm text-blue-600 font-medium">Timeframe</p>
                      <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">{analysisResults.estimatedTimeframe}</p>
                    </CardContent>
                  </Card>
                </div>

                {analysisResults.detailedFindings && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Eye className="w-5 h-5 text-violet-600" />
                        Detailed Findings
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{analysisResults.detailedFindings}</p>
                    </CardContent>
                  </Card>
                )}

                {analysisResults.identifiedIssues.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <AlertCircle className="w-5 h-5 text-amber-500" />
                        Identified Issues ({analysisResults.identifiedIssues.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {analysisResults.identifiedIssues.map((issue, idx) => (
                          <div key={idx} className={`p-3 rounded-lg border-l-4 ${
                            idx === 0 ? 'border-l-red-500 bg-red-50 dark:bg-red-900/10' :
                            idx === 1 ? 'border-l-orange-500 bg-orange-50 dark:bg-orange-900/10' :
                            idx === 2 ? 'border-l-amber-500 bg-amber-50 dark:bg-amber-900/10' :
                            'border-l-blue-500 bg-blue-50 dark:bg-blue-900/10'
                          }`}>
                            <p className="font-medium text-sm text-slate-800 dark:text-slate-200">{issue}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="grid md:grid-cols-2 gap-4">
                  {analysisResults.recommendedTrades.length > 0 && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-base">
                          <Wrench className="w-5 h-5 text-indigo-600" />
                          Recommended Trades
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {analysisResults.recommendedTrades.map(trade => (
                            <Badge key={trade} className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 px-3 py-1">{trade}</Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {analysisResults.materialsNeeded.length > 0 && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-base">
                          <Layers className="w-5 h-5 text-emerald-600" />
                          Materials Needed
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-1.5">
                          {analysisResults.materialsNeeded.map((m, i) => (
                            <li key={i} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                              {m}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {analysisResults.safetyWarning && (
                  <Card className="border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10">
                    <CardContent className="pt-5 pb-4">
                      <div className="flex items-start gap-3">
                        <Shield className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-red-700 dark:text-red-400 mb-1">Safety Warning</h4>
                          <p className="text-sm text-red-600 dark:text-red-300">{analysisResults.safetyWarning}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <p className="text-xs text-slate-400 italic">This is an AI-generated estimate based on visual analysis and local market data. A licensed professional must assess in person to confirm scope and pricing.</p>

                <div className="flex gap-3">
                  <Link to="/workhub/contractormatch" className="flex-1">
                    <Button className="w-full bg-gradient-to-r from-violet-600 to-purple-600">
                      Find Contractors <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                  <Button variant="outline" onClick={downloadReport}>
                    <Download className="w-4 h-4 mr-2" />Download Report
                  </Button>
                  <Button variant="outline" onClick={() => { setAnalysisResults(null); setAnalysisError(null); }}>
                    New Analysis
                  </Button>
                </div>
              </motion.div>
            )}

            {!analysisResults && !analysisError && !isAnalyzing && (
              <Card className="border-slate-200 dark:border-slate-700">
                <CardContent className="py-16">
                  <div className="text-center text-slate-500">
                    <div className="w-20 h-20 rounded-full bg-violet-50 dark:bg-violet-900/20 mx-auto mb-4 flex items-center justify-center">
                      <Eye className="w-10 h-10 text-violet-400" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2 text-slate-700 dark:text-slate-300">Upload photos to begin</h3>
                    <p className="text-sm max-w-md mx-auto mb-6">ScopeSnap uses GPT-4 Vision to analyze photos and videos across 12 contractor trades. Get instant damage assessment, cost estimates, trade matching, and safety analysis.</p>
                    <div className="grid grid-cols-4 gap-3 max-w-md mx-auto">
                      {[
                        { icon: Eye, label: 'Object Detection' },
                        { icon: DollarSign, label: 'Cost Estimation' },
                        { icon: AlertTriangle, label: 'Damage Severity' },
                        { icon: Wrench, label: 'Trade Matching' },
                      ].map(({ icon: Icon, label }) => (
                        <div key={label} className="text-center p-3 rounded-lg bg-violet-50 dark:bg-violet-900/10">
                          <Icon className="w-6 h-6 text-violet-500 mx-auto mb-1" />
                          <p className="text-xs font-medium">{label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      <ModuleAIAssistant
        moduleName="ScopeSnap"
        moduleContext="ScopeSnap is a multi-trade AI vision analysis tool supporting 12 contractor trades: tree services, roofing, HVAC, plumbing, electrical, painting, auto repair, flooring, fencing, concrete, and general contractor work. Users upload photos/videos and AI identifies work needed, detects issues, estimates costs, recommends trades, assesses safety, determines DIY feasibility, and lists required materials. It uses GPT-4 Vision for comprehensive analysis across all trades."
      />
    </div>
  );
}
