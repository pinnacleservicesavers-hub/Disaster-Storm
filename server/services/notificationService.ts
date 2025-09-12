import { ContractorWatchlist } from '@shared/schema';
import nodemailer from 'nodemailer';

export interface AlertNotification {
  id: string;
  type: 'traffic_incident' | 'damage_detection' | 'weather_alert' | 'contractor_opportunity';
  severity: 'minor' | 'moderate' | 'severe' | 'critical';
  title: string;
  description: string;
  location: {
    address?: string;
    lat: number;
    lng: number;
    state: string;
    county?: string;
  };
  cameraId?: string;
  alertTypes: string[]; // ['tree_down', 'structure_damage', 'debris', 'flooding']
  urgencyLevel: 'low' | 'normal' | 'high' | 'emergency';
  estimatedValue?: {
    min: number;
    max: number;
    currency: 'USD';
  };
  contractorTypes?: string[]; // Types of contractors needed
  imageUrl?: string;
  videoUrl?: string;
  expiresAt?: Date;
  createdAt: Date;
  metadata?: Record<string, any>;
}

export interface NotificationResult {
  success: boolean;
  method: 'email' | 'sms' | 'browser';
  contractorId: string;
  error?: string;
  deliveredAt: Date;
}

export class NotificationService {
  private emailTransporter: any = null;
  private twilioClient: any = null;
  private sseClients: Set<any>;
  private alertRateTracker = new Map<string, number[]>(); // contractor -> timestamps
  private isDevelopment: boolean;

  constructor(sseClients: Set<any>) {
    this.sseClients = sseClients;
    this.isDevelopment = process.env.NODE_ENV !== 'production';
    
    // Initialize email transporter
    this.initializeEmail();
    
    // Initialize Twilio client (mock mode for development)
    this.initializeTwilio();
    
    console.log(`🔔 NotificationService initialized (${this.isDevelopment ? 'development' : 'production'} mode)`);
  }

  private async initializeEmail(): Promise<void> {
    try {
      if (process.env.SMTP_URL) {
        this.emailTransporter = nodemailer.createTransport(process.env.SMTP_URL);
      } else if (process.env.SMTP_HOST) {
        this.emailTransporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT || 587),
          secure: false,
          auth: process.env.SMTP_USER ? { 
            user: process.env.SMTP_USER, 
            pass: process.env.SMTP_PASS 
          } : undefined
        });
      }
    } catch (error) {
      console.error('❌ Email transporter initialization failed:', error);
      this.emailTransporter = null;
    }
  }

  private async initializeTwilio(): Promise<void> {
    try {
      if (process.env.TWILIO_SID && process.env.TWILIO_TOKEN && !this.isDevelopment) {
        const twilio = await import('twilio');
        this.twilioClient = twilio.default(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);
        console.log('📱 Twilio SMS client initialized');
      } else {
        console.log('📱 Mock SMS mode enabled for development');
      }
    } catch (error) {
      console.error('❌ Twilio initialization failed:', error);
      this.twilioClient = null;
    }
  }

  /**
   * Send notification to contractors based on alert and their watchlist preferences
   */
  async dispatchAlert(
    alert: AlertNotification, 
    watchlistItems: ContractorWatchlist[]
  ): Promise<NotificationResult[]> {
    const results: NotificationResult[] = [];
    
    for (const watchlist of watchlistItems) {
      // Check if alerts are enabled for this watchlist item
      if (!watchlist.alertsEnabled) {
        continue;
      }

      // Check severity filtering
      if (!this.meetsSeverityRequirement(alert.severity, watchlist.minSeverityLevel)) {
        continue;
      }

      // Check alert type filtering
      if (!this.meetsAlertTypeRequirement(alert.alertTypes, watchlist.alertTypes)) {
        continue;
      }

      // Check geographic radius
      if (!this.withinAlertRadius(alert.location, watchlist, alert.location.lat, alert.location.lng)) {
        continue;
      }

      // Check rate limiting
      if (!this.passesRateLimit(watchlist.contractorId, watchlist.maxAlertsPerHour || 5)) {
        console.log(`⏰ Rate limit exceeded for contractor ${watchlist.contractorId}`);
        continue;
      }

      // Check quiet hours
      if (!this.passesQuietHours(alert, watchlist)) {
        console.log(`🔇 Quiet hours active for contractor ${watchlist.contractorId}`);
        continue;
      }

      // Send notifications via enabled channels
      if (watchlist.browserAlertsEnabled) {
        const result = await this.sendBrowserNotification(watchlist.contractorId, alert);
        results.push(result);
      }

      if (watchlist.emailAlertsEnabled) {
        const result = await this.sendEmailNotification(watchlist, alert);
        results.push(result);
      }

      if (watchlist.smsAlertsEnabled && watchlist.alertPhone) {
        const result = await this.sendSMSNotification(watchlist, alert);
        results.push(result);
      }

      // Track this alert for rate limiting
      this.trackAlert(watchlist.contractorId);
    }

    console.log(`🔔 Alert dispatched to ${results.length} notification channels`);
    return results;
  }

  private meetsSeverityRequirement(alertSeverity: string, minSeverity?: string | null): boolean {
    if (!minSeverity) return true;
    
    const severityLevels = { minor: 1, moderate: 2, severe: 3, critical: 4 };
    const alertLevel = severityLevels[alertSeverity as keyof typeof severityLevels] || 0;
    const minLevel = severityLevels[minSeverity as keyof typeof severityLevels] || 0;
    
    return alertLevel >= minLevel;
  }

  private meetsAlertTypeRequirement(alertTypes: string[], watchlistTypes?: any): boolean {
    if (!watchlistTypes || !Array.isArray(watchlistTypes) || watchlistTypes.length === 0) {
      return true; // No filtering, accept all
    }
    
    return alertTypes.some(type => watchlistTypes.includes(type));
  }

  private withinAlertRadius(
    alertLocation: AlertNotification['location'], 
    watchlist: ContractorWatchlist,
    alertLat: number,
    alertLng: number
  ): boolean {
    // State-level filtering: if watchlist is for a specific state, alert must be in that state
    if (watchlist.state && alertLocation.state !== watchlist.state) {
      return false;
    }

    // County-level filtering: if watchlist is for a specific county, alert must be in that county  
    if (watchlist.county && alertLocation.county && alertLocation.county !== watchlist.county) {
      return false;
    }

    // Geographic radius filtering is not supported without lat/lng coordinates on watchlist
    // For now, rely on state/county matching above
    // TODO: Add geocoding capability for watchlist items to support radius filtering

    // Default to true if state/county match or no geographic filters are set
    return true;
  }

  private passesRateLimit(contractorId: string, maxPerHour: number): boolean {
    const now = Date.now();
    const hourAgo = now - (60 * 60 * 1000);
    
    if (!this.alertRateTracker.has(contractorId)) {
      this.alertRateTracker.set(contractorId, []);
    }
    
    const timestamps = this.alertRateTracker.get(contractorId)!;
    
    // Remove timestamps older than 1 hour
    const recentTimestamps = timestamps.filter(ts => ts > hourAgo);
    this.alertRateTracker.set(contractorId, recentTimestamps);
    
    return recentTimestamps.length < maxPerHour;
  }

  private passesQuietHours(alert: AlertNotification, watchlist: ContractorWatchlist): boolean {
    // Emergency alerts bypass quiet hours
    if (alert.urgencyLevel === 'emergency' || alert.severity === 'critical') {
      return true;
    }

    // Check if alert type is in immediate alert types (bypasses quiet hours)
    if (watchlist.immediateAlertTypes && Array.isArray(watchlist.immediateAlertTypes)) {
      const hasImmediateType = alert.alertTypes.some(type => 
        watchlist.immediateAlertTypes.includes(type)
      );
      if (hasImmediateType) {
        return true;
      }
    }

    // If no quiet hours configured, allow all alerts
    if (!watchlist.quietHoursStart || !watchlist.quietHoursEnd) {
      return true;
    }

    const now = new Date();
    const timezone = watchlist.timezone || 'America/New_York';
    
    try {
      const currentHour = now.toLocaleString('en-US', { 
        timeZone: timezone, 
        hour12: false, 
        hour: '2-digit',
        minute: '2-digit'
      });

      const quietStart = watchlist.quietHoursStart;
      const quietEnd = watchlist.quietHoursEnd;
      
      // Simple time comparison (in production, use a proper date library)
      if (quietStart && quietEnd) {
        if (quietStart > quietEnd) {
          // Overnight quiet hours (e.g., 22:00 to 06:00)
          return currentHour < quietStart && currentHour >= quietEnd;
        } else {
          // Same day quiet hours (e.g., 12:00 to 14:00)
          return currentHour < quietStart || currentHour >= quietEnd;
        }
      }
    } catch (error) {
      console.error('Error checking quiet hours:', error);
      return true; // Default to allowing alerts if time check fails
    }
    
    return true;
  }

  private trackAlert(contractorId: string): void {
    if (!this.alertRateTracker.has(contractorId)) {
      this.alertRateTracker.set(contractorId, []);
    }
    
    this.alertRateTracker.get(contractorId)!.push(Date.now());
  }

  private async sendBrowserNotification(contractorId: string, alert: AlertNotification): Promise<NotificationResult> {
    try {
      const notificationData = {
        id: alert.id,
        type: 'contractor_alert',
        contractorId,
        alert: {
          title: alert.title,
          description: alert.description,
          severity: alert.severity,
          location: alert.location,
          alertTypes: alert.alertTypes,
          urgencyLevel: alert.urgencyLevel,
          imageUrl: alert.imageUrl,
          videoUrl: alert.videoUrl,
          estimatedValue: alert.estimatedValue,
          createdAt: alert.createdAt.toISOString()
        }
      };

      // Send via SSE to all connected clients
      this.sseClients.forEach((client) => {
        try {
          client.write(`data: ${JSON.stringify(notificationData)}\n\n`);
        } catch (error) {
          console.error('SSE write error:', error);
          this.sseClients.delete(client);
        }
      });

      return {
        success: true,
        method: 'browser',
        contractorId,
        deliveredAt: new Date()
      };
    } catch (error) {
      return {
        success: false,
        method: 'browser',
        contractorId,
        error: String(error),
        deliveredAt: new Date()
      };
    }
  }

  private async sendEmailNotification(watchlist: ContractorWatchlist, alert: AlertNotification): Promise<NotificationResult> {
    try {
      if (!this.emailTransporter) {
        throw new Error('Email not configured');
      }

      const emailAddress = watchlist.alertEmail || 'contractor@example.com'; // Fallback for demo
      const subject = `🚨 ${alert.severity.toUpperCase()}: ${alert.title}`;
      
      const html = this.generateEmailHTML(alert);

      const mailOptions = {
        from: process.env.SMTP_FROM || process.env.SMTP_USER || 'alerts@trafficcamwatcher.com',
        to: emailAddress,
        subject,
        html
      };

      await this.emailTransporter.sendMail(mailOptions);

      return {
        success: true,
        method: 'email',
        contractorId: watchlist.contractorId,
        deliveredAt: new Date()
      };
    } catch (error) {
      return {
        success: false,
        method: 'email',
        contractorId: watchlist.contractorId,
        error: String(error),
        deliveredAt: new Date()
      };
    }
  }

  private async sendSMSNotification(watchlist: ContractorWatchlist, alert: AlertNotification): Promise<NotificationResult> {
    try {
      const phoneNumber = watchlist.alertPhone;
      if (!phoneNumber) {
        throw new Error('No phone number configured');
      }

      const message = this.generateSMSMessage(alert);

      if (this.isDevelopment || !this.twilioClient) {
        // Mock SMS for development
        console.log(`📱 MOCK SMS to ${phoneNumber}:`);
        console.log(`📱 Message: ${message}`);
        console.log(`📱 Alert ID: ${alert.id}`);
        
        return {
          success: true,
          method: 'sms',
          contractorId: watchlist.contractorId,
          deliveredAt: new Date()
        };
      } else {
        // Real SMS via Twilio
        const result = await this.twilioClient.messages.create({
          body: message,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: phoneNumber
        });

        return {
          success: true,
          method: 'sms',
          contractorId: watchlist.contractorId,
          deliveredAt: new Date()
        };
      }
    } catch (error) {
      return {
        success: false,
        method: 'sms',
        contractorId: watchlist.contractorId,
        error: String(error),
        deliveredAt: new Date()
      };
    }
  }

  private generateEmailHTML(alert: AlertNotification): string {
    const severityColor = {
      minor: '#fbbf24',
      moderate: '#f59e0b', 
      severe: '#ef4444',
      critical: '#dc2626'
    }[alert.severity] || '#6b7280';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>TrafficCamWatcher Alert</title>
      </head>
      <body style="font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f9fafb;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <div style="background-color: ${severityColor}; color: white; padding: 20px;">
            <h1 style="margin: 0; font-size: 24px;">🚨 ${alert.severity.toUpperCase()} ALERT</h1>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">${alert.title}</p>
          </div>
          
          <div style="padding: 20px;">
            <h2 style="color: #374151; margin-top: 0;">Incident Details</h2>
            <p style="color: #6b7280; line-height: 1.6;">${alert.description}</p>
            
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin: 15px 0;">
              <h3 style="margin: 0 0 10px 0; color: #374151;">📍 Location</h3>
              <p style="margin: 0; color: #6b7280;">${alert.location.address || 'Address not available'}</p>
              <p style="margin: 5px 0 0 0; color: #9ca3af; font-size: 14px;">
                ${alert.location.lat.toFixed(6)}, ${alert.location.lng.toFixed(6)}
              </p>
            </div>

            ${alert.alertTypes.length > 0 ? `
            <div style="margin: 15px 0;">
              <h3 style="margin: 0 0 10px 0; color: #374151;">🏷️ Alert Types</h3>
              <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                ${alert.alertTypes.map(type => `
                  <span style="background-color: #dbeafe; color: #1e40af; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500;">
                    ${type.replace(/_/g, ' ').toUpperCase()}
                  </span>
                `).join('')}
              </div>
            </div>
            ` : ''}

            ${alert.estimatedValue ? `
            <div style="margin: 15px 0;">
              <h3 style="margin: 0 0 10px 0; color: #374151;">💰 Estimated Value</h3>
              <p style="margin: 0; color: #059669; font-weight: bold; font-size: 18px;">
                $${alert.estimatedValue.min.toLocaleString()} - $${alert.estimatedValue.max.toLocaleString()} ${alert.estimatedValue.currency}
              </p>
            </div>
            ` : ''}

            ${alert.imageUrl ? `
            <div style="margin: 15px 0;">
              <h3 style="margin: 0 0 10px 0; color: #374151;">📸 Image</h3>
              <img src="${alert.imageUrl}" alt="Alert Image" style="max-width: 100%; border-radius: 6px; border: 1px solid #e5e7eb;">
            </div>
            ` : ''}
            
            <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                Alert generated at ${alert.createdAt.toLocaleString()}<br>
                TrafficCamWatcher Alert System
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generateSMSMessage(alert: AlertNotification): string {
    const location = alert.location.address || `${alert.location.lat.toFixed(4)}, ${alert.location.lng.toFixed(4)}`;
    const value = alert.estimatedValue 
      ? ` Est: $${alert.estimatedValue.min}k-$${alert.estimatedValue.max}k`
      : '';
    
    return `🚨${alert.severity.toUpperCase()}: ${alert.title}
📍${location}
🏷️${alert.alertTypes.join(', ')}${value}
⏰${alert.createdAt.toLocaleTimeString()}`;
  }

  /**
   * Get notification delivery statistics
   */
  getNotificationStats(): { totalAlerts: number; rateTrackedContractors: number } {
    return {
      totalAlerts: Array.from(this.alertRateTracker.values()).reduce((sum, arr) => sum + arr.length, 0),
      rateTrackedContractors: this.alertRateTracker.size
    };
  }
}