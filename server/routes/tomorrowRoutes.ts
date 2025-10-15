import { Router, Request, Response } from 'express';
import { tomorrowService } from '../services/tomorrowService.js';

const router = Router();

/**
 * Tomorrow.io Weather Intelligence Routes
 * Premium hyperlocal weather, hail/wind footprints, severe weather alerts
 */

/**
 * GET /api/tomorrow/weather
 * Get comprehensive weather intelligence for a location
 * Query params: lat, lon, radius_km (optional, default: 25)
 */
router.get('/weather', async (req: Request, res: Response) => {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lon = parseFloat(req.query.lon as string);
    const radiusKm = req.query.radius_km ? parseFloat(req.query.radius_km as string) : 25;

    if (isNaN(lat) || isNaN(lon)) {
      return res.status(400).json({
        error: 'Invalid coordinates',
        message: 'Please provide valid lat and lon parameters'
      });
    }

    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      return res.status(400).json({
        error: 'Coordinates out of range',
        message: 'Latitude must be between -90 and 90, longitude between -180 and 180'
      });
    }

    const data = await tomorrowService.getWeatherIntelligence(lat, lon, radiusKm);

    return res.json({
      success: true,
      data,
      metadata: {
        location: { lat, lon },
        radiusKm,
        provider: 'Tomorrow.io',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Tomorrow.io weather route error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/tomorrow/hail
 * Get hail footprint data only
 * Query params: lat, lon, radius_km (optional)
 */
router.get('/hail', async (req: Request, res: Response) => {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lon = parseFloat(req.query.lon as string);
    const radiusKm = req.query.radius_km ? parseFloat(req.query.radius_km as string) : 25;

    if (isNaN(lat) || isNaN(lon)) {
      return res.status(400).json({
        error: 'Invalid coordinates',
        message: 'Please provide valid lat and lon parameters'
      });
    }

    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      return res.status(400).json({
        error: 'Coordinates out of range',
        message: 'Latitude must be between -90 and 90, longitude between -180 and 180'
      });
    }

    const data = await tomorrowService.getWeatherIntelligence(lat, lon, radiusKm);

    return res.json({
      success: true,
      data: {
        hailEvents: data.hailEvents,
        count: data.hailEvents.length,
        timestamp: data.timestamp
      },
      metadata: {
        location: { lat, lon },
        radiusKm,
        provider: 'Tomorrow.io'
      }
    });
  } catch (error) {
    console.error('Tomorrow.io hail route error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/tomorrow/wind
 * Get wind footprint data only
 * Query params: lat, lon, radius_km (optional)
 */
router.get('/wind', async (req: Request, res: Response) => {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lon = parseFloat(req.query.lon as string);
    const radiusKm = req.query.radius_km ? parseFloat(req.query.radius_km as string) : 25;

    if (isNaN(lat) || isNaN(lon)) {
      return res.status(400).json({
        error: 'Invalid coordinates',
        message: 'Please provide valid lat and lon parameters'
      });
    }

    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      return res.status(400).json({
        error: 'Coordinates out of range',
        message: 'Latitude must be between -90 and 90, longitude between -180 and 180'
      });
    }

    const data = await tomorrowService.getWeatherIntelligence(lat, lon, radiusKm);

    return res.json({
      success: true,
      data: {
        windEvents: data.windEvents,
        count: data.windEvents.length,
        timestamp: data.timestamp
      },
      metadata: {
        location: { lat, lon },
        radiusKm,
        provider: 'Tomorrow.io'
      }
    });
  } catch (error) {
    console.error('Tomorrow.io wind route error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/tomorrow/alerts
 * Get weather alerts only
 * Query params: lat, lon
 */
router.get('/alerts', async (req: Request, res: Response) => {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lon = parseFloat(req.query.lon as string);

    if (isNaN(lat) || isNaN(lon)) {
      return res.status(400).json({
        error: 'Invalid coordinates',
        message: 'Please provide valid lat and lon parameters'
      });
    }

    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      return res.status(400).json({
        error: 'Coordinates out of range',
        message: 'Latitude must be between -90 and 90, longitude between -180 and 180'
      });
    }

    const data = await tomorrowService.getWeatherIntelligence(lat, lon);

    return res.json({
      success: true,
      data: {
        alerts: data.alerts,
        count: data.alerts.length,
        timestamp: data.timestamp
      },
      metadata: {
        location: { lat, lon },
        provider: 'Tomorrow.io'
      }
    });
  } catch (error) {
    console.error('Tomorrow.io alerts route error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/tomorrow/health
 * Health check for Tomorrow.io service
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const hasApiKey = !!process.env.TOMORROW_API_KEY;

    // Test with a known good location (Kansas City)
    const testData = await tomorrowService.getWeatherIntelligence(39.0997, -94.5786, 10);

    return res.json({
      success: true,
      status: 'operational',
      provider: 'Tomorrow.io',
      apiKeyConfigured: hasApiKey,
      mode: hasApiKey ? 'live' : 'mock',
      testResults: {
        location: 'Kansas City, MO',
        hailEvents: testData.hailEvents.length,
        windEvents: testData.windEvents.length,
        alerts: testData.alerts.length,
        timestamp: testData.timestamp
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Tomorrow.io health check error:', error);
    return res.status(500).json({
      success: false,
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
