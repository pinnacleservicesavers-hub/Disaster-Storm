import { Router } from 'express';
import { ambeeService } from '../services/ambeeService.js';

const router = Router();

// ==================== AIR QUALITY ROUTES ====================

router.get('/air-quality/coordinates', async (req, res) => {
  try {
    const { lat, lng } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const data = await ambeeService.getAirQualityByCoordinates(
      parseFloat(lat as string),
      parseFloat(lng as string)
    );
    
    const healthImpact = ambeeService.getHealthImpact(data);

    res.json({ airQuality: data, healthImpact });
  } catch (error: any) {
    console.error('Error fetching air quality by coordinates:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/air-quality/place', async (req, res) => {
  try {
    const { place } = req.query;
    
    if (!place) {
      return res.status(400).json({ error: 'Place is required' });
    }

    const data = await ambeeService.getAirQualityByPlace(place as string);
    const healthImpact = ambeeService.getHealthImpact(data);

    res.json({ airQuality: data, healthImpact });
  } catch (error: any) {
    console.error('Error fetching air quality by place:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/air-quality/postal-code', async (req, res) => {
  try {
    const { postalCode, countryCode } = req.query;
    
    if (!postalCode || !countryCode) {
      return res.status(400).json({ error: 'Postal code and country code are required' });
    }

    const data = await ambeeService.getAirQualityByPostalCode(
      postalCode as string,
      countryCode as string
    );
    const healthImpact = ambeeService.getHealthImpact(data);

    res.json({ airQuality: data, healthImpact });
  } catch (error: any) {
    console.error('Error fetching air quality by postal code:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== POLLEN ROUTES ====================

router.get('/pollen/coordinates', async (req, res) => {
  try {
    const { lat, lng } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const data = await ambeeService.getPollenByCoordinates(
      parseFloat(lat as string),
      parseFloat(lng as string)
    );

    res.json({ pollen: data });
  } catch (error: any) {
    console.error('Error fetching pollen by coordinates:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/pollen/place', async (req, res) => {
  try {
    const { place } = req.query;
    
    if (!place) {
      return res.status(400).json({ error: 'Place is required' });
    }

    const data = await ambeeService.getPollenByPlace(place as string);

    res.json({ pollen: data });
  } catch (error: any) {
    console.error('Error fetching pollen by place:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/pollen/forecast', async (req, res) => {
  try {
    const { lat, lng } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const data = await ambeeService.getPollenForecast(
      parseFloat(lat as string),
      parseFloat(lng as string)
    );

    res.json({ forecast: data });
  } catch (error: any) {
    console.error('Error fetching pollen forecast:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== WEATHER ROUTES ====================

router.get('/weather/coordinates', async (req, res) => {
  try {
    const { lat, lng, units = 'us' } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const data = await ambeeService.getWeatherByCoordinates(
      parseFloat(lat as string),
      parseFloat(lng as string),
      units as 'si' | 'us'
    );

    res.json({ weather: data });
  } catch (error: any) {
    console.error('Error fetching weather by coordinates:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== FIRE/DISASTERS ROUTES ====================

router.get('/fire/coordinates', async (req, res) => {
  try {
    const { lat, lng } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const data = await ambeeService.getFireDataByCoordinates(
      parseFloat(lat as string),
      parseFloat(lng as string)
    );

    res.json(data);
  } catch (error: any) {
    console.error('Error fetching fire data:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== SOIL ROUTES ====================

router.get('/soil/coordinates', async (req, res) => {
  try {
    const { lat, lng } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const data = await ambeeService.getSoilDataByCoordinates(
      parseFloat(lat as string),
      parseFloat(lng as string)
    );

    res.json({ soil: data });
  } catch (error: any) {
    console.error('Error fetching soil data:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== WATER VAPOR ROUTES ====================

router.get('/water-vapor/coordinates', async (req, res) => {
  try {
    const { lat, lng } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const data = await ambeeService.getWaterVaporByCoordinates(
      parseFloat(lat as string),
      parseFloat(lng as string)
    );

    res.json({ waterVapor: data });
  } catch (error: any) {
    console.error('Error fetching water vapor:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== COMPREHENSIVE ENVIRONMENTAL REPORT ====================

router.get('/environmental-report', async (req, res) => {
  try {
    const { lat, lng, place, units = 'us' } = req.query;
    
    if ((!lat || !lng) && !place) {
      return res.status(400).json({ 
        error: 'Either coordinates (lat/lng) or place name is required' 
      });
    }

    let airQuality, pollen, weather, fire, soil, waterVapor;

    if (lat && lng) {
      const latitude = parseFloat(lat as string);
      const longitude = parseFloat(lng as string);

      const results = await Promise.allSettled([
        ambeeService.getAirQualityByCoordinates(latitude, longitude),
        ambeeService.getPollenByCoordinates(latitude, longitude),
        ambeeService.getWeatherByCoordinates(latitude, longitude, units as 'si' | 'us'),
        ambeeService.getFireDataByCoordinates(latitude, longitude),
        ambeeService.getSoilDataByCoordinates(latitude, longitude),
        ambeeService.getWaterVaporByCoordinates(latitude, longitude),
      ]);

      airQuality = results[0].status === 'fulfilled' ? results[0].value : null;
      pollen = results[1].status === 'fulfilled' ? results[1].value : null;
      weather = results[2].status === 'fulfilled' ? results[2].value : null;
      fire = results[3].status === 'fulfilled' ? results[3].value : null;
      soil = results[4].status === 'fulfilled' ? results[4].value : null;
      waterVapor = results[5].status === 'fulfilled' ? results[5].value : null;

      if (results[0].status === 'rejected') console.error('Error fetching air quality by coordinates:', results[0].reason);
      if (results[1].status === 'rejected') console.error('Error fetching pollen by coordinates:', results[1].reason);
      if (results[2].status === 'rejected') console.error('Error fetching weather by coordinates:', results[2].reason);
      if (results[3].status === 'rejected') console.error('Error fetching fire data:', results[3].reason);
      if (results[4].status === 'rejected') console.error('Error fetching soil data:', results[4].reason);
      if (results[5].status === 'rejected') console.error('Error fetching water vapor:', results[5].reason);
    } else if (place) {
      const results = await Promise.allSettled([
        ambeeService.getAirQualityByPlace(place as string),
        ambeeService.getPollenByPlace(place as string),
      ]);

      airQuality = results[0].status === 'fulfilled' ? results[0].value : null;
      pollen = results[1].status === 'fulfilled' ? results[1].value : null;

      if (results[0].status === 'rejected') console.error('Error fetching air quality by place:', results[0].reason);
      if (results[1].status === 'rejected') console.error('Error fetching pollen by place:', results[1].reason);
    }

    const healthImpact = ambeeService.getHealthImpact(airQuality!);

    res.json({
      location: place || `${lat}, ${lng}`,
      airQuality,
      healthImpact,
      pollen,
      weather,
      fire,
      soil,
      waterVapor,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error generating environmental report:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== SECURE PROXY ROUTES ====================
// Production-safe pass-through endpoints for direct Ambee API access

router.get('/latest/by-lat-lng', async (req, res) => {
  try {
    const { lat, lng } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({ error: 'Valid lat and lng required' });
    }

    const latitude = parseFloat(lat as string);
    const longitude = parseFloat(lng as string);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || 
        Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
      return res.status(400).json({ error: 'Invalid coordinates' });
    }

    const data = await ambeeService.getAirQualityByCoordinates(latitude, longitude);
    res.json(data);
  } catch (error: any) {
    console.error('Error in /latest/by-lat-lng:', error);
    res.status(error.status || 502).json({ 
      error: 'Upstream error', 
      details: error.message 
    });
  }
});

router.get('/weather/latest/by-lat-lng', async (req, res) => {
  try {
    const { lat, lng } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({ error: 'Valid lat and lng required' });
    }

    const latitude = parseFloat(lat as string);
    const longitude = parseFloat(lng as string);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || 
        Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
      return res.status(400).json({ error: 'Invalid coordinates' });
    }

    const data = await ambeeService.getWeatherByCoordinates(latitude, longitude);
    res.json(data);
  } catch (error: any) {
    console.error('Error in /weather/latest/by-lat-lng:', error);
    res.status(error.status || 502).json({ 
      error: 'Upstream error', 
      details: error.message 
    });
  }
});

router.get('/disasters/latest/by-lat-lng', async (req, res) => {
  try {
    const { lat, lng } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({ error: 'Valid lat and lng required' });
    }

    const latitude = parseFloat(lat as string);
    const longitude = parseFloat(lng as string);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || 
        Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
      return res.status(400).json({ error: 'Invalid coordinates' });
    }

    // Note: Using fire data as disaster proxy
    const data = await ambeeService.getFireDataByCoordinates(latitude, longitude);
    res.json(data);
  } catch (error: any) {
    console.error('Error in /disasters/latest/by-lat-lng:', error);
    res.status(error.status || 502).json({ 
      error: 'Upstream error', 
      details: error.message 
    });
  }
});

router.get('/wildfires/latest/by-lat-lng', async (req, res) => {
  try {
    const { lat, lng } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({ error: 'Valid lat and lng required' });
    }

    const latitude = parseFloat(lat as string);
    const longitude = parseFloat(lng as string);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || 
        Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
      return res.status(400).json({ error: 'Invalid coordinates' });
    }

    const data = await ambeeService.getFireDataByCoordinates(latitude, longitude);
    res.json(data);
  } catch (error: any) {
    console.error('Error in /wildfires/latest/by-lat-lng:', error);
    res.status(error.status || 502).json({ 
      error: 'Upstream error', 
      details: error.message 
    });
  }
});

router.get('/pollen/latest/by-lat-lng', async (req, res) => {
  try {
    const { lat, lng } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({ error: 'Valid lat and lng required' });
    }

    const latitude = parseFloat(lat as string);
    const longitude = parseFloat(lng as string);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || 
        Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
      return res.status(400).json({ error: 'Invalid coordinates' });
    }

    const data = await ambeeService.getPollenByCoordinates(latitude, longitude);
    res.json(data);
  } catch (error: any) {
    console.error('Error in /pollen/latest/by-lat-lng:', error);
    res.status(error.status || 502).json({ 
      error: 'Upstream error', 
      details: error.message 
    });
  }
});

export default router;
