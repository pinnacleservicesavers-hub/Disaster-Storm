import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, numeric, boolean, jsonb, integer, uuid, unique, foreignKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ===== WEATHER VALIDATION SCHEMAS =====

// Weather Alert Schema
export const weatherAlertSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  severity: z.enum(['Extreme', 'Severe', 'Moderate', 'Minor']),
  alertType: z.string(),
  areas: z.array(z.string()),
  startTime: z.date(),
  endTime: z.date().optional(),
  coordinates: z.object({
    latitude: z.number(),
    longitude: z.number()
  }),
  geometry: z.any().optional(),
  urgency: z.string().optional(),
  certainty: z.string().optional(),
  category: z.string().optional(),
  responseType: z.string().optional(),
  nwsId: z.string().optional(),
  messageType: z.string().optional()
});

// Lightning Data Schema
export const lightningStrikeSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  timestamp: z.date(),
  intensity: z.number(),
  type: z.enum(['cloud-to-ground', 'cloud-to-cloud', 'intracloud'])
});

export const lightningDataSchema = z.object({
  timestamp: z.date(),
  strikes: z.array(lightningStrikeSchema),
  density: z.number(),
  range: z.number(),
  goesData: z.any().optional()
});

// Wave Data Schema
export const waveDataSchema = z.object({
  significantHeight: z.number(),
  peakPeriod: z.number(),
  direction: z.number(),
  windWaveHeight: z.number().optional(),
  swellHeight: z.number().optional(),
  timestamp: z.date(),
  location: z.object({
    latitude: z.number(),
    longitude: z.number()
  }),
  source: z.enum(['buoy', 'satellite', 'model', 'WAVEWATCH-III-Global', 'WAVEWATCH-III-Regional']),
  modelRun: z.date().optional(),
  forecastHour: z.number().optional(),
  waveHeight: z.number().optional(),
  wavePeriod: z.number().optional(),
  waveDirection: z.number().optional(),
  swellPeriod: z.number().optional(),
  swellDirection: z.number().optional(),
  validTime: z.date().optional()
});

// Buoy Data Schema
export const buoyDataSchema = z.object({
  stationId: z.string(),
  name: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  waterDepth: z.number(),
  measurements: z.object({
    waterTemperature: z.number().optional(),
    airTemperature: z.number().optional(),
    windSpeed: z.number().optional(),
    windDirection: z.number().optional(),
    significantWaveHeight: z.number().optional(),
    peakWavePeriod: z.number().optional(),
    meanWaveDirection: z.number().optional(),
    atmosphericPressure: z.number().optional()
  }),
  timestamp: z.date(),
  status: z.enum(['active', 'inactive', 'maintenance'])
});

// Radar Data Schema
export const radarDataSchema = z.object({
  timestamp: z.date(),
  layers: z.array(z.object({
    type: z.string(),
    data: z.array(z.object({
      latitude: z.number(),
      longitude: z.number(),
      intensity: z.number(),
      type: z.string()
    }))
  })),
  coverage: z.array(z.object({
    state: z.string(),
    counties: z.array(z.string()),
    isActive: z.boolean()
  })),
  singleSite: z.array(z.any()).optional(),
  velocity: z.array(z.any()).optional(),
  dualPol: z.array(z.any()).optional()
});

// Satellite Data Schema
export const satelliteDataSchema = z.object({
  timestamp: z.date(),
  layers: z.array(z.object({
    type: z.enum(['visible', 'infrared', 'water_vapor', 'enhanced']),
    url: z.string(),
    opacity: z.number(),
    product: z.string().optional(),
    sector: z.enum(['FD', 'CONUS', 'M1', 'M2', 'M3', 'M4', 'M5', 'M6']).optional(),
    channel: z.string().optional(),
    satellite: z.string().optional(),
    file: z.string().optional(),
    abiSource: z.boolean().optional()
  })),
  resolution: z.string(),
  coverage: z.string(),
  goesData: z.any().optional()
});

// Marine Weather Schema
export const marineWeatherSchema = z.object({
  waves: z.array(waveDataSchema),
  buoys: z.array(buoyDataSchema),
  seaTemperature: z.array(z.object({
    latitude: z.number(),
    longitude: z.number(),
    temperature: z.number(),
    source: z.enum(['satellite', 'buoy', 'ship']),
    timestamp: z.date(),
    satellite: z.string().optional()
  })),
  timestamp: z.date(),
  region: z.string()
});

// Contractor Weather Request Schemas
export const contractorWeatherRequestSchema = z.object({
  states: z.string().optional(),
  counties: z.string().optional(),
  severity: z.enum(['all', 'moderate', 'severe', 'extreme']).optional(),
  types: z.string().optional()
});

export const contractorRegionRequestSchema = z.object({
  lat: z.string().transform(Number),
  lon: z.string().transform(Number),
  radius: z.string().transform(Number).optional()
});

export const contractorMarineRequestSchema = z.object({
  region: z.enum(['atlantic', 'gulf', 'pacific']).optional(),
  lat: z.string().transform(Number).optional(),
  lon: z.string().transform(Number).optional(),
  radius: z.string().transform(Number).optional()
});

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email"),
  role: text("role").default("contractor"), // contractor, admin, crew_member
  createdAt: timestamp("created_at").defaultNow(),
});

export const claims = pgTable("claims", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  claimNumber: text("claim_number").notNull().unique(),
  insuranceCompany: text("insurance_company").notNull(),
  policyNumber: text("policy_number"),
  claimantName: text("claimant_name").notNull(),
  propertyAddress: text("property_address").notNull(),
  damageType: text("damage_type").notNull(), // tree_removal, roof_damage, etc.
  incidentDate: timestamp("incident_date").notNull(),
  reportedDate: timestamp("reported_date").defaultNow(),
  status: text("status").default("active"), // active, disputed, settled, denied
  estimatedAmount: numeric("estimated_amount", { precision: 10, scale: 2 }),
  approvedAmount: numeric("approved_amount", { precision: 10, scale: 2 }),
  paidAmount: numeric("paid_amount", { precision: 10, scale: 2 }),
  state: text("state").notNull(),
  latitude: numeric("latitude", { precision: 10, scale: 8 }),
  longitude: numeric("longitude", { precision: 10, scale: 8 }),
  assignedCrew: varchar("assigned_crew"),
  notes: text("notes"),
  metadata: jsonb("metadata"), // Additional claim data
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insuranceCompanies = pgTable("insurance_companies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  code: text("code").notNull().unique(), // SF, AS, GE, etc.
  avgPayout: numeric("avg_payout", { precision: 10, scale: 2 }),
  totalClaims: integer("total_claims").default(0),
  successRate: numeric("success_rate", { precision: 5, scale: 2 }), // percentage
  payoutTrend: numeric("payout_trend", { precision: 5, scale: 2 }), // percentage change
  claimsEmail: text("claims_email"),
  claimsPhone: text("claims_phone"),
  mailingAddress: text("mailing_address"),
  website: text("website"),
  disasterClaimsEmail: text("disaster_claims_email"), // Special disaster claims email
  disasterClaimsPhone: text("disaster_claims_phone"), // Special disaster claims phone
  claimSubmissionPortal: text("claim_submission_portal"), // Online portal URL
  states: jsonb("states"), // Array of states they operate in
  notes: text("notes"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const lienRules = pgTable("lien_rules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  state: text("state").notNull().unique(),
  prelimNoticeRequired: boolean("prelim_notice_required").default(false),
  prelimNoticeDeadline: text("prelim_notice_deadline"),
  lienFilingDeadline: text("lien_filing_deadline").notNull(),
  enforcementDeadline: text("enforcement_deadline").notNull(),
  homesteadNote: text("homestead_note"),
  treeServiceNote: text("tree_service_note"),
  sourceUrl: text("source_url"),
  lastVerified: timestamp("last_verified").defaultNow(),
});

export const weatherAlerts = pgTable("weather_alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  alertId: text("alert_id").notNull().unique(), // From NWS API
  title: text("title").notNull(),
  description: text("description").notNull(),
  severity: text("severity").notNull(), // Extreme, Severe, Moderate, Minor
  alertType: text("alert_type").notNull(), // Tornado, Severe Thunderstorm, etc.
  areas: jsonb("areas"), // Affected areas
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  isActive: boolean("is_active").default(true),
  latitude: numeric("latitude", { precision: 10, scale: 8 }),
  longitude: numeric("longitude", { precision: 10, scale: 8 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const fieldReports = pgTable("field_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  crewId: varchar("crew_id").notNull(),
  crewName: text("crew_name").notNull(),
  location: text("location").notNull(),
  latitude: numeric("latitude", { precision: 10, scale: 8 }),
  longitude: numeric("longitude", { precision: 10, scale: 8 }),
  description: text("description").notNull(),
  damageAssessment: text("damage_assessment"),
  priority: text("priority").default("normal"), // urgent, high, normal, low
  photoCount: integer("photo_count").default(0),
  videoCount: integer("video_count").default(0),
  audioCount: integer("audio_count").default(0),
  estimatedHours: numeric("estimated_hours", { precision: 5, scale: 2 }),
  equipmentNeeded: jsonb("equipment_needed"),
  safetyNotes: text("safety_notes"),
  claimId: varchar("claim_id"),
  status: text("status").default("pending"), // pending, in_progress, completed
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const droneFootage = pgTable("drone_footage", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  operatorName: text("operator_name").notNull(),
  operatorId: text("operator_id"),
  title: text("title").notNull(),
  description: text("description"),
  location: text("location").notNull(),
  latitude: numeric("latitude", { precision: 10, scale: 8 }),
  longitude: numeric("longitude", { precision: 10, scale: 8 }),
  videoUrl: text("video_url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  duration: integer("duration"), // in seconds
  isLive: boolean("is_live").default(false),
  stormEvent: text("storm_event"),
  claimId: varchar("claim_id"),
  visibility: text("visibility").default("public"), // public, private, restricted
  createdAt: timestamp("created_at").defaultNow(),
});

// TrafficCamWatcher contractor watchlist for preferred monitoring regions
export const contractorWatchlist = pgTable("contractor_watchlist", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contractorId: varchar("contractor_id").notNull(),
  itemType: text("item_type").notNull(), // 'state', 'county', 'camera'
  itemId: text("item_id").notNull(), // state code, county name, or camera id
  displayName: text("display_name").notNull(),
  state: text("state").notNull(),
  county: text("county"),
  alertsEnabled: boolean("alerts_enabled").default(true),
  
  // Alert Preferences Configuration
  emailAlertsEnabled: boolean("email_alerts_enabled").default(true),
  smsAlertsEnabled: boolean("sms_alerts_enabled").default(false),
  browserAlertsEnabled: boolean("browser_alerts_enabled").default(true),
  
  // Contact Information for Alerts
  alertEmail: text("alert_email"), // Override default user email
  alertPhone: text("alert_phone"), // Phone number for SMS alerts
  
  // Severity Level Filtering
  minSeverityLevel: text("min_severity_level").default("moderate"), // minor, moderate, severe, critical
  alertTypes: jsonb("alert_types"), // Array of alert types to monitor: ['tree_down', 'structure_damage', 'debris', 'flooding']
  
  // Geographic and Timing Preferences
  alertRadius: numeric("alert_radius", { precision: 5, scale: 2 }).default("25.00"), // Miles from watch location
  quietHoursStart: text("quiet_hours_start"), // "22:00" format
  quietHoursEnd: text("quiet_hours_end"), // "06:00" format
  timezone: text("timezone").default("America/New_York"),
  
  // Response Time Preferences
  immediateAlertTypes: jsonb("immediate_alert_types"), // Alert types that bypass quiet hours
  maxAlertsPerHour: integer("max_alerts_per_hour").default(5), // Rate limiting
  
  metadata: jsonb("metadata"), // Additional configuration per watch item
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  uniq: unique().on(table.contractorId, table.itemType, table.itemId),
}));

export const marketComparables = pgTable("market_comparables", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  claimType: text("claim_type").notNull(),
  insuranceCompany: text("insurance_company").notNull(),
  region: text("region").notNull(),
  avgPayout: numeric("avg_payout", { precision: 10, scale: 2 }).notNull(),
  sampleSize: integer("sample_size").notNull(),
  confidenceLevel: numeric("confidence_level", { precision: 5, scale: 2 }),
  trend: numeric("trend", { precision: 5, scale: 2 }), // percentage change
  lastUpdated: timestamp("last_updated").defaultNow(),
  metadata: jsonb("metadata"), // Additional comparable data
});

export const aiInteractions = pgTable("ai_interactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  interactionType: text("interaction_type").notNull(), // letter_generation, market_analysis, translation, etc.
  input: jsonb("input").notNull(),
  output: jsonb("output").notNull(),
  language: text("language").default("en"),
  claimId: varchar("claim_id"),
  tokensUsed: integer("tokens_used"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const dspFootage = pgTable("dsp_footage", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  provider: text("provider").notNull(), // DroneUp, Zeitview, SkySkopes, etc.
  timestamp: timestamp("timestamp").notNull(),
  mediaUrl: text("media_url").notNull(), // HLS stream or video URL
  thumbnailUrl: text("thumbnail_url"), // Optional thumbnail
  latitude: numeric("latitude", { precision: 10, scale: 8 }).notNull(),
  longitude: numeric("longitude", { precision: 10, scale: 8 }).notNull(),
  address: text("address"), // Optional geocoded address
  notes: text("notes"), // Damage description, keywords
  status: text("status").default("new"), // new, reviewed, processed
  claimId: varchar("claim_id"), // Optional claim association
  processingMetadata: jsonb("processing_metadata"), // AI analysis results, etc.
  createdAt: timestamp("created_at").defaultNow(),
  processedAt: timestamp("processed_at"),
});

export const contractorDocuments = pgTable("contractor_documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contractorId: varchar("contractor_id").notNull(),
  documentType: text("document_type").notNull(), // "contract", "price_sheet", "w9"
  fileName: text("file_name").notNull(),
  fileUrl: text("file_url").notNull(), // Object storage URL
  title: text("title").notNull(), // User-friendly name
  description: text("description"), // Optional description
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const leads = pgTable("leads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contractorId: varchar("contractor_id").notNull(),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email"),
  customerPhone: text("customer_phone").notNull(),
  propertyAddress: text("property_address").notNull(),
  latitude: numeric("latitude", { precision: 10, scale: 8 }),
  longitude: numeric("longitude", { precision: 10, scale: 8 }),
  damageType: text("damage_type").notNull(),
  urgency: text("urgency").default("normal"), // emergency, urgent, normal
  status: text("status").default("new"), // new, contacted, scheduled, in_progress, completed, lost
  estimatedValue: numeric("estimated_value", { precision: 10, scale: 2 }),
  insuranceCompany: text("insurance_company"),
  policyNumber: text("policy_number"),
  scheduledDate: timestamp("scheduled_date"),
  notes: text("notes"),
  source: text("source").default("direct"), // direct, referral, online, storm_tracker
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const invoices = pgTable("invoices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  invoiceNumber: text("invoice_number").notNull().unique(),
  contractorId: varchar("contractor_id").notNull(),
  leadId: varchar("lead_id"),
  claimId: varchar("claim_id"),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email"),
  customerPhone: text("customer_phone"),
  propertyAddress: text("property_address").notNull(),
  workDescription: text("work_description").notNull(),
  subtotal: numeric("subtotal", { precision: 10, scale: 2 }).notNull(),
  taxAmount: numeric("tax_amount", { precision: 10, scale: 2 }).default("0"),
  totalAmount: numeric("total_amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status").default("draft"), // draft, sent, paid, overdue, cancelled
  dueDate: timestamp("due_date"),
  paidDate: timestamp("paid_date"),
  isEmergencyRate: boolean("is_emergency_rate").default(false),
  minimumBillableHours: numeric("minimum_billable_hours", { precision: 5, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const jobCosts = pgTable("job_costs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  invoiceId: varchar("invoice_id").notNull(),
  category: text("category").notNull(), // labor, equipment, materials, permits
  itemDescription: text("item_description").notNull(),
  quantity: numeric("quantity", { precision: 10, scale: 2 }).notNull(),
  unitRate: numeric("unit_rate", { precision: 10, scale: 2 }).notNull(),
  totalCost: numeric("total_cost", { precision: 10, scale: 2 }).notNull(),
  equipmentType: text("equipment_type"), // crane, skid_steer, chipper, etc.
  laborRole: text("labor_role"), // climber, groundman, operator, etc.
  hours: numeric("hours", { precision: 5, scale: 2 }),
  oshaCompliance: boolean("osha_compliance").default(false),
  ansiCompliance: boolean("ansi_compliance").default(false),
  justification: text("justification"), // Why this item was necessary
  createdAt: timestamp("created_at").defaultNow(),
});

export const photos = pgTable("photos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contractorId: varchar("contractor_id").notNull(),
  leadId: varchar("lead_id"),
  claimId: varchar("claim_id"),
  invoiceId: varchar("invoice_id"),
  fileName: text("file_name").notNull(),
  fileUrl: text("file_url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  latitude: numeric("latitude", { precision: 10, scale: 8 }),
  longitude: numeric("longitude", { precision: 10, scale: 8 }),
  address: text("address"), // Geocoded address
  aiDescription: text("ai_description"), // AI-generated description
  damageType: text("damage_type"),
  severity: text("severity"), // minor, moderate, severe, critical
  category: text("category"), // before, during, after, evidence, documentation
  sequence: integer("sequence").default(1), // For ordering photos in story
  tags: jsonb("tags"), // Array of descriptive tags
  metadata: jsonb("metadata"), // EXIF data and other metadata
  isProcessed: boolean("is_processed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const xactimateComparables = pgTable("xactimate_comparables", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  invoiceId: varchar("invoice_id").notNull(),
  zipCode: text("zip_code").notNull(),
  lineItem: text("line_item").notNull(), // Xactimate line item code
  description: text("description").notNull(),
  xactimatePrice: numeric("xactimate_price", { precision: 10, scale: 2 }).notNull(),
  contractorPrice: numeric("contractor_price", { precision: 10, scale: 2 }).notNull(),
  variance: numeric("variance", { precision: 5, scale: 2 }).notNull(), // percentage difference
  justification: text("justification"), // Why price is higher
  emergencyMultiplier: numeric("emergency_multiplier", { precision: 3, scale: 2 }).default("1.0"),
  radius: integer("radius").default(150), // mile radius for comparables
  createdAt: timestamp("created_at").defaultNow(),
});

export const claimSubmissions = pgTable("claim_submissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  claimId: varchar("claim_id").notNull(),
  invoiceId: varchar("invoice_id").notNull(),
  contractorId: varchar("contractor_id").notNull(),
  insuranceCompanyId: varchar("insurance_company_id").notNull(),
  submissionMethod: text("submission_method").notNull(), // email, portal, mail
  trackingNumber: text("tracking_number"),
  status: text("status").default("submitted"), // submitted, received, under_review, approved, denied
  submittedAt: timestamp("submitted_at").defaultNow(),
  acknowledgedAt: timestamp("acknowledged_at"),
  responseReceived: timestamp("response_received"),
  adjusterName: text("adjuster_name"),
  adjusterPhone: text("adjuster_phone"),
  adjusterEmail: text("adjuster_email"),
  notes: text("notes"),
  documents: jsonb("documents"), // Array of submitted document URLs
});

export const trafficCameras = pgTable("traffic_cameras", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  externalCameraId: text("external_camera_id").notNull().unique(), // External camera system ID
  name: text("name").notNull(),
  description: text("description"),
  provider: text("provider").notNull(), // DOT, city, county
  feedUrl: text("feed_url").notNull(), // Live stream URL
  thumbnailUrl: text("thumbnail_url"),
  latitude: numeric("latitude", { precision: 10, scale: 8 }).notNull(),
  longitude: numeric("longitude", { precision: 10, scale: 8 }).notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  county: text("county").notNull(),
  state: text("state").notNull(),
  highway: text("highway"), // Highway designation if applicable
  direction: text("direction"), // N, S, E, W, NB, SB, etc.
  mileMarker: text("mile_marker"),
  isActive: boolean("is_active").default(true),
  lastHealthCheck: timestamp("last_health_check"),
  healthStatus: text("health_status").default("unknown"), // online, offline, error, unknown
  metadata: jsonb("metadata"), // Additional camera data
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const trafficCamSubscriptions = pgTable("traffic_cam_subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contractorId: varchar("contractor_id").notNull(),
  cameraId: varchar("camera_id").notNull(),
  notifyTypes: jsonb("notify_types"), // Array of alert types to notify for
  priority: text("priority").default("normal"), // high, normal, low
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  uniqueSubscription: unique().on(table.contractorId, table.cameraId),
}));

export const trafficCamAlerts = pgTable("traffic_cam_alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  cameraId: varchar("camera_id").notNull(), // FK to traffic_cameras.id
  externalCameraId: text("external_camera_id").notNull(), // For reference
  alertType: text("alert_type").notNull(), // structure_damage, tree_down, tree_on_powerline, tree_blocking_road, tree_on_vehicle
  confidence: numeric("confidence", { precision: 5, scale: 2 }).notNull(), // AI confidence percentage
  severity: text("severity").notNull(), // minor, moderate, severe, critical
  description: text("description").notNull(), // AI-generated description
  detectedAt: timestamp("detected_at").notNull(),
  screenshotUrl: text("screenshot_url"), // Captured image of incident
  videoClipUrl: text("video_clip_url"), // Short video clip of incident
  exactLocation: text("exact_location"), // More specific than camera address
  estimatedDamage: text("estimated_damage"), // low, medium, high, extensive
  contractorsNotified: jsonb("contractors_notified"), // Array of notified contractor IDs
  status: text("status").default("new"), // new, processing, assigned, resolved, false_positive
  leadGenerated: boolean("lead_generated").default(false),
  aiAnalysis: jsonb("ai_analysis"), // Detailed AI analysis results
  verifiedBy: varchar("verified_by"), // User ID who verified alert
  verifiedAt: timestamp("verified_at"),
  isVerified: boolean("is_verified").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  uniqueAlert: unique().on(table.cameraId, table.detectedAt, table.alertType),
}));

export const trafficCamLeads = pgTable("traffic_cam_leads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  alertId: varchar("alert_id").notNull(), // FK to traffic_cam_alerts.id
  cameraId: varchar("camera_id").notNull(), // FK to traffic_cameras.id
  contractorId: varchar("contractor_id").notNull(), // FK to users.id where role=contractor
  alertType: text("alert_type").notNull(), // From parent alert
  priority: text("priority").default("high"), // emergency, urgent, high, normal
  estimatedValue: numeric("estimated_value", { precision: 10, scale: 2 }),
  responseTime: integer("response_time"), // Minutes from alert to contractor response
  status: text("status").default("new"), // new, contacted, on_route, arrived, in_progress, completed, declined
  contactAttempts: integer("contact_attempts").default(0),
  lastContactedAt: timestamp("last_contacted_at"),
  arrivalTime: timestamp("arrival_time"),
  workStarted: timestamp("work_started"),
  workCompleted: timestamp("work_completed"),
  customerName: text("customer_name"),
  customerPhone: text("customer_phone"),
  customerEmail: text("customer_email"),
  propertyOwner: text("property_owner"), // If different from customer
  insuranceCompany: text("insurance_company"),
  policyNumber: text("policy_number"),
  actualDamageAssessment: text("actual_damage_assessment"),
  workPerformed: text("work_performed"),
  equipmentUsed: jsonb("equipment_used"), // Array of equipment types
  crewSize: integer("crew_size"),
  invoiceAmount: numeric("invoice_amount", { precision: 10, scale: 2 }),
  conversionValue: numeric("conversion_value", { precision: 10, scale: 2 }), // Actual revenue generated
  declineReason: text("decline_reason"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  uniqueLead: unique().on(table.alertId, table.contractorId),
}));

export const stormHotZones = pgTable("storm_hot_zones", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  state: text("state").notNull(),
  stateCode: text("state_code").notNull(), // Two-letter state code (FL, TX, etc.)
  countyParish: text("county_parish").notNull(), // Full county/parish name
  countyFips: text("county_fips"), // FIPS county code
  stormTypes: text("storm_types").notNull(), // "Hurricane", "Tornado", or "Hurricane,Tornado"
  riskLevel: text("risk_level").notNull(), // "Very High", "High", "Moderate", "Moderate-High"
  riskScore: integer("risk_score").notNull(), // Numeric risk score (90 = Very High, 70 = High, 55 = Moderate)
  
  // Historical FEMA Disaster Declaration IDs
  femaDisasterIds: jsonb("fema_disaster_ids"), // Array of historical FEMA disaster IDs for this county
  majorStorms: jsonb("major_storms"), // Array of major storm events with years and names
  
  // Descriptive information
  notes: text("notes"), // Historical context and major storm impacts
  primaryCities: text("primary_cities"), // Major cities/areas in the county
  
  // Geographic data
  latitude: numeric("latitude", { precision: 10, scale: 8 }),
  longitude: numeric("longitude", { precision: 10, scale: 8 }),
  
  // Market data for contractors
  avgClaimAmount: numeric("avg_claim_amount", { precision: 10, scale: 2 }), // Average claim amount in USD
  marketPotential: text("market_potential"), // "High", "Medium", "Low" - contractor market opportunity
  seasonalPeak: text("seasonal_peak"), // Peak season months (e.g., "Jun-Nov", "Mar-Jun")
  
  // Metadata
  dataSource: text("data_source").default("FEMA Historical Analysis"),
  lastUpdated: timestamp("last_updated").defaultNow(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  uniqueCounty: unique().on(table.stateCode, table.countyParish),
}));

// ===== VICTIM PORTAL SCHEMAS =====

// Homeowners/Victims table for portal users
export const homeowners = pgTable("homeowners", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone").notNull(),
  
  // Property Information
  propertyAddress: text("property_address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zipCode: text("zip_code").notNull(),
  latitude: numeric("latitude", { precision: 10, scale: 8 }),
  longitude: numeric("longitude", { precision: 10, scale: 8 }),
  
  // Property Details
  propertyType: text("property_type").notNull(), // "residential", "commercial"
  squareFootage: numeric("square_footage", { precision: 8, scale: 2 }),
  yearBuilt: integer("year_built"),
  
  // Insurance Information
  insuranceCarrier: text("insurance_carrier"),
  policyNumber: text("policy_number"),
  
  // Contact Preferences
  preferredContactMethod: text("preferred_contact_method").default("phone"), // phone, email, sms
  languagePreference: text("language_preference").default("en"), // en, es
  
  // Emergency Status
  hasActiveEmergency: boolean("has_active_emergency").default(false),
  
  // Authentication
  passwordHash: text("password_hash").notNull(),
  isVerified: boolean("is_verified").default(false),
  verificationToken: text("verification_token"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Damage Reports table for victim submissions
export const damageReports = pgTable("damage_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  homeownerId: varchar("homeowner_id").notNull().references(() => homeowners.id),
  
  // Damage Information
  title: text("title").notNull(),
  description: text("description").notNull(),
  damageType: text("damage_type").notNull(), // "roof_damage", "tree_removal", "flooding", "window_damage", "structural", "electrical", "siding"
  severity: text("severity").notNull(), // "emergency", "urgent", "moderate", "minor"
  
  // Location Data
  damageLocation: text("damage_location"), // "front_yard", "roof", "living_room", etc.
  latitude: numeric("latitude", { precision: 10, scale: 8 }),
  longitude: numeric("longitude", { precision: 10, scale: 8 }),
  addressOverride: text("address_override"), // If damage is at different address than homeowner
  
  // Media Attachments
  photos: jsonb("photos"), // Array of photo URLs with metadata
  videos: jsonb("videos"), // Array of video URLs with metadata
  photoCount: integer("photo_count").default(0),
  videoCount: integer("video_count").default(0),
  
  // GPS and EXIF Data
  gpsFromExif: boolean("gps_from_exif").default(false), // Whether GPS came from EXIF data
  exifData: jsonb("exif_data"), // Stored EXIF metadata
  
  // Status and Timeline
  status: text("status").default("submitted"), // submitted, reviewed, contractor_assigned, in_progress, completed
  isEmergency: boolean("is_emergency").default(false),
  
  // Weather Context
  weatherConditions: text("weather_conditions"), // Weather at time of damage
  stormEventId: varchar("storm_event_id"), // Link to weather event if applicable
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Service Requests table for specific help needed
export const serviceRequests = pgTable("service_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  homeownerId: varchar("homeowner_id").notNull().references(() => homeowners.id),
  damageReportId: varchar("damage_report_id").references(() => damageReports.id),
  
  // Service Information
  serviceType: text("service_type").notNull(), // "roofing", "siding", "windows", "flooding", "electrical", "tree_removal", "general_contractor"
  urgency: text("urgency").notNull(), // "immediate", "urgent", "normal", "when_convenient"
  description: text("description").notNull(),
  
  // Scope and Budget
  estimatedScope: text("estimated_scope"), // "small", "medium", "large", "full_restoration"
  budgetRange: text("budget_range"), // "under_5k", "5k_15k", "15k_50k", "over_50k", "insurance_covered"
  preferredTimeframe: text("preferred_timeframe"), // "asap", "within_week", "within_month", "flexible"
  
  // Contractor Preferences
  contractorPreferences: jsonb("contractor_preferences"), // Array of preferences like "licensed", "insured", "local"
  maxDistance: numeric("max_distance", { precision: 5, scale: 2 }).default("25.00"), // Miles from property
  
  // Matching and Assignment
  matchedContractors: jsonb("matched_contractors"), // Array of matched contractor IDs
  assignedContractorId: varchar("assigned_contractor_id"),
  
  // Status Tracking
  status: text("status").default("open"), // open, contractor_assigned, estimate_received, work_scheduled, in_progress, completed, cancelled
  
  // Communication
  allowContactOutsideHours: boolean("allow_contact_outside_hours").default(false),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Emergency Contacts table for prioritization
export const emergencyContacts = pgTable("emergency_contacts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  homeownerId: varchar("homeowner_id").notNull().references(() => homeowners.id),
  
  // Contact Information
  name: text("name").notNull(),
  relationship: text("relationship").notNull(), // "family", "friend", "neighbor", "insurance_agent", "property_manager"
  phone: text("phone").notNull(),
  email: text("email"),
  
  // Contact Preferences
  isPrimary: boolean("is_primary").default(false),
  contactOrder: integer("contact_order").default(1), // Order of contact priority
  availableHours: text("available_hours"), // "24/7", "business_hours", "custom"
  customHours: text("custom_hours"), // Custom availability if not standard
  
  // Emergency Settings
  contactForEmergencies: boolean("contact_for_emergencies").default(true),
  contactForUpdates: boolean("contact_for_updates").default(false),
  hasPropertyAccess: boolean("has_property_access").default(false), // Can meet contractors if homeowner unavailable
  
  // Notes
  notes: text("notes"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Zod schemas for validation  
export const insertUserSchema = createInsertSchema(users);
export const insertClaimSchema = createInsertSchema(claims);
export const insertInsuranceCompanySchema = createInsertSchema(insuranceCompanies);
export const insertLienRuleSchema = createInsertSchema(lienRules);
export const insertWeatherAlertSchema = createInsertSchema(weatherAlerts);
export const insertFieldReportSchema = createInsertSchema(fieldReports);
export const insertDroneFootageSchema = createInsertSchema(droneFootage);
export const insertMarketComparableSchema = createInsertSchema(marketComparables);
export const insertAiInteractionSchema = createInsertSchema(aiInteractions);
export const insertDspFootageSchema = createInsertSchema(dspFootage);
export const insertContractorDocumentSchema = createInsertSchema(contractorDocuments);
export const insertLeadSchema = createInsertSchema(leads);
export const insertInvoiceSchema = createInsertSchema(invoices);
export const insertJobCostSchema = createInsertSchema(jobCosts);
export const insertPhotoSchema = createInsertSchema(photos);
export const insertXactimateComparableSchema = createInsertSchema(xactimateComparables);
export const insertClaimSubmissionSchema = createInsertSchema(claimSubmissions);
export const insertTrafficCameraSchema = createInsertSchema(trafficCameras);
export const insertTrafficCamSubscriptionSchema = createInsertSchema(trafficCamSubscriptions);
export const insertTrafficCamAlertSchema = createInsertSchema(trafficCamAlerts);
export const insertTrafficCamLeadSchema = createInsertSchema(trafficCamLeads);
export const insertContractorWatchlistSchema = createInsertSchema(contractorWatchlist).omit({ id: true, createdAt: true });
export const insertStormHotZoneSchema = createInsertSchema(stormHotZones).omit({ id: true, createdAt: true, lastUpdated: true });
export const insertHomeownerSchema = createInsertSchema(homeowners).omit({ id: true, createdAt: true, updatedAt: true });
export const insertDamageReportSchema = createInsertSchema(damageReports).omit({ id: true, createdAt: true, updatedAt: true });
export const insertServiceRequestSchema = createInsertSchema(serviceRequests).omit({ id: true, createdAt: true, updatedAt: true });
export const insertEmergencyContactSchema = createInsertSchema(emergencyContacts).omit({ id: true, createdAt: true, updatedAt: true });

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Claim = typeof claims.$inferSelect;
export type InsertClaim = z.infer<typeof insertClaimSchema>;
export type InsuranceCompany = typeof insuranceCompanies.$inferSelect;
export type InsertInsuranceCompany = z.infer<typeof insertInsuranceCompanySchema>;
export type LienRule = typeof lienRules.$inferSelect;
export type InsertLienRule = z.infer<typeof insertLienRuleSchema>;
export type WeatherAlert = typeof weatherAlerts.$inferSelect;
export type InsertWeatherAlert = z.infer<typeof insertWeatherAlertSchema>;
export type FieldReport = typeof fieldReports.$inferSelect;
export type InsertFieldReport = z.infer<typeof insertFieldReportSchema>;
export type DroneFootage = typeof droneFootage.$inferSelect;
export type InsertDroneFootage = z.infer<typeof insertDroneFootageSchema>;
export type MarketComparable = typeof marketComparables.$inferSelect;
export type InsertMarketComparable = z.infer<typeof insertMarketComparableSchema>;
export type AiInteraction = typeof aiInteractions.$inferSelect;
export type InsertAiInteraction = z.infer<typeof insertAiInteractionSchema>;
export type DspFootage = typeof dspFootage.$inferSelect;
export type InsertDspFootage = z.infer<typeof insertDspFootageSchema>;
export type ContractorDocument = typeof contractorDocuments.$inferSelect;
export type InsertContractorDocument = z.infer<typeof insertContractorDocumentSchema>;
export type Lead = typeof leads.$inferSelect;
export type InsertLead = z.infer<typeof insertLeadSchema>;
export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type JobCost = typeof jobCosts.$inferSelect;
export type InsertJobCost = z.infer<typeof insertJobCostSchema>;
export type Photo = typeof photos.$inferSelect;
export type InsertPhoto = z.infer<typeof insertPhotoSchema>;
export type XactimateComparable = typeof xactimateComparables.$inferSelect;
export type InsertXactimateComparable = z.infer<typeof insertXactimateComparableSchema>;
export type ClaimSubmission = typeof claimSubmissions.$inferSelect;
export type InsertClaimSubmission = z.infer<typeof insertClaimSubmissionSchema>;
export type TrafficCamera = typeof trafficCameras.$inferSelect;
export type InsertTrafficCamera = z.infer<typeof insertTrafficCameraSchema>;
export type TrafficCamSubscription = typeof trafficCamSubscriptions.$inferSelect;
export type InsertTrafficCamSubscription = z.infer<typeof insertTrafficCamSubscriptionSchema>;
export type TrafficCamAlert = typeof trafficCamAlerts.$inferSelect;
export type InsertTrafficCamAlert = z.infer<typeof insertTrafficCamAlertSchema>;
export type TrafficCamLead = typeof trafficCamLeads.$inferSelect;
export type InsertTrafficCamLead = z.infer<typeof insertTrafficCamLeadSchema>;
export type ContractorWatchlist = typeof contractorWatchlist.$inferSelect;
export type InsertContractorWatchlist = z.infer<typeof insertContractorWatchlistSchema>;
export type StormHotZone = typeof stormHotZones.$inferSelect;
export type InsertStormHotZone = z.infer<typeof insertStormHotZoneSchema>;
export type Homeowner = typeof homeowners.$inferSelect;
export type InsertHomeowner = z.infer<typeof insertHomeownerSchema>;
export type DamageReport = typeof damageReports.$inferSelect;
export type InsertDamageReport = z.infer<typeof insertDamageReportSchema>;
export type ServiceRequest = typeof serviceRequests.$inferSelect;
export type InsertServiceRequest = z.infer<typeof insertServiceRequestSchema>;
export type EmergencyContact = typeof emergencyContacts.$inferSelect;
export type InsertEmergencyContact = z.infer<typeof insertEmergencyContactSchema>;
