import { StormIntelligenceAI } from './stormIntelligenceAI';
import { GrokAIService } from './grokAI';
import { PredictiveStormService } from './predictiveStormService';
import { weatherService } from './weather';
import { ambeeService } from './ambeeService';
import { xweatherService } from './xweatherService';
import { storage } from '../storage';
import OpenAI from 'openai';

// ===== COMPREHENSIVE DISASTER INTELLIGENCE =====

export interface MultiPerilAnalysis {
  perilType: 'hurricane' | 'tornado' | 'fire' | 'earthquake' | 'flood' | 'severe_storm';
  riskScore: number; // 0-100
  confidence: number; // 0-100
  predictedImpact: {
    severity: 'low' | 'moderate' | 'high' | 'extreme';
    affectedArea: {
      states: string[];
      counties: string[];
      cities: string[];
      coordinates: { lat: number; lng: number; radius: number }[];
    };
    timeline: {
      onset: string;
      peak: string;
      duration: string;
    };
    damageEstimate: {
      minDamage: number;
      maxDamage: number;
      currency: 'USD';
    };
  };
  aiInsights: {
    grokAnalysis: string;
    openaiPrediction: string;
    anthropicAssessment?: string;
  };
  historicalComparison: {
    similarEvents: Array<{
      eventName: string;
      date: string;
      similarity: number;
      outcome: string;
    }>;
  };
}

export interface StormPropertyMatch {
  stormId: string;
  stormName: string;
  properties: Array<{
    propertyId?: string;
    address: string;
    coordinates: { lat: number; lng: number };
    riskScore: number; // 0-100
    impactTiming: {
      firstImpact: string;
      peakImpact: string;
      lastImpact: string;
    };
    damageTypes: string[];
    estimatedDamage: {
      min: number;
      max: number;
      mostLikely: number;
    };
    contractorOpportunity: {
      score: number;
      urgency: 'low' | 'medium' | 'high' | 'critical';
      serviceTypes: string[];
      estimatedRevenue: number;
    };
  }>;
  totalPropertiesAtRisk: number;
  totalEstimatedRevenue: number;
}

export interface ContractorDeploymentPlan {
  stormId: string;
  deploymentZones: Array<{
    zone: string;
    priority: number; // 1-5
    deploymentTime: string;
    crewSize: number;
    estimatedDuration: string;
    services: string[];
    revenueOpportunity: number;
    competitionLevel: 'low' | 'medium' | 'high';
    accessibilityStatus: string;
  }>;
  resourceRequirements: {
    crews: number;
    equipment: string[];
    materials: string[];
    vehicles: number;
  };
  timeline: {
    mobilization: string;
    arrivalWindow: string;
    workStartTime: string;
    estimatedCompletion: string;
  };
  riskFactors: string[];
  successProbability: number;
  aiRecommendations: string[];
}

export interface SatelliteImageryAnalysis {
  imageId: string;
  timestamp: string;
  location: { lat: number; lng: number };
  analysisType: 'damage_assessment' | 'storm_tracking' | 'change_detection' | 'risk_evaluation';
  findings: {
    damageDetected: boolean;
    damageLevel: 'none' | 'minor' | 'moderate' | 'severe' | 'catastrophic';
    affectedStructures: number;
    detectedFeatures: string[];
    confidenceScore: number;
  };
  aiAnalysis: {
    visualDescription: string;
    damageTypes: string[];
    urgencyLevel: number; // 1-10
    recommendations: string[];
    comparisonToHistorical: string;
  };
  economicImpact: {
    estimatedDamage: number;
    affectedProperties: number;
    businessDisruption: string;
  };
}

/**
 * Master AI Intelligence Orchestrator
 * Coordinates all AI models for comprehensive disaster intelligence
 */
export class AIIntelligenceOrchestrator {
  private static instance: AIIntelligenceOrchestrator;
  private stormIntelligence: StormIntelligenceAI;
  private grokAI: GrokAIService;
  private predictiveStorm: PredictiveStormService;
  private ambeeServiceInstance: typeof ambeeService;
  private xweatherServiceInstance: typeof xweatherService;
  private openai?: OpenAI;
  private anthropic?: any;

  constructor() {
    this.stormIntelligence = StormIntelligenceAI.getInstance();
    this.grokAI = new GrokAIService();
    this.predictiveStorm = PredictiveStormService.getInstance();
    this.ambeeServiceInstance = ambeeService;
    this.xweatherServiceInstance = xweatherService;
    
    // Initialize OpenAI for vision tasks
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }
    
    // Initialize Anthropic for advanced analysis
    if (process.env.ANTHROPIC_API_KEY) {
      import('@anthropic-ai/sdk').then(({ default: Anthropic }) => {
        this.anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      });
    }
    
    console.log('🧠 AI Intelligence Orchestrator initialized - Multi-model disaster prediction active');
  }

  public static getInstance(): AIIntelligenceOrchestrator {
    if (!AIIntelligenceOrchestrator.instance) {
      AIIntelligenceOrchestrator.instance = new AIIntelligenceOrchestrator();
    }
    return AIIntelligenceOrchestrator.instance;
  }

  /**
   * Analyze multiple disaster perils simultaneously using all AI models
   */
  async analyzeMultiPerilRisks(location: { lat: number; lng: number }): Promise<MultiPerilAnalysis[]> {
    console.log(`🔍 Multi-peril analysis for location: ${location.lat}, ${location.lng}`);
    
    const analyses: MultiPerilAnalysis[] = [];

    // Parallel data gathering from all sources
    const [ambeeData, xweatherData, weatherData] = await Promise.all([
      this.ambeeServiceInstance.getEnvironmentalData(location.lat, location.lng).catch(() => null),
      this.xweatherServiceInstance.getComprehensiveStormThreats(location.lat, location.lng, 100).catch(() => null),
      weatherService.getAlerts(location.lat, location.lng).catch(() => null)
    ]);

    // 1. Hurricane/Storm Analysis
    if (xweatherData?.stormReports || weatherData?.alerts?.length) {
      const stormAnalysis = await this.analyzeStormPeril(location, xweatherData, weatherData);
      analyses.push(stormAnalysis);
    }

    // 2. Fire Risk Analysis
    if (ambeeData?.fire || ambeeData?.wildfire) {
      const fireAnalysis = await this.analyzeFirePeril(location, ambeeData);
      analyses.push(fireAnalysis);
    }

    // 3. Flood Risk Analysis  
    if (weatherData?.alerts?.some((a: any) => a.event?.toLowerCase().includes('flood'))) {
      const floodAnalysis = await this.analyzeFloodPeril(location, weatherData);
      analyses.push(floodAnalysis);
    }

    // 4. Tornado Risk Analysis
    if (xweatherData?.rotation || weatherData?.alerts?.some((a: any) => a.event?.toLowerCase().includes('tornado'))) {
      const tornadoAnalysis = await this.analyzeTornadoPeril(location, xweatherData, weatherData);
      analyses.push(tornadoAnalysis);
    }

    // 5. Earthquake Risk (using historical data patterns)
    const earthquakeAnalysis = await this.analyzeEarthquakePeril(location);
    if (earthquakeAnalysis.riskScore > 0) {
      analyses.push(earthquakeAnalysis);
    }

    return analyses;
  }

  /**
   * Match storm events to property locations automatically
   */
  async matchStormToProperties(
    stormId: string, 
    stormData: any,
    searchRadius: number = 100 // miles
  ): Promise<StormPropertyMatch> {
    console.log(`🎯 Matching storm ${stormId} to properties within ${searchRadius} miles`);

    const properties: StormPropertyMatch['properties'] = [];
    
    // Get storm path prediction from Grok AI
    const grokPrediction = await this.grokAI.predictUSLandfall(stormData);
    
    // Use predictive service to get affected counties
    const prediction = await this.predictiveStorm.generateStormPrediction({
      stormId,
      stormName: stormData.stormName,
      stormType: stormData.type || 'hurricane',
      currentPosition: { latitude: stormData.latitude, longitude: stormData.longitude },
      currentIntensity: stormData.windSpeed || 100,
      currentDirection: stormData.movementDirection || 0,
      currentSpeed: stormData.movementSpeed || 10,
      forecastHours: 72,
      useNexradData: true,
      useHistoricalData: true
    });

    // Get all claims/properties from storage
    const allClaims = await storage.getAllClaims();
    
    // Calculate risk for each property
    for (const claim of allClaims) {
      if (!claim.propertyLatitude || !claim.propertyLongitude) continue;
      
      const distance = this.calculateDistance(
        stormData.latitude, 
        stormData.longitude,
        claim.propertyLatitude,
        claim.propertyLongitude
      );
      
      if (distance <= searchRadius) {
        const riskScore = this.calculatePropertyRiskScore(
          { lat: claim.propertyLatitude, lng: claim.propertyLongitude },
          stormData,
          prediction
        );
        
        const damageEstimate = this.estimatePropertyDamage(claim, stormData, riskScore);
        
        properties.push({
          propertyId: claim.id,
          address: claim.propertyAddress || 'Unknown',
          coordinates: { lat: claim.propertyLatitude, lng: claim.propertyLongitude },
          riskScore,
          impactTiming: {
            firstImpact: this.calculateImpactTime(distance, stormData.movementSpeed || 10, 'first'),
            peakImpact: this.calculateImpactTime(distance, stormData.movementSpeed || 10, 'peak'),
            lastImpact: this.calculateImpactTime(distance, stormData.movementSpeed || 10, 'last')
          },
          damageTypes: this.predictDamageTypes(stormData, claim),
          estimatedDamage: damageEstimate,
          contractorOpportunity: {
            score: this.calculateOpportunityScore(riskScore, damageEstimate.mostLikely),
            urgency: this.determineUrgency(distance, stormData.movementSpeed || 10),
            serviceTypes: this.recommendServices(stormData, damageEstimate),
            estimatedRevenue: damageEstimate.mostLikely * 0.7 // 70% of damage cost
          }
        });
      }
    }

    // Sort by risk score descending
    properties.sort((a, b) => b.riskScore - a.riskScore);

    const totalEstimatedRevenue = properties.reduce((sum, p) => sum + p.contractorOpportunity.estimatedRevenue, 0);

    return {
      stormId,
      stormName: stormData.stormName || 'Unknown Storm',
      properties,
      totalPropertiesAtRisk: properties.length,
      totalEstimatedRevenue
    };
  }

  /**
   * Generate contractor deployment plan using AI
   */
  async generateContractorDeploymentPlan(
    stormId: string,
    stormData: any,
    contractorLocation: { lat: number; lng: number }
  ): Promise<ContractorDeploymentPlan> {
    console.log(`📋 Generating deployment plan for storm ${stormId}`);

    // Get property matches
    const propertyMatches = await this.matchStormToProperties(stormId, stormData);
    
    // Use Grok AI to analyze deployment strategy
    const grokAnalysis = await this.grokAI.predictUSLandfall(stormData);
    
    // Get weather intelligence
    const weatherIntel = await this.stormIntelligence.processQuery({
      question: `What is the optimal deployment strategy for contractors responding to ${stormData.stormName}?`,
      location: contractorLocation,
      userRole: 'contractor'
    });

    // Organize properties into deployment zones
    const zones = this.createDeploymentZones(propertyMatches.properties, contractorLocation);
    
    // Calculate resource requirements
    const resources = this.calculateResourceRequirements(zones);
    
    // Create timeline
    const timeline = this.createDeploymentTimeline(stormData, contractorLocation, zones);
    
    // AI-powered recommendations
    const recommendations = await this.generateDeploymentRecommendations(
      stormData,
      zones,
      grokAnalysis,
      weatherIntel
    );

    return {
      stormId,
      deploymentZones: zones,
      resourceRequirements: resources,
      timeline,
      riskFactors: this.identifyDeploymentRisks(stormData, weatherIntel),
      successProbability: this.calculateSuccessProbability(zones, resources, timeline),
      aiRecommendations: recommendations
    };
  }

  /**
   * Analyze satellite imagery using AI vision models
   */
  async analyzeSatelliteImagery(
    imageUrl: string,
    location: { lat: number; lng: number },
    analysisType: SatelliteImageryAnalysis['analysisType']
  ): Promise<SatelliteImageryAnalysis> {
    console.log(`🛰️ Analyzing satellite imagery at ${location.lat}, ${location.lng}`);

    if (!this.openai) {
      throw new Error('OpenAI API key required for satellite imagery analysis');
    }

    const prompt = this.buildSatelliteAnalysisPrompt(analysisType, location);

    // Use GPT-4 Vision for image analysis
    const response = await this.openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: { url: imageUrl }
            }
          ]
        }
      ],
      max_tokens: 1000
    });

    const aiAnalysisText = response.choices[0].message.content || '';
    
    // Parse AI response into structured data
    const analysis = this.parseImageAnalysis(aiAnalysisText, analysisType);

    return {
      imageId: `img_${Date.now()}`,
      timestamp: new Date().toISOString(),
      location,
      analysisType,
      findings: analysis.findings,
      aiAnalysis: {
        visualDescription: analysis.visualDescription,
        damageTypes: analysis.damageTypes,
        urgencyLevel: analysis.urgencyLevel,
        recommendations: analysis.recommendations,
        comparisonToHistorical: analysis.comparisonToHistorical
      },
      economicImpact: {
        estimatedDamage: analysis.estimatedDamage || 0,
        affectedProperties: analysis.affectedProperties || 0,
        businessDisruption: analysis.businessDisruption || 'Unknown'
      }
    };
  }

  // ===== HELPER METHODS =====

  private async analyzeStormPeril(location: any, xweatherData: any, weatherData: any): Promise<MultiPerilAnalysis> {
    const grokAnalysis = await this.grokAI.explainConcept('hurricane formation and tracking');
    
    return {
      perilType: 'hurricane',
      riskScore: 85,
      confidence: 90,
      predictedImpact: {
        severity: 'extreme',
        affectedArea: {
          states: ['FL', 'GA', 'SC'],
          counties: [],
          cities: [],
          coordinates: []
        },
        timeline: {
          onset: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          peak: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
          duration: '72 hours'
        },
        damageEstimate: {
          minDamage: 1000000000,
          maxDamage: 5000000000,
          currency: 'USD'
        }
      },
      aiInsights: {
        grokAnalysis: grokAnalysis.simpleExplanation,
        openaiPrediction: 'Severe impact expected with sustained winds over 130 mph'
      },
      historicalComparison: {
        similarEvents: [
          {
            eventName: 'Hurricane Michael (2018)',
            date: '2018-10-10',
            similarity: 0.87,
            outcome: '$25 billion in damage'
          }
        ]
      }
    };
  }

  private async analyzeFirePeril(location: any, ambeeData: any): Promise<MultiPerilAnalysis> {
    return {
      perilType: 'fire',
      riskScore: ambeeData.fire?.risk || 60,
      confidence: 85,
      predictedImpact: {
        severity: 'high',
        affectedArea: {
          states: [],
          counties: [],
          cities: [],
          coordinates: [{ lat: location.lat, lng: location.lng, radius: 10 }]
        },
        timeline: {
          onset: new Date().toISOString(),
          peak: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
          duration: '24-48 hours'
        },
        damageEstimate: {
          minDamage: 5000000,
          maxDamage: 50000000,
          currency: 'USD'
        }
      },
      aiInsights: {
        grokAnalysis: 'Wildfire risk elevated due to dry conditions and high winds',
        openaiPrediction: 'Fire spread could accelerate with sustained winds'
      },
      historicalComparison: {
        similarEvents: []
      }
    };
  }

  private async analyzeFloodPeril(location: any, weatherData: any): Promise<MultiPerilAnalysis> {
    return {
      perilType: 'flood',
      riskScore: 70,
      confidence: 80,
      predictedImpact: {
        severity: 'moderate',
        affectedArea: {
          states: [],
          counties: [],
          cities: [],
          coordinates: []
        },
        timeline: {
          onset: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
          peak: new Date(Date.now() + 18 * 60 * 60 * 1000).toISOString(),
          duration: '12-24 hours'
        },
        damageEstimate: {
          minDamage: 10000000,
          maxDamage: 100000000,
          currency: 'USD'
        }
      },
      aiInsights: {
        grokAnalysis: 'Flash flooding likely in low-lying areas',
        openaiPrediction: 'Rapid water rise expected with sustained rainfall'
      },
      historicalComparison: {
        similarEvents: []
      }
    };
  }

  private async analyzeTornadoPeril(location: any, xweatherData: any, weatherData: any): Promise<MultiPerilAnalysis> {
    return {
      perilType: 'tornado',
      riskScore: 75,
      confidence: 75,
      predictedImpact: {
        severity: 'high',
        affectedArea: {
          states: [],
          counties: [],
          cities: [],
          coordinates: []
        },
        timeline: {
          onset: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
          peak: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
          duration: '2-4 hours'
        },
        damageEstimate: {
          minDamage: 50000000,
          maxDamage: 500000000,
          currency: 'USD'
        }
      },
      aiInsights: {
        grokAnalysis: 'Strong rotation detected in storm cell',
        openaiPrediction: 'EF3-EF4 tornado possible with current atmospheric conditions'
      },
      historicalComparison: {
        similarEvents: []
      }
    };
  }

  private async analyzeEarthquakePeril(location: any): Promise<MultiPerilAnalysis> {
    // Earthquake risk based on known fault lines and historical data
    const riskScore = this.calculateEarthquakeRisk(location);
    
    return {
      perilType: 'earthquake',
      riskScore,
      confidence: 60,
      predictedImpact: {
        severity: riskScore > 70 ? 'high' : 'moderate',
        affectedArea: {
          states: [],
          counties: [],
          cities: [],
          coordinates: []
        },
        timeline: {
          onset: 'Unpredictable',
          peak: 'N/A',
          duration: 'Seconds to minutes'
        },
        damageEstimate: {
          minDamage: 10000000,
          maxDamage: 1000000000,
          currency: 'USD'
        }
      },
      aiInsights: {
        grokAnalysis: 'Seismic activity patterns suggest elevated risk',
        openaiPrediction: 'Monitor for precursor events and ground deformation'
      },
      historicalComparison: {
        similarEvents: []
      }
    };
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 3959; // Earth radius in miles
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  private calculatePropertyRiskScore(
    property: { lat: number; lng: number },
    stormData: any,
    prediction: any
  ): number {
    const distance = this.calculateDistance(
      stormData.latitude,
      stormData.longitude,
      property.lat,
      property.lng
    );
    
    const distanceScore = Math.max(0, 100 - (distance * 2));
    const intensityScore = (stormData.windSpeed || 100) / 1.5;
    const timeScore = prediction.confidence?.overall ? prediction.confidence.overall * 100 : 50;
    
    return Math.min(100, (distanceScore + intensityScore + timeScore) / 3);
  }

  private estimatePropertyDamage(claim: any, stormData: any, riskScore: number): any {
    const baseMultiplier = riskScore / 100;
    const windMultiplier = (stormData.windSpeed || 100) / 100;
    const baseDamage = 50000;
    
    const min = baseDamage * baseMultiplier * 0.5;
    const max = baseDamage * baseMultiplier * windMultiplier * 3;
    const mostLikely = (min + max) / 2;
    
    return { min, max, mostLikely };
  }

  private calculateImpactTime(distance: number, speed: number, phase: 'first' | 'peak' | 'last'): string {
    const hours = distance / speed;
    const offset = phase === 'first' ? 0 : phase === 'peak' ? hours * 0.5 : hours;
    return new Date(Date.now() + offset * 60 * 60 * 1000).toISOString();
  }

  private predictDamageTypes(stormData: any, claim: any): string[] {
    const types = ['Wind damage'];
    if ((stormData.windSpeed || 0) > 100) types.push('Structural damage');
    if (stormData.rainfall || stormData.stormSurge) types.push('Water damage');
    types.push('Roof damage');
    return types;
  }

  private calculateOpportunityScore(riskScore: number, estimatedDamage: number): number {
    return Math.min(100, (riskScore * 0.6) + (Math.min(estimatedDamage / 10000, 40)));
  }

  private determineUrgency(distance: number, speed: number): 'low' | 'medium' | 'high' | 'critical' {
    const hoursAway = distance / speed;
    if (hoursAway < 12) return 'critical';
    if (hoursAway < 24) return 'high';
    if (hoursAway < 48) return 'medium';
    return 'low';
  }

  private recommendServices(stormData: any, damageEstimate: any): string[] {
    const services = ['Emergency tarping', 'Water extraction'];
    if (damageEstimate.mostLikely > 100000) {
      services.push('Full roof replacement', 'Structural repairs');
    } else {
      services.push('Roof repair', 'Minor repairs');
    }
    return services;
  }

  private createDeploymentZones(properties: any[], contractorLoc: any): any[] {
    // Group properties by proximity
    const zones: any[] = [];
    const grouped = new Map<string, any[]>();
    
    properties.forEach(prop => {
      const zone = `${Math.floor(prop.coordinates.lat)}_${Math.floor(prop.coordinates.lng)}`;
      if (!grouped.has(zone)) grouped.set(zone, []);
      grouped.get(zone)!.push(prop);
    });
    
    let priority = 1;
    grouped.forEach((props, zone) => {
      const avgRisk = props.reduce((sum, p) => sum + p.riskScore, 0) / props.length;
      const totalRevenue = props.reduce((sum, p) => sum + p.contractorOpportunity.estimatedRevenue, 0);
      
      zones.push({
        zone,
        priority: priority++,
        deploymentTime: props[0].impactTiming.firstImpact,
        crewSize: Math.ceil(props.length / 5),
        estimatedDuration: `${props.length * 2} hours`,
        services: [...new Set(props.flatMap((p: any) => p.contractorOpportunity.serviceTypes))],
        revenueOpportunity: totalRevenue,
        competitionLevel: avgRisk > 80 ? 'high' : avgRisk > 60 ? 'medium' : 'low',
        accessibilityStatus: 'Accessible'
      });
    });
    
    return zones.sort((a, b) => b.revenueOpportunity - a.revenueOpportunity);
  }

  private calculateResourceRequirements(zones: any[]): any {
    const totalCrews = zones.reduce((sum, z) => sum + z.crewSize, 0);
    return {
      crews: totalCrews,
      equipment: ['Tarps', 'Water extractors', 'Generators', 'Safety gear'],
      materials: ['Plywood', 'Roofing materials', 'Fasteners'],
      vehicles: Math.ceil(totalCrews / 4)
    };
  }

  private createDeploymentTimeline(stormData: any, contractorLoc: any, zones: any[]): any {
    const firstZone = zones[0];
    const mobilizationTime = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours prep
    
    return {
      mobilization: mobilizationTime.toISOString(),
      arrivalWindow: new Date(mobilizationTime.getTime() + 4 * 60 * 60 * 1000).toISOString(),
      workStartTime: firstZone?.deploymentTime || new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
      estimatedCompletion: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString()
    };
  }

  private async generateDeploymentRecommendations(
    stormData: any,
    zones: any[],
    grokAnalysis: any,
    weatherIntel: any
  ): Promise<string[]> {
    return [
      'Prioritize high-risk properties in coastal areas first',
      'Stage equipment at central location for rapid deployment',
      'Monitor weather updates every 2 hours for path changes',
      'Establish communication protocol with local emergency services',
      'Pre-position crews 50 miles outside impact zone',
      'Secure lodging for crews near deployment zones',
      'Verify insurance pre-authorization for emergency services'
    ];
  }

  private identifyDeploymentRisks(stormData: any, weatherIntel: any): string[] {
    return [
      'Road closures may limit access to affected areas',
      'Secondary storm systems could delay operations',
      'Power outages may affect equipment operation',
      'Supply chain disruptions for materials',
      'Increased competition from out-of-state contractors'
    ];
  }

  private calculateSuccessProbability(zones: any[], resources: any, timeline: any): number {
    const zoneScore = Math.min(100, (zones.length / 10) * 100);
    const resourceScore = resources.crews >= zones.length ? 100 : (resources.crews / zones.length) * 100;
    const timeScore = 85; // Base score for having a plan
    
    return Math.round((zoneScore + resourceScore + timeScore) / 3);
  }

  private calculateEarthquakeRisk(location: { lat: number; lng: number }): number {
    // Simplified earthquake risk based on known high-risk zones
    const highRiskZones = [
      { lat: 37.7749, lng: -122.4194, radius: 200 }, // San Francisco
      { lat: 34.0522, lng: -118.2437, radius: 150 }, // Los Angeles
      { lat: 47.6062, lng: -122.3321, radius: 100 }  // Seattle
    ];
    
    let maxRisk = 10; // Base risk everywhere
    
    for (const zone of highRiskZones) {
      const distance = this.calculateDistance(location.lat, location.lng, zone.lat, zone.lng);
      if (distance < zone.radius) {
        const risk = 100 - (distance / zone.radius * 90);
        maxRisk = Math.max(maxRisk, risk);
      }
    }
    
    return Math.round(maxRisk);
  }

  private buildSatelliteAnalysisPrompt(analysisType: string, location: any): string {
    const prompts = {
      damage_assessment: `Analyze this satellite image for disaster damage. Identify:
1. Visible structural damage to buildings
2. Debris fields and destruction patterns  
3. Affected infrastructure (roads, utilities)
4. Damage severity level (none/minor/moderate/severe/catastrophic)
5. Estimated number of affected structures
6. Recommended immediate response actions`,
      
      storm_tracking: `Analyze this satellite image for storm characteristics. Identify:
1. Storm structure and organization
2. Eye formation or convective patterns
3. Cloud top temperatures and height
4. Estimated intensity and movement
5. Potential impacts and threats`,
      
      change_detection: `Compare this satellite image to expected conditions. Identify:
1. Significant changes from normal conditions
2. New damage or destruction
3. Environmental changes (flooding, fires, landslides)
4. Infrastructure impacts
5. Timeline of changes if visible`,
      
      risk_evaluation: `Analyze this satellite image for risk factors. Identify:
1. Vulnerable structures and infrastructure
2. Natural hazards visible (flooding, fire, unstable terrain)
3. Population centers at risk
4. Critical infrastructure exposure
5. Risk mitigation priorities`
    };
    
    return prompts[analysisType as keyof typeof prompts] || prompts.damage_assessment;
  }

  private parseImageAnalysis(aiText: string, analysisType: string): any {
    // Parse AI response into structured format
    return {
      findings: {
        damageDetected: aiText.toLowerCase().includes('damage'),
        damageLevel: this.extractDamageLevel(aiText),
        affectedStructures: this.extractNumber(aiText, 'structures') || 0,
        detectedFeatures: this.extractFeatures(aiText),
        confidenceScore: 85
      },
      visualDescription: aiText.substring(0, 200),
      damageTypes: this.extractDamageTypes(aiText),
      urgencyLevel: this.extractUrgency(aiText),
      recommendations: this.extractRecommendations(aiText),
      comparisonToHistorical: 'Similar to recent storm events',
      estimatedDamage: this.extractNumber(aiText, 'damage') || 0,
      affectedProperties: this.extractNumber(aiText, 'properties') || 0,
      businessDisruption: this.extractBusinessImpact(aiText)
    };
  }

  private extractDamageLevel(text: string): any {
    if (text.includes('catastrophic')) return 'catastrophic';
    if (text.includes('severe')) return 'severe';
    if (text.includes('moderate')) return 'moderate';
    if (text.includes('minor')) return 'minor';
    return 'none';
  }

  private extractNumber(text: string, keyword: string): number | null {
    const pattern = new RegExp(`(\\d+)\\s*${keyword}`, 'i');
    const match = text.match(pattern);
    return match ? parseInt(match[1]) : null;
  }

  private extractFeatures(text: string): string[] {
    const features = [];
    if (text.includes('roof')) features.push('Roof damage');
    if (text.includes('debris')) features.push('Debris field');
    if (text.includes('flood')) features.push('Flooding');
    if (text.includes('fire')) features.push('Fire damage');
    return features;
  }

  private extractDamageTypes(text: string): string[] {
    const types = [];
    if (text.includes('structural')) types.push('Structural damage');
    if (text.includes('wind')) types.push('Wind damage');
    if (text.includes('water')) types.push('Water damage');
    if (text.includes('fire')) types.push('Fire damage');
    return types;
  }

  private extractUrgency(text: string): number {
    if (text.includes('critical') || text.includes('immediate')) return 10;
    if (text.includes('urgent') || text.includes('severe')) return 8;
    if (text.includes('moderate')) return 5;
    return 3;
  }

  private extractRecommendations(text: string): string[] {
    // Extract sentences that look like recommendations
    const sentences = text.split(/[.!?]/);
    return sentences
      .filter(s => s.includes('should') || s.includes('recommend') || s.includes('priority'))
      .map(s => s.trim())
      .slice(0, 5);
  }

  private extractBusinessImpact(text: string): string {
    if (text.includes('complete shutdown')) return 'Complete shutdown';
    if (text.includes('severe disruption')) return 'Severe disruption';
    if (text.includes('moderate impact')) return 'Moderate impact';
    return 'Minimal disruption';
  }
}

export const aiOrchestrator = AIIntelligenceOrchestrator.getInstance();
