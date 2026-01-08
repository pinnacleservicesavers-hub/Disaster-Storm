import { Anthropic } from '@anthropic-ai/sdk';

interface TreeAnalysis {
  species: string;
  estimatedHeight: string;
  estimatedWeight: string;
  rootBallDiameter: string;
  stumpDiameter: string;
  healthStatus: 'healthy' | 'damaged' | 'dying' | 'dead';
  hazardLevel: 'low' | 'moderate' | 'high' | 'extreme';
  canopySpread?: string;
  multipleTreesCount?: number;
}

interface UtilityAssessment {
  powerLinesPresent: boolean;
  powerLineType: 'none' | 'service_drop' | 'primary' | 'high_voltage';
  linesInCanopy: boolean;
  utilityCoordinationRequired: boolean;
  riskMultiplier: number;
}

interface AccessAssessment {
  bucketTruckAccess: boolean;
  craneRequired: boolean;
  riggingRequired: boolean;
  groundConditions: 'stable' | 'soft' | 'paved' | 'sloped';
  accessDifficulty: 'easy' | 'moderate' | 'difficult' | 'extreme';
}

interface PricingFactors {
  baseJobType: 'standard' | 'technical' | 'high_risk' | 'emergency';
  sizeCategory: 'small' | 'medium' | 'large' | 'giant';
  complexityMultiplier: number;
  equipmentCosts: string;
}

interface SafetyAssessment {
  blocksEgress: boolean;
  blocksIngress: boolean;
  immediateHazards: string[];
  accessibilityImpact: string;
  emergencyRisk: 'none' | 'low' | 'moderate' | 'high' | 'critical';
}

interface DamageAssessment {
  severity: 'minimal' | 'moderate' | 'severe' | 'catastrophic';
  damageType: string[];
  affectedStructures: string[];
  repairPriority: 'routine' | 'priority' | 'urgent' | 'emergency';
  estimatedCost: {
    min: number;
    max: number;
    currency: string;
  };
}

interface ProfessionalDescription {
  title: string;
  summary: string;
  technicalDetails: string;
  recommendedActions: string[];
  safetyNotes: string;
  insuranceNotes: string;
}

export interface EnhancedImageAnalysis {
  id: string;
  timestamp: string;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  treeAnalysis: TreeAnalysis | null;
  utilityAssessment: UtilityAssessment | null;
  accessAssessment: AccessAssessment | null;
  pricingFactors: PricingFactors | null;
  safetyAssessment: SafetyAssessment;
  damageAssessment: DamageAssessment;
  professionalDescription: ProfessionalDescription;
  autoTags: string[];
  confidence: number;
  editable: boolean;
  lastModified: string;
  modifiedBy: string;
}

export class EnhancedImageAnalysisService {
  private anthropic: Anthropic | null = null;

  constructor() {
    try {
      if (process.env.ANTHROPIC_API_KEY) {
        this.anthropic = new Anthropic({
          apiKey: process.env.ANTHROPIC_API_KEY,
        });
        console.log('🧠 Enhanced Image Analysis initialized with Anthropic AI');
      }
    } catch (error) {
      console.error('❌ Failed to initialize Enhanced Image Analysis:', error);
    }
  }

  async analyzeDisasterImage(
    imageBase64: string, 
    location?: { lat: number; lng: number; address: string },
    projectContext?: string
  ): Promise<EnhancedImageAnalysis> {
    if (!this.anthropic) {
      throw new Error('Enhanced Image Analysis service not available');
    }

    const analysisPrompt = `You are a professional ISA-certified arborist and disaster response expert. Analyze this image with extreme detail - examine EVERY element visible in the photo.

CRITICAL: Scan the entire image for:
- Power lines, utility lines, cables (ANY wires visible = HIGH RISK removal)
- Proximity to structures (house, garage, fence, shed, pool)
- Access constraints (driveway width, obstacles, slope)
- Equipment requirements (bucket truck, crane, rigging)
- Multiple trees vs single tree
- Ground conditions (soft soil, pavement, landscaping)

Provide analysis in JSON format:

{
  "treeAnalysis": {
    "species": "Specific species (e.g., 'Southern Live Oak', 'Water Oak', 'Pecan')",
    "estimatedHeight": "Height in feet (e.g., '55-65 feet')",
    "estimatedWeight": "Weight in tons based on species/size (e.g., '6-10 tons')",
    "rootBallDiameter": "If uprooted, diameter in feet",
    "stumpDiameter": "Trunk diameter at base in feet (e.g., '3-4 feet')",
    "healthStatus": "healthy|damaged|dying|dead",
    "hazardLevel": "low|moderate|high|extreme",
    "canopySpread": "Width of canopy in feet (e.g., '40-50 feet')",
    "multipleTreesCount": 1
  },
  "utilityAssessment": {
    "powerLinesPresent": true/false,
    "powerLineType": "none|service_drop|primary|high_voltage",
    "linesInCanopy": true/false,
    "utilityCoordinationRequired": true/false,
    "riskMultiplier": 1.0-3.0
  },
  "accessAssessment": {
    "bucketTruckAccess": true/false,
    "craneRequired": true/false,
    "riggingRequired": true/false,
    "groundConditions": "stable|soft|paved|sloped",
    "accessDifficulty": "easy|moderate|difficult|extreme"
  },
  "safetyAssessment": {
    "blocksEgress": true/false,
    "blocksIngress": true/false,
    "immediateHazards": ["power lines", "structure proximity", "leaning", "dead branches", etc.],
    "accessibilityImpact": "Description of access impact",
    "emergencyRisk": "none|low|moderate|high|critical"
  },
  "damageAssessment": {
    "severity": "minimal|moderate|severe|catastrophic",
    "damageType": ["roof damage", "structural", "landscaping", "fence", "driveway", etc.],
    "affectedStructures": ["house", "garage", "fence", "power lines", etc.],
    "repairPriority": "routine|priority|urgent|emergency",
    "estimatedCost": {
      "min": NUMBER,
      "max": NUMBER,
      "currency": "USD"
    }
  },
  "professionalDescription": {
    "title": "Professional incident title",
    "summary": "2-3 sentences describing the situation and required work",
    "technicalDetails": "Include: tree size, access method, equipment needed, crew size, estimated time",
    "recommendedActions": ["Step-by-step professional recommendations"],
    "safetyNotes": "Critical safety info - MUST mention power lines if present",
    "insuranceNotes": "Document: utility coordination, specialized equipment, complexity factors"
  },
  "autoTags": ["tree removal", "power lines", "crane work", "technical removal", etc.],
  "confidence": 0.85,
  "pricingFactors": {
    "baseJobType": "standard|technical|high_risk|emergency",
    "sizeCategory": "small|medium|large|giant",
    "complexityMultiplier": 1.0-2.5,
    "equipmentCosts": "Describe equipment needed and approximate costs"
  }
}

PRICING GUIDANCE (CRITICAL - Use these ranges):
- Small tree, open yard, no hazards: $800-$2,000
- Medium tree, easy access: $1,500-$3,500
- Large tree, easy access: $2,500-$5,000
- Large tree near structure: $3,500-$6,500
- Tree touching/near power lines (SERVICE DROP): $3,500-$8,000
- Tree in PRIMARY power lines: $5,000-$12,000+
- Giant tree requiring crane: $4,500-$9,000
- Emergency/storm damage: Add 25-50% premium

CRITICAL REQUIREMENTS:
1. ALWAYS check for power lines - if visible, set powerLinesPresent=true and adjust pricing UP significantly
2. Power line involvement = minimum $3,500 for ANY tree
3. Large trees (>40ft) near structures = minimum $3,000
4. If crane is needed, add $800-$2,500 to estimate
5. Count ALL trees visible - price for total removal scope
6. Document everything visible for insurance purposes

Context: ${projectContext || 'General contractor estimate'}
Location: ${location?.address || 'Location not specified'}`;

    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 2000,
        temperature: 0.3,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: analysisPrompt
              },
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: 'image/jpeg',
                  data: imageBase64
                }
              }
            ]
          }
        ]
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Claude');
      }

      // Parse the JSON response
      let analysisData;
      try {
        // Extract JSON from the response (in case there's extra text)
        const jsonMatch = content.text.match(/\{[\s\S]*\}/);
        const jsonString = jsonMatch ? jsonMatch[0] : content.text;
        analysisData = JSON.parse(jsonString);
      } catch (parseError) {
        console.error('Error parsing AI response:', content.text);
        throw new Error('Failed to parse AI analysis response');
      }

      // Create the enhanced analysis object with utility/access assessment
      const enhancedAnalysis: EnhancedImageAnalysis = {
        id: `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        location: location || { lat: 0, lng: 0, address: 'Unknown location' },
        treeAnalysis: analysisData.treeAnalysis ? {
          ...analysisData.treeAnalysis,
          canopySpread: analysisData.treeAnalysis.canopySpread || undefined,
          multipleTreesCount: analysisData.treeAnalysis.multipleTreesCount || 1
        } : null,
        utilityAssessment: analysisData.utilityAssessment ? {
          powerLinesPresent: analysisData.utilityAssessment.powerLinesPresent || false,
          powerLineType: analysisData.utilityAssessment.powerLineType || 'none',
          linesInCanopy: analysisData.utilityAssessment.linesInCanopy || false,
          utilityCoordinationRequired: analysisData.utilityAssessment.utilityCoordinationRequired || false,
          riskMultiplier: analysisData.utilityAssessment.riskMultiplier || 1.0
        } : null,
        accessAssessment: analysisData.accessAssessment ? {
          bucketTruckAccess: analysisData.accessAssessment.bucketTruckAccess ?? true,
          craneRequired: analysisData.accessAssessment.craneRequired || false,
          riggingRequired: analysisData.accessAssessment.riggingRequired || false,
          groundConditions: analysisData.accessAssessment.groundConditions || 'stable',
          accessDifficulty: analysisData.accessAssessment.accessDifficulty || 'moderate'
        } : null,
        pricingFactors: analysisData.pricingFactors ? {
          baseJobType: analysisData.pricingFactors.baseJobType || 'standard',
          sizeCategory: analysisData.pricingFactors.sizeCategory || 'medium',
          complexityMultiplier: analysisData.pricingFactors.complexityMultiplier || 1.0,
          equipmentCosts: analysisData.pricingFactors.equipmentCosts || 'Standard equipment'
        } : null,
        safetyAssessment: {
          blocksEgress: analysisData.safetyAssessment?.blocksEgress || false,
          blocksIngress: analysisData.safetyAssessment?.blocksIngress || false,
          immediateHazards: analysisData.safetyAssessment?.immediateHazards || [],
          accessibilityImpact: analysisData.safetyAssessment?.accessibilityImpact || 'No significant impact',
          emergencyRisk: analysisData.safetyAssessment?.emergencyRisk || 'none'
        },
        damageAssessment: {
          severity: analysisData.damageAssessment?.severity || 'minimal',
          damageType: analysisData.damageAssessment?.damageType || [],
          affectedStructures: analysisData.damageAssessment?.affectedStructures || [],
          repairPriority: analysisData.damageAssessment?.repairPriority || 'routine',
          estimatedCost: analysisData.damageAssessment?.estimatedCost || { min: 0, max: 0, currency: 'USD' }
        },
        professionalDescription: {
          title: analysisData.professionalDescription?.title || 'Property Assessment',
          summary: analysisData.professionalDescription?.summary || 'Assessment completed',
          technicalDetails: analysisData.professionalDescription?.technicalDetails || 'No technical details available',
          recommendedActions: analysisData.professionalDescription?.recommendedActions || [],
          safetyNotes: analysisData.professionalDescription?.safetyNotes || 'Standard safety precautions apply',
          insuranceNotes: analysisData.professionalDescription?.insuranceNotes || 'Document for insurance review'
        },
        autoTags: analysisData.autoTags || ['assessment'],
        confidence: analysisData.confidence || 0.5,
        editable: true,
        lastModified: new Date().toISOString(),
        modifiedBy: 'AI System'
      };

      console.log('✅ Enhanced image analysis completed:', {
        species: enhancedAnalysis.treeAnalysis?.species,
        severity: enhancedAnalysis.damageAssessment.severity,
        blocksAccess: enhancedAnalysis.safetyAssessment.blocksEgress || enhancedAnalysis.safetyAssessment.blocksIngress,
        confidence: enhancedAnalysis.confidence
      });

      return enhancedAnalysis;

    } catch (error) {
      console.error('❌ Enhanced image analysis failed:', error);
      
      // Return a basic analysis structure on error with defaults for typical residential job
      return {
        id: `analysis_${Date.now()}_error`,
        timestamp: new Date().toISOString(),
        location: location || { lat: 0, lng: 0, address: 'Unknown location' },
        treeAnalysis: null,
        utilityAssessment: null,
        accessAssessment: null,
        pricingFactors: null,
        safetyAssessment: {
          blocksEgress: false,
          blocksIngress: false,
          immediateHazards: ['Analysis temporarily unavailable'],
          accessibilityImpact: 'Unable to assess',
          emergencyRisk: 'none'
        },
        damageAssessment: {
          severity: 'moderate',
          damageType: ['assessment pending'],
          affectedStructures: [],
          repairPriority: 'routine',
          estimatedCost: { min: 3500, max: 5800, currency: 'USD' }
        },
        professionalDescription: {
          title: 'Analysis Unavailable',
          summary: 'AI analysis temporarily unavailable. Manual assessment recommended.',
          technicalDetails: 'Professional evaluation required for detailed assessment.',
          recommendedActions: ['Manual inspection recommended'],
          safetyNotes: 'Exercise standard safety precautions',
          insuranceNotes: 'Professional assessment recommended for insurance documentation'
        },
        autoTags: ['pending analysis'],
        confidence: 0.0,
        editable: true,
        lastModified: new Date().toISOString(),
        modifiedBy: 'System'
      };
    }
  }

  async updateAnalysisDescription(
    analysisId: string, 
    updates: Partial<ProfessionalDescription>,
    userId: string
  ): Promise<EnhancedImageAnalysis> {
    // In a real implementation, this would update the database
    // For now, return a mock updated analysis
    console.log('📝 Updating analysis description:', { analysisId, updates, userId });
    
    throw new Error('Update functionality not yet implemented');
  }

  async deleteAnalysis(analysisId: string, userId: string): Promise<boolean> {
    // In a real implementation, this would delete from the database
    console.log('🗑️ Deleting analysis:', { analysisId, userId });
    
    throw new Error('Delete functionality not yet implemented');
  }

  async generateCoverSheet(projectId: string, analyses: EnhancedImageAnalysis[]): Promise<string> {
    if (!this.anthropic) {
      throw new Error('AI service not available for cover sheet generation');
    }

    const coverSheetPrompt = `You are a professional disaster assessment specialist creating a comprehensive cover sheet report.

Based on the following image analyses, create a professional narrative story that summarizes the overall situation:

${analyses.map((analysis, index) => `
Analysis ${index + 1}:
- Title: ${analysis.professionalDescription.title}
- Summary: ${analysis.professionalDescription.summary}
- Tree: ${analysis.treeAnalysis?.species || 'N/A'} (${analysis.treeAnalysis?.estimatedWeight || 'Unknown weight'})
- Damage Severity: ${analysis.damageAssessment.severity}
- Safety Issues: ${analysis.safetyAssessment.immediateHazards.join(', ')}
- Blocks Access: ${analysis.safetyAssessment.blocksEgress || analysis.safetyAssessment.blocksIngress ? 'Yes' : 'No'}
`).join('\n')}

Create a professional cover sheet narrative that:
1. Provides an executive summary of the overall incident
2. Describes the sequence of events and damage patterns
3. Highlights key safety concerns and access issues
4. Summarizes tree removal and restoration requirements
5. Provides cost estimates and timeline projections
6. Includes professional recommendations for insurance and remediation

Format as a professional report suitable for insurance adjusters, property owners, and restoration contractors.`;

    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 1500,
        temperature: 0.3,
        messages: [
          {
            role: 'user',
            content: coverSheetPrompt
          }
        ]
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Claude');
      }

      return content.text;

    } catch (error) {
      console.error('❌ Cover sheet generation failed:', error);
      return 'Professional assessment report generation temporarily unavailable. Please contact support for manual report generation.';
    }
  }
}