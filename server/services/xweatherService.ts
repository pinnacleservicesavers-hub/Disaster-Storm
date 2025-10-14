import fetch from 'node-fetch';

const XWEATHER_BASE_URL = 'https://data.api.xweather.com';

interface XweatherCredentials {
  clientId: string;
  clientSecret: string;
}

// ==================== LIGHTNING INTERFACES ====================

export interface LightningStrike {
  id: string;
  loc: {
    lat: number;
    long: number;
  };
  ob: {
    timestamp: number;
    dateTimeISO: string;
    pulse: {
      type: 'cg' | 'ic'; // cloud-to-ground or intracloud
      peakamp: number;
      numSensors: number;
    };
  };
  age: number; // seconds since strike
}

export interface LightningThreatPeriod {
  range: {
    timestamp: number;
    timestampEnd: number;
    dateTimeISO: string;
  };
  centroid: {
    type: 'Point';
    coordinates: [number, number];
  };
  linestring?: {
    type: 'LineString';
    coordinates: number[][];
  };
  movement: {
    dirToDEG: number;
    dirTo: string;
    speedKPH: number;
    speedMPH: number;
  };
  reliability: 'NOT_AVAILABLE' | 'UNPHYSICAL' | 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface LightningThreat {
  id: string;
  periods: LightningThreatPeriod[];
}

// ==================== HAIL INTERFACES ====================

export interface HailThreatPeriod {
  range: {
    timestamp: number;
    timestampEnd: number;
    dateTimeISO: string;
  };
  centroid: {
    type: 'Point';
    coordinates: [number, number];
  };
  polygon?: {
    type: 'Polygon';
    coordinates: number[][][];
  };
  linestring?: {
    type: 'LineString';
    coordinates: number[][];
  };
  hail: {
    sizeIN: number;
    sizeMM: number;
    probability: number;
  };
  movement: {
    dirFromDEG: number;
    dirFrom: string;
    dirToDEG: number;
    dirTo: string;
    speedKPH: number;
    speedMPH: number;
    speedKTS: number;
  };
}

export interface HailThreat {
  id: string;
  source: string;
  details: {
    timestamp: number;
    dateTimeISO: string;
  };
  periods: HailThreatPeriod[];
  span: number; // total active intervals
}

// ==================== STORM INTERFACES ====================

export interface StormThreats {
  loc: {
    lat: number;
    long: number;
  };
  periods: Array<{
    timestamp: number;
    dateTimeISO: string;
    storms?: {
      phrase?: {
        long: string;
      };
      distance?: {
        minKM: number;
        maxKM: number;
        minMI: number;
        maxMI: number;
      };
      direction?: {
        from: string;
        to: string;
      };
      speed?: {
        avgKPH: number;
        avgMPH: number;
      };
      hail: number | null; // mm
      rotation: boolean;
      tornadic: boolean;
      advisories: string[]; // VTEC codes like SV.W, TO.W
      dbz?: {
        min: number;
        max: number;
      };
      lightning?: {
        nearby: number;
        approaching: number;
      };
    };
  }>;
}

export interface StormReport {
  id: string;
  loc: {
    lat: number;
    long: number;
  };
  place: {
    name: string;
    state: string;
    country: string;
  };
  ob: {
    timestamp: number;
    dateTimeISO: string;
    category: 'hail' | 'tornado' | 'wind' | 'flood' | 'lightning' | 'snow' | 'ice';
    report: {
      name: string;
      comments?: string;
      hailIN?: number;
      hailMM?: number;
      windKTS?: number;
      windMPH?: number;
      rainIN?: number;
      rainMM?: number;
    };
  };
}

// ==================== XWEATHER SERVICE ====================

export class XweatherService {
  private credentials: XweatherCredentials;

  constructor() {
    this.credentials = {
      clientId: process.env.XWEATHER_CLIENT_ID || '',
      clientSecret: process.env.XWEATHER_CLIENT_SECRET || '',
    };

    if (!this.credentials.clientId || !this.credentials.clientSecret) {
      console.warn('⚠️ XWEATHER_CLIENT_ID or XWEATHER_CLIENT_SECRET not found - Xweather service will use mock data');
    } else {
      console.log('⚡ XweatherService initialized with credentials');
    }
  }

  private async makeRequest<T>(endpoint: string, action: string, params: Record<string, any> = {}): Promise<T> {
    if (!this.credentials.clientId || !this.credentials.clientSecret) {
      throw new Error('Xweather credentials not configured');
    }

    // Add authentication params
    const allParams = {
      ...params,
      client_id: this.credentials.clientId,
      client_secret: this.credentials.clientSecret,
    };

    const queryString = new URLSearchParams(
      Object.entries(allParams).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== null) {
          acc[key] = String(value);
        }
        return acc;
      }, {} as Record<string, string>)
    ).toString();

    const url = `${XWEATHER_BASE_URL}${endpoint}/${action}${queryString ? `?${queryString}` : ''}`;

    const response = await fetch(url);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Xweather API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json() as any;
    return data;
  }

  // ==================== LIGHTNING ====================

  /**
   * Get recent lightning strikes (past 5 minutes)
   * @param lat Latitude
   * @param lng Longitude
   * @param radiusKM Radius in kilometers (max 100km)
   */
  async getLightningStrikes(lat: number, lng: number, radiusKM: number = 50): Promise<LightningStrike[]> {
    try {
      const response = await this.makeRequest<any>(
        '/lightning',
        `radius/${lat},${lng},${radiusKM}`
      );
      return response.response || [];
    } catch (error) {
      console.error('Error fetching lightning strikes:', error);
      return this.getMockLightningStrikes(lat, lng);
    }
  }

  /**
   * Get lightning threats forecast (next 60 minutes)
   * @param lat Latitude
   * @param lng Longitude
   */
  async getLightningThreats(lat: number, lng: number): Promise<LightningThreat[]> {
    try {
      const response = await this.makeRequest<any>(
        '/lightning/threats',
        `${lat},${lng}`
      );
      return response.response || [];
    } catch (error) {
      console.error('Error fetching lightning threats:', error);
      return this.getMockLightningThreats();
    }
  }

  // ==================== HAIL ====================

  /**
   * Get hail threats nowcast (next 60 minutes in 10-min intervals)
   * @param lat Latitude
   * @param lng Longitude
   */
  async getHailThreats(lat: number, lng: number): Promise<HailThreat[]> {
    try {
      const response = await this.makeRequest<any>(
        '/hail/threats',
        `${lat},${lng}`
      );
      return response.response || [];
    } catch (error) {
      console.error('Error fetching hail threats:', error);
      return this.getMockHailThreats();
    }
  }

  // ==================== STORM THREATS ====================

  /**
   * Get comprehensive storm threats for a location
   * Integrates storm cells, radar, lightning, and warnings
   * @param lat Latitude
   * @param lng Longitude
   */
  async getStormThreats(lat: number, lng: number): Promise<StormThreats> {
    try {
      const response = await this.makeRequest<any>(
        '/threats',
        `${lat},${lng}`
      );
      return response.response?.[0] || this.getMockStormThreats(lat, lng);
    } catch (error) {
      console.error('Error fetching storm threats:', error);
      return this.getMockStormThreats(lat, lng);
    }
  }

  // ==================== STORM REPORTS ====================

  /**
   * Get NWS local storm reports (US only)
   * @param lat Latitude
   * @param lng Longitude
   * @param radiusKM Radius in kilometers
   * @param category Optional filter: 'hail', 'tornado', 'wind', etc.
   */
  async getStormReports(
    lat: number,
    lng: number,
    radiusKM: number = 50,
    category?: string
  ): Promise<StormReport[]> {
    try {
      const params = category ? { filter: category } : {};
      const response = await this.makeRequest<any>(
        '/stormreports',
        `radius/${lat},${lng},${radiusKM}`,
        params
      );
      return response.response || [];
    } catch (error) {
      console.error('Error fetching storm reports:', error);
      return [];
    }
  }

  // ==================== COMBINED INTELLIGENCE ====================

  /**
   * Get comprehensive storm intelligence combining multiple data sources
   * This is the primary method for getting complete storm information
   */
  async getComprehensiveStormData(lat: number, lng: number, radiusKM: number = 50) {
    try {
      const [lightningStrikes, lightningThreats, hailThreats, stormThreats, stormReports] = await Promise.allSettled([
        this.getLightningStrikes(lat, lng, radiusKM),
        this.getLightningThreats(lat, lng),
        this.getHailThreats(lat, lng),
        this.getStormThreats(lat, lng),
        this.getStormReports(lat, lng, radiusKM),
      ]);

      return {
        location: { lat, lng, radiusKM },
        timestamp: new Date().toISOString(),
        lightning: {
          recentStrikes: lightningStrikes.status === 'fulfilled' ? lightningStrikes.value : [],
          threats: lightningThreats.status === 'fulfilled' ? lightningThreats.value : [],
        },
        hail: {
          threats: hailThreats.status === 'fulfilled' ? hailThreats.value : [],
        },
        storms: stormThreats.status === 'fulfilled' ? stormThreats.value : this.getMockStormThreats(lat, lng),
        reports: stormReports.status === 'fulfilled' ? stormReports.value : [],
        dataSource: 'xweather',
      };
    } catch (error) {
      console.error('Error fetching comprehensive storm data:', error);
      throw error;
    }
  }

  // ==================== THREAT ANALYSIS ====================

  /**
   * Analyze threat severity from combined data
   */
  analyzeThreatLevel(data: any): {
    level: 'LOW' | 'MODERATE' | 'HIGH' | 'SEVERE' | 'EXTREME';
    color: string;
    message: string;
    recommendations: string[];
  } {
    let score = 0;
    const recommendations: string[] = [];

    // Lightning strikes in past 5 minutes
    const strikeCount = data.lightning?.recentStrikes?.length || 0;
    if (strikeCount > 0) {
      score += Math.min(strikeCount * 5, 30);
      recommendations.push(`${strikeCount} lightning strikes detected nearby`);
    }

    // Lightning threats in next 60 minutes
    const lightningThreatCount = data.lightning?.threats?.length || 0;
    if (lightningThreatCount > 0) {
      score += lightningThreatCount * 10;
      recommendations.push('Lightning threats forecasted in next hour');
    }

    // Hail threats
    const hailThreats = data.hail?.threats || [];
    const maxHailSize = Math.max(...hailThreats.flatMap((t: HailThreat) =>
      t.periods.map(p => p.hail.sizeIN)
    ), 0);
    if (maxHailSize > 0) {
      score += maxHailSize * 20;
      recommendations.push(`Hail threat: up to ${maxHailSize.toFixed(1)}" diameter`);
    }

    // Storm advisories
    const hasAdvisories = data.storms?.periods?.[0]?.storms?.advisories?.length > 0;
    if (hasAdvisories) {
      score += 40;
      recommendations.push('Active weather warnings in effect');
    }

    // Tornadic/rotating storms
    if (data.storms?.periods?.[0]?.storms?.tornadic) {
      score += 50;
      recommendations.push('⚠️ TORNADIC STORM DETECTED');
    }

    if (score === 0) {
      return {
        level: 'LOW',
        color: 'green',
        message: 'No significant storm threats detected',
        recommendations: ['Normal operations can continue'],
      };
    } else if (score < 30) {
      return {
        level: 'MODERATE',
        color: 'yellow',
        message: 'Minor storm activity detected',
        recommendations,
      };
    } else if (score < 60) {
      return {
        level: 'HIGH',
        color: 'orange',
        message: 'Significant storm threats present',
        recommendations: ['Monitor conditions closely', ...recommendations],
      };
    } else if (score < 90) {
      return {
        level: 'SEVERE',
        color: 'red',
        message: 'Severe storm conditions',
        recommendations: ['Consider crew safety protocols', 'Secure equipment', ...recommendations],
      };
    } else {
      return {
        level: 'EXTREME',
        color: 'purple',
        message: 'Extreme weather emergency',
        recommendations: ['Evacuate to shelter immediately', 'Cease all outdoor operations', ...recommendations],
      };
    }
  }

  // ==================== MOCK DATA ====================

  private getMockLightningStrikes(lat: number, lng: number): LightningStrike[] {
    return [
      {
        id: 'mock-strike-1',
        loc: { lat: lat + 0.05, long: lng + 0.05 },
        ob: {
          timestamp: Date.now() / 1000 - 120,
          dateTimeISO: new Date(Date.now() - 120000).toISOString(),
          pulse: {
            type: 'cg',
            peakamp: -12000,
            numSensors: 6,
          },
        },
        age: 120,
      },
    ];
  }

  private getMockLightningThreats(): LightningThreat[] {
    return [];
  }

  private getMockHailThreats(): HailThreat[] {
    return [];
  }

  private getMockStormThreats(lat: number, lng: number): StormThreats {
    return {
      loc: { lat, long: lng },
      periods: [
        {
          timestamp: Date.now() / 1000,
          dateTimeISO: new Date().toISOString(),
        },
      ],
    };
  }
}

export const xweatherService = new XweatherService();
