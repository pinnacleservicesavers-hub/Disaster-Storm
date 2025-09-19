import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  Activity
} from 'lucide-react';

interface VoiceAIAssistantProps {
  portalType: 'prediction' | 'damage-detection' | 'drones' | 'leads' | 'all';
  currentData?: any;
  userLocation?: { latitude: number; longitude: number; };
  className?: string;
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

export function VoiceAIAssistant({ 
  portalType, 
  currentData, 
  userLocation, 
  className = "" 
}: VoiceAIAssistantProps) {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentResponse, setCurrentResponse] = useState<VoiceResponse | null>(null);
  const [lastQuestion, setLastQuestion] = useState<string>('');
  const [transcription, setTranscription] = useState<string>('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  // Start voice recognition
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

  // Stop voice recognition
  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  // Get live voice update about current portal
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

  // Handle voice question
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

  // Play audio response
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

  // Stop audio playback
  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
  };

  // Play text using browser's speech synthesis as fallback
  const playBrowserTTS = async (text: string) => {
    try {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        console.warn('Speech synthesis not supported');
        return;
      }

      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      utterance.volume = 0.8;
      
      // Try to find a female voice
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

  // Replay current audio
  const replayAudio = () => {
    if (currentResponse?.audioBase64) {
      playAudio(currentResponse.audioBase64);
    } else if (currentResponse?.text) {
      playBrowserTTS(currentResponse.text);
    }
  };

  return (
    <div className={`${className}`}>
      {/* Main Voice AI Button */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950 dark:to-indigo-950 border-purple-200 dark:border-purple-800">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <motion.div
                  animate={{ 
                    rotate: isProcessing ? 360 : 0,
                    scale: isPlaying ? [1, 1.1, 1] : 1
                  }}
                  transition={{ 
                    rotate: { duration: 2, repeat: isProcessing ? Infinity : 0, ease: "linear" },
                    scale: { duration: 0.8, repeat: isPlaying ? Infinity : 0 }
                  }}
                >
                  <Bot className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </motion.div>
                <div>
                  <CardTitle className="text-lg text-purple-900 dark:text-purple-100">ARIA Voice AI</CardTitle>
                  <CardDescription className="text-purple-600 dark:text-purple-400">
                    Advanced Response Intelligence Assistant
                  </CardDescription>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                  {portalType.charAt(0).toUpperCase() + portalType.slice(1)} Portal
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
            {/* Control Buttons */}
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
                {isListening ? 'Stop' : 'Ask Question'}
              </Button>
              
              {currentResponse?.audioBase64 && (
                <div className="flex items-center space-x-2">
                  <Button
                    onClick={isPlaying ? stopAudio : replayAudio}
                    variant="outline"
                    size="sm"
                    data-testid="button-audio-control"
                  >
                    {isPlaying ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    onClick={replayAudio}
                    variant="outline"
                    size="sm"
                    disabled={isPlaying}
                    data-testid="button-replay"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* Voice Recognition Status */}
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
            </AnimatePresence>

            {/* Processing Status */}
            <AnimatePresence>
              {isProcessing && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-purple-50 dark:bg-purple-950 p-3 rounded-lg border border-purple-200 dark:border-purple-800"
                >
                  <div className="flex items-center space-x-2">
                    <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                    <span className="text-purple-800 dark:text-purple-200 font-medium">
                      ARIA is analyzing your request...
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error Display */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-red-50 dark:bg-red-950 p-3 rounded-lg border border-red-200 dark:border-red-800"
                >
                  <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Response Display */}
            <AnimatePresence>
              {currentResponse && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 p-4 rounded-lg border border-green-200 dark:border-green-800"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <MessageCircle className="w-4 h-4 text-green-600" />
                        <span className="font-medium text-green-800 dark:text-green-200">
                          {lastQuestion}
                        </span>
                      </div>
                      <Button
                        onClick={() => setIsExpanded(!isExpanded)}
                        variant="ghost"
                        size="sm"
                        data-testid="button-expand-response"
                      >
                        {isExpanded ? 'Collapse' : 'Expand'}
                      </Button>
                    </div>
                    
                    <div className="text-green-700 dark:text-green-300 text-sm leading-relaxed">
                      {isExpanded ? currentResponse.text : `${currentResponse.text.substring(0, 150)}...`}
                    </div>

                    {isExpanded && currentResponse.analysis && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                        {currentResponse.analysis.urgentAlerts.length > 0 && (
                          <div className="bg-red-50 dark:bg-red-900 p-3 rounded border border-red-200 dark:border-red-700">
                            <h4 className="font-medium text-red-800 dark:text-red-200 mb-2">Urgent Alerts</h4>
                            <ul className="text-red-700 dark:text-red-300 text-xs space-y-1">
                              {currentResponse.analysis.urgentAlerts.map((alert, idx) => (
                                <li key={idx} className="flex items-start space-x-1">
                                  <span className="text-red-500 mt-0.5">•</span>
                                  <span>{alert}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {currentResponse.analysis.actionItems.length > 0 && (
                          <div className="bg-blue-50 dark:bg-blue-900 p-3 rounded border border-blue-200 dark:border-blue-700">
                            <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Action Items</h4>
                            <ul className="text-blue-700 dark:text-blue-300 text-xs space-y-1">
                              {currentResponse.analysis.actionItems.map((item, idx) => (
                                <li key={idx} className="flex items-start space-x-1">
                                  <span className="text-blue-500 mt-0.5">•</span>
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {currentResponse.analysis.keyInsights.length > 0 && (
                          <div className="bg-purple-50 dark:bg-purple-900 p-3 rounded border border-purple-200 dark:border-purple-700">
                            <h4 className="font-medium text-purple-800 dark:text-purple-200 mb-2">Key Insights</h4>
                            <ul className="text-purple-700 dark:text-purple-300 text-xs space-y-1">
                              {currentResponse.analysis.keyInsights.slice(0, 3).map((insight, idx) => (
                                <li key={idx} className="flex items-start space-x-1">
                                  <span className="text-purple-500 mt-0.5">•</span>
                                  <span>{insight}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {currentResponse.analysis.dataPoints.length > 0 && (
                          <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700">
                            <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Data Points</h4>
                            <ul className="text-gray-700 dark:text-gray-300 text-xs space-y-1">
                              {currentResponse.analysis.dataPoints.slice(0, 4).map((point, idx) => (
                                <li key={idx} className="flex items-start space-x-1">
                                  <span className="text-gray-500 mt-0.5">•</span>
                                  <span>{point}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

export default VoiceAIAssistant;