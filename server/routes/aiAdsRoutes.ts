import type { Express, Request, Response } from "express";
import { aiAdsAssistant } from "../services/aiAdsAssistant";

export function registerAIAdsRoutes(app: Express) {
  
  // Generate AI ad copy
  app.post('/api/ai-ads/generate-copy', async (req: Request, res: Response) => {
    try {
      const { businessType, targetAudience, urgency, serviceType, location, stormType, budget, platform } = req.body;
      
      const variations = await aiAdsAssistant.generateAdCopy({
        businessType,
        targetAudience,
        urgency,
        serviceType,
        location,
        stormType,
        budget,
        platform
      });
      
      res.json({ success: true, variations });
    } catch (error) {
      console.error('Error generating ad copy:', error);
      res.status(500).json({ error: 'Failed to generate ad copy', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  });
  
  // Generate AI ad creative/image
  app.post('/api/ai-ads/generate-creative', async (req: Request, res: Response) => {
    try {
      const { adCopy, visualStyle, damageType, emotion } = req.body;
      
      const imageUrl = await aiAdsAssistant.generateAdCreative({
        adCopy,
        visualStyle,
        damageType,
        emotion
      });
      
      res.json({ success: true, imageUrl });
    } catch (error) {
      console.error('Error generating ad creative:', error);
      res.status(500).json({ error: 'Failed to generate ad creative', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  });
  
  // Get AI ad strategy recommendations
  app.post('/api/ai-ads/strategy', async (req: Request, res: Response) => {
    try {
      const { stormData, demographics, budget, platforms } = req.body;
      
      const strategy = await aiAdsAssistant.getAdStrategy({
        stormData,
        demographics,
        budget,
        platforms
      });
      
      res.json({ success: true, strategy });
    } catch (error) {
      console.error('Error generating ad strategy:', error);
      res.status(500).json({ error: 'Failed to generate ad strategy', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  });
  
  // Get Facebook Ads setup guide
  app.post('/api/ai-ads/facebook-guide', async (req: Request, res: Response) => {
    try {
      const businessInfo = req.body;
      
      const guide = await aiAdsAssistant.getFacebookAdSetupGuide(businessInfo);
      
      res.json({ success: true, guide });
    } catch (error) {
      console.error('Error generating Facebook guide:', error);
      res.status(500).json({ error: 'Failed to generate Facebook guide', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  });
  
  // Optimize campaign with AI
  app.post('/api/ai-ads/optimize', async (req: Request, res: Response) => {
    try {
      const campaignData = req.body;
      
      const optimization = await aiAdsAssistant.optimizeCampaign(campaignData);
      
      res.json({ success: true, optimization });
    } catch (error) {
      console.error('Error optimizing campaign:', error);
      res.status(500).json({ error: 'Failed to optimize campaign', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  });
  
  // AI chat assistant
  app.post('/api/ai-ads/chat', async (req: Request, res: Response) => {
    try {
      const { message, context } = req.body;
      
      if (!message) {
        return res.status(400).json({ error: 'Message is required' });
      }
      
      const response = await aiAdsAssistant.chatAssistant(message, context);
      
      res.json({ success: true, response });
    } catch (error) {
      console.error('Error in AI chat:', error);
      res.status(500).json({ error: 'Failed to process chat', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  });
  
  // Generate headlines
  app.post('/api/ai-ads/headlines', async (req: Request, res: Response) => {
    try {
      const { topic, count = 5 } = req.body;
      
      if (!topic) {
        return res.status(400).json({ error: 'Topic is required' });
      }
      
      const headlines = await aiAdsAssistant.generateHeadlines(topic, count);
      
      res.json({ success: true, headlines });
    } catch (error) {
      console.error('Error generating headlines:', error);
      res.status(500).json({ error: 'Failed to generate headlines', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  });
  
  app.post('/api/ai-ads/freeform-create', async (req: Request, res: Response) => {
    try {
      const { prompt, adType, style, platform, includeImage } = req.body;
      
      if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required - tell us what ad you want to create' });
      }
      
      const result = await aiAdsAssistant.createFreeformAd({
        prompt,
        adType: adType || 'image',
        style,
        platform,
        includeImage: includeImage !== false
      });
      
      res.json({ success: true, result });
    } catch (error) {
      console.error('Error creating freeform ad:', error);
      res.status(500).json({ error: 'Failed to create ad', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.post('/api/ai-ads/generate-image-only', async (req: Request, res: Response) => {
    try {
      const { prompt, style } = req.body;
      
      if (!prompt) {
        return res.status(400).json({ error: 'Image prompt is required' });
      }
      
      const imageUrl = await aiAdsAssistant.generateImageOnly(prompt, style);
      
      res.json({ success: true, imageUrl });
    } catch (error) {
      console.error('Error generating image:', error);
      res.status(500).json({ error: 'Failed to generate image', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  console.log('🎨 AI Ads Assistant routes registered');
}
