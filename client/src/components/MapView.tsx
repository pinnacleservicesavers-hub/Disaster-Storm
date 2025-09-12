// Enhanced Map Interface for Traffic Cameras and Incidents
import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Camera, AlertTriangle, MapPin, Filter, Layers } from 'lucide-react';

// Leaflet types and imports
interface LatLng {
  lat: number;
  lng: number;
}

interface LeafletMap {
  setView: (latlng: LatLng, zoom: number) => LeafletMap;
  remove: () => void;
  on: (event: string, handler: (e: any) => void) => void;
  eachLayer: (callback: (layer: any) => void) => void;
  removeLayer: (layer: any) => void;
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

interface MapViewProps {
  selectedState?: string;
  selectedCounty?: string;
  showIncidentsOnly?: boolean;
  showCamerasOnly?: boolean;
  centerLat?: number;
  centerLng?: number;
  zoom?: number;
  className?: string;
  onCameraSelect?: (camera: TrafficCamera) => void;
  onIncidentSelect?: (incident: TrafficIncident) => void;
}

declare global {
  interface Window {
    L: any;
  }
}

export function MapView({
  selectedState,
  selectedCounty,
  showIncidentsOnly = false,
  showCamerasOnly = false,
  centerLat = 39.8283,
  centerLng = -98.5795,
  zoom = 4,
  className = '',
  onCameraSelect,
  onIncidentSelect
}: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<LeafletMap | null>(null);
  const [selectedCamera, setSelectedCamera] = useState<TrafficCamera | null>(null);
  const [selectedIncident, setSelectedIncident] = useState<TrafficIncident | null>(null);
  const [mapStyle, setMapStyle] = useState('street');
  const [layerVisibility, setLayerVisibility] = useState({
    cameras: !showIncidentsOnly,
    incidents: !showCamerasOnly,
    heatmap: false
  });

  // Fetch cameras for selected state
  const { data: cameras, isLoading: camerasLoading } = useQuery<{ cameras: TrafficCamera[] }>({
    queryKey: ['/api/511/cameras/search', { state: selectedState, provider: selectedState ? `${selectedState} DOT` : undefined }],
    enabled: !!selectedState && layerVisibility.cameras,
  });

  // Fetch incidents for selected state
  const { data: incidents, isLoading: incidentsLoading } = useQuery<{ incidents: TrafficIncident[] }>({
    queryKey: ['/api/511/incidents', { state: selectedState }],
    enabled: !!selectedState && layerVisibility.incidents,
  });

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Load Leaflet CSS if not already loaded
    if (!document.querySelector('link[href*="leaflet.css"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    // Load Leaflet JS if not already loaded
    if (!window.L) {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => initializeMap();
      document.head.appendChild(script);
    } else {
      initializeMap();
    }

    function initializeMap() {
      if (!mapRef.current || !window.L) return;

      const map = window.L.map(mapRef.current).setView([centerLat, centerLng], zoom);

      // Add base layer
      updateMapStyle(map, mapStyle);

      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update map style
  const updateMapStyle = (map: any, style: string) => {
    // Remove existing tile layers
    map.eachLayer((layer: any) => {
      if (layer.options?.attribution) {
        map.removeLayer(layer);
      }
    });

    let tileLayer;
    switch (style) {
      case 'satellite':
        tileLayer = window.L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
          attribution: '© Esri'
        });
        break;
      case 'terrain':
        tileLayer = window.L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenTopoMap'
        });
        break;
      default: // street
        tileLayer = window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        });
    }

    tileLayer.addTo(map);
  };

  // Update markers when data changes
  useEffect(() => {
    if (!mapInstanceRef.current || !window.L) return;

    const map = mapInstanceRef.current;
    
    // Clear existing markers (keep base layer)
    map.eachLayer((layer: any) => {
      if (layer.options?.pane === 'markerPane') {
        map.removeLayer(layer);
      }
    });

    // Add camera markers
    if (cameras?.cameras && layerVisibility.cameras) {
      cameras.cameras
        .filter(camera => !selectedCounty || camera.jurisdiction.county === selectedCounty)
        .forEach(camera => {
          const isActive = camera.isActive;
          const iconColor = isActive ? 'blue' : 'gray';
          
          const icon = window.L.divIcon({
            className: 'custom-camera-marker',
            html: `<div class="bg-${iconColor}-500 text-white rounded-full p-2 border-2 border-white shadow-lg ${!isActive ? 'opacity-50' : ''}">
                     <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                       <path d="M4 5a2 2 0 00-2 2v6a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586l-.707-.707A1 1 0 0013 4H7a1 1 0 00-.707.293L5.586 5H4z"/>
                     </svg>
                   </div>`,
            iconSize: [32, 32],
            iconAnchor: [16, 16]
          });

          const marker = window.L.marker([camera.lat, camera.lng], { icon })
            .bindPopup(`
              <div class="p-3 min-w-64">
                <h3 class="font-semibold text-lg mb-2">${camera.name}</h3>
                <div class="space-y-1 text-sm">
                  <p><strong>Provider:</strong> ${camera.jurisdiction.provider}</p>
                  <p><strong>Type:</strong> ${camera.type}</p>
                  <p><strong>Status:</strong> <span class="${camera.isActive ? 'text-green-600' : 'text-red-600'}">${camera.isActive ? 'Active' : 'Inactive'}</span></p>
                  ${camera.metadata?.route ? `<p><strong>Route:</strong> ${camera.metadata.route}</p>` : ''}
                  ${camera.snapshotUrl ? `<img src="${camera.snapshotUrl}" class="w-full h-32 object-cover rounded mt-2" onerror="this.style.display='none'"/>` : ''}
                </div>
              </div>
            `)
            .on('click', () => {
              setSelectedCamera(camera);
              setSelectedIncident(null);
              onCameraSelect?.(camera);
            });

          marker.addTo(map);
        });
    }

    // Add incident markers
    if (incidents?.incidents && layerVisibility.incidents) {
      incidents.incidents.forEach(incident => {
        const severityColors = {
          critical: 'red',
          severe: 'orange',
          moderate: 'yellow',
          minor: 'green'
        };

        const iconColor = severityColors[incident.severity];
        const isPulse = incident.severity === 'critical' || incident.severity === 'severe';

        const icon = window.L.divIcon({
          className: 'custom-incident-marker',
          html: `<div class="bg-${iconColor}-500 text-white rounded-full p-2 border-2 border-white shadow-lg ${isPulse ? 'animate-pulse' : ''}">
                   <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                     <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
                   </svg>
                 </div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        });

        const marker = window.L.marker([incident.lat, incident.lng], { icon })
          .bindPopup(`
            <div class="p-3 min-w-64">
              <h3 class="font-semibold text-lg mb-2">${incident.type.replace(/_/g, ' ').toUpperCase()}</h3>
              <div class="space-y-2 text-sm">
                <div class="flex items-center space-x-2">
                  <span class="px-2 py-1 rounded text-xs bg-${iconColor}-100 text-${iconColor}-800">${incident.severity.toUpperCase()}</span>
                  ${incident.isContractorOpportunity ? '<span class="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">CONTRACTOR OPP</span>' : ''}
                </div>
                <p class="text-gray-700">${incident.description}</p>
                <p><strong>Routes:</strong> ${incident.affectedRoutes.join(', ')}</p>
                <p><strong>Started:</strong> ${new Date(incident.startTime).toLocaleString()}</p>
                ${incident.estimatedValue ? `<p><strong>Est. Value:</strong> $${incident.estimatedValue.toLocaleString()}</p>` : ''}
              </div>
            </div>
          `)
          .on('click', () => {
            setSelectedIncident(incident);
            setSelectedCamera(null);
            onIncidentSelect?.(incident);
          });

        marker.addTo(map);
      });
    }

    // Auto-zoom to fit markers if state is selected
    if (selectedState && cameras?.cameras.length || incidents?.incidents.length) {
      const allPoints = [
        ...(cameras?.cameras || []).map(c => [c.lat, c.lng]),
        ...(incidents?.incidents || []).map(i => [i.lat, i.lng])
      ];
      
      if (allPoints.length > 0) {
        const group = window.L.featureGroup(
          allPoints.map(point => window.L.marker(point))
        );
        map.fitBounds(group.getBounds().pad(0.1));
      }
    }
  }, [cameras, incidents, layerVisibility, selectedCounty]);

  const toggleLayer = (layer: keyof typeof layerVisibility) => {
    setLayerVisibility(prev => ({
      ...prev,
      [layer]: !prev[layer]
    }));
  };

  const changeMapStyle = (newStyle: string) => {
    setMapStyle(newStyle);
    if (mapInstanceRef.current) {
      updateMapStyle(mapInstanceRef.current, newStyle);
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center" data-testid="text-map-title">
            <MapPin className="h-5 w-5 mr-2" />
            Interactive Map
            {selectedState && <Badge className="ml-2">{selectedState}</Badge>}
          </CardTitle>
          
          <div className="flex items-center space-x-2">
            {/* Layer Controls */}
            <div className="flex items-center space-x-1">
              <Button
                size="sm"
                variant={layerVisibility.cameras ? "default" : "outline"}
                onClick={() => toggleLayer('cameras')}
                data-testid="button-toggle-cameras"
              >
                <Camera className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant={layerVisibility.incidents ? "default" : "outline"}
                onClick={() => toggleLayer('incidents')}
                data-testid="button-toggle-incidents"
              >
                <AlertTriangle className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Map Style Selector */}
            <Select value={mapStyle} onValueChange={changeMapStyle}>
              <SelectTrigger className="w-32" data-testid="select-map-style">
                <SelectValue placeholder="Map Style" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="street">Street</SelectItem>
                <SelectItem value="satellite">Satellite</SelectItem>
                <SelectItem value="terrain">Terrain</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div 
          ref={mapRef} 
          className="w-full h-96 bg-gray-100"
          data-testid="map-container"
        />
        
        {/* Loading Overlay */}
        {(camerasLoading || incidentsLoading) && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">Loading map data...</p>
            </div>
          </div>
        )}
        
        {/* Map Legend */}
        <div className="absolute bottom-4 left-4 bg-white bg-opacity-90 p-3 rounded shadow">
          <h4 className="font-semibold text-sm mb-2 flex items-center">
            <Layers className="h-4 w-4 mr-1" />
            Legend
          </h4>
          <div className="space-y-1 text-xs">
            {layerVisibility.cameras && (
              <div className="flex items-center">
                <div className="w-4 h-4 bg-blue-500 rounded-full mr-2"></div>
                Traffic Cameras
              </div>
            )}
            {layerVisibility.incidents && (
              <>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-red-500 rounded-full mr-2"></div>
                  Critical Incidents
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-orange-500 rounded-full mr-2"></div>
                  Severe Incidents
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-yellow-500 rounded-full mr-2"></div>
                  Moderate Incidents
                </div>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}