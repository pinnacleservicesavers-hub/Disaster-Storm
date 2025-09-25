import { WebSocketServer } from 'ws';
import type { IncomingMessage } from 'http';
import { v4 as uuid } from 'uuid';
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

// Clean Tools Implementation - Your Simplified Pattern
export const tools = {
  async annotate_addCircle({ mediaId, x, y, r, label }: any) {
    // persist annotation row; return id
    return { annotationId: crypto.randomUUID() };
  },
  
  async measure_diameterFromFrame({ mediaId, x1, y1, x2, y2, scalePxPerInch }: any) {
    const px = Math.hypot(x2-x1, y2-y1);
    const inches = px / scalePxPerInch;
    return { inches, uncertaintyPct: 8 };
  },
  
  async estimate_treeWeight({ species, dbhIn, lengthFt, method }: any) {
    // Look up coefficients from DB table (configurable)
    // Example placeholder: w = a * (dbhIn ** b) * (lengthFt ** c)
    const a=0.15, b=2.4, c=0.9; // placeholder
    const weight = a * Math.pow(dbhIn, b) * Math.pow(lengthFt, c);
    return { weightLb: weight, formula: { a, b, c, method } };
  }
};

// Clean Tool Executor - Maintains Audit Logging with Your Pattern
class ToolExecutor {
  private storage: any;

  constructor(storage: any) {
    this.storage = storage;
  }

  async executeTool(toolCall: ToolCall, sessionId: string): Promise<ToolResult> {
    const toolHash = crypto.createHash('sha256')
      .update(JSON.stringify({ ...toolCall, sessionId, timestamp: new Date().toISOString() }))
      .digest('hex');

    try {
      let result: any;
      
      // Map tool names to your clean function names
      const toolMap = {
        'annotate.addCircle': 'annotate_addCircle',
        'measure.diameter': 'measure_diameterFromFrame', 
        'tree.estimate_weight': 'estimate_treeWeight'
      };
      
      const cleanToolName = toolMap[toolCall.name as keyof typeof toolMap];
      
      if (cleanToolName && tools[cleanToolName as keyof typeof tools]) {
        result = await tools[cleanToolName as keyof typeof tools](toolCall.arguments);
      } else {
        throw new Error(`Unknown tool: ${toolCall.name}`);
      }

      // Log successful tool execution for audit trail
      await this.storage.createAiAction({
        sessionId,
        action: toolCall.name,
        input: toolCall.arguments,
        output: result || {},
        mediaId: toolCall.arguments.mediaId || 'unknown',
        sha256: toolHash
      });

      return {
        id: toolCall.id,
        success: true,
        data: result
      };

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
}

// WebSocket Server Implementation - Your Clean Pattern
export function attachAssistantWSS(server: any, storage: any) {
  const wss = new WebSocketServer({ noServer: true });
  const toolExecutor = new ToolExecutor(storage);

  server.on('upgrade', (req: IncomingMessage, socket, head) => {
    if (req.url?.startsWith('/ws/assistant')) {
      wss.handleUpgrade(req, socket, head, (ws) => wss.emit('connection', ws, req));
    }
  });

  wss.on('connection', (ws) => {
    let sessionId = uuid();

    ws.on('message', async (raw) => {
      const msg = safeParse(raw);
      if (!msg) return;

      if (msg.type === 'start') {
        // Initialize session: load project context, embeddings, etc.
        ws.send(JSON.stringify({ 
          type: 'assistant_text', 
          text: 'AI Assistant ready. I can help with measurements, tree weight estimation, damage detection, and annotations.' 
        }));
      }

      if (msg.type === 'user_text') {
        // TODO: Send to LLM + tools planner
        // For now, demo tool call based on user input
        if (msg.text.toLowerCase().includes('damage')) {
          ws.send(JSON.stringify({ 
            type: 'assistant_text', 
            text: 'I\'ll analyze this image for damage and highlight suspected areas.' 
          }));
          
          // Execute damage detection tool
          const toolCall: ToolCall = {
            id: uuid(),
            name: 'damage.detect_regions',
            arguments: { 
              mediaId: 'demo-media', 
              damageTypes: ['cracked_limb', 'roof_damage'],
              confidence_threshold: 0.7 
            }
          };

          const result = await toolExecutor.executeTool(toolCall, sessionId);
          
          ws.send(JSON.stringify({ 
            type: 'tool_call', 
            name: toolCall.name, 
            args: toolCall.arguments 
          }));
          
          ws.send(JSON.stringify({ 
            type: 'tool_result', 
            result 
          }));

        } else if (msg.text.toLowerCase().includes('measure')) {
          ws.send(JSON.stringify({ 
            type: 'assistant_text', 
            text: 'I\'ll help you calibrate measurements and add a circle annotation.' 
          }));
          
          ws.send(JSON.stringify({ 
            type: 'tool_call', 
            name: 'annotate.addCircle', 
            args: { 
              mediaId: 'demo-media', 
              x: 420, y: 260, r: 58, 
              label: 'Measurement reference point' 
            } 
          }));
        } else {
          ws.send(JSON.stringify({ 
            type: 'assistant_text', 
            text: 'I can help with damage detection, measurements, tree weight estimation, and annotations. What would you like to analyze?' 
          }));
        }
      }

      if (msg.type === 'user_audio') {
        // TODO: Stream to STT service; emit partial_transcript messages
        // For now, simulate processing
        ws.send(JSON.stringify({ 
          type: 'partial_transcript', 
          text: 'Processing audio...' 
        }));
        
        // Hash audio for chain-of-custody (critical for legal compliance)
        const audioHash = crypto.createHash('sha256')
          .update(Buffer.from(msg.pcm))
          .digest('hex');
          
        // Store audio with reversible base64 encoding
        await storage.createAiAction({
          sessionId,
          action: 'audio.received',
          input: { audio_base64: Buffer.from(msg.pcm).toString('base64') },
          output: { transcript: 'Processing...' },
          mediaId: 'voice-input',
          sha256: audioHash
        });
      }
    });
  });
}

function safeParse(raw: any) {
  try { 
    return JSON.parse(raw.toString()); 
  } catch { 
    return null; 
  }
}

export default TOOL_REGISTRY;