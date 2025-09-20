import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Bot, 
  MessageCircle, 
  Loader2,
  Play,
  Pause,
  RotateCcw,
  Brain,
  Activity,
  Type,
  Send,
  Square
} from 'lucide-react';

interface UnifiedAssistantProps {
  portalType: 'prediction' | 'damage-detection' | 'drones' | 'leads' | 'surveillance' | 'weather' | 'all';
  currentData?: any;
  userLocation?: { latitude: number; longitude: number; };
  className?: string;
  mode?: 'voice' | 'chat' | 'guide' | 'full';
}

interface VoiceResponse {
  text: string;
  audioBase64?: string;
  analysis: {
    keyInsights: string[];
    actionItems: string[];
    urgentAlerts: string[];
    dataPoints: string[];
  };
  timestamp: Date;
}

/**
 * UnifiedAssistant - The single AI assistant component for all DisasterDirect portals
 * Consolidates VoiceAIAssistant, AIAssistant, ChatWidget, VoiceGuide, StormIntelligenceChat, and PortalVoiceGuide
 * into one clean, consistent interface that adapts to different portal needs
 */
export function UnifiedAssistant({ 
  portalType, 
  currentData, 
  userLocation, 
  className = "",
  mode = "full"
}: UnifiedAssistantProps) {
  // Voice AI States (from VoiceAIAssistant)
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentResponse, setCurrentResponse] = useState<VoiceResponse | null>(null);
  const [lastQuestion, setLastQuestion] = useState<string>('');
  const [transcription, setTranscription] = useState<string>('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [textQuestion, setTextQuestion] = useState<string>('');
  const [showTextInput, setShowTextInput] = useState(false);

  // Chat States (from ChatWidget)
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');

  // Guide States (from VoiceGuide)
  const [currentGuide, setCurrentGuide] = useState<string>('');

  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const current = event.resultIndex;
        const transcript = event.results[current][0].transcript;
        setTranscription(transcript);
        
        if (event.results[current].isFinal) {
          handleQuestion(transcript);
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setError(`Voice recognition error: ${event.error}`);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  // Voice AI Functions
  const startListening = () => {
    if (!recognitionRef.current) {
      setError('Voice recognition not supported in this browser');
      return;
    }

    setError(null);
    setTranscription('');
    setIsListening(true);
    recognitionRef.current.start();
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  const getLiveUpdate = async () => {
    setError(null);
    setIsProcessing(true);
    
    try {
      const response = await fetch('/api/voice-ai/quick-update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          portalType,
          currentData
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const voiceResponse: VoiceResponse = await response.json();
      setCurrentResponse(voiceResponse);
      setLastQuestion('Live Portal Update');
      
      // Play the audio if available, otherwise use browser TTS
      if (voiceResponse.audioBase64) {
        await playAudio(voiceResponse.audioBase64);
      } else {
        await playBrowserTTS(voiceResponse.text);
      }
      
      setIsExpanded(true);
    } catch (error) {
      console.error('Error getting live update:', error);
      setError('Failed to get live update. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleQuestion = async (question: string) => {
    if (!question.trim()) return;

    setError(null);
    setIsProcessing(true);
    setLastQuestion(question);
    
    try {
      const response = await fetch('/api/voice-ai/answer-question', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: question.trim(),
          portalType,
          currentData
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const voiceResponse: VoiceResponse = await response.json();
      setCurrentResponse(voiceResponse);
      
      // Play the audio if available, otherwise use browser TTS
      if (voiceResponse.audioBase64) {
        await playAudio(voiceResponse.audioBase64);
      } else {
        await playBrowserTTS(voiceResponse.text);
      }
      
      setIsExpanded(true);
    } catch (error) {
      console.error('Error answering question:', error);
      setError('Failed to process your question. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTextQuestion = async () => {
    if (!textQuestion.trim()) return;
    
    await handleQuestion(textQuestion);
    setTextQuestion('');
    setShowTextInput(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleTextQuestion();
    }
  };

  const playAudio = async (audioBase64: string) => {
    try {
      const audioBlob = new Blob([
        Uint8Array.from(atob(audioBase64), c => c.charCodeAt(0))
      ], { type: 'audio/mpeg' });
      
      const audioUrl = URL.createObjectURL(audioBlob);
      
      if (audioRef.current) {
        audioRef.current.pause();
      }
      
      audioRef.current = new Audio(audioUrl);
      audioRef.current.onplay = () => setIsPlaying(true);
      audioRef.current.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
      };
      audioRef.current.onerror = () => {
        setIsPlaying(false);
        setError('Failed to play audio response');
        URL.revokeObjectURL(audioUrl);
      };
      
      await audioRef.current.play();
    } catch (error) {
      console.error('Error playing audio:', error);
      setError('Failed to play audio response');
    }
  };

  const playBrowserTTS = async (text: string) => {
    try {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        console.warn('Speech synthesis not supported');
        return;
      }

      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      utterance.volume = 0.8;
      
      const voices = window.speechSynthesis.getVoices();
      const femaleVoice = voices.find(voice => {
        const name = voice.name.toLowerCase();
        return (name.includes('female') || name.includes('woman') ||
               name.includes('zira') || name.includes('hazel') ||
               name.includes('samantha') || name.includes('karen') ||
               name.includes('victoria') || name.includes('susan') ||
               name.includes('mary') || name.includes('anna') ||
               name.includes('emma') || name.includes('alice')) && 
               voice.lang.includes('en');
      }) || voices.find(voice => voice.lang.includes('en')) || voices[0];
      
      if (femaleVoice) {
        utterance.voice = femaleVoice;
      }
      
      utterance.onstart = () => setIsPlaying(true);
      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => {
        setIsPlaying(false);
        setError('Failed to play speech');
      };
      
      window.speechSynthesis.speak(utterance);
    } catch (error) {
      console.error('Error with browser TTS:', error);
      setError('Failed to play speech');
    }
  };

  const stopEverything = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
    
    setIsPlaying(false);
    setIsListening(false);
    setIsProcessing(false);
    setTranscription('');
    setError(null);
  };

  const replayAudio = () => {
    if (currentResponse?.audioBase64) {
      playAudio(currentResponse.audioBase64);
    } else if (currentResponse?.text) {
      playBrowserTTS(currentResponse.text);
    }
  };

  const getPortalDisplayName = () => {
    const names = {
      'prediction': 'Storm Prediction',
      'damage-detection': 'Damage Detection', 
      'drones': 'Drone Operations',
      'leads': 'Lead Intelligence',
      'surveillance': 'Surveillance Center',
      'weather': 'Weather Center',
      'all': 'DisasterDirect'
    };
    return names[portalType] || 'Portal';
  };

  // Render different modes
  if (mode === 'voice') {
    return (
      <Card className={`bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950 border-purple-200 dark:border-purple-800 ${className}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <motion.div
                animate={{ 
                  rotate: isProcessing ? 360 : 0,
                  scale: isPlaying ? [1, 1.1, 1] : 1
                }}
                transition={{ 
                  rotate: { duration: 2, repeat: isProcessing ? Infinity : 0 },
                  scale: { duration: 0.5, repeat: isPlaying ? Infinity : 0 }
                }}
              >
                <Bot className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </motion.div>
              <div>
                <CardTitle className="text-lg text-purple-900 dark:text-purple-100">ARIA Voice AI</CardTitle>
                <CardDescription className="text-purple-600 dark:text-purple-400">
                  {getPortalDisplayName()} Assistant
                </CardDescription>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                {getPortalDisplayName()}
              </Badge>
              {isPlaying && (
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                >
                  <Activity className="w-4 h-4 text-green-500" />
                </motion.div>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-3">
            <Button
              onClick={getLiveUpdate}
              disabled={isProcessing || isListening}
              className="bg-purple-600 hover:bg-purple-700 text-white"
              data-testid="button-live-update"
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Brain className="w-4 h-4 mr-2" />
              )}
              Live Update
            </Button>
            
            <Button
              onClick={isListening ? stopListening : startListening}
              disabled={isProcessing}
              variant={isListening ? "destructive" : "secondary"}
              className={isListening ? "" : "bg-blue-600 hover:bg-blue-700 text-white"}
              data-testid="button-voice-input"
            >
              {isListening ? (
                <MicOff className="w-4 h-4 mr-2" />
              ) : (
                <Mic className="w-4 h-4 mr-2" />
              )}
              {isListening ? 'Stop Voice' : 'Voice Question'}
            </Button>

            <Button
              onClick={() => setShowTextInput(!showTextInput)}
              disabled={isProcessing || isListening}
              variant="outline"
              className="bg-green-600 hover:bg-green-700 text-white border-green-600"
              data-testid="button-text-input"
            >
              <Type className="w-4 h-4 mr-2" />
              Text Question
            </Button>

            {(isPlaying || isProcessing || isListening) && (
              <Button
                onClick={stopEverything}
                variant="destructive"
                className="bg-red-600 hover:bg-red-700 text-white"
                data-testid="button-stop-all"
              >
                <Square className="w-4 h-4 mr-2" />
                Stop ARIA
              </Button>
            )}
          </div>

          {/* Voice Recognition & Text Input */}
          <AnimatePresence>
            {isListening && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg border border-blue-200 dark:border-blue-800"
              >
                <div className="flex items-center space-x-2">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    <Mic className="w-4 h-4 text-blue-600" />
                  </motion.div>
                  <span className="text-blue-800 dark:text-blue-200 font-medium">
                    Listening... {transcription && `"${transcription}"`}
                  </span>
                </div>
              </motion.div>
            )}

            {showTextInput && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-green-50 dark:bg-green-950 p-3 rounded-lg border border-green-200 dark:border-green-800"
              >
                <div className="flex items-center space-x-2">
                  <Input
                    value={textQuestion}
                    onChange={(e) => setTextQuestion(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your question about storm intelligence..."
                    disabled={isProcessing}
                    className="flex-1"
                    data-testid="input-text-question"
                  />
                  <Button
                    onClick={handleTextQuestion}
                    disabled={isProcessing || !textQuestion.trim()}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white"
                    data-testid="button-send-text"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error Display */}
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-red-50 dark:bg-red-950 p-3 rounded-lg border border-red-200 dark:border-red-800"
            >
              <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
            </motion.div>
          )}

          {/* Response Display */}
          <AnimatePresence>
            {currentResponse && isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-white dark:bg-gray-900 rounded-lg border p-4 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                    {lastQuestion || 'ARIA Response'}
                  </h4>
                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={replayAudio}
                      variant="outline"
                      size="sm"
                      data-testid="button-replay"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                  {currentResponse.text}
                </div>
                
                {currentResponse.analysis && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    {currentResponse.analysis.keyInsights.length > 0 && (
                      <div>
                        <h5 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Key Insights</h5>
                        <ul className="space-y-1">
                          {currentResponse.analysis.keyInsights.map((insight, index) => (
                            <li key={index} className="text-sm text-gray-600 dark:text-gray-400">
                              • {insight}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {currentResponse.analysis.actionItems.length > 0 && (
                      <div>
                        <h5 className="font-medium text-green-900 dark:text-green-100 mb-2">Action Items</h5>
                        <ul className="space-y-1">
                          {currentResponse.analysis.actionItems.map((item, index) => (
                            <li key={index} className="text-sm text-gray-600 dark:text-gray-400">
                              • {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    );
  }

  // For full mode, return tabbed interface
  return (
    <Card className={`${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Bot className="w-6 h-6" />
          <span>ARIA - {getPortalDisplayName()} Assistant</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="voice" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="voice">Voice AI</TabsTrigger>
            <TabsTrigger value="chat">Chat</TabsTrigger>
            <TabsTrigger value="guide">Guide</TabsTrigger>
          </TabsList>
          
          <TabsContent value="voice" className="mt-4">
            <UnifiedAssistant 
              portalType={portalType}
              currentData={currentData}
              userLocation={userLocation}
              mode="voice"
            />
          </TabsContent>
          
          <TabsContent value="chat" className="mt-4">
            <div className="text-center text-gray-500 py-8">
              Chat mode coming soon - unified chat interface
            </div>
          </TabsContent>
          
          <TabsContent value="guide" className="mt-4">
            <div className="text-center text-gray-500 py-8">
              Guide mode coming soon - portal guidance system
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}