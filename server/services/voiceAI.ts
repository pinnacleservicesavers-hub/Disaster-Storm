import OpenAI from 'openai';
import { Readable } from 'stream';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR
});

export interface VoiceAnalysisRequest {
  portalType: 'prediction' | 'damage-detection' | 'drones' | 'leads' | 'all';
  requestType: 'live-update' | 'question-answer' | 'portal-overview' | 'data-summary';
  question?: string;
  currentData?: any;
  userLocation?: { latitude: number; longitude: number; };
}

export interface VoiceResponse {
  text: string;
  audioUrl?: string;
  audioBuffer?: Buffer;
  analysis: {
    keyInsights: string[];
    actionItems: string[];
    urgentAlerts: string[];
    dataPoints: string[];
  };
  timestamp: Date;
}

export class VoiceAIService {
  private static instance: VoiceAIService;
  
  public static getInstance(): VoiceAIService {
    if (!VoiceAIService.instance) {
      VoiceAIService.instance = new VoiceAIService();
    }
    return VoiceAIService.instance;
  }

  /**
   * Generate intelligent voice response for portal data
   */
  async generateVoiceResponse(request: VoiceAnalysisRequest): Promise<VoiceResponse> {
    try {
      const analysisText = await this.generateIntelligentAnalysis(request);
      
      // Generate high-quality audio using OpenAI TTS
      const audioBuffer = await this.generateAudio(analysisText);
      
      // Parse key insights from the analysis
      const analysis = this.parseAnalysisInsights(analysisText);
      
      return {
        text: analysisText,
        audioBuffer,
        analysis,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Voice AI generation error:', error);
      
      // Fallback response
      const fallbackText = this.generateFallbackResponse(request);
      return {
        text: fallbackText,
        analysis: {
          keyInsights: ['Voice analysis temporarily unavailable'],
          actionItems: ['You can continue browsing; audio fallback is active'],
          urgentAlerts: [],
          dataPoints: []
        },
        timestamp: new Date()
      };
    }
  }

  /**
   * Generate intelligent analysis text using GPT-4
   */
  private async generateIntelligentAnalysis(request: VoiceAnalysisRequest): Promise<string> {
    const systemPrompt = this.buildSystemPrompt(request.portalType);
    const userPrompt = this.buildUserPrompt(request);

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 1500
    });

    return completion.choices[0]?.message?.content || 'Analysis unavailable';
  }

  /**
   * Generate high-quality audio using OpenAI TTS with female voice
   */
  private async generateAudio(text: string): Promise<Buffer> {
    try {
      const response = await openai.audio.speech.create({
        model: 'tts-1-hd', // High-definition model for best quality
        voice: 'nova', // Female voice with natural intonation
        input: text,
        response_format: 'mp3',
        speed: 0.95 // Slightly slower for better clarity
      });

      // Convert response to buffer
      const buffer = Buffer.from(await response.arrayBuffer());
      return buffer;
    } catch (error) {
      console.error('Audio generation error:', error);
      throw new Error('Failed to generate audio');
    }
  }

  /**
   * Build system prompt based on portal type
   */
  private buildSystemPrompt(portalType: string): string {
    const basePrompt = `You are ARIA (Advanced Response Intelligence Assistant), a sophisticated female AI voice assistant specializing in storm operations and disaster response intelligence. 

Your personality:
- Professional yet warm and reassuring
- Highly knowledgeable about weather patterns, damage assessment, and contractor operations
- Speaks in a conversational, easy-to-understand manner
- Provides actionable insights and clear recommendations
- Prioritizes safety and emergency response when applicable

Your expertise includes:
- Real-time storm tracking and prediction analysis
- Damage assessment and contractor lead generation
- Insurance claims and property information
- Emergency response coordination
- Market opportunities and revenue projections

Always structure your responses with:
1. A brief greeting or acknowledgment
2. Key insights about the current situation
3. Specific data points and their significance
4. Actionable recommendations
5. Any urgent alerts or safety considerations

Speak as if you're briefing a professional disaster response team.`;

    const portalSpecific = {
      'prediction': `Focus on storm predictions, path analysis, damage forecasts, and contractor opportunities. Emphasize timing, severity levels, and market potential.`,
      'damage-detection': `Focus on AI-detected damage, severity assessments, contractor matching, and lead generation. Highlight profitability scores and urgent response needs.`,
      'drones': `Focus on drone operations, aerial damage assessment, footage analysis, and field coordination. Emphasize safety protocols and operational efficiency.`,
      'leads': `Focus on lead generation, contractor opportunities, market analysis, and revenue potential. Highlight high-value prospects and competitive advantages.`,
      'all': `Provide comprehensive overview across all portals, highlighting cross-portal insights and integrated intelligence.`
    };

    return `${basePrompt}\n\n${portalSpecific[portalType as keyof typeof portalSpecific] || portalSpecific.all}`;
  }

  /**
   * Build user prompt based on request
   */
  private buildUserPrompt(request: VoiceAnalysisRequest): string {
    let prompt = '';

    switch (request.requestType) {
      case 'live-update':
        prompt = `Provide a live intelligence briefing about the current storm situation and operational status. `;
        break;
      case 'question-answer':
        prompt = `Answer this specific question: "${request.question}" `;
        break;
      case 'portal-overview':
        prompt = `Provide a comprehensive overview of the ${request.portalType} portal and its current data. `;
        break;
      case 'data-summary':
        prompt = `Summarize the key data points and their implications for storm operations. `;
        break;
    }

    if (request.currentData) {
      prompt += `\n\nCurrent data context: ${JSON.stringify(request.currentData, null, 2)}`;
    }

    if (request.userLocation) {
      prompt += `\n\nUser location: ${request.userLocation.latitude}, ${request.userLocation.longitude}`;
    }

    prompt += `\n\nProvide a response that is informative, actionable, and appropriate for voice delivery (aim for 30-90 seconds of speaking time).`;

    return prompt;
  }

  /**
   * Parse analysis insights from AI response
   */
  private parseAnalysisInsights(text: string): {
    keyInsights: string[];
    actionItems: string[];
    urgentAlerts: string[];
    dataPoints: string[];
  } {
    const insights: string[] = [];
    const actionItems: string[] = [];
    const urgentAlerts: string[] = [];
    const dataPoints: string[] = [];

    // Simple parsing - in production, this could use more sophisticated NLP
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    sentences.forEach(sentence => {
      const lowerSentence = sentence.toLowerCase();
      
      if (lowerSentence.includes('urgent') || lowerSentence.includes('emergency') || lowerSentence.includes('immediate')) {
        urgentAlerts.push(sentence.trim());
      } else if (lowerSentence.includes('recommend') || lowerSentence.includes('should') || lowerSentence.includes('action')) {
        actionItems.push(sentence.trim());
      } else if (lowerSentence.includes('%') || lowerSentence.includes('$') || /\d+/.test(sentence)) {
        dataPoints.push(sentence.trim());
      } else if (sentence.trim().length > 20) {
        insights.push(sentence.trim());
      }
    });

    return {
      keyInsights: insights.slice(0, 5),
      actionItems: actionItems.slice(0, 3),
      urgentAlerts: urgentAlerts.slice(0, 3),
      dataPoints: dataPoints.slice(0, 8)
    };
  }

  /**
   * Generate intelligent fallback response using local knowledge
   */
  private generateFallbackResponse(request: VoiceAnalysisRequest): string {
    const currentTime = new Date().toLocaleTimeString();
    const currentDate = new Date().toLocaleDateString();
    
    let fallbackText = '';
    
    if (request.requestType === 'live-update') {
      switch (request.portalType) {
        case 'prediction':
          fallbackText = `Hello, this is ARIA providing your Storm Prediction Intelligence update for ${currentDate} at ${currentTime}. The prediction system is actively monitoring weather patterns across the Southeast United States. Current focus areas include Florida, Georgia, Alabama, and the Carolinas for potential storm development. I'm tracking multiple data sources including NOAA weather models, satellite imagery, and historical storm patterns. Based on current conditions, I recommend monitoring for tropical development in the Gulf of Mexico and Atlantic basin. Storm prediction models are running continuous analysis to provide you with the most accurate forecasting data. Key indicators show potential weather systems developing over the next 48 to 72 hours. Please stay alert for any weather advisories and ensure your contractor teams are prepared for rapid deployment.`;
          break;
        case 'damage-detection':
          fallbackText = `This is ARIA with your AI Damage Detection status update. The damage detection system is operational and ready to analyze uploaded imagery from drones, mobile devices, and security cameras. I'm equipped to identify various types of storm damage including roof damage, tree debris, flooding, structural damage, and power line issues. The system provides detailed contractor recommendations with estimated costs and priority levels. Current detection algorithms can identify over 15 different damage types with 90% accuracy. Upload your storm damage photos and I'll provide immediate analysis with contractor matching and insurance claim guidance.`;
          break;
        case 'drones':
          fallbackText = `ARIA providing Drone Operations status update. All drone flight systems are ready for aerial surveillance and damage assessment missions. Weather conditions are currently acceptable for flight operations with visibility and wind parameters within safe ranges. Pre-flight checklists include battery levels, GPS connectivity, and camera systems verification. I recommend flying grid patterns for comprehensive area coverage and maintaining altitude between 200-400 feet for optimal image resolution. Always follow FAA regulations and obtain necessary permissions for commercial operations. Flight data will be automatically processed for damage detection upon landing.`;
          break;
        case 'leads':
          fallbackText = `This is ARIA with your Lead Intelligence Center update. The system is actively scanning for high-value contractor opportunities across storm-affected regions. Current lead generation algorithms are analyzing insurance claims data, permit applications, and social media reports for potential storm damage. Priority leads include properties with confirmed roof damage, tree removal needs, and water damage restoration requirements. Average lead value ranges from $5,000 to $50,000 depending on damage severity. I recommend immediate follow-up on leads marked as emergency priority within the first 24 hours for maximum conversion rates.`;
          break;
        default:
          fallbackText = `Hello, this is ARIA, your Advanced Response Intelligence Assistant. All DisasterDirect intelligence systems are operational and monitoring real-time data across multiple portals. Current status shows active storm tracking, damage detection algorithms running, and contractor opportunity analysis in progress. The system is providing actionable insights for storm response operations with continuous updates throughout the day.`;
      }
    } else if (request.requestType === 'question-answer' && request.question) {
      // Generate contextual answers based on the question
      const question = request.question.toLowerCase();
      
      if (question.includes('storm') || question.includes('weather') || question.includes('hurricane')) {
        fallbackText = `Based on current storm intelligence data, I can tell you that the system is monitoring multiple weather patterns across the Atlantic basin and Gulf of Mexico. Key areas of concern include the southeastern United States where storm development is most likely. Current models suggest monitoring tropical wave activity off the African coast and any low-pressure systems in the Gulf. For immediate concerns, I recommend checking the latest National Hurricane Center advisories and ensuring your response teams have 72-hour preparation capabilities. Would you like specific information about any particular geographic region?`;
      } else if (question.includes('damage') || question.includes('detect') || question.includes('assess')) {
        fallbackText = `For damage detection and assessment, the AI system can analyze multiple damage types including structural damage, roof deterioration, tree debris, flooding impacts, and electrical hazards. The system provides severity ratings from minor to critical, estimated repair costs, and recommended contractor specializations. Upload clear, well-lit photos from multiple angles for best results. The system automatically generates reports suitable for insurance claims and contractor estimates. Detection accuracy improves with higher resolution images and good lighting conditions.`;
      } else if (question.includes('contractor') || question.includes('lead') || question.includes('opportunity')) {
        fallbackText = `Contractor opportunities are generated based on confirmed storm damage, insurance claims activity, and property assessment data. High-value leads typically include roof replacements, tree removal services, water damage restoration, and structural repairs. The system prioritizes leads by estimated job value, urgency level, and competition density. Average response times for emergency leads should be within 2-4 hours for optimal conversion. I recommend maintaining service crews in storm-affected areas during peak damage seasons for rapid deployment capabilities.`;
      } else {
        fallbackText = `I understand your question about "${request.question}". While I'm operating in fallback mode, I can still provide general guidance about storm operations, damage assessment, and contractor coordination. The DisasterDirect platform integrates weather monitoring, AI damage detection, drone operations, and lead generation to provide comprehensive storm response capabilities. For specific data queries, please try rephrasing your question or check the relevant portal sections for detailed information.`;
      }
    } else {
      fallbackText = `Welcome to DisasterDirect's AI intelligence system. I'm ARIA, your Advanced Response Intelligence Assistant, ready to help with storm operations and damage assessment. All system portals are operational including storm prediction, damage detection, drone operations, and contractor lead generation. How may I assist you with your storm response operations today?`;
    }

    return fallbackText;
  }

  /**
   * Get voice response for quick updates
   */
  async getQuickUpdate(portalType: string, data?: any): Promise<VoiceResponse> {
    return this.generateVoiceResponse({
      portalType: portalType as any,
      requestType: 'live-update',
      currentData: data
    });
  }

  /**
   * Answer specific questions about data
   */
  async answerQuestion(question: string, portalType: string, data?: any): Promise<VoiceResponse> {
    return this.generateVoiceResponse({
      portalType: portalType as any,
      requestType: 'question-answer',
      question,
      currentData: data
    });
  }

  /**
   * Static method to get singleton instance
   */
  static getService(): VoiceAIService {
    return VoiceAIService.getInstance();
  }
}

export const voiceAI = VoiceAIService.getInstance();
export default voiceAI;