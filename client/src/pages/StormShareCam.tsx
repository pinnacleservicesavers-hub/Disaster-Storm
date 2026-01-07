import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { Share2, Camera, Video, Heart, MessageCircle, Users, Upload, Radio, DollarSign, MapPin, Play, Pause, Eye, Zap } from 'lucide-react';
import { DashboardSection } from '@/components/DashboardSection';
import { FadeIn, PulseAlert, StaggerContainer, StaggerItem, HoverLift } from '@/components/ui/animations';
import ModuleAIAssistant from '@/components/ModuleAIAssistant';

interface Post {
  id: number;
  user: string;
  location: string;
  type: 'help_request' | 'donation_request' | 'live_stream' | 'update';
  content: string;
  images: number;
  timestamp: string;
  likes: number;
  comments: number;
  category: string;
  urgency?: 'high' | 'medium' | 'low';
  isLive?: boolean;
  videoUrl?: string;
}

interface LiveStream {
  id: string;
  title: string;
  streamer: string;
  viewers: number;
  thumbnail: string;
  isLive: boolean;
}

export default function StormShareCam() {
  const [activeTab, setActiveTab] = useState('feed');
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Mock posts data with React Query
  const { data: posts = [], isLoading: postsLoading } = useQuery({
    queryKey: ['storm-posts'],
    queryFn: async (): Promise<Post[]> => {
      await new Promise(resolve => setTimeout(resolve, 400));
      
      return [
        {
          id: 1,
          user: 'Sarah J.',
          location: 'Tampa, FL',
          type: 'help_request',
          content: 'Tree fell on our house, need emergency tarping service. Insurance approved. Can pay immediately.',
          images: 2,
          timestamp: '15 minutes ago',
          likes: 5,
          comments: 8,
          category: 'Emergency Help',
          urgency: 'high'
        },
        {
          id: 2,
          user: 'Mike R.',
          location: 'Jacksonville, FL', 
          type: 'donation_request',
          content: 'Lost everything in the hurricane. Single dad with 2 kids. Any help appreciated. Venmo @mike-help',
          images: 3,
          timestamp: '1 hour ago',
          likes: 23,
          comments: 12,
          category: 'Donations Needed',
          urgency: 'high'
        },
        {
          id: 3,
          user: 'Storm Contractors LLC',
          location: 'Orlando, FL',
          type: 'live_stream',
          content: 'Live: Storm damage assessment in progress. Available for emergency calls.',
          timestamp: '2 hours ago',
          likes: 15,
          comments: 5,
          category: 'Live Stream',
          isLive: true
        },
        {
          id: 4,
          user: 'Emergency Response Team',
          location: 'Miami, FL',
          type: 'update',
          content: 'Road clearance operation complete on I-95. Traffic flowing normally. Stay safe everyone!',
          images: 1,
          timestamp: '3 hours ago',
          likes: 34,
          comments: 7,
          category: 'Emergency Update'
        },
      ];
    },
    refetchInterval: 10000,
  });

  // Mock live streams
  const { data: liveStreams = [] } = useQuery({
    queryKey: ['live-streams'],
    queryFn: async (): Promise<LiveStream[]> => {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      return [
        { id: '1', title: 'Storm Damage Assessment Live', streamer: 'Emergency Response', viewers: 234, thumbnail: '', isLive: true },
        { id: '2', title: 'Cleanup Operations Update', streamer: 'City Council', viewers: 156, thumbnail: '', isLive: true },
        { id: '3', title: 'Weather Update & Safety Tips', streamer: 'Weather Service', viewers: 89, thumbnail: '', isLive: true },
      ];
    },
    refetchInterval: 5000,
  });

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    // Handle file upload logic here
  };

  const totalViewers = liveStreams.reduce((sum, stream) => sum + stream.viewers, 0);
  const helpRequests = posts.filter(p => p.type === 'help_request').length;
  const donationsNeeded = posts.filter(p => p.type === 'donation_request').length;

  return (
    <DashboardSection
      title="StormShareCam Community"
      description="Connect with storm victims and contractors. Share stories, request help, go live, and find assistance"
      icon={Share2}
      badge={{ text: `${liveStreams.filter(s => s.isLive).length} LIVE`, variant: 'destructive' }}
      kpis={[
        { label: 'Active Users', value: 1247, change: 'Online now', color: 'blue', testId: 'text-active-users' },
        { label: 'Help Requests', value: helpRequests, change: 'Awaiting response', color: 'red', testId: 'text-help-requests' },
        { label: 'Live Viewers', value: totalViewers, change: 'Watching now', color: 'green', testId: 'text-live-viewers' },
        { label: 'Weekly Donations', value: 45, change: 'Raised this week', color: 'purple', suffix: 'K', testId: 'text-donations-raised' }
      ]}
      actions={[
        { icon: Radio, label: 'Go Live', variant: 'default', testId: 'button-go-live' },
        { icon: Camera, label: 'Share Photos', variant: 'outline', testId: 'button-share-photos' },
        { icon: Heart, label: 'Request Help', variant: 'outline', testId: 'button-request-help' }
      ]}
      testId="stormshare-section"
    >
      {/* Live Streams Carousel */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4 flex items-center">
          <Radio className="h-5 w-5 text-red-500 mr-2" />
          Live Streams
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="ml-2 h-2 w-2 bg-red-500 rounded-full"
          />
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {liveStreams.map((stream, index) => (
            <HoverLift key={stream.id}>
              <Card className="relative overflow-hidden group cursor-pointer">
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
                <div className="relative h-48 bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="text-white"
                  >
                    <Play className="h-12 w-12" />
                  </motion.div>
                  
                  {/* Live indicator */}
                  <PulseAlert intensity="strong">
                    <Badge className="absolute top-3 left-3 bg-red-600 text-white z-20">
                      <Radio className="h-3 w-3 mr-1" />
                      LIVE
                    </Badge>
                  </PulseAlert>
                  
                  {/* Viewer count */}
                  <div className="absolute top-3 right-3 bg-black/50 rounded-full px-2 py-1 z-20">
                    <div className="flex items-center space-x-1 text-white text-xs">
                      <Eye className="h-3 w-3" />
                      <span>{stream.viewers}</span>
                    </div>
                  </div>
                </div>
                
                <CardContent className="relative z-20 p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1" data-testid={`stream-title-${stream.id}`}>
                    {stream.title}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{stream.streamer}</p>
                </CardContent>
              </Card>
            </HoverLift>
          ))}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-4 mb-6">
        {[
          { key: 'feed', label: 'Community Feed', icon: Share2 },
          { key: 'help', label: 'Help Requests', icon: Heart },
          { key: 'live', label: 'Live Streams', icon: Radio },
          { key: 'donations', label: 'Donations', icon: DollarSign }
        ].map((tab) => (
          <Button 
            key={tab.key}
            variant={activeTab === tab.key ? 'default' : 'outline'}
            onClick={() => setActiveTab(tab.key)}
            data-testid={`tab-${tab.key}`}
          >
            <tab.icon className="w-4 h-4 mr-2" />
            {tab.label}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Feed */}
        <div className="lg:col-span-2 space-y-6">
          {/* Upload Area with Drag & Drop Glow */}
          <motion.div
            className={`relative rounded-lg border-2 border-dashed transition-all duration-300 ${
              isDragOver 
                ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20 shadow-lg shadow-blue-400/20' 
                : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            animate={isDragOver ? { 
              scale: 1.02,
              boxShadow: '0 0 20px rgba(59, 130, 246, 0.5)'
            } : {}}
          >
            <CardContent className="p-8 text-center">
              <motion.div
                animate={isDragOver ? { scale: 1.1 } : { scale: 1 }}
                transition={{ duration: 0.2 }}
              >
                <Upload className={`h-12 w-12 mx-auto mb-4 ${
                  isDragOver ? 'text-blue-500' : 'text-gray-400'
                }`} />
                <h3 className="text-lg font-semibold mb-2">Share Your Story</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Drag & drop photos/videos or click to browse
                </p>
              </motion.div>
              
              <div className="flex justify-center space-x-2 mb-4">
                <Button variant="outline" size="sm" data-testid="button-upload-photo">
                  <Camera className="w-4 h-4 mr-2" />
                  Photo
                </Button>
                <Button variant="outline" size="sm" data-testid="button-upload-video">
                  <Video className="w-4 h-4 mr-2" />
                  Video
                </Button>
                <Button variant="outline" size="sm" data-testid="button-go-live">
                  <Radio className="w-4 h-4 mr-2" />
                  Go Live
                </Button>
                <Button variant="outline" size="sm" data-testid="button-request-help">
                  <Heart className="w-4 h-4 mr-2" />
                  Request Help
                </Button>
              </div>
              
              <div className="flex items-center justify-between">
                <Input placeholder="Your location (optional)" className="max-w-xs" />
                <Button data-testid="button-share-post">Share Post</Button>
              </div>
            </CardContent>
          </motion.div>

          {/* Posts Feed */}
          {postsLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : (
            <StaggerContainer className="space-y-6">
              {posts.map((post, index) => (
                <StaggerItem key={post.id}>
                  <HoverLift>
                    <Card className="relative overflow-hidden transition-all duration-300 hover:shadow-xl">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-50/20 to-indigo-50/20 dark:from-blue-900/10 dark:to-indigo-900/10" />
                      <CardHeader className="relative">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                              {post.user.charAt(0)}
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900 dark:text-gray-100" data-testid={`post-user-${post.id}`}>
                                {post.user}
                              </h3>
                              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                                <MapPin className="w-3 h-3 mr-1" />
                                {post.location} • {post.timestamp}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {post.isLive && (
                              <PulseAlert intensity="medium">
                                <Badge className="bg-red-500 text-white">
                                  LIVE
                                </Badge>
                              </PulseAlert>
                            )}
                            {post.urgency === 'high' && (
                              <motion.div
                                animate={{ scale: [1, 1.05, 1] }}
                                transition={{ duration: 2, repeat: Infinity }}
                              >
                                <Badge className="bg-orange-500 text-white">
                                  URGENT
                                </Badge>
                              </motion.div>
                            )}
                            <Badge variant="outline">
                              {post.category}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="relative">
                        <p className="text-gray-700 dark:text-gray-300 mb-4">{post.content}</p>
                        
                        {post.images > 0 && (
                          <motion.div 
                            className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-4 cursor-pointer hover:text-blue-600 transition-colors"
                            whileHover={{ scale: 1.02 }}
                            onClick={() => setSelectedImage(post.id)}
                          >
                            <Camera className="w-4 h-4 mr-1" />
                            {post.images} image(s) attached • Click to view
                          </motion.div>
                        )}

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                              <Button variant="ghost" size="sm" data-testid={`button-like-${post.id}`}>
                                <Heart className="w-4 h-4 mr-2" />
                                {post.likes} Likes
                              </Button>
                            </motion.div>
                            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                              <Button variant="ghost" size="sm" data-testid={`button-comment-${post.id}`}>
                                <MessageCircle className="w-4 h-4 mr-2" />
                                {post.comments} Comments
                              </Button>
                            </motion.div>
                            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                              <Button variant="ghost" size="sm" data-testid={`button-share-${post.id}`}>
                                <Share2 className="w-4 h-4 mr-2" />
                                Share
                              </Button>
                            </motion.div>
                          </div>
                          {post.type === 'help_request' && (
                            <motion.div
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <Button size="sm" data-testid={`button-help-${post.id}`}>
                                <Zap className="w-4 h-4 mr-2" />
                                Offer Help
                              </Button>
                            </motion.div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </HoverLift>
                </StaggerItem>
              ))}
            </StaggerContainer>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Emergency Help */}
          <motion.div
            className="relative"
            animate={{
              boxShadow: [
                '0 0 0 0 rgba(239, 68, 68, 0.4)',
                '0 0 0 10px rgba(239, 68, 68, 0)',
                '0 0 0 0 rgba(239, 68, 68, 0)'
              ]
            }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <Card className="border-red-200 bg-red-50 dark:bg-red-900/20">
              <CardHeader>
                <CardTitle className="text-red-800 dark:text-red-200 flex items-center">
                  <Heart className="w-5 h-5 mr-2" />
                  🚨 Emergency Help
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-red-700 dark:text-red-300 text-sm mb-4">
                  Need immediate assistance? Post your emergency request and get connected with available contractors and volunteers.
                </p>
                <Button className="w-full bg-red-600 hover:bg-red-700" data-testid="button-emergency-request">
                  Post Emergency Request
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Live Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Radio className="w-5 h-5 mr-2 text-green-500" />
                Live Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { text: '12 people watching storm coverage', color: 'bg-green-500' },
                  { text: '5 contractors available for calls', color: 'bg-blue-500' },
                  { text: '23 help requests posted today', color: 'bg-orange-500' },
                ].map((activity, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center space-x-2 text-sm"
                  >
                    <motion.div 
                      className={`w-2 h-2 rounded-full ${activity.color}`}
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity, delay: index * 0.5 }}
                    />
                    <span>{activity.text}</span>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Donation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="w-5 h-5 mr-2 text-purple-500" />
                Quick Donate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Support storm victims with direct donations through our secure platform.
              </p>
              <div className="grid grid-cols-3 gap-2 mb-4">
                {[10, 25, 50].map((amount) => (
                  <motion.div key={amount} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button variant="outline" size="sm" className="w-full" data-testid={`button-donate-${amount}`}>
                      ${amount}
                    </Button>
                  </motion.div>
                ))}
              </div>
              <Button className="w-full" data-testid="button-donate-now">
                Donate Now
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Image Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center"
            onClick={() => setSelectedImage(null)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="relative max-w-4xl max-h-4xl bg-white dark:bg-gray-800 rounded-lg p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="aspect-video bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white">
                <Camera className="h-16 w-16" />
              </div>
              <Button 
                variant="outline" 
                className="absolute top-2 right-2"
                onClick={() => setSelectedImage(null)}
              >
                ✕
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <ModuleAIAssistant 
        moduleName="StormShare Cam"
        moduleContext="Community storm damage sharing platform. Evelyn can help you understand live streams, browse damage reports, engage with posts from homeowners, and identify contractor opportunities from user-generated content and help requests."
      />
    </DashboardSection>
  );
}