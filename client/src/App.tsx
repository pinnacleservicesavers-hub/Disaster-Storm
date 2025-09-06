// @ts-nocheck  <-- keeps TypeScript from complaining while we wire this up
import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    google: any;
    initMap?: () => void;
  }
}

export default function App() {
  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [address, setAddress] = useState("");

  // This runs after Google’s script loads (we set callback=initMap in index.html)
  const init = () => {
    if (!mapDivRef.current) return;

    const start = { lat: 33.749, lng: -84.388 }; // Atlanta
    mapRef.current = new window.google.maps.Map(mapDivRef.current, {
      center: start,
      zoom: 10,
    });

    markerRef.current = new window.google.maps.Marker({
      map: mapRef.current,
      position: start,
    });

    const geocoder = new window.google.maps.Geocoder();

    // Click on the map -> move marker and reverse geocode to an address
    mapRef.current.addListener("click", (e: any) => {
      if (!e.latLng) return;
      const pos = { lat: e.latLng.lat(), lng: e.latLng.lng() };
      markerRef.current.setPosition(pos);
      mapRef.current.panTo(pos);

      geocoder.geocode({ location: pos }, (results: any, status: any) => {
        if (status === "OK" && results?.[0]) {
          setAddress(results[0].formatted_address);
        } else {
          setAddress("No address found");
        }
      });
    });
  };

  // Hook up the Google script callback
  useEffect(() => {
    if (window.google && window.google.maps) {
      init();
    } else {
      window.initMap = init;
    }
  }, []);

  // Button: go to typed GPS
  const goToLatLng = () => {
    const lat = parseFloat((document.getElementById("lat") as HTMLInputElement).value);
    const lng = parseFloat((document.getElementById("lng") as HTMLInputElement).value);
    if (isNaN(lat) || isNaN(lng) || !mapRef.current) return alert("Enter numbers for lat & lng");

    const pos = { lat, lng };
    markerRef.current.setPosition(pos);
    mapRef.current.setZoom(15);
    mapRef.current.panTo(pos);

    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ location: pos }, (results: any, status: any) => {
      setAddress(status === "OK" && results?.[0] ? results[0].formatted_address : "No address found");
    });
  };

  // Button: use my current GPS
  const useMyLocation = () => {
    if (!navigator.geolocation) return alert("Geolocation not supported");
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const pos = { lat: p.coords.latitude, lng: p.coords.longitude };
        if (!mapRef.current) return;
        markerRef.current.setPosition(pos);
        mapRef.current.setZoom(15);
        mapRef.current.panTo(pos);

        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ location: pos }, (results: any, status: any) => {
          setAddress(status === "OK" && results?.[0] ? results[0].formatted_address : "No address found");
        });
      },
      (err) => alert("Could not get location: " + err.message)
    );
  };

  return (
    <div style={{ maxWidth: 1000, margin: "20px auto", padding: 12 }}>
      <h1>🗺️ Google Map Test</h1>

      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <input id="lat" placeholder="Latitude" style={{ flex: 1, padding: 8 }} />
        <input id="lng" placeholder="Longitude" style={{ flex: 1, padding: 8 }} />
        <button onClick={goToLatLng}>Go to GPS</button>
        <button
