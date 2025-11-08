import fetch from 'node-fetch';

interface GeocodeResult {
  lat: number;
  lon: number;
  city: string;
  state: string;
  country: string;
  displayName: string;
}

export async function geocodeLocation(query: string): Promise<GeocodeResult | null> {
  try {
    console.log(`🌍 Geocoding query: "${query}"`);
    
    const encodedQuery = encodeURIComponent(query);
    const url = `https://nominatim.openstreetmap.org/search?q=${encodedQuery}&format=json&limit=1&countrycodes=us`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'DisasterDirect/1.0 (weather intelligence platform)'
      }
    });
    
    if (!response.ok) {
      console.error('🌍 Geocoding API error:', response.status, response.statusText);
      return null;
    }
    
    const results = await response.json() as any[];
    
    if (!results || results.length === 0) {
      console.log('🌍 No geocoding results found for:', query);
      return null;
    }
    
    const location = results[0];
    const addressParts = location.display_name.split(', ');
    
    const result: GeocodeResult = {
      lat: parseFloat(location.lat),
      lon: parseFloat(location.lon),
      city: location.address?.city || location.address?.town || location.address?.village || addressParts[0],
      state: location.address?.state || '',
      country: location.address?.country || 'USA',
      displayName: location.display_name
    };
    
    console.log(`🌍 Geocoded "${query}" to:`, result.displayName);
    return result;
    
  } catch (error) {
    console.error('🌍 Geocoding error:', error);
    return null;
  }
}

export async function reverseGeocode(lat: number, lon: number): Promise<GeocodeResult | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'DisasterDirect/1.0'
      }
    });
    
    if (!response.ok) {
      return null;
    }
    
    const location = await response.json() as any;
    
    return {
      lat,
      lon,
      city: location.address?.city || location.address?.town || '',
      state: location.address?.state || '',
      country: location.address?.country || '',
      displayName: location.display_name
    };
    
  } catch (error) {
    console.error('🌍 Reverse geocoding error:', error);
    return null;
  }
}
