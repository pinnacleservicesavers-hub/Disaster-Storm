// src/lib/google.ts
const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY as string;
if (!API_KEY) console.warn("Missing VITE_GOOGLE_MAPS_KEY env var");

export type LatLng = { lat: number; lng: number };

export async function geocodeAddress(address: string) {
  const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
  url.searchParams.set("address", address);
  url.searchParams.set("key", API_KEY);
  const r = await fetch(url);
  if (!r.ok) throw new Error("Geocode failed");
  return r.json();
}

export async function reverseGeocode(lat: number, lng: number) {
  const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
  url.searchParams.set("latlng", `${lat},${lng}`);
  url.searchParams.set("key", API_KEY);
  const r = await fetch(url);
  if (!r.ok) throw new Error("Reverse geocode failed");
  return r.json();
}

export async function placesAutocomplete(input: string) {
  const url = new URL("https://maps.googleapis.com/maps/api/place/autocomplete/json");
  url.searchParams.set("input", input);
  url.searchParams.set("key", API_KEY);
  url.searchParams.set("types", "address");
  const r = await fetch(url);
  if (!r.ok) throw new Error("Autocomplete failed");
  return r.json();
}

export async function placeDetails(place_id: string) {
  const url = new URL("https://maps.googleapis.com/maps/api/place/details/json");
  url.searchParams.set("place_id", place_id);
  url.searchParams.set("key", API_KEY);
  const r = await fetch(url);
  if (!r.ok) throw new Error("Place details failed");
  return r.json();
}

// Routes (Directions v2 via Routes API)
export async function directions(origin: LatLng, destination: LatLng) {
  const url = "https://routes.googleapis.com/directions/v2:computeRoutes";
  const r = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": API_KEY,
      "X-Goog-FieldMask": "routes.polyline.encodedPolyline,routes.distanceMeters,routes.duration",
    },
    body: JSON.stringify({
      origin: { location: { latLng: origin } },
      destination: { location: { latLng: destination } },
      travelMode: "DRIVE",
      computeAlternativeRoutes: false,
    }),
  });
  if (!r.ok) throw new Error("Directions failed");
  return r.json();
}

export async function distanceMatrix(origins: LatLng[], destinations: LatLng[]) {
  const url = "https://routes.googleapis.com/distanceMatrix/v2:computeRouteMatrix";
  const r = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": API_KEY,
      "X-Goog-FieldMask": "originIndex,destinationIndex,duration,distanceMeters",
    },
    body: JSON.stringify({
      origins: origins.map((o) => ({ waypoint: { location: { latLng: o } } })),
      destinations: destinations.map((d) => ({ waypoint: { location: { latLng: d } } })),
      travelMode: "DRIVE",
    }),
  });
  if (!r.ok) throw new Error("Matrix failed");
  return r.json();
}

export async function elevationFor(points: LatLng[]) {
  const url = new URL("https://maps.googleapis.com/maps/api/elevation/json");
  url.searchParams.set("key", API_KEY);
  url.searchParams.set("locations", points.map((p) => `${p.lat},${p.lng}`).join("|"));
  const r = await fetch(url);
  if (!r.ok) throw new Error("Elevation failed");
  return r.json();
}

export async function snapToRoad(path: LatLng[]) {
  const url = new URL("https://roads.googleapis.com/v1/snapToRoads");
  url.searchParams.set("key", API_KEY);
  url.searchParams.set("interpolate", "true");
  url.searchParams.set("path", path.map((p) => `${p.lat},${p.lng}`).join("|"));
  const r = await fetch(url);
  if (!r.ok) throw new Error("SnapToRoads failed");
  return r.json();
}