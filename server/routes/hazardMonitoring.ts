import express from 'express';
import fetch from 'node-fetch';
import { nhcService } from '../services/nhcService.js';
import { usgsEarthquakeService } from '../services/usgsEarthquakeService.js';
import { nasaFirmsService } from '../services/nasaFirmsService.js';
import { auditLogService } from '../services/auditLogService.js';
import { mrmsService } from '../services/noaaMrmsService.js';
import { windModelService } from '../services/windModelService.js';
import { coOpsService } from '../services/noaaCoOpsService.js';
import { riverGaugeService } from '../services/usgsRiverGaugeService.js';
import { smokeService } from '../services/noaaSmokeService.js';

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

// ===== COMBINED DASHBOARD (ALL DATA SOURCES) =====
router.get('/dashboard', async (req, res) => {
  try {
    const [storms, earthquakes, wildfires, radarData, windData, surgeData, riverData, smokeData] = await Promise.all([
      nhcService.fetchActiveStorms(),
      usgsEarthquakeService.fetchRecentEarthquakes(2.5), // M2.5+ for dashboard
      nasaFirmsService.fetchUSWildfires(1),
      mrmsService.getRecentRadarData(),
      windModelService.getWindForecasts(12),
      coOpsService.getCurrentSurgeData(),
      riverGaugeService.getCurrentGaugeData(),
      smokeService.getCurrentSmokeData(),
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
        radar: {
          significantCells: radarData.summary.significantCells,
          maxPrecipRate: radarData.summary.maxPrecipRate,
          maxHailSize: radarData.summary.maxHailSize,
          heavyPrecip: radarData.data.filter(d => d.precipRate > 50).length,
        },
        wind: {
          maxWindSpeed: windData.maxWindSpeed,
          maxGust: windData.maxGust,
          highWindCorridors: windData.highWindCorridors.length,
          extremeWindAreas: windData.forecasts.filter(f => f.severity === 'extreme').length,
        },
        surge: {
          maxSurge: surgeData.maxSurge,
          criticalStations: surgeData.criticalStations.length,
          monitoringStations: surgeData.count,
        },
        rivers: {
          totalGauges: riverData.count,
          floodingGauges: riverData.floodingGauges,
          criticalGauges: riverData.criticalGauges.length,
        },
        smoke: {
          affectedAreas: smokeData.count,
          maxDensity: smokeData.maxDensity,
          poorVisibilityAreas: smokeData.poorVisibilityAreas.length,
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

// ===== RADAR & PRECIPITATION (NOAA MRMS) =====
router.get('/radar', async (req, res) => {
  try {
    const radarData = await mrmsService.getRecentRadarData();
    auditLogService.logHazardIngest('MRMS', radarData.count, true);
    
    res.json({
      success: true,
      ...radarData,
      timestamp: new Date(),
    });
  } catch (error: any) {
    auditLogService.logHazardIngest('MRMS', 0, false, error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

router.get('/hail', async (req, res) => {
  try {
    const minSize = parseFloat(req.query.minSize as string) || 0.5;
    const hailData = await mrmsService.getHailReports(minSize);
    
    res.json({
      success: true,
      ...hailData,
      minSize,
      timestamp: new Date(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ===== WIND MODELS (GFS/HRRR) =====
router.get('/wind', async (req, res) => {
  try {
    const forecastHours = parseInt(req.query.forecastHours as string) || 12;
    const windData = await windModelService.getWindForecasts(forecastHours);
    auditLogService.logHazardIngest('WindModels', windData.count, true);
    
    res.json({
      success: true,
      ...windData,
      forecastHours,
      timestamp: new Date(),
    });
  } catch (error: any) {
    auditLogService.logHazardIngest('WindModels', 0, false, error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

router.get('/wind/staging-recommendations', async (req, res) => {
  try {
    const recommendations = await windModelService.getStagingRecommendations();
    
    res.json({
      success: true,
      recommendations,
      timestamp: new Date(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ===== COASTAL SURGE (NOAA CO-OPS) =====
router.get('/surge', async (req, res) => {
  try {
    const state = req.query.state as string;
    const surgeData = await coOpsService.getCurrentSurgeData(state);
    auditLogService.logHazardIngest('COOPS', surgeData.count, true);
    
    res.json({
      success: true,
      ...surgeData,
      timestamp: new Date(),
    });
  } catch (error: any) {
    auditLogService.logHazardIngest('COOPS', 0, false, error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

router.get('/surge/flood-risk', async (req, res) => {
  try {
    const state = req.query.state as string;
    const floodRisk = await coOpsService.getCoastalFloodRisk(state);
    
    res.json({
      success: true,
      floodRisk,
      timestamp: new Date(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ===== RIVER GAUGES (USGS) =====
router.get('/rivers', async (req, res) => {
  try {
    const state = req.query.state as string;
    const riverData = await riverGaugeService.getCurrentGaugeData(state);
    auditLogService.logHazardIngest('USGSRivers', riverData.count, true);
    
    res.json({
      success: true,
      ...riverData,
      timestamp: new Date(),
    });
  } catch (error: any) {
    auditLogService.logHazardIngest('USGSRivers', 0, false, error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

router.get('/rivers/flood-risk', async (req, res) => {
  try {
    const state = req.query.state as string || 'FL';
    const floodRisk = await riverGaugeService.getFloodRiskByState(state);
    
    res.json({
      success: true,
      state,
      ...floodRisk,
      timestamp: new Date(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ===== WILDFIRE SMOKE (NOAA HMS) =====
router.get('/smoke', async (req, res) => {
  try {
    const smokeData = await smokeService.getCurrentSmokeData();
    auditLogService.logHazardIngest('NOAA_HMS', smokeData.count, true);
    
    res.json({
      success: true,
      ...smokeData,
      timestamp: new Date(),
    });
  } catch (error: any) {
    auditLogService.logHazardIngest('NOAA_HMS', 0, false, error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

router.get('/smoke/air-quality', async (req, res) => {
  try {
    const minAqi = parseInt(req.query.minAqi as string) || 150;
    const alerts = await smokeService.getAirQualityAlerts(minAqi);
    
    res.json({
      success: true,
      ...alerts,
      minAqi,
      timestamp: new Date(),
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

// ===== HAZARD SUMMARY (for dashboard quick stats) =====
router.get('/summary', async (req, res) => {
  try {
    const [storms, earthquakes, wildfires, winterAlerts, tornadoAlerts, tropicalStormAlerts] = await Promise.all([
      nhcService.fetchActiveStorms(),
      usgsEarthquakeService.fetchRecentEarthquakes(2.5),
      nasaFirmsService.fetchUSWildfires(1),
      // Fetch winter weather alerts from NWS
      (async () => {
        try {
          const winterEvents = encodeURIComponent('Blizzard Warning,Blizzard Watch,Ice Storm Warning,Ice Storm Watch,Winter Storm Warning,Winter Storm Watch,Winter Weather Advisory');
          const url = `https://api.weather.gov/alerts/active?event=${winterEvents}`;
          const response = await fetch(url, {
            headers: {
              'User-Agent': 'DisasterDirect/1.0',
              'Accept': 'application/geo+json'
            }
          });
          if (!response.ok) return 0;
          const data: any = await response.json();
          return (data.features || []).length;
        } catch (e) {
          console.error('Winter alerts error:', e);
          return 0;
        }
      })(),
      // Fetch tornado alerts from NWS
      (async () => {
        try {
          const tornadoEvents = encodeURIComponent('Tornado Warning,Tornado Watch');
          const url = `https://api.weather.gov/alerts/active?event=${tornadoEvents}`;
          const response = await fetch(url, {
            headers: {
              'User-Agent': 'DisasterDirect/1.0',
              'Accept': 'application/geo+json'
            }
          });
          if (!response.ok) return 0;
          const data: any = await response.json();
          return (data.features || []).length;
        } catch (e) {
          console.error('Tornado alerts error:', e);
          return 0;
        }
      })(),
      // Fetch tropical storm alerts from NWS
      (async () => {
        try {
          const tropicalEvents = encodeURIComponent('Tropical Storm Warning,Tropical Storm Watch');
          const url = `https://api.weather.gov/alerts/active?event=${tropicalEvents}`;
          const response = await fetch(url, {
            headers: {
              'User-Agent': 'DisasterDirect/1.0',
              'Accept': 'application/geo+json'
            }
          });
          if (!response.ok) return 0;
          const data: any = await response.json();
          return (data.features || []).length;
        } catch (e) {
          console.error('Tropical storm alerts error:', e);
          return 0;
        }
      })()
    ]);

    res.json({
      success: true,
      hurricanes: storms.length,
      earthquakes: earthquakes.length,
      wildfires: wildfires.length,
      winterStorms: winterAlerts,
      tornadoes: tornadoAlerts,
      tropicalStorms: tropicalStormAlerts,
      total: storms.length + earthquakes.length + wildfires.length + winterAlerts + tornadoAlerts + tropicalStormAlerts,
      timestamp: new Date(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
