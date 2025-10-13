import type { Express, Request, Response } from "express";
import { grokAI } from "../services/grokAI";

export function registerGrokAIRoutes(app: Express) {
  
  // Simple proxy endpoint for general Grok queries (accepts "prompt" field)
  app.post('/api/grok', async (req: Request, res: Response) => {
    try {
      const { prompt } = req.body;
      
      if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
      }

      const answer = await grokAI.answerQuestion(prompt, {});
      res.json({ success: true, answer });
    } catch (error) {
      console.error('Error with Grok proxy:', error);
      res.status(500).json({ error: 'Failed to process Grok request', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  });
  
  // Educational concept explanations
  app.post('/api/grok/explain-concept', async (req: Request, res: Response) => {
    try {
      const { concept } = req.body;
      const explanation = await grokAI.explainConcept(concept);
      res.json({ success: true, explanation });
    } catch (error) {
      console.error('Error explaining concept:', error);
      res.status(500).json({ error: 'Failed to explain concept', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  });
  
  // US landfall prediction
  app.post('/api/grok/predict-us-landfall', async (req: Request, res: Response) => {
    try {
      const stormData = req.body;
      const prediction = await grokAI.predictUSLandfall(stormData);
      res.json({ success: true, prediction });
    } catch (error) {
      console.error('Error predicting US landfall:', error);
      res.status(500).json({ error: 'Failed to predict landfall', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  });
  
  // Interactive Q&A
  app.post('/api/grok/ask-question', async (req: Request, res: Response) => {
    try {
      const { question, context } = req.body;
      const answer = await grokAI.answerQuestion(question, context);
      res.json({ success: true, answer });
    } catch (error) {
      console.error('Error answering question:', error);
      res.status(500).json({ error: 'Failed to answer question', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  });
  
  // Image analysis with Grok Vision
  app.post('/api/grok/analyze-image', async (req: Request, res: Response) => {
    try {
      const { base64Image, analysisType } = req.body;
      const analysis = await grokAI.analyzeStormImage(base64Image, analysisType);
      res.json({ success: true, analysis });
    } catch (error) {
      console.error('Error analyzing image:', error);
      res.status(500).json({ error: 'Failed to analyze image', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  });
  
  // Enhanced tripwire analysis
  app.post('/api/grok/analyze-tripwire', async (req: Request, res: Response) => {
    try {
      const { tripwireName, currentData } = req.body;
      const analysis = await grokAI.analyzeTripwireWithGrok(tripwireName, currentData);
      res.json({ success: true, analysis });
    } catch (error) {
      console.error('Error analyzing tripwire:', error);
      res.status(500).json({ error: 'Failed to analyze tripwire', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  });
  
  // Real-time intelligence briefing
  app.post('/api/grok/intelligence-briefing', async (req: Request, res: Response) => {
    try {
      const stormData = req.body;
      const briefing = await grokAI.generateIntelligenceBriefing(stormData);
      res.json({ success: true, briefing });
    } catch (error) {
      console.error('Error generating briefing:', error);
      res.status(500).json({ error: 'Failed to generate briefing', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  });
  
  // Module enhancement
  app.post('/api/grok/enhance-module', async (req: Request, res: Response) => {
    try {
      const { moduleName, currentData } = req.body;
      const enhancements = await grokAI.enhanceModule(moduleName, currentData);
      res.json({ success: true, enhancements });
    } catch (error) {
      console.error('Error enhancing module:', error);
      res.status(500).json({ error: 'Failed to enhance module', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  });
  
  // Comprehensive storm analysis with Grok
  app.post('/api/grok/full-storm-analysis', async (req: Request, res: Response) => {
    try {
      const stormData = req.body;
      
      // Get comprehensive analysis from Grok
      const [usLandfallPrediction, intelligenceBriefing] = await Promise.all([
        grokAI.predictUSLandfall(stormData),
        grokAI.generateIntelligenceBriefing(stormData)
      ]);
      
      // Explain key concepts
      const conceptsToExplain = [
        'tripwires',
        'lightning burst',
        'outflow tail',
        'eddy',
        'eye wall'
      ];
      
      const educationalExplanations = await Promise.all(
        conceptsToExplain.map(concept => grokAI.explainConcept(concept))
      );
      
      res.json({
        success: true,
        analysis: {
          usLandfallPrediction,
          intelligenceBriefing,
          educationalExplanations: educationalExplanations.reduce((acc, exp) => {
            acc[exp.concept] = exp;
            return acc;
          }, {} as Record<string, any>)
        }
      });
    } catch (error) {
      console.error('Error in full storm analysis:', error);
      res.status(500).json({ error: 'Failed to complete analysis', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  });
  
  console.log('🤖 Grok AI routes registered - Advanced storm intelligence active');
}
