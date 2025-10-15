import crypto from 'crypto';

/**
 * LRU Cache with TTL and Eviction
 * Inspired by the Python MVP's caching strategy
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export class LRUCache<T = any> {
  private cache: Map<string, CacheEntry<T>>;
  private readonly maxSize: number;
  private readonly sweepInterval: NodeJS.Timeout;

  constructor(maxSize: number = 500, sweepEveryMs: number = 60_000) {
    this.cache = new Map();
    this.maxSize = maxSize;

    // Periodic sweep for expired entries
    this.sweepInterval = setInterval(() => {
      this.sweep();
    }, sweepEveryMs);

    // Don't prevent Node from exiting
    this.sweepInterval.unref?.();

    console.log(`💾 LRU Cache initialized (max: ${maxSize} entries, sweep: ${sweepEveryMs}ms)`);
  }

  /**
   * Set a value in the cache
   */
  set(key: string, data: T, ttlMs: number): void {
    // Evict oldest entries if at limit
    while (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs
    });
  }

  /**
   * Get a value from the cache
   * Returns null if expired or not found
   */
  get(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if expired
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    // LRU: Move to end (newest position)
    this.cache.delete(key);
    this.cache.set(key, entry);

    return entry.data;
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Delete a specific key
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get current cache size
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Sweep expired entries
   */
  private sweep(): void {
    const now = Date.now();
    let removed = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        removed++;
      }
    }

    if (removed > 0) {
      console.log(`🧹 Cache sweep: removed ${removed} expired entries`);
    }
  }

  /**
   * Stop the sweep interval
   */
  destroy(): void {
    clearInterval(this.sweepInterval);
  }
}

/**
 * HTTP Cache Utilities
 */

/**
 * Generate a weak ETag from JSON data
 */
export function generateETag(data: any): string {
  const str = JSON.stringify(data);
  const hash = crypto.createHash('sha1').update(str).digest('hex');
  return `W/"${hash}"`;
}

/**
 * Send JSON response with cache headers
 */
export function sendCachedJSON(
  req: any,
  res: any,
  body: any,
  maxAgeSec: number = 60
): void {
  const etag = generateETag(body);
  const inm = req.headers['if-none-match'];

  res.setHeader('Cache-Control', `public, max-age=${maxAgeSec}`);
  res.setHeader('ETag', etag);
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (inm && inm === etag) {
    res.status(304).end(); // 304 Not Modified
    return;
  }

  res.status(200).json(body);
}

// Global cache instances
export const geocodeCache = new LRUCache(500); // 500 entries for geocoding
export const forecastCache = new LRUCache(500); // 500 entries for forecasts
