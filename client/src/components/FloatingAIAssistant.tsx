import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useMutation } from '@tanstack/react-query';
import { 
  MessageCircle, 
  Mic, 
  MicOff, 
  Send, 
  Volume2, 
  VolumeX, 
  Brain, 
  Sparkles, 
  Minimize2,
  Maximize2,
  X,
  Zap,
  AlertTriangle,
  MapPin,
  Phone,
  Mail,
  Users,
  Navigation,
  Crown,
  Atom,
  Star,
  Loader2
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface FloatingMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  incidents?: any[];
  confidence?: number;
}

interface FloatingAIAssistantProps {
  className?: string;
}

export function FloatingAIAssistant({ className = '' }: FloatingAIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<FloatingMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[event.results.length - 1][0].transcript;
        if (event.results[event.results.length - 1].isFinal) {
          setInputText(transcript);
          handleSubmit(transcript);
          setIsListening(false);
        }
      };

      recognitionRef.current.onerror = () => setIsListening(false);
      recognitionRef.current.onend = () => setIsListening(false);
    }
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Comprehensive AI Query
  const aiQueryMutation = useMutation({
    mutationFn: async (query: string) => {
      setIsProcessing(true);
      
      return apiRequest('/api/comprehensive-intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          includeLiveIncidents: true,
          includeTrafficData: true,
          includeWeatherData: true,
          includeInfrastructureData: true,
          includeHomeownerData: true,
          conversationalMode: true,
          realTimeData: {
            timestamp: new Date(),
            requestSource: 'FloatingAI'
          },
          analysisOptions: {
            nationwide: true,
            allStates: true,
            allCounties: true,
            allCities: true,
            personalizedResponse: true,
            humanLikeConversation: true,
            includeAlerts: true,
            predictiveInsights: true,
            voiceOptimized: true
          }
        })
      });
    },
    onSuccess: (data) => {
      setIsProcessing(false);
      
      const aiMessage: FloatingMessage = {
        id: Date.now().toString(),
        type: 'ai',
        content: data.response || "I'm monitoring everything nationwide right now. What would you like to know about incidents, traffic, damage, or opportunities in any city, county, or state?",
        timestamp: new Date(),
        incidents: data.relatedIncidents || [],
        confidence: data.confidence || 0.95
      };
      
      setMessages(prev => [...prev, aiMessage]);
      
      // Speak the AI response if voice is enabled
      if (voiceEnabled) {
        speakResponse(data.response || aiMessage.content);
      }
    },
    onError: () => {
      setIsProcessing(false);
      
      // Fallback response
      const fallbackMessage: FloatingMessage = {
        id: Date.now().toString(),
        type: 'ai',
        content: "I'm your nationwide intelligence assistant! I'm monitoring live incidents, traffic, damage, accidents, trees down, power outages, and contractor opportunities across every state, county, and city. What would you like to know?",
        timestamp: new Date(),
        confidence: 1.0
      };
      
      setMessages(prev => [...prev, fallbackMessage]);
      
      if (voiceEnabled) {
        speakResponse(fallbackMessage.content);
      }
    }
  });

  const speakResponse = async (text: string) => {
    if (!voiceEnabled) return;

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

  const handleSubmit = (text: string = inputText) => {
    if (!text.trim()) return;

    const userMessage: FloatingMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');

    aiQueryMutation.mutate(text);
  };

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  // Initial welcome message
  useEffect(() => {
    if (messages.length === 0 && isOpen) {
      const welcomeMessage: FloatingMessage = {
        id: 'welcome',
        type: 'ai',
        content: `Hi! I'm your nationwide intelligence assistant. I know everything happening right now across every state, county, and city in the country. 

I can tell you about:
• Live damage incidents and homeowner contact info
• Traffic accidents and road closures
• Trees down blocking highways
• Power outages affecting work areas  
• Storm damage needing contractors
• Any incidents anywhere in the US

Just ask me anything or speak your question!`,
        timestamp: new Date(),
        confidence: 1.0
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen, messages.length]);

  if (!isOpen) {
    return (
      <motion.div
        className="fixed bottom-6 right-6 z-50"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Button
          onClick={() => setIsOpen(true)}
          className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-600 via-purple-600 to-green-600 hover:from-blue-700 hover:via-purple-700 hover:to-green-700 shadow-2xl border-4 border-white"
        >
          <motion.div
            animate={{ 
              rotate: [0, 360],
              scale: [1, 1.2, 1]
            }}
            transition={{ 
              rotate: { duration: 3, repeat: Infinity, ease: "linear" },
              scale: { duration: 2, repeat: Infinity }
            }}
          >
            <Brain className="h-8 w-8 text-white" />
          </motion.div>
        </Button>
        
        {/* Notification badges */}
        <motion.div 
          className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 rounded-full flex items-center justify-center animate-pulse"
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          <Sparkles className="h-3 w-3 text-white" />
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className={`fixed bottom-6 right-6 z-50 ${className}`}
      initial={{ scale: 0, opacity: 0, y: 100 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      transition={{ duration: 0.5, type: "spring" }}
    >
      <Card className="w-96 shadow-2xl border-4 border-gradient-to-r from-blue-500 via-purple-500 to-green-500">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-green-600 text-white p-4 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ 
                  rotate: [0, 360],
                  scale: [1, 1.2, 1]
                }}
                transition={{ 
                  rotate: { duration: 4, repeat: Infinity, ease: "linear" },
                  scale: { duration: 2, repeat: Infinity }
                }}
              >
                <Brain className="h-6 w-6" />
              </motion.div>
              <div>
                <h3 className="font-bold text-lg">🌍 LIVE INTELLIGENCE</h3>
                <p className="text-xs opacity-90">Ask about anything, anywhere</p>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setVoiceEnabled(!voiceEnabled)}
                className="text-white hover:bg-white/20 p-1"
              >
                {voiceEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(!isMinimized)}
                className="text-white hover:bg-white/20 p-1"
              >
                {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-white/20 p-1"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="flex gap-2 mt-3">
            <Badge className="bg-white/20 text-white border-white/30">
              🔴 LIVE MONITORING
            </Badge>
            <Badge className="bg-white/20 text-white border-white/30">
              🌍 NATIONWIDE
            </Badge>
          </div>
        </div>

        {/* Messages */}
        <AnimatePresence>
          {!isMinimized && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <CardContent className="p-0">
                <div className="h-80 overflow-y-auto space-y-3 p-4 bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
                  <AnimatePresence>
                    {messages.map((message) => (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.95 }}
                        className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-xs rounded-2xl p-4 ${
                          message.type === 'user' 
                            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white' 
                            : 'bg-white border-2 border-blue-300 shadow-md'
                        }`}>
                          {message.type === 'ai' && (
                            <div className="flex items-center gap-2 mb-2">
                              <Brain className="h-4 w-4 text-blue-600" />
                              <span className="text-xs font-semibold text-blue-800">AI Assistant</span>
                              {message.confidence && (
                                <Badge variant="outline" className="text-xs">
                                  {Math.round(message.confidence * 100)}%
                                </Badge>
                              )}
                            </div>
                          )}
                          
                          <div className="text-sm leading-relaxed">
                            {message.content.split('\n').map((line, index) => (
                              <p key={index} className="mb-1">
                                {line}
                              </p>
                            ))}
                          </div>
                          
                          {/* Related Incidents */}
                          {message.incidents && message.incidents.length > 0 && (
                            <div className="mt-3 space-y-1">
                              <p className="text-xs font-semibold text-red-800">🚨 Related Incidents:</p>
                              {message.incidents.slice(0, 2).map((incident: any, index: number) => (
                                <div key={index} className="text-xs p-2 bg-red-50 border border-red-200 rounded">
                                  <div className="flex items-center justify-between">
                                    <span className="font-medium">{incident.location?.city}, {incident.location?.state}</span>
                                    <Badge variant="outline" className="text-xs">
                                      {incident.severity?.toUpperCase()}
                                    </Badge>
                                  </div>
                                  <p className="text-gray-700">{incident.description}</p>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          <div className="text-xs opacity-70 mt-2">
                            {message.timestamp.toLocaleTimeString()}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Section */}
                <div className="p-4 border-t bg-gradient-to-r from-blue-50 to-purple-50">
                  <div className="flex gap-2 mb-3">
                    <Textarea
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder="Ask about damage, traffic, incidents anywhere..."
                      className="min-h-[60px] text-sm resize-none border-2 border-blue-300"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSubmit();
                        }
                      }}
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => handleSubmit()}
                      disabled={!inputText.trim() || isProcessing}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    >
                      {isProcessing ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        >
                          <Loader2 className="h-4 w-4 mr-1" />
                        </motion.div>
                      ) : (
                        <Send className="h-4 w-4 mr-1" />
                      )}
                      Send
                    </Button>
                    
                    <Button
                      onMouseDown={startListening}
                      onMouseUp={stopListening}
                      onMouseLeave={stopListening}
                      disabled={isProcessing}
                      className={`px-4 ${
                        isListening 
                          ? 'bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700' 
                          : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
                      }`}
                    >
                      {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                    </Button>
                  </div>
                  
                  {/* Quick Questions */}
                  <div className="flex gap-1 mt-3 flex-wrap">
                    {[
                      "What's happening in Florida?",
                      "Any traffic issues in Atlanta?",
                      "Trees down in Texas?",
                      "Damage in Orlando?"
                    ].map((question, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        className="text-xs h-7"
                        onClick={() => {
                          setInputText(question);
                          handleSubmit(question);
                        }}
                      >
                        {question}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}