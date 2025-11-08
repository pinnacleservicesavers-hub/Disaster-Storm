import fetch from 'node-fetch';

interface MRMSRadarData {
  timestamp: Date;
  latitude: number;
  longitude: number;
  precipRate: number; // mm/hr
  hailSize: number; // inches
  reflectivity: number; // dBZ
  location: string;
}

interface MRMSResponse {
  count: number;
  data: MRMSRadarData[];
  summary: {
    maxPrecipRate: number;
    maxHailSize: number;
    significantCells: number;
  };
  dataSource: string;
  isRealData: boolean;
}

export class NoaaMrmsService {
  private baseUrl = 'https://mrms.ncep.noaa.gov/data';
  
  async getRecentRadarData(region?: { minLat: number; maxLat: number; minLon: number; maxLon: number }): Promise<MRMSResponse> {
    console.warn('⚠️ MRMS real-time radar data not yet implemented - requires AWS S3 GRIB2 parsing');
    
    return {
      count: 0,
      data: [],
      summary: {
        maxPrecipRate: 0,
        maxHailSize: 0,
        significantCells: 0
      },
      dataSource: 'MRMS not configured',
      isRealData: false
    };
  }

  async getHailReports(minSize: number = 0.5): Promise<{ count: number; reports: Array<{ location: string; size: number; time: Date }> }> {
    const radarData = await this.getRecentRadarData();
    const hailReports = radarData.data
      .filter(d => d.hailSize >= minSize)
      .map(d => ({
        location: d.location,
        size: d.hailSize,
        time: d.timestamp
      }));

    return {
      count: hailReports.length,
      reports: hailReports
    };
  }

  async getHeavyPrecipAreas(minRate: number = 50): Promise<{ count: number; areas: Array<{ location: string; rate: number; time: Date }> }> {
    const radarData = await this.getRecentRadarData();
    const heavyPrecip = radarData.data
      .filter(d => d.precipRate >= minRate)
      .map(d => ({
        location: d.location,
        rate: d.precipRate,
        time: d.timestamp
      }));

    return {
      count: heavyPrecip.length,
      areas: heavyPrecip
    };
  }
}

export const mrmsService = new NoaaMrmsService();
