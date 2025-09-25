import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Mic, MicOff, Send, Wrench, Eye, Activity, Copy, Download } from "lucide-react";
import { cn } from "@/lib/utils";

interface ToolCall {
  id: string;
  name: string;
  args: any;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  result?: any;
  timestamp: string;
}

interface AssistantMessage {
  id: string;
  type: 'user' | 'assistant' | 'system' | 'tool_call' | 'tool_result';
  text: string;
  timestamp: string;
  metadata?: any;
}

interface AssistantDockProps {
  className?: string;
  projectId?: string;
  mediaId?: string;
}

export function AssistantDock({ className, projectId, mediaId }: AssistantDockProps) {
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [toolCalls, setToolCalls] = useState<ToolCall[]>([]);
  const [inputText, setInputText] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [sessionId] = useState(() => `session_${Date.now()}`);
  
  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // WebSocket connection
  useEffect(() => {
    const ws = new WebSocket('ws://localhost:5000/ws/assistant');
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      ws.send(JSON.stringify({ type: 'start', sessionId, projectId, mediaId }));
      addMessage('system', 'Assistant connected and ready');
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      handleWebSocketMessage(data);
    };

    ws.onclose = () => {
      setIsConnected(false);
      addMessage('system', 'Assistant disconnected');
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      addMessage('system', 'Connection error');
    };

    return () => {
      ws.close();
    };
  }, [sessionId, projectId, mediaId]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleWebSocketMessage = (data: any) => {
    switch (data.type) {
      case 'assistant_text':
        addMessage('assistant', data.text);
        break;
      case 'tool_call':
        handleToolCall(data);
        break;
      case 'tool_result':
        handleToolResult(data);
        break;
      case 'system_response':
        addMessage('system', data.text, data.metadata);
        break;
      case 'partial_transcript':
        addMessage('assistant', `🎤 ${data.text}`, { partial: true });
        break;
      default:
        console.log('Unknown message type:', data.type);
    }
  };

  const addMessage = (type: AssistantMessage['type'], text: string, metadata?: any) => {
    const message: AssistantMessage = {
      id: `msg_${Date.now()}_${Math.random()}`,
      type,
      text,
      timestamp: new Date().toISOString(),
      metadata
    };
    setMessages(prev => [...prev, message]);
  };

  const handleToolCall = (data: any) => {
    const toolCall: ToolCall = {
      id: data.id || `tool_${Date.now()}`,
      name: data.name,
      args: data.args,
      status: 'executing',
      timestamp: new Date().toISOString()
    };
    
    setToolCalls(prev => [...prev, toolCall]);
    addMessage('tool_call', `🔧 Executing: ${data.name}`, data.args);
  };

  const handleToolResult = (data: any) => {
    const { result } = data;
    
    setToolCalls(prev => 
      prev.map(tc => 
        tc.id === data.id ? { ...tc, status: result.success ? 'completed' : 'failed', result } : tc
      )
    );
    
    if (result.success) {
      addMessage('tool_result', `✅ Tool completed: ${JSON.stringify(result.data)}`, result);
    } else {
      addMessage('tool_result', `❌ Tool failed: ${result.error}`, result);
    }
  };

  const sendMessage = () => {
    if (!inputText.trim() || !isConnected) return;

    addMessage('user', inputText);
    wsRef.current?.send(JSON.stringify({
      type: 'user_text',
      text: inputText,
      sessionId
    }));
    
    setInputText("");
  };

  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      addMessage('system', 'Recording stopped');
    } else {
      setIsRecording(true);
      addMessage('system', 'Recording started...');
      // Voice recording would be implemented here
    }
  };

  const copyFilterGraph = (toolCall: ToolCall) => {
    if (toolCall.result?.data?.filterGraph) {
      navigator.clipboard.writeText(toolCall.result.data.filterGraph);
      addMessage('system', 'Filter graph copied to clipboard');
    }
  };

  const downloadResult = (toolCall: ToolCall) => {
    if (toolCall.result?.data?.outputKey) {
      const link = document.createElement('a');
      link.href = `/uploads/${toolCall.result.data.outputKey}`;
      link.download = toolCall.result.data.outputKey;
      link.click();
    }
  };

  return (
    <Card className={cn("flex flex-col h-96", className)} data-testid="assistant-dock">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Activity className="h-4 w-4" />
          AI Assistant
          <Badge variant={isConnected ? "default" : "destructive"} className="ml-auto">
            {isConnected ? "Connected" : "Disconnected"}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col gap-3 p-3">
        {/* Messages Area */}
        <ScrollArea className="flex-1 border rounded-md p-3" data-testid="messages-area">
          <div className="space-y-2">
            {messages.map((message) => (
              <div key={message.id} className={cn(
                "p-2 rounded-md text-sm",
                message.type === 'user' && "bg-blue-50 dark:bg-blue-950 ml-8",
                message.type === 'assistant' && "bg-green-50 dark:bg-green-950 mr-8",
                message.type === 'system' && "bg-gray-50 dark:bg-gray-950 italic",
                message.type === 'tool_call' && "bg-orange-50 dark:bg-orange-950 border-l-2 border-orange-500",
                message.type === 'tool_result' && "bg-purple-50 dark:bg-purple-950 border-l-2 border-purple-500"
              )} data-testid={`message-${message.type}`}>
                <div className="font-medium text-xs text-muted-foreground mb-1">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </div>
                <div>{message.text}</div>
                {message.metadata && (
                  <div className="text-xs text-muted-foreground mt-1 font-mono">
                    {JSON.stringify(message.metadata, null, 2)}
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Tool Calls Status */}
        {toolCalls.length > 0 && (
          <>
            <Separator />
            <div className="space-y-2" data-testid="tool-calls-area">
              <div className="text-sm font-medium">Active Tool Calls</div>
              {toolCalls.slice(-3).map((toolCall) => (
                <div key={toolCall.id} className="flex items-center justify-between p-2 border rounded-md">
                  <div className="flex items-center gap-2">
                    <Wrench className="h-3 w-3" />
                    <span className="text-sm font-mono">{toolCall.name}</span>
                    <Badge variant={
                      toolCall.status === 'completed' ? 'default' :
                      toolCall.status === 'failed' ? 'destructive' :
                      toolCall.status === 'executing' ? 'outline' : 'secondary'
                    }>
                      {toolCall.status}
                    </Badge>
                  </div>
                  <div className="flex gap-1">
                    {toolCall.result?.data?.filterGraph && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyFilterGraph(toolCall)}
                        data-testid={`copy-filter-${toolCall.id}`}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    )}
                    {toolCall.result?.data?.outputKey && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => downloadResult(toolCall)}
                        data-testid={`download-result-${toolCall.id}`}
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Input Area */}
        <div className="flex gap-2">
          <Input
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Ask assistant for damage analysis, measurements..."
            disabled={!isConnected}
            data-testid="input-message"
            className="flex-1"
          />
          <Button
            onClick={toggleRecording}
            variant={isRecording ? "destructive" : "outline"}
            size="sm"
            disabled={!isConnected}
            data-testid="button-voice"
          >
            {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>
          <Button
            onClick={sendMessage}
            disabled={!inputText.trim() || !isConnected}
            size="sm"
            data-testid="button-send"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setInputText("Add circle annotation for damage")}
            data-testid="button-annotate"
          >
            <Eye className="h-3 w-3 mr-1" />
            Annotate
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setInputText("Measure diameter in frame")}
            data-testid="button-measure"
          >
            <Wrench className="h-3 w-3 mr-1" />
            Measure
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setInputText("Estimate tree weight")}
            data-testid="button-estimate"
          >
            <Activity className="h-3 w-3 mr-1" />
            Estimate
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}