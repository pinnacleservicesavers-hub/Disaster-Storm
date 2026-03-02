import { execSync, exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';

export interface VideoGenOptions {
  duration?: number;
  aspectRatio?: string;
  resolution?: string;
  style?: string;
  industry?: string;
  enableVoiceover?: boolean;
  voice?: string;
  uploadedPhotoPath?: string;
  textOverlay?: string;
  multiFormat?: boolean;
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
  narrationScript?: string;
  formats?: {
    youtube?: string;
    reels?: string;
    facebook?: string;
  };
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
    id: 'cinematic-ai',
    name: 'Cinematic AI',
    description: 'AI-generated motion video with scene composition, Ken Burns effects, transitions, and dynamic text overlays',
    features: ['AI Scene Generation', 'Ken Burns Motion', 'Smooth Transitions', 'Text Overlays', 'Multi-Scene Storyboard', 'HD Output'],
    bestFor: 'Contractor ads, marketing videos, social media content, demo reels',
    costPerSecond: '$0.02',
    maxDuration: 30,
  },
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
  'cinematic-ai': 'AI_INTEGRATIONS_OPENAI_API_KEY',
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
      case 'cinematic-ai':
        return this.generateCinematicAI(prompt, { ...options, duration });
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
        case 'cinematic-ai': {
          if (localJob) return localJob;
          throw new Error('Cinematic AI jobs are tracked locally');
        }
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

  private async generateCinematicAI(prompt: string, options: VideoGenOptions): Promise<VideoGenJob> {
    const jobId = `cinematic-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const job = this.createJob('cinematic-ai', prompt, jobId, 90);
    job.status = 'processing';

    this.runCinematicPipeline(job, prompt, options).catch((err) => {
      console.error('🎬 Cinematic AI pipeline error:', err);
      job.status = 'failed';
      job.error = err instanceof Error ? err.message : 'Pipeline failed';
    });

    return job;
  }

  private async runCinematicPipeline(job: VideoGenJob, prompt: string, options: VideoGenOptions): Promise<void> {
    const openai = new OpenAI({
      apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
      baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
    });

    const duration = Math.max(6, options.duration ?? 12);
    const numScenes = Math.max(3, Math.min(6, Math.ceil(duration / 3)));
    const sceneDuration = Math.max(2, duration / numScenes);
    const workDir = `/tmp/video-gen/${job.id}`;
    fs.mkdirSync(workDir, { recursive: true });

    try {
      console.log(`🎬 [${job.id}] Starting Cinematic AI pipeline: ${numScenes} scenes, ${duration}s total`);

      // Step 1: Generate narration script (for voiceover)
      let narrationScript = '';
      if (options.enableVoiceover !== false) {
        console.log(`🎙️ [${job.id}] Generating cinematic narration script...`);
        narrationScript = await this.generateVideoNarration(openai, prompt, options.industry);
        job.narrationScript = narrationScript;
        console.log(`🎙️ [${job.id}] Script: "${narrationScript.substring(0, 80)}..."`);
      }

      // Step 2: Generate ultra-cinematic scene prompts
      const scenePrompts = await this.generateScenePrompts(openai, prompt, numScenes, options.style, options.industry);
      console.log(`🎬 [${job.id}] Scene prompts generated: ${scenePrompts.length} scenes`);

      // Step 3: Generate AI scene images
      const imageFiles: string[] = [];

      // If user uploaded a brand photo, use it as the first scene
      if (options.uploadedPhotoPath && fs.existsSync(options.uploadedPhotoPath)) {
        console.log(`📸 [${job.id}] Including uploaded brand photo as scene 1`);
        imageFiles.push(options.uploadedPhotoPath);
      }

      for (let i = 0; i < scenePrompts.length; i++) {
        if (imageFiles.length >= numScenes) break;
        console.log(`🎬 [${job.id}] Generating scene ${i + 1}/${scenePrompts.length}...`);
        const imgPath = path.join(workDir, `scene_${i}.png`);
        const imgBuffer = await this.generateSceneImage(openai, scenePrompts[i]);
        fs.writeFileSync(imgPath, imgBuffer);
        imageFiles.push(imgPath);
      }

      // Step 4: Composite the main video
      console.log(`🎬 [${job.id}] Compositing ${imageFiles.length} scenes into video...`);
      const rawVideoPath = path.join(workDir, 'raw.mp4');
      await this.compositeVideoWithFFmpeg(imageFiles, rawVideoPath, sceneDuration, options);

      // Step 5: Generate ElevenLabs voiceover and mix in
      let finalVideoPath = rawVideoPath;
      if (options.enableVoiceover !== false && narrationScript) {
        console.log(`🎙️ [${job.id}] Generating ElevenLabs voiceover...`);
        const audioPath = path.join(workDir, 'voiceover.mp3');
        const voiceGenerated = await this.generateElevenLabsVoiceover(narrationScript, options.voice || 'deep-male', audioPath);
        if (voiceGenerated) {
          console.log(`🎙️ [${job.id}] Mixing voiceover into video...`);
          const audioVideoPath = path.join(workDir, 'with_audio.mp4');
          await this.mixAudioIntoVideo(rawVideoPath, audioPath, audioVideoPath);
          finalVideoPath = audioVideoPath;
        }
      }

      // Step 6: Copy main video to public dir
      const publicDir = path.join(process.cwd(), 'public', 'generated-videos');
      fs.mkdirSync(publicDir, { recursive: true });
      const publicFile = `${job.id}.mp4`;
      const publicPath = path.join(publicDir, publicFile);
      fs.copyFileSync(finalVideoPath, publicPath);
      job.videoUrl = `/generated-videos/${publicFile}`;

      // Step 7: Generate thumbnail
      job.thumbnailUrl = `/generated-videos/${job.id}_thumb.jpg`;
      try {
        execSync(`ffmpeg -y -i "${publicPath}" -ss 1 -vframes 1 -vf scale=320:-1 "${path.join(publicDir, `${job.id}_thumb.jpg`)}" 2>/dev/null`);
      } catch (e) {
        job.thumbnailUrl = undefined;
      }

      // Step 8: Render additional social formats (9:16 Reels, 1:1 Facebook)
      if (options.multiFormat !== false) {
        console.log(`📱 [${job.id}] Rendering social media formats...`);
        job.formats = await this.renderSocialFormats(finalVideoPath, publicDir, job.id);
        console.log(`📱 [${job.id}] Formats ready: ${Object.keys(job.formats).join(', ')}`);
      }

      job.status = 'completed';
      console.log(`🎬 [${job.id}] ✅ Hollywood cinematic video complete: ${job.videoUrl}`);

    } catch (err) {
      console.error(`🎬 [${job.id}] Pipeline failed:`, err);
      job.status = 'failed';
      job.error = err instanceof Error ? err.message : 'Cinematic AI pipeline failed';
    }
  }

  private async generateVideoNarration(openai: OpenAI, prompt: string, industry?: string): Promise<string> {
    const industryContext = industry ? `Industry: ${industry}. ` : '';
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You write Hollywood movie trailer narration scripts for contractor marketing videos. ${industryContext}
Write a POWERFUL, dramatic voiceover script (40-60 words max) in the style of a blockbuster movie trailer deep narrator.
Use short punchy sentences. Include a strong call to action at the end.
Examples of tone: "When the storm hits... only the strongest survive. [Company] is the force that rebuilds what nature destroys. Call now. Get protected."
Return ONLY the narration text, nothing else.`
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.9,
      });
      return response.choices[0]?.message?.content?.trim() || '';
    } catch (err) {
      console.error('Narration generation failed:', err);
      return `When it matters most... professionals answer the call. Serving your community with excellence, speed, and guaranteed results. Call today. Get it done right.`;
    }
  }

  private async generateElevenLabsVoiceover(script: string, voicePreset: string, outputPath: string): Promise<boolean> {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      console.log('🎙️ ElevenLabs API key not found, skipping voiceover');
      return false;
    }

    // Map voice presets to ElevenLabs voice IDs
    const voiceMap: Record<string, string> = {
      'deep-male': 'onwK4e9ZLuTAKqWW03F9',     // Daniel - deep authoritative
      'dramatic': 'VR6AewLTigWG4xSOukaG',        // Arnold - strong dramatic
      'professional': 'pNInz6obpgDQGcFmaJgB',    // Adam - professional
      'female': 'EXAVITQu4vr4xnSDxMaL',          // Bella - female
      'energetic': 'yoZ06aMxZJJ28mfd3POQ',        // Sam - energetic
    };
    const voiceId = voiceMap[voicePreset] || voiceMap['deep-male'];

    try {
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
          'Accept': 'audio/mpeg',
        },
        body: JSON.stringify({
          text: script,
          model_id: 'eleven_turbo_v2_5',
          voice_settings: {
            stability: 0.4,
            similarity_boost: 0.8,
            style: 0.6,
            use_speaker_boost: true,
          },
        }),
      });

      if (!response.ok) {
        console.error(`🎙️ ElevenLabs API error: ${response.status} ${response.statusText}`);
        return false;
      }

      const audioBuffer = await response.arrayBuffer();
      fs.writeFileSync(outputPath, Buffer.from(audioBuffer));
      console.log(`🎙️ Voiceover saved: ${outputPath} (${Math.round(audioBuffer.byteLength / 1024)}KB)`);
      return true;
    } catch (err) {
      console.error('🎙️ ElevenLabs voiceover failed:', err);
      return false;
    }
  }

  private async mixAudioIntoVideo(videoPath: string, audioPath: string, outputPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const cmd = `ffmpeg -y -i "${videoPath}" -i "${audioPath}" -c:v copy -c:a aac -map 0:v:0 -map 1:a:0 -shortest "${outputPath}" 2>&1`;
      exec(cmd, { timeout: 60000 }, (error) => {
        if (error) {
          console.error('Audio mix failed, continuing without audio:', error.message);
          fs.copyFileSync(videoPath, outputPath);
        }
        resolve();
      });
    });
  }

  private async renderSocialFormats(inputPath: string, publicDir: string, jobId: string): Promise<{ youtube?: string; reels?: string; facebook?: string }> {
    const formats: { youtube?: string; reels?: string; facebook?: string } = {};

    // YouTube is the default 16:9 output (already generated as main video)
    formats.youtube = `/generated-videos/${jobId}.mp4`;

    // Instagram Reels 9:16 vertical
    await new Promise<void>((resolve) => {
      const reelsPath = path.join(publicDir, `${jobId}_reels.mp4`);
      const cmd = `ffmpeg -y -i "${inputPath}" -vf "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1" -c:v libx264 -preset ultrafast -crf 25 -c:a copy "${reelsPath}" 2>&1`;
      exec(cmd, { timeout: 60000 }, (error) => {
        if (!error) formats.reels = `/generated-videos/${jobId}_reels.mp4`;
        resolve();
      });
    });

    // Facebook 1:1 square
    await new Promise<void>((resolve) => {
      const squarePath = path.join(publicDir, `${jobId}_square.mp4`);
      const cmd = `ffmpeg -y -i "${inputPath}" -vf "scale=1080:1080:force_original_aspect_ratio=increase,crop=1080:1080,setsar=1" -c:v libx264 -preset ultrafast -crf 25 -c:a copy "${squarePath}" 2>&1`;
      exec(cmd, { timeout: 60000 }, (error) => {
        if (!error) formats.facebook = `/generated-videos/${jobId}_square.mp4`;
        resolve();
      });
    });

    return formats;
  }

  private async generateScenePrompts(openai: OpenAI, userPrompt: string, numScenes: number, style?: string, industry?: string): Promise<string[]> {
    const industryTone: Record<string, string> = {
      'roofing': 'Roofing crew on steep roof at golden hour, dramatic skyline, safety harnesses, shingles flying, heroic silhouettes against clouds',
      'tree-service': 'Arborist crew with chainsaw cutting massive oak tree, wood chips exploding, crane lifting enormous limb, neon safety gear, dramatic sky',
      'hvac': 'HVAC technicians installing sleek new system, modern equipment gleaming, comfortable family in background, technical precision',
      'pressure-washing': 'Pressure washer revealing pristine clean surface, satisfying debris blast in slow motion, dramatic transformation, water droplets catching light',
      'landscaping': 'Landscaping crew transforming overgrown yard into paradise, drone perspective, vibrant green grass, sculpted hedges, satisfied homeowner',
      'painting': 'Painters applying rich color to elegant home exterior, scaffolding, paint cascading, before and after transformation, warm light',
      'plumbing': 'Expert plumber fixing complex pipe system, sparks of welding, polished copper pipes, clean workspace, skilled hands working precisely',
      'electrical': 'Master electrician installing smart home panel, glowing circuits, modern technology, crisp clean wiring, proud professional',
      'junk-removal': 'Powerful crew loading massive truck with debris, muscle and teamwork, dramatic before/after garage transformation, satisfied homeowner',
      'general-contractor': 'Master builder overseeing epic renovation project, blueprints, hard hats, construction site at sunset, massive transformation underway',
      'storm-restoration': 'Storm damage restoration crew working urgently, debris clearing, emergency power equipment, heroic workers against dramatic stormy sky',
    };

    const styleNote = style ? `Visual style: ${style}. ` : '';
    const industryNote = industry && industryTone[industry] ? `Industry tone example: "${industryTone[industry]}". ` : '';
    const cinematicSuffix = 'Ultra cinematic 4K photorealistic, dramatic lighting, RED Komodo camera look, shallow depth of field, anamorphic lens flare, IMAX quality, Dolby atmosphere, Oscar-winning cinematography, high dynamic range.';

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a Hollywood movie trailer cinematographer creating storyboard prompts for AI image generation. Break the concept into ${numScenes} ULTRA-CINEMATIC scene descriptions.

RULES:
- Every scene MUST show REAL PEOPLE IN ACTION - workers, crews, customers actively doing something
- Use movie-trailer cinematic language: dramatic angles, golden hour, slow motion implied, hero shots
- Include specific camera directions: extreme close-up, wide establishing shot, Dutch angle, over-shoulder, drone aerial
- Make it feel like a blockbuster movie, not a stock photo
- ${styleNote}${industryNote}
- Append to every scene: "${cinematicSuffix}"

Return ONLY a JSON array of ${numScenes} strings. Each string is 60-90 words.`
          },
          {
            role: 'user',
            content: userPrompt
          }
        ],
        temperature: 0.85,
      });

      const content = response.choices[0]?.message?.content || '';
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const scenes = JSON.parse(jsonMatch[0]);
        if (Array.isArray(scenes) && scenes.length >= 2) {
          return scenes.slice(0, numScenes).map((s: any) => String(s));
        }
      }
    } catch (err) {
      console.error('Scene prompt generation failed, using fallback:', err);
    }

    const base = `${userPrompt}, ${cinematicSuffix}`;
    const fallbackScenes = [
      `Wide establishing hero shot: professional crew arriving on scene, ${base}, golden hour silhouettes, determination on their faces, branded vehicles pulling up dramatically`,
      `Extreme close-up of expert hands performing skilled work, ${base}, shallow depth of field bokeh, sweat and precision, tools gleaming in dramatic sidelight`,
      `Over-shoulder shot of crew lead surveying massive project scope, ${base}, Dutch angle camera, team working furiously in background, epic scale visible`,
      `Ground-level dramatic angle: worker in foreground, project transformation behind, ${base}, debris or materials in slow-motion implied, heroic framing`,
      `Satisfied customer shaking hands with crew chief, ${base}, warm afternoon light, genuine emotion, completed transformation visible in background`,
      `Aerial drone pullback revealing completed stunning transformation, ${base}, crew visible below celebrating, neighborhood impressed, sun hitting perfect angles`,
    ];
    return fallbackScenes.slice(0, numScenes);
  }

  private async generateSceneImage(openai: OpenAI, scenePrompt: string): Promise<Buffer> {
    const response = await openai.images.generate({
      model: 'gpt-image-1',
      prompt: scenePrompt,
      size: '1536x1024',
      quality: 'high',
    });

    const base64 = response.data[0]?.b64_json ?? '';
    if (!base64) throw new Error('No image data returned from DALL-E');
    return Buffer.from(base64, 'base64');
  }

  private async compositeVideoWithFFmpeg(
    imageFiles: string[],
    outputPath: string,
    sceneDuration: number,
    options: VideoGenOptions
  ): Promise<void> {
    const width = options.aspectRatio === '9:16' ? 1080 : 1920;
    const height = options.aspectRatio === '9:16' ? 1920 : 1080;
    const fps = 24;
    const transitionDur = 0.5;

    const filterParts: string[] = [];
    const inputs = imageFiles.map((f) => `-loop 1 -t ${sceneDuration} -i "${f}"`).join(' ');

    for (let i = 0; i < imageFiles.length; i++) {
      filterParts.push(
        `[${i}:v]scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=${fps}[v${i}]`
      );
    }

    if (imageFiles.length === 1) {
      filterParts.push(`[v0]format=yuv420p[outv]`);
    } else {
      const transitions = ['fade', 'fadeblack', 'slideleft', 'slideright', 'wiperight', 'circlecrop'];
      let currentStream = 'v0';
      const effectiveDuration = Math.max(sceneDuration, transitionDur + 0.5);
      for (let i = 1; i < imageFiles.length; i++) {
        const outLabel = i === imageFiles.length - 1 ? 'merged' : `xf${i}`;
        const offset = Math.max(0.5, i * (effectiveDuration - transitionDur) - transitionDur);
        const transition = transitions[i % transitions.length];
        filterParts.push(
          `[${currentStream}][v${i}]xfade=transition=${transition}:duration=${transitionDur}:offset=${offset.toFixed(2)}[${outLabel}]`
        );
        currentStream = outLabel;
      }
      filterParts.push(`[merged]format=yuv420p[outv]`);
    }

    const filterComplex = filterParts.join(';');
    const cmd = `ffmpeg -y ${inputs} -filter_complex "${filterComplex}" -map "[outv]" -c:v libx264 -preset ultrafast -crf 23 -movflags +faststart "${outputPath}" 2>&1`;

    console.log(`🎬 Running ffmpeg composite (${imageFiles.length} scenes, ${sceneDuration}s each)...`);

    return new Promise((resolve, reject) => {
      exec(cmd, { maxBuffer: 50 * 1024 * 1024, timeout: 120000 }, (error, stdout, stderr) => {
        if (error) {
          console.error('ffmpeg error:', error.message);
          console.error('ffmpeg output:', stdout);
          reject(new Error(`FFmpeg compositing failed: ${error.message}`));
        } else {
          console.log('🎬 FFmpeg compositing complete');
          resolve();
        }
      });
    });
  }
}

export const videoGenerationService = new VideoGenerationService();
