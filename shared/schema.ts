import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, numeric, boolean, jsonb, integer, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

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
