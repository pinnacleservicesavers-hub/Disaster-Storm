// Unified 511 Camera Directory
// Legacy compatibility layer - now delegates to new provider registry system
// Normalizes data to: {id, name, lat, lon, type, url, snapshotUrl, jurisdiction}

import { providerRegistry } from '../providers/index.js';

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

// Legacy provider configuration - now managed by provider registry

export class Unified511Directory {
  constructor() {
    console.log('🏗️ Initializing Unified 511 Directory (Legacy Compatibility Layer)');
    console.log('📍 Delegating to new Provider Registry system');
  }

  async getCamerasByState(state: string): Promise<UnifiedCamera[]> {
    return providerRegistry.getCamerasByState(state);
  }

  async getCamerasByCounty(state: string, county: string): Promise<UnifiedCamera[]> {
    const stateCameras = await this.getCamerasByState(state);
    return stateCameras.filter(camera => 
      camera.jurisdiction.county?.toLowerCase() === county.toLowerCase()
    );
  }

  async getIncidentsByState(state: string): Promise<TrafficIncident[]> {
    return providerRegistry.getIncidentsByState(state);
  }

  // Get contractor opportunities (tree down, debris, structure damage)
  async getContractorOpportunities(state?: string): Promise<TrafficIncident[]> {
    return providerRegistry.getContractorOpportunities(state);
  }

  // Get state directory with camera and incident counts
  async getStateDirectory() {
    return providerRegistry.getStateDirectory();
  }
}

// Export singleton instance
export const unified511Directory = new Unified511Directory();