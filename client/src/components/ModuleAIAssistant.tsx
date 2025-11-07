import { useState, useRef, useEffect } from 'react';
import { MessageSquare, Mic, Send, X, Volume2, VolumeX, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ModuleAIAssistantProps {
  moduleName: string;
  moduleContext?: string;
  externalTrigger?: { open: boolean; mode: 'text' | 'voice' };
  onTriggerHandled?: () => void;
}

export default function ModuleAIAssistant({ moduleName, moduleContext, externalTrigger, onTriggerHandled }: ModuleAIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<'text' | 'voice'>('text');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const { toast } = useToast();
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (externalTrigger?.open) {
      setIsOpen(true);
      setMode(externalTrigger.mode);
      if (onTriggerHandled) {
        onTriggerHandled();
      }
    }
  }, [externalTrigger, onTriggerHandled]);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      
      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
        if (mode === 'voice') {
          handleSend(transcript);
        }
      };
      
      recognitionRef.current.onerror = () => {
        setIsListening(false);
        toast({
          title: "Voice Error",
          description: "Could not recognize speech. Please try again.",
          variant: "destructive",
        });
      };
      
      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, [mode]);

  const startListening = () => {
    if (recognitionRef.current) {
      setIsListening(true);
      recognitionRef.current.start();
    } else {
      toast({
        title: "Not Supported",
        description: "Voice input is not supported in your browser.",
        variant: "destructive",
      });
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const speakResponse = async (text: string) => {
    if (!audioEnabled) return;
    
    try {
      setIsSpeaking(true);
      
      const truncatedText = text.length > 800 
        ? text.substring(0, 800) + '... For the complete response, please review the full text above.'
        : text;
      
      const response = await fetch('/api/voice-ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: truncatedText,
          voiceId: '21m00Tcm4TlvDq8ikWAM',
          provider: 'elevenlabs'
        }),
      });

      if (!response.ok) {
        throw new Error('Voice generation failed');
      }

      const data = await response.json();
      
      if (!data.audioBase64) {
        throw new Error('No audio data received');
      }
      
      const audioBlob = base64ToBlob(data.audioBase64, 'audio/mpeg');
      const audioUrl = URL.createObjectURL(audioBlob);
      audioUrlRef.current = audioUrl;
      
      if (audioRef.current) {
        audioRef.current.pause();
      }
      
      audioRef.current = new Audio(audioUrl);
      audioRef.current.onended = () => {
        setIsSpeaking(false);
        if (audioUrlRef.current) {
          URL.revokeObjectURL(audioUrlRef.current);
          audioUrlRef.current = null;
        }
      };
      audioRef.current.onerror = () => {
        setIsSpeaking(false);
        if (audioUrlRef.current) {
          URL.revokeObjectURL(audioUrlRef.current);
          audioUrlRef.current = null;
        }
        console.error('Audio playback failed');
      };
      
      audioRef.current.play().catch((error) => {
        console.error('Voice playback error:', error);
        setIsSpeaking(false);
        if (audioUrlRef.current) {
          URL.revokeObjectURL(audioUrlRef.current);
          audioUrlRef.current = null;
        }
        toast({
          title: "Voice Error",
          description: "Could not play voice response. Audio may be unavailable.",
          variant: "destructive",
        });
      });
    } catch (error) {
      console.error('Voice generation error:', error);
      setIsSpeaking(false);
      toast({
        title: "Voice Error",
        description: "Could not generate voice response. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const base64ToBlob = (base64: string, mimeType: string): Blob => {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  };

  const handleSend = async (messageText?: string) => {
    const textToSend = messageText || input.trim();
    if (!textToSend || isLoading) return;

    const userMessage: Message = { role: 'user', content: textToSend };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          moduleName,
          moduleContext,
        }),
      });

      if (!response.ok) {
        throw new Error('AI request failed');
      }

      const data = await response.json();
      const assistantMessage: Message = { role: 'assistant', content: data.response };
      
      setMessages(prev => [...prev, assistantMessage]);
      setIsLoading(false);
      
      if (audioEnabled) {
        speakResponse(data.response);
      }
    } catch (error) {
      console.error('AI chat error:', error);
      setIsLoading(false);
      toast({
        title: "AI Error",
        description: "Failed to get response. Please try again.",
        variant: "destructive",
      });
    }
  };

  const toggleAudio = () => {
    setAudioEnabled(!audioEnabled);
    if (isSpeaking && audioRef.current) {
      audioRef.current.pause();
      setIsSpeaking(false);
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = null;
      }
    }
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-16 w-16 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 shadow-2xl z-50"
        style={{ boxShadow: '0 0 40px rgba(0, 194, 255, 0.5)' }}
        data-testid="button-open-ai-assistant"
      >
        <MessageSquare className="h-7 w-7 text-white" />
      </Button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-black border-2 border-cyan-500/50 rounded-2xl shadow-2xl z-50 flex flex-col"
      style={{ boxShadow: '0 0 60px rgba(0, 194, 255, 0.3)' }}
      data-testid="ai-assistant-panel"
    >
      <div className="bg-gradient-to-r from-cyan-900/80 to-blue-900/80 px-4 py-3 rounded-t-2xl border-b border-cyan-500/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-cyan-400" />
          <h3 className="font-bold text-white">AI Assistant</h3>
          <span className="text-xs text-cyan-300/70">• {moduleName}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleAudio}
            className="h-8 px-3 hover:bg-white/10 flex items-center gap-1.5"
            data-testid="button-toggle-audio"
            title={audioEnabled ? "Rachel will speak responses (click to disable)" : "Enable Rachel voice responses"}
          >
            {audioEnabled ? 
              <Volume2 className="h-4 w-4 text-cyan-400" /> : 
              <VolumeX className="h-4 w-4 text-gray-400" />
            }
            <span className="text-xs text-cyan-300">{audioEnabled ? 'On' : 'Off'}</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
            className="h-8 w-8 p-0 hover:bg-white/10"
            data-testid="button-close-ai-assistant"
          >
            <X className="h-4 w-4 text-white" />
          </Button>
        </div>
      </div>

      <div className="px-4 py-3 bg-slate-900/60 border-b border-cyan-500/20 flex gap-2">
        <Button
          onClick={() => setMode('text')}
          variant={mode === 'text' ? 'default' : 'outline'}
          size="sm"
          className={mode === 'text' 
            ? 'flex-1 bg-cyan-600 hover:bg-cyan-700 text-white'
            : 'flex-1 border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10'
          }
          data-testid="button-mode-text"
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          Text Chat
        </Button>
        <Button
          onClick={() => setMode('voice')}
          variant={mode === 'voice' ? 'default' : 'outline'}
          size="sm"
          className={mode === 'voice' 
            ? 'flex-1 bg-cyan-600 hover:bg-cyan-700 text-white'
            : 'flex-1 border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10'
          }
          data-testid="button-mode-voice"
        >
          <Mic className="h-4 w-4 mr-2" />
          Voice
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-black/40">
        {messages.length === 0 && (
          <div className="text-center text-cyan-300/50 py-8">
            <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">Hi! I'm Rachel, your AI assistant for {moduleName}</p>
            <p className="text-xs mt-2">Type or speak your questions - I'll respond with voice by default!</p>
            {audioEnabled ? (
              <p className="text-xs mt-1 text-cyan-400">🎤 Voice responses enabled</p>
            ) : (
              <p className="text-xs mt-1 text-gray-400">Voice responses disabled (click volume icon to enable)</p>
            )}
          </div>
        )}
        
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            data-testid={`message-${msg.role}-${idx}`}
          >
            <div
              className={`max-w-[80%] rounded-xl px-4 py-2 ${
                msg.role === 'user'
                  ? 'bg-cyan-600 text-white'
                  : 'bg-slate-800 text-cyan-100 border border-cyan-500/30'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-slate-800 border border-cyan-500/30 rounded-xl px-4 py-2">
              <Loader2 className="h-4 w-4 animate-spin text-cyan-400" />
            </div>
          </div>
        )}
        
        {isSpeaking && (
          <div className="flex justify-center">
            <div className="bg-cyan-600/20 border border-cyan-500/50 rounded-full px-4 py-2 flex items-center gap-2">
              <Volume2 className="h-4 w-4 text-cyan-400 animate-pulse" />
              <span className="text-xs text-cyan-300">Speaking...</span>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-slate-900/80 border-t border-cyan-500/30 rounded-b-2xl">
        {mode === 'text' ? (
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Type your question..."
              className="flex-1 min-h-[44px] max-h-32 bg-black/60 border-cyan-500/30 text-white placeholder:text-cyan-300/40 focus:border-cyan-400"
              disabled={isLoading}
              data-testid="input-ai-message"
            />
            <Button
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              className="bg-cyan-600 hover:bg-cyan-700 text-white h-11"
              data-testid="button-send-message"
            >
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {input && (
              <div className="bg-black/60 border border-cyan-500/30 rounded-lg p-3 text-sm text-cyan-100">
                {input}
              </div>
            )}
            <Button
              onClick={isListening ? stopListening : startListening}
              disabled={isLoading || isSpeaking}
              className={`w-full h-14 ${
                isListening
                  ? 'bg-red-600 hover:bg-red-700 animate-pulse'
                  : 'bg-cyan-600 hover:bg-cyan-700'
              } text-white font-semibold`}
              data-testid="button-voice-toggle"
            >
              <Mic className="h-6 w-6 mr-2" />
              {isListening ? 'Listening... (Click to stop)' : 'Click to Speak'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
