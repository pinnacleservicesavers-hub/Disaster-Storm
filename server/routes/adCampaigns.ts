import type { Express, Request, Response } from "express";
import type { IStorage } from "../storage";

export function registerAdCampaignRoutes(app: Express, storage: IStorage) {
  
  // GET /api/ads/geo-fences - Get all geo-fences
  app.get("/api/ads/geo-fences", async (req: Request, res: Response) => {
    try {
      // For now, return empty array since we're using in-memory storage
      // In production, this would query the database
      res.json({
        success: true,
        geoFences: [],
        count: 0
      });
    } catch (error) {
      console.error('Error fetching geo-fences:', error);
      res.status(500).json({
        error: 'Failed to fetch geo-fences',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // POST /api/ads/geo-fences - Create new geo-fence
  app.post("/api/ads/geo-fences", async (req: Request, res: Response) => {
    try {
      const { name, centerLat, centerLng, radiusMiles, stormId } = req.body;

      if (!name || !centerLat || !centerLng || !radiusMiles) {
        return res.status(400).json({
          error: 'Missing required fields',
          required: ['name', 'centerLat', 'centerLng', 'radiusMiles']
        });
      }

      const geoFence = {
        id: `geofence-${Date.now()}`,
        name,
        centerLat: parseFloat(centerLat),
        centerLng: parseFloat(centerLng),
        radiusMiles: parseInt(radiusMiles),
        stormId: stormId || null,
        status: 'active',
        devicesCaptured: 0,
        impressions: 0,
        clicks: 0,
        conversions: 0,
        spend: 0,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
      };

      console.log(`📍 Created geo-fence: ${name} (${radiusMiles} miles around ${centerLat}, ${centerLng})`);

      res.json({
        success: true,
        geoFence
      });
    } catch (error) {
      console.error('Error creating geo-fence:', error);
      res.status(500).json({
        error: 'Failed to create geo-fence',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // GET /api/ads/campaigns - Get all campaigns
  app.get("/api/ads/campaigns", async (req: Request, res: Response) => {
    try {
      // For now, return empty array since we're using in-memory storage
      // In production, this would query the database
      res.json({
        success: true,
        campaigns: [],
        count: 0
      });
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      res.status(500).json({
        error: 'Failed to fetch campaigns',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // POST /api/ads/campaigns - Create new campaign
  app.post("/api/ads/campaigns", async (req: Request, res: Response) => {
    try {
      const {
        name,
        description,
        geoFenceId,
        platforms,
        adCopy,
        callToAction,
        phoneNumber,
        dailyBudget,
        totalBudget,
        weatherTriggers,
        autoActivate
      } = req.body;

      if (!name || !platforms || platforms.length === 0 || !adCopy || !callToAction) {
        return res.status(400).json({
          error: 'Missing required fields',
          required: ['name', 'platforms', 'adCopy', 'callToAction']
        });
      }

      const campaign = {
        id: `campaign-${Date.now()}`,
        name,
        description: description || '',
        geoFenceId: geoFenceId || null,
        stormId: null,
        platforms,
        adCopy,
        callToAction,
        phoneNumber: phoneNumber || null,
        imageUrl: null,
        videoUrl: null,
        demographics: null,
        keywords: null,
        interests: null,
        dailyBudget: dailyBudget ? parseFloat(dailyBudget) : null,
        totalBudget: totalBudget ? parseFloat(totalBudget) : null,
        startDate: null,
        endDate: null,
        weatherTriggers: weatherTriggers || null,
        autoActivate: autoActivate || false,
        status: 'draft',
        impressions: 0,
        clicks: 0,
        conversions: 0,
        spend: 0,
        metaAdId: null,
        googleAdId: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      console.log(`📢 Created ad campaign: ${name} on platforms: ${platforms.join(', ')}`);
      
      if (autoActivate && weatherTriggers) {
        console.log(`⚡ Weather trigger enabled: Auto-activate at ${weatherTriggers.windSpeedMph}mph`);
      }

      res.json({
        success: true,
        campaign
      });
    } catch (error) {
      console.error('Error creating campaign:', error);
      res.status(500).json({
        error: 'Failed to create campaign',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // PATCH /api/ads/campaigns/:id/status - Update campaign status
  app.patch("/api/ads/campaigns/:id/status", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status || !['draft', 'active', 'paused', 'completed'].includes(status)) {
        return res.status(400).json({
          error: 'Invalid status',
          validStatuses: ['draft', 'active', 'paused', 'completed']
        });
      }

      console.log(`📊 Updated campaign ${id} status to: ${status}`);

      res.json({
        success: true,
        campaignId: id,
        status
      });
    } catch (error) {
      console.error('Error updating campaign status:', error);
      res.status(500).json({
        error: 'Failed to update campaign status',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // POST /api/ads/campaigns/:id/activate - Activate campaign with weather trigger
  app.post("/api/ads/campaigns/:id/activate", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { weatherConditions } = req.body;

      console.log(`🚀 Auto-activating campaign ${id} due to weather trigger`);
      console.log(`🌪️ Weather conditions: ${JSON.stringify(weatherConditions)}`);

      res.json({
        success: true,
        campaignId: id,
        status: 'active',
        activatedBy: 'weather_trigger',
        weatherConditions
      });
    } catch (error) {
      console.error('Error activating campaign:', error);
      res.status(500).json({
        error: 'Failed to activate campaign',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // GET /api/ads/device-audiences - Get retargeting audiences
  app.get("/api/ads/device-audiences", async (req: Request, res: Response) => {
    try {
      const { geoFenceId, campaignId } = req.query;

      res.json({
        success: true,
        audiences: [],
        count: 0,
        filters: {
          geoFenceId: geoFenceId || null,
          campaignId: campaignId || null
        }
      });
    } catch (error) {
      console.error('Error fetching device audiences:', error);
      res.status(500).json({
        error: 'Failed to fetch device audiences',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // POST /api/ads/track-engagement - Track ad engagement (impression, click, conversion)
  app.post("/api/ads/track-engagement", async (req: Request, res: Response) => {
    try {
      const { campaignId, geoFenceId, deviceHash, eventType, platform } = req.body;

      if (!campaignId || !eventType) {
        return res.status(400).json({
          error: 'Missing required fields',
          required: ['campaignId', 'eventType']
        });
      }

      const validEvents = ['impression', 'click', 'conversion'];
      if (!validEvents.includes(eventType)) {
        return res.status(400).json({
          error: 'Invalid event type',
          validEvents
        });
      }

      console.log(`📊 Tracked ${eventType} for campaign ${campaignId} on ${platform || 'unknown platform'}`);

      res.json({
        success: true,
        eventTracked: eventType,
        campaignId,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error tracking engagement:', error);
      res.status(500).json({
        error: 'Failed to track engagement',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // GET /api/ads/analytics/summary - Get campaign analytics summary
  app.get("/api/ads/analytics/summary", async (req: Request, res: Response) => {
    try {
      const { campaignId, startDate, endDate } = req.query;

      res.json({
        success: true,
        analytics: {
          totalImpressions: 0,
          totalClicks: 0,
          totalConversions: 0,
          totalSpend: 0,
          ctr: 0, // Click-through rate
          conversionRate: 0,
          cpc: 0, // Cost per click
          cpa: 0, // Cost per acquisition
          platformBreakdown: {
            meta: { impressions: 0, clicks: 0, conversions: 0, spend: 0 },
            google: { impressions: 0, clicks: 0, conversions: 0, spend: 0 },
            instagram: { impressions: 0, clicks: 0, conversions: 0, spend: 0 },
            youtube: { impressions: 0, clicks: 0, conversions: 0, spend: 0 }
          }
        },
        filters: {
          campaignId: campaignId || 'all',
          startDate: startDate || null,
          endDate: endDate || null
        }
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
      res.status(500).json({
        error: 'Failed to fetch analytics',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  console.log('📢 Ad Campaign Management routes registered');
}
