import { sendSms } from './twilio.js';

/**
 * Simple contractor configuration for MVP
 * In production, this would be pulled from a contractors table in the database
 */
interface Contractor {
  id: string;
  name: string;
  phone: string;
  serviceAreas: string[]; // County IDs from service areas config
  optedOut: boolean;
}

// Mock contractors for MVP - Replace with database query in production
const mockContractors: Contractor[] = [
  {
    id: 'contractor-1',
    name: 'Miami Storm Response LLC',
    phone: '+15551234567',
    serviceAreas: ['miami-dade', 'broward'],
    optedOut: false
  },
  {
    id: 'contractor-2', 
    name: 'Fort Lauderdale Restoration',
    phone: '+15559876543',
    serviceAreas: ['broward', 'palm-beach'],
    optedOut: false
  },
  {
    id: 'contractor-3',
    name: 'Houston Disaster Relief',
    phone: '+15555555555',
    serviceAreas: ['houston'],
    optedOut: false
  }
];

export interface BulkAlertOptions {
  affectedAreas: string[]; // Service area IDs
  hazardSummary: string; // e.g., "3 Extreme hail hazards active in your area"
  customMessage?: string;
  dryRun?: boolean;
}

export interface BulkAlertResult {
  success: boolean;
  sent: number;
  skipped: number;
  failed: number;
  dryRun: boolean;
  recipients: Array<{
    contractorId: string;
    name: string;
    phone: string;
    status: 'sent' | 'skipped' | 'failed';
    reason?: string;
    message?: string;
  }>;
}

/**
 * Service for sending bulk SMS alerts to contractors
 */
export class ContractorBulkAlertService {
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV !== 'production';
    console.log('📱 ContractorBulkAlertService initialized');
  }

  /**
   * Get contractors by service areas
   */
  private getContractorsByAreas(areas: string[]): Contractor[] {
    return mockContractors.filter(contractor => 
      !contractor.optedOut && 
      contractor.serviceAreas.some(area => areas.includes(area))
    );
  }

  /**
   * Generate alert message
   */
  private generateMessage(options: BulkAlertOptions): string {
    if (options.customMessage) {
      return options.customMessage;
    }

    return `🚨 DISASTER DIRECT ALERT\n\n${options.hazardSummary}\n\nCheck your dashboard for deployment opportunities.\n\nReply STOP to opt out.`;
  }

  /**
   * Send bulk SMS alerts to contractors
   */
  async sendBulkAlerts(options: BulkAlertOptions): Promise<BulkAlertResult> {
    const result: BulkAlertResult = {
      success: true,
      sent: 0,
      skipped: 0,
      failed: 0,
      dryRun: options.dryRun || false,
      recipients: []
    };

    const contractors = this.getContractorsByAreas(options.affectedAreas);
    const message = this.generateMessage(options);

    console.log(`📱 Sending bulk alerts to ${contractors.length} contractors (dryRun: ${result.dryRun})`);

    for (const contractor of contractors) {
      try {
        // Check if contractor opted out (in production, check DB)
        if (contractor.optedOut) {
          result.skipped++;
          result.recipients.push({
            contractorId: contractor.id,
            name: contractor.name,
            phone: contractor.phone,
            status: 'skipped',
            reason: 'Opted out'
          });
          continue;
        }

        if (result.dryRun) {
          // Dry run - just log what would be sent
          console.log(`[DRY RUN] Would send to ${contractor.name} (${contractor.phone}):`);
          console.log(`   ${message}`);
          result.sent++;
          result.recipients.push({
            contractorId: contractor.id,
            name: contractor.name,
            phone: contractor.phone,
            status: 'sent',
            message
          });
        } else {
          // Actually send SMS
          if (this.isDevelopment) {
            // Development mode - mock send
            console.log(`📱 [MOCK] SMS to ${contractor.name} (${contractor.phone}):`);
            console.log(`   ${message}`);
          } else {
            // Production - real Twilio send
            await sendSms({
              to: contractor.phone,
              message
            });
            console.log(`✅ SMS sent to ${contractor.name} (${contractor.phone})`);
          }
          
          result.sent++;
          result.recipients.push({
            contractorId: contractor.id,
            name: contractor.name,
            phone: contractor.phone,
            status: 'sent',
            message
          });
        }

        // Rate limiting - 1 message per second to avoid Twilio throttling
        if (!result.dryRun && !this.isDevelopment) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error(`❌ Failed to send SMS to ${contractor.name}:`, error);
        result.failed++;
        result.recipients.push({
          contractorId: contractor.id,
          name: contractor.name,
          phone: contractor.phone,
          status: 'failed',
          reason: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    console.log(`📊 Bulk alert complete: ${result.sent} sent, ${result.skipped} skipped, ${result.failed} failed`);
    return result;
  }

  /**
   * Handle opt-out request
   */
  async handleOptOut(phone: string): Promise<boolean> {
    // In production, update database
    const contractor = mockContractors.find(c => c.phone === phone);
    if (contractor) {
      contractor.optedOut = true;
      console.log(`✅ Contractor ${contractor.name} opted out`);
      return true;
    }
    return false;
  }
}

// Singleton instance
export const contractorBulkAlertService = new ContractorBulkAlertService();
