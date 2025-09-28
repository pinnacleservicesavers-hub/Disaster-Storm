import fetch from 'node-fetch';

export interface ReverseGeocodingResult {
  address: string;
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  formattedAddress?: string;
  confidence?: number;
}

export class ReverseGeocodingService {
  private locationiqApiKey?: string;

  constructor() {
    this.locationiqApiKey = process.env.LOCATIONIQ_API_KEY;
  }

  /**
   * Reverse geocode GPS coordinates to get address information
   */
  async reverseGeocode(latitude: number, longitude: number): Promise<ReverseGeocodingResult | null> {
    try {
      // First try LocationIQ if API key is available
      if (this.locationiqApiKey) {
        const result = await this.reverseGeocodeLocationIQ(latitude, longitude);
        if (result) {
          return result;
        }
        console.log('LocationIQ failed, falling back to Nominatim...');
      }

      // Fallback to free Nominatim service
      return await this.reverseGeocodeNominatim(latitude, longitude);

    } catch (error) {
      console.error('Error in reverse geocoding:', error);
      return null;
    }
  }

  /**
   * Reverse geocode using LocationIQ API (premium service)
   */
  private async reverseGeocodeLocationIQ(latitude: number, longitude: number): Promise<ReverseGeocodingResult | null> {
    try {
      const url = `https://us1.locationiq.com/v1/reverse.php?key=${this.locationiqApiKey}&lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`;
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'DisasterDirect/1.0 (contact@disasterdirect.com)'
        }
      });

      if (!response.ok) {
        console.error('LocationIQ API error:', response.status, response.statusText);
        return null;
      }

      const data = await response.json() as any;
      
      if (data.error) {
        console.error('LocationIQ error:', data.error);
        return null;
      }

      const address = data.address || {};
      const result: ReverseGeocodingResult = {
        address: data.display_name || 'Address not found',
        street: this.buildStreetAddress(address),
        city: address.city || address.town || address.village || address.hamlet,
        state: address.state || address.region,
        zipCode: address.postcode,
        country: address.country,
        formattedAddress: data.display_name,
        confidence: 0.9 // LocationIQ generally has high accuracy
      };

      console.log('LocationIQ reverse geocoding result:', result);
      return result;

    } catch (error) {
      console.error('LocationIQ reverse geocoding error:', error);
      return null;
    }
  }

  /**
   * Reverse geocode using free Nominatim service (OpenStreetMap)
   */
  private async reverseGeocodeNominatim(latitude: number, longitude: number): Promise<ReverseGeocodingResult | null> {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`;
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'DisasterDirect/1.0 (contact@disasterdirect.com)'
        }
      });

      if (!response.ok) {
        console.error('Nominatim API error:', response.status, response.statusText);
        return null;
      }

      const data = await response.json() as any;
      
      if (data.error) {
        console.error('Nominatim error:', data.error);
        return null;
      }

      const address = data.address || {};
      const result: ReverseGeocodingResult = {
        address: data.display_name || 'Address not found',
        street: this.buildStreetAddress(address),
        city: address.city || address.town || address.village || address.hamlet,
        state: address.state || address.region,
        zipCode: address.postcode,
        country: address.country,
        formattedAddress: data.display_name,
        confidence: 0.7 // Nominatim has good but variable accuracy
      };

      console.log('Nominatim reverse geocoding result:', result);
      return result;

    } catch (error) {
      console.error('Nominatim reverse geocoding error:', error);
      return null;
    }
  }

  /**
   * Build street address from address components
   */
  private buildStreetAddress(address: any): string | undefined {
    const components = [];
    
    if (address.house_number) {
      components.push(address.house_number);
    }
    
    if (address.road || address.street) {
      components.push(address.road || address.street);
    }
    
    return components.length > 0 ? components.join(' ') : undefined;
  }

  /**
   * Validate GPS coordinates before geocoding
   */
  validateCoordinates(latitude: number, longitude: number): boolean {
    // Basic validation for reasonable coordinate ranges
    if (latitude < -90 || latitude > 90) {
      return false;
    }
    
    if (longitude < -180 || longitude > 180) {
      return false;
    }
    
    // Check if coordinates are not null/zero (which often indicates missing data)
    if (latitude === 0 && longitude === 0) {
      return false;
    }
    
    return true;
  }

  /**
   * Get address components for property matching
   */
  getAddressForMatching(result: ReverseGeocodingResult): string[] {
    const components = [];
    
    if (result.street) {
      components.push(result.street);
    }
    
    if (result.city) {
      components.push(result.city);
    }
    
    if (result.state) {
      components.push(result.state);
    }
    
    if (result.zipCode) {
      components.push(result.zipCode);
    }
    
    return components;
  }

  /**
   * Calculate address similarity for matching
   */
  calculateAddressSimilarity(address1: string, address2: string): number {
    const normalize = (str: string) => str.toLowerCase().replace(/[^\w\s]/g, '').trim();
    
    const norm1 = normalize(address1);
    const norm2 = normalize(address2);
    
    if (norm1 === norm2) return 1.0;
    
    // Simple word-based similarity
    const words1 = norm1.split(/\s+/);
    const words2 = norm2.split(/\s+/);
    
    let matches = 0;
    for (const word1 of words1) {
      if (words2.some(word2 => word2.includes(word1) || word1.includes(word2))) {
        matches++;
      }
    }
    
    return matches / Math.max(words1.length, words2.length);
  }
}