import { Router, Request, Response } from 'express';
import { nwsForecastService } from '../services/nwsForecastService';
import { forecastCache, sendCachedJSON } from '../utils/lruCache';

const router = Router();

/**
 * GET /api/nws/forecast
 * Get comprehensive forecast (daily + hourly + alerts) for a location
 * 
 * Query params:
 * - lat: Latitude (required)
 * - lon: Longitude (required)
 * - units: 'imperial' (°F, mph) or 'metric' (°C, km/h) - default: 'imperial'
 */
router.get('/forecast', async (req: Request, res: Response) => {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lon = parseFloat(req.query.lon as string);
    const units = (req.query.units as string || 'imperial') as 'imperial' | 'metric';

    if (isNaN(lat) || isNaN(lon)) {
      return res.status(400).json({ error: 'lat and lon are required numbers' });
    }

    if (lat < -90 || lat > 90) {
      return res.status(400).json({ error: 'lat must be between -90 and 90' });
    }

    if (lon < -180 || lon > 180) {
      return res.status(400).json({ error: 'lon must be between -180 and 180' });
    }

    if (units !== 'imperial' && units !== 'metric') {
      return res.status(400).json({ error: 'units must be "imperial" or "metric"' });
    }

    // Check cache
    const cacheKey = `forecast:${units}:${lat.toFixed(4)},${lon.toFixed(4)}`;
    const cached = forecastCache.get(cacheKey);
    
    if (cached) {
      return sendCachedJSON(req, res, cached, 90); // 90s client cache
    }

    // Fetch from NWS
    const forecast = await nwsForecastService.getForecast(lat, lon, units);

    // Cache for 90 seconds
    forecastCache.set(cacheKey, forecast, 90_000);

    return sendCachedJSON(req, res, forecast, 90); // 90s client cache
  } catch (error: any) {
    console.error('NWS forecast error:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch forecast',
      message: error.message 
    });
  }
});

/**
 * GET /api/nws/forecast/daily
 * Get only daily forecast
 * 
 * Query params:
 * - lat: Latitude (required)
 * - lon: Longitude (required)
 * - units: 'imperial' or 'metric' - default: 'imperial'
 */
router.get('/forecast/daily', async (req: Request, res: Response) => {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lon = parseFloat(req.query.lon as string);
    const units = (req.query.units as string || 'imperial') as 'imperial' | 'metric';

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
    const cacheKey = `daily:${units}:${lat.toFixed(4)},${lon.toFixed(4)}`;
    const cached = forecastCache.get(cacheKey);
    
    if (cached) {
      return sendCachedJSON(req, res, cached, 90);
    }

    // Fetch from NWS
    const periods = await nwsForecastService.getDailyForecast(lat, lon, units);

    // Cache for 90 seconds
    forecastCache.set(cacheKey, periods, 90_000);

    return sendCachedJSON(req, res, periods, 90);
  } catch (error: any) {
    console.error('NWS daily forecast error:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch daily forecast',
      message: error.message 
    });
  }
});

/**
 * GET /api/nws/forecast/hourly
 * Get only hourly forecast
 * 
 * Query params:
 * - lat: Latitude (required)
 * - lon: Longitude (required)
 * - units: 'imperial' or 'metric' - default: 'imperial'
 * - hours: Number of hours to fetch - default: 24, max: 156
 */
router.get('/forecast/hourly', async (req: Request, res: Response) => {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lon = parseFloat(req.query.lon as string);
    const units = (req.query.units as string || 'imperial') as 'imperial' | 'metric';
    const hours = Math.min(parseInt(req.query.hours as string) || 24, 156);

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
    const cacheKey = `hourly:${units}:${hours}:${lat.toFixed(4)},${lon.toFixed(4)}`;
    const cached = forecastCache.get(cacheKey);
    
    if (cached) {
      return sendCachedJSON(req, res, cached, 90);
    }

    // Fetch from NWS
    const periods = await nwsForecastService.getHourlyForecast(lat, lon, units, hours);

    // Cache for 90 seconds
    forecastCache.set(cacheKey, periods, 90_000);

    return sendCachedJSON(req, res, periods, 90);
  } catch (error: any) {
    console.error('NWS hourly forecast error:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch hourly forecast',
      message: error.message 
    });
  }
});

router.get('/alerts', async (req: Request, res: Response) => {
  try {
    const { state, area, event } = req.query;
    let url = 'https://api.weather.gov/alerts/active?status=actual';
    if (state) url += `&area=${state}`;
    if (area) url += `&area=${area}`;
    if (event) url += `&event=${encodeURIComponent(event as string)}`;

    const response = await fetch(url, {
      headers: { 'User-Agent': 'DisasterDirect/1.0', 'Accept': 'application/geo+json' }
    });
    if (!response.ok) {
      return res.json({ success: true, alerts: [] });
    }
    const data = await response.json();
    const alerts = (data.features || []).slice(0, 200).map((f: any) => ({
      id: f.properties?.id || f.id,
      event: f.properties?.event,
      headline: f.properties?.headline,
      severity: f.properties?.severity,
      urgency: f.properties?.urgency,
      certainty: f.properties?.certainty,
      areaDesc: f.properties?.areaDesc,
      onset: f.properties?.onset,
      expires: f.properties?.expires,
      senderName: f.properties?.senderName,
    }));
    res.json({ success: true, alerts });
  } catch (error: any) {
    console.error('NWS alerts error:', error.message);
    res.json({ success: true, alerts: [] });
  }
});

export default router;
