import express from 'express';
import { nhcService } from '../services/nhcService.js';
import { usgsEarthquakeService } from '../services/usgsEarthquakeService.js';
import { nasaFirmsService } from '../services/nasaFirmsService.js';
import { auditLogService } from '../services/auditLogService.js';

const router = express.Router();

// ===== HURRICANES (NHC) =====
router.get('/hurricanes', async (req, res) => {
  try {
    const storms = await nhcService.fetchActiveStorms();
    auditLogService.logHazardIngest('NHC', storms.length, true);
    
    res.json({
      success: true,
      count: storms.length,
      storms,
      timestamp: new Date(),
    });
  } catch (error: any) {
    auditLogService.logHazardIngest('NHC', 0, false, error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

router.get('/hurricanes/:id', async (req, res) => {
  const storm = nhcService.getStormById(req.params.id);
  
  if (!storm) {
    return res.status(404).json({
      success: false,
      error: 'Storm not found',
    });
  }

  res.json({
    success: true,
    storm,
  });
});

// ===== EARTHQUAKES (USGS) =====
router.get('/earthquakes', async (req, res) => {
  try {
    const magnitude = parseFloat(req.query.minMagnitude as string) || 2.5;
    const earthquakes = await usgsEarthquakeService.fetchRecentEarthquakes(magnitude);
    auditLogService.logHazardIngest('USGS', earthquakes.length, true);
    
    res.json({
      success: true,
      count: earthquakes.length,
      earthquakes,
      timestamp: new Date(),
      minMagnitude: magnitude,
    });
  } catch (error: any) {
    auditLogService.logHazardIngest('USGS', 0, false, error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

router.get('/earthquakes/region', async (req, res) => {
  const lat = parseFloat(req.query.lat as string);
  const lon = parseFloat(req.query.lon as string);
  const radius = parseFloat(req.query.radius as string) || 500;

  if (isNaN(lat) || isNaN(lon)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid coordinates',
    });
  }

  const earthquakes = usgsEarthquakeService.getEarthquakesByRegion(lat, lon, radius);
  
  res.json({
    success: true,
    count: earthquakes.length,
    earthquakes,
    region: { lat, lon, radius },
  });
});

// ===== WILDFIRES (NASA FIRMS) =====
router.get('/wildfires', async (req, res) => {
  try {
    const days = parseInt(req.query.days as string) || 1;
    const wildfires = await nasaFirmsService.fetchUSWildfires(days);
    auditLogService.logHazardIngest('FIRMS', wildfires.length, true);
    
    res.json({
      success: true,
      count: wildfires.length,
      wildfires,
      timestamp: new Date(),
      days,
    });
  } catch (error: any) {
    auditLogService.logHazardIngest('FIRMS', 0, false, error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

router.get('/wildfires/region', async (req, res) => {
  try {
    const minLat = parseFloat(req.query.minLat as string);
    const maxLat = parseFloat(req.query.maxLat as string);
    const minLon = parseFloat(req.query.minLon as string);
    const maxLon = parseFloat(req.query.maxLon as string);
    const days = parseInt(req.query.days as string) || 1;

    if (isNaN(minLat) || isNaN(maxLat) || isNaN(minLon) || isNaN(maxLon)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid region bounds',
      });
    }

    const wildfires = await nasaFirmsService.fetchActiveWildfires({
      minLat, maxLat, minLon, maxLon
    }, days);
    
    res.json({
      success: true,
      count: wildfires.length,
      wildfires,
      region: { minLat, maxLat, minLon, maxLon },
      days,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ===== COMBINED DASHBOARD =====
router.get('/dashboard', async (req, res) => {
  try {
    const [storms, earthquakes, wildfires] = await Promise.all([
      nhcService.fetchActiveStorms(),
      usgsEarthquakeService.fetchRecentEarthquakes(4.0), // M4.0+ for dashboard
      nasaFirmsService.fetchUSWildfires(1),
    ]);

    res.json({
      success: true,
      timestamp: new Date(),
      hazards: {
        hurricanes: {
          count: storms.length,
          active: storms,
        },
        earthquakes: {
          count: earthquakes.length,
          recent: earthquakes.slice(0, 10), // Top 10
        },
        wildfires: {
          count: wildfires.length,
          active: wildfires.slice(0, 10), // Top 10
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ===== AUDIT LOGS =====
router.get('/audit-logs', async (req, res) => {
  const limit = parseInt(req.query.limit as string) || 100;
  const source = req.query.source as string;
  const eventType = req.query.eventType as string;

  const logs = auditLogService.getLogs({
    limit,
    source,
    eventType,
  });

  res.json({
    success: true,
    count: logs.length,
    logs,
  });
});

router.get('/audit-logs/stats', async (req, res) => {
  const stats = auditLogService.getStats();
  
  res.json({
    success: true,
    stats,
  });
});

export default router;
