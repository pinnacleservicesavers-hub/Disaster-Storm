import fetch from 'node-fetch';

interface SmokeData {
  latitude: number;
  longitude: number;
  density: 'light' | 'medium' | 'heavy';
  visibility: number; // miles
  timestamp: Date;
  location: string;
  airQualityIndex: number; // AQI 0-500
}

interface SmokeResponse {
  count: number;
  smokeAreas: SmokeData[];
  affectedStates: string[];
  maxDensity: 'light' | 'medium' | 'heavy';
  poorVisibilityAreas: Array<{ location: string; visibility: number }>;
}

export class NoaaSmokeService {
  // NOAA Hazard Mapping System (HMS) for smoke and fire detection
  private hmsUrl = 'https://satepsanone.nesdis.noaa.gov/pub/FIRE/web/HMS';
  
  async getCurrentSmokeData(region?: { minLat: number; maxLat: number; minLon: number; maxLon: number }): Promise<SmokeResponse> {
    try {
      // In production, parse actual HMS smoke product files
      // For now, generate realistic mock data based on current wildfire season
      const smokeData = this.generateMockSmokeData(region);
      
      const affectedStates = [...new Set(smokeData.map(s => {
        // Extract state from location string
        const match = s.location.match(/,\s*([A-Z]{2})$/);
        return match ? match[1] : 'Unknown';
      }))];
      
      const maxDensity = smokeData.some(s => s.density === 'heavy') ? 'heavy' :
                        smokeData.some(s => s.density === 'medium') ? 'medium' : 'light';
      
      const poorVisibilityAreas = smokeData
        .filter(s => s.visibility < 3) // Less than 3 miles visibility
        .map(s => ({ location: s.location, visibility: s.visibility }));

      return {
        count: smokeData.length,
        smokeAreas: smokeData,
        affectedStates,
        maxDensity,
        poorVisibilityAreas
      };
    } catch (error) {
      console.error('NOAA smoke service error:', error);
      return { count: 0, smokeAreas: [], affectedStates: [], maxDensity: 'light', poorVisibilityAreas: [] };
    }
  }

  private generateMockSmokeData(region?: { minLat: number; maxLat: number; minLon: number; maxLon: number }): SmokeData[] {
    const smokeAreas: SmokeData[] = [];
    
    // Wildfire-prone areas
    const fireRegions = [
      { lat: 34.0522, lon: -118.2437, name: 'Los Angeles, CA' },
      { lat: 37.7749, lon: -122.4194, name: 'San Francisco, CA' },
      { lat: 45.5152, lon: -122.6784, name: 'Portland, OR' },
      { lat: 47.6062, lon: -122.3321, name: 'Seattle, WA' },
      { lat: 39.7392, lon: -104.9903, name: 'Denver, CO' },
      { lat: 46.8797, lon: -110.3626, name: 'Bozeman, MT' },
      { lat: 43.6150, lon: -116.2023, name: 'Boise, ID' }
    ];

    fireRegions.forEach(region => {
      const hasSmoke = Math.random() > 0.5; // 50% chance of smoke
      
      if (hasSmoke) {
        const density = Math.random();
        let densityLabel: 'light' | 'medium' | 'heavy';
        let visibility: number;
        let aqi: number;
        
        if (density > 0.7) {
          densityLabel = 'heavy';
          visibility = Math.random() * 2; // 0-2 miles
          aqi = Math.floor(Math.random() * 100) + 200; // 200-300 AQI (very unhealthy)
        } else if (density > 0.4) {
          densityLabel = 'medium';
          visibility = Math.random() * 3 + 2; // 2-5 miles
          aqi = Math.floor(Math.random() * 50) + 150; // 150-200 AQI (unhealthy)
        } else {
          densityLabel = 'light';
          visibility = Math.random() * 5 + 5; // 5-10 miles
          aqi = Math.floor(Math.random() * 50) + 100; // 100-150 AQI (unhealthy for sensitive groups)
        }
        
        smokeAreas.push({
          latitude: region.lat,
          longitude: region.lon,
          density: densityLabel,
          visibility: Math.round(visibility * 10) / 10,
          timestamp: new Date(),
          location: region.name,
          airQualityIndex: aqi
        });
      }
    });

    return smokeAreas;
  }

  async getAirQualityAlerts(minAqi: number = 150): Promise<{ count: number; alerts: Array<{ location: string; aqi: number; category: string }> }> {
    const smokeData = await this.getCurrentSmokeData();
    const alerts = smokeData.smokeAreas
      .filter(s => s.airQualityIndex >= minAqi)
      .map(s => {
        let category = 'Good';
        if (s.airQualityIndex > 300) category = 'Hazardous';
        else if (s.airQualityIndex > 200) category = 'Very Unhealthy';
        else if (s.airQualityIndex > 150) category = 'Unhealthy';
        else if (s.airQualityIndex > 100) category = 'Unhealthy for Sensitive Groups';
        else if (s.airQualityIndex > 50) category = 'Moderate';
        
        return {
          location: s.location,
          aqi: s.airQualityIndex,
          category
        };
      });

    return {
      count: alerts.length,
      alerts
    };
  }

  async getVisibilitySafetyReport(): Promise<{ safe: string[]; caution: string[]; unsafe: string[] }> {
    const smokeData = await this.getCurrentSmokeData();
    
    return {
      safe: smokeData.smokeAreas.filter(s => s.visibility > 5).map(s => s.location),
      caution: smokeData.smokeAreas.filter(s => s.visibility >= 3 && s.visibility <= 5).map(s => s.location),
      unsafe: smokeData.smokeAreas.filter(s => s.visibility < 3).map(s => s.location)
    };
  }
}

export const smokeService = new NoaaSmokeService();
