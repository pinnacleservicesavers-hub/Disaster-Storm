import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Volume2, VolumeX, Play, Pause, SkipForward, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface PortalSection {
  id: string;
  title: string;
  description: string;
  element?: string; // CSS selector to highlight
  keyFeatures: string[];
  helpfulTips?: string[];
  duration?: number;
}

interface PortalVoiceGuideProps {
  portalName: string;
  sections: PortalSection[];
  currentSection?: string;
  onSectionChange?: (sectionId: string) => void;
  className?: string;
}

// Portal-specific guidance content
export const PORTAL_SECTIONS: Record<string, PortalSection[]> = {
  'weather-center': [
    {
      id: 'overview',
      title: 'Weather Center Overview',
      description: 'Welcome to the Weather Center! This is your command headquarters for storm monitoring. Here you can track live weather data, view radar feeds, and receive alerts from NOAA and multiple weather services.',
      keyFeatures: ['Live radar data', 'Storm tracking', 'Weather alerts', 'Multi-state coverage'],
      helpfulTips: ['Check radar updates every 15 minutes', 'Set up custom alert zones', 'Monitor wind patterns for damage prediction'],
      duration: 30
    },
    {
      id: 'radar-display',
      title: 'Live Radar Display',
      element: '.radar-container',
      description: 'The radar display shows real-time precipitation and storm movement. You can zoom in on specific areas, track storm paths, and see precipitation intensity with color-coded overlays.',
      keyFeatures: ['Real-time updates', 'Zoom controls', 'Storm path tracking', 'Precipitation intensity'],
      helpfulTips: ['Red areas indicate heavy precipitation', 'Purple shows severe weather', 'Use zoom to focus on your service areas'],
      duration: 25
    },
    {
      id: 'alerts-panel',
      title: 'Weather Alerts Panel',
      element: '.alerts-container',
      description: 'The alerts panel displays active weather warnings, watches, and advisories. Critical alerts are highlighted with audio notifications to ensure you never miss important weather developments.',
      keyFeatures: ['Active warnings', 'Audio notifications', 'Severity levels', 'Geographic targeting'],
      helpfulTips: ['Red alerts require immediate attention', 'Set up location-based filters', 'Enable push notifications'],
      duration: 20
    }
  ],
  'weather-intelligence-center': [
    {
      id: 'overview',
      title: 'Weather Intelligence Center Overview',
      description: 'Welcome to the Weather Intelligence Center! This is your unified command hub for weather monitoring and AI-powered storm prediction. Here you can access live weather data, AI storm predictions, professional weather models, and advanced analytics all in one place.',
      keyFeatures: ['Real-time weather monitoring', 'AI storm predictions', 'Professional weather models', 'Contractor opportunity analysis'],
      helpfulTips: ['Use state filtering for focused analysis', 'Check both live weather and AI predictions', 'Monitor the KPI dashboard for quick insights'],
      duration: 35
    },
    {
      id: 'kpi-dashboard',
      title: 'KPI Metrics Dashboard',
      element: '.grid',
      description: 'The KPI dashboard shows six critical metrics at a glance: active weather alerts, storm systems, wave heights, AI predictions, contractor opportunities, and data quality scores. Each metric updates in real-time and uses color coding to show status.',
      keyFeatures: ['Six real-time metrics', 'Color-coded status', 'Live updates', 'Interactive counters'],
      helpfulTips: ['Red metrics need immediate attention', 'Orange shows moderate concern', 'Green indicates normal conditions'],
      duration: 25
    },
    {
      id: 'live-weather-tab',
      title: 'Live Weather Monitoring',
      element: '[data-testid="tab-live-weather"]',
      description: 'The Live Weather tab provides real-time weather data from NOAA, NWS, satellites, and ocean buoys. You can see active weather alerts, ocean conditions including sea temperatures and wave heights, and monitor data from active weather buoys.',
      keyFeatures: ['NOAA weather alerts', 'Ocean temperature data', 'Wave height monitoring', 'Active buoy stations'],
      helpfulTips: ['Check alerts for severity levels', 'Monitor sea temperatures for hurricane development', 'Use buoy data for marine forecasting'],
      duration: 30
    },
    {
      id: 'ai-predictions-tab',
      title: 'AI Storm Predictions',
      element: '[data-testid="tab-ai-predictions"]',
      description: 'The AI Predictions tab uses advanced machine learning to analyze radar, satellite, ocean data, and historical patterns to predict storm behavior and identify contractor opportunities. You can see active predictions, damage forecasts, and risk level distributions.',
      keyFeatures: ['AI storm analysis', 'Damage forecasting', 'Contractor opportunities', 'Risk assessment'],
      helpfulTips: ['Higher risk levels indicate better opportunities', 'Use damage forecasts for pre-positioning', 'Monitor revenue estimates for planning'],
      duration: 30
    },
    {
      id: 'models-external-tab',
      title: 'Weather Models & External Resources',
      element: '[data-testid="tab-models-external"]',
      description: 'Access professional weather models including HWRF, HAFS, and GFS hurricane models, plus external analysis tools like the National Hurricane Center, Storm Prediction Center, and NOMADS model server for advanced weather analysis.',
      keyFeatures: ['Hurricane forecast models', 'Global weather models', 'Professional tools', 'External resources'],
      helpfulTips: ['Use HWRF for detailed hurricane analysis', 'GFS provides global weather patterns', 'External tools offer specialized analysis'],
      duration: 25
    },
    {
      id: 'ai-assistant-tab',
      title: 'ARIA Weather Intelligence Assistant',
      element: '[data-testid="tab-assistant"]',
      description: 'ARIA is your advanced AI assistant specializing in weather analysis, storm prediction, and disaster response guidance. You can ask questions about weather patterns, get storm analysis, and receive expert guidance on weather-related decisions.',
      keyFeatures: ['Voice and text interaction', 'Weather expertise', 'Storm analysis', 'Decision support'],
      helpfulTips: ['Ask specific questions about weather patterns', 'Use voice commands for hands-free operation', 'Request analysis of current conditions'],
      duration: 25
    }
  ],
  'traffic-cam-watcher': [
    {
      id: 'overview',
      title: 'TrafficCam Watcher Overview',
      description: 'Welcome to TrafficCam Watcher! This module monitors live traffic cameras across multiple states and uses AI to automatically detect storm damage. When damage is found, the system generates contractor leads with exact locations.',
      keyFeatures: ['Multi-state monitoring', 'AI damage detection', 'Automatic lead generation', 'Real-time photos'],
      helpfulTips: ['Check damage alerts every hour', 'Focus on high-traffic areas', 'Review photo evidence before deployment'],
      duration: 35
    },
    {
      id: 'camera-grid',
      title: 'Live Camera Feed Grid',
      element: '.camera-grid',
      description: 'The camera grid shows live feeds from traffic cameras across your coverage area. Each camera is analyzed by AI for damage detection. Green borders indicate normal conditions, red borders show detected damage.',
      keyFeatures: ['Live video feeds', 'AI analysis indicators', 'Geographic organization', 'Damage detection alerts'],
      helpfulTips: ['Red borders mean damage detected', 'Click cameras for full-screen view', 'Check feeds after storm events'],
      duration: 30
    },
    {
      id: 'damage-alerts',
      title: 'Damage Detection Alerts',
      element: '.damage-alerts',
      description: 'When AI detects potential damage, alerts appear here with photos, location details, and damage assessments. Each alert can be converted to a contractor lead with one click.',
      keyFeatures: ['Instant damage notifications', 'Photo evidence', 'Location coordinates', 'Lead conversion'],
      helpfulTips: ['Respond to alerts within 30 minutes', 'Verify damage before deployment', 'Use GPS coordinates for navigation'],
      duration: 25
    }
  ],
  'damage-detection': [
    {
      id: 'overview',
      title: 'AI Damage Detection Overview',
      description: 'Welcome to AI Damage Detection! This is the brain of your operation, using advanced computer vision to analyze images and identify storm damage automatically. The system processes thousands of images per hour.',
      keyFeatures: ['Computer vision analysis', 'Multiple damage types', 'Automated reporting', 'Quality scoring'],
      helpfulTips: ['Higher confidence scores mean better leads', 'Review flagged images manually', 'Set damage type preferences'],
      duration: 35
    },
    {
      id: 'image-analysis',
      title: 'Image Analysis Queue',
      element: '.analysis-queue',
      description: 'The analysis queue shows images being processed by the AI system. Each image receives a damage confidence score and detailed analysis of detected issues like roof damage, fallen trees, or flooding.',
      keyFeatures: ['Real-time processing', 'Confidence scoring', 'Damage categorization', 'Processing status'],
      helpfulTips: ['90%+ confidence scores are highly reliable', 'Review 70-89% scores manually', 'Process queue clears every hour'],
      duration: 30
    },
    {
      id: 'damage-reports',
      title: 'Generated Damage Reports',
      element: '.damage-reports',
      description: 'Completed damage reports show detailed analysis results with damage types, severity assessments, repair recommendations, and cost estimates. These reports are perfect for insurance claims and contractor estimates.',
      keyFeatures: ['Detailed damage analysis', 'Severity ratings', 'Cost estimates', 'Insurance-ready format'],
      helpfulTips: ['High severity damage has best ROI', 'Download reports for client meetings', 'Use cost estimates for pricing'],
      duration: 25
    }
  ],
  'disaster-essentials-marketplace': [
    {
      id: 'welcome',
      title: 'Marketplace Welcome',
      description: 'Welcome to the Disaster Essentials Marketplace! Your comprehensive resource hub for emergency management and disaster recovery. This marketplace provides real-time information on seven essential service categories.',
      keyFeatures: ['Seven service categories', 'Real-time availability', 'Professional discounts', 'Emergency contacts'],
      helpfulTips: ['Bookmark frequently used locations', 'Check availability before traveling', 'Use contractor discounts when available'],
      duration: 30
    },
    {
      id: 'category-tabs',
      title: 'Service Category Tabs',
      element: '.category-tabs',
      description: 'The service tabs let you switch between hotels, fuel stations, hardware stores, shelters, FEMA resources, emergency alerts, and satellite communication equipment. Each category shows real-time availability and pricing.',
      keyFeatures: ['Seven essential categories', 'Real-time data', 'Quick switching', 'Status indicators'],
      helpfulTips: ['Green indicators show availability', 'Red means closed or full', 'Yellow indicates limited availability'],
      duration: 25
    },
    {
      id: 'location-results',
      title: 'Location Results',
      element: '.location-results',
      description: 'Location results show nearby resources with current status, pricing, contact information, and driving directions. You can call locations directly or get turn-by-turn navigation with one tap.',
      keyFeatures: ['Current availability', 'Contact information', 'Driving directions', 'Pricing data'],
      helpfulTips: ['Call ahead to confirm availability', 'Use navigation for fastest routes', 'Check for contractor discounts'],
      duration: 25
    }
  ]
};

export default function PortalVoiceGuide({ 
  portalName, 
  sections, 
  currentSection, 
  onSectionChange, 
  className 
}: PortalVoiceGuideProps) {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isAudioReady, setIsAudioReady] = useState(true);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // ARIA STORM voice synthesis using server API
  const speak = useCallback(async (text: string, onComplete?: () => void) => {
    try {
      // Stop any existing audio first
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      
      setIsPlaying(true);
      
      // Call server API to generate ARIA STORM voice (Lily - Female Voice)
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
          setIsPlaying(false);
          audioRef.current = null;
          onComplete?.();
        };
        
        audio.onerror = () => {
          setIsPlaying(false);
          audioRef.current = null;
          console.error('Audio playback error');
          onComplete?.();
        };
        
        await audio.play();
      } else {
        setIsPlaying(false);
        onComplete?.();
      }
    } catch (error) {
      console.error('ARIA voice error:', error);
      setIsPlaying(false);
      audioRef.current = null;
      onComplete?.();
    }
  }, []);

  // Stop speaking
  const stopSpeaking = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
      setIsPlaying(false);
    }
  }, []);

  // Explain current section
  const explainSection = useCallback((index: number) => {
    if (index >= sections.length) return;

    const section = sections[index];
    setCurrentIndex(index);
    
    if (onSectionChange) {
      onSectionChange(section.id);
    }

    // Highlight element if specified
    if (section.element) {
      const element = document.querySelector(section.element);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.classList.add('highlight-pulse');
        setTimeout(() => element.classList.remove('highlight-pulse'), 3000);
      }
    }

    // Construct explanation text
    let explanation = section.description;
    
    if (section.keyFeatures.length > 0) {
      explanation += ` Key features include: ${section.keyFeatures.join(', ')}.`;
    }
    
    if (section.helpfulTips && section.helpfulTips.length > 0) {
      explanation += ` Helpful tips: ${section.helpfulTips.join('. ')}.`;
    }

    speak(explanation);
  }, [sections, onSectionChange, speak]);

  // Start guided tour with ARIA STORM voice
  const startGuidedTour = useCallback(async () => {
    setCurrentIndex(0);
    
    for (let currentIdx = 0; currentIdx < sections.length; currentIdx++) {
      const section = sections[currentIdx];
      setCurrentIndex(currentIdx);
      
      if (onSectionChange) {
        onSectionChange(section.id);
      }

      // Highlight element
      if (section.element) {
        const element = document.querySelector(section.element);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.classList.add('highlight-pulse');
          setTimeout(() => element.classList.remove('highlight-pulse'), 3000);
        }
      }

      let explanation = section.description;
      if (section.keyFeatures.length > 0) {
        explanation += ` Key features: ${section.keyFeatures.join(', ')}.`;
      }

      // Wait for ARIA to complete speaking before moving to next section
      await new Promise<void>((resolve) => {
        speak(explanation, () => {
          setTimeout(resolve, 1500);
        });
      });
    }

    // Tour complete message
    await new Promise<void>((resolve) => {
      speak(
        `This completes your guided tour of the ${portalName}. You can now explore the features in detail or restart the tour. I'm here to help whenever you need guidance.`,
        () => {
          setIsEnabled(false);
          resolve();
        }
      );
    });
  }, [sections, portalName, onSectionChange, speak]);

  // Toggle voice guide
  const toggleVoiceGuide = useCallback(() => {
    // Prevent toggling while audio is playing
    if (isPlaying && !isEnabled) {
      return;
    }
    
    if (isEnabled) {
      stopSpeaking();
      setIsEnabled(false);
    } else {
      setIsEnabled(true);
      // Small delay to ensure state is updated before speaking
      setTimeout(() => {
        explainSection(0);
      }, 100);
    }
  }, [isEnabled, isPlaying, explainSection, stopSpeaking]);

  // Skip to next section
  const skipToNext = useCallback(() => {
    const nextIndex = (currentIndex + 1) % sections.length;
    stopSpeaking();
    explainSection(nextIndex);
  }, [currentIndex, sections.length, stopSpeaking, explainSection]);

  if (!isAudioReady || sections.length === 0) {
    return null;
  }

  return (
    <motion.div 
      className={`portal-voice-guide ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border-blue-200 dark:border-blue-700">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            {/* Voice Guide Controls */}
            <div className="flex items-center gap-3">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  onClick={toggleVoiceGuide}
                  variant={isEnabled ? "default" : "outline"}
                  size="sm"
                  className={`transition-all duration-300 ${
                    isEnabled 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                      : 'border-blue-300 text-blue-600 hover:bg-blue-50'
                  }`}
                  data-testid="button-portal-voice-toggle"
                >
                  <motion.div
                    animate={isPlaying ? { scale: [1, 1.2, 1] } : {}}
                    transition={{ duration: 1, repeat: isPlaying ? Infinity : 0 }}
                  >
                    {isPlaying ? <Volume2 className="w-4 h-4 mr-2" /> : <VolumeX className="w-4 h-4 mr-2" />}
                  </motion.div>
                  {isEnabled ? 'Voice On' : 'Voice Guide'}
                </Button>
              </motion.div>

              {isEnabled && (
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-2"
                >
                  <Button
                    onClick={startGuidedTour}
                    variant="outline"
                    size="sm"
                    disabled={isPlaying}
                    className="text-blue-600 border-blue-300 hover:bg-blue-50"
                    data-testid="button-guided-tour"
                  >
                    <Play className="w-4 h-4 mr-1" />
                    Full Tour
                  </Button>
                  
                  <Button
                    onClick={skipToNext}
                    variant="outline"
                    size="sm"
                    disabled={!isPlaying}
                    className="text-blue-600 border-blue-300 hover:bg-blue-50"
                    data-testid="button-skip-section"
                  >
                    <SkipForward className="w-4 h-4" />
                  </Button>
                </motion.div>
              )}
            </div>

            {/* Status and Progress */}
            <div className="flex items-center gap-3">
              {isEnabled && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400"
                >
                  <Badge variant="outline" className="border-blue-300 text-blue-700">
                    {currentIndex + 1} of {sections.length}
                  </Badge>
                  <div className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                  <span className="hidden sm:inline">
                    {isPlaying ? 'Explaining...' : 'Ready'}
                  </span>
                </motion.div>
              )}
            </div>
          </div>

          {/* Current Section Info */}
          {isEnabled && sections[currentIndex] && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg border border-blue-200 dark:border-blue-700"
            >
              <h4 className="font-semibold text-blue-900 dark:text-blue-200 text-sm">
                Currently Explaining: {sections[currentIndex].title}
              </h4>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                {sections[currentIndex].description.substring(0, 100)}...
              </p>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}