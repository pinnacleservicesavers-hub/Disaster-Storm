import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Share2, 
  Heart, 
  MessageCircle, 
  Users, 
  Upload, 
  Radio, 
  MapPin, 
  AlertCircle,
  Zap,
  Camera,
  Video,
  Phone,
  Mail,
  DollarSign,
  Clock,
  CheckCircle,
  Building,
  Wrench,
  GraduationCap,
  FileText,
  Home,
  Shield,
  Truck,
  User,
  Send,
  Search,
  Filter,
  Eye,
  Star,
  TrendingUp,
  Volume2,
  VolumeX,
  ArrowLeft
} from 'lucide-react';
import { DashboardSection } from '@/components/DashboardSection';
import { FadeIn, PulseAlert, StaggerContainer, StaggerItem, HoverLift } from '@/components/ui/animations';
import { getPrimaryServicePhoto, getServicePhoto } from '@/utils/photoManager';
import { z } from 'zod';
import { Link, useLocation } from 'wouter';
import type { 
  StormShareGroup, 
  HelpRequest,
  StormShareMessage,
  StormShareMediaAsset,
  StormShareAdCampaign
} from '@shared/schema';

// Form schemas
const helpRequestSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(10, 'Please provide more details'),
  category: z.string().min(1, 'Category is required'),
  address: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  zipCode: z.string().optional(),
  contactPhone: z.string().min(1, 'Phone is required'),
  contactEmail: z.string().email().optional(),
  urgencyLevel: z.enum(['normal', 'urgent', 'high', 'emergency']),
  hasInsurance: z.boolean(),
  canPayImmediately: z.boolean(),
  budgetRange: z.enum(['under_1k', '1k_5k', '5k_15k', '15k_plus']).optional(),
});

const messageSchema = z.object({
  content: z.string().min(1, 'Message cannot be empty'),
  groupId: z.string().min(1, 'Group is required'),
});

type HelpRequestForm = z.infer<typeof helpRequestSchema>;
type MessageForm = z.infer<typeof messageSchema>;

// Back button component for returning to dashboard
function BackButton() {
  return (
    <Link href="/">
      <motion.button
        whileHover={{ scale: 1.05, x: -2 }}
        whileTap={{ scale: 0.95 }}
        className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-lg hover:bg-white/20 transition-all duration-200 mb-4"
        data-testid="button-back-to-hub"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm font-medium">Back to Hub</span>
      </motion.button>
    </Link>
  );
}

export default function StormShare() {
  const [activeTab, setActiveTab] = useState('feed');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [isVoiceGuideActive, setIsVoiceGuideActive] = useState(false);
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const startVoiceGuide = async () => {
    if (!isVoiceGuideActive) {
      setIsVoiceGuideActive(true);
      setIsPlayingVoice(true);
      
      const voiceContent = `Welcome to StormShare Community Platform! This collaborative network connects storm victims, contractors, and businesses for mutual assistance during weather emergencies. The community feed displays help requests, resource sharing, and recovery updates from your local area. You can post assistance needs, offer services, or share resources with verified community members. The help request system categorizes needs by urgency - normal, urgent, high priority, or emergency - with contact information and location details. Group messaging enables neighborhood coordination and resource sharing. Contractor matching connects verified professionals with people needing services. The platform includes reputation systems, insurance verification, and secure payment processing. Local business directories provide essential services during recovery. All interactions are monitored for safety and authenticity.`;
      
      try {
        // Call server API to generate natural-sounding voice using ElevenLabs Lily (natural female voice)
        const response = await fetch('/api/voice-ai/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text: voiceContent }),
        });

        if (!response.ok) {
          throw new Error('Voice generation failed');
        }

        const data = await response.json();
        
        if (data.audioBase64) {
          // Create and play audio
          const audio = new Audio(`data:audio/mpeg;base64,${data.audioBase64}`);
          
          audio.onended = () => {
            setIsVoiceGuideActive(false);
            setIsPlayingVoice(false);
          };
          
          audio.onerror = () => {
            console.error('Audio playback error');
            setIsVoiceGuideActive(false);
            setIsPlayingVoice(false);
          };
          
          await audio.play();
        } else {
          setIsVoiceGuideActive(false);
          setIsPlayingVoice(false);
        }
      } catch (error) {
        console.error('Voice guide error:', error);
        setIsVoiceGuideActive(false);
        setIsPlayingVoice(false);
      }
    } else {
      setIsVoiceGuideActive(false);
      setIsPlayingVoice(false);
    }
  };

  // Navigate to victim dashboard for help request
  const handleRequestHelp = () => {
    setLocation('/victim-dashboard');
  };

  // Use real authenticated user
  const currentUserId = user?.id || '';
  const currentUserType = user?.role as 'victim' | 'contractor' | 'business' || 'victim';

  // Queries
  const { data: groups = [], isLoading: groupsLoading } = useQuery<StormShareGroup[]>({
    queryKey: ['/api/stormshare/groups'],
  });

  const { data: helpRequests = [], isLoading: helpRequestsLoading } = useQuery<HelpRequest[]>({
    queryKey: ['/api/stormshare/help'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: messages = [], isLoading: messagesLoading } = useQuery<StormShareMessage[]>({
    queryKey: ['/api/stormshare/messages', { groupId: selectedGroup !== 'all' ? selectedGroup : undefined }],
    enabled: selectedGroup !== 'all',
    refetchInterval: 5000, // Refresh every 5 seconds for real-time feel
  });

  const { data: activeCampaigns = [] } = useQuery<StormShareAdCampaign[]>({
    queryKey: ['/api/stormshare/ads', { status: 'active' }],
    refetchInterval: 60000, // Refresh every minute
  });

  // Mutations
  const createHelpRequestMutation = useMutation({
    mutationFn: (data: HelpRequestForm) => apiRequest('/api/stormshare/help', {
      method: 'POST',
      body: JSON.stringify({ ...data, userId: currentUserId })
    }),
    onSuccess: () => {
      toast({ title: 'Help request posted successfully!' });
      queryClient.invalidateQueries({ queryKey: ['/api/stormshare/help'] });
      setActiveTab('help');
    },
    onError: () => {
      toast({ title: 'Failed to post help request', variant: 'destructive' });
    }
  });

  const sendMessageMutation = useMutation({
    mutationFn: (data: MessageForm) => apiRequest('/api/stormshare/messages', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/stormshare/messages'] });
    },
    onError: () => {
      toast({ title: 'Failed to send message', variant: 'destructive' });
    }
  });

  const convertToLeadMutation = useMutation({
    mutationFn: ({ helpRequestId, contractorId }: { helpRequestId: string, contractorId: string }) => 
      apiRequest(`/api/stormshare/help/${helpRequestId}/convert`, {
        method: 'POST',
        body: JSON.stringify({ contractorId })
      }),
    onSuccess: () => {
      toast({ title: 'Help request claimed and converted to lead!' });
      queryClient.invalidateQueries({ queryKey: ['/api/stormshare/help'] });
    },
    onError: () => {
      toast({ title: 'Failed to claim help request', variant: 'destructive' });
    }
  });

  // Forms
  const helpRequestForm = useForm<HelpRequestForm>({
    resolver: zodResolver(helpRequestSchema),
    defaultValues: {
      title: '',
      description: '',
      category: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      contactPhone: '',
      contactEmail: '',
      urgencyLevel: 'normal',
      hasInsurance: false,
      canPayImmediately: false,
      budgetRange: undefined,
    }
  });

  const messageForm = useForm<MessageForm>({
    resolver: zodResolver(messageSchema),
    defaultValues: {
      content: '',
      groupId: selectedGroup !== 'all' ? selectedGroup : '',
    }
  });

  const onSubmitHelpRequest = (data: HelpRequestForm) => {
    createHelpRequestMutation.mutate(data);
  };

  const onSendMessage = (data: MessageForm) => {
    sendMessageMutation.mutate(data);
    messageForm.reset();
  };

  const handleClaimHelpRequest = (helpRequestId: string) => {
    if (currentUserType !== 'contractor') {
      toast({ title: 'Only contractors can claim help requests', variant: 'destructive' });
      return;
    }
    convertToLeadMutation.mutate({ helpRequestId, contractorId: currentUserId });
  };

  // Filter help requests
  const filteredHelpRequests = helpRequests.filter((request: HelpRequest) => {
    const matchesSearch = searchTerm === '' || 
      request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.city.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = filterCategory === 'all' || request.category === filterCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Get stats
  const openHelpRequests = helpRequests.filter((req: HelpRequest) => req.status === 'open').length;
  const urgentRequests = helpRequests.filter((req: HelpRequest) => req.urgencyLevel === 'emergency' || req.urgencyLevel === 'urgent').length;
  const contractorGroups = groups.filter((group: StormShareGroup) => group.type === 'contractor').length;
  const totalMembers = groups.reduce((sum: number, group: StormShareGroup) => sum + (group.memberCount || 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-950">
      <div className="container mx-auto px-4 py-6">
        <BackButton />
        <DashboardSection
          title="StormShare Community"
          description="Connect, share, and get help in the storm response community. For victims and contractors working together."
          icon={Share2}
          badge={{ text: `${urgentRequests} URGENT`, variant: urgentRequests > 0 ? 'destructive' : 'secondary' }}
          kpis={[
            { label: 'Active Members', value: totalMembers, change: 'Online now', color: 'blue', testId: 'text-active-members' },
            { label: 'Help Requests', value: openHelpRequests, change: 'Need assistance', color: 'red', testId: 'text-help-requests' },
            { label: 'Contractor Groups', value: contractorGroups, change: 'Available', color: 'green', testId: 'text-contractor-groups' },
            { label: 'Weekly Helps', value: 127, change: 'People assisted', color: 'amber', testId: 'text-weekly-helps' }
          ]}
          actions={[
            { icon: Heart, label: 'Request Help', variant: 'default', testId: 'button-request-help', onClick: handleRequestHelp },
            { icon: MessageCircle, label: 'Join Chat', variant: 'outline', testId: 'button-join-chat' },
            { icon: Share2, label: 'Share Story', variant: 'outline', testId: 'button-share-story' },
            { icon: isVoiceGuideActive ? VolumeX : Volume2, label: isVoiceGuideActive ? 'Stop Guide' : 'Voice Guide', variant: 'outline', testId: 'button-voice-guide', onClick: startVoiceGuide, 'aria-label': 'Voice guide for StormShare', 'aria-pressed': isVoiceGuideActive }
          ]}
          testId="stormshare-section"
        >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="feed" data-testid="tab-feed">
            <Share2 className="w-4 h-4 mr-2" />
            Community Feed
          </TabsTrigger>
          <TabsTrigger value="help" data-testid="tab-help">
            <Heart className="w-4 h-4 mr-2" />
            Help Requests
          </TabsTrigger>
          <TabsTrigger value="groups" data-testid="tab-groups">
            <Users className="w-4 h-4 mr-2" />
            Contractor Groups
          </TabsTrigger>
          <TabsTrigger value="chat" data-testid="tab-chat">
            <MessageCircle className="w-4 h-4 mr-2" />
            Live Chat
          </TabsTrigger>
          <TabsTrigger value="resources" data-testid="tab-resources">
            <GraduationCap className="w-4 h-4 mr-2" />
            Resources
          </TabsTrigger>
        </TabsList>

        {/* Community Feed Tab */}
        <TabsContent value="feed" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Share Story Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Share2 className="w-5 h-5 mr-2" />
                    Share Your Storm Story
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea 
                    placeholder="Share what's happening, ask for advice, or post updates..."
                    className="min-h-[100px]"
                    data-testid="input-story-content"
                  />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm" data-testid="button-add-photo">
                        <Camera className="w-4 h-4 mr-2" />
                        Photo
                      </Button>
                      <Button variant="outline" size="sm" data-testid="button-add-video">
                        <Video className="w-4 h-4 mr-2" />
                        Video
                      </Button>
                      <Input placeholder="Location (optional)" className="w-40" data-testid="input-location" />
                    </div>
                    <Button data-testid="button-post-story">
                      <Send className="w-4 h-4 mr-2" />
                      Post Story
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Stories/Updates */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold">Recent Community Updates</h3>
                <StaggerContainer className="space-y-4">
                  {[
                    {
                      id: 1,
                      user: 'Emergency Response Team',
                      location: 'Tampa Bay, FL',
                      content: 'Road clearance operations are complete on I-275. All lanes now open. Please drive carefully as debris cleanup continues.',
                      type: 'update',
                      timestamp: '15 minutes ago',
                      likes: 45,
                      comments: 8,
                      isOfficial: true
                    },
                    {
                      id: 2,
                      user: 'Maria Santos',
                      location: 'Jacksonville, FL',
                      content: 'Thank you to everyone who helped us yesterday! The community really came together to clear the fallen tree from our street. This is why I love living here! ❤️',
                      type: 'story',
                      timestamp: '1 hour ago',
                      likes: 67,
                      comments: 23,
                      hasImage: true
                    },
                    {
                      id: 3,
                      user: 'Rapid Roofing Services',
                      location: 'Orlando, FL',
                      content: 'We have emergency tarping teams available 24/7. Licensed, insured, and approved by most insurance companies. DM us for immediate assistance.',
                      type: 'service',
                      timestamp: '2 hours ago',
                      likes: 12,
                      comments: 5,
                      isSponsored: true
                    }
                  ].map((post, index) => (
                    <StaggerItem key={post.id}>
                      <HoverLift>
                        <Card className="relative overflow-hidden">
                          {post.isSponsored && (
                            <div className="bg-yellow-50 border-b px-4 py-2">
                              <div className="flex items-center">
                                <TrendingUp className="w-4 h-4 mr-2 text-yellow-600" />
                                <span className="text-sm text-yellow-800">Sponsored Content</span>
                              </div>
                            </div>
                          )}
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                                  {post.user.charAt(0)}
                                </div>
                                <div>
                                  <div className="flex items-center space-x-2">
                                    <h3 className="font-semibold" data-testid={`post-user-${post.id}`}>
                                      {post.user}
                                    </h3>
                                    {post.isOfficial && (
                                      <Badge className="bg-blue-600 text-white">
                                        <Shield className="w-3 h-3 mr-1" />
                                        Official
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="flex items-center text-sm text-gray-500">
                                    <MapPin className="w-3 h-3 mr-1" />
                                    {post.location} • {post.timestamp}
                                  </div>
                                </div>
                              </div>
                            </div>
                            <p className="text-gray-700 dark:text-gray-300 mb-4">{post.content}</p>
                            {post.hasImage && (
                              <div className="mb-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg text-center text-sm text-gray-500">
                                <Camera className="w-8 h-8 mx-auto mb-2" />
                                Photo attached • Click to view
                              </div>
                            )}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                <Button variant="ghost" size="sm" data-testid={`button-like-${post.id}`}>
                                  <Heart className="w-4 h-4 mr-2" />
                                  {post.likes}
                                </Button>
                                <Button variant="ghost" size="sm" data-testid={`button-comment-${post.id}`}>
                                  <MessageCircle className="w-4 h-4 mr-2" />
                                  {post.comments}
                                </Button>
                                <Button variant="ghost" size="sm" data-testid={`button-share-${post.id}`}>
                                  <Share2 className="w-4 h-4 mr-2" />
                                  Share
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </HoverLift>
                    </StaggerItem>
                  ))}
                </StaggerContainer>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Emergency Alert */}
              {urgentRequests > 0 && (
                <PulseAlert intensity="strong">
                  <Card className="border-red-200 bg-red-50 dark:bg-red-900/20">
                    <CardHeader>
                      <CardTitle className="text-red-800 dark:text-red-200 flex items-center">
                        <AlertCircle className="w-5 h-5 mr-2" />
                        🚨 Urgent Help Needed
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-red-700 dark:text-red-300 text-sm mb-4">
                        {urgentRequests} urgent help request{urgentRequests > 1 ? 's' : ''} need immediate attention.
                      </p>
                      <Button 
                        className="w-full bg-red-600 hover:bg-red-700"
                        onClick={() => setActiveTab('help')}
                        data-testid="button-view-urgent-requests"
                      >
                        View Urgent Requests
                      </Button>
                    </CardContent>
                  </Card>
                </PulseAlert>
              )}

              {/* Community Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="w-5 h-5 mr-2" />
                    Community Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">Active now</span>
                      <span className="font-medium text-green-600">247 users</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Help requests today</span>
                      <span className="font-medium text-orange-600">{helpRequests.filter((r: HelpRequest) => {
                        const today = new Date();
                        const reqDate = new Date(r.createdAt);
                        return reqDate.toDateString() === today.toDateString();
                      }).length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Stories shared today</span>
                      <span className="font-medium text-blue-600">45</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">People helped this week</span>
                      <span className="font-medium text-purple-600">127</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Ad Space */}
              {activeCampaigns.length > 0 && (
                <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20">
                  <CardContent className="p-4">
                    <div className="text-xs text-gray-500 mb-2">Sponsored</div>
                    <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-lg p-4 text-white text-center">
                      <Building className="w-8 h-8 mx-auto mb-2" />
                      <h4 className="font-semibold mb-1">Home Depot</h4>
                      <p className="text-sm mb-3">Storm recovery supplies available. Free delivery on orders $50+</p>
                      <Button variant="secondary" size="sm" data-testid="button-sponsored-cta">
                        Shop Now
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Help Requests Tab */}
        <TabsContent value="help" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Filters */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                      <Input
                        placeholder="Search help requests..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        data-testid="input-search-help"
                      />
                    </div>
                    <Select value={filterCategory} onValueChange={setFilterCategory}>
                      <SelectTrigger className="w-48">
                        <Filter className="w-4 h-4 mr-2" />
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        <SelectItem value="roof-damage">Roof Damage</SelectItem>
                        <SelectItem value="tree-removal">Tree Removal</SelectItem>
                        <SelectItem value="flooding">Flooding</SelectItem>
                        <SelectItem value="power-outage">Power Outage</SelectItem>
                        <SelectItem value="debris-cleanup">Debris Cleanup</SelectItem>
                        <SelectItem value="fence-crew">Fence Crew</SelectItem>
                        <SelectItem value="plumbing">Plumbing Services</SelectItem>
                        <SelectItem value="remodeling">Remodeling Services & Repairs</SelectItem>
                        <SelectItem value="pool-services">Pool Services</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Help Requests List */}
              {helpRequestsLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">Active Help Requests</h3>
                  <StaggerContainer className="space-y-4">
                    {filteredHelpRequests.map((request: HelpRequest, index) => (
                      <StaggerItem key={request.id}>
                        <HoverLift>
                          <Card className="relative overflow-hidden">
                            {(request.urgencyLevel === 'emergency' || request.urgencyLevel === 'urgent') && (
                              <div className="bg-red-600 text-white px-4 py-2 text-sm font-medium">
                                <AlertCircle className="w-4 h-4 mr-2 inline" />
                                {request.urgencyLevel === 'emergency' ? '🚨 EMERGENCY' : '⚠️ URGENT'}
                              </div>
                            )}
                            <CardHeader>
                              <div className="flex items-start justify-between">
                                <div>
                                  <CardTitle className="text-lg" data-testid={`help-title-${request.id}`}>
                                    {request.title}
                                  </CardTitle>
                                  <div className="flex items-center text-sm text-gray-500 mt-1">
                                    <MapPin className="w-3 h-3 mr-1" />
                                    {request.city}, {request.state}
                                    <Clock className="w-3 h-3 ml-3 mr-1" />
                                    {new Date(request.createdAt).toLocaleDateString()}
                                  </div>
                                </div>
                                <div className="flex flex-col items-end space-y-2">
                                  <Badge 
                                    className={request.status === 'open' ? 'bg-green-600' : 
                                              request.status === 'claimed' ? 'bg-blue-600' : 'bg-gray-600'}
                                  >
                                    {request.status.toUpperCase()}
                                  </Badge>
                                  {request.hasInsurance && (
                                    <Badge variant="outline">
                                      <Shield className="w-3 h-3 mr-1" />
                                      Insured
                                    </Badge>
                                  )}
                                  {request.canPayImmediately && (
                                    <Badge variant="outline">
                                      <DollarSign className="w-3 h-3 mr-1" />
                                      Can Pay Now
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <p className="text-gray-700 dark:text-gray-300 mb-4">{request.description}</p>
                              
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                <div>
                                  <span className="font-medium">Category:</span>
                                  <p>{request.category}</p>
                                </div>
                                <div>
                                  <span className="font-medium">Contact:</span>
                                  <div className="flex items-center mt-1">
                                    <Phone className="w-3 h-3 mr-1" />
                                    <span className="text-xs">{request.contactPhone}</span>
                                  </div>
                                  {request.contactEmail && (
                                    <div className="flex items-center">
                                      <Mail className="w-3 h-3 mr-1" />
                                      <span className="text-xs">{request.contactEmail}</span>
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <span className="font-medium">Budget:</span>
                                  <p>{request.budgetRange ? request.budgetRange.replace('_', '-').replace('k', 'K').replace('plus', '+') : 'Not specified'}</p>
                                </div>
                              </div>

                              {request.status === 'open' && currentUserType === 'contractor' && (
                                <div className="mt-6 flex justify-end">
                                  <Button 
                                    onClick={() => handleClaimHelpRequest(request.id)}
                                    disabled={convertToLeadMutation.isPending}
                                    data-testid={`button-claim-${request.id}`}
                                  >
                                    <Zap className="w-4 h-4 mr-2" />
                                    {convertToLeadMutation.isPending ? 'Claiming...' : 'Claim & Convert to Lead'}
                                  </Button>
                                </div>
                              )}

                              {request.status === 'claimed' && (
                                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                  <div className="flex items-center">
                                    <CheckCircle className="w-4 h-4 mr-2 text-blue-600" />
                                    <span className="text-sm text-blue-700 dark:text-blue-300">
                                      This request has been claimed and converted to a lead
                                    </span>
                                  </div>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        </HoverLift>
                      </StaggerItem>
                    ))}
                    
                    {filteredHelpRequests.length === 0 && (
                      <Card>
                        <CardContent className="text-center py-12">
                          <Heart className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                          <h3 className="text-lg font-medium mb-2">No help requests found</h3>
                          <p className="text-gray-500">
                            {searchTerm || filterCategory !== 'all' 
                              ? 'Try adjusting your filters'
                              : 'Be the first to post a help request or check back later'
                            }
                          </p>
                        </CardContent>
                      </Card>
                    )}
                  </StaggerContainer>
                </div>
              )}
            </div>

            {/* Submit Help Request Sidebar */}
            <div className="space-y-6">
              <Card className="border-orange-200 bg-orange-50 dark:bg-orange-900/20">
                <CardHeader>
                  <CardTitle className="text-orange-800 dark:text-orange-200 flex items-center">
                    <Heart className="w-5 h-5 mr-2" />
                    Need Help?
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Form {...helpRequestForm}>
                    <form onSubmit={helpRequestForm.handleSubmit(onSubmitHelpRequest)} className="space-y-4">
                      <FormField
                        control={helpRequestForm.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>What do you need help with?</FormLabel>
                            <FormControl>
                              <Input placeholder="Brief summary..." {...field} data-testid="input-help-title" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={helpRequestForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Please provide details about the damage, urgency, and any specific requirements..."
                                className="min-h-[100px]"
                                {...field}
                                data-testid="input-help-description"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 gap-4">
                        <FormField
                          control={helpRequestForm.control}
                          name="category"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Category</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-help-category">
                                    <SelectValue placeholder="Select category" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="roof-damage">Roof Damage</SelectItem>
                                  <SelectItem value="tree-removal">Tree Removal</SelectItem>
                                  <SelectItem value="flooding">Flooding</SelectItem>
                                  <SelectItem value="power-outage">Power Outage</SelectItem>
                                  <SelectItem value="debris-cleanup">Debris Cleanup</SelectItem>
                                  <SelectItem value="fence-crew">Fence Crew</SelectItem>
                                  <SelectItem value="plumbing">Plumbing Services</SelectItem>
                                  <SelectItem value="remodeling">Remodeling Services & Repairs</SelectItem>
                                  <SelectItem value="pool-services">Pool Services</SelectItem>
                                  <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={helpRequestForm.control}
                          name="urgencyLevel"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Urgency</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-help-urgency">
                                    <SelectValue placeholder="Select urgency" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="normal">Normal</SelectItem>
                                  <SelectItem value="urgent">Urgent (within 24 hours)</SelectItem>
                                  <SelectItem value="emergency">Emergency (immediate)</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={helpRequestForm.control}
                          name="city"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>City</FormLabel>
                              <FormControl>
                                <Input placeholder="Your city" {...field} data-testid="input-help-city" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={helpRequestForm.control}
                          name="state"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>State</FormLabel>
                              <FormControl>
                                <Input placeholder="FL" {...field} data-testid="input-help-state" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={helpRequestForm.control}
                        name="contactPhone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Contact Phone</FormLabel>
                            <FormControl>
                              <Input placeholder="(555) 123-4567" {...field} data-testid="input-help-phone" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={helpRequestForm.control}
                        name="contactEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email (Optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="your@email.com" {...field} data-testid="input-help-email" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="space-y-3">
                        <FormField
                          control={helpRequestForm.control}
                          name="hasInsurance"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                              <FormControl>
                                <input
                                  type="checkbox"
                                  checked={field.value}
                                  onChange={field.onChange}
                                  data-testid="checkbox-has-insurance"
                                />
                              </FormControl>
                              <FormLabel className="text-sm font-normal">
                                I have insurance coverage
                              </FormLabel>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={helpRequestForm.control}
                          name="canPayImmediately"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                              <FormControl>
                                <input
                                  type="checkbox"
                                  checked={field.value}
                                  onChange={field.onChange}
                                  data-testid="checkbox-can-pay"
                                />
                              </FormControl>
                              <FormLabel className="text-sm font-normal">
                                I can pay immediately
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                      </div>

                      <Button 
                        type="submit" 
                        className="w-full"
                        disabled={createHelpRequestMutation.isPending}
                        data-testid="button-submit-help-request"
                      >
                        {createHelpRequestMutation.isPending ? 'Posting...' : 'Post Help Request'}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>

              {/* Help Request Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2" />
                    Help Request Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">Open requests</span>
                      <span className="font-medium text-green-600">{openHelpRequests}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Urgent/Emergency</span>
                      <span className="font-medium text-red-600">{urgentRequests}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Claimed today</span>
                      <span className="font-medium text-blue-600">
                        {helpRequests.filter((r: HelpRequest) => {
                          const today = new Date();
                          const claimedDate = r.claimedAt ? new Date(r.claimedAt) : null;
                          return claimedDate && claimedDate.toDateString() === today.toDateString();
                        }).length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Avg response time</span>
                      <span className="font-medium text-purple-600">2.5 hours</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Contractor Groups Tab */}
        <TabsContent value="groups" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groupsLoading ? (
              [...Array(6)].map((_, i) => (
                <div key={i} className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
              ))
            ) : (
              groups.filter((group: StormShareGroup) => group.type === 'contractor').map((group: StormShareGroup) => (
                <HoverLift key={group.id}>
                  <Card className="h-full">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg flex items-center" data-testid={`group-name-${group.id}`}>
                          {group.name === 'Emergency Tree Services' && <Truck className="w-5 h-5 mr-2 text-green-600" />}
                          {group.name === 'Roofing Professionals' && <Home className="w-5 h-5 mr-2 text-blue-600" />}
                          {group.name === 'Storm Cleanup Crew' && <Wrench className="w-5 h-5 mr-2 text-orange-600" />}
                          {!['Emergency Tree Services', 'Roofing Professionals', 'Storm Cleanup Crew'].includes(group.name) && 
                            <Wrench className="w-5 h-5 mr-2 text-gray-600" />}
                          {group.name}
                        </CardTitle>
                        <Badge variant="outline">
                          {group.memberCount || 0} members
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                        {group.description}
                      </p>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center">
                          <Users className="w-4 h-4 mr-2 text-gray-500" />
                          <span>{group.memberCount || 0} active members</span>
                        </div>
                        <div className="flex items-center">
                          <MessageCircle className="w-4 h-4 mr-2 text-gray-500" />
                          <span>{group.postCount || 0} recent posts</span>
                        </div>
                        <div className="flex items-center">
                          <Shield className="w-4 h-4 mr-2 text-gray-500" />
                          <span>Licensed & Insured</span>
                        </div>
                      </div>

                      <div className="mt-6">
                        <Button 
                          className="w-full"
                          variant={currentUserType === 'contractor' ? 'default' : 'outline'}
                          data-testid={`button-join-group-${group.id}`}
                        >
                          {currentUserType === 'contractor' ? 'Join Group' : 'View Group'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </HoverLift>
              ))
            )}
            
            {/* Mock additional groups since we might not have many in storage */}
            {[
              {
                id: 'emergency-tree',
                name: 'Emergency Tree Services',
                description: 'Professional tree removal and emergency services available 24/7 for storm damage.',
                memberCount: 45,
                postCount: 23,
                icon: Truck,
                color: 'text-green-600'
              },
              {
                id: 'roofing-pros',
                name: 'Roofing Professionals',
                description: 'Licensed roofers specializing in storm damage repair and emergency tarping.',
                memberCount: 67,
                postCount: 41,
                icon: Home,
                color: 'text-blue-600'
              },
              {
                id: 'cleanup-crew',
                name: 'Storm Cleanup Crew',
                description: 'Debris removal, property cleanup, and restoration services.',
                memberCount: 32,
                postCount: 18,
                icon: Wrench,
                color: 'text-orange-600'
              },
              {
                id: 'electrical-emergency',
                name: 'Emergency Electricians',
                description: 'Licensed electricians available for storm-related electrical emergencies.',
                memberCount: 28,
                postCount: 15,
                icon: Zap,
                color: 'text-yellow-600'
              }
            ].map((group) => (
              <HoverLift key={group.id}>
                <Card className="h-full">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center" data-testid={`group-name-${group.id}`}>
                        <group.icon className={`w-5 h-5 mr-2 ${group.color}`} />
                        {group.name}
                      </CardTitle>
                      <Badge variant="outline">
                        {group.memberCount} members
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                      {group.description}
                    </p>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center">
                        <Users className="w-4 h-4 mr-2 text-gray-500" />
                        <span>{group.memberCount} active members</span>
                      </div>
                      <div className="flex items-center">
                        <MessageCircle className="w-4 h-4 mr-2 text-gray-500" />
                        <span>{group.postCount} recent posts</span>
                      </div>
                      <div className="flex items-center">
                        <Shield className="w-4 h-4 mr-2 text-gray-500" />
                        <span>Licensed & Insured</span>
                      </div>
                    </div>

                    <div className="mt-6">
                      <Button 
                        className="w-full"
                        variant={currentUserType === 'contractor' ? 'default' : 'outline'}
                        data-testid={`button-join-group-${group.id}`}
                      >
                        {currentUserType === 'contractor' ? 'Join Group' : 'View Group'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </HoverLift>
            ))}
          </div>
        </TabsContent>

        {/* Live Chat Tab */}
        <TabsContent value="chat" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card className="h-[600px] flex flex-col">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MessageCircle className="w-5 h-5 mr-2" />
                    Community Chat
                    <div className="ml-auto flex items-center space-x-2">
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-sm text-gray-500">247 online</span>
                      </div>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  {/* Messages Area */}
                  <div className="flex-1 border rounded-lg p-4 mb-4 overflow-y-auto bg-gray-50 dark:bg-gray-900" data-testid="chat-messages">
                    <div className="space-y-4">
                      {messagesLoading ? (
                        <div className="text-center text-gray-500">Loading messages...</div>
                      ) : messages.length === 0 ? (
                        <div className="text-center text-gray-500">
                          No messages yet. Be the first to start the conversation!
                        </div>
                      ) : (
                        messages.map((message: StormShareMessage) => (
                          <div key={message.id} className="flex items-start space-x-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                              U
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="font-medium text-sm">User {message.userId}</span>
                                <span className="text-xs text-gray-500">
                                  {new Date(message.createdAt).toLocaleTimeString()}
                                </span>
                              </div>
                              <p className="text-sm">{message.content}</p>
                            </div>
                          </div>
                        ))
                      )}
                      
                      {/* Mock messages for demonstration */}
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                          E
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-medium text-sm">Emergency Response</span>
                            <Badge className="bg-blue-600 text-white text-xs">Official</Badge>
                            <span className="text-xs text-gray-500">2:30 PM</span>
                          </div>
                          <p className="text-sm">Road clearance on I-75 southbound is complete. All lanes now open.</p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                          M
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-medium text-sm">Maria S.</span>
                            <span className="text-xs text-gray-500">2:28 PM</span>
                          </div>
                          <p className="text-sm">Thank you all for the help yesterday! My neighborhood is looking much better.</p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                          R
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-medium text-sm">Rapid Tree Services</span>
                            <Badge className="bg-green-600 text-white text-xs">Contractor</Badge>
                            <span className="text-xs text-gray-500">2:25 PM</span>
                          </div>
                          <p className="text-sm">We have teams available for emergency tree removal. Licensed and insured. Call 555-TREE-911</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Message Input */}
                  <Form {...messageForm}>
                    <form onSubmit={messageForm.handleSubmit(onSendMessage)} className="flex space-x-2">
                      <FormField
                        control={messageForm.control}
                        name="content"
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Input
                                placeholder="Type your message..."
                                {...field}
                                data-testid="input-chat-message"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <Button 
                        type="submit"
                        disabled={sendMessageMutation.isPending}
                        data-testid="button-send-message"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </div>

            {/* Chat Sidebar */}
            <div className="space-y-6">
              {/* Online Users */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="w-5 h-5 mr-2" />
                    Online Now (247)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { name: 'Emergency Response', role: 'Official', status: 'online' },
                      { name: 'Quick Roofing LLC', role: 'Contractor', status: 'online' },
                      { name: 'Maria Santos', role: 'Community', status: 'online' },
                      { name: 'Tree Masters', role: 'Contractor', status: 'online' },
                      { name: 'John D.', role: 'Community', status: 'online' }
                    ].map((user, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                          {user.name.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium">{user.name}</span>
                            <div className="w-2 h-2 bg-green-500 rounded-full" />
                          </div>
                          <div className="text-xs text-gray-500">{user.role}</div>
                        </div>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" className="w-full mt-3">
                      View All Online
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Chat Rules */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Shield className="w-5 h-5 mr-2" />
                    Chat Guidelines
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start space-x-2">
                      <div className="w-1 h-1 bg-gray-400 rounded-full mt-2" />
                      <span>Be respectful and helpful</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <div className="w-1 h-1 bg-gray-400 rounded-full mt-2" />
                      <span>No spam or advertising</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <div className="w-1 h-1 bg-gray-400 rounded-full mt-2" />
                      <span>Emergency info only for urgent needs</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <div className="w-1 h-1 bg-gray-400 rounded-full mt-2" />
                      <span>Verify contractors before hiring</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" size="sm" className="w-full justify-start" data-testid="button-report-issue">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Report Issue
                  </Button>
                  <Button onClick={handleRequestHelp} variant="outline" size="sm" className="w-full justify-start" data-testid="button-request-help">
                    <Heart className="w-4 h-4 mr-2" />
                    Request Help
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start" data-testid="button-find-contractor">
                    <Wrench className="w-4 h-4 mr-2" />
                    Find Contractor
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Resources Tab */}
        <TabsContent value="resources" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* AI-Powered Resources */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <GraduationCap className="w-5 h-5 mr-2" />
                    AI-Powered Resource Feed
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* For Victims */}
                    {currentUserType === 'victim' && (
                      <div className="space-y-4">
                        <h4 className="font-medium text-lg mb-4">🏠 Resources for Storm Victims</h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/20">
                            <CardContent className="p-4">
                              <div className="flex items-center mb-2">
                                <FileText className="w-5 h-5 mr-2 text-blue-600" />
                                <h5 className="font-medium">FEMA Assistance</h5>
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                Apply for federal disaster assistance and emergency funding.
                              </p>
                              <Button size="sm" variant="outline" data-testid="button-fema-info">
                                Learn More
                              </Button>
                            </CardContent>
                          </Card>

                          <Card className="border-green-200 bg-green-50 dark:bg-green-900/20">
                            <CardContent className="p-4">
                              <div className="flex items-center mb-2">
                                <DollarSign className="w-5 h-5 mr-2 text-green-600" />
                                <h5 className="font-medium">SBA Loans</h5>
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                Low-interest disaster loans for recovery and rebuilding.
                              </p>
                              <Button size="sm" variant="outline" data-testid="button-sba-info">
                                Apply Now
                              </Button>
                            </CardContent>
                          </Card>

                          <Card className="border-purple-200 bg-purple-50 dark:bg-purple-900/20">
                            <CardContent className="p-4">
                              <div className="flex items-center mb-2">
                                <Shield className="w-5 h-5 mr-2 text-purple-600" />
                                <h5 className="font-medium">Insurance Claims</h5>
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                Guide to filing and managing insurance claims effectively.
                              </p>
                              <Button size="sm" variant="outline" data-testid="button-insurance-guide">
                                View Guide
                              </Button>
                            </CardContent>
                          </Card>

                          <Card className="border-orange-200 bg-orange-50 dark:bg-orange-900/20">
                            <CardContent className="p-4">
                              <div className="flex items-center mb-2">
                                <Heart className="w-5 h-5 mr-2 text-orange-600" />
                                <h5 className="font-medium">Local Aid Programs</h5>
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                Community resources and local assistance programs in your area.
                              </p>
                              <Button size="sm" variant="outline" data-testid="button-local-aid">
                                Find Help
                              </Button>
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                    )}

                    {/* For Contractors */}
                    {currentUserType === 'contractor' && (
                      <div className="space-y-4">
                        <h4 className="font-medium text-lg mb-4">🔧 Professional Resources for Contractors</h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/20">
                            <CardContent className="p-4">
                              <div className="flex items-center mb-2">
                                <Shield className="w-5 h-5 mr-2 text-blue-600" />
                                <h5 className="font-medium">OSHA Safety</h5>
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                Storm response safety guidelines and OSHA compliance.
                              </p>
                              <Button size="sm" variant="outline" data-testid="button-osha-safety">
                                View Guidelines
                              </Button>
                            </CardContent>
                          </Card>

                          <Card className="border-green-200 bg-green-50 dark:bg-green-900/20">
                            <CardContent className="p-4">
                              <div className="flex items-center mb-2">
                                <FileText className="w-5 h-5 mr-2 text-green-600" />
                                <h5 className="font-medium">Xactimate Training</h5>
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                Insurance estimating software training and certification.
                              </p>
                              <Button size="sm" variant="outline" data-testid="button-xactimate-training">
                                Get Certified
                              </Button>
                            </CardContent>
                          </Card>

                          <Card className="border-purple-200 bg-purple-50 dark:bg-purple-900/20">
                            <CardContent className="p-4">
                              <div className="flex items-center mb-2">
                                <User className="w-5 h-5 mr-2 text-purple-600" />
                                <h5 className="font-medium">Licensing Info</h5>
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                Contractor licensing requirements by state and specialty.
                              </p>
                              <Button size="sm" variant="outline" data-testid="button-licensing-info">
                                Check Requirements
                              </Button>
                            </CardContent>
                          </Card>

                          <Card className="border-orange-200 bg-orange-50 dark:bg-orange-900/20">
                            <CardContent className="p-4">
                              <div className="flex items-center mb-2">
                                <DollarSign className="w-5 h-5 mr-2 text-orange-600" />
                                <h5 className="font-medium">Billing Best Practices</h5>
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                Professional billing and payment processing for contractors.
                              </p>
                              <Button size="sm" variant="outline" data-testid="button-billing-practices">
                                Learn More
                              </Button>
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                    )}

                    {/* General Resources */}
                    <div className="space-y-4">
                      <h4 className="font-medium text-lg mb-4">📚 General Storm Response Resources</h4>
                      
                      <div className="space-y-3">
                        <Card>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h5 className="font-medium mb-1">Emergency Preparedness Checklist</h5>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  Complete guide to preparing for severe weather events.
                                </p>
                              </div>
                              <Button size="sm" variant="outline" data-testid="button-preparedness-checklist">
                                Download
                              </Button>
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h5 className="font-medium mb-1">Storm Damage Documentation Guide</h5>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  How to properly document damage for insurance claims.
                                </p>
                              </div>
                              <Button size="sm" variant="outline" data-testid="button-documentation-guide">
                                View Guide
                              </Button>
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h5 className="font-medium mb-1">Recovery Timeline & Priorities</h5>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  Step-by-step recovery process and prioritization guide.
                                </p>
                              </div>
                              <Button size="sm" variant="outline" data-testid="button-recovery-timeline">
                                Read More
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Resources Sidebar */}
            <div className="space-y-6">
              {/* AI Chat Assistant */}
              <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/20">
                <CardHeader>
                  <CardTitle className="text-blue-800 dark:text-blue-200 flex items-center">
                    <GraduationCap className="w-5 h-5 mr-2" />
                    AI Resource Assistant
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-blue-700 dark:text-blue-300 text-sm mb-4">
                    Get personalized recommendations and answers to your questions about storm recovery.
                  </p>
                  <div className="space-y-3">
                    <Input 
                      placeholder="Ask me about FEMA, insurance, or recovery..."
                      className="bg-white"
                      data-testid="input-ai-question"
                    />
                    <Button className="w-full bg-blue-600 hover:bg-blue-700" data-testid="button-ask-ai">
                      Get AI Assistance
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Links */}
              <Card>
                <CardHeader>
                  <CardTitle>Emergency Contacts</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span>Emergency Services</span>
                      <Button variant="outline" size="sm" data-testid="button-call-911">
                        <Phone className="w-3 h-3 mr-1" />
                        911
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>FEMA Helpline</span>
                      <Button variant="outline" size="sm" data-testid="button-call-fema">
                        <Phone className="w-3 h-3 mr-1" />
                        Call
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Red Cross</span>
                      <Button variant="outline" size="sm" data-testid="button-call-redcross">
                        <Phone className="w-3 h-3 mr-1" />
                        Call
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>SBA Disaster Office</span>
                      <Button variant="outline" size="sm" data-testid="button-call-sba">
                        <Phone className="w-3 h-3 mr-1" />
                        Call
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Resource Categories */}
              <Card>
                <CardHeader>
                  <CardTitle>Browse Categories</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" size="sm" className="w-full justify-start" data-testid="button-category-financial">
                    <DollarSign className="w-4 h-4 mr-2" />
                    Financial Assistance
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start" data-testid="button-category-legal">
                    <FileText className="w-4 h-4 mr-2" />
                    Legal Resources
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start" data-testid="button-category-health">
                    <Heart className="w-4 h-4 mr-2" />
                    Health & Safety
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start" data-testid="button-category-housing">
                    <Home className="w-4 h-4 mr-2" />
                    Housing Assistance
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </DashboardSection>
      </div>
    </div>
  );
}