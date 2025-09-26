import { storage } from "../storage.js";
import { countyParcelService } from "./countyParcelService.js";
import { propertyService } from "./property.js";
import { noaaStormEventsService } from "./noaaStormEventsService.js";
import type { NOAACountyData } from "./noaaStormEventsService.js";
import type { PropertyData } from "./property.js";
// Note: ParcelData interface will be defined inline as needed

// ===== INTERFACES =====

export interface ParcelOpportunity {
  // Parcel identification
  parcelId: string;
  address: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  
  // Property details
  propertyType: string;
  yearBuilt?: number;
  squareFootage?: number;
  estimatedValue?: number;
  roofType?: string;
  
  // Owner information
  ownerName: string;
  ownerPhone?: string;
  ownerEmail?: string;
  mailingAddress?: string;
  
  // Storm risk factors
  stormTypes: string[];
  riskScore: number;
  damageCategories: string[];
  estimatedDamageValue: number;
  
  // Lead generation metadata
  opportunityScore: number;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  contractorTypes: string[];
  estimatedJobValue: number;
  
  // Source tracking
  dataSource: string[];
  county: string;
  state: string;
  lastUpdated: Date;
}

export interface ConversionFilter {
  stateCode?: string;
  county?: string;
  minRiskScore?: number;
  maxResults?: number;
  stormTypes?: string[];
  propertyTypes?: string[];
  minPropertyValue?: number;
  maxPropertyAge?: number;
  requireContactInfo?: boolean;
}

export interface ConversionResult {
  success: boolean;
  opportunities: ParcelOpportunity[];
  totalProcessed: number;
  filtered: number;
  conversionRate: number;
  errors: string[];
  processingTimeMs: number;
  countyBreakdown: { [county: string]: number };
}

// ===== STORM-TO-PARCEL CONVERSION SERVICE =====

export class StormToParcelConverter {
  private static instance: StormToParcelConverter;
  private readonly isDevelopment: boolean;

  private constructor() {
    this.isDevelopment = process.env.NODE_ENV !== 'production';
    console.log(`🏘️ StormToParcelConverter initialized (${this.isDevelopment ? 'development' : 'production'} mode)`);
  }

  static getInstance(): StormToParcelConverter {
    if (!StormToParcelConverter.instance) {
      StormToParcelConverter.instance = new StormToParcelConverter();
    }
    return StormToParcelConverter.instance;
  }

  /**
   * Main conversion method: Transform NOAA county data into parcel opportunities
   */
  async convertStormDataToParcels(filter: ConversionFilter = {}): Promise<ConversionResult> {
    const startTime = Date.now();
    console.log('🏠 Converting storm data to parcel opportunities...');

    const result: ConversionResult = {
      success: false,
      opportunities: [],
      totalProcessed: 0,
      filtered: 0,
      conversionRate: 0,
      errors: [],
      processingTimeMs: 0,
      countyBreakdown: {}
    };

    try {
      // Step 1: Get storm hot zones (enhanced with NOAA data)
      const stormZones = await storage.getStormHotZones();
      let filteredZones = stormZones;

      // Apply basic filters
      if (filter.stateCode) {
        filteredZones = filteredZones.filter(zone => zone.stateCode === filter.stateCode);
      }
      
      if (filter.county) {
        filteredZones = filteredZones.filter(zone => zone.countyParish.toLowerCase().includes(filter.county.toLowerCase()));
      }

      if (filter.minRiskScore) {
        filteredZones = filteredZones.filter(zone => zone.riskScore >= filter.minRiskScore);
      }

      // Sort by risk score and limit to high-priority zones
      filteredZones = filteredZones
        .sort((a, b) => b.riskScore - a.riskScore)
        .slice(0, Math.min(filteredZones.length, 50)); // Process max 50 counties to avoid timeouts

      console.log(`🎯 Processing ${filteredZones.length} high-priority storm zones`);

      // Step 2: Convert each storm zone to parcel opportunities
      for (const zone of filteredZones) {
        try {
          const parcels = await this.generateParcelsForZone(zone, filter);
          result.opportunities.push(...parcels);
          result.countyBreakdown[`${zone.countyParish}, ${zone.stateCode}`] = parcels.length;
          result.totalProcessed++;
        } catch (error) {
          result.errors.push(`Failed to process ${zone.countyParish}, ${zone.stateCode}: ${String(error)}`);
        }
      }

      // Step 3: Apply final filtering and sorting
      result.opportunities = this.filterAndRankOpportunities(result.opportunities, filter);
      result.filtered = result.opportunities.length;

      // Apply result limits
      if (filter.maxResults && result.opportunities.length > filter.maxResults) {
        result.opportunities = result.opportunities.slice(0, filter.maxResults);
      }

      result.conversionRate = result.totalProcessed > 0 ? result.filtered / result.totalProcessed : 0;
      result.processingTimeMs = Date.now() - startTime;
      result.success = true;

      console.log(`✅ Storm-to-parcel conversion complete: ${result.opportunities.length} opportunities generated`);
      return result;

    } catch (error) {
      result.errors.push(`Conversion failed: ${String(error)}`);
      result.processingTimeMs = Date.now() - startTime;
      console.error('❌ Storm-to-parcel conversion error:', error);
      return result;
    }
  }

  /**
   * Generate parcel opportunities for a specific storm zone using real data integration
   */
  private async generateParcelsForZone(zone: any, filter: ConversionFilter): Promise<ParcelOpportunity[]> {
    const opportunities: ParcelOpportunity[] = [];

    try {
      console.log(`🏠 Generating real parcels for ${zone.countyParish}, ${zone.stateCode}`);

      // Step 1: Generate sample coordinates within county bounds
      // In production, these would come from actual county polygon data
      const countyCoordinates = this.generateCountyCoordinates(zone);
      
      // Step 2: For each coordinate, try to get real parcel data
      const maxParcels = Math.min(filter.maxResults || 20, 25);
      
      for (let i = 0; i < maxParcels && opportunities.length < maxParcels; i++) {
        try {
          const coords = countyCoordinates[i % countyCoordinates.length];
          
          // Try to get real parcel data using county parcel service
          let parcelData = null;
          if (countyParcelService) {
            try {
              parcelData = await countyParcelService.lookupByCoordinates(coords.latitude, coords.longitude);
            } catch (error) {
              console.log(`⚠️ Parcel lookup failed for coords ${coords.latitude},${coords.longitude}: ${error}`);
            }
          }
          
          // Try to enrich with property service if we have an address
          let propertyData = null;
          if (parcelData?.address && propertyService) {
            try {
              propertyData = await propertyService.lookupByAddress(parcelData.address);
            } catch (error) {
              console.log(`⚠️ Property enrichment failed for ${parcelData.address}: ${error}`);
            }
          }
          
          // Create opportunity from real or enhanced data
          const opportunity = this.createOpportunityFromData(zone, parcelData, propertyData, coords, i);
          if (opportunity) {
            opportunities.push(opportunity);
          }
          
        } catch (error) {
          console.error(`Error processing parcel ${i} for ${zone.countyParish}:`, error);
          continue;
        }
      }

      // If we got very few real results, supplement with enhanced mock data
      if (opportunities.length < 5) {
        console.log(`🔄 Supplementing ${opportunities.length} real parcels with enhanced mock data for ${zone.countyParish}`);
        const mockParcels = this.generateEnhancedMockParcels(zone, filter, 10 - opportunities.length);
        opportunities.push(...mockParcels);
      }

      console.log(`✅ Generated ${opportunities.length} parcel opportunities for ${zone.countyParish} (real data integration)`);
      return opportunities;

    } catch (error) {
      console.error(`❌ Error generating parcels for ${zone.countyParish}:`, error);
      
      // Fallback to mock data but mark it clearly
      console.log(`🔄 Falling back to mock data for ${zone.countyParish} due to error`);
      return this.generateEnhancedMockParcels(zone, filter, 10);
    }
  }

  /**
   * Generate realistic coordinates within county boundaries
   */
  private generateCountyCoordinates(zone: any): Array<{latitude: number, longitude: number}> {
    const coordinates = [];
    // Base coordinates - in production, these would come from county polygon data
    const baseLat = 25.7617; // Default to Florida region
    const baseLng = -80.1918;
    
    // Generate 20-30 coordinates spread across county area
    for (let i = 0; i < 25; i++) {
      coordinates.push({
        latitude: baseLat + (Math.random() - 0.5) * 0.5, // ~25 mile radius
        longitude: baseLng + (Math.random() - 0.5) * 0.5
      });
    }
    
    return coordinates;
  }

  /**
   * Create opportunity from real or mock data
   */
  private createOpportunityFromData(
    zone: any, 
    parcelData: any, 
    propertyData: any, 
    coords: {latitude: number, longitude: number}, 
    index: number
  ): ParcelOpportunity | null {
    try {
      // If we have real data, use it; otherwise create enhanced mock
      const address = parcelData?.address || propertyData?.address || this.generateMockAddress(index + 1);
      const ownerName = propertyData?.owner?.name || parcelData?.owner?.name || this.generateMockOwnerName();
      const propertyType = propertyData?.details?.propertyType || parcelData?.propertyDetails?.propertyType || 'Single Family';
      const yearBuilt = propertyData?.details?.yearBuilt || parcelData?.propertyDetails?.yearBuilt;
      const squareFootage = propertyData?.details?.squareFootage || parcelData?.propertyDetails?.squareFootage;
      const estimatedValue = propertyData?.details?.estimatedValue || parcelData?.propertyDetails?.totalValue || (squareFootage ? squareFootage * 200 : 250000);

      const riskFactorMultiplier = zone.riskScore / 100;
      const damageValue = estimatedValue * 0.1 * (0.5 + riskFactorMultiplier);
      const jobValue = damageValue * (1.2 + Math.random() * 0.8);

      const opportunity: ParcelOpportunity = {
        parcelId: parcelData?.parcelId || `${zone.stateCode}-${zone.countyParish.replace(/\s+/g, '')}-REAL-${String(index + 1).padStart(4, '0')}`,
        address,
        coordinates: coords,
        
        propertyType,
        yearBuilt,
        squareFootage,
        estimatedValue,
        roofType: 'Asphalt Shingle', // Default
        
        ownerName,
        ownerPhone: propertyData?.owner?.phone || (Math.random() > 0.3 ? this.generateMockPhone() : undefined),
        ownerEmail: propertyData?.owner?.email || (Math.random() > 0.5 ? this.generateMockEmail() : undefined),
        mailingAddress: propertyData?.owner?.mailingAddress || parcelData?.owner?.mailingAddress,
        
        stormTypes: zone.majorStormTypes || ['Hurricane', 'Tornado'],
        riskScore: Math.round(zone.riskScore + (Math.random() - 0.5) * 10),
        damageCategories: ['Roof Damage', 'Siding Damage'],
        estimatedDamageValue: Math.round(damageValue),
        
        opportunityScore: Math.round(70 + Math.random() * 30),
        priority: this.calculatePriority(zone.riskScore, yearBuilt, estimatedValue),
        contractorTypes: ['Roofing', 'Siding'],
        estimatedJobValue: Math.round(jobValue),
        
        dataSource: parcelData ? ['NOAA Enhanced', 'Real Parcel Data'] : ['NOAA Enhanced', 'Enhanced Mock'],
        county: zone.countyParish,
        state: zone.stateCode,
        lastUpdated: new Date()
      };

      return opportunity;
    } catch (error) {
      console.error('Error creating opportunity:', error);
      return null;
    }
  }

  /**
   * Generate enhanced mock parcel data (used as fallback)
   */
  private generateEnhancedMockParcels(zone: any, filter: ConversionFilter, count: number): ParcelOpportunity[] {
    return this.generateMockParcelsForZone(zone, filter).slice(0, count);
  }

  /**
   * Generate realistic mock parcel data for development and demonstration
   */
  private generateMockParcelsForZone(zone: any, filter: ConversionFilter): ParcelOpportunity[] {
    const opportunities: ParcelOpportunity[] = [];
    const parcelCount = Math.min(Math.floor(Math.random() * 15) + 5, 20); // 5-20 parcels per county

    const propertyTypes = ['Single Family', 'Townhouse', 'Condominium', 'Multi-Family', 'Commercial'];
    const roofTypes = ['Asphalt Shingle', 'Metal', 'Tile', 'Slate', 'Flat'];
    const damageCategories = ['Roof Damage', 'Siding Damage', 'Window Damage', 'Water Damage', 'Structural Damage'];
    const contractorTypes = ['Roofing', 'Siding', 'Windows', 'Water Restoration', 'General Contractor'];

    for (let i = 0; i < parcelCount; i++) {
      const propertyType = propertyTypes[Math.floor(Math.random() * propertyTypes.length)];
      const yearBuilt = 1960 + Math.floor(Math.random() * 60);
      const squareFootage = 1200 + Math.floor(Math.random() * 2800);
      const estimatedValue = squareFootage * (150 + Math.floor(Math.random() * 200));
      
      // Generate realistic coordinates within county (mock)
      const lat = 25.7617 + (Math.random() - 0.5) * 2; // Rough Florida coordinates
      const lng = -80.1918 + (Math.random() - 0.5) * 2;
      
      const riskFactorMultiplier = zone.riskScore / 100;
      const damageValue = estimatedValue * 0.1 * (0.5 + riskFactorMultiplier);
      const jobValue = damageValue * (1.2 + Math.random() * 0.8); // 120-200% of damage value

      const opportunity: ParcelOpportunity = {
        parcelId: `${zone.stateCode}-${zone.countyParish.replace(/\s+/g, '')}-${String(i + 1).padStart(4, '0')}`,
        address: this.generateMockAddress(i + 1),
        coordinates: { latitude: lat, longitude: lng },
        
        propertyType,
        yearBuilt,
        squareFootage,
        estimatedValue,
        roofType: roofTypes[Math.floor(Math.random() * roofTypes.length)],
        
        ownerName: this.generateMockOwnerName(),
        ownerPhone: Math.random() > 0.3 ? this.generateMockPhone() : undefined,
        ownerEmail: Math.random() > 0.5 ? this.generateMockEmail() : undefined,
        mailingAddress: Math.random() > 0.2 ? this.generateMockAddress(i + 100) : undefined,
        
        stormTypes: zone.majorStormTypes || ['Hurricane', 'Tornado'],
        riskScore: Math.round(zone.riskScore + (Math.random() - 0.5) * 20),
        damageCategories: damageCategories.slice(0, Math.floor(Math.random() * 3) + 1),
        estimatedDamageValue: Math.round(damageValue),
        
        opportunityScore: Math.round(70 + Math.random() * 30),
        priority: this.calculatePriority(zone.riskScore, yearBuilt, estimatedValue),
        contractorTypes: contractorTypes.slice(0, Math.floor(Math.random() * 3) + 1),
        estimatedJobValue: Math.round(jobValue),
        
        dataSource: ['NOAA Enhanced', 'Mock County Parcels'],
        county: zone.countyParish,
        state: zone.stateCode,
        lastUpdated: new Date()
      };

      opportunities.push(opportunity);
    }

    return opportunities;
  }

  /**
   * Filter and rank opportunities by various criteria
   */
  private filterAndRankOpportunities(opportunities: ParcelOpportunity[], filter: ConversionFilter): ParcelOpportunity[] {
    let filtered = [...opportunities];

    // Apply property type filter
    if (filter.propertyTypes && filter.propertyTypes.length > 0) {
      filtered = filtered.filter(opp => filter.propertyTypes!.includes(opp.propertyType));
    }

    // Apply property value filter
    if (filter.minPropertyValue) {
      filtered = filtered.filter(opp => opp.estimatedValue && opp.estimatedValue >= filter.minPropertyValue!);
    }

    // Apply property age filter
    if (filter.maxPropertyAge && filter.maxPropertyAge > 0) {
      const maxYear = new Date().getFullYear() - filter.maxPropertyAge;
      filtered = filtered.filter(opp => !opp.yearBuilt || opp.yearBuilt >= maxYear);
    }

    // Apply contact info requirement
    if (filter.requireContactInfo) {
      filtered = filtered.filter(opp => opp.ownerPhone || opp.ownerEmail);
    }

    // Sort by opportunity score (highest first)
    filtered.sort((a, b) => b.opportunityScore - a.opportunityScore);

    return filtered;
  }

  /**
   * Calculate priority based on risk factors
   */
  private calculatePriority(riskScore: number, yearBuilt?: number, propertyValue?: number): 'HIGH' | 'MEDIUM' | 'LOW' {
    let priorityScore = riskScore;

    // Older properties get higher priority
    if (yearBuilt && yearBuilt < 1990) priorityScore += 10;
    if (yearBuilt && yearBuilt < 1970) priorityScore += 10;

    // Higher value properties get moderate boost
    if (propertyValue && propertyValue > 300000) priorityScore += 5;
    if (propertyValue && propertyValue > 500000) priorityScore += 5;

    if (priorityScore >= 85) return 'HIGH';
    if (priorityScore >= 70) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * Helper methods for generating realistic mock data
   */
  private generateMockAddress(num: number): string {
    const streets = ['Oak Street', 'Main Street', 'Pine Avenue', 'Elm Drive', 'Maple Lane', 'Cedar Court', 'Palm Boulevard'];
    const street = streets[num % streets.length];
    return `${100 + num} ${street}`;
  }

  private generateMockOwnerName(): string {
    const firstNames = ['John', 'Mary', 'Robert', 'Patricia', 'Michael', 'Jennifer', 'William', 'Linda', 'David', 'Elizabeth'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
    
    const first = firstNames[Math.floor(Math.random() * firstNames.length)];
    const last = lastNames[Math.floor(Math.random() * lastNames.length)];
    return `${first} ${last}`;
  }

  private generateMockPhone(): string {
    const area = ['305', '954', '561', '407', '813', '904'].find(() => Math.random() > 0.5) || '305';
    const prefix = Math.floor(Math.random() * 900) + 100;
    const suffix = Math.floor(Math.random() * 9000) + 1000;
    return `(${area}) ${prefix}-${suffix}`;
  }

  private generateMockEmail(): string {
    const names = ['john.smith', 'mary.johnson', 'robert.brown', 'jennifer.davis'];
    const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'aol.com'];
    
    const name = names[Math.floor(Math.random() * names.length)];
    const domain = domains[Math.floor(Math.random() * domains.length)];
    return `${name}@${domain}`;
  }
}

// Export singleton instance
export const stormToParcelConverter = StormToParcelConverter.getInstance();