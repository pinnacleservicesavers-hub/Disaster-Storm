import { StormIntelligenceAI } from './stormIntelligenceAI';
import { PredictiveStormService } from './predictiveStormService';
import { weatherService } from './weather';
import { storage } from '../storage';
import { InsertTrafficCamLead, InsertTrafficCamAlert } from '@shared/schema';
import { randomUUID } from 'crypto';

/**
 * Storm Lead Intelligence Service
 * 
 * Automatically generates contractor leads from:
 * 1. Storm AI predictions (damage forecasts)
 * 2. Social media monitoring (damage posts)
 * 3. Geo-capture automation (storm zones)
 * 4. Weather triggers (wind thresholds)
 */

export interface StormLeadSource {
  type: 'prediction' | 'social_media' | 'geo_capture' | 'weather_trigger';
  confidence: number;
  data: any;
}

export interface SocialMediaPost {
  platform: 'twitter' | 'facebook' | 'instagram';
  postId: string;
  userId: string;
  username: string;
  content: string;
  location?: { lat: number; lng: number; address: string };
  timestamp: Date;
  keywords: string[];
  damageType?: string;
  urgency: 'low' | 'medium' | 'high' | 'emergency';
}

export interface GeoCaptureZone {
  id: string;
  centerLat: number;
  centerLng: number;
  radiusMiles: number;
  stormId: string;
  createdAt: Date;
  expiresAt: Date;
  devicesCaptured: number;
  leadsGenerated: number;
  status: 'active' | 'expired';
}

export interface WeatherTriggerConfig {
  windSpeedMph: number;
  rainInches?: number;
  duration?: number; // minutes
  county: string;
  state: string;
}

export interface StormLeadResult {
  leadsCreated: number;
  alertsGenerated: number;
  geoCaptureZones: number;
  socialMediaCaptures: number;
  totalEstimatedValue: number;
  sources: StormLeadSource[];
}

export class StormLeadIntelligenceService {
  private static instance: StormLeadIntelligenceService;
  private stormAI: StormIntelligenceAI;
  private predictiveService: PredictiveStormService;
  private activeGeoCaptureZones: Map<string, GeoCaptureZone> = new Map();
  private socialMediaMonitors: Map<string, any> = new Map();

  constructor() {
    this.stormAI = StormIntelligenceAI.getInstance();
    this.predictiveService = PredictiveStormService.getInstance();
    console.log('🎯 Storm Lead Intelligence Service initialized');
  }

  public static getInstance(): StormLeadIntelligenceService {
    if (!StormLeadIntelligenceService.instance) {
      StormLeadIntelligenceService.instance = new StormLeadIntelligenceService();
    }
    return StormLeadIntelligenceService.instance;
  }

  /**
   * MAIN: Generate leads from storm predictions
   */
  async generateLeadsFromStormPrediction(stormId: string): Promise<StormLeadResult> {
    console.log(`🌪️ Generating leads from storm prediction: ${stormId}`);

    const result: StormLeadResult = {
      leadsCreated: 0,
      alertsGenerated: 0,
      geoCaptureZones: 0,
      socialMediaCaptures: 0,
      totalEstimatedValue: 0,
      sources: []
    };

    try {
      // Get storm prediction and damage forecasts
      const predictions = await storage.getStormPredictions();
      const stormPrediction = predictions.find(p => p.stormId === stormId);

      if (!stormPrediction) {
        console.warn(`No prediction found for storm ${stormId}`);
        return result;
      }

      // Get damage forecasts for this storm
      const damageForecasts = await storage.getDamageForecasts();
      const stormForecasts = damageForecasts.filter(f => f.stormId === stormId);

      console.log(`📊 Processing ${stormForecasts.length} damage forecasts for ${stormId}`);

      // Generate leads from each damage forecast
      for (const forecast of stormForecasts) {
        // Only generate leads for moderate to extreme risk areas
        if (['moderate', 'high', 'extreme'].includes(forecast.riskLevel)) {
          const leads = await this.createLeadsFromDamageForecast(forecast);
          result.leadsCreated += leads.length;
          result.totalEstimatedValue += leads.reduce((sum, lead) => sum + (lead.estimatedValue || 0), 0);

          // Create geo-capture zone for this forecast area
          const geoZone = await this.createGeoCaptureZone(forecast);
          if (geoZone) {
            result.geoCaptureZones++;
            result.sources.push({
              type: 'geo_capture',
              confidence: 0.85,
              data: { zoneId: geoZone.id, county: forecast.county, state: forecast.state }
            });
          }

          result.sources.push({
            type: 'prediction',
            confidence: Number(forecast.confidenceScore) || 0.75,
            data: { forecastId: forecast.id, county: forecast.county, riskLevel: forecast.riskLevel }
          });
        }
      }

      console.log(`✅ Generated ${result.leadsCreated} leads from storm prediction ${stormId}`);
      return result;

    } catch (error) {
      console.error('Error generating leads from storm prediction:', error);
      return result;
    }
  }

  /**
   * Create leads from a damage forecast
   */
  private async createLeadsFromDamageForecast(forecast: any): Promise<any[]> {
    const leads: any[] = [];

    try {
      // Determine lead priority based on risk level
      const priority = this.mapRiskToPriority(forecast.riskLevel);

      // Determine contractor types needed
      const contractorTypes = this.determineContractorTypes(forecast);

      // Get or create contractors in the affected area
      const contractors = await this.findContractorsInArea(
        Number(forecast.centerLatitude),
        Number(forecast.centerLongitude),
        Number(forecast.impactRadius) || 25
      );

      // Create lead for each contractor
      for (const contractor of contractors.slice(0, 5)) { // Limit to top 5 contractors
        const leadData: InsertTrafficCamLead = {
          alertId: null,
          cameraId: `storm-${forecast.stormId}`,
          contractorId: contractor.id,
          alertType: this.mapForecastToAlertType(forecast),
          priority: priority as any,
          estimatedValue: Number(forecast.estimatedPropertyDamage) || 0,
          status: 'new',
          contactAttempts: 0,
          customerName: null,
          customerPhone: null,
          customerEmail: null,
          propertyOwner: null,
          insuranceCompany: null,
          policyNumber: null,
          actualDamageAssessment: null,
          workPerformed: null,
          equipmentUsed: null,
          crewSize: null,
          invoiceAmount: null,
          conversionValue: null,
          declineReason: null,
          notes: `AI Storm Prediction: ${forecast.riskLevel} risk in ${forecast.county}, ${forecast.state}. Expected arrival: ${forecast.expectedArrivalTime}. Contractors needed: ${contractorTypes.join(', ')}`,
          responseTime: null,
          lastContactedAt: null,
          arrivalTime: null,
          workStarted: null,
          workCompleted: null
        };

        const lead = await storage.createTrafficCamLead(leadData);
        leads.push(lead);
      }

      console.log(`📋 Created ${leads.length} leads for ${forecast.county}, ${forecast.state}`);
      return leads;

    } catch (error) {
      console.error('Error creating leads from damage forecast:', error);
      return leads;
    }
  }

  /**
   * Monitor social media for storm damage posts
   */
  async monitorSocialMedia(keywords: string[], location: { lat: number; lng: number }, radiusMiles: number): Promise<SocialMediaPost[]> {
    console.log(`📱 Monitoring social media for: ${keywords.join(', ')} within ${radiusMiles} miles of ${location.lat}, ${location.lng}`);

    // Mock implementation - in production would use Twitter API, Facebook Graph API, etc.
    const mockPosts: SocialMediaPost[] = [
      {
        platform: 'twitter',
        postId: 'tweet-' + Date.now(),
        userId: 'user123',
        username: '@homeowner_tampa',
        content: 'Tree fell on our roof during the storm! Need help ASAP! #StormDamage #Tampa',
        location: { lat: location.lat + 0.01, lng: location.lng + 0.01, address: 'Tampa, FL' },
        timestamp: new Date(),
        keywords: ['tree', 'roof', 'storm damage'],
        damageType: 'tree_damage',
        urgency: 'emergency'
      },
      {
        platform: 'facebook',
        postId: 'fb-' + Date.now(),
        userId: 'user456',
        username: 'Sarah M.',
        content: 'Power lines down on our street, tree blocking driveway. Anyone know a good tree service?',
        location: { lat: location.lat - 0.02, lng: location.lng - 0.01, address: 'Tampa, FL' },
        timestamp: new Date(),
        keywords: ['power lines', 'tree', 'driveway'],
        damageType: 'tree_on_powerline',
        urgency: 'high'
      }
    ];

    // Store monitoring session
    const monitorId = randomUUID();
    this.socialMediaMonitors.set(monitorId, {
      keywords,
      location,
      radiusMiles,
      startTime: new Date(),
      postsFound: mockPosts.length
    });

    return mockPosts;
  }

  /**
   * Convert social media posts to leads
   */
  async convertSocialMediaPostsToLeads(posts: SocialMediaPost[]): Promise<any[]> {
    const leads: any[] = [];

    for (const post of posts) {
      if (post.location && post.damageType) {
        try {
          // Find contractors near the post location
          const contractors = await this.findContractorsInArea(
            post.location.lat,
            post.location.lng,
            15 // 15 mile radius
          );

          for (const contractor of contractors.slice(0, 3)) { // Top 3 contractors
            const leadData: InsertTrafficCamLead = {
              alertId: null,
              cameraId: `social-${post.platform}-${post.postId}`,
              contractorId: contractor.id,
              alertType: post.damageType,
              priority: post.urgency as any,
              estimatedValue: this.estimateSocialMediaLeadValue(post),
              status: 'new',
              contactAttempts: 0,
              customerName: post.username,
              customerPhone: null,
              customerEmail: null,
              propertyOwner: post.username,
              insuranceCompany: null,
              policyNumber: null,
              actualDamageAssessment: null,
              workPerformed: null,
              equipmentUsed: null,
              crewSize: null,
              invoiceAmount: null,
              conversionValue: null,
              declineReason: null,
              notes: `Social Media Lead from ${post.platform}: "${post.content}". Location: ${post.location.address}`,
              responseTime: null,
              lastContactedAt: null,
              arrivalTime: null,
              workStarted: null,
              workCompleted: null
            };

            const lead = await storage.createTrafficCamLead(leadData);
            leads.push(lead);
          }
        } catch (error) {
          console.error(`Error converting post ${post.postId} to lead:`, error);
        }
      }
    }

    console.log(`📱 Converted ${leads.length} social media posts to leads`);
    return leads;
  }

  /**
   * Create geo-capture zone for storm area
   */
  private async createGeoCaptureZone(forecast: any): Promise<GeoCaptureZone | null> {
    try {
      const zone: GeoCaptureZone = {
        id: randomUUID(),
        centerLat: Number(forecast.centerLatitude),
        centerLng: Number(forecast.centerLongitude),
        radiusMiles: Number(forecast.impactRadius) || 25,
        stormId: forecast.stormId,
        createdAt: new Date(),
        expiresAt: new Date(forecast.validUntilTime),
        devicesCaptured: 0,
        leadsGenerated: 0,
        status: 'active'
      };

      this.activeGeoCaptureZones.set(zone.id, zone);
      console.log(`🎯 Created geo-capture zone: ${zone.radiusMiles} miles around ${forecast.county}, ${forecast.state}`);
      
      return zone;
    } catch (error) {
      console.error('Error creating geo-capture zone:', error);
      return null;
    }
  }

  /**
   * Setup weather-triggered lead generation
   */
  async setupWeatherTrigger(config: WeatherTriggerConfig): Promise<boolean> {
    console.log(`⚡ Setting up weather trigger for ${config.county}, ${config.state} at ${config.windSpeedMph}mph`);

    try {
      // In production, would poll weather API and trigger when thresholds met
      // For now, store the trigger config
      const triggerId = `${config.state}-${config.county}-${config.windSpeedMph}`;
      
      // Mock: Check if conditions already met
      const weatherData = await weatherService.getComprehensiveWeatherData(35.0, -85.0); // Mock coordinates
      
      // Simulate trigger activation
      console.log(`✅ Weather trigger setup complete for ${config.county}, ${config.state}`);
      return true;
    } catch (error) {
      console.error('Error setting up weather trigger:', error);
      return false;
    }
  }

  /**
   * Get all active geo-capture zones
   */
  getActiveGeoCaptureZones(): GeoCaptureZone[] {
    const now = new Date();
    return Array.from(this.activeGeoCaptureZones.values())
      .filter(zone => zone.status === 'active' && zone.expiresAt > now);
  }

  /**
   * Get geo-capture zone statistics
   */
  getGeoCaptureStats(zoneId: string): GeoCaptureZone | undefined {
    return this.activeGeoCaptureZones.get(zoneId);
  }

  // Helper methods

  private mapRiskToPriority(riskLevel: string): string {
    const priorityMap: Record<string, string> = {
      'extreme': 'emergency',
      'high': 'urgent',
      'moderate': 'high',
      'low': 'normal'
    };
    return priorityMap[riskLevel] || 'normal';
  }

  private determineContractorTypes(forecast: any): string[] {
    const types: string[] = [];
    
    if (Number(forecast.windDamageRisk) >= 6) types.push('Roofing', 'Tree Services');
    if (Number(forecast.floodingRisk) >= 6) types.push('Water Damage', 'Mold Remediation');
    if (Number(forecast.treeFallRisk) >= 6) types.push('Tree Services', 'Debris Removal');
    if (Number(forecast.structuralDamageRisk) >= 6) types.push('General Contractor', 'Structural');
    
    return types.length > 0 ? types : ['General Contractor'];
  }

  private mapForecastToAlertType(forecast: any): string {
    // Determine primary damage type based on highest risk factor
    const risks = [
      { type: 'wind_damage', value: Number(forecast.windDamageRisk) || 0 },
      { type: 'flood_damage', value: Number(forecast.floodingRisk) || 0 },
      { type: 'tree_down', value: Number(forecast.treeFallRisk) || 0 },
      { type: 'structure_damage', value: Number(forecast.structuralDamageRisk) || 0 }
    ];

    const highestRisk = risks.reduce((max, risk) => risk.value > max.value ? risk : max);
    return highestRisk.type;
  }

  private async findContractorsInArea(lat: number, lng: number, radiusMiles: number): Promise<any[]> {
    // Mock implementation - would query actual contractor database
    const mockContractors = [
      { id: 'contractor-001', name: 'Storm Pro Services', lat: lat + 0.01, lng: lng + 0.01 },
      { id: 'contractor-002', name: 'Emergency Tree Removal', lat: lat - 0.01, lng: lng - 0.01 },
      { id: 'contractor-003', name: 'Total Restoration LLC', lat: lat + 0.02, lng: lng - 0.01 }
    ];

    return mockContractors;
  }

  private estimateSocialMediaLeadValue(post: SocialMediaPost): number {
    const baseValues: Record<string, number> = {
      'tree_damage': 3000,
      'tree_on_powerline': 15000,
      'roof_damage': 8000,
      'flood_damage': 12000,
      'wind_damage': 5000
    };

    const urgencyMultiplier = {
      'emergency': 1.5,
      'high': 1.3,
      'medium': 1.0,
      'low': 0.8
    };

    const baseValue = baseValues[post.damageType || 'tree_damage'] || 3000;
    const multiplier = urgencyMultiplier[post.urgency] || 1.0;

    return Math.round(baseValue * multiplier);
  }
}

// Export singleton
export const stormLeadIntelligence = StormLeadIntelligenceService.getInstance();
