import { useState } from "react";
import TopNavigation from "@/components/TopNavigation";
import Sidebar from "@/components/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from "@/contexts/LanguageContext";
import { useMutation } from "@tanstack/react-query";
import { aiApi, translationApi } from "@/lib/api";
import { 
  Bot, 
  FileText, 
  BarChart3, 
  Scale, 
  Globe, 
  Camera,
  Mic,
  Send,
  Download,
  Copy,
  Zap,
  MessageSquare,
  Image as ImageIcon,
  Languages
} from "lucide-react";

export default function AIAssistant() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedTool, setSelectedTool] = useState("letter");
  const [inputText, setInputText] = useState("");
  const [result, setResult] = useState("");
  const { translate, currentLanguage, setLanguage } = useLanguage();

  // AI Mutations
  const generateLetterMutation = useMutation({
    mutationFn: aiApi.generateLetter,
    onSuccess: (data) => {
      setResult(`Subject: ${data.subject}\n\n${data.body}`);
    }
  });

  const analyzeImageMutation = useMutation({
    mutationFn: aiApi.analyzeImage,
    onSuccess: (data) => {
      setResult(`Damage Assessment: ${data.damageDescription}\n\nSeverity: ${data.severity}\n\nEstimated Cost: $${data.estimatedCost}\n\nRecommendations:\n${data.recommendations.join('\n- ')}`);
    }
  });

  const translateMutation = useMutation({
    mutationFn: (params: { text: string; targetLanguage: string }) => 
      translationApi.translateText(params.text, params.targetLanguage),
    onSuccess: (data) => {
      setResult(data.translatedText);
    }
  });

  const generateScopeMutation = useMutation({
    mutationFn: aiApi.generateScope,
    onSuccess: (data) => {
      setResult(data.scopeNotes);
    }
  });

  const handleGenerateLetter = () => {
    generateLetterMutation.mutate({
      claimNumber: "CLM-2024-001",
      insuranceCompany: "State Farm",
      claimType: "Tree Removal",
      requestedAmount: 5000,
      marketData: [],
      tone: "professional",
      language: currentLanguage
    });
  };

  const handleAnalyzeImage = () => {
    // Mock base64 image for demonstration
    const mockImageBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";
    analyzeImageMutation.mutate(mockImageBase64);
  };

  const handleTranslate = () => {
    if (!inputText.trim()) return;
    const targetLang = currentLanguage === 'en' ? 'es' : 'en';
    translateMutation.mutate({
      text: inputText,
      targetLanguage: targetLang
    });
  };

  const handleGenerateScope = () => {
    generateScopeMutation.mutate({
      damageType: "Tree on roof",
      location: "Residential property",
      treeSpecies: "Oak",
      dbh: 24,
      craneNeeded: true,
      accessNotes: "Crane access from street"
    });
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(result);
  };

  const downloadResult = () => {
    const blob = new Blob([result], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ai-result.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const isLoading = generateLetterMutation.isPending || 
                   analyzeImageMutation.isPending || 
                   translateMutation.isPending || 
                   generateScopeMutation.isPending;

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNavigation onSidebarToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      
      <div className="pt-16 flex">
        <Sidebar collapsed={sidebarCollapsed} />
        
        <main className={`flex-1 transition-all duration-300 ${
          sidebarCollapsed ? 'ml-16' : 'ml-280'
        }`}>
          <div className="p-6">
            <div className="mb-8">
              <div className="flex items-center space-x-3">
                <Bot className="w-8 h-8 text-primary" />
                <div>
                  <h1 className="text-3xl font-bold text-gray-900" data-testid="ai-assistant-title">
                    {translate('ai_assistant')}
                  </h1>
                  <p className="text-gray-600 mt-1">
                    AI-powered tools for claims, analysis, and communication
                  </p>
                </div>
              </div>
            </div>

            {/* AI Status */}
            <Card className="mb-8 bg-gradient-to-r from-primary to-primary-dark text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                      <Zap className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">AI System Status</h3>
                      <p className="text-blue-100">All AI services operational</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold">GPT-4o</div>
                      <div className="text-sm text-blue-100">Model</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">99.9%</div>
                      <div className="text-sm text-blue-100">Uptime</div>
                    </div>
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* AI Tools */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Tool Selection */}
              <div className="space-y-6">
                <Card data-testid="card-ai-tools">
                  <CardHeader>
                    <CardTitle>AI Tools</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button
                      variant={selectedTool === "letter" ? "default" : "outline"}
                      className="w-full justify-start"
                      onClick={() => setSelectedTool("letter")}
                      data-testid="button-select-letter"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Claim Letter Generator
                    </Button>
                    
                    <Button
                      variant={selectedTool === "image" ? "default" : "outline"}
                      className="w-full justify-start"
                      onClick={() => setSelectedTool("image")}
                      data-testid="button-select-image"
                    >
                      <ImageIcon className="w-4 h-4 mr-2" />
                      Image Analysis
                    </Button>
                    
                    <Button
                      variant={selectedTool === "translate" ? "default" : "outline"}
                      className="w-full justify-start"
                      onClick={() => setSelectedTool("translate")}
                      data-testid="button-select-translate"
                    >
                      <Languages className="w-4 h-4 mr-2" />
                      Translation
                    </Button>
                    
                    <Button
                      variant={selectedTool === "scope" ? "default" : "outline"}
                      className="w-full justify-start"
                      onClick={() => setSelectedTool("scope")}
                      data-testid="button-select-scope"
                    >
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Scope Generator
                    </Button>
                    
                    <Button
                      variant={selectedTool === "analysis" ? "default" : "outline"}
                      className="w-full justify-start"
                      onClick={() => setSelectedTool("analysis")}
                      data-testid="button-select-analysis"
                    >
                      <Scale className="w-4 h-4 mr-2" />
                      Market Analysis
                    </Button>
                  </CardContent>
                </Card>

                {/* Language Settings */}
                <Card data-testid="card-language-settings">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Globe className="w-5 h-5 mr-2" />
                      Language
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
                      <Button
                        variant={currentLanguage === 'en' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setLanguage('en')}
                        className="flex-1"
                        data-testid="button-lang-en"
                      >
                        English
                      </Button>
                      <Button
                        variant={currentLanguage === 'es' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setLanguage('es')}
                        className="flex-1"
                        data-testid="button-lang-es"
                      >
                        Español
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Input Panel */}
              <Card data-testid="card-ai-input">
                <CardHeader>
                  <CardTitle>
                    {selectedTool === "letter" && "Claim Letter Generator"}
                    {selectedTool === "image" && "Image Analysis"}
                    {selectedTool === "translate" && "Translation Tool"}
                    {selectedTool === "scope" && "Scope Notes Generator"}
                    {selectedTool === "analysis" && "Market Analysis"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedTool === "letter" && (
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                          Claim Details
                        </label>
                        <Textarea
                          placeholder="Enter claim information (claim number, insurance company, damage type, amount, etc.)"
                          value={inputText}
                          onChange={(e) => setInputText(e.target.value)}
                          rows={4}
                          data-testid="textarea-claim-details"
                        />
                      </div>
                      <Button
                        onClick={handleGenerateLetter}
                        disabled={isLoading}
                        className="w-full"
                        data-testid="button-generate-letter"
                      >
                        {isLoading ? "Generating..." : "Generate Letter"}
                      </Button>
                    </div>
                  )}

                  {selectedTool === "image" && (
                    <div className="space-y-4">
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                        <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 mb-4">Upload damage photos for AI analysis</p>
                        <Button variant="outline" data-testid="button-upload-image">
                          <ImageIcon className="w-4 h-4 mr-2" />
                          Upload Image
                        </Button>
                      </div>
                      <Button
                        onClick={handleAnalyzeImage}
                        disabled={isLoading}
                        className="w-full"
                        data-testid="button-analyze-image"
                      >
                        {isLoading ? "Analyzing..." : "Analyze Sample Image"}
                      </Button>
                    </div>
                  )}

                  {selectedTool === "translate" && (
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                          Text to Translate
                        </label>
                        <Textarea
                          placeholder="Enter text to translate between English and Spanish"
                          value={inputText}
                          onChange={(e) => setInputText(e.target.value)}
                          rows={4}
                          data-testid="textarea-translate-text"
                        />
                      </div>
                      <Button
                        onClick={handleTranslate}
                        disabled={isLoading || !inputText.trim()}
                        className="w-full"
                        data-testid="button-translate"
                      >
                        {isLoading ? "Translating..." : `Translate to ${currentLanguage === 'en' ? 'Spanish' : 'English'}`}
                      </Button>
                    </div>
                  )}

                  {selectedTool === "scope" && (
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                          Damage Information
                        </label>
                        <Textarea
                          placeholder="Describe the damage (tree species, size, location, access requirements, etc.)"
                          value={inputText}
                          onChange={(e) => setInputText(e.target.value)}
                          rows={4}
                          data-testid="textarea-scope-info"
                        />
                      </div>
                      <Button
                        onClick={handleGenerateScope}
                        disabled={isLoading}
                        className="w-full"
                        data-testid="button-generate-scope"
                      >
                        {isLoading ? "Generating..." : "Generate Scope Notes"}
                      </Button>
                    </div>
                  )}

                  {selectedTool === "analysis" && (
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                          Analysis Parameters
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          <Input placeholder="Claim Type" data-testid="input-claim-type" />
                          <Input placeholder="Region" data-testid="input-region" />
                          <Input placeholder="Insurance Company" data-testid="input-insurance" />
                          <Input placeholder="Amount" data-testid="input-amount" />
                        </div>
                      </div>
                      <Button
                        disabled={isLoading}
                        className="w-full"
                        data-testid="button-run-analysis"
                      >
                        {isLoading ? "Analyzing..." : "Run Market Analysis"}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Results Panel */}
              <Card data-testid="card-ai-results">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Results</CardTitle>
                    {result && (
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={copyToClipboard}
                          data-testid="button-copy-result"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={downloadResult}
                          data-testid="button-download-result"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="text-center">
                        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                        <p className="text-gray-600">AI is processing your request...</p>
                      </div>
                    </div>
                  ) : result ? (
                    <div className="space-y-4">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <pre className="whitespace-pre-wrap text-sm text-gray-800" data-testid="ai-result-text">
                          {result}
                        </pre>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className="bg-green-100 text-green-800">
                          AI Generated
                        </Badge>
                        <span className="text-xs text-gray-500">
                          Generated at {new Date().toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-600">
                        AI results will appear here after processing
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Recent AI Interactions */}
            <Card className="mt-8" data-testid="card-recent-interactions">
              <CardHeader>
                <CardTitle>Recent AI Interactions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <FileText className="w-5 h-5 text-blue-600" />
                      <div>
                        <div className="font-medium text-sm">Claim Letter - State Farm</div>
                        <div className="text-xs text-gray-500">Generated 2 hours ago</div>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" data-testid="button-view-interaction-0">
                      View
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <ImageIcon className="w-5 h-5 text-green-600" />
                      <div>
                        <div className="font-medium text-sm">Damage Analysis - Tree Removal</div>
                        <div className="text-xs text-gray-500">Generated 4 hours ago</div>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" data-testid="button-view-interaction-1">
                      View
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Languages className="w-5 h-5 text-purple-600" />
                      <div>
                        <div className="font-medium text-sm">Translation - Contract Terms</div>
                        <div className="text-xs text-gray-500">Generated yesterday</div>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" data-testid="button-view-interaction-2">
                      View
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
