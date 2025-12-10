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

// ===== PREDICTIONS INTELLIGENCE (for Storm Predictions module) =====
// This endpoint aggregates all hazard data and transforms it into contractor-focused insights
router.get('/predictions/intelligence', async (req, res) => {
  try {
    // Fetch all hazard data in parallel
    const [storms, earthquakes, wildfires, nwsAlerts] = await Promise.all([
      nhcService.fetchActiveStorms(),
      usgsEarthquakeService.fetchRecentEarthquakes(3.5), // Higher magnitude for significant events
      nasaFirmsService.fetchUSWildfires(1),
      // Fetch all severe weather alerts
      (async () => {
        try {
          const url = 'https://api.weather.gov/alerts/active?status=actual&urgency=Immediate,Expected';
          const response = await fetch(url, {
            headers: {
              'User-Agent': 'DisasterDirect/1.0',
              'Accept': 'application/geo+json'
            }
          });
          if (!response.ok) return [];
          const data: any = await response.json();
          return data.features || [];
        } catch (e) {
          console.error('NWS alerts error:', e);
          return [];
        }
      })()
    ]);

    // Revenue assumptions per hazard type (average job value)
    const revenueModel = {
      hurricane: { avgJobValue: 45000, jobsPerEvent: 150 },
      tropicalStorm: { avgJobValue: 25000, jobsPerEvent: 80 },
      tornado: { avgJobValue: 35000, jobsPerEvent: 50 },
      winterStorm: { avgJobValue: 8000, jobsPerEvent: 200 },
      earthquake: { avgJobValue: 55000, jobsPerEvent: 100 },
      wildfire: { avgJobValue: 75000, jobsPerEvent: 40 },
      flood: { avgJobValue: 22000, jobsPerEvent: 120 },
      hail: { avgJobValue: 15000, jobsPerEvent: 300 },
      wind: { avgJobValue: 12000, jobsPerEvent: 100 }
    };

    // Parse state from NWS alert areas
    const extractLocationFromAlert = (alert: any) => {
      const props = alert.properties || {};
      const areaDesc = props.areaDesc || '';
      // Parse state abbreviation from area description
      const stateMatch = areaDesc.match(/,\s*([A-Z]{2})(?:\s|$|;)/);
      const state = stateMatch ? stateMatch[1] : areaDesc.split(';')[0]?.trim();
      // Get counties/zones
      const counties = areaDesc.split(';').map((c: string) => c.trim()).filter((c: string) => c);
      return { state, counties, fullArea: areaDesc };
    };

    // Categorize NWS alerts by hazard type
    const categorizeAlert = (alert: any) => {
      const event = (alert.properties?.event || '').toLowerCase();
      if (event.includes('hurricane')) return 'hurricane';
      if (event.includes('tropical storm')) return 'tropicalStorm';
      if (event.includes('tornado')) return 'tornado';
      if (event.includes('winter') || event.includes('blizzard') || event.includes('ice storm') || event.includes('snow')) return 'winterStorm';
      if (event.includes('flood')) return 'flood';
      if (event.includes('hail')) return 'hail';
      if (event.includes('wind') || event.includes('high wind')) return 'wind';
      return 'other';
    };

    // Build Active Storms list (tropical systems)
    const activeStorms: any[] = [];
    
    // Add NHC storms
    storms.forEach(storm => {
      activeStorms.push({
        id: storm.id,
        name: storm.name,
        type: storm.classification,
        category: storm.intensity || 0,
        windSpeed: storm.windSpeed,
        pressure: storm.pressure,
        location: {
          latitude: storm.latitude,
          longitude: storm.longitude,
          state: null, // Would need reverse geocoding
          description: `${storm.latitude.toFixed(1)}°N, ${Math.abs(storm.longitude).toFixed(1)}°W`
        },
        movement: storm.movement,
        lastUpdate: storm.lastUpdate,
        estimatedRevenue: storm.intensity >= 1 
          ? revenueModel.hurricane.avgJobValue * revenueModel.hurricane.jobsPerEvent
          : revenueModel.tropicalStorm.avgJobValue * revenueModel.tropicalStorm.jobsPerEvent,
        estimatedJobs: storm.intensity >= 1 ? revenueModel.hurricane.jobsPerEvent : revenueModel.tropicalStorm.jobsPerEvent
      });
    });

    // Add tropical NWS alerts
    nwsAlerts.filter((a: any) => {
      const event = (a.properties?.event || '').toLowerCase();
      return event.includes('tropical') || event.includes('hurricane');
    }).forEach((alert: any) => {
      const location = extractLocationFromAlert(alert);
      activeStorms.push({
        id: alert.properties.id || `nws-${Date.now()}`,
        name: alert.properties.headline || alert.properties.event,
        type: alert.properties.event,
        category: 0,
        windSpeed: null,
        pressure: null,
        location: {
          latitude: null,
          longitude: null,
          state: location.state,
          counties: location.counties,
          description: location.fullArea
        },
        severity: alert.properties.severity,
        urgency: alert.properties.urgency,
        lastUpdate: alert.properties.sent,
        estimatedRevenue: revenueModel.tropicalStorm.avgJobValue * revenueModel.tropicalStorm.jobsPerEvent * 0.5,
        estimatedJobs: Math.round(revenueModel.tropicalStorm.jobsPerEvent * 0.5)
      });
    });

    // Build Impact Zones from all hazard sources
    const impactZones: any[] = [];
    const stateImpacts = new Map<string, { hazards: any[], totalRevenue: number, totalJobs: number }>();

    // Process NWS alerts into impact zones
    nwsAlerts.forEach((alert: any) => {
      const category = categorizeAlert(alert);
      if (category === 'other') return;
      
      const location = extractLocationFromAlert(alert);
      const model = revenueModel[category as keyof typeof revenueModel] || revenueModel.wind;
      const confidence = alert.properties?.certainty === 'Observed' ? 0.9 : 
                        alert.properties?.certainty === 'Likely' ? 0.7 : 0.5;
      const estimatedRevenue = Math.round(model.avgJobValue * model.jobsPerEvent * confidence);
      const estimatedJobs = Math.round(model.jobsPerEvent * confidence);

      const impactZone = {
        id: alert.properties.id || `zone-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        hazardType: category,
        alertType: alert.properties.event,
        severity: alert.properties.severity,
        urgency: alert.properties.urgency,
        certainty: alert.properties.certainty,
        location: {
          state: location.state,
          counties: location.counties.slice(0, 5), // Limit to first 5 counties
          description: location.fullArea.substring(0, 200)
        },
        headline: alert.properties.headline,
        description: (alert.properties.description || '').substring(0, 500),
        startTime: alert.properties.effective,
        endTime: alert.properties.expires,
        estimatedRevenue,
        estimatedJobs,
        confidence: Math.round(confidence * 100)
      };

      impactZones.push(impactZone);

      // Aggregate by state
      if (location.state) {
        const existing = stateImpacts.get(location.state) || { hazards: [], totalRevenue: 0, totalJobs: 0 };
        existing.hazards.push({ type: category, severity: alert.properties.severity });
        existing.totalRevenue += estimatedRevenue;
        existing.totalJobs += estimatedJobs;
        stateImpacts.set(location.state, existing);
      }
    });

    // Add earthquakes to impact zones
    earthquakes.filter(eq => eq.magnitude >= 4.0).forEach(eq => {
      const confidence = eq.magnitude >= 6 ? 0.95 : eq.magnitude >= 5 ? 0.8 : 0.6;
      const estimatedRevenue = Math.round(revenueModel.earthquake.avgJobValue * revenueModel.earthquake.jobsPerEvent * confidence);
      const estimatedJobs = Math.round(revenueModel.earthquake.jobsPerEvent * confidence);

      impactZones.push({
        id: eq.id,
        hazardType: 'earthquake',
        alertType: `M${eq.magnitude.toFixed(1)} Earthquake`,
        severity: eq.magnitude >= 6 ? 'Extreme' : eq.magnitude >= 5 ? 'Severe' : 'Moderate',
        urgency: 'Immediate',
        certainty: 'Observed',
        location: {
          state: null,
          latitude: eq.latitude,
          longitude: eq.longitude,
          description: eq.location || `${eq.latitude.toFixed(2)}°, ${eq.longitude.toFixed(2)}°`,
          depth: eq.depth
        },
        headline: `M${eq.magnitude.toFixed(1)} Earthquake - ${eq.location}`,
        description: `Depth: ${eq.depth}km. ${eq.magnitude >= 5 ? 'Structural damage possible.' : 'Minor damage expected.'}`,
        startTime: eq.time,
        endTime: null,
        estimatedRevenue,
        estimatedJobs,
        confidence: Math.round(confidence * 100)
      });
    });

    // Add wildfires to impact zones
    wildfires.forEach(fire => {
      const confidence = fire.confidence === 'high' ? 0.9 : fire.confidence === 'nominal' ? 0.7 : 0.5;
      const estimatedRevenue = Math.round(revenueModel.wildfire.avgJobValue * revenueModel.wildfire.jobsPerEvent * confidence);
      const estimatedJobs = Math.round(revenueModel.wildfire.jobsPerEvent * confidence);

      impactZones.push({
        id: fire.id,
        hazardType: 'wildfire',
        alertType: 'Active Wildfire',
        severity: fire.frp > 100 ? 'Extreme' : fire.frp > 50 ? 'Severe' : 'Moderate',
        urgency: 'Immediate',
        certainty: 'Observed',
        location: {
          state: null,
          latitude: fire.latitude,
          longitude: fire.longitude,
          description: `${fire.latitude.toFixed(3)}°, ${fire.longitude.toFixed(3)}°`
        },
        headline: `Active Fire Detected`,
        description: `Brightness: ${fire.brightness}K, FRP: ${fire.frp}MW`,
        startTime: fire.acquisitionDate,
        endTime: null,
        estimatedRevenue,
        estimatedJobs,
        confidence: Math.round(confidence * 100)
      });
    });

    // Build Contractor Opportunities (prioritized by revenue potential)
    const opportunities = impactZones
      .filter(zone => zone.estimatedRevenue > 0)
      .map((zone, idx) => ({
        id: `opp-${zone.id}`,
        rank: idx + 1,
        hazardType: zone.hazardType,
        alertType: zone.alertType,
        severity: zone.severity,
        location: zone.location,
        estimatedRevenue: zone.estimatedRevenue,
        estimatedJobs: zone.estimatedJobs,
        confidence: zone.confidence,
        timing: zone.urgency === 'Immediate' ? 'Deploy Now' : 
                zone.urgency === 'Expected' ? 'Deploy in 24-48h' : 'Monitor',
        peakDemandTime: zone.startTime,
        competitionLevel: zone.estimatedJobs > 100 ? 'High Demand' : 
                         zone.estimatedJobs > 50 ? 'Moderate Competition' : 'Limited Competition',
        recommendation: zone.urgency === 'Immediate' 
          ? 'Immediate deployment recommended - high confidence opportunity'
          : 'Pre-position crews and monitor for updates'
      }))
      .sort((a, b) => b.estimatedRevenue - a.estimatedRevenue)
      .slice(0, 50); // Top 50 opportunities

    // Calculate totals
    const totalRevenue = opportunities.reduce((sum, opp) => sum + opp.estimatedRevenue, 0);
    const totalJobs = opportunities.reduce((sum, opp) => sum + opp.estimatedJobs, 0);

    // State-level summary
    const stateOpportunities = Array.from(stateImpacts.entries())
      .map(([state, data]) => ({
        state,
        hazardCount: data.hazards.length,
        hazardTypes: [...new Set(data.hazards.map(h => h.type))],
        estimatedRevenue: data.totalRevenue,
        estimatedJobs: data.totalJobs
      }))
      .sort((a, b) => b.estimatedRevenue - a.estimatedRevenue);

    res.json({
      success: true,
      timestamp: new Date(),
      summary: {
        activeStorms: activeStorms.length,
        impactZones: impactZones.length,
        opportunities: opportunities.length,
        totalEstimatedRevenue: totalRevenue,
        totalEstimatedJobs: totalJobs,
        statesAffected: stateOpportunities.length
      },
      activeStorms,
      impactZones: impactZones.slice(0, 100), // Limit response size
      opportunities,
      stateOpportunities,
      dataSources: {
        nhc: { count: storms.length, status: 'live' },
        usgs: { count: earthquakes.length, status: 'live' },
        firms: { count: wildfires.length, status: wildfires.length > 0 ? 'live' : 'mock' },
        nws: { count: nwsAlerts.length, status: 'live' }
      }
    });
  } catch (error: any) {
    console.error('Predictions intelligence error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
