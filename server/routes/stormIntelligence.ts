import { Router } from 'express';
import { stormIntelligenceAI, StormIntelligenceQuery } from '../services/stormIntelligenceAI';

const router = Router();

/**
 * Process storm intelligence query
 * POST /api/storm-intelligence/query
 */
router.post('/query', async (req, res) => {
  try {
    const query: StormIntelligenceQuery = req.body;
    
    if (!query.question) {
      return res.status(400).json({ 
        error: 'Question is required' 
      });
    }

    console.log(`🧠 Processing storm intelligence query: "${query.question}"`);
    
    const response = await stormIntelligenceAI.processQuery(query);
    
    res.json(response);

  } catch (error) {
    console.error('🚨 Error processing storm intelligence query:', error);
    res.status(500).json({ 
      error: 'Failed to process query',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Generate disaster path prediction
 * POST /api/storm-intelligence/predict-path
 */
router.post('/predict-path', async (req, res) => {
  try {
    const { latitude, longitude, disasterType } = req.body;
    
    if (!latitude || !longitude) {
      return res.status(400).json({ 
        error: 'Latitude and longitude are required' 
      });
    }

    console.log(`🎯 Generating disaster path prediction for ${latitude}, ${longitude}`);
    
    const prediction = await stormIntelligenceAI.generateDisasterPathPrediction(
      latitude, 
      longitude, 
      disasterType
    );
    
    res.json(prediction);

  } catch (error) {
    console.error('🚨 Error generating disaster path prediction:', error);
    res.status(500).json({ 
      error: 'Failed to generate path prediction',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Answer storm question
 * POST /api/storm-intelligence/ask
 */
router.post('/ask', async (req, res) => {
  try {
    const { question, context } = req.body;
    
    if (!question) {
      return res.status(400).json({ 
        error: 'Question is required' 
      });
    }

    console.log(`❓ Answering storm question: "${question}"`);
    
    const answer = await stormIntelligenceAI.answerStormQuestion(question, context);
    
    res.json({ 
      question,
      answer,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('🚨 Error answering storm question:', error);
    res.status(500).json({ 
      error: 'Failed to answer question',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get AI capabilities and status
 * GET /api/storm-intelligence/status
 */
router.get('/status', async (req, res) => {
  try {
    const status = {
      aiEnabled: !!process.env.OPENAI_API_KEY,
      capabilities: [
        'Disaster path prediction',
        'Real-time weather analysis',
        'Historical pattern analysis',
        'Damage assessment',
        'Contractor opportunity analysis',
        'General storm intelligence'
      ],
      models: ['GPT-5 (Latest)'],
      dataSources: [
        'National Weather Service',
        'National Hurricane Center',
        'Storm Prediction Center',
        'FEMA Disaster Records',
        'Historical Storm Database',
        'Real-time Radar/Satellite'
      ],
      lastUpdate: new Date().toISOString()
    };
    
    res.json(status);

  } catch (error) {
    console.error('🚨 Error getting AI status:', error);
    res.status(500).json({ 
      error: 'Failed to get status' 
    });
  }
});

export default router;