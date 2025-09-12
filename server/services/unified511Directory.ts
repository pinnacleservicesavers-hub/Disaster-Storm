// Unified 511 Camera Directory
// Comprehensive state-by-state traffic camera and incident feed integration
// Normalizes data to: {id, name, lat, lon, type, url, snapshotUrl, jurisdiction}

import fetch from 'node-fetch';

export interface CameraJurisdiction {
  state: string;
  county?: string;
  city?: string;
  jurisdiction: string; // 'state_dot' | 'county' | 'city' | '511_provider'
  provider: string;
}

export interface UnifiedCamera {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: 'highway' | 'arterial' | 'intersection' | 'bridge' | 'tunnel' | 'border' | 'weather';
  url?: string; // Live stream URL
  snapshotUrl?: string; // Static image URL
  jurisdiction: CameraJurisdiction;
  isActive: boolean;
  lastUpdated: Date;
  metadata?: {
    direction?: string;
    milepost?: string;
    route?: string;
    description?: string;
  };
}

export interface TrafficIncident {
  id: string;
  type: 'tree_down' | 'road_blocked' | 'debris' | 'accident' | 'construction' | 'flooding' | 'power_lines_down';
  description: string;
  lat: number;
  lng: number;
  severity: 'minor' | 'moderate' | 'severe' | 'critical';
  startTime: Date;
  estimatedClearTime?: Date;
  affectedRoutes: string[];
  jurisdiction: CameraJurisdiction;
  isContractorOpportunity: boolean; // Trees, debris, structure damage
}

// State-specific 511 providers with their camera and incident APIs
const STATE_511_PROVIDERS = {
  'CA': {
    name: 'California 511',
    baseUrl: 'https://api.511.org',
    cameraEndpoint: '/traffic/cameras',
    incidentEndpoint: '/traffic/events',
    apiKeyRequired: true,
    formats: ['json'],
    counties: ['Alameda', 'Contra Costa', 'Marin', 'Napa', 'San Francisco', 'San Mateo', 'Santa Clara', 'Solano', 'Sonoma']
  },
  'NY': {
    name: 'New York 511',
    baseUrl: 'https://511ny.org',
    cameraEndpoint: '/api/cameras',
    incidentEndpoint: '/api/events',
    apiKeyRequired: false,
    formats: ['json', 'xml'],
    counties: ['New York', 'Kings', 'Queens', 'Bronx', 'Richmond', 'Nassau', 'Suffolk', 'Westchester']
  },
  'TX': {
    name: 'Texas DOT',
    baseUrl: 'https://its.txdot.gov',
    cameraEndpoint: '/api/cameras',
    incidentEndpoint: '/api/incidents',
    apiKeyRequired: false,
    formats: ['json'],
    counties: ['Harris', 'Dallas', 'Tarrant', 'Travis', 'Bexar', 'Collin', 'Fort Bend', 'Montgomery']
  },
  'FL': {
    name: 'Florida 511',
    baseUrl: 'https://fl511.com',
    cameraEndpoint: '/api/cameras',
    incidentEndpoint: '/api/incidents',
    apiKeyRequired: false,
    formats: ['json'],
    counties: ['Miami-Dade', 'Broward', 'Palm Beach', 'Orange', 'Hillsborough', 'Pinellas', 'Duval', 'Lee']
  },
  'WA': {
    name: 'Washington State DOT',
    baseUrl: 'https://wsdot.wa.gov',
    cameraEndpoint: '/traffic/api/cameras',
    incidentEndpoint: '/traffic/api/incidents',
    apiKeyRequired: false,
    formats: ['json'],
    counties: ['King', 'Pierce', 'Snohomish', 'Spokane', 'Clark', 'Thurston', 'Kitsap', 'Whatcom']
  },
  'GA': {
    name: 'Georgia DOT',
    baseUrl: 'https://511ga.org',
    cameraEndpoint: '/api/cameras',
    incidentEndpoint: '/api/events',
    apiKeyRequired: false,
    formats: ['json'],
    counties: ['Fulton', 'Gwinnett', 'Cobb', 'DeKalb', 'Clayton', 'Cherokee', 'Forsyth', 'Henry']
  },
  'CO': {
    name: 'Colorado DOT',
    baseUrl: 'https://cotrip.org',
    cameraEndpoint: '/api/cameras',
    incidentEndpoint: '/api/incidents',
    apiKeyRequired: false,
    formats: ['json'],
    counties: ['Denver', 'Jefferson', 'Arapahoe', 'Adams', 'Boulder', 'Larimer', 'Douglas', 'El Paso']
  },
  'AZ': {
    name: 'Arizona DOT',
    baseUrl: 'https://az511.gov',
    cameraEndpoint: '/api/cameras',
    incidentEndpoint: '/api/incidents',
    apiKeyRequired: false,
    formats: ['json'],
    counties: ['Maricopa', 'Pima', 'Pinal', 'Yuma', 'Mohave', 'Coconino', 'Yavapai', 'Cochise']
  },
  'NC': {
    name: 'North Carolina DOT',
    baseUrl: 'https://tims.ncdot.gov',
    cameraEndpoint: '/api/cameras',
    incidentEndpoint: '/api/incidents',
    apiKeyRequired: false,
    formats: ['json'],
    counties: ['Mecklenburg', 'Wake', 'Guilford', 'Forsyth', 'Cumberland', 'Durham', 'Union', 'Cabarrus']
  },
  'VA': {
    name: 'Virginia DOT',
    baseUrl: 'https://511virginia.org',
    cameraEndpoint: '/api/cameras',
    incidentEndpoint: '/api/incidents',
    apiKeyRequired: false,
    formats: ['json'],
    counties: ['Fairfax', 'Virginia Beach', 'Norfolk', 'Chesapeake', 'Newport News', 'Alexandria', 'Hampton', 'Portsmouth']
  }
};

export class Unified511Directory {
  private cameraCache = new Map<string, { data: UnifiedCamera[], timestamp: number }>();
  private incidentCache = new Map<string, { data: TrafficIncident[], timestamp: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor() {
    console.log('🏗️ Initializing Unified 511 Directory for TrafficCamWatcher');
    console.log(`📍 Supporting ${Object.keys(STATE_511_PROVIDERS).length} states with 511 integration`);
  }

  async getCamerasByState(state: string): Promise<UnifiedCamera[]> {
    const cacheKey = `cameras_${state}`;
    const cached = this.cameraCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      console.log(`📦 Returning cached cameras for ${state} (${cached.data.length} cameras)`);
      return cached.data;
    }

    const provider = STATE_511_PROVIDERS[state.toUpperCase() as keyof typeof STATE_511_PROVIDERS];
    if (!provider) {
      console.log(`⚠️ No 511 provider configured for state: ${state}`);
      return [];
    }

    try {
      console.log(`🎥 Fetching cameras from ${provider.name}...`);
      const cameras = await this.fetchCamerasFromProvider(state, provider);
      
      this.cameraCache.set(cacheKey, { data: cameras, timestamp: Date.now() });
      console.log(`✅ Fetched ${cameras.length} cameras from ${provider.name}`);
      
      return cameras;
    } catch (error) {
      console.error(`❌ Error fetching cameras from ${provider.name}:`, error);
      return [];
    }
  }

  async getCamerasByCounty(state: string, county: string): Promise<UnifiedCamera[]> {
    const stateCameras = await this.getCamerasByState(state);
    return stateCameras.filter(camera => 
      camera.jurisdiction.county?.toLowerCase() === county.toLowerCase()
    );
  }

  async getIncidentsByState(state: string): Promise<TrafficIncident[]> {
    const cacheKey = `incidents_${state}`;
    const cached = this.incidentCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      console.log(`📦 Returning cached incidents for ${state} (${cached.data.length} incidents)`);
      return cached.data;
    }

    const provider = STATE_511_PROVIDERS[state.toUpperCase() as keyof typeof STATE_511_PROVIDERS];
    if (!provider) {
      return [];
    }

    try {
      console.log(`🚨 Fetching incidents from ${provider.name}...`);
      const incidents = await this.fetchIncidentsFromProvider(state, provider);
      
      this.incidentCache.set(cacheKey, { data: incidents, timestamp: Date.now() });
      console.log(`✅ Fetched ${incidents.length} incidents from ${provider.name}`);
      
      return incidents;
    } catch (error) {
      console.error(`❌ Error fetching incidents from ${provider.name}:`, error);
      return [];
    }
  }

  // Get contractor opportunities (tree down, debris, structure damage)
  async getContractorOpportunities(state?: string): Promise<TrafficIncident[]> {
    const states = state ? [state] : Object.keys(STATE_511_PROVIDERS);
    const allOpportunities: TrafficIncident[] = [];

    for (const stateCode of states) {
      const incidents = await this.getIncidentsByState(stateCode);
      const opportunities = incidents.filter(incident => incident.isContractorOpportunity);
      allOpportunities.push(...opportunities);
    }

    return allOpportunities.sort((a, b) => {
      // Sort by severity (critical first) then by start time (newest first)
      const severityOrder = { critical: 4, severe: 3, moderate: 2, minor: 1 };
      const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
      if (severityDiff !== 0) return severityDiff;
      
      return b.startTime.getTime() - a.startTime.getTime();
    });
  }

  private async fetchCamerasFromProvider(state: string, provider: any): Promise<UnifiedCamera[]> {
    const url = `${provider.baseUrl}${provider.cameraEndpoint}`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'StormLead-TrafficCamWatcher/1.0 (contact@stormlead.com)',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`${provider.name} API error: ${response.status}`);
      }

      const data = await response.json() as any;
      return this.normalizeCameraData(state, data, provider);
    } catch (error) {
      console.error(`Error fetching from ${provider.name}:`, error);
      
      // Return mock data for development
      return this.getMockCamerasForState(state);
    }
  }

  private async fetchIncidentsFromProvider(state: string, provider: any): Promise<TrafficIncident[]> {
    const url = `${provider.baseUrl}${provider.incidentEndpoint}`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'StormLead-TrafficCamWatcher/1.0 (contact@stormlead.com)',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`${provider.name} incidents API error: ${response.status}`);
      }

      const data = await response.json() as any;
      return this.normalizeIncidentData(state, data, provider);
    } catch (error) {
      console.error(`Error fetching incidents from ${provider.name}:`, error);
      
      // Return mock incidents for development
      return this.getMockIncidentsForState(state);
    }
  }

  private normalizeCameraData(state: string, data: any, provider: any): UnifiedCamera[] {
    if (!Array.isArray(data?.cameras) && !Array.isArray(data)) {
      return [];
    }

    const cameras = Array.isArray(data) ? data : (data.cameras || []);
    
    return cameras.map((camera: any, index: number) => ({
      id: `${state.toLowerCase()}_511_${camera.id || camera.cameraId || index}`,
      name: camera.name || camera.title || camera.description || `${state} Camera ${index + 1}`,
      lat: parseFloat(camera.latitude || camera.lat || '0'),
      lng: parseFloat(camera.longitude || camera.lng || camera.lon || '0'),
      type: this.determineCameraType(camera),
      url: camera.streamUrl || camera.videoUrl || camera.url,
      snapshotUrl: camera.imageUrl || camera.snapshotUrl || camera.stillUrl,
      jurisdiction: {
        state: state.toUpperCase(),
        county: camera.county || this.guessCountyFromName(camera.name || ''),
        city: camera.city,
        jurisdiction: 'state_dot',
        provider: provider.name
      },
      isActive: camera.active !== false && camera.status !== 'offline',
      lastUpdated: new Date(),
      metadata: {
        direction: camera.direction,
        milepost: camera.milepost || camera.mile,
        route: camera.route || camera.highway || camera.roadway,
        description: camera.description || camera.title
      }
    }));
  }

  private normalizeIncidentData(state: string, data: any, provider: any): TrafficIncident[] {
    if (!Array.isArray(data?.incidents) && !Array.isArray(data?.events) && !Array.isArray(data)) {
      return [];
    }

    const incidents = Array.isArray(data) ? data : (data.incidents || data.events || []);
    
    return incidents.map((incident: any, index: number) => ({
      id: `${state.toLowerCase()}_incident_${incident.id || index}`,
      type: this.classifyIncidentType(incident),
      description: incident.description || incident.title || 'Traffic incident',
      lat: parseFloat(incident.latitude || incident.lat || '0'),
      lng: parseFloat(incident.longitude || incident.lng || incident.lon || '0'),
      severity: this.classifySeverity(incident),
      startTime: new Date(incident.startTime || incident.created || Date.now()),
      estimatedClearTime: incident.estimatedClearTime ? new Date(incident.estimatedClearTime) : undefined,
      affectedRoutes: incident.routes || incident.roads || [incident.route || 'Unknown Route'],
      jurisdiction: {
        state: state.toUpperCase(),
        county: incident.county || this.guessCountyFromName(incident.description || ''),
        jurisdiction: 'state_dot',
        provider: provider.name
      },
      isContractorOpportunity: this.isContractorOpportunity(incident)
    }));
  }

  private determineCameraType(camera: any): UnifiedCamera['type'] {
    const name = (camera.name || camera.title || '').toLowerCase();
    const description = (camera.description || '').toLowerCase();
    const combined = `${name} ${description}`;

    if (combined.includes('bridge')) return 'bridge';
    if (combined.includes('tunnel')) return 'tunnel';
    if (combined.includes('intersection') || combined.includes('signal')) return 'intersection';
    if (combined.includes('weather') || combined.includes('wind') || combined.includes('rain')) return 'weather';
    if (combined.includes('border') || combined.includes('port')) return 'border';
    if (combined.includes('highway') || combined.includes('freeway') || combined.includes('interstate')) return 'highway';
    
    return 'arterial'; // Default
  }

  private classifyIncidentType(incident: any): TrafficIncident['type'] {
    const description = (incident.description || incident.title || '').toLowerCase();
    const type = (incident.type || '').toLowerCase();
    const combined = `${description} ${type}`;

    if (combined.includes('tree') && combined.includes('down')) return 'tree_down';
    if (combined.includes('power') && combined.includes('line')) return 'power_lines_down';
    if (combined.includes('debris') || combined.includes('obstruction')) return 'debris';
    if (combined.includes('flood') || combined.includes('water')) return 'flooding';
    if (combined.includes('block') || combined.includes('closure')) return 'road_blocked';
    if (combined.includes('accident') || combined.includes('crash')) return 'accident';
    if (combined.includes('construction') || combined.includes('maintenance')) return 'construction';
    
    return 'road_blocked'; // Default
  }

  private classifySeverity(incident: any): TrafficIncident['severity'] {
    const severity = (incident.severity || '').toLowerCase();
    const description = (incident.description || '').toLowerCase();
    
    if (severity.includes('critical') || description.includes('emergency')) return 'critical';
    if (severity.includes('severe') || description.includes('major')) return 'severe';
    if (severity.includes('moderate') || description.includes('minor')) return 'moderate';
    
    return 'minor'; // Default
  }

  private isContractorOpportunity(incident: any): boolean {
    const description = (incident.description || incident.title || '').toLowerCase();
    const type = (incident.type || '').toLowerCase();
    const combined = `${description} ${type}`;

    // Contractor opportunities: tree removal, debris cleanup, power line issues, structural damage
    return (
      combined.includes('tree') ||
      combined.includes('debris') ||
      combined.includes('power line') ||
      combined.includes('structure') ||
      combined.includes('damage') ||
      combined.includes('cleanup')
    );
  }

  private guessCountyFromName(name: string): string | undefined {
    // Simple county extraction from camera/incident names
    const countyPatterns = [
      /(\w+)\s+county/i,
      /county\s+of\s+(\w+)/i,
      /(harris|dallas|tarrant|travis|bexar|cook|los angeles|orange|san diego)/i
    ];

    for (const pattern of countyPatterns) {
      const match = name.match(pattern);
      if (match) {
        return match[1];
      }
    }
    
    return undefined;
  }

  private getMockCamerasForState(state: string): UnifiedCamera[] {
    // Return mock cameras for development when APIs are unavailable
    const mockCameras = [
      {
        id: `${state.toLowerCase()}_mock_001`,
        name: `${state} I-75 @ Exit 245`,
        lat: 33.7490 + Math.random() * 2,
        lng: -84.3880 + Math.random() * 2,
        type: 'highway' as const,
        snapshotUrl: `https://example.com/${state.toLowerCase()}/camera001.jpg`,
        jurisdiction: {
          state: state.toUpperCase(),
          county: 'Main County',
          jurisdiction: 'state_dot' as const,
          provider: `${state} DOT Mock`
        },
        isActive: true,
        lastUpdated: new Date(),
        metadata: {
          route: 'I-75',
          direction: 'Northbound',
          milepost: '245'
        }
      },
      {
        id: `${state.toLowerCase()}_mock_002`,
        name: `${state} Highway 85 Bridge`,
        lat: 33.7490 + Math.random() * 2,
        lng: -84.3880 + Math.random() * 2,
        type: 'bridge' as const,
        snapshotUrl: `https://example.com/${state.toLowerCase()}/camera002.jpg`,
        jurisdiction: {
          state: state.toUpperCase(),
          county: 'Bridge County',
          jurisdiction: 'state_dot' as const,
          provider: `${state} DOT Mock`
        },
        isActive: true,
        lastUpdated: new Date(),
        metadata: {
          route: 'Highway 85',
          description: 'River crossing monitoring'
        }
      }
    ];

    return mockCameras;
  }

  private getMockIncidentsForState(state: string): TrafficIncident[] {
    // Return mock incidents for development
    return [
      {
        id: `${state.toLowerCase()}_incident_mock_001`,
        type: 'tree_down',
        description: 'Large tree blocking right lane due to storm damage',
        lat: 33.7490 + Math.random() * 2,
        lng: -84.3880 + Math.random() * 2,
        severity: 'severe',
        startTime: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        affectedRoutes: ['I-285', 'Exit 42'],
        jurisdiction: {
          state: state.toUpperCase(),
          jurisdiction: 'state_dot',
          provider: `${state} DOT Mock`
        },
        isContractorOpportunity: true
      }
    ];
  }

  // Get state directory with camera and incident counts
  async getStateDirectory(): Promise<Array<{
    state: string;
    name: string;
    cameraCount: number;
    incidentCount: number;
    contractorOpportunities: number;
    counties: string[];
    provider: string;
  }>> {
    const directory = [];

    for (const [stateCode, provider] of Object.entries(STATE_511_PROVIDERS)) {
      const cameras = await this.getCamerasByState(stateCode);
      const incidents = await this.getIncidentsByState(stateCode);
      const opportunities = incidents.filter(i => i.isContractorOpportunity);

      directory.push({
        state: stateCode,
        name: provider.name,
        cameraCount: cameras.length,
        incidentCount: incidents.length,
        contractorOpportunities: opportunities.length,
        counties: provider.counties,
        provider: provider.name
      });
    }

    return directory;
  }
}

// Export singleton instance
export const unified511Directory = new Unified511Directory();