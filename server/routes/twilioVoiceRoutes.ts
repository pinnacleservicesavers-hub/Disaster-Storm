import { Router, Request, Response } from 'express';
import twilio from 'twilio';

const router = Router();
const VoiceResponse = twilio.twiml.VoiceResponse;

router.post('/voice', (req: Request, res: Response) => {
  const twiml = new VoiceResponse();
  
  const gather = twiml.gather({
    input: ['speech', 'dtmf'],
    timeout: 5,
    numDigits: 1,
    action: '/api/twilio/voice/menu',
    method: 'POST',
  });
  
  gather.say({
    voice: 'Polly.Joanna',
    language: 'en-US',
  }, 'Hi, this is Rachel from Strategic Services Savers. ' +
     'Press 1 for tree emergency services. ' +
     'Press 2 for storm damage assistance. ' +
     'Press 3 to speak with a contractor. ' +
     'Or stay on the line to leave a message.');
  
  twiml.say({
    voice: 'Polly.Joanna',
  }, 'We didn\'t receive any input. Please leave a message after the beep.');
  
  twiml.record({
    maxLength: 120,
    action: '/api/twilio/voice/recording',
    transcribe: true,
    transcribeCallback: '/api/twilio/voice/transcription',
  });
  
  res.type('text/xml');
  res.send(twiml.toString());
});

router.post('/voice/menu', (req: Request, res: Response) => {
  const twiml = new VoiceResponse();
  const digits = req.body.Digits || req.body.SpeechResult;
  
  if (digits === '1' || (typeof digits === 'string' && digits.toLowerCase().includes('tree'))) {
    twiml.say({
      voice: 'Polly.Joanna',
    }, 'You selected tree emergency services. ' +
       'Our crews are available 24/7 for fallen tree removal and emergency response. ' +
       'I\'m connecting you to our dispatch team now.');
    
    twiml.dial({
      callerId: process.env.TWILIO_PHONE_NUMBER,
      timeout: 30,
    }, process.env.DISPATCH_PHONE || '+17066044820');
    
  } else if (digits === '2' || (typeof digits === 'string' && digits.toLowerCase().includes('storm'))) {
    twiml.say({
      voice: 'Polly.Joanna',
    }, 'You selected storm damage assistance. ' +
       'Our team specializes in roof repairs, water damage, and insurance claims support. ' +
       'Please leave your name, address, and a brief description of the damage after the beep.');
    
    twiml.record({
      maxLength: 180,
      action: '/api/twilio/voice/recording',
      transcribe: true,
      transcribeCallback: '/api/twilio/voice/transcription',
    });
    
  } else if (digits === '3' || (typeof digits === 'string' && digits.toLowerCase().includes('contractor'))) {
    twiml.say({
      voice: 'Polly.Joanna',
    }, 'Connecting you to a contractor specialist now. Please hold.');
    
    twiml.dial({
      callerId: process.env.TWILIO_PHONE_NUMBER,
      timeout: 30,
    }, process.env.CONTRACTOR_PHONE || '+17068408949');
    
  } else {
    twiml.say({
      voice: 'Polly.Joanna',
    }, 'I didn\'t catch that. Please leave a message with your name, phone number, and how we can help you.');
    
    twiml.record({
      maxLength: 120,
      action: '/api/twilio/voice/recording',
      transcribe: true,
      transcribeCallback: '/api/twilio/voice/transcription',
    });
  }
  
  res.type('text/xml');
  res.send(twiml.toString());
});

router.post('/voice/recording', (req: Request, res: Response) => {
  const twiml = new VoiceResponse();
  const recordingUrl = req.body.RecordingUrl;
  const callerNumber = req.body.From;
  
  console.log(`📞 New voicemail from ${callerNumber}: ${recordingUrl}`);
  
  twiml.say({
    voice: 'Polly.Joanna',
  }, 'Thank you for your message. A member of our team will call you back shortly. Goodbye!');
  
  twiml.hangup();
  
  res.type('text/xml');
  res.send(twiml.toString());
});

router.post('/voice/transcription', (req: Request, res: Response) => {
  const transcriptionText = req.body.TranscriptionText;
  const recordingUrl = req.body.RecordingUrl;
  const callerNumber = req.body.From;
  
  console.log(`📝 Voicemail transcription from ${callerNumber}:`);
  console.log(`   Text: ${transcriptionText}`);
  console.log(`   Recording: ${recordingUrl}`);
  
  res.status(200).send('OK');
});

router.post('/voice/status', (req: Request, res: Response) => {
  const callStatus = req.body.CallStatus;
  const callSid = req.body.CallSid;
  const callerNumber = req.body.From;
  
  console.log(`📞 Call status update: ${callSid} from ${callerNumber} - ${callStatus}`);
  
  res.status(200).send('OK');
});

export default router;
