import { DamageAnalysisResult, DamageDetection } from './damageDetection.js';
import { storage } from '../storage.js';
import { InsertTrafficCamAlert, InsertTrafficCamLead, TrafficCamAlert, TrafficCamLead, ContractorWatchlist } from '@shared/schema';
import { NotificationService, AlertNotification } from './notificationService.js';
import { randomUUID } from 'crypto';

export interface LeadGenerationResult {
  alertsGenerated: number;
  leadsGenerated: number;
  contractorsNotified: number;
  totalPotentialValue: number;
  highPriorityAlerts: TrafficCamAlert[];
  generatedLeads: TrafficCamLead[];
  processingTimeMs: number;
}

export interface ContractorMatch {
  contractorId: string;
  distanceKm: number;
  specializations: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimatedValue: number;
  competitionLevel: 'low' | 'medium' | 'high';
}

export class LeadGenerationService {
  private notificationService: NotificationService;

  constructor(notificationService: NotificationService) {
    this.notificationService = notificationService;
    console.log('💼 LeadGenerationService initialized');
  }

  /**
   * Process damage analysis results and generate contractor leads
   */
  async processDamageAnalysis(
    cameraId: string,
    externalCameraId: string,
    analysisResult: DamageAnalysisResult,
    cameraLocation: { lat: number; lng: number; address?: string }
  ): Promise<LeadGenerationResult> {
    const startTime = Date.now();

    try {
      console.log(`💼 Processing damage analysis for camera ${externalCameraId}: ${analysisResult.detections.length} detections`);

      const alerts: TrafficCamAlert[] = [];
      const leads: TrafficCamLead[] = [];
      let contractorsNotified = 0;
      let totalPotentialValue = 0;

      // Generate alerts for each detection
      for (const detection of analysisResult.detections) {
        const alert = await this.generateAlert(cameraId, externalCameraId, detection, analysisResult, cameraLocation);
        alerts.push(alert);

        // Generate leads for profitable detections
        if (detection.profitabilityScore >= 4) { // Only generate leads for $1,000+ opportunities
          const generatedLeads = await this.generateLeadsForAlert(alert, cameraLocation);
          leads.push(...generatedLeads);

          // Calculate potential value
          if (detection.estimatedCost) {
            totalPotentialValue += (detection.estimatedCost.min + detection.estimatedCost.max) / 2;
          }

          // Notify contractors
          if (generatedLeads.length > 0) {
            contractorsNotified += await this.notifyContractors(alert, generatedLeads, cameraLocation);
          }
        }
      }

      const processingTime = Date.now() - startTime;
      const highPriorityAlerts = alerts.filter(alert => 
        alert.severityScore >= 7 || alert.profitabilityScore >= 7 || alert.emergencyResponse
      );

      console.log(`✅ Lead generation complete: ${alerts.length} alerts, ${leads.length} leads, ${contractorsNotified} contractors notified (${processingTime}ms)`);

      return {
        alertsGenerated: alerts.length,
        leadsGenerated: leads.length,
        contractorsNotified,
        totalPotentialValue,
        highPriorityAlerts,
        generatedLeads: leads,
        processingTimeMs: processingTime
      };

    } catch (error) {
      console.error('❌ Lead generation failed:', error);
      throw error;
    }
  }

  /**
   * Generate a traffic camera alert from damage detection
   */
  private async generateAlert(
    cameraId: string,
    externalCameraId: string,
    detection: DamageDetection,
    analysisResult: DamageAnalysisResult,
    cameraLocation: { lat: number; lng: number; address?: string }
  ): Promise<TrafficCamAlert> {
    // Resolve address if coordinates are available
    let resolvedAddress = cameraLocation.address;
    if (detection.coordinates && !resolvedAddress) {
      resolvedAddress = await this.resolveAddress(detection.coordinates.lat, detection.coordinates.lng);
    }

    const alertData: InsertTrafficCamAlert = {
      cameraId,
      externalCameraId,
      alertType: detection.alertType,
      confidence: detection.confidence,
      severity: detection.severity,
      severityScore: detection.severityScore,
      profitabilityScore: detection.profitabilityScore,
      description: detection.description,
      detectedAt: analysisResult.analysisTimestamp,
      exactLocation: detection.exactLocation,
      resolvedAddress,
      estimatedDamage: detection.estimatedDamage || 'medium',
      urgencyLevel: detection.urgencyLevel,
      contractorTypes: detection.contractorTypes,
      contractorSpecializations: detection.contractorSpecializations,
      estimatedCost: detection.estimatedCost,
      workScope: detection.workScope || [],
      safetyHazards: detection.safetyHazards || [],
      equipmentNeeded: detection.equipmentNeeded || [],
      accessibilityScore: detection.accessibilityScore,
      leadPriority: detection.leadPriority,
      emergencyResponse: detection.emergencyResponse,
      insuranceLikelihood: detection.insuranceLikelihood,
      competitionLevel: detection.competitionLevel,
      riskAssessment: analysisResult.riskAssessment,
      weatherCorrelation: analysisResult.weatherCorrelation,
      contractorsNotified: [],
      status: 'new',
      leadGenerated: detection.profitabilityScore >= 4,
      aiAnalysis: {
        detection,
        analysisResult: {
          confidence: analysisResult.confidence,
          processingTimeMs: analysisResult.processingTimeMs,
          totalSeverityScore: analysisResult.totalSeverityScore,
          maxProfitabilityScore: analysisResult.maxProfitabilityScore
        }
      },
      isVerified: false
    };

    // Create alert using storage interface
    const alert = await storage.createTrafficCamAlert({
      ...alertData,
      verifiedBy: null,
      verifiedAt: null,
      screenshotUrl: null,
      videoClipUrl: null
    });

    console.log(`📢 Generated ${detection.severity} alert: ${detection.alertType} (score: ${detection.severityScore}/10, profit: ${detection.profitabilityScore}/10)`);

    return alert;
  }

  /**
   * Generate contractor leads for an alert
   */
  private async generateLeadsForAlert(
    alert: TrafficCamAlert,
    cameraLocation: { lat: number; lng: number; address?: string }
  ): Promise<TrafficCamLead[]> {
    try {
      // Find matching contractors based on location and specialization
      const matchingContractors = await this.findMatchingContractors(alert, cameraLocation);

      const leads: TrafficCamLead[] = [];

      for (const contractor of matchingContractors) {
        const leadData: InsertTrafficCamLead = {
          alertId: alert.id,
          cameraId: alert.cameraId,
          contractorId: contractor.contractorId,
          alertType: alert.alertType,
          priority: this.calculateLeadPriority(alert, contractor),
          estimatedValue: contractor.estimatedValue,
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
          notes: `AI-generated lead from traffic camera damage detection. ${alert.description}`,
          responseTime: null,
          lastContactedAt: null,
          arrivalTime: null,
          workStarted: null,
          workCompleted: null
        };

        // Create lead using storage interface
        const lead = await storage.createTrafficCamLead(leadData);
        leads.push(lead);
      }

      console.log(`💼 Generated ${leads.length} leads for ${alert.alertType} alert`);
      return leads;

    } catch (error) {
      console.error('Failed to generate leads for alert:', error);
      return [];
    }
  }

  /**
   * Find contractors that match the damage type and location
   */
  private async findMatchingContractors(
    alert: TrafficCamAlert,
    location: { lat: number; lng: number }
  ): Promise<ContractorMatch[]> {
    try {
      // Get all contractor watchlists from storage
      const watchlists: ContractorWatchlist[] = await storage.getContractorWatchlist('*');
      console.log(`🔍 Found ${watchlists.length} contractor watchlist entries`);

      const matches: ContractorMatch[] = [];

      for (const watchlist of watchlists) {
        // Skip if watchlist doesn't have alerts enabled
        if (!watchlist.alertsEnabled) {
          continue;
        }

        // Check if contractor specializes in this damage type
        const alertTypes = Array.isArray(watchlist.alertTypes) ? watchlist.alertTypes : [];
        const matchesDamageType = alertTypes.length === 0 || // No specific types = match all
                                 alertTypes.includes(alert.alertType) ||
                                 this.getCompatibleAlertTypes(alert.alertType).some(type => alertTypes.includes(type));

        if (matchesDamageType) {
          // Use contractor location from metadata or default to Atlanta, GA area
          const contractorLat = watchlist.metadata?.lat || 33.7490;
          const contractorLng = watchlist.metadata?.lng || -84.3880;
          
          // Calculate distance
          const distance = this.calculateDistance(
            location.lat, location.lng,
            contractorLat, contractorLng
          );

          // Check if within contractor's radius
          const radius = Number(watchlist.metadata?.alertRadius) || 25; // km radius
          if (distance <= radius) {
            // Check severity threshold
            const minSeverity = this.getSeverityValue(watchlist.metadata?.minSeverityLevel || 'moderate');
            if (alert.severityScore >= minSeverity) {
              matches.push({
                contractorId: watchlist.contractorId,
                distanceKm: distance,
                specializations: alert.contractorSpecializations || [],
                priority: this.calculateContractorPriority(alert, distance),
                estimatedValue: this.calculateEstimatedValue(alert),
                competitionLevel: alert.competitionLevel || 'medium'
              });
              
              console.log(`✅ Matched contractor ${watchlist.contractorId}: ${distance.toFixed(1)}km away, specializes in ${alertTypes.join(', ') || 'all damage types'}`);
            }
          } else {
            console.log(`❌ Contractor ${watchlist.contractorId} too far: ${distance.toFixed(1)}km > ${radius}km radius`);
          }
        }
      }

      // Sort by priority and distance
      matches.sort((a, b) => {
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return a.distanceKm - b.distanceKm;
      });

      return matches.slice(0, 5); // Limit to top 5 matches to avoid spam

    } catch (error) {
      console.error('Failed to find matching contractors:', error);
      return [];
    }
  }

  /**
   * Notify contractors about new leads
   */
  private async notifyContractors(
    alert: TrafficCamAlert,
    leads: TrafficCamLead[],
    location: { lat: number; lng: number; address?: string }
  ): Promise<number> {
    let notifiedCount = 0;

    for (const lead of leads) {
      try {
        const notification: AlertNotification = {
          id: randomUUID(),
          type: 'contractor_opportunity',
          severity: alert.severity as 'minor' | 'moderate' | 'severe' | 'critical',
          title: `New ${alert.alertType.replace(/_/g, ' ')} Opportunity`,
          description: alert.description,
          location: {
            address: alert.resolvedAddress || location.address,
            lat: location.lat,
            lng: location.lng,
            state: 'Unknown', // Would extract from address
            county: 'Unknown'
          },
          alertTypes: [alert.alertType],
          urgencyLevel: alert.urgencyLevel as 'low' | 'normal' | 'high' | 'emergency',
          estimatedValue: alert.estimatedCost ? {
            min: alert.estimatedCost.min,
            max: alert.estimatedCost.max,
            currency: 'USD'
          } : undefined,
          contractorTypes: alert.contractorTypes || [],
          imageUrl: alert.screenshotUrl || undefined,
          createdAt: new Date(),
          metadata: {
            alertId: alert.id,
            leadId: lead.id,
            cameraId: alert.cameraId,
            severityScore: alert.severityScore,
            profitabilityScore: alert.profitabilityScore,
            accessibilityScore: alert.accessibilityScore
          }
        };

        // Send notification
        const results = await this.notificationService.sendAlert(notification, [lead.contractorId]);
        if (results.some(r => r.success)) {
          notifiedCount++;
        }

      } catch (error) {
        console.error(`Failed to notify contractor ${lead.contractorId}:`, error);
      }
    }

    return notifiedCount;
  }

  // Helper methods
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private getSeverityValue(severity: string): number {
    const map = { minor: 2, moderate: 5, severe: 7, critical: 9 };
    return map[severity as keyof typeof map] || 5;
  }

  private getCompatibleAlertTypes(alertType: string): string[] {
    // Define compatible alert types that contractors might handle
    const compatibilityMap: Record<string, string[]> = {
      'roof_damage': ['structure_damage', 'storm_damage'],
      'siding_damage': ['structure_damage', 'storm_damage'],
      'window_damage': ['structure_damage', 'storm_damage'],
      'structure_damage': ['roof_damage', 'siding_damage', 'window_damage'],
      'tree_down': ['tree_blocking_road', 'debris_blockage'],
      'tree_blocking_road': ['tree_down', 'debris_blockage'],
      'tree_on_powerline': ['tree_down', 'electrical_damage'],
      'flood_damage': ['water_damage', 'basement_flooding'],
      'basement_flooding': ['flood_damage', 'water_damage'],
      'electrical_damage': ['tree_on_powerline', 'structure_damage'],
      'debris_blockage': ['tree_down', 'tree_blocking_road']
    };
    
    return compatibilityMap[alertType] || [];
  }

  private calculateContractorPriority(alert: TrafficCamAlert, distance: number): 'low' | 'medium' | 'high' | 'critical' {
    // Start with alert priority
    let baseScore = 0;
    switch (alert.leadPriority) {
      case 'critical': baseScore = 10; break;
      case 'high': baseScore = 8; break;
      case 'medium': baseScore = 5; break;
      case 'low': baseScore = 2; break;
    }

    // Adjust for emergency response
    if (alert.emergencyResponse) baseScore += 3;
    
    // Adjust for distance (closer = higher priority)
    if (distance <= 5) baseScore += 2;
    else if (distance <= 15) baseScore += 1;
    else if (distance > 30) baseScore -= 1;

    // Adjust for profitability
    if (alert.profitabilityScore >= 8) baseScore += 2;
    else if (alert.profitabilityScore >= 6) baseScore += 1;

    // Convert score to priority
    if (baseScore >= 12) return 'critical';
    if (baseScore >= 8) return 'high';
    if (baseScore >= 5) return 'medium';
    return 'low';
  }

  private calculateEstimatedValue(alert: TrafficCamAlert): number {
    if (alert.estimatedCost) {
      return (alert.estimatedCost.min + alert.estimatedCost.max) / 2;
    }
    
    // Fallback estimation based on alert type
    const typeValues: Record<string, number> = {
      'roof_damage': 8000,
      'structure_damage': 12000,
      'siding_damage': 6000,
      'window_damage': 2500,
      'tree_on_powerline': 15000, // Emergency high value
      'tree_blocking_road': 3000,
      'tree_down': 2000,
      'flood_damage': 10000,
      'basement_flooding': 7500,
      'electrical_damage': 5000,
      'debris_blockage': 1500,
      'driveway_damage': 3500
    };
    
    return typeValues[alert.alertType] || 5000;
  }

  private calculateLeadPriority(alert: TrafficCamAlert, contractor: ContractorMatch): 'emergency' | 'urgent' | 'high' | 'normal' {
    if (alert.emergencyResponse || alert.severityScore >= 9) return 'emergency';
    if (alert.severityScore >= 7 || alert.profitabilityScore >= 8) return 'urgent';
    if (alert.severityScore >= 5 || alert.profitabilityScore >= 6) return 'high';
    return 'normal';
  }

  private calculateContractorPriority(alert: TrafficCamAlert, distance: number): 'low' | 'medium' | 'high' | 'critical' {
    if (alert.emergencyResponse || alert.severityScore >= 9) return 'critical';
    if (alert.severityScore >= 7 && distance <= 10) return 'high';
    if (alert.severityScore >= 5 && distance <= 25) return 'medium';
    return 'low';
  }

  private calculateEstimatedValue(alert: TrafficCamAlert): number {
    if (alert.estimatedCost) {
      return (alert.estimatedCost.min + alert.estimatedCost.max) / 2;
    }
    // Fallback based on profitability score
    const scoreToValue = {
      10: 50000, 9: 30000, 8: 20000, 7: 15000, 6: 10000,
      5: 5000, 4: 2500, 3: 1000, 2: 500, 1: 250
    };
    return scoreToValue[alert.profitabilityScore as keyof typeof scoreToValue] || 1000;
  }

  private async resolveAddress(lat: number, lng: number): Promise<string | undefined> {
    try {
      const response = await fetch(`https://api.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
      if (response.ok) {
        const data = await response.json();
        return data.display_name;
      }
    } catch (error) {
      console.warn('Address resolution failed:', error);
    }
    return undefined;
  }
}

// Export singleton instance
export const leadGenerationService = new LeadGenerationService(
  new NotificationService(new Set()) // Would inject proper SSE client set
);