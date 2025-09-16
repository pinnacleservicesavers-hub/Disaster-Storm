import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, Camera, AlertTriangle, DollarSign, Bell, Heart, Eye, Activity, Monitor } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { MapView } from '@/components/MapView';
import { CameraViewer } from '@/components/CameraViewer';
import { FadeIn, CountUp, StaggerContainer, StaggerItem, HoverLift } from '@/components/ui/animations';
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900 p-6">
        <FadeIn>
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-8">
              <motion.div
                className="relative inline-block"
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              >
                <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full mx-auto mb-4"></div>
                <motion.div
                  className="absolute inset-0 w-16 h-16 border-4 border-transparent border-r-green-400 rounded-full mx-auto"
                  animate={{ rotate: -360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                />
              </motion.div>
              <motion.h2
                className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                📹 Connecting to Traffic Camera Network...
              </motion.h2>
              <p className="mt-2 text-gray-600 dark:text-gray-400">Scanning live feeds across multiple states</p>
            </div>
            <StaggerContainer className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <StaggerItem key={i}>
                  <div className="h-32 bg-gradient-to-br from-white to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-lg animate-pulse">
                    <div className="p-4 space-y-3">
                      <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
                      <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
                      <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-5/6"></div>
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </FadeIn>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Enhanced Header */}
        <FadeIn>
          <div className="text-center mb-8">
            <motion.h1
              className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-green-600 to-indigo-600 bg-clip-text text-transparent mb-4"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              📹 Traffic Camera Network
            </motion.h1>
            <motion.p
              className="text-lg text-slate-600 dark:text-slate-300 font-medium"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Real-time monitoring • Live incident detection • Contractor opportunities
            </motion.p>
          </div>
        </FadeIn>

        {/* Enhanced Header Stats */}
        <FadeIn delay={0.4}>
          <StaggerContainer className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <StaggerItem>
              <HoverLift>
                <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800 hover:shadow-xl transition-all duration-300" data-testid="card-total-cameras">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <motion.div
                        className="p-3 bg-blue-500 rounded-xl text-white"
                        animate={{ 
                          scale: [1, 1.1, 1],
                          rotate: [0, 5, -5, 0]
                        }}
                        transition={{ duration: 3, repeat: Infinity }}
                      >
                        <Camera className="h-8 w-8" />
                      </motion.div>
                      <div>
                        <div className="text-3xl font-bold text-blue-800 dark:text-blue-200" data-testid="text-total-cameras">
                          <CountUp end={directory?.totalCameras || 0} />
                        </div>
                        <div className="text-sm font-medium text-blue-600 dark:text-blue-400">
                          📹 Live Cameras
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </HoverLift>
            </StaggerItem>
        
            <StaggerItem>
              <HoverLift>
                <Card className="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800 hover:shadow-xl transition-all duration-300" data-testid="card-states-covered">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <motion.div
                        className="p-3 bg-green-500 rounded-xl text-white"
                        animate={{ 
                          y: [0, -3, 0],
                          scale: [1, 1.05, 1]
                        }}
                        transition={{ duration: 2.5, repeat: Infinity }}
                      >
                        <MapPin className="h-8 w-8" />
                      </motion.div>
                      <div>
                        <div className="text-3xl font-bold text-green-800 dark:text-green-200" data-testid="text-total-states">
                          <CountUp end={directory?.totalStates || 0} />
                        </div>
                        <div className="text-sm font-medium text-green-600 dark:text-green-400">
                          🗺️ States Covered
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </HoverLift>
            </StaggerItem>
        
            <StaggerItem>
              <HoverLift>
                <Card className="bg-gradient-to-br from-orange-50 to-red-100 dark:from-orange-900/20 dark:to-red-900/20 border-orange-200 dark:border-orange-800 hover:shadow-xl transition-all duration-300" data-testid="card-active-opportunities">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <motion.div
                        className="p-3 bg-orange-500 rounded-xl text-white relative"
                        animate={{ 
                          scale: [1, 1.1, 1],
                          opacity: [1, 0.8, 1]
                        }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        <AlertTriangle className="h-8 w-8" />
                        {(directory?.contractorOpportunities || 0) > 0 && (
                          <motion.div
                            className="absolute -top-1 -right-1 w-3 h-3 bg-red-400 rounded-full"
                            animate={{ scale: [1, 1.3, 1] }}
                            transition={{ duration: 1, repeat: Infinity }}
                          />
                        )}
                      </motion.div>
                      <div>
                        <div className="text-3xl font-bold text-orange-800 dark:text-orange-200" data-testid="text-contractor-opportunities">
                          <CountUp end={directory?.contractorOpportunities || 0} />
                        </div>
                        <div className="text-sm font-medium text-orange-600 dark:text-orange-400">
                          ⚠️ Active Opportunities
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </HoverLift>
            </StaggerItem>
        
            <StaggerItem>
              <HoverLift>
                <Card className="bg-gradient-to-br from-purple-50 to-indigo-100 dark:from-purple-900/20 dark:to-indigo-900/20 border-purple-200 dark:border-purple-800 hover:shadow-xl transition-all duration-300" data-testid="card-estimated-revenue">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <motion.div
                        className="p-3 bg-purple-500 rounded-xl text-white"
                        animate={{ 
                          y: [0, -5, 0],
                          rotate: [0, 15, 0]
                        }}
                        transition={{ duration: 2.5, repeat: Infinity }}
                      >
                        <DollarSign className="h-8 w-8" />
                      </motion.div>
                      <div>
                        <div className="text-3xl font-bold text-purple-800 dark:text-purple-200" data-testid="text-estimated-revenue">
                          ${(opportunities?.totalEstimatedRevenue || 0).toLocaleString()}
                        </div>
                        <div className="text-sm font-medium text-purple-600 dark:text-purple-400">
                          💰 Revenue Potential
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </HoverLift>
            </StaggerItem>
          </StaggerContainer>
        </FadeIn>

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
            <MapView 
              selectedState={selectedState}
              selectedCounty={selectedCounty}
              showIncidentsOnly={alertsOnly}
              showCamerasOnly={false}
              className="h-full"
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
    </div>
  );
}