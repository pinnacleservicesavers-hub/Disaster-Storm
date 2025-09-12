import fetch from 'node-fetch';
import { StormHotZone, InsertStormHotZone } from '@shared/schema';
import { storage } from '../storage';
import { femaMonitoringService } from './femaMonitoringService';

export interface FemaDisasterDeclaration {
  disasterNumber: string;
  state: string;
  stateCode: string;
  declarationType: string;
  incidentType: string;
  title: string;
  declaredCountyArea: string;
  fipsStateCode: string;
  fipsCountyCode: string;
  designatedCountyName: string;
  declarationDate: string;
  incidentBeginDate: string;
  incidentEndDate?: string;
  disasterCloseOutDate?: string;
  hash: string;
  lastRefresh: string;
}

export interface FemaApiResponse {
  metadata: {
    count: number;
    skip: number;
    top: number;
    version: string;
    entityname: string;
    url: string;
  };
  DisasterDeclarationsSummaries: FemaDisasterDeclaration[];
}

export interface FemaSyncStats {
  lastSyncAttempt: Date | null;
  lastSuccessfulSync: Date | null;
  totalDisastersProcessed: number;
  newCountiesAdded: number;
  existingCountiesUpdated: number;
  errorCount: number;
  isRunning: boolean;
  nextScheduledSync: Date | null;
}

export interface FemaSyncResult {
  success: boolean;
  disastersProcessed: number;
  newCounties: number;
  updatedCounties: number;
  errors: string[];
  duration: number;
  timestamp: Date;
}

export class FemaDisasterService {
  private static instance: FemaDisasterService;
  private readonly baseUrl = 'https://www.fema.gov/api/open/v2/DisasterDeclarationsSummaries';
  private readonly rateLimit = 60; // requests per minute
  private readonly requestQueue: Date[] = [];
  private readonly isDevelopment: boolean;
  
  private stats: FemaSyncStats = {
    lastSyncAttempt: null,
    lastSuccessfulSync: null,
    totalDisastersProcessed: 0,
    newCountiesAdded: 0,
    existingCountiesUpdated: 0,
    errorCount: 0,
    isRunning: false,
    nextScheduledSync: null
  };

  private constructor() {
    this.isDevelopment = process.env.NODE_ENV !== 'production';
    console.log(`🏛️ FemaDisasterService initialized (${this.isDevelopment ? 'development' : 'production'} mode)`);
  }

  static getInstance(): FemaDisasterService {
    if (!FemaDisasterService.instance) {
      FemaDisasterService.instance = new FemaDisasterService();
    }
    return FemaDisasterService.instance;
  }

  /**
   * Rate limiting helper to ensure we don't exceed API limits
   */
  private async waitForRateLimit(): Promise<void> {
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60000);
    
    // Remove requests older than 1 minute
    while (this.requestQueue.length > 0 && this.requestQueue[0] < oneMinuteAgo) {
      this.requestQueue.shift();
    }
    
    // If we're at the rate limit, wait
    if (this.requestQueue.length >= this.rateLimit) {
      const waitTime = this.requestQueue[0].getTime() + 60000 - now.getTime();
      if (waitTime > 0) {
        console.log(`🛑 Rate limit reached, waiting ${Math.ceil(waitTime/1000)}s...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
    
    this.requestQueue.push(now);
  }

  /**
   * Fetch disaster declarations from FEMA API with filters
   */
  private async fetchDisasterDeclarations(
    incidentTypes: string[] = ['Hurricane', 'Tornado'],
    startDate?: string,
    limit: number = 1000
  ): Promise<FemaDisasterDeclaration[]> {
    await this.waitForRateLimit();
    
    // Build query parameters
    const params = new URLSearchParams({
      '$top': limit.toString(),
      '$orderby': 'declarationDate desc',
      '$format': 'json'
    });

    // Build filters array to combine properly
    const filters: string[] = [];
    
    // Filter by incident types (hurricanes and tornadoes)
    if (incidentTypes.length > 0) {
      const typeFilter = incidentTypes.map(type => `incidentType eq '${type}'`).join(' or ');
      filters.push(`(${typeFilter})`);
    }

    // Add date filter if provided (use proper OData date format)
    if (startDate) {
      // Convert ISO string to proper OData date format (YYYY-MM-DD)
      const dateOnly = startDate.split('T')[0];
      const dateFilter = `declarationDate ge '${dateOnly}'`;
      filters.push(dateFilter);
    }
    
    // Combine filters with 'and'
    if (filters.length > 0) {
      params.append('$filter', filters.join(' and '));
    }

    const url = `${this.baseUrl}?${params.toString()}`;
    
    try {
      console.log(`🔄 Fetching FEMA disaster declarations: ${url}`);
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'StormOpsHub/1.0 (Disaster Response Platform)',
          'Accept': 'application/json'
        },
        timeout: 30000
      });

      if (!response.ok) {
        let errorDetails = '';
        try {
          const errorBody = await response.text();
          errorDetails = errorBody ? ` - Details: ${errorBody}` : '';
        } catch {
          // If we can't read the error body, continue without it
        }
        throw new Error(`FEMA API responded with status ${response.status}: ${response.statusText}${errorDetails}`);
      }

      const data: FemaApiResponse = await response.json() as FemaApiResponse;
      
      if (!data.DisasterDeclarationsSummaries) {
        throw new Error('Invalid response format from FEMA API');
      }

      console.log(`✅ Fetched ${data.DisasterDeclarationsSummaries.length} disaster declarations`);
      return data.DisasterDeclarationsSummaries;

    } catch (error) {
      console.error('❌ Error fetching FEMA disaster declarations:', error);
      throw error;
    }
  }

  /**
   * Calculate risk score based on disaster history and characteristics
   */
  private calculateRiskScore(
    disasters: FemaDisasterDeclaration[],
    incidentTypes: Set<string>
  ): number {
    let score = 50; // Base score
    
    // Add points for number of disasters (max 30 points)
    score += Math.min(disasters.length * 2, 30);
    
    // Add points for recent disasters (last 5 years)
    const fiveYearsAgo = new Date();
    fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);
    const recentDisasters = disasters.filter(d => 
      new Date(d.declarationDate) >= fiveYearsAgo
    );
    score += Math.min(recentDisasters.length * 5, 20);
    
    // Add points for multiple incident types
    if (incidentTypes.size > 1) {
      score += 10;
    }
    
    // Hurricane bonus (more severe)
    if (incidentTypes.has('Hurricane')) {
      score += 15;
    }
    
    return Math.min(score, 100); // Cap at 100
  }

  /**
   * Determine risk level based on risk score
   */
  private getRiskLevel(riskScore: number): string {
    if (riskScore >= 85) return 'Very High';
    if (riskScore >= 70) return 'High';
    if (riskScore >= 55) return 'Moderate-High';
    return 'Moderate';
  }

  /**
   * Create or update storm hot zone from FEMA disaster data
   */
  private async processCountyDisasters(
    stateCode: string,
    countyName: string,
    disasters: FemaDisasterDeclaration[]
  ): Promise<{ created: boolean; updated: boolean }> {
    try {
      const state = disasters[0].state;
      const fipsCode = disasters[0].fipsCountyCode;
      const incidentTypes = new Set(disasters.map(d => d.incidentType));
      const stormTypes = Array.from(incidentTypes).join(',');
      
      // Calculate risk metrics
      const riskScore = this.calculateRiskScore(disasters, incidentTypes);
      const riskLevel = this.getRiskLevel(riskScore);
      
      // Extract FEMA disaster IDs
      const femaDisasterIds = disasters.map(d => d.disasterNumber);
      
      // Create major storms array
      const majorStorms = disasters
        .filter(d => d.incidentType === 'Hurricane' || d.incidentType === 'Tornado')
        .slice(0, 5) // Take most recent 5
        .map(d => ({
          name: d.title.replace(/^(HURRICANE|TORNADO)\s+/i, ''),
          year: new Date(d.declarationDate).getFullYear(),
          category: d.incidentType === 'Hurricane' ? 'Hurricane' : 'Tornado',
          disasterNumber: d.disasterNumber
        }));

      // Check if county already exists
      const existingZones = await storage.getStormHotZonesByState(stateCode);
      const existingZone = existingZones.find(z => 
        z.countyParish.toLowerCase().includes(countyName.toLowerCase()) ||
        countyName.toLowerCase().includes(z.countyParish.toLowerCase())
      );

      if (existingZone) {
        // Update existing zone
        const existingIds = (existingZone.femaDisasterIds as string[]) || [];
        const newIds = femaDisasterIds.filter(id => !existingIds.includes(id));
        
        if (newIds.length > 0) {
          const updatedFemaIds = [...existingIds, ...newIds];
          const updatedMajorStorms = [
            ...(existingZone.majorStorms as any[] || []),
            ...majorStorms.filter(s => !(existingZone.majorStorms as any[])?.some(es => es.disasterNumber === s.disasterNumber))
          ];

          await storage.updateStormHotZone(existingZone.id, {
            femaDisasterIds: updatedFemaIds,
            majorStorms: updatedMajorStorms,
            riskScore: Math.max(riskScore, existingZone.riskScore),
            riskLevel: existingZone.riskScore > riskScore ? existingZone.riskLevel : riskLevel,
            stormTypes: existingZone.stormTypes.includes(',') || stormTypes.includes(',') 
              ? Array.from(new Set([...existingZone.stormTypes.split(','), ...stormTypes.split(',')])).join(',')
              : stormTypes,
            lastUpdated: new Date(),
            dataSource: 'FEMA Live Sync'
          });

          console.log(`📋 Updated existing hot zone: ${state} - ${countyName} (${newIds.length} new disasters)`);
          return { created: false, updated: true };
        }
      } else {
        // Create new hot zone for high-impact counties (multiple disasters or recent major event)
        if (disasters.length >= 2 || riskScore >= 70) {
          const newZone: InsertStormHotZone = {
            state,
            stateCode,
            countyParish: countyName,
            countyFips: fipsCode,
            stormTypes,
            riskLevel,
            riskScore,
            femaDisasterIds,
            majorStorms,
            notes: `Auto-added via FEMA Live Sync - ${disasters.length} disaster declarations`,
            primaryCities: null,
            latitude: null,
            longitude: null,
            avgClaimAmount: this.estimateClaimAmount(incidentTypes, disasters.length),
            marketPotential: riskScore >= 80 ? 'High' : riskScore >= 65 ? 'Medium' : 'Low',
            seasonalPeak: incidentTypes.has('Hurricane') ? 'Jun-Nov' : 
                         incidentTypes.has('Tornado') ? 'Mar-Jun' : 'Mar-Nov',
            dataSource: 'FEMA Live Sync',
            isActive: true
          };

          await storage.createStormHotZone(newZone);
          console.log(`🆕 Created new hot zone: ${state} - ${countyName} (Risk Score: ${riskScore})`);
          return { created: true, updated: false };
        }
      }

      return { created: false, updated: false };
    } catch (error) {
      console.error(`❌ Error processing county ${countyName}, ${stateCode}:`, error);
      throw error;
    }
  }

  /**
   * Estimate average claim amount based on disaster type and frequency
   */
  private estimateClaimAmount(incidentTypes: Set<string>, disasterCount: number): number {
    let baseAmount = 45000; // Base estimate
    
    if (incidentTypes.has('Hurricane')) {
      baseAmount += 25000; // Hurricanes typically cause more damage
    }
    
    if (incidentTypes.has('Tornado')) {
      baseAmount += 15000; // Tornadoes can be highly destructive
    }
    
    // More disasters = higher average claims
    baseAmount += (disasterCount - 1) * 5000;
    
    return Math.min(baseAmount, 100000); // Cap at reasonable amount
  }

  /**
   * Main sync method to fetch and process FEMA disaster data
   */
  async syncDisasterData(daysSinceLastSync: number = 30): Promise<FemaSyncResult> {
    if (this.stats.isRunning) {
      throw new Error('FEMA sync is already running');
    }

    const startTime = Date.now();
    this.stats.isRunning = true;
    this.stats.lastSyncAttempt = new Date();
    
    // Log sync start
    const operationId = await femaMonitoringService.logSyncStart(
      'scheduled_sync', 
      'scheduler', 
      daysSinceLastSync
    );
    
    const result: FemaSyncResult = {
      success: false,
      disastersProcessed: 0,
      newCounties: 0,
      updatedCounties: 0,
      errors: [],
      duration: 0,
      timestamp: new Date()
    };

    try {
      console.log(`🌪️ Starting FEMA disaster data sync (${daysSinceLastSync} days lookback)...`);
      
      // Calculate start date for filtering
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysSinceLastSync);
      const startDateStr = startDate.toISOString().split('T')[0] + 'T00:00:00.000Z';
      
      // Fetch disaster declarations
      const apiStartTime = Date.now();
      const disasters = await this.fetchDisasterDeclarations(
        ['Hurricane', 'Tornado'],
        startDateStr,
        1000
      );
      
      // Log API performance
      await femaMonitoringService.logApiPerformance(
        Date.now() - apiStartTime,
        false,
        'DisasterDeclarationsSummaries'
      );

      result.disastersProcessed = disasters.length;

      if (disasters.length === 0) {
        console.log('ℹ️ No new disasters found in the specified timeframe');
        result.success = true;
        return result;
      }

      // Group disasters by state and county
      const disastersByCounty = new Map<string, FemaDisasterDeclaration[]>();
      
      for (const disaster of disasters) {
        const key = `${disaster.stateCode}-${disaster.designatedCountyName}`;
        if (!disastersByCounty.has(key)) {
          disastersByCounty.set(key, []);
        }
        disastersByCounty.get(key)!.push(disaster);
      }

      console.log(`📍 Processing ${disastersByCounty.size} unique county disaster groups...`);

      // Process each county
      let newCounties = 0;
      let updatedCounties = 0;
      const errors: string[] = [];

      for (const [countyKey, countyDisasters] of disastersByCounty) {
        try {
          const [stateCode, countyName] = countyKey.split('-');
          const processResult = await this.processCountyDisasters(stateCode, countyName, countyDisasters);
          
          if (processResult.created) newCounties++;
          if (processResult.updated) updatedCounties++;
          
          // Small delay to avoid overwhelming the system
          await new Promise(resolve => setTimeout(resolve, 100));
          
        } catch (error) {
          const errorMsg = `Failed to process ${countyKey}: ${error instanceof Error ? error.message : String(error)}`;
          errors.push(errorMsg);
          console.error('❌', errorMsg);
        }
      }

      // Update stats
      this.stats.totalDisastersProcessed += disasters.length;
      this.stats.newCountiesAdded += newCounties;
      this.stats.existingCountiesUpdated += updatedCounties;
      this.stats.errorCount += errors.length;
      this.stats.lastSuccessfulSync = new Date();

      result.newCounties = newCounties;
      result.updatedCounties = updatedCounties;
      result.errors = errors;
      result.success = errors.length === 0 || (newCounties + updatedCounties) > 0;

      console.log(`✅ FEMA sync completed: ${newCounties} new counties, ${updatedCounties} updated counties, ${errors.length} errors`);

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      result.errors.push(`Sync failed: ${errorMsg}`);
      this.stats.errorCount++;
      console.error('❌ FEMA sync failed:', error);
    } finally {
      result.duration = Date.now() - startTime;
      this.stats.isRunning = false;
      this.stats.nextScheduledSync = new Date(Date.now() + 24 * 60 * 60 * 1000); // Next day
      
      // Log sync completion
      await femaMonitoringService.logSyncCompletion(
        'scheduled_sync',
        result,
        startTime,
        operationId
      );
    }

    return result;
  }

  /**
   * Get sync statistics and status
   */
  getSyncStats(): FemaSyncStats {
    return { ...this.stats };
  }

  /**
   * Fetch recent disaster declarations for a specific state
   */
  async getRecentDisastersForState(
    stateCode: string, 
    daysSinceLastSync: number = 90
  ): Promise<FemaDisasterDeclaration[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysSinceLastSync);
    const startDateStr = startDate.toISOString().split('T')[0] + 'T00:00:00.000Z';

    const disasters = await this.fetchDisasterDeclarations(
      ['Hurricane', 'Tornado'],
      startDateStr,
      500
    );

    return disasters.filter(d => d.stateCode === stateCode);
  }

  /**
   * Manual trigger for testing purposes
   */
  async triggerManualSync(daysSinceLastSync: number = 7): Promise<FemaSyncResult> {
    console.log('🔧 Manual FEMA sync triggered');
    
    // Override operation type for manual sync
    const originalSync = this.syncDisasterData.bind(this);
    const startTime = Date.now();
    
    // Log manual sync start
    const operationId = await femaMonitoringService.logSyncStart(
      'manual_sync',
      'manual',
      daysSinceLastSync
    );
    
    try {
      const result = await originalSync(daysSinceLastSync);
      
      // Log manual sync completion
      await femaMonitoringService.logSyncCompletion(
        'manual_sync',
        result,
        startTime,
        operationId
      );
      
      return result;
    } catch (error) {
      const result: FemaSyncResult = {
        success: false,
        disastersProcessed: 0,
        newCounties: 0,
        updatedCounties: 0,
        errors: [error instanceof Error ? error.message : String(error)],
        duration: Date.now() - startTime,
        timestamp: new Date()
      };
      
      await femaMonitoringService.logSyncCompletion(
        'manual_sync',
        result,
        startTime,
        operationId
      );
      
      throw error;
    }
  }
}

// Export singleton instance
export const femaDisasterService = FemaDisasterService.getInstance();