import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMutation } from '@tanstack/react-query';
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
  Waves,
  Cloud,
  Wind,
  Sun,
  CloudRain,
  CloudSnow,
  Loader2
} from 'lucide-react';
import { FadeIn, PulseAlert, ScaleIn } from '@/components/ui/animations';
import { apiRequest } from '@/lib/queryClient';

interface WeatherPrediction {
  prediction: string;
  confidence: number;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  timeframe: string;
  recommendations: string[];
  dataSource: string;
  voiceResponse: string;
}

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  prediction?: WeatherPrediction;
  mode: 'text' | 'voice';
}

interface WeatherAIAssistantProps {
  currentLocation?: {
    latitude: number;
    longitude: number;
    state?: string;
  };
  weatherData?: any;
  className?: string;
}

export function WeatherAIAssistant({ currentLocation, weatherData, className = '' }: WeatherAIAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [interactionMode, setInteractionMode] = useState<'text' | 'voice'>('text');
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize speech synthesis voices
  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
      
      // Select a female voice by default for weather AI
      const femaleVoice = availableVoices.find(voice => 
        voice.name.toLowerCase().includes('female') || 
        voice.name.toLowerCase().includes('samantha') ||
        voice.name.toLowerCase().includes('karen') ||
        voice.name.toLowerCase().includes('susan')
      );
      
      if (femaleVoice) {
        setSelectedVoice(femaleVoice.name);
      } else if (availableVoices.length > 0) {
        setSelectedVoice(availableVoices[0].name);
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
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

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Weather AI Query Mutation
  const weatherAIMutation = useMutation({
    mutationFn: async ({ question, mode }: { question: string; mode: 'text' | 'voice' }) => {
      return apiRequest('/api/weather-ai/query', {
        method: 'POST',
        body: {
          question,
          location: currentLocation,
          currentData: weatherData,
          mode
        }
      });
    },
    onSuccess: (data, variables) => {
      const aiMessage: Message = {
        id: Date.now().toString(),
        type: 'ai',
        content: data.prediction.prediction,
        timestamp: new Date(),
        prediction: data.prediction,
        mode: variables.mode
      };
      
      setMessages(prev => [...prev, aiMessage]);
      
      // Speak the response if in voice mode or if text-to-speech is enabled
      if (variables.mode === 'voice' || isSpeaking) {
        speakText(data.prediction.voiceResponse || data.prediction.prediction);
      }
    },
    onError: (error) => {
      const errorMessage: Message = {
        id: Date.now().toString(),
        type: 'ai',
        content: `I apologize, but I'm experiencing technical difficulties right now. Please try your question again in a moment.`,
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

    weatherAIMutation.mutate({ question: text, mode });
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

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(true);
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      utterance.volume = 0.8;
      
      if (selectedVoice) {
        const voice = voices.find(v => v.name === selectedVoice);
        if (voice) utterance.voice = voice;
      }
      
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      
      window.speechSynthesis.speak(utterance);
    }
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'text-red-600 bg-red-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case 'critical': return AlertTriangle;
      case 'high': return Zap;
      case 'medium': return Cloud;
      case 'low': return Sun;
      default: return Brain;
    }
  };

  // Welcome message on first load
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMessage: Message = {
        id: 'welcome',
        type: 'ai',
        content: `Hello! I'm your advanced weather AI assistant with access to comprehensive global weather data. I can provide 99% accurate hurricane and storm predictions, analyze weather patterns, and answer any questions about weather conditions or forecasts. You can either type your questions or speak to me directly. How can I help you today?`,
        timestamp: new Date(),
        mode: 'text'
      };
      setMessages([welcomeMessage]);
    }
  }, []);

  return (
    <Card className={`weather-ai-assistant ${className}`} data-testid="weather-ai-assistant">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: weatherAIMutation.isPending ? 360 : 0 }}
              transition={{ duration: 2, repeat: weatherAIMutation.isPending ? Infinity : 0, ease: "linear" }}
            >
              <Brain className="h-6 w-6 text-blue-600" />
            </motion.div>
            <div>
              <CardTitle className="text-xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Weather AI Intelligence
              </CardTitle>
              <p className="text-sm text-gray-600">99% Accurate Predictions • Voice & Text Interaction</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge className={`${interactionMode === 'voice' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
              {interactionMode === 'voice' ? '🎤 Voice' : '💬 Text'}
            </Badge>
            
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
                      <Bot className="h-5 w-5 text-blue-600 mt-1 flex-shrink-0" />
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
                      
                      {message.prediction && (
                        <div className="mt-3 space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge className={getUrgencyColor(message.prediction.urgency)}>
                              {React.createElement(getUrgencyIcon(message.prediction.urgency), { className: "h-3 w-3 mr-1" })}
                              {message.prediction.urgency.toUpperCase()}
                            </Badge>
                            <Badge variant="outline">
                              {message.prediction.confidence}% Confidence
                            </Badge>
                          </div>
                          
                          <div className="text-xs text-gray-600">
                            <p><strong>Timeframe:</strong> {message.prediction.timeframe}</p>
                            <p><strong>Data Source:</strong> {message.prediction.dataSource}</p>
                          </div>
                          
                          {message.prediction.recommendations.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs font-semibold text-gray-700 mb-1">Recommendations:</p>
                              <ul className="text-xs text-gray-600 space-y-1">
                                {message.prediction.recommendations.map((rec, index) => (
                                  <li key={index} className="flex items-start gap-1">
                                    <span className="text-blue-600">•</span>
                                    <span>{rec}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
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
                placeholder="Ask me anything about weather, storms, hurricanes, or any function in this module..."
                className="min-h-[60px] resize-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
                data-testid="input-weather-question"
              />
              <Button 
                onClick={() => handleSubmit()}
                disabled={!inputText.trim() || weatherAIMutation.isPending}
                data-testid="button-send-message"
              >
                {weatherAIMutation.isPending ? (
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
                disabled={weatherAIMutation.isPending}
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
                  disabled={weatherAIMutation.isPending}
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
          {[
            "What's the hurricane forecast for the next 48 hours?",
            "Analyze current tornado conditions in my area",
            "What are the weather module functions available?",
            "Give me a complete weather briefing for disaster operations"
          ].map((question, index) => (
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
      </CardContent>
    </Card>
  );
}