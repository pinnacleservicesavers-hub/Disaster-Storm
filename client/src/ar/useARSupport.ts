import { useEffect, useState } from 'react';
import 'webxr-polyfill';

export interface ARSupportInfo {
  hasWebXR: boolean;
  hasCamera: boolean;
  supportedModes: string[];
  isARSupported: boolean;
  mode: 'immersive-ar' | 'inline';
}

export function useARSupport(): ARSupportInfo {
  const [arSupport, setARSupport] = useState<ARSupportInfo>({
    hasWebXR: false,
    hasCamera: false,
    supportedModes: [],
    isARSupported: false,
    mode: 'inline'
  });

  useEffect(() => {
    async function checkARSupport() {
      let hasWebXR = false;
      let hasCamera = false;
      let supportedModes: string[] = [];
      let isARSupported = false;
      let mode: 'immersive-ar' | 'inline' = 'inline';

      // Check WebXR support
      if ('xr' in navigator) {
        try {
          hasWebXR = true;
          
          // Check for immersive-ar support
          const isImmersiveARSupported = await (navigator as any).xr?.isSessionSupported('immersive-ar');
          if (isImmersiveARSupported) {
            supportedModes.push('immersive-ar');
            isARSupported = true;
            mode = 'immersive-ar';
          }

          // Check for inline support
          const isInlineSupported = await (navigator as any).xr?.isSessionSupported('inline');
          if (isInlineSupported) {
            supportedModes.push('inline');
          }
        } catch (error) {
          console.warn('WebXR check failed:', error);
        }
      }

      // Check camera access for fallback mode
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'environment' } 
          });
          hasCamera = true;
          
          // Stop the stream immediately - we just wanted to check permission
          stream.getTracks().forEach(track => track.stop());
          
          // If no WebXR AR support, use inline mode with camera
          if (!isARSupported) {
            supportedModes.push('inline');
            mode = 'inline';
          }
        } catch (error) {
          console.warn('Camera access check failed:', error);
        }
      }

      setARSupport({
        hasWebXR,
        hasCamera,
        supportedModes,
        isARSupported: isARSupported || hasCamera,
        mode
      });
    }

    checkARSupport();
  }, []);

  return arSupport;
}

export function requestCameraPermission(): Promise<boolean> {
  return new Promise(async (resolve) => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      resolve(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      // Stop the stream immediately
      stream.getTracks().forEach(track => track.stop());
      resolve(true);
    } catch (error) {
      console.warn('Camera permission denied:', error);
      resolve(false);
    }
  });
}