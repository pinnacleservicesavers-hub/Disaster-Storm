// Provider Registry - manages all state-specific 511 providers
import { fetchGA } from './ga-511.js';
import { fetchFL } from './fl-511.js';
import { fetchCA } from './ca-511.js';
import { fetchTX } from './tx-511.js';
import type { UnifiedCamera, TrafficIncident } from '../services/unified511Directory.js';

// Registry of all available provider functions by state code
const PROVIDER_FUNCTIONS = new Map<string, () => Promise<{cameras: any[], incidents: any[]}>>([
  ['GA', fetchGA],
  ['FL', fetchFL], 
  ['CA', fetchCA],
  ['TX', fetchTX],
  // Add more states as providers are implemented
]);

// State configurations for provider setup
export const STATE_CONFIGS = {
  GA: { name: 'Georgia DOT', counties: ['Fulton', 'Gwinnett', 'Cobb', 'DeKalb', 'Clayton', 'Cherokee', 'Forsyth', 'Henry'] },
  FL: { name: 'Florida 511', counties: ['Miami-Dade', 'Broward', 'Palm Beach', 'Orange', 'Hillsborough', 'Pinellas', 'Duval', 'Lee'] },
  CA: { name: 'California 511', counties: ['Alameda', 'Contra Costa', 'Marin', 'Napa', 'San Francisco', 'San Mateo', 'Santa Clara', 'Solano', 'Sonoma'] },
  TX: { name: 'Texas DOT', counties: ['Harris', 'Dallas', 'Tarrant', 'Travis', 'Bexar', 'Collin', 'Fort Bend', 'Montgomery'] },
  NY: { name: 'New York 511', counties: ['New York', 'Kings', 'Queens', 'Bronx', 'Richmond', 'Nassau', 'Suffolk', 'Westchester'] },
  WA: { name: 'Washington State DOT', counties: ['King', 'Pierce', 'Snohomish', 'Spokane', 'Clark', 'Thurston', 'Kitsap', 'Whatcom'] },
  CO: { name: 'Colorado DOT', counties: ['Denver', 'Jefferson', 'Arapahoe', 'Adams', 'Boulder', 'Larimer', 'Douglas', 'El Paso'] },
  AZ: { name: 'Arizona DOT', counties: ['Maricopa', 'Pima', 'Pinal', 'Yuma', 'Mohave', 'Coconino', 'Yavapai', 'Cochise'] },
  NC: { name: 'North Carolina DOT', counties: ['Mecklenburg', 'Wake', 'Guilford', 'Forsyth', 'Cumberland', 'Durham', 'Union', 'Cabarrus'] },
  VA: { name: 'Virginia DOT', counties: ['Fairfax', 'Virginia Beach', 'Norfolk', 'Chesapeake', 'Newport News', 'Alexandria', 'Hampton', 'Portsmouth'] }
};

export class ProviderRegistry {
  private static instance: ProviderRegistry;

  private constructor() {
    console.log('🏗️ Initializing Provider Registry');
    console.log(`📍 Supporting ${PROVIDER_FUNCTIONS.size} states with dedicated providers`);
    console.log(`📍 Additional ${Object.keys(STATE_CONFIGS).length - PROVIDER_FUNCTIONS.size} states configured for future implementation`);
  }

  static getInstance(): ProviderRegistry {
    if (!ProviderRegistry.instance) {
      ProviderRegistry.instance = new ProviderRegistry();
    }
    return ProviderRegistry.instance;
  }

  getProviderFunction(state: string) {
    return PROVIDER_FUNCTIONS.get(state.toUpperCase()) || null;
  }

  getAllSupportedStates(): string[] {
    return Array.from(PROVIDER_FUNCTIONS.keys());
  }

  getStateConfig(state: string) {
    return STATE_CONFIGS[state.toUpperCase() as keyof typeof STATE_CONFIGS];
  }

  async getCamerasByState(state: string): Promise<UnifiedCamera[]> {
    const providerFn = this.getProviderFunction(state);
    if (!providerFn) {
      console.log(`⚠️ No provider available for state: ${state}`);
      return [];
    }

    try {
      const result = await providerFn();
      return result.cameras;
    } catch (error) {
      console.error(`❌ Error fetching cameras for ${state}:`, error);
      return [];
    }
  }

  async getIncidentsByState(state: string): Promise<TrafficIncident[]> {
    const providerFn = this.getProviderFunction(state);
    if (!providerFn) {
      console.log(`⚠️ No provider available for state: ${state}`);
      return [];
    }

    try {
      const result = await providerFn();
      return result.incidents;
    } catch (error) {
      console.error(`❌ Error fetching incidents for ${state}:`, error);
      return [];
    }
  }

  async getContractorOpportunities(state?: string): Promise<TrafficIncident[]> {
    const states = state ? [state] : this.getAllSupportedStates();
    const allOpportunities: TrafficIncident[] = [];

    for (const stateCode of states) {
      try {
        const incidents = await this.getIncidentsByState(stateCode);
        const opportunities = incidents.filter(incident => incident.isContractorOpportunity);
        allOpportunities.push(...opportunities);
      } catch (error) {
        console.error(`❌ Error fetching opportunities for ${stateCode}:`, error);
      }
    }

    return allOpportunities.sort((a, b) => {
      // Sort by severity (critical first) then by start time (newest first)
      const severityOrder = { critical: 4, severe: 3, moderate: 2, minor: 1 };
      const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
      if (severityDiff !== 0) return severityDiff;
      
      return b.startTime.getTime() - a.startTime.getTime();
    });
  }

  async getStateDirectory() {
    const directory = [];

    for (const [stateCode, config] of Object.entries(STATE_CONFIGS)) {
      try {
        const cameras = await this.getCamerasByState(stateCode);
        const incidents = await this.getIncidentsByState(stateCode);
        const opportunities = incidents.filter(i => i.isContractorOpportunity);

        directory.push({
          state: stateCode,
          name: config.name,
          cameraCount: cameras.length,
          incidentCount: incidents.length,
          contractorOpportunities: opportunities.length,
          counties: config.counties,
          provider: config.name
        });
      } catch (error) {
        console.error(`❌ Error building directory for ${stateCode}:`, error);
        // Add entry with zero counts on error
        directory.push({
          state: stateCode,
          name: config.name,
          cameraCount: 0,
          incidentCount: 0,
          contractorOpportunities: 0,
          counties: config.counties,
          provider: config.name
        });
      }
    }

    return directory;
  }
}

// Export singleton instance
export const providerRegistry = ProviderRegistry.getInstance();