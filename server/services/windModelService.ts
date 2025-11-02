import fetch from 'node-fetch';

interface WindForecast {
  timestamp: Date;
  latitude: number;
  longitude: number;
  windSpeed: number; // mph
  windGust: number; // mph
  windDirection: number; // degrees
  location: string;
  severity: 'low' | 'moderate' | 'high' | 'extreme';
}

interface WindModelResponse {
  count: number;
  forecasts: WindForecast[];
  maxWindSpeed: number;
  maxGust: number;
  highWindCorridors: Array<{ location: string; windSpeed: number; gust: number }>;
}

export class WindModelService {
  // GFS (Global Forecast System) and HRRR (High-Resolution Rapid Refresh) models
  private gfsUrl = 'https://nomads.ncep.noaa.gov/cgi-bin/filter_gfs_0p25.pl';
  private hrrrUrl = 'https://nomads.ncep.noaa.gov/cgi-bin/filter_hrrr_2d.pl';

  async getWindForecasts(forecastHours: number = 12): Promise<WindModelResponse> {
    try {
      // In production, parse actual GRIB2 files from NOAA
      // For now, generate realistic mock data
      const forecasts = this.generateMockWindForecasts(forecastHours);
      
      const maxWindSpeed = Math.max(...forecasts.map(f => f.windSpeed));
      const maxGust = Math.max(...forecasts.map(f => f.windGust));
      
      const highWindCorridors = forecasts
        .filter(f => f.windSpeed > 40 || f.windGust > 50)
        .map(f => ({
          location: f.location,
          windSpeed: f.windSpeed,
          gust: f.windGust
        }));

      return {
        count: forecasts.length,
        forecasts,
        maxWindSpeed,
        maxGust,
        highWindCorridors
      };
    } catch (error) {
      console.error('Wind model service error:', error);
      return { count: 0, forecasts: [], maxWindSpeed: 0, maxGust: 0, highWindCorridors: [] };
    }
  }

  private generateMockWindForecasts(forecastHours: number): WindForecast[] {
    const forecasts: WindForecast[] = [];
    
    const locations = [
      { lat: 25.7617, lon: -80.1918, name: 'Miami, FL' },
      { lat: 30.3322, lon: -81.6557, name: 'Jacksonville, FL' },
      { lat: 28.5383, lon: -81.3792, name: 'Orlando, FL' },
      { lat: 33.7490, lon: -84.3880, name: 'Atlanta, GA' },
      { lat: 35.2271, lon: -80.8431, name: 'Charlotte, NC' },
      { lat: 32.7157, lon: -117.1611, name: 'San Diego, CA' },
      { lat: 41.8781, lon: -87.6298, name: 'Chicago, IL' }
    ];

    locations.forEach(loc => {
      // Simulate wind increasing over forecast period for some locations
      const baseWind = Math.random() * 30 + 10; // 10-40 mph base
      const hasHighWinds = Math.random() > 0.7;
      
      const windSpeed = hasHighWinds ? baseWind + Math.random() * 30 : baseWind;
      const windGust = windSpeed * (1.2 + Math.random() * 0.3); // Gusts 20-50% higher
      
      let severity: 'low' | 'moderate' | 'high' | 'extreme' = 'low';
      if (windSpeed > 73) severity = 'extreme'; // Hurricane force
      else if (windSpeed > 58) severity = 'high'; // Tropical storm force
      else if (windSpeed > 39) severity = 'moderate'; // Strong winds
      
      forecasts.push({
        timestamp: new Date(Date.now() + forecastHours * 3600000),
        latitude: loc.lat,
        longitude: loc.lon,
        windSpeed: Math.round(windSpeed),
        windGust: Math.round(windGust),
        windDirection: Math.floor(Math.random() * 360),
        location: loc.name,
        severity
      });
    });

    return forecasts;
  }

  async getHighWindCorridors(minWindSpeed: number = 40): Promise<{ count: number; corridors: WindForecast[] }> {
    const windData = await this.getWindForecasts(24);
    const corridors = windData.forecasts.filter(f => f.windSpeed >= minWindSpeed);
    
    return {
      count: corridors.length,
      corridors
    };
  }

  async getStagingRecommendations(): Promise<{ safe: string[]; caution: string[]; avoid: string[] }> {
    const windData = await this.getWindForecasts(12);
    
    const safe = windData.forecasts.filter(f => f.windSpeed < 25).map(f => f.location);
    const caution = windData.forecasts.filter(f => f.windSpeed >= 25 && f.windSpeed < 40).map(f => f.location);
    const avoid = windData.forecasts.filter(f => f.windSpeed >= 40).map(f => f.location);
    
    return { safe, caution, avoid };
  }
}

export const windModelService = new WindModelService();
