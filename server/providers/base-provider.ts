// Base provider interface and common functionality
import fetch from 'node-fetch';
import type { UnifiedCamera, TrafficIncident, CameraJurisdiction } from '../services/unified511Directory.js';

export interface ProviderConfig {
  name: string;
  baseUrl: string;
  cameraEndpoint: string;
  incidentEndpoint: string;
  apiKeyRequired: boolean;
  formats: string[];
  counties: string[];
  state: string;
}

export abstract class BaseProvider {
  protected config: ProviderConfig;
  private cameraCache = new Map<string, { data: UnifiedCamera[], timestamp: number }>();
  private incidentCache = new Map<string, { data: TrafficIncident[], timestamp: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(config: ProviderConfig) {
    this.config = config;
    console.log(`🏗️ Initializing ${config.name} provider`);
  }

  async getCameras(): Promise<UnifiedCamera[]> {
    const cacheKey = `cameras_${this.config.state}`;
    const cached = this.cameraCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      console.log(`📦 Returning cached cameras for ${this.config.state} (${cached.data.length} cameras)`);
      return cached.data;
    }

    try {
      console.log(`🎥 Fetching cameras from ${this.config.name}...`);
      const cameras = await this.fetchCameras();
      
      this.cameraCache.set(cacheKey, { data: cameras, timestamp: Date.now() });
      console.log(`✅ Fetched ${cameras.length} cameras from ${this.config.name}`);
      
      return cameras;
    } catch (error) {
      console.error(`❌ Error fetching cameras from ${this.config.name}:`, error);
      return this.getMockCameras();
    }
  }

  async getIncidents(): Promise<TrafficIncident[]> {
    const cacheKey = `incidents_${this.config.state}`;
    const cached = this.incidentCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      console.log(`📦 Returning cached incidents for ${this.config.state} (${cached.data.length} incidents)`);
      return cached.data;
    }

    try {
      console.log(`🚨 Fetching incidents from ${this.config.name}...`);
      const incidents = await this.fetchIncidents();
      
      this.incidentCache.set(cacheKey, { data: incidents, timestamp: Date.now() });
      console.log(`✅ Fetched ${incidents.length} incidents from ${this.config.name}`);
      
      return incidents;
    } catch (error) {
      console.error(`❌ Error fetching incidents from ${this.config.name}:`, error);
      return this.getMockIncidents();
    }
  }

  protected async makeRequest(endpoint: string): Promise<any> {
    const url = `${this.config.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'StormLead-TrafficCamWatcher/1.0 (contact@stormlead.com)',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`${this.config.name} API error: ${response.status}`);
    }

    return response.json();
  }

  // Abstract methods that each provider must implement
  protected abstract fetchCameras(): Promise<UnifiedCamera[]>;
  protected abstract fetchIncidents(): Promise<TrafficIncident[]>;
  protected abstract normalizeCameraData(data: any): UnifiedCamera[];
  protected abstract normalizeIncidentData(data: any): TrafficIncident[];

  // Common utility methods
  protected determineCameraType(camera: any): UnifiedCamera['type'] {
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

  protected classifyIncidentType(incident: any): TrafficIncident['type'] {
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

  protected classifySeverity(incident: any): TrafficIncident['severity'] {
    const severity = (incident.severity || '').toLowerCase();
    const description = (incident.description || '').toLowerCase();
    
    if (severity.includes('critical') || description.includes('emergency')) return 'critical';
    if (severity.includes('severe') || description.includes('major')) return 'severe';
    if (severity.includes('moderate') || description.includes('minor')) return 'moderate';
    
    return 'minor'; // Default
  }

  protected isContractorOpportunity(incident: any): boolean {
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

  protected guessCountyFromName(name: string): string | undefined {
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

  // Mock data methods for development
  protected getMockCameras(): UnifiedCamera[] {
    return [
      {
        id: `${this.config.state.toLowerCase()}_mock_001`,
        name: `${this.config.state} I-75 @ Exit 245`,
        lat: 33.7490 + Math.random() * 2,
        lng: -84.3880 + Math.random() * 2,
        type: 'highway',
        snapshotUrl: `https://example.com/${this.config.state.toLowerCase()}/camera001.jpg`,
        jurisdiction: {
          state: this.config.state.toUpperCase(),
          county: 'Main County',
          jurisdiction: 'state_dot',
          provider: this.config.name
        },
        isActive: true,
        lastUpdated: new Date(),
        metadata: {
          route: 'I-75',
          direction: 'Northbound',
          milepost: '245'
        }
      }
    ];
  }

  protected getMockIncidents(): TrafficIncident[] {
    return [
      {
        id: `${this.config.state.toLowerCase()}_incident_mock_001`,
        type: 'tree_down',
        description: 'Large tree blocking right lane due to storm damage',
        lat: 33.7490 + Math.random() * 2,
        lng: -84.3880 + Math.random() * 2,
        severity: 'severe',
        startTime: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        affectedRoutes: ['I-285', 'Exit 42'],
        jurisdiction: {
          state: this.config.state.toUpperCase(),
          jurisdiction: 'state_dot',
          provider: this.config.name
        },
        isContractorOpportunity: true
      }
    ];
  }
}