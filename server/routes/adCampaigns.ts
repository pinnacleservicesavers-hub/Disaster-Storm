import type { Express, Request, Response } from "express";
import type { IStorage } from "../storage";
import { insertAdGeoFenceSchema, insertAdCampaignSchema, insertDeviceAudienceSchema } from "@shared/schema";

export function registerAdCampaignRoutes(app: Express, storage: IStorage) {
  // ===== GEO-FENCE ROUTES =====
  
  // Get all geo-fences
  app.get('/api/ad-campaigns/geo-fences', async (req: Request, res: Response) => {
    try {
      const fences = await storage.getAllAdGeoFences();
      res.json(fences);
    } catch (error) {
      console.error('Error fetching geo-fences:', error);
      res.status(500).json({ error: 'Failed to fetch geo-fences' });
    }
  });
  
  // Get single geo-fence
  app.get('/api/ad-campaigns/geo-fences/:id', async (req: Request, res: Response) => {
    try {
      const fence = await storage.getAdGeoFence(req.params.id);
      if (!fence) {
        return res.status(404).json({ error: 'Geo-fence not found' });
      }
      res.json(fence);
    } catch (error) {
      console.error('Error fetching geo-fence:', error);
      res.status(500).json({ error: 'Failed to fetch geo-fence' });
    }
  });
  
  // Create geo-fence
  app.post('/api/ad-campaigns/geo-fences', async (req: Request, res: Response) => {
    try {
      const validatedData = insertAdGeoFenceSchema.parse(req.body);
      const fence = await storage.createAdGeoFence(validatedData);
      res.status(201).json(fence);
    } catch (error) {
      console.error('Error creating geo-fence:', error);
      res.status(400).json({ error: 'Invalid geo-fence data', details: error });
    }
  });
  
  // Update geo-fence
  app.patch('/api/ad-campaigns/geo-fences/:id', async (req: Request, res: Response) => {
    try {
      const fence = await storage.updateAdGeoFence(req.params.id, req.body);
      res.json(fence);
    } catch (error) {
      console.error('Error updating geo-fence:', error);
      res.status(500).json({ error: 'Failed to update geo-fence' });
    }
  });
  
  // Delete geo-fence
  app.delete('/api/ad-campaigns/geo-fences/:id', async (req: Request, res: Response) => {
    try {
      const success = await storage.deleteAdGeoFence(req.params.id);
      if (!success) {
        return res.status(404).json({ error: 'Geo-fence not found' });
      }
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting geo-fence:', error);
      res.status(500).json({ error: 'Failed to delete geo-fence' });
    }
  });
  
  // ===== CAMPAIGN ROUTES =====
  
  // Get all campaigns
  app.get('/api/ad-campaigns', async (req: Request, res: Response) => {
    try {
      const campaigns = await storage.getAllAdCampaigns();
      res.json(campaigns);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      res.status(500).json({ error: 'Failed to fetch campaigns' });
    }
  });
  
  // Get single campaign
  app.get('/api/ad-campaigns/:id', async (req: Request, res: Response) => {
    try {
      const campaign = await storage.getAdCampaign(req.params.id);
      if (!campaign) {
        return res.status(404).json({ error: 'Campaign not found' });
      }
      res.json(campaign);
    } catch (error) {
      console.error('Error fetching campaign:', error);
      res.status(500).json({ error: 'Failed to fetch campaign' });
    }
  });
  
  // Get campaigns by geo-fence
  app.get('/api/ad-campaigns/geo-fence/:geoFenceId', async (req: Request, res: Response) => {
    try {
      const campaigns = await storage.getAdCampaignsByGeoFence(req.params.geoFenceId);
      res.json(campaigns);
    } catch (error) {
      console.error('Error fetching campaigns by geo-fence:', error);
      res.status(500).json({ error: 'Failed to fetch campaigns' });
    }
  });
  
  // Create campaign
  app.post('/api/ad-campaigns', async (req: Request, res: Response) => {
    try {
      const validatedData = insertAdCampaignSchema.parse(req.body);
      const campaign = await storage.createAdCampaign(validatedData);
      res.status(201).json(campaign);
    } catch (error) {
      console.error('Error creating campaign:', error);
      res.status(400).json({ error: 'Invalid campaign data', details: error });
    }
  });
  
  // Update campaign
  app.patch('/api/ad-campaigns/:id', async (req: Request, res: Response) => {
    try {
      const campaign = await storage.updateAdCampaign(req.params.id, req.body);
      res.json(campaign);
    } catch (error) {
      console.error('Error updating campaign:', error);
      res.status(500).json({ error: 'Failed to update campaign' });
    }
  });
  
  // Update campaign status
  app.patch('/api/ad-campaigns/:id/status', async (req: Request, res: Response) => {
    try {
      const { status } = req.body;
      const campaign = await storage.updateAdCampaign(req.params.id, { status });
      res.json(campaign);
    } catch (error) {
      console.error('Error updating campaign status:', error);
      res.status(500).json({ error: 'Failed to update campaign status' });
    }
  });
  
  // Delete campaign
  app.delete('/api/ad-campaigns/:id', async (req: Request, res: Response) => {
    try {
      const success = await storage.deleteAdCampaign(req.params.id);
      if (!success) {
        return res.status(404).json({ error: 'Campaign not found' });
      }
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting campaign:', error);
      res.status(500).json({ error: 'Failed to delete campaign' });
    }
  });
  
  // ===== DEVICE AUDIENCE ROUTES =====
  
  // Track device entry into geo-fence
  app.post('/api/ad-campaigns/device-audience', async (req: Request, res: Response) => {
    try {
      const validatedData = insertDeviceAudienceSchema.parse(req.body);
      const device = await storage.createDeviceAudience(validatedData);
      res.status(201).json(device);
    } catch (error) {
      console.error('Error tracking device audience:', error);
      res.status(400).json({ error: 'Invalid device data', details: error });
    }
  });
  
  // Get devices by geo-fence
  app.get('/api/ad-campaigns/geo-fences/:geoFenceId/devices', async (req: Request, res: Response) => {
    try {
      const devices = await storage.getDeviceAudiencesByGeoFence(req.params.geoFenceId);
      res.json(devices);
    } catch (error) {
      console.error('Error fetching device audiences:', error);
      res.status(500).json({ error: 'Failed to fetch device audiences' });
    }
  });
  
  // Get devices by campaign
  app.get('/api/ad-campaigns/:campaignId/devices', async (req: Request, res: Response) => {
    try {
      const devices = await storage.getDeviceAudiencesByCampaign(req.params.campaignId);
      res.json(devices);
    } catch (error) {
      console.error('Error fetching device audiences:', error);
      res.status(500).json({ error: 'Failed to fetch device audiences' });
    }
  });
  
  // ===== ANALYTICS ROUTES =====
  
  // Get campaign analytics
  app.get('/api/ad-campaigns/:id/analytics', async (req: Request, res: Response) => {
    try {
      const campaign = await storage.getAdCampaign(req.params.id);
      if (!campaign) {
        return res.status(404).json({ error: 'Campaign not found' });
      }
      
      // Get device audience count
      const devices = await storage.getDeviceAudiencesByCampaign(req.params.id);
      
      const analytics = {
        impressions: campaign.impressions || 0,
        clicks: campaign.clicks || 0,
        conversions: campaign.conversions || 0,
        spend: parseFloat(campaign.spend as string || '0'),
        devicesCaptured: devices.length,
        ctr: campaign.impressions ? ((campaign.clicks || 0) / campaign.impressions * 100).toFixed(2) : '0',
        conversionRate: campaign.clicks ? ((campaign.conversions || 0) / campaign.clicks * 100).toFixed(2) : '0',
        cpc: campaign.clicks ? (parseFloat(campaign.spend as string || '0') / campaign.clicks).toFixed(2) : '0',
        cpa: campaign.conversions ? (parseFloat(campaign.spend as string || '0') / campaign.conversions).toFixed(2) : '0'
      };
      
      res.json(analytics);
    } catch (error) {
      console.error('Error fetching campaign analytics:', error);
      res.status(500).json({ error: 'Failed to fetch analytics' });
    }
  });
  
  // Get overall platform analytics
  app.get('/api/ad-campaigns/analytics/overview', async (req: Request, res: Response) => {
    try {
      const campaigns = await storage.getAllAdCampaigns();
      const fences = await storage.getAllAdGeoFences();
      
      const totalImpressions = campaigns.reduce((sum, c) => sum + (c.impressions || 0), 0);
      const totalClicks = campaigns.reduce((sum, c) => sum + (c.clicks || 0), 0);
      const totalConversions = campaigns.reduce((sum, c) => sum + (c.conversions || 0), 0);
      const totalSpend = campaigns.reduce((sum, c) => sum + parseFloat(c.spend as string || '0'), 0);
      
      // Get total devices across all campaigns
      const allDevices = new Set();
      for (const campaign of campaigns) {
        const devices = await storage.getDeviceAudiencesByCampaign(campaign.id);
        devices.forEach(d => allDevices.add(d.deviceHash));
      }
      
      res.json({
        totalCampaigns: campaigns.length,
        activeCampaigns: campaigns.filter(c => c.status === 'active').length,
        totalGeoFences: fences.length,
        activeGeoFences: fences.filter(f => f.status === 'active').length,
        totalImpressions,
        totalClicks,
        totalConversions,
        totalSpend: totalSpend.toFixed(2),
        totalDevicesCaptured: allDevices.size,
        avgCtr: totalImpressions ? ((totalClicks / totalImpressions) * 100).toFixed(2) : '0',
        avgConversionRate: totalClicks ? ((totalConversions / totalClicks) * 100).toFixed(2) : '0'
      });
    } catch (error) {
      console.error('Error fetching overview analytics:', error);
      res.status(500).json({ error: 'Failed to fetch overview analytics' });
    }
  });
  
  console.log('📢 Ad Campaign Management routes registered');
}
