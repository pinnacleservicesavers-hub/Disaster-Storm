// @ts-nocheck  <-- keeps TypeScript from complaining while we wire this up
import { useEffect, useRef, useState } from "react";
import DroneViewer from "./DroneViewer";

declare global {
  interface Window {
    google: any;
    initMap?: () => void;
  }
}

export default function App() {
  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const autocompleteRef = useRef<any>(null);
  const [address, setAddress] = useState("");
  const [showCopied, setShowCopied] = useState(false);

  // This runs after Google's script loads (we set callback=initMap in index.html)
  const init = () => {
    if (!mapDivRef.current || !searchInputRef.current) return;

    const start = { lat: 33.749, lng: -84.388 }; // Atlanta
    mapRef.current = new window.google.maps.Map(mapDivRef.current, {
      center: start,
      zoom: 10,
    });

    markerRef.current = new window.google.maps.Marker({
      map: mapRef.current,
      position: start,
    });

    // Initialize Places Autocomplete
    autocompleteRef.current = new window.google.maps.places.Autocomplete(searchInputRef.current, {
      fields: ["formatted_address", "geometry", "name"],
      types: ["establishment", "geocode"],
    });

    // Listen for place selection from autocomplete
    autocompleteRef.current.addListener("place_changed", () => {
      const place = autocompleteRef.current.getPlace();
      if (!place.geometry || !place.geometry.location) {
        alert("No location data available for this place.");
        return;
      }

      const pos = {
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
      };

      // Update map and marker
      markerRef.current.setPosition(pos);
      mapRef.current.setCenter(pos);
      mapRef.current.setZoom(15);

      // Update address display
      setAddress(place.formatted_address || place.name || "Selected location");
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

  // Copy address to clipboard
  const copyAddress = async () => {
    if (!address) return;
    
    try {
      await navigator.clipboard.writeText(address);
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = address;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);
    }
  };

  return (
    <div style={{ maxWidth: 1000, margin: "20px auto", padding: 12 }}>
      <h1>🗺️ Google Map Test</h1>

      {/* Places Autocomplete Search */}
      <div style={{ marginBottom: 16 }}>
        <input
          ref={searchInputRef}
          placeholder="Search for places..."
          style={{
            width: "100%",
            padding: 12,
            fontSize: 16,
            border: "1px solid #ccc",
            borderRadius: 4,
            boxSizing: "border-box",
          }}
        />
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <input id="lat" placeholder="Latitude" style={{ flex: 1, padding: 8 }} />
        <input id="lng" placeholder="Longitude" style={{ flex: 1, padding: 8 }} />
        <button onClick={goToLatLng}>Go to GPS</button>
        <button onClick={useMyLocation}>Use My Location</button>
      </div>

      <div id="map" ref={mapDivRef} style={{ width: "100%", height: 400, marginBottom: 16 }} />

      {address && (
        <div style={{ 
          padding: 12, 
          backgroundColor: "#f0f0f0", 
          borderRadius: 4, 
          marginBottom: 16,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12
        }}>
          <div>
            <strong>Address:</strong> {address}
          </div>
          <div style={{ position: "relative" }}>
            <button
              onClick={copyAddress}
              style={{
                padding: "6px 12px",
                backgroundColor: "#007bff",
                color: "white",
                border: "none",
                borderRadius: 4,
                cursor: "pointer",
                fontSize: 14,
                whiteSpace: "nowrap"
              }}
            >
              Copy address
            </button>
            {showCopied && (
              <div style={{
                position: "absolute",
                top: "-30px",
                right: "0",
                backgroundColor: "#28a745",
                color: "white",
                padding: "4px 8px",
                borderRadius: 4,
                fontSize: 12,
                whiteSpace: "nowrap",
                zIndex: 1000
              }}>
                Copied!
              </div>
            )}
          </div>
        </div>
      )}

      <DroneViewer streamUrl="https://www.youtube.com/embed/21X5lGlDOfg?autoplay=1&mute=1" />
    </div>
  );
}