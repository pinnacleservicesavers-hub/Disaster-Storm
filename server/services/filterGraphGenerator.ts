import crypto from 'crypto';
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

export interface FilterGraphParams {
  mediaId: string;
  toolCalls: ToolCall[];
  outputFormat?: 'mp4' | 'webm';
}

export interface ToolCall {
  name: string;
  args: any;
  id: string;
}

export interface FilterResult {
  outputKey: string;
  filterGraph: string;
  originalKey: string;
  appliedTools: string[];
  metadata: {
    duration?: number;
    dimensions?: { width: number; height: number };
    fileSize?: number;
  };
}

export class FilterGraphGenerator {
  private uploadsDir: string;
  
  constructor(uploadsDir: string = 'uploads') {
    this.uploadsDir = uploadsDir;
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
  }

  /**
   * Generate ffmpeg filter graph from tool calls - never overwrites originals
   */
  async generateFilterGraph(params: FilterGraphParams): Promise<FilterResult> {
    const { mediaId, toolCalls, outputFormat = 'mp4' } = params;
    
    // Generate new unique storage key
    const timestamp = Date.now();
    const toolHash = crypto.createHash('sha256').update(JSON.stringify(toolCalls)).digest('hex').substring(0, 8);
    const outputKey = `${mediaId}_filtered_${timestamp}_${toolHash}.${outputFormat}`;
    
    // Build filter graph from tool calls
    const filters: string[] = [];
    const appliedTools: string[] = [];
    
    for (const toolCall of toolCalls) {
      const filter = this.toolCallToFilter(toolCall);
      if (filter) {
        filters.push(filter);
        appliedTools.push(toolCall.name);
      }
    }
    
    // Combine filters into single filter graph
    const filterGraph = filters.length > 0 ? filters.join(', ') : 'null';
    
    return {
      outputKey,
      filterGraph,
      originalKey: mediaId,
      appliedTools,
      metadata: {
        // Will be populated after processing
      }
    };
  }

  /**
   * Convert individual tool call to ffmpeg filter
   */
  private toolCallToFilter(toolCall: ToolCall): string | null {
    switch (toolCall.name) {
      case 'annotate_addCircle':
      case 'annotate.addCircle':
        return this.generateCircleFilter(toolCall.args);
        
      case 'measure_diameterFromFrame':
      case 'measure.diameter':
        return this.generateMeasurementFilter(toolCall.args);
        
      case 'damage_detect':
      case 'damage.detect_regions':
        return this.generateDamageFilter(toolCall.args);
        
      default:
        console.warn(`Unknown tool call: ${toolCall.name}`);
        return null;
    }
  }

  /**
   * Generate circle annotation filter
   */
  private generateCircleFilter(args: any): string {
    const { x, y, r, label, color = 'red@0.5' } = args;
    
    // Circle with text label
    const circleFilter = `drawbox=x=${x-r}:y=${y-r}:w=${r*2}:h=${r*2}:color=${color}:t=5`;
    const textFilter = `drawtext=text='${this.escapeText(label)}':x=${x-r}:y=${y+r+10}:fontsize=18:fontcolor=white:box=1:boxcolor=black@0.6`;
    
    return `${circleFilter}, ${textFilter}`;
  }

  /**
   * Generate measurement annotation filter
   */
  private generateMeasurementFilter(args: any): string {
    const { x1, y1, x2, y2, inches, uncertaintyPct } = args;
    
    // Draw measurement line
    const lineFilter = `drawbox=x=${Math.min(x1,x2)}:y=${Math.min(y1,y2)}:w=${Math.abs(x2-x1)}:h=${Math.abs(y2-y1)}:color=yellow@0.7:t=3`;
    
    // Add measurement text
    const measurement = `${inches.toFixed(1)}" (±${uncertaintyPct}%)`;
    const textX = Math.min(x1, x2);
    const textY = Math.min(y1, y2) - 25;
    const textFilter = `drawtext=text='${measurement}':x=${textX}:y=${textY}:fontsize=16:fontcolor=yellow:box=1:boxcolor=black@0.8`;
    
    return `${lineFilter}, ${textFilter}`;
  }

  /**
   * Generate damage detection filter
   */
  private generateDamageFilter(args: any): string {
    const { regions = [], confidence_threshold = 0.7 } = args;
    
    const filters: string[] = [];
    
    regions.forEach((region: any, index: number) => {
      if (region.confidence >= confidence_threshold) {
        const { bbox, type, confidence } = region;
        const { x, y, width, height } = bbox;
        
        // Damage highlight box
        const boxFilter = `drawbox=x=${x}:y=${y}:w=${width}:h=${height}:color=orange@0.6:t=4`;
        
        // Confidence label
        const label = `${type} (${(confidence * 100).toFixed(1)}%)`;
        const textFilter = `drawtext=text='${label}':x=${x}:y=${y-20}:fontsize=14:fontcolor=orange:box=1:boxcolor=black@0.7`;
        
        filters.push(`${boxFilter}, ${textFilter}`);
      }
    });
    
    return filters.join(', ');
  }

  /**
   * Execute filter graph on media file
   */
  async processMedia(filterResult: FilterResult, inputPath: string): Promise<FilterResult> {
    const outputPath = path.join(this.uploadsDir, filterResult.outputKey);
    
    try {
      // Build ffmpeg command
      const ffmpegCmd = [
        'ffmpeg',
        '-i', inputPath,
        '-vf', `"${filterResult.filterGraph}"`,
        '-codec:a', 'copy',
        '-y', // Overwrite output file
        outputPath
      ].join(' ');
      
      console.log(`🎬 Executing filter graph: ${ffmpegCmd}`);
      
      // Execute ffmpeg
      execSync(ffmpegCmd, { stdio: 'pipe' });
      
      // Get metadata
      const stats = fs.statSync(outputPath);
      filterResult.metadata.fileSize = stats.size;
      
      // Get video metadata using ffprobe
      try {
        const probeCmd = `ffprobe -v quiet -print_format json -show_format -show_streams "${outputPath}"`;
        const probeOutput = execSync(probeCmd, { encoding: 'utf8' });
        const metadata = JSON.parse(probeOutput);
        
        const videoStream = metadata.streams.find((s: any) => s.codec_type === 'video');
        if (videoStream) {
          filterResult.metadata.dimensions = {
            width: videoStream.width,
            height: videoStream.height
          };
          filterResult.metadata.duration = parseFloat(videoStream.duration);
        }
      } catch (probeError) {
        console.warn('Failed to get video metadata:', probeError);
      }
      
      console.log(`✅ Filter graph processed: ${filterResult.outputKey}`);
      return filterResult;
      
    } catch (error) {
      console.error('❌ Filter graph processing failed:', error);
      throw new Error(`Filter processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate filter graph for water line damage (example from user's ffmpeg command)
   */
  generateWaterLineDamageFilter(x: number = 420, y: number = 260): string {
    return `drawbox=x=${x}:y=${y}:w=116:h=116:color=red@0.5:t=5, drawtext=text='Water line damage':x=${x+10}:y=${y+120}:fontsize=24:fontcolor=white:box=1:boxcolor=black@0.6`;
  }

  /**
   * Escape special characters in text for ffmpeg
   */
  private escapeText(text: string): string {
    return text
      .replace(/'/g, "\\'")
      .replace(/:/g, "\\:")
      .replace(/,/g, "\\,")
      .replace(/\[/g, "\\[")
      .replace(/\]/g, "\\]");
  }

  /**
   * Get storage path for a key
   */
  getStoragePath(key: string): string {
    return path.join(this.uploadsDir, key);
  }

  /**
   * Check if storage key exists
   */
  keyExists(key: string): boolean {
    return fs.existsSync(this.getStoragePath(key));
  }
}

export default FilterGraphGenerator;