/**
 * Quote/Estimate Builder Routes
 * FREE replacement for QuickBooks/FreshBooks ($15-50/month)
 * 
 * Features:
 * - Professional quote generation with templates
 * - AI-powered line item suggestions
 * - PDF export (insurance-ready format)
 * - Email delivery to customers
 * - Version tracking and change history
 * - Xactimate compatibility
 */

import { Router } from 'express';
import { db } from '../db';
import { 
  quotes, quoteLineItems, quoteTemplates, quoteVersions,
  insertQuoteSchema, insertQuoteLineItemSchema, 
  insertQuoteTemplateSchema
} from '@shared/schema';
import { eq, desc, and, sql } from 'drizzle-orm';
import { z } from 'zod';
import PDFDocument from 'pdfkit';
import { sendQuoteEmail } from '../services/sendgrid';
import { eventEmitter } from '../services/eventEmitter';

const router = Router();

// ===== QUOTE CRUD =====

// GET /api/quotes - List all quotes with filtering
router.get('/quotes', async (req, res) => {
  try {
    const { status, damageType, customerId, limit = 50 } = req.query;

    let query = db.select().from(quotes);

    if (status) {
      query = query.where(eq(quotes.status, status as string)) as any;
    }

    const results = await query
      .orderBy(desc(quotes.createdAt))
      .limit(Number(limit));

    res.json(results);
  } catch (error) {
    console.error('❌ Error fetching quotes:', error);
    res.status(500).json({ error: 'Failed to fetch quotes' });
  }
});

// GET /api/quotes/:id - Get single quote with line items
router.get('/quotes/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [quote] = await db
      .select()
      .from(quotes)
      .where(eq(quotes.id, id))
      .limit(1);

    if (!quote) {
      return res.status(404).json({ error: 'Quote not found' });
    }

    const lineItems = await db
      .select()
      .from(quoteLineItems)
      .where(eq(quoteLineItems.quoteId, id))
      .orderBy(quoteLineItems.sortOrder);

    res.json({ ...quote, lineItems });
  } catch (error) {
    console.error('❌ Error fetching quote:', error);
    res.status(500).json({ error: 'Failed to fetch quote' });
  }
});

// POST /api/quotes - Create new quote
router.post('/quotes', async (req, res) => {
  try {
    const data = insertQuoteSchema.parse(req.body);

    // Generate quote number (e.g., Q-2025-001)
    const year = new Date().getFullYear();
    const [latestQuote] = await db
      .select()
      .from(quotes)
      .where(sql`${quotes.quoteNumber} LIKE ${`Q-${year}-%`}`)
      .orderBy(desc(quotes.createdAt))
      .limit(1);

    let nextNumber = 1;
    if (latestQuote) {
      const match = latestQuote.quoteNumber.match(/Q-\d{4}-(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1]) + 1;
      }
    }

    const quoteNumber = `Q-${year}-${String(nextNumber).padStart(3, '0')}`;

    const [newQuote] = await db
      .insert(quotes)
      .values({
        ...data,
        quoteNumber,
      })
      .returning();

    // Emit QuoteCreated event for automation
    await eventEmitter.emit({
      eventType: 'QuoteCreated',
      aggregateType: 'quote',
      aggregateId: newQuote.id,
      payload: {
        quoteId: newQuote.id,
        quoteNumber: newQuote.quoteNumber,
        customerName: newQuote.customerName,
        totalAmount: newQuote.totalAmount,
      },
    });

    res.status(201).json(newQuote);
  } catch (error) {
    console.error('❌ Error creating quote:', error);
    res.status(400).json({ error: 'Failed to create quote' });
  }
});

// PATCH /api/quotes/:id - Update quote
router.patch('/quotes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Save version before updating
    const [existingQuote] = await db
      .select()
      .from(quotes)
      .where(eq(quotes.id, id))
      .limit(1);

    if (!existingQuote) {
      return res.status(404).json({ error: 'Quote not found' });
    }

    const existingLineItems = await db
      .select()
      .from(quoteLineItems)
      .where(eq(quoteLineItems.quoteId, id));

    // Create version snapshot
    await db.insert(quoteVersions).values({
      quoteId: id,
      versionNumber: existingQuote.version,
      snapshot: {
        subtotal: Number(existingQuote.subtotal),
        taxAmount: Number(existingQuote.taxAmount),
        discountAmount: Number(existingQuote.discountAmount),
        totalAmount: Number(existingQuote.totalAmount),
        lineItems: existingLineItems,
      },
      changeDescription: updates.changeDescription || 'Quote updated',
      changedBy: req.headers['x-user-id'] as string,
    });

    // Update quote with incremented version
    const [updatedQuote] = await db
      .update(quotes)
      .set({
        ...updates,
        version: existingQuote.version + 1,
        updatedAt: new Date(),
      })
      .where(eq(quotes.id, id))
      .returning();

    res.json(updatedQuote);
  } catch (error) {
    console.error('❌ Error updating quote:', error);
    res.status(400).json({ error: 'Failed to update quote' });
  }
});

// DELETE /api/quotes/:id - Delete quote
router.delete('/quotes/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await db.delete(quotes).where(eq(quotes.id, id));

    res.status(204).send();
  } catch (error) {
    console.error('❌ Error deleting quote:', error);
    res.status(500).json({ error: 'Failed to delete quote' });
  }
});

// ===== QUOTE LINE ITEMS =====

// POST /api/quotes/:id/line-items - Add line item to quote
router.post('/quotes/:id/line-items', async (req, res) => {
  try {
    const { id } = req.params;
    const data = insertQuoteLineItemSchema.parse({ ...req.body, quoteId: id });

    const [lineItem] = await db
      .insert(quoteLineItems)
      .values(data)
      .returning();

    // Recalculate quote totals
    await recalculateQuoteTotals(id);

    res.status(201).json(lineItem);
  } catch (error) {
    console.error('❌ Error adding line item:', error);
    res.status(400).json({ error: 'Failed to add line item' });
  }
});

// PATCH /api/quotes/:quoteId/line-items/:itemId - Update line item
router.patch('/quotes/:quoteId/line-items/:itemId', async (req, res) => {
  try {
    const { quoteId, itemId } = req.params;
    const updates = req.body;

    const [updatedItem] = await db
      .update(quoteLineItems)
      .set(updates)
      .where(eq(quoteLineItems.id, itemId))
      .returning();

    // Recalculate quote totals
    await recalculateQuoteTotals(quoteId);

    res.json(updatedItem);
  } catch (error) {
    console.error('❌ Error updating line item:', error);
    res.status(400).json({ error: 'Failed to update line item' });
  }
});

// DELETE /api/quotes/:quoteId/line-items/:itemId - Delete line item
router.delete('/quotes/:quoteId/line-items/:itemId', async (req, res) => {
  try {
    const { quoteId, itemId } = req.params;

    await db.delete(quoteLineItems).where(eq(quoteLineItems.id, itemId));

    // Recalculate quote totals
    await recalculateQuoteTotals(quoteId);

    res.status(204).send();
  } catch (error) {
    console.error('❌ Error deleting line item:', error);
    res.status(500).json({ error: 'Failed to delete line item' });
  }
});

// ===== QUOTE ACTIONS =====

// POST /api/quotes/:id/send - Send quote via email
router.post('/quotes/:id/send', async (req, res) => {
  try {
    const { id } = req.params;

    const [quote] = await db
      .select()
      .from(quotes)
      .where(eq(quotes.id, id))
      .limit(1);

    if (!quote) {
      return res.status(404).json({ error: 'Quote not found' });
    }

    if (!quote.customerEmail) {
      return res.status(400).json({ error: 'Customer email is required' });
    }

    // Update status to 'sent'
    await db
      .update(quotes)
      .set({
        status: 'sent',
        sentAt: new Date(),
      })
      .where(eq(quotes.id, id));

    // Send email with quote PDF
    await sendQuoteEmail({
      toEmail: quote.customerEmail,
      customerName: quote.customerName,
      quoteNumber: quote.quoteNumber,
      quoteId: id,
      totalAmount: Number(quote.totalAmount),
    });

    // Emit QuoteSent event for automation
    await eventEmitter.emit({
      eventType: 'QuoteSent',
      aggregateType: 'quote',
      aggregateId: id,
      payload: {
        quoteId: id,
        quoteNumber: quote.quoteNumber,
        customerEmail: quote.customerEmail,
        totalAmount: quote.totalAmount,
      },
    });

    res.json({ success: true, message: 'Quote sent successfully' });
  } catch (error) {
    console.error('❌ Error sending quote:', error);
    res.status(500).json({ error: 'Failed to send quote' });
  }
});

// POST /api/quotes/:id/accept - Accept quote
router.post('/quotes/:id/accept', async (req, res) => {
  try {
    const { id } = req.params;

    const [quote] = await db
      .update(quotes)
      .set({
        status: 'accepted',
        acceptedAt: new Date(),
      })
      .where(eq(quotes.id, id))
      .returning();

    // Emit QuoteAccepted event for automation
    await eventEmitter.emit({
      eventType: 'QuoteAccepted',
      aggregateType: 'quote',
      aggregateId: id,
      payload: {
        quoteId: id,
        quoteNumber: quote.quoteNumber,
        customerName: quote.customerName,
        totalAmount: quote.totalAmount,
      },
    });

    res.json(quote);
  } catch (error) {
    console.error('❌ Error accepting quote:', error);
    res.status(500).json({ error: 'Failed to accept quote' });
  }
});

// GET /api/quotes/:id/pdf - Generate PDF for quote
router.get('/quotes/:id/pdf', async (req, res) => {
  try {
    const { id } = req.params;

    const [quote] = await db
      .select()
      .from(quotes)
      .where(eq(quotes.id, id))
      .limit(1);

    if (!quote) {
      return res.status(404).json({ error: 'Quote not found' });
    }

    const lineItems = await db
      .select()
      .from(quoteLineItems)
      .where(eq(quoteLineItems.quoteId, id))
      .orderBy(quoteLineItems.sortOrder);

    // Generate PDF
    const doc = new PDFDocument({ margin: 50 });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="quote-${quote.quoteNumber}.pdf"`);
    
    doc.pipe(res);

    // Header
    doc.fontSize(24).text('QUOTE', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Quote #${quote.quoteNumber}`, { align: 'right' });
    doc.text(`Date: ${new Date(quote.createdAt).toLocaleDateString()}`, { align: 'right' });
    if (quote.expiresAt) {
      doc.text(`Expires: ${new Date(quote.expiresAt).toLocaleDateString()}`, { align: 'right' });
    }
    doc.moveDown(2);

    // Customer info
    doc.fontSize(14).text('Bill To:');
    doc.fontSize(12).text(quote.customerName);
    doc.text(quote.propertyAddress);
    if (quote.customerPhone) doc.text(quote.customerPhone);
    if (quote.customerEmail) doc.text(quote.customerEmail);
    doc.moveDown(2);

    // Title and description
    doc.fontSize(16).text(quote.title);
    if (quote.description) {
      doc.fontSize(10).text(quote.description, { width: 500 });
    }
    doc.moveDown();

    // Line items table
    doc.fontSize(12).text('Line Items:', { underline: true });
    doc.moveDown();

    const tableTop = doc.y;
    const itemX = 50;
    const qtyX = 280;
    const unitX = 330;
    const priceX = 380;
    const totalX = 480;

    // Table header
    doc.fontSize(10).text('Description', itemX, tableTop, { bold: true });
    doc.text('Qty', qtyX, tableTop);
    doc.text('Unit', unitX, tableTop);
    doc.text('Price', priceX, tableTop);
    doc.text('Total', totalX, tableTop);
    doc.moveTo(itemX, tableTop + 15).lineTo(550, tableTop + 15).stroke();

    let y = tableTop + 25;
    lineItems.forEach((item) => {
      doc.fontSize(10).text(item.description, itemX, y, { width: 220 });
      doc.text(Number(item.quantity).toFixed(2), qtyX, y);
      doc.text(item.unit, unitX, y);
      doc.text(`$${Number(item.unitPrice).toFixed(2)}`, priceX, y);
      doc.text(`$${Number(item.lineTotal).toFixed(2)}`, totalX, y);
      y += 25;
    });

    doc.moveDown(2);

    // Totals
    const totalsX = 400;
    y = doc.y;
    doc.fontSize(12).text(`Subtotal:`, totalsX, y);
    doc.text(`$${Number(quote.subtotal).toFixed(2)}`, totalX, y);
    
    if (Number(quote.discountAmount) > 0) {
      y += 20;
      doc.text(`Discount:`, totalsX, y);
      doc.text(`-$${Number(quote.discountAmount).toFixed(2)}`, totalX, y);
    }
    
    y += 20;
    doc.text(`Tax:`, totalsX, y);
    doc.text(`$${Number(quote.taxAmount).toFixed(2)}`, totalX, y);
    
    y += 20;
    doc.fontSize(14).text(`TOTAL:`, totalsX, y, { bold: true });
    doc.text(`$${Number(quote.totalAmount).toFixed(2)}`, totalX, y);

    // Terms and conditions
    if (quote.termsAndConditions) {
      doc.moveDown(3);
      doc.fontSize(10).text('Terms and Conditions:', { underline: true });
      doc.fontSize(9).text(quote.termsAndConditions, { width: 500 });
    }

    doc.end();

    // Track PDF download
    if (quote.status === 'sent' && !quote.viewedAt) {
      await db.update(quotes).set({ viewedAt: new Date() }).where(eq(quotes.id, id));
    }
  } catch (error) {
    console.error('❌ Error generating PDF:', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});

// ===== QUOTE TEMPLATES =====

// GET /api/quote-templates - List all templates
router.get('/quote-templates', async (req, res) => {
  try {
    const { damageType, isActive = true } = req.query;

    let query = db.select().from(quoteTemplates);

    if (isActive !== undefined) {
      query = query.where(eq(quoteTemplates.isActive, isActive === 'true')) as any;
    }

    const templates = await query.orderBy(desc(quoteTemplates.usageCount));

    res.json(templates);
  } catch (error) {
    console.error('❌ Error fetching templates:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

// POST /api/quote-templates - Create new template
router.post('/quote-templates', async (req, res) => {
  try {
    const data = insertQuoteTemplateSchema.parse(req.body);

    const [template] = await db
      .insert(quoteTemplates)
      .values(data)
      .returning();

    res.status(201).json(template);
  } catch (error) {
    console.error('❌ Error creating template:', error);
    res.status(400).json({ error: 'Failed to create template' });
  }
});

// POST /api/quote-templates/:id/use - Create quote from template
router.post('/quote-templates/:id/use', async (req, res) => {
  try {
    const { id } = req.params;
    const { customerName, customerEmail, customerPhone, propertyAddress } = req.body;

    const [template] = await db
      .select()
      .from(quoteTemplates)
      .where(eq(quoteTemplates.id, id))
      .limit(1);

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    // Generate quote number
    const year = new Date().getFullYear();
    const [latestQuote] = await db
      .select()
      .from(quotes)
      .where(sql`${quotes.quoteNumber} LIKE ${`Q-${year}-%`}`)
      .orderBy(desc(quotes.createdAt))
      .limit(1);

    let nextNumber = 1;
    if (latestQuote) {
      const match = latestQuote.quoteNumber.match(/Q-\d{4}-(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1]) + 1;
      }
    }

    const quoteNumber = `Q-${year}-${String(nextNumber).padStart(3, '0')}`;

    // Calculate totals from template
    const defaultLineItems = template.defaultLineItems as any[];
    const subtotal = defaultLineItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

    // Create quote
    const [newQuote] = await db
      .insert(quotes)
      .values({
        quoteNumber,
        customerName,
        customerEmail,
        customerPhone,
        propertyAddress,
        title: template.name,
        description: template.description,
        damageType: template.damageType,
        subtotal: String(subtotal),
        taxAmount: '0',
        discountAmount: '0',
        totalAmount: String(subtotal),
        templateId: template.id,
        termsAndConditions: template.defaultTerms,
        paymentTerms: template.defaultPaymentTerms,
      })
      .returning();

    // Add line items from template
    for (let i = 0; i < defaultLineItems.length; i++) {
      const item = defaultLineItems[i];
      await db.insert(quoteLineItems).values({
        quoteId: newQuote.id,
        category: item.category,
        description: item.description,
        quantity: String(item.quantity),
        unit: item.unit,
        unitPrice: String(item.unitPrice),
        lineTotal: String(item.quantity * item.unitPrice),
        laborRole: item.laborRole,
        equipmentType: item.equipmentType,
        materialType: item.materialType,
        sortOrder: i,
      });
    }

    // Update template usage
    await db
      .update(quoteTemplates)
      .set({
        usageCount: template.usageCount + 1,
        lastUsedAt: new Date(),
      })
      .where(eq(quoteTemplates.id, id));

    res.status(201).json(newQuote);
  } catch (error) {
    console.error('❌ Error using template:', error);
    res.status(400).json({ error: 'Failed to create quote from template' });
  }
});

// ===== HELPER FUNCTIONS =====

async function recalculateQuoteTotals(quoteId: string) {
  const lineItems = await db
    .select()
    .from(quoteLineItems)
    .where(eq(quoteLineItems.quoteId, quoteId));

  const subtotal = lineItems.reduce((sum, item) => sum + Number(item.lineTotal), 0);

  const [quote] = await db
    .select()
    .from(quotes)
    .where(eq(quotes.id, quoteId))
    .limit(1);

  const taxRate = Number(quote.taxRate) || 0;
  const discountAmount = Number(quote.discountAmount) || 0;
  const taxAmount = (subtotal - discountAmount) * taxRate;
  const totalAmount = subtotal - discountAmount + taxAmount;

  await db
    .update(quotes)
    .set({
      subtotal: String(subtotal),
      taxAmount: String(taxAmount),
      totalAmount: String(totalAmount),
      updatedAt: new Date(),
    })
    .where(eq(quotes.id, quoteId));
}

export default router;
