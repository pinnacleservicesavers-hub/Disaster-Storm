import { exec } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface ProcessedMedia {
  frames: string[];
  audioAnalysis: {
    duration: number;
    hasAudio: boolean;
    audioDescription: string;
    dominantFrequencies: string[];
    noiseCharacteristics: string[];
    rpmEstimate?: string;
  };
  metadata: {
    width: number;
    height: number;
    duration: number;
    fps: number;
    codec: string;
  };
}

const TEMP_DIR = '/tmp/auto-repair-media';

async function ensureTempDir(): Promise<string> {
  const sessionDir = path.join(TEMP_DIR, `session_${Date.now()}_${Math.random().toString(36).slice(2)}`);
  await fs.mkdir(sessionDir, { recursive: true });
  return sessionDir;
}

async function cleanupDir(dir: string): Promise<void> {
  try {
    await fs.rm(dir, { recursive: true, force: true });
  } catch {}
}

export async function processVideoBuffer(videoBuffer: Buffer, mimeType: string): Promise<ProcessedMedia> {
  const workDir = await ensureTempDir();
  const ext = mimeType.includes('mp4') ? '.mp4' : mimeType.includes('webm') ? '.webm' : mimeType.includes('quicktime') ? '.mov' : '.mp4';
  const videoPath = path.join(workDir, `input${ext}`);

  try {
    await fs.writeFile(videoPath, videoBuffer);

    const [metadata, frames, audioAnalysis] = await Promise.all([
      extractMetadata(videoPath),
      extractFrames(videoPath, workDir),
      analyzeAudio(videoPath, workDir),
    ]);

    return { frames, audioAnalysis, metadata };
  } finally {
    cleanupDir(workDir);
  }
}

async function extractMetadata(videoPath: string): Promise<ProcessedMedia['metadata']> {
  try {
    const { stdout } = await execAsync(
      `ffprobe -v quiet -print_format json -show_format -show_streams "${videoPath}"`,
      { timeout: 15000 }
    );
    const probe = JSON.parse(stdout);
    const videoStream = probe.streams?.find((s: any) => s.codec_type === 'video');
    const format = probe.format || {};

    return {
      width: videoStream?.width || 0,
      height: videoStream?.height || 0,
      duration: parseFloat(format.duration || '0'),
      fps: videoStream?.r_frame_rate ? eval(videoStream.r_frame_rate) : 30,
      codec: videoStream?.codec_name || 'unknown',
    };
  } catch {
    return { width: 0, height: 0, duration: 0, fps: 30, codec: 'unknown' };
  }
}

async function extractFrames(videoPath: string, workDir: string): Promise<string[]> {
  try {
    const { stdout: durationOut } = await execAsync(
      `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${videoPath}"`,
      { timeout: 10000 }
    );
    const duration = parseFloat(durationOut.trim()) || 10;
    const frameCount = Math.min(6, Math.max(2, Math.ceil(duration / 3)));

    const framePromises = [];
    for (let i = 0; i < frameCount; i++) {
      const timestamp = (i / frameCount) * duration;
      const outputPath = path.join(workDir, `frame_${i}.jpg`);
      framePromises.push(
        execAsync(
          `ffmpeg -y -ss ${timestamp.toFixed(2)} -i "${videoPath}" -vframes 1 -q:v 3 -vf "scale='min(1024,iw)':'min(768,ih)':force_original_aspect_ratio=decrease" "${outputPath}"`,
          { timeout: 15000 }
        ).then(async () => {
          const buffer = await fs.readFile(outputPath);
          return buffer.toString('base64');
        }).catch(() => null)
      );
    }

    const results = await Promise.all(framePromises);
    return results.filter((f): f is string => f !== null);
  } catch (error) {
    console.error('Frame extraction error:', error);
    return [];
  }
}

async function analyzeAudio(videoPath: string, workDir: string): Promise<ProcessedMedia['audioAnalysis']> {
  const wavPath = path.join(workDir, 'audio.wav');
  const spectrogramPath = path.join(workDir, 'spectrogram.png');

  try {
    const { stdout: hasAudioCheck } = await execAsync(
      `ffprobe -v error -select_streams a:0 -show_entries stream=codec_type -of default=noprint_wrappers=1:nokey=1 "${videoPath}"`,
      { timeout: 10000 }
    );

    const hasAudio = hasAudioCheck.trim() === 'audio';
    if (!hasAudio) {
      return {
        duration: 0,
        hasAudio: false,
        audioDescription: 'No audio track detected in video',
        dominantFrequencies: [],
        noiseCharacteristics: [],
      };
    }

    await execAsync(
      `ffmpeg -y -i "${videoPath}" -vn -acodec pcm_s16le -ar 22050 -ac 1 "${wavPath}"`,
      { timeout: 20000 }
    );

    const [volumeAnalysis, durationResult] = await Promise.all([
      execAsync(
        `ffmpeg -i "${wavPath}" -af "volumedetect" -f null /dev/null 2>&1 | grep -E "mean_volume|max_volume|peak"`,
        { timeout: 10000 }
      ).catch(() => ({ stdout: '' })),
      execAsync(
        `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${wavPath}"`,
        { timeout: 5000 }
      ).catch(() => ({ stdout: '0' })),
    ]);

    const duration = parseFloat(durationResult.stdout.trim()) || 0;

    const meanMatch = volumeAnalysis.stdout.match(/mean_volume:\s*([-\d.]+)/);
    const maxMatch = volumeAnalysis.stdout.match(/max_volume:\s*([-\d.]+)/);
    const meanVolume = meanMatch ? parseFloat(meanMatch[1]) : -30;
    const maxVolume = maxMatch ? parseFloat(maxMatch[1]) : -10;

    let frequencyAnalysis: string[] = [];
    try {
      const { stdout: freqData } = await execAsync(
        `ffmpeg -i "${wavPath}" -af "astats=metadata=1:reset=1,ametadata=print:key=lavfi.astats.Overall.RMS_level" -f null /dev/null 2>&1 | grep "RMS_level" | head -20`,
        { timeout: 15000 }
      );
      if (freqData.trim()) {
        frequencyAnalysis.push('RMS audio levels detected across recording');
      }
    } catch {}

    const noiseCharacteristics: string[] = [];
    if (meanVolume > -20) noiseCharacteristics.push('loud_continuous_noise');
    if (meanVolume < -40) noiseCharacteristics.push('quiet_ambient');
    if (maxVolume - meanVolume > 20) noiseCharacteristics.push('intermittent_sharp_sounds');
    if (maxVolume - meanVolume < 5) noiseCharacteristics.push('steady_constant_tone');

    const audioDescription = buildAudioDescription(meanVolume, maxVolume, duration, noiseCharacteristics);

    return {
      duration,
      hasAudio: true,
      audioDescription,
      dominantFrequencies: frequencyAnalysis,
      noiseCharacteristics,
    };
  } catch (error) {
    console.error('Audio analysis error:', error);
    return {
      duration: 0,
      hasAudio: false,
      audioDescription: 'Could not analyze audio track',
      dominantFrequencies: [],
      noiseCharacteristics: [],
    };
  }
}

function buildAudioDescription(
  meanVolume: number,
  maxVolume: number,
  duration: number,
  characteristics: string[]
): string {
  const parts: string[] = [];
  parts.push(`Audio recording is ${duration.toFixed(1)} seconds long.`);

  if (meanVolume > -15) {
    parts.push('The recording has loud, prominent audio - the noise source is very audible.');
  } else if (meanVolume > -25) {
    parts.push('The recording has moderate audio levels - sounds are clearly audible.');
  } else if (meanVolume > -35) {
    parts.push('The recording has quiet audio - sounds are faint but present.');
  } else {
    parts.push('The recording audio is very quiet - may be mostly ambient noise.');
  }

  if (characteristics.includes('intermittent_sharp_sounds')) {
    parts.push('There are intermittent sharp/loud sounds detected - could indicate knocking, clicking, or impact noises.');
  }
  if (characteristics.includes('steady_constant_tone')) {
    parts.push('The audio has a steady, constant tone - could indicate a whine, hum, or continuous mechanical noise.');
  }
  if (characteristics.includes('loud_continuous_noise')) {
    parts.push('Continuous loud noise detected - suggests an actively running engine or loud mechanical issue.');
  }

  const dynamicRange = maxVolume - meanVolume;
  if (dynamicRange > 15) {
    parts.push('High dynamic range suggests varying noise levels - typical of rattling, intermittent knocking, or fluctuating RPMs.');
  } else if (dynamicRange < 5) {
    parts.push('Low dynamic range suggests consistent noise level - typical of belt squeal, bearing whine, or exhaust leak.');
  }

  return parts.join(' ');
}

export async function processBase64Video(base64Data: string, mimeType: string = 'video/mp4'): Promise<ProcessedMedia> {
  const buffer = Buffer.from(base64Data, 'base64');
  return processVideoBuffer(buffer, mimeType);
}
