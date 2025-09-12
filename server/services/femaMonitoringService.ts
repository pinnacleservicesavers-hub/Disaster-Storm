import fs from 'fs';
import path from 'path';
import { FemaSyncResult } from './femaDisasterService';

export interface FemaSyncLogEntry {
  timestamp: Date;
  operation: 'scheduled_sync' | 'manual_sync' | 'api_fetch' | 'data_processing' | 'storage_update';
  status: 'started' | 'completed' | 'failed' | 'warning';
  duration?: number; // milliseconds
  details: {
    // Sync operation details
    disastersProcessed?: number;
    newCounties?: number;
    updatedCounties?: number;
    statesProcessed?: string[];
    lookbackDays?: number;
    
    // Error details
    errors?: string[];
    errorTypes?: string[];
    
    // Performance metrics
    apiCallCount?: number;
    avgResponseTime?: number;
    rateLimitHits?: number;
    
    // Data quality metrics
    duplicatesSkipped?: number;
    invalidRecords?: number;
    dataConsistencyIssues?: string[];
    
    // Additional context
    triggeredBy?: 'scheduler' | 'manual' | 'webhook';
    userId?: string;
    metadata?: Record<string, any>;
  };
}

export interface FemaMonitoringStats {
  // Overall statistics
  totalSyncs: number;
  successfulSyncs: number;
  failedSyncs: number;
  lastSyncDuration: number | null;
  avgSyncDuration: number;
  
  // Data tracking
  totalDisastersProcessed: number;
  totalCountiesCreated: number;
  totalCountiesUpdated: number;
  
  // Error tracking
  errorRate: number;
  commonErrors: { error: string; count: number; lastOccurred: Date }[];
  
  // Performance tracking
  apiPerformance: {
    avgResponseTime: number;
    rateLimitHits: number;
    totalApiCalls: number;
  };
  
  // Time series data (last 30 days)
  dailyStats: {
    date: string;
    syncs: number;
    successes: number;
    failures: number;
    avgDuration: number;
    disastersProcessed: number;
  }[];
}

export class FemaMonitoringService {
  private static instance: FemaMonitoringService;
  private readonly logFilePath: string;
  private readonly maxLogEntries = 10000; // Keep last 10k entries
  private readonly isDevelopment: boolean;

  private constructor() {
    this.isDevelopment = process.env.NODE_ENV !== 'production';
    
    // Initialize log file path
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    this.logFilePath = path.join(dataDir, 'fema-sync-log.json');
    
    // Initialize log file if it doesn't exist
    if (!fs.existsSync(this.logFilePath)) {
      this.writeLogFile([]);
    }
    
    console.log(`📊 FemaMonitoringService initialized (${this.isDevelopment ? 'development' : 'production'} mode)`);
  }

  static getInstance(): FemaMonitoringService {
    if (!FemaMonitoringService.instance) {
      FemaMonitoringService.instance = new FemaMonitoringService();
    }
    return FemaMonitoringService.instance;
  }

  /**
   * Log a FEMA sync operation
   */
  async logSyncOperation(
    operation: FemaSyncLogEntry['operation'],
    status: FemaSyncLogEntry['status'],
    details: FemaSyncLogEntry['details'],
    duration?: number
  ): Promise<void> {
    try {
      const entry: FemaSyncLogEntry = {
        timestamp: new Date(),
        operation,
        status,
        duration,
        details
      };

      // Add to log file
      await this.appendLogEntry(entry);

      // Console logging with appropriate level
      this.logToConsole(entry);

      // In development, also log more details
      if (this.isDevelopment && details.errors && details.errors.length > 0) {
        console.log('🔍 FEMA Sync Error Details:', details.errors);
      }

    } catch (error) {
      console.error('❌ Error in FEMA monitoring service:', error);
    }
  }

  /**
   * Log sync start
   */
  async logSyncStart(
    operation: FemaSyncLogEntry['operation'],
    triggeredBy: 'scheduler' | 'manual' | 'webhook' = 'scheduler',
    lookbackDays?: number
  ): Promise<string> {
    const operationId = `${operation}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    await this.logSyncOperation(operation, 'started', {
      triggeredBy,
      lookbackDays,
      metadata: { operationId }
    });

    return operationId;
  }

  /**
   * Log sync completion
   */
  async logSyncCompletion(
    operation: FemaSyncLogEntry['operation'],
    syncResult: FemaSyncResult,
    startTime: number,
    operationId?: string
  ): Promise<void> {
    const duration = Date.now() - startTime;
    
    await this.logSyncOperation(
      operation,
      syncResult.success ? 'completed' : 'failed',
      {
        disastersProcessed: syncResult.disastersProcessed,
        newCounties: syncResult.newCounties,
        updatedCounties: syncResult.updatedCounties,
        errors: syncResult.errors,
        errorTypes: this.categorizeErrors(syncResult.errors),
        metadata: { operationId }
      },
      duration
    );
  }

  /**
   * Log API performance metrics
   */
  async logApiPerformance(
    responseTime: number,
    rateLimitHit: boolean = false,
    endpoint?: string
  ): Promise<void> {
    await this.logSyncOperation('api_fetch', 'completed', {
      avgResponseTime: responseTime,
      rateLimitHits: rateLimitHit ? 1 : 0,
      apiCallCount: 1,
      metadata: { endpoint }
    });
  }

  /**
   * Get monitoring statistics
   */
  async getMonitoringStats(): Promise<FemaMonitoringStats> {
    try {
      const logs = await this.readLogFile();
      
      // Calculate overall stats
      const syncLogs = logs.filter(log => 
        log.operation.includes('sync') && ['completed', 'failed'].includes(log.status)
      );
      
      const totalSyncs = syncLogs.length;
      const successfulSyncs = syncLogs.filter(log => log.status === 'completed').length;
      const failedSyncs = totalSyncs - successfulSyncs;
      
      const durations = syncLogs.filter(log => log.duration).map(log => log.duration!);
      const avgSyncDuration = durations.length > 0 ? 
        Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0;
      
      // Calculate data stats
      const totalDisastersProcessed = syncLogs.reduce((sum, log) => 
        sum + (log.details.disastersProcessed || 0), 0);
      const totalCountiesCreated = syncLogs.reduce((sum, log) => 
        sum + (log.details.newCounties || 0), 0);
      const totalCountiesUpdated = syncLogs.reduce((sum, log) => 
        sum + (log.details.updatedCounties || 0), 0);

      // Calculate error stats
      const errorLogs = logs.filter(log => log.details.errors && log.details.errors.length > 0);
      const errorRate = totalSyncs > 0 ? (errorLogs.length / totalSyncs) * 100 : 0;
      
      const commonErrors = this.calculateCommonErrors(errorLogs);

      // Calculate API performance
      const apiLogs = logs.filter(log => log.operation === 'api_fetch');
      const avgResponseTime = apiLogs.length > 0 ?
        apiLogs.reduce((sum, log) => sum + (log.details.avgResponseTime || 0), 0) / apiLogs.length : 0;
      const rateLimitHits = apiLogs.reduce((sum, log) => 
        sum + (log.details.rateLimitHits || 0), 0);
      
      // Calculate daily stats (last 30 days)
      const dailyStats = this.calculateDailyStats(syncLogs);

      return {
        totalSyncs,
        successfulSyncs,
        failedSyncs,
        lastSyncDuration: durations.length > 0 ? durations[durations.length - 1] : null,
        avgSyncDuration,
        totalDisastersProcessed,
        totalCountiesCreated,
        totalCountiesUpdated,
        errorRate,
        commonErrors,
        apiPerformance: {
          avgResponseTime: Math.round(avgResponseTime),
          rateLimitHits,
          totalApiCalls: apiLogs.reduce((sum, log) => sum + (log.details.apiCallCount || 0), 0)
        },
        dailyStats
      };

    } catch (error) {
      console.error('❌ Error calculating FEMA monitoring stats:', error);
      return this.getEmptyStats();
    }
  }

  /**
   * Get recent log entries
   */
  async getRecentLogs(limit: number = 100): Promise<FemaSyncLogEntry[]> {
    try {
      const logs = await this.readLogFile();
      return logs.slice(-limit).reverse(); // Most recent first
    } catch (error) {
      console.error('❌ Error reading recent FEMA logs:', error);
      return [];
    }
  }

  /**
   * Clear old log entries (keep last N entries)
   */
  async cleanupLogs(keepEntries: number = this.maxLogEntries): Promise<void> {
    try {
      const logs = await this.readLogFile();
      if (logs.length > keepEntries) {
        const cleanedLogs = logs.slice(-keepEntries);
        await this.writeLogFile(cleanedLogs);
        console.log(`🧹 Cleaned up FEMA logs: kept ${cleanedLogs.length}/${logs.length} entries`);
      }
    } catch (error) {
      console.error('❌ Error cleaning up FEMA logs:', error);
    }
  }

  /**
   * Export logs for analysis
   */
  async exportLogs(startDate?: Date, endDate?: Date): Promise<FemaSyncLogEntry[]> {
    try {
      let logs = await this.readLogFile();
      
      if (startDate || endDate) {
        logs = logs.filter(log => {
          const logDate = new Date(log.timestamp);
          if (startDate && logDate < startDate) return false;
          if (endDate && logDate > endDate) return false;
          return true;
        });
      }
      
      return logs;
    } catch (error) {
      console.error('❌ Error exporting FEMA logs:', error);
      return [];
    }
  }

  // Private helper methods

  private async readLogFile(): Promise<FemaSyncLogEntry[]> {
    try {
      if (!fs.existsSync(this.logFilePath)) {
        return [];
      }
      
      const data = fs.readFileSync(this.logFilePath, 'utf8');
      const logs = JSON.parse(data);
      
      // Convert timestamp strings back to Date objects
      return logs.map((log: any) => ({
        ...log,
        timestamp: new Date(log.timestamp)
      }));
    } catch (error) {
      console.error('❌ Error reading FEMA log file:', error);
      return [];
    }
  }

  private async writeLogFile(logs: FemaSyncLogEntry[]): Promise<void> {
    try {
      fs.writeFileSync(this.logFilePath, JSON.stringify(logs, null, 2));
    } catch (error) {
      console.error('❌ Error writing FEMA log file:', error);
    }
  }

  private async appendLogEntry(entry: FemaSyncLogEntry): Promise<void> {
    try {
      const logs = await this.readLogFile();
      logs.push(entry);
      
      // Keep only last maxLogEntries
      if (logs.length > this.maxLogEntries) {
        logs.splice(0, logs.length - this.maxLogEntries);
      }
      
      await this.writeLogFile(logs);
    } catch (error) {
      console.error('❌ Error appending to FEMA log file:', error);
    }
  }

  private logToConsole(entry: FemaSyncLogEntry): void {
    const timestamp = entry.timestamp.toISOString();
    const operation = entry.operation;
    const status = entry.status;
    const duration = entry.duration ? `(${entry.duration}ms)` : '';

    let emoji = '📋';
    let logLevel = console.log;

    switch (status) {
      case 'started':
        emoji = '🚀';
        logLevel = console.log;
        break;
      case 'completed':
        emoji = '✅';
        logLevel = console.log;
        break;
      case 'failed':
        emoji = '❌';
        logLevel = console.error;
        break;
      case 'warning':
        emoji = '⚠️';
        logLevel = console.warn;
        break;
    }

    logLevel(`${emoji} FEMA ${operation} ${status} ${duration}`);

    // Log additional details for important events
    if (status === 'completed' && entry.details.newCounties && entry.details.newCounties > 0) {
      console.log(`   📍 ${entry.details.newCounties} new counties added, ${entry.details.updatedCounties || 0} updated`);
    }

    if (status === 'failed' && entry.details.errors && entry.details.errors.length > 0) {
      console.error(`   ❌ ${entry.details.errors.length} errors encountered`);
    }
  }

  private categorizeErrors(errors: string[]): string[] {
    const categories: string[] = [];
    
    for (const error of errors) {
      const errorLower = error.toLowerCase();
      
      if (errorLower.includes('network') || errorLower.includes('timeout') || errorLower.includes('connection')) {
        categories.push('network');
      } else if (errorLower.includes('rate limit') || errorLower.includes('429')) {
        categories.push('rate_limit');
      } else if (errorLower.includes('api') || errorLower.includes('400') || errorLower.includes('500')) {
        categories.push('api_error');
      } else if (errorLower.includes('parse') || errorLower.includes('json') || errorLower.includes('format')) {
        categories.push('data_format');
      } else if (errorLower.includes('storage') || errorLower.includes('database')) {
        categories.push('storage');
      } else {
        categories.push('unknown');
      }
    }
    
    return Array.from(new Set(categories)); // Remove duplicates
  }

  private calculateCommonErrors(errorLogs: FemaSyncLogEntry[]): { error: string; count: number; lastOccurred: Date }[] {
    const errorCounts = new Map<string, { count: number; lastOccurred: Date }>();
    
    for (const log of errorLogs) {
      if (log.details.errors) {
        for (const error of log.details.errors) {
          const existing = errorCounts.get(error);
          if (existing) {
            existing.count++;
            if (log.timestamp > existing.lastOccurred) {
              existing.lastOccurred = log.timestamp;
            }
          } else {
            errorCounts.set(error, { count: 1, lastOccurred: log.timestamp });
          }
        }
      }
    }
    
    return Array.from(errorCounts.entries())
      .map(([error, data]) => ({ error, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10 errors
  }

  private calculateDailyStats(syncLogs: FemaSyncLogEntry[]): FemaMonitoringStats['dailyStats'] {
    const dailyMap = new Map<string, {
      syncs: number;
      successes: number;
      failures: number;
      durations: number[];
      disastersProcessed: number;
    }>();

    // Get last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    for (const log of syncLogs) {
      if (log.timestamp < thirtyDaysAgo) continue;
      
      const dateKey = log.timestamp.toISOString().split('T')[0];
      const existing = dailyMap.get(dateKey) || {
        syncs: 0,
        successes: 0,
        failures: 0,
        durations: [],
        disastersProcessed: 0
      };

      existing.syncs++;
      if (log.status === 'completed') existing.successes++;
      if (log.status === 'failed') existing.failures++;
      if (log.duration) existing.durations.push(log.duration);
      existing.disastersProcessed += log.details.disastersProcessed || 0;

      dailyMap.set(dateKey, existing);
    }

    return Array.from(dailyMap.entries()).map(([date, data]) => ({
      date,
      syncs: data.syncs,
      successes: data.successes,
      failures: data.failures,
      avgDuration: data.durations.length > 0 ? 
        Math.round(data.durations.reduce((a, b) => a + b, 0) / data.durations.length) : 0,
      disastersProcessed: data.disastersProcessed
    })).sort((a, b) => a.date.localeCompare(b.date));
  }

  private getEmptyStats(): FemaMonitoringStats {
    return {
      totalSyncs: 0,
      successfulSyncs: 0,
      failedSyncs: 0,
      lastSyncDuration: null,
      avgSyncDuration: 0,
      totalDisastersProcessed: 0,
      totalCountiesCreated: 0,
      totalCountiesUpdated: 0,
      errorRate: 0,
      commonErrors: [],
      apiPerformance: {
        avgResponseTime: 0,
        rateLimitHits: 0,
        totalApiCalls: 0
      },
      dailyStats: []
    };
  }
}

// Export singleton instance
export const femaMonitoringService = FemaMonitoringService.getInstance();