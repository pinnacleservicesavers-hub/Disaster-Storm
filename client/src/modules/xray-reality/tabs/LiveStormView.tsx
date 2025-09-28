import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { addAutoRefreshingRasterPlane } from '@/ar/arLayers';
import type { RefreshHandle } from '@/ar/arLayers';
import { Activity, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function LiveStormView() {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.Camera | null>(null);
  const frameId = useRef<number | null>(null);
  const radarHandleRef = useRef<RefreshHandle | null>(null);
  const goesHandleRef = useRef<RefreshHandle | null>(null);

  const [isInitialized, setIsInitialized] = useState(false);
  const [lastRadarUpdate, setLastRadarUpdate] = useState<Date>(new Date());
  const [lastGoesUpdate, setLastGoesUpdate] = useState<Date>(new Date());

  // Environment variables with fallbacks
  const RADAR_URL = import.meta.env.VITE_RADAR_LATEST_URL || 'https://tiles.myhost/mrms/latest_conus.png';
  const GOES_URL = import.meta.env.VITE_GOES_LATEST_URL || 'https://tiles.myhost/goes/latest_truecolor.png';

  useEffect(() => {
    if (!mountRef.current) return;

    try {
      // Scene setup
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x000022);
      sceneRef.current = scene;

      // Camera setup
      const camera = new THREE.PerspectiveCamera(
        75,
        mountRef.current.clientWidth / mountRef.current.clientHeight,
        0.1,
        1000
      );
      camera.position.set(0, 10, 15);
      camera.lookAt(0, 0, 0);
      cameraRef.current = camera;

      // Renderer setup
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
      renderer.setPixelRatio(window.devicePixelRatio);
      rendererRef.current = renderer;

      // Lighting
      const ambientLight = new THREE.AmbientLight(0x404040, 0.8);
      scene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
      directionalLight.position.set(10, 10, 5);
      scene.add(directionalLight);

      // Add grid for reference
      const gridHelper = new THREE.GridHelper(20, 20, 0x333333, 0x333333);
      scene.add(gridHelper);

      // Add auto-refreshing radar plane
      radarHandleRef.current = addAutoRefreshingRasterPlane(
        scene,
        'radar',
        () => RADAR_URL,
        {
          width: 12,
          height: 8,
          refreshMs: 45000, // 45 seconds
          position: { x: -3, y: 1, z: 0 },
          rotation: { x: -Math.PI / 2, y: 0, z: 0 }
        }
      );

      // Add auto-refreshing GOES satellite plane
      goesHandleRef.current = addAutoRefreshingRasterPlane(
        scene,
        'goes',
        () => GOES_URL,
        {
          width: 12,
          height: 8,
          refreshMs: 90000, // 90 seconds
          position: { x: 3, y: 1, z: 0 },
          rotation: { x: -Math.PI / 2, y: 0, z: 0 }
        }
      );

      mountRef.current.appendChild(renderer.domElement);

      // Animation loop
      const animate = () => {
        frameId.current = requestAnimationFrame(animate);
        
        // Rotate camera around the scene for dynamic view
        const time = Date.now() * 0.0005;
        camera.position.x = Math.cos(time) * 15;
        camera.position.z = Math.sin(time) * 15;
        camera.lookAt(0, 0, 0);
        
        renderer.render(scene, camera);
      };

      animate();
      setIsInitialized(true);

      // Track update times
      const updateInterval = setInterval(() => {
        setLastRadarUpdate(new Date());
        setLastGoesUpdate(new Date());
      }, 45000);

      return () => {
        clearInterval(updateInterval);
      };

    } catch (error) {
      console.error('Failed to initialize Live Storm View:', error);
    }

    // Cleanup
    return () => {
      if (frameId.current) {
        cancelAnimationFrame(frameId.current);
      }
      
      if (radarHandleRef.current) {
        radarHandleRef.current.cleanup();
      }
      
      if (goesHandleRef.current) {
        goesHandleRef.current.cleanup();
      }
      
      if (rendererRef.current && mountRef.current?.contains(rendererRef.current.domElement)) {
        mountRef.current.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
    };
  }, [RADAR_URL, GOES_URL]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (!mountRef.current || !rendererRef.current || !cameraRef.current) return;

      const width = mountRef.current.clientWidth;
      const height = mountRef.current.clientHeight;

      (cameraRef.current as THREE.PerspectiveCamera).aspect = width / height;
      (cameraRef.current as THREE.PerspectiveCamera).updateProjectionMatrix();

      rendererRef.current.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const forceRefresh = async () => {
    if (radarHandleRef.current) {
      await radarHandleRef.current.updateTexture();
      setLastRadarUpdate(new Date());
    }
    
    if (goesHandleRef.current) {
      await goesHandleRef.current.updateTexture();
      setLastGoesUpdate(new Date());
    }
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short'
    }).format(date);
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Activity className="h-5 w-5 text-blue-500 animate-pulse" />
            <span className="font-semibold text-gray-900 dark:text-white">Live 3D Storm View</span>
          </div>
          
          <div className="flex space-x-2">
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              Radar: 45s refresh
            </Badge>
            <Badge variant="secondary" className="bg-purple-100 text-purple-800">
              GOES: 90s refresh
            </Badge>
          </div>
        </div>

        <Button
          onClick={forceRefresh}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Force Refresh
        </Button>
      </div>

      {/* 3D Scene */}
      <Card className="bg-black border-gray-800">
        <CardContent className="p-0">
          <div 
            ref={mountRef} 
            className="w-full h-96 bg-black rounded-lg overflow-hidden relative"
          >
            {!isInitialized && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                <div className="text-center text-white">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                  <p className="text-sm">Initializing 3D storm view...</p>
                </div>
              </div>
            )}
            
            {/* Overlay info */}
            <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm rounded-lg p-3 text-white text-xs space-y-1">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                <span>Radar: {formatTime(lastRadarUpdate)}</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                <span>GOES: {formatTime(lastGoesUpdate)}</span>
              </div>
              <div className="text-gray-300 mt-2">
                Camera auto-rotating for 3D view
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-600">
              <Activity className="h-5 w-5" />
              NEXRAD Radar Data
            </CardTitle>
            <CardDescription>Live precipitation and velocity data</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Refresh Rate:</span>
                <span className="text-sm font-medium">45 seconds</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Last Update:</span>
                <span className="text-sm font-medium">{formatTime(lastRadarUpdate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Data Source:</span>
                <span className="text-sm font-medium">MRMS/NEXRAD</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-600">
              <Activity className="h-5 w-5" />
              GOES Satellite Data
            </CardTitle>
            <CardDescription>True color satellite imagery</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Refresh Rate:</span>
                <span className="text-sm font-medium">90 seconds</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Last Update:</span>
                <span className="text-sm font-medium">{formatTime(lastGoesUpdate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Data Source:</span>
                <span className="text-sm font-medium">GOES-16/17</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}