import express from 'express';
import { db } from '../db';
import {
  aiLeads,
  aiLeadServices,
  aiContractors,
  aiAssignments,
  aiOutreachLog,
  insertAiLeadSchema,
  insertAiLeadServiceSchema,
  insertAiContractorSchema,
} from '@shared/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { expandLeadServices, analyzePhotosDamage } from '../services/aiLeadExpansion';
import { assignContractorsToService, handleAssignmentResponse } from '../services/contractorRouter';
import { sendLeadNotification, sendContractorAssignment, getLocalAreaCode } from '../services/outreachService';

export const aiLeadsRouter = express.Router();

// POST /api/ai-leads - Create new lead with AI expansion
aiLeadsRouter.post('/', async (req, res) => {
  try {
    const leadData = insertAiLeadSchema.parse(req.body);

    // Expand services using AI
    const expansion = await expandLeadServices(
      leadData.damageDescription || '',
      leadData.address,
      {
        customerNotes: leadData.notes,
      }
    );

    // Create lead
    const [newLead] = await db
      .insert(aiLeads)
      .values({
        ...leadData,
        aiConfidence: expansion.confidence,
        priority: expansion.priority,
        insuranceStatus: expansion.insuranceStatus,
        damageType: expansion.aiAnalysis.damageType,
        aiAnalysis: expansion.aiAnalysis,
      })
      .returning();

    // Create lead services
    const servicesCreated = [];
    for (const service of expansion.services) {
      const [leadService] = await db
        .insert(aiLeadServices)
        .values({
          aiLeadId: newLead.id,
          category: service.category,
          needed: true,
          estimatedCost: service.estimatedCost?.toString(),
          priority: service.priority,
          notes: service.reasoning,
        })
        .returning();

      servicesCreated.push(leadService);

      // Auto-assign contractors for urgent services
      if (service.urgency === 'emergency' || service.urgency === 'urgent') {
        const areaCode = getLocalAreaCode(newLead.phone);
        await assignContractorsToService(
          leadService.id,
          service.category,
          areaCode
        );
      }
    }

    // Send welcome notification
    await sendLeadNotification(newLead.id, 'welcome');

    res.json({
      lead: newLead,
      services: servicesCreated,
      aiAnalysis: expansion.aiAnalysis,
    });
  } catch (error) {
    console.error('Error creating AI lead:', error);
    res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to create lead' });
  }
});

// GET /api/ai-leads - List all leads with filters
aiLeadsRouter.get('/', async (req, res) => {
  try {
    const { status, priority, insuranceStatus } = req.query;

    // Build filter conditions
    const conditions = [];
    if (status) {
      conditions.push(eq(aiLeads.status, status as string));
    }
    if (priority) {
      conditions.push(eq(aiLeads.priority, priority as string));
    }
    if (insuranceStatus) {
      conditions.push(eq(aiLeads.insuranceStatus, insuranceStatus as string));
    }

    // Apply all filters together using and()
    let leads;
    if (conditions.length > 0) {
      leads = await db
        .select()
        .from(aiLeads)
        .where(and(...conditions))
        .orderBy(desc(aiLeads.createdAt));
    } else {
      leads = await db.select().from(aiLeads).orderBy(desc(aiLeads.createdAt));
    }

    res.json(leads);
  } catch (error) {
    console.error('Error fetching leads:', error);
    res.status(500).json({ error: 'Failed to fetch leads' });
  }
});

// GET /api/ai-leads/analytics - Comprehensive analytics dashboard
aiLeadsRouter.get('/analytics', async (req, res) => {
  try {
    // Get lead stats using raw SQL for reliability
    const leadStatsResult = await db.execute(sql`
      SELECT 
        COUNT(*)::integer as "totalLeads",
        SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END)::integer as "newLeads",
        SUM(CASE WHEN status = 'contacted' THEN 1 ELSE 0 END)::integer as "contactedLeads",
        SUM(CASE WHEN status = 'qualified' THEN 1 ELSE 0 END)::integer as "qualifiedLeads",
        SUM(CASE WHEN status = 'assigned' THEN 1 ELSE 0 END)::integer as "assignedLeads",
        SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END)::integer as "closedLeads",
        COALESCE(AVG(ai_confidence), 0)::integer as "avgConfidence",
        COALESCE(AVG(EXTRACT(EPOCH FROM (last_contacted_at - created_at))), 0)::integer as "avgResponseTime"
      FROM ai_leads
    `);
    
    const leadStats = leadStatsResult.rows[0] || {};

    // Calculate conversion rate
    const totalLeads = Number(leadStats.totalLeads) || 0;
    const closedLeads = Number(leadStats.closedLeads) || 0;
    const conversionRate = totalLeads > 0 
      ? Math.round((closedLeads / totalLeads) * 100) 
      : 0;

    // Get service breakdown
    const serviceBreakdownResult = await db.execute(sql`
      SELECT 
        category as "serviceType",
        COUNT(*)::integer as count
      FROM ai_lead_services
      WHERE needed = true
      GROUP BY category
      ORDER BY count DESC
    `);

    // Get contractor performance
    const contractorPerformanceResult = await db.execute(sql`
      SELECT 
        c.id,
        c.name,
        c.company,
        COUNT(a.id)::integer as leads,
        c.performance_score as "avgScore"
      FROM ai_contractors c
      LEFT JOIN ai_assignments a ON a.ai_contractor_id = c.id
      GROUP BY c.id, c.name, c.company, c.performance_score
      ORDER BY c.performance_score DESC
      LIMIT 10
    `);

    res.json({
      totalLeads,
      newLeads: Number(leadStats.newLeads) || 0,
      contactedLeads: Number(leadStats.contactedLeads) || 0,
      qualifiedLeads: Number(leadStats.qualifiedLeads) || 0,
      assignedLeads: Number(leadStats.assignedLeads) || 0,
      closedLeads,
      conversionRate,
      averageResponseTime: Number(leadStats.avgResponseTime) || 0,
      avgConfidence: Number(leadStats.avgConfidence) || 0,
      serviceBreakdown: serviceBreakdownResult.rows || [],
      contractorPerformance: contractorPerformanceResult.rows || [],
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// GET /api/ai-leads/:id - Get lead detail with services
aiLeadsRouter.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [lead] = await db.select().from(aiLeads).where(eq(aiLeads.id, id));

    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    const services = await db
      .select()
      .from(aiLeadServices)
      .where(eq(aiLeadServices.aiLeadId, id));

    const outreach = await db
      .select()
      .from(aiOutreachLog)
      .where(eq(aiOutreachLog.aiLeadId, id))
      .orderBy(desc(aiOutreachLog.createdAt));

    res.json({
      lead,
      services,
      outreach,
    });
  } catch (error) {
    console.error('Error fetching lead:', error);
    res.status(500).json({ error: 'Failed to fetch lead' });
  }
});

// POST /api/ai-leads/:id/services - Add new service to lead
aiLeadsRouter.post('/:id/services', async (req, res) => {
  try {
    const { id } = req.params;
    const serviceData = insertAiLeadServiceSchema.parse(req.body);

    const [newService] = await db
      .insert(aiLeadServices)
      .values({
        ...serviceData,
        aiLeadId: id,
      })
      .returning();

    res.json(newService);
  } catch (error) {
    console.error('Error creating service:', error);
    res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to create service' });
  }
});

// PATCH /api/ai-leads/:id/services/:serviceId - Update service
aiLeadsRouter.patch('/:id/services/:serviceId', async (req, res) => {
  try {
    const { serviceId } = req.params;
    const updates = req.body;

    const [updatedService] = await db
      .update(aiLeadServices)
      .set(updates)
      .where(eq(aiLeadServices.id, serviceId))
      .returning();

    res.json(updatedService);
  } catch (error) {
    console.error('Error updating service:', error);
    res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to update service' });
  }
});

// POST /api/ai-leads/:id/services/:serviceId/assign - Manually assign contractors
aiLeadsRouter.post('/:id/services/:serviceId/assign', async (req, res) => {
  try {
    const { id, serviceId } = req.params;

    const [service] = await db
      .select()
      .from(aiLeadServices)
      .where(eq(aiLeadServices.id, serviceId));

    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    const [lead] = await db.select().from(aiLeads).where(eq(aiLeads.id, id));

    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    const areaCode = getLocalAreaCode(lead.phone);
    const result = await assignContractorsToService(
      serviceId,
      service.category,
      areaCode
    );

    res.json(result);
  } catch (error) {
    console.error('Error assigning contractors:', error);
    res.status(500).json({ error: 'Failed to assign contractors' });
  }
});

// POST /api/ai-contractors - Create new contractor
aiLeadsRouter.post('/contractors', async (req, res) => {
  try {
    const contractorData = insertAiContractorSchema.parse(req.body);

    const [newContractor] = await db
      .insert(aiContractors)
      .values(contractorData)
      .returning();

    res.json(newContractor);
  } catch (error) {
    console.error('Error creating contractor:', error);
    res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to create contractor' });
  }
});

// GET /api/ai-contractors - List all contractors
aiLeadsRouter.get('/contractors', async (req, res) => {
  try {
    const { active, trade } = req.query;

    let query = db.select().from(aiContractors);

    if (active !== undefined) {
      query = query.where(eq(aiContractors.active, active === 'true')) as any;
    }

    const contractors = await query.orderBy(desc(aiContractors.performanceScore));

    res.json(contractors);
  } catch (error) {
    console.error('Error fetching contractors:', error);
    res.status(500).json({ error: 'Failed to fetch contractors' });
  }
});

// GET /api/ai-contractors/:id - Get contractor detail
aiLeadsRouter.get('/contractors/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [contractor] = await db
      .select()
      .from(aiContractors)
      .where(eq(aiContractors.id, id));

    if (!contractor) {
      return res.status(404).json({ error: 'Contractor not found' });
    }

    const assignments = await db
      .select()
      .from(aiAssignments)
      .where(eq(aiAssignments.aiContractorId, id))
      .orderBy(desc(aiAssignments.createdAt));

    res.json({
      contractor,
      assignments,
    });
  } catch (error) {
    console.error('Error fetching contractor:', error);
    res.status(500).json({ error: 'Failed to fetch contractor' });
  }
});

// POST /api/ai-assignments/:assignmentId/respond - Accept/decline assignment
aiLeadsRouter.post('/assignments/:assignmentId/respond', async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { state, responseNotes, estimatedStartDate, estimatedCost } = req.body;

    if (!['accepted', 'declined'].includes(state)) {
      return res.status(400).json({ error: 'Invalid state. Must be "accepted" or "declined"' });
    }

    await handleAssignmentResponse(
      assignmentId,
      state,
      responseNotes,
      estimatedStartDate ? new Date(estimatedStartDate) : undefined,
      estimatedCost
    );

    res.json({ success: true, message: `Assignment ${state}` });
  } catch (error) {
    console.error('Error responding to assignment:', error);
    res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to respond to assignment' });
  }
});

// GET /api/ai-assignments - Get all assignments (for contractor view)
aiLeadsRouter.get('/assignments', async (req, res) => {
  try {
    const { contractorId, state, round } = req.query;

    let query = db.select().from(aiAssignments);

    if (contractorId) {
      query = query.where(eq(aiAssignments.aiContractorId, contractorId as string)) as any;
    }
    if (state) {
      query = query.where(eq(aiAssignments.state, state as string)) as any;
    }
    if (round) {
      query = query.where(eq(aiAssignments.round, parseInt(round as string))) as any;
    }

    const assignments = await query.orderBy(desc(aiAssignments.createdAt));

    res.json(assignments);
  } catch (error) {
    console.error('Error fetching assignments:', error);
    res.status(500).json({ error: 'Failed to fetch assignments' });
  }
});

// POST /api/ai-leads/:id/analyze-photos - Analyze damage photos with AI
aiLeadsRouter.post('/:id/analyze-photos', async (req, res) => {
  try {
    const { id } = req.params;
    const { photoUrls } = req.body;

    if (!photoUrls || !Array.isArray(photoUrls)) {
      return res.status(400).json({ error: 'photoUrls array is required' });
    }

    const [lead] = await db.select().from(aiLeads).where(eq(aiLeads.id, id));

    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    const analysis = await analyzePhotosDamage(
      photoUrls,
      `Property at ${lead.address}. ${lead.damageDescription || ''}`
    );

    // Update lead with photo analysis
    const [updatedLead] = await db
      .update(aiLeads)
      .set({
        damageType: analysis.damageType,
        aiAnalysis: {
          ...(lead.aiAnalysis as any),
          photoAnalysis: analysis,
        },
      })
      .where(eq(aiLeads.id, id))
      .returning();

    res.json({
      lead: updatedLead,
      analysis,
    });
  } catch (error) {
    console.error('Error analyzing photos:', error);
    res.status(500).json({ error: 'Failed to analyze photos' });
  }
});

// GET /api/ai-leads/stats/dashboard - Analytics dashboard
aiLeadsRouter.get('/stats/dashboard', async (req, res) => {
  try {
    const stats = await db
      .select({
        totalLeads: sql<number>`COUNT(*)`,
        newLeads: sql<number>`SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END)`,
        assignedLeads: sql<number>`SUM(CASE WHEN status = 'assigned' THEN 1 ELSE 0 END)`,
        closedLeads: sql<number>`SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END)`,
        avgConfidence: sql<number>`AVG(ai_confidence)`,
      })
      .from(aiLeads);

    const contractorStats = await db
      .select({
        totalContractors: sql<number>`COUNT(*)`,
        activeContractors: sql<number>`SUM(CASE WHEN active = true THEN 1 ELSE 0 END)`,
        avgPerformance: sql<number>`AVG(performance_score)`,
      })
      .from(aiContractors);

    res.json({
      leads: stats[0],
      contractors: contractorStats[0],
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});
