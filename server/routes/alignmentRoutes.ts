import express from 'express';
import type { Express, Request, Response } from 'express';
import multer from 'multer';
import { parse as csvParse } from 'csv-parse/sync';
import fs from 'fs';
import { db } from '../db';
import { assets, claims, weatherAlerts, hazardIntersections, insertAssetSchema, insertClaimSchema } from '@shared/schema';
import { eq, and, isNull } from 'drizzle-orm';

export function registerAlignmentRoutes(app: Express) {
  /**
   * GET /api/assets
   * List all assets (properties)
   */
  app.get('/api/assets', async (req: Request, res: Response) => {
    try {
      const allAssets = await db.select().from(assets);
      res.json(allAssets);
    } catch (error) {
      console.error('❌ Error fetching assets:', error);
      res.status(500).json({
        error: 'Failed to fetch assets',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * POST /api/assets
   * Create a new asset (property)
   * Body: { name, lat, lon, ref_id?, address?, city?, state?, zip_code?, ... }
   */
  app.post('/api/assets', async (req: Request, res: Response) => {
    try {
      const validatedData = insertAssetSchema.parse(req.body);
      
      const [newAsset] = await db.insert(assets).values(validatedData).returning();
      
      console.log(`✅ Created asset: ${newAsset.name} (ID: ${newAsset.id})`);
      
      res.status(201).json(newAsset);
    } catch (error) {
      console.error('❌ Error creating asset:', error);
      res.status(500).json({
        error: 'Failed to create asset',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * GET /api/claims
   * List all claims
   */
  app.get('/api/claims', async (req: Request, res: Response) => {
    try {
      const allClaims = await db.select().from(claims);
      res.json(allClaims);
    } catch (error) {
      console.error('❌ Error fetching claims:', error);
      res.status(500).json({
        error: 'Failed to fetch claims',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * POST /api/claims
   * Create a new claim
   * Body: { carrier_name, policy_number, asset_id?, claimant_name, property_address, damage_type, incident_date, ... }
   */
  app.post('/api/claims', async (req: Request, res: Response) => {
    try {
      const {
        carrier_name,
        policy_number,
        asset_id,
        claimant_name,
        property_address,
        damage_type,
        incident_date,
        estimated_amount,
        state,
        latitude,
        longitude,
        notes
      } = req.body;

      // Generate unique claim number
      const claimNumber = `CLM-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

      const newClaim = {
        claimNumber,
        insuranceCompany: carrier_name,
        policyNumber: policy_number,
        claimantName: claimant_name,
        propertyAddress: property_address,
        damageType: damage_type,
        incidentDate: new Date(incident_date),
        estimatedAmount: estimated_amount,
        state,
        latitude,
        longitude,
        notes,
        status: 'active' as const
      };

      const [created] = await db.insert(claims).values(newClaim).returning();
      
      console.log(`✅ Created claim: ${created.claimNumber}`);
      
      res.status(201).json(created);
    } catch (error) {
      console.error('❌ Error creating claim:', error);
      res.status(500).json({
        error: 'Failed to create claim',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * POST /api/claims/import
   * Bulk import claims from CSV file
   * Expects CSV with columns: claimNumber, insuranceCompany, policyNumber?, claimantName, propertyAddress, damageType, incidentDate, state, estimatedAmount?, latitude?, longitude?, notes?
   * Deduplicates by claimNumber - skips existing claims
   * Returns: { created: number, skipped: number, errors: { row: number, error: string }[] }
   */
  const upload = multer({ dest: '/tmp/uploads' });
  app.post('/api/claims/import', upload.single('file'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      // Read and parse CSV
      const fileContent = fs.readFileSync(req.file.path, 'utf-8');
      const records = csvParse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true
      });

      let created = 0;
      let skipped = 0;
      const errors: Array<{ row: number; error: string; claimNumber?: string }> = [];

      // Process each row
      for (let i = 0; i < records.length; i++) {
        const row = records[i];
        const rowNumber = i + 2; // +2 for header and 1-indexed

        try {
          // Check for duplicate claim number
          if (!row.claimNumber) {
            errors.push({ row: rowNumber, error: 'Missing claim number' });
            continue;
          }

          const existing = await db
            .select()
            .from(claims)
            .where(eq(claims.claimNumber, row.claimNumber))
            .limit(1);

          if (existing.length > 0) {
            skipped++;
            console.log(`⏭️  Skipped duplicate claim: ${row.claimNumber}`);
            continue;
          }

          // Prepare claim data
          const claimData = {
            claimNumber: row.claimNumber,
            insuranceCompany: row.insuranceCompany,
            policyNumber: row.policyNumber || null,
            claimantName: row.claimantName,
            propertyAddress: row.propertyAddress,
            damageType: row.damageType,
            incidentDate: new Date(row.incidentDate),
            state: row.state,
            estimatedAmount: row.estimatedAmount ? String(row.estimatedAmount) : null,
            approvedAmount: row.approvedAmount ? String(row.approvedAmount) : null,
            paidAmount: row.paidAmount ? String(row.paidAmount) : null,
            latitude: row.latitude ? String(row.latitude) : null,
            longitude: row.longitude ? String(row.longitude) : null,
            notes: row.notes || null,
            status: (row.status as any) || 'active'
          };

          // Validate
          const validated = insertClaimSchema.parse(claimData);

          // Insert
          await db.insert(claims).values(validated);
          created++;
          console.log(`✅ Imported claim: ${validated.claimNumber}`);
        } catch (error) {
          errors.push({
            row: rowNumber,
            error: error instanceof Error ? error.message : 'Unknown error',
            claimNumber: row.claimNumber
          });
        }
      }

      // Cleanup temp file
      fs.unlinkSync(req.file.path);

      console.log(`📊 CSV Import complete: ${created} created, ${skipped} skipped, ${errors.length} errors`);

      res.json({
        success: true,
        created,
        skipped,
        errors,
        totalRows: records.length
      });
    } catch (error) {
      console.error('❌ Error importing claims CSV:', error);
      
      // Cleanup temp file on error
      if (req.file?.path) {
        try {
          fs.unlinkSync(req.file.path);
        } catch {}
      }
      
      res.status(500).json({
        error: 'Failed to import CSV',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * GET /api/align/summary
   * Returns hazard-claim alignment summary with moratorium flags
   * 
   * This endpoint:
   * - Finds all active hazards (NWS, NHC, MRMS)
   * - Detects which claims/assets intersect with hazard polygons
   * - Flags potential moratoriums (Extreme/Severe hazards)
   * - Returns summary with affected claims and recommendations
   */
  app.get('/api/align/summary', async (req: Request, res: Response) => {
    try {
      console.log('🔍 Calculating hazard-claim alignment...');

      // Fetch all active hazards
      const activeHazards = await db
        .select()
        .from(weatherAlerts)
        .where(eq(weatherAlerts.isActive, true));

      // Fetch all active claims with coordinates
      const activeClaims = await db
        .select()
        .from(claims)
        .where(eq(claims.status, 'active'));

      // Fetch all assets
      const allAssets = await db.select().from(assets);

      // Calculate intersections
      const intersections: any[] = [];
      const moratoriumClaims: any[] = [];

      for (const hazard of activeHazards) {
        // Check claims
        for (const claim of activeClaims) {
          if (claim.latitude && claim.longitude) {
            const claimLat = parseFloat(claim.latitude);
            const claimLon = parseFloat(claim.longitude);

            // Check if claim is within hazard area
            const isInHazard = isPointInHazard(
              claimLat,
              claimLon,
              hazard.polygon as any,
              parseFloat(hazard.latitude || '0'),
              parseFloat(hazard.longitude || '0')
            );

            if (isInHazard) {
              const isMoratorium = hazard.severity === 'Extreme' || hazard.severity === 'Severe';

              intersections.push({
                type: 'claim',
                id: claim.id,
                claimNumber: claim.claimNumber,
                hazardId: hazard.alertId,
                hazardType: hazard.source || hazard.alertType,
                severity: hazard.severity,
                moratoriumFlag: isMoratorium,
                location: `${claim.propertyAddress}, ${claim.state}`
              });

              if (isMoratorium) {
                moratoriumClaims.push({
                  claim: claim.claimNumber,
                  address: claim.propertyAddress,
                  hazard: hazard.event,
                  severity: hazard.severity
                });
              }
            }
          }
        }

        // Check assets
        for (const asset of allAssets) {
          const isInHazard = isPointInHazard(
            parseFloat(asset.latitude),
            parseFloat(asset.longitude),
            hazard.polygon as any,
            parseFloat(hazard.latitude || '0'),
            parseFloat(hazard.longitude || '0')
          );

          if (isInHazard) {
            const isMoratorium = hazard.severity === 'Extreme' || hazard.severity === 'Severe';

            intersections.push({
              type: 'asset',
              id: asset.id,
              name: asset.name,
              hazardId: hazard.alertId,
              hazardType: hazard.source || hazard.alertType,
              severity: hazard.severity,
              moratoriumFlag: isMoratorium,
              location: `${asset.address || asset.name}`
            });
          }
        }
      }

      const summary = {
        timestamp: new Date().toISOString(),
        totalActiveHazards: activeHazards.length,
        totalActiveClaims: activeClaims.length,
        totalAssets: allAssets.length,
        intersections: intersections.length,
        moratoriumCount: moratoriumClaims.length,
        hazards: activeHazards.map(h => ({
          id: h.alertId,
          event: h.event,
          severity: h.severity,
          source: h.source || 'NWS',
          areas: h.areas,
          expires: h.expires
        })),
        affectedClaims: intersections.filter(i => i.type === 'claim'),
        affectedAssets: intersections.filter(i => i.type === 'asset'),
        moratoriumAlerts: moratoriumClaims,
        recommendations: generateRecommendations(intersections, activeHazards)
      };

      res.json(summary);
    } catch (error) {
      console.error('❌ Error calculating alignment:', error);
      res.status(500).json({
        error: 'Failed to calculate hazard alignment',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
}

/**
 * Check if a point is within a hazard area
 * Uses simple bounding box for now - can be enhanced with proper polygon containment
 */
function isPointInHazard(
  lat: number,
  lon: number,
  polygon: [number, number][] | null,
  hazardLat: number,
  hazardLon: number
): boolean {
  // If we have a polygon, check if point is inside
  if (polygon && Array.isArray(polygon) && polygon.length > 0) {
    return isPointInPolygon(lat, lon, polygon);
  }

  // Fallback: check if within 50 miles of hazard center
  const distance = haversineDistance(lat, lon, hazardLat, hazardLon);
  return distance <= 50;
}

/**
 * Ray casting algorithm for point-in-polygon test
 */
function isPointInPolygon(lat: number, lon: number, polygon: [number, number][]): boolean {
  let inside = false;
  
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0];
    const yi = polygon[i][1];
    const xj = polygon[j][0];
    const yj = polygon[j][1];
    
    const intersect = ((yi > lon) !== (yj > lon)) &&
      (lat < (xj - xi) * (lon - yi) / (yj - yi) + xi);
    
    if (intersect) inside = !inside;
  }
  
  return inside;
}

/**
 * Calculate distance between two points using Haversine formula
 */
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Generate recommendations based on intersection analysis
 */
function generateRecommendations(intersections: any[], hazards: any[]): string[] {
  const recommendations: string[] = [];

  if (intersections.length === 0) {
    recommendations.push('No active hazard-claim intersections detected.');
    recommendations.push('Continue routine monitoring of weather conditions.');
    return recommendations;
  }

  const moratoriumCount = intersections.filter(i => i.moratoriumFlag).length;
  
  if (moratoriumCount > 0) {
    recommendations.push(`⚠️ MORATORIUM ALERT: ${moratoriumCount} claims/assets in Extreme/Severe hazard zones.`);
    recommendations.push('Insurance carriers may implement temporary coverage restrictions.');
    recommendations.push('Contractors: Stage equipment outside hazard polygons.');
    recommendations.push('Document all pre-event property conditions immediately.');
  }

  const extremeHazards = hazards.filter(h => h.severity === 'Extreme');
  if (extremeHazards.length > 0) {
    recommendations.push(`🚨 ${extremeHazards.length} EXTREME severity hazard(s) active - prioritize safety protocols.`);
    recommendations.push('Evacuate affected properties if evacuation orders issued.');
  }

  recommendations.push(`Monitor ${intersections.length} affected location(s) for post-event damage assessment.`);
  recommendations.push('Prepare damage documentation equipment (cameras, drones, measurement tools).');

  return recommendations;
}
