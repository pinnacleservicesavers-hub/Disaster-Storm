import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, numeric, boolean, jsonb, integer, uuid, unique, foreignKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// JSON type aliases for consistent typing
type JsonObject = Record<string, unknown>;
type JsonArray<T = unknown> = T[];

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
  metadata: jsonb("metadata").$type<JsonObject>(), // Additional claim data
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
  states: text("states").array(), // Array of states they operate in
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
  areas: text("areas").array(), // Affected areas
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
  equipmentNeeded: text("equipment_needed").array(),
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
  alertTypes: text("alert_types").array(), // Array of alert types to monitor: ['tree_down', 'structure_damage', 'debris', 'flooding']
  
  // Geographic and Timing Preferences
  alertRadius: numeric("alert_radius", { precision: 5, scale: 2 }).default("25.00"), // Miles from watch location
  quietHoursStart: text("quiet_hours_start"), // "22:00" format
  quietHoursEnd: text("quiet_hours_end"), // "06:00" format
  timezone: text("timezone").default("America/New_York"),
  
  // Response Time Preferences
  immediateAlertTypes: text("immediate_alert_types").array(), // Alert types that bypass quiet hours
  maxAlertsPerHour: integer("max_alerts_per_hour").default(5), // Rate limiting
  
  metadata: jsonb("metadata").$type<JsonObject>(), // Additional configuration per watch item
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
  metadata: jsonb("metadata").$type<JsonObject>(), // Additional comparable data
});

export const aiInteractions = pgTable("ai_interactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  interactionType: text("interaction_type").notNull(), // letter_generation, market_analysis, translation, etc.
  input: jsonb("input").$type<JsonObject>().notNull(),
  output: jsonb("output").$type<JsonObject>().notNull(),
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
  processingMetadata: jsonb("processing_metadata").$type<JsonObject>(), // AI analysis results, etc.
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
  tags: jsonb("tags").$type<string[]>(), // Array of descriptive tags
  metadata: jsonb("metadata").$type<JsonObject>(), // EXIF data and other metadata
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
  documents: jsonb("documents").$type<string[]>(), // Array of submitted document URLs
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
  metadata: jsonb("metadata").$type<JsonObject>(), // Additional camera data
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const trafficCamSubscriptions = pgTable("traffic_cam_subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contractorId: varchar("contractor_id").notNull(),
  cameraId: varchar("camera_id").notNull(),
  notifyTypes: jsonb("notify_types").$type<string[]>(), // Array of alert types to notify for
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
  alertType: text("alert_type").notNull(), // roof_damage, siding_damage, window_damage, structure_damage, tree_down, tree_on_powerline, tree_blocking_road, tree_on_vehicle, flood_damage, debris_blockage
  confidence: numeric("confidence", { precision: 5, scale: 2 }).notNull(), // AI confidence percentage
  severity: text("severity").notNull(), // minor, moderate, severe, critical
  severityScore: integer("severity_score").notNull(), // 1-10 scale for precise ranking
  profitabilityScore: integer("profitability_score").notNull(), // 1-10 scale for contractor lead value
  description: text("description").notNull(), // AI-generated description
  detectedAt: timestamp("detected_at").notNull(),
  screenshotUrl: text("screenshot_url"), // Captured image of incident
  videoClipUrl: text("video_clip_url"), // Short video clip of incident
  exactLocation: text("exact_location"), // More specific than camera address
  resolvedAddress: text("resolved_address"), // Geocoded address from coordinates
  estimatedDamage: text("estimated_damage"), // low, medium, high, extensive
  urgencyLevel: text("urgency_level").notNull(), // low, normal, high, emergency
  contractorTypes: jsonb("contractor_types").$type<string[]>(), // Array of contractor types needed
  contractorSpecializations: jsonb("contractor_specializations").$type<string[]>(), // Array of specific specializations required
  estimatedCost: jsonb("estimated_cost").$type<JsonObject>(), // {min: number, max: number, currency: string}
  workScope: jsonb("work_scope").$type<string[]>(), // Array of specific contractor tasks
  safetyHazards: jsonb("safety_hazards").$type<string[]>(), // Array of safety concerns for workers
  equipmentNeeded: jsonb("equipment_needed").$type<string[]>(), // Array of specialized equipment required
  accessibilityScore: integer("accessibility_score").default(5), // 1-10 how easy to access for contractors
  leadPriority: text("lead_priority").default("medium"), // low, medium, high, critical
  emergencyResponse: boolean("emergency_response").default(false), // True if needs immediate response
  insuranceLikelihood: integer("insurance_likelihood").default(5), // 1-10 likelihood of insurance claim
  competitionLevel: text("competition_level").default("medium"), // low, medium, high expected contractor competition
  riskAssessment: jsonb("risk_assessment").$type<JsonObject>(), // {publicSafety: number, propertyDamage: number, businessDisruption: number}
  weatherCorrelation: jsonb("weather_correlation").$type<JsonObject>(), // Storm type, intensity, time elapsed data
  contractorsNotified: jsonb("contractors_notified").$type<string[]>(), // Array of notified contractor IDs
  status: text("status").default("new"), // new, processing, assigned, resolved, false_positive
  leadGenerated: boolean("lead_generated").default(false),
  aiAnalysis: jsonb("ai_analysis").$type<JsonObject>(), // Complete AI analysis results
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
  equipmentUsed: jsonb("equipment_used").$type<string[]>(), // Array of equipment types
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
  femaDisasterIds: jsonb("fema_disaster_ids").$type<string[]>(), // Array of historical FEMA disaster IDs for this county
  majorStorms: jsonb("major_storms").$type<JsonArray<JsonObject>>(), // Array of major storm events with years and names
  
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
  photos: jsonb("photos").$type<JsonArray<JsonObject>>(), // Array of photo URLs with metadata
  videos: jsonb("videos").$type<JsonArray<JsonObject>>(), // Array of video URLs with metadata
  photoCount: integer("photo_count").default(0),
  videoCount: integer("video_count").default(0),
  
  // GPS and EXIF Data
  gpsFromExif: boolean("gps_from_exif").default(false), // Whether GPS came from EXIF data
  exifData: jsonb("exif_data").$type<JsonObject>(), // Stored EXIF metadata
  
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
  contractorPreferences: jsonb("contractor_preferences").$type<string[]>(), // Array of preferences like "licensed", "insured", "local"
  maxDistance: numeric("max_distance", { precision: 5, scale: 2 }).default("25.00"), // Miles from property
  
  // Matching and Assignment
  matchedContractors: jsonb("matched_contractors").$type<string[]>(), // Array of matched contractor IDs
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

// ===== PREDICTIVE STORM DAMAGE AI SCHEMAS =====

// Storm Predictions table for AI-generated storm damage predictions
export const stormPredictions = pgTable("storm_predictions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Storm Identification
  stormId: text("storm_id").notNull(), // NHC ID or generated ID
  stormName: text("storm_name"), // Hurricane Ida, Severe Thunderstorms, etc.
  stormType: text("storm_type").notNull(), // hurricane, tornado, severe_thunderstorm, winter_storm
  
  // Current Storm Characteristics
  currentLatitude: numeric("current_latitude", { precision: 10, scale: 8 }).notNull(),
  currentLongitude: numeric("current_longitude", { precision: 10, scale: 8 }).notNull(),
  currentIntensity: integer("current_intensity").notNull(), // mph for wind, scale for other types
  currentPressure: integer("current_pressure"), // mb for hurricanes
  currentDirection: integer("current_direction").notNull(), // degrees
  currentSpeed: integer("current_speed").notNull(), // mph forward motion
  
  // Prediction Timeframe
  predictionStartTime: timestamp("prediction_start_time").notNull(),
  predictionEndTime: timestamp("prediction_end_time").notNull(),
  forecastHours: integer("forecast_hours").notNull(), // 12, 24, 48, 72 hours
  
  // Predicted Path and Intensity
  predictedPath: jsonb("predicted_path").$type<JsonArray<JsonObject>>().notNull(), // Array of {time, lat, lng, intensity, confidence}
  maxPredictedIntensity: integer("max_predicted_intensity").notNull(),
  
  // Confidence and Risk Assessment
  overallConfidence: numeric("overall_confidence", { precision: 3, scale: 2 }).notNull(), // 0.0 to 1.0
  pathConfidence: numeric("path_confidence", { precision: 3, scale: 2 }).notNull(),
  intensityConfidence: numeric("intensity_confidence", { precision: 3, scale: 2 }).notNull(),
  
  // Data Sources Used
  modelsSources: jsonb("models_sources").$type<string[]>().notNull(), // ["GFS", "ECMWF", "HRRR", "NAM"]
  radarSources: jsonb("radar_sources").$type<string[]>().notNull(), // ["NEXRAD", "GOES", "Lightning"]
  lastRadarUpdate: timestamp("last_radar_update").notNull(),
  
  // AI Analysis Metadata
  aiModelVersion: text("ai_model_version").default("v1.0"),
  processingTimeMs: integer("processing_time_ms").notNull(),
  analysisComplexity: text("analysis_complexity").default("standard"), // simple, standard, complex
  
  // Status and Lifecycle
  status: text("status").default("active"), // active, expired, superseded, cancelled
  supersededBy: varchar("superseded_by"), // ID of newer prediction that replaces this one
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  uniqueStormForecast: unique().on(table.stormId, table.predictionStartTime, table.forecastHours),
}));

// Damage Forecasts table for specific geographic damage predictions
export const damageForecast = pgTable("damage_forecast", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Associated Storm Prediction
  stormPredictionId: varchar("storm_prediction_id").notNull().references(() => stormPredictions.id),
  stormId: text("storm_id").notNull(),
  
  // Geographic Area
  state: text("state").notNull(),
  stateCode: text("state_code").notNull(),
  county: text("county").notNull(),
  countyFips: text("county_fips"),
  
  // Center point of damage area
  centerLatitude: numeric("center_latitude", { precision: 10, scale: 8 }).notNull(),
  centerLongitude: numeric("center_longitude", { precision: 10, scale: 8 }).notNull(),
  impactRadius: numeric("impact_radius", { precision: 8, scale: 2 }).notNull(), // miles
  
  // Damage Predictions
  expectedArrivalTime: timestamp("expected_arrival_time").notNull(),
  peakIntensityTime: timestamp("peak_intensity_time").notNull(),
  expectedExitTime: timestamp("expected_exit_time").notNull(),
  
  // Damage Types and Severity (0-10 scale)
  windDamageRisk: numeric("wind_damage_risk", { precision: 3, scale: 1 }).notNull(),
  floodingRisk: numeric("flooding_risk", { precision: 3, scale: 1 }).notNull(),
  stormSurgeRisk: numeric("storm_surge_risk", { precision: 3, scale: 1 }).default("0.0"),
  hailRisk: numeric("hail_risk", { precision: 3, scale: 1 }).default("0.0"),
  tornadoRisk: numeric("tornado_risk", { precision: 3, scale: 1 }).default("0.0"),
  lightningRisk: numeric("lightning_risk", { precision: 3, scale: 1 }).default("0.0"),
  
  // Overall Risk Assessment
  overallDamageRisk: numeric("overall_damage_risk", { precision: 3, scale: 1 }).notNull(), // Composite score
  riskLevel: text("risk_level").notNull(), // minimal, low, moderate, high, extreme
  confidenceScore: numeric("confidence_score", { precision: 3, scale: 2 }).notNull(),
  
  // Infrastructure Vulnerability Assessment
  powerOutageRisk: numeric("power_outage_risk", { precision: 3, scale: 1 }).notNull(),
  roadBlockageRisk: numeric("road_blockage_risk", { precision: 3, scale: 1 }).notNull(),
  structuralDamageRisk: numeric("structural_damage_risk", { precision: 3, scale: 1 }).notNull(),
  treeFallRisk: numeric("tree_fall_risk", { precision: 3, scale: 1 }).notNull(),
  
  // Economic Impact Predictions
  estimatedPropertyDamage: numeric("estimated_property_damage", { precision: 12, scale: 2 }), // USD
  estimatedClaimVolume: integer("estimated_claim_volume"), // Number of expected insurance claims
  estimatedRestorationJobs: integer("estimated_restoration_jobs"), // Number of contractor jobs
  averageJobValue: numeric("average_job_value", { precision: 10, scale: 2 }), // USD per job
  
  // Historical Correlation Data
  historicalSimilarity: numeric("historical_similarity", { precision: 3, scale: 2 }), // 0.0 to 1.0
  similarHistoricalEvents: jsonb("similar_historical_events").$type<JsonArray<JsonObject>>(), // Array of similar past storms
  femaHistoryFactor: numeric("fema_history_factor", { precision: 3, scale: 2 }).default("1.0"),
  
  // Population and Exposure Data
  populationExposed: integer("population_exposed"),
  buildingsExposed: integer("buildings_exposed"),
  highValueTargets: jsonb("high_value_targets").$type<JsonArray<JsonObject>>(), // Hospitals, schools, critical infrastructure
  
  // Timing and Status
  validFromTime: timestamp("valid_from_time").notNull(),
  validUntilTime: timestamp("valid_until_time").notNull(),
  status: text("status").default("active"), // active, expired, verified, invalid
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  uniqueForecastArea: unique().on(table.stormPredictionId, table.countyFips, table.expectedArrivalTime),
}));

// Contractor Opportunity Predictions table
export const contractorOpportunityPredictions = pgTable("contractor_opportunity_predictions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Associated Damage Forecast
  damageForecastId: varchar("damage_forecast_id").notNull().references(() => damageForecast.id),
  stormPredictionId: varchar("storm_prediction_id").notNull().references(() => stormPredictions.id),
  
  // Geographic Opportunity Zone
  state: text("state").notNull(),
  county: text("county").notNull(),
  city: text("city"),
  zipCode: text("zip_code"),
  
  // Opportunity Assessment
  opportunityScore: numeric("opportunity_score", { precision: 5, scale: 2 }).notNull(), // 0-100 composite score
  marketPotential: text("market_potential").notNull(), // low, moderate, high, excellent
  competitionLevel: text("competition_level").default("moderate"), // low, moderate, high
  
  // Job Type Predictions
  treeRemovalDemand: numeric("tree_removal_demand", { precision: 5, scale: 2 }).notNull(), // 0-100 score
  roofingDemand: numeric("roofing_demand", { precision: 5, scale: 2 }).notNull(),
  sidingDemand: numeric("siding_demand", { precision: 5, scale: 2 }).notNull(),
  windowDemand: numeric("window_demand", { precision: 5, scale: 2 }).notNull(),
  gutterDemand: numeric("gutter_demand", { precision: 5, scale: 2 }).notNull(),
  fencingDemand: numeric("fencing_demand", { precision: 5, scale: 2 }).notNull(),
  emergencyTarpingDemand: numeric("emergency_tarping_demand", { precision: 5, scale: 2 }).notNull(),
  waterDamageDemand: numeric("water_damage_demand", { precision: 5, scale: 2 }).notNull(),
  
  // Financial Predictions
  estimatedRevenueOpportunity: numeric("estimated_revenue_opportunity", { precision: 12, scale: 2 }).notNull(),
  expectedJobCount: integer("expected_job_count").notNull(),
  averageJobValue: numeric("average_job_value", { precision: 10, scale: 2 }).notNull(),
  emergencyPremiumFactor: numeric("emergency_premium_factor", { precision: 3, scale: 2 }).default("1.0"), // 1.0 = normal, 1.5 = 50% premium
  
  // Market Factors
  insurancePayoutLikelihood: numeric("insurance_payout_likelihood", { precision: 3, scale: 2 }).notNull(),
  averageClaimAmount: numeric("average_claim_amount", { precision: 10, scale: 2 }),
  historicalPayoutRatio: numeric("historical_payout_ratio", { precision: 3, scale: 2 }),
  
  // Timing and Logistics
  optimalPrePositionTime: timestamp("optimal_preposition_time"), // When to move equipment to area
  workAvailableFromTime: timestamp("work_available_from_time").notNull(),
  peakDemandTime: timestamp("peak_demand_time").notNull(),
  demandDeclineTime: timestamp("demand_decline_time").notNull(),
  
  // Resource Requirements
  recommendedCrewSize: integer("recommended_crew_size"),
  requiredEquipment: jsonb("required_equipment").$type<string[]>(), // Array of equipment types needed
  estimatedDurationDays: integer("estimated_duration_days"),
  accommodationNeeds: jsonb("accommodation_needs").$type<JsonArray<JsonObject>>(), // Hotels, RV parks, etc.
  
  // Confidence and Validation
  predictionConfidence: numeric("prediction_confidence", { precision: 3, scale: 2 }).notNull(),
  validatedAgainstHistorical: boolean("validated_against_historical").default(false),
  lastUpdated: timestamp("last_updated").defaultNow(),
  
  // Status and Alerting
  alertLevel: text("alert_level").default("watch"), // watch, advisory, warning, emergency
  contractorsNotified: jsonb("contractors_notified").$type<string[]>(), // Array of contractor IDs who have been alerted
  notificationsSent: integer("notifications_sent").default(0),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Historical Damage Patterns table for AI training data
export const historicalDamagePatterns = pgTable("historical_damage_patterns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Storm Event Identification
  eventName: text("event_name").notNull(), // "Hurricane Ian 2022", "April 27, 2011 Tornado Outbreak"
  eventId: text("event_id"), // FEMA disaster ID or other official ID
  eventType: text("event_type").notNull(), // hurricane, tornado, severe_thunderstorm, winter_storm
  eventDate: timestamp("event_date").notNull(),
  
  // Storm Characteristics at Impact
  impactIntensity: integer("impact_intensity").notNull(), // Category/EF scale or wind speed
  stormPressure: integer("storm_pressure"), // mb for hurricanes
  forwardSpeed: integer("forward_speed"), // mph
  stormSize: integer("storm_size"), // miles diameter or tornado width
  
  // Geographic Impact Data
  state: text("state").notNull(),
  stateCode: text("state_code").notNull(),
  affectedCounties: jsonb("affected_counties").$type<string[]>().notNull(), // Array of county names/FIPS
  primaryImpactLat: numeric("primary_impact_lat", { precision: 10, scale: 8 }),
  primaryImpactLng: numeric("primary_impact_lng", { precision: 10, scale: 8 }),
  impactSwathMiles: numeric("impact_swath_miles", { precision: 6, scale: 1 }),
  
  // Damage Metrics
  totalPropertyDamage: numeric("total_property_damage", { precision: 15, scale: 2 }), // USD
  totalInsuranceClaims: integer("total_insurance_claims"),
  averageClaimAmount: numeric("average_claim_amount", { precision: 10, scale: 2 }),
  
  // Damage Type Breakdown (percentages)
  roofDamagePercent: numeric("roof_damage_percent", { precision: 5, scale: 2 }),
  treeDamagePercent: numeric("tree_damage_percent", { precision: 5, scale: 2 }),
  sidingDamagePercent: numeric("siding_damage_percent", { precision: 5, scale: 2 }),
  windowDamagePercent: numeric("window_damage_percent", { precision: 5, scale: 2 }),
  floodingPercent: numeric("flooding_percent", { precision: 5, scale: 2 }),
  structuralPercent: numeric("structural_percent", { precision: 5, scale: 2 }),
  
  // Infrastructure Impact
  powerOutagesCount: integer("power_outages_count"),
  powerRestorationDays: integer("power_restoration_days"),
  roadsBlockedCount: integer("roads_blocked_count"),
  bridgesClosed: integer("bridges_closed"),
  
  // Economic and Restoration Data
  contractorJobsGenerated: integer("contractor_jobs_generated"),
  averageJobValue: numeric("average_job_value", { precision: 10, scale: 2 }),
  restorationDurationDays: integer("restoration_duration_days"),
  emergencyPremiumObserved: numeric("emergency_premium_observed", { precision: 3, scale: 2 }),
  
  // Population and Exposure
  populationAffected: integer("population_affected"),
  buildingsDamaged: integer("buildings_damaged"),
  buildingsDestroyed: integer("buildings_destroyed"),
  evacuationOrdered: boolean("evacuation_ordered").default(false),
  
  // Data Sources and Quality
  dataSources: jsonb("data_sources").$type<string[]>().notNull(), // ["FEMA", "NOAA", "Insurance Institute", "NHC Post-Storm Report"]
  dataQuality: text("data_quality").default("verified"), // estimated, verified, comprehensive
  confidenceLevel: numeric("confidence_level", { precision: 3, scale: 2 }).default("0.80"),
  
  // Analysis Metadata
  analyzedBy: text("analyzed_by"), // "NOAA Post-Storm Analysis", "FEMA Damage Assessment"
  analysisDate: timestamp("analysis_date"),
  lastValidated: timestamp("last_validated"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  uniqueEvent: unique().on(table.eventName, table.eventDate, table.state),
}));

// Radar Analysis Cache table for processed NOAA radar data
export const radarAnalysisCache = pgTable("radar_analysis_cache", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Radar Data Identification
  radarSiteId: text("radar_site_id").notNull(), // NEXRAD site ID (KFFC, KTBW, etc.)
  scanTimestamp: timestamp("scan_timestamp").notNull(),
  scanType: text("scan_type").default("reflectivity"), // reflectivity, velocity, dual_pol
  elevationAngle: numeric("elevation_angle", { precision: 4, scale: 2 }),
  
  // Geographic Coverage
  centerLatitude: numeric("center_latitude", { precision: 10, scale: 8 }).notNull(),
  centerLongitude: numeric("center_longitude", { precision: 10, scale: 8 }).notNull(),
  radiusKm: numeric("radius_km", { precision: 6, scale: 2 }).notNull(),
  
  // Processed Analysis Results
  maxReflectivity: numeric("max_reflectivity", { precision: 5, scale: 1 }), // dBZ
  maxVelocity: numeric("max_velocity", { precision: 6, scale: 2 }), // m/s
  mesocycloneDetections: jsonb("mesocyclone_detections").$type<JsonArray<JsonObject>>(), // Array of detected mesocyclones
  hailMarkers: jsonb("hail_markers").$type<JsonArray<JsonObject>>(), // Hail detection markers
  
  // Storm Motion Analysis
  stormMotionDirection: integer("storm_motion_direction"), // degrees
  stormMotionSpeed: numeric("storm_motion_speed", { precision: 5, scale: 2 }), // m/s
  stormIntensityTrend: text("storm_intensity_trend"), // strengthening, weakening, steady
  
  // Threat Assessment
  tornadoRisk: numeric("tornado_risk", { precision: 3, scale: 1 }), // 0-10 scale
  hailRisk: numeric("hail_risk", { precision: 3, scale: 1 }),
  windRisk: numeric("wind_risk", { precision: 3, scale: 1 }),
  floodRisk: numeric("flood_risk", { precision: 3, scale: 1 }),
  
  // Processing Metadata
  processingAlgorithm: text("processing_algorithm").default("v1.0"),
  processingTime: timestamp("processing_time").defaultNow(),
  qualityScore: numeric("quality_score", { precision: 3, scale: 2 }), // 0.0 to 1.0
  
  // Caching and Performance
  cacheExpiry: timestamp("cache_expiry").notNull(),
  rawDataUrl: text("raw_data_url"), // URL to original NEXRAD data
  processedDataUrl: text("processed_data_url"), // URL to processed analysis
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  uniqueRadarScan: unique().on(table.radarSiteId, table.scanTimestamp, table.scanType),
}));

// Zod schemas for validation  
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertClaimSchema = createInsertSchema(claims).omit({ id: true, createdAt: true, updatedAt: true });
export const insertInsuranceCompanySchema = createInsertSchema(insuranceCompanies).omit({ id: true, updatedAt: true });
export const insertLienRuleSchema = createInsertSchema(lienRules).omit({ id: true, lastVerified: true }).extend({ prelimNoticeRequired: z.boolean().optional() });
export const insertWeatherAlertSchema = createInsertSchema(weatherAlerts).omit({ id: true, createdAt: true }).extend({ isActive: z.boolean().optional() });
export const insertFieldReportSchema = createInsertSchema(fieldReports).omit({ id: true, createdAt: true, updatedAt: true });
export const insertDroneFootageSchema = createInsertSchema(droneFootage).omit({ id: true, createdAt: true }).extend({ isLive: z.boolean().optional() });
export const insertMarketComparableSchema = createInsertSchema(marketComparables).omit({ id: true, lastUpdated: true });
export const insertAiInteractionSchema = createInsertSchema(aiInteractions).omit({ id: true, createdAt: true });
export const insertDspFootageSchema = createInsertSchema(dspFootage).omit({ id: true, createdAt: true, processedAt: true });
export const insertContractorDocumentSchema = createInsertSchema(contractorDocuments).omit({ id: true, createdAt: true, updatedAt: true }).extend({ isActive: z.boolean().optional() });
export const insertLeadSchema = createInsertSchema(leads).omit({ id: true, createdAt: true, updatedAt: true });
export const insertInvoiceSchema = createInsertSchema(invoices).omit({ id: true, createdAt: true, updatedAt: true }).extend({ isEmergencyRate: z.boolean().optional() });
export const insertJobCostSchema = createInsertSchema(jobCosts).omit({ id: true, createdAt: true }).extend({ oshaCompliance: z.boolean().optional(), ansiCompliance: z.boolean().optional() });
export const insertPhotoSchema = createInsertSchema(photos).omit({ id: true, createdAt: true }).extend({ isProcessed: z.boolean().optional() });
export const insertXactimateComparableSchema = createInsertSchema(xactimateComparables).omit({ id: true, createdAt: true });
export const insertClaimSubmissionSchema = createInsertSchema(claimSubmissions).omit({ id: true, submittedAt: true, acknowledgedAt: true, responseReceived: true });
export const insertTrafficCameraSchema = createInsertSchema(trafficCameras).omit({ id: true, createdAt: true, updatedAt: true, lastHealthCheck: true }).extend({ isActive: z.boolean().optional() });
export const insertTrafficCamSubscriptionSchema = createInsertSchema(trafficCamSubscriptions).omit({ id: true, createdAt: true }).extend({ isActive: z.boolean().optional() });
export const insertTrafficCamAlertSchema = createInsertSchema(trafficCamAlerts).omit({ id: true, createdAt: true, updatedAt: true, verifiedAt: true }).extend({ emergencyResponse: z.boolean().optional(), leadGenerated: z.boolean().optional(), isVerified: z.boolean().optional() });
export const insertTrafficCamLeadSchema = createInsertSchema(trafficCamLeads).omit({ id: true, createdAt: true, updatedAt: true, lastContactedAt: true, arrivalTime: true, workStarted: true, workCompleted: true });
export const insertContractorWatchlistSchema = createInsertSchema(contractorWatchlist).omit({ id: true, createdAt: true, updatedAt: true }).extend({ alertsEnabled: z.boolean().optional(), emailAlertsEnabled: z.boolean().optional(), smsAlertsEnabled: z.boolean().optional(), browserAlertsEnabled: z.boolean().optional() });
export const insertStormHotZoneSchema = createInsertSchema(stormHotZones).omit({ id: true, createdAt: true, lastUpdated: true });
export const insertHomeownerSchema = createInsertSchema(homeowners).omit({ id: true, createdAt: true, updatedAt: true });
export const insertDamageReportSchema = createInsertSchema(damageReports).omit({ id: true, createdAt: true, updatedAt: true });
export const insertServiceRequestSchema = createInsertSchema(serviceRequests).omit({ id: true, createdAt: true, updatedAt: true });
export const insertEmergencyContactSchema = createInsertSchema(emergencyContacts).omit({ id: true, createdAt: true, updatedAt: true });

// Predictive Storm AI schemas
export const insertStormPredictionSchema = createInsertSchema(stormPredictions).omit({ id: true, createdAt: true, updatedAt: true }).extend({ validatedAgainstHistorical: z.boolean().optional() });
export const insertDamageForecastSchema = createInsertSchema(damageForecast).omit({ id: true, createdAt: true, updatedAt: true });
export const insertContractorOpportunityPredictionSchema = createInsertSchema(contractorOpportunityPredictions).omit({ id: true, createdAt: true, updatedAt: true });
export const insertHistoricalDamagePatternSchema = createInsertSchema(historicalDamagePatterns).omit({ id: true, createdAt: true, updatedAt: true }).extend({ evacuationOrdered: z.boolean().optional() });
export const insertRadarAnalysisCacheSchema = createInsertSchema(radarAnalysisCache).omit({ id: true, createdAt: true, processingTime: true, cacheExpiry: true });

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

// Predictive Storm AI types
export type StormPrediction = typeof stormPredictions.$inferSelect;
export type InsertStormPrediction = z.infer<typeof insertStormPredictionSchema>;
export type DamageForecast = typeof damageForecast.$inferSelect;
export type InsertDamageForecast = z.infer<typeof insertDamageForecastSchema>;
export type ContractorOpportunityPrediction = typeof contractorOpportunityPredictions.$inferSelect;
export type InsertContractorOpportunityPrediction = z.infer<typeof insertContractorOpportunityPredictionSchema>;
export type HistoricalDamagePattern = typeof historicalDamagePatterns.$inferSelect;
export type InsertHistoricalDamagePattern = z.infer<typeof insertHistoricalDamagePatternSchema>;
export type RadarAnalysisCache = typeof radarAnalysisCache.$inferSelect;
export type InsertRadarAnalysisCache = z.infer<typeof insertRadarAnalysisCacheSchema>;

// ===== NEW AI DAMAGE DETECTION & SOCIAL PLATFORM SCHEMAS =====

// AI-detected damage leads from live footage analysis
export const aiDamageLeads = pgTable("ai_damage_leads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  // Source information
  sourceType: text("source_type").notNull(), // traffic_cam, drone, social_media, live_stream
  sourceId: text("source_id").notNull(), // ID of the source (camera ID, drone ID, etc.)
  sourceUrl: text("source_url"), // URL to the source footage
  
  // Location data
  latitude: numeric("latitude", { precision: 10, scale: 8 }).notNull(),
  longitude: numeric("longitude", { precision: 10, scale: 8 }).notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  county: text("county").notNull(),
  state: text("state").notNull(),
  zipCode: text("zip_code"),
  
  // Damage analysis
  damageType: text("damage_type").notNull(), // tree_on_house, tree_on_car, tree_blocking_road, roof_damage, etc.
  damageDescription: text("damage_description").notNull(),
  severity: text("severity").notNull(), // emergency, urgent, high, moderate, low
  aiConfidence: numeric("ai_confidence", { precision: 5, scale: 2 }).notNull(), // 0-100 percentage
  
  // Property information (when available)
  propertyOwnerName: text("property_owner_name"),
  propertyOwnerPhone: text("property_owner_phone"),
  propertyOwnerEmail: text("property_owner_email"),
  insuranceCompany: text("insurance_company"),
  policyNumber: text("policy_number"),
  coverageType: text("coverage_type"), // Coverage A (dwelling), Coverage B (personal property), etc.
  
  // Lead management
  status: text("status").default("new"), // new, assigned, contacted, in_progress, completed, closed
  priority: text("priority").default("normal"), // emergency, urgent, high, normal, low
  estimatedValue: numeric("estimated_value", { precision: 10, scale: 2 }),
  contractorsNeeded: jsonb("contractors_needed").$type<string[]>(), // Array of contractor types: ['tree_services', 'roofing', 'general_contractor']
  
  // Media and documentation
  imageCount: integer("image_count").default(0),
  videoCount: integer("video_count").default(0),
  mediaUrls: jsonb("media_urls").$type<string[]>(), // Array of image/video URLs
  
  // AI processing metadata
  processingMetadata: jsonb("processing_metadata").$type<Record<string, any>>(), // AI analysis details, confidence scores, etc.
  verificationStatus: text("verification_status").default("pending"), // pending, verified, rejected
  verifiedBy: varchar("verified_by"), // User ID who verified the lead
  verifiedAt: timestamp("verified_at"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Contractor assignments for AI-detected leads
export const aiLeadAssignments = pgTable("ai_lead_assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  aiLeadId: varchar("ai_lead_id").notNull(),
  contractorId: varchar("contractor_id").notNull(),
  contractorType: text("contractor_type").notNull(), // tree_services, roofing, cleanup, etc.
  
  // Assignment details
  assignmentStatus: text("assignment_status").default("assigned"), // assigned, accepted, declined, completed
  assignedBy: varchar("assigned_by"), // User ID who made the assignment
  assignedAt: timestamp("assigned_at").defaultNow(),
  acceptedAt: timestamp("accepted_at"),
  completedAt: timestamp("completed_at"),
  
  // Communication tracking
  contactAttempts: integer("contact_attempts").default(0),
  lastContactAt: timestamp("last_contact_at"),
  contactMethod: text("contact_method"), // sms, email, phone, app
  responseReceived: boolean("response_received").default(false),
  
  // Notes and updates
  notes: text("notes"),
  contractorNotes: text("contractor_notes"),
  estimatedResponseTime: text("estimated_response_time"), // 30min, 2hrs, same_day, next_day
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  // Ensure one assignment per contractor per lead
  uniq: unique().on(table.aiLeadId, table.contractorId),
}));

// Live streaming sources for Eyes in the Sky
export const liveStreamSources = pgTable("live_stream_sources", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  url: text("url").notNull().unique(),
  description: text("description"),
  category: text("category").notNull(), // live_chasing, youtube_channel, weather_intelligence, etc.
  
  // Source details
  provider: text("provider"), // Severe Studios, Live Storm Chasers, etc.
  isActive: boolean("is_active").default(true),
  requiresSubscription: boolean("requires_subscription").default(false),
  subscriptionCost: numeric("subscription_cost", { precision: 8, scale: 2 }),
  subscriptionPeriod: text("subscription_period"), // monthly, yearly
  
  // Access and monitoring
  lastChecked: timestamp("last_checked"),
  status: text("status").default("unknown"), // online, offline, requires_payment, error
  averageViewers: integer("average_viewers"),
  
  // Metadata
  tags: jsonb("tags").$type<string[]>(), // Array of descriptive tags
  region: text("region"), // Geographic region covered
  emergencyAccess: boolean("emergency_access").default(false), // Free during emergencies
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// StormShareCam social platform posts
export const stormSharePosts = pgTable("storm_share_posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  
  // Post content
  content: text("content").notNull(),
  postType: text("post_type").notNull(), // text, image, video, live_stream, help_request, donation_request
  
  // Location information
  location: text("location"),
  latitude: numeric("latitude", { precision: 10, scale: 8 }),
  longitude: numeric("longitude", { precision: 10, scale: 8 }),
  
  // Media attachments
  mediaUrls: jsonb("media_urls").$type<string[]>(), // Array of image/video URLs
  mediaCount: integer("media_count").default(0),
  liveStreamUrl: text("live_stream_url"), // For live streams
  isLive: boolean("is_live").default(false),
  
  // Help/donation requests
  isHelpRequest: boolean("is_help_request").default(false),
  isDonationRequest: boolean("is_donation_request").default(false),
  helpType: text("help_type"), // emergency_services, contractor_needed, supplies, transportation
  urgencyLevel: text("urgency_level"), // emergency, urgent, high, normal
  donationGoal: numeric("donation_goal", { precision: 10, scale: 2 }),
  donationRaised: numeric("donation_raised", { precision: 10, scale: 2 }).default("0"),
  donationPlatform: text("donation_platform"), // venmo, paypal, gofundme, etc.
  donationHandle: text("donation_handle"), // @username for donation platform
  
  // Social engagement
  likes: integer("likes").default(0),
  comments: integer("comments").default(0),
  shares: integer("shares").default(0),
  views: integer("views").default(0),
  
  // Moderation and status
  status: text("status").default("active"), // active, flagged, removed, archived
  flagCount: integer("flag_count").default(0),
  isVerified: boolean("is_verified").default(false), // Verified user/organization
  isFeatured: boolean("is_featured").default(false),
  
  // Categories and tags
  category: text("category"), // damage_report, help_request, donation, update, live_coverage
  tags: jsonb("tags").$type<string[]>(), // Array of hashtags and descriptive tags
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Post interactions (likes, comments, shares)
export const stormShareInteractions = pgTable("storm_share_interactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  postId: varchar("post_id").notNull(),
  userId: varchar("user_id").notNull(),
  interactionType: text("interaction_type").notNull(), // like, comment, share, view
  
  // For comments
  commentText: text("comment_text"),
  parentCommentId: varchar("parent_comment_id"), // For replies
  
  // For shares
  shareText: text("share_text"), // Optional text when sharing
  sharePlatform: text("share_platform"), // internal, facebook, twitter, etc.
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  // Prevent duplicate likes/reactions
  uniq: unique().on(table.postId, table.userId, table.interactionType),
}));

// ===== MINIMAL AI DAMAGE DETECTION FOUNDATION =====

// Detection Jobs table - minimal foundation for AI damage detection
export const detectionJobs = pgTable("detection_jobs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sourceType: text("source_type").notNull(), // 'photo', 'video', 'traffic_cam'
  sourceId: text("source_id").notNull(), // ID referencing the source (photo ID, video ID, camera ID)
  status: text("status").default("pending"), // 'pending', 'processing', 'completed', 'failed'
  createdAt: timestamp("created_at").defaultNow(),
});

// Detection Results table - stores AI analysis results
export const detectionResults = pgTable("detection_results", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  jobId: varchar("job_id").notNull().references(() => detectionJobs.id),
  label: text("label").notNull(), // 'tree_damage', 'roof_damage', 'vehicle_damage', 'flooding', 'debris', 'structure_damage'
  confidence: numeric("confidence", { precision: 5, scale: 2 }).notNull(), // 0-100 percentage
  bbox: jsonb("bbox").$type<{x: number, y: number, width: number, height: number}>(), // Bounding box coordinates
  geometry: jsonb("geometry").$type<JsonObject>(), // GeoJSON geometry for geographic features
  severityScore: numeric("severity_score", { precision: 3, scale: 1 }).notNull(), // 0-10 scale
  metadata: jsonb("metadata").$type<JsonObject>(), // Additional analysis metadata
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas for the new tables
export const insertAiDamageLeadSchema = createInsertSchema(aiDamageLeads).omit({ id: true, createdAt: true, updatedAt: true, verifiedAt: true });

export const insertAiLeadAssignmentSchema = createInsertSchema(aiLeadAssignments).omit({ id: true, createdAt: true, updatedAt: true, assignedAt: true, acceptedAt: true, completedAt: true, lastContactAt: true }).extend({ responseReceived: z.boolean().optional() });

export const insertLiveStreamSourceSchema = createInsertSchema(liveStreamSources).omit({ id: true, createdAt: true, updatedAt: true, lastChecked: true }).extend({ isActive: z.boolean().optional(), requiresSubscription: z.boolean().optional(), emergencyAccess: z.boolean().optional() });

export const insertStormSharePostSchema = createInsertSchema(stormSharePosts).omit({ id: true, createdAt: true, updatedAt: true }).extend({ isLive: z.boolean().optional(), isHelpRequest: z.boolean().optional(), isDonationRequest: z.boolean().optional(), isVerified: z.boolean().optional(), isFeatured: z.boolean().optional() });

export const insertStormShareInteractionSchema = createInsertSchema(stormShareInteractions).omit({ id: true, createdAt: true });

// Detection foundation insert schemas
export const insertDetectionJobSchema = createInsertSchema(detectionJobs).omit({ id: true, createdAt: true });
export const insertDetectionResultSchema = createInsertSchema(detectionResults).omit({ id: true, createdAt: true }).extend({
  confidence: z.number().min(0).max(100), // Numeric 0-100 percentage
  severityScore: z.number().min(0).max(10), // Numeric 0-10 scale
});

// Export types for the new schemas
export type AiDamageLead = typeof aiDamageLeads.$inferSelect;
export type InsertAiDamageLead = z.infer<typeof insertAiDamageLeadSchema>;
export type AiLeadAssignment = typeof aiLeadAssignments.$inferSelect;
export type InsertAiLeadAssignment = z.infer<typeof insertAiLeadAssignmentSchema>;
export type LiveStreamSource = typeof liveStreamSources.$inferSelect;
export type InsertLiveStreamSource = z.infer<typeof insertLiveStreamSourceSchema>;
export type StormSharePost = typeof stormSharePosts.$inferSelect;
export type InsertStormSharePost = z.infer<typeof insertStormSharePostSchema>;
export type StormShareInteraction = typeof stormShareInteractions.$inferSelect;
export type InsertStormShareInteraction = z.infer<typeof insertStormShareInteractionSchema>;

// Detection foundation types
export type DetectionJob = typeof detectionJobs.$inferSelect;
export type InsertDetectionJob = z.infer<typeof insertDetectionJobSchema>;
export type DetectionResult = typeof detectionResults.$inferSelect;
export type InsertDetectionResult = z.infer<typeof insertDetectionResultSchema>;
