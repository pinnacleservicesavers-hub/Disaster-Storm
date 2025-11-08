import fetch from 'node-fetch';

/**
 * Tomorrow.io Weather Intelligence Platform
 * Premium provider for hyperlocal weather, hail/wind footprints, severe weather alerts
 */

export interface TomorrowHailEvent {
  startTime: string;
  endTime: string;
  location: {
    lat: number;
    lon: number;
  };
  values: {
    hailIntensity: number;
    hailSize: number; // inches
    hailProbability: number; // 0-100
  };
}

export interface TomorrowWindEvent {
  startTime: string;
  endTime: string;
  location: {
    lat: number;
    lon: number;
  };
  values: {
    windSpeed: number; // mph
    windGust: number; // mph
    windDirection: number; // degrees
  };
}

export interface TomorrowAlert {
  severity: 'extreme' | 'severe' | 'moderate' | 'minor' | 'unknown';
  certainty: 'observed' | 'likely' | 'possible' | 'unlikely' | 'unknown';
  urgency: 'immediate' | 'expected' | 'future' | 'past' | 'unknown';
  eventType: string;
  headline: string;
  description: string;
  startTime: string;
  endTime: string;
}

export interface TomorrowWeatherData {
  hailEvents: TomorrowHailEvent[];
  windEvents: TomorrowWindEvent[];
  alerts: TomorrowAlert[];
  timestamp: string;
  isPrediction: boolean;
  dataSource: string;
}

export class TomorrowService {
  private static instance: TomorrowService;
  private apiKey: string | undefined;
  private baseUrl = 'https://api.tomorrow.io/v4';

  private constructor() {
    this.apiKey = process.env.TOMORROW_API_KEY;
    if (this.apiKey) {
      console.log('🌤️ Tomorrow.io service initialized with API key');
    } else {
      console.log('⚠️ Tomorrow.io service initialized without API key (predictions unavailable)');
    }
  }

  static getInstance(): TomorrowService {
    if (!TomorrowService.instance) {
      TomorrowService.instance = new TomorrowService();
    }
    return TomorrowService.instance;
  }

  /**
   * Get comprehensive weather intelligence for a location
   */
  async getWeatherIntelligence(lat: number, lon: number, radiusKm: number = 25): Promise<TomorrowWeatherData> {
    if (!this.apiKey) {
      console.warn('Tomorrow.io API key not configured - predictions unavailable');
      return {
        hailEvents: [],
        windEvents: [],
        alerts: [],
        timestamp: new Date().toISOString(),
        isPrediction: false,
        dataSource: 'unavailable (no API key)'
      };
    }

    try {
      const [hailData, windData, alertsData] = await Promise.allSettled([
        this.getHailFootprint(lat, lon, radiusKm),
        this.getWindFootprint(lat, lon, radiusKm),
        this.getAlerts(lat, lon)
      ]);

      return {
        hailEvents: hailData.status === 'fulfilled' ? hailData.value : [],
        windEvents: windData.status === 'fulfilled' ? windData.value : [],
        alerts: alertsData.status === 'fulfilled' ? alertsData.value : [],
        timestamp: new Date().toISOString(),
        isPrediction: true,
        dataSource: 'Tomorrow.io AI Prediction'
      };
    } catch (error) {
      console.error('Tomorrow.io API error:', error);
      return {
        hailEvents: [],
        windEvents: [],
        alerts: [],
        timestamp: new Date().toISOString(),
        isPrediction: false,
        dataSource: 'unavailable (API error)'
      };
    }
  }

  /**
   * Get hail footprint data (premium feature)
   */
  private async getHailFootprint(lat: number, lon: number, radiusKm: number): Promise<TomorrowHailEvent[]> {
    try {
      // Tomorrow.io Timeline API for hail forecasts
      const url = `${this.baseUrl}/timelines`;
      const params = new URLSearchParams({
        location: `${lat},${lon}`,
        fields: 'hailIntensity,hailBinary',
        timesteps: '1h',
        units: 'imperial',
        apikey: this.apiKey!
      });

      const response = await fetch(`${url}?${params}`);
      
      if (!response.ok) {
        throw new Error(`Tomorrow.io API error: ${response.status}`);
      }

      const data: any = await response.json();
      const events: TomorrowHailEvent[] = [];

      // Parse timeline data for hail events
      if (data.data?.timelines?.[0]?.intervals) {
        for (const interval of data.data.timelines[0].intervals) {
          if (interval.values.hailBinary > 0 || interval.values.hailIntensity > 0) {
            events.push({
              startTime: interval.startTime,
              endTime: interval.startTime, // Tomorrow.io provides point-in-time
              location: { lat, lon },
              values: {
                hailIntensity: interval.values.hailIntensity || 0,
                hailSize: this.estimateHailSize(interval.values.hailIntensity),
                hailProbability: interval.values.hailBinary * 100
              }
            });
          }
        }
      }

      return events;
    } catch (error) {
      console.error('Hail footprint error:', error);
      return [];
    }
  }

  /**
   * Get wind footprint data
   */
  private async getWindFootprint(lat: number, lon: number, radiusKm: number): Promise<TomorrowWindEvent[]> {
    try {
      const url = `${this.baseUrl}/timelines`;
      const params = new URLSearchParams({
        location: `${lat},${lon}`,
        fields: 'windSpeed,windGust,windDirection',
        timesteps: '1h',
        units: 'imperial',
        apikey: this.apiKey!
      });

      const response = await fetch(`${url}?${params}`);
      
      if (!response.ok) {
        throw new Error(`Tomorrow.io API error: ${response.status}`);
      }

      const data: any = await response.json();
      const events: TomorrowWindEvent[] = [];

      if (data.data?.timelines?.[0]?.intervals) {
        for (const interval of data.data.timelines[0].intervals) {
          // Only include significant wind events (>40 mph)
          if (interval.values.windSpeed > 40 || interval.values.windGust > 50) {
            events.push({
              startTime: interval.startTime,
              endTime: interval.startTime,
              location: { lat, lon },
              values: {
                windSpeed: interval.values.windSpeed || 0,
                windGust: interval.values.windGust || 0,
                windDirection: interval.values.windDirection || 0
              }
            });
          }
        }
      }

      return events;
    } catch (error) {
      console.error('Wind footprint error:', error);
      return [];
    }
  }

  /**
   * Get weather alerts from Tomorrow.io
   */
  private async getAlerts(lat: number, lon: number): Promise<TomorrowAlert[]> {
    try {
      const url = `${this.baseUrl}/events`;
      const params = new URLSearchParams({
        location: `${lat},${lon}`,
        insights: 'air_quality,fires,wind,temperature,precipitation',
        buffer: '25',
        apikey: this.apiKey!
      });

      const response = await fetch(`${url}?${params}`);
      
      if (!response.ok) {
        throw new Error(`Tomorrow.io API error: ${response.status}`);
      }

      const data: any = await response.json();
      const alerts: TomorrowAlert[] = [];

      if (data.data?.events) {
        for (const event of data.data.events) {
          alerts.push({
            severity: this.mapSeverity(event.severity),
            certainty: this.mapCertainty(event.certainty),
            urgency: this.mapUrgency(event.urgency),
            eventType: event.eventType || 'Unknown',
            headline: event.insight || event.eventType,
            description: event.description || '',
            startTime: event.startTime,
            endTime: event.endTime
          });
        }
      }

      return alerts;
    } catch (error) {
      console.error('Alerts error:', error);
      return [];
    }
  }

  /**
   * Estimate hail size from intensity
   */
  private estimateHailSize(intensity: number): number {
    if (intensity >= 4) return 2.0; // Golf ball
    if (intensity >= 3) return 1.5; // Walnut
    if (intensity >= 2) return 1.0; // Quarter
    if (intensity >= 1) return 0.5; // Pea
    return 0.25;
  }

  /**
   * Map Tomorrow.io severity to standard format
   */
  private mapSeverity(severity: string): TomorrowAlert['severity'] {
    const map: Record<string, TomorrowAlert['severity']> = {
      'extreme': 'extreme',
      'severe': 'severe',
      'moderate': 'moderate',
      'minor': 'minor'
    };
    return map[severity?.toLowerCase()] || 'unknown';
  }

  /**
   * Map Tomorrow.io certainty to standard format
   */
  private mapCertainty(certainty: string): TomorrowAlert['certainty'] {
    const map: Record<string, TomorrowAlert['certainty']> = {
      'observed': 'observed',
      'likely': 'likely',
      'possible': 'possible',
      'unlikely': 'unlikely'
    };
    return map[certainty?.toLowerCase()] || 'unknown';
  }

  /**
   * Map Tomorrow.io urgency to standard format
   */
  private mapUrgency(urgency: string): TomorrowAlert['urgency'] {
    const map: Record<string, TomorrowAlert['urgency']> = {
      'immediate': 'immediate',
      'expected': 'expected',
      'future': 'future',
      'past': 'past'
    };
    return map[urgency?.toLowerCase()] || 'unknown';
  }

}

// Export singleton instance
export const tomorrowService = TomorrowService.getInstance();
