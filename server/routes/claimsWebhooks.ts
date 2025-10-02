import { Router } from 'express';
import { createReadStream } from 'fs';
import { synthesizeLine } from '../services/elevenLabsSynthesis';

const router = Router();

router.post('/twilio/status', (_req, res) => {
  res.sendStatus(200);
});

router.get('/playline', async (req, res) => {
  try {
    const text = decodeURIComponent((req.query.text as string) || 'Hello from Disaster Direct');
    
    const mp3Path = await synthesizeLine(text);
    const fileName = mp3Path.split('/').pop();
    
    const baseUrl = process.env.PUBLIC_BASE_URL || `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`;
    
    const twiml = `
    <Response>
      <Play>${baseUrl}/api/claims-webhooks/media/${fileName}</Play>
      <Hangup/>
    </Response>`;
    
    res.type('text/xml').send(twiml);
  } catch (error) {
    console.error('Error synthesizing line:', error);
    const fallbackTwiml = `
    <Response>
      <Say>Hello from Disaster Direct. Please contact us for more information.</Say>
      <Hangup/>
    </Response>`;
    res.type('text/xml').send(fallbackTwiml);
  }
});

router.get('/media/:filename', (req, res) => {
  const filename = req.params.filename;
  
  if (!filename || !filename.endsWith('.mp3')) {
    return res.sendStatus(403);
  }
  
  const filePath = `/tmp/${filename}`;
  
  res.type('audio/mpeg');
  createReadStream(filePath)
    .on('error', () => {
      res.sendStatus(404);
    })
    .pipe(res);
});

export default router;
