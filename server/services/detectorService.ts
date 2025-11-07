// AI Damage Detection Foundation Service
// Simple service that processes minimal detection jobs and creates detection results

import { storage } from "../storage";
import type { DetectionJob, DetectionResult, InsertDetectionResult } from "@shared/schema";

export class DetectorService {
  private anthropic: any = null;
  private apiKeyAvailable: boolean = false;
  private isProcessing: boolean = false;
  private initializationPromise: Promise<void> | null = null;

  constructor() {
    this.apiKeyAvailable = Boolean(process.env.ANTHROPIC_API_KEY?.trim());
    
    if (this.apiKeyAvailable) {
      console.log('🤖 DetectorService: AI analysis enabled with Anthropic API');
    } else {
      console.log('⚠️ DetectorService: Using mock analysis - set ANTHROPIC_API_KEY to enable AI');
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
          timeout: 30000
        });
        console.log('✅ DetectorService: Anthropic SDK initialized');
      } catch (error) {
        console.error('❌ DetectorService: Failed to initialize Anthropic SDK:', error);
        this.anthropic = null;
        throw error;
      }
    })();

    return this.initializationPromise;
  }

  /**
   * Process a detection job and create results
   */
  async processJob(job: DetectionJob): Promise<DetectionResult[]> {
    console.log(`🔍 Processing detection job ${job.id} (${job.sourceType}:${job.sourceId})`);

    try {
      // Update job status to processing
      await storage.updateDetectionJob(job.id, { status: 'processing' });

      let detectionResults: InsertDetectionResult[];

      if (this.apiKeyAvailable) {
        detectionResults = await this.analyzeWithAI(job);
      } else {
        detectionResults = this.generateMockResults(job);
      }

      // Create detection results in storage
      const createdResults: DetectionResult[] = [];
      for (const resultData of detectionResults) {
        const result = await storage.createDetectionResult(resultData);
        createdResults.push(result);
      }

      // Update job status to completed
      await storage.updateDetectionJob(job.id, { status: 'completed' });

      console.log(`✅ Job ${job.id} completed with ${createdResults.length} results`);
      return createdResults;

    } catch (error) {
      console.error(`❌ Job ${job.id} failed:`, error);
      
      // Update job status to failed
      await storage.updateDetectionJob(job.id, { status: 'failed' });
      
      throw error;
    }
  }

  /**
   * Analyze source using Anthropic AI
   */
  private async analyzeWithAI(job: DetectionJob): Promise<InsertDetectionResult[]> {
    console.log(`🤖 Analyzing ${job.sourceType} with AI`);

    // Initialize Anthropic if needed
    if (!this.anthropic) {
      await this.initializeAnthropic();
    }

    try {
      const prompt = this.buildAnalysisPrompt(job);
      
      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: prompt
        }]
      });

      const analysisText = response.content[0].type === 'text' ? response.content[0].text : '';
      return this.parseAIResponse(analysisText, job);

    } catch (error) {
      console.error('AI analysis failed, falling back to mock results:', error);
      return this.generateMockResults(job);
    }
  }

  /**
   * Build analysis prompt for AI
   */
  private buildAnalysisPrompt(job: DetectionJob): string {
    return `Analyze this ${job.sourceType} (ID: ${job.sourceId}) for storm damage.

Return a JSON array of detections with this structure:
[
  {
    "label": "tree_damage|roof_damage|vehicle_damage|flooding|debris|structure_damage",
    "confidence": number (0-100),
    "severityScore": number (0-10),
    "bbox": {"x": number, "y": number, "width": number, "height": number},
    "geometry": {"type": "Point", "coordinates": [lng, lat]},
    "metadata": {"description": "string", "priority": "low|medium|high|critical"}
  }
]

If no damage is detected, return an empty array [].

Focus on:
- Tree damage (fallen trees, broken branches)
- Roof damage (missing shingles, structural damage) 
- Vehicle damage (cars hit by debris)
- Flooding (water accumulation)
- Debris (blocking roads/driveways)
- Structure damage (buildings, fences)

Provide confidence scores and severity ratings based on visible damage extent.`;
  }

  /**
   * Parse AI response into detection results
   */
  private parseAIResponse(analysisText: string, job: DetectionJob): InsertDetectionResult[] {
    try {
      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = analysisText.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/) || 
                       analysisText.match(/(\[[\s\S]*\])/);
      
      if (!jsonMatch) {
        console.log('No JSON array found in AI response, checking for object...');
        const objMatch = analysisText.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/) || 
                        analysisText.match(/(\{[\s\S]*\})/);
        if (objMatch) {
          const obj = JSON.parse(objMatch[1]);
          if (obj.detections && Array.isArray(obj.detections)) {
            return this.normalizeDetections(obj.detections, job);
          }
        }
        return [];
      }

      const detections = JSON.parse(jsonMatch[1]);
      return this.normalizeDetections(detections, job);

    } catch (error) {
      console.error('Failed to parse AI response:', error);
      console.log('Raw AI response:', analysisText);
      return [];
    }
  }

  /**
   * Normalize detection data
   */
  private normalizeDetections(detections: any[], job: DetectionJob): InsertDetectionResult[] {
    const validLabels = ['tree_damage', 'roof_damage', 'vehicle_damage', 'flooding', 'debris', 'structure_damage'];
    
    return detections.map(d => ({
      jobId: job.id,
      label: validLabels.includes(d.label) ? d.label : 'structure_damage',
      confidence: Math.min(100, Math.max(0, Number(d.confidence) || 50)),
      bbox: d.bbox && typeof d.bbox === 'object' ? d.bbox : null,
      geometry: d.geometry && typeof d.geometry === 'object' ? d.geometry : null,
      severityScore: Math.min(10, Math.max(0, Number(d.severityScore) || 5)),
      metadata: {
        description: d.metadata?.description || d.description || 'Damage detected by AI',
        priority: d.metadata?.priority || 'medium',
        sourceType: job.sourceType,
        sourceId: job.sourceId,
        analysisMethod: 'ai'
      }
    }));
  }

  /**
   * Generate deterministic mock results for testing
   */
  private generateMockResults(job: DetectionJob): InsertDetectionResult[] {
    console.log(`🎭 Generating mock results for ${job.sourceType}:${job.sourceId}`);

    // Generate deterministic results based on source ID hash
    const hash = this.simpleHash(job.sourceId);
    const numResults = (hash % 3) + 1; // 1-3 results
    
    const labels = ['tree_damage', 'roof_damage', 'vehicle_damage', 'flooding', 'debris', 'structure_damage'];
    const priorities = ['low', 'medium', 'high', 'critical'];
    
    const results: InsertDetectionResult[] = [];
    
    for (let i = 0; i < numResults; i++) {
      const labelIndex = (hash + i) % labels.length;
      const confidence = 60 + ((hash + i) % 40); // 60-99%
      const severity = 3 + ((hash + i) % 7); // 3-9 scale
      
      results.push({
        jobId: job.id,
        label: labels[labelIndex],
        confidence,
        bbox: job.sourceType === 'photo' || job.sourceType === 'video' ? {
          x: (hash + i * 10) % 100,
          y: (hash + i * 15) % 100,
          width: 50 + ((hash + i) % 50),
          height: 50 + ((hash + i * 2) % 50)
        } : null,
        geometry: job.sourceType === 'traffic_cam' ? {
          type: "Point",
          coordinates: [-84.39 + ((hash + i) % 100) / 1000, 33.76 + ((hash + i * 2) % 100) / 1000]
        } : null,
        severityScore: severity,
        metadata: {
          description: `Mock ${labels[labelIndex].replace('_', ' ')} detection`,
          priority: priorities[(hash + i) % priorities.length],
          sourceType: job.sourceType,
          sourceId: job.sourceId,
          analysisMethod: 'mock',
          mockSeed: hash
        }
      });
    }
    
    return results;
  }

  /**
   * Simple hash function for deterministic mock data
   */
  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Process all pending detection jobs
   */
  async processPendingJobs(): Promise<void> {
    if (this.isProcessing) {
      console.log('⏳ DetectorService: Already processing jobs, skipping...');
      return;
    }

    this.isProcessing = true;
    
    try {
      const pendingJobs = await storage.getDetectionJobsByStatus('pending');
      
      if (pendingJobs.length === 0) {
        console.log('📭 DetectorService: No pending jobs to process');
        return;
      }

      console.log(`🔄 DetectorService: Processing ${pendingJobs.length} pending jobs`);
      
      for (const job of pendingJobs) {
        try {
          await this.processJob(job);
        } catch (error) {
          console.error(`Failed to process job ${job.id}:`, error);
          // Continue with other jobs even if one fails
        }
      }
      
      console.log('✅ DetectorService: Finished processing all pending jobs');
      
    } catch (error) {
      console.error('❌ DetectorService: Error processing pending jobs:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Start automatic job processing (can be called periodically)
   */
  async startAutoProcessing(intervalMs: number = 30000): Promise<void> {
    console.log(`🚀 DetectorService: Starting auto-processing every ${intervalMs}ms`);
    
    // Process initially
    await this.processPendingJobs();
    
    // Set up interval for future processing
    setInterval(async () => {
      await this.processPendingJobs();
    }, intervalMs);
  }

  /**
   * Get service status
   */
  getStatus(): { available: boolean; hasApiKey: boolean; processing: boolean } {
    return {
      available: true,
      hasApiKey: this.apiKeyAvailable,
      processing: this.isProcessing
    };
  }
}

// Export singleton instance
export const detectorService = new DetectorService();