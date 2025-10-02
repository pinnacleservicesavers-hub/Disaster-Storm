import { Router } from 'express';
import { db } from '../db';
import { claims, customers } from '@shared/schema';

const router = Router();

router.post('/voice', async (req, res) => {
  const twiml = `
    <Response>
      <Gather input="speech" action="/api/claims-intake/step1" method="POST" timeout="6">
        <Say>Hi, this is Disaster Direct Claims Assistant. Please say your full name after the beep.</Say>
      </Gather>
      <Say>Sorry, I didn't catch that.</Say>
      <Redirect>/api/claims-intake/voice</Redirect>
    </Response>`;
  res.type('text/xml').send(twiml);
});

router.post('/step1', async (req, res) => {
  const name = req.body.SpeechResult || 'Unknown';
  const twiml = `
    <Response>
      <Gather input="speech" action="/api/claims-intake/step2?name=${encodeURIComponent(name)}" method="POST" timeout="6">
        <Say>Thanks, ${name}. Please say your phone number slowly.</Say>
      </Gather>
      <Say>Sorry, I didn't catch that.</Say>
      <Redirect>/api/claims-intake/voice</Redirect>
    </Response>`;
  res.type('text/xml').send(twiml);
});

router.post('/step2', async (req, res) => {
  const { name } = req.query as any;
  const phone = req.body.SpeechResult || req.body.From || '';
  const twiml = `
    <Response>
      <Gather input="speech" action="/api/claims-intake/step3?name=${encodeURIComponent(name)}&phone=${encodeURIComponent(phone)}" method="POST" timeout="8">
        <Say>Please say your full street address, city, and state.</Say>
      </Gather>
      <Say>Sorry, I didn't catch that.</Say>
      <Redirect>/api/claims-intake/voice</Redirect>
    </Response>`;
  res.type('text/xml').send(twiml);
});

router.post('/step3', async (req, res) => {
  const { name, phone } = req.query as any;
  const address = req.body.SpeechResult || '';
  const twiml = `
    <Response>
      <Gather input="speech" action="/api/claims-intake/step4?name=${encodeURIComponent(name)}&phone=${encodeURIComponent(phone)}&address=${encodeURIComponent(address)}" method="POST" timeout="8">
        <Say>What insurance company? For example, State Farm, USAA, or Allstate.</Say>
      </Gather>
      <Say>Sorry, I didn't catch that.</Say>
      <Redirect>/api/claims-intake/voice</Redirect>
    </Response>`;
  res.type('text/xml').send(twiml);
});

router.post('/step4', async (req, res) => {
  const { name, phone, address } = req.query as any;
  const insurer = req.body.SpeechResult || '';
  const twiml = `
    <Response>
      <Gather input="speech" action="/api/claims-intake/finish?name=${encodeURIComponent(name)}&phone=${encodeURIComponent(phone)}&address=${encodeURIComponent(address)}&insurer=${encodeURIComponent(insurer)}" method="POST" timeout="8">
        <Say>Briefly describe the damage. For example, tree on home, or tree on shed.</Say>
      </Gather>
      <Say>Sorry, I didn't catch that.</Say>
      <Redirect>/api/claims-intake/voice</Redirect>
    </Response>`;
  res.type('text/xml').send(twiml);
});

router.post('/finish', async (req, res) => {
  const { name, phone, address, insurer } = req.query as any;
  const damageType = (req.body.SpeechResult || '').toLowerCase();
  
  const severity = /(tree on home|house)/.test(damageType) ? 'urgent' : 'normal';
  const claimNumber = `VOICE-${Date.now()}`;
  
  const [customer] = await db.insert(customers).values({
    name: name || 'Unknown',
    phone: phone || '',
    address: address || '',
  }).returning();

  await db.insert(claims).values({
    claimNumber,
    claimantName: name || 'Unknown',
    insuranceCompany: insurer || 'Unknown',
    propertyAddress: address || 'Unknown',
    damageType: damageType || 'General damage',
    incidentDate: new Date(),
    state: 'Unknown',
    status: 'active',
    metadata: {
      source: 'voice_intake',
      customerId: customer.id,
      phone: phone,
      severity,
    },
  });

  const twiml = `
    <Response>
      <Say>Thank you. Your claim intake is complete. Our team will email your insurance company and follow up. Goodbye.</Say>
      <Hangup/>
    </Response>`;
  res.type('text/xml').send(twiml);
});

export default router;
