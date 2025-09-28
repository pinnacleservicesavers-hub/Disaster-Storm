import { ExifImage } from 'exif';
import sharp from 'sharp';

export interface GPSCoordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  timestamp?: Date;
}

export interface MediaLocationData {
  coordinates?: GPSCoordinates;
  address?: string;
  propertyOwner?: {
    name: string;
    phone: string;
    email: string;
    mailingAddress?: string;
  };
  error?: string;
}

export class GPSExtractionService {
  
  /**
   * Extract GPS coordinates from image EXIF data
   */
  async extractGPSFromImage(imageBuffer: Buffer): Promise<GPSCoordinates | null> {
    try {
      // Use sharp to extract EXIF data efficiently
      const metadata = await sharp(imageBuffer).metadata();
      
      if (!metadata.exif) {
        console.log('No EXIF data found in image');
        return null;
      }

      // Parse EXIF data using exif library for detailed GPS info
      return new Promise((resolve, reject) => {
        new ExifImage({ image: imageBuffer }, (error, exifData) => {
          if (error) {
            console.log('Error parsing EXIF:', error.message);
            resolve(null);
            return;
          }

          const gps = exifData.gps;
          if (!gps || !gps.GPSLatitude || !gps.GPSLongitude) {
            console.log('No GPS data found in EXIF');
            resolve(null);
            return;
          }

          try {
            // Convert GPS coordinates from degrees/minutes/seconds to decimal
            const latitude = this.convertDMSToDD(
              gps.GPSLatitude, 
              gps.GPSLatitudeRef
            );
            const longitude = this.convertDMSToDD(
              gps.GPSLongitude, 
              gps.GPSLongitudeRef
            );

            const coordinates: GPSCoordinates = {
              latitude,
              longitude,
              accuracy: gps.GPSHPositioningError || undefined,
              altitude: gps.GPSAltitude || undefined,
              timestamp: gps.GPSDateStamp ? new Date(gps.GPSDateStamp) : undefined
            };

            console.log('GPS coordinates extracted:', coordinates);
            resolve(coordinates);
          } catch (conversionError) {
            console.error('Error converting GPS coordinates:', conversionError);
            resolve(null);
          }
        });
      });

    } catch (error) {
      console.error('Error extracting GPS from image:', error);
      return null;
    }
  }

  /**
   * Extract GPS coordinates from video metadata
   */
  async extractGPSFromVideo(videoPath: string): Promise<GPSCoordinates | null> {
    try {
      // For video files, we would typically use ffprobe to extract metadata
      // This is a basic implementation that can be enhanced
      const ffmpeg = await import('fluent-ffmpeg');
      
      return new Promise((resolve) => {
        ffmpeg.default.ffprobe(videoPath, (err, metadata) => {
          if (err) {
            console.error('Error reading video metadata:', err);
            resolve(null);
            return;
          }

          // Look for GPS data in video metadata
          const format = metadata.format;
          const tags = format.tags || {};
          
          // Common GPS tag formats in video files
          const lat = tags['com.apple.quicktime.location.ISO6709'] || 
                     tags['location'] || 
                     tags['GPS'];

          if (lat && typeof lat === 'string') {
            // Parse GPS string format like "+37.7749-122.4194/"
            const match = lat.match(/([+-]\d+\.\d+)([+-]\d+\.\d+)/);
            if (match) {
              resolve({
                latitude: parseFloat(match[1]),
                longitude: parseFloat(match[2]),
                timestamp: new Date()
              });
              return;
            }
          }

          console.log('No GPS data found in video metadata');
          resolve(null);
        });
      });

    } catch (error) {
      console.error('Error extracting GPS from video:', error);
      return null;
    }
  }

  /**
   * Convert degrees, minutes, seconds to decimal degrees
   */
  private convertDMSToDD(dms: number[], ref: string): number {
    if (!dms || dms.length < 3) {
      throw new Error('Invalid DMS array');
    }

    let dd = dms[0] + dms[1] / 60 + dms[2] / 3600;
    
    // Apply direction (South and West are negative)
    if (ref === 'S' || ref === 'W') {
      dd = dd * -1;
    }
    
    return dd;
  }

  /**
   * Validate GPS coordinates
   */
  validateCoordinates(coordinates: GPSCoordinates): boolean {
    const { latitude, longitude } = coordinates;
    
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
   * Calculate distance between two GPS coordinates (in meters)
   */
  calculateDistance(coord1: GPSCoordinates, coord2: GPSCoordinates): number {
    const R = 6371000; // Earth's radius in meters
    const φ1 = coord1.latitude * Math.PI / 180;
    const φ2 = coord2.latitude * Math.PI / 180;
    const Δφ = (coord2.latitude - coord1.latitude) * Math.PI / 180;
    const Δλ = (coord2.longitude - coord1.longitude) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
  }

  /**
   * Find nearest property from homeowner database
   */
  async findNearestProperty(coordinates: GPSCoordinates, maxDistance: number = 100): Promise<any | null> {
    try {
      const fs = await import('fs');
      const path = await import('path');
      const { fileURLToPath } = await import('url');
      
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
      const homeownersPath = path.join(__dirname, '..', '..', 'data', 'homeowners.json');
      
      if (!fs.existsSync(homeownersPath)) {
        console.log('Homeowners database not found');
        return null;
      }
      
      const homeownersData = JSON.parse(fs.readFileSync(homeownersPath, 'utf-8'));
      let closestProperty = null;
      let minDistance = Infinity;
      
      for (const homeowner of homeownersData.homeowners) {
        if (homeowner.coordinates) {
          const distance = this.calculateDistance(coordinates, {
            latitude: homeowner.coordinates.lat,
            longitude: homeowner.coordinates.lng
          });
          
          if (distance < minDistance && distance <= maxDistance) {
            minDistance = distance;
            closestProperty = {
              ...homeowner,
              distance: Math.round(distance)
            };
          }
        }
      }
      
      return closestProperty;
    } catch (error) {
      console.error('Error finding nearest property:', error);
      return null;
    }
  }
}