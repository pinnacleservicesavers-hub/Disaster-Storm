import { Router, Request, Response, Express } from 'express';
import { aiOrchestrator } from '../services/aiIntelligenceOrchestrator';
import { pool } from '../db';
import OpenAI from 'openai';

// Initialize OpenAI client using Replit AI Integrations
const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL || 'https://openai-gateway.replit.dev/v1',
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY || 'dummy-key-for-replit-ai'
});

const router = Router();

// Type definitions for AI intelligence
interface HazardData {
  source: string;
  count: number;
  severity: string;
  alerts: Array<{
    id: string;
    event: string;
    state: string;
    severity: string;
    latitude: number;
    longitude: number;
    polygon?: Array<[number, number]>;
    metadata?: any;
  }>;
}

interface StagingLocation {
  latitude: number;
  longitude: number;
  safetyDistance: number;
  nearestHazard: string;
  hazardDistance: number;
  description: string;
}

/**
 * Calculate distance between two points using Haversine formula
 * Returns distance in kilometers
 */
function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Find safe staging locations ~20km outside hazard areas
 */
function calculateStagingLocations(hazards: HazardData[], targetLat?: number, targetLon?: number): StagingLocation[] {
  const stagingLocations: StagingLocation[] = [];
  const safetyDistance = 20; // km
  
  // Use Florida center as default if no target provided
  const baseLat = targetLat || 28.5;
  const baseLon = targetLon || -81.5;
  
  // Generate candidate staging locations in a grid around base location
  const offsets = [
    { lat: 0.2, lon: 0 },    // ~20km north
    { lat: -0.2, lon: 0 },   // ~20km south
    { lat: 0, lon: 0.2 },    // ~20km east
    { lat: 0, lon: -0.2 },   // ~20km west
    { lat: 0.15, lon: 0.15 }, // NE
    { lat: 0.15, lon: -0.15 }, // NW
    { lat: -0.15, lon: 0.15 }, // SE
    { lat: -0.15, lon: -0.15 } // SW
  ];
  
  for (const offset of offsets) {
    const candLat = baseLat + offset.lat;
    const candLon = baseLon + offset.lon;
    
    // Find nearest hazard to this candidate location
    let minDistance = Infinity;
    let nearestHazard = 'Unknown';
    
    for (const hazard of hazards) {
      for (const alert of hazard.alerts) {
        if (alert.latitude && alert.longitude) {
          const distance = haversineDistance(candLat, candLon, alert.latitude, alert.longitude);
          if (distance < minDistance) {
            minDistance = distance;
            nearestHazard = `${alert.event} (${alert.state})`;
          }
        }
      }
    }
    
    // Only include if it's far enough from hazards
    if (minDistance >= safetyDistance) {
      stagingLocations.push({
        latitude: candLat,
        longitude: candLon,
        safetyDistance: Math.round(minDistance * 10) / 10,
        nearestHazard,
        hazardDistance: Math.round(minDistance * 10) / 10,
        description: `Safe staging zone ${Math.round(minDistance)}km from ${nearestHazard}`
      });
    }
  }
  
  // Sort by distance from hazards (farther = safer)
  return stagingLocations.sort((a, b) => b.hazardDistance - a.hazardDistance).slice(0, 5);
}

/**
 * POST /api/ai-intelligence/multi-peril
 * Analyze multiple disaster perils for a location
 */
router.post('/multi-peril', async (req: Request, res: Response) => {
  try {
    const { lat, lng } = req.body;
    
    if (!lat || !lng) {
      return res.status(400).json({ 
        error: 'Latitude and longitude are required' 
      });
    }

    console.log(`🔍 Multi-peril analysis request for ${lat}, ${lng}`);

    const analyses = await aiOrchestrator.analyzeMultiPerilRisks({ lat, lng });

    res.json({
      location: { lat, lng },
      timestamp: new Date().toISOString(),
      perilCount: analyses.length,
      analyses,
      summary: analyses.length > 0 ? {
        highestRisk: analyses.reduce((max, a) => a.riskScore > max.riskScore ? a : max, analyses[0]),
        totalEstimatedDamage: analyses.reduce((sum, a) => 
          sum + ((a.predictedImpact.damageEstimate.minDamage + a.predictedImpact.damageEstimate.maxDamage) / 2), 0
        )
      } : {
        highestRisk: null,
        totalEstimatedDamage: 0,
        message: 'No significant perils detected at this location'
      }
    });
  } catch (error: any) {
    console.error('❌ Multi-peril analysis error:', error);
    res.status(500).json({ 
      error: 'Failed to analyze multi-peril risks',
      message: error.message 
    });
  }
});

/**
 * POST /api/ai-intelligence/storm-property-match
 * Match storm to properties and calculate risk
 */
router.post('/storm-property-match', async (req: Request, res: Response) => {
  try {
    const { stormId, stormData, searchRadius } = req.body;
    
    if (!stormId || !stormData) {
      return res.status(400).json({ 
        error: 'Storm ID and storm data are required' 
      });
    }

    console.log(`🎯 Storm-property matching for ${stormId}`);

    const matches = await aiOrchestrator.matchStormToProperties(
      stormId, 
      stormData, 
      searchRadius || 100
    );

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      matches,
      analytics: {
        propertiesAtRisk: matches.totalPropertiesAtRisk,
        totalRevenue: matches.totalEstimatedRevenue,
        averageRisk: matches.properties.length > 0 
          ? matches.properties.reduce((sum, p) => sum + p.riskScore, 0) / matches.properties.length 
          : 0,
        criticalProperties: matches.properties.filter(p => p.contractorOpportunity.urgency === 'critical').length
      }
    });
  } catch (error: any) {
    console.error('❌ Storm-property matching error:', error);
    res.status(500).json({ 
      error: 'Failed to match storm to properties',
      message: error.message 
    });
  }
});

/**
 * POST /api/ai-intelligence/deployment-plan
 * Generate contractor deployment plan
 */
router.post('/deployment-plan', async (req: Request, res: Response) => {
  try {
    const { stormId, stormData, contractorLocation } = req.body;
    
    if (!stormId || !stormData || !contractorLocation) {
      return res.status(400).json({ 
        error: 'Storm ID, storm data, and contractor location are required' 
      });
    }

    console.log(`📋 Deployment plan generation for ${stormId}`);

    const plan = await aiOrchestrator.generateContractorDeploymentPlan(
      stormId,
      stormData,
      contractorLocation
    );

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      plan,
      executiveSummary: {
        totalZones: plan.deploymentZones.length,
        totalRevenue: plan.deploymentZones.reduce((sum, z) => sum + z.revenueOpportunity, 0),
        crewsNeeded: plan.resourceRequirements.crews,
        deploymentStart: plan.timeline.mobilization,
        successRate: plan.successProbability
      }
    });
  } catch (error: any) {
    console.error('❌ Deployment plan error:', error);
    res.status(500).json({ 
      error: 'Failed to generate deployment plan',
      message: error.message 
    });
  }
});

/**
 * POST /api/ai-intelligence/analyze-satellite
 * Analyze satellite imagery using AI vision
 */
router.post('/analyze-satellite', async (req: Request, res: Response) => {
  try {
    const { imageUrl, location, analysisType } = req.body;
    
    if (!imageUrl || !location) {
      return res.status(400).json({ 
        error: 'Image URL and location are required' 
      });
    }

    console.log(`🛰️ Satellite imagery analysis for ${location.lat}, ${location.lng}`);

    const analysis = await aiOrchestrator.analyzeSatelliteImagery(
      imageUrl,
      location,
      analysisType || 'damage_assessment'
    );

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      analysis,
      summary: {
        damageDetected: analysis.findings.damageDetected,
        severity: analysis.findings.damageLevel,
        urgency: analysis.aiAnalysis.urgencyLevel,
        estimatedDamage: analysis.economicImpact.estimatedDamage,
        recommendationCount: analysis.aiAnalysis.recommendations.length
      }
    });
  } catch (error: any) {
    console.error('❌ Satellite analysis error:', error);
    res.status(500).json({ 
      error: 'Failed to analyze satellite imagery',
      message: error.message 
    });
  }
});

/**
 * POST /api/ai-intelligence/predict-damage
 * Predict damage before storm hits using all AI models
 */
router.post('/predict-damage', async (req: Request, res: Response) => {
  try {
    const { stormData, targetLocation } = req.body;
    
    if (!stormData || !targetLocation) {
      return res.status(400).json({ 
        error: 'Storm data and target location are required' 
      });
    }

    console.log(`🔮 Pre-storm damage prediction for ${targetLocation.lat}, ${targetLocation.lng}`);

    // Get multi-peril analysis
    const perils = await aiOrchestrator.analyzeMultiPerilRisks(targetLocation);
    
    // Get storm-property matches
    const matches = await aiOrchestrator.matchStormToProperties(
      stormData.stormId || 'unknown',
      stormData,
      50
    );

    // Combine insights
    const prediction = {
      location: targetLocation,
      timestamp: new Date().toISOString(),
      stormInfo: {
        name: stormData.stormName || 'Unknown',
        type: stormData.type || 'unknown',
        currentIntensity: stormData.windSpeed || 0
      },
      multiPerilRisks: perils,
      propertyImpact: {
        affectedProperties: matches.totalPropertiesAtRisk,
        totalDamageEstimate: matches.totalEstimatedRevenue / 0.7, // Reverse calculate damage from revenue
        highRiskProperties: matches.properties.filter(p => p.riskScore > 80).length,
        criticalTiming: matches.properties[0]?.impactTiming || null
      },
      aiConsensus: {
        riskLevel: perils.length > 0 ? perils[0].predictedImpact.severity : 'low',
        confidence: perils.length > 0 ? perils[0].confidence : 100,
        recommendedActions: perils.length > 0 ? [
          'Evacuate high-risk areas immediately',
          'Secure loose objects and board windows',
          'Stock emergency supplies for 72 hours',
          'Document property condition for insurance',
          'Identify evacuation routes and shelters'
        ] : [
          'No immediate threats detected',
          'Continue monitoring weather conditions',
          'Maintain emergency preparedness supplies',
          'Review evacuation plans regularly'
        ]
      },
      contractorOpportunity: {
        totalRevenue: matches.totalEstimatedRevenue,
        deploymentUrgency: matches.properties[0]?.contractorOpportunity.urgency || 'unknown',
        serviceTypes: [...new Set(matches.properties.flatMap(p => p.contractorOpportunity.serviceTypes))],
        competitionLevel: matches.properties.length > 20 ? 'high' : 'medium'
      }
    };

    res.json({
      success: true,
      prediction
    });
  } catch (error: any) {
    console.error('❌ Damage prediction error:', error);
    res.status(500).json({ 
      error: 'Failed to predict damage',
      message: error.message 
    });
  }
});

/**
 * GET /api/ai-intelligence/status
 * Get AI system status and capabilities
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    res.json({
      status: 'operational',
      timestamp: new Date().toISOString(),
      capabilities: {
        multiPerilAnalysis: true,
        stormPropertyMatching: true,
        deploymentPlanning: true,
        satelliteAnalysis: !!process.env.OPENAI_API_KEY,
        damagePrediction: true
      },
      aiModels: {
        grok: !!process.env.XAI_API_KEY,
        openai: !!process.env.OPENAI_API_KEY,
        anthropic: !!process.env.ANTHROPIC_API_KEY
      },
      supportedPerils: [
        'hurricane',
        'tornado',
        'fire',
        'earthquake',
        'flood',
        'severe_storm'
      ],
      version: '1.0.0'
    });
  } catch (error: any) {
    res.status(500).json({ 
      error: 'Failed to get AI status',
      message: error.message 
    });
  }
});

/**
 * GET /api/ai-intelligence/summary
 * Returns a plain-English summary of current hazards and impacts
 */
router.get('/summary', async (req: Request, res: Response) => {
  try {
    console.log('🤖 Generating AI hazard summary...');
    
    // Fetch all active hazards from database
    const result = await pool.query(`
      SELECT 
        id, alert_id, event, state, title, description, severity, alert_type,
        areas, effective, expires, polygon, latitude, longitude, source,
        geometry_type, hazard_metadata, is_active
      FROM weather_alerts
      WHERE is_active = true
      AND (expires IS NULL OR expires > NOW())
      ORDER BY 
        CASE severity
          WHEN 'Extreme' THEN 1
          WHEN 'Severe' THEN 2
          WHEN 'Moderate' THEN 3
          ELSE 4
        END,
        effective DESC
      LIMIT 100
    `);
    
    const alerts = result.rows;
    
    // Group by source
    const hazardsBySource: Record<string, HazardData> = {};
    
    for (const alert of alerts) {
      const source = alert.source || 'Unknown';
      if (!hazardsBySource[source]) {
        hazardsBySource[source] = {
          source,
          count: 0,
          severity: alert.severity,
          alerts: []
        };
      }
      
      hazardsBySource[source].count++;
      hazardsBySource[source].alerts.push({
        id: alert.id,
        event: alert.event,
        state: alert.state,
        severity: alert.severity,
        latitude: parseFloat(alert.latitude) || 0,
        longitude: parseFloat(alert.longitude) || 0,
        polygon: alert.polygon ? JSON.parse(alert.polygon) : undefined,
        metadata: alert.hazard_metadata
      });
      
      // Update to worst severity
      const severities = ['Minor', 'Moderate', 'Severe', 'Extreme'];
      const currentIdx = severities.indexOf(hazardsBySource[source].severity);
      const newIdx = severities.indexOf(alert.severity);
      if (newIdx > currentIdx) {
        hazardsBySource[source].severity = alert.severity;
      }
    }
    
    // Generate AI summary
    const hazardList = Object.values(hazardsBySource);
    const totalAlerts = alerts.length;
    
    const summaryPrompt = `You are an AI intelligence analyst for Disaster Direct, a storm operations platform for contractors and emergency responders.

Generate a concise, actionable plain-English briefing of current hazards. Focus on:
1. What disasters are active right now
2. Where they are located  
3. Severity and immediate impacts
4. Contractor deployment recommendations

Current Hazard Data:
${JSON.stringify(hazardList, null, 2)}

Total active alerts: ${totalAlerts}

Provide a professional briefing in 3-5 paragraphs. Be specific about locations, severities, and actionable guidance for contractors.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-5-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert disaster intelligence analyst providing real-time briefings to emergency responders and contractors.'
        },
        {
          role: 'user',
          content: summaryPrompt
        }
      ],
      max_completion_tokens: 1000
    });
    
    const summary = completion.choices[0]?.message?.content || 'No summary available';
    
    console.log('✅ AI summary generated');
    res.json({
      summary,
      totalAlerts,
      hazardsBySource: hazardList,
      generatedAt: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error generating AI summary:', error);
    res.status(500).json({ 
      error: 'Failed to generate hazard summary',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/ai-intelligence/staging
 * Returns suggested safe staging locations for contractor deployment
 * Query params: lat, lon (optional - defaults to Florida center)
 */
router.get('/staging', async (req: Request, res: Response) => {
  try {
    console.log('📍 Calculating safe staging locations...');
    
    const targetLat = req.query.lat ? parseFloat(req.query.lat as string) : undefined;
    const targetLon = req.query.lon ? parseFloat(req.query.lon as string) : undefined;
    
    // Fetch active hazards
    const result = await pool.query(`
      SELECT 
        id, alert_id, event, state, severity, latitude, longitude, polygon,
        source, geometry_type, hazard_metadata
      FROM weather_alerts
      WHERE is_active = true
      AND (expires IS NULL OR expires > NOW())
      AND latitude IS NOT NULL
      AND longitude IS NOT NULL
    `);
    
    const alerts = result.rows;
    
    // Group by source
    const hazardsBySource: Record<string, HazardData> = {};
    
    for (const alert of alerts) {
      const source = alert.source || 'Unknown';
      if (!hazardsBySource[source]) {
        hazardsBySource[source] = {
          source,
          count: 0,
          severity: alert.severity,
          alerts: []
        };
      }
      
      hazardsBySource[source].count++;
      hazardsBySource[source].alerts.push({
        id: alert.id,
        event: alert.event,
        state: alert.state,
        severity: alert.severity,
        latitude: parseFloat(alert.latitude),
        longitude: parseFloat(alert.longitude),
        polygon: alert.polygon ? JSON.parse(alert.polygon) : undefined,
        metadata: alert.hazard_metadata
      });
    }
    
    // Calculate safe staging locations
    const stagingLocations = calculateStagingLocations(
      Object.values(hazardsBySource),
      targetLat,
      targetLon
    );
    
    // Generate AI recommendations
    const stagingPrompt = `You are an AI deployment strategist for Disaster Direct.

Based on current hazard locations, recommend safe staging areas for contractor deployment.

Candidate Staging Locations:
${JSON.stringify(stagingLocations, null, 2)}

Active Hazards:
${JSON.stringify(Object.values(hazardsBySource).map(h => ({
  source: h.source,
  count: h.count,
  severity: h.severity
})), null, 2)}

Provide brief, tactical recommendations for each staging location (2-3 sentences each). Focus on:
- Safety considerations
- Proximity to affected areas
- Deployment logistics`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-5-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert in emergency response logistics and contractor deployment strategy.'
        },
        {
          role: 'user',
          content: stagingPrompt
        }
      ],
      max_completion_tokens: 800
    });
    
    const recommendations = completion.choices[0]?.message?.content || 'No recommendations available';
    
    console.log(`✅ Generated ${stagingLocations.length} staging location recommendations`);
    res.json({
      stagingLocations,
      recommendations,
      targetLocation: targetLat && targetLon ? { latitude: targetLat, longitude: targetLon } : null,
      safetyDistance: 20, // km
      generatedAt: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error calculating staging locations:', error);
    res.status(500).json({ 
      error: 'Failed to calculate staging locations',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
