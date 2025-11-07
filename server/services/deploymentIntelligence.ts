import { DamageDetectionService, DamageAnalysisResult } from './damageDetection.js';
import { PropertyOwnerLookupService, PropertyOwnerResult } from './propertyOwnerLookup.js';
import { EagleViewService, PropertyLocation, DamageAssessment } from './eagleViewService.js';
import { GeocodingService } from './geocodingService.js';
import { nasaFirmsService } from './nasaFirmsService.js';

export interface StreetLevelDamageOpportunity {
  id: string;
  timestamp: Date;
  
  // Location details (State → City → ZIP → Street)
  location: {
    state: string;
    city: string;
    zip: string;
    street: string;
    fullAddress: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  
  // Damage assessment
  damage: {
    type: string[];
    severity: 'minor' | 'moderate' | 'severe' | 'catastrophic';
    confidence: number;
    estimatedCost: {
      min: number;
      max: number;
    };
    description: string;
    affectedAreas: string[];
  };
  
  // Homeowner/property owner information
  propertyOwner?: {
    name: string;
    phone: string;
    email: string;
    insuranceCompany?: string;
    claimNumber?: string;
  };
  
  // Contractor intelligence
  contractorIntel: {
    profitabilityScore: number; // 1-10
    urgency: 'low' | 'normal' | 'high' | 'emergency';
    contractorTypesNeeded: string[];
    estimatedResponseTime: string;
    competitionLevel: 'low' | 'medium' | 'high';
    leadPriority: 'low' | 'medium' | 'high' | 'critical';
  };
  
  // Data sources
  sources: {
    imagery?: 'eagleview' | 'nasa_firms' | 'traffic_cam' | 'satellite';
    damageDetection: 'ai_vision' | 'manual_report' | 'sensor';
    propertyData: 'database' | 'public_records' | 'api';
  };
  
  // Supporting data
  imagery?: {
    beforeUrl?: string;
    afterUrl?: string;
    aerialUrl?: string;
  };
  
  roofData?: {
    squareFootage: number;
    pitch: string;
    materialsNeeded?: {
      shingles: number;
      underlayment: number;
      ridgeCap: number;
    };
  };
}

export interface DeploymentZone {
  state: string;
  city: string;
  zipCodes: string[];
  totalOpportunities: number;
  totalEstimatedRevenue: number;
  averageSeverity: number;
  opportunities: StreetLevelDamageOpportunity[];
}

export class DeploymentIntelligenceService {
  private damageDetection: DamageDetectionService;
  private propertyLookup: PropertyOwnerLookupService;
  private eagleView: EagleViewService;
  private geocoding: GeocodingService;
  
  constructor() {
    this.damageDetection = new DamageDetectionService();
    this.propertyLookup = new PropertyOwnerLookupService();
    this.eagleView = new EagleViewService();
    this.geocoding = new GeocodingService();
    
    console.log('🎯 Deployment Intelligence Service initialized - Street-level damage detection active');
  }
  
  /**
   * Analyze image for damage and generate deployment opportunity
   */
  async analyzeImageForDeployment(
    imageBuffer: Buffer,
    source: 'traffic_cam' | 'satellite' | 'aerial' | 'manual_upload'
  ): Promise<StreetLevelDamageOpportunity | null> {
    try {
      console.log('🔍 Starting street-level deployment intelligence analysis...');
      
      // Step 1: Detect damage using AI
      const damageAnalysis = await this.damageDetection.analyzeImageForDamage(imageBuffer);
      
      if (!damageAnalysis.hasDetection || damageAnalysis.detections.length === 0) {
        console.log('✅ No damage detected in image');
        return null;
      }
      
      console.log(`🚨 Detected ${damageAnalysis.detections.length} damage instance(s)`);
      
      // Step 2: Identify property owner and location from image
      const propertyInfo = await this.propertyLookup.identifyPropertyOwnerFromImage(imageBuffer);
      
      if (!propertyInfo.success || !propertyInfo.address) {
        console.log('⚠️ Could not identify property location from image');
        return null;
      }
      
      // Step 3: Combine damage analysis with property data
      const primaryDamage = damageAnalysis.detections[0]; // Highest priority detection
      
      const opportunity: StreetLevelDamageOpportunity = {
        id: `deploy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
        
        location: {
          state: propertyInfo.address.state || '',
          city: propertyInfo.address.city || '',
          zip: propertyInfo.address.postalCode || '',
          street: propertyInfo.address.street || '',
          fullAddress: propertyInfo.address.formattedAddress || '',
          coordinates: {
            lat: propertyInfo.coordinates?.latitude || 0,
            lng: propertyInfo.coordinates?.longitude || 0,
          },
        },
        
        damage: {
          type: damageAnalysis.detections.map(d => d.alertType),
          severity: primaryDamage.severity,
          confidence: primaryDamage.confidence,
          estimatedCost: primaryDamage.estimatedCost || { min: 1000, max: 5000 },
          description: primaryDamage.description,
          affectedAreas: primaryDamage.workScope || [],
        },
        
        propertyOwner: propertyInfo.propertyOwner ? {
          name: propertyInfo.propertyOwner.name,
          phone: propertyInfo.propertyOwner.phone,
          email: propertyInfo.propertyOwner.email,
          insuranceCompany: propertyInfo.propertyOwner.insuranceCompany,
          claimNumber: propertyInfo.propertyOwner.claimNumber,
        } : undefined,
        
        contractorIntel: {
          profitabilityScore: primaryDamage.profitabilityScore,
          urgency: primaryDamage.urgencyLevel,
          contractorTypesNeeded: primaryDamage.contractorTypes,
          estimatedResponseTime: this.calculateResponseTime(primaryDamage.urgencyLevel),
          competitionLevel: primaryDamage.competitionLevel,
          leadPriority: primaryDamage.leadPriority,
        },
        
        sources: {
          imagery: this.mapImagerySource(source),
          damageDetection: 'ai_vision',
          propertyData: propertyInfo.propertyOwner ? 'database' : 'api',
        },
      };
      
      console.log(`✅ Deployment opportunity created: ${opportunity.location.fullAddress}`);
      return opportunity;
      
    } catch (error) {
      console.error('❌ Error analyzing image for deployment:', error);
      return null;
    }
  }
  
  /**
   * Get aerial imagery and property data for a specific address
   */
  async getPropertyIntelligence(address: string): Promise<{
    aerial?: any;
    roofData?: any;
    damageAssessment?: DamageAssessment;
    coordinates?: { lat: number; lng: number };
  }> {
    try {
      console.log(`🏠 Getting property intelligence for: ${address}`);
      
      // Geocode address to get coordinates
      const geocoded = await this.geocoding.geocode(address);
      if (!geocoded || geocoded.length === 0) {
        console.log('⚠️ Could not geocode address');
        return {};
      }
      
      const coords = geocoded[0];
      const propertyLocation: PropertyLocation = {
        address,
        latitude: coords.lat,
        longitude: coords.lng,
      };
      
      // Get aerial imagery from EagleView
      const aerial = await this.eagleView.getAerialImagery(propertyLocation);
      
      // Get roof measurements
      const roofData = await this.eagleView.getRoofMeasurements(propertyLocation);
      
      // Get damage assessment if available
      const damageAssessment = await this.eagleView.getDamageAssessment(propertyLocation);
      
      return {
        aerial,
        roofData,
        damageAssessment,
        coordinates: { lat: coords.lat, lng: coords.lng },
      };
      
    } catch (error) {
      console.error('❌ Error getting property intelligence:', error);
      return {};
    }
  }
  
  /**
   * Group opportunities by deployment zones (State → City → ZIP)
   */
  groupByDeploymentZones(opportunities: StreetLevelDamageOpportunity[]): DeploymentZone[] {
    const zones = new Map<string, DeploymentZone>();
    
    for (const opp of opportunities) {
      const zoneKey = `${opp.location.state}-${opp.location.city}`;
      
      if (!zones.has(zoneKey)) {
        zones.set(zoneKey, {
          state: opp.location.state,
          city: opp.location.city,
          zipCodes: [],
          totalOpportunities: 0,
          totalEstimatedRevenue: 0,
          averageSeverity: 0,
          opportunities: [],
        });
      }
      
      const zone = zones.get(zoneKey)!;
      zone.opportunities.push(opp);
      zone.totalOpportunities++;
      zone.totalEstimatedRevenue += (opp.damage.estimatedCost.min + opp.damage.estimatedCost.max) / 2;
      
      if (!zone.zipCodes.includes(opp.location.zip)) {
        zone.zipCodes.push(opp.location.zip);
      }
    }
    
    // Calculate average severity for each zone
    for (const zone of zones.values()) {
      const severityMap = { minor: 1, moderate: 2, severe: 3, catastrophic: 4 };
      const totalSeverity = zone.opportunities.reduce(
        (sum, opp) => sum + severityMap[opp.damage.severity],
        0
      );
      zone.averageSeverity = totalSeverity / zone.opportunities.length;
    }
    
    return Array.from(zones.values()).sort(
      (a, b) => b.totalEstimatedRevenue - a.totalEstimatedRevenue
    );
  }
  
  /**
   * Search for damage opportunities using satellite data
   */
  async scanAreaForDamage(
    state: string,
    city?: string,
    bounds?: { north: number; south: number; east: number; west: number }
  ): Promise<StreetLevelDamageOpportunity[]> {
    try {
      console.log(`🛰️ Scanning for damage in ${city ? city + ', ' : ''}${state}`);
      
      const opportunities: StreetLevelDamageOpportunity[] = [];
      
      // Check NASA FIRMS for wildfire/thermal anomalies
      const wildfires = await nasaFirmsService.getActiveWildfires();
      
      // TODO: Add integration with other satellite imagery sources
      // - NOAA GOES satellite imagery
      // - Sentinel Hub
      // - Planet Labs (if available)
      
      console.log(`✅ Found ${opportunities.length} damage opportunities in area scan`);
      return opportunities;
      
    } catch (error) {
      console.error('❌ Error scanning area for damage:', error);
      return [];
    }
  }
  
  private calculateResponseTime(urgency: string): string {
    switch (urgency) {
      case 'emergency':
        return '< 2 hours';
      case 'high':
        return '2-6 hours';
      case 'normal':
        return '6-24 hours';
      default:
        return '24-48 hours';
    }
  }
  
  private mapImagerySource(source: string): 'eagleview' | 'nasa_firms' | 'traffic_cam' | 'satellite' {
    if (source === 'aerial') return 'eagleview';
    if (source === 'satellite') return 'nasa_firms';
    return 'traffic_cam';
  }
}

export const deploymentIntelligence = new DeploymentIntelligenceService();
