// Damage Monitoring Scheduler
// Manages periodic tasks for damage detection and monitoring
import * as cron from 'node-cron';
import { snapshotChecker, type SnapshotBatchResult } from './detectors/snapshot-check.js';
import { providerRegistry } from './providers/index.js';
import { getConfig } from './config.js';
import { femaDisasterService, type FemaSyncResult } from './services/femaDisasterService.js';
import { syncNwsAlerts, type WeatherAlertSync } from './services/nwsAlertsService.js';

interface SchedulerStats {
  lastDamageCheck: Date | null;
  lastSnapshotCapture: Date | null;
  lastFemaSync: Date | null;
  lastNwsAlertsSync: Date | null;
  totalDamageDetections: number;
  totalSnapshotsCaptured: number;
  totalFemaSyncs: number;
  totalNwsAlertsSyncs: number;
  nwsAlertsNew: number;
  nwsAlertsExpired: number;
  femaCountiesUpdated: number;
  femaCountiesAdded: number;
  isRunning: boolean;
  scheduledTasks: string[];
}

export class DamageMonitoringScheduler {
  private static instance: DamageMonitoringScheduler;
  private config = getConfig();
  private stats: SchedulerStats = {
    lastDamageCheck: null,
    lastSnapshotCapture: null,
    lastFemaSync: null,
    lastNwsAlertsSync: null,
    totalDamageDetections: 0,
    totalSnapshotsCaptured: 0,
    totalFemaSyncs: 0,
    totalNwsAlertsSyncs: 0,
    nwsAlertsNew: 0,
    nwsAlertsExpired: 0,
    femaCountiesUpdated: 0,
    femaCountiesAdded: 0,
    isRunning: false,
    scheduledTasks: []
  };
  private cronJobs: cron.ScheduledTask[] = [];

  private constructor() {
    console.log('⏰ Initializing Damage Monitoring Scheduler');
  }

  static getInstance(): DamageMonitoringScheduler {
    if (!DamageMonitoringScheduler.instance) {
      DamageMonitoringScheduler.instance = new DamageMonitoringScheduler();
    }
    return DamageMonitoringScheduler.instance;
  }

  start() {
    if (this.stats.isRunning) {
      console.log('⏰ Scheduler is already running');
      return;
    }

    console.log('🚀 Starting Damage Monitoring Scheduler');
    this.stats.isRunning = true;

    // Schedule damage check task (every N minutes based on config)
    const damageCheckCron = `*/${this.config.schedulerConfig.damageCheckInterval} * * * *`;
    const damageCheckJob = cron.schedule(damageCheckCron, () => {
      this.runDamageCheck();
    });

    // Schedule snapshot capture task (every N minutes based on config) 
    const snapshotCron = `*/${this.config.schedulerConfig.snapshotCaptureInterval} * * * *`;
    const snapshotJob = cron.schedule(snapshotCron, () => {
      this.runSnapshotCapture();
    });

    // Schedule alert processing (every minute for high-priority alerts)
    const alertCron = `*/${this.config.schedulerConfig.alertProcessingInterval} * * * *`;
    const alertJob = cron.schedule(alertCron, () => {
      this.processHighPriorityAlerts();
    });

    // Schedule FEMA disaster sync (every N hours based on config)
    let femaSyncJob: cron.ScheduledTask | null = null;
    if (this.config.schedulerConfig.femaSyncEnabled) {
      const femaSyncCron = `0 */${this.config.schedulerConfig.femaSyncInterval} * * *`;
      femaSyncJob = cron.schedule(femaSyncCron, () => {
        this.runFemaSync();
      });
    }

    // Schedule NWS alerts sync (every 2 minutes for real-time severe weather)
    const nwsAlertsCron = '*/2 * * * *';
    const nwsAlertsJob = cron.schedule(nwsAlertsCron, () => {
      this.runNwsAlertsSync();
    });

    this.cronJobs = [damageCheckJob, snapshotJob, alertJob, nwsAlertsJob];
    if (femaSyncJob) {
      this.cronJobs.push(femaSyncJob);
    }

    this.stats.scheduledTasks = [
      `Damage Check: every ${this.config.schedulerConfig.damageCheckInterval} minutes`,
      `Snapshot Capture: every ${this.config.schedulerConfig.snapshotCaptureInterval} minutes`,
      `Alert Processing: every ${this.config.schedulerConfig.alertProcessingInterval} minute(s)`,
      `NWS Alerts Sync: every 2 minutes`
    ];
    
    if (this.config.schedulerConfig.femaSyncEnabled) {
      this.stats.scheduledTasks.push(`FEMA Sync: every ${this.config.schedulerConfig.femaSyncInterval} hours`);
    }

    console.log('✅ Scheduler started with the following tasks:');
    this.stats.scheduledTasks.forEach(task => console.log(`   📅 ${task}`));
  }

  stop() {
    if (!this.stats.isRunning) {
      console.log('⏰ Scheduler is not running');
      return;
    }

    console.log('🛑 Stopping Damage Monitoring Scheduler');
    
    this.cronJobs.forEach(job => {
      job.stop();
      job.destroy();
    });
    
    this.cronJobs = [];
    this.stats.isRunning = false;
    this.stats.scheduledTasks = [];
    
    console.log('✅ Scheduler stopped');
  }

  getStats(): SchedulerStats {
    return { ...this.stats };
  }

  // Manual trigger methods for testing/debugging
  async runDamageCheck() {
    console.log('🔍 Running scheduled damage check across all states...');
    
    try {
      const startTime = Date.now();
      const supportedStates = providerRegistry.getAllSupportedStates();
      let totalOpportunities = 0;

      for (const state of supportedStates) {
        try {
          const opportunities = await providerRegistry.getContractorOpportunities(state);
          totalOpportunities += opportunities.length;
          
          if (opportunities.length > 0) {
            console.log(`🚨 ${state}: Found ${opportunities.length} contractor opportunities`);
            
            // Log high-priority opportunities
            const highPriority = opportunities.filter(opp => opp.severity === 'critical' || opp.severity === 'severe');
            if (highPriority.length > 0) {
              console.log(`   🔴 ${highPriority.length} high-priority opportunities in ${state}`);
            }
          }
        } catch (error) {
          console.error(`❌ Error checking ${state}:`, error);
        }
      }

      const processingTime = Date.now() - startTime;
      this.stats.lastDamageCheck = new Date();
      this.stats.totalDamageDetections += totalOpportunities;

      console.log(`✅ Damage check complete: ${totalOpportunities} total opportunities found (${processingTime}ms)`);
    } catch (error) {
      console.error('❌ Error in scheduled damage check:', error);
    }
  }

  async runSnapshotCapture() {
    if (!this.config.detectionConfig.enabled) {
      console.log('📸 Snapshot capture skipped - AI detection disabled');
      return;
    }

    console.log('📸 Running scheduled snapshot capture...');
    
    try {
      // Run snapshot check for all states
      const batchResult = await snapshotChecker.runSnapshotBatch();
      
      this.stats.lastSnapshotCapture = new Date();
      this.stats.totalSnapshotsCaptured += batchResult.successfulCaptures;
      this.stats.totalDamageDetections += batchResult.detectedDamage;

      if (batchResult.detectedDamage > 0) {
        console.log(`🚨 DAMAGE DETECTED: ${batchResult.detectedDamage} alerts from ${batchResult.successfulCaptures} snapshots`);
        
        // Store results for alert processing
        await this.storeSnapshotResults(batchResult);
      }

      console.log(`✅ Snapshot capture complete: ${batchResult.successfulCaptures}/${batchResult.totalChecked} successful`);
    } catch (error) {
      console.error('❌ Error in scheduled snapshot capture:', error);
    }
  }

  async processHighPriorityAlerts() {
    // This would process any high-priority damage detection alerts
    // For now, just log that we're processing alerts
    console.log('🔔 Processing high-priority damage alerts...');
    
    // In a real implementation, this would:
    // 1. Check stored snapshot results for high-priority detections
    // 2. Send notifications to contractors
    // 3. Update alert statuses
    // 4. Trigger additional monitoring for critical areas
  }

  async runFemaSync() {
    if (!this.config.schedulerConfig.femaSyncEnabled) {
      console.log('🏛️ FEMA sync skipped - disabled in configuration');
      return;
    }

    console.log('🌪️ Running scheduled FEMA disaster data sync...');
    
    try {
      // Determine lookback period based on sync interval
      // If syncing every 12 hours, look back 1 day to ensure we catch everything
      const lookbackDays = Math.max(1, Math.ceil(this.config.schedulerConfig.femaSyncInterval / 12));
      
      const startTime = Date.now();
      const syncResult: FemaSyncResult = await femaDisasterService.syncDisasterData(lookbackDays);
      const processingTime = Date.now() - startTime;

      // Update stats
      this.stats.lastFemaSync = new Date();
      this.stats.totalFemaSyncs++;
      this.stats.femaCountiesUpdated += syncResult.updatedCounties;
      this.stats.femaCountiesAdded += syncResult.newCounties;

      if (syncResult.success) {
        console.log(`✅ FEMA sync complete: ${syncResult.newCounties} new counties, ${syncResult.updatedCounties} updated counties (${processingTime}ms)`);
        
        if (syncResult.newCounties > 0 || syncResult.updatedCounties > 0) {
          console.log(`📊 FEMA sync impact: ${syncResult.disastersProcessed} disasters processed`);
        }
      } else {
        console.error(`❌ FEMA sync completed with errors: ${syncResult.errors.length} errors`);
        syncResult.errors.forEach(error => console.error(`   ❌ ${error}`));
      }

    } catch (error) {
      console.error('❌ Error in scheduled FEMA sync:', error);
    }
  }

  async runNwsAlertsSync() {
    console.log('🌪️ Running scheduled NWS severe weather alerts sync...');
    
    try {
      const startTime = Date.now();
      const syncResult: WeatherAlertSync = await syncNwsAlerts();
      const processingTime = Date.now() - startTime;

      // Update stats
      this.stats.lastNwsAlertsSync = new Date();
      this.stats.totalNwsAlertsSyncs++;
      this.stats.nwsAlertsNew += syncResult.newAlerts;
      this.stats.nwsAlertsExpired += syncResult.expiredAlerts;

      console.log(`✅ NWS Alerts sync complete: ${syncResult.newAlerts} new, ${syncResult.expiredAlerts} expired, ${syncResult.activeAlerts} active (${processingTime}ms)`);
      
      if (syncResult.newAlerts > 0) {
        const statesAffected = Array.from(syncResult.states).join(', ');
        console.log(`📊 NWS Alerts impact: ${statesAffected}`);
      }

    } catch (error) {
      console.error('❌ Error in scheduled NWS alerts sync:', error);
    }
  }

  private async storeSnapshotResults(batchResult: SnapshotBatchResult) {
    // In a real implementation, this would store results to database
    // For now, just log high-priority detections
    const highPriority = await snapshotChecker.getHighPriorityDetections(batchResult);
    
    if (highPriority.length > 0) {
      console.log(`💾 Storing ${highPriority.length} high-priority damage detections`);
      
      highPriority.forEach(detection => {
        console.log(`   📍 ${detection.cameraInfo.name} (${detection.cameraInfo.state}): ${detection.analysisResult.detections.length} alerts`);
      });
    }
  }

  // Development/testing methods
  async testDamageCheck(state?: string) {
    console.log(`🧪 Testing damage check${state ? ` for ${state}` : ' for all states'}...`);
    
    if (state) {
      const opportunities = await providerRegistry.getContractorOpportunities(state);
      console.log(`✅ Test result: ${opportunities.length} opportunities found in ${state}`);
      return opportunities;
    } else {
      await this.runDamageCheck();
    }
  }

  async testSnapshotCapture(state?: string, maxCameras = 3) {
    console.log(`🧪 Testing snapshot capture${state ? ` for ${state}` : ' for all states'} (max ${maxCameras} cameras)...`);
    
    const batchResult = await snapshotChecker.runSnapshotBatch(state, maxCameras);
    console.log(`✅ Test result: ${batchResult.successfulCaptures}/${batchResult.totalChecked} successful, ${batchResult.detectedDamage} damage detections`);
    
    return batchResult;
  }
}

// Export singleton instance
export const scheduler = DamageMonitoringScheduler.getInstance();