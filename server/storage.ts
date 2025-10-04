import { 
  type User, 
  type InsertUser, 
  type Claim, 
  type InsertClaim,
  type InsuranceCompany,
  type InsertInsuranceCompany,
  type LienRule,
  type InsertLienRule,
  type WeatherAlert,
  type InsertWeatherAlert,
  type FieldReport,
  type InsertFieldReport,
  type DroneFootage,
  type InsertDroneFootage,
  type MarketComparable,
  type InsertMarketComparable,
  type AiInteraction,
  type InsertAiInteraction,
  type DspFootage,
  type InsertDspFootage,
  type Lead,
  type InsertLead,
  type Invoice,
  type InsertInvoice,
  type JobCost,
  type InsertJobCost,
  type Photo,
  type InsertPhoto,
  type XactimateComparable,
  type InsertXactimateComparable,
  type ClaimSubmission,
  type InsertClaimSubmission,
  type ContractorDocument,
  type InsertContractorDocument,
  type ContractorWatchlist,
  type InsertContractorWatchlist,
  type StormHotZone,
  type InsertStormHotZone,
  type Homeowner,
  type InsertHomeowner,
  type DamageReport,
  type InsertDamageReport,
  type ServiceRequest,
  type InsertServiceRequest,
  type EmergencyContact,
  type InsertEmergencyContact,
  type TrafficCamAlert,
  type InsertTrafficCamAlert,
  type TrafficCamLead,
  type InsertTrafficCamLead,
  type StormPrediction,
  type InsertStormPrediction,
  type DamageForecast,
  type InsertDamageForecast,
  type ContractorOpportunityPrediction,
  type InsertContractorOpportunityPrediction,
  type HistoricalDamagePattern,
  type InsertHistoricalDamagePattern,
  type RadarAnalysisCache,
  type InsertRadarAnalysisCache,
  type DetectionJob,
  type InsertDetectionJob,
  type DetectionResult,
  type InsertDetectionResult,
  type Funnel,
  type InsertFunnel,
  type FunnelStep,
  type InsertFunnelStep,
  type Form,
  type InsertForm,
  type FormField,
  type InsertFormField,
  type CalendarBooking,
  type InsertCalendarBooking,
  type Workflow,
  type InsertWorkflow,
  type WorkflowStep,
  type InsertWorkflowStep,
  type StormShareGroup,
  type InsertStormShareGroup,
  type StormShareGroupMember,
  type InsertStormShareGroupMember,
  type StormShareMessage,
  type InsertStormShareMessage,
  type HelpRequest,
  type InsertHelpRequest,
  type StormShareMediaAsset,
  type InsertStormShareMediaAsset,
  type StormShareAdCampaign,
  type InsertStormShareAdCampaign,
  type Drone,
  type InsertDrone,
  type Mission,
  type InsertMission,
  type Telemetry,
  type InsertTelemetry,
  // Disaster Lens entities
  type Organization,
  type InsertOrganization,
  type OrganizationMember,
  type InsertOrganizationMember,
  type Project,
  type InsertProject,
  type Media,
  type InsertMedia,
  type Annotation,
  type InsertAnnotation,
  type Comment,
  type InsertComment,
  type DisasterTask,
  type InsertDisasterTask,
  type DisasterReport,
  type InsertDisasterReport,
  type Share,
  type InsertShare,
  type AuditLogEntry,
  type InsertAuditLogEntry,
  // AI Assistant entities
  type AiSession,
  type InsertAiSession,
  type AiAction,
  type InsertAiAction,
  type MediaFrame,
  type InsertMediaFrame,
  // Voice Profile entities
  type VoiceProfile,
  type InsertVoiceProfile
} from "@shared/schema";
import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Claim methods
  getClaims(): Promise<Claim[]>;
  getClaim(id: string): Promise<Claim | undefined>;
  createClaim(claim: InsertClaim): Promise<Claim>;
  updateClaim(id: string, updates: Partial<Claim>): Promise<Claim>;
  getClaimsByInsuranceCompany(company: string): Promise<Claim[]>;
  getClaimsByState(state: string): Promise<Claim[]>;

  // Insurance Company methods
  getInsuranceCompanies(): Promise<InsuranceCompany[]>;
  getInsuranceCompany(id: string): Promise<InsuranceCompany | undefined>;
  createInsuranceCompany(company: InsertInsuranceCompany): Promise<InsuranceCompany>;
  updateInsuranceCompany(id: string, updates: Partial<InsuranceCompany>): Promise<InsuranceCompany>;

  // Lien Rule methods
  getLienRules(): Promise<LienRule[]>;
  getLienRule(state: string): Promise<LienRule | undefined>;
  createLienRule(rule: InsertLienRule): Promise<LienRule>;
  updateLienRule(state: string, updates: Partial<LienRule>): Promise<LienRule>;

  // Weather Alert methods
  getWeatherAlerts(): Promise<WeatherAlert[]>;
  getActiveWeatherAlerts(): Promise<WeatherAlert[]>;
  createWeatherAlert(alert: InsertWeatherAlert): Promise<WeatherAlert>;
  updateWeatherAlert(id: string, updates: Partial<WeatherAlert>): Promise<WeatherAlert>;

  // Field Report methods
  getFieldReports(): Promise<FieldReport[]>;
  getFieldReport(id: string): Promise<FieldReport | undefined>;
  createFieldReport(report: InsertFieldReport): Promise<FieldReport>;
  updateFieldReport(id: string, updates: Partial<FieldReport>): Promise<FieldReport>;
  getFieldReportsByCrew(crewId: string): Promise<FieldReport[]>;

  // Drone Footage methods
  getDroneFootage(): Promise<DroneFootage[]>;
  getLiveDroneFootage(): Promise<DroneFootage[]>;
  createDroneFootage(footage: InsertDroneFootage): Promise<DroneFootage>;

  // Drone Fleet Management methods
  getDrones(): Promise<Drone[]>;
  getDrone(id: string): Promise<Drone | undefined>;
  createDrone(drone: InsertDrone): Promise<Drone>;
  updateDrone(id: string, updates: Partial<Drone>): Promise<Drone>;
  deleteDrone(id: string): Promise<boolean>;

  // Mission Management methods
  getMissions(): Promise<Mission[]>;
  getMission(id: string): Promise<Mission | undefined>;
  getMissionsByDrone(droneId: string): Promise<Mission[]>;
  createMission(mission: InsertMission): Promise<Mission>;
  updateMission(id: string, updates: Partial<Mission>): Promise<Mission>;
  deleteMission(id: string): Promise<boolean>;

  // Telemetry methods
  getTelemetry(): Promise<Telemetry[]>;
  getTelemetryByDrone(droneId: string): Promise<Telemetry[]>;
  getTelemetryByMission(missionId: string): Promise<Telemetry[]>;
  createTelemetry(telemetry: InsertTelemetry): Promise<Telemetry>;
  getLatestTelemetryByDrone(droneId: string): Promise<Telemetry | undefined>;

  // Market Comparable methods
  getMarketComparables(): Promise<MarketComparable[]>;
  getMarketComparable(claimType: string, company: string, region: string): Promise<MarketComparable | undefined>;
  createMarketComparable(comparable: InsertMarketComparable): Promise<MarketComparable>;

  // AI Interaction methods
  createAiInteraction(interaction: InsertAiInteraction): Promise<AiInteraction>;
  getAiInteractionsByUser(userId: string): Promise<AiInteraction[]>;

  // DSP Footage methods
  getDspFootage(): Promise<DspFootage[]>;
  getDspFootageByProvider(provider: string): Promise<DspFootage[]>;
  createDspFootage(footage: InsertDspFootage): Promise<DspFootage>;
  updateDspFootage(id: string, updates: Partial<DspFootage>): Promise<DspFootage>;

  // Lead methods
  getLeads(): Promise<Lead[]>;
  getLeadsByContractor(contractorId: string): Promise<Lead[]>;
  getLead(id: string): Promise<Lead | undefined>;
  createLead(lead: InsertLead): Promise<Lead>;
  updateLead(id: string, updates: Partial<Lead>): Promise<Lead>;

  // Invoice methods
  getInvoices(): Promise<Invoice[]>;
  getInvoicesByContractor(contractorId: string): Promise<Invoice[]>;
  getInvoice(id: string): Promise<Invoice | undefined>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  updateInvoice(id: string, updates: Partial<Invoice>): Promise<Invoice>;

  // Job Cost methods
  getJobCostsByInvoice(invoiceId: string): Promise<JobCost[]>;
  createJobCost(jobCost: InsertJobCost): Promise<JobCost>;

  // Photo methods
  getPhotos(): Promise<Photo[]>;
  getPhotosByContractor(contractorId: string): Promise<Photo[]>;
  getPhotosByLead(leadId: string): Promise<Photo[]>;
  getPhotosByInvoice(invoiceId: string): Promise<Photo[]>;
  createPhoto(photo: InsertPhoto): Promise<Photo>;

  // Xactimate Comparable methods
  getXactimateComparablesByInvoice(invoiceId: string): Promise<XactimateComparable[]>;
  createXactimateComparable(comparable: InsertXactimateComparable): Promise<XactimateComparable>;

  // Claim Submission methods
  getClaimSubmissions(): Promise<ClaimSubmission[]>;
  getClaimSubmissionsByContractor(contractorId: string): Promise<ClaimSubmission[]>;
  createClaimSubmission(submission: InsertClaimSubmission): Promise<ClaimSubmission>;
  updateClaimSubmission(id: string, updates: Partial<ClaimSubmission>): Promise<ClaimSubmission>;

  // Contractor Document methods
  getContractorDocuments(): Promise<ContractorDocument[]>;
  getContractorDocumentsByContractor(contractorId: string): Promise<ContractorDocument[]>;
  createContractorDocument(document: InsertContractorDocument): Promise<ContractorDocument>;

  // Contractor Watchlist methods
  getContractorWatchlist(contractorId: string): Promise<ContractorWatchlist[]>;
  addWatchlistItem(item: InsertContractorWatchlist): Promise<ContractorWatchlist>;
  removeWatchlistItem(contractorId: string, itemType: string, itemId: string): Promise<boolean>;
  updateWatchlistItem(id: string, updates: Partial<ContractorWatchlist>): Promise<ContractorWatchlist>;

  // Storm Hot Zones methods
  getStormHotZones(): Promise<StormHotZone[]>;
  getStormHotZonesByState(stateCode: string): Promise<StormHotZone[]>;
  getStormHotZonesByRiskLevel(riskLevel: string): Promise<StormHotZone[]>;
  getStormHotZonesByStormType(stormType: string): Promise<StormHotZone[]>;
  getStormHotZonesWithFemaId(femaId: string): Promise<StormHotZone[]>;
  getStormHotZone(id: string): Promise<StormHotZone | undefined>;
  createStormHotZone(zone: InsertStormHotZone): Promise<StormHotZone>;
  updateStormHotZone(id: string, updates: Partial<StormHotZone>): Promise<StormHotZone>;

  // Victim Portal - Homeowner methods
  getHomeowners(): Promise<Homeowner[]>;
  getHomeowner(id: string): Promise<Homeowner | undefined>;
  getHomeownerByEmail(email: string): Promise<Homeowner | undefined>;
  createHomeowner(homeowner: InsertHomeowner): Promise<Homeowner>;
  updateHomeowner(id: string, updates: Partial<Homeowner>): Promise<Homeowner>;
  getHomeownersByState(state: string): Promise<Homeowner[]>;

  // Victim Portal - Damage Report methods
  getDamageReports(): Promise<DamageReport[]>;
  getDamageReport(id: string): Promise<DamageReport | undefined>;
  getDamageReportsByHomeowner(homeownerId: string): Promise<DamageReport[]>;
  createDamageReport(report: InsertDamageReport): Promise<DamageReport>;
  updateDamageReport(id: string, updates: Partial<DamageReport>): Promise<DamageReport>;
  getEmergencyDamageReports(): Promise<DamageReport[]>;
  getDamageReportsByType(damageType: string): Promise<DamageReport[]>;

  // Victim Portal - Service Request methods
  getServiceRequests(): Promise<ServiceRequest[]>;
  getServiceRequest(id: string): Promise<ServiceRequest | undefined>;
  getServiceRequestsByHomeowner(homeownerId: string): Promise<ServiceRequest[]>;
  createServiceRequest(request: InsertServiceRequest): Promise<ServiceRequest>;
  updateServiceRequest(id: string, updates: Partial<ServiceRequest>): Promise<ServiceRequest>;
  getServiceRequestsByType(serviceType: string): Promise<ServiceRequest[]>;
  getOpenServiceRequests(): Promise<ServiceRequest[]>;
  getServiceRequestsByLocation(lat: number, lng: number, radius: number): Promise<ServiceRequest[]>;

  // Victim Portal - Emergency Contact methods
  getEmergencyContacts(): Promise<EmergencyContact[]>;
  getEmergencyContact(id: string): Promise<EmergencyContact | undefined>;
  getEmergencyContactsByHomeowner(homeownerId: string): Promise<EmergencyContact[]>;
  createEmergencyContact(contact: InsertEmergencyContact): Promise<EmergencyContact>;
  updateEmergencyContact(id: string, updates: Partial<EmergencyContact>): Promise<EmergencyContact>;
  deleteEmergencyContact(id: string): Promise<boolean>;
  getPrimaryEmergencyContact(homeownerId: string): Promise<EmergencyContact | undefined>;

  // Traffic Camera Alert methods
  getTrafficCamAlerts(): Promise<TrafficCamAlert[]>;
  getTrafficCamAlert(id: string): Promise<TrafficCamAlert | undefined>;
  getTrafficCamAlertsByCamera(cameraId: string): Promise<TrafficCamAlert[]>;
  getTrafficCamAlertsBySeverity(minSeverityScore: number): Promise<TrafficCamAlert[]>;
  getTrafficCamAlertsByProfitability(minProfitabilityScore: number): Promise<TrafficCamAlert[]>;
  getTrafficCamAlertsFiltered(filters: { 
    minSeverityScore?: number; 
    minProfitabilityScore?: number; 
    emergencyOnly?: boolean; 
    limit?: number; 
  }): Promise<TrafficCamAlert[]>;
  createTrafficCamAlert(alert: InsertTrafficCamAlert): Promise<TrafficCamAlert>;
  updateTrafficCamAlert(id: string, updates: Partial<TrafficCamAlert>): Promise<TrafficCamAlert>;
  deleteTrafficCamAlert(id: string): Promise<boolean>;

  // Traffic Camera Lead methods
  getTrafficCamLeads(): Promise<TrafficCamLead[]>;
  getTrafficCamLead(id: string): Promise<TrafficCamLead | undefined>;
  getTrafficCamLeadsByAlert(alertId: string): Promise<TrafficCamLead[]>;
  getTrafficCamLeadsByContractor(contractorId: string): Promise<TrafficCamLead[]>;
  getTrafficCamLeadsByStatus(status: string): Promise<TrafficCamLead[]>;
  createTrafficCamLead(lead: InsertTrafficCamLead): Promise<TrafficCamLead>;
  updateTrafficCamLead(id: string, updates: Partial<TrafficCamLead>): Promise<TrafficCamLead>;
  deleteTrafficCamLead(id: string): Promise<boolean>;
  
  // Predictive Storm AI methods
  // Storm Predictions
  getStormPredictions(): Promise<StormPrediction[]>;
  getActiveStormPredictions(): Promise<StormPrediction[]>;
  getStormPrediction(id: string): Promise<StormPrediction | undefined>;
  getStormPredictionByStormId(stormId: string): Promise<StormPrediction[]>;
  createStormPrediction(prediction: InsertStormPrediction): Promise<StormPrediction>;
  updateStormPrediction(id: string, updates: Partial<StormPrediction>): Promise<StormPrediction>;
  deleteStormPrediction(id: string): Promise<boolean>;
  
  // Damage Forecasts
  getDamageForecasts(): Promise<DamageForecast[]>;
  getActiveDamageForecasts(): Promise<DamageForecast[]>;
  getDamageForecast(id: string): Promise<DamageForecast | undefined>;
  getDamageForecastsByStormPrediction(stormPredictionId: string): Promise<DamageForecast[]>;
  getDamageForecastsByState(state: string): Promise<DamageForecast[]>;
  getDamageForecastsByCounty(state: string, county: string): Promise<DamageForecast[]>;
  getDamageForecastsByRiskLevel(riskLevel: string): Promise<DamageForecast[]>;
  createDamageForecast(forecast: InsertDamageForecast): Promise<DamageForecast>;
  updateDamageForecast(id: string, updates: Partial<DamageForecast>): Promise<DamageForecast>;
  deleteDamageForecast(id: string): Promise<boolean>;
  
  // Contractor Opportunity Predictions
  getContractorOpportunityPredictions(): Promise<ContractorOpportunityPrediction[]>;
  getContractorOpportunityPrediction(id: string): Promise<ContractorOpportunityPrediction | undefined>;
  getContractorOpportunitiesByDamageForecast(damageForecastId: string): Promise<ContractorOpportunityPrediction[]>;
  getContractorOpportunitiesByState(state: string): Promise<ContractorOpportunityPrediction[]>;
  getContractorOpportunitiesByMarketPotential(marketPotential: string): Promise<ContractorOpportunityPrediction[]>;
  getHighOpportunityPredictions(minOpportunityScore: number): Promise<ContractorOpportunityPrediction[]>;
  createContractorOpportunityPrediction(prediction: InsertContractorOpportunityPrediction): Promise<ContractorOpportunityPrediction>;
  updateContractorOpportunityPrediction(id: string, updates: Partial<ContractorOpportunityPrediction>): Promise<ContractorOpportunityPrediction>;
  deleteContractorOpportunityPrediction(id: string): Promise<boolean>;
  
  // Historical Damage Patterns
  getHistoricalDamagePatterns(): Promise<HistoricalDamagePattern[]>;
  getHistoricalDamagePattern(id: string): Promise<HistoricalDamagePattern | undefined>;
  getHistoricalDamagePatternsByEventType(eventType: string): Promise<HistoricalDamagePattern[]>;
  getHistoricalDamagePatternsByState(state: string): Promise<HistoricalDamagePattern[]>;
  getHistoricalDamagePatternsByIntensity(minIntensity: number, maxIntensity: number): Promise<HistoricalDamagePattern[]>;
  getSimilarHistoricalEvents(eventType: string, intensity: number, state: string): Promise<HistoricalDamagePattern[]>;
  createHistoricalDamagePattern(pattern: InsertHistoricalDamagePattern): Promise<HistoricalDamagePattern>;
  updateHistoricalDamagePattern(id: string, updates: Partial<HistoricalDamagePattern>): Promise<HistoricalDamagePattern>;
  deleteHistoricalDamagePattern(id: string): Promise<boolean>;
  
  // Radar Analysis Cache
  getRadarAnalysisCache(): Promise<RadarAnalysisCache[]>;
  getRadarAnalysisCacheEntry(id: string): Promise<RadarAnalysisCache | undefined>;
  getRadarAnalysisBySite(radarSiteId: string): Promise<RadarAnalysisCache[]>;
  getRadarAnalysisByTimeRange(startTime: Date, endTime: Date): Promise<RadarAnalysisCache[]>;
  getLatestRadarAnalysis(radarSiteId: string): Promise<RadarAnalysisCache | undefined>;
  createRadarAnalysisCache(analysis: InsertRadarAnalysisCache): Promise<RadarAnalysisCache>;
  updateRadarAnalysisCache(id: string, updates: Partial<RadarAnalysisCache>): Promise<RadarAnalysisCache>;
  deleteRadarAnalysisCache(id: string): Promise<boolean>;
  cleanupExpiredRadarCache(): Promise<number>; // Returns number of entries deleted

  // AI Damage Detection Foundation
  // Detection Jobs methods
  getDetectionJobs(): Promise<DetectionJob[]>;
  getDetectionJob(id: string): Promise<DetectionJob | undefined>;
  getDetectionJobsByStatus(status: string): Promise<DetectionJob[]>;
  getDetectionJobsBySourceType(sourceType: string): Promise<DetectionJob[]>;
  createDetectionJob(job: InsertDetectionJob): Promise<DetectionJob>;
  updateDetectionJob(id: string, updates: Partial<DetectionJob>): Promise<DetectionJob>;
  deleteDetectionJob(id: string): Promise<boolean>;

  // Detection Results methods
  getDetectionResults(): Promise<DetectionResult[]>;
  getDetectionResult(id: string): Promise<DetectionResult | undefined>;
  getDetectionResultsByJobId(jobId: string): Promise<DetectionResult[]>;
  getDetectionResultsByLabel(label: string): Promise<DetectionResult[]>;
  getDetectionResultsByConfidence(minConfidence: number): Promise<DetectionResult[]>;
  createDetectionResult(result: InsertDetectionResult): Promise<DetectionResult>;
  updateDetectionResult(id: string, updates: Partial<DetectionResult>): Promise<DetectionResult>;
  deleteDetectionResult(id: string): Promise<boolean>;

  // Lead Capture System - Funnel methods
  getFunnels(): Promise<Funnel[]>;
  getFunnel(id: string): Promise<Funnel | undefined>;
  getFunnelBySlug(slug: string): Promise<Funnel | undefined>;
  createFunnel(funnel: InsertFunnel): Promise<Funnel>;
  updateFunnel(id: string, updates: Partial<Funnel>): Promise<Funnel>;
  deleteFunnel(id: string): Promise<boolean>;

  // Funnel Step methods
  getFunnelSteps(funnelId: string): Promise<FunnelStep[]>;
  getFunnelStep(id: string): Promise<FunnelStep | undefined>;
  createFunnelStep(step: InsertFunnelStep): Promise<FunnelStep>;
  updateFunnelStep(id: string, updates: Partial<FunnelStep>): Promise<FunnelStep>;
  deleteFunnelStep(id: string): Promise<boolean>;
  reorderFunnelSteps(funnelId: string, stepIds: string[]): Promise<boolean>;

  // Form methods
  getForms(): Promise<Form[]>;
  getForm(id: string): Promise<Form | undefined>;
  getFormsByFunnelStep(funnelStepId: string): Promise<Form[]>;
  createForm(form: InsertForm): Promise<Form>;
  updateForm(id: string, updates: Partial<Form>): Promise<Form>;
  deleteForm(id: string): Promise<boolean>;

  // Form Field methods
  getFormFields(formId: string): Promise<FormField[]>;
  getFormField(id: string): Promise<FormField | undefined>;
  createFormField(field: InsertFormField): Promise<FormField>;
  updateFormField(id: string, updates: Partial<FormField>): Promise<FormField>;
  deleteFormField(id: string): Promise<boolean>;
  reorderFormFields(formId: string, fieldIds: string[]): Promise<boolean>;

  // Calendar Booking methods
  getCalendarBookings(): Promise<CalendarBooking[]>;
  getCalendarBooking(id: string): Promise<CalendarBooking | undefined>;
  getCalendarBookingsByHomeowner(homeownerId: string): Promise<CalendarBooking[]>;
  getCalendarBookingsByDate(date: Date): Promise<CalendarBooking[]>;
  getCalendarBookingsByType(appointmentType: string): Promise<CalendarBooking[]>;
  getCalendarBookingsByStatus(status: string): Promise<CalendarBooking[]>;
  createCalendarBooking(booking: InsertCalendarBooking): Promise<CalendarBooking>;
  updateCalendarBooking(id: string, updates: Partial<CalendarBooking>): Promise<CalendarBooking>;
  deleteCalendarBooking(id: string): Promise<boolean>;
  getAvailableTimeSlots(date: Date, duration: number): Promise<string[]>;

  // Workflow methods
  getWorkflows(): Promise<Workflow[]>;
  getWorkflow(id: string): Promise<Workflow | undefined>;
  getActiveWorkflows(): Promise<Workflow[]>;
  getWorkflowsByTriggerType(triggerType: string): Promise<Workflow[]>;
  createWorkflow(workflow: InsertWorkflow): Promise<Workflow>;
  updateWorkflow(id: string, updates: Partial<Workflow>): Promise<Workflow>;
  deleteWorkflow(id: string): Promise<boolean>;

  // Workflow Step methods
  getWorkflowSteps(workflowId: string): Promise<WorkflowStep[]>;
  getWorkflowStep(id: string): Promise<WorkflowStep | undefined>;
  createWorkflowStep(step: InsertWorkflowStep): Promise<WorkflowStep>;
  updateWorkflowStep(id: string, updates: Partial<WorkflowStep>): Promise<WorkflowStep>;
  deleteWorkflowStep(id: string): Promise<boolean>;
  reorderWorkflowSteps(workflowId: string, stepIds: string[]): Promise<boolean>;

  // StormShare Community methods
  
  // StormShare Groups
  getStormShareGroups(): Promise<StormShareGroup[]>;
  getStormShareGroup(id: string): Promise<StormShareGroup | undefined>;
  getStormShareGroupBySlug(slug: string): Promise<StormShareGroup | undefined>;
  getStormShareGroupsByType(type: string): Promise<StormShareGroup[]>;
  getStormShareGroupsByOwner(ownerId: string): Promise<StormShareGroup[]>;
  createStormShareGroup(group: InsertStormShareGroup): Promise<StormShareGroup>;
  updateStormShareGroup(id: string, updates: Partial<StormShareGroup>): Promise<StormShareGroup>;
  deleteStormShareGroup(id: string): Promise<boolean>;

  // StormShare Group Members
  getStormShareGroupMembers(groupId: string): Promise<StormShareGroupMember[]>;
  getStormShareGroupMember(groupId: string, userId: string): Promise<StormShareGroupMember | undefined>;
  getStormShareGroupMembershipsByUser(userId: string): Promise<StormShareGroupMember[]>;
  createStormShareGroupMember(member: InsertStormShareGroupMember): Promise<StormShareGroupMember>;
  updateStormShareGroupMember(id: string, updates: Partial<StormShareGroupMember>): Promise<StormShareGroupMember>;
  deleteStormShareGroupMember(id: string): Promise<boolean>;

  // StormShare Messages
  getStormShareMessages(groupId?: string, postId?: string): Promise<StormShareMessage[]>;
  getStormShareMessage(id: string): Promise<StormShareMessage | undefined>;
  getStormShareMessagesByUser(userId: string): Promise<StormShareMessage[]>;
  createStormShareMessage(message: InsertStormShareMessage): Promise<StormShareMessage>;
  updateStormShareMessage(id: string, updates: Partial<StormShareMessage>): Promise<StormShareMessage>;
  deleteStormShareMessage(id: string): Promise<boolean>;

  // Help Requests
  getHelpRequests(): Promise<HelpRequest[]>;
  getHelpRequest(id: string): Promise<HelpRequest | undefined>;
  getHelpRequestsByUser(userId: string): Promise<HelpRequest[]>;
  getHelpRequestsByStatus(status: string): Promise<HelpRequest[]>;
  getHelpRequestsByLocation(state?: string, city?: string): Promise<HelpRequest[]>;
  getHelpRequestsByCategory(category: string): Promise<HelpRequest[]>;
  createHelpRequest(request: InsertHelpRequest): Promise<HelpRequest>;
  updateHelpRequest(id: string, updates: Partial<HelpRequest>): Promise<HelpRequest>;
  deleteHelpRequest(id: string): Promise<boolean>;
  convertHelpRequestToLead(helpRequestId: string, contractorId: string): Promise<{ helpRequest: HelpRequest, lead: Lead }>;

  // StormShare Media Assets
  getStormShareMediaAssets(): Promise<StormShareMediaAsset[]>;
  getStormShareMediaAsset(id: string): Promise<StormShareMediaAsset | undefined>;
  getStormShareMediaAssetsByOwner(ownerId: string): Promise<StormShareMediaAsset[]>;
  getStormShareMediaAssetsByType(assetType: string): Promise<StormShareMediaAsset[]>;
  createStormShareMediaAsset(asset: InsertStormShareMediaAsset): Promise<StormShareMediaAsset>;
  updateStormShareMediaAsset(id: string, updates: Partial<StormShareMediaAsset>): Promise<StormShareMediaAsset>;
  deleteStormShareMediaAsset(id: string): Promise<boolean>;

  // StormShare Ad Campaigns
  getStormShareAdCampaigns(): Promise<StormShareAdCampaign[]>;
  getStormShareAdCampaign(id: string): Promise<StormShareAdCampaign | undefined>;
  getActiveStormShareAdCampaigns(): Promise<StormShareAdCampaign[]>;
  getStormShareAdCampaignsByAdvertiser(advertiserName: string): Promise<StormShareAdCampaign[]>;
  getStormShareAdCampaignsByTarget(targetAudience: string): Promise<StormShareAdCampaign[]>;
  createStormShareAdCampaign(campaign: InsertStormShareAdCampaign): Promise<StormShareAdCampaign>;
  updateStormShareAdCampaign(id: string, updates: Partial<StormShareAdCampaign>): Promise<StormShareAdCampaign>;
  deleteStormShareAdCampaign(id: string): Promise<boolean>;
  incrementAdImpressions(campaignId: string): Promise<void>;
  incrementAdClicks(campaignId: string): Promise<void>;

  // ===== DISASTER LENS METHODS =====
  
  // Organization methods
  getOrganizations(): Promise<Organization[]>;
  getOrganization(id: string): Promise<Organization | undefined>;
  createOrganization(org: InsertOrganization): Promise<Organization>;
  updateOrganization(id: string, updates: Partial<Organization>): Promise<Organization>;
  
  // Organization Member methods
  getOrganizationMembers(orgId: string): Promise<OrganizationMember[]>;
  getOrganizationMembership(userId: string, orgId: string): Promise<OrganizationMember | undefined>;
  getUserOrganizations(userId: string): Promise<OrganizationMember[]>;
  createOrganizationMember(member: InsertOrganizationMember): Promise<OrganizationMember>;
  updateOrganizationMember(orgId: string, userId: string, updates: Partial<OrganizationMember>): Promise<OrganizationMember>;
  deleteOrganizationMember(orgId: string, userId: string): Promise<boolean>;

  // Project methods
  getProjects(query?: { orgId?: string; status?: string; search?: string }): Promise<Project[]>;
  getProject(id: string): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: string, updates: Partial<Project>): Promise<Project>;
  deleteProject(id: string): Promise<boolean>;
  
  // Media methods
  getMediaByProject(projectId: string): Promise<Media[]>;
  getMedia(id: string): Promise<Media | undefined>;
  createMedia(media: InsertMedia): Promise<Media>;
  updateMedia(id: string, updates: Partial<Media>): Promise<Media>;
  deleteMedia(id: string): Promise<boolean>;
  
  // Annotation methods
  getAnnotationsByMedia(mediaId: string): Promise<Annotation[]>;
  getAnnotation(id: string): Promise<Annotation | undefined>;
  createAnnotation(annotation: InsertAnnotation): Promise<Annotation>;
  updateAnnotation(id: string, updates: Partial<Annotation>): Promise<Annotation>;
  deleteAnnotation(id: string): Promise<boolean>;
  
  // Comment methods
  getCommentsByProject(projectId: string): Promise<Comment[]>;
  getCommentsByMedia(mediaId: string): Promise<Comment[]>;
  getComment(id: string): Promise<Comment | undefined>;
  createComment(comment: InsertComment): Promise<Comment>;
  updateComment(id: string, updates: Partial<Comment>): Promise<Comment>;
  deleteComment(id: string): Promise<boolean>;
  
  // Disaster Task methods
  getDisasterTasksByProject(projectId: string): Promise<DisasterTask[]>;
  getDisasterTask(id: string): Promise<DisasterTask | undefined>;
  createDisasterTask(task: InsertDisasterTask): Promise<DisasterTask>;
  updateDisasterTask(id: string, updates: Partial<DisasterTask>): Promise<DisasterTask>;
  deleteDisasterTask(id: string): Promise<boolean>;
  
  // Disaster Report methods
  getDisasterReportsByProject(projectId: string): Promise<DisasterReport[]>;
  getDisasterReport(id: string): Promise<DisasterReport | undefined>;
  createDisasterReport(report: InsertDisasterReport): Promise<DisasterReport>;
  updateDisasterReport(id: string, updates: Partial<DisasterReport>): Promise<DisasterReport>;
  deleteDisasterReport(id: string): Promise<boolean>;
  
  // Share methods
  getSharesByProject(projectId: string): Promise<Share[]>;
  getShare(id: string): Promise<Share | undefined>;
  getShareByToken(token: string): Promise<Share | undefined>;
  createShare(share: InsertShare): Promise<Share>;
  updateShare(id: string, updates: Partial<Share>): Promise<Share>;
  deleteShare(id: string): Promise<boolean>;
  
  // AI Assistant methods
  createAiSession(session: InsertAiSession): Promise<AiSession>;
  getAiSession(id: string): Promise<AiSession | undefined>;
  getAiSessionsByProject(projectId: string): Promise<AiSession[]>;
  createAiAction(action: InsertAiAction): Promise<AiAction>;
  getAiActionsBySession(sessionId: string): Promise<AiAction[]>;
  createMediaFrame(frame: InsertMediaFrame): Promise<MediaFrame>;
  getMediaFramesByMedia(mediaId: string): Promise<MediaFrame[]>;
  
  // Audit Log methods
  createAuditLog(entry: InsertAuditLogEntry): Promise<AuditLogEntry>;
  getAuditLogByProject(projectId: string): Promise<AuditLogEntry[]>;
  
  // Voice Profile methods
  getVoiceProfiles(): Promise<VoiceProfile[]>;
  getActiveVoiceProfiles(): Promise<VoiceProfile[]>;
  getVoiceProfile(id: string): Promise<VoiceProfile | undefined>;
  getDefaultVoiceProfile(): Promise<VoiceProfile | undefined>;
  createVoiceProfile(profile: InsertVoiceProfile): Promise<VoiceProfile>;
  updateVoiceProfile(id: string, updates: Partial<VoiceProfile>): Promise<VoiceProfile>;
  deleteVoiceProfile(id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private claims: Map<string, Claim> = new Map();
  private insuranceCompanies: Map<string, InsuranceCompany> = new Map();
  private lienRules: Map<string, LienRule> = new Map();
  private weatherAlerts: Map<string, WeatherAlert> = new Map();
  private fieldReports: Map<string, FieldReport> = new Map();
  private droneFootage: Map<string, DroneFootage> = new Map();
  private marketComparables: Map<string, MarketComparable> = new Map();
  private aiInteractions: Map<string, AiInteraction> = new Map();
  private dspFootage: Map<string, DspFootage> = new Map();
  private leads: Map<string, Lead> = new Map();
  private invoices: Map<string, Invoice> = new Map();
  private jobCosts: Map<string, JobCost> = new Map();
  private photos: Map<string, Photo> = new Map();
  private xactimateComparables: Map<string, XactimateComparable> = new Map();
  private claimSubmissions: Map<string, ClaimSubmission> = new Map();
  private contractorDocuments: Map<string, ContractorDocument> = new Map();
  private contractorWatchlist: Map<string, ContractorWatchlist> = new Map();
  private stormHotZones: Map<string, StormHotZone> = new Map();
  
  // Drone Fleet Management Storage
  private drones: Map<string, Drone> = new Map();
  private missions: Map<string, Mission> = new Map();
  private telemetry: Map<string, Telemetry> = new Map();
  
  // Victim Portal Storage
  private homeowners: Map<string, Homeowner> = new Map();
  private damageReports: Map<string, DamageReport> = new Map();
  private serviceRequests: Map<string, ServiceRequest> = new Map();
  private emergencyContacts: Map<string, EmergencyContact> = new Map();
  
  // Traffic Camera System Storage
  private trafficCamAlerts: Map<string, TrafficCamAlert> = new Map();
  private trafficCamLeads: Map<string, TrafficCamLead> = new Map();
  
  // Predictive Storm AI Storage
  private stormPredictions: Map<string, StormPrediction> = new Map();
  private damageForecasts: Map<string, DamageForecast> = new Map();
  private contractorOpportunityPredictions: Map<string, ContractorOpportunityPrediction> = new Map();
  private historicalDamagePatterns: Map<string, HistoricalDamagePattern> = new Map();
  private radarAnalysisCache: Map<string, RadarAnalysisCache> = new Map();

  // AI Damage Detection Foundation Storage
  private detectionJobs: Map<string, DetectionJob> = new Map();
  private detectionResults: Map<string, DetectionResult> = new Map();

  // Lead Capture System Storage
  private funnels: Map<string, Funnel> = new Map();
  private funnelSteps: Map<string, FunnelStep> = new Map();
  private forms: Map<string, Form> = new Map();
  private formFields: Map<string, FormField> = new Map();
  private calendarBookings: Map<string, CalendarBooking> = new Map();
  private workflows: Map<string, Workflow> = new Map();
  private workflowSteps: Map<string, WorkflowStep> = new Map();

  // StormShare Community Storage
  private stormShareGroups: Map<string, StormShareGroup> = new Map();
  private stormShareGroupMembers: Map<string, StormShareGroupMember> = new Map();
  private stormShareMessages: Map<string, StormShareMessage> = new Map();
  private helpRequests: Map<string, HelpRequest> = new Map();
  private stormShareMediaAssets: Map<string, StormShareMediaAsset> = new Map();
  private stormShareAdCampaigns: Map<string, StormShareAdCampaign> = new Map();

  // Disaster Lens Storage
  private organizations: Map<string, Organization> = new Map();
  private organizationMembers: Map<string, OrganizationMember> = new Map();
  private projects: Map<string, Project> = new Map();
  private media: Map<string, Media> = new Map();
  private annotations: Map<string, Annotation> = new Map();
  private comments: Map<string, Comment> = new Map();
  private disasterTasks: Map<string, DisasterTask> = new Map();
  private disasterReports: Map<string, DisasterReport> = new Map();
  private shares: Map<string, Share> = new Map();
  private auditLog: Map<string, AuditLogEntry> = new Map();
  
  // AI Assistant Storage
  private aiSessions: Map<string, AiSession> = new Map();
  private aiActions: Map<string, AiAction> = new Map();
  private mediaFrames: Map<string, MediaFrame> = new Map();
  
  // Voice Profile Storage
  private voiceProfiles: Map<string, VoiceProfile> = new Map();

  constructor() {
    console.log('🏗️ Initializing MemStorage...');
    this.initializeTestData();
    console.log('📍 Loading storm hot zones...');
    this.loadStormHotZones();
    console.log('✅ MemStorage initialization complete');
  }

  private initializeTestData() {
    // Initialize default users for authentication testing
    const defaultUsers = [
      {
        id: 'victim-001',
        username: 'sarah_victim',
        password: 'password123', // In prod, this would be properly hashed
        email: 'sarah@example.com',
        role: 'victim',
        createdAt: new Date(),
      },
      {
        id: 'contractor-001', 
        username: 'mike_contractor',
        password: 'password123',
        email: 'mike@example.com',
        role: 'contractor',
        createdAt: new Date(),
      },
      {
        id: 'business-001',
        username: 'acme_business', 
        password: 'password123',
        email: 'marketing@acme.com',
        role: 'business',
        createdAt: new Date(),
      },
      {
        id: 'admin-001',
        username: 'admin_user',
        password: 'password123',
        email: 'admin@stormshare.com',
        role: 'admin', 
        createdAt: new Date(),
      }
    ];

    defaultUsers.forEach(user => {
      this.users.set(user.id, user as User);
    });
    
    console.log('👥 Seeded default users:', defaultUsers.map(u => `${u.username} (${u.role})`).join(', '));
    
    // Debug: log all users in storage
    console.log('🔍 Users in storage after seeding:', Array.from(this.users.keys()));

    // Initialize default FEMALE VOICE PROFILES (ARIA & Lily from ElevenLabs)
    const defaultVoiceProfiles = [
      {
        id: 'voice-aria-default',
        name: 'ARIA - Broadcast Pro Female Voice',
        provider: 'elevenlabs',
        providerVoiceId: 'E8qtV3izSOr5vmxy1BHV',
        isDefault: true,
        isActive: true,
        settings: {
          stability: 0.5,
          similarityBoost: 0.8,
          useSpeakerBoost: true
        },
        metadata: {
          description: 'Professional female broadcast voice with natural delivery',
          language: 'en-US',
          gender: 'female',
          voiceCharacteristics: ['professional', 'clear', 'empathetic', 'broadcast-quality']
        },
        createdBy: 'system',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'voice-lily-backup',
        name: 'Lily - Natural Female Voice',
        provider: 'elevenlabs',
        providerVoiceId: 'pNInz6obpgDQGcFmaJgB',
        isDefault: false,
        isActive: true,
        settings: {
          stability: 0.5,
          similarityBoost: 0.75,
          useSpeakerBoost: true
        },
        metadata: {
          description: 'Natural, warm female voice',
          language: 'en-US',
          gender: 'female',
          voiceCharacteristics: ['natural', 'warm', 'friendly']
        },
        createdBy: 'system',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'voice-nova-fallback',
        name: 'Nova - OpenAI Female Voice (Fallback)',
        provider: 'openai',
        providerVoiceId: 'nova',
        isDefault: false,
        isActive: true,
        settings: {
          model: 'tts-1-hd',
          speed: 0.95
        },
        metadata: {
          description: 'OpenAI Nova female voice - used as fallback when ElevenLabs is unavailable',
          language: 'en-US',
          gender: 'female',
          voiceCharacteristics: ['clear', 'professional']
        },
        createdBy: 'system',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    defaultVoiceProfiles.forEach(profile => {
      this.voiceProfiles.set(profile.id, profile as VoiceProfile);
    });
    
    console.log('🎤 Seeded default FEMALE voice profiles: ARIA (default), Lily, Nova (fallback)');

    // Initialize with some basic insurance companies
    const companies = [
      { name: "State Farm", code: "SF", avgPayout: 4850, totalClaims: 127, successRate: 92, payoutTrend: 8 },
      { name: "Allstate", code: "AS", avgPayout: 4120, totalClaims: 89, successRate: 87, payoutTrend: -3 },
      { name: "GEICO", code: "GE", avgPayout: 5220, totalClaims: 156, successRate: 95, payoutTrend: 12 },
      { name: "Progressive", code: "PR", avgPayout: 4650, totalClaims: 98, successRate: 89, payoutTrend: 5 },
      { name: "Farmers", code: "FM", avgPayout: 4980, totalClaims: 112, successRate: 91, payoutTrend: 7 },
    ];

    companies.forEach(company => {
      const id = randomUUID();
      this.insuranceCompanies.set(id, {
        id,
        ...company,
        claimsEmail: `claims@${company.name.toLowerCase().replace(' ', '')}.com`,
        claimsPhone: "1-800-CLAIMS",
        mailingAddress: "Claims Dept, Corporate Office",
        website: `https://www.${company.name.toLowerCase().replace(' ', '')}.com`,
        disasterClaimsEmail: `disaster@${company.name.toLowerCase().replace(' ', '')}.com`,
        disasterClaimsPhone: "1-800-DISASTER",
        claimSubmissionPortal: `https://claims.${company.name.toLowerCase().replace(' ', '')}.com`,
        states: ["GA", "FL", "AL", "SC", "NC", "TN", "TX"],
        notes: "",
        updatedAt: new Date(),
      });
    });

    // Initialize lien rules for key states
    const lienRulesData = [
      { state: "GA", prelimNoticeRequired: true, prelimNoticeDeadline: "30 days", lienFilingDeadline: "90 days", enforcementDeadline: "1 year" },
      { state: "FL", prelimNoticeRequired: true, prelimNoticeDeadline: "45 days", lienFilingDeadline: "90 days", enforcementDeadline: "1 year" },
      { state: "TX", prelimNoticeRequired: true, prelimNoticeDeadline: "15th day 2nd month", lienFilingDeadline: "15th day 3rd month", enforcementDeadline: "1 year" },
      { state: "AL", prelimNoticeRequired: false, prelimNoticeDeadline: "N/A", lienFilingDeadline: "4 months", enforcementDeadline: "6 months" },
      { state: "SC", prelimNoticeRequired: false, prelimNoticeDeadline: "N/A", lienFilingDeadline: "90 days", enforcementDeadline: "6 months" },
    ];

    lienRulesData.forEach(rule => {
      const id = randomUUID();
      this.lienRules.set(id, {
        id,
        ...rule,
        homesteadNote: "Standard residential rules apply",
        treeServiceNote: "Emergency tree removal typically qualifies as labor for private property liens",
        sourceUrl: "https://www.levelset.com/mechanics-lien/",
        lastVerified: new Date(),
      });
    });

    // Initialize sample help requests for testing StormShare functionality
    const sampleHelpRequests = [
      {
        id: randomUUID(),
        userId: 'victim-001',
        title: 'Tree fell on my roof - need emergency help',
        description: 'Large oak tree fell during the storm last night and punched a hole through my roof. Water is getting in and I need immediate tarping and tree removal. Insurance will cover it.',
        category: 'tree_removal',
        address: '123 Maple Street',
        city: 'Atlanta',
        state: 'GA',
        zipCode: '30309',
        contactPhone: '(404) 555-0123',
        contactEmail: 'sarah@example.com',
        urgencyLevel: 'emergency' as const,
        hasInsurance: true,
        canPayImmediately: false,
        estimatedBudget: '$5000-10000',
        status: 'open' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: randomUUID(),
        userId: 'victim-001', 
        title: 'Storm damage repair needed',
        description: 'My house has significant siding damage and several broken windows from the hailstorm. Looking for a reliable contractor to assess and repair. State Farm is my insurance company.',
        category: 'home_repair',
        address: '456 Oak Avenue',
        city: 'Tampa',
        state: 'FL',
        zipCode: '33602',
        contactPhone: '(813) 555-0456',
        contactEmail: 'sarah@example.com',
        urgencyLevel: 'urgent' as const,
        hasInsurance: true,
        canPayImmediately: true,
        estimatedBudget: '$15000-25000',
        status: 'open' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: randomUUID(),
        userId: 'admin-001',
        title: 'Fence and deck repair after wind damage',
        description: 'High winds knocked down sections of my privacy fence and damaged my deck railing. Need quotes for repair and replacement.',
        category: 'fence_repair',
        address: '789 Pine Road',
        city: 'Charlotte',
        state: 'NC',
        zipCode: '28202',
        contactPhone: '(704) 555-0789',
        contactEmail: 'admin@stormshare.com',
        urgencyLevel: 'normal' as const,
        hasInsurance: false,
        canPayImmediately: true,
        estimatedBudget: '$2000-5000',
        status: 'open' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ];

    sampleHelpRequests.forEach(request => {
      this.helpRequests.set(request.id, request);
    });

    console.log('🆘 Seeded sample help requests:', sampleHelpRequests.length);

    // Initialize sample StormShare groups for testing
    const sampleGroups = [
      {
        id: randomUUID(),
        name: 'Georgia Storm Recovery',
        slug: 'georgia-storm-recovery',
        type: 'contractor' as const,
        description: 'Professional contractors helping Georgia homeowners recover from storm damage',
        ownerId: 'contractor-001',
        memberCount: 12,
        isPublic: true,
        tags: ['storm', 'georgia', 'professional'],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: randomUUID(),
        name: 'Hurricane Helene Victims',
        slug: 'hurricane-helene-victims',
        type: 'support' as const,
        description: 'Support group for Hurricane Helene victims sharing resources and experiences',
        ownerId: 'victim-001',
        memberCount: 8,
        isPublic: true,
        tags: ['hurricane', 'support', 'victims'],
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ];

    sampleGroups.forEach(group => {
      this.stormShareGroups.set(group.id, group);
    });

    console.log('👥 Seeded sample StormShare groups:', sampleGroups.length);
    
    // Initialize Disaster Lens sample data
    this.initializeDisasterLensSampleData();
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id, 
      createdAt: new Date() 
    };
    this.users.set(id, user);
    return user;
  }

  // Claim methods
  async getClaims(): Promise<Claim[]> {
    return Array.from(this.claims.values());
  }

  async getClaim(id: string): Promise<Claim | undefined> {
    return this.claims.get(id);
  }

  async createClaim(insertClaim: InsertClaim): Promise<Claim> {
    const id = randomUUID();
    const claim: Claim = { 
      ...insertClaim, 
      id, 
      createdAt: new Date(), 
      updatedAt: new Date() 
    };
    this.claims.set(id, claim);
    return claim;
  }

  async updateClaim(id: string, updates: Partial<Claim>): Promise<Claim> {
    const claim = this.claims.get(id);
    if (!claim) throw new Error("Claim not found");
    
    const updatedClaim = { ...claim, ...updates, updatedAt: new Date() };
    this.claims.set(id, updatedClaim);
    return updatedClaim;
  }

  async getClaimsByInsuranceCompany(company: string): Promise<Claim[]> {
    return Array.from(this.claims.values()).filter(claim => claim.insuranceCompany === company);
  }

  async getClaimsByState(state: string): Promise<Claim[]> {
    return Array.from(this.claims.values()).filter(claim => claim.state === state);
  }

  // Insurance Company methods
  async getInsuranceCompanies(): Promise<InsuranceCompany[]> {
    return Array.from(this.insuranceCompanies.values());
  }

  async getInsuranceCompany(id: string): Promise<InsuranceCompany | undefined> {
    return this.insuranceCompanies.get(id);
  }

  async createInsuranceCompany(insertCompany: InsertInsuranceCompany): Promise<InsuranceCompany> {
    const id = randomUUID();
    const company: InsuranceCompany = { 
      ...insertCompany, 
      id, 
      updatedAt: new Date() 
    };
    this.insuranceCompanies.set(id, company);
    return company;
  }

  async updateInsuranceCompany(id: string, updates: Partial<InsuranceCompany>): Promise<InsuranceCompany> {
    const company = this.insuranceCompanies.get(id);
    if (!company) throw new Error("Insurance company not found");
    
    const updatedCompany = { ...company, ...updates, updatedAt: new Date() };
    this.insuranceCompanies.set(id, updatedCompany);
    return updatedCompany;
  }

  // Lien Rule methods
  async getLienRules(): Promise<LienRule[]> {
    return Array.from(this.lienRules.values());
  }

  async getLienRule(state: string): Promise<LienRule | undefined> {
    return Array.from(this.lienRules.values()).find(rule => rule.state === state);
  }

  async createLienRule(insertRule: InsertLienRule): Promise<LienRule> {
    const id = randomUUID();
    const rule: LienRule = { 
      ...insertRule, 
      id, 
      lastVerified: new Date() 
    };
    this.lienRules.set(id, rule);
    return rule;
  }

  async updateLienRule(state: string, updates: Partial<LienRule>): Promise<LienRule> {
    const rule = Array.from(this.lienRules.values()).find(r => r.state === state);
    if (!rule) throw new Error("Lien rule not found");
    
    const updatedRule = { ...rule, ...updates, lastVerified: new Date() };
    this.lienRules.set(rule.id, updatedRule);
    return updatedRule;
  }

  // Weather Alert methods
  async getWeatherAlerts(): Promise<WeatherAlert[]> {
    return Array.from(this.weatherAlerts.values());
  }

  async getActiveWeatherAlerts(): Promise<WeatherAlert[]> {
    return Array.from(this.weatherAlerts.values()).filter(alert => alert.isActive);
  }

  async createWeatherAlert(insertAlert: InsertWeatherAlert): Promise<WeatherAlert> {
    const id = randomUUID();
    const alert: WeatherAlert = { 
      ...insertAlert, 
      id, 
      createdAt: new Date() 
    };
    this.weatherAlerts.set(id, alert);
    return alert;
  }

  async updateWeatherAlert(id: string, updates: Partial<WeatherAlert>): Promise<WeatherAlert> {
    const alert = this.weatherAlerts.get(id);
    if (!alert) throw new Error("Weather alert not found");
    
    const updatedAlert = { ...alert, ...updates };
    this.weatherAlerts.set(id, updatedAlert);
    return updatedAlert;
  }

  // Field Report methods
  async getFieldReports(): Promise<FieldReport[]> {
    return Array.from(this.fieldReports.values());
  }

  async getFieldReport(id: string): Promise<FieldReport | undefined> {
    return this.fieldReports.get(id);
  }

  async createFieldReport(insertReport: InsertFieldReport): Promise<FieldReport> {
    const id = randomUUID();
    const report: FieldReport = { 
      ...insertReport, 
      id, 
      createdAt: new Date(), 
      updatedAt: new Date() 
    };
    this.fieldReports.set(id, report);
    return report;
  }

  async updateFieldReport(id: string, updates: Partial<FieldReport>): Promise<FieldReport> {
    const report = this.fieldReports.get(id);
    if (!report) throw new Error("Field report not found");
    
    const updatedReport = { ...report, ...updates, updatedAt: new Date() };
    this.fieldReports.set(id, updatedReport);
    return updatedReport;
  }

  async getFieldReportsByCrew(crewId: string): Promise<FieldReport[]> {
    return Array.from(this.fieldReports.values()).filter(report => report.crewId === crewId);
  }

  // Drone Footage methods
  async getDroneFootage(): Promise<DroneFootage[]> {
    return Array.from(this.droneFootage.values());
  }

  async getLiveDroneFootage(): Promise<DroneFootage[]> {
    return Array.from(this.droneFootage.values()).filter(footage => footage.isLive);
  }

  async createDroneFootage(insertFootage: InsertDroneFootage): Promise<DroneFootage> {
    const id = randomUUID();
    const footage: DroneFootage = { 
      ...insertFootage, 
      id, 
      createdAt: new Date() 
    };
    this.droneFootage.set(id, footage);
    return footage;
  }

  // Market Comparable methods
  async getMarketComparables(): Promise<MarketComparable[]> {
    return Array.from(this.marketComparables.values());
  }

  async getMarketComparable(claimType: string, company: string, region: string): Promise<MarketComparable | undefined> {
    return Array.from(this.marketComparables.values()).find(
      comp => comp.claimType === claimType && comp.insuranceCompany === company && comp.region === region
    );
  }

  async createMarketComparable(insertComparable: InsertMarketComparable): Promise<MarketComparable> {
    const id = randomUUID();
    const comparable: MarketComparable = { 
      ...insertComparable, 
      id, 
      lastUpdated: new Date() 
    };
    this.marketComparables.set(id, comparable);
    return comparable;
  }

  // AI Interaction methods
  async createAiInteraction(insertInteraction: InsertAiInteraction): Promise<AiInteraction> {
    const id = randomUUID();
    const interaction: AiInteraction = { 
      ...insertInteraction, 
      id, 
      createdAt: new Date() 
    };
    this.aiInteractions.set(id, interaction);
    return interaction;
  }

  async getAiInteractionsByUser(userId: string): Promise<AiInteraction[]> {
    return Array.from(this.aiInteractions.values()).filter(interaction => interaction.userId === userId);
  }

  // DSP Footage methods
  async getDspFootage(): Promise<DspFootage[]> {
    return Array.from(this.dspFootage.values());
  }

  async getDspFootageByProvider(provider: string): Promise<DspFootage[]> {
    return Array.from(this.dspFootage.values()).filter(footage => footage.provider === provider);
  }

  async createDspFootage(footage: InsertDspFootage): Promise<DspFootage> {
    const id = randomUUID();
    const newFootage: DspFootage = {
      id,
      ...footage,
      createdAt: new Date(),
      processedAt: null,
    };
    this.dspFootage.set(id, newFootage);
    return newFootage;
  }

  async updateDspFootage(id: string, updates: Partial<DspFootage>): Promise<DspFootage> {
    const existing = this.dspFootage.get(id);
    if (!existing) {
      throw new Error(`DSP footage with id ${id} not found`);
    }
    const updated = { ...existing, ...updates };
    this.dspFootage.set(id, updated);
    return updated;
  }

  // Lead methods
  async getLeads(): Promise<Lead[]> {
    return Array.from(this.leads.values());
  }

  async getLeadsByContractor(contractorId: string): Promise<Lead[]> {
    return Array.from(this.leads.values()).filter(lead => lead.contractorId === contractorId);
  }

  async getLead(id: string): Promise<Lead | undefined> {
    return this.leads.get(id);
  }

  async createLead(insertLead: InsertLead): Promise<Lead> {
    const id = randomUUID();
    const lead: Lead = { 
      ...insertLead, 
      id, 
      createdAt: new Date(), 
      updatedAt: new Date() 
    };
    this.leads.set(id, lead);
    return lead;
  }

  async updateLead(id: string, updates: Partial<Lead>): Promise<Lead> {
    const lead = this.leads.get(id);
    if (!lead) throw new Error("Lead not found");
    
    const updatedLead = { ...lead, ...updates, updatedAt: new Date() };
    this.leads.set(id, updatedLead);
    return updatedLead;
  }

  // Invoice methods
  async getInvoices(): Promise<Invoice[]> {
    return Array.from(this.invoices.values());
  }

  async getInvoicesByContractor(contractorId: string): Promise<Invoice[]> {
    return Array.from(this.invoices.values()).filter(invoice => invoice.contractorId === contractorId);
  }

  async getInvoice(id: string): Promise<Invoice | undefined> {
    return this.invoices.get(id);
  }

  async createInvoice(insertInvoice: InsertInvoice): Promise<Invoice> {
    const id = randomUUID();
    const invoice: Invoice = { 
      ...insertInvoice, 
      id, 
      createdAt: new Date(), 
      updatedAt: new Date() 
    };
    this.invoices.set(id, invoice);
    return invoice;
  }

  async updateInvoice(id: string, updates: Partial<Invoice>): Promise<Invoice> {
    const invoice = this.invoices.get(id);
    if (!invoice) throw new Error("Invoice not found");
    
    const updatedInvoice = { ...invoice, ...updates, updatedAt: new Date() };
    this.invoices.set(id, updatedInvoice);
    return updatedInvoice;
  }

  // Job Cost methods
  async getJobCostsByInvoice(invoiceId: string): Promise<JobCost[]> {
    return Array.from(this.jobCosts.values()).filter(cost => cost.invoiceId === invoiceId);
  }

  async createJobCost(insertJobCost: InsertJobCost): Promise<JobCost> {
    const id = randomUUID();
    const jobCost: JobCost = { 
      ...insertJobCost, 
      id, 
      createdAt: new Date() 
    };
    this.jobCosts.set(id, jobCost);
    return jobCost;
  }

  // Photo methods
  async getPhotos(): Promise<Photo[]> {
    return Array.from(this.photos.values());
  }

  async getPhotosByContractor(contractorId: string): Promise<Photo[]> {
    return Array.from(this.photos.values()).filter(photo => photo.contractorId === contractorId);
  }

  async getPhotosByLead(leadId: string): Promise<Photo[]> {
    return Array.from(this.photos.values()).filter(photo => photo.leadId === leadId);
  }

  async getPhotosByInvoice(invoiceId: string): Promise<Photo[]> {
    return Array.from(this.photos.values()).filter(photo => photo.invoiceId === invoiceId);
  }

  async createPhoto(insertPhoto: InsertPhoto): Promise<Photo> {
    const id = randomUUID();
    const photo: Photo = { 
      ...insertPhoto, 
      id, 
      createdAt: new Date() 
    };
    this.photos.set(id, photo);
    return photo;
  }

  // Xactimate Comparable methods
  async getXactimateComparablesByInvoice(invoiceId: string): Promise<XactimateComparable[]> {
    return Array.from(this.xactimateComparables.values()).filter(comp => comp.invoiceId === invoiceId);
  }

  async createXactimateComparable(insertComparable: InsertXactimateComparable): Promise<XactimateComparable> {
    const id = randomUUID();
    const comparable: XactimateComparable = { 
      ...insertComparable, 
      id, 
      createdAt: new Date() 
    };
    this.xactimateComparables.set(id, comparable);
    return comparable;
  }

  // Claim Submission methods
  async getClaimSubmissions(): Promise<ClaimSubmission[]> {
    return Array.from(this.claimSubmissions.values());
  }

  async getClaimSubmissionsByContractor(contractorId: string): Promise<ClaimSubmission[]> {
    return Array.from(this.claimSubmissions.values()).filter(submission => submission.contractorId === contractorId);
  }

  async createClaimSubmission(insertSubmission: InsertClaimSubmission): Promise<ClaimSubmission> {
    const id = randomUUID();
    const submission: ClaimSubmission = { 
      ...insertSubmission, 
      id, 
      submittedAt: new Date() 
    };
    this.claimSubmissions.set(id, submission);
    return submission;
  }

  async updateClaimSubmission(id: string, updates: Partial<ClaimSubmission>): Promise<ClaimSubmission> {
    const submission = this.claimSubmissions.get(id);
    if (!submission) throw new Error("Claim submission not found");
    
    const updatedSubmission = { ...submission, ...updates };
    this.claimSubmissions.set(id, updatedSubmission);
    return updatedSubmission;
  }

  // Contractor Document methods
  async getContractorDocuments(): Promise<ContractorDocument[]> {
    return Array.from(this.contractorDocuments.values());
  }

  async getContractorDocumentsByContractor(contractorId: string): Promise<ContractorDocument[]> {
    return Array.from(this.contractorDocuments.values()).filter(doc => doc.contractorId === contractorId);
  }

  async createContractorDocument(insertDocument: InsertContractorDocument): Promise<ContractorDocument> {
    const id = randomUUID();
    const document: ContractorDocument = { 
      ...insertDocument, 
      id, 
      createdAt: new Date(), 
      updatedAt: new Date() 
    };
    this.contractorDocuments.set(id, document);
    return document;
  }

  // Contractor Watchlist methods with JSON file persistence
  private getWatchlistFilePath(): string {
    const dataDir = path.join(process.cwd(), "data");
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    return path.join(dataDir, "contractor-watchlist.json");
  }

  private loadWatchlistFromFile(): void {
    try {
      const filePath = this.getWatchlistFilePath();
      if (fs.existsSync(filePath)) {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const items = data.items || [];
        this.contractorWatchlist.clear();
        items.forEach((item: ContractorWatchlist) => {
          this.contractorWatchlist.set(item.id, item);
        });
      }
    } catch (error) {
      console.error('Error loading watchlist from file:', error);
    }
  }

  private saveWatchlistToFile(): void {
    try {
      const filePath = this.getWatchlistFilePath();
      const items = Array.from(this.contractorWatchlist.values());
      fs.writeFileSync(filePath, JSON.stringify({ items }, null, 2));
    } catch (error) {
      console.error('Error saving watchlist to file:', error);
    }
  }

  async getContractorWatchlist(contractorId: string): Promise<ContractorWatchlist[]> {
    this.loadWatchlistFromFile();
    
    // Support getting all watchlists with '*' parameter
    if (contractorId === '*') {
      return Array.from(this.contractorWatchlist.values());
    }
    
    return Array.from(this.contractorWatchlist.values())
      .filter(item => item.contractorId === contractorId);
  }

  async addWatchlistItem(insertItem: InsertContractorWatchlist): Promise<ContractorWatchlist> {
    this.loadWatchlistFromFile();
    
    // Check if item already exists
    const existing = Array.from(this.contractorWatchlist.values())
      .find(item => 
        item.contractorId === insertItem.contractorId &&
        item.itemType === insertItem.itemType &&
        item.itemId === insertItem.itemId
      );
    
    if (existing) {
      return existing;
    }

    const id = randomUUID();
    const item: ContractorWatchlist = {
      id,
      contractorId: insertItem.contractorId,
      itemType: insertItem.itemType,
      itemId: insertItem.itemId,
      displayName: insertItem.displayName,
      state: insertItem.state,
      county: insertItem.county || null,
      alertsEnabled: insertItem.alertsEnabled ?? true,
      metadata: insertItem.metadata || null,
      createdAt: new Date()
    };
    
    this.contractorWatchlist.set(id, item);
    this.saveWatchlistToFile();
    return item;
  }

  async removeWatchlistItem(contractorId: string, itemType: string, itemId: string): Promise<boolean> {
    this.loadWatchlistFromFile();
    
    const existing = Array.from(this.contractorWatchlist.values())
      .find(item => 
        item.contractorId === contractorId &&
        item.itemType === itemType &&
        item.itemId === itemId
      );
    
    if (existing) {
      this.contractorWatchlist.delete(existing.id);
      this.saveWatchlistToFile();
      return true;
    }
    
    return false;
  }

  async updateWatchlistItem(id: string, updates: Partial<ContractorWatchlist>): Promise<ContractorWatchlist> {
    this.loadWatchlistFromFile();
    
    const existing = this.contractorWatchlist.get(id);
    if (!existing) {
      throw new Error("Watchlist item not found");
    }
    
    const updated = { ...existing, ...updates };
    this.contractorWatchlist.set(id, updated);
    this.saveWatchlistToFile();
    return updated;
  }

  // Storm Hot Zones methods implementation
  private loadStormHotZones() {
    try {
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
      const filePath = path.join(__dirname, '../data/storm-hot-zones-seed.json');
      console.log(`📍 Loading storm hot zones from: ${filePath}`);
      
      const data = fs.readFileSync(filePath, 'utf8');
      const zones = JSON.parse(data);
      console.log(`📍 Found ${zones.length} storm hot zones in seed data`);
      
      zones.forEach((zoneData: any) => {
        const id = randomUUID();
        const zone: StormHotZone = {
          id,
          state: zoneData.state,
          stateCode: zoneData.stateCode,
          countyParish: zoneData.countyParish,
          countyFips: zoneData.countyFips || null,
          stormTypes: zoneData.stormTypes,
          riskLevel: zoneData.riskLevel,
          riskScore: zoneData.riskScore,
          femaDisasterIds: zoneData.femaDisasterIds || null,
          majorStorms: zoneData.majorStorms || null,
          notes: zoneData.notes || null,
          primaryCities: zoneData.primaryCities || null,
          latitude: zoneData.latitude || null,
          longitude: zoneData.longitude || null,
          avgClaimAmount: zoneData.avgClaimAmount || null,
          marketPotential: zoneData.marketPotential || null,
          seasonalPeak: zoneData.seasonalPeak || null,
          dataSource: zoneData.dataSource || "FEMA Historical Analysis",
          lastUpdated: new Date(),
          isActive: zoneData.isActive !== undefined ? zoneData.isActive : true,
          createdAt: new Date()
        };
        this.stormHotZones.set(id, zone);
      });
    } catch (error) {
      console.error('Error loading storm hot zones data:', error);
    }
  }

  async getStormHotZones(): Promise<StormHotZone[]> {
    return Array.from(this.stormHotZones.values()).filter(zone => zone.isActive);
  }

  async getStormHotZonesByState(stateCode: string): Promise<StormHotZone[]> {
    return Array.from(this.stormHotZones.values())
      .filter(zone => zone.isActive && zone.stateCode === stateCode);
  }

  async getStormHotZonesByRiskLevel(riskLevel: string): Promise<StormHotZone[]> {
    return Array.from(this.stormHotZones.values())
      .filter(zone => zone.isActive && zone.riskLevel === riskLevel);
  }

  async getStormHotZonesByStormType(stormType: string): Promise<StormHotZone[]> {
    return Array.from(this.stormHotZones.values())
      .filter(zone => zone.isActive && zone.stormTypes.includes(stormType));
  }

  async getStormHotZonesWithFemaId(femaId: string): Promise<StormHotZone[]> {
    return Array.from(this.stormHotZones.values())
      .filter(zone => {
        if (!zone.isActive || !zone.femaDisasterIds) return false;
        const ids = Array.isArray(zone.femaDisasterIds) ? zone.femaDisasterIds : [];
        return ids.includes(femaId);
      });
  }

  async getStormHotZone(id: string): Promise<StormHotZone | undefined> {
    const zone = this.stormHotZones.get(id);
    return zone && zone.isActive ? zone : undefined;
  }

  async createStormHotZone(insertZone: InsertStormHotZone): Promise<StormHotZone> {
    const id = randomUUID();
    const zone: StormHotZone = {
      ...insertZone,
      id,
      lastUpdated: new Date(),
      isActive: insertZone.isActive !== undefined ? insertZone.isActive : true,
      createdAt: new Date()
    };
    this.stormHotZones.set(id, zone);
    return zone;
  }

  async updateStormHotZone(id: string, updates: Partial<StormHotZone>): Promise<StormHotZone> {
    const existing = this.stormHotZones.get(id);
    if (!existing) {
      throw new Error("Storm hot zone not found");
    }
    
    const updated = { 
      ...existing, 
      ...updates, 
      lastUpdated: new Date() 
    };
    this.stormHotZones.set(id, updated);
    return updated;
  }

  // ===== VICTIM PORTAL METHODS =====

  // Homeowner methods
  async getHomeowners(): Promise<Homeowner[]> {
    return Array.from(this.homeowners.values());
  }

  async getHomeowner(id: string): Promise<Homeowner | undefined> {
    return this.homeowners.get(id);
  }

  async getHomeownerByEmail(email: string): Promise<Homeowner | undefined> {
    return Array.from(this.homeowners.values()).find(homeowner => homeowner.email === email);
  }

  async createHomeowner(insertHomeowner: InsertHomeowner): Promise<Homeowner> {
    const id = randomUUID();
    const homeowner: Homeowner = { 
      ...insertHomeowner, 
      id, 
      createdAt: new Date(), 
      updatedAt: new Date() 
    };
    this.homeowners.set(id, homeowner);
    return homeowner;
  }

  async updateHomeowner(id: string, updates: Partial<Homeowner>): Promise<Homeowner> {
    const homeowner = this.homeowners.get(id);
    if (!homeowner) throw new Error("Homeowner not found");
    
    const updatedHomeowner = { ...homeowner, ...updates, updatedAt: new Date() };
    this.homeowners.set(id, updatedHomeowner);
    return updatedHomeowner;
  }

  async getHomeownersByState(state: string): Promise<Homeowner[]> {
    return Array.from(this.homeowners.values()).filter(homeowner => homeowner.state === state);
  }

  // Damage Report methods
  async getDamageReports(): Promise<DamageReport[]> {
    return Array.from(this.damageReports.values());
  }

  async getDamageReport(id: string): Promise<DamageReport | undefined> {
    return this.damageReports.get(id);
  }

  async getDamageReportsByHomeowner(homeownerId: string): Promise<DamageReport[]> {
    return Array.from(this.damageReports.values()).filter(report => report.homeownerId === homeownerId);
  }

  async createDamageReport(insertReport: InsertDamageReport): Promise<DamageReport> {
    const id = randomUUID();
    const report: DamageReport = { 
      ...insertReport, 
      id, 
      createdAt: new Date(), 
      updatedAt: new Date() 
    };
    this.damageReports.set(id, report);
    return report;
  }

  async updateDamageReport(id: string, updates: Partial<DamageReport>): Promise<DamageReport> {
    const report = this.damageReports.get(id);
    if (!report) throw new Error("Damage report not found");
    
    const updatedReport = { ...report, ...updates, updatedAt: new Date() };
    this.damageReports.set(id, updatedReport);
    return updatedReport;
  }

  async getEmergencyDamageReports(): Promise<DamageReport[]> {
    return Array.from(this.damageReports.values()).filter(report => report.isEmergency || report.severity === 'emergency');
  }

  async getDamageReportsByType(damageType: string): Promise<DamageReport[]> {
    return Array.from(this.damageReports.values()).filter(report => report.damageType === damageType);
  }

  // Service Request methods
  async getServiceRequests(): Promise<ServiceRequest[]> {
    return Array.from(this.serviceRequests.values());
  }

  async getServiceRequest(id: string): Promise<ServiceRequest | undefined> {
    return this.serviceRequests.get(id);
  }

  async getServiceRequestsByHomeowner(homeownerId: string): Promise<ServiceRequest[]> {
    return Array.from(this.serviceRequests.values()).filter(request => request.homeownerId === homeownerId);
  }

  async createServiceRequest(insertRequest: InsertServiceRequest): Promise<ServiceRequest> {
    const id = randomUUID();
    const request: ServiceRequest = { 
      ...insertRequest, 
      id, 
      createdAt: new Date(), 
      updatedAt: new Date() 
    };
    this.serviceRequests.set(id, request);
    return request;
  }

  async updateServiceRequest(id: string, updates: Partial<ServiceRequest>): Promise<ServiceRequest> {
    const request = this.serviceRequests.get(id);
    if (!request) throw new Error("Service request not found");
    
    const updatedRequest = { ...request, ...updates, updatedAt: new Date() };
    this.serviceRequests.set(id, updatedRequest);
    return updatedRequest;
  }

  async getServiceRequestsByType(serviceType: string): Promise<ServiceRequest[]> {
    return Array.from(this.serviceRequests.values()).filter(request => request.serviceType === serviceType);
  }

  async getOpenServiceRequests(): Promise<ServiceRequest[]> {
    return Array.from(this.serviceRequests.values()).filter(request => request.status === 'open');
  }

  async getServiceRequestsByLocation(lat: number, lng: number, radius: number): Promise<ServiceRequest[]> {
    return Array.from(this.serviceRequests.values()).filter(request => {
      // Get homeowner to check location
      const homeowner = this.homeowners.get(request.homeownerId);
      if (!homeowner || !homeowner.latitude || !homeowner.longitude) return false;
      
      // Simple distance calculation (could be improved with proper haversine formula)
      const latDiff = Math.abs(Number(homeowner.latitude) - lat);
      const lngDiff = Math.abs(Number(homeowner.longitude) - lng);
      const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff) * 69; // Rough miles conversion
      
      return distance <= radius;
    });
  }

  // Emergency Contact methods
  async getEmergencyContacts(): Promise<EmergencyContact[]> {
    return Array.from(this.emergencyContacts.values());
  }

  async getEmergencyContact(id: string): Promise<EmergencyContact | undefined> {
    return this.emergencyContacts.get(id);
  }

  async getEmergencyContactsByHomeowner(homeownerId: string): Promise<EmergencyContact[]> {
    return Array.from(this.emergencyContacts.values())
      .filter(contact => contact.homeownerId === homeownerId)
      .sort((a, b) => a.contactOrder - b.contactOrder);
  }

  async createEmergencyContact(insertContact: InsertEmergencyContact): Promise<EmergencyContact> {
    const id = randomUUID();
    const contact: EmergencyContact = { 
      ...insertContact, 
      id, 
      createdAt: new Date(), 
      updatedAt: new Date() 
    };
    this.emergencyContacts.set(id, contact);
    return contact;
  }

  async updateEmergencyContact(id: string, updates: Partial<EmergencyContact>): Promise<EmergencyContact> {
    const contact = this.emergencyContacts.get(id);
    if (!contact) throw new Error("Emergency contact not found");
    
    const updatedContact = { ...contact, ...updates, updatedAt: new Date() };
    this.emergencyContacts.set(id, updatedContact);
    return updatedContact;
  }

  async deleteEmergencyContact(id: string): Promise<boolean> {
    return this.emergencyContacts.delete(id);
  }

  async getPrimaryEmergencyContact(homeownerId: string): Promise<EmergencyContact | undefined> {
    return Array.from(this.emergencyContacts.values())
      .find(contact => contact.homeownerId === homeownerId && contact.isPrimary);
  }

  // Traffic Camera Alert methods
  async getTrafficCamAlerts(): Promise<TrafficCamAlert[]> {
    return Array.from(this.trafficCamAlerts.values())
      .sort((a, b) => new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime());
  }

  async getTrafficCamAlert(id: string): Promise<TrafficCamAlert | undefined> {
    return this.trafficCamAlerts.get(id);
  }

  async getTrafficCamAlertsByCamera(cameraId: string): Promise<TrafficCamAlert[]> {
    return Array.from(this.trafficCamAlerts.values())
      .filter(alert => alert.cameraId === cameraId)
      .sort((a, b) => new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime());
  }

  async getTrafficCamAlertsBySeverity(minSeverityScore: number): Promise<TrafficCamAlert[]> {
    return Array.from(this.trafficCamAlerts.values())
      .filter(alert => alert.severityScore >= minSeverityScore)
      .sort((a, b) => b.severityScore - a.severityScore);
  }

  async getTrafficCamAlertsByProfitability(minProfitabilityScore: number): Promise<TrafficCamAlert[]> {
    return Array.from(this.trafficCamAlerts.values())
      .filter(alert => alert.profitabilityScore >= minProfitabilityScore)
      .sort((a, b) => b.profitabilityScore - a.profitabilityScore);
  }

  async getTrafficCamAlertsFiltered(filters: { 
    minSeverityScore?: number; 
    minProfitabilityScore?: number; 
    emergencyOnly?: boolean; 
    limit?: number; 
  }): Promise<TrafficCamAlert[]> {
    let alerts = Array.from(this.trafficCamAlerts.values());

    if (filters.minSeverityScore !== undefined) {
      alerts = alerts.filter(alert => alert.severityScore >= filters.minSeverityScore!);
    }

    if (filters.minProfitabilityScore !== undefined) {
      alerts = alerts.filter(alert => alert.profitabilityScore >= filters.minProfitabilityScore!);
    }

    if (filters.emergencyOnly) {
      alerts = alerts.filter(alert => alert.emergencyResponse);
    }

    // Sort by detection time (newest first)
    alerts.sort((a, b) => new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime());

    if (filters.limit) {
      alerts = alerts.slice(0, filters.limit);
    }

    return alerts;
  }

  async createTrafficCamAlert(insertAlert: InsertTrafficCamAlert): Promise<TrafficCamAlert> {
    const id = randomUUID();
    const alert: TrafficCamAlert = { 
      ...insertAlert, 
      id, 
      createdAt: new Date(), 
      updatedAt: new Date() 
    };
    this.trafficCamAlerts.set(id, alert);
    console.log(`💾 Stored traffic cam alert: ${alert.alertType} (Severity: ${alert.severityScore}/10, Profit: ${alert.profitabilityScore}/10)`);
    return alert;
  }

  async updateTrafficCamAlert(id: string, updates: Partial<TrafficCamAlert>): Promise<TrafficCamAlert> {
    const alert = this.trafficCamAlerts.get(id);
    if (!alert) throw new Error("Traffic camera alert not found");
    
    const updatedAlert = { ...alert, ...updates, updatedAt: new Date() };
    this.trafficCamAlerts.set(id, updatedAlert);
    return updatedAlert;
  }

  async deleteTrafficCamAlert(id: string): Promise<boolean> {
    return this.trafficCamAlerts.delete(id);
  }

  // Traffic Camera Lead methods
  async getTrafficCamLeads(): Promise<TrafficCamLead[]> {
    return Array.from(this.trafficCamLeads.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getTrafficCamLead(id: string): Promise<TrafficCamLead | undefined> {
    return this.trafficCamLeads.get(id);
  }

  async getTrafficCamLeadsByAlert(alertId: string): Promise<TrafficCamLead[]> {
    return Array.from(this.trafficCamLeads.values())
      .filter(lead => lead.alertId === alertId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getTrafficCamLeadsByContractor(contractorId: string): Promise<TrafficCamLead[]> {
    return Array.from(this.trafficCamLeads.values())
      .filter(lead => lead.contractorId === contractorId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getTrafficCamLeadsByStatus(status: string): Promise<TrafficCamLead[]> {
    return Array.from(this.trafficCamLeads.values())
      .filter(lead => lead.status === status)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createTrafficCamLead(insertLead: InsertTrafficCamLead): Promise<TrafficCamLead> {
    const id = randomUUID();
    const lead: TrafficCamLead = { 
      ...insertLead, 
      id, 
      createdAt: new Date(), 
      updatedAt: new Date() 
    };
    this.trafficCamLeads.set(id, lead);
    console.log(`💼 Generated traffic cam lead: ${lead.alertType} for contractor ${lead.contractorId} (Value: $${lead.estimatedValue})`);
    return lead;
  }

  async updateTrafficCamLead(id: string, updates: Partial<TrafficCamLead>): Promise<TrafficCamLead> {
    const lead = this.trafficCamLeads.get(id);
    if (!lead) throw new Error("Traffic camera lead not found");
    
    const updatedLead = { ...lead, ...updates, updatedAt: new Date() };
    this.trafficCamLeads.set(id, updatedLead);
    return updatedLead;
  }

  async deleteTrafficCamLead(id: string): Promise<boolean> {
    return this.trafficCamLeads.delete(id);
  }

  // ===== PREDICTIVE STORM AI STORAGE METHODS =====

  // Storm Predictions methods
  async getStormPredictions(): Promise<StormPrediction[]> {
    return Array.from(this.stormPredictions.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getActiveStormPredictions(): Promise<StormPrediction[]> {
    const now = new Date();
    return Array.from(this.stormPredictions.values())
      .filter(prediction => 
        prediction.status === 'active' && 
        new Date(prediction.predictionEndTime) > now
      )
      .sort((a, b) => new Date(a.predictionStartTime).getTime() - new Date(b.predictionStartTime).getTime());
  }

  async getStormPrediction(id: string): Promise<StormPrediction | undefined> {
    return this.stormPredictions.get(id);
  }

  async getStormPredictionByStormId(stormId: string): Promise<StormPrediction[]> {
    return Array.from(this.stormPredictions.values())
      .filter(prediction => prediction.stormId === stormId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createStormPrediction(insertPrediction: InsertStormPrediction): Promise<StormPrediction> {
    const id = randomUUID();
    const prediction: StormPrediction = {
      ...insertPrediction,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.stormPredictions.set(id, prediction);
    console.log(`🌪️ Created storm prediction for ${prediction.stormName || prediction.stormId} (${prediction.forecastHours}h forecast)`);
    return prediction;
  }

  async updateStormPrediction(id: string, updates: Partial<StormPrediction>): Promise<StormPrediction> {
    const prediction = this.stormPredictions.get(id);
    if (!prediction) throw new Error("Storm prediction not found");
    
    const updatedPrediction = { ...prediction, ...updates, updatedAt: new Date() };
    this.stormPredictions.set(id, updatedPrediction);
    return updatedPrediction;
  }

  async deleteStormPrediction(id: string): Promise<boolean> {
    return this.stormPredictions.delete(id);
  }

  // Damage Forecasts methods
  async getDamageForecasts(): Promise<DamageForecast[]> {
    return Array.from(this.damageForecasts.values())
      .sort((a, b) => new Date(a.expectedArrivalTime).getTime() - new Date(b.expectedArrivalTime).getTime());
  }

  async getActiveDamageForecasts(): Promise<DamageForecast[]> {
    const now = new Date();
    return Array.from(this.damageForecasts.values())
      .filter(forecast => 
        forecast.status === 'active' && 
        new Date(forecast.validUntilTime) > now
      )
      .sort((a, b) => new Date(a.expectedArrivalTime).getTime() - new Date(b.expectedArrivalTime).getTime());
  }

  async getDamageForecast(id: string): Promise<DamageForecast | undefined> {
    return this.damageForecasts.get(id);
  }

  async getDamageForecastsByStormPrediction(stormPredictionId: string): Promise<DamageForecast[]> {
    return Array.from(this.damageForecasts.values())
      .filter(forecast => forecast.stormPredictionId === stormPredictionId)
      .sort((a, b) => new Date(a.expectedArrivalTime).getTime() - new Date(b.expectedArrivalTime).getTime());
  }

  async getDamageForecastsByState(state: string): Promise<DamageForecast[]> {
    return Array.from(this.damageForecasts.values())
      .filter(forecast => forecast.state === state)
      .sort((a, b) => parseFloat(String(b.overallDamageRisk)) - parseFloat(String(a.overallDamageRisk)));
  }

  async getDamageForecastsByCounty(state: string, county: string): Promise<DamageForecast[]> {
    return Array.from(this.damageForecasts.values())
      .filter(forecast => forecast.state === state && forecast.county === county)
      .sort((a, b) => new Date(a.expectedArrivalTime).getTime() - new Date(b.expectedArrivalTime).getTime());
  }

  async getDamageForecastsByRiskLevel(riskLevel: string): Promise<DamageForecast[]> {
    return Array.from(this.damageForecasts.values())
      .filter(forecast => forecast.riskLevel === riskLevel)
      .sort((a, b) => parseFloat(String(b.overallDamageRisk)) - parseFloat(String(a.overallDamageRisk)));
  }

  async createDamageForecast(insertForecast: InsertDamageForecast): Promise<DamageForecast> {
    const id = randomUUID();
    const forecast: DamageForecast = {
      ...insertForecast,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.damageForecasts.set(id, forecast);
    console.log(`📊 Created damage forecast for ${forecast.county}, ${forecast.state} (Risk: ${forecast.riskLevel})`);
    return forecast;
  }

  async updateDamageForecast(id: string, updates: Partial<DamageForecast>): Promise<DamageForecast> {
    const forecast = this.damageForecasts.get(id);
    if (!forecast) throw new Error("Damage forecast not found");
    
    const updatedForecast = { ...forecast, ...updates, updatedAt: new Date() };
    this.damageForecasts.set(id, updatedForecast);
    return updatedForecast;
  }

  async deleteDamageForecast(id: string): Promise<boolean> {
    return this.damageForecasts.delete(id);
  }

  // Contractor Opportunity Predictions methods
  async getContractorOpportunityPredictions(): Promise<ContractorOpportunityPrediction[]> {
    return Array.from(this.contractorOpportunityPredictions.values())
      .sort((a, b) => parseFloat(String(b.opportunityScore)) - parseFloat(String(a.opportunityScore)));
  }

  async getContractorOpportunityPrediction(id: string): Promise<ContractorOpportunityPrediction | undefined> {
    return this.contractorOpportunityPredictions.get(id);
  }

  async getContractorOpportunitiesByDamageForecast(damageForecastId: string): Promise<ContractorOpportunityPrediction[]> {
    return Array.from(this.contractorOpportunityPredictions.values())
      .filter(opportunity => opportunity.damageForecastId === damageForecastId)
      .sort((a, b) => parseFloat(String(b.opportunityScore)) - parseFloat(String(a.opportunityScore)));
  }

  async getContractorOpportunitiesByState(state: string): Promise<ContractorOpportunityPrediction[]> {
    return Array.from(this.contractorOpportunityPredictions.values())
      .filter(opportunity => opportunity.state === state)
      .sort((a, b) => parseFloat(String(b.opportunityScore)) - parseFloat(String(a.opportunityScore)));
  }

  async getContractorOpportunitiesByMarketPotential(marketPotential: string): Promise<ContractorOpportunityPrediction[]> {
    return Array.from(this.contractorOpportunityPredictions.values())
      .filter(opportunity => opportunity.marketPotential === marketPotential)
      .sort((a, b) => parseFloat(String(b.opportunityScore)) - parseFloat(String(a.opportunityScore)));
  }

  async getHighOpportunityPredictions(minOpportunityScore: number): Promise<ContractorOpportunityPrediction[]> {
    return Array.from(this.contractorOpportunityPredictions.values())
      .filter(opportunity => parseFloat(String(opportunity.opportunityScore)) >= minOpportunityScore)
      .sort((a, b) => parseFloat(String(b.opportunityScore)) - parseFloat(String(a.opportunityScore)));
  }

  async createContractorOpportunityPrediction(insertPrediction: InsertContractorOpportunityPrediction): Promise<ContractorOpportunityPrediction> {
    const id = randomUUID();
    const prediction: ContractorOpportunityPrediction = {
      ...insertPrediction,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.contractorOpportunityPredictions.set(id, prediction);
    console.log(`💰 Created contractor opportunity: ${prediction.county}, ${prediction.state} (Score: ${prediction.opportunityScore})`);
    return prediction;
  }

  async updateContractorOpportunityPrediction(id: string, updates: Partial<ContractorOpportunityPrediction>): Promise<ContractorOpportunityPrediction> {
    const prediction = this.contractorOpportunityPredictions.get(id);
    if (!prediction) throw new Error("Contractor opportunity prediction not found");
    
    const updatedPrediction = { ...prediction, ...updates, updatedAt: new Date() };
    this.contractorOpportunityPredictions.set(id, updatedPrediction);
    return updatedPrediction;
  }

  async deleteContractorOpportunityPrediction(id: string): Promise<boolean> {
    return this.contractorOpportunityPredictions.delete(id);
  }

  // Historical Damage Patterns methods
  async getHistoricalDamagePatterns(): Promise<HistoricalDamagePattern[]> {
    return Array.from(this.historicalDamagePatterns.values())
      .sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime());
  }

  async getHistoricalDamagePattern(id: string): Promise<HistoricalDamagePattern | undefined> {
    return this.historicalDamagePatterns.get(id);
  }

  async getHistoricalDamagePatternsByEventType(eventType: string): Promise<HistoricalDamagePattern[]> {
    return Array.from(this.historicalDamagePatterns.values())
      .filter(pattern => pattern.eventType === eventType)
      .sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime());
  }

  async getHistoricalDamagePatternsByState(state: string): Promise<HistoricalDamagePattern[]> {
    return Array.from(this.historicalDamagePatterns.values())
      .filter(pattern => pattern.state === state)
      .sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime());
  }

  async getHistoricalDamagePatternsByIntensity(minIntensity: number, maxIntensity: number): Promise<HistoricalDamagePattern[]> {
    return Array.from(this.historicalDamagePatterns.values())
      .filter(pattern => 
        pattern.impactIntensity >= minIntensity && 
        pattern.impactIntensity <= maxIntensity
      )
      .sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime());
  }

  async getSimilarHistoricalEvents(eventType: string, intensity: number, state: string): Promise<HistoricalDamagePattern[]> {
    const intensityTolerance = eventType === 'hurricane' ? 20 : 10; // mph tolerance
    
    return Array.from(this.historicalDamagePatterns.values())
      .filter(pattern => 
        pattern.eventType === eventType &&
        pattern.state === state &&
        Math.abs(pattern.impactIntensity - intensity) <= intensityTolerance
      )
      .sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime());
  }

  async createHistoricalDamagePattern(insertPattern: InsertHistoricalDamagePattern): Promise<HistoricalDamagePattern> {
    const id = randomUUID();
    const pattern: HistoricalDamagePattern = {
      ...insertPattern,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.historicalDamagePatterns.set(id, pattern);
    console.log(`📚 Created historical pattern: ${pattern.eventName} (${pattern.eventType})`);
    return pattern;
  }

  async updateHistoricalDamagePattern(id: string, updates: Partial<HistoricalDamagePattern>): Promise<HistoricalDamagePattern> {
    const pattern = this.historicalDamagePatterns.get(id);
    if (!pattern) throw new Error("Historical damage pattern not found");
    
    const updatedPattern = { ...pattern, ...updates, updatedAt: new Date() };
    this.historicalDamagePatterns.set(id, updatedPattern);
    return updatedPattern;
  }

  async deleteHistoricalDamagePattern(id: string): Promise<boolean> {
    return this.historicalDamagePatterns.delete(id);
  }

  // Radar Analysis Cache methods
  async getRadarAnalysisCache(): Promise<RadarAnalysisCache[]> {
    return Array.from(this.radarAnalysisCache.values())
      .sort((a, b) => new Date(b.scanTimestamp).getTime() - new Date(a.scanTimestamp).getTime());
  }

  async getRadarAnalysisCacheEntry(id: string): Promise<RadarAnalysisCache | undefined> {
    return this.radarAnalysisCache.get(id);
  }

  async getRadarAnalysisBySite(radarSiteId: string): Promise<RadarAnalysisCache[]> {
    return Array.from(this.radarAnalysisCache.values())
      .filter(analysis => analysis.radarSiteId === radarSiteId)
      .sort((a, b) => new Date(b.scanTimestamp).getTime() - new Date(a.scanTimestamp).getTime());
  }

  async getRadarAnalysisByTimeRange(startTime: Date, endTime: Date): Promise<RadarAnalysisCache[]> {
    return Array.from(this.radarAnalysisCache.values())
      .filter(analysis => {
        const scanTime = new Date(analysis.scanTimestamp);
        return scanTime >= startTime && scanTime <= endTime;
      })
      .sort((a, b) => new Date(a.scanTimestamp).getTime() - new Date(b.scanTimestamp).getTime());
  }

  async getLatestRadarAnalysis(radarSiteId: string): Promise<RadarAnalysisCache | undefined> {
    return Array.from(this.radarAnalysisCache.values())
      .filter(analysis => analysis.radarSiteId === radarSiteId)
      .sort((a, b) => new Date(b.scanTimestamp).getTime() - new Date(a.scanTimestamp).getTime())[0];
  }

  async createRadarAnalysisCache(insertAnalysis: InsertRadarAnalysisCache): Promise<RadarAnalysisCache> {
    const id = randomUUID();
    const analysis: RadarAnalysisCache = {
      ...insertAnalysis,
      id,
      createdAt: new Date()
    };
    this.radarAnalysisCache.set(id, analysis);
    return analysis;
  }

  async updateRadarAnalysisCache(id: string, updates: Partial<RadarAnalysisCache>): Promise<RadarAnalysisCache> {
    const analysis = this.radarAnalysisCache.get(id);
    if (!analysis) throw new Error("Radar analysis cache entry not found");
    
    const updatedAnalysis = { ...analysis, ...updates };
    this.radarAnalysisCache.set(id, updatedAnalysis);
    return updatedAnalysis;
  }

  async deleteRadarAnalysisCache(id: string): Promise<boolean> {
    return this.radarAnalysisCache.delete(id);
  }

  async cleanupExpiredRadarCache(): Promise<number> {
    const now = new Date();
    let deletedCount = 0;
    
    for (const [id, analysis] of this.radarAnalysisCache.entries()) {
      if (new Date(analysis.cacheExpiry) <= now) {
        this.radarAnalysisCache.delete(id);
        deletedCount++;
      }
    }
    
    if (deletedCount > 0) {
      console.log(`🧹 Cleaned up ${deletedCount} expired radar cache entries`);
    }
    
    return deletedCount;
  }

  // ===== AI DAMAGE DETECTION FOUNDATION METHODS =====

  // Detection Jobs methods
  async getDetectionJobs(): Promise<DetectionJob[]> {
    return Array.from(this.detectionJobs.values());
  }

  async getDetectionJob(id: string): Promise<DetectionJob | undefined> {
    return this.detectionJobs.get(id);
  }

  async getDetectionJobsByStatus(status: string): Promise<DetectionJob[]> {
    return Array.from(this.detectionJobs.values()).filter(job => job.status === status);
  }

  async getDetectionJobsBySourceType(sourceType: string): Promise<DetectionJob[]> {
    return Array.from(this.detectionJobs.values()).filter(job => job.sourceType === sourceType);
  }

  async createDetectionJob(insertJob: InsertDetectionJob): Promise<DetectionJob> {
    const id = randomUUID();
    const job: DetectionJob = {
      ...insertJob,
      id,
      createdAt: new Date()
    };
    this.detectionJobs.set(id, job);
    return job;
  }

  async updateDetectionJob(id: string, updates: Partial<DetectionJob>): Promise<DetectionJob> {
    const job = this.detectionJobs.get(id);
    if (!job) throw new Error("Detection job not found");
    
    const updatedJob = { ...job, ...updates };
    this.detectionJobs.set(id, updatedJob);
    return updatedJob;
  }

  async deleteDetectionJob(id: string): Promise<boolean> {
    return this.detectionJobs.delete(id);
  }

  // Detection Results methods
  async getDetectionResults(): Promise<DetectionResult[]> {
    return Array.from(this.detectionResults.values());
  }

  async getDetectionResult(id: string): Promise<DetectionResult | undefined> {
    return this.detectionResults.get(id);
  }

  async getDetectionResultsByJobId(jobId: string): Promise<DetectionResult[]> {
    return Array.from(this.detectionResults.values()).filter(result => result.jobId === jobId);
  }

  async getDetectionResultsByLabel(label: string): Promise<DetectionResult[]> {
    return Array.from(this.detectionResults.values()).filter(result => result.label === label);
  }

  async getDetectionResultsByConfidence(minConfidence: number): Promise<DetectionResult[]> {
    return Array.from(this.detectionResults.values()).filter(result => 
      parseFloat(result.confidence.toString()) >= minConfidence
    );
  }

  async createDetectionResult(insertResult: InsertDetectionResult): Promise<DetectionResult> {
    const id = randomUUID();
    const result: DetectionResult = {
      ...insertResult,
      id,
      createdAt: new Date()
    };
    this.detectionResults.set(id, result);
    return result;
  }

  async updateDetectionResult(id: string, updates: Partial<DetectionResult>): Promise<DetectionResult> {
    const result = this.detectionResults.get(id);
    if (!result) throw new Error("Detection result not found");
    
    const updatedResult = { ...result, ...updates };
    this.detectionResults.set(id, updatedResult);
    return updatedResult;
  }

  async deleteDetectionResult(id: string): Promise<boolean> {
    return this.detectionResults.delete(id);
  }

  // ===== LEAD CAPTURE SYSTEM METHODS =====

  // Funnel methods
  async getFunnels(): Promise<Funnel[]> {
    return Array.from(this.funnels.values());
  }

  async getFunnel(id: string): Promise<Funnel | undefined> {
    return this.funnels.get(id);
  }

  async getFunnelBySlug(slug: string): Promise<Funnel | undefined> {
    return Array.from(this.funnels.values()).find(funnel => funnel.slug === slug);
  }

  async createFunnel(insertFunnel: InsertFunnel): Promise<Funnel> {
    const id = randomUUID();
    const funnel: Funnel = {
      ...insertFunnel,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.funnels.set(id, funnel);
    return funnel;
  }

  async updateFunnel(id: string, updates: Partial<Funnel>): Promise<Funnel> {
    const funnel = this.funnels.get(id);
    if (!funnel) throw new Error("Funnel not found");
    
    const updatedFunnel = { ...funnel, ...updates, updatedAt: new Date() };
    this.funnels.set(id, updatedFunnel);
    return updatedFunnel;
  }

  async deleteFunnel(id: string): Promise<boolean> {
    // Also delete associated funnel steps
    const steps = Array.from(this.funnelSteps.values()).filter(step => step.funnelId === id);
    steps.forEach(step => this.funnelSteps.delete(step.id));
    return this.funnels.delete(id);
  }

  // Funnel Step methods
  async getFunnelSteps(funnelId: string): Promise<FunnelStep[]> {
    return Array.from(this.funnelSteps.values())
      .filter(step => step.funnelId === funnelId)
      .sort((a, b) => a.stepOrder - b.stepOrder);
  }

  async getFunnelStep(id: string): Promise<FunnelStep | undefined> {
    return this.funnelSteps.get(id);
  }

  async createFunnelStep(insertStep: InsertFunnelStep): Promise<FunnelStep> {
    const id = randomUUID();
    const step: FunnelStep = {
      ...insertStep,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.funnelSteps.set(id, step);
    return step;
  }

  async updateFunnelStep(id: string, updates: Partial<FunnelStep>): Promise<FunnelStep> {
    const step = this.funnelSteps.get(id);
    if (!step) throw new Error("Funnel step not found");
    
    const updatedStep = { ...step, ...updates, updatedAt: new Date() };
    this.funnelSteps.set(id, updatedStep);
    return updatedStep;
  }

  async deleteFunnelStep(id: string): Promise<boolean> {
    return this.funnelSteps.delete(id);
  }

  async reorderFunnelSteps(funnelId: string, stepIds: string[]): Promise<boolean> {
    try {
      stepIds.forEach((stepId, index) => {
        const step = this.funnelSteps.get(stepId);
        if (step && step.funnelId === funnelId) {
          this.funnelSteps.set(stepId, { ...step, stepOrder: index + 1, updatedAt: new Date() });
        }
      });
      return true;
    } catch {
      return false;
    }
  }

  // Form methods
  async getForms(): Promise<Form[]> {
    return Array.from(this.forms.values());
  }

  async getForm(id: string): Promise<Form | undefined> {
    return this.forms.get(id);
  }

  async getFormsByFunnelStep(funnelStepId: string): Promise<Form[]> {
    return Array.from(this.forms.values()).filter(form => form.funnelStepId === funnelStepId);
  }

  async createForm(insertForm: InsertForm): Promise<Form> {
    const id = randomUUID();
    const form: Form = {
      ...insertForm,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.forms.set(id, form);
    return form;
  }

  async updateForm(id: string, updates: Partial<Form>): Promise<Form> {
    const form = this.forms.get(id);
    if (!form) throw new Error("Form not found");
    
    const updatedForm = { ...form, ...updates, updatedAt: new Date() };
    this.forms.set(id, updatedForm);
    return updatedForm;
  }

  async deleteForm(id: string): Promise<boolean> {
    // Also delete associated form fields
    const fields = Array.from(this.formFields.values()).filter(field => field.formId === id);
    fields.forEach(field => this.formFields.delete(field.id));
    return this.forms.delete(id);
  }

  // Form Field methods
  async getFormFields(formId: string): Promise<FormField[]> {
    return Array.from(this.formFields.values())
      .filter(field => field.formId === formId)
      .sort((a, b) => a.fieldOrder - b.fieldOrder);
  }

  async getFormField(id: string): Promise<FormField | undefined> {
    return this.formFields.get(id);
  }

  async createFormField(insertField: InsertFormField): Promise<FormField> {
    const id = randomUUID();
    const field: FormField = {
      ...insertField,
      id,
      createdAt: new Date()
    };
    this.formFields.set(id, field);
    return field;
  }

  async updateFormField(id: string, updates: Partial<FormField>): Promise<FormField> {
    const field = this.formFields.get(id);
    if (!field) throw new Error("Form field not found");
    
    const updatedField = { ...field, ...updates };
    this.formFields.set(id, updatedField);
    return updatedField;
  }

  async deleteFormField(id: string): Promise<boolean> {
    return this.formFields.delete(id);
  }

  async reorderFormFields(formId: string, fieldIds: string[]): Promise<boolean> {
    try {
      fieldIds.forEach((fieldId, index) => {
        const field = this.formFields.get(fieldId);
        if (field && field.formId === formId) {
          this.formFields.set(fieldId, { ...field, fieldOrder: index + 1 });
        }
      });
      return true;
    } catch {
      return false;
    }
  }

  // Calendar Booking methods
  async getCalendarBookings(): Promise<CalendarBooking[]> {
    return Array.from(this.calendarBookings.values());
  }

  async getCalendarBooking(id: string): Promise<CalendarBooking | undefined> {
    return this.calendarBookings.get(id);
  }

  async getCalendarBookingsByHomeowner(homeownerId: string): Promise<CalendarBooking[]> {
    return Array.from(this.calendarBookings.values()).filter(booking => booking.homeownerId === homeownerId);
  }

  async getCalendarBookingsByDate(date: Date): Promise<CalendarBooking[]> {
    const targetDate = date.toISOString().split('T')[0];
    return Array.from(this.calendarBookings.values()).filter(booking => 
      booking.appointmentDate.toISOString().split('T')[0] === targetDate
    );
  }

  async getCalendarBookingsByType(appointmentType: string): Promise<CalendarBooking[]> {
    return Array.from(this.calendarBookings.values()).filter(booking => booking.appointmentType === appointmentType);
  }

  async getCalendarBookingsByStatus(status: string): Promise<CalendarBooking[]> {
    return Array.from(this.calendarBookings.values()).filter(booking => booking.status === status);
  }

  async createCalendarBooking(insertBooking: InsertCalendarBooking): Promise<CalendarBooking> {
    const id = randomUUID();
    const booking: CalendarBooking = {
      ...insertBooking,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.calendarBookings.set(id, booking);
    return booking;
  }

  async updateCalendarBooking(id: string, updates: Partial<CalendarBooking>): Promise<CalendarBooking> {
    const booking = this.calendarBookings.get(id);
    if (!booking) throw new Error("Calendar booking not found");
    
    const updatedBooking = { ...booking, ...updates, updatedAt: new Date() };
    this.calendarBookings.set(id, updatedBooking);
    return updatedBooking;
  }

  async deleteCalendarBooking(id: string): Promise<boolean> {
    return this.calendarBookings.delete(id);
  }

  async getAvailableTimeSlots(date: Date, duration: number): Promise<string[]> {
    // Simple implementation - return available slots for a day
    const allSlots = [
      '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
      '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
      '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'
    ];
    
    const bookedSlots = await this.getCalendarBookingsByDate(date);
    const bookedTimes = bookedSlots.map(booking => 
      booking.appointmentDate.toTimeString().substring(0, 5)
    );
    
    return allSlots.filter(slot => !bookedTimes.includes(slot));
  }

  // Workflow methods
  async getWorkflows(): Promise<Workflow[]> {
    return Array.from(this.workflows.values());
  }

  async getWorkflow(id: string): Promise<Workflow | undefined> {
    return this.workflows.get(id);
  }

  async getActiveWorkflows(): Promise<Workflow[]> {
    return Array.from(this.workflows.values()).filter(workflow => workflow.isActive);
  }

  async getWorkflowsByTriggerType(triggerType: string): Promise<Workflow[]> {
    return Array.from(this.workflows.values()).filter(workflow => workflow.triggerType === triggerType);
  }

  async createWorkflow(insertWorkflow: InsertWorkflow): Promise<Workflow> {
    const id = randomUUID();
    const workflow: Workflow = {
      ...insertWorkflow,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.workflows.set(id, workflow);
    return workflow;
  }

  async updateWorkflow(id: string, updates: Partial<Workflow>): Promise<Workflow> {
    const workflow = this.workflows.get(id);
    if (!workflow) throw new Error("Workflow not found");
    
    const updatedWorkflow = { ...workflow, ...updates, updatedAt: new Date() };
    this.workflows.set(id, updatedWorkflow);
    return updatedWorkflow;
  }

  async deleteWorkflow(id: string): Promise<boolean> {
    // Also delete associated workflow steps
    const steps = Array.from(this.workflowSteps.values()).filter(step => step.workflowId === id);
    steps.forEach(step => this.workflowSteps.delete(step.id));
    return this.workflows.delete(id);
  }

  // Workflow Step methods
  async getWorkflowSteps(workflowId: string): Promise<WorkflowStep[]> {
    return Array.from(this.workflowSteps.values())
      .filter(step => step.workflowId === workflowId)
      .sort((a, b) => a.stepOrder - b.stepOrder);
  }

  async getWorkflowStep(id: string): Promise<WorkflowStep | undefined> {
    return this.workflowSteps.get(id);
  }

  async createWorkflowStep(insertStep: InsertWorkflowStep): Promise<WorkflowStep> {
    const id = randomUUID();
    const step: WorkflowStep = {
      ...insertStep,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.workflowSteps.set(id, step);
    return step;
  }

  async updateWorkflowStep(id: string, updates: Partial<WorkflowStep>): Promise<WorkflowStep> {
    const step = this.workflowSteps.get(id);
    if (!step) throw new Error("Workflow step not found");
    
    const updatedStep = { ...step, ...updates, updatedAt: new Date() };
    this.workflowSteps.set(id, updatedStep);
    return updatedStep;
  }

  async deleteWorkflowStep(id: string): Promise<boolean> {
    return this.workflowSteps.delete(id);
  }

  async reorderWorkflowSteps(workflowId: string, stepIds: string[]): Promise<boolean> {
    try {
      stepIds.forEach((stepId, index) => {
        const step = this.workflowSteps.get(stepId);
        if (step && step.workflowId === workflowId) {
          this.workflowSteps.set(stepId, { ...step, stepOrder: index + 1, updatedAt: new Date() });
        }
      });
      return true;
    } catch {
      return false;
    }
  }

  // ===== STORMSHARE COMMUNITY METHODS =====

  // StormShare Groups
  async getStormShareGroups(): Promise<StormShareGroup[]> {
    return Array.from(this.stormShareGroups.values());
  }

  async getStormShareGroup(id: string): Promise<StormShareGroup | undefined> {
    return this.stormShareGroups.get(id);
  }

  async getStormShareGroupBySlug(slug: string): Promise<StormShareGroup | undefined> {
    return Array.from(this.stormShareGroups.values()).find(group => group.slug === slug);
  }

  async getStormShareGroupsByType(type: string): Promise<StormShareGroup[]> {
    return Array.from(this.stormShareGroups.values()).filter(group => group.type === type);
  }

  async getStormShareGroupsByOwner(ownerId: string): Promise<StormShareGroup[]> {
    return Array.from(this.stormShareGroups.values()).filter(group => group.ownerId === ownerId);
  }

  async createStormShareGroup(insertGroup: InsertStormShareGroup): Promise<StormShareGroup> {
    const id = randomUUID();
    const group: StormShareGroup = {
      ...insertGroup,
      id,
      memberCount: 0,
      postCount: 0,
      moderatorIds: insertGroup.moderatorIds || [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.stormShareGroups.set(id, group);
    return group;
  }

  async updateStormShareGroup(id: string, updates: Partial<StormShareGroup>): Promise<StormShareGroup> {
    const group = this.stormShareGroups.get(id);
    if (!group) throw new Error("StormShare group not found");
    
    const updatedGroup = { ...group, ...updates, updatedAt: new Date() };
    this.stormShareGroups.set(id, updatedGroup);
    return updatedGroup;
  }

  async deleteStormShareGroup(id: string): Promise<boolean> {
    // Also delete all group members when deleting group
    const members = Array.from(this.stormShareGroupMembers.values()).filter(m => m.groupId === id);
    members.forEach(member => this.stormShareGroupMembers.delete(member.id));
    
    return this.stormShareGroups.delete(id);
  }

  // StormShare Group Members
  async getStormShareGroupMembers(groupId: string): Promise<StormShareGroupMember[]> {
    return Array.from(this.stormShareGroupMembers.values()).filter(member => member.groupId === groupId);
  }

  async getStormShareGroupMember(groupId: string, userId: string): Promise<StormShareGroupMember | undefined> {
    return Array.from(this.stormShareGroupMembers.values()).find(member => 
      member.groupId === groupId && member.userId === userId
    );
  }

  async getStormShareGroupMembershipsByUser(userId: string): Promise<StormShareGroupMember[]> {
    return Array.from(this.stormShareGroupMembers.values()).filter(member => member.userId === userId);
  }

  async createStormShareGroupMember(insertMember: InsertStormShareGroupMember): Promise<StormShareGroupMember> {
    const id = randomUUID();
    const member: StormShareGroupMember = {
      ...insertMember,
      id,
      status: insertMember.status || 'active',
      role: insertMember.role || 'member',
      joinedAt: new Date(),
      lastActive: new Date()
    };
    this.stormShareGroupMembers.set(id, member);

    // Update group member count
    const group = this.stormShareGroups.get(insertMember.groupId);
    if (group) {
      group.memberCount = (group.memberCount || 0) + 1;
      group.updatedAt = new Date();
      this.stormShareGroups.set(insertMember.groupId, group);
    }

    return member;
  }

  async updateStormShareGroupMember(id: string, updates: Partial<StormShareGroupMember>): Promise<StormShareGroupMember> {
    const member = this.stormShareGroupMembers.get(id);
    if (!member) throw new Error("StormShare group member not found");
    
    const updatedMember = { ...member, ...updates, lastActive: new Date() };
    this.stormShareGroupMembers.set(id, updatedMember);
    return updatedMember;
  }

  async deleteStormShareGroupMember(id: string): Promise<boolean> {
    const member = this.stormShareGroupMembers.get(id);
    if (member) {
      // Update group member count
      const group = this.stormShareGroups.get(member.groupId);
      if (group && group.memberCount > 0) {
        group.memberCount = group.memberCount - 1;
        group.updatedAt = new Date();
        this.stormShareGroups.set(member.groupId, group);
      }
    }
    return this.stormShareGroupMembers.delete(id);
  }

  // StormShare Messages
  async getStormShareMessages(groupId?: string, postId?: string): Promise<StormShareMessage[]> {
    let messages = Array.from(this.stormShareMessages.values());
    if (groupId) {
      messages = messages.filter(msg => msg.groupId === groupId);
    }
    if (postId) {
      messages = messages.filter(msg => msg.postId === postId);
    }
    return messages.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async getStormShareMessage(id: string): Promise<StormShareMessage | undefined> {
    return this.stormShareMessages.get(id);
  }

  async getStormShareMessagesByUser(userId: string): Promise<StormShareMessage[]> {
    return Array.from(this.stormShareMessages.values())
      .filter(msg => msg.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createStormShareMessage(insertMessage: InsertStormShareMessage): Promise<StormShareMessage> {
    const id = randomUUID();
    const message: StormShareMessage = {
      ...insertMessage,
      id,
      messageType: insertMessage.messageType || 'text',
      isEdited: false,
      isDeleted: false,
      threadCount: 0,
      createdAt: new Date()
    };
    this.stormShareMessages.set(id, message);
    return message;
  }

  async updateStormShareMessage(id: string, updates: Partial<StormShareMessage>): Promise<StormShareMessage> {
    const message = this.stormShareMessages.get(id);
    if (!message) throw new Error("StormShare message not found");
    
    const updatedMessage = { 
      ...message, 
      ...updates, 
      isEdited: true, 
      editedAt: new Date() 
    };
    this.stormShareMessages.set(id, updatedMessage);
    return updatedMessage;
  }

  async deleteStormShareMessage(id: string): Promise<boolean> {
    const message = this.stormShareMessages.get(id);
    if (message) {
      // Soft delete
      const deletedMessage = { ...message, isDeleted: true };
      this.stormShareMessages.set(id, deletedMessage);
      return true;
    }
    return false;
  }

  // Help Requests
  async getHelpRequests(): Promise<HelpRequest[]> {
    return Array.from(this.helpRequests.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getHelpRequest(id: string): Promise<HelpRequest | undefined> {
    return this.helpRequests.get(id);
  }

  async getHelpRequestsByUser(userId: string): Promise<HelpRequest[]> {
    return Array.from(this.helpRequests.values())
      .filter(req => req.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getHelpRequestsByStatus(status: string): Promise<HelpRequest[]> {
    return Array.from(this.helpRequests.values())
      .filter(req => req.status === status)
      .sort((a, b) => {
        if (req.urgencyLevel === 'emergency') return -1;
        if (req.urgencyLevel === 'urgent') return -1;
        return b.createdAt.getTime() - a.createdAt.getTime();
      });
  }

  async getHelpRequestsByLocation(state?: string, city?: string): Promise<HelpRequest[]> {
    let requests = Array.from(this.helpRequests.values());
    
    if (state) {
      requests = requests.filter(req => req.state === state);
    }
    if (city) {
      requests = requests.filter(req => req.city === city);
    }
    
    return requests.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getHelpRequestsByCategory(category: string): Promise<HelpRequest[]> {
    return Array.from(this.helpRequests.values())
      .filter(req => req.category === category)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createHelpRequest(insertRequest: InsertHelpRequest): Promise<HelpRequest> {
    const id = randomUUID();
    const request: HelpRequest = {
      ...insertRequest,
      id,
      status: 'open',
      urgencyLevel: insertRequest.urgencyLevel || 'normal',
      hasInsurance: insertRequest.hasInsurance || false,
      canPayImmediately: insertRequest.canPayImmediately || false,
      photoUrls: insertRequest.photoUrls || [],
      videoUrls: insertRequest.videoUrls || [],
      contactMethods: insertRequest.contactMethods || ['phone', 'email'],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.helpRequests.set(id, request);
    return request;
  }

  async updateHelpRequest(id: string, updates: Partial<HelpRequest>): Promise<HelpRequest> {
    const request = this.helpRequests.get(id);
    if (!request) throw new Error("Help request not found");
    
    const updatedRequest = { ...request, ...updates, updatedAt: new Date() };
    this.helpRequests.set(id, updatedRequest);
    return updatedRequest;
  }

  async deleteHelpRequest(id: string): Promise<boolean> {
    return this.helpRequests.delete(id);
  }

  async convertHelpRequestToLead(helpRequestId: string, contractorId: string): Promise<{ helpRequest: HelpRequest, lead: Lead }> {
    const helpRequest = this.helpRequests.get(helpRequestId);
    if (!helpRequest) throw new Error("Help request not found");

    // Create lead from help request
    const leadId = randomUUID();
    const lead: Lead = {
      id: leadId,
      contractorId,
      source: 'stormshare_help_request',
      name: 'Help Request Lead',
      phone: helpRequest.contactPhone || '',
      email: helpRequest.contactEmail || '',
      address: helpRequest.address || '',
      city: helpRequest.city || '',
      state: helpRequest.state || '',
      zipCode: helpRequest.zipCode || '',
      latitude: helpRequest.latitude ? Number(helpRequest.latitude) : undefined,
      longitude: helpRequest.longitude ? Number(helpRequest.longitude) : undefined,
      damageType: helpRequest.category,
      damageDescription: helpRequest.description,
      urgency: helpRequest.urgencyLevel,
      status: 'new',
      priority: helpRequest.urgencyLevel === 'emergency' ? 'high' : 
                helpRequest.urgencyLevel === 'urgent' ? 'high' : 'normal',
      insuranceCompany: helpRequest.insuranceCompany || '',
      insuranceClaimNumber: helpRequest.policyNumber || '',
      estimatedCost: 0,
      notes: `Converted from StormShare help request: ${helpRequest.title}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.leads.set(leadId, lead);

    // Update help request with conversion info
    const updatedHelpRequest = {
      ...helpRequest,
      status: 'claimed',
      claimedByUserId: contractorId,
      claimedAt: new Date(),
      leadId,
      convertedAt: new Date(),
      updatedAt: new Date()
    };
    this.helpRequests.set(helpRequestId, updatedHelpRequest);

    return { helpRequest: updatedHelpRequest, lead };
  }

  // StormShare Media Assets
  async getStormShareMediaAssets(): Promise<StormShareMediaAsset[]> {
    return Array.from(this.stormShareMediaAssets.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getStormShareMediaAsset(id: string): Promise<StormShareMediaAsset | undefined> {
    return this.stormShareMediaAssets.get(id);
  }

  async getStormShareMediaAssetsByOwner(ownerId: string): Promise<StormShareMediaAsset[]> {
    return Array.from(this.stormShareMediaAssets.values())
      .filter(asset => asset.ownerId === ownerId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getStormShareMediaAssetsByType(assetType: string): Promise<StormShareMediaAsset[]> {
    return Array.from(this.stormShareMediaAssets.values())
      .filter(asset => asset.assetType === assetType)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createStormShareMediaAsset(insertAsset: InsertStormShareMediaAsset): Promise<StormShareMediaAsset> {
    const id = randomUUID();
    const asset: StormShareMediaAsset = {
      ...insertAsset,
      id,
      tags: insertAsset.tags || [],
      isPublic: insertAsset.isPublic !== false, // Default to true
      usageCount: 0,
      moderationStatus: 'pending',
      createdAt: new Date()
    };
    this.stormShareMediaAssets.set(id, asset);
    return asset;
  }

  async updateStormShareMediaAsset(id: string, updates: Partial<StormShareMediaAsset>): Promise<StormShareMediaAsset> {
    const asset = this.stormShareMediaAssets.get(id);
    if (!asset) throw new Error("StormShare media asset not found");
    
    const updatedAsset = { ...asset, ...updates };
    
    // Track usage if the asset is being used
    if (updates.usageCount !== undefined) {
      updatedAsset.lastUsed = new Date();
    }
    
    this.stormShareMediaAssets.set(id, updatedAsset);
    return updatedAsset;
  }

  async deleteStormShareMediaAsset(id: string): Promise<boolean> {
    return this.stormShareMediaAssets.delete(id);
  }

  // StormShare Ad Campaigns
  async getStormShareAdCampaigns(): Promise<StormShareAdCampaign[]> {
    return Array.from(this.stormShareAdCampaigns.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getStormShareAdCampaign(id: string): Promise<StormShareAdCampaign | undefined> {
    return this.stormShareAdCampaigns.get(id);
  }

  async getActiveStormShareAdCampaigns(): Promise<StormShareAdCampaign[]> {
    const now = new Date();
    return Array.from(this.stormShareAdCampaigns.values())
      .filter(campaign => 
        campaign.status === 'active' &&
        (!campaign.startDate || campaign.startDate <= now) &&
        (!campaign.endDate || campaign.endDate >= now)
      )
      .sort((a, b) => (b.budgetCents || 0) - (a.budgetCents || 0));
  }

  async getStormShareAdCampaignsByAdvertiser(advertiserName: string): Promise<StormShareAdCampaign[]> {
    return Array.from(this.stormShareAdCampaigns.values())
      .filter(campaign => campaign.advertiserName === advertiserName)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getStormShareAdCampaignsByTarget(targetAudience: string): Promise<StormShareAdCampaign[]> {
    return Array.from(this.stormShareAdCampaigns.values())
      .filter(campaign => campaign.targetAudience === targetAudience || campaign.targetAudience === 'all')
      .filter(campaign => campaign.status === 'active')
      .sort((a, b) => (b.budgetCents || 0) - (a.budgetCents || 0));
  }

  async createStormShareAdCampaign(insertCampaign: InsertStormShareAdCampaign): Promise<StormShareAdCampaign> {
    const id = randomUUID();
    const campaign: StormShareAdCampaign = {
      ...insertCampaign,
      id,
      targetAudience: insertCampaign.targetAudience || 'all',
      callToAction: insertCampaign.callToAction || 'Learn More',
      targetLocations: insertCampaign.targetLocations || [],
      targetCategories: insertCampaign.targetCategories || [],
      impressions: 0,
      clicks: 0,
      conversions: 0,
      spentCents: 0,
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.stormShareAdCampaigns.set(id, campaign);
    return campaign;
  }

  async updateStormShareAdCampaign(id: string, updates: Partial<StormShareAdCampaign>): Promise<StormShareAdCampaign> {
    const campaign = this.stormShareAdCampaigns.get(id);
    if (!campaign) throw new Error("StormShare ad campaign not found");
    
    const updatedCampaign = { ...campaign, ...updates, updatedAt: new Date() };
    this.stormShareAdCampaigns.set(id, updatedCampaign);
    return updatedCampaign;
  }

  async deleteStormShareAdCampaign(id: string): Promise<boolean> {
    return this.stormShareAdCampaigns.delete(id);
  }

  async incrementAdImpressions(campaignId: string): Promise<void> {
    const campaign = this.stormShareAdCampaigns.get(campaignId);
    if (campaign) {
      campaign.impressions = (campaign.impressions || 0) + 1;
      campaign.updatedAt = new Date();
      this.stormShareAdCampaigns.set(campaignId, campaign);
    }
  }

  async incrementAdClicks(campaignId: string): Promise<void> {
    const campaign = this.stormShareAdCampaigns.get(campaignId);
    if (campaign) {
      campaign.clicks = (campaign.clicks || 0) + 1;
      campaign.updatedAt = new Date();
      this.stormShareAdCampaigns.set(campaignId, campaign);
    }
  }

  // ===== DISASTER LENS IMPLEMENTATIONS =====

  // Organization methods
  async getOrganizations(): Promise<Organization[]> {
    return Array.from(this.organizations.values());
  }

  async getOrganization(id: string): Promise<Organization | undefined> {
    return this.organizations.get(id);
  }

  async createOrganization(insertOrg: InsertOrganization): Promise<Organization> {
    const id = randomUUID();
    const organization: Organization = {
      ...insertOrg,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.organizations.set(id, organization);
    return organization;
  }

  async updateOrganization(id: string, updates: Partial<Organization>): Promise<Organization> {
    const organization = this.organizations.get(id);
    if (!organization) throw new Error("Organization not found");
    
    const updatedOrg = { ...organization, ...updates, updatedAt: new Date() };
    this.organizations.set(id, updatedOrg);
    return updatedOrg;
  }

  // Organization Member methods
  async getOrganizationMembers(orgId: string): Promise<OrganizationMember[]> {
    return Array.from(this.organizationMembers.values()).filter(member => member.organizationId === orgId);
  }

  async getOrganizationMembership(userId: string, orgId: string): Promise<OrganizationMember | undefined> {
    return Array.from(this.organizationMembers.values()).find(
      member => member.userId === userId && member.organizationId === orgId
    );
  }

  async getUserOrganizations(userId: string): Promise<OrganizationMember[]> {
    return Array.from(this.organizationMembers.values()).filter(member => member.userId === userId);
  }

  async createOrganizationMember(insertMember: InsertOrganizationMember): Promise<OrganizationMember> {
    const id = randomUUID();
    const member: OrganizationMember = {
      ...insertMember,
      id,
      createdAt: new Date(),
      joinedAt: new Date()
    };
    this.organizationMembers.set(id, member);
    return member;
  }

  async updateOrganizationMember(orgId: string, userId: string, updates: Partial<OrganizationMember>): Promise<OrganizationMember> {
    const member = await this.getOrganizationMembership(userId, orgId);
    if (!member) throw new Error("Organization member not found");
    
    const updatedMember = { ...member, ...updates };
    this.organizationMembers.set(member.id, updatedMember);
    return updatedMember;
  }

  async deleteOrganizationMember(orgId: string, userId: string): Promise<boolean> {
    const member = await this.getOrganizationMembership(userId, orgId);
    if (!member) return false;
    
    return this.organizationMembers.delete(member.id);
  }

  // Project methods
  async getProjects(query?: { orgId?: string; status?: string; search?: string }): Promise<Project[]> {
    let projects = Array.from(this.projects.values());
    
    if (query?.orgId) {
      projects = projects.filter(project => project.organizationId === query.orgId);
    }
    
    if (query?.status) {
      projects = projects.filter(project => project.status === query.status);
    }
    
    if (query?.search) {
      const searchTerm = query.search.toLowerCase();
      projects = projects.filter(project =>
        project.name.toLowerCase().includes(searchTerm) ||
        (project.description && project.description.toLowerCase().includes(searchTerm)) ||
        (project.clientName && project.clientName.toLowerCase().includes(searchTerm)) ||
        (project.propertyAddress && project.propertyAddress.toLowerCase().includes(searchTerm))
      );
    }
    
    return projects;
  }

  async getProject(id: string): Promise<Project | undefined> {
    return this.projects.get(id);
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const id = randomUUID();
    const project: Project = {
      ...insertProject,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.projects.set(id, project);
    return project;
  }

  async updateProject(id: string, updates: Partial<Project>): Promise<Project> {
    const project = this.projects.get(id);
    if (!project) throw new Error("Project not found");
    
    const updatedProject = { ...project, ...updates, updatedAt: new Date() };
    this.projects.set(id, updatedProject);
    return updatedProject;
  }

  async deleteProject(id: string): Promise<boolean> {
    return this.projects.delete(id);
  }

  // Media methods
  async getMediaByProject(projectId: string): Promise<Media[]> {
    return Array.from(this.media.values()).filter(media => media.projectId === projectId);
  }

  async getMedia(id: string): Promise<Media | undefined> {
    return this.media.get(id);
  }

  async createMedia(insertMedia: InsertMedia): Promise<Media> {
    const id = randomUUID();
    const media: Media = {
      ...insertMedia,
      id,
      createdAt: new Date()
    };
    this.media.set(id, media);
    return media;
  }

  async updateMedia(id: string, updates: Partial<Media>): Promise<Media> {
    const media = this.media.get(id);
    if (!media) throw new Error("Media not found");
    
    const updatedMedia = { ...media, ...updates };
    this.media.set(id, updatedMedia);
    return updatedMedia;
  }

  async deleteMedia(id: string): Promise<boolean> {
    return this.media.delete(id);
  }

  // Annotation methods
  async getAnnotationsByMedia(mediaId: string): Promise<Annotation[]> {
    return Array.from(this.annotations.values()).filter(annotation => annotation.mediaId === mediaId);
  }

  async getAnnotation(id: string): Promise<Annotation | undefined> {
    return this.annotations.get(id);
  }

  async createAnnotation(insertAnnotation: InsertAnnotation): Promise<Annotation> {
    const id = randomUUID();
    const annotation: Annotation = {
      ...insertAnnotation,
      id,
      createdAt: new Date()
    };
    this.annotations.set(id, annotation);
    return annotation;
  }

  async updateAnnotation(id: string, updates: Partial<Annotation>): Promise<Annotation> {
    const annotation = this.annotations.get(id);
    if (!annotation) throw new Error("Annotation not found");
    
    const updatedAnnotation = { ...annotation, ...updates };
    this.annotations.set(id, updatedAnnotation);
    return updatedAnnotation;
  }

  async deleteAnnotation(id: string): Promise<boolean> {
    return this.annotations.delete(id);
  }

  // Comment methods
  async getCommentsByProject(projectId: string): Promise<Comment[]> {
    return Array.from(this.comments.values()).filter(comment => comment.projectId === projectId);
  }

  async getCommentsByMedia(mediaId: string): Promise<Comment[]> {
    return Array.from(this.comments.values()).filter(comment => comment.mediaId === mediaId);
  }

  async getComment(id: string): Promise<Comment | undefined> {
    return this.comments.get(id);
  }

  async createComment(insertComment: InsertComment): Promise<Comment> {
    const id = randomUUID();
    const comment: Comment = {
      ...insertComment,
      id,
      createdAt: new Date()
    };
    this.comments.set(id, comment);
    return comment;
  }

  async updateComment(id: string, updates: Partial<Comment>): Promise<Comment> {
    const comment = this.comments.get(id);
    if (!comment) throw new Error("Comment not found");
    
    const updatedComment = { ...comment, ...updates };
    this.comments.set(id, updatedComment);
    return updatedComment;
  }

  async deleteComment(id: string): Promise<boolean> {
    return this.comments.delete(id);
  }

  // Disaster Task methods
  async getDisasterTasksByProject(projectId: string): Promise<DisasterTask[]> {
    return Array.from(this.disasterTasks.values()).filter(task => task.projectId === projectId);
  }

  async getDisasterTask(id: string): Promise<DisasterTask | undefined> {
    return this.disasterTasks.get(id);
  }

  async createDisasterTask(insertTask: InsertDisasterTask): Promise<DisasterTask> {
    const id = randomUUID();
    const task: DisasterTask = {
      ...insertTask,
      id,
      createdAt: new Date()
    };
    this.disasterTasks.set(id, task);
    return task;
  }

  async updateDisasterTask(id: string, updates: Partial<DisasterTask>): Promise<DisasterTask> {
    const task = this.disasterTasks.get(id);
    if (!task) throw new Error("Disaster task not found");
    
    const updatedTask = { ...task, ...updates };
    if (updates.status === 'done' && !task.completedAt) {
      updatedTask.completedAt = new Date();
    }
    this.disasterTasks.set(id, updatedTask);
    return updatedTask;
  }

  async deleteDisasterTask(id: string): Promise<boolean> {
    return this.disasterTasks.delete(id);
  }

  // Disaster Report methods
  async getDisasterReportsByProject(projectId: string): Promise<DisasterReport[]> {
    return Array.from(this.disasterReports.values()).filter(report => report.projectId === projectId);
  }

  async getDisasterReport(id: string): Promise<DisasterReport | undefined> {
    return this.disasterReports.get(id);
  }

  async createDisasterReport(insertReport: InsertDisasterReport): Promise<DisasterReport> {
    const id = randomUUID();
    const report: DisasterReport = {
      ...insertReport,
      id,
      createdAt: new Date()
    };
    this.disasterReports.set(id, report);
    return report;
  }

  async updateDisasterReport(id: string, updates: Partial<DisasterReport>): Promise<DisasterReport> {
    const report = this.disasterReports.get(id);
    if (!report) throw new Error("Disaster report not found");
    
    const updatedReport = { ...report, ...updates };
    this.disasterReports.set(id, updatedReport);
    return updatedReport;
  }

  async deleteDisasterReport(id: string): Promise<boolean> {
    return this.disasterReports.delete(id);
  }

  // Share methods
  async getSharesByProject(projectId: string): Promise<Share[]> {
    return Array.from(this.shares.values()).filter(share => share.projectId === projectId);
  }

  async getShare(id: string): Promise<Share | undefined> {
    return this.shares.get(id);
  }

  async getShareByToken(token: string): Promise<Share | undefined> {
    return Array.from(this.shares.values()).find(share => share.token === token);
  }

  async createShare(insertShare: InsertShare): Promise<Share> {
    const id = randomUUID();
    const share: Share = {
      ...insertShare,
      id,
      createdAt: new Date()
    };
    this.shares.set(id, share);
    return share;
  }

  async updateShare(id: string, updates: Partial<Share>): Promise<Share> {
    const share = this.shares.get(id);
    if (!share) throw new Error("Share not found");
    
    const updatedShare = { ...share, ...updates };
    this.shares.set(id, updatedShare);
    return updatedShare;
  }

  async deleteShare(id: string): Promise<boolean> {
    return this.shares.delete(id);
  }

  // Audit Log methods
  async createAuditLog(insertEntry: InsertAuditLogEntry): Promise<AuditLogEntry> {
    const id = randomUUID();
    const entry: AuditLogEntry = {
      ...insertEntry,
      id,
      at: new Date()
    };
    this.auditLog.set(id, entry);
    return entry;
  }

  async getAuditLogByProject(projectId: string): Promise<AuditLogEntry[]> {
    return Array.from(this.auditLog.values()).filter(entry => entry.entityId === projectId);
  }

  // Initialize Disaster Lens sample data
  private initializeDisasterLensSampleData() {
    // Create sample organization
    const sampleOrg: Organization = {
      id: 'dl-org-001',
      name: 'Demo Construction Company',
      slug: 'demo-construction',
      type: 'contractor',
      description: 'Professional storm damage restoration and construction services',
      ownerId: 'contractor-001',
      settings: {
        defaultPermissions: ['project_read', 'media_read'],
        brandingColor: '#2563eb'
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.organizations.set(sampleOrg.id, sampleOrg);

    // Add organization member
    const sampleMember: OrganizationMember = {
      id: 'dl-member-001',
      organizationId: 'dl-org-001',
      userId: 'contractor-001',
      role: 'owner',
      permissions: ['project_read', 'project_write', 'media_read', 'media_write'],
      createdAt: new Date(),
      joinedAt: new Date()
    };
    this.organizationMembers.set(sampleMember.id, sampleMember);

    // Create sample project
    const sampleProject: Project = {
      id: 'dl-project-001',
      organizationId: 'dl-org-001',
      name: 'Hurricane Damage Assessment - Miami Beach Property',
      description: 'Complete damage documentation for insurance claim following Hurricane Alexandra',
      clientName: 'Johnson Family',
      propertyAddress: '1234 Ocean Drive, Miami Beach, FL 33139',
      latitude: 25.7817,
      longitude: -80.1778,
      tags: ['hurricane', 'residential', 'roof-damage', 'water-damage'],
      status: 'active',
      createdBy: 'contractor-001',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.projects.set(sampleProject.id, sampleProject);

    // Create sample media
    const sampleMedia: Media = {
      id: 'dl-media-001',
      projectId: 'dl-project-001',
      uploadedBy: 'contractor-001',
      fileKey: 'dl-project-001/sample-roof-damage.jpg',
      fileName: 'roof-damage-northeast-corner.jpg',
      fileType: 'image/jpeg',
      fileSize: 2453670,
      sha256: 'a1b2c3d4e5f6789012345678901234567890abcdef',
      latitude: 25.7817,
      longitude: -80.1778,
      metadata: {
        exif: {
          camera: 'iPhone 14 Pro',
          capturedAt: '2024-09-25T10:30:00Z'
        },
        gps: {
          latitude: 25.7817,
          longitude: -80.1778
        }
      },
      createdAt: new Date()
    };
    this.media.set(sampleMedia.id, sampleMedia);

    // Create sample annotation
    const sampleAnnotation: Annotation = {
      id: 'dl-annotation-001',
      mediaId: 'dl-media-001',
      userId: 'contractor-001',
      type: 'damage_highlight',
      data: {
        severity: 'high',
        damageType: 'missing_shingles',
        description: 'Multiple shingles missing from northeast corner, exposing underlayment'
      },
      coordinates: {
        x: 120,
        y: 80,
        width: 150,
        height: 100
      },
      createdAt: new Date()
    };
    this.annotations.set(sampleAnnotation.id, sampleAnnotation);

    // Create sample task
    const sampleTask: DisasterTask = {
      id: 'dl-task-001',
      projectId: 'dl-project-001',
      title: 'Complete exterior documentation',
      description: 'Capture comprehensive photos of all exterior damage for insurance claim',
      assignedTo: 'contractor-001',
      createdBy: 'contractor-001',
      status: 'in_progress',
      priority: 'high',
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      completedAt: null,
      createdAt: new Date()
    };
    this.disasterTasks.set(sampleTask.id, sampleTask);

    // Create sample report
    const sampleReport: DisasterReport = {
      id: 'dl-report-001',
      projectId: 'dl-project-001',
      title: 'Hurricane Alexandra Damage Assessment Report',
      template: 'insurance_claim',
      mediaIds: ['dl-media-001'],
      sections: [
        {
          title: 'Executive Summary',
          content: 'Property sustained significant damage from Hurricane Alexandra on September 20, 2024.'
        },
        {
          title: 'Roof Damage Assessment',
          content: 'Northeast corner shows severe shingle loss requiring immediate attention.'
        }
      ],
      createdBy: 'contractor-001',
      status: 'draft',
      createdAt: new Date()
    };
    this.disasterReports.set(sampleReport.id, sampleReport);

    console.log('📸 Initialized Disaster Lens sample data: 1 org, 1 project, 1 media, 1 annotation, 1 task, 1 report');
  }
  // ===== SAMPLE DATA INITIALIZATION =====
  
  async initializeSampleData(): Promise<void> {
    console.log('🌪️ Initializing sample storm prediction data...');
    
    // Only initialize if we don't have any data yet
    if (this.stormPredictions.size > 0) {
      console.log('✅ Sample data already exists, skipping initialization');
      return;
    }
    
    try {
      // Create sample storm predictions
      const stormPredictions = await this.createSampleStormPredictions();
      
      // Create sample damage forecasts for each prediction
      for (const prediction of stormPredictions) {
        await this.createSampleDamageForecasts(prediction);
      }
      
      // Create sample contractor opportunities
      const forecasts = Array.from(this.damageForecasts.values());
      for (const forecast of forecasts) {
        if (['moderate', 'high', 'extreme'].includes(forecast.riskLevel)) {
          await this.createSampleContractorOpportunity(forecast);
        }
      }
      
      console.log(`✅ Initialized sample data: ${this.stormPredictions.size} predictions, ${this.damageForecasts.size} forecasts, ${this.contractorOpportunityPredictions.size} opportunities`);
    } catch (error) {
      console.error('❌ Failed to initialize sample data:', error);
    }
  }
  
  private async createSampleStormPredictions(): Promise<StormPrediction[]> {
    const samplePredictions = [
      {
        stormId: 'STORM-2025-001',
        stormName: 'Hurricane Alexandra',
        stormType: 'hurricane',
        currentLatitude: '25.7617',
        currentLongitude: '-80.1918',
        currentIntensity: 85,
        currentPressure: 965,
        currentDirection: 315,
        currentSpeed: 12,
        forecastHours: 72,
        predictedPath: [
          { time: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(), latitude: 26.2, longitude: -80.8, intensity: 90, confidence: 0.92 },
          { time: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(), latitude: 27.1, longitude: -81.5, intensity: 95, confidence: 0.88 },
          { time: new Date(Date.now() + 18 * 60 * 60 * 1000).toISOString(), latitude: 28.3, longitude: -82.2, intensity: 100, confidence: 0.85 },
          { time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), latitude: 29.5, longitude: -83.1, intensity: 85, confidence: 0.81 }
        ],
        maxPredictedIntensity: 100,
        overallConfidence: '0.86',
        pathConfidence: '0.83',
        intensityConfidence: '0.89',
        modelsSources: ['HWRF', 'GFS', 'ECMWF', 'HMON'],
        aiModelVersion: 'v1.0',
        analysisComplexity: 'high',
        status: 'active',
        predictionStartTime: new Date().toISOString(),
        predictionEndTime: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString()
      },
      {
        stormId: 'STORM-2025-002', 
        stormName: 'Tropical Storm Benjamin',
        stormType: 'tropical_storm',
        currentLatitude: '32.0835',
        currentLongitude: '-81.0998',
        currentIntensity: 65,
        currentPressure: 995,
        currentDirection: 45,
        currentSpeed: 15,
        forecastHours: 48,
        predictedPath: [
          { time: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(), latitude: 32.8, longitude: -80.2, intensity: 70, confidence: 0.89 },
          { time: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(), latitude: 33.6, longitude: -79.5, intensity: 65, confidence: 0.85 },
          { time: new Date(Date.now() + 18 * 60 * 60 * 1000).toISOString(), latitude: 34.5, longitude: -78.8, intensity: 60, confidence: 0.82 }
        ],
        maxPredictedIntensity: 70,
        overallConfidence: '0.85',
        pathConfidence: '0.87',
        intensityConfidence: '0.83',
        modelsSources: ['GFS', 'NAM', 'HRRR'],
        aiModelVersion: 'v1.0',
        analysisComplexity: 'moderate',
        status: 'active',
        predictionStartTime: new Date().toISOString(),
        predictionEndTime: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
      },
      {
        stormId: 'STORM-2025-003',
        stormName: null,
        stormType: 'severe_thunderstorm',
        currentLatitude: '33.4484',
        currentLongitude: '-86.8017',
        currentIntensity: 45,
        currentPressure: null,
        currentDirection: 270,
        currentSpeed: 25,
        forecastHours: 24,
        predictedPath: [
          { time: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(), latitude: 33.5, longitude: -86.2, intensity: 50, confidence: 0.91 },
          { time: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(), latitude: 33.7, longitude: -85.4, intensity: 55, confidence: 0.87 },
          { time: new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString(), latitude: 34.0, longitude: -84.6, intensity: 45, confidence: 0.84 }
        ],
        maxPredictedIntensity: 55,
        overallConfidence: '0.87',
        pathConfidence: '0.89',
        intensityConfidence: '0.85',
        modelsSources: ['HRRR', 'NAM', 'RAP'],
        aiModelVersion: 'v1.0',
        analysisComplexity: 'low',
        status: 'active',
        predictionStartTime: new Date().toISOString(),
        predictionEndTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      }
    ];
    
    const createdPredictions: StormPrediction[] = [];
    for (const predData of samplePredictions) {
      const prediction = await this.createStormPrediction(predData as any);
      createdPredictions.push(prediction);
    }
    
    return createdPredictions;
  }
  
  private async createSampleDamageForecasts(stormPrediction: StormPrediction): Promise<void> {
    const forecastsData = [];
    
    if (stormPrediction.stormType === 'hurricane') {
      forecastsData.push(
        {
          stormPredictionId: stormPrediction.id,
          stormId: stormPrediction.stormId,
          state: 'Florida',
          stateCode: 'FL',
          county: 'Miami-Dade',
          centerLatitude: '25.7617',
          centerLongitude: '-80.1918',
          impactRadius: '50.0',
          expectedArrivalTime: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
          peakIntensityTime: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
          expectedExitTime: new Date(Date.now() + 18 * 60 * 60 * 1000).toISOString(),
          windDamageRisk: '9.2',
          floodingRisk: '8.5',
          stormSurgeRisk: '9.8',
          hailRisk: '2.1',
          tornadoRisk: '4.3',
          overallDamageRisk: '8.9',
          riskLevel: 'extreme' as const,
          confidenceScore: '0.91',
          estimatedPropertyDamage: '2500000000',
          estimatedClaimVolume: 85000,
          estimatedRestorationJobs: 12500,
          averageJobValue: '15000',
          populationExposed: 2700000,
          buildingsExposed: 950000,
          highValueTargets: ['Miami International Airport', 'Port of Miami', 'Downtown Miami'],
          status: 'active',
          validUntilTime: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString()
        },
        {
          stormPredictionId: stormPrediction.id,
          stormId: stormPrediction.stormId,
          state: 'Florida',
          stateCode: 'FL',
          county: 'Broward',
          centerLatitude: '26.1224',
          centerLongitude: '-80.1373',
          impactRadius: '45.0',
          expectedArrivalTime: new Date(Date.now() + 10 * 60 * 60 * 1000).toISOString(),
          peakIntensityTime: new Date(Date.now() + 14 * 60 * 60 * 1000).toISOString(),
          expectedExitTime: new Date(Date.now() + 20 * 60 * 60 * 1000).toISOString(),
          windDamageRisk: '8.7',
          floodingRisk: '7.8',
          stormSurgeRisk: '8.9',
          hailRisk: '1.8',
          tornadoRisk: '3.9',
          overallDamageRisk: '8.2',
          riskLevel: 'high' as const,
          confidenceScore: '0.88',
          estimatedPropertyDamage: '1800000000',
          estimatedClaimVolume: 62000,
          estimatedRestorationJobs: 9200,
          averageJobValue: '14500',
          populationExposed: 1950000,
          buildingsExposed: 720000,
          highValueTargets: ['Fort Lauderdale Airport', 'Port Everglades'],
          status: 'active',
          validUntilTime: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString()
        }
      );
    } else if (stormPrediction.stormType === 'tropical_storm') {
      forecastsData.push({
        stormPredictionId: stormPrediction.id,
        stormId: stormPrediction.stormId,
        state: 'Georgia',
        stateCode: 'GA',
        county: 'Chatham',
        centerLatitude: '32.0835',
        centerLongitude: '-81.0998',
        impactRadius: '35.0',
        expectedArrivalTime: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
        peakIntensityTime: new Date(Date.now() + 10 * 60 * 60 * 1000).toISOString(),
        expectedExitTime: new Date(Date.now() + 16 * 60 * 60 * 1000).toISOString(),
        windDamageRisk: '6.5',
        floodingRisk: '7.2',
        stormSurgeRisk: '5.8',
        hailRisk: '1.2',
        tornadoRisk: '3.1',
        overallDamageRisk: '6.1',
        riskLevel: 'moderate' as const,
        confidenceScore: '0.84',
        estimatedPropertyDamage: '450000000',
        estimatedClaimVolume: 18500,
        estimatedRestorationJobs: 2800,
        averageJobValue: '12000',
        populationExposed: 395000,
        buildingsExposed: 145000,
        highValueTargets: ['Savannah Port', 'Historic District'],
        status: 'active',
        validUntilTime: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
      });
    } else if (stormPrediction.stormType === 'severe_thunderstorm') {
      forecastsData.push({
        stormPredictionId: stormPrediction.id,
        stormId: stormPrediction.stormId,
        state: 'Alabama',
        stateCode: 'AL', 
        county: 'Jefferson',
        centerLatitude: '33.4484',
        centerLongitude: '-86.8017',
        impactRadius: '25.0',
        expectedArrivalTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        peakIntensityTime: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
        expectedExitTime: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
        windDamageRisk: '5.8',
        floodingRisk: '4.2',
        stormSurgeRisk: '0.0',
        hailRisk: '7.5',
        tornadoRisk: '6.8',
        overallDamageRisk: '5.9',
        riskLevel: 'moderate' as const,
        confidenceScore: '0.87',
        estimatedPropertyDamage: '180000000',
        estimatedClaimVolume: 8500,
        estimatedRestorationJobs: 1200,
        averageJobValue: '8500',
        populationExposed: 660000,
        buildingsExposed: 285000,
        highValueTargets: ['Birmingham Airport', 'University of Alabama'],
        status: 'active',
        validUntilTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      });
    }
    
    for (const forecastData of forecastsData) {
      await this.createDamageForecast(forecastData as any);
    }
  }
  
  private async createSampleContractorOpportunity(damageForecast: DamageForecast): Promise<void> {
    const baseOpportunityScore = damageForecast.riskLevel === 'extreme' ? 85 : 
                                 damageForecast.riskLevel === 'high' ? 75 : 65;
    
    const opportunityData = {
      damageForecastId: damageForecast.id,
      stormPredictionId: damageForecast.stormPredictionId,
      state: damageForecast.state,
      county: damageForecast.county,
      city: null,
      zipCode: null,
      opportunityScore: (baseOpportunityScore + Math.random() * 10).toFixed(1),
      marketPotential: damageForecast.riskLevel === 'extreme' ? 'very_high' : 
                      damageForecast.riskLevel === 'high' ? 'high' : 'moderate',
      competitionLevel: 'moderate',
      treeRemovalDemand: (70 + Math.random() * 25).toFixed(1),
      roofingDemand: (80 + Math.random() * 15).toFixed(1),
      sidingDemand: (60 + Math.random() * 20).toFixed(1),
      windowDemand: (55 + Math.random() * 25).toFixed(1),
      gutterDemand: (45 + Math.random() * 20).toFixed(1),
      fencingDemand: (40 + Math.random() * 15).toFixed(1),
      emergencyTarpingDemand: (85 + Math.random() * 10).toFixed(1),
      waterDamageDemand: (65 + Math.random() * 20).toFixed(1),
      estimatedRevenueOpportunity: (parseFloat(damageForecast.estimatedPropertyDamage) * 0.15).toFixed(0),
      expectedJobCount: Math.floor(damageForecast.estimatedRestorationJobs * 0.8),
      averageJobValue: (parseFloat(damageForecast.averageJobValue) * 1.2).toFixed(0),
      emergencyPremiumFactor: '1.25',
      insurancePayoutLikelihood: '0.82',
      averageClaimAmount: damageForecast.averageJobValue,
      historicalPayoutRatio: '0.85',
      optimalPrePositionTime: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
      workAvailableFromTime: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
      peakDemandTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      demandDeclineTime: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      recommendedCrewSize: Math.max(2, Math.floor(damageForecast.estimatedRestorationJobs / 500)),
      estimatedDurationDays: Math.floor(15 + Math.random() * 20),
      predictionConfidence: (0.75 + Math.random() * 0.15).toFixed(2),
      alertLevel: damageForecast.riskLevel === 'extreme' ? 'emergency' : 
                  damageForecast.riskLevel === 'high' ? 'warning' : 'advisory',
      status: 'active'
    };
    
    await this.createContractorOpportunityPrediction(opportunityData as any);
  }

  // ===== DRONE FLEET MANAGEMENT METHODS =====

  async getDrones(): Promise<Drone[]> {
    return Array.from(this.drones.values());
  }

  async getDrone(id: string): Promise<Drone | undefined> {
    return this.drones.get(id);
  }

  async createDrone(insertDrone: InsertDrone): Promise<Drone> {
    const drone: Drone = {
      id: randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
      ...insertDrone
    };
    this.drones.set(drone.id, drone);
    return drone;
  }

  async updateDrone(id: string, updates: Partial<Drone>): Promise<Drone> {
    const drone = this.drones.get(id);
    if (!drone) {
      throw new Error('Drone not found');
    }
    const updatedDrone = { ...drone, ...updates, updatedAt: new Date() };
    this.drones.set(id, updatedDrone);
    return updatedDrone;
  }

  async deleteDrone(id: string): Promise<boolean> {
    return this.drones.delete(id);
  }

  // ===== MISSION MANAGEMENT METHODS =====

  async getMissions(): Promise<Mission[]> {
    return Array.from(this.missions.values());
  }

  async getMission(id: string): Promise<Mission | undefined> {
    return this.missions.get(id);
  }

  async getMissionsByDrone(droneId: string): Promise<Mission[]> {
    return Array.from(this.missions.values()).filter(mission => mission.droneId === droneId);
  }

  async createMission(insertMission: InsertMission): Promise<Mission> {
    const mission: Mission = {
      id: randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
      ...insertMission
    };
    this.missions.set(mission.id, mission);
    return mission;
  }

  async updateMission(id: string, updates: Partial<Mission>): Promise<Mission> {
    const mission = this.missions.get(id);
    if (!mission) {
      throw new Error('Mission not found');
    }
    const updatedMission = { ...mission, ...updates, updatedAt: new Date() };
    this.missions.set(id, updatedMission);
    return updatedMission;
  }

  async deleteMission(id: string): Promise<boolean> {
    return this.missions.delete(id);
  }

  // ===== TELEMETRY METHODS =====

  async getTelemetry(): Promise<Telemetry[]> {
    return Array.from(this.telemetry.values());
  }

  async getTelemetryByDrone(droneId: string): Promise<Telemetry[]> {
    return Array.from(this.telemetry.values()).filter(t => t.droneId === droneId);
  }

  async getTelemetryByMission(missionId: string): Promise<Telemetry[]> {
    return Array.from(this.telemetry.values()).filter(t => t.missionId === missionId);
  }

  async createTelemetry(insertTelemetry: InsertTelemetry): Promise<Telemetry> {
    const telemetry: Telemetry = {
      id: randomUUID(),
      createdAt: new Date(),
      ...insertTelemetry
    };
    this.telemetry.set(telemetry.id, telemetry);
    return telemetry;
  }

  async getLatestTelemetryByDrone(droneId: string): Promise<Telemetry | undefined> {
    const droneTelemetry = await this.getTelemetryByDrone(droneId);
    if (droneTelemetry.length === 0) return undefined;
    
    // Sort by timestamp desc and return the latest
    return droneTelemetry.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
  }

  // ===== AI ASSISTANT METHODS =====

  async createAiSession(insertSession: InsertAiSession): Promise<AiSession> {
    const session: AiSession = {
      id: randomUUID(),
      startedAt: new Date(),
      ...insertSession
    };
    this.aiSessions.set(session.id, session);
    return session;
  }

  async getAiSession(id: string): Promise<AiSession | undefined> {
    return this.aiSessions.get(id);
  }

  async getAiSessionsByProject(projectId: string): Promise<AiSession[]> {
    return Array.from(this.aiSessions.values()).filter(session => session.projectId === projectId);
  }

  async createAiAction(insertAction: InsertAiAction): Promise<AiAction> {
    const action: AiAction = {
      id: randomUUID(),
      createdAt: new Date(),
      ...insertAction
    };
    this.aiActions.set(action.id, action);
    return action;
  }

  async getAiActionsBySession(sessionId: string): Promise<AiAction[]> {
    return Array.from(this.aiActions.values()).filter(action => action.sessionId === sessionId);
  }

  async createMediaFrame(insertFrame: InsertMediaFrame): Promise<MediaFrame> {
    const frame: MediaFrame = {
      id: randomUUID(),
      ...insertFrame
    };
    this.mediaFrames.set(frame.id, frame);
    return frame;
  }

  async getMediaFramesByMedia(mediaId: string): Promise<MediaFrame[]> {
    return Array.from(this.mediaFrames.values()).filter(frame => frame.mediaId === mediaId);
  }

  // Voice Profile methods
  async getVoiceProfiles(): Promise<VoiceProfile[]> {
    return Array.from(this.voiceProfiles.values());
  }

  async getActiveVoiceProfiles(): Promise<VoiceProfile[]> {
    return Array.from(this.voiceProfiles.values()).filter(p => p.isActive);
  }

  async getVoiceProfile(id: string): Promise<VoiceProfile | undefined> {
    return this.voiceProfiles.get(id);
  }

  async getDefaultVoiceProfile(): Promise<VoiceProfile | undefined> {
    // First try database
    try {
      const { db } = await import('./db.js');
      const { voiceProfiles } = await import('../shared/schema.js');
      const { eq, and } = await import('drizzle-orm');
      
      const dbProfiles = await db.select().from(voiceProfiles)
        .where(and(eq(voiceProfiles.isDefault, true), eq(voiceProfiles.isActive, true)))
        .limit(1);
      
      if (dbProfiles.length > 0) {
        return dbProfiles[0];
      }
    } catch (error) {
      // Database not available, fall back to memory
      console.log('Using in-memory voice profiles (database not available)');
    }
    
    // Fall back to memory
    return Array.from(this.voiceProfiles.values()).find(p => p.isDefault && p.isActive);
  }

  async createVoiceProfile(insertProfile: InsertVoiceProfile): Promise<VoiceProfile> {
    // If setting as default, unset all other defaults first
    if (insertProfile.isDefault) {
      const profiles = Array.from(this.voiceProfiles.values());
      for (const p of profiles) {
        if (p.isDefault) {
          p.isDefault = false;
          p.updatedAt = new Date();
        }
      }
    }
    
    const profile: VoiceProfile = {
      id: randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
      ...insertProfile
    };
    this.voiceProfiles.set(profile.id, profile);
    return profile;
  }

  async updateVoiceProfile(id: string, updates: Partial<VoiceProfile>): Promise<VoiceProfile> {
    const profile = this.voiceProfiles.get(id);
    if (!profile) {
      throw new Error(`Voice profile ${id} not found`);
    }
    const updated = { ...profile, ...updates, updatedAt: new Date() };
    this.voiceProfiles.set(id, updated);
    return updated;
  }

  async deleteVoiceProfile(id: string): Promise<boolean> {
    return this.voiceProfiles.delete(id);
  }
}

export const storage = new MemStorage();

// Initialize sample data when the storage is created
storage.initializeSampleData().catch(console.error);
