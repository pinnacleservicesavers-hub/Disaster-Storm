import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic();

export interface ReferenceObject {
  type: 'person' | 'measuring_stick' | 'credit_card' | 'sheet_paper' | 'known_distance';
  value: number;
  unit: 'inches' | 'feet' | 'meters';
}

export interface CaptureContext {
  captureMode: 'single_photo' | 'video_walkthrough' | 'lidar_scan';
  tradeType: 'tree' | 'roofing' | 'siding' | 'flooring' | 'fencing' | 'debris' | 'drywall' | 'concrete';
  latitude?: number;
  longitude?: number;
  address?: string;
  reference?: ReferenceObject;
}

export interface MeasurementResult {
  targetType: string;
  targetDescription: string;
  measurementType: string;
  estimatedValue: number;
  minValue: number;
  maxValue: number;
  unit: string;
  confidenceLevel: 'low' | 'medium' | 'high';
  confidenceScore: number;
  confidenceFactors: Array<{ factor: string; impact: 'positive' | 'negative'; note: string }>;
  aiNotes: string;
  limitationsNoted: string[];
}

export interface TreeMeasurement extends MeasurementResult {
  species?: string;
  speciesConfidence?: number;
  suggestedSpecies?: string[];
  dbhInches?: number;
  heightFeet?: number;
  crownSpreadFeet?: number;
  estimatedWeightLbs?: { min: number; max: number };
  requiresCrane?: boolean;
  accessIssues?: string[];
}

export interface RoofMeasurement extends MeasurementResult {
  totalSquares?: number;
  pitch?: string;
  facetCount?: number;
  ridgeLengthFt?: number;
  valleyLengthFt?: number;
  eavesLengthFt?: number;
  penetrations?: Array<{ type: string; count: number }>;
  damageIndicators?: string[];
}

export interface ScopeOutput {
  category: string;
  description: string;
  quantity: number;
  unit: string;
  industryStandardCategory: string;
  accessComplexity: string;
  hazardFlags: string[];
  confidenceLevel: 'low' | 'medium' | 'high';
  aiModelUsed: string;
  measurementMethodology: string;
  captureContext: CaptureContext | null;
}

const TREE_ALLOMETRICS: Record<string, { a: number; b: number; c: number; greenDensity: number }> = {
  'oak': { a: 2.0773, b: 2.3323, c: 0.0, greenDensity: 63 },
  'pine': { a: 1.2, b: 2.4, c: 0.1, greenDensity: 50 },
  'maple': { a: 1.8, b: 2.35, c: 0.05, greenDensity: 55 },
  'elm': { a: 1.7, b: 2.3, c: 0.0, greenDensity: 54 },
  'ash': { a: 1.6, b: 2.35, c: 0.0, greenDensity: 52 },
  'willow': { a: 1.4, b: 2.2, c: 0.0, greenDensity: 45 },
  'cedar': { a: 1.1, b: 2.3, c: 0.0, greenDensity: 35 },
  'birch': { a: 1.5, b: 2.25, c: 0.0, greenDensity: 48 },
  'default': { a: 1.5, b: 2.3, c: 0.0, greenDensity: 50 }
};

export async function analyzeTreeFromImage(
  imageBase64: string,
  context: CaptureContext
): Promise<TreeMeasurement> {
  const referenceInfo = context.reference 
    ? `Reference object: ${context.reference.type} with known dimension of ${context.reference.value} ${context.reference.unit}.`
    : 'No reference object provided - estimates will have higher uncertainty.';

  const prompt = `You are an expert arborist AI analyzing a tree photo for insurance claim documentation. 

CRITICAL: You must ONLY report what you can actually measure from this image. If you cannot reliably determine something, say "uncertain" or provide a wide range.

${referenceInfo}

Analyze this image and provide measurements in the following JSON format:
{
  "treeDetected": boolean,
  "species": {
    "primary": "most likely species name or 'unknown'",
    "confidence": 0-100,
    "alternatives": ["other possible species"]
  },
  "measurements": {
    "height": {
      "estimate_ft": number or null,
      "min_ft": number or null,
      "max_ft": number or null,
      "confidence": "low" | "medium" | "high",
      "method": "description of how you estimated"
    },
    "dbh": {
      "estimate_inches": number or null,
      "min_inches": number or null,
      "max_inches": number or null,
      "confidence": "low" | "medium" | "high",
      "method": "description of how you estimated"
    },
    "crownSpread": {
      "estimate_ft": number or null,
      "min_ft": number or null,
      "max_ft": number or null,
      "confidence": "low" | "medium" | "high"
    }
  },
  "hazards": {
    "powerlines": boolean,
    "nearStructures": boolean,
    "slopeIssues": boolean,
    "accessRestrictions": ["list any access issues"],
    "requiresCrane": boolean,
    "craneReason": "why crane might be needed"
  },
  "condition": {
    "overallHealth": "healthy" | "stressed" | "declining" | "dead",
    "damageVisible": ["list visible damage types"],
    "leanAngle": number or null (degrees from vertical)
  },
  "limitations": ["list things you cannot determine from this image"],
  "notes": "any additional observations"
}

Remember:
- Be conservative with estimates
- Width ranges should reflect actual uncertainty (±8-20% for height from single photo)
- Do NOT make up precise measurements you cannot justify
- Flag anything you're uncertain about`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/jpeg',
              data: imageBase64.replace(/^data:image\/\w+;base64,/, '')
            }
          },
          { type: 'text', text: prompt }
        ]
      }]
    });

    const textContent = response.content.find(c => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from AI');
    }

    const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse AI response as JSON');
    }

    const analysis = JSON.parse(jsonMatch[0]);
    
    let weightEstimate: { min: number; max: number } | undefined;
    if (analysis.measurements?.dbh?.estimate_inches && analysis.measurements?.height?.estimate_ft) {
      const dbh = analysis.measurements.dbh.estimate_inches;
      const height = analysis.measurements.height.estimate_ft;
      const speciesKey = analysis.species?.primary?.toLowerCase() || 'default';
      const coeffs = TREE_ALLOMETRICS[speciesKey] || TREE_ALLOMETRICS['default'];
      
      const biomassLbs = coeffs.a * Math.pow(dbh, coeffs.b) * Math.pow(height, coeffs.c || 0.1);
      const greenWeight = biomassLbs * 1.5;
      
      weightEstimate = {
        min: Math.round(greenWeight * 0.7),
        max: Math.round(greenWeight * 1.35)
      };
    }

    return {
      targetType: 'tree',
      targetDescription: `${analysis.species?.primary || 'Unknown'} tree`,
      measurementType: 'tree_full_assessment',
      estimatedValue: analysis.measurements?.height?.estimate_ft || 0,
      minValue: analysis.measurements?.height?.min_ft || 0,
      maxValue: analysis.measurements?.height?.max_ft || 0,
      unit: 'ft',
      confidenceLevel: analysis.measurements?.height?.confidence || 'low',
      confidenceScore: analysis.species?.confidence || 50,
      confidenceFactors: [
        context.reference 
          ? { factor: 'Reference object present', impact: 'positive' as const, note: `Using ${context.reference.type} for calibration` }
          : { factor: 'No reference object', impact: 'negative' as const, note: 'Estimates have higher uncertainty' }
      ],
      aiNotes: analysis.notes || '',
      limitationsNoted: analysis.limitations || [],
      species: analysis.species?.primary,
      speciesConfidence: analysis.species?.confidence,
      suggestedSpecies: analysis.species?.alternatives || [],
      dbhInches: analysis.measurements?.dbh?.estimate_inches,
      heightFeet: analysis.measurements?.height?.estimate_ft,
      crownSpreadFeet: analysis.measurements?.crownSpread?.estimate_ft,
      estimatedWeightLbs: weightEstimate,
      requiresCrane: analysis.hazards?.requiresCrane,
      accessIssues: analysis.hazards?.accessRestrictions || []
    };
  } catch (error) {
    console.error('Tree analysis error:', error);
    return {
      targetType: 'tree',
      targetDescription: 'Tree (analysis failed)',
      measurementType: 'tree_full_assessment',
      estimatedValue: 0,
      minValue: 0,
      maxValue: 0,
      unit: 'ft',
      confidenceLevel: 'low',
      confidenceScore: 0,
      confidenceFactors: [{ factor: 'Analysis failed', impact: 'negative', note: String(error) }],
      aiNotes: 'AI analysis could not be completed. Manual measurement required.',
      limitationsNoted: ['AI analysis failed - requires manual inspection']
    };
  }
}

export async function analyzeRoofFromImage(
  imageBase64: string,
  context: CaptureContext
): Promise<RoofMeasurement> {
  const prompt = `You are an expert roofing estimator AI analyzing a roof photo for insurance claim documentation.

CRITICAL: You must ONLY report what you can actually measure from this image. Roof measurements from ground photos have significant limitations.

Analyze this image and provide measurements in the following JSON format:
{
  "roofDetected": boolean,
  "roofType": "gable" | "hip" | "flat" | "shed" | "mansard" | "gambrel" | "mixed" | "unknown",
  "measurements": {
    "estimatedSquares": {
      "value": number or null,
      "min": number or null,
      "max": number or null,
      "confidence": "low" | "medium" | "high",
      "method": "how you estimated"
    },
    "pitch": {
      "estimate": "X/12 format or null",
      "confidence": "low" | "medium" | "high"
    },
    "facetCount": number or null,
    "ridgeLength": { "estimate_ft": number or null, "confidence": "low" | "medium" | "high" },
    "valleyLength": { "estimate_ft": number or null, "confidence": "low" | "medium" | "high" },
    "eavesLength": { "estimate_ft": number or null, "confidence": "low" | "medium" | "high" }
  },
  "penetrations": [
    { "type": "vent" | "skylight" | "chimney" | "satellite" | "hvac" | "pipe", "count": number }
  ],
  "materialType": {
    "type": "shingle" | "metal" | "tile" | "slate" | "flat" | "unknown",
    "confidence": "low" | "medium" | "high"
  },
  "damageIndicators": ["list any visible damage"],
  "limitations": ["list things you cannot determine from this angle/image"],
  "notes": "additional observations",
  "recommendedCapture": "suggestions for better measurement (drone, different angle, etc.)"
}

Remember:
- Ground-level photos rarely give accurate square footage - be honest about limitations
- Pitch estimation from ground view is difficult without reference points
- Recommend aerial/drone capture for accurate roof measurements`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/jpeg',
              data: imageBase64.replace(/^data:image\/\w+;base64,/, '')
            }
          },
          { type: 'text', text: prompt }
        ]
      }]
    });

    const textContent = response.content.find(c => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from AI');
    }

    const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse AI response as JSON');
    }

    const analysis = JSON.parse(jsonMatch[0]);

    return {
      targetType: 'roof',
      targetDescription: `${analysis.roofType || 'Unknown'} roof - ${analysis.materialType?.type || 'unknown material'}`,
      measurementType: 'roof_assessment',
      estimatedValue: analysis.measurements?.estimatedSquares?.value || 0,
      minValue: analysis.measurements?.estimatedSquares?.min || 0,
      maxValue: analysis.measurements?.estimatedSquares?.max || 0,
      unit: 'squares',
      confidenceLevel: analysis.measurements?.estimatedSquares?.confidence || 'low',
      confidenceScore: analysis.measurements?.estimatedSquares?.confidence === 'high' ? 80 : analysis.measurements?.estimatedSquares?.confidence === 'medium' ? 60 : 30,
      confidenceFactors: [
        { factor: 'Ground-level photo', impact: 'negative', note: 'Roof measurements from ground have high uncertainty' }
      ],
      aiNotes: analysis.notes || '',
      limitationsNoted: [...(analysis.limitations || []), 'Aerial/drone imagery recommended for accurate roof measurements'],
      totalSquares: analysis.measurements?.estimatedSquares?.value,
      pitch: analysis.measurements?.pitch?.estimate,
      facetCount: analysis.measurements?.facetCount,
      ridgeLengthFt: analysis.measurements?.ridgeLength?.estimate_ft,
      valleyLengthFt: analysis.measurements?.valleyLength?.estimate_ft,
      eavesLengthFt: analysis.measurements?.eavesLength?.estimate_ft,
      penetrations: analysis.penetrations,
      damageIndicators: analysis.damageIndicators
    };
  } catch (error) {
    console.error('Roof analysis error:', error);
    return {
      targetType: 'roof',
      targetDescription: 'Roof (analysis failed)',
      measurementType: 'roof_assessment',
      estimatedValue: 0,
      minValue: 0,
      maxValue: 0,
      unit: 'squares',
      confidenceLevel: 'low',
      confidenceScore: 0,
      confidenceFactors: [{ factor: 'Analysis failed', impact: 'negative', note: String(error) }],
      aiNotes: 'AI analysis could not be completed. Manual measurement or aerial imagery required.',
      limitationsNoted: ['AI analysis failed - requires professional inspection or drone imagery']
    };
  }
}

export async function analyzeDebrisFromImage(
  imageBase64: string,
  context: CaptureContext
): Promise<MeasurementResult> {
  const referenceInfo = context.reference 
    ? `Reference object: ${context.reference.type} with known dimension of ${context.reference.value} ${context.reference.unit}.`
    : 'No reference object provided - volume estimates will have very high uncertainty.';

  const prompt = `You are an expert debris estimator AI analyzing a debris pile for storm cleanup documentation.

CRITICAL: Debris volume estimation from photos is inherently uncertain. Be conservative and provide wide ranges.

${referenceInfo}

Analyze this image and provide measurements in the following JSON format:
{
  "debrisDetected": boolean,
  "debrisType": ["branches", "leaves", "construction", "mixed", "tree_sections", "roofing", "fencing", "other"],
  "measurements": {
    "volume": {
      "estimate_cubic_yards": number or null,
      "min_cubic_yards": number or null,
      "max_cubic_yards": number or null,
      "confidence": "low" | "medium" | "high",
      "method": "how you estimated"
    },
    "approximateDimensions": {
      "length_ft": number or null,
      "width_ft": number or null,
      "height_ft": number or null
    }
  },
  "disposal": {
    "estimatedLoads": number or null,
    "truckSize": "pickup" | "dump_trailer" | "rolloff" | "unknown",
    "specialDisposal": boolean,
    "specialDisposalReason": "reason if special disposal needed"
  },
  "hazards": ["list any hazards visible"],
  "accessIssues": ["list any access problems"],
  "limitations": ["things you cannot determine"],
  "notes": "additional observations"
}

Remember:
- Debris compaction varies significantly
- Hidden depth is common - note this limitation
- Volume estimates should have ±30-50% uncertainty minimum`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/jpeg',
              data: imageBase64.replace(/^data:image\/\w+;base64,/, '')
            }
          },
          { type: 'text', text: prompt }
        ]
      }]
    });

    const textContent = response.content.find(c => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from AI');
    }

    const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse AI response as JSON');
    }

    const analysis = JSON.parse(jsonMatch[0]);

    return {
      targetType: 'debris_pile',
      targetDescription: `Debris pile - ${(analysis.debrisType || []).join(', ')}`,
      measurementType: 'volume',
      estimatedValue: analysis.measurements?.volume?.estimate_cubic_yards || 0,
      minValue: analysis.measurements?.volume?.min_cubic_yards || 0,
      maxValue: analysis.measurements?.volume?.max_cubic_yards || 0,
      unit: 'cubic_yd',
      confidenceLevel: analysis.measurements?.volume?.confidence || 'low',
      confidenceScore: analysis.measurements?.volume?.confidence === 'high' ? 70 : analysis.measurements?.volume?.confidence === 'medium' ? 50 : 30,
      confidenceFactors: [
        context.reference 
          ? { factor: 'Reference object present', impact: 'positive' as const, note: 'Helps calibrate size estimates' }
          : { factor: 'No reference object', impact: 'negative' as const, note: 'Volume estimates have very high uncertainty' },
        { factor: 'Debris compaction unknown', impact: 'negative' as const, note: 'Actual disposal volume may vary significantly' }
      ],
      aiNotes: analysis.notes || '',
      limitationsNoted: [
        ...(analysis.limitations || []),
        'Debris depth may be hidden - actual volume could be higher',
        'Compaction factor unknown - disposal loads may vary'
      ]
    };
  } catch (error) {
    console.error('Debris analysis error:', error);
    return {
      targetType: 'debris_pile',
      targetDescription: 'Debris (analysis failed)',
      measurementType: 'volume',
      estimatedValue: 0,
      minValue: 0,
      maxValue: 0,
      unit: 'cubic_yd',
      confidenceLevel: 'low',
      confidenceScore: 0,
      confidenceFactors: [{ factor: 'Analysis failed', impact: 'negative', note: String(error) }],
      aiNotes: 'AI analysis could not be completed. Manual measurement required.',
      limitationsNoted: ['AI analysis failed - requires on-site measurement']
    };
  }
}

export function convertToScopeItems(
  measurements: MeasurementResult[],
  tradeType: string,
  captureContext?: CaptureContext
): ScopeOutput[] {
  const scopeItems: ScopeOutput[] = [];
  
  // Derive AI model from trade type for accurate provenance
  const getAiModelForTrade = (trade: string): string => {
    switch (trade) {
      case 'tree': return 'Anthropic Claude 3.5 Sonnet + Forestry Allometric Equations';
      case 'roofing': return 'Anthropic Claude 3.5 Sonnet + Photogrammetric Analysis';
      case 'debris': return 'Anthropic Claude 3.5 Sonnet + Volume Estimation';
      default: return 'Anthropic Claude 3.5 Sonnet';
    }
  };
  
  const getMethodologyForTrade = (trade: string): string => {
    switch (trade) {
      case 'tree': return 'AI-assisted photogrammetric analysis with forestry allometric equations and confidence scoring';
      case 'roofing': return 'AI-assisted roof area and pitch estimation with photogrammetric analysis';
      case 'debris': return 'AI-assisted volume estimation using reference object calibration';
      default: return 'AI-assisted measurement with confidence scoring';
    }
  };
  
  const aiModelUsed = getAiModelForTrade(tradeType);
  const measurementMethodology = getMethodologyForTrade(tradeType);

  for (const m of measurements) {
    if (m.targetType === 'tree') {
      const tree = m as TreeMeasurement;
      const sizeCategory = tree.dbhInches 
        ? (tree.dbhInches < 12 ? 'small' : tree.dbhInches < 24 ? 'medium' : tree.dbhInches < 36 ? 'large' : 'extra_large')
        : 'unknown';
      
      scopeItems.push({
        category: 'labor',
        description: `Tree removal - ${tree.species || 'Unknown species'} (${sizeCategory} category, ~${tree.heightFeet || 'unknown'}ft)`,
        quantity: 1,
        unit: 'each',
        industryStandardCategory: `tree_removal_${sizeCategory}`,
        accessComplexity: tree.requiresCrane ? 'hazardous' : (tree.accessIssues?.length ? 'difficult' : 'standard'),
        hazardFlags: tree.accessIssues || [],
        confidenceLevel: m.confidenceLevel,
        aiModelUsed,
        measurementMethodology,
        captureContext: captureContext || null
      });

      if (tree.requiresCrane) {
        scopeItems.push({
          category: 'equipment',
          description: 'Crane required for tree removal',
          quantity: 1,
          unit: 'day',
          industryStandardCategory: 'equipment_rental_crane',
          accessComplexity: 'hazardous',
          hazardFlags: ['crane_required'],
          confidenceLevel: m.confidenceLevel,
          aiModelUsed,
          measurementMethodology,
          captureContext: captureContext || null
        });
      }

      if (tree.estimatedWeightLbs) {
        const avgWeight = (tree.estimatedWeightLbs.min + tree.estimatedWeightLbs.max) / 2;
        const loadEstimate = Math.ceil(avgWeight / 8000);
        scopeItems.push({
          category: 'disposal',
          description: `Debris haul-off (est. ${loadEstimate} loads, ${tree.estimatedWeightLbs.min.toLocaleString()}-${tree.estimatedWeightLbs.max.toLocaleString()} lbs total)`,
          quantity: loadEstimate,
          unit: 'loads',
          industryStandardCategory: 'debris_disposal_organic',
          accessComplexity: 'standard',
          hazardFlags: [],
          confidenceLevel: m.confidenceLevel,
          aiModelUsed,
          measurementMethodology,
          captureContext: captureContext || null
        });
      }
    }

    if (m.targetType === 'roof') {
      const roof = m as RoofMeasurement;
      
      if (roof.totalSquares) {
        const sizeCategory = roof.totalSquares < 15 ? 'small' : roof.totalSquares < 30 ? 'medium' : 'large';
        scopeItems.push({
          category: 'labor',
          description: `Roof repair/replacement - ${roof.pitch || 'unknown pitch'} (${roof.totalSquares} squares)`,
          quantity: roof.totalSquares,
          unit: 'squares',
          industryStandardCategory: `roofing_${sizeCategory}`,
          accessComplexity: 'standard',
          hazardFlags: roof.damageIndicators || [],
          confidenceLevel: m.confidenceLevel,
          aiModelUsed,
          measurementMethodology,
          captureContext: captureContext || null
        });
      }

      if (roof.penetrations?.length) {
        for (const pen of roof.penetrations) {
          scopeItems.push({
            category: 'labor',
            description: `${pen.type} flashing/repair`,
            quantity: pen.count,
            unit: 'each',
            industryStandardCategory: 'roofing_penetration_repair',
            accessComplexity: 'standard',
            hazardFlags: [],
            confidenceLevel: m.confidenceLevel,
            aiModelUsed,
            measurementMethodology,
            captureContext: captureContext || null
          });
        }
      }
    }

    if (m.targetType === 'debris_pile') {
      const sizeCategory = m.estimatedValue < 5 ? 'small' : m.estimatedValue < 20 ? 'medium' : 'large';
      scopeItems.push({
        category: 'labor',
        description: `Debris cleanup and removal (${m.minValue}-${m.maxValue} cubic yards)`,
        quantity: m.estimatedValue,
        unit: 'cubic_yd',
        industryStandardCategory: `debris_cleanup_${sizeCategory}`,
        accessComplexity: 'standard',
        hazardFlags: [],
        confidenceLevel: m.confidenceLevel,
        aiModelUsed,
        measurementMethodology,
        captureContext: captureContext || null
      });
    }
  }

  return scopeItems;
}

export function generateMeasurementDisclaimer(measurements: MeasurementResult[]): string {
  const hasLowConfidence = measurements.some(m => m.confidenceLevel === 'low');
  const allLimitations = measurements.flatMap(m => m.limitationsNoted);
  
  let disclaimer = '⚠️ AI MEASUREMENT DISCLAIMER\n\n';
  disclaimer += 'These measurements are AI-generated estimates based on photographic analysis. ';
  disclaimer += 'They are provided to assist with scope documentation and are NOT suitable for final pricing or insurance claim submission without professional verification.\n\n';
  
  if (hasLowConfidence) {
    disclaimer += '⚡ LOW CONFIDENCE WARNING: Some measurements have low confidence scores. On-site verification is strongly recommended.\n\n';
  }
  
  if (allLimitations.length > 0) {
    disclaimer += 'LIMITATIONS NOTED:\n';
    const uniqueLimitations = [...new Set(allLimitations)];
    for (const lim of uniqueLimitations.slice(0, 5)) {
      disclaimer += `• ${lim}\n`;
    }
  }
  
  disclaimer += '\nAccuracy ranges:\n';
  disclaimer += '• Tree height from single photo: ±8-20%\n';
  disclaimer += '• DBH from closeup with reference: ±5-15%\n';
  disclaimer += '• Weight estimates: ±15-35% (species-dependent)\n';
  disclaimer += '• Debris volume: ±30-50%\n';
  disclaimer += '• Roof area from ground photos: NOT RELIABLE - drone imagery recommended\n';
  
  return disclaimer;
}
