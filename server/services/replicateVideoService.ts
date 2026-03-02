import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

export interface MotionProfile {
  id: string;
  name: string;
  industry: string;
  camera: string;
  wind: string;
  lighting: string;
  atmosphere: string;
  motion: string;
  elements: string[];
  motionBucketId: number;
  description: string;
}

export interface LiveActionJob {
  id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  imageUrl?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  motionProfile: string;
  industry: string;
  error?: string;
  createdAt: number;
  replicatePredictionId?: string;
  estimatedSeconds: number;
}

// Industry-specific cinematic motion profiles
export const MOTION_PROFILES: MotionProfile[] = [
  {
    id: 'storm-recovery',
    name: 'Storm Recovery',
    industry: 'storm-restoration',
    camera: 'slow cinematic dolly forward with slight upward tilt',
    wind: 'strong gusts bending trees, debris drifting',
    lighting: 'dramatic storm break, sun piercing through dark clouds',
    atmosphere: 'volumetric rain mist, emergency lighting, dust particles',
    motion: 'workers moving urgently, equipment vibrating, flags whipping',
    elements: ['dark storm clouds moving fast', 'emergency vehicles lights flashing', 'debris clearing crew in motion'],
    motionBucketId: 127,
    description: 'Storm clouds parting, heroic crew in action, debris flying'
  },
  {
    id: 'roofing-hero',
    name: 'Roofing Hero Shot',
    industry: 'roofing',
    camera: 'dramatic drone rise from ground level to rooftop height',
    wind: 'gentle breeze, workers\' shirts rippling',
    lighting: 'golden hour sunset, warm backlight silhouetting crew',
    atmosphere: 'clean blue sky, wisps of cloud, warm golden atmosphere',
    motion: 'crew working steadily, shingles being placed, hammer swings',
    elements: ['sun rays breaking over roofline', 'crew silhouettes at golden hour', 'neighborhood visible below'],
    motionBucketId: 90,
    description: 'Drone rises to reveal roofing crew at golden hour'
  },
  {
    id: 'tree-service-action',
    name: 'Tree Service Action',
    industry: 'tree-service',
    camera: 'Dutch angle rotating around massive tree, crane visible',
    wind: 'heavy branch sway, leaves cascading down',
    lighting: 'dappled light through canopy, dramatic shadows',
    atmosphere: 'wood chips dust cloud, sawdust particles in light',
    motion: 'chainsaw in action, crane boom moving, crew coordinating',
    elements: ['chainsaw spark burst', 'massive limb being lifted by crane', 'wood chips flying in slow motion'],
    motionBucketId: 127,
    description: 'Chainsaw sparks, crane lift, debris flying in slow motion'
  },
  {
    id: 'pressure-wash-reveal',
    name: 'Pressure Wash Reveal',
    industry: 'pressure-washing',
    camera: 'slow push forward tracking spray pattern left to right',
    wind: 'mist drift, water droplets catching sunlight',
    lighting: 'bright midday sun, water droplets creating prismatic light',
    atmosphere: 'steam mist rising, soap suds drifting, satisfying clean reveal',
    motion: 'pressure washer wand sweeping, dramatic clean line revealed',
    elements: ['water jet in slow motion', 'grime transforming to clean surface', 'rainbow in mist'],
    motionBucketId: 80,
    description: 'Satisfying slow-motion pressure wash reveal with rainbow mist'
  },
  {
    id: 'mechanic-garage',
    name: 'Mechanic Shop Cinematic',
    industry: 'mechanic',
    camera: 'low angle dolly alongside vehicle, sparks visible',
    wind: 'garage air movement, dust particles floating',
    lighting: 'dramatic garage spotlights, tool reflections, engine bay glow',
    atmosphere: 'metal shop atmosphere, oil sheen on concrete, steam rising',
    motion: 'mechanic working under hood, tools in motion, sparks flying',
    elements: ['spark bursts from grinder', 'chrome tools gleaming', 'engine bay illuminated'],
    motionBucketId: 110,
    description: 'Spark bursts, chrome gleaming, expert hands at work'
  },
  {
    id: 'landscaping-reveal',
    name: 'Landscaping Transformation',
    industry: 'landscaping',
    camera: 'aerial drone pullback from close detail to reveal full yard',
    wind: 'gentle breeze through manicured grass and flowers',
    lighting: 'late afternoon golden light, long shadows, vibrant colors',
    atmosphere: 'fresh cut grass smell suggested by morning mist, dew sparkle',
    motion: 'crew final cleanup, lawn mower passing, sprinkler arcing',
    elements: ['sprinkler rainbow', 'lush grass close-up with dew', 'drone pullback transformation reveal'],
    motionBucketId: 70,
    description: 'Drone pullback reveals stunning landscape transformation'
  },
  {
    id: 'hvac-professional',
    name: 'HVAC Professional',
    industry: 'hvac',
    camera: 'clean tracking shot alongside technician working',
    wind: 'controlled air movement from vents, dust mote dance',
    lighting: 'modern home interior lighting, equipment display illuminated',
    atmosphere: 'cool fresh air implied, modern home aesthetic, precision equipment',
    motion: 'technician making precise adjustments, gauges moving, vents opening',
    elements: ['digital display readings changing', 'cool air visualization', 'expert precision movement'],
    motionBucketId: 60,
    description: 'Precision HVAC work with modern equipment in motion'
  },
  {
    id: 'painting-reveal',
    name: 'Paint Transformation',
    industry: 'painting',
    camera: 'time-lapse style slow push showing color change on wall',
    wind: 'paint smell air drift, brush stroke flow',
    lighting: 'shifting natural light as day progresses, color richness',
    atmosphere: 'paint fumes suggestion, color saturation transformation',
    motion: 'brush strokes revealed, roller making dramatic sweeps, color change',
    elements: ['fresh paint gleam', 'color reveal dramatic contrast', 'brush stroke detail'],
    motionBucketId: 75,
    description: 'Dramatic color transformation with rich paint motion'
  },
  {
    id: 'junk-removal-power',
    name: 'Junk Removal Power',
    industry: 'junk-removal',
    camera: 'action cam style following crew movement through property',
    wind: 'dust from movement, debris particles',
    lighting: 'outdoor midday strength, strong shadows, before/after contrast',
    atmosphere: 'transformation energy, before cramped/dark, after open/bright',
    motion: 'crew carrying heavy items, truck being loaded, space clearing fast',
    elements: ['team coordination', 'dramatic garage clearance reveal', 'truck loading muscle'],
    motionBucketId: 120,
    description: 'High-energy junk removal with dramatic space transformation'
  },
  {
    id: 'general-contractor',
    name: 'Construction Epic',
    industry: 'general-contractor',
    camera: 'epic wide establishing shot with slow tilt down to crew',
    wind: 'construction dust, sawdust particles in light beams',
    lighting: 'construction lights and natural blend, dramatic shadows',
    atmosphere: 'construction site energy, progress visible, professional control',
    motion: 'workers coordinating, materials moving, progress happening',
    elements: ['construction progress time-lapse implied', 'blueprints reference', 'proud foreman surveying'],
    motionBucketId: 100,
    description: 'Epic construction site with coordinated crew in full motion'
  },
];

export class ReplicateVideoService {
  private activeJobs: Map<string, LiveActionJob> = new Map();

  isConfigured(): boolean {
    return !!process.env.REPLICATE_API_TOKEN;
  }

  getMotionProfiles(): MotionProfile[] {
    return MOTION_PROFILES;
  }

  getMotionProfile(id: string): MotionProfile | undefined {
    return MOTION_PROFILES.find(p => p.id === id);
  }

  async startLiveActionGeneration(
    imageBuffer: Buffer,
    imageMimeType: string,
    motionProfileId: string,
    jobId?: string
  ): Promise<LiveActionJob> {
    const id = jobId || `liveaction-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const profile = MOTION_PROFILES.find(p => p.id === motionProfileId) || MOTION_PROFILES[0];

    const job: LiveActionJob = {
      id,
      status: 'queued',
      motionProfile: motionProfileId,
      industry: profile.industry,
      createdAt: Date.now(),
      estimatedSeconds: 90,
    };

    this.activeJobs.set(id, job);

    if (!this.isConfigured()) {
      job.status = 'failed';
      job.error = 'REPLICATE_API_TOKEN not configured. Add it to your secrets to activate live-action generation.';
      return job;
    }

    // Run pipeline async
    this.runLiveActionPipeline(job, imageBuffer, imageMimeType, profile).catch(err => {
      console.error(`🎬 [${id}] Live-action pipeline error:`, err);
      job.status = 'failed';
      job.error = err instanceof Error ? err.message : 'Pipeline failed';
    });

    return job;
  }

  async checkJobStatus(jobId: string): Promise<LiveActionJob | null> {
    const job = this.activeJobs.get(jobId);
    if (!job) return null;

    // If we have a Replicate prediction ID and job is still processing, poll
    if (job.replicatePredictionId && job.status === 'processing') {
      await this.pollReplicateStatus(job);
    }

    return job;
  }

  private async runLiveActionPipeline(
    job: LiveActionJob,
    imageBuffer: Buffer,
    imageMimeType: string,
    profile: MotionProfile
  ): Promise<void> {
    job.status = 'processing';
    const workDir = `/tmp/liveaction/${job.id}`;
    fs.mkdirSync(workDir, { recursive: true });

    try {
      console.log(`🎬 [${job.id}] Starting live-action pipeline with profile: ${profile.name}`);

      // Step 1: Convert image to base64 data URL for Replicate
      const base64Image = imageBuffer.toString('base64');
      const dataUrl = `data:${imageMimeType};base64,${base64Image}`;

      // Step 2: Build the cinematic motion prompt
      const motionPrompt = this.buildCinematicPrompt(profile);
      console.log(`🎬 [${job.id}] Motion prompt: ${motionPrompt.substring(0, 100)}...`);

      // Step 3: Submit to Replicate SVD
      const predictionId = await this.submitToReplicate(dataUrl, profile, motionPrompt);
      job.replicatePredictionId = predictionId;
      console.log(`🎬 [${job.id}] Replicate prediction: ${predictionId}`);

      // Step 4: Poll for completion (max 5 minutes)
      const maxAttempts = 60;
      let attempts = 0;
      while (attempts < maxAttempts && job.status === 'processing') {
        await new Promise(r => setTimeout(r, 5000));
        await this.pollReplicateStatus(job);
        attempts++;
        console.log(`🎬 [${job.id}] Poll ${attempts}/${maxAttempts}: ${job.status}`);
      }

      if (job.status === 'processing') {
        job.status = 'failed';
        job.error = 'Generation timed out after 5 minutes';
      }

    } catch (err) {
      console.error(`🎬 [${job.id}] Pipeline error:`, err);
      job.status = 'failed';
      job.error = err instanceof Error ? err.message : 'Unknown pipeline error';
    }
  }

  private buildCinematicPrompt(profile: MotionProfile): string {
    return [
      `Ultra cinematic 4K live-action scene, ${profile.motion}.`,
      `Camera: ${profile.camera}.`,
      `Lighting: ${profile.lighting}.`,
      `Atmosphere: ${profile.atmosphere}.`,
      `Wind/movement: ${profile.wind}.`,
      `Visual elements: ${profile.elements.join(', ')}.`,
      'RED Komodo camera look, anamorphic lens flare, shallow depth of field, IMAX quality,',
      'Dolby Atmos ambiance, photorealistic, Oscar-winning cinematography, high dynamic range,',
      'motion blur on fast elements, temporal consistency, film grain, cinematic color science.',
    ].join(' ');
  }

  private async submitToReplicate(imageDataUrl: string, profile: MotionProfile, prompt: string): Promise<string> {
    const token = process.env.REPLICATE_API_TOKEN;

    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: '3f0457e4619daac51203dedb472816fd4af51f3149fa7a9e0b5ffcf1b8172438',
        input: {
          input_image: imageDataUrl,
          motion_bucket_id: profile.motionBucketId,
          fps: 24,
          cond_aug: 0.02,
          decoding_t: 14,
          video_length: '14_frames_with_svd',
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Replicate API error: ${response.status} - ${error}`);
    }

    const prediction = await response.json() as any;
    return prediction.id;
  }

  private async pollReplicateStatus(job: LiveActionJob): Promise<void> {
    if (!job.replicatePredictionId) return;

    try {
      const response = await fetch(`https://api.replicate.com/v1/predictions/${job.replicatePredictionId}`, {
        headers: { 'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}` },
      });

      if (!response.ok) return;

      const prediction = await response.json() as any;

      if (prediction.status === 'succeeded' && prediction.output) {
        // Download the video and save it locally
        const videoUrl = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output;
        await this.downloadAndSaveVideo(job, videoUrl);
      } else if (prediction.status === 'failed') {
        job.status = 'failed';
        job.error = prediction.error || 'Replicate generation failed';
      }
      // else still processing
    } catch (err) {
      console.error(`Poll error for ${job.id}:`, err);
    }
  }

  private async downloadAndSaveVideo(job: LiveActionJob, replicateVideoUrl: string): Promise<void> {
    try {
      const response = await fetch(replicateVideoUrl);
      if (!response.ok) throw new Error(`Failed to download video: ${response.status}`);

      const buffer = await response.arrayBuffer();
      const publicDir = path.join(process.cwd(), 'public', 'generated-videos');
      fs.mkdirSync(publicDir, { recursive: true });

      const filename = `${job.id}.mp4`;
      const filepath = path.join(publicDir, filename);
      fs.writeFileSync(filepath, Buffer.from(buffer));

      // Apply color grading
      const gradedPath = path.join(publicDir, `${job.id}_graded.mp4`);
      await this.applyColorGrade(filepath, gradedPath);

      job.videoUrl = `/generated-videos/${job.id}_graded.mp4`;
      job.thumbnailUrl = `/generated-videos/${job.id}_thumb.jpg`;

      try {
        execSync(`ffmpeg -y -i "${gradedPath}" -ss 0.5 -vframes 1 -vf scale=320:-1 "${path.join(publicDir, `${job.id}_thumb.jpg`)}" 2>/dev/null`);
      } catch {}

      job.status = 'completed';
      console.log(`✅ [${job.id}] Live-action video ready: ${job.videoUrl}`);
    } catch (err) {
      throw new Error(`Failed to save video: ${err instanceof Error ? err.message : 'Unknown'}`);
    }
  }

  private applyColorGrade(inputPath: string, outputPath: string): Promise<void> {
    return new Promise((resolve) => {
      const { exec } = require('child_process');
      const lutFilter = [
        "curves=r='0/0 0.3/0.28 0.7/0.76 1/1':g='0/0 0.3/0.3 0.7/0.72 1/0.95':b='0/0.06 0.3/0.36 0.7/0.65 1/0.85'",
        'eq=contrast=1.15:saturation=1.3:brightness=0.02',
      ].join(',');
      const cmd = `ffmpeg -y -i "${inputPath}" -vf "${lutFilter}" -c:v libx264 -preset ultrafast -crf 20 "${outputPath}" 2>/dev/null`;
      exec(cmd, { timeout: 60000 }, (err: any) => {
        if (err) fs.copyFileSync(inputPath, outputPath);
        resolve();
      });
    });
  }
}

export const replicateVideoService = new ReplicateVideoService();
