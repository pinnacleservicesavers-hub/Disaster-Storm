import type { Express, Request, Response } from "express";
import { aiStormExpert } from "../services/aiStormExpert";

export function registerAIStormExpertRoutes(app: Express) {
  
  // Analyze GLM lightning burst
  app.post('/api/ai-storm-expert/lightning-analysis', async (req: Request, res: Response) => {
    try {
      const stormData = req.body;
      const analysis = await aiStormExpert.analyzeGLMLightningBurst(stormData);
      res.json({ success: true, analysis });
    } catch (error) {
      console.error('Error analyzing lightning burst:', error);
      res.status(500).json({ error: 'Failed to analyze lightning burst', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  });
  
  // Analyze all tripwires
  app.post('/api/ai-storm-expert/tripwires', async (req: Request, res: Response) => {
    try {
      const stormData = req.body;
      const tripwires = await aiStormExpert.analyzeTripwires(stormData);
      res.json({ success: true, tripwires });
    } catch (error) {
      console.error('Error analyzing tripwires:', error);
      res.status(500).json({ error: 'Failed to analyze tripwires', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  });
  
  // Predict landfall and path
  app.post('/api/ai-storm-expert/predict-landfall', async (req: Request, res: Response) => {
    try {
      const stormData = req.body;
      const prediction = await aiStormExpert.predictLandfallAndPath(stormData);
      res.json({ success: true, prediction });
    } catch (error) {
      console.error('Error predicting landfall:', error);
      res.status(500).json({ error: 'Failed to predict landfall', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  });
  
  // Generate continuous educational insights
  app.post('/api/ai-storm-expert/continuous-insights', async (req: Request, res: Response) => {
    try {
      const { stormData, previousInsights = [] } = req.body;
      const insights = await aiStormExpert.generateContinuousInsights(stormData, previousInsights);
      res.json({ success: true, insights });
    } catch (error) {
      console.error('Error generating insights:', error);
      res.status(500).json({ error: 'Failed to generate insights', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  });
  
  // Explain current situation
  app.post('/api/ai-storm-expert/explain-now', async (req: Request, res: Response) => {
    try {
      const stormData = req.body;
      const explanation = await aiStormExpert.explainCurrentSituation(stormData);
      res.json({ success: true, explanation });
    } catch (error) {
      console.error('Error explaining situation:', error);
      res.status(500).json({ error: 'Failed to explain situation', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  });
  
  // Get comprehensive storm analysis
  app.post('/api/ai-storm-expert/full-analysis', async (req: Request, res: Response) => {
    try {
      const stormData = req.body;
      
      // Run all analyses in parallel for speed
      const [tripwires, prediction, explanation, insights] = await Promise.all([
        aiStormExpert.analyzeTripwires(stormData),
        aiStormExpert.predictLandfallAndPath(stormData),
        aiStormExpert.explainCurrentSituation(stormData),
        aiStormExpert.generateContinuousInsights(stormData, [])
      ]);
      
      // Check if lightning burst is active
      const lightningTripwire = tripwires.find(t => t.id === 1);
      let lightningAnalysis = null;
      
      if (lightningTripwire?.active) {
        lightningAnalysis = await aiStormExpert.analyzeGLMLightningBurst(stormData);
      }
      
      res.json({
        success: true,
        analysis: {
          tripwires,
          prediction,
          currentSituation: explanation,
          insiderInsights: insights,
          lightningBurst: lightningAnalysis,
          activeTripwireCount: tripwires.filter(t => t.active).length,
          overallStatus: this.determineOverallStatus(tripwires),
          recommendedAction: this.getRecommendedAction(tripwires)
        }
      });
    } catch (error) {
      console.error('Error in full analysis:', error);
      res.status(500).json({ error: 'Failed to complete analysis', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  });
  
  console.log('🌪️ AI Storm Expert routes registered');
}

// Helper function to determine overall status
function determineOverallStatus(tripwires: any[]): string {
  const redCount = tripwires.filter(t => t.status === 'red').length;
  const orangeCount = tripwires.filter(t => t.status === 'orange').length;
  const yellowCount = tripwires.filter(t => t.status === 'yellow').length;
  
  if (redCount >= 2) return 'GO - Immediate Action Required';
  if (redCount >= 1 || orangeCount >= 2) return 'CAUTION - Prepare for Action';
  if (yellowCount >= 2) return 'PREPARE - Monitor Closely';
  return 'HOLD - Observation Only';
}

// Helper function to get recommended action
function getRecommendedAction(tripwires: any[]): string {
  const activeTripwires = tripwires.filter(t => t.active);
  
  if (activeTripwires.length >= 2) {
    return 'Two or more tripwires active - treat storm as one category higher and update crew staging plans immediately';
  }
  if (activeTripwires.length === 1) {
    return 'One tripwire active - increase monitoring frequency and prepare for rapid deployment if second tripwire activates';
  }
  return 'No active tripwires - maintain normal observation schedule';
}
