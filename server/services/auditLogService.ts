export interface AuditLogEntry {
  id: string;
  timestamp: Date;
  eventType: string; // 'hazard_ingest', 'geo_match', 'alert_sent', 'api_call'
  source: string; // 'NWS', 'NHC', 'USGS', 'FIRMS', 'contractor_alert'
  action: string;
  details: any;
  userId?: string;
  success: boolean;
  errorMessage?: string;
}

class AuditLogService {
  private logs: AuditLogEntry[] = [];
  private maxLogs = 10000; // Keep last 10k entries in memory

  log(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): void {
    const logEntry: AuditLogEntry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      ...entry,
    };

    this.logs.push(logEntry);

    // Trim old logs if needed
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Console output for development
    const status = logEntry.success ? '✅' : '❌';
    console.log(
      `${status} [${logEntry.source}] ${logEntry.action}`,
      logEntry.errorMessage ? `(Error: ${logEntry.errorMessage})` : ''
    );
  }

  // Hazard ingestion logging
  logHazardIngest(source: string, count: number, success: boolean, error?: string): void {
    this.log({
      eventType: 'hazard_ingest',
      source,
      action: `Fetched ${count} item(s)`,
      details: { count },
      success,
      errorMessage: error,
    });
  }

  // Geo-matching logging
  logGeoMatch(source: string, hazardId: string, matchCount: number): void {
    this.log({
      eventType: 'geo_match',
      source,
      action: `Matched ${matchCount} contractor(s)`,
      details: { hazardId, matchCount },
      success: true,
    });
  }

  // Alert delivery logging
  logAlertSent(
    source: string,
    recipient: string,
    method: 'sms' | 'email' | 'webhook',
    success: boolean,
    error?: string
  ): void {
    this.log({
      eventType: 'alert_sent',
      source,
      action: `Sent ${method} to ${recipient}`,
      details: { recipient, method },
      success,
      errorMessage: error,
    });
  }

  // API call logging
  logAPICall(
    endpoint: string,
    userId: string | undefined,
    success: boolean,
    responseTime?: number
  ): void {
    this.log({
      eventType: 'api_call',
      source: 'api',
      action: `${endpoint}`,
      details: { endpoint, responseTime },
      userId,
      success,
    });
  }

  // Query logs
  getLogs(options?: {
    eventType?: string;
    source?: string;
    limit?: number;
    since?: Date;
  }): AuditLogEntry[] {
    let filtered = [...this.logs];

    if (options?.eventType) {
      filtered = filtered.filter(log => log.eventType === options.eventType);
    }

    if (options?.source) {
      filtered = filtered.filter(log => log.source === options.source);
    }

    if (options?.since) {
      filtered = filtered.filter(log => log.timestamp >= options.since!);
    }

    // Sort by timestamp descending (newest first)
    filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    if (options?.limit) {
      filtered = filtered.slice(0, options.limit);
    }

    return filtered;
  }

  getRecentLogs(limit: number = 100): AuditLogEntry[] {
    return this.getLogs({ limit });
  }

  getLogsBySource(source: string, limit: number = 100): AuditLogEntry[] {
    return this.getLogs({ source, limit });
  }

  getLogsByEventType(eventType: string, limit: number = 100): AuditLogEntry[] {
    return this.getLogs({ eventType, limit });
  }

  getStats(): {
    totalLogs: number;
    successRate: number;
    eventTypes: Record<string, number>;
    sources: Record<string, number>;
  } {
    const eventTypes: Record<string, number> = {};
    const sources: Record<string, number> = {};
    let successCount = 0;

    this.logs.forEach(log => {
      eventTypes[log.eventType] = (eventTypes[log.eventType] || 0) + 1;
      sources[log.source] = (sources[log.source] || 0) + 1;
      if (log.success) successCount++;
    });

    return {
      totalLogs: this.logs.length,
      successRate: this.logs.length > 0 ? (successCount / this.logs.length) * 100 : 0,
      eventTypes,
      sources,
    };
  }

  clearLogs(): void {
    this.logs = [];
    console.log('🗑️ Audit logs cleared');
  }
}

export const auditLogService = new AuditLogService();
console.log('📋 Audit logging service initialized');
