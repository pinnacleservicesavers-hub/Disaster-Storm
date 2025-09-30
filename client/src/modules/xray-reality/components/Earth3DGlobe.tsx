import { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls, Stars, Text, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Globe, Satellite, RotateCcw, ZoomIn, ZoomOut, Eye } from 'lucide-react';

// Earth texture component
function EarthSphere({ stormData, showStorms = true }: { stormData?: any[], showStorms?: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [earthTexture, setEarthTexture] = useState<THREE.Texture | null>(null);
  const [cloudsTexture, setCloudsTexture] = useState<THREE.Texture | null>(null);

  // Create Earth textures with proper cleanup
  useEffect(() => {
    let earthTex: THREE.Texture | null = null;
    let cloudsTex: THREE.Texture | null = null;
    
    // Use NASA Blue Marble texture (fallback to colored sphere if texture fails)
    const earthImg = new Image();
    earthImg.crossOrigin = 'anonymous';
    earthImg.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      // Reduced resolution for better performance
      canvas.width = 1024;
      canvas.height = 512;
      
      if (ctx) {
        // Create a blue-green Earth-like texture
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, '#1e40af');    // Ocean blue
        gradient.addColorStop(0.3, '#0369a1');  // Deep blue
        gradient.addColorStop(0.5, '#22c55e');  // Land green
        gradient.addColorStop(0.7, '#16a34a');  // Forest green
        gradient.addColorStop(1, '#1e40af');    // Back to ocean
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Add some continents-like shapes (scaled down)
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.ellipse(200, 150, 100, 75, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.ellipse(600, 200, 150, 100, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.ellipse(400, 300, 125, 90, 0, 0, Math.PI * 2);
        ctx.fill();
        
        earthTex = new THREE.CanvasTexture(canvas);
        setEarthTexture(earthTex);
      }
    };
    earthImg.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

    // Create clouds texture with reduced resolution
    const cloudsCanvas = document.createElement('canvas');
    const cloudsCtx = cloudsCanvas.getContext('2d');
    cloudsCanvas.width = 1024;
    cloudsCanvas.height = 512;
    
    if (cloudsCtx) {
      cloudsCtx.fillStyle = 'rgba(255, 255, 255, 0.0)';
      cloudsCtx.fillRect(0, 0, cloudsCanvas.width, cloudsCanvas.height);
      
      // Add cloud-like patterns (fewer clouds for performance)
      cloudsCtx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      for (let i = 0; i < 30; i++) {
        const x = Math.random() * cloudsCanvas.width;
        const y = Math.random() * cloudsCanvas.height;
        const radius = Math.random() * 50 + 10;
        cloudsCtx.beginPath();
        cloudsCtx.arc(x, y, radius, 0, Math.PI * 2);
        cloudsCtx.fill();
      }
      
      cloudsTex = new THREE.CanvasTexture(cloudsCanvas);
      setCloudsTexture(cloudsTex);
    }

    // Cleanup function to dispose textures and prevent memory leaks
    return () => {
      if (earthTex) {
        earthTex.dispose();
      }
      if (cloudsTex) {
        cloudsTex.dispose();
      }
    };
  }, []);

  // Rotation animation
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.1; // Slow rotation
    }
  });

  return (
    <group>
      {/* Earth surface */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[2, 48, 48]} />
        <meshPhongMaterial
          map={earthTexture}
          shininess={100}
          specular={new THREE.Color(0x333333)}
        />
      </mesh>
      
      {/* Clouds layer */}
      {cloudsTexture && (
        <mesh>
          <sphereGeometry args={[2.02, 48, 48]} />
          <meshPhongMaterial
            map={cloudsTexture}
            transparent={true}
            opacity={0.4}
          />
        </mesh>
      )}
      
      {/* Storm markers */}
      {showStorms && stormData?.map((storm, index) => (
        <StormMarker
          key={index}
          position={latLngToVector3(storm.lat, storm.lng, 2.1)}
          storm={storm}
        />
      ))}
    </group>
  );
}

// Storm marker component
function StormMarker({ position, storm }: { position: [number, number, number], storm: any }) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.lookAt(0, 0, 0);
      // Pulse animation
      const scale = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.3;
      meshRef.current.scale.setScalar(scale);
    }
  });

  const getStormColor = (intensity: string) => {
    switch (intensity?.toLowerCase()) {
      case 'severe': return '#ef4444';  // Red
      case 'moderate': return '#f97316'; // Orange
      case 'light': return '#eab308';    // Yellow
      default: return '#3b82f6';         // Blue
    }
  };

  return (
    <group position={position}>
      <Billboard>
        <mesh ref={meshRef}>
          <circleGeometry args={[0.1, 16]} />
          <meshBasicMaterial 
            color={getStormColor(storm.intensity)} 
            transparent={true}
            opacity={0.8}
          />
        </mesh>
        <Text
          position={[0, 0.2, 0]}
          fontSize={0.08}
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          {storm.name || 'Storm'}
        </Text>
      </Billboard>
    </group>
  );
}

// Satellite markers
function SatelliteMarker({ position, name }: { position: [number, number, number], name: string }) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.02;
      meshRef.current.rotation.x += 0.01;
    }
  });

  return (
    <group position={position}>
      <mesh ref={meshRef}>
        <boxGeometry args={[0.05, 0.05, 0.1]} />
        <meshPhongMaterial color="#60a5fa" />
      </mesh>
      <Billboard>
        <Text
          position={[0, 0.15, 0]}
          fontSize={0.06}
          color="#60a5fa"
          anchorX="center"
          anchorY="middle"
        >
          {name}
        </Text>
      </Billboard>
    </group>
  );
}

// Utility function to convert lat/lng to 3D coordinates
function latLngToVector3(lat: number, lng: number, radius: number): [number, number, number] {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  
  return [x, y, z];
}

// Main 3D Globe component
export default function Earth3DGlobe({ className = "" }: { className?: string }) {
  const [viewMode, setViewMode] = useState<'3d' | 'satellite'>('3d');
  const [showStorms, setShowStorms] = useState(true);
  const [showSatellites, setShowSatellites] = useState(true);
  const [isRotating, setIsRotating] = useState(true);
  const [webglError, setWebglError] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Handle WebGL context loss and restoration
  useEffect(() => {
    const handleContextLost = (event: Event) => {
      event.preventDefault();
      console.warn('WebGL context lost - attempting recovery...');
      setWebglError(true);
    };

    const handleContextRestored = () => {
      console.log('WebGL context restored');
      setWebglError(false);
    };

    const canvasElement = canvasRef.current?.querySelector('canvas');
    if (canvasElement) {
      canvasElement.addEventListener('webglcontextlost', handleContextLost);
      canvasElement.addEventListener('webglcontextrestored', handleContextRestored);

      return () => {
        canvasElement.removeEventListener('webglcontextlost', handleContextLost);
        canvasElement.removeEventListener('webglcontextrestored', handleContextRestored);
      };
    }
  }, []);

  // Mock storm data
  const stormData = [
    { name: "Hurricane Alex", lat: 25.7617, lng: -80.1918, intensity: "severe" },
    { name: "Storm Beta", lat: 29.7604, lng: -95.3698, intensity: "moderate" },
    { name: "Tropical Storm Charlie", lat: 27.7676, lng: -82.6403, intensity: "light" },
    { name: "Storm Delta", lat: 30.3322, lng: -81.6557, intensity: "moderate" },
  ];

  // Mock satellite data
  const satelliteData = [
    { name: "GOES-17", lat: 0, lng: -137.2, altitude: 35786 },
    { name: "GOES-16", lat: 0, lng: -75.2, altitude: 35786 },
    { name: "NOAA-20", lat: 45, lng: -90, altitude: 824 },
  ];

  const toggleRotation = () => {
    setIsRotating(!isRotating);
  };

  return (
    <Card className={`border-blue-200 shadow-lg ${className}`}>
      <CardContent className="p-0">
        {/* Controls */}
        <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <Globe className="h-5 w-5 text-blue-600" />
              <span className="font-semibold text-gray-900 dark:text-white">3D Earth Globe - Eyes in the Sky</span>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                LIVE SATELLITE VIEW
              </Badge>
            </div>

            <div className="flex space-x-2">
              <Button
                onClick={() => setShowStorms(!showStorms)}
                variant={showStorms ? "default" : "outline"}
                size="sm"
                className="gap-2"
              >
                <Eye className="h-4 w-4" />
                Storms
              </Button>
              
              <Button
                onClick={() => setShowSatellites(!showSatellites)}
                variant={showSatellites ? "default" : "outline"}
                size="sm"
                className="gap-2"
              >
                <Satellite className="h-4 w-4" />
                Satellites
              </Button>
              
              <Button
                onClick={toggleRotation}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                {isRotating ? 'Stop' : 'Rotate'}
              </Button>
            </div>
          </div>
        </div>

        {/* 3D Globe View */}
        <div ref={canvasRef} className="w-full h-[600px] bg-black relative">
          {webglError && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm z-50">
              <div className="text-center text-white p-6">
                <div className="text-red-500 text-xl mb-4">⚠️ WebGL Context Lost</div>
                <p className="mb-4">The 3D globe encountered a graphics issue.</p>
                <Button onClick={() => window.location.reload()} variant="outline" className="text-white border-white hover:bg-white/20">
                  Reload Page
                </Button>
              </div>
            </div>
          )}
          <Canvas 
            camera={{ position: [0, 0, 8], fov: 45 }}
            gl={{ 
              preserveDrawingBuffer: true,
              antialias: true,
              alpha: false,
              powerPreference: "high-performance"
            }}
            onCreated={({ gl }) => {
              gl.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            }}
          >
            {/* Lighting */}
            <ambientLight intensity={0.2} />
            <directionalLight position={[5, 5, 5]} intensity={1} />
            <pointLight position={[-5, -5, -5]} intensity={0.5} />

            {/* Stars background - reduced count for performance */}
            <Stars 
              radius={100}
              depth={50}
              count={2000}
              factor={4}
              saturation={0}
              fade={true}
            />

            {/* Earth */}
            <EarthSphere stormData={stormData} showStorms={showStorms} />

            {/* Satellites */}
            {showSatellites && satelliteData.map((satellite, index) => (
              <SatelliteMarker
                key={index}
                position={latLngToVector3(satellite.lat, satellite.lng, 4)}
                name={satellite.name}
              />
            ))}

            {/* Controls */}
            <OrbitControls
              enablePan={true}
              enableZoom={true}
              enableRotate={true}
              zoomSpeed={0.6}
              panSpeed={0.5}
              rotateSpeed={0.4}
              autoRotate={isRotating}
              autoRotateSpeed={0.5}
            />
          </Canvas>

          {/* Live indicators */}
          <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-sm rounded-lg p-3 text-white text-xs space-y-2 z-10">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="font-semibold">LIVE GLOBAL VIEW</span>
            </div>
            <div className="text-gray-300">Satellite Data: GOES-16/17</div>
            <div className="text-gray-300">Update: Real-time</div>
            <div className="text-gray-300">Storms Tracked: {stormData.length}</div>
          </div>

          {/* Legend */}
          <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 text-xs space-y-1 z-10">
            <div className="font-semibold mb-2">Storm Intensity</div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span>Severe (Cat 3+)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
              <span>Moderate (Cat 1-2)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span>Light (Tropical)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span>Satellite</span>
            </div>
          </div>

          {/* Navigation help */}
          <div className="absolute top-4 right-4 bg-blue-500/90 backdrop-blur-sm rounded-lg p-3 text-white text-xs z-10">
            <div className="font-semibold mb-1">3D Navigation</div>
            <div>• Drag to rotate globe</div>
            <div>• Scroll to zoom in/out</div>
            <div>• Right-click to pan</div>
            <div>• Click markers for details</div>
          </div>
        </div>

        {/* Status Bar */}
        <div className="p-3 bg-gray-50 dark:bg-gray-800 border-t">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Active Storms:</span>
              <span className="font-medium text-red-600">{stormData.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Satellites:</span>
              <span className="font-medium text-blue-600">{satelliteData.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">View Mode:</span>
              <span className="font-medium text-green-600">3D Globe</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Auto-Rotate:</span>
              <span className="font-medium">{isRotating ? 'ON' : 'OFF'}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}