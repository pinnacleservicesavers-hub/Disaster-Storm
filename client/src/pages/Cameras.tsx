import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, Camera, AlertTriangle, DollarSign, Bell, Heart, Eye } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { TrafficCameraMap } from '@/components/TrafficCameraMap';
import { CameraViewer } from '@/components/CameraViewer';
import type { ContractorWatchlist, InsertContractorWatchlist } from '@shared/schema';

interface CameraDirectory {
  directory: Array<{
    state: string;
    name: string;
    cameraCount: number;
    incidentCount: number;
    contractorOpportunities: number;
    counties: string[];
    provider: string;
  }>;
  totalStates: number;
  totalCameras: number;
  totalIncidents: number;
  contractorOpportunities: number;
  timestamp: string;
}

interface ContractorOpportunity {
  id: string;
  type: string;
  description: string;
  lat: number;
  lng: number;
  severity: 'critical' | 'severe' | 'moderate' | 'minor';
  startTime: string;
  affectedRoutes: string[];
  jurisdiction: {
    state: string;
    jurisdiction: string;
    provider: string;
  };
  isContractorOpportunity: boolean;
  estimatedValue: number;
}

interface OpportunitiesResponse {
  opportunities: ContractorOpportunity[];
  count: number;
  totalEstimatedRevenue: number;
  breakdown: {
    bySeverity: Array<{ severity: string; count: number }>;
    byType: Array<{ type: string; count: number }>;
  };
  filters: Record<string, any>;
  timestamp: string;
}

export function TrafficCameras() {
  const [selectedState, setSelectedState] = useState<string>('');
  const [selectedCounty, setSelectedCounty] = useState<string>('');
  const [alertsOnly, setAlertsOnly] = useState(false);
  const [viewerCameraId, setViewerCameraId] = useState<string | null>(null);
  
  // For now, using a hardcoded contractor ID since there's no authentication system
  const contractorId = 'contractor-demo-001';
  const queryClient = useQueryClient();

  // Fetch directory
  const { data: directory, isLoading: directoryLoading } = useQuery<CameraDirectory>({
    queryKey: ['/api/511/directory'],
  });

  // Fetch contractor opportunities
  const { data: opportunities, isLoading: opportunitiesLoading } = useQuery<OpportunitiesResponse>({
    queryKey: ['/api/511/contractor-opportunities'],
  });

  // Fetch contractor watchlist
  const { data: watchlistData, isLoading: watchlistLoading } = useQuery<{watchlist: ContractorWatchlist[], contractorId: string, count: number}>({
    queryKey: ['/api/contractor/watchlist', contractorId],
    enabled: !!contractorId,
  });
  
  const watchlist = watchlistData?.watchlist || [];

  const selectedStateData = directory?.directory.find(d => d.state === selectedState);

  // Add to watchlist mutation
  const addWatchlistMutation = useMutation({
    mutationFn: async (data: InsertContractorWatchlist) => {
      return apiRequest('/api/contractor/watchlist', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/contractor/watchlist', contractorId] });
      console.log('Successfully added to watchlist');
    },
    onError: (error) => {
      console.error('Error adding to watchlist:', error);
    },
  });

  // Remove from watchlist mutation
  const removeWatchlistMutation = useMutation({
    mutationFn: async ({ contractorId, itemType, itemId }: { contractorId: string, itemType: string, itemId: string }) => {
      return apiRequest(`/api/contractor/${contractorId}/watchlist/${itemType}/${itemId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/contractor/watchlist', contractorId] });
      console.log('Successfully removed from watchlist');
    },
    onError: (error) => {
      console.error('Error removing from watchlist:', error);
    },
  });

  const addToWatchlist = (state: string, stateName: string) => {
    const watchlistItem: InsertContractorWatchlist = {
      contractorId,
      itemType: 'state',
      itemId: state,
      displayName: `${stateName} Traffic Cameras`,
      state,
      county: null,
      alertsEnabled: true,
      metadata: null,
    };
    addWatchlistMutation.mutate(watchlistItem);
  };

  const removeFromWatchlist = (state: string) => {
    removeWatchlistMutation.mutate({
      contractorId,
      itemType: 'state',
      itemId: state,
    });
  };
  
  const isInWatchlist = (state: string) => {
    return watchlist.some(item => item.itemType === 'state' && item.itemId === state);
  };

  if (directoryLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center space-x-2">
            <Camera className="h-8 w-8 text-blue-600" />
            <div>
              <div className="text-2xl font-bold">{directory?.totalCameras}</div>
              <div className="text-sm text-gray-600">Total Cameras</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 flex items-center space-x-2">
            <MapPin className="h-8 w-8 text-green-600" />
            <div>
              <div className="text-2xl font-bold">{directory?.totalStates}</div>
              <div className="text-sm text-gray-600">States Covered</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 flex items-center space-x-2">
            <AlertTriangle className="h-8 w-8 text-orange-600" />
            <div>
              <div className="text-2xl font-bold">{directory?.contractorOpportunities}</div>
              <div className="text-sm text-gray-600">Active Opportunities</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 flex items-center space-x-2">
            <DollarSign className="h-8 w-8 text-green-600" />
            <div>
              <div className="text-2xl font-bold">${opportunities?.totalEstimatedRevenue?.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Estimated Revenue</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="browse" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="browse" data-testid="tab-browse">Browse Cameras</TabsTrigger>
          <TabsTrigger value="map" data-testid="tab-map">Map View</TabsTrigger>
          <TabsTrigger value="opportunities" data-testid="tab-opportunities">Opportunities</TabsTrigger>
          <TabsTrigger value="watchlist" data-testid="tab-watchlist">Watchlist</TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-4 items-center">
            <Select value={selectedState} onValueChange={setSelectedState}>
              <SelectTrigger className="w-48" data-testid="select-state">
                <SelectValue placeholder="Select State" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All States</SelectItem>
                {directory?.directory.map(state => (
                  <SelectItem key={state.state} value={state.state}>
                    {state.name} ({state.cameraCount} cameras)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedStateData && (
              <Select value={selectedCounty} onValueChange={setSelectedCounty}>
                <SelectTrigger className="w-48" data-testid="select-county">
                  <SelectValue placeholder="Select County" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Counties</SelectItem>
                  {selectedStateData.counties.map(county => (
                    <SelectItem key={county} value={county}>
                      {county}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <Button
              variant={alertsOnly ? "default" : "outline"}
              onClick={() => setAlertsOnly(!alertsOnly)}
              data-testid="button-alerts-only"
            >
              <Bell className="h-4 w-4 mr-2" />
              {alertsOnly ? 'All Cameras' : 'Alerts Only'}
            </Button>
          </div>

          {/* State Directory Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {directory?.directory
              .filter(state => !selectedState || selectedState === 'all' || state.state === selectedState)
              .filter(state => !alertsOnly || state.contractorOpportunities > 0)
              .map(state => (
                <Card key={state.state} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{state.name}</CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => 
                          isInWatchlist(state.state)
                            ? removeFromWatchlist(state.state)
                            : addToWatchlist(state.state, state.name)
                        }
                        disabled={addWatchlistMutation.isPending || removeWatchlistMutation.isPending}
                        data-testid={`button-watchlist-${state.state}`}
                      >
                        <Heart 
                          className={`h-4 w-4 ${
                            isInWatchlist(state.state) 
                              ? 'fill-red-500 text-red-500' 
                              : 'text-gray-400'
                          }`} 
                        />
                      </Button>
                    </div>
                    <div className="text-sm text-gray-600">{state.provider}</div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center">
                        <Camera className="h-4 w-4 mr-1" />
                        {state.cameraCount} cameras
                      </span>
                      <span className="flex items-center">
                        <AlertTriangle className="h-4 w-4 mr-1" />
                        {state.incidentCount} incidents
                      </span>
                    </div>
                    
                    {state.contractorOpportunities > 0 && (
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          <strong>{state.contractorOpportunities} contractor opportunities</strong> available
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className="flex flex-wrap gap-1">
                      {state.counties.slice(0, 6).map(county => (
                        <Badge key={county} variant="secondary" className="text-xs">
                          {county}
                        </Badge>
                      ))}
                      {state.counties.length > 6 && (
                        <Badge variant="outline" className="text-xs">
                          +{state.counties.length - 6} more
                        </Badge>
                      )}
                    </div>

                    <Button 
                      className="w-full" 
                      size="sm"
                      onClick={() => setSelectedState(state.state)}
                      data-testid={`button-view-cameras-${state.state}`}
                    >
                      View Cameras
                    </Button>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="map" className="space-y-4">
          <div className="h-[600px] rounded-lg border">
            <TrafficCameraMap 
              selectedState={selectedState}
              selectedCounty={selectedCounty}
              alertsOnly={alertsOnly}
            />
          </div>
        </TabsContent>

        <TabsContent value="opportunities" className="space-y-4">
          {opportunitiesLoading ? (
            <div className="text-center py-8">Loading opportunities...</div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold">
                  {opportunities?.count} Active Opportunities
                </h3>
                <div className="text-lg font-bold text-green-600">
                  Total Value: ${opportunities?.totalEstimatedRevenue?.toLocaleString()}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {opportunities?.opportunities.map(opp => (
                  <Card key={opp.id} className="border-l-4 border-l-orange-500">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-base">{opp.type.replace('_', ' ').toUpperCase()}</CardTitle>
                        <Badge variant={
                          opp.severity === 'critical' ? 'destructive' :
                          opp.severity === 'severe' ? 'default' : 'secondary'
                        }>
                          {opp.severity}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm">{opp.description}</p>
                      <div className="text-sm text-gray-600">
                        <div>📍 {opp.lat.toFixed(4)}, {opp.lng.toFixed(4)}</div>
                        <div>🛣️ {opp.affectedRoutes.join(', ')}</div>
                        <div>🏛️ {opp.jurisdiction.provider}</div>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="text-lg font-bold text-green-600">
                          ${opp.estimatedValue.toLocaleString()}
                        </div>
                        <Button size="sm" data-testid={`button-view-opportunity-${opp.id}`}>
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="watchlist" className="space-y-4">
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Your Watchlist</h3>
            {watchlist.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No regions in your watchlist. Add states by clicking the heart icon.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {watchlist.map(watchlistItem => {
                  const stateData = directory?.directory.find(d => d.state === watchlistItem.state);
                  return stateData ? (
                    <Card key={watchlistItem.id}>
                      <CardHeader>
                        <div className="flex justify-between items-center">
                          <CardTitle>{stateData.name}</CardTitle>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFromWatchlist(watchlistItem.state)}
                            data-testid={`button-remove-watchlist-${watchlistItem.state}`}
                          >
                            <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-sm space-y-1">
                          <div>{stateData.cameraCount} cameras active</div>
                          <div>{stateData.contractorOpportunities} opportunities available</div>
                        </div>
                      </CardContent>
                    </Card>
                  ) : null;
                })}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Camera Viewer Modal */}
      <CameraViewer 
        cameraId={viewerCameraId}
        onClose={() => setViewerCameraId(null)}
        enableDamageDetection={true}
        autoRefresh={true}
        refreshInterval={30000}
      />
    </div>
  );
}