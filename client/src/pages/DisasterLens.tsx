import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Camera, 
  Video, 
  Plus,
  FolderOpen,
  MapPin, 
  Clock, 
  MessageSquare, 
  Users, 
  FileText, 
  Share2,
  Download,
  Upload,
  Play,
  Square,
  Circle,
  Zap,
  Bot,
  Eye,
  ArrowLeft,
  Settings,
  Filter,
  Search,
  Calendar,
  Tag,
  CheckSquare,
  Edit3,
  Save,
  Trash2
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Types matching the specification
interface Project {
  id: string;
  name: string;
  orgId: string;
  address?: string;
  coords?: { lat: number; lng: number };
  tags: string[];
  status: 'active' | 'completed' | 'archived';
  createdAt: Date;
  updatedAt: Date;
  mediaCount: number;
  teamMembers: string[];
}

interface MediaItem {
  id: string;
  projectId: string;
  userId: string;
  type: 'photo' | 'video';
  fileName: string;
  originalName: string;
  url: string;
  thumbnailUrl?: string;
  
  // Auto-stamped metadata
  capturedAt: Date;
  coords?: { lat: number; lng: number; accuracy?: number };
  deviceInfo?: { userAgent: string; platform?: string };
  
  // EXIF and technical data
  exifData?: Record<string, any>;
  dimensions?: { width: number; height: number };
  fileSize: number;
  
  // Content analysis
  aiAnalysis?: {
    caption?: string;
    tags: string[];
    hazards: string[];
    confidence?: number;
  };
  
  // User annotations
  annotations: Annotation[];
  tags: string[];
  isRedacted: boolean;
  chainOfCustodyHash?: string;
}

interface Annotation {
  type: 'draw' | 'arrow' | 'text' | 'measure' | 'blur';
  data: Record<string, any>;
  createdBy: string;
  createdAt: Date;
}

interface Task {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  assignedTo?: string;
  status: 'pending' | 'in_progress' | 'completed';
  requiresPhoto: boolean;
  requiredPhotos: number;
  attachedMedia: string[];
  dueDate?: Date;
  createdAt: Date;
  completedAt?: Date;
}

// Camera Capture Component
const CameraCapture: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onCapture: (file: File, type: 'photo' | 'video') => void;
  currentProject: Project | null;
}> = ({ isOpen, onClose, onCapture, currentProject }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  
  const [isStreaming, setIsStreaming] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [mode, setMode] = useState<'photo' | 'video'>('photo');
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | null>(null);

  const { toast } = useToast();

  // Get user's location
  useEffect(() => {
    if (isOpen && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.warn('Geolocation error:', error);
        }
      );
    }
  }, [isOpen]);

  const startStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: mode === 'video'
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsStreaming(true);
      }
    } catch (err) {
      toast({
        title: "Camera Error",
        description: "Failed to access camera: " + (err as Error).message,
        variant: "destructive"
      });
    }
  };
  
  const stopStream = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsStreaming(false);
    }
  };
  
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);
    
    canvas.toBlob((blob) => {
      if (blob) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const projectName = currentProject?.name.replace(/[^a-zA-Z0-9]/g, '_') || 'unknown';
        const fileName = `${projectName}_photo_${timestamp}.jpg`;
        const file = new File([blob], fileName, { type: 'image/jpeg' });
        onCapture(file, 'photo');
        toast({
          title: "Photo Captured",
          description: `Photo saved to ${currentProject?.name || 'current project'}`
        });
      }
    }, 'image/jpeg', 0.9);
  };

  const startVideoRecording = () => {
    if (!videoRef.current?.srcObject) return;
    
    const stream = videoRef.current.srcObject as MediaStream;
    const mediaRecorder = new MediaRecorder(stream);
    const chunks: Blob[] = [];
    
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    };
    
    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const projectName = currentProject?.name.replace(/[^a-zA-Z0-9]/g, '_') || 'unknown';
      const fileName = `${projectName}_video_${timestamp}.webm`;
      const file = new File([blob], fileName, { type: 'video/webm' });
      onCapture(file, 'video');
      toast({
        title: "Video Recorded",
        description: `Video saved to ${currentProject?.name || 'current project'}`
      });
    };
    
    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start();
    setIsRecording(true);
    
    // Recording timer
    const timer = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
    
    // Auto-stop after 5 minutes
    setTimeout(() => {
      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
        setRecordingTime(0);
        clearInterval(timer);
      }
    }, 300000);
  };
  
  const stopVideoRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setRecordingTime(0);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/90 backdrop-blur-sm">
        <Button variant="ghost" onClick={onClose} className="text-white">
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back
        </Button>
        
        <div className="text-center">
          <h2 className="text-lg font-semibold text-white">
            {currentProject?.name || 'Camera Capture'}
          </h2>
          {currentLocation && (
            <p className="text-sm text-white/70">
              📍 {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}
            </p>
          )}
        </div>

        {isRecording && (
          <div className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold animate-pulse">
            REC {formatTime(recordingTime)}
          </div>
        )}
      </div>

      {/* Video Stream */}
      <div className="flex-1 relative">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Controls */}
      <div className="p-6 bg-black/90 backdrop-blur-sm">
        <div className="flex justify-center items-center space-x-8">
          {/* Mode Toggle */}
          <div className="flex gap-2">
            <Button
              variant={mode === 'photo' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('photo')}
              className={mode === 'photo' ? 'text-black' : 'text-white border-white'}
            >
              <Camera className="w-4 h-4 mr-2" />
              Photo
            </Button>
            <Button
              variant={mode === 'video' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('video')}
              className={mode === 'video' ? 'text-black' : 'text-white border-white'}
            >
              <Video className="w-4 h-4 mr-2" />
              Video
            </Button>
          </div>

          {/* Capture Controls */}
          {!isStreaming ? (
            <Button onClick={startStream} size="lg" className="bg-blue-600 hover:bg-blue-700">
              <Camera className="w-5 h-5 mr-2" />
              Start Camera
            </Button>
          ) : (
            <>
              {mode === 'photo' ? (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={capturePhoto}
                  className="w-20 h-20 bg-white rounded-full border-4 border-white/30 flex items-center justify-center shadow-xl"
                >
                  <div className="w-16 h-16 bg-gray-100 rounded-full" />
                </motion.button>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={isRecording ? stopVideoRecording : startVideoRecording}
                  className={`w-20 h-20 ${
                    isRecording ? 'bg-red-500' : 'bg-white'
                  } rounded-full border-4 border-white/30 flex items-center justify-center shadow-xl`}
                >
                  {isRecording ? (
                    <Square className="w-8 h-8 text-white" />
                  ) : (
                    <Circle className="w-8 h-8 text-red-500" />
                  )}
                </motion.button>
              )}
              
              <Button 
                onClick={stopStream} 
                variant="outline" 
                className="text-white border-white"
              >
                <Square className="w-4 h-4 mr-2" />
                Stop
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Project Creation Modal
const ProjectModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (project: Partial<Project>) => void;
  project?: Project | null;
}> = ({ isOpen, onClose, onSave, project }) => {
  const [formData, setFormData] = useState<{
    name: string;
    address: string;
    tags: string[];
    status: 'active' | 'completed' | 'archived';
  }>({
    name: '',
    address: '',
    tags: [],
    status: 'active'
  });

  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name,
        address: project.address || '',
        tags: project.tags,
        status: project.status
      });
    } else {
      setFormData({
        name: '',
        address: '',
        tags: [],
        status: 'active'
      });
    }
  }, [project]);

  const handleSave = () => {
    if (!formData.name.trim()) return;
    
    onSave({
      ...formData,
      name: formData.name.trim(),
      address: formData.address.trim() || undefined
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
      >
        <h3 className="text-lg font-semibold mb-4">
          {project ? 'Edit Project' : 'New Project'}
        </h3>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="project-name">Project Name *</Label>
            <Input
              id="project-name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Storm damage assessment - Main St"
            />
          </div>
          
          <div>
            <Label htmlFor="project-address">Address</Label>
            <Input
              id="project-address"
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              placeholder="123 Main St, City, State 12345"
            />
          </div>
          
          <div>
            <Label htmlFor="project-status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value: 'active' | 'completed' | 'archived') => 
                setFormData(prev => ({ ...prev, status: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="flex gap-3 mt-6">
          <Button onClick={onClose} variant="outline" className="flex-1">
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            className="flex-1"
            disabled={!formData.name.trim()}
          >
            {project ? 'Update' : 'Create'} Project
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

// Main DisasterLens Component
export default function DisasterLens() {
  const [activeTab, setActiveTab] = useState('projects');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch projects from API
  const { data: projectsData, isLoading: projectsLoading, error: projectsError } = useQuery({
    queryKey: ['disaster-lense-projects', searchTerm],
    queryFn: () => fetch(`/api/disaster-lense/projects?${searchTerm ? `search=${searchTerm}` : ''}`).then(res => res.json())
  });

  const projects = projectsData?.projects || [];

  // Mutations for project operations
  const createProjectMutation = useMutation({
    mutationFn: (projectData: Partial<Project>) => 
      apiRequest('/api/disaster-lense/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectData)
      }),
    onSuccess: (data) => {
      toast({
        title: "Project Created",
        description: `${data.project.name} has been created successfully.`
      });
      queryClient.invalidateQueries({ queryKey: ['disaster-lense-projects'] });
      setIsProjectModalOpen(false);
      setSelectedProject(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create project",
        variant: "destructive"
      });
    }
  });

  const updateProjectMutation = useMutation({
    mutationFn: ({ id, ...updates }: { id: string } & Partial<Project>) =>
      apiRequest(`/api/disaster-lense/projects/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      }),
    onSuccess: (data) => {
      toast({
        title: "Project Updated",
        description: "Project has been updated successfully."
      });
      queryClient.invalidateQueries({ queryKey: ['disaster-lense-projects'] });
      setIsProjectModalOpen(false);
      setSelectedProject(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update project",
        variant: "destructive"
      });
    }
  });

  const createMediaMutation = useMutation({
    mutationFn: (mediaData: any) =>
      apiRequest('/api/disaster-lense/media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mediaData)
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['disaster-lense-projects'] });
      queryClient.invalidateQueries({ queryKey: ['disaster-lense-media'] });
    }
  });

  const handleCreateProject = (projectData: Partial<Project>) => {
    createProjectMutation.mutate(projectData);
  };

  const handleUpdateProject = (projectData: Partial<Project>) => {
    if (selectedProject) {
      updateProjectMutation.mutate({ id: selectedProject.id, ...projectData });
    }
  };

  const handleMediaCapture = (file: File, type: 'photo' | 'video') => {
    if (!selectedProject) return;

    // Create media data with auto-stamping
    const mediaData = {
      projectId: selectedProject.id,
      fileName: file.name,
      originalName: file.name,
      type,
      fileSize: file.size,
      coords: currentLocation ? {
        lat: currentLocation.lat,
        lng: currentLocation.lng,
        accuracy: 10
      } : undefined,
      deviceInfo: {
        userAgent: navigator.userAgent,
        platform: navigator.platform
      },
      userId: 'current-user' // Would come from auth context
    };

    // TODO: Upload file to storage first, then create media record
    createMediaMutation.mutate(mediaData);
    setIsCameraOpen(false);
  };

  // Projects are already filtered by search term via API query
  const filteredProjects = projects;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Disaster Lense
            </h1>
            <p className="text-gray-600">
              Professional photo & video documentation for storm response
            </p>
          </div>
          
          <Button
            onClick={() => setIsProjectModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700"
            data-testid="button-new-project"
          >
            <Plus className="w-5 h-5 mr-2" />
            New Project
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="projects" className="flex items-center gap-2">
              <FolderOpen className="w-4 h-4" />
              Projects
            </TabsTrigger>
            <TabsTrigger value="media" className="flex items-center gap-2">
              <Camera className="w-4 h-4" />
              Media
            </TabsTrigger>
            <TabsTrigger value="tasks" className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4" />
              Tasks
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Reports
            </TabsTrigger>
          </TabsList>

          <TabsContent value="projects" className="space-y-6">
            {/* Search & Filters */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Projects</CardTitle>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                      <Input
                        placeholder="Search projects..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 w-64"
                        data-testid="input-search-projects"
                      />
                    </div>
                    <Button variant="outline" size="sm">
                      <Filter className="w-4 h-4 mr-2" />
                      Filter
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {projectsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-500 mt-2">Loading projects...</p>
                  </div>
                ) : projectsError ? (
                  <div className="text-center py-8">
                    <p className="text-red-500">Failed to load projects</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {filteredProjects.map((project) => (
                    <motion.div
                      key={project.id}
                      whileHover={{ scale: 1.02 }}
                      className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50"
                      onClick={() => setSelectedProject(project)}
                      data-testid={`project-${project.id}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-lg">{project.name}</h3>
                            <Badge variant={
                              project.status === 'active' ? 'default' : 
                              project.status === 'completed' ? 'secondary' : 'outline'
                            }>
                              {project.status}
                            </Badge>
                          </div>
                          
                          {project.address && (
                            <div className="flex items-center gap-2 text-gray-600 mb-2">
                              <MapPin className="w-4 h-4" />
                              <span className="text-sm">{project.address}</span>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              <Camera className="w-4 h-4" />
                              {project.mediaCount} items
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              {project.teamMembers.length} members
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {project.createdAt.toLocaleDateString()}
                            </div>
                          </div>
                          
                          {project.tags.length > 0 && (
                            <div className="flex gap-2 mt-3">
                              {project.tags.map((tag) => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedProject(project);
                              setIsCameraOpen(true);
                            }}
                            className="bg-green-600 hover:bg-green-700"
                            data-testid={`button-capture-${project.id}`}
                          >
                            <Camera className="w-4 h-4 mr-2" />
                            Capture
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedProject(project);
                              setIsProjectModalOpen(true);
                            }}
                          >
                            <Edit3 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                    ))}
                  </div>
                )}
                
                {filteredProjects.length === 0 && (
                  <div className="text-center py-12">
                    <FolderOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
                    <p className="text-gray-500 mb-6">
                      {searchTerm ? 'No projects match your search.' : 'Create your first project to get started.'}
                    </p>
                    <Button onClick={() => setIsProjectModalOpen(true)}>
                      <Plus className="w-5 h-5 mr-2" />
                      Create Project
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="media">
            <Card>
              <CardHeader>
                <CardTitle>Media Library</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Camera className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No media yet</h3>
                  <p className="text-gray-500 mb-6">
                    Capture photos and videos from your projects to see them here.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tasks">
            <Card>
              <CardHeader>
                <CardTitle>Tasks & Checklists</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <CheckSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks yet</h3>
                  <p className="text-gray-500 mb-6">
                    Create tasks and checklists to organize your project workflow.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports">
            <Card>
              <CardHeader>
                <CardTitle>Reports & Documentation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No reports generated</h3>
                  <p className="text-gray-500 mb-6">
                    Generate professional reports from your captured media and annotations.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modals */}
      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => {
          setIsProjectModalOpen(false);
          setSelectedProject(null);
        }}
        onSave={selectedProject ? handleUpdateProject : handleCreateProject}
        project={selectedProject}
      />

      <CameraCapture
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleMediaCapture}
        currentProject={selectedProject}
      />
    </div>
  );
}