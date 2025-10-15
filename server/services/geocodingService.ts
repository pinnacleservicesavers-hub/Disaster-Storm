import { geocodingResultSchema, reverseGeocodingResultSchema } from "@shared/schema";
import { z } from "zod";

/**
 * Geocoding Service
 * Uses OpenStreetMap Nominatim API for forward/reverse geocoding
 * Provides city autocomplete and address lookup
 */

const USER_AGENT = "DisasterDirectApp (support@strategiclandmgmt.com)";
const NOMINATIM_BASE = "https://nominatim.openstreetmap.org";

interface NominatimSearchResult {
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    road?: string;
    city?: string;
    town?: string;
    village?: string;
    county?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
  boundingbox?: string[]; // [south, north, west, east]
}

export class GeocodingService {
  private static instance: GeocodingService;

  private constructor() {
    console.log('🌍 GeocodingService initialized');
  }

  static getInstance(): GeocodingService {
    if (!GeocodingService.instance) {
      GeocodingService.instance = new GeocodingService();
    }
    return GeocodingService.instance;
  }

  /**
   * Forward geocoding: Convert city/address to coordinates
   * @param query City name or address (e.g., "Atlanta, GA" or "Tulsa, OK")
   * @param limit Maximum number of results
   * @returns Array of geocoding results
   */
  async geocode(
    query: string,
    limit: number = 1
  ): Promise<z.infer<typeof geocodingResultSchema>[]> {
    if (!query || query.trim().length === 0) {
      return [];
    }

    const url = `${NOMINATIM_BASE}/search?` + new URLSearchParams({
      q: query.trim(),
      format: 'json',
      limit: limit.toString(),
      addressdetails: '1'
    });

    const response = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT }
    });

    if (!response.ok) {
      throw new Error(`Nominatim search failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as NominatimSearchResult[];

    return data.map(result => ({
      label: result.display_name,
      lat: parseFloat(result.lat),
      lon: parseFloat(result.lon),
      displayName: result.display_name,
      city: result.address?.city || result.address?.town || result.address?.village,
      state: result.address?.state,
      country: result.address?.country,
      postalCode: result.address?.postcode,
      boundingBox: result.boundingbox?.map(parseFloat)
    }));
  }

  /**
   * Reverse geocoding: Convert coordinates to address
   * @param lat Latitude
   * @param lon Longitude
   * @returns Address information
   */
  async reverseGeocode(
    lat: number,
    lon: number
  ): Promise<z.infer<typeof reverseGeocodingResultSchema>> {
    const url = `${NOMINATIM_BASE}/reverse?` + new URLSearchParams({
      lat: lat.toString(),
      lon: lon.toString(),
      format: 'json',
      addressdetails: '1'
    });

    const response = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT }
    });

    if (!response.ok) {
      throw new Error(`Nominatim reverse geocoding failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as NominatimSearchResult;

    return {
      displayName: data.display_name,
      address: data.address ? {
        road: data.address.road,
        city: data.address.city || data.address.town || data.address.village,
        county: data.address.county,
        state: data.address.state,
        postcode: data.address.postcode,
        country: data.address.country
      } : undefined,
      lat: parseFloat(data.lat),
      lon: parseFloat(data.lon)
    };
  }

  /**
   * Autocomplete: Get suggestions as user types
   * @param query Partial city/address
   * @param limit Maximum number of suggestions
   * @returns Array of suggestions
   */
  async autocomplete(
    query: string,
    limit: number = 5
  ): Promise<z.infer<typeof geocodingResultSchema>[]> {
    // Autocomplete is just forward geocoding with more results
    return this.geocode(query, limit);
  }

  /**
   * Geocode a city and get the first result
   * Convenience method for single-result lookups
   */
  async geocodeCity(city: string): Promise<{
    lat: number;
    lon: number;
    displayName: string;
  }> {
    const results = await this.geocode(city, 1);
    
    if (results.length === 0) {
      throw new Error(`No results found for: ${city}`);
    }

    return {
      lat: results[0].lat,
      lon: results[0].lon,
      displayName: results[0].displayName || results[0].label
    };
  }
}

export const geocodingService = GeocodingService.getInstance();
