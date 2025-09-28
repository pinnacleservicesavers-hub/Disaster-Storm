import { useEffect, useRef, useState } from 'react';
import * as Cesium from 'cesium';

interface EyesInTheSkyGlobeProps {
  className?: string;
  height?: string;
}

export default function EyesInTheSkyGlobe({ 
  className = "w-full", 
  height = "100vh" 
}: EyesInTheSkyGlobeProps) {
  const cesiumContainerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Cesium.Viewer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!cesiumContainerRef.current) return;

    const initializeCesium = async () => {
      try {
        // Your Google Maps API key here
        const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY;

        if (!GOOGLE_MAPS_API_KEY) {
          console.warn('Google Maps API key not found. Using default terrain.');
        }

        // Create Cesium viewer
        const viewer = new Cesium.Viewer(cesiumContainerRef.current!, {
          terrainProvider: await Cesium.createWorldTerrainAsync(),
          animation: false,
          baseLayerPicker: true,
          fullscreenButton: false,
          geocoder: false,
          homeButton: true,
          infoBox: true,
          sceneModePicker: true,
          selectionIndicator: true,
          timeline: false,
          navigationHelpButton: false,
          scene3DOnly: false
        });

        viewerRef.current = viewer;

        // Add Google Photorealistic 3D Tiles if API key is available
        if (GOOGLE_MAPS_API_KEY) {
          try {
            const tileset = await Cesium.Cesium3DTileset.fromUrl(
              `https://tile.googleapis.com/v1/3dtiles/root.json?key=${GOOGLE_MAPS_API_KEY}`
            );
            viewer.scene.primitives.add(tileset);
          } catch (tilesetError) {
            console.warn('Failed to load Google 3D Tiles:', tilesetError);
          }
        }

        // Set initial camera position (global view)
        viewer.camera.setView({
          destination: Cesium.Cartesian3.fromDegrees(-95.0, 40.0, 15000000.0)
        });

        // Add storm tracking entities
        const dataSource = new Cesium.CustomDataSource('storm-tracking');
        
        // Hurricane example
        const hurricane = dataSource.entities.add({
          position: Cesium.Cartesian3.fromDegrees(-80.0, 25.0),
          point: {
            pixelSize: 20,
            color: Cesium.Color.RED,
            outlineColor: Cesium.Color.WHITE,
            outlineWidth: 2,
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
          },
          label: {
            text: 'Hurricane Alexandra',
            font: '14pt sans-serif',
            fillColor: Cesium.Color.WHITE,
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 2,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            pixelOffset: new Cesium.Cartesian2(0, -40),
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
          }
        });

        // Storm path
        const stormPath = dataSource.entities.add({
          polyline: {
            positions: Cesium.Cartesian3.fromDegreesArray([
              -85.0, 20.0,
              -82.0, 23.0,
              -80.0, 25.0,
              -78.0, 27.0,
              -76.0, 29.0
            ]),
            width: 5,
            material: Cesium.Color.YELLOW.withAlpha(0.8),
            clampToGround: true
          },
          name: 'Storm Path'
        });

        // Add satellite tracking
        const satellite = dataSource.entities.add({
          position: Cesium.Cartesian3.fromDegrees(-95.0, 40.0, 500000),
          point: {
            pixelSize: 15,
            color: Cesium.Color.CYAN,
            outlineColor: Cesium.Color.WHITE,
            outlineWidth: 2
          },
          label: {
            text: 'Weather Satellite',
            font: '12pt sans-serif',
            fillColor: Cesium.Color.CYAN,
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 2,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            pixelOffset: new Cesium.Cartesian2(0, -30)
          }
        });

        viewer.dataSources.add(dataSource);

        // Add weather overlay (WMS layer example)
        const weatherLayer = viewer.imageryLayers.addImageryProvider(
          new Cesium.WebMapServiceImageryProvider({
            url: 'https://mesonet.agron.iastate.edu/cgi-bin/wms/nexrad/n0r.cgi',
            layers: 'nexrad-n0r-900913',
            parameters: {
              transparent: true,
              format: 'image/png'
            },
            credit: 'Iowa Environmental Mesonet'
          })
        );
        
        // Set weather layer transparency
        weatherLayer.alpha = 0.6;

        setIsLoading(false);

      } catch (err) {
        console.error('Failed to initialize Cesium:', err);
        setError('Failed to initialize 3D globe. Please check your browser compatibility.');
        setIsLoading(false);
      }
    };

    initializeCesium();

    // Cleanup function
    return () => {
      if (viewerRef.current) {
        viewerRef.current.destroy();
        viewerRef.current = null;
      }
    };
  }, []);

  if (error) {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg`} style={{ height }}>
        <div className="text-center p-6">
          <div className="text-red-500 mb-2">⚠️</div>
          <p className="text-gray-600 dark:text-gray-300">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={className} style={{ height }}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
            <p className="text-gray-600 dark:text-gray-300">Loading 3D Globe...</p>
          </div>
        </div>
      )}
      <div 
        ref={cesiumContainerRef} 
        className="w-full h-full rounded-lg overflow-hidden"
        style={{ height: '100%' }}
        id="cesiumContainer"
      />
    </div>
  );
}