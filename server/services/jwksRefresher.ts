import { storage } from '../storage';

/**
 * Background JWKS Refresher Service
 * Automatically fetches JWKS from identity provider with smart caching
 */
export class JWKSRefresherService {
  private refreshTimer: NodeJS.Timeout | null = null;
  private isRunning = false;
  
  // Refresh bounds (in milliseconds)
  private readonly MIN_REFRESH_INTERVAL = 30 * 60 * 1000; // 30 minutes
  private readonly MAX_REFRESH_INTERVAL = 6 * 60 * 60 * 1000; // 6 hours
  private readonly DEFAULT_REFRESH_INTERVAL = 6 * 60 * 60 * 1000; // 6 hours
  
  /**
   * Start the background refresher
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('⚠️ JWKS refresher already running');
      return;
    }
    
    this.isRunning = true;
    console.log('🔄 Starting JWKS background refresher...');
    
    // Do initial fetch
    await this.refreshJWKS();
    
    // Schedule next refresh
    this.scheduleNextRefresh();
  }
  
  /**
   * Stop the background refresher
   */
  stop(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
    this.isRunning = false;
    console.log('🛑 JWKS background refresher stopped');
  }
  
  /**
   * Schedule the next refresh based on Cache-Control or defaults
   */
  private scheduleNextRefresh(): void {
    const settings = storage.getOIDCSettings();
    const meta = (settings as any).then((s: any) => s.jwks_meta) || {};
    
    // Calculate next refresh interval
    let interval = this.DEFAULT_REFRESH_INTERVAL;
    
    if (meta.max_age) {
      // Use Cache-Control max-age if available
      interval = meta.max_age * 1000; // Convert seconds to ms
      
      // Clamp to bounds
      interval = Math.max(this.MIN_REFRESH_INTERVAL, Math.min(interval, this.MAX_REFRESH_INTERVAL));
    }
    
    const nextRefresh = new Date(Date.now() + interval);
    console.log(`⏰ Next JWKS refresh scheduled for ${nextRefresh.toISOString()} (in ${Math.floor(interval / 60000)} minutes)`);
    
    this.refreshTimer = setTimeout(() => {
      this.refreshJWKS();
      this.scheduleNextRefresh();
    }, interval);
  }
  
  /**
   * Fetch JWKS from identity provider
   */
  private async refreshJWKS(): Promise<void> {
    try {
      const settings = await storage.getOIDCSettings();
      const { issuer, jwks_meta } = settings as any;
      
      if (!issuer) {
        console.log('⚠️ JWKS refresh skipped: issuer not configured');
        return;
      }
      
      const url = `${issuer.replace(/\/$/, '')}/.well-known/jwks.json`;
      console.log(`🔄 Fetching JWKS from ${url}...`);
      
      const headers: Record<string, string> = {
        'Accept': 'application/json'
      };
      
      // Add If-None-Match header if we have an ETag
      if (jwks_meta?.etag) {
        headers['If-None-Match'] = jwks_meta.etag;
      }
      
      const response = await fetch(url, {
        method: 'GET',
        headers,
        signal: AbortSignal.timeout(10000)
      });
      
      // Handle 304 Not Modified
      if (response.status === 304) {
        console.log('✅ JWKS unchanged (304 Not Modified)');
        await storage.setOIDCSettings({
          jwks_meta: {
            ...jwks_meta,
            last_fetch: new Date().toISOString(),
            last_status: 304
          }
        });
        return;
      }
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const jwks = await response.json();
      
      // Validate JWKS structure
      if (!jwks.keys || !Array.isArray(jwks.keys)) {
        throw new Error('Invalid JWKS format: missing keys array');
      }
      
      // Extract cache metadata
      const etag = response.headers.get('etag') || undefined;
      const cacheControl = response.headers.get('cache-control');
      let maxAge: number | undefined;
      
      if (cacheControl) {
        const match = cacheControl.match(/max-age=(\d+)/);
        if (match) {
          maxAge = parseInt(match[1], 10);
        }
      }
      
      // Update settings with new JWKS and metadata
      await storage.setOIDCSettings({
        jwks,
        jwks_meta: {
          last_fetch: new Date().toISOString(),
          last_status: response.status,
          etag,
          max_age: maxAge,
          key_count: jwks.keys.length
        }
      });
      
      console.log(`✅ JWKS refreshed successfully: ${jwks.keys.length} keys`);
      if (etag) console.log(`   ETag: ${etag}`);
      if (maxAge) console.log(`   Cache-Control: max-age=${maxAge}s`);
      
    } catch (error: any) {
      console.error('❌ JWKS refresh failed:', error.message);
      
      // Update metadata with error
      const settings = await storage.getOIDCSettings();
      await storage.setOIDCSettings({
        jwks_meta: {
          ...(settings as any).jwks_meta,
          last_fetch: new Date().toISOString(),
          last_status: 'error',
          last_error: error.message
        }
      });
    }
  }
  
  /**
   * Trigger an immediate refresh (useful for testing)
   */
  async refresh(): Promise<void> {
    await this.refreshJWKS();
  }
}

// Export singleton instance
export const jwksRefresher = new JWKSRefresherService();
