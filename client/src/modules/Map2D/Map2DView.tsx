import { useEffect, useRef } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import type { Lead, Contractor } from '@/types/geo';

declare global {
  interface Window {
    google: any;
  }
}

export default function Map2DView({ leads, contractors }:{ leads: Lead[]; contractors: Contractor[]; }){
  const ref = useRef<HTMLDivElement|null>(null);

  useEffect(() => {
    (async () => {
      const loader = new Loader({ apiKey: import.meta.env.VITE_GOOGLE_MAPS_KEY as string, version: 'weekly', libraries: ['places'] });
      const { Map } = await loader.importLibrary('maps');
      const map = new Map(ref.current as HTMLDivElement, {
        center: { lat: 32.46, lng: -84.9877 },
        zoom: 8,
        mapId: 'DEMO_MAP_ID', // optional: configure a custom style in Cloud Console
        mapTypeControl: true,
        fullscreenControl: true,
        streetViewControl: true,
      });

      // Render contractors (blue) and leads (priority colors)
      const blue = '#2563eb';
      contractors.forEach(c => new window.google.maps.Marker({ position: c.location, map, title: c.name, icon: { path: window.google.maps.SymbolPath.CIRCLE, scale: 6, fillColor: blue, fillOpacity: 1, strokeWeight: 0 } }));

      const colorFor = (p: Lead['priority']) => (
        p === 'TREE_ON_HOME' ? '#e11d48' :
        p === 'TREE_ON_BUILDING' ? '#f97316' :
        p === 'TREE_ON_STRUCTURE' ? '#f59e0b' :
        p === 'CAR_ON_HOUSE' ? '#06b6d4' : '#64748b'
      );

      leads.forEach(l => new window.google.maps.Marker({ position: l.location, map, title: l.address, icon: { path: window.google.maps.SymbolPath.BACKWARD_CLOSED_ARROW, scale: 6, fillColor: colorFor(l.priority), fillOpacity: 1, strokeWeight: 0 } }));
    })();
  }, [leads, contractors]);

  return <div ref={ref} style={{ width: '100%', height: '100vh' }} data-testid="map-2d-container" />;
}