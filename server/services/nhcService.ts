import fetch from 'node-fetch';

export interface NHCStorm {
  id: string;
  name: string;
  classification: string; // Hurricane, Tropical Storm, etc.
  intensity: number; // Category or wind speed
  latitude: number;
  longitude: number;
  movement: string;
  pressure: number;
  windSpeed: number;
  lastUpdate: Date;
  advisoryNumber: string;
  forecastTrack?: Array<{
    validTime: Date;
    latitude: number;
    longitude: number;
    windSpeed: number;
  }>;
}

class NHCService {
  private baseUrl = 'https://www.nhc.noaa.gov/gis';
  private activeStorms: Map<string, NHCStorm> = new Map();

  async fetchActiveStorms(): Promise<NHCStorm[]> {
    try {
      // Fetch active storms from NHC GIS data
      const response = await fetch(`${this.baseUrl}/kml/nhc_active.kml`);
      
      if (!response.ok) {
        console.log('NHC: No active storms at this time');
        return [];
      }

      const kmlData = await response.text();
      const storms = this.parseNHCKML(kmlData);
      
      // Update cache
      this.activeStorms.clear();
      storms.forEach(storm => {
        this.activeStorms.set(storm.id, storm);
      });

      console.log(`📍 NHC: Found ${storms.length} active storm(s)`);
      return storms;
    } catch (error) {
      console.error('NHC fetch error:', error);
      return [];
    }
  }

  private parseNHCKML(kml: string): NHCStorm[] {
    const storms: NHCStorm[] = [];
    
    // Simple KML parsing - extract Placemark elements
    const placemarkRegex = /<Placemark>(.*?)<\/Placemark>/gs;
    const matches = kml.matchAll(placemarkRegex);

    for (const match of matches) {
      const placemark = match[1];
      
      // Extract storm details
      const nameMatch = placemark.match(/<name>(.*?)<\/name>/);
      const descMatch = placemark.match(/<description>(.*?)<\/description>/);
      const coordMatch = placemark.match(/<coordinates>(.*?)<\/coordinates>/);

      if (nameMatch && coordMatch) {
        const name = nameMatch[1];
        const coords = coordMatch[1].trim().split(',');
        
        const storm: NHCStorm = {
          id: `nhc-${name.toLowerCase().replace(/\s+/g, '-')}`,
          name: name,
          classification: this.extractClassification(name),
          intensity: this.extractIntensity(descMatch?.[1] || ''),
          latitude: parseFloat(coords[1]) || 0,
          longitude: parseFloat(coords[0]) || 0,
          movement: this.extractMovement(descMatch?.[1] || ''),
          pressure: this.extractPressure(descMatch?.[1] || ''),
          windSpeed: this.extractWindSpeed(descMatch?.[1] || ''),
          lastUpdate: new Date(),
          advisoryNumber: this.extractAdvisoryNumber(descMatch?.[1] || ''),
        };

        storms.push(storm);
      }
    }

    return storms;
  }

  private extractClassification(name: string): string {
    if (name.toLowerCase().includes('hurricane')) return 'Hurricane';
    if (name.toLowerCase().includes('tropical storm')) return 'Tropical Storm';
    if (name.toLowerCase().includes('tropical depression')) return 'Tropical Depression';
    return 'Disturbance';
  }

  private extractIntensity(description: string): number {
    const catMatch = description.match(/category\s+(\d+)/i);
    if (catMatch) return parseInt(catMatch[1]);
    
    const windMatch = description.match(/(\d+)\s*mph/i);
    if (windMatch) {
      const wind = parseInt(windMatch[1]);
      if (wind >= 157) return 5;
      if (wind >= 130) return 4;
      if (wind >= 111) return 3;
      if (wind >= 96) return 2;
      if (wind >= 74) return 1;
    }
    return 0;
  }

  private extractMovement(description: string): string {
    const movementMatch = description.match(/moving\s+(.*?)(?:at|\.)/i);
    return movementMatch ? movementMatch[1].trim() : 'Unknown';
  }

  private extractPressure(description: string): number {
    const pressureMatch = description.match(/(\d+)\s*mb/i);
    return pressureMatch ? parseInt(pressureMatch[1]) : 0;
  }

  private extractWindSpeed(description: string): number {
    const windMatch = description.match(/(\d+)\s*mph/i);
    return windMatch ? parseInt(windMatch[1]) : 0;
  }

  private extractAdvisoryNumber(description: string): string {
    const advisoryMatch = description.match(/advisory\s+#?(\d+[A-Z]*)/i);
    return advisoryMatch ? advisoryMatch[1] : '1';
  }

  getActiveStorms(): NHCStorm[] {
    return Array.from(this.activeStorms.values());
  }

  getStormById(id: string): NHCStorm | undefined {
    return this.activeStorms.get(id);
  }
}

export const nhcService = new NHCService();
console.log('🌀 National Hurricane Center service initialized');
