import express from 'express';
import { fallenTreeAlertService } from '../services/fallenTreeAlertService.js';
import { snapshotChecker } from '../detectors/snapshot-check.js';

const router = express.Router();

router.get('/tree-alerts/recent', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const alerts = fallenTreeAlertService.getRecentAlerts(limit);
    
    res.json({
      success: true,
      count: alerts.length,
      alerts
    });
  } catch (error) {
    console.error('Error fetching tree alerts:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch tree alerts' 
    });
  }
});

router.get('/tree-alerts/all', async (req, res) => {
  try {
    const alerts = fallenTreeAlertService.getAllAlerts();
    
    res.json({
      success: true,
      count: alerts.length,
      alerts
    });
  } catch (error) {
    console.error('Error fetching all tree alerts:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch tree alerts' 
    });
  }
});

router.post('/tree-alerts/test', async (req, res) => {
  try {
    console.log('🧪 TEST: Triggering manual fallen tree alert...');
    
    const testLocation = req.body.location || 'Columbus, GA - Test Location';
    const testState = req.body.state || 'GA';
    
    const mockSnapshotResult = {
      cameraId: 'test-camera-' + Date.now(),
      timestamp: new Date(),
      imageSize: 1024000,
      analysisResult: {
        hasDetection: true,
        detections: [{
          alertType: 'tree_down' as const,
          confidence: 95,
          severity: 'severe' as const,
          severityScore: 8,
          profitabilityScore: 9,
          description: 'Large tree has fallen across the roadway, completely blocking traffic. Tree appears to be approximately 3 feet in diameter. No visible power lines, but poses significant hazard to vehicles.',
          urgencyLevel: 'emergency' as const,
          contractorTypes: ['Tree Service', 'Emergency Cleanup'],
          contractorSpecializations: ['Large Tree Removal', 'Road Clearance', 'Emergency Response'],
          estimatedCost: {
            min: 5000,
            max: 15000,
            currency: 'USD' as const
          },
          workScope: [
            'Emergency tree removal',
            'Road clearance',
            'Debris cleanup',
            'Safety assessment'
          ],
          safetyHazards: [
            'Road blockage',
            'Heavy traffic area',
            'Potential vehicle damage risk'
          ],
          equipmentNeeded: [
            'Crane truck',
            'Wood chipper',
            'Chain saws',
            'Traffic cones and signs'
          ],
          accessibilityScore: 7,
          leadPriority: 'critical' as const,
          emergencyResponse: true,
          insuranceLikelihood: 8,
          competitionLevel: 'medium' as const
        }],
        analysisTimestamp: new Date(),
        processingTimeMs: 500,
        imageMetadata: {
          size: 1024000,
          format: 'jpeg'
        },
        confidence: 95,
        leadGenerated: true,
        totalSeverityScore: 8,
        maxProfitabilityScore: 9,
        recommendedActions: [
          'Dispatch emergency tree removal crew immediately',
          'Contact local authorities for road closure',
          'Assess for power line involvement'
        ],
        riskAssessment: {
          publicSafety: 9,
          propertyDamage: 7,
          businessDisruption: 8
        }
      },
      cameraInfo: {
        name: testLocation,
        state: testState,
        lat: 32.4609,
        lng: -84.9877,
        provider: 'test-provider'
      }
    };

    const notifications = await fallenTreeAlertService.processDetection(mockSnapshotResult);
    
    res.json({
      success: true,
      message: 'Test alert sent successfully',
      notifications,
      testData: {
        location: testLocation,
        state: testState,
        detection: mockSnapshotResult.analysisResult.detections[0]
      }
    });
  } catch (error) {
    console.error('Error sending test alert:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to send test alert' 
    });
  }
});

router.delete('/tree-alerts/clear', async (req, res) => {
  try {
    fallenTreeAlertService.clearAlerts();
    
    res.json({
      success: true,
      message: 'All tree alerts cleared'
    });
  } catch (error) {
    console.error('Error clearing tree alerts:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to clear tree alerts' 
    });
  }
});

export default router;
