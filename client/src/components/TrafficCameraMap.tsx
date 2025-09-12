import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Camera, AlertTriangle, MapPin, ExternalLink, Eye, Bell } from 'lucide-react';
import { CameraViewer } from './CameraViewer';

// Leaflet types and imports
interface LatLng {
  lat: number;
  lng: number;
}

interface LeafletMap {
  setView: (latlng: LatLng, zoom: number) => LeafletMap;
  remove: () => void;
  on: (event: string, handler: (e: any) => void) => void;
}

interface TrafficCamera {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: string;
  snapshotUrl?: string;
  streamUrl?: string;
  isActive: boolean;
  jurisdiction: {
    state: string;
    county?: string;
    provider: string;
    jurisdiction: string;
  };
  lastUpdated: string;
  metadata?: Record<string, any>;
}

interface TrafficIncident {
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
  estimatedValue?: number;
}

interface TrafficCameraMapProps {
  selectedState?: string;
  selectedCounty?: string;
  alertsOnly?: boolean;
}

declare global {
  interface Window {
    L: any;
  }
}

export function TrafficCameraMap({ selectedState, selectedCounty, alertsOnly }: TrafficCameraMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<LeafletMap | null>(null);
  const [selectedCamera, setSelectedCamera] = useState<TrafficCamera | null>(null);
  const [selectedIncident, setSelectedIncident] = useState<TrafficIncident | null>(null);
  const [viewerCameraId, setViewerCameraId] = useState<string | null>(null);

  // Function to fetch and display weather context for a camera
  const fetchWeatherContext = async (camera: TrafficCamera) => {
    try {
      const response = await fetch(`/api/weather/camera-overlay/${camera.id}?weatherTypes=alerts,radar,lightning`);
      const weatherData = await response.json();
      
      const weatherElement = document.getElementById(`weather-${camera.id}`);
      if (weatherElement && weatherData) {
        let weatherHtml = '';
        
        // Add alerts if present
        if (weatherData.alerts && weatherData.alerts.length > 0) {
          const severityBadge = weatherData.alerts[0].severity === 'Extreme' ? 'bg-red-100 text-red-800' :
                               weatherData.alerts[0].severity === 'Severe' ? 'bg-orange-100 text-orange-800' :
                               'bg-yellow-100 text-yellow-800';
          weatherHtml += `<div class="mb-1"><span class="px-1 py-0.5 text-xs rounded ${severityBadge}">${weatherData.alerts[0].alertType}</span></div>`;
        }
        
        // Add radar intensity
        if (weatherData.radar && weatherData.radar.layers && weatherData.radar.layers[0]) {
          const intensity = weatherData.radar.layers[0].data?.length || 0;
          const intensityLevel = intensity > 50 ? 'High' : intensity > 20 ? 'Moderate' : intensity > 0 ? 'Light' : 'None';
          const intensityColor = intensity > 50 ? 'text-red-600' : intensity > 20 ? 'text-orange-600' : intensity > 0 ? 'text-yellow-600' : 'text-green-600';
          weatherHtml += `<div class="flex justify-between"><span>Radar:</span><span class="${intensityColor}">${intensityLevel}</span></div>`;
        }
        
        // Add lightning density
        if (weatherData.lightning) {
          const density = weatherData.lightning.density || 0;
          const lightningLevel = density > 10 ? 'High' : density > 5 ? 'Moderate' : density > 0 ? 'Light' : 'None';
          const lightningColor = density > 10 ? 'text-red-600' : density > 5 ? 'text-orange-600' : density > 0 ? 'text-yellow-600' : 'text-green-600';
          weatherHtml += `<div class="flex justify-between"><span>Lightning:</span><span class="${lightningColor}">${lightningLevel}</span></div>`;
        }
        
        // Add marine conditions if near coast
        if (weatherData.marine) {
          const waveHeight = weatherData.marine.waves?.significantHeight || 0;
          weatherHtml += `<div class="flex justify-between"><span>Waves:</span><span>${waveHeight.toFixed(1)}m</span></div>`;
        }
        
        weatherElement.innerHTML = weatherHtml || '<div class="text-gray-500">No weather alerts</div>';
      }
    } catch (error) {
      console.error('Failed to fetch weather context:', error);
      const weatherElement = document.getElementById(`weather-${camera.id}`);
      if (weatherElement) {
        weatherElement.innerHTML = '<div class="text-gray-500">Weather data unavailable</div>';
      }
    }
  };

  // Fetch cameras for selected state
  const { data: cameras } = useQuery<{ cameras: TrafficCamera[] }>({
    queryKey: ['/api/511/cameras/search', { state: selectedState, provider: selectedState ? `${selectedState} DOT` : undefined }],
    enabled: !!selectedState,
  });

  // Fetch incidents for selected state
  const { data: incidents } = useQuery<{ incidents: TrafficIncident[] }>({
    queryKey: ['/api/511/incidents', { state: selectedState }],
    enabled: !!selectedState,
  });

  // Fetch weather overlay data for camera context
  const { data: weatherOverlay } = useQuery({
    queryKey: ['/api/weather/camera-overlay/', selectedCamera?.id, { weatherTypes: 'alerts,radar,lightning' }],
    enabled: !!selectedCamera,
    refetchInterval: 300000, // Refetch every 5 minutes
  });

  useEffect(() => {
    if (!mapRef.current) return;

    // Initialize map if not already done
    if (!mapInstanceRef.current && window.L) {
      const map = window.L.map(mapRef.current).setView([39.8283, -98.5795], 4); // Center of US

      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current || !window.L) return;

    const map = mapInstanceRef.current;
    
    // Clear existing markers
    map.eachLayer((layer: any) => {
      if (layer.options?.pane === 'markerPane') {
        map.removeLayer(layer);
      }
    });

    // Add camera markers
    if (cameras?.cameras && (!alertsOnly || incidents?.incidents?.length)) {
      cameras.cameras
        .filter(camera => !selectedCounty || camera.jurisdiction.county === selectedCounty)
        .forEach(camera => {
          const icon = window.L.divIcon({
            className: 'custom-camera-marker',
            html: `<div class="bg-blue-500 text-white rounded-full p-2 border-2 border-white shadow-lg">
                     <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                       <path d="M4 5a2 2 0 00-2 2v6a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586l-.707-.707A1 1 0 0013 4H7a1 1 0 00-.707.293L5.586 5H4z"/>
                     </svg>
                   </div>`,
            iconSize: [32, 32],
            iconAnchor: [16, 16]
          });

          const marker = window.L.marker([camera.lat, camera.lng], { icon })
            .bindPopup(`
              <div class="p-2">
                <h3 class="font-semibold">${camera.name}</h3>
                <p class="text-sm text-gray-600">${camera.jurisdiction.provider}</p>
                <p class="text-xs">${camera.type} • ${camera.isActive ? 'Active' : 'Inactive'}</p>
                ${camera.snapshotUrl ? `<img src="${camera.snapshotUrl}" class="w-32 h-24 object-cover rounded mt-2" onerror="this.style.display='none'"/>` : ''}
                <div class="weather-context mt-2 text-xs bg-gray-50 p-2 rounded" id="weather-${camera.id}">
                  <div class="flex items-center text-gray-500">
                    <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/>
                    </svg>
                    Loading weather...
                  </div>
                </div>
                <button 
                  class="mt-2 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 w-full"
                  onclick="window.openCameraViewer('${camera.id}')"
                >
                  View Live Feed
                </button>
              </div>
            `)
            .on('click', () => {
              setSelectedCamera(camera);
              setSelectedIncident(null);
              
              // Fetch and update weather context for this camera
              fetchWeatherContext(camera);
            });

          marker.addTo(map);
        });
    }

    // Add incident markers
    if (incidents?.incidents) {
      incidents.incidents
        .filter(incident => !alertsOnly || incident.isContractorOpportunity)
        .forEach(incident => {
          const severityColors = {
            critical: 'red',
            severe: 'orange',
            moderate: 'yellow',
            minor: 'green'
          };

          const icon = window.L.divIcon({
            className: 'custom-incident-marker',
            html: `<div class="bg-${severityColors[incident.severity]}-500 text-white rounded-full p-2 border-2 border-white shadow-lg animate-pulse">
                     <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                       <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
                     </svg>
                   </div>`,
            iconSize: [32, 32],
            iconAnchor: [16, 16]
          });

          const marker = window.L.marker([incident.lat, incident.lng], { icon })
            .bindPopup(`
              <div class="p-2">
                <h3 class="font-semibold">${incident.type.replace('_', ' ').toUpperCase()}</h3>
                <p class="text-sm">${incident.description}</p>
                <p class="text-xs text-gray-600">${incident.jurisdiction.provider}</p>
                <div class="mt-2">
                  <span class="inline-block px-2 py-1 text-xs rounded bg-${severityColors[incident.severity]}-100 text-${severityColors[incident.severity]}-800">
                    ${incident.severity}
                  </span>
                  ${incident.isContractorOpportunity ? 
                    `<span class="inline-block px-2 py-1 text-xs rounded bg-green-100 text-green-800 ml-1">
                       $${incident.estimatedValue?.toLocaleString()}
                     </span>` : ''
                  }
                </div>
              </div>
            `)
            .on('click', () => {
              setSelectedIncident(incident);
              setSelectedCamera(null);
            });

          marker.addTo(map);
        });
    }

    // Adjust map view based on markers
    if (selectedState && (cameras?.cameras?.length || incidents?.incidents?.length)) {
      const allPoints = [
        ...(cameras?.cameras || []).map(c => [c.lat, c.lng]),
        ...(incidents?.incidents || []).map(i => [i.lat, i.lng])
      ];
      
      if (allPoints.length > 0) {
        const bounds = window.L.latLngBounds(allPoints);
        map.fitBounds(bounds, { padding: [20, 20] });
      }
    }
  }, [cameras, incidents, selectedState, selectedCounty, alertsOnly]);

  // Set up global function for camera viewer
  useEffect(() => {
    (window as any).openCameraViewer = (cameraId: string) => {
      setViewerCameraId(cameraId);
    };
    return () => {
      delete (window as any).openCameraViewer;
    };
  }, []);

  if (!selectedState) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        <div className="text-center">
          <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold mb-2">Select a State</h3>
          <p>Choose a state from the browse tab to view cameras and incidents on the map.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full">
      <div ref={mapRef} className="h-full w-full" />
      
      {/* Loading CSS for Leaflet */}
      {typeof window !== 'undefined' && !window.L && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Loading map...</p>
          </div>
        </div>
      )}

      {/* Camera/Incident Details Panel */}
      {(selectedCamera || selectedIncident) && (
        <Card className="absolute top-4 right-4 w-80 max-h-96 overflow-y-auto z-[1000]">
          <CardContent className="p-4">
            {selectedCamera && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold flex items-center">
                    <Camera className="h-4 w-4 mr-2" />
                    Camera Details
                  </h3>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedCamera(null)}>✕</Button>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium">{selectedCamera.name}</h4>
                  <p className="text-sm text-gray-600">{selectedCamera.jurisdiction.provider}</p>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="font-medium">Type:</span> {selectedCamera.type}
                    </div>
                    <div>
                      <span className="font-medium">Status:</span> 
                      <Badge variant={selectedCamera.isActive ? 'default' : 'secondary'} className="ml-1">
                        {selectedCamera.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="text-sm">
                    <span className="font-medium">Location:</span> {selectedCamera.lat.toFixed(4)}, {selectedCamera.lng.toFixed(4)}
                  </div>
                  
                  {selectedCamera.snapshotUrl && (
                    <div>
                      <img 
                        src={selectedCamera.snapshotUrl} 
                        alt="Camera snapshot" 
                        className="w-full h-32 object-cover rounded border"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <Button 
                      size="sm" 
                      className="w-full" 
                      onClick={() => setViewerCameraId(selectedCamera.id)}
                      data-testid="button-view-live-feed"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Live Feed
                    </Button>
                    {selectedCamera.streamUrl && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="w-full"
                        onClick={() => window.open(selectedCamera.streamUrl, '_blank')}
                        data-testid="button-external-stream"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        External Stream
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {selectedIncident && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Incident Details
                  </h3>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedIncident(null)}>✕</Button>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{selectedIncident.type.replace('_', ' ').toUpperCase()}</h4>
                    <Badge variant={
                      selectedIncident.severity === 'critical' ? 'destructive' :
                      selectedIncident.severity === 'severe' ? 'default' : 'secondary'
                    }>
                      {selectedIncident.severity}
                    </Badge>
                  </div>
                  
                  <p className="text-sm">{selectedIncident.description}</p>
                  
                  <div className="text-sm space-y-1">
                    <div><span className="font-medium">Routes:</span> {selectedIncident.affectedRoutes.join(', ')}</div>
                    <div><span className="font-medium">Provider:</span> {selectedIncident.jurisdiction.provider}</div>
                    <div><span className="font-medium">Started:</span> {new Date(selectedIncident.startTime).toLocaleString()}</div>
                  </div>
                  
                  {selectedIncident.isContractorOpportunity && (
                    <div className="bg-green-50 p-3 rounded border">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-green-800">Contractor Opportunity</span>
                        <span className="font-bold text-green-600">
                          ${selectedIncident.estimatedValue?.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  <Button size="sm" className="w-full" data-testid="button-create-alert">
                    <Bell className="h-4 w-4 mr-2" />
                    Create Alert
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Map Legend */}
      <Card className="absolute bottom-4 left-4 z-[1000]">
        <CardContent className="p-3">
          <h4 className="font-semibold mb-2 text-sm">Legend</h4>
          <div className="space-y-1 text-xs">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-blue-500 rounded-full mr-2"></div>
              Traffic Camera
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-red-500 rounded-full mr-2"></div>
              Critical Incident
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-orange-500 rounded-full mr-2"></div>
              Severe Incident
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-green-500 rounded-full mr-2"></div>
              Contractor Opportunity
            </div>
          </div>
        </CardContent>
      </Card>

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