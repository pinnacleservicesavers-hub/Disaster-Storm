import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
  Camera, 
  Video, 
  Image, 
  MapPin, 
  Clock, 
  MessageSquare, 
  Tag, 
  Edit3, 
  Save, 
  Share2, 
  Download, 
  Upload, 
  Layers, 
  Zap, 
  FileText, 
  CheckSquare, 
  Users, 
  Bot, 
  Sparkles, 
  Eye, 
  ArrowLeft,
  Palette,
  Search,
  Calendar,
  Target,
  Volume2,
  VolumeX
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { DashboardSection } from '@/components/DashboardSection';
import { FadeIn, PulseAlert, StaggerContainer, StaggerItem, HoverLift, CountUp } from '@/components/ui/animations';

interface DisasterLensProject {
  id: string;
  name: string;
  type: 'storm' | 'flood' | 'fire' | 'earthquake' | 'hurricane';
  location: string;
  status: 'active' | 'completed' | 'review';
  created: string;
  images: number;
  videos: number;
  reports: number;
  team: string[];
}

interface MediaItem {
  id: string;
  type: 'photo' | 'video';
  url: string;
  thumbnail: string;
  timestamp: string;
  location: { lat: number; lng: number; address: string };
  annotations: Annotation[];
  aiAnalysis: AIAnalysis;
  tags: string[];
  project: string;
}

interface Annotation {
  id: string;
  type: 'text' | 'arrow' | 'circle' | 'measurement' | 'highlight';
  position: { x: number; y: number };
  content: string;
  color: string;
  author: string;
  timestamp: string;
}

interface AIAnalysis {
  damageAssessment: {
    severity: 'minimal' | 'moderate' | 'severe' | 'catastrophic';
    confidence: number;
    description: string;
    estimatedCost: number;
  };
  autoTags: string[];
  safetyHazards: string[];
  recommendations: string[];
  summary: string;
}

export default function DisasterLens() {
  const [activeTab, setActiveTab] = useState<'capture' | 'gallery' | 'projects' | 'reports'>('capture');
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [isAnnotating, setIsAnnotating] = useState(false);
  const [annotationMode, setAnnotationMode] = useState<'text' | 'arrow' | 'circle' | 'measurement' | 'highlight'>('text');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [newProjectModal, setNewProjectModal] = useState(false);
  
  // Voice Guide State
  const [isVoiceGuideActive, setIsVoiceGuideActive] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const { toast } = useToast();

  // Initialize voices for speech synthesis
  useEffect(() => {
    const loadVoices = () => {
      setVoices(window.speechSynthesis.getVoices());
    };

    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  // Voice Guide Function
  const startVoiceGuide = () => {
    const guideText = `Welcome to Disaster Lens, your AI-powered disaster documentation and damage assessment system. 

    Disaster Lens is designed to revolutionize how disaster response teams document, analyze, and manage recovery operations. Here's what makes it powerful:

    First, our Capture system lets you document disasters in real-time. Use your device's camera to take photos and videos directly in the field, or upload existing media files. Every capture is automatically tagged with GPS coordinates and timestamps, ensuring you never lose track of when and where damage occurred.

    Second, our AI Analysis Engine provides instant damage assessments. As soon as you capture or upload media, our advanced AI examines each image to identify damage severity, estimate repair costs, detect safety hazards, and generate automatic tags. This saves hours of manual assessment work and provides consistent, objective evaluations.

    Third, the Gallery system automatically organizes all your media by project, date, and location. You can add annotations, markup photos with arrows and highlights, and collaborate with team members through comments and shared galleries. Everything stays organized and searchable.

    Fourth, Project Management keeps multiple disaster response operations coordinated. Track progress across different locations, manage team assignments, and monitor completion status. Each project maintains its own timeline of captured media and generated reports.

    Finally, our AI Report Generation creates comprehensive damage assessments, cost estimates, and recovery recommendations. These professional reports are perfect for insurance claims, FEMA applications, and client updates.

    Key benefits include: Automatic GPS and timestamp capture for every photo. AI-powered damage severity assessment with confidence scores. Automatic tagging and organization of media. Real-time team collaboration and communication. Professional report generation for insurance and regulatory purposes. Offline capability for remote disaster areas.

    Disaster Lens eliminates the chaos of traditional disaster documentation, replacing scattered photos, manual reports, and disorganized communication with a centralized, intelligent system that helps you respond faster and more effectively to any disaster situation.

    Select a tab to begin exploring the features, or start by creating a new project in the Capture section.`;

    if (!isVoiceGuideActive) {
      setIsVoiceGuideActive(true);
      
      const utterance = new SpeechSynthesisUtterance(guideText);
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      utterance.volume = 0.8;
      
      if (voices.length > 0) {
        utterance.voice = voices.find(voice => voice.lang.includes('en')) || voices[0];
      }
      
      utterance.onend = () => {
        setIsVoiceGuideActive(false);
      };
      
      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event);
        setIsVoiceGuideActive(false);
      };
      
      window.speechSynthesis.speak(utterance);
    } else {
      window.speechSynthesis.cancel();
      setIsVoiceGuideActive(false);
    }
  };

  // Mock data for projects
  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ['disaster-lens-projects'],
    queryFn: async () => {
      // Mock data - in real app, this would fetch from API
      return [
        {
          id: 'proj-001',
          name: 'Hurricane Alexandra - Miami Recovery',
          type: 'hurricane' as const,
          location: 'Miami-Dade County, FL',
          status: 'active' as const,
          created: '2024-03-15',
          images: 127,
          videos: 23,
          reports: 8,
          team: ['John Doe', 'Sarah Smith', 'Mike Wilson']
        },
        {
          id: 'proj-002', 
          name: 'Storm Damage Assessment - Georgia',
          type: 'storm' as const,
          location: 'Chatham County, GA',
          status: 'review' as const,
          created: '2024-03-10',
          images: 89,
          videos: 15,
          reports: 12,
          team: ['Alice Johnson', 'Bob Brown']
        },
        {
          id: 'proj-003',
          name: 'Flood Recovery Documentation',
          type: 'flood' as const,
          location: 'Jefferson County, AL',
          status: 'completed' as const,
          created: '2024-02-28',
          images: 203,
          videos: 41,
          reports: 25,
          team: ['Carol Davis', 'David Lee', 'Emma White']
        }
      ] as DisasterLensProject[];
    },
    refetchInterval: 30000,
  });

  // Mock data for media gallery
  const { data: mediaItems = [], isLoading: mediaLoading } = useQuery({
    queryKey: ['disaster-lens-media', selectedProject],
    queryFn: async () => {
      // Mock data - in real app, this would fetch from API
      return [
        {
          id: 'media-001',
          type: 'photo' as const,
          url: 'https://images.unsplash.com/photo-1574482620333-1ad17779f12e?w=600&h=400',
          thumbnail: 'https://images.unsplash.com/photo-1574482620333-1ad17779f12e?w=150&h=150',
          timestamp: '2024-03-15T10:30:00Z',
          location: { 
            lat: 25.7617, 
            lng: -80.1918, 
            address: '123 Main St, Miami, FL 33101'
          },
          annotations: [],
          aiAnalysis: {
            damageAssessment: {
              severity: 'severe' as const,
              confidence: 0.89,
              description: 'Significant roof damage with multiple missing shingles and potential structural impact',
              estimatedCost: 15000
            },
            autoTags: ['roof damage', 'storm damage', 'shingles', 'residential'],
            safetyHazards: ['Exposed electrical wiring', 'Unstable roofing materials'],
            recommendations: ['Immediate tarping required', 'Professional structural assessment needed'],
            summary: 'Severe roof damage requiring immediate attention and professional assessment'
          },
          tags: ['hurricane', 'roof', 'damage', 'priority'],
          project: 'proj-001'
        }
      ] as MediaItem[];
    },
    enabled: !!selectedProject,
  });

  // AI Analysis Mutation
  const analyzeMediaMutation = useMutation({
    mutationFn: async (mediaData: { image: string; location?: any }) => {
      return apiRequest('/api/ai/analyze-disaster-media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mediaData)
      });
    },
    onSuccess: (analysis) => {
      toast({
        title: "AI Analysis Complete",
        description: "Advanced damage assessment and recommendations generated."
      });
    },
    onError: () => {
      toast({
        title: "Analysis Failed",
        description: "Could not complete AI analysis. Please try again.",
        variant: "destructive"
      });
    }
  });

  // File Upload Mutation
  const uploadMediaMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      return apiRequest('/api/disaster-lens/upload', {
        method: 'POST',
        body: formData
      });
    },
    onSuccess: () => {
      toast({
        title: "Media Uploaded Successfully",
        description: "AI analysis has been initiated automatically."
      });
      // Refetch media
    },
    onError: () => {
      toast({
        title: "Upload Failed",
        description: "Could not upload media. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Handle file upload
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || !selectedProject) return;
    
    setIsAnalyzing(true);
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append('file', file);
      formData.append('project', selectedProject);
      formData.append('timestamp', new Date().toISOString());
      
      // Get GPS coordinates if available
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
          formData.append('lat', position.coords.latitude.toString());
          formData.append('lng', position.coords.longitude.toString());
        });
      }
      
      await uploadMediaMutation.mutateAsync(formData);
    }
    
    setIsAnalyzing(false);
  };

  // Start camera capture
  const startCameraCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' }, 
        audio: false 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCapturing(true);
      }
    } catch (error) {
      toast({
        title: "Camera Access Denied",
        description: "Please allow camera permissions to capture photos.",
        variant: "destructive"
      });
    }
  };

  // Take photo
  const takePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext('2d');
    
    if (context) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0);
      
      // Convert to blob and upload
      canvas.toBlob(async (blob) => {
        if (blob && selectedProject) {
          const formData = new FormData();
          formData.append('file', blob, `capture-${Date.now()}.jpg`);
          formData.append('project', selectedProject);
          formData.append('timestamp', new Date().toISOString());
          
          // Add GPS coordinates
          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((position) => {
              formData.append('lat', position.coords.latitude.toString());
              formData.append('lng', position.coords.longitude.toString());
            });
          }
          
          setIsAnalyzing(true);
          await uploadMediaMutation.mutateAsync(formData);
          setIsAnalyzing(false);
        }
      }, 'image/jpeg', 0.8);
    }
  };

  // Generate AI Report
  const generateAIReport = async (projectId: string) => {
    try {
      const report = await apiRequest('/api/ai/generate-disaster-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId })
      });
      
      toast({
        title: "AI Report Generated",
        description: "Comprehensive damage assessment report is ready for review."
      });
      
      // Download or display report
    } catch (error) {
      toast({
        title: "Report Generation Failed",
        description: "Could not generate AI report. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <DashboardSection
      title="Disaster Lens"
      description="AI-powered disaster documentation and damage assessment with real-time collaboration and automated reporting"
      icon={Camera}
      badge={{ text: `${projects.length} ACTIVE PROJECTS`, variant: 'default' }}
      kpis={[
        { label: 'Total Projects', value: projects.length, change: '+2 this week', color: 'blue', testId: 'text-total-projects' },
        { label: 'Photos Captured', value: projects.reduce((sum, p) => sum + p.images, 0), change: '+127 today', color: 'green', testId: 'text-photos-captured' },
        { label: 'AI Reports Generated', value: projects.reduce((sum, p) => sum + p.reports, 0), change: '+5 today', color: 'blue', testId: 'text-reports-generated' },
        { label: 'Team Members', value: new Set(projects.flatMap(p => p.team)).size, change: 'Active now', color: 'green', testId: 'text-team-members' }
      ]}
      actions={[
        { icon: Camera, label: 'Capture', variant: 'default', testId: 'button-capture', onClick: () => setActiveTab('capture') },
        { icon: Image, label: 'Gallery', variant: 'outline', testId: 'button-gallery', onClick: () => setActiveTab('gallery') },
        { icon: FileText, label: 'Projects', variant: 'outline', testId: 'button-projects', onClick: () => setActiveTab('projects') },
        { icon: Bot, label: 'AI Reports', variant: 'outline', testId: 'button-ai-reports', onClick: () => setActiveTab('reports') },
        { 
          icon: isVoiceGuideActive ? VolumeX : Volume2, 
          label: isVoiceGuideActive ? 'Stop Guide' : 'Voice Guide', 
          variant: 'outline', 
          testId: 'button-voice-guide',
          onClick: startVoiceGuide,
          'aria-label': 'Voice guide for Disaster Lens',
          'aria-pressed': isVoiceGuideActive
        }
      ]}
      testId="disaster-lens-section"
    >
      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg mb-6">
        {[
          { id: 'capture', label: 'Capture', icon: Camera },
          { id: 'gallery', label: 'Gallery', icon: Image },
          { id: 'projects', label: 'Projects', icon: FileText },
          { id: 'reports', label: 'AI Reports', icon: Bot }
        ].map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab(tab.id as any)}
            className="flex-1"
            data-testid={`tab-${tab.id}`}
          >
            <tab.icon className="w-4 h-4 mr-2" />
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Capture Tab */}
      {activeTab === 'capture' && (
        <div className="space-y-6">
          {/* Project Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="h-5 w-5 text-blue-500 mr-2" />
                Active Project
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedProject || ''} onValueChange={setSelectedProject}>
                <SelectTrigger data-testid="select-project">
                  <SelectValue placeholder="Select a project to capture media" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name} - {project.location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedProject && (
                <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    {projects.find(p => p.id === selectedProject)?.name}
                  </div>
                  <div className="text-xs text-blue-600 dark:text-blue-300">
                    {projects.find(p => p.id === selectedProject)?.location}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Capture Methods */}
          {selectedProject && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Live Camera Capture */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <Camera className="h-5 w-5 text-green-500 mr-2" />
                    Live Camera
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!isCapturing ? (
                    <Button 
                      onClick={startCameraCapture}
                      className="w-full"
                      data-testid="button-start-camera"
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      Start Camera
                    </Button>
                  ) : (
                    <div className="space-y-3">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="w-full rounded-lg"
                        style={{ maxHeight: '200px' }}
                      />
                      <div className="flex space-x-2">
                        <Button 
                          onClick={takePhoto}
                          disabled={isAnalyzing}
                          className="flex-1"
                          data-testid="button-take-photo"
                        >
                          <Camera className="w-4 h-4 mr-2" />
                          {isAnalyzing ? 'Analyzing...' : 'Capture'}
                        </Button>
                        <Button 
                          variant="outline"
                          onClick={() => {
                            setIsCapturing(false);
                            if (videoRef.current?.srcObject) {
                              const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
                              tracks.forEach(track => track.stop());
                            }
                          }}
                          data-testid="button-stop-camera"
                        >
                          Stop
                        </Button>
                      </div>
                    </div>
                  )}
                  <canvas ref={canvasRef} style={{ display: 'none' }} />
                </CardContent>
              </Card>

              {/* File Upload */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <Upload className="h-5 w-5 text-blue-500 mr-2" />
                    Upload Media
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    onChange={(e) => handleFileUpload(e.target.files)}
                    className="hidden"
                  />
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    className="w-full"
                    disabled={uploadMediaMutation.isPending}
                    data-testid="button-upload-files"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {uploadMediaMutation.isPending ? 'Uploading...' : 'Upload Photos/Videos'}
                  </Button>
                  <div className="text-xs text-gray-500 text-center">
                    GPS coordinates and timestamp will be automatically captured
                  </div>
                </CardContent>
              </Card>

              {/* Voice Annotations */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <MessageSquare className="h-5 w-5 text-purple-500 mr-2" />
                    Voice Notes
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    data-testid="button-voice-note"
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Record Voice Note
                  </Button>
                  <div className="text-xs text-gray-500 text-center">
                    Add verbal damage descriptions and observations
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* AI Processing Status */}
          {isAnalyzing && (
            <Card>
              <CardContent className="py-6">
                <div className="flex items-center justify-center space-x-3">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  >
                    <Sparkles className="h-6 w-6 text-blue-500" />
                  </motion.div>
                  <div>
                    <div className="font-medium text-blue-900 dark:text-blue-100">
                      AI Analysis in Progress
                    </div>
                    <div className="text-sm text-blue-600 dark:text-blue-300">
                      Analyzing damage, generating tags, and assessing safety hazards...
                    </div>
                  </div>
                </div>
                <Progress value={45} className="mt-3" />
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Gallery Tab - Shows captured media with AI analysis */}
      {activeTab === 'gallery' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold">Media Gallery</h3>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" data-testid="button-filter-media">
                <Search className="w-4 h-4 mr-2" />
                Filter
              </Button>
              <Button variant="outline" size="sm" data-testid="button-sort-media">
                <Calendar className="w-4 h-4 mr-2" />
                Sort by Date
              </Button>
            </div>
          </div>

          {selectedProject ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mediaItems.map((item) => (
                <Card key={item.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                  <div className="relative">
                    <img
                      src={item.thumbnail}
                      alt="Captured media"
                      className="w-full h-48 object-cover rounded-t-lg"
                      onClick={() => setSelectedMedia(item)}
                      data-testid={`media-item-${item.id}`}
                    />
                    <Badge
                      variant={item.aiAnalysis.damageAssessment.severity === 'severe' ? 'destructive' : 'default'}
                      className="absolute top-2 left-2"
                    >
                      {item.aiAnalysis.damageAssessment.severity.toUpperCase()}
                    </Badge>
                    <div className="absolute top-2 right-2 flex space-x-1">
                      <Badge variant="secondary" className="text-xs">
                        <MapPin className="w-3 h-3 mr-1" />
                        GPS
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        <Bot className="w-3 h-3 mr-1" />
                        AI
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div className="text-sm font-medium">
                        {new Date(item.timestamp).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {item.annotations.length} annotations
                      </div>
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                      {item.location.address}
                    </div>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {item.aiAnalysis.autoTags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="text-sm font-medium text-green-600">
                        ${item.aiAnalysis.damageAssessment.estimatedCost.toLocaleString()}
                      </div>
                      <Button size="sm" variant="outline" data-testid={`button-edit-${item.id}`}>
                        <Edit3 className="w-3 h-3 mr-1" />
                        Annotate
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Image className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <div className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Select a Project
                </div>
                <div className="text-gray-500 dark:text-gray-400">
                  Choose a project from the capture tab to view its media gallery
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Projects Tab - Project management */}
      {activeTab === 'projects' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold">Active Projects</h3>
            <Button data-testid="button-new-project">
              <FileText className="w-4 h-4 mr-2" />
              New Project
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {projects.map((project) => (
              <Card key={project.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{project.name}</CardTitle>
                      <div className="text-sm text-gray-500 flex items-center mt-1">
                        <MapPin className="w-3 h-3 mr-1" />
                        {project.location}
                      </div>
                    </div>
                    <Badge 
                      variant={project.status === 'active' ? 'default' : project.status === 'completed' ? 'secondary' : 'destructive'}
                    >
                      {project.status.toUpperCase()}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{project.images}</div>
                      <div className="text-xs text-gray-500">Photos</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{project.videos}</div>
                      <div className="text-xs text-gray-500">Videos</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{project.reports}</div>
                      <div className="text-xs text-gray-500">Reports</div>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <div className="text-sm font-medium mb-2">Team Members</div>
                    <div className="flex flex-wrap gap-1">
                      {project.team.map((member) => (
                        <Badge key={member} variant="outline" className="text-xs">
                          {member}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="text-xs text-gray-500">
                      Created {new Date(project.created).toLocaleDateString()}
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setSelectedProject(project.id)}
                        data-testid={`button-view-project-${project.id}`}
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        View
                      </Button>
                      <Button 
                        size="sm"
                        onClick={() => generateAIReport(project.id)}
                        data-testid={`button-generate-report-${project.id}`}
                      >
                        <Bot className="w-3 h-3 mr-1" />
                        AI Report
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* AI Reports Tab */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div className="text-center py-12">
            <Bot className="h-16 w-16 text-blue-500 mx-auto mb-4" />
            <h3 className="text-2xl font-semibold mb-2">AI-Powered Disaster Reports</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Generate comprehensive damage assessments, cost estimates, and recovery recommendations using advanced AI analysis
            </p>
            <Button size="lg" data-testid="button-generate-comprehensive-report">
              <Sparkles className="w-5 h-5 mr-2" />
              Generate Comprehensive Report
            </Button>
          </div>
        </div>
      )}
    </DashboardSection>
  );
}