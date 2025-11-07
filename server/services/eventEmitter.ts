/**
 * Event Emitter Service
 * Custom event-driven architecture (replaces n8n/Zapier - $0/month vs $20-50/month)
 * 
 * Emit events throughout the application to trigger automations:
 * - LeadCreated, QuoteSent, JobBooked, PaymentCaptured, TicketOpened, etc.
 */

import { db } from '../db';
import { systemEvents, type InsertSystemEvent } from '@shared/schema';

export type EventType =
  // Lead events
  | 'LeadCreated'
  | 'LeadQualified'
  | 'LeadDisqualified'
  | 'LeadUntouched24h'
  | 'LeadAssigned'
  | 'LeadStatusChanged'
  | 'AILeadStatusChanged'
  
  // Quote events
  | 'QuoteCreated'
  | 'QuoteSent'
  | 'QuoteViewed'
  | 'QuoteAccepted'
  | 'QuoteExpired'
  | 'QuoteReminderDue'
  | 'QuoteStatusChanged'
  
  // Job events
  | 'JobBooked'
  | 'JobScheduled'
  | 'JobStarted'
  | 'JobCompleted'
  | 'JobCancelled'
  | 'JobNoShow'
  
  // Payment events
  | 'PaymentCaptured'
  | 'PaymentFailed'
  | 'InvoiceCreated'
  | 'InvoicePastDue'
  
  // Ticket events
  | 'TicketOpened'
  | 'TicketEscalated'
  | 'TicketResolved'
  | 'TicketSLABreach'
  
  // Contractor events
  | 'ContractorAssigned'
  | 'ContractorAccepted'
  | 'ContractorDeclined'
  | 'ContractorNoResponse'
  
  // Customer events
  | 'CustomerRegistered'
  | 'CustomerNoActivity90d'
  | 'ReviewRequested'
  | 'ReviewReceived';

export type AggregateType = 
  | 'lead' 
  | 'quote' 
  | 'job' 
  | 'payment' 
  | 'ticket' 
  | 'contractor' 
  | 'customer';

interface EmitEventOptions {
  eventType: EventType;
  aggregateType: AggregateType;
  aggregateId: string;
  payload: Record<string, any>;
  metadata?: {
    userId?: string;
    ipAddress?: string;
    userAgent?: string;
    source?: string;
  };
}

class EventEmitterService {
  /**
   * Emit an event to trigger automation rules
   */
  async emit(options: EmitEventOptions): Promise<void> {
    try {
      await db.insert(systemEvents).values({
        eventType: options.eventType,
        aggregateType: options.aggregateType,
        aggregateId: options.aggregateId,
        payload: options.payload,
        metadata: options.metadata || {},
        processed: false,
        occurredAt: new Date(),
      });

      console.log(`📢 Event emitted: ${options.eventType} for ${options.aggregateType}:${options.aggregateId}`);
    } catch (error) {
      console.error('❌ Failed to emit event:', error);
      // Don't throw - events should be fire-and-forget
    }
  }

  /**
   * Emit LeadCreated event
   */
  async emitLeadCreated(leadId: string, leadData: Record<string, any>): Promise<void> {
    await this.emit({
      eventType: 'LeadCreated',
      aggregateType: 'lead',
      aggregateId: leadId,
      payload: leadData,
      metadata: { source: 'system' },
    });
  }

  /**
   * Emit QuoteSent event
   */
  async emitQuoteSent(quoteId: string, quoteData: Record<string, any>): Promise<void> {
    await this.emit({
      eventType: 'QuoteSent',
      aggregateType: 'quote',
      aggregateId: quoteId,
      payload: quoteData,
      metadata: { source: 'system' },
    });
  }

  /**
   * Emit JobBooked event
   */
  async emitJobBooked(jobId: string, jobData: Record<string, any>): Promise<void> {
    await this.emit({
      eventType: 'JobBooked',
      aggregateType: 'job',
      aggregateId: jobId,
      payload: jobData,
      metadata: { source: 'system' },
    });
  }

  /**
   * Emit PaymentCaptured event
   */
  async emitPaymentCaptured(paymentId: string, paymentData: Record<string, any>): Promise<void> {
    await this.emit({
      eventType: 'PaymentCaptured',
      aggregateType: 'payment',
      aggregateId: paymentId,
      payload: paymentData,
      metadata: { source: 'system' },
    });
  }

  /**
   * Emit TicketOpened event
   */
  async emitTicketOpened(ticketId: string, ticketData: Record<string, any>): Promise<void> {
    await this.emit({
      eventType: 'TicketOpened',
      aggregateType: 'ticket',
      aggregateId: ticketId,
      payload: ticketData,
      metadata: { source: 'system' },
    });
  }

  /**
   * Emit LeadUntouched24h event (for automation)
   */
  async emitLeadUntouched24h(leadId: string, leadData: Record<string, any>): Promise<void> {
    await this.emit({
      eventType: 'LeadUntouched24h',
      aggregateType: 'lead',
      aggregateId: leadId,
      payload: leadData,
      metadata: { source: 'automation' },
    });
  }

  /**
   * Emit QuoteReminderDue event (for automation)
   */
  async emitQuoteReminderDue(quoteId: string, quoteData: Record<string, any>, daysSinceSent: number): Promise<void> {
    await this.emit({
      eventType: 'QuoteReminderDue',
      aggregateType: 'quote',
      aggregateId: quoteId,
      payload: { ...quoteData, daysSinceSent },
      metadata: { source: 'automation' },
    });
  }

  /**
   * Emit JobNoShow event
   */
  async emitJobNoShow(jobId: string, jobData: Record<string, any>): Promise<void> {
    await this.emit({
      eventType: 'JobNoShow',
      aggregateType: 'job',
      aggregateId: jobId,
      payload: jobData,
      metadata: { source: 'automation' },
    });
  }

  /**
   * Emit ReviewRequested event
   */
  async emitReviewRequested(jobId: string, customerData: Record<string, any>): Promise<void> {
    await this.emit({
      eventType: 'ReviewRequested',
      aggregateType: 'customer',
      aggregateId: customerData.customerId || jobId,
      payload: { jobId, ...customerData },
      metadata: { source: 'automation' },
    });
  }
}

export const eventEmitter = new EventEmitterService();
