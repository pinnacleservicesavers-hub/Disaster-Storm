import { BaseTool, ToolResult } from './BaseTool';
import Stripe from 'stripe';

export class StripePaymentTool extends BaseTool {
  name = 'stripe_payment';
  description = 'Process payments and create checkout sessions';
  
  private stripe: Stripe | null = null;
  
  constructor() {
    super();
    if (process.env.STRIPE_SECRET_KEY) {
      this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: '2025-08-27.basil',
      });
    }
  }
  
  async execute(params: {
    action: 'create_checkout' | 'retrieve_session' | 'create_refund';
    amount?: number;
    userId?: string;
    sessionId?: string;
    paymentIntentId?: string;
  }): Promise<ToolResult> {
    try {
      if (!this.stripe) {
        return this.failure('Stripe not configured');
      }
      
      if (params.action === 'create_checkout') {
        const session = await this.stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          line_items: [{
            price_data: {
              currency: 'usd',
              product_data: { name: 'Service Payment' },
              unit_amount: params.amount!,
            },
            quantity: 1,
          }],
          mode: 'payment',
          metadata: { userId: params.userId! }
        });
        
        return this.success({ sessionId: session.id, url: session.url });
      }
      
      if (params.action === 'retrieve_session') {
        const session = await this.stripe.checkout.sessions.retrieve(params.sessionId!);
        return this.success({ session });
      }
      
      if (params.action === 'create_refund') {
        const refund = await this.stripe.refunds.create({
          payment_intent: params.paymentIntentId!
        });
        return this.success({ refund });
      }
      
      return this.failure('Unknown action');
    } catch (error: any) {
      return this.failure(`Stripe error: ${error.message}`);
    }
  }
}
