/**
 * Automation Processor Service
 * Processes system events and executes automation rules
 * Custom automation engine (replaces n8n/Zapier - $0/month vs $20-50/month)
 */

import { db } from '../db';
import { systemEvents, automationRules, automationExecutions } from '@shared/schema';
import { eq, and, isNull, lt, gte } from 'drizzle-orm';
import { sendSms } from './twilio';
import { sendFollowUpEmail } from './sendgrid';

interface AutomationAction {
  type: 'sendEmail' | 'sendSMS' | 'updateRecord' | 'createTask' | 'assignContractor' | 'webhook';
  config: Record<string, any>;
  order: number;
}

class AutomationProcessorService {
  private isProcessing = false;

  /**
   * Process all unprocessed events
   * Called by cron job every minute
   */
  async processEvents(): Promise<void> {
    if (this.isProcessing) {
      console.log('⏳ Automation processor already running, skipping...');
      return;
    }

    this.isProcessing = true;

    try {
      // Get unprocessed events
      const unprocessedEvents = await db.query.systemEvents.findMany({
        where: eq(systemEvents.processed, false),
        limit: 50, // Process in batches
        orderBy: (events, { asc }) => [asc(events.occurredAt)],
      }).catch(() => []);

      if (unprocessedEvents.length === 0) {
        return;
      }

      console.log(`🤖 Processing ${unprocessedEvents.length} events...`);

      for (const event of unprocessedEvents) {
        await this.processEvent(event);
      }

    } catch (error) {
      console.error('❌ Automation processor error:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Process a single event
   */
  private async processEvent(event: any): Promise<void> {
    try {
      // Find matching automation rules
      const matchingRules = await db.query.automationRules.findMany({
        where: and(
          eq(automationRules.enabled, true),
          eq(automationRules.triggerEventType, event.eventType)
        ),
      }).catch(() => []);

      if (matchingRules.length === 0) {
        // No matching rules, mark as processed
        await db.update(systemEvents)
          .set({ processed: true, processedAt: new Date() })
          .where(eq(systemEvents.id, event.id))
          .catch(() => {});
        return;
      }

      console.log(`📋 Found ${matchingRules.length} matching rules for ${event.eventType}`);

      // Execute each matching rule
      for (const rule of matchingRules) {
        await this.executeRule(rule, event);
      }

      // Mark event as processed
      await db.update(systemEvents)
        .set({ processed: true, processedAt: new Date() })
        .where(eq(systemEvents.id, event.id))
        .catch(() => {});

    } catch (error) {
      console.error(`❌ Error processing event ${event.id}:`, error);
      
      // Mark event as processed with error
      await db.update(systemEvents)
        .set({
          processed: true,
          processedAt: new Date(),
          processingErrors: [error instanceof Error ? error.message : 'Unknown error'],
        })
        .where(eq(systemEvents.id, event.id))
        .catch(() => {});
    }
  }

  /**
   * Execute an automation rule
   */
  private async executeRule(rule: any, event: any): Promise<void> {
    // Check cooldown
    if (rule.lastExecutedAt && rule.cooldownMinutes > 0) {
      const cooldownMs = rule.cooldownMinutes * 60 * 1000;
      const timeSinceLastExecution = Date.now() - new Date(rule.lastExecutedAt).getTime();
      if (timeSinceLastExecution < cooldownMs) {
        console.log(`⏸️ Rule "${rule.name}" in cooldown, skipping...`);
        return;
      }
    }

    // Check execution limit (only count today's executions)
    if (rule.maxExecutionsPerDay) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const executionsToday = await db.query.automationExecutions.findMany({
        where: and(
          eq(automationExecutions.automationRuleId, rule.id),
          gte(automationExecutions.startedAt, today), // Executions after midnight today
          lt(automationExecutions.startedAt, new Date()) // Executions before now
        ),
      }).catch(() => []);

      if (executionsToday.length >= rule.maxExecutionsPerDay) {
        console.log(`🚫 Rule "${rule.name}" reached daily limit (${rule.maxExecutionsPerDay}), skipping...`);
        return;
      }
    }

    // Check conditions
    if (rule.triggerConditions && rule.triggerConditions.length > 0) {
      const conditionsMet = this.checkConditions(rule.triggerConditions, event.payload);
      if (!conditionsMet) {
        console.log(`❌ Rule "${rule.name}" conditions not met, skipping...`);
        return;
      }
    }

    // Create execution record
    const [execution] = await db.insert(automationExecutions).values({
      automationRuleId: rule.id,
      systemEventId: event.id,
      status: 'running',
      startedAt: new Date(),
    }).returning().catch(() => []);

    if (!execution) {
      console.error(`❌ Failed to create execution record for rule "${rule.name}"`);
      return;
    }

    try {
      // Execute actions in order
      const actions: AutomationAction[] = rule.actions || [];
      const actionsExecuted: any[] = [];

      for (const action of actions.sort((a, b) => a.order - b.order)) {
        const result = await this.executeAction(action, event, rule);
        actionsExecuted.push(result);
      }

      // Update execution as completed
      await db.update(automationExecutions)
        .set({
          status: 'completed',
          completedAt: new Date(),
          actionsExecuted,
        })
        .where(eq(automationExecutions.id, execution.id))
        .catch(() => {});

      // Update rule statistics
      await db.update(automationRules)
        .set({
          executionCount: (rule.executionCount || 0) + 1,
          successCount: (rule.successCount || 0) + 1,
          lastExecutedAt: new Date(),
        })
        .where(eq(automationRules.id, rule.id))
        .catch(() => {});

      console.log(`✅ Rule "${rule.name}" executed successfully`);

    } catch (error) {
      console.error(`❌ Rule "${rule.name}" execution failed:`, error);

      // Update execution as failed
      await db.update(automationExecutions)
        .set({
          status: 'failed',
          completedAt: new Date(),
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          errorStack: error instanceof Error ? error.stack : undefined,
        })
        .where(eq(automationExecutions.id, execution.id))
        .catch(() => {});

      // Update rule failure count
      await db.update(automationRules)
        .set({
          failureCount: (rule.failureCount || 0) + 1,
        })
        .where(eq(automationRules.id, rule.id))
        .catch(() => {});
    }
  }

  /**
   * Check if conditions are met
   */
  private checkConditions(conditions: any[], payload: Record<string, any>): boolean {
    for (const condition of conditions) {
      const value = payload[condition.field];
      const targetValue = condition.value;

      switch (condition.operator) {
        case 'equals':
          if (value !== targetValue) return false;
          break;
        case 'contains':
          if (typeof value !== 'string' || !value.includes(targetValue)) return false;
          break;
        case 'greaterThan':
          if (!(value > targetValue)) return false;
          break;
        case 'lessThan':
          if (!(value < targetValue)) return false;
          break;
        default:
          console.warn(`Unknown operator: ${condition.operator}`);
          return false;
      }
    }
    return true;
  }

  /**
   * Execute a single action
   */
  private async executeAction(
    action: AutomationAction,
    event: any,
    rule: any
  ): Promise<any> {
    console.log(`🎬 Executing action: ${action.type}`);

    try {
      switch (action.type) {
        case 'sendEmail':
          return await this.executeSendEmail(action.config, event);

        case 'sendSMS':
          return await this.executeSendSMS(action.config, event);

        case 'updateRecord':
          return await this.executeUpdateRecord(action.config, event);

        case 'createTask':
          return await this.executeCreateTask(action.config, event);

        case 'assignContractor':
          return await this.executeAssignContractor(action.config, event);

        case 'webhook':
          return await this.executeWebhook(action.config, event);

        default:
          throw new Error(`Unknown action type: ${action.type}`);
      }
    } catch (error) {
      return {
        type: action.type,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async executeSendEmail(config: any, event: any): Promise<any> {
    const { toEmail, subject, html } = config;
    const interpolatedSubject = this.interpolate(subject, event.payload);
    const interpolatedHtml = this.interpolate(html, event.payload);

    await sendFollowUpEmail({
      toEmail,
      toName: undefined,
      subject: interpolatedSubject,
      html: interpolatedHtml,
    });

    return { type: 'sendEmail', status: 'success', toEmail };
  }

  private async executeSendSMS(config: any, event: any): Promise<any> {
    const { toPhone, message } = config;
    const interpolatedMessage = this.interpolate(message, event.payload);

    await sendSms({
      to: toPhone,
      message: interpolatedMessage,
    });

    return { type: 'sendSMS', status: 'success', toPhone };
  }

  private async executeUpdateRecord(config: any, event: any): Promise<any> {
    // Placeholder for record update logic
    console.log('📝 Update record:', config);
    return { type: 'updateRecord', status: 'success' };
  }

  private async executeCreateTask(config: any, event: any): Promise<any> {
    // Placeholder for task creation logic
    console.log('📋 Create task:', config);
    return { type: 'createTask', status: 'success' };
  }

  private async executeAssignContractor(config: any, event: any): Promise<any> {
    // Placeholder for contractor assignment logic
    console.log('👷 Assign contractor:', config);
    return { type: 'assignContractor', status: 'success' };
  }

  private async executeWebhook(config: any, event: any): Promise<any> {
    const { url, method = 'POST' } = config;
    
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event.payload),
    });

    return { type: 'webhook', status: 'success', statusCode: response.status };
  }

  /**
   * Interpolate template strings with payload data
   * Example: "Hello {{name}}" + {name: "John"} => "Hello John"
   */
  private interpolate(template: string, data: Record<string, any>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
      return data[key] !== undefined ? String(data[key]) : '';
    });
  }
}

export const automationProcessor = new AutomationProcessorService();
