export interface WeatherData {
  alerts: WeatherAlert[];
  radar: RadarData;
  forecast: ForecastData;
}

export interface WeatherAlert {
  id: string;
  title: string;
  description: string;
  severity: string;
  alertType: string;
  areas: string[];
  startTime: Date;
  endTime?: Date;
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

export interface RadarData {
  timestamp: Date;
  layers: RadarLayer[];
  coverage: CoverageArea[];
}

export interface RadarLayer {
  type: string; // precipitation, velocity, etc.
  data: RadarPoint[];
}

export interface RadarPoint {
  latitude: number;
  longitude: number;
  intensity: number;
  type: string;
}

export interface CoverageArea {
  state: string;
  counties: string[];
  isActive: boolean;
}

export interface ForecastData {
  current: CurrentConditions;
  hourly: HourlyForecast[];
  daily: DailyForecast[];
}

export interface CurrentConditions {
  temperature: number;
  humidity: number;
  windSpeed: number;
  windDirection: string;
  barometricPressure: number;
  visibility: number;
  conditions: string;
}

export interface HourlyForecast {
  time: Date;
  temperature: number;
  precipitationChance: number;
  conditions: string;
}

export interface DailyForecast {
  date: Date;
  high: number;
  low: number;
  precipitationChance: number;
  conditions: string;
}

export class WeatherService {
  private nwsApiKey: string;
  private spcApiKey: string;

  constructor() {
    this.nwsApiKey = process.env.NWS_API_KEY || '';
    this.spcApiKey = process.env.SPC_API_KEY || '';
  }

  async getWeatherAlerts(latitude?: number, longitude?: number): Promise<WeatherAlert[]> {
    try {
      // In production, this would call the actual NWS API
      // For now, return structured data that matches our schema
      const mockAlerts: WeatherAlert[] = [
        {
          id: "nws-alert-001",
          title: "Tornado Warning",
          description: "A tornado warning has been issued for the following areas until 11:30 PM EST.",
          severity: "Extreme",
          alertType: "Tornado",
          areas: ["Fulton County", "DeKalb County"],
          startTime: new Date(),
          endTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
          coordinates: {
            latitude: 33.7490,
            longitude: -84.3880
          }
        },
        {
          id: "nws-alert-002",
          title: "Severe Thunderstorm Warning",
          description: "Severe thunderstorms with damaging winds and large hail are possible.",
          severity: "Severe",
          alertType: "Severe Thunderstorm",
          areas: ["Gwinnett County", "Cobb County"],
          startTime: new Date(),
          endTime: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours from now
          coordinates: {
            latitude: 33.9737,
            longitude: -84.5755
          }
        }
      ];

      return mockAlerts;
    } catch (error) {
      console.error('Error fetching weather alerts:', error);
      return [];
    }
  }

  async getRadarData(latitude: number, longitude: number, zoom: number = 6): Promise<RadarData> {
    try {
      // In production, this would call the actual NWS radar API
      const mockRadarData: RadarData = {
        timestamp: new Date(),
        layers: [
          {
            type: "precipitation",
            data: [
              { latitude: 33.7490, longitude: -84.3880, intensity: 0.8, type: "heavy_rain" },
              { latitude: 33.8490, longitude: -84.4880, intensity: 0.6, type: "moderate_rain" },
              { latitude: 33.6490, longitude: -84.2880, intensity: 0.9, type: "severe_storm" }
            ]
          }
        ],
        coverage: [
          { state: "GA", counties: ["Fulton", "DeKalb", "Gwinnett"], isActive: true },
          { state: "FL", counties: ["Duval", "Clay"], isActive: false }
        ]
      };

      return mockRadarData;
    } catch (error) {
      console.error('Error fetching radar data:', error);
      throw new Error('Failed to fetch radar data');
    }
  }

  async getForecast(latitude: number, longitude: number): Promise<ForecastData> {
    try {
      // In production, this would call the actual NWS forecast API
      const mockForecast: ForecastData = {
        current: {
          temperature: 78,
          humidity: 65,
          windSpeed: 12,
          windDirection: "SW",
          barometricPressure: 29.92,
          visibility: 10,
          conditions: "Partly Cloudy"
        },
        hourly: Array.from({ length: 24 }, (_, i) => ({
          time: new Date(Date.now() + i * 60 * 60 * 1000),
          temperature: 78 - i * 0.5,
          precipitationChance: Math.min(10 + i * 2, 80),
          conditions: i < 6 ? "Clear" : i < 12 ? "Cloudy" : "Thunderstorms"
        })),
        daily: Array.from({ length: 7 }, (_, i) => ({
          date: new Date(Date.now() + i * 24 * 60 * 60 * 1000),
          high: 85 - i,
          low: 65 - i,
          precipitationChance: 20 + i * 10,
          conditions: i === 0 ? "Sunny" : i < 3 ? "Partly Cloudy" : "Thunderstorms"
        }))
      };

      return mockForecast;
    } catch (error) {
      console.error('Error fetching forecast data:', error);
      throw new Error('Failed to fetch forecast data');
    }
  }

  async getSPCOutlook(): Promise<any> {
    try {
      // Storm Prediction Center outlook data
      // In production, this would fetch from SPC APIs
      return {
        day1: {
          areas: ["Central Georgia", "North Florida"],
          risk: "Enhanced",
          validTime: new Date(),
          hazards: ["Damaging winds", "Large hail", "Tornadoes possible"]
        }
      };
    } catch (error) {
      console.error('Error fetching SPC outlook:', error);
      return null;
    }
  }
}

export const weatherService = new WeatherService();
