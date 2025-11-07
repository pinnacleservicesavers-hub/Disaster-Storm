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

export async function sendQuoteEmail(options: {
  toEmail: string;
  customerName: string;
  quoteNumber: string;
  quoteId: string;
  totalAmount: number;
}) {
  if (!SENDGRID_API_KEY) {
    console.log('📧 [DEV] Would send quote email to:', options.toEmail);
    return 'dev-mock-message-id';
  }

  const quoteUrl = `${process.env.PUBLIC_BASE_URL || 'http://localhost:5000'}/quotes/${options.quoteId}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: hsl(217, 71%, 53%);">Your Quote is Ready</h2>
      
      <p>Dear ${options.customerName},</p>
      
      <p>Thank you for your interest in our services. We've prepared a detailed quote for you:</p>
      
      <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Quote #${options.quoteNumber}</h3>
        <p style="font-size: 24px; color: hsl(217, 71%, 53%); font-weight: bold; margin: 10px 0;">
          $${options.totalAmount.toFixed(2)}
        </p>
      </div>
      
      <p>
        <a href="${quoteUrl}" 
           style="display: inline-block; background: hsl(217, 71%, 53%); color: white; 
                  padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
          View & Download Quote
        </a>
      </p>
      
      <p>This quote is valid for 30 days. If you have any questions or would like to proceed, 
         please don't hesitate to contact us.</p>
      
      <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;" />
      
      <p style="font-size: 12px; color: #666;">
        <strong>Disaster Direct</strong><br/>
        Professional Storm Damage Restoration<br/>
        Questions? Reply to this email or call us.
      </p>
    </div>
  `;

  const msg = {
    to: {
      email: options.toEmail,
      name: options.customerName,
    },
    from: {
      email: CLAIMS_FROM_EMAIL,
      name: CLAIMS_FROM_NAME,
    },
    subject: `Your Quote #${options.quoteNumber} - $${options.totalAmount.toFixed(2)}`,
    html,
  };

  const response = await sgMail.send(msg as any);
  
  const messageId = response[0]?.headers?.['x-message-id'] || 
                    response[0]?.headers?.['x-message-id'.toLowerCase()];
  
  console.log('✅ Quote email sent:', messageId);
  return messageId;
}
