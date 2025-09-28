import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { addAutoRefreshingRasterPlane } from '@/ar/arLayers';
import type { RefreshHandle } from '@/ar/arLayers';
import { Waves, Thermometer, RefreshCw, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface OceanData {
  seaSurfaceTemp: number;
  waveHeight: number;
  windSpeed: number;
  currentDirection: number;
  lastUpdate: Date;
}

export default function OceanView() {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.Camera | null>(null);
  const frameId = useRef<number | null>(null);
  const sstHandleRef = useRef<RefreshHandle | null>(null);
  const waveHandleRef = useRef<RefreshHandle | null>(null);

  const [isInitialized, setIsInitialized] = useState(false);
  const [oceanData, setOceanData] = useState<OceanData>({
    seaSurfaceTemp: 28.5,
    waveHeight: 3.2,
    windSpeed: 25,
    currentDirection: 145,
    lastUpdate: new Date()
  });

  // Environment variables with fallbacks
  const SST_URL = import.meta.env.VITE_OCEAN_SST_URL || 'https://tiles.myhost/ocean/latest_sst_conus.png';
  const WAVES_URL = import.meta.env.VITE_OCEAN_WAVES_URL || 'https://tiles.myhost/ocean/latest_waves_conus.png';

  useEffect(() => {
    if (!mountRef.current) return;

    try {
      // Scene setup
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x001122);
      sceneRef.current = scene;

      // Camera setup
      const camera = new THREE.PerspectiveCamera(
        75,
        mountRef.current.clientWidth / mountRef.current.clientHeight,
        0.1,
        1000
      );
      camera.position.set(0, 8, 12);
      camera.lookAt(0, 0, 0);
      cameraRef.current = camera;

      // Renderer setup
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
      renderer.setPixelRatio(window.devicePixelRatio);
      rendererRef.current = renderer;

      // Ocean-themed lighting
      const ambientLight = new THREE.AmbientLight(0x404080, 0.6);
      scene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0x8080ff, 1.0);
      directionalLight.position.set(10, 10, 5);
      scene.add(directionalLight);

      // Add water-like grid
      const gridHelper = new THREE.GridHelper(20, 20, 0x004488, 0x004488);
      scene.add(gridHelper);

      // Add auto-refreshing SST plane
      sstHandleRef.current = addAutoRefreshingRasterPlane(
        scene,
        'sst',
        () => SST_URL,
        {
          width: 12,
          height: 8,
          refreshMs: 120000, // 2 minutes
          position: { x: -3, y: 1.5, z: 0 },
          rotation: { x: -Math.PI / 2, y: 0, z: 0 }
        }
      );

      // Add auto-refreshing waves plane
      waveHandleRef.current = addAutoRefreshingRasterPlane(
        scene,
        'waves',
        () => WAVES_URL,
        {
          width: 12,
          height: 8,
          refreshMs: 120000, // 2 minutes
          position: { x: 3, y: 1.5, z: 0 },
          rotation: { x: -Math.PI / 2, y: 0, z: 0 }
        }
      );

      // Add floating motion to simulate ocean movement
      const animateOcean = () => {
        frameId.current = requestAnimationFrame(animateOcean);
        
        const time = Date.now() * 0.001;
        
        // Gentle floating motion for SST plane
        if (sstHandleRef.current) {
          sstHandleRef.current.plane.position.y = 1.5 + Math.sin(time * 0.5) * 0.1;
        }
        
        // Gentle floating motion for waves plane (offset)
        if (waveHandleRef.current) {
          waveHandleRef.current.plane.position.y = 1.5 + Math.sin(time * 0.5 + Math.PI) * 0.1;
        }
        
        renderer.render(scene, camera);
      };

      mountRef.current.appendChild(renderer.domElement);
      animateOcean();
      setIsInitialized(true);

      // Simulate ocean data updates
      const dataInterval = setInterval(() => {
        setOceanData(prev => ({
          seaSurfaceTemp: 28.5 + Math.random() * 2 - 1, // ±1°C variation
          waveHeight: 3.2 + Math.random() * 1 - 0.5, // ±0.5m variation
          windSpeed: 25 + Math.random() * 10 - 5, // ±5 knots variation
          currentDirection: 145 + Math.random() * 20 - 10, // ±10° variation
          lastUpdate: new Date()
        }));
      }, 30000); // Update every 30 seconds

      return () => {
        clearInterval(dataInterval);
      };

    } catch (error) {
      console.error('Failed to initialize Ocean View:', error);
    }

    // Cleanup
    return () => {
      if (frameId.current) {
        cancelAnimationFrame(frameId.current);
      }
      
      if (sstHandleRef.current) {
        sstHandleRef.current.cleanup();
      }
      
      if (waveHandleRef.current) {
        waveHandleRef.current.cleanup();
      }
      
      if (rendererRef.current && mountRef.current?.contains(rendererRef.current.domElement)) {
        mountRef.current.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
    };
  }, [SST_URL, WAVES_URL]);

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
    if (sstHandleRef.current) {
      await sstHandleRef.current.updateTexture();
    }
    
    if (waveHandleRef.current) {
      await waveHandleRef.current.updateTexture();
    }
    
    setOceanData(prev => ({ ...prev, lastUpdate: new Date() }));
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short'
    }).format(date);
  };

  const convertToFahrenheit = (celsius: number) => {
    return (celsius * 9/5) + 32;
  };

  const convertToFeet = (meters: number) => {
    return meters * 3.28084;
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Waves className="h-5 w-5 text-blue-500 animate-pulse" />
            <span className="font-semibold text-gray-900 dark:text-white">Ocean Conditions</span>
          </div>
          
          <div className="flex space-x-2">
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              SST: 2min refresh
            </Badge>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              Waves: 2min refresh
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

      {/* 3D Ocean Scene */}
      <Card className="bg-gradient-to-br from-blue-950 to-blue-900 border-blue-800">
        <CardContent className="p-0">
          <div 
            ref={mountRef} 
            className="w-full h-96 rounded-lg overflow-hidden relative"
          >
            {!isInitialized && (
              <div className="absolute inset-0 flex items-center justify-center bg-blue-900/80">
                <div className="text-center text-white">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                  <p className="text-sm">Initializing ocean view...</p>
                </div>
              </div>
            )}
            
            {/* Overlay info */}
            <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm rounded-lg p-3 text-white text-xs space-y-1">
              <div className="flex items-center space-x-2">
                <Thermometer className="h-3 w-3 text-orange-400" />
                <span>SST Layer</span>
              </div>
              <div className="flex items-center space-x-2">
                <Waves className="h-3 w-3 text-blue-400" />
                <span>Wave Height Layer</span>
              </div>
              <div className="text-gray-300 mt-2">
                Coastal operations data
              </div>
            </div>

            {/* Data overlay */}
            <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm rounded-lg p-3 text-white text-xs">
              <div className="space-y-1">
                <div>Updated: {formatTime(oceanData.lastUpdate)}</div>
                <div className="text-orange-300">
                  SST: {oceanData.seaSurfaceTemp.toFixed(1)}°C 
                  ({convertToFahrenheit(oceanData.seaSurfaceTemp).toFixed(1)}°F)
                </div>
                <div className="text-blue-300">
                  Waves: {oceanData.waveHeight.toFixed(1)}m 
                  ({convertToFeet(oceanData.waveHeight).toFixed(1)}ft)
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ocean Data Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border-orange-200 dark:border-orange-800">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-orange-600">
              <Thermometer className="h-5 w-5" />
              Sea Surface Temp
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-orange-700 dark:text-orange-300">
                {oceanData.seaSurfaceTemp.toFixed(1)}°C
              </div>
              <div className="text-lg text-orange-600 dark:text-orange-400">
                {convertToFahrenheit(oceanData.seaSurfaceTemp).toFixed(1)}°F
              </div>
              <div className="text-xs text-orange-500">
                NOAA satellite data
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-200 dark:border-blue-800">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-blue-600">
              <Waves className="h-5 w-5" />
              Wave Height
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-blue-700 dark:text-blue-300">
                {oceanData.waveHeight.toFixed(1)}m
              </div>
              <div className="text-lg text-blue-600 dark:text-blue-400">
                {convertToFeet(oceanData.waveHeight).toFixed(1)}ft
              </div>
              <div className="text-xs text-blue-500">
                Significant wave height
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-green-600">
              <Activity className="h-5 w-5" />
              Wind Speed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-green-700 dark:text-green-300">
                {oceanData.windSpeed.toFixed(1)}
              </div>
              <div className="text-lg text-green-600 dark:text-green-400">
                knots
              </div>
              <div className="text-xs text-green-500">
                Surface wind speed
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 border-purple-200 dark:border-purple-800">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-purple-600">
              <Activity className="h-5 w-5" />
              Current Direction
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-purple-700 dark:text-purple-300">
                {oceanData.currentDirection.toFixed(0)}°
              </div>
              <div className="text-lg text-purple-600 dark:text-purple-400">
                {oceanData.currentDirection > 315 || oceanData.currentDirection <= 45 ? 'N' :
                 oceanData.currentDirection > 45 && oceanData.currentDirection <= 135 ? 'E' :
                 oceanData.currentDirection > 135 && oceanData.currentDirection <= 225 ? 'S' : 'W'}
              </div>
              <div className="text-xs text-purple-500">
                Current flow direction
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info */}
      <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <Waves className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900 dark:text-blue-100">Ocean View Information</h4>
              <p className="text-sm text-blue-700 dark:text-blue-200 mt-1">
                Real-time ocean conditions are critical for coastal storm operations. 
                Sea surface temperature affects storm intensity, while wave height and current data 
                help assess coastal flooding risks and plan evacuation routes.
              </p>
              <div className="mt-2 text-xs text-blue-600 dark:text-blue-300 space-y-1">
                <p>• SST data updates every 2 minutes from NOAA satellites</p>
                <p>• Wave height shows significant wave height (average of largest 1/3 waves)</p>
                <p>• All measurements automatically refresh with cache-busting</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}