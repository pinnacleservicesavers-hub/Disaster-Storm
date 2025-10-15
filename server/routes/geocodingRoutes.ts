import { Router, Request, Response } from 'express';
import { geocodingService } from '../services/geocodingService';
import { geocodeCache, sendCachedJSON } from '../utils/lruCache';

const router = Router();

/**
 * GET /api/geocode
 * Forward geocoding: Convert city/address to coordinates
 * 
 * Query params:
 * - q: Query string (city name or address) - required
 * - limit: Maximum number of results - default: 1
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const query = req.query.q as string;
    const limit = Math.min(parseInt(req.query.limit as string) || 1, 10);

    if (!query || query.trim().length === 0) {
      return res.status(400).json({ error: 'q parameter is required' });
    }

    // Check cache
    const cacheKey = `geocode:${query.toLowerCase().trim()}:${limit}`;
    const cached = geocodeCache.get(cacheKey);
    
    if (cached) {
      return sendCachedJSON(req, res, cached, 300); // 5min client cache
    }

    // Geocode
    const results = await geocodingService.geocode(query, limit);

    // Cache for 5 minutes
    geocodeCache.set(cacheKey, results, 5 * 60 * 1000);

    return sendCachedJSON(req, res, results, 300);
  } catch (error: any) {
    console.error('Geocoding error:', error);
    return res.status(500).json({ 
      error: 'Geocoding failed',
      message: error.message 
    });
  }
});

/**
 * GET /api/geocode/reverse
 * Reverse geocoding: Convert coordinates to address
 * 
 * Query params:
 * - lat: Latitude (required)
 * - lon: Longitude (required)
 */
router.get('/reverse', async (req: Request, res: Response) => {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lon = parseFloat(req.query.lon as string);

    if (isNaN(lat) || isNaN(lon)) {
      return res.status(400).json({ error: 'lat and lon are required numbers' });
    }

    if (lat < -90 || lat > 90) {
      return res.status(400).json({ error: 'lat must be between -90 and 90' });
    }

    if (lon < -180 || lon > 180) {
      return res.status(400).json({ error: 'lon must be between -180 and 180' });
    }

    // Check cache
    const cacheKey = `reverse:${lat.toFixed(4)},${lon.toFixed(4)}`;
    const cached = geocodeCache.get(cacheKey);
    
    if (cached) {
      return sendCachedJSON(req, res, cached, 300);
    }

    // Reverse geocode
    const result = await geocodingService.reverseGeocode(lat, lon);

    // Cache for 5 minutes
    geocodeCache.set(cacheKey, result, 5 * 60 * 1000);

    return sendCachedJSON(req, res, result, 300);
  } catch (error: any) {
    console.error('Reverse geocoding error:', error);
    return res.status(500).json({ 
      error: 'Reverse geocoding failed',
      message: error.message 
    });
  }
});

/**
 * GET /api/geocode/autocomplete
 * Autocomplete suggestions for city/address
 * 
 * Query params:
 * - q: Partial query string - required
 * - limit: Maximum number of suggestions - default: 5
 */
router.get('/autocomplete', async (req: Request, res: Response) => {
  try {
    const query = req.query.q as string;
    const limit = Math.min(parseInt(req.query.limit as string) || 5, 10);

    if (!query || query.trim().length < 2) {
      return res.json([]); // Return empty for very short queries
    }

    // Check cache
    const cacheKey = `autocomplete:${query.toLowerCase().trim()}:${limit}`;
    const cached = geocodeCache.get(cacheKey);
    
    if (cached) {
      return sendCachedJSON(req, res, cached, 300);
    }

    // Autocomplete
    const results = await geocodingService.autocomplete(query, limit);

    // Cache for 5 minutes
    geocodeCache.set(cacheKey, results, 5 * 60 * 1000);

    return sendCachedJSON(req, res, results, 300);
  } catch (error: any) {
    console.error('Autocomplete error:', error);
    return res.status(500).json({ 
      error: 'Autocomplete failed',
      message: error.message 
    });
  }
});

/**
 * GET /api/geocode/city
 * Convenience endpoint to geocode a city and get the first result
 * 
 * Query params:
 * - q: City name - required
 */
router.get('/city', async (req: Request, res: Response) => {
  try {
    const query = req.query.q as string;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({ error: 'q parameter is required' });
    }

    // Check cache
    const cacheKey = `city:${query.toLowerCase().trim()}`;
    const cached = geocodeCache.get(cacheKey);
    
    if (cached) {
      return sendCachedJSON(req, res, cached, 300);
    }

    // Geocode city
    const result = await geocodingService.geocodeCity(query);

    // Cache for 5 minutes
    geocodeCache.set(cacheKey, result, 5 * 60 * 1000);

    return sendCachedJSON(req, res, result, 300);
  } catch (error: any) {
    console.error('City geocoding error:', error);
    return res.status(500).json({ 
      error: 'City geocoding failed',
      message: error.message 
    });
  }
});

export default router;
