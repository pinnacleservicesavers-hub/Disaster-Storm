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

export class PropertyService {
  private smartyAuthId: string;
  private smartyAuthToken: string;
  private regridApiKey: string;
  private attomApiKey: string;
  private melissaApiKey: string;

  constructor() {
    this.smartyAuthId = process.env.SMARTY_AUTH_ID || '';
    this.smartyAuthToken = process.env.SMARTY_AUTH_TOKEN || '';
    this.regridApiKey = process.env.REGRID_API_KEY || '';
    this.attomApiKey = process.env.ATTOM_API_KEY || '';
    this.melissaApiKey = process.env.MELISSA_API_KEY || '';
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
      const sources: string[] = [];
      let propertyData: PropertyData | null = null;

      // Try Regrid first for parcel data
      try {
        const regridData = await this.getRegridData(address);
        if (regridData) {
          propertyData = regridData;
          sources.push('Regrid');
        }
      } catch (error) {
        console.error('Regrid lookup failed:', error);
      }

      // Fallback to ATTOM if Regrid fails
      if (!propertyData) {
        try {
          const attomData = await this.getAttomData(address);
          if (attomData) {
            propertyData = attomData;
            sources.push('ATTOM');
          }
        } catch (error) {
          console.error('ATTOM lookup failed:', error);
        }
      }

      if (propertyData) {
        propertyData.sourceProviders = sources;
      }

      return propertyData;
    } catch (error) {
      console.error('Error looking up property by address:', error);
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
      // In production, this would call Melissa API for contact verification
      // For now, return enhanced contact info
      return {
        name: contact.name,
        mailingAddress: contact.address,
        phone: contact.phone || 'Not available',
        email: contact.email || 'Not available'
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

  private async getRegridData(address: string): Promise<PropertyData | null> {
    try {
      // In production, this would make actual API calls to Regrid
      // Mock data structure matching expected response
      const mockData: PropertyData = {
        address: address,
        apn: `${Math.random().toString(36).substr(2, 9)}`,
        owner: {
          name: "John & Jane Property Owner",
          mailingAddress: address,
          phone: "555-0123",
          email: "owner@example.com"
        },
        details: {
          propertyType: "Single Family Residential",
          yearBuilt: 1995,
          squareFootage: 2400,
          lotSize: 0.25,
          bedrooms: 3,
          bathrooms: 2,
          estimatedValue: 285000,
          lastSaleDate: new Date('2019-06-15'),
          lastSalePrice: 245000
        },
        coordinates: {
          latitude: 33.7490 + (Math.random() - 0.5) * 0.01,
          longitude: -84.3880 + (Math.random() - 0.5) * 0.01
        },
        sourceProviders: []
      };

      return mockData;
    } catch (error) {
      console.error('Regrid API error:', error);
      return null;
    }
  }

  private async getAttomData(address: string): Promise<PropertyData | null> {
    try {
      // In production, this would make actual API calls to ATTOM
      // Mock data structure matching expected response
      const mockData: PropertyData = {
        address: address,
        owner: {
          name: "Property Owner LLC",
          mailingAddress: address,
        },
        details: {
          propertyType: "Residential",
          yearBuilt: 1988,
          squareFootage: 2100,
          estimatedValue: 270000
        },
        coordinates: {
          latitude: 33.7490 + (Math.random() - 0.5) * 0.01,
          longitude: -84.3880 + (Math.random() - 0.5) * 0.01
        },
        sourceProviders: []
      };

      return mockData;
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
