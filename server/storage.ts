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
  type InsertDspFootage
} from "@shared/schema";
import { randomUUID } from "crypto";

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

  constructor() {
    this.initializeTestData();
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
}

export const storage = new MemStorage();
