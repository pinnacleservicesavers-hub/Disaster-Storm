import * as THREE from 'three';

export interface AutoRefreshOptions {
  width?: number;
  height?: number;
  refreshMs?: number;
  position?: { x: number; y: number; z: number };
  rotation?: { x: number; y: number; z: number };
}

export interface RefreshHandle {
  cleanup: () => void;
  plane: THREE.Mesh;
  updateTexture: () => Promise<void>;
}

/**
 * Adds an auto-refreshing raster plane to the scene
 */
export function addAutoRefreshingRasterPlane(
  scene: THREE.Scene,
  id: string,
  urlBuilder: () => string,
  options: AutoRefreshOptions = {}
): RefreshHandle {
  const {
    width = 10,
    height = 10,
    refreshMs = 60000, // 1 minute default
    position = { x: 0, y: 0, z: 0 },
    rotation = { x: 0, y: 0, z: 0 }
  } = options;

  // Create plane geometry and material
  const geometry = new THREE.PlaneGeometry(width, height);
  const material = new THREE.MeshBasicMaterial({ 
    transparent: true,
    opacity: 0.8,
    side: THREE.DoubleSide
  });
  
  const plane = new THREE.Mesh(geometry, material);
  plane.position.set(position.x, position.y, position.z);
  plane.rotation.set(rotation.x, rotation.y, rotation.z);
  plane.name = `${id}-plane`;
  
  scene.add(plane);

  let intervalId: NodeJS.Timeout | null = null;
  let isUpdating = false;

  const updateTexture = async (): Promise<void> => {
    if (isUpdating) return;
    isUpdating = true;

    try {
      const url = urlBuilder();
      const cacheBustedUrl = `${url}${url.includes('?') ? '&' : '?'}_=${Date.now()}`;
      
      const loader = new THREE.TextureLoader();
      const texture = await new Promise<THREE.Texture>((resolve, reject) => {
        loader.load(
          cacheBustedUrl,
          resolve,
          undefined,
          reject
        );
      });

      // Dispose of old texture to prevent memory leaks
      if (material.map) {
        material.map.dispose();
      }

      material.map = texture;
      material.needsUpdate = true;
      
      console.log(`Updated texture for ${id} at ${new Date().toISOString()}`);
    } catch (error) {
      console.warn(`Failed to update texture for ${id}:`, error);
    } finally {
      isUpdating = false;
    }
  };

  // Initial load
  updateTexture();

  // Set up auto-refresh
  if (refreshMs > 0) {
    intervalId = setInterval(updateTexture, refreshMs);
  }

  const cleanup = () => {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
    
    // Dispose of resources
    if (material.map) {
      material.map.dispose();
    }
    material.dispose();
    geometry.dispose();
    
    // Remove from scene
    scene.remove(plane);
  };

  return {
    cleanup,
    plane,
    updateTexture
  };
}

/**
 * Adds a geo marker to the scene
 */
export function addGeoMarker(
  scene: THREE.Scene,
  lat: number,
  lng: number,
  alt: number = 0,
  options: { 
    color?: number;
    size?: number;
    label?: string;
  } = {}
): THREE.Group {
  const { color = 0xff0000, size = 0.5, label } = options;

  const group = new THREE.Group();
  
  // Create marker geometry (sphere)
  const geometry = new THREE.SphereGeometry(size, 16, 16);
  const material = new THREE.MeshBasicMaterial({ color });
  const marker = new THREE.Mesh(geometry, material);
  
  // Simple lat/lng to world position conversion (for demo purposes)
  // In production, you'd want proper projection
  const x = lng * 0.1; // Scale factor for demo
  const z = -lat * 0.1; // Scale factor for demo
  const y = alt * 0.01; // Scale factor for demo
  
  marker.position.set(x, y, z);
  group.add(marker);

  // Add label if provided
  if (label) {
    // Create text label (simplified - in production use troika-three-text or similar)
    const labelGeometry = new THREE.PlaneGeometry(2, 0.5);
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const context = canvas.getContext('2d')!;
    context.fillStyle = 'rgba(255, 255, 255, 0.8)';
    context.fillRect(0, 0, 256, 64);
    context.fillStyle = 'black';
    context.font = '16px Arial';
    context.fillText(label, 10, 32);
    
    const labelTexture = new THREE.CanvasTexture(canvas);
    const labelMaterial = new THREE.MeshBasicMaterial({ 
      map: labelTexture,
      transparent: true
    });
    const labelMesh = new THREE.Mesh(labelGeometry, labelMaterial);
    labelMesh.position.set(x, y + size + 0.5, z);
    labelMesh.lookAt(0, y + size + 0.5, 0); // Face camera
    group.add(labelMesh);
  }

  scene.add(group);
  return group;
}

/**
 * Adds a cut line to the scene
 */
export function addCutLine(
  scene: THREE.Scene,
  coords: Array<{ lat: number; lng: number; alt?: number }>,
  options: {
    color?: number;
    lineWidth?: number;
  } = {}
): THREE.Line {
  const { color = 0x00ff00, lineWidth = 2 } = options;

  const points: THREE.Vector3[] = coords.map(coord => {
    // Simple lat/lng to world position conversion
    const x = coord.lng * 0.1;
    const z = -coord.lat * 0.1;
    const y = (coord.alt || 0) * 0.01;
    return new THREE.Vector3(x, y, z);
  });

  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({ 
    color,
    linewidth: lineWidth // Note: linewidth may not work on all platforms
  });

  const line = new THREE.Line(geometry, material);
  scene.add(line);
  
  return line;
}

/**
 * Utility to convert lat/lng to world coordinates
 * This is a simplified version - in production you'd use proper map projections
 */
export function latLngToWorld(lat: number, lng: number, alt: number = 0): THREE.Vector3 {
  const x = lng * 0.1;
  const z = -lat * 0.1;
  const y = alt * 0.01;
  return new THREE.Vector3(x, y, z);
}