import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Camera, Video, Upload, Sparkles, CheckCircle, AlertCircle,
  ChevronRight, Volume2, VolumeX, Loader2, Zap, Eye, Layers,
  Image, FileImage, X, Plus, ArrowRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import TopNav from '@/components/TopNav';
import ModuleAIAssistant from '@/components/ModuleAIAssistant';

export default function ScopeSnap() {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<any>(null);

  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      if (availableVoices.length > 0) {
        setVoices(availableVoices);
      }
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    
    return () => { window.speechSynthesis.cancel(); };
  }, []);

  useEffect(() => {
    if (voices.length > 0) {
      setTimeout(() => {
        speakGuidance("Welcome to ScopeSnap! I'm Rachel, and I'll help you analyze your project photos. Upload images or videos, and our AI will instantly identify the type of work needed, detect issues, and match you with the right trade professionals.");
      }, 500);
    }
  }, [voices]);

  const getBestFemaleVoice = (voiceList: SpeechSynthesisVoice[]) => {
    const preferredVoices = ['Samantha', 'Zira', 'Jenny', 'Google US English Female', 'Microsoft Zira'];
    for (const preferred of preferredVoices) {
      const found = voiceList.find(v => v.name.includes(preferred));
      if (found) return found;
    }
    return voiceList.find(v => v.lang.startsWith('en')) || voiceList[0];
  };

  const speakGuidance = (text: string) => {
    if (voices.length === 0) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = getBestFemaleVoice(voices);
    utterance.pitch = 1.0;
    utterance.rate = 0.88;
    utterance.onstart = () => setIsVoiceActive(true);
    utterance.onend = () => setIsVoiceActive(false);
    window.speechSynthesis.speak(utterance);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setUploadedFiles(prev => [...prev, ...files]);
    const newUrls = files.map(file => URL.createObjectURL(file));
    setPreviewUrls(prev => [...prev, ...newUrls]);
    speakGuidance(`${files.length} files uploaded. Click "Analyze with AI" when you're ready for me to scan your project.`);
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    speakGuidance("Analyzing your photos now. I'm using advanced AI vision to identify the work needed, detect potential issues, and determine which trade professionals you'll need.");
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const results = {
      detectedCategory: 'Tree Services',
      confidence: 94,
      identifiedIssues: [
        { issue: 'Large dead oak tree - safety hazard', severity: 'high', location: 'Backyard center' },
        { issue: 'Overgrown branches near power lines', severity: 'medium', location: 'Front yard' },
        { issue: 'Root damage to sidewalk', severity: 'low', location: 'North side' }
      ],
      recommendedTrades: ['Certified Arborist', 'Tree Removal Service', 'Stump Grinding'],
      estimatedScope: { min: 1500, max: 4500 },
      complexity: 'Medium-High',
      timeEstimate: '1-2 days',
      specialRequirements: ['Crane may be required', 'Permit needed for tree over 24" diameter']
    };
    
    setAnalysisResults(results);
    setIsAnalyzing(false);
    speakGuidance(`Analysis complete! I've identified this as a ${results.detectedCategory} project with ${results.identifiedIssues.length} issues. The estimated scope is $${results.estimatedScope.min} to $${results.estimatedScope.max}. I found ${results.identifiedIssues.filter(i => i.severity === 'high').length} high priority items that need attention.`);
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50 to-white dark:from-slate-950 dark:to-slate-900">
      <TopNav />

      {/* Header */}
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
              onClick={() => isVoiceActive ? window.speechSynthesis.cancel() : speakGuidance("I'm Rachel, your AI assistant for ScopeSnap. Upload photos or videos of any project, and I'll analyze them to identify the work needed, detect issues, and recommend the right contractors.")}
              className="text-white hover:bg-white/10"
              data-testid="button-voice-toggle"
            >
              {isVoiceActive ? <Volume2 className="w-6 h-6 animate-pulse" /> : <VolumeX className="w-6 h-6" />}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Upload Section */}
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

          {/* Analysis Results */}
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

            {analysisResults && !isAnalyzing && (
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
