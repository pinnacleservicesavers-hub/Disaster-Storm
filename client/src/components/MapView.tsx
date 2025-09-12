// Enhanced Map Interface for Traffic Cameras and Incidents
import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Camera, AlertTriangle, MapPin, Filter, Layers, Download, Droplets, Globe, Map as MapIcon, Satellite, Mountain } from 'lucide-react';
import { StormHeatmap } from './StormHeatmap';

// Leaflet types and imports
interface LatLng {
  lat: number;
  lng: number;
}

interface LeafletBounds {
  getSouth: () => number;
  getWest: () => number;
  getNorth: () => number;
  getEast: () => number;
  pad: (value: number) => LeafletBounds;
}

interface LeafletMap {
  setView: (latlng: LatLng, zoom: number) => LeafletMap;
  remove: () => void;
  on: (event: string, handler: (e: any) => void) => void;
  eachLayer: (callback: (layer: any) => void) => void;
  removeLayer: (layer: any) => void;
  getBounds: () => LeafletBounds;
  fitBounds: (bounds: LeafletBounds) => void;
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
  const [selectedStormZone, setSelectedStormZone] = useState<any>(null);
  const [mapStyle, setMapStyle] = useState('streets-v11');
  const [mapboxToken] = useState<string | null>(import.meta.env.VITE_MAPBOX_TOKEN || null);
  const [layerVisibility, setLayerVisibility] = useState({
    cameras: !showIncidentsOnly,
    incidents: !showCamerasOnly,
    heatmap: false,
    stormHeatmap: true,
    soilMoisture: false
  });
  const [geojsonData, setGeojsonData] = useState<any>(null);
  const [isExporting, setIsExporting] = useState(false);
  const soilMoistureLayerRef = useRef<any>(null);
  const [mapError, setMapError] = useState<string | null>(null);

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
      // Clean up soil moisture layer to prevent orphaned layers
      if (soilMoistureLayerRef.current && mapInstanceRef.current) {
        mapInstanceRef.current.removeLayer(soilMoistureLayerRef.current);
        soilMoistureLayerRef.current = null;
      }
      
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update map style with Mapbox Styles API integration
  const updateMapStyle = (map: any, style: string) => {
    // Remove existing base tile layers only (preserve overlays like soil moisture)
    map.eachLayer((layer: any) => {
      if (layer.options?.attribution && !layer.options?.isOverlay) {
        map.removeLayer(layer);
      }
    });

    let tileLayer;
    
    // Check for Mapbox token and use Mapbox Styles API if available
    if (mapboxToken) {
      const mapboxStyleMap: Record<string, string> = {
        'streets-v11': 'streets-v11',
        'satellite-v9': 'satellite-v9', 
        'dark-v10': 'dark-v10',
        'light-v10': 'light-v10',
        'terrain-v11': 'outdoors-v11' // Use outdoors for terrain-like style
      };
      
      const mapboxStyle = mapboxStyleMap[style] || 'streets-v11';
      
      tileLayer = window.L.tileLayer(
        `https://api.mapbox.com/styles/v1/mapbox/${mapboxStyle}/tiles/512/{z}/{x}/{y}@2x?access_token=${mapboxToken}`,
        {
          attribution: '© Mapbox © OpenStreetMap',
          tileSize: 512,
          zoomOffset: -1,
          maxZoom: 22
        }
      );
    } else {
      // Fallback to free alternatives when no Mapbox token
      setMapError('Mapbox token not found - using fallback map styles');
      
      switch (style) {
        case 'satellite-v9':
        case 'satellite':
          tileLayer = window.L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: '© Esri',
            maxZoom: 19
          });
          break;
        case 'terrain-v11':
        case 'terrain':
          tileLayer = window.L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenTopoMap',
            maxZoom: 17
          });
          break;
        case 'dark-v10':
        case 'dark':
          tileLayer = window.L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '© OpenStreetMap © CARTO',
            maxZoom: 20
          });
          break;
        case 'light-v10':
        case 'light':
          tileLayer = window.L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            attribution: '© OpenStreetMap © CARTO',
            maxZoom: 20
          });
          break;
        default: // streets-v11 or any other
          tileLayer = window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
          });
      }
    }

    tileLayer.addTo(map);
  };

  // Manage soil moisture layer declaratively based on layerVisibility state
  const manageSoilMoistureLayer = (shouldShow: boolean) => {
    if (!mapInstanceRef.current) return;
    
    const map = mapInstanceRef.current;
    
    // If we should show the layer but it doesn't exist, create and add it
    if (shouldShow && !soilMoistureLayerRef.current) {
      const soilMoistureLayer = window.L.tileLayer(
        'https://idpgis.ncep.noaa.gov/arcgis/rest/services/NWS_Climate_Outlooks/cpc_soil_moisture_percentile/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: '© NOAA Climate Prediction Center',
          opacity: 0.6,
          maxZoom: 18,
          isOverlay: true // Mark as overlay to preserve during style changes
        }
      );
      
      soilMoistureLayer.addTo(map);
      soilMoistureLayerRef.current = soilMoistureLayer;
    }
    // If we should not show the layer but it exists, remove it
    else if (!shouldShow && soilMoistureLayerRef.current) {
      map.removeLayer(soilMoistureLayerRef.current);
      soilMoistureLayerRef.current = null;
    }
  };

  // Export current map view as GeoJSON to CSV
  const exportGeoJSONToCSV = async () => {
    if (!mapInstanceRef.current) return;
    
    setIsExporting(true);
    try {
      const map = mapInstanceRef.current;
      const bounds = map.getBounds();
      
      // Build Overpass query for current map bounds
      const overpassQuery = `
        [out:json][timeout:25];
        (
          way["highway"]["highway"!="footway"]["highway"!="path"](${bounds.getSouth()},${bounds.getWest()},${bounds.getNorth()},${bounds.getEast()});
          way["building"](${bounds.getSouth()},${bounds.getWest()},${bounds.getNorth()},${bounds.getEast()});
          node["amenity"="hospital"](${bounds.getSouth()},${bounds.getWest()},${bounds.getNorth()},${bounds.getEast()});
          node["amenity"="fire_station"](${bounds.getSouth()},${bounds.getWest()},${bounds.getNorth()},${bounds.getEast()});
          node["emergency"="emergency_service"](${bounds.getSouth()},${bounds.getWest()},${bounds.getNorth()},${bounds.getEast()});
        );
        out geom;
      `;
      
      // Fetch data from Overpass API
      const response = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `data=${encodeURIComponent(overpassQuery)}`
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch Overpass data');
      }
      
      const overpassData = await response.json();
      
      // Convert Overpass data to CSV format
      const csvRows = [];
      csvRows.push('id,type,name,category,lat,lng,tags,geometry_type,nodes_count');
      
      overpassData.elements.forEach((element: any) => {
        const tags = element.tags || {};
        const name = tags.name || tags.ref || 'Unknown';
        const category = tags.highway || tags.building || tags.amenity || tags.emergency || 'other';
        
        let lat, lng, geometryType, nodesCount;
        
        if (element.type === 'node') {
          lat = element.lat;
          lng = element.lon;
          geometryType = 'point';
          nodesCount = 1;
        } else if (element.type === 'way' && element.geometry) {
          // Calculate centroid for ways
          const coords = element.geometry;
          lat = coords.reduce((sum: number, coord: any) => sum + coord.lat, 0) / coords.length;
          lng = coords.reduce((sum: number, coord: any) => sum + coord.lon, 0) / coords.length;
          geometryType = 'linestring';
          nodesCount = coords.length;
        }
        
        if (lat && lng) {
          const tagsString = Object.entries(tags)
            .map(([k, v]) => `${k}=${v}`)
            .join(';')
            .replace(/"/g, '""'); // Escape quotes for CSV
          
          csvRows.push(`"${element.id}","${element.type}","${name.replace(/"/g, '""')}","${category}",${lat},${lng},"${tagsString}","${geometryType}",${nodesCount}`);
        }
      });
      
      // Create and download CSV file
      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `map_features_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Store the data for display
      setGeojsonData(overpassData);
      
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  // Handle soil moisture layer based on visibility state
  useEffect(() => {
    if (mapInstanceRef.current) {
      manageSoilMoistureLayer(layerVisibility.soilMoisture);
    }
  }, [layerVisibility.soilMoisture]);

  // Update markers when data changes
  useEffect(() => {
    if (!mapInstanceRef.current || !window.L) return;

    const map = mapInstanceRef.current;
    
    // Clear existing markers (keep base layer and soil moisture)
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

  const getMapStyleIcon = (style: string) => {
    switch (style) {
      case 'satellite-v9':
      case 'satellite': 
        return <Satellite className="h-4 w-4" />;
      case 'terrain-v11':
      case 'terrain': 
        return <Mountain className="h-4 w-4" />;
      case 'dark-v10':
      case 'dark': 
        return <MapIcon className="h-4 w-4" />;
      case 'light-v10':
      case 'light': 
        return <Globe className="h-4 w-4" />;
      case 'streets-v11':
      case 'street':
      default: 
        return <MapIcon className="h-4 w-4" />;
    }
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
              {!mapboxToken && (
                <div className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-200" title="Set VITE_MAPBOX_TOKEN for full Mapbox functionality">
                  No Mapbox Token
                </div>
              )}
              {mapError && (
                <div className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded border border-orange-200">
                  {mapError}
                </div>
              )}
              <Button
                size="sm"
                variant={layerVisibility.cameras ? "default" : "outline"}
                onClick={() => toggleLayer('cameras')}
                data-testid="button-toggle-cameras"
                title="Toggle Traffic Cameras"
              >
                <Camera className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant={layerVisibility.incidents ? "default" : "outline"}
                onClick={() => toggleLayer('incidents')}
                data-testid="button-toggle-incidents"
                title="Toggle Traffic Incidents"
              >
                <AlertTriangle className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant={layerVisibility.stormHeatmap ? "default" : "outline"}
                onClick={() => toggleLayer('stormHeatmap')}
                data-testid="button-toggle-storm-heatmap"
                title="Toggle Storm Risk Heatmap"
              >
                <Layers className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant={layerVisibility.soilMoisture ? "default" : "outline"}
                onClick={() => toggleLayer('soilMoisture')}
                data-testid="button-toggle-soil-moisture"
                title="Toggle Soil Moisture Data"
              >
                <Droplets className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Export Control */}
            <Button
              size="sm"
              variant="outline"
              onClick={exportGeoJSONToCSV}
              disabled={isExporting}
              data-testid="button-export-geojson-csv"
              title="Export GeoJSON to CSV"
            >
              {isExporting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
              ) : (
                <Download className="h-4 w-4" />
              )}
            </Button>
            
            {/* Enhanced Map Style Selector */}
            <Select value={mapStyle} onValueChange={changeMapStyle}>
              <SelectTrigger className="w-36" data-testid="select-map-style">
                <div className="flex items-center">
                  {getMapStyleIcon(mapStyle)}
                  <SelectValue placeholder="Map Style" className="ml-2" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="streets-v11">
                  <div className="flex items-center">
                    <MapIcon className="h-4 w-4 mr-2" />
                    Streets
                  </div>
                </SelectItem>
                <SelectItem value="satellite-v9">
                  <div className="flex items-center">
                    <Satellite className="h-4 w-4 mr-2" />
                    Satellite
                  </div>
                </SelectItem>
                <SelectItem value="terrain-v11">
                  <div className="flex items-center">
                    <Mountain className="h-4 w-4 mr-2" />
                    Terrain
                  </div>
                </SelectItem>
                <SelectItem value="dark-v10">
                  <div className="flex items-center">
                    <MapIcon className="h-4 w-4 mr-2" />
                    Dark
                  </div>
                </SelectItem>
                <SelectItem value="light-v10">
                  <div className="flex items-center">
                    <Globe className="h-4 w-4 mr-2" />
                    Light
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="flex">
          {/* Map Container */}
          <div className="flex-1">
            <div 
              ref={mapRef} 
              className="w-full h-96 bg-gray-100"
              data-testid="map-container"
            />
          </div>
          
          {/* Storm Heatmap Controls Panel */}
          {layerVisibility.stormHeatmap && (
            <div className="w-80 h-96 overflow-y-auto">
              <StormHeatmap
                mapInstance={mapInstanceRef.current}
                selectedState={selectedState}
                onZoneSelect={(zone) => setSelectedStormZone(zone)}
                className="h-full"
              />
            </div>
          )}
        </div>
        
        {/* Loading Overlay */}
        {(camerasLoading || incidentsLoading) && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">Loading map data...</p>
            </div>
          </div>
        )}
        
        {/* Enhanced Map Legend */}
        <div className="absolute bottom-4 left-4 bg-white bg-opacity-95 p-3 rounded-lg shadow-lg border">
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
            {layerVisibility.stormHeatmap && (
              <>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-red-600 rounded-full mr-2"></div>
                  Very High Risk
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-orange-500 rounded-full mr-2"></div>
                  High Risk
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-yellow-500 rounded-full mr-2"></div>
                  Moderate Risk
                </div>
              </>
            )}
            {layerVisibility.soilMoisture && (
              <div className="flex items-center">
                <div className="flex items-center mr-2">
                  <Droplets className="h-3 w-3 text-blue-600" />
                </div>
                Soil Moisture
              </div>
            )}
          </div>
          {geojsonData && (
            <div className="mt-2 pt-2 border-t border-gray-200">
              <div className="text-xs text-gray-600">
                Last Export: {geojsonData.elements?.length || 0} features
              </div>
            </div>
          )}
        </div>
        
        {/* Export Status */}
        {isExporting && (
          <div className="absolute top-4 right-4 bg-blue-50 border border-blue-200 text-blue-800 px-3 py-2 rounded-lg shadow-sm">
            <div className="flex items-center text-sm">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
              Exporting map data...
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}