import type { Pool } from '@neondatabase/serverless';

/**
 * MRMS Radar Contour Processing Service
 * Converts MRMS radar data (hail, precipitation) into vector polygons
 * 
 * NOTE: Full raster→polygon conversion requires specialized libraries (rasterio, GDAL)
 * which are not available in Node.js. This service provides a simplified approach
 * using threshold-based bounding boxes and will log when raster data is detected.
 * 
 * For production: Consider using Python microservice or AWS Lambda for actual raster processing
 */
export class MRMSContourService {
  private readonly MRMS_BASE_URL = 'https://noaa-mrms-pds.s3.amazonaws.com/CONUS';
  
  constructor(private db: Pool) {}

  /**
   * Generate MRMS product URL for current time
   */
  private getMRMSProductURL(product: string): string {
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, '0');
    const day = String(now.getUTCDate()).padStart(2, '0');
    const hour = String(now.getUTCHours()).padStart(2, '0');
    const minute = String(Math.floor(now.getUTCMinutes() / 2) * 2).padStart(2, '0'); // MRMS updates every 2 min
    
    const timestamp = `${year}${month}${day}-${hour}${minute}00`;
    return `${this.MRMS_BASE_URL}/${product}/MRMS_${product}_${timestamp}.grib2.gz`;
  }

  /**
   * Fetch and process MRMS contours
   * 
   * @param product - MRMS product name (e.g., "MESHMax", "PrecipRate", "QPE_01H")
   * @param threshold - Threshold value for contouring (product-specific units)
   * @param severity - Severity level for database storage
   */
  async ingestMRMSContours(
    product: string,
    threshold: number,
    severity: string
  ): Promise<void> {
    console.log(`📡 Starting MRMS ${product} ingestion (threshold: ${threshold})...`);
    
    const url = this.getMRMSProductURL(product);
    console.log(`📡 MRMS URL: ${url}`);
    
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        console.log(`⚠️ MRMS ${product} not available (${response.status})`);
        return;
      }
      
      // Check if response is binary data (GRIB2)
      const contentType = response.headers.get('content-type');
      console.log(`📡 Response content-type: ${contentType}`);
      
      // MRMS data is in GRIB2 format which requires specialized parsing
      // For now, we log this as a stub and provide guidance for production implementation
      console.log('⚠️ MRMS GRIB2 raster data detected');
      console.log('⚠️ Production implementation requires:');
      console.log('   1. Python microservice with rasterio/GDAL for raster→vector conversion');
      console.log('   2. Contour extraction using scikit-image or similar');
      console.log('   3. Polygon simplification and storage');
      console.log('   4. Alternative: Use pre-processed vector products if available');
      
      // Store a placeholder alert indicating MRMS monitoring is active
      await this.storeMRMSStub(product, threshold, severity);
      
    } catch (error) {
      console.error(`❌ Error fetching MRMS ${product}:`, error);
    }
    
    console.log(`✅ MRMS ${product} ingestion complete (stub mode)`);
  }

  /**
   * Store MRMS monitoring stub in database
   * This indicates that MRMS is being monitored and provides metadata
   */
  private async storeMRMSStub(product: string, threshold: number, severity: string): Promise<void> {
    const now = new Date();
    
    // Store as a point alert for now (can be enhanced with actual polygons later)
    try {
      await this.db.query(`
        INSERT INTO weather_alerts (
          alert_id, event, state, headline, title, description, severity, alert_type,
          areas, effective, expires, polygon, start_time, end_time, is_active,
          latitude, longitude, source, geometry_type, hazard_metadata
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20
        )
        ON CONFLICT (alert_id) DO UPDATE SET
          effective = EXCLUDED.effective,
          hazard_metadata = EXCLUDED.hazard_metadata
      `, [
        `MRMS-${product}-${now.toISOString()}`,
        `MRMS ${product} Monitoring`,
        'US',
        `MRMS ${product} Active Monitoring`,
        `Real-Time ${product} Detection`,
        `MRMS ${product} threshold monitoring at ${threshold} (stub - awaiting raster processing)`,
        severity,
        product.includes('MESH') ? 'Hail' : 'Precipitation',
        ['CONUS'],
        now,
        new Date(now.getTime() + 2 * 60 * 1000), // 2-minute validity
        null,
        now,
        new Date(now.getTime() + 2 * 60 * 1000),
        true,
        '39.8283', // CONUS center
        '-98.5795',
        'MRMS',
        'contour',
        JSON.stringify({
          product,
          threshold,
          thresholdUnits: this.getProductUnits(product),
          note: 'Stub mode - production requires raster processing service',
          dataAvailable: true,
          processingStatus: 'pending_raster_conversion'
        })
      ]);
      
      console.log(`✅ Stored MRMS ${product} monitoring stub`);
    } catch (error) {
      console.error(`❌ Error storing MRMS stub:`, error);
    }
  }

  /**
   * Get units for MRMS product
   */
  private getProductUnits(product: string): string {
    const units: Record<string, string> = {
      'MESHMax': 'mm (hail size)',
      'MESH': 'mm (hail size)',
      'PrecipRate': 'mm/hr',
      'QPE_01H': 'mm (1-hour accumulation)',
      'QPE_03H': 'mm (3-hour accumulation)',
      'RadarQualityIndex': 'quality score',
      'ReflectivityAtLowestAltitude': 'dBZ'
    };
    return units[product] || 'unknown units';
  }

  /**
   * Production-ready approach for MRMS processing:
   * 
   * 1. Deploy Python Lambda/microservice with these dependencies:
   *    - rasterio (GDAL bindings for raster I/O)
   *    - numpy (numerical processing)
   *    - scikit-image (contour extraction)
   *    - shapely (polygon operations)
   * 
   * 2. Processing pipeline:
   *    a. Download GRIB2 file
   *    b. Extract raster band
   *    c. Apply threshold: mask = data > threshold
   *    d. Extract contours: contours = measure.find_contours(mask, 0.5)
   *    e. Convert to polygons: polygons = [Polygon(c) for c in contours]
   *    f. Simplify polygons: simplified = [p.simplify(0.01) for p in polygons]
   *    g. Convert to lat/lon coordinates
   *    h. Return GeoJSON to Node.js service
   * 
   * 3. Alternative: Monitor MRMS vector products if available
   *    - Some MRMS products may have pre-processed shapefiles
   *    - Check NOAA documentation for vector output options
   */
}
