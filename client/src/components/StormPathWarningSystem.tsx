import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useQuery } from '@tanstack/react-query';
import { 
  Navigation,
  AlertTriangle,
  MapPin,
  Clock,
  Zap,
  Shield,
  Target,
  TrendingUp,
  Wind,
  Gauge,
  Crosshair,
  RadioReceiver,
  Users,
  DollarSign,
  ArrowRight,
  Timer,
  Activity
} from 'lucide-react';

interface StormPathData {
  stormId: string;
  name: string;
  currentLocation: { lat: number; lng: number; address: string };
  direction: number; // degrees
  speed: number; // mph
  intensity: number; // 1-10 scale
  predictedPath: Array<{
    time: Date;
    location: { lat: number; lng: number; address: string };
    windSpeed: number;
    damageRisk: number;
    arrivalTime: string;
  }>;
  dangerZones: Array<{
    id: string;
    center: { lat: number; lng: number };
    radius: number; // miles
    riskLevel: number; // 1-10
    timeWindow: { start: Date; end: Date };
    evacuationRecommended: boolean;
  }>;
  contractorGuidance: {
    safeZones: Array<{
      location: { lat: number; lng: number; address: string };
      waitUntil: Date;
      opportunities: Array<{
        type: string;
        revenue: number;
        timeframe: string;
      }>;
    }>;
    dangerousAreas: Array<{
      location: { lat: number; lng: number; address: string };
      avoidUntil: Date;
      riskLevel: number;
      reason: string;
    }>;
    optimalPositioning: Array<{
      arrivalLocation: { lat: number; lng: number; address: string };
      arrivalTime: Date;
      revenueProjection: number;
      competitionLevel: number;
      preparationTime: string;
    }>;
  };
}

interface ContractorPosition {
  id: string;
  location: { lat: number; lng: number };
  status: 'safe' | 'at_risk' | 'in_danger' | 'optimal';
  distanceFromStorm: number; // miles
  timeToEvacuate?: number; // minutes
  recommendedAction: string;
  revenueOpportunity?: number;
}

interface StormPathWarningProps {
  className?: string;
  contractorLocation?: { lat: number; lng: number };
}

export function StormPathWarningSystem({ className = '', contractorLocation }: StormPathWarningProps) {
  const [activeStorms, setActiveStorms] = useState<StormPathData[]>([]);
  const [contractorPositions, setContractorPositions] = useState<ContractorPosition[]>([]);
  const [voiceAlertsEnabled, setVoiceAlertsEnabled] = useState(true);
  const [trackingActive, setTrackingActive] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Real-time storm path data
  const { data: stormPathData } = useQuery({
    queryKey: ['/api/storm-path-tracking'],
    refetchInterval: trackingActive ? 60000 : false, // 1 minute updates
  });

  // Contractor positioning data
  const { data: positioningData } = useQuery({
    queryKey: ['/api/contractor-positioning', contractorLocation],
    refetchInterval: trackingActive ? 120000 : false, // 2 minute updates
  });

  const speakStormWarning = async (storm: StormPathData, urgency: 'high' | 'critical' | 'emergency') => {
    if (!voiceAlertsEnabled) return;
    
    const nextLocation = storm.predictedPath[0];
    const message = urgency === 'emergency' ? 
      `EMERGENCY: ${storm.name} approaching ${nextLocation?.location.address} in ${nextLocation?.arrivalTime}. Evacuate immediately.` :
      urgency === 'critical' ?
      `CRITICAL ALERT: ${storm.name} will reach ${nextLocation?.location.address} in ${nextLocation?.arrivalTime}. Prepare for evacuation.` :
      `Storm warning: ${storm.name} heading toward ${nextLocation?.location.address}. Monitor conditions.`;
    
    try {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      
      const response = await fetch('/api/closebot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          history: [],
          context: { leadName: "user", companyName: "the company", trade: "general" },
          enableVoice: true
        })
      });
      
      const data = await response.json();
      
      if (data.audioUrl) {
        audioRef.current = new Audio(data.audioUrl);
        await audioRef.current.play();
      }
    } catch (error) {
      console.error('Storm warning voice error:', error);
    }
  };

  const speakPositioningGuidance = async (guidance: string, isOpportunity: boolean = false) => {
    if (!voiceAlertsEnabled) return;
    
    const prefix = isOpportunity ? 'OPPORTUNITY ALERT: ' : 'POSITIONING GUIDANCE: ';
    
    try {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      
      const response = await fetch('/api/closebot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: prefix + guidance,
          history: [],
          context: { leadName: "user", companyName: "the company", trade: "general" },
          enableVoice: true
        })
      });
      
      const data = await response.json();
      
      if (data.audioUrl) {
        audioRef.current = new Audio(data.audioUrl);
        await audioRef.current.play();
      }
    } catch (error) {
      console.error('Positioning guidance voice error:', error);
    }
  };

  useEffect(() => {
    if (stormPathData && (stormPathData as any).storms) {
      setActiveStorms((stormPathData as any).storms);
      
      // Speak critical storm alerts
      (stormPathData as any).storms.forEach((storm: StormPathData) => {
        if (storm.intensity >= 8) {
          speakStormWarning(storm, 'emergency');
        } else if (storm.intensity >= 6) {
          speakStormWarning(storm, 'critical');
        }
      });
    }
  }, [stormPathData]);

  useEffect(() => {
    if (positioningData && (positioningData as any).positions) {
      setContractorPositions((positioningData as any).positions);
    }
  }, [positioningData]);

  const getStormIntensityColor = (intensity: number) => {
    if (intensity >= 8) return 'bg-red-900 text-white';
    if (intensity >= 6) return 'bg-red-700 text-white';
    if (intensity >= 4) return 'bg-orange-600 text-white';
    if (intensity >= 2) return 'bg-yellow-600 text-white';
    return 'bg-blue-600 text-white';
  };

  const getRiskLevelColor = (riskLevel: number) => {
    if (riskLevel >= 8) return 'text-red-900 bg-red-100';
    if (riskLevel >= 6) return 'text-red-700 bg-red-50';
    if (riskLevel >= 4) return 'text-orange-700 bg-orange-50';
    if (riskLevel >= 2) return 'text-yellow-700 bg-yellow-50';
    return 'text-green-700 bg-green-50';
  };

  const getPositionStatusColor = (status: string) => {
    switch (status) {
      case 'in_danger': return 'bg-red-900 text-white animate-pulse';
      case 'at_risk': return 'bg-red-600 text-white';
      case 'safe': return 'bg-green-600 text-white';
      case 'optimal': return 'bg-blue-600 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  return (
    <Card className={`storm-path-warning border-4 border-gradient-to-r from-red-500 via-yellow-500 to-orange-500 shadow-2xl ${className}`}>
      <CardHeader className="pb-4 bg-gradient-to-r from-red-900/10 via-yellow-900/10 to-orange-900/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <motion.div
              animate={{ 
                rotate: trackingActive ? [0, 360] : 0,
                scale: [1, 1.2, 1]
              }}
              transition={{ 
                rotate: { duration: 4, repeat: Infinity, ease: "linear" },
                scale: { duration: 2, repeat: Infinity }
              }}
              className="relative"
            >
              <div className="p-2 bg-gradient-to-r from-red-600 via-yellow-600 to-orange-600 rounded-full">
                <Navigation className="h-8 w-8 text-white" />
              </div>
              <motion.div 
                className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center"
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <Zap className="h-2 w-2 text-red-800" />
              </motion.div>
            </motion.div>
            <div>
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-red-600 via-yellow-600 to-orange-600 bg-clip-text text-transparent">
                STORM PATH WARNING SYSTEM
              </CardTitle>
              <CardDescription className="text-sm font-semibold text-red-700">
                🌪️ Real-time Path Tracking • Contractor Safety • Optimal Positioning Intelligence
              </CardDescription>
            </div>
          </div>
          
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className="bg-gradient-to-r from-red-600 to-orange-600 text-white animate-pulse">
              {activeStorms.length} ACTIVE STORMS
            </Badge>
            <Badge className="bg-gradient-to-r from-yellow-600 to-orange-600 text-white">
              {trackingActive ? '🔴 TRACKING' : '⏸️ PAUSED'}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Active Storm Tracking */}
        <div>
          <h3 className="text-lg font-bold text-red-800 flex items-center gap-2 mb-4">
            <Wind className="h-5 w-5" />
            ACTIVE STORM PATHS ({activeStorms.length})
          </h3>

          <div className="space-y-4 max-h-[500px] overflow-y-auto">
            <AnimatePresence>
              {activeStorms.map((storm) => (
                <motion.div
                  key={storm.stormId}
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -20 }}
                  className="bg-gradient-to-r from-red-50 via-yellow-50 to-orange-50 border-2 border-red-200 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-red-600 rounded-full">
                        <Wind className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h4 className="text-xl font-bold text-red-800">{storm.name}</h4>
                        <p className="text-sm text-gray-600">
                          Speed: {storm.speed} mph | Direction: {storm.direction}°
                        </p>
                      </div>
                    </div>
                    <Badge className={getStormIntensityColor(storm.intensity)}>
                      INTENSITY {storm.intensity}/10
                    </Badge>
                  </div>

                  {/* Current Location */}
                  <div className="mb-4 p-3 bg-red-100 rounded border border-red-300">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="h-4 w-4 text-red-600" />
                      <span className="font-semibold text-red-800">Current Location</span>
                    </div>
                    <p className="text-sm font-medium">{storm.currentLocation.address}</p>
                  </div>

                  {/* Predicted Path */}
                  <div className="mb-4">
                    <h5 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      PREDICTED PATH
                    </h5>
                    <div className="space-y-2">
                      {storm.predictedPath.slice(0, 3).map((point, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-yellow-50 rounded border">
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${
                              point.damageRisk >= 8 ? 'bg-red-600' :
                              point.damageRisk >= 6 ? 'bg-orange-600' :
                              point.damageRisk >= 4 ? 'bg-yellow-600' : 'bg-blue-600'
                            }`} />
                            <span className="text-sm font-medium">{point.location.address}</span>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-medium">{point.arrivalTime}</p>
                            <p className="text-xs text-gray-600">{point.windSpeed} mph winds</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Contractor Guidance */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Safe Zones */}
                    <div className="bg-green-50 border border-green-200 rounded p-3">
                      <h6 className="font-semibold text-green-800 mb-2 flex items-center gap-1">
                        <Shield className="h-4 w-4" />
                        SAFE ZONES
                      </h6>
                      {storm.contractorGuidance.safeZones.slice(0, 2).map((zone, index) => (
                        <div key={index} className="text-sm mb-2">
                          <p className="font-medium">{zone.location.address}</p>
                          <p className="text-green-700">Wait until: {zone.waitUntil.toLocaleString()}</p>
                          <p className="text-green-600">
                            Revenue: ${zone.opportunities.reduce((sum, opp) => sum + opp.revenue, 0).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Danger Zones */}
                    <div className="bg-red-50 border border-red-200 rounded p-3">
                      <h6 className="font-semibold text-red-800 mb-2 flex items-center gap-1">
                        <AlertTriangle className="h-4 w-4" />
                        DANGER ZONES
                      </h6>
                      {storm.contractorGuidance.dangerousAreas.slice(0, 2).map((area, index) => (
                        <div key={index} className="text-sm mb-2">
                          <p className="font-medium">{area.location.address}</p>
                          <p className="text-red-700">Avoid until: {area.avoidUntil.toLocaleString()}</p>
                          <p className="text-red-600">Risk: {area.riskLevel}/10 - {area.reason}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Optimal Positioning */}
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
                    <h6 className="font-semibold text-blue-800 mb-2 flex items-center gap-1">
                      <Target className="h-4 w-4" />
                      OPTIMAL POSITIONING
                    </h6>
                    {storm.contractorGuidance.optimalPositioning.slice(0, 2).map((pos, index) => (
                      <div key={index} className="text-sm mb-2 flex items-center justify-between">
                        <div>
                          <p className="font-medium">{pos.arrivalLocation.address}</p>
                          <p className="text-blue-700">Arrive: {pos.arrivalTime.toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600">${pos.revenueProjection.toLocaleString()}</p>
                          <p className="text-xs">Competition: {pos.competitionLevel}/10</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {activeStorms.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Navigation className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-lg font-medium">No active storm paths detected</p>
                <p className="text-sm">Monitoring system is active and ready</p>
              </div>
            )}
          </div>
        </div>

        {/* Contractor Position Status */}
        {contractorPositions.length > 0 && (
          <div>
            <h3 className="text-lg font-bold text-orange-800 flex items-center gap-2 mb-4">
              <Users className="h-5 w-5" />
              CONTRACTOR POSITIONS ({contractorPositions.length})
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {contractorPositions.map((position) => (
                <div key={position.id} className="bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded p-3">
                  <div className="flex items-center justify-between mb-2">
                    <Badge className={getPositionStatusColor(position.status)}>
                      {position.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                    <span className="text-sm text-gray-600">
                      {position.distanceFromStorm.toFixed(1)} mi from storm
                    </span>
                  </div>
                  
                  <p className="text-sm font-medium text-gray-800 mb-2">{position.recommendedAction}</p>
                  
                  {position.timeToEvacuate && (
                    <div className="flex items-center gap-1 text-red-700 text-sm font-medium mb-2">
                      <Timer className="h-4 w-4" />
                      <span>Evacuate in {position.timeToEvacuate} minutes</span>
                    </div>
                  )}
                  
                  {position.revenueOpportunity && (
                    <div className="flex items-center gap-1 text-green-700 text-sm font-medium">
                      <DollarSign className="h-4 w-4" />
                      <span>Opportunity: ${position.revenueOpportunity.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Control Panel */}
        <div className="border-t-4 border-gradient-to-r from-red-500 to-orange-500 pt-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setVoiceAlertsEnabled(!voiceAlertsEnabled)}
                className={`border-2 ${voiceAlertsEnabled ? 'bg-green-100 border-green-500 text-green-700' : 'bg-red-100 border-red-500 text-red-700'}`}
              >
                Voice Alerts {voiceAlertsEnabled ? 'ON' : 'OFF'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTrackingActive(!trackingActive)}
                className={`border-2 ${trackingActive ? 'bg-blue-100 border-blue-500 text-blue-700' : 'bg-gray-100 border-gray-500'}`}
              >
                Tracking {trackingActive ? 'ACTIVE' : 'PAUSED'}
              </Button>
            </div>
            
            <div className="text-sm text-gray-600">
              Last updated: {new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}