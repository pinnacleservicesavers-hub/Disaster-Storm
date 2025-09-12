// Contractor Watchlist Component
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Heart, HeartOff, Bell, BellOff, MapPin, Camera, AlertTriangle, Plus } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import type { ContractorWatchlist, InsertContractorWatchlist } from '@shared/schema';

interface WatchlistProps {
  contractorId: string;
  className?: string;
}

interface WatchlistItem extends ContractorWatchlist {
  stats?: {
    cameraCount: number;
    incidentCount: number;
    lastActivity: string;
  };
}

export function Watchlist({ contractorId, className = '' }: WatchlistProps) {
  const [newItemName, setNewItemName] = useState('');
  const [isAddingItem, setIsAddingItem] = useState(false);
  const queryClient = useQueryClient();

  // Fetch watchlist
  const { data: watchlistData, isLoading } = useQuery<{
    watchlist: WatchlistItem[];
    contractorId: string;
    count: number;
  }>({
    queryKey: ['/api/contractor/watchlist', contractorId],
    enabled: !!contractorId,
  });

  const watchlist = watchlistData?.watchlist || [];

  // Add to watchlist mutation
  const addWatchlistMutation = useMutation({
    mutationFn: async (data: InsertContractorWatchlist) => {
      return apiRequest('/api/contractor/watchlist', {
        method: 'POST',
        body: data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/contractor/watchlist', contractorId] });
      setNewItemName('');
      setIsAddingItem(false);
    },
    onError: (error) => {
      console.error('Error adding to watchlist:', error);
    },
  });

  // Remove from watchlist mutation
  const removeWatchlistMutation = useMutation({
    mutationFn: async ({ contractorId, itemType, itemId }: { 
      contractorId: string;
      itemType: string;
      itemId: string;
    }) => {
      return apiRequest(`/api/contractor/${contractorId}/watchlist/${itemType}/${itemId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/contractor/watchlist', contractorId] });
    },
    onError: (error) => {
      console.error('Error removing from watchlist:', error);
    },
  });

  // Toggle alerts mutation
  const toggleAlertsMutation = useMutation({
    mutationFn: async ({ itemId, alertsEnabled }: { 
      itemId: string;
      alertsEnabled: boolean;
    }) => {
      return apiRequest(`/api/contractor/watchlist/${itemId}/alerts`, {
        method: 'PATCH',
        body: { alertsEnabled },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/contractor/watchlist', contractorId] });
    },
    onError: (error) => {
      console.error('Error toggling alerts:', error);
    },
  });

  const addStateToWatchlist = () => {
    if (!newItemName.trim()) return;

    const watchlistItem: InsertContractorWatchlist = {
      contractorId,
      itemType: 'state',
      itemId: newItemName.trim().toUpperCase(),
      displayName: `${newItemName.trim()} Traffic Cameras`,
      state: newItemName.trim().toUpperCase(),
      county: null,
      alertsEnabled: true,
      metadata: null,
    };

    addWatchlistMutation.mutate(watchlistItem);
  };

  const removeFromWatchlist = (item: WatchlistItem) => {
    removeWatchlistMutation.mutate({
      contractorId,
      itemType: item.itemType,
      itemId: item.itemId,
    });
  };

  const toggleAlerts = (item: WatchlistItem) => {
    toggleAlertsMutation.mutate({
      itemId: item.id,
      alertsEnabled: !item.alertsEnabled,
    });
  };

  const getItemTypeIcon = (itemType: string) => {
    switch (itemType) {
      case 'state': return <MapPin className="h-4 w-4" />;
      case 'camera': return <Camera className="h-4 w-4" />;
      case 'incident': return <AlertTriangle className="h-4 w-4" />;
      default: return <Heart className="h-4 w-4" />;
    }
  };

  const getItemTypeBadge = (itemType: string) => {
    const colors = {
      state: 'bg-blue-100 text-blue-800',
      camera: 'bg-green-100 text-green-800',
      incident: 'bg-red-100 text-red-800',
    };
    
    return (
      <Badge className={colors[itemType as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        {itemType.toUpperCase()}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>My Watchlist</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center" data-testid="text-watchlist-title">
            <Heart className="h-5 w-5 mr-2 text-red-500" />
            My Watchlist
            {watchlist.length > 0 && (
              <Badge className="ml-2" data-testid="badge-watchlist-count">
                {watchlist.length}
              </Badge>
            )}
          </CardTitle>
          <Button
            size="sm"
            onClick={() => setIsAddingItem(!isAddingItem)}
            data-testid="button-add-watchlist"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add State
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {/* Add new item form */}
        {isAddingItem && (
          <div className="mb-4 p-4 border rounded-lg bg-gray-50">
            <h4 className="font-semibold mb-2">Add State to Watchlist</h4>
            <div className="flex space-x-2">
              <Input
                placeholder="State code (e.g., GA, FL, TX)"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value.toUpperCase())}
                maxLength={2}
                data-testid="input-add-state"
              />
              <Button
                onClick={addStateToWatchlist}
                disabled={!newItemName.trim() || addWatchlistMutation.isPending}
                data-testid="button-confirm-add"
              >
                {addWatchlistMutation.isPending ? 'Adding...' : 'Add'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsAddingItem(false);
                  setNewItemName('');
                }}
                data-testid="button-cancel-add"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Watchlist items */}
        {watchlist.length === 0 ? (
          <Alert>
            <Heart className="h-4 w-4" />
            <AlertDescription>
              Your watchlist is empty. Add states, cameras, or incidents to monitor them for contractor opportunities.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-3">
            {watchlist.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                data-testid={`watchlist-item-${item.itemId}`}
              >
                <div className="flex items-center space-x-3 flex-1">
                  {getItemTypeIcon(item.itemType)}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-semibold" data-testid={`text-item-name-${item.itemId}`}>
                        {item.displayName}
                      </h4>
                      {getItemTypeBadge(item.itemType)}
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span>{item.state}</span>
                      {item.county && <span>• {item.county} County</span>}
                      
                      {/* Stats if available */}
                      {item.stats && (
                        <>
                          <span>• {item.stats.cameraCount} cameras</span>
                          <span>• {item.stats.incidentCount} incidents</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {/* Alerts toggle */}
                  <Button
                    size="sm"
                    variant={item.alertsEnabled ? "default" : "outline"}
                    onClick={() => toggleAlerts(item)}
                    disabled={toggleAlertsMutation.isPending}
                    data-testid={`button-toggle-alerts-${item.itemId}`}
                  >
                    {item.alertsEnabled ? (
                      <Bell className="h-4 w-4" />
                    ) : (
                      <BellOff className="h-4 w-4" />
                    )}
                  </Button>

                  {/* Remove button */}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => removeFromWatchlist(item)}
                    disabled={removeWatchlistMutation.isPending}
                    data-testid={`button-remove-${item.itemId}`}
                  >
                    <HeartOff className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Watchlist stats */}
        {watchlist.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {watchlist.filter(item => item.itemType === 'state').length}
                </div>
                <div className="text-sm text-gray-600">States Monitored</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {watchlist.filter(item => item.alertsEnabled).length}
                </div>
                <div className="text-sm text-gray-600">With Alerts</div>
              </div>
            </div>
          </div>
        )}

        {/* Quick actions */}
        <div className="mt-4 pt-4 border-t">
          <h4 className="font-semibold mb-2">Quick Add Popular States</h4>
          <div className="flex flex-wrap gap-2">
            {['GA', 'FL', 'TX', 'CA', 'NY'].map(state => {
              const isInWatchlist = watchlist.some(item => item.itemId === state);
              return (
                <Button
                  key={state}
                  size="sm"
                  variant={isInWatchlist ? "secondary" : "outline"}
                  disabled={isInWatchlist || addWatchlistMutation.isPending}
                  onClick={() => {
                    const watchlistItem: InsertContractorWatchlist = {
                      contractorId,
                      itemType: 'state',
                      itemId: state,
                      displayName: `${state} Traffic Cameras`,
                      state,
                      county: null,
                      alertsEnabled: true,
                      metadata: null,
                    };
                    addWatchlistMutation.mutate(watchlistItem);
                  }}
                  data-testid={`button-quick-add-${state}`}
                >
                  {isInWatchlist ? '✓' : '+'} {state}
                </Button>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}