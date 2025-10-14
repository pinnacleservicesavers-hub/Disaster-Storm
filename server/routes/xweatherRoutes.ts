import { Router } from 'express';
import { xweatherService } from '../services/xweatherService.js';

const router = Router();

// ==================== LIGHTNING ROUTES ====================

/**
 * GET /api/xweather/lightning/strikes
 * Get recent lightning strikes (past 5 minutes)
 * Query params: lat, lng, radius (optional, default 50km, max 100km)
 */
router.get('/lightning/strikes', async (req, res) => {
  try {
    const { lat, lng, radius } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const latitude = parseFloat(lat as string);
    const longitude = parseFloat(lng as string);
    const radiusKM = radius ? parseFloat(radius as string) : 50;

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return res.status(400).json({ error: 'Invalid coordinates' });
    }

    if (radiusKM > 100) {
      return res.status(400).json({ error: 'Radius cannot exceed 100km' });
    }

    const strikes = await xweatherService.getLightningStrikes(latitude, longitude, radiusKM);

    res.json({
      location: { lat: latitude, lng: longitude, radiusKM },
      strikes,
      count: strikes.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error fetching lightning strikes:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/xweather/lightning/threats
 * Get lightning threats forecast (next 60 minutes)
 * Query params: lat, lng
 */
router.get('/lightning/threats', async (req, res) => {
  try {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const latitude = parseFloat(lat as string);
    const longitude = parseFloat(lng as string);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return res.status(400).json({ error: 'Invalid coordinates' });
    }

    const threats = await xweatherService.getLightningThreats(latitude, longitude);

    res.json({
      location: { lat: latitude, lng: longitude },
      threats,
      count: threats.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error fetching lightning threats:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== HAIL ROUTES ====================

/**
 * GET /api/xweather/hail/threats
 * Get hail threats nowcast (next 60 minutes in 10-min intervals)
 * Query params: lat, lng
 */
router.get('/hail/threats', async (req, res) => {
  try {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const latitude = parseFloat(lat as string);
    const longitude = parseFloat(lng as string);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return res.status(400).json({ error: 'Invalid coordinates' });
    }

    const threats = await xweatherService.getHailThreats(latitude, longitude);

    // Calculate max hail size across all threats
    const maxHailSize = threats.reduce((max, threat) => {
      const threatMax = Math.max(...threat.periods.map(p => p.hail.sizeIN), 0);
      return Math.max(max, threatMax);
    }, 0);

    res.json({
      location: { lat: latitude, lng: longitude },
      threats,
      count: threats.length,
      maxHailSizeIN: maxHailSize,
      maxHailSizeMM: maxHailSize * 25.4,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error fetching hail threats:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== STORM THREAT ROUTES ====================

/**
 * GET /api/xweather/storms/threats
 * Get comprehensive storm threats (integrates cells, radar, lightning, warnings)
 * Query params: lat, lng
 */
router.get('/storms/threats', async (req, res) => {
  try {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const latitude = parseFloat(lat as string);
    const longitude = parseFloat(lng as string);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return res.status(400).json({ error: 'Invalid coordinates' });
    }

    const threats = await xweatherService.getStormThreats(latitude, longitude);

    res.json({
      location: { lat: latitude, lng: longitude },
      threats,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error fetching storm threats:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/xweather/storms/reports
 * Get NWS local storm reports (US only)
 * Query params: lat, lng, radius (optional, default 50km), category (optional filter)
 */
router.get('/storms/reports', async (req, res) => {
  try {
    const { lat, lng, radius, category } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const latitude = parseFloat(lat as string);
    const longitude = parseFloat(lng as string);
    const radiusKM = radius ? parseFloat(radius as string) : 50;

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return res.status(400).json({ error: 'Invalid coordinates' });
    }

    const reports = await xweatherService.getStormReports(
      latitude,
      longitude,
      radiusKM,
      category as string | undefined
    );

    // Group reports by category
    const categoryCounts = reports.reduce((acc, report) => {
      const cat = report.ob.category;
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    res.json({
      location: { lat: latitude, lng: longitude, radiusKM },
      reports,
      count: reports.length,
      byCategory: categoryCounts,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error fetching storm reports:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== COMPREHENSIVE INTELLIGENCE ROUTE ====================

/**
 * GET /api/xweather/comprehensive
 * Get all storm intelligence in one call (lightning, hail, storms, reports)
 * This is the primary endpoint for complete storm data
 * Query params: lat, lng, radius (optional, default 50km)
 */
router.get('/comprehensive', async (req, res) => {
  try {
    const { lat, lng, radius } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const latitude = parseFloat(lat as string);
    const longitude = parseFloat(lng as string);
    const radiusKM = radius ? parseFloat(radius as string) : 50;

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return res.status(400).json({ error: 'Invalid coordinates' });
    }

    const data = await xweatherService.getComprehensiveStormData(latitude, longitude, radiusKM);
    const threatAnalysis = xweatherService.analyzeThreatLevel(data);

    res.json({
      ...data,
      threatAnalysis,
    });
  } catch (error: any) {
    console.error('Error fetching comprehensive storm data:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== THREAT ANALYSIS ROUTE ====================

/**
 * GET /api/xweather/threat-level
 * Get quick threat level analysis for a location
 * Query params: lat, lng, radius (optional, default 50km)
 */
router.get('/threat-level', async (req, res) => {
  try {
    const { lat, lng, radius } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const latitude = parseFloat(lat as string);
    const longitude = parseFloat(lng as string);
    const radiusKM = radius ? parseFloat(radius as string) : 50;

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return res.status(400).json({ error: 'Invalid coordinates' });
    }

    const data = await xweatherService.getComprehensiveStormData(latitude, longitude, radiusKM);
    const analysis = xweatherService.analyzeThreatLevel(data);

    res.json({
      location: { lat: latitude, lng: longitude, radiusKM },
      ...analysis,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error analyzing threat level:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== HEALTH CHECK ====================

/**
 * GET /api/xweather/health
 * Check if Xweather service is properly configured
 */
router.get('/health', async (req, res) => {
  try {
    const hasCredentials = !!(process.env.XWEATHER_CLIENT_ID && process.env.XWEATHER_CLIENT_SECRET);

    res.json({
      status: hasCredentials ? 'configured' : 'missing_credentials',
      service: 'xweather',
      capabilities: {
        lightning: hasCredentials,
        hail: hasCredentials,
        storms: hasCredentials,
        reports: hasCredentials,
      },
      message: hasCredentials
        ? 'Xweather service ready'
        : 'Xweather credentials not configured - using mock data',
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
