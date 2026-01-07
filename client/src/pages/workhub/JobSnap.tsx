import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {
  Camera, Video, Upload, Image, FileImage, Clock, MapPin, Calendar,
  CheckCircle, AlertCircle, Plus, ArrowLeft, Volume2, VolumeX,
  Folder, Tag, Share2, Download, Trash2, Eye, Play, Pause, X,
  Layers, FileText, Shield, Sparkles, Loader2
} from 'lucide-react';
import TopNav from '@/components/TopNav';
import ModuleAIAssistant from '@/components/ModuleAIAssistant';
import TeamInvite from '@/components/TeamInvite';
import BeforeAfterComparison from '@/components/BeforeAfterComparison';
import AIVideoGenerator from '@/components/AIVideoGenerator';
import { Users, Film, SplitSquareHorizontal } from 'lucide-react';

interface JobProject {
  id: string;
  name: string;
  address: string;
  customerName: string;
  serviceType: string;
  createdAt: string;
  status: 'active' | 'completed' | 'archived';
  mediaCount: number;
}

interface MediaItem {
  id: string;
  projectId: string;
  type: 'photo' | 'video';
  url: string;
  thumbnail: string;
  caption?: string;
  phase: 'before' | 'during' | 'after';
  createdAt: string;
  location?: string;
  tags: string[];
}

export default function JobSnap() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('capture');
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [selectedProject, setSelectedProject] = useState<JobProject | null>(null);
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturePhase, setCapturePhase] = useState<'before' | 'during' | 'after'>('before');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'customerName' | 'address'>('customerName');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const sampleProjects: JobProject[] = [
    {
      id: 'proj-001',
      name: 'Kitchen Remodel - Johnson',
      address: '123 Oak Street, Atlanta, GA',
      customerName: 'Sarah Johnson',
      serviceType: 'Remodeling',
      createdAt: new Date().toISOString(),
      status: 'active',
      mediaCount: 24,
    },
    {
      id: 'proj-002',
      name: 'Tree Removal - Thompson',
      address: '456 Maple Ave, Atlanta, GA',
      customerName: 'Mike Thompson',
      serviceType: 'Tree Service',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      status: 'active',
      mediaCount: 15,
    },
    {
      id: 'proj-003',
      name: 'Exterior Painting - Chen',
      address: '789 Pine Road, Atlanta, GA',
      customerName: 'Lisa Chen',
      serviceType: 'Painting',
      createdAt: new Date(Date.now() - 172800000).toISOString(),
      status: 'completed',
      mediaCount: 42,
    },
  ];

  const sampleMedia: MediaItem[] = [
    { id: 'm1', projectId: 'proj-001', type: 'photo', url: 'https://picsum.photos/seed/job1/800/600', thumbnail: 'https://picsum.photos/seed/job1/200/150', phase: 'before', createdAt: new Date().toISOString(), tags: ['kitchen', 'cabinets'] },
    { id: 'm2', projectId: 'proj-001', type: 'photo', url: 'https://picsum.photos/seed/job2/800/600', thumbnail: 'https://picsum.photos/seed/job2/200/150', phase: 'before', createdAt: new Date().toISOString(), tags: ['kitchen', 'countertop'] },
    { id: 'm3', projectId: 'proj-001', type: 'photo', url: 'https://picsum.photos/seed/job3/800/600', thumbnail: 'https://picsum.photos/seed/job3/200/150', phase: 'during', createdAt: new Date().toISOString(), tags: ['demo', 'progress'] },
    { id: 'm4', projectId: 'proj-001', type: 'photo', url: 'https://picsum.photos/seed/job4/800/600', thumbnail: 'https://picsum.photos/seed/job4/200/150', phase: 'after', createdAt: new Date().toISOString(), tags: ['completed', 'final'] },
  ];

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
        speakGuidance("Welcome to JobSnap! I'm Evelyn... your job documentation assistant. Capture photos and videos of every project... organized by before, during, and after phases. Your media is timestamped and geotagged for complete job records that protect you and impress your customers.");
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

  const toggleVoice = () => {
    if (isVoiceActive) {
      window.speechSynthesis.cancel();
      setIsVoiceActive(false);
    } else {
      speakGuidance("JobSnap helps you document every job professionally. Select or create a project... choose the work phase... then capture photos or videos. Everything is automatically organized with timestamps and location data. This creates a complete record for disputes... customer satisfaction... and your portfolio.");
    }
  };

  const handleStartCapture = async () => {
    if (!selectedProject) {
      toast({
        title: 'Select a project first',
        description: 'Please choose or create a project before capturing media',
        variant: 'destructive',
      });
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCapturing(true);
        speakGuidance(`Camera ready for ${capturePhase} photos. Frame your shot and tap capture.`);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast({
        title: 'Camera access denied',
        description: 'Please allow camera access to capture photos',
        variant: 'destructive',
      });
    }
  };

  const handleStopCapture = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsCapturing(false);
    }
  };

  const handleTakePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
        setUploadedFiles(prev => [...prev, file]);
        const url = URL.createObjectURL(blob);
        setPreviewUrls(prev => [...prev, url]);
        speakGuidance('Photo captured! Keep shooting or upload when ready.');
        toast({
          title: 'Photo captured',
          description: `Saved as ${capturePhase} phase photo`,
        });
      }
    }, 'image/jpeg', 0.9);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setUploadedFiles(prev => [...prev, ...files]);
    const newUrls = files.map(file => URL.createObjectURL(file));
    setPreviewUrls(prev => [...prev, ...newUrls]);
    speakGuidance(`${files.length} files added. Ready to upload to your project.`);
  };

  const handleUploadToProject = () => {
    if (!selectedProject || uploadedFiles.length === 0) return;
    
    speakGuidance(`Uploading ${uploadedFiles.length} files to ${selectedProject.name}... with ${capturePhase} phase tags.`);
    
    setTimeout(() => {
      toast({
        title: 'Upload complete',
        description: `${uploadedFiles.length} files added to ${selectedProject.name}`,
      });
      setUploadedFiles([]);
      setPreviewUrls([]);
    }, 2000);
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'before': return 'bg-blue-500';
      case 'during': return 'bg-amber-500';
      case 'after': return 'bg-emerald-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900">
      <TopNav />
      
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <Link 
              to="/workhub" 
              className="inline-flex items-center text-purple-300 hover:text-purple-200 mb-4 transition-colors"
              data-testid="link-back-workhub"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to WorkHub
            </Link>
            <h1 className="text-4xl font-bold text-white mb-2">JobSnap</h1>
            <p className="text-purple-200">Document every job with professional photos and videos</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={toggleVoice}
              className={`${isVoiceActive ? 'bg-purple-500 text-white' : 'border-purple-500 text-purple-400'} hover:bg-purple-600`}
              data-testid="button-toggle-voice"
            >
              {isVoiceActive ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
            </Button>
            <Button 
              onClick={() => setIsProjectDialogOpen(true)}
              className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white font-semibold shadow-lg"
              data-testid="button-new-project"
            >
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-white/10 backdrop-blur border-purple-500/30">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-200">Active Projects</p>
                  <p className="text-3xl font-bold text-white" data-testid="text-active-projects">
                    {sampleProjects.filter(p => p.status === 'active').length}
                  </p>
                </div>
                <Folder className="h-8 w-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur border-purple-500/30">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-200">Total Photos</p>
                  <p className="text-3xl font-bold text-white" data-testid="text-total-photos">
                    {sampleProjects.reduce((sum, p) => sum + p.mediaCount, 0)}
                  </p>
                </div>
                <Image className="h-8 w-8 text-indigo-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur border-purple-500/30">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-200">Completed Jobs</p>
                  <p className="text-3xl font-bold text-white" data-testid="text-completed-jobs">
                    {sampleProjects.filter(p => p.status === 'completed').length}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-emerald-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur border-purple-500/30">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-200">This Week</p>
                  <p className="text-3xl font-bold text-white" data-testid="text-this-week">12</p>
                </div>
                <Calendar className="h-8 w-8 text-amber-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {selectedProject && (
          <Card className="bg-gradient-to-r from-purple-500/20 to-indigo-500/20 border-purple-400/50">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-500/30 rounded-lg">
                    <Folder className="h-6 w-6 text-purple-300" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{selectedProject.name}</h3>
                    <p className="text-purple-200 text-sm">{selectedProject.address}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  onClick={() => setSelectedProject(null)}
                  className="text-purple-300 hover:text-white"
                  data-testid="button-clear-project"
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-white/10 border-purple-500/30">
            <TabsTrigger value="capture" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white" data-testid="tab-capture">
              <Camera className="h-4 w-4 mr-2" />
              Capture
            </TabsTrigger>
            <TabsTrigger value="projects" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white" data-testid="tab-projects">
              <Folder className="h-4 w-4 mr-2" />
              Projects
            </TabsTrigger>
            <TabsTrigger value="gallery" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white" data-testid="tab-gallery">
              <Layers className="h-4 w-4 mr-2" />
              Gallery
            </TabsTrigger>
            <TabsTrigger value="reports" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white" data-testid="tab-reports">
              <FileText className="h-4 w-4 mr-2" />
              Reports
            </TabsTrigger>
            <TabsTrigger value="team" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white" data-testid="tab-team">
              <Users className="h-4 w-4 mr-2" />
              Team
            </TabsTrigger>
          </TabsList>

          <TabsContent value="capture" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white/10 backdrop-blur border-purple-500/30">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Camera className="h-5 w-5 text-purple-400" />
                    Camera Capture
                  </CardTitle>
                  <CardDescription className="text-purple-200">
                    Take photos directly from your device camera
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-purple-200">Work Phase</Label>
                    <div className="flex gap-2 mt-2">
                      {(['before', 'during', 'after'] as const).map((phase) => (
                        <Button
                          key={phase}
                          variant={capturePhase === phase ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => {
                            setCapturePhase(phase);
                            speakGuidance(`Now capturing ${phase} photos.`);
                          }}
                          className={capturePhase === phase 
                            ? `${getPhaseColor(phase)} text-white` 
                            : 'border-purple-500/50 text-purple-300'
                          }
                          data-testid={`button-phase-${phase}`}
                        >
                          {phase.charAt(0).toUpperCase() + phase.slice(1)}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="aspect-video bg-black/50 rounded-lg overflow-hidden relative">
                    <video
                      ref={videoRef}
                      autoPlay
                      muted
                      playsInline
                      className="w-full h-full object-cover"
                      data-testid="video-preview"
                    />
                    <canvas ref={canvasRef} className="hidden" />
                    {!isCapturing && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <p className="text-purple-300">Camera preview will appear here</p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {!isCapturing ? (
                      <Button
                        onClick={handleStartCapture}
                        className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white"
                        data-testid="button-start-camera"
                      >
                        <Camera className="h-4 w-4 mr-2" />
                        Start Camera
                      </Button>
                    ) : (
                      <>
                        <Button
                          onClick={handleTakePhoto}
                          className="flex-1 bg-purple-500 hover:bg-purple-600 text-white"
                          data-testid="button-take-photo"
                        >
                          <Camera className="h-4 w-4 mr-2" />
                          Capture Photo
                        </Button>
                        <Button
                          onClick={handleStopCapture}
                          variant="outline"
                          className="border-red-500 text-red-400 hover:bg-red-500/10"
                          data-testid="button-stop-camera"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur border-purple-500/30">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Upload className="h-5 w-5 text-indigo-400" />
                    Upload Files
                  </CardTitle>
                  <CardDescription className="text-purple-200">
                    Upload existing photos and videos from your device
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div
                    className="border-2 border-dashed border-purple-500/50 rounded-lg p-8 text-center hover:border-purple-400 transition-colors cursor-pointer"
                    onClick={() => document.getElementById('file-upload')?.click()}
                  >
                    <Upload className="h-12 w-12 mx-auto text-purple-400 mb-4" />
                    <p className="text-purple-200 mb-2">Drop files here or click to upload</p>
                    <p className="text-purple-400 text-sm">Supports JPG, PNG, MP4</p>
                    <input
                      id="file-upload"
                      type="file"
                      accept="image/*,video/*"
                      multiple
                      className="hidden"
                      onChange={handleFileUpload}
                      data-testid="input-file-upload"
                    />
                  </div>

                  {previewUrls.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-purple-200 text-sm">{previewUrls.length} files ready</p>
                        <Badge className={getPhaseColor(capturePhase)}>{capturePhase} phase</Badge>
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        {previewUrls.map((url, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={url}
                              alt={`Preview ${index + 1}`}
                              className="w-full aspect-square object-cover rounded-lg"
                            />
                            <button
                              onClick={() => removeFile(index)}
                              className="absolute top-1 right-1 p-1 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="h-3 w-3 text-white" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <Button
                        onClick={handleUploadToProject}
                        disabled={!selectedProject}
                        className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white"
                        data-testid="button-upload-files"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload to Project
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="projects" className="space-y-4">
            <Card className="bg-white/10 backdrop-blur border-purple-500/30">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white">Your Projects</CardTitle>
                    <CardDescription className="text-purple-200">
                      Select a project to capture media for
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-purple-300 text-sm">Sort by:</span>
                    <Button
                      variant={sortBy === 'customerName' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSortBy('customerName')}
                      className={sortBy === 'customerName' ? 'bg-purple-500 text-white' : 'border-purple-500/50 text-purple-300'}
                      data-testid="button-sort-customer"
                    >
                      Customer Name
                    </Button>
                    <Button
                      variant={sortBy === 'address' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSortBy('address')}
                      className={sortBy === 'address' ? 'bg-purple-500 text-white' : 'border-purple-500/50 text-purple-300'}
                      data-testid="button-sort-address"
                    >
                      Address
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[...sampleProjects].sort((a, b) => 
                    sortBy === 'customerName' 
                      ? a.customerName.localeCompare(b.customerName)
                      : a.address.localeCompare(b.address)
                  ).map((project) => (
                    <Card
                      key={project.id}
                      className={`bg-white/5 border-purple-500/20 hover:bg-white/10 transition-all cursor-pointer ${
                        selectedProject?.id === project.id ? 'ring-2 ring-purple-400' : ''
                      }`}
                      onClick={() => {
                        setSelectedProject(project);
                        speakGuidance(`Selected ${project.name}. You can now capture photos for this job.`);
                      }}
                      data-testid={`card-project-${project.id}`}
                    >
                      <CardContent className="py-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`p-2 rounded-lg ${project.status === 'completed' ? 'bg-emerald-500/20' : 'bg-purple-500/20'}`}>
                              <Folder className={`h-5 w-5 ${project.status === 'completed' ? 'text-emerald-400' : 'text-purple-400'}`} />
                            </div>
                            <div>
                              <h3 className="text-white font-medium">{project.name}</h3>
                              <p className="text-purple-300 text-sm">{project.address}</p>
                              <div className="flex items-center gap-3 mt-1 text-xs text-purple-400">
                                <span>{project.serviceType}</span>
                                <span>•</span>
                                <span>{project.mediaCount} photos</span>
                                <span>•</span>
                                <Badge variant="outline" className={project.status === 'completed' ? 'text-emerald-400 border-emerald-400' : 'text-purple-400 border-purple-400'}>
                                  {project.status}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          {selectedProject?.id === project.id && (
                            <CheckCircle className="h-6 w-6 text-purple-400" />
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="gallery" className="space-y-4">
            <Card className="bg-white/10 backdrop-blur border-purple-500/30">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white">Media Gallery</CardTitle>
                    <CardDescription className="text-purple-200">
                      View and organize all your job photos
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {(['before', 'during', 'after'] as const).map((phase) => (
                      <Badge key={phase} className={`${getPhaseColor(phase)} cursor-pointer`}>
                        {phase}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {sampleMedia.map((media) => (
                    <div key={media.id} className="relative group">
                      <img
                        src={media.thumbnail}
                        alt="Job photo"
                        className="w-full aspect-square object-cover rounded-lg"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                        <Button size="icon" variant="ghost" className="text-white hover:bg-white/20">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="text-white hover:bg-white/20">
                          <Share2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <Badge className={`absolute top-2 left-2 ${getPhaseColor(media.phase)} text-xs`}>
                        {media.phase}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            <Card className="bg-white/10 backdrop-blur border-purple-500/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <FileText className="h-5 w-5 text-purple-400" />
                  Job Reports
                </CardTitle>
                <CardDescription className="text-purple-200">
                  Generate professional reports from your job documentation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="bg-white/5 border-purple-500/20">
                    <CardContent className="py-6 text-center">
                      <Shield className="h-12 w-12 mx-auto text-emerald-400 mb-4" />
                      <h3 className="text-white font-semibold mb-2">Dispute Protection Report</h3>
                      <p className="text-purple-300 text-sm mb-4">Complete before/after documentation with timestamps</p>
                      <Button className="bg-emerald-500 hover:bg-emerald-600 text-white" data-testid="button-generate-dispute-report">
                        <Download className="h-4 w-4 mr-2" />
                        Generate Report
                      </Button>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-white/5 border-purple-500/20">
                    <CardContent className="py-6 text-center">
                      <Sparkles className="h-12 w-12 mx-auto text-amber-400 mb-4" />
                      <h3 className="text-white font-semibold mb-2">Portfolio Showcase</h3>
                      <p className="text-purple-300 text-sm mb-4">Share your best work with potential customers</p>
                      <Button className="bg-amber-500 hover:bg-amber-600 text-white" data-testid="button-generate-portfolio">
                        <Share2 className="h-4 w-4 mr-2" />
                        Create Showcase
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="team" className="space-y-4">
            <TeamInvite 
              projectId={selectedProject?.id}
              projectName={selectedProject?.name}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <BeforeAfterComparison 
                photos={sampleMedia.map(m => ({
                  id: m.id,
                  url: m.url,
                  thumbnail: m.thumbnail,
                  phase: m.phase,
                  timestamp: m.createdAt,
                  location: m.location
                }))}
                projectName={selectedProject?.name}
              />
              
              <AIVideoGenerator 
                photos={sampleMedia.map(m => ({
                  id: m.id,
                  url: m.url,
                  thumbnail: m.thumbnail,
                  phase: m.phase,
                  timestamp: m.createdAt,
                  caption: m.caption
                }))}
                projectName={selectedProject?.name}
              />
            </div>
          </TabsContent>
        </Tabs>

        <Dialog open={isProjectDialogOpen} onOpenChange={setIsProjectDialogOpen}>
          <DialogContent className="max-w-md bg-slate-900 border-purple-500/30 text-white">
            <DialogHeader>
              <DialogTitle className="text-white">Create New Project</DialogTitle>
              <DialogDescription className="text-purple-200">
                Start documenting a new job
              </DialogDescription>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const newProject: JobProject = {
                  id: `proj-${Date.now()}`,
                  name: formData.get('name') as string,
                  address: formData.get('address') as string,
                  customerName: formData.get('customerName') as string,
                  serviceType: formData.get('serviceType') as string,
                  createdAt: new Date().toISOString(),
                  status: 'active',
                  mediaCount: 0,
                };
                setSelectedProject(newProject);
                setIsProjectDialogOpen(false);
                speakGuidance(`Project created! Now capturing for ${newProject.name}.`);
                toast({
                  title: 'Project created',
                  description: `${newProject.name} is ready for documentation`,
                });
              }}
              className="space-y-4"
            >
              <div>
                <Label className="text-purple-200">Project Name</Label>
                <Input
                  name="name"
                  required
                  className="bg-white/10 border-purple-500/30 text-white"
                  placeholder="Kitchen Remodel - Smith"
                  data-testid="input-project-name"
                />
              </div>
              <div>
                <Label className="text-purple-200">Customer Name</Label>
                <Input
                  name="customerName"
                  required
                  className="bg-white/10 border-purple-500/30 text-white"
                  placeholder="John Smith"
                  data-testid="input-customer-name"
                />
              </div>
              <div>
                <Label className="text-purple-200">Address</Label>
                <Input
                  name="address"
                  required
                  className="bg-white/10 border-purple-500/30 text-white"
                  placeholder="123 Main St, City, State"
                  data-testid="input-project-address"
                />
              </div>
              <div>
                <Label className="text-purple-200">Service Type</Label>
                <Input
                  name="serviceType"
                  required
                  className="bg-white/10 border-purple-500/30 text-white"
                  placeholder="Painting, Roofing, etc."
                  data-testid="input-service-type"
                />
              </div>
              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsProjectDialogOpen(false)}
                  className="border-slate-500 text-slate-300"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white"
                  data-testid="button-create-project"
                >
                  Create Project
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <ModuleAIAssistant 
        moduleName="JobSnap" 
        moduleContext="Job documentation tool for contractors to capture and organize before, during, and after photos of their work with timestamps and location data"
      />
    </div>
  );
}
