import express from 'express';
import { disasterAggregatorService } from '../services/disasterAggregatorService';

const router = express.Router();

/**
 * GET /api/aggregate
 * Multi-source disaster/weather event aggregation endpoint
 * Combines data from NWS, FEMA, NOAA, Xweather, and Ambee
 */
router.get('/aggregate', async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lon = parseFloat(req.query.lon as string);
    const radiusKm = parseFloat(req.query.radius_km as string) || 25;
    const hoursBack = parseInt(req.query.hours_back as string) || 72;

    // Validation
    if (isNaN(lat) || lat < -90 || lat > 90) {
      return res.status(400).json({ error: 'Invalid latitude (must be between -90 and 90)' });
    }
    if (isNaN(lon) || lon < -180 || lon > 180) {
      return res.status(400).json({ error: 'Invalid longitude (must be between -180 and 180)' });
    }
    if (radiusKm <= 0 || radiusKm > 500) {
      return res.status(400).json({ error: 'Invalid radius_km (must be between 0 and 500)' });
    }
    if (hoursBack < 1 || hoursBack > 720) {
      return res.status(400).json({ error: 'Invalid hours_back (must be between 1 and 720)' });
    }

    console.log(`🔄 Aggregator request: ${lat}, ${lon} (${radiusKm}km, ${hoursBack}h)`);

    const result = await disasterAggregatorService.aggregate(lat, lon, radiusKm, hoursBack);

    res.json(result);
  } catch (error: any) {
    console.error('❌ Aggregator error:', error);
    res.status(500).json({
      error: 'Failed to aggregate disaster events',
      details: error.message
    });
  }
});

/**
 * GET /api/risk-score
 * Quick risk score calculation for a location
 */
router.get('/risk-score', async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lon = parseFloat(req.query.lon as string);
    const radiusKm = parseFloat(req.query.radius_km as string) || 25;
    const hoursBack = parseInt(req.query.hours_back as string) || 72;

    // Validation
    if (isNaN(lat) || lat < -90 || lat > 90) {
      return res.status(400).json({ error: 'Invalid latitude' });
    }
    if (isNaN(lon) || lon < -180 || lon > 180) {
      return res.status(400).json({ error: 'Invalid longitude' });
    }

    const result = await disasterAggregatorService.aggregate(lat, lon, radiusKm, hoursBack);

    res.json({
      riskScore: result.riskScore,
      riskLevel: result.riskLevel,
      eventCount: result.events.length,
      generatedAt: result.generatedAt.toISOString()
    });
  } catch (error: any) {
    console.error('❌ Risk score error:', error);
    res.status(500).json({
      error: 'Failed to calculate risk score',
      details: error.message
    });
  }
});

/**
 * GET /api/aggregator/health
 * Health check endpoint
 */
router.get('/aggregator/health', (req, res) => {
  res.json({
    ok: true,
    service: 'DisasterAggregator',
    timestamp: new Date().toISOString()
  });
});

export default router;
