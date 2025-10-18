// Florida 511 provider - FDOT DIVAS (ArcGIS FeatureServer)
import type { UnifiedCamera, TrafficIncident } from '../services/unified511Directory.js';

const CAMERAS_URL = 'https://gis.fdot.gov/arcgis/rest/services/DIVAS_Cameras/FeatureServer/0/query';
const INCIDENTS_URL = 'https://gis.fdot.gov/arcgis/rest/services/DIVAS_GetEvent/FeatureServer/0/query';

// Contractor opportunity event types
const CONTRACTOR_EVENT_TYPES = [
  'accident', 'roadwork', 'debris', 'flooding', 'tree', 'utility',
  'hazard', 'obstruction', 'damage', 'closure'
];

/**
 * Fetch Florida cameras from FDOT DIVAS ArcGIS FeatureServer
 */
async function fetchFLCameras(): Promise<UnifiedCamera[]> {
  try {
    const params = new URLSearchParams({
      where: '1=1', // Get all cameras
      outFields: '*',
      f: 'json',
      returnGeometry: 'true',
      outSR: '4326' // Request WGS84 coordinates (lat/long degrees)
    });

    const response = await fetch(`${CAMERAS_URL}?${params}`);
    if (!response.ok) {
      throw new Error(`FDOT Cameras API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.features || data.features.length === 0) {
      console.log('⚠️ No cameras found from FDOT DIVAS');
      return [];
    }

    return data.features.map((feature: any) => {
      const attrs = feature.attributes;
      const geom = feature.geometry;
      
      return {
        id: `fl_cam_${attrs.id || attrs.recid}`,
        name: attrs.description || attrs.highway || 'Unknown Location',
        lat: attrs.latitude || geom?.y || 0, // Prefer attributes over geometry
        lng: attrs.longitude || geom?.x || 0, // Prefer attributes over geometry
        type: 'highway' as const,
        snapshotUrl: attrs.imagefilename || undefined,
        jurisdiction: {
          state: 'FL',
          county: attrs.county,
          jurisdiction: 'state_dot',
          provider: 'FDOT DIVAS'
        },
        isActive: true,
        lastUpdated: attrs.postedtime ? new Date(attrs.postedtime) : new Date(),
        metadata: {
          direction: attrs.direction,
          route: attrs.highway,
          description: attrs.description
        }
      } as UnifiedCamera;
    });
  } catch (error) {
    console.error('❌ FL Cameras fetch error:', error);
    return [];
  }
}

/**
 * Fetch Florida incidents from FDOT DIVAS ArcGIS FeatureServer
 */
async function fetchFLIncidents(): Promise<TrafficIncident[]> {
  try {
    const params = new URLSearchParams({
      where: "status='Active'", // Only active incidents
      outFields: '*',
      f: 'json',
      returnGeometry: 'true',
      outSR: '4326' // Request WGS84 coordinates (lat/long degrees)
    });

    const response = await fetch(`${INCIDENTS_URL}?${params}`);
    if (!response.ok) {
      throw new Error(`FDOT Incidents API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.features || data.features.length === 0) {
      console.log('⚠️ No active incidents found from FDOT DIVAS');
      return [];
    }

    return data.features.map((feature: any) => {
      const attrs = feature.attributes;
      const geom = feature.geometry;
      
      // Map FDOT severity to our severity levels
      const severity = mapSeverity(attrs.severity);
      
      // Determine incident type from description and event type
      const type = determineIncidentType(attrs.descriptionen, attrs.eventtypedesc, attrs.type);
      
      // Check if this is a contractor opportunity
      const isContractorOpportunity = isContractorEvent(attrs.descriptionen, attrs.eventtypedesc, type);
      
      return {
        id: `fl_inc_${attrs.id || attrs.recid}`,
        type,
        description: attrs.descriptionen || attrs.descriptiones || 'Unknown incident',
        lat: attrs.latitude || geom?.y || 0, // Prefer attributes over geometry
        lng: attrs.longitude || geom?.x || 0, // Prefer attributes over geometry
        severity,
        startTime: attrs.reportedat ? new Date(attrs.reportedat) : new Date(),
        estimatedClearTime: undefined, // Not provided by FDOT
        affectedRoutes: [attrs.highway, attrs.secondhighway].filter(Boolean),
        jurisdiction: {
          state: 'FL',
          county: attrs.county,
          jurisdiction: 'state_dot',
          provider: 'FDOT DIVAS'
        },
        isContractorOpportunity
      } as TrafficIncident;
    });
  } catch (error) {
    console.error('❌ FL Incidents fetch error:', error);
    return [];
  }
}

/**
 * Map FDOT severity to our severity levels
 */
function mapSeverity(fdotSeverity?: string): 'minor' | 'moderate' | 'severe' | 'critical' {
  if (!fdotSeverity) return 'moderate';
  
  const normalized = fdotSeverity.toLowerCase();
  if (normalized.includes('critical') || normalized.includes('major')) return 'critical';
  if (normalized.includes('severe') || normalized.includes('serious')) return 'severe';
  if (normalized.includes('moderate') || normalized.includes('medium')) return 'moderate';
  return 'minor';
}

/**
 * Determine incident type from description and event type
 */
function determineIncidentType(
  description?: string, 
  eventType?: string,
  fdotType?: string
): TrafficIncident['type'] {
  const text = `${description} ${eventType} ${fdotType}`.toLowerCase();
  
  if (text.includes('tree') || text.includes('fallen tree')) return 'tree_down';
  if (text.includes('debris') || text.includes('obstruction')) return 'debris';
  if (text.includes('flood') || text.includes('water')) return 'flooding';
  if (text.includes('power') || text.includes('utility') || text.includes('wire')) return 'power_lines_down';
  if (text.includes('accident') || text.includes('crash') || text.includes('collision')) return 'accident';
  if (text.includes('construction') || text.includes('roadwork')) return 'construction';
  if (text.includes('road closed') || text.includes('closure')) return 'road_blocked';
  
  return 'debris'; // Default fallback
}

/**
 * Check if incident is a contractor opportunity
 */
function isContractorEvent(description?: string, eventType?: string, incidentType?: string): boolean {
  const text = `${description} ${eventType} ${incidentType}`.toLowerCase();
  
  return CONTRACTOR_EVENT_TYPES.some(keyword => text.includes(keyword)) ||
    incidentType === 'tree_down' ||
    incidentType === 'debris' ||
    incidentType === 'power_lines_down' ||
    incidentType === 'road_blocked';
}

/**
 * Main fetch function for Florida provider
 */
export async function fetchFL() {
  try {
    const [cameras, incidents] = await Promise.all([
      fetchFLCameras(),
      fetchFLIncidents()
    ]);

    console.log(`✅ FL Provider: ${cameras.length} cameras, ${incidents.length} incidents`);
    
    return { cameras, incidents };
  } catch (error) {
    console.error('❌ FL 511 fetch error:', error);
    return { cameras: [], incidents: [] };
  }
}