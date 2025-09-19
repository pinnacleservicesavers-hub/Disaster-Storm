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
          actionItems: ['Please refresh the page and try again'],
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
   * Generate fallback response when AI is unavailable
   */
  private generateFallbackResponse(request: VoiceAnalysisRequest): string {
    const fallbacks = {
      'prediction': 'Welcome to Storm Prediction Intelligence. The system is currently analyzing weather patterns and updating forecasts. Please check back in a moment for the latest storm tracking and damage predictions.',
      'damage-detection': 'AI Damage Detection is active and monitoring for storm damage. The system will provide automated analysis of uploaded imagery and generate contractor leads based on detected damage.',
      'drones': 'Drone Operations portal is ready for aerial surveillance and damage assessment. Please ensure all safety protocols are followed during flight operations.',
      'leads': 'Lead Intelligence Center is tracking contractor opportunities in your area. Monitor this portal for high-value prospects and market developments.',
      'all': 'DisasterDirect intelligence systems are operational. All portals are monitoring real-time data and providing actionable insights for storm response operations.'
    };

    return fallbacks[request.portalType as keyof typeof fallbacks] || fallbacks.all;
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