import { Router, Request, Response } from 'express';
import { aiOrchestrator } from '../services/aiIntelligenceOrchestrator';

const router = Router();

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

export default router;
