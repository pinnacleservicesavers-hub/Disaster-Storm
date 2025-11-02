import fetch from 'node-fetch';

export interface Earthquake {
  id: string;
  magnitude: number;
  location: string;
  latitude: number;
  longitude: number;
  depth: number; // km
  time: Date;
  url: string;
  tsunami: boolean;
  status: string;
  type: string;
  significance: number;
}

class USGSEarthquakeService {
  private baseUrl = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary';
  private recentQuakes: Map<string, Earthquake> = new Map();

  async fetchRecentEarthquakes(magnitude: number = 2.5): Promise<Earthquake[]> {
    try {
      // Fetch significant earthquakes (M2.5+) from past 24 hours
      const feedUrl = magnitude >= 4.5 
        ? `${this.baseUrl}/significant_day.geojson`
        : `${this.baseUrl}/2.5_day.geojson`;

      const response = await fetch(feedUrl);
      
      if (!response.ok) {
        throw new Error(`USGS API error: ${response.status}`);
      }

      const data: any = await response.json();
      const earthquakes = this.parseGeoJSON(data);
      
      // Update cache
      this.recentQuakes.clear();
      earthquakes.forEach(quake => {
        this.recentQuakes.set(quake.id, quake);
      });

      console.log(`🌍 USGS: Found ${earthquakes.length} earthquake(s) (M${magnitude}+)`);
      return earthquakes;
    } catch (error) {
      console.error('USGS fetch error:', error);
      return [];
    }
  }

  private parseGeoJSON(geojson: any): Earthquake[] {
    if (!geojson.features || !Array.isArray(geojson.features)) {
      return [];
    }

    return geojson.features.map((feature: any) => {
      const props = feature.properties;
      const coords = feature.geometry.coordinates;

      return {
        id: feature.id,
        magnitude: props.mag || 0,
        location: props.place || 'Unknown',
        latitude: coords[1],
        longitude: coords[0],
        depth: coords[2] || 0,
        time: new Date(props.time),
        url: props.url || '',
        tsunami: props.tsunami === 1,
        status: props.status || 'automatic',
        type: props.type || 'earthquake',
        significance: props.sig || 0,
      } as Earthquake;
    });
  }

  getRecentEarthquakes(): Earthquake[] {
    return Array.from(this.recentQuakes.values())
      .sort((a, b) => b.time.getTime() - a.time.getTime());
  }

  getEarthquakeById(id: string): Earthquake | undefined {
    return this.recentQuakes.get(id);
  }

  getEarthquakesByRegion(lat: number, lon: number, radiusKm: number = 500): Earthquake[] {
    const earthquakes = this.getRecentEarthquakes();
    
    return earthquakes.filter(quake => {
      const distance = this.calculateDistance(lat, lon, quake.latitude, quake.longitude);
      return distance <= radiusKm;
    });
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}

export const usgsEarthquakeService = new USGSEarthquakeService();
console.log('🌍 USGS Earthquake service initialized');
