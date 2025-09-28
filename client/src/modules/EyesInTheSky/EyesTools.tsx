import { useEffect, useRef, useState } from 'react';
import * as Cesium from 'cesium';
import AddressSearch from '@/components/AddressSearch';
import { directions, elevationFor, snapToRoad, type LatLng } from '@/lib/google';
import { decode } from '@googlemaps/polyline-codec';

export default function EyesTools(){
  const ref = useRef<HTMLDivElement|null>(null);
  const [viewer, setViewer] = useState<Cesium.Viewer|null>(null);
  const [origin, setOrigin] = useState<LatLng|null>(null);
  const [dest, setDest] = useState<LatLng|null>(null);
  const [eta, setEta] = useState<string>('');
  const [distance, setDistance] = useState<number>(0);

  useEffect(() => {
    let v: Cesium.Viewer;
    (async () => {
      const key = import.meta.env.VITE_GOOGLE_MAPS_KEY as string;
      v = new Cesium.Viewer(ref.current as HTMLDivElement, {
        animation:false,timeline:false,geocoder:false,homeButton:false,
        sceneModePicker:false,baseLayerPicker:false,navigationHelpButton:false
      });
      if (key) {
        const tileset = await Cesium.Cesium3DTileset.fromUrl(`https://tile.googleapis.com/v1/3dtiles/root.json?key=${key}`);
        v.scene.primitives.add(tileset);
      }
      v.camera.flyTo({ destination: Cesium.Cartesian3.fromDegrees(-84.9877, 32.46, 55000) });
      setViewer(v);
    })();
    return () => { if (v && !v.isDestroyed()) v.destroy(); };
  }, []);

  const addPin = (p: LatLng, color: Cesium.Color, label: string) => {
    viewer!.entities.add({
      position: Cesium.Cartesian3.fromDegrees(p.lng, p.lat),
      point: { pixelSize: 10, color },
      label: { text: label, pixelOffset: new Cesium.Cartesian2(0, -18), scale: 0.6, fillColor: color }
    });
  };

  const drawRoute = (coords: LatLng[]) => {
    const positions = coords.map(c => Cesium.Cartesian3.fromDegrees(c.lng, c.lat));
    viewer!.entities.add({
      polyline: { positions, width: 4, material: Cesium.Color.CYAN.withAlpha(0.9) }
    });
    viewer!.zoomTo(viewer!.entities);
  };

  async function planRoute(){
    if (!viewer || !origin || !dest) return;
    const dir = await directions(origin, dest);
    const route = dir.routes?.[0];
    if (!route) return;

    setDistance(route.distanceMeters || 0);
    setEta(route.duration || '');

    const decoded = decode(route.polyline.encodedPolyline).map(([lat,lng]) => ({ lat, lng }));

    // Optional: Snap to road for extra smoothness
    let snapped = decoded;
    try {
      const snap = await snapToRoad(decoded);
      if (snap.snappedPoints?.length) {
        snapped = snap.snappedPoints.map((s:any) => ({ lat: s.location.latitude, lng: s.location.longitude }));
      }
    } catch {}

    addPin(origin, Cesium.Color.LIME, 'Origin');
    addPin(dest, Cesium.Color.RED, 'Destination');
    drawRoute(snapped);
  }

  return (
    <div className="wrap">
      <div className="toolbar">
        <AddressSearch label="Origin" onPick={(p)=> setOrigin({lat:p.lat,lng:p.lng})} />
        <AddressSearch label="Destination" onPick={(p)=> setDest({lat:p.lat,lng:p.lng})} />
        <button onClick={planRoute}>Plan Route</button>
        {eta && (<span className="pill">ETA: {eta.replace('s','s')}</span>)}
        {distance>0 && (<span className="pill">Distance: {(distance/1609.34).toFixed(1)} mi</span>)}
      </div>
      <div ref={ref} className="globe" />
      <style>{`
        .wrap{ height:100vh; display:flex; flex-direction:column; }
        .toolbar{ display:flex; gap:12px; align-items:center; padding:10px; border-bottom:1px solid #eee; background:#fff; }
        .pill{ background:#111; color:#fff; padding:6px 10px; border-radius:999px; font-size:12px; }
        .globe{ flex:1; }
      `}</style>
    </div>
  );
}