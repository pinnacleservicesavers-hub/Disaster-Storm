import { db } from '../db';
import { aiLeads } from '@shared/schema';
import { lt, and, eq, sql } from 'drizzle-orm';
import { sendBulkReminders } from './outreachService';

export async function reengageStaleLeads(): Promise<{
  scanned: number;
  reminded: number;
  failed: number;
}> {
  console.log('🔄 Running AI Lead Re-engagement Job...');

  // Find leads that haven't been contacted in 48+ hours and are still new/contacted
  const staleLeads = await db
    .select()
    .from(aiLeads)
    .where(
      and(
        sql`${aiLeads.status} IN ('new', 'contacted')`,
        sql`${aiLeads.lastContactedAt} < NOW() - INTERVAL '48 hours' OR ${aiLeads.lastContactedAt} IS NULL`,
        sql`${aiLeads.contactAttempts} < 5` // Max 5 attempts
      )
    );

  console.log(`📊 Found ${staleLeads.length} stale leads to re-engage`);

  if (staleLeads.length === 0) {
    return { scanned: 0, reminded: 0, failed: 0 };
  }

  const leadIds = staleLeads.map((lead) => lead.id);
  const result = await sendBulkReminders(leadIds);

  console.log(`✅ Re-engagement complete: ${result.sent} sent, ${result.failed} failed`);

  return {
    scanned: staleLeads.length,
    reminded: result.sent,
    failed: result.failed,
  };
}

export async function promoteExpiredTier1(): Promise<number> {
  console.log('🔄 Checking for expired Tier 1 assignments...');

  // This would check for expired Tier 1 assignments and promote Tier 2
  // Implementation depends on contractorRouter service

  return 0;
}
