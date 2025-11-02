import fetch from 'node-fetch';

interface TidalStation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  state: string;
}

interface SurgeData {
  stationId: string;
  stationName: string;
  latitude: number;
  longitude: number;
  currentWaterLevel: number; // feet MLLW
  predictedLevel: number; // feet MLLW
  surge: number; // feet above predicted
  timestamp: Date;
  severity: 'normal' | 'minor' | 'moderate' | 'major';
}

interface SurgeResponse {
  count: number;
  stations: SurgeData[];
  maxSurge: number;
  criticalStations: Array<{ name: string; surge: number }>;
}

export class NoaaCoOpsService {
  private baseUrl = 'https://api.tidesandcurrents.noaa.gov/api/prod/datagetter';
  
  // Key coastal stations for storm surge monitoring
  private stations: TidalStation[] = [
    { id: '8723214', name: 'Virginia Key, FL', latitude: 25.7314, longitude: -80.1608, state: 'FL' },
    { id: '8724580', name: 'Key West, FL', latitude: 24.5511, longitude: -81.8081, state: 'FL' },
    { id: '8721604', name: 'Trident Pier, FL', latitude: 28.4156, longitude: -80.5939, state: 'FL' },
    { id: '8661070', name: 'Springmaid Pier, SC', latitude: 33.6550, longitude: -78.9183, state: 'SC' },
    { id: '8720030', name: 'Fernandina Beach, FL', latitude: 30.6717, longitude: -81.4650, state: 'FL' },
    { id: '8729108', name: 'Panama City, FL', latitude: 30.1517, longitude: -85.6667, state: 'FL' },
    { id: '8670870', name: 'Fort Pulaski, GA', latitude: 32.0333, longitude: -80.9017, state: 'GA' },
    { id: '8726520', name: 'Port Manatee, FL', latitude: 27.6383, longitude: -82.5650, state: 'FL' }
  ];

  async getCurrentSurgeData(state?: string): Promise<SurgeResponse> {
    try {
      const filteredStations = state 
        ? this.stations.filter(s => s.state === state.toUpperCase())
        : this.stations;
      
      // In production, make actual API calls to NOAA CO-OPS
      // For now, generate realistic mock data
      const surgeData = this.generateMockSurgeData(filteredStations);
      
      const maxSurge = Math.max(...surgeData.map(d => d.surge));
      const criticalStations = surgeData
        .filter(d => d.surge > 2.0) // More than 2 feet of surge
        .map(d => ({ name: d.stationName, surge: d.surge }));

      return {
        count: surgeData.length,
        stations: surgeData,
        maxSurge,
        criticalStations
      };
    } catch (error) {
      console.error('NOAA CO-OPS service error:', error);
      return { count: 0, stations: [], maxSurge: 0, criticalStations: [] };
    }
  }

  private generateMockSurgeData(stations: TidalStation[]): SurgeData[] {
    return stations.map(station => {
      const predictedLevel = Math.random() * 3 + 1; // 1-4 feet normal tide
      const surge = Math.random() > 0.7 ? Math.random() * 4 : Math.random() * 0.5; // Occasional surge events
      const currentWaterLevel = predictedLevel + surge;
      
      let severity: 'normal' | 'minor' | 'moderate' | 'major' = 'normal';
      if (surge > 3) severity = 'major';
      else if (surge > 2) severity = 'moderate';
      else if (surge > 1) severity = 'minor';
      
      return {
        stationId: station.id,
        stationName: station.name,
        latitude: station.latitude,
        longitude: station.longitude,
        currentWaterLevel: Math.round(currentWaterLevel * 100) / 100,
        predictedLevel: Math.round(predictedLevel * 100) / 100,
        surge: Math.round(surge * 100) / 100,
        timestamp: new Date(),
        severity
      };
    });
  }

  async getRealTimeWaterLevels(stationId: string): Promise<any> {
    try {
      const url = `${this.baseUrl}?date=latest&station=${stationId}&product=water_level&datum=MLLW&units=english&time_zone=gmt&application=DisasterDirect&format=json`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`NOAA CO-OPS API error: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Error fetching water levels for station ${stationId}:`, error);
      return null;
    }
  }

  async getCoastalFloodRisk(state?: string): Promise<{ low: number; moderate: number; high: number }> {
    const surgeData = await this.getCurrentSurgeData(state);
    
    return {
      low: surgeData.stations.filter(s => s.severity === 'normal' || s.severity === 'minor').length,
      moderate: surgeData.stations.filter(s => s.severity === 'moderate').length,
      high: surgeData.stations.filter(s => s.severity === 'major').length
    };
  }
}

export const coOpsService = new NoaaCoOpsService();
