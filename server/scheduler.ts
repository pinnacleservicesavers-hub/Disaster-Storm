// Damage Monitoring Scheduler
// Manages periodic tasks for damage detection and monitoring
import * as cron from 'node-cron';
import { snapshotChecker, type SnapshotBatchResult } from './detectors/snapshot-check.js';
import { providerRegistry } from './providers/index.js';
import { getConfig } from './config.js';
import { femaDisasterService, type FemaSyncResult } from './services/femaDisasterService.js';
import { syncNwsAlerts, type WeatherAlertSync } from './services/nwsAlertsService.js';
import { automationProcessor } from './services/automationProcessor.js';

interface SchedulerStats {
  lastDamageCheck: Date | null;
  lastSnapshotCapture: Date | null;
  lastFemaSync: Date | null;
  lastNwsAlertsSync: Date | null;
  lastAutomationProcess: Date | null;
  totalDamageDetections: number;
  totalSnapshotsCaptured: number;
  totalFemaSyncs: number;
  totalNwsAlertsSyncs: number;
  totalAutomationProcesses: number;
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
    lastAutomationProcess: null,
    totalDamageDetections: 0,
    totalSnapshotsCaptured: 0,
    totalFemaSyncs: 0,
    totalNwsAlertsSyncs: 0,
    totalAutomationProcesses: 0,
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

    // Schedule Automation Processor (every minute for event-driven automation)
    const automationCron = '* * * * *';
    const automationJob = cron.schedule(automationCron, () => {
      this.runAutomationProcessor();
    });

    this.cronJobs = [damageCheckJob, snapshotJob, alertJob, nwsAlertsJob, automationJob];
    if (femaSyncJob) {
      this.cronJobs.push(femaSyncJob);
    }

    this.stats.scheduledTasks = [
      `Damage Check: every ${this.config.schedulerConfig.damageCheckInterval} minutes`,
      `Snapshot Capture: every ${this.config.schedulerConfig.snapshotCaptureInterval} minutes`,
      `Alert Processing: every ${this.config.schedulerConfig.alertProcessingInterval} minute(s)`,
      `NWS Alerts Sync: every 2 minutes`,
      `Automation Processor: every 1 minute (custom event-driven automation)`
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
      console.error('❌ Error in scheduled NWS Alerts sync:', error);
    }
  }

  async runAutomationProcessor() {
    // console.log('🤖 Running automation processor...');
    
    try {
      const startTime = Date.now();
      await automationProcessor.processEvents();
      const processingTime = Date.now() - startTime;

      // Update stats
      this.stats.lastAutomationProcess = new Date();
      this.stats.totalAutomationProcesses++;

      // Only log if there was actual processing (avoid spam)
      if (processingTime > 100) {
        console.log(`✅ Automation processor complete (${processingTime}ms)`);
      }

    } catch (error) {
      console.error('❌ Error in automation processor:', error);
    }
  }

  processHighPriorityAlerts() {
    console.log('🔔 Processing high-priority damage alerts...');
    // Placeholder - implement alert processing logic
  }

  getStats(): SchedulerStats {
    return { ...this.stats };
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

// ===== LEADVAULT CAMPAIGN SCHEDULER =====
// Runs contractor campaigns at 8 AM local time + storm triggers

interface CampaignSchedulerStats {
  lastDailyRun: Date | null;
  lastWeeklyRun: Date | null;
  lastStormTrigger: Date | null;
  totalCampaignsRun: number;
  totalLeadsFound: number;
  totalOutreachGenerated: number;
  isRunning: boolean;
}

export class LeadVaultCampaignScheduler {
  private static instance: LeadVaultCampaignScheduler;
  private cronJobs: cron.ScheduledTask[] = [];
  private stats: CampaignSchedulerStats = {
    lastDailyRun: null,
    lastWeeklyRun: null,
    lastStormTrigger: null,
    totalCampaignsRun: 0,
    totalLeadsFound: 0,
    totalOutreachGenerated: 0,
    isRunning: false
  };

  private constructor() {
    console.log('📋 Initializing LeadVault Campaign Scheduler');
  }

  static getInstance(): LeadVaultCampaignScheduler {
    if (!LeadVaultCampaignScheduler.instance) {
      LeadVaultCampaignScheduler.instance = new LeadVaultCampaignScheduler();
    }
    return LeadVaultCampaignScheduler.instance;
  }

  start() {
    if (this.stats.isRunning) {
      console.log('📋 LeadVault Campaign Scheduler already running');
      return;
    }

    console.log('🚀 Starting LeadVault Campaign Scheduler');
    this.stats.isRunning = true;

    // Daily campaigns at 8:05 AM America/Chicago (13:05 UTC in winter, 12:05 UTC in summer)
    // Using 13:05 UTC as baseline for Central Standard Time
    const dailyCampaignJob = cron.schedule('5 13 * * *', async () => {
      console.log('📅 Running daily LeadVault campaigns (8:05 AM CST)...');
      await this.runScheduledCampaigns('daily');
    }, {
      timezone: 'America/Chicago'
    });

    // Weekly campaigns on Monday at 8:10 AM America/Chicago
    const weeklyCampaignJob = cron.schedule('10 8 * * 1', async () => {
      console.log('📅 Running weekly LeadVault campaigns (Monday 8:10 AM CST)...');
      await this.runScheduledCampaigns('weekly');
    }, {
      timezone: 'America/Chicago'
    });

    // Storm trigger check every 30 minutes (checks weather and fires campaigns if threshold exceeded)
    const stormTriggerJob = cron.schedule('*/30 * * * *', async () => {
      await this.checkStormTriggers();
    });

    this.cronJobs = [dailyCampaignJob, weeklyCampaignJob, stormTriggerJob];

    console.log('✅ LeadVault Campaign Scheduler started:');
    console.log('   📅 Daily campaigns: 8:05 AM America/Chicago');
    console.log('   📅 Weekly campaigns: Monday 8:10 AM America/Chicago');
    console.log('   ⛈️ Storm triggers: every 30 minutes');
  }

  stop() {
    if (!this.stats.isRunning) return;
    
    this.cronJobs.forEach(job => {
      job.stop();
      job.destroy();
    });
    this.cronJobs = [];
    this.stats.isRunning = false;
    console.log('🛑 LeadVault Campaign Scheduler stopped');
  }

  getStats(): CampaignSchedulerStats {
    return { ...this.stats };
  }

  // Run campaigns of a specific schedule type
  async runScheduledCampaigns(scheduleType: 'daily' | 'weekly' | 'storm') {
    const { db } = await import('./db.js');
    const { sql } = await import('drizzle-orm');
    
    try {
      // Get enabled campaigns for this schedule type
      const campaignsResult = await db.execute(sql`
        SELECT * FROM lead_vault_campaigns 
        WHERE enabled = true 
        AND (schedule_type = ${scheduleType} OR ${scheduleType} = 'storm' AND storm_trigger_enabled = true)
      `);
      
      const campaigns = campaignsResult.rows as any[];
      
      if (campaigns.length === 0) {
        console.log(`📋 No ${scheduleType} campaigns to run`);
        return;
      }

      console.log(`📋 Running ${campaigns.length} ${scheduleType} campaigns...`);

      for (const campaign of campaigns) {
        try {
          await this.runSingleCampaign(campaign, scheduleType);
          this.stats.totalCampaignsRun++;
        } catch (err) {
          console.error(`❌ Campaign ${campaign.name} failed:`, err);
        }
      }

      // Update stats
      if (scheduleType === 'daily') {
        this.stats.lastDailyRun = new Date();
      } else if (scheduleType === 'weekly') {
        this.stats.lastWeeklyRun = new Date();
      } else if (scheduleType === 'storm') {
        this.stats.lastStormTrigger = new Date();
      }

    } catch (error) {
      console.error(`❌ Error running ${scheduleType} campaigns:`, error);
    }
  }

  // Run a single campaign
  async runSingleCampaign(campaign: any, triggerType: string, stormData?: any) {
    const { db } = await import('./db.js');
    const { sql } = await import('drizzle-orm');
    
    console.log(`🎯 Running campaign: ${campaign.name} (${triggerType})`);

    // Create campaign run record
    const runResult = await db.execute(sql`
      INSERT INTO lead_vault_campaign_runs (campaign_id, contractor_id, trigger_type, status, storm_data)
      VALUES (${campaign.id}, ${campaign.contractor_id}, ${triggerType}, 'running', ${JSON.stringify(stormData || null)})
      RETURNING id
    `);
    
    const runId = (runResult.rows[0] as any)?.id;
    
    try {
      // For now, log the campaign run - actual lead finding will be added when Google Places is enabled
      // The campaign runner will integrate with the existing leadvault search endpoint
      
      console.log(`   📍 Location: ${campaign.target_location}, Radius: ${campaign.radius}mi`);
      console.log(`   🎯 Targets: ${JSON.stringify(campaign.lead_targets)}`);
      console.log(`   📊 Min Score: ${campaign.min_score}, Max Leads: ${campaign.max_leads_per_run}`);

      // TODO: Call the lead search API when Google Places is enabled
      // For now, mark as completed with placeholder stats
      
      await db.execute(sql`
        UPDATE lead_vault_campaign_runs 
        SET status = 'completed', completed_at = NOW(), leads_found = 0
        WHERE id = ${runId}
      `);

      // Update last run time on campaign
      await db.execute(sql`
        UPDATE lead_vault_campaigns SET last_run_at = NOW() WHERE id = ${campaign.id}
      `);

      console.log(`   ✅ Campaign ${campaign.name} completed`);

    } catch (error) {
      await db.execute(sql`
        UPDATE lead_vault_campaign_runs 
        SET status = 'failed', completed_at = NOW(), error_message = ${String(error)}
        WHERE id = ${runId}
      `);
      throw error;
    }
  }

  // Check for storm conditions that should trigger campaigns
  async checkStormTriggers() {
    const { db } = await import('./db.js');
    const { sql } = await import('drizzle-orm');
    
    try {
      // Get campaigns with storm triggers enabled
      const stormCampaignsResult = await db.execute(sql`
        SELECT * FROM lead_vault_campaigns 
        WHERE enabled = true AND storm_trigger_enabled = true
      `);
      
      const stormCampaigns = stormCampaignsResult.rows as any[];
      
      if (stormCampaigns.length === 0) return;

      // Check for active weather alerts (from existing NWS sync)
      const alertsResult = await db.execute(sql`
        SELECT * FROM weather_alerts 
        WHERE is_active = true 
        AND (severity = 'Extreme' OR severity = 'Severe')
        AND created_at > NOW() - INTERVAL '6 hours'
        LIMIT 10
      `);
      
      const activeAlerts = alertsResult.rows as any[];
      
      if (activeAlerts.length === 0) {
        // No severe weather - skip storm triggers
        return;
      }

      console.log(`⛈️ Storm trigger: ${activeAlerts.length} severe alerts detected!`);

      // Run storm-triggered campaigns
      for (const campaign of stormCampaigns) {
        const stormData = {
          alertCount: activeAlerts.length,
          maxSeverity: activeAlerts[0]?.severity || 'Severe',
          triggeredAt: new Date().toISOString()
        };

        // Only trigger if not run in last 4 hours (avoid spam)
        const lastRunCheck = await db.execute(sql`
          SELECT * FROM lead_vault_campaign_runs 
          WHERE campaign_id = ${campaign.id} 
          AND trigger_type = 'storm'
          AND started_at > NOW() - INTERVAL '4 hours'
          LIMIT 1
        `);

        if (lastRunCheck.rows.length === 0) {
          console.log(`⛈️ Storm triggering campaign: ${campaign.name}`);
          await this.runSingleCampaign(campaign, 'storm', stormData);
          this.stats.lastStormTrigger = new Date();
        }
      }

    } catch (error) {
      console.error('❌ Error checking storm triggers:', error);
    }
  }

  // Manual trigger for testing
  async manualRun(campaignId: number) {
    const { db } = await import('./db.js');
    const { sql } = await import('drizzle-orm');
    
    const result = await db.execute(sql`
      SELECT * FROM lead_vault_campaigns WHERE id = ${campaignId}
    `);
    
    if (result.rows.length === 0) {
      throw new Error('Campaign not found');
    }

    await this.runSingleCampaign(result.rows[0], 'manual');
    return { success: true };
  }
}

export const campaignScheduler = LeadVaultCampaignScheduler.getInstance();