import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface DamageAnalysis {
  category: string;
  priority: number;
  estimatedCost?: number;
  urgency: string;
  reasoning: string;
}

export interface LeadExpansionResult {
  confidence: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  insuranceStatus: 'unknown' | 'likely' | 'unlikely';
  services: DamageAnalysis[];
  aiAnalysis: {
    damageType: string[];
    complexityScore: number;
    recommendations: string[];
  };
}

const SYSTEM_PROMPT = `You are an expert property damage assessor for insurance claims and contractor dispatch. 

Analyze the damage description and:
1. Identify ALL potential service categories needed (tree, roofing, fence, pool, windows, siding, gutters, hvac, electrical, plumbing)
2. Assign priority (1-10, higher = more urgent) based on safety and damage severity
3. Estimate rough cost if confident
4. Determine urgency (routine, urgent, emergency)
5. Assess if insurance claim is likely

Respond ONLY with valid JSON matching this structure:
{
  "confidence": 0-100,
  "priority": "low" | "medium" | "high" | "urgent",
  "insuranceStatus": "unknown" | "likely" | "unlikely",
  "services": [
    {
      "category": "roofing",
      "priority": 9,
      "estimatedCost": 8500,
      "urgency": "urgent",
      "reasoning": "Active leak detected, structural integrity at risk"
    }
  ],
  "aiAnalysis": {
    "damageType": ["wind", "water"],
    "complexityScore": 7,
    "recommendations": ["Schedule emergency roof inspection within 24h", "Place tarps to prevent further water damage"]
  }
}`;

export async function expandLeadServices(
  damageDescription: string,
  address: string,
  additionalContext?: {
    photos?: string[];
    customerNotes?: string;
    weatherEvent?: string;
  }
): Promise<LeadExpansionResult> {
  const userPrompt = `
Property Address: ${address}
Damage Description: ${damageDescription}
${additionalContext?.customerNotes ? `Customer Notes: ${additionalContext.customerNotes}` : ''}
${additionalContext?.weatherEvent ? `Recent Weather Event: ${additionalContext.weatherEvent}` : ''}
${additionalContext?.photos ? `Photos Available: ${additionalContext.photos.length} images` : ''}

Analyze this damage and recommend all necessary services with priorities.`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('Empty response from OpenAI');
    }

    const result = JSON.parse(content) as LeadExpansionResult;

    // Validate and sanitize
    result.confidence = Math.min(100, Math.max(0, result.confidence || 50));
    result.priority = result.priority || 'medium';
    result.insuranceStatus = result.insuranceStatus || 'unknown';
    result.services = result.services || [];
    result.aiAnalysis = result.aiAnalysis || {
      damageType: ['unknown'],
      complexityScore: 5,
      recommendations: [],
    };

    return result;
  } catch (error) {
    console.error('AI Lead Expansion Error:', error);
    
    // Fallback to basic analysis if AI fails
    return {
      confidence: 30,
      priority: 'medium',
      insuranceStatus: 'unknown',
      services: [
        {
          category: 'general',
          priority: 5,
          urgency: 'routine',
          reasoning: 'AI analysis unavailable - manual review required',
        },
      ],
      aiAnalysis: {
        damageType: ['unknown'],
        complexityScore: 5,
        recommendations: ['Requires manual assessment'],
      },
    };
  }
}

export async function analyzePhotosDamage(
  photoUrls: string[],
  context: string
): Promise<{
  damageType: string[];
  severity: string;
  description: string;
}> {
  if (!photoUrls || photoUrls.length === 0) {
    return {
      damageType: ['unknown'],
      severity: 'unknown',
      description: 'No photos provided for analysis',
    };
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert in property damage assessment. Analyze the images and describe the damage, severity, and type. Respond only with JSON: {"damageType": ["type1", "type2"], "severity": "minor|moderate|severe|catastrophic", "description": "detailed description"}',
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Context: ${context}\n\nAnalyze these damage photos:`,
            },
            ...photoUrls.slice(0, 4).map((url) => ({
              type: 'image_url' as const,
              image_url: { url },
            })),
          ],
        },
      ],
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('Empty response from OpenAI');
    }

    return JSON.parse(content);
  } catch (error) {
    console.error('Photo analysis error:', error);
    return {
      damageType: ['unknown'],
      severity: 'unknown',
      description: 'Photo analysis failed - manual review required',
    };
  }
}
