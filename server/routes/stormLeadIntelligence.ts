import { Router, Request, Response } from 'express';
import { stormLeadIntelligence, WeatherTriggerConfig } from '../services/stormLeadIntelligence';

const router = Router();

/**
 * Generate leads from storm prediction
 * POST /api/storm-leads/generate/:stormId
 */
router.post('/generate/:stormId', async (req: Request, res: Response) => {
  try {
    const { stormId } = req.params;
    
    if (!stormId) {
      return res.status(400).json({ error: 'Storm ID is required' });
    }

    const result = await stormLeadIntelligence.generateLeadsFromStormPrediction(stormId);
    
    res.json({
      success: true,
      result,
      message: `Generated ${result.leadsCreated} leads from storm ${stormId}`
    });
  } catch (error: any) {
    console.error('Error generating leads from storm:', error);
    res.status(500).json({ 
      error: 'Failed to generate leads from storm prediction',
      details: error.message 
    });
  }
});

/**
 * Monitor social media for storm damage posts
 * POST /api/storm-leads/monitor-social
 */
router.post('/monitor-social', async (req: Request, res: Response) => {
  try {
    const { keywords, location, radiusMiles } = req.body;

    if (!keywords || !location) {
      return res.status(400).json({ error: 'Keywords and location are required' });
    }

    // Monitor social media
    const posts = await stormLeadIntelligence.monitorSocialMedia(
      keywords,
      location,
      radiusMiles || 25
    );

    // Convert posts to leads
    const leads = await stormLeadIntelligence.convertSocialMediaPostsToLeads(posts);

    res.json({
      success: true,
      postsFound: posts.length,
      leadsCreated: leads.length,
      posts,
      leads
    });
  } catch (error: any) {
    console.error('Error monitoring social media:', error);
    res.status(500).json({ 
      error: 'Failed to monitor social media',
      details: error.message 
    });
  }
});

/**
 * Setup weather-triggered lead generation
 * POST /api/storm-leads/setup-trigger
 */
router.post('/setup-trigger', async (req: Request, res: Response) => {
  try {
    const config: WeatherTriggerConfig = req.body;

    if (!config.windSpeedMph || !config.county || !config.state) {
      return res.status(400).json({ error: 'Wind speed, county, and state are required' });
    }

    const success = await stormLeadIntelligence.setupWeatherTrigger(config);

    res.json({
      success,
      message: success 
        ? `Weather trigger setup for ${config.county}, ${config.state} at ${config.windSpeedMph}mph`
        : 'Failed to setup weather trigger'
    });
  } catch (error: any) {
    console.error('Error setting up weather trigger:', error);
    res.status(500).json({ 
      error: 'Failed to setup weather trigger',
      details: error.message 
    });
  }
});

/**
 * Get active geo-capture zones
 * GET /api/storm-leads/geo-capture-zones
 */
router.get('/geo-capture-zones', async (req: Request, res: Response) => {
  try {
    const zones = stormLeadIntelligence.getActiveGeoCaptureZones();

    res.json({
      success: true,
      count: zones.length,
      zones
    });
  } catch (error: any) {
    console.error('Error fetching geo-capture zones:', error);
    res.status(500).json({ 
      error: 'Failed to fetch geo-capture zones',
      details: error.message 
    });
  }
});

/**
 * Get geo-capture zone stats
 * GET /api/storm-leads/geo-capture-zones/:zoneId
 */
router.get('/geo-capture-zones/:zoneId', async (req: Request, res: Response) => {
  try {
    const { zoneId } = req.params;
    const stats = stormLeadIntelligence.getGeoCaptureStats(zoneId);

    if (!stats) {
      return res.status(404).json({ error: 'Geo-capture zone not found' });
    }

    res.json({
      success: true,
      stats
    });
  } catch (error: any) {
    console.error('Error fetching geo-capture stats:', error);
    res.status(500).json({ 
      error: 'Failed to fetch geo-capture stats',
      details: error.message 
    });
  }
});

export default router;
