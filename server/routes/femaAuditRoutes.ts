import { Router, Request, Response } from 'express';
import { db } from '../db.js';
import { sql } from 'drizzle-orm';
import crypto from 'crypto';

const router = Router();

// ===== FEMA DISASTERS =====

router.get('/disasters', async (req: Request, res: Response) => {
  try {
    const { state, status } = req.query;
    
    const stateValue = state ? String(state) : null;
    const statusValue = status ? String(status) : null;
    
    const result = await db.execute(sql`
      SELECT * FROM fema_disasters 
      WHERE (${stateValue}::text IS NULL OR state = ${stateValue})
        AND (${statusValue}::text IS NULL OR status = ${statusValue})
      ORDER BY declaration_date DESC LIMIT 100
    `);
    res.json({ success: true, disasters: result.rows });
  } catch (error) {
    console.error('Error fetching FEMA disasters:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch disasters' });
  }
});

router.post('/disasters', async (req: Request, res: Response) => {
  try {
    const { femaNumber, incidentType, declarationTitle, declarationDate, state, declaredCounties, categoriesAuthorized } = req.body;
    
    const result = await db.execute(sql`
      INSERT INTO fema_disasters (fema_number, incident_type, declaration_title, declaration_date, state, declared_counties, categories_authorized)
      VALUES (${femaNumber}, ${incidentType}, ${declarationTitle}, ${declarationDate}, ${state}, ${declaredCounties}, ${categoriesAuthorized})
      RETURNING *
    `);
    
    res.json({ success: true, disaster: result.rows[0] });
  } catch (error) {
    console.error('Error creating FEMA disaster:', error);
    res.status(500).json({ success: false, error: 'Failed to create disaster' });
  }
});

// ===== CONTRACTS =====

router.get('/contracts', async (req: Request, res: Response) => {
  try {
    const { femaDisasterId, status, primeContractorId } = req.query;
    
    const femaDisasterIdValue = femaDisasterId ? String(femaDisasterId) : null;
    const statusValue = status ? String(status) : null;
    const primeContractorIdValue = primeContractorId ? String(primeContractorId) : null;
    
    const result = await db.execute(sql`
      SELECT * FROM fema_contracts 
      WHERE (${femaDisasterIdValue}::text IS NULL OR fema_disaster_id = ${femaDisasterIdValue})
        AND (${statusValue}::text IS NULL OR status = ${statusValue})
        AND (${primeContractorIdValue}::text IS NULL OR prime_contractor_id = ${primeContractorIdValue})
      ORDER BY created_at DESC LIMIT 100
    `);
    res.json({ success: true, contracts: result.rows });
  } catch (error) {
    console.error('Error fetching contracts:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch contracts' });
  }
});

router.post('/contracts', async (req: Request, res: Response) => {
  try {
    const { 
      contractNumber, contractTitle, primeContractorId, primeContractorName,
      femaDisasterId, incidentNumber, contractValue, contractType, tmCap,
      laborRates, equipmentRates, perDiemRules, overtimeRules,
      startDate, endDate
    } = req.body;
    
    const laborRatesJson = laborRates ? JSON.stringify(laborRates) : null;
    const equipmentRatesJson = equipmentRates ? JSON.stringify(equipmentRates) : null;
    const perDiemRulesJson = perDiemRules ? JSON.stringify(perDiemRules) : null;
    const overtimeRulesJson = overtimeRules ? JSON.stringify(overtimeRules) : null;
    const startDateValue = startDate || null;
    const endDateValue = endDate || null;
    
    const result = await db.execute(sql`
      INSERT INTO fema_contracts (
        contract_number, contract_title, prime_contractor_id, prime_contractor_name,
        fema_disaster_id, incident_number, contract_value, contract_type, tm_cap,
        labor_rates, equipment_rates, per_diem_rules, overtime_rules,
        start_date, end_date
      ) VALUES (
        ${contractNumber}, ${contractTitle || null}, ${primeContractorId || null}, ${primeContractorName},
        ${femaDisasterId || null}, ${incidentNumber || null}, ${contractValue || null}, ${contractType || 'time_materials'}, ${tmCap || 70},
        ${laborRatesJson}::jsonb, ${equipmentRatesJson}::jsonb, 
        ${perDiemRulesJson}::jsonb, ${overtimeRulesJson}::jsonb,
        ${startDateValue}, ${endDateValue}
      ) RETURNING *
    `);
    
    await logAuditEvent('create', 'contract', (result.rows[0] as any).id, null, result.rows[0], req);
    res.json({ success: true, contract: result.rows[0] });
  } catch (error) {
    console.error('Error creating contract:', error);
    res.status(500).json({ success: false, error: 'Failed to create contract' });
  }
});

router.get('/contracts/:id', async (req: Request, res: Response) => {
  try {
    const result = await db.execute(sql`SELECT * FROM fema_contracts WHERE id = ${req.params.id}`);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Contract not found' });
    }
    res.json({ success: true, contract: result.rows[0] });
  } catch (error) {
    console.error('Error fetching contract:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch contract' });
  }
});

// ===== PROJECT WORKSHEETS =====

router.get('/project-worksheets', async (req: Request, res: Response) => {
  try {
    const { contractId, femaDisasterId, category, status } = req.query;
    
    const contractIdValue = contractId ? String(contractId) : null;
    const femaDisasterIdValue = femaDisasterId ? String(femaDisasterId) : null;
    const categoryValue = category ? String(category) : null;
    const statusValue = status ? String(status) : null;
    
    const result = await db.execute(sql`
      SELECT * FROM fema_project_worksheets 
      WHERE (${contractIdValue}::text IS NULL OR contract_id = ${contractIdValue})
        AND (${femaDisasterIdValue}::text IS NULL OR fema_disaster_id = ${femaDisasterIdValue})
        AND (${categoryValue}::text IS NULL OR category = ${categoryValue})
        AND (${statusValue}::text IS NULL OR status = ${statusValue})
      ORDER BY created_at DESC LIMIT 100
    `);
    
    res.json({ success: true, projectWorksheets: result.rows });
  } catch (error) {
    console.error('Error fetching project worksheets:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch project worksheets' });
  }
});

router.post('/project-worksheets', async (req: Request, res: Response) => {
  try {
    const { pwNumber, femaDisasterId, contractId, category, categoryName, scopeOfWork, damageDescription, county, siteAddress, latitude, longitude, estimatedCost } = req.body;
    
    const result = await db.execute(sql`
      INSERT INTO fema_project_worksheets (
        pw_number, fema_disaster_id, contract_id, category, category_name,
        scope_of_work, damage_description, county, site_address, latitude, longitude, estimated_cost
      ) VALUES (
        ${pwNumber}, ${femaDisasterId}, ${contractId}, ${category}, ${categoryName},
        ${scopeOfWork}, ${damageDescription}, ${county}, ${siteAddress}, ${latitude}, ${longitude}, ${estimatedCost}
      ) RETURNING *
    `);
    
    await logAuditEvent('create', 'project_worksheet', (result.rows[0] as any).id, null, result.rows[0], req);
    res.json({ success: true, projectWorksheet: result.rows[0] });
  } catch (error) {
    console.error('Error creating project worksheet:', error);
    res.status(500).json({ success: false, error: 'Failed to create project worksheet' });
  }
});

// ===== GEO ZONES (Geofencing) =====

router.get('/geo-zones', async (req: Request, res: Response) => {
  try {
    const { contractId, status, zoneType } = req.query;
    
    const contractIdValue = contractId ? String(contractId) : null;
    const statusValue = status ? String(status) : null;
    const zoneTypeValue = zoneType ? String(zoneType) : null;
    
    const result = await db.execute(sql`
      SELECT * FROM fema_geo_zones 
      WHERE (${contractIdValue}::text IS NULL OR contract_id = ${contractIdValue})
        AND (${statusValue}::text IS NULL OR status = ${statusValue})
        AND (${zoneTypeValue}::text IS NULL OR zone_type = ${zoneTypeValue})
      ORDER BY created_at DESC LIMIT 500
    `);
    
    res.json({ success: true, geoZones: result.rows });
  } catch (error) {
    console.error('Error fetching geo zones:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch geo zones' });
  }
});

router.post('/geo-zones', async (req: Request, res: Response) => {
  try {
    const { zoneName, zoneType, contractId, pwId, circuitId, spanId, poleNumbers, mileMarkers, geofencePolygon, centerLatitude, centerLongitude, radiusMeters, assignedCrewId } = req.body;
    
    const result = await db.execute(sql`
      INSERT INTO fema_geo_zones (
        zone_name, zone_type, contract_id, pw_id, circuit_id, span_id,
        pole_numbers, mile_markers, geofence_polygon, center_latitude, center_longitude, radius_meters, assigned_crew_id
      ) VALUES (
        ${zoneName}, ${zoneType}, ${contractId}, ${pwId}, ${circuitId}, ${spanId},
        ${poleNumbers}, ${mileMarkers}, ${JSON.stringify(geofencePolygon)}, ${centerLatitude}, ${centerLongitude}, ${radiusMeters}, ${assignedCrewId}
      ) RETURNING *
    `);
    
    res.json({ success: true, geoZone: result.rows[0] });
  } catch (error) {
    console.error('Error creating geo zone:', error);
    res.status(500).json({ success: false, error: 'Failed to create geo zone' });
  }
});

// Check if coordinates are inside a geofence
router.post('/geo-zones/check', async (req: Request, res: Response) => {
  try {
    const { latitude, longitude, contractId } = req.body;
    
    const zones = await db.execute(sql`
      SELECT * FROM fema_geo_zones 
      WHERE contract_id = ${contractId} AND status != 'completed'
    `);
    
    const insideZones: any[] = [];
    
    for (const zone of zones.rows as any[]) {
      if (zone.center_latitude && zone.center_longitude && zone.radius_meters) {
        const distance = calculateDistance(
          parseFloat(latitude), parseFloat(longitude),
          parseFloat(zone.center_latitude), parseFloat(zone.center_longitude)
        );
        if (distance <= zone.radius_meters) {
          insideZones.push(zone);
        }
      }
    }
    
    res.json({ 
      success: true, 
      insideGeofence: insideZones.length > 0,
      zones: insideZones
    });
  } catch (error) {
    console.error('Error checking geofence:', error);
    res.status(500).json({ success: false, error: 'Failed to check geofence' });
  }
});

// ===== WORK LOGS (Span-Based Logging) =====

router.get('/work-logs', async (req: Request, res: Response) => {
  try {
    const { contractId, crewId, status, startDate, endDate } = req.query;
    
    const contractIdValue = contractId ? String(contractId) : null;
    const crewIdValue = crewId ? String(crewId) : null;
    const statusValue = status ? String(status) : null;
    const startDateValue = startDate ? String(startDate) : null;
    const endDateValue = endDate ? String(endDate) : null;
    
    const result = await db.execute(sql`
      SELECT * FROM fema_work_logs 
      WHERE (${contractIdValue}::text IS NULL OR contract_id = ${contractIdValue})
        AND (${crewIdValue}::text IS NULL OR crew_id = ${crewIdValue})
        AND (${statusValue}::text IS NULL OR status = ${statusValue})
        AND (${startDateValue}::timestamp IS NULL OR server_timestamp >= ${startDateValue}::timestamp)
        AND (${endDateValue}::timestamp IS NULL OR server_timestamp <= ${endDateValue}::timestamp)
      ORDER BY server_timestamp DESC LIMIT 500
    `);
    
    res.json({ success: true, workLogs: result.rows, total: result.rows.length });
  } catch (error) {
    console.error('Error fetching work logs:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch work logs' });
  }
});

router.post('/work-logs', async (req: Request, res: Response) => {
  try {
    const { 
      contractId, pwId, geoZoneId, crewId, femaCostCode, workCategory,
      spanId, poleStart, poleEnd, circuitId, latitude, longitude, gpsAccuracyMeters,
      workType, treeSpecies, hazardClass, estimatedDbh, estimatedHeight, debrisType, cubicYards,
      workStartTime, workEndTime, beforePhotoUrl, afterPhotoUrl, equipmentIds, workerIds, foremanId, operatorName
    } = req.body;
    
    // Calculate if inside geofence
    let insideGeofence = true;
    if (geoZoneId && latitude && longitude) {
      const zoneCheck = await db.execute(sql`SELECT * FROM fema_geo_zones WHERE id = ${geoZoneId}`);
      if (zoneCheck.rows.length > 0) {
        const zone = zoneCheck.rows[0] as any;
        if (zone.center_latitude && zone.center_longitude && zone.radius_meters) {
          const distance = calculateDistance(
            parseFloat(latitude), parseFloat(longitude),
            parseFloat(zone.center_latitude), parseFloat(zone.center_longitude)
          );
          insideGeofence = distance <= zone.radius_meters;
        }
      }
    }
    
    // Calculate total minutes
    let totalMinutes = null;
    if (workStartTime && workEndTime) {
      totalMinutes = Math.round((new Date(workEndTime).getTime() - new Date(workStartTime).getTime()) / 60000);
    }
    
    const result = await db.execute(sql`
      INSERT INTO fema_work_logs (
        contract_id, pw_id, geo_zone_id, crew_id, fema_cost_code, work_category,
        span_id, pole_start, pole_end, circuit_id, latitude, longitude, gps_accuracy_meters, inside_geofence,
        work_type, tree_species, hazard_class, estimated_dbh, estimated_height, debris_type, cubic_yards,
        work_start_time, work_end_time, total_minutes,
        before_photo_url, after_photo_url, equipment_ids, worker_ids, foreman_id, operator_name
      ) VALUES (
        ${contractId}, ${pwId}, ${geoZoneId}, ${crewId}, ${femaCostCode}, ${workCategory},
        ${spanId}, ${poleStart}, ${poleEnd}, ${circuitId}, ${latitude}, ${longitude}, ${gpsAccuracyMeters}, ${insideGeofence},
        ${workType}, ${treeSpecies}, ${hazardClass}, ${estimatedDbh}, ${estimatedHeight}, ${debrisType}, ${cubicYards},
        ${workStartTime}, ${workEndTime}, ${totalMinutes},
        ${beforePhotoUrl}, ${afterPhotoUrl}, ${equipmentIds}, ${workerIds}, ${foremanId}, ${operatorName}
      ) RETURNING *
    `);
    
    // Flag if outside geofence
    if (!insideGeofence) {
      await createAiFinding(contractId, 'gps_anomaly', 'medium', `Work logged outside assigned geofence zone`, (result.rows[0] as any).id);
    }
    
    await logAuditEvent('create', 'work_log', (result.rows[0] as any).id, null, result.rows[0], req);
    res.json({ success: true, workLog: result.rows[0], insideGeofence });
  } catch (error) {
    console.error('Error creating work log:', error);
    res.status(500).json({ success: false, error: 'Failed to create work log' });
  }
});

// AI Validate Work Log Photos
router.post('/work-logs/:id/ai-validate', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const workLog = await db.execute(sql`SELECT * FROM fema_work_logs WHERE id = ${id}`);
    if (workLog.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Work log not found' });
    }
    
    const log = workLog.rows[0] as any;
    
    // AI Validation Logic (simplified - would use actual AI models)
    let validationScore = 100;
    const notes: string[] = [];
    
    // Check for before/after photos
    if (!log.before_photo_url) {
      validationScore -= 25;
      notes.push('Missing before photo');
    }
    if (!log.after_photo_url) {
      validationScore -= 25;
      notes.push('Missing after photo');
    }
    
    // Check GPS accuracy
    if (log.gps_accuracy_meters && log.gps_accuracy_meters > 50) {
      validationScore -= 10;
      notes.push('GPS accuracy exceeds 50 meters');
    }
    
    // Check if inside geofence
    if (!log.inside_geofence) {
      validationScore -= 20;
      notes.push('Work logged outside geofence');
    }
    
    // Photo match score (placeholder - would use actual image comparison)
    const photoMatchScore = log.before_photo_url && log.after_photo_url ? 85 : 0;
    
    await db.execute(sql`
      UPDATE fema_work_logs 
      SET ai_validated = true, ai_validation_score = ${validationScore}, 
          ai_validation_notes = ${notes.join('; ')}, photo_match_score = ${photoMatchScore}
      WHERE id = ${id}
    `);
    
    res.json({ 
      success: true, 
      validationScore, 
      photoMatchScore,
      notes,
      passed: validationScore >= 70
    });
  } catch (error) {
    console.error('Error validating work log:', error);
    res.status(500).json({ success: false, error: 'Failed to validate work log' });
  }
});

// ===== LOAD TICKETS =====

router.get('/load-tickets', async (req: Request, res: Response) => {
  try {
    const { contractId, status, debrisType, startDate, endDate } = req.query;
    
    const contractIdValue = contractId ? String(contractId) : null;
    const statusValue = status ? String(status) : null;
    const debrisTypeValue = debrisType ? String(debrisType) : null;
    const startDateValue = startDate ? String(startDate) : null;
    const endDateValue = endDate ? String(endDate) : null;
    
    const result = await db.execute(sql`
      SELECT * FROM fema_load_tickets 
      WHERE (${contractIdValue}::text IS NULL OR contract_id = ${contractIdValue})
        AND (${statusValue}::text IS NULL OR status = ${statusValue})
        AND (${debrisTypeValue}::text IS NULL OR debris_type = ${debrisTypeValue})
        AND (${startDateValue}::timestamp IS NULL OR pickup_timestamp >= ${startDateValue}::timestamp)
        AND (${endDateValue}::timestamp IS NULL OR pickup_timestamp <= ${endDateValue}::timestamp)
      ORDER BY pickup_timestamp DESC LIMIT 500
    `);
    
    res.json({ success: true, loadTickets: result.rows, total: result.rows.length });
  } catch (error) {
    console.error('Error fetching load tickets:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch load tickets' });
  }
});

router.post('/load-tickets', async (req: Request, res: Response) => {
  try {
    const { 
      ticketNumber, contractId, pwId, debrisType, estimatedCubicYards,
      pickupAddress, pickupLatitude, pickupLongitude, pickupPhotoUrl,
      truckId, truckLicensePlate, driverName, driverId, loadedTruckPhotoUrl,
      hazardousMaterialsFlag, whiteGoodsSeparated, eWasteSeparated
    } = req.body;
    
    // Generate chain of custody hash
    const chainData = `${ticketNumber}|${contractId}|${Date.now()}|${pickupLatitude}|${pickupLongitude}`;
    const chainHash = crypto.createHash('sha256').update(chainData).digest('hex');
    
    const result = await db.execute(sql`
      INSERT INTO fema_load_tickets (
        ticket_number, contract_id, pw_id, debris_type, estimated_cubic_yards,
        pickup_address, pickup_latitude, pickup_longitude, pickup_timestamp, pickup_photo_url,
        truck_id, truck_license_plate, driver_name, driver_id, loaded_truck_photo_url,
        hazardous_materials_flag, white_goods_separated, e_waste_separated,
        chain_of_custody_hash, status
      ) VALUES (
        ${ticketNumber}, ${contractId}, ${pwId}, ${debrisType}, ${estimatedCubicYards},
        ${pickupAddress}, ${pickupLatitude}, ${pickupLongitude}, NOW(), ${pickupPhotoUrl},
        ${truckId}, ${truckLicensePlate}, ${driverName}, ${driverId}, ${loadedTruckPhotoUrl},
        ${hazardousMaterialsFlag || false}, ${whiteGoodsSeparated || false}, ${eWasteSeparated || false},
        ${chainHash}, 'in_transit'
      ) RETURNING *
    `);
    
    // Check for duplicate ticket numbers
    const duplicates = await db.execute(sql`
      SELECT COUNT(*) as count FROM fema_load_tickets 
      WHERE ticket_number = ${ticketNumber} AND contract_id = ${contractId}
    `);
    if (parseInt((duplicates.rows[0] as any).count) > 1) {
      await createAiFinding(contractId, 'duplicate_load_ticket', 'high', `Duplicate ticket number detected: ${ticketNumber}`, (result.rows[0] as any).id);
    }
    
    await logAuditEvent('create', 'load_ticket', (result.rows[0] as any).id, null, result.rows[0], req);
    res.json({ success: true, loadTicket: result.rows[0] });
  } catch (error) {
    console.error('Error creating load ticket:', error);
    res.status(500).json({ success: false, error: 'Failed to create load ticket' });
  }
});

// Record disposal for load ticket
router.post('/load-tickets/:id/disposal', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { 
      actualCubicYards, disposalSiteName, disposalSiteId, disposalLatitude, disposalLongitude,
      disposalPhotoUrl, disposalMonitorId, disposalMonitorName, disposalMonitorSignature,
      routeGpsLog, travelDistanceMiles, travelTimeMinutes
    } = req.body;
    
    // Get original ticket for chain verification
    const original = await db.execute(sql`SELECT * FROM fema_load_tickets WHERE id = ${id}`);
    if (original.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Load ticket not found' });
    }
    
    const result = await db.execute(sql`
      UPDATE fema_load_tickets SET
        actual_cubic_yards = ${actualCubicYards},
        disposal_site_name = ${disposalSiteName},
        disposal_site_id = ${disposalSiteId},
        disposal_latitude = ${disposalLatitude},
        disposal_longitude = ${disposalLongitude},
        disposal_timestamp = NOW(),
        disposal_photo_url = ${disposalPhotoUrl},
        disposal_monitor_id = ${disposalMonitorId},
        disposal_monitor_name = ${disposalMonitorName},
        disposal_monitor_signature = ${disposalMonitorSignature},
        disposal_verified = true,
        disposal_verified_at = NOW(),
        route_gps_log = ${JSON.stringify(routeGpsLog)},
        travel_distance_miles = ${travelDistanceMiles},
        travel_time_minutes = ${travelTimeMinutes},
        status = 'verified'
      WHERE id = ${id}
      RETURNING *
    `);
    
    // Check for impossible travel time
    if (travelDistanceMiles && travelTimeMinutes) {
      const avgSpeed = (travelDistanceMiles / travelTimeMinutes) * 60; // mph
      if (avgSpeed > 70) {
        await createAiFinding((original.rows[0] as any).contract_id, 'impossible_travel', 'medium', 
          `Impossible travel speed detected: ${avgSpeed.toFixed(1)} mph`, id);
      }
    }
    
    await logAuditEvent('update', 'load_ticket', id, original.rows[0], result.rows[0], req);
    res.json({ success: true, loadTicket: result.rows[0] });
  } catch (error) {
    console.error('Error recording disposal:', error);
    res.status(500).json({ success: false, error: 'Failed to record disposal' });
  }
});

// ===== RATE VALIDATION ENGINE =====

router.post('/validate-rates', async (req: Request, res: Response) => {
  try {
    const { contractId, laborEntries, equipmentEntries } = req.body;
    
    // Get contract rate sheet
    const contract = await db.execute(sql`SELECT * FROM fema_contracts WHERE id = ${contractId}`);
    if (contract.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Contract not found' });
    }
    
    const contractData = contract.rows[0] as any;
    const laborRates = contractData.labor_rates || {};
    const equipmentRates = contractData.equipment_rates || {};
    const tmCap = contractData.tm_cap || 70;
    
    const violations: any[] = [];
    let totalLaborHours = 0;
    
    // Validate labor rates
    if (laborEntries) {
      for (const entry of laborEntries) {
        const contractRate = laborRates[entry.classification];
        if (contractRate && entry.billedRate > contractRate) {
          violations.push({
            type: 'rate_violation',
            severity: 'high',
            entity: 'labor',
            description: `Labor rate for ${entry.classification} exceeds contract rate: $${entry.billedRate}/hr vs $${contractRate}/hr`
          });
        }
        totalLaborHours += entry.hours || 0;
      }
    }
    
    // Check T&M cap
    if (totalLaborHours > tmCap) {
      violations.push({
        type: 'tm_cap_exceeded',
        severity: 'critical',
        entity: 'labor',
        description: `T&M hours (${totalLaborHours}) exceed FEMA cap of ${tmCap} hours`
      });
    }
    
    // Validate equipment rates
    if (equipmentEntries) {
      for (const entry of equipmentEntries) {
        const contractRate = equipmentRates[entry.equipmentType];
        if (contractRate && entry.billedRate > contractRate) {
          violations.push({
            type: 'rate_violation',
            severity: 'high',
            entity: 'equipment',
            description: `Equipment rate for ${entry.equipmentType} exceeds contract rate: $${entry.billedRate}/hr vs $${contractRate}/hr`
          });
        }
      }
    }
    
    // Create AI findings for violations
    for (const v of violations) {
      await createAiFinding(contractId, v.type, v.severity, v.description, null);
    }
    
    res.json({
      success: true,
      compliant: violations.length === 0,
      violations,
      totalLaborHours,
      tmCap,
      tmCompliant: totalLaborHours <= tmCap
    });
  } catch (error) {
    console.error('Error validating rates:', error);
    res.status(500).json({ success: false, error: 'Failed to validate rates' });
  }
});

// ===== AI FINDINGS (Fraud Detection) =====

router.get('/ai-findings', async (req: Request, res: Response) => {
  try {
    const { contractId, severity, status, findingType } = req.query;
    
    const contractIdValue = contractId ? String(contractId) : null;
    const severityValue = severity ? String(severity) : null;
    const statusValue = status ? String(status) : null;
    const findingTypeValue = findingType ? String(findingType) : null;
    
    const result = await db.execute(sql`
      SELECT * FROM fema_ai_findings 
      WHERE (${contractIdValue}::text IS NULL OR contract_id = ${contractIdValue})
        AND (${severityValue}::text IS NULL OR severity = ${severityValue})
        AND (${statusValue}::text IS NULL OR status = ${statusValue})
        AND (${findingTypeValue}::text IS NULL OR finding_type = ${findingTypeValue})
      ORDER BY created_at DESC LIMIT 200
    `);
    
    res.json({ success: true, findings: result.rows });
  } catch (error) {
    console.error('Error fetching AI findings:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch AI findings' });
  }
});

router.patch('/ai-findings/:id/resolve', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { resolvedBy, resolutionNotes } = req.body;
    
    const result = await db.execute(sql`
      UPDATE fema_ai_findings SET
        status = 'resolved',
        resolved_by = ${resolvedBy},
        resolved_at = NOW(),
        resolution_notes = ${resolutionNotes}
      WHERE id = ${id}
      RETURNING *
    `);
    
    res.json({ success: true, finding: result.rows[0] });
  } catch (error) {
    console.error('Error resolving finding:', error);
    res.status(500).json({ success: false, error: 'Failed to resolve finding' });
  }
});

// Run AI Fraud Scan
router.post('/ai-scan', async (req: Request, res: Response) => {
  try {
    const { contractId } = req.body;
    
    const findings: any[] = [];
    
    // Check for duplicate work logs (same location, same time)
    const duplicateWork = await db.execute(sql`
      SELECT w1.id as id1, w2.id as id2, w1.latitude, w1.longitude, w1.server_timestamp
      FROM fema_work_logs w1
      JOIN fema_work_logs w2 ON w1.id != w2.id
      WHERE w1.contract_id = ${contractId}
        AND w2.contract_id = ${contractId}
        AND ABS(EXTRACT(EPOCH FROM (w1.server_timestamp - w2.server_timestamp))) < 3600
        AND w1.latitude = w2.latitude AND w1.longitude = w2.longitude
    `);
    
    for (const dup of duplicateWork.rows as any[]) {
      findings.push({
        type: 'duplicate_crew',
        severity: 'high',
        description: `Duplicate work logged at same location within 1 hour`,
        entities: [dup.id1, dup.id2]
      });
    }
    
    // Check for workers logged to multiple contracts same day
    const multiContract = await db.execute(sql`
      SELECT UNNEST(worker_ids) as worker_id, DATE(server_timestamp) as work_date, COUNT(DISTINCT contract_id) as contract_count
      FROM fema_work_logs
      WHERE contract_id = ${contractId}
      GROUP BY UNNEST(worker_ids), DATE(server_timestamp)
      HAVING COUNT(DISTINCT contract_id) > 1
    `);
    
    for (const mc of multiContract.rows as any[]) {
      findings.push({
        type: 'worker_conflict',
        severity: 'critical',
        description: `Worker ${mc.worker_id} logged on ${mc.contract_count} contracts on ${mc.work_date}`
      });
    }
    
    // Store findings
    for (const f of findings) {
      await createAiFinding(contractId, f.type, f.severity, f.description, null);
    }
    
    res.json({ success: true, findingsCount: findings.length, findings });
  } catch (error) {
    console.error('Error running AI scan:', error);
    res.status(500).json({ success: false, error: 'Failed to run AI scan' });
  }
});

// ===== AUDIT RISK SCORES =====

router.get('/risk-scores', async (req: Request, res: Response) => {
  try {
    const { contractId, pwId } = req.query;
    
    const contractIdValue = contractId ? String(contractId) : null;
    const pwIdValue = pwId ? String(pwId) : null;
    
    const result = await db.execute(sql`
      SELECT * FROM fema_audit_risk_scores 
      WHERE (${contractIdValue}::text IS NULL OR contract_id = ${contractIdValue})
        AND (${pwIdValue}::text IS NULL OR pw_id = ${pwIdValue})
      ORDER BY calculated_date DESC LIMIT 50
    `);
    
    res.json({ success: true, riskScores: result.rows });
  } catch (error) {
    console.error('Error fetching risk scores:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch risk scores' });
  }
});

// Calculate Risk Score for Contract
router.post('/risk-scores/calculate', async (req: Request, res: Response) => {
  try {
    const { contractId } = req.body;
    
    // Get contract data
    const workLogs = await db.execute(sql`SELECT * FROM fema_work_logs WHERE contract_id = ${contractId}`);
    const loadTickets = await db.execute(sql`SELECT * FROM fema_load_tickets WHERE contract_id = ${contractId}`);
    const aiFindings = await db.execute(sql`SELECT * FROM fema_ai_findings WHERE contract_id = ${contractId} AND status = 'open'`);
    
    // Calculate component scores
    let documentationScore = 100;
    let gpsComplianceScore = 100;
    let photoScore = 100;
    let fraudIndicatorScore = 100;
    
    // Documentation completeness
    const logsWithPhotos = (workLogs.rows as any[]).filter(l => l.before_photo_url && l.after_photo_url).length;
    photoScore = workLogs.rows.length > 0 ? Math.round((logsWithPhotos / workLogs.rows.length) * 100) : 100;
    
    // GPS compliance
    const logsInsideGeofence = (workLogs.rows as any[]).filter(l => l.inside_geofence).length;
    gpsComplianceScore = workLogs.rows.length > 0 ? Math.round((logsInsideGeofence / workLogs.rows.length) * 100) : 100;
    
    // Count issues by severity
    const criticalIssues = (aiFindings.rows as any[]).filter(f => f.severity === 'critical').length;
    const highIssues = (aiFindings.rows as any[]).filter(f => f.severity === 'high').length;
    const mediumIssues = (aiFindings.rows as any[]).filter(f => f.severity === 'medium').length;
    const lowIssues = (aiFindings.rows as any[]).filter(f => f.severity === 'low').length;
    
    // Fraud indicator score
    fraudIndicatorScore = Math.max(0, 100 - (criticalIssues * 25) - (highIssues * 15) - (mediumIssues * 5) - (lowIssues * 2));
    
    // Overall risk score
    const overallRiskScore = Math.round((documentationScore + gpsComplianceScore + photoScore + fraudIndicatorScore) / 4);
    const riskLevel = overallRiskScore >= 80 ? 'low' : overallRiskScore >= 50 ? 'moderate' : 'high';
    
    // Store the risk score
    const result = await db.execute(sql`
      INSERT INTO fema_audit_risk_scores (
        contract_id, overall_risk_score, risk_level,
        documentation_score, gps_compliance_score, photo_score, fraud_indicator_score,
        critical_issues, high_issues, medium_issues, low_issues
      ) VALUES (
        ${contractId}, ${overallRiskScore}, ${riskLevel},
        ${documentationScore}, ${gpsComplianceScore}, ${photoScore}, ${fraudIndicatorScore},
        ${criticalIssues}, ${highIssues}, ${mediumIssues}, ${lowIssues}
      ) RETURNING *
    `);
    
    res.json({ 
      success: true, 
      riskScore: result.rows[0],
      breakdown: {
        documentationScore,
        gpsComplianceScore,
        photoScore,
        fraudIndicatorScore,
        criticalIssues,
        highIssues,
        mediumIssues,
        lowIssues
      }
    });
  } catch (error) {
    console.error('Error calculating risk score:', error);
    res.status(500).json({ success: false, error: 'Failed to calculate risk score' });
  }
});

// ===== MONITOR SESSIONS =====

router.post('/monitor-sessions', async (req: Request, res: Response) => {
  try {
    const { monitorId, monitorName, monitorType, monitorAgency, contractId, gpsLatitude, gpsLongitude } = req.body;
    
    const result = await db.execute(sql`
      INSERT INTO fema_monitor_sessions (
        monitor_id, monitor_name, monitor_type, monitor_agency, contract_id,
        session_date, login_time, gps_latitude, gps_longitude
      ) VALUES (
        ${monitorId}, ${monitorName}, ${monitorType}, ${monitorAgency}, ${contractId},
        NOW(), NOW(), ${gpsLatitude}, ${gpsLongitude}
      ) RETURNING *
    `);
    
    res.json({ success: true, session: result.rows[0] });
  } catch (error) {
    console.error('Error creating monitor session:', error);
    res.status(500).json({ success: false, error: 'Failed to create monitor session' });
  }
});

// Monitor verifies a work log
router.post('/monitor-sessions/:sessionId/verify-work-log', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { workLogId, signaturePin } = req.body;
    
    // Update work log
    await db.execute(sql`
      UPDATE fema_work_logs SET
        monitor_verified = true,
        monitor_signature_pin = ${signaturePin},
        monitor_verified_at = NOW(),
        status = 'verified'
      WHERE id = ${workLogId}
    `);
    
    // Update session stats
    await db.execute(sql`
      UPDATE fema_monitor_sessions SET
        work_logs_verified = work_logs_verified + 1
      WHERE id = ${sessionId}
    `);
    
    res.json({ success: true, message: 'Work log verified' });
  } catch (error) {
    console.error('Error verifying work log:', error);
    res.status(500).json({ success: false, error: 'Failed to verify work log' });
  }
});

// ===== EXPORTS =====

router.post('/exports', async (req: Request, res: Response) => {
  try {
    const { 
      contractId, femaDisasterId, pwId, exportType, exportFormat,
      dateRangeStart, dateRangeEnd, categoryFilter,
      requestedBy, includesLabor, includesEquipment, includesDebris, includesPhotos, includesRiskScore
    } = req.body;
    
    const result = await db.execute(sql`
      INSERT INTO fema_exports (
        contract_id, fema_disaster_id, pw_id, export_type, export_format,
        date_range_start, date_range_end, category_filter, requested_by,
        includes_labor_summary, includes_equipment_summary, includes_debris_totals,
        includes_photo_index, includes_risk_score, status
      ) VALUES (
        ${contractId}, ${femaDisasterId}, ${pwId}, ${exportType}, ${exportFormat},
        ${dateRangeStart}, ${dateRangeEnd}, ${categoryFilter}, ${requestedBy},
        ${includesLabor !== false}, ${includesEquipment !== false}, ${includesDebris !== false},
        ${includesPhotos !== false}, ${includesRiskScore !== false}, 'pending'
      ) RETURNING *
    `);
    
    // Start async export generation (would be a background job in production)
    generateExportAsync(result.rows[0].id as string, contractId);
    
    res.json({ success: true, export: result.rows[0] });
  } catch (error) {
    console.error('Error creating export:', error);
    res.status(500).json({ success: false, error: 'Failed to create export' });
  }
});

router.get('/exports', async (req: Request, res: Response) => {
  try {
    const { contractId, status } = req.query;
    
    const contractIdValue = contractId ? String(contractId) : null;
    const statusValue = status ? String(status) : null;
    
    const result = await db.execute(sql`
      SELECT * FROM fema_exports 
      WHERE (${contractIdValue}::text IS NULL OR contract_id = ${contractIdValue})
        AND (${statusValue}::text IS NULL OR status = ${statusValue})
      ORDER BY created_at DESC LIMIT 50
    `);
    
    res.json({ success: true, exports: result.rows });
  } catch (error) {
    console.error('Error fetching exports:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch exports' });
  }
});

// ===== DASHBOARD STATS =====

router.get('/dashboard/:contractId', async (req: Request, res: Response) => {
  try {
    const { contractId } = req.params;
    
    // Get aggregate stats
    const workLogStats = await db.execute(sql`
      SELECT 
        COUNT(*) as total_logs,
        SUM(cubic_yards) as total_cubic_yards,
        SUM(total_minutes) as total_minutes,
        COUNT(CASE WHEN status = 'verified' THEN 1 END) as verified_count,
        COUNT(CASE WHEN ai_validated THEN 1 END) as ai_validated_count
      FROM fema_work_logs WHERE contract_id = ${contractId}
    `);
    
    const loadTicketStats = await db.execute(sql`
      SELECT 
        COUNT(*) as total_tickets,
        SUM(estimated_cubic_yards) as total_estimated_yards,
        SUM(actual_cubic_yards) as total_actual_yards,
        COUNT(CASE WHEN disposal_verified THEN 1 END) as verified_count
      FROM fema_load_tickets WHERE contract_id = ${contractId}
    `);
    
    const aiFindings = await db.execute(sql`
      SELECT severity, COUNT(*) as count
      FROM fema_ai_findings WHERE contract_id = ${contractId} AND status = 'open'
      GROUP BY severity
    `);
    
    const latestRiskScore = await db.execute(sql`
      SELECT * FROM fema_audit_risk_scores 
      WHERE contract_id = ${contractId}
      ORDER BY calculated_date DESC LIMIT 1
    `);
    
    res.json({
      success: true,
      dashboard: {
        workLogs: workLogStats.rows[0],
        loadTickets: loadTicketStats.rows[0],
        openFindings: aiFindings.rows,
        riskScore: latestRiskScore.rows[0] || null
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch dashboard' });
  }
});

// ===== HELPER FUNCTIONS =====

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

async function createAiFinding(contractId: string, findingType: string, severity: string, summary: string, entityId: string | null) {
  await db.execute(sql`
    INSERT INTO fema_ai_findings (contract_id, finding_type, severity, summary, related_entities)
    VALUES (${contractId}, ${findingType}, ${severity}, ${summary}, ${JSON.stringify(entityId ? [{ entityId }] : [])})
  `);
}

async function logAuditEvent(eventType: string, entityType: string, entityId: string, previousData: any, newData: any, req: Request) {
  const userId = 'system'; // Would come from auth
  const ipAddress = req.ip || req.connection.remoteAddress;
  
  // Get previous log hash for chain
  const lastLog = await db.execute(sql`SELECT current_log_hash FROM fema_audit_logs ORDER BY created_at DESC LIMIT 1`);
  const previousLogHash = lastLog.rows.length > 0 ? (lastLog.rows[0] as any).current_log_hash : null;
  
  // Create current log hash
  const hashData = `${eventType}|${entityType}|${entityId}|${Date.now()}|${previousLogHash || 'genesis'}`;
  const currentLogHash = crypto.createHash('sha256').update(hashData).digest('hex');
  
  await db.execute(sql`
    INSERT INTO fema_audit_logs (
      event_type, entity_type, entity_id, user_id, previous_data, new_data,
      ip_address, previous_log_hash, current_log_hash
    ) VALUES (
      ${eventType}, ${entityType}, ${entityId}, ${userId}, 
      ${previousData ? JSON.stringify(previousData) : null}, 
      ${newData ? JSON.stringify(newData) : null},
      ${ipAddress}, ${previousLogHash}, ${currentLogHash}
    )
  `);
}

async function generateExportAsync(exportId: string, contractId: string) {
  try {
    // Update status to generating
    await db.execute(sql`UPDATE fema_exports SET status = 'generating', progress = 10 WHERE id = ${exportId}`);
    
    // Gather data (simplified - would generate actual files)
    const workLogs = await db.execute(sql`SELECT COUNT(*) as count FROM fema_work_logs WHERE contract_id = ${contractId}`);
    const loadTickets = await db.execute(sql`SELECT COUNT(*) as count FROM fema_load_tickets WHERE contract_id = ${contractId}`);
    
    await db.execute(sql`UPDATE fema_exports SET progress = 50 WHERE id = ${exportId}`);
    
    const recordCount = parseInt((workLogs.rows[0] as any).count) + parseInt((loadTickets.rows[0] as any).count);
    
    // Mark complete (would create actual file in production)
    await db.execute(sql`
      UPDATE fema_exports SET 
        status = 'completed', progress = 100, completed_at = NOW(),
        record_count = ${recordCount}
      WHERE id = ${exportId}
    `);
  } catch (error) {
    console.error('Error generating export:', error);
    await db.execute(sql`UPDATE fema_exports SET status = 'failed', error_message = 'Export generation failed' WHERE id = ${exportId}`);
  }
}

export default router;
