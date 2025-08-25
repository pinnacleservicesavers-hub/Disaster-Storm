import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { droneApi } from "@/lib/api";
import { Maximize, MapPin } from "lucide-react";

export default function DroneViewer() {
  const { translate } = useLanguage();
  
  const { data: footage, isLoading } = useQuery({
    queryKey: ["/api/drone-footage", { live: true }],
    queryFn: () => droneApi.getFootage(true),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const liveFeed = footage?.[0]; // Get the first live feed

  return (
    <Card data-testid="card-drone-viewer">
      <CardHeader className="border-b border-gray-200">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold text-gray-900">
            {translate('live_drone_footage')}
          </CardTitle>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <Badge variant="destructive" className="text-sm font-medium">
              {translate('recording')}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="relative h-64">
          {isLoading ? (
            <div className="absolute inset-0 bg-gray-200 animate-shimmer flex items-center justify-center">
              <div className="text-gray-500">Loading drone feed...</div>
            </div>
          ) : liveFeed ? (
            <div className="absolute inset-0 bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center">
              <div className="text-center text-white">
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M2 12c0 5.523 4.477 10 10 10s10-4.477 10-10S17.523 2 12 2 2 6.477 2 12zm9-5v10l7-5-7-5z"/>
                  </svg>
                </div>
                <p className="text-lg font-medium" data-testid="operator-name">
                  {liveFeed.title}
                </p>
                <p className="text-sm opacity-75" data-testid="operator-id">
                  Operator: {liveFeed.operatorName}
                </p>
              </div>
            </div>
          ) : (
            <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M2 12c0 5.523 4.477 10 10 10s10-4.477 10-10S17.523 2 12 2 2 6.477 2 12zm9-5v10l7-5-7-5z"/>
                  </svg>
                </div>
                <p className="font-medium">No live feeds available</p>
                <p className="text-sm">Waiting for drone operators...</p>
              </div>
            </div>
          )}
          
          {/* Overlay controls */}
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
            {liveFeed && (
              <div className="bg-black bg-opacity-50 text-white px-3 py-2 rounded-lg text-sm flex items-center">
                <MapPin className="w-4 h-4 mr-1" />
                <span data-testid="drone-location">{liveFeed.location}</span>
                {liveFeed.stormEvent && (
                  <span className="ml-2">- {liveFeed.stormEvent}</span>
                )}
              </div>
            )}
            <div className="flex items-center space-x-2">
              <Button
                variant="secondary"
                size="sm"
                className="bg-black bg-opacity-50 text-white hover:bg-opacity-70"
                data-testid="button-expand-drone"
              >
                <Maximize className="w-4 h-4" />
              </Button>
              {liveFeed && (
                <Button
                  variant="destructive"
                  size="sm"
                  data-testid="button-save-clip"
                >
                  {translate('save_clip')}
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
      
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4">
            <span className="text-gray-600">{translate('connected_operators')}:</span>
            <span className="font-medium" data-testid="operator-count">
              {footage?.length || 0} Active
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-primary hover:text-primary-dark"
            data-testid="button-manage-sources"
          >
            {translate('manage_sources')}
          </Button>
        </div>
      </div>
    </Card>
  );
}
