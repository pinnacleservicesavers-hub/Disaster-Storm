import { Router, Request, Response } from 'express';
import { db } from '../db.js';
import { sql } from 'drizzle-orm';

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

export default router;
