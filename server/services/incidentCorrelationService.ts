import { TrafficIncident, UnifiedCamera, Unified511Directory } from './unified511Directory';
import { DamageDetectionService, DamageAnalysisResult } from './damageDetection';
import { NotificationService, AlertNotification } from './notificationService';
import { ContractorWatchlist } from '@shared/schema';
import { randomUUID } from 'crypto';

export interface ContractorOpportunity {
  id: string;
  incidentId?: string;
  cameraId?: string;
  opportunityType: 'traffic_incident' | 'damage_detection' | 'combined';
  
  // Location Information
  location: {
    address?: string;
    lat: number;
    lng: number;
    state: string;
    county?: string;
  };
  
  // Incident Details
  incidentTypes: string[]; // tree_down, debris, structure_damage, etc.
  severity: 'minor' | 'moderate' | 'severe' | 'critical';
  urgencyLevel: 'low' | 'normal' | 'high' | 'emergency';
  
  // Business Information
  estimatedValue: {
    min: number;
    max: number;
    currency: 'USD';
  };
  contractorTypes: string[]; // tree_service, debris_removal, emergency_repair
  workScope: string[];
  equipmentNeeded: string[];
  
  // Timing
  detectedAt: Date;
  estimatedResponseTime: number; // minutes
  estimatedWorkDuration: number; // hours
  expiresAt?: Date;
  
  // Evidence
  imageUrl?: string;
  videoUrl?: string;
  damageAssessment?: string;
  safetyHazards: string[];
  
  // Source Information
  sourceIncident?: TrafficIncident;
  sourceDamageDetection?: DamageAnalysisResult;
  confidence: number; // 0-100 percentage
  
  metadata: Record<string, any>;
}

export class IncidentCorrelationService {
  private directory511: Unified511Directory;
  private damageDetection: DamageDetectionService;
  private notificationService: NotificationService;
  private opportunities = new Map<string, ContractorOpportunity>();
  private correlationCache = new Map<string, Date>(); // Prevent duplicate correlation
  
  constructor(
    directory511: Unified511Directory,
    damageDetection: DamageDetectionService,
    notificationService: NotificationService
  ) {
    this.directory511 = directory511;
    this.damageDetection = damageDetection;
    this.notificationService = notificationService;
    
    console.log('🔗 IncidentCorrelationService initialized');
  }

  /**
   * Correlate 511 traffic incidents with contractor opportunities
   */
  async correlateTrafficIncidents(state: string): Promise<ContractorOpportunity[]> {
    try {
      console.log(`🚦 Correlating traffic incidents for state: ${state}`);
      
      const incidents = await this.directory511.getIncidentsByState(state);
      const opportunities: ContractorOpportunity[] = [];
      
      for (const incident of incidents) {
        // Check if this incident is relevant for contractors
        if (!incident.isContractorOpportunity) {
          continue;
        }

        // Avoid duplicate processing
        const cacheKey = `incident_${incident.id}`;
        if (this.correlationCache.has(cacheKey)) {
          const lastProcessed = this.correlationCache.get(cacheKey)!;
          if (Date.now() - lastProcessed.getTime() < 5 * 60 * 1000) { // 5 minutes
            continue;
          }
        }

        const opportunity = await this.createOpportunityFromIncident(incident);
        if (opportunity) {
          opportunities.push(opportunity);
          this.opportunities.set(opportunity.id, opportunity);
          this.correlationCache.set(cacheKey, new Date());
        }
      }
      
      console.log(`✅ Correlated ${opportunities.length} contractor opportunities from traffic incidents`);
      return opportunities;
    } catch (error) {
      console.error('❌ Traffic incident correlation failed:', error);
      return [];
    }
  }

  /**
   * Correlate camera damage detection with contractor opportunities
   */
  async correlateCameraDamage(cameraId: string, imageBuffer: Buffer, cameraLocation?: string): Promise<ContractorOpportunity[]> {
    try {
      console.log(`📹 Correlating camera damage for camera: ${cameraId}`);
      
      // Analyze image for damage
      const damageResult = await this.damageDetection.analyzeImageForDamage(imageBuffer, cameraLocation);
      
      if (!damageResult.hasDetection || damageResult.detections.length === 0) {
        return [];
      }

      const opportunities: ContractorOpportunity[] = [];
      
      for (const detection of damageResult.detections) {
        // Avoid duplicate processing
        const cacheKey = `camera_${cameraId}_${detection.alertType}_${Date.now()}`;
        
        const opportunity = await this.createOpportunityFromDamage(cameraId, detection, damageResult, cameraLocation);
        if (opportunity) {
          opportunities.push(opportunity);
          this.opportunities.set(opportunity.id, opportunity);
          this.correlationCache.set(cacheKey, new Date());
        }
      }
      
      console.log(`✅ Correlated ${opportunities.length} contractor opportunities from camera damage detection`);
      return opportunities;
    } catch (error) {
      console.error('❌ Camera damage correlation failed:', error);
      return [];
    }
  }

  /**
   * Match opportunities against contractor watchlists and dispatch alerts
   */
  async dispatchOpportunityAlerts(
    opportunities: ContractorOpportunity[], 
    watchlistItems: ContractorWatchlist[]
  ): Promise<void> {
    for (const opportunity of opportunities) {
      const alert = this.convertOpportunityToAlert(opportunity);
      
      // Filter watchlist items that match this opportunity's location and preferences
      const matchingWatchlist = this.findMatchingWatchlistItems(opportunity, watchlistItems);
      
      if (matchingWatchlist.length > 0) {
        console.log(`🔔 Dispatching alert for opportunity ${opportunity.id} to ${matchingWatchlist.length} contractors`);
        await this.notificationService.dispatchAlert(alert, matchingWatchlist);
      }
    }
  }

  private async createOpportunityFromIncident(incident: TrafficIncident): Promise<ContractorOpportunity | null> {
    try {
      // Map incident types to contractor opportunity data
      const incidentTypeMapping = this.getIncidentTypeMapping(incident.type);
      
      if (!incidentTypeMapping) {
        return null; // Not a contractor opportunity
      }

      const opportunity: ContractorOpportunity = {
        id: randomUUID(),
        incidentId: incident.id,
        opportunityType: 'traffic_incident',
        
        location: {
          address: incident.description,
          lat: incident.lat,
          lng: incident.lng,
          state: incident.jurisdiction.state,
          county: incident.jurisdiction.county
        },
        
        incidentTypes: [incident.type],
        severity: incident.severity,
        urgencyLevel: this.mapSeverityToUrgency(incident.severity),
        
        estimatedValue: incidentTypeMapping.estimatedValue,
        contractorTypes: incidentTypeMapping.contractorTypes,
        workScope: incidentTypeMapping.workScope,
        equipmentNeeded: incidentTypeMapping.equipmentNeeded,
        
        detectedAt: incident.startTime,
        estimatedResponseTime: incidentTypeMapping.responseTime,
        estimatedWorkDuration: incidentTypeMapping.workDuration,
        expiresAt: incident.estimatedClearTime,
        
        safetyHazards: incidentTypeMapping.safetyHazards,
        sourceIncident: incident,
        confidence: 85, // High confidence for verified 511 incidents
        
        metadata: {
          source: '511_incident',
          jurisdiction: incident.jurisdiction,
          affectedRoutes: incident.affectedRoutes
        }
      };

      return opportunity;
    } catch (error) {
      console.error('Error creating opportunity from incident:', error);
      return null;
    }
  }

  private async createOpportunityFromDamage(
    cameraId: string, 
    detection: any, 
    damageResult: DamageAnalysisResult,
    cameraLocation?: string
  ): Promise<ContractorOpportunity | null> {
    try {
      // Map damage detection to contractor opportunity data
      const damageTypeMapping = this.getDamageTypeMapping(detection.alertType);
      
      if (!damageTypeMapping) {
        return null;
      }

      // Estimate location based on camera (simplified - in production you'd geocode the camera)
      const location = {
        address: cameraLocation || 'Traffic camera location',
        lat: 33.7490, // Default Atlanta coordinates for demo
        lng: -84.3880,
        state: 'GA',
        county: 'Fulton'
      };

      const opportunity: ContractorOpportunity = {
        id: randomUUID(),
        cameraId,
        opportunityType: 'damage_detection',
        
        location,
        
        incidentTypes: [detection.alertType],
        severity: detection.severity,
        urgencyLevel: detection.urgencyLevel,
        
        estimatedValue: detection.estimatedCost || damageTypeMapping.estimatedValue,
        contractorTypes: detection.contractorTypes || damageTypeMapping.contractorTypes,
        workScope: detection.workScope || damageTypeMapping.workScope,
        equipmentNeeded: detection.equipmentNeeded || damageTypeMapping.equipmentNeeded,
        
        detectedAt: damageResult.analysisTimestamp,
        estimatedResponseTime: damageTypeMapping.responseTime,
        estimatedWorkDuration: damageTypeMapping.workDuration,
        
        damageAssessment: detection.description,
        safetyHazards: detection.safetyHazards || damageTypeMapping.safetyHazards,
        
        sourceDamageDetection: damageResult,
        confidence: detection.confidence,
        
        metadata: {
          source: 'ai_damage_detection',
          cameraId,
          analysisTimestamp: damageResult.analysisTimestamp,
          processingTimeMs: damageResult.processingTimeMs
        }
      };

      return opportunity;
    } catch (error) {
      console.error('Error creating opportunity from damage detection:', error);
      return null;
    }
  }

  private getIncidentTypeMapping(incidentType: string) {
    const mappings: Record<string, any> = {
      'tree_down': {
        estimatedValue: { min: 500, max: 3000, currency: 'USD' },
        contractorTypes: ['tree_service', 'emergency_cleanup'],
        workScope: ['tree_removal', 'debris_cleanup', 'road_clearing'],
        equipmentNeeded: ['chainsaw', 'wood_chipper', 'crane_truck'],
        safetyHazards: ['falling_branches', 'power_lines'],
        responseTime: 30, // minutes
        workDuration: 4 // hours
      },
      'road_blocked': {
        estimatedValue: { min: 200, max: 1500, currency: 'USD' },
        contractorTypes: ['debris_removal', 'emergency_cleanup'],
        workScope: ['debris_removal', 'road_clearing'],
        equipmentNeeded: ['dump_truck', 'loader'],
        safetyHazards: ['traffic_hazard'],
        responseTime: 20,
        workDuration: 2
      },
      'debris': {
        estimatedValue: { min: 300, max: 2000, currency: 'USD' },
        contractorTypes: ['debris_removal', 'cleanup_service'],
        workScope: ['debris_cleanup', 'site_restoration'],
        equipmentNeeded: ['dump_truck', 'loader', 'hand_tools'],
        safetyHazards: ['sharp_objects', 'unstable_debris'],
        responseTime: 45,
        workDuration: 3
      },
      'power_lines_down': {
        estimatedValue: { min: 1000, max: 8000, currency: 'USD' },
        contractorTypes: ['electrical_contractor', 'emergency_repair'],
        workScope: ['power_line_repair', 'emergency_restoration'],
        equipmentNeeded: ['bucket_truck', 'electrical_tools'],
        safetyHazards: ['electrical_hazard', 'live_wires'],
        responseTime: 15, // Emergency response
        workDuration: 6
      },
      'flooding': {
        estimatedValue: { min: 800, max: 5000, currency: 'USD' },
        contractorTypes: ['water_damage_restoration', 'emergency_pump'],
        workScope: ['water_removal', 'emergency_pumping', 'drying'],
        equipmentNeeded: ['pumps', 'dehumidifiers', 'extraction_equipment'],
        safetyHazards: ['contaminated_water', 'electrical_hazard'],
        responseTime: 30,
        workDuration: 8
      }
    };

    return mappings[incidentType] || null;
  }

  private getDamageTypeMapping(damageType: string) {
    const mappings: Record<string, any> = {
      'structure_damage': {
        estimatedValue: { min: 2000, max: 15000, currency: 'USD' },
        contractorTypes: ['general_contractor', 'emergency_repair'],
        workScope: ['structural_repair', 'emergency_stabilization'],
        equipmentNeeded: ['scaffolding', 'construction_tools'],
        safetyHazards: ['structural_instability', 'falling_debris'],
        responseTime: 60,
        workDuration: 12
      },
      'tree_on_powerline': {
        estimatedValue: { min: 1500, max: 8000, currency: 'USD' },
        contractorTypes: ['tree_service', 'electrical_contractor'],
        workScope: ['tree_removal', 'power_line_clearing'],
        equipmentNeeded: ['bucket_truck', 'chainsaw', 'crane'],
        safetyHazards: ['electrical_hazard', 'falling_branches'],
        responseTime: 15, // Emergency
        workDuration: 6
      },
      'tree_blocking_road': {
        estimatedValue: { min: 400, max: 2500, currency: 'USD' },
        contractorTypes: ['tree_service', 'emergency_cleanup'],
        workScope: ['tree_removal', 'road_clearing'],
        equipmentNeeded: ['chainsaw', 'wood_chipper', 'dump_truck'],
        safetyHazards: ['traffic_hazard', 'falling_branches'],
        responseTime: 30,
        workDuration: 3
      },
      'tree_on_vehicle': {
        estimatedValue: { min: 800, max: 4000, currency: 'USD' },
        contractorTypes: ['tree_service', 'towing_service'],
        workScope: ['tree_removal', 'vehicle_extraction'],
        equipmentNeeded: ['crane', 'chainsaw', 'tow_truck'],
        safetyHazards: ['vehicle_damage', 'fuel_leak'],
        responseTime: 25,
        workDuration: 4
      },
      'debris_blockage': {
        estimatedValue: { min: 300, max: 1800, currency: 'USD' },
        contractorTypes: ['debris_removal', 'cleanup_service'],
        workScope: ['debris_removal', 'site_cleanup'],
        equipmentNeeded: ['loader', 'dump_truck'],
        safetyHazards: ['sharp_objects', 'unstable_pile'],
        responseTime: 40,
        workDuration: 2
      },
      'flood_damage': {
        estimatedValue: { min: 1000, max: 10000, currency: 'USD' },
        contractorTypes: ['water_damage_restoration', 'emergency_repair'],
        workScope: ['water_extraction', 'structural_drying', 'damage_assessment'],
        equipmentNeeded: ['pumps', 'dehumidifiers', 'moisture_meters'],
        safetyHazards: ['contaminated_water', 'mold_risk'],
        responseTime: 45,
        workDuration: 16
      }
    };

    return mappings[damageType] || null;
  }

  private mapSeverityToUrgency(severity: string): 'low' | 'normal' | 'high' | 'emergency' {
    const mapping: Record<string, 'low' | 'normal' | 'high' | 'emergency'> = {
      'minor': 'low',
      'moderate': 'normal',
      'severe': 'high',
      'critical': 'emergency'
    };
    
    return mapping[severity] || 'normal';
  }

  private convertOpportunityToAlert(opportunity: ContractorOpportunity): AlertNotification {
    return {
      id: opportunity.id,
      type: 'contractor_opportunity',
      severity: opportunity.severity,
      title: this.generateAlertTitle(opportunity),
      description: this.generateAlertDescription(opportunity),
      location: opportunity.location,
      cameraId: opportunity.cameraId,
      alertTypes: opportunity.incidentTypes,
      urgencyLevel: opportunity.urgencyLevel,
      estimatedValue: opportunity.estimatedValue,
      contractorTypes: opportunity.contractorTypes,
      imageUrl: opportunity.imageUrl,
      videoUrl: opportunity.videoUrl,
      expiresAt: opportunity.expiresAt,
      createdAt: opportunity.detectedAt,
      metadata: opportunity.metadata
    };
  }

  private generateAlertTitle(opportunity: ContractorOpportunity): string {
    const typeMap: Record<string, string> = {
      'tree_down': 'Tree Down - Emergency Removal Needed',
      'tree_on_powerline': 'Tree on Power Line - URGENT',
      'tree_blocking_road': 'Tree Blocking Road',
      'tree_on_vehicle': 'Tree on Vehicle - Extraction Required',
      'structure_damage': 'Structure Damage - Repair Needed',
      'debris_blockage': 'Debris Cleanup Required',
      'flood_damage': 'Flood Damage - Restoration Services',
      'power_lines_down': 'Power Lines Down - Emergency Response',
      'road_blocked': 'Road Blocked - Clearing Required',
      'debris': 'Debris Cleanup Opportunity',
      'flooding': 'Flood Response Required'
    };

    const primaryType = opportunity.incidentTypes[0];
    return typeMap[primaryType] || `${primaryType.replace(/_/g, ' ').toUpperCase()} - Contractor Needed`;
  }

  private generateAlertDescription(opportunity: ContractorOpportunity): string {
    const location = opportunity.location.address || `${opportunity.location.lat.toFixed(4)}, ${opportunity.location.lng.toFixed(4)}`;
    const value = `$${opportunity.estimatedValue.min.toLocaleString()}-$${opportunity.estimatedValue.max.toLocaleString()}`;
    const types = opportunity.contractorTypes.join(', ');
    
    let description = `${opportunity.damageAssessment || 'Contractor opportunity detected'} at ${location}. `;
    description += `Estimated value: ${value}. `;
    description += `Contractor types needed: ${types}. `;
    description += `Estimated response time: ${opportunity.estimatedResponseTime} minutes. `;
    
    if (opportunity.safetyHazards.length > 0) {
      description += `Safety hazards: ${opportunity.safetyHazards.join(', ')}.`;
    }

    return description;
  }

  private findMatchingWatchlistItems(
    opportunity: ContractorOpportunity, 
    watchlistItems: ContractorWatchlist[]
  ): ContractorWatchlist[] {
    return watchlistItems.filter(watchlist => {
      // Check if watchlist covers this opportunity's location
      const stateMatch = watchlist.state === opportunity.location.state;
      const countyMatch = !watchlist.county || watchlist.county === opportunity.location.county;
      
      return stateMatch && countyMatch;
    });
  }

  /**
   * Get all current contractor opportunities
   */
  getAllOpportunities(): ContractorOpportunity[] {
    return Array.from(this.opportunities.values());
  }

  /**
   * Get opportunities by state
   */
  getOpportunitiesByState(state: string): ContractorOpportunity[] {
    return Array.from(this.opportunities.values())
      .filter(opp => opp.location.state === state);
  }

  /**
   * Clear expired opportunities
   */
  cleanupExpiredOpportunities(): number {
    const now = new Date();
    let cleaned = 0;
    
    for (const [id, opportunity] of this.opportunities) {
      if (opportunity.expiresAt && opportunity.expiresAt < now) {
        this.opportunities.delete(id);
        cleaned++;
      }
    }
    
    // Also cleanup correlation cache older than 1 hour
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
    for (const [key, timestamp] of this.correlationCache) {
      if (timestamp < hourAgo) {
        this.correlationCache.delete(key);
      }
    }
    
    return cleaned;
  }
}