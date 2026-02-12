interface NearbyShop {
  name: string;
  address: string;
  rating: number;
  totalRatings: number;
  phone?: string;
  isOpen?: boolean;
  distance?: string;
  placeId: string;
  specialties: string[];
  priceLevel?: number;
}

interface LocatorResult {
  shops: NearbyShop[];
  searchLocation: string;
}

export async function findNearbyMechanics(
  location: string,
  repairType?: string,
  limit: number = 5
): Promise<LocatorResult> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    console.warn('Google Places API key not configured');
    return { shops: [], searchLocation: location };
  }

  try {
    const geocodeRes = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(location)}&key=${apiKey}`
    );
    const geocodeData = await geocodeRes.json();

    if (!geocodeData.results?.[0]?.geometry?.location) {
      return { shops: [], searchLocation: location };
    }

    const { lat, lng } = geocodeData.results[0].geometry.location;
    const formattedAddress = geocodeData.results[0].formatted_address || location;

    const keyword = repairType === 'body' ? 'auto body shop' :
                    repairType === 'paint' ? 'auto paint shop' :
                    repairType === 'tires_wheels' ? 'tire shop' :
                    repairType === 'electrical' ? 'auto electrical repair' :
                    'auto mechanic repair shop';

    const placesRes = await fetch(
      `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=16093&type=car_repair&keyword=${encodeURIComponent(keyword)}&key=${apiKey}`
    );
    const placesData = await placesRes.json();

    if (!placesData.results?.length) {
      return { shops: [], searchLocation: formattedAddress };
    }

    const shops: NearbyShop[] = placesData.results
      .slice(0, limit)
      .map((place: any) => {
        const specialties: string[] = [];
        if (place.types?.includes('car_repair')) specialties.push('General Repair');
        if (place.types?.includes('car_dealer')) specialties.push('Dealer Service');
        if (place.name?.toLowerCase().includes('body')) specialties.push('Body Work');
        if (place.name?.toLowerCase().includes('tire')) specialties.push('Tires');
        if (place.name?.toLowerCase().includes('brake')) specialties.push('Brakes');
        if (place.name?.toLowerCase().includes('transmission')) specialties.push('Transmission');
        if (specialties.length === 0) specialties.push('Auto Repair');

        const shopLat = place.geometry?.location?.lat;
        const shopLng = place.geometry?.location?.lng;
        let distance: string | undefined;
        if (shopLat && shopLng) {
          const miles = haversineDistance(lat, lng, shopLat, shopLng);
          distance = `${miles.toFixed(1)} mi`;
        }

        return {
          name: place.name || 'Unknown Shop',
          address: place.vicinity || place.formatted_address || '',
          rating: place.rating || 0,
          totalRatings: place.user_ratings_total || 0,
          isOpen: place.opening_hours?.open_now,
          distance,
          placeId: place.place_id || '',
          specialties,
          priceLevel: place.price_level,
        };
      });

    shops.sort((a, b) => {
      const scoreA = (a.rating * 20) + Math.min(a.totalRatings, 100);
      const scoreB = (b.rating * 20) + Math.min(b.totalRatings, 100);
      return scoreB - scoreA;
    });

    return { shops, searchLocation: formattedAddress };
  } catch (error) {
    console.error('Mechanic locator error:', error);
    return { shops: [], searchLocation: location };
  }
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
