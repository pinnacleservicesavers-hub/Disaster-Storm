import Twilio from 'twilio';

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

let twilioClient: ReturnType<typeof Twilio> | null = null;

function getTwilioClient() {
  if (!twilioClient) {
    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
      throw new Error('Twilio credentials not configured');
    }
    twilioClient = Twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
  }
  return twilioClient;
}

export interface MakeCallOptions {
  to: string;
  twimlUrl: string;
}

export interface SendSmsOptions {
  to: string;
  message: string;
}

export async function makeCall(options: MakeCallOptions) {
  const client = getTwilioClient();
  
  if (!TWILIO_PHONE_NUMBER) {
    throw new Error('Twilio phone number not configured');
  }

  const call = await client.calls.create({
    to: options.to,
    from: TWILIO_PHONE_NUMBER,
    url: options.twimlUrl,
  });

  return call;
}

export async function sendSms(options: SendSmsOptions) {
  const client = getTwilioClient();
  
  if (!TWILIO_PHONE_NUMBER) {
    throw new Error('Twilio phone number not configured');
  }

  const message = await client.messages.create({
    to: options.to,
    from: TWILIO_PHONE_NUMBER,
    body: options.message,
  });

  return message;
}

export function getTwilioFrom() {
  if (!TWILIO_PHONE_NUMBER) {
    throw new Error('Twilio phone number not configured');
  }
  return TWILIO_PHONE_NUMBER;
}
