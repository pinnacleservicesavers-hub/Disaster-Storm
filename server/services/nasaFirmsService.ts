import fetch from 'node-fetch';

export interface Wildfire {
  id: string;
  latitude: number;
  longitude: number;
  brightness: number; // Kelvin
  scan: number; // km
  track: number; // km
  acquisitionDate: Date;
  satellite: string; // VIIRS, MODIS
  confidence: string; // low, nominal, high
  frp: number; // Fire Radiative Power (MW)
  dayNight: 'D' | 'N';
}

class NASAFirmsService {
  private apiKey: string;
  private baseUrl = 'https://firms.modaps.eosdis.nasa.gov/api/area/csv';
  private recentFires: Map<string, Wildfire> = new Map();

  constructor() {
    // NASA FIRMS requires a free API key from https://firms.modaps.eosdis.nasa.gov/api/
    this.apiKey = process.env.NASA_FIRMS_API_KEY || '';
    
    if (!this.apiKey) {
      console.log('⚠️ NASA FIRMS: No API key found (set NASA_FIRMS_API_KEY)');
      console.log('📝 Get free key at: https://firms.modaps.eosdis.nasa.gov/api/');
    }
  }

  async fetchActiveWildfires(
    region: { minLat: number; maxLat: number; minLon: number; maxLon: number },
    days: number = 1
  ): Promise<Wildfire[]> {
    if (!this.apiKey) {
      console.log('🔥 NASA FIRMS: Using mock data (no API key)');
      return this.getMockWildfires();
    }

    try {
      const { minLat, maxLat, minLon, maxLon } = region;
      const url = `${this.baseUrl}/${this.apiKey}/VIIRS_NOAA20_NRT/${minLon},${minLat},${maxLon},${maxLat}/${days}`;

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`NASA FIRMS API error: ${response.status}`);
      }

      const csvData = await response.text();
      const wildfires = this.parseCSV(csvData);
      
      // Update cache
      this.recentFires.clear();
      wildfires.forEach(fire => {
        this.recentFires.set(fire.id, fire);
      });

      console.log(`🔥 NASA FIRMS: Found ${wildfires.length} active fire(s)`);
      return wildfires;
    } catch (error) {
      console.error('NASA FIRMS fetch error:', error);
      return [];
    }
  }

  private parseCSV(csv: string): Wildfire[] {
    const lines = csv.split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',');
    const wildfires: Wildfire[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      if (values.length < headers.length) continue;

      const data: any = {};
      headers.forEach((header, idx) => {
        data[header.trim()] = values[idx]?.trim();
      });

      const wildfire: Wildfire = {
        id: `firms-${data.latitude}-${data.longitude}-${data.acq_date}-${data.acq_time}`,
        latitude: parseFloat(data.latitude),
        longitude: parseFloat(data.longitude),
        brightness: parseFloat(data.bright_ti4) || parseFloat(data.brightness),
        scan: parseFloat(data.scan) || 0,
        track: parseFloat(data.track) || 0,
        acquisitionDate: this.parseDate(data.acq_date, data.acq_time),
        satellite: data.satellite || 'VIIRS',
        confidence: data.confidence || 'nominal',
        frp: parseFloat(data.frp) || 0,
        dayNight: data.daynight || 'D',
      };

      wildfires.push(wildfire);
    }

    return wildfires;
  }

  private parseDate(dateStr: string, timeStr: string): Date {
    // dateStr format: YYYY-MM-DD, timeStr format: HHMM
    const date = new Date(dateStr);
    const hours = parseInt(timeStr.substring(0, 2));
    const minutes = parseInt(timeStr.substring(2, 4));
    date.setHours(hours, minutes);
    return date;
  }

  private getMockWildfires(): Wildfire[] {
    // Mock data for development/testing when no API key
    return [
      {
        id: 'mock-fire-1',
        latitude: 34.0522,
        longitude: -118.2437,
        brightness: 325.5,
        scan: 0.4,
        track: 0.4,
        acquisitionDate: new Date(),
        satellite: 'VIIRS',
        confidence: 'high',
        frp: 12.5,
        dayNight: 'D',
      },
    ];
  }

  getActiveWildfires(): Wildfire[] {
    return Array.from(this.recentFires.values())
      .sort((a, b) => b.acquisitionDate.getTime() - a.acquisitionDate.getTime());
  }

  getWildfireById(id: string): Wildfire | undefined {
    return this.recentFires.get(id);
  }

  async fetchUSWildfires(days: number = 1): Promise<Wildfire[]> {
    // Fetch wildfires for continental US
    return this.fetchActiveWildfires({
      minLat: 24.5,
      maxLat: 49.0,
      minLon: -125.0,
      maxLon: -66.0,
    }, days);
  }
}

export const nasaFirmsService = new NASAFirmsService();
console.log('🔥 NASA FIRMS wildfire service initialized');
