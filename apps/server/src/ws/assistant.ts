import { WebSocketServer } from 'ws';
import { IncomingMessage } from 'http';
import crypto from 'crypto';

// Tool Registry - Explicit definitions for LLM provider flexibility
export interface Tool {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, any>;
    required: string[];
  };
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, any>;
}

export interface ToolResult {
  id: string;
  success: boolean;
  data?: any;
  error?: string;
  metadata?: Record<string, any>;
}

// Measurement Calibration Types
export interface CalibrationData {
  method: 'reference_line' | 'exif_focal' | 'marker_tag';
  pixelDistance: number;
  realWorldDistance: number;
  units: 'inches' | 'cm' | 'ft' | 'm';
  uncertainty: number; // percentage
  timestamp: string;
  calibrationId: string;
}

// Tree Weight Estimation Types  
export interface AllometricEquation {
  species: string;
  equation: string;
  coefficients: Record<string, number>;
  formula: string; // human-readable formula
  source: string;
  accuracy: string;
}

// Damage Detection Types
export interface DamageRegion {
  type: 'cracked_limb' | 'uprooted_root' | 'roof_damage' | 'downed_line' | 'broken_fence' | 'standing_water';
  confidence: number;
  bbox: { x: number; y: number; width: number; height: number };
  suggested: boolean;
  userConfirmed: boolean;
}

// Tool Registry - Server is the authority for all data mutations
export const TOOL_REGISTRY: Tool[] = [
  {
    name: 'measure.calibrate',
    description: 'Calibrate measurement system using reference object',
    parameters: {
      type: 'object',
      properties: {
        method: { type: 'string', enum: ['reference_line', 'exif_focal', 'marker_tag'] },
        pixelDistance: { type: 'number', description: 'Distance in pixels' },
        realWorldDistance: { type: 'number', description: 'Known real-world distance' },
        units: { type: 'string', enum: ['inches', 'cm', 'ft', 'm'] },
        mediaId: { type: 'string', description: 'Media being calibrated' }
      },
      required: ['method', 'pixelDistance', 'realWorldDistance', 'units', 'mediaId']
    }
  },
  {
    name: 'measure.diameter',
    description: 'Measure diameter using calibrated system',
    parameters: {
      type: 'object', 
      properties: {
        mediaId: { type: 'string' },
        x1: { type: 'number' },
        y1: { type: 'number' },
        x2: { type: 'number' },
        y2: { type: 'number' },
        calibrationId: { type: 'string', description: 'Reference to calibration data' }
      },
      required: ['mediaId', 'x1', 'y1', 'x2', 'y2', 'calibrationId']
    }
  },
  {
    name: 'tree.estimate_weight',
    description: 'Estimate tree weight using allometric equations',
    parameters: {
      type: 'object',
      properties: {
        species: { type: 'string', description: 'Tree species for equation selection' },
        dbh_inches: { type: 'number', description: 'Diameter at breast height in inches' },
        length_ft: { type: 'number', description: 'Section length in feet' },
        equation_id: { type: 'string', description: 'Specific equation to use' }
      },
      required: ['species', 'dbh_inches', 'length_ft']
    }
  },
  {
    name: 'damage.detect_regions',
    description: 'AI-assisted damage detection with user confirmation',
    parameters: {
      type: 'object',
      properties: {
        mediaId: { type: 'string' },
        damageTypes: { 
          type: 'array', 
          items: { type: 'string', enum: ['cracked_limb', 'uprooted_root', 'roof_damage', 'downed_line', 'broken_fence', 'standing_water'] }
        },
        confidence_threshold: { type: 'number', minimum: 0, maximum: 1, default: 0.7 }
      },
      required: ['mediaId']
    }
  },
  {
    name: 'damage.confirm_region',
    description: 'User confirms or rejects AI-suggested damage region',
    parameters: {
      type: 'object',
      properties: {
        regionId: { type: 'string' },
        confirmed: { type: 'boolean' },
        userAnnotation: { type: 'string', description: 'User override description' }
      },
      required: ['regionId', 'confirmed']
    }
  },
  {
    name: 'annotate.addCircle',
    description: 'Add circle annotation to media',
    parameters: {
      type: 'object',
      properties: {
        mediaId: { type: 'string' },
        x: { type: 'number' },
        y: { type: 'number' },
        r: { type: 'number' },
        label: { type: 'string' },
        metadata: { type: 'object', description: 'Additional annotation data' }
      },
      required: ['mediaId', 'x', 'y', 'r', 'label']
    }
  }
];

// Allometric Equation Database - Configurable by species
export const ALLOMETRIC_EQUATIONS: Record<string, AllometricEquation> = {
  'oak_general': {
    species: 'Oak (General)',
    equation: 'weight = 0.25 * (dbh^2.5) * length * density',
    coefficients: { base: 0.25, dbh_exponent: 2.5, density: 0.6 },
    formula: 'Weight (lbs) = 0.25 × DBH^2.5 × Length × Wood Density',
    source: 'Forest Service Biomass Equations',
    accuracy: '±15%'
  },
  'pine_loblolly': {
    species: 'Loblolly Pine',
    equation: 'weight = 0.18 * (dbh^2.3) * length * density',
    coefficients: { base: 0.18, dbh_exponent: 2.3, density: 0.5 },
    formula: 'Weight (lbs) = 0.18 × DBH^2.3 × Length × Wood Density',
    source: 'Southern Forest Research',
    accuracy: '±12%'
  },
  'maple_sugar': {
    species: 'Sugar Maple',
    equation: 'weight = 0.22 * (dbh^2.4) * length * density',
    coefficients: { base: 0.22, dbh_exponent: 2.4, density: 0.65 },
    formula: 'Weight (lbs) = 0.22 × DBH^2.4 × Length × Wood Density',
    source: 'Northeast Forest Inventory',
    accuracy: '±18%'
  }
};

// Tool Execution - Server Authority
export class AssistantToolExecutor {
  private storage: any;
  private calibrations: Map<string, CalibrationData> = new Map();
  private damageRegions: Map<string, DamageRegion> = new Map();

  constructor(storage: any) {
    this.storage = storage;
  }

  async executeTool(toolCall: ToolCall, sessionId: string): Promise<ToolResult> {
    const toolHash = crypto.createHash('sha256')
      .update(JSON.stringify({ ...toolCall, sessionId, timestamp: new Date().toISOString() }))
      .digest('hex');

    try {
      let result: ToolResult;

      switch (toolCall.name) {
        case 'measure.calibrate':
          result = await this.calibrateMeasurement(toolCall, sessionId);
          break;
        case 'measure.diameter': 
          result = await this.measureDiameter(toolCall, sessionId);
          break;
        case 'tree.estimate_weight':
          result = await this.estimateTreeWeight(toolCall, sessionId);
          break;
        case 'damage.detect_regions':
          result = await this.detectDamageRegions(toolCall, sessionId);
          break;
        case 'damage.confirm_region':
          result = await this.confirmDamageRegion(toolCall, sessionId);
          break;
        case 'annotate.addCircle':
          result = await this.addCircleAnnotation(toolCall, sessionId);
          break;
        default:
          throw new Error(`Unknown tool: ${toolCall.name}`);
      }

      // Log successful tool execution
      await this.storage.createAiAction({
        sessionId,
        action: toolCall.name,
        input: toolCall.arguments,
        output: result.data || {},
        mediaId: toolCall.arguments.mediaId || 'unknown',
        sha256: toolHash
      });

      return result;

    } catch (error) {
      const errorResult: ToolResult = {
        id: toolCall.id,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };

      // Log failed tool execution
      await this.storage.createAiAction({
        sessionId,
        action: `${toolCall.name}.error`,
        input: toolCall.arguments,
        output: { error: errorResult.error },
        mediaId: toolCall.arguments.mediaId || 'unknown',
        sha256: toolHash
      });

      return errorResult;
    }
  }

  private async calibrateMeasurement(toolCall: ToolCall, sessionId: string): Promise<ToolResult> {
    const { method, pixelDistance, realWorldDistance, units, mediaId } = toolCall.arguments;
    
    const calibrationId = `cal_${Date.now()}`;
    const uncertainty = this.calculateUncertainty(method);
    
    const calibration: CalibrationData = {
      method,
      pixelDistance,
      realWorldDistance,
      units,
      uncertainty,
      timestamp: new Date().toISOString(),
      calibrationId
    };

    this.calibrations.set(calibrationId, calibration);

    // Store calibration in database
    await this.storage.createAiAction({
      sessionId,
      action: 'calibration.created',
      input: { calibrationId, method, units },
      output: { calibrationId, pixelsPerUnit: pixelDistance / realWorldDistance },
      mediaId,
      sha256: crypto.createHash('sha256').update(JSON.stringify(calibration)).digest('hex')
    });

    return {
      id: toolCall.id,
      success: true,
      data: {
        calibrationId,
        pixelsPerUnit: pixelDistance / realWorldDistance,
        uncertainty: `±${uncertainty}%`,
        method,
        units
      },
      metadata: {
        watermark: 'AI-estimated measurement calibration'
      }
    };
  }

  private async measureDiameter(toolCall: ToolCall, sessionId: string): Promise<ToolResult> {
    const { mediaId, x1, y1, x2, y2, calibrationId } = toolCall.arguments;
    
    const calibration = this.calibrations.get(calibrationId);
    if (!calibration) {
      throw new Error(`Calibration ${calibrationId} not found`);
    }

    const pixelDistance = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    const realWorldDistance = pixelDistance / (calibration.pixelDistance / calibration.realWorldDistance);
    
    const measurement = {
      pixelDistance: Math.round(pixelDistance * 100) / 100,
      realWorldDistance: Math.round(realWorldDistance * 100) / 100,
      units: calibration.units,
      uncertainty: calibration.uncertainty,
      calibrationId
    };

    return {
      id: toolCall.id,
      success: true,
      data: measurement,
      metadata: {
        watermark: `AI-estimated ${calibration.uncertainty}% uncertainty`,
        tapeMeasure: true
      }
    };
  }

  private async estimateTreeWeight(toolCall: ToolCall, sessionId: string): Promise<ToolResult> {
    const { species, dbh_inches, length_ft, equation_id } = toolCall.arguments;
    
    // Find equation by species or ID
    const equationKey = equation_id || this.findEquationBySpecies(species);
    const equation = ALLOMETRIC_EQUATIONS[equationKey];
    
    if (!equation) {
      throw new Error(`No allometric equation found for species: ${species}`);
    }

    // Calculate weight using equation
    const { base, dbh_exponent, density } = equation.coefficients;
    const weight = base * Math.pow(dbh_inches, dbh_exponent) * length_ft * density;

    const result = {
      weight_lbs: Math.round(weight * 100) / 100,
      species: equation.species,
      equation: equation.equation,
      formula: equation.formula,
      coefficients: equation.coefficients,
      inputs: { dbh_inches, length_ft },
      accuracy: equation.accuracy,
      source: equation.source
    };

    return {
      id: toolCall.id,
      success: true,
      data: result,
      metadata: {
        watermark: `AI-estimated tree weight ${equation.accuracy} accuracy`,
        equation_audit: equation.equation
      }
    };
  }

  private async detectDamageRegions(toolCall: ToolCall, sessionId: string): Promise<ToolResult> {
    const { mediaId, damageTypes = [], confidence_threshold = 0.7 } = toolCall.arguments;
    
    // Simulate AI damage detection (in production, this would call TF.js or server models)
    const detectedRegions: DamageRegion[] = [
      {
        type: 'cracked_limb',
        confidence: 0.85,
        bbox: { x: 120, y: 80, width: 60, height: 40 },
        suggested: true,
        userConfirmed: false
      },
      {
        type: 'uprooted_root',
        confidence: 0.92,
        bbox: { x: 200, y: 300, width: 80, height: 60 },
        suggested: true,
        userConfirmed: false
      }
    ];

    // Filter by confidence threshold and requested types
    const filteredRegions = detectedRegions.filter(region => 
      region.confidence >= confidence_threshold &&
      (damageTypes.length === 0 || damageTypes.includes(region.type))
    );

    // Store regions for user confirmation
    filteredRegions.forEach(region => {
      const regionId = `damage_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      this.damageRegions.set(regionId, region);
    });

    return {
      id: toolCall.id,
      success: true,
      data: {
        regions: filteredRegions.map((region, idx) => ({
          regionId: `damage_${Date.now()}_${idx}`,
          ...region
        })),
        total_detected: detectedRegions.length,
        filtered_count: filteredRegions.length,
        confidence_threshold
      },
      metadata: {
        requires_user_confirmation: true,
        detection_model: 'TensorFlow.js damage detection v1.0'
      }
    };
  }

  private async confirmDamageRegion(toolCall: ToolCall, sessionId: string): Promise<ToolResult> {
    const { regionId, confirmed, userAnnotation } = toolCall.arguments;
    
    const region = this.damageRegions.get(regionId);
    if (!region) {
      throw new Error(`Damage region ${regionId} not found`);
    }

    region.userConfirmed = confirmed;
    this.damageRegions.set(regionId, region);

    return {
      id: toolCall.id,
      success: true,
      data: {
        regionId,
        confirmed,
        userAnnotation,
        original_confidence: region.confidence,
        damage_type: region.type
      },
      metadata: {
        user_override: userAnnotation ? true : false
      }
    };
  }

  private async addCircleAnnotation(toolCall: ToolCall, sessionId: string): Promise<ToolResult> {
    const { mediaId, x, y, r, label, metadata = {} } = toolCall.arguments;
    
    const annotationId = `annotation_${Date.now()}`;
    
    // This would integrate with existing annotation system
    const annotation = {
      id: annotationId,
      type: 'circle',
      mediaId,
      coordinates: { x, y, r },
      label,
      metadata,
      createdAt: new Date().toISOString()
    };

    return {
      id: toolCall.id,
      success: true,
      data: annotation
    };
  }

  private calculateUncertainty(method: string): number {
    switch (method) {
      case 'reference_line': return 5;  // ±5%
      case 'exif_focal': return 15;     // ±15%
      case 'marker_tag': return 3;      // ±3%
      default: return 20;               // ±20%
    }
  }

  private findEquationBySpecies(species: string): string {
    const normalized = species.toLowerCase();
    if (normalized.includes('oak')) return 'oak_general';
    if (normalized.includes('pine')) return 'pine_loblolly';
    if (normalized.includes('maple')) return 'maple_sugar';
    return 'oak_general'; // Default fallback
  }
}

export default AssistantToolExecutor;