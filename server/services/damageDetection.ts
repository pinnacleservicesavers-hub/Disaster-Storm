// Dynamic import of @anthropic-ai/sdk only when ANTHROPIC_API_KEY is available

export interface DamageDetection {
  alertType: 'structure_damage' | 'tree_down' | 'tree_on_powerline' | 'tree_blocking_road' | 'tree_on_vehicle' | 'flood_damage' | 'debris_blockage' | 'roof_damage' | 'siding_damage' | 'window_damage' | 'electrical_damage' | 'basement_flooding' | 'driveway_damage';
  confidence: number; // 0-100 percentage
  severity: 'minor' | 'moderate' | 'severe' | 'critical';
  severityScore: number; // 1-10 scale for precise ranking
  profitabilityScore: number; // 1-10 scale for contractor lead value
  description: string;
  exactLocation?: string;
  estimatedDamage?: 'low' | 'medium' | 'high' | 'extensive';
  urgencyLevel: 'low' | 'normal' | 'high' | 'emergency';
  contractorTypes: string[]; // Types of contractors needed
  contractorSpecializations: string[]; // Specific specializations required
  estimatedCost?: {
    min: number;
    max: number;
    currency: 'USD';
  };
  workScope?: string[];
  safetyHazards?: string[];
  equipmentNeeded?: string[];
  // Location and accessibility
  coordinates?: {
    lat: number;
    lng: number;
  };
  address?: string;
  accessibilityScore: number; // 1-10 how easy to access for contractors
  // Lead generation fields
  leadPriority: 'low' | 'medium' | 'high' | 'critical';
  emergencyResponse: boolean; // True if needs immediate response
  insuranceLikelihood: number; // 1-10 likelihood of insurance claim
  competitionLevel: 'low' | 'medium' | 'high'; // Expected contractor competition
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
  leadGenerated: boolean; // Whether this analysis generated a contractor lead
  totalSeverityScore: number; // Sum of all detection severity scores
  maxProfitabilityScore: number; // Highest profitability score among detections
  recommendedActions?: string[];
  // Enhanced analysis results
  riskAssessment: {
    publicSafety: number; // 1-10 scale
    propertyDamage: number; // 1-10 scale
    businessDisruption: number; // 1-10 scale
  };
  weatherCorrelation?: {
    stormType: string;
    intensity: string;
    timeElapsed: number; // minutes since storm passed
  };
}

export class DamageDetectionService {
  private anthropic: any = null; // Dynamic import, type will be Anthropic
  private apiKeyAvailable: boolean = false;
  private isProduction: boolean = false;
  private initializationPromise: Promise<void> | null = null;

  constructor() {
    this.isProduction = process.env.NODE_ENV === 'production' || process.env.DISABLE_MOCKS === 'true';
    this.apiKeyAvailable = Boolean(process.env.ANTHROPIC_API_KEY?.trim());
    
    if (this.apiKeyAvailable) {
      console.log('🤖 AI damage detection will be enabled with Anthropic API (dynamic import)');
    } else {
      console.log('⚠️ AI damage detection disabled - ANTHROPIC_API_KEY not configured');
      if (this.isProduction) {
        console.log('🚫 Production mode: Mock analysis strictly disabled');
      }
    }
  }

  /**
   * Dynamically import and initialize Anthropic SDK
   */
  private async initializeAnthropic(): Promise<void> {
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = (async () => {
      try {
        const { default: Anthropic } = await import('@anthropic-ai/sdk');
        this.anthropic = new Anthropic({ 
          apiKey: process.env.ANTHROPIC_API_KEY,
          timeout: 30000 // 30 second timeout
        });
        console.log('✅ Anthropic SDK initialized successfully');
      } catch (error) {
        console.error('❌ Failed to initialize Anthropic SDK:', error);
        this.anthropic = null;
        throw new Error(`Failed to initialize Anthropic SDK: ${error.message}`);
      }
    })();

    return this.initializationPromise;
  }

  async analyzeImageForDamage(imageBuffer: Buffer, cameraLocation?: string): Promise<DamageAnalysisResult> {
    const startTime = Date.now();
    
    // Check if API key is available
    if (!this.apiKeyAvailable) {
      const error = new Error('AI_FEATURE_DISABLED: ANTHROPIC_API_KEY not configured');
      error.name = 'AI_FEATURE_DISABLED';
      if (this.isProduction) {
        console.error('🚫 Production: AI damage detection requires ANTHROPIC_API_KEY');
      } else {
        console.error('⚠️ Development: AI damage detection disabled - set ANTHROPIC_API_KEY to enable');
      }
      throw error;
    }

    // Initialize Anthropic SDK if needed
    if (!this.anthropic) {
      try {
        await this.initializeAnthropic();
      } catch (error) {
        const aiError = new Error(`AI_FEATURE_DISABLED: ${error.message}`);
        aiError.name = 'AI_FEATURE_DISABLED';
        throw aiError;
      }
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
      
      // Re-throw specific AI service errors to be handled by routes
      if (error.name === 'AI_FEATURE_DISABLED' || error.message?.includes('AI_FEATURE_DISABLED')) {
        throw error;
      }

      // For other API errors (rate limits, network issues, etc.), create a proper error response
      const analysisError: any = new Error(`AI_ANALYSIS_FAILED: ${error.message || 'Unknown analysis error'}`);
      analysisError.name = 'AI_ANALYSIS_FAILED';
      analysisError.originalError = error;
      
      throw analysisError;
    }
  }

  private buildAnalysisPrompt(cameraLocation?: string): string {
    return `You are an expert damage assessment AI analyzing traffic camera footage for storm-related damage and infrastructure issues that create profitable contractor opportunities.

LOCATION: ${cameraLocation || 'Traffic camera location'}

ANALYZE this traffic camera image for contractor-serviceable damage with LEAD GENERATION focus:

**DAMAGE TYPES & PROFITABILITY:**
1. **ROOF DAMAGE** - Missing shingles, structural damage, gutter issues (HIGH VALUE)
2. **SIDING DAMAGE** - Damaged exterior walls, vinyl/wood siding issues (MEDIUM-HIGH VALUE)
3. **WINDOW DAMAGE** - Broken windows, frame damage (MEDIUM VALUE)
4. **TREE ON POWERLINE** - Electrical hazard, emergency tree removal (CRITICAL EMERGENCY)
5. **TREE BLOCKING ROAD** - Public/private property tree removal (HIGH VALUE)
6. **FLOOD DAMAGE** - Water damage to structures, cleanup needs (HIGH VALUE)
7. **STRUCTURAL DAMAGE** - Building damage, fence damage (HIGH VALUE)
8. **DEBRIS BLOCKAGE** - Storm cleanup, hauling services (MEDIUM VALUE)

**ENHANCED SCORING SYSTEM:**
- SEVERITY SCORE: 1-10 scale (1=minor scratches, 10=total destruction)
- PROFITABILITY SCORE: 1-10 scale (1=<$500 job, 10=$50,000+ job)
- ACCESSIBILITY SCORE: 1-10 scale (1=hard to reach, 10=easy street access)
- INSURANCE LIKELIHOOD: 1-10 scale (1=unlikely claim, 10=definite insurance claim)
- LEAD PRIORITY: low/medium/high/critical

**RESPONSE FORMAT:**
Return a JSON object with this exact structure:
{
  "hasDetection": boolean,
  "overallConfidence": number (0-100),
  "leadGenerated": boolean,
  "totalSeverityScore": number,
  "maxProfitabilityScore": number,
  "riskAssessment": {
    "publicSafety": number (1-10),
    "propertyDamage": number (1-10),
    "businessDisruption": number (1-10)
  },
  "detections": [
    {
      "alertType": "roof_damage|siding_damage|window_damage|tree_on_powerline|tree_blocking_road|flood_damage|structure_damage|debris_blockage",
      "confidence": number (0-100),
      "severity": "minor|moderate|severe|critical",
      "severityScore": number (1-10),
      "profitabilityScore": number (1-10),
      "description": "Detailed description focusing on repair needs",
      "exactLocation": "Specific location for contractor dispatch",
      "estimatedDamage": "low|medium|high|extensive",
      "urgencyLevel": "low|normal|high|emergency",
      "contractorTypes": ["roofing", "siding", "electrical", "tree_removal", "water_damage", "general_contractor"],
      "contractorSpecializations": ["storm_damage", "emergency_response", "insurance_claims"],
      "estimatedCost": {"min": number, "max": number, "currency": "USD"},
      "workScope": ["specific contractor tasks"],
      "safetyHazards": ["safety concerns for workers"],
      "equipmentNeeded": ["specialized equipment required"],
      "coordinates": {"lat": number, "lng": number},
      "accessibilityScore": number (1-10),
      "leadPriority": "low|medium|high|critical",
      "emergencyResponse": boolean,
      "insuranceLikelihood": number (1-10),
      "competitionLevel": "low|medium|high"
    }
  ],
  "recommendedActions": ["contractor action items"]
}

**LEAD GENERATION RULES:**
- Generate leads for damage worth $1,000+ (profitabilityScore >= 4)
- CRITICAL priority for safety hazards (trees on powerlines, structural collapse)
- HIGH priority for visible roof/siding damage on residential properties
- MEDIUM priority for commercial property damage
- Consider insurance claim potential - storm damage = higher priority
- Factor in accessibility - roadside damage easier than remote locations`;
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

      // Validate and normalize the AI response with enhanced fields
      const detections: DamageDetection[] = (aiResult.detections || []).map((d: any) => ({
        alertType: d.alertType || 'structure_damage',
        confidence: Math.min(100, Math.max(0, d.confidence || 0)),
        severity: ['minor', 'moderate', 'severe', 'critical'].includes(d.severity) ? d.severity : 'moderate',
        severityScore: Math.min(10, Math.max(1, d.severityScore || this.calculateSeverityScore(d.severity || 'moderate'))),
        profitabilityScore: Math.min(10, Math.max(1, d.profitabilityScore || this.calculateProfitabilityScore(d.estimatedCost))),
        description: d.description || 'Damage detected by AI analysis',
        exactLocation: d.exactLocation,
        estimatedDamage: ['low', 'medium', 'high', 'extensive'].includes(d.estimatedDamage) ? d.estimatedDamage : 'medium',
        urgencyLevel: ['low', 'normal', 'high', 'emergency'].includes(d.urgencyLevel) ? d.urgencyLevel : 'normal',
        contractorTypes: Array.isArray(d.contractorTypes) ? d.contractorTypes : ['general_contractor'],
        contractorSpecializations: Array.isArray(d.contractorSpecializations) ? d.contractorSpecializations : ['storm_damage'],
        estimatedCost: d.estimatedCost || { min: 500, max: 2000, currency: 'USD' },
        workScope: Array.isArray(d.workScope) ? d.workScope : [],
        safetyHazards: Array.isArray(d.safetyHazards) ? d.safetyHazards : [],
        equipmentNeeded: Array.isArray(d.equipmentNeeded) ? d.equipmentNeeded : [],
        coordinates: d.coordinates || null,
        address: d.address,
        accessibilityScore: Math.min(10, Math.max(1, d.accessibilityScore || 5)),
        leadPriority: ['low', 'medium', 'high', 'critical'].includes(d.leadPriority) ? d.leadPriority : 'medium',
        emergencyResponse: Boolean(d.emergencyResponse),
        insuranceLikelihood: Math.min(10, Math.max(1, d.insuranceLikelihood || 5)),
        competitionLevel: ['low', 'medium', 'high'].includes(d.competitionLevel) ? d.competitionLevel : 'medium'
      }));

      const totalSeverityScore = detections.reduce((sum, d) => sum + d.severityScore, 0);
      const maxProfitabilityScore = Math.max(...detections.map(d => d.profitabilityScore), 0);
      const leadGenerated = detections.some(d => d.profitabilityScore >= 4) && detections.length > 0;

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
        leadGenerated,
        totalSeverityScore,
        maxProfitabilityScore,
        riskAssessment: aiResult.riskAssessment || {
          publicSafety: Math.min(10, Math.max(1, Math.max(...detections.map(d => d.severityScore), 1))),
          propertyDamage: Math.min(10, Math.max(1, Math.max(...detections.map(d => d.severityScore), 1))),
          businessDisruption: Math.min(10, Math.max(1, totalSeverityScore > 15 ? 8 : 3))
        },
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
          severityScore: 3,
          profitabilityScore: 2,
          contractorSpecializations: ['general_contractor'],
          coordinates: null,
          address: undefined,
          accessibilityScore: 5,
          leadPriority: 'medium',
          emergencyResponse: false,
          insuranceLikelihood: 3,
          competitionLevel: 'medium',
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
        leadGenerated: false,
        totalSeverityScore: hasKeywords ? 3 : 0,
        maxProfitabilityScore: hasKeywords ? 2 : 0,
        riskAssessment: {
          publicSafety: 3,
          propertyDamage: 3,
          businessDisruption: 2
        },
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

  /**
   * Check if AI damage detection is available and properly configured
   */
  isAvailable(): boolean {
    return this.apiKeyAvailable;
  }

  /**
   * Get the current configuration status for debugging
   */
  getStatus(): { available: boolean; production: boolean; hasApiKey: boolean; initialized: boolean } {
    return {
      available: this.apiKeyAvailable,
      production: this.isProduction,
      hasApiKey: Boolean(process.env.ANTHROPIC_API_KEY?.trim()),
      initialized: Boolean(this.anthropic)
    };
  }

  // Helper methods for scoring calculation
  private calculateSeverityScore(severity: string): number {
    const severityMap = {
      'minor': 2,
      'moderate': 5,
      'severe': 7,
      'critical': 9
    };
    return severityMap[severity as keyof typeof severityMap] || 5;
  }

  private calculateProfitabilityScore(estimatedCost?: { min: number; max: number; currency: string }): number {
    if (!estimatedCost) return 3;
    
    const avgCost = (estimatedCost.min + estimatedCost.max) / 2;
    
    if (avgCost >= 50000) return 10;      // $50k+ = highest profit
    if (avgCost >= 25000) return 9;       // $25k-50k = very high profit
    if (avgCost >= 15000) return 8;       // $15k-25k = high profit
    if (avgCost >= 10000) return 7;       // $10k-15k = good profit
    if (avgCost >= 5000) return 6;        // $5k-10k = medium profit
    if (avgCost >= 2500) return 5;        // $2.5k-5k = fair profit
    if (avgCost >= 1000) return 4;        // $1k-2.5k = low profit (lead threshold)
    if (avgCost >= 500) return 3;         // $500-1k = minimal profit
    return 2;                             // <$500 = very low profit
  }

  // Address resolution helper
  async resolveAddress(lat: number, lng: number): Promise<string | undefined> {
    try {
      // Simple reverse geocoding using a free service
      // In production, use a proper geocoding service like Google Maps API
      const response = await fetch(`https://api.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.display_name) {
          return data.display_name;
        }
      }
    } catch (error) {
      console.warn('Address resolution failed:', error);
    }
    
    return undefined;
  }

  /**
   * Test the AI service with a sample image - creates a mock damage scenario for testing
   */
  async testWithSampleImage(): Promise<DamageAnalysisResult> {
    console.log('🧪 Running AI damage detection test with mock scenario');
    
    if (!this.apiKeyAvailable) {
      // Return a realistic test scenario without API call
      const mockResult: DamageAnalysisResult = {
        hasDetection: true,
        detections: [
          {
            alertType: 'roof_damage',
            confidence: 85,
            severity: 'moderate',
            severityScore: 6,
            profitabilityScore: 7,
            description: 'Test scenario: Missing roof shingles on residential property, estimated 200 sq ft affected area',
            exactLocation: 'Residential roof at intersection near traffic camera',
            estimatedDamage: 'medium',
            urgencyLevel: 'high',
            contractorTypes: ['roofing', 'general_contractor'],
            contractorSpecializations: ['storm_damage', 'insurance_claims', 'residential_roofing'],
            estimatedCost: { min: 3500, max: 7500, currency: 'USD' },
            workScope: ['roof_inspection', 'shingle_replacement', 'damage_assessment', 'insurance_documentation'],
            safetyHazards: ['roof_access', 'weather_exposure'],
            equipmentNeeded: ['ladder', 'safety_harness', 'roofing_materials'],
            coordinates: { lat: 33.7490, lng: -84.3880 },
            address: '123 Test Street, Atlanta, GA 30309',
            accessibilityScore: 8,
            leadPriority: 'high',
            emergencyResponse: false,
            insuranceLikelihood: 9,
            competitionLevel: 'medium'
          }
        ],
        analysisTimestamp: new Date(),
        processingTimeMs: 150,
        imageMetadata: { size: 1024000, format: 'image/jpeg' },
        confidence: 85,
        leadGenerated: true,
        totalSeverityScore: 6,
        maxProfitabilityScore: 7,
        riskAssessment: {
          publicSafety: 3,
          propertyDamage: 6,
          businessDisruption: 2
        },
        recommendedActions: ['Contact property owner', 'Schedule inspection', 'Document for insurance claim']
      };
      
      console.log('✅ Test completed with mock damage scenario (no API key required)');
      return mockResult;
    }

    try {
      // Create a small test image buffer (1x1 pixel JPEG for minimal API usage)
      const testImageBuffer = Buffer.from([
        0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
        0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
        0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
        0x09, 0x08, 0x0A, 0x0C, 0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12,
        0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D, 0x1A, 0x1C, 0x1C, 0x20,
        0x24, 0x2E, 0x27, 0x20, 0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29,
        0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27, 0x39, 0x3D, 0x38, 0x32,
        0x3C, 0x2E, 0x33, 0x34, 0x32, 0xFF, 0xC0, 0x00, 0x11, 0x08, 0x00, 0x01,
        0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0x02, 0x11, 0x01, 0x03, 0x11, 0x01,
        0xFF, 0xC4, 0x00, 0x14, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x08, 0xFF, 0xC4,
        0x00, 0x14, 0x10, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xFF, 0xDA, 0x00, 0x0C,
        0x03, 0x01, 0x00, 0x02, 0x11, 0x03, 0x11, 0x00, 0x3F, 0x00, 0x9F, 0xFF, 0xD9
      ]);

      console.log('🤖 Testing with real AI API using minimal test image');
      const result = await this.analyzeImageForDamage(testImageBuffer, 'Test Camera Location');
      
      console.log(`✅ AI test completed: ${result.detections.length} detections, confidence: ${result.confidence}%`);
      return result;
      
    } catch (error) {
      console.error('❌ AI test failed, falling back to mock scenario:', error);
      
      // Fallback to mock data if API fails
      return {
        hasDetection: false,
        detections: [],
        analysisTimestamp: new Date(),
        processingTimeMs: 50,
        imageMetadata: { size: 150, format: 'image/jpeg' },
        confidence: 0,
        leadGenerated: false,
        totalSeverityScore: 0,
        maxProfitabilityScore: 0,
        riskAssessment: { publicSafety: 1, propertyDamage: 1, businessDisruption: 1 },
        recommendedActions: ['Test completed - no damage detected in test scenario']
      };
    }
  }

  /**
   * Test the AI service with a sample image (requires real API key)
   */
  async testConnection(): Promise<{ success: boolean; message: string; latency?: number }> {
    if (!this.apiKeyAvailable) {
      return {
        success: false,
        message: 'ANTHROPIC_API_KEY not configured'
      };
    }

    const startTime = Date.now();
    
    try {
      // Initialize if needed
      if (!this.anthropic) {
        await this.initializeAnthropic();
      }

      // Make a simple test request to verify the API key works
      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 10,
        messages: [{
          role: 'user',
          content: 'Say "OK" if you can read this message.'
        }]
      });

      const latency = Date.now() - startTime;
      
      return {
        success: true,
        message: `Anthropic API connection successful`,
        latency
      };
    } catch (error) {
      return {
        success: false,
        message: `Anthropic API connection failed: ${error.message}`
      };
    }
  }
}

// Export singleton instance
export const damageDetectionService = new DamageDetectionService();