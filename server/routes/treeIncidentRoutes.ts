import express from 'express';
import { db } from '../db.js';
import { treeIncidents, appNotifications, customerMitigationAuths, crewRoutes } from '../../shared/schema.js';
import { eq, desc, and, or, ilike, gte, lte, sql } from 'drizzle-orm';
import { randomUUID } from 'crypto';

const router = express.Router();

// ===== TREE INCIDENTS =====

// Get all tree incidents with filtering
router.get('/tree-incidents', async (req, res) => {
  try {
    const {
      state,
      county,
      city,
      priority,
      impactType,
      status,
      minConfidence,
      utilityContact,
      limit = '100',
      offset = '0'
    } = req.query;

    let query = db.select().from(treeIncidents);
    const conditions = [];

    if (state) conditions.push(eq(treeIncidents.state, state as string));
    if (county) conditions.push(ilike(treeIncidents.county, `%${county}%`));
    if (city) conditions.push(ilike(treeIncidents.city, `%${city}%`));
    if (priority) conditions.push(eq(treeIncidents.priority, priority as string));
    if (impactType) conditions.push(eq(treeIncidents.impactType, impactType as string));
    if (status) conditions.push(eq(treeIncidents.status, status as string));
    if (minConfidence) conditions.push(gte(treeIncidents.confidenceScore, parseInt(minConfidence as string)));
    if (utilityContact === 'true') conditions.push(eq(treeIncidents.utilityContactFlag, true));

    const incidents = await db.select()
      .from(treeIncidents)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(
        sql`CASE WHEN ${treeIncidents.priority} = 'immediate' THEN 1 
            WHEN ${treeIncidents.priority} = 'high' THEN 2 
            WHEN ${treeIncidents.priority} = 'medium' THEN 3 
            ELSE 4 END`,
        desc(treeIncidents.createdAt)
      )
      .limit(parseInt(limit as string))
      .offset(parseInt(offset as string));

    const countResult = await db.select({ count: sql<number>`count(*)` })
      .from(treeIncidents)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    res.json({
      success: true,
      incidents,
      total: Number(countResult[0]?.count || 0),
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    });
  } catch (error) {
    console.error('Error fetching tree incidents:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch tree incidents' });
  }
});

// Get incident by ID
router.get('/tree-incidents/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const incident = await db.select().from(treeIncidents).where(eq(treeIncidents.id, id)).limit(1);
    
    if (incident.length === 0) {
      return res.status(404).json({ success: false, error: 'Incident not found' });
    }

    res.json({ success: true, incident: incident[0] });
  } catch (error) {
    console.error('Error fetching incident:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch incident' });
  }
});

// Create new tree incident
router.post('/tree-incidents', async (req, res) => {
  try {
    const data = req.body;
    
    // Generate unique ID if not provided
    if (!data.uniqueId) {
      const prefix = data.city?.substring(0, 5).toUpperCase() || 'TREE';
      const count = await db.select({ count: sql<number>`count(*)` }).from(treeIncidents);
      data.uniqueId = `${prefix}-${String(Number(count[0]?.count || 0) + 1).padStart(3, '0')}`;
    }

    const [incident] = await db.insert(treeIncidents).values({
      ...data,
      id: randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();

    // Create in-app notification for new incident
    if (incident.priority === 'immediate' || incident.priority === 'high') {
      await createIncidentNotification(incident);
    }

    res.status(201).json({ success: true, incident });
  } catch (error) {
    console.error('Error creating tree incident:', error);
    res.status(500).json({ success: false, error: 'Failed to create tree incident' });
  }
});

// Update tree incident
router.patch('/tree-incidents/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const [incident] = await db.update(treeIncidents)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(treeIncidents.id, id))
      .returning();

    if (!incident) {
      return res.status(404).json({ success: false, error: 'Incident not found' });
    }

    res.json({ success: true, incident });
  } catch (error) {
    console.error('Error updating incident:', error);
    res.status(500).json({ success: false, error: 'Failed to update incident' });
  }
});

// Bulk import tree incidents (CSV/KML data)
router.post('/tree-incidents/bulk-import', async (req, res) => {
  try {
    const { incidents } = req.body;
    
    if (!Array.isArray(incidents) || incidents.length === 0) {
      return res.status(400).json({ success: false, error: 'No incidents provided' });
    }

    const created = [];
    const errors = [];

    for (const data of incidents) {
      try {
        if (!data.uniqueId) {
          const prefix = data.city?.substring(0, 5).toUpperCase() || 'TREE';
          data.uniqueId = `${prefix}-${randomUUID().substring(0, 6).toUpperCase()}`;
        }

        const [incident] = await db.insert(treeIncidents).values({
          ...data,
          id: randomUUID(),
          createdAt: new Date(),
          updatedAt: new Date()
        }).returning();

        created.push(incident);

        // Create notification for high priority incidents
        if (incident.priority === 'immediate' || incident.priority === 'high') {
          await createIncidentNotification(incident);
        }
      } catch (err) {
        errors.push({ data, error: (err as Error).message });
      }
    }

    res.json({
      success: true,
      created: created.length,
      errors: errors.length,
      incidents: created,
      errorDetails: errors
    });
  } catch (error) {
    console.error('Error bulk importing incidents:', error);
    res.status(500).json({ success: false, error: 'Failed to bulk import incidents' });
  }
});

// Get incident statistics
router.get('/tree-incidents/stats/summary', async (req, res) => {
  try {
    const stats = await db.select({
      total: sql<number>`count(*)`,
      immediate: sql<number>`sum(case when priority = 'immediate' then 1 else 0 end)`,
      high: sql<number>`sum(case when priority = 'high' then 1 else 0 end)`,
      medium: sql<number>`sum(case when priority = 'medium' then 1 else 0 end)`,
      low: sql<number>`sum(case when priority = 'low' then 1 else 0 end)`,
      utilityContacts: sql<number>`sum(case when utility_contact_flag = true then 1 else 0 end)`,
      newStatus: sql<number>`sum(case when status = 'new' then 1 else 0 end)`,
      inProgress: sql<number>`sum(case when status = 'in_progress' then 1 else 0 end)`,
      completed: sql<number>`sum(case when status = 'completed' then 1 else 0 end)`
    }).from(treeIncidents);

    res.json({ success: true, stats: stats[0] });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch stats' });
  }
});

// ===== IN-APP NOTIFICATIONS =====

// Get notifications for current user
router.get('/notifications', async (req, res) => {
  try {
    const userId = (req as any).session?.userId || null;
    const { unreadOnly, limit = '50' } = req.query;

    let conditions = [];
    
    // Get user-specific or broadcast notifications
    if (userId) {
      conditions.push(or(eq(appNotifications.userId, userId), sql`${appNotifications.userId} IS NULL`));
    }
    
    if (unreadOnly === 'true') {
      conditions.push(eq(appNotifications.isRead, false));
      conditions.push(eq(appNotifications.isDismissed, false));
    }

    const notifications = await db.select()
      .from(appNotifications)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(appNotifications.createdAt))
      .limit(parseInt(limit as string));

    const unreadCount = await db.select({ count: sql<number>`count(*)` })
      .from(appNotifications)
      .where(and(
        conditions.length > 0 ? and(...conditions) : undefined,
        eq(appNotifications.isRead, false)
      ));

    res.json({
      success: true,
      notifications,
      unreadCount: Number(unreadCount[0]?.count || 0)
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch notifications' });
  }
});

// Mark notification as read
router.patch('/notifications/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [notification] = await db.update(appNotifications)
      .set({ isRead: true, readAt: new Date() })
      .where(eq(appNotifications.id, id))
      .returning();

    res.json({ success: true, notification });
  } catch (error) {
    console.error('Error marking notification read:', error);
    res.status(500).json({ success: false, error: 'Failed to mark notification read' });
  }
});

// Mark all notifications as read
router.post('/notifications/mark-all-read', async (req, res) => {
  try {
    const userId = (req as any).session?.userId;

    await db.update(appNotifications)
      .set({ isRead: true, readAt: new Date() })
      .where(userId ? eq(appNotifications.userId, userId) : sql`1=1`);

    res.json({ success: true });
  } catch (error) {
    console.error('Error marking all notifications read:', error);
    res.status(500).json({ success: false, error: 'Failed to mark notifications read' });
  }
});

// Dismiss notification
router.patch('/notifications/:id/dismiss', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [notification] = await db.update(appNotifications)
      .set({ isDismissed: true })
      .where(eq(appNotifications.id, id))
      .returning();

    res.json({ success: true, notification });
  } catch (error) {
    console.error('Error dismissing notification:', error);
    res.status(500).json({ success: false, error: 'Failed to dismiss notification' });
  }
});

// ===== CUSTOMER MITIGATION AUTHORIZATION =====

// Get CMA by incident ID
router.get('/cma/incident/:incidentId', async (req, res) => {
  try {
    const { incidentId } = req.params;
    const cma = await db.select()
      .from(customerMitigationAuths)
      .where(eq(customerMitigationAuths.incidentId, incidentId))
      .limit(1);

    res.json({ success: true, cma: cma[0] || null });
  } catch (error) {
    console.error('Error fetching CMA:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch CMA' });
  }
});

// Create CMA for incident
router.post('/cma', async (req, res) => {
  try {
    const data = req.body;

    const [cma] = await db.insert(customerMitigationAuths).values({
      ...data,
      id: randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();

    // Update incident with CMA flag
    if (data.incidentId) {
      await db.update(treeIncidents)
        .set({ cmaGeneratedFlag: true, cmaId: cma.id })
        .where(eq(treeIncidents.id, data.incidentId));
    }

    res.status(201).json({ success: true, cma });
  } catch (error) {
    console.error('Error creating CMA:', error);
    res.status(500).json({ success: false, error: 'Failed to create CMA' });
  }
});

// Update CMA (sign, update scope, etc.)
router.patch('/cma/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const [cma] = await db.update(customerMitigationAuths)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(customerMitigationAuths.id, id))
      .returning();

    res.json({ success: true, cma });
  } catch (error) {
    console.error('Error updating CMA:', error);
    res.status(500).json({ success: false, error: 'Failed to update CMA' });
  }
});

// ===== HELPER FUNCTIONS =====

async function createIncidentNotification(incident: any) {
  try {
    const priorityEmoji = incident.priority === 'immediate' ? '🚨' : '⚠️';
    const impactLabel = incident.impactType?.replace(/_/g, ' ').toUpperCase() || 'TREE INCIDENT';

    await db.insert(appNotifications).values({
      id: randomUUID(),
      notificationType: 'tree_incident',
      priority: incident.priority === 'immediate' ? 'urgent' : 'high',
      title: `${priorityEmoji} ${incident.priority.toUpperCase()}: ${impactLabel}`,
      message: `Tree incident detected at ${incident.address}, ${incident.city}, ${incident.state}. ${incident.utilityContactFlag ? 'CAUTION: Utility lines involved!' : ''} Est. cost: $${incident.estimatedCostMin || '?'}-$${incident.estimatedCostMax || '?'}`,
      relatedType: 'tree_incident',
      relatedId: incident.id,
      actionUrl: `/tree-tracker/${incident.id}`,
      actionLabel: 'View Incident',
      state: incident.state,
      county: incident.county,
      city: incident.city,
      latitude: incident.latitude,
      longitude: incident.longitude,
      metadata: {
        uniqueId: incident.uniqueId,
        impactType: incident.impactType,
        estimatedCostMin: incident.estimatedCostMin,
        estimatedCostMax: incident.estimatedCostMax,
        confidenceScore: incident.confidenceScore
      },
      createdAt: new Date()
    });
    
    console.log(`🔔 Created notification for incident ${incident.uniqueId}`);
  } catch (error) {
    console.error('Error creating incident notification:', error);
  }
}

export default router;
