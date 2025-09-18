import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Bot, 
  User, 
  Send, 
  Brain, 
  Zap, 
  AlertTriangle, 
  Target, 
  MapPin,
  Clock,
  Loader2,
  Sparkles,
  TrendingUp,
  Shield
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  confidence?: number;
  sources?: string[];
  recommendations?: string[];
  alerts?: string[];
  metadata?: {
    processingTime: number;
    dataSourcesUsed: string[];
    analysisType: string;
  };
}

interface DisasterPathPrediction {
  disasterType: string;
  currentLocation: {
    latitude: number;
    longitude: number;
    description: string;
  };
  predictedPath: Array<{
    time: string;
    latitude: number;
    longitude: number;
    intensity: number;
    confidence: number;
    impactRadius: number;
    description: string;
  }>;
  affectedRegions: Array<{
    state: string;
    county: string;
    city: string;
    arrivalTime: string;
    peakTime: string;
    departureTime: string;
    riskLevel: 'low' | 'moderate' | 'high' | 'extreme';
    expectedDamage: string;
    populationAtRisk: number;
  }>;
  confidence: {
    overall: number;
    pathAccuracy: number;
    timingAccuracy: number;
    intensityAccuracy: number;
  };
  modelSources: string[];
  lastUpdated: string;
}

interface StormIntelligenceChatProps {
  className?: string;
  initialLocation?: {
    latitude: number;
    longitude: number;
  };
}

export default function StormIntelligenceChat({ className, initialLocation }: StormIntelligenceChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'ai',
      content: '🧠 **Storm Intelligence AI activated!** I have access to real-time weather data, FEMA disaster records, historical patterns, and advanced prediction models. I can provide precise disaster predictions, storm paths, damage assessments, and answer any questions about storm intelligence. What would you like to know?',
      timestamp: new Date(),
      metadata: {
        processingTime: 0,
        dataSourcesUsed: ['System initialization'],
        analysisType: 'welcome'
      }
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pathPrediction, setPathPrediction] = useState<DisasterPathPrediction | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Send query to Storm Intelligence AI
      const response = await fetch('/api/storm-intelligence/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: inputValue,
          location: initialLocation,
          context: 'prediction_dashboard'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: data.answer,
        timestamp: new Date(),
        confidence: data.confidence,
        sources: data.sources,
        recommendations: data.recommendations,
        alerts: data.alerts,
        metadata: data.metadata
      };

      setMessages(prev => [...prev, aiMessage]);

    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: '⚠️ I encountered an error processing your request. Please ensure the AI services are properly configured and try again.',
        timestamp: new Date(),
        confidence: 0.1,
        metadata: {
          processingTime: 0,
          dataSourcesUsed: [],
          analysisType: 'error'
        }
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const generatePathPrediction = async () => {
    if (!initialLocation) {
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'ai',
        content: '⚠️ Location data is required for path prediction. Please provide coordinates.',
        timestamp: new Date(),
        metadata: {
          processingTime: 0,
          dataSourcesUsed: [],
          analysisType: 'error'
        }
      };
      setMessages(prev => [...prev, errorMessage]);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/storm-intelligence/predict-path', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          latitude: initialLocation.latitude,
          longitude: initialLocation.longitude
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate path prediction');
      }

      const prediction = await response.json();
      setPathPrediction(prediction);

      const aiMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'ai',
        content: `🎯 **Disaster Path Prediction Generated**\n\n**Disaster Type:** ${prediction.disasterType}\n**Current Location:** ${prediction.currentLocation.description}\n**Overall Confidence:** ${(prediction.confidence.overall * 100).toFixed(1)}%\n\n**Affected Regions:** ${prediction.affectedRegions.length} areas identified\n**Model Sources:** ${prediction.modelSources.join(', ')}\n\nDetailed path prediction data has been loaded. You can now ask specific questions about the predicted path, timing, or impact areas.`,
        timestamp: new Date(),
        confidence: prediction.confidence.overall,
        sources: prediction.modelSources,
        metadata: {
          processingTime: 0,
          dataSourcesUsed: prediction.modelSources,
          analysisType: 'path_prediction'
        }
      };

      setMessages(prev => [...prev, aiMessage]);

    } catch (error) {
      console.error('Error generating path prediction:', error);
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'ai',
        content: '⚠️ Failed to generate path prediction. Please check the AI services and try again.',
        timestamp: new Date(),
        metadata: {
          processingTime: 0,
          dataSourcesUsed: [],
          analysisType: 'error'
        }
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickQuestions = [
    'Where will the next major storm hit?',
    'What disasters are predicted for Florida this week?',
    'Show me the exact path of Hurricane tracking',
    'Which areas should prepare for severe weather?',
    'What is the current threat level nationwide?',
    'Analyze damage potential for coastal regions'
  ];

  return (
    <Card className={`flex flex-col h-[600px] ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-6 w-6 text-blue-600" />
          Storm Intelligence AI
          <Badge variant="default" className="ml-2 bg-green-600">
            <Sparkles className="h-3 w-3 mr-1" />
            Advanced AI Active
          </Badge>
        </CardTitle>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={generatePathPrediction}
            disabled={isLoading || !initialLocation}
            className="flex items-center gap-1"
            data-testid="button-generate-path"
          >
            <Target className="h-4 w-4" />
            Generate Path Prediction
          </Button>
          <Badge variant="secondary" className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {initialLocation ? 'Location Set' : 'No Location'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col flex-1 gap-3 p-4">
        {/* Quick Questions */}
        <div className="flex flex-wrap gap-2">
          {quickQuestions.slice(0, 3).map((question, index) => (
            <Button
              key={index}
              variant="ghost"
              size="sm"
              onClick={() => setInputValue(question)}
              className="text-xs h-7 px-2"
              data-testid={`button-quick-${index}`}
            >
              {question}
            </Button>
          ))}
        </div>

        <Separator />

        {/* Messages Area */}
        <ScrollArea className="flex-1" ref={scrollAreaRef}>
          <div className="space-y-4 pr-4">
            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.type === 'ai' && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                      <Bot className="h-4 w-4 text-blue-600" />
                    </div>
                  )}
                  
                  <div className={`max-w-[80%] rounded-lg p-3 ${
                    message.type === 'user' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 dark:bg-gray-800'
                  }`}>
                    <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                    
                    {/* AI Message Metadata */}
                    {message.type === 'ai' && (
                      <div className="mt-2 space-y-2">
                        {message.confidence && (
                          <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                            <Shield className="h-3 w-3" />
                            Confidence: {(message.confidence * 100).toFixed(1)}%
                          </div>
                        )}
                        
                        {message.sources && message.sources.length > 0 && (
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            <strong>Sources:</strong> {message.sources.join(', ')}
                          </div>
                        )}
                        
                        {message.recommendations && message.recommendations.length > 0 && (
                          <div className="text-xs">
                            <strong className="text-green-600">Recommendations:</strong>
                            <ul className="list-disc list-inside mt-1 text-gray-600 dark:text-gray-400">
                              {message.recommendations.map((rec, index) => (
                                <li key={index}>{rec}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {message.alerts && message.alerts.length > 0 && (
                          <div className="text-xs">
                            <strong className="text-red-600 flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              Alerts:
                            </strong>
                            <ul className="list-disc list-inside mt-1 text-red-600">
                              {message.alerts.map((alert, index) => (
                                <li key={index}>{alert}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {message.metadata && (
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {message.metadata.processingTime}ms
                            </span>
                            <span className="flex items-center gap-1">
                              <TrendingUp className="h-3 w-3" />
                              {message.metadata.analysisType}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className="text-xs text-gray-500 mt-2">
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                  
                  {message.type === 'user' && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                      <User className="h-4 w-4 text-white" />
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
            
            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-3 justify-start"
              >
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                  <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
                </div>
                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Zap className="h-4 w-4" />
                    Processing with advanced AI models...
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about storm predictions, paths, damage assessments..."
            disabled={isLoading}
            className="flex-1"
            data-testid="input-storm-question"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            size="icon"
            data-testid="button-send-message"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}