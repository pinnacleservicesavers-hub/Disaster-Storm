import OpenAI from 'openai';

export interface AdCopyRequest {
  businessType: string;
  targetAudience?: string;
  urgency?: string;
  serviceType?: string;
  location?: string;
  stormType?: string;
  budget?: number;
  platform?: string;
}

export interface AdCreativeRequest {
  adCopy: string;
  visualStyle?: string;
  damageType?: string;
  emotion?: string;
}

export interface AdStrategyRequest {
  stormData?: any;
  demographics?: any;
  budget: number;
  platforms: string[];
}

export interface FacebookAdSetupGuide {
  steps: Array<{
    title: string;
    description: string;
    actionItems: string[];
    tips: string[];
  }>;
}

export class AIAdsAssistantService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    console.log('🎨 AI Ads Assistant initialized with OpenAI GPT-4 and DALL-E');
  }

  /**
   * Generate compelling ad copy that makes people stop and look
   */
  async generateAdCopy(request: AdCopyRequest): Promise<string[]> {
    const prompt = `You are an expert advertising copywriter specializing in emergency services and disaster restoration.

Create 3 compelling, attention-grabbing ad copy variations for:
- Business Type: ${request.businessType}
- Target Audience: ${request.targetAudience || 'homeowners affected by storm damage'}
- Service: ${request.serviceType || 'emergency restoration'}
- Location: ${request.location || 'local area'}
${request.stormType ? `- Storm Type: ${request.stormType}` : ''}
${request.urgency ? `- Urgency Level: ${request.urgency}` : ''}

Requirements:
1. Make people STOP scrolling - use emotion, urgency, or curiosity
2. Be empathetic but action-oriented
3. Include a clear, compelling call-to-action
4. Keep it concise (40-80 words each)
5. Use power words that create urgency without being pushy
6. Platform: ${request.platform || 'Facebook/Meta'}

Return ONLY the 3 ad copy variations, numbered 1-3, nothing else.`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an award-winning advertising copywriter who creates ads that stop people in their tracks and convert. You specialize in emergency services and understand the psychology of disaster victims.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.9,
      max_tokens: 800
    });

    const content = response.choices[0].message.content || '';
    
    // Parse the response into separate variations
    const variations = content
      .split(/\d+\.\s+/)
      .filter(v => v.trim().length > 20)
      .map(v => v.trim());

    return variations.length > 0 ? variations : [content];
  }

  /**
   * Generate eye-catching ad visuals using DALL-E
   */
  async generateAdCreative(request: AdCreativeRequest): Promise<string> {
    const visualPrompt = `Professional, high-quality advertising image for emergency restoration services:
    
${request.adCopy}

Style: ${request.visualStyle || 'Professional, trustworthy, clean, modern'}
${request.damageType ? `Showing: ${request.damageType}` : ''}
Emotion: ${request.emotion || 'Hopeful, reliable, professional'}

Requirements:
- Photo-realistic quality
- Professional service company aesthetic
- Before/after imagery if relevant
- Clean, uncluttered composition
- Emergency services branding feel
- Trust-building visuals
- No text overlay needed`;

    const response = await this.openai.images.generate({
      model: 'dall-e-3',
      prompt: visualPrompt,
      n: 1,
      size: '1024x1024',
      quality: 'standard'
    });

    return response.data[0].url || '';
  }

  /**
   * Get AI-powered advertising strategy recommendations
   */
  async getAdStrategy(request: AdStrategyRequest): Promise<any> {
    const prompt = `As an expert digital advertising strategist for disaster restoration services, analyze this scenario and provide a comprehensive ad strategy:

Budget: $${request.budget}
Platforms: ${request.platforms.join(', ')}
${request.stormData ? `Storm Data: ${JSON.stringify(request.stormData)}` : ''}
${request.demographics ? `Demographics: ${JSON.stringify(request.demographics)}` : ''}

Provide a strategic recommendation including:
1. Budget allocation across platforms
2. Target audience segmentation
3. Ad timing and scheduling strategy
4. Geographic targeting recommendations
5. Creative approach and messaging themes
6. Expected KPIs and benchmarks
7. Optimization tactics

Format as JSON with these keys: budgetAllocation, audienceSegments, timing, geoTargeting, creativeThemes, kpis, optimizationTips`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert digital advertising strategist specializing in emergency services and disaster restoration. You understand storm patterns, demographics, and how to maximize ROI for time-sensitive campaigns.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' }
    });

    return JSON.parse(response.choices[0].message.content || '{}');
  }

  /**
   * Generate step-by-step Facebook/Meta Ads setup guide
   */
  async getFacebookAdSetupGuide(businessInfo: any): Promise<FacebookAdSetupGuide> {
    const prompt = `Create a detailed, step-by-step guide for setting up Facebook/Meta ads for:

Business: ${businessInfo.name || 'Storm Restoration Services'}
Service: ${businessInfo.service || 'Emergency restoration'}
Experience Level: ${businessInfo.experience || 'Beginner'}

Provide a comprehensive guide that walks them through:
1. Facebook Business Manager setup
2. Creating ad account
3. Setting up pixel tracking
4. Audience creation and targeting
5. Campaign structure (awareness, consideration, conversion)
6. Ad creative best practices
7. Budget and bidding strategy
8. Performance monitoring and optimization

Format as JSON with steps array, each containing: title, description, actionItems (array), tips (array)`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a Facebook/Meta advertising expert who teaches businesses how to set up and run successful ad campaigns. You explain complex processes in simple, actionable steps.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.6,
      response_format: { type: 'json_object' }
    });

    return JSON.parse(response.choices[0].message.content || '{"steps":[]}');
  }

  /**
   * Optimize existing ad campaign based on performance
   */
  async optimizeCampaign(campaignData: any): Promise<any> {
    const prompt = `Analyze this ad campaign performance and provide optimization recommendations:

Campaign: ${campaignData.name}
Platform: ${campaignData.platforms?.join(', ')}
Impressions: ${campaignData.impressions || 0}
Clicks: ${campaignData.clicks || 0}
Conversions: ${campaignData.conversions || 0}
Spend: $${campaignData.spend || 0}
CTR: ${campaignData.impressions ? ((campaignData.clicks / campaignData.impressions) * 100).toFixed(2) : 0}%

Provide specific, actionable optimization recommendations including:
1. Performance assessment (what's working, what's not)
2. Audience refinement suggestions
3. Creative improvements
4. Bidding strategy adjustments
5. Budget reallocation recommendations
6. A/B testing suggestions
7. Priority actions to take immediately

Format as JSON with these keys: assessment, audienceOptimization, creativeOptimization, biddingStrategy, budgetRecommendations, abTests, immediateActions`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a performance marketing expert who specializes in optimizing ad campaigns for maximum ROI. You provide data-driven, actionable recommendations.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' }
    });

    return JSON.parse(response.choices[0].message.content || '{}');
  }

  /**
   * Interactive AI chat for ad questions and guidance
   */
  async chatAssistant(message: string, context?: any): Promise<string> {
    const systemPrompt = `You are an expert AI assistant for social media advertising, specializing in Facebook/Meta, Google, Instagram, and YouTube ads for emergency services and storm restoration businesses.

You help users:
- Create compelling ad campaigns
- Navigate Facebook Business Manager
- Optimize ad performance
- Target the right audiences
- Create attention-grabbing creatives
- Manage budgets effectively
- Set up tracking and analytics

Be conversational, helpful, and actionable. Provide specific steps when asked how to do something.`;

    const messages: any[] = [
      { role: 'system', content: systemPrompt }
    ];

    if (context?.previousMessages) {
      messages.push(...context.previousMessages);
    }

    messages.push({ role: 'user', content: message });

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages,
      temperature: 0.7,
      max_tokens: 1000
    });

    return response.choices[0].message.content || 'I apologize, but I was unable to generate a response. Please try again.';
  }

  /**
   * Generate headline variations optimized for attention
   */
  async generateHeadlines(topic: string, count: number = 5): Promise<string[]> {
    const prompt = `Create ${count} attention-grabbing headlines for ${topic}.

Requirements:
- Make people STOP scrolling
- Use curiosity, emotion, or urgency
- Keep under 60 characters
- Include power words
- Be specific and benefit-focused

Return ONLY the headlines, numbered 1-${count}.`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a master copywriter who creates headlines that stop people in their tracks.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.9,
      max_tokens: 300
    });

    const content = response.choices[0].message.content || '';
    return content
      .split(/\d+\.\s+/)
      .filter(h => h.trim().length > 5)
      .map(h => h.trim());
  }
}

export const aiAdsAssistant = new AIAdsAssistantService();
