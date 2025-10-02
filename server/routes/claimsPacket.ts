import { Router } from 'express';
import { db } from '../db';
import { claims, adjusters, contactLog } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { sendClaimPacket } from '../services/sendgrid';

const router = Router();

router.post('/:id/send-packet', async (req, res) => {
  const claimId = req.params.id;

  const claim = await db.query.claims.findFirst({
    where: eq(claims.id, claimId),
  });

  if (!claim) {
    return res.status(404).json({ error: 'Claim not found' });
  }

  const metadata = (claim.metadata as any) || {};
  const customerPhone = metadata.phone || '';

  const adjPayload = req.body.adjuster || {};
  
  const [adjuster] = await db.insert(adjusters).values({
    name: adjPayload.name,
    email: adjPayload.email,
    phone: adjPayload.phone,
    carrier: claim.insuranceCompany,
  }).returning();

  await db.update(claims)
    .set({
      policyNumber: req.body.policy_number || claim.policyNumber,
      metadata: {
        ...metadata,
        adjusterId: adjuster.id,
        invoiceUrl: req.body.invoice_url,
        photosUrl: req.body.photos_url,
        packetSent: true,
      },
    })
    .where(eq(claims.id, claimId));

  const html = `
    <p>Dear ${adjuster.name || 'Adjuster'},</p>
    <p>Please find the claim packet for the insured below:</p>
    <ul>
      <li><b>Name:</b> ${claim.claimantName}</li>
      <li><b>Phone:</b> ${customerPhone}</li>
      <li><b>Address:</b> ${claim.propertyAddress}</li>
      <li><b>Insurer:</b> ${claim.insuranceCompany}</li>
      <li><b>Policy #:</b> ${req.body.policy_number || claim.policyNumber || '(pending)'}</li>
      <li><b>Claim #:</b> ${claim.claimNumber}</li>
      <li><b>Invoice:</b> <a href="${req.body.invoice_url}">View Invoice</a></li>
      <li><b>Photos:</b> <a href="${req.body.photos_url}">View Photos</a></li>
    </ul>
    <p>Please confirm receipt and advise on payment or next steps.</p>
    <p>Thank you,<br/>Disaster Direct Claims</p>
  `;

  const msgId = await sendClaimPacket({
    toEmail: adjuster.email!,
    toName: adjuster.name || undefined,
    subject: `Claim Packet – ${claim.claimantName} – ${claim.insuranceCompany}`,
    html,
  });

  await db.insert(contactLog).values({
    claimId: claim.id,
    channel: 'email',
    direction: 'out',
    toAddr: adjuster.email!,
    status: 'sent',
    summary: 'Claim packet sent to adjuster',
    meta: { messageId: msgId },
  });

  res.json({ ok: true, message_id: msgId, adjuster_id: adjuster.id });
});

export default router;
