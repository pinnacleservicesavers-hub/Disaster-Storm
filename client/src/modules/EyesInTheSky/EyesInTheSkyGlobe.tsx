import { useEffect, useRef, useState } from 'react';
import * as Cesium from 'cesium';
import { directions, type LatLng } from '@/lib/google';
import { decode } from '@googlemaps/polyline-codec';
import { sampleContractors } from '@/data/sampleData';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';

export default function EyesInTheSkyGlobe() {
  const elRef = useRef<HTMLDivElement | null>(null);
  const [missingApiKey, setMissingApiKey] = useState(false);

  useEffect(() => {
    let viewer: Cesium.Viewer | undefined;
    let leadHandler: ((e: any) => void) | undefined;

    (async () => {
      const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY as string;
      if (!GOOGLE_MAPS_API_KEY) {
        console.error('Missing VITE_GOOGLE_MAPS_KEY');
        setMissingApiKey(true);
        return;
      }

      // Optional: improve lighting & performance defaults
      Cesium.Ion.defaultAccessToken = '';// not required for Google tiles
      Cesium.Camera.DEFAULT_VIEW_RECTANGLE = Cesium.Rectangle.fromDegrees(-125, 24, -66, 49);

      viewer = new Cesium.Viewer(elRef.current as HTMLDivElement, {
        animation: false,
        timeline: false,
        geocoder: false,
        homeButton: false,
        sceneModePicker: false,
        baseLayerPicker: false,
        navigationHelpButton: false,
        terrainProvider: undefined, // Google tiles include their own ground surfaces
      });

      // Load Google Photorealistic 3D Tiles (buildings/trees/terrain)
      const url = `https://tile.googleapis.com/v1/3dtiles/root.json?key=${GOOGLE_MAPS_API_KEY}`;
      const tileset = await Cesium.Cesium3DTileset.fromUrl(url);
      viewer.scene.primitives.add(tileset);

      // Fly to SE US (GA/AL/FL) on start
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(-84.9877, 32.46098, 55000), // Columbus, GA-ish
        duration: 1.6,
      });

      // Basic click handler placeholder (you can connect leads, radar overlays, etc.)
      const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
      handler.setInputAction((movement: any) => {
        const picked = viewer!.scene.pick(movement.position);
        if (picked) console.log('Picked:', picked);
      }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

      // Ops Kit methods for route drawing
      const addPin = (p: LatLng, color: Cesium.Color, label: string) => {
        viewer.entities.add({
          position: Cesium.Cartesian3.fromDegrees(p.lng, p.lat),
          point: { pixelSize: 10, color },
          label: { text: label, pixelOffset: new Cesium.Cartesian2(0, -18), scale: 0.6, fillColor: color }
        });
      };

      const drawRoute = (coords: LatLng[]) => {
        const positions = coords.map(c => Cesium.Cartesian3.fromDegrees(c.lng, c.lat));
        viewer.entities.add({
          polyline: { positions, width: 4, material: Cesium.Color.CYAN.withAlpha(0.9) }
        });
        viewer.zoomTo(viewer.entities);
      };

      // Enhanced lead handler with route drawing
      leadHandler = async (e: any) => { 
        const lead = e.detail; 
        if (!lead) return;

        // Clear existing entities
        viewer.entities.removeAll();

        // Find contractor location
        const contractor = sampleContractors.find(c => c.id === lead.bestContractorId);
        if (!contractor) return;

        // Fly to lead location
        viewer.camera.flyTo({ 
          destination: Cesium.Cartesian3.fromDegrees(lead.location.lng, lead.location.lat, 3500), 
          duration: 1.3 
        });

        // Draw route from contractor to lead
        try {
          const dir = await directions(contractor.location, lead.location);
          const route = dir.routes?.[0];
          if (route) {
            const decoded = decode(route.polyline.encodedPolyline).map(([lat,lng]) => ({ lat, lng }));
            addPin(contractor.location, Cesium.Color.LIME, contractor.name);
            addPin(lead.location, Cesium.Color.RED, 'Lead');
            drawRoute(decoded);
          }
        } catch (error) {
          console.warn('Route drawing failed:', error);
          // Fallback: just show pins
          addPin(contractor.location, Cesium.Color.LIME, contractor.name);
          addPin(lead.location, Cesium.Color.RED, 'Lead');
        }
      };
      window.addEventListener('open-lead', leadHandler);
    })();

    return () => {
      if (viewer && !viewer.isDestroyed()) viewer.destroy();
      if (leadHandler) window.removeEventListener('open-lead', leadHandler);
    };
  }, []);

  if (missingApiKey) {
    return (
      <div className="flex items-center justify-center h-full bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-900">
        <div className="text-center p-8 max-w-md">
          <AlertCircle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2">
            Google Maps API Key Required
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            The 3D Globe view requires a Google Maps API key to load the photorealistic tiles. 
            Please configure the VITE_GOOGLE_MAPS_KEY environment variable.
          </p>
          <Link href="/">
            <Button variant="outline" data-testid="button-return-home">
              Return to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return <div ref={elRef} className="cesium-root" />;
}