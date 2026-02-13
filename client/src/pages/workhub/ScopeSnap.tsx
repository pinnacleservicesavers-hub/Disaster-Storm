import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Camera, Video, Upload, Sparkles, CheckCircle, AlertCircle,
  ChevronRight, Volume2, VolumeX, Loader2, Zap, Eye, Layers,
  Image, FileImage, X, Plus, ArrowRight, Heart
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import ModuleAIAssistant from '@/components/ModuleAIAssistant';
import { AutonomousAgentBadge } from '@/components/AutonomousAgentBadge';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

export default function ScopeSnap() {
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const hasPlayedWelcome = useRef(false);
  const voiceEnabledRef = useRef(true);

  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<any>(null);

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
      voiceMutation.mutate("Give a brief, warm 1-sentence welcome to ScopeSnap. You're Rachel, helping them analyze project photos with AI vision. Mention they can upload images and get instant analysis. Keep it super short and natural.");
    }
  }, []);

  const toggleVoice = () => {
    const newEnabled = !isVoiceEnabled;
    setIsVoiceEnabled(newEnabled);
    voiceEnabledRef.current = newEnabled;
    if (!newEnabled) {
      stopAudio();
    } else {
      voiceMutation.mutate("Say a quick, natural 1-sentence overview of ScopeSnap — AI photo analysis that identifies work needed, detects issues, and matches trades. Keep it warm and conversational.");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setUploadedFiles(prev => [...prev, ...files]);
    const newUrls = files.map(file => URL.createObjectURL(file));
    setPreviewUrls(prev => [...prev, ...newUrls]);
    playRachelVoice(`Say a quick 1-sentence note that ${files.length} files were uploaded and they can click Analyze with AI when ready. Keep it natural.`);
  };

  const handleAnalyze = async () => {
    if (uploadedFiles.length === 0) {
      playRachelVoice("Say a quick 1-sentence reminder to upload at least one photo first. Keep it friendly.");
      return;
    }
    
    setIsAnalyzing(true);
    playRachelVoice("Say a quick 1-sentence note that you're analyzing their photos now using AI vision. Keep it natural and encouraging.");
    
    try {
      const file = uploadedFiles[0];
      
      if (!file.type.startsWith('image/')) {
        throw new Error('Please upload an image file (JPG, PNG, etc.) for analysis.');
      }
      
      const imageBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          const base64 = result.split(',')[1];
          if (!base64 || base64.length < 100) {
            reject(new Error('Image file appears to be empty or corrupted'));
            return;
          }
          resolve(base64);
        };
        reader.onerror = () => reject(new Error('Failed to read the image file'));
        reader.readAsDataURL(file);
      });

      const response = await fetch('/api/workhub/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64,
          jobType: 'general',
          description: 'Customer uploaded photo for analysis'
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || data.details || `Server error (${response.status})`);
      }
      
      if (data.ok && data.analysis) {
        const results = {
          detectedCategory: (data.analysis.detectedJobType || 'general').replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
          confidence: Math.round((data.analysis.confidence || 0.7) * 100),
          identifiedIssues: (data.analysis.recommendations || []).map((rec: string, idx: number) => ({
            issue: rec,
            severity: idx === 0 ? 'high' : idx === 1 ? 'medium' : 'low',
            location: 'Property'
          })),
          recommendedTrades: (data.analysis.tags || []).slice(0, 3),
          estimatedScope: { 
            min: data.analysis.priceEstimate?.min || 500, 
            max: data.analysis.priceEstimate?.max || 5000 
          },
          complexity: data.analysis.severity || 'moderate',
          timeEstimate: data.analysis.urgency === 'emergency' ? 'Immediate' : '1-3 days',
          specialRequirements: data.analysis.safetyNotes ? [data.analysis.safetyNotes] : [],
          contractors: data.contractors || [],
          summary: data.analysis.summary || 'Analysis complete',
          title: data.analysis.title || 'Project Analysis'
        };
        
        setAnalysisResults(results);
        playRachelVoice(`Say a brief 1-sentence summary: analysis complete, identified as ${results.detectedCategory}, estimated $${results.estimatedScope.min}-$${results.estimatedScope.max}, found ${results.contractors.length} contractors. Keep it natural.`);
      } else {
        throw new Error(data.error || 'Analysis returned no results. Please try a clearer photo.');
      }
    } catch (error: any) {
      console.error('Analysis error:', error);
      setAnalysisResults({
        error: true,
        errorMessage: error.message || 'Unable to analyze the photo. Please try again with a different image.'
      });
      playRachelVoice("Say a quick 1-sentence apology that there was an error analyzing the photo and to try again with a clearer image. Keep it warm.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50 to-white dark:from-slate-950 dark:to-slate-900">
      <audio ref={audioRef} className="hidden" />
      <div className="bg-gradient-to-r from-violet-600 to-purple-600 text-white py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-2 text-violet-200 text-sm mb-2">
            <Link to="/workhub" className="hover:text-white">WorkHub</Link>
            <ChevronRight className="w-4 h-4" />
            <span>ScopeSnap</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">ScopeSnap</h1>
              <p className="text-violet-100 text-lg">AI Vision Analysis - Upload once. Scope everything.</p>
            </div>
            <Button
              variant="ghost"
              size="lg"
              onClick={toggleVoice}
              className="text-white hover:bg-white/10"
              data-testid="button-voice-toggle"
            >
              {isPlaying ? <Volume2 className="w-6 h-6 animate-pulse" /> : isVoiceEnabled ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <AutonomousAgentBadge moduleName="ScopeSnap" />
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <Card className="border-2 border-dashed border-violet-300 bg-violet-50/50 dark:bg-violet-900/10">
              <CardContent className="py-12">
                <div className="text-center">
                  <div className="flex justify-center gap-4 mb-6">
                    <motion.div 
                      whileHover={{ scale: 1.1 }}
                      className="w-20 h-20 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center"
                    >
                      <Camera className="w-10 h-10 text-violet-600" />
                    </motion.div>
                    <motion.div 
                      whileHover={{ scale: 1.1 }}
                      className="w-20 h-20 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center"
                    >
                      <Video className="w-10 h-10 text-violet-600" />
                    </motion.div>
                  </div>
                  
                  <input
                    type="file"
                    id="file-upload"
                    multiple
                    accept="image/*,video/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <label htmlFor="file-upload">
                    <Button asChild size="lg" className="bg-violet-600 hover:bg-violet-700 mb-4" data-testid="button-upload">
                      <span>
                        <Upload className="w-5 h-5 mr-2" />
                        Upload Photos or Videos
                      </span>
                    </Button>
                  </label>
                  <p className="text-sm text-slate-500">
                    Drag & drop or click to upload • Up to 20 files
                  </p>
                </div>
              </CardContent>
            </Card>

            {previewUrls.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <FileImage className="w-5 h-5 text-violet-600" />
                      Uploaded Files ({previewUrls.length})
                    </span>
                    <Button 
                      onClick={handleAnalyze}
                      disabled={isAnalyzing}
                      className="bg-gradient-to-r from-violet-600 to-purple-600"
                      data-testid="button-analyze"
                    >
                      {isAnalyzing ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5 mr-2" />
                          Analyze with AI
                        </>
                      )}
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-3">
                    {previewUrls.map((url, idx) => (
                      <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border group">
                        <img src={url} alt={`Upload ${idx + 1}`} className="w-full h-full object-cover" />
                        <button
                          onClick={() => removeFile(idx)}
                          className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <label htmlFor="file-upload" className="aspect-square rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center cursor-pointer hover:border-violet-400 transition-colors">
                      <Plus className="w-8 h-8 text-slate-400" />
                    </label>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            {isAnalyzing && (
              <Card className="border-violet-200 bg-violet-50/50">
                <CardContent className="py-12">
                  <div className="text-center">
                    <Loader2 className="w-16 h-16 text-violet-600 animate-spin mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">AI Analyzing Your Project...</h3>
                    <p className="text-slate-600">Identifying work type, detecting issues, and matching trades</p>
                    <Progress value={66} className="mt-4 h-2" />
                  </div>
                </CardContent>
              </Card>
            )}

            {analysisResults?.error && !isAnalyzing && (
              <Card className="border-2 border-red-300 bg-red-50 dark:bg-red-900/10">
                <CardContent className="py-8 text-center">
                  <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-red-700 mb-2">Analysis Error</h3>
                  <p className="text-red-600 mb-4">{analysisResults.errorMessage}</p>
                  <Button 
                    onClick={() => { setAnalysisResults(null); handleAnalyze(); }}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Try Again
                  </Button>
                </CardContent>
              </Card>
            )}

            {analysisResults && !analysisResults.error && !isAnalyzing && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <Card className="border-2 border-green-300 bg-green-50 dark:bg-green-900/10">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-700">
                      <CheckCircle className="w-6 h-6" />
                      Analysis Complete
                      <Badge className="ml-auto bg-green-600">{analysisResults.confidence}% Confident</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-xl bg-violet-100 flex items-center justify-center">
                        <Layers className="w-8 h-8 text-violet-600" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Detected Category</p>
                        <p className="text-2xl font-bold">{analysisResults.detectedCategory}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-amber-500" />
                      Identified Issues ({analysisResults.identifiedIssues.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {analysisResults.identifiedIssues.map((issue: any, idx: number) => (
                        <div key={idx} className={`p-3 rounded-lg border-l-4 ${
                          issue.severity === 'high' ? 'border-l-red-500 bg-red-50' :
                          issue.severity === 'medium' ? 'border-l-amber-500 bg-amber-50' :
                          'border-l-blue-500 bg-blue-50'
                        }`}>
                          <p className="font-medium">{issue.issue}</p>
                          <p className="text-sm text-slate-500">{issue.location}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="w-5 h-5 text-violet-600" />
                      Project Scope
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-violet-50 rounded-xl">
                        <p className="text-sm text-violet-600">Estimated Range</p>
                        <p className="text-2xl font-bold text-violet-700">
                          ${analysisResults.estimatedScope.min.toLocaleString()} - ${analysisResults.estimatedScope.max.toLocaleString()}
                        </p>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-xl">
                        <p className="text-sm text-slate-600">Time Estimate</p>
                        <p className="text-2xl font-bold">{analysisResults.timeEstimate}</p>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <p className="text-sm text-slate-500 mb-2">Recommended Trades</p>
                      <div className="flex flex-wrap gap-2">
                        {analysisResults.recommendedTrades.map((trade: string) => (
                          <Badge key={trade} variant="secondary">{trade}</Badge>
                        ))}
                      </div>
                    </div>

                    <Button className="w-full mt-6 bg-gradient-to-r from-violet-600 to-purple-600" data-testid="button-find-contractors">
                      Find Contractors
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {!analysisResults && !isAnalyzing && (
              <Card className="border-slate-200">
                <CardContent className="py-12">
                  <div className="text-center text-slate-500">
                    <Eye className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <h3 className="text-lg font-medium mb-2">Upload photos to begin</h3>
                    <p className="text-sm">AI analysis results will appear here</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      <ModuleAIAssistant 
        moduleName="ScopeSnap"
        moduleContext="ScopeSnap is an AI-powered photo and video analysis tool. Users upload images of their projects, and AI identifies the type of work needed, detects issues, estimates scope, and recommends appropriate trade professionals. Help users understand the analysis results and guide them to find contractors."
      />
    </div>
  );
}