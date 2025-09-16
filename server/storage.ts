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
  type InsertDetectionResult
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

  constructor() {
    console.log('🏗️ Initializing MemStorage...');
    this.initializeTestData();
    console.log('📍 Loading storm hot zones...');
    this.loadStormHotZones();
    console.log('✅ MemStorage initialization complete');
  }

  private initializeTestData() {
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
}

export const storage = new MemStorage();
