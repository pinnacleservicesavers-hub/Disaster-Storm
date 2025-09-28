import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { useARSupport } from './useARSupport';

export interface AROverlay {
  id: string;
  type: 'marker' | 'line' | 'measurement';
  data: any;
}

export interface UniversalARProps {
  title?: string;
  overlays?: AROverlay[];
  onOverlayAdd?: (overlay: AROverlay) => void;
  children?: React.ReactNode;
  className?: string;
}

export default function UniversalAR({ 
  title = "AR View", 
  overlays = [],
  onOverlayAdd,
  children,
  className = "w-full h-96"
}: UniversalARProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.Camera | null>(null);
  const frameId = useRef<number | null>(null);
  
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const arSupport = useARSupport();

  // Initialize Three.js scene
  useEffect(() => {
    if (!mountRef.current) return;

    try {
      // Scene
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x000011);
      sceneRef.current = scene;

      // Camera
      const camera = new THREE.PerspectiveCamera(
        75,
        mountRef.current.clientWidth / mountRef.current.clientHeight,
        0.1,
        1000
      );
      camera.position.set(0, 5, 10);
      camera.lookAt(0, 0, 0);
      cameraRef.current = camera;

      // Renderer
      const renderer = new THREE.WebGLRenderer({ 
        antialias: true,
        alpha: true 
      });
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.xr.enabled = true;
      rendererRef.current = renderer;

      // Add some basic lighting
      const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
      scene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
      directionalLight.position.set(10, 10, 5);
      scene.add(directionalLight);

      // Add a grid for reference
      const gridHelper = new THREE.GridHelper(20, 20, 0x444444, 0x444444);
      scene.add(gridHelper);

      mountRef.current.appendChild(renderer.domElement);

      // Animation loop
      const animate = () => {
        frameId.current = requestAnimationFrame(animate);
        renderer.render(scene, camera);
      };

      animate();
      setIsInitialized(true);

    } catch (err) {
      console.error('Failed to initialize AR scene:', err);
      setError('Failed to initialize AR scene');
    }

    // Cleanup
    return () => {
      if (frameId.current) {
        cancelAnimationFrame(frameId.current);
      }
      
      if (rendererRef.current && mountRef.current?.contains(rendererRef.current.domElement)) {
        mountRef.current.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
    };
  }, []);

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

  // Update overlays when they change
  useEffect(() => {
    if (!sceneRef.current || !isInitialized) return;

    // Clear existing overlays (simplified - in production track by ID)
    const existingOverlays = sceneRef.current.children.filter(child => 
      child.name.startsWith('overlay-')
    );
    existingOverlays.forEach(overlay => {
      sceneRef.current!.remove(overlay);
    });

    // Add new overlays
    overlays.forEach(overlay => {
      switch (overlay.type) {
        case 'marker':
          const markerGeometry = new THREE.SphereGeometry(0.1, 16, 16);
          const markerMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
          const marker = new THREE.Mesh(markerGeometry, markerMaterial);
          marker.position.set(
            overlay.data.x || 0,
            overlay.data.y || 0,
            overlay.data.z || 0
          );
          marker.name = `overlay-${overlay.id}`;
          sceneRef.current!.add(marker);
          break;

        case 'line':
          if (overlay.data.points && overlay.data.points.length >= 2) {
            const points = overlay.data.points.map((p: any) => 
              new THREE.Vector3(p.x || 0, p.y || 0, p.z || 0)
            );
            const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
            const lineMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00 });
            const line = new THREE.Line(lineGeometry, lineMaterial);
            line.name = `overlay-${overlay.id}`;
            sceneRef.current!.add(line);
          }
          break;

        case 'measurement':
          // Add measurement visualization (stub)
          const measureGeometry = new THREE.CylinderGeometry(0.02, 0.02, overlay.data.distance || 1);
          const measureMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff });
          const measure = new THREE.Mesh(measureGeometry, measureMaterial);
          measure.position.set(
            overlay.data.x || 0,
            overlay.data.y || 0.5,
            overlay.data.z || 0
          );
          measure.name = `overlay-${overlay.id}`;
          sceneRef.current!.add(measure);
          break;
      }
    });
  }, [overlays, isInitialized]);

  if (error) {
    return (
      <div className={`${className} flex items-center justify-center bg-red-50 border border-red-200 rounded-lg`}>
        <div className="text-center text-red-600">
          <p className="font-medium">AR Initialization Failed</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className} relative bg-black rounded-lg overflow-hidden`}>
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-black/50 backdrop-blur-sm p-4">
        <div className="flex items-center justify-between text-white">
          <div>
            <h3 className="font-semibold">{title}</h3>
            <p className="text-xs opacity-75">
              Mode: {arSupport.mode} | AR: {arSupport.isARSupported ? 'Yes' : 'No'}
            </p>
          </div>
          {arSupport.isARSupported && (
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-xs">AR Ready</span>
            </div>
          )}
        </div>
      </div>

      {/* Three.js mount point */}
      <div ref={mountRef} className="w-full h-full" />

      {/* Loading overlay */}
      {!isInitialized && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
          <div className="text-center text-white">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
            <p className="text-sm">Initializing AR...</p>
          </div>
        </div>
      )}

      {/* Additional content */}
      {children && (
        <div className="absolute bottom-0 left-0 right-0 z-10 p-4">
          {children}
        </div>
      )}
    </div>
  );
}

// Export the scene reference for external access
export function getARScene(): THREE.Scene | null {
  return null; // Will be enhanced in production
}