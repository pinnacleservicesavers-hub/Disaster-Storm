import { useEffect, useRef, useState } from 'react';
import * as Cesium from 'cesium';
import AddressSearch from '@/components/AddressSearch';
import { directions, elevationFor, snapToRoad, type LatLng } from '@/lib/google';
import { decode } from '@googlemaps/polyline-codec';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Navigation, MapPin, Route, Mountain, Clock } from 'lucide-react';

export default function EyesTools() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [viewer, setViewer] = useState<Cesium.Viewer | null>(null);
  const [origin, setOrigin] = useState<LatLng | null>(null);
  const [dest, setDest] = useState<LatLng | null>(null);
  const [eta, setEta] = useState<string>('');
  const [distance, setDistance] = useState<number>(0);
  const [elevation, setElevation] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let v: Cesium.Viewer;
    (async () => {
      const key = import.meta.env.VITE_GOOGLE_MAPS_KEY as string;
      if (!key) {
        console.error('Missing VITE_GOOGLE_MAPS_KEY - 3D globe will load without Google tiles');
        return;
      }

      // Configure Cesium defaults
      Cesium.Ion.defaultAccessToken = '';
      Cesium.Camera.DEFAULT_VIEW_RECTANGLE = Cesium.Rectangle.fromDegrees(-125, 24, -66, 49);

      v = new Cesium.Viewer(ref.current as HTMLDivElement, {
        animation: false,
        timeline: false,
        geocoder: false,
        homeButton: false,
        sceneModePicker: false,
        baseLayerPicker: false,
        navigationHelpButton: false,
        terrainProvider: undefined
      });

      try {
        const tileset = await Cesium.Cesium3DTileset.fromUrl(`https://tile.googleapis.com/v1/3dtiles/root.json?key=${key}`);
        v.scene.primitives.add(tileset);
      } catch (error) {
        console.error('Failed to load Google 3D tiles:', error);
      }

      // Fly to Southeast US for storm operations
      v.camera.flyTo({ 
        destination: Cesium.Cartesian3.fromDegrees(-84.9877, 32.46098, 55000), 
        duration: 1.6 
      });

      // Add click handler for elevation data
      const handler = new Cesium.ScreenSpaceEventHandler(v.scene.canvas);
      handler.setInputAction(async (movement: any) => {
        const cartesian = v.camera.pickEllipsoid(movement.position, v.scene.globe.ellipsoid);
        if (!cartesian) return;
        const carto = Cesium.Cartographic.fromCartesian(cartesian);
        const lat = Cesium.Math.toDegrees(carto.latitude);
        const lng = Cesium.Math.toDegrees(carto.longitude);
        
        try {
          const elev = await elevationFor([{ lat, lng }]);
          const meters = elev.results?.[0]?.elevation ?? 0;
          setElevation(meters);
          console.log(`Storm Ops Position: ${lat.toFixed(5)}, ${lng.toFixed(5)} — Elevation: ${meters.toFixed(1)}m`);
        } catch (error) {
          console.error('Elevation lookup failed:', error);
        }
      }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

      setViewer(v);
    })();

    return () => {
      if (v && !v.isDestroyed()) v.destroy();
    };
  }, []);

  const addPin = (p: LatLng, color: Cesium.Color, label: string) => {
    if (!viewer) return;
    viewer.entities.add({
      position: Cesium.Cartesian3.fromDegrees(p.lng, p.lat),
      point: { 
        pixelSize: 12, 
        color,
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 2,
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
      },
      label: { 
        text: label, 
        pixelOffset: new Cesium.Cartesian2(0, -25), 
        scale: 0.7, 
        fillColor: color,
        font: '14pt sans-serif',
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 2
      }
    });
  };

  const drawRoute = (coords: LatLng[]) => {
    if (!viewer) return;
    const positions = coords.map(c => Cesium.Cartesian3.fromDegrees(c.lng, c.lat));
    viewer.entities.add({
      polyline: { 
        positions, 
        width: 6, 
        material: Cesium.Color.CYAN.withAlpha(0.9),
        clampToGround: true
      }
    });
    viewer.zoomTo(viewer.entities);
  };

  const clearMap = () => {
    if (!viewer) return;
    viewer.entities.removeAll();
    setEta('');
    setDistance(0);
    setElevation(null);
  };

  async function planRoute() {
    if (!viewer || !origin || !dest) return;
    
    setIsLoading(true);
    try {
      const dir = await directions(origin, dest);
      const route = dir.routes?.[0];
      if (!route) {
        console.error('No route found');
        return;
      }

      setDistance(route.distanceMeters || 0);
      setEta(route.duration || '');

      const decoded = decode(route.polyline.encodedPolyline).map(([lat, lng]) => ({ lat, lng }));

      // Optional: Snap to road for extra smoothness
      let snapped = decoded;
      try {
        const snap = await snapToRoad(decoded);
        if (snap.snappedPoints?.length) {
          snapped = snap.snappedPoints.map((s: any) => ({ 
            lat: s.location.latitude, 
            lng: s.location.longitude 
          }));
        }
      } catch (error) {
        console.warn('Road snapping failed, using raw route:', error);
      }

      clearMap();
      addPin(origin, Cesium.Color.LIME, 'Storm Team Origin');
      addPin(dest, Cesium.Color.RED, 'Damage Site');
      drawRoute(snapped);

    } catch (error) {
      console.error('Route planning failed:', error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="h-screen flex flex-col bg-slate-900 text-white">
      {/* Enhanced Toolbar */}
      <Card className="m-4 bg-slate-800 border-slate-700">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-white">
            <Navigation className="w-5 h-5 text-cyan-400" />
            Storm Operations - Route Planning & Elevation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <AddressSearch 
              label="Team Origin Location" 
              onPick={(p) => setOrigin({ lat: p.lat, lng: p.lng })} 
            />
            <AddressSearch 
              label="Damage Site Destination" 
              onPick={(p) => setDest({ lat: p.lat, lng: p.lng })} 
            />
            <div className="space-y-2">
              <Button 
                onClick={planRoute} 
                disabled={!origin || !dest || isLoading}
                className="w-full bg-cyan-600 hover:bg-cyan-700"
                data-testid="button-plan-route"
              >
                <Route className="w-4 h-4 mr-2" />
                {isLoading ? 'Planning...' : 'Plan Route'}
              </Button>
              <Button 
                onClick={clearMap} 
                variant="outline" 
                className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
                data-testid="button-clear-map"
              >
                Clear Map
              </Button>
            </div>
            <div className="space-y-2">
              {eta && (
                <Badge variant="secondary" className="flex items-center gap-1 bg-green-900 text-green-100">
                  <Clock className="w-3 h-3" />
                  ETA: {eta.replace('s', ' sec')}
                </Badge>
              )}
              {distance > 0 && (
                <Badge variant="secondary" className="flex items-center gap-1 bg-blue-900 text-blue-100">
                  <MapPin className="w-3 h-3" />
                  {(distance / 1609.34).toFixed(1)} miles
                </Badge>
              )}
              {elevation !== null && (
                <Badge variant="secondary" className="flex items-center gap-1 bg-orange-900 text-orange-100">
                  <Mountain className="w-3 h-3" />
                  {elevation.toFixed(1)}m elevation
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3D Globe */}
      <div ref={ref} className="flex-1 cesium-root" data-testid="cesium-globe" />
      
      {/* Instructions */}
      <div className="bg-slate-800 border-t border-slate-700 p-3 text-sm text-slate-300">
        <p className="text-center">
          🌍 <strong>Storm Operations Globe:</strong> Search addresses above, click "Plan Route" to see optimal paths for your team. 
          Click anywhere on the globe to get elevation data for flood risk assessment.
        </p>
      </div>
    </div>
  );
}