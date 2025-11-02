import { DEFAULT_MRMS_CONFIG, getMRMSConfig, getSeverityForValue, type MRMSThreshold } from '../../config/mrmsThresholds.js';
import { db } from '../../db.js';
import { weatherAlerts } from '../../../shared/schema.js';
import { eq, and, gte } from 'drizzle-orm';

interface MRMSDataPoint {
  latitude: number;
  longitude: number;
  value: number;
  timestamp: Date;
}

interface MRMSContour {
  peril: MRMSThreshold['peril'];
  severity: MRMSThreshold['severity'];
  threshold: number;
  polygon: [number, number][];
  centroid: [number, number];
  maxValue: number;
  dataPoints: number;
}

interface ProcessingResult {
  success: boolean;
  peril: string;
  contoursCreated: number;
  contoursSkipped: number;
  errors: string[];
  processingTimeMs: number;
}

export class MRMSProductionService {
  private processingLock = new Map<string, boolean>();
  private lastProcessedHash = new Map<string, string>();

  async processAllPerils(): Promise<ProcessingResult[]> {
    const config = getMRMSConfig();
    
    if (!config.enabled) {
      console.log('[MRMS] Processing disabled in config');
      return [];
    }

    const perils: MRMSThreshold['peril'][] = ['hail', 'precipitation', 'wind', 'lightning'];
    const results: ProcessingResult[] = [];

    for (const peril of perils) {
      const result = await this.processPerilWithRetry(peril, config.retryAttempts, config.retryBackoffMs);
      results.push(result);
    }

    return results;
  }

  private async processPerilWithRetry(
    peril: MRMSThreshold['peril'],
    maxAttempts: number,
    backoffMs: number
  ): Promise<ProcessingResult> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.log(`[MRMS] Processing ${peril} (attempt ${attempt}/${maxAttempts})`);
        const result = await this.processPeril(peril);
        
        if (result.success) {
          console.log(`[MRMS] ✅ ${peril}: ${result.contoursCreated} contours created, ${result.contoursSkipped} skipped (${result.processingTimeMs}ms)`);
          return result;
        }
      } catch (error) {
        lastError = error as Error;
        console.error(`[MRMS] ❌ ${peril} attempt ${attempt} failed:`, error);
        
        if (attempt < maxAttempts) {
          const waitMs = backoffMs * attempt;
          console.log(`[MRMS] Retrying ${peril} in ${waitMs}ms...`);
          await new Promise(resolve => setTimeout(resolve, waitMs));
        }
      }
    }

    return {
      success: false,
      peril,
      contoursCreated: 0,
      contoursSkipped: 0,
      errors: [lastError?.message || 'Unknown error'],
      processingTimeMs: 0
    };
  }

  private async processPeril(peril: MRMSThreshold['peril']): Promise<ProcessingResult> {
    const startTime = Date.now();
    const lockKey = `mrms_${peril}`;

    // Prevent concurrent processing of same peril
    if (this.processingLock.get(lockKey)) {
      console.log(`[MRMS] ${peril} already processing, skipping`);
      return {
        success: false,
        peril,
        contoursCreated: 0,
        contoursSkipped: 0,
        errors: ['Already processing'],
        processingTimeMs: Date.now() - startTime
      };
    }

    this.processingLock.set(lockKey, true);

    try {
      // Step 1: Fetch raw MRMS data (stub for now - production would call NOAA API)
      const rawData = await this.fetchMRMSData(peril);
      
      // Step 2: Generate data hash for deduplication
      const dataHash = this.generateDataHash(rawData);
      const lastHash = this.lastProcessedHash.get(peril);
      
      if (dataHash === lastHash) {
        console.log(`[MRMS] ${peril} data unchanged (hash: ${dataHash.slice(0, 8)}), skipping`);
        return {
          success: true,
          peril,
          contoursCreated: 0,
          contoursSkipped: 0,
          errors: [],
          processingTimeMs: Date.now() - startTime
        };
      }

      // Step 3: Generate contours from data
      const contours = await this.generateContours(peril, rawData);
      
      // Step 4: Geofence contours to service areas
      const geofencedContours = await this.geofenceContours(contours);
      
      // Step 5: Store contours in database (with idempotency check)
      const stored = await this.storeContours(peril, geofencedContours);
      
      // Update hash
      this.lastProcessedHash.set(peril, dataHash);

      return {
        success: true,
        peril,
        contoursCreated: stored.created,
        contoursSkipped: stored.skipped,
        errors: [],
        processingTimeMs: Date.now() - startTime
      };
    } finally {
      this.processingLock.delete(lockKey);
    }
  }

  private async fetchMRMSData(peril: MRMSThreshold['peril']): Promise<MRMSDataPoint[]> {
    // STUB: In production, this would fetch from NOAA MRMS REST API
    // For now, return DETERMINISTIC placeholder data for testing
    console.log(`[MRMS] Fetching ${peril} data from NOAA MRMS API (STUB - DETERMINISTIC)`);
    
    // Use deterministic seed based on peril to ensure same data each run
    const perilSeeds = { hail: 42, precipitation: 43, wind: 44, lightning: 45 };
    const seed = perilSeeds[peril];
    
    const now = new Date();
    const miamiLat = 25.7617;
    const miamiLon = -80.1918;
    
    const mockData: MRMSDataPoint[] = [];
    
    // Generate a deterministic grid pattern with LOTS of points above thresholds
    // This ensures we have 3+ points for each severity level
    for (let i = 0; i < 50; i++) {
      const angle = (i / 50) * 2 * Math.PI;
      const radius = 0.3 + (i % 3) * 0.15; // Multiple rings
      mockData.push({
        latitude: miamiLat + radius * Math.cos(angle),
        longitude: miamiLon + radius * Math.sin(angle),
        value: this.getDeterministicValueForPeril(peril, seed + i),
        timestamp: now
      });
    }
    
    return mockData;
  }

  private getDeterministicValueForPeril(peril: MRMSThreshold['peril'], seed: number): number {
    // Simple deterministic pseudo-random using seed
    const pseudoRandom = (Math.sin(seed) * 10000) - Math.floor(Math.sin(seed) * 10000);
    
    // Generate values that EXCEED thresholds to create contours for demo
    switch (peril) {
      case 'hail': return 1.0 + pseudoRandom * 1.5; // 1.0-2.5 inches (exceeds 0.75" threshold)
      case 'precipitation': return 2.0 + pseudoRandom * 3.0; // 2.0-5.0 inches/hour (exceeds thresholds)
      case 'wind': return 60 + pseudoRandom * 60; // 60-120 mph (exceeds 40mph threshold)
      case 'lightning': return 20 + pseudoRandom * 130; // 20-150 strikes/km²/hour (exceeds 10 threshold)
    }
  }

  private generateDataHash(data: MRMSDataPoint[]): string {
    // Deterministic hash based on all data points
    const hashInput = data.map(d => `${d.latitude.toFixed(4)},${d.longitude.toFixed(4)},${d.value.toFixed(2)}`).join('|');
    return Buffer.from(hashInput).toString('base64').slice(0, 16);
  }

  private async generateContours(peril: MRMSThreshold['peril'], data: MRMSDataPoint[]): Promise<MRMSContour[]> {
    const config = getMRMSConfig();
    const thresholds = config.thresholds.filter(t => t.peril === peril);
    const contours: MRMSContour[] = [];

    // For each threshold level, generate a contour
    for (const threshold of thresholds) {
      const pointsAboveThreshold = data.filter(d => d.value >= threshold.value);
      
      if (pointsAboveThreshold.length < 3) {
        continue; // Need at least 3 points to form a polygon
      }

      // Generate simple convex hull polygon (production would use proper contouring)
      const polygon = this.simpleConvexHull(pointsAboveThreshold);
      const centroid = this.calculateCentroid(polygon);
      const maxValue = Math.max(...pointsAboveThreshold.map(p => p.value));

      contours.push({
        peril,
        severity: threshold.severity,
        threshold: threshold.value,
        polygon,
        centroid,
        maxValue,
        dataPoints: pointsAboveThreshold.length
      });
    }

    console.log(`[MRMS] Generated ${contours.length} contours for ${peril}`);
    return contours;
  }

  private simpleConvexHull(points: MRMSDataPoint[]): [number, number][] {
    // Simplified convex hull - in production use proper algorithm
    const coords: [number, number][] = points.map(p => [p.longitude, p.latitude]);
    
    // Sort by longitude
    coords.sort((a, b) => a[0] - b[0]);
    
    // Return simple bounding polygon
    return [
      coords[0],
      coords[Math.floor(coords.length / 3)],
      coords[Math.floor(coords.length * 2 / 3)],
      coords[coords.length - 1],
      coords[0] // Close polygon
    ];
  }

  private calculateCentroid(polygon: [number, number][]): [number, number] {
    const sumLat = polygon.reduce((sum, p) => sum + p[1], 0);
    const sumLon = polygon.reduce((sum, p) => sum + p[0], 0);
    return [sumLon / polygon.length, sumLat / polygon.length];
  }

  private async geofenceContours(contours: MRMSContour[]): Promise<Array<MRMSContour & { matchedArea: { id: string; state: string } }>> {
    const config = getMRMSConfig();
    
    // Filter contours and tag with matched service area
    return contours
      .map(contour => {
        const matchedArea = this.findMatchedServiceArea(contour, config.serviceAreas);
        if (!matchedArea) return null;
        return { ...contour, matchedArea };
      })
      .filter((c): c is MRMSContour & { matchedArea: { id: string; state: string } } => c !== null);
  }

  private findMatchedServiceArea(contour: MRMSContour, serviceAreas: any[]): { id: string; state: string } | null {
    const [lon, lat] = contour.centroid;
    
    // Check which service area's bounding box contains this centroid
    for (const area of serviceAreas) {
      const bounds = this.getServiceAreaBounds(area);
      
      if (lat >= bounds.minLat && lat <= bounds.maxLat && 
          lon >= bounds.minLon && lon <= bounds.maxLon) {
        // Return area ID and state
        return {
          id: area.id,
          state: bounds.state || 'FL'
        };
      }
    }
    
    return null;
  }

  private getServiceAreaBounds(area: any): { minLat: number; maxLat: number; minLon: number; maxLon: number; state: string } {
    // Define actual bounding boxes for configured service areas with state
    const areaBounds: Record<string, any> = {
      'miami-dade': { minLat: 25.1, maxLat: 25.9, minLon: -80.9, maxLon: -80.1, state: 'FL' },
      'broward': { minLat: 25.9, maxLat: 26.4, minLon: -80.4, maxLon: -80.0, state: 'FL' },
      'palm-beach': { minLat: 26.3, maxLat: 27.0, minLon: -80.3, maxLon: -79.9, state: 'FL' },
      'houston-metro': { minLat: 29.5, maxLat: 30.1, minLon: -95.8, maxLon: -95.0, state: 'TX' }
    };
    
    return areaBounds[area.id] || { minLat: 24, maxLat: 31, minLon: -98, maxLon: -79, state: 'FL' };
  }

  private async storeContours(
    peril: MRMSThreshold['peril'],
    contours: MRMSContour[]
  ): Promise<{ created: number; skipped: number }> {
    let created = 0;
    let skipped = 0;

    for (const contour of contours) {
      try {
        // Check if this exact contour already exists (idempotency)
        const alertId = `MRMS-${peril.toUpperCase()}-${contour.severity.toUpperCase()}-${contour.centroid[1].toFixed(2)}-${contour.centroid[0].toFixed(2)}`;
        
        const existing = await db
          .select()
          .from(weatherAlerts)
          .where(eq(weatherAlerts.alertId, alertId))
          .limit(1);

        if (existing.length > 0) {
          // Check if it's still active (expires in future)
          const alert = existing[0];
          if (alert.expires && new Date(alert.expires) > new Date()) {
            skipped++;
            continue;
          }
        }

        // Create new alert with proper service area metadata
        const now = new Date();
        const sevCap = contour.severity.charAt(0).toUpperCase() + contour.severity.slice(1);
        const perilCap = peril.charAt(0).toUpperCase() + peril.slice(1);
        
        await db.insert(weatherAlerts).values({
          alertId,
          event: `${perilCap} - ${sevCap}`,
          title: `${sevCap} ${perilCap} Detected`,
          state: contour.matchedArea.state,
          headline: `${sevCap} ${peril} detected by MRMS`,
          description: `MRMS detected ${peril} with max value ${contour.maxValue.toFixed(2)} (threshold: ${contour.threshold})`,
          severity: sevCap,
          alertType: perilCap,
          areas: [contour.matchedArea.id], // Correct service area where contour was detected
          effective: now,
          expires: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
          startTime: now,
          endTime: new Date(Date.now() + 60 * 60 * 1000),
          isActive: true,
          latitude: String(contour.centroid[1]),
          longitude: String(contour.centroid[0]),
          source: 'MRMS',
          polygon: contour.polygon,
          geometryType: 'contour',
          hazardMetadata: {
            peril,
            threshold: contour.threshold,
            maxValue: contour.maxValue,
            dataPoints: contour.dataPoints,
            centroid: contour.centroid
          }
        });

        created++;
      } catch (error) {
        console.error(`[MRMS] Error storing ${peril} contour:`, error);
      }
    }

    return { created, skipped };
  }

  async getProcessingStats(): Promise<{
    lastProcessed: Record<string, string | null>;
    processingLocks: string[];
  }> {
    return {
      lastProcessed: Object.fromEntries(this.lastProcessedHash),
      processingLocks: Array.from(this.processingLock.keys())
    };
  }
}

export const mrmsProductionService = new MRMSProductionService();
