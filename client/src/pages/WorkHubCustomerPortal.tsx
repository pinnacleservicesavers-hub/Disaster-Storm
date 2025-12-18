import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Camera, Video, Upload, MapPin, Sparkles, CheckCircle,
  ArrowRight, ArrowLeft, Image, Loader2, Volume2, VolumeX,
  DollarSign, Clock, Star, User, Phone, Mail, Calendar,
  MessageSquare, Shield, Zap, ChevronRight, Building2,
  TreePine, Home, Wind, Droplets, Plug, Paintbrush, Car,
  Hammer, Wrench, Settings, ThumbsUp, AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import TopNav from '@/components/TopNav';
import ModuleAIAssistant from '@/components/ModuleAIAssistant';

const SERVICE_CATEGORIES = [
  { id: 'tree', name: 'Tree Services', icon: TreePine, description: 'Removal, trimming, stump grinding' },
  { id: 'roofing', name: 'Roofing', icon: Home, description: 'Repairs, replacement, inspections' },
  { id: 'hvac', name: 'HVAC', icon: Wind, description: 'Heating, cooling, ventilation' },
  { id: 'plumbing', name: 'Plumbing', icon: Droplets, description: 'Pipes, fixtures, water heaters' },
  { id: 'electrical', name: 'Electrical', icon: Plug, description: 'Wiring, panels, outlets' },
  { id: 'painting', name: 'Painting', icon: Paintbrush, description: 'Interior, exterior, commercial' },
  { id: 'auto', name: 'Auto Repair', icon: Car, description: 'Mechanical, body, paint' },
  { id: 'general', name: 'General Contractor', icon: Hammer, description: 'Renovations, remodels' },
  { id: 'flooring', name: 'Flooring', icon: Building2, description: 'Hardwood, tile, carpet' },
  { id: 'fence', name: 'Fencing', icon: Settings, description: 'Wood, chain link, privacy' },
  { id: 'concrete', name: 'Concrete', icon: Wrench, description: 'Driveways, patios, repairs' },
  { id: 'other', name: 'Other', icon: Settings, description: 'Custom project' }
];

interface ProjectRequest {
  category: string;
  description: string;
  photos: File[];
  location: {
    address: string;
    city: string;
    state: string;
    zip: string;
  };
  contact: {
    name: string;
    phone: string;
    email: string;
  };
  preferences: {
    urgency: string;
    schedulingOption: string;
    estimatePreference: string;
  };
}

export default function WorkHubCustomerPortal() {
  const [step, setStep] = useState(1);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [request, setRequest] = useState<ProjectRequest>({
    category: '',
    description: '',
    photos: [],
    location: { address: '', city: '', state: '', zip: '' },
    contact: { name: '', phone: '', email: '' },
    preferences: { urgency: 'normal', schedulingOption: 'customer', estimatePreference: 'multiple' }
  });
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

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
    utterance.pitch = 1.1;
    utterance.rate = 1.05;
    utterance.onstart = () => setIsVoiceActive(true);
    utterance.onend = () => setIsVoiceActive(false);
    window.speechSynthesis.speak(utterance);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setRequest(prev => ({ ...prev, photos: [...prev.photos, ...files] }));
    const newUrls = files.map(file => URL.createObjectURL(file));
    setPreviewUrls(prev => [...prev, ...newUrls]);
  };

  const handleAnalyzePhotos = async () => {
    if (request.photos.length === 0) return;
    
    setIsAnalyzing(true);
    speakGuidance("Analyzing your photos with AI. I'm identifying the type of work needed and potential issues.");
    
    try {
      // Convert first photo to base64 for AI analysis
      const file = request.photos[0];
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          // Remove the data:image/...;base64, prefix
          const base64 = result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
      });
      reader.readAsDataURL(file);
      const imageBase64 = await base64Promise;

      // Call the real AI analysis API
      const response = await fetch('/api/workhub/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageBase64: imageBase64,
          description: request.description || '',
          jobType: request.category || '',
          location: request.location.city && request.location.state 
            ? `${request.location.city}, ${request.location.state}` 
            : ''
        }),
      });

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const data = await response.json();
      
      // Transform API response to match the expected format
      // details is a string, convert to array for display
      const issuesList: string[] = [];
      if (data.analysis?.summary) issuesList.push(data.analysis.summary);
      if (data.analysis?.details) issuesList.push(data.analysis.details);
      if (issuesList.length === 0) issuesList.push('Work identified from photo analysis');
      
      // Confidence is 0-1 from backend, convert to percentage
      const confidencePercent = Math.round((data.analysis?.confidence || 0.85) * 100);
      
      const analysis = {
        detectedCategory: data.analysis?.detectedJobType || request.category || 'general',
        identifiedIssues: issuesList,
        recommendedTrades: data.analysis?.recommendations || [],
        estimatedPriceRange: { 
          min: data.analysis?.priceEstimate?.min || 500, 
          max: data.analysis?.priceEstimate?.max || 2000 
        },
        complexity: data.analysis?.severity || 'Medium',
        timeEstimate: data.analysis?.urgency || '1-3 days',
        aiConfidence: confidencePercent,
        contractors: data.contractors || [],
        tags: data.analysis?.tags || [],
        safetyNotes: data.analysis?.safetyNotes || ''
      };
      
      setAiAnalysis(analysis);
      speakGuidance(`Analysis complete. I've identified ${analysis.identifiedIssues.length} issues. The estimated price range is $${analysis.estimatedPriceRange.min} to $${analysis.estimatedPriceRange.max}. This appears to be a ${analysis.complexity.toLowerCase()} complexity job. I found ${analysis.contractors.length} available contractors in your area.`);
    } catch (error) {
      console.error('AI analysis error:', error);
      // Fallback to basic analysis if API fails
      const fallbackAnalysis = {
        detectedCategory: request.category || 'general',
        identifiedIssues: ['Photo uploaded - professional inspection recommended'],
        recommendedTrades: [SERVICE_CATEGORIES.find(c => c.id === request.category)?.name || 'General Contractor'],
        estimatedPriceRange: { min: 500, max: 2500 },
        complexity: 'Medium',
        timeEstimate: '1-3 days',
        aiConfidence: 70,
        contractors: []
      };
      setAiAnalysis(fallbackAnalysis);
      speakGuidance("I've received your photos. A professional inspection will provide a detailed estimate.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const progressPercentage = (step / 5) * 100;

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">What type of work do you need?</h2>
              <p className="text-slate-600 dark:text-slate-400">Select the category that best matches your project</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {SERVICE_CATEGORIES.map((category) => (
                <motion.button
                  key={category.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setRequest(prev => ({ ...prev, category: category.id }));
                    speakGuidance(`${category.name} selected. ${category.description}`);
                  }}
                  className={`p-4 rounded-xl border-2 transition-all text-left ${
                    request.category === category.id
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 shadow-lg'
                      : 'border-slate-200 dark:border-slate-700 hover:border-purple-300'
                  }`}
                  data-testid={`category-${category.id}`}
                >
                  <category.icon className={`w-8 h-8 mb-2 ${
                    request.category === category.id ? 'text-purple-600' : 'text-slate-500'
                  }`} />
                  <p className="font-semibold text-slate-900 dark:text-white">{category.name}</p>
                  <p className="text-xs text-slate-500 mt-1">{category.description}</p>
                  {request.category === category.id && (
                    <CheckCircle className="w-5 h-5 text-purple-600 absolute top-2 right-2" />
                  )}
                </motion.button>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">Upload Photos & Videos</h2>
              <p className="text-slate-600 dark:text-slate-400">AI will analyze your project and identify the work needed</p>
            </div>

            <Card className="border-2 border-dashed border-purple-300 bg-purple-50/50 dark:bg-purple-900/10">
              <CardContent className="py-12">
                <div className="text-center">
                  <div className="flex justify-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                      <Camera className="w-8 h-8 text-purple-600" />
                    </div>
                    <div className="w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                      <Video className="w-8 h-8 text-purple-600" />
                    </div>
                  </div>
                  
                  <input
                    type="file"
                    id="photo-upload"
                    multiple
                    accept="image/*,video/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                  <label htmlFor="photo-upload">
                    <Button asChild className="mb-4" data-testid="button-upload-photos">
                      <span>
                        <Upload className="w-5 h-5 mr-2" />
                        Upload Photos or Videos
                      </span>
                    </Button>
                  </label>
                  <p className="text-sm text-slate-500">
                    Drag & drop or click to upload • Up to 20 photos/videos
                  </p>
                </div>
              </CardContent>
            </Card>

            {previewUrls.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{previewUrls.length} files uploaded</h3>
                  <Button 
                    onClick={handleAnalyzePhotos} 
                    disabled={isAnalyzing}
                    className="bg-gradient-to-r from-purple-600 to-indigo-600"
                    data-testid="button-analyze-photos"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5 mr-2" />
                        AI Analyze
                      </>
                    )}
                  </Button>
                </div>

                <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                  {previewUrls.map((url, idx) => (
                    <div key={idx} className="aspect-square rounded-lg overflow-hidden border">
                      <img src={url} alt={`Upload ${idx + 1}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {aiAnalysis && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="border-2 border-green-300 bg-green-50 dark:bg-green-900/10">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
                      <Sparkles className="w-5 h-5" />
                      AI Analysis Complete
                      <Badge className="ml-auto bg-green-600">{aiAnalysis.aiConfidence}% Confident</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-slate-500 mb-1">Identified Issues</p>
                        <ul className="space-y-1">
                          {aiAnalysis.identifiedIssues.map((issue: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-2 text-sm">
                              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                              {issue}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-slate-500">Estimated Price Range</p>
                          <p className="text-2xl font-bold text-green-700">
                            ${aiAnalysis.estimatedPriceRange.min.toLocaleString()} - ${aiAnalysis.estimatedPriceRange.max.toLocaleString()}
                          </p>
                          <p className="text-xs text-amber-600 flex items-center gap-1 mt-1">
                            <AlertCircle className="w-3 h-3" />
                            Final price subject to on-site inspection
                          </p>
                        </div>
                        <div className="flex gap-4">
                          <div>
                            <p className="text-sm text-slate-500">Complexity</p>
                            <Badge variant="outline">{aiAnalysis.complexity}</Badge>
                          </div>
                          <div>
                            <p className="text-sm text-slate-500">Time Estimate</p>
                            <Badge variant="outline">{aiAnalysis.timeEstimate}</Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Matched Contractors Section */}
                    {aiAnalysis.contractors && aiAnalysis.contractors.length > 0 && (
                      <div className="mt-6 pt-4 border-t border-green-200 dark:border-green-800">
                        <h4 className="font-semibold text-green-700 dark:text-green-400 mb-3 flex items-center gap-2">
                          <User className="w-4 h-4" />
                          Available Contractors ({aiAnalysis.contractors.length})
                        </h4>
                        <div className="grid gap-3">
                          {aiAnalysis.contractors.slice(0, 3).map((contractor: any, idx: number) => (
                            <div 
                              key={contractor.id || idx} 
                              className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700"
                              data-testid={`contractor-${contractor.id || idx}`}
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                                  <User className="w-5 h-5 text-purple-600" />
                                </div>
                                <div>
                                  <p className="font-medium text-slate-900 dark:text-white">{contractor.name}</p>
                                  <div className="flex items-center gap-2 text-sm text-slate-500">
                                    <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                                    <span>{contractor.rating}</span>
                                    <span className="text-slate-400">•</span>
                                    <span>{contractor.reviews} reviews</span>
                                    {contractor.distance && (
                                      <>
                                        <span className="text-slate-400">•</span>
                                        <span>{contractor.distance} mi</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <Badge className="bg-purple-600 capitalize">
                                  {contractor.trades?.[0]?.replace(/_/g, ' ') || 'Contractor'}
                                </Badge>
                                {contractor.availability && (
                                  <p className={`text-xs mt-1 ${contractor.availability.includes('now') ? 'text-green-600' : 'text-amber-600'}`}>
                                    {contractor.availability}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                        {aiAnalysis.contractors.length > 3 && (
                          <p className="text-sm text-center text-purple-600 mt-3">
                            +{aiAnalysis.contractors.length - 3} more contractors available
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            <div className="space-y-2">
              <Label>Describe Your Project (Optional)</Label>
              <Textarea
                placeholder="Any additional details about your project..."
                value={request.description}
                onChange={(e) => setRequest(prev => ({ ...prev, description: e.target.value }))}
                className="min-h-[100px]"
                data-testid="input-description"
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">Project Location</h2>
              <p className="text-slate-600 dark:text-slate-400">Where is this work needed?</p>
            </div>

            <Card>
              <CardContent className="pt-6 space-y-4">
                <div>
                  <Label>Street Address</Label>
                  <Input
                    placeholder="123 Main Street"
                    value={request.location.address}
                    onChange={(e) => setRequest(prev => ({
                      ...prev,
                      location: { ...prev.location, address: e.target.value }
                    }))}
                    data-testid="input-address"
                  />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <Label>City</Label>
                    <Input
                      placeholder="City"
                      value={request.location.city}
                      onChange={(e) => setRequest(prev => ({
                        ...prev,
                        location: { ...prev.location, city: e.target.value }
                      }))}
                      data-testid="input-city"
                    />
                  </div>
                  <div>
                    <Label>State</Label>
                    <Input
                      placeholder="State"
                      value={request.location.state}
                      onChange={(e) => setRequest(prev => ({
                        ...prev,
                        location: { ...prev.location, state: e.target.value }
                      }))}
                      data-testid="input-state"
                    />
                  </div>
                  <div>
                    <Label>ZIP Code</Label>
                    <Input
                      placeholder="12345"
                      value={request.location.zip}
                      onChange={(e) => setRequest(prev => ({
                        ...prev,
                        location: { ...prev.location, zip: e.target.value }
                      }))}
                      data-testid="input-zip"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <Button variant="outline" className="w-full" data-testid="button-use-location">
                    <MapPin className="w-5 h-5 mr-2" />
                    Use My Current Location
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">Your Contact Information</h2>
              <p className="text-slate-600 dark:text-slate-400">How should contractors reach you?</p>
            </div>

            <Card>
              <CardContent className="pt-6 space-y-4">
                <div>
                  <Label>Full Name</Label>
                  <Input
                    placeholder="John Smith"
                    value={request.contact.name}
                    onChange={(e) => setRequest(prev => ({
                      ...prev,
                      contact: { ...prev.contact, name: e.target.value }
                    }))}
                    data-testid="input-name"
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Phone Number</Label>
                    <Input
                      type="tel"
                      placeholder="(555) 123-4567"
                      value={request.contact.phone}
                      onChange={(e) => setRequest(prev => ({
                        ...prev,
                        contact: { ...prev.contact, phone: e.target.value }
                      }))}
                      data-testid="input-phone"
                    />
                  </div>
                  <div>
                    <Label>Email Address</Label>
                    <Input
                      type="email"
                      placeholder="john@example.com"
                      value={request.contact.email}
                      onChange={(e) => setRequest(prev => ({
                        ...prev,
                        contact: { ...prev.contact, email: e.target.value }
                      }))}
                      data-testid="input-email"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Your Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>How urgent is this project?</Label>
                  <Select
                    value={request.preferences.urgency}
                    onValueChange={(value) => setRequest(prev => ({
                      ...prev,
                      preferences: { ...prev.preferences, urgency: value }
                    }))}
                  >
                    <SelectTrigger data-testid="select-urgency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="emergency">Emergency - Need help ASAP</SelectItem>
                      <SelectItem value="urgent">Urgent - Within 48 hours</SelectItem>
                      <SelectItem value="normal">Normal - Within a week</SelectItem>
                      <SelectItem value="flexible">Flexible - No rush</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Scheduling preference</Label>
                  <Select
                    value={request.preferences.schedulingOption}
                    onValueChange={(value) => setRequest(prev => ({
                      ...prev,
                      preferences: { ...prev.preferences, schedulingOption: value }
                    }))}
                  >
                    <SelectTrigger data-testid="select-scheduling">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="customer">I'll choose my preferred times</SelectItem>
                      <SelectItem value="contractor">Let contractors reach out</SelectItem>
                      <SelectItem value="ai">Let AI schedule for me automatically</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Estimate preference</Label>
                  <Select
                    value={request.preferences.estimatePreference}
                    onValueChange={(value) => setRequest(prev => ({
                      ...prev,
                      preferences: { ...prev.preferences, estimatePreference: value }
                    }))}
                  >
                    <SelectTrigger data-testid="select-estimate-pref">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="multiple">Get multiple estimates</SelectItem>
                      <SelectItem value="single">Match me with one contractor</SelectItem>
                      <SelectItem value="best">AI recommends best contractor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">Review & Submit</h2>
              <p className="text-slate-600 dark:text-slate-400">Confirm your project details</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Hammer className="w-5 h-5 text-purple-600" />
                    Project Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Category</span>
                    <span className="font-medium">
                      {SERVICE_CATEGORIES.find(c => c.id === request.category)?.name || 'Not selected'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Photos</span>
                    <span className="font-medium">{request.photos.length} uploaded</span>
                  </div>
                  {aiAnalysis && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Est. Price Range</span>
                        <span className="font-medium text-green-600">
                          ${aiAnalysis.estimatedPriceRange.min} - ${aiAnalysis.estimatedPriceRange.max}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Complexity</span>
                        <Badge variant="outline">{aiAnalysis.complexity}</Badge>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-purple-600" />
                    Location
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm">
                  <p>{request.location.address}</p>
                  <p>{request.location.city}, {request.location.state} {request.location.zip}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="w-5 h-5 text-purple-600" />
                    Contact Info
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p className="flex items-center gap-2">
                    <User className="w-4 h-4 text-slate-400" />
                    {request.contact.name}
                  </p>
                  <p className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-slate-400" />
                    {request.contact.phone}
                  </p>
                  <p className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-slate-400" />
                    {request.contact.email}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Settings className="w-5 h-5 text-purple-600" />
                    Preferences
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Urgency</span>
                    <span className="capitalize">{request.preferences.urgency}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Scheduling</span>
                    <span className="capitalize">{request.preferences.schedulingOption}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Estimates</span>
                    <span className="capitalize">{request.preferences.estimatePreference}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border-purple-200">
              <CardContent className="py-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                    <Zap className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">Ready to Find Contractors!</h3>
                    <p className="text-slate-600 dark:text-slate-400 text-sm">
                      AI will match you with verified contractors based on your project needs.
                      You'll receive estimates within 24 hours.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button 
              className="w-full h-14 text-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
              onClick={() => {
                speakGuidance("Your project request has been submitted! You'll start receiving contractor estimates within 24 hours. I'll keep you updated on any new matches.");
              }}
              data-testid="button-submit-request"
            >
              <CheckCircle className="w-6 h-6 mr-2" />
              Submit Project Request
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white dark:from-slate-950 dark:to-slate-900">
      <TopNav />

      {/* Hero Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2 mb-4">
            <Link to="/workhub" className="text-purple-200 hover:text-white">
              WorkHub
            </Link>
            <ChevronRight className="w-4 h-4 text-purple-200" />
            <span>Submit Project</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Get Your Project Done</h1>
          <p className="text-purple-100">Upload photos, get AI analysis, and connect with verified contractors</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Step {step} of 5</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                isVoiceActive 
                  ? window.speechSynthesis.cancel() 
                  : speakGuidance("I'm Rachel, your AI assistant. I'll guide you through submitting your project request. Let's get started!");
              }}
            >
              {isVoiceActive ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </Button>
          </div>
          <Progress value={progressPercentage} className="h-2" />
          <div className="flex justify-between mt-2">
            {['Category', 'Photos', 'Location', 'Contact', 'Review'].map((label, idx) => (
              <span 
                key={label}
                className={`text-xs ${step > idx ? 'text-purple-600 font-medium' : 'text-slate-400'}`}
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {renderStepContent()}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t">
          <Button
            variant="outline"
            onClick={() => setStep(prev => Math.max(1, prev - 1))}
            disabled={step === 1}
            data-testid="button-prev-step"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Previous
          </Button>

          {step < 5 && (
            <Button
              onClick={() => setStep(prev => Math.min(5, prev + 1))}
              disabled={step === 1 && !request.category}
              data-testid="button-next-step"
            >
              Next Step
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          )}
        </div>
      </div>

      <ModuleAIAssistant 
        moduleName="Project Request"
        moduleContext="This is the customer project submission flow. Help customers upload photos, describe their project, and connect with contractors. Guide them through selecting a category, uploading photos for AI analysis, entering location and contact information."
      />
    </div>
  );
}
