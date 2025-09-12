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
  type InsertStormHotZone
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
}

export const storage = new MemStorage();
