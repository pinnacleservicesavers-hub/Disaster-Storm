import type { Pool } from '@neondatabase/serverless';
import { weatherAlerts } from '@shared/schema';

interface NHCStorm {
  id: string;
  name: string;
  binNumber: string;
  classification: string;
  intensity: number;
  pressure: number;
  windSpeed: number;
  lat: number;
  lon: number;
  movementSpeed: number;
  movementDirection: number;
  lastUpdate: string;
}

interface GeoJSONFeature {
  type: string;
  geometry: {
    type: string;
    coordinates: any;
  };
  properties: Record<string, any>;
}

interface GeoJSONFeatureCollection {
  type: 'FeatureCollection';
  features: GeoJSONFeature[];
}

/**
 * NHC Cone and Track GeoJSON Ingestion Service
 * Fetches hurricane forecast cones and tracks from National Hurricane Center
 */
export class NHCConeService {
  private readonly NHC_BASE_URL = 'https://www.nhc.noaa.gov/gis';
  
  constructor(private db: Pool) {}

  /**
   * Fetch active storms from NHC
   */
  private async fetchActiveStorms(): Promise<NHCStorm[]> {
    try {
      const response = await fetch('https://www.nhc.noaa.gov/CurrentStorms.json');
      if (!response.ok) {
        console.log('⚠️ NHC CurrentStorms.json not available, no active storms');
        return [];
      }
      
      const data = await response.json();
      const storms: NHCStorm[] = [];
      
      // Parse active storms from the JSON structure
      if (data.activeStorms && Array.isArray(data.activeStorms)) {
        for (const storm of data.activeStorms) {
          storms.push({
            id: storm.id || storm.binNumber,
            name: storm.name,
            binNumber: storm.binNumber,
            classification: storm.classification,
            intensity: storm.intensity || 0,
            pressure: storm.pressure || 0,
            windSpeed: storm.wind || 0,
            lat: storm.latitude || 0,
            lon: storm.longitude || 0,
            movementSpeed: storm.movementSpeed || 0,
            movementDirection: storm.movementDir || 0,
            lastUpdate: storm.lastUpdate || new Date().toISOString()
          });
        }
      }
      
      return storms;
    } catch (error) {
      console.error('❌ Error fetching NHC active storms:', error);
      return [];
    }
  }

  /**
   * Fetch GeoJSON data for a specific storm product
   */
  private async fetchStormGeoJSON(stormId: string, productType: string): Promise<GeoJSONFeatureCollection | null> {
    // Common NHC GeoJSON product names
    const possibleNames = [
      `${stormId}_${productType}.json`,
      `${stormId}_${productType}.geojson`,
      `${stormId.toLowerCase()}_${productType}.json`,
      `${stormId.toUpperCase()}_${productType}.json`,
      `${productType}_latest.geojson`,
      `${productType}.geojson`
    ];

    for (const filename of possibleNames) {
      try {
        const url = `${this.NHC_BASE_URL}/${filename}`;
        console.log(`🔍 Trying NHC GeoJSON: ${url}`);
        
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'DisasterDirect/1.0'
          }
        });
        
        if (response.ok) {
          const geojson = await response.json();
          if (geojson && geojson.type === 'FeatureCollection') {
            console.log(`✅ Found NHC ${productType} for ${stormId}: ${geojson.features?.length || 0} features`);
            return geojson;
          }
        }
      } catch (error) {
        // Try next filename variant
        continue;
      }
    }
    
    return null;
  }

  /**
   * Convert GeoJSON coordinates to lat/lon array for database storage
   */
  private extractPolygonCoordinates(geometry: any): [number, number][] | null {
    try {
      if (geometry.type === 'Polygon') {
        // Polygon: [[lon, lat], ...] -> [[lat, lon], ...]
        return geometry.coordinates[0].map((coord: number[]) => [coord[1], coord[0]]);
      } else if (geometry.type === 'MultiPolygon') {
        // Take first polygon of multipolygon
        return geometry.coordinates[0][0].map((coord: number[]) => [coord[1], coord[0]]);
      } else if (geometry.type === 'LineString') {
        // Track line: [[lon, lat], ...] -> [[lat, lon], ...]
        return geometry.coordinates.map((coord: number[]) => [coord[1], coord[0]]);
      }
      return null;
    } catch (error) {
      console.error('❌ Error extracting polygon coordinates:', error);
      return null;
    }
  }

  /**
   * Calculate center point from polygon
   */
  private calculateCentroid(coords: [number, number][]): { lat: number; lon: number } {
    const sumLat = coords.reduce((sum, c) => sum + c[0], 0);
    const sumLon = coords.reduce((sum, c) => sum + c[1], 0);
    return {
      lat: sumLat / coords.length,
      lon: sumLon / coords.length
    };
  }

  /**
   * Ingest NHC forecast cones and tracks
   */
  async ingestNHCCones(): Promise<void> {
    console.log('🌀 Starting NHC cone/track ingestion...');
    
    const storms = await this.fetchActiveStorms();
    
    if (storms.length === 0) {
      console.log('✅ No active NHC storms to process');
      return;
    }
    
    console.log(`🌀 Processing ${storms.length} active storm(s)`);
    
    for (const storm of storms) {
      // Fetch forecast cone
      const coneData = await this.fetchStormGeoJSON(storm.binNumber, 'cone');
      if (coneData) {
        await this.storeConeData(storm, coneData);
      }
      
      // Fetch forecast track
      const trackData = await this.fetchStormGeoJSON(storm.binNumber, 'track');
      if (trackData) {
        await this.storeTrackData(storm, trackData);
      }
    }
    
    console.log('✅ NHC cone/track ingestion complete');
  }

  /**
   * Store forecast cone in database
   */
  private async storeConeData(storm: NHCStorm, geojson: GeoJSONFeatureCollection): Promise<void> {
    for (const feature of geojson.features) {
      const coords = this.extractPolygonCoordinates(feature.geometry);
      if (!coords) continue;
      
      const centroid = this.calculateCentroid(coords);
      
      try {
        await this.db.query(`
          INSERT INTO weather_alerts (
            alert_id, event, state, headline, title, description, severity, alert_type,
            areas, effective, expires, polygon, start_time, end_time, is_active,
            latitude, longitude, source, geometry_type, hazard_metadata
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20
          )
          ON CONFLICT (alert_id) DO UPDATE SET
            polygon = EXCLUDED.polygon,
            hazard_metadata = EXCLUDED.hazard_metadata,
            effective = EXCLUDED.effective,
            expires = EXCLUDED.expires
        `, [
          `NHC-CONE-${storm.id}`,
          `Hurricane ${storm.name} Forecast Cone`,
          'FL', // Assume Florida (can be enhanced with geometry analysis)
          `${storm.classification} ${storm.name} - Forecast Cone`,
          `${storm.name} Forecast Uncertainty Cone`,
          `Forecast cone for ${storm.classification} ${storm.name}. Wind: ${storm.windSpeed} mph, Pressure: ${storm.pressure} mb`,
          storm.windSpeed >= 111 ? 'Extreme' : storm.windSpeed >= 96 ? 'Severe' : 'Moderate',
          'Hurricane',
          [`${storm.name} forecast area`],
          new Date(),
          new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days
          JSON.stringify(coords),
          new Date(),
          new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
          true,
          centroid.lat.toString(),
          centroid.lon.toString(),
          'NHC',
          'cone',
          JSON.stringify({
            stormName: storm.name,
            classification: storm.classification,
            intensity: storm.intensity,
            windSpeed: storm.windSpeed,
            pressure: storm.pressure,
            binNumber: storm.binNumber,
            lastUpdate: storm.lastUpdate,
            properties: feature.properties
          })
        ]);
        
        console.log(`✅ Stored forecast cone for ${storm.name}`);
      } catch (error) {
        console.error(`❌ Error storing cone for ${storm.name}:`, error);
      }
    }
  }

  /**
   * Store forecast track in database
   */
  private async storeTrackData(storm: NHCStorm, geojson: GeoJSONFeatureCollection): Promise<void> {
    for (const feature of geojson.features) {
      const coords = this.extractPolygonCoordinates(feature.geometry);
      if (!coords) continue;
      
      const centroid = this.calculateCentroid(coords);
      
      try {
        await this.db.query(`
          INSERT INTO weather_alerts (
            alert_id, event, state, headline, title, description, severity, alert_type,
            areas, effective, expires, polygon, start_time, end_time, is_active,
            latitude, longitude, source, geometry_type, hazard_metadata
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20
          )
          ON CONFLICT (alert_id) DO UPDATE SET
            polygon = EXCLUDED.polygon,
            hazard_metadata = EXCLUDED.hazard_metadata,
            effective = EXCLUDED.effective,
            expires = EXCLUDED.expires
        `, [
          `NHC-TRACK-${storm.id}`,
          `Hurricane ${storm.name} Forecast Track`,
          'FL',
          `${storm.classification} ${storm.name} - Forecast Track`,
          `${storm.name} Forecast Track Line`,
          `Forecast track centerline for ${storm.classification} ${storm.name}`,
          storm.windSpeed >= 111 ? 'Extreme' : storm.windSpeed >= 96 ? 'Severe' : 'Moderate',
          'Hurricane',
          [`${storm.name} forecast track`],
          new Date(),
          new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
          JSON.stringify(coords),
          new Date(),
          new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
          true,
          centroid.lat.toString(),
          centroid.lon.toString(),
          'NHC',
          'track',
          JSON.stringify({
            stormName: storm.name,
            classification: storm.classification,
            intensity: storm.intensity,
            windSpeed: storm.windSpeed,
            pressure: storm.pressure,
            binNumber: storm.binNumber,
            lastUpdate: storm.lastUpdate,
            properties: feature.properties
          })
        ]);
        
        console.log(`✅ Stored forecast track for ${storm.name}`);
      } catch (error) {
        console.error(`❌ Error storing track for ${storm.name}:`, error);
      }
    }
  }
}
