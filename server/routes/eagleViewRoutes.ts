import type { Express, Request, Response } from "express";
import { eagleViewService, type PropertyLocation } from "../services/eagleViewService";

export function registerEagleViewRoutes(app: Express) {
  // Get aerial imagery for a property
  app.post('/api/eagleview/imagery', async (req: Request, res: Response) => {
    try {
      const location: PropertyLocation = req.body;
      
      if (!location.address) {
        return res.status(400).json({ error: 'Property address is required' });
      }

      const imagery = await eagleViewService.getAerialImagery(location);
      res.json(imagery);
    } catch (error) {
      console.error('Error fetching aerial imagery:', error);
      res.status(500).json({ error: 'Failed to fetch aerial imagery' });
    }
  });

  // Get roof measurements for a property
  app.post('/api/eagleview/measurements', async (req: Request, res: Response) => {
    try {
      const location: PropertyLocation = req.body;
      
      if (!location.address) {
        return res.status(400).json({ error: 'Property address is required' });
      }

      const measurements = await eagleViewService.getRoofMeasurements(location);
      res.json(measurements);
    } catch (error) {
      console.error('Error fetching roof measurements:', error);
      res.status(500).json({ error: 'Failed to fetch roof measurements' });
    }
  });

  // Assess property damage
  app.post('/api/eagleview/damage-assessment', async (req: Request, res: Response) => {
    try {
      const { location, beforeDate }: { location: PropertyLocation; beforeDate?: string } = req.body;
      
      if (!location?.address) {
        return res.status(400).json({ error: 'Property address is required' });
      }

      const assessment = await eagleViewService.assessDamage(location, beforeDate);
      res.json(assessment);
    } catch (error) {
      console.error('Error assessing damage:', error);
      res.status(500).json({ error: 'Failed to assess damage' });
    }
  });

  // Generate comprehensive property report
  app.post('/api/eagleview/report', async (req: Request, res: Response) => {
    try {
      const location: PropertyLocation = req.body;
      
      if (!location.address) {
        return res.status(400).json({ error: 'Property address is required' });
      }

      const report = await eagleViewService.generatePropertyReport(location);
      res.json(report);
    } catch (error) {
      console.error('Error generating property report:', error);
      res.status(500).json({ error: 'Failed to generate property report' });
    }
  });

  console.log('🦅 EagleView aerial imagery routes registered');
}
