import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MapPin, Phone, Mail, DollarSign, AlertTriangle, Users, Building, Navigation, TrendingUp, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ModuleAIAssistant from '@/components/ModuleAIAssistant';

interface DeploymentOpportunity {
  id: string;
  timestamp: Date;
  location: {
    state: string;
    city: string;
    zip: string;
    street: string;
    fullAddress: string;
    coordinates: { lat: number; lng: number };
  };
  damage: {
    type: string[];
    severity: 'minor' | 'moderate' | 'severe' | 'catastrophic';
    confidence: number;
    estimatedCost: { min: number; max: number };
    description: string;
    affectedAreas: string[];
  };
  propertyOwner?: {
    name: string;
    phone: string;
    email: string;
    insuranceCompany?: string;
    claimNumber?: string;
  };
  contractorIntel: {
    profitabilityScore: number;
    urgency: 'low' | 'normal' | 'high' | 'emergency';
    contractorTypesNeeded: string[];
    estimatedResponseTime: string;
    competitionLevel: 'low' | 'medium' | 'high';
    leadPriority: 'low' | 'medium' | 'high' | 'critical';
  };
  sources: {
    imagery?: string;
    damageDetection: string;
    propertyData: string;
  };
}

interface DeploymentZone {
  state: string;
  city: string;
  zipCodes: string[];
  totalOpportunities: number;
  totalEstimatedRevenue: number;
  averageSeverity: number;
  opportunities: DeploymentOpportunity[];
}

export default function DeploymentIntelligence() {
  const [selectedState, setSelectedState] = useState<string>('all');
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [selectedZone, setSelectedZone] = useState<DeploymentZone | null>(null);
  
  // Fetch deployment opportunities
  const { data: opportunitiesData, isLoading } = useQuery<{
    success: boolean;
    totalOpportunities: number;
    zones: DeploymentZone[];
    opportunities: DeploymentOpportunity[];
  }>({
    queryKey: ['/api/deployment/opportunities', selectedState, selectedCity],
    refetchInterval: 60000, // Refresh every minute
  });
  
  const zones = opportunitiesData?.zones || [];
  const opportunities = selectedZone 
    ? selectedZone.opportunities 
    : opportunitiesData?.opportunities || [];
  
  const severityColors = {
    minor: 'bg-yellow-500/20 border-yellow-500/40 text-yellow-400',
    moderate: 'bg-orange-500/20 border-orange-500/40 text-orange-400',
    severe: 'bg-red-500/20 border-red-500/40 text-red-400',
    catastrophic: 'bg-purple-500/20 border-purple-500/40 text-purple-400',
  };
  
  const urgencyColors = {
    low: 'text-green-400',
    normal: 'text-blue-400',
    high: 'text-orange-400',
    emergency: 'text-red-400',
  };
  
  const priorityColors = {
    low: 'bg-slate-500/20 border-slate-500/40',
    medium: 'bg-blue-500/20 border-blue-500/40',
    high: 'bg-orange-500/20 border-orange-500/40',
    critical: 'bg-red-500/20 border-red-500/40',
  };
  
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Ambient Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 opacity-30 blur-3xl"
          style={{
            background: 'radial-gradient(40% 40% at 20% 30%, rgba(59,130,246,0.15), transparent 60%), radial-gradient(50% 50% at 80% 70%, rgba(96,165,250,0.2), transparent 65%)'
          }}
        />
      </div>
      
      <div className="relative max-w-[1800px] mx-auto px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-6xl font-extrabold tracking-tight mb-4"
            style={{
              background: 'linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 0 80px rgba(96, 165, 250, 0.5)'
            }}
          >
            Street-Level Deployment Intelligence
          </h1>
          <p className="text-xl text-blue-300/70 mb-6">
            AI-Powered Damage Detection • Satellite Imagery • Homeowner Contact Data • Instant Deployment
          </p>
          
          {/* Filters */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-blue-400" />
              <span className="text-sm text-blue-300">Filters:</span>
            </div>
            <Select value={selectedState} onValueChange={setSelectedState}>
              <SelectTrigger className="w-[200px] bg-slate-800/60 border-blue-500/30" data-testid="select-state-filter">
                <SelectValue placeholder="All States" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All States</SelectItem>
                <SelectItem value="florida">Florida</SelectItem>
                <SelectItem value="alabama">Alabama</SelectItem>
                <SelectItem value="georgia">Georgia</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={selectedCity} onValueChange={setSelectedCity}>
              <SelectTrigger className="w-[200px] bg-slate-800/60 border-blue-500/30" data-testid="select-city-filter">
                <SelectValue placeholder="All Cities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cities</SelectItem>
                <SelectItem value="miami">Miami</SelectItem>
                <SelectItem value="birmingham">Birmingham</SelectItem>
              </SelectContent>
            </Select>
            
            {selectedZone && (
              <Button
                variant="outline"
                onClick={() => setSelectedZone(null)}
                className="border-blue-500/30"
                data-testid="button-clear-zone"
              >
                Clear Zone Filter
              </Button>
            )}
          </div>
        </div>
        
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 bg-slate-900/60 border border-blue-500/30" data-testid="card-total-opportunities">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-blue-300/70">Total Opportunities</span>
              <TrendingUp className="w-5 h-5 text-blue-400" />
            </div>
            <div className="text-4xl font-bold text-blue-400" data-testid="text-total-opportunities">
              {isLoading ? '...' : opportunitiesData?.totalOpportunities || 0}
            </div>
          </Card>
          
          <Card className="p-6 bg-slate-900/60 border border-green-500/30" data-testid="card-total-revenue">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-green-300/70">Est. Revenue</span>
              <DollarSign className="w-5 h-5 text-green-400" />
            </div>
            <div className="text-4xl font-bold text-green-400" data-testid="text-total-revenue">
              ${isLoading ? '...' : zones.reduce((sum, z) => sum + z.totalEstimatedRevenue, 0).toLocaleString()}
            </div>
          </Card>
          
          <Card className="p-6 bg-slate-900/60 border border-purple-500/30" data-testid="card-deployment-zones">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-purple-300/70">Deployment Zones</span>
              <MapPin className="w-5 h-5 text-purple-400" />
            </div>
            <div className="text-4xl font-bold text-purple-400" data-testid="text-deployment-zones">
              {isLoading ? '...' : zones.length}
            </div>
          </Card>
          
          <Card className="p-6 bg-slate-900/60 border border-orange-500/30" data-testid="card-high-priority">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-orange-300/70">High Priority</span>
              <AlertTriangle className="w-5 h-5 text-orange-400" />
            </div>
            <div className="text-4xl font-bold text-orange-400" data-testid="text-high-priority">
              {isLoading ? '...' : opportunities.filter(o => o.contractorIntel.leadPriority === 'critical' || o.contractorIntel.leadPriority === 'high').length}
            </div>
          </Card>
        </div>
        
        {/* Deployment Zones */}
        {!selectedZone && zones.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-blue-300 mb-4 flex items-center gap-2">
              <MapPin className="w-6 h-6" />
              Deployment Zones (State → City → ZIP)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {zones.map((zone) => (
                <Card
                  key={`${zone.state}-${zone.city}`}
                  className="p-5 bg-slate-900/60 border border-blue-500/30 hover:border-blue-400/50 cursor-pointer transition-all"
                  onClick={() => setSelectedZone(zone)}
                  data-testid={`zone-card-${zone.state}-${zone.city}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-bold text-blue-300">{zone.city}, {zone.state}</h3>
                      <p className="text-xs text-blue-300/60">ZIP Codes: {zone.zipCodes.join(', ')}</p>
                    </div>
                    <Navigation className="w-5 h-5 text-blue-400" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-blue-300/70">Opportunities</span>
                      <span className="font-bold text-blue-400">{zone.totalOpportunities}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-blue-300/70">Est. Revenue</span>
                      <span className="font-bold text-green-400">${zone.totalEstimatedRevenue.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-blue-300/70">Avg. Severity</span>
                      <span className="font-bold text-orange-400">{zone.averageSeverity.toFixed(1)}/4</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
        
        {/* Deployment Opportunities List */}
        <div>
          <h2 className="text-2xl font-bold text-blue-300 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6" />
            {selectedZone ? `${selectedZone.city}, ${selectedZone.state} - ` : ''}Street-Level Opportunities
            <span className="text-lg text-blue-300/60">({opportunities.length})</span>
          </h2>
          
          {isLoading ? (
            <div className="text-center py-12 text-blue-300/50">Loading opportunities...</div>
          ) : opportunities.length === 0 ? (
            <div className="text-center py-12 text-blue-300/50">No deployment opportunities found</div>
          ) : (
            <div className="space-y-6">
              {opportunities.map((opp) => (
                <Card
                  key={opp.id}
                  className={`p-6 bg-slate-900/60 border-2 ${priorityColors[opp.contractorIntel.leadPriority]}`}
                  data-testid={`opportunity-card-${opp.id}`}
                >
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Location & Damage Info */}
                    <div className="lg:col-span-2">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-blue-300 mb-1">{opp.location.fullAddress}</h3>
                          <div className="flex items-center gap-4 text-sm text-blue-300/60">
                            <span>{opp.location.city}, {opp.location.state} {opp.location.zip}</span>
                            <span>•</span>
                            <span>{opp.location.coordinates.lat.toFixed(4)}, {opp.location.coordinates.lng.toFixed(4)}</span>
                          </div>
                        </div>
                        <div className={`px-3 py-1 rounded-lg border text-xs font-bold uppercase ${severityColors[opp.damage.severity]}`}>
                          {opp.damage.severity}
                        </div>
                      </div>
                      
                      <p className="text-sm text-blue-300/80 mb-4">{opp.damage.description}</p>
                      
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <span className="text-xs text-blue-300/60">Damage Types</span>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {opp.damage.type.map((type) => (
                              <span key={type} className="px-2 py-1 bg-orange-500/20 border border-orange-500/40 rounded text-xs text-orange-300">
                                {type.replace(/_/g, ' ')}
                              </span>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <span className="text-xs text-blue-300/60">Affected Areas</span>
                          <div className="text-sm text-blue-300/80 mt-1">
                            {opp.damage.affectedAreas.join(', ') || 'Not specified'}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-6 text-sm">
                        <div>
                          <span className="text-blue-300/60">Est. Cost:</span>
                          <span className="ml-2 font-bold text-green-400">
                            ${opp.damage.estimatedCost.min.toLocaleString()} - ${opp.damage.estimatedCost.max.toLocaleString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-blue-300/60">Confidence:</span>
                          <span className="ml-2 font-bold text-blue-400">{opp.damage.confidence}%</span>
                        </div>
                        <div>
                          <span className="text-blue-300/60">Urgency:</span>
                          <span className={`ml-2 font-bold ${urgencyColors[opp.contractorIntel.urgency]}`}>
                            {opp.contractorIntel.urgency.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Homeowner Contact Info */}
                    <div className="border-l border-blue-500/20 pl-6">
                      {opp.propertyOwner ? (
                        <div className="space-y-4">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Users className="w-5 h-5 text-blue-400" />
                              <h4 className="font-bold text-blue-300">Property Owner</h4>
                            </div>
                            <p className="text-lg font-semibold text-white" data-testid={`text-owner-name-${opp.id}`}>
                              {opp.propertyOwner.name}
                            </p>
                          </div>
                          
                          <div>
                            <div className="flex items-center gap-2 text-sm text-blue-300/70 mb-1">
                              <Phone className="w-4 h-4" />
                              <span>Phone</span>
                            </div>
                            <a href={`tel:${opp.propertyOwner.phone}`} 
                               className="text-blue-400 hover:text-blue-300 font-mono"
                               data-testid={`link-owner-phone-${opp.id}`}>
                              {opp.propertyOwner.phone}
                            </a>
                          </div>
                          
                          <div>
                            <div className="flex items-center gap-2 text-sm text-blue-300/70 mb-1">
                              <Mail className="w-4 h-4" />
                              <span>Email</span>
                            </div>
                            <a href={`mailto:${opp.propertyOwner.email}`} 
                               className="text-blue-400 hover:text-blue-300 text-sm"
                               data-testid={`link-owner-email-${opp.id}`}>
                              {opp.propertyOwner.email}
                            </a>
                          </div>
                          
                          {opp.propertyOwner.insuranceCompany && (
                            <div>
                              <div className="flex items-center gap-2 text-sm text-blue-300/70 mb-1">
                                <Building className="w-4 h-4" />
                                <span>Insurance</span>
                              </div>
                              <p className="text-sm text-white">{opp.propertyOwner.insuranceCompany}</p>
                              {opp.propertyOwner.claimNumber && (
                                <p className="text-xs text-blue-300/60 mt-1">Claim: {opp.propertyOwner.claimNumber}</p>
                              )}
                            </div>
                          )}
                          
                          <div className="pt-4 border-t border-blue-500/20">
                            <div className="text-xs text-blue-300/60 mb-2">Contractor Intel</div>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-blue-300/70">Profitability</span>
                                <span className="font-bold text-green-400">{opp.contractorIntel.profitabilityScore}/10</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-blue-300/70">Response Time</span>
                                <span className="font-bold text-blue-400">{opp.contractorIntel.estimatedResponseTime}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-blue-300/70">Competition</span>
                                <span className="font-bold text-orange-400 capitalize">{opp.contractorIntel.competitionLevel}</span>
                              </div>
                            </div>
                            <div className="mt-3">
                              <div className="text-xs text-blue-300/60 mb-1">Needed</div>
                              <div className="flex flex-wrap gap-1">
                                {opp.contractorIntel.contractorTypesNeeded.map((type) => (
                                  <span key={type} className="px-2 py-0.5 bg-blue-500/20 border border-blue-500/40 rounded text-xs text-blue-300">
                                    {type}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-blue-300/50">
                          <Users className="w-12 h-12 mx-auto mb-2 opacity-30" />
                          <p className="text-sm">Property owner data unavailable</p>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <ModuleAIAssistant 
        moduleName="Deployment Intelligence"
        moduleContext="Street-level damage detection with satellite imagery, AI damage analysis, and homeowner contact information for contractor deployment"
      />
    </div>
  );
}
