import sgMail from '@sendgrid/mail';

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const CLAIMS_FROM_EMAIL = process.env.CLAIMS_FROM_EMAIL || 'claims@disaster-direct.com';
const CLAIMS_FROM_NAME = process.env.CLAIMS_FROM_NAME || 'Disaster Direct Claims';

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

export interface SendClaimPacketOptions {
  toEmail: string;
  toName?: string;
  subject: string;
  html: string;
  attachments?: {
    filename: string;
    type: string;
    content: string;
  }[];
}

export async function sendClaimPacket(options: SendClaimPacketOptions) {
  if (!SENDGRID_API_KEY) {
    throw new Error('SendGrid API key not configured');
  }

  const msg = {
    to: {
      email: options.toEmail,
      name: options.toName,
    },
    from: {
      email: CLAIMS_FROM_EMAIL,
      name: CLAIMS_FROM_NAME,
    },
    subject: options.subject,
    html: options.html,
    attachments: options.attachments,
  };

  const response = await sgMail.send(msg as any);
  
  const messageId = response[0]?.headers?.['x-message-id'] || 
                    response[0]?.headers?.['x-message-id'.toLowerCase()];
  
  return messageId;
}

export async function sendFollowUpEmail(options: {
  toEmail: string;
  toName?: string;
  subject: string;
  html: string;
}) {
  if (!SENDGRID_API_KEY) {
    throw new Error('SendGrid API key not configured');
  }

  const msg = {
    to: {
      email: options.toEmail,
      name: options.toName,
    },
    from: {
      email: CLAIMS_FROM_EMAIL,
      name: CLAIMS_FROM_NAME,
    },
    subject: options.subject,
    html: options.html,
  };

  const response = await sgMail.send(msg as any);
  
  const messageId = response[0]?.headers?.['x-message-id'] || 
                    response[0]?.headers?.['x-message-id'.toLowerCase()];
  
  return messageId;
}
