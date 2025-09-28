import { useEffect, useRef } from 'react';
import * as Cesium from 'cesium';

export default function EyesInTheSkyGlobe() {
  const elRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let viewer: Cesium.Viewer | undefined;

    (async () => {
      const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY as string;
      if (!GOOGLE_MAPS_API_KEY) {
        console.error('Missing VITE_GOOGLE_MAPS_KEY');
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
    })();

    return () => {
      if (viewer && !viewer.isDestroyed()) viewer.destroy();
    };
  }, []);

  return <div ref={elRef} className="cesium-root" />;
}