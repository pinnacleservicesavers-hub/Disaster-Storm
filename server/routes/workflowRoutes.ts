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
import { requireAuth, requireRole, verifyOwnership, AuthRequest } from '../middleware/auth';

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

    // Set session
    const session = (req as any).session;
    if (session) {
      session.userId = user.id;
      session.userRole = user.role;
    }

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

// ===== CONTRACTOR PROFILE ROUTES =====

// POST /contractor/profile
router.post('/contractor/profile', async (req, res) => {
  try {
    const data = insertContractorProfileSchema.parse(req.body);
    
    // Check if profile exists
    const [existing] = await db.select()
      .from(contractorProfiles)
      .where(eq(contractorProfiles.userId, data.userId))
      .limit(1);
    
    if (existing) {
      // Update existing profile
      const [updated] = await db.update(contractorProfiles)
        .set(data)
        .where(eq(contractorProfiles.userId, data.userId))
        .returning();
      return res.json(updated);
    } else {
      // Create new profile
      const [created] = await db.insert(contractorProfiles)
        .values(data)
        .returning();
      return res.json(created);
    }
  } catch (error: any) {
    console.error('Contractor profile error:', error);
    res.status(400).json({ error: error.message });
  }
});

// GET /contractor/profile/:userId
router.get('/contractor/profile/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const [profile] = await db.select()
      .from(contractorProfiles)
      .where(eq(contractorProfiles.userId, userId))
      .limit(1);
    
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    
    res.json(profile);
  } catch (error: any) {
    console.error('Get profile error:', error);
    res.status(400).json({ error: error.message });
  }
});

// POST /contractor/contracts/validate
router.post('/contractor/contracts/validate', async (req, res) => {
  try {
    const validateSchema = z.object({
      state: z.string().length(2), // Two-letter state code
      aobRequired: z.boolean().optional()
    });
    
    const data = validateSchema.parse(req.body);
    
    // State-specific contract requirements
    const stateRules: Record<string, any> = {
      'FL': {
        aobAllowed: true,
        aobRestrictions: 'Assignment of Benefits (AOB) allowed with consumer protections',
        requiredClauses: ['Right to cancel within 3 days', 'Disclosure of AOB terms'],
        licenseRequired: true
      },
      'TX': {
        aobAllowed: false,
        aobRestrictions: 'Assignment of Benefits prohibited for property damage claims',
        requiredClauses: ['Right to cancel', 'Payment terms'],
        licenseRequired: true
      },
      'CA': {
        aobAllowed: true,
        aobRestrictions: 'Limited AOB allowed - requires explicit homeowner consent',
        requiredClauses: ['Right to cancel within 3 days', 'Itemized estimate', 'Notice of completion'],
        licenseRequired: true
      }
    };
    
    const rules = stateRules[data.state] || {
      aobAllowed: true,
      aobRestrictions: 'Check state-specific regulations',
      requiredClauses: ['Scope of work', 'Payment terms', 'Right to cancel'],
      licenseRequired: true
    };
    
    res.json({
      state: data.state,
      validation: rules,
      compliant: data.aobRequired ? rules.aobAllowed : true
    });
  } catch (error: any) {
    console.error('Contract validation error:', error);
    res.status(400).json({ error: error.message });
  }
});

// POST /contractor/contracts/generate
router.post('/contractor/contracts/generate', async (req, res) => {
  try {
    const generateSchema = z.object({
      jobId: z.string(),
      state: z.string().length(2),
      aobIncluded: z.boolean().default(false),
      customClauses: z.array(z.string()).optional()
    });
    
    const data = generateSchema.parse(req.body);
    
    // Generate contract template based on state
    const contractTemplate = `
PROPERTY RESTORATION SERVICE AGREEMENT

State: ${data.state}
Date: ${new Date().toLocaleDateString()}

This agreement is entered into between the Contractor and the Property Owner for restoration services at the specified property.

SCOPE OF WORK:
[To be completed based on job scope]

${data.aobIncluded ? `
ASSIGNMENT OF BENEFITS (AOB):
The Property Owner hereby assigns all insurance benefits and rights of recovery to the Contractor for work performed under this agreement. The Contractor is authorized to:
- File claims directly with the insurance company
- Receive payments directly from the insurance company
- Negotiate claim settlements on behalf of the Property Owner

The Property Owner retains the right to cancel this assignment within 3 business days of signing.
` : ''}

PAYMENT TERMS:
Payment due upon completion of work or as agreed upon with insurance company.

RIGHT TO CANCEL:
The Property Owner has the right to cancel this contract within 3 business days of signing by providing written notice to the Contractor.

${data.customClauses?.map(clause => `\n${clause}`).join('') || ''}

SIGNATURES:
Contractor: _________________________  Date: __________
Property Owner: _____________________  Date: __________
`.trim();

    // Save contract to database
    const [contract] = await db.insert(contracts)
      .values({
        jobId: data.jobId,
        aiContract: contractTemplate,
        aobIncluded: data.aobIncluded,
        state: data.state
      } as any)
      .returning();
    
    res.json({
      contractId: contract.id,
      template: contractTemplate,
      requiresSignature: true
    });
  } catch (error: any) {
    console.error('Contract generation error:', error);
    res.status(400).json({ error: error.message });
  }
});

// ===== PROPERTY ROUTES =====

// POST /properties
router.post('/properties', async (req, res) => {
  try {
    const data = insertPropertySchema.parse(req.body);
    
    const [property] = await db.insert(properties)
      .values(data)
      .returning();
    
    res.status(201).json(property);
  } catch (error: any) {
    console.error('Create property error:', error);
    res.status(400).json({ error: error.message });
  }
});

// GET /properties/:id
router.get('/properties/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [property] = await db.select()
      .from(properties)
      .where(eq(properties.id, id))
      .limit(1);
    
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }
    
    res.json(property);
  } catch (error: any) {
    console.error('Get property error:', error);
    res.status(400).json({ error: error.message });
  }
});

// ===== JOB ROUTES =====

// POST /jobs
router.post('/jobs', async (req, res) => {
  try {
    const data = insertJobSchema.parse(req.body);
    
    const [job] = await db.insert(jobs)
      .values(data)
      .returning();
    
    res.status(201).json(job);
  } catch (error: any) {
    console.error('Create job error:', error);
    res.status(400).json({ error: error.message });
  }
});

// GET /jobs/:id
router.get('/jobs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [job] = await db.select()
      .from(jobs)
      .where(eq(jobs.id, id))
      .limit(1);
    
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    res.json(job);
  } catch (error: any) {
    console.error('Get job error:', error);
    res.status(400).json({ error: error.message });
  }
});

// PATCH /jobs/:id/status
router.patch('/jobs/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const updateSchema = z.object({
      status: z.enum(['lead', 'in_progress', 'complete', 'invoiced', 'paid'])
    });
    
    const data = updateSchema.parse(req.body);
    
    const [job] = await db.update(jobs)
      .set({ status: data.status, updatedAt: new Date() })
      .where(eq(jobs.id, id))
      .returning();
    
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    res.json(job);
  } catch (error: any) {
    console.error('Update job status error:', error);
    res.status(400).json({ error: error.message });
  }
});

// POST /jobs/:id/media
router.post('/jobs/:id/media', async (req, res) => {
  try {
    const { id } = req.params;
    const mediaSchema = insertMediaAssetSchema.extend({
      jobId: z.string().optional()
    });
    
    const data = mediaSchema.parse({ ...req.body, jobId: id });
    
    const [media] = await db.insert(mediaAssets)
      .values(data)
      .returning();
    
    res.status(201).json(media);
  } catch (error: any) {
    console.error('Upload media error:', error);
    res.status(400).json({ error: error.message });
  }
});

// GET /jobs/:id/media
router.get('/jobs/:id/media', async (req, res) => {
  try {
    const { id } = req.params;
    
    const media = await db.select()
      .from(mediaAssets)
      .where(eq(mediaAssets.jobId, id));
    
    res.json(media);
  } catch (error: any) {
    console.error('Get media error:', error);
    res.status(400).json({ error: error.message });
  }
});

// POST /jobs/:id/analyze
router.post('/jobs/:id/analyze', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get job media for analysis
    const media = await db.select()
      .from(mediaAssets)
      .where(eq(mediaAssets.jobId, id));
    
    if (media.length === 0) {
      return res.status(400).json({ error: 'No media found for analysis' });
    }
    
    // AI analysis simulation (in production, this would call Anthropic Claude or similar)
    const analysis = {
      damageType: 'roof_damage',
      severity: 'moderate',
      estimatedCost: Math.floor(Math.random() * 10000) + 5000,
      recommendations: [
        'Replace damaged shingles',
        'Repair fascia boards',
        'Check for water intrusion'
      ],
      confidence: 0.87,
      mediaAnalyzed: media.length
    };
    
    res.json(analysis);
  } catch (error: any) {
    console.error('Analyze job error:', error);
    res.status(400).json({ error: error.message });
  }
});

// ===== INVOICE ROUTES =====

// POST /jobs/:id/invoice
router.post('/jobs/:id/invoice', async (req, res) => {
  try {
    const { id } = req.params;
    const invoiceSchema = insertJobInvoiceSchema.extend({
      jobId: z.string().optional()
    });
    
    const data = invoiceSchema.parse({ ...req.body, jobId: id });
    
    const [invoice] = await db.insert(jobInvoices)
      .values(data)
      .returning();
    
    res.status(201).json(invoice);
  } catch (error: any) {
    console.error('Create invoice error:', error);
    res.status(400).json({ error: error.message });
  }
});

// GET /invoices/:id
router.get('/invoices/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [invoice] = await db.select()
      .from(jobInvoices)
      .where(eq(jobInvoices.id, id))
      .limit(1);
    
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    
    res.json(invoice);
  } catch (error: any) {
    console.error('Get invoice error:', error);
    res.status(400).json({ error: error.message });
  }
});

// PATCH /invoices/:id/status
router.patch('/invoices/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const updateSchema = z.object({
      status: z.enum(['draft', 'sent', 'disputed', 'approved', 'paid'])
    });
    
    const data = updateSchema.parse(req.body);
    
    const [invoice] = await db.update(jobInvoices)
      .set({ status: data.status, updatedAt: new Date() })
      .where(eq(jobInvoices.id, id))
      .returning();
    
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    
    res.json(invoice);
  } catch (error: any) {
    console.error('Update invoice status error:', error);
    res.status(400).json({ error: error.message });
  }
});

// POST /invoices/:id/submit
router.post('/invoices/:id/submit', async (req, res) => {
  try {
    const { id } = req.params;
    const submitSchema = z.object({
      insuranceCompany: z.string(),
      policyNumber: z.string(),
      claimNumber: z.string().optional()
    });
    
    const data = submitSchema.parse(req.body);
    
    // Update invoice to 'sent' status
    const [invoice] = await db.update(jobInvoices)
      .set({ status: 'sent', updatedAt: new Date() })
      .where(eq(jobInvoices.id, id))
      .returning();
    
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    
    res.json({
      success: true,
      invoice,
      submissionDetails: data
    });
  } catch (error: any) {
    console.error('Submit invoice error:', error);
    res.status(400).json({ error: error.message });
  }
});

// POST /invoices/:id/negotiate
router.post('/invoices/:id/negotiate', async (req, res) => {
  try {
    const { id } = req.params;
    const negotiateSchema = z.object({
      insurerOffer: z.number(),
      reason: z.string().optional()
    });
    
    const data = negotiateSchema.parse(req.body);
    
    const [invoice] = await db.select()
      .from(jobInvoices)
      .where(eq(jobInvoices.id, id))
      .limit(1);
    
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    
    // AI-powered negotiation response (simulation)
    const rebuttalAmount = Math.floor(invoice.amountCents * 0.95); // Request 95% of original
    const rebuttal = {
      counterOffer: rebuttalAmount,
      justification: `Based on market comparables and actual damage assessment, our requested amount of $${(invoice.amountCents / 100).toFixed(2)} is justified. Insurer's offer of $${(data.insurerOffer / 100).toFixed(2)} represents only ${((data.insurerOffer / invoice.amountCents) * 100).toFixed(1)}% of documented costs. We counter with $${(rebuttalAmount / 100).toFixed(2)}.`,
      supportingEvidence: [
        'Xactimate comparable data',
        'State average pricing',
        'OSHA/ANSI compliance documentation'
      ],
      generatedAt: new Date()
    };
    
    // Add to rebuttal history
    const rebuttalHistory = invoice.rebuttalHistory as any[] || [];
    rebuttalHistory.push({
      insurerOffer: data.insurerOffer,
      counterOffer: rebuttalAmount,
      reason: data.reason,
      timestamp: new Date()
    });
    
    const [updated] = await db.update(jobInvoices)
      .set({ 
        status: 'disputed',
        rebuttalHistory: rebuttalHistory as any,
        updatedAt: new Date()
      })
      .where(eq(jobInvoices.id, id))
      .returning();
    
    res.json({
      rebuttal,
      updatedInvoice: updated
    });
  } catch (error: any) {
    console.error('Negotiate invoice error:', error);
    res.status(400).json({ error: error.message });
  }
});

// POST /invoices/:id/comparables
router.post('/invoices/:id/comparables', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [invoice] = await db.select()
      .from(jobInvoices)
      .where(eq(jobInvoices.id, id))
      .limit(1);
    
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    
    // AI-generated comparables (simulation)
    const comparables = {
      trueCost: {
        labor: Math.floor(invoice.amountCents * 0.45),
        materials: Math.floor(invoice.amountCents * 0.35),
        equipment: Math.floor(invoice.amountCents * 0.15),
        overhead: Math.floor(invoice.amountCents * 0.05),
        total: invoice.amountCents
      },
      xactimateCost: {
        labor: Math.floor(invoice.amountCents * 0.40),
        materials: Math.floor(invoice.amountCents * 0.30),
        equipment: Math.floor(invoice.amountCents * 0.10),
        overhead: Math.floor(invoice.amountCents * 0.05),
        total: Math.floor(invoice.amountCents * 0.85)
      },
      delta: Math.floor(invoice.amountCents * 0.15),
      marketJustification: 'Emergency storm response pricing, OSHA compliance, 24hr availability'
    };
    
    // Update invoice with comparables
    await db.update(jobInvoices)
      .set({
        comparableTrue: comparables.trueCost as any,
        comparableXactimate: comparables.xactimateCost as any,
        updatedAt: new Date()
      })
      .where(eq(jobInvoices.id, id));
    
    res.json(comparables);
  } catch (error: any) {
    console.error('Generate comparables error:', error);
    res.status(400).json({ error: error.message });
  }
});

// POST /jobs/:id/contract/sign
router.post('/jobs/:id/contract/sign', async (req, res) => {
  try {
    const { id } = req.params;
    const signSchema = z.object({
      contractId: z.string(),
      signature: z.string(),
      signedBy: z.enum(['homeowner', 'contractor'])
    });
    
    const data = signSchema.parse(req.body);
    
    const updateData: any = {
      updatedAt: new Date()
    };
    
    if (data.signedBy === 'homeowner') {
      updateData.signedByHomeowner = true;
      updateData.signedAt = new Date();
    }
    
    const [contract] = await db.update(contracts)
      .set(updateData)
      .where(eq(contracts.id, data.contractId))
      .returning();
    
    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }
    
    res.json({
      success: true,
      contract,
      message: `Contract signed by ${data.signedBy}`
    });
  } catch (error: any) {
    console.error('Sign contract error:', error);
    res.status(400).json({ error: error.message });
  }
});

export default router;
