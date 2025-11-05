import { db } from '../db';
import { aiOutreachLog, aiLeads, aiContractors } from '@shared/schema';
import { eq } from 'drizzle-orm';

export interface OutreachConfig {
  method: 'phone' | 'sms' | 'email';
  fromNumber?: string;
  toNumber?: string;
  subject?: string;
  message: string;
}

export async function sendOutreach(
  leadId: string,
  config: OutreachConfig
): Promise<{ success: boolean; externalId?: string; error?: string }> {
  const [lead] = await db.select().from(aiLeads).where(eq(aiLeads.id, leadId));

  if (!lead) {
    return { success: false, error: 'Lead not found' };
  }

  let status = 'sent';
  let externalId: string | undefined;
  let response: string | undefined;

  try {
    if (config.method === 'sms') {
      // TODO: Integrate Twilio SMS
      console.log(`[OUTREACH] SMS to ${config.toNumber}: ${config.message}`);
      status = 'sent';
      externalId = `mock-sms-${Date.now()}`;
    } else if (config.method === 'phone') {
      // TODO: Integrate Twilio Voice
      console.log(`[OUTREACH] Voice call to ${config.toNumber}: ${config.message}`);
      status = 'sent';
      externalId = `mock-call-${Date.now()}`;
    } else if (config.method === 'email') {
      // TODO: Integrate SendGrid
      console.log(`[OUTREACH] Email to ${lead.email}: ${config.subject}`);
      status = 'sent';
      externalId = `mock-email-${Date.now()}`;
    }

    await db.insert(aiOutreachLog).values({
      aiLeadId: leadId,
      method: config.method,
      fromNumber: config.fromNumber,
      toNumber: config.toNumber,
      subject: config.subject,
      message: config.message,
      status,
      response,
      externalId,
      sentAt: new Date(),
    });

    // Update lead contact tracking
    await db
      .update(aiLeads)
      .set({
        lastContactedAt: new Date(),
        contactAttempts: lead.contactAttempts + 1,
        lastContactMethod: config.method,
      })
      .where(eq(aiLeads.id, leadId));

    return { success: true, externalId };
  } catch (error) {
    console.error('Outreach error:', error);

    await db.insert(aiOutreachLog).values({
      aiLeadId: leadId,
      method: config.method,
      fromNumber: config.fromNumber,
      toNumber: config.toNumber,
      subject: config.subject,
      message: config.message,
      status: 'failed',
      response: error instanceof Error ? error.message : 'Unknown error',
      sentAt: new Date(),
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function sendLeadNotification(
  leadId: string,
  template: 'welcome' | 'service_assigned' | 'reminder'
): Promise<void> {
  const [lead] = await db.select().from(aiLeads).where(eq(aiLeads.id, leadId));

  if (!lead) {
    throw new Error('Lead not found');
  }

  const templates = {
    welcome: {
      subject: 'We received your damage claim',
      message: `Hi ${lead.name}, we've received your damage claim for ${lead.address}. Our team is reviewing it and will connect you with qualified contractors shortly.`,
    },
    service_assigned: {
      subject: 'Contractor assigned to your claim',
      message: `Hi ${lead.name}, great news! We've assigned a contractor to handle your property damage at ${lead.address}. They'll be reaching out soon.`,
    },
    reminder: {
      subject: 'Follow-up on your damage claim',
      message: `Hi ${lead.name}, just checking in on your damage claim for ${lead.address}. If you need any assistance, please let us know!`,
    },
  };

  const { subject, message } = templates[template];

  // Send email if available
  if (lead.email) {
    await sendOutreach(leadId, {
      method: 'email',
      subject,
      message,
    });
  }

  // Send SMS
  if (lead.phone) {
    await sendOutreach(leadId, {
      method: 'sms',
      toNumber: lead.phone,
      message,
    });
  }
}

export async function sendContractorAssignment(
  contractorId: string,
  assignmentDetails: {
    leadName: string;
    address: string;
    serviceCategory: string;
    urgency: string;
    estimatedCost?: number;
  }
): Promise<void> {
  const [contractor] = await db
    .select()
    .from(aiContractors)
    .where(eq(aiContractors.id, contractorId));

  if (!contractor) {
    throw new Error('Contractor not found');
  }

  const message = `New ${assignmentDetails.urgency} ${assignmentDetails.serviceCategory} job available at ${assignmentDetails.address}. Customer: ${assignmentDetails.leadName}. ${assignmentDetails.estimatedCost ? `Est. Cost: $${assignmentDetails.estimatedCost}` : ''} Reply to accept.`;

  // Send SMS
  if (contractor.phone) {
    console.log(`[OUTREACH] SMS to contractor ${contractor.companyName}: ${message}`);
    // TODO: Integrate Twilio
  }

  // Send email
  if (contractor.email) {
    console.log(`[OUTREACH] Email to contractor ${contractor.companyName}`);
    // TODO: Integrate SendGrid
  }
}

export function getLocalAreaCode(phoneNumber: string): string {
  const cleaned = phoneNumber.replace(/\D/g, '');
  if (cleaned.length >= 10) {
    return cleaned.substring(0, 3);
  }
  return '800'; // fallback
}

export async function sendBulkReminders(
  leadIds: string[]
): Promise<{ sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;

  for (const leadId of leadIds) {
    try {
      await sendLeadNotification(leadId, 'reminder');
      sent++;
    } catch (error) {
      console.error(`Failed to send reminder to lead ${leadId}:`, error);
      failed++;
    }
  }

  return { sent, failed };
}
