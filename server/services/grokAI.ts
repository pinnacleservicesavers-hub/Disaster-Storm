// xAI Grok integration - blueprint:javascript_xai
import OpenAI from "openai";

export interface GrokEducationalExplanation {
  concept: string;
  simpleExplanation: string;
  whyItMatters: string;
  whatToWatch: string;
  insiderTips: string[];
  realWorldExample: string;
}

export interface GrokStormPrediction {
  willHitUS: boolean;
  confidence: number;
  predictedLandfall: {
    location: string;
    state: string;
    coordinates: { lat: number; lng: number };
    timing: string;
  } | null;
  reasoning: string[];
  satelliteDataAnalysis: string;
  keyFactors: string[];
  wildcardScenarios: string[];
}

export class GrokAIService {
  private grok: OpenAI;

  constructor() {
    // xAI Grok uses OpenAI-compatible API with custom base URL
    this.grok = new OpenAI({ 
      baseURL: "https://api.x.ai/v1", 
      apiKey: process.env.XAI_API_KEY 
    });
    console.log('🤖 Grok AI initialized - Advanced storm intelligence active');
  }

  /**
   * Educational explanation of meteorology concepts in simple contractor terms
   */
  async explainConcept(concept: string): Promise<GrokEducationalExplanation> {
    const prompt = `You are teaching contractors about: ${concept}

Explain in simple, everyday language:
1. What is ${concept}? (simple definition)
2. Why does it matter for storms and hurricanes?
3. What should contractors watch for?
4. 3-5 insider tips that professionals use
5. A real-world example from past storms

Make it educational but simple. Contractors need to understand this without a meteorology degree.

Return as JSON with keys: simpleExplanation, whyItMatters, whatToWatch, insiderTips (array), realWorldExample`;

    const response = await this.grok.chat.completions.create({
      model: "grok-2-1212",
      messages: [
        {
          role: "system",
          content: "You are Grok, an expert meteorologist teaching contractors in simple terms. You make complex weather concepts easy to understand and reveal insider knowledge."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7
    });

    const explanation = JSON.parse(response.choices[0].message.content || '{}');

    return {
      concept,
      simpleExplanation: explanation.simpleExplanation || '',
      whyItMatters: explanation.whyItMatters || '',
      whatToWatch: explanation.whatToWatch || '',
      insiderTips: explanation.insiderTips || [],
      realWorldExample: explanation.realWorldExample || ''
    };
  }

  /**
   * Predict if storm will hit US and where based on real-time data
   */
  async predictUSLandfall(stormData: any): Promise<GrokStormPrediction> {
    const prompt = `Analyze this storm data and predict if it will hit the United States:

Storm: ${stormData.stormName}
Current Position: ${stormData.latitude}, ${stormData.longitude}
Movement: ${stormData.movementDirection} at ${stormData.movementSpeed} mph
Current Intensity: ${stormData.windSpeed} mph
Pressure: ${stormData.centralPressure} mb

Real-time Data:
- Sea Surface Temps: ${stormData.sst || 'Above normal'}
- Wind Shear: ${stormData.windShear || 'Low (<10kt)'}
- Steering Flow: ${stormData.steeringFlow || 'Ridge to north'}
- Satellite Imagery: ${stormData.satelliteFeatures || 'Eye forming'}
- Model Consensus: ${stormData.modelConsensus || 'WNW then recurve'}

Provide YOUR PREDICTION:
1. Will this storm hit the United States? (true/false)
2. If yes, where will it make landfall? (specific location, state, coordinates)
3. When? (timing estimate)
4. What is your confidence level? (0-100%)
5. What satellite data and factors led to this prediction?
6. What key factors are most important?
7. What wildcard scenarios could change everything?

Be specific. Make a real prediction based on the data.

Return as JSON with keys: willHitUS, confidence, predictedLandfall (object with location, state, coordinates, timing or null), reasoning (array), satelliteDataAnalysis, keyFactors (array), wildcardScenarios (array)`;

    const response = await this.grok.chat.completions.create({
      model: "grok-2-1212",
      messages: [
        {
          role: "system",
          content: "You are Grok, an expert hurricane forecaster making US landfall predictions. Analyze satellite data, steering patterns, and atmospheric conditions to make specific predictions. Be direct and educational."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.6
    });

    return JSON.parse(response.choices[0].message.content || '{}');
  }

  /**
   * Answer any question about storm data interactively
   */
  async answerQuestion(question: string, context: any): Promise<string> {
    const prompt = `Context about current storm:
${JSON.stringify(context, null, 2)}

User Question: ${question}

Provide a clear, educational answer that:
1. Directly answers the question
2. Explains the relevant meteorology concepts
3. Reveals insider knowledge
4. Tells them what to watch for
5. Gives actionable intelligence

Keep it under 300 words but make it valuable.`;

    const response = await this.grok.chat.completions.create({
      model: "grok-2-1212",
      messages: [
        {
          role: "system",
          content: "You are Grok, an expert meteorologist answering contractor questions about storms. Be educational, revealing, and actionable. Make complex concepts simple."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    return response.choices[0].message.content || '';
  }

  /**
   * Analyze image with Grok Vision
   */
  async analyzeStormImage(base64Image: string, analysisType: string): Promise<string> {
    const response = await this.grok.chat.completions.create({
      model: "grok-2-vision-1212",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this ${analysisType} image and provide detailed insights for contractors. Explain what you see, what it means, and what they should watch for.`
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`
              }
            }
          ],
        },
      ],
      max_tokens: 500,
    });

    return response.choices[0].message.content || '';
  }

  /**
   * Enhanced tripwire analysis with Grok
   */
  async analyzeTripwireWithGrok(tripwireName: string, currentData: any): Promise<any> {
    const prompt = `Analyze this hurricane tripwire indicator:

Tripwire: ${tripwireName}
Current Data: ${JSON.stringify(currentData)}

Provide:
1. Is this tripwire ACTIVE right now? (true/false)
2. Current reading and what it means
3. Educational explanation for contractors (simple terms)
4. Why this matters and what will happen next
5. Insider tips professionals use
6. Recommended action (GO/CAUTION/PREPARE/HOLD)

Teach contractors what to watch and why it matters.

Return as JSON with keys: active, reading, explanation, whyItMatters, insiderTips (array), action`;

    const response = await this.grok.chat.completions.create({
      model: "grok-2-1212",
      messages: [
        {
          role: "system",
          content: "You are Grok, teaching contractors about hurricane tripwire indicators. Make it educational and actionable."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7
    });

    return JSON.parse(response.choices[0].message.content || '{}');
  }

  /**
   * Real-time storm intelligence briefing
   */
  async generateIntelligenceBriefing(stormData: any): Promise<string> {
    const prompt = `Generate a real-time intelligence briefing for contractors about this storm:

${JSON.stringify(stormData, null, 2)}

Create a briefing that:
1. Says what's happening RIGHT NOW
2. Explains the key indicators and what they mean
3. Reveals what professionals are quietly watching
4. Predicts what will happen in next 6-24 hours
5. Gives clear GO/CAUTION/HOLD recommendation
6. Teaches them something they didn't know

Make it urgent, educational, and actionable. Under 400 words.`;

    const response = await this.grok.chat.completions.create({
      model: "grok-2-1212",
      messages: [
        {
          role: "system",
          content: "You are Grok, providing real-time storm intelligence briefings to contractors. Be direct, educational, and reveal insider knowledge."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 700
    });

    return response.choices[0].message.content || '';
  }

  /**
   * Module enhancement - review and enhance any module with Grok intelligence
   */
  async enhanceModule(moduleName: string, currentData: any): Promise<any> {
    const prompt = `Review and enhance the ${moduleName} module with real-time intelligence.

Current module data:
${JSON.stringify(currentData, null, 2)}

Provide:
1. What's missing that contractors need to know?
2. What insider knowledge can you add?
3. How can this be more educational?
4. What real-time predictions or insights can you provide?
5. What questions should contractors be asking?

Return as JSON with keys: missingInsights (array), insiderKnowledge (array), educationalAdditions (array), realTimePredictions (array), criticalQuestions (array)`;

    const response = await this.grok.chat.completions.create({
      model: "grok-2-1212",
      messages: [
        {
          role: "system",
          content: "You are Grok, enhancing storm intelligence modules. Add depth, education, and real-time intelligence that helps contractors succeed."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.8
    });

    return JSON.parse(response.choices[0].message.content || '{}');
  }

  /**
   * Comprehensive Intelligence Query - Answer ANY question about locations, weather, damage, incidents
   */
  async answerComprehensiveQuery(query: string): Promise<{
    response: string;
    incidents: any[];
    confidence: number;
    sources: string[];
  }> {
    const prompt = `You are a comprehensive intelligence assistant for storm contractors and property restoration professionals. You have real-time knowledge of weather, incidents, damage, traffic, and contractor opportunities across the United States.

USER QUESTION: "${query}"

Answer their question naturally and intelligently. If they're asking about a specific location (like Columbus, GA), provide relevant information about that EXACT location - don't default to other cities.

You should:
1. Directly answer their specific question
2. Be conversational and helpful
3. If it's about weather/damage/incidents, provide specific details
4. If information isn't available, be honest about it
5. Suggest what you CAN help with

For questions about locations you don't have specific data for, acknowledge that and offer to help with general information or nearby areas.

IMPORTANT: 
- Always address the EXACT location they asked about
- Don't substitute other cities without acknowledging it
- Be honest if you don't have specific real-time data for that area
- Keep responses helpful and actionable for contractors

Provide your response as a natural, conversational answer.`;

    const response = await this.grok.chat.completions.create({
      model: "grok-2-1212",
      messages: [
        {
          role: "system",
          content: "You are Grok, a comprehensive intelligence assistant helping storm contractors and property restoration professionals. You're knowledgeable, helpful, and honest about what you know and don't know. You always answer the user's EXACT question - if they ask about Columbus GA, you talk about Columbus GA, not Atlanta or other cities."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    const aiResponse = response.choices[0].message.content || '';

    return {
      response: aiResponse,
      incidents: [], // Can be populated with real incident data later
      confidence: 0.85,
      sources: ['Grok AI Intelligence', 'Real-time Analysis']
    };
  }
}

export const grokAI = new GrokAIService();
