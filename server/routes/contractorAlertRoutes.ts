import express from 'express';
import type { Express, Request, Response } from 'express';
import { db } from '../db';
import { weatherAlerts } from '@shared/schema';
import { eq, inArray } from 'drizzle-orm';
import { contractorBulkAlertService } from '../services/contractorBulkAlertService';

/**
 * Contractor alert routes for bulk SMS notifications
 */
export function registerContractorAlertRoutes(app: Express) {
  /**
   * POST /api/alerts/contractor/send
   * Send bulk SMS alerts to contractors about active hazards
   * 
   * Body:
   *   - hazardIds?: string[] - Specific hazard IDs to alert about (optional, defaults to all active)
   *   - dryRun?: boolean - Preview mode, doesn't actually send SMS
   *   - customMessage?: string - Override default message
   * 
   * Returns:
   *   - success: boolean
   *   - sent: number
   *   - skipped: number
   *   - failed: number
   *   - recipients: Array of contractor alert results
   *   - hazardSummary: string
   */
  app.post('/api/alerts/contractor/send', async (req: Request, res: Response) => {
    try {
      const { hazardIds, dryRun = false, customMessage } = req.body;

      console.log('📱 Processing contractor bulk alert request...');
      console.log(`   Dry run: ${dryRun}`);
      console.log(`   Hazard IDs: ${hazardIds?.length ? hazardIds.join(', ') : 'all active'}`);

      // Fetch hazards
      let hazards;
      if (hazardIds && hazardIds.length > 0) {
        hazards = await db
          .select()
          .from(weatherAlerts)
          .where(inArray(weatherAlerts.id, hazardIds));
      } else {
        hazards = await db
          .select()
          .from(weatherAlerts)
          .where(eq(weatherAlerts.isActive, true));
      }

      if (hazards.length === 0) {
        return res.json({
          success: true,
          sent: 0,
          skipped: 0,
          failed: 0,
          recipients: [],
          message: 'No active hazards found'
        });
      }

      console.log(`📊 Found ${hazards.length} active hazards`);

      // Determine affected service areas
      const affectedAreas = new Set<string>();
      const severityCounts = {
        Extreme: 0,
        Severe: 0,
        Moderate: 0,
        Minor: 0
      };

      for (const hazard of hazards) {
        // Extract service area from hazard metadata or areas
        if (hazard.hazardMetadata && typeof hazard.hazardMetadata === 'object') {
          const metadata = hazard.hazardMetadata as any;
          if (metadata.serviceAreaId) {
            affectedAreas.add(metadata.serviceAreaId);
          }
        }

        // Count by severity
        const severity = hazard.severity as keyof typeof severityCounts;
        if (severity in severityCounts) {
          severityCounts[severity]++;
        }
      }

      // Generate hazard summary
      const perilCounts: Record<string, number> = {};
      for (const hazard of hazards) {
        const peril = hazard.event || 'Unknown';
        perilCounts[peril] = (perilCounts[peril] || 0) + 1;
      }

      const perilSummary = Object.entries(perilCounts)
        .map(([peril, count]) => `${count} ${peril}`)
        .join(', ');

      const hazardSummary = `${hazards.length} active hazards detected: ${perilSummary}. ${severityCounts.Extreme > 0 ? `⚠️ ${severityCounts.Extreme} EXTREME severity` : ''}`;

      console.log(`📍 Affected areas: ${Array.from(affectedAreas).join(', ') || 'none specified'}`);
      console.log(`📊 Hazard summary: ${hazardSummary}`);

      // If no areas specified in metadata, send to all service areas
      const areasArray = affectedAreas.size > 0 
        ? Array.from(affectedAreas) 
        : ['miami-dade', 'broward', 'palm-beach', 'houston']; // Default to all service areas

      // Send bulk alerts
      const result = await contractorBulkAlertService.sendBulkAlerts({
        affectedAreas: areasArray,
        hazardSummary,
        customMessage,
        dryRun
      });

      res.json({
        ...result,
        hazardSummary,
        affectedAreas: areasArray,
        hazardCount: hazards.length
      });
    } catch (error) {
      console.error('❌ Error sending contractor alerts:', error);
      res.status(500).json({
        error: 'Failed to send contractor alerts',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * POST /api/alerts/contractor/opt-out
   * Handle opt-out requests (STOP keyword from SMS)
   * 
   * Body:
   *   - phone: string - Phone number to opt out
   * 
   * Returns:
   *   - success: boolean
   *   - message: string
   */
  app.post('/api/alerts/contractor/opt-out', async (req: Request, res: Response) => {
    try {
      const { phone } = req.body;

      if (!phone) {
        return res.status(400).json({ error: 'Phone number required' });
      }

      const success = await contractorBulkAlertService.handleOptOut(phone);

      if (success) {
        res.json({
          success: true,
          message: `Contractor ${phone} has been opted out of alerts`
        });
      } else {
        res.status(404).json({
          success: false,
          message: 'Contractor not found'
        });
      }
    } catch (error) {
      console.error('❌ Error handling opt-out:', error);
      res.status(500).json({
        error: 'Failed to process opt-out',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * GET /api/alerts/contractor/preview
   * Preview who would receive alerts for current active hazards
   * 
   * Returns:
   *   - hazardCount: number
   *   - affectedAreas: string[]
   *   - contractors: Array of contractor info
   */
  app.get('/api/alerts/contractor/preview', async (req: Request, res: Response) => {
    try {
      // Fetch all active hazards
      const hazards = await db
        .select()
        .from(weatherAlerts)
        .where(eq(weatherAlerts.isActive, true));

      // Determine affected areas
      const affectedAreas = new Set<string>();
      for (const hazard of hazards) {
        if (hazard.hazardMetadata && typeof hazard.hazardMetadata === 'object') {
          const metadata = hazard.hazardMetadata as any;
          if (metadata.serviceAreaId) {
            affectedAreas.add(metadata.serviceAreaId);
          }
        }
      }

      const areasArray = affectedAreas.size > 0 
        ? Array.from(affectedAreas)
        : ['miami-dade', 'broward', 'palm-beach', 'houston'];

      // Do a dry run to see who would get alerts
      const preview = await contractorBulkAlertService.sendBulkAlerts({
        affectedAreas: areasArray,
        hazardSummary: `${hazards.length} active hazards`,
        dryRun: true
      });

      res.json({
        hazardCount: hazards.length,
        affectedAreas: areasArray,
        contractors: preview.recipients,
        totalRecipients: preview.recipients.length
      });
    } catch (error) {
      console.error('❌ Error generating preview:', error);
      res.status(500).json({
        error: 'Failed to generate preview',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
}
