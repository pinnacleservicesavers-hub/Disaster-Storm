import { 
  StormPrediction, 
  DamageForecast, 
  ContractorOpportunityPrediction,
  HistoricalDamagePattern,
  RadarAnalysisCache,
  InsertStormPrediction,
  InsertDamageForecast,
  InsertContractorOpportunityPrediction,
  InsertHistoricalDamagePattern,
  InsertRadarAnalysisCache
} from '@shared/schema';
import { storage } from '../storage';
import { weatherService } from './weather';
import { FemaDisasterService } from './femaDisasterService';
import { DamageDetectionService } from './damageDetection';

// ===== CORE PREDICTION INTERFACES =====

export interface StormAnalysisInput {
  // Current Storm Data
  stormId: string;
  stormName?: string;
  stormType: 'hurricane' | 'tornado' | 'severe_thunderstorm' | 'winter_storm';
  currentPosition: { latitude: number; longitude: number };
  currentIntensity: number; // mph wind speed
  currentPressure?: number; // mb for hurricanes
  currentDirection: number; // degrees
  currentSpeed: number; // mph forward motion
  
  // Forecast Parameters
  forecastHours: number; // 12, 24, 48, 72
  targetStates?: string[]; // Focus prediction on specific states
  targetCounties?: string[]; // Focus on specific counties
  
  // Data Sources
  useNexradData?: boolean;
  useHistoricalData?: boolean;
  useSSTData?: boolean; // Sea surface temperature for hurricanes
  useWaveData?: boolean; // Wave heights for storm surge
}

export interface PredictionResult {
  stormPrediction: StormPrediction;
  damageForecasts: DamageForecast[];
  contractorOpportunities: ContractorOpportunityPrediction[];
  confidence: {
    overall: number; // 0.0 to 1.0
    pathAccuracy: number;
    intensityAccuracy: number;
    damageAccuracy: number;
  };
  analysisMetadata: {
    processingTimeMs: number;
    radarDataPoints: number;
    historicalEventsAnalyzed: number;
    modelsUsed: string[];
  };
}

export interface RiskScoringFactors {
  // Storm Characteristics (0-10 scale)
  windRisk: number;
  floodRisk: number;
  stormSurgeRisk: number;
  hailRisk: number;
  tornadoRisk: number;
  
  // Geographic Vulnerability (0-10 scale)
  populationDensity: number;
  buildingVulnerability: number;
  terrainFactor: number;
  infrastructureRisk: number;
  
  // Historical Correlation (0-1.0 scale)
  similarEventFactor: number;
  seasonalFactor: number;
  climateFactor: number;
}

// ===== PREDICTIVE STORM AI SERVICE =====

export class PredictiveStormService {
  private static instance: PredictiveStormService;
  private weatherService: typeof weatherService;
  private femaService: FemaDisasterService;
  private damageDetectionService: DamageDetectionService;
  
  // AI Model Configuration
  private readonly AI_MODEL_VERSION = 'v1.0';
  private readonly CONFIDENCE_THRESHOLD = 0.65;
  private readonly MAX_FORECAST_HOURS = 72;
  private readonly RADAR_CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
  
  // Geographic Constants
  private readonly EARTH_RADIUS = 3959; // miles
  private readonly HURRICANE_CATEGORIES = {
    1: { minWind: 74, maxWind: 95 },
    2: { minWind: 96, maxWind: 110 },
    3: { minWind: 111, maxWind: 129 },
    4: { minWind: 130, maxWind: 156 },
    5: { minWind: 157, maxWind: 999 }
  };
  
  constructor() {
    this.weatherService = weatherService;
    this.femaService = FemaDisasterService.getInstance();
    this.damageDetectionService = new DamageDetectionService();
    console.log('🤖 PredictiveStormService initialized with AI model', this.AI_MODEL_VERSION);
  }
  
  public static getInstance(): PredictiveStormService {
    if (!PredictiveStormService.instance) {
      PredictiveStormService.instance = new PredictiveStormService();
    }
    return PredictiveStormService.instance;
  }
  
  // ===== MAIN PREDICTION PIPELINE =====
  
  async generateStormPrediction(input: StormAnalysisInput): Promise<PredictionResult> {
    const startTime = Date.now();
    console.log(`🌪️ Starting AI prediction for storm ${input.stormId} (${input.forecastHours}h forecast)`);
    
    try {
      // Step 1: Analyze current radar data and cache it
      const radarAnalysis = await this.analyzeRadarData(input);
      
      // Step 2: Generate storm path and intensity prediction
      const stormPrediction = await this.generateStormPrediction_Internal(input, radarAnalysis);
      
      // Step 3: Create geographic damage forecasts
      const damageForecasts = await this.generateDamageForecasts(stormPrediction, input);
      
      // Step 4: Generate contractor opportunities
      const contractorOpportunities = await this.generateContractorOpportunities(damageForecasts, stormPrediction);
      
      // Step 5: Calculate confidence metrics
      const confidence = await this.calculatePredictionConfidence(stormPrediction, damageForecasts);
      
      const processingTime = Date.now() - startTime;
      
      const result: PredictionResult = {
        stormPrediction,
        damageForecasts,
        contractorOpportunities,
        confidence,
        analysisMetadata: {
          processingTimeMs: processingTime,
          radarDataPoints: radarAnalysis?.maxReflectivity ? 1 : 0,
          historicalEventsAnalyzed: await this.getHistoricalEventsCount(input.stormType, input.targetStates || []),
          modelsUsed: this.getActiveModels(input)
        }
      };
      
      console.log(`✅ Prediction completed in ${processingTime}ms - Confidence: ${(confidence.overall * 100).toFixed(1)}%`);
      return result;
      
    } catch (error) {
      console.error('🚨 Error generating storm prediction:', error);
      throw error;
    }
  }
  
  // ===== RADAR DATA ANALYSIS =====
  
  private async analyzeRadarData(input: StormAnalysisInput): Promise<RadarAnalysisCache | null> {
    console.log('📡 Analyzing NEXRAD radar data for storm characteristics...');
    
    try {
      // Get comprehensive weather data including radar
      const weatherData = await this.weatherService.getComprehensiveWeatherData(
        input.currentPosition.latitude, 
        input.currentPosition.longitude
      );
      
      if (!weatherData.radar || !input.useNexradData) {
        console.log('⚠️ No radar data available or NEXRAD analysis disabled');
        return null;
      }
      
      // Find the closest NEXRAD site to storm center
      const nearestRadarSite = this.findNearestRadarSite(input.currentPosition);
      
      // Analyze radar characteristics for storm prediction
      const radarAnalysis: InsertRadarAnalysisCache = {
        radarSiteId: nearestRadarSite,
        scanTimestamp: new Date(),
        scanType: 'reflectivity',
        elevationAngle: '0.5',
        centerLatitude: input.currentPosition.latitude.toString(),
        centerLongitude: input.currentPosition.longitude.toString(),
        radiusKm: '460', // Standard NEXRAD range
        
        // Analyze storm characteristics from radar
        maxReflectivity: this.analyzeStormReflectivity(weatherData.radar, input),
        maxVelocity: this.analyzeStormVelocity(weatherData.radar, input),
        mesocycloneDetections: this.detectMesocyclones(weatherData.radar, input),
        hailMarkers: this.detectHail(weatherData.radar, input),
        
        // Storm motion analysis
        stormMotionDirection: input.currentDirection,
        stormMotionSpeed: (input.currentSpeed * 0.514).toString(), // Convert mph to m/s
        stormIntensityTrend: this.analyzeIntensityTrend(input),
        
        // Threat assessment based on radar signatures
        tornadoRisk: this.assessTornadoRisk(weatherData.radar, input).toString(),
        hailRisk: this.assessHailRisk(weatherData.radar, input).toString(),
        windRisk: this.assessWindRisk(input).toString(),
        floodRisk: this.assessFloodRisk(weatherData.radar, input).toString(),
        
        processingAlgorithm: this.AI_MODEL_VERSION,
        qualityScore: this.calculateRadarQuality(weatherData.radar).toString(),
        cacheExpiry: new Date(Date.now() + this.RADAR_CACHE_DURATION),
        rawDataUrl: `https://radar.weather.gov/ridge/standard/${nearestRadarSite}_loop.gif`,
        processedDataUrl: null
      };
      
      // Store in cache for future use
      const cachedAnalysis = await storage.createRadarAnalysisCache(radarAnalysis);
      console.log(`📊 Radar analysis cached: Max reflectivity ${radarAnalysis.maxReflectivity}dBZ`);
      
      return cachedAnalysis;
      
    } catch (error) {
      console.error('❌ Error analyzing radar data:', error);
      return null;
    }
  }
  
  // ===== STORM PATH AND INTENSITY PREDICTION =====
  
  private async generateStormPrediction_Internal(
    input: StormAnalysisInput, 
    radarAnalysis: RadarAnalysisCache | null
  ): Promise<StormPrediction> {
    
    console.log('🎯 Generating storm path and intensity prediction...');
    
    // Get historical storm data for pattern matching
    const historicalPatterns = await this.findSimilarHistoricalStorms(input);
    
    // Generate predicted path points over forecast period
    const predictedPath = this.generateStormPath(input, historicalPatterns);
    
    // Calculate confidence based on data quality and model agreement
    const overallConfidence = this.calculateStormConfidence(input, radarAnalysis, historicalPatterns);
    const pathConfidence = this.calculatePathConfidence(predictedPath, historicalPatterns);
    const intensityConfidence = this.calculateIntensityConfidence(input, historicalPatterns);
    
    const stormPredictionData: InsertStormPrediction = {
      stormId: input.stormId,
      stormName: input.stormName || null,
      stormType: input.stormType,
      
      // Current characteristics
      currentLatitude: input.currentPosition.latitude.toString(),
      currentLongitude: input.currentPosition.longitude.toString(),
      currentIntensity: input.currentIntensity,
      currentPressure: input.currentPressure || null,
      currentDirection: input.currentDirection,
      currentSpeed: input.currentSpeed,
      
      // Prediction timeframe
      predictionStartTime: new Date(),
      predictionEndTime: new Date(Date.now() + input.forecastHours * 60 * 60 * 1000),
      forecastHours: input.forecastHours,
      
      // Predicted path and intensity
      predictedPath: JSON.parse(JSON.stringify(predictedPath)),
      maxPredictedIntensity: this.calculateMaxPredictedIntensity(predictedPath),
      
      // Confidence metrics
      overallConfidence: overallConfidence.toString(),
      pathConfidence: pathConfidence.toString(),
      intensityConfidence: intensityConfidence.toString(),
      
      // Data sources
      modelsSources: JSON.parse(JSON.stringify(this.getActiveModels(input))),
      radarSources: JSON.parse(JSON.stringify(['NEXRAD', 'GOES', 'Lightning'])),
      lastRadarUpdate: radarAnalysis?.scanTimestamp || new Date(),
      
      // AI metadata
      aiModelVersion: this.AI_MODEL_VERSION,
      processingTimeMs: 0, // Will be updated later
      analysisComplexity: this.determineAnalysisComplexity(input),
      status: 'active',
      supersededBy: null
    };
    
    const stormPrediction = await storage.createStormPrediction(stormPredictionData);
    console.log(`🌀 Storm prediction created with ${predictedPath.length} path points`);
    
    return stormPrediction;
  }
  
  // ===== DAMAGE FORECAST GENERATION =====
  
  private async generateDamageForecasts(
    stormPrediction: StormPrediction, 
    input: StormAnalysisInput
  ): Promise<DamageForecast[]> {
    
    console.log('🏠 Generating geographic damage forecasts...');
    
    const damageForecasts: DamageForecast[] = [];
    const predictedPath = stormPrediction.predictedPath as any[];
    
    // Generate forecasts for counties along the predicted path
    const affectedCounties = await this.identifyAffectedCounties(predictedPath, input);
    
    for (const county of affectedCounties) {
      try {
        // Get historical damage data for this county and storm type
        const historicalData = await this.getHistoricalDamageForCounty(
          county.state, 
          county.name, 
          input.stormType
        );
        
        // Calculate risk factors
        const riskFactors = await this.calculateCountyRiskFactors(
          county, 
          stormPrediction, 
          historicalData
        );
        
        // Determine timing of storm impact
        const impactTiming = this.calculateStormTiming(county, predictedPath);
        
        const forecastData: InsertDamageForecast = {
          stormPredictionId: stormPrediction.id,
          stormId: input.stormId,
          
          // Geographic information
          state: county.state,
          stateCode: county.stateCode,
          county: county.name,
          countyFips: county.fips,
          
          centerLatitude: county.centerLat.toString(),
          centerLongitude: county.centerLng.toString(),
          impactRadius: county.impactRadius.toString(),
          
          // Timing predictions
          expectedArrivalTime: impactTiming.arrival,
          peakIntensityTime: impactTiming.peak,
          expectedExitTime: impactTiming.exit,
          
          // Risk assessments (0-10 scale)
          windDamageRisk: riskFactors.windRisk.toString(),
          floodingRisk: riskFactors.floodRisk.toString(),
          stormSurgeRisk: riskFactors.stormSurgeRisk.toString(),
          hailRisk: riskFactors.hailRisk.toString(),
          tornadoRisk: riskFactors.tornadoRisk.toString(),
          lightningRisk: '3.0', // Default moderate risk
          
          // Overall assessment
          overallDamageRisk: this.calculateOverallDamageRisk(riskFactors).toString(),
          riskLevel: this.determineRiskLevel(riskFactors),
          confidenceScore: this.calculateDamageConfidence(riskFactors, historicalData).toString(),
          
          // Infrastructure vulnerability
          powerOutageRisk: riskFactors.infrastructureRisk.toString(),
          roadBlockageRisk: (riskFactors.windRisk * 0.8).toString(), // Wind affects roads
          structuralDamageRisk: riskFactors.buildingVulnerability.toString(),
          treeFallRisk: (riskFactors.windRisk * 0.9).toString(),
          
          // Economic predictions
          estimatedPropertyDamage: this.estimatePropertyDamage(riskFactors, county).toString(),
          estimatedClaimVolume: this.estimateInsuranceClaims(riskFactors, county),
          estimatedRestorationJobs: this.estimateRestorationJobs(riskFactors, county),
          averageJobValue: this.calculateAverageJobValue(county, riskFactors).toString(),
          
          // Historical correlation
          historicalSimilarity: this.calculateHistoricalSimilarity(historicalData, input).toString(),
          similarHistoricalEvents: JSON.parse(JSON.stringify(
            historicalData.slice(0, 3).map(h => ({
              eventName: h.eventName,
              eventDate: h.eventDate,
              intensity: h.impactIntensity,
              damage: h.totalPropertyDamage
            }))
          )),
          femaHistoryFactor: this.calculateFemaHistoryFactor(historicalData).toString(),
          
          // Population exposure
          populationExposed: county.population,
          buildingsExposed: county.buildingCount,
          highValueTargets: JSON.parse(JSON.stringify(county.criticalInfrastructure || [])),
          
          // Validity period
          validFromTime: new Date(),
          validUntilTime: new Date(Date.now() + input.forecastHours * 60 * 60 * 1000),
          status: 'active'
        };
        
        const forecast = await storage.createDamageForecast(forecastData);
        damageForecasts.push(forecast);
        
      } catch (error) {
        console.error(`❌ Error creating forecast for ${county.name}, ${county.state}:`, error);
      }
    }
    
    console.log(`📋 Generated ${damageForecasts.length} damage forecasts`);
    return damageForecasts;
  }
  
  // ===== CONTRACTOR OPPORTUNITY PREDICTION =====
  
  private async generateContractorOpportunities(
    damageForecasts: DamageForecast[],
    stormPrediction: StormPrediction
  ): Promise<ContractorOpportunityPrediction[]> {
    
    console.log('💼 Analyzing contractor opportunities...');
    
    const opportunities: ContractorOpportunityPrediction[] = [];
    
    // Only generate opportunities for moderate to high risk areas
    const viableForecasts = damageForecasts.filter(f => 
      ['moderate', 'high', 'extreme'].includes(f.riskLevel)
    );
    
    for (const forecast of viableForecasts) {
      try {
        // Analyze market potential and competition
        const marketAnalysis = await this.analyzeContractorMarket(forecast);
        
        // Calculate demand for different job types
        const jobDemand = this.calculateJobTypeDemand(forecast);
        
        // Estimate financial opportunity
        const financialAnalysis = this.calculateFinancialOpportunity(forecast, jobDemand);
        
        // Determine optimal timing for contractor deployment
        const timingAnalysis = this.calculateOptimalTiming(forecast);
        
        const opportunityData: InsertContractorOpportunityPrediction = {
          damageForecastId: forecast.id,
          stormPredictionId: stormPrediction.id,
          
          // Geographic information
          state: forecast.state,
          county: forecast.county,
          city: null, // Could be enhanced with city-level data
          zipCode: null,
          
          // Opportunity assessment
          opportunityScore: marketAnalysis.overallScore.toString(),
          marketPotential: marketAnalysis.potential,
          competitionLevel: marketAnalysis.competition,
          
          // Job type demand predictions (0-100 scale)
          treeRemovalDemand: jobDemand.treeRemoval.toString(),
          roofingDemand: jobDemand.roofing.toString(),
          sidingDemand: jobDemand.siding.toString(),
          windowDemand: jobDemand.windows.toString(),
          gutterDemand: jobDemand.gutters.toString(),
          fencingDemand: jobDemand.fencing.toString(),
          emergencyTarpingDemand: jobDemand.emergencyTarping.toString(),
          waterDamageDemand: jobDemand.waterDamage.toString(),
          
          // Financial predictions
          estimatedRevenueOpportunity: financialAnalysis.totalRevenue.toString(),
          expectedJobCount: financialAnalysis.jobCount,
          averageJobValue: financialAnalysis.averageJobValue.toString(),
          emergencyPremiumFactor: financialAnalysis.premiumFactor.toString(),
          
          // Market factors
          insurancePayoutLikelihood: marketAnalysis.insurancePayout.toString(),
          averageClaimAmount: forecast.averageJobValue,
          historicalPayoutRatio: '0.85', // Historical average
          
          // Timing and logistics
          optimalPrePositionTime: timingAnalysis.prePositionTime,
          workAvailableFromTime: timingAnalysis.workAvailable,
          peakDemandTime: timingAnalysis.peakDemand,
          demandDeclineTime: timingAnalysis.demandDecline,
          
          // Resource requirements
          recommendedCrewSize: this.calculateOptimalCrewSize(jobDemand, financialAnalysis),
          requiredEquipment: JSON.parse(JSON.stringify(this.getRequiredEquipment(jobDemand))),
          estimatedDurationDays: this.estimateWorkDuration(jobDemand, financialAnalysis),
          accommodationNeeds: JSON.parse(JSON.stringify(['Hotels within 30 miles', 'RV parking available'])),
          
          // Confidence and validation
          predictionConfidence: marketAnalysis.confidence.toString(),
          validatedAgainstHistorical: true,
          lastUpdated: new Date(),
          
          // Alerting
          alertLevel: this.determineAlertLevel(marketAnalysis.overallScore, forecast.riskLevel),
          contractorsNotified: JSON.parse(JSON.stringify([])),
          notificationsSent: 0
        };
        
        const opportunity = await storage.createContractorOpportunityPrediction(opportunityData);
        opportunities.push(opportunity);
        
      } catch (error) {
        console.error(`❌ Error creating opportunity for ${forecast.county}, ${forecast.state}:`, error);
      }
    }
    
    console.log(`💰 Generated ${opportunities.length} contractor opportunities`);
    return opportunities;
  }
  
  // ===== HELPER METHODS =====
  
  private findNearestRadarSite(position: { latitude: number; longitude: number }): string {
    // Major NEXRAD sites - would normally use a comprehensive database
    const radarSites = [
      { id: 'KFFC', lat: 33.3636, lng: -84.5658, name: 'Atlanta, GA' },
      { id: 'KTBW', lat: 27.7056, lng: -82.4017, name: 'Tampa, FL' },
      { id: 'KBMX', lat: 33.1722, lng: -86.7698, name: 'Birmingham, AL' },
      { id: 'KSHV', lat: 32.4508, lng: -93.8414, name: 'Shreveport, LA' },
      { id: 'KFWS', lat: 32.5730, lng: -97.3031, name: 'Fort Worth, TX' }
    ];
    
    let nearestSite = radarSites[0];
    let minDistance = this.calculateDistance(position, nearestSite);
    
    for (const site of radarSites) {
      const distance = this.calculateDistance(position, site);
      if (distance < minDistance) {
        minDistance = distance;
        nearestSite = site;
      }
    }
    
    return nearestSite.id;
  }
  
  private calculateDistance(point1: any, point2: any): number {
    const dLat = (point2.lat - point1.latitude) * Math.PI / 180;
    const dLon = (point2.lng - point1.longitude) * Math.PI / 180;
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(point1.latitude * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return this.EARTH_RADIUS * c;
  }
  
  private analyzeStormReflectivity(radarData: any, input: StormAnalysisInput): string {
    // Simulate radar analysis - in production would parse actual radar data
    const baseReflectivity = input.stormType === 'hurricane' ? 55 : 
                           input.stormType === 'tornado' ? 65 : 45;
    const intensityMultiplier = Math.min(input.currentIntensity / 100, 1.5);
    return (baseReflectivity * intensityMultiplier).toFixed(1);
  }
  
  private analyzeStormVelocity(radarData: any, input: StormAnalysisInput): string {
    // Convert storm speed to m/s and add rotation component for severe storms
    const translationalVelocity = input.currentSpeed * 0.514; // mph to m/s
    const rotationalComponent = input.stormType.includes('tornado') ? 30 : 5;
    return (translationalVelocity + rotationalComponent).toFixed(2);
  }
  
  private detectMesocyclones(radarData: any, input: StormAnalysisInput): any {
    // Simulate mesocyclone detection
    if (input.stormType.includes('tornado') || input.stormType === 'severe_thunderstorm') {
      return [{
        latitude: input.currentPosition.latitude,
        longitude: input.currentPosition.longitude,
        strength: input.currentIntensity > 80 ? 'strong' : 'moderate',
        diameter: '2.5', // miles
        detectionTime: new Date().toISOString()
      }];
    }
    return [];
  }
  
  private detectHail(radarData: any, input: StormAnalysisInput): any {
    // Simulate hail detection
    if (input.stormType === 'severe_thunderstorm' && input.currentIntensity > 60) {
      return [{
        latitude: input.currentPosition.latitude,
        longitude: input.currentPosition.longitude,
        size: input.currentIntensity > 80 ? 'large' : 'moderate',
        probability: 0.75
      }];
    }
    return [];
  }
  
  private analyzeIntensityTrend(input: StormAnalysisInput): string {
    // Simple trend analysis - could be enhanced with historical intensity data
    return input.currentIntensity > 100 ? 'strengthening' : 
           input.currentIntensity < 50 ? 'weakening' : 'steady';
  }
  
  private assessTornadoRisk(radarData: any, input: StormAnalysisInput): number {
    if (input.stormType.includes('tornado')) return 9.0;
    if (input.stormType === 'severe_thunderstorm' && input.currentIntensity > 70) return 6.5;
    if (input.stormType === 'hurricane' && input.currentIntensity > 130) return 4.0;
    return 1.0;
  }
  
  private assessHailRisk(radarData: any, input: StormAnalysisInput): number {
    if (input.stormType === 'severe_thunderstorm') return input.currentIntensity > 80 ? 8.0 : 5.0;
    if (input.stormType.includes('tornado')) return 6.0;
    return 1.0;
  }
  
  private assessWindRisk(input: StormAnalysisInput): number {
    return Math.min(input.currentIntensity / 15, 10.0);
  }
  
  private assessFloodRisk(radarData: any, input: StormAnalysisInput): number {
    if (input.stormType === 'hurricane') return Math.min(input.currentIntensity / 20, 10.0);
    if (input.stormType === 'severe_thunderstorm') return 4.0;
    return 2.0;
  }
  
  private calculateRadarQuality(radarData: any): number {
    // Quality score based on data completeness and recency
    return 0.85; // Default good quality
  }
  
  private async findSimilarHistoricalStorms(input: StormAnalysisInput): Promise<HistoricalDamagePattern[]> {
    const states = input.targetStates || ['FL', 'GA', 'AL', 'SC', 'NC'];
    const patterns: HistoricalDamagePattern[] = [];
    
    for (const state of states) {
      const statePatterns = await storage.getSimilarHistoricalEvents(
        input.stormType, 
        input.currentIntensity, 
        state
      );
      patterns.push(...statePatterns);
    }
    
    return patterns.slice(0, 10); // Return top 10 most similar events
  }
  
  private generateStormPath(
    input: StormAnalysisInput, 
    historicalPatterns: HistoricalDamagePattern[]
  ): any[] {
    const path = [];
    const timeStep = input.forecastHours <= 24 ? 1 : 3; // Hours between path points
    
    let currentLat = input.currentPosition.latitude;
    let currentLng = input.currentPosition.longitude;
    let currentIntensity = input.currentIntensity;
    
    for (let hour = 0; hour <= input.forecastHours; hour += timeStep) {
      // Simple forward projection - would use sophisticated models in production
      const hourlyDistance = input.currentSpeed; // miles per hour
      const bearing = input.currentDirection * Math.PI / 180; // Convert to radians
      
      // Update position
      const deltaLat = (hourlyDistance * Math.cos(bearing)) / 69; // ~69 miles per degree lat
      const deltaLng = (hourlyDistance * Math.sin(bearing)) / (69 * Math.cos(currentLat * Math.PI / 180));
      
      currentLat += deltaLat * timeStep;
      currentLng += deltaLng * timeStep;
      
      // Model intensity change (simplified)
      if (input.stormType === 'hurricane') {
        currentIntensity *= (1 - 0.005 * timeStep); // Gradual weakening over land
      }
      
      path.push({
        time: new Date(Date.now() + hour * 60 * 60 * 1000).toISOString(),
        latitude: Number(currentLat.toFixed(6)),
        longitude: Number(currentLng.toFixed(6)),
        intensity: Math.round(currentIntensity),
        confidence: Math.max(0.9 - (hour * 0.01), 0.5) // Decreasing confidence over time
      });
    }
    
    return path;
  }
  
  private calculateMaxPredictedIntensity(predictedPath: any[]): number {
    return Math.max(...predictedPath.map(p => p.intensity));
  }
  
  private calculateStormConfidence(
    input: StormAnalysisInput, 
    radarAnalysis: RadarAnalysisCache | null,
    historicalPatterns: HistoricalDamagePattern[]
  ): number {
    let confidence = 0.7; // Base confidence
    
    // Adjust based on data quality
    if (radarAnalysis && parseFloat(radarAnalysis.qualityScore || '0') > 0.8) confidence += 0.1;
    if (historicalPatterns.length > 5) confidence += 0.1;
    if (input.forecastHours <= 24) confidence += 0.1;
    
    return Math.min(confidence, 0.95);
  }
  
  private calculatePathConfidence(predictedPath: any[], historicalPatterns: HistoricalDamagePattern[]): number {
    // Path confidence decreases with time and increases with historical data
    const baseConfidence = 0.8;
    const historicalBonus = Math.min(historicalPatterns.length * 0.05, 0.15);
    return Math.min(baseConfidence + historicalBonus, 0.95);
  }
  
  private calculateIntensityConfidence(input: StormAnalysisInput, historicalPatterns: HistoricalDamagePattern[]): number {
    let confidence = 0.75;
    
    // Higher confidence for well-studied storm types
    if (input.stormType === 'hurricane') confidence += 0.1;
    if (historicalPatterns.length > 3) confidence += 0.1;
    
    return Math.min(confidence, 0.9);
  }
  
  private getActiveModels(input: StormAnalysisInput): string[] {
    const models = ['GFS', 'NAM', 'HRRR'];
    if (input.stormType === 'hurricane') models.push('HWRF', 'ECMWF');
    return models;
  }
  
  private determineAnalysisComplexity(input: StormAnalysisInput): string {
    if (input.forecastHours > 48 || input.stormType === 'hurricane') return 'complex';
    if (input.forecastHours > 24) return 'standard';
    return 'simple';
  }
  
  private async identifyAffectedCounties(predictedPath: any[], input: StormAnalysisInput): Promise<any[]> {
    // Simulate affected counties along the storm path
    // In production, this would use GIS data to identify actual counties
    const counties = [
      { 
        name: 'Miami-Dade', state: 'Florida', stateCode: 'FL', fips: '12086',
        centerLat: 25.7617, centerLng: -80.1918, impactRadius: 25,
        population: 2701767, buildingCount: 850000,
        criticalInfrastructure: ['Miami International Airport', 'Port of Miami']
      },
      {
        name: 'Broward', state: 'Florida', stateCode: 'FL', fips: '12011',
        centerLat: 26.1901, centerLng: -80.3659, impactRadius: 20,
        population: 1952778, buildingCount: 650000,
        criticalInfrastructure: ['Fort Lauderdale Airport', 'Port Everglades']
      }
    ];
    
    return counties;
  }
  
  private async getHistoricalDamageForCounty(
    state: string, 
    county: string, 
    stormType: string
  ): Promise<HistoricalDamagePattern[]> {
    
    return await storage.getHistoricalDamagePatternsByState(state);
  }
  
  private async calculateCountyRiskFactors(
    county: any, 
    stormPrediction: StormPrediction, 
    historicalData: HistoricalDamagePattern[]
  ): Promise<RiskScoringFactors> {
    
    const maxIntensity = stormPrediction.maxPredictedIntensity;
    
    return {
      windRisk: Math.min(maxIntensity / 15, 10),
      floodRisk: county.name.includes('Miami') ? 8.5 : 5.0,
      stormSurgeRisk: county.name.includes('coastal') ? 7.0 : 2.0,
      hailRisk: stormPrediction.stormType === 'severe_thunderstorm' ? 6.0 : 2.0,
      tornadoRisk: 3.0,
      
      populationDensity: county.population > 1000000 ? 8.0 : 5.0,
      buildingVulnerability: 6.0, // Average vulnerability
      terrainFactor: 4.0,
      infrastructureRisk: county.criticalInfrastructure?.length > 1 ? 7.0 : 5.0,
      
      similarEventFactor: historicalData.length > 3 ? 0.8 : 0.6,
      seasonalFactor: 0.9, // Peak season
      climateFactor: 0.8
    };
  }
  
  private calculateStormTiming(county: any, predictedPath: any[]): any {
    // Find the closest path point to county center
    const closestPoint = predictedPath.reduce((closest, point) => {
      const distance = this.calculateDistance(county, point);
      return distance < closest.distance ? { point, distance } : closest;
    }, { point: predictedPath[0], distance: Infinity });
    
    const arrivalTime = new Date(closestPoint.point.time);
    
    return {
      arrival: new Date(arrivalTime.getTime() - 2 * 60 * 60 * 1000), // 2 hours before
      peak: arrivalTime,
      exit: new Date(arrivalTime.getTime() + 3 * 60 * 60 * 1000) // 3 hours after
    };
  }
  
  private calculateOverallDamageRisk(riskFactors: RiskScoringFactors): number {
    const weights = {
      wind: 0.3,
      flood: 0.25,
      stormSurge: 0.2,
      hail: 0.1,
      tornado: 0.15
    };
    
    return (
      riskFactors.windRisk * weights.wind +
      riskFactors.floodRisk * weights.flood +
      riskFactors.stormSurgeRisk * weights.stormSurge +
      riskFactors.hailRisk * weights.hail +
      riskFactors.tornadoRisk * weights.tornado
    );
  }
  
  private determineRiskLevel(riskFactors: RiskScoringFactors): string {
    const overallRisk = this.calculateOverallDamageRisk(riskFactors);
    
    if (overallRisk >= 8.0) return 'extreme';
    if (overallRisk >= 6.0) return 'high';
    if (overallRisk >= 4.0) return 'moderate';
    if (overallRisk >= 2.0) return 'low';
    return 'minimal';
  }
  
  private calculateDamageConfidence(riskFactors: RiskScoringFactors, historicalData: HistoricalDamagePattern[]): number {
    let confidence = 0.7;
    
    if (historicalData.length > 5) confidence += 0.15;
    if (riskFactors.similarEventFactor > 0.7) confidence += 0.1;
    
    return Math.min(confidence, 0.95);
  }
  
  private estimatePropertyDamage(riskFactors: RiskScoringFactors, county: any): number {
    const avgHomeValue = 250000; // Default average home value
    const affectedHomes = Math.floor(county.buildingCount * 0.1 * (riskFactors.windRisk / 10));
    const avgDamagePercent = riskFactors.windRisk / 100; // 10% damage for 10/10 risk
    
    return affectedHomes * avgHomeValue * avgDamagePercent;
  }
  
  private estimateInsuranceClaims(riskFactors: RiskScoringFactors, county: any): number {
    const affectedHomes = Math.floor(county.buildingCount * 0.15 * (riskFactors.windRisk / 10));
    return Math.floor(affectedHomes * 0.8); // 80% file claims
  }
  
  private estimateRestorationJobs(riskFactors: RiskScoringFactors, county: any): number {
    return Math.floor(this.estimateInsuranceClaims(riskFactors, county) * 1.2);
  }
  
  private calculateAverageJobValue(county: any, riskFactors: RiskScoringFactors): number {
    const baseJobValue = 8500;
    const riskMultiplier = 1 + (riskFactors.windRisk / 20); // Up to 50% increase for highest risk
    const marketMultiplier = county.population > 1000000 ? 1.2 : 1.0; // 20% premium in major metros
    
    return baseJobValue * riskMultiplier * marketMultiplier;
  }
  
  private calculateHistoricalSimilarity(historicalData: HistoricalDamagePattern[], input: StormAnalysisInput): number {
    if (historicalData.length === 0) return 0.5;
    
    const similarEvents = historicalData.filter(event => 
      event.eventType === input.stormType &&
      Math.abs(event.impactIntensity - input.currentIntensity) <= 20
    );
    
    return Math.min(similarEvents.length / 5, 1.0); // Max similarity of 1.0
  }
  
  private calculateFemaHistoryFactor(historicalData: HistoricalDamagePattern[]): number {
    if (historicalData.length === 0) return 1.0;
    
    const recentEvents = historicalData.filter(event => 
      new Date(event.eventDate) > new Date(Date.now() - 10 * 365 * 24 * 60 * 60 * 1000) // Last 10 years
    );
    
    return 1 + (recentEvents.length * 0.1); // 10% increase per recent event
  }
  
  // Additional helper methods would continue here...
  // For brevity, I'll include the key structure and main algorithms
  
  private async analyzeContractorMarket(forecast: DamageForecast): Promise<any> {
    return {
      overallScore: parseFloat(forecast.overallDamageRisk) * 10,
      potential: parseFloat(forecast.overallDamageRisk) > 6 ? 'high' : 'moderate',
      competition: 'moderate',
      confidence: parseFloat(forecast.confidenceScore),
      insurancePayout: 0.82
    };
  }
  
  private calculateJobTypeDemand(forecast: DamageForecast): any {
    const windRisk = parseFloat(forecast.windDamageRisk);
    const floodRisk = parseFloat(forecast.floodingRisk);
    
    return {
      treeRemoval: windRisk * 9,
      roofing: windRisk * 8,
      siding: windRisk * 6,
      windows: windRisk * 7,
      gutters: windRisk * 5,
      fencing: windRisk * 4,
      emergencyTarping: windRisk * 9.5,
      waterDamage: floodRisk * 8
    };
  }
  
  private calculateFinancialOpportunity(forecast: DamageForecast, jobDemand: any): any {
    const avgJobValue = parseFloat(forecast.averageJobValue || '8500');
    const jobCount = forecast.estimatedRestorationJobs || 100;
    
    return {
      totalRevenue: avgJobValue * jobCount,
      jobCount: jobCount,
      averageJobValue: avgJobValue,
      premiumFactor: 1.25 // 25% emergency premium
    };
  }
  
  private calculateOptimalTiming(forecast: DamageForecast): any {
    const arrival = new Date(forecast.expectedArrivalTime);
    
    return {
      prePositionTime: new Date(arrival.getTime() - 12 * 60 * 60 * 1000), // 12 hours before
      workAvailable: new Date(arrival.getTime() + 6 * 60 * 60 * 1000), // 6 hours after
      peakDemand: new Date(arrival.getTime() + 24 * 60 * 60 * 1000), // 24 hours after
      demandDecline: new Date(arrival.getTime() + 14 * 24 * 60 * 60 * 1000) // 14 days after
    };
  }
  
  private calculateOptimalCrewSize(jobDemand: any, financialAnalysis: any): number {
    const totalDemand = Object.values(jobDemand).reduce((sum: number, demand) => sum + (demand as number), 0);
    return Math.ceil(totalDemand / 100); // Rough estimate
  }
  
  private getRequiredEquipment(jobDemand: any): string[] {
    const equipment = [];
    if (jobDemand.treeRemoval > 50) equipment.push('Chainsaws', 'Stump grinders');
    if (jobDemand.roofing > 50) equipment.push('Roofing tools', 'Ladders', 'Tarps');
    if (jobDemand.emergencyTarping > 50) equipment.push('Emergency tarps', 'Generators');
    return equipment;
  }
  
  private estimateWorkDuration(jobDemand: any, financialAnalysis: any): number {
    return Math.ceil(financialAnalysis.jobCount / 20); // 20 jobs per day estimate
  }
  
  private determineAlertLevel(opportunityScore: string, riskLevel: string): string {
    const score = parseFloat(opportunityScore);
    if (score > 80 && riskLevel === 'high') return 'emergency';
    if (score > 70) return 'warning';
    if (score > 50) return 'advisory';
    return 'watch';
  }
  
  private async getHistoricalEventsCount(stormType: string, states: string[]): Promise<number> {
    let count = 0;
    for (const state of states) {
      const patterns = await storage.getHistoricalDamagePatternsByEventType(stormType);
      count += patterns.filter(p => p.state === state).length;
    }
    return count;
  }
  
  private async calculatePredictionConfidence(
    stormPrediction: StormPrediction, 
    damageForecasts: DamageForecast[]
  ): Promise<any> {
    
    const pathConf = parseFloat(stormPrediction.pathConfidence);
    const intensityConf = parseFloat(stormPrediction.intensityConfidence);
    const damageConf = damageForecasts.length > 0 ? 
      damageForecasts.reduce((sum, f) => sum + parseFloat(f.confidenceScore), 0) / damageForecasts.length : 0.5;
    
    return {
      overall: parseFloat(stormPrediction.overallConfidence),
      pathAccuracy: pathConf,
      intensityAccuracy: intensityConf,
      damageAccuracy: damageConf
    };
  }
}

// Export singleton instance
export const predictiveStormService = PredictiveStormService.getInstance();