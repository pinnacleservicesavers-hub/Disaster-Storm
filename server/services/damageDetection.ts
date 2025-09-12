import Anthropic from '@anthropic-ai/sdk';

export interface DamageDetection {
  alertType: 'structure_damage' | 'tree_down' | 'tree_on_powerline' | 'tree_blocking_road' | 'tree_on_vehicle' | 'flood_damage' | 'debris_blockage';
  confidence: number; // 0-100 percentage
  severity: 'minor' | 'moderate' | 'severe' | 'critical';
  description: string;
  exactLocation?: string;
  estimatedDamage?: 'low' | 'medium' | 'high' | 'extensive';
  urgencyLevel: 'low' | 'normal' | 'high' | 'emergency';
  contractorTypes: string[]; // Types of contractors needed
  estimatedCost?: {
    min: number;
    max: number;
    currency: 'USD';
  };
  workScope?: string[];
  safetyHazards?: string[];
  equipmentNeeded?: string[];
}

export interface DamageAnalysisResult {
  hasDetection: boolean;
  detections: DamageDetection[];
  analysisTimestamp: Date;
  processingTimeMs: number;
  imageMetadata: {
    size: number;
    format?: string;
    dimensions?: { width?: number; height?: number };
  };
  confidence: number; // Overall confidence in analysis
  recommendedActions?: string[];
}

export class DamageDetectionService {
  private anthropic: Anthropic | null = null;
  private apiKeyAvailable: boolean = false;

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (apiKey) {
      this.anthropic = new Anthropic({ apiKey });
      this.apiKeyAvailable = true;
      console.log('🤖 AI damage detection enabled with Anthropic API');
    } else {
      console.log('⚠️ AI damage detection disabled - ANTHROPIC_API_KEY not configured');
    }
  }

  async analyzeImageForDamage(imageBuffer: Buffer, cameraLocation?: string): Promise<DamageAnalysisResult> {
    const startTime = Date.now();
    
    // If API key not available, return mock analysis for development
    if (!this.apiKeyAvailable || !this.anthropic) {
      console.log(`⚠️ AI analysis skipped - using mock data (${imageBuffer.length} bytes)`);
      return this.getMockAnalysisResult(imageBuffer.length, Date.now() - startTime);
    }
    
    try {
      // Convert buffer to base64 for Anthropic API
      const base64Image = imageBuffer.toString('base64');
      const mediaType = this.detectImageFormat(imageBuffer);
      
      const prompt = this.buildAnalysisPrompt(cameraLocation);
      
      console.log(`🤖 Analyzing traffic camera image for storm damage (${imageBuffer.length} bytes)`);
      
      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1500,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'text',
              text: prompt
            },
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
                data: base64Image
              }
            }
          ]
        }]
      });

      const processingTime = Date.now() - startTime;
      
      // Parse AI response
      const analysisText = response.content[0].type === 'text' ? response.content[0].text : '';
      const result = this.parseAIResponse(analysisText, imageBuffer.length, processingTime);
      
      console.log(`✅ Damage analysis complete: ${result.detections.length} detections found (${processingTime}ms)`);
      
      return result;
    } catch (error) {
      console.error('❌ Damage detection analysis failed:', error);
      
      const processingTime = Date.now() - startTime;
      return {
        hasDetection: false,
        detections: [],
        analysisTimestamp: new Date(),
        processingTimeMs: processingTime,
        imageMetadata: {
          size: imageBuffer.length,
          format: this.detectImageFormat(imageBuffer)
        },
        confidence: 0,
        recommendedActions: ['Manual review required due to analysis error']
      };
    }
  }

  private buildAnalysisPrompt(cameraLocation?: string): string {
    return `You are an expert damage assessment AI analyzing traffic camera footage for storm-related damage and infrastructure issues that require contractor services.

LOCATION: ${cameraLocation || 'Traffic camera location'}

ANALYZE this traffic camera image for the following damage types that contractors can address:

**PRIMARY DAMAGE TYPES:**
1. **STRUCTURE DAMAGE** - Buildings, bridges, signs, barriers with visible damage
2. **TREE ON POWERLINE** - Trees or branches touching/on electrical lines (CRITICAL)
3. **TREE BLOCKING ROAD** - Trees fallen across roadways blocking traffic
4. **TREE ON VEHICLE** - Trees fallen on cars, trucks, or other vehicles
5. **DEBRIS BLOCKAGE** - Storm debris blocking roads or infrastructure
6. **FLOOD DAMAGE** - Water damage to structures or roads

**ASSESSMENT CRITERIA:**
- Only flag damage requiring professional contractor services
- Assess severity: minor, moderate, severe, critical
- Estimate urgency: low, normal, high, emergency
- Provide confidence score (0-100%)
- Identify specific contractor types needed
- Estimate repair complexity and cost range

**RESPONSE FORMAT:**
Return a JSON object with this exact structure:
{
  "hasDetection": boolean,
  "overallConfidence": number (0-100),
  "detections": [
    {
      "alertType": "structure_damage|tree_on_powerline|tree_blocking_road|tree_on_vehicle|debris_blockage|flood_damage",
      "confidence": number (0-100),
      "severity": "minor|moderate|severe|critical",
      "description": "Detailed description of damage observed",
      "exactLocation": "Specific location within camera view",
      "estimatedDamage": "low|medium|high|extensive",
      "urgencyLevel": "low|normal|high|emergency",
      "contractorTypes": ["tree_removal", "electrical", "roofing", "emergency_cleanup", etc.],
      "estimatedCost": {"min": number, "max": number, "currency": "USD"},
      "workScope": ["specific tasks needed"],
      "safetyHazards": ["identified safety concerns"],
      "equipmentNeeded": ["equipment types required"]
    }
  ],
  "recommendedActions": ["immediate next steps"]
}

**IMPORTANT:**
- Tree on powerline = CRITICAL EMERGENCY (urgency: emergency, severity: critical)
- Only report damage that actually needs contractor services
- Be specific about contractor types and work scope
- Consider safety implications and equipment needs
- If no damage detected, return hasDetection: false with empty detections array`;
  }

  private parseAIResponse(analysisText: string, imageSize: number, processingTime: number): DamageAnalysisResult {
    try {
      // Extract JSON from AI response (handle markdown code blocks)
      const jsonMatch = analysisText.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/) || 
                       analysisText.match(/(\{[\s\S]*\})/);
      
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response');
      }

      const jsonStr = jsonMatch[1];
      const aiResult = JSON.parse(jsonStr);

      // Validate and normalize the AI response
      const detections: DamageDetection[] = (aiResult.detections || []).map((d: any) => ({
        alertType: d.alertType || 'structure_damage',
        confidence: Math.min(100, Math.max(0, d.confidence || 0)),
        severity: ['minor', 'moderate', 'severe', 'critical'].includes(d.severity) ? d.severity : 'moderate',
        description: d.description || 'Damage detected by AI analysis',
        exactLocation: d.exactLocation,
        estimatedDamage: ['low', 'medium', 'high', 'extensive'].includes(d.estimatedDamage) ? d.estimatedDamage : 'medium',
        urgencyLevel: ['low', 'normal', 'high', 'emergency'].includes(d.urgencyLevel) ? d.urgencyLevel : 'normal',
        contractorTypes: Array.isArray(d.contractorTypes) ? d.contractorTypes : ['general_contractor'],
        estimatedCost: d.estimatedCost || { min: 500, max: 2000, currency: 'USD' },
        workScope: Array.isArray(d.workScope) ? d.workScope : [],
        safetyHazards: Array.isArray(d.safetyHazards) ? d.safetyHazards : [],
        equipmentNeeded: Array.isArray(d.equipmentNeeded) ? d.equipmentNeeded : []
      }));

      return {
        hasDetection: aiResult.hasDetection === true && detections.length > 0,
        detections,
        analysisTimestamp: new Date(),
        processingTimeMs: processingTime,
        imageMetadata: {
          size: imageSize,
          format: this.detectImageFormat(Buffer.alloc(0)) // We don't have buffer here
        },
        confidence: Math.min(100, Math.max(0, aiResult.overallConfidence || 0)),
        recommendedActions: Array.isArray(aiResult.recommendedActions) ? aiResult.recommendedActions : []
      };
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      console.log('Raw AI response:', analysisText);
      
      // Fallback: try to extract basic damage information from text
      const hasKeywords = /damage|tree|fallen|blocked|debris|flood|structure/i.test(analysisText);
      
      return {
        hasDetection: hasKeywords,
        detections: hasKeywords ? [{
          alertType: 'structure_damage',
          confidence: 30,
          severity: 'moderate',
          description: 'Potential damage detected - manual review required',
          urgencyLevel: 'normal',
          contractorTypes: ['general_contractor'],
          estimatedDamage: 'medium'
        }] : [],
        analysisTimestamp: new Date(),
        processingTimeMs: processingTime,
        imageMetadata: { size: imageSize },
        confidence: hasKeywords ? 30 : 0,
        recommendedActions: ['Manual review required due to analysis parsing error']
      };
    }
  }

  private detectImageFormat(buffer: Buffer): string {
    if (buffer.length < 4) return 'image/jpeg';
    
    // Check magic numbers for different image formats
    const header = buffer.toString('hex', 0, 4).toUpperCase();
    
    if (header.startsWith('FFD8')) return 'image/jpeg';
    if (header.startsWith('8950')) return 'image/png';
    if (header.startsWith('4749')) return 'image/gif';
    if (header.startsWith('5249')) return 'image/webp';
    
    return 'image/jpeg'; // Default fallback
  }

  private getMockAnalysisResult(imageSize: number, processingTime: number): DamageAnalysisResult {
    // Return mock analysis for development when API key not available
    return {
      hasDetection: false,
      detections: [],
      analysisTimestamp: new Date(),
      processingTimeMs: processingTime,
      imageMetadata: {
        size: imageSize,
        format: 'image/jpeg'
      },
      confidence: 0,
      recommendedActions: ['AI analysis unavailable - ANTHROPIC_API_KEY not configured']
    };
  }

  async testWithSampleImage(): Promise<DamageAnalysisResult> {
    // Create a test buffer for development purposes
    const testBuffer = Buffer.from('test-image-data');
    
    console.log('🧪 Running damage detection test...');
    
    // For testing, return a mock result
    return {
      hasDetection: true,
      detections: [{
        alertType: 'tree_on_powerline',
        confidence: 85,
        severity: 'critical',
        description: 'Large tree branch in contact with power lines',
        exactLocation: 'Northeast corner of intersection',
        estimatedDamage: 'high',
        urgencyLevel: 'emergency',
        contractorTypes: ['tree_removal', 'electrical'],
        estimatedCost: { min: 2000, max: 5000, currency: 'USD' },
        workScope: ['Emergency tree removal', 'Power line inspection', 'Debris cleanup'],
        safetyHazards: ['Live electrical hazard', 'Falling branches'],
        equipmentNeeded: ['Bucket truck', 'Chainsaw', 'Safety equipment']
      }],
      analysisTimestamp: new Date(),
      processingTimeMs: 1200,
      imageMetadata: { size: testBuffer.length, format: 'image/jpeg' },
      confidence: 85,
      recommendedActions: [
        'Contact utility company immediately',
        'Dispatch emergency tree removal crew',
        'Set up safety perimeter'
      ]
    };
  }
}

// Export singleton instance
export const damageDetectionService = new DamageDetectionService();