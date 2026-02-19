import OpenAI from 'openai';

export interface FreeformAdRequest {
  prompt: string;
  adType?: 'image' | 'video_concept' | 'full_campaign' | 'animated';
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
          content: 'You are an award-winning advertising copywriter who creates ads for ANY industry or business type. You have zero creative limits. You create content that stops people in their tracks and converts — for contractors, restaurants, tech, fitness, real estate, automotive, entertainment, healthcare, retail, and every industry that exists. CRITICAL: Perfect spelling and grammar are NON-NEGOTIABLE. Triple-check every word before outputting. This content will be posted publicly. Zero typos allowed.'
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
ABSOLUTE RULE — ZERO TEXT: Do NOT render ANY text, words, letters, numbers, logos, watermarks, typography, signage, banners, labels, captions, phone numbers, URLs, titles, headings, bullet points, or ANY written characters whatsoever in the image. The image must be PURELY VISUAL — only photos, illustrations, and graphics with zero text elements. Text will be overlaid separately in post-production. If the image contains even a single letter or number it is a failure.`;

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
          content: 'You are a master copywriter who creates headlines that stop people in their tracks. CRITICAL: Every headline must have PERFECT spelling and grammar — zero typos allowed. Triple-check every word before outputting. These headlines will be posted publicly.'
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
    const isAnimated = request.adType === 'animated';
    
    const systemPrompt = `You are an elite creative director and advertising genius. You create ads that go viral, win awards, and drive massive results. You have no creative limits — you push boundaries and create content that captivates.

Your specialty is creating advertising content for ANY industry — contractor services, tech, lifestyle, food, fitness, automotive, real estate, entertainment, and more. You match the tone and style to whatever the user describes.

Rules:
- Be bold, creative, and fearless
- Match the exact vibe the user describes
- Create content that stops the scroll
- Think like the best agencies in the world
- If they want edgy, go edgy. If they want heartfelt, pour emotion into it.
- No generic corporate speak — every word should hit hard

CRITICAL QUALITY RULES — THESE ARE NON-NEGOTIABLE:
- PERFECT SPELLING: Triple-check every single word. Zero typos allowed. This content will be posted publicly.
- PERFECT GRAMMAR: Every sentence must be grammatically flawless. Use proper punctuation, capitalization, and sentence structure.
- PROOFREAD EVERYTHING: Before outputting, mentally proofread all ad copy, headlines, CTAs, hashtags, video scripts, and voiceover text as if it were going live on TV or a billboard today.
- PROFESSIONAL QUALITY: This content represents real businesses. One spelling error destroys credibility. Treat every word like it costs $1,000 to fix.
- NO MADE-UP WORDS: Only use real, correctly-spelled English words. Double-check brand names, industry terms, and technical vocabulary.`;

    const copyPrompt = `The user wants this ad created:

"${request.prompt}"

${request.style ? `Style preference: ${request.style}` : ''}
${request.platform ? `Target platform: ${request.platform}` : ''}
${isVideo ? 'This is a VIDEO AD concept.' : ''}
${isCampaign ? 'This is a FULL CAMPAIGN with multiple pieces.' : ''}
${isAnimated ? 'This is an ANIMATED/CARTOON ad. Create it with an animated, illustrated, or cartoon style. Include animation direction notes.' : ''}

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
        { role: 'system', content: systemPrompt + '\n\nIMPORTANT: You MUST respond with ONLY valid JSON. No markdown, no code fences, no explanation — just the raw JSON object. Ensure all strings are properly escaped and no trailing commas exist.' },
        { role: 'user', content: copyPrompt }
      ],
      temperature: 0.9,
      max_tokens: 3500,
    });

    const freeContent = response.choices[0].message.content || '{}';
    let result: any;
    try {
      result = JSON.parse(freeContent);
    } catch {
      const freeJson = freeContent.match(/\{[\s\S]*\}/);
      let cleaned = freeJson ? freeJson[0] : '{}';
      cleaned = cleaned.replace(/,\s*([}\]])/g, '$1');
      cleaned = cleaned.replace(/[\x00-\x1F\x7F]/g, (ch) => {
        if (ch === '\n') return '\\n';
        if (ch === '\r') return '\\r';
        if (ch === '\t') return '\\t';
        return '';
      });
      try {
        result = JSON.parse(cleaned);
      } catch (e2) {
        console.error('Failed to parse AI ad response after cleaning:', e2);
        console.error('Raw response:', freeContent.substring(0, 500));
        result = {
          adCopy: "Ad generation completed but formatting failed. Please try again.",
          headlines: ["Try Again"],
          callToAction: "Create Ad",
          hashtags: ["#ad"],
          platforms: ["All"],
          targetAudience: "General audience"
        };
      }
    }

    if (request.includeImage !== false) {
      const stripTextConcepts = (p: string) => {
        return p.replace(/\b(brochure|tri-fold|trifold|flyer|pamphlet|booklet|menu|listing|headline|heading|title|subtitle|caption|label|tagline|slogan|bullet point|bullet list|contact info|phone number|address|email|URL|website|QR code|coupon|discount code|pricing|price list|service list|testimonial quote|review text|certification badge|logo text|banner text|sign text)\b/gi, '')
          .replace(/\s{2,}/g, ' ').trim();
      };
      const cleanedPrompt = stripTextConcepts(request.prompt);

      const noTextRule = `ABSOLUTE RULE — ZERO TEXT IN IMAGE: This image is a HERO PHOTOGRAPH ONLY — it will be used as a background visual. ALL text, copy, headlines, and information will be added separately in a design tool AFTER this image is created. Therefore: Do NOT render ANY text, words, letters, numbers, logos, watermarks, typography, signage, banners, labels, captions, phone numbers, URLs, titles, headings, bullet points, price tags, badges, certificates, stamps, seals, or ANY written characters whatsoever in the image. The image must contain ZERO text elements — not even a single letter, number, or symbol. Render ONLY the photographic scene with people, objects, and environments. Any text in the image is an automatic failure.`;

      try {
        const isComicalStyle = request.style === 'comical';
        const isAnimatedStyle = request.style === 'animated' || isAnimated;

        let imagePrompt: string;
        if (isAnimatedStyle) {
          imagePrompt = `Create a vibrant, colorful ANIMATED CARTOON illustration showing the SCENE described here: ${cleanedPrompt}. 
Style: Pixar/Disney-quality 3D animated look, bright saturated colors, fun character designs, exaggerated proportions.
- Characters should be appealing cartoon versions with expressive faces
- Use bold colors, clean lines, and dynamic poses
- Make it look like a frame from a premium animated commercial
- Fun, energetic, family-friendly cartoon aesthetic
- DO NOT create a layout, poster, or document — create ONLY a single scene illustration
${noTextRule}`;
        } else if (isComicalStyle) {
          imagePrompt = `Create a FUNNY, HUMOROUS photograph or illustration showing the SCENE described here: ${cleanedPrompt}. 
Style: Comedic, witty, makes people laugh out loud.
- Use visual humor, funny situations, exaggerated expressions, or absurd scenarios
- Think of the funniest Super Bowl commercial ever — that energy
- Keep it clean humor but genuinely funny, not corny
- Bright, eye-catching colors that make people stop scrolling
- DO NOT create a layout, poster, or document — create ONLY a single scene image
${noTextRule}`;
        } else {
          imagePrompt = `Create a REALISTIC, PHOTOJOURNALISTIC hero photograph showing the SCENE described here: ${cleanedPrompt}. 
Style: ${request.style || 'Professional documentary-style photography'}.
CRITICAL PHOTOGRAPHY RULES:
- This is a SINGLE HERO PHOTOGRAPH — NOT a brochure, NOT a layout, NOT a document, NOT a poster
- This must look like a REAL PHOTOGRAPH taken by a professional photographer on a job site or location
- Use natural daylight lighting, real-world environments, realistic human proportions and clothing
- Workers should wear standard industry PPE (hard hats, safety vests, work boots) — NOT sci-fi or fantasy gear
- Show realistic equipment, tools, vehicles, and job site conditions
- The scene should look like it was captured during actual work — candid, authentic, documentary-style
- NO fantasy, sci-fi, futuristic, neon, glowing, or surreal elements whatsoever
- NO robotic, cyborg, or otherworldly imagery
- Think National Geographic photographer documenting real contractor work
- Professional composition with depth of field, natural colors, realistic textures
- DO NOT create any layout, grid, panels, columns, sections, or multi-panel design
${noTextRule}`;
        }
        
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
            prompt: `Realistic professional hero photograph showing the scene for: ${cleanedPrompt}. ${request.style || 'Documentary-style, natural lighting'}. Must look like a REAL photograph — natural daylight, real people in standard work gear, real job sites. This is a SINGLE PHOTO, not a brochure or layout. NO fantasy, sci-fi, neon, or surreal elements. Think photojournalism. ${noTextRule}`,
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
      const imagePrompt = `Create a REALISTIC, PHOTOJOURNALISTIC image for: ${prompt}. Style: ${style || 'Professional documentary-style photography'}. Must look like a REAL PHOTOGRAPH — natural daylight, real people in standard work gear, real environments. NO fantasy, sci-fi, futuristic, neon, glowing, or surreal elements. Think professional photojournalism. ABSOLUTE RULE — ZERO TEXT: Do NOT render ANY text, words, letters, numbers, logos, watermarks, typography, signage, labels, phone numbers, URLs, captions, or ANY written characters whatsoever. The image must be PURELY VISUAL with zero text elements. Text will be added separately in post-production.`;
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
        prompt: `Realistic professional photography for: ${prompt}. ${style || 'Documentary-style, natural lighting'}. Must look like a REAL photograph. NO fantasy, sci-fi, or surreal elements. ABSOLUTE RULE — ZERO TEXT: Do NOT render ANY text, words, letters, numbers, logos, watermarks, typography, signage, or ANY written characters in the image. Purely visual only.`,
        n: 1,
        size: '1024x1024',
      });
      if (response.data[0]?.b64_json) {
        return `data:image/png;base64,${response.data[0].b64_json}`;
      }
      return response.data[0]?.url || '';
    }
  }
  async generateBrochure(prompt: string): Promise<any> {
    const systemPrompt = `You are an expert brochure designer and copywriter. You create professional, typo-free brochure content for businesses. Your job is to extract the business information from the user's description and organize it into clean brochure panels.

CRITICAL QUALITY RULES:
- PERFECT SPELLING: Triple-check every word. Zero typos. This will be printed and distributed.
- PERFECT GRAMMAR: Every sentence must be grammatically flawless.
- USE ONLY THE INFORMATION PROVIDED: Do not invent phone numbers, websites, certifications, or services the user did not mention.
- PROFESSIONAL TONE: Clean, authoritative, trustworthy language.

You must respond with ONLY valid JSON (no markdown, no code fences).`;

    const userPrompt = `Create professional TRI-FOLD brochure content from this description:

"${prompt}"

A real tri-fold brochure has TWO SIDES printed on one sheet of paper (11x8.5 inches):

OUTSIDE (Page 1 — what you see when the brochure is folded):
  - Panel 1: FRONT COVER (right third) — the first thing people see. Company name, tagline, hero visual area, phone number.
  - Panel 2: BACK COVER (center third) — contact info, credentials, map/address, social media, QR code placeholder.
  - Panel 3: INSIDE FLAP (left third, slightly narrower) — teaser content, special offer, or "Why Choose Us" to entice opening.

INSIDE (Page 2 — what you see when the brochure is opened flat):
  - Panel 4: INSIDE LEFT — first content panel (e.g., About Us, Our Story, Mission).
  - Panel 5: INSIDE CENTER — main services/features panel.
  - Panel 6: INSIDE RIGHT — additional services, testimonials, or call-to-action panel.

Generate a JSON object with this exact structure:
{
  "companyName": "The company name",
  "tagline": "The company tagline or slogan",
  "phone": "The phone number provided",
  "website": "The website provided",
  "credentials": ["credential1", "credential2"],
  "accentColor": "#D4FF00",
  "outsidePanels": [
    {
      "position": "front_cover",
      "title": "COMPANY NAME",
      "subtitle": "tagline",
      "body": ["Professional description line"],
      "highlights": ["FREE ESTIMATES", "24/7 EMERGENCY"],
      "footer": ""
    },
    {
      "position": "back_cover",
      "title": "CONTACT US",
      "subtitle": "",
      "body": ["Address line", "Phone: 800-555-1234", "Website: company.com", "Email: info@company.com"],
      "highlights": ["Licensed • Insured • Bonded"],
      "footer": "Serving the community since 2010"
    },
    {
      "position": "inside_flap",
      "title": "WHY CHOOSE US",
      "subtitle": "",
      "body": ["✔ Reason 1", "✔ Reason 2", "✔ Reason 3"],
      "highlights": ["SPECIAL OFFER"],
      "footer": ""
    }
  ],
  "insidePanels": [
    {
      "position": "inside_left",
      "title": "ABOUT US",
      "subtitle": "Our Story",
      "body": ["Description of company history and mission"],
      "highlights": [],
      "footer": ""
    },
    {
      "position": "inside_center",
      "title": "OUR SERVICES",
      "subtitle": "What We Do",
      "body": ["✔ Service 1", "✔ Service 2", "✔ Service 3", "✔ Service 4"],
      "highlights": ["QUALITY GUARANTEED"],
      "footer": ""
    },
    {
      "position": "inside_right",
      "title": "GET STARTED",
      "subtitle": "Ready to begin?",
      "body": ["✔ Step 1: Call for free estimate", "✔ Step 2: We assess your needs", "✔ Step 3: Work begins"],
      "highlights": ["CALL TODAY"],
      "footer": ""
    }
  ]
}

Rules:
- Create EXACTLY 3 outsidePanels and EXACTLY 3 insidePanels (6 total for a proper tri-fold)
- Front cover: company name prominent, tagline, key credentials, phone number
- Back cover: full contact details, credentials list, service area, social media placeholders
- Inside flap: teaser to entice reader to open — "Why Choose Us" or a special offer
- Inside panels: organize services/content logically across all 3 inside panels
- Use ✔ prefix for service/feature lists
- Use • prefix for sub-items
- Keep panel titles SHORT and POWERFUL (3-5 words max)
- Include ALL services, certifications, and details the user mentioned
- Do NOT invent services, phone numbers, or certifications the user did not mention
- If the user specified an accent color, use it. Otherwise default to #D4FF00.`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.5,
      max_tokens: 3000,
    });

    const content = response.choices[0].message.content || '{}';
    let brochureData: any;
    try {
      brochureData = JSON.parse(content);
    } catch {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      let cleaned = jsonMatch ? jsonMatch[0] : '{}';
      cleaned = cleaned.replace(/,\s*([}\]])/g, '$1');
      cleaned = cleaned.replace(/[\x00-\x1F\x7F]/g, (ch) => {
        if (ch === '\n') return '\\n';
        if (ch === '\r') return '\\r';
        if (ch === '\t') return '\\t';
        return '';
      });
      try {
        brochureData = JSON.parse(cleaned);
      } catch {
        brochureData = {
          companyName: 'Your Company',
          tagline: 'Your Tagline',
          phone: '800-000-0000',
          website: 'yourcompany.com',
          credentials: ['Licensed', 'Insured', 'Bonded'],
          accentColor: '#D4FF00',
          outsidePanels: [
            { position: 'front_cover', title: 'YOUR COMPANY', body: ['Professional services'], highlights: ['FREE ESTIMATES'] },
            { position: 'back_cover', title: 'CONTACT US', body: ['Call us today'], highlights: [] },
            { position: 'inside_flap', title: 'WHY CHOOSE US', body: ['✔ Quality', '✔ Reliability'], highlights: [] },
          ],
          insidePanels: [
            { position: 'inside_left', title: 'ABOUT US', body: ['Our story'], highlights: [] },
            { position: 'inside_center', title: 'OUR SERVICES', body: ['✔ Service 1', '✔ Service 2'], highlights: [] },
            { position: 'inside_right', title: 'GET STARTED', body: ['Call for a free estimate'], highlights: ['CALL TODAY'] },
          ],
        };
      }
    }

    try {
      const stripTextConcepts = (p: string) => {
        return p.replace(/\b(brochure|tri-fold|trifold|flyer|pamphlet|booklet|menu|listing|headline|heading|title|subtitle|caption|label|tagline|slogan|bullet point|bullet list|contact info|phone number|address|email|URL|website|QR code|coupon|discount code|pricing|price list|service list|testimonial quote|review text|certification badge|logo text|banner text|sign text|panel|residential|commercial|emergency)\b/gi, '')
          .replace(/\s{2,}/g, ' ').trim();
      };
      const sceneDesc = stripTextConcepts(prompt);
      const heroPrompt = `Cinematic black and white dramatic scene related to: ${sceneDesc}. Professional photojournalism style, high contrast shadows, dramatic lighting, powerful composition. This is a SINGLE HERO PHOTOGRAPH to be used as a background visual. Do NOT render ANY text, words, letters, numbers, logos, watermarks, typography, signage, banners, labels, or ANY written characters. The image must contain ZERO text — not even a single letter. Only render the photographic scene.`;

      const imgResponse = await this.openai.images.generate({
        model: 'dall-e-3',
        prompt: heroPrompt,
        n: 1,
        size: '1792x1024',
        quality: 'hd'
      });
      brochureData.heroImageUrl = imgResponse.data[0]?.url || '';
    } catch (imgErr) {
      console.error('Brochure hero image failed:', imgErr);
      try {
        const replitOpenai = new OpenAI({
          apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
          baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
        });
        const imgResponse = await replitOpenai.images.generate({
          model: 'gpt-image-1',
          prompt: `Cinematic black and white dramatic professional photograph. High contrast, dramatic lighting. No text, no words, no letters, no numbers, no logos, no signage, no watermarks. Purely visual scene only.`,
          n: 1,
          size: '1024x1024',
        });
        if (imgResponse.data[0]?.b64_json) {
          brochureData.heroImageUrl = `data:image/png;base64,${imgResponse.data[0].b64_json}`;
        } else if (imgResponse.data[0]?.url) {
          brochureData.heroImageUrl = imgResponse.data[0].url;
        }
      } catch {
        console.error('Fallback hero image also failed');
      }
    }

    return brochureData;
  }

  async createSoundDesign(request: { prompt: string; type: string; voiceStyle?: string; duration?: string; industry?: string; backgroundMusic?: string }): Promise<any> {
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

You understand audio psychology, emotional sound design, brand audio identity, and how to create content that dominates the senses. Every sound decision is intentional and powerful.

CRITICAL QUALITY RULES — THESE ARE NON-NEGOTIABLE:
- PERFECT SPELLING: Triple-check every single word in scripts, directions, and production notes. Zero typos allowed.
- PERFECT GRAMMAR: Every sentence must be grammatically flawless. This content will be recorded by professional voice actors and posted publicly.
- PROOFREAD EVERYTHING: Before outputting, mentally proofread all scripts, voiceover text, voice directions, and production notes as if they were being recorded live today.
- PROFESSIONAL QUALITY: One spelling error in a voiceover script means a bad recording. Treat every word like it costs $1,000 to fix.`;

    const userPrompt = `Create the following for this request:

"${request.prompt}"

Type: ${request.type}
${request.voiceStyle ? `Voice Style: ${request.voiceStyle}` : ''}
${request.duration ? `Target Duration: ${request.duration}` : ''}
${request.industry ? `Industry: ${request.industry}` : ''}
${request.backgroundMusic ? `Background Music/Sound: ${request.backgroundMusic.replace(/-/g, ' ')} — incorporate this specific music style or sound into the design` : ''}

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
