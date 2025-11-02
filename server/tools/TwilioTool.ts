import { BaseTool, ToolResult } from './BaseTool';

/**
 * Twilio SMS Tool - sends SMS alerts to contractors/homeowners
 */
export class TwilioSMSTool extends BaseTool {
  name = 'twilio_sms';
  description = 'Send SMS alerts to phone numbers';
  
  async execute(params: { to: string; message: string }): Promise<ToolResult> {
    try {
      // Check if Twilio is configured
      const twilioConfigured = !!process.env.TWILIO_ACCOUNT_SID && 
                              !!process.env.TWILIO_AUTH_TOKEN &&
                              !!process.env.TWILIO_PHONE_NUMBER;
      
      if (!twilioConfigured) {
        console.log(`[MOCK SMS] To: ${params.to}, Message: ${params.message}`);
        return this.success({
          mock: true,
          to: params.to,
          messageId: `mock-${Date.now()}`,
          status: 'sent'
        });
      }
      
      // Production Twilio implementation would go here
      const twilio = require('twilio');
      const client = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );
      
      const message = await client.messages.create({
        body: params.message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: params.to
      });
      
      return this.success({
        messageId: message.sid,
        status: message.status,
        to: params.to
      });
    } catch (error: any) {
      return this.failure(`SMS failed: ${error.message}`);
    }
  }
}
