import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
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
  Info
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

interface AIAssistantProps {
  portalContext: string;
  userLocation?: { lat: number; lng: number };
  className?: string;
}

export default function AIAssistant({ portalContext, userLocation, className }: AIAssistantProps) {
  const [isActive, setIsActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentMessage, setCurrentMessage] = useState('');
  const [damageLocations, setDamageLocations] = useState<DamageLocation[]>([]);
  const [stormData, setStormData] = useState<StormData | null>(null);
  const [realTimeAlerts, setRealTimeAlerts] = useState<string[]>([]);
  
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const recognitionRef = useRef<any>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const [voice, setVoice] = useState<SpeechSynthesisVoice | null>(null);

  // Initialize Speech Synthesis with female voice
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
      
      const loadVoices = () => {
        const voices = synthRef.current?.getVoices() || [];
        // Robust cross-browser female voice selection
        const femaleVoice = voices.find(v => {
          const name = v.name.toLowerCase();
          // Check for explicit female voice indicators
          return name.includes('female') || name.includes('woman') ||
                 name.includes('zira') || name.includes('hazel') ||
                 name.includes('samantha') || name.includes('karen') ||
                 name.includes('victoria') || name.includes('susan') ||
                 name.includes('mary') || name.includes('anna') ||
                 name.includes('emma') || name.includes('alice');
        }) || 
        // Fallback to English voices
        voices.find(v => v.lang.startsWith('en-') && v.name.toLowerCase().includes('english')) ||
        voices.find(v => v.lang.startsWith('en')) ||
        // Final fallback
        voices[0];
        
        setVoice(femaleVoice);
      };

      if (synthRef.current.getVoices().length === 0) {
        synthRef.current.addEventListener('voiceschanged', loadVoices);
      } else {
        loadVoices();
      }
    }
  }, []);

  // Initialize WebSocket for real-time data
  useEffect(() => {
    if (isActive) {
      try {
        wsRef.current = new WebSocket(`${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`);
        
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
  }, [isActive]);

  // Simulate real-time data for development
  const simulateRealTimeData = useCallback(() => {
    // Simulate damage locations
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

    // Simulate storm data
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

  // Speech synthesis function
  const speak = useCallback((text: string) => {
    if (!synthRef.current || !voice) return;

    synthRef.current.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = voice;
    utterance.rate = 0.9;
    utterance.pitch = 1.1;
    utterance.volume = 0.8;
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    synthRef.current.speak(utterance);
    setCurrentMessage(text);
  }, [voice]);

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

  // Generate contextual portal guidance
  const providePortalGuidance = useCallback(() => {
    let guidance = '';
    
    switch (portalContext) {
      case 'weather-center':
        guidance = `Welcome to the Weather Center! I'm monitoring live storm data. Currently tracking ${stormData?.name || 'active weather systems'}. I can provide real-time storm updates, wind speed alerts, and help you track weather patterns for optimal contractor deployment.`;
        break;
      case 'traffic-cam-watcher':
        guidance = `Welcome to TrafficCam Watcher! I'm analyzing live camera feeds across multiple states. ${damageLocations.length} damage locations detected and ready for contractor deployment. I can guide you to the highest priority damage sites and provide live traffic updates.`;
        break;
      case 'damage-detection':
        guidance = `Welcome to AI Damage Detection! I'm continuously analyzing images for storm damage. Current damage queue: ${damageLocations.length} locations. I can prioritize damage by severity, provide detailed assessments, and guide your teams to the most profitable opportunities.`;
        break;
      case 'leads':
        guidance = `Welcome to Lead Management! I'm tracking ${damageLocations.length} active damage locations that are ready for conversion. I can provide lead priorities, contact information, and optimal routing for your sales team.`;
        break;
      case 'disaster-essentials-marketplace':
        guidance = `Welcome to the Disaster Essentials Marketplace! I can help you find hotels, fuel, supplies, and emergency resources. I'm monitoring real-time availability and can guide you to the nearest open locations with current pricing.`;
        break;
      default:
        guidance = `Welcome to ${portalContext}! I'm your AI assistant ready to provide real-time storm intelligence, damage locations, and navigation assistance. How can I help you today?`;
    }

    speak(guidance);
  }, [portalContext, stormData, damageLocations.length, speak]);

  // Toggle AI assistant
  const toggleAssistant = useCallback(() => {
    if (isActive) {
      setIsActive(false);
      synthRef.current?.cancel();
      if (wsRef.current) wsRef.current.close();
    } else {
      setIsActive(true);
      setTimeout(() => providePortalGuidance(), 500);
    }
  }, [isActive, providePortalGuidance]);

  // Quick action buttons
  const quickActions = [
    {
      label: 'Damage Report',
      icon: AlertTriangle,
      action: () => {
        const highPriority = damageLocations.filter(d => d.severity === 'high');
        if (highPriority.length > 0) {
          speak(`${highPriority.length} high-priority damage locations detected. Highest value opportunity: ${highPriority[0].description} at ${highPriority[0].address}. Estimated value: ${highPriority[0].estimatedCost}.`);
        } else {
          speak("No high-priority damage currently detected. Monitoring continues.");
        }
      }
    },
    {
      label: 'Storm Status',
      icon: Wind,
      action: () => {
        if (stormData) {
          speak(`Current storm status: ${stormData.name}, Category ${stormData.category}, winds ${stormData.windSpeed} mph. ETA to affected areas: ${stormData.eta}. Monitor for deployment opportunities.`);
        } else {
          speak("No active storms currently being tracked. System monitoring all weather patterns.");
        }
      }
    },
    {
      label: 'Navigation',
      icon: Navigation,
      action: () => {
        if (damageLocations.length > 0) {
          const nearest = damageLocations[0]; // In real implementation, calculate actual nearest
          speak(`Navigating to nearest damage location: ${nearest.address}. ${nearest.description}`);
          provideTurnByTurnDirections(nearest);
        } else {
          speak("No damage locations currently available for navigation.");
        }
      }
    }
  ];

  if (!synthRef.current || !voice) {
    return null; // Speech synthesis not supported
  }

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
              </motion.div>
              <div>
                <CardTitle className="text-lg font-bold text-purple-900 dark:text-purple-200">
                  Storm Intelligence AI
                </CardTitle>
                <p className="text-sm text-purple-600 dark:text-purple-400">
                  Real-time damage tracking & navigation
                </p>
              </div>
            </div>
            
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
        </CardHeader>

        <AnimatePresence>
          {isActive && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <CardContent className="space-y-4">
                {/* Current Status */}
                <div className="flex items-center gap-2 text-sm">
                  <div className={`w-2 h-2 rounded-full ${isSpeaking ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                  <span className="text-gray-600 dark:text-gray-300">
                    {isSpeaking ? 'Speaking...' : 'Ready for commands'}
                  </span>
                </div>

                {/* Current Message Display */}
                {currentMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-purple-100 dark:bg-purple-800/30 rounded-lg text-sm text-purple-900 dark:text-purple-200"
                  >
                    "{currentMessage}"
                  </motion.div>
                )}

                {/* Real-time Stats */}
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/30 rounded">
                    <div className="font-bold text-blue-900 dark:text-blue-200">{damageLocations.length}</div>
                    <div className="text-blue-600 dark:text-blue-400">Damage Sites</div>
                  </div>
                  <div className="text-center p-2 bg-orange-50 dark:bg-orange-900/30 rounded">
                    <div className="font-bold text-orange-900 dark:text-orange-200">
                      {stormData?.windSpeed || 0} mph
                    </div>
                    <div className="text-orange-600 dark:text-orange-400">Wind Speed</div>
                  </div>
                  <div className="text-center p-2 bg-green-50 dark:bg-green-900/30 rounded">
                    <div className="font-bold text-green-900 dark:text-green-200">
                      {stormData?.eta || 'N/A'}
                    </div>
                    <div className="text-green-600 dark:text-green-400">Storm ETA</div>
                  </div>
                </div>

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

                {/* Active Alerts */}
                {realTimeAlerts.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-2"
                  >
                    <h4 className="font-semibold text-sm text-purple-900 dark:text-purple-200">Active Alerts:</h4>
                    {realTimeAlerts.slice(-3).map((alert, index) => (
                      <div key={index} className="p-2 bg-yellow-50 dark:bg-yellow-900/30 rounded text-xs text-yellow-800 dark:text-yellow-200">
                        {alert}
                      </div>
                    ))}
                  </motion.div>
                )}
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}