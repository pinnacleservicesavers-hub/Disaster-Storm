import OpenAI from 'openai';

export interface FreeformAdRequest {
  prompt: string;
  adType?: 'image' | 'video_concept' | 'full_campaign';
  style?: string;
  platform?: string;
  includeImage?: boolean;
}

export interface FreeformAdResult {
  adCopy: string;
  headlines: string[];
  callToAction: string;
  imageUrl?: string;
  videoScript?: string;
  videoConcept?: {
    scenes: Array<{ description: string; duration: string; voiceover: string; visualNotes: string }>;
    music: string;
    totalDuration: string;
    style: string;
  };
  hashtags: string[];
  platforms: string[];
  targetAudience: string;
}

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
    const prompt = `You are an elite advertising copywriter who creates content for ANY industry worldwide.

Create 3 compelling, attention-grabbing ad copy variations for:
- Business Type: ${request.businessType}
- Target Audience: ${request.targetAudience || 'ideal customers'}
- Service: ${request.serviceType || 'professional services'}
- Location: ${request.location || 'local area'}
${request.stormType ? `- Context: ${request.stormType}` : ''}
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
          content: 'You are an award-winning advertising copywriter who creates ads for ANY industry or business type. You have zero creative limits. You create content that stops people in their tracks and converts — for contractors, restaurants, tech, fitness, real estate, automotive, entertainment, healthcare, retail, and every industry that exists.'
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
    const visualPrompt = `Professional, high-quality advertising image:
    
${request.adCopy}

Style: ${request.visualStyle || 'Professional, trustworthy, clean, modern'}
${request.damageType ? `Showing: ${request.damageType}` : ''}
Emotion: ${request.emotion || 'Hopeful, reliable, professional'}

Requirements:
- Photo-realistic quality
- Professional aesthetic matching the industry
- Clean, uncluttered composition
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
    const prompt = `As an expert digital advertising strategist for any industry, analyze this scenario and provide a comprehensive ad strategy:

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
          content: 'You are an expert digital advertising strategist for ANY industry or business type. You understand demographics, market dynamics, and how to maximize ROI for campaigns across every sector — from contractors and restaurants to tech startups, fitness, real estate, entertainment, and beyond.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
    });

    const stratContent = response.choices[0].message.content || '{}';
    const stratJson = stratContent.match(/\{[\s\S]*\}/);
    return JSON.parse(stratJson ? stratJson[0] : '{}');
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
    });

    const fbContent = response.choices[0].message.content || '{"steps":[]}';
    const fbJson = fbContent.match(/\{[\s\S]*\}/);
    return JSON.parse(fbJson ? fbJson[0] : '{"steps":[]}');
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
    });

    const optContent = response.choices[0].message.content || '{}';
    const optJson = optContent.match(/\{[\s\S]*\}/);
    return JSON.parse(optJson ? optJson[0] : '{}');
  }

  /**
   * Interactive AI chat for ad questions and guidance
   */
  async chatAssistant(message: string, context?: any): Promise<string> {
    const systemPrompt = `You are an expert AI assistant for social media advertising across ALL industries and business types. You help with Facebook/Meta, Google, Instagram, YouTube, TikTok, LinkedIn, and every advertising platform.

You help users:
- Create compelling ad campaigns for ANY industry
- Navigate advertising platforms
- Optimize ad performance
- Target the right audiences
- Create attention-grabbing creatives
- Manage budgets effectively
- Set up tracking and analytics
- Sound design and audio branding

You have ZERO creative limits. Whatever industry, niche, or business type — you deliver world-class advertising guidance.

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

  async createFreeformAd(request: FreeformAdRequest): Promise<FreeformAdResult> {
    const isVideo = request.adType === 'video_concept';
    const isCampaign = request.adType === 'full_campaign';
    
    const systemPrompt = `You are an elite creative director and advertising genius. You create ads that go viral, win awards, and drive massive results. You have no creative limits — you push boundaries and create content that captivates.

Your specialty is creating advertising content for ANY industry — contractor services, tech, lifestyle, food, fitness, automotive, real estate, entertainment, and more. You match the tone and style to whatever the user describes.

Rules:
- Be bold, creative, and fearless
- Match the exact vibe the user describes
- Create content that stops the scroll
- Think like the best agencies in the world
- If they want edgy, go edgy. If they want heartfelt, pour emotion into it.
- No generic corporate speak — every word should hit hard`;

    const copyPrompt = `The user wants this ad created:

"${request.prompt}"

${request.style ? `Style preference: ${request.style}` : ''}
${request.platform ? `Target platform: ${request.platform}` : ''}
${isVideo ? 'This is a VIDEO AD concept.' : ''}
${isCampaign ? 'This is a FULL CAMPAIGN with multiple pieces.' : ''}

Generate a complete ad package as JSON with these fields:
{
  "adCopy": "The main ad copy text (compelling, scroll-stopping, 50-150 words)",
  "headlines": ["5 killer headline variations"],
  "callToAction": "The perfect CTA button text",
  "hashtags": ["10 relevant trending hashtags"],
  "platforms": ["Best platforms for this ad"],
  "targetAudience": "Who this ad targets and why"${isVideo || isCampaign ? `,
  "videoScript": "A 30-60 second video script with narration and visual directions",
  "videoConcept": {
    "scenes": [
      {
        "description": "What happens visually",
        "duration": "How long this scene lasts",
        "voiceover": "What the narrator says",
        "visualNotes": "Camera angles, effects, transitions"
      }
    ],
    "music": "Music style/mood recommendation",
    "totalDuration": "Total video length",
    "style": "Overall visual style"
  }` : ''}
}

Make it exceptional. Make it unforgettable.`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: copyPrompt }
      ],
      temperature: 1.0,
      max_tokens: 2000,
    });

    const freeContent = response.choices[0].message.content || '{}';
    const freeJson = freeContent.match(/\{[\s\S]*\}/);
    const result = JSON.parse(freeJson ? freeJson[0] : '{}');

    if (request.includeImage !== false) {
      try {
        const imagePrompt = `Create a stunning, professional advertising visual for: ${request.prompt}. 
Style: ${request.style || 'Modern, bold, eye-catching'}.
Make it look like a premium agency-produced ad image. Ultra high quality, cinematic lighting, professional composition. No text or words in the image.`;
        
        const imgResponse = await this.openai.images.generate({
          model: 'dall-e-3',
          prompt: imagePrompt,
          n: 1,
          size: '1024x1024',
          quality: 'hd'
        });
        
        result.imageUrl = imgResponse.data[0]?.url || '';
      } catch (imgErr) {
        console.error('Image generation failed, trying Replit AI:', imgErr);
        try {
          const replitOpenai = new OpenAI({
            apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
            baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
          });
          const imgResponse = await replitOpenai.images.generate({
            model: 'gpt-image-1',
            prompt: `Stunning professional ad visual for: ${request.prompt}. ${request.style || 'Modern, bold, eye-catching'}. Ultra high quality, no text.`,
            n: 1,
            size: '1024x1024',
          });
          if (imgResponse.data[0]?.b64_json) {
            result.imageUrl = `data:image/png;base64,${imgResponse.data[0].b64_json}`;
          } else if (imgResponse.data[0]?.url) {
            result.imageUrl = imgResponse.data[0].url;
          }
        } catch (replitErr) {
          console.error('Replit AI image generation also failed:', replitErr);
        }
      }
    }

    return result;
  }

  async generateImageOnly(prompt: string, style?: string): Promise<string> {
    try {
      const imagePrompt = `${prompt}. Style: ${style || 'Professional, cinematic, high-end advertising'}. No text or watermarks. Ultra high quality.`;
      const response = await this.openai.images.generate({
        model: 'dall-e-3',
        prompt: imagePrompt,
        n: 1,
        size: '1024x1024',
        quality: 'hd'
      });
      return response.data[0]?.url || '';
    } catch (err) {
      console.error('DALL-E failed, trying Replit AI:', err);
      const replitOpenai = new OpenAI({
        apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
        baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
      });
      const response = await replitOpenai.images.generate({
        model: 'gpt-image-1',
        prompt: `${prompt}. ${style || 'Professional, cinematic'}. No text. Ultra high quality.`,
        n: 1,
        size: '1024x1024',
      });
      if (response.data[0]?.b64_json) {
        return `data:image/png;base64,${response.data[0].b64_json}`;
      }
      return response.data[0]?.url || '';
    }
  }
  async createSoundDesign(request: { prompt: string; type: string; voiceStyle?: string; duration?: string; industry?: string }): Promise<any> {
    const typeInstructions: Record<string, string> = {
      'voice_ad': `Create a complete voice-over ad with:
- Full script with pause/tone/emphasis markers
- Voice direction (tone, pacing, emotion shifts)
- Sound effect cues with timestamps
- Background music recommendations
- Total duration and pacing breakdown`,
      'radio_ad': `Create a complete radio-ready ad with:
- Opening hook (2-3 seconds)
- Full narrator script with dramatic pauses marked as [PAUSE]
- Sound effects list with exact placement: [SFX: description]
- Music bed description with mood changes
- Volume/intensity markers: [SOFT], [BUILD], [PEAK], [DROP]
- Closing with CTA and contact info placeholder
- Total duration target: ${request.duration || '30 seconds'}`,
      'sound_design': `Create a cinematic sound design concept with:
- Layer-by-layer sound breakdown (ambient, effects, music, voice)
- Emotional arc mapped to sound changes
- Specific sound effects with descriptions
- Music composition direction
- Audio psychology notes (bass depth, tempo, reverb, silence)
- 3D spatial audio suggestions`,
      'brand_audio': `Create a complete brand audio identity with:
- 3-second audio logo concept (signature sound description)
- Jingle/tagline music direction
- Hold music style
- Notification sounds
- Emotional tone profile
- Sound palette (what instruments, textures, frequencies define the brand)`,
      'voice_script': `Create a professional voice-infused script with:
- Full script text with embedded markers:
  [PAUSE 1s], [PAUSE 2s] for dramatic pauses
  [TONE: urgent], [TONE: warm], [TONE: authoritative] for voice shifts
  [VOLUME: whisper], [VOLUME: normal], [VOLUME: powerful] for intensity
  [EMPHASIS] before key words
  [MUSIC: build], [MUSIC: drop], [MUSIC: swell] for soundtrack cues
  [SFX: description] for sound effects
- Voice casting recommendation
- Emotional journey map`
    };

    const systemPrompt = `You are a world-class sound designer, audio engineer, and voice director who creates Hollywood-level audio experiences for ANY industry. You have ZERO creative limits.

You create cinematic sound experiences for:
- Emergency services & disaster response
- Construction & contractors
- Restaurants & food service
- Technology & SaaS
- Fitness & wellness
- Real estate & property
- Automotive & transportation
- Entertainment & media
- Healthcare & medical
- Retail & e-commerce
- Legal & professional services
- Education & training
- Finance & insurance
- Agriculture & farming
- Manufacturing & industrial
- Beauty & fashion
- Travel & hospitality
- Sports & recreation
- Non-profit & community
- ANY other industry that exists

You understand audio psychology, emotional sound design, brand audio identity, and how to create content that dominates the senses. Every sound decision is intentional and powerful.`;

    const userPrompt = `Create the following for this request:

"${request.prompt}"

Type: ${request.type}
${request.voiceStyle ? `Voice Style: ${request.voiceStyle}` : ''}
${request.duration ? `Target Duration: ${request.duration}` : ''}
${request.industry ? `Industry: ${request.industry}` : ''}

${typeInstructions[request.type] || typeInstructions['voice_ad']}

Return as JSON with these fields:
{
  "title": "Creative title for this audio piece",
  "script": "The full script/content with all markers and directions",
  "voiceDirection": "Complete voice casting and direction notes",
  "soundEffects": ["Array of specific sound effects with placement"],
  "musicDirection": "Background music/score recommendation",
  "emotionalArc": "Description of the emotional journey",
  "duration": "Estimated total duration",
  "productionNotes": "Technical production recommendations",
  "audioLayers": [
    {"layer": "Voice", "description": "Details"},
    {"layer": "Music", "description": "Details"},
    {"layer": "SFX", "description": "Details"},
    {"layer": "Ambient", "description": "Details"}
  ]
}`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt + '\n\nYou MUST respond with valid JSON only. No markdown, no code blocks, just raw JSON.' },
        { role: 'user', content: userPrompt }
      ],
      temperature: 1.0,
      max_tokens: 3000,
    });
    const soundContent = response.choices[0].message.content || '{}';
    const soundJson = soundContent.match(/\{[\s\S]*\}/);
    return JSON.parse(soundJson ? soundJson[0] : '{}');
  }

  async generateVoiceOver(text: string, voiceStyle?: string): Promise<{ audioBase64: string; format: string; voice: string }> {
    const elevenLabsApiKey = process.env.ELEVENLABS_API_KEY;
    
    const voiceMap: Record<string, { id: string; settings: any }> = {
      'rachel': { id: '21m00Tcm4TlvDq8ikWAM', settings: { stability: 0.71, similarity_boost: 0.76, style: 0.32 } },
      'calm_authority': { id: '21m00Tcm4TlvDq8ikWAM', settings: { stability: 0.85, similarity_boost: 0.80, style: 0.15 } },
      'urgent_dispatcher': { id: '21m00Tcm4TlvDq8ikWAM', settings: { stability: 0.45, similarity_boost: 0.70, style: 0.65 } },
      'cinematic_trailer': { id: '21m00Tcm4TlvDq8ikWAM', settings: { stability: 0.90, similarity_boost: 0.85, style: 0.50 } },
      'friendly_neighbor': { id: '21m00Tcm4TlvDq8ikWAM', settings: { stability: 0.60, similarity_boost: 0.65, style: 0.45 } },
      'corporate_executive': { id: '21m00Tcm4TlvDq8ikWAM', settings: { stability: 0.88, similarity_boost: 0.82, style: 0.20 } },
      'high_energy_sales': { id: '21m00Tcm4TlvDq8ikWAM', settings: { stability: 0.35, similarity_boost: 0.75, style: 0.80 } },
      'luxury_brand': { id: '21m00Tcm4TlvDq8ikWAM', settings: { stability: 0.92, similarity_boost: 0.88, style: 0.10 } },
    };

    const selectedVoice = voiceMap[voiceStyle || 'rachel'] || voiceMap['rachel'];
    
    if (!elevenLabsApiKey) {
      const openAiKey = process.env.OPENAI_API_KEY;
      if (!openAiKey) throw new Error('No voice service available');
      
      const response = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${openAiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'tts-1-hd', voice: 'nova', input: text.slice(0, 4096), response_format: 'mp3', speed: 1.0 })
      });
      if (!response.ok) throw new Error('OpenAI TTS failed');
      const buf = Buffer.from(await response.arrayBuffer());
      return { audioBase64: buf.toString('base64'), format: 'mp3', voice: 'nova' };
    }

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${selectedVoice.id}`, {
      method: 'POST',
      headers: { 'Accept': 'audio/mpeg', 'xi-api-key': elevenLabsApiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: text.slice(0, 4096),
        model_id: 'eleven_turbo_v2_5',
        voice_settings: { ...selectedVoice.settings, use_speaker_boost: true }
      })
    });

    if (!response.ok) throw new Error('ElevenLabs TTS failed');
    const buf = Buffer.from(await response.arrayBuffer());
    return { audioBase64: buf.toString('base64'), format: 'mp3', voice: voiceStyle || 'rachel' };
  }
}

export const aiAdsAssistant = new AIAdsAssistantService();
