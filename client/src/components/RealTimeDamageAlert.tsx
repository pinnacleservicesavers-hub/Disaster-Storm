import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useMutation, useQuery } from '@tanstack/react-query';
import { 
  AlertTriangle, 
  Volume2, 
  VolumeX, 
  Zap, 
  MapPin, 
  Phone, 
  Mail, 
  Home, 
  TreePine, 
  Camera, 
  Navigation, 
  Shield, 
  Target, 
  Clock, 
  Users, 
  DollarSign,
  Siren,
  Radar,
  Crosshair,
  RadioReceiver,
  Satellite,
  Eye,
  Brain,
  Bolt,
  Crown,
  Atom
} from 'lucide-react';
import { FadeIn, PulseAlert, ScaleIn } from '@/components/ui/animations';
import { apiRequest } from '@/lib/queryClient';

interface DamageIncident {
  id: string;
  timestamp: Date;
  location: {
    latitude: number;
    longitude: number;
    address: string;
    city: string;
    state: string;
    zipCode: string;
  };
  homeowner: {
    name: string;
    phone: string;
    email: string;
    propertyValue: number;
    insuranceCarrier: string;
    policyNumber?: string;
  };
  damage: {
    type: 'tree_fall' | 'roof_damage' | 'window_break' | 'power_line_down' | 'flooding' | 'debris_impact';
    object: string; // "60ft Oak Tree", "Power Line", "Roof Shingle", etc.
    target: string; // "Main House Roof", "Front Window", "Garage Door", etc.
    severity: 'minor' | 'moderate' | 'major' | 'severe' | 'catastrophic';
    estimatedCost: { min: number; max: number };
    imageUrl?: string;
  };
  stormData: {
    windSpeed: number;
    direction: number;
    rainfall: number;
    stormName?: string;
  };
  contractorInfo: {
    serviceNeeded: string[];
    urgency: 'immediate' | 'within_24h' | 'within_week' | 'routine';
    accessDifficulty: 'easy' | 'moderate' | 'difficult' | 'extreme';
    revenueProjection: number;
    competitionLevel: number;
  };
  confidence: number;
}

interface StormPath {
  currentLocation: { lat: number; lng: number };
  direction: number; // degrees
  speed: number; // mph
  predictedPath: Array<{
    time: Date;
    location: { lat: number; lng: number };
    intensity: number;
    damageRisk: number;
  }>;
  dangerZones: Array<{
    center: { lat: number; lng: number };
    radius: number; // miles
    riskLevel: number;
    timeWindow: { start: Date; end: Date };
  }>;
}

interface ContractorAlert {
  id: string;
  type: 'positioning' | 'warning' | 'opportunity' | 'evacuation';
  message: string;
  location: { lat: number; lng: number; address: string };
  timeframe: string;
  priority: 'low' | 'medium' | 'high' | 'critical' | 'emergency';
  actionRequired: string;
  revenueImpact?: number;
}

interface RealTimeDamageAlertProps {
  className?: string;
  onIncident?: (incident: DamageIncident) => void;
  onContractorAlert?: (alert: ContractorAlert) => void;
}

export function RealTimeDamageAlert({ className = '', onIncident, onContractorAlert }: RealTimeDamageAlertProps) {
  const [incidents, setIncidents] = useState<DamageIncident[]>([]);
  const [contractorAlerts, setContractorAlerts] = useState<ContractorAlert[]>([]);
  const [stormPaths, setStormPaths] = useState<StormPath[]>([]);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [monitoring, setMonitoring] = useState(true);
  const [alertsActive, setAlertsActive] = useState(0);
  const [processingIntensity, setProcessingIntensity] = useState(94);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const lastAlertRef = useRef<Date>(new Date());

  // Real-time damage monitoring
  const { data: damageStream, refetch: refetchDamage } = useQuery({
    queryKey: ['/api/real-time-damage-monitoring'],
    refetchInterval: monitoring ? 15000 : false, // 15 seconds for real-time
  });

  // Storm path tracking
  const { data: stormTracking } = useQuery({
    queryKey: ['/api/real-time-storm-tracking'],
    refetchInterval: monitoring ? 30000 : false, // 30 seconds
  });

  // Contractor positioning intelligence
  const { data: contractorIntelligence } = useQuery({
    queryKey: ['/api/contractor-positioning-intelligence'],
    refetchInterval: monitoring ? 45000 : false, // 45 seconds
  });

  // Advanced damage analysis with AI
  const damageAnalysisMutation = useMutation({
    mutationFn: async (incidentData: any) => {
      return apiRequest('/api/advanced-damage-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          incidentData,
          analysisMode: 'comprehensive',
          includeHomeownerLookup: true,
          includeContractorIntelligence: true,
          realTimeProcessing: true
        })
      });
    },
    onSuccess: (data) => {
      if (data.incident) {
        const newIncident = data.incident as DamageIncident;
        setIncidents(prev => [newIncident, ...prev.slice(0, 19)]); // Keep last 20
        
        if (onIncident) onIncident(newIncident);
        if (voiceEnabled) speakIncidentAlert(newIncident);
      }
      
      if (data.contractorAlerts) {
        const alerts = data.contractorAlerts as ContractorAlert[];
        setContractorAlerts(prev => [...alerts, ...prev.slice(0, 9)]); // Keep last 10
        
        alerts.forEach(alert => {
          if (onContractorAlert) onContractorAlert(alert);
          if (voiceEnabled && alert.priority === 'critical' || alert.priority === 'emergency') {
            speakContractorAlert(alert);
          }
        });
      }
    }
  });

  // Advanced text-to-speech for incidents
  const speakIncidentAlert = (incident: DamageIncident) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(
        `DAMAGE ALERT: ${incident.damage.object} has hit ${incident.damage.target} at ${incident.location.address}. ` +
        `Homeowner: ${incident.homeowner.name}, Phone: ${incident.homeowner.phone}. ` +
        `Estimated repair cost: $${incident.damage.estimatedCost.min.toLocaleString()} to $${incident.damage.estimatedCost.max.toLocaleString()}. ` +
        `Service needed: ${incident.contractorInfo.serviceNeeded.join(', ')}. ` +
        `Revenue projection: $${incident.contractorInfo.revenueProjection.toLocaleString()}.`
      );
      
      utterance.rate = 1.1;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      
      // Use more urgent voice settings for severe damage
      if (incident.damage.severity === 'severe' || incident.damage.severity === 'catastrophic') {
        utterance.rate = 1.2;
        utterance.pitch = 1.1;
      }
      
      window.speechSynthesis.speak(utterance);
    }
  };

  // Advanced contractor positioning alerts
  const speakContractorAlert = (alert: ContractorAlert) => {
    if ('speechSynthesis' in window) {
      const urgencyPrefix = alert.priority === 'emergency' ? 'EMERGENCY ALERT: ' : 
                            alert.priority === 'critical' ? 'CRITICAL ALERT: ' : 
                            'CONTRACTOR ALERT: ';
      
      const utterance = new SpeechSynthesisUtterance(
        `${urgencyPrefix}${alert.message}. Location: ${alert.location.address}. ${alert.actionRequired}`
      );
      
      utterance.rate = alert.priority === 'emergency' ? 1.3 : 1.1;
      utterance.pitch = alert.priority === 'emergency' ? 1.2 : 1.0;
      utterance.volume = 1.0;
      
      window.speechSynthesis.speak(utterance);
    }
  };

  // Real-time processing intensity simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setProcessingIntensity(prev => {
        const variation = Math.random() * 6 - 3;
        return Math.max(85, Math.min(100, prev + variation));
      });
      
      setAlertsActive(incidents.length + contractorAlerts.length);
    }, 2000);

    return () => clearInterval(interval);
  }, [incidents.length, contractorAlerts.length]);

  // Process new damage data
  useEffect(() => {
    if (damageStream && (damageStream as any).newIncidents) {
      (damageStream as any).newIncidents.forEach((incident: any) => {
        damageAnalysisMutation.mutate(incident);
      });
    }
  }, [damageStream]);

  // Process storm tracking data
  useEffect(() => {
    if (stormTracking && (stormTracking as any).stormPaths) {
      setStormPaths((stormTracking as any).stormPaths);
    }
  }, [stormTracking]);

  const getDamageIcon = (type: string) => {
    switch (type) {
      case 'tree_fall': return <TreePine className="h-5 w-5 text-green-600" />;
      case 'roof_damage': return <Home className="h-5 w-5 text-red-600" />;
      case 'power_line_down': return <Zap className="h-5 w-5 text-yellow-600" />;
      default: return <AlertTriangle className="h-5 w-5 text-orange-600" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'catastrophic': return 'bg-red-900 text-white';
      case 'severe': return 'bg-red-700 text-white';
      case 'major': return 'bg-orange-600 text-white';
      case 'moderate': return 'bg-yellow-600 text-white';
      case 'minor': return 'bg-blue-600 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'emergency': return 'bg-red-900 text-white animate-pulse';
      case 'critical': return 'bg-red-700 text-white';
      case 'high': return 'bg-orange-600 text-white';
      case 'medium': return 'bg-yellow-600 text-white';
      case 'low': return 'bg-blue-600 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  return (
    <Card className={`real-time-damage-alert border-4 border-gradient-to-r from-red-500 via-orange-500 to-yellow-500 shadow-2xl ${className}`}>
      <CardHeader className="pb-4 bg-gradient-to-r from-red-900/10 via-orange-900/10 to-yellow-900/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <motion.div
              animate={{ 
                rotate: [0, 360],
                scale: [1, 1.3, 1]
              }}
              transition={{ 
                rotate: { duration: 3, repeat: Infinity, ease: "linear" },
                scale: { duration: 1.5, repeat: Infinity }
              }}
              className="relative"
            >
              <div className="p-2 bg-gradient-to-r from-red-600 via-orange-600 to-yellow-600 rounded-full">
                <Radar className="h-8 w-8 text-white" />
              </div>
              <motion.div 
                className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center"
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 0.8, repeat: Infinity }}
              >
                <Siren className="h-2 w-2 text-white" />
              </motion.div>
            </motion.div>
            <div>
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-red-600 via-orange-600 via-yellow-600 to-red-600 bg-clip-text text-transparent">
                REAL-TIME DAMAGE INTELLIGENCE
              </CardTitle>
              <CardDescription className="text-sm font-semibold text-red-700">
                🚨 Live Damage Detection • Object Recognition • Homeowner Data • Contractor Positioning
              </CardDescription>
            </div>
          </div>
          
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className="bg-gradient-to-r from-red-600 to-orange-600 text-white animate-pulse">
              {alertsActive} ACTIVE ALERTS
            </Badge>
            <Badge className="bg-gradient-to-r from-orange-600 to-yellow-600 text-white">
              {monitoring ? '🔴 LIVE' : '⏸️ PAUSED'}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setVoiceEnabled(!voiceEnabled)}
              className={`border-2 ${voiceEnabled ? 'bg-green-100 border-green-500 text-green-700' : 'bg-red-100 border-red-500 text-red-700'}`}
            >
              {voiceEnabled ? <Volume2 className="h-4 w-4 mr-1" /> : <VolumeX className="h-4 w-4 mr-1" />}
              Voice {voiceEnabled ? 'ON' : 'OFF'}
            </Button>
          </div>
        </div>

        {/* Real-time Processing Status */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="bg-gradient-to-r from-red-50 to-orange-50 p-3 rounded-lg border border-red-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-red-800">Damage Detection</span>
              <Badge className="bg-red-600">{processingIntensity.toFixed(1)}%</Badge>
            </div>
            <Progress value={processingIntensity} className="h-3 bg-gradient-to-r from-red-200 to-orange-200" />
          </div>
          
          <div className="bg-gradient-to-r from-orange-50 to-yellow-50 p-3 rounded-lg border border-orange-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-orange-800">Object Recognition</span>
              <Badge className="bg-orange-600">{Math.round(processingIntensity - 5)}%</Badge>
            </div>
            <Progress value={processingIntensity - 5} className="h-3 bg-gradient-to-r from-orange-200 to-yellow-200" />
          </div>
          
          <div className="bg-gradient-to-r from-yellow-50 to-green-50 p-3 rounded-lg border border-yellow-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-yellow-800">Homeowner Lookup</span>
              <Badge className="bg-yellow-600">{Math.round(processingIntensity + 3)}%</Badge>
            </div>
            <Progress value={Math.min(100, processingIntensity + 3)} className="h-3 bg-gradient-to-r from-yellow-200 to-green-200" />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Active Damage Incidents */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-red-800 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              LIVE DAMAGE INCIDENTS ({incidents.length})
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMonitoring(!monitoring)}
              className={`border-2 ${monitoring ? 'bg-red-100 border-red-500 text-red-700' : 'bg-gray-100 border-gray-500'}`}
            >
              {monitoring ? 'PAUSE MONITORING' : 'RESUME MONITORING'}
            </Button>
          </div>

          <div className="space-y-4 max-h-[400px] overflow-y-auto">
            <AnimatePresence>
              {incidents.map((incident) => (
                <motion.div
                  key={incident.id}
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -20 }}
                  className="bg-gradient-to-r from-red-50 via-orange-50 to-yellow-50 border-2 border-red-200 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {getDamageIcon(incident.damage.type)}
                      <div>
                        <h4 className="font-bold text-red-800">
                          {incident.damage.object} → {incident.damage.target}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {incident.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    <Badge className={getSeverityColor(incident.damage.severity)}>
                      {incident.damage.severity.toUpperCase()}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Location & Homeowner Info */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-blue-600" />
                        <span className="font-medium">{incident.location.address}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="h-4 w-4 text-green-600" />
                        <span className="font-medium">{incident.homeowner.name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-blue-600" />
                        <a href={`tel:${incident.homeowner.phone}`} className="text-blue-600 hover:underline font-medium">
                          {incident.homeowner.phone}
                        </a>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-green-600" />
                        <a href={`mailto:${incident.homeowner.email}`} className="text-green-600 hover:underline">
                          {incident.homeowner.email}
                        </a>
                      </div>
                    </div>

                    {/* Contractor Intelligence */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <span className="font-medium">
                          ${incident.damage.estimatedCost.min.toLocaleString()} - ${incident.damage.estimatedCost.max.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Target className="h-4 w-4 text-orange-600" />
                        <span>Revenue: <strong>${incident.contractorInfo.revenueProjection.toLocaleString()}</strong></span>
                      </div>
                      <div className="text-sm">
                        <span className="font-medium text-blue-800">Services needed:</span>
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {incident.contractorInfo.serviceNeeded.map((service, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {service}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <Badge className={`text-xs ${
                        incident.contractorInfo.urgency === 'immediate' ? 'bg-red-600' :
                        incident.contractorInfo.urgency === 'within_24h' ? 'bg-orange-600' :
                        'bg-yellow-600'
                      } text-white`}>
                        {incident.contractorInfo.urgency.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-red-200">
                    <div className="flex items-center justify-between text-xs text-gray-600">
                      <span>Confidence: {Math.round(incident.confidence * 100)}%</span>
                      <span>Wind: {incident.stormData.windSpeed}mph @ {incident.stormData.direction}°</span>
                      <span>Competition: {incident.contractorInfo.competitionLevel}/10</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {incidents.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Radar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-lg font-medium">Monitoring for damage incidents...</p>
                <p className="text-sm">Real-time detection active across all monitored areas</p>
              </div>
            )}
          </div>
        </div>

        {/* Contractor Positioning Alerts */}
        <div>
          <h3 className="text-lg font-bold text-orange-800 flex items-center gap-2 mb-4">
            <Navigation className="h-5 w-5" />
            CONTRACTOR POSITIONING ALERTS ({contractorAlerts.length})
          </h3>

          <div className="space-y-3 max-h-[300px] overflow-y-auto">
            <AnimatePresence>
              {contractorAlerts.map((alert) => (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded p-3"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="p-1 bg-orange-200 rounded">
                        {alert.type === 'warning' ? <Shield className="h-4 w-4 text-orange-800" /> :
                         alert.type === 'opportunity' ? <Target className="h-4 w-4 text-green-800" /> :
                         alert.type === 'evacuation' ? <AlertTriangle className="h-4 w-4 text-red-800" /> :
                         <Navigation className="h-4 w-4 text-blue-800" />}
                      </div>
                      <div>
                        <Badge className={getPriorityColor(alert.priority)}>
                          {alert.priority.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                    <span className="text-xs text-gray-500">{alert.timeframe}</span>
                  </div>
                  
                  <p className="text-sm font-medium text-gray-800 mb-2">{alert.message}</p>
                  
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-blue-600" />
                      <span>{alert.location.address}</span>
                    </div>
                    {alert.revenueImpact && (
                      <div className="flex items-center gap-1 text-green-700 font-medium">
                        <DollarSign className="h-3 w-3" />
                        <span>${alert.revenueImpact.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                  
                  <p className="text-xs text-blue-800 mt-2 font-medium">{alert.actionRequired}</p>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {contractorAlerts.length === 0 && (
              <div className="text-center py-6 text-gray-500">
                <Navigation className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No positioning alerts at this time</p>
              </div>
            )}
          </div>
        </div>

        {/* System Status Footer */}
        <div className="border-t-4 border-gradient-to-r from-red-500 to-orange-500 pt-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="bg-gradient-to-r from-red-100 to-orange-100 p-2 rounded border border-red-200">
              <div className="flex items-center justify-center gap-1 text-red-700 font-bold text-xs">
                <Eye className="h-3 w-3" />
                <span>AI Vision Active</span>
              </div>
            </div>
            <div className="bg-gradient-to-r from-orange-100 to-yellow-100 p-2 rounded border border-orange-200">
              <div className="flex items-center justify-center gap-1 text-orange-700 font-bold text-xs">
                <Brain className="h-3 w-3" />
                <span>Object Recognition</span>
              </div>
            </div>
            <div className="bg-gradient-to-r from-yellow-100 to-green-100 p-2 rounded border border-yellow-200">
              <div className="flex items-center justify-center gap-1 text-yellow-700 font-bold text-xs">
                <Users className="h-3 w-3" />
                <span>Homeowner Data</span>
              </div>
            </div>
            <div className="bg-gradient-to-r from-green-100 to-blue-100 p-2 rounded border border-green-200">
              <div className="flex items-center justify-center gap-1 text-green-700 font-bold text-xs">
                <Crown className="h-3 w-3" />
                <span>Live Intelligence</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}