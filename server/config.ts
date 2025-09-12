// Centralized configuration for damage monitoring system
export interface MonitoringConfig {
  cacheConfig: {
    cameraTTL: number;
    incidentTTL: number;
    maxCacheSize: number;
  };
  
  schedulerConfig: {
    damageCheckInterval: number; // minutes
    snapshotCaptureInterval: number; // minutes
    alertProcessingInterval: number; // minutes
    femaSyncInterval: number; // hours
    femaSyncEnabled: boolean;
  };
  
  detectionConfig: {
    enabled: boolean;
    confidenceThreshold: number;
    batchSize: number;
    retryAttempts: number;
  };
  
  providerConfig: {
    requestTimeout: number;
    userAgent: string;
    retryDelay: number;
  };
}

export const DEFAULT_CONFIG: MonitoringConfig = {
  cacheConfig: {
    cameraTTL: 5 * 60 * 1000, // 5 minutes
    incidentTTL: 2 * 60 * 1000, // 2 minutes
    maxCacheSize: 1000
  },
  
  schedulerConfig: {
    damageCheckInterval: 10, // 10 minutes
    snapshotCaptureInterval: 5, // 5 minutes  
    alertProcessingInterval: 1, // 1 minute
    femaSyncInterval: 12, // 12 hours (twice daily)
    femaSyncEnabled: true
  },
  
  detectionConfig: {
    enabled: process.env.ANTHROPIC_API_KEY !== undefined,
    confidenceThreshold: 75, // 75% confidence minimum
    batchSize: 10,
    retryAttempts: 3
  },
  
  providerConfig: {
    requestTimeout: 30000, // 30 seconds
    userAgent: 'StormLead-TrafficCamWatcher/1.0 (contact@stormlead.com)',
    retryDelay: 1000 // 1 second
  }
};

export const getConfig = (): MonitoringConfig => {
  return {
    ...DEFAULT_CONFIG,
    // Override with environment variables if available
    detectionConfig: {
      ...DEFAULT_CONFIG.detectionConfig,
      enabled: process.env.ANTHROPIC_API_KEY !== undefined,
      confidenceThreshold: process.env.DETECTION_CONFIDENCE_THRESHOLD 
        ? parseInt(process.env.DETECTION_CONFIDENCE_THRESHOLD) 
        : DEFAULT_CONFIG.detectionConfig.confidenceThreshold
    },
    schedulerConfig: {
      ...DEFAULT_CONFIG.schedulerConfig,
      damageCheckInterval: process.env.DAMAGE_CHECK_INTERVAL_MINUTES
        ? parseInt(process.env.DAMAGE_CHECK_INTERVAL_MINUTES)
        : DEFAULT_CONFIG.schedulerConfig.damageCheckInterval,
      femaSyncInterval: process.env.FEMA_SYNC_INTERVAL_HOURS
        ? parseInt(process.env.FEMA_SYNC_INTERVAL_HOURS)
        : DEFAULT_CONFIG.schedulerConfig.femaSyncInterval,
      femaSyncEnabled: process.env.FEMA_SYNC_ENABLED
        ? process.env.FEMA_SYNC_ENABLED.toLowerCase() === 'true'
        : DEFAULT_CONFIG.schedulerConfig.femaSyncEnabled
    }
  };
};