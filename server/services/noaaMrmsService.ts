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
}

export class NoaaMrmsService {
  private baseUrl = 'https://mrms.ncep.noaa.gov/data';
  
  async getRecentRadarData(region?: { minLat: number; maxLat: number; minLon: number; maxLon: number }): Promise<MRMSResponse> {
    try {
      // MRMS data is available via AWS Public Dataset and NOAA servers
      // For now, we'll use mock data with realistic values
      // In production, you'd parse actual MRMS GRIB2 files from AWS S3
      
      const mockData = this.generateMockMrmsData(region);
      
      return {
        count: mockData.length,
        data: mockData,
        summary: {
          maxPrecipRate: Math.max(...mockData.map(d => d.precipRate)),
          maxHailSize: Math.max(...mockData.map(d => d.hailSize)),
          significantCells: mockData.filter(d => d.reflectivity > 50).length
        }
      };
    } catch (error) {
      console.error('MRMS service error:', error);
      return { count: 0, data: [], summary: { maxPrecipRate: 0, maxHailSize: 0, significantCells: 0 } };
    }
  }

  private generateMockMrmsData(region?: { minLat: number; maxLat: number; minLon: number; maxLon: number }): MRMSRadarData[] {
    // Generate realistic MRMS data for demonstration
    const cells: MRMSRadarData[] = [];
    
    // Simulate severe cells across the region
    const locations = [
      { lat: 25.7617, lon: -80.1918, name: 'Miami, FL' },
      { lat: 30.3322, lon: -81.6557, name: 'Jacksonville, FL' },
      { lat: 28.5383, lon: -81.3792, name: 'Orlando, FL' },
      { lat: 33.7490, lon: -84.3880, name: 'Atlanta, GA' },
      { lat: 29.7604, lon: -95.3698, name: 'Houston, TX' }
    ];

    locations.forEach((loc, idx) => {
      // Random severe weather characteristics
      const hasSevereWeather = Math.random() > 0.6;
      
      if (hasSevereWeather) {
        cells.push({
          timestamp: new Date(),
          latitude: loc.lat,
          longitude: loc.lon,
          precipRate: Math.random() * 100 + 20, // 20-120 mm/hr
          hailSize: Math.random() > 0.7 ? Math.random() * 2 : 0, // 0-2 inches
          reflectivity: Math.random() * 30 + 40, // 40-70 dBZ
          location: loc.name
        });
      }
    });

    return cells;
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
