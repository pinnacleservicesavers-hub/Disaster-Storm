import fetch from 'node-fetch';

const AMBEE_BASE_URL = 'https://api.ambeedata.com';

interface AmbeeCoordinates {
  lat: number;
  lng: number;
}

interface AmbeePlace {
  place: string;
}

interface AmbeePostalCode {
  postalCode: string;
  countryCode: string;
}

interface AirQualityData {
  AQI: number;
  CO: number;
  NO2: number;
  O3: number;
  PM10: number;
  PM25: number;
  SO2: number;
  updatedAt: string;
  location?: string;
}

interface PollenData {
  tree_pollen: {
    count: number;
    risk: string;
  };
  grass_pollen: {
    count: number;
    risk: string;
  };
  weed_pollen: {
    count: number;
    risk: string;
  };
  updatedAt: string;
}

interface WeatherData {
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  cloudCover: number;
  visibility: number;
  dewPoint: number;
  pressure: number;
  precipIntensity: number;
  updatedAt: string;
}

interface FireData {
  fires: Array<{
    latitude: number;
    longitude: number;
    brightness: number;
    confidence: string;
    detectedAt: string;
  }>;
  count: number;
}

interface SoilData {
  soilMoisture: number;
  soilTemperature: number;
  updatedAt: string;
}

interface WaterVaporData {
  waterVapor: number;
  updatedAt: string;
}

export class AmbeeService {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.GETAMBEE_API_KEY || '';
    if (!this.apiKey) {
      console.warn('⚠️ GETAMBEE_API_KEY not found - Ambee service will use mock data');
    } else {
      console.log('🌍 AmbeeService initialized with API key');
    }
  }

  private async makeRequest<T>(endpoint: string, params: Record<string, any> = {}): Promise<T> {
    const queryString = new URLSearchParams(
      Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== null) {
          acc[key] = String(value);
        }
        return acc;
      }, {} as Record<string, string>)
    ).toString();

    const url = `${AMBEE_BASE_URL}${endpoint}${queryString ? `?${queryString}` : ''}`;

    const response = await fetch(url, {
      headers: {
        'x-api-key': this.apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Ambee API error: ${response.status} ${response.statusText}`);
    }

    return await response.json() as T;
  }

  // ==================== AIR QUALITY ====================

  async getAirQualityByCoordinates(lat: number, lng: number): Promise<AirQualityData> {
    if (!this.apiKey) {
      return this.getMockAirQuality(lat, lng);
    }
    try {
      const response = await this.makeRequest<any>('/latest/by-lat-lng', { lat, lng });
      return {
        AQI: response.data?.[0]?.AQI || response.AQI || 0,
        CO: response.data?.[0]?.CO || response.CO || 0,
        NO2: response.data?.[0]?.NO2 || response.NO2 || 0,
        O3: response.data?.[0]?.O3 || response.O3 || 0,
        PM10: response.data?.[0]?.PM10 || response.PM10 || 0,
        PM25: response.data?.[0]?.PM25 || response.PM25 || 0,
        SO2: response.data?.[0]?.SO2 || response.SO2 || 0,
        updatedAt: response.data?.[0]?.updatedAt || response.updatedAt || new Date().toISOString(),
        location: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      };
    } catch (error) {
      console.error('Error fetching air quality by coordinates:', error);
      return this.getMockAirQuality(lat, lng);
    }
  }

  async getAirQualityByPlace(place: string): Promise<AirQualityData> {
    if (!this.apiKey) {
      return this.getMockAirQuality(0, 0, place);
    }
    try {
      const response = await this.makeRequest<any>('/latest/by-place', { place });
      return {
        AQI: response.data?.[0]?.AQI || response.AQI || 0,
        CO: response.data?.[0]?.CO || response.CO || 0,
        NO2: response.data?.[0]?.NO2 || response.NO2 || 0,
        O3: response.data?.[0]?.O3 || response.O3 || 0,
        PM10: response.data?.[0]?.PM10 || response.PM10 || 0,
        PM25: response.data?.[0]?.PM25 || response.PM25 || 0,
        SO2: response.data?.[0]?.SO2 || response.SO2 || 0,
        updatedAt: response.data?.[0]?.updatedAt || response.updatedAt || new Date().toISOString(),
        location: place,
      };
    } catch (error) {
      console.error('Error fetching air quality by place:', error);
      return this.getMockAirQuality(0, 0, place);
    }
  }

  async getAirQualityByPostalCode(postalCode: string, countryCode: string): Promise<AirQualityData> {
    if (!this.apiKey) {
      return this.getMockAirQuality(0, 0, `${postalCode}, ${countryCode}`);
    }
    try {
      const response = await this.makeRequest<any>('/latest/by-postal-code', { postalCode, countryCode });
      return {
        AQI: response.data?.[0]?.AQI || response.AQI || 0,
        CO: response.data?.[0]?.CO || response.CO || 0,
        NO2: response.data?.[0]?.NO2 || response.NO2 || 0,
        O3: response.data?.[0]?.O3 || response.O3 || 0,
        PM10: response.data?.[0]?.PM10 || response.PM10 || 0,
        PM25: response.data?.[0]?.PM25 || response.PM25 || 0,
        SO2: response.data?.[0]?.SO2 || response.SO2 || 0,
        updatedAt: response.data?.[0]?.updatedAt || response.updatedAt || new Date().toISOString(),
        location: `${postalCode}, ${countryCode}`,
      };
    } catch (error) {
      console.error('Error fetching air quality by postal code:', error);
      return this.getMockAirQuality(0, 0, `${postalCode}, ${countryCode}`);
    }
  }

  // ==================== POLLEN ====================

  async getPollenByCoordinates(lat: number, lng: number): Promise<PollenData> {
    if (!this.apiKey) {
      return this.getMockPollen();
    }
    try {
      const response = await this.makeRequest<any>('/latest/pollen/by-lat-lng', { lat, lng });
      const data = response.data?.[0] || response;
      return {
        tree_pollen: {
          count: data.Count?.tree_pollen || 0,
          risk: data.Risk?.tree_pollen || 'Low',
        },
        grass_pollen: {
          count: data.Count?.grass_pollen || 0,
          risk: data.Risk?.grass_pollen || 'Low',
        },
        weed_pollen: {
          count: data.Count?.weed_pollen || 0,
          risk: data.Risk?.weed_pollen || 'Low',
        },
        updatedAt: data.updatedAt || new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error fetching pollen by coordinates:', error);
      return this.getMockPollen();
    }
  }

  async getPollenByPlace(place: string): Promise<PollenData> {
    if (!this.apiKey) {
      return this.getMockPollen();
    }
    try {
      const response = await this.makeRequest<any>('/latest/pollen/by-place', { place });
      const data = response.data?.[0] || response;
      return {
        tree_pollen: {
          count: data.Count?.tree_pollen || 0,
          risk: data.Risk?.tree_pollen || 'Low',
        },
        grass_pollen: {
          count: data.Count?.grass_pollen || 0,
          risk: data.Risk?.grass_pollen || 'Low',
        },
        weed_pollen: {
          count: data.Count?.weed_pollen || 0,
          risk: data.Risk?.weed_pollen || 'Low',
        },
        updatedAt: data.updatedAt || new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error fetching pollen by place:', error);
      return this.getMockPollen();
    }
  }

  async getPollenForecast(lat: number, lng: number): Promise<PollenData[]> {
    if (!this.apiKey) {
      return [this.getMockPollen(), this.getMockPollen()];
    }
    try {
      const response = await this.makeRequest<any>('/forecast/pollen/by-lat-lng', { lat, lng });
      return (response.data || []).map((item: any) => ({
        tree_pollen: {
          count: item.Count?.tree_pollen || 0,
          risk: item.Risk?.tree_pollen || 'Low',
        },
        grass_pollen: {
          count: item.Count?.grass_pollen || 0,
          risk: item.Risk?.grass_pollen || 'Low',
        },
        weed_pollen: {
          count: item.Count?.weed_pollen || 0,
          risk: item.Risk?.weed_pollen || 'Low',
        },
        updatedAt: item.time || new Date().toISOString(),
      }));
    } catch (error) {
      console.error('Error fetching pollen forecast:', error);
      return [this.getMockPollen(), this.getMockPollen()];
    }
  }

  // ==================== WEATHER ====================

  async getWeatherByCoordinates(lat: number, lng: number, units: 'si' | 'us' = 'us'): Promise<WeatherData> {
    if (!this.apiKey) {
      return this.getMockWeather();
    }
    try {
      const response = await this.makeRequest<any>('/weather/latest/by-lat-lng', { lat, lng, units });
      const data = response.data || response;
      return {
        temperature: data.temperature || 0,
        apparentTemperature: data.apparentTemperature || 0,
        humidity: data.humidity || 0,
        windSpeed: data.windSpeed || 0,
        windDirection: data.windBearing || 0,
        cloudCover: data.cloudCover || 0,
        visibility: data.visibility || 0,
        dewPoint: data.dewPoint || 0,
        pressure: data.pressure || 0,
        precipIntensity: data.precipIntensity || 0,
        updatedAt: data.time || new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error fetching weather by coordinates:', error);
      return this.getMockWeather();
    }
  }

  // ==================== FIRE/DISASTERS ====================

  async getFireDataByCoordinates(lat: number, lng: number): Promise<FireData> {
    if (!this.apiKey) {
      return this.getMockFireData();
    }
    try {
      const response = await this.makeRequest<any>('/latest/fire/by-lat-lng', { lat, lng });
      return {
        fires: (response.data || []).map((fire: any) => ({
          latitude: fire.latitude || 0,
          longitude: fire.longitude || 0,
          brightness: fire.brightness || 0,
          confidence: fire.confidence || 'unknown',
          detectedAt: fire.acq_time || new Date().toISOString(),
        })),
        count: response.data?.length || 0,
      };
    } catch (error) {
      console.error('Error fetching fire data:', error);
      return this.getMockFireData();
    }
  }

  // ==================== SOIL ====================

  async getSoilDataByCoordinates(lat: number, lng: number): Promise<SoilData> {
    if (!this.apiKey) {
      return this.getMockSoilData();
    }
    try {
      const response = await this.makeRequest<any>('/latest/soil/by-lat-lng', { lat, lng });
      const data = response.data?.[0] || response;
      return {
        soilMoisture: data.soilMoisture || 0,
        soilTemperature: data.soilTemperature || 0,
        updatedAt: data.updatedAt || new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error fetching soil data:', error);
      return this.getMockSoilData();
    }
  }

  // ==================== WATER VAPOR ====================

  async getWaterVaporByCoordinates(lat: number, lng: number): Promise<WaterVaporData> {
    if (!this.apiKey) {
      return this.getMockWaterVapor();
    }
    try {
      const response = await this.makeRequest<any>('/latest/water-vapor/by-lat-lng', { lat, lng });
      const data = response.data?.[0] || response;
      return {
        waterVapor: data.waterVapor || 0,
        updatedAt: data.updatedAt || new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error fetching water vapor:', error);
      return this.getMockWaterVapor();
    }
  }

  // ==================== HEALTH & SAFETY ANALYSIS ====================

  getHealthImpact(airQuality: AirQualityData): {
    level: string;
    color: string;
    message: string;
    recommendations: string[];
  } {
    const aqi = airQuality.AQI;
    
    if (aqi <= 50) {
      return {
        level: 'Good',
        color: 'green',
        message: 'Air quality is satisfactory',
        recommendations: ['Normal outdoor activities'],
      };
    } else if (aqi <= 100) {
      return {
        level: 'Moderate',
        color: 'yellow',
        message: 'Acceptable air quality',
        recommendations: ['Unusually sensitive people should limit outdoor exertion'],
      };
    } else if (aqi <= 150) {
      return {
        level: 'Unhealthy for Sensitive Groups',
        color: 'orange',
        message: 'Members of sensitive groups may experience health effects',
        recommendations: [
          'Crew with respiratory conditions should limit outdoor work',
          'Consider providing N95 masks',
        ],
      };
    } else if (aqi <= 200) {
      return {
        level: 'Unhealthy',
        color: 'red',
        message: 'Everyone may begin to experience health effects',
        recommendations: [
          'Limit outdoor work shifts',
          'Provide N95 masks to all crew',
          'Schedule frequent breaks in clean air',
        ],
      };
    } else if (aqi <= 300) {
      return {
        level: 'Very Unhealthy',
        color: 'purple',
        message: 'Health alert: everyone may experience serious effects',
        recommendations: [
          'Minimize outdoor work',
          'Mandatory N95 or P100 respirators',
          'Monitor crew health closely',
        ],
      };
    } else {
      return {
        level: 'Hazardous',
        color: 'maroon',
        message: 'Emergency conditions: everyone will be affected',
        recommendations: [
          'Postpone all outdoor work if possible',
          'Use supplied-air respirators for critical work',
          'Emergency health monitoring required',
        ],
      };
    }
  }

  // ==================== MOCK DATA ====================

  private getMockAirQuality(lat: number, lng: number, location?: string): AirQualityData {
    return {
      AQI: 42,
      CO: 0.3,
      NO2: 15.2,
      O3: 45.8,
      PM10: 28.5,
      PM25: 12.3,
      SO2: 5.1,
      updatedAt: new Date().toISOString(),
      location: location || `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
    };
  }

  private getMockPollen(): PollenData {
    return {
      tree_pollen: { count: 45, risk: 'Moderate' },
      grass_pollen: { count: 28, risk: 'Low' },
      weed_pollen: { count: 15, risk: 'Low' },
      updatedAt: new Date().toISOString(),
    };
  }

  private getMockWeather(): WeatherData {
    return {
      temperature: 78,
      apparentTemperature: 82,
      humidity: 65,
      windSpeed: 12,
      windDirection: 180,
      cloudCover: 40,
      visibility: 10,
      dewPoint: 62,
      pressure: 1013,
      precipIntensity: 0,
      updatedAt: new Date().toISOString(),
    };
  }

  private getMockFireData(): FireData {
    return {
      fires: [],
      count: 0,
    };
  }

  private getMockSoilData(): SoilData {
    return {
      soilMoisture: 0.35,
      soilTemperature: 72,
      updatedAt: new Date().toISOString(),
    };
  }

  private getMockWaterVapor(): WaterVaporData {
    return {
      waterVapor: 2.5,
      updatedAt: new Date().toISOString(),
    };
  }
}

export const ambeeService = new AmbeeService();
