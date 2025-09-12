import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AlertTriangle, 
  MapPin, 
  Filter, 
  Layers, 
  TrendingUp, 
  DollarSign, 
  Calendar, 
  Shield,
  Eye,
  EyeOff
} from 'lucide-react';

interface StormHotZone {
  id: string;
  state: string;
  stateCode: string;
  countyParish: string;
  countyFips?: string;
  stormTypes: string;
  riskLevel: string;
  riskScore: number;
  femaDisasterIds?: string[];
  majorStorms?: Array<{
    name: string;
    year: number;
    category: string;
  }>;
  notes?: string;
  primaryCities?: string;
  latitude?: number;
  longitude?: number;
  avgClaimAmount?: number;
  marketPotential?: string;
  seasonalPeak?: string;
  dataSource: string;
  lastUpdated: string;
  isActive: boolean;
  createdAt: string;
}

interface HeatmapProps {
  mapInstance: any; // Leaflet map instance
  selectedState?: string;
  onZoneSelect?: (zone: StormHotZone) => void;
  className?: string;
}

type VisualizationMode = 'risk' | 'claims' | 'recent' | 'market';

declare global {
  interface Window {
    L: any;
  }
}

export function StormHeatmap({ mapInstance, selectedState, onZoneSelect, className = '' }: HeatmapProps) {
  const [visualizationMode, setVisualizationMode] = useState<VisualizationMode>('risk');
  const [selectedZone, setSelectedZone] = useState<StormHotZone | null>(null);
  const [isHeatmapVisible, setIsHeatmapVisible] = useState(true);
  const [opacity, setOpacity] = useState(0.7);
  const [selectedRiskLevels, setSelectedRiskLevels] = useState<string[]>(['Very High', 'High', 'Moderate']);
  
  const heatmapLayersRef = useRef<any[]>([]);
  const zoneMarkersRef = useRef<any[]>([]);

  // Fetch storm hot zones data
  const { data: zonesData, isLoading } = useQuery<{ zones: StormHotZone[]; stats: any }>({
    queryKey: ['/api/storm-hot-zones', { state: selectedState }],
    refetchInterval: 300000, // Refresh every 5 minutes
  });

  // Risk level color mapping
  const getRiskColor = (riskLevel: string): string => {
    switch (riskLevel.toLowerCase()) {
      case 'very high': return '#dc2626'; // Red
      case 'high': return '#ea580c'; // Orange  
      case 'moderate': return '#d97706'; // Yellow-orange
      case 'moderate-high': return '#f59e0b'; // Yellow
      case 'low': return '#65a30d'; // Green
      default: return '#6b7280'; // Gray
    }
  };

  // Get visualization data based on mode
  const getVisualizationData = (zone: StormHotZone) => {
    switch (visualizationMode) {
      case 'risk':
        return {
          value: zone.riskScore,
          color: getRiskColor(zone.riskLevel),
          intensity: zone.riskScore / 100,
          label: zone.riskLevel,
          subtitle: `Risk Score: ${zone.riskScore}`
        };
      case 'claims':
        return {
          value: zone.avgClaimAmount || 0,
          color: getClaimAmountColor(zone.avgClaimAmount || 0),
          intensity: Math.min((zone.avgClaimAmount || 0) / 100000, 1),
          label: `$${((zone.avgClaimAmount || 0) / 1000).toFixed(0)}K`,
          subtitle: 'Average Claim Amount'
        };
      case 'recent':
        const recentStorms = zone.majorStorms?.filter(s => s.year >= 2020) || [];
        return {
          value: recentStorms.length,
          color: getRecentActivityColor(recentStorms.length),
          intensity: Math.min(recentStorms.length / 3, 1),
          label: `${recentStorms.length} Recent`,
          subtitle: 'Major Storms (2020+)'
        };
      case 'market':
        return {
          value: getMarketScore(zone.marketPotential || 'Unknown'),
          color: getMarketPotentialColor(zone.marketPotential || 'Unknown'),
          intensity: getMarketScore(zone.marketPotential || 'Unknown') / 100,
          label: zone.marketPotential || 'Unknown',
          subtitle: 'Market Potential'
        };
      default:
        return {
          value: zone.riskScore,
          color: getRiskColor(zone.riskLevel),
          intensity: zone.riskScore / 100,
          label: zone.riskLevel,
          subtitle: `Risk Score: ${zone.riskScore}`
        };
    }
  };

  const getClaimAmountColor = (amount: number): string => {
    if (amount >= 80000) return '#dc2626'; // Red
    if (amount >= 60000) return '#ea580c'; // Orange
    if (amount >= 40000) return '#f59e0b'; // Yellow
    if (amount >= 20000) return '#84cc16'; // Light green
    return '#22c55e'; // Green
  };

  const getRecentActivityColor = (count: number): string => {
    if (count >= 3) return '#dc2626'; // Red
    if (count >= 2) return '#ea580c'; // Orange
    if (count >= 1) return '#f59e0b'; // Yellow
    return '#6b7280'; // Gray
  };

  const getMarketPotentialColor = (potential: string): string => {
    switch (potential.toLowerCase()) {
      case 'high': return '#dc2626'; // Red
      case 'medium': return '#f59e0b'; // Yellow
      case 'low': return '#84cc16'; // Light green
      default: return '#6b7280'; // Gray
    }
  };

  const getMarketScore = (potential: string): number => {
    switch (potential.toLowerCase()) {
      case 'high': return 90;
      case 'medium': return 60;
      case 'low': return 30;
      default: return 0;
    }
  };

  // Create county polygon from bounds (simplified approach)
  const createCountyPolygon = (zone: StormHotZone, visualData: any) => {
    if (!zone.latitude || !zone.longitude || !window.L) return null;

    // Create a circle representing the county area (radius based on risk/value)
    const radius = Math.max(15000 + (visualData.intensity * 25000), 8000); // 8-40km radius
    
    const circle = window.L.circle([zone.latitude, zone.longitude], {
      radius: radius,
      fillColor: visualData.color,
      color: visualData.color,
      weight: 2,
      opacity: 0.8,
      fillOpacity: opacity * visualData.intensity,
      className: 'storm-heatmap-zone'
    });

    // Add popup with zone details
    const popupContent = createZonePopup(zone, visualData);
    circle.bindPopup(popupContent, {
      maxWidth: 400,
      className: 'storm-heatmap-popup'
    });

    // Add click handler
    circle.on('click', () => {
      setSelectedZone(zone);
      onZoneSelect?.(zone);
    });

    return circle;
  };

  // Create detailed popup content
  const createZonePopup = (zone: StormHotZone, visualData: any): string => {
    const recentStorms = zone.majorStorms?.filter(s => s.year >= 2020) || [];
    const femaCount = zone.femaDisasterIds?.length || 0;
    
    return `
      <div class="p-4 min-w-80">
        <div class="flex items-center justify-between mb-3">
          <h3 class="font-bold text-lg text-gray-900">${zone.countyParish}</h3>
          <span class="px-2 py-1 rounded text-xs font-medium" style="background-color: ${visualData.color}20; color: ${visualData.color}">
            ${visualData.label}
          </span>
        </div>
        
        <div class="space-y-2 text-sm">
          <div class="flex justify-between">
            <span class="text-gray-600">State:</span>
            <span class="font-medium">${zone.state} (${zone.stateCode})</span>
          </div>
          
          <div class="flex justify-between">
            <span class="text-gray-600">Risk Level:</span>
            <span class="font-medium text-${getRiskColor(zone.riskLevel)}">${zone.riskLevel}</span>
          </div>
          
          <div class="flex justify-between">
            <span class="text-gray-600">Risk Score:</span>
            <span class="font-medium">${zone.riskScore}/100</span>
          </div>
          
          ${zone.avgClaimAmount ? `
          <div class="flex justify-between">
            <span class="text-gray-600">Avg Claim:</span>
            <span class="font-medium">$${(zone.avgClaimAmount / 1000).toFixed(0)}K</span>
          </div>
          ` : ''}
          
          <div class="flex justify-between">
            <span class="text-gray-600">Storm Types:</span>
            <span class="font-medium">${zone.stormTypes}</span>
          </div>
          
          <div class="flex justify-between">
            <span class="text-gray-600">FEMA Disasters:</span>
            <span class="font-medium">${femaCount} recorded</span>
          </div>
          
          ${recentStorms.length > 0 ? `
          <div class="mt-3 pt-3 border-t border-gray-200">
            <div class="text-gray-600 text-xs mb-2">Recent Major Storms (2020+):</div>
            ${recentStorms.map(storm => `
              <div class="text-xs text-gray-700">
                • ${storm.name} (${storm.year}) - ${storm.category}
              </div>
            `).join('')}
          </div>
          ` : ''}
          
          ${zone.primaryCities ? `
          <div class="mt-3 pt-3 border-t border-gray-200">
            <div class="text-gray-600 text-xs">Major Cities:</div>
            <div class="text-xs text-gray-700">${zone.primaryCities}</div>
          </div>
          ` : ''}
          
          ${zone.notes ? `
          <div class="mt-3 pt-3 border-t border-gray-200">
            <div class="text-xs text-gray-600">${zone.notes}</div>
          </div>
          ` : ''}
        </div>
      </div>
    `;
  };

  // Update heatmap layers when data or settings change
  useEffect(() => {
    if (!mapInstance || !zonesData?.zones || !window.L) return;

    // Clear existing layers
    heatmapLayersRef.current.forEach(layer => {
      if (mapInstance.hasLayer(layer)) {
        mapInstance.removeLayer(layer);
      }
    });
    heatmapLayersRef.current = [];

    zoneMarkersRef.current.forEach(marker => {
      if (mapInstance.hasLayer(marker)) {
        mapInstance.removeLayer(marker);
      }
    });
    zoneMarkersRef.current = [];

    if (!isHeatmapVisible) return;

    // Filter zones based on selected criteria
    const filteredZones = zonesData.zones.filter(zone => {
      // Filter by state if specified
      if (selectedState && zone.stateCode !== selectedState) return false;
      
      // Filter by selected risk levels
      if (!selectedRiskLevels.includes(zone.riskLevel)) return false;
      
      // Only show zones with coordinates
      if (!zone.latitude || !zone.longitude) return false;
      
      return true;
    });

    console.log(`🗺️ Rendering ${filteredZones.length} storm hot zones on heatmap`);

    // Create visualization layers
    filteredZones.forEach(zone => {
      const visualData = getVisualizationData(zone);
      
      // Create county polygon/circle
      const polygon = createCountyPolygon(zone, visualData);
      if (polygon) {
        polygon.addTo(mapInstance);
        heatmapLayersRef.current.push(polygon);
      }

      // Create center marker for precise location
      const marker = window.L.circleMarker([zone.latitude!, zone.longitude!], {
        radius: 6,
        fillColor: visualData.color,
        color: '#ffffff',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.9,
        className: 'storm-heatmap-marker'
      });

      // Add marker popup and click handler
      marker.bindTooltip(`${zone.countyParish} - ${visualData.label}`, {
        direction: 'top',
        offset: [0, -10],
        className: 'storm-heatmap-tooltip'
      });

      marker.on('click', () => {
        setSelectedZone(zone);
        onZoneSelect?.(zone);
      });

      marker.addTo(mapInstance);
      zoneMarkersRef.current.push(marker);
    });

  }, [mapInstance, zonesData, selectedState, visualizationMode, isHeatmapVisible, opacity, selectedRiskLevels]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      heatmapLayersRef.current.forEach(layer => {
        if (mapInstance && mapInstance.hasLayer(layer)) {
          mapInstance.removeLayer(layer);
        }
      });
      zoneMarkersRef.current.forEach(marker => {
        if (mapInstance && mapInstance.hasLayer(marker)) {
          mapInstance.removeLayer(marker);
        }
      });
    };
  }, [mapInstance]);

  if (isLoading) {
    return (
      <Card className={`w-80 ${className}`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center space-x-2">
            <Layers className="w-5 h-5" />
            <span>Storm Heatmap</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const zones = zonesData?.zones || [];
  const stats = zonesData?.stats;

  return (
    <Card className={`w-80 ${className}`} data-testid="storm-heatmap-controls">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center space-x-2">
            <Layers className="w-5 h-5" />
            <span>Storm Heatmap</span>
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsHeatmapVisible(!isHeatmapVisible)}
            data-testid="toggle-heatmap-visibility"
          >
            {isHeatmapVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Visualization Mode Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Visualization Mode</label>
          <Tabs value={visualizationMode} onValueChange={(value) => setVisualizationMode(value as VisualizationMode)}>
            <TabsList className="grid w-full grid-cols-2 grid-rows-2 h-20">
              <TabsTrigger value="risk" className="flex flex-col items-center py-2" data-testid="tab-risk">
                <Shield className="w-4 h-4 mb-1" />
                <span className="text-xs">Risk</span>
              </TabsTrigger>
              <TabsTrigger value="claims" className="flex flex-col items-center py-2" data-testid="tab-claims">
                <DollarSign className="w-4 h-4 mb-1" />
                <span className="text-xs">Claims</span>
              </TabsTrigger>
              <TabsTrigger value="recent" className="flex flex-col items-center py-2" data-testid="tab-recent">
                <Calendar className="w-4 h-4 mb-1" />
                <span className="text-xs">Recent</span>
              </TabsTrigger>
              <TabsTrigger value="market" className="flex flex-col items-center py-2" data-testid="tab-market">
                <TrendingUp className="w-4 h-4 mb-1" />
                <span className="text-xs">Market</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Risk Level Filters */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Risk Levels</label>
          <div className="flex flex-wrap gap-2">
            {['Very High', 'High', 'Moderate', 'Low'].map(level => (
              <Button
                key={level}
                variant={selectedRiskLevels.includes(level) ? "default" : "outline"}
                size="sm"
                className="text-xs"
                style={{
                  backgroundColor: selectedRiskLevels.includes(level) ? getRiskColor(level) : undefined,
                  borderColor: getRiskColor(level),
                  color: selectedRiskLevels.includes(level) ? 'white' : getRiskColor(level)
                }}
                onClick={() => {
                  setSelectedRiskLevels(prev => 
                    prev.includes(level) 
                      ? prev.filter(l => l !== level)
                      : [...prev, level]
                  );
                }}
                data-testid={`filter-${level.toLowerCase().replace(' ', '-')}`}
              >
                {level}
              </Button>
            ))}
          </div>
        </div>

        {/* Opacity Control */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Opacity: {Math.round(opacity * 100)}%
          </label>
          <input
            type="range"
            min="0.1"
            max="1"
            step="0.1"
            value={opacity}
            onChange={(e) => setOpacity(parseFloat(e.target.value))}
            className="w-full"
            data-testid="opacity-slider"
          />
        </div>

        {/* Statistics */}
        {stats && (
          <div className="pt-3 border-t border-gray-200">
            <div className="text-sm font-medium text-gray-700 mb-2">Dataset Statistics</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-gray-50 p-2 rounded">
                <div className="font-medium">Total Zones</div>
                <div className="text-gray-600">{stats.totalZones}</div>
              </div>
              <div className="bg-red-50 p-2 rounded">
                <div className="font-medium">Very High Risk</div>
                <div className="text-red-600">{stats.veryHighRisk}</div>
              </div>
              <div className="bg-orange-50 p-2 rounded">
                <div className="font-medium">High Risk</div>
                <div className="text-orange-600">{stats.highRisk}</div>
              </div>
              <div className="bg-yellow-50 p-2 rounded">
                <div className="font-medium">Avg Claim</div>
                <div className="text-yellow-600">${Math.round(stats.avgClaimAmount / 1000)}K</div>
              </div>
            </div>
          </div>
        )}

        {/* Selected Zone Details */}
        {selectedZone && (
          <div className="pt-3 border-t border-gray-200">
            <div className="text-sm font-medium text-gray-700 mb-2 flex items-center">
              <MapPin className="w-4 h-4 mr-1" />
              Selected Zone
            </div>
            <div className="bg-gray-50 p-3 rounded space-y-2">
              <div className="font-medium">{selectedZone.countyParish}</div>
              <div className="text-sm text-gray-600">{selectedZone.state}</div>
              <div className="flex items-center space-x-2">
                <span 
                  style={{ backgroundColor: getRiskColor(selectedZone.riskLevel) }}
                  className="px-2 py-1 rounded text-xs font-medium text-white"
                >
                  {selectedZone.riskLevel}
                </span>
                <span className="text-xs text-gray-500">Score: {selectedZone.riskScore}</span>
              </div>
              {selectedZone.avgClaimAmount && (
                <div className="text-sm">
                  <span className="text-gray-600">Avg Claim:</span>
                  <span className="font-medium ml-1">${(selectedZone.avgClaimAmount / 1000).toFixed(0)}K</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="pt-3 border-t border-gray-200">
          <div className="text-sm font-medium text-gray-700 mb-2">Legend</div>
          <div className="space-y-1">
            {visualizationMode === 'risk' && (
              <>
                <div className="flex items-center space-x-2 text-xs">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: '#dc2626' }}></div>
                  <span>Very High Risk (80-100)</span>
                </div>
                <div className="flex items-center space-x-2 text-xs">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: '#ea580c' }}></div>
                  <span>High Risk (60-79)</span>
                </div>
                <div className="flex items-center space-x-2 text-xs">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: '#f59e0b' }}></div>
                  <span>Moderate Risk (40-59)</span>
                </div>
              </>
            )}
            
            {visualizationMode === 'claims' && (
              <>
                <div className="flex items-center space-x-2 text-xs">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: '#dc2626' }}></div>
                  <span>$80K+ Average Claims</span>
                </div>
                <div className="flex items-center space-x-2 text-xs">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: '#ea580c' }}></div>
                  <span>$60K-$80K Average Claims</span>
                </div>
                <div className="flex items-center space-x-2 text-xs">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: '#f59e0b' }}></div>
                  <span>$40K-$60K Average Claims</span>
                </div>
              </>
            )}
            
            {visualizationMode === 'recent' && (
              <>
                <div className="flex items-center space-x-2 text-xs">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: '#dc2626' }}></div>
                  <span>3+ Recent Major Storms</span>
                </div>
                <div className="flex items-center space-x-2 text-xs">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: '#ea580c' }}></div>
                  <span>2 Recent Major Storms</span>
                </div>
                <div className="flex items-center space-x-2 text-xs">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: '#f59e0b' }}></div>
                  <span>1 Recent Major Storm</span>
                </div>
              </>
            )}
            
            {visualizationMode === 'market' && (
              <>
                <div className="flex items-center space-x-2 text-xs">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: '#dc2626' }}></div>
                  <span>High Market Potential</span>
                </div>
                <div className="flex items-center space-x-2 text-xs">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: '#f59e0b' }}></div>
                  <span>Medium Market Potential</span>
                </div>
                <div className="flex items-center space-x-2 text-xs">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: '#84cc16' }}></div>
                  <span>Low Market Potential</span>
                </div>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}