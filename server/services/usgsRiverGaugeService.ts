import fetch from 'node-fetch';

interface RiverGauge {
  siteCode: string;
  siteName: string;
  latitude: number;
  longitude: number;
  currentStage: number; // feet
  floodStage: number; // feet
  actionStage: number; // feet
  discharge: number; // cubic feet per second
  timestamp: Date;
  floodStatus: 'normal' | 'action' | 'minor' | 'moderate' | 'major';
}

interface RiverGaugeResponse {
  count: number;
  gauges: RiverGauge[];
  floodingGauges: number;
  criticalGauges: Array<{ name: string; stage: number; floodStage: number }>;
}

export class UsgsRiverGaugeService {
  private baseUrl = 'https://waterservices.usgs.gov/nwis/iv';
  
  // Key river gauges for flood monitoring
  private criticalGauges = [
    { code: '02323500', name: 'Suwannee River at Branford, FL', lat: 29.9550, lon: -82.9278, floodStage: 28.0, actionStage: 25.0 },
    { code: '02312500', name: 'Withlacoochee River near Holder, FL', lat: 29.0078, lon: -82.4042, floodStage: 14.0, actionStage: 12.0 },
    { code: '02246500', name: 'St Johns River near Christmas, FL', lat: 28.5444, lon: -80.9878, floodStage: 8.5, actionStage: 7.0 },
    { code: '02231000', name: 'St Marys River near Macclenny, FL', lat: 30.3358, lon: -82.1156, floodStage: 16.0, actionStage: 14.0 },
    { code: '02321500', name: 'Santa Fe River at Fort White, FL', lat: 29.8536, lon: -82.7170, floodStage: 20.0, actionStage: 18.0 },
    { code: '02297310', name: 'Peace River at Arcadia, FL', lat: 27.2156, lon: -81.8639, floodStage: 13.0, actionStage: 11.0 },
    { code: '02359170', name: 'Chipola River near Altha, FL', lat: 30.5669, lon: -85.1500, floodStage: 16.0, actionStage: 14.0 },
    { code: '03574500', name: 'Tennessee River at Decatur, AL', lat: 34.5878, lon: -86.9839, floodStage: 20.0, actionStage: 18.0 }
  ];

  async getCurrentGaugeData(state?: string): Promise<RiverGaugeResponse> {
    try {
      // In production, make actual API calls to USGS NWIS
      // For now, generate realistic mock data
      const gaugeData = this.generateMockGaugeData();
      
      const floodingGauges = gaugeData.filter(g => g.floodStatus !== 'normal').length;
      const criticalGauges = gaugeData
        .filter(g => g.floodStatus === 'moderate' || g.floodStatus === 'major')
        .map(g => ({
          name: g.siteName,
          stage: g.currentStage,
          floodStage: g.floodStage
        }));

      return {
        count: gaugeData.length,
        gauges: gaugeData,
        floodingGauges,
        criticalGauges
      };
    } catch (error) {
      console.error('USGS river gauge service error:', error);
      return { count: 0, gauges: [], floodingGauges: 0, criticalGauges: [] };
    }
  }

  private generateMockGaugeData(): RiverGauge[] {
    return this.criticalGauges.map(gauge => {
      // Simulate varying water levels
      const normalStage = gauge.actionStage - 5; // Normal is well below action
      const variability = Math.random() * (gauge.floodStage + 3 - normalStage);
      const currentStage = normalStage + variability;
      
      let floodStatus: 'normal' | 'action' | 'minor' | 'moderate' | 'major' = 'normal';
      if (currentStage >= gauge.floodStage + 4) floodStatus = 'major';
      else if (currentStage >= gauge.floodStage + 2) floodStatus = 'moderate';
      else if (currentStage >= gauge.floodStage) floodStatus = 'minor';
      else if (currentStage >= gauge.actionStage) floodStatus = 'action';
      
      return {
        siteCode: gauge.code,
        siteName: gauge.name,
        latitude: gauge.lat,
        longitude: gauge.lon,
        currentStage: Math.round(currentStage * 100) / 100,
        floodStage: gauge.floodStage,
        actionStage: gauge.actionStage,
        discharge: Math.round(Math.random() * 10000 + 1000), // CFS
        timestamp: new Date(),
        floodStatus
      };
    });
  }

  async getRealTimeGaugeData(siteCode: string): Promise<any> {
    try {
      const url = `${this.baseUrl}?sites=${siteCode}&parameterCd=00065,00060&format=json`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`USGS API error: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Error fetching gauge data for site ${siteCode}:`, error);
      return null;
    }
  }

  async getFloodRiskByState(state: string): Promise<{ gauges: number; flooding: number; risk: 'low' | 'moderate' | 'high' }> {
    const gaugeData = await this.getCurrentGaugeData(state);
    const floodingCount = gaugeData.floodingGauges;
    const totalGauges = gaugeData.count;
    
    let risk: 'low' | 'moderate' | 'high' = 'low';
    if (floodingCount > totalGauges * 0.5) risk = 'high';
    else if (floodingCount > totalGauges * 0.25) risk = 'moderate';
    
    return {
      gauges: totalGauges,
      flooding: floodingCount,
      risk
    };
  }
}

export const riverGaugeService = new UsgsRiverGaugeService();
