import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Volume2, VolumeX, Play, Pause, RotateCcw, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface VoiceExplanation {
  id: string;
  portal: string;
  title: string;
  content: string;
  keyFeatures: string[];
  navigation?: string;
  benefits?: string[];
  duration?: number; // estimated duration in seconds
}

interface VoiceGuideProps {
  currentPortal: string;
  explanations?: Record<string, VoiceExplanation>;
  onPortalChange?: (portal: string) => void;
  className?: string;
}

export const PORTAL_EXPLANATIONS: Record<string, VoiceExplanation> = {
  welcome: {
    id: 'welcome',
    portal: 'welcome',
    title: 'Welcome to Disaster Essentials Marketplace',
    content: `Welcome to the Disaster Essentials Marketplace, your comprehensive resource hub for emergency management and disaster recovery. 
    I'm your voice guide, here to help you navigate through our seven essential service portals. This marketplace provides real-time 
    information on hotels, fuel stations, hardware supplies, shelters, FEMA resources, emergency alerts, and satellite communication 
    equipment. Each portal contains verified, up-to-date information to help you make informed decisions during disaster situations.`,
    keyFeatures: ['Real-time resource tracking', 'Seven essential service categories', 'State-by-state coverage', 'Emergency contact information'],
    navigation: 'Use the tabs at the top to switch between different resource categories, or let me guide you through each portal.',
    benefits: ['One-stop disaster resource platform', 'Professional contractor discounts', 'Emergency response coordination'],
    duration: 45
  },
  hotels: {
    id: 'hotels',
    portal: 'hotels',
    title: 'Hotels & Accommodations Portal',
    content: `The Hotels portal provides real-time availability and pricing for emergency accommodations. Here you'll find hotels, 
    motels, RV parks, and temporary housing options across all disaster-affected areas. Each listing shows current availability, 
    contractor discount rates, contact information, and essential amenities like generator backup and 24-hour security. 
    You can instantly call properties or get directions with one click.`,
    keyFeatures: ['Real-time room availability', 'Contractor discount rates up to 20%', 'Generator backup facilities', 'Pet-friendly options'],
    navigation: 'Browse accommodation cards, use the call button to contact properties directly, or tap directions for GPS navigation.',
    benefits: ['Guaranteed contractor rates', 'Priority booking during emergencies', 'Verified availability status'],
    duration: 35
  },
  gas: {
    id: 'gas',
    portal: 'gas',
    title: 'Fuel & Gas Stations Portal',
    content: `The Fuel portal displays live gas prices and fuel availability across multiple states. You'll see current prices for 
    regular, premium, and diesel fuel, along with real-time stock availability. Each station listing includes operating hours, 
    contact information, and special notes about fuel availability during emergency situations. Red indicators show when 
    stations are experiencing supply shortages.`,
    keyFeatures: ['Live fuel pricing updates', 'Real-time availability status', 'Operating hours and contacts', 'Emergency supply tracking'],
    navigation: 'Compare prices by scanning the station cards, call ahead to verify availability, or get turn-by-turn directions.',
    benefits: ['Avoid empty stations', 'Find lowest prices in your area', 'Plan fuel stops efficiently'],
    duration: 30
  },
  hardware: {
    id: 'hardware',
    portal: 'hardware',
    title: 'Hardware & Supplies Portal',
    content: `The Hardware portal connects you with essential supplies for storm preparation and recovery. Find chainsaw parts, 
    generators, tarps, safety equipment, and emergency supplies at major retailers and local stores. Each listing shows 
    current inventory status, pricing, and store hours. Green badges indicate items are in stock, while red badges 
    show out-of-stock items to save you time.`,
    keyFeatures: ['Emergency supply inventory', 'Generator and tool availability', 'Storm preparation materials', 'Safety equipment tracking'],
    navigation: 'Review inventory status by item type, call stores to reserve equipment, or visit for immediate pickup.',
    benefits: ['Avoid sold-out locations', 'Compare pricing across stores', 'Reserve critical equipment'],
    duration: 35
  },
  shelters: {
    id: 'shelters',
    portal: 'shelters',
    title: 'Emergency Shelters & Relief Portal',
    content: `The Shelters portal provides comprehensive information about emergency shelters, food distribution centers, and 
    relief services. You'll find Red Cross shelters, FEMA relief centers, food banks, and medical assistance locations. 
    Each facility shows current capacity, occupancy levels, available services, and intake requirements. This portal 
    helps connect disaster victims with immediate assistance and essential services.`,
    keyFeatures: ['Shelter capacity and availability', 'Food and medical services', 'Pet accommodation options', 'Transportation assistance'],
    navigation: 'Check shelter availability, review services offered, and contact facilities directly for intake information.',
    benefits: ['Find available shelter space', 'Access multiple relief services', 'Connect with emergency assistance'],
    duration: 40
  },
  fema: {
    id: 'fema',
    portal: 'fema',
    title: 'FEMA Resources Portal',
    content: `The FEMA portal serves as your gateway to federal disaster assistance and recovery programs. Access information 
    about disaster declarations, individual assistance programs, public assistance for communities, and recovery resources. 
    This portal helps navigate FEMA's complex system with direct links to applications, status tracking, and local 
    FEMA office contacts. Essential for accessing federal disaster relief funding.`,
    keyFeatures: ['Disaster assistance applications', 'Recovery program information', 'Local FEMA office contacts', 'Application status tracking'],
    navigation: 'Access FEMA applications, check disaster declarations for your area, or contact local FEMA representatives.',
    benefits: ['Federal financial assistance', 'Recovery program access', 'Community rebuilding resources'],
    duration: 35
  },
  alerts: {
    id: 'alerts',
    portal: 'alerts',
    title: 'Emergency Alerts & Warnings Portal',
    content: `The Alerts portal delivers critical safety information and emergency warnings. Monitor price gouging reports, 
    curfew notifications, road closures, and safety advisories from official sources. Each alert includes severity levels, 
    affected areas, and recommended actions. Color-coded badges help you quickly identify critical versus informational 
    alerts. This portal keeps you informed of rapidly changing emergency conditions.`,
    keyFeatures: ['Real-time emergency alerts', 'Price gouging reports', 'Curfew and safety notifications', 'Road closure updates'],
    navigation: 'Review alert severity levels, check geographic impact areas, and follow recommended safety actions.',
    benefits: ['Stay informed of dangers', 'Avoid price gouging', 'Follow emergency protocols'],
    duration: 30
  },
  satellite: {
    id: 'satellite',
    portal: 'satellite',
    title: 'Satellite Communication Portal',
    content: `The Satellite portal connects you with emergency communication equipment and services. Find satellite phones, 
    internet devices, GPS tracking equipment, and emergency communication systems from verified vendors. Each product 
    listing includes technical specifications, pricing, availability, and vendor contact information. Essential for 
    maintaining communications when terrestrial networks fail during disasters.`,
    keyFeatures: ['Satellite phone equipment', 'Emergency internet access', 'GPS tracking devices', 'Weatherproof communication gear'],
    navigation: 'Compare equipment specifications, check vendor availability, or contact suppliers directly for emergency orders.',
    benefits: ['Backup communication systems', 'Global coverage capability', 'Disaster-proof connectivity'],
    duration: 35
  },
  goes17: {
    id: 'goes17',
    portal: 'goes17',
    title: 'GOES-17 Satellite Weather Intelligence Portal',
    content: `The GOES-17 portal provides real-time satellite weather intelligence from NOAA's GOES-17 satellite positioned over the Western United States. 
    Access live infrared imagery, lightning detection data, atmospheric temperature profiles, and storm tracking information. This portal delivers 
    professional-grade meteorological data every 15 minutes, including GLM lightning mapper data, ABI atmospheric imaging, and SUVI solar monitoring. 
    Essential for contractors tracking storm systems and weather patterns across the western regions.`,
    keyFeatures: ['Real-time GOES-17 satellite imagery', 'GLM lightning detection data', 'Atmospheric temperature profiles', '15-minute update intervals'],
    navigation: 'View live satellite loops, analyze lightning strike patterns, monitor temperature gradients, and track storm development in real-time.',
    benefits: ['Professional weather intelligence', 'Western US regional coverage', 'Lightning strike prediction', 'Advanced storm tracking'],
    duration: 45
  },
  xray: {
    id: 'xray',
    portal: 'xray',
    title: 'X-RAY REALITY Augmented Reality Portal',
    content: `X-RAY REALITY provides augmented reality storm operations with live storm views, continuously refreshing radar and GOES satellite data on a 3D stage. 
    Access traffic and DOT cameras in 3×3 grids by state, storm-chaser feeds, your drone feeds, and ocean views for coastal operations. Use AR tools to 
    drop hazard markers for energized lines and split trunks, draw cut lines and safe zones, and measure diameters and distances visually in augmented reality. 
    Features lead triage overlay that auto-labels critical jobs, routing helper for smart sequences, and time scrub replays of the last 6 to 24 hours.`,
    keyFeatures: ['Live 3D storm view', 'AR measurement and marking tools', 'Traffic camera grids', 'Storm chaser feeds', 'Drone feed integration', 'Time scrub replays'],
    navigation: 'Use AR tools to mark hazards, draw cut lines, measure distances, view live feeds, and scrub through storm history for evidence capture.',
    benefits: ['Augmented reality storm ops', 'Real-time situational awareness', 'Evidence capture and reporting', 'Smart routing and triage'],
    duration: 50
  }
};

export default function VoiceGuide({ 
  currentPortal, 
  explanations = PORTAL_EXPLANATIONS, 
  onPortalChange,
  className = ""
}: VoiceGuideProps) {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentText, setCurrentText] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isGeneratingRef = useRef(false);

  useEffect(() => {
    return () => {
      stopSpeaking();
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const stopSpeaking = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    setIsPlaying(false);
    setProgress(0);
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
  }, []);

  const speakText = useCallback(async (text: string, onComplete?: () => void) => {
    try {
      // Prevent multiple simultaneous voice generation calls
      if (isGeneratingRef.current) {
        console.log('Voice generation already in progress, skipping duplicate call');
        return;
      }
      
      isGeneratingRef.current = true;
      stopSpeaking();
      
      setCurrentText(text);
      setProgress(0);
      
      // Call server API to generate ARIA STORM voice
      const response = await fetch('/api/voice-ai/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        isGeneratingRef.current = false;
        throw new Error('Voice generation failed');
      }

      const data = await response.json();
      
      if (data.audioBase64) {
        setIsPlaying(true);
        
        // Create audio element and play
        const audio = new Audio(`data:audio/mpeg;base64,${data.audioBase64}`);
        audioRef.current = audio;
        
        // Estimate duration and update progress
        const estimatedDuration = text.length * 50;
        const intervalTime = estimatedDuration / 100;
        progressIntervalRef.current = setInterval(() => {
          setProgress(prev => {
            if (prev >= 100) {
              if (progressIntervalRef.current) {
                clearInterval(progressIntervalRef.current);
              }
              return 100;
            }
            return prev + 1;
          });
        }, intervalTime);
        
        audio.onended = () => {
          setIsPlaying(false);
          setProgress(100);
          isGeneratingRef.current = false;
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
          }
          onComplete?.();
        };
        
        audio.onerror = () => {
          setIsPlaying(false);
          setProgress(0);
          isGeneratingRef.current = false;
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
          }
          console.error('Audio playback error');
          onComplete?.();
        };
        
        await audio.play();
      } else {
        isGeneratingRef.current = false;
        setIsPlaying(false);
        onComplete?.();
      }
    } catch (error) {
      console.error('ARIA voice error:', error);
      isGeneratingRef.current = false;
      setIsPlaying(false);
      setProgress(0);
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      onComplete?.();
    }
  }, [stopSpeaking]);

  const explainPortal = useCallback((portalId: string) => {
    const explanation = explanations[portalId];
    if (!explanation) return;

    const fullText = `${explanation.content} 

Key features include: ${explanation.keyFeatures.join(', ')}.

${explanation.navigation || ''}

${explanation.benefits ? `Benefits include: ${explanation.benefits.join(', ')}.` : ''}`;

    speakText(fullText);
  }, [explanations, speakText]);

  const startGuidedTour = useCallback(async () => {
    const portalOrder = ['welcome', 'hotels', 'gas', 'hardware', 'shelters', 'fema', 'alerts', 'satellite', 'goes17', 'xray'];
    
    for (let currentIndex = 0; currentIndex < portalOrder.length; currentIndex++) {
      const portalId = portalOrder[currentIndex];
      const explanation = explanations[portalId];
      
      if (explanation) {
        if (portalId !== 'welcome' && onPortalChange) {
          onPortalChange(portalId);
        }
        
        // Wait for ARIA to complete speaking before moving to next portal
        await new Promise<void>((resolve) => {
          speakText(explanation.content, () => {
            setTimeout(resolve, 1500);
          });
        });
      }
    }

    // Tour complete message
    await new Promise<void>((resolve) => {
      speakText(
        "This completes your guided tour of the Disaster Essentials Marketplace. You can now explore any portal in detail or start the tour again. I'm here to help whenever you need guidance.",
        () => {
          setIsEnabled(false);
          resolve();
        }
      );
    });
  }, [explanations, onPortalChange, speakText]);

  const toggleVoiceGuide = useCallback(() => {
    if (isEnabled) {
      stopSpeaking();
      setIsEnabled(false);
    } else {
      setIsEnabled(true);
      explainPortal(currentPortal || 'welcome');
    }
  }, [isEnabled, currentPortal, explainPortal, stopSpeaking]);


  return (
    <motion.div 
      className={`voice-guide-container ${className}`}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
    >
      {/* Voice Control Button */}
      <div className="flex items-center gap-3">
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button
            onClick={toggleVoiceGuide}
            variant={isEnabled ? "default" : "outline"}
            size="lg"
            className={`
              relative voice-guide-toggle transition-all duration-300
              ${isEnabled 
                ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg' 
                : 'bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-800 backdrop-blur-sm'
              }
            `}
            data-testid="button-voice-guide-toggle"
          >
            <motion.div
              animate={isPlaying ? { scale: [1, 1.2, 1] } : {}}
              transition={{ duration: 1, repeat: isPlaying ? Infinity : 0 }}
            >
              {isPlaying ? <Volume2 className="w-5 h-5 mr-2" /> : <VolumeX className="w-5 h-5 mr-2" />}
            </motion.div>
            <span className="font-medium">
              {isEnabled ? (isPlaying ? 'Speaking...' : 'Voice Guide Active') : 'Start Voice Guide'}
            </span>
            {isEnabled && (
              <motion.div
                className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
            )}
          </Button>
        </motion.div>

        {/* Tour Button */}
        {isEnabled && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Button
              onClick={startGuidedTour}
              variant="outline"
              size="sm"
              disabled={isPlaying}
              className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm"
              data-testid="button-guided-tour"
            >
              <Play className="w-4 h-4 mr-1" />
              Full Tour
            </Button>
          </motion.div>
        )}

        {/* Control Buttons */}
        {isEnabled && (
          <motion.div 
            className="flex items-center gap-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Button
              onClick={isPlaying ? stopSpeaking : () => explainPortal(currentPortal || 'welcome')}
              variant="outline"
              size="sm"
              className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm"
              data-testid="button-play-pause"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
            
            <Button
              onClick={stopSpeaking}
              variant="outline"
              size="sm"
              disabled={!isPlaying}
              className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm"
              data-testid="button-stop"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>

            <Button
              onClick={() => setShowSettings(!showSettings)}
              variant="outline"
              size="sm"
              className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm"
              data-testid="button-voice-settings"
            >
              <Settings className="w-4 h-4" />
            </Button>
          </motion.div>
        )}
      </div>

      {/* Progress Indicator */}
      <AnimatePresence>
        {isEnabled && isPlaying && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3"
          >
            <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-white/20" data-testid="card-voice-progress">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Voice Guide Active
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {currentPortal?.toUpperCase() || 'WELCOME'}
                    </Badge>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {Math.round(progress)}%
                  </span>
                </div>
                
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <motion.div
                    className="bg-purple-600 h-2 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                
                {currentText && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">
                    {currentText.slice(0, 120)}...
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 z-50"
          >
            <Card className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border border-white/20 shadow-xl" data-testid="card-voice-settings">
              <CardContent className="p-4">
                <h4 className="text-sm font-semibold mb-3 text-gray-800 dark:text-gray-200">
                  Voice Settings
                </h4>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">
                      Voice: ARIA STORM AI
                    </label>
                    <Badge variant="outline" className="text-xs bg-purple-100 dark:bg-purple-900">
                      ElevenLabs Broadcast Pro
                    </Badge>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Premium broadcast-quality voice synthesis<br />
                    Pitch: Professional tone<br />
                    Language: English (US)
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}