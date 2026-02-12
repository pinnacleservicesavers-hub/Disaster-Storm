import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMutation, useQuery } from '@tanstack/react-query';
import { 
  Bot, 
  Mic, 
  MicOff, 
  Send, 
  Volume2, 
  VolumeX, 
  Brain, 
  Sparkles, 
  Zap, 
  AlertTriangle,
  MessageCircle,
  Satellite,
  Wind,
  Thermometer,
  Eye,
  TrendingUp,
  Target,
  Shield,
  Loader2,
  Radio,
  Radar,
  Activity
} from 'lucide-react';
import { FadeIn, PulseAlert, ScaleIn } from '@/components/ui/animations';
import { apiRequest } from '@/lib/queryClient';

interface UniversalPrediction {
  type: string;
  probability: number;
  timeframe: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
  recommendations: string[];
}

interface RealTimeData {
  satellite: {
    source: string;
    imagery: any;
    timestamp: Date;
    resolution: string;
  };
  wind: {
    measurements: any[];
    patterns: any;
  };
  temperature: {
    surface: any[];
    atmosphere: any[];
    gradient: any;
  };
}

interface AIAnalysis {
  analysis: string;
  predictions: UniversalPrediction[];
  realTimeData: RealTimeData;
  superiority: {
    newsReports: string;
    weatherApps: string;
    advantages: string[];
  };
}

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  analysis?: AIAnalysis;
  mode: 'text' | 'voice';
}

interface UniversalAIAssistantProps {
  module: 'weather' | 'surveillance' | 'property' | 'contractor' | 'emergency' | 'logistics';
  currentLocation?: {
    latitude: number;
    longitude: number;
    state?: string;
  };
  currentData?: any;
  className?: string;
}

export function UniversalAIAssistant({ 
  module, 
  currentLocation, 
  currentData, 
  className = '' 
}: UniversalAIAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [interactionMode, setInteractionMode] = useState<'text' | 'voice'>('text');
  const [timeframe, setTimeframe] = useState<string>('24hour');
  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
        handleSubmit(transcript, 'voice');
        setIsListening(false);
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Real-time data queries
  const { data: satelliteData } = useQuery({
    queryKey: ['/api/universal-ai/satellite-data'],
    refetchInterval: 300000, // 5 minutes
  });

  const { data: windData } = useQuery({
    queryKey: ['/api/universal-ai/wind-data'],
    refetchInterval: 600000, // 10 minutes
  });

  const { data: temperatureData } = useQuery({
    queryKey: ['/api/universal-ai/temperature-data'],
    refetchInterval: 300000, // 5 minutes
  });

  // Universal AI Analysis Mutation
  const universalAIMutation = useMutation({
    mutationFn: async ({ query, mode }: { query: string; mode: 'text' | 'voice' }) => {
      console.log('🧠 Universal AI sending request with module:', module);
      return apiRequest('/api/universal-ai/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          module: module || 'contractor', // Ensure module is always set
          location: currentLocation,
          timeframe,
          currentData: {
            ...currentData,
            satellite: satelliteData?.satelliteData,
            wind: windData?.windData,
            temperature: temperatureData?.temperatureData
          },
          userQuery: query
        })
      });
    },
    onSuccess: (data, variables) => {
      const aiMessage: Message = {
        id: Date.now().toString(),
        type: 'ai',
        content: data.analysis.analysis,
        timestamp: new Date(),
        analysis: data.analysis,
        mode: variables.mode
      };
      
      setMessages(prev => [...prev, aiMessage]);
      
      // Speak response if in voice mode
      if (variables.mode === 'voice' || isSpeaking) {
        speakText(data.analysis.analysis);
      }
    },
    onError: (error) => {
      const errorMessage: Message = {
        id: Date.now().toString(),
        type: 'ai',
        content: `I'm experiencing technical difficulties accessing real-time data. Please try again in a moment.`,
        timestamp: new Date(),
        mode: interactionMode
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  });

  const handleSubmit = (text: string = inputText, mode: 'text' | 'voice' = interactionMode) => {
    if (!text.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: text,
      timestamp: new Date(),
      mode
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');

    universalAIMutation.mutate({ query: text, mode });
  };

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setIsListening(true);
      setInteractionMode('voice');
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const speakText = async (text: string) => {
    try {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setIsSpeaking(true);
      
      const response = await fetch('/api/closebot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: [],
          context: { leadName: "user", companyName: "the company", trade: "general" },
          enableVoice: true
        })
      });
      
      const data = await response.json();
      
      if (data.audioUrl) {
        audioRef.current = new Audio(data.audioUrl);
        audioRef.current.onended = () => setIsSpeaking(false);
        audioRef.current.onerror = () => setIsSpeaking(false);
        await audioRef.current.play();
      } else {
        setIsSpeaking(false);
      }
    } catch (error) {
      console.error('Voice error:', error);
      setIsSpeaking(false);
    }
  };

  const stopSpeaking = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsSpeaking(false);
  };

  const getModuleIcon = () => {
    switch (module) {
      case 'weather': return Radar;
      case 'surveillance': return Eye;
      case 'property': return Target;
      case 'contractor': return TrendingUp;
      case 'emergency': return Shield;
      case 'logistics': return Activity;
      default: return Brain;
    }
  };

  const getModuleName = () => {
    switch (module) {
      case 'weather': return 'Weather Intelligence';
      case 'surveillance': return 'Surveillance Intelligence';
      case 'property': return 'Property Intelligence';
      case 'contractor': return 'Contractor Intelligence';
      case 'emergency': return 'Emergency Intelligence';
      case 'logistics': return 'Logistics Intelligence';
      default: return 'Universal Intelligence';
    }
  };

  const getSampleQuestions = () => {
    const common = [
      "What are the current real-time conditions?",
      "Analyze the next 24 hours with live satellite data"
    ];

    const moduleSpecific = {
      weather: [
        "Show me live storm development using satellite imagery",
        "Analyze wind patterns for storm prediction timing"
      ],
      surveillance: [
        "What are optimal conditions for drone operations?",
        "Analyze visibility and weather impact on surveillance"
      ],
      property: [
        "Assess weather-related property damage risks",
        "Predict optimal construction weather windows"
      ],
      contractor: [
        "When will storm damage create business opportunities?",
        "Analyze market conditions for contractor work"
      ],
      emergency: [
        "Assess emergency response weather conditions",
        "Predict disaster probability and timing"
      ],
      logistics: [
        "Analyze transportation conditions and route safety",
        "Predict supply chain weather impacts"
      ]
    };

    return [...common, ...moduleSpecific[module]];
  };

  // Welcome message
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMessage: Message = {
        id: 'welcome',
        type: 'ai',
        content: `Hello! I'm your advanced ${getModuleName()} system with access to real-time satellite data from GOES-16/17, live wind patterns from ASCAT, and temperature gradients from MODIS. I provide superior analysis compared to any news report or weather app, with precise timing predictions and comprehensive risk assessment. How can I help you today?`,
        timestamp: new Date(),
        mode: 'text'
      };
      setMessages([welcomeMessage]);
    }
  }, [module]);

  const ModuleIcon = getModuleIcon();

  return (
    <Card className={`universal-ai-assistant ${className}`} data-testid={`universal-ai-assistant-${module}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: universalAIMutation.isPending ? 360 : 0 }}
              transition={{ duration: 2, repeat: universalAIMutation.isPending ? Infinity : 0, ease: "linear" }}
            >
              <ModuleIcon className="h-6 w-6 text-blue-600" />
            </motion.div>
            <div>
              <CardTitle className="text-xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                {getModuleName()} AI
              </CardTitle>
              <p className="text-sm text-gray-600">Real-time Satellite • Superior to News Reports • Live Predictions</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge className={`${interactionMode === 'voice' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
              {interactionMode === 'voice' ? '🎤 Voice' : '💬 Text'}
            </Badge>
            
            {/* Real-time Data Indicators */}
            <div className="flex gap-1">
              <Badge variant="outline" className="text-xs">
                <Satellite className="h-3 w-3 mr-1" />
                Live
              </Badge>
              <Badge variant="outline" className="text-xs">
                <Wind className="h-3 w-3 mr-1" />
                Real-time
              </Badge>
              <Badge variant="outline" className="text-xs">
                <Thermometer className="h-3 w-3 mr-1" />
                Live
              </Badge>
            </div>
            
            {isSpeaking && (
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <Button
                  variant="outline"
                  size="sm"
                  onClick={stopSpeaking}
                  data-testid="button-stop-speaking"
                >
                  <VolumeX className="h-4 w-4" />
                </Button>
              </motion.div>
            )}
          </div>
        </div>

        {/* Timeframe Selector */}
        <div className="flex items-center gap-2 mt-4">
          <span className="text-sm font-medium">Analysis Timeframe:</span>
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="15min">15 Minutes</SelectItem>
              <SelectItem value="1hour">1 Hour</SelectItem>
              <SelectItem value="6hour">6 Hours</SelectItem>
              <SelectItem value="24hour">24 Hours</SelectItem>
              <SelectItem value="48hour">48 Hours</SelectItem>
              <SelectItem value="72hour">72 Hours</SelectItem>
              <SelectItem value="7day">7 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Voice Settings */}
        {interactionMode === 'voice' && voices.length > 0 && (
          <FadeIn>
            <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
              <Volume2 className="h-4 w-4 text-green-600" />
              <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select Voice" />
                </SelectTrigger>
                <SelectContent>
                  {voices.map((voice) => (
                    <SelectItem key={voice.name} value={voice.name}>
                      {voice.name} ({voice.lang})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </FadeIn>
        )}

        {/* Messages */}
        <div className="h-96 overflow-y-auto space-y-4 p-4 bg-gray-50 rounded-lg" data-testid="messages-container">
          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-xs lg:max-w-md xl:max-w-lg ${
                  message.type === 'user' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white border border-gray-200'
                } rounded-lg p-3 shadow-sm`}>
                  <div className="flex items-start gap-2">
                    {message.type === 'ai' && (
                      <ModuleIcon className="h-5 w-5 text-blue-600 mt-1 flex-shrink-0" />
                    )}
                    {message.type === 'user' && (
                      <div className="flex items-center gap-1">
                        {message.mode === 'voice' ? (
                          <Mic className="h-4 w-4" />
                        ) : (
                          <MessageCircle className="h-4 w-4" />
                        )}
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="text-sm">{message.content}</p>
                      
                      {message.analysis && (
                        <div className="mt-3 space-y-2">
                          {/* Predictions */}
                          {message.analysis.predictions.map((pred, index) => (
                            <div key={index} className="border-l-2 border-blue-500 pl-2">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge className={`${
                                  pred.impact === 'critical' ? 'bg-red-100 text-red-800' :
                                  pred.impact === 'high' ? 'bg-orange-100 text-orange-800' :
                                  pred.impact === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-green-100 text-green-800'
                                }`}>
                                  {pred.type}
                                </Badge>
                                <Badge variant="outline">
                                  {Math.round(pred.probability * 100)}%
                                </Badge>
                              </div>
                              <p className="text-xs text-gray-600">
                                <strong>Timeframe:</strong> {pred.timeframe}
                              </p>
                              <p className="text-xs text-gray-600">
                                <strong>Impact:</strong> {pred.impact.toUpperCase()}
                              </p>
                            </div>
                          ))}
                          
                          {/* Superiority Indicators */}
                          <div className="mt-3 p-2 bg-blue-50 rounded text-xs">
                            <p className="font-semibold text-blue-800 mb-1">Why We're Better:</p>
                            <ul className="space-y-1">
                              {message.analysis.superiority.advantages.map((advantage, index) => (
                                <li key={index} className="flex items-start gap-1 text-blue-700">
                                  <span className="text-blue-500">•</span>
                                  <span>{advantage}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}
                      
                      <p className="text-xs opacity-70 mt-2">
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="space-y-3">
          {/* Mode Toggle */}
          <div className="flex items-center gap-2">
            <Button
              variant={interactionMode === 'text' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setInteractionMode('text')}
              data-testid="button-text-mode"
            >
              <MessageCircle className="h-4 w-4 mr-1" />
              Text
            </Button>
            <Button
              variant={interactionMode === 'voice' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setInteractionMode('voice')}
              data-testid="button-voice-mode"
            >
              <Mic className="h-4 w-4 mr-1" />
              Voice
            </Button>
          </div>

          {interactionMode === 'text' ? (
            <div className="flex gap-2">
              <Textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={`Ask me anything about ${module} operations, real-time conditions, or predictions...`}
                className="min-h-[60px] resize-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
                data-testid="input-universal-question"
              />
              <Button 
                onClick={() => handleSubmit()}
                disabled={!inputText.trim() || universalAIMutation.isPending}
                data-testid="button-send-message"
              >
                {universalAIMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                onMouseDown={startListening}
                onMouseUp={stopListening}
                onMouseLeave={stopListening}
                disabled={universalAIMutation.isPending}
                className={`flex-1 h-12 ${isListening ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
                data-testid="button-voice-input"
              >
                {isListening ? (
                  <>
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 0.5, repeat: Infinity }}
                    >
                      <MicOff className="h-5 w-5 mr-2" />
                    </motion.div>
                    Release to Stop
                  </>
                ) : (
                  <>
                    <Mic className="h-5 w-5 mr-2" />
                    Hold to Speak
                  </>
                )}
              </Button>
              
              {inputText && (
                <Button 
                  onClick={() => handleSubmit()}
                  disabled={universalAIMutation.isPending}
                  data-testid="button-send-voice-message"
                >
                  <Send className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Sample Questions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-4">
          {getSampleQuestions().map((question, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              className="text-left justify-start h-auto p-2 text-xs"
              onClick={() => {
                setInputText(question);
                if (interactionMode === 'text') {
                  handleSubmit(question);
                }
              }}
              data-testid={`button-sample-question-${index}`}
            >
              <Sparkles className="h-3 w-3 mr-1 flex-shrink-0" />
              <span className="truncate">{question}</span>
            </Button>
          ))}
        </div>

        {/* Real-time Data Status */}
        <div className="flex items-center justify-between text-xs text-gray-500 border-t pt-2">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Radio className="h-3 w-3 text-green-500" />
              <span>Satellite: Live</span>
            </div>
            <div className="flex items-center gap-1">
              <Wind className="h-3 w-3 text-blue-500" />
              <span>Wind: Real-time</span>
            </div>
            <div className="flex items-center gap-1">
              <Thermometer className="h-3 w-3 text-red-500" />
              <span>Temperature: Live</span>
            </div>
          </div>
          <span>Superior to news reports & weather apps</span>
        </div>
      </CardContent>
    </Card>
  );
}