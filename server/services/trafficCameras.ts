import fetch from 'node-fetch';
import { db } from '../db';
import { trafficCameras, trafficCamSubscriptions, trafficCamAlerts } from '../../shared/schema';
import { eq, and, sql } from 'drizzle-orm';

export interface TrafficCamera {
  id: string;
  name: string;
  lat: number;
  lng: number;
  state: string;
  city: string;
  highway?: string;
  direction?: string;
  imageUrl?: string;
  streamUrl?: string;
  source: 'wsdot' | 'penndot' | 'txdot' | 'nycdot' | 'trafficland';
  lastUpdated: Date;
  isActive: boolean;
  description?: string;
}

export interface CameraProvider {
  name: string;
  getCameras(): Promise<TrafficCamera[]>;
  getCameraImage(cameraId: string): Promise<string | null>;
  fetchImageBytes(cameraId: string): Promise<Buffer | null>;
  validateApiKey?(): Promise<boolean>;
}

// Cache interfaces
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

interface ImageBytesResult {
  imageData: Buffer;
  contentType: string;
  timestamp: Date;
}

// Washington State DOT API integration
export class WSDOTProvider implements CameraProvider {
  name = 'Washington State DOT';
  private baseUrl = 'https://wsdot.wa.gov/traffic/api';
  private accessCode: string | null;

  constructor() {
    this.accessCode = process.env.WSDOT_ACCESS_CODE || null;
  }

  async getCameras(): Promise<TrafficCamera[]> {
    if (!this.accessCode) {
      console.log('⚠️  WSDOT API requires registration for access code. Set WSDOT_ACCESS_CODE environment variable.');
      console.log('🔗 Register at: https://wsdot.wa.gov/traffic/api/');
      return [];
    }

    try {
      // WSDOT API requires access code - proper endpoint structure
      const response = await fetch(`${this.baseUrl}/HighwayCameras?AccessCode=${this.accessCode}&format=json`, {
        headers: {
          'User-Agent': 'StormLead-Master-TrafficCamWatcher/1.0 (contact@stormlead.com)',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`WSDOT API error: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json() as any;
      
      return this.transformWSDOTData(data);
    } catch (error) {
      console.error('WSDOT API error:', error);
      return [];
    }
  }

  async getCameraImage(cameraId: string): Promise<string | null> {
    try {
      const response = await fetch(`${this.baseUrl}/cameras/${cameraId}/image`, {
        headers: {
          'User-Agent': 'StormLead-Master-TrafficCamWatcher/1.0 (contact@stormlead.com)'
        }
      });

      if (!response.ok) return null;
      
      const imageUrl = response.url;
      return imageUrl;
    } catch (error) {
      console.error(`WSDOT camera ${cameraId} image error:`, error);
      return null;
    }
  }

  async fetchImageBytes(cameraId: string): Promise<Buffer | null> {
    const imageUrl = await this.getCameraImage(cameraId);
    if (!imageUrl) return null;

    return this.downloadImageBytes(imageUrl);
  }

  private async downloadImageBytes(imageUrl: string, maxRetries: number = 3): Promise<Buffer | null> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000); // 15 second timeout
        
        const response = await fetch(imageUrl, {
          headers: {
            'User-Agent': 'StormLead-Master-TrafficCamWatcher/1.0 (contact@stormlead.com)'
          },
          signal: controller.signal
        });
        
        clearTimeout(timeout);
        
        if (!response.ok) {
          if (attempt === maxRetries) return null;
          await this.delay(1000 * attempt); // Progressive backoff
          continue;
        }
        
        const buffer = await response.buffer();
        return buffer;
      } catch (error) {
        console.error(`WSDOT image download attempt ${attempt}/${maxRetries} failed:`, error);
        if (attempt === maxRetries) return null;
        await this.delay(1000 * attempt);
      }
    }
    return null;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private transformWSDOTData(data: any): TrafficCamera[] {
    // Transform WSDOT data format to our standard format
    if (!Array.isArray(data)) return [];

    return data.map((camera: any) => ({
      id: `wsdot_${camera.id || camera.CameraID}`,
      name: camera.title || camera.CameraName || 'WSDOT Camera',
      lat: parseFloat(camera.lat || camera.Latitude || '0'),
      lng: parseFloat(camera.lng || camera.Longitude || '0'),
      state: 'WA',
      city: camera.city || camera.CameraLocation || 'Washington',
      highway: camera.roadway || camera.HighwayName,
      direction: camera.direction || camera.Direction,
      imageUrl: camera.url || camera.ImageURL,
      source: 'wsdot' as const,
      lastUpdated: new Date(),
      isActive: true,
      description: camera.description || camera.CameraDescription
    }));
  }
}

// NYC DOT provider (direct JPG access)
export class NYCDOTProvider implements CameraProvider {
  name = 'NYC DOT';
  private baseUrl = 'https://nyc.gov/cctv';

  async getCameras(): Promise<TrafficCamera[]> {
    // NYC DOT doesn't provide a cameras list API, so we'll use known camera IDs
    // In production, this would be populated from their data feed agreement
    const knownCameras = [
      { id: '254', name: 'Manhattan Bridge', lat: 40.7081, lng: -73.9971, borough: 'Manhattan' },
      { id: '240', name: 'Brooklyn Bridge', lat: 40.7061, lng: -73.9969, borough: 'Manhattan' },
      { id: '180', name: 'Williamsburg Bridge', lat: 40.7134, lng: -73.9631, borough: 'Manhattan' },
      // Add more known cameras here
    ];

    return knownCameras.map(camera => ({
      id: `nycdot_${camera.id}`,
      name: `NYC ${camera.name}`,
      lat: camera.lat,
      lng: camera.lng,
      state: 'NY',
      city: 'New York',
      imageUrl: `${this.baseUrl}${camera.id}.jpg`,
      source: 'nycdot' as const,
      lastUpdated: new Date(),
      isActive: true,
      description: `NYC DOT camera at ${camera.name}`
    }));
  }

  async getCameraImage(cameraId: string): Promise<string | null> {
    // Extract numeric ID from our full ID
    const numericId = cameraId.replace('nycdot_', '');
    const imageUrl = `${this.baseUrl}${numericId}.jpg`;

    try {
      const response = await fetch(imageUrl, {
        headers: {
          'User-Agent': 'StormLead-Master-TrafficCamWatcher/1.0 (contact@stormlead.com)'
        }
      });

      if (!response.ok) return null;
      return imageUrl;
    } catch (error) {
      console.error(`NYC DOT camera ${cameraId} image error:`, error);
      return null;
    }
  }

  async fetchImageBytes(cameraId: string): Promise<Buffer | null> {
    const numericId = cameraId.replace('nycdot_', '');
    const imageUrl = `${this.baseUrl}${numericId}.jpg`;
    
    return this.downloadImageBytes(imageUrl);
  }

  private async downloadImageBytes(imageUrl: string, maxRetries: number = 3): Promise<Buffer | null> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);
        
        const response = await fetch(imageUrl, {
          headers: {
            'User-Agent': 'StormLead-Master-TrafficCamWatcher/1.0 (contact@stormlead.com)'
          },
          signal: controller.signal
        });
        
        clearTimeout(timeout);
        
        if (!response.ok) {
          if (attempt === maxRetries) return null;
          await this.delay(1000 * attempt);
          continue;
        }
        
        const buffer = await response.buffer();
        return buffer;
      } catch (error) {
        console.error(`NYC DOT image download attempt ${attempt}/${maxRetries} failed:`, error);
        if (attempt === maxRetries) return null;
        await this.delay(1000 * attempt);
      }
    }
    return null;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// TrafficLand provider (commercial API)
export class TrafficLandProvider implements CameraProvider {
  name = 'TrafficLand';
  private baseUrl = 'https://api.trafficland.com/v1.5';
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async validateApiKey(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/data/cameras?limit=1&key=${this.apiKey}`, {
        headers: {
          'User-Agent': 'StormLead-Master-TrafficCamWatcher/1.0 (contact@stormlead.com)',
          'Accept': 'application/json'
        }
      });

      return response.ok;
    } catch (error) {
      return false;
    }
  }

  async getCameras(): Promise<TrafficCamera[]> {
    try {
      const response = await fetch(`${this.baseUrl}/data/cameras?key=${this.apiKey}`, {
        headers: {
          'User-Agent': 'StormLead-Master-TrafficCamWatcher/1.0 (contact@stormlead.com)',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`TrafficLand API error: ${response.status}`);
      }

      const data = await response.json() as any;
      return this.transformTrafficLandData(data);
    } catch (error) {
      console.error('TrafficLand API error:', error);
      return [];
    }
  }

  async getCameraImage(cameraId: string): Promise<string | null> {
    try {
      const response = await fetch(`${this.baseUrl}/data/cameras/${cameraId}/media?key=${this.apiKey}`, {
        headers: {
          'User-Agent': 'StormLead-Master-TrafficCamWatcher/1.0 (contact@stormlead.com)',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) return null;

      const data = await response.json() as any;
      return data.imageUrl || data.streamUrl || null;
    } catch (error) {
      console.error(`TrafficLand camera ${cameraId} image error:`, error);
      return null;
    }
  }

  async fetchImageBytes(cameraId: string): Promise<Buffer | null> {
    const imageUrl = await this.getCameraImage(cameraId);
    if (!imageUrl) return null;

    return this.downloadImageBytes(imageUrl);
  }

  private async downloadImageBytes(imageUrl: string, maxRetries: number = 3): Promise<Buffer | null> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);
        
        const response = await fetch(imageUrl, {
          headers: {
            'User-Agent': 'StormLead-Master-TrafficCamWatcher/1.0 (contact@stormlead.com)'
          },
          signal: controller.signal
        });
        
        clearTimeout(timeout);
        
        if (!response.ok) {
          if (attempt === maxRetries) return null;
          await this.delay(1000 * attempt);
          continue;
        }
        
        const buffer = await response.buffer();
        return buffer;
      } catch (error) {
        console.error(`TrafficLand image download attempt ${attempt}/${maxRetries} failed:`, error);
        if (attempt === maxRetries) return null;
        await this.delay(1000 * attempt);
      }
    }
    return null;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private transformTrafficLandData(data: any): TrafficCamera[] {
    if (!data.cameras || !Array.isArray(data.cameras)) return [];

    return data.cameras.map((camera: any) => ({
      id: `trafficland_${camera.id}`,
      name: camera.name || camera.title || 'TrafficLand Camera',
      lat: parseFloat(camera.latitude || '0'),
      lng: parseFloat(camera.longitude || '0'),
      state: camera.state || camera.region?.state,
      city: camera.city || camera.region?.city,
      highway: camera.highway || camera.roadway,
      direction: camera.direction,
      imageUrl: camera.imageUrl,
      streamUrl: camera.streamUrl,
      source: 'trafficland' as const,
      lastUpdated: new Date(),
      isActive: camera.isActive !== false,
      description: camera.description
    }));
  }
}

// Main service class with caching and rate limiting
export class TrafficCameraService {
  private providers: CameraProvider[] = [];
  private cameraCache = new Map<string, CacheEntry<TrafficCamera[]>>();
  private imageCache = new Map<string, CacheEntry<ImageBytesResult>>();
  private rateLimits = new Map<string, RateLimitEntry>();
  
  // Cache TTL settings (in milliseconds)
  private readonly CAMERA_LIST_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly IMAGE_TTL = 2 * 60 * 1000; // 2 minutes
  
  // Rate limit settings
  private readonly RATE_LIMITS = {
    'wsdot': { requests: 10, windowMs: 60 * 1000 }, // 10 requests per minute
    'nycdot': { requests: 30, windowMs: 60 * 1000 }, // 30 requests per minute
    'trafficland': { requests: 100, windowMs: 60 * 1000 } // 100 requests per minute
  };

  constructor() {
    // Initialize free providers by default
    this.providers.push(new WSDOTProvider());
    this.providers.push(new NYCDOTProvider());

    // Add TrafficLand if API key is available
    const trafficLandKey = process.env.TRAFFICLAND_API_KEY;
    if (trafficLandKey) {
      this.providers.push(new TrafficLandProvider(trafficLandKey));
    }

    // Set up periodic cache cleanup
    setInterval(() => this.cleanupExpiredCache(), 5 * 60 * 1000); // Every 5 minutes
  }

  async getAllCameras(): Promise<TrafficCamera[]> {
    // Check cache first
    const cacheKey = 'all_cameras';
    const cached = this.getCachedData(this.cameraCache, cacheKey);
    if (cached) {
      console.log('📦 Returning cached camera data');
      return cached;
    }

    const allCameras: TrafficCamera[] = [];

    for (const provider of this.providers) {
      const providerKey = this.getProviderKey(provider.name);
      
      // Check rate limit
      if (!this.checkRateLimit(providerKey)) {
        console.log(`⏳ Rate limit reached for ${provider.name}, skipping`);
        continue;
      }

      try {
        console.log(`📸 Fetching cameras from ${provider.name}...`);
        const cameras = await provider.getCameras();
        
        // Store in database if not already present
        await this.syncCamerasToDatabase(cameras, provider.name);
        
        allCameras.push(...cameras);
        console.log(`✅ Fetched ${cameras.length} cameras from ${provider.name}`);
        
        // Increment rate limit counter
        this.incrementRateLimit(providerKey);
      } catch (error) {
        console.error(`❌ Error fetching cameras from ${provider.name}:`, error);
      }
    }

    // Cache the result
    this.setCachedData(this.cameraCache, cacheKey, allCameras, this.CAMERA_LIST_TTL);
    return allCameras;
  }

  async getCamerasByLocation(lat: number, lng: number, radiusKm: number = 50): Promise<TrafficCamera[]> {
    const allCameras = await this.getAllCameras();

    return allCameras.filter(camera => {
      const distance = this.calculateDistance(lat, lng, camera.lat, camera.lng);
      return distance <= radiusKm;
    });
  }

  async getCamerasByState(state: string): Promise<TrafficCamera[]> {
    const allCameras = await this.getAllCameras();
    return allCameras.filter(camera => 
      camera.state.toLowerCase() === state.toLowerCase()
    );
  }

  async getCameraImage(cameraId: string): Promise<string | null> {
    // Find the provider for this camera
    const [source] = cameraId.split('_');
    const provider = this.providers.find(p => 
      p.name.toLowerCase().includes(source) || 
      (source === 'wsdot' && p.name.includes('Washington')) ||
      (source === 'nycdot' && p.name.includes('NYC')) ||
      (source === 'trafficland' && p.name.includes('TrafficLand'))
    );

    if (!provider) return null;

    const providerKey = this.getProviderKey(provider.name);
    if (!this.checkRateLimit(providerKey)) {
      console.log(`⏳ Rate limit reached for ${provider.name}`);
      return null;
    }

    const result = await provider.getCameraImage(cameraId);
    if (result) {
      this.incrementRateLimit(providerKey);
    }
    
    return result;
  }

  async fetchImageBytes(cameraId: string): Promise<ImageBytesResult | null> {
    // Check cache first
    const cached = this.getCachedData(this.imageCache, cameraId);
    if (cached) {
      console.log(`📦 Returning cached image for ${cameraId}`);
      return cached;
    }

    // Find the provider for this camera
    const [source] = cameraId.split('_');
    const provider = this.providers.find(p => 
      p.name.toLowerCase().includes(source) || 
      (source === 'wsdot' && p.name.includes('Washington')) ||
      (source === 'nycdot' && p.name.includes('NYC')) ||
      (source === 'trafficland' && p.name.includes('TrafficLand'))
    );

    if (!provider) return null;

    const providerKey = this.getProviderKey(provider.name);
    if (!this.checkRateLimit(providerKey)) {
      console.log(`⏳ Rate limit reached for ${provider.name}`);
      return null;
    }

    try {
      const imageData = await provider.fetchImageBytes(cameraId);
      if (!imageData) return null;

      const result: ImageBytesResult = {
        imageData,
        contentType: 'image/jpeg', // Most traffic cameras serve JPEG
        timestamp: new Date()
      };

      // Cache the result
      this.setCachedData(this.imageCache, cameraId, result, this.IMAGE_TTL);
      this.incrementRateLimit(providerKey);

      return result;
    } catch (error) {
      console.error(`Error fetching image bytes for ${cameraId}:`, error);
      return null;
    }
  }

  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  // Cache management methods
  private getCachedData<T>(cache: Map<string, CacheEntry<T>>, key: string): T | null {
    const entry = cache.get(key);
    if (!entry) return null;
    
    if (Date.now() > entry.timestamp + entry.ttl) {
      cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  private setCachedData<T>(cache: Map<string, CacheEntry<T>>, key: string, data: T, ttl: number): void {
    cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  private cleanupExpiredCache(): void {
    const now = Date.now();
    
    // Clean camera cache
    for (const [key, entry] of this.cameraCache.entries()) {
      if (now > entry.timestamp + entry.ttl) {
        this.cameraCache.delete(key);
      }
    }
    
    // Clean image cache
    for (const [key, entry] of this.imageCache.entries()) {
      if (now > entry.timestamp + entry.ttl) {
        this.imageCache.delete(key);
      }
    }
    
    console.log('🧹 Cleaned up expired cache entries');
  }

  // Rate limiting methods
  private getProviderKey(providerName: string): string {
    if (providerName.includes('Washington') || providerName.includes('WSDOT')) return 'wsdot';
    if (providerName.includes('NYC')) return 'nycdot';
    if (providerName.includes('TrafficLand')) return 'trafficland';
    return 'unknown';
  }

  private checkRateLimit(providerKey: string): boolean {
    const limit = this.RATE_LIMITS[providerKey];
    if (!limit) return true; // No limit configured
    
    const now = Date.now();
    const entry = this.rateLimits.get(providerKey);
    
    if (!entry || now > entry.resetTime) {
      // Reset or initialize rate limit
      this.rateLimits.set(providerKey, {
        count: 0,
        resetTime: now + limit.windowMs
      });
      return true;
    }
    
    return entry.count < limit.requests;
  }

  private incrementRateLimit(providerKey: string): void {
    const entry = this.rateLimits.get(providerKey);
    if (entry) {
      entry.count++;
    }
  }

  // Database synchronization methods (temporarily disabled due to schema compilation issues)
  private async syncCamerasToDatabase(cameras: TrafficCamera[], providerName: string): Promise<void> {
    try {
      // TODO: Fix schema compilation issues and re-enable database sync
      console.log(`📊 Would sync ${cameras.length} cameras from ${providerName} to database`);
      /*
      for (const camera of cameras) {
        await db.insert(trafficCameras)
          .values({
            externalCameraId: camera.id,
            name: camera.name,
            description: camera.description || null,
            provider: providerName,
            feedUrl: camera.imageUrl || camera.streamUrl || '',
            thumbnailUrl: camera.imageUrl || null,
            latitude: camera.lat.toString(),
            longitude: camera.lng.toString(),
            address: `${camera.city}, ${camera.state}`,
            city: camera.city,
            county: camera.city,
            state: camera.state,
            highway: camera.highway || null,
            direction: camera.direction || null,
            isActive: camera.isActive,
            lastHealthCheck: new Date(),
            healthStatus: 'online',
            metadata: {
              source: camera.source,
              lastUpdated: camera.lastUpdated.toISOString()
            }
          });
      }
      */
    } catch (error) {
      console.error('Error syncing cameras to database:', error);
    }
  }

  // Database query methods
  async getCamerasFromDatabase(): Promise<TrafficCamera[]> {
    try {
      const dbCameras = await db.select().from(trafficCameras).where(eq(trafficCameras.isActive, true));
      
      return dbCameras.map(camera => ({
        id: camera.externalCameraId,
        name: camera.name,
        lat: parseFloat(camera.latitude),
        lng: parseFloat(camera.longitude),
        state: camera.state,
        city: camera.city,
        highway: camera.highway,
        direction: camera.direction,
        imageUrl: camera.feedUrl,
        streamUrl: camera.feedUrl,
        source: (camera.metadata as any)?.source || 'unknown' as any,
        lastUpdated: new Date(camera.lastHealthCheck || new Date()),
        isActive: camera.isActive,
        description: camera.description
      }));
    } catch (error) {
      console.error('Error fetching cameras from database:', error);
      return [];
    }
  }

  async subscribeToCamera(contractorId: string, cameraId: string, notifyTypes: string[], priority: string = 'normal'): Promise<any> {
    try {
      // TODO: Fix schema compilation issues and re-enable database operations
      console.log(`📋 Would create subscription for contractor ${contractorId} to camera ${cameraId}`);
      
      // Return mock subscription for now
      const subscription = {
        id: `sub_${Date.now()}`,
        contractorId,
        cameraId,
        notifyTypes,
        priority,
        isActive: true,
        createdAt: new Date().toISOString()
      };
      
      return subscription;
      
      /*
      const subscription = await db.insert(trafficCamSubscriptions)
        .values({
          contractorId,
          cameraId,
          notifyTypes: notifyTypes,
          priority,
          isActive: true
        })
        .returning();
      
      return subscription[0];
      */
    } catch (error) {
      console.error('Error creating camera subscription:', error);
      throw error;
    }
  }

  async getContractorSubscriptions(contractorId: string): Promise<any[]> {
    try {
      // TODO: Fix schema compilation issues and re-enable database operations
      console.log(`📋 Would fetch subscriptions for contractor ${contractorId}`);
      
      // Return mock subscriptions for now
      return [];
      
      /*
      return await db.select()
        .from(trafficCamSubscriptions)
        .where(and(
          eq(trafficCamSubscriptions.contractorId, contractorId),
          eq(trafficCamSubscriptions.isActive, true)
        ));
      */
    } catch (error) {
      console.error('Error fetching contractor subscriptions:', error);
      return [];
    }
  }
}

// Export singleton instance
export const trafficCameraService = new TrafficCameraService();