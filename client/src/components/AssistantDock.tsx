import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Mic, MicOff, Send, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

interface AssistantDockProps {
  className?: string;
  projectId?: string;
  mediaId?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface Message {
  role: 'user' | 'assistant' | 'system';
  text: string;
  id: string;
  timestamp: string;
}

export function AssistantDock({ 
  className, 
  projectId = 'DEMO', 
  mediaId,
  open: controlledOpen,
  onOpenChange 
}: AssistantDockProps) {
  const [internalOpen, setInternalOpen] = useState(true);
  const [msgs, setMsgs] = useState<Message[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  useEffect(() => {
    const ws = new WebSocket(`${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws/assistant`);
    wsRef.current = ws;
    
    ws.addEventListener('open', () => {
      setIsConnected(true);
      ws.send(JSON.stringify({ type: 'start', projectId, mode: 'ask' }));
      addMessage('system', 'AI Assistant connected and ready');
    });
    
    ws.addEventListener('message', (ev) => {
      const m = JSON.parse(ev.data);
      
      if (m.type === 'assistant_text') {
        addMessage('assistant', m.text);
      } else if (m.type === 'partial_transcript') {
        addMessage('system', `…${m.text}`);
      } else if (m.type === 'tool_call') {
        // Optimistically show intent
        addMessage('system', `[Tool] ${m.name}`);
      } else if (m.type === 'tool_result') {
        if (m.result?.kind === 'overlay_image') {
          addMessage('assistant', `📐 Measurement complete: ${m.result.inches?.toFixed(1) || 'N/A'}" - overlay image generated`);
        } else if (m.result?.kind === 'snippet') {
          addMessage('assistant', `📝 Report snippet: ${m.result.text}`);
        } else {
          addMessage('assistant', `✅ Tool result: ${JSON.stringify(m.result)}`);
        }
      }
    });
    
    ws.addEventListener('close', () => {
      setIsConnected(false);
      addMessage('system', 'Assistant disconnected');
    });
    
    ws.addEventListener('error', (error) => {
      console.error('WebSocket error:', error);
      addMessage('system', 'Connection error');
    });
    
    return () => ws.close();
  }, [projectId]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs]);

  const addMessage = (role: Message['role'], text: string) => {
    const message: Message = {
      id: `msg_${Date.now()}_${Math.random()}`,
      role,
      text,
      timestamp: new Date().toISOString()
    };
    setMsgs(prev => [...prev, message]);
  };

  const sendText = (text: string) => {
    if (!text.trim() || !wsRef.current) return;
    
    wsRef.current.send(JSON.stringify({ type: 'user_text', text }));
    addMessage('user', text);
  };

  const startPTT = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
      mediaRecorderRef.current = mr;
      
      mr.ondataavailable = (e) => {
        e.data.arrayBuffer().then(buf => {
          wsRef.current?.send(JSON.stringify({ 
            type: 'user_audio', 
            pcm: Array.from(new Uint8Array(buf)) 
          }));
        });
      };
      
      mr.start(250);
      setIsRecording(true);
      addMessage('system', '🎤 Recording started...');
    } catch (error) {
      console.error('Failed to start recording:', error);
      addMessage('system', 'Failed to start recording');
    }
  };

  const stopPTT = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      addMessage('system', 'Recording stopped');
    }
  };

  // Send context image when mediaId changes
  useEffect(() => {
    if (mediaId && wsRef.current && isConnected) {
      // For demo, we'll assume we have access to the image data
      // In real implementation, you'd fetch the image data here
      wsRef.current.send(JSON.stringify({ 
        type: 'context_image', 
        mediaId, 
        imageBase64: 'data:image/jpeg;base64,/placeholder' // Replace with actual image data
      }));
    }
  }, [mediaId, isConnected]);

  return (
    <div className={`fixed right-4 bottom-4 w-96 ${open ? '' : 'translate-y-[calc(100%+16px)]'} transition-transform duration-300 z-50`}>
      <Card className="shadow-xl border bg-white dark:bg-gray-800 overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              AI Assistant
              <Badge variant={isConnected ? "default" : "destructive"}>
                {isConnected ? "Connected" : "Disconnected"}
              </Badge>
            </div>
            <button 
              onClick={() => setOpen(false)} 
              className="text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded px-2 py-1"
              data-testid="button-close-assistant"
            >
              ×
            </button>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="p-3">
          <ScrollArea className="h-64 overflow-auto space-y-2 bg-gray-50 dark:bg-gray-900 rounded p-3 mb-3">
            {msgs.map((m, i) => (
              <div key={m.id || i} className={cn(
                "mb-2 text-sm",
                m.role === 'user' && "text-right"
              )}>
                <span className={cn(
                  "inline-block px-2 py-1 rounded-xl max-w-[85%]",
                  m.role === 'user' && "bg-black text-white",
                  m.role === 'assistant' && "bg-white dark:bg-gray-700 border",
                  m.role === 'system' && "bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 italic"
                )}>
                  {m.text}
                </span>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </ScrollArea>
          
          <div className="border-t pt-2 flex items-center gap-2">
            <button 
              onMouseDown={startPTT} 
              onMouseUp={stopPTT}
              className={cn(
                "px-3 py-1.5 rounded-xl border transition-colors",
                isRecording ? "bg-red-500 text-white" : "hover:bg-gray-50 dark:hover:bg-gray-700"
              )}
              disabled={!isConnected}
              data-testid="button-voice-record"
            >
              {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              <span className="ml-1 text-sm">Hold to talk</span>
            </button>
            
            <input 
              id="aiText" 
              placeholder="Ask about this project…" 
              className="flex-1 rounded-xl border px-2 py-1.5 dark:bg-gray-700 dark:border-gray-600" 
              disabled={!isConnected}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const v = (e.target as HTMLInputElement).value.trim();
                  if (v) { 
                    sendText(v); 
                    (e.target as HTMLInputElement).value = ''; 
                  }
                }
              }}
              data-testid="input-assistant-text"
            />
            
            <button 
              className="px-3 py-1.5 rounded-xl bg-black text-white hover:bg-gray-800 disabled:opacity-50 transition-colors" 
              disabled={!isConnected}
              onClick={() => {
                const el = document.getElementById('aiText') as HTMLInputElement; 
                const v = el.value.trim(); 
                if (v) { 
                  sendText(v); 
                  el.value = ''; 
                }
              }}
              data-testid="button-send-text"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          
          {/* Quick Actions */}
          <div className="flex gap-2 mt-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => sendText("Add circle annotation for damage")}
              disabled={!isConnected}
              data-testid="button-quick-annotate"
            >
              🎯 Annotate
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => sendText("Measure diameter in this image")}
              disabled={!isConnected}
              data-testid="button-quick-measure"
            >
              📐 Measure
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => sendText("Detect damage in this image")}
              disabled={!isConnected}
              data-testid="button-quick-damage"
            >
              🔍 Damage
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}