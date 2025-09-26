import NodeCache from 'node-cache';

export interface PropertyData {
  address: string;
  apn?: string;
  owner: PropertyOwner;
  details: PropertyDetails;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  sourceProviders: string[];
  raw?: any; // Store raw API response for debugging
}

export interface PropertyOwner {
  name: string;
  mailingAddress?: string;
  phone?: string;
  email?: string;
}

export interface PropertyDetails {
  propertyType: string;
  yearBuilt?: number;
  squareFootage?: number;
  lotSize?: number;
  bedrooms?: number;
  bathrooms?: number;
  estimatedValue?: number;
  lastSaleDate?: Date;
  lastSalePrice?: number;
}

export interface EnrichmentData {
  phone?: string;
  email?: string;
  additionalPhones?: string[];
  socialProfiles?: string[];
  verified: boolean;
  confidence: number;
}

export class PropertyService {
  private cache: NodeCache;
  private smartyAuthId: string;
  private smartyAuthToken: string;
  private regridApiKey: string;
  private attomApiKey: string;
  private melissaApiKey: string;
  private estatedApiKey: string;
  private whitepagesApiKey: string;
  private provider: 'attom' | 'estated';

  constructor() {
    // Cache for 1 hour, check every 2 minutes for expired entries
    this.cache = new NodeCache({ stdTTL: 60 * 60, checkperiod: 120 });
    
    this.smartyAuthId = process.env.SMARTY_AUTH_ID || '';
    this.smartyAuthToken = process.env.SMARTY_AUTH_TOKEN || '';
    this.regridApiKey = process.env.REGRID_API_KEY || '';
    this.attomApiKey = process.env.ATTOM_API_KEY || '';
    this.melissaApiKey = process.env.MELISSA_API_KEY || '';
    this.estatedApiKey = process.env.ESTATED_API_KEY || '';
    this.whitepagesApiKey = process.env.WHITEPAGES_API_KEY || '';
    this.provider = (process.env.PROPERTY_PROVIDER as 'attom' | 'estated') || 'estated';
  }

  // Cache wrapper utility
  private async cached<T>(key: string, ttlSeconds: number, fn: () => Promise<T>): Promise<T> {
    const cached = this.cache.get<T>(key);
    if (cached) {
      console.log(`Cache hit for key: ${key}`);
      return cached;
    }
    
    console.log(`Cache miss for key: ${key}, executing function`);
    const result = await fn();
    this.cache.set(key, result, ttlSeconds);
    return result;
  }

  async lookupByCoordinates(latitude: number, longitude: number): Promise<PropertyData | null> {
    try {
      // Step 1: Reverse geocode to get address
      const address = await this.reverseGeocode(latitude, longitude);
      if (!address) return null;

      // Step 2: Get property details
      return await this.lookupByAddress(address);
    } catch (error) {
      console.error('Error looking up property by coordinates:', error);
      return null;
    }
  }

  async lookupByAddress(address: string): Promise<PropertyData | null> {
    try {
      const cacheKey = `prop:${address}`;
      return await this.cached(cacheKey, 60 * 60, async () => {
        const sources: string[] = [];
        let propertyData: PropertyData | null = null;

        // Use configured provider (ATTOM or Estated)
        if (this.provider === 'attom' && this.attomApiKey) {
          try {
            const attomData = await this.getAttomData(address);
            if (attomData) {
              propertyData = attomData;
              sources.push('ATTOM');
            }
          } catch (error) {
            console.error('ATTOM lookup failed:', error);
          }
        } else if (this.provider === 'estated' && this.estatedApiKey) {
          try {
            const estatedData = await this.getEstatedData(address);
            if (estatedData) {
              propertyData = estatedData;
              sources.push('Estated');
            }
          } catch (error) {
            console.error('Estated lookup failed:', error);
          }
        }

        // Fallback to Regrid for parcel data
        if (!propertyData && this.regridApiKey) {
          try {
            const regridData = await this.getRegridData(address);
            if (regridData) {
              propertyData = regridData;
              sources.push('Regrid');
            }
          } catch (error) {
            console.error('Regrid lookup failed:', error);
          }
        }

        if (propertyData) {
          propertyData.sourceProviders = sources;
        }

        return propertyData;
      });
    } catch (error) {
      console.error('Error looking up property by address:', error);
      return null;
    }
  }

  // Contact enrichment using Whitepages Pro or similar
  async enrichContact(name: string, address: string): Promise<EnrichmentData | null> {
    try {
      if (!this.whitepagesApiKey) {
        console.warn('Whitepages API key not configured');
        return null;
      }

      const cacheKey = `enrich:${name}:${address}`;
      return await this.cached(cacheKey, 60 * 60 * 24, async () => {
        // Example Whitepages Pro identity check endpoint
        const url = `https://proapi.whitepages.com/3.0/identity_check`;
        const params = new URLSearchParams({
          api_key: this.whitepagesApiKey,
          name: name,
          address: address
        });

        const response = await fetch(`${url}?${params}`);
        if (!response.ok) {
          throw new Error(`Whitepages error ${response.status}`);
        }

        const data = await response.json();
        
        // Extract enrichment data from Whitepages response
        return {
          phone: data.phone_number || undefined,
          email: data.email_address || undefined,
          additionalPhones: data.associated_phone_numbers || [],
          socialProfiles: data.social_profiles || [],
          verified: data.is_verified || false,
          confidence: data.confidence_score || 0
        };
      });
    } catch (error) {
      console.error('Error enriching contact:', error);
      return null;
    }
  }

  async verifyContact(contact: {
    name: string;
    address: string;
    phone?: string;
    email?: string;
  }): Promise<PropertyOwner> {
    try {
      // Try to enrich contact data
      const enrichment = await this.enrichContact(contact.name, contact.address);
      
      return {
        name: contact.name,
        mailingAddress: contact.address,
        phone: enrichment?.phone || contact.phone || 'Not available',
        email: enrichment?.email || contact.email || 'Not available'
      };
    } catch (error) {
      console.error('Error verifying contact:', error);
      return contact;
    }
  }

  private async reverseGeocode(latitude: number, longitude: number): Promise<string | null> {
    try {
      // In production, this would call Smarty Streets or Google Maps API
      // Mock implementation for demonstration
      return `${Math.floor(Math.random() * 9999)} Main St, Atlanta, GA 30309`;
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
      return null;
    }
  }

  // Real Estated API integration
  private async getEstatedData(address: string): Promise<PropertyData | null> {
    try {
      if (!this.estatedApiKey) {
        throw new Error('Estated API key not configured');
      }

      const url = `https://api.estated.com/property/v4`;
      const params = new URLSearchParams({
        token: this.estatedApiKey,
        address: address
      });

      const response = await fetch(`${url}?${params}`);
      if (!response.ok) {
        throw new Error(`Estated error ${response.status}`);
      }

      const data = await response.json();
      
      // Map Estated response to our PropertyData interface
      return {
        address: address,
        apn: data.parcel_number || undefined,
        owner: {
          name: data.owner?.name || data.ownerName || 'Owner information not available',
          mailingAddress: data.owner?.mailing_address || data.ownerMailing || undefined,
          phone: undefined, // Phone not typically in property data
          email: undefined  // Email not typically in property data
        },
        details: {
          propertyType: data.property_type || data.propertyType || 'Unknown',
          yearBuilt: data.year_built || data.yearBuilt || undefined,
          squareFootage: data.building_area || data.squareFootage || undefined,
          lotSize: data.lot_size || data.lotSize || undefined,
          bedrooms: data.beds || data.bedrooms || undefined,
          bathrooms: data.baths || data.bathrooms || undefined,
          estimatedValue: data.estimated_value || data.estimatedValue || undefined,
          lastSaleDate: data.last_sale?.date ? new Date(data.last_sale.date) : undefined,
          lastSalePrice: data.last_sale?.price || data.lastSalePrice || undefined
        },
        coordinates: {
          latitude: data.latitude || data.lat || 0,
          longitude: data.longitude || data.lng || 0
        },
        sourceProviders: [],
        raw: data // Store raw response for debugging
      };
    } catch (error) {
      console.error('Estated API error:', error);
      return null;
    }
  }

  private async getRegridData(address: string): Promise<PropertyData | null> {
    try {
      if (!this.regridApiKey) {
        console.warn('Regrid API key not configured, skipping');
        return null;
      }

      // Regrid API implementation would go here
      // For now, return null as fallback
      console.log('Regrid integration not yet implemented');
      return null;
    } catch (error) {
      console.error('Regrid API error:', error);
      return null;
    }
  }

  // Real ATTOM API integration  
  private async getAttomData(address: string): Promise<PropertyData | null> {
    try {
      if (!this.attomApiKey) {
        throw new Error('ATTOM API key not configured');
      }

      // ATTOM Property Detail API
      const url = `https://api.gateway.attomdata.com/propertyapi/v1.0.0/property/detail`;
      const params = new URLSearchParams({
        address: address
      });

      const response = await fetch(`${url}?${params}`, {
        headers: {
          'apikey': this.attomApiKey,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`ATTOM error ${response.status}`);
      }

      const data = await response.json();
      
      // ATTOM typically returns data in a specific format
      const property = data.property && data.property[0];
      if (!property) {
        throw new Error('No property data returned from ATTOM');
      }

      // Map ATTOM response to our PropertyData interface
      return {
        address: address,
        apn: property.identifier?.apn || undefined,
        owner: {
          name: property.owner?.names?.join(', ') || 'Owner information not available',
          mailingAddress: property.owner?.mailingAddress?.oneLine || undefined,
          phone: undefined, // Phone not typically in property data
          email: undefined  // Email not typically in property data
        },
        details: {
          propertyType: property.summary?.propertyType || 'Unknown',
          yearBuilt: property.summary?.yearBuilt || undefined,
          squareFootage: property.building?.size?.livingSize || undefined,
          lotSize: property.lot?.lotSize1 || undefined,
          bedrooms: property.building?.rooms?.beds || undefined,
          bathrooms: property.building?.rooms?.bathsTotal || undefined,
          estimatedValue: property.assessment?.assessed?.totalValue || undefined,
          lastSaleDate: property.sale?.saleSearchDate ? new Date(property.sale.saleSearchDate) : undefined,
          lastSalePrice: property.sale?.amount?.saleAmt || undefined
        },
        coordinates: {
          latitude: property.location?.latitude || 0,
          longitude: property.location?.longitude || 0
        },
        sourceProviders: [],
        raw: data // Store raw response for debugging
      };
    } catch (error) {
      console.error('ATTOM API error:', error);
      return null;
    }
  }

  async getPropertyHistory(address: string): Promise<any[]> {
    try {
      // In production, get sales history from property data APIs
      return [
        {
          date: new Date('2019-06-15'),
          price: 245000,
          type: 'Sale'
        },
        {
          date: new Date('2015-03-22'),
          price: 195000,
          type: 'Sale'
        }
      ];
    } catch (error) {
      console.error('Error getting property history:', error);
      return [];
    }
  }
}

export const propertyService = new PropertyService();

// Import and integrate county parcel service
import { countyParcelService, CountyParcelData } from './countyParcelService.js';

export { countyParcelService, CountyParcelData };
