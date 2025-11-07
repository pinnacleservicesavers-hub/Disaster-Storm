import { Anthropic } from '@anthropic-ai/sdk';

interface TreeAnalysis {
  species: string;
  estimatedHeight: string;
  estimatedWeight: string;
  rootBallDiameter: string;
  stumpDiameter: string;
  healthStatus: 'healthy' | 'damaged' | 'dying' | 'dead';
  hazardLevel: 'low' | 'moderate' | 'high' | 'extreme';
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

    const analysisPrompt = `You are a professional disaster response and tree service expert analyzing this image for damage assessment and safety evaluation. 

Please provide a comprehensive analysis in JSON format with the following structure:

{
  "treeAnalysis": {
    "species": "Identify the tree species if visible (e.g., 'Southern Live Oak', 'Slash Pine', 'Bald Cypress')",
    "estimatedHeight": "Height in feet (e.g., '45-50 feet')",
    "estimatedWeight": "Estimated weight in tons (e.g., '8-12 tons')",
    "rootBallDiameter": "Root ball diameter if uprooted (e.g., '15-18 feet')",
    "stumpDiameter": "Trunk/stump diameter at base (e.g., '3.5-4 feet')",
    "healthStatus": "healthy|damaged|dying|dead",
    "hazardLevel": "low|moderate|high|extreme"
  },
  "safetyAssessment": {
    "blocksEgress": true/false,
    "blocksIngress": true/false,
    "immediateHazards": ["Array of specific safety hazards"],
    "accessibilityImpact": "Description of how this impacts property access",
    "emergencyRisk": "none|low|moderate|high|critical"
  },
  "damageAssessment": {
    "severity": "minimal|moderate|severe|catastrophic",
    "damageType": ["roof damage", "structural damage", "landscaping", etc.],
    "affectedStructures": ["house", "garage", "fence", "driveway", etc.],
    "repairPriority": "routine|priority|urgent|emergency",
    "estimatedCost": {
      "min": 5000,
      "max": 15000,
      "currency": "USD"
    }
  },
  "professionalDescription": {
    "title": "Brief professional title for this incident",
    "summary": "2-3 sentence overview of what occurred",
    "technicalDetails": "Detailed technical assessment including measurements and specifications",
    "recommendedActions": ["Array of specific recommended actions"],
    "safetyNotes": "Critical safety information for workers and residents",
    "insuranceNotes": "Relevant information for insurance claims and adjusters"
  },
  "autoTags": ["storm damage", "tree removal", "emergency", etc.],
  "confidence": 0.85
}

CRITICAL REQUIREMENTS:
1. If trees are blocking driveways, sidewalks, or doorways, mark blocksEgress/blocksIngress as true
2. Provide specific tree species identification when possible
3. Give realistic weight and diameter measurements based on visible size
4. Include detailed professional descriptions suitable for insurance claims
5. Focus on safety hazards and immediate risks
6. Provide actionable recommendations for contractors

Context: ${projectContext || 'General disaster response assessment'}
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

      // Create the enhanced analysis object
      const enhancedAnalysis: EnhancedImageAnalysis = {
        id: `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        location: location || { lat: 0, lng: 0, address: 'Unknown location' },
        treeAnalysis: analysisData.treeAnalysis || null,
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
      
      // Return a basic analysis structure on error
      return {
        id: `analysis_${Date.now()}_error`,
        timestamp: new Date().toISOString(),
        location: location || { lat: 0, lng: 0, address: 'Unknown location' },
        treeAnalysis: null,
        safetyAssessment: {
          blocksEgress: false,
          blocksIngress: false,
          immediateHazards: ['Analysis temporarily unavailable'],
          accessibilityImpact: 'Unable to assess',
          emergencyRisk: 'none'
        },
        damageAssessment: {
          severity: 'minimal',
          damageType: ['assessment pending'],
          affectedStructures: [],
          repairPriority: 'routine',
          estimatedCost: { min: 0, max: 0, currency: 'USD' }
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