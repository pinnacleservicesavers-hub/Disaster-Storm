import { GPSExtractionService, GPSCoordinates } from './gpsExtraction.js';
import { ReverseGeocodingService, ReverseGeocodingResult } from './reverseGeocoding.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface PropertyOwnerResult {
  success: boolean;
  coordinates?: GPSCoordinates;
  address?: ReverseGeocodingResult;
  propertyOwner?: {
    id: string;
    name: string;
    address: string;
    phone: string;
    email: string;
    propertyDamage: string;
    insuranceCompany: string;
    claimNumber: string;
    estimatedCost: string;
    matchMethod: 'gps_proximity' | 'address_match' | 'exact_match';
    confidence: number;
    distance?: number; // meters
  };
  error?: string;
}

export class PropertyOwnerLookupService {
  private gpsService: GPSExtractionService;
  private geocodingService: ReverseGeocodingService;
  private homeownersData: any = null;

  constructor() {
    this.gpsService = new GPSExtractionService();
    this.geocodingService = new ReverseGeocodingService();
    this.loadHomeownersDatabase();
  }

  /**
   * Load homeowners database from JSON file
   */
  private loadHomeownersDatabase() {
    try {
      const homeownersPath = path.join(__dirname, '..', '..', 'data', 'homeowners.json');
      
      if (fs.existsSync(homeownersPath)) {
        const rawData = fs.readFileSync(homeownersPath, 'utf-8');
        this.homeownersData = JSON.parse(rawData);
        console.log(`📋 Loaded ${this.homeownersData.homeowners?.length || 0} homeowner records`);
      } else {
        console.error('❌ Homeowners database not found at:', homeownersPath);
      }
    } catch (error) {
      console.error('❌ Error loading homeowners database:', error);
    }
  }

  /**
   * Process uploaded image to identify property owner
   */
  async identifyPropertyOwnerFromImage(imageBuffer: Buffer): Promise<PropertyOwnerResult> {
    try {
      console.log('🔍 Starting property owner identification from image...');

      // Step 1: Extract GPS coordinates from image
      const coordinates = await this.gpsService.extractGPSFromImage(imageBuffer);
      
      if (!coordinates) {
        return {
          success: false,
          error: 'No GPS coordinates found in image metadata'
        };
      }

      console.log('📍 GPS coordinates extracted:', coordinates);

      // Step 2: Validate coordinates
      if (!this.gpsService.validateCoordinates(coordinates)) {
        return {
          success: false,
          coordinates,
          error: 'Invalid GPS coordinates detected'
        };
      }

      // Step 3: Reverse geocode to get address
      const address = await this.geocodingService.reverseGeocode(coordinates.latitude, coordinates.longitude);
      
      if (!address) {
        return {
          success: false,
          coordinates,
          error: 'Unable to determine address from GPS coordinates'
        };
      }

      console.log('🏠 Address resolved:', address.formattedAddress);

      // Step 4: Find matching property owner
      const propertyOwner = await this.findMatchingPropertyOwner(coordinates, address);

      if (!propertyOwner) {
        return {
          success: false,
          coordinates,
          address,
          error: 'No matching property owner found in database'
        };
      }

      console.log('✅ Property owner identified:', propertyOwner.name);

      return {
        success: true,
        coordinates,
        address,
        propertyOwner
      };

    } catch (error) {
      console.error('❌ Error identifying property owner:', error);
      return {
        success: false,
        error: `Processing error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Process uploaded video to identify property owner
   */
  async identifyPropertyOwnerFromVideo(videoPath: string): Promise<PropertyOwnerResult> {
    try {
      console.log('🔍 Starting property owner identification from video...');

      // Step 1: Extract GPS coordinates from video
      const coordinates = await this.gpsService.extractGPSFromVideo(videoPath);
      
      if (!coordinates) {
        return {
          success: false,
          error: 'No GPS coordinates found in video metadata'
        };
      }

      console.log('📍 GPS coordinates extracted from video:', coordinates);

      // Continue with same process as image
      if (!this.gpsService.validateCoordinates(coordinates)) {
        return {
          success: false,
          coordinates,
          error: 'Invalid GPS coordinates detected'
        };
      }

      const address = await this.geocodingService.reverseGeocode(coordinates.latitude, coordinates.longitude);
      
      if (!address) {
        return {
          success: false,
          coordinates,
          error: 'Unable to determine address from GPS coordinates'
        };
      }

      const propertyOwner = await this.findMatchingPropertyOwner(coordinates, address);

      if (!propertyOwner) {
        return {
          success: false,
          coordinates,
          address,
          error: 'No matching property owner found in database'
        };
      }

      return {
        success: true,
        coordinates,
        address,
        propertyOwner
      };

    } catch (error) {
      console.error('❌ Error identifying property owner from video:', error);
      return {
        success: false,
        error: `Processing error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Find matching property owner using coordinates and address
   */
  private async findMatchingPropertyOwner(coordinates: GPSCoordinates, address: ReverseGeocodingResult): Promise<PropertyOwnerResult['propertyOwner'] | null> {
    if (!this.homeownersData?.homeowners) {
      console.log('❌ No homeowners data available');
      return null;
    }

    let bestMatch: PropertyOwnerResult['propertyOwner'] | null = null;
    let bestScore = 0;

    for (const homeowner of this.homeownersData.homeowners) {
      const score = await this.calculateMatchScore(coordinates, address, homeowner);
      
      if (score.total > bestScore && score.total >= 0.3) { // Minimum 30% confidence
        bestScore = score.total;
        bestMatch = {
          id: homeowner.id,
          name: homeowner.name,
          address: homeowner.address,
          phone: homeowner.phone,
          email: homeowner.email,
          propertyDamage: homeowner.propertyDamage,
          insuranceCompany: homeowner.insuranceCompany,
          claimNumber: homeowner.claimNumber,
          estimatedCost: homeowner.estimatedCost,
          matchMethod: score.method,
          confidence: Math.round(score.total * 100) / 100,
          distance: score.distance
        };
      }
    }

    return bestMatch;
  }

  /**
   * Calculate match score between coordinates/address and homeowner record
   */
  private async calculateMatchScore(
    coordinates: GPSCoordinates, 
    address: ReverseGeocodingResult, 
    homeowner: any
  ): Promise<{ total: number; method: 'gps_proximity' | 'address_match' | 'exact_match'; distance?: number }> {
    
    let gpsScore = 0;
    let addressScore = 0;
    let distance: number | undefined;

    // GPS proximity scoring
    if (homeowner.coordinates) {
      const homeownerCoords = {
        latitude: homeowner.coordinates.lat,
        longitude: homeowner.coordinates.lng
      };
      
      distance = this.gpsService.calculateDistance(coordinates, homeownerCoords);
      
      if (distance <= 10) { // Within 10 meters - very likely same property
        gpsScore = 1.0;
      } else if (distance <= 50) { // Within 50 meters - likely same property or very close
        gpsScore = 0.8;
      } else if (distance <= 100) { // Within 100 meters - could be same property
        gpsScore = 0.6;
      } else if (distance <= 500) { // Within 500 meters - same neighborhood
        gpsScore = 0.3;
      }
    }

    // Address matching scoring
    if (address.formattedAddress && homeowner.address) {
      addressScore = this.geocodingService.calculateAddressSimilarity(
        address.formattedAddress,
        homeowner.address
      );
    }

    // Determine best method and final score
    let finalScore: number;
    let method: 'gps_proximity' | 'address_match' | 'exact_match';

    if (gpsScore >= 0.8 && addressScore >= 0.7) {
      method = 'exact_match';
      finalScore = Math.max(gpsScore, addressScore);
    } else if (gpsScore >= addressScore) {
      method = 'gps_proximity';
      finalScore = gpsScore;
    } else {
      method = 'address_match';
      finalScore = addressScore;
    }

    return {
      total: finalScore,
      method,
      distance: distance ? Math.round(distance) : undefined
    };
  }

  /**
   * Get property owner by exact coordinates (for testing)
   */
  async getPropertyOwnerByCoordinates(latitude: number, longitude: number): Promise<PropertyOwnerResult> {
    const coordinates: GPSCoordinates = { latitude, longitude };
    
    if (!this.gpsService.validateCoordinates(coordinates)) {
      return {
        success: false,
        error: 'Invalid coordinates provided'
      };
    }

    const address = await this.geocodingService.reverseGeocode(latitude, longitude);
    
    if (!address) {
      return {
        success: false,
        coordinates,
        error: 'Unable to resolve address'
      };
    }

    const propertyOwner = await this.findMatchingPropertyOwner(coordinates, address);

    return {
      success: !!propertyOwner,
      coordinates,
      address,
      propertyOwner: propertyOwner || undefined,
      error: propertyOwner ? undefined : 'No matching property owner found'
    };
  }

  /**
   * Refresh homeowners database
   */
  refreshDatabase(): void {
    this.loadHomeownersDatabase();
  }
}