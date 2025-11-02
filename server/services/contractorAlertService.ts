import { sendSms } from './twilio.js';
import nodemailer from 'nodemailer';

interface ContractorOpportunity {
  id: number;
  state: string;
  county: string;
  opportunityScore: string;
  estimatedRevenueOpportunity: string;
  expectedJobCount: number;
  optimalPrePositionTime: Date;
  workAvailableFromTime: Date;
  peakDemandTime: Date;
  alertLevel: string;
  marketPotential: string;
}

interface AlertPreference {
  contractorId: string;
  email?: string;
  phone?: string;
  minOpportunityScore?: number; // Default: 70
  minRevenueThreshold?: number; // Default: 100000
  states?: string[]; // Empty = all states
  alertTypes?: ('sms' | 'email')[];
  urgentOnly?: boolean; // Only alert for < 12h pre-position windows
}

export class ContractorAlertService {
  private lastCheckedOpportunityIds: Set<number> = new Set();
  private emailTransporter: any = null;
  private isDevelopment: boolean;
  
  constructor() {
    this.isDevelopment = process.env.NODE_ENV !== 'production';
    this.initializeEmail();
    console.log('🚨 ContractorAlertService initialized');
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
      console.error('❌ Email initialization failed:', error);
      this.emailTransporter = null;
    }
  }

  /**
   * Check for new high-value opportunities and send alerts
   */
  async checkAndAlertOpportunities(
    opportunities: ContractorOpportunity[],
    preferences: AlertPreference[]
  ): Promise<{ sent: number; skipped: number }> {
    let sent = 0;
    let skipped = 0;

    for (const opportunity of opportunities) {
      // Skip if already alerted
      if (this.lastCheckedOpportunityIds.has(opportunity.id)) {
        skipped++;
        continue;
      }

      const score = parseFloat(opportunity.opportunityScore);
      const revenue = parseFloat(opportunity.estimatedRevenueOpportunity);
      const hoursUntilPrePosition = Math.round((new Date(opportunity.optimalPrePositionTime).getTime() - Date.now()) / (1000 * 60 * 60));
      const isUrgent = hoursUntilPrePosition <= 12;

      // Find matching contractors based on preferences
      for (const pref of preferences) {
        // Check state filter
        if (pref.states && pref.states.length > 0 && !pref.states.includes(opportunity.state)) {
          continue;
        }

        // Check score threshold
        if (pref.minOpportunityScore && score < pref.minOpportunityScore) {
          continue;
        }

        // Check revenue threshold
        if (pref.minRevenueThreshold && revenue < pref.minRevenueThreshold) {
          continue;
        }

        // Check urgency filter
        if (pref.urgentOnly && !isUrgent) {
          continue;
        }

        // Send alerts
        if (pref.alertTypes?.includes('email') && pref.email) {
          await this.sendEmailAlert(pref.email, opportunity, hoursUntilPrePosition);
        }

        if (pref.alertTypes?.includes('sms') && pref.phone) {
          await this.sendSMSAlert(pref.phone, opportunity, hoursUntilPrePosition);
        }

        sent++;
      }

      // Mark as processed
      this.lastCheckedOpportunityIds.add(opportunity.id);
    }

    // Cleanup old IDs (keep last 1000)
    if (this.lastCheckedOpportunityIds.size > 1000) {
      const idsArray = Array.from(this.lastCheckedOpportunityIds);
      this.lastCheckedOpportunityIds = new Set(idsArray.slice(-500));
    }

    return { sent, skipped };
  }

  private async sendEmailAlert(
    email: string,
    opportunity: ContractorOpportunity,
    hoursUntilPrePosition: number
  ): Promise<boolean> {
    try {
      if (!this.emailTransporter && !this.isDevelopment) {
        console.log('⚠️ Email not configured, skipping email alert');
        return false;
      }

      const score = parseFloat(opportunity.opportunityScore).toFixed(1);
      const revenue = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(parseFloat(opportunity.estimatedRevenueOpportunity));
      const isUrgent = hoursUntilPrePosition <= 12;

      const subject = isUrgent 
        ? `🚨 URGENT: Deploy NOW - ${revenue} Opportunity in ${opportunity.county}, ${opportunity.state}`
        : `💰 New Contractor Opportunity: ${revenue} in ${opportunity.county}, ${opportunity.state}`;

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Disaster Direct - Contractor Opportunity</title>
        </head>
        <body style="font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #000000; color: #ffffff;">
          <div style="max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); border: 2px solid ${isUrgent ? '#eab308' : '#00d9ff'}; border-radius: 12px; overflow: hidden;">
            <!-- Header -->
            <div style="background: linear-gradient(90deg, ${isUrgent ? '#dc2626' : '#8000ff'} 0%, ${isUrgent ? '#eab308' : '#00d9ff'} 100%); padding: 30px; text-align: center;">
              <h1 style="margin: 0; font-size: 28px; color: #ffffff; text-shadow: 0 0 20px rgba(255,255,255,0.5);">
                ${isUrgent ? '🚨 URGENT DEPLOYMENT ALERT' : '💰 High-Value Opportunity'}
              </h1>
              <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.95;">Disaster Direct Contractor Intelligence</p>
            </div>
            
            <!-- Opportunity Details -->
            <div style="padding: 30px;">
              <div style="background: rgba(0, 217, 255, 0.1); border-left: 4px solid #00d9ff; padding: 20px; margin-bottom: 20px; border-radius: 8px;">
                <h2 style="margin: 0 0 10px 0; color: #00d9ff; font-size: 24px;">${opportunity.county}, ${opportunity.state}</h2>
                <p style="margin: 0; color: rgba(255,255,255,0.8); text-transform: capitalize;">Market Potential: ${opportunity.marketPotential}</p>
              </div>

              <!-- Key Metrics -->
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0;">
                <div style="background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.3); padding: 15px; border-radius: 8px; text-align: center;">
                  <div style="font-size: 14px; color: rgba(255,255,255,0.7); margin-bottom: 5px;">💰 Revenue Potential</div>
                  <div style="font-size: 24px; font-weight: bold; color: #10b981;">${revenue}</div>
                  <div style="font-size: 12px; color: rgba(255,255,255,0.6); margin-top: 5px;">${opportunity.expectedJobCount} jobs</div>
                </div>
                <div style="background: rgba(0, 217, 255, 0.15); border: 1px solid rgba(0, 217, 255, 0.3); padding: 15px; border-radius: 8px; text-align: center;">
                  <div style="font-size: 14px; color: rgba(255,255,255,0.7); margin-bottom: 5px;">📊 Opportunity Score</div>
                  <div style="font-size: 24px; font-weight: bold; color: #00d9ff;">${score}/100</div>
                  <div style="font-size: 12px; color: rgba(255,255,255,0.6); margin-top: 5px; text-transform: uppercase;">${opportunity.alertLevel} Priority</div>
                </div>
              </div>

              <!-- Deployment Timeline -->
              <div style="background: rgba(234, 179, 8, 0.1); border: 2px solid rgba(234, 179, 8, 0.3); padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin: 0 0 15px 0; color: #eab308; font-size: 18px;">⏰ Deployment Timeline</h3>
                <div style="margin: 10px 0;">
                  <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; background: rgba(0,0,0,0.3); border-radius: 6px; margin-bottom: 8px;">
                    <span style="color: rgba(255,255,255,0.8);">🚀 Pre-Position NOW</span>
                    <strong style="color: ${isUrgent ? '#ef4444' : '#eab308'}; font-size: 16px;">
                      ${hoursUntilPrePosition > 0 ? `${hoursUntilPrePosition}h` : 'IMMEDIATE'}
                    </strong>
                  </div>
                  <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; background: rgba(0,0,0,0.3); border-radius: 6px;">
                    <span style="color: rgba(255,255,255,0.8);">⚡ Work Starts</span>
                    <strong style="color: #00d9ff; font-size: 16px;">
                      ${new Date(opportunity.workAvailableFromTime).toLocaleString()}
                    </strong>
                  </div>
                </div>
              </div>

              ${isUrgent ? `
              <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); border: 2px solid #ef4444; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
                <div style="font-size: 32px; margin-bottom: 10px;">⚠️</div>
                <div style="font-size: 20px; font-weight: bold; color: #ffffff; margin-bottom: 10px;">CRITICAL: DEPLOY IMMEDIATELY</div>
                <div style="font-size: 14px; color: rgba(255,255,255,0.9);">
                  Pre-position window closing in ${hoursUntilPrePosition}h<br>
                  First-mover advantage at risk - Deploy crews NOW
                </div>
              </div>
              ` : ''}

              <!-- CTA -->
              <div style="text-align: center; margin-top: 30px;">
                <a href="${process.env.PUBLIC_BASE_URL || 'https://disaster-direct.replit.app'}/deployment-map" 
                   style="display: inline-block; background: linear-gradient(90deg, #8000ff 0%, #00d9ff 100%); color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 15px rgba(0, 217, 255, 0.3);">
                  View Deployment Map →
                </a>
              </div>

              <!-- Footer -->
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1); text-align: center;">
                <p style="margin: 0; color: rgba(255,255,255,0.5); font-size: 12px;">
                  Alert generated at ${new Date().toLocaleString()}<br>
                  Disaster Direct - Storm Operations Platform
                </p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;

      if (this.isDevelopment) {
        console.log(`📧 MOCK EMAIL to ${email}:`);
        console.log(`   Subject: ${subject}`);
        console.log(`   Opportunity: ${opportunity.county}, ${opportunity.state} - ${revenue}`);
        return true;
      }

      await this.emailTransporter.sendMail({
        from: process.env.SMTP_FROM || 'alerts@disasterdirect.com',
        to: email,
        subject,
        html
      });

      console.log(`✅ Email alert sent to ${email} for ${opportunity.county}, ${opportunity.state}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to send email alert:`, error);
      return false;
    }
  }

  private async sendSMSAlert(
    phone: string,
    opportunity: ContractorOpportunity,
    hoursUntilPrePosition: number
  ): Promise<boolean> {
    try {
      const revenue = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(parseFloat(opportunity.estimatedRevenueOpportunity));
      const score = parseFloat(opportunity.opportunityScore).toFixed(1);
      const isUrgent = hoursUntilPrePosition <= 12;

      const message = isUrgent
        ? `🚨 URGENT: Deploy NOW to ${opportunity.county}, ${opportunity.state}\n💰 ${revenue} (${opportunity.expectedJobCount} jobs)\n📊 Score: ${score}/100\n⏰ Pre-position in ${hoursUntilPrePosition}h\n🗺️ View: ${process.env.PUBLIC_BASE_URL}/deployment-map`
        : `💰 New Opportunity: ${opportunity.county}, ${opportunity.state}\n💵 ${revenue} (${opportunity.expectedJobCount} jobs)\n📊 Score: ${score}/100\n🚀 Deploy in ${hoursUntilPrePosition}h\n🗺️ ${process.env.PUBLIC_BASE_URL}/deployment-map`;

      if (this.isDevelopment) {
        console.log(`📱 MOCK SMS to ${phone}:`);
        console.log(`   ${message}`);
        return true;
      }

      await sendSms({ to: phone, message });
      console.log(`✅ SMS alert sent to ${phone} for ${opportunity.county}, ${opportunity.state}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to send SMS alert:`, error);
      return false;
    }
  }

  /**
   * Reset tracking for testing
   */
  resetTracking(): void {
    this.lastCheckedOpportunityIds.clear();
  }
}

// Singleton instance
export const contractorAlertService = new ContractorAlertService();
