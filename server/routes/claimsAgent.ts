import { Router } from 'express';
import { db } from '../db';
import { claims, adjusters, contactLog } from '@shared/schema';
import { eq, sql } from 'drizzle-orm';
import { makeCall } from '../services/twilio';
import { sendFollowUpEmail } from '../services/sendgrid';

const router = Router();

router.get('/run', async (_req, res) => {
  try {
    const followUpClaims = await db.query.claims.findMany({
      where: eq(claims.status, 'active'),
      limit: 10,
    }).catch(err => {
      console.log('⚠️ Claims query failed (database may not be initialized yet):', err.message);
      return [];
    });

  let processed = 0;

  for (const claim of followUpClaims) {
    try {
      const metadata = (claim.metadata as any) || {};
      
      if (!metadata.adjusterId || !metadata.packetSent) continue;

      const adjuster = await db.query.adjusters.findFirst({
        where: eq(adjusters.id, metadata.adjusterId),
      });

      if (!adjuster) continue;

      const recentLogs = await db.query.contactLog.findMany({
        where: eq(contactLog.claimId, claim.id),
      });

      const daysSincePacket = Math.floor(
        (Date.now() - new Date(claim.reportedDate!).getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysSincePacket >= 2 && !recentLogs.some(log => log.channel === 'email' && log.direction === 'out' && log.summary?.includes('Follow-up'))) {
        const html = `
          <p>Hi ${adjuster.name || 'Adjuster'},</p>
          <p>Following up on claim #${claim.claimNumber} for ${claim.claimantName} (${claim.insuranceCompany}). Please advise on payment status or next steps.</p>
          <p>Thanks,<br/>Disaster Direct Claims</p>
        `;
        
        await sendFollowUpEmail({
          toEmail: adjuster.email!,
          toName: adjuster.name || undefined,
          subject: `Follow-up: ${claim.claimantName} – ${claim.insuranceCompany}`,
          html,
        });

        await db.insert(contactLog).values({
          claimId: claim.id,
          channel: 'email',
          direction: 'out',
          toAddr: adjuster.email!,
          status: 'sent',
          summary: 'Follow-up email sent to adjuster',
        });
        
        processed++;
      }

      if (daysSincePacket >= 3 && adjuster.phone && !recentLogs.some(log => log.channel === 'call')) {
        const statusText = encodeURIComponent(
          `Hello, this is Disaster Direct following up on ${claim.claimantName}'s claim with ${claim.insuranceCompany}. ` +
          `Please return this call or reply to our email with payment status. Thank you.`
        );
        
        const baseUrl = process.env.PUBLIC_BASE_URL || `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`;
        
        await makeCall({
          to: adjuster.phone,
          twimlUrl: `${baseUrl}/api/claims-webhooks/playline?text=${statusText}`,
        });

        await db.insert(contactLog).values({
          claimId: claim.id,
          channel: 'call',
          direction: 'out',
          toAddr: adjuster.phone,
          status: 'completed',
          summary: 'Follow-up call made to adjuster',
        });
        
        processed++;
      }
    } catch (e) {
      console.error('Error processing claim:', e);
    }
  }

  res.json({ ran: processed });
  } catch (error) {
    console.error('❌ Claims agent route error:', error);
    res.status(500).json({ error: 'Claims agent processing failed', ran: 0 });
  }
});

export default router;
