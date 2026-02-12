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
  modules: {
    id: 'modules',
    portal: 'modules',
    title: 'Welcome to Disaster Direct StormOps Modules',
    content: `Welcome to Strategic Services Savers. I'm Rachel, your professional voice guide. You have access to seventeen powerful modules organized into five categories. Operations modules include Weather Center for live radar, TrafficCamWatcher for camera monitoring, Eyes in the Sky for route planning, Drone Operations for fleet management, Disaster Essentials Marketplace for emergency supplies, and Disaster Lens for damage documentation. Intelligence modules provide Storm Predictions with AI forecasting, AI Damage Detection for image analysis, and X-RAY REALITY for augmented reality operations. Sales tools include Lead Management for tracking opportunities. Customer modules offer Victim Portal for damage reporting, StormShare community platform, and Customer Hub for relationship management. Management modules include Claims Central for insurance processing, Contractor Command for crew dispatch, Contractor Portal for sign-ups, and Legal Command for compliance tracking. Click Launch on any module to access detailed features and navigation guidance.`,
    keyFeatures: ['17 integrated modules', '5 operational categories', 'Real-time intelligence', 'AI-powered tools', 'Professional operations', 'Complete storm response platform'],
    navigation: 'Click Launch on any module card to access it. Use search to find modules or filter by category: Operations, Intelligence, Sales, Customers, or Management.',
    benefits: ['Comprehensive storm operations', 'Enterprise-grade tools', 'End-to-end workflow coverage'],
    duration: 60
  },
  weather: {
    id: 'weather',
    portal: 'weather',
    title: 'Weather Center Module',
    content: `The Weather Center provides comprehensive real-time weather intelligence for storm operations. Access live radar tracking with storm prediction overlays, receive automated severe weather alerts from the National Weather Service, and use professional ops tools for deployment planning and crew coordination. The system monitors severe weather alerts every 2 minutes, providing instant notifications when conditions threaten your service areas. Plan crew deployments based on radar forecasts, track storm systems in real-time, and coordinate response efforts with live weather data.`,
    keyFeatures: ['Live radar with prediction overlays', 'NWS severe weather alerts', 'Automated notifications', 'Deployment planning tools', 'Crew coordination features'],
    navigation: 'Use the radar view to track storms, check alerts for your service areas, and plan crew deployments using the ops tools.',
    benefits: ['Real-time storm tracking', 'Automated alert notifications', 'Strategic deployment planning', 'Crew safety coordination'],
    duration: 45
  },
  predictions: {
    id: 'predictions',
    portal: 'predictions',
    title: 'Storm Predictions Module',
    content: `Storm Predictions uses advanced AI and machine learning to forecast storm damage with 89% accuracy. The system analyzes weather patterns, historical data, and real-time conditions to generate county-level damage forecasts and contractor opportunity scores. Receive predictive damage analysis up to 72 hours in advance, allowing strategic crew positioning before storms hit. The AI models identify high-value opportunities, calculate impact scores from zero to one hundred, and provide detailed forecasts for roof damage, tree damage, and flooding potential across your service areas.`,
    keyFeatures: ['AI-powered damage prediction', '89% accuracy rate', 'County-level forecasts', 'Opportunity scoring', '72-hour advance predictions'],
    navigation: 'Review damage forecasts by county, check opportunity scores for deployment decisions, and analyze predicted damage types.',
    benefits: ['Strategic crew positioning', 'Maximize revenue opportunities', 'Reduce response time', 'Data-driven deployment'],
    duration: 50
  },
  'traffic-cam': {
    id: 'traffic-cam',
    portal: 'traffic-cam',
    title: 'TrafficCamWatcher Module',
    content: `TrafficCamWatcher monitors live traffic cameras across the Florida DOT network and uses AI vision models to detect damage in real-time. The system automatically identifies tree downs, flooding, power line hazards, and road obstructions from thousands of camera feeds. When damage is detected, the system geo-matches contractors based on location and specialty, sending instant notifications about new opportunities. Access live camera grids by state, review AI confidence scores for detected damage, and claim opportunities before competitors.`,
    keyFeatures: ['Live DOT camera monitoring', 'AI damage detection', 'Automated geo-matching', 'Real-time notifications', 'Multi-state coverage'],
    navigation: 'Browse live camera feeds by location, review AI-detected damage with confidence scores, and claim opportunities directly.',
    benefits: ['First response advantage', 'Automated opportunity detection', 'Geographic targeting', 'Real-time intelligence'],
    duration: 48
  },
  'drone-ops': {
    id: 'drone-ops',
    portal: 'drone-ops',
    title: 'Drone Operations Module',
    content: `Drone Operations provides comprehensive fleet management, flight logging, and damage assessment workflows. Track your entire drone fleet including battery levels, maintenance schedules, and deployment status. Access detailed flight logs with GPS tracking and telemetry data for documentation and insurance purposes. Execute damage assessment workflows with automated photo capture, geo-tagging, and report generation. The system maintains FAA compliance logs, coordinates multi-drone missions, and integrates assessment data directly into claim management systems.`,
    keyFeatures: ['Fleet management dashboard', 'GPS flight logging', 'Automated photo capture', 'Maintenance tracking', 'FAA compliance logs'],
    navigation: 'Monitor fleet status on the dashboard, review flight logs for documentation, and execute assessment workflows for claims.',
    benefits: ['Professional documentation', 'FAA compliance', 'Efficient assessments', 'Insurance claim support'],
    duration: 47
  },
  'ai-damage': {
    id: 'ai-damage',
    portal: 'ai-damage',
    title: 'AI Damage Detection Module',
    content: `AI Damage Detection uses computer vision models to analyze camera feeds and photos in real-time. The system automatically classifies roof damage, tree damage, flooding, and structural issues with confidence scores and severity ratings. Process thousands of images per hour, receive instant damage classifications, and generate detailed reports for insurance claims. The AI models are trained on millions of storm damage images, achieving professional-grade accuracy for shingle damage, tarp requirements, tree hazards, and water intrusion. Integration with claims systems allows one-click report generation.`,
    keyFeatures: ['Real-time image analysis', 'Automated classification', 'Confidence scoring', 'Severity ratings', 'Claims integration'],
    navigation: 'Upload images or connect camera feeds, review AI classifications with confidence scores, and generate reports.',
    benefits: ['Rapid damage assessment', 'Professional accuracy', 'Automated documentation', 'Insurance claim support'],
    duration: 49
  },
  xray: {
    id: 'xray',
    portal: 'xray',
    title: 'X-RAY REALITY Module',
    content: `X-RAY REALITY provides augmented reality storm operations with live 3D visualization. Access continuously refreshing radar and satellite data on a three-dimensional stage, view traffic and DOT cameras in three-by-three grids organized by state, and integrate your drone feeds for comprehensive situational awareness. Use AR measurement tools to mark hazards like energized power lines and split tree trunks, draw cut lines and safe zones directly on the AR view, and measure diameters and distances visually. The time scrub feature lets you replay the last 6 to 24 hours of storm data for evidence capture and documentation. Lead triage overlays automatically label critical jobs, while the routing helper suggests smart crew sequences.`,
    keyFeatures: ['3D storm visualization', 'AR measurement tools', 'Camera grid integration', 'Time scrub replay', 'Automated triage', 'Smart routing'],
    navigation: 'Use AR tools to mark hazards and measure distances, scrub through storm history for evidence, and review triage priorities.',
    benefits: ['Enhanced situational awareness', 'Professional documentation', 'Evidence capture', 'Efficient routing'],
    duration: 55
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
  watchlist: {
    id: 'watchlist',
    portal: 'watchlist',
    title: 'Location Watchlist Portal',
    content: `The Location Watchlist portal helps you monitor multiple sites for disaster impact and receive automated alerts when conditions threaten your properties or service areas. 
    Save key locations like office headquarters, equipment yards, customer properties, or potential job sites. Each location is continuously monitored and receives a real-time 
    impact score from zero to one hundred based on active weather threats, storm predictions, environmental conditions, and disaster events. When a location's impact score 
    exceeds your custom threshold, automated webhook notifications are sent to your Slack channel or other alert systems. This ensures you're immediately aware when storms, 
    severe weather, or disasters threaten your monitored sites, allowing rapid response and crew deployment decisions.`,
    keyFeatures: ['Multi-site monitoring', 'Real-time impact scoring', 'Custom alert thresholds', 'Webhook notifications', 'Slack integration', 'Manual impact refresh'],
    navigation: 'Add locations by clicking Add Location button, configure alert thresholds per site, toggle alerts on or off, refresh impact scores manually, or let automated monitoring handle continuous updates.',
    benefits: ['Proactive threat awareness', 'Automated alert notifications', 'Prioritize response by impact score', 'Monitor unlimited locations', 'Customizable per-site thresholds'],
    duration: 45
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
    isGeneratingRef.current = false;
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
  }, []);

  const speakText = useCallback(async (text: string, onComplete?: () => void) => {
    try {
      if (isGeneratingRef.current) {
        console.log('Voice already in progress, skipping duplicate call');
        return;
      }
      
      isGeneratingRef.current = true;
      stopSpeaking();
      
      setCurrentText(text);
      setProgress(0);
      setIsPlaying(true);
      
      const wordsPerMinute = 150;
      const wordCount = text.split(/\s+/).length;
      const estimatedDuration = (wordCount / wordsPerMinute) * 60 * 1000;
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
        if (audioRef.current) {
          audioRef.current.pause();
        }
        audioRef.current = new Audio(data.audioUrl);
        
        audioRef.current.onended = () => {
          setIsPlaying(false);
          setProgress(100);
          isGeneratingRef.current = false;
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
          }
          onComplete?.();
        };
        
        audioRef.current.onerror = () => {
          setIsPlaying(false);
          setProgress(0);
          isGeneratingRef.current = false;
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
          }
          console.error('Audio playback error');
          onComplete?.();
        };
        
        await audioRef.current.play();
      } else {
        setIsPlaying(false);
        setProgress(100);
        isGeneratingRef.current = false;
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
        }
        onComplete?.();
      }
    } catch (error) {
      console.error('Voice error:', error);
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
    const portalOrder = ['welcome', 'hotels', 'gas', 'hardware', 'shelters', 'fema', 'alerts', 'satellite', 'goes17', 'xray', 'watchlist'];
    
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
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-lg' 
                : 'bg-slate-900/60 border-cyan-500/30 hover:bg-slate-800/60 text-cyan-300 backdrop-blur-sm'
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
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-400 rounded-full border-2 border-white" 
                style={{ boxShadow: '0 0 10px rgba(0, 217, 255, 0.8)' }}
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
              className="bg-slate-900/60 border-cyan-500/30 text-cyan-300 hover:bg-slate-800/60 backdrop-blur-sm"
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
              className="bg-slate-900/60 border-cyan-500/30 text-cyan-300 hover:bg-slate-800/60 backdrop-blur-sm"
              data-testid="button-play-pause"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
            
            <Button
              onClick={stopSpeaking}
              variant="outline"
              size="sm"
              disabled={!isPlaying}
              className="bg-slate-900/60 border-cyan-500/30 text-cyan-300 hover:bg-slate-800/60 backdrop-blur-sm disabled:opacity-50"
              data-testid="button-stop"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>

            <Button
              onClick={() => setShowSettings(!showSettings)}
              variant="outline"
              size="sm"
              className="bg-slate-900/60 border-cyan-500/30 text-cyan-300 hover:bg-slate-800/60 backdrop-blur-sm"
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
            <Card className="bg-slate-900/90 backdrop-blur-sm border border-cyan-500/30" data-testid="card-voice-progress">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full" 
                      style={{ 
                        animation: 'spin 2s linear infinite',
                        boxShadow: '0 0 10px rgba(0, 217, 255, 0.5)'
                      }}
                    />
                    <span className="text-sm font-medium text-cyan-300">
                      Voice Guide Active
                    </span>
                    <Badge variant="secondary" className="text-xs bg-cyan-500/20 text-cyan-300 border-cyan-500/30">
                      {currentPortal?.toUpperCase() || 'WELCOME'}
                    </Badge>
                  </div>
                  <span className="text-xs text-cyan-400">
                    {Math.round(progress)}%
                  </span>
                </div>
                
                <div className="w-full bg-slate-800 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-cyan-500 to-blue-600 h-2 rounded-full transition-all"
                    style={{ 
                      width: `${progress}%`,
                      boxShadow: '0 0 10px rgba(0, 217, 255, 0.6)'
                    }}
                  />
                </div>
                
                {currentText && (
                  <p className="text-xs text-cyan-300/70 mt-2 line-clamp-2">
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
            <Card className="bg-slate-900/95 backdrop-blur-sm border border-cyan-500/30 shadow-xl" data-testid="card-voice-settings">
              <CardContent className="p-4">
                <h4 className="text-sm font-semibold mb-3 text-cyan-300">
                  Voice Settings
                </h4>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-cyan-400 mb-1 block">
                      Voice: Rachel - Professional Female
                    </label>
                    <Badge variant="outline" className="text-xs bg-cyan-500/20 text-cyan-300 border-cyan-500/30">
                      ElevenLabs Broadcast Pro
                    </Badge>
                  </div>
                  <div className="text-xs text-cyan-300/70">
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