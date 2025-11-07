import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Polygon, Marker, Popup, Circle, useMap } from 'react-leaflet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertTriangle, MapPin, Home, FileText, Activity } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import ModuleAIAssistant from '@/components/ModuleAIAssistant';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default markers in React-Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

interface AlignmentSummary {
  timestamp: string;
  totalActiveHazards: number;
  totalActiveClaims: number;
  totalAssets: number;
  intersections: number;
  moratoriumCount: number;
  hazards: Array<{
    id: string;
    event: string;
    severity: string;
    source: string;
    areas: string[];
    expires: string | null;
  }>;
  affectedClaims: Array<any>;
  affectedAssets: Array<any>;
  moratoriumAlerts: Array<any>;
  recommendations: string[];
}

interface Asset {
  id: number;
  name: string;
  latitude: string;
  longitude: string;
  address: string;
  city: string;
  state: string;
}

interface Claim {
  id: string;
  claimNumber: string;
  propertyAddress: string;
  damageType: string;
  latitude: string;
  longitude: string;
  status: string;
  insuranceCompany: string;
}

interface WeatherAlert {
  id: string;
  alertId: string;
  event: string;
  severity: string;
  polygon: [number, number][];
  source?: string;
  geometryType?: string;
}

export default function HazardDashboard() {
  const [layers, setLayers] = useState({
    nws: true,
    nhc: true,
    mrms: true,
    claims: true,
    assets: true
  });

  const { data: alignment } = useQuery<AlignmentSummary>({
    queryKey: ['/api/align/summary'],
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  const { data: alerts } = useQuery<WeatherAlert[]>({
    queryKey: ['/api/hazards/alerts'],
    refetchInterval: 60000 // Refresh every minute
  });

  const { data: assets } = useQuery<Asset[]>({
    queryKey: ['/api/assets'],
    refetchInterval: 60000
  });

  const { data: claims } = useQuery<Claim[]>({
    queryKey: ['/api/claims'],
    refetchInterval: 60000
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Extreme': return '#ff0000';
      case 'Severe': return '#ff6600';
      case 'Moderate': return '#ffcc00';
      case 'Minor': return '#ffff00';
      default: return '#999999';
    }
  };

  const toggleLayer = (layer: keyof typeof layers) => {
    setLayers(prev => ({ ...prev, [layer]: !prev[layer] }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <ModuleAIAssistant 
        moduleName="Hazard Intelligence"
        moduleContext="Real-time multi-hazard monitoring combining NWS alerts, NHC hurricanes, MRMS radar, and aligning them with active claims and assets. Help users understand hazard severity, affected areas, and contractor deployment recommendations."
      />
      <div className="max-w-[1800px] mx-auto">
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-white mb-2" data-testid="text-dashboard-title">
            Hazard Intelligence Dashboard
          </h1>
          <p className="text-slate-300" data-testid="text-dashboard-subtitle">
            Real-time hazard monitoring, claims alignment & contractor deployment intelligence
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          {/* Main Map */}
          <Card className="xl:col-span-2 bg-slate-800/50 border-slate-700" data-testid="card-map-container">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Live Hazard Map
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <Switch 
                    id="nws-layer"
                    checked={layers.nws}
                    onCheckedChange={() => toggleLayer('nws')}
                    data-testid="switch-nws-layer"
                  />
                  <Label htmlFor="nws-layer" className="text-white cursor-pointer">
                    NWS Alerts
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch 
                    id="nhc-layer"
                    checked={layers.nhc}
                    onCheckedChange={() => toggleLayer('nhc')}
                    data-testid="switch-nhc-layer"
                  />
                  <Label htmlFor="nhc-layer" className="text-white cursor-pointer">
                    NHC Cones
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch 
                    id="mrms-layer"
                    checked={layers.mrms}
                    onCheckedChange={() => toggleLayer('mrms')}
                    data-testid="switch-mrms-layer"
                  />
                  <Label htmlFor="mrms-layer" className="text-white cursor-pointer">
                    MRMS Radar
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch 
                    id="claims-layer"
                    checked={layers.claims}
                    onCheckedChange={() => toggleLayer('claims')}
                    data-testid="switch-claims-layer"
                  />
                  <Label htmlFor="claims-layer" className="text-white cursor-pointer">
                    Claims
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch 
                    id="assets-layer"
                    checked={layers.assets}
                    onCheckedChange={() => toggleLayer('assets')}
                    data-testid="switch-assets-layer"
                  />
                  <Label htmlFor="assets-layer" className="text-white cursor-pointer">
                    Assets
                  </Label>
                </div>
              </div>

              <div className="rounded-lg overflow-hidden border-2 border-slate-700" style={{ height: '600px' }}>
                <MapContainer
                  center={[37.0902, -95.7129]} // Center of US
                  zoom={4}
                  style={{ height: '100%', width: '100%' }}
                  data-testid="map-container"
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  />

                  {/* NWS Alerts */}
                  {layers.nws && alerts?.filter(a => a.source === 'NWS' || !a.geometryType).map(alert => (
                    alert.polygon && alert.polygon.length > 0 && (
                      <Polygon
                        key={alert.alertId}
                        positions={alert.polygon}
                        pathOptions={{
                          color: getSeverityColor(alert.severity),
                          fillColor: getSeverityColor(alert.severity),
                          fillOpacity: 0.2,
                          weight: 2
                        }}
                      >
                        <Popup>
                          <div className="p-2">
                            <h3 className="font-bold">{alert.event}</h3>
                            <Badge variant="destructive">{alert.severity}</Badge>
                            <p className="text-sm mt-1">Source: NWS</p>
                          </div>
                        </Popup>
                      </Polygon>
                    )
                  ))}

                  {/* NHC Hurricane Cones */}
                  {layers.nhc && alerts?.filter(a => a.source === 'NHC' && a.geometryType === 'cone').map(alert => (
                    alert.polygon && alert.polygon.length > 0 && (
                      <Polygon
                        key={alert.alertId}
                        positions={alert.polygon}
                        pathOptions={{
                          color: '#ff0000',
                          fillColor: '#ff6600',
                          fillOpacity: 0.3,
                          weight: 3,
                          dashArray: '10, 5'
                        }}
                      >
                        <Popup>
                          <div className="p-2">
                            <h3 className="font-bold text-red-600">🌀 {alert.event}</h3>
                            <Badge variant="destructive">Hurricane Forecast Cone</Badge>
                            <p className="text-sm mt-1">Source: NHC</p>
                          </div>
                        </Popup>
                      </Polygon>
                    )
                  ))}

                  {/* MRMS Contours */}
                  {layers.mrms && alerts?.filter(a => a.source === 'MRMS').map(alert => (
                    alert.polygon && alert.polygon.length > 0 && (
                      <Polygon
                        key={alert.alertId}
                        positions={alert.polygon}
                        pathOptions={{
                          color: '#9333ea',
                          fillColor: '#a855f7',
                          fillOpacity: 0.25,
                          weight: 2
                        }}
                      >
                        <Popup>
                          <div className="p-2">
                            <h3 className="font-bold text-purple-600">📡 {alert.event}</h3>
                            <Badge className="bg-purple-600">MRMS Radar</Badge>
                            <p className="text-sm mt-1">{alert.severity} Severity</p>
                          </div>
                        </Popup>
                      </Polygon>
                    )
                  ))}

                  {/* Assets */}
                  {layers.assets && assets?.map(asset => (
                    <Marker
                      key={asset.id}
                      position={[parseFloat(asset.latitude), parseFloat(asset.longitude)]}
                      icon={L.divIcon({
                        className: 'custom-icon',
                        html: `<div style="background: #3b82f6; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center;"><span style="color: white; font-size: 14px;">🏠</span></div>`,
                        iconSize: [24, 24],
                        iconAnchor: [12, 12]
                      })}
                    >
                      <Popup>
                        <div className="p-2">
                          <h3 className="font-bold text-blue-600">🏠 {asset.name}</h3>
                          <p className="text-sm">{asset.address}</p>
                          <p className="text-xs text-gray-500">{asset.city}, {asset.state}</p>
                        </div>
                      </Popup>
                    </Marker>
                  ))}

                  {/* Claims */}
                  {layers.claims && claims?.map(claim => (
                    claim.latitude && claim.longitude && (
                      <Marker
                        key={claim.id}
                        position={[parseFloat(claim.latitude), parseFloat(claim.longitude)]}
                        icon={L.divIcon({
                          className: 'custom-icon',
                          html: `<div style="background: #ef4444; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center;"><span style="color: white; font-size: 14px;">📋</span></div>`,
                          iconSize: [24, 24],
                          iconAnchor: [12, 12]
                        })}
                      >
                        <Popup>
                          <div className="p-2">
                            <h3 className="font-bold text-red-600">📋 {claim.claimNumber}</h3>
                            <Badge>{claim.status}</Badge>
                            <p className="text-sm mt-1">{claim.damageType}</p>
                            <p className="text-xs">{claim.insuranceCompany}</p>
                            <p className="text-xs text-gray-500">{claim.propertyAddress}</p>
                          </div>
                        </Popup>
                      </Marker>
                    )
                  ))}
                </MapContainer>
              </div>
            </CardContent>
          </Card>

          {/* Side Panel */}
          <div className="space-y-4">
            {/* Stats Overview */}
            <Card className="bg-slate-800/50 border-slate-700" data-testid="card-stats-overview">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  System Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-300">Active Hazards</span>
                  <Badge variant="destructive" className="text-lg" data-testid="badge-active-hazards">
                    {alignment?.totalActiveHazards || 0}
                  </Badge>
                </div>
                <Separator className="bg-slate-700" />
                <div className="flex justify-between items-center">
                  <span className="text-slate-300">Active Claims</span>
                  <Badge variant="secondary" className="text-lg" data-testid="badge-active-claims">
                    {alignment?.totalActiveClaims || 0}
                  </Badge>
                </div>
                <Separator className="bg-slate-700" />
                <div className="flex justify-between items-center">
                  <span className="text-slate-300">Monitored Assets</span>
                  <Badge variant="outline" className="text-lg" data-testid="badge-total-assets">
                    {alignment?.totalAssets || 0}
                  </Badge>
                </div>
                <Separator className="bg-slate-700" />
                <div className="flex justify-between items-center">
                  <span className="text-slate-300">Intersections</span>
                  <Badge className="text-lg bg-orange-600" data-testid="badge-intersections">
                    {alignment?.intersections || 0}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Moratorium Alerts */}
            {alignment && alignment.moratoriumCount > 0 && (
              <Card className="bg-red-950/30 border-red-800" data-testid="card-moratorium-alerts">
                <CardHeader>
                  <CardTitle className="text-red-400 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Moratorium Alerts ({alignment.moratoriumCount})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[200px]">
                    <div className="space-y-2">
                      {alignment.moratoriumAlerts.map((alert, idx) => (
                        <div key={idx} className="p-3 bg-red-900/30 rounded border border-red-800" data-testid={`alert-moratorium-${idx}`}>
                          <p className="font-semibold text-red-300">{alert.claim}</p>
                          <p className="text-sm text-red-400">{alert.hazard}</p>
                          <p className="text-xs text-slate-400">{alert.address}</p>
                          <Badge variant="destructive" className="mt-1">{alert.severity}</Badge>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}

            {/* Recommendations */}
            <Card className="bg-slate-800/50 border-slate-700" data-testid="card-recommendations">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-2">
                    {alignment?.recommendations.map((rec, idx) => (
                      <div 
                        key={idx} 
                        className="p-3 bg-slate-700/50 rounded text-sm text-slate-200"
                        data-testid={`recommendation-${idx}`}
                      >
                        {rec}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="bg-slate-800/50 border-slate-700" data-testid="card-quick-actions">
              <CardHeader>
                <CardTitle className="text-white">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full" variant="default" data-testid="button-trigger-nhc-ingest">
                  Trigger NHC Ingest
                </Button>
                <Button className="w-full" variant="outline" data-testid="button-trigger-mrms-ingest">
                  Trigger MRMS Ingest
                </Button>
                <Button className="w-full" variant="secondary" data-testid="button-export-report">
                  Export Report (PDF)
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
