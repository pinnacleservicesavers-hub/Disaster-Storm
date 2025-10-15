import { nwsForecastPeriodSchema, nwsForecastResponseSchema } from "@shared/schema";
import { z } from "zod";

/**
 * NWS Forecast Service
 * Provides daily and hourly forecast data from NWS Weather.gov API
 * Supports imperial (°F, mph) and metric (°C, km/h) units
 */

const USER_AGENT = "DisasterDirectApp (support@strategiclandmgmt.com)";
const NWS_HEADERS = {
  "User-Agent": USER_AGENT,
  "Accept": "application/geo+json"
};

interface NWSForecastPeriod {
  number?: number;
  name?: string;
  startTime: string;
  endTime: string;
  isDaytime?: boolean;
  temperature: number;
  temperatureUnit: string;
  temperatureTrend?: string | null;
  windSpeed: string;
  windDirection: string;
  icon?: string;
  shortForecast: string;
  detailedForecast: string;
}

interface NWSPointsResponse {
  properties: {
    forecast: string;
    forecastHourly: string;
    relativeLocation?: {
      properties?: {
        city?: string;
        state?: string;
      };
    };
  };
}

interface NWSForecastResponse {
  properties: {
    periods: NWSForecastPeriod[];
  };
}

/**
 * Convert Fahrenheit to Celsius
 */
function fToC(f: number): number {
  return Math.round(((f - 32) * 5) / 9);
}

/**
 * Convert mph to km/h
 */
function mphToKmh(mph: number): number {
  return Math.round(mph * 1.60934);
}

/**
 * Convert wind speed strings from mph to km/h
 * Handles patterns like "5 mph", "10 to 15 mph", "gusts up to 35 mph"
 */
function convertWindString(str: string, toMetric: boolean): string {
  if (!str || !toMetric) return str;
  
  // Replace all numbers and "mph" with km/h equivalents
  return str.replace(/\d+(\.\d+)?/g, (num) => mphToKmh(parseFloat(num)).toString())
    .replace(/mph/gi, "km/h");
}

/**
 * Convert a forecast period to the requested units
 */
function convertPeriodUnits(period: NWSForecastPeriod, toMetric: boolean): NWSForecastPeriod {
  if (!toMetric) return period;

  return {
    ...period,
    temperature: fToC(period.temperature),
    temperatureUnit: "C",
    windSpeed: convertWindString(period.windSpeed, true)
  };
}

/**
 * Get forecast URLs for a specific lat/lon point
 */
async function getForecastUrls(lat: number, lon: number): Promise<{
  dailyUrl: string;
  hourlyUrl: string;
  city?: string;
  state?: string;
}> {
  const response = await fetch(
    `https://api.weather.gov/points/${lat.toFixed(4)},${lon.toFixed(4)}`,
    { headers: NWS_HEADERS }
  );

  if (!response.ok) {
    throw new Error(`NWS points lookup failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json() as NWSPointsResponse;

  if (!data.properties?.forecast || !data.properties?.forecastHourly) {
    throw new Error("NWS points response missing forecast URLs");
  }

  return {
    dailyUrl: data.properties.forecast,
    hourlyUrl: data.properties.forecastHourly,
    city: data.properties.relativeLocation?.properties?.city,
    state: data.properties.relativeLocation?.properties?.state
  };
}

/**
 * Fetch forecast periods from a URL
 */
async function fetchForecastPeriods(url: string): Promise<NWSForecastPeriod[]> {
  const response = await fetch(url, { headers: NWS_HEADERS });

  if (!response.ok) {
    throw new Error(`NWS forecast fetch failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json() as NWSForecastResponse;
  return data.properties?.periods || [];
}

export class NWSForecastService {
  private static instance: NWSForecastService;

  private constructor() {
    console.log('🌤️ NWSForecastService initialized');
  }

  static getInstance(): NWSForecastService {
    if (!NWSForecastService.instance) {
      NWSForecastService.instance = new NWSForecastService();
    }
    return NWSForecastService.instance;
  }

  /**
   * Get comprehensive forecast data for a location
   * @param lat Latitude
   * @param lon Longitude
   * @param units 'imperial' (°F, mph) or 'metric' (°C, km/h)
   * @returns Daily forecast, hourly forecast, and active alerts
   */
  async getForecast(
    lat: number,
    lon: number,
    units: 'imperial' | 'metric' = 'imperial'
  ): Promise<z.infer<typeof nwsForecastResponseSchema>> {
    const toMetric = units === 'metric';

    // Get forecast URLs for this point
    const { dailyUrl, hourlyUrl } = await getForecastUrls(lat, lon);

    // Fetch both forecasts in parallel
    const [dailyPeriods, hourlyPeriods] = await Promise.all([
      fetchForecastPeriods(dailyUrl),
      fetchForecastPeriods(hourlyUrl)
    ]);

    // Get active alerts for this point
    const alertsResponse = await fetch(
      `https://api.weather.gov/alerts/active?point=${lat.toFixed(4)},${lon.toFixed(4)}`,
      { headers: NWS_HEADERS }
    );

    const alertsData = alertsResponse.ok ? await alertsResponse.json() : { features: [] };

    // Convert units if metric requested
    const daily = dailyPeriods.map(p => convertPeriodUnits(p, toMetric));
    const hourly = hourlyPeriods.map(p => convertPeriodUnits(p, toMetric));

    return {
      units,
      daily,
      hourly,
      alerts: alertsData.features || []
    };
  }

  /**
   * Get only daily forecast
   */
  async getDailyForecast(
    lat: number,
    lon: number,
    units: 'imperial' | 'metric' = 'imperial'
  ): Promise<NWSForecastPeriod[]> {
    const toMetric = units === 'metric';
    const { dailyUrl } = await getForecastUrls(lat, lon);
    const periods = await fetchForecastPeriods(dailyUrl);
    return periods.map(p => convertPeriodUnits(p, toMetric));
  }

  /**
   * Get only hourly forecast
   */
  async getHourlyForecast(
    lat: number,
    lon: number,
    units: 'imperial' | 'metric' = 'imperial',
    hours: number = 24
  ): Promise<NWSForecastPeriod[]> {
    const toMetric = units === 'metric';
    const { hourlyUrl } = await getForecastUrls(lat, lon);
    const periods = await fetchForecastPeriods(hourlyUrl);
    return periods.slice(0, hours).map(p => convertPeriodUnits(p, toMetric));
  }

  /**
   * Get forecast by city name (requires geocoding first)
   * This is a convenience method - caller should geocode separately for better control
   */
  async getForecastByCity(
    city: string,
    units: 'imperial' | 'metric' = 'imperial'
  ): Promise<z.infer<typeof nwsForecastResponseSchema> & { location: string }> {
    // For MVP, throw error - geocoding should be done separately
    throw new Error("Please use geocoding service first to convert city to coordinates");
  }
}

export const nwsForecastService = NWSForecastService.getInstance();
