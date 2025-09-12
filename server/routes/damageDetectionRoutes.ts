import express from 'express';
import { damageDetectionService } from '../services/damageDetection.js';
import { leadGenerationService } from '../services/leadGenerationService.js';
import { snapshotChecker } from '../detectors/snapshot-check.js';
import { providerRegistry } from '../providers/index.js';

const router = express.Router();

/**
 * POST /api/analyze-damage
 * Analyze an image for damage detection
 */
router.post('/analyze-damage', async (req, res) => {
  try {
    const { cameraId, imageData, location } = req.body;

    if (!imageData) {
      return res.status(400).json({ error: 'Image data is required' });
    }

    // Convert base64 image to buffer
    const imageBuffer = Buffer.from(imageData.replace(/^data:image\/[a-z]+;base64,/, ''), 'base64');
    
    console.log(`🔍 Analyzing damage for camera ${cameraId} (${imageBuffer.length} bytes)`);

    // Perform damage analysis
    const analysisResult = await damageDetectionService.analyzeImageForDamage(
      imageBuffer, 
      location || `Camera ${cameraId}`
    );

    // If significant damage detected, generate leads
    if (analysisResult.leadGenerated && analysisResult.maxProfitabilityScore >= 4) {
      try {
        const leadResult = await leadGenerationService.processDamageAnalysis(
          cameraId,
          cameraId, // Using cameraId as external ID for now
          analysisResult,
          {
            lat: 0, // Would extract from camera location
            lng: 0,
            address: location
          }
        );

        console.log(`💼 Generated ${leadResult.leadsGenerated} leads from damage analysis`);
        
        // Include lead generation results in response
        return res.json({
          ...analysisResult,
          leadGeneration: leadResult
        });
      } catch (leadError) {
        console.error('Lead generation failed:', leadError);
        // Still return analysis results even if lead generation fails
        return res.json(analysisResult);
      }
    }

    res.json(analysisResult);
  } catch (error) {
    console.error('Damage analysis failed:', error);
    res.status(500).json({ 
      error: 'Analysis failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/analyze-camera-snapshot
 * Capture and analyze a snapshot from a traffic camera
 */
router.post('/analyze-camera-snapshot', async (req, res) => {
  try {
    const { cameraId, state } = req.body;

    if (!cameraId || !state) {
      return res.status(400).json({ error: 'Camera ID and state are required' });
    }

    console.log(`📸 Analyzing snapshot from camera ${cameraId} in ${state}`);

    // Get camera directory for the state
    const directory = await providerRegistry.getUnified511Directory(state);
    const camera = directory.cameras.find(c => c.id === cameraId);

    if (!camera) {
      return res.status(404).json({ error: 'Camera not found' });
    }

    // Capture and analyze snapshot
    const result = await snapshotChecker.checkCameraSnapshot(camera);

    if (!result) {
      return res.status(500).json({ error: 'Failed to capture or analyze snapshot' });
    }

    res.json({
      cameraInfo: result.cameraInfo,
      analysisResult: result.analysisResult,
      imageSize: result.imageSize,
      timestamp: result.timestamp,
      hasDetection: result.analysisResult.hasDetection,
      leadGenerated: result.analysisResult.leadGenerated
    });
  } catch (error) {
    console.error('Camera snapshot analysis failed:', error);
    res.status(500).json({ 
      error: 'Snapshot analysis failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/batch-analyze-cameras
 * Analyze multiple cameras in a state for damage
 */
router.post('/batch-analyze-cameras', async (req, res) => {
  try {
    const { state, limit = 10 } = req.body;

    if (!state) {
      return res.status(400).json({ error: 'State is required' });
    }

    console.log(`🔍 Starting batch analysis for ${state} (limit: ${limit})`);

    // Get cameras for the state
    const directory = await providerRegistry.getUnified511Directory(state);
    const camerasToCheck = directory.cameras
      .filter(c => c.isActive && c.snapshotUrl)
      .slice(0, limit);

    if (camerasToCheck.length === 0) {
      return res.status(404).json({ error: 'No active cameras found in state' });
    }

    // Perform batch analysis
    const batchResult = await snapshotChecker.batchCheckCameras(camerasToCheck);

    res.json({
      state,
      totalChecked: batchResult.totalChecked,
      successfulCaptures: batchResult.successfulCaptures,
      detectedDamage: batchResult.detectedDamage,
      processingTimeMs: batchResult.processingTimeMs,
      timestamp: batchResult.timestamp,
      results: batchResult.results.map(r => ({
        cameraId: r.cameraId,
        cameraName: r.cameraInfo.name,
        hasDetection: r.analysisResult.hasDetection,
        severityScore: r.analysisResult.totalSeverityScore,
        profitabilityScore: r.analysisResult.maxProfitabilityScore,
        leadGenerated: r.analysisResult.leadGenerated,
        detections: r.analysisResult.detections.length,
        alertTypes: r.analysisResult.detections.map(d => d.alertType)
      })),
      errors: batchResult.errors
    });
  } catch (error) {
    console.error('Batch camera analysis failed:', error);
    res.status(500).json({ 
      error: 'Batch analysis failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/damage-alerts
 * Get active damage alerts with filtering
 */
router.get('/damage-alerts', async (req, res) => {
  try {
    const { 
      state, 
      severity, 
      minSeverityScore, 
      minProfitabilityScore,
      alertType,
      status = 'new',
      limit = 50 
    } = req.query;

    console.log(`📋 Fetching damage alerts with filters`);

    // Mock alerts for now - would use real storage interface
    const alerts = [
      {
        id: '1',
        alertType: 'roof_damage',
        severity: 'severe',
        severityScore: 8,
        profitabilityScore: 9,
        description: 'Significant roof damage detected on residential building',
        detectedAt: new Date(),
        resolvedAddress: '123 Storm Ave, Miami, FL',
        estimatedCost: { min: 15000, max: 25000, currency: 'USD' },
        status: 'new',
        leadGenerated: true,
        emergencyResponse: false
      }
    ];

    res.json({
      alerts,
      totalCount: alerts.length,
      filters: { state, severity, minSeverityScore, minProfitabilityScore, alertType, status }
    });
  } catch (error) {
    console.error('Failed to fetch damage alerts:', error);
    res.status(500).json({ 
      error: 'Failed to fetch alerts',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/lead-generation-stats
 * Get lead generation statistics
 */
router.get('/lead-generation-stats', async (req, res) => {
  try {
    const { timeframe = '24h' } = req.query;

    console.log(`📊 Fetching lead generation stats for timeframe: ${timeframe}`);

    // Mock stats - would calculate from real data
    const stats = {
      timeframe,
      alertsGenerated: 0,
      leadsGenerated: 0,
      contractorsNotified: 0,
      totalPotentialValue: 0,
      conversionRate: 0,
      averageSeverityScore: 0,
      averageProfitabilityScore: 0,
      topAlertTypes: [],
      topStates: [],
      emergencyAlerts: 0,
      highValueLeads: 0 // Leads over $10k
    };

    res.json(stats);
  } catch (error) {
    console.error('Failed to fetch lead generation stats:', error);
    res.status(500).json({ 
      error: 'Failed to fetch stats',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/verify-alert
 * Manually verify or reject an AI-generated alert
 */
router.post('/verify-alert/:alertId', async (req, res) => {
  try {
    const { alertId } = req.params;
    const { verified, notes, verifiedBy } = req.body;

    if (typeof verified !== 'boolean') {
      return res.status(400).json({ error: 'Verified status is required' });
    }

    console.log(`✅ ${verified ? 'Verifying' : 'Rejecting'} alert ${alertId}`);

    // Would update alert in database
    const updatedAlert = {
      id: alertId,
      isVerified: verified,
      verifiedBy: verifiedBy || 'manual_review',
      verifiedAt: new Date(),
      status: verified ? 'verified' : 'false_positive',
      notes
    };

    res.json({
      success: true,
      alert: updatedAlert,
      message: verified ? 'Alert verified successfully' : 'Alert marked as false positive'
    });
  } catch (error) {
    console.error('Failed to verify alert:', error);
    res.status(500).json({ 
      error: 'Verification failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;