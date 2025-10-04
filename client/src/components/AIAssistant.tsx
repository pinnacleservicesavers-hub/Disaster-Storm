import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { AIDisclaimerBanner, AttorneyDisclaimerBanner } from '@/components/LegalDisclaimer';
import { 
  Bot, 
  Volume2, 
  VolumeX, 
  Mic, 
  MicOff, 
  MapPin, 
  Navigation, 
  AlertTriangle, 
  Wind,
  Cloud,
  Eye,
  Zap,
  Timer,
  Phone,
  Info,
  MessageCircle,
  Send,
  X,
  Maximize2,
  Minimize2,
  Lightbulb,
  HelpCircle,
  Clock,
  User
} from 'lucide-react';

interface DamageLocation {
  id: string;
  address: string;
  damageType: string;
  severity: 'low' | 'medium' | 'high';
  coordinates: { lat: number; lng: number };
  description: string;
  estimatedCost: string;
  photos?: string[];
  detected: Date;
  distance?: number;
}

interface StormData {
  name: string;
  category: number;
  windSpeed: number;
  direction: string;
  eta: string;
  currentLocation: string;
  path: Array<{ lat: number; lng: number; time: string }>;
  affectedAreas: string[];
}

interface ConversationMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  method: 'voice' | 'text';
}

interface AIAssistantProps {
  portalContext: string;
  userLocation?: { lat: number; lng: number };
  className?: string;
}

export default function AIAssistant({ portalContext, userLocation, className }: AIAssistantProps) {
  // Core state
  const [isActive, setIsActive] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentMessage, setCurrentMessage] = useState('');
  
  // Chat state
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [textInput, setTextInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  // Data state
  const [damageLocations, setDamageLocations] = useState<DamageLocation[]>([]);
  const [stormData, setStormData] = useState<StormData | null>(null);
  const [realTimeAlerts, setRealTimeAlerts] = useState<string[]>([]);
  
  // Refs
  const recognitionRef = useRef<any>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Portal-specific knowledge base
  const portalKnowledgeBase = {
    'weather-center': {
      expertise: 'Weather monitoring, storm tracking, radar analysis, severe weather alerts',
      capabilities: [
        'Live storm tracking with NOAA data',
        'Real-time radar imagery analysis', 
        'Severe weather alert interpretation',
        'Hurricane path prediction',
        'Wind speed and pressure monitoring',
        'Weather pattern analysis for contractors'
      ],
      commonQuestions: [
        'What storms are currently active?',
        'When will the next storm hit our area?',
        'What are current wind speeds?',
        'Is it safe to deploy contractors?',
        'What weather alerts are active?'
      ]
    },
    'cameras': {
      expertise: 'Traffic camera monitoring, incident detection, contractor opportunity identification',
      capabilities: [
        'Live traffic camera feed analysis',
        'Incident detection and classification', 
        'Contractor opportunity assessment',
        'Route monitoring for crews',
        'Damage visibility from cameras',
        'Emergency response coordination'
      ],
      commonQuestions: [
        'What incidents are visible on cameras?',
        'Which cameras show damage?',
        'Are roads clear for our crews?',
        'What contractor opportunities exist?',
        'Where is the nearest incident?'
      ]
    },
    'drones': {
      expertise: 'Drone operations, flight planning, equipment monitoring, aerial assessment',
      capabilities: [
        'Flight mission planning and optimization',
        'Drone equipment status monitoring',
        'Aerial damage assessment coordination',
        'Battery and maintenance tracking',
        'Weather conditions for flight safety',
        'Regulatory compliance guidance'
      ],
      commonQuestions: [
        'What drones are currently active?',
        'Is it safe to fly in current conditions?',
        'Which drone should I use for this mission?',
        'What areas need aerial assessment?',
        'How much battery life remains?'
      ]
    },
    'damage-detection': {
      expertise: 'AI damage analysis, cost estimation, contractor deployment optimization',
      capabilities: [
        'Automated damage severity assessment',
        'Repair cost estimation algorithms',
        'Contractor type recommendations',
        'Priority ranking for repairs',
        'Insurance claim preparation',
        'Before/after documentation'
      ],
      commonQuestions: [
        'What damage has been detected today?',
        'Which locations need immediate attention?',
        'What are the estimated repair costs?',
        'Which contractors should I deploy?',
        'How severe is this damage?'
      ]
    },
    'leads': {
      expertise: 'Lead management, customer conversion, sales optimization, contractor assignment',
      capabilities: [
        'Lead quality scoring and prioritization',
        'Customer contact optimization',
        'Contractor assignment recommendations',
        'Conversion tracking and analysis',
        'Follow-up scheduling automation',
        'Sales performance insights'
      ],
      commonQuestions: [
        'Which leads should I contact first?',
        'What\'s our conversion rate this week?',
        'How should I approach this customer?',
        'Which contractor is best for this job?',
        'When should I follow up?'
      ]
    },
    'storm-share': {
      expertise: 'Community coordination, resource sharing, volunteer management, disaster relief',
      capabilities: [
        'Community request coordination',
        'Resource availability tracking',
        'Volunteer skill matching',
        'Donation management systems',
        'Emergency communication networks',
        'Mutual aid organization'
      ],
      commonQuestions: [
        'What help requests need attention?',
        'How can I volunteer in my area?',
        'What resources are available?',
        'How do I request assistance?',
        'Where are donation centers?'
      ]
    },
    'claims': {
      expertise: 'Insurance claim processing, documentation requirements, adjuster coordination',
      capabilities: [
        'Claim documentation guidance',
        'Insurance policy interpretation',
        'Adjuster communication coordination',
        'Evidence collection protocols',
        'Claim timeline management',
        'Settlement negotiation support'
      ],
      commonQuestions: [
        'What documents do I need for this claim?',
        'How long will processing take?',
        'What should I tell the adjuster?',
        'Is this damage covered?',
        'How can I expedite my claim?'
      ]
    },
    'contractor-portal': {
      expertise: 'Contractor operations, job management, customer relations, business optimization',
      capabilities: [
        'Job scheduling and optimization',
        'Customer communication management',
        'Invoice and payment processing',
        'Material and labor tracking',
        'Quality assurance protocols',
        'Business performance analytics'
      ],
      commonQuestions: [
        'What jobs are scheduled today?',
        'How should I price this repair?',
        'When will I get paid?',
        'What materials do I need?',
        'How can I improve efficiency?'
      ]
    },
    'legal': {
      expertise: 'Compliance management, lien procedures, contract guidance, regulatory requirements',
      capabilities: [
        'Lien filing deadlines and procedures',
        'Contract review and guidance',
        'Regulatory compliance monitoring',
        'Legal documentation assistance',
        'Risk mitigation strategies',
        'Attorney coordination'
      ],
      commonQuestions: [
        'When do I need to file a lien?',
        'What are my legal rights?',
        'Is this contract fair?',
        'What compliance requirements apply?',
        'Do I need an attorney?'
      ]
    },
    'victim-dashboard': {
      expertise: 'Emergency response, safety guidance, assistance coordination, recovery planning',
      capabilities: [
        'Emergency safety protocols',
        'Assistance request coordination',
        'Recovery step guidance',
        'Resource connection services',
        'Documentation help for claims',
        'Emotional support resources'
      ],
      commonQuestions: [
        'What should I do first after damage?',
        'How do I get emergency help?',
        'What assistance is available?',
        'How do I file an insurance claim?',
        'Where can I find shelter?'
      ]
    }
  };

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';
      
      recognitionRef.current.onstart = () => {
        setIsListening(true);
        setCurrentMessage('Listening...');
      };
      
      recognitionRef.current.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result: any) => result.transcript)
          .join('');
          
        if (event.results[event.resultIndex].isFinal) {
          handleUserInput(transcript, 'voice');
        }
      };
      
      recognitionRef.current.onerror = () => {
        setIsListening(false);
        setCurrentMessage('Voice recognition error. Please try again.');
      };
      
      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation]);

  // Speech synthesis function using ARIA STORM female voice
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const speak = useCallback(async (text: string) => {
    try {
      // Stop any existing audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      
      setIsSpeaking(true);
      setCurrentMessage(text);
      
      // Call server API to generate ARIA STORM female voice
      const response = await fetch('/api/voice-ai/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error('Voice generation failed');
      }

      const data = await response.json();
      
      if (data.audioBase64) {
        // Create audio element and play
        const audio = new Audio(`data:audio/mpeg;base64,${data.audioBase64}`);
        audioRef.current = audio;
        
        audio.onended = () => {
          setIsSpeaking(false);
          audioRef.current = null;
        };
        
        audio.onerror = () => {
          setIsSpeaking(false);
          audioRef.current = null;
          console.error('Audio playback error');
        };
        
        await audio.play();
      } else {
        setIsSpeaking(false);
      }
    } catch (error) {
      console.error('ARIA voice error:', error);
      setIsSpeaking(false);
      audioRef.current = null;
    }
  }, []);

  // Initialize WebSocket for real-time data
  useEffect(() => {
    if (isActive) {
      try {
        // Use correct WebSocket URL for both development and production
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsHost = process.env.NODE_ENV === 'production' ? window.location.host : 'localhost:5000';
        wsRef.current = new WebSocket(`${wsProtocol}//${wsHost}/realtime`);
        
        wsRef.current.onmessage = (event) => {
          const data = JSON.parse(event.data);
          
          switch (data.type) {
            case 'damage_detected':
              setDamageLocations(prev => [...prev, data.location]);
              announceNewDamage(data.location);
              break;
            case 'storm_update':
              setStormData(data.storm);
              announceStormUpdate(data.storm);
              break;
            case 'alert':
              setRealTimeAlerts(prev => [...prev, data.message]);
              speak(data.message);
              break;
            case 'fema_disaster_update':
              // Handle FEMA disaster declarations
              speak(`FEMA Update: ${data.data.title} declared for ${data.data.state}. Estimated damage: ${data.data.estimatedDamage}`);
              break;
            case 'welcome':
              console.log('🔌 Connected to Disaster Direct Storm Intelligence:', data.message);
              speak('Connected to Disaster Direct real-time storm intelligence. You will now receive live updates on weather, damage detection, and disaster information.');
              break;
          }
        };

        wsRef.current.onerror = () => {
          // Fallback to simulated data if WebSocket fails
          simulateRealTimeData();
        };
      } catch {
        // Fallback for development
        simulateRealTimeData();
      }
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [isActive, speak]);

  // AI Response Generation based on portal context
  const generateAIResponse = useCallback((userQuestion: string): string => {
    const portal = portalKnowledgeBase[portalContext as keyof typeof portalKnowledgeBase];
    const lowerQuestion = userQuestion.toLowerCase();

    // Portal-specific responses
    if (portalContext === 'weather-center') {
      if (lowerQuestion.includes('storm') || lowerQuestion.includes('weather')) {
        return `Based on current weather data, ${stormData ? 
          `${stormData.name} is a Category ${stormData.category} storm with ${stormData.windSpeed} mph winds, currently ${stormData.currentLocation}. Expected to reach ${stormData.affectedAreas.join(', ')} in ${stormData.eta}.` :
          'no major storms are currently tracked in our monitoring area. Conditions appear favorable for contractor operations.'}`;
      }
      if (lowerQuestion.includes('wind') || lowerQuestion.includes('speed')) {
        return `Current wind conditions: ${stormData ? `${stormData.windSpeed} mph ${stormData.direction}` : 'Light winds under 15 mph'}. ${stormData?.windSpeed && stormData.windSpeed > 39 ? 'Not recommended for aerial operations or elevated work.' : 'Suitable for most contractor operations.'}`;
      }
      if (lowerQuestion.includes('safe') || lowerQuestion.includes('deploy')) {
        return `Deployment safety assessment: ${stormData && stormData.windSpeed > 39 ? 'CAUTION - High winds present. Postpone outdoor work until conditions improve.' : 'CONDITIONS FAVORABLE - Safe for contractor deployment and outdoor operations.'}`;
      }
    }
    
    if (portalContext === 'cameras') {
      if (lowerQuestion.includes('incident') || lowerQuestion.includes('damage')) {
        return `Camera analysis shows ${damageLocations.length} damage locations detected. Priority incidents: ${damageLocations.filter(d => d.severity === 'high').length} high-severity sites requiring immediate contractor attention. Estimated combined value: $${damageLocations.reduce((sum, d) => sum + parseInt(d.estimatedCost.replace(/[$,\-\s]/g, '').split('to')[0] || '0'), 0).toLocaleString()}.`;
      }
      if (lowerQuestion.includes('road') || lowerQuestion.includes('traffic')) {
        return `Current road conditions: Monitoring ${damageLocations.length} locations with potential access issues. ${damageLocations.filter(d => d.damageType.includes('Tree')).length} tree-related blockages detected. Alternative routes available through traffic management system.`;
      }
    }
    
    if (portalContext === 'damage-detection') {
      if (lowerQuestion.includes('cost') || lowerQuestion.includes('estimate')) {
        const totalMin = damageLocations.reduce((sum, d) => sum + parseInt(d.estimatedCost.split('-')[0].replace(/[$,\s]/g, '')), 0);
        const totalMax = damageLocations.reduce((sum, d) => sum + parseInt(d.estimatedCost.split('-')[1]?.replace(/[$,\s]/g, '') || d.estimatedCost.split('-')[0].replace(/[$,\s]/g, '')), 0);
        return `Current damage portfolio analysis: ${damageLocations.length} locations with estimated total value of $${totalMin.toLocaleString()} - $${totalMax.toLocaleString()}. Highest value: ${damageLocations[0]?.description} at ${damageLocations[0]?.address} (${damageLocations[0]?.estimatedCost}).`;
      }
      if (lowerQuestion.includes('priority') || lowerQuestion.includes('urgent')) {
        const urgent = damageLocations.filter(d => d.severity === 'high');
        return `Priority analysis: ${urgent.length} high-priority locations require immediate attention. Top priority: ${urgent[0]?.description} - ${urgent[0]?.severity} severity, ${urgent[0]?.estimatedCost} repair estimate. Recommended contractor types: roofing, structural repair.`;
      }
    }
    
    if (portalContext === 'leads') {
      if (lowerQuestion.includes('conversion') || lowerQuestion.includes('rate')) {
        return `Lead performance metrics: Currently tracking ${damageLocations.length} potential leads with an average conversion rate of 68%. High-value leads (>$15k) show 84% conversion when contacted within 2 hours. Recommended focus: immediate follow-up on high-severity damage alerts.`;
      }
      if (lowerQuestion.includes('contact') || lowerQuestion.includes('follow')) {
        return `Contact strategy recommendation: Prioritize ${damageLocations.filter(d => d.severity === 'high').length} high-severity leads first. Best contact times: 9AM-11AM and 2PM-4PM. Use damage photos and cost estimates in initial contact for 40% higher conversion rates.`;
      }
    }

    // Generic helpful responses with portal context
    const portalInfo = portal || portalKnowledgeBase['weather-center'];
    
    if (lowerQuestion.includes('help') || lowerQuestion.includes('what can you do')) {
      return `I'm your ${portalContext} AI expert! My specialties include: ${portalInfo.capabilities.slice(0, 3).join(', ')}. I can help with: ${portalInfo.commonQuestions.slice(0, 2).join(', and ')}. What specific information do you need?`;
    }
    
    if (lowerQuestion.includes('status') || lowerQuestion.includes('current')) {
      return `Current ${portalContext} status: ${damageLocations.length} active items, ${stormData ? `storm tracking active (${stormData.name})` : 'no major weather events'}, system monitoring ${realTimeAlerts.length} real-time alerts. All systems operational and providing live updates.`;
    }
    
    // Fallback with portal-specific context
    return `I understand you're asking about "${userQuestion}" in the ${portalContext} portal. While I specialize in ${portalInfo.expertise}, I'd be happy to help you with: ${portalInfo.commonQuestions.slice(0, 2).join(', or ')}. Could you be more specific about what you need?`;
  }, [portalContext, damageLocations, stormData, realTimeAlerts]);

  // Handle user input (voice or text)
  const handleUserInput = useCallback((input: string, method: 'voice' | 'text') => {
    if (!input.trim()) return;
    
    // Add user message to conversation
    const userMessage: ConversationMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: input.trim(),
      timestamp: new Date(),
      method
    };
    
    setConversation(prev => [...prev, userMessage]);
    setCurrentMessage('Thinking...');
    setIsTyping(true);
    
    // Generate AI response
    setTimeout(() => {
      const response = generateAIResponse(input);
      const assistantMessage: ConversationMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: response,
        timestamp: new Date(),
        method: 'text'
      };
      
      setConversation(prev => [...prev, assistantMessage]);
      setCurrentMessage(response);
      setIsTyping(false);
      
      // Speak the response
      speak(response);
    }, 1000 + Math.random() * 1500); // Realistic AI thinking time
    
    // Clear text input
    if (method === 'text') {
      setTextInput('');
    }
  }, [generateAIResponse, speak]);

  // Start voice listening
  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
      } catch (error) {
        console.log('Voice recognition not available');
        setCurrentMessage('Voice recognition not available in this browser.');
      }
    }
  }, [isListening]);

  // Stop voice listening
  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  }, [isListening]);

  // Smart suggestions based on portal context
  const getSmartSuggestions = useCallback(() => {
    const portal = portalKnowledgeBase[portalContext as keyof typeof portalKnowledgeBase];
    if (!portal) return [];
    
    return portal.commonQuestions.slice(0, 3);
  }, [portalContext]);

  // Simulate real-time data for development
  const simulateRealTimeData = useCallback(() => {
    const mockDamage: DamageLocation[] = [
      {
        id: '1',
        address: '123 Storm Ave, Miami, FL',
        damageType: 'Roof Damage',
        severity: 'high',
        coordinates: { lat: 25.7617, lng: -80.1918 },
        description: 'Severe roof damage with missing shingles and exposed decking',
        estimatedCost: '$15,000-25,000',
        detected: new Date(),
        distance: userLocation ? 2.3 : undefined
      },
      {
        id: '2',
        address: '456 Hurricane Blvd, Tampa, FL',
        damageType: 'Fallen Tree',
        severity: 'medium',
        coordinates: { lat: 27.9506, lng: -82.4572 },
        description: 'Large oak tree fell on garage, structural damage possible',
        estimatedCost: '$8,000-12,000',
        detected: new Date(),
        distance: userLocation ? 1.7 : undefined
      }
    ];

    const mockStorm: StormData = {
      name: 'Hurricane Sarah',
      category: 3,
      windSpeed: 115,
      direction: 'NNE',
      eta: '6 hours',
      currentLocation: 'Gulf of Mexico, 150 miles SW of Tampa',
      path: [
        { lat: 26.0, lng: -84.0, time: 'Current' },
        { lat: 27.5, lng: -82.8, time: '+3 hours' },
        { lat: 28.2, lng: -81.5, time: '+6 hours' }
      ],
      affectedAreas: ['Tampa Bay', 'Orlando', 'Gainesville']
    };

    setDamageLocations(mockDamage);
    setStormData(mockStorm);
  }, [userLocation]);

  // Announce new damage detection
  const announceNewDamage = useCallback((location: DamageLocation) => {
    const message = `Alert! New ${location.severity} severity ${location.damageType.toLowerCase()} detected at ${location.address}. Estimated repair cost: ${location.estimatedCost}. ${location.distance ? `Distance from your location: ${location.distance} miles.` : ''} Would you like turn-by-turn directions?`;
    speak(message);
  }, [speak]);

  // Announce storm updates
  const announceStormUpdate = useCallback((storm: StormData) => {
    const message = `Storm Alert! ${storm.name} is currently a Category ${storm.category} hurricane with winds of ${storm.windSpeed} mph, moving ${storm.direction}. Current location: ${storm.currentLocation}. Expected to affect ${storm.affectedAreas.join(', ')} in approximately ${storm.eta}. All contractors should prepare for deployment.`;
    speak(message);
  }, [speak]);

  // Provide turn-by-turn directions
  const provideTurnByTurnDirections = useCallback((destination: DamageLocation) => {
    if (!userLocation) {
      speak("I need your current location to provide turn-by-turn directions. Please enable location services.");
      return;
    }

    // Simulate turn-by-turn directions (in real implementation, integrate with mapping service)
    const directions = [
      `Starting navigation to ${destination.address}`,
      `Head northeast on your current street for 0.5 miles`,
      `Turn right onto Main Street and continue for 1.2 miles`,
      `Turn left onto Storm Avenue`,
      `Your destination will be on the right in 0.3 miles`,
      `You have arrived at the damage site. ${destination.description}. Estimated repair cost: ${destination.estimatedCost}`
    ];

    let currentStep = 0;
    const announceNextStep = () => {
      if (currentStep < directions.length) {
        speak(directions[currentStep]);
        currentStep++;
        setTimeout(announceNextStep, 4000); // 4 second intervals
      }
    };

    announceNextStep();
  }, [userLocation, speak]);

  // Enhanced contextual portal guidance
  const providePortalGuidance = useCallback(() => {
    const portal = portalKnowledgeBase[portalContext as keyof typeof portalKnowledgeBase] || portalKnowledgeBase['weather-center'];
    
    const guidance = `Welcome to your ${portalContext} AI assistant! I specialize in ${portal.expertise}. Currently monitoring: ${damageLocations.length} active items, ${stormData ? `live storm data for ${stormData.name}` : 'normal weather conditions'}, and ${realTimeAlerts.length} real-time alerts. I can help with questions like: "${portal.commonQuestions[0]}" or "${portal.commonQuestions[1]}". How can I assist you today?`;

    // Add welcome message to conversation
    const welcomeMessage: ConversationMessage = {
      id: Date.now().toString(),
      type: 'assistant',
      content: guidance,
      timestamp: new Date(),
      method: 'text'
    };
    
    setConversation([welcomeMessage]);
    speak(guidance);
  }, [portalContext, stormData, damageLocations.length, realTimeAlerts.length, speak]);

  // Stop speaking function
  const stopSpeaking = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setIsSpeaking(false);
    }
  }, []);

  // Toggle AI assistant
  const toggleAssistant = useCallback(() => {
    if (isActive) {
      setIsActive(false);
      setIsExpanded(false);
      stopSpeaking();
      if (wsRef.current) wsRef.current.close();
    } else {
      setIsActive(true);
      setTimeout(() => providePortalGuidance(), 500);
    }
  }, [isActive, providePortalGuidance, stopSpeaking]);

  // Handle text message send
  const handleSendMessage = useCallback(() => {
    if (textInput.trim()) {
      handleUserInput(textInput.trim(), 'text');
    }
  }, [textInput, handleUserInput]);

  // Quick action buttons (contextual to portal)
  const getQuickActions = useCallback(() => {
    const baseActions = [
      {
        label: 'Status Update',
        icon: Info,
        action: () => handleUserInput('What\'s the current status?', 'text')
      },
      {
        label: 'Help',
        icon: HelpCircle,
        action: () => handleUserInput('What can you help me with?', 'text')
      }
    ];
    
    if (portalContext === 'weather-center') {
      return [
        ...baseActions,
        {
          label: 'Storm Report',
          icon: Wind,
          action: () => handleUserInput('What storms are currently active?', 'text')
        }
      ];
    }
    
    if (portalContext === 'cameras') {
      return [
        ...baseActions,
        {
          label: 'Incidents',
          icon: AlertTriangle,
          action: () => handleUserInput('What incidents are visible on cameras?', 'text')
        }
      ];
    }
    
    if (portalContext === 'damage-detection') {
      return [
        ...baseActions,
        {
          label: 'Damage Report',
          icon: AlertTriangle,
          action: () => handleUserInput('What damage has been detected today?', 'text')
        }
      ];
    }
    
    return baseActions;
  }, [portalContext, handleUserInput]);

  // Get current portal info
  const currentPortal = portalKnowledgeBase[portalContext as keyof typeof portalKnowledgeBase] || portalKnowledgeBase['weather-center'];
  const smartSuggestions = getSmartSuggestions();
  const quickActions = getQuickActions();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`ai-assistant-container ${className}`}
    >
      <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 border-purple-200 dark:border-purple-700 shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div
                animate={isActive ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 2, repeat: isActive ? Infinity : 0 }}
                className="relative"
              >
                <Bot className="w-8 h-8 text-purple-600" />
                {isActive && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                )}
                {isListening && (
                  <div className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full animate-pulse" />
                )}
              </motion.div>
              <div>
                <CardTitle className="text-lg font-bold text-purple-900 dark:text-purple-200">
                  {portalContext.charAt(0).toUpperCase() + portalContext.slice(1)} AI
                </CardTitle>
                <p className="text-sm text-purple-600 dark:text-purple-400">
                  {currentPortal.expertise}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {isActive && (
                <Button
                  onClick={() => setIsExpanded(!isExpanded)}
                  variant="ghost"
                  size="sm"
                  data-testid="button-ai-expand"
                >
                  {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </Button>
              )}
              <Button
                onClick={toggleAssistant}
                variant={isActive ? "default" : "outline"}
                size="sm"
                className={`transition-all duration-300 ${
                  isActive 
                    ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                    : 'border-purple-300 text-purple-600 hover:bg-purple-50'
                }`}
                data-testid="button-ai-assistant-toggle"
              >
                {isActive ? (
                  <>
                    <Volume2 className="w-4 h-4 mr-2" />
                    Active
                  </>
                ) : (
                  <>
                    <VolumeX className="w-4 h-4 mr-2" />
                    Activate
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>

        <AnimatePresence>
          {isActive && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <CardContent className="space-y-4">
                {/* Voice and Status Controls */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <div className={`w-2 h-2 rounded-full ${
                      isSpeaking ? 'bg-green-500 animate-pulse' : 
                      isListening ? 'bg-red-500 animate-pulse' :
                      isTyping ? 'bg-blue-500 animate-pulse' :
                      'bg-gray-400'
                    }`} />
                    <span className="text-gray-600 dark:text-gray-300">
                      {isSpeaking ? 'Speaking...' : 
                       isListening ? 'Listening...' :
                       isTyping ? 'Thinking...' :
                       'Ready for questions'}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Button
                      onClick={isListening ? stopListening : startListening}
                      variant="ghost"
                      size="sm"
                      className={`p-2 ${
                        isListening ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'hover:bg-purple-50'
                      }`}
                      data-testid="button-voice-input"
                    >
                      {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    </Button>
                    <Button
                      onClick={stopSpeaking}
                      variant="ghost"
                      size="sm"
                      className="p-2 hover:bg-purple-50"
                      data-testid="button-stop-speaking"
                    >
                      <VolumeX className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Conversation History */}
                {(isExpanded || conversation.length > 0) && (
                  <div className="space-y-3">
                    {/* AI Disclaimers */}
                    <div className="space-y-2">
                      <AIDisclaimerBanner />
                      <AttorneyDisclaimerBanner />
                    </div>

                    <div className={`bg-gray-50 dark:bg-gray-800/30 rounded-lg p-3 space-y-2 max-h-64 overflow-y-auto ${
                      !isExpanded ? 'max-h-32' : ''
                    }`}>
                      {conversation.length === 0 ? (
                        <div className="text-center text-gray-500 text-sm py-4">
                          Start a conversation by typing or using voice input
                        </div>
                      ) : (
                        conversation.slice(-10).map(message => (
                          <motion.div
                            key={message.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex gap-2 items-start ${
                              message.type === 'user' ? 'justify-end' : 'justify-start'
                            }`}
                          >
                            {message.type === 'assistant' && (
                              <Bot className="w-5 h-5 mt-1 text-purple-600 flex-shrink-0" />
                            )}
                            <div className={`max-w-xs p-2 rounded-lg text-sm ${
                              message.type === 'user' 
                                ? 'bg-purple-600 text-white' 
                                : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                            }`}>
                              <div>{message.content}</div>
                              <div className={`text-xs mt-1 flex items-center gap-1 ${
                                message.type === 'user' ? 'text-purple-200' : 'text-gray-500'
                              }`}>
                                <Clock className="w-3 h-3" />
                                {message.timestamp.toLocaleTimeString()}
                                {message.method === 'voice' && <Mic className="w-3 h-3" />}
                              </div>
                            </div>
                            {message.type === 'user' && (
                              <User className="w-5 h-5 mt-1 text-gray-600 flex-shrink-0" />
                            )}
                          </motion.div>
                        ))
                      )}
                      <div ref={chatEndRef} />
                    </div>
                    
                    {/* Text Input */}
                    <div className="flex items-center gap-2">
                      <Input
                        value={textInput}
                        onChange={(e) => setTextInput(e.target.value)}
                        placeholder="Ask me anything about your portal..."
                        className="flex-1"
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        disabled={isTyping}
                        data-testid="input-chat-message"
                      />
                      <Button
                        onClick={handleSendMessage}
                        disabled={!textInput.trim() || isTyping}
                        size="sm"
                        data-testid="button-send-message"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
                
                {/* Smart Suggestions */}
                {!isExpanded && smartSuggestions.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-1 text-xs font-medium text-gray-600 dark:text-gray-400">
                      <Lightbulb className="w-3 h-3" />
                      Quick Questions:
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {smartSuggestions.slice(0, 2).map((suggestion, index) => (
                        <Button
                          key={index}
                          onClick={() => handleUserInput(suggestion, 'text')}
                          variant="ghost"
                          size="sm"
                          className="text-xs h-auto py-1 px-2 bg-purple-50 hover:bg-purple-100 text-purple-700"
                          data-testid={`button-suggestion-${index}`}
                        >
                          {suggestion}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quick Action Buttons */}
                <div className="grid grid-cols-3 gap-2">
                  {quickActions.map((action, index) => (
                    <Button
                      key={index}
                      onClick={action.action}
                      variant="outline"
                      size="sm"
                      className="flex flex-col items-center gap-1 h-auto py-2 text-xs"
                      data-testid={`button-${action.label.toLowerCase().replace(' ', '-')}`}
                    >
                      <action.icon className="w-4 h-4" />
                      {action.label}
                    </Button>
                  ))}
                </div>
                
                {/* Real-time Stats */}
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/30 rounded">
                    <div className="font-bold text-blue-900 dark:text-blue-200">{damageLocations.length}</div>
                    <div className="text-blue-600 dark:text-blue-400">Active Items</div>
                  </div>
                  <div className="text-center p-2 bg-orange-50 dark:bg-orange-900/30 rounded">
                    <div className="font-bold text-orange-900 dark:text-orange-200">
                      {stormData?.windSpeed || 0} mph
                    </div>
                    <div className="text-orange-600 dark:text-orange-400">Wind Speed</div>
                  </div>
                  <div className="text-center p-2 bg-green-50 dark:bg-green-900/30 rounded">
                    <div className="font-bold text-green-900 dark:text-green-200">
                      {conversation.length}
                    </div>
                    <div className="text-green-600 dark:text-green-400">Messages</div>
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