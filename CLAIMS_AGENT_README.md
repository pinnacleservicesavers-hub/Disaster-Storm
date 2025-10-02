# Claims Agent - Voice-Powered Claims Intake System

## Overview
The Claims Agent is an AI-powered voice system that handles phone-based claims intake, sends claim packets to adjusters, and automates follow-up communications using top-tier voice synthesis.

## Features

### 🎙️ Voice Intake (Twilio + ElevenLabs)
- **Automated IVR** collects claim information over the phone
- **Natural voice** using ElevenLabs for professional interactions
- **Data captured**: Name, phone, address, insurance company, damage type
- Claims automatically created in database with severity classification

### 📧 Claim Packet Sending (SendGrid)
- Email claim packets to insurance adjusters
- Includes: customer info, policy details, invoice, and photo links
- Tracks email delivery with message IDs
- Logs all communications in contact log

### 🤖 Automated Follow-ups
- **48-hour email** reminder to adjuster
- **72-hour voice call** follow-up using ElevenLabs
- Intelligent scheduling based on claim activity
- Automatic escalation if no response

## System Architecture

### Voice Flow
1. Homeowner calls Twilio number → Voice intake IVR starts
2. ElevenLabs synthesizes professional voice responses
3. Twilio captures speech responses
4. System creates customer record and claim
5. Follow-up tasks scheduled automatically

### Services
- **Twilio Service** (`server/services/twilio.ts`) - Phone calls and SMS
- **SendGrid Service** (`server/services/sendgrid.ts`) - Email delivery
- **ElevenLabs Synthesis** (`server/services/elevenLabsSynthesis.ts`) - Voice TTS

### Routes
- `/api/claims-intake/*` - Voice IVR endpoints (Twilio webhooks)
- `/api/claims-packet/:id/send-packet` - Send claim packet to adjuster
- `/api/claims-agent/run` - Automated follow-up processor
- `/api/claims-webhooks/*` - Twilio webhook handlers and media serving

### Database Tables
- **customers** - Homeowner information from voice calls
- **adjusters** - Insurance adjuster contacts
- **claims** - Claim records (existing table, extended with metadata)
- **contact_log** - Communication history (calls, emails, SMS)

## Setup Instructions

### 1. Required API Keys (Add to Replit Secrets)

#### Twilio (Phone System)
```
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+1xxxxxxxxxx
```
Get from: https://console.twilio.com

#### ElevenLabs (Voice Synthesis)
```
ELEVENLABS_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
ELEVENLABS_VOICE_ID=E8qtV3izSOr5vmxy1BHV  # Your cloned voice ID
```
Get from: https://elevenlabs.io/app/voice-library

#### SendGrid (Email)
```
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
CLAIMS_FROM_EMAIL=claims@yourdomain.com
CLAIMS_FROM_NAME=Disaster Direct Claims
```
Get from: https://app.sendgrid.com/settings/api_keys

#### Base URL (for Twilio webhooks)
```
PUBLIC_BASE_URL=https://your-repl-url.repl.co
```

### 2. Configure Twilio Phone Number

In Twilio Console → Phone Numbers → Configure your number:

**Voice & Fax → A CALL COMES IN**
- Webhook: `POST`
- URL: `https://your-repl-url.repl.co/api/claims-intake/voice`

**Messaging → A MESSAGE COMES IN** (optional)
- Webhook: `POST`
- URL: `https://your-repl-url.repl.co/api/claims-webhooks/sms`

## Usage

### Voice Intake Flow

1. **Homeowner calls** your Twilio number
2. **IVR greets them**: "Hi, this is Disaster Direct Claims Assistant..."
3. **System collects**:
   - Full name
   - Phone number
   - Property address
   - Insurance company
   - Damage description
4. **Claim created** with automatic severity classification
5. **Confirmation**: "Thank you. Your claim intake is complete..."

### Send Claim Packet (API)

```bash
POST /api/claims-packet/:claimId/send-packet
```

**Body:**
```json
{
  "adjuster": {
    "name": "Jane Smith",
    "email": "jane@insurancecompany.com",
    "phone": "+15551234567"
  },
  "policy_number": "POL-123456",
  "claim_number": "CLM-789012",
  "invoice_url": "https://link-to-invoice.pdf",
  "photos_url": "https://link-to-photos-folder"
}
```

**Response:**
```json
{
  "ok": true,
  "message_id": "sg_message_id",
  "adjuster_id": "uuid"
}
```

### Automated Follow-ups

The Claims Agent runs every 60 seconds and automatically:
- Sends follow-up emails 2+ days after packet sent
- Makes follow-up calls 3+ days after packet sent
- Uses ElevenLabs voice for natural-sounding calls
- Logs all communications

## Voice Quality

### ElevenLabs Integration
- Uses `eleven_multilingual_v2` model
- Stability: 0.5, Similarity Boost: 0.8
- Synthesizes speech on-demand
- Serves MP3 files to Twilio for playback

### Voice Configuration
Set your voice ID in secrets:
```
ELEVENLABS_VOICE_ID=your_voice_id_here
```

Current voice: "Broadcast Pro Voice" (ID: E8qtV3izSOr5vmxy1BHV)

## Testing

### Test Voice Intake
1. Call your Twilio number
2. Follow the voice prompts
3. Check database for new customer and claim records

### Test Claim Packet
```bash
curl -X POST http://localhost:5000/api/claims-packet/CLAIM_ID/send-packet \
  -H "Content-Type: application/json" \
  -d '{
    "adjuster": {
      "name": "Test Adjuster",
      "email": "test@example.com",
      "phone": "+15551234567"
    },
    "invoice_url": "https://example.com/invoice.pdf",
    "photos_url": "https://example.com/photos"
  }'
```

### Monitor Agent
Watch logs for:
```
✅ Claims Agent scheduler started (runs every 60 seconds)
Claims Agent: Processed X follow-ups
```

## Compliance & Best Practices

### Call Recording
- If recording calls, implement consent disclosure
- Store consent flags in contact_log metadata

### Data Privacy
- Store minimal PII (name, address, policy number only)
- Implement data retention policies
- Secure API keys in Replit Secrets (never in code)

### Email Deliverability
- Use verified sender domain in SendGrid
- Monitor bounce rates and spam reports
- Keep unsubscribe mechanisms

## Troubleshooting

### Twilio webhook errors
- Ensure PUBLIC_BASE_URL is set correctly
- Check Twilio webhook logs in console
- Verify TwiML response format

### ElevenLabs synthesis failures
- Check API key validity
- Verify voice ID exists
- Monitor character usage limits

### Email delivery issues
- Verify SendGrid API key permissions
- Check sender email is verified
- Review SendGrid activity logs

## Architecture Notes

### Why Existing Schema?
The Claims Agent reuses the existing `claims` table and extends it with metadata fields to avoid duplication. Customer data from voice calls is stored in a dedicated `customers` table, with the customer ID stored in claim metadata.

### Scheduler Design
Simple setInterval-based scheduler runs every 60 seconds. For production, consider:
- Bull/BullMQ for job queues
- Separate worker process
- Distributed locking for multi-instance deployments

### Voice Synthesis Caching
MP3 files are generated on-demand and stored in `/tmp`. For production:
- Implement persistent storage (S3, Replit Object Storage)
- Add caching layer for common phrases
- Pre-generate frequent messages

## Next Steps

1. **Get API Keys** - Set up Twilio, ElevenLabs, SendGrid accounts
2. **Configure Secrets** - Add all required keys to Replit Secrets
3. **Set Webhook** - Configure Twilio phone number webhook URL
4. **Test Call** - Call your number and complete intake
5. **Send Packet** - Use API to send first claim packet
6. **Monitor** - Watch scheduler logs for automated follow-ups

## Support

For issues or questions:
- Check Twilio Console logs
- Review SendGrid Activity dashboard
- Monitor ElevenLabs usage dashboard
- Check server logs for errors
