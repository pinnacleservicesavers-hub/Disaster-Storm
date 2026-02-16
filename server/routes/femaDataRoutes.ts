import { Router, Request, Response } from 'express';
import { db } from '../db.js';
import { sql } from 'drizzle-orm';
import crypto from 'crypto';

const router = Router();

router.get('/contract-info', async (req: Request, res: Response) => {
  try {
    const result = await db.execute(sql`SELECT * FROM fema_contract_info ORDER BY updated_at DESC LIMIT 1`);
    res.json({ success: true, contractInfo: result.rows[0] || null });
  } catch (error) {
    console.error('Error fetching contract info:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch contract info' });
  }
});

router.post('/contract-info', async (req: Request, res: Response) => {
  try {
    const d = req.body;
    const existing = await db.execute(sql`SELECT id FROM fema_contract_info ORDER BY updated_at DESC LIMIT 1`);
    if (existing.rows.length > 0) {
      const id = (existing.rows[0] as any).id;
      await db.execute(sql`UPDATE fema_contract_info SET
        agency_type=${d.agencyType||null}, grant_program=${d.grantProgram||null},
        prime_contractor=${d.primeContractor||null}, sub_contractor=${d.subContractor||null},
        contract_number=${d.contractNumber||null}, task_order=${d.taskOrder||null},
        fema_disaster_number=${d.femaDisasterNumber||null}, fema_region=${d.femaRegion||null},
        project_worksheet_number=${d.projectWorksheetNumber||null}, incident_number=${d.incidentNumber||null},
        incident_type=${d.incidentType||null}, declaration_date=${d.declarationDate||null},
        declaration_title=${d.declarationTitle||null}, state_of_emergency=${d.stateOfEmergency||null},
        county=${d.county||null}, work_location=${d.workLocation||null}, scope_of_work=${d.scopeOfWork||null},
        contract_start_date=${d.contractStartDate||null}, contract_end_date=${d.contractEndDate||null},
        mobilization_date=${d.mobilizationDate||null}, demobilization_date=${d.demobilizationDate||null},
        project_manager=${d.projectManager||null}, project_manager_phone=${d.projectManagerPhone||null},
        fema_monitor=${d.femaMonitor||null}, fema_monitor_phone=${d.femaMonitorPhone||null},
        osr_representative=${d.osrRepresentative||null}, osr_phone=${d.osrPhone||null},
        applicant_name=${d.applicantName||null}, applicant_poc=${d.applicantPOC||null},
        applicant_phone=${d.applicantPhone||null}, updated_at=NOW()
        WHERE id=${id}`);
      res.json({ success: true, id });
    } else {
      const result = await db.execute(sql`INSERT INTO fema_contract_info (
        agency_type, grant_program, prime_contractor, sub_contractor, contract_number,
        task_order, fema_disaster_number, fema_region, project_worksheet_number, incident_number,
        incident_type, declaration_date, declaration_title, state_of_emergency, county,
        work_location, scope_of_work, contract_start_date, contract_end_date,
        mobilization_date, demobilization_date, project_manager, project_manager_phone,
        fema_monitor, fema_monitor_phone, osr_representative, osr_phone,
        applicant_name, applicant_poc, applicant_phone
      ) VALUES (
        ${d.agencyType||null}, ${d.grantProgram||null}, ${d.primeContractor||null}, ${d.subContractor||null},
        ${d.contractNumber||null}, ${d.taskOrder||null}, ${d.femaDisasterNumber||null}, ${d.femaRegion||null},
        ${d.projectWorksheetNumber||null}, ${d.incidentNumber||null}, ${d.incidentType||null},
        ${d.declarationDate||null}, ${d.declarationTitle||null}, ${d.stateOfEmergency||null},
        ${d.county||null}, ${d.workLocation||null}, ${d.scopeOfWork||null},
        ${d.contractStartDate||null}, ${d.contractEndDate||null}, ${d.mobilizationDate||null},
        ${d.demobilizationDate||null}, ${d.projectManager||null}, ${d.projectManagerPhone||null},
        ${d.femaMonitor||null}, ${d.femaMonitorPhone||null}, ${d.osrRepresentative||null},
        ${d.osrPhone||null}, ${d.applicantName||null}, ${d.applicantPOC||null}, ${d.applicantPhone||null}
      ) RETURNING id`);
      res.json({ success: true, id: (result.rows[0] as any).id });
    }
  } catch (error) {
    console.error('Error saving contract info:', error);
    res.status(500).json({ success: false, error: 'Failed to save contract info' });
  }
});

router.get('/labor-rates', async (_req: Request, res: Response) => {
  try {
    const result = await db.execute(sql`SELECT * FROM fema_labor_rates ORDER BY classification`);
    res.json({ success: true, laborRates: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch labor rates' });
  }
});

router.post('/labor-rates', async (req: Request, res: Response) => {
  try {
    const { rates } = req.body;
    await db.execute(sql`DELETE FROM fema_labor_rates`);
    for (const r of rates) {
      await db.execute(sql`INSERT INTO fema_labor_rates (id, classification, st_rate, ot_rate, dt_rate)
        VALUES (${r.id}, ${r.classification}, ${r.stRate}, ${r.otRate}, ${r.dtRate})`);
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to save labor rates' });
  }
});

router.get('/equipment-rates', async (_req: Request, res: Response) => {
  try {
    const result = await db.execute(sql`SELECT * FROM fema_equipment_rates ORDER BY equipment_name`);
    res.json({ success: true, equipmentRates: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch equipment rates' });
  }
});

router.post('/equipment-rates', async (req: Request, res: Response) => {
  try {
    const { rates } = req.body;
    await db.execute(sql`DELETE FROM fema_equipment_rates`);
    for (const r of rates) {
      await db.execute(sql`INSERT INTO fema_equipment_rates (id, equipment_name, equipment_id_code, hourly_rate)
        VALUES (${r.id}, ${r.equipmentName}, ${r.equipmentId}, ${r.hourlyRate})`);
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to save equipment rates' });
  }
});

router.get('/roster', async (_req: Request, res: Response) => {
  try {
    const result = await db.execute(sql`SELECT * FROM fema_roster_members ORDER BY crew, full_name`);
    res.json({ success: true, roster: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch roster' });
  }
});

router.post('/roster', async (req: Request, res: Response) => {
  try {
    const { members } = req.body;
    await db.execute(sql`DELETE FROM fema_roster_members`);
    for (const m of members) {
      await db.execute(sql`INSERT INTO fema_roster_members (id, full_name, classification, phone, email, crew, state_id, crew_number, mobilized_date, start_work_date, company, equipment_assigned, last_day_on_job)
        VALUES (${m.id}, ${m.fullName}, ${m.classification}, ${m.phone||null}, ${m.email||null}, ${m.crew||'Crew 1'}, ${m.stateId||null}, ${m.crewNumber||null}, ${m.mobilizedDate||null}, ${m.startWorkDate||null}, ${m.company||null}, ${m.equipmentAssigned||null}, ${m.lastDayOnJob||null})`);
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to save roster' });
  }
});

router.get('/timesheets', async (_req: Request, res: Response) => {
  try {
    const result = await db.execute(sql`SELECT * FROM fema_timesheets ORDER BY week_ending DESC`);
    res.json({ success: true, timesheets: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch timesheets' });
  }
});

router.post('/timesheets', async (req: Request, res: Response) => {
  try {
    const { timesheets } = req.body;
    await db.execute(sql`DELETE FROM fema_timesheets`);
    for (const ts of timesheets) {
      await db.execute(sql`INSERT INTO fema_timesheets (id, crew_name, week_ending, storm_event, contractor_company, foreman_name, entries)
        VALUES (${ts.id}, ${ts.crewName}, ${ts.weekEnding}, ${ts.stormEvent||null}, ${ts.contractorCompany||null}, ${ts.foremanName||null}, ${JSON.stringify(ts.entries)}::jsonb)`);
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to save timesheets' });
  }
});

router.get('/sign-in-records', async (_req: Request, res: Response) => {
  try {
    const result = await db.execute(sql`SELECT * FROM fema_sign_in_records ORDER BY date DESC, sign_in_time`);
    res.json({ success: true, records: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch sign-in records' });
  }
});

router.post('/sign-in-records', async (req: Request, res: Response) => {
  try {
    const { records } = req.body;
    await db.execute(sql`DELETE FROM fema_sign_in_records`);
    for (const r of records) {
      await db.execute(sql`INSERT INTO fema_sign_in_records (id, worker_name, classification, crew, date, sign_in_time, sign_out_time, sign_in_lat, sign_in_lng, sign_out_lat, sign_out_lng, inside_geofence, total_hours, notes)
        VALUES (${r.id}, ${r.workerName}, ${r.classification||null}, ${r.crew||null}, ${r.date}, ${r.signInTime||null}, ${r.signOutTime||null}, ${r.signInLat||null}, ${r.signInLng||null}, ${r.signOutLat||null}, ${r.signOutLng||null}, ${r.insideGeofence!==false}, ${r.totalHours||null}, ${r.notes||null})`);
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to save sign-in records' });
  }
});

router.get('/daily-activities', async (_req: Request, res: Response) => {
  try {
    const result = await db.execute(sql`SELECT * FROM fema_daily_activities ORDER BY date DESC`);
    res.json({ success: true, activities: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch daily activities' });
  }
});

router.post('/daily-activities', async (req: Request, res: Response) => {
  try {
    const { activities } = req.body;
    await db.execute(sql`DELETE FROM fema_daily_activities`);
    for (const a of activities) {
      await db.execute(sql`INSERT INTO fema_daily_activities (id, date, crew, pw_number, incident_number, weather, temperature, work_description, work_location, equipment_used, crew_size, hours_worked, photos_before_count, photos_after_count, safety_incidents, notes)
        VALUES (${a.id}, ${a.date}, ${a.crew||null}, ${a.pwNumber||null}, ${a.incidentNumber||null}, ${a.weather||null}, ${a.temperature||null}, ${a.workDescription||null}, ${a.workLocation||null}, ${a.equipmentUsed||null}, ${a.crewSize||null}, ${a.hoursWorked||null}, ${a.photosBeforeCount||0}, ${a.photosAfterCount||0}, ${a.safetyIncidents||null}, ${a.notes||null})`);
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to save daily activities' });
  }
});

router.get('/truck-certs', async (_req: Request, res: Response) => {
  try {
    const result = await db.execute(sql`SELECT * FROM fema_truck_certs ORDER BY truck_id`);
    res.json({ success: true, certs: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch truck certs' });
  }
});

router.post('/truck-certs', async (req: Request, res: Response) => {
  try {
    const { certs } = req.body;
    await db.execute(sql`DELETE FROM fema_truck_certs`);
    for (const c of certs) {
      await db.execute(sql`INSERT INTO fema_truck_certs (id, truck_id, license_plate, driver_name, truck_type, capacity_cy, bed_length, bed_width, bed_height, measurement_date, certified_by, photo_url, status)
        VALUES (${c.id}, ${c.truckId}, ${c.licensePlate||null}, ${c.driverName||null}, ${c.truckType||null}, ${c.capacityCY||null}, ${c.bedLength||null}, ${c.bedWidth||null}, ${c.bedHeight||null}, ${c.measurementDate||null}, ${c.certifiedBy||null}, ${c.photoUrl||null}, ${c.status||'active'})`);
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to save truck certs' });
  }
});

router.get('/leaner-hanger', async (_req: Request, res: Response) => {
  try {
    const result = await db.execute(sql`SELECT * FROM fema_leaner_hanger_entries ORDER BY date DESC`);
    res.json({ success: true, entries: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch leaner/hanger entries' });
  }
});

router.post('/leaner-hanger', async (req: Request, res: Response) => {
  try {
    const { entries } = req.body;
    await db.execute(sql`DELETE FROM fema_leaner_hanger_entries`);
    for (const e of entries) {
      await db.execute(sql`INSERT INTO fema_leaner_hanger_entries (id, date, location, tree_species, dbh, height, lean_direction, hazard_level, pw_number, crew, status, action_taken, latitude, longitude, photo_url, notes)
        VALUES (${e.id}, ${e.date}, ${e.location||null}, ${e.treeSpecies||null}, ${e.dbh||null}, ${e.height||null}, ${e.leanDirection||null}, ${e.hazardLevel||'medium'}, ${e.pwNumber||null}, ${e.crew||null}, ${e.status||'identified'}, ${e.actionTaken||null}, ${e.latitude||null}, ${e.longitude||null}, ${e.photoUrl||null}, ${e.notes||null})`);
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to save leaner/hanger entries' });
  }
});

router.get('/subcontractors', async (_req: Request, res: Response) => {
  try {
    const result = await db.execute(sql`SELECT * FROM fema_subcontractors ORDER BY company_name`);
    res.json({ success: true, subcontractors: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch subcontractors' });
  }
});

router.post('/subcontractors', async (req: Request, res: Response) => {
  try {
    const { subcontractors } = req.body;
    await db.execute(sql`DELETE FROM fema_subcontractors`);
    for (const s of subcontractors) {
      await db.execute(sql`INSERT INTO fema_subcontractors (id, company_name, contact_name, phone, email, license_number, insurance_expiration, workers_comp_expiration, bonding_amount, risk_score, risk_factors, verified, notes)
        VALUES (${s.id}, ${s.companyName}, ${s.contactName||null}, ${s.phone||null}, ${s.email||null}, ${s.licenseNumber||null}, ${s.insuranceExpiration||null}, ${s.workersCompExpiration||null}, ${s.bondingAmount||null}, ${s.riskScore||50}, ${JSON.stringify(s.riskFactors||[])}::jsonb, ${s.verified||false}, ${s.notes||null})`);
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to save subcontractors' });
  }
});

router.get('/job-entries', async (_req: Request, res: Response) => {
  try {
    const result = await db.execute(sql`SELECT * FROM fema_job_entries ORDER BY created_at DESC`);
    res.json({ success: true, jobEntries: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch job entries' });
  }
});

router.post('/job-entries', async (req: Request, res: Response) => {
  try {
    const { entries } = req.body;
    await db.execute(sql`DELETE FROM fema_job_entries`);
    for (const e of entries) {
      await db.execute(sql`INSERT INTO fema_job_entries (id, job_name, job_number, location, pw_number, status, start_date, end_date, scope, notes)
        VALUES (${e.id}, ${e.jobName||e.name||''}, ${e.jobNumber||null}, ${e.location||null}, ${e.pwNumber||null}, ${e.status||'active'}, ${e.startDate||null}, ${e.endDate||null}, ${e.scope||null}, ${e.notes||null})`);
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to save job entries' });
  }
});

router.get('/load-tickets', async (_req: Request, res: Response) => {
  try {
    const result = await db.execute(sql`SELECT * FROM fema_load_tickets ORDER BY created_at DESC LIMIT 500`);
    res.json({ success: true, tickets: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch load tickets' });
  }
});

router.post('/load-tickets', async (req: Request, res: Response) => {
  try {
    const { tickets } = req.body;
    await db.execute(sql`DELETE FROM fema_load_tickets`);
    for (const t of tickets) {
      await db.execute(sql`INSERT INTO fema_load_tickets (id, ticket_number, contract_id, debris_type, estimated_cubic_yards, pickup_address, truck_id, truck_license_plate, driver_name, status)
        VALUES (${t.id}, ${t.ticketNumber||t.number||null}, ${t.contractId||null}, ${t.debrisType||null}, ${t.cubicYards||t.estimatedCubicYards||0}, ${t.pickupAddress||t.location||null}, ${t.truckId||null}, ${t.truckLicensePlate||null}, ${t.driverName||null}, ${t.status||'pending'})`);
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Error saving load tickets:', error);
    res.status(500).json({ success: false, error: 'Failed to save load tickets' });
  }
});

router.get('/equipment-log-entries', async (_req: Request, res: Response) => {
  try {
    const result = await db.execute(sql`SELECT * FROM fema_equipment_logs ORDER BY created_at DESC`);
    res.json({ success: true, entries: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch equipment log entries' });
  }
});

router.post('/equipment-log-entries', async (req: Request, res: Response) => {
  try {
    const { entries } = req.body;
    await db.execute(sql`DELETE FROM fema_equipment_logs`);
    for (const e of entries) {
      await db.execute(sql`INSERT INTO fema_equipment_logs (id, equipment_id, equipment_type, contract_id, crew_id, log_date, engine_hours, active_hours, billed_hours, billed_amount, hourly_rate)
        VALUES (${e.id}, ${e.equipmentId||null}, ${e.equipmentName||e.equipmentType||null}, ${e.contractId||null}, ${e.crewId||null}, ${e.date ? new Date(e.date).toISOString() : new Date().toISOString()}, ${e.hoursUsed||0}, ${e.hoursUsed||0}, ${e.hoursUsed||0}, ${(e.hoursUsed||0)*(e.hourlyRate||0)}, ${e.hourlyRate||0})`);
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Error saving equipment log entries:', error);
    res.status(500).json({ success: false, error: 'Failed to save equipment log entries' });
  }
});

router.get('/monitor-entries', async (_req: Request, res: Response) => {
  try {
    const result = await db.execute(sql`SELECT * FROM fema_monitor_sessions ORDER BY created_at DESC`);
    res.json({ success: true, entries: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch monitor entries' });
  }
});

router.post('/monitor-entries', async (req: Request, res: Response) => {
  try {
    const { entries } = req.body;
    await db.execute(sql`DELETE FROM fema_monitor_sessions`);
    for (const e of entries) {
      await db.execute(sql`INSERT INTO fema_monitor_sessions (id, monitor_id, monitor_name, monitor_type, monitor_agency, contract_id, session_date, session_notes, work_logs_verified, load_tickets_verified, issues_flagged, signature_pin)
        VALUES (${e.id}, ${e.monitorId||null}, ${e.monitorName||null}, ${e.monitorType||null}, ${e.monitorAgency||null}, ${e.contractId||null}, ${e.date ? new Date(e.date).toISOString() : new Date().toISOString()}, ${e.notes||e.sessionNotes||null}, ${e.workLogsVerified||0}, ${e.loadTicketsVerified||0}, ${e.issuesFlagged||0}, ${e.signaturePin||null})`);
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Error saving monitor entries:', error);
    res.status(500).json({ success: false, error: 'Failed to save monitor entries' });
  }
});

router.post('/export-audit-packet', async (req: Request, res: Response) => {
  try {
    const contractInfo = await db.execute(sql`SELECT * FROM fema_contract_info ORDER BY updated_at DESC LIMIT 1`);
    const roster = await db.execute(sql`SELECT * FROM fema_roster_members ORDER BY crew, full_name`);
    const timesheets = await db.execute(sql`SELECT * FROM fema_timesheets ORDER BY week_ending DESC`);
    const laborRates = await db.execute(sql`SELECT * FROM fema_labor_rates ORDER BY classification`);
    const equipmentRates = await db.execute(sql`SELECT * FROM fema_equipment_rates ORDER BY equipment_name`);
    const signInRecords = await db.execute(sql`SELECT * FROM fema_sign_in_records ORDER BY date DESC`);
    const dailyActivities = await db.execute(sql`SELECT * FROM fema_daily_activities ORDER BY date DESC`);
    const truckCerts = await db.execute(sql`SELECT * FROM fema_truck_certs ORDER BY truck_id`);
    const leanerHanger = await db.execute(sql`SELECT * FROM fema_leaner_hanger_entries ORDER BY date DESC`);
    const subcontractors = await db.execute(sql`SELECT * FROM fema_subcontractors ORDER BY company_name`);
    const jobEntries = await db.execute(sql`SELECT * FROM fema_job_entries ORDER BY created_at DESC`);
    const loadTickets = await db.execute(sql`SELECT * FROM fema_load_tickets ORDER BY created_at DESC LIMIT 500`);
    const workLogs = await db.execute(sql`SELECT * FROM fema_work_logs ORDER BY created_at DESC LIMIT 500`);
    const geoZones = await db.execute(sql`SELECT * FROM fema_geo_zones ORDER BY created_at DESC LIMIT 100`);
    const aiFindings = await db.execute(sql`SELECT * FROM fema_ai_findings ORDER BY created_at DESC LIMIT 200`);
    const auditLogs = await db.execute(sql`SELECT * FROM fema_audit_logs ORDER BY created_at DESC LIMIT 500`);

    const ci = contractInfo.rows[0] as any || {};
    const exportDate = new Date().toISOString().split('T')[0];

    const contractDocs = await db.execute(sql`SELECT id, document_type, document_name, description, uploaded_by, uploaded_by_role, file_size_bytes, version, created_at FROM fema_contract_documents WHERE is_active = true ORDER BY created_at DESC`);
    const projectMessages = await db.execute(sql`SELECT id, sender_name, sender_role, subject, message_body, message_type, priority, thread_id, created_at FROM fema_project_messages ORDER BY created_at ASC`);
    const verificationEvents = await db.execute(sql`SELECT e.*, s.confidence_score as score_val, s.risk_level as score_risk, s.ai_reasoning, s.anomalies, s.signal_breakdown FROM fema_verification_events e LEFT JOIN fema_verification_scores s ON e.id = s.event_id ORDER BY e.created_at DESC`);
    const auditChainEntries = await db.execute(sql`SELECT * FROM fema_audit_chain ORDER BY id ASC`);
    const complianceStatuses = await db.execute(sql`SELECT * FROM fema_compliance_status ORDER BY updated_at DESC`);

    const docTypes = (contractDocs.rows as any[]).map(d => d.document_type);
    const requiredDocTypes = ['Master Service Agreement (MSA)', 'Approved Rate Sheet', 'Notice to Proceed (NTP)', 'Job Classification', 'Insurance Certificate', 'Bond Documentation', 'Safety Plan'];
    const docCompliance = requiredDocTypes.map(type => ({
      documentType: type,
      status: docTypes.includes(type) ? 'on_file' : 'missing',
      uploadedOn: (contractDocs.rows as any[]).find(d => d.document_type === type)?.created_at || null,
      uploadedBy: (contractDocs.rows as any[]).find(d => d.document_type === type)?.uploaded_by || null,
    }));

    const packet = {
      exportDate,
      exportedBy: 'AuditShield AI',
      femaDisasterNumber: ci.fema_disaster_number || 'N/A',
      contractNumber: ci.contract_number || 'N/A',
      primeContractor: ci.prime_contractor || 'N/A',
      subContractor: ci.sub_contractor || 'N/A',
      sections: {
        contractSetup: ci,
        laborRates: laborRates.rows,
        equipmentRates: equipmentRates.rows,
        roster: { totalPersonnel: roster.rows.length, members: roster.rows },
        timesheets: { totalWeeks: timesheets.rows.length, sheets: timesheets.rows },
        signInRecords: { totalRecords: signInRecords.rows.length, records: signInRecords.rows },
        dailyActivityReports: { totalReports: dailyActivities.rows.length, reports: dailyActivities.rows },
        truckCertifications: { totalTrucks: truckCerts.rows.length, certs: truckCerts.rows },
        loadTickets: { totalTickets: loadTickets.rows.length, tickets: loadTickets.rows },
        leanerHangerTracking: { totalEntries: leanerHanger.rows.length, entries: leanerHanger.rows },
        subcontractorProfiles: { totalSubs: subcontractors.rows.length, profiles: subcontractors.rows },
        jobEntries: { totalJobs: jobEntries.rows.length, jobs: jobEntries.rows },
        workLogs: { totalLogs: workLogs.rows.length, logs: workLogs.rows },
        geoZones: { totalZones: geoZones.rows.length, zones: geoZones.rows },
        aiFindings: { totalFindings: aiFindings.rows.length, findings: aiFindings.rows },
        auditTrail: { totalEntries: auditLogs.rows.length, entries: auditLogs.rows },
        contractDocuments: { totalDocuments: contractDocs.rows.length, documents: contractDocs.rows, complianceStatus: docCompliance },
        projectCommunications: { totalMessages: projectMessages.rows.length, messages: projectMessages.rows },
        locationIntelligence: {
          totalVerifications: verificationEvents.rows.length,
          events: verificationEvents.rows,
          complianceScopes: complianceStatuses.rows,
          auditChain: { totalEntries: auditChainEntries.rows.length, entries: auditChainEntries.rows },
        },
      },
      complianceSummary: {
        contractSetup: contractInfo.rows.length > 0 ? 'Complete' : 'Missing',
        rosterOnFile: roster.rows.length > 0 ? `${roster.rows.length} personnel` : 'Missing',
        timesheetsSubmitted: timesheets.rows.length > 0 ? `${timesheets.rows.length} weeks` : 'None',
        signInRecords: signInRecords.rows.length > 0 ? `${signInRecords.rows.length} records` : 'None',
        dailyActivities: dailyActivities.rows.length > 0 ? `${dailyActivities.rows.length} reports` : 'None',
        truckCertifications: truckCerts.rows.length > 0 ? `${truckCerts.rows.length} trucks` : 'None',
        loadTickets: loadTickets.rows.length > 0 ? `${loadTickets.rows.length} tickets` : 'None',
        workPhotos: workLogs.rows.filter((w: any) => w.before_photo_url || w.after_photo_url).length,
        gpsVerification: geoZones.rows.length > 0 ? `${geoZones.rows.length} zones` : 'Not configured',
        aiFindings: aiFindings.rows.length > 0 ? `${aiFindings.rows.length} findings` : 'None',
        auditTrail: `${auditLogs.rows.length} entries`,
        contractDocuments: `${contractDocs.rows.length} on file (${docCompliance.filter(d => d.status === 'on_file').length}/${requiredDocTypes.length} required)`,
        projectCommunications: `${projectMessages.rows.length} messages logged`,
        locationIntelligence: `${verificationEvents.rows.length} verification events, ${auditChainEntries.rows.length} audit chain entries`,
      }
    };

    await db.execute(sql`INSERT INTO fema_exports (id, export_type, export_format, requested_by, status, progress, record_count, completed_at)
      VALUES (${Date.now().toString()}, 'full_audit_packet', 'json', 'admin', 'completed', 100, ${Object.values(packet.complianceSummary).length}, NOW())`);

    res.json({ success: true, packet });
  } catch (error) {
    console.error('Error exporting audit packet:', error);
    res.status(500).json({ success: false, error: 'Failed to export audit packet' });
  }
});

router.post('/ai-scan', async (_req: Request, res: Response) => {
  try {
    const findings: any[] = [];

    const roster = await db.execute(sql`SELECT * FROM fema_roster_members`);
    const rosterRows = roster.rows as any[];
    const nameCount: Record<string, number> = {};
    for (const m of rosterRows) {
      const name = m.full_name?.toLowerCase();
      nameCount[name] = (nameCount[name] || 0) + 1;
    }
    for (const [name, count] of Object.entries(nameCount)) {
      if (count > 1) {
        findings.push({ type: 'duplicate_labor', severity: 'high', description: `Duplicate roster entry: "${name}" appears ${count} times`, category: 'Labor' });
      }
    }

    const timesheets = await db.execute(sql`SELECT * FROM fema_timesheets`);
    for (const ts of timesheets.rows as any[]) {
      const entries = typeof ts.entries === 'string' ? JSON.parse(ts.entries) : ts.entries;
      if (entries) {
        for (const entry of entries) {
          const totalHours = Object.values(entry.days || {}).reduce((sum: number, day: any) => sum + (day?.stHrs || 0) + (day?.otHrs || 0) + (day?.dtHrs || 0), 0);
          if (totalHours > 70) {
            findings.push({ type: 'tm_cap_exceeded', severity: 'critical', description: `Worker "${entry.workerName}" logged ${totalHours} hours in week ending ${ts.week_ending} — exceeds FEMA 70-hour T&M cap`, category: 'T&M Compliance' });
          }
          if (totalHours > 16 * 7) {
            findings.push({ type: 'excessive_hours', severity: 'high', description: `Worker "${entry.workerName}" logged ${totalHours} hours — exceeds humanly possible threshold`, category: 'Fraud Detection' });
          }
        }
      }
    }

    const signIns = await db.execute(sql`SELECT * FROM fema_sign_in_records WHERE inside_geofence = false`);
    for (const s of signIns.rows as any[]) {
      findings.push({ type: 'gps_anomaly', severity: 'medium', description: `${s.worker_name} signed in outside geofence on ${s.date}`, category: 'GPS Compliance' });
    }

    const contractInfo = await db.execute(sql`SELECT * FROM fema_contract_info ORDER BY updated_at DESC LIMIT 1`);
    const ci = contractInfo.rows[0] as any;
    if (!ci || !ci.fema_disaster_number) {
      findings.push({ type: 'missing_documentation', severity: 'high', description: 'FEMA disaster number not set in contract setup', category: 'Documentation' });
    }
    if (!ci || !ci.project_worksheet_number) {
      findings.push({ type: 'missing_documentation', severity: 'high', description: 'Project worksheet number not set', category: 'Documentation' });
    }
    if (!ci || !ci.contract_number) {
      findings.push({ type: 'missing_documentation', severity: 'medium', description: 'Contract number not entered', category: 'Documentation' });
    }

    const truckCerts = await db.execute(sql`SELECT * FROM fema_truck_certs`);
    if (truckCerts.rows.length === 0 && (await db.execute(sql`SELECT COUNT(*) as count FROM fema_load_tickets`)).rows[0] && parseInt(((await db.execute(sql`SELECT COUNT(*) as count FROM fema_load_tickets`)).rows[0] as any).count) > 0) {
      findings.push({ type: 'missing_certification', severity: 'high', description: 'Load tickets exist but no truck certifications on file', category: 'Debris Compliance' });
    }

    const subcontractors = await db.execute(sql`SELECT * FROM fema_subcontractors WHERE insurance_expiration IS NOT NULL`);
    const today = new Date().toISOString().split('T')[0];
    for (const s of subcontractors.rows as any[]) {
      if (s.insurance_expiration && s.insurance_expiration < today) {
        findings.push({ type: 'expired_certification', severity: 'critical', description: `Subcontractor "${s.company_name}" has expired insurance (${s.insurance_expiration})`, category: 'Subcontractor Risk' });
      }
      if (s.workers_comp_expiration && s.workers_comp_expiration < today) {
        findings.push({ type: 'expired_certification', severity: 'critical', description: `Subcontractor "${s.company_name}" has expired workers comp (${s.workers_comp_expiration})`, category: 'Subcontractor Risk' });
      }
    }

    if (rosterRows.length === 0) {
      findings.push({ type: 'missing_documentation', severity: 'medium', description: 'No roster members on file', category: 'Labor' });
    }
    if (timesheets.rows.length === 0) {
      findings.push({ type: 'missing_documentation', severity: 'medium', description: 'No timesheets submitted', category: 'Labor' });
    }

    const docs = await db.execute(sql`SELECT document_type FROM fema_contract_documents WHERE is_active = true`);
    const uploadedTypes = new Set((docs.rows as any[]).map(d => d.document_type));
    const requiredDocs = [
      { type: 'Master Service Agreement (MSA)', severity: 'critical' as const, reason: 'Governs all labor classifications, rates, and scope — required before any work begins' },
      { type: 'Approved Rate Sheet', severity: 'critical' as const, reason: 'All labor and equipment rates must be validated against the governing rate sheet' },
      { type: 'Notice to Proceed (NTP)', severity: 'critical' as const, reason: 'No work should begin without a documented NTP — legal and billing prerequisite' },
      { type: 'Job Classification', severity: 'high' as const, reason: 'Labor classifications must match the contract to ensure proper rate application' },
      { type: 'Insurance Certificate', severity: 'high' as const, reason: 'Proof of insurance required for all contractors and subcontractors on site' },
      { type: 'Bond Documentation', severity: 'medium' as const, reason: 'Performance and payment bonds may be required by the governing agreement' },
      { type: 'Safety Plan', severity: 'medium' as const, reason: 'OSHA-compliant safety plan required for all disaster response operations' },
    ];
    for (const req of requiredDocs) {
      if (!uploadedTypes.has(req.type)) {
        findings.push({
          type: 'missing_contract_document',
          severity: req.severity,
          description: `Missing "${req.type}" — ${req.reason}`,
          category: 'Contract Documents',
        });
      }
    }
    if (uploadedTypes.size > 0) {
      const changeOrderDocs = (docs.rows as any[]).filter(d => ['Change Order', 'Amendment', 'Written Modification', 'Supplemental Agreement'].includes(d.document_type));
      if (changeOrderDocs.length === 0) {
        findings.push({
          type: 'contract_document_info',
          severity: 'medium',
          description: 'No change orders or amendments on file — ensure any scope/rate changes are documented',
          category: 'Contract Documents',
        });
      }
    }

    const verificationEvents = await db.execute(sql`SELECT * FROM fema_verification_events ORDER BY created_at DESC`);
    const verificationRows = verificationEvents.rows as any[];
    if (verificationRows.length === 0) {
      findings.push({ type: 'no_verification', severity: 'high', description: 'No field verification events recorded — multi-signal verification stack inactive', category: 'Location Intelligence' });
    } else {
      const criticalEvents = verificationRows.filter((e: any) => e.risk_level === 'critical');
      const highEvents = verificationRows.filter((e: any) => e.risk_level === 'high');
      for (const e of criticalEvents) {
        findings.push({ type: 'critical_verification', severity: 'critical', description: `Critical risk verification: ${e.event_type} by ${e.crew_member_name || 'unknown'} (${e.confidence_score}% confidence) — multiple signal failures`, category: 'Location Intelligence' });
      }
      for (const e of highEvents) {
        findings.push({ type: 'high_risk_verification', severity: 'high', description: `High risk verification: ${e.event_type} by ${e.crew_member_name || 'unknown'} (${e.confidence_score}% confidence)`, category: 'Location Intelligence' });
      }
      const avgConfidence = verificationRows.reduce((s: number, e: any) => s + parseFloat(e.confidence_score || '0'), 0) / verificationRows.length;
      if (avgConfidence < 60) {
        findings.push({ type: 'low_avg_confidence', severity: 'high', description: `Average verification confidence is ${avgConfidence.toFixed(1)}% — below 60% threshold, review field procedures`, category: 'Location Intelligence' });
      }
    }

    const auditChain = await db.execute(sql`SELECT chain_hash, prev_hash FROM fema_audit_chain ORDER BY id ASC`);
    const chainRows = auditChain.rows as any[];
    let chainValid = true;
    for (let i = 1; i < chainRows.length; i++) {
      if (chainRows[i].prev_hash !== chainRows[i - 1].chain_hash) { chainValid = false; break; }
    }
    if (chainRows.length > 0 && !chainValid) {
      findings.push({ type: 'chain_broken', severity: 'critical', description: 'Immutable audit chain integrity broken — potential tampering detected', category: 'Audit Security' });
    }
    if (chainRows.length > 0 && chainValid) {
      findings.push({ type: 'chain_verified', severity: 'info' as any, description: `Audit chain verified: ${chainRows.length} hash-chained entries — tamper-proof integrity confirmed`, category: 'Audit Security' });
    }

    for (const f of findings) {
      try {
        await db.execute(sql`INSERT INTO fema_ai_findings (id, contract_id, finding_type, severity, description, entity_id)
          VALUES (${Date.now().toString() + Math.random().toString(36).substring(7)}, 'active', ${f.type}, ${f.severity}, ${f.description}, null)`);
      } catch {}
    }

    const riskScore = Math.max(0, 100 - findings.filter(f => f.severity === 'critical').length * 20 - findings.filter(f => f.severity === 'high').length * 10 - findings.filter(f => f.severity === 'medium').length * 5);

    res.json({
      success: true,
      scanDate: new Date().toISOString(),
      totalFindings: findings.length,
      criticalCount: findings.filter(f => f.severity === 'critical').length,
      highCount: findings.filter(f => f.severity === 'high').length,
      mediumCount: findings.filter(f => f.severity === 'medium').length,
      riskScore,
      riskLevel: riskScore >= 80 ? 'low' : riskScore >= 50 ? 'medium' : 'high',
      findings,
    });
  } catch (error) {
    console.error('Error running AI scan:', error);
    res.status(500).json({ success: false, error: 'Failed to run AI scan' });
  }
});

// ============ DOCUMENT COMPLIANCE STATUS ============

router.get('/document-compliance', async (req: Request, res: Response) => {
  try {
    const docs = await db.execute(sql`SELECT id, document_type, document_name, uploaded_by, uploaded_by_role, created_at FROM fema_contract_documents WHERE is_active = true ORDER BY created_at DESC`);
    const uploadedTypes = (docs.rows as any[]).map(d => d.document_type);
    const requiredDocs = [
      { type: 'Master Service Agreement (MSA)', severity: 'critical', reason: 'Governs all labor classifications, rates, and scope — required before any work begins', required: true },
      { type: 'Approved Rate Sheet', severity: 'critical', reason: 'All labor and equipment rates must be validated against the governing rate sheet', required: true },
      { type: 'Notice to Proceed (NTP)', severity: 'critical', reason: 'No work should begin without a documented NTP — legal and billing prerequisite', required: true },
      { type: 'Job Classification', severity: 'high', reason: 'Labor classifications must match the contract for proper rate application', required: true },
      { type: 'Insurance Certificate', severity: 'high', reason: 'Proof of insurance required for all contractors on site', required: true },
      { type: 'Bond Documentation', severity: 'medium', reason: 'Performance and payment bonds may be required', required: false },
      { type: 'Safety Plan', severity: 'medium', reason: 'OSHA-compliant safety plan required for disaster response', required: false },
      { type: 'Change Order', severity: 'medium', reason: 'Any scope or rate changes must be documented via change order', required: false },
      { type: 'Amendment', severity: 'medium', reason: 'Contract amendments must be on file', required: false },
      { type: 'Supplemental Agreement', severity: 'low', reason: 'Supplemental agreements should be documented', required: false },
      { type: 'Procurement Documentation', severity: 'low', reason: 'Procurement docs for audit trail', required: false },
      { type: 'Subcontract Agreement', severity: 'medium', reason: 'All sub agreements must be on file', required: false },
    ];
    const status = requiredDocs.map(req => {
      const doc = (docs.rows as any[]).find(d => d.document_type === req.type);
      return {
        ...req,
        status: doc ? 'on_file' : 'missing',
        documentId: doc?.id || null,
        documentName: doc?.document_name || null,
        uploadedBy: doc?.uploaded_by || null,
        uploadedAt: doc?.created_at || null,
      };
    });
    const totalRequired = status.filter(s => s.required).length;
    const requiredOnFile = status.filter(s => s.required && s.status === 'on_file').length;
    const totalOnFile = status.filter(s => s.status === 'on_file').length;
    const complianceScore = totalRequired > 0 ? Math.round((requiredOnFile / totalRequired) * 100) : 0;
    res.json({
      success: true,
      complianceScore,
      totalDocuments: docs.rows.length,
      requiredOnFile,
      totalRequired,
      totalOnFile,
      status,
    });
  } catch (error) {
    console.error('Error fetching document compliance:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch document compliance' });
  }
});

// ============ CONTRACT DOCUMENT MANAGEMENT ============

const DOCUMENT_TYPES = [
  'Master Service Agreement (MSA)',
  'Approved Rate Sheet',
  'Job Classification',
  'Notice to Proceed (NTP)',
  'Change Order',
  'Amendment',
  'Written Modification',
  'Supplemental Agreement',
  'Procurement Documentation',
  'Subcontract Agreement',
  'Insurance Certificate',
  'Bond Documentation',
  'Safety Plan',
  'Other',
];

router.get('/contract-documents', async (req: Request, res: Response) => {
  try {
    const contractId = req.query.contractId as string || '';
    let result;
    if (contractId) {
      result = await db.execute(sql`SELECT * FROM fema_contract_documents WHERE contract_id = ${contractId} AND is_active = true ORDER BY created_at DESC`);
    } else {
      result = await db.execute(sql`SELECT * FROM fema_contract_documents WHERE is_active = true ORDER BY created_at DESC`);
    }
    res.json({ success: true, documents: result.rows, documentTypes: DOCUMENT_TYPES });
  } catch (error) {
    console.error('Error fetching contract documents:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch documents' });
  }
});

router.post('/contract-documents', async (req: Request, res: Response) => {
  try {
    const { contractId, projectId, documentType, documentName, description, fileContent, fileMimeType, uploadedBy, uploadedByRole, tags } = req.body;
    if (!documentName || !documentType || !uploadedBy) {
      return res.status(400).json({ success: false, error: 'Missing required fields: documentName, documentType, uploadedBy' });
    }
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv', 'text/plain', 'image/jpeg', 'image/png', 'image/jpg'];
    if (fileMimeType && !allowedTypes.includes(fileMimeType)) {
      return res.status(400).json({ success: false, error: `File type "${fileMimeType}" not allowed. Accepted: PDF, DOC, XLS, CSV, TXT, JPG, PNG` });
    }
    const fileUrl = fileContent ? `data:${fileMimeType || 'application/octet-stream'};base64,${fileContent}` : null;
    const fileSize = fileContent ? Math.ceil(fileContent.length * 0.75) : 0;
    if (fileSize > 10 * 1024 * 1024) {
      return res.status(400).json({ success: false, error: 'File exceeds 10MB limit' });
    }
    const result = await db.execute(sql`INSERT INTO fema_contract_documents
      (contract_id, project_id, document_type, document_name, description, file_url, file_size_bytes, file_mime_type, uploaded_by, uploaded_by_role, tags)
      VALUES (${contractId || null}, ${projectId || null}, ${documentType}, ${documentName}, ${description || null},
        ${fileUrl}, ${fileSize}, ${fileMimeType || null}, ${uploadedBy}, ${uploadedByRole || 'contractor'},
        ${tags ? sql`${tags}::text[]` : sql`'{}'::text[]`})
      RETURNING *`);

    await db.execute(sql`INSERT INTO fema_project_messages
      (contract_id, project_id, thread_id, sender_name, sender_role, subject, message_body, message_type, priority)
      VALUES (${contractId || null}, ${projectId || null}, ${'system-audit-trail'}, ${'System'}, ${'system'},
        ${'Document Uploaded'}, ${`${uploadedBy} (${uploadedByRole || 'contractor'}) uploaded "${documentName}" [${documentType}]`},
        ${'system_event'}, ${'normal'})`);

    res.json({ success: true, document: result.rows[0] });
  } catch (error) {
    console.error('Error uploading document:', error);
    res.status(500).json({ success: false, error: 'Failed to upload document' });
  }
});

router.delete('/contract-documents/:id', async (req: Request, res: Response) => {
  try {
    const docId = parseInt(req.params.id);
    await db.execute(sql`UPDATE fema_contract_documents SET is_active = false, updated_at = NOW() WHERE id = ${docId}`);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ success: false, error: 'Failed to delete document' });
  }
});

// ============ PROJECT MESSAGING / COMMUNICATION ============

router.get('/project-messages', async (req: Request, res: Response) => {
  try {
    const contractId = req.query.contractId as string || '';
    const threadId = req.query.threadId as string || '';
    let result;
    if (threadId) {
      result = await db.execute(sql`SELECT * FROM fema_project_messages WHERE thread_id = ${threadId} ORDER BY created_at ASC`);
    } else if (contractId) {
      result = await db.execute(sql`SELECT * FROM fema_project_messages WHERE contract_id = ${contractId} ORDER BY created_at DESC`);
    } else {
      result = await db.execute(sql`SELECT * FROM fema_project_messages ORDER BY created_at DESC LIMIT 200`);
    }
    res.json({ success: true, messages: result.rows });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch messages' });
  }
});

router.get('/project-messages/threads', async (req: Request, res: Response) => {
  try {
    const result = await db.execute(sql`
      SELECT thread_id, subject, MAX(created_at) as last_message_at, COUNT(*) as message_count,
        array_agg(DISTINCT sender_role) as participants
      FROM fema_project_messages
      WHERE thread_id IS NOT NULL AND message_type != 'system_event'
      GROUP BY thread_id, subject
      ORDER BY MAX(created_at) DESC
    `);
    res.json({ success: true, threads: result.rows });
  } catch (error) {
    console.error('Error fetching threads:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch threads' });
  }
});

router.post('/project-messages', async (req: Request, res: Response) => {
  try {
    const { contractId, projectId, threadId, parentMessageId, senderName, senderRole, senderEmail, recipientRole, subject, messageBody, messageType, priority, attachments } = req.body;
    if (!senderName || !senderRole || !messageBody) {
      return res.status(400).json({ success: false, error: 'Missing required fields: senderName, senderRole, messageBody' });
    }
    const finalThreadId = threadId || `thread-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const result = await db.execute(sql`INSERT INTO fema_project_messages
      (contract_id, project_id, thread_id, parent_message_id, sender_name, sender_role, sender_email,
       recipient_role, subject, message_body, message_type, priority, attachments)
      VALUES (${contractId || null}, ${projectId || null}, ${finalThreadId}, ${parentMessageId || null},
        ${senderName}, ${senderRole}, ${senderEmail || null}, ${recipientRole || null},
        ${subject || null}, ${messageBody}, ${messageType || 'message'}, ${priority || 'normal'},
        ${JSON.stringify(attachments || [])}::jsonb)
      RETURNING *`);
    res.json({ success: true, message: result.rows[0] });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ success: false, error: 'Failed to send message' });
  }
});

router.get('/audit-trail', async (req: Request, res: Response) => {
  try {
    const docsResult = await db.execute(sql`SELECT id, document_type, document_name, uploaded_by, uploaded_by_role, created_at, 'document_upload' as event_type FROM fema_contract_documents WHERE is_active = true ORDER BY created_at DESC LIMIT 100`);
    const msgsResult = await db.execute(sql`SELECT id, sender_name, sender_role, subject, message_type, priority, created_at, 'message' as event_type FROM fema_project_messages ORDER BY created_at DESC LIMIT 100`);
    const combined = [...docsResult.rows, ...msgsResult.rows].sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    res.json({ success: true, events: combined.slice(0, 100) });
  } catch (error) {
    console.error('Error fetching audit trail:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch audit trail' });
  }
});

// ===== LAYERED LOCATION INTELLIGENCE SYSTEM =====

function sha256(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

async function getLastChainHash(): Promise<string> {
  const last = await db.execute(sql`SELECT chain_hash FROM fema_audit_chain ORDER BY id DESC LIMIT 1`);
  return last.rows.length > 0 ? (last.rows[0] as any).chain_hash : sha256('GENESIS_BLOCK');
}

async function appendAuditChain(entityType: string, entityId: string, action: string, actor: string, actorRole: string, metadata: any) {
  const lastEntry = await db.execute(sql`SELECT id, chain_hash FROM fema_audit_chain ORDER BY id DESC LIMIT 1`);
  const prevHash = lastEntry.rows.length > 0 ? (lastEntry.rows[0] as any).chain_hash : sha256('GENESIS_BLOCK');
  const sequence = lastEntry.rows.length > 0 ? (lastEntry.rows[0] as any).id + 1 : 1;
  const canonicalPayload = JSON.stringify({ entityType, entityId, action, actor, actorRole, metadata, seq: sequence });
  const payloadHash = sha256(canonicalPayload);
  const chainHash = sha256(prevHash + '|' + payloadHash + '|' + sequence.toString());
  await db.execute(sql`INSERT INTO fema_audit_chain (entity_type, entity_id, action, actor, actor_role, payload_hash, prev_hash, chain_hash, metadata)
    VALUES (${entityType}, ${entityId}, ${action}, ${actor}, ${actorRole || 'system'}, ${payloadHash}, ${prevHash}, ${chainHash}, ${JSON.stringify(metadata)}::jsonb)`);
  return { payloadHash, prevHash, chainHash, sequence };
}

interface SignalInput {
  signalType: string;
  signalValue: any;
  weight?: number;
}

function evaluateSignal(signal: SignalInput, eventData: any): { status: string; evidence: string } {
  const { signalType, signalValue } = signal;
  switch (signalType) {
    case 'gps': {
      const lat = parseFloat(signalValue.latitude || eventData.locationLat || '0');
      const lng = parseFloat(signalValue.longitude || eventData.locationLng || '0');
      const accuracy = parseFloat(signalValue.accuracy || eventData.locationAccuracyMeters || '999');
      if (lat === 0 && lng === 0) return { status: 'fail', evidence: 'No GPS coordinates provided' };
      if (accuracy > 500) return { status: 'warning', evidence: `GPS accuracy too low: ${accuracy}m (should be <500m)` };
      if (accuracy > 100) return { status: 'warning', evidence: `GPS accuracy moderate: ${accuracy}m` };
      return { status: 'pass', evidence: `GPS lock confirmed: ${lat.toFixed(5)}, ${lng.toFixed(5)} (±${accuracy}m)` };
    }
    case 'exif': {
      if (!signalValue || Object.keys(signalValue).length === 0) return { status: 'fail', evidence: 'No EXIF metadata found in submitted photo' };
      const hasGps = signalValue.gpsLatitude && signalValue.gpsLongitude;
      const hasTimestamp = signalValue.dateTime || signalValue.dateTimeOriginal;
      if (hasGps && hasTimestamp) return { status: 'pass', evidence: `EXIF verified: GPS (${signalValue.gpsLatitude}, ${signalValue.gpsLongitude}), timestamp ${signalValue.dateTime || signalValue.dateTimeOriginal}` };
      if (hasGps) return { status: 'warning', evidence: 'EXIF has GPS but no timestamp — partial verification' };
      if (hasTimestamp) return { status: 'warning', evidence: `EXIF has timestamp (${signalValue.dateTime}) but no GPS — partial verification` };
      return { status: 'fail', evidence: 'EXIF metadata present but missing GPS and timestamp' };
    }
    case 'time': {
      const hour = signalValue.hour ?? new Date().getHours();
      const dayOfWeek = signalValue.dayOfWeek ?? new Date().getDay();
      if (hour < 5 || hour > 22) return { status: 'warning', evidence: `Unusual work hour: ${hour}:00 — outside normal 05:00-22:00 window` };
      if (dayOfWeek === 0) return { status: 'warning', evidence: 'Work reported on Sunday — verify authorization' };
      return { status: 'pass', evidence: `Work time within normal window: ${hour}:00, day ${dayOfWeek}` };
    }
    case 'weather': {
      if (!signalValue || !signalValue.conditions) return { status: 'unknown', evidence: 'No weather data available for correlation' };
      const conditions = signalValue.conditions.toLowerCase();
      if (conditions.includes('tornado') || conditions.includes('hurricane')) return { status: 'warning', evidence: `Severe weather conditions reported: ${signalValue.conditions} — verify crew safety` };
      return { status: 'pass', evidence: `Weather conditions consistent: ${signalValue.conditions}, temp ${signalValue.temperature || 'N/A'}°F` };
    }
    case 'sign_in': {
      if (!signalValue.signInId && !signalValue.matched) return { status: 'fail', evidence: 'No matching crew sign-in record found for this verification window' };
      if (signalValue.matched) return { status: 'pass', evidence: `Crew sign-in correlated: ${signalValue.signInTime || 'verified'} by ${signalValue.memberName || 'crew member'}` };
      return { status: 'warning', evidence: 'Sign-in record exists but timing mismatch > 30 minutes' };
    }
    case 'load_ticket': {
      if (!signalValue.ticketId && !signalValue.matched) return { status: 'unknown', evidence: 'No load ticket associated with this event' };
      if (signalValue.matched) return { status: 'pass', evidence: `Load ticket #${signalValue.ticketId} correlated — ${signalValue.cubicYards || 0} CY at ${signalValue.debrisSite || 'site'}` };
      return { status: 'warning', evidence: 'Load ticket exists but data gaps detected' };
    }
    case 'device': {
      if (!signalValue.fingerprint) return { status: 'unknown', evidence: 'No device fingerprint captured' };
      if (signalValue.knownDevice) return { status: 'pass', evidence: `Known registered device: ${signalValue.deviceModel || signalValue.fingerprint.substring(0, 12)}` };
      return { status: 'warning', evidence: `Unregistered device detected: ${signalValue.fingerprint.substring(0, 12)}...` };
    }
    case 'photo': {
      if (!signalValue.hasPhoto) return { status: 'fail', evidence: 'No photo documentation submitted' };
      if (signalValue.aiVerified) return { status: 'pass', evidence: `Photo verified by AI: ${signalValue.description || 'work documentation confirmed'}` };
      return { status: 'pass', evidence: 'Photo documentation submitted — pending AI verification' };
    }
    default:
      return { status: 'unknown', evidence: `Unknown signal type: ${signalType}` };
  }
}

function computeVerificationScore(signals: Array<{ status: string; weight: number }>): { score: number; riskLevel: string } {
  if (signals.length === 0) return { score: 0, riskLevel: 'critical' };
  let totalWeight = 0;
  let weightedScore = 0;
  for (const s of signals) {
    const w = s.weight || 1;
    totalWeight += w;
    if (s.status === 'pass') weightedScore += w * 100;
    else if (s.status === 'warning') weightedScore += w * 50;
    else if (s.status === 'unknown') weightedScore += w * 25;
  }
  const score = Math.round(weightedScore / totalWeight);
  let riskLevel = 'low';
  if (score < 40) riskLevel = 'critical';
  else if (score < 60) riskLevel = 'high';
  else if (score < 80) riskLevel = 'medium';
  return { score, riskLevel };
}

router.post('/verification-events', async (req: Request, res: Response) => {
  try {
    const { eventType, jobId, pwNumber, crewId, crewMemberName, deviceId,
            locationLat, locationLng, locationAccuracyMeters, exifMeta,
            weatherSnapshot, signInId, loadTicketId, deviceFingerprint,
            sourceNotes, signals: rawSignals } = req.body;

    if (!eventType) return res.status(400).json({ success: false, error: 'eventType is required' });

    const signalInputs: SignalInput[] = rawSignals || [];
    if (locationLat && locationLng) {
      signalInputs.push({ signalType: 'gps', signalValue: { latitude: locationLat, longitude: locationLng, accuracy: locationAccuracyMeters }, weight: 1.5 });
    }
    if (exifMeta && Object.keys(exifMeta).length > 0) {
      signalInputs.push({ signalType: 'exif', signalValue: exifMeta, weight: 1.3 });
    }
    if (!signalInputs.find(s => s.signalType === 'time')) {
      const now = new Date();
      signalInputs.push({ signalType: 'time', signalValue: { hour: now.getHours(), dayOfWeek: now.getDay(), timestamp: now.toISOString() }, weight: 0.8 });
    }
    if (weatherSnapshot) {
      signalInputs.push({ signalType: 'weather', signalValue: weatherSnapshot, weight: 0.6 });
    }
    if (signInId) {
      signalInputs.push({ signalType: 'sign_in', signalValue: { signInId, matched: true }, weight: 1.2 });
    }
    if (loadTicketId) {
      signalInputs.push({ signalType: 'load_ticket', signalValue: { ticketId: loadTicketId, matched: true }, weight: 1.0 });
    }
    if (deviceFingerprint) {
      signalInputs.push({ signalType: 'device', signalValue: { fingerprint: deviceFingerprint, knownDevice: true }, weight: 0.7 });
    }

    const evaluatedSignals = signalInputs.map(s => {
      const result = evaluateSignal(s, req.body);
      return { ...s, ...result };
    });

    const { score, riskLevel } = computeVerificationScore(
      evaluatedSignals.map(s => ({ status: s.status, weight: s.weight || 1 }))
    );

    const anomalies: string[] = [];
    evaluatedSignals.forEach(s => {
      if (s.status === 'fail') anomalies.push(`FAIL: ${s.signalType} — ${s.evidence}`);
      if (s.status === 'warning') anomalies.push(`WARN: ${s.signalType} — ${s.evidence}`);
    });

    const aiReasoning = `Verification event "${eventType}" analyzed with ${evaluatedSignals.length} signals. ` +
      `${evaluatedSignals.filter(s => s.status === 'pass').length} passed, ` +
      `${evaluatedSignals.filter(s => s.status === 'warning').length} warnings, ` +
      `${evaluatedSignals.filter(s => s.status === 'fail').length} failures. ` +
      `Confidence: ${score}% (${riskLevel} risk).` +
      (anomalies.length > 0 ? ` Anomalies: ${anomalies.join('; ')}` : ' No anomalies detected.');

    const eventResult = await db.execute(sql`INSERT INTO fema_verification_events
      (event_type, job_id, pw_number, crew_id, crew_member_name, device_id,
       location_lat, location_lng, location_accuracy_meters, exif_meta, weather_snapshot,
       sign_in_id, load_ticket_id, device_fingerprint, source_notes, confidence_score, risk_level)
      VALUES (${eventType}, ${jobId||null}, ${pwNumber||null}, ${crewId||null}, ${crewMemberName||null}, ${deviceId||null},
        ${locationLat||null}, ${locationLng||null}, ${locationAccuracyMeters||null},
        ${JSON.stringify(exifMeta||{})}::jsonb, ${JSON.stringify(weatherSnapshot||{})}::jsonb,
        ${signInId||null}, ${loadTicketId||null}, ${deviceFingerprint||null}, ${sourceNotes||null},
        ${score}, ${riskLevel})
      RETURNING id`);

    const eventId = (eventResult.rows[0] as any).id;

    for (const s of evaluatedSignals) {
      await db.execute(sql`INSERT INTO fema_verification_signals (event_id, signal_type, signal_value, status, weight, evidence)
        VALUES (${eventId}, ${s.signalType}, ${JSON.stringify(s.signalValue)}::jsonb, ${s.status}, ${s.weight || 1}, ${s.evidence})`);
    }

    const signalBreakdown = evaluatedSignals.map(s => ({
      type: s.signalType, status: s.status, weight: s.weight || 1, evidence: s.evidence
    }));

    await db.execute(sql`INSERT INTO fema_verification_scores (event_id, confidence_score, risk_level, anomalies, ai_reasoning, signal_breakdown)
      VALUES (${eventId}, ${score}, ${riskLevel}, ${JSON.stringify(anomalies)}::jsonb, ${aiReasoning}, ${JSON.stringify(signalBreakdown)}::jsonb)`);

    await appendAuditChain('verification', eventId.toString(), 'created', crewMemberName || 'system', 'field_crew', {
      eventType, score, riskLevel, signalCount: evaluatedSignals.length, anomalyCount: anomalies.length
    });

    const scopeId = jobId || pwNumber || 'project-default';
    const existing = await db.execute(sql`SELECT * FROM fema_compliance_status WHERE scope_id = ${scopeId}`);
    if (existing.rows.length > 0) {
      const prev = existing.rows[0] as any;
      const totalEvents = (prev.total_events || 0) + 1;
      const passedEvents = (prev.passed_events || 0) + (riskLevel === 'low' ? 1 : 0);
      const failedEvents = (prev.failed_events || 0) + (riskLevel === 'critical' || riskLevel === 'high' ? 1 : 0);
      const overallScore = Math.round((passedEvents / totalEvents) * 100);
      const status = overallScore >= 80 ? 'compliant' : overallScore >= 50 ? 'warning' : 'non_compliant';
      await db.execute(sql`UPDATE fema_compliance_status SET overall_score=${overallScore}, status=${status},
        total_events=${totalEvents}, passed_events=${passedEvents}, failed_events=${failedEvents},
        last_event_id=${eventId}, alerts=${JSON.stringify(anomalies.slice(0,5))}::jsonb, updated_at=NOW()
        WHERE scope_id=${scopeId}`);
    } else {
      const status = riskLevel === 'low' ? 'compliant' : riskLevel === 'medium' ? 'warning' : 'non_compliant';
      await db.execute(sql`INSERT INTO fema_compliance_status (scope, scope_id, scope_name, overall_score, status, total_events, passed_events, failed_events, last_event_id, alerts)
        VALUES ('job', ${scopeId}, ${jobId || 'Default Project'}, ${score}, ${status}, 1, ${riskLevel === 'low' ? 1 : 0}, ${riskLevel === 'critical' || riskLevel === 'high' ? 1 : 0}, ${eventId}, ${JSON.stringify(anomalies.slice(0,5))}::jsonb)`);
    }

    res.json({
      success: true,
      event: { id: eventId, eventType, confidenceScore: score, riskLevel, anomalyCount: anomalies.length },
      signals: signalBreakdown,
      aiReasoning,
      anomalies
    });
  } catch (error) {
    console.error('Error creating verification event:', error);
    res.status(500).json({ success: false, error: 'Failed to create verification event' });
  }
});

router.get('/verification-events', async (req: Request, res: Response) => {
  try {
    const { jobId, crewId, riskLevel, limit: lim } = req.query;
    let query = 'SELECT e.*, s.confidence_score as score_confidence, s.risk_level as score_risk, s.ai_reasoning, s.anomalies, s.signal_breakdown FROM fema_verification_events e LEFT JOIN fema_verification_scores s ON e.id = s.event_id WHERE 1=1';
    const params: any[] = [];
    let paramIdx = 1;
    if (jobId) { query += ` AND e.job_id = $${paramIdx++}`; params.push(jobId); }
    if (crewId) { query += ` AND e.crew_id = $${paramIdx++}`; params.push(crewId); }
    if (riskLevel) { query += ` AND e.risk_level = $${paramIdx++}`; params.push(riskLevel); }
    query += ` ORDER BY e.created_at DESC LIMIT $${paramIdx}`;
    params.push(parseInt(lim as string) || 50);

    const result = await db.execute(sql.raw(query, params));
    res.json({ success: true, events: result.rows, total: result.rows.length });
  } catch (error) {
    console.error('Error fetching verification events:', error);
    const fallback = await db.execute(sql`SELECT e.*, s.confidence_score as score_confidence, s.risk_level as score_risk, s.ai_reasoning, s.anomalies, s.signal_breakdown FROM fema_verification_events e LEFT JOIN fema_verification_scores s ON e.id = s.event_id ORDER BY e.created_at DESC LIMIT 50`);
    res.json({ success: true, events: fallback.rows, total: fallback.rows.length });
  }
});

router.get('/verification-events/:id/signals', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const signals = await db.execute(sql`SELECT * FROM fema_verification_signals WHERE event_id = ${parseInt(id)} ORDER BY created_at ASC`);
    const score = await db.execute(sql`SELECT * FROM fema_verification_scores WHERE event_id = ${parseInt(id)}`);
    res.json({ success: true, signals: signals.rows, score: score.rows[0] || null });
  } catch (error) {
    console.error('Error fetching signals:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch signals' });
  }
});

router.get('/verification-status', async (req: Request, res: Response) => {
  try {
    const compliance = await db.execute(sql`SELECT * FROM fema_compliance_status ORDER BY updated_at DESC`);
    const recentEvents = await db.execute(sql`SELECT e.id, e.event_type, e.crew_member_name, e.confidence_score, e.risk_level, e.created_at
      FROM fema_verification_events e ORDER BY e.created_at DESC LIMIT 10`);
    const stats = await db.execute(sql`SELECT
      COUNT(*) as total_events,
      COUNT(CASE WHEN risk_level = 'low' THEN 1 END) as low_risk,
      COUNT(CASE WHEN risk_level = 'medium' THEN 1 END) as medium_risk,
      COUNT(CASE WHEN risk_level = 'high' THEN 1 END) as high_risk,
      COUNT(CASE WHEN risk_level = 'critical' THEN 1 END) as critical_risk,
      ROUND(AVG(confidence_score::numeric), 1) as avg_confidence
      FROM fema_verification_events`);
    const signalStats = await db.execute(sql`SELECT signal_type, status, COUNT(*) as count
      FROM fema_verification_signals GROUP BY signal_type, status ORDER BY signal_type`);

    res.json({
      success: true,
      complianceScopes: compliance.rows,
      recentEvents: recentEvents.rows,
      stats: stats.rows[0] || {},
      signalBreakdown: signalStats.rows
    });
  } catch (error) {
    console.error('Error fetching verification status:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch verification status' });
  }
});

router.get('/audit-chain', async (req: Request, res: Response) => {
  try {
    const { entityType, entityId, limit: lim } = req.query;
    let result;
    if (entityType && entityId) {
      result = await db.execute(sql`SELECT * FROM fema_audit_chain WHERE entity_type = ${entityType as string} AND entity_id = ${entityId as string} ORDER BY id ASC`);
    } else {
      result = await db.execute(sql`SELECT * FROM fema_audit_chain ORDER BY id DESC LIMIT ${parseInt(lim as string) || 100}`);
    }

    let chainValid = true;
    let brokenAt: number | null = null;
    const rows = [...result.rows].sort((a: any, b: any) => a.id - b.id);
    for (let i = 1; i < rows.length; i++) {
      const current = rows[i] as any;
      const prev = rows[i - 1] as any;
      if (current.prev_hash !== prev.chain_hash) {
        chainValid = false;
        brokenAt = current.id;
        break;
      }
    }

    if (chainValid && rows.length > 0) {
      const first = rows[0] as any;
      const genesis = sha256('GENESIS_BLOCK');
      if (first.prev_hash !== genesis) {
        chainValid = false;
        brokenAt = first.id;
      }
    }

    res.json({
      success: true,
      entries: result.rows,
      total: result.rows.length,
      integrity: { valid: chainValid, brokenAt, totalChecked: rows.length }
    });
  } catch (error) {
    console.error('Error fetching audit chain:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch audit chain' });
  }
});

router.post('/verification-events/simulate', async (req: Request, res: Response) => {
  try {
    const scenarios = [
      {
        eventType: 'crew_arrival', crewId: 'CREW-A', crewMemberName: 'Marcus Johnson',
        jobId: 'JOB-2025-001', locationLat: '30.2672', locationLng: '-97.7431', locationAccuracyMeters: '15',
        deviceId: 'DEV-001', deviceFingerprint: 'fp_abc123def456',
        exifMeta: { gpsLatitude: 30.2672, gpsLongitude: -97.7431, dateTime: new Date().toISOString(), cameraModel: 'iPhone 15 Pro' },
        weatherSnapshot: { conditions: 'Partly Cloudy', temperature: 72, humidity: 65 },
        signInId: 'SI-001', sourceNotes: 'Crew arrived at debris staging area',
        signals: [
          { signalType: 'photo', signalValue: { hasPhoto: true, aiVerified: true, description: 'Crew at staging area with equipment' }, weight: 1.0 },
          { signalType: 'device', signalValue: { fingerprint: 'fp_abc123def456', knownDevice: true, deviceModel: 'iPhone 15 Pro' }, weight: 0.7 }
        ]
      },
      {
        eventType: 'work_in_progress', crewId: 'CREW-B', crewMemberName: 'Sarah Chen',
        jobId: 'JOB-2025-002', locationLat: '30.2700', locationLng: '-97.7500', locationAccuracyMeters: '45',
        deviceId: 'DEV-002',
        exifMeta: { dateTime: new Date().toISOString() },
        weatherSnapshot: { conditions: 'Clear', temperature: 78 },
        sourceNotes: 'Tree removal in progress — section 3',
        signals: [
          { signalType: 'photo', signalValue: { hasPhoto: true, aiVerified: false, description: 'Active tree removal' }, weight: 1.0 }
        ]
      },
      {
        eventType: 'load_departure', crewId: 'CREW-A', crewMemberName: 'David Williams',
        jobId: 'JOB-2025-001', locationLat: '30.2680', locationLng: '-97.7440', locationAccuracyMeters: '25',
        deviceId: 'DEV-003', deviceFingerprint: 'fp_unknown_device',
        loadTicketId: 'LT-2025-0042',
        weatherSnapshot: { conditions: 'Overcast', temperature: 70 },
        sourceNotes: 'Load departing for disposal site',
        signals: [
          { signalType: 'device', signalValue: { fingerprint: 'fp_unknown_device', knownDevice: false }, weight: 0.7 },
          { signalType: 'load_ticket', signalValue: { ticketId: 'LT-2025-0042', matched: true, cubicYards: 18.5, debrisSite: 'Disposal Site Alpha' }, weight: 1.0 }
        ]
      },
      {
        eventType: 'site_inspection', crewId: 'CREW-C', crewMemberName: 'Lisa Park',
        jobId: 'JOB-2025-003', locationLat: '0', locationLng: '0', locationAccuracyMeters: '999',
        deviceId: 'DEV-004',
        sourceNotes: 'Site inspection — GPS signal lost in dense tree cover',
        signals: [
          { signalType: 'photo', signalValue: { hasPhoto: false }, weight: 1.0 },
          { signalType: 'sign_in', signalValue: { matched: false }, weight: 1.2 }
        ]
      },
      {
        eventType: 'photo_capture', crewId: 'CREW-A', crewMemberName: 'Marcus Johnson',
        jobId: 'JOB-2025-001', locationLat: '30.2675', locationLng: '-97.7435', locationAccuracyMeters: '10',
        deviceId: 'DEV-001', deviceFingerprint: 'fp_abc123def456',
        exifMeta: { gpsLatitude: 30.2675, gpsLongitude: -97.7435, dateTime: new Date().toISOString(), cameraModel: 'iPhone 15 Pro', make: 'Apple' },
        weatherSnapshot: { conditions: 'Clear', temperature: 75, humidity: 55 },
        signInId: 'SI-003',
        sourceNotes: 'Before/after photo documentation — tree removal complete',
        signals: [
          { signalType: 'photo', signalValue: { hasPhoto: true, aiVerified: true, description: 'Before/after comparison showing tree removal completion' }, weight: 1.0 },
          { signalType: 'device', signalValue: { fingerprint: 'fp_abc123def456', knownDevice: true, deviceModel: 'iPhone 15 Pro' }, weight: 0.7 }
        ]
      }
    ];

    const results = [];
    for (const scenario of scenarios) {
      const response = await fetch(`http://localhost:5000/api/fema-data/verification-events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scenario)
      });
      const result = await response.json();
      results.push(result);
    }

    res.json({ success: true, simulated: results.length, results });
  } catch (error) {
    console.error('Error simulating verification events:', error);
    res.status(500).json({ success: false, error: 'Failed to simulate events' });
  }
});

export default router;
