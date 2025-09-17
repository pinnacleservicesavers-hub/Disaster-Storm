import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  MessageCircle, X, Send, Bot, User, Minimize2, Maximize2,
  Clock, CheckCircle, AlertCircle, Zap, Sparkles,
  Phone, Mail, Calendar, MapPin, ExternalLink,
  Star, ThumbsUp, ThumbsDown, Download, Copy,
  Settings, Palette, Type, Layout, Eye
} from 'lucide-react';
import { FadeIn, SlideIn, HoverLift } from '@/components/ui/animations';

interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'bot' | 'agent';
  timestamp: Date;
  type: 'text' | 'quick_reply' | 'file' | 'lead_form' | 'booking';
  metadata?: {
    quickReplies?: string[];
    leadFormFields?: string[];
    bookingLink?: string;
    fileUrl?: string;
    fileName?: string;
  };
}

interface ChatWidget {
  id: string;
  name: string;
  position: 'bottom-right' | 'bottom-left' | 'bottom-center';
  theme: 'storm' | 'modern' | 'minimal' | 'custom';
  primaryColor: string;
  greeting: string;
  awayMessage: string;
  isEnabled: boolean;
  autoTriggers: {
    timeDelay?: number; // seconds
    scrollPercent?: number; // 0-100
    exitIntent?: boolean;
    pageViews?: number;
  };
  businessHours: {
    enabled: boolean;
    timezone: string;
    schedule: {
      [key: string]: { start: string; end: string; enabled: boolean };
    };
  };
  integrations: {
    ai: boolean;
    liveAgent: boolean;
    sms: boolean;
    email: boolean;
  };
  leadCapture: {
    enabled: boolean;
    fields: string[];
    autoTrigger: boolean;
  };
  analytics: {
    conversations: number;
    leadsGenerated: number;
    responseTime: number; // seconds
    satisfactionScore: number; // 1-5
  };
}

interface ChatWidgetBuilderProps {
  widget?: ChatWidget;
  onSave?: (widget: ChatWidget) => void;
  mode?: 'builder' | 'preview' | 'live';
}

export function ChatWidgetBuilder({ widget, onSave, mode = 'builder' }: ChatWidgetBuilderProps) {
  const [selectedWidget, setSelectedWidget] = useState<ChatWidget>(widget || {
    id: 'widget-1',
    name: 'Storm Damage Lead Chat',
    position: 'bottom-right',
    theme: 'storm',
    primaryColor: '#1e40af',
    greeting: 'Hi! Need help with storm damage repairs? We can connect you with local contractors within minutes.',
    awayMessage: 'We\'re currently away but will respond to your message within 1 hour. For emergencies, call (555) 123-4567.',
    isEnabled: true,
    autoTriggers: {
      timeDelay: 15,
      scrollPercent: 50,
      exitIntent: true,
      pageViews: 2
    },
    businessHours: {
      enabled: true,
      timezone: 'America/New_York',
      schedule: {
        monday: { start: '09:00', end: '18:00', enabled: true },
        tuesday: { start: '09:00', end: '18:00', enabled: true },
        wednesday: { start: '09:00', end: '18:00', enabled: true },
        thursday: { start: '09:00', end: '18:00', enabled: true },
        friday: { start: '09:00', end: '18:00', enabled: true },
        saturday: { start: '10:00', end: '16:00', enabled: true },
        sunday: { start: '12:00', end: '16:00', enabled: false }
      }
    },
    integrations: {
      ai: true,
      liveAgent: true,
      sms: true,
      email: true
    },
    leadCapture: {
      enabled: true,
      fields: ['name', 'phone', 'email', 'damage_type', 'urgency'],
      autoTrigger: true
    },
    analytics: {
      conversations: 1247,
      leadsGenerated: 189,
      responseTime: 12,
      satisfactionScore: 4.7
    }
  });

  const [activeTab, setActiveTab] = useState<'design' | 'triggers' | 'integrations' | 'analytics'>('design');
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMinimized, setChatMinimized] = useState(false);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showLeadForm, setShowLeadForm] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Mock conversation for preview
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      content: selectedWidget.greeting,
      sender: 'bot',
      timestamp: new Date(),
      type: 'text',
      metadata: {
        quickReplies: ['Get Quote', 'Emergency Repair', 'Learn More']
      }
    }
  ]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (content: string, type: 'text' | 'quick_reply' = 'text') => {
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content,
      sender: 'user',
      timestamp: new Date(),
      type
    };

    setMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      let botResponse: ChatMessage;
      
      if (content.toLowerCase().includes('quote') || content.toLowerCase().includes('emergency')) {
        botResponse = {
          id: (Date.now() + 1).toString(),
          content: 'I can help you get connected with local contractors immediately. Could you please provide some details about your situation?',
          sender: 'bot',
          timestamp: new Date(),
          type: 'lead_form',
          metadata: {
            leadFormFields: ['name', 'phone', 'damage_type', 'urgency', 'address']
          }
        };
        setShowLeadForm(true);
      } else {
        botResponse = {
          id: (Date.now() + 1).toString(),
          content: 'I understand you need help with storm damage. Our network includes certified contractors for roofing, siding, tree removal, and emergency repairs. Would you like to get matched with local contractors?',
          sender: 'bot',
          timestamp: new Date(),
          type: 'text',
          metadata: {
            quickReplies: ['Yes, find contractors', 'Emergency service needed', 'Just browsing']
          }
        };
      }

      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const themes = {
    storm: {
      primary: '#1e40af',
      background: '#ffffff',
      text: '#1f2937',
      accent: '#3b82f6'
    },
    modern: {
      primary: '#10b981',
      background: '#f8fafc',
      text: '#0f172a',
      accent: '#06b6d4'
    },
    minimal: {
      primary: '#6b7280',
      background: '#ffffff',
      text: '#374151',
      accent: '#9ca3af'
    },
    custom: {
      primary: selectedWidget.primaryColor,
      background: '#ffffff',
      text: '#1f2937',
      accent: selectedWidget.primaryColor
    }
  };

  const currentTheme = themes[selectedWidget.theme];

  if (mode === 'live') {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <AnimatePresence>
          {!chatOpen && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                onClick={() => setChatOpen(true)}
                className="w-16 h-16 rounded-full shadow-lg relative"
                style={{ backgroundColor: currentTheme.primary }}
                data-testid="button-open-chat"
              >
                <MessageCircle className="w-6 h-6 text-white" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
              </Button>
            </motion.div>
          )}

          {chatOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className={`bg-white rounded-lg shadow-2xl border ${
                chatMinimized ? 'w-80 h-16' : 'w-96 h-[32rem]'
              } transition-all duration-300`}
              style={{ borderColor: currentTheme.primary }}
            >
              {/* Chat Header */}
              <div 
                className="flex items-center justify-between p-4 rounded-t-lg"
                style={{ backgroundColor: currentTheme.primary }}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-medium">Storm Repair Assistant</h3>
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <span className="text-white text-xs opacity-90">Online</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setChatMinimized(!chatMinimized)}
                    className="text-white hover:bg-white hover:bg-opacity-20"
                    data-testid="button-minimize-chat"
                  >
                    {chatMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setChatOpen(false)}
                    className="text-white hover:bg-white hover:bg-opacity-20"
                    data-testid="button-close-chat"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {!chatMinimized && (
                <>
                  {/* Messages */}
                  <div className="flex-1 p-4 space-y-4 h-80 overflow-y-auto">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs p-3 rounded-lg ${
                            message.sender === 'user'
                              ? 'bg-blue-600 text-white rounded-br-none'
                              : 'bg-gray-100 text-gray-900 rounded-bl-none'
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          
                          {message.metadata?.quickReplies && message.sender === 'bot' && (
                            <div className="mt-2 space-y-1">
                              {message.metadata.quickReplies.map((reply, index) => (
                                <Button
                                  key={index}
                                  variant="outline"
                                  size="sm"
                                  onClick={() => sendMessage(reply, 'quick_reply')}
                                  className="text-xs w-full"
                                  data-testid={`button-quick-reply-${index}`}
                                >
                                  {reply}
                                </Button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}

                    {isTyping && (
                      <div className="flex justify-start">
                        <div className="bg-gray-100 p-3 rounded-lg rounded-bl-none">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input */}
                  <div className="p-4 border-t">
                    <div className="flex space-x-2">
                      <Input
                        value={currentMessage}
                        onChange={(e) => setCurrentMessage(e.target.value)}
                        placeholder="Type your message..."
                        onKeyPress={(e) => e.key === 'Enter' && currentMessage.trim() && sendMessage(currentMessage)}
                        className="flex-1"
                        data-testid="input-chat-message"
                      />
                      <Button
                        onClick={() => currentMessage.trim() && sendMessage(currentMessage)}
                        disabled={!currentMessage.trim()}
                        style={{ backgroundColor: currentTheme.primary }}
                        data-testid="button-send-message"
                      >
                        <Send className="w-4 h-4 text-white" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Chat Widget Builder</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">Create intelligent chat widgets to capture leads 24/7</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" data-testid="button-preview-widget">
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </Button>
          <Button
            onClick={() => onSave?.(selectedWidget)}
            className="bg-blue-600 hover:bg-blue-700"
            data-testid="button-save-widget"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Widget
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Builder Panel */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Widget Configuration</CardTitle>
                <div className="flex items-center space-x-2">
                  <Button
                    variant={activeTab === 'design' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActiveTab('design')}
                    data-testid="tab-design"
                  >
                    <Palette className="w-4 h-4 mr-2" />
                    Design
                  </Button>
                  <Button
                    variant={activeTab === 'triggers' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActiveTab('triggers')}
                    data-testid="tab-triggers"
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    Triggers
                  </Button>
                  <Button
                    variant={activeTab === 'integrations' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActiveTab('integrations')}
                    data-testid="tab-integrations"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Integrations
                  </Button>
                  <Button
                    variant={activeTab === 'analytics' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActiveTab('analytics')}
                    data-testid="tab-analytics"
                  >
                    <Star className="w-4 h-4 mr-2" />
                    Analytics
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {activeTab === 'design' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Widget Name</label>
                      <Input
                        value={selectedWidget.name}
                        onChange={(e) => setSelectedWidget(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter widget name"
                        data-testid="input-widget-name"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium">Theme</label>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {Object.keys(themes).map((theme) => (
                          <Button
                            key={theme}
                            variant={selectedWidget.theme === theme ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setSelectedWidget(prev => ({ ...prev, theme: theme as any }))}
                            className="justify-start"
                            data-testid={`button-theme-${theme}`}
                          >
                            <div 
                              className="w-3 h-3 rounded-full mr-2"
                              style={{ backgroundColor: themes[theme as keyof typeof themes].primary }}
                            />
                            {theme.charAt(0).toUpperCase() + theme.slice(1)}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium">Position</label>
                      <div className="grid grid-cols-3 gap-2 mt-2">
                        {['bottom-left', 'bottom-center', 'bottom-right'].map((pos) => (
                          <Button
                            key={pos}
                            variant={selectedWidget.position === pos ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setSelectedWidget(prev => ({ ...prev, position: pos as any }))}
                            data-testid={`button-position-${pos}`}
                          >
                            {pos.replace('-', ' ')}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Greeting Message</label>
                      <Textarea
                        value={selectedWidget.greeting}
                        onChange={(e) => setSelectedWidget(prev => ({ ...prev, greeting: e.target.value }))}
                        placeholder="Enter greeting message"
                        rows={3}
                        data-testid="textarea-greeting"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium">Away Message</label>
                      <Textarea
                        value={selectedWidget.awayMessage}
                        onChange={(e) => setSelectedWidget(prev => ({ ...prev, awayMessage: e.target.value }))}
                        placeholder="Enter away message"
                        rows={3}
                        data-testid="textarea-away-message"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'triggers' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-medium">Auto Triggers</h3>
                    
                    <div>
                      <label className="text-sm font-medium">Time Delay (seconds)</label>
                      <Input
                        type="number"
                        value={selectedWidget.autoTriggers.timeDelay}
                        onChange={(e) => setSelectedWidget(prev => ({
                          ...prev,
                          autoTriggers: { ...prev.autoTriggers, timeDelay: Number(e.target.value) }
                        }))}
                        data-testid="input-time-delay"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium">Scroll Percentage</label>
                      <Input
                        type="number"
                        value={selectedWidget.autoTriggers.scrollPercent}
                        onChange={(e) => setSelectedWidget(prev => ({
                          ...prev,
                          autoTriggers: { ...prev.autoTriggers, scrollPercent: Number(e.target.value) }
                        }))}
                        data-testid="input-scroll-percent"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium">Page Views</label>
                      <Input
                        type="number"
                        value={selectedWidget.autoTriggers.pageViews}
                        onChange={(e) => setSelectedWidget(prev => ({
                          ...prev,
                          autoTriggers: { ...prev.autoTriggers, pageViews: Number(e.target.value) }
                        }))}
                        data-testid="input-page-views"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-medium">Business Hours</h3>
                    
                    <div>
                      <label className="text-sm font-medium">Timezone</label>
                      <Input
                        value={selectedWidget.businessHours.timezone}
                        onChange={(e) => setSelectedWidget(prev => ({
                          ...prev,
                          businessHours: { ...prev.businessHours, timezone: e.target.value }
                        }))}
                        data-testid="input-timezone"
                      />
                    </div>

                    <div className="space-y-2">
                      {Object.entries(selectedWidget.businessHours.schedule).map(([day, schedule]) => (
                        <div key={day} className="flex items-center space-x-2">
                          <span className="w-20 text-sm capitalize">{day}</span>
                          <Input
                            value={schedule.start}
                            onChange={(e) => setSelectedWidget(prev => ({
                              ...prev,
                              businessHours: {
                                ...prev.businessHours,
                                schedule: {
                                  ...prev.businessHours.schedule,
                                  [day]: { ...schedule, start: e.target.value }
                                }
                              }
                            }))}
                            className="w-20"
                            data-testid={`input-${day}-start`}
                          />
                          <span className="text-sm">to</span>
                          <Input
                            value={schedule.end}
                            onChange={(e) => setSelectedWidget(prev => ({
                              ...prev,
                              businessHours: {
                                ...prev.businessHours,
                                schedule: {
                                  ...prev.businessHours.schedule,
                                  [day]: { ...schedule, end: e.target.value }
                                }
                              }
                            }))}
                            className="w-20"
                            data-testid={`input-${day}-end`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'analytics' && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <MessageCircle className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium">Conversations</span>
                      </div>
                      <div className="text-2xl font-bold text-blue-600 mt-2">
                        {selectedWidget.analytics.conversations.toLocaleString()}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium">Leads</span>
                      </div>
                      <div className="text-2xl font-bold text-green-600 mt-2">
                        {selectedWidget.analytics.leadsGenerated}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-purple-600" />
                        <span className="text-sm font-medium">Response Time</span>
                      </div>
                      <div className="text-2xl font-bold text-purple-600 mt-2">
                        {selectedWidget.analytics.responseTime}s
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <Star className="w-4 h-4 text-yellow-600" />
                        <span className="text-sm font-medium">Satisfaction</span>
                      </div>
                      <div className="text-2xl font-bold text-yellow-600 mt-2">
                        {selectedWidget.analytics.satisfactionScore}/5
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Preview Panel */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Eye className="w-4 h-4 mr-2" />
                Live Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative bg-gray-100 rounded-lg p-4 min-h-96">
                <div className="text-center text-gray-500 text-sm mb-4">Website Preview</div>
                
                {/* Mock website content */}
                <div className="space-y-4 opacity-50">
                  <div className="h-8 bg-gray-300 rounded"></div>
                  <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                  <div className="h-32 bg-gray-300 rounded"></div>
                </div>

                {/* Chat Widget Preview */}
                <div 
                  className={`absolute ${
                    selectedWidget.position === 'bottom-left' ? 'bottom-4 left-4' :
                    selectedWidget.position === 'bottom-center' ? 'bottom-4 left-1/2 transform -translate-x-1/2' :
                    'bottom-4 right-4'
                  }`}
                >
                  <ChatWidgetBuilder widget={selectedWidget} mode="live" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default ChatWidgetBuilder;