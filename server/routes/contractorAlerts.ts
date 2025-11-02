import express from 'express';
import { contractorAlertService } from '../services/contractorAlertService.js';
import { storage } from '../storage.js';

const router = express.Router();

// Test the alert system with sample preferences
router.post('/test-alerts', async (req, res) => {
  try {
    const { email, phone, minScore = 70, states = [] } = req.body;

    // Get current high-value opportunities
    const opportunities = await storage.getHighOpportunityPredictions(minScore);

    if (opportunities.length === 0) {
      return res.json({
        success: true,
        message: 'No opportunities found matching criteria',
        opportunities: []
      });
    }

    // Create test preference
    const testPreference = {
      contractorId: 'test-contractor',
      email: email || undefined,
      phone: phone || undefined,
      minOpportunityScore: minScore,
      minRevenueThreshold: 100000,
      states: states.length > 0 ? states : undefined,
      alertTypes: [] as ('sms' | 'email')[],
      urgentOnly: false
    };

    if (email) testPreference.alertTypes.push('email');
    if (phone) testPreference.alertTypes.push('sms');

    // Send alerts
    const result = await contractorAlertService.checkAndAlertOpportunities(
      opportunities,
      [testPreference]
    );

    res.json({
      success: true,
      result,
      opportunities: opportunities.map(opp => ({
        id: opp.id,
        county: opp.county,
        state: opp.state,
        score: opp.opportunityScore,
        revenue: opp.estimatedRevenueOpportunity
      }))
    });
  } catch (error) {
    console.error('❌ Alert test failed:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Manual trigger for checking and sending alerts
router.post('/check-opportunities', async (req, res) => {
  try {
    const { minScore = 70 } = req.body;

    // Get high-value opportunities
    const opportunities = await storage.getHighOpportunityPredictions(minScore);

    // Sample contractor preferences (in production, load from database)
    const samplePreferences = [
      {
        contractorId: 'sample-contractor-1',
        email: process.env.ALERT_TEST_EMAIL || 'test@example.com',
        minOpportunityScore: 70,
        minRevenueThreshold: 100000,
        states: ['Florida', 'Georgia'],
        alertTypes: ['email'] as ('sms' | 'email')[],
        urgentOnly: false
      }
    ];

    const result = await contractorAlertService.checkAndAlertOpportunities(
      opportunities,
      samplePreferences
    );

    res.json({
      success: true,
      opportunities: opportunities.length,
      result,
      message: `Checked ${opportunities.length} opportunities, sent ${result.sent} alerts`
    });
  } catch (error) {
    console.error('❌ Opportunity check failed:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Reset alert tracking (for testing)
router.post('/reset', async (req, res) => {
  try {
    contractorAlertService.resetTracking();
    res.json({ success: true, message: 'Alert tracking reset' });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
