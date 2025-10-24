import { db } from "../db.js";
import { weatherAlerts } from "@shared/schema";
import { eq, and } from "drizzle-orm";

/**
 * NWS Severe Weather Alerts Service
 * Polls NWS CAP alerts for severe weather events (tornado warnings, high winds, etc.)
 * and stores them in the database for contractor geo-matching
 */

const USER_AGENT = "DisasterDirectApp (support@strategiclandmgmt.com)";
const NWS_BASE_URL = "https://api.weather.gov/alerts";

// Event types that contractors care about
const MONITORED_EVENTS = [
  "Tornado Warning",
  "Tornado Emergency",
  "Severe Thunderstorm Warning",
  "High Wind Warning",
  "Hurricane Warning",
  "Tropical Storm Warning",
  "Flash Flood Warning",
  "Flood Warning"
];

interface NWSAlertProperties {
  id: string;
  event: string;
  headline: string;
  description: string;
  severity: string;
  certainty: string;
  urgency: string;
  effective: string;
  expires?: string;
  onset?: string;
  ends?: string;
  areaDesc: string;
  geocode?: {
    SAME?: string[];
    UGC?: string[];
  };
}

interface NWSAlertGeometry {
  type: string;
  coordinates: number[][] | number[][][];
}

interface NWSAlertFeature {
  id: string;
  type: string;
  properties: NWSAlertProperties;
  geometry: NWSAlertGeometry | null;
}

interface NWSAlertsResponse {
  type: string;
  features: NWSAlertFeature[];
}

export interface WeatherAlertSync {
  newAlerts: number;
  expiredAlerts: number;
  activeAlerts: number;
  states: Set<string>;
}

/**
 * Extract state code from NWS alert area description
 * Returns first two-letter state code found
 */
function extractStateCode(areaDesc: string, ugcCodes?: string[]): string {
  // Try to extract from UGC codes first (format: STC000 where ST = state)
  if (ugcCodes && ugcCodes.length > 0) {
    const stateCode = ugcCodes[0].substring(0, 2);
    if (stateCode) return stateCode;
  }
  
  // Common state abbreviations
  const stateAbbrevs = [
    'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA',
    'HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
    'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
    'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
    'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'
  ];
  
  // Try to find state abbreviation in area description
  const upperDesc = areaDesc.toUpperCase();
  for (const state of stateAbbrevs) {
    if (upperDesc.includes(` ${state} `) || upperDesc.includes(`, ${state}`) || upperDesc.endsWith(` ${state}`)) {
      return state;
    }
  }
  
  return 'US'; // Default if no state found
}

/**
 * Extract polygon coordinates from NWS alert geometry
 * NWS returns coordinates in [lon, lat] format, we convert to [lat, lon]
 */
function extractPolygon(geometry: NWSAlertGeometry | null): Array<[number, number]> | null {
  if (!geometry || !geometry.coordinates) return null;
  
  try {
    // Handle Polygon type (coordinates is array of arrays)
    if (geometry.type === 'Polygon' && Array.isArray(geometry.coordinates[0])) {
      const coords = geometry.coordinates[0] as unknown as number[][];
      return coords.map(coord => [coord[1], coord[0]] as [number, number]);
    }
    
    // Handle MultiPolygon type (take first polygon)
    if (geometry.type === 'MultiPolygon' && Array.isArray(geometry.coordinates[0]) && Array.isArray(geometry.coordinates[0][0])) {
      const coords = geometry.coordinates[0][0] as unknown as number[][];
      return coords.map(coord => [coord[1], coord[0]] as [number, number]);
    }
  } catch (error) {
    console.error("❌ Error parsing NWS alert geometry:", error);
  }
  
  return null;
}

/**
 * Fetch severe weather alerts from NWS
 * @param state Optional two-letter state code to filter alerts
 * @returns Array of normalized WeatherAlert objects
 */
export async function fetchNwsAlerts(state?: string): Promise<Array<any>> {
  try {
    // Build URL with filters
    const params = new URLSearchParams({
      status: 'actual',
      message_type: 'alert',
      limit: '200'
    });
    
    if (state) {
      params.append('area', state);
    }
    
    // Add event types filter - NWS API requires separate event parameters, not comma-separated
    MONITORED_EVENTS.forEach(event => {
      params.append('event', event);
    });
    
    const url = `${NWS_BASE_URL}?${params}`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'application/geo+json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`NWS alerts fetch failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json() as NWSAlertsResponse;
    
    // Normalize to our schema
    return (data.features || []).map(feature => {
      const props = feature.properties;
      const stateCode = extractStateCode(props.areaDesc, props.geocode?.UGC);
      const polygon = extractPolygon(feature.geometry);
      
      // Calculate center point from polygon or use null
      let centerLat: number | null = null;
      let centerLon: number | null = null;
      if (polygon && polygon.length > 0) {
        const lats = polygon.map(p => p[0]);
        const lons = polygon.map(p => p[1]);
        centerLat = lats.reduce((a, b) => a + b, 0) / lats.length;
        centerLon = lons.reduce((a, b) => a + b, 0) / lons.length;
      }
      
      // Ensure UGC codes are properly formatted as an array
      const ugcCodes = props.geocode?.UGC;
      const areasArray = ugcCodes ? (Array.isArray(ugcCodes) ? ugcCodes : Array.from(ugcCodes)) : [];
      
      return {
        alertId: props.id,
        event: props.event,
        state: stateCode,
        headline: props.headline,
        title: props.headline,
        description: props.description,
        severity: props.severity,
        alertType: props.event,
        areas: areasArray,
        effective: new Date(props.effective),
        expires: props.expires ? new Date(props.expires) : null,
        polygon: polygon,
        startTime: new Date(props.effective),
        endTime: props.expires ? new Date(props.expires) : null,
        isActive: true,
        latitude: centerLat ? centerLat.toString() : null,
        longitude: centerLon ? centerLon.toString() : null,
        source: 'NWS'
      };
    });
  } catch (error) {
    console.error("❌ Error fetching NWS alerts:", error);
    return [];
  }
}

/**
 * Sync NWS alerts to database
 * - Inserts new alerts
 * - Marks expired alerts as inactive
 * @returns Sync statistics
 */
export async function syncNwsAlerts(state?: string): Promise<WeatherAlertSync> {
  const stats: WeatherAlertSync = {
    newAlerts: 0,
    expiredAlerts: 0,
    activeAlerts: 0,
    states: new Set()
  };
  
  try {
    // Fetch latest alerts from NWS
    const alerts = await fetchNwsAlerts(state);
    
    console.log(`📡 Fetched ${alerts.length} active alerts from NWS${state ? ` for ${state}` : ''}`);
    
    // Track which alert IDs are currently active
    const activeAlertIds = new Set<string>();
    
    // Insert or update alerts
    for (const alert of alerts) {
      activeAlertIds.add(alert.alertId);
      stats.states.add(alert.state);
      
      try {
        // Check if alert already exists
        const existing = await db
          .select()
          .from(weatherAlerts)
          .where(eq(weatherAlerts.alertId, alert.alertId))
          .limit(1);
        
        if (existing.length === 0) {
          // Insert new alert
          await db.insert(weatherAlerts).values(alert);
          stats.newAlerts++;
          console.log(`  ✅ New alert: ${alert.event} in ${alert.state}`);
        } else if (!existing[0].isActive) {
          // Reactivate previously expired alert
          await db
            .update(weatherAlerts)
            .set({ isActive: true, expires: alert.expires })
            .where(eq(weatherAlerts.alertId, alert.alertId));
          stats.newAlerts++;
          console.log(`  🔄 Reactivated alert: ${alert.event} in ${alert.state}`);
        }
      } catch (error) {
        console.error(`  ❌ Error processing alert ${alert.alertId}:`, error);
      }
    }
    
    // Mark expired alerts as inactive
    const now = new Date();
    const allActiveAlerts = await db
      .select()
      .from(weatherAlerts)
      .where(eq(weatherAlerts.isActive, true));
    
    for (const alert of allActiveAlerts) {
      // Check if alert has expired or is not in current active list
      const hasExpired = alert.expires && new Date(alert.expires) < now;
      const notInActiveList = !activeAlertIds.has(alert.alertId);
      
      if (hasExpired || notInActiveList) {
        await db
          .update(weatherAlerts)
          .set({ isActive: false })
          .where(eq(weatherAlerts.id, alert.id));
        stats.expiredAlerts++;
        console.log(`  ⏰ Expired alert: ${alert.event} in ${alert.state}`);
      }
    }
    
    stats.activeAlerts = activeAlertIds.size;
    
    console.log(`📊 NWS Alerts Sync Complete: ${stats.newAlerts} new, ${stats.expiredAlerts} expired, ${stats.activeAlerts} active`);
    
  } catch (error) {
    console.error("❌ Error syncing NWS alerts:", error);
  }
  
  return stats;
}

/**
 * Get active weather alerts from database
 * @param state Optional state filter
 * @returns Array of active WeatherAlert records
 */
export async function getActiveAlerts(state?: string) {
  try {
    if (state) {
      return await db
        .select()
        .from(weatherAlerts)
        .where(and(
          eq(weatherAlerts.isActive, true),
          eq(weatherAlerts.state, state)
        ));
    } else {
      return await db
        .select()
        .from(weatherAlerts)
        .where(eq(weatherAlerts.isActive, true));
    }
  } catch (error) {
    console.error("❌ Error getting active alerts:", error);
    return [];
  }
}
