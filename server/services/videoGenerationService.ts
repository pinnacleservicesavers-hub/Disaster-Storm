export interface VideoGenOptions {
  duration?: number;
  aspectRatio?: string;
  resolution?: string;
  style?: string;
}

export interface VideoGenJob {
  id: string;
  engine: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  prompt: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  error?: string;
  createdAt: number;
  estimatedSeconds?: number;
}

export interface VideoEngine {
  id: string;
  name: string;
  description: string;
  features: string[];
  bestFor: string;
  costPerSecond: string;
  maxDuration: number;
  configured: boolean;
  status: 'ready' | 'needs_key' | 'coming_soon';
}

const ENGINE_META: Omit<VideoEngine, 'configured' | 'status'>[] = [
  {
    id: 'runway-gen3',
    name: 'Runway Gen-3 Alpha',
    description: 'State-of-the-art text and image to video generation with cinematic quality',
    features: ['Text-to-Video', 'Image-to-Video', 'High fidelity motion', 'Cinematic output', '4K upscaling'],
    bestFor: 'Cinematic ads, product demos, creative storytelling',
    costPerSecond: '$0.10',
    maxDuration: 16,
  },
  {
    id: 'luma-dream-machine',
    name: 'Luma Dream Machine',
    description: 'Fast, high-quality video generation with realistic physics and motion',
    features: ['Text-to-Video', 'Realistic physics', 'Fast generation', 'Loop support', 'Multiple aspect ratios'],
    bestFor: 'Quick concept videos, social media content, product visualization',
    costPerSecond: '$0.05',
    maxDuration: 10,
  },
  {
    id: 'pika-labs',
    name: 'Pika Labs',
    description: 'Creative video generation via fal.ai with stylized and artistic output',
    features: ['Text-to-Video', 'Stylized output', 'Multiple resolutions', 'Artistic styles', 'Fast inference'],
    bestFor: 'Artistic content, social media clips, stylized brand videos',
    costPerSecond: '$0.04',
    maxDuration: 8,
  },
  {
    id: 'synthesia',
    name: 'Synthesia',
    description: 'AI avatar-based video generation for professional presentations and training',
    features: ['AI Avatars', 'Script-to-Video', '140+ languages', 'Custom avatars', 'Brand templates'],
    bestFor: 'Training videos, presentations, corporate communications, multilingual content',
    costPerSecond: '$0.08',
    maxDuration: 300,
  },
  {
    id: 'openai-sora',
    name: 'OpenAI Sora',
    description: 'Next-generation video model from OpenAI with unmatched realism and coherence',
    features: ['Text-to-Video', 'World simulation', 'Long-form video', 'Photorealistic output', 'Complex scenes'],
    bestFor: 'Photorealistic scenes, complex narratives, high-fidelity content',
    costPerSecond: 'TBD',
    maxDuration: 60,
  },
  {
    id: 'runway-full-suite',
    name: 'Runway Full Suite',
    description: 'Complete video editing and generation suite with advanced compositing and effects',
    features: ['Video-to-Video', 'Inpainting', 'Motion brush', 'Green screen', 'Style transfer', 'Gen-3 Alpha'],
    bestFor: 'Professional video editing, VFX, advanced compositing workflows',
    costPerSecond: '$0.12',
    maxDuration: 16,
  },
];

const ENGINE_ENV_MAP: Record<string, string> = {
  'runway-gen3': 'RUNWAY_API_KEY',
  'luma-dream-machine': 'LUMA_API_KEY',
  'pika-labs': 'FAL_API_KEY',
  'synthesia': 'SYNTHESIA_API_KEY',
  'openai-sora': 'OPENAI_API_KEY',
  'runway-full-suite': 'RUNWAY_API_KEY',
};

const COMING_SOON_ENGINES = new Set(['openai-sora', 'runway-full-suite']);

export class VideoGenerationService {
  private activeJobs: Map<string, VideoGenJob> = new Map();

  constructor() {
    console.log('🎬 Video Generation Service initialized (multi-engine)');
  }

  private isConfigured(engineId: string): boolean {
    const envVar = ENGINE_ENV_MAP[engineId];
    return !!envVar && !!process.env[envVar];
  }

  private getEngineStatusValue(engineId: string): 'ready' | 'needs_key' | 'coming_soon' {
    if (COMING_SOON_ENGINES.has(engineId)) return 'coming_soon';
    return this.isConfigured(engineId) ? 'ready' : 'needs_key';
  }

  getEngines(): VideoEngine[] {
    return ENGINE_META.map((meta) => ({
      ...meta,
      configured: this.isConfigured(meta.id),
      status: this.getEngineStatusValue(meta.id),
    }));
  }

  getEngineStatus(): Record<string, { configured: boolean; status: string }> {
    const result: Record<string, { configured: boolean; status: string }> = {};
    for (const meta of ENGINE_META) {
      result[meta.id] = {
        configured: this.isConfigured(meta.id),
        status: this.getEngineStatusValue(meta.id),
      };
    }
    return result;
  }

  async generateVideo(engine: string, prompt: string, options: VideoGenOptions = {}): Promise<VideoGenJob> {
    const meta = ENGINE_META.find((m) => m.id === engine);
    if (!meta) {
      throw new Error(`Unknown engine: ${engine}. Available engines: ${ENGINE_META.map((m) => m.id).join(', ')}`);
    }

    if (COMING_SOON_ENGINES.has(engine)) {
      throw new Error(`${meta.name} is coming soon and not yet available for video generation`);
    }

    if (!this.isConfigured(engine)) {
      const envVar = ENGINE_ENV_MAP[engine];
      throw new Error(`${meta.name} requires the ${envVar} environment variable to be configured`);
    }

    const duration = Math.min(options.duration ?? 5, meta.maxDuration);

    switch (engine) {
      case 'runway-gen3':
        return this.generateRunway(prompt, { ...options, duration });
      case 'luma-dream-machine':
        return this.generateLuma(prompt, { ...options, duration });
      case 'pika-labs':
        return this.generatePika(prompt, { ...options, duration });
      case 'synthesia':
        return this.generateSynthesia(prompt, { ...options, duration });
      default:
        throw new Error(`Engine ${engine} is not yet implemented`);
    }
  }

  async checkJobStatus(engine: string, jobId: string): Promise<VideoGenJob> {
    const localJob = this.activeJobs.get(jobId);

    if (localJob && (localJob.status === 'completed' || localJob.status === 'failed')) {
      return localJob;
    }

    try {
      switch (engine) {
        case 'runway-gen3':
          return this.pollRunway(jobId);
        case 'luma-dream-machine':
          return this.pollLuma(jobId);
        case 'pika-labs': {
          if (localJob) return localJob;
          throw new Error('Pika jobs return results synchronously; no polling required');
        }
        case 'synthesia':
          return this.pollSynthesia(jobId);
        default:
          if (localJob) return localJob;
          throw new Error(`No active job found with id ${jobId}`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error checking job status';
      if (localJob) {
        localJob.status = 'failed';
        localJob.error = errorMessage;
        return localJob;
      }
      throw new Error(`Failed to check job status for ${jobId}: ${errorMessage}`);
    }
  }

  private createJob(engine: string, prompt: string, externalId: string, estimatedSeconds?: number): VideoGenJob {
    const job: VideoGenJob = {
      id: externalId,
      engine,
      status: 'queued',
      prompt,
      createdAt: Date.now(),
      estimatedSeconds,
    };
    this.activeJobs.set(job.id, job);
    return job;
  }

  private async generateRunway(prompt: string, options: VideoGenOptions): Promise<VideoGenJob> {
    const apiKey = process.env.RUNWAY_API_KEY!;
    const url = 'https://api.dev.runwayml.com/v1/text_to_video';

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          prompt,
          duration: options.duration ?? 5,
          aspect_ratio: options.aspectRatio ?? '16:9',
          style: options.style,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Runway API error (${response.status}): ${errorBody}`);
      }

      const data: any = await response.json();
      const jobId = data.id || data.uuid || `runway-${Date.now()}`;
      const job = this.createJob('runway-gen3', prompt, jobId, (options.duration ?? 5) * 10);
      job.status = 'processing';
      return job;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      throw new Error(`Runway Gen-3 generation failed: ${errorMessage}`);
    }
  }

  private async pollRunway(jobId: string): Promise<VideoGenJob> {
    const apiKey = process.env.RUNWAY_API_KEY!;
    const url = `https://api.dev.runwayml.com/v1/tasks/${jobId}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Runway poll error (${response.status}): ${errorBody}`);
      }

      const data: any = await response.json();
      const job = this.activeJobs.get(jobId) || this.createJob('runway-gen3', '', jobId);

      if (data.status === 'SUCCEEDED' || data.status === 'completed') {
        job.status = 'completed';
        job.videoUrl = data.output?.[0] || data.artifacts?.[0]?.url || data.video_url;
        job.thumbnailUrl = data.thumbnail_url;
      } else if (data.status === 'FAILED' || data.status === 'failed') {
        job.status = 'failed';
        job.error = data.error || data.failure || 'Generation failed';
      } else {
        job.status = 'processing';
      }

      return job;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      throw new Error(`Runway status poll failed: ${errorMessage}`);
    }
  }

  private async generateLuma(prompt: string, options: VideoGenOptions): Promise<VideoGenJob> {
    const apiKey = process.env.LUMA_API_KEY!;
    const url = 'https://api.lumalabs.ai/dream-machine/v1/generations';

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          prompt,
          aspect_ratio: options.aspectRatio ?? '16:9',
          loop: false,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Luma API error (${response.status}): ${errorBody}`);
      }

      const data: any = await response.json();
      const jobId = data.id || `luma-${Date.now()}`;
      const job = this.createJob('luma-dream-machine', prompt, jobId, 60);
      job.status = 'processing';
      return job;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      throw new Error(`Luma Dream Machine generation failed: ${errorMessage}`);
    }
  }

  private async pollLuma(jobId: string): Promise<VideoGenJob> {
    const apiKey = process.env.LUMA_API_KEY!;
    const url = `https://api.lumalabs.ai/dream-machine/v1/generations/${jobId}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Luma poll error (${response.status}): ${errorBody}`);
      }

      const data: any = await response.json();
      const job = this.activeJobs.get(jobId) || this.createJob('luma-dream-machine', '', jobId);

      if (data.state === 'completed') {
        job.status = 'completed';
        job.videoUrl = data.assets?.video || data.video?.url;
        job.thumbnailUrl = data.assets?.thumbnail || data.thumbnail?.url;
      } else if (data.state === 'failed') {
        job.status = 'failed';
        job.error = data.failure_reason || 'Generation failed';
      } else {
        job.status = 'processing';
      }

      return job;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      throw new Error(`Luma status poll failed: ${errorMessage}`);
    }
  }

  private async generatePika(prompt: string, options: VideoGenOptions): Promise<VideoGenJob> {
    const apiKey = process.env.FAL_API_KEY!;
    const url = 'https://fal.run/fal-ai/pika/v2.2/text-to-video';

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Key ${apiKey}`,
        },
        body: JSON.stringify({
          prompt,
          resolution: options.resolution ?? '1080p',
          aspect_ratio: options.aspectRatio ?? '16:9',
          duration: options.duration ?? 5,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Pika/fal.ai API error (${response.status}): ${errorBody}`);
      }

      const data: any = await response.json();
      const jobId = data.request_id || `pika-${Date.now()}`;
      const job = this.createJob('pika-labs', prompt, jobId);

      if (data.video?.url || data.output?.video?.url) {
        job.status = 'completed';
        job.videoUrl = data.video?.url || data.output?.video?.url;
        job.thumbnailUrl = data.thumbnail?.url || data.output?.thumbnail?.url;
      } else {
        job.status = 'processing';
        job.estimatedSeconds = 30;
      }

      return job;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      throw new Error(`Pika Labs generation failed: ${errorMessage}`);
    }
  }

  private async generateSynthesia(prompt: string, options: VideoGenOptions): Promise<VideoGenJob> {
    const apiKey = process.env.SYNTHESIA_API_KEY!;
    const url = 'https://api.synthesia.io/v2/videos';

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': apiKey,
        },
        body: JSON.stringify({
          title: prompt.substring(0, 100),
          description: prompt,
          input: [
            {
              scriptText: prompt,
              avatar: 'anna_costume1_cameraA',
            },
          ],
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Synthesia API error (${response.status}): ${errorBody}`);
      }

      const data: any = await response.json();
      const jobId = data.id || `synthesia-${Date.now()}`;
      const job = this.createJob('synthesia', prompt, jobId, 120);
      job.status = 'processing';
      return job;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      throw new Error(`Synthesia generation failed: ${errorMessage}`);
    }
  }

  private async pollSynthesia(jobId: string): Promise<VideoGenJob> {
    const apiKey = process.env.SYNTHESIA_API_KEY!;
    const url = `https://api.synthesia.io/v2/videos/${jobId}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': apiKey,
        },
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Synthesia poll error (${response.status}): ${errorBody}`);
      }

      const data: any = await response.json();
      const job = this.activeJobs.get(jobId) || this.createJob('synthesia', '', jobId);

      if (data.status === 'complete') {
        job.status = 'completed';
        job.videoUrl = data.download || data.download_url;
        job.thumbnailUrl = data.thumbnail;
      } else if (data.status === 'failed') {
        job.status = 'failed';
        job.error = data.error || data.errorMessage || 'Generation failed';
      } else {
        job.status = 'processing';
      }

      return job;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      throw new Error(`Synthesia status poll failed: ${errorMessage}`);
    }
  }
}

export const videoGenerationService = new VideoGenerationService();
