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
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});
export const insertClaimSchema = createInsertSchema(claims).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertInsuranceCompanySchema = createInsertSchema(insuranceCompanies).omit({
  id: true,
  updatedAt: true,
});
export const insertLienRuleSchema = createInsertSchema(lienRules).omit({
  id: true,
  lastVerified: true,
}).extend({ 
  prelimNoticeRequired: z.boolean().optional() 
});
export const insertWeatherAlertSchema = createInsertSchema(weatherAlerts).omit({
  id: true,
  createdAt: true,
}).extend({ 
  isActive: z.boolean().optional() 
});
export const insertFieldReportSchema = createInsertSchema(fieldReports).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertDroneFootageSchema = createInsertSchema(droneFootage).omit({
  id: true,
  createdAt: true,
}).extend({ 
  isLive: z.boolean().optional() 
});
export const insertMarketComparableSchema = createInsertSchema(marketComparables).omit({
  id: true,
  lastUpdated: true,
});
export const insertAiInteractionSchema = createInsertSchema(aiInteractions).omit({
  id: true,
  createdAt: true,
});
export const insertDspFootageSchema = createInsertSchema(dspFootage).omit({
  id: true,
  createdAt: true,
  processedAt: true,
});
export const insertContractorDocumentSchema = createInsertSchema(contractorDocuments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({ 
  isActive: z.boolean().optional() 
});
export const insertLeadSchema = createInsertSchema(leads).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({ 
  isEmergencyRate: z.boolean().optional() 
});
export const insertJobCostSchema = createInsertSchema(jobCosts).omit({
  id: true,
  createdAt: true,
}).extend({ 
  oshaCompliance: z.boolean().optional(), 
  ansiCompliance: z.boolean().optional() 
});
export const insertPhotoSchema = createInsertSchema(photos).omit({
  id: true,
  createdAt: true,
}).extend({ 
  isProcessed: z.boolean().optional() 
});
export const insertXactimateComparableSchema = createInsertSchema(xactimateComparables).omit({
  id: true,
  createdAt: true,
});
export const insertClaimSubmissionSchema = createInsertSchema(claimSubmissions).omit({
  id: true,
  submittedAt: true,
  acknowledgedAt: true,
  responseReceived: true,
});
export const insertTrafficCameraSchema = createInsertSchema(trafficCameras).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastHealthCheck: true,
}).extend({ 
  isActive: z.boolean().optional() 
});
export const insertTrafficCamSubscriptionSchema = createInsertSchema(trafficCamSubscriptions).omit({
  id: true,
  createdAt: true,
}).extend({ 
  isActive: z.boolean().optional() 
});
export const insertTrafficCamAlertSchema = createInsertSchema(trafficCamAlerts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  verifiedAt: true,
}).extend({ 
  emergencyResponse: z.boolean().optional(), 
  leadGenerated: z.boolean().optional(), 
  isVerified: z.boolean().optional() 
});
export const insertTrafficCamLeadSchema = createInsertSchema(trafficCamLeads).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastContactedAt: true,
  arrivalTime: true,
  workStarted: true,
  workCompleted: true,
});
export const insertContractorWatchlistSchema = createInsertSchema(contractorWatchlist).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertStormHotZoneSchema = createInsertSchema(stormHotZones).omit({
  id: true,
  createdAt: true,
  lastUpdated: true,
});
export const insertHomeownerSchema = createInsertSchema(homeowners).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertDamageReportSchema = createInsertSchema(damageReports).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertServiceRequestSchema = createInsertSchema(serviceRequests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertEmergencyContactSchema = createInsertSchema(emergencyContacts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Predictive Storm AI schemas
export const insertStormPredictionSchema = createInsertSchema(stormPredictions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({ 
  validatedAgainstHistorical: z.boolean().optional() 
});
export const insertDamageForecastSchema = createInsertSchema(damageForecast).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertContractorOpportunityPredictionSchema = createInsertSchema(contractorOpportunityPredictions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertHistoricalDamagePatternSchema = createInsertSchema(historicalDamagePatterns).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({ 
  evacuationOrdered: z.boolean().optional() 
});
export const insertRadarAnalysisCacheSchema = createInsertSchema(radarAnalysisCache).omit({
  id: true,
  createdAt: true,
  processingTime: true,
  cacheExpiry: true,
});

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

// StormShare Community Groups
export const stormShareGroups = pgTable("storm_share_groups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'victims', 'contractors', 'business', 'general'
  slug: text("slug").notNull().unique(),
  description: text("description"),
  
  // Group settings
  isPrivate: boolean("is_private").default(false),
  requiresApproval: boolean("requires_approval").default(false),
  
  // Specialization (for contractor groups)
  specialization: text("specialization"), // 'roofing', 'tree_removal', 'water_damage', etc.
  serviceArea: text("service_area"), // Geographic coverage area
  
  // Visual
  avatarUrl: text("avatar_url"),
  bannerUrl: text("banner_url"),
  
  // Stats
  memberCount: integer("member_count").default(0),
  postCount: integer("post_count").default(0),
  
  // Moderation
  ownerId: varchar("owner_id").notNull(),
  moderatorIds: jsonb("moderator_ids").$type<string[]>(), // Array of user IDs
  rules: text("rules"), // Group rules/guidelines
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// StormShare Group Memberships
export const stormShareGroupMembers = pgTable("storm_share_group_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  groupId: varchar("group_id").notNull().references(() => stormShareGroups.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull(),
  
  role: text("role").default("member"), // 'owner', 'moderator', 'member'
  status: text("status").default("active"), // 'active', 'pending', 'banned'
  
  // Member info
  joinedAt: timestamp("joined_at").defaultNow(),
  lastActive: timestamp("last_active"),
  
  // Contractor-specific fields
  licenseNumber: text("license_number"),
  insuranceProvider: text("insurance_provider"),
  yearsExperience: integer("years_experience"),
  certifications: jsonb("certifications").$type<string[]>(),
  
}, (table) => ({
  // Unique membership per user per group
  uniq: unique().on(table.groupId, table.userId),
}));

// StormShare Real-time Messages
export const stormShareMessages = pgTable("storm_share_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Context - either in a group or on a post
  groupId: varchar("group_id"),
  postId: varchar("post_id"),
  
  // Message details
  userId: varchar("user_id").notNull(),
  content: text("content").notNull(),
  messageType: text("message_type").default("text"), // 'text', 'image', 'file', 'system'
  
  // Media/files
  mediaUrl: text("media_url"),
  fileName: text("file_name"),
  fileSize: integer("file_size"),
  
  // Threading
  parentMessageId: varchar("parent_message_id"), // For replies
  threadCount: integer("thread_count").default(0),
  
  // Status
  isEdited: boolean("is_edited").default(false),
  editedAt: timestamp("edited_at"),
  isDeleted: boolean("is_deleted").default(false),
  
  createdAt: timestamp("created_at").defaultNow(),
});

// Help Requests (separate from general posts for better lead tracking)
export const helpRequests = pgTable("help_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  
  // Request details
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(), // 'emergency', 'cleanup', 'repair', 'insurance', 'supplies'
  urgencyLevel: text("urgency_level").default("normal"), // 'emergency', 'urgent', 'high', 'normal'
  
  // Location
  address: text("address"),
  city: text("city"),
  state: text("state"),
  zipCode: text("zip_code"),
  latitude: numeric("latitude", { precision: 10, scale: 8 }),
  longitude: numeric("longitude", { precision: 10, scale: 8 }),
  
  // Insurance and payment
  hasInsurance: boolean("has_insurance"),
  insuranceCompany: text("insurance_company"),
  policyNumber: text("policy_number"),
  canPayImmediately: boolean("can_pay_immediately").default(false),
  budgetRange: text("budget_range"), // 'under_1k', '1k_5k', '5k_15k', '15k_plus'
  
  // Media evidence
  photoUrls: jsonb("photo_urls").$type<string[]>(),
  videoUrls: jsonb("video_urls").$type<string[]>(),
  
  // Status and assignment
  status: text("status").default("open"), // 'open', 'claimed', 'in_progress', 'resolved', 'cancelled'
  claimedByUserId: varchar("claimed_by_user_id"),
  claimedAt: timestamp("claimed_at"),
  resolvedAt: timestamp("resolved_at"),
  
  // Lead conversion
  leadId: varchar("lead_id"), // Reference to leads table when converted
  convertedAt: timestamp("converted_at"),
  
  // Contact preferences
  contactMethods: jsonb("contact_methods").$type<string[]>(), // ['phone', 'text', 'email']
  contactPhone: text("contact_phone"),
  contactEmail: text("contact_email"),
  preferredContactTime: text("preferred_contact_time"), // 'morning', 'afternoon', 'evening', 'anytime'
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Media Asset Management for StormShare
export const stormShareMediaAssets = pgTable("storm_share_media_assets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ownerId: varchar("owner_id").notNull(),
  
  // File details
  fileName: text("file_name").notNull(),
  originalName: text("original_name").notNull(),
  mimeType: text("mime_type").notNull(),
  fileSize: integer("file_size").notNull(),
  
  // Storage
  storageUrl: text("storage_url").notNull(),
  thumbnailUrl: text("thumbnail_url"), // For images/videos
  
  // Categorization
  assetType: text("asset_type").notNull(), // 'profile_photo', 'post_image', 'help_request_evidence', 'license_doc', 'insurance_cert'
  tags: jsonb("tags").$type<string[]>(),
  
  // Usage tracking
  isPublic: boolean("is_public").default(true),
  usageCount: integer("usage_count").default(0),
  lastUsed: timestamp("last_used"),
  
  // Moderation
  moderationStatus: text("moderation_status").default("pending"), // 'pending', 'approved', 'rejected', 'flagged'
  moderatedBy: varchar("moderated_by"),
  moderatedAt: timestamp("moderated_at"),
  
  createdAt: timestamp("created_at").defaultNow(),
});

// Advertising Campaigns for StormShare
export const stormShareAdCampaigns = pgTable("storm_share_ad_campaigns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Advertiser details
  advertiserName: text("advertiser_name").notNull(),
  contactEmail: text("contact_email").notNull(),
  contactPhone: text("contact_phone"),
  
  // Campaign details
  campaignName: text("campaign_name").notNull(),
  description: text("description"),
  
  // Targeting
  targetAudience: text("target_audience").default("all"), // 'all', 'victims', 'contractors', 'business'
  targetLocations: jsonb("target_locations").$type<string[]>(), // Array of states/cities
  targetCategories: jsonb("target_categories").$type<string[]>(), // Array of relevant categories
  
  // Creative assets
  creativeUrl: text("creative_url").notNull(),
  creativeType: text("creative_type").notNull(), // 'banner', 'video', 'carousel'
  linkUrl: text("link_url").notNull(),
  callToAction: text("call_to_action").default("Learn More"),
  
  // Budget and scheduling
  budgetCents: integer("budget_cents"), // Budget in cents
  dailyBudgetCents: integer("daily_budget_cents"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  
  // Performance tracking
  impressions: integer("impressions").default(0),
  clicks: integer("clicks").default(0),
  conversions: integer("conversions").default(0),
  spentCents: integer("spent_cents").default(0),
  
  // Status
  status: text("status").default("draft"), // 'draft', 'pending_approval', 'active', 'paused', 'completed', 'rejected'
  approvedBy: varchar("approved_by"),
  approvedAt: timestamp("approved_at"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

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

// ===== COMPREHENSIVE LEAD CAPTURE & MANAGEMENT SYSTEM =====

// 1. LEAD CAPTURE COMPONENTS

// Funnels for multi-step lead capture
export const funnels = pgTable("funnels", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  slug: text("slug").notNull().unique(),
  status: text("status").default("draft"), // draft, active, paused, archived
  
  // Configuration
  theme: text("theme").default("storm"), // storm, modern, classic
  primaryColor: text("primary_color").default("#1e40af"),
  backgroundColor: text("background_color").default("#ffffff"),
  fontFamily: text("font_family").default("Inter"),
  
  // SEO and Meta
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
  ogImage: text("og_image"),
  
  // Analytics
  views: integer("views").default(0),
  uniqueVisitors: integer("unique_visitors").default(0),
  conversionRate: numeric("conversion_rate", { precision: 5, scale: 2 }).default("0"),
  
  // Behavior settings
  pixelId: text("pixel_id"), // Facebook pixel ID
  gtmId: text("gtm_id"), // Google Tag Manager ID
  redirectUrl: text("redirect_url"), // Post-completion redirect
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Individual steps in a funnel
export const funnelSteps = pgTable("funnel_steps", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  funnelId: varchar("funnel_id").notNull().references(() => funnels.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  stepOrder: integer("step_order").notNull(),
  stepType: text("step_type").notNull(), // landing, form, survey, calendar, video, thank_you
  
  // Content
  headline: text("headline"),
  subheadline: text("subheadline"),
  bodyContent: text("body_content"),
  mediaUrl: text("media_url"), // Image or video
  buttonText: text("button_text").default("Next"),
  
  // Behavior
  autoAdvance: boolean("auto_advance").default(false),
  advanceDelay: integer("advance_delay").default(0), // seconds
  exitIntentPopup: boolean("exit_intent_popup").default(false),
  
  // Analytics
  views: integer("views").default(0),
  completions: integer("completions").default(0),
  dropOffs: integer("drop_offs").default(0),
  avgTimeOnStep: integer("avg_time_on_step").default(0), // seconds
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  uniqueStepOrder: unique().on(table.funnelId, table.stepOrder),
  uniqueSlug: unique().on(table.funnelId, table.slug),
}));

// Dynamic form builder
export const forms = pgTable("forms", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  funnelStepId: varchar("funnel_step_id").references(() => funnelSteps.id),
  
  // Form behavior
  allowMultipleSubmissions: boolean("allow_multiple_submissions").default(false),
  requiresApproval: boolean("requires_approval").default(false),
  
  // Notifications
  notificationEmails: jsonb("notification_emails").$type<string[]>(),
  sendConfirmationEmail: boolean("send_confirmation_email").default(true),
  confirmationEmailTemplate: text("confirmation_email_template"),
  
  // Integration
  webhookUrl: text("webhook_url"),
  crmIntegration: text("crm_integration"), // pipedrive, hubspot, salesforce
  crmMappings: jsonb("crm_mappings").$type<JsonObject>(),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Individual form fields
export const formFields = pgTable("form_fields", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  formId: varchar("form_id").notNull().references(() => forms.id, { onDelete: "cascade" }),
  fieldName: text("field_name").notNull(),
  fieldLabel: text("field_label").notNull(),
  fieldType: text("field_type").notNull(), // text, email, phone, select, radio, checkbox, file, signature
  fieldOrder: integer("field_order").notNull(),
  
  // Validation
  isRequired: boolean("is_required").default(false),
  validationRules: jsonb("validation_rules").$type<JsonObject>(), // regex, min/max length, etc.
  
  // Options for select/radio/checkbox
  fieldOptions: jsonb("field_options").$type<string[]>(),
  
  // Conditional logic
  conditionalLogic: jsonb("conditional_logic").$type<JsonObject>(), // Show/hide based on other fields
  
  // Styling
  placeholder: text("placeholder"),
  helpText: text("help_text"),
  cssClasses: text("css_classes"),
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  uniqueFieldOrder: unique().on(table.formId, table.fieldOrder),
}));

// Calendar booking system
export const calendarBookings = pgTable("calendar_bookings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  funnelStepId: varchar("funnel_step_id").references(() => funnelSteps.id),
  
  // Booking details
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  customerPhone: text("customer_phone"),
  
  // Appointment
  scheduledDate: timestamp("scheduled_date").notNull(),
  duration: integer("duration").default(30), // minutes
  timeZone: text("time_zone").notNull(),
  appointmentType: text("appointment_type").notNull(), // consultation, estimate, inspection
  
  // Status
  status: text("status").default("scheduled"), // scheduled, confirmed, cancelled, completed, no_show
  
  // Integration
  googleCalendarEventId: text("google_calendar_event_id"),
  outlookCalendarEventId: text("outlook_calendar_event_id"),
  zoomMeetingUrl: text("zoom_meeting_url"),
  
  // Notes
  customerNotes: text("customer_notes"),
  internalNotes: text("internal_notes"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Survey builder with conditional logic
export const surveys = pgTable("surveys", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  funnelStepId: varchar("funnel_step_id").references(() => funnelSteps.id),
  
  // Survey behavior
  allowMultipleResponses: boolean("allow_multiple_responses").default(false),
  showProgressBar: boolean("show_progress_bar").default(true),
  randomizeQuestions: boolean("randomize_questions").default(false),
  
  // Completion
  thankyouMessage: text("thankyou_message"),
  redirectUrl: text("redirect_url"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Individual survey questions
export const surveyQuestions = pgTable("survey_questions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  surveyId: varchar("survey_id").notNull().references(() => surveys.id, { onDelete: "cascade" }),
  questionText: text("question_text").notNull(),
  questionType: text("question_type").notNull(), // multiple_choice, single_choice, text, rating, yes_no
  questionOrder: integer("question_order").notNull(),
  
  // Options for choice questions
  options: jsonb("options").$type<string[]>(),
  
  // Validation
  isRequired: boolean("is_required").default(false),
  
  // Conditional logic
  conditionalLogic: jsonb("conditional_logic").$type<JsonObject>(),
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  uniqueQuestionOrder: unique().on(table.surveyId, table.questionOrder),
}));

// Chat widget configuration
export const chatWidgets = pgTable("chat_widgets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  
  // Appearance
  primaryColor: text("primary_color").default("#1e40af"),
  position: text("position").default("bottom-right"), // bottom-right, bottom-left, etc.
  widgetTheme: text("widget_theme").default("modern"),
  
  // Behavior
  welcomeMessage: text("welcome_message").default("Hi! How can we help you?"),
  autoOpenDelay: integer("auto_open_delay").default(0), // seconds, 0 = no auto open
  showOnPages: jsonb("show_on_pages").$type<string[]>(), // URL patterns
  hideOnPages: jsonb("hide_on_pages").$type<string[]>(),
  
  // Business hours
  operatingHours: jsonb("operating_hours").$type<JsonObject>(),
  offlineMessage: text("offline_message"),
  
  // Integration
  slackWebhook: text("slack_webhook"),
  emailNotifications: jsonb("email_notifications").$type<string[]>(),
  
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// SMS/MMS campaigns
export const smsCampaigns = pgTable("sms_campaigns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  campaignType: text("campaign_type").notNull(), // opt_in, drip, broadcast, automated
  
  // Content
  messageContent: text("message_content").notNull(),
  mediaUrls: jsonb("media_urls").$type<string[]>(), // For MMS
  
  // Targeting
  keywords: jsonb("keywords").$type<string[]>(), // Keywords that trigger opt-in
  audienceSegment: text("audience_segment"), // all, new_leads, existing_customers, etc.
  
  // Scheduling
  scheduleType: text("schedule_type").default("immediate"), // immediate, scheduled, drip
  scheduledDate: timestamp("scheduled_date"),
  dripDelay: integer("drip_delay"), // hours between messages
  
  // Status
  status: text("status").default("draft"), // draft, scheduled, sending, sent, cancelled
  
  // Analytics
  messagesSent: integer("messages_sent").default(0),
  delivered: integer("delivered").default(0),
  replied: integer("replied").default(0),
  optOuts: integer("opt_outs").default(0),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Call tracking numbers
export const callTrackingNumbers = pgTable("call_tracking_numbers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  phoneNumber: text("phone_number").notNull().unique(),
  friendlyName: text("friendly_name").notNull(),
  
  // Routing
  forwardToNumber: text("forward_to_number").notNull(),
  businessHours: jsonb("business_hours").$type<JsonObject>(),
  afterHoursAction: text("after_hours_action").default("voicemail"), // voicemail, forward, disconnect
  afterHoursNumber: text("after_hours_number"),
  
  // Features
  recordCalls: boolean("record_calls").default(true),
  transcribeCalls: boolean("transcribe_calls").default(true),
  smsEnabled: boolean("sms_enabled").default(true),
  
  // Analytics
  callsReceived: integer("calls_received").default(0),
  missedCalls: integer("missed_calls").default(0),
  avgCallDuration: integer("avg_call_duration").default(0), // seconds
  
  // Attribution
  source: text("source"), // google_ads, facebook_ads, organic, direct
  campaign: text("campaign"),
  
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// 2. LEAD NURTURE COMPONENTS

// Automated workflow builder
export const workflows = pgTable("workflows", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  triggerType: text("trigger_type").notNull(), // form_submit, tag_added, date_based, behavior_based
  triggerConditions: jsonb("trigger_conditions").$type<JsonObject>(),
  
  // Behavior
  isActive: boolean("is_active").default(true),
  runOnWeekends: boolean("run_on_weekends").default(true),
  respectBusinessHours: boolean("respect_business_hours").default(false),
  
  // Analytics
  totalEnrollments: integer("total_enrollments").default(0),
  completedRuns: integer("completed_runs").default(0),
  currentlyActive: integer("currently_active").default(0),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Individual steps in workflows
export const workflowSteps = pgTable("workflow_steps", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workflowId: varchar("workflow_id").notNull().references(() => workflows.id, { onDelete: "cascade" }),
  stepName: text("step_name").notNull(),
  stepType: text("step_type").notNull(), // email, sms, call, wait, condition, tag_action
  stepOrder: integer("step_order").notNull(),
  
  // Action configuration
  actionConfig: jsonb("action_config").$type<JsonObject>(), // Step-specific settings
  
  // Conditional logic
  conditions: jsonb("conditions").$type<JsonObject>(), // For branching logic
  
  // Timing
  delayAmount: integer("delay_amount").default(0),
  delayUnit: text("delay_unit").default("minutes"), // minutes, hours, days
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  uniqueStepOrder: unique().on(table.workflowId, table.stepOrder),
}));

// Email campaign templates
export const emailTemplates = pgTable("email_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  subject: text("subject").notNull(),
  htmlContent: text("html_content").notNull(),
  textContent: text("text_content"),
  
  // Template type
  templateType: text("template_type").default("marketing"), // marketing, transactional, notification
  
  // Design
  template: text("template").default("default"), // default, newsletter, promotional
  
  // Variables
  variables: jsonb("variables").$type<string[]>(), // {{firstName}}, {{companyName}}, etc.
  
  // Testing
  testVersion: text("test_version"), // A/B testing
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Email campaigns
export const emailCampaigns = pgTable("email_campaigns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  templateId: varchar("template_id").references(() => emailTemplates.id),
  campaignType: text("campaign_type").notNull(), // broadcast, drip, automated
  
  // Targeting
  audienceSegment: text("audience_segment"),
  audienceSize: integer("audience_size").default(0),
  
  // Scheduling
  scheduleType: text("schedule_type").default("immediate"), // immediate, scheduled
  scheduledDate: timestamp("scheduled_date"),
  
  // Status
  status: text("status").default("draft"), // draft, scheduled, sending, sent, cancelled
  
  // Analytics
  emailsSent: integer("emails_sent").default(0),
  delivered: integer("delivered").default(0),
  opened: integer("opened").default(0),
  clicked: integer("clicked").default(0),
  unsubscribed: integer("unsubscribed").default(0),
  bounced: integer("bounced").default(0),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Voicemail drops
export const voicemailDrops = pgTable("voicemail_drops", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  audioFileUrl: text("audio_file_url").notNull(),
  
  // Campaign settings
  campaignType: text("campaign_type").default("broadcast"), // broadcast, drip, automated
  audienceSegment: text("audience_segment"),
  
  // Scheduling
  scheduleType: text("schedule_type").default("immediate"),
  scheduledDate: timestamp("scheduled_date"),
  
  // Analytics
  dropsSent: integer("drops_sent").default(0),
  delivered: integer("delivered").default(0),
  listened: integer("listened").default(0),
  callBacks: integer("call_backs").default(0),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Social DM campaigns
export const socialCampaigns = pgTable("social_campaigns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  platform: text("platform").notNull(), // facebook, instagram, gmb, linkedin
  messageContent: text("message_content").notNull(),
  
  // Targeting
  audienceSegment: text("audience_segment"),
  
  // Scheduling
  scheduleType: text("schedule_type").default("immediate"),
  scheduledDate: timestamp("scheduled_date"),
  
  // Status
  status: text("status").default("draft"),
  
  // Analytics
  messagesSent: integer("messages_sent").default(0),
  delivered: integer("delivered").default(0),
  replied: integer("replied").default(0),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// AI Chatbot configuration
export const chatbots = pgTable("chatbots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  
  // AI Configuration
  aiModel: text("ai_model").default("gpt-3.5-turbo"), // gpt-3.5-turbo, gpt-4, claude
  systemPrompt: text("system_prompt").notNull(),
  temperature: numeric("temperature", { precision: 3, scale: 2 }).default("0.7"),
  maxTokens: integer("max_tokens").default(150),
  
  // Knowledge Base
  knowledgeBase: text("knowledge_base"), // URL to knowledge base or training data
  fallbackMessage: text("fallback_message").default("I'm not sure about that. Let me connect you with a human."),
  
  // Integration
  channels: jsonb("channels").$type<string[]>(), // website, facebook, sms
  
  // Analytics
  totalInteractions: integer("total_interactions").default(0),
  resolvedQueries: integer("resolved_queries").default(0),
  escalatedToHuman: integer("escalated_to_human").default(0),
  avgSatisfactionScore: numeric("avg_satisfaction_score", { precision: 3, scale: 2 }),
  
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// 3. CRM & PIPELINE COMPONENTS

// Lead tags for segmentation
export const leadTags = pgTable("lead_tags", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  leadId: varchar("lead_id").notNull().references(() => leads.id, { onDelete: "cascade" }),
  tagName: text("tag_name").notNull(),
  tagColor: text("tag_color").default("#blue"),
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  uniqueLeadTag: unique().on(table.leadId, table.tagName),
}));

// Pipeline stages
export const pipelineStages = pgTable("pipeline_stages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  stageOrder: integer("stage_order").notNull(),
  stageColor: text("stage_color").default("#gray"),
  
  // Behavior
  isClosedWon: boolean("is_closed_won").default(false),
  isClosedLost: boolean("is_closed_lost").default(false),
  requiresApproval: boolean("requires_approval").default(false),
  
  // Analytics
  avgTimeInStage: integer("avg_time_in_stage").default(0), // days
  conversionRate: numeric("conversion_rate", { precision: 5, scale: 2 }).default("0"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  uniqueStageOrder: unique().on(table.stageOrder),
}));

// Business opportunities/deals
export const opportunities = pgTable("opportunities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  leadId: varchar("lead_id").references(() => leads.id),
  name: text("name").notNull(),
  
  // Value and probability
  value: numeric("value", { precision: 10, scale: 2 }).notNull(),
  probability: integer("probability").default(50), // percentage 0-100
  expectedCloseDate: timestamp("expected_close_date"),
  
  // Pipeline
  stageId: varchar("stage_id").references(() => pipelineStages.id),
  
  // Details
  source: text("source"), // referral, website, advertising
  competitorInfo: text("competitor_info"),
  decisionMakers: jsonb("decision_makers").$type<string[]>(),
  
  // Status
  status: text("status").default("open"), // open, closed_won, closed_lost
  closeReason: text("close_reason"),
  
  // Analytics
  daysInPipeline: integer("days_in_pipeline").default(0),
  lastActivityDate: timestamp("last_activity_date"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Task and reminder system
export const tasks = pgTable("tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  
  // Assignment
  assignedTo: varchar("assigned_to"), // User ID
  leadId: varchar("lead_id").references(() => leads.id),
  opportunityId: varchar("opportunity_id").references(() => opportunities.id),
  
  // Scheduling
  dueDate: timestamp("due_date"),
  priority: text("priority").default("medium"), // low, medium, high, urgent
  
  // Status
  status: text("status").default("pending"), // pending, in_progress, completed, cancelled
  completedAt: timestamp("completed_at"),
  
  // Reminders
  reminderType: text("reminder_type"), // email, sms, push
  reminderTime: timestamp("reminder_time"),
  reminderSent: boolean("reminder_sent").default(false),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// 4. COMMUNICATION COMPONENTS

// Unified inbox messages
export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Message details
  channel: text("channel").notNull(), // email, sms, chat, social, phone
  direction: text("direction").notNull(), // inbound, outbound
  
  // Sender/Recipient
  fromContact: text("from_contact").notNull(),
  toContact: text("to_contact").notNull(),
  leadId: varchar("lead_id").references(() => leads.id),
  
  // Content
  subject: text("subject"), // For email
  content: text("content").notNull(),
  attachments: jsonb("attachments").$type<string[]>(),
  
  // Status
  status: text("status").default("unread"), // unread, read, replied, archived
  isImportant: boolean("is_important").default(false),
  
  // Integration IDs
  externalId: text("external_id"), // Third-party message ID
  threadId: text("thread_id"), // For grouping messages
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Call logs and recordings
export const callLogs = pgTable("call_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Call details
  phoneNumber: text("phone_number").notNull(),
  direction: text("direction").notNull(), // inbound, outbound
  duration: integer("duration").default(0), // seconds
  
  // Associated records
  leadId: varchar("lead_id").references(() => leads.id),
  opportunityId: varchar("opportunity_id").references(() => opportunities.id),
  trackingNumberId: varchar("tracking_number_id").references(() => callTrackingNumbers.id),
  
  // Call outcome
  outcome: text("outcome"), // answered, voicemail, busy, no_answer, failed
  disposition: text("disposition"), // interested, not_interested, callback, appointment_set
  notes: text("notes"),
  
  // Recording
  recordingUrl: text("recording_url"),
  transcription: text("transcription"),
  transcriptionConfidence: numeric("transcription_confidence", { precision: 3, scale: 2 }),
  
  // Analytics
  callCost: numeric("call_cost", { precision: 8, scale: 4 }),
  
  createdAt: timestamp("created_at").defaultNow(),
});

// Power dialer campaigns
export const dialerCampaigns = pgTable("dialer_campaigns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  
  // Campaign settings
  dialMode: text("dial_mode").default("progressive"), // preview, progressive, predictive
  maxDialAttempts: integer("max_dial_attempts").default(3),
  callInterval: integer("call_interval").default(15), // seconds between calls
  
  // Lists and targeting
  contactLists: jsonb("contact_lists").$type<string[]>(),
  audienceSegment: text("audience_segment"),
  
  // Scheduling
  scheduleType: text("schedule_type").default("immediate"),
  scheduledDate: timestamp("scheduled_date"),
  businessHoursOnly: boolean("business_hours_only").default(true),
  
  // Voicemail settings
  dropVoicemail: boolean("drop_voicemail").default(true),
  voicemailAudioUrl: text("voicemail_audio_url"),
  
  // Status
  status: text("status").default("draft"), // draft, scheduled, active, paused, completed
  
  // Analytics
  totalCalls: integer("total_calls").default(0),
  connectedCalls: integer("connected_calls").default(0),
  voicemails: integer("voicemails").default(0),
  appointments: integer("appointments").default(0),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Two-way text conversations
export const textConversations = pgTable("text_conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Participants
  leadPhoneNumber: text("lead_phone_number").notNull(),
  businessPhoneNumber: text("business_phone_number").notNull(),
  leadId: varchar("lead_id").references(() => leads.id),
  
  // Conversation details
  lastMessage: text("last_message"),
  lastMessageAt: timestamp("last_message_at"),
  messageCount: integer("message_count").default(0),
  
  // Status
  status: text("status").default("active"), // active, archived, blocked
  isUnread: boolean("is_unread").default(false),
  
  // Assignment
  assignedTo: varchar("assigned_to"), // User ID
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// 5. ANALYTICS & REPORTING COMPONENTS

// Analytics events tracking
export const analyticsEvents = pgTable("analytics_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Event details
  eventType: text("event_type").notNull(), // page_view, form_submit, email_open, call_start, etc.
  eventCategory: text("event_category").notNull(), // funnel, email, call, sms
  
  // Associated records
  leadId: varchar("lead_id").references(() => leads.id),
  funnelId: varchar("funnel_id").references(() => funnels.id),
  campaignId: text("campaign_id"), // Generic campaign reference
  
  // Event data
  eventData: jsonb("event_data").$type<JsonObject>(),
  eventValue: numeric("event_value", { precision: 10, scale: 2 }),
  
  // Session/user tracking
  sessionId: text("session_id"),
  userId: text("user_id"),
  anonymousId: text("anonymous_id"),
  
  // Technical details
  userAgent: text("user_agent"),
  ipAddress: text("ip_address"),
  referrer: text("referrer"),
  
  createdAt: timestamp("created_at").defaultNow(),
});

// Performance metrics aggregation
export const performanceMetrics = pgTable("performance_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Time period
  date: timestamp("date").notNull(),
  granularity: text("granularity").notNull(), // hourly, daily, weekly, monthly
  
  // Metric category
  category: text("category").notNull(), // leads, calls, emails, sms, revenue
  
  // Metrics
  metrics: jsonb("metrics").$type<JsonObject>(), // Flexible metric storage
  
  // Aggregation metadata
  recordCount: integer("record_count").default(0),
  lastCalculated: timestamp("last_calculated").defaultNow(),
}, (table) => ({
  uniqueMetric: unique().on(table.date, table.granularity, table.category),
}));

// Revenue forecasting
export const revenueForecasts = pgTable("revenue_forecasts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Forecast period
  forecastMonth: text("forecast_month").notNull(), // YYYY-MM format
  forecastYear: integer("forecast_year").notNull(),
  
  // Forecast data
  pipelineValue: numeric("pipeline_value", { precision: 12, scale: 2 }).notNull(),
  weightedValue: numeric("weighted_value", { precision: 12, scale: 2 }).notNull(),
  conservativeEstimate: numeric("conservative_estimate", { precision: 12, scale: 2 }).notNull(),
  optimisticEstimate: numeric("optimistic_estimate", { precision: 12, scale: 2 }).notNull(),
  
  // Confidence and methodology
  confidenceLevel: integer("confidence_level").default(80), // percentage
  modelUsed: text("model_used").default("linear_regression"),
  
  // Actual results (filled in later)
  actualRevenue: numeric("actual_revenue", { precision: 12, scale: 2 }),
  accuracyScore: numeric("accuracy_score", { precision: 5, scale: 2 }),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  uniqueForecast: unique().on(table.forecastMonth, table.forecastYear),
}));

// 6. AUTOMATION & AI ADD-ONS

// AI configuration and responses
export const aiConfigurations = pgTable("ai_configurations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  configType: text("config_type").notNull(), // lead_scoring, response_generation, content_optimization
  
  // AI model settings
  provider: text("provider").default("openai"), // openai, anthropic, cohere
  model: text("model").default("gpt-3.5-turbo"),
  apiKey: text("api_key"), // Encrypted
  
  // Configuration
  systemPrompt: text("system_prompt"),
  temperature: numeric("temperature", { precision: 3, scale: 2 }).default("0.7"),
  maxTokens: integer("max_tokens").default(300),
  
  // Usage tracking
  requestsThisMonth: integer("requests_this_month").default(0),
  tokensUsedThisMonth: integer("tokens_used_this_month").default(0),
  estimatedCostThisMonth: numeric("estimated_cost_this_month", { precision: 8, scale: 4 }).default("0"),
  
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Workflow trigger definitions
export const workflowTriggers = pgTable("workflow_triggers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  
  // Trigger definition
  triggerType: text("trigger_type").notNull(), // event_based, time_based, behavior_based
  eventType: text("event_type"), // form_submit, email_open, call_end, etc.
  conditions: jsonb("conditions").$type<JsonObject>(),
  
  // Associated workflow
  workflowId: varchar("workflow_id").references(() => workflows.id),
  
  // Status
  isActive: boolean("is_active").default(true),
  
  // Analytics
  totalTriggers: integer("total_triggers").default(0),
  successfulRuns: integer("successful_runs").default(0),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// E-signature documents and tracking
export const signatures = pgTable("signatures", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Document details
  documentName: text("document_name").notNull(),
  documentUrl: text("document_url").notNull(),
  templateId: text("template_id"), // DocuSign, HelloSign template ID
  
  // Associated records
  leadId: varchar("lead_id").references(() => leads.id),
  opportunityId: varchar("opportunity_id").references(() => opportunities.id),
  
  // Signers
  signerEmail: text("signer_email").notNull(),
  signerName: text("signer_name").notNull(),
  
  // Status
  status: text("status").default("sent"), // sent, viewed, signed, completed, declined, expired
  sentDate: timestamp("sent_date").defaultNow(),
  viewedDate: timestamp("viewed_date"),
  signedDate: timestamp("signed_date"),
  expirationDate: timestamp("expiration_date"),
  
  // Integration
  externalSignatureId: text("external_signature_id"), // Third-party service ID
  signedDocumentUrl: text("signed_document_url"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Payment links and invoice tracking
export const paymentLinks = pgTable("payment_links", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Link details
  linkName: text("link_name").notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").default("USD"),
  description: text("description"),
  
  // Associated records
  leadId: varchar("lead_id").references(() => leads.id),
  opportunityId: varchar("opportunity_id").references(() => opportunities.id),
  invoiceId: varchar("invoice_id").references(() => invoices.id),
  
  // Link configuration
  linkUrl: text("link_url").notNull(),
  isRecurring: boolean("is_recurring").default(false),
  recurringInterval: text("recurring_interval"), // monthly, yearly
  
  // Status
  status: text("status").default("active"), // active, paid, expired, cancelled
  
  // Payment details
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  paidAmount: numeric("paid_amount", { precision: 10, scale: 2 }),
  paidDate: timestamp("paid_date"),
  
  // Expiration
  expirationDate: timestamp("expiration_date"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ===== INSERT SCHEMAS FOR COMPREHENSIVE LEAD CAPTURE SYSTEM =====

// 1. Lead Capture Component Insert Schemas
export const insertFunnelSchema = createInsertSchema(funnels).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertFunnelStepSchema = createInsertSchema(funnelSteps).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertFormSchema = createInsertSchema(forms).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertFormFieldSchema = createInsertSchema(formFields).omit({
  id: true,
  createdAt: true,
});

export const insertCalendarBookingSchema = createInsertSchema(calendarBookings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSurveySchema = createInsertSchema(surveys).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSurveyQuestionSchema = createInsertSchema(surveyQuestions).omit({
  id: true,
  createdAt: true,
});

export const insertChatWidgetSchema = createInsertSchema(chatWidgets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSmsCampaignSchema = createInsertSchema(smsCampaigns).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCallTrackingNumberSchema = createInsertSchema(callTrackingNumbers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// 2. Lead Nurture Component Insert Schemas
export const insertWorkflowSchema = createInsertSchema(workflows).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWorkflowStepSchema = createInsertSchema(workflowSteps).omit({
  id: true,
  createdAt: true,
});

export const insertEmailTemplateSchema = createInsertSchema(emailTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEmailCampaignSchema = createInsertSchema(emailCampaigns).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertVoicemailDropSchema = createInsertSchema(voicemailDrops).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSocialCampaignSchema = createInsertSchema(socialCampaigns).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertChatbotSchema = createInsertSchema(chatbots).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// 3. CRM & Pipeline Component Insert Schemas
export const insertLeadTagSchema = createInsertSchema(leadTags).omit({
  id: true,
  createdAt: true,
});

export const insertPipelineStageSchema = createInsertSchema(pipelineStages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOpportunitySchema = createInsertSchema(opportunities).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  completedAt: true,
});

// 4. Communication Component Insert Schemas
export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCallLogSchema = createInsertSchema(callLogs).omit({
  id: true,
  createdAt: true,
});

export const insertDialerCampaignSchema = createInsertSchema(dialerCampaigns).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTextConversationSchema = createInsertSchema(textConversations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// 5. Analytics & Reporting Component Insert Schemas
export const insertAnalyticsEventSchema = createInsertSchema(analyticsEvents).omit({
  id: true,
  createdAt: true,
});

export const insertPerformanceMetricSchema = createInsertSchema(performanceMetrics).omit({
  id: true,
});

export const insertRevenueForecastSchema = createInsertSchema(revenueForecasts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// 6. Automation & AI Add-On Insert Schemas
export const insertAiConfigurationSchema = createInsertSchema(aiConfigurations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWorkflowTriggerSchema = createInsertSchema(workflowTriggers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSignatureSchema = createInsertSchema(signatures).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  sentDate: true,
});

export const insertPaymentLinkSchema = createInsertSchema(paymentLinks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Insert schemas for the new tables
export const insertAiDamageLeadSchema = createInsertSchema(aiDamageLeads).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  verifiedAt: true,
});

export const insertAiLeadAssignmentSchema = createInsertSchema(aiLeadAssignments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  assignedAt: true,
  acceptedAt: true,
  completedAt: true,
  lastContactAt: true,
}).extend({ 
  responseReceived: z.boolean().optional() 
});

export const insertLiveStreamSourceSchema = createInsertSchema(liveStreamSources).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastChecked: true,
}).extend({ 
  isActive: z.boolean().optional(), 
  requiresSubscription: z.boolean().optional(), 
  emergencyAccess: z.boolean().optional() 
});

export const insertStormSharePostSchema = createInsertSchema(stormSharePosts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({ 
  isLive: z.boolean().optional(), 
  isHelpRequest: z.boolean().optional(), 
  isDonationRequest: z.boolean().optional(), 
  isVerified: z.boolean().optional(), 
  isFeatured: z.boolean().optional() 
});

export const insertStormShareInteractionSchema = createInsertSchema(stormShareInteractions).omit({
  id: true,
  createdAt: true,
});

// StormShare Community insert schemas
export const insertStormShareGroupSchema = createInsertSchema(stormShareGroups).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  isPrivate: z.boolean().optional(),
  requiresApproval: z.boolean().optional(),
});

export const insertStormShareGroupMemberSchema = createInsertSchema(stormShareGroupMembers).omit({
  id: true,
  joinedAt: true,
});

export const insertStormShareMessageSchema = createInsertSchema(stormShareMessages).omit({
  id: true,
  createdAt: true,
}).extend({
  isEdited: z.boolean().optional(),
  isDeleted: z.boolean().optional(),
});

export const insertHelpRequestSchema = createInsertSchema(helpRequests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  hasInsurance: z.boolean().optional(),
  canPayImmediately: z.boolean().optional(),
});

export const insertStormShareMediaAssetSchema = createInsertSchema(stormShareMediaAssets).omit({
  id: true,
  createdAt: true,
}).extend({
  isPublic: z.boolean().optional(),
});

export const insertStormShareAdCampaignSchema = createInsertSchema(stormShareAdCampaigns).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Detection foundation insert schemas
export const insertDetectionJobSchema = createInsertSchema(detectionJobs).omit({
  id: true,
  createdAt: true,
});
export const insertDetectionResultSchema = createInsertSchema(detectionResults).omit({
  id: true,
  createdAt: true,
}).extend({
  confidence: z.number().min(0).max(100), // Numeric 0-100 percentage
  severityScore: z.number().min(0).max(10), // Numeric 0-10 scale
});

// ===== TYPE EXPORTS FOR COMPREHENSIVE LEAD CAPTURE SYSTEM =====

// 1. Lead Capture Component Types
export type Funnel = typeof funnels.$inferSelect;
export type InsertFunnel = z.infer<typeof insertFunnelSchema>;
export type FunnelStep = typeof funnelSteps.$inferSelect;
export type InsertFunnelStep = z.infer<typeof insertFunnelStepSchema>;
export type Form = typeof forms.$inferSelect;
export type InsertForm = z.infer<typeof insertFormSchema>;
export type FormField = typeof formFields.$inferSelect;
export type InsertFormField = z.infer<typeof insertFormFieldSchema>;
export type CalendarBooking = typeof calendarBookings.$inferSelect;
export type InsertCalendarBooking = z.infer<typeof insertCalendarBookingSchema>;
export type Survey = typeof surveys.$inferSelect;
export type InsertSurvey = z.infer<typeof insertSurveySchema>;
export type SurveyQuestion = typeof surveyQuestions.$inferSelect;
export type InsertSurveyQuestion = z.infer<typeof insertSurveyQuestionSchema>;
export type ChatWidget = typeof chatWidgets.$inferSelect;
export type InsertChatWidget = z.infer<typeof insertChatWidgetSchema>;
export type SmsCampaign = typeof smsCampaigns.$inferSelect;
export type InsertSmsCampaign = z.infer<typeof insertSmsCampaignSchema>;
export type CallTrackingNumber = typeof callTrackingNumbers.$inferSelect;
export type InsertCallTrackingNumber = z.infer<typeof insertCallTrackingNumberSchema>;

// 2. Lead Nurture Component Types
export type Workflow = typeof workflows.$inferSelect;
export type InsertWorkflow = z.infer<typeof insertWorkflowSchema>;
export type WorkflowStep = typeof workflowSteps.$inferSelect;
export type InsertWorkflowStep = z.infer<typeof insertWorkflowStepSchema>;
export type EmailTemplate = typeof emailTemplates.$inferSelect;
export type InsertEmailTemplate = z.infer<typeof insertEmailTemplateSchema>;
export type EmailCampaign = typeof emailCampaigns.$inferSelect;
export type InsertEmailCampaign = z.infer<typeof insertEmailCampaignSchema>;
export type VoicemailDrop = typeof voicemailDrops.$inferSelect;
export type InsertVoicemailDrop = z.infer<typeof insertVoicemailDropSchema>;
export type SocialCampaign = typeof socialCampaigns.$inferSelect;
export type InsertSocialCampaign = z.infer<typeof insertSocialCampaignSchema>;
export type Chatbot = typeof chatbots.$inferSelect;
export type InsertChatbot = z.infer<typeof insertChatbotSchema>;

// 3. CRM & Pipeline Component Types
export type LeadTag = typeof leadTags.$inferSelect;
export type InsertLeadTag = z.infer<typeof insertLeadTagSchema>;
export type PipelineStage = typeof pipelineStages.$inferSelect;
export type InsertPipelineStage = z.infer<typeof insertPipelineStageSchema>;
export type Opportunity = typeof opportunities.$inferSelect;
export type InsertOpportunity = z.infer<typeof insertOpportunitySchema>;
export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;

// 4. Communication Component Types
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type CallLog = typeof callLogs.$inferSelect;
export type InsertCallLog = z.infer<typeof insertCallLogSchema>;
export type DialerCampaign = typeof dialerCampaigns.$inferSelect;
export type InsertDialerCampaign = z.infer<typeof insertDialerCampaignSchema>;
export type TextConversation = typeof textConversations.$inferSelect;
export type InsertTextConversation = z.infer<typeof insertTextConversationSchema>;

// 5. Analytics & Reporting Component Types
export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;
export type InsertAnalyticsEvent = z.infer<typeof insertAnalyticsEventSchema>;
export type PerformanceMetric = typeof performanceMetrics.$inferSelect;
export type InsertPerformanceMetric = z.infer<typeof insertPerformanceMetricSchema>;
export type RevenueForecast = typeof revenueForecasts.$inferSelect;
export type InsertRevenueForecast = z.infer<typeof insertRevenueForecastSchema>;

// 6. Automation & AI Add-On Component Types
export type AiConfiguration = typeof aiConfigurations.$inferSelect;
export type InsertAiConfiguration = z.infer<typeof insertAiConfigurationSchema>;
export type WorkflowTrigger = typeof workflowTriggers.$inferSelect;
export type InsertWorkflowTrigger = z.infer<typeof insertWorkflowTriggerSchema>;
export type Signature = typeof signatures.$inferSelect;
export type InsertSignature = z.infer<typeof insertSignatureSchema>;
export type PaymentLink = typeof paymentLinks.$inferSelect;
export type InsertPaymentLink = z.infer<typeof insertPaymentLinkSchema>;

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
export type StormShareGroup = typeof stormShareGroups.$inferSelect;
export type InsertStormShareGroup = z.infer<typeof insertStormShareGroupSchema>;
export type StormShareGroupMember = typeof stormShareGroupMembers.$inferSelect;
export type InsertStormShareGroupMember = z.infer<typeof insertStormShareGroupMemberSchema>;
export type StormShareMessage = typeof stormShareMessages.$inferSelect;
export type InsertStormShareMessage = z.infer<typeof insertStormShareMessageSchema>;
export type HelpRequest = typeof helpRequests.$inferSelect;
export type InsertHelpRequest = z.infer<typeof insertHelpRequestSchema>;
export type StormShareMediaAsset = typeof stormShareMediaAssets.$inferSelect;
export type InsertStormShareMediaAsset = z.infer<typeof insertStormShareMediaAssetSchema>;
export type StormShareAdCampaign = typeof stormShareAdCampaigns.$inferSelect;
export type InsertStormShareAdCampaign = z.infer<typeof insertStormShareAdCampaignSchema>;

// ===== DISASTER ESSENTIALS MARKETPLACE (DEM) SCHEMAS =====

// Hotels & Campgrounds
export const demHotels = pgTable("dem_hotels", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'hotel', 'motel', 'campground', 'rv_park'
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zipCode: text("zip_code").notNull(),
  latitude: numeric("latitude", { precision: 10, scale: 8 }),
  longitude: numeric("longitude", { precision: 10, scale: 8 }),
  phone: text("phone"),
  website: text("website"),
  pricePerNight: numeric("price_per_night", { precision: 10, scale: 2 }),
  discountRate: numeric("discount_rate", { precision: 5, scale: 2 }), // Percentage discount
  availableRooms: integer("available_rooms"),
  totalRooms: integer("total_rooms"),
  isOpen: boolean("is_open").default(true),
  amenities: jsonb("amenities").$type<string[]>(),
  lastUpdated: timestamp("last_updated").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Gas Stations & Fuel Prices
export const demGasStations = pgTable("dem_gas_stations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  brand: text("brand"), // 'Shell', 'Exxon', 'BP', etc.
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zipCode: text("zip_code").notNull(),
  latitude: numeric("latitude", { precision: 10, scale: 8 }),
  longitude: numeric("longitude", { precision: 10, scale: 8 }),
  phone: text("phone"),
  regularPrice: numeric("regular_price", { precision: 5, scale: 3 }),
  premiumPrice: numeric("premium_price", { precision: 5, scale: 3 }),
  dieselPrice: numeric("diesel_price", { precision: 5, scale: 3 }),
  isOpen: boolean("is_open").default(true),
  hasAvailability: boolean("has_availability").default(true),
  hours: text("hours"),
  lastUpdated: timestamp("last_updated").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Hardware Stores & Supplies
export const demHardwareStores = pgTable("dem_hardware_stores", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  chain: text("chain"), // 'Home Depot', 'Lowe's', 'Tractor Supply', 'Local'
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zipCode: text("zip_code").notNull(),
  latitude: numeric("latitude", { precision: 10, scale: 8 }),
  longitude: numeric("longitude", { precision: 10, scale: 8 }),
  phone: text("phone"),
  website: text("website"),
  isOpen: boolean("is_open").default(true),
  inventory: jsonb("inventory").$type<{
    chainsawChains: { available: boolean; price?: number };
    barOil: { available: boolean; price?: number };
    tarps: { available: boolean; price?: number };
    generators: { available: boolean; price?: number };
    fuelCans: { available: boolean; price?: number };
    safetyGear: { available: boolean; price?: number };
  }>(),
  hours: text("hours"),
  lastUpdated: timestamp("last_updated").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Shelters & Resources for Victims
export const demShelters = pgTable("dem_shelters", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'shelter', 'food_distribution', 'aid_station', 'medical'
  organization: text("organization"), // 'Red Cross', 'FEMA', 'Local Govt'
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zipCode: text("zip_code").notNull(),
  latitude: numeric("latitude", { precision: 10, scale: 8 }),
  longitude: numeric("longitude", { precision: 10, scale: 8 }),
  phone: text("phone"),
  capacity: integer("capacity"),
  currentOccupancy: integer("current_occupancy"),
  isOpen: boolean("is_open").default(true),
  acceptingIntake: boolean("accepting_intake").default(true),
  services: jsonb("services").$type<string[]>(), // ['food', 'shelter', 'medical', 'supplies']
  requirements: text("requirements"),
  hours: text("hours"),
  lastUpdated: timestamp("last_updated").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Critical Alerts
export const demAlerts = pgTable("dem_alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  message: text("message").notNull(),
  alertType: text("alert_type").notNull(), // 'price_gouging', 'curfew', 'road_closure', 'health_hazard'
  severity: text("severity").default("medium"), // 'low', 'medium', 'high', 'critical'
  state: text("state").notNull(),
  county: text("county"),
  city: text("city"),
  isActive: boolean("is_active").default(true),
  expiresAt: timestamp("expires_at"),
  source: text("source"), // 'AI', 'FEMA', 'Local Govt', 'User Report'
  createdAt: timestamp("created_at").defaultNow(),
});

// Satellite Phone Vendors & Products
export const demSatelliteProducts = pgTable("dem_satellite_products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  model: text("model").notNull(),
  vendor: text("vendor").notNull(), // 'Satellite Phone Store', 'Best Buy', etc.
  category: text("category").notNull(), // 'satellite_phone', 'emergency_internet', 'accessories'
  price: numeric("price", { precision: 10, scale: 2 }),
  coverage: text("coverage"), // 'global', 'regional', 'local'
  features: jsonb("features").$type<string[]>(),
  isInStock: boolean("is_in_stock").default(true),
  vendorUrl: text("vendor_url"),
  vendorPhone: text("vendor_phone"),
  specifications: jsonb("specifications").$type<{
    durability?: string;
    batteryLife?: string;
    gpsEnabled?: boolean;
    sosFeatures?: boolean;
    waterproof?: boolean;
  }>(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Create insert schemas
export const insertDemHotelSchema = createInsertSchema(demHotels).omit({
  id: true,
  lastUpdated: true,
  createdAt: true,
});

export const insertDemGasStationSchema = createInsertSchema(demGasStations).omit({
  id: true,
  lastUpdated: true,
  createdAt: true,
});

export const insertDemHardwareStoreSchema = createInsertSchema(demHardwareStores).omit({
  id: true,
  lastUpdated: true,
  createdAt: true,
});

export const insertDemShelterSchema = createInsertSchema(demShelters).omit({
  id: true,
  lastUpdated: true,
  createdAt: true,
});

export const insertDemAlertSchema = createInsertSchema(demAlerts).omit({
  id: true,
  createdAt: true,
});

export const insertDemSatelliteProductSchema = createInsertSchema(demSatelliteProducts).omit({
  id: true,
  createdAt: true,
});

// Export DEM types
export type DemHotel = typeof demHotels.$inferSelect;
export type InsertDemHotel = z.infer<typeof insertDemHotelSchema>;
export type DemGasStation = typeof demGasStations.$inferSelect;
export type InsertDemGasStation = z.infer<typeof insertDemGasStationSchema>;
export type DemHardwareStore = typeof demHardwareStores.$inferSelect;
export type InsertDemHardwareStore = z.infer<typeof insertDemHardwareStoreSchema>;
export type DemShelter = typeof demShelters.$inferSelect;
export type InsertDemShelter = z.infer<typeof insertDemShelterSchema>;
export type DemAlert = typeof demAlerts.$inferSelect;
export type InsertDemAlert = z.infer<typeof insertDemAlertSchema>;
export type DemSatelliteProduct = typeof demSatelliteProducts.$inferSelect;
export type InsertDemSatelliteProduct = z.infer<typeof insertDemSatelliteProductSchema>;

// ===== DRONE OPERATIONS CENTER TABLES =====

// Drones - Core drone fleet management
export const drones = pgTable("drones", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(), // User-friendly drone name
  model: text("model").notNull(), // DJI Phantom 4, etc.
  status: text("status").notNull().default("ready"), // ready, active, returning, emergency, maintenance, offline
  batteryPct: integer("battery_pct").default(100), // 0-100
  lastTelemetryAt: timestamp("last_telemetry_at"),
  healthScore: integer("health_score").default(100), // Overall health score 0-100
  firmware: text("firmware"), // Current firmware version
  assignedMissionId: varchar("assigned_mission_id"), // Current mission if any
  capabilities: jsonb("capabilities").$type<string[]>(), // ['4k_camera', 'thermal_imaging', 'lidar', 'night_vision']
  location: jsonb("location").$type<{
    latitude: number;
    longitude: number;
    altitude?: number;
    address?: string;
  }>(),
  pilotId: varchar("pilot_id"), // Assigned pilot
  lastMaintenanceAt: timestamp("last_maintenance_at"),
  nextMaintenanceDue: timestamp("next_maintenance_due"),
  flightHours: numeric("flight_hours", { precision: 8, scale: 2 }).default("0"), // Total flight hours
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Missions - Flight mission management
export const missions = pgTable("missions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: text("type").notNull(), // inspection, search_rescue, survey, patrol, emergency_response
  priority: text("priority").notNull().default("medium"), // low, medium, high, critical
  status: text("status").notNull().default("planned"), // planned, active, paused, completed, cancelled, failed
  assignedDroneId: varchar("assigned_drone_id"),
  estimatedDurationMin: integer("estimated_duration_min").notNull(), // Estimated duration in minutes
  actualDurationMin: integer("actual_duration_min"), // Actual duration when completed
  description: text("description"),
  waypoints: jsonb("waypoints").$type<Array<{
    lat: number;
    lng: number;
    altitude: number;
    action: string; // hover, photo, video, inspect, search
    duration?: number; // Time to spend at waypoint in seconds
  }>>(),
  missionArea: jsonb("mission_area").$type<{
    center: { lat: number; lng: number };
    radius: number; // in meters
    boundingBox?: {
      north: number;
      south: number;
      east: number;
      west: number;
    };
  }>(),
  weatherConstraints: jsonb("weather_constraints").$type<{
    maxWindSpeed?: number;
    minVisibility?: number;
    maxPrecipitation?: number;
    temperatureRange?: { min: number; max: number };
  }>(),
  safetyChecklist: jsonb("safety_checklist").$type<{
    preFlightComplete: boolean;
    batteryCheck: boolean;
    weatherCheck: boolean;
    airspaceCleared: boolean;
    emergencyPlanReviewed: boolean;
  }>(),
  progress: integer("progress").default(0), // 0-100 percentage
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Telemetry - Real-time drone data
export const telemetry = pgTable("telemetry", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  droneId: varchar("drone_id").notNull(),
  ts: timestamp("timestamp").notNull().defaultNow(),
  altitude: numeric("altitude", { precision: 8, scale: 2 }), // meters above ground
  speed: numeric("speed", { precision: 6, scale: 2 }), // m/s
  heading: integer("heading"), // degrees 0-360
  temperature: numeric("temperature", { precision: 4, scale: 1 }), // Celsius
  windSpeed: numeric("wind_speed", { precision: 5, scale: 2 }), // m/s
  signalStrength: integer("signal_strength"), // dBm or percentage
  batteryPct: integer("battery_pct").notNull(), // 0-100
  coords: jsonb("coords").$type<{
    latitude: number;
    longitude: number;
    accuracy?: number; // GPS accuracy in meters
  }>().notNull(),
  flightMode: text("flight_mode"), // manual, auto, rth, hover, land
  gpsStatus: text("gps_status"), // fixed, dgps, no_fix
  homePoint: jsonb("home_point").$type<{
    latitude: number;
    longitude: number;
    altitude: number;
  }>(),
  remainingFlightTime: integer("remaining_flight_time"), // estimated minutes left
  obstacleDistance: numeric("obstacle_distance", { precision: 5, scale: 2 }), // meters to nearest obstacle
  cameraStatus: jsonb("camera_status").$type<{
    recording: boolean;
    storageRemaining: number; // MB
    gimbalTilt: number; // degrees
  }>(),
}, (table) => ({
  droneIdTimestampIdx: unique().on(table.droneId, table.ts),
}));

// Maintenance Events - Drone maintenance tracking
export const maintenanceEvents = pgTable("maintenance_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  droneId: varchar("drone_id").notNull(),
  ts: timestamp("timestamp").notNull().defaultNow(),
  type: text("type").notNull(), // scheduled, repair, inspection, calibration, upgrade, emergency
  notes: text("notes").notNull(),
  severity: text("severity").notNull().default("routine"), // routine, minor, major, critical
  performedBy: text("performed_by"), // Technician name/ID
  partsReplaced: jsonb("parts_replaced").$type<Array<{
    partName: string;
    partNumber?: string;
    quantity: number;
    cost?: number;
  }>>(),
  laborHours: numeric("labor_hours", { precision: 4, scale: 2 }),
  totalCost: numeric("total_cost", { precision: 8, scale: 2 }),
  beforeHealthScore: integer("before_health_score"), // Health score before maintenance
  afterHealthScore: integer("after_health_score"), // Health score after maintenance
  nextMaintenanceDue: timestamp("next_maintenance_due"),
  flightHoursAtMaintenance: numeric("flight_hours_at_maintenance", { precision: 8, scale: 2 }),
  issues: jsonb("issues").$type<Array<{
    category: string; // battery, propeller, camera, gimbal, sensor, software
    description: string;
    resolved: boolean;
  }>>(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Create insert schemas for drone models
export const insertDroneSchema = createInsertSchema(drones).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMissionSchema = createInsertSchema(missions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTelemetrySchema = createInsertSchema(telemetry).omit({
  id: true,
  ts: true,
});

export const insertMaintenanceEventSchema = createInsertSchema(maintenanceEvents).omit({
  id: true,
  ts: true,
  createdAt: true,
});

// Export drone types
export type Drone = typeof drones.$inferSelect;
export type InsertDrone = z.infer<typeof insertDroneSchema>;
export type Mission = typeof missions.$inferSelect;
export type InsertMission = z.infer<typeof insertMissionSchema>;
export type Telemetry = typeof telemetry.$inferSelect;
export type InsertTelemetry = z.infer<typeof insertTelemetrySchema>;
export type MaintenanceEvent = typeof maintenanceEvents.$inferSelect;
export type InsertMaintenanceEvent = z.infer<typeof insertMaintenanceEventSchema>;

// Detection foundation types
export type DetectionJob = typeof detectionJobs.$inferSelect;
export type InsertDetectionJob = z.infer<typeof insertDetectionJobSchema>;
export type DetectionResult = typeof detectionResults.$inferSelect;
export type InsertDetectionResult = z.infer<typeof insertDetectionResultSchema>;

// ===== DISASTER LENS CORE TABLES =====

// Organizations table (multi-tenant support)
export const organizations = pgTable("organizations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  planType: text("plan_type").default("basic"), // basic, pro, enterprise
  settings: jsonb("settings").$type<JsonObject>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Organization memberships with roles
export const organizationMembers = pgTable("organization_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").notNull(),
  userId: varchar("user_id").notNull(),
  role: text("role").notNull(), // owner, admin, manager, tech, sub, viewer
  invitedBy: varchar("invited_by"),
  invitedAt: timestamp("invited_at"),
  joinedAt: timestamp("joined_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  orgMembershipUnique: unique().on(table.organizationId, table.userId),
  memberOrgFkey: foreignKey({
    columns: [table.organizationId],
    foreignColumns: [organizations.id],
    name: "fk_member_org"
  }),
  memberUserFkey: foreignKey({
    columns: [table.userId],
    foreignColumns: [users.id],
    name: "fk_member_user"
  }),
}));

// Projects table (core container for disaster documentation)
export const projects = pgTable("projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  status: text("status").default("active"), // active, completed, archived
  projectType: text("project_type").default("storm_response"), // storm_response, claim, assessment
  clientName: text("client_name"),
  propertyAddress: text("property_address"),
  latitude: numeric("latitude", { precision: 10, scale: 8 }),
  longitude: numeric("longitude", { precision: 10, scale: 8 }),
  insuranceCompany: text("insurance_company"),
  claimNumber: text("claim_number"),
  createdBy: varchar("created_by").notNull(), // creator
  assignedTechIds: varchar("assigned_tech_ids").array(), // assigned techs and subs
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  projectOrgFkey: foreignKey({
    columns: [table.organizationId],
    foreignColumns: [organizations.id],
    name: "fk_project_org"
  }),
  projectCreatorFkey: foreignKey({
    columns: [table.createdBy],
    foreignColumns: [users.id],
    name: "fk_project_creator"
  }),
}));

// Media table (unified photos/videos/audio)
export const media = pgTable("media", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull(),
  fileName: text("file_name").notNull(),
  fileUrl: text("file_url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  mediaType: text("media_type").notNull(), // photo, video, audio
  originalName: text("original_name"),
  fileSize: integer("file_size"),
  mimeType: text("mime_type"),
  latitude: numeric("latitude", { precision: 10, scale: 8 }),
  longitude: numeric("longitude", { precision: 10, scale: 8 }),
  capturedAt: timestamp("captured_at"),
  metadata: jsonb("metadata").$type<JsonObject>(), // EXIF data, GPS coords, auto-stamping info
  aiDescription: text("ai_description"),
  tags: text("tags").array(), // searchable tags
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  mediaProjectFkey: foreignKey({
    columns: [table.projectId],
    foreignColumns: [projects.id],
    name: "fk_media_project"
  }),
}));

// Annotations table (drawing tools on media)
export const annotations = pgTable("annotations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  mediaId: varchar("media_id").notNull(),
  kind: text("kind").notNull(), // arrow, box, text, blur, measure
  payload: jsonb("payload").$type<JsonObject>().notNull(), // positions, text, pixels
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  annotationMediaFkey: foreignKey({
    columns: [table.mediaId],
    foreignColumns: [media.id],
    name: "fk_annotation_media"
  }),
}));

// Comments table (project-level, optionally tied to media)
export const comments = pgTable("comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull(),
  mediaId: varchar("media_id"), // optional - can be project-level or media-specific
  authorId: varchar("author_id").notNull(),
  body: text("body").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  commentProjectFkey: foreignKey({
    columns: [table.projectId],
    foreignColumns: [projects.id],
    name: "fk_comment_project"
  }),
  commentMediaFkey: foreignKey({
    columns: [table.mediaId],
    foreignColumns: [media.id],
    name: "fk_comment_media"
  }),
  commentAuthorFkey: foreignKey({
    columns: [table.authorId],
    foreignColumns: [users.id],
    name: "fk_comment_author"
  }),
}));

// Tasks & Checklists (renamed to avoid conflict with existing tasks table)
export const disasterTasks = pgTable("disaster_tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull(),
  title: text("title").notNull(),
  requiresPhoto: boolean("requires_photo").default(false),
  assigneeId: varchar("assignee_id"),
  dueDate: timestamp("due_date"),
  status: text("status").default("todo"), // todo, doing, blocked, done
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
}, (table) => ({
  taskProjectFkey: foreignKey({
    columns: [table.projectId],
    foreignColumns: [projects.id],
    name: "fk_disaster_task_project"
  }),
  taskAssigneeFkey: foreignKey({
    columns: [table.assigneeId],
    foreignColumns: [users.id],
    name: "fk_disaster_task_assignee"
  }),
}));

// Reports table (PDF generation)
export const disasterReports = pgTable("disaster_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull(),
  title: text("title").notNull(),
  kind: text("kind").notNull(), // photo, daily, final, insurance_packet
  payload: jsonb("payload").$type<JsonObject>().notNull(), // selection, ordering, captions, template
  pdfStorageKey: text("pdf_storage_key"), // generated PDF storage key
  createdBy: varchar("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  reportProjectFkey: foreignKey({
    columns: [table.projectId],
    foreignColumns: [projects.id],
    name: "fk_disaster_report_project"
  }),
  reportCreatorFkey: foreignKey({
    columns: [table.createdBy],
    foreignColumns: [users.id],
    name: "fk_disaster_report_creator"
  }),
}));

// Shares table (public links for reports/projects)
export const shares = pgTable("shares", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id"),
  reportId: varchar("report_id"),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  shareProjectFkey: foreignKey({
    columns: [table.projectId],
    foreignColumns: [projects.id],
    name: "fk_share_project"
  }),
  shareReportFkey: foreignKey({
    columns: [table.reportId],
    foreignColumns: [disasterReports.id],
    name: "fk_share_report"
  }),
}));

// Audit log table (track all system actions)
export const auditLog = pgTable("audit_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orgId: varchar("org_id"), // for future multi-tenant support
  userId: varchar("user_id"),
  action: text("action").notNull(),
  entity: text("entity").notNull(),
  entityId: varchar("entity_id"),
  meta: jsonb("meta").$type<JsonObject>(),
  at: timestamp("at").defaultNow(),
}, (table) => ({
  auditUserFkey: foreignKey({
    columns: [table.userId],
    foreignColumns: [users.id],
    name: "fk_audit_user"
  }),
}));

// ===== DISASTER LENS INSERT SCHEMAS =====

export const insertOrganizationSchema = createInsertSchema(organizations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOrganizationMemberSchema = createInsertSchema(organizationMembers).omit({
  id: true,
  createdAt: true,
  joinedAt: true,
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMediaSchema = createInsertSchema(media).omit({
  id: true,
  createdAt: true,
});

export const insertAnnotationSchema = createInsertSchema(annotations).omit({
  id: true,
  createdAt: true,
});

export const insertCommentSchema = createInsertSchema(comments).omit({
  id: true,
  createdAt: true,
});

export const insertDisasterTaskSchema = createInsertSchema(disasterTasks).omit({
  id: true,
  createdAt: true,
  completedAt: true,
}).extend({
  requiresPhoto: z.boolean().optional(),
});

export const insertDisasterReportSchema = createInsertSchema(disasterReports).omit({
  id: true,
  createdAt: true,
});

export const insertShareSchema = createInsertSchema(shares).omit({
  id: true,
  createdAt: true,
});

export const insertAuditLogSchema = createInsertSchema(auditLog).omit({
  id: true,
  at: true,
});

// ===== DISASTER LENS TYPES =====

export type Organization = typeof organizations.$inferSelect;
export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;
export type OrganizationMember = typeof organizationMembers.$inferSelect;
export type InsertOrganizationMember = z.infer<typeof insertOrganizationMemberSchema>;
export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Media = typeof media.$inferSelect;
export type InsertMedia = z.infer<typeof insertMediaSchema>;
export type Annotation = typeof annotations.$inferSelect;
export type InsertAnnotation = z.infer<typeof insertAnnotationSchema>;
export type Comment = typeof comments.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;
export type DisasterTask = typeof disasterTasks.$inferSelect;
export type InsertDisasterTask = z.infer<typeof insertDisasterTaskSchema>;
export type DisasterReport = typeof disasterReports.$inferSelect;
export type InsertDisasterReport = z.infer<typeof insertDisasterReportSchema>;
export type Share = typeof shares.$inferSelect;
export type InsertShare = z.infer<typeof insertShareSchema>;
export type AuditLogEntry = typeof auditLog.$inferSelect;
export type InsertAuditLogEntry = z.infer<typeof insertAuditLogSchema>;
