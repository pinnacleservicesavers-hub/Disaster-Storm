import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Share2, Camera, Video, Heart, MessageCircle, Users, Upload, Radio, DollarSign, MapPin } from 'lucide-react';

export default function StormShareCam() {
  const [activeTab, setActiveTab] = useState('feed');

  // Sample posts data
  const samplePosts = [
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
      category: 'Emergency Help'
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
    }
  ];

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2" data-testid="title-stormshare">
          🌊 StormShareCam - Community Support Platform
        </h1>
        <p className="text-gray-600">
          Connect with storm victims and contractors. Share stories, request help, go live, and find assistance.
        </p>
      </div>

      {/* Platform Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Active Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">1,247</div>
            <p className="text-xs text-gray-500">Online now</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Help Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">89</div>
            <p className="text-xs text-gray-500">Awaiting response</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Live Streams</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">12</div>
            <p className="text-xs text-gray-500">Currently broadcasting</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Donations Raised</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">$45K</div>
            <p className="text-xs text-gray-500">This week</p>
          </CardContent>
        </Card>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-4 mb-6">
        <Button 
          variant={activeTab === 'feed' ? 'default' : 'outline'}
          onClick={() => setActiveTab('feed')}
        >
          <Share2 className="w-4 h-4 mr-2" />
          Community Feed
        </Button>
        <Button 
          variant={activeTab === 'help' ? 'default' : 'outline'}
          onClick={() => setActiveTab('help')}
        >
          <Heart className="w-4 h-4 mr-2" />
          Help Requests
        </Button>
        <Button 
          variant={activeTab === 'live' ? 'default' : 'outline'}
          onClick={() => setActiveTab('live')}
        >
          <Radio className="w-4 h-4 mr-2" />
          Live Streams
        </Button>
        <Button 
          variant={activeTab === 'donations' ? 'default' : 'outline'}
          onClick={() => setActiveTab('donations')}
        >
          <DollarSign className="w-4 h-4 mr-2" />
          Donations
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Feed */}
        <div className="lg:col-span-2 space-y-6">
          {/* Create Post */}
          <Card>
            <CardHeader>
              <CardTitle>Share Your Story</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  <Camera className="w-4 h-4 mr-2" />
                  Photo
                </Button>
                <Button variant="outline" size="sm">
                  <Video className="w-4 h-4 mr-2" />
                  Video
                </Button>
                <Button variant="outline" size="sm">
                  <Radio className="w-4 h-4 mr-2" />
                  Go Live
                </Button>
                <Button variant="outline" size="sm">
                  <Heart className="w-4 h-4 mr-2" />
                  Request Help
                </Button>
              </div>
              <textarea 
                placeholder="Share what's happening, ask for help, or offer assistance..."
                className="w-full min-h-[100px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
              />
              <div className="flex items-center justify-between">
                <Input placeholder="Your location (optional)" className="max-w-xs" />
                <Button>Share Post</Button>
              </div>
            </CardContent>
          </Card>

          {/* Posts Feed */}
          {samplePosts.map((post) => (
            <Card key={post.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                      <Users className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{post.user}</h3>
                      <div className="flex items-center text-sm text-gray-500">
                        <MapPin className="w-3 h-3 mr-1" />
                        {post.location} • {post.timestamp}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {post.isLive && (
                      <Badge className="bg-red-500 text-white animate-pulse">
                        LIVE
                      </Badge>
                    )}
                    {post.urgency === 'high' && (
                      <Badge className="bg-orange-500 text-white">
                        URGENT
                      </Badge>
                    )}
                    <Badge variant="outline">
                      {post.category}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 mb-4">{post.content}</p>
                
                {post.images > 0 && (
                  <div className="flex items-center text-sm text-gray-500 mb-4">
                    <Camera className="w-4 h-4 mr-1" />
                    {post.images} image(s) attached
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Button variant="ghost" size="sm">
                      <Heart className="w-4 h-4 mr-2" />
                      {post.likes} Likes
                    </Button>
                    <Button variant="ghost" size="sm">
                      <MessageCircle className="w-4 h-4 mr-2" />
                      {post.comments} Comments
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Share2 className="w-4 h-4 mr-2" />
                      Share
                    </Button>
                  </div>
                  {post.type === 'help_request' && (
                    <Button size="sm">
                      Offer Help
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Emergency Help */}
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-800">🚨 Emergency Help</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-700 text-sm mb-4">
                Need immediate assistance? Post your emergency request and get connected with available contractors and volunteers.
              </p>
              <Button className="w-full bg-red-600 hover:bg-red-700">
                Post Emergency Request
              </Button>
            </CardContent>
          </Card>

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
                <div className="flex items-center space-x-2 text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>12 people watching storm coverage</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>5 contractors available for calls</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span>23 help requests posted today</span>
                </div>
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
              <p className="text-sm text-gray-600 mb-4">
                Support storm victims with direct donations through our secure platform.
              </p>
              <div className="grid grid-cols-3 gap-2 mb-4">
                <Button variant="outline" size="sm">$10</Button>
                <Button variant="outline" size="sm">$25</Button>
                <Button variant="outline" size="sm">$50</Button>
              </div>
              <Button className="w-full">
                Donate Now
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}