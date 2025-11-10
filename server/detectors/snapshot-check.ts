// Snapshot Damage Detection System
// Captures camera snapshots and analyzes them for storm damage
import fetch from 'node-fetch';
import { DamageDetectionService, type DamageAnalysisResult } from '../services/damageDetection.js';
import { providerRegistry } from '../providers/index.js';
import { getConfig } from '../config.js';
import type { UnifiedCamera } from '../services/unified511Directory.js';
import { fallenTreeAlertService } from '../services/fallenTreeAlertService.js';

export interface SnapshotCheckResult {
  cameraId: string;
  timestamp: Date;
  imageSize: number;
  analysisResult: DamageAnalysisResult;
  cameraInfo: {
    name: string;
    state: string;
    lat: number;
    lng: number;
    provider: string;
  };
}

export interface SnapshotBatchResult {
  timestamp: Date;
  totalChecked: number;
  successfulCaptures: number;
  detectedDamage: number;
  processingTimeMs: number;
  results: SnapshotCheckResult[];
  errors: Array<{ cameraId: string; error: string }>;
}

export class SnapshotChecker {
  private damageDetector: DamageDetectionService;
  private config = getConfig();

  constructor() {
    this.damageDetector = new DamageDetectionService();
    console.log('📸 Initializing Snapshot Damage Checker');
  }

  async checkCameraSnapshot(camera: UnifiedCamera): Promise<SnapshotCheckResult | null> {
    try {
      console.log(`📸 Capturing snapshot from ${camera.name} (${camera.id})`);
      
      // Check for snapshot URL (try multiple property names)
      const snapshotUrl = camera.snapshotUrl || (camera as any).url || (camera as any).imageUrl;
      if (!snapshotUrl) {
        console.log(`⚠️ No snapshot URL available for ${camera.name}`);
        return null;
      }

      // Capture snapshot
      const imageBuffer = await this.captureSnapshot(snapshotUrl);
      
      // Analyze for damage
      const analysisResult = await this.damageDetector.analyzeImageForDamage(
        imageBuffer, 
        `${camera.name}, ${camera.jurisdiction.state}`
      );

      const result: SnapshotCheckResult = {
        cameraId: camera.id,
        timestamp: new Date(),
        imageSize: imageBuffer.length,
        analysisResult,
        cameraInfo: {
          name: camera.name,
          state: camera.jurisdiction.state,
          lat: camera.lat,
          lng: camera.lng,
          provider: camera.jurisdiction.provider
        }
      };

      if (analysisResult.hasDetection) {
        console.log(`🚨 DAMAGE DETECTED at ${camera.name}: ${analysisResult.detections.length} alerts`);
        
        // Log each detection
        analysisResult.detections.forEach(detection => {
          console.log(`   🔴 ${detection.alertType}: ${detection.description} (${detection.confidence}% confidence)`);
        });

        // Send fallen tree alerts to contractors
        try {
          await fallenTreeAlertService.processDetection(result);
        } catch (error) {
          console.error('❌ Error processing tree alerts:', error);
        }
      }

      return result;
    } catch (error) {
      console.error(`❌ Error checking snapshot for ${camera.name}:`, error);
      return null;
    }
  }

  async runSnapshotBatch(state?: string, maxCameras?: number): Promise<SnapshotBatchResult> {
    const startTime = Date.now();
    console.log(`📸 Starting snapshot batch check${state ? ` for ${state}` : ' for all states'}`);

    const results: SnapshotCheckResult[] = [];
    const errors: Array<{ cameraId: string; error: string }> = [];
    
    try {
      // Get cameras to check
      let camerasToCheck: UnifiedCamera[] = [];
      
      if (state) {
        camerasToCheck = await providerRegistry.getCamerasByState(state);
      } else {
        // Get cameras from all supported states
        const supportedStates = providerRegistry.getAllSupportedStates();
        for (const stateCode of supportedStates) {
          const stateCameras = await providerRegistry.getCamerasByState(stateCode);
          camerasToCheck.push(...stateCameras);
        }
      }

      // Filter to active cameras with snapshot URLs and apply limit
      const activeCameras = camerasToCheck
        .filter(camera => camera.isActive && (camera.snapshotUrl || (camera as any).url || (camera as any).imageUrl))
        .slice(0, maxCameras || this.config.detectionConfig.batchSize);

      console.log(`📸 Checking ${activeCameras.length} active cameras with snapshot URLs`);

      // Process cameras in batches to avoid overwhelming the system
      const batchSize = Math.min(5, activeCameras.length); // Process 5 at a time
      for (let i = 0; i < activeCameras.length; i += batchSize) {
        const batch = activeCameras.slice(i, i + batchSize);
        
        const batchPromises = batch.map(async (camera) => {
          try {
            const result = await this.checkCameraSnapshot(camera);
            if (result) {
              results.push(result);
            }
          } catch (error) {
            errors.push({
              cameraId: camera.id,
              error: error instanceof Error ? error.message : 'Unknown error'
            });
          }
        });

        await Promise.all(batchPromises);
        
        // Small delay between batches to be respectful
        if (i + batchSize < activeCameras.length) {
          await this.delay(1000); // 1 second delay
        }
      }

      const processingTime = Date.now() - startTime;
      const detectedDamage = results.filter(r => r.analysisResult.hasDetection).length;

      const batchResult: SnapshotBatchResult = {
        timestamp: new Date(),
        totalChecked: activeCameras.length,
        successfulCaptures: results.length,
        detectedDamage,
        processingTimeMs: processingTime,
        results,
        errors
      };

      console.log(`✅ Snapshot batch complete: ${results.length}/${activeCameras.length} successful, ${detectedDamage} damage detections (${processingTime}ms)`);
      
      return batchResult;
    } catch (error) {
      console.error('❌ Error in snapshot batch check:', error);
      
      return {
        timestamp: new Date(),
        totalChecked: 0,
        successfulCaptures: results.length,
        detectedDamage: results.filter(r => r.analysisResult.hasDetection).length,
        processingTimeMs: Date.now() - startTime,
        results,
        errors: [...errors, { cameraId: 'batch', error: error instanceof Error ? error.message : 'Unknown batch error' }]
      };
    }
  }

  async getHighPriorityDetections(batchResult: SnapshotBatchResult) {
    return batchResult.results
      .filter(result => result.analysisResult.hasDetection)
      .filter(result => {
        // Filter for high-priority detections
        return result.analysisResult.detections.some(detection => 
          detection.urgencyLevel === 'emergency' || 
          detection.urgencyLevel === 'high' ||
          detection.confidence >= this.config.detectionConfig.confidenceThreshold
        );
      })
      .sort((a, b) => {
        // Sort by highest confidence and urgency
        const aMaxConfidence = Math.max(...a.analysisResult.detections.map(d => d.confidence));
        const bMaxConfidence = Math.max(...b.analysisResult.detections.map(d => d.confidence));
        return bMaxConfidence - aMaxConfidence;
      });
  }

  private async captureSnapshot(snapshotUrl: string): Promise<Buffer> {
    const response = await fetch(snapshotUrl, {
      headers: {
        'User-Agent': this.config.providerConfig.userAgent,
        'Accept': 'image/*'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to capture snapshot: ${response.status}`);
    }

    const buffer = await response.buffer();
    
    if (buffer.length === 0) {
      throw new Error('Empty image buffer received');
    }

    return buffer;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const snapshotChecker = new SnapshotChecker();