import { Router } from 'express';
import Stripe from 'stripe';
import { z } from 'zod';
import { db } from '../db';
import { 
  memberships, insertMembershipSchema,
  contractorProfiles, insertContractorProfileSchema,
  properties, insertPropertySchema,
  jobs, insertJobSchema,
  mediaAssets, insertMediaAssetSchema,
  contracts, insertContractSchema,
  jobInvoices, insertJobInvoiceSchema,
  users
} from '@shared/schema';
import { eq, and, sql } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

const router = Router();

// Check if Stripe keys are configured
const stripeConfigured = !!process.env.STRIPE_SECRET_KEY;
let stripe: Stripe | null = null;

if (stripeConfigured) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-08-27.basil',
  });
}

// ===== AUTH ROUTES =====

// POST /auth/signup
router.post('/auth/signup', async (req, res) => {
  try {
    const signupSchema = z.object({
      username: z.string().min(3),
      password: z.string().min(6),
      email: z.string().email(),
      role: z.enum(['contractor', 'homeowner', 'admin']).default('homeowner'),
      phone: z.string().optional()
    });

    const data = signupSchema.parse(req.body);

    // Check if user exists using raw SQL to avoid schema mismatch
    const checkResult = await db.execute(sql`
      SELECT id FROM users WHERE username = ${data.username} LIMIT 1
    `);

    if (checkResult.rows.length > 0) {
      return res.status(409).json({ error: 'Username already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Create user using raw SQL to avoid schema mismatch
    const result = await db.execute(sql`
      INSERT INTO users (username, password, email, role, phone)
      VALUES (${data.username}, ${hashedPassword}, ${data.email}, ${data.role}, ${data.phone || null})
      RETURNING id, username, email, role
    `);
    
    const newUser = result.rows[0] as { id: string; username: string; email: string; role: string };

    // Create contractor profile if role is contractor
    if (data.role === 'contractor') {
      await db.insert(contractorProfiles).values({
        userId: newUser.id
      });
    }

    res.status(201).json({
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
      role: newUser.role
    });
  } catch (error: any) {
    console.error('Signup error:', error);
    res.status(400).json({ error: error.message });
  }
});

// POST /auth/login
router.post('/auth/login', async (req, res) => {
  try {
    const loginSchema = z.object({
      username: z.string(),
      password: z.string()
    });

    const { username, password } = loginSchema.parse(req.body);

    // Find user using raw SQL to avoid schema mismatch
    const result = await db.execute(sql`
      SELECT id, username, password, email, role
      FROM users
      WHERE username = ${username}
      LIMIT 1
    `);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0] as { id: string; username: string; password: string; email: string; role: string };

    // Verify password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // In a real app, you'd create a session here
    // For now, return user data
    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(400).json({ error: error.message });
  }
});

// ===== MEMBERSHIP ROUTES =====

// POST /membership/checkout
router.post('/membership/checkout', async (req, res) => {
  try {
    if (!stripe) {
      return res.status(503).json({ error: 'Stripe not configured. Set STRIPE_SECRET_KEY.' });
    }

    const checkoutSchema = z.object({
      userId: z.string(),
      plan: z.enum(['one_time', 'monthly']),
      amount: z.number().positive(), // in cents
      successUrl: z.string().url().optional(),
      cancelUrl: z.string().url().optional()
    });

    const data = checkoutSchema.parse(req.body);

    // For one-time payments
    if (data.plan === 'one_time') {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Disaster Direct - One-Time Access',
            },
            unit_amount: data.amount,
          },
          quantity: 1,
        }],
        mode: 'payment',
        success_url: data.successUrl || `${req.headers.origin}/success`,
        cancel_url: data.cancelUrl || `${req.headers.origin}/cancel`,
        metadata: {
          userId: data.userId,
          plan: data.plan
        }
      });

      res.json({ sessionId: session.id, url: session.url });
    } 
    // For monthly subscriptions
    else {
      // Create or retrieve Stripe customer using raw SQL to avoid schema mismatch
      const userResult = await db.execute(sql`
        SELECT id, email FROM users WHERE id = ${data.userId} LIMIT 1
      `);
      
      if (userResult.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      const user = userResult.rows[0] as { id: string; email: string };

      const customer = await stripe.customers.create({
        email: user.email || undefined,
        metadata: { userId: data.userId }
      });

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Disaster Direct - Monthly Subscription',
            },
            unit_amount: data.amount,
            recurring: {
              interval: 'month'
            }
          },
          quantity: 1,
        }],
        mode: 'subscription',
        customer: customer.id,
        success_url: data.successUrl || `${req.headers.origin}/success`,
        cancel_url: data.cancelUrl || `${req.headers.origin}/cancel`,
        metadata: {
          userId: data.userId,
          plan: data.plan
        }
      });

      res.json({ sessionId: session.id, url: session.url });
    }
  } catch (error: any) {
    console.error('Checkout error:', error);
    res.status(400).json({ error: error.message });
  }
});

// POST /membership/webhook
router.post('/membership/webhook', async (req, res) => {
  try {
    if (!stripe) {
      return res.status(503).json({ error: 'Stripe not configured' });
    }

    const sig = req.headers['stripe-signature'] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.warn('STRIPE_WEBHOOK_SECRET not set - skipping signature verification');
      // In development, you might skip verification
    }

    let event: Stripe.Event;

    try {
      if (webhookSecret && sig) {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
      } else {
        event = req.body as Stripe.Event;
      }
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const plan = session.metadata?.plan as 'one_time' | 'monthly';

        if (!userId || !plan) {
          console.error('Missing metadata in checkout session');
          break;
        }

        // Create membership record
        const expiresAt = plan === 'monthly' 
          ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
          : undefined;

        await db.insert(memberships).values({
          userId,
          plan,
          status: 'active',
          expiresAt
        } as any);

        console.log(`✅ Membership created for user ${userId} - ${plan}`);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.userId;

        if (userId) {
          // Update membership status to canceled
          await db.update(memberships)
            .set({ status: 'canceled' })
            .where(and(
              eq(memberships.userId, userId),
              eq(memberships.plan, 'monthly')
            ));
          console.log(`❌ Subscription canceled for user ${userId}`);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    res.status(400).json({ error: error.message });
  }
});

export default router;
