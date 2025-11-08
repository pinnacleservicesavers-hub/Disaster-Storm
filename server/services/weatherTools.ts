import fetch from 'node-fetch';
import { geocodeLocation } from './geocoding.js';

export interface WeatherData {
  location: string;
  temperature: number;
  feelsLike: number;
  conditions: string;
  humidity: number;
  windSpeed: number;
  windDirection: string;
  alerts: Array<{
    event: string;
    severity: string;
    description: string;
    start: string;
    end: string;
  }>;
}

export async function getWeatherForLocation(locationQuery: string): Promise<WeatherData | null> {
  try {
    console.log(`🌤️ Fetching weather for: "${locationQuery}"`);
    
    const geocoded = await geocodeLocation(locationQuery);
    if (!geocoded) {
      console.log(`🌤️ Could not geocode location: ${locationQuery}`);
      return null;
    }
    
    const { lat, lon, displayName } = geocoded;
    console.log(`🌤️ Getting weather for coordinates: ${lat}, ${lon}`);
    
    const pointUrl = `https://api.weather.gov/points/${lat},${lon}`;
    const pointResponse = await fetch(pointUrl, {
      headers: {
        'User-Agent': 'DisasterDirect/1.0 (contact@disasterdirect.com)',
        'Accept': 'application/geo+json'
      }
    });
    
    if (!pointResponse.ok) {
      console.error(`🌤️ NWS points API error: ${pointResponse.status}`);
      return null;
    }
    
    const pointData = await pointResponse.json() as any;
    const forecastUrl = pointData.properties.forecast;
    const alertsUrl = `https://api.weather.gov/alerts/active?point=${lat},${lon}`;
    
    const [forecastResponse, alertsResponse] = await Promise.all([
      fetch(forecastUrl, {
        headers: {
          'User-Agent': 'DisasterDirect/1.0',
          'Accept': 'application/geo+json'
        }
      }),
      fetch(alertsUrl, {
        headers: {
          'User-Agent': 'DisasterDirect/1.0',
          'Accept': 'application/geo+json'
        }
      })
    ]);
    
    if (!forecastResponse.ok) {
      console.error(`🌤️ NWS forecast API error: ${forecastResponse.status}`);
      return null;
    }
    
    const forecastData = await forecastResponse.json() as any;
    const alertsData = alertsResponse.ok ? await alertsResponse.json() as any : { features: [] };
    
    const currentPeriod = forecastData.properties?.periods?.[0];
    if (!currentPeriod) {
      console.error('🌤️ No forecast periods available');
      return null;
    }
    
    const alerts = alertsData.features?.map((alert: any) => ({
      event: alert.properties.event,
      severity: alert.properties.severity,
      description: alert.properties.headline || alert.properties.description,
      start: alert.properties.onset,
      end: alert.properties.ends
    })) || [];
    
    const weatherData: WeatherData = {
      location: displayName,
      temperature: currentPeriod.temperature,
      feelsLike: currentPeriod.temperature,
      conditions: currentPeriod.shortForecast,
      humidity: currentPeriod.relativeHumidity?.value || 0,
      windSpeed: parseInt(currentPeriod.windSpeed) || 0,
      windDirection: currentPeriod.windDirection,
      alerts
    };
    
    console.log(`🌤️ Weather fetched successfully for ${displayName}:`, {
      temp: weatherData.temperature,
      conditions: weatherData.conditions,
      alertCount: alerts.length
    });
    
    return weatherData;
    
  } catch (error) {
    console.error('🌤️ Weather fetch error:', error);
    return null;
  }
}

export async function getTornadoAlerts(): Promise<any[]> {
  try {
    const url = 'https://api.weather.gov/alerts/active?event=Tornado%20Warning,Tornado%20Watch';
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'DisasterDirect/1.0',
        'Accept': 'application/geo+json'
      }
    });
    
    if (!response.ok) {
      return [];
    }
    
    const data = await response.json() as any;
    return data.features || [];
  } catch (error) {
    console.error('🌪️ Tornado alerts fetch error:', error);
    return [];
  }
}

export async function getSevereWeatherNearLocation(locationQuery: string): Promise<string> {
  try {
    const geocoded = await geocodeLocation(locationQuery);
    if (!geocoded) {
      return `Could not find location: ${locationQuery}`;
    }
    
    const { lat, lon, displayName } = geocoded;
    console.log(`🌍 Checking alerts near ${displayName} (${lat}, ${lon})`);
    
    const allAlertsResponse = await fetch('https://api.weather.gov/alerts/active', {
      headers: {
        'User-Agent': 'DisasterDirect/1.0',
        'Accept': 'application/geo+json'
      }
    });
    
    if (!allAlertsResponse.ok) {
      return `Could not fetch alerts for ${displayName}`;
    }
    
    const allData = await allAlertsResponse.json() as any;
    const allAlerts = allData.features || [];
    
    const SEARCH_RADIUS_KM = 150;
    const nearbyAlerts = allAlerts.filter((alert: any) => {
      const props = alert.properties;
      
      const areaDescription = (props.areaDesc || '').toLowerCase();
      const locationParts = displayName.toLowerCase().split(',').map(s => s.trim());
      const countyName = locationParts[0].replace(' county', '');
      const stateName = locationParts.length > 1 ? locationParts[locationParts.length - 1] : '';
      
      if (areaDescription.includes(countyName) || 
          (stateName && areaDescription.includes(stateName))) {
        return true;
      }
      
      if (alert.geometry && alert.geometry.coordinates) {
        try {
          const coords = alert.geometry.type === 'Polygon' 
            ? alert.geometry.coordinates[0]
            : alert.geometry.coordinates;
          
          for (const coord of coords) {
            const [alertLon, alertLat] = coord;
            const distance = Math.sqrt(
              Math.pow((alertLat - lat) * 111, 2) + 
              Math.pow((alertLon - lon) * 111 * Math.cos(lat * Math.PI / 180), 2)
            );
            
            if (distance <= SEARCH_RADIUS_KM) {
              return true;
            }
          }
        } catch (e) {
        }
      }
      
      return false;
    });
    
    console.log(`🌍 Found ${nearbyAlerts.length} alerts near ${displayName}`);
    
    if (nearbyAlerts.length === 0) {
      return `No active weather alerts for ${displayName}`;
    }
    
    const summary = nearbyAlerts.map((alert: any, index: number) => {
      const props = alert.properties;
      return `${index + 1}. ${props.event} (${props.severity}) - ${props.areaDesc}\n   ${props.headline}`;
    }).join('\n\n');
    
    return `Active alerts for ${displayName}:\n\n${summary}`;
    
  } catch (error) {
    console.error('⚠️ Severe weather check error:', error);
    return `Error checking weather for ${locationQuery}: ${error}`;
  }
}
